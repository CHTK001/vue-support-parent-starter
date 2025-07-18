package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenPluginNodeLoggerConfig;

import java.util.List;
import java.util.Map;

/**
 * 节点日志器配置服务接口
 *
 * @author CH
 * @since 2025/01/17
 */
public interface MonitorSysGenPluginNodeLoggerConfigService extends IService<MonitorSysGenPluginNodeLoggerConfig> {

    /**
     * 获取节点的所有日志器配置
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @return 日志器配置列表
     */
    ReturnResult<List<MonitorSysGenPluginNodeLoggerConfig>> getNodeLoggers(String nodeUrl);

    /**
     * 获取指定日志器的详细配置
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @param loggerName 日志器名称
     * @return 日志器配置详情
     */
    ReturnResult<MonitorSysGenPluginNodeLoggerConfig> getLoggerConfig(String nodeUrl, String loggerName);

    /**
     * 设置日志器等级
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @param loggerName 日志器名称
     * @param level 日志等级
     * @return 设置结果
     */
    ReturnResult<Boolean> setLoggerLevel(String nodeUrl, String loggerName, String level);

    /**
     * 批量设置相同应用的所有节点日志等级
     *
     * @param applicationName 应用名称
     * @param loggerName 日志器名称
     * @param level 日志等级
     * @return 批量设置结果
     */
    ReturnResult<Map<String, Boolean>> setLoggerLevelForAllNodes(String applicationName, String loggerName, String level);

    /**
     * 获取相同应用名称的所有节点URL
     *
     * @param applicationName 应用名称
     * @return 节点URL列表
     */
    ReturnResult<List<String>> getNodesByApplicationName(String applicationName);

    /**
     * 刷新节点的日志器配置
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @return 刷新结果
     */
    ReturnResult<List<MonitorSysGenPluginNodeLoggerConfig>> refreshNodeLoggers(String nodeUrl);

    /**
     * 获取所有应用名称列表
     *
     * @return 应用名称列表
     */
    ReturnResult<List<String>> getAllApplicationNames();

    /**
     * 获取节点日志器配置统计信息
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @return 统计信息
     */
    ReturnResult<Map<String, Object>> getLoggerConfigStats(String nodeUrl);

    /**
     * 重置日志器配置（恢复为继承状态）
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @param loggerName 日志器名称
     * @return 重置结果
     */
    ReturnResult<Boolean> resetLoggerLevel(String nodeUrl, String loggerName);

    /**
     * 批量重置应用的所有节点日志器配置
     *
     * @param applicationName 应用名称
     * @param loggerName 日志器名称
     * @return 批量重置结果
     */
    ReturnResult<Map<String, Boolean>> resetLoggerLevelForAllNodes(String applicationName, String loggerName);

    /**
     * 同步节点日志器配置到数据库
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @param ipAddress 节点IP地址
     * @param port 节点端口
     * @param applicationName 应用名称
     * @param loggers 从节点获取的日志器配置列表
     * @return 同步结果
     */
    ReturnResult<Boolean> syncNodeLoggers(String nodeUrl, String ipAddress, Integer port, 
                                         String applicationName, List<Map<String, Object>> loggers);

    /**
     * 根据IP和端口获取日志器配置
     *
     * @param ipAddress IP地址
     * @param port 端口
     * @return 日志器配置列表
     */
    ReturnResult<List<MonitorSysGenPluginNodeLoggerConfig>> getLoggersByIpAndPort(String ipAddress, Integer port);

    /**
     * 更新配置同步状态
     *
     * @param nodeUrl 节点URL
     * @param loggerName 日志器名称
     * @param syncStatus 同步状态
     * @param syncError 同步错误信息
     * @return 更新结果
     */
    ReturnResult<Boolean> updateSyncStatus(String nodeUrl, String loggerName, String syncStatus, String syncError);

    /**
     * 批量更新节点配置状态
     *
     * @param nodeUrl 节点URL
     * @param status 配置状态
     * @return 更新结果
     */
    ReturnResult<Boolean> updateNodeConfigStatus(String nodeUrl, String status);

    /**
     * 检查节点是否在线并可访问
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @return 节点状态
     */
    ReturnResult<Boolean> checkNodeStatus(String nodeUrl);

    /**
     * 从远程节点获取实时日志器配置
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @return 远程日志器配置
     */
    ReturnResult<List<Map<String, Object>>> fetchRemoteLoggers(String nodeUrl);

    /**
     * 向远程节点设置日志器等级
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @param loggerName 日志器名称
     * @param level 日志等级
     * @return 设置结果
     */
    ReturnResult<Boolean> setRemoteLoggerLevel(String nodeUrl, String loggerName, String level);

    /**
     * 解码节点URL
     *
     * @param encodedNodeUrl Base64编码的节点URL
     * @return 解码后的IP:Port格式
     */
    String decodeNodeUrl(String encodedNodeUrl);

    /**
     * 编码节点URL
     *
     * @param ipAddress IP地址
     * @param port 端口
     * @return Base64编码的节点URL
     */
    String encodeNodeUrl(String ipAddress, Integer port);
}
