-- 服务器配置表字段补充脚本
-- 用于添加前端配置页面所需的缺失字段

-- 检查表是否存在
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = DATABASE() AND table_name = 'monitor_sys_gen_server_setting';

-- 添加指标收集启用字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_metrics_enabled INT DEFAULT 1 
COMMENT '是否启用指标收集 0:否 1:是';

-- 添加CPU警告阈值字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_cpu_warning_threshold DECIMAL(5,2) DEFAULT 70.00 
COMMENT 'CPU警告阈值(百分比)';

-- 添加CPU严重阈值字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_cpu_critical_threshold DECIMAL(5,2) DEFAULT 90.00 
COMMENT 'CPU严重阈值(百分比)';

-- 添加内存警告阈值字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_memory_warning_threshold DECIMAL(5,2) DEFAULT 75.00 
COMMENT '内存警告阈值(百分比)';

-- 添加内存严重阈值字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_memory_critical_threshold DECIMAL(5,2) DEFAULT 90.00 
COMMENT '内存严重阈值(百分比)';

-- 添加磁盘警告阈值字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_disk_warning_threshold DECIMAL(5,2) DEFAULT 80.00 
COMMENT '磁盘警告阈值(百分比)';

-- 添加磁盘严重阈值字段
ALTER TABLE monitor_sys_gen_server_setting 
ADD COLUMN IF NOT EXISTS monitor_sys_gen_server_setting_disk_critical_threshold DECIMAL(5,2) DEFAULT 95.00 
COMMENT '磁盘严重阈值(百分比)';

-- 为现有记录设置默认值（如果字段为NULL）
UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_metrics_enabled = 1 
WHERE monitor_sys_gen_server_setting_metrics_enabled IS NULL;

UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_cpu_warning_threshold = 70.00 
WHERE monitor_sys_gen_server_setting_cpu_warning_threshold IS NULL;

UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_cpu_critical_threshold = 90.00 
WHERE monitor_sys_gen_server_setting_cpu_critical_threshold IS NULL;

UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_memory_warning_threshold = 75.00 
WHERE monitor_sys_gen_server_setting_memory_warning_threshold IS NULL;

UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_memory_critical_threshold = 90.00 
WHERE monitor_sys_gen_server_setting_memory_critical_threshold IS NULL;

UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_disk_warning_threshold = 80.00 
WHERE monitor_sys_gen_server_setting_disk_warning_threshold IS NULL;

UPDATE monitor_sys_gen_server_setting 
SET monitor_sys_gen_server_setting_disk_critical_threshold = 95.00 
WHERE monitor_sys_gen_server_setting_disk_critical_threshold IS NULL;

-- 验证字段是否添加成功
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT,
    COLUMN_COMMENT
FROM information_schema.COLUMNS 
WHERE table_schema = DATABASE() 
    AND table_name = 'monitor_sys_gen_server_setting'
    AND COLUMN_NAME IN (
        'monitor_sys_gen_server_setting_metrics_enabled',
        'monitor_sys_gen_server_setting_cpu_warning_threshold',
        'monitor_sys_gen_server_setting_cpu_critical_threshold',
        'monitor_sys_gen_server_setting_memory_warning_threshold',
        'monitor_sys_gen_server_setting_memory_critical_threshold',
        'monitor_sys_gen_server_setting_disk_warning_threshold',
        'monitor_sys_gen_server_setting_disk_critical_threshold'
    )
ORDER BY COLUMN_NAME;

-- 检查现有数据的阈值设置是否合理
SELECT 
    monitor_sys_gen_server_id,
    monitor_sys_gen_server_setting_cpu_warning_threshold,
    monitor_sys_gen_server_setting_cpu_critical_threshold,
    monitor_sys_gen_server_setting_memory_warning_threshold,
    monitor_sys_gen_server_setting_memory_critical_threshold,
    monitor_sys_gen_server_setting_disk_warning_threshold,
    monitor_sys_gen_server_setting_disk_critical_threshold
FROM monitor_sys_gen_server_setting 
WHERE monitor_sys_gen_server_setting_status = 1
LIMIT 10;
