package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenFileSystemSetting;
import com.chua.starter.monitor.starter.service.MonitorSysGenFileSystemSettingService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 文件系统配置管理控制器
 *
 * @author CH
 * @since 2025/01/11
 */
@Slf4j
@RestController
@RequestMapping("/v1/filesystem/setting")
@RequiredArgsConstructor
@Api(tags = "文件系统配置管理")
@Tag(name = "文件系统配置管理", description = "文件系统配置的增删改查操作")
public class MonitorSysGenFileSystemSettingController {

    private final MonitorSysGenFileSystemSettingService settingService;

    /**
     * 获取所有启用的配置
     */
    @GetMapping("/enabled")
    @ApiOperation(value = "获取所有启用的配置")
    @Operation(summary = "获取所有启用的配置", description = "获取所有启用状态的配置项")
    public ReturnResult<List<MonitorSysGenFileSystemSetting>> getAllEnabledSettings() {
        return settingService.getAllEnabledSettings();
    }

    /**
     * 根据配置键获取配置值
     */
    @GetMapping("/value/{key}")
    @ApiOperation(value = "根据配置键获取配置值")
    @Operation(summary = "根据配置键获取配置值", description = "根据配置键获取对应的配置值")
    public ReturnResult<String> getSettingValue(
            @Parameter(description = "配置键") @PathVariable String key) {
        return settingService.getSettingValue(key);
    }

    /**
     * 设置配置值
     */
    @PutMapping("/value/{key}")
    @ApiOperation(value = "设置配置值")
    @Operation(summary = "设置配置值", description = "设置指定配置键的配置值")
    public ReturnResult<Boolean> setSettingValue(
            @Parameter(description = "配置键") @PathVariable String key,
            @Parameter(description = "配置值") @RequestParam String value) {
        return settingService.setSettingValue(key, value);
    }

    /**
     * 根据分组获取配置列表
     */
    @GetMapping("/group/{group}")
    @ApiOperation(value = "根据分组获取配置列表")
    @Operation(summary = "根据分组获取配置列表", description = "根据配置分组获取配置列表")
    public ReturnResult<List<MonitorSysGenFileSystemSetting>> getSettingsByGroup(
            @Parameter(description = "配置分组") @PathVariable String group) {
        return settingService.getSettingsByGroup(group);
    }

    /**
     * 批量设置配置
     */
    @PutMapping("/batch")
    @ApiOperation(value = "批量设置配置")
    @Operation(summary = "批量设置配置", description = "批量更新配置项")
    public ReturnResult<Boolean> batchSetSettings(
            @Parameter(description = "配置列表") @RequestBody List<MonitorSysGenFileSystemSetting> settings) {
        return settingService.batchSetSettings(settings);
    }

    /**
     * 重置配置为默认值
     */
    @PostMapping("/reset/{key}")
    @ApiOperation(value = "重置配置为默认值")
    @Operation(summary = "重置配置为默认值", description = "将指定配置重置为默认值")
    public ReturnResult<Boolean> resetToDefault(
            @Parameter(description = "配置键") @PathVariable String key) {
        return settingService.resetToDefault(key);
    }

    /**
     * 批量重置配置为默认值
     */
    @PostMapping("/reset/batch")
    @ApiOperation(value = "批量重置配置为默认值")
    @Operation(summary = "批量重置配置为默认值", description = "批量将配置重置为默认值")
    public ReturnResult<Boolean> batchResetToDefault(
            @Parameter(description = "配置键列表") @RequestBody List<String> keys) {
        return settingService.batchResetToDefault(keys);
    }

    /**
     * 获取配置分组列表
     */
    @GetMapping("/groups")
    @ApiOperation(value = "获取配置分组列表")
    @Operation(summary = "获取配置分组列表", description = "获取所有配置分组")
    public ReturnResult<List<String>> getSettingGroups() {
        return settingService.getSettingGroups();
    }

    /**
     * 获取配置统计信息
     */
    @GetMapping("/statistics")
    @ApiOperation(value = "获取配置统计信息")
    @Operation(summary = "获取配置统计信息", description = "获取配置系统的统计信息")
    public ReturnResult<java.util.Map<String, Object>> getSettingStatistics() {
        return settingService.getSettingStatistics();
    }

    /**
     * 初始化默认配置
     */
    @PostMapping("/init")
    @ApiOperation(value = "初始化默认配置")
    @Operation(summary = "初始化默认配置", description = "初始化系统默认配置项")
    public ReturnResult<Boolean> initDefaultSettings() {
        return settingService.initDefaultSettings();
    }

