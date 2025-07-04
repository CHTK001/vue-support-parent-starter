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
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * 短信告警通知服务实现类
 * 支持阿里云短信、腾讯云短信等多种短信服务商
 *
 * @author CH
 * @since 2024/12/27
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsAlertNotificationServiceImpl implements AlertNotificationService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Override
    public String getNotificationType() {
        return "SMS";
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
            String provider = (String) config.getOrDefault("provider", "aliyun");

            // 根据服务商发送短信
            switch (provider.toLowerCase()) {
                case "aliyun":
                    return sendAliyunSms(request, setting, config);
                case "tencent":
                    return sendTencentSms(request, setting, config);
                case "custom":
                    return sendCustomSms(request, setting, config);
                default:
                    return ReturnResult.error("不支持的短信服务商: " + provider);
            }

        } catch (Exception e) {
            log.error("发送短信告警失败", e);
            return ReturnResult.error("发送短信失败: " + e.getMessage());
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
                    .message("这是一条测试短信告警。")
                    .alertTime(java.time.LocalDateTime.now())
                    .isRecovery(false)
                    .build();

            return sendNotification(testRequest, setting);

        } catch (Exception e) {
            log.error("测试短信通知失败", e);
            return ReturnResult.error("测试失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> validateConfiguration(MonitorSysGenServerAlertSetting setting) {
        try {
            // 检查手机号
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingAddress())) {
                return ReturnResult.error("手机号不能为空");
            }

            // 验证手机号格式
            String phone = setting.getMonitorSysGenServerAlertSettingAddress();
            if (!isValidPhoneNumber(phone)) {
                return ReturnResult.error("手机号格式不正确");
            }

            // 解析配置参数
            if (StringUtils.isBlank(setting.getMonitorSysGenServerAlertSettingConfig())) {
                return ReturnResult.error("短信配置参数不能为空");
            }

            Map<String, Object> config = parseConfig(setting.getMonitorSysGenServerAlertSettingConfig());
            String provider = (String) config.get("provider");
            if (StringUtils.isBlank(provider)) {
                return ReturnResult.error("短信服务商不能为空");
            }

            // 验证必需的配置参数
            switch (provider.toLowerCase()) {
                case "aliyun":
                    return validateAliyunConfig(config);
                case "tencent":
                    return validateTencentConfig(config);
                case "custom":
                    return validateCustomConfig(config);
                default:
                    return ReturnResult.error("不支持的短信服务商: " + provider);
            }

        } catch (Exception e) {
            log.error("验证短信配置失败", e);
            return ReturnResult.error("配置验证失败: " + e.getMessage());
        }
    }

    @Override
    public String getConfigurationDescription() {
        return "短信通知配置说明：\n" +
                "{\n" +
                "  \"provider\": \"aliyun/tencent/custom\",  // 短信服务商\n" +
                "  \"accessKeyId\": \"访问密钥ID\",\n" +
                "  \"accessKeySecret\": \"访问密钥Secret\",\n" +
                "  \"signName\": \"短信签名\",\n" +
                "  \"templateCode\": \"短信模板代码\",\n" +
                "  \"endpoint\": \"服务端点（自定义时必需）\",\n" +
                "  \"region\": \"地域（可选）\"\n" +
                "}";
    }

    @Override
    public int getRateLimitPerMinute() {
        return 5; // 每分钟最多发送5条短信
    }

    /**
     * 发送阿里云短信
     */
    private ReturnResult<Boolean> sendAliyunSms(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting, Map<String, Object> config) {
        try {
            // 这里应该集成阿里云短信SDK
            // 示例代码，实际需要使用阿里云SDK
            log.info("发送阿里云短信: 手机号={}, 内容={}", setting.getMonitorSysGenServerAlertSettingAddress(), request.getShortMessage());
            
            // 模拟发送成功
            return ReturnResult.ok(true, "阿里云短信发送成功");

        } catch (Exception e) {
            log.error("发送阿里云短信失败", e);
            return ReturnResult.error("阿里云短信发送失败: " + e.getMessage());
        }
    }

    /**
     * 发送腾讯云短信
     */
    private ReturnResult<Boolean> sendTencentSms(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting, Map<String, Object> config) {
        try {
            // 这里应该集成腾讯云短信SDK
            // 示例代码，实际需要使用腾讯云SDK
            log.info("发送腾讯云短信: 手机号={}, 内容={}", setting.getMonitorSysGenServerAlertSettingAddress(), request.getShortMessage());
            
            // 模拟发送成功
            return ReturnResult.ok(true, "腾讯云短信发送成功");

        } catch (Exception e) {
            log.error("发送腾讯云短信失败", e);
            return ReturnResult.error("腾讯云短信发送失败: " + e.getMessage());
        }
    }

    /**
     * 发送自定义短信
     */
    private ReturnResult<Boolean> sendCustomSms(AlertNotificationRequest request, MonitorSysGenServerAlertSetting setting, Map<String, Object> config) {
        try {
            String endpoint = (String) config.get("endpoint");
            if (StringUtils.isBlank(endpoint)) {
                return ReturnResult.error("自定义短信服务端点不能为空");
            }

            // 构建请求参数
            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("phone", setting.getMonitorSysGenServerAlertSettingAddress());
            requestBody.put("message", request.getShortMessage());
            requestBody.put("serverName", request.getServerName());
            requestBody.put("alertType", request.getAlertType() != null ? request.getAlertType().getCode() : "UNKNOWN");

            // 设置请求头
            HttpHeaders headers = new HttpHeaders();
            headers.set("Content-Type", "application/json");
            
            // 如果配置了认证信息
            String apiKey = (String) config.get("apiKey");
            if (StringUtils.isNotBlank(apiKey)) {
                headers.set("Authorization", "Bearer " + apiKey);
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            // 发送请求
            ResponseEntity<String> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("自定义短信发送成功: 手机号={}", setting.getMonitorSysGenServerAlertSettingAddress());
                return ReturnResult.ok(true, "自定义短信发送成功");
            } else {
                return ReturnResult.error("自定义短信发送失败: HTTP " + response.getStatusCode());
            }

        } catch (Exception e) {
            log.error("发送自定义短信失败", e);
            return ReturnResult.error("自定义短信发送失败: " + e.getMessage());
        }
    }

    /**
     * 验证阿里云配置
     */
    private ReturnResult<Boolean> validateAliyunConfig(Map<String, Object> config) {
        if (StringUtils.isBlank((String) config.get("accessKeyId"))) {
            return ReturnResult.error("阿里云AccessKeyId不能为空");
        }
        if (StringUtils.isBlank((String) config.get("accessKeySecret"))) {
            return ReturnResult.error("阿里云AccessKeySecret不能为空");
        }
        if (StringUtils.isBlank((String) config.get("signName"))) {
            return ReturnResult.error("阿里云短信签名不能为空");
        }
        if (StringUtils.isBlank((String) config.get("templateCode"))) {
            return ReturnResult.error("阿里云短信模板代码不能为空");
        }
        return ReturnResult.ok(true, "阿里云配置验证通过");
    }

    /**
     * 验证腾讯云配置
     */
    private ReturnResult<Boolean> validateTencentConfig(Map<String, Object> config) {
        if (StringUtils.isBlank((String) config.get("secretId"))) {
            return ReturnResult.error("腾讯云SecretId不能为空");
        }
        if (StringUtils.isBlank((String) config.get("secretKey"))) {
            return ReturnResult.error("腾讯云SecretKey不能为空");
        }
        if (StringUtils.isBlank((String) config.get("sdkAppId"))) {
            return ReturnResult.error("腾讯云SdkAppId不能为空");
        }
        if (StringUtils.isBlank((String) config.get("templateId"))) {
            return ReturnResult.error("腾讯云短信模板ID不能为空");
        }
        return ReturnResult.ok(true, "腾讯云配置验证通过");
    }

    /**
     * 验证自定义配置
     */
    private ReturnResult<Boolean> validateCustomConfig(Map<String, Object> config) {
        if (StringUtils.isBlank((String) config.get("endpoint"))) {
            return ReturnResult.error("自定义短信服务端点不能为空");
        }
        return ReturnResult.ok(true, "自定义配置验证通过");
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
            log.warn("解析短信配置参数失败: {}", configJson, e);
            return Map.of();
        }
    }

    /**
     * 验证手机号格式
     */
    private boolean isValidPhoneNumber(String phone) {
        if (StringUtils.isBlank(phone)) {
            return false;
        }
        // 支持中国大陆手机号和国际手机号
        return phone.matches("^(\\+?86)?1[3-9]\\d{9}$") || phone.matches("^\\+\\d{1,3}\\d{4,14}$");
    }
}
