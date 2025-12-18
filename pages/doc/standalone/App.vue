<template>
  <div class="doc-standalone-app">
    <ApiDocViewer
      :api-groups="apiGroups"
      :base-url="baseUrl"
      :title="title"
      :loading="loading"
      :executing="executing"
      :nodes="nodes"
      :config="config"
      @back="handleBack"
      @refresh="handleRefresh"
      @execute="handleExecute"
      @node-change="handleNodeChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ApiDocViewer } from "../src/components";
import type { ApiGroup, ExecuteApiParams, NodeInfo, ApiDocViewerConfig } from "../src/types";

// 配置
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

// 状态
const loading = ref(false);
const executing = ref(false);
const baseUrl = ref("");
const title = ref("API Documentation V2");
const apiGroups = ref<ApiGroup[]>([]);
const nodes = ref<NodeInfo[]>([]);

// 从 URL 参数获取配置
const getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    baseUrl: params.get("baseUrl") || params.get("url") || "",
    title: params.get("title") || "API Documentation V2",
    specUrl: params.get("specUrl") || params.get("spec") || "",
  };
};

// 解析 OpenAPI/Swagger 规范
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
          });
        }
      }
    }
  }

  return Object.values(groups);
};

// 加载 API 规范
const loadApiSpec = async (specUrl: string) => {
  loading.value = true;
  try {
    const response = await fetch(specUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const spec = await response.json();
    
    // 设置基础 URL
    if (spec.servers && spec.servers.length > 0) {
      baseUrl.value = spec.servers[0].url;
    } else if (spec.host) {
      const scheme = spec.schemes?.[0] || "http";
      baseUrl.value = `${scheme}://${spec.host}${spec.basePath || ""}`;
    }

    // 设置标题
    if (spec.info?.title) {
      title.value = spec.info.title;
    }

    // 解析 API
    apiGroups.value = parseOpenApiSpec(spec);
  } catch (error) {
    console.error("Failed to load API spec:", error);
    // 显示错误状态
    apiGroups.value = [{
      name: "错误",
      apis: [{
        path: "/error",
        method: "GET",
        summary: "加载失败",
        description: `无法加载 API 规范: ${(error as Error).message}`,
        parameters: [],
      }]
    }];
  } finally {
    loading.value = false;
  }
};

// 事件处理
const handleBack = () => {
  window.history.back();
};

const handleRefresh = async () => {
  const params = getUrlParams();
  if (params.specUrl) {
    await loadApiSpec(params.specUrl);
  }
};

const handleExecute = async (params: ExecuteApiParams) => {
  executing.value = true;
  try {
    // 构建 URL
    let url = params.baseUrl + params.api.path;
    
    // 替换路径参数
    if (params.pathParams) {
      for (const [key, value] of Object.entries(params.pathParams)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
      }
    }

    // 添加查询参数
    if (params.queryParams && Object.keys(params.queryParams).length > 0) {
      const query = new URLSearchParams(params.queryParams).toString();
      url += `?${query}`;
    }

    // 发送请求
    const startTime = Date.now();
    const response = await fetch(url, {
      method: params.api.method,
      headers: {
        "Content-Type": "application/json",
        ...params.headers,
      },
      body: params.api.method !== "GET" && params.requestBody ? params.requestBody : undefined,
    });

    const duration = Date.now() - startTime;
    const data = await response.text();

    // 获取响应头
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // 尝试解析 JSON
    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = data;
    }

    // 设置响应 (通过 ref 获取组件实例)
    console.log("Response:", {
      status: response.status,
      statusText: response.statusText,
      headers,
      data: parsedData,
      duration,
    });
  } catch (error) {
    console.error("Execute failed:", error);
  } finally {
    executing.value = false;
  }
};

const handleNodeChange = (node: NodeInfo) => {
  baseUrl.value = node.baseUrl;
  console.log("Node changed:", node);
};

// 初始化
onMounted(async () => {
  const params = getUrlParams();
  
  if (params.baseUrl) {
    baseUrl.value = params.baseUrl;
  }
  
  if (params.title) {
    title.value = params.title;
  }

  if (params.specUrl) {
    await loadApiSpec(params.specUrl);
  } else if (params.baseUrl) {
    // 尝试从常见路径加载
    const commonPaths = [
      "/v3/api-docs",
      "/v2/api-docs",
      "/swagger.json",
      "/openapi.json",
    ];

    for (const path of commonPaths) {
      try {
        await loadApiSpec(params.baseUrl + path);
        if (apiGroups.value.length > 0) break;
      } catch {
        continue;
      }
    }
  }
});
</script>

<style>
.doc-standalone-app {
  width: 100%;
  height: 100vh;
  overflow: hidden;
}
</style>
