package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.page.PageResult;
import com.chua.common.support.protocol.server.request.PageRequest;
import com.chua.common.support.utils.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerProxy;

import java.util.List;
import java.util.Map;

/**
 * 服务器代理配置服务接口
 *
 * @author CH
 * @since 2024/12/25
 */
public interface MonitorSysGenServerProxyService extends IService<MonitorSysGenServerProxy> {

    /**
     * 分页查询代理列表
     *
     * @param pageRequest 分页请求
     * @return 分页结果
     */
    ReturnResult<PageResult<MonitorSysGenServerProxy>> getProxyPageList(PageRequest pageRequest);

    /**
     * 获取启用的代理列表
     *
     * @return 代理列表
     */
    ReturnResult<List<MonitorSysGenServerProxy>> getEnabledProxyList();

    /**
     * 根据代理类型获取代理列表
     *
     * @param proxyType 代理类型
     * @return 代理列表
     */
    ReturnResult<List<MonitorSysGenServerProxy>> getProxyListByType(String proxyType);

    /**
     * 保存代理配置
     *
     * @param proxy 代理配置
     * @return 保存结果
     */
    ReturnResult<MonitorSysGenServerProxy> saveProxy(MonitorSysGenServerProxy proxy);

    /**
     * 更新代理配置
     *
     * @param proxy 代理配置
     * @return 更新结果
     */
    ReturnResult<MonitorSysGenServerProxy> updateProxy(MonitorSysGenServerProxy proxy);

    /**
     * 删除代理配置
     *
     * @param proxyId 代理ID
     * @return 删除结果
     */
    ReturnResult<Boolean> deleteProxy(Integer proxyId);

    /**
     * 批量删除代理配置
     *
     * @param proxyIds 代理ID列表
     * @return 删除结果
     */
    ReturnResult<Boolean> batchDeleteProxy(List<Integer> proxyIds);

    /**
     * 测试代理连接
     *
     * @param proxyId 代理ID
     * @param testUrl 测试URL
     * @return 测试结果
     */
    ReturnResult<Map<String, Object>> testProxyConnection(Integer proxyId, String testUrl);

    /**
     * 批量测试代理连接
     *
     * @param proxyIds 代理ID列表
     * @param testUrl 测试URL
     * @return 测试结果
     */
    ReturnResult<List<Map<String, Object>>> batchTestProxyConnection(List<Integer> proxyIds, String testUrl);

    /**
     * 更新代理状态
     *
     * @param proxyId 代理ID
     * @param status 状态
     * @return 更新结果
     */
    ReturnResult<Boolean> updateProxyStatus(Integer proxyId, Integer status);

    /**
     * 批量更新代理状态
     *
     * @param proxyIds 代理ID列表
     * @param status 状态
     * @return 更新结果
     */
    ReturnResult<Boolean> batchUpdateProxyStatus(List<Integer> proxyIds, Integer status);

    /**
     * 获取代理统计信息
     *
     * @return 统计信息
     */
    ReturnResult<Map<String, Object>> getProxyStatistics();

    /**
     * 根据标签获取代理列表
     *
     * @param tags 标签
     * @return 代理列表
     */
    ReturnResult<List<MonitorSysGenServerProxy>> getProxyListByTags(String tags);

    /**
     * 获取代理详情
     *
     * @param proxyId 代理ID
     * @return 代理详情
     */
    ReturnResult<MonitorSysGenServerProxy> getProxyDetail(Integer proxyId);

    /**
     * 复制代理配置
     *
     * @param proxyId 代理ID
     * @param newName 新名称
     * @return 复制结果
     */
    ReturnResult<MonitorSysGenServerProxy> copyProxy(Integer proxyId, String newName);

    /**
     * 导入代理配置
     *
     * @param proxyList 代理列表
     * @return 导入结果
     */
    ReturnResult<List<MonitorSysGenServerProxy>> importProxyList(List<MonitorSysGenServerProxy> proxyList);

    /**
     * 导出代理配置
     *
     * @param proxyIds 代理ID列表
     * @return 导出结果
     */
    ReturnResult<List<MonitorSysGenServerProxy>> exportProxyList(List<Integer> proxyIds);
}
