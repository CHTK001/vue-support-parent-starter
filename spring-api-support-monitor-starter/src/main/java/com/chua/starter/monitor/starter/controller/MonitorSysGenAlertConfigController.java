package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenAlertConfig;
import com.chua.starter.monitor.starter.service.MonitorSysGenAlertConfigService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 告警配置控制器
 *
 * @author CH
 * @since 2024/12/26
 */
@RestController
@RequestMapping("/v2/alert/config")
@Api(tags = "告警配置管理")
@Tag(name = "告警配置管理", description = "告警配置相关接口")
@Slf4j
@RequiredArgsConstructor
public class MonitorSysGenAlertConfigController {

    private final MonitorSysGenAlertConfigService alertConfigService;

    /**
     * 获取默认告警配置
     *
     * @return 默认告警配置
     */
    @GetMapping("/default")
    @Operation(summary = "获取默认告警配置")
    @ApiOperation("获取默认告警配置")
    public ReturnResult<MonitorSysGenAlertConfig> getDefaultConfig() {
        return alertConfigService.getDefaultConfig();
    }

    /**
     * 获取启用的告警配置列表
     *
     * @return 启用的告警配置列表
     */
    @GetMapping("/enabled")
    @Operation(summary = "获取启用的告警配置列表")
    @ApiOperation("获取启用的告警配置列表")
    public ReturnResult<List<MonitorSysGenAlertConfig>> getEnabledConfigs() {
        return alertConfigService.getEnabledConfigs();
    }

    /**
     * 根据名称获取配置
     *
     * @param name 配置名称
     * @return 告警配置
     */
    @GetMapping("/name/{name}")
    @Operation(summary = "根据名称获取配置")
    @ApiOperation("根据名称获取配置")
    public ReturnResult<MonitorSysGenAlertConfig> getConfigByName(
            @PathVariable("name") @Parameter(description = "配置名称") @ApiParam("配置名称") String name) {
        return alertConfigService.getConfigByName(name);
    }

    /**
     * 根据ID获取配置
     *
     * @param configId 配置ID
     * @return 告警配置
     */
    @GetMapping("/{configId}")
    @Operation(summary = "根据ID获取配置")
    @ApiOperation("根据ID获取配置")
    public ReturnResult<MonitorSysGenAlertConfig> getConfigById(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId) {
        try {
            MonitorSysGenAlertConfig config = alertConfigService.getById(configId);
            return ReturnResult.success(config);
        } catch (Exception e) {
            log.error("获取告警配置失败: configId={}", configId, e);
            return ReturnResult.error("获取配置失败: " + e.getMessage());
        }
    }

    /**
     * 保存告警配置
     *
     * @param config 告警配置
     * @return 保存结果
     */
    @PostMapping
    @Operation(summary = "保存告警配置")
    @ApiOperation("保存告警配置")
    public ReturnResult<Boolean> saveConfig(@RequestBody MonitorSysGenAlertConfig config) {
        return alertConfigService.saveConfig(config);
    }

    /**
     * 更新告警配置
     *
     * @param config 告警配置
     * @return 更新结果
     */
    @PutMapping
    @Operation(summary = "更新告警配置")
    @ApiOperation("更新告警配置")
    public ReturnResult<Boolean> updateConfig(@RequestBody MonitorSysGenAlertConfig config) {
        return alertConfigService.updateConfig(config);
    }

    /**
     * 删除告警配置
     *
     * @param configId 配置ID
     * @return 删除结果
     */
    @DeleteMapping("/{configId}")
    @Operation(summary = "删除告警配置")
    @ApiOperation("删除告警配置")
    public ReturnResult<Boolean> deleteConfig(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId) {
        return alertConfigService.deleteConfig(configId);
    }

    /**
     * 设置默认配置
     *
     * @param configId 配置ID
     * @return 设置结果
     */
    @PostMapping("/{configId}/default")
    @Operation(summary = "设置默认配置")
    @ApiOperation("设置默认配置")
    public ReturnResult<Boolean> setDefaultConfig(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId) {
        return alertConfigService.setDefaultConfig(configId);
    }

    /**
     * 启用/禁用配置
     *
     * @param configId 配置ID
     * @param enabled  是否启用
     * @return 操作结果
     */
    @PostMapping("/{configId}/toggle")
    @Operation(summary = "启用/禁用配置")
    @ApiOperation("启用/禁用配置")
    public ReturnResult<Boolean> toggleConfig(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId,
            @RequestParam("enabled") @Parameter(description = "是否启用") @ApiParam("是否启用") boolean enabled) {
        return alertConfigService.toggleConfig(configId, enabled);
    }

    /**
     * 复制配置
     *
     * @param configId 源配置ID
     * @param newName  新配置名称
     * @return 复制结果
     */
    @PostMapping("/{configId}/copy")
    @Operation(summary = "复制配置")
    @ApiOperation("复制配置")
    public ReturnResult<MonitorSysGenAlertConfig> copyConfig(
            @PathVariable("configId") @Parameter(description = "源配置ID") @ApiParam("源配置ID") Integer configId,
            @RequestParam("newName") @Parameter(description = "新配置名称") @ApiParam("新配置名称") String newName) {
        return alertConfigService.copyConfig(configId, newName);
    }

