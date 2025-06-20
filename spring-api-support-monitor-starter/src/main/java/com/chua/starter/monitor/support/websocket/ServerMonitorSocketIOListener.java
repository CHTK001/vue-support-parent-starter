package com.chua.starter.monitor.support.websocket;

import com.chua.common.support.json.Json;
import com.chua.socketio.support.session.SocketSessionTemplate;
import com.chua.starter.monitor.support.entity.MonitorDeviceInfo;
import com.chua.starter.monitor.support.entity.MonitorDeviceMetrics;
import com.chua.starter.monitor.support.service.MonitorDeviceService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.listener.DisconnectListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 服务器监控WebSocket监听器
 * @author CH
 * @since 2024/12/19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ServerMonitorSocketIOListener {

    private final SocketIOServer socketIOServer;
    private final SocketSessionTemplate socketSessionTemplate;
    private final MonitorDeviceService deviceService;

    /**
     * 存储客户端连接信息
     */
    private final Map<String, SocketIOClient> clientMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void init() {
        // 连接事件
        socketIOServer.addConnectListener(onConnect());
        
        // 断开连接事件
        socketIOServer.addDisconnectListener(onDisconnect());
        
        // 订阅服务器状态
        socketIOServer.addEventListener("subscribe_server_status", String.class, onSubscribeServerStatus());
        
        // 取消订阅服务器状态
        socketIOServer.addEventListener("unsubscribe_server_status", String.class, onUnsubscribeServerStatus());
        
        // 获取服务器实时指标
        socketIOServer.addEventListener("get_server_metrics", String.class, onGetServerMetrics());
        
        // 获取服务器列表
        socketIOServer.addEventListener("get_server_list", Object.class, onGetServerList());
        
        log.info("服务器监控WebSocket监听器初始化完成");
    }

    /**
     * 客户端连接事件
     */
    private ConnectListener onConnect() {
        return client -> {
            String clientId = client.getSessionId().toString();
            clientMap.put(clientId, client);
            
            log.info("客户端连接: {}, 当前连接数: {}", clientId, clientMap.size());
            
            // 发送连接成功消息
            Map<String, Object> message = new HashMap<>();
            message.put("type", "connection");
            message.put("status", "connected");
            message.put("clientId", clientId);
            message.put("timestamp", LocalDateTime.now());
            
            client.sendEvent("server_monitor_message", message);
        };
    }

    /**
     * 客户端断开连接事件
     */
    private DisconnectListener onDisconnect() {
        return client -> {
            String clientId = client.getSessionId().toString();
            clientMap.remove(clientId);
            
            log.info("客户端断开连接: {}, 当前连接数: {}", clientId, clientMap.size());
        };
    }

    /**
     * 订阅服务器状态
     */
    private DataListener<String> onSubscribeServerStatus() {
        return (client, data, ackSender) -> {
            try {
                String serverId = data;
                String clientId = client.getSessionId().toString();
                
                log.info("客户端 {} 订阅服务器状态: {}", clientId, serverId);
                
                // 将客户端加入到服务器订阅组
                client.joinRoom("server_" + serverId);
                
                // 发送当前服务器状态
                sendServerStatus(client, serverId);
                
                // 发送订阅成功消息
                Map<String, Object> response = new HashMap<>();
                response.put("type", "subscribe_success");
                response.put("serverId", serverId);
                response.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", response);
                
            } catch (Exception e) {
                log.error("订阅服务器状态失败", e);
                
                Map<String, Object> error = new HashMap<>();
                error.put("type", "error");
                error.put("message", "订阅失败: " + e.getMessage());
                error.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", error);
            }
        };
    }

    /**
     * 取消订阅服务器状态
     */
    private DataListener<String> onUnsubscribeServerStatus() {
        return (client, data, ackSender) -> {
            try {
                String serverId = data;
                String clientId = client.getSessionId().toString();
                
                log.info("客户端 {} 取消订阅服务器状态: {}", clientId, serverId);
                
                // 将客户端从服务器订阅组移除
                client.leaveRoom("server_" + serverId);
                
                // 发送取消订阅成功消息
                Map<String, Object> response = new HashMap<>();
                response.put("type", "unsubscribe_success");
                response.put("serverId", serverId);
                response.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", response);
                
            } catch (Exception e) {
                log.error("取消订阅服务器状态失败", e);
            }
        };
    }

    /**
     * 获取服务器实时指标
     */
    private DataListener<String> onGetServerMetrics() {
        return (client, data, ackSender) -> {
            try {
                String serverId = data;
                
                // 获取服务器最新指标
                MonitorDeviceMetrics metrics = deviceService.getLatestMetrics(serverId);
                
                Map<String, Object> response = new HashMap<>();
                response.put("type", "server_metrics");
                response.put("serverId", serverId);
                response.put("metrics", metrics);
                response.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", response);
                
            } catch (Exception e) {
                log.error("获取服务器指标失败", e);
                
                Map<String, Object> error = new HashMap<>();
                error.put("type", "error");
                error.put("message", "获取指标失败: " + e.getMessage());
                error.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", error);
            }
        };
    }

    /**
     * 获取服务器列表
     */
    private DataListener<Object> onGetServerList() {
        return (client, data, ackSender) -> {
            try {
                // 获取服务器列表
                // 这里可以根据需要添加分页和过滤参数
                
                Map<String, Object> response = new HashMap<>();
                response.put("type", "server_list");
                response.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", response);
                
            } catch (Exception e) {
                log.error("获取服务器列表失败", e);
                
                Map<String, Object> error = new HashMap<>();
                error.put("type", "error");
                error.put("message", "获取服务器列表失败: " + e.getMessage());
                error.put("timestamp", LocalDateTime.now());
                
                client.sendEvent("server_monitor_message", error);
            }
        };
    }

    /**
     * 发送服务器状态
     */
    private void sendServerStatus(SocketIOClient client, String serverId) {
        try {
            // 获取服务器信息
            MonitorDeviceInfo deviceInfo = deviceService.getDeviceInfo(serverId);
            MonitorDeviceMetrics metrics = deviceService.getLatestMetrics(serverId);
            
            Map<String, Object> status = new HashMap<>();
            status.put("type", "server_status");
            status.put("serverId", serverId);
            status.put("deviceInfo", deviceInfo);
            status.put("metrics", metrics);
            status.put("timestamp", LocalDateTime.now());
            
            client.sendEvent("server_monitor_message", status);
            
        } catch (Exception e) {
            log.error("发送服务器状态失败", e);
        }
    }

    /**
     * 广播服务器状态变化
     */
    public void broadcastServerStatusChange(String serverId, String status, Object data) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "server_status_change");
            message.put("serverId", serverId);
            message.put("status", status);
            message.put("data", data);
            message.put("timestamp", LocalDateTime.now());
            
            // 发送到订阅该服务器的所有客户端
            socketIOServer.getRoomOperations("server_" + serverId)
                    .sendEvent("server_monitor_message", message);
            
            // 同时发送到通用主题
            socketSessionTemplate.send("gen/server", Json.toJson(message));
            
            log.debug("广播服务器状态变化: serverId={}, status={}", serverId, status);
            
        } catch (Exception e) {
            log.error("广播服务器状态变化失败", e);
        }
    }

    /**
     * 广播服务器指标更新
     */
    public void broadcastServerMetricsUpdate(String serverId, MonitorDeviceMetrics metrics) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "server_metrics_update");
            message.put("serverId", serverId);
            message.put("metrics", metrics);
            message.put("timestamp", LocalDateTime.now());
            
            // 发送到订阅该服务器的所有客户端
            socketIOServer.getRoomOperations("server_" + serverId)
                    .sendEvent("server_monitor_message", message);
            
            // 同时发送到通用主题
            socketSessionTemplate.send("gen/server", Json.toJson(message));
            
            log.debug("广播服务器指标更新: serverId={}", serverId);
            
        } catch (Exception e) {
            log.error("广播服务器指标更新失败", e);
        }
    }

    /**
     * 广播服务器上线
     */
    public void broadcastServerOnline(String serverId, MonitorDeviceInfo deviceInfo) {
        broadcastServerStatusChange(serverId, "online", deviceInfo);
    }

    /**
     * 广播服务器离线
     */
    public void broadcastServerOffline(String serverId, String reason) {
        Map<String, Object> data = new HashMap<>();
        data.put("reason", reason);
        data.put("offlineTime", LocalDateTime.now());
        
        broadcastServerStatusChange(serverId, "offline", data);
    }

    /**
     * 广播服务器错误
     */
    public void broadcastServerError(String serverId, String error) {
        Map<String, Object> data = new HashMap<>();
        data.put("error", error);
        data.put("errorTime", LocalDateTime.now());
        
        broadcastServerStatusChange(serverId, "error", data);
    }

    /**
     * 获取当前连接数
     */
    public int getConnectedClientCount() {
        return clientMap.size();
    }

    /**
     * 获取指定服务器的订阅客户端数
     */
    public int getServerSubscriberCount(String serverId) {
        return socketIOServer.getRoomOperations("server_" + serverId).getClients().size();
    }
}
