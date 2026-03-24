<template>
  <div class="system-container modern-bg api-doc-viewer">
    <!-- 顶部导航栏 -->
    <div class="doc-header" v-if="showHeader">
      <div class="header-left">
        <ScButton 
          v-if="config.showBackButton"
          @click="$emit('back')"
          size="small"
          type="primary"
          plain
        >
          <i class="ri-arrow-left-line"></i>
          返回
        </ScButton>
        <div class="title-info" v-if="title">
          <i class="ri-server-line"></i>
          <span class="title-text">{{ title }}</span>
          <slot name="title-extra"></slot>
        </div>
        <!-- 多节点选择器 -->
        <NodeSelector
          v-if="config.showNodeSelector && internalNodes.length > 0"
          v-model="currentNodeId"
          :nodes="internalNodes"
          :show-manage-button="true"
          :storage-key-prefix="headersStorageKey"
          @change="handleNodeChange"
          @update:nodes="handleNodesUpdate"
        />
      </div>
      <div class="header-right">
        <!-- 导出文档 -->
        <DocExporter
          v-if="config.showExport"
          :api-groups="apiGroups"
          :title="title"
          :base-url="baseUrl"
        />
        <!-- 历史记录 -->
        <ScButton 
          v-if="config.showHistory"
          @click="historyDrawerVisible = true"
          size="small"
        >
          <i class="ri-history-line"></i>
          历史
        </ScButton>
        <!-- Mock 配置 -->
        <ScButton 
          v-if="config.showMock"
          @click="mockDrawerVisible = true"
          size="small"
          :type="mockEnabled ? 'warning' : 'default'"
        >
          <i class="ri-database-2-line"></i>
          Mock
        </ScButton>
        <ScButton 
          v-if="config.showRefreshButton"
          @click="$emit('refresh')"
          :loading="loading"
          size="small"
        >
          <i class="ri-refresh-line"></i>
          刷新
        </ScButton>
        <slot name="header-extra"></slot>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="doc-content">
      <!-- 左侧 API 列表 -->
      <div class="doc-sidebar" :style="{ width: sidebarWidth + 'px' }">
        <!-- 自定义头部插槽 -->
        <div class="sidebar-header" v-if="$slots['sidebar-header']">
          <slot name="sidebar-header"></slot>
        </div>

        <!-- 全局请求头管理 -->
        <div class="global-headers-section" v-if="config.showGlobalHeaders">
          <GlobalHeadersManager
            v-model:headers="internalGlobalHeaders"
            :storage-key="headersStorageKey"
            @save="handleHeadersSave"
          />
        </div>

        <!-- API 树列表 -->
        <ApiTreeList
          :api-groups="apiGroups"
          :selected-api="selectedApi"
          :loading="loading"
          :show-search="true"
          @select="handleApiSelect"
        />
      </div>

      <!-- 拖拽分割线1 -->
      <div
        class="resize-handle resize-handle-1"
        @mousedown="startResize($event, 'sidebar')"
      ></div>

      <!-- 中间参数面板 -->
      <div class="doc-params" :style="{ width: paramsWidth + 'px' }">
        <ApiParamsEditor
          :api="selectedApi"
          v-model:param-values="paramValues"
          v-model:request-body="requestBody"
          :executing="executing"
          :editor-height="config.editorHeight || '300px'"
          @execute="handleExecute"
        />
      </div>

      <!-- 拖拽分割线2 -->
      <div
        class="resize-handle resize-handle-2"
        @mousedown="startResize($event, 'params')"
      ></div>

      <!-- 右侧结果面板 -->
      <div class="doc-result">
        <div class="result-header">
          <ScTabs v-model="activeResultTab" class="result-tabs">
            <ScTabPane label="执行结果" name="result">
              <template #label>
                <span class="tab-label">
                  <i class="ri-play-circle-line"></i>
                  执行结果
                </span>
              </template>
            </ScTabPane>
            <ScTabPane 
              v-if="config.showCodeExamples"
              label="代码示例"
              name="examples"
            >
              <template #label>
                <span class="tab-label">
                  <i class="ri-code-s-slash-line"></i>
                  代码示例
                </span>
              </template>
            </ScTabPane>
          </ScTabs>
          <div class="result-actions">
            <ScButton 
              v-if="activeResultTab === 'result' && lastResponse"
              @click="handleCopyResponse"
              size="small"
            >
              <i class="ri-file-copy-line"></i>
              复制结果
            </ScButton>
            <ScButton v-if="lastResponse" @click="clearResponse" size="small">
              <i class="ri-delete-bin-line"></i>
              清空
            </ScButton>
          </div>
        </div>

        <div class="result-content">
          <!-- 执行结果标签页 -->
          <div v-if="activeResultTab === 'result'" class="result-panel">
            <ApiResponseViewer
              :response="lastResponse"
              :editor-height="config.editorHeight || '400px'"
              @copy="handleCopyResponse"
              @download="handleDownloadResponse"
            />
          </div>
          <!-- 代码示例标签页 -->
          <div
            v-if="activeResultTab === 'examples' && config.showCodeExamples"
            class="code-panel"
          >
            <CodeGenerator
              :api="selectedApi"
              :base-url="baseUrl"
              :path-params="paramValues.path"
              :query-params="paramValues.query"
              :request-body="requestBody"
              :headers="internalGlobalHeaders"
              :supported-languages="config.codeLanguages"
              @copy="handleCopyCode"
            />
          </div>
        </div>
      </div>
    </div>
    <!-- 历史记录抽屉 -->
    <sc-drawer
      v-model="historyDrawerVisible"
      title="请求历史"
      direction="rtl"
      size="400px"
    >
      <ApiHistory
        ref="historyRef"
        @select="handleHistorySelect"
        @replay="handleHistoryReplay"
      />
    </sc-drawer>

    <!-- Mock 配置抽屉 -->
    <sc-drawer
      v-model="mockDrawerVisible"
      title="Mock 配置"
      direction="rtl"
      size="500px"
    >
      <MockDataGenerator
        ref="mockRef"
        :api="selectedApi"
        @mock-enabled="handleMockEnabled"
      />
    </sc-drawer>
  </div>
