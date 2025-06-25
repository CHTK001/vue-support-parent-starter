package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 服务器连接状态统计信息
 *
 * @author CH
 * @since 2024/12/25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "MonitorSysGenServerConnectionStatistics", description = "服务器连接状态统计信息")
@Schema(description = "服务器连接状态统计信息")
public class MonitorSysGenServerConnectionStatistics {

    /**
     * 总服务器数量
     */
    @ApiModelProperty(value = "总服务器数量")
    @Schema(description = "总服务器数量")
    private Integer total;

    /**
     * 在线服务器数量
     */
    @ApiModelProperty(value = "在线服务器数量")
    @Schema(description = "在线服务器数量")
    private Integer online;

    /**
     * 离线服务器数量
     */
    @ApiModelProperty(value = "离线服务器数量")
    @Schema(description = "离线服务器数量")
    private Integer offline;

    /**
     * 连接中服务器数量
     */
    @ApiModelProperty(value = "连接中服务器数量")
    @Schema(description = "连接中服务器数量")
    private Integer connecting;

    /**
     * 连接失败服务器数量
     */
    @ApiModelProperty(value = "连接失败服务器数量")
    @Schema(description = "连接失败服务器数量")
    private Integer failed;

    /**
     * 在线率（百分比）
     */
    @ApiModelProperty(value = "在线率（百分比）")
    @Schema(description = "在线率（百分比）")
    private Double onlineRate;
}
