package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.mybatis.pojo.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import javax.validation.constraints.NotNull;

/**
 * 服务器文件上传分片记录实体类
 *
 * @author CH
 * @since 2025/01/06
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "服务器文件上传分片记录")
@Schema(description = "服务器文件上传分片记录")
@Data
@TableName(value = "monitor_sys_gen_server_file_upload_chunks")
public class MonitorSysGenServerFileUploadChunk extends SysBase {

    @TableId(value = "monitor_sys_gen_server_file_upload_chunk_id", type = IdType.AUTO)
    @ApiModelProperty(value = "分片记录ID")
    @Schema(description = "分片记录ID")
    @NotNull(message = "不能为null")
    private Long monitorSysGenServerFileUploadChunkId;

    /**
     * 上传会话ID
     */
    @TableField(value = "upload_session_id")
    @ApiModelProperty(value = "上传会话ID")
    @Schema(description = "上传会话ID")
    @NotNull(message = "上传会话ID不能为空")
    private String uploadSessionId;

    /**
     * 文件MD5值
     */
    @TableField(value = "file_md5")
    @ApiModelProperty(value = "文件MD5值")
    @Schema(description = "文件MD5值")
    @NotNull(message = "文件MD5不能为空")
    private String fileMd5;

    /**
     * 分片索引
     */
    @TableField(value = "chunk_index")
    @ApiModelProperty(value = "分片索引")
    @Schema(description = "分片索引")
    @NotNull(message = "分片索引不能为空")
    private Integer chunkIndex;

    /**
     * 分片MD5值
     */
    @TableField(value = "chunk_md5")
    @ApiModelProperty(value = "分片MD5值")
    @Schema(description = "分片MD5值")
    @NotNull(message = "分片MD5不能为空")
    private String chunkMd5;

    /**
     * 分片大小
     */
    @TableField(value = "chunk_size")
    @ApiModelProperty(value = "分片大小（字节）")
    @Schema(description = "分片大小（字节）")
    @NotNull(message = "分片大小不能为空")
    private Long chunkSize;

    /**
     * 分片存储路径
     */
    @TableField(value = "chunk_path")
    @ApiModelProperty(value = "分片存储路径")
    @Schema(description = "分片存储路径")
    @NotNull(message = "分片存储路径不能为空")
    private String chunkPath;

    /**
     * 上传状态：PENDING-待上传，UPLOADING-上传中，COMPLETED-已完成，FAILED-失败
     */
    @TableField(value = "upload_status")
    @ApiModelProperty(value = "上传状态")
    @Schema(description = "上传状态：PENDING-待上传，UPLOADING-上传中，COMPLETED-已完成，FAILED-失败")
    @NotNull(message = "上传状态不能为空")
    private String uploadStatus;

    /**
     * 错误信息
     */
    @TableField(value = "error_message")
    @ApiModelProperty(value = "错误信息")
    @Schema(description = "错误信息")
    private String errorMessage;
}
