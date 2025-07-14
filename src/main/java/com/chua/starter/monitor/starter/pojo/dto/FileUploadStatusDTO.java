package com.chua.starter.monitor.starter.pojo.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 文件上传状态DTO
 *
 * @author CH
 * @since 2024/12/30
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadStatusDTO {

    /**
     * 文件ID
     */
    private Integer fileId;

    /**
     * 文件名
     */
    private String fileName;

    /**
     * 文件状态
     */
    private Integer fileStatus;

    /**
     * 总分片数
     */
    private Integer chunkTotal;

    /**
     * 已上传分片数
     */
    private Integer chunkUploaded;

    /**
     * 上传进度（百分比）
     */
    private Integer progress;

    /**
     * 状态描述
     */
    private String statusMessage;
}
