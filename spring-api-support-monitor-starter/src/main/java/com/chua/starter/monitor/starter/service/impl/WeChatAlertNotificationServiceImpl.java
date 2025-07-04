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
import java.util.*;

/**
 * 微信告警通知服务实现类
 * 支持企业微信群机器人和微信公众号模板消息
 *
 * @author CH
 * @since 2024/12/27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WeChatAlertNotificationServiceImpl implements AlertNotificationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String getNotificationType() {
        return "WECHAT";
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
            String wechatType = (String) config.getOrDefault("type", "work");

            // 根据微信类型发送消息
            switch (wechatType.toLowerCase()) {
                case "work":
                    return sendWorkWeChatMessage(request, setting, config);
                case "public":
                    return sendPublicWeChatMessage(request, setting, config);
                default:
                    return ReturnResult.error("不支持的微信类型: " + wechatType);
            }

        } catch (Exception e) {
            log.error("发送微信告警失败", e);
            return ReturnResult.error("发送微信消息失败: " + e.getMessage());
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
                    .message("这是一条测试微信告警消息。")
                    .alertTime(java.time.LocalDateTime.now())
                    .isRecovery(false)
                    .build();

            return sendNotification(testRequest, setting);

        } catch (Exception e) {
            log.error("测试微信通知失败", e);
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateConfiguration(MonitorSysGenServerAlertSetting setting) {
        try {
            // 检查Webhook URL
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingAddress())) {
                return ReturnResult.error("微信Webhook URL不能为空");
            }

            // 解析配置参数
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingConfig())) {
                return ReturnResult.error("微信配置参数不能为空");
            }

            Map<String, Object> config = parseConfig(setting.getMonitorSysGenServerAlertSettingConfig());
            String wechatType = (String) config.get("type");
            if (StringUtils.isBlank(wechatType)) {
                return ReturnResult.error("微信类型不能为空");
            }

            // 根据类型验证配置
            switch (wechatType.toLowerCase()) {
                case "work":
                    return validateWorkWeChatConfig(setting, config);
                case "public":
                    return validatePublicWeChatConfig(config);
                default:
                    return ReturnResult.error("不支持的微信类型: " + wechatType);
            }

        } catch (Exception e) {
            log.error("验证微信配置失败", e);
            return ReturnResult.error("配置验证失败: " + e.getMessage());
        }
    }

    @Override
    public String getConfigurationDescription() {
        return "微信通知配置说明：\n" +
                "{\n" +
                "  \"type\": \"work/public\",  // 微信类型：work=企业微信，public=公众号\n" +
                "  \"messageType\": \"text/markdown\",  // 消息类型（企业微信）\n" +
                "  \"mentionedList\": [\"@all\"],  // @成员列表（企业微信）\n" +
                "  \"mentionedMobileList\": [\"13800138000\"],  // @手机号列表（企业微信）\n" +
                "  \"appId\": \"微信公众号AppId\",  // 公众号配置\n" +
                "  \"appSecret\": \"微信公众号AppSecret\",\n" +
                "  \"templateId\": \"模板消息ID\",\n" +
                "  \"openId\": \"接收者OpenId\"\n" +
                "}";
    }

    @Override
    public boolean supportsBatchSending() {
        return false;
    }

    @Override
    public int getRateLimitPerMinute() {
        return 20; // 微信机器人每分钟最多发送20条消息
    }

    /**
     * 发送企业微信消息
     */
    private ReturnResult<Boolean> sendWorkWeChatMessage(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting, Map<String, Object> config) {
        try {
            // 构建企业微信消息
            Map<String, Object> requestBody = buildWorkWeChatMessage(request, config);
            
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送企业微信消息
            String webhookUrl = setting.getMonitorSysGenServerAlertSettingAddress();
            ResponseEntity<String> response = restTemplate.exchange(
                    webhookUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("企业微信告警发送成功: URL={}", webhookUrl);
                return ReturnResult.ok(true, "企业微信消息发送成功");
            } else {
                log.warn("企业微信告警发送失败: 状态码={}, 响应={}", response.getStatusCode(), response.getBody());
                return ReturnResult.error("企业微信消息发送失败: HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("发送企业微信告警失败", e);
            return ReturnResult.error("发送企业微信消息失败: " + e.getMessage());
        }
    }

    /**
     * 发送微信公众号模板消息
     */
    private ReturnResult<Boolean> sendPublicWeChatMessage(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting, Map<String, Object> config) {
        try {
            // 获取访问令牌
            String accessToken = getAccessToken(config);
            if (StringUtils.isBlank(accessToken)) {
                return ReturnResult.error("获取微信公众号访问令牌失败");
            }

            // 构建模板消息
            Map<String, Object> requestBody = buildTemplateMessage(request, config);
            
            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送模板消息
            String apiUrl = "https://api.weixin.qq.com/cgi-bin/message/template/send?access_token=" + accessToken;
            ResponseEntity<String> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("微信公众号模板消息发送成功");
                return ReturnResult.ok(true, "微信公众号模板消息发送成功");
            } else {
                log.warn("微信公众号模板消息发送失败: 状态码={}, 响应={}", response.getStatusCode(), response.getBody());
                return ReturnResult.error("微信公众号模板消息发送失败: HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("发送微信公众号模板消息失败", e);
            return ReturnResult.error("发送微信公众号模板消息失败: " + e.getMessage());
        }
    }

    /**
     * 构建企业微信消息
     */
    private Map<String, Object> buildWorkWeChatMessage(AlertNotificationRequest request, Map<String, Object> config) {
        String messageType = (String) config.getOrDefault("messageType", "text");
        
        Map<String, Object> message = new HashMap<>();
        message.put("msgtype", messageType);

        switch (messageType.toLowerCase()) {
            case "markdown":
                message.put("markdown", buildMarkdownMessage(request));
                break;
            default:
                message.put("text", buildTextMessage(request, config));
                break;
        }

        return message;
    }

    /**
     * 构建文本消息
     */
    private Map<String, Object> buildTextMessage(AlertNotificationRequest request, Map<String, Object> config) {
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
        
        // 添加@信息
        @SuppressWarnings("unchecked")
        List<String> mentionedList = (List<String>) config.get("mentionedList");
        if (mentionedList != null && !mentionedList.isEmpty()) {
            text.put("mentioned_list", mentionedList);
        }
        
        @SuppressWarnings("unchecked")
        List<String> mentionedMobileList = (List<String>) config.get("mentionedMobileList");
        if (mentionedMobileList != null && !mentionedMobileList.isEmpty()) {
            text.put("mentioned_mobile_list", mentionedMobileList);
        }
        
        return text;
    }

    /**
     * 构建Markdown消息
     */
    private Map<String, Object> buildMarkdownMessage(AlertNotificationRequest request) {
        Map<String, Object> markdown = new HashMap<>();
        
        StringBuilder content = new StringBuilder();
        
        if (Boolean.TRUE.equals(request.getIsRecovery())) {
            content.append("## ✅ 告警恢复通知\n\n");
        } else {
            content.append("## 🚨 系统告警通知\n\n");
        }
        
        content.append("**服务器:** ").append(request.getServerName() != null ? request.getServerName() : "未知").append("\n");
        content.append("**主机:** ").append(request.getServerHost() != null ? request.getServerHost() : "未知").append("\n");
        content.append("**类型:** ").append(request.getAlertType() != null ? request.getAlertType().getDescription() : "未知").append("\n");
        
        if (request.getCurrentValue() != null) {
            content.append("**当前值:** ").append(request.getCurrentValue());
            if (request.getUnit() != null) {
                content.append(request.getUnit());
            }
            content.append("\n");
        }
        
        if (request.getThresholdValue() != null && !Boolean.TRUE.equals(request.getIsRecovery())) {
            content.append("**阈值:** ").append(request.getThresholdValue());
            if (request.getUnit() != null) {
                content.append(request.getUnit());
            }
            content.append("\n");
        }
        
        if (request.getMessage() != null) {
            content.append("**详情:** ").append(request.getMessage()).append("\n");
        }
        
        content.append("**时间:** ").append(request.getAlertTime() != null ? 
                request.getAlertTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : 
                java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")));
        
        markdown.put("content", content.toString());
        return markdown;
    }

    /**
     * 构建模板消息
     */
    private Map<String, Object> buildTemplateMessage(AlertNotificationRequest request, Map<String, Object> config) {
        Map<String, Object> message = new HashMap<>();
        message.put("touser", config.get("openId"));
        message.put("template_id", config.get("templateId"));
        
        // 构建模板数据
        Map<String, Object> data = new HashMap<>();
        data.put("first", Map.of("value", Boolean.TRUE.equals(request.getIsRecovery()) ? "告警恢复通知" : "系统告警通知"));
        data.put("keyword1", Map.of("value", request.getServerName() != null ? request.getServerName() : "未知"));
        data.put("keyword2", Map.of("value", request.getAlertType() != null ? request.getAlertType().getDescription() : "未知"));
        data.put("keyword3", Map.of("value", request.getAlertTime() != null ? 
                request.getAlertTime().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) : 
                java.time.LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"))));
        data.put("remark", Map.of("value", request.getMessage() != null ? request.getMessage() : ""));
        
        message.put("data", data);
        
        return message;
    }

    /**
     * 获取微信公众号访问令牌
     */
    private String getAccessToken(Map<String, Object> config) {
        try {
            String appId = (String) config.get("appId");
            String appSecret = (String) config.get("appSecret");
            
            String url = String.format("https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=%s&secret=%s", 
                    appId, appSecret);
            
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = objectMapper.readValue(response.getBody(), Map.class);
                return (String) result.get("access_token");
            }
            
            return null;
            
        } catch (Exception e) {
            log.error("获取微信公众号访问令牌失败", e);
            return null;
        }
    }

    /**
     * 验证企业微信配置
     */
    private ReturnResult<Boolean> validateWorkWeChatConfig(MonitorSysGenServerAlertSetting setting, Map<String, Object> config) {
        String url = setting.getMonitorSysGenServerAlertSettingAddress();
        if (!url.contains("qyapi.weixin.qq.com") || !url.contains("webhook/send")) {
            return ReturnResult.error("企业微信Webhook URL格式不正确");
        }
        return ReturnResult.ok(true, "企业微信配置验证通过");
    }

    /**
     * 验证微信公众号配置
     */
    private ReturnResult<Boolean> validatePublicWeChatConfig(Map<String, Object> config) {
        if (StringUtils.isBlank((String) config.get("appId"))) {
            return ReturnResult.error("微信公众号AppId不能为空");
        }
        if (StringUtils.isBlank((String) config.get("appSecret"))) {
            return ReturnResult.error("微信公众号AppSecret不能为空");
        }
        if (StringUtils.isBlank((String) config.get("templateId"))) {
            return ReturnResult.error("微信公众号模板ID不能为空");
        }
        if (StringUtils.isBlank((String) config.get("openId"))) {
            return ReturnResult.error("微信公众号接收者OpenId不能为空");
        }
        return ReturnResult.ok(true, "微信公众号配置验证通过");
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
            log.warn("解析微信配置参数失败: {}", configJson, e);
            return Map.of();
        }
    }
}
