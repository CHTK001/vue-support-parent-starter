package com.chua.starter.monitor.starter.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.time.Duration;

/**
 * 节点日志器配置相关的配置类
 * 
 * @author CH
 * @since 2025/01/17
 */
@Configuration
public class NodeLoggerConfigConfiguration {

    /**
     * 创建 RestTemplate Bean（如果不存在的话）
     * 用于与远程节点进行HTTP通信
     *
     * @return RestTemplate 实例
     */
    @Bean
    @ConditionalOnMissingBean(RestTemplate.class)
    public RestTemplate restTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        
        // 设置连接超时时间（5秒）
        factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
        
        // 设置读取超时时间（10秒）
        factory.setReadTimeout((int) Duration.ofSeconds(10).toMillis());
        
        return new RestTemplate(factory);
    }
}
