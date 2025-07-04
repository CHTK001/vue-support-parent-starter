package com.chua.starter.monitor.starter.service;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerAlertSetting;
import com.chua.starter.monitor.starter.pojo.AlertNotificationRequest;

/**
 * 告警通知服务接口
 * 定义统一的告警通知方法，各种通知方式需要实现此接口
 *
 * @author CH
 * @since 2024/12/27
 */
public interface AlertNotificationService {

    /**
     * 获取通知方式类型
     *
     * @return 通知方式类型（EMAIL、SMS、WEBHOOK、DINGTALK、WECHAT等）
     */
    String getNotificationType();

    /**
     * 发送告警通知
     *
     * @param request 告警通知请求
     * @param setting 告警配置设置
     * @return 发送结果
     */
    ReturnResult<Boolean> sendNotification(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting);

    /**
     * 测试通知配置
     *
     * @param setting 告警配置设置
     * @return 测试结果
     */
    ReturnResult<Boolean> testNotification(MonitorSysGenServerAlertSetting setting);

    /**
     * 验证配置参数
     *
     * @param setting 告警配置设置
     * @return 验证结果
     */
    ReturnResult<Boolean> validateConfiguration(MonitorSysGenServerAlertSetting setting);

    /**
     * 获取配置参数说明
     *
     * @return 配置参数说明
     */
    String getConfigurationDescription();

    /**
     * 是否支持批量发送
     *
     * @return 是否支持批量发送
     */
    default boolean supportsBatchSending() {
        return false;
    }

    /**
     * 获取发送频率限制（每分钟最大发送次数）
     *
     * @return 发送频率限制，0表示无限制
     */
    default int getRateLimitPerMinute() {
        return 0;
    }

    /**
     * 是否需要认证
     *
     * @return 是否需要认证
     */
    default boolean requiresAuthentication() {
        return true;
    }
}
