package com.chua.starter.monitor.starter.pojo;

import com.chua.starter.monitor.starter.entity.MonitorSysGenPluginNodeLoggerConfig;
import io.swagger.annotations.ApiModel;
import io.swagger.annotations.ApiModelProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;
import java.util.Map;

/**
 * 日志器配置响应DTO
 * 
 * @author CH
 * @since 2025/01/17
 */
@Data
@ApiModel(description = "日志器配置响应")
@Schema(description = "日志器配置响应")
public class LoggerConfigResponse {

    /**
     * 操作是否成功
     */
    @ApiModelProperty(value = "操作是否成功")
    @Schema(description = "操作是否成功")
    private Boolean success;

    /**
     * 响应消息
     */
    @ApiModelProperty(value = "响应消息")
    @Schema(description = "响应消息")
    private String message;

    /**
     * 节点URL
     */
    @ApiModelProperty(value = "节点URL")
    @Schema(description = "节点URL")
    private String nodeUrl;

    /**
     * 日志器配置列表
     */
    @ApiModelProperty(value = "日志器配置列表")
    @Schema(description = "日志器配置列表")
    private List<MonitorSysGenPluginNodeLoggerConfig> loggers;

    /**
     * 配置数量
     */
    @ApiModelProperty(value = "配置数量")
    @Schema(description = "配置数量")
    private Integer count;

    /**
     * 创建成功响应
     *
     * @param loggers 日志器配置列表
     * @return 响应对象
     */
    public static LoggerConfigResponse success(List<MonitorSysGenPluginNodeLoggerConfig> loggers) {
        LoggerConfigResponse response = new LoggerConfigResponse();
        response.setSuccess(true);
        response.setLoggers(loggers);
        response.setCount(loggers != null ? loggers.size() : 0);
        return response;
    }

    /**
     * 创建成功响应
     *
     * @param nodeUrl 节点URL
     * @param loggers 日志器配置列表
     * @return 响应对象
     */
    public static LoggerConfigResponse success(String nodeUrl, List<MonitorSysGenPluginNodeLoggerConfig> loggers) {
        LoggerConfigResponse response = new LoggerConfigResponse();
        response.setSuccess(true);
        response.setNodeUrl(nodeUrl);
        response.setLoggers(loggers);
        response.setCount(loggers != null ? loggers.size() : 0);
        return response;
    }

    /**
     * 创建成功响应
     *
     * @param message 成功消息
     * @return 响应对象
     */
    public static LoggerConfigResponse success(String message) {
        LoggerConfigResponse response = new LoggerConfigResponse();
        response.setSuccess(true);
        response.setMessage(message);
        return response;
    }

    /**
     * 创建错误响应
     *
     * @param message 错误消息
     * @return 响应对象
     */
    public static LoggerConfigResponse error(String message) {
        LoggerConfigResponse response = new LoggerConfigResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}

/**
 * 批量设置结果响应DTO
 */
@Data
@ApiModel(description = "批量设置结果响应")
@Schema(description = "批量设置结果响应")
class BatchSetResponse {

    /**
     * 操作是否成功
     */
    @ApiModelProperty(value = "操作是否成功")
    @Schema(description = "操作是否成功")
    private Boolean success;

    /**
     * 响应消息
     */
    @ApiModelProperty(value = "响应消息")
    @Schema(description = "响应消息")
    private String message;

    /**
     * 各节点的设置结果
     */
    @ApiModelProperty(value = "各节点的设置结果")
    @Schema(description = "各节点的设置结果")
    private Map<String, Boolean> results;

    /**
     * 总节点数
     */
    @ApiModelProperty(value = "总节点数")
    @Schema(description = "总节点数")
    private Integer totalNodes;

    /**
     * 成功数量
     */
    @ApiModelProperty(value = "成功数量")
    @Schema(description = "成功数量")
    private Integer successCount;

    /**
     * 失败数量
     */
    @ApiModelProperty(value = "失败数量")
    @Schema(description = "失败数量")
    private Integer failureCount;

    /**
     * 创建成功响应
     *
     * @param results 设置结果
     * @return 响应对象
     */
    public static BatchSetResponse success(Map<String, Boolean> results) {
        BatchSetResponse response = new BatchSetResponse();
        response.setSuccess(true);
        response.setResults(results);
        
        if (results != null) {
            response.setTotalNodes(results.size());
            response.setSuccessCount((int) results.values().stream().mapToLong(b -> b ? 1 : 0).sum());
            response.setFailureCount(results.size() - response.getSuccessCount());
        }
        
        return response;
    }

    /**
     * 创建错误响应
     *
     * @param message 错误消息
     * @return 响应对象
     */
    public static BatchSetResponse error(String message) {
        BatchSetResponse response = new BatchSetResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}

/**
 * 节点列表响应DTO
 */
@Data
@ApiModel(description = "节点列表响应")
@Schema(description = "节点列表响应")
class NodesListResponse {

    /**
     * 操作是否成功
     */
    @ApiModelProperty(value = "操作是否成功")
    @Schema(description = "操作是否成功")
    private Boolean success;

    /**
     * 响应消息
     */
    @ApiModelProperty(value = "响应消息")
    @Schema(description = "响应消息")
    private String message;

    /**
     * 节点URL列表
     */
    @ApiModelProperty(value = "节点URL列表")
    @Schema(description = "节点URL列表")
    private List<String> nodeUrls;

    /**
     * 节点数量
     */
    @ApiModelProperty(value = "节点数量")
    @Schema(description = "节点数量")
    private Integer count;

    /**
     * 创建成功响应
     *
     * @param nodeUrls 节点URL列表
     * @return 响应对象
     */
    public static NodesListResponse success(List<String> nodeUrls) {
        NodesListResponse response = new NodesListResponse();
        response.setSuccess(true);
        response.setNodeUrls(nodeUrls);
        response.setCount(nodeUrls != null ? nodeUrls.size() : 0);
        return response;
    }

    /**
     * 创建错误响应
     *
     * @param message 错误消息
     * @return 响应对象
     */
    public static NodesListResponse error(String message) {
        NodesListResponse response = new NodesListResponse();
        response.setSuccess(false);
        response.setMessage(message);
        return response;
    }
}
