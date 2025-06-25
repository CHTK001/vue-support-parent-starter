package com.chua.starter.monitor.starter.pojo;

import com.chua.starter.monitor.starter.entity.MonitorSysGenServerConnectionStatus;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 服务器连接健康度报告
 *
 * @author CH
 * @since 2024/12/25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "MonitorSysGenServerConnectionHealthReport", description = "服务器连接健康度报告")
@Schema(description = "服务器连接健康度报告")
public class MonitorSysGenServerConnectionHealthReport {

    /**
     * 统计信息
     */
    @ApiModelProperty(value = "统计信息")
    @Schema(description = "统计信息")
    private MonitorSysGenServerConnectionStatistics statistics;

    /**
     * 长时间未连接的服务器列表
     */
    @ApiModelProperty(value = "长时间未连接的服务器列表")
    @Schema(description = "长时间未连接的服务器列表")
    private List<MonitorSysGenServerConnectionStatus> longTimeNoConnectServers;

    /**
     * 连接失败的服务器列表
     */
    @ApiModelProperty(value = "连接失败的服务器列表")
    @Schema(description = "连接失败的服务器列表")
    private List<MonitorSysGenServerConnectionStatus> failedServers;

    /**
     * 报告生成时间
     */
    @ApiModelProperty(value = "报告生成时间")
    @Schema(description = "报告生成时间")
    private LocalDateTime reportTime;
}
