package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * Filter配置项实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@ApiModel(description = "Filter配置项")
@Schema(description = "Filter配置项")
@Data
public class FilterConfigItem {

    /**
     * 配置项名称
     */
    @ApiModelProperty(value = "配置项名称", required = true)
    @Schema(description = "配置项名称", required = true)
    private String name;

    /**
     * 配置项类型：String、Integer、Boolean、Double、List、Object
     */
    @ApiModelProperty(value = "配置项类型", required = true)
    @Schema(description = "配置项类型：String、Integer、Boolean、Double、List、Object", required = true)
    private String type;

    /**
     * 配置项默认值
     */
    @ApiModelProperty(value = "配置项默认值")
    @Schema(description = "配置项默认值")
    private String defaultValue;

    /**
     * 配置项描述
     */
    @ApiModelProperty(value = "配置项描述")
    @Schema(description = "配置项描述")
    private String description;

    /**
     * 是否必填
     */
    @ApiModelProperty(value = "是否必填")
    @Schema(description = "是否必填")
    private Boolean required;

    /**
     * 验证规则
     */
    @ApiModelProperty(value = "验证规则")
    @Schema(description = "验证规则")
    private String validationRule;

    /**
     * 配置项分组
     */
    @ApiModelProperty(value = "配置项分组")
    @Schema(description = "配置项分组")
    private String group;

    /**
     * 配置项标签
     */
    @ApiModelProperty(value = "配置项标签")
    @Schema(description = "配置项标签")
    private List<String> tags;

    /**
     * 配置项顺序
     */
    @ApiModelProperty(value = "配置项顺序")
    @Schema(description = "配置项顺序")
    private Integer order;

    /**
     * 是否敏感信息
     */
    @ApiModelProperty(value = "是否敏感信息")
    @Schema(description = "是否敏感信息")
    private Boolean sensitive;

    /**
     * 是否只读
     */
    @ApiModelProperty(value = "是否只读")
    @Schema(description = "是否只读")
    private Boolean readonly;

    /**
     * 是否隐藏
     */
    @ApiModelProperty(value = "是否隐藏")
    @Schema(description = "是否隐藏")
    private Boolean hidden;

    /**
     * 最小值（数值类型）
     */
    @ApiModelProperty(value = "最小值")
    @Schema(description = "最小值（数值类型）")
    private String minValue;

    /**
     * 最大值（数值类型）
     */
    @ApiModelProperty(value = "最大值")
    @Schema(description = "最大值（数值类型）")
    private String maxValue;

    /**
     * 最小长度（字符串类型）
     */
    @ApiModelProperty(value = "最小长度")
    @Schema(description = "最小长度（字符串类型）")
    private Integer minLength;

    /**
     * 最大长度（字符串类型）
     */
    @ApiModelProperty(value = "最大长度")
    @Schema(description = "最大长度（字符串类型）")
    private Integer maxLength;

    /**
     * 正则表达式（字符串类型）
     */
    @ApiModelProperty(value = "正则表达式")
    @Schema(description = "正则表达式（字符串类型）")
    private String pattern;

    /**
     * 可选值列表
     */
    @ApiModelProperty(value = "可选值列表")
    @Schema(description = "可选值列表")
    private List<String> options;

    /**
     * 可选值标签映射
     */
    @ApiModelProperty(value = "可选值标签映射")
    @Schema(description = "可选值标签映射")
    private java.util.Map<String, String> optionLabels;

    /**
     * 依赖的配置项
     */
    @ApiModelProperty(value = "依赖的配置项")
    @Schema(description = "依赖的配置项")
    private List<String> dependencies;

    /**
     * 依赖条件
     */
    @ApiModelProperty(value = "依赖条件")
    @Schema(description = "依赖条件")
    private String dependencyCondition;

    /**
     * 配置项单位
     */
    @ApiModelProperty(value = "配置项单位")
    @Schema(description = "配置项单位")
    private String unit;

    /**
     * 配置项格式
     */
    @ApiModelProperty(value = "配置项格式")
    @Schema(description = "配置项格式")
    private String format;

    /**
     * 配置项示例
     */
    @ApiModelProperty(value = "配置项示例")
    @Schema(description = "配置项示例")
    private String example;

    /**
     * 配置项帮助文档URL
     */
    @ApiModelProperty(value = "配置项帮助文档URL")
    @Schema(description = "配置项帮助文档URL")
    private String helpUrl;

    /**
     * 配置项提示信息
     */
    @ApiModelProperty(value = "配置项提示信息")
    @Schema(description = "配置项提示信息")
    private String placeholder;

    /**
     * 配置项错误信息
     */
    @ApiModelProperty(value = "配置项错误信息")
    @Schema(description = "配置项错误信息")
    private String errorMessage;

    /**
     * 配置项警告信息
     */
    @ApiModelProperty(value = "配置项警告信息")
    @Schema(description = "配置项警告信息")
    private String warningMessage;
}
