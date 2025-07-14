package com.chua.starter.monitor.starter.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystem;
import com.chua.starter.monitor.starter.service.MonitorSysGenFileSystemService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.util.List;

/**
 * 文件系统管理控制器
 *
 * @author CH
 * @since 2025/01/11
 */
@Slf4j
@RestController
@RequestMapping("/v1/filesystem")
@RequiredArgsConstructor
@Api(tags = "文件系统管理")
@Tag(name = "文件系统管理", description = "文件系统的上传、下载、删除等操作")
public class MonitorSysGenFileSystemController {

    private final MonitorSysGenFileSystemService fileSystemService;

    /**
     * 分页查询文件列表
     */
    @GetMapping("/page")
    @ApiOperation(value = "分页查询文件列表")
    @Operation(summary = "分页查询文件列表", description = "根据条件分页查询文件列表")
    public ReturnResult<IPage<MonitorSysGenFileSystem>> page(
            @Parameter(description = "当前页码") @RequestParam(defaultValue = "1") Integer current,
            @Parameter(description = "每页大小") @RequestParam(defaultValue = "10") Integer size,
            @Parameter(description = "查询条件") MonitorSysGenFileSystem entity) {
        try {
            Page<MonitorSysGenFileSystem> page = new Page<>(current, size);
            IPage<MonitorSysGenFileSystem> result = fileSystemService.pageFor(page, entity);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("分页查询文件列表失败", e);
            return ReturnResult.error("分页查询文件列表失败: " + e.getMessage());
        }
    }

    /**
     * 初始化分片上传
     */
    @PostMapping("/chunk/init")
    @ApiOperation(value = "初始化分片上传")
    @Operation(summary = "初始化分片上传", description = "初始化分片上传，返回分片信息")
    public ReturnResult<java.util.Map<String, Object>> initChunkUpload(
            @Parameter(description = "文件名") @RequestParam String fileName,
            @Parameter(description = "文件大小") @RequestParam Long fileSize,
            @Parameter(description = "文件MD5") @RequestParam String fileMd5,
            @Parameter(description = "上传用户") @RequestParam(required = false) String uploadUser) {
        return fileSystemService.initChunkUpload(fileName, fileSize, fileMd5, uploadUser);
    }

    /**
     * 上传文件分片
     */
    @PostMapping("/chunk/upload")
    @ApiOperation(value = "上传文件分片")
    @Operation(summary = "上传文件分片", description = "上传指定序号的文件分片")
    public ReturnResult<Boolean> uploadChunk(@Parameter(description = "文件ID") @RequestParam Integer fileId,
            @Parameter(description = "分片序号") @RequestParam Integer partIndex,
            @Parameter(description = "分片MD5") @RequestParam String partMd5,
            @Parameter(description = "分片文件") @RequestParam("file") MultipartFile file) {
        return fileSystemService.uploadChunk(fileId, partIndex, partMd5, file);
    }

    /**
     * 检查上传状态
     */
    @GetMapping("/chunk/status/{fileId}")
    @ApiOperation(value = "检查上传状态")
    @Operation(summary = "检查上传状态", description = "检查文件分片上传状态")
    public ReturnResult<java.util.Map<String, Object>> checkUploadStatus(
            @Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return fileSystemService.checkUploadStatus(fileId);
    }

    /**
     * 手动触发文件合并
     */
    @PostMapping("/merge/{fileId}")
    @ApiOperation(value = "手动触发文件合并")
    @Operation(summary = "手动触发文件合并", description = "手动触发指定文件的分片合并")
    public ReturnResult<Boolean> manualMergeFile(@Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return fileSystemService.manualMergeFile(fileId);
    }

