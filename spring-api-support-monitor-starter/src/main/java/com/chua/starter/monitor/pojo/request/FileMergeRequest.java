package com.chua.starter.monitor.pojo.request;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Min;

/**
 * 文件合并请求对象
 *
 * @author CH
 * @since 2025/01/06
 */
@Data
@ApiModel(description = "文件合并请求")
@Schema(description = "文件合并请求")
public class FileMergeRequest {

    /**
     * 文件MD5值
     */
    @NotBlank(message = "文件MD5不能为空")
    @ApiModelProperty(value = "文件MD5值", required = true)
    @Schema(description = "文件MD5值", required = true)
    private String fileMd5;

    /**
     * 文件名
     */
    @NotBlank(message = "文件名不能为空")
    @ApiModelProperty(value = "文件名", required = true)
    @Schema(description = "文件名", required = true)
    private String fileName;

    /**
     * 文件总大小
     */
    @NotNull(message = "文件总大小不能为空")
    @Min(value = 1, message = "文件总大小不能小于1")
    @ApiModelProperty(value = "文件总大小（字节）", required = true)
    @Schema(description = "文件总大小（字节）", required = true)
    private Long fileSize;

    /**
     * 总分片数
     */
    @NotNull(message = "总分片数不能为空")
    @Min(value = 1, message = "总分片数不能小于1")
    @ApiModelProperty(value = "总分片数", required = true)
    @Schema(description = "总分片数", required = true)
    private Integer totalChunks;

    /**
     * 服务器ID（可选，用于服务器文件上传）
     */
    @ApiModelProperty(value = "服务器ID")
    @Schema(description = "服务器ID")
    private Integer serverId;

    /**
     * 目标路径（可选，用于服务器文件上传）
     */
    @ApiModelProperty(value = "目标路径")
    @Schema(description = "目标路径")
    private String targetPath;

    /**
     * 是否覆盖已存在文件
     */
    @ApiModelProperty(value = "是否覆盖已存在文件", example = "false")
    @Schema(description = "是否覆盖已存在文件", example = "false")
    private Boolean overwrite = false;

    /**
     * 是否备份原文件
     */
    @ApiModelProperty(value = "是否备份原文件", example = "false")
    @Schema(description = "是否备份原文件", example = "false")
    private Boolean backup = false;
}
