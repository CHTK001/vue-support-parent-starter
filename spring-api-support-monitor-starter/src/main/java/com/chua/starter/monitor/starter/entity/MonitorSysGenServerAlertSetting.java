package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.common.support.validator.group.AddGroup;
import com.chua.common.support.validator.group.UpdateGroup;
import com.chua.starter.mybatis.pojo.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 服务器告警设置实体类
 * 用于存储各种告警通知方式的配置参数
 *
 * @author CH
 * @since 2024/12/27
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "服务器告警设置")
@Schema(description = "服务器告警设置")
@Data
@TableName(value = "monitor_sys_gen_server_alert_setting")
public class MonitorSysGenServerAlertSetting extends SysBase {

    /**
     * 告警设置ID
     */
    @TableId(value = "monitor_sys_gen_server_alert_setting_id", type = IdType.AUTO)
    @ApiModelProperty(value = "告警设置ID")
    @Schema(description = "告警设置ID")
    @NotNull(message = "告警设置ID不能为空", groups = {UpdateGroup.class})
    private Long monitorSysGenServerAlertSettingId;

    /**
     * 服务器ID
     */
    @TableField(value = "monitor_sys_gen_server_id")
    @ApiModelProperty(value = "服务器ID")
    @Schema(description = "服务器ID")
    @NotNull(message = "服务器ID不能为空", groups = {AddGroup.class, UpdateGroup.class})
    private Integer monitorSysGenServerId;

    /**
     * 通知方式类型 (EMAIL、SMS、WEBHOOK、DINGTALK、WECHAT等)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_notification_type")
    @ApiModelProperty(value = "通知方式类型")
    @Schema(description = "通知方式类型")
    @NotBlank(message = "通知方式类型不能为空", groups = {AddGroup.class, UpdateGroup.class})
    @Size(max = 50, message = "通知方式类型最大长度要小于 50")
    private String monitorSysGenServerAlertSettingNotificationType;

    /**
     * 配置名称
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_name")
    @ApiModelProperty(value = "配置名称")
    @Schema(description = "配置名称")
    @NotBlank(message = "配置名称不能为空", groups = {AddGroup.class, UpdateGroup.class})
    @Size(max = 100, message = "配置名称最大长度要小于 100")
    private String monitorSysGenServerAlertSettingName;

    /**
     * 是否启用 0:否 1:是
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_enabled")
    @ApiModelProperty(value = "是否启用")
    @Schema(description = "是否启用")
    private Integer monitorSysGenServerAlertSettingEnabled;

    /**
     * 通知地址 (邮箱地址、手机号、Webhook URL等)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_address")
    @ApiModelProperty(value = "通知地址")
    @Schema(description = "通知地址")
    @Size(max = 500, message = "通知地址最大长度要小于 500")
    private String monitorSysGenServerAlertSettingAddress;

    /**
     * 配置参数 (JSON格式，存储各种通知方式的特定配置)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_config")
    @ApiModelProperty(value = "配置参数")
    @Schema(description = "配置参数 (JSON格式)")
    @Size(max = 2000, message = "配置参数最大长度要小于 2000")
    private String monitorSysGenServerAlertSettingConfig;

    /**
     * 优先级 (数字越小优先级越高)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_priority")
    @ApiModelProperty(value = "优先级")
    @Schema(description = "优先级 (数字越小优先级越高)")
    private Integer monitorSysGenServerAlertSettingPriority;

    /**
     * 发送频率限制 (每分钟最大发送次数，0表示无限制)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_rate_limit")
    @ApiModelProperty(value = "发送频率限制")
    @Schema(description = "发送频率限制 (每分钟最大发送次数)")
    private Integer monitorSysGenServerAlertSettingRateLimit;

    /**
     * 是否支持批量发送 0:否 1:是
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_batch_enabled")
    @ApiModelProperty(value = "是否支持批量发送")
    @Schema(description = "是否支持批量发送")
    private Integer monitorSysGenServerAlertSettingBatchEnabled;

    /**
     * 重试次数
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_retry_count")
    @ApiModelProperty(value = "重试次数")
    @Schema(description = "重试次数")
    private Integer monitorSysGenServerAlertSettingRetryCount;

    /**
     * 重试间隔 (秒)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_retry_interval")
    @ApiModelProperty(value = "重试间隔")
    @Schema(description = "重试间隔 (秒)")
    private Integer monitorSysGenServerAlertSettingRetryInterval;

    /**
     * 超时时间 (秒)
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_timeout")
    @ApiModelProperty(value = "超时时间")
    @Schema(description = "超时时间 (秒)")
    private Integer monitorSysGenServerAlertSettingTimeout;

    /**
     * 最后测试时间
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_last_test_time")
    @ApiModelProperty(value = "最后测试时间")
    @Schema(description = "最后测试时间")
    private java.time.LocalDateTime monitorSysGenServerAlertSettingLastTestTime;

    /**
     * 最后测试结果 0:失败 1:成功
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_last_test_result")
    @ApiModelProperty(value = "最后测试结果")
    @Schema(description = "最后测试结果")
    private Integer monitorSysGenServerAlertSettingLastTestResult;

    /**
     * 最后测试错误信息
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_last_test_error")
    @ApiModelProperty(value = "最后测试错误信息")
    @Schema(description = "最后测试错误信息")
    @Size(max = 1000, message = "最后测试错误信息最大长度要小于 1000")
    private String monitorSysGenServerAlertSettingLastTestError;

    /**
     * 备注
     */
    @TableField(value = "monitor_sys_gen_server_alert_setting_remark")
    @ApiModelProperty(value = "备注")
    @Schema(description = "备注")
    @Size(max = 500, message = "备注最大长度要小于 500")
    private String monitorSysGenServerAlertSettingRemark;

