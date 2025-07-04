package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.*;
import com.chua.starter.mybatis.pojo.SysBase;
import com.chua.starter.mybatis.utils.UpdateGroup;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * 服务器组件配置实体类
 *
 * @author CH
 * @since 2025/01/03
 */
@EqualsAndHashCode(callSuper = true)
@ApiModel(description = "服务器组件配置")
@Schema(description = "服务器组件配置")
@Data
@TableName(value = "monitor_sys_gen_server_component")
public class MonitorSysGenServerComponent extends SysBase implements Serializable {

    private static final long serialVersionUID = 1L;

    @TableId(value = "monitor_sys_gen_server_component_id", type = IdType.AUTO)
    @ApiModelProperty(value = "组件配置ID")
    @Schema(description = "组件配置ID")
    @NotNull(message = "组件ID不能为空", groups = {UpdateGroup.class})
    private Integer monitorSysGenServerComponentId;

    /**
     * 关联服务器ID
     */
    @TableField(value = "monitor_sys_gen_server_id")
    @ApiModelProperty(value = "关联服务器ID")
    @Schema(description = "关联服务器ID")
    @NotNull(message = "服务器ID不能为空")
    private Integer monitorSysGenServerId;

    /**
     * 组件名称
     */
    @TableField(value = "monitor_sys_gen_server_component_name")
    @ApiModelProperty(value = "组件名称")
    @Schema(description = "组件名称")
    @NotNull(message = "组件名称不能为空")
    @Size(max = 100, message = "组件名称最大长度要小于 100")
    private String monitorSysGenServerComponentName;

    /**
     * 组件类型 (cpu, memory, disk, network, system)
     */
    @TableField(value = "monitor_sys_gen_server_component_type")
    @ApiModelProperty(value = "组件类型")
    @Schema(description = "组件类型")
    @NotNull(message = "组件类型不能为空")
    @Size(max = 50, message = "组件类型最大长度要小于 50")
    private String monitorSysGenServerComponentType;

    /**
     * 组件配置 (JSON格式)
     */
    @TableField(value = "monitor_sys_gen_server_component_config")
    @ApiModelProperty(value = "组件配置")
    @Schema(description = "组件配置")
    @Size(max = 2000, message = "组件配置最大长度要小于 2000")
    private String monitorSysGenServerComponentConfig;

    /**
     * 组件位置信息 (JSON格式: {x, y, w, h, i})
     */
    @TableField(value = "monitor_sys_gen_server_component_position")
    @ApiModelProperty(value = "组件位置信息")
    @Schema(description = "组件位置信息")
    @Size(max = 500, message = "组件位置信息最大长度要小于 500")
    private String monitorSysGenServerComponentPosition;

    /**
     * 是否共享 0:否 1:是
     */
    @TableField(value = "monitor_sys_gen_server_component_shared")
    @ApiModelProperty(value = "是否共享")
    @Schema(description = "是否共享")
    private Integer monitorSysGenServerComponentShared;

    /**
     * 共享来源服务器ID (当组件为共享组件时)
     */
    @TableField(value = "monitor_sys_gen_server_component_source_server_id")
    @ApiModelProperty(value = "共享来源服务器ID")
    @Schema(description = "共享来源服务器ID")
    private Integer monitorSysGenServerComponentSourceServerId;

    /**
     * 刷新间隔 (秒)
     */
    @TableField(value = "monitor_sys_gen_server_component_refresh_interval")
    @ApiModelProperty(value = "刷新间隔")
    @Schema(description = "刷新间隔")
    private Integer monitorSysGenServerComponentRefreshInterval;

    /**
     * 组件状态 0:停用 1:启用
     */
    @TableField(value = "monitor_sys_gen_server_component_status")
    @ApiModelProperty(value = "组件状态")
    @Schema(description = "组件状态")
    private Integer monitorSysGenServerComponentStatus;

    /**
     * 组件描述
     */
    @TableField(value = "monitor_sys_gen_server_component_description")
    @ApiModelProperty(value = "组件描述")
    @Schema(description = "组件描述")
    @Size(max = 500, message = "组件描述最大长度要小于 500")
    private String monitorSysGenServerComponentDescription;

    /**
     * 是否为固定组件 0:否 1:是 (固定组件不能删除)
     */
    @TableField(value = "monitor_sys_gen_server_component_fixed")
    @ApiModelProperty(value = "是否为固定组件")
    @Schema(description = "是否为固定组件")
    private Integer monitorSysGenServerComponentFixed;

    /**
     * 组件排序
     */
    @TableField(value = "monitor_sys_gen_server_component_sort")
    @ApiModelProperty(value = "组件排序")
    @Schema(description = "组件排序")
    private Integer monitorSysGenServerComponentSort;
}
