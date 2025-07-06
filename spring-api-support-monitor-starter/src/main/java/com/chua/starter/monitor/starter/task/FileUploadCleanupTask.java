package com.chua.starter.monitor.starter.task;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.config.FileUploadConfig;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerFileChunkUploadService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * 文件上传清理定时任务
 * 自动清理过期的分片文件
 *
 * @author CH
 * @since 2025/01/06
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(prefix = "app.file.upload", name = "auto-clean-expired-chunks", havingValue = "true", matchIfMissing = true)
public class FileUploadCleanupTask {

    private final MonitorSysGenServerFileChunkUploadService chunkUploadService;
    private final FileUploadConfig fileUploadConfig;

    /**
     * 自动清理过期分片文件
     * 每6小时执行一次（可配置）
     */
    @Scheduled(fixedRateString = "#{${app.file.upload.auto-clean-interval:6} * 60 * 60 * 1000}")
    public void cleanExpiredChunks() {
        try {
            log.info("开始执行自动清理过期分片文件任务");

            int expireHours = fileUploadConfig.getChunkExpireHours();
            ReturnResult<Integer> result = chunkUploadService.cleanExpiredChunks(expireHours);

            if (result.isSuccess()) {
                log.info("自动清理过期分片文件任务完成: cleanedCount={}", result.getData());
            } else {
                log.error("自动清理过期分片文件任务失败: {}", result.getMsg());
            }

        } catch (Exception e) {
            log.error("自动清理过期分片文件任务异常: {}", e.getMessage(), e);
        }
    }
}
