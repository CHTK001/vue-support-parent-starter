package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.page.PageResult;
import com.chua.common.support.protocol.server.request.PageRequest;
import com.chua.common.support.utils.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerProxy;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerProxyService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 服务器代理配置控制器
 *
 * @author CH
 * @since 2024/12/25
 */
@Slf4j
@RestController
@RequestMapping("/v1/gen/server/proxy")
@RequiredArgsConstructor
@Api(tags = "服务器代理配置管理")
@Tag(name = "服务器代理配置管理", description = "服务器代理配置相关接口")
public class MonitorSysGenServerProxyController {

    private final MonitorSysGenServerProxyService proxyService;

    /**
     * 分页查询代理列表
     */
    @PostMapping("/page")
    @ApiOperation("分页查询代理列表")
    @Operation(summary = "分页查询代理列表")
    public ReturnResult<PageResult<MonitorSysGenServerProxy>> getProxyPageList(@RequestBody PageRequest pageRequest) {
        return proxyService.getProxyPageList(pageRequest);
    }

    /**
     * 获取启用的代理列表
     */
    @GetMapping("/enabled")
    @ApiOperation("获取启用的代理列表")
    @Operation(summary = "获取启用的代理列表")
    public ReturnResult<List<MonitorSysGenServerProxy>> getEnabledProxyList() {
        return proxyService.getEnabledProxyList();
    }

    /**
     * 根据代理类型获取代理列表
     */
    @GetMapping("/type/{proxyType}")
    @ApiOperation("根据代理类型获取代理列表")
    @Operation(summary = "根据代理类型获取代理列表")
    public ReturnResult<List<MonitorSysGenServerProxy>> getProxyListByType(@PathVariable String proxyType) {
        return proxyService.getProxyListByType(proxyType);
    }

    /**
     * 获取代理详情
     */
    @GetMapping("/{proxyId}")
    @ApiOperation("获取代理详情")
    @Operation(summary = "获取代理详情")
    public ReturnResult<MonitorSysGenServerProxy> getProxyDetail(@PathVariable Integer proxyId) {
        return proxyService.getProxyDetail(proxyId);
    }

    /**
     * 保存代理配置
     */
    @PostMapping("/save")
    @ApiOperation("保存代理配置")
    @Operation(summary = "保存代理配置")
    public ReturnResult<MonitorSysGenServerProxy> saveProxy(@RequestBody MonitorSysGenServerProxy proxy) {
        return proxyService.saveProxy(proxy);
    }

    /**
     * 更新代理配置
     */
    @PutMapping("/update")
    @ApiOperation("更新代理配置")
    @Operation(summary = "更新代理配置")
    public ReturnResult<MonitorSysGenServerProxy> updateProxy(@RequestBody MonitorSysGenServerProxy proxy) {
        return proxyService.updateProxy(proxy);
    }

    /**
     * 删除代理配置
     */
    @DeleteMapping("/{proxyId}")
    @ApiOperation("删除代理配置")
    @Operation(summary = "删除代理配置")
    public ReturnResult<Boolean> deleteProxy(@PathVariable Integer proxyId) {
        return proxyService.deleteProxy(proxyId);
    }

    /**
     * 批量删除代理配置
     */
    @DeleteMapping("/batch")
    @ApiOperation("批量删除代理配置")
    @Operation(summary = "批量删除代理配置")
    public ReturnResult<Boolean> batchDeleteProxy(@RequestBody List<Integer> proxyIds) {
        return proxyService.batchDeleteProxy(proxyIds);
    }

    /**
     * 测试代理连接
     */
    @PostMapping("/test/{proxyId}")
    @ApiOperation("测试代理连接")
    @Operation(summary = "测试代理连接")
    public ReturnResult<Map<String, Object>> testProxyConnection(@PathVariable Integer proxyId, 
                                                                @RequestParam(required = false) String testUrl) {
        return proxyService.testProxyConnection(proxyId, testUrl);
    }

    /**
     * 批量测试代理连接
     */
    @PostMapping("/test/batch")
    @ApiOperation("批量测试代理连接")
    @Operation(summary = "批量测试代理连接")
    public ReturnResult<List<Map<String, Object>>> batchTestProxyConnection(@RequestBody List<Integer> proxyIds,
                                                                           @RequestParam(required = false) String testUrl) {
        return proxyService.batchTestProxyConnection(proxyIds, testUrl);
    }

    /**
     * 更新代理状态
     */
    @PutMapping("/status/{proxyId}")
    @ApiOperation("更新代理状态")
    @Operation(summary = "更新代理状态")
    public ReturnResult<Boolean> updateProxyStatus(@PathVariable Integer proxyId, @RequestParam Integer status) {
        return proxyService.updateProxyStatus(proxyId, status);
    }

    /**
     * 批量更新代理状态
     */
    @PutMapping("/status/batch")
    @ApiOperation("批量更新代理状态")
    @Operation(summary = "批量更新代理状态")
    public ReturnResult<Boolean> batchUpdateProxyStatus(@RequestBody List<Integer> proxyIds, @RequestParam Integer status) {
        return proxyService.batchUpdateProxyStatus(proxyIds, status);
    }

    /**
     * 获取代理统计信息
     */
    @GetMapping("/statistics")
    @ApiOperation("获取代理统计信息")
    @Operation(summary = "获取代理统计信息")
    public ReturnResult<Map<String, Object>> getProxyStatistics() {
        return proxyService.getProxyStatistics();
    }

    /**
     * 根据标签获取代理列表
     */
    @GetMapping("/tags/{tags}")
    @ApiOperation("根据标签获取代理列表")
    @Operation(summary = "根据标签获取代理列表")
    public ReturnResult<List<MonitorSysGenServerProxy>> getProxyListByTags(@PathVariable String tags) {
        return proxyService.getProxyListByTags(tags);
    }

    /**
     * 复制代理配置
     */
    @PostMapping("/copy/{proxyId}")
    @ApiOperation("复制代理配置")
    @Operation(summary = "复制代理配置")
    public ReturnResult<MonitorSysGenServerProxy> copyProxy(@PathVariable Integer proxyId, @RequestParam String newName) {
        return proxyService.copyProxy(proxyId, newName);
    }

    /**
     * 导入代理配置
     */
    @PostMapping("/import")
    @ApiOperation("导入代理配置")
    @Operation(summary = "导入代理配置")
    public ReturnResult<List<MonitorSysGenServerProxy>> importProxyList(@RequestBody List<MonitorSysGenServerProxy> proxyList) {
        return proxyService.importProxyList(proxyList);
    }

    /**
     * 导出代理配置
     */
    @PostMapping("/export")
    @ApiOperation("导出代理配置")
    @Operation(summary = "导出代理配置")
    public ReturnResult<List<MonitorSysGenServerProxy>> exportProxyList(@RequestBody(required = false) List<Integer> proxyIds) {
        return proxyService.exportProxyList(proxyIds);
    }
}
