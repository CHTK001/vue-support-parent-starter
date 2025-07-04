package com.chua.starter.monitor.starter.controller;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.common.support.validator.group.AddGroup;
import com.chua.common.support.validator.group.UpdateGroup;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerAlertSetting;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerAlertSettingService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

/**
 * 服务器告警设置控制器
 *
 * @author CH
 * @since 2024/12/27
 */
@Api(tags = "服务器告警设置管理")
@Tag(name = "服务器告警设置管理", description = "服务器告警设置的增删改查和配置管理")
@Slf4j
@RestController
@RequestMapping("/monitor/server/alert/setting")
@RequiredArgsConstructor
@Validated
public class MonitorSysGenServerAlertSettingController {

    private final MonitorSysGenServerAlertSettingService alertSettingService;

    @ApiOperation("根据服务器ID获取告警设置列表")
    @Operation(summary = "根据服务器ID获取告警设置列表", description = "获取指定服务器的所有告警设置")
    @GetMapping("/list/{serverId}")
    public ReturnResult<List<MonitorSysGenServerAlertSetting>> getByServerId(
            @ApiParam(value = "服务器ID", required = true)
            @Parameter(description = "服务器ID", required = true)
            @PathVariable @NotNull Integer serverId) {
        return alertSettingService.getByServerId(serverId);
    }

    @ApiOperation("获取服务器启用的告警设置列表")
    @Operation(summary = "获取服务器启用的告警设置列表", description = "获取指定服务器已启用的告警设置")
    @GetMapping("/enabled/{serverId}")
    public ReturnResult<List<MonitorSysGenServerAlertSetting>> getEnabledByServerId(
            @ApiParam(value = "服务器ID", required = true)
            @Parameter(description = "服务器ID", required = true)
            @PathVariable @NotNull Integer serverId) {
        return alertSettingService.getEnabledByServerId(serverId);
    }

    @ApiOperation("根据服务器ID和通知类型获取告警设置")
    @Operation(summary = "根据服务器ID和通知类型获取告警设置", description = "获取指定服务器和通知类型的告警设置")
    @GetMapping("/{serverId}/{notificationType}")
    public ReturnResult<MonitorSysGenServerAlertSetting> getByServerIdAndType(
            @ApiParam(value = "服务器ID", required = true)
            @Parameter(description = "服务器ID", required = true)
            @PathVariable @NotNull Integer serverId,
            @ApiParam(value = "通知类型", required = true)
            @Parameter(description = "通知类型", required = true)
            @PathVariable @NotNull String notificationType) {
        return alertSettingService.getByServerIdAndType(serverId, notificationType);
    }

    @ApiOperation("保存告警设置")
    @Operation(summary = "保存告警设置", description = "创建新的告警设置")
    @PostMapping("/save")
    public ReturnResult<MonitorSysGenServerAlertSetting> saveSetting(
            @ApiParam(value = "告警设置信息", required = true)
            @Parameter(description = "告警设置信息", required = true)
            @RequestBody @Validated(AddGroup.class) MonitorSysGenServerAlertSetting setting) {
        return alertSettingService.saveSetting(setting);
    }

    @ApiOperation("更新告警设置")
    @Operation(summary = "更新告警设置", description = "更新现有的告警设置")
    @PutMapping("/update")
    public ReturnResult<MonitorSysGenServerAlertSetting> updateSetting(
            @ApiParam(value = "告警设置信息", required = true)
            @Parameter(description = "告警设置信息", required = true)
            @RequestBody @Validated(UpdateGroup.class) MonitorSysGenServerAlertSetting setting) {
        return alertSettingService.updateSetting(setting);
    }

    @ApiOperation("删除告警设置")
    @Operation(summary = "删除告警设置", description = "删除指定的告警设置")
    @DeleteMapping("/delete/{settingId}")
    public ReturnResult<Boolean> deleteSetting(
            @ApiParam(value = "告警设置ID", required = true)
            @Parameter(description = "告警设置ID", required = true)
            @PathVariable @NotNull Long settingId) {
        return alertSettingService.deleteSetting(settingId);
    }

