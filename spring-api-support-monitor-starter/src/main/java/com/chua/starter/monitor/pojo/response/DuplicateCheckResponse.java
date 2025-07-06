package com.chua.starter.monitor.pojo.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 重复文件检查响应对象
 *
 * @author CH
 * @since 2025/01/06
 */
@Data
@ApiModel(description = "重复文件检查响应")
@Schema(description = "重复文件检查响应")
public class DuplicateCheckResponse {

    /**
     * 文件MD5值
     */
    @ApiModelProperty(value = "文件MD5值")
    @Schema(description = "文件MD5值")
    private String fileMd5;

    /**
     * 是否存在重复文件
     */
    @ApiModelProperty(value = "是否存在重复文件")
    @Schema(description = "是否存在重复文件")
    private Boolean exists;

    /**
     * 文件存储路径（如果存在）
     */
    @ApiModelProperty(value = "文件存储路径")
    @Schema(description = "文件存储路径")
    private String filePath;

    /**
     * 文件大小（如果存在）
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
     * 创建存在重复文件的响应
     */
    public static DuplicateCheckResponse exists(String fileMd5, String filePath, Long fileSize) {
        DuplicateCheckResponse response = new DuplicateCheckResponse();
        response.setFileMd5(fileMd5);
        response.setExists(true);
        response.setFilePath(filePath);
        response.setFileSize(fileSize);
        response.setMessage("文件已存在");
        return response;
    }

    /**
     * 创建不存在重复文件的响应
     */
    public static DuplicateCheckResponse notExists(String fileMd5) {
        DuplicateCheckResponse response = new DuplicateCheckResponse();
        response.setFileMd5(fileMd5);
        response.setExists(false);
        response.setMessage("文件不存在");
        return response;
    }
}