    /**
     * 判断是否启用
     */
    public boolean isEnabled() {
        return this.monitorSysGenServerAlertSettingEnabled != null && this.monitorSysGenServerAlertSettingEnabled == 1;
    }

    /**
     * 判断是否支持批量发送
     */
    public boolean isBatchEnabled() {
        return this.monitorSysGenServerAlertSettingBatchEnabled != null && this.monitorSysGenServerAlertSettingBatchEnabled == 1;
    }

    /**
     * 判断最后测试是否成功
     */
    public boolean isLastTestSuccessful() {
        return this.monitorSysGenServerAlertSettingLastTestResult != null && this.monitorSysGenServerAlertSettingLastTestResult == 1;
    }

    /**
     * 获取默认配置
     */
    public static MonitorSysGenServerAlertSetting getDefaultEmailSetting(Integer serverId) {
        MonitorSysGenServerAlertSetting setting = new MonitorSysGenServerAlertSetting();
        setting.setMonitorSysGenServerId(serverId);
        setting.setMonitorSysGenServerAlertSettingNotificationType("EMAIL");
        setting.setMonitorSysGenServerAlertSettingName("默认邮件通知");
        setting.setMonitorSysGenServerAlertSettingEnabled(1);
        setting.setMonitorSysGenServerAlertSettingPriority(1);
        setting.setMonitorSysGenServerAlertSettingRateLimit(10);
        setting.setMonitorSysGenServerAlertSettingBatchEnabled(1);
        setting.setMonitorSysGenServerAlertSettingRetryCount(3);
        setting.setMonitorSysGenServerAlertSettingRetryInterval(30);
        setting.setMonitorSysGenServerAlertSettingTimeout(30);
        return setting;
    }

    /**
     * 获取默认短信配置
     */
    public static MonitorSysGenServerAlertSetting getDefaultSmsSetting(Integer serverId) {
        MonitorSysGenServerAlertSetting setting = new MonitorSysGenServerAlertSetting();
        setting.setMonitorSysGenServerId(serverId);
        setting.setMonitorSysGenServerAlertSettingNotificationType("SMS");
        setting.setMonitorSysGenServerAlertSettingName("默认短信通知");
        setting.setMonitorSysGenServerAlertSettingEnabled(0);
        setting.setMonitorSysGenServerAlertSettingPriority(2);
        setting.setMonitorSysGenServerAlertSettingRateLimit(5);
        setting.setMonitorSysGenServerAlertSettingBatchEnabled(0);
        setting.setMonitorSysGenServerAlertSettingRetryCount(2);
        setting.setMonitorSysGenServerAlertSettingRetryInterval(60);
        setting.setMonitorSysGenServerAlertSettingTimeout(15);
        return setting;
    }
}
