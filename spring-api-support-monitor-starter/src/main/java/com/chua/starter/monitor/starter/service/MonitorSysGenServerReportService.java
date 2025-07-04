package com.chua.starter.monitor.starter.service;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.pojo.UrlRequestReportDTO;

import java.util.List;
import java.util.Map;

/**
 * 服务器数据上报服务接口
 * 
 * <p>该服务接口负责处理各种数据上报功能，包括：</p>
 * <ul>
 *   <li>URL请求数据上报和存储</li>
 *   <li>API数据批量上报</li>
 *   <li>上报数据查询和统计</li>
 *   <li>过期数据清理</li>
 * </ul>
 * 
 * <p>数据存储使用Redis时序数据库，支持高性能的时间序列数据存储和查询。</p>
 *
 * @author CH
 * @since 2025/01/03
 * @version 1.0
 */
public interface MonitorSysGenServerReportService {

    /**
     * URL请求数据上报
     * 
     * <p>将URL请求数据存储到Redis时序数据库中，包括请求方法、URL、客户端IP、
     * 服务器IP、端口、时间戳等信息。</p>
     * 
     * @param reportData URL请求上报数据，不能为空
     * @return 上报操作的结果，true表示成功，false表示失败
     * @throws IllegalArgumentException 当上报数据为空或格式不正确时抛出
     * @since 2025/01/03
     */
    ReturnResult<Boolean> reportUrlRequest(UrlRequestReportDTO reportData);

    /**
     * 查询URL请求数据
     * 
     * <p>根据指定的时间范围和服务器ID查询URL请求数据。支持分页查询，
     * 返回的数据按时间倒序排列。</p>
     * 
     * @param serverId 服务器ID，可选参数，用于过滤特定服务器的数据
     * @param startTime 开始时间（Unix时间戳，秒），可选参数，默认为24小时前
     * @param endTime 结束时间（Unix时间戳，秒），可选参数，默认为当前时间
     * @param limit 返回数据条数限制，默认为100，最大为1000
     * @return 返回指定条件的URL请求数据列表
     * @since 2025/01/03
     */
    ReturnResult<List<Map<String, Object>>> queryUrlRequestData(Integer serverId, Long startTime, Long endTime, Integer limit);

    /**
     * 获取URL请求统计数据
     * 
     * <p>统计指定时间范围内的URL请求数据，包括总请求数、成功率、
     * 平均响应时间、错误率等统计信息。</p>
     * 
     * @param serverId 服务器ID，可选参数，用于过滤特定服务器的数据
     * @param startTime 开始时间（Unix时间戳，秒），可选参数，默认为24小时前
     * @param endTime 结束时间（Unix时间戳，秒），可选参数，默认为当前时间
     * @return 返回URL请求的统计信息
     * @since 2025/01/03
     */
    ReturnResult<Map<String, Object>> getUrlRequestStatistics(Integer serverId, Long startTime, Long endTime);

    /**
     * 批量上报API数据
     * 
     * <p>批量处理API数据上报，提高上报效率。支持事务处理，
     * 确保数据的一致性。</p>
     * 
     * @param reportDataList API数据上报列表，不能为空
     * @return 批量上报操作的结果
     * @throws IllegalArgumentException 当上报数据列表为空时抛出
     * @since 2025/01/03
     */
    ReturnResult<Boolean> batchReportApiData(List<Map<String, Object>> reportDataList);

    /**
     * 清理过期的上报数据
     * 
     * <p>清理超过保留期限的上报数据，释放存储空间。
     * 支持按数据类型分别清理。</p>
     * 
     * @param retentionDays 数据保留天数，超过此天数的数据将被清理
     * @return 清理操作的结果，包含清理的数据条数和释放的空间大小
     * @since 2025/01/03
     */
    ReturnResult<Map<String, Object>> cleanupExpiredData(Integer retentionDays);

    /**
     * 获取上报数据存储统计
     * 
     * <p>获取当前上报数据的存储统计信息，包括总数据量、
     * 存储空间使用情况、数据分布等。</p>
     * 
     * @return 返回存储统计信息
     * @since 2025/01/03
     */
    ReturnResult<Map<String, Object>> getStorageStatistics();

    /**
     * 获取热门URL统计
     * 
     * <p>统计指定时间范围内访问量最高的URL，支持按不同维度统计，
     * 如按URL、按IP、按用户等。</p>
     * 
     * @param serverId 服务器ID，可选参数
     * @param startTime 开始时间（Unix时间戳，秒），可选参数
     * @param endTime 结束时间（Unix时间戳，秒），可选参数
     * @param topN 返回前N个热门URL，默认为10
     * @return 返回热门URL统计数据
     * @since 2025/01/03
     */
    ReturnResult<List<Map<String, Object>>> getTopUrls(Integer serverId, Long startTime, Long endTime, Integer topN);

    /**
     * 获取错误请求统计
     * 
     * <p>统计指定时间范围内的错误请求，包括4xx和5xx状态码的请求，
     * 帮助快速定位系统问题。</p>
     * 
     * @param serverId 服务器ID，可选参数
     * @param startTime 开始时间（Unix时间戳，秒），可选参数
     * @param endTime 结束时间（Unix时间戳，秒），可选参数
     * @return 返回错误请求统计数据
     * @since 2025/01/03
     */
    ReturnResult<Map<String, Object>> getErrorRequestStatistics(Integer serverId, Long startTime, Long endTime);

    /**
     * 获取实时请求监控数据
     * 
     * <p>获取最近一段时间的实时请求监控数据，用于实时监控面板展示。
     * 数据包括请求量、响应时间、错误率等实时指标。</p>
     * 
     * @param serverId 服务器ID，可选参数
     * @param minutes 获取最近N分钟的数据，默认为5分钟
     * @return 返回实时监控数据
     * @since 2025/01/03
     */
    ReturnResult<Map<String, Object>> getRealtimeMonitorData(Integer serverId, Integer minutes);

    /**
     * 导出上报数据
     * 
     * <p>导出指定条件的上报数据，支持多种格式（CSV、JSON、Excel等）。
     * 适用于数据分析和报表生成。</p>
     * 
     * @param serverId 服务器ID，可选参数
     * @param startTime 开始时间（Unix时间戳，秒），可选参数
     * @param endTime 结束时间（Unix时间戳，秒），可选参数
     * @param format 导出格式（csv、json、excel），默认为csv
     * @param limit 导出数据条数限制，默认为10000
     * @return 返回导出文件的下载链接或文件内容
     * @since 2025/01/03
     */
    ReturnResult<Map<String, Object>> exportReportData(Integer serverId, Long startTime, Long endTime, String format, Integer limit);
}
