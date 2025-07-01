package com.chua.starter.monitor.starter.websocket;

import com.chua.common.support.json.Json;
import com.chua.starter.monitor.starter.entity.MonitorSysGenServer;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerService;
import com.chua.starter.monitor.starter.service.MonitorSysGenServerSettingService;
import lombok.extern.slf4j.Slf4j;
import org.apache.guacamole.GuacamoleException;
import org.apache.guacamole.io.GuacamoleReader;
import org.apache.guacamole.io.GuacamoleWriter;
import org.apache.guacamole.net.GuacamoleTunnel;
import org.apache.guacamole.net.InetGuacamoleSocket;
import org.apache.guacamole.net.SimpleGuacamoleTunnel;
import org.apache.guacamole.protocol.ConfiguredGuacamoleSocket;
import org.apache.guacamole.protocol.GuacamoleConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;

import java.io.IOException;
import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 标准的Guacamole WebSocket隧道端点
 * 基于GuacamoleWebSocketTunnelEndpoint模式实现
 *
 * @author CH
 * @since 2024/12/18
 */
@Component
@Slf4j
public class GuacamoleWebSocketTunnelEndpoint implements WebSocketHandler {

    @Autowired
    private MonitorSysGenServerService serverService;

    @Autowired
    private MonitorSysGenServerSettingService serverSettingService;

    /**
     * 会话到隧道的映射
     */
    private final Map<String, GuacamoleTunnel> sessionTunnelMap = new ConcurrentHashMap<>();

    /**
     * 会话到服务器ID的映射
     */
    private final Map<String, Integer> sessionServerMap = new ConcurrentHashMap<>();

    /**
     * 线程池用于处理隧道数据
     */
    private final ExecutorService executorService = Executors.newCachedThreadPool();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        String sessionId = session.getId();
        log.info("Guacamole WebSocket连接建立: sessionId={}", sessionId);

        try {
            // 从URL参数获取服务器配置
            Integer serverId = getServerIdFromSession(session);
            if (serverId == null) {
                log.error("无法获取服务器ID: sessionId={}", sessionId);
                session.close(CloseStatus.BAD_DATA.withReason("Missing serverId"));
                return;
            }

            // 获取服务器信息
            MonitorSysGenServer server = serverService.getById(serverId);
            if (server == null) {
                log.error("服务器不存在: serverId={}", serverId);
                session.close(CloseStatus.BAD_DATA.withReason("Server not found"));
                return;
            }

            // 创建Guacamole隧道
            GuacamoleTunnel tunnel = createGuacamoleTunnel(server, session);
            if (tunnel == null) {
                log.error("创建Guacamole隧道失败: serverId={}", serverId);
                session.close(CloseStatus.SERVER_ERROR.withReason("Failed to create tunnel"));
                return;
            }

            // 保存映射关系
            sessionTunnelMap.put(sessionId, tunnel);
            sessionServerMap.put(sessionId, serverId);

            // 启动隧道数据读取线程
            startTunnelReader(session, tunnel);

            log.info("Guacamole隧道创建成功: serverId={}, sessionId={}", serverId, sessionId);

        } catch (Exception e) {
            log.error("建立Guacamole连接失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
            session.close(CloseStatus.SERVER_ERROR.withReason("Connection failed"));
        }
    }

