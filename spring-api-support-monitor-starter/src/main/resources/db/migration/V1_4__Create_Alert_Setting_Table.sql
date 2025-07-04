-- 创建服务器告警设置表
CREATE TABLE IF NOT EXISTS `monitor_sys_gen_server_alert_setting` (
    `monitor_sys_gen_server_alert_setting_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '告警设置ID',
    `monitor_sys_gen_server_id` INT NOT NULL COMMENT '服务器ID',
    `monitor_sys_gen_server_alert_setting_notification_type` VARCHAR(50) NOT NULL COMMENT '通知方式类型 (EMAIL、SMS、WEBHOOK、DINGTALK、WECHAT等)',
    `monitor_sys_gen_server_alert_setting_name` VARCHAR(100) NOT NULL COMMENT '配置名称',
    `monitor_sys_gen_server_alert_setting_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用 0:否 1:是',
    `monitor_sys_gen_server_alert_setting_address` VARCHAR(500) COMMENT '通知地址 (邮箱地址、手机号、Webhook URL等)',
    `monitor_sys_gen_server_alert_setting_config` TEXT COMMENT '配置参数 (JSON格式，存储各种通知方式的特定配置)',
    `monitor_sys_gen_server_alert_setting_priority` INT DEFAULT 1 COMMENT '优先级 (数字越小优先级越高)',
    `monitor_sys_gen_server_alert_setting_rate_limit` INT DEFAULT 0 COMMENT '发送频率限制 (每分钟最大发送次数，0表示无限制)',
    `monitor_sys_gen_server_alert_setting_batch_enabled` TINYINT(1) DEFAULT 0 COMMENT '是否支持批量发送 0:否 1:是',
    `monitor_sys_gen_server_alert_setting_retry_count` INT DEFAULT 3 COMMENT '重试次数',
    `monitor_sys_gen_server_alert_setting_retry_interval` INT DEFAULT 30 COMMENT '重试间隔 (秒)',
    `monitor_sys_gen_server_alert_setting_timeout` INT DEFAULT 30 COMMENT '超时时间 (秒)',
    `monitor_sys_gen_server_alert_setting_last_test_time` DATETIME COMMENT '最后测试时间',
    `monitor_sys_gen_server_alert_setting_last_test_result` TINYINT(1) COMMENT '最后测试结果 0:失败 1:成功',
    `monitor_sys_gen_server_alert_setting_last_test_error` VARCHAR(1000) COMMENT '最后测试错误信息',
    `monitor_sys_gen_server_alert_setting_remark` VARCHAR(500) COMMENT '备注',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` VARCHAR(100) COMMENT '创建人',
    `update_by` VARCHAR(100) COMMENT '更新人',
    PRIMARY KEY (`monitor_sys_gen_server_alert_setting_id`),
    INDEX `idx_server_id` (`monitor_sys_gen_server_id`),
    INDEX `idx_server_type` (`monitor_sys_gen_server_id`, `monitor_sys_gen_server_alert_setting_notification_type`),
    INDEX `idx_enabled` (`monitor_sys_gen_server_alert_setting_enabled`),
    INDEX `idx_priority` (`monitor_sys_gen_server_alert_setting_priority`),
    UNIQUE KEY `uk_server_type` (`monitor_sys_gen_server_id`, `monitor_sys_gen_server_alert_setting_notification_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务器告警设置表';

-- 插入默认告警设置示例数据
INSERT INTO `monitor_sys_gen_server_alert_setting` (
    `monitor_sys_gen_server_id`,
    `monitor_sys_gen_server_alert_setting_notification_type`,
    `monitor_sys_gen_server_alert_setting_name`,
    `monitor_sys_gen_server_alert_setting_enabled`,
    `monitor_sys_gen_server_alert_setting_address`,
    `monitor_sys_gen_server_alert_setting_config`,
    `monitor_sys_gen_server_alert_setting_priority`,
    `monitor_sys_gen_server_alert_setting_rate_limit`,
    `monitor_sys_gen_server_alert_setting_batch_enabled`,
    `monitor_sys_gen_server_alert_setting_retry_count`,
    `monitor_sys_gen_server_alert_setting_retry_interval`,
    `monitor_sys_gen_server_alert_setting_timeout`,
    `monitor_sys_gen_server_alert_setting_remark`
) VALUES 
-- 邮件通知示例
(1, 'EMAIL', '默认邮件通知', 1, 'admin@example.com', 
 '{"fromEmail":"noreply@example.com","htmlFormat":true,"priority":"HIGH"}', 
 1, 10, 1, 3, 30, 30, '默认邮件告警通知配置'),

-- 短信通知示例（阿里云）
(1, 'SMS', '阿里云短信通知', 0, '13800138000', 
 '{"provider":"aliyun","accessKeyId":"your_access_key","accessKeySecret":"your_access_secret","signName":"监控系统","templateCode":"SMS_123456789","region":"cn-hangzhou"}', 
 2, 5, 0, 2, 60, 15, '阿里云短信告警通知配置'),

-- Webhook通知示例
(1, 'WEBHOOK', '自定义Webhook通知', 0, 'https://your-webhook-url.com/alert', 
 '{"method":"POST","headers":{"Authorization":"Bearer your_token","Content-Type":"application/json"},"format":"standard","timeout":30}', 
 3, 20, 0, 3, 30, 30, '自定义Webhook告警通知配置'),

-- 钉钉通知示例
(1, 'DINGTALK', '钉钉群机器人通知', 0, 'https://oapi.dingtalk.com/robot/send?access_token=your_token', 
 '{"secret":"your_secret","messageType":"markdown","title":"系统告警通知","isAtAll":false,"atMobiles":["13800138000"]}', 
 4, 20, 0, 3, 30, 30, '钉钉群机器人告警通知配置');

-- 为其他服务器创建默认配置（如果存在的话）
INSERT INTO `monitor_sys_gen_server_alert_setting` (
    `monitor_sys_gen_server_id`,
    `monitor_sys_gen_server_alert_setting_notification_type`,
    `monitor_sys_gen_server_alert_setting_name`,
    `monitor_sys_gen_server_alert_setting_enabled`,
    `monitor_sys_gen_server_alert_setting_address`,
    `monitor_sys_gen_server_alert_setting_config`,
    `monitor_sys_gen_server_alert_setting_priority`,
    `monitor_sys_gen_server_alert_setting_rate_limit`,
    `monitor_sys_gen_server_alert_setting_batch_enabled`,
    `monitor_sys_gen_server_alert_setting_retry_count`,
    `monitor_sys_gen_server_alert_setting_retry_interval`,
    `monitor_sys_gen_server_alert_setting_timeout`,
    `monitor_sys_gen_server_alert_setting_remark`
)
SELECT 
    s.monitor_sys_gen_server_id,
    'EMAIL',
    '默认邮件通知',
    1,
    'admin@example.com',
    '{"fromEmail":"noreply@example.com","htmlFormat":true,"priority":"NORMAL"}',
    1,
    10,
    1,
    3,
    30,
    30,
    '系统自动创建的默认邮件告警配置'
FROM monitor_sys_gen_server s
WHERE s.monitor_sys_gen_server_id > 1
  AND NOT EXISTS (
      SELECT 1 FROM monitor_sys_gen_server_alert_setting a 
      WHERE a.monitor_sys_gen_server_id = s.monitor_sys_gen_server_id 
        AND a.monitor_sys_gen_server_alert_setting_notification_type = 'EMAIL'
  );

-- 创建告警设置配置模板表（可选，用于存储预定义的配置模板）
CREATE TABLE IF NOT EXISTS `monitor_sys_gen_alert_setting_template` (
    `monitor_sys_gen_alert_setting_template_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '模板ID',
    `monitor_sys_gen_alert_setting_template_name` VARCHAR(100) NOT NULL COMMENT '模板名称',
    `monitor_sys_gen_alert_setting_template_type` VARCHAR(50) NOT NULL COMMENT '通知类型',
    `monitor_sys_gen_alert_setting_template_config` TEXT COMMENT '模板配置 (JSON格式)',
    `monitor_sys_gen_alert_setting_template_description` VARCHAR(500) COMMENT '模板描述',
    `monitor_sys_gen_alert_setting_template_enabled` TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` VARCHAR(100) COMMENT '创建人',
    `update_by` VARCHAR(100) COMMENT '更新人',
    PRIMARY KEY (`monitor_sys_gen_alert_setting_template_id`),
    INDEX `idx_type` (`monitor_sys_gen_alert_setting_template_type`),
    INDEX `idx_enabled` (`monitor_sys_gen_alert_setting_template_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='告警设置配置模板表';

-- 插入预定义的配置模板
INSERT INTO `monitor_sys_gen_alert_setting_template` (
    `monitor_sys_gen_alert_setting_template_name`,
    `monitor_sys_gen_alert_setting_template_type`,
    `monitor_sys_gen_alert_setting_template_config`,
    `monitor_sys_gen_alert_setting_template_description`
) VALUES 
('标准邮件模板', 'EMAIL', '{"fromEmail":"","htmlFormat":true,"priority":"NORMAL"}', '标准的HTML格式邮件通知模板'),
('简单邮件模板', 'EMAIL', '{"fromEmail":"","htmlFormat":false,"priority":"NORMAL"}', '简单的纯文本邮件通知模板'),
('阿里云短信模板', 'SMS', '{"provider":"aliyun","accessKeyId":"","accessKeySecret":"","signName":"","templateCode":"","region":"cn-hangzhou"}', '阿里云短信服务配置模板'),
('腾讯云短信模板', 'SMS', '{"provider":"tencent","secretId":"","secretKey":"","sdkAppId":"","templateId":"","region":"ap-guangzhou"}', '腾讯云短信服务配置模板'),
('标准Webhook模板', 'WEBHOOK', '{"method":"POST","headers":{"Content-Type":"application/json"},"format":"standard","timeout":30}', '标准的Webhook通知配置模板'),
('Slack格式Webhook模板', 'WEBHOOK', '{"method":"POST","headers":{"Content-Type":"application/json"},"format":"slack","timeout":30}', 'Slack格式的Webhook通知配置模板'),
('钉钉文本消息模板', 'DINGTALK', '{"messageType":"text","isAtAll":false}', '钉钉文本消息通知配置模板'),
('钉钉Markdown消息模板', 'DINGTALK', '{"messageType":"markdown","title":"系统告警通知","isAtAll":false}', '钉钉Markdown消息通知配置模板');