</template>

<script setup lang="ts">

import ScTabPane from "@repo/components/ScTabs";
import { ref, reactive, watch, computed } from "vue";
import type {
  ApiGroup,
  ApiInfo,
  ApiResponse,
  ParamValues,
  ApiDocViewerConfig,
  ExecuteApiParams,
} from "../types";
import ApiTreeList from "./ApiTreeList.vue";
import ApiParamsEditor from "./ApiParamsEditor.vue";
import ApiResponseViewer from "./ApiResponseViewer.vue";
import CodeGenerator from "./CodeGenerator.vue";
import GlobalHeadersManager from "./GlobalHeadersManager.vue";
import ApiHistory from "./ApiHistory.vue";
import DocExporter from "./DocExporter.vue";
import MockDataGenerator from "./MockDataGenerator.vue";
import NodeSelector from "./NodeSelector.vue";
import { DocStorage, type ApiHistoryRecord } from "../storage";
import type { NodeInfo } from "../types";

const props = withDefaults(
  defineProps<{
    /** API 分组列表 */
    apiGroups: ApiGroup[];
    /** 基础 URL */
    baseUrl: string;
    /** 标题 */
    title?: string;
    /** 是否加载中 */
    loading?: boolean;
    /** 是否正在执行 */
    executing?: boolean;
    /** 是否显示头部 */
    showHeader?: boolean;
    /** 组件配置 */
    config?: ApiDocViewerConfig;
    /** 请求头存储键名 */
    headersStorageKey?: string;
    /** 节点列表 */
    nodes?: NodeInfo[];
  }>(),
  {
    loading: false,
    executing: false,
    showHeader: true,
    config: () => ({
      showBackButton: true,
      showRefreshButton: true,
      showGlobalHeaders: true,
      showCodeExamples: true,
      showHistory: true,
      showExport: true,
      showMock: true,
      showNodeSelector: true,
      editorHeight: "400px",
      codeLanguages: ["java", "javascript", "python", "curl"],
    }),
    headersStorageKey: "apiDocGlobalHeaders",
    nodes: () => [],
  }
);

