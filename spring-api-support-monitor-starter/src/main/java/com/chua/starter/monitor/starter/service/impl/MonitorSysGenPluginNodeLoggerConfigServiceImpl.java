package com.chua.starter.monitor.starter.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.chua.common.support.lang.code.ReturnResult;
import com.chua.starter.monitor.starter.entity.MonitorSysGenPluginNodeLoggerConfig;
import com.chua.starter.monitor.starter.mapper.MonitorSysGenPluginNodeLoggerConfigMapper;
import com.chua.starter.monitor.starter.service.MonitorSysGenPluginNodeLoggerConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 节点日志器配置服务实现类
 *
 * @author CH
 * @since 2025/01/17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MonitorSysGenPluginNodeLoggerConfigServiceImpl
        extends ServiceImpl<MonitorSysGenPluginNodeLoggerConfigMapper, MonitorSysGenPluginNodeLoggerConfig>
        implements MonitorSysGenPluginNodeLoggerConfigService {

    private final MonitorSysGenPluginNodeLoggerConfigMapper configMapper;
    private final RestTemplate restTemplate;

    @Override
    public ReturnResult<List<MonitorSysGenPluginNodeLoggerConfig>> getNodeLoggers(String nodeUrl) {
        try {
            log.info("获取节点日志器配置: nodeUrl={}", nodeUrl);

            // 首先尝试从数据库获取配置
            List<MonitorSysGenPluginNodeLoggerConfig> configs = configMapper.selectByNodeUrl(nodeUrl);

            // 如果数据库中没有配置，尝试从远程节点获取
            if (configs.isEmpty()) {
                log.info("数据库中没有找到配置，尝试从远程节点获取: nodeUrl={}", nodeUrl);
                ReturnResult<List<Map<String, Object>>> remoteResult = fetchRemoteLoggers(nodeUrl);
                if (remoteResult.isSuccess() && remoteResult.getData() != null) {
                    // 解析节点URL获取IP和端口
                    String decodedUrl = decodeNodeUrl(nodeUrl);
                    String[] parts = decodedUrl.split(":");
                    if (parts.length == 2) {
                        String ipAddress = parts[0];
                        Integer port = Integer.parseInt(parts[1]);

                        // 同步远程配置到数据库
                        syncNodeLoggers(nodeUrl, ipAddress, port, "unknown", remoteResult.getData());

                        // 重新从数据库获取
                        configs = configMapper.selectByNodeUrl(nodeUrl);
                    }
                }
            }

            return ReturnResult.success(configs);

        } catch (Exception e) {
            log.error("获取节点日志器配置失败: nodeUrl={}", nodeUrl, e);
            return ReturnResult.error("获取节点日志器配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<MonitorSysGenPluginNodeLoggerConfig> getLoggerConfig(String nodeUrl, String loggerName) {
        try {
            log.info("获取日志器详细配置: nodeUrl={}, loggerName={}", nodeUrl, loggerName);

            MonitorSysGenPluginNodeLoggerConfig config = configMapper.selectByNodeUrlAndLoggerName(nodeUrl, loggerName);
            if (config == null) {
                return ReturnResult.error("未找到指定的日志器配置");
            }

            return ReturnResult.success(config);

        } catch (Exception e) {
            log.error("获取日志器详细配置失败: nodeUrl={}, loggerName={}", nodeUrl, loggerName, e);
            return ReturnResult.error("获取日志器详细配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> setLoggerLevel(String nodeUrl, String loggerName, String level) {
        try {
            log.info("设置日志器等级: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level);

            // 首先向远程节点设置日志等级
            ReturnResult<Boolean> remoteResult = setRemoteLoggerLevel(nodeUrl, loggerName, level);
            if (!remoteResult.isSuccess()) {
                return remoteResult;
            }

            // 更新数据库中的配置
            LocalDateTime now = LocalDateTime.now();
            int updated = configMapper.updateLoggerLevel(nodeUrl, loggerName, level, level, level, now, now);

            if (updated == 0) {
                // 如果没有更新到记录，可能是配置不存在，尝试创建新配置
                MonitorSysGenPluginNodeLoggerConfig config = new MonitorSysGenPluginNodeLoggerConfig();
                config.setPluginNodeLoggerConfigNodeUrl(nodeUrl);
                config.setPluginNodeLoggerConfigLoggerName(loggerName);
                config.setPluginNodeLoggerConfigConfiguredLevel(level);
                config.setPluginNodeLoggerConfigCurrentLevel(level);
                config.setPluginNodeLoggerConfigEffectiveLevel(level);
                config.setPluginNodeLoggerConfigEnabled(true);
                config.setPluginNodeLoggerConfigLastUpdated(now);
                config.setPluginNodeLoggerConfigLastSyncTime(now);
                config.setPluginNodeLoggerConfigStatus("ACTIVE");
                config.setPluginNodeLoggerConfigSyncStatus("SYNCED");

                // 解析节点URL获取IP和端口
                String decodedUrl = decodeNodeUrl(nodeUrl);
                String[] parts = decodedUrl.split(":");
                if (parts.length == 2) {
                    config.setPluginNodeLoggerConfigIpAddress(parts[0]);
                    config.setPluginNodeLoggerConfigPort(Integer.parseInt(parts[1]));
                }

                save(config);
            }

            log.info("日志器等级设置成功: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level);
            return ReturnResult.success(true);

        } catch (Exception e) {
            log.error("设置日志器等级失败: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level, e);
            return ReturnResult.error("设置日志器等级失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Map<String, Boolean>> setLoggerLevelForAllNodes(String applicationName, String loggerName,
            String level) {
        try {
            log.info("批量设置日志器等级: applicationName={}, loggerName={}, level={}", applicationName, loggerName, level);

            List<String> nodeUrls = configMapper.selectNodeUrlsByApplicationName(applicationName);
            Map<String, Boolean> results = new HashMap<>();

            for (String nodeUrl : nodeUrls) {
                try {
                    ReturnResult<Boolean> result = setLoggerLevel(nodeUrl, loggerName, level);
                    results.put(nodeUrl, result.isSuccess());
                } catch (Exception e) {
                    log.error("设置节点日志器等级失败: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level, e);
                    results.put(nodeUrl, false);
                }
            }

            return ReturnResult.success(results);

        } catch (Exception e) {
            log.error("批量设置日志器等级失败: applicationName={}, loggerName={}, level={}", applicationName, loggerName, level,
                    e);
            return ReturnResult.error("批量设置日志器等级失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<String>> getNodesByApplicationName(String applicationName) {
        try {
            log.info("获取应用的所有节点: applicationName={}", applicationName);

            List<String> nodeUrls = configMapper.selectNodeUrlsByApplicationName(applicationName);
            return ReturnResult.success(nodeUrls);

        } catch (Exception e) {
            log.error("获取应用的所有节点失败: applicationName={}", applicationName, e);
            return ReturnResult.error("获取应用的所有节点失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<List<MonitorSysGenPluginNodeLoggerConfig>> refreshNodeLoggers(String nodeUrl) {
        try {
            log.info("刷新节点日志器配置: nodeUrl={}", nodeUrl);

            // 从远程节点获取最新配置
            ReturnResult<List<Map<String, Object>>> remoteResult = fetchRemoteLoggers(nodeUrl);
            if (!remoteResult.isSuccess()) {
                return ReturnResult.error("获取远程节点配置失败: " + remoteResult.getMessage());
            }

            // 解析节点URL获取IP和端口
            String decodedUrl = decodeNodeUrl(nodeUrl);
            String[] parts = decodedUrl.split(":");
            if (parts.length != 2) {
                return ReturnResult.error("无效的节点URL格式");
            }

            String ipAddress = parts[0];
            Integer port = Integer.parseInt(parts[1]);

            // 同步配置到数据库
            ReturnResult<Boolean> syncResult = syncNodeLoggers(nodeUrl, ipAddress, port, "unknown",
                    remoteResult.getData());
            if (!syncResult.isSuccess()) {
                return ReturnResult.error("同步配置到数据库失败: " + syncResult.getMessage());
            }

            // 返回最新的配置
            List<MonitorSysGenPluginNodeLoggerConfig> configs = configMapper.selectByNodeUrl(nodeUrl);
            return ReturnResult.success(configs);

        } catch (Exception e) {
            log.error("刷新节点日志器配置失败: nodeUrl={}", nodeUrl, e);
            return ReturnResult.error("刷新节点日志器配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<String>> getAllApplicationNames() {
        try {
            log.info("获取所有应用名称");

            List<String> applicationNames = configMapper.selectAllApplicationNames();
            return ReturnResult.success(applicationNames);

        } catch (Exception e) {
            log.error("获取所有应用名称失败", e);
            return ReturnResult.error("获取所有应用名称失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Map<String, Object>> getLoggerConfigStats(String nodeUrl) {
        try {
            log.info("获取节点日志器配置统计: nodeUrl={}", nodeUrl);

            Map<String, Object> stats = configMapper.selectLoggerStats(nodeUrl);
            return ReturnResult.success(stats);

        } catch (Exception e) {
            log.error("获取节点日志器配置统计失败: nodeUrl={}", nodeUrl, e);
            return ReturnResult.error("获取节点日志器配置统计失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> resetLoggerLevel(String nodeUrl, String loggerName) {
        try {
            log.info("重置日志器等级: nodeUrl={}, loggerName={}", nodeUrl, loggerName);

            // 向远程节点重置日志等级（设置为空字符串表示继承）
            ReturnResult<Boolean> remoteResult = setRemoteLoggerLevel(nodeUrl, loggerName, "");
            if (!remoteResult.isSuccess()) {
                return remoteResult;
            }

            // 更新数据库中的配置
            LocalDateTime now = LocalDateTime.now();
            int updated = configMapper.updateLoggerLevel(nodeUrl, loggerName, null, null, null, now, now);

            log.info("日志器等级重置成功: nodeUrl={}, loggerName={}", nodeUrl, loggerName);
            return ReturnResult.success(updated > 0);

        } catch (Exception e) {
            log.error("重置日志器等级失败: nodeUrl={}, loggerName={}", nodeUrl, loggerName, e);
            return ReturnResult.error("重置日志器等级失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Map<String, Boolean>> resetLoggerLevelForAllNodes(String applicationName, String loggerName) {
        try {
            log.info("批量重置日志器等级: applicationName={}, loggerName={}", applicationName, loggerName);

            List<String> nodeUrls = configMapper.selectNodeUrlsByApplicationName(applicationName);
            Map<String, Boolean> results = new HashMap<>();

            for (String nodeUrl : nodeUrls) {
                try {
                    ReturnResult<Boolean> result = resetLoggerLevel(nodeUrl, loggerName);
                    results.put(nodeUrl, result.isSuccess());
                } catch (Exception e) {
                    log.error("重置节点日志器等级失败: nodeUrl={}, loggerName={}", nodeUrl, loggerName, e);
                    results.put(nodeUrl, false);
                }
            }

            return ReturnResult.success(results);

        } catch (Exception e) {
            log.error("批量重置日志器等级失败: applicationName={}, loggerName={}", applicationName, loggerName, e);
            return ReturnResult.error("批量重置日志器等级失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> syncNodeLoggers(String nodeUrl, String ipAddress, Integer port, String applicationName,
            List<Map<String, Object>> loggers) {
        try {
            log.info("同步节点日志器配置: nodeUrl={}, ipAddress={}, port={}, applicationName={}", nodeUrl, ipAddress, port,
                    applicationName);

            LocalDateTime now = LocalDateTime.now();

            for (Map<String, Object> loggerData : loggers) {
                String loggerName = (String) loggerData.get("name");
                String configuredLevel = (String) loggerData.get("configuredLevel");
                String effectiveLevel = (String) loggerData.get("effectiveLevel");
                Boolean additive = (Boolean) loggerData.get("additive");

                // 查找现有配置
                MonitorSysGenPluginNodeLoggerConfig existingConfig = configMapper.selectByNodeUrlAndLoggerName(nodeUrl,
                        loggerName);

                if (existingConfig != null) {
                    // 更新现有配置
                    existingConfig.setPluginNodeLoggerConfigConfiguredLevel(configuredLevel);
                    existingConfig.setPluginNodeLoggerConfigCurrentLevel(configuredLevel);
                    existingConfig.setPluginNodeLoggerConfigEffectiveLevel(effectiveLevel);
                    existingConfig.setPluginNodeLoggerConfigAdditive(additive);
                    existingConfig.setPluginNodeLoggerConfigLastUpdated(now);
                    existingConfig.setPluginNodeLoggerConfigLastSyncTime(now);
                    existingConfig.setPluginNodeLoggerConfigSyncStatus("SYNCED");
                    existingConfig.setPluginNodeLoggerConfigSyncError(null);
                    updateById(existingConfig);
                } else {
                    // 创建新配置
                    MonitorSysGenPluginNodeLoggerConfig newConfig = new MonitorSysGenPluginNodeLoggerConfig();
                    newConfig.setPluginNodeLoggerConfigNodeUrl(nodeUrl);
                    newConfig.setPluginNodeLoggerConfigIpAddress(ipAddress);
                    newConfig.setPluginNodeLoggerConfigPort(port);
                    newConfig.setPluginNodeLoggerConfigApplicationName(applicationName);
                    newConfig.setPluginNodeLoggerConfigLoggerName(loggerName);
                    newConfig.setPluginNodeLoggerConfigConfiguredLevel(configuredLevel);
                    newConfig.setPluginNodeLoggerConfigCurrentLevel(configuredLevel);
                    newConfig.setPluginNodeLoggerConfigEffectiveLevel(effectiveLevel);
                    newConfig.setPluginNodeLoggerConfigAdditive(additive);
                    newConfig.setPluginNodeLoggerConfigEnabled(true);
                    newConfig.setPluginNodeLoggerConfigLastUpdated(now);
                    newConfig.setPluginNodeLoggerConfigLastSyncTime(now);
                    newConfig.setPluginNodeLoggerConfigStatus("ACTIVE");
                    newConfig.setPluginNodeLoggerConfigSyncStatus("SYNCED");
                    newConfig.setPluginNodeLoggerConfigSource("REMOTE");
                    save(newConfig);
                }
            }

            log.info("节点日志器配置同步完成: nodeUrl={}, 同步数量={}", nodeUrl, loggers.size());
            return ReturnResult.success(true);

        } catch (Exception e) {
            log.error("同步节点日志器配置失败: nodeUrl={}, ipAddress={}, port={}", nodeUrl, ipAddress, port, e);
            return ReturnResult.error("同步节点日志器配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<MonitorSysGenPluginNodeLoggerConfig>> getLoggersByIpAndPort(String ipAddress,
            Integer port) {
        try {
            log.info("根据IP和端口获取日志器配置: ipAddress={}, port={}", ipAddress, port);

            List<MonitorSysGenPluginNodeLoggerConfig> configs = configMapper.selectByIpAndPort(ipAddress, port);
            return ReturnResult.success(configs);

        } catch (Exception e) {
            log.error("根据IP和端口获取日志器配置失败: ipAddress={}, port={}", ipAddress, port, e);
            return ReturnResult.error("根据IP和端口获取日志器配置失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateSyncStatus(String nodeUrl, String loggerName, String syncStatus,
            String syncError) {
        try {
            log.info("更新同步状态: nodeUrl={}, loggerName={}, syncStatus={}", nodeUrl, loggerName, syncStatus);

            LocalDateTime now = LocalDateTime.now();
            int updated = configMapper.updateSyncStatus(nodeUrl, loggerName, syncStatus, syncError, now);

            return ReturnResult.success(updated > 0);

        } catch (Exception e) {
            log.error("更新同步状态失败: nodeUrl={}, loggerName={}, syncStatus={}", nodeUrl, loggerName, syncStatus, e);
            return ReturnResult.error("更新同步状态失败: " + e.getMessage());
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public ReturnResult<Boolean> updateNodeConfigStatus(String nodeUrl, String status) {
        try {
            log.info("批量更新节点配置状态: nodeUrl={}, status={}", nodeUrl, status);

            int updated = configMapper.updateStatusByNodeUrl(nodeUrl, status);

            return ReturnResult.success(updated > 0);

        } catch (Exception e) {
            log.error("批量更新节点配置状态失败: nodeUrl={}, status={}", nodeUrl, status, e);
            return ReturnResult.error("批量更新节点配置状态失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> checkNodeStatus(String nodeUrl) {
        try {
            log.info("检查节点状态: nodeUrl={}", nodeUrl);

            String decodedUrl = decodeNodeUrl(nodeUrl);
            String[] parts = decodedUrl.split(":");
            if (parts.length != 2) {
                return ReturnResult.error("无效的节点URL格式");
            }

            String ipAddress = parts[0];
            Integer port = Integer.parseInt(parts[1]);

            // 构建健康检查URL
            String healthUrl = String.format("http://%s:%d/actuator/health", ipAddress, port);

            try {
                ResponseEntity<String> response = restTemplate.getForEntity(healthUrl, String.class);
                boolean isOnline = response.getStatusCode().is2xxSuccessful();

                log.info("节点状态检查完成: nodeUrl={}, isOnline={}", nodeUrl, isOnline);
                return ReturnResult.success(isOnline);

            } catch (Exception e) {
                log.warn("节点不可访问: nodeUrl={}, error={}", nodeUrl, e.getMessage());
                return ReturnResult.success(false);
            }

        } catch (Exception e) {
            log.error("检查节点状态失败: nodeUrl={}", nodeUrl, e);
            return ReturnResult.error("检查节点状态失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<List<Map<String, Object>>> fetchRemoteLoggers(String nodeUrl) {
        try {
            log.info("从远程节点获取日志器配置: nodeUrl={}", nodeUrl);

            String decodedUrl = decodeNodeUrl(nodeUrl);
            String[] parts = decodedUrl.split(":");
            if (parts.length != 2) {
                return ReturnResult.error("无效的节点URL格式");
            }

            String ipAddress = parts[0];
            Integer port = Integer.parseInt(parts[1]);

            // 构建日志器配置获取URL
            String loggersUrl = String.format("http://%s:%d/actuator/loggers", ipAddress, port);

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("Accept", "application/json");
                HttpEntity<String> entity = new HttpEntity<>(headers);

                ResponseEntity<Map> response = restTemplate.exchange(loggersUrl, HttpMethod.GET, entity, Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map<String, Object> responseBody = response.getBody();
                    Map<String, Object> loggers = (Map<String, Object>) responseBody.get("loggers");

                    List<Map<String, Object>> loggerList = new ArrayList<>();
                    if (loggers != null) {
                        for (Map.Entry<String, Object> entry : loggers.entrySet()) {
                            String loggerName = entry.getKey();
                            Map<String, Object> loggerInfo = (Map<String, Object>) entry.getValue();

                            Map<String, Object> loggerData = new HashMap<>();
                            loggerData.put("name", loggerName);
                            loggerData.put("configuredLevel", loggerInfo.get("configuredLevel"));
                            loggerData.put("effectiveLevel", loggerInfo.get("effectiveLevel"));
                            loggerData.put("additive", loggerInfo.get("additive"));

                            loggerList.add(loggerData);
                        }
                    }

                    log.info("成功获取远程日志器配置: nodeUrl={}, 数量={}", nodeUrl, loggerList.size());
                    return ReturnResult.success(loggerList);
                } else {
                    return ReturnResult.error("获取远程日志器配置失败: HTTP " + response.getStatusCode());
                }

            } catch (Exception e) {
                log.error("调用远程节点API失败: nodeUrl={}", nodeUrl, e);
                return ReturnResult.error("调用远程节点API失败: " + e.getMessage());
            }

        } catch (Exception e) {
            log.error("从远程节点获取日志器配置失败: nodeUrl={}", nodeUrl, e);
            return ReturnResult.error("从远程节点获取日志器配置失败: " + e.getMessage());
        }
    }

    @Override
    public ReturnResult<Boolean> setRemoteLoggerLevel(String nodeUrl, String loggerName, String level) {
        try {
            log.info("向远程节点设置日志器等级: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level);

            String decodedUrl = decodeNodeUrl(nodeUrl);
            String[] parts = decodedUrl.split(":");
            if (parts.length != 2) {
                return ReturnResult.error("无效的节点URL格式");
            }

            String ipAddress = parts[0];
            Integer port = Integer.parseInt(parts[1]);

            // 构建设置日志器等级URL
            String setLevelUrl = String.format("http://%s:%d/actuator/loggers/%s", ipAddress, port,
                    loggerName.replace(".", "%2E"));

            try {
                HttpHeaders headers = new HttpHeaders();
                headers.set("Content-Type", "application/json");

                Map<String, Object> requestBody = new HashMap<>();
                if (StringUtils.hasText(level)) {
                    requestBody.put("configuredLevel", level);
                } else {
                    requestBody.put("configuredLevel", null);
                }

                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

                ResponseEntity<String> response = restTemplate.exchange(setLevelUrl, HttpMethod.POST, entity,
                        String.class);

                if (response.getStatusCode().is2xxSuccessful()) {
                    log.info("成功设置远程日志器等级: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level);
                    return ReturnResult.success(true);
                } else {
                    return ReturnResult.error("设置远程日志器等级失败: HTTP " + response.getStatusCode());
                }

            } catch (Exception e) {
                log.error("调用远程节点设置API失败: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level, e);
                return ReturnResult.error("调用远程节点设置API失败: " + e.getMessage());
            }

        } catch (Exception e) {
            log.error("向远程节点设置日志器等级失败: nodeUrl={}, loggerName={}, level={}", nodeUrl, loggerName, level, e);
            return ReturnResult.error("向远程节点设置日志器等级失败: " + e.getMessage());
        }
    }

    @Override
    public String decodeNodeUrl(String encodedNodeUrl) {
        try {
            byte[] decodedBytes = Base64.getDecoder().decode(encodedNodeUrl);
            return new String(decodedBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.error("解码节点URL失败: encodedNodeUrl={}", encodedNodeUrl, e);
            throw new IllegalArgumentException("无效的节点URL编码: " + encodedNodeUrl);
        }
    }

    @Override
    public String encodeNodeUrl(String ipAddress, Integer port) {
        try {
            String nodeUrl = ipAddress + ":" + port;
            return Base64.getEncoder().encodeToString(nodeUrl.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            log.error("编码节点URL失败: ipAddress={}, port={}", ipAddress, port, e);
            throw new IllegalArgumentException("无效的IP地址或端口: " + ipAddress + ":" + port);
        }
    }
}
