package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenPluginNodeLoggerConfig;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 节点日志器配置 Mapper 接口
 *
 * @author CH
 * @since 2025/01/17
 */
@Mapper
public interface MonitorSysGenPluginNodeLoggerConfigMapper extends BaseMapper<MonitorSysGenPluginNodeLoggerConfig> {

    /**
     * 根据节点URL查询所有日志器配置
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @return 日志器配置列表
     */
    @Select("SELECT * FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_node_url = #{nodeUrl} " +
            "AND plugin_node_logger_config_status != 'DELETED' " +
            "ORDER BY plugin_node_logger_config_logger_name ASC")
    List<MonitorSysGenPluginNodeLoggerConfig> selectByNodeUrl(@Param("nodeUrl") String nodeUrl);

    /**
     * 根据节点URL和日志器名称查询配置
     *
     * @param nodeUrl 节点URL（Base64编码）
     * @param loggerName 日志器名称
     * @return 日志器配置
     */
    @Select("SELECT * FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_node_url = #{nodeUrl} " +
            "AND plugin_node_logger_config_logger_name = #{loggerName} " +
            "AND plugin_node_logger_config_status != 'DELETED'")
    MonitorSysGenPluginNodeLoggerConfig selectByNodeUrlAndLoggerName(
            @Param("nodeUrl") String nodeUrl, 
            @Param("loggerName") String loggerName);

    /**
     * 根据应用名称查询所有节点的日志器配置
     *
     * @param applicationName 应用名称
     * @param loggerName 日志器名称
     * @return 日志器配置列表
     */
    @Select("SELECT * FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_application_name = #{applicationName} " +
            "AND plugin_node_logger_config_logger_name = #{loggerName} " +
            "AND plugin_node_logger_config_status != 'DELETED' " +
            "ORDER BY plugin_node_logger_config_node_url ASC")
    List<MonitorSysGenPluginNodeLoggerConfig> selectByApplicationNameAndLoggerName(
            @Param("applicationName") String applicationName, 
            @Param("loggerName") String loggerName);

    /**
     * 根据应用名称查询所有节点URL
     *
     * @param applicationName 应用名称
     * @return 节点URL列表
     */
    @Select("SELECT DISTINCT plugin_node_logger_config_node_url FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_application_name = #{applicationName} " +
            "AND plugin_node_logger_config_status != 'DELETED'")
    List<String> selectNodeUrlsByApplicationName(@Param("applicationName") String applicationName);

    /**
     * 获取所有应用名称
     *
     * @return 应用名称列表
     */
    @Select("SELECT DISTINCT plugin_node_logger_config_application_name FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_status != 'DELETED' " +
            "ORDER BY plugin_node_logger_config_application_name ASC")
    List<String> selectAllApplicationNames();

    /**
     * 更新日志器等级
     *
     * @param nodeUrl 节点URL
     * @param loggerName 日志器名称
     * @param configuredLevel 配置等级
     * @param currentLevel 当前等级
     * @param effectiveLevel 有效等级
     * @param lastUpdated 最后更新时间
     * @param lastSyncTime 最后同步时间
     * @return 更新行数
     */
    @Update("UPDATE monitor_sys_gen_plugin_node_logger_config SET " +
            "plugin_node_logger_config_configured_level = #{configuredLevel}, " +
            "plugin_node_logger_config_current_level = #{currentLevel}, " +
            "plugin_node_logger_config_effective_level = #{effectiveLevel}, " +
            "plugin_node_logger_config_last_updated = #{lastUpdated}, " +
            "plugin_node_logger_config_last_sync_time = #{lastSyncTime}, " +
            "plugin_node_logger_config_sync_status = 'SYNCED', " +
            "plugin_node_logger_config_sync_error = NULL, " +
            "update_time = #{lastUpdated} " +
            "WHERE plugin_node_logger_config_node_url = #{nodeUrl} " +
            "AND plugin_node_logger_config_logger_name = #{loggerName}")
    int updateLoggerLevel(
            @Param("nodeUrl") String nodeUrl,
            @Param("loggerName") String loggerName,
            @Param("configuredLevel") String configuredLevel,
            @Param("currentLevel") String currentLevel,
            @Param("effectiveLevel") String effectiveLevel,
            @Param("lastUpdated") LocalDateTime lastUpdated,
            @Param("lastSyncTime") LocalDateTime lastSyncTime);

    /**
     * 更新同步状态
     *
     * @param nodeUrl 节点URL
     * @param loggerName 日志器名称
     * @param syncStatus 同步状态
     * @param syncError 同步错误信息
     * @param lastSyncTime 最后同步时间
     * @return 更新行数
     */
    @Update("UPDATE monitor_sys_gen_plugin_node_logger_config SET " +
            "plugin_node_logger_config_sync_status = #{syncStatus}, " +
            "plugin_node_logger_config_sync_error = #{syncError}, " +
            "plugin_node_logger_config_last_sync_time = #{lastSyncTime}, " +
            "update_time = #{lastSyncTime} " +
            "WHERE plugin_node_logger_config_node_url = #{nodeUrl} " +
            "AND plugin_node_logger_config_logger_name = #{loggerName}")
    int updateSyncStatus(
            @Param("nodeUrl") String nodeUrl,
            @Param("loggerName") String loggerName,
            @Param("syncStatus") String syncStatus,
            @Param("syncError") String syncError,
            @Param("lastSyncTime") LocalDateTime lastSyncTime);

    /**
     * 批量更新节点的所有日志器配置状态
     *
     * @param nodeUrl 节点URL
     * @param status 配置状态
     * @return 更新行数
     */
    @Update("UPDATE monitor_sys_gen_plugin_node_logger_config SET " +
            "plugin_node_logger_config_status = #{status}, " +
            "update_time = NOW() " +
            "WHERE plugin_node_logger_config_node_url = #{nodeUrl}")
    int updateStatusByNodeUrl(@Param("nodeUrl") String nodeUrl, @Param("status") String status);

    /**
     * 根据IP和端口查询日志器配置
     *
     * @param ipAddress IP地址
     * @param port 端口
     * @return 日志器配置列表
     */
    @Select("SELECT * FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_ip_address = #{ipAddress} " +
            "AND plugin_node_logger_config_port = #{port} " +
            "AND plugin_node_logger_config_status != 'DELETED' " +
            "ORDER BY plugin_node_logger_config_logger_name ASC")
    List<MonitorSysGenPluginNodeLoggerConfig> selectByIpAndPort(
            @Param("ipAddress") String ipAddress, 
            @Param("port") Integer port);

    /**
     * 统计节点的日志器配置数量
     *
     * @param nodeUrl 节点URL
     * @return 配置数量统计
     */
    @Select("SELECT " +
            "COUNT(*) as totalLoggers, " +
            "COUNT(CASE WHEN plugin_node_logger_config_configured_level IS NOT NULL AND plugin_node_logger_config_configured_level != '' THEN 1 END) as configuredLoggers, " +
            "COUNT(CASE WHEN plugin_node_logger_config_configured_level IS NULL OR plugin_node_logger_config_configured_level = '' THEN 1 END) as inheritedLoggers " +
            "FROM monitor_sys_gen_plugin_node_logger_config " +
            "WHERE plugin_node_logger_config_node_url = #{nodeUrl} " +
            "AND plugin_node_logger_config_status != 'DELETED'")
    java.util.Map<String, Object> selectLoggerStats(@Param("nodeUrl") String nodeUrl);
}
