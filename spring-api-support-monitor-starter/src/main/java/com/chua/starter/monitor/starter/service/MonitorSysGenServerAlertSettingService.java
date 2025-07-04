package com.chua.starter.monitor.starter.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerAlertSetting;

import java.util.List;
import java.util.Map;

/**
 * 服务器告警设置服务接口
 *
 * @author CH
 * @since 2024/12/27
 */
public interface MonitorSysGenServerAlertSettingService extends IService<MonitorSysGenServerAlertSetting> {

    /**
     * 根据服务器ID获取告警设置列表
     *
     * @param serverId 服务器ID
     * @return 告警设置列表
     */
    ReturnResult<List<MonitorSysGenServerAlertSetting>> getByServerId(Integer serverId);

    /**
     * 根据服务器ID和通知类型获取告警设置
     *
     * @param serverId         服务器ID
     * @param notificationType 通知类型
     * @return 告警设置
     */
    ReturnResult<MonitorSysGenServerAlertSetting> getByServerIdAndType(Integer serverId, String notificationType);

    /**
     * 获取服务器启用的告警设置列表
     *
     * @param serverId 服务器ID
     * @return 启用的告警设置列表
     */
    ReturnResult<List<MonitorSysGenServerAlertSetting>> getEnabledByServerId(Integer serverId);

    /**
     * 保存告警设置
     *
     * @param setting 告警设置
     * @return 保存结果
     */
    ReturnResult<MonitorSysGenServerAlertSetting> saveSetting(MonitorSysGenServerAlertSetting setting);

    /**
     * 更新告警设置
     *
     * @param setting 告警设置
     * @return 更新结果
     */
    ReturnResult<MonitorSysGenServerAlertSetting> updateSetting(MonitorSysGenServerAlertSetting setting);

    /**
     * 删除告警设置
     *
     * @param settingId 告警设置ID
     * @return 删除结果
     */
    ReturnResult<Boolean> deleteSetting(Long settingId);

    /**
     * 启用/禁用告警设置
     *
     * @param settingId 告警设置ID
     * @param enabled   是否启用
     * @return 操作结果
     */
    ReturnResult<Boolean> toggleEnabled(Long settingId, Boolean enabled);

    /**
     * 测试告警设置
     *
     * @param settingId 告警设置ID
     * @return 测试结果
     */
    ReturnResult<Boolean> testSetting(Long settingId);

    /**
     * 批量测试告警设置
     *
     * @param serverId 服务器ID
     * @return 测试结果
     */
    ReturnResult<List<String>> batchTestSettings(Integer serverId);

    /**
     * 复制告警设置到其他服务器
     *
     * @param sourceServerId 源服务器ID
     * @param targetServerIds 目标服务器ID列表
     * @return 复制结果
     */
    ReturnResult<Boolean> copySettingsToServers(Integer sourceServerId, List<Integer> targetServerIds);

    /**
     * 为服务器初始化默认告警设置
     *
     * @param serverId 服务器ID
     * @return 初始化结果
     */
    ReturnResult<Boolean> initDefaultSettings(Integer serverId);

    /**
     * 验证告警设置配置
     *
     * @param setting 告警设置
     * @return 验证结果
     */
    ReturnResult<Boolean> validateSetting(MonitorSysGenServerAlertSetting setting);

    /**
     * 获取支持的通知类型列表
     *
     * @return 通知类型列表
     */
    ReturnResult<List<String>> getSupportedNotificationTypes();

    /**
     * 获取通知类型的配置说明
     *
     * @param notificationType 通知类型
     * @return 配置说明
     */
    ReturnResult<String> getNotificationTypeDescription(String notificationType);

    /**
     * 更新测试结果
     *
     * @param settingId   告警设置ID
     * @param success     是否成功
     * @param errorMessage 错误信息
     * @return 更新结果
     */
    ReturnResult<Boolean> updateTestResult(Long settingId, Boolean success, String errorMessage);

    /**
     * 获取告警设置统计信息
     *
     * @param serverId 服务器ID
     * @return 统计信息
     */
    ReturnResult<Map<String, Object>> getSettingsStatistics(Integer serverId);
}
