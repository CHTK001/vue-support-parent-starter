package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.pojo.UrlRequestReportDTO;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 服务器数据上报控制器
 * 
 * <p>该控制器负责处理各种数据上报功能，包括：</p>
 * <ul>
 *   <li>URL请求数据上报</li>
 *   <li>API数据上报</li>
 *   <li>系统指标数据上报</li>
 *   <li>上报数据查询和统计</li>
 * </ul>
 *
 * @author CH
 * @since 2025/01/03
 * @version 1.0
 */
@RestController
@RequestMapping("v1/gen/server/report")
@Tag(name = "服务器数据上报管理")
@RequiredArgsConstructor
@Slf4j
public class MonitorSysGenServerReportController {

    private final MonitorSysGenServerReportService reportService;

    /**
     * URL请求数据上报
     * 
     * @param reportData URL请求上报数据，包含请求方法、URL、客户端IP等信息
     * @return 上报操作的结果，true表示上报成功，false表示上报失败
     * @throws IllegalArgumentException 当上报数据为空或格式不正确时抛出
     * @since 2025/01/03
     */
    @PostMapping("/url")
    @Operation(summary = "URL请求数据上报", description = "上报URL请求访问数据到Redis时序存储")
    public ReturnResult<Boolean> reportUrlRequest(
            @Parameter(description = "URL请求上报数据", required = true)
            @RequestBody UrlRequestReportDTO reportData) {
        log.info("开始处理URL请求数据上报, method: {}, url: {}, clientIp: {}", 
            reportData.getMethod(), reportData.getUrl(), reportData.getClientIp());
        
        try {
            if (reportData == null) {
                log.warn("URL请求数据上报失败, 上报数据为空");
                return ReturnResult.error("上报数据不能为空");
            }
            
            ReturnResult<Boolean> result = reportService.reportUrlRequest(reportData);
            log.info("URL请求数据上报成功, method: {}, url: {}, 处理结果: {}", 
                reportData.getMethod(), reportData.getUrl(), result.isSuccess());
            return result;
        } catch (Exception e) {
            log.error("URL请求数据上报失败, method: {}, url: {}", 
                reportData.getMethod(), reportData.getUrl(), e);
            throw e;
        }
    }

    /**
     * 查询URL请求数据（支持时间范围）
     * 
     * @param serverId 服务器ID，用于过滤特定服务器的数据
     * @param startTime 开始时间（Unix时间戳，秒），可选参数
     * @param endTime 结束时间（Unix时间戳，秒），可选参数
     * @param limit 返回数据条数限制，默认为100
     * @return 返回指定时间范围内的URL请求数据列表
     * @since 2025/01/03
     */
    @GetMapping("/url/query")
    @Operation(summary = "查询URL请求数据", description = "根据时间范围查询URL请求上报数据")
    public ReturnResult<List<Map<String, Object>>> queryUrlRequestData(
            @Parameter(description = "服务器ID") @RequestParam(required = false) Integer serverId,
            @Parameter(description = "开始时间（时间戳，秒）") @RequestParam(required = false) Long startTime,
            @Parameter(description = "结束时间（时间戳，秒）") @RequestParam(required = false) Long endTime,
            @Parameter(description = "返回数据条数限制") @RequestParam(defaultValue = "100") Integer limit) {
        log.info("开始查询URL请求数据, serverId: {}, startTime: {}, endTime: {}, limit: {}", 
            serverId, startTime, endTime, limit);
        
        try {
            ReturnResult<List<Map<String, Object>>> result = reportService.queryUrlRequestData(
                serverId, startTime, endTime, limit);
            log.info("查询URL请求数据成功, serverId: {}, 数据条数: {}", serverId, 
                result.isSuccess() && result.getData() != null ? result.getData().size() : 0);
            return result;
        } catch (Exception e) {
            log.error("查询URL请求数据失败, serverId: {}, startTime: {}, endTime: {}", 
                serverId, startTime, endTime, e);
            throw e;
        }
    }

    /**
     * 获取URL请求统计数据
     * 
     * @param serverId 服务器ID，用于过滤特定服务器的数据
     * @param startTime 开始时间（Unix时间戳，秒），可选参数
     * @param endTime 结束时间（Unix时间戳，秒），可选参数
     * @return 返回URL请求的统计信息，包括总请求数、成功率、平均响应时间等
     * @since 2025/01/03
     */
    @GetMapping("/url/statistics")
    @Operation(summary = "获取URL请求统计数据", description = "获取URL请求的统计信息")
    public ReturnResult<Map<String, Object>> getUrlRequestStatistics(
            @Parameter(description = "服务器ID") @RequestParam(required = false) Integer serverId,
            @Parameter(description = "开始时间（时间戳，秒）") @RequestParam(required = false) Long startTime,
            @Parameter(description = "结束时间（时间戳，秒）") @RequestParam(required = false) Long endTime) {
        log.info("开始获取URL请求统计数据, serverId: {}, startTime: {}, endTime: {}", 
            serverId, startTime, endTime);
        
        try {
            ReturnResult<Map<String, Object>> result = reportService.getUrlRequestStatistics(
                serverId, startTime, endTime);
            log.info("获取URL请求统计数据成功, serverId: {}", serverId);
            return result;
        } catch (Exception e) {
            log.error("获取URL请求统计数据失败, serverId: {}, startTime: {}, endTime: {}", 
                serverId, startTime, endTime, e);
            throw e;
        }
    }

    /**
     * 批量上报API数据
     * 
     * @param reportDataList API数据上报列表
     * @return 批量上报操作的结果
     * @since 2025/01/03
     */
    @PostMapping("/api/batch")
    @Operation(summary = "批量上报API数据", description = "批量上报API访问数据")
    public ReturnResult<Boolean> batchReportApiData(
            @Parameter(description = "API数据上报列表", required = true)
            @RequestBody List<Map<String, Object>> reportDataList) {
        log.info("开始批量上报API数据, 数据条数: {}", reportDataList != null ? reportDataList.size() : 0);
        
        try {
            if (reportDataList == null || reportDataList.isEmpty()) {
                log.warn("批量上报API数据失败, 上报数据为空");
                return ReturnResult.error("上报数据不能为空");
            }
            
            ReturnResult<Boolean> result = reportService.batchReportApiData(reportDataList);
            log.info("批量上报API数据成功, 数据条数: {}, 处理结果: {}", 
                reportDataList.size(), result.isSuccess());
            return result;
        } catch (Exception e) {
            log.error("批量上报API数据失败, 数据条数: {}", 
                reportDataList != null ? reportDataList.size() : 0, e);
            throw e;
        }
    }

    /**
     * 清理过期的上报数据
     * 
     * @param retentionDays 数据保留天数，超过此天数的数据将被清理
     * @return 清理操作的结果，包含清理的数据条数
     * @since 2025/01/03
     */
    @DeleteMapping("/cleanup")
    @Operation(summary = "清理过期上报数据", description = "清理超过保留期限的上报数据")
    public ReturnResult<Map<String, Object>> cleanupExpiredData(
            @Parameter(description = "数据保留天数") @RequestParam(defaultValue = "30") Integer retentionDays) {
        log.info("开始清理过期上报数据, 保留天数: {}", retentionDays);
        
        try {
            ReturnResult<Map<String, Object>> result = reportService.cleanupExpiredData(retentionDays);
            log.info("清理过期上报数据成功, 保留天数: {}", retentionDays);
            return result;
        } catch (Exception e) {
            log.error("清理过期上报数据失败, 保留天数: {}", retentionDays, e);
            throw e;
        }
    }
}