    /**
     * 下载文件
     */
    @GetMapping("/download/{fileId}")
    @ApiOperation(value = "下载文件")
    @Operation(summary = "下载文件", description = "根据文件ID下载文件")
    public ResponseEntity<org.springframework.core.io.Resource> downloadFile(
            @Parameter(description = "文件ID") @PathVariable Integer fileId, HttpServletResponse response) {
        try {
            ReturnResult<MonitorSysGenFileSystem> result = fileSystemService.downloadFile(fileId);
            if (!result.isSuccess()) {
                return ResponseEntity.notFound().build();
            }

            MonitorSysGenFileSystem fileInfo = result.getData();
            java.io.File file = new java.io.File(fileInfo.getMonitorSysGenFileSystemPath());
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }

            org.springframework.core.io.Resource resource = new org.springframework.core.io.FileSystemResource(file);

            return ResponseEntity.ok()
                    .header("Content-Disposition",
                            "attachment; filename=\"" + fileInfo.getMonitorSysGenFileSystemOriginalName() + "\"")
                    .header("Content-Type", "application/octet-stream")
                    .header("Content-Length", String.valueOf(file.length())).body(resource);

        } catch (Exception e) {
            log.error("下载文件失败: fileId={}", fileId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 删除文件
     */
    @DeleteMapping("/{fileId}")
    @ApiOperation(value = "删除文件")
    @Operation(summary = "删除文件", description = "根据文件ID删除文件")
    public ReturnResult<Boolean> deleteFile(@Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return fileSystemService.deleteFile(fileId);
    }

    /**
     * 批量删除文件
     */
    @DeleteMapping("/batch")
    @ApiOperation(value = "批量删除文件")
    @Operation(summary = "批量删除文件", description = "批量删除指定的文件")
    public ReturnResult<Boolean> batchDeleteFiles(
            @Parameter(description = "文件ID列表") @RequestBody List<Integer> fileIds) {
        return fileSystemService.batchDeleteFiles(fileIds);
    }

    /**
     * 根据MD5查询文件
     */
    @GetMapping("/md5/{md5}")
    @ApiOperation(value = "根据MD5查询文件")
    @Operation(summary = "根据MD5查询文件", description = "根据文件MD5查询文件信息")
    public ReturnResult<MonitorSysGenFileSystem> getFileByMd5(
            @Parameter(description = "文件MD5") @PathVariable String md5) {
        return fileSystemService.getFileByMd5(md5);
    }

    /**
     * 获取文件统计信息
     */
    @GetMapping("/statistics")
    @ApiOperation(value = "获取文件统计信息")
    @Operation(summary = "获取文件统计信息", description = "获取文件系统的统计信息")
    public ReturnResult<java.util.Map<String, Object>> getFileStatistics() {
        return fileSystemService.getFileStatistics();
    }

    /**
     * 获取热门下载文件
     */
    @GetMapping("/popular")
    @ApiOperation(value = "获取热门下载文件")
    @Operation(summary = "获取热门下载文件", description = "获取下载次数最多的文件列表")
    public ReturnResult<List<MonitorSysGenFileSystem>> getPopularFiles(
            @Parameter(description = "限制数量") @RequestParam(defaultValue = "10") Integer limit) {
        return fileSystemService.getPopularFiles(limit);
    }

    /**
     * 根据用户查询文件列表
     */
    @GetMapping("/user/{uploadUser}")
    @ApiOperation(value = "根据用户查询文件列表")
    @Operation(summary = "根据用户查询文件列表", description = "根据上传用户查询文件列表")
    public ReturnResult<List<MonitorSysGenFileSystem>> getFilesByUser(
            @Parameter(description = "上传用户") @PathVariable String uploadUser) {
        return fileSystemService.getFilesByUser(uploadUser);
    }

    /**
     * 获取文件HTTP访问URL
     */
    @GetMapping("/http-url/{fileId}")
    @ApiOperation(value = "获取文件HTTP访问URL")
    @Operation(summary = "获取文件HTTP访问URL", description = "获取文件的HTTP访问地址")
    public ReturnResult<String> getFileHttpUrl(@Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return fileSystemService.getFileHttpUrl(fileId);
    }

    /**
     * 设置文件HTTP访问权限
     */
    @PutMapping("/http-access/{fileId}")
    @ApiOperation(value = "设置文件HTTP访问权限")
    @Operation(summary = "设置文件HTTP访问权限", description = "设置文件是否允许HTTP访问")
    public ReturnResult<Boolean> setFileHttpAccess(@Parameter(description = "文件ID") @PathVariable Integer fileId,
            @Parameter(description = "是否允许HTTP访问") @RequestParam Integer httpAccess) {
        return fileSystemService.setFileHttpAccess(fileId, httpAccess);
    }

    /**
     * 验证文件类型
     */
    @GetMapping("/validate-type")
    @ApiOperation(value = "验证文件类型")
    @Operation(summary = "验证文件类型", description = "验证文件扩展名是否在白名单中")
    public ReturnResult<Boolean> validateFileType(
            @Parameter(description = "文件扩展名") @RequestParam String fileExtension) {
        return fileSystemService.validateFileType(fileExtension);
    }

    /**
     * 获取上传进度
     */
    @GetMapping("/progress/{fileId}")
    @ApiOperation(value = "获取上传进度")
    @Operation(summary = "获取上传进度", description = "获取文件分片上传进度详情")
    public ReturnResult<java.util.Map<String, Object>> getUploadProgress(
            @Parameter(description = "文件ID") @PathVariable Integer fileId) {
        return fileSystemService.getUploadProgress(fileId);
    }

    /**
     * 清理过期文件
     */
    @PostMapping("/clean")
    @ApiOperation(value = "清理过期文件")
    @Operation(summary = "清理过期文件", description = "清理指定天数之前的过期文件")
    public ReturnResult<Integer> cleanExpiredFiles(
            @Parameter(description = "过期天数") @RequestParam(defaultValue = "30") Integer days) {
        return fileSystemService.cleanExpiredFiles(days);
    }
}
