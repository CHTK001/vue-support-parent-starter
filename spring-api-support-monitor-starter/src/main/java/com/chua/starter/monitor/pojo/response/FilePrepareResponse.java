package com.chua.starter.monitor.pojo.response;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * 文件预处理响应对象
 *
 * @author CH
 * @since 2025/01/06
 */
@Data
@ApiModel(description = "文件预处理响应")
@Schema(description = "文件预处理响应")
public class FilePrepareResponse {

    /**
     * 上传会话ID
     */
    @ApiModelProperty(value = "上传会话ID")
    @Schema(description = "上传会话ID")
    private String uploadSessionId;

    /**
     * 文件MD5值
     */
    @ApiModelProperty(value = "文件MD5值")
    @Schema(description = "文件MD5值")
    private String fileMd5;

    /**
     * 是否需要上传（false表示文件已存在，可以秒传）
     */
    @ApiModelProperty(value = "是否需要上传")
    @Schema(description = "是否需要上传")
    private Boolean needUpload;

    /**
     * 总分片数
     */
    @ApiModelProperty(value = "总分片数")
    @Schema(description = "总分片数")
    private Integer totalChunks;

    /**
     * 分片大小
     */
    @ApiModelProperty(value = "分片大小（字节）")
    @Schema(description = "分片大小（字节）")
    private Long chunkSize;

    /**
     * 已上传的分片索引列表
     */
    @ApiModelProperty(value = "已上传的分片索引列表")
    @Schema(description = "已上传的分片索引列表")
    private List<Integer> uploadedChunks;

    /**
     * 文件存储路径（如果文件已存在）
     */
    @ApiModelProperty(value = "文件存储路径")
    @Schema(description = "文件存储路径")
    private String filePath;

    /**
     * 消息
     */
    @ApiModelProperty(value = "消息")
    @Schema(description = "消息")
    private String message;

    /**
     * 创建需要上传的响应
     */
    public static FilePrepareResponse needUpload(String uploadSessionId, String fileMd5, 
                                               Integer totalChunks, Long chunkSize, 
                                               List<Integer> uploadedChunks) {
        FilePrepareResponse response = new FilePrepareResponse();
        response.setUploadSessionId(uploadSessionId);
        response.setFileMd5(fileMd5);
        response.setNeedUpload(true);
        response.setTotalChunks(totalChunks);
        response.setChunkSize(chunkSize);
        response.setUploadedChunks(uploadedChunks);
        response.setMessage("文件需要上传");
        return response;
    }

    /**
     * 创建秒传响应
     */
    public static FilePrepareResponse instantUpload(String fileMd5, String filePath) {
        FilePrepareResponse response = new FilePrepareResponse();
        response.setFileMd5(fileMd5);
        response.setNeedUpload(false);
        response.setFilePath(filePath);
        response.setMessage("文件已存在，秒传成功");
        return response;
    }
}
