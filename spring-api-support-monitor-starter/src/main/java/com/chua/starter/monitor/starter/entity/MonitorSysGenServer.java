package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.chua.starter.mybatis.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统服务器配置实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "系统服务器配置")
@Schema(description = "系统服务器配置")
@Data
@TableName(value = "monitor_sys_gen_server")
public class MonitorSysGenServer extends SysBase {

    /**
     * 服务器ID
     */
    @TableId(value = "monitor_sys_gen_server_id", type = IdType.AUTO)
    @ApiModelProperty(value = "服务器ID")
    @Schema(description = "服务器ID")
    private Integer monitorSysGenServerId;

    /**
     * 服务器名称
     */
    @TableField(value = "monitor_sys_gen_server_name")
    @ApiModelProperty(value = "服务器名称", required = true)
    @Schema(description = "服务器名称", required = true)
    private String monitorSysGenServerName;

    /**
     * 服务器端口
     */
    @TableField(value = "monitor_sys_gen_server_port")
    @ApiModelProperty(value = "服务器端口", required = true)
    @Schema(description = "服务器端口", required = true)
    private Integer monitorSysGenServerPort;

    /**
     * 服务器类型
     */
    @TableField(value = "monitor_sys_gen_server_type")
    @ApiModelProperty(value = "服务器类型", required = true)
    @Schema(description = "服务器类型", required = true)
    private String monitorSysGenServerType;

    /**
     * 服务器状态：STOPPED-已停止，RUNNING-运行中，STARTING-启动中，STOPPING-停止中，ERROR-异常
     */
    @TableField(value = "monitor_sys_gen_server_status")
    @ApiModelProperty(value = "服务器状态")
    @Schema(description = "服务器状态：STOPPED-已停止，RUNNING-运行中，STARTING-启动中，STOPPING-停止中，ERROR-异常")
    private String monitorSysGenServerStatus;

    /**
     * 服务器描述
     */
    @TableField(value = "monitor_sys_gen_server_description")
    @ApiModelProperty(value = "服务器描述")
    @Schema(description = "服务器描述")
    private String monitorSysGenServerDescription;

    /**
     * 服务器配置（JSON格式）
     */
    @TableField(value = "monitor_sys_gen_server_config")
    @ApiModelProperty(value = "服务器配置")
    @Schema(description = "服务器配置（JSON格式）")
    private String monitorSysGenServerConfig;

    /**
     * 是否自动启动
     */
    @TableField(value = "monitor_sys_gen_server_auto_start")
    @ApiModelProperty(value = "是否自动启动")
    @Schema(description = "是否自动启动")
    private Boolean monitorSysGenServerAutoStart;

    /**
     * 最大连接数
     */
    @TableField(value = "monitor_sys_gen_server_max_connections")
    @ApiModelProperty(value = "最大连接数")
    @Schema(description = "最大连接数")
    private Integer monitorSysGenServerMaxConnections;

    /**
     * 超时时间（秒）
     */
    @TableField(value = "monitor_sys_gen_server_timeout")
    @ApiModelProperty(value = "超时时间")
    @Schema(description = "超时时间（秒）")
    private Integer monitorSysGenServerTimeout;

    /**
     * 服务器主机地址
     */
    @TableField(value = "monitor_sys_gen_server_host")
    @ApiModelProperty(value = "服务器主机地址")
    @Schema(description = "服务器主机地址")
    private String monitorSysGenServerHost;

    /**
     * 服务器协议
     */
    @TableField(value = "monitor_sys_gen_server_protocol")
    @ApiModelProperty(value = "服务器协议")
    @Schema(description = "服务器协议")
    private String monitorSysGenServerProtocol;

    /**
     * 服务器版本
     */
    @TableField(value = "monitor_sys_gen_server_version")
    @ApiModelProperty(value = "服务器版本")
    @Schema(description = "服务器版本")
    private String monitorSysGenServerVersion;

    /**
     * 服务器环境
     */
    @TableField(value = "monitor_sys_gen_server_environment")
    @ApiModelProperty(value = "服务器环境")
    @Schema(description = "服务器环境")
    private String monitorSysGenServerEnvironment;

    /**
     * 服务器标签（JSON格式）
     */
    @TableField(value = "monitor_sys_gen_server_tags")
    @ApiModelProperty(value = "服务器标签")
    @Schema(description = "服务器标签（JSON格式）")
    private String monitorSysGenServerTags;

