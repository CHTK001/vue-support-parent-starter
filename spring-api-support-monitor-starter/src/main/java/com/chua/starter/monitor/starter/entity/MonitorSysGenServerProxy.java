package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.common.support.database.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 服务器代理配置实体
 *
 * @author CH
 * @since 2024/12/25
 */
@EqualsAndHashCode(callSuper = true)
@Data
@Schema(description = "服务器代理配置")
@ApiModel(value = "MonitorSysGenServerProxy", description = "服务器代理配置")
@TableName("monitor_sys_gen_server_proxy")
public class MonitorSysGenServerProxy extends SysBase {

    /**
     * 代理ID
     */
    @Schema(description = "代理ID")
    @ApiModelProperty(value = "代理ID")
    @TableId(value = "monitor_sys_gen_server_proxy_id", type = IdType.AUTO)
    private Integer monitorSysGenServerProxyId;

    /**
     * 代理名称
     */
    @Schema(description = "代理名称")
    @ApiModelProperty(value = "代理名称")
    @TableField("monitor_sys_gen_server_proxy_name")
    private String monitorSysGenServerProxyName;

    /**
     * 代理类型 (HTTP, SOCKS4, SOCKS5)
     */
    @Schema(description = "代理类型")
    @ApiModelProperty(value = "代理类型")
    @TableField("monitor_sys_gen_server_proxy_type")
    private String monitorSysGenServerProxyType;

    /**
     * 代理主机地址
     */
    @Schema(description = "代理主机地址")
    @ApiModelProperty(value = "代理主机地址")
    @TableField("monitor_sys_gen_server_proxy_host")
    private String monitorSysGenServerProxyHost;

    /**
     * 代理端口
     */
    @Schema(description = "代理端口")
    @ApiModelProperty(value = "代理端口")
    @TableField("monitor_sys_gen_server_proxy_port")
    private Integer monitorSysGenServerProxyPort;

    /**
     * 代理用户名
     */
    @Schema(description = "代理用户名")
    @ApiModelProperty(value = "代理用户名")
    @TableField("monitor_sys_gen_server_proxy_username")
    private String monitorSysGenServerProxyUsername;

    /**
     * 代理密码
     */
    @Schema(description = "代理密码")
    @ApiModelProperty(value = "代理密码")
    @TableField("monitor_sys_gen_server_proxy_password")
    private String monitorSysGenServerProxyPassword;

    /**
     * 代理状态 (0-禁用, 1-启用)
     */
    @Schema(description = "代理状态")
    @ApiModelProperty(value = "代理状态")
    @TableField("monitor_sys_gen_server_proxy_status")
    private Integer monitorSysGenServerProxyStatus;

    /**
     * 代理描述
     */
    @Schema(description = "代理描述")
    @ApiModelProperty(value = "代理描述")
    @TableField("monitor_sys_gen_server_proxy_description")
    private String monitorSysGenServerProxyDescription;

    /**
     * 连接超时时间(毫秒)
     */
    @Schema(description = "连接超时时间")
    @ApiModelProperty(value = "连接超时时间")
    @TableField("monitor_sys_gen_server_proxy_timeout")
    private Integer monitorSysGenServerProxyTimeout;

    /**
     * 是否需要认证 (0-否, 1-是)
     */
    @Schema(description = "是否需要认证")
    @ApiModelProperty(value = "是否需要认证")
    @TableField("monitor_sys_gen_server_proxy_auth_required")
    private Integer monitorSysGenServerProxyAuthRequired;

    /**
     * 代理标签
     */
    @Schema(description = "代理标签")
    @ApiModelProperty(value = "代理标签")
    @TableField("monitor_sys_gen_server_proxy_tags")
    private String monitorSysGenServerProxyTags;

    /**
     * 最后测试时间
     */
    @Schema(description = "最后测试时间")
    @ApiModelProperty(value = "最后测试时间")
    @TableField("monitor_sys_gen_server_proxy_last_test_time")
    private Long monitorSysGenServerProxyLastTestTime;

    /**
     * 测试结果 (0-失败, 1-成功)
     */
    @Schema(description = "测试结果")
    @ApiModelProperty(value = "测试结果")
    @TableField("monitor_sys_gen_server_proxy_test_result")
    private Integer monitorSysGenServerProxyTestResult;

    /**
     * 测试延迟(毫秒)
     */
    @Schema(description = "测试延迟")
    @ApiModelProperty(value = "测试延迟")
    @TableField("monitor_sys_gen_server_proxy_test_latency")
    private Integer monitorSysGenServerProxyTestLatency;
}