const emit = defineEmits<{
  (e: "back"): void;
  (e: "refresh"): void;
  (e: "select", api: ApiInfo): void;
  (e: "execute", params: ExecuteApiParams): void;
  (e: "copy-response"): void;
  (e: "download-response"): void;
  (e: "copy-code", code: string): void;
  (e: "headers-save", headers: Record<string, string>): void;
  (e: "node-change", node: NodeInfo): void;
  (e: "update:nodes", nodes: NodeInfo[]): void;
}>();

// 内部状态
const selectedApi = ref<ApiInfo | null>(null);
const paramValues = reactive<ParamValues>({
  path: {},
  query: {},
});
const requestBody = ref("");
const lastResponse = ref<ApiResponse | null>(null);
const activeResultTab = ref("result");
const internalGlobalHeaders = ref<Record<string, string>>({});

// 历史记录和 Mock 状态
const historyDrawerVisible = ref(false);
const mockDrawerVisible = ref(false);
const mockEnabled = ref(false);
const historyRef = ref<InstanceType<typeof ApiHistory> | null>(null);
const mockRef = ref<InstanceType<typeof MockDataGenerator> | null>(null);

// 多节点状态
const currentNodeId = ref<string>("");
const internalNodes = ref<NodeInfo[]>([]);
const currentBaseUrl = computed(() => {
  const node = internalNodes.value.find((n) => n.id === currentNodeId.value);
  return node?.baseUrl || props.baseUrl;
});

// 布局状态
const sidebarWidth = ref(320);
const paramsWidth = ref(400);
const isDragging = ref(false);
const dragType = ref("");

// 初始化节点列表
watch(
  () => props.nodes,
  (newNodes) => {
    if (newNodes && newNodes.length > 0) {
      internalNodes.value = [...newNodes];
      // 如果没有选中节点，默认选中第一个
      if (!currentNodeId.value && newNodes.length > 0) {
        currentNodeId.value = newNodes[0].id;
      }
    }
  },
  { immediate: true }
);

// 方法
const handleApiSelect = (api: ApiInfo) => {
  selectedApi.value = api;
  emit("select", api);
};

const handleExecute = (options?: { timeout: number; retryCount: number }) => {
  if (!selectedApi.value) return;

  emit("execute", {
    baseUrl: currentBaseUrl.value,
    api: selectedApi.value,
    pathParams: paramValues.path,
    queryParams: paramValues.query,
    requestBody: requestBody.value,
    headers: internalGlobalHeaders.value,
    timeout: options?.timeout || 30000,
    retryCount: options?.retryCount || 0,
  });
};

// 节点切换
const handleNodeChange = async (node: NodeInfo) => {
  currentNodeId.value = node.id;
  
  // 加载节点特定的配置
  const nodeHeaders = await DocStorage.getNodeHeaders(node.id);
  if (nodeHeaders && Object.keys(nodeHeaders).length > 0) {
    internalGlobalHeaders.value = nodeHeaders;
  }
  
  emit("node-change", node);
};

// 节点列表更新
const handleNodesUpdate = (nodes: NodeInfo[]) => {
  internalNodes.value = nodes;
  emit("update:nodes", nodes);
};

// 历史记录选择
const handleHistorySelect = (item: ApiHistoryRecord) => {
  // 可以在这里加载历史记录的参数
};

