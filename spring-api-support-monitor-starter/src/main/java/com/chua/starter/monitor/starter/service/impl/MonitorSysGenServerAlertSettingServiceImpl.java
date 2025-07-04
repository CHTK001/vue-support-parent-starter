package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.common.support.utils.StringUtils;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerAlertSetting;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenServerAlertSettingMapper;
import com.chua.starter.monitor.starter.service.AlertNotificationService;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerAlertSettingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 服务器告警设置服务实现类
 *
 * @author CH
 * @since 2024/12/27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSysGenServerAlertSettingServiceImpl 
        extends ServiceImpl<MonitorSysGenServerAlertSettingMapper, MonitorSysGenServerAlertSetting>
        implements MonitorSysGenServerAlertSettingService {

    private final List<AlertNotificationService> notificationServices;

    @Override
    public ReturnResult<List<MonitorSysGenServerAlertSetting>> getByServerId(Integer serverId) {
        try {
            if (serverId == null) {
                return ReturnResult.error("服务器ID不能为空");
            }

            List<MonitorSysGenServerAlertSetting> settings = list(
                    new LambdaQueryWrapper<MonitorSysGenServerAlertSetting>()
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerId, serverId)
                            .orderByAsc(MonitorSysGenServerAlertSetting::getMonitorSysGenServerAlertSettingPriority)
                            .orderByDesc(MonitorSysGenServerAlertSetting::getCreateTime)
            );

            return ReturnResult.success(settings);

        } catch (Exception e) {
            log.error("获取服务器告警设置失败: serverId={}", serverId, e);
            return ReturnResult.error("获取告警设置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<MonitorSysGenServerAlertSetting> getByServerIdAndType(Integer serverId, String notificationType) {
        try {
            if (serverId == null || StringUtils.isBlank(notificationType)) {
                return ReturnResult.error("服务器ID和通知类型不能为空");
            }

            MonitorSysGenServerAlertSetting setting = getOne(
                    new LambdaQueryWrapper<MonitorSysGenServerAlertSetting>()
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerId, serverId)
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerAlertSettingNotificationType, notificationType)
                            .last("LIMIT 1")
            );

            return ReturnResult.success(setting);

        } catch (Exception e) {
            log.error("获取服务器告警设置失败: serverId={}, type={}", serverId, notificationType, e);
            return ReturnResult.error("获取告警设置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenServerAlertSetting>> getEnabledByServerId(Integer serverId) {
        try {
            if (serverId == null) {
                return ReturnResult.error("服务器ID不能为空");
            }

            List<MonitorSysGenServerAlertSetting> settings = list(
                    new LambdaQueryWrapper<MonitorSysGenServerAlertSetting>()
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerId, serverId)
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerAlertSettingEnabled, 1)
                            .orderByAsc(MonitorSysGenServerAlertSetting::getMonitorSysGenServerAlertSettingPriority)
            );

            return ReturnResult.success(settings);

        } catch (Exception e) {
            log.error("获取启用的告警设置失败: serverId={}", serverId, e);
            return ReturnResult.error("获取启用的告警设置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerAlertSetting> saveSetting(MonitorSysGenServerAlertSetting setting) {
        try {
            // 验证配置
            ReturnResult<Boolean> validateResult = validateSetting(setting);
            if (!validateResult.isOk()) {
                return ReturnResult.error(validateResult.getMsg());
            }

            // 检查是否已存在相同类型的配置
            MonitorSysGenServerAlertSetting existingSetting = getOne(
                    new LambdaQueryWrapper<MonitorSysGenServerAlertSetting>()
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerId, setting.getMonitorSysGenServerId())
                            .eq(MonitorSysGenServerAlertSetting::getMonitorSysGenServerAlertSettingNotificationType, 
                                setting.getMonitorSysGenServerAlertSettingNotificationType())
            );

            if (existingSetting != null) {
                return ReturnResult.error("该服务器已存在相同类型的告警设置");
            }

            // 设置默认值
            if (setting.getMonitorSysGenServerAlertSettingEnabled() == null) {
                setting.setMonitorSysGenServerAlertSettingEnabled(1);
            }
            if (setting.getMonitorSysGenServerAlertSettingPriority() == null) {
                setting.setMonitorSysGenServerAlertSettingPriority(getNextPriority(setting.getMonitorSysGenServerId()));
            }
            if (setting.getMonitorSysGenServerAlertSettingRetryCount() == null) {
                setting.setMonitorSysGenServerAlertSettingRetryCount(3);
            }
            if (setting.getMonitorSysGenServerAlertSettingRetryInterval() == null) {
                setting.setMonitorSysGenServerAlertSettingRetryInterval(30);
            }
            if (setting.getMonitorSysGenServerAlertSettingTimeout() == null) {
                setting.setMonitorSysGenServerAlertSettingTimeout(30);
            }

            boolean saved = save(setting);
            if (saved) {
                log.info("保存告警设置成功: serverId={}, type={}", 
                        setting.getMonitorSysGenServerId(), 
                        setting.getMonitorSysGenServerAlertSettingNotificationType());
                return ReturnResult.success(setting);
            } else {
                return ReturnResult.error("保存告警设置失败");
            }

        } catch (Exception e) {
            log.error("保存告警设置失败", e);
            return ReturnResult.error("保存告警设置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<MonitorSysGenServerAlertSetting> updateSetting(MonitorSysGenServerAlertSetting setting) {
        try {
            if (setting.getMonitorSysGenServerAlertSettingId() == null) {
                return ReturnResult.error("告警设置ID不能为空");
            }

            // 验证配置
            ReturnResult<Boolean> validateResult = validateSetting(setting);
            if (!validateResult.isOk()) {
                return ReturnResult.error(validateResult.getMsg());
            }

            boolean updated = updateById(setting);
            if (updated) {
                log.info("更新告警设置成功: settingId={}", setting.getMonitorSysGenServerAlertSettingId());
                return ReturnResult.success(setting);
            } else {
                return ReturnResult.error("更新告警设置失败");
            }

        } catch (Exception e) {
            log.error("更新告警设置失败", e);
            return ReturnResult.error("更新告警设置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> deleteSetting(Long settingId) {
        try {
            if (settingId == null) {
                return ReturnResult.error("告警设置ID不能为空");
            }

            boolean deleted = removeById(settingId);
            if (deleted) {
                log.info("删除告警设置成功: settingId={}", settingId);
                return ReturnResult.ok(true, "删除成功");
            } else {
                return ReturnResult.error("删除告警设置失败");
            }

        } catch (Exception e) {
            log.error("删除告警设置失败: settingId={}", settingId, e);
            return ReturnResult.error("删除告警设置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> toggleEnabled(Long settingId, Boolean enabled) {
        try {
            if (settingId == null || enabled == null) {
                return ReturnResult.error("参数不能为空");
            }

            MonitorSysGenServerAlertSetting setting = getById(settingId);
            if (setting == null) {
                return ReturnResult.error("告警设置不存在");
            }

            setting.setMonitorSysGenServerAlertSettingEnabled(enabled ? 1 : 0);
            boolean updated = updateById(setting);

            if (updated) {
                log.info("切换告警设置状态成功: settingId={}, enabled={}", settingId, enabled);
                return ReturnResult.ok(true, enabled ? "启用成功" : "禁用成功");
            } else {
                return ReturnResult.error("切换状态失败");
            }

        } catch (Exception e) {
            log.error("切换告警设置状态失败: settingId={}, enabled={}", settingId, enabled, e);
            return ReturnResult.error("切换状态失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> testSetting(Long settingId) {
        try {
            if (settingId == null) {
                return ReturnResult.error("告警设置ID不能为空");
            }

            MonitorSysGenServerAlertSetting setting = getById(settingId);
            if (setting == null) {
                return ReturnResult.error("告警设置不存在");
            }

            // 查找对应的通知服务
            AlertNotificationService notificationService = findNotificationService(
                    setting.getMonitorSysGenServerAlertSettingNotificationType());
            if (notificationService == null) {
                return ReturnResult.error("不支持的通知类型: " + setting.getMonitorSysGenServerAlertSettingNotificationType());
            }

            // 执行测试
            ReturnResult<Boolean> testResult = notificationService.testNotification(setting);

            // 更新测试结果
            updateTestResult(settingId, testResult.isOk(), testResult.isOk() ? null : testResult.getMsg());

            return testResult;

        } catch (Exception e) {
            log.error("测试告警设置失败: settingId={}", settingId, e);
            // 更新测试结果为失败
            updateTestResult(settingId, false, e.getMessage());
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<String>> batchTestSettings(Integer serverId) {
        try {
            if (serverId == null) {
                return ReturnResult.error("服务器ID不能为空");
            }

            ReturnResult<List<MonitorSysGenServerAlertSetting>> settingsResult = getEnabledByServerId(serverId);
            if (!settingsResult.isOk() || settingsResult.getData() == null) {
                return ReturnResult.error("获取告警设置失败");
            }

            List<String> results = new ArrayList<>();
            for (MonitorSysGenServerAlertSetting setting : settingsResult.getData()) {
                ReturnResult<Boolean> testResult = testSetting(setting.getMonitorSysGenServerAlertSettingId());
                String result = setting.getMonitorSysGenServerAlertSettingNotificationType() + ": " + 
                        (testResult.isOk() ? "成功" : "失败 - " + testResult.getMsg());
                results.add(result);
            }

            return ReturnResult.success(results);

        } catch (Exception e) {
            log.error("批量测试告警设置失败: serverId={}", serverId, e);
            return ReturnResult.error("批量测试失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> copySettingsToServers(Integer sourceServerId, List<Integer> targetServerIds) {
        try {
            if (sourceServerId == null || targetServerIds == null || targetServerIds.isEmpty()) {
                return ReturnResult.error("参数不能为空");
            }

            // 获取源服务器的告警设置
            ReturnResult<List<MonitorSysGenServerAlertSetting>> sourceSettingsResult = getByServerId(sourceServerId);
            if (!sourceSettingsResult.isOk() || sourceSettingsResult.getData() == null || sourceSettingsResult.getData().isEmpty()) {
                return ReturnResult.error("源服务器没有告警设置");
            }

            int copiedCount = 0;
            for (Integer targetServerId : targetServerIds) {
                for (MonitorSysGenServerAlertSetting sourceSetting : sourceSettingsResult.getData()) {
                    // 检查目标服务器是否已存在相同类型的设置
                    ReturnResult<MonitorSysGenServerAlertSetting> existingResult = 
                            getByServerIdAndType(targetServerId, sourceSetting.getMonitorSysGenServerAlertSettingNotificationType());
                    
                    if (existingResult.getData() != null) {
                        continue; // 跳过已存在的设置
                    }

                    // 复制设置
                    MonitorSysGenServerAlertSetting newSetting = new MonitorSysGenServerAlertSetting();
                    newSetting.setMonitorSysGenServerId(targetServerId);
                    newSetting.setMonitorSysGenServerAlertSettingNotificationType(sourceSetting.getMonitorSysGenServerAlertSettingNotificationType());
                    newSetting.setMonitorSysGenServerAlertSettingName(sourceSetting.getMonitorSysGenServerAlertSettingName());
                    newSetting.setMonitorSysGenServerAlertSettingEnabled(sourceSetting.getMonitorSysGenServerAlertSettingEnabled());
                    newSetting.setMonitorSysGenServerAlertSettingAddress(sourceSetting.getMonitorSysGenServerAlertSettingAddress());
                    newSetting.setMonitorSysGenServerAlertSettingConfig(sourceSetting.getMonitorSysGenServerAlertSettingConfig());
                    newSetting.setMonitorSysGenServerAlertSettingPriority(sourceSetting.getMonitorSysGenServerAlertSettingPriority());
                    newSetting.setMonitorSysGenServerAlertSettingRateLimit(sourceSetting.getMonitorSysGenServerAlertSettingRateLimit());
                    newSetting.setMonitorSysGenServerAlertSettingBatchEnabled(sourceSetting.getMonitorSysGenServerAlertSettingBatchEnabled());
                    newSetting.setMonitorSysGenServerAlertSettingRetryCount(sourceSetting.getMonitorSysGenServerAlertSettingRetryCount());
                    newSetting.setMonitorSysGenServerAlertSettingRetryInterval(sourceSetting.getMonitorSysGenServerAlertSettingRetryInterval());
                    newSetting.setMonitorSysGenServerAlertSettingTimeout(sourceSetting.getMonitorSysGenServerAlertSettingTimeout());
                    newSetting.setMonitorSysGenServerAlertSettingRemark(sourceSetting.getMonitorSysGenServerAlertSettingRemark());

                    if (save(newSetting)) {
                        copiedCount++;
                    }
                }
            }

            log.info("复制告警设置完成: sourceServerId={}, targetCount={}, copiedCount={}", 
                    sourceServerId, targetServerIds.size(), copiedCount);
            return ReturnResult.ok(true, "复制完成，共复制 " + copiedCount + " 个设置");

        } catch (Exception e) {
            log.error("复制告警设置失败: sourceServerId={}", sourceServerId, e);
            return ReturnResult.error("复制失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> initDefaultSettings(Integer serverId) {
        try {
            if (serverId == null) {
                return ReturnResult.error("服务器ID不能为空");
            }

            // 检查是否已有设置
            ReturnResult<List<MonitorSysGenServerAlertSetting>> existingResult = getByServerId(serverId);
            if (existingResult.isOk() && existingResult.getData() != null && !existingResult.getData().isEmpty()) {
                return ReturnResult.error("服务器已有告警设置，无需初始化");
            }

            // 创建默认邮件设置
            MonitorSysGenServerAlertSetting emailSetting = MonitorSysGenServerAlertSetting.getDefaultEmailSetting(serverId);
            save(emailSetting);

            // 创建默认短信设置
            MonitorSysGenServerAlertSetting smsSetting = MonitorSysGenServerAlertSetting.getDefaultSmsSetting(serverId);
            save(smsSetting);

            log.info("初始化默认告警设置成功: serverId={}", serverId);
            return ReturnResult.ok(true, "初始化默认设置成功");

        } catch (Exception e) {
            log.error("初始化默认告警设置失败: serverId={}", serverId, e);
            return ReturnResult.error("初始化失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateSetting(MonitorSysGenServerAlertSetting setting) {
        try {
            if (setting == null) {
                return ReturnResult.error("告警设置不能为空");
            }

            if (setting.getMonitorSysGenServerId() == null) {
                return ReturnResult.error("服务器ID不能为空");
            }

            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingNotificationType())) {
                return ReturnResult.error("通知类型不能为空");
            }

            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingName())) {
                return ReturnResult.error("配置名称不能为空");
            }

            // 查找对应的通知服务
            AlertNotificationService notificationService = findNotificationService(
                    setting.getMonitorSysGenServerAlertSettingNotificationType());
            if (notificationService == null) {
                return ReturnResult.error("不支持的通知类型: " + setting.getMonitorSysGenServerAlertSettingNotificationType());
            }

            // 使用通知服务验证配置
            return notificationService.validateConfiguration(setting);

        } catch (Exception e) {
            log.error("验证告警设置失败", e);
            return ReturnResult.error("验证失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<String>> getSupportedNotificationTypes() {
        try {
            List<String> types = notificationServices.stream()
                    .map(AlertNotificationService::getNotificationType)
                    .collect(Collectors.toList());

            return ReturnResult.success(types);

        } catch (Exception e) {
            log.error("获取支持的通知类型失败", e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<String> getNotificationTypeDescription(String notificationType) {
        try {
            if (StringUtils.isBlank(notificationType)) {
                return ReturnResult.error("通知类型不能为空");
            }

            AlertNotificationService notificationService = findNotificationService(notificationType);
            if (notificationService == null) {
                return ReturnResult.error("不支持的通知类型: " + notificationType);
            }

            String description = notificationService.getConfigurationDescription();
            return ReturnResult.success(description);

        } catch (Exception e) {
            log.error("获取通知类型配置说明失败: type={}", notificationType, e);
            return ReturnResult.error("获取失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateTestResult(Long settingId, Boolean success, String errorMessage) {
        try {
            if (settingId == null) {
                return ReturnResult.error("告警设置ID不能为空");
            }

            MonitorSysGenServerAlertSetting setting = getById(settingId);
            if (setting == null) {
                return ReturnResult.error("告警设置不存在");
            }

            setting.setMonitorSysGenServerAlertSettingLastTestTime(LocalDateTime.now());
            setting.setMonitorSysGenServerAlertSettingLastTestResult(success ? 1 : 0);
            setting.setMonitorSysGenServerAlertSettingLastTestError(errorMessage);

            boolean updated = updateById(setting);
            return ReturnResult.ok(updated, updated ? "更新成功" : "更新失败");

        } catch (Exception e) {
            log.error("更新测试结果失败: settingId={}", settingId, e);
            return ReturnResult.error("更新失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getSettingsStatistics(Integer serverId) {
        try {
            if (serverId == null) {
                return ReturnResult.error("服务器ID不能为空");
            }

            ReturnResult<List<MonitorSysGenServerAlertSetting>> settingsResult = getByServerId(serverId);
            if (!settingsResult.isOk()) {
                return ReturnResult.error(settingsResult.getMsg());
            }

            List<MonitorSysGenServerAlertSetting> settings = settingsResult.getData();
            if (settings == null) {
                settings = new ArrayList<>();
            }

            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalCount", settings.size());
            statistics.put("enabledCount", settings.stream().mapToInt(s -> s.isEnabled() ? 1 : 0).sum());
            statistics.put("disabledCount", settings.stream().mapToInt(s -> s.isEnabled() ? 0 : 1).sum());

            // 按类型统计
            Map<String, Long> typeCount = settings.stream()
                    .collect(Collectors.groupingBy(
                            MonitorSysGenServerAlertSetting::getMonitorSysGenServerAlertSettingNotificationType,
                            Collectors.counting()));
            statistics.put("typeCount", typeCount);

            // 测试结果统计
            long successfulTests = settings.stream()
                    .mapToLong(s -> s.isLastTestSuccessful() ? 1 : 0)
                    .sum();
            statistics.put("successfulTests", successfulTests);
            statistics.put("failedTests", settings.size() - successfulTests);

            return ReturnResult.success(statistics);

        } catch (Exception e) {
            log.error("获取告警设置统计信息失败: serverId={}", serverId, e);
            return ReturnResult.error("获取统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 查找通知服务
     */
    private AlertNotificationService findNotificationService(String notificationType) {
        return notificationServices.stream()
                .filter(service -> service.getNotificationType().equals(notificationType))
                .findFirst()
                .orElse(null);
    }

    /**
     * 获取下一个优先级
     */
    private Integer getNextPriority(Integer serverId) {
        try {
            ReturnResult<List<MonitorSysGenServerAlertSetting>> settingsResult = getByServerId(serverId);
            if (!settingsResult.isOk() || settingsResult.getData() == null || settingsResult.getData().isEmpty()) {
                return 1;
            }

            return settingsResult.getData().stream()
                    .mapToInt(s -> s.getMonitorSysGenServerAlertSettingPriority() != null ?
                            s.getMonitorSysGenServerAlertSettingPriority() : 0)
                    .max()
                    .orElse(0) + 1;

        } catch (Exception e) {
            log.warn("获取下一个优先级失败，使用默认值: serverId={}", serverId, e);
            return 1;
        }
    }
}
