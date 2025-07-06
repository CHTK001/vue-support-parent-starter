-- 创建服务器文件上传分片记录表
CREATE TABLE IF NOT EXISTS `monitor_sys_gen_server_file_upload_chunks` (
    `monitor_sys_gen_server_file_upload_chunk_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '分片记录ID',
    `upload_session_id` VARCHAR(64) NOT NULL COMMENT '上传会话ID',
    `file_md5` VARCHAR(32) NOT NULL COMMENT '文件MD5值',
    `chunk_index` INT NOT NULL COMMENT '分片索引',
    `chunk_md5` VARCHAR(32) NOT NULL COMMENT '分片MD5值',
    `chunk_size` BIGINT NOT NULL COMMENT '分片大小（字节）',
    `chunk_path` VARCHAR(512) NOT NULL COMMENT '分片存储路径',
    `upload_status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '上传状态：PENDING-待上传，UPLOADING-上传中，COMPLETED-已完成，FAILED-失败',
    `error_message` TEXT COMMENT '错误信息',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `create_user` VARCHAR(50) COMMENT '创建用户',
    `update_user` VARCHAR(50) COMMENT '更新用户',
    PRIMARY KEY (`monitor_sys_gen_server_file_upload_chunk_id`),
    UNIQUE KEY `uk_file_chunk` (`file_md5`, `chunk_index`),
    KEY `idx_upload_session_id` (`upload_session_id`),
    KEY `idx_file_md5` (`file_md5`),
    KEY `idx_upload_status` (`upload_status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='服务器文件上传分片记录表';

-- 为现有的文件上传记录表添加MD5索引（如果不存在）
ALTER TABLE `monitor_sys_gen_server_file_upload_records` 
ADD INDEX IF NOT EXISTS `idx_file_md5` (`monitor_sys_gen_server_file_upload_record_file_md5`);

-- 为现有的文件上传记录表添加文件大小索引（如果不存在）
ALTER TABLE `monitor_sys_gen_server_file_upload_records` 
ADD INDEX IF NOT EXISTS `idx_file_size` (`monitor_sys_gen_server_file_upload_record_file_size`);

-- 为现有的文件上传记录表添加上传状态索引（如果不存在）
ALTER TABLE `monitor_sys_gen_server_file_upload_records` 
ADD INDEX IF NOT EXISTS `idx_upload_status` (`monitor_sys_gen_server_file_upload_record_upload_status`);
