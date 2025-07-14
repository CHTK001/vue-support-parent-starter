package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.common.support.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 文件系统分片管理
 *
 * @author CH
 * @since 2025/01/11
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("monitor_sys_gen_file_system_part")
@ApiModel(value = "MonitorSysGenFileSystemPart", description = "文件系统分片管理")
@Schema(description = "文件系统分片管理")
public class MonitorSysGenFileSystemPart extends SysBase {

    /**
     * 分片ID
     */
    @ApiModelProperty(value = "分片ID")
    @Schema(description = "分片ID")
    private Integer monitorSysGenFileSystemPartId;

    /**
     * 文件系统ID
     */
    @ApiModelProperty(value = "文件系统ID")
    @Schema(description = "文件系统ID")
    private Integer monitorSysGenFileSystemId;

    /**
     * 分片序号(从1开始)
     */
    @ApiModelProperty(value = "分片序号")
    @Schema(description = "分片序号(从1开始)")
    private Integer monitorSysGenFileSystemPartIndex;

    /**
     * 分片大小(字节)
     */
    @ApiModelProperty(value = "分片大小(字节)")
    @Schema(description = "分片大小(字节)")
    private Long monitorSysGenFileSystemPartSize;

    /**
     * 分片MD5
     */
    @ApiModelProperty(value = "分片MD5")
    @Schema(description = "分片MD5")
    private String monitorSysGenFileSystemPartMd5;

    /**
     * 分片文件路径
     */
    @ApiModelProperty(value = "分片文件路径")
    @Schema(description = "分片文件路径")
    private String monitorSysGenFileSystemPartPath;

    /**
     * 分片状态 0:待上传 1:处理中 2:已完成 3:上传失败
     */
    @ApiModelProperty(value = "分片状态")
    @Schema(description = "分片状态 0:待上传 1:处理中 2:已完成 3:上传失败")
    private Integer monitorSysGenFileSystemPartStatus;

    /**
     * 上传开始时间
     */
    @ApiModelProperty(value = "上传开始时间")
    @Schema(description = "上传开始时间")
    private java.time.LocalDateTime monitorSysGenFileSystemPartStartTime;

    /**
     * 上传完成时间
     */
    @ApiModelProperty(value = "上传完成时间")
    @Schema(description = "上传完成时间")
    private java.time.LocalDateTime monitorSysGenFileSystemPartEndTime;

    /**
     * 错误信息
     */
    @ApiModelProperty(value = "错误信息")
    @Schema(description = "错误信息")
    private String monitorSysGenFileSystemPartErrorMsg;

    /**
     * 重试次数
     */
    @ApiModelProperty(value = "重试次数")
    @Schema(description = "重试次数")
    private Integer monitorSysGenFileSystemPartRetryCount;

    /**
     * 备注
     */
    @ApiModelProperty(value = "备注")
    @Schema(description = "备注")
    private String monitorSysGenFileSystemPartRemark;
}
