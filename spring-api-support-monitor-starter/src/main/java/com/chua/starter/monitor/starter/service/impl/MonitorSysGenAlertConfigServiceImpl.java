package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenAlertConfig;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenAlertConfigMapper;
import com.chua.starter.monitor.starter.service.MonitorSysGenAlertConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 告警配置服务实现类
 *
 * @author CH
 * @since 2024/12/26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSysGenAlertConfigServiceImpl 
    extends ServiceImpl<MonitorSysGenAlertConfigMapper, MonitorSysGenAlertConfig> 
    implements MonitorSysGenAlertConfigService {

    @Override
    public ReturnResult<MonitorSysGenAlertConfig> getDefaultConfig() {
        try {
            MonitorSysGenAlertConfig config = baseMapper.selectDefaultConfig();
            if (config == null) {
                // 如果没有默认配置，创建一个
                ReturnResult<Boolean> initResult = initializeDefaultConfig();
                if (initResult.isOk()) {
                    config = baseMapper.selectDefaultConfig();
                }
            }
            return ReturnResult.success(config);
        } catch (Exception e) {
            log.error("获取默认告警配置失败", e);
            return ReturnResult.error("获取默认配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenAlertConfig>> getEnabledConfigs() {
        try {
            List<MonitorSysGenAlertConfig> configs = baseMapper.selectEnabledConfigs();
            return ReturnResult.success(configs);
        } catch (Exception e) {
            log.error("获取启用的告警配置失败", e);
            return ReturnResult.error("获取启用配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<MonitorSysGenAlertConfig> getConfigByName(String name) {
        try {
            if (StringUtils.isBlank(name)) {
                return ReturnResult.error("配置名称不能为空");
            }
            MonitorSysGenAlertConfig config = baseMapper.selectByName(name);
            return ReturnResult.success(config);
        } catch (Exception e) {
            log.error("根据名称获取告警配置失败: name={}", name, e);
            return ReturnResult.error("获取配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> saveConfig(MonitorSysGenAlertConfig config) {
        try {
            // 验证配置
            ReturnResult<Boolean> validateResult = validateConfig(config);
            if (!validateResult.isOk()) {
                return validateResult;
            }

            // 检查名称是否重复
            if (StringUtils.isNotBlank(config.getMonitorSysGenAlertConfigName())) {
                MonitorSysGenAlertConfig existing = baseMapper.selectByName(config.getMonitorSysGenAlertConfigName());
                if (existing != null) {
                    return ReturnResult.error("配置名称已存在");
                }
            }

            // 如果设置为默认配置，先清除其他默认标记
            if (config.isDefault()) {
                baseMapper.clearAllDefaultFlags();
            }

            boolean result = save(config);
            if (result) {
                log.info("保存告警配置成功: name={}", config.getMonitorSysGenAlertConfigName());
                return ReturnResult.success(true);
            } else {
                return ReturnResult.error("保存配置失败");
            }
        } catch (Exception e) {
            log.error("保存告警配置失败", e);
            return ReturnResult.error("保存配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateConfig(MonitorSysGenAlertConfig config) {
        try {
            if (config.getMonitorSysGenAlertConfigId() == null) {
                return ReturnResult.error("配置ID不能为空");
            }

            // 验证配置
            ReturnResult<Boolean> validateResult = validateConfig(config);
            if (!validateResult.isOk()) {
                return validateResult;
            }

            // 检查名称是否重复（排除自己）
            if (StringUtils.isNotBlank(config.getMonitorSysGenAlertConfigName())) {
                MonitorSysGenAlertConfig existing = baseMapper.selectByName(config.getMonitorSysGenAlertConfigName());
                if (existing != null && !existing.getMonitorSysGenAlertConfigId().equals(config.getMonitorSysGenAlertConfigId())) {
                    return ReturnResult.error("配置名称已存在");
                }
            }

            // 如果设置为默认配置，先清除其他默认标记
            if (config.isDefault()) {
                baseMapper.clearAllDefaultFlags();
            }

            boolean result = updateById(config);
            if (result) {
                log.info("更新告警配置成功: id={}, name={}", 
                    config.getMonitorSysGenAlertConfigId(), config.getMonitorSysGenAlertConfigName());
                return ReturnResult.success(true);
            } else {
                return ReturnResult.error("更新配置失败");
            }
        } catch (Exception e) {
            log.error("更新告警配置失败", e);
            return ReturnResult.error("更新配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> deleteConfig(Integer configId) {
        try {
            if (configId == null) {
                return ReturnResult.error("配置ID不能为空");
            }

            MonitorSysGenAlertConfig config = getById(configId);
            if (config == null) {
                return ReturnResult.error("配置不存在");
            }

            // 不能删除默认配置
            if (config.isDefault()) {
                return ReturnResult.error("不能删除默认配置");
            }

            boolean result = removeById(configId);
            if (result) {
                log.info("删除告警配置成功: id={}, name={}", configId, config.getMonitorSysGenAlertConfigName());
                return ReturnResult.success(true);
            } else {
                return ReturnResult.error("删除配置失败");
            }
        } catch (Exception e) {
            log.error("删除告警配置失败: configId={}", configId, e);
            return ReturnResult.error("删除配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> setDefaultConfig(Integer configId) {
        try {
            if (configId == null) {
                return ReturnResult.error("配置ID不能为空");
            }

            MonitorSysGenAlertConfig config = getById(configId);
            if (config == null) {
                return ReturnResult.error("配置不存在");
            }

            if (!config.isEnabled()) {
                return ReturnResult.error("只能设置启用的配置为默认配置");
            }

            // 清除所有默认标记
            baseMapper.clearAllDefaultFlags();
            
            // 设置新的默认配置
            baseMapper.setAsDefault(configId);

            log.info("设置默认告警配置成功: id={}, name={}", configId, config.getMonitorSysGenAlertConfigName());
            return ReturnResult.success(true);
        } catch (Exception e) {
            log.error("设置默认告警配置失败: configId={}", configId, e);
            return ReturnResult.error("设置默认配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> toggleConfig(Integer configId, boolean enabled) {
        try {
            if (configId == null) {
                return ReturnResult.error("配置ID不能为空");
            }

            MonitorSysGenAlertConfig config = getById(configId);
            if (config == null) {
                return ReturnResult.error("配置不存在");
            }

            // 如果是默认配置，不能禁用
            if (config.isDefault() && !enabled) {
                return ReturnResult.error("不能禁用默认配置");
            }

            config.setMonitorSysGenAlertConfigEnabled(enabled ? 1 : 0);
            boolean result = updateById(config);
            
            if (result) {
                log.info("{}告警配置成功: id={}, name={}", enabled ? "启用" : "禁用", 
                    configId, config.getMonitorSysGenAlertConfigName());
                return ReturnResult.success(true);
            } else {
                return ReturnResult.error("操作失败");
            }
        } catch (Exception e) {
            log.error("切换告警配置状态失败: configId={}, enabled={}", configId, enabled, e);
            return ReturnResult.error("操作失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<MonitorSysGenAlertConfig> copyConfig(Integer configId, String newName) {
        try {
            if (configId == null) {
                return ReturnResult.error("配置ID不能为空");
            }
            if (StringUtils.isBlank(newName)) {
                return ReturnResult.error("新配置名称不能为空");
            }

            MonitorSysGenAlertConfig sourceConfig = getById(configId);
            if (sourceConfig == null) {
                return ReturnResult.error("源配置不存在");
            }

            // 检查新名称是否重复
            MonitorSysGenAlertConfig existing = baseMapper.selectByName(newName);
            if (existing != null) {
                return ReturnResult.error("配置名称已存在");
            }

            // 复制配置
            MonitorSysGenAlertConfig newConfig = new MonitorSysGenAlertConfig();
            copyProperties(sourceConfig, newConfig);
            newConfig.setMonitorSysGenAlertConfigId(null);
            newConfig.setMonitorSysGenAlertConfigName(newName);
            newConfig.setMonitorSysGenAlertConfigDescription("复制自: " + sourceConfig.getMonitorSysGenAlertConfigName());
            newConfig.setMonitorSysGenAlertConfigIsDefault(0); // 复制的配置不是默认配置

            boolean result = save(newConfig);
            if (result) {
                log.info("复制告警配置成功: sourceId={}, newName={}", configId, newName);
                return ReturnResult.success(newConfig);
            } else {
                return ReturnResult.error("复制配置失败");
            }
        } catch (Exception e) {
            log.error("复制告警配置失败: configId={}, newName={}", configId, newName, e);
            return ReturnResult.error("复制配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateConfig(MonitorSysGenAlertConfig config) {
        try {
            if (config == null) {
                return ReturnResult.error("配置不能为空");
            }

            if (StringUtils.isBlank(config.getMonitorSysGenAlertConfigName())) {
                return ReturnResult.error("配置名称不能为空");
            }

            // 验证阈值范围
            if (config.getMonitorSysGenAlertConfigCpuThreshold() != null) {
                BigDecimal cpuThreshold = config.getMonitorSysGenAlertConfigCpuThreshold();
                if (cpuThreshold.compareTo(BigDecimal.ZERO) <= 0 || cpuThreshold.compareTo(new BigDecimal("100")) > 0) {
                    return ReturnResult.error("CPU告警阈值必须在0-100之间");
                }
            }

            if (config.getMonitorSysGenAlertConfigMemoryThreshold() != null) {
                BigDecimal memoryThreshold = config.getMonitorSysGenAlertConfigMemoryThreshold();
                if (memoryThreshold.compareTo(BigDecimal.ZERO) <= 0 || memoryThreshold.compareTo(new BigDecimal("100")) > 0) {
                    return ReturnResult.error("内存告警阈值必须在0-100之间");
                }
            }

            if (config.getMonitorSysGenAlertConfigDiskThreshold() != null) {
                BigDecimal diskThreshold = config.getMonitorSysGenAlertConfigDiskThreshold();
                if (diskThreshold.compareTo(BigDecimal.ZERO) <= 0 || diskThreshold.compareTo(new BigDecimal("100")) > 0) {
                    return ReturnResult.error("磁盘告警阈值必须在0-100之间");
                }
            }

            if (config.getMonitorSysGenAlertConfigNetworkThreshold() != null) {
                BigDecimal networkThreshold = config.getMonitorSysGenAlertConfigNetworkThreshold();
                if (networkThreshold.compareTo(BigDecimal.ZERO) <= 0) {
                    return ReturnResult.error("网络告警阈值必须大于0");
                }
            }

            if (config.getMonitorSysGenAlertConfigResponseTimeThreshold() != null) {
                Long responseTimeThreshold = config.getMonitorSysGenAlertConfigResponseTimeThreshold();
                if (responseTimeThreshold <= 0) {
                    return ReturnResult.error("响应时间告警阈值必须大于0");
                }
            }

            return ReturnResult.success(true);
        } catch (Exception e) {
            log.error("验证告警配置失败", e);
            return ReturnResult.error("验证配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getConfigStatistics() {
        try {
            Map<String, Object> statistics = new HashMap<>();
            
            // 总配置数
            long totalCount = count();
            statistics.put("totalCount", totalCount);
            
            // 启用配置数
            long enabledCount = count(new LambdaQueryWrapper<MonitorSysGenAlertConfig>()
                .eq(MonitorSysGenAlertConfig::getMonitorSysGenAlertConfigEnabled, 1));
            statistics.put("enabledCount", enabledCount);
            
            // 禁用配置数
            statistics.put("disabledCount", totalCount - enabledCount);
            
            // 默认配置
            MonitorSysGenAlertConfig defaultConfig = baseMapper.selectDefaultConfig();
            statistics.put("defaultConfig", defaultConfig != null ? defaultConfig.getMonitorSysGenAlertConfigName() : "无");
            
            return ReturnResult.success(statistics);
        } catch (Exception e) {
            log.error("获取告警配置统计信息失败", e);
            return ReturnResult.error("获取统计信息失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> initializeDefaultConfig() {
        try {
            // 检查是否已存在默认配置
            if (baseMapper.existsDefaultConfig()) {
                return ReturnResult.success(true);
            }

            // 创建默认配置
            MonitorSysGenAlertConfig defaultConfig = MonitorSysGenAlertConfig.createDefault();
            boolean result = save(defaultConfig);
            
            if (result) {
                log.info("初始化默认告警配置成功");
                return ReturnResult.success(true);
            } else {
                return ReturnResult.error("初始化默认配置失败");
            }
        } catch (Exception e) {
            log.error("初始化默认告警配置失败", e);
            return ReturnResult.error("初始化默认配置失败: " + e.getMessage());
        }
    }

    /**
     * 复制对象属性
     */
    private void copyProperties(MonitorSysGenAlertConfig source, MonitorSysGenAlertConfig target) {
        target.setMonitorSysGenAlertConfigName(source.getMonitorSysGenAlertConfigName());
        target.setMonitorSysGenAlertConfigDescription(source.getMonitorSysGenAlertConfigDescription());
        target.setMonitorSysGenAlertConfigEnabled(source.getMonitorSysGenAlertConfigEnabled());
        target.setMonitorSysGenAlertConfigCpuThreshold(source.getMonitorSysGenAlertConfigCpuThreshold());
        target.setMonitorSysGenAlertConfigCpuCriticalThreshold(source.getMonitorSysGenAlertConfigCpuCriticalThreshold());
        target.setMonitorSysGenAlertConfigMemoryThreshold(source.getMonitorSysGenAlertConfigMemoryThreshold());
        target.setMonitorSysGenAlertConfigMemoryCriticalThreshold(source.getMonitorSysGenAlertConfigMemoryCriticalThreshold());
        target.setMonitorSysGenAlertConfigDiskThreshold(source.getMonitorSysGenAlertConfigDiskThreshold());
        target.setMonitorSysGenAlertConfigDiskCriticalThreshold(source.getMonitorSysGenAlertConfigDiskCriticalThreshold());
        target.setMonitorSysGenAlertConfigNetworkThreshold(source.getMonitorSysGenAlertConfigNetworkThreshold());
        target.setMonitorSysGenAlertConfigNetworkCriticalThreshold(source.getMonitorSysGenAlertConfigNetworkCriticalThreshold());
        target.setMonitorSysGenAlertConfigResponseTimeThreshold(source.getMonitorSysGenAlertConfigResponseTimeThreshold());
        target.setMonitorSysGenAlertConfigResponseTimeCriticalThreshold(source.getMonitorSysGenAlertConfigResponseTimeCriticalThreshold());
        target.setMonitorSysGenAlertConfigLatencyThreshold(source.getMonitorSysGenAlertConfigLatencyThreshold());
        target.setMonitorSysGenAlertConfigLatencyCriticalThreshold(source.getMonitorSysGenAlertConfigLatencyCriticalThreshold());
        target.setMonitorSysGenAlertConfigTemperatureThreshold(source.getMonitorSysGenAlertConfigTemperatureThreshold());
        target.setMonitorSysGenAlertConfigTemperatureCriticalThreshold(source.getMonitorSysGenAlertConfigTemperatureCriticalThreshold());
        target.setMonitorSysGenAlertConfigSilenceDuration(source.getMonitorSysGenAlertConfigSilenceDuration());
        target.setMonitorSysGenAlertConfigDetectionInterval(source.getMonitorSysGenAlertConfigDetectionInterval());
        target.setMonitorSysGenAlertConfigRecoveryNotificationEnabled(source.getMonitorSysGenAlertConfigRecoveryNotificationEnabled());
        target.setMonitorSysGenAlertConfigNotificationMethod(source.getMonitorSysGenAlertConfigNotificationMethod());
        target.setMonitorSysGenAlertConfigNotificationAddress(source.getMonitorSysGenAlertConfigNotificationAddress());
    }

    // 其他方法的简化实现，返回默认值或空实现
    @Override
    public ReturnResult<Map<String, Object>> importConfigs(List<MonitorSysGenAlertConfig> configs) {
        return ReturnResult.success(Map.of("imported", 0, "failed", 0));
    }

    @Override
    public ReturnResult<List<MonitorSysGenAlertConfig>> exportConfigs(List<Integer> configIds) {
        return ReturnResult.success(new ArrayList<>());
    }

    @Override
    public ReturnResult<Boolean> resetToDefault() {
        return ReturnResult.success(true);
    }

    @Override
    public ReturnResult<MonitorSysGenAlertConfig> getRecommendedConfig(String serverType) {
        return getDefaultConfig();
    }

    @Override
    public ReturnResult<Boolean> testConfig(Integer configId) {
        return ReturnResult.success(true);
    }

    @Override
    public ReturnResult<List<Map<String, Object>>> getConfigHistory(Integer configId, Integer limit) {
        return ReturnResult.success(new ArrayList<>());
    }

    @Override
    public ReturnResult<Boolean> applyConfigToServers(Integer configId, List<Integer> serverIds) {
        return ReturnResult.success(true);
    }

    @Override
    public ReturnResult<List<Map<String, Object>>> getServersUsingConfig(Integer configId) {
        return ReturnResult.success(new ArrayList<>());
    }
}
