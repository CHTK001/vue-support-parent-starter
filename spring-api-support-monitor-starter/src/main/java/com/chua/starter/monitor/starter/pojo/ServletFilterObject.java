package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * ServletFilter对象实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@ApiModel(description = "ServletFilter对象")
@Schema(description = "ServletFilter对象")
@Data
public class ServletFilterObject {

    /**
     * Filter类型
     */
    @ApiModelProperty(value = "Filter类型", required = true)
    @Schema(description = "Filter类型", required = true)
    private String type;

    /**
     * Filter名称
     */
    @ApiModelProperty(value = "Filter名称", required = true)
    @Schema(description = "Filter名称", required = true)
    private String name;

    /**
     * Filter描述
     */
    @ApiModelProperty(value = "Filter描述")
    @Schema(description = "Filter描述")
    private String description;

    /**
     * Filter类名
     */
    @ApiModelProperty(value = "Filter类名", required = true)
    @Schema(description = "Filter类名", required = true)
    private String className;

    /**
     * Filter版本
     */
    @ApiModelProperty(value = "Filter版本")
    @Schema(description = "Filter版本")
    private String version;

    /**
     * Filter分组
     */
    @ApiModelProperty(value = "Filter分组")
    @Schema(description = "Filter分组")
    private String group;

    /**
     * Filter作者
     */
    @ApiModelProperty(value = "Filter作者")
    @Schema(description = "Filter作者")
    private String author;

    /**
     * Filter标签
     */
    @ApiModelProperty(value = "Filter标签")
    @Schema(description = "Filter标签")
    private List<String> tags;

    /**
     * Filter优先级
     */
    @ApiModelProperty(value = "Filter优先级")
    @Schema(description = "Filter优先级")
    private Integer priority;

    /**
     * 是否启用
     */
    @ApiModelProperty(value = "是否启用")
    @Schema(description = "是否启用")
    private Boolean enabled;

    /**
     * 配置项列表
     */
    @ApiModelProperty(value = "配置项列表")
    @Schema(description = "配置项列表")
    private List<FilterConfigItem> configItems;

    /**
     * Filter依赖
     */
    @ApiModelProperty(value = "Filter依赖")
    @Schema(description = "Filter依赖")
    private List<String> dependencies;

    /**
     * Filter文档URL
     */
    @ApiModelProperty(value = "Filter文档URL")
    @Schema(description = "Filter文档URL")
    private String documentUrl;

    /**
     * Filter示例配置
     */
    @ApiModelProperty(value = "Filter示例配置")
    @Schema(description = "Filter示例配置")
    private String exampleConfig;

    /**
     * 支持的协议
     */
    @ApiModelProperty(value = "支持的协议")
    @Schema(description = "支持的协议")
    private List<String> supportedProtocols;

    /**
     * 最小版本要求
     */
    @ApiModelProperty(value = "最小版本要求")
    @Schema(description = "最小版本要求")
    private String minVersion;

    /**
     * 最大版本要求
     */
    @ApiModelProperty(value = "最大版本要求")
    @Schema(description = "最大版本要求")
    private String maxVersion;

    /**
     * 是否实验性功能
     */
    @ApiModelProperty(value = "是否实验性功能")
    @Schema(description = "是否实验性功能")
    private Boolean experimental;

    /**
     * 是否已弃用
     */
    @ApiModelProperty(value = "是否已弃用")
    @Schema(description = "是否已弃用")
    private Boolean deprecated;

    /**
     * 弃用原因
     */
    @ApiModelProperty(value = "弃用原因")
    @Schema(description = "弃用原因")
    private String deprecatedReason;

    /**
     * 替代方案
     */
    @ApiModelProperty(value = "替代方案")
    @Schema(description = "替代方案")
    private String alternative;

    /**
     * 许可证
     */
    @ApiModelProperty(value = "许可证")
    @Schema(description = "许可证")
    private String license;

    /**
     * 创建时间
     */
    @ApiModelProperty(value = "创建时间")
    @Schema(description = "创建时间")
    private java.time.LocalDateTime createTime;

    /**
     * 更新时间
     */
    @ApiModelProperty(value = "更新时间")
    @Schema(description = "更新时间")
    private java.time.LocalDateTime updateTime;
}
