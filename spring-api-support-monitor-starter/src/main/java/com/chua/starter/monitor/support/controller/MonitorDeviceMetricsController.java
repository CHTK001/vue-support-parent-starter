package com.chua.starter.monitor.support.controller;

import com.chua.common.support.annotations.ApiJSDoc;
import com.chua.common.support.protocol.request.PageRequest;
import com.chua.common.support.protocol.response.Response;
import com.chua.common.support.protocol.response.ResponseUtils;
import com.chua.starter.monitor.support.entity.MonitorDeviceMetrics;
import com.chua.starter.monitor.support.service.MonitorDeviceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 设备指标数据控制器
 * @author CH
 * @since 2024/12/19
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/monitor/device/metrics")
@RequiredArgsConstructor
@ApiJSDoc("设备指标数据管理")
public class MonitorDeviceMetricsController {

    private final MonitorDeviceService deviceService;

    /**
     * 获取设备最新指标
     */
    @GetMapping("/latest/{deviceId}")
    @ApiJSDoc("获取设备最新指标")
    public Response<MonitorDeviceMetrics> getLatestMetrics(@PathVariable String deviceId) {
        try {
            MonitorDeviceMetrics metrics = deviceService.getLatestMetrics(deviceId);
            return ResponseUtils.ok(metrics);
        } catch (Exception e) {
            log.error("获取设备最新指标失败", e);
            return ResponseUtils.error("获取设备最新指标失败: " + e.getMessage());
        }
    }

    /**
     * 获取设备历史指标
     */
    @PostMapping("/history")
    @ApiJSDoc("获取设备历史指标")
    public Response<List<MonitorDeviceMetrics>> getHistoryMetrics(
            @RequestBody PageRequest<Map<String, Object>> request) {
        try {
            Map<String, Object> params = request.getData();
            String deviceId = (String) params.get("deviceId");
            LocalDateTime startTime = (LocalDateTime) params.get("startTime");
            LocalDateTime endTime = (LocalDateTime) params.get("endTime");
            
            List<MonitorDeviceMetrics> metrics = deviceService.getHistoryMetrics(
                deviceId, startTime, endTime, request.getPage(), request.getPageSize());
            
            return ResponseUtils.ok(metrics);
        } catch (Exception e) {
            log.error("获取设备历史指标失败", e);
            return ResponseUtils.error("获取设备历史指标失败: " + e.getMessage());
        }
    }

    /**
     * 获取设备指标统计
     */
    @GetMapping("/statistics/{deviceId}")
    @ApiJSDoc("获取设备指标统计")
    public Response<Map<String, Object>> getMetricsStatistics(
            @PathVariable String deviceId,
            @RequestParam(required = false) String timeRange) {
        try {
            Map<String, Object> statistics = deviceService.getMetricsStatistics(deviceId, timeRange);
            return ResponseUtils.ok(statistics);
        } catch (Exception e) {
            log.error("获取设备指标统计失败", e);
            return ResponseUtils.error("获取设备指标统计失败: " + e.getMessage());
        }
    }

