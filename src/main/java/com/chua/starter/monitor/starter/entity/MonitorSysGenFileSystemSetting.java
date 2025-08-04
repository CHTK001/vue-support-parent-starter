package com.chua.starter.monitor.starter.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.chua.starter.common.support.entity.SysBase;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 文件系统配置管理
 *
 * @author CH
 * @since 2025/01/11
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("monitor_sys_gen_file_system_setting")
@ApiModel(value = "MonitorSysGenFileSystemSetting", description = "文件系统配置管理")
@Schema(description = "文件系统配置管理")
public class MonitorSysGenFileSystemSetting extends SysBase {

    /**
     * 配置ID
     */
    @ApiModelProperty(value = "配置ID")
    @Schema(description = "配置ID")
    private Integer monitorSysGenFileSystemSettingId;

    /**
     * 配置键
     */
    @ApiModelProperty(value = "配置键")
    @Schema(description = "配置键")
    private String monitorSysGenFileSystemSettingKey;

    /**
     * 配置值
     */
    @ApiModelProperty(value = "配置值")
    @Schema(description = "配置值")
    private String monitorSysGenFileSystemSettingValue;

    /**
     * 配置类型 string/number/boolean/json
     */
    @ApiModelProperty(value = "配置类型")
    @Schema(description = "配置类型 string/number/boolean/json")
    private String monitorSysGenFileSystemSettingType;

    /**
     * 配置名称
     */
    @ApiModelProperty(value = "配置名称")
    @Schema(description = "配置名称")
    private String monitorSysGenFileSystemSettingName;

    /**
     * 配置描述
     */
    @ApiModelProperty(value = "配置描述")
    @Schema(description = "配置描述")
    private String monitorSysGenFileSystemSettingDescription;

    /**
     * 配置分组
     */
    @ApiModelProperty(value = "配置分组")
    @Schema(description = "配置分组")
    private String monitorSysGenFileSystemSettingGroup;

    /**
     * 是否启用 0:禁用 1:启用
     */
    @ApiModelProperty(value = "是否启用")
    @Schema(description = "是否启用 0:禁用 1:启用")
    private Integer monitorSysGenFileSystemSettingStatus;

    /**
     * 排序号
     */
    @ApiModelProperty(value = "排序号")
    @Schema(description = "排序号")
    private Integer monitorSysGenFileSystemSettingSort;

    /**
     * 默认值
     */
    @ApiModelProperty(value = "默认值")
    @Schema(description = "默认值")
    private String monitorSysGenFileSystemSettingDefaultValue;

    /**
     * 是否必填 0:否 1:是
     */
    @ApiModelProperty(value = "是否必填")
    @Schema(description = "是否必填 0:否 1:是")
    private Integer monitorSysGenFileSystemSettingRequired;

    /**
     * 验证规则
     */
    @ApiModelProperty(value = "验证规则")
    @Schema(description = "验证规则")
    private String monitorSysGenFileSystemSettingValidation;

    /**
     * 备注
     */
    @ApiModelProperty(value = "备注")
    @Schema(description = "备注")
    private String monitorSysGenFileSystemSettingRemark;
}
