package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.chua.starter.mybatis.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 节点日志器配置实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "节点日志器配置")
@Schema(description = "节点日志器配置")
@Data
@TableName(value = "monitor_sys_gen_plugin_node_logger_config")
public class MonitorSysGenPluginNodeLoggerConfig extends SysBase {

    /**
     * 配置ID
     */
    @TableId(value = "plugin_node_logger_config_id", type = IdType.AUTO)
    @ApiModelProperty(value = "配置ID")
    @Schema(description = "配置ID")
    private Integer pluginNodeLoggerConfigId;

    /**
     * 节点名称
     */
    @TableField(value = "plugin_node_logger_config_node_name")
    @ApiModelProperty(value = "节点名称")
    @Schema(description = "节点名称")
    private String pluginNodeLoggerConfigNodeName;

    /**
     * 节点URL（Base64编码）
     */
    @TableField(value = "plugin_node_logger_config_node_url")
    @ApiModelProperty(value = "节点URL")
    @Schema(description = "节点URL（Base64编码）")
    private String pluginNodeLoggerConfigNodeUrl;

    /**
     * 应用名称
     */
    @TableField(value = "plugin_node_logger_config_application_name")
    @ApiModelProperty(value = "应用名称")
    @Schema(description = "应用名称")
    private String pluginNodeLoggerConfigApplicationName;

    /**
     * 日志器名称
     */
    @TableField(value = "plugin_node_logger_config_logger_name")
    @ApiModelProperty(value = "日志器名称")
    @Schema(description = "日志器名称")
    private String pluginNodeLoggerConfigLoggerName;

    /**
     * 当前日志等级
     */
    @TableField(value = "plugin_node_logger_config_current_level")
    @ApiModelProperty(value = "当前日志等级")
    @Schema(description = "当前日志等级")
    private String pluginNodeLoggerConfigCurrentLevel;

    /**
     * 配置的日志等级
     */
    @TableField(value = "plugin_node_logger_config_configured_level")
    @ApiModelProperty(value = "配置的日志等级")
    @Schema(description = "配置的日志等级")
    private String pluginNodeLoggerConfigConfiguredLevel;

    /**
     * 有效的日志等级
     */
    @TableField(value = "plugin_node_logger_config_effective_level")
    @ApiModelProperty(value = "有效的日志等级")
    @Schema(description = "有效的日志等级")
    private String pluginNodeLoggerConfigEffectiveLevel;

    /**
     * 是否启用
     */
    @TableField(value = "plugin_node_logger_config_enabled")
    @ApiModelProperty(value = "是否启用")
    @Schema(description = "是否启用")
    private Boolean pluginNodeLoggerConfigEnabled;

    /**
     * 最后更新时间
     */
    @TableField(value = "plugin_node_logger_config_last_updated")
    @ApiModelProperty(value = "最后更新时间")
    @Schema(description = "最后更新时间")
    private LocalDateTime pluginNodeLoggerConfigLastUpdated;

    /**
     * 节点IP地址
     */
    @TableField(value = "plugin_node_logger_config_ip_address")
    @ApiModelProperty(value = "节点IP地址")
    @Schema(description = "节点IP地址")
    private String pluginNodeLoggerConfigIpAddress;

    /**
     * 节点端口
     */
    @TableField(value = "plugin_node_logger_config_port")
    @ApiModelProperty(value = "节点端口")
    @Schema(description = "节点端口")
    private Integer pluginNodeLoggerConfigPort;

    /**
     * 日志器类型
     */
    @TableField(value = "plugin_node_logger_config_logger_type")
    @ApiModelProperty(value = "日志器类型")
    @Schema(description = "日志器类型")
    private String pluginNodeLoggerConfigLoggerType;

    /**
     * 是否继承父级配置
     */
    @TableField(value = "plugin_node_logger_config_additive")
    @ApiModelProperty(value = "是否继承父级配置")
    @Schema(description = "是否继承父级配置")
    private Boolean pluginNodeLoggerConfigAdditive;

    /**
     * 配置来源
     */
    @TableField(value = "plugin_node_logger_config_source")
    @ApiModelProperty(value = "配置来源")
    @Schema(description = "配置来源")
    private String pluginNodeLoggerConfigSource;

    /**
     * 备注信息
     */
    @TableField(value = "plugin_node_logger_config_remark")
    @ApiModelProperty(value = "备注信息")
    @Schema(description = "备注信息")
    private String pluginNodeLoggerConfigRemark;

    /**
     * 配置状态：ACTIVE-活跃，INACTIVE-非活跃，DELETED-已删除
     */
    @TableField(value = "plugin_node_logger_config_status")
    @ApiModelProperty(value = "配置状态")
    @Schema(description = "配置状态：ACTIVE-活跃，INACTIVE-非活跃，DELETED-已删除")
    private String pluginNodeLoggerConfigStatus;

    /**
     * 同步状态：SYNCED-已同步，PENDING-待同步，FAILED-同步失败
     */
    @TableField(value = "plugin_node_logger_config_sync_status")
    @ApiModelProperty(value = "同步状态")
    @Schema(description = "同步状态：SYNCED-已同步，PENDING-待同步，FAILED-同步失败")
    private String pluginNodeLoggerConfigSyncStatus;

    /**
     * 同步错误信息
     */
    @TableField(value = "plugin_node_logger_config_sync_error")
    @ApiModelProperty(value = "同步错误信息")
    @Schema(description = "同步错误信息")
    private String pluginNodeLoggerConfigSyncError;

    /**
     * 最后同步时间
     */
    @TableField(value = "plugin_node_logger_config_last_sync_time")
    @ApiModelProperty(value = "最后同步时间")
    @Schema(description = "最后同步时间")
    private LocalDateTime pluginNodeLoggerConfigLastSyncTime;
}
