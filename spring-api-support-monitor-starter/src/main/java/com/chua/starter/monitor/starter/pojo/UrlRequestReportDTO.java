package com.chua.starter.monitor.starter.pojo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

/**
 * URL请求上报数据传输对象
 * 
 * <p>用于封装URL请求上报的相关数据，包括请求方法、URL、客户端信息、服务器信息等。</p>
 * <p>该DTO用于运维客户端向运维服务端上报URL访问数据，服务端将数据存储到Redis时序数据库中。</p>
 *
 * @author CH
 * @since 2025/01/03
 * @version 1.0
 */
@Data
@Schema(description = "URL请求上报数据")
public class UrlRequestReportDTO {

    /**
     * HTTP请求方法
     * 如：GET、POST、PUT、DELETE等
     */
    @NotBlank(message = "请求方法不能为空")
    @Schema(description = "HTTP请求方法", example = "GET", required = true)
    private String method;

    /**
     * 请求URL
     * 完整的请求URL地址
     */
    @NotBlank(message = "请求URL不能为空")
    @Schema(description = "请求URL", example = "https://api.example.com/users", required = true)
    private String url;

    /**
     * 客户端IP地址
     * 发起请求的客户端IP地址
     */
    @NotBlank(message = "客户端IP不能为空")
    @Schema(description = "客户端IP地址", example = "192.168.1.100", required = true)
    private String clientIp;

    /**
     * 服务器IP地址
     * 处理请求的服务器IP地址
     */
    @NotBlank(message = "服务器IP不能为空")
    @Schema(description = "服务器IP地址", example = "192.168.1.10", required = true)
    private String serverIp;

    /**
     * 服务器端口
     * 处理请求的服务器端口号
     */
    @NotNull(message = "服务器端口不能为空")
    @Positive(message = "服务器端口必须为正数")
    @Schema(description = "服务器端口", example = "8080", required = true)
    private Integer serverPort;

    /**
     * 请求时间戳
     * Unix时间戳（秒）
     */
    @NotNull(message = "请求时间戳不能为空")
    @Schema(description = "请求时间戳（秒）", example = "1704268800", required = true)
    private Long timestamp;

    /**
     * 响应时间
     * 请求处理耗时，单位：毫秒
     */
    @Schema(description = "响应时间（毫秒）", example = "150")
    private Long responseTime;

    /**
     * HTTP状态码
     * 响应的HTTP状态码
     */
    @Schema(description = "HTTP状态码", example = "200")
    private Integer statusCode;

    /**
     * 用户代理
     * 客户端的User-Agent信息
     */
    @Schema(description = "用户代理", example = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    private String userAgent;

    /**
     * 引用页面
     * HTTP Referer头信息
     */
    @Schema(description = "引用页面", example = "https://example.com/page")
    private String referer;

    /**
     * 请求大小
     * 请求体大小，单位：字节
     */
    @Schema(description = "请求大小（字节）", example = "1024")
    private Long requestSize;

    /**
     * 响应大小
     * 响应体大小，单位：字节
     */
    @Schema(description = "响应大小（字节）", example = "2048")
    private Long responseSize;

    /**
     * 会话ID
     * 用户会话标识
     */
    @Schema(description = "会话ID", example = "session_123456")
    private String sessionId;

    /**
     * 用户ID
     * 发起请求的用户标识
     */
    @Schema(description = "用户ID", example = "user_789")
    private String userId;

    /**
     * 请求路径
     * URL的路径部分（不包含域名和参数）
     */
    @Schema(description = "请求路径", example = "/api/users")
    private String path;

    /**
     * 查询参数
     * URL的查询参数部分
     */
    @Schema(description = "查询参数", example = "page=1&size=10")
    private String queryParams;

    /**
     * 协议版本
     * HTTP协议版本
     */
    @Schema(description = "协议版本", example = "HTTP/1.1")
    private String protocol;

    /**
     * 是否HTTPS
     * 是否使用HTTPS协议
     */
    @Schema(description = "是否HTTPS", example = "true")
    private Boolean isHttps;

    /**
     * 地理位置信息
     * 客户端的地理位置（可选）
     */
    @Schema(description = "地理位置信息", example = "Beijing, China")
    private String geoLocation;

    /**
     * 设备类型
     * 客户端设备类型（如：PC、Mobile、Tablet等）
     */
    @Schema(description = "设备类型", example = "PC")
    private String deviceType;

    /**
     * 浏览器类型
     * 客户端浏览器类型
     */
    @Schema(description = "浏览器类型", example = "Chrome")
    private String browserType;

    /**
     * 操作系统
     * 客户端操作系统
     */
    @Schema(description = "操作系统", example = "Windows 10")
    private String operatingSystem;

    /**
     * 错误信息
     * 请求处理过程中的错误信息（如果有）
     */
    @Schema(description = "错误信息", example = "Connection timeout")
    private String errorMessage;

    /**
     * 扩展数据
     * 其他自定义数据，JSON格式字符串
     */
    @Schema(description = "扩展数据（JSON格式）", example = "{\"custom_field\": \"custom_value\"}")
    private String extraData;

    /**
     * 服务器ID
     * 关联的服务器ID（可选）
     */
    @Schema(description = "服务器ID", example = "1")
    private Integer serverId;

    /**
     * 应用名称
     * 处理请求的应用名称
     */
    @Schema(description = "应用名称", example = "user-service")
    private String applicationName;

    /**
     * 服务名称
     * 处理请求的服务名称
     */
    @Schema(description = "服务名称", example = "UserController")
    private String serviceName;

    /**
     * 方法名称
     * 处理请求的方法名称
     */
    @Schema(description = "方法名称", example = "getUserList")
    private String methodName;
}
