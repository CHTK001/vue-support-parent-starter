-- 创建服务器代理配置表
CREATE TABLE IF NOT EXISTS `monitor_sys_gen_server_proxy` (
    `monitor_sys_gen_server_proxy_id` INT AUTO_INCREMENT PRIMARY KEY COMMENT '代理ID',
    `monitor_sys_gen_server_proxy_name` VARCHAR(100) NOT NULL COMMENT '代理名称',
    `monitor_sys_gen_server_proxy_type` VARCHAR(20) NOT NULL DEFAULT 'HTTP' COMMENT '代理类型 (HTTP, SOCKS4, SOCKS5)',
    `monitor_sys_gen_server_proxy_host` VARCHAR(255) NOT NULL COMMENT '代理主机地址',
    `monitor_sys_gen_server_proxy_port` INT NOT NULL COMMENT '代理端口',
    `monitor_sys_gen_server_proxy_username` VARCHAR(100) DEFAULT NULL COMMENT '代理用户名',
    `monitor_sys_gen_server_proxy_password` VARCHAR(255) DEFAULT NULL COMMENT '代理密码',
    `monitor_sys_gen_server_proxy_status` TINYINT NOT NULL DEFAULT 1 COMMENT '代理状态 (0-禁用, 1-启用)',
    `monitor_sys_gen_server_proxy_description` TEXT DEFAULT NULL COMMENT '代理描述',
    `monitor_sys_gen_server_proxy_timeout` INT NOT NULL DEFAULT 30000 COMMENT '连接超时时间(毫秒)',
    `monitor_sys_gen_server_proxy_auth_required` TINYINT NOT NULL DEFAULT 0 COMMENT '是否需要认证 (0-否, 1-是)',
    `monitor_sys_gen_server_proxy_tags` VARCHAR(500) DEFAULT NULL COMMENT '代理标签',
    `monitor_sys_gen_server_proxy_last_test_time` BIGINT DEFAULT NULL COMMENT '最后测试时间',
    `monitor_sys_gen_server_proxy_test_result` TINYINT DEFAULT NULL COMMENT '测试结果 (0-失败, 1-成功)',
    `monitor_sys_gen_server_proxy_test_latency` INT DEFAULT NULL COMMENT '测试延迟(毫秒)',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` VARCHAR(100) DEFAULT NULL COMMENT '创建人',
    `update_by` VARCHAR(100) DEFAULT NULL COMMENT '更新人',
    INDEX `idx_proxy_type` (`monitor_sys_gen_server_proxy_type`),
    INDEX `idx_proxy_status` (`monitor_sys_gen_server_proxy_status`),
    INDEX `idx_proxy_host_port` (`monitor_sys_gen_server_proxy_host`, `monitor_sys_gen_server_proxy_port`),
    INDEX `idx_create_time` (`create_time`),
    INDEX `idx_update_time` (`update_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务器代理配置表';

-- 修改服务器表，将代理类型字段改为代理ID字段
ALTER TABLE `monitor_sys_gen_server` 
DROP COLUMN IF EXISTS `monitor_sys_gen_server_proxy_type`,
ADD COLUMN `monitor_sys_gen_server_proxy_id` INT DEFAULT NULL COMMENT '代理配置ID (关联代理配置表)' AFTER `monitor_sys_gen_server_report_enabled`;

-- 添加外键约束（可选，根据需要决定是否启用）
-- ALTER TABLE `monitor_sys_gen_server` 
-- ADD CONSTRAINT `fk_server_proxy` 
-- FOREIGN KEY (`monitor_sys_gen_server_proxy_id`) 
-- REFERENCES `monitor_sys_gen_server_proxy` (`monitor_sys_gen_server_proxy_id`) 
-- ON DELETE SET NULL ON UPDATE CASCADE;

-- 添加索引
ALTER TABLE `monitor_sys_gen_server` 
ADD INDEX `idx_proxy_id` (`monitor_sys_gen_server_proxy_id`);

-- 插入一些示例代理配置
INSERT INTO `monitor_sys_gen_server_proxy` (
    `monitor_sys_gen_server_proxy_name`,
    `monitor_sys_gen_server_proxy_type`,
    `monitor_sys_gen_server_proxy_host`,
    `monitor_sys_gen_server_proxy_port`,
    `monitor_sys_gen_server_proxy_description`,
    `monitor_sys_gen_server_proxy_status`,
    `create_by`,
    `update_by`
) VALUES 
(
    '本地HTTP代理',
    'HTTP',
    '127.0.0.1',
    8080,
    '本地HTTP代理服务器，用于开发测试',
    1,
    'system',
    'system'
),
(
    '公司SOCKS5代理',
    'SOCKS5',
    'proxy.company.com',
    1080,
    '公司内部SOCKS5代理服务器',
    1,
    'system',
    'system'
),
(
    '测试HTTP代理',
    'HTTP',
    'test-proxy.example.com',
    3128,
    '测试环境HTTP代理服务器',
    0,
    'system',
    'system'
);
