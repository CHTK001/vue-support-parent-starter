package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.common.support.lang.page.PageResult;
import com.chua.common.support.protocol.server.request.PageRequest;
import com.chua.common.support.utils.ReturnResult;
import com.chua.common.support.utils.StringUtils;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerProxy;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenServerProxyMapper;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerProxyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.HttpURLConnection;
import java.net.InetSocketAddress;
import java.net.Proxy;
import java.net.URL;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

/**
 * 服务器代理配置服务实现
 *
 * @author CH
 * @since 2024/12/25
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSysGenServerProxyServiceImpl extends ServiceImpl<MonitorSysGenServerProxyMapper, MonitorSysGenServerProxy> 
        implements MonitorSysGenServerProxyService {

    private final MonitorSysGenServerProxyMapper proxyMapper;
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);

    @Override
    public ReturnResult<PageResult<MonitorSysGenServerProxy>> getProxyPageList(PageRequest pageRequest) {
        try {
            Page<MonitorSysGenServerProxy> page = new Page<>(pageRequest.getPage(), pageRequest.getPageSize());
            
            LambdaQueryWrapper<MonitorSysGenServerProxy> queryWrapper = new LambdaQueryWrapper<>();
            
            // 根据名称搜索
            if (StringUtils.isNotEmpty(pageRequest.getKeyword())) {
                queryWrapper.like(MonitorSysGenServerProxy::getMonitorSysGenServerProxyName, pageRequest.getKeyword())
                           .or()
                           .like(MonitorSysGenServerProxy::getMonitorSysGenServerProxyHost, pageRequest.getKeyword())
                           .or()
                           .like(MonitorSysGenServerProxy::getMonitorSysGenServerProxyDescription, pageRequest.getKeyword());
            }
            
            // 根据状态筛选
            if (pageRequest.getParams() != null && pageRequest.getParams().containsKey("status")) {
                Integer status = (Integer) pageRequest.getParams().get("status");
                if (status != null) {
                    queryWrapper.eq(MonitorSysGenServerProxy::getMonitorSysGenServerProxyStatus, status);
                }
            }
            
            // 根据类型筛选
            if (pageRequest.getParams() != null && pageRequest.getParams().containsKey("type")) {
                String type = (String) pageRequest.getParams().get("type");
                if (StringUtils.isNotEmpty(type)) {
                    queryWrapper.eq(MonitorSysGenServerProxy::getMonitorSysGenServerProxyType, type);
                }
            }
            
            queryWrapper.orderByDesc(MonitorSysGenServerProxy::getUpdateTime);
            
            IPage<MonitorSysGenServerProxy> result = page(page, queryWrapper);
            
            PageResult<MonitorSysGenServerProxy> pageResult = new PageResult<>();
            pageResult.setData(result.getRecords());
            pageResult.setTotal(result.getTotal());
            pageResult.setPage(result.getCurrent());
            pageResult.setPageSize(result.getSize());
            
            return ReturnResult.ok(pageResult);
            
        } catch (Exception e) {
            log.error("分页查询代理列表失败", e);
            return ReturnResult.error("查询失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerProxy>> getEnabledProxyList() {
        try {
            List<MonitorSysGenServerProxy> proxyList = proxyMapper.getEnabledProxyList();
            return ReturnResult.ok(proxyList);
        } catch (Exception e) {
            log.error("获取启用代理列表失败", e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerProxy>> getProxyListByType(String proxyType) {
        try {
            List<MonitorSysGenServerProxy> proxyList = proxyMapper.getProxyListByType(proxyType);
            return ReturnResult.ok(proxyList);
        } catch (Exception e) {
            log.error("根据类型获取代理列表失败", e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerProxy> saveProxy(MonitorSysGenServerProxy proxy) {
        try {
            // 检查名称是否重复
            LambdaQueryWrapper<MonitorSysGenServerProxy> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(MonitorSysGenServerProxy::getMonitorSysGenServerProxyName, proxy.getMonitorSysGenServerProxyName());
            if (count(queryWrapper) > 0) {
                return ReturnResult.error("代理名称已存在");
            }
            
            // 设置默认值
            if (proxy.getMonitorSysGenServerProxyStatus() == null) {
                proxy.setMonitorSysGenServerProxyStatus(1);
            }
            if (proxy.getMonitorSysGenServerProxyTimeout() == null) {
                proxy.setMonitorSysGenServerProxyTimeout(30000);
            }
            if (proxy.getMonitorSysGenServerProxyAuthRequired() == null) {
                proxy.setMonitorSysGenServerProxyAuthRequired(0);
            }
            
            save(proxy);
            return ReturnResult.ok(proxy);
            
        } catch (Exception e) {
            log.error("保存代理配置失败", e);
            return ReturnResult.error("保存失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerProxy> updateProxy(MonitorSysGenServerProxy proxy) {
        try {
            // 检查代理是否存在
            MonitorSysGenServerProxy existingProxy = getById(proxy.getMonitorSysGenServerProxyId());
            if (existingProxy == null) {
                return ReturnResult.error("代理配置不存在");
            }
            
            // 检查名称是否重复（排除自己）
            LambdaQueryWrapper<MonitorSysGenServerProxy> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(MonitorSysGenServerProxy::getMonitorSysGenServerProxyName, proxy.getMonitorSysGenServerProxyName())
                       .ne(MonitorSysGenServerProxy::getMonitorSysGenServerProxyId, proxy.getMonitorSysGenServerProxyId());
            if (count(queryWrapper) > 0) {
                return ReturnResult.error("代理名称已存在");
            }
            
            updateById(proxy);
            return ReturnResult.ok(proxy);
            
        } catch (Exception e) {
            log.error("更新代理配置失败", e);
            return ReturnResult.error("更新失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> deleteProxy(Integer proxyId) {
        try {
            boolean result = removeById(proxyId);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("删除代理配置失败", e);
            return ReturnResult.error("删除失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> batchDeleteProxy(List<Integer> proxyIds) {
        try {
            boolean result = removeByIds(proxyIds);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("批量删除代理配置失败", e);
            return ReturnResult.error("批量删除失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> testProxyConnection(Integer proxyId, String testUrl) {
        try {
            MonitorSysGenServerProxy proxy = getById(proxyId);
            if (proxy == null) {
                return ReturnResult.error("代理配置不存在");
            }

            Map<String, Object> result = performProxyTest(proxy, testUrl);

            // 更新测试结果
            Integer testResult = (Integer) result.get("success");
            Integer testLatency = (Integer) result.get("latency");
            proxyMapper.updateProxyTestResult(proxyId, testResult, testLatency, System.currentTimeMillis());

            return ReturnResult.ok(result);

        } catch (Exception e) {
            log.error("测试代理连接失败", e);
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<Map<String, Object>>> batchTestProxyConnection(List<Integer> proxyIds, String testUrl) {
        try {
            List<CompletableFuture<Map<String, Object>>> futures = proxyIds.stream()
                .map(proxyId -> CompletableFuture.supplyAsync(() -> {
                    try {
                        ReturnResult<Map<String, Object>> result = testProxyConnection(proxyId, testUrl);
                        Map<String, Object> testResult = result.getData();
                        testResult.put("proxyId", proxyId);
                        return testResult;
                    } catch (Exception e) {
                        Map<String, Object> errorResult = new HashMap<>();
                        errorResult.put("proxyId", proxyId);
                        errorResult.put("success", 0);
                        errorResult.put("error", e.getMessage());
                        return errorResult;
                    }
                }, executorService))
                .collect(Collectors.toList());

            List<Map<String, Object>> results = futures.stream()
                .map(CompletableFuture::join)
                .collect(Collectors.toList());

            return ReturnResult.ok(results);

        } catch (Exception e) {
            log.error("批量测试代理连接失败", e);
            return ReturnResult.error("批量测试失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateProxyStatus(Integer proxyId, Integer status) {
        try {
            MonitorSysGenServerProxy proxy = new MonitorSysGenServerProxy();
            proxy.setMonitorSysGenServerProxyId(proxyId);
            proxy.setMonitorSysGenServerProxyStatus(status);
            boolean result = updateById(proxy);
            return ReturnResult.ok(result);
        } catch (Exception e) {
            log.error("更新代理状态失败", e);
            return ReturnResult.error("更新失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> batchUpdateProxyStatus(List<Integer> proxyIds, Integer status) {
        try {
            int result = proxyMapper.batchUpdateProxyStatus(proxyIds, status);
            return ReturnResult.ok(result > 0);
        } catch (Exception e) {
            log.error("批量更新代理状态失败", e);
            return ReturnResult.error("批量更新失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getProxyStatistics() {
        try {
            Map<String, Object> statistics = proxyMapper.getProxyStatistics();
            return ReturnResult.ok(statistics);
        } catch (Exception e) {
            log.error("获取代理统计信息失败", e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerProxy>> getProxyListByTags(String tags) {
        try {
            List<MonitorSysGenServerProxy> proxyList = proxyMapper.getProxyListByTags(tags);
            return ReturnResult.ok(proxyList);
        } catch (Exception e) {
            log.error("根据标签获取代理列表失败", e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<MonitorSysGenServerProxy> getProxyDetail(Integer proxyId) {
        try {
            MonitorSysGenServerProxy proxy = getById(proxyId);
            if (proxy == null) {
                return ReturnResult.error("代理配置不存在");
            }
            return ReturnResult.ok(proxy);
        } catch (Exception e) {
            log.error("获取代理详情失败", e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerProxy> copyProxy(Integer proxyId, String newName) {
        try {
            MonitorSysGenServerProxy originalProxy = getById(proxyId);
            if (originalProxy == null) {
                return ReturnResult.error("原代理配置不存在");
            }

            // 检查新名称是否重复
            LambdaQueryWrapper<MonitorSysGenServerProxy> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(MonitorSysGenServerProxy::getMonitorSysGenServerProxyName, newName);
            if (count(queryWrapper) > 0) {
                return ReturnResult.error("代理名称已存在");
            }

            MonitorSysGenServerProxy newProxy = new MonitorSysGenServerProxy();
            newProxy.setMonitorSysGenServerProxyName(newName);
            newProxy.setMonitorSysGenServerProxyType(originalProxy.getMonitorSysGenServerProxyType());
            newProxy.setMonitorSysGenServerProxyHost(originalProxy.getMonitorSysGenServerProxyHost());
            newProxy.setMonitorSysGenServerProxyPort(originalProxy.getMonitorSysGenServerProxyPort());
            newProxy.setMonitorSysGenServerProxyUsername(originalProxy.getMonitorSysGenServerProxyUsername());
            newProxy.setMonitorSysGenServerProxyPassword(originalProxy.getMonitorSysGenServerProxyPassword());
            newProxy.setMonitorSysGenServerProxyStatus(0); // 复制的代理默认禁用
            newProxy.setMonitorSysGenServerProxyDescription(originalProxy.getMonitorSysGenServerProxyDescription() + " (复制)");
            newProxy.setMonitorSysGenServerProxyTimeout(originalProxy.getMonitorSysGenServerProxyTimeout());
            newProxy.setMonitorSysGenServerProxyAuthRequired(originalProxy.getMonitorSysGenServerProxyAuthRequired());
            newProxy.setMonitorSysGenServerProxyTags(originalProxy.getMonitorSysGenServerProxyTags());

            save(newProxy);
            return ReturnResult.ok(newProxy);

        } catch (Exception e) {
            log.error("复制代理配置失败", e);
            return ReturnResult.error("复制失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<List<MonitorSysGenServerProxy>> importProxyList(List<MonitorSysGenServerProxy> proxyList) {
        try {
            List<MonitorSysGenServerProxy> savedProxies = new ArrayList<>();

            for (MonitorSysGenServerProxy proxy : proxyList) {
                // 检查名称是否重复，如果重复则添加后缀
                String originalName = proxy.getMonitorSysGenServerProxyName();
                String uniqueName = generateUniqueName(originalName);
                proxy.setMonitorSysGenServerProxyName(uniqueName);

                // 重置ID和时间字段
                proxy.setMonitorSysGenServerProxyId(null);
                proxy.setCreateTime(null);
                proxy.setUpdateTime(null);

                save(proxy);
                savedProxies.add(proxy);
            }

            return ReturnResult.ok(savedProxies);

        } catch (Exception e) {
            log.error("导入代理配置失败", e);
            return ReturnResult.error("导入失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerProxy>> exportProxyList(List<Integer> proxyIds) {
        try {
            List<MonitorSysGenServerProxy> proxyList;

            if (proxyIds == null || proxyIds.isEmpty()) {
                // 导出所有代理
                proxyList = list();
            } else {
                // 导出指定代理
                proxyList = listByIds(proxyIds);
            }

            // 清除敏感信息
            proxyList.forEach(proxy -> {
                proxy.setMonitorSysGenServerProxyPassword(""); // 清除密码
                proxy.setMonitorSysGenServerProxyId(null); // 清除ID
                proxy.setCreateTime(null);
                proxy.setUpdateTime(null);
                proxy.setCreateBy(null);
                proxy.setUpdateBy(null);
            });

            return ReturnResult.ok(proxyList);

        } catch (Exception e) {
            log.error("导出代理配置失败", e);
            return ReturnResult.error("导出失败: " + e.getMessage());
        }
    }

    /**
     * 执行代理测试
     */
    private Map<String, Object> performProxyTest(MonitorSysGenServerProxy proxy, String testUrl) {
        Map<String, Object> result = new HashMap<>();
        long startTime = System.currentTimeMillis();

        try {
            if (StringUtils.isEmpty(testUrl)) {
                testUrl = "http://www.google.com";
            }

            URL url = new URL(testUrl);
            Proxy.Type proxyType = getProxyType(proxy.getMonitorSysGenServerProxyType());
            InetSocketAddress proxyAddress = new InetSocketAddress(
                proxy.getMonitorSysGenServerProxyHost(),
                proxy.getMonitorSysGenServerProxyPort()
            );

            Proxy proxyObj = new Proxy(proxyType, proxyAddress);
            HttpURLConnection connection = (HttpURLConnection) url.openConnection(proxyObj);

            connection.setConnectTimeout(proxy.getMonitorSysGenServerProxyTimeout());
            connection.setReadTimeout(proxy.getMonitorSysGenServerProxyTimeout());
            connection.setRequestMethod("GET");

            int responseCode = connection.getResponseCode();
            long endTime = System.currentTimeMillis();
            int latency = (int) (endTime - startTime);

            result.put("success", responseCode == 200 ? 1 : 0);
            result.put("responseCode", responseCode);
            result.put("latency", latency);
            result.put("message", responseCode == 200 ? "连接成功" : "连接失败，响应码: " + responseCode);

        } catch (Exception e) {
            long endTime = System.currentTimeMillis();
            int latency = (int) (endTime - startTime);

            result.put("success", 0);
            result.put("latency", latency);
            result.put("error", e.getMessage());
            result.put("message", "连接失败: " + e.getMessage());
        }

        return result;
    }

    /**
     * 获取代理类型
     */
    private Proxy.Type getProxyType(String proxyType) {
        switch (proxyType.toUpperCase()) {
            case "HTTP":
                return Proxy.Type.HTTP;
            case "SOCKS4":
            case "SOCKS5":
                return Proxy.Type.SOCKS;
            default:
                return Proxy.Type.HTTP;
        }
    }

    /**
     * 生成唯一名称
     */
    private String generateUniqueName(String originalName) {
        String baseName = originalName;
        int counter = 1;

        while (true) {
            LambdaQueryWrapper<MonitorSysGenServerProxy> queryWrapper = new LambdaQueryWrapper<>();
            queryWrapper.eq(MonitorSysGenServerProxy::getMonitorSysGenServerProxyName, baseName);

            if (count(queryWrapper) == 0) {
                return baseName;
            }

            baseName = originalName + "_" + counter;
            counter++;
        }
    }
}
