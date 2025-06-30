package com.chua.starter.monitor.starter.guacamole;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Guacamole 连接管理器
 * 管理 Guacamole Tunnel 连接的生命周期
 *
 * @author CH
 * @since 2024/12/18
 */
@Component
@Slf4j
public class GuacamoleConnectionManager {

    /**
     * 服务器ID与Tunnel的映射
     */
    private final ConcurrentMap<Integer, GuacamoleTunnel> serverTunnelMap = new ConcurrentHashMap<>();

    /**
     * WebSocket会话与Tunnel的映射
     */
    private final ConcurrentMap<String, GuacamoleTunnel> sessionTunnelMap = new ConcurrentHashMap<>();

    /**
     * 服务器ID与WebSocket会话的映射
     */
    private final ConcurrentMap<Integer, WebSocketSession> serverSessionMap = new ConcurrentHashMap<>();

    /**
     * WebSocket会话与服务器ID的映射
     */
    private final ConcurrentMap<String, Integer> sessionServerMap = new ConcurrentHashMap<>();

    /**
     * 创建 Guacamole 连接
     */
    public GuacamoleTunnel createConnection(Integer serverId, WebSocketSession session, Object guacamoleClient) {
        try {
            log.info("创建 Guacamole 连接: serverId={}, sessionId={}", serverId, session.getId());

            // 如果已存在连接，先断开
            closeConnection(serverId);

            // 创建新的 Tunnel
            GuacamoleTunnel tunnel = new GuacamoleTunnel(session, guacamoleClient);

            // 建立连接
            if (tunnel.connect()) {
                // 保存映射关系
                serverTunnelMap.put(serverId, tunnel);
                sessionTunnelMap.put(session.getId(), tunnel);
                serverSessionMap.put(serverId, session);
                sessionServerMap.put(session.getId(), serverId);

                log.info("Guacamole 连接创建成功: serverId={}, sessionId={}", serverId, session.getId());
                return tunnel;
            } else {
                log.error("Guacamole 连接创建失败: serverId={}, sessionId={}", serverId, session.getId());
                return null;
            }

        } catch (Exception e) {
            log.error("创建 Guacamole 连接异常: serverId={}, sessionId={}, error={}", 
                     serverId, session.getId(), e.getMessage(), e);
            return null;
        }
    }

    /**
     * 获取 Tunnel 连接
     */
    public GuacamoleTunnel getTunnel(Integer serverId) {
        return serverTunnelMap.get(serverId);
    }

    /**
     * 根据会话ID获取 Tunnel 连接
     */
    public GuacamoleTunnel getTunnelBySession(String sessionId) {
        return sessionTunnelMap.get(sessionId);
    }

    /**
     * 获取服务器ID
     */
    public Integer getServerId(String sessionId) {
        return sessionServerMap.get(sessionId);
    }

    /**
     * 获取WebSocket会话
     */
    public WebSocketSession getSession(Integer serverId) {
        return serverSessionMap.get(serverId);
    }

    /**
     * 检查连接是否存在
     */
    public boolean hasConnection(Integer serverId) {
        GuacamoleTunnel tunnel = serverTunnelMap.get(serverId);
        return tunnel != null && tunnel.isConnected();
    }

    /**
     * 检查会话连接是否存在
     */
    public boolean hasConnectionBySession(String sessionId) {
        GuacamoleTunnel tunnel = sessionTunnelMap.get(sessionId);
        return tunnel != null && tunnel.isConnected();
    }

    /**
     * 关闭连接
     */
    public void closeConnection(Integer serverId) {
        try {
            GuacamoleTunnel tunnel = serverTunnelMap.get(serverId);
            if (tunnel != null) {
                log.info("关闭 Guacamole 连接: serverId={}", serverId);
                
                tunnel.disconnect();
                
                // 清理映射关系
                serverTunnelMap.remove(serverId);
                
                WebSocketSession session = serverSessionMap.remove(serverId);
                if (session != null) {
                    sessionTunnelMap.remove(session.getId());
                    sessionServerMap.remove(session.getId());
                }
                
                log.info("Guacamole 连接已关闭: serverId={}", serverId);
            }
        } catch (Exception e) {
            log.error("关闭 Guacamole 连接异常: serverId={}, error={}", serverId, e.getMessage(), e);
        }
    }

    /**
     * 根据会话ID关闭连接
     */
    public void closeConnectionBySession(String sessionId) {
        try {
            Integer serverId = sessionServerMap.get(sessionId);
            if (serverId != null) {
                closeConnection(serverId);
            } else {
                // 直接清理会话相关的映射
                GuacamoleTunnel tunnel = sessionTunnelMap.remove(sessionId);
                if (tunnel != null) {
                    tunnel.disconnect();
                }
                sessionServerMap.remove(sessionId);
            }
        } catch (Exception e) {
            log.error("根据会话ID关闭 Guacamole 连接异常: sessionId={}, error={}", sessionId, e.getMessage(), e);
        }
    }

    /**
     * 发送数据到指定服务器
     */
    public boolean sendData(Integer serverId, String data) {
        try {
            GuacamoleTunnel tunnel = serverTunnelMap.get(serverId);
            if (tunnel != null && tunnel.isConnected()) {
                tunnel.writeToTunnel(data);
                return true;
            } else {
                log.warn("Guacamole 连接不存在或已断开: serverId={}", serverId);
                return false;
            }
        } catch (Exception e) {
            log.error("发送数据到 Guacamole 连接失败: serverId={}, error={}", serverId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 根据会话ID发送数据
     */
    public boolean sendDataBySession(String sessionId, String data) {
        try {
            GuacamoleTunnel tunnel = sessionTunnelMap.get(sessionId);
            if (tunnel != null && tunnel.isConnected()) {
                tunnel.writeToTunnel(data);
                return true;
            } else {
                log.warn("Guacamole 连接不存在或已断开: sessionId={}", sessionId);
                return false;
            }
        } catch (Exception e) {
            log.error("根据会话ID发送数据到 Guacamole 连接失败: sessionId={}, error={}", sessionId, e.getMessage(), e);
            return false;
        }
    }

    /**
     * 获取所有活跃连接数量
     */
    public int getActiveConnectionCount() {
        return (int) serverTunnelMap.values().stream()
                .filter(GuacamoleTunnel::isConnected)
                .count();
    }

    /**
     * 清理所有连接
     */
    public void closeAllConnections() {
        log.info("清理所有 Guacamole 连接");
        
        serverTunnelMap.keySet().forEach(this::closeConnection);
        
        // 确保清理所有映射
        serverTunnelMap.clear();
        sessionTunnelMap.clear();
        serverSessionMap.clear();
        sessionServerMap.clear();
        
        log.info("所有 Guacamole 连接已清理完成");
    }

    /**
     * 设置数据回调
     */
    public void setDataCallback(Integer serverId, GuacamoleTunnel.GuacamoleDataCallback callback) {
        GuacamoleTunnel tunnel = serverTunnelMap.get(serverId);
        if (tunnel != null) {
            tunnel.setDataCallback(callback);
        }
    }
}
