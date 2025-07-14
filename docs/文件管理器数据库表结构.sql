-- 文件管理器数据库表结构

-- 1. 文件系统主表
CREATE TABLE `monitor_sys_gen_file_system` (
  `monitor_sys_gen_file_system_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '文件系统ID',
  `monitor_sys_gen_file_system_name` varchar(255) NOT NULL COMMENT '文件名称',
  `monitor_sys_gen_file_system_original_name` varchar(255) NOT NULL COMMENT '文件原始名称',
  `monitor_sys_gen_file_system_path` varchar(500) NOT NULL COMMENT '文件路径',
  `monitor_sys_gen_file_system_size` bigint(20) NOT NULL DEFAULT '0' COMMENT '文件大小(字节)',
  `monitor_sys_gen_file_system_md5` varchar(32) NOT NULL COMMENT '文件MD5',
  `monitor_sys_gen_file_system_type` varchar(100) DEFAULT NULL COMMENT '文件类型',
  `monitor_sys_gen_file_system_extension` varchar(20) DEFAULT NULL COMMENT '文件扩展名',
  `monitor_sys_gen_file_system_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '文件状态 0:待合并 1:正常 2:合并失败 3:已删除',
  `monitor_sys_gen_file_system_is_chunk` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否分片上传 0:否 1:是',
  `monitor_sys_gen_file_system_chunk_total` int(11) DEFAULT '0' COMMENT '分片总数',
  `monitor_sys_gen_file_system_chunk_uploaded` int(11) DEFAULT '0' COMMENT '已上传分片数',
  `monitor_sys_gen_file_system_description` text COMMENT '文件描述',
  `monitor_sys_gen_file_system_upload_user` varchar(100) DEFAULT NULL COMMENT '上传用户',
  `monitor_sys_gen_file_system_download_count` int(11) DEFAULT '0' COMMENT '下载次数',
  `monitor_sys_gen_file_system_last_download_time` datetime DEFAULT NULL COMMENT '最后下载时间',
  `monitor_sys_gen_file_system_http_access` tinyint(4) DEFAULT '0' COMMENT '是否允许HTTP访问 0:否 1:是',
  `monitor_sys_gen_file_system_http_url` varchar(500) DEFAULT NULL COMMENT 'HTTP访问URL',
  `monitor_sys_gen_file_system_remark` text COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`monitor_sys_gen_file_system_id`),
  UNIQUE KEY `uk_file_md5` (`monitor_sys_gen_file_system_md5`),
  KEY `idx_file_status` (`monitor_sys_gen_file_system_status`),
  KEY `idx_file_type` (`monitor_sys_gen_file_system_type`),
  KEY `idx_upload_user` (`monitor_sys_gen_file_system_upload_user`),
  KEY `idx_create_time` (`create_time`),
  KEY `idx_chunk_status` (`monitor_sys_gen_file_system_is_chunk`, `monitor_sys_gen_file_system_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件系统管理表';

-- 2. 文件分片表
CREATE TABLE `monitor_sys_gen_file_system_part` (
  `monitor_sys_gen_file_system_part_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '分片ID',
  `monitor_sys_gen_file_system_id` int(11) NOT NULL COMMENT '文件系统ID',
  `monitor_sys_gen_file_system_part_index` int(11) NOT NULL COMMENT '分片序号(从1开始)',
  `monitor_sys_gen_file_system_part_size` bigint(20) NOT NULL DEFAULT '0' COMMENT '分片大小(字节)',
  `monitor_sys_gen_file_system_part_md5` varchar(32) DEFAULT NULL COMMENT '分片MD5',
  `monitor_sys_gen_file_system_part_path` varchar(500) DEFAULT NULL COMMENT '分片文件路径',
  `monitor_sys_gen_file_system_part_status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '分片状态 0:待上传 1:处理中 2:已完成 3:上传失败',
  `monitor_sys_gen_file_system_part_start_time` datetime DEFAULT NULL COMMENT '上传开始时间',
  `monitor_sys_gen_file_system_part_end_time` datetime DEFAULT NULL COMMENT '上传完成时间',
  `monitor_sys_gen_file_system_part_error_msg` text COMMENT '错误信息',
  `monitor_sys_gen_file_system_part_retry_count` int(11) DEFAULT '0' COMMENT '重试次数',
  `monitor_sys_gen_file_system_part_remark` text COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`monitor_sys_gen_file_system_part_id`),
  UNIQUE KEY `uk_file_part` (`monitor_sys_gen_file_system_id`, `monitor_sys_gen_file_system_part_index`),
  KEY `idx_file_id` (`monitor_sys_gen_file_system_id`),
  KEY `idx_part_status` (`monitor_sys_gen_file_system_part_status`),
  KEY `idx_retry_count` (`monitor_sys_gen_file_system_part_retry_count`),
  CONSTRAINT `fk_file_part_file_id` FOREIGN KEY (`monitor_sys_gen_file_system_id`) REFERENCES `monitor_sys_gen_file_system` (`monitor_sys_gen_file_system_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件系统分片管理表';

-- 3. 文件系统配置表
CREATE TABLE `monitor_sys_gen_file_system_setting` (
  `monitor_sys_gen_file_system_setting_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `monitor_sys_gen_file_system_setting_key` varchar(100) NOT NULL COMMENT '配置键',
  `monitor_sys_gen_file_system_setting_value` text COMMENT '配置值',
  `monitor_sys_gen_file_system_setting_type` varchar(20) NOT NULL DEFAULT 'string' COMMENT '配置类型 string/number/boolean/json',
  `monitor_sys_gen_file_system_setting_name` varchar(100) NOT NULL COMMENT '配置名称',
  `monitor_sys_gen_file_system_setting_description` text COMMENT '配置描述',
  `monitor_sys_gen_file_system_setting_group` varchar(50) DEFAULT 'default' COMMENT '配置分组',
  `monitor_sys_gen_file_system_setting_status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '是否启用 0:禁用 1:启用',
  `monitor_sys_gen_file_system_setting_sort` int(11) DEFAULT '0' COMMENT '排序号',
  `monitor_sys_gen_file_system_setting_default_value` text COMMENT '默认值',
  `monitor_sys_gen_file_system_setting_required` tinyint(4) DEFAULT '0' COMMENT '是否必填 0:否 1:是',
  `monitor_sys_gen_file_system_setting_validation` text COMMENT '验证规则',
  `monitor_sys_gen_file_system_setting_remark` text COMMENT '备注',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`monitor_sys_gen_file_system_setting_id`),
  UNIQUE KEY `uk_setting_key` (`monitor_sys_gen_file_system_setting_key`),
  KEY `idx_setting_group` (`monitor_sys_gen_file_system_setting_group`),
  KEY `idx_setting_status` (`monitor_sys_gen_file_system_setting_status`),
  KEY `idx_setting_sort` (`monitor_sys_gen_file_system_setting_sort`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件系统配置管理表';

-- 插入默认配置数据
INSERT INTO `monitor_sys_gen_file_system_setting` 
(`monitor_sys_gen_file_system_setting_key`, `monitor_sys_gen_file_system_setting_value`, `monitor_sys_gen_file_system_setting_type`, 
 `monitor_sys_gen_file_system_setting_name`, `monitor_sys_gen_file_system_setting_description`, `monitor_sys_gen_file_system_setting_group`, 
 `monitor_sys_gen_file_system_setting_sort`, `monitor_sys_gen_file_system_setting_default_value`, `monitor_sys_gen_file_system_setting_required`) 
VALUES 
-- 合并任务配置
('merge_task_count', '1', 'number', '合并任务数量', '同时运行的文件合并任务数量', 'merge', 1, '1', 1),
('manual_merge_enabled', 'true', 'boolean', '手动合并开关', '是否开启手动合并功能', 'merge', 2, 'true', 1),
('merge_retry_count', '3', 'number', '合并重试次数', '合并失败时的最大重试次数', 'merge', 3, '3', 1),
('merge_timeout', '300', 'number', '合并超时时间', '单个文件合并的超时时间(秒)', 'merge', 4, '300', 1),

-- 分片上传配置
('chunk_upload_enabled', 'true', 'boolean', '分片上传开关', '是否开启分片上传功能', 'upload', 1, 'true', 1),
('chunk_size', '5242880', 'number', '分片大小', '单个分片的大小(字节)，默认5MB', 'upload', 2, '5242880', 1),
('max_file_size', '1073741824', 'number', '最大文件大小', '允许上传的最大文件大小(字节)，默认1GB', 'upload', 3, '1073741824', 1),
('upload_timeout', '60', 'number', '上传超时时间', '单个分片上传的超时时间(秒)', 'upload', 4, '60', 1),

-- 文件类型配置
('file_type_whitelist', '["jpg","jpeg","png","gif","bmp","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","zip","rar","7z","mp4","avi","mov"]', 'json', '文件类型白名单', '允许上传的文件类型列表', 'security', 1, '["jpg","jpeg","png","gif","bmp","pdf","doc","docx","xls","xlsx","ppt","pptx","txt","zip","rar","7z","mp4","avi","mov"]', 1),
('file_download_enabled', 'true', 'boolean', '文件下载开关', '是否开启文件下载功能', 'security', 2, 'true', 1),
('http_access_enabled', 'false', 'boolean', 'HTTP访问开关', '是否开启文件HTTP直接访问功能', 'security', 3, 'false', 1),
('download_auth_required', 'true', 'boolean', '下载认证开关', '下载文件是否需要认证', 'security', 4, 'true', 1),

-- 存储配置
('storage_path', '/data/filesystem', 'string', '存储路径', '文件存储的根路径', 'storage', 1, '/data/filesystem', 1),
('temp_path', '/data/filesystem/temp', 'string', '临时路径', '临时文件存储路径', 'storage', 2, '/data/filesystem/temp', 1),
('auto_clean_enabled', 'true', 'boolean', '自动清理开关', '是否开启过期文件自动清理', 'storage', 3, 'true', 1),
('clean_days', '30', 'number', '清理天数', '文件保留天数，超过则自动清理', 'storage', 4, '30', 1),

-- 性能配置
('concurrent_upload_limit', '10', 'number', '并发上传限制', '同时进行的上传任务数量限制', 'performance', 1, '10', 1),
('bandwidth_limit', '0', 'number', '带宽限制', '上传下载带宽限制(KB/s)，0表示不限制', 'performance', 2, '0', 0),
('cache_enabled', 'true', 'boolean', '缓存开关', '是否开启文件信息缓存', 'performance', 3, 'true', 1),
('cache_expire_time', '3600', 'number', '缓存过期时间', '缓存过期时间(秒)', 'performance', 4, '3600', 1);
