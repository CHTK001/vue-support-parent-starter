package com.chua.starter.monitor.starter.configuration;

import com.chua.common.support.json.Json;
import com.chua.common.support.utils.MapUtils;
import com.chua.socketio.support.session.SocketSession;
import com.chua.socketio.support.session.SocketSessionTemplate;
import com.chua.socketio.support.session.annotation.OnEvent;
import com.chua.socketio.support.session.annotation.SocketIOListener;
import com.chua.starter.common.support.result.ReturnResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.SpringBootConfiguration;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 文件上传Socket.IO监听器
 * 处理文件上传相关的实时通信
 * 
 * @author CH
 * @since 2024/12/13
 */
@Slf4j
@SpringBootConfiguration
@RequiredArgsConstructor
public class FileUploadSocketIOListener implements SocketIOListener {

    private final SocketSessionTemplate socketSessionTemplate;

    /**
     * 会话映射 - 存储会话ID与用户信息的映射
     */
    private final Map<String, String> sessionUserMap = new ConcurrentHashMap<>();

    /**
     * 文件上传统计信息刷新请求
     */
    @OnEvent("server_file_upload_refresh_statistics")
    public void onRefreshStatistics(SocketSession session, Map<String, Object> data) {
        try {
            log.info("收到文件上传统计信息刷新请求: sessionId={}", session.getSessionId());
            
            // 模拟获取统计信息
            Map<String, Object> statistics = generateMockStatistics();
            
            // 发送统计信息更新
            Map<String, Object> response = new HashMap<>();
            response.put("type", "UPLOAD_STATISTICS");
            response.put("payload", statistics);
            
            session.send("server_file_upload_statistics", Json.toJson(response));
            
            log.info("已发送文件上传统计信息: sessionId={}", session.getSessionId());
            
        } catch (Exception e) {
            log.error("处理文件上传统计信息刷新请求失败: {}", e.getMessage(), e);
            sendErrorMessage(session, "刷新统计信息失败: " + e.getMessage());
        }
    }

    /**
     * 文件上传进度订阅
     */
    @OnEvent("server_file_upload_subscribe")
    public void onSubscribeProgress(SocketSession session, Map<String, Object> data) {
        try {
            String userId = MapUtils.getString(data, "userId", "anonymous");
            sessionUserMap.put(session.getSessionId(), userId);
            
            log.info("用户订阅文件上传进度: sessionId={}, userId={}", session.getSessionId(), userId);
            
            // 发送订阅成功消息
            Map<String, Object> response = new HashMap<>();
            response.put("type", "SUBSCRIPTION_SUCCESS");
            response.put("payload", Map.of("message", "文件上传进度订阅成功"));
            
            session.send("server_file_upload_status", Json.toJson(response));
            
        } catch (Exception e) {
            log.error("处理文件上传进度订阅失败: {}", e.getMessage(), e);
            sendErrorMessage(session, "订阅失败: " + e.getMessage());
        }
    }

    /**
     * 取消文件上传进度订阅
     */
    @OnEvent("server_file_upload_unsubscribe")
    public void onUnsubscribeProgress(SocketSession session, Map<String, Object> data) {
        try {
            String userId = sessionUserMap.remove(session.getSessionId());
            
            log.info("用户取消订阅文件上传进度: sessionId={}, userId={}", session.getSessionId(), userId);
            
            // 发送取消订阅成功消息
            Map<String, Object> response = new HashMap<>();
            response.put("type", "UNSUBSCRIPTION_SUCCESS");
            response.put("payload", Map.of("message", "取消订阅成功"));
            
            session.send("server_file_upload_status", Json.toJson(response));
            
        } catch (Exception e) {
            log.error("处理取消文件上传进度订阅失败: {}", e.getMessage(), e);
            sendErrorMessage(session, "取消订阅失败: " + e.getMessage());
        }
    }

    /**
     * 广播文件上传进度更新
     * 
     * @param taskId 任务ID
     * @param progress 进度信息
     */
    public void broadcastUploadProgress(Integer taskId, Map<String, Object> progress) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "UPLOAD_PROGRESS");
            message.put("payload", progress);
            
            String messageJson = Json.toJson(message);
            socketSessionTemplate.send("server_file_upload_progress", messageJson);
            
            log.debug("广播文件上传进度: taskId={}, progress={}", taskId, progress);
            
        } catch (Exception e) {
            log.error("广播文件上传进度失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 广播文件上传状态变更
     * 
     * @param taskId 任务ID
     * @param status 状态信息
     */
    public void broadcastUploadStatus(Integer taskId, Map<String, Object> status) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "UPLOAD_STATUS_CHANGE");
            message.put("payload", status);
            
            String messageJson = Json.toJson(message);
            socketSessionTemplate.send("server_file_upload_status", messageJson);
            
            log.debug("广播文件上传状态: taskId={}, status={}", taskId, status);
            
        } catch (Exception e) {
            log.error("广播文件上传状态失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 广播队列状态更新
     * 
     * @param queueStatus 队列状态
     */
    public void broadcastQueueStatus(Map<String, Object> queueStatus) {
        try {
            Map<String, Object> message = new HashMap<>();
            message.put("type", "QUEUE_STATUS");
            message.put("payload", queueStatus);
            
            String messageJson = Json.toJson(message);
            socketSessionTemplate.send("server_file_upload_queue", messageJson);
            
            log.debug("广播队列状态: {}", queueStatus);
            
        } catch (Exception e) {
            log.error("广播队列状态失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 发送错误消息
     * 
     * @param session 会话
     * @param errorMessage 错误消息
     */
    private void sendErrorMessage(SocketSession session, String errorMessage) {
        try {
            Map<String, Object> response = new HashMap<>();
            response.put("type", "ERROR");
            response.put("payload", Map.of("message", errorMessage));
            
            session.send("server_file_upload_status", Json.toJson(response));
        } catch (Exception e) {
            log.error("发送错误消息失败: {}", e.getMessage(), e);
        }
    }

    /**
     * 生成模拟统计信息
     * 
     * @return 统计信息
     */
    private Map<String, Object> generateMockStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        statistics.put("totalCount", 156);
        statistics.put("pendingCount", 12);
        statistics.put("processingCount", 8);
        statistics.put("completedCount", 128);
        statistics.put("failedCount", 8);
        statistics.put("cancelledCount", 0);
        statistics.put("successRate", 94.1);
        statistics.put("avgUploadTime", 2.5);
        statistics.put("totalFileSize", 1024 * 1024 * 1024L); // 1GB
        statistics.put("timestamp", System.currentTimeMillis());
        
        return statistics;
    }
}
