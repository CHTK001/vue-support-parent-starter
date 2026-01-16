<template>
  <div class="doc-app">
    <ApiDocViewer
      ref="docViewerRef"
      :api-groups="apiGroups"
      :base-url="baseUrl"
      :title="title"
      :loading="loading"
      :executing="executing"
      :nodes="nodes"
      :config="config"
      headers-storage-key="swaggerGlobalHeaders"
      @back="handleBack"
      @refresh="handleRefresh"
      @execute="handleExecute"
      @node-change="handleNodeChange"
      @select="handleApiSelect"
      @copy-response="handleCopyResponse"
      @copy-code="handleCopyCode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ApiDocViewer } from "@pages/doc";
import type {
  ApiGroup,
  ExecuteApiParams,
  NodeInfo,
  ApiDocViewerConfig,
  ApiInfo,
  ApiResponse,
} from "@pages/doc";
import { fetchOpenApiDoc } from "@/api/doc";
import { http, message } from "@repo/utils";

/**
 * 配置
 */
const config = ref<ApiDocViewerConfig>({
  showBackButton: false,
  showRefreshButton: true,
  showGlobalHeaders: true,
  showCodeExamples: true,
  showHistory: true,
  showExport: true,
  showMock: true,
  showNodeSelector: true,
  editorHeight: "400px",
  codeLanguages: ["java", "javascript", "python", "curl"],
});

/**
 * 组件引用
 */
const docViewerRef = ref<InstanceType<typeof ApiDocViewer>>();

/**
 * 状态
 */
const loading = ref(false);
const executing = ref(false);
const baseUrl = ref("");
const title = ref("API 文档");
const apiGroups = ref<ApiGroup[]>([]);
const nodes = ref<NodeInfo[]>([]);

/**
 * 解析 OpenAPI/Swagger 规范
 * @param spec OpenAPI 规范对象
 * @returns API 分组列表
 */
const parseOpenApiSpec = (spec: any): ApiGroup[] => {
  const groups: Record<string, ApiGroup> = {};

  if (spec.paths) {
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(methods as Record<string, any>)) {
        if (["get", "post", "put", "delete", "patch"].includes(method.toLowerCase())) {
          const tags = operation.tags || ["默认分组"];
          const tag = tags[0];

          if (!groups[tag]) {
            groups[tag] = { name: tag, apis: [] };
          }

          // 解析参数
          const parameters = (operation.parameters || []).map((param: any) => ({
            name: param.name,
            in: param.in,
            required: param.required || false,
            type: param.schema?.type || param.type || "string",
            description: param.description || "",
            default: param.schema?.default || param.default,
            enum: param.schema?.enum || param.enum,
            example: param.schema?.example || param.example,
          }));

          // 解析请求体
          let requestBody = null;
          if (operation.requestBody) {
            const content = operation.requestBody.content;
            const jsonContent = content?.["application/json"];
            if (jsonContent?.schema) {
              requestBody = jsonContent.schema;
            }
          }

          groups[tag].apis.push({
            path,
            method: method.toUpperCase(),
            summary: operation.summary || "",
            description: operation.description || "",
            parameters,
            requestBody,
            responses: operation.responses,
            tags: operation.tags,
            deprecated: operation.deprecated || false,
          });
        }
      }
    }
  }

  return Object.values(groups);
};

/**
 * 加载 API 规范
 */
const loadApiSpec = async () => {
  loading.value = true;
  try {
    const res = await fetchOpenApiDoc();
    const spec = res.data;

    // 设置基础 URL
    if (spec.servers && spec.servers.length > 0) {
      baseUrl.value = spec.servers[0].url;
    } else if (spec.host) {
      const scheme = spec.schemes?.[0] || "http";
      baseUrl.value = `${scheme}://${spec.host}${spec.basePath || ""}`;
    } else {
      // 默认使用当前域名
      baseUrl.value = window.location.origin;
    }

    // 设置标题
    if (spec.info?.title) {
      title.value = spec.info.title;
    }

    // 解析 API
    apiGroups.value = parseOpenApiSpec(spec);
    message.success("API 文档加载成功");
  } catch (error: any) {
    console.error("Failed to load API spec:", error);
    message.error(`加载 API 文档失败: ${error?.message || "未知错误"}`);
    // 显示错误状态
    apiGroups.value = [
      {
        name: "错误",
        apis: [
          {
            path: "/error",
            method: "GET",
            summary: "加载失败",
            description: `无法加载 API 规范: ${error?.message || "未知错误"}`,
            parameters: [],
          },
        ],
      },
    ];
  } finally {
    loading.value = false;
  }
};

