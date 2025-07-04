package com.chua.starter.monitor.starter.service.impl;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.common.support.utils.StringUtils;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerAlertSetting;
import com.chua.starter.monitor.starter.pojo.AlertNotificationRequest;
import com.chua.starter.monitor.starter.service.AlertNotificationService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import java.util.Map;

/**
 * 邮件告警通知服务实现类
 *
 * @author CH
 * @since 2024/12/27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailAlertNotificationServiceImpl implements AlertNotificationService {

    private final JavaMailSender mailSender;
    private final ObjectMapper objectMapper;

    @Override
    public String getNotificationType() {
        return "EMAIL";
    }

    @Override
    public ReturnResult<Boolean> sendNotification(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting) {
        try {
            // 验证配置
            ReturnResult<Boolean> validateResult = validateConfiguration(setting);
            if (!validateResult.isOk()) {
                return validateResult;
            }

            // 解析配置参数
            Map<String, Object> config = parseConfig(setting.getMonitorSysGenServerAlertSettingConfig());
            
            // 创建邮件消息
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            // 设置发件人
            String fromEmail = (String) config.get("fromEmail");
            if (StringUtils.isNotBlank(fromEmail)) {
                helper.setFrom(fromEmail);
            }

            // 设置收件人
            helper.setTo(setting.getMonitorSysGenServerAlertSettingAddress());

            // 设置主题
            String subject = buildSubject(request);
            helper.setSubject(subject);

            // 设置邮件内容
            String content = buildEmailContent(request, config);
            boolean isHtml = Boolean.TRUE.equals(config.get("htmlFormat"));
            helper.setText(content, isHtml);

            // 发送邮件
            mailSender.send(message);

            log.info("邮件告警发送成功: 收件人={}, 主题={}", setting.getMonitorSysGenServerAlertSettingAddress(), subject);
            return ReturnResult.ok(true, "邮件发送成功");

        } catch (Exception e) {
            log.error("发送邮件告警失败", e);
            return ReturnResult.error("发送邮件失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> testNotification(MonitorSysGenServerAlertSetting setting) {
        try {
            // 创建测试请求
            AlertNotificationRequest testRequest = AlertNotificationRequest.builder()
                    .serverName("测试服务器")
                    .serverHost("test.example.com")
                    .title("测试告警")
                    .message("这是一条测试告警消息，用于验证邮件通知配置是否正确。")
                    .alertTime(java.time.LocalDateTime.now())
                    .isRecovery(false)
                    .build();

            return sendNotification(testRequest, setting);

        } catch (Exception e) {
            log.error("测试邮件通知失败", e);
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateConfiguration(MonitorSysGenServerAlertSetting setting) {
        try {
            // 检查通知地址
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingAddress())) {
                return ReturnResult.error("邮箱地址不能为空");
            }

            // 验证邮箱格式
            String email = setting.getMonitorSysGenServerAlertSettingAddress();
            if (!isValidEmail(email)) {
                return ReturnResult.error("邮箱地址格式不正确");
            }

            // 解析配置参数
            if (StringUtils.isNotBlank(setting.getMonitorSysGenServerAlertSettingConfig())) {
                Map<String, Object> config = parseConfig(setting.getMonitorSysGenServerAlertSettingConfig());
                
                // 验证发件人邮箱
                String fromEmail = (String) config.get("fromEmail");
                if (StringUtils.isNotBlank(fromEmail) && !isValidEmail(fromEmail)) {
                    return ReturnResult.error("发件人邮箱地址格式不正确");
                }
            }

            return ReturnResult.ok(true, "配置验证通过");

        } catch (Exception e) {
            log.error("验证邮件配置失败", e);
            return ReturnResult.error("配置验证失败: " + e.getMessage());
        }
    }

    @Override
    public String getConfigurationDescription() {
        return "邮件通知配置说明：\n" +
                "{\n" +
                "  \"fromEmail\": \"发件人邮箱地址（可选，使用系统默认）\",\n" +
                "  \"htmlFormat\": true/false,  // 是否使用HTML格式（默认false）\n" +
                "  \"template\": \"邮件模板名称（可选）\",\n" +
                "  \"priority\": \"HIGH/NORMAL/LOW\"  // 邮件优先级（可选）\n" +
                "}";
    }

    @Override
    public boolean supportsBatchSending() {
        return true;
    }

    @Override
    public int getRateLimitPerMinute() {
        return 10; // 每分钟最多发送10封邮件
    }

    /**
     * 解析配置参数
     */
    private Map<String, Object> parseConfig(String configJson) {
        try {
            if (StringUtils.isBlank(configJson)) {
                return Map.of();
            }
            return objectMapper.readValue(configJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.warn("解析邮件配置参数失败: {}", configJson, e);
            return Map.of();
        }
    }

    /**
     * 构建邮件主题
     */
    private String buildSubject(AlertNotificationRequest request) {
        StringBuilder subject = new StringBuilder();
        
        if (Boolean.TRUE.equals(request.getIsRecovery())) {
            subject.append("【告警恢复】");
        } else {
            subject.append("【系统告警】");
        }
        
        if (request.getServerName() != null) {
            subject.append(" ").append(request.getServerName());
        }
        
        if (request.getAlertType() != null) {
            subject.append(" - ").append(request.getAlertType().getDescription());
        }
        
        return subject.toString();
    }

    /**
     * 构建邮件内容
     */
    private String buildEmailContent(AlertNotificationRequest request, Map<String, Object> config) {
        boolean isHtml = Boolean.TRUE.equals(config.get("htmlFormat"));
        
        if (isHtml) {
            return buildHtmlContent(request);
        } else {
            return buildTextContent(request);
        }
    }

    /**
     * 构建HTML格式邮件内容
     */
    private String buildHtmlContent(AlertNotificationRequest request) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>");
        html.append("<html><head><meta charset='UTF-8'></head><body>");
        html.append("<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>");
        
        // 标题
        String color = request.getAlertColor();
        html.append("<h2 style='color: ").append(color).append(";'>");
        if (Boolean.TRUE.equals(request.getIsRecovery())) {
            html.append("🟢 告警恢复通知");
        } else {
            html.append("🔴 系统告警通知");
        }
        html.append("</h2>");
        
        // 告警信息表格
        html.append("<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>");
        html.append("<tr><td style='padding: 8px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;'>服务器名称</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd;'>").append(request.getServerName() != null ? request.getServerName() : "未知").append("</td></tr>");
        
        html.append("<tr><td style='padding: 8px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;'>主机地址</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd;'>").append(request.getServerHost() != null ? request.getServerHost() : "未知").append("</td></tr>");
        
        html.append("<tr><td style='padding: 8px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;'>告警类型</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd;'>").append(request.getAlertType() != null ? request.getAlertType().getDescription() : "未知").append("</td></tr>");
        
        if (request.getCurrentValue() != null) {
            html.append("<tr><td style='padding: 8px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;'>当前值</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd;'>").append(request.getCurrentValue());
            if (request.getUnit() != null) {
                html.append(request.getUnit());
            }
            html.append("</td></tr>");
        }
        
        if (request.getThresholdValue() != null && !Boolean.TRUE.equals(request.getIsRecovery())) {
            html.append("<tr><td style='padding: 8px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;'>告警阈值</td>");
            html.append("<td style='padding: 8px; border: 1px solid #ddd;'>").append(request.getThresholdValue());
            if (request.getUnit() != null) {
                html.append(request.getUnit());
            }
            html.append("</td></tr>");
        }
        
        html.append("<tr><td style='padding: 8px; border: 1px solid #ddd; background: #f5f5f5; font-weight: bold;'>告警时间</td>");
        html.append("<td style='padding: 8px; border: 1px solid #ddd;'>").append(request.getAlertTime() != null ? request.getAlertTime().toString() : java.time.LocalDateTime.now().toString()).append("</td></tr>");
        html.append("</table>");
        
        // 详细信息
        if (request.getMessage() != null) {
            html.append("<div style='margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 4px solid ").append(color).append(";'>");
            html.append("<h4 style='margin: 0 0 10px 0;'>详细信息：</h4>");
            html.append("<p style='margin: 0;'>").append(request.getMessage().replace("\n", "<br>")).append("</p>");
            html.append("</div>");
        }
        
        html.append("</div></body></html>");
        return html.toString();
    }

    /**
     * 构建纯文本邮件内容
     */
    private String buildTextContent(AlertNotificationRequest request) {
        return request.getFormattedMessage();
    }

    /**
     * 验证邮箱格式
     */
    private boolean isValidEmail(String email) {
        if (StringUtils.isBlank(email)) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    }
}
