package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.chua.starter.mybatis.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 系统服务器配置设置实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "系统服务器配置设置")
@Schema(description = "系统服务器配置设置")
@Data
@TableName(value = "monitor_sys_gen_server_setting")
public class MonitorSysGenServerSetting extends SysBase {

    /**
     * 配置设置ID
     */
    @TableId(value = "monitor_sys_gen_server_setting_id", type = IdType.AUTO)
    @ApiModelProperty(value = "配置设置ID")
    @Schema(description = "配置设置ID")
    private Integer monitorSysGenServerSettingId;

    /**
     * 服务器ID
     */
    @TableField(value = "monitor_sys_gen_server_setting_server_id")
    @ApiModelProperty(value = "服务器ID", required = true)
    @Schema(description = "服务器ID", required = true)
    private Integer monitorSysGenServerSettingServerId;

    /**
     * 配置设置名称
     */
    @TableField(value = "monitor_sys_gen_server_setting_name")
    @ApiModelProperty(value = "配置设置名称", required = true)
    @Schema(description = "配置设置名称", required = true)
    private String monitorSysGenServerSettingName;

    /**
     * 配置设置类型
     */
    @TableField(value = "monitor_sys_gen_server_setting_type")
    @ApiModelProperty(value = "配置设置类型", required = true)
    @Schema(description = "配置设置类型", required = true)
    private String monitorSysGenServerSettingType;

    /**
     * 配置设置描述
     */
    @TableField(value = "monitor_sys_gen_server_setting_description")
    @ApiModelProperty(value = "配置设置描述")
    @Schema(description = "配置设置描述")
    private String monitorSysGenServerSettingDescription;

    /**
     * 是否启用
     */
    @TableField(value = "monitor_sys_gen_server_setting_enabled")
    @ApiModelProperty(value = "是否启用")
    @Schema(description = "是否启用")
    private Boolean monitorSysGenServerSettingEnabled;

    /**
     * 排序顺序
     */
    @TableField(value = "monitor_sys_gen_server_setting_sort_order")
    @ApiModelProperty(value = "排序顺序")
    @Schema(description = "排序顺序")
    private Integer monitorSysGenServerSettingSortOrder;

    /**
     * 配置参数（JSON格式）
     */
    @TableField(value = "monitor_sys_gen_server_setting_config")
    @ApiModelProperty(value = "配置参数")
    @Schema(description = "配置参数（JSON格式）")
    private String monitorSysGenServerSettingConfig;

    /**
     * 配置类名
     */
    @TableField(value = "monitor_sys_gen_server_setting_class_name")
    @ApiModelProperty(value = "配置类名")
    @Schema(description = "配置类名")
    private String monitorSysGenServerSettingClassName;

    /**
     * 配置版本
     */
    @TableField(value = "monitor_sys_gen_server_setting_version")
    @ApiModelProperty(value = "配置版本")
    @Schema(description = "配置版本")
    private String monitorSysGenServerSettingVersion;

    /**
     * 是否必填
     */
    @TableField(value = "monitor_sys_gen_server_setting_required")
    @ApiModelProperty(value = "是否必填")
    @Schema(description = "是否必填")
    private Boolean monitorSysGenServerSettingRequired;

    /**
     * 配置默认值（JSON格式）
     */
    @TableField(value = "monitor_sys_gen_server_setting_default_value")
    @ApiModelProperty(value = "配置默认值")
    @Schema(description = "配置默认值（JSON格式）")
    private String monitorSysGenServerSettingDefaultValue;

    /**
     * 配置验证规则（JSON格式）
     */
    @TableField(value = "monitor_sys_gen_server_setting_validation_rules")
    @ApiModelProperty(value = "配置验证规则")
    @Schema(description = "配置验证规则（JSON格式）")
    private String monitorSysGenServerSettingValidationRules;

    /**
     * 配置状态：ACTIVE-活跃，INACTIVE-非活跃，DELETED-已删除
     */
    @TableField(value = "monitor_sys_gen_server_setting_status")
    @ApiModelProperty(value = "配置状态")
    @Schema(description = "配置状态：ACTIVE-活跃，INACTIVE-非活跃，DELETED-已删除")
    private String monitorSysGenServerSettingStatus;

    /**
     * 最后应用时间
     */
    @TableField(value = "monitor_sys_gen_server_setting_last_applied_time")
    @ApiModelProperty(value = "最后应用时间")
    @Schema(description = "最后应用时间")
    private java.time.LocalDateTime monitorSysGenServerSettingLastAppliedTime;

    /**
     * 应用次数
     */
    @TableField(value = "monitor_sys_gen_server_setting_apply_count")
    @ApiModelProperty(value = "应用次数")
    @Schema(description = "应用次数")
    private Integer monitorSysGenServerSettingApplyCount;

    /**
     * 配置错误信息
     */
    @TableField(value = "monitor_sys_gen_server_setting_error_message")
    @ApiModelProperty(value = "配置错误信息")
    @Schema(description = "配置错误信息")
    private String monitorSysGenServerSettingErrorMessage;

    /**
     * 备注信息
     */
    @TableField(value = "monitor_sys_gen_server_setting_remark")
    @ApiModelProperty(value = "备注信息")
    @Schema(description = "备注信息")
    private String monitorSysGenServerSettingRemark;
}
