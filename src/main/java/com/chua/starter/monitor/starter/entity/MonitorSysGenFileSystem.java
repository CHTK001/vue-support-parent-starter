package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.common.support.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 文件系统管理
 *
 * @author CH
 * @since 2025/01/11
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("monitor_sys_gen_file_system")
@ApiModel(value = "MonitorSysGenFileSystem", description = "文件系统管理")
@Schema(description = "文件系统管理")
public class MonitorSysGenFileSystem extends SysBase {

    /**
     * 文件系统ID
     */
    @ApiModelProperty(value = "文件系统ID")
    @Schema(description = "文件系统ID")
    private Integer monitorSysGenFileSystemId;

    /**
     * 文件名称
     */
    @ApiModelProperty(value = "文件名称")
    @Schema(description = "文件名称")
    private String monitorSysGenFileSystemName;

    /**
     * 文件原始名称
     */
    @ApiModelProperty(value = "文件原始名称")
    @Schema(description = "文件原始名称")
    private String monitorSysGenFileSystemOriginalName;

    /**
     * 文件路径
     */
    @ApiModelProperty(value = "文件路径")
    @Schema(description = "文件路径")
    private String monitorSysGenFileSystemPath;

    /**
     * 文件大小(字节)
     */
    @ApiModelProperty(value = "文件大小(字节)")
    @Schema(description = "文件大小(字节)")
    private Long monitorSysGenFileSystemSize;

    /**
     * 文件MD5
     */
    @ApiModelProperty(value = "文件MD5")
    @Schema(description = "文件MD5")
    private String monitorSysGenFileSystemMd5;

    /**
     * 文件类型
     */
    @ApiModelProperty(value = "文件类型")
    @Schema(description = "文件类型")
    private String monitorSysGenFileSystemType;

    /**
     * 文件扩展名
     */
    @ApiModelProperty(value = "文件扩展名")
    @Schema(description = "文件扩展名")
    private String monitorSysGenFileSystemExtension;

    /**
     * 文件状态 0:待合并 1:正常 2:合并失败 3:已删除
     */
    @ApiModelProperty(value = "文件状态")
    @Schema(description = "文件状态 0:待合并 1:正常 2:合并失败 3:已删除")
    private Integer monitorSysGenFileSystemStatus;

    /**
     * 是否分片上传 0:否 1:是
     */
    @ApiModelProperty(value = "是否分片上传")
    @Schema(description = "是否分片上传 0:否 1:是")
    private Integer monitorSysGenFileSystemIsChunk;

    /**
     * 分片总数
     */
    @ApiModelProperty(value = "分片总数")
    @Schema(description = "分片总数")
    private Integer monitorSysGenFileSystemChunkTotal;

    /**
     * 已上传分片数
     */
    @ApiModelProperty(value = "已上传分片数")
    @Schema(description = "已上传分片数")
    private Integer monitorSysGenFileSystemChunkUploaded;

    /**
     * 文件描述
     */
    @ApiModelProperty(value = "文件描述")
    @Schema(description = "文件描述")
    private String monitorSysGenFileSystemDescription;

    /**
     * 上传用户
     */
    @ApiModelProperty(value = "上传用户")
    @Schema(description = "上传用户")
    private String monitorSysGenFileSystemUploadUser;

    /**
     * 下载次数
     */
    @ApiModelProperty(value = "下载次数")
    @Schema(description = "下载次数")
    private Integer monitorSysGenFileSystemDownloadCount;

    /**
     * 最后下载时间
     */
    @ApiModelProperty(value = "最后下载时间")
    @Schema(description = "最后下载时间")
    private java.time.LocalDateTime monitorSysGenFileSystemLastDownloadTime;

    /**
     * 是否允许HTTP访问 0:否 1:是
     */
    @ApiModelProperty(value = "是否允许HTTP访问")
    @Schema(description = "是否允许HTTP访问 0:否 1:是")
    private Integer monitorSysGenFileSystemHttpAccess;

    /**
     * HTTP访问URL
     */
    @ApiModelProperty(value = "HTTP访问URL")
    @Schema(description = "HTTP访问URL")
    private String monitorSysGenFileSystemHttpUrl;

    /**
     * 备注
     */
    @ApiModelProperty(value = "备注")
    @Schema(description = "备注")
    private String monitorSysGenFileSystemRemark;
}
