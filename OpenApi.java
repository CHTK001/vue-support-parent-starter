package com.chua.starter.monitor.starter.pojo;

import com.fasterxml.jackson.annotation.JsonAnyGetter;
import com.fasterxml.jackson.annotation.JsonAnySetter;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.servers.Server;
import lombok.Data;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * OpenAPI 3.0 规范对应的 Java 模型
 * 表示整个 API 文档的根对象
 */
@Data
public class OpenApi {
    /**
     * 指定使用的 OpenAPI 规范版本
     * 默认值为 "3.0.1"
     */
    private String openapi = "3.0.1";

    /**
     * 提供关于 API 的元信息，如标题、版本、描述等
     * 类型：io.swagger.v3.oas.models.info.Info
     */
    private Info info;

    /**
     * 列出 API 的服务器地址和路径前缀
     * 类型：List<io.swagger.v3.oas.models.servers.Server>
     */
    private List<Server> servers = new ArrayList<>();

    /**
     * 定义所有 API 路径及其 HTTP 方法的操作
     * Key: 路径字符串（如 "/users"）
     * Value: 对应路径的操作（GET/POST 等），由 PathItem 表示
     */
    private Map<String, PathItem> paths = new HashMap<>();

    /**
     * 存放可复用的对象定义，如 Schema、响应、参数等
     */
    private Components components;

    /**
     * 用于存储自定义扩展字段（以 x- 开头）
     * 示例：
     * {
     *   "x-api-category": "user"
     * }
     */
    private Map<String, Object> extensions = new HashMap<>(); // 处理 x-openapi 等扩展字段

    @JsonAnyGetter
    public Map<String, Object> getExtensions() {
        return extensions;
    }

    @JsonAnySetter
    public void setExtensions(String key, Object value) {
        extensions.put(key, value);
    }

    /**
     * 表示某个路径下支持的 HTTP 方法及对应的操作
     */
    @Data
    public static class PathItem {
        private Operation post;
        private Operation get;
        private Operation delete;
        // 可根据需要补充 put/head/options 等方法
    }

    /**
     * 具体某个 HTTP 方法的行为定义
     */
    @Data
    public static class Operation {
        /**
         * 接口所属标签（分类用）
         */
        private List<String> tags;

        /**
         * 接口唯一标识符
         */
        private String operationId;

        /**
         * 请求体定义
         */
        private RequestBody requestBody;

        /**
         * 响应定义，Key 为状态码（如 "200", "default"）
         */
        private Map<String, Response> responses = new HashMap<>();

        /**
         * 请求参数列表
         */
        private List<Parameter> parameters;
    }

    /**
     * 定义请求体内容
     */
    @Data
    public static class RequestBody {
        /**
         * 不同媒体类型的请求体格式（如 application/json）
         */
        private Map<String, MediaType> content;

        /**
         * 是否必须传请求体
         */
        private boolean required;
    }

    /**
     * 表示一种媒体类型（如 application/json）的结构
     */
    @Data
    public static class MediaType {
        /**
         * 数据结构定义，可以是内联或通过 $ref 引用
         */
        private Object schema; // 可以是 $ref 或直接定义
    }

    /**
     * 定义一个响应
     */
    @Data
    public static class Response {
        /**
         * 响应描述（如 "成功返回用户数据"）
         */
        private String description;

        /**
         * 响应体内容格式
         */
        private Map<String, MediaType> content;
    }

    /**
     * 定义请求参数
     */
    @Data
    public static class Parameter {
        /**
         * 参数名
         */
        private String name;

        /**
         * 参数位置（query/path/header/cookie）
         */
        private String in;

        /**
         * 是否必填
         */
        private boolean required;

        /**
         * 参数的数据结构定义
         */
        private Object schema;
    }

    /**
     * 存放可复用组件
     */
    @Data
    public static class Components {
        /**
         * 存储模型定义（Schema），可通过 $ref 引用
         */
        private Map<String, Schema> schemas = new HashMap<>();
    }

    /**
     * 表示数据模型的结构
     */
    @Data
    public static class Schema {
        /**
         * 数据类型（如 string, integer, array, object）
         */
        private String type;

        /**
         * 对象属性定义
         */
        private Map<String, Schema> properties = new HashMap<>();

        /**
         * 数组元素类型
         */
        private Object items;

        /**
         * 引用其他 Schema（如 "#/components/schemas/User"）
         */
        private String $ref;

        /**
         * 支持多种类型之一（联合类型）
         */
        private List<Schema> oneOf;

        /**
         * 支持动态属性
         */
        private Map<String, Object> additionalProperties;
    }
}
