package com.chua.starter.monitor.entity;

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
 * 系统服务器实体类
 *
 * @author CH
 * @since 2025/01/07
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "系统服务器")
@Schema(description = "系统服务器")
@Data
@TableName(value = "system_server")
public class SystemServer extends SysBase {

    /**
     * 系统服务器ID
     */
    @TableId(value = "system_server_id", type = IdType.AUTO)
    @ApiModelProperty(value = "系统服务器ID")
    @Schema(description = "系统服务器ID")
    @NotNull(message = "服务器ID不能为空", groups = { UpdateGroup.class })
    private Integer systemServerId;

    /**
     * 系统服务器名称
     */
    @TableField(value = "system_server_name")
    @ApiModelProperty(value = "系统服务器名称")
    @Schema(description = "系统服务器名称")
    @NotBlank(message = "服务器名称不能为空", groups = { AddGroup.class, UpdateGroup.class })
    @Size(max = 255, message = "服务器名称最大长度要小于 255")
    private String systemServerName;

    /**
     * 系统服务器端口
     */
    @TableField(value = "system_server_port")
    @ApiModelProperty(value = "系统服务器端口")
    @Schema(description = "系统服务器端口")
    @NotNull(message = "端口号不能为空", groups = { AddGroup.class, UpdateGroup.class })
    private Integer systemServerPort;

    /**
     * 系统服务器类型
     */
    @TableField(value = "system_server_type")
    @ApiModelProperty(value = "系统服务器类型")
    @Schema(description = "系统服务器类型")
    @NotBlank(message = "服务器类型不能为空", groups = { AddGroup.class, UpdateGroup.class })
    @Size(max = 50, message = "服务器类型最大长度要小于 50")
    private String systemServerType;

    /**
     * 系统服务器状态
     */
    @TableField(value = "system_server_status")
    @ApiModelProperty(value = "系统服务器状态")
    @Schema(description = "系统服务器状态")
    @Size(max = 20, message = "服务器状态最大长度要小于 20")
    private String systemServerStatus;

    /**
     * 系统服务器描述
     */
    @TableField(value = "system_server_description")
    @ApiModelProperty(value = "系统服务器描述")
    @Schema(description = "系统服务器描述")
    @Size(max = 500, message = "服务器描述最大长度要小于 500")
    private String systemServerDescription;

    /**
     * 系统服务器配置
     */
    @TableField(value = "system_server_config")
    @ApiModelProperty(value = "系统服务器配置")
    @Schema(description = "系统服务器配置")
    private String systemServerConfig;

    /**
     * 系统服务器自动启动
     */
    @TableField(value = "system_server_auto_start")
    @ApiModelProperty(value = "系统服务器自动启动")
    @Schema(description = "系统服务器自动启动")
    private Boolean systemServerAutoStart;

    /**
     * 系统服务器最大连接数
     */
    @TableField(value = "system_server_max_connections")
    @ApiModelProperty(value = "系统服务器最大连接数")
    @Schema(description = "系统服务器最大连接数")
    private Integer systemServerMaxConnections;

    /**
     * 系统服务器超时时间
     */
    @TableField(value = "system_server_timeout")
    @ApiModelProperty(value = "系统服务器超时时间")
    @Schema(description = "系统服务器超时时间")
    private Integer systemServerTimeout;

    /**
     * 系统服务器启用状态
     */
    @TableField(value = "system_server_enabled")
    @ApiModelProperty(value = "系统服务器启用状态")
    @Schema(description = "系统服务器启用状态")
    private Integer systemServerEnabled;

    /**
     * 系统服务器分组ID
     */
    @TableField(value = "system_server_group_id")
    @ApiModelProperty(value = "系统服务器分组ID")
    @Schema(description = "系统服务器分组ID")
    private Integer systemServerGroupId;

    /**
     * 系统服务器标签
     */
    @TableField(value = "system_server_tags")
    @ApiModelProperty(value = "系统服务器标签")
    @Schema(description = "系统服务器标签")
    @Size(max = 500, message = "服务器标签最大长度要小于 500")
    private String systemServerTags;

    /**
     * 系统服务器优先级
     */
    @TableField(value = "system_server_priority")
    @ApiModelProperty(value = "系统服务器优先级")
    @Schema(description = "系统服务器优先级")
    private Integer systemServerPriority;

