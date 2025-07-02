package com.chua.starter.monitor.starter;

import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServerMetrics;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerMetricsService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * 指标推送触发测试
 * 
 * @author CH
 * @since 2024/12/30
 */
@Slf4j
@SpringBootTest
public class MetricsPushTriggerTest {

    @Autowired
    private MonitorSysGenServerMetricsService metricsService;

    /**
     * 测试当指标数据为空时触发推送
     */
    @Test
    public void testMetricsPushTriggerOnEmptyData() {
        // 测试服务器ID（假设存在）
        Integer testServerId = 1;
        
        log.info("开始测试服务器 {} 的指标推送触发功能", testServerId);
        
        // 调用获取最新指标数据接口
        ReturnResult<MonitorSysGenServerMetrics> result = metricsService.getLatestMetrics(testServerId);
        
        if (result.isOk()) {
            if (result.getData() == null) {
                log.info("指标数据为空，应该已触发指标推送");
            } else {
                log.info("获取到指标数据: {}", result.getData());
            }
        } else {
            log.error("获取指标数据失败: {}", result.getMessage());
        }
        
        // 等待一段时间让异步推送完成
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        
        log.info("测试完成");
    }
    
    /**
     * 测试多次调用指标接口
     */
    @Test
    public void testMultipleMetricsRequests() {
        Integer testServerId = 1;
        
        log.info("开始测试多次调用指标接口");
        
        for (int i = 0; i < 3; i++) {
            log.info("第 {} 次调用指标接口", i + 1);
            
            ReturnResult<MonitorSysGenServerMetrics> result = metricsService.getLatestMetrics(testServerId);
            
            if (result.isOk()) {
                if (result.getData() == null) {
                    log.info("第 {} 次调用：指标数据为空，已触发推送", i + 1);
                } else {
                    log.info("第 {} 次调用：获取到指标数据", i + 1);
                }
            } else {
                log.error("第 {} 次调用失败: {}", i + 1, result.getMessage());
            }
            
            // 间隔2秒
            try {
                Thread.sleep(2000);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        log.info("多次调用测试完成");
    }
}
