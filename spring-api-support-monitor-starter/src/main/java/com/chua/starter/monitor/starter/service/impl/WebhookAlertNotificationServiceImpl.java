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

import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Webhook告警通知服务实现类
 *
 * @author CH
 * @since 2024/12/27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WebhookAlertNotificationServiceImpl implements AlertNotificationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String getNotificationType() {
        return "WEBHOOK";
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
            
            // 构建请求体
            Map<String, Object> requestBody = buildRequestBody(request, config);
            
            // 设置请求头
            HttpHeaders headers = buildHeaders(config);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送Webhook请求
            String webhookUrl = setting.getMonitorSysGenServerAlertSettingAddress();
            ResponseEntity<String> response = restTemplate.exchange(
                    webhookUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("Webhook告警发送成功: URL={}, 状态码={}", webhookUrl, response.getStatusCode());
                return ReturnResult.ok(true, "Webhook发送成功");
            } else {
                log.warn("Webhook告警发送失败: URL={}, 状态码={}, 响应={}", webhookUrl, response.getStatusCode(), response.getBody());
                return ReturnResult.error("Webhook发送失败: HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("发送Webhook告警失败", e);
            return ReturnResult.error("发送Webhook失败: " + e.getMessage());
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
                    .message("这是一条测试Webhook告警消息。")
                    .alertTime(java.time.LocalDateTime.now())
                    .isRecovery(false)
                    .build();

            return sendNotification(testRequest, setting);

        } catch (Exception e) {
            log.error("测试Webhook通知失败", e);
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateConfiguration(MonitorSysGenServerAlertSetting setting) {
        try {
            // 检查Webhook URL
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingAddress())) {
                return ReturnResult.error("Webhook URL不能为空");
            }

            // 验证URL格式
            String url = setting.getMonitorSysGenServerAlertSettingAddress();
            if (!isValidUrl(url)) {
                return ReturnResult.error("Webhook URL格式不正确");
            }

            // 解析配置参数
            if (StringUtils.isNotBlank(setting.getMonitorSysGenServerAlertSettingConfig())) {
                Map<String, Object> config = parseConfig(setting.getMonitorSysGenServerAlertSettingConfig());
                
                // 验证自定义模板格式
                String template = (String) config.get("template");
                if (StringUtils.isNotBlank(template)) {
                    try {
                        objectMapper.readTree(template);
                    } catch (Exception e) {
                        return ReturnResult.error("自定义模板格式不正确，必须是有效的JSON");
                    }
                }
            }

            return ReturnResult.ok(true, "配置验证通过");

        } catch (Exception e) {
            log.error("验证Webhook配置失败", e);
            return ReturnResult.error("配置验证失败: " + e.getMessage());
        }
    }

    @Override
    public String getConfigurationDescription() {
        return "Webhook通知配置说明：\n" +
                "{\n" +
                "  \"method\": \"POST/PUT/PATCH\",  // HTTP方法（默认POST）\n" +
                "  \"headers\": {  // 自定义请求头\n" +
                "    \"Authorization\": \"Bearer token\",\n" +
                "    \"X-Custom-Header\": \"value\"\n" +
                "  },\n" +
                "  \"template\": \"自定义JSON模板\",  // 可选，使用变量占位符\n" +
                "  \"format\": \"standard/slack/discord/custom\",  // 消息格式\n" +
                "  \"timeout\": 30  // 超时时间（秒）\n" +
                "}";
    }

    @Override
    public boolean supportsBatchSending() {
        return false;
    }

    @Override
    public int getRateLimitPerMinute() {
        return 20; // 每分钟最多发送20个Webhook请求
    }

    @Override
    public boolean requiresAuthentication() {
        return false; // Webhook可以不需要认证
    }

    /**
     * 构建请求体
     */
    private Map<String, Object> buildRequestBody(AlertNotificationRequest request, Map<String, Object> config) {
        String format = (String) config.getOrDefault("format", "standard");
        String customTemplate = (String) config.get("template");

        if (StringUtils.isNotBlank(customTemplate)) {
            return buildCustomRequestBody(request, customTemplate);
        }

        switch (format.toLowerCase()) {
            case "slack":
                return buildSlackRequestBody(request);
            case "discord":
                return buildDiscordRequestBody(request);
            case "custom":
                return buildCustomRequestBody(request, customTemplate);
            default:
                return buildStandardRequestBody(request);
        }
    }

    /**
     * 构建标准请求体
     */
    private Map<String, Object> buildStandardRequestBody(AlertNotificationRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("type", "alert");
        body.put("serverId", request.getServerId());
        body.put("serverName", request.getServerName());
        body.put("serverHost", request.getServerHost());
        body.put("alertType", request.getAlertType() != null ? request.getAlertType().getCode() : null);
        body.put("alertLevel", request.getAlertLevel() != null ? request.getAlertLevel().getCode() : null);
        body.put("title", request.getTitle());
        body.put("message", request.getMessage());
        body.put("currentValue", request.getCurrentValue());
        body.put("thresholdValue", request.getThresholdValue());
        body.put("unit", request.getUnit());
        body.put("isRecovery", request.getIsRecovery());
        body.put("alertTime", request.getAlertTime() != null ? request.getAlertTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null);
        body.put("fingerprint", request.getFingerprint());
        
        if (request.getExtraProperties() != null) {
            body.put("extraProperties", request.getExtraProperties());
        }
        
        return body;
    }

    /**
     * 构建Slack格式请求体
     */
    private Map<String, Object> buildSlackRequestBody(AlertNotificationRequest request) {
        Map<String, Object> body = new HashMap<>();
        
        // Slack消息格式
        String color = request.getAlertColor();
        String emoji = Boolean.TRUE.equals(request.getIsRecovery()) ? ":white_check_mark:" : ":warning:";
        
        body.put("text", emoji + " " + request.getShortMessage());
        
        Map<String, Object> attachment = new HashMap<>();
        attachment.put("color", color);
        attachment.put("title", request.getTitle());
        attachment.put("text", request.getMessage());
        attachment.put("timestamp", System.currentTimeMillis() / 1000);
        
        // 添加字段
        Map<String, Object>[] fields = new Map[4];
        fields[0] = Map.of("title", "服务器", "value", request.getServerName() != null ? request.getServerName() : "未知", "short", true);
        fields[1] = Map.of("title", "主机", "value", request.getServerHost() != null ? request.getServerHost() : "未知", "short", true);
        fields[2] = Map.of("title", "类型", "value", request.getAlertType() != null ? request.getAlertType().getDescription() : "未知", "short", true);
        if (request.getCurrentValue() != null) {
            String value = request.getCurrentValue() + (request.getUnit() != null ? request.getUnit() : "");
            fields[3] = Map.of("title", "当前值", "value", value, "short", true);
        }
        
        attachment.put("fields", fields);
        body.put("attachments", new Object[]{attachment});
        
        return body;
    }

    /**
     * 构建Discord格式请求体
     */
    private Map<String, Object> buildDiscordRequestBody(AlertNotificationRequest request) {
        Map<String, Object> body = new HashMap<>();
        
        // Discord消息格式
        String emoji = Boolean.TRUE.equals(request.getIsRecovery()) ? "✅" : "⚠️";
        body.put("content", emoji + " " + request.getShortMessage());
        
        Map<String, Object> embed = new HashMap<>();
        embed.put("title", request.getTitle());
        embed.put("description", request.getMessage());
        embed.put("color", Integer.parseInt(request.getAlertColor().substring(1), 16)); // 转换为十进制
        embed.put("timestamp", request.getAlertTime() != null ? request.getAlertTime().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME) + "Z" : null);
        
        // 添加字段
        Map<String, Object>[] fields = new Map[3];
        fields[0] = Map.of("name", "服务器", "value", request.getServerName() != null ? request.getServerName() : "未知", "inline", true);
        fields[1] = Map.of("name", "主机", "value", request.getServerHost() != null ? request.getServerHost() : "未知", "inline", true);
        fields[2] = Map.of("name", "类型", "value", request.getAlertType() != null ? request.getAlertType().getDescription() : "未知", "inline", true);
        
        embed.put("fields", fields);
        body.put("embeds", new Object[]{embed});
        
        return body;
    }

    /**
     * 构建自定义请求体
     */
    private Map<String, Object> buildCustomRequestBody(AlertNotificationRequest request, String template) {
        try {
            if (StringUtils.isBlank(template)) {
                return buildStandardRequestBody(request);
            }

            // 替换模板中的变量
            String processedTemplate = template
                    .replace("${serverName}", request.getServerName() != null ? request.getServerName() : "")
                    .replace("${serverHost}", request.getServerHost() != null ? request.getServerHost() : "")
                    .replace("${alertType}", request.getAlertType() != null ? request.getAlertType().getDescription() : "")
                    .replace("${alertLevel}", request.getAlertLevel() != null ? request.getAlertLevel().getDescription() : "")
                    .replace("${title}", request.getTitle() != null ? request.getTitle() : "")
                    .replace("${message}", request.getMessage() != null ? request.getMessage() : "")
                    .replace("${currentValue}", request.getCurrentValue() != null ? request.getCurrentValue().toString() : "")
                    .replace("${thresholdValue}", request.getThresholdValue() != null ? request.getThresholdValue().toString() : "")
                    .replace("${unit}", request.getUnit() != null ? request.getUnit() : "")
                    .replace("${isRecovery}", Boolean.TRUE.equals(request.getIsRecovery()) ? "true" : "false")
                    .replace("${alertTime}", request.getAlertTime() != null ? request.getAlertTime().toString() : "");

            return objectMapper.readValue(processedTemplate, new TypeReference<Map<String, Object>>() {});

        } catch (Exception e) {
            log.warn("处理自定义模板失败，使用标准格式: {}", template, e);
            return buildStandardRequestBody(request);
        }
    }

    /**
     * 构建请求头
     */
    private HttpHeaders buildHeaders(Map<String, Object> config) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        // 添加自定义请求头
        @SuppressWarnings("unchecked")
        Map<String, String> customHeaders = (Map<String, String>) config.get("headers");
        if (customHeaders != null) {
            customHeaders.forEach(headers::set);
        }

        return headers;
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
            log.warn("解析Webhook配置参数失败: {}", configJson, e);
            return Map.of();
        }
    }

    /**
     * 验证URL格式
     */
    private boolean isValidUrl(String url) {
        if (StringUtils.isBlank(url)) {
            return false;
        }
        return url.matches("^https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w\\-\\.,@?^=%&:/~\\+#]*[\\w\\-\\@?^=%&/~\\+#])?$");
    }
}
