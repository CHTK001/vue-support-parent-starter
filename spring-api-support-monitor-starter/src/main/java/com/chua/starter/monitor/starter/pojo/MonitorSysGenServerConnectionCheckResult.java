package com.chua.starter.monitor.starter.pojo;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 服务器连接检查结果
 *
 * @author CH
 * @since 2024/12/25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ApiModel(value = "MonitorSysGenServerConnectionCheckResult", description = "服务器连接检查结果")
@Schema(description = "服务器连接检查结果")
public class MonitorSysGenServerConnectionCheckResult {

    /**
     * 总服务器数量
     */
    @ApiModelProperty(value = "总服务器数量")
    @Schema(description = "总服务器数量")
    private Integer totalServers;

    /**
     * 检查时间
     */
    @ApiModelProperty(value = "检查时间")
    @Schema(description = "检查时间")
    private LocalDateTime checkTime;

    /**
     * 检查消息
     */
    @ApiModelProperty(value = "检查消息")
    @Schema(description = "检查消息")
    private String message;
}
