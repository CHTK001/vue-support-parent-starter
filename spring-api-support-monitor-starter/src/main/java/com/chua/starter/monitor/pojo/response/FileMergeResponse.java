package com.chua.starter.monitor.pojo.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 文件合并响应对象
 *
 * @author CH
 * @since 2025/01/06
 */
@Data
@ApiModel(description = "文件合并响应")
@Schema(description = "文件合并响应")
public class FileMergeResponse {

    /**
     * 文件MD5值
     */
    @ApiModelProperty(value = "文件MD5值")
    @Schema(description = "文件MD5值")
    private String fileMd5;

    /**
     * 是否合并成功
     */
    @ApiModelProperty(value = "是否合并成功")
    @Schema(description = "是否合并成功")
    private Boolean success;

    /**
     * 文件存储路径
     */
    @ApiModelProperty(value = "文件存储路径")
    @Schema(description = "文件存储路径")
    private String filePath;

    /**
     * 文件大小
     */
    @ApiModelProperty(value = "文件大小（字节）")
    @Schema(description = "文件大小（字节）")
    private Long fileSize;

    /**
     * 消息
     */
    @ApiModelProperty(value = "消息")
    @Schema(description = "消息")
    private String message;

    /**
     * 任务ID（如果是服务器文件上传）
     */
    @ApiModelProperty(value = "任务ID")
    @Schema(description = "任务ID")
    private Long taskId;

    /**
     * 创建成功响应
     */
    public static FileMergeResponse success(String fileMd5, String filePath, Long fileSize) {
        FileMergeResponse response = new FileMergeResponse();
        response.setFileMd5(fileMd5);
        response.setSuccess(true);
        response.setFilePath(filePath);
        response.setFileSize(fileSize);
        response.setMessage("文件合并成功");
        return response;
    }

    /**
     * 创建成功响应（带任务ID）
     */
    public static FileMergeResponse success(String fileMd5, String filePath, Long fileSize, Long taskId) {
        FileMergeResponse response = success(fileMd5, filePath, fileSize);
        response.setTaskId(taskId);
        return response;
    }

    /**
     * 创建失败响应
     */
    public static FileMergeResponse failure(String fileMd5, String message) {
        FileMergeResponse response = new FileMergeResponse();
        response.setFileMd5(fileMd5);
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}
