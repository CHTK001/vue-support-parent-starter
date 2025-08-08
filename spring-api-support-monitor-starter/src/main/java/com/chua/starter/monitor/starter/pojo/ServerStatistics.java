package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Map;

/**
 * 服务器统计信息实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@ApiModel(description = "服务器统计信息")
@Schema(description = "服务器统计信息")
@Data
public class ServerStatistics {

    /**
     * 总服务器数
     */
    @ApiModelProperty(value = "总服务器数")
    @Schema(description = "总服务器数")
    private Integer total;

    /**
     * 运行中的服务器数
     */
    @ApiModelProperty(value = "运行中的服务器数")
    @Schema(description = "运行中的服务器数")
    private Integer running;

    /**
     * 已停止的服务器数
     */
    @ApiModelProperty(value = "已停止的服务器数")
    @Schema(description = "已停止的服务器数")
    private Integer stopped;

    /**
     * 启动中的服务器数
     */
    @ApiModelProperty(value = "启动中的服务器数")
    @Schema(description = "启动中的服务器数")
    private Integer starting;

    /**
     * 停止中的服务器数
     */
    @ApiModelProperty(value = "停止中的服务器数")
    @Schema(description = "停止中的服务器数")
    private Integer stopping;

    /**
     * 异常的服务器数
     */
    @ApiModelProperty(value = "异常的服务器数")
    @Schema(description = "异常的服务器数")
    private Integer error;

    /**
     * 启用的服务器数
     */
    @ApiModelProperty(value = "启用的服务器数")
    @Schema(description = "启用的服务器数")
    private Integer enabled;

    /**
     * 禁用的服务器数
     */
    @ApiModelProperty(value = "禁用的服务器数")
    @Schema(description = "禁用的服务器数")
    private Integer disabled;

    /**
     * 自动启动的服务器数
     */
    @ApiModelProperty(value = "自动启动的服务器数")
    @Schema(description = "自动启动的服务器数")
    private Integer autoStart;

    /**
     * 按类型分组的服务器数量
     */
    @ApiModelProperty(value = "按类型分组的服务器数量")
    @Schema(description = "按类型分组的服务器数量")
    private Map<String, Integer> byType;

    /**
     * 按状态分组的服务器数量
     */
    @ApiModelProperty(value = "按状态分组的服务器数量")
    @Schema(description = "按状态分组的服务器数量")
    private Map<String, Integer> byStatus;

    /**
     * 按环境分组的服务器数量
     */
    @ApiModelProperty(value = "按环境分组的服务器数量")
    @Schema(description = "按环境分组的服务器数量")
    private Map<String, Integer> byEnvironment;

    /**
     * 平均运行时长（秒）
     */
    @ApiModelProperty(value = "平均运行时长")
    @Schema(description = "平均运行时长（秒）")
    private Long averageUptime;

    /**
     * 总运行时长（秒）
     */
    @ApiModelProperty(value = "总运行时长")
    @Schema(description = "总运行时长（秒）")
    private Long totalUptime;

    /**
     * 最长运行时长（秒）
     */
    @ApiModelProperty(value = "最长运行时长")
    @Schema(description = "最长运行时长（秒）")
    private Long maxUptime;

    /**
     * 最短运行时长（秒）
     */
    @ApiModelProperty(value = "最短运行时长")
    @Schema(description = "最短运行时长（秒）")
    private Long minUptime;

    /**
     * 总重启次数
     */
    @ApiModelProperty(value = "总重启次数")
    @Schema(description = "总重启次数")
    private Integer totalRestartCount;

    /**
     * 平均重启次数
     */
    @ApiModelProperty(value = "平均重启次数")
    @Schema(description = "平均重启次数")
    private Double averageRestartCount;

    /**
     * 健康服务器数（最近健康检查通过）
     */
    @ApiModelProperty(value = "健康服务器数")
    @Schema(description = "健康服务器数（最近健康检查通过）")
    private Integer healthy;

    /**
     * 不健康服务器数（最近健康检查失败）
     */
    @ApiModelProperty(value = "不健康服务器数")
    @Schema(description = "不健康服务器数（最近健康检查失败）")
    private Integer unhealthy;

    /**
     * 使用SSL的服务器数
     */
    @ApiModelProperty(value = "使用SSL的服务器数")
    @Schema(description = "使用SSL的服务器数")
    private Integer sslEnabled;

    /**
     * 未使用SSL的服务器数
     */
    @ApiModelProperty(value = "未使用SSL的服务器数")
    @Schema(description = "未使用SSL的服务器数")
    private Integer sslDisabled;

    /**
     * 统计时间
     */
    @ApiModelProperty(value = "统计时间")
    @Schema(description = "统计时间")
    private java.time.LocalDateTime statisticsTime;

    /**
     * 统计耗时（毫秒）
     */
    @ApiModelProperty(value = "统计耗时")
    @Schema(description = "统计耗时（毫秒）")
    private Long statisticsDuration;
}
