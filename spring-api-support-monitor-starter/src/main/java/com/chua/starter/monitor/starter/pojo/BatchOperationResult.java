package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 批量操作结果实体类
 * 
 * @author CH
 * @since 2025/01/17
 */
@ApiModel(description = "批量操作结果")
@Schema(description = "批量操作结果")
@Data
public class BatchOperationResult {

    /**
     * 总数
     */
    @ApiModelProperty(value = "总数")
    @Schema(description = "总数")
    private Integer total;

    /**
     * 成功数
     */
    @ApiModelProperty(value = "成功数")
    @Schema(description = "成功数")
    private Integer success;

    /**
     * 失败数
     */
    @ApiModelProperty(value = "失败数")
    @Schema(description = "失败数")
    private Integer fail;

    /**
     * 跳过数
     */
    @ApiModelProperty(value = "跳过数")
    @Schema(description = "跳过数")
    private Integer skip;

    /**
     * 操作类型
     */
    @ApiModelProperty(value = "操作类型")
    @Schema(description = "操作类型")
    private String operation;

    /**
     * 成功的ID列表
     */
    @ApiModelProperty(value = "成功的ID列表")
    @Schema(description = "成功的ID列表")
    private List<Integer> successIds;

    /**
     * 失败的ID列表
     */
    @ApiModelProperty(value = "失败的ID列表")
    @Schema(description = "失败的ID列表")
    private List<Integer> failIds;

    /**
     * 跳过的ID列表
     */
    @ApiModelProperty(value = "跳过的ID列表")
    @Schema(description = "跳过的ID列表")
    private List<Integer> skipIds;

    /**
     * 错误信息映射（ID -> 错误信息）
     */
    @ApiModelProperty(value = "错误信息映射")
    @Schema(description = "错误信息映射（ID -> 错误信息）")
    private Map<Integer, String> errorMessages;

    /**
     * 操作开始时间
     */
    @ApiModelProperty(value = "操作开始时间")
    @Schema(description = "操作开始时间")
    private java.time.LocalDateTime startTime;

    /**
     * 操作结束时间
     */
    @ApiModelProperty(value = "操作结束时间")
    @Schema(description = "操作结束时间")
    private java.time.LocalDateTime endTime;

    /**
     * 操作耗时（毫秒）
     */
    @ApiModelProperty(value = "操作耗时")
    @Schema(description = "操作耗时（毫秒）")
    private Long duration;

    /**
     * 操作详情
     */
    @ApiModelProperty(value = "操作详情")
    @Schema(description = "操作详情")
    private String details;

    /**
     * 操作人
     */
    @ApiModelProperty(value = "操作人")
    @Schema(description = "操作人")
    private String operator;

    /**
     * 是否全部成功
     */
    @ApiModelProperty(value = "是否全部成功")
    @Schema(description = "是否全部成功")
    public Boolean isAllSuccess() {
        return fail != null && fail == 0;
    }

    /**
     * 成功率
     */
    @ApiModelProperty(value = "成功率")
    @Schema(description = "成功率")
    public Double getSuccessRate() {
        if (total == null || total == 0) {
            return 0.0;
        }
        return success != null ? (double) success / total : 0.0;
    }

    /**
     * 失败率
     */
    @ApiModelProperty(value = "失败率")
    @Schema(description = "失败率")
    public Double getFailRate() {
        if (total == null || total == 0) {
            return 0.0;
        }
        return fail != null ? (double) fail / total : 0.0;
    }
}
