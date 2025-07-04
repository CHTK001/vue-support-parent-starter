-- 创建服务器组件配置表
CREATE TABLE IF NOT EXISTS `monitor_sys_gen_server_component` (
    `monitor_sys_gen_server_component_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '组件配置ID',
    `monitor_sys_gen_server_id` int(11) NOT NULL COMMENT '关联服务器ID',
    `monitor_sys_gen_server_component_name` varchar(100) NOT NULL COMMENT '组件名称',
    `monitor_sys_gen_server_component_type` varchar(50) NOT NULL COMMENT '组件类型 (cpu, memory, disk, network, system)',
    `monitor_sys_gen_server_component_config` text COMMENT '组件配置 (JSON格式)',
    `monitor_sys_gen_server_component_position` varchar(500) COMMENT '组件位置信息 (JSON格式: {x, y, w, h, i})',
    `monitor_sys_gen_server_component_shared` tinyint(1) DEFAULT '0' COMMENT '是否共享 0:否 1:是',
    `monitor_sys_gen_server_component_source_server_id` int(11) DEFAULT NULL COMMENT '共享来源服务器ID (当组件为共享组件时)',
    `monitor_sys_gen_server_component_refresh_interval` int(11) DEFAULT '5' COMMENT '刷新间隔 (秒)',
    `monitor_sys_gen_server_component_status` tinyint(1) DEFAULT '1' COMMENT '组件状态 0:停用 1:启用',
    `monitor_sys_gen_server_component_description` varchar(500) COMMENT '组件描述',
    `monitor_sys_gen_server_component_fixed` tinyint(1) DEFAULT '0' COMMENT '是否为固定组件 0:否 1:是 (固定组件不能删除)',
    `monitor_sys_gen_server_component_sort` int(11) DEFAULT '0' COMMENT '组件排序',
    `create_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_by` varchar(50) DEFAULT NULL COMMENT '创建人',
    `update_by` varchar(50) DEFAULT NULL COMMENT '更新人',
    PRIMARY KEY (`monitor_sys_gen_server_component_id`),
    KEY `idx_server_id` (`monitor_sys_gen_server_id`),
    KEY `idx_component_type` (`monitor_sys_gen_server_component_type`),
    KEY `idx_shared` (`monitor_sys_gen_server_component_shared`),
    KEY `idx_source_server_id` (`monitor_sys_gen_server_component_source_server_id`),
    KEY `idx_status` (`monitor_sys_gen_server_component_status`),
    KEY `idx_fixed` (`monitor_sys_gen_server_component_fixed`),
    KEY `idx_sort` (`monitor_sys_gen_server_component_sort`),
    CONSTRAINT `fk_server_component_server_id` FOREIGN KEY (`monitor_sys_gen_server_id`) REFERENCES `monitor_sys_gen_server` (`monitor_sys_gen_server_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务器组件配置表';

-- 插入默认的固定组件模板数据（可选，也可以通过代码初始化）
-- 这些数据可以作为组件模板，在创建新服务器时自动复制
