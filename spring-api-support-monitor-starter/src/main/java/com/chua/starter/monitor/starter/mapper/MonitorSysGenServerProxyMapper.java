package com.chua.starter.monitor.starter.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerProxy;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;
import java.util.Map;

/**
 * 服务器代理配置Mapper
 *
 * @author CH
 * @since 2024/12/25
 */
@Mapper
public interface MonitorSysGenServerProxyMapper extends BaseMapper<MonitorSysGenServerProxy> {

    /**
     * 获取启用的代理列表
     *
     * @return 代理列表
     */
    List<MonitorSysGenServerProxy> getEnabledProxyList();

    /**
     * 根据代理类型获取代理列表
     *
     * @param proxyType 代理类型
     * @return 代理列表
     */
    List<MonitorSysGenServerProxy> getProxyListByType(@Param("proxyType") String proxyType);

    /**
     * 测试代理连接
     *
     * @param proxyId 代理ID
     * @param testUrl 测试URL
     * @return 测试结果
     */
    Map<String, Object> testProxyConnection(@Param("proxyId") Integer proxyId, @Param("testUrl") String testUrl);

    /**
     * 更新代理测试结果
     *
     * @param proxyId 代理ID
     * @param testResult 测试结果
     * @param testLatency 测试延迟
     * @param testTime 测试时间
     * @return 更新结果
     */
    int updateProxyTestResult(@Param("proxyId") Integer proxyId, 
                             @Param("testResult") Integer testResult,
                             @Param("testLatency") Integer testLatency,
                             @Param("testTime") Long testTime);

    /**
     * 获取代理统计信息
     *
     * @return 统计信息
     */
    Map<String, Object> getProxyStatistics();

    /**
     * 根据标签获取代理列表
     *
     * @param tags 标签
     * @return 代理列表
     */
    List<MonitorSysGenServerProxy> getProxyListByTags(@Param("tags") String tags);

    /**
     * 批量更新代理状态
     *
     * @param proxyIds 代理ID列表
     * @param status 状态
     * @return 更新结果
     */
    int batchUpdateProxyStatus(@Param("proxyIds") List<Integer> proxyIds, @Param("status") Integer status);
}