    @ApiOperation("启用/禁用告警设置")
    @Operation(summary = "启用/禁用告警设置", description = "切换告警设置的启用状态")
    @PutMapping("/toggle/{settingId}")
    public ReturnResult<Boolean> toggleEnabled(
            @ApiParam(value = "告警设置ID", required = true)
            @Parameter(description = "告警设置ID", required = true)
            @PathVariable @NotNull Long settingId,
            @ApiParam(value = "是否启用", required = true)
            @Parameter(description = "是否启用", required = true)
            @RequestParam @NotNull Boolean enabled) {
        return alertSettingService.toggleEnabled(settingId, enabled);
    }

    @ApiOperation("测试告警设置")
    @Operation(summary = "测试告警设置", description = "测试指定告警设置的配置是否正确")
    @PostMapping("/test/{settingId}")
    public ReturnResult<Boolean> testSetting(
            @ApiParam(value = "告警设置ID", required = true)
            @Parameter(description = "告警设置ID", required = true)
            @PathVariable @NotNull Long settingId) {
        return alertSettingService.testSetting(settingId);
    }

    @ApiOperation("批量测试告警设置")
    @Operation(summary = "批量测试告警设置", description = "测试指定服务器的所有启用的告警设置")
    @PostMapping("/test/batch/{serverId}")
    public ReturnResult<List<String>> batchTestSettings(
            @ApiParam(value = "服务器ID", required = true)
            @Parameter(description = "服务器ID", required = true)
            @PathVariable @NotNull Integer serverId) {
        return alertSettingService.batchTestSettings(serverId);
    }

    @ApiOperation("复制告警设置到其他服务器")
    @Operation(summary = "复制告警设置到其他服务器", description = "将源服务器的告警设置复制到目标服务器")
    @PostMapping("/copy/{sourceServerId}")
    public ReturnResult<Boolean> copySettingsToServers(
            @ApiParam(value = "源服务器ID", required = true)
            @Parameter(description = "源服务器ID", required = true)
            @PathVariable @NotNull Integer sourceServerId,
            @ApiParam(value = "目标服务器ID列表", required = true)
            @Parameter(description = "目标服务器ID列表", required = true)
            @RequestBody @Valid List<Integer> targetServerIds) {
        return alertSettingService.copySettingsToServers(sourceServerId, targetServerIds);
    }

    @ApiOperation("初始化默认告警设置")
    @Operation(summary = "初始化默认告警设置", description = "为指定服务器创建默认的告警设置")
    @PostMapping("/init/{serverId}")
    public ReturnResult<Boolean> initDefaultSettings(
            @ApiParam(value = "服务器ID", required = true)
            @Parameter(description = "服务器ID", required = true)
            @PathVariable @NotNull Integer serverId) {
        return alertSettingService.initDefaultSettings(serverId);
    }

    @ApiOperation("验证告警设置配置")
    @Operation(summary = "验证告警设置配置", description = "验证告警设置的配置参数是否正确")
    @PostMapping("/validate")
    public ReturnResult<Boolean> validateSetting(
            @ApiParam(value = "告警设置信息", required = true)
            @Parameter(description = "告警设置信息", required = true)
            @RequestBody @Valid MonitorSysGenServerAlertSetting setting) {
        return alertSettingService.validateSetting(setting);
    }

    @ApiOperation("获取支持的通知类型列表")
    @Operation(summary = "获取支持的通知类型列表", description = "获取系统支持的所有通知类型")
    @GetMapping("/notification-types")
    public ReturnResult<List<String>> getSupportedNotificationTypes() {
        return alertSettingService.getSupportedNotificationTypes();
    }

    @ApiOperation("获取通知类型的配置说明")
    @Operation(summary = "获取通知类型的配置说明", description = "获取指定通知类型的配置参数说明")
    @GetMapping("/notification-types/{notificationType}/description")
    public ReturnResult<String> getNotificationTypeDescription(
            @ApiParam(value = "通知类型", required = true)
            @Parameter(description = "通知类型", required = true)
            @PathVariable @NotNull String notificationType) {
        return alertSettingService.getNotificationTypeDescription(notificationType);
    }

