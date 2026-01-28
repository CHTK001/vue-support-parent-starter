<template>
  <ApiDocViewer
    ref="docViewerRef"
    :api-groups="apiGroups"
    :base-url="baseUrl"
    :title="nodeInfo.nodeName"
    :loading="loading"
    :executing="executing"
    :show-header="true"
    :config="viewerConfig"
    headers-storage-key="nodeDocGlobalHeaders"
    @back="goBack"
    @refresh="refreshDocs"
    @select="handleApiSelect"
    @execute="handleExecute"
    @copy-response="handleCopyResponse"
    @copy-code="handleCopyCode"
  >
    <template #title-extra>
      <el-tag
        size="small"
        :type="nodeInfo.status === 'ONLINE' ? 'success' : 'danger'"
      >
        {{ nodeInfo.status === "ONLINE" ? "在线" : "离线" }}
      </el-tag>
    </template>

    <template #sidebar-header>
      <!-- 节点地址切换 -->
      <div class="node-selector" v-if="sameNameNodes.length > 1">
        <label class="selector-label">节点地址:</label>
        <el-select
          v-model="currentNodeAddress"
          @change="switchNode"
          size="small"
          style="width: 100%"
        >
          <el-option
            v-for="node in sameNameNodes"
            :key="node.address"
            :label="`${node.address} (${node.status})`"
            :value="node.address"
          >
            <div class="node-option">
              <span class="node-address">{{ node.address }}</span>
              <el-tag
                :type="node.status === 'ONLINE' ? 'success' : 'danger'"
                size="small"
              >
                {{ node.status === "ONLINE" ? "在线" : "离线" }}
              </el-tag>
            </div>
          </el-option>
        </el-select>
      </div>
    </template>
  </ApiDocViewer>
</template>

<script setup lang="ts">
/**
 * 节点 API 文档页面（使用 @pages/doc 模块重构）
 *
 * 这个页面演示了如何使用 @pages/doc 模块来实现 API 文档查看器功能
 */
