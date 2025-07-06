package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.common.support.utils.DigestUtils;
import com.chua.common.support.utils.FileUtils;
import com.chua.common.support.utils.StringUtils;
import com.chua.starter.monitor.pojo.request.*;
import com.chua.starter.monitor.pojo.response.*;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerFileUploadChunk;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerFileUploadRecord;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenServerFileUploadChunkMapper;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerFileChunkUploadService;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerFileUploadRecordService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * 服务器文件分片上传服务实现
 *
 * @author CH
 * @since 2025/01/06
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSysGenServerFileChunkUploadServiceImpl 
        extends ServiceImpl<MonitorSysGenServerFileUploadChunkMapper, MonitorSysGenServerFileUploadChunk>
        implements MonitorSysGenServerFileChunkUploadService {

    private final MonitorSysGenServerFileUploadRecordService recordService;

    @Value("${app.file.upload.chunk-storage-path:./data/chunks}")
    private String chunkStoragePath;

    @Value("${app.file.upload.file-storage-path:./data/files}")
    private String fileStoragePath;

    @Value("${app.file.upload.default-chunk-size:1048576}")
    private Long defaultChunkSize; // 1MB

    @Override
    public ReturnResult<FilePrepareResponse> prepareFileUpload(FilePrepareRequest request) {
        try {
            log.info("开始文件预处理: fileName={}, fileSize={}, fileMd5={}", 
                    request.getFileName(), request.getFileSize(), request.getFileMd5());

            // 1. 检查文件是否已存在（秒传检查）
            ReturnResult<DuplicateCheckResponse> duplicateResult = checkDuplicate(
                    createDuplicateCheckRequest(request));
            if (duplicateResult.isSuccess() && duplicateResult.getData().getExists()) {
                log.info("文件已存在，支持秒传: fileMd5={}", request.getFileMd5());
                return ReturnResult.ok(FilePrepareResponse.instantUpload(
                        request.getFileMd5(), duplicateResult.getData().getFilePath()));
            }

            // 2. 计算分片信息
            Long chunkSize = request.getChunkSize() != null ? request.getChunkSize() : defaultChunkSize;
            int totalChunks = (int) Math.ceil((double) request.getFileSize() / chunkSize);

            // 3. 生成上传会话ID
            String uploadSessionId = UUID.randomUUID().toString().replace("-", "");

            // 4. 检查已上传的分片
            List<Integer> uploadedChunks = getUploadedChunks(request.getFileMd5());

            log.info("文件预处理完成: uploadSessionId={}, totalChunks={}, uploadedChunks={}", 
                    uploadSessionId, totalChunks, uploadedChunks.size());

            return ReturnResult.ok(FilePrepareResponse.needUpload(
                    uploadSessionId, request.getFileMd5(), totalChunks, chunkSize, uploadedChunks));

        } catch (Exception e) {
            log.error("文件预处理失败: fileName={}, error={}", request.getFileName(), e.getMessage(), e);
            return ReturnResult.error("文件预处理失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ReturnResult<ChunkUploadResponse> uploadChunk(MultipartFile file, ChunkUploadRequest request) {
        try {
            log.info("开始分片上传: chunkIndex={}, totalChunks={}, fileMd5={}", 
                    request.getChunkIndex(), request.getTotalChunks(), request.getFileMd5());

            // 1. 验证分片文件
            if (file.isEmpty()) {
                return ReturnResult.error("分片文件不能为空");
            }

            if (file.getSize() != request.getChunkSize()) {
                log.warn("分片大小不匹配: expected={}, actual={}", request.getChunkSize(), file.getSize());
            }

            // 2. 验证分片MD5
            String actualChunkMd5 = calculateMd5(file.getInputStream());
            if (!actualChunkMd5.equals(request.getChunkMd5())) {
                log.error("分片MD5校验失败: expected={}, actual={}", request.getChunkMd5(), actualChunkMd5);
                return ReturnResult.error("分片MD5校验失败");
            }

            // 3. 检查分片是否已存在
            MonitorSysGenServerFileUploadChunk existingChunk = getOne(
                    new LambdaQueryWrapper<MonitorSysGenServerFileUploadChunk>()
                            .eq(MonitorSysGenServerFileUploadChunk::getFileMd5, request.getFileMd5())
                            .eq(MonitorSysGenServerFileUploadChunk::getChunkIndex, request.getChunkIndex())
                            .eq(MonitorSysGenServerFileUploadChunk::getUploadStatus, "COMPLETED"));

            if (existingChunk != null) {
                log.info("分片已存在: chunkIndex={}, chunkPath={}", 
                        request.getChunkIndex(), existingChunk.getChunkPath());
                return ReturnResult.ok(ChunkUploadResponse.success(
                        request.getChunkIndex(), request.getChunkMd5(), existingChunk.getChunkPath()));
            }

            // 4. 保存分片文件
            String chunkPath = saveChunkFile(file, request);

            // 5. 记录分片信息
            MonitorSysGenServerFileUploadChunk chunk = new MonitorSysGenServerFileUploadChunk();
            chunk.setUploadSessionId(request.getChunkId());
            chunk.setFileMd5(request.getFileMd5());
            chunk.setChunkIndex(request.getChunkIndex());
            chunk.setChunkMd5(request.getChunkMd5());
            chunk.setChunkSize(request.getChunkSize());
            chunk.setChunkPath(chunkPath);
            chunk.setUploadStatus("COMPLETED");
            chunk.setCreateTime(LocalDateTime.now());

            save(chunk);

            log.info("分片上传成功: chunkIndex={}, chunkPath={}", request.getChunkIndex(), chunkPath);
            return ReturnResult.ok(ChunkUploadResponse.success(
                    request.getChunkIndex(), request.getChunkMd5(), chunkPath));

        } catch (Exception e) {
            log.error("分片上传失败: chunkIndex={}, error={}", request.getChunkIndex(), e.getMessage(), e);
            return ReturnResult.error("分片上传失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ReturnResult<FileMergeResponse> mergeFile(FileMergeRequest request) {
        try {
            log.info("开始文件合并: fileName={}, fileMd5={}, totalChunks={}",
                    request.getFileName(), request.getFileMd5(), request.getTotalChunks());

            // 1. 检查所有分片是否已上传完成
            List<MonitorSysGenServerFileUploadChunk> chunks = list(
                    new LambdaQueryWrapper<MonitorSysGenServerFileUploadChunk>()
                            .eq(MonitorSysGenServerFileUploadChunk::getFileMd5, request.getFileMd5())
                            .eq(MonitorSysGenServerFileUploadChunk::getUploadStatus, "COMPLETED")
                            .orderByAsc(MonitorSysGenServerFileUploadChunk::getChunkIndex));

            if (chunks.size() != request.getTotalChunks()) {
                log.error("分片数量不完整: expected={}, actual={}", request.getTotalChunks(), chunks.size());
                return ReturnResult.error("分片数量不完整，无法合并文件");
            }

            // 2. 验证分片连续性
            for (int i = 0; i < chunks.size(); i++) {
                if (chunks.get(i).getChunkIndex() != i) {
                    log.error("分片索引不连续: expected={}, actual={}", i, chunks.get(i).getChunkIndex());
                    return ReturnResult.error("分片索引不连续，无法合并文件");
                }
            }

            // 3. 合并文件
            String mergedFilePath = mergeChunksToFile(chunks, request);

            // 4. 验证合并后文件的MD5
            String actualFileMd5 = calculateFileMd5(mergedFilePath);
            if (!actualFileMd5.equals(request.getFileMd5())) {
                log.error("合并文件MD5校验失败: expected={}, actual={}", request.getFileMd5(), actualFileMd5);
                // 删除错误的合并文件
                FileUtils.delete(mergedFilePath);
                return ReturnResult.error("合并文件MD5校验失败");
            }

            // 5. 记录文件上传记录
            MonitorSysGenServerFileUploadRecord record = new MonitorSysGenServerFileUploadRecord();
            record.setMonitorSysGenServerFileUploadRecordFileName(request.getFileName());
            record.setMonitorSysGenServerFileUploadRecordFileSize(request.getFileSize());
            record.setMonitorSysGenServerFileUploadRecordFileMd5(request.getFileMd5());
            record.setMonitorSysGenServerFileUploadRecordFilePath(mergedFilePath);
            record.setMonitorSysGenServerFileUploadRecordUploadStatus("COMPLETED");
            record.setCreateTime(LocalDateTime.now());
            recordService.save(record);

            // 6. 清理分片文件
            cleanupChunks(chunks);

            log.info("文件合并成功: fileName={}, filePath={}, fileSize={}",
                    request.getFileName(), mergedFilePath, request.getFileSize());

            return ReturnResult.ok(FileMergeResponse.success(
                    request.getFileMd5(), mergedFilePath, request.getFileSize()));

        } catch (Exception e) {
            log.error("文件合并失败: fileName={}, error={}", request.getFileName(), e.getMessage(), e);
            return ReturnResult.error("文件合并失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<DuplicateCheckResponse> checkDuplicate(DuplicateCheckRequest request) {
        try {
            log.info("检查重复文件: fileName={}, fileMd5={}", request.getFileName(), request.getFileMd5());

            // 查询已存在的文件记录
            MonitorSysGenServerFileUploadRecord existingRecord = recordService.getOne(
                    new LambdaQueryWrapper<MonitorSysGenServerFileUploadRecord>()
                            .eq(MonitorSysGenServerFileUploadRecord::getMonitorSysGenServerFileUploadRecordFileMd5, request.getFileMd5())
                            .eq(MonitorSysGenServerFileUploadRecord::getMonitorSysGenServerFileUploadRecordFileSize, request.getFileSize())
                            .eq(MonitorSysGenServerFileUploadRecord::getMonitorSysGenServerFileUploadRecordUploadStatus, "COMPLETED")
                            .last("LIMIT 1"));

            if (existingRecord != null) {
                // 验证文件是否真实存在
                String filePath = existingRecord.getMonitorSysGenServerFileUploadRecordFilePath();
                if (FileUtils.exists(filePath)) {
                    log.info("发现重复文件: fileMd5={}, filePath={}", request.getFileMd5(), filePath);
                    return ReturnResult.ok(DuplicateCheckResponse.exists(
                            request.getFileMd5(), filePath, request.getFileSize()));
                } else {
                    log.warn("文件记录存在但文件不存在: filePath={}", filePath);
                    // 删除无效记录
                    recordService.removeById(existingRecord.getMonitorSysGenServerFileUploadRecordId());
                }
            }

            log.info("文件不存在重复: fileMd5={}", request.getFileMd5());
            return ReturnResult.ok(DuplicateCheckResponse.notExists(request.getFileMd5()));

        } catch (Exception e) {
            log.error("检查重复文件失败: fileName={}, error={}", request.getFileName(), e.getMessage(), e);
            return ReturnResult.error("检查重复文件失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<String> generateUploadSessionId() {
        try {
            String sessionId = UUID.randomUUID().toString().replace("-", "");
            log.info("生成上传会话ID: {}", sessionId);
            return ReturnResult.ok(sessionId);
        } catch (Exception e) {
            log.error("生成上传会话ID失败: {}", e.getMessage(), e);
            return ReturnResult.error("生成上传会话ID失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional
    public ReturnResult<Integer> cleanExpiredChunks(int expireHours) {
        try {
            log.info("开始清理过期分片文件: expireHours={}", expireHours);

            LocalDateTime expireTime = LocalDateTime.now().minusHours(expireHours);

            // 查询过期的分片记录
            List<MonitorSysGenServerFileUploadChunk> expiredChunks = list(
                    new LambdaQueryWrapper<MonitorSysGenServerFileUploadChunk>()
                            .lt(MonitorSysGenServerFileUploadChunk::getCreateTime, expireTime)
                            .ne(MonitorSysGenServerFileUploadChunk::getUploadStatus, "COMPLETED"));

            int cleanedCount = 0;
            for (MonitorSysGenServerFileUploadChunk chunk : expiredChunks) {
                try {
                    // 删除分片文件
                    if (StringUtils.isNotBlank(chunk.getChunkPath()) && FileUtils.exists(chunk.getChunkPath())) {
                        FileUtils.delete(chunk.getChunkPath());
                    }
                    // 删除数据库记录
                    removeById(chunk.getMonitorSysGenServerFileUploadChunkId());
                    cleanedCount++;
                } catch (Exception e) {
                    log.warn("清理分片文件失败: chunkId={}, chunkPath={}, error={}",
                            chunk.getMonitorSysGenServerFileUploadChunkId(), chunk.getChunkPath(), e.getMessage());
                }
            }

            log.info("清理过期分片文件完成: cleanedCount={}", cleanedCount);
            return ReturnResult.ok(cleanedCount);

        } catch (Exception e) {
            log.error("清理过期分片文件失败: {}", e.getMessage(), e);
            return ReturnResult.error("清理过期分片文件失败: " + e.getMessage());
        }
    }

    /**
     * 获取已上传的分片索引列表
     */
    private List<Integer> getUploadedChunks(String fileMd5) {
        List<MonitorSysGenServerFileUploadChunk> chunks = list(
                new LambdaQueryWrapper<MonitorSysGenServerFileUploadChunk>()
                        .eq(MonitorSysGenServerFileUploadChunk::getFileMd5, fileMd5)
                        .eq(MonitorSysGenServerFileUploadChunk::getUploadStatus, "COMPLETED")
                        .select(MonitorSysGenServerFileUploadChunk::getChunkIndex));

        return chunks.stream()
                .map(MonitorSysGenServerFileUploadChunk::getChunkIndex)
                .sorted()
                .collect(Collectors.toList());
    }

    /**
     * 创建重复检查请求
     */
    private DuplicateCheckRequest createDuplicateCheckRequest(FilePrepareRequest request) {
        DuplicateCheckRequest duplicateRequest = new DuplicateCheckRequest();
        duplicateRequest.setFileMd5(request.getFileMd5());
        duplicateRequest.setFileName(request.getFileName());
        duplicateRequest.setFileSize(request.getFileSize());
        duplicateRequest.setServerId(request.getServerId());
        duplicateRequest.setTargetPath(request.getTargetPath());
        return duplicateRequest;
    }

    /**
     * 保存分片文件
     */
    private String saveChunkFile(MultipartFile file, ChunkUploadRequest request) throws IOException {
        // 创建分片存储目录
        String chunkDir = Paths.get(chunkStoragePath, request.getFileMd5()).toString();
        FileUtils.forceMkdir(chunkDir);

        // 生成分片文件路径
        String chunkFileName = String.format("chunk_%d_%s", request.getChunkIndex(), request.getChunkMd5());
        String chunkPath = Paths.get(chunkDir, chunkFileName).toString();

        // 保存分片文件
        try (InputStream inputStream = file.getInputStream();
             FileOutputStream outputStream = new FileOutputStream(chunkPath)) {

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
            }
        }

        return chunkPath;
    }

    /**
     * 合并分片文件为完整文件
     */
    private String mergeChunksToFile(List<MonitorSysGenServerFileUploadChunk> chunks, FileMergeRequest request) throws IOException {
        // 创建文件存储目录
        FileUtils.forceMkdir(fileStoragePath);

        // 生成合并文件路径
        String fileName = request.getFileName();
        String mergedFilePath = Paths.get(fileStoragePath, request.getFileMd5() + "_" + fileName).toString();

        // 合并分片文件
        try (FileOutputStream outputStream = new FileOutputStream(mergedFilePath)) {
            for (MonitorSysGenServerFileUploadChunk chunk : chunks) {
                String chunkPath = chunk.getChunkPath();
                if (!FileUtils.exists(chunkPath)) {
                    throw new IOException("分片文件不存在: " + chunkPath);
                }

                try (FileInputStream inputStream = new FileInputStream(chunkPath)) {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                    }
                }
            }
        }

        return mergedFilePath;
    }

    /**
     * 清理分片文件
     */
    private void cleanupChunks(List<MonitorSysGenServerFileUploadChunk> chunks) {
        for (MonitorSysGenServerFileUploadChunk chunk : chunks) {
            try {
                // 删除分片文件
                if (StringUtils.isNotBlank(chunk.getChunkPath()) && FileUtils.exists(chunk.getChunkPath())) {
                    FileUtils.delete(chunk.getChunkPath());
                }
                // 删除数据库记录
                removeById(chunk.getMonitorSysGenServerFileUploadChunkId());
            } catch (Exception e) {
                log.warn("清理分片文件失败: chunkId={}, chunkPath={}, error={}",
                        chunk.getMonitorSysGenServerFileUploadChunkId(), chunk.getChunkPath(), e.getMessage());
            }
        }
    }

    /**
     * 计算输入流的MD5值
     */
    private String calculateMd5(InputStream inputStream) throws IOException {
        return DigestUtils.md5Hex(inputStream);
    }

    /**
     * 计算文件的MD5值
     */
    private String calculateFileMd5(String filePath) throws IOException {
        try (FileInputStream inputStream = new FileInputStream(filePath)) {
            return DigestUtils.md5Hex(inputStream);
        }
    }
}