    @ApiOperation("获取告警设置统计信息")
    @Operation(summary = "获取告警设置统计信息", description = "获取指定服务器的告警设置统计信息")
    @GetMapping("/statistics/{serverId}")
    public ReturnResult<Map<String, Object>> getSettingsStatistics(
            @ApiParam(value = "服务器ID", required = true)
            @Parameter(description = "服务器ID", required = true)
            @PathVariable @NotNull Integer serverId) {
        return alertSettingService.getSettingsStatistics(serverId);
    }

    @ApiOperation("获取告警设置详情")
    @Operation(summary = "获取告警设置详情", description = "根据ID获取告警设置的详细信息")
    @GetMapping("/detail/{settingId}")
    public ReturnResult<MonitorSysGenServerAlertSetting> getSettingDetail(
            @ApiParam(value = "告警设置ID", required = true)
            @Parameter(description = "告警设置ID", required = true)
            @PathVariable @NotNull Long settingId) {
        try {
            MonitorSysGenServerAlertSetting setting = alertSettingService.getById(settingId);
            if (setting == null) {
                return ReturnResult.error("告警设置不存在");
            }
            return ReturnResult.success(setting);
        } catch (Exception e) {
            log.error("获取告警设置详情失败: settingId={}", settingId, e);
            return ReturnResult.error("获取详情失败: " + e.getMessage());
        }
    }

    @ApiOperation("批量删除告警设置")
    @Operation(summary = "批量删除告警设置", description = "批量删除指定的告警设置")
    @DeleteMapping("/batch-delete")
    public ReturnResult<Boolean> batchDeleteSettings(
            @ApiParam(value = "告警设置ID列表", required = true)
            @Parameter(description = "告警设置ID列表", required = true)
            @RequestBody @Valid List<Long> settingIds) {
        try {
            if (settingIds == null || settingIds.isEmpty()) {
                return ReturnResult.error("告警设置ID列表不能为空");
            }

            boolean result = alertSettingService.removeByIds(settingIds);
            if (result) {
                log.info("批量删除告警设置成功: settingIds={}", settingIds);
                return ReturnResult.ok(true, "批量删除成功");
            } else {
                return ReturnResult.error("批量删除失败");
            }

        } catch (Exception e) {
            log.error("批量删除告警设置失败: settingIds={}", settingIds, e);
            return ReturnResult.error("批量删除失败: " + e.getMessage());
        }
    }

    @ApiOperation("批量启用/禁用告警设置")
    @Operation(summary = "批量启用/禁用告警设置", description = "批量切换告警设置的启用状态")
    @PutMapping("/batch-toggle")
    public ReturnResult<Boolean> batchToggleEnabled(
            @ApiParam(value = "告警设置ID列表", required = true)
            @Parameter(description = "告警设置ID列表", required = true)
            @RequestParam @Valid List<Long> settingIds,
            @ApiParam(value = "是否启用", required = true)
            @Parameter(description = "是否启用", required = true)
            @RequestParam @NotNull Boolean enabled) {
        try {
            if (settingIds == null || settingIds.isEmpty()) {
                return ReturnResult.error("告警设置ID列表不能为空");
            }

            int successCount = 0;
            for (Long settingId : settingIds) {
                ReturnResult<Boolean> result = alertSettingService.toggleEnabled(settingId, enabled);
                if (result.isOk()) {
                    successCount++;
                }
            }

            log.info("批量切换告警设置状态完成: settingIds={}, enabled={}, successCount={}", 
                    settingIds, enabled, successCount);
            return ReturnResult.ok(true, String.format("批量操作完成，成功 %d 个，失败 %d 个", 
                    successCount, settingIds.size() - successCount));

        } catch (Exception e) {
            log.error("批量切换告警设置状态失败: settingIds={}, enabled={}", settingIds, enabled, e);
            return ReturnResult.error("批量操作失败: " + e.getMessage());
        }
    }
}