import { ref, reactive, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { message } from "@repo/utils";
import {
  ApiDocViewer,
  type ApiGroup,
  type ApiInfo,
  type ApiResponse,
  type ExecuteApiParams,
  type ApiDocViewerConfig,
} from "@pages/doc";
import {
  executeNodeApi,
  fetchNodeApiDocs,
} from "@/api/server/node-documentation";

// 路由相关
const route = useRoute();
const router = useRouter();

// 组件引用
const docViewerRef = ref<InstanceType<typeof ApiDocViewer>>();

// 响应式数据
const loading = ref(false);
const executing = ref(false);

// 节点信息
const nodeInfo = reactive({
  nodeId: route.params.nodeId as string,
  nodeName: (route.query.nodeName as string) || "未知节点",
  nodeAddress: (route.query.nodeAddress as string) || "",
  contextPath: (route.query.contextPath as string) || "",
  status: "ONLINE",
});

// 同名节点管理
const sameNameNodes = ref<
  Array<{ address: string; status: string; nodeId: string }>
>([]);
const currentNodeAddress = ref(nodeInfo.nodeAddress);

// API 文档数据
const apiGroups = ref<ApiGroup[]>([]);

// 计算基础 URL
const baseUrl = computed(() => {
  return `http://${nodeInfo.nodeAddress}${nodeInfo.contextPath}`;
});

// 查看器配置
const viewerConfig: ApiDocViewerConfig = {
  showBackButton: true,
  showRefreshButton: true,
  showGlobalHeaders: true,
  showCodeExamples: true,
  editorHeight: "400px",
  codeLanguages: ["java", "javascript", "python", "curl"],
};

// 方法
const goBack = () => {
  router.back();
};

const refreshDocs = async () => {
  await loadApiDocs();
};

// 加载同名节点
const loadSameNameNodes = async () => {
  try {
    // 这里应该调用 API 获取同名节点列表
    sameNameNodes.value = [
      {
        address: nodeInfo.nodeAddress,
        status: "ONLINE",
        nodeId: nodeInfo.nodeId,
      },
    ];
  } catch (error) {
    console.error("加载同名节点失败:", error);
    sameNameNodes.value = [
      {
        address: nodeInfo.nodeAddress,
        status: "ONLINE",
        nodeId: nodeInfo.nodeId,
      },
    ];
  }
};

// 切换节点
const switchNode = async (newAddress: string) => {
  const selectedNode = sameNameNodes.value.find(
    (node) => node.address === newAddress
  );
  if (!selectedNode) return;

  nodeInfo.nodeAddress = newAddress;
  nodeInfo.nodeId = selectedNode.nodeId;
  nodeInfo.status = selectedNode.status;

  await loadApiDocs();
  message.success(`已切换到节点: ${newAddress}`);
};

// 加载 API 文档
const loadApiDocs = async () => {
  loading.value = true;
  try {
    const response = await fetchNodeApiDocs(
      nodeInfo.nodeId,
      nodeInfo.nodeAddress,
      nodeInfo.contextPath
    );

    if (response.success && response.data) {
      apiGroups.value = response.data;
      message.success("API文档加载成功");
    } else {
      // 使用模拟数据
      apiGroups.value = createMockApiGroups();
      message.warning("未获取到API数据，显示模拟数据");
    }
  } catch (error) {
    console.error("加载API文档异常:", error);
    message.error("加载API文档失败");
    apiGroups.value = createMockApiGroups();
  } finally {
    loading.value = false;
  }
};

// 处理 API 选择
const handleApiSelect = (api: ApiInfo) => {
  console.log("选中API:", api);
};

// 处理执行请求
const handleExecute = async (params: ExecuteApiParams) => {
  executing.value = true;
  const startTime = Date.now();

  try {
    const response = await executeNodeApi({
      nodeId: nodeInfo.nodeId,
      nodeAddress: nodeInfo.nodeAddress,
      contextPath: nodeInfo.contextPath,
      api: params.api,
      pathParams: params.pathParams,
      queryParams: params.queryParams,
      requestBody: params.requestBody,
      headers: params.headers,
    });

    const duration = Date.now() - startTime;

    if ((response as any).success && (response as any).data) {
      const apiResponse = (response as any).data;
      const result: ApiResponse = {
        status: apiResponse.status || 200,
        statusText: apiResponse.statusText || "OK",
        headers: apiResponse.headers || {},
        data: apiResponse.data,
        duration,
      };

      // 设置响应到查看器
      docViewerRef.value?.setResponse(result);

      if (apiResponse.status >= 400) {
        message.warning("请求执行完成，但返回了错误状态");
      } else {
        message.success("API执行成功");
      }
    } else {
      const result: ApiResponse = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        data: (response as any).msg || "API执行失败",
        duration,
      };
      docViewerRef.value?.setResponse(result);
      message.error((response as any).msg || "API执行失败");
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    const result: ApiResponse = {
      status: error.status || 500,
      statusText: error.statusText || "Internal Server Error",
      headers: error.headers || {},
      data: error.message || "请求执行失败",
      duration,
    };
    docViewerRef.value?.setResponse(result);
    message.error("请求执行失败");
  } finally {
    executing.value = false;
  }
};

// 处理复制响应
const handleCopyResponse = () => {
  message.success("响应内容已复制到剪贴板");
};

// 处理复制代码
const handleCopyCode = (code: string) => {
  message.success("代码已复制到剪贴板");
};

// 创建模拟 API 数据
const createMockApiGroups = (): ApiGroup[] => {
  return [
    {
      name: "用户管理",
      apis: [
        {
          path: "/api/users",
          method: "GET",
          summary: "获取用户列表",
          description: "获取系统中所有用户的列表信息",
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              type: "integer",
              description: "页码，默认为1",
            },
            {
              name: "size",
              in: "query",
              required: false,
              type: "integer",
              description: "每页大小，默认为10",
            },
          ],
        },
        {
          path: "/api/users/{id}",
          method: "GET",
          summary: "获取用户详情",
          description: "根据用户ID获取用户详细信息",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              type: "string",
              description: "用户ID",
            },
          ],
        },
        {
          path: "/api/users",
          method: "POST",
          summary: "创建用户",
          description: "创建新的用户账户",
          parameters: [],
        },
      ],
    },
    {
      name: "系统监控",
      apis: [
        {
          path: "/actuator/health",
          method: "GET",
          summary: "健康检查",
          description: "获取应用程序健康状态",
          parameters: [],
        },
        {
          path: "/actuator/info",
          method: "GET",
          summary: "应用信息",
          description: "获取应用程序基本信息",
          parameters: [],
        },
      ],
    },
  ];
};

// 生命周期
onMounted(() => {
  loadSameNameNodes();
  loadApiDocs();
});
</script>

<style lang="scss" scoped>
.node-selector {
  margin-bottom: 16px;

  .selector-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #374151;
  }

  .node-option {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .node-address {
      font-size: 13px;
      color: #374151;
    }
  }
}


// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
