package com.chua.starter.monitor.starter.entity;

import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 服务器WebSocket消息实体
 *
 * @author CH
 * @since 2024/12/23
 */
@ApiModel(description = "服务器WebSocket消息")
@Schema(description = "服务器WebSocket消息")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ServerWebSocketMessage implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 消息类型
     */
    @ApiModelProperty(value = "消息类型")
    @Schema(description = "消息类型")
    private String messageType;

    /**
     * 服务器ID
     */
    @ApiModelProperty(value = "服务器ID")
    @Schema(description = "服务器ID")
    private Integer serverId;

    /**
     * 服务器名称
     */
    @ApiModelProperty(value = "服务器名称")
    @Schema(description = "服务器名称")
    private String serverName;

    /**
     * 服务器主机地址
     */
    @ApiModelProperty(value = "服务器主机地址")
    @Schema(description = "服务器主机地址")
    private String serverHost;

    /**
     * 服务器端口
     */
    @ApiModelProperty(value = "服务器端口")
    @Schema(description = "服务器端口")
    private Integer serverPort;

    /**
     * 连接协议
     */
    @ApiModelProperty(value = "连接协议")
    @Schema(description = "连接协议")
    private String serverProtocol;

    /**
     * 连接状态
     */
    @ApiModelProperty(value = "连接状态")
    @Schema(description = "连接状态")
    private Integer connectionStatus;

    /**
     * 状态描述
     */
    @ApiModelProperty(value = "状态描述")
    @Schema(description = "状态描述")
    private String statusDesc;

    /**
     * 错误消息
     */
    @ApiModelProperty(value = "错误消息")
    @Schema(description = "错误消息")
    private String errorMessage;

    /**
     * 响应时间(毫秒)
     */
    @ApiModelProperty(value = "响应时间(毫秒)")
    @Schema(description = "响应时间(毫秒)")
    private Long responseTime;

    /**
     * 连接时间
     */
    @ApiModelProperty(value = "连接时间")
    @Schema(description = "连接时间")
    private LocalDateTime connectTime;

    /**
     * 消息时间戳
     */
    @ApiModelProperty(value = "消息时间戳")
    @Schema(description = "消息时间戳")
    private Long timestamp;

    /**
     * 扩展数据
     */
    @ApiModelProperty(value = "扩展数据")
    @Schema(description = "扩展数据")
    private Object data;

    /**
     * 消息类型常量
     */
    public static class MessageType {
        public static final String CONNECTION_STATUS_CHANGE = "connection_status_change";
        public static final String SERVER_ONLINE = "server_online";
        public static final String SERVER_OFFLINE = "server_offline";
        public static final String SERVER_UPDATE = "server_update";
        public static final String SERVER_DELETE = "server_delete";
        public static final String SERVER_ADD = "server_add";
        public static final String SERVER_METRICS = "server_metrics";
        public static final String CONNECTION_TEST_RESULT = "connection_test_result";
        public static final String SSH_DATA = "ssh_data";
        public static final String SSH_CONNECT = "ssh_connect";
        public static final String SSH_DISCONNECT = "ssh_disconnect";
        public static final String SSH_ERROR = "ssh_error";
    }

    /**
     * 创建连接状态变化消息
     */
    public static ServerWebSocketMessage createConnectionStatusMessage(
            Integer serverId, String serverName, String serverHost, Integer serverPort, 
            String serverProtocol, Integer connectionStatus, String statusDesc, 
            String errorMessage, Long responseTime) {
        return ServerWebSocketMessage.builder()
                .messageType(MessageType.CONNECTION_STATUS_CHANGE)
                .serverId(serverId)
                .serverName(serverName)
                .serverHost(serverHost)
                .serverPort(serverPort)
                .serverProtocol(serverProtocol)
                .connectionStatus(connectionStatus)
                .statusDesc(statusDesc)
                .errorMessage(errorMessage)
                .responseTime(responseTime)
                .connectTime(LocalDateTime.now())
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建SSH数据消息
     */
    public static ServerWebSocketMessage createSSHDataMessage(
            Integer serverId, String serverName, String data) {
        return ServerWebSocketMessage.builder()
                .messageType(MessageType.SSH_DATA)
                .serverId(serverId)
                .serverName(serverName)
                .data(data)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建SSH连接消息
     */
    public static ServerWebSocketMessage createSSHConnectMessage(
            Integer serverId, String serverName, String serverHost, Integer serverPort) {
        return ServerWebSocketMessage.builder()
                .messageType(MessageType.SSH_CONNECT)
                .serverId(serverId)
                .serverName(serverName)
                .serverHost(serverHost)
                .serverPort(serverPort)
                .serverProtocol("SSH")
                .connectTime(LocalDateTime.now())
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建SSH断开连接消息
     */
    public static ServerWebSocketMessage createSSHDisconnectMessage(
            Integer serverId, String serverName, String reason) {
        return ServerWebSocketMessage.builder()
                .messageType(MessageType.SSH_DISCONNECT)
                .serverId(serverId)
                .serverName(serverName)
                .errorMessage(reason)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建SSH错误消息
     */
    public static ServerWebSocketMessage createSSHErrorMessage(
            Integer serverId, String serverName, String errorMessage) {
        return ServerWebSocketMessage.builder()
                .messageType(MessageType.SSH_ERROR)
                .serverId(serverId)
                .serverName(serverName)
                .errorMessage(errorMessage)
                .timestamp(System.currentTimeMillis())
                .build();
    }

    /**
     * 创建服务器指标消息
     */
    public static ServerWebSocketMessage createServerMetricsMessage(
            Integer serverId, String serverName, Object metricsData) {
        return ServerWebSocketMessage.builder()
                .messageType(MessageType.SERVER_METRICS)
                .serverId(serverId)
                .serverName(serverName)
                .data(metricsData)
                .timestamp(System.currentTimeMillis())
                .build();
    }
}
