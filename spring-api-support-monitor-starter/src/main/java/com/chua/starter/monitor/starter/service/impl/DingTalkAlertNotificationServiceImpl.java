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
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 钉钉告警通知服务实现类
 *
 * @author CH
 * @since 2024/12/27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DingTalkAlertNotificationServiceImpl implements AlertNotificationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String getNotificationType() {
        return "DINGTALK";
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
            
            // 构建钉钉消息
            Map<String, Object> requestBody = buildDingTalkMessage(request, config);
            
            // 构建请求URL（包含签名）
            String webhookUrl = buildWebhookUrl(setting.getMonitorSysGenServerAlertSettingAddress(), config);
            
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送钉钉消息
            ResponseEntity<String> response = restTemplate.exchange(
                    webhookUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("钉钉告警发送成功: URL={}", webhookUrl);
                return ReturnResult.ok(true, "钉钉消息发送成功");
            } else {
                log.warn("钉钉告警发送失败: 状态码={}, 响应={}", response.getStatusCode(), response.getBody());
                return ReturnResult.error("钉钉消息发送失败: HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("发送钉钉告警失败", e);
            return ReturnResult.error("发送钉钉消息失败: " + e.getMessage());
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
                    .message("这是一条测试钉钉告警消息。")
                    .alertTime(java.time.LocalDateTime.now())
                    .isRecovery(false)
                    .build();

            return sendNotification(testRequest, setting);

        } catch (Exception e) {
            log.error("测试钉钉通知失败", e);
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateConfiguration(MonitorSysGenServerAlertSetting setting) {
        try {
            // 检查Webhook URL
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingAddress())) {
                return ReturnResult.error("钉钉Webhook URL不能为空");
            }

            // 验证URL格式
            String url = setting.getMonitorSysGenServerAlertSettingAddress();
            if (!url.contains("dingtalk.com") || !url.contains("robot/send")) {
                return ReturnResult.error("钉钉Webhook URL格式不正确");
            }

            return ReturnResult.ok(true, "配置验证通过");

        } catch (Exception e) {
            log.error("验证钉钉配置失败", e);
            return ReturnResult.error("配置验证失败: " + e.getMessage());
        }
    }

    @Override
    public String getConfigurationDescription() {
        return "钉钉通知配置说明：\n" +
                "{\n" +
                "  \"secret\": \"钉钉机器人密钥（可选，用于签名验证）\",\n" +
                "  \"atMobiles\": [\"手机号1\", \"手机号2\"],  // @指定手机号\n" +
                "  \"atUserIds\": [\"用户ID1\", \"用户ID2\"],  // @指定用户ID\n" +
                "  \"isAtAll\": false,  // 是否@所有人\n" +
                "  \"messageType\": \"text/markdown/actionCard\",  // 消息类型\n" +
                "  \"title\": \"自定义标题（markdown/actionCard类型时使用）\"\n" +
                "}";
    }

    @Override
    public boolean supportsBatchSending() {
        return false;
    }

    @Override
    public int getRateLimitPerMinute() {
        return 20; // 钉钉机器人每分钟最多发送20条消息
    }

    /**
     * 构建钉钉消息
     */
    private Map<String, Object> buildDingTalkMessage(AlertNotificationRequest request, Map<String, Object> config) {
        String messageType = (String) config.getOrDefault("messageType", "text");
        
        Map<String, Object> message = new HashMap<>();
        message.put("msgtype", messageType);

        switch (messageType.toLowerCase()) {
            case "markdown":
                message.put("markdown", buildMarkdownMessage(request, config));
                break;
            case "actioncard":
                message.put("actionCard", buildActionCardMessage(request, config));
                break;
            default:
                message.put("text", buildTextMessage(request));
                break;
        }

        // 添加@信息
        Map<String, Object> at = buildAtInfo(config);
        if (!at.isEmpty()) {
            message.put("at", at);
        }

        return message;
    }

    /**
     * 构建文本消息
     */
    private Map<String, Object> buildTextMessage(AlertNotificationRequest request) {
        Map<String, Object> text = new HashMap<>();
        
        StringBuilder content = new StringBuilder();
        if (Boolean.TRUE.equals(request.getIsRecovery())) {
            content.append("✅ 告警恢复通知\n\n");
        } else {
            content.append("🚨 系统告警通知\n\n");
        }
        
        content.append("服务器: ").append(request.getServerName() != null ? request.getServerName() : "未知").append("\n");
        content.append("主机: ").append(request.getServerHost() != null ? request.getServerHost() : "未知").append("\n");
        content.append("类型: ").append(request.getAlertType() != null ? request.getAlertType().getDescription() : "未知").append("\n");
        
        if (request.getCurrentValue() != null) {
            content.append("当前值: ").append(request.getCurrentValue());
            if (request.getUnit() != null) {
                content.append(request.getUnit());
            }
            content.append("\n");
        }
        
        if (request.getThresholdValue() != null && !Boolean.TRUE.equals(request.getIsRecovery())) {
            content.append("阈值: ").append(request.getThresholdValue());
            if (request.getUnit() != null) {
                content.append(request.getUnit());
            }
            content.append("\n");
        }
        
        if (request.getMessage() != null) {
            content.append("详情: ").append(request.getMessage()).append("\n");
        }
        
        content.append("时间: ").append(request.getAlertTime() != null ? 
                request.getAlertTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : 
                java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        text.put("content", content.toString());
        return text;
    }

    /**
     * 构建Markdown消息
     */
    private Map<String, Object> buildMarkdownMessage(AlertNotificationRequest request, Map<String, Object> config) {
        Map<String, Object> markdown = new HashMap<>();
        
        String title = (String) config.getOrDefault("title", "系统告警通知");
        markdown.put("title", title);
        
        StringBuilder content = new StringBuilder();
        
        if (Boolean.TRUE.equals(request.getIsRecovery())) {
            content.append("## ✅ 告警恢复通知\n\n");
        } else {
            content.append("## 🚨 系统告警通知\n\n");
        }
        
        content.append("**服务器:** ").append(request.getServerName() != null ? request.getServerName() : "未知").append("\n\n");
        content.append("**主机:** ").append(request.getServerHost() != null ? request.getServerHost() : "未知").append("\n\n");
        content.append("**类型:** ").append(request.getAlertType() != null ? request.getAlertType().getDescription() : "未知").append("\n\n");
        
        if (request.getCurrentValue() != null) {
            content.append("**当前值:** ").append(request.getCurrentValue());
            if (request.getUnit() != null) {
                content.append(request.getUnit());
            }
            content.append("\n\n");
        }
        
        if (request.getThresholdValue() != null && !Boolean.TRUE.equals(request.getIsRecovery())) {
            content.append("**阈值:** ").append(request.getThresholdValue());
            if (request.getUnit() != null) {
                content.append(request.getUnit());
            }
            content.append("\n\n");
        }
        
        if (request.getMessage() != null) {
            content.append("**详情:** ").append(request.getMessage()).append("\n\n");
        }
        
        content.append("**时间:** ").append(request.getAlertTime() != null ? 
                request.getAlertTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : 
                java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        markdown.put("text", content.toString());
        return markdown;
    }

    /**
     * 构建ActionCard消息
     */
    private Map<String, Object> buildActionCardMessage(AlertNotificationRequest request, Map<String, Object> config) {
        Map<String, Object> actionCard = new HashMap<>();
        
        String title = (String) config.getOrDefault("title", "系统告警通知");
        actionCard.put("title", title);
        
        StringBuilder text = new StringBuilder();
        if (Boolean.TRUE.equals(request.getIsRecovery())) {
            text.append("### ✅ 告警恢复通知\n\n");
        } else {
            text.append("### 🚨 系统告警通知\n\n");
        }
        
        text.append("- **服务器:** ").append(request.getServerName() != null ? request.getServerName() : "未知").append("\n");
        text.append("- **主机:** ").append(request.getServerHost() != null ? request.getServerHost() : "未知").append("\n");
        text.append("- **类型:** ").append(request.getAlertType() != null ? request.getAlertType().getDescription() : "未知").append("\n");
        
        if (request.getCurrentValue() != null) {
            text.append("- **当前值:** ").append(request.getCurrentValue());
            if (request.getUnit() != null) {
                text.append(request.getUnit());
            }
            text.append("\n");
        }
        
        actionCard.put("text", text.toString());
        actionCard.put("hideAvatar", "0");
        actionCard.put("btnOrientation", "0");
        
        return actionCard;
    }

    /**
     * 构建@信息
     */
    private Map<String, Object> buildAtInfo(Map<String, Object> config) {
        Map<String, Object> at = new HashMap<>();
        
        @SuppressWarnings("unchecked")
        List<String> atMobiles = (List<String>) config.get("atMobiles");
        if (atMobiles != null && !atMobiles.isEmpty()) {
            at.put("atMobiles", atMobiles);
        }
        
        @SuppressWarnings("unchecked")
        List<String> atUserIds = (List<String>) config.get("atUserIds");
        if (atUserIds != null && !atUserIds.isEmpty()) {
            at.put("atUserIds", atUserIds);
        }
        
        Boolean isAtAll = (Boolean) config.get("isAtAll");
        if (Boolean.TRUE.equals(isAtAll)) {
            at.put("isAtAll", true);
        }
        
        return at;
    }

    /**
     * 构建Webhook URL（包含签名）
     */
    private String buildWebhookUrl(String baseUrl, Map<String, Object> config) throws Exception {
        String secret = (String) config.get("secret");
        if (StringUtils.isBlank(secret)) {
            return baseUrl;
        }

        // 生成签名
        long timestamp = System.currentTimeMillis();
        String stringToSign = timestamp + "\n" + secret;
        
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] signData = mac.doFinal(stringToSign.getBytes(StandardCharsets.UTF_8));
        String sign = URLEncoder.encode(Base64.getEncoder().encodeToString(signData), StandardCharsets.UTF_8);

        // 添加签名参数
        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl + separator + "timestamp=" + timestamp + "&sign=" + sign;
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
            log.warn("解析钉钉配置参数失败: {}", configJson, e);
            return Map.of();
        }
    }
}
