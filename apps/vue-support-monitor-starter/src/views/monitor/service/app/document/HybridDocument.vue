<template>
  <div class="hybrid-document">
    <!-- 加载状态 -->
    <div v-if="loading" class="document-loading">
      <div class="loading-spinner" />
      <p class="loading-text">文档加载中，请稍候...</p>
    </div>

    <!-- 文档内容 -->
    <div v-else class="document-content">
      <!-- 左侧API导航 -->
      <div class="api-sidebar">
        <div class="search-box">
          <el-input v-model="searchQuery" placeholder="搜索API..." prefix-icon="Search" clearable />
        </div>

        <div class="api-tree-container">
          <el-tree
            ref="apiTreeRef"
            :data="apiTreeData"
            :props="{ label: 'name', children: 'apis' }"
            :filter-node-method="filterNode"
            highlight-current
            :expand-on-click-node="false"
            @node-click="handleNodeClick"
          >
            <template #default="{ data }">
              <div class="custom-tree-node">
                <!-- 服务节点 -->
                <template v-if="!data.method">
                  <span class="service-name">
                    <el-icon><Promotion /></el-icon>
                    {{ data.name }}
                  </span>
                  <span class="service-count">{{ data.apis?.length || 0 }}个接口</span>
                </template>
                <!-- API节点 -->
                <template v-else>
                  <span class="api-method" :class="data.method.toLowerCase()">{{ data.method }}</span>
                  <span class="api-name">{{ data.name }}</span>
                </template>
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右侧API内容 -->
      <div class="api-content">
        <!-- 无选中API时的空状态 -->
        <div v-if="!selectedApi" class="empty-api">
          <el-empty description="请选择一个API">
            <template #description>
              <p>从左侧列表选择一个API以查看详情</p>
            </template>
          </el-empty>
        </div>

        <!-- API详情内容 -->
        <div v-else class="api-detail">
          <!-- 顶部导航和动作按钮 -->
          <div class="api-header">
            <div class="api-breadcrumb">
              <el-breadcrumb separator="/">
                <el-breadcrumb-item>{{ getServiceByApi(selectedApi)?.name }}</el-breadcrumb-item>
                <el-breadcrumb-item>{{ selectedApi.name }}</el-breadcrumb-item>
              </el-breadcrumb>
            </div>
            <div class="api-actions">
              <el-button size="small" type="primary" plain @click="copyApiUrl">
                <el-icon><DocumentCopy /></el-icon>
                复制URL
              </el-button>
              <el-button size="small" type="success" plain @click="copyCode('javascript')">
                <el-icon><Connection /></el-icon>
                复制代码
              </el-button>
            </div>
          </div>

          <!-- API内容标签页 -->
          <el-tabs v-model="activeTab" class="api-tabs">
            <!-- API详情标签页 -->
            <el-tab-pane label="API详情" name="detail">
              <!-- 基本信息 -->
              <div class="api-section">
                <h3 class="section-title">基本信息</h3>
                <div class="info-list">
                  <div class="info-item">
                    <span class="item-label">接口名称：</span>
                    <span class="item-value">{{ selectedApi.name }}</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">请求方法：</span>
                    <span class="item-value method" :class="selectedApi.method.toLowerCase()">
                      {{ selectedApi.method }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">请求路径：</span>
                    <span class="item-value path">{{ selectedApi.path }}</span>
                  </div>
                  <div class="info-item">
                    <span class="item-label">描述：</span>
                    <span class="item-value">{{ selectedApi.description || "暂无描述" }}</span>
                  </div>
                </div>
              </div>

              <!-- 请求参数 -->
              <div class="api-section">
                <h3 class="section-title">请求参数</h3>
                <el-table v-if="selectedApi.parameters && selectedApi.parameters.length > 0" :data="selectedApi.parameters" style="width: 100%">
                  <el-table-column prop="name" label="参数名" width="180" />
                  <el-table-column prop="type" label="类型" width="120" />
                  <el-table-column prop="required" label="必填" width="80">
                    <template #default="scope">
                      <el-tag :type="scope.row.required ? 'danger' : 'info'" size="small">
                        {{ scope.row.required ? "是" : "否" }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="description" label="描述" />
                </el-table>
                <el-empty v-else description="暂无请求参数" />
              </div>

              <!-- 响应结果 -->
              <div class="api-section">
                <h3 class="section-title">响应结果</h3>
                <div class="response-examples">
                  <div class="response-tabs">
                    <div class="response-tab" :class="{ active: activeResponse === 'success' }" @click="activeResponse = 'success'">成功响应</div>
                    <div class="response-tab" :class="{ active: activeResponse === 'error' }" @click="activeResponse = 'error'">错误响应</div>
                  </div>
                  <div class="response-content">
                    <pre v-if="selectedApi.responses">{{ JSON.stringify(selectedApi.responses[activeResponse], null, 2) }}</pre>
                    <el-empty v-else description="暂无响应示例" />
                  </div>
                </div>
              </div>
            </el-tab-pane>

            <!-- 在线调试标签页 -->
            <el-tab-pane label="在线调试" name="debug">
              <div class="debug-container">
                <el-form label-position="top">
                  <el-form-item label="请求URL">
                    <el-input :value="fullApiUrl" readonly />
                  </el-form-item>

                  <el-form-item label="请求方法">
                    <el-select v-model="debugMethod" style="width: 100%">
                      <el-option label="GET" value="GET" />
                      <el-option label="POST" value="POST" />
                      <el-option label="PUT" value="PUT" />
                      <el-option label="DELETE" value="DELETE" />
                    </el-select>
                  </el-form-item>

                  <el-form-item label="请求参数">
                    <el-tabs type="border-card">
                      <el-tab-pane label="Query参数">
                        <div v-for="(param, index) in selectedApi.parameters" :key="index" class="param-item">
                          <el-row :gutter="10">
                            <el-col :span="6">
                              <el-input v-model="debugParams[param.name]" :placeholder="param.name" />
                            </el-col>
                            <el-col :span="18">
                              <span class="param-desc">{{ param.description }} {{ param.required ? "(必填)" : "" }}</span>
                            </el-col>
                          </el-row>
                        </div>
                      </el-tab-pane>
                      <el-tab-pane label="Body">
                        <el-input v-model="requestBody" type="textarea" :rows="10" placeholder="请输入请求体 (JSON格式)" />
                      </el-tab-pane>
                      <el-tab-pane label="Headers">
                        <el-button type="primary" plain size="small" @click="addHeader">添加Header</el-button>
                        <div v-for="(value, key, index) in headers" :key="index" class="header-item">
                          <el-row :gutter="10">
                            <el-col :span="6">
                              <el-input v-model="headersKeys[index]" placeholder="Key" @input="updateHeaderKey(index)" />
                            </el-col>
                            <el-col :span="15">
                              <el-input v-model="headers[key]" placeholder="Value" />
                            </el-col>
                            <el-col :span="3">
                              <el-button type="danger" plain icon="Delete" circle @click="removeHeader(key)" />
                            </el-col>
                          </el-row>
                        </div>
                      </el-tab-pane>
                    </el-tabs>
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="sendRequest">发送请求</el-button>
                    <el-button @click="resetDebug">重置</el-button>
                  </el-form-item>

                  <el-form-item v-if="debugResponse" label="响应结果">
                    <div class="debug-response">
                      <div class="response-header">
                        <span class="status-code" :class="responseStatus < 400 ? 'success' : 'error'">状态码: {{ responseStatus }}</span>
                        <span class="response-time">响应时间: {{ responseTime }}ms</span>
                      </div>
                      <pre class="response-body">{{ debugResponse }}</pre>
                    </div>
                  </el-form-item>
                </el-form>
              </div>
            </el-tab-pane>

            <!-- 代码示例标签页 -->
            <el-tab-pane label="代码示例" name="code">
              <div class="code-examples">
                <el-tabs tab-position="left" class="code-tabs">
                  <el-tab-pane label="Java" name="java">
                    <div class="code-action">
                      <el-button size="small" type="primary" plain @click="copyCode('java')">
                        <el-icon><DocumentCopy /></el-icon>
                        复制代码
                      </el-button>
                    </div>
                    <pre v-if="selectedApi.examples?.java" class="code-block">{{ selectedApi.examples.java }}</pre>
                    <el-empty v-else description="暂无Java示例代码" />
                  </el-tab-pane>
                  <el-tab-pane label="Python" name="python">
                    <div class="code-action">
                      <el-button size="small" type="primary" plain @click="copyCode('python')">
                        <el-icon><DocumentCopy /></el-icon>
                        复制代码
                      </el-button>
                    </div>
                    <pre v-if="selectedApi.examples?.python" class="code-block">{{ selectedApi.examples.python }}</pre>
                    <el-empty v-else description="暂无Python示例代码" />
                  </el-tab-pane>
                  <el-tab-pane label="JavaScript" name="javascript">
                    <div class="code-action">
                      <el-button size="small" type="primary" plain @click="copyCode('javascript')">
                        <el-icon><DocumentCopy /></el-icon>
                        复制代码
                      </el-button>
                    </div>
                    <pre v-if="selectedApi.examples?.javascript" class="code-block">{{ selectedApi.examples.javascript }}</pre>
                    <el-empty v-else description="暂无JavaScript示例代码" />
                  </el-tab-pane>
                  <el-tab-pane label="Go" name="go">
                    <div class="code-action">
                      <el-button size="small" type="primary" plain @click="copyCode('go')">
                        <el-icon><DocumentCopy /></el-icon>
                        复制代码
                      </el-button>
                    </div>
                    <pre v-if="selectedApi.examples?.go" class="code-block">{{ selectedApi.examples.go }}</pre>
                    <el-empty v-else description="暂无Go示例代码" />
                  </el-tab-pane>
                </el-tabs>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { message } from "@repo/utils";

// 定义接口类型
interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

interface ApiResponse {
  code: number;
  message: string;
  data: any;
}

interface ApiExample {
  java?: string;
  python?: string;
  javascript?: string;
  go?: string;
}

interface ApiItem {
  id: string;
  name: string;
  path: string;
  method: string;
  description: string;
  serviceId: string;
  parameters?: ApiParameter[];
  responses?: {
    success?: ApiResponse;
    error?: ApiResponse;
  };
  examples?: ApiExample;
}

interface ServiceItem {
  id: string;
  name: string;
  description: string;
  apis?: ApiItem[];
}

// 接收服务列表属性
const props = defineProps<{
  services: ServiceItem[];
}>();

// 状态变量
const loading = ref(true);
const searchQuery = ref("");
const selectedApi = ref<ApiItem | null>(null);
const activeTab = ref("detail");
const activeResponse = ref("success");
const apiTreeRef = ref(null);

// 调试相关状态
const debugMethod = ref("GET");
const debugParams = ref<Record<string, any>>({});
const requestBody = ref("");
const headers = ref<Record<string, string>>({
  "Content-Type": "application/json"
});
const headersKeys = ref<string[]>(["Content-Type"]);
const debugResponse = ref("");
const responseStatus = ref(200);
const responseTime = ref(0);

// 计算属性：API树形数据
const apiTreeData = computed(() => {
  return props.services || [];
});

// 计算属性：获取API完整URL
const fullApiUrl = computed(() => {
  if (!selectedApi.value) return "";
  const baseUrl = `http://example.com/api`;
  return `${baseUrl}${selectedApi.value.path}`;
});

// 方法：通过API获取所属服务
const getServiceByApi = (api: ApiItem | null) => {
  if (!api) return null;
  return props.services.find(service => service.id === api.serviceId);
};

// 方法：处理节点点击
const handleNodeClick = (data: any) => {
  // 如果是API节点，则设置为当前选中API
  if (data.method) {
    selectedApi.value = data;
    // 重置调试状态
    resetDebug();
  }
};

// 方法：根据搜索筛选节点
const filterNode = (value: string, data: any) => {
  if (!value) return true;
  const searchLower = value.toLowerCase();

  // 如果是服务节点，检查服务名是否匹配
  if (!data.method) {
    // 如果服务名匹配，或者服务下的API名称匹配，则显示
    const nameMatch = data.name.toLowerCase().includes(searchLower);

    // 检查服务下的API是否有匹配项
    const hasMatchingApi =
      data.apis && data.apis.some((api: ApiItem) => api.name.toLowerCase().includes(searchLower) || api.path.toLowerCase().includes(searchLower) || api.method.toLowerCase().includes(searchLower));

    return nameMatch || hasMatchingApi;
  }

  // 如果是API节点，检查名称、路径或方法是否匹配
  return data.name.toLowerCase().includes(searchLower) || data.path.toLowerCase().includes(searchLower) || data.method.toLowerCase().includes(searchLower);
};

// 方法：复制API URL
const copyApiUrl = () => {
  if (!selectedApi.value) return;

  const url = fullApiUrl.value;
  navigator.clipboard
    .writeText(url)
    .then(() => {
      message("API URL已复制到剪贴板", { type: "success" });
    })
    .catch(() => {
      message("复制失败，请手动复制", { type: "error" });
    });
};

// 方法：复制代码示例
const copyCode = (language: string) => {
  if (!selectedApi.value || !selectedApi.value.examples || !selectedApi.value.examples[language as keyof ApiExample]) {
    message("没有可用的代码示例", { type: "warning" });
    return;
  }

  const code = selectedApi.value.examples[language as keyof ApiExample];
  navigator.clipboard
    .writeText(code as string)
    .then(() => {
      message(`${language}代码示例已复制到剪贴板`, { type: "success" });
    })
    .catch(() => {
      message("复制失败，请手动复制", { type: "error" });
    });
};

// 调试相关方法
const addHeader = () => {
  const newKey = `header-${Object.keys(headers.value).length}`;
  headers.value[newKey] = "";
  headersKeys.value.push(newKey);
};

const removeHeader = (key: string) => {
  const updatedHeaders: Record<string, string> = { ...headers.value };
  delete updatedHeaders[key];
  headers.value = updatedHeaders;

  // 同步更新headerKeys
  const index = headersKeys.value.indexOf(key);
  if (index !== -1) {
    headersKeys.value.splice(index, 1);
  }
};

const updateHeaderKey = (index: number) => {
  const oldKey = Object.keys(headers.value)[index];
  const newKey = headersKeys.value[index];

  if (oldKey !== newKey) {
    const value = headers.value[oldKey];
    const updatedHeaders: Record<string, string> = { ...headers.value };
    delete updatedHeaders[oldKey];
    updatedHeaders[newKey] = value;
    headers.value = updatedHeaders;
  }
};

const sendRequest = () => {
  // 模拟发送请求
  debugResponse.value = "";
  loading.value = true;

  const startTime = Date.now();

  // 模拟网络延迟
  setTimeout(() => {
    const endTime = Date.now();
    responseTime.value = endTime - startTime;

    // 模拟响应
    if (Math.random() > 0.2) {
      // 成功响应
      responseStatus.value = 200;
      const response = selectedApi.value?.responses?.success || {
        code: 200,
        message: "success",
        data: {
          result: "操作成功",
          timestamp: new Date().toISOString()
        }
      };
      debugResponse.value = JSON.stringify(response, null, 2);
    } else {
      // 错误响应
      responseStatus.value = 500;
      const response = selectedApi.value?.responses?.error || {
        code: 500,
        message: "error",
        data: null
      };
      debugResponse.value = JSON.stringify(response, null, 2);
    }

    loading.value = false;
  }, 1000);
};

const resetDebug = () => {
  debugMethod.value = selectedApi.value?.method || "GET";
  debugParams.value = {};
  requestBody.value = "";
  headers.value = {
    "Content-Type": "application/json"
  };
  headersKeys.value = ["Content-Type"];
  debugResponse.value = "";
};

// 监听搜索条件变化
watch(searchQuery, val => {
  if (apiTreeRef.value) {
    nextTick(() => {
      (apiTreeRef.value as any)?.filter(val);
    });
  }
});

// 监听服务列表变化
watch(
  () => props.services,
  newServices => {
    loading.value = true;

    // 模拟加载延迟
    setTimeout(() => {
      loading.value = false;

      // 如果有服务和API，默认选中第一个API
      if (newServices && newServices.length > 0) {
        const firstService = newServices[0];
        if (firstService.apis && firstService.apis.length > 0) {
          selectedApi.value = firstService.apis[0];
          resetDebug();
        }
      }
    }, 500);
  },
  { immediate: true }
);

// 组件挂载
onMounted(() => {
  // 初始化加载
  loading.value = true;

  setTimeout(() => {
    loading.value = false;

    // 如果有服务和API，默认选中第一个API
    if (props.services && props.services.length > 0) {
      const firstService = props.services[0];
      if (firstService.apis && firstService.apis.length > 0) {
        selectedApi.value = firstService.apis[0];
        resetDebug();
      }
    }
  }, 500);
});
</script>

<style scoped lang="scss">
.hybrid-document {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--el-bg-color);
  display: flex;
  flex-direction: column;

  // 加载状态
  .document-loading {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: rgba(255, 255, 255, 0.9);
    z-index: 10;
    backdrop-filter: blur(4px);

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid var(--el-color-primary-light-8);
      border-top: 4px solid var(--el-color-primary);
      border-radius: 50%;
      margin-bottom: 16px;
      animation: spin 1.5s linear infinite;
    }

    .loading-text {
      font-size: 16px;
      color: var(--el-text-color-secondary);
    }
  }

  // 文档内容区域
  .document-content {
    display: flex;
    height: 100%;
    overflow: hidden;

    // 左侧API导航
    .api-sidebar {
      width: 280px;
      min-width: 280px;
      height: 100%;
      border-right: 1px solid var(--el-border-color-light);
      display: flex;
      flex-direction: column;
      background-color: var(--el-bg-color-overlay);
      transition: width 0.3s;

      // 搜索框
      .search-box {
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-light);
        background-color: var(--el-bg-color);
      }

      // API树容器
      .api-tree-container {
        flex: 1;
        overflow-y: auto;
        padding: 12px 0;

        // 自定义树节点
        .custom-tree-node {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 14px;
          padding-right: 8px;

          // 服务名
          .service-name {
            display: flex;
            align-items: center;
            font-weight: 600;
            color: var(--el-text-color-primary);

            .el-icon {
              margin-right: 6px;
              color: var(--el-color-primary);
            }
          }

          // 服务接口数量
          .service-count {
            font-size: 12px;
            color: var(--el-text-color-secondary);
            background-color: var(--el-fill-color-lighter);
            padding: 2px 6px;
            border-radius: 10px;
          }

          // API方法标签
          .api-method {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            min-width: 50px;
            margin-right: 8px;

            &.get {
              background-color: #e1f5fe;
              color: #0288d1;
            }

            &.post {
              background-color: #e8f5e9;
              color: #388e3c;
            }

            &.put {
              background-color: #fff8e1;
              color: #ffa000;
            }

            &.delete {
              background-color: #ffebee;
              color: #d32f2f;
            }
          }

          // API名称
          .api-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: var(--el-text-color-regular);
          }
        }

        // 树组件自定义样式
        :deep(.el-tree-node__content) {
          height: auto;
          padding: 8px 16px;

          &:hover {
            background-color: var(--el-fill-color-light);
          }

          &.is-current {
            background-color: var(--el-color-primary-light-9);
          }
        }

        :deep(.el-tree-node.is-expanded > .el-tree-node__children) {
          padding-left: 16px;
        }
      }
    }

    // 右侧API内容
    .api-content {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      padding: 20px;

      // 空状态
      .empty-api {
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      // API详情
      .api-detail {
        width: 100%;

        // 顶部导航和动作按钮
        .api-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--el-border-color-light);

          .api-breadcrumb {
            font-size: 16px;
          }

          .api-actions {
            display: flex;
            gap: 10px;
          }
        }

        // API标签页
        .api-tabs {
          width: 100%;

          // API区块
          .api-section {
            margin-bottom: 24px;

            .section-title {
              font-size: 16px;
              font-weight: 600;
              color: var(--el-text-color-primary);
              margin-bottom: 16px;
              padding-left: 10px;
              border-left: 3px solid var(--el-color-primary);
            }

            // 信息列表
            .info-list {
              display: flex;
              flex-direction: column;
              gap: 12px;
              padding: 16px;
              background-color: var(--el-fill-color-lighter);
              border-radius: 8px;

              .info-item {
                display: flex;
                align-items: flex-start;

                .item-label {
                  width: 100px;
                  flex-shrink: 0;
                  font-weight: 500;
                  color: var(--el-text-color-secondary);
                }

                .item-value {
                  flex: 1;
                  word-break: break-all;

                  &.method {
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                    display: inline-block;

                    &.get {
                      background-color: #e1f5fe;
                      color: #0288d1;
                    }

                    &.post {
                      background-color: #e8f5e9;
                      color: #388e3c;
                    }

                    &.put {
                      background-color: #fff8e1;
                      color: #ffa000;
                    }

                    &.delete {
                      background-color: #ffebee;
                      color: #d32f2f;
                    }
                  }

                  &.path {
                    font-family: "Courier New", Courier, monospace;
                    padding: 4px 8px;
                    background-color: var(--el-fill-color);
                    border-radius: 4px;
                  }
                }
              }
            }

            // 响应示例
            .response-examples {
              border: 1px solid var(--el-border-color-light);
              border-radius: 8px;
              overflow: hidden;

              .response-tabs {
                display: flex;
                background-color: var(--el-fill-color);
                border-bottom: 1px solid var(--el-border-color-light);

                .response-tab {
                  padding: 10px 16px;
                  cursor: pointer;
                  font-size: 14px;
                  color: var(--el-text-color-secondary);
                  transition: all 0.3s;

                  &:hover {
                    color: var(--el-color-primary);
                  }

                  &.active {
                    font-weight: 600;
                    color: var(--el-color-primary);
                    border-bottom: 2px solid var(--el-color-primary);
                  }
                }
              }

              .response-content {
                padding: 16px;
                max-height: 400px;
                overflow-y: auto;
                background-color: var(--el-bg-color);

                pre {
                  margin: 0;
                  font-family: "Courier New", Courier, monospace;
                  white-space: pre-wrap;
                  word-break: break-all;
                  font-size: 14px;
                  line-height: 1.5;
                  color: var(--el-text-color-primary);
                }
              }
            }
          }

          // 调试容器
          .debug-container {
            .param-item {
              margin-bottom: 10px;

              .param-desc {
                color: var(--el-text-color-secondary);
                font-size: 13px;
                line-height: 32px;
              }
            }

            .header-item {
              margin-bottom: 10px;
            }

            .debug-response {
              border: 1px solid var(--el-border-color-light);
              border-radius: 8px;
              overflow: hidden;

              .response-header {
                padding: 10px 16px;
                background-color: var(--el-fill-color-light);
                display: flex;
                justify-content: space-between;
                border-bottom: 1px solid var(--el-border-color-light);

                .status-code {
                  font-weight: 600;

                  &.success {
                    color: var(--el-color-success);
                  }

                  &.error {
                    color: var(--el-color-danger);
                  }
                }

                .response-time {
                  color: var(--el-text-color-secondary);
                  font-size: 13px;
                }
              }

              .response-body {
                padding: 16px;
                margin: 0;
                font-family: "Courier New", Courier, monospace;
                white-space: pre-wrap;
                word-break: break-all;
                font-size: 14px;
                line-height: 1.5;
                color: var(--el-text-color-primary);
                max-height: 400px;
                overflow-y: auto;
              }
            }
          }

          // 代码示例
          .code-examples {
            .code-tabs {
              height: 100%;
              border: 1px solid var(--el-border-color-light);
              border-radius: 8px;
              overflow: hidden;

              :deep(.el-tabs__content) {
                padding: 0;
                height: 100%;
              }

              .code-action {
                padding: 10px;
                border-bottom: 1px solid var(--el-border-color-lighter);
                display: flex;
                justify-content: flex-end;
              }

              .code-block {
                padding: 16px;
                margin: 0;
                font-family: "Courier New", Courier, monospace;
                white-space: pre-wrap;
                word-break: break-all;
                font-size: 14px;
                line-height: 1.5;
                color: var(--el-text-color-primary);
                background-color: var(--el-fill-color-light);
                height: 100%;
                max-height: 500px;
                overflow-y: auto;
              }
            }
          }
        }
      }
    }
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .hybrid-document {
    .document-loading {
      background-color: rgba(0, 0, 0, 0.7);

      .loading-text {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .document-content {
      .api-sidebar {
        border-right: 1px solid var(--el-border-color-darker);
        background-color: var(--el-bg-color);
      }

      .api-content {
        .api-detail {
          .api-section {
            .info-list {
              background-color: var(--el-fill-color);
            }

            .response-examples {
              border-color: var(--el-border-color-darker);

              .response-content {
                background-color: var(--el-bg-color-darker);
              }
            }
          }

          .code-examples {
            .code-tabs {
              border-color: var(--el-border-color-darker);

              .code-block {
                background-color: var(--el-bg-color-darker);
              }
            }
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .hybrid-document {
    .document-content {
      flex-direction: column;

      .api-sidebar {
        width: 100%;
        min-width: auto;
        height: auto;
        max-height: 300px;
        border-right: none;
        border-bottom: 1px solid var(--el-border-color-light);
      }

      .api-content {
        height: auto;
      }
    }
  }
}
</style>