// 重放历史记录
const handleHistoryReplay = (item: ApiHistoryRecord) => {
  // 设置参数并重新执行
  if (item.params) {
    Object.assign(paramValues.query, item.params);
  }
  if (item.requestBody) {
    requestBody.value = item.requestBody;
  }
  historyDrawerVisible.value = false;
};

// Mock 启用切换
const handleMockEnabled = (enabled: boolean) => {
  mockEnabled.value = enabled;
};

const handleCopyResponse = () => {
  emit("copy-response");
};

const handleDownloadResponse = () => {
  emit("download-response");
};

const handleCopyCode = (code: string) => {
  emit("copy-code", code);
};

const handleHeadersSave = (headers: Record<string, string>) => {
  emit("headers-save", headers);
};

const clearResponse = () => {
  lastResponse.value = null;
};

// 设置响应数据（供外部调用）
const setResponse = async (response: ApiResponse) => {
  lastResponse.value = response;
  
  // 保存到历史记录
  if (selectedApi.value) {
    try {
      await DocStorage.addHistory({
        path: selectedApi.value.path,
        method: selectedApi.value.method,
        url: `${currentBaseUrl.value}${selectedApi.value.path}`,
        headers: internalGlobalHeaders.value,
        params: paramValues.query,
        requestBody: requestBody.value,
        statusCode: response.status,
        responseData: response.data,
        duration: response.duration,
        createdAt: Date.now(),
      });
      // 刷新历史记录列表
      historyRef.value?.loadHistory();
    } catch (error) {
      console.error("Failed to save history:", error);
    }
  }
};

// 拖拽调整大小
const startResize = (event: MouseEvent, type: string) => {
  isDragging.value = true;
  dragType.value = type;

  const startX = event.clientX;
  const startSidebarWidth = sidebarWidth.value;
  const startParamsWidth = paramsWidth.value;

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return;

    const deltaX = e.clientX - startX;

    if (type === "sidebar") {
      const newWidth = Math.max(200, Math.min(600, startSidebarWidth + deltaX));
      sidebarWidth.value = newWidth;
    } else if (type === "params") {
      const newWidth = Math.max(300, Math.min(800, startParamsWidth + deltaX));
      paramsWidth.value = newWidth;
    }
  };

  const handleMouseUp = () => {
    isDragging.value = false;
    dragType.value = "";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", handleMouseUp);
  event.preventDefault();
};

// 暴露方法供外部调用
defineExpose({
  setResponse,
  clearResponse,
  selectedApi,
  paramValues,
  requestBody,
  globalHeaders: internalGlobalHeaders,
  mockEnabled,
  historyRef,
  mockRef,
  // 多节点相关
  currentNodeId,
  nodes: internalNodes,
  currentBaseUrl,
});
</script>

<style lang="scss" scoped>
// 主题变量
$primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
$secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
$success-gradient: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
$card-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
$card-hover-shadow: 0 20px 60px -15px rgba(0, 0, 0, 0.2);
$border-radius: 16px;
$transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