    @Override
    public void handleMessage(WebSocketSession session, WebSocketMessage<?> message) throws Exception {
        String sessionId = session.getId();
        GuacamoleTunnel tunnel = sessionTunnelMap.get(sessionId);

        if (tunnel == null) {
            log.warn("未找到对应的隧道: sessionId={}", sessionId);
            return;
        }

        try {
            // 获取隧道写入器
            GuacamoleWriter writer = tunnel.acquireWriter();
            
            // 写入消息到隧道
            String payload = message.getPayload().toString();
            writer.write(payload.toCharArray());
            
            // 释放写入器
            tunnel.releaseWriter();
            
        } catch (GuacamoleException e) {
            log.error("写入隧道数据失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
            // 连接可能已断开，关闭会话
            session.close(CloseStatus.SERVER_ERROR);
        }
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) throws Exception {
        String sessionId = session.getId();
        log.error("WebSocket传输错误: sessionId={}, error={}", sessionId, exception.getMessage(), exception);
        
        // 清理资源
        cleanupSession(sessionId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus closeStatus) throws Exception {
        String sessionId = session.getId();
        log.info("WebSocket连接关闭: sessionId={}, status={}", sessionId, closeStatus);
        
        // 清理资源
        cleanupSession(sessionId);
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    /**
     * 创建Guacamole隧道
     */
    private GuacamoleTunnel createGuacamoleTunnel(MonitorSysGenServer server, WebSocketSession session) {
        try {
            // 创建Guacamole配置
            GuacamoleConfiguration config = createGuacamoleConfiguration(server, session);
            
            // 创建Guacamole Socket
            InetGuacamoleSocket socket = new InetGuacamoleSocket("localhost", 4822);
            ConfiguredGuacamoleSocket configuredSocket = new ConfiguredGuacamoleSocket(socket, config);
            
            // 创建隧道
            SimpleGuacamoleTunnel tunnel = new SimpleGuacamoleTunnel(configuredSocket);
            
            log.info("Guacamole隧道创建成功: serverId={}, protocol={}", 
                    server.getMonitorSysGenServerId(), server.getMonitorSysGenServerProtocol());
            
            return tunnel;
            
        } catch (GuacamoleException e) {
            log.error("创建Guacamole隧道失败: serverId={}, error={}", 
                    server.getMonitorSysGenServerId(), e.getMessage(), e);
            return null;
        }
    }

    /**
     * 创建Guacamole配置
     */
    private GuacamoleConfiguration createGuacamoleConfiguration(MonitorSysGenServer server, WebSocketSession session) {
        GuacamoleConfiguration config = new GuacamoleConfiguration();
        
        String protocol = server.getMonitorSysGenServerProtocol().toLowerCase();
        config.setProtocol(protocol);
        
        // 基本连接参数
        config.setParameter("hostname", server.getMonitorSysGenServerHost());
        config.setParameter("port", String.valueOf(server.getMonitorSysGenServerPort()));
        
        if (server.getMonitorSysGenServerUsername() != null) {
            config.setParameter("username", server.getMonitorSysGenServerUsername());
        }
        
        if (server.getMonitorSysGenServerPassword() != null) {
            config.setParameter("password", server.getMonitorSysGenServerPassword());
        }

        // 协议特定参数
        if ("rdp".equals(protocol)) {
            configureRdpParameters(config, server, session);
        } else if ("vnc".equals(protocol)) {
            configureVncParameters(config, server, session);
        } else if ("ssh".equals(protocol)) {
            configureSshParameters(config, server, session);
        }

        return config;
    }

    /**
     * 配置RDP参数
     */
    private void configureRdpParameters(GuacamoleConfiguration config, MonitorSysGenServer server, WebSocketSession session) {
        // 从URL参数或服务器设置获取配置
        Map<String, String> queryParams = getQueryParameters(session);
        
        config.setParameter("security", queryParams.getOrDefault("security", "any"));
        config.setParameter("ignore-cert", queryParams.getOrDefault("ignore-cert", "true"));
        config.setParameter("server-layout", queryParams.getOrDefault("server-layout", "en-us-qwerty"));
        config.setParameter("width", queryParams.getOrDefault("width", "1920"));
        config.setParameter("height", queryParams.getOrDefault("height", "1080"));
        config.setParameter("color-depth", queryParams.getOrDefault("color-depth", "32"));
        config.setParameter("enable-audio", queryParams.getOrDefault("enable-audio", "true"));
        config.setParameter("enable-printing", queryParams.getOrDefault("enable-printing", "false"));
        config.setParameter("enable-drive", queryParams.getOrDefault("enable-drive", "false"));
        
        log.info("RDP配置: host={}, port={}, security={}, resolution={}x{}", 
                server.getMonitorSysGenServerHost(), 
                server.getMonitorSysGenServerPort(),
                config.getParameter("security"),
                config.getParameter("width"),
                config.getParameter("height"));
    }

    /**
     * 配置VNC参数
     */
    private void configureVncParameters(GuacamoleConfiguration config, MonitorSysGenServer server, WebSocketSession session) {
        Map<String, String> queryParams = getQueryParameters(session);
        
        config.setParameter("color-depth", queryParams.getOrDefault("color-depth", "32"));
        config.setParameter("swap-red-blue", queryParams.getOrDefault("swap-red-blue", "false"));
        config.setParameter("cursor", queryParams.getOrDefault("cursor", "local"));
        config.setParameter("encodings", queryParams.getOrDefault("encodings", "zrle ultra copyrect hextile zlib corre rre raw"));
        config.setParameter("read-only", queryParams.getOrDefault("read-only", "false"));
        
        log.info("VNC配置: host={}, port={}, color-depth={}", 
                server.getMonitorSysGenServerHost(), 
                server.getMonitorSysGenServerPort(),
                config.getParameter("color-depth"));
    }

    /**
     * 配置SSH参数
     */
    private void configureSshParameters(GuacamoleConfiguration config, MonitorSysGenServer server, WebSocketSession session) {
        Map<String, String> queryParams = getQueryParameters(session);
        
        config.setParameter("font-name", queryParams.getOrDefault("font-name", "monospace"));
        config.setParameter("font-size", queryParams.getOrDefault("font-size", "12"));
        config.setParameter("color-scheme", queryParams.getOrDefault("color-scheme", "gray-black"));
        config.setParameter("terminal-type", queryParams.getOrDefault("terminal-type", "xterm"));
        
        log.info("SSH配置: host={}, port={}, font={}", 
                server.getMonitorSysGenServerHost(), 
                server.getMonitorSysGenServerPort(),
                config.getParameter("font-name"));
    }

    /**
     * 启动隧道数据读取线程
     */
    private void startTunnelReader(WebSocketSession session, GuacamoleTunnel tunnel) {
        executorService.submit(() -> {
            String sessionId = session.getId();
            
            try {
                GuacamoleReader reader = tunnel.acquireReader();
                char[] buffer = new char[8192];
                
                while (session.isOpen() && !Thread.currentThread().isInterrupted()) {
                    int length = reader.read(buffer, 0, buffer.length);
                    if (length > 0) {
                        String data = new String(buffer, 0, length);
                        session.sendMessage(new TextMessage(data));
                    }
                }
                
                tunnel.releaseReader();
                
            } catch (Exception e) {
                if (session.isOpen()) {
                    log.error("隧道数据读取失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
                    try {
                        session.close(CloseStatus.SERVER_ERROR);
                    } catch (IOException ioException) {
                        log.error("关闭会话失败: sessionId={}", sessionId, ioException);
                    }
                }
            }
        });
    }

    /**
     * 清理会话资源
     */
    private void cleanupSession(String sessionId) {
        try {
            // 关闭隧道
            GuacamoleTunnel tunnel = sessionTunnelMap.remove(sessionId);
            if (tunnel != null) {
                tunnel.close();
            }
            
            // 清理映射
            Integer serverId = sessionServerMap.remove(sessionId);
            
            log.info("会话资源清理完成: sessionId={}, serverId={}", sessionId, serverId);
            
        } catch (Exception e) {
            log.error("清理会话资源失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
        }
    }

    /**
     * 从会话中获取服务器ID
     */
    private Integer getServerIdFromSession(WebSocketSession session) {
        try {
            URI uri = session.getUri();
            if (uri != null && uri.getQuery() != null) {
                String[] params = uri.getQuery().split("&");
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2 && "serverId".equals(keyValue[0])) {
                        return Integer.valueOf(keyValue[1]);
                    }
                }
            }
        } catch (Exception e) {
            log.error("解析服务器ID失败: {}", e.getMessage(), e);
        }
        return null;
    }

    /**
     * 获取URL查询参数
     */
    private Map<String, String> getQueryParameters(WebSocketSession session) {
        Map<String, String> params = new ConcurrentHashMap<>();
        try {
            URI uri = session.getUri();
            if (uri != null && uri.getQuery() != null) {
                String[] queryParams = uri.getQuery().split("&");
                for (String param : queryParams) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2) {
                        params.put(keyValue[0], keyValue[1]);
                    }
                }
            }
        } catch (Exception e) {
            log.error("解析查询参数失败: {}", e.getMessage(), e);
        }
        return params;
    }
}
