package com.chua.starter.monitor.support.task;

import com.chua.starter.monitor.support.entity.MonitorDeviceInfo;
import com.chua.starter.monitor.support.entity.MonitorDeviceMetrics;
import com.chua.starter.monitor.support.service.MonitorDeviceService;
import com.chua.starter.monitor.support.websocket.ServerMonitorSocketIOListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

/**
 * 设备指标更新定时任务
 * 用于模拟设备指标数据的实时更新
 * @author CH
 * @since 2024/12/19
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "monitor.device.metrics.simulation.enabled", havingValue = "true", matchIfMissing = true)
public class DeviceMetricsUpdateTask {

    private final MonitorDeviceService deviceService;
    private final ServerMonitorSocketIOListener socketIOListener;
    private final Random random = new Random();

    /**
     * 每30秒更新一次设备指标数据
     */
    @Scheduled(fixedRate = 30000, initialDelay = 10000)
    public void updateDeviceMetrics() {
        try {
            // 获取所有启用监控的设备
            List<MonitorDeviceInfo> devices = deviceService.getAllDevicesWithMetricsSupport();
            
            if (devices.isEmpty()) {
                log.debug("没有启用监控的设备");
                return;
            }
            
            log.debug("开始更新 {} 个设备的指标数据", devices.size());
            
            for (MonitorDeviceInfo device : devices) {
                try {
                    updateSingleDeviceMetrics(device);
                } catch (Exception e) {
                    log.error("更新设备 {} 指标失败", device.getMonitorDeviceInfoDeviceId(), e);
                }
            }
            
            log.debug("设备指标数据更新完成");
            
        } catch (Exception e) {
            log.error("设备指标更新任务执行失败", e);
        }
    }

    /**
     * 更新单个设备的指标数据
     */
    private void updateSingleDeviceMetrics(MonitorDeviceInfo device) {
        String deviceId = device.getMonitorDeviceInfoDeviceId();
        
        // 获取设备当前指标
        MonitorDeviceMetrics currentMetrics = deviceService.getLatestMetrics(deviceId);
        
        // 生成新的指标数据
        MonitorDeviceMetrics newMetrics = generateSimulatedMetrics(device, currentMetrics);
        
        // 保存指标数据
        deviceService.saveDeviceMetrics(newMetrics);
        
        // 广播指标更新
        socketIOListener.broadcastServerMetricsUpdate(deviceId, newMetrics);
        
        log.debug("设备 {} 指标数据已更新: CPU={}%, 内存={}%, 磁盘={}%", 
                deviceId, 
                newMetrics.getMonitorDeviceMetricsCpuUsage(),
                newMetrics.getMonitorDeviceMetricsMemoryUsage(),
                newMetrics.getMonitorDeviceMetricsDiskUsage());
    }

    /**
     * 生成模拟的指标数据
     */
    private MonitorDeviceMetrics generateSimulatedMetrics(MonitorDeviceInfo device, MonitorDeviceMetrics current) {
        MonitorDeviceMetrics metrics = new MonitorDeviceMetrics();
        
        // 基本信息
        metrics.setMonitorDeviceMetricsDeviceId(device.getMonitorDeviceInfoDeviceId());
        metrics.setMonitorDeviceMetricsIpAddress(device.getMonitorDeviceInfoIpAddress());
        metrics.setMonitorDeviceMetricsPort(device.getMonitorDeviceInfoPort());
        metrics.setMonitorDeviceMetricsCollectTime(LocalDateTime.now());
        metrics.setMonitorDeviceMetricsOnline(true);
        
        // 系统信息
        metrics.setMonitorDeviceMetricsOsName(device.getMonitorDeviceInfoOsName());
        metrics.setMonitorDeviceMetricsOsVersion(device.getMonitorDeviceInfoOsVersion());
        metrics.setMonitorDeviceMetricsHostname(device.getMonitorDeviceInfoHostname());
        
        // CPU指标 - 基于当前值进行小幅波动
        BigDecimal cpuUsage = generateFluctuatingValue(
                current != null ? current.getMonitorDeviceMetricsCpuUsage() : BigDecimal.valueOf(20),
                BigDecimal.valueOf(5), BigDecimal.ZERO, BigDecimal.valueOf(100));
        metrics.setMonitorDeviceMetricsCpuUsage(cpuUsage);
        metrics.setMonitorDeviceMetricsCpuCores(device.getMonitorDeviceInfoCpuCores());
        metrics.setMonitorDeviceMetricsCpuFrequency(BigDecimal.valueOf(2400 + random.nextInt(800))); // 2.4-3.2GHz
        
        // 内存指标
        BigDecimal memoryUsage = generateFluctuatingValue(
                current != null ? current.getMonitorDeviceMetricsMemoryUsage() : BigDecimal.valueOf(60),
                BigDecimal.valueOf(3), BigDecimal.ZERO, BigDecimal.valueOf(95));
        metrics.setMonitorDeviceMetricsMemoryUsage(memoryUsage);
        metrics.setMonitorDeviceMetricsTotalMemory(device.getMonitorDeviceInfoTotalMemory());
        
        // 计算已用内存
        BigDecimal totalMemory = device.getMonitorDeviceInfoTotalMemory();
        BigDecimal usedMemory = totalMemory.multiply(memoryUsage).divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
        BigDecimal availableMemory = totalMemory.subtract(usedMemory);
        metrics.setMonitorDeviceMetricsUsedMemory(usedMemory);
        metrics.setMonitorDeviceMetricsAvailableMemory(availableMemory);
        
        // 磁盘指标
        BigDecimal diskUsage = generateFluctuatingValue(
                current != null ? current.getMonitorDeviceMetricsDiskUsage() : BigDecimal.valueOf(45),
                BigDecimal.valueOf(1), BigDecimal.ZERO, BigDecimal.valueOf(90));
        metrics.setMonitorDeviceMetricsDiskUsage(diskUsage);
        metrics.setMonitorDeviceMetricsTotalDisk(device.getMonitorDeviceInfoTotalDisk());
        
        // 计算已用磁盘
        BigDecimal totalDisk = device.getMonitorDeviceInfoTotalDisk();
        BigDecimal usedDisk = totalDisk.multiply(diskUsage).divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
        BigDecimal availableDisk = totalDisk.subtract(usedDisk);
        metrics.setMonitorDeviceMetricsUsedDisk(usedDisk);
        metrics.setMonitorDeviceMetricsAvailableDisk(availableDisk);
        
        // 网络指标 - 模拟网络流量
        metrics.setMonitorDeviceMetricsNetworkInBytes(BigDecimal.valueOf(random.nextInt(1000000) + 100000)); // 100KB-1MB
        metrics.setMonitorDeviceMetricsNetworkOutBytes(BigDecimal.valueOf(random.nextInt(500000) + 50000)); // 50KB-500KB
        metrics.setMonitorDeviceMetricsNetworkInPackets(BigDecimal.valueOf(random.nextInt(10000) + 1000));
        metrics.setMonitorDeviceMetricsNetworkOutPackets(BigDecimal.valueOf(random.nextInt(8000) + 800));
        
        // 系统负载
        BigDecimal loadAverage = generateFluctuatingValue(
                current != null ? current.getMonitorDeviceMetricsLoadAverage() : BigDecimal.valueOf(1.5),
                BigDecimal.valueOf(0.3), BigDecimal.ZERO, BigDecimal.valueOf(10));
        metrics.setMonitorDeviceMetricsLoadAverage(loadAverage);
        
        // 运行时间 - 递增
        BigDecimal uptime = current != null ? 
                current.getMonitorDeviceMetricsUptime().add(BigDecimal.valueOf(30)) : 
                BigDecimal.valueOf(86400 + random.nextInt(86400 * 30)); // 1-30天
        metrics.setMonitorDeviceMetricsUptime(uptime);
        
        // 进程和线程数
        metrics.setMonitorDeviceMetricsProcessCount(BigDecimal.valueOf(150 + random.nextInt(100)));
        metrics.setMonitorDeviceMetricsThreadCount(BigDecimal.valueOf(800 + random.nextInt(500)));
        
        // 温度 - 如果支持
        if (random.nextBoolean()) {
            BigDecimal temperature = generateFluctuatingValue(
                    current != null ? current.getMonitorDeviceMetricsTemperature() : BigDecimal.valueOf(45),
                    BigDecimal.valueOf(2), BigDecimal.valueOf(30), BigDecimal.valueOf(80));
            metrics.setMonitorDeviceMetricsTemperature(temperature);
        }
        
        return metrics;
    }

    /**
     * 生成波动值
     * @param currentValue 当前值
     * @param maxChange 最大变化量
     * @param minValue 最小值
     * @param maxValue 最大值
     * @return 新值
     */
    private BigDecimal generateFluctuatingValue(BigDecimal currentValue, BigDecimal maxChange, 
                                               BigDecimal minValue, BigDecimal maxValue) {
        if (currentValue == null) {
            // 如果没有当前值，生成一个随机值
            double range = maxValue.subtract(minValue).doubleValue();
            double randomValue = minValue.doubleValue() + (random.nextDouble() * range);
            return BigDecimal.valueOf(randomValue).setScale(2, RoundingMode.HALF_UP);
        }
        
        // 生成变化量 (-maxChange 到 +maxChange)
        double change = (random.nextDouble() - 0.5) * 2 * maxChange.doubleValue();
        BigDecimal newValue = currentValue.add(BigDecimal.valueOf(change));
        
        // 确保在范围内
        if (newValue.compareTo(minValue) < 0) {
            newValue = minValue;
        } else if (newValue.compareTo(maxValue) > 0) {
            newValue = maxValue;
        }
        
        return newValue.setScale(2, RoundingMode.HALF_UP);
    }

    /**
     * 每5分钟检查设备在线状态
     */
    @Scheduled(fixedRate = 300000, initialDelay = 60000)
    public void checkDeviceOnlineStatus() {
        try {
            List<MonitorDeviceInfo> devices = deviceService.getAllDevices();
            
            for (MonitorDeviceInfo device : devices) {
                try {
                    checkSingleDeviceStatus(device);
                } catch (Exception e) {
                    log.error("检查设备 {} 状态失败", device.getMonitorDeviceInfoDeviceId(), e);
                }
            }
            
        } catch (Exception e) {
            log.error("设备状态检查任务执行失败", e);
        }
    }

    /**
     * 检查单个设备状态
     */
    private void checkSingleDeviceStatus(MonitorDeviceInfo device) {
        String deviceId = device.getMonitorDeviceInfoDeviceId();
        
        // 模拟设备状态检查
        boolean isOnline = random.nextDouble() > 0.05; // 95%的概率在线
        
        // 获取最新指标
        MonitorDeviceMetrics latestMetrics = deviceService.getLatestMetrics(deviceId);
        
        if (latestMetrics != null) {
            boolean wasOnline = latestMetrics.getMonitorDeviceMetricsOnline();
            
            if (wasOnline != isOnline) {
                // 状态发生变化
                if (isOnline) {
                    log.info("设备 {} 上线", deviceId);
                    socketIOListener.broadcastServerOnline(deviceId, device);
                } else {
                    log.info("设备 {} 离线", deviceId);
                    socketIOListener.broadcastServerOffline(deviceId, "网络连接超时");
                }
            }
        }
    }
}