.api-doc-viewer {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 50%, #c3cfe2 100%);
  position: relative;

  // 背景装饰
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 300px;
    background: $primary-gradient;
    opacity: 0.05;
    pointer-events: none;
  }

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 32px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(226, 232, 240, 0.8);
    box-shadow: 0 4px 30px rgba(0, 0, 0, 0.06);
    position: relative;
    z-index: 10;

    .header-left {
      display: flex;
      align-items: center;
      gap: 24px;

      .title-info {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 20px;
        font-weight: 800;
        color: #1e293b;
        position: relative;

        i {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: $primary-gradient;
          color: #fff;
          font-size: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .title-text {
          background: $primary-gradient;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
      }
    }

    .header-right {
      display: flex;
      gap: 10px;

      :deep(.el-button) {
        border-radius: 10px;
        font-weight: 500;
        transition: $transition;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  .doc-content {
    flex: 1;
    display: flex;
    height: calc(100vh - 73px);
    padding: 20px;
    gap: 4px;
    position: relative;

    .doc-sidebar {
      min-width: 280px;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: $border-radius;
      box-shadow: $card-shadow;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: $transition;
      border: 1px solid rgba(255, 255, 255, 0.8);

      &:hover {
        box-shadow: $card-hover-shadow;
      }

      .sidebar-header {
        padding: 20px;
        background: linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
        border-bottom: 1px solid rgba(102, 126, 234, 0.1);
      }

      .global-headers-section {
        padding: 16px 20px;
        border-bottom: 1px solid #f1f5f9;
        background: rgba(248, 250, 252, 0.5);
      }
    }

    .resize-handle {
      width: 12px;
      cursor: col-resize;
      background: transparent;
      transition: $transition;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;

      &::before {
        content: "";
        width: 4px;
        height: 40px;
        background: #e2e8f0;
        border-radius: 2px;
        transition: $transition;
      }

      &:hover::before {
        background: $primary-gradient;
        height: 60px;
        box-shadow: 0 0 10px rgba(102, 126, 234, 0.4);
      }
    }

    .doc-params {
      min-width: 350px;
      max-width: 600px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: $border-radius;
      box-shadow: $card-shadow;
      overflow: hidden;
      transition: $transition;
      border: 1px solid rgba(255, 255, 255, 0.8);

      &:hover {
        box-shadow: $card-hover-shadow;
      }
    }

    .doc-result {
      flex: 1;
      min-width: 400px;
      background: rgba(255, 255, 255, 0.98);
      border-radius: $border-radius;
      box-shadow: $card-shadow;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: $transition;
      border: 1px solid rgba(255, 255, 255, 0.8);

      &:hover {
        box-shadow: $card-hover-shadow;
      }

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 20px;
        background: linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.9) 100%);
        border-bottom: 1px solid #e2e8f0;

        .result-tabs {
          margin-bottom: 0;

          :deep(.el-tabs__header) {
            margin-bottom: 0;
            border-bottom: none;
          }

          :deep(.el-tabs__nav-wrap::after) {
            display: none;
          }

          :deep(.el-tabs__item) {
            padding: 0 20px;
            height: 36px;
            line-height: 36px;
            border-radius: 8px;
            margin-right: 8px;
            transition: $transition;

            &:hover {
              color: #667eea;
              background: rgba(102, 126, 234, 0.08);
            }

            &.is-active {
              color: #fff;
              background: $primary-gradient;
              font-weight: 600;
            }
          }
        }

        .tab-label {
          display: flex;
          align-items: center;
          gap: 6px;

          i {
            font-size: 14px;
          }
        }

        .result-actions {
          display: flex;
          gap: 8px;

          :deep(.el-button) {
            border-radius: 8px;
          }
        }
      }

      .result-content {
        flex: 1;
        overflow: hidden;
        padding: 20px;
        background: #fafbfc;

        .result-panel,
        .code-panel {
          height: 100%;
          background: #fff;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.04);
        }
      }
    }
  }
}

// 深色模式支持
.dark {
  .api-doc-viewer {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f1a 100%);

    &::before {
      opacity: 0.1;
    }

    .doc-header {
      background: rgba(26, 26, 46, 0.95);
      border-bottom-color: rgba(255, 255, 255, 0.1);
    }

    .doc-content {
      .doc-sidebar,
      .doc-params,
      .doc-result {
        background: rgba(26, 26, 46, 0.98);
        border-color: rgba(255, 255, 255, 0.1);
      }

      .resize-handle::before {
        background: rgba(255, 255, 255, 0.2);
      }
    }
  }
}

// 动画
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.doc-sidebar,
.doc-params,
.doc-result {
  animation: fadeIn 0.4s ease-out;
}

.doc-params {
  animation-delay: 0.1s;
}

.doc-result {
  animation-delay: 0.2s;
}
</style>