    /**
     * 系统服务器环境
     */
    @TableField(value = "system_server_environment")
    @ApiModelProperty(value = "系统服务器环境")
    @Schema(description = "系统服务器环境")
    @Size(max = 50, message = "服务器环境最大长度要小于 50")
    private String systemServerEnvironment;

    /**
     * 系统服务器版本
     */
    @TableField(value = "system_server_version")
    @ApiModelProperty(value = "系统服务器版本")
    @Schema(description = "系统服务器版本")
    @Size(max = 100, message = "服务器版本最大长度要小于 100")
    private String systemServerVersion;

    /**
     * 系统服务器主目录
     */
    @TableField(value = "system_server_home_directory")
    @ApiModelProperty(value = "系统服务器主目录")
    @Schema(description = "系统服务器主目录")
    @Size(max = 500, message = "服务器主目录最大长度要小于 500")
    private String systemServerHomeDirectory;

    /**
     * 系统服务器日志目录
     */
    @TableField(value = "system_server_log_directory")
    @ApiModelProperty(value = "系统服务器日志目录")
    @Schema(description = "系统服务器日志目录")
    @Size(max = 500, message = "服务器日志目录最大长度要小于 500")
    private String systemServerLogDirectory;

    /**
     * 系统服务器启动命令
     */
    @TableField(value = "system_server_start_command")
    @ApiModelProperty(value = "系统服务器启动命令")
    @Schema(description = "系统服务器启动命令")
    @Size(max = 1000, message = "服务器启动命令最大长度要小于 1000")
    private String systemServerStartCommand;

    /**
     * 系统服务器停止命令
     */
    @TableField(value = "system_server_stop_command")
    @ApiModelProperty(value = "系统服务器停止命令")
    @Schema(description = "系统服务器停止命令")
    @Size(max = 1000, message = "服务器停止命令最大长度要小于 1000")
    private String systemServerStopCommand;

    /**
     * 系统服务器重启命令
     */
    @TableField(value = "system_server_restart_command")
    @ApiModelProperty(value = "系统服务器重启命令")
    @Schema(description = "系统服务器重启命令")
    @Size(max = 1000, message = "服务器重启命令最大长度要小于 1000")
    private String systemServerRestartCommand;

    /**
     * 系统服务器健康检查URL
     */
    @TableField(value = "system_server_health_check_url")
    @ApiModelProperty(value = "系统服务器健康检查URL")
    @Schema(description = "系统服务器健康检查URL")
    @Size(max = 500, message = "服务器健康检查URL最大长度要小于 500")
    private String systemServerHealthCheckUrl;

    /**
     * 系统服务器健康检查间隔
     */
    @TableField(value = "system_server_health_check_interval")
    @ApiModelProperty(value = "系统服务器健康检查间隔")
    @Schema(description = "系统服务器健康检查间隔")
    private Integer systemServerHealthCheckInterval;

    /**
     * 系统服务器健康检查启用状态
     */
    @TableField(value = "system_server_health_check_enabled")
    @ApiModelProperty(value = "系统服务器健康检查启用状态")
    @Schema(description = "系统服务器健康检查启用状态")
    private Boolean systemServerHealthCheckEnabled;

    /**
     * 系统服务器备注
     */
    @TableField(value = "system_server_remark")
    @ApiModelProperty(value = "系统服务器备注")
    @Schema(description = "系统服务器备注")
    @Size(max = 1000, message = "服务器备注最大长度要小于 1000")
    private String systemServerRemark;

    /**
     * 系统服务器排序
     */
    @TableField(value = "system_server_sort_order")
    @ApiModelProperty(value = "系统服务器排序")
    @Schema(description = "系统服务器排序")
    private Integer systemServerSortOrder;

    /**
     * 获取默认服务器配置
     */
    public static SystemServer getDefaultServer() {
        SystemServer server = new SystemServer();
        server.setSystemServerStatus("STOPPED");
        server.setSystemServerEnabled(1);
        server.setSystemServerAutoStart(false);
        server.setSystemServerEnvironment("DEV");
        server.setSystemServerPriority(0);
        server.setSystemServerSortOrder(0);
        server.setSystemServerTimeout(30000);
        server.setSystemServerMaxConnections(100);
        server.setSystemServerHealthCheckEnabled(false);
        server.setSystemServerHealthCheckInterval(30);
        return server;
    }
}
