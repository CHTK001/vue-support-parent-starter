// 需要在 MonitorSysGenServerSetting.java 实体类中添加的字段
// 请将以下字段添加到实体类的适当位置

/**
 * 是否启用指标收集 0:否 1:是
 */
@TableField(value = "monitor_sys_gen_server_setting_metrics_enabled")
@ApiModelProperty(value = "是否启用指标收集")
@Schema(description = "是否启用指标收集")
private Integer monitorSysGenServerSettingMetricsEnabled;

/**
 * CPU警告阈值 (百分比)
 */
@TableField(value = "monitor_sys_gen_server_setting_cpu_warning_threshold")
@ApiModelProperty(value = "CPU警告阈值")
@Schema(description = "CPU警告阈值 (百分比)")
private BigDecimal monitorSysGenServerSettingCpuWarningThreshold;

/**
 * CPU严重阈值 (百分比)
 */
@TableField(value = "monitor_sys_gen_server_setting_cpu_critical_threshold")
@ApiModelProperty(value = "CPU严重阈值")
@Schema(description = "CPU严重阈值 (百分比)")
private BigDecimal monitorSysGenServerSettingCpuCriticalThreshold;

/**
 * 内存警告阈值 (百分比)
 */
@TableField(value = "monitor_sys_gen_server_setting_memory_warning_threshold")
@ApiModelProperty(value = "内存警告阈值")
@Schema(description = "内存警告阈值 (百分比)")
private BigDecimal monitorSysGenServerSettingMemoryWarningThreshold;

/**
 * 内存严重阈值 (百分比)
 */
@TableField(value = "monitor_sys_gen_server_setting_memory_critical_threshold")
@ApiModelProperty(value = "内存严重阈值")
@Schema(description = "内存严重阈值 (百分比)")
private BigDecimal monitorSysGenServerSettingMemoryCriticalThreshold;

/**
 * 磁盘警告阈值 (百分比)
 */
@TableField(value = "monitor_sys_gen_server_setting_disk_warning_threshold")
@ApiModelProperty(value = "磁盘警告阈值")
@Schema(description = "磁盘警告阈值 (百分比)")
private BigDecimal monitorSysGenServerSettingDiskWarningThreshold;

/**
 * 磁盘严重阈值 (百分比)
 */
@TableField(value = "monitor_sys_gen_server_setting_disk_critical_threshold")
@ApiModelProperty(value = "磁盘严重阈值")
@Schema(description = "磁盘严重阈值 (百分比)")
private BigDecimal monitorSysGenServerSettingDiskCriticalThreshold;

// ==================== 需要在 getDefaultSetting 方法中添加的默认值设置 ====================

// 在 getDefaultSetting 方法中添加以下代码：

// 指标收集配置
setting.setMonitorSysGenServerSettingMetricsEnabled(1);

// CPU阈值配置
setting.setMonitorSysGenServerSettingCpuWarningThreshold(new BigDecimal("70.00"));
setting.setMonitorSysGenServerSettingCpuCriticalThreshold(new BigDecimal("90.00"));

// 内存阈值配置
setting.setMonitorSysGenServerSettingMemoryWarningThreshold(new BigDecimal("75.00"));
setting.setMonitorSysGenServerSettingMemoryCriticalThreshold(new BigDecimal("90.00"));

// 磁盘阈值配置
setting.setMonitorSysGenServerSettingDiskWarningThreshold(new BigDecimal("80.00"));
setting.setMonitorSysGenServerSettingDiskCriticalThreshold(new BigDecimal("95.00"));

// ==================== 需要在验证方法中添加的验证逻辑 ====================

// 在 validateSetting 方法中添加以下验证逻辑：

// 验证CPU阈值
if (setting.getMonitorSysGenServerSettingCpuWarningThreshold() != null && 
    setting.getMonitorSysGenServerSettingCpuCriticalThreshold() != null) {
    BigDecimal cpuWarning = setting.getMonitorSysGenServerSettingCpuWarningThreshold();
    BigDecimal cpuCritical = setting.getMonitorSysGenServerSettingCpuCriticalThreshold();
    
    if (cpuWarning.compareTo(BigDecimal.ZERO) <= 0 || cpuWarning.compareTo(new BigDecimal("100")) > 0) {
        return ReturnResult.error("CPU警告阈值必须在0-100之间");
    }
    if (cpuCritical.compareTo(BigDecimal.ZERO) <= 0 || cpuCritical.compareTo(new BigDecimal("100")) > 0) {
        return ReturnResult.error("CPU严重阈值必须在0-100之间");
    }
    if (cpuWarning.compareTo(cpuCritical) >= 0) {
        return ReturnResult.error("CPU警告阈值必须小于严重阈值");
    }
}

// 验证内存阈值
if (setting.getMonitorSysGenServerSettingMemoryWarningThreshold() != null && 
    setting.getMonitorSysGenServerSettingMemoryCriticalThreshold() != null) {
    BigDecimal memoryWarning = setting.getMonitorSysGenServerSettingMemoryWarningThreshold();
    BigDecimal memoryCritical = setting.getMonitorSysGenServerSettingMemoryCriticalThreshold();
    
    if (memoryWarning.compareTo(BigDecimal.ZERO) <= 0 || memoryWarning.compareTo(new BigDecimal("100")) > 0) {
        return ReturnResult.error("内存警告阈值必须在0-100之间");
    }
    if (memoryCritical.compareTo(BigDecimal.ZERO) <= 0 || memoryCritical.compareTo(new BigDecimal("100")) > 0) {
        return ReturnResult.error("内存严重阈值必须在0-100之间");
    }
    if (memoryWarning.compareTo(memoryCritical) >= 0) {
        return ReturnResult.error("内存警告阈值必须小于严重阈值");
    }
}

// 验证磁盘阈值
if (setting.getMonitorSysGenServerSettingDiskWarningThreshold() != null && 
    setting.getMonitorSysGenServerSettingDiskCriticalThreshold() != null) {
    BigDecimal diskWarning = setting.getMonitorSysGenServerSettingDiskWarningThreshold();
    BigDecimal diskCritical = setting.getMonitorSysGenServerSettingDiskCriticalThreshold();
    
    if (diskWarning.compareTo(BigDecimal.ZERO) <= 0 || diskWarning.compareTo(new BigDecimal("100")) > 0) {
        return ReturnResult.error("磁盘警告阈值必须在0-100之间");
    }
    if (diskCritical.compareTo(BigDecimal.ZERO) <= 0 || diskCritical.compareTo(new BigDecimal("100")) > 0) {
        return ReturnResult.error("磁盘严重阈值必须在0-100之间");
    }
    if (diskWarning.compareTo(diskCritical) >= 0) {
        return ReturnResult.error("磁盘警告阈值必须小于严重阈值");
    }
}