    /**
     * 是否启用SSL
     */
    @TableField(value = "monitor_sys_gen_server_ssl_enabled")
    @ApiModelProperty(value = "是否启用SSL")
    @Schema(description = "是否启用SSL")
    private Boolean monitorSysGenServerSslEnabled;

    /**
     * SSL证书路径
     */
    @TableField(value = "monitor_sys_gen_server_ssl_cert_path")
    @ApiModelProperty(value = "SSL证书路径")
    @Schema(description = "SSL证书路径")
    private String monitorSysGenServerSslCertPath;

    /**
     * SSL私钥路径
     */
    @TableField(value = "monitor_sys_gen_server_ssl_key_path")
    @ApiModelProperty(value = "SSL私钥路径")
    @Schema(description = "SSL私钥路径")
    private String monitorSysGenServerSslKeyPath;

    /**
     * 健康检查URL
     */
    @TableField(value = "monitor_sys_gen_server_health_check_url")
    @ApiModelProperty(value = "健康检查URL")
    @Schema(description = "健康检查URL")
    private String monitorSysGenServerHealthCheckUrl;

    /**
     * 健康检查间隔（秒）
     */
    @TableField(value = "monitor_sys_gen_server_health_check_interval")
    @ApiModelProperty(value = "健康检查间隔")
    @Schema(description = "健康检查间隔（秒）")
    private Integer monitorSysGenServerHealthCheckInterval;

    /**
     * 最后健康检查时间
     */
    @TableField(value = "monitor_sys_gen_server_last_health_check")
    @ApiModelProperty(value = "最后健康检查时间")
    @Schema(description = "最后健康检查时间")
    private java.time.LocalDateTime monitorSysGenServerLastHealthCheck;

    /**
     * 服务器启动时间
     */
    @TableField(value = "monitor_sys_gen_server_start_time")
    @ApiModelProperty(value = "服务器启动时间")
    @Schema(description = "服务器启动时间")
    private java.time.LocalDateTime monitorSysGenServerStartTime;

    /**
     * 服务器停止时间
     */
    @TableField(value = "monitor_sys_gen_server_stop_time")
    @ApiModelProperty(value = "服务器停止时间")
    @Schema(description = "服务器停止时间")
    private java.time.LocalDateTime monitorSysGenServerStopTime;

    /**
     * 服务器运行时长（秒）
     */
    @TableField(value = "monitor_sys_gen_server_uptime")
    @ApiModelProperty(value = "服务器运行时长")
    @Schema(description = "服务器运行时长（秒）")
    private Long monitorSysGenServerUptime;

    /**
     * 服务器PID
     */
    @TableField(value = "monitor_sys_gen_server_pid")
    @ApiModelProperty(value = "服务器PID")
    @Schema(description = "服务器PID")
    private Integer monitorSysGenServerPid;

    /**
     * 服务器工作目录
     */
    @TableField(value = "monitor_sys_gen_server_work_dir")
    @ApiModelProperty(value = "服务器工作目录")
    @Schema(description = "服务器工作目录")
    private String monitorSysGenServerWorkDir;

    /**
     * 服务器日志文件路径
     */
    @TableField(value = "monitor_sys_gen_server_log_file")
    @ApiModelProperty(value = "服务器日志文件路径")
    @Schema(description = "服务器日志文件路径")
    private String monitorSysGenServerLogFile;

    /**
     * 服务器错误信息
     */
    @TableField(value = "monitor_sys_gen_server_error_message")
    @ApiModelProperty(value = "服务器错误信息")
    @Schema(description = "服务器错误信息")
    private String monitorSysGenServerErrorMessage;

    /**
     * 服务器重启次数
     */
    @TableField(value = "monitor_sys_gen_server_restart_count")
    @ApiModelProperty(value = "服务器重启次数")
    @Schema(description = "服务器重启次数")
    private Integer monitorSysGenServerRestartCount;

    /**
     * 是否启用
     */
    @TableField(value = "monitor_sys_gen_server_enabled")
    @ApiModelProperty(value = "是否启用")
    @Schema(description = "是否启用")
    private Boolean monitorSysGenServerEnabled;

    /**
     * 排序顺序
     */
    @TableField(value = "monitor_sys_gen_server_sort_order")
    @ApiModelProperty(value = "排序顺序")
    @Schema(description = "排序顺序")
    private Integer monitorSysGenServerSortOrder;

    /**
     * 备注信息
     */
    @TableField(value = "monitor_sys_gen_server_remark")
    @ApiModelProperty(value = "备注信息")
    @Schema(description = "备注信息")
    private String monitorSysGenServerRemark;
}
