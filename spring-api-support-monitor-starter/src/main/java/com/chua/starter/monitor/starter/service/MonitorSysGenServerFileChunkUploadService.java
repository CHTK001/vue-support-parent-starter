package com.chua.starter.monitor.starter.service;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.pojo.request.*;
import com.chua.starter.monitor.pojo.response.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 服务器文件分片上传服务接口
 *
 * @author CH
 * @since 2025/01/06
 */
public interface MonitorSysGenServerFileChunkUploadService {

    /**
     * 文件预处理
     * 检查文件是否已存在，计算分片信息，返回上传会话ID
     *
     * @param request 预处理请求
     * @return 预处理结果
     */
    ReturnResult<FilePrepareResponse> prepareFileUpload(FilePrepareRequest request);

    /**
     * 分片上传
     * 上传单个文件分片
     *
     * @param file    分片文件
     * @param request 分片上传请求
     * @return 上传结果
     */
    ReturnResult<ChunkUploadResponse> uploadChunk(MultipartFile file, ChunkUploadRequest request);

    /**
     * 文件合并
     * 将所有分片合并为完整文件
     *
     * @param request 合并请求
     * @return 合并结果
     */
    ReturnResult<FileMergeResponse> mergeFile(FileMergeRequest request);

    /**
     * 重复文件检查
     * 基于MD5检查文件是否已存在
     *
     * @param request 检查请求
     * @return 检查结果
     */
    ReturnResult<DuplicateCheckResponse> checkDuplicate(DuplicateCheckRequest request);

    /**
     * 生成分片上传会话ID
     *
     * @return 会话ID
     */
    ReturnResult<String> generateUploadSessionId();

    /**
     * 清理过期的分片文件
     * 清理超过指定时间的未完成上传分片
     *
     * @param expireHours 过期时间（小时）
     * @return 清理结果
     */
    ReturnResult<Integer> cleanExpiredChunks(int expireHours);
}
