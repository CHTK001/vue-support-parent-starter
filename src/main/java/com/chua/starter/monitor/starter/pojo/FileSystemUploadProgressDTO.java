package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 文件上传进度DTO
 *
 * @author CH
 * @since 2025/01/11
 */
@Data
@ApiModel(value = "FileSystemUploadProgressDTO", description = "文件上传进度DTO")
@Schema(description = "文件上传进度DTO")
public class FileSystemUploadProgressDTO {

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
     * 文件状态
     */
    @ApiModelProperty(value = "文件状态")
    @Schema(description = "文件状态 0:待合并 1:正常 2:合并失败 3:已删除")
    private Integer fileStatus;

    /**
     * 分片总数
     */
    @ApiModelProperty(value = "分片总数")
    @Schema(description = "分片总数")
    private Integer totalParts;

    /**
     * 已完成分片数
     */
    @ApiModelProperty(value = "已完成分片数")
    @Schema(description = "已完成分片数")
    private Integer completedParts;

    /**
     * 处理中分片数
     */
    @ApiModelProperty(value = "处理中分片数")
    @Schema(description = "处理中分片数")
    private Integer processingParts;

    /**
     * 失败分片数
     */
    @ApiModelProperty(value = "失败分片数")
    @Schema(description = "失败分片数")
    private Integer failedParts;

    /**
     * 总大小
     */
    @ApiModelProperty(value = "总大小")
    @Schema(description = "总大小")
    private Long totalSize;

    /**
     * 已完成大小
     */
    @ApiModelProperty(value = "已完成大小")
    @Schema(description = "已完成大小")
    private Long completedSize;

    /**
     * 上传进度百分比
     */
    @ApiModelProperty(value = "上传进度百分比")
    @Schema(description = "上传进度百分比")
    private Double uploadProgress;

    /**
     * 上传速度（字节/秒）
     */
    @ApiModelProperty(value = "上传速度")
    @Schema(description = "上传速度（字节/秒）")
    private Long uploadSpeed;

    /**
     * 预计剩余时间（秒）
     */
    @ApiModelProperty(value = "预计剩余时间")
    @Schema(description = "预计剩余时间（秒）")
    private Long estimatedTime;

    /**
     * 上传状态描述
     */
    @ApiModelProperty(value = "上传状态描述")
    @Schema(description = "上传状态描述")
    private String statusDescription;

    /**
     * 是否可以合并
     */
    @ApiModelProperty(value = "是否可以合并")
    @Schema(description = "是否可以合并")
    private Boolean canMerge;

    /**
     * 错误信息
     */
    @ApiModelProperty(value = "错误信息")
    @Schema(description = "错误信息")
    private String errorMessage;
}
