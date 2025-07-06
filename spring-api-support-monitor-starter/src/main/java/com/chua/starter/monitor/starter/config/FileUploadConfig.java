package com.chua.starter.monitor.starter.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 文件上传配置
 *
 * @author CH
 * @since 2025/01/06
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "app.file.upload")
public class FileUploadConfig {

    /**
     * 分片存储路径
     */
    private String chunkStoragePath = "./data/chunks";

    /**
     * 文件存储路径
     */
    private String fileStoragePath = "./data/files";

    /**
     * 默认分片大小（字节）
     */
    private Long defaultChunkSize = 1048576L; // 1MB

    /**
     * 最大文件大小（字节）
     */
    private Long maxFileSize = 1073741824L; // 1GB

    /**
     * 最大并发上传数
     */
    private Integer maxConcurrentUploads = 10;

    /**
     * 分片过期时间（小时）
     */
    private Integer chunkExpireHours = 24;

    /**
     * 是否启用MD5校验
     */
    private Boolean enableMd5Check = true;

    /**
     * 是否启用分片MD5校验
     */
    private Boolean enableChunkMd5Check = true;

    /**
     * 是否自动清理过期分片
     */
    private Boolean autoCleanExpiredChunks = true;

    /**
     * 自动清理间隔（小时）
     */
    private Integer autoCleanInterval = 6;
}
