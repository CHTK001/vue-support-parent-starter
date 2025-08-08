package com.chua.starter.monitor.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.entity.SystemServer;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * 系统服务器Mapper接口
 *
 * @author CH
 * @since 2025/01/07
 */
@Mapper
public interface SystemServerMapper extends BaseMapper<SystemServer> {

    /**
     * 根据服务器类型统计数量
     *
     * @return 类型统计
     */
    List<Map<String, Object>> countByType();

    /**
     * 根据状态统计数量
     *
     * @return 状态统计
     */
    List<Map<String, Object>> countByStatus();

    /**
     * 根据环境统计数量
     *
     * @return 环境统计
     */
    List<Map<String, Object>> countByEnvironment();

    /**
     * 获取启用的服务器列表
     *
     * @return 服务器列表
     */
    List<SystemServer> selectEnabledServers();

    /**
     * 获取自动启动的服务器列表
     *
     * @return 服务器列表
     */
    List<SystemServer> selectAutoStartServers();

    /**
     * 根据端口查询服务器
     *
     * @param port 端口号
     * @return 服务器列表
     */
    List<SystemServer> selectByPort(@Param("port") Integer port);

    /**
     * 根据服务器类型查询服务器
     *
     * @param type 服务器类型
     * @return 服务器列表
     */
    List<SystemServer> selectByType(@Param("type") String type);

    /**
     * 根据环境查询服务器
     *
     * @param environment 环境
     * @return 服务器列表
     */
    List<SystemServer> selectByEnvironment(@Param("environment") String environment);

    /**
     * 根据状态查询服务器
     *
     * @param status 状态
     * @return 服务器列表
     */
    List<SystemServer> selectByStatus(@Param("status") String status);

    /**
     * 根据分组查询服务器
     *
     * @param groupId 分组ID
     * @return 服务器列表
     */
    List<SystemServer> selectByGroupId(@Param("groupId") Integer groupId);

    /**
     * 根据标签查询服务器
     *
     * @param tags 标签
     * @return 服务器列表
     */
    List<SystemServer> selectByTags(@Param("tags") String tags);

    /**
     * 获取运行中的服务器数量
     *
     * @return 运行中的服务器数量
     */
    Long countRunningServers();

    /**
     * 获取停止的服务器数量
     *
     * @return 停止的服务器数量
     */
    Long countStoppedServers();

    /**
     * 获取错误状态的服务器数量
     *
     * @return 错误状态的服务器数量
     */
    Long countErrorServers();

    /**
     * 获取启用的服务器数量
     *
     * @return 启用的服务器数量
     */
    Long countEnabledServers();

    /**
     * 获取禁用的服务器数量
     *
     * @return 禁用的服务器数量
     */
    Long countDisabledServers();

    /**
     * 批量更新服务器状态
     *
     * @param serverIds 服务器ID列表
     * @param status 新状态
     * @return 更新数量
     */
    Integer batchUpdateStatus(@Param("serverIds") List<Integer> serverIds, @Param("status") String status);

    /**
     * 批量启用/禁用服务器
     *
     * @param serverIds 服务器ID列表
     * @param enabled 启用状态
     * @return 更新数量
     */
    Integer batchUpdateEnabled(@Param("serverIds") List<Integer> serverIds, @Param("enabled") Integer enabled);

    /**
     * 根据名称模糊查询服务器
     *
     * @param name 服务器名称
     * @return 服务器列表
     */
    List<SystemServer> selectByNameLike(@Param("name") String name);

    /**
     * 获取服务器性能统计
     *
     * @return 性能统计
     */
    List<Map<String, Object>> getPerformanceStatistics();

    /**
     * 获取服务器使用率统计
     *
     * @return 使用率统计
     */
    List<Map<String, Object>> getUsageStatistics();

    /**
     * 检查服务器名称是否存在
     *
     * @param name 服务器名称
     * @param excludeId 排除的服务器ID
     * @return 是否存在
     */
    Integer checkNameExists(@Param("name") String name, @Param("excludeId") Integer excludeId);

    /**
     * 检查端口是否被使用
     *
     * @param port 端口号
     * @param excludeId 排除的服务器ID
     * @return 是否被使用
     */
    Integer checkPortExists(@Param("port") Integer port, @Param("excludeId") Integer excludeId);

    /**
     * 获取服务器健康状态统计
     *
     * @return 健康状态统计
     */
    List<Map<String, Object>> getHealthStatistics();

    /**
     * 获取最近创建的服务器
     *
     * @param limit 限制数量
     * @return 服务器列表
     */
    List<SystemServer> selectRecentCreated(@Param("limit") Integer limit);

    /**
     * 获取最近更新的服务器
     *
     * @param limit 限制数量
     * @return 服务器列表
     */
    List<SystemServer> selectRecentUpdated(@Param("limit") Integer limit);

    /**
     * 获取服务器配置摘要
     *
     * @return 配置摘要
     */
    List<Map<String, Object>> getConfigSummary();
}