    /**
     * 验证配置值
     */
    @PostMapping("/validate")
    @ApiOperation(value = "验证配置值")
    @Operation(summary = "验证配置值", description = "验证配置值是否符合规则")
    public ReturnResult<Boolean> validateSettingValue(
            @Parameter(description = "配置键") @RequestParam String key,
            @Parameter(description = "配置值") @RequestParam String value) {
        return settingService.validateSettingValue(key, value);
    }

    /**
     * 刷新配置缓存
     */
    @PostMapping("/refresh")
    @ApiOperation(value = "刷新配置缓存")
    @Operation(summary = "刷新配置缓存", description = "刷新配置缓存，重新加载配置")
    public ReturnResult<Boolean> refreshCache() {
        return settingService.refreshCache();
    }

    /**
     * 获取合并任务数量配置
     */
    @GetMapping("/merge-task-count")
    @ApiOperation(value = "获取合并任务数量配置")
    @Operation(summary = "获取合并任务数量配置", description = "获取当前配置的合并任务数量")
    public ReturnResult<Integer> getMergeTaskCount() {
        try {
            Integer count = settingService.getMergeTaskCount();
            return ReturnResult.ok(count);
        } catch (Exception e) {
            log.error("获取合并任务数量配置失败", e);
            return ReturnResult.error("获取合并任务数量配置失败: " + e.getMessage());
        }
    }

    /**
     * 检查是否开启手动合并
     */
    @GetMapping("/manual-merge-enabled")
    @ApiOperation(value = "检查是否开启手动合并")
    @Operation(summary = "检查是否开启手动合并", description = "检查是否开启手动合并功能")
    public ReturnResult<Boolean> isManualMergeEnabled() {
        try {
            Boolean enabled = settingService.isManualMergeEnabled();
            return ReturnResult.ok(enabled);
        } catch (Exception e) {
            log.error("检查手动合并配置失败", e);
            return ReturnResult.error("检查手动合并配置失败: " + e.getMessage());
        }
    }

    /**
     * 检查是否开启分片上传
     */
    @GetMapping("/chunk-upload-enabled")
    @ApiOperation(value = "检查是否开启分片上传")
    @Operation(summary = "检查是否开启分片上传", description = "检查是否开启分片上传功能")
    public ReturnResult<Boolean> isChunkUploadEnabled() {
        try {
            Boolean enabled = settingService.isChunkUploadEnabled();
            return ReturnResult.ok(enabled);
        } catch (Exception e) {
            log.error("检查分片上传配置失败", e);
            return ReturnResult.error("检查分片上传配置失败: " + e.getMessage());
        }
    }

    /**
     * 获取文件类型白名单
     */
    @GetMapping("/file-type-whitelist")
    @ApiOperation(value = "获取文件类型白名单")
    @Operation(summary = "获取文件类型白名单", description = "获取允许上传的文件类型白名单")
    public ReturnResult<List<String>> getFileTypeWhitelist() {
        try {
            List<String> whitelist = settingService.getFileTypeWhitelist();
            return ReturnResult.ok(whitelist);
        } catch (Exception e) {
            log.error("获取文件类型白名单失败", e);
            return ReturnResult.error("获取文件类型白名单失败: " + e.getMessage());
        }
    }

    /**
     * 检查是否开启文件下载
     */
    @GetMapping("/file-download-enabled")
    @ApiOperation(value = "检查是否开启文件下载")
    @Operation(summary = "检查是否开启文件下载", description = "检查是否开启文件下载功能")
    public ReturnResult<Boolean> isFileDownloadEnabled() {
        try {
            Boolean enabled = settingService.isFileDownloadEnabled();
            return ReturnResult.ok(enabled);
        } catch (Exception e) {
            log.error("检查文件下载配置失败", e);
            return ReturnResult.error("检查文件下载配置失败: " + e.getMessage());
        }
    }

    /**
     * 检查是否开启HTTP访问
     */
    @GetMapping("/http-access-enabled")
    @ApiOperation(value = "检查是否开启HTTP访问")
    @Operation(summary = "检查是否开启HTTP访问", description = "检查是否开启文件HTTP访问功能")
    public ReturnResult<Boolean> isHttpAccessEnabled() {
        try {
            Boolean enabled = settingService.isHttpAccessEnabled();
            return ReturnResult.ok(enabled);
        } catch (Exception e) {
            log.error("检查HTTP访问配置失败", e);
            return ReturnResult.error("检查HTTP访问配置失败: " + e.getMessage());
        }
    }
}
