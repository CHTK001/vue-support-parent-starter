package com.chua.starter.monitor.pojo.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

/**
 * 分片上传响应对象
 *
 * @author CH
 * @since 2025/01/06
 */
@Data
@ApiModel(description = "分片上传响应")
@Schema(description = "分片上传响应")
public class ChunkUploadResponse {

    /**
     * 分片索引
     */
    @ApiModelProperty(value = "分片索引")
    @Schema(description = "分片索引")
    private Integer chunkIndex;

    /**
     * 分片MD5值
     */
    @ApiModelProperty(value = "分片MD5值")
    @Schema(description = "分片MD5值")
    private String chunkMd5;

    /**
     * 是否上传成功
     */
    @ApiModelProperty(value = "是否上传成功")
    @Schema(description = "是否上传成功")
    private Boolean success;

    /**
     * 分片存储路径
     */
    @ApiModelProperty(value = "分片存储路径")
    @Schema(description = "分片存储路径")
    private String chunkPath;

    /**
     * 消息
     */
    @ApiModelProperty(value = "消息")
    @Schema(description = "消息")
    private String message;

    /**
     * 创建成功响应
     */
    public static ChunkUploadResponse success(Integer chunkIndex, String chunkMd5, String chunkPath) {
        ChunkUploadResponse response = new ChunkUploadResponse();
        response.setChunkIndex(chunkIndex);
        response.setChunkMd5(chunkMd5);
        response.setSuccess(true);
        response.setChunkPath(chunkPath);
        response.setMessage("分片上传成功");
        return response;
    }

    /**
     * 创建失败响应
     */
    public static ChunkUploadResponse failure(Integer chunkIndex, String chunkMd5, String message) {
        ChunkUploadResponse response = new ChunkUploadResponse();
        response.setChunkIndex(chunkIndex);
        response.setChunkMd5(chunkMd5);
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}
