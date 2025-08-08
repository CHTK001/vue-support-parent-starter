package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServer;
import com.chua.starter.monitor.starter.pojo.ServerStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 系统服务器配置Mapper接口
 * 
 * @author CH
 * @since 2025/01/17
 */
@Mapper
public interface MonitorSysGenServerMapper extends BaseMapper<MonitorSysGenServer> {

    /**
     * 分页查询服务器配置
     * 
     * @param page       分页参数
     * @param serverName 服务器名称（模糊查询）
     * @param serverType 服务器类型
     * @param status     服务器状态
     * @return 分页结果
     */
    IPage<MonitorSysGenServer> selectPageWithConditions(
            Page<MonitorSysGenServer> page,
            @Param("serverName") String serverName,
            @Param("serverType") String serverType,
            @Param("status") String status
    );

    /**
     * 根据服务器名称查询
     * 
     * @param serverName 服务器名称
     * @return 服务器配置
     */
    MonitorSysGenServer selectByName(@Param("serverName") String serverName);

    /**
     * 根据服务器类型查询列表
     * 
     * @param serverType 服务器类型
     * @return 服务器配置列表
     */
    List<MonitorSysGenServer> selectByType(@Param("serverType") String serverType);

    /**
     * 根据服务器状态查询列表
     * 
     * @param status 服务器状态
     * @return 服务器配置列表
     */
    List<MonitorSysGenServer> selectByStatus(@Param("status") String status);

    /**
     * 查询自动启动的服务器列表
     * 
     * @return 自动启动的服务器列表
     */
    List<MonitorSysGenServer> selectAutoStartServers();

    /**
     * 查询启用的服务器列表
     * 
     * @return 启用的服务器列表
     */
    List<MonitorSysGenServer> selectEnabledServers();

    /**
     * 更新服务器状态
     * 
     * @param serverId 服务器ID
     * @param status   新状态
     * @return 更新行数
     */
    int updateStatus(@Param("serverId") Integer serverId, @Param("status") String status);

    /**
     * 更新服务器启动时间
     * 
     * @param serverId  服务器ID
     * @param startTime 启动时间
     * @return 更新行数
     */
    int updateStartTime(@Param("serverId") Integer serverId, @Param("startTime") java.time.LocalDateTime startTime);

    /**
     * 更新服务器停止时间
     * 
     * @param serverId 服务器ID
     * @param stopTime 停止时间
     * @return 更新行数
     */
    int updateStopTime(@Param("serverId") Integer serverId, @Param("stopTime") java.time.LocalDateTime stopTime);

    /**
     * 更新服务器运行时长
     * 
     * @param serverId 服务器ID
     * @param uptime   运行时长（秒）
     * @return 更新行数
     */
    int updateUptime(@Param("serverId") Integer serverId, @Param("uptime") Long uptime);

    /**
     * 更新服务器PID
     * 
     * @param serverId 服务器ID
     * @param pid      进程ID
     * @return 更新行数
     */
    int updatePid(@Param("serverId") Integer serverId, @Param("pid") Integer pid);

    /**
     * 更新服务器错误信息
     * 
     * @param serverId     服务器ID
     * @param errorMessage 错误信息
     * @return 更新行数
     */
    int updateErrorMessage(@Param("serverId") Integer serverId, @Param("errorMessage") String errorMessage);

    /**
     * 增加服务器重启次数
     * 
     * @param serverId 服务器ID
     * @return 更新行数
     */
    int incrementRestartCount(@Param("serverId") Integer serverId);

    /**
     * 更新服务器健康检查时间
     * 
     * @param serverId           服务器ID
     * @param lastHealthCheckTime 最后健康检查时间
     * @return 更新行数
     */
    int updateLastHealthCheckTime(@Param("serverId") Integer serverId, @Param("lastHealthCheckTime") java.time.LocalDateTime lastHealthCheckTime);

    /**
     * 检查端口是否被占用
     * 
     * @param port      端口号
     * @param excludeId 排除的服务器ID
     * @return 占用该端口的服务器数量
     */
    int countByPort(@Param("port") Integer port, @Param("excludeId") Integer excludeId);

    /**
     * 查询运行中的服务器数量
     * 
     * @return 运行中的服务器数量
     */
    int countRunningServers();

    /**
     * 查询已停止的服务器数量
     * 
     * @return 已停止的服务器数量
     */
    int countStoppedServers();

    /**
     * 查询异常的服务器数量
     * 
     * @return 异常的服务器数量
     */
    int countErrorServers();

    /**
     * 查询启用的服务器数量
     * 
     * @return 启用的服务器数量
     */
    int countEnabledServers();

    /**
     * 查询自动启动的服务器数量
     * 
     * @return 自动启动的服务器数量
     */
    int countAutoStartServers();

    /**
     * 查询所有可用的服务器类型
     * 
     * @return 服务器类型列表
     */
    List<String> selectDistinctTypes();

    /**
     * 查询所有可用的服务器环境
     * 
     * @return 服务器环境列表
     */
    List<String> selectDistinctEnvironments();

    /**
     * 根据服务器类型统计数量
     * 
     * @return 类型统计结果
     */
    List<java.util.Map<String, Object>> countByType();

    /**
     * 根据服务器状态统计数量
     * 
     * @return 状态统计结果
     */
    List<java.util.Map<String, Object>> countByStatus();

    /**
     * 根据服务器环境统计数量
     * 
     * @return 环境统计结果
     */
    List<java.util.Map<String, Object>> countByEnvironment();

    /**
     * 查询平均运行时长
     * 
     * @return 平均运行时长（秒）
     */
    Long selectAverageUptime();

    /**
     * 查询总运行时长
     * 
     * @return 总运行时长（秒）
     */
    Long selectTotalUptime();

    /**
     * 查询最长运行时长
     * 
     * @return 最长运行时长（秒）
     */
    Long selectMaxUptime();

    /**
     * 查询最短运行时长
     * 
     * @return 最短运行时长（秒）
     */
    Long selectMinUptime();

    /**
     * 查询总重启次数
     * 
     * @return 总重启次数
     */
    Integer selectTotalRestartCount();

    /**
     * 查询平均重启次数
     * 
     * @return 平均重启次数
     */
    Double selectAverageRestartCount();

    /**
     * 查询健康的服务器数量（最近健康检查通过）
     * 
     * @param minutes 检查最近多少分钟内的健康检查
     * @return 健康的服务器数量
     */
    int countHealthyServers(@Param("minutes") Integer minutes);

    /**
     * 查询不健康的服务器数量（最近健康检查失败或超时）
     * 
     * @param minutes 检查最近多少分钟内的健康检查
     * @return 不健康的服务器数量
     */
    int countUnhealthyServers(@Param("minutes") Integer minutes);

    /**
     * 查询使用SSL的服务器数量
     * 
     * @return 使用SSL的服务器数量
     */
    int countSslEnabledServers();

    /**
     * 批量更新服务器状态
     * 
     * @param serverIds 服务器ID列表
     * @param status    新状态
     * @return 更新行数
     */
    int batchUpdateStatus(@Param("serverIds") List<Integer> serverIds, @Param("status") String status);

    /**
     * 批量删除服务器
     * 
     * @param serverIds 服务器ID列表
     * @return 删除行数
     */
    int batchDeleteByIds(@Param("serverIds") List<Integer> serverIds);
}