/**
 * 处理返回
 */
const handleBack = () => {
  window.history.back();
};

/**
 * 处理刷新
 */
const handleRefresh = async () => {
  await loadApiSpec();
};

/**
 * 处理执行 API
 * @param params 执行参数
 */
const handleExecute = async (params: ExecuteApiParams) => {
  executing.value = true;
  const startTime = Date.now();

  try {
    // 构建 URL
    let url = params.baseUrl + params.api.path;

    // 替换路径参数
    if (params.pathParams) {
      for (const [key, value] of Object.entries(params.pathParams)) {
        url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
      }
    }

    // 添加查询参数
    if (params.queryParams && Object.keys(params.queryParams).length > 0) {
      const queryString = Object.entries(params.queryParams)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join("&");
      url += `?${queryString}`;
    }

    // 准备请求体
    let requestBody: string | undefined;
    if (params.api.method !== "GET" && params.requestBody) {
      requestBody = typeof params.requestBody === "string" 
        ? params.requestBody 
        : JSON.stringify(params.requestBody);
    }

    // 准备请求头
    const headers: Record<string, string> = {
      ...params.headers,
    };
    
    // 如果没有指定 Content-Type，且存在请求体，则设置默认值
    if (!headers["Content-Type"] && !headers["content-type"] && requestBody) {
      headers["Content-Type"] = "application/json";
    }

    // 使用原生 fetch 发送请求（支持跨域）
    const response = await fetch(url, {
      method: params.api.method,
      headers,
      body: requestBody,
    });

    const duration = Date.now() - startTime;

    // 获取响应数据
    const contentType = response.headers.get("content-type") || "";
    let responseData: any;
    
    if (contentType.includes("application/json")) {
      try {
        responseData = await response.json();
      } catch {
        responseData = await response.text();
      }
    } else {
      responseData = await response.text();
    }

    // 获取响应头
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    // 构建响应对象
    const apiResponse: ApiResponse = {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      data: responseData,
      duration,
    };

    // 设置响应到查看器
    docViewerRef.value?.setResponse(apiResponse);

    if (response.status >= 400) {
      message.warning("请求执行完成，但返回了错误状态");
    } else {
      message.success("API 执行成功");
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error("Execute failed:", error);

    // 构建错误响应
    const errorResponse: ApiResponse = {
      status: error?.response?.status || error?.status || 500,
      statusText: error?.response?.statusText || error?.statusText || "Internal Server Error",
      headers: error?.response?.headers || error?.headers || {},
      data: error?.response?.data || error?.data || error?.message || "请求执行失败",
      duration,
    };

    // 设置错误响应到查看器
    docViewerRef.value?.setResponse(errorResponse);
    message.error(error?.message || "API 执行失败");
  } finally {
    executing.value = false;
  }
};

/**
 * 处理节点变更
 * @param node 节点信息
 */
const handleNodeChange = (node: NodeInfo) => {
  baseUrl.value = node.baseUrl;
  console.log("Node changed:", node);
};

/**
 * 处理 API 选择
 * @param api API 信息
 */
const handleApiSelect = (api: ApiInfo) => {
  console.log("选中 API:", api);
};

/**
 * 处理复制响应
 */
const handleCopyResponse = () => {
  message.success("响应内容已复制到剪贴板");
};

/**
 * 处理复制代码
 * @param code 代码内容
 */
const handleCopyCode = (code: string) => {
  message.success("代码已复制到剪贴板");
};

// 初始化
onMounted(async () => {
  await loadApiSpec();
});
</script>

<style scoped lang="scss">
.doc-app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>

