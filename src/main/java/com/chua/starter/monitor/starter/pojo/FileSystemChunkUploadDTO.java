package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 文件分片上传DTO
 *
 * @author CH
 * @since 2025/01/11
 */
@Data
@ApiModel(value = "FileSystemChunkUploadDTO", description = "文件分片上传DTO")
@Schema(description = "文件分片上传DTO")
public class FileSystemChunkUploadDTO {

    /**
     * 文件ID
     */
    @ApiModelProperty(value = "文件ID")
    @Schema(description = "文件ID")
    private Integer fileId;

    /**
     * 文件名称
     */
    @ApiModelProperty(value = "文件名称")
    @Schema(description = "文件名称")
    private String fileName;

    /**
     * 文件大小
     */
    @ApiModelProperty(value = "文件大小")
    @Schema(description = "文件大小")
    private Long fileSize;

    /**
     * 文件MD5
     */
    @ApiModelProperty(value = "文件MD5")
    @Schema(description = "文件MD5")
    private String fileMd5;

    /**
     * 分片总数
     */
    @ApiModelProperty(value = "分片总数")
    @Schema(description = "分片总数")
    private Integer chunkTotal;

    /**
     * 分片大小
     */
    @ApiModelProperty(value = "分片大小")
    @Schema(description = "分片大小")
    private Long chunkSize;

    /**
     * 已存在的文件
     */
    @ApiModelProperty(value = "已存在的文件")
    @Schema(description = "已存在的文件")
    private Boolean fileExists;

    /**
     * 已上传的分片列表
     */
    @ApiModelProperty(value = "已上传的分片列表")
    @Schema(description = "已上传的分片列表")
    private java.util.List<Integer> uploadedChunks;

    /**
     * 上传状态
     */
    @ApiModelProperty(value = "上传状态")
    @Schema(description = "上传状态")
    private String uploadStatus;

    /**
     * 上传进度百分比
     */
    @ApiModelProperty(value = "上传进度百分比")
    @Schema(description = "上传进度百分比")
    private Double uploadProgress;
}