    /**
     * 验证配置
     *
     * @param config 告警配置
     * @return 验证结果
     */
    @PostMapping("/validate")
    @Operation(summary = "验证配置")
    @ApiOperation("验证配置")
    public ReturnResult<Boolean> validateConfig(@RequestBody MonitorSysGenAlertConfig config) {
        return alertConfigService.validateConfig(config);
    }

    /**
     * 获取配置统计信息
     *
     * @return 统计信息
     */
    @GetMapping("/statistics")
    @Operation(summary = "获取配置统计信息")
    @ApiOperation("获取配置统计信息")
    public ReturnResult<Map<String, Object>> getConfigStatistics() {
        return alertConfigService.getConfigStatistics();
    }

    /**
     * 导入配置
     *
     * @param configs 配置列表
     * @return 导入结果
     */
    @PostMapping("/import")
    @Operation(summary = "导入配置")
    @ApiOperation("导入配置")
    public ReturnResult<Map<String, Object>> importConfigs(@RequestBody List<MonitorSysGenAlertConfig> configs) {
        return alertConfigService.importConfigs(configs);
    }

    /**
     * 导出配置
     *
     * @param configIds 配置ID列表，为空则导出所有启用的配置
     * @return 导出结果
     */
    @PostMapping("/export")
    @Operation(summary = "导出配置")
    @ApiOperation("导出配置")
    public ReturnResult<List<MonitorSysGenAlertConfig>> exportConfigs(
            @RequestBody(required = false) List<Integer> configIds) {
        return alertConfigService.exportConfigs(configIds);
    }

    /**
     * 重置为默认配置
     *
     * @return 重置结果
     */
    @PostMapping("/reset")
    @Operation(summary = "重置为默认配置")
    @ApiOperation("重置为默认配置")
    public ReturnResult<Boolean> resetToDefault() {
        return alertConfigService.resetToDefault();
    }

    /**
     * 获取推荐配置
     *
     * @param serverType 服务器类型
     * @return 推荐配置
     */
    @GetMapping("/recommended")
    @Operation(summary = "获取推荐配置")
    @ApiOperation("获取推荐配置")
    public ReturnResult<MonitorSysGenAlertConfig> getRecommendedConfig(
            @RequestParam(value = "serverType", defaultValue = "WEB") 
            @Parameter(description = "服务器类型") @ApiParam("服务器类型") String serverType) {
        return alertConfigService.getRecommendedConfig(serverType);
    }

    /**
     * 测试告警配置
     *
     * @param configId 配置ID
     * @return 测试结果
     */
    @PostMapping("/{configId}/test")
    @Operation(summary = "测试告警配置")
    @ApiOperation("测试告警配置")
    public ReturnResult<Boolean> testConfig(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId) {
        return alertConfigService.testConfig(configId);
    }

    /**
     * 获取配置变更历史
     *
     * @param configId 配置ID
     * @param limit    限制数量
     * @return 变更历史
     */
    @GetMapping("/{configId}/history")
    @Operation(summary = "获取配置变更历史")
    @ApiOperation("获取配置变更历史")
    public ReturnResult<List<Map<String, Object>>> getConfigHistory(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId,
            @RequestParam(value = "limit", defaultValue = "10") 
            @Parameter(description = "限制数量") @ApiParam("限制数量") Integer limit) {
        return alertConfigService.getConfigHistory(configId, limit);
    }

    /**
     * 应用配置到服务器
     *
     * @param configId  配置ID
     * @param serverIds 服务器ID列表
     * @return 应用结果
     */
    @PostMapping("/{configId}/apply")
    @Operation(summary = "应用配置到服务器")
    @ApiOperation("应用配置到服务器")
    public ReturnResult<Boolean> applyConfigToServers(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId,
            @RequestBody List<Integer> serverIds) {
        return alertConfigService.applyConfigToServers(configId, serverIds);
    }

    /**
     * 获取使用指定配置的服务器列表
     *
     * @param configId 配置ID
     * @return 服务器列表
     */
    @GetMapping("/{configId}/servers")
    @Operation(summary = "获取使用指定配置的服务器列表")
    @ApiOperation("获取使用指定配置的服务器列表")
    public ReturnResult<List<Map<String, Object>>> getServersUsingConfig(
            @PathVariable("configId") @Parameter(description = "配置ID") @ApiParam("配置ID") Integer configId) {
        return alertConfigService.getServersUsingConfig(configId);
    }

    /**
     * 初始化默认配置
     *
     * @return 初始化结果
     */
    @PostMapping("/initialize")
    @Operation(summary = "初始化默认配置")
    @ApiOperation("初始化默认配置")
    public ReturnResult<Boolean> initializeDefaultConfig() {
        return alertConfigService.initializeDefaultConfig();
    }
}