    /**
     * 获取多设备指标对比
     */
    @PostMapping("/compare")
    @ApiJSDoc("获取多设备指标对比")
    public Response<Map<String, Object>> compareMetrics(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> deviceIds = (List<String>) request.get("deviceIds");
            String metric = (String) request.get("metric");
            String timeRange = (String) request.get("timeRange");
            
            Map<String, Object> comparison = deviceService.compareMetrics(deviceIds, metric, timeRange);
            return ResponseUtils.ok(comparison);
        } catch (Exception e) {
            log.error("获取多设备指标对比失败", e);
            return ResponseUtils.error("获取多设备指标对比失败: " + e.getMessage());
        }
    }

    /**
     * 获取设备指标趋势
     */
    @GetMapping("/trend/{deviceId}")
    @ApiJSDoc("获取设备指标趋势")
    public Response<Map<String, Object>> getMetricsTrend(
            @PathVariable String deviceId,
            @RequestParam String metric,
            @RequestParam(defaultValue = "24h") String timeRange) {
        try {
            Map<String, Object> trend = deviceService.getMetricsTrend(deviceId, metric, timeRange);
            return ResponseUtils.ok(trend);
        } catch (Exception e) {
            log.error("获取设备指标趋势失败", e);
            return ResponseUtils.error("获取设备指标趋势失败: " + e.getMessage());
        }
    }

    /**
     * 获取设备告警指标
     */
    @GetMapping("/alerts/{deviceId}")
    @ApiJSDoc("获取设备告警指标")
    public Response<List<Map<String, Object>>> getAlertMetrics(@PathVariable String deviceId) {
        try {
            List<Map<String, Object>> alerts = deviceService.getAlertMetrics(deviceId);
            return ResponseUtils.ok(alerts);
        } catch (Exception e) {
            log.error("获取设备告警指标失败", e);
            return ResponseUtils.error("获取设备告警指标失败: " + e.getMessage());
        }
    }

    /**
     * 清理历史指标数据
     */
    @DeleteMapping("/cleanup")
    @ApiJSDoc("清理历史指标数据")
    public Response<Map<String, Object>> cleanupHistoryMetrics(
            @RequestParam(required = false) String deviceId,
            @RequestParam(defaultValue = "30") Integer retentionDays) {
        try {
            int cleanedCount = deviceService.cleanupHistoryMetrics(deviceId, retentionDays);
            
            Map<String, Object> result = new HashMap<>();
            result.put("cleanedCount", cleanedCount);
            result.put("retentionDays", retentionDays);
            result.put("cleanupTime", LocalDateTime.now());
            
            return ResponseUtils.ok(result);
        } catch (Exception e) {
            log.error("清理历史指标数据失败", e);
            return ResponseUtils.error("清理历史指标数据失败: " + e.getMessage());
        }
    }

    /**
     * 导出设备指标数据
     */
    @PostMapping("/export")
    @ApiJSDoc("导出设备指标数据")
    public Response<Map<String, Object>> exportMetrics(
            @RequestBody Map<String, Object> request) {
        try {
            String deviceId = (String) request.get("deviceId");
            String format = (String) request.get("format"); // csv, excel, json
            LocalDateTime startTime = (LocalDateTime) request.get("startTime");
            LocalDateTime endTime = (LocalDateTime) request.get("endTime");
            
            String exportPath = deviceService.exportMetrics(deviceId, format, startTime, endTime);
            
            Map<String, Object> result = new HashMap<>();
            result.put("exportPath", exportPath);
            result.put("format", format);
            result.put("exportTime", LocalDateTime.now());
            
            return ResponseUtils.ok(result);
        } catch (Exception e) {
            log.error("导出设备指标数据失败", e);
            return ResponseUtils.error("导出设备指标数据失败: " + e.getMessage());
        }
    }

    /**
     * 获取实时指标数据
     */
    @GetMapping("/realtime/{deviceId}")
    @ApiJSDoc("获取实时指标数据")
    public Response<Map<String, Object>> getRealtimeMetrics(@PathVariable String deviceId) {
        try {
            // 获取最新的指标数据
            MonitorDeviceMetrics latestMetrics = deviceService.getLatestMetrics(deviceId);
            
            if (latestMetrics == null) {
                return ResponseUtils.error("设备指标数据不存在");
            }

            // 构建实时数据响应
            Map<String, Object> realtimeData = new HashMap<>();
            realtimeData.put("deviceId", deviceId);
            realtimeData.put("timestamp", latestMetrics.getMonitorDeviceMetricsCollectTime());
            realtimeData.put("online", latestMetrics.getMonitorDeviceMetricsOnline());
            
            // CPU指标
            Map<String, Object> cpu = new HashMap<>();
            cpu.put("usage", latestMetrics.getMonitorDeviceMetricsCpuUsage());
            cpu.put("cores", latestMetrics.getMonitorDeviceMetricsCpuCores());
            cpu.put("frequency", latestMetrics.getMonitorDeviceMetricsCpuFrequency());
            realtimeData.put("cpu", cpu);
            
            // 内存指标
            Map<String, Object> memory = new HashMap<>();
            memory.put("usage", latestMetrics.getMonitorDeviceMetricsMemoryUsage());
            memory.put("total", latestMetrics.getMonitorDeviceMetricsTotalMemory());
            memory.put("used", latestMetrics.getMonitorDeviceMetricsUsedMemory());
            memory.put("available", latestMetrics.getMonitorDeviceMetricsAvailableMemory());
            realtimeData.put("memory", memory);
            
            // 磁盘指标
            Map<String, Object> disk = new HashMap<>();
            disk.put("usage", latestMetrics.getMonitorDeviceMetricsDiskUsage());
            disk.put("total", latestMetrics.getMonitorDeviceMetricsTotalDisk());
            disk.put("used", latestMetrics.getMonitorDeviceMetricsUsedDisk());
            disk.put("available", latestMetrics.getMonitorDeviceMetricsAvailableDisk());
            realtimeData.put("disk", disk);
            
            // 网络指标
            Map<String, Object> network = new HashMap<>();
            network.put("inBytes", latestMetrics.getMonitorDeviceMetricsNetworkInBytes());
            network.put("outBytes", latestMetrics.getMonitorDeviceMetricsNetworkOutBytes());
            network.put("inPackets", latestMetrics.getMonitorDeviceMetricsNetworkInPackets());
            network.put("outPackets", latestMetrics.getMonitorDeviceMetricsNetworkOutPackets());
            realtimeData.put("network", network);
            
            // 系统指标
            Map<String, Object> system = new HashMap<>();
            system.put("loadAverage", latestMetrics.getMonitorDeviceMetricsLoadAverage());
            system.put("uptime", latestMetrics.getMonitorDeviceMetricsUptime());
            system.put("processCount", latestMetrics.getMonitorDeviceMetricsProcessCount());
            system.put("threadCount", latestMetrics.getMonitorDeviceMetricsThreadCount());
            system.put("temperature", latestMetrics.getMonitorDeviceMetricsTemperature());
            realtimeData.put("system", system);
            
            return ResponseUtils.ok(realtimeData);
        } catch (Exception e) {
            log.error("获取实时指标数据失败", e);
            return ResponseUtils.error("获取实时指标数据失败: " + e.getMessage());
        }
    }

    /**
     * 批量获取多设备实时指标
     */
    @PostMapping("/realtime/batch")
    @ApiJSDoc("批量获取多设备实时指标")
    public Response<Map<String, Object>> getBatchRealtimeMetrics(
            @RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<String> deviceIds = (List<String>) request.get("deviceIds");
            
            Map<String, Object> batchData = new HashMap<>();
            
            for (String deviceId : deviceIds) {
                try {
                    MonitorDeviceMetrics metrics = deviceService.getLatestMetrics(deviceId);
                    if (metrics != null) {
                        Map<String, Object> deviceData = new HashMap<>();
                        deviceData.put("cpuUsage", metrics.getMonitorDeviceMetricsCpuUsage());
                        deviceData.put("memoryUsage", metrics.getMonitorDeviceMetricsMemoryUsage());
                        deviceData.put("diskUsage", metrics.getMonitorDeviceMetricsDiskUsage());
                        deviceData.put("online", metrics.getMonitorDeviceMetricsOnline());
                        deviceData.put("collectTime", metrics.getMonitorDeviceMetricsCollectTime());
                        
                        batchData.put(deviceId, deviceData);
                    }
                } catch (Exception e) {
                    log.warn("获取设备{}指标失败: {}", deviceId, e.getMessage());
                }
            }
            
            return ResponseUtils.ok(batchData);
        } catch (Exception e) {
            log.error("批量获取实时指标数据失败", e);
            return ResponseUtils.error("批量获取实时指标数据失败: " + e.getMessage());
        }
    }
}
