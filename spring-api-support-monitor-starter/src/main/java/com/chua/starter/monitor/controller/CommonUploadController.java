package com.chua.starter.monitor.controller;

import com.chua.common.support.lang.code.ReturnResult;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * 通用上传控制器
 * 提供通用的上传相关接口
 *
 * @author CH
 * @since 2025/01/06
 */
@Slf4j
@RestController
@RequestMapping("/")
@Api(tags = "通用上传接口")
@Tag(name = "通用上传接口", description = "通用上传相关接口")
public class CommonUploadController {

    /**
     * 生成分片上传ID
     * 兼容现有的前端调用
     */
    @GetMapping("/generate-sharding-id")
    @Operation(summary = "生成分片上传ID")
    @ApiOperation("生成分片上传ID")
    public ReturnResult<String> generateShardingId() {
        try {
            String shardingId = UUID.randomUUID().toString().replace("-", "");
            log.info("生成分片上传ID: {}", shardingId);
            return ReturnResult.ok(shardingId);
        } catch (Exception e) {
            log.error("生成分片上传ID失败: {}", e.getMessage(), e);
            return ReturnResult.error("生成分片上传ID失败: " + e.getMessage());
        }
    }
}
