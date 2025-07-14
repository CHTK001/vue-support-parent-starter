package com.chua.starter.monitor.starter.pojo.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 文件初始化上传响应DTO
 *
 * @author CH
 * @since 2024/12/30
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileInitUploadDTO {

    /**
     * 文件ID
     */
    private Integer fileId;

    /**
     * 总分片数
     */
    private Integer chunkTotal;

    /**
     * 分片大小（字节）
     */
    private Long chunkSize;

    /**
     * 文件名
     */
    private String fileName;

    /**
     * 文件大小（字节）
     */
    private Long fileSize;

    /**
     * 文件MD5
     */
    private String fileMd5;
}
