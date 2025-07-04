package com.chua.starter.monitor.starter.service.impl;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.pojo.UrlRequestReportDTO;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerReportService;
import com.chua.starter.monitor.starter.service.TimeSeriesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

/**
 * 服务器数据上报服务实现类
 * 
 * <p>该服务实现类负责处理各种数据上报功能，使用Redis时序数据库存储数据。</p>
 * <p>主要功能包括：</p>
 * <ul>
 *   <li>URL请求数据上报和存储</li>
 *   <li>API数据批量上报</li>
 *   <li>上报数据查询和统计</li>
 *   <li>过期数据清理</li>
 *   <li>实时监控数据获取</li>
 * </ul>
 *
 * @author CH
 * @since 2025/01/03
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MonitorSysGenServerReportServiceImpl implements MonitorSysGenServerReportService {

    private final TimeSeriesService timeSeriesService;
    
    // Redis时序数据的键前缀
    private static final String URL_REQUEST_KEY_PREFIX = "monitor:url_request:";
    private static final String API_DATA_KEY_PREFIX = "monitor:api_data:";
    private static final String STATISTICS_KEY_PREFIX = "monitor:statistics:";
    
    @Override
    public ReturnResult<Boolean> reportUrlRequest(UrlRequestReportDTO reportData) {
        log.debug("开始处理URL请求数据上报, method: {}, url: {}, clientIp: {}", 
            reportData.getMethod(), reportData.getUrl(), reportData.getClientIp());
        
        if (reportData == null) {
            log.warn("URL请求数据上报失败, 上报数据为空");
            return ReturnResult.error("上报数据不能为空");
        }
        
        // 验证必填字段
        if (reportData.getMethod() == null || reportData.getMethod().trim().isEmpty()) {
            log.warn("URL请求数据上报失败, 请求方法为空");
            return ReturnResult.error("请求方法不能为空");
        }
        
        if (reportData.getUrl() == null || reportData.getUrl().trim().isEmpty()) {
            log.warn("URL请求数据上报失败, 请求URL为空");
            return ReturnResult.error("请求URL不能为空");
        }
        
        if (reportData.getClientIp() == null || reportData.getClientIp().trim().isEmpty()) {
            log.warn("URL请求数据上报失败, 客户端IP为空");
            return ReturnResult.error("客户端IP不能为空");
        }

        try {
            // 构建存储数据
            Map<String, Object> dataPoint = buildUrlRequestDataPoint(reportData);
            
            // 生成时序数据键
            String timeSeriesKey = generateUrlRequestKey(reportData);
            
            // 存储到Redis时序数据库
            timeSeriesService.save(timeSeriesKey, dataPoint);
            
            // 更新统计数据
            updateUrlRequestStatistics(reportData);
            
            log.debug("URL请求数据上报成功, method: {}, url: {}, key: {}", 
                reportData.getMethod(), reportData.getUrl(), timeSeriesKey);
            return ReturnResult.ok(true);
        } catch (Exception e) {
            log.error("URL请求数据上报失败, method: {}, url: {}", 
                reportData.getMethod(), reportData.getUrl(), e);
            return ReturnResult.error("上报数据失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<Map<String, Object>>> queryUrlRequestData(Integer serverId, Long startTime, Long endTime, Integer limit) {
        log.debug("开始查询URL请求数据, serverId: {}, startTime: {}, endTime: {}, limit: {}", 
            serverId, startTime, endTime, limit);
        
        try {
            // 设置默认时间范围（最近24小时）
            if (startTime == null || endTime == null) {
                long now = System.currentTimeMillis() / 1000;
                endTime = endTime != null ? endTime : now;
                startTime = startTime != null ? startTime : (now - 24 * 60 * 60);
            }
            
            // 设置默认限制
            if (limit == null || limit <= 0) {
                limit = 100;
            } else if (limit > 1000) {
                limit = 1000; // 最大限制1000条
            }
            
            // 生成查询键模式
            String keyPattern = generateUrlRequestKeyPattern(serverId);
            
            // 从时序数据库查询数据
            List<Map<String, Object>> data = timeSeriesService.range(keyPattern, startTime, endTime, limit);
            
            log.debug("查询URL请求数据成功, serverId: {}, 数据条数: {}", serverId, data.size());
            return ReturnResult.ok(data);
        } catch (Exception e) {
            log.error("查询URL请求数据失败, serverId: {}, startTime: {}, endTime: {}", 
                serverId, startTime, endTime, e);
            return ReturnResult.error("查询数据失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getUrlRequestStatistics(Integer serverId, Long startTime, Long endTime) {
        log.debug("开始获取URL请求统计数据, serverId: {}, startTime: {}, endTime: {}", 
            serverId, startTime, endTime);
        
        try {
            // 设置默认时间范围（最近24小时）
            if (startTime == null || endTime == null) {
                long now = System.currentTimeMillis() / 1000;
                endTime = endTime != null ? endTime : now;
                startTime = startTime != null ? startTime : (now - 24 * 60 * 60);
            }
            
            // 查询原始数据
            ReturnResult<List<Map<String, Object>>> dataResult = queryUrlRequestData(serverId, startTime, endTime, 10000);
            if (!dataResult.isSuccess() || dataResult.getData() == null) {
                return ReturnResult.error("获取统计数据失败");
            }
            
            List<Map<String, Object>> data = dataResult.getData();
            
            // 计算统计信息
            Map<String, Object> statistics = calculateUrlRequestStatistics(data);
            
            log.debug("获取URL请求统计数据成功, serverId: {}, 总请求数: {}", 
                serverId, statistics.get("totalRequests"));
            return ReturnResult.ok(statistics);
        } catch (Exception e) {
            log.error("获取URL请求统计数据失败, serverId: {}, startTime: {}, endTime: {}", 
                serverId, startTime, endTime, e);
            return ReturnResult.error("获取统计数据失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> batchReportApiData(List<Map<String, Object>> reportDataList) {
        log.debug("开始批量上报API数据, 数据条数: {}", reportDataList != null ? reportDataList.size() : 0);
        
        if (reportDataList == null || reportDataList.isEmpty()) {
            log.warn("批量上报API数据失败, 上报数据为空");
            return ReturnResult.error("上报数据不能为空");
        }

        try {
            int successCount = 0;
            for (Map<String, Object> data : reportDataList) {
                try {
                    // 生成时序数据键
                    String timeSeriesKey = generateApiDataKey(data);
                    
                    // 存储到Redis时序数据库
                    timeSeriesService.save(timeSeriesKey, data);
                    successCount++;
                } catch (Exception e) {
                    log.warn("单条API数据上报失败: {}", data, e);
                }
            }
            
            log.debug("批量上报API数据完成, 总数: {}, 成功: {}", reportDataList.size(), successCount);
            return ReturnResult.ok(successCount == reportDataList.size());
        } catch (Exception e) {
            log.error("批量上报API数据失败", e);
            return ReturnResult.error("批量上报失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> cleanupExpiredData(Integer retentionDays) {
        log.debug("开始清理过期上报数据, 保留天数: {}", retentionDays);
        
        if (retentionDays == null || retentionDays <= 0) {
            retentionDays = 30; // 默认保留30天
        }

        try {
            long cutoffTime = System.currentTimeMillis() / 1000 - (retentionDays * 24 * 60 * 60);
            
            // 清理URL请求数据
            int urlRequestCleaned = cleanupExpiredUrlRequestData(cutoffTime);
            
            // 清理API数据
            int apiDataCleaned = cleanupExpiredApiData(cutoffTime);
            
            Map<String, Object> result = new HashMap<>();
            result.put("retentionDays", retentionDays);
            result.put("cutoffTime", cutoffTime);
            result.put("urlRequestCleaned", urlRequestCleaned);
            result.put("apiDataCleaned", apiDataCleaned);
            result.put("totalCleaned", urlRequestCleaned + apiDataCleaned);
            
            log.debug("清理过期上报数据完成, 保留天数: {}, 清理总数: {}", 
                retentionDays, urlRequestCleaned + apiDataCleaned);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("清理过期上报数据失败, 保留天数: {}", retentionDays, e);
            return ReturnResult.error("清理数据失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getStorageStatistics() {
        log.debug("开始获取上报数据存储统计");
        
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 获取URL请求数据统计
            Map<String, Object> urlStats = getUrlRequestStorageStats();
            statistics.put("urlRequest", urlStats);
            
            // 获取API数据统计
            Map<String, Object> apiStats = getApiDataStorageStats();
            statistics.put("apiData", apiStats);
            
            // 计算总统计
            long totalCount = (Long) urlStats.get("count") + (Long) apiStats.get("count");
            long totalSize = (Long) urlStats.get("size") + (Long) apiStats.get("size");
            
            statistics.put("total", Map.of(
                "count", totalCount,
                "size", totalSize,
                "lastUpdate", System.currentTimeMillis() / 1000
            ));
            
            log.debug("获取上报数据存储统计成功, 总数据量: {}", totalCount);
            return ReturnResult.ok(statistics);
        } catch (Exception e) {
            log.error("获取上报数据存储统计失败", e);
            return ReturnResult.error("获取存储统计失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<Map<String, Object>>> getTopUrls(Integer serverId, Long startTime, Long endTime, Integer topN) {
        log.debug("开始获取热门URL统计, serverId: {}, topN: {}", serverId, topN);
        
        try {
            // 查询URL请求数据
            ReturnResult<List<Map<String, Object>>> dataResult = queryUrlRequestData(serverId, startTime, endTime, 10000);
            if (!dataResult.isSuccess() || dataResult.getData() == null) {
                return ReturnResult.error("获取热门URL统计失败");
            }
            
            List<Map<String, Object>> data = dataResult.getData();
            
            // 统计URL访问次数
            Map<String, Integer> urlCounts = new HashMap<>();
            for (Map<String, Object> item : data) {
                String url = (String) item.get("url");
                if (url != null) {
                    urlCounts.put(url, urlCounts.getOrDefault(url, 0) + 1);
                }
            }
            
            // 排序并取前N个
            List<Map<String, Object>> topUrls = urlCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(topN != null ? topN : 10)
                .map(entry -> Map.of(
                    "url", entry.getKey(),
                    "count", entry.getValue()
                ))
                .collect(ArrayList::new, (list, item) -> list.add((Map<String, Object>) item), ArrayList::addAll);
            
            log.debug("获取热门URL统计成功, serverId: {}, 返回数量: {}", serverId, topUrls.size());
            return ReturnResult.ok(topUrls);
        } catch (Exception e) {
            log.error("获取热门URL统计失败, serverId: {}", serverId, e);
            return ReturnResult.error("获取热门URL统计失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getErrorRequestStatistics(Integer serverId, Long startTime, Long endTime) {
        log.debug("开始获取错误请求统计, serverId: {}", serverId);
        
        try {
            // 查询URL请求数据
            ReturnResult<List<Map<String, Object>>> dataResult = queryUrlRequestData(serverId, startTime, endTime, 10000);
            if (!dataResult.isSuccess() || dataResult.getData() == null) {
                return ReturnResult.error("获取错误请求统计失败");
            }
            
            List<Map<String, Object>> data = dataResult.getData();
            
            // 统计错误请求
            Map<String, Object> errorStats = calculateErrorRequestStatistics(data);
            
            log.debug("获取错误请求统计成功, serverId: {}", serverId);
            return ReturnResult.ok(errorStats);
        } catch (Exception e) {
            log.error("获取错误请求统计失败, serverId: {}", serverId, e);
            return ReturnResult.error("获取错误请求统计失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getRealtimeMonitorData(Integer serverId, Integer minutes) {
        log.debug("开始获取实时请求监控数据, serverId: {}, minutes: {}", serverId, minutes);
        
        try {
            if (minutes == null || minutes <= 0) {
                minutes = 5; // 默认5分钟
            }
            
            long now = System.currentTimeMillis() / 1000;
            long startTime = now - (minutes * 60);
            
            // 查询实时数据
            ReturnResult<List<Map<String, Object>>> dataResult = queryUrlRequestData(serverId, startTime, now, 1000);
            if (!dataResult.isSuccess() || dataResult.getData() == null) {
                return ReturnResult.error("获取实时监控数据失败");
            }
            
            List<Map<String, Object>> data = dataResult.getData();
            
            // 计算实时指标
            Map<String, Object> realtimeData = calculateRealtimeMetrics(data, minutes);
            
            log.debug("获取实时请求监控数据成功, serverId: {}, 数据点数: {}", serverId, data.size());
            return ReturnResult.ok(realtimeData);
        } catch (Exception e) {
            log.error("获取实时请求监控数据失败, serverId: {}", serverId, e);
            return ReturnResult.error("获取实时监控数据失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> exportReportData(Integer serverId, Long startTime, Long endTime, String format, Integer limit) {
        log.debug("开始导出上报数据, serverId: {}, format: {}, limit: {}", serverId, format, limit);
        
        try {
            // 查询数据
            ReturnResult<List<Map<String, Object>>> dataResult = queryUrlRequestData(serverId, startTime, endTime, limit);
            if (!dataResult.isSuccess() || dataResult.getData() == null) {
                return ReturnResult.error("导出数据失败");
            }
            
            List<Map<String, Object>> data = dataResult.getData();
            
            // 根据格式导出数据
            Map<String, Object> exportResult = exportDataByFormat(data, format != null ? format : "csv");
            
            log.debug("导出上报数据成功, serverId: {}, 数据条数: {}", serverId, data.size());
            return ReturnResult.ok(exportResult);
        } catch (Exception e) {
            log.error("导出上报数据失败, serverId: {}", serverId, e);
            return ReturnResult.error("导出数据失败: " + e.getMessage());
        }
    }

    /**
     * 构建URL请求数据点
     */
    private Map<String, Object> buildUrlRequestDataPoint(UrlRequestReportDTO reportData) {
        Map<String, Object> dataPoint = new HashMap<>();
        dataPoint.put("method", reportData.getMethod());
        dataPoint.put("url", reportData.getUrl());
        dataPoint.put("clientIp", reportData.getClientIp());
        dataPoint.put("serverIp", reportData.getServerIp());
        dataPoint.put("serverPort", reportData.getServerPort());
        dataPoint.put("timestamp", reportData.getTimestamp() != null ? reportData.getTimestamp() : System.currentTimeMillis() / 1000);
        dataPoint.put("responseTime", reportData.getResponseTime());
        dataPoint.put("statusCode", reportData.getStatusCode());
        dataPoint.put("userAgent", reportData.getUserAgent());
        dataPoint.put("referer", reportData.getReferer());
        dataPoint.put("serverId", reportData.getServerId());
        return dataPoint;
    }

    /**
     * 生成URL请求时序数据键
     */
    private String generateUrlRequestKey(UrlRequestReportDTO reportData) {
        String serverId = reportData.getServerId() != null ? reportData.getServerId().toString() : "unknown";
        return URL_REQUEST_KEY_PREFIX + serverId + ":" + System.currentTimeMillis();
    }

    /**
     * 生成URL请求查询键模式
     */
    private String generateUrlRequestKeyPattern(Integer serverId) {
        if (serverId != null) {
            return URL_REQUEST_KEY_PREFIX + serverId + ":*";
        }
        return URL_REQUEST_KEY_PREFIX + "*";
    }

    /**
     * 生成API数据键
     */
    private String generateApiDataKey(Map<String, Object> data) {
        String serverId = data.get("serverId") != null ? data.get("serverId").toString() : "unknown";
        return API_DATA_KEY_PREFIX + serverId + ":" + System.currentTimeMillis();
    }

    /**
     * 更新URL请求统计数据
     */
    private void updateUrlRequestStatistics(UrlRequestReportDTO reportData) {
        try {
            // 这里可以实现统计数据的更新逻辑
            // 例如：总请求数、成功率、平均响应时间等
            log.debug("更新URL请求统计数据: {}", reportData.getUrl());
        } catch (Exception e) {
            log.warn("更新URL请求统计数据失败", e);
        }
    }

    /**
     * 计算URL请求统计信息
     */
    private Map<String, Object> calculateUrlRequestStatistics(List<Map<String, Object>> data) {
        Map<String, Object> statistics = new HashMap<>();

        if (data == null || data.isEmpty()) {
            statistics.put("totalRequests", 0);
            statistics.put("successRate", 0.0);
            statistics.put("averageResponseTime", 0.0);
            statistics.put("errorRate", 0.0);
            return statistics;
        }

        int totalRequests = data.size();
        int successRequests = 0;
        long totalResponseTime = 0;
        int responseTimeCount = 0;

        for (Map<String, Object> item : data) {
            Integer statusCode = (Integer) item.get("statusCode");
            if (statusCode != null && statusCode >= 200 && statusCode < 400) {
                successRequests++;
            }

            Long responseTime = (Long) item.get("responseTime");
            if (responseTime != null) {
                totalResponseTime += responseTime;
                responseTimeCount++;
            }
        }

        double successRate = totalRequests > 0 ? (double) successRequests / totalRequests * 100 : 0.0;
        double averageResponseTime = responseTimeCount > 0 ? (double) totalResponseTime / responseTimeCount : 0.0;
        double errorRate = 100.0 - successRate;

        statistics.put("totalRequests", totalRequests);
        statistics.put("successRequests", successRequests);
        statistics.put("successRate", Math.round(successRate * 100.0) / 100.0);
        statistics.put("averageResponseTime", Math.round(averageResponseTime * 100.0) / 100.0);
        statistics.put("errorRate", Math.round(errorRate * 100.0) / 100.0);
        statistics.put("timeRange", Map.of(
            "start", data.stream().mapToLong(item -> (Long) item.getOrDefault("timestamp", 0L)).min().orElse(0L),
            "end", data.stream().mapToLong(item -> (Long) item.getOrDefault("timestamp", 0L)).max().orElse(0L)
        ));

        return statistics;
    }

    /**
     * 清理过期URL请求数据
     */
    private int cleanupExpiredUrlRequestData(long cutoffTime) {
        // 这里实现清理逻辑
        // 返回清理的数据条数
        return 0;
    }

    /**
     * 清理过期API数据
     */
    private int cleanupExpiredApiData(long cutoffTime) {
        // 这里实现清理逻辑
        // 返回清理的数据条数
        return 0;
    }

    /**
     * 获取URL请求存储统计
     */
    private Map<String, Object> getUrlRequestStorageStats() {
        return Map.of(
            "count", 0L,
            "size", 0L
        );
    }

    /**
     * 获取API数据存储统计
     */
    private Map<String, Object> getApiDataStorageStats() {
        return Map.of(
            "count", 0L,
            "size", 0L
        );
    }

    /**
     * 计算错误请求统计
     */
    private Map<String, Object> calculateErrorRequestStatistics(List<Map<String, Object>> data) {
        Map<String, Object> errorStats = new HashMap<>();

        int total4xx = 0;
        int total5xx = 0;
        Map<Integer, Integer> statusCodeCounts = new HashMap<>();

        for (Map<String, Object> item : data) {
            Integer statusCode = (Integer) item.get("statusCode");
            if (statusCode != null) {
                statusCodeCounts.put(statusCode, statusCodeCounts.getOrDefault(statusCode, 0) + 1);

                if (statusCode >= 400 && statusCode < 500) {
                    total4xx++;
                } else if (statusCode >= 500) {
                    total5xx++;
                }
            }
        }

        errorStats.put("total4xx", total4xx);
        errorStats.put("total5xx", total5xx);
        errorStats.put("totalErrors", total4xx + total5xx);
        errorStats.put("statusCodeCounts", statusCodeCounts);

        return errorStats;
    }

    /**
     * 计算实时指标
     */
    private Map<String, Object> calculateRealtimeMetrics(List<Map<String, Object>> data, Integer minutes) {
        Map<String, Object> metrics = new HashMap<>();

        int requestCount = data.size();
        double requestsPerMinute = minutes > 0 ? (double) requestCount / minutes : 0.0;

        // 计算平均响应时间
        double avgResponseTime = data.stream()
            .filter(item -> item.get("responseTime") != null)
            .mapToLong(item -> (Long) item.get("responseTime"))
            .average()
            .orElse(0.0);

        // 计算错误率
        long errorCount = data.stream()
            .filter(item -> {
                Integer statusCode = (Integer) item.get("statusCode");
                return statusCode != null && statusCode >= 400;
            })
            .count();

        double errorRate = requestCount > 0 ? (double) errorCount / requestCount * 100 : 0.0;

        metrics.put("requestCount", requestCount);
        metrics.put("requestsPerMinute", Math.round(requestsPerMinute * 100.0) / 100.0);
        metrics.put("averageResponseTime", Math.round(avgResponseTime * 100.0) / 100.0);
        metrics.put("errorRate", Math.round(errorRate * 100.0) / 100.0);
        metrics.put("timeWindow", minutes);
        metrics.put("timestamp", System.currentTimeMillis() / 1000);

        return metrics;
    }

    /**
     * 根据格式导出数据
     */
    private Map<String, Object> exportDataByFormat(List<Map<String, Object>> data, String format) {
        Map<String, Object> result = new HashMap<>();

        switch (format.toLowerCase()) {
            case "csv":
                result.put("format", "csv");
                result.put("content", convertToCsv(data));
                result.put("filename", "url_requests_" + System.currentTimeMillis() + ".csv");
                break;
            case "json":
                result.put("format", "json");
                result.put("content", data);
                result.put("filename", "url_requests_" + System.currentTimeMillis() + ".json");
                break;
            default:
                result.put("format", "json");
                result.put("content", data);
                result.put("filename", "url_requests_" + System.currentTimeMillis() + ".json");
        }

        result.put("count", data.size());
        result.put("exportTime", System.currentTimeMillis() / 1000);

        return result;
    }

    /**
     * 转换为CSV格式
     */
    private String convertToCsv(List<Map<String, Object>> data) {
        if (data == null || data.isEmpty()) {
            return "";
        }

        StringBuilder csv = new StringBuilder();

        // 添加表头
        csv.append("timestamp,method,url,clientIp,serverIp,serverPort,responseTime,statusCode\n");

        // 添加数据行
        for (Map<String, Object> item : data) {
            csv.append(item.getOrDefault("timestamp", "")).append(",")
               .append(item.getOrDefault("method", "")).append(",")
               .append(item.getOrDefault("url", "")).append(",")
               .append(item.getOrDefault("clientIp", "")).append(",")
               .append(item.getOrDefault("serverIp", "")).append(",")
               .append(item.getOrDefault("serverPort", "")).append(",")
               .append(item.getOrDefault("responseTime", "")).append(",")
               .append(item.getOrDefault("statusCode", "")).append("\n");
        }

        return csv.toString();
    }
}
