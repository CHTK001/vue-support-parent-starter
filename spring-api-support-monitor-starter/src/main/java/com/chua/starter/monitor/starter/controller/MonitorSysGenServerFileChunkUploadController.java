package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.pojo.request.*;
import com.chua.starter.monitor.pojo.response.*;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerFileChunkUploadService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

/**
 * 服务器文件分片上传控制器
 *
 * @author CH
 * @since 2025/01/06
 */
@Slf4j
@RestController
@RequestMapping("/api/monitor/server/file-upload")
@RequiredArgsConstructor
@Api(tags = "服务器文件分片上传")
@Tag(name = "服务器文件分片上传", description = "服务器文件分片上传相关接口")
public class MonitorSysGenServerFileChunkUploadController {

    private final MonitorSysGenServerFileChunkUploadService chunkUploadService;

    /**
     * 文件预处理
     * 检查文件是否已存在，计算分片信息，返回上传会话ID
     */
    @PostMapping("/prepare")
    @Operation(summary = "文件预处理")
    @ApiOperation("文件预处理")
    public ReturnResult<FilePrepareResponse> prepareFileUpload(
            @Validated @RequestBody @Parameter(description = "预处理请求") @ApiParam("预处理请求") FilePrepareRequest request) {
        return chunkUploadService.prepareFileUpload(request);
    }

    /**
     * 分片上传
     * 上传单个文件分片
     */
    @PostMapping("/chunk")
    @Operation(summary = "分片上传")
    @ApiOperation("分片上传")
    public ReturnResult<ChunkUploadResponse> uploadChunk(
            @RequestParam("file") @Parameter(description = "分片文件") @ApiParam("分片文件") MultipartFile file,
            @Validated @ModelAttribute @Parameter(description = "分片上传请求") @ApiParam("分片上传请求") ChunkUploadRequest request) {
        return chunkUploadService.uploadChunk(file, request);
    }

    /**
     * 文件合并
     * 将所有分片合并为完整文件
     */
    @PostMapping("/merge")
    @Operation(summary = "文件合并")
    @ApiOperation("文件合并")
    public ReturnResult<FileMergeResponse> mergeFile(
            @Validated @RequestBody @Parameter(description = "合并请求") @ApiParam("合并请求") FileMergeRequest request) {
        return chunkUploadService.mergeFile(request);
    }

    /**
     * 重复文件检查
     * 基于MD5检查文件是否已存在
     */
    @PostMapping("/check-duplicate")
    @Operation(summary = "重复文件检查")
    @ApiOperation("重复文件检查")
    public ReturnResult<DuplicateCheckResponse> checkDuplicate(
            @Validated @RequestBody @Parameter(description = "检查请求") @ApiParam("检查请求") DuplicateCheckRequest request) {
        return chunkUploadService.checkDuplicate(request);
    }

    /**
     * 生成分片上传会话ID
     */
    @GetMapping("/generate-session-id")
    @Operation(summary = "生成分片上传会话ID")
    @ApiOperation("生成分片上传会话ID")
    public ReturnResult<String> generateUploadSessionId() {
        return chunkUploadService.generateUploadSessionId();
    }

    /**
     * 清理过期的分片文件
     * 清理超过指定时间的未完成上传分片
     */
    @PostMapping("/cleanup-expired")
    @Operation(summary = "清理过期的分片文件")
    @ApiOperation("清理过期的分片文件")
    public ReturnResult<Integer> cleanExpiredChunks(
            @RequestParam(defaultValue = "24") @Parameter(description = "过期时间（小时）") @ApiParam("过期时间（小时）") int expireHours) {
        return chunkUploadService.cleanExpiredChunks(expireHours);
    }
}
