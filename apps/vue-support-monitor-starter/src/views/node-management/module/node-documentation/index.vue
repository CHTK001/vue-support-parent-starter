<template>
  <div class="node-documentation system-container modern-bg">
    <!-- 顶部导航栏 -->
    <div class="doc-header">
      <div class="header-left">
        <el-button @click="goBack" size="small" type="primary" plain>
          <i class="ri-arrow-left-line"></i>
          返回
        </el-button>
        <div class="node-info">
          <i class="ri-server-line"></i>
          <span class="node-name">{{ nodeInfo.nodeName }}</span>
          <el-tag
            size="small"
            :type="nodeInfo.status === 'ONLINE' ? 'success' : 'danger'"
          >
            {{ nodeInfo.status === "ONLINE" ? "在线" : "离线" }}
          </el-tag>
        </div>
      </div>
      <div class="header-right">
        <el-button @click="refreshDocs" :loading="loading" size="small">
          <i class="ri-refresh-line"></i>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="doc-content">
      <!-- 左侧API列表 -->
      <div class="doc-sidebar" :style="{ width: sidebarWidth + 'px' }">
        <div class="sidebar-header">
          <div class="header-title">
            <i class="ri-code-box-line"></i>
            <h3>API接口</h3>
          </div>

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

          <!-- 全局请求头设置 -->
          <div class="global-headers">
            <div class="headers-title">
              <label class="selector-label">全局请求头:</label>
              <el-button
                @click="showHeaderDialog = true"
                size="small"
                type="primary"
                plain
              >
                <i class="ri-settings-3-line"></i>
                设置
              </el-button>
            </div>
            <div
              class="headers-preview"
              v-if="Object.keys(globalHeaders).length > 0"
            >
              <div
                v-for="(value, key) in globalHeaders"
                :key="key"
                class="header-item"
              >
                <span class="header-key">{{ key }}:</span>
                <span class="header-value">{{ value }}</span>
              </div>
            </div>
            <div v-else class="no-headers">
              <span class="placeholder-text">未设置全局请求头</span>
            </div>
          </div>

          <!-- 搜索框 -->
          <el-input
            v-model="searchKeyword"
            placeholder="搜索接口..."
            size="small"
            clearable
          >
            <template #prefix>
              <i class="ri-search-line"></i>
            </template>
          </el-input>
        </div>

        <div class="api-tree">
          <div v-if="loading" class="loading-container">
            <el-skeleton :rows="5" animated />
          </div>
          <div v-else-if="!apiGroups.length" class="empty-container">
            <el-empty description="暂无API文档" :image-size="80" />
          </div>
          <div v-else class="api-groups">
            <div
              v-for="group in filteredApiGroups"
              :key="group.name"
              class="api-group"
            >
              <div
                class="group-header"
                @click="toggleGroup(group.name)"
                :class="{ expanded: expandedGroups.includes(group.name) }"
              >
                <IconifyIconOnline icon="ri:folder-line" class="group-icon" />
                <span class="group-name">{{ group.name }}</span>
                <span class="api-count">({{ group.apis.length }})</span>
                <IconifyIconOnline
                  icon="ri:arrow-right-s-line"
                  class="expand-icon"
                />
              </div>

              <transition name="slide-down">
                <div
                  v-show="expandedGroups.includes(group.name)"
                  class="group-apis"
                >
                  <div
                    v-for="api in group.apis"
                    :key="api.path + api.method"
                    class="api-item"
                    :class="{
                      active:
                        selectedApi?.path === api.path &&
                        selectedApi?.method === api.method,
                    }"
                    @click="selectApi(api)"
                  >
                    <div class="api-method" :class="api.method.toLowerCase()">
                      {{ api.method }}
                    </div>
                    <div class="api-info">
                      <div class="api-path">{{ api.path }}</div>
                      <div class="api-summary">
                        {{ api.summary || "无描述" }}
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </div>
      </div>

      <!-- 拖拽分割线1 -->
      <div
        class="resize-handle resize-handle-1"
        @mousedown="startResize($event, 'sidebar')"
      ></div>

      <!-- 中间参数面板 -->
      <div class="doc-params" :style="{ width: paramsWidth + 'px' }">
        <div v-if="!selectedApi" class="no-selection">
          <el-empty description="请选择一个API接口" :image-size="120" />
        </div>
        <div v-else class="api-details">
          <!-- API基本信息 -->
          <div class="api-header">
            <div class="api-title">
              <span
                class="method-badge"
                :class="selectedApi.method.toLowerCase()"
              >
                {{ selectedApi.method }}
              </span>
              <span class="api-path">{{ selectedApi.path }}</span>
            </div>
            <div class="api-summary">{{ selectedApi.summary || "无描述" }}</div>

            <!-- 参数控制按钮 -->
            <div class="param-controls">
              <el-button-group size="small">
                <el-button
                  :type="showOnlyRequired ? 'primary' : ''"
                  @click="showOnlyRequired = !showOnlyRequired"
                >
                  <i class="ri-star-line"></i>
                  {{ showOnlyRequired ? "显示全部" : "仅必填" }}
                </el-button>
                <el-button @click="clearAllParams">
                  <i class="ri-delete-bin-line"></i>
                  清空参数
                </el-button>
              </el-button-group>
            </div>
          </div>

          <!-- 参数表单 -->
          <div class="params-section">
            <el-tabs v-model="activeParamTab" class="params-tabs">
              <!-- 路径参数 -->
              <el-tab-pane
                v-if="filteredPathParams.length"
                label="路径参数"
                name="path"
              >
                <div class="param-list">
                  <div
                    v-for="param in filteredPathParams"
                    :key="param.name"
                    class="param-item"
                  >
                    <label class="param-label">
                      {{ param.name }}
                      <span v-if="param.required" class="required">*</span>
                      <el-tag
                        v-if="param.required"
                        type="danger"
                        size="small"
                        class="required-tag"
                      >
                        必填
                      </el-tag>
                    </label>
                    <el-input
                      v-model="paramValues.path[param.name]"
                      :placeholder="param.description || `请输入${param.name}`"
                      size="small"
                    />
                    <div class="param-desc">{{ param.description }}</div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 查询参数 -->
              <el-tab-pane
                v-if="filteredQueryParams.length"
                label="查询参数"
                name="query"
              >
                <div class="param-list">
                  <div
                    v-for="param in filteredQueryParams"
                    :key="param.name"
                    class="param-item"
                  >
                    <label class="param-label">
                      {{ param.name }}
                      <span v-if="param.required" class="required">*</span>
                      <el-tag
                        v-if="param.required"
                        type="danger"
                        size="small"
                        class="required-tag"
                      >
                        必填
                      </el-tag>
                    </label>
                    <el-input
                      v-model="paramValues.query[param.name]"
                      :placeholder="param.description || `请输入${param.name}`"
                      size="small"
                    />
                    <div class="param-desc">{{ param.description }}</div>
                  </div>
                </div>
              </el-tab-pane>

              <!-- 请求体 -->
              <el-tab-pane v-if="hasRequestBody" label="请求体" name="body">
                <div class="body-editor">
                  <codemirror-editor-vue3
                    v-model:value="requestBody"
                    :options="requestBodyEditorOptions"
                    height="300px"
                    placeholder="请输入JSON格式的请求体"
                  />
                </div>
              </el-tab-pane>
            </el-tabs>

            <!-- 执行按钮 -->
            <div class="execute-section">
              <el-button
                type="primary"
                @click="executeApi"
                :loading="executing"
                size="large"
              >
                <i class="ri-play-line"></i>
                执行请求
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 拖拽分割线2 -->
      <div
        class="resize-handle resize-handle-2"
        @mousedown="startResize($event, 'params')"
      ></div>

      <!-- 右侧结果面板 -->
      <div class="doc-result">
        <div class="result-header">
          <el-tabs v-model="activeResultTab" class="result-tabs">
            <el-tab-pane label="执行结果" name="result">
              <template #label>
                <span class="tab-label">
                  <i class="ri-play-circle-line"></i>
                  执行结果
                </span>
              </template>
            </el-tab-pane>
            <el-tab-pane label="代码示例" name="examples">
              <template #label>
                <span class="tab-label">
                  <i class="ri-code-s-slash-line"></i>
                  代码示例
                </span>
              </template>
            </el-tab-pane>
          </el-tabs>
          <div class="result-actions">
            <el-button
              v-if="activeResultTab === 'result' && lastResponse"
              @click="copyResponse"
              size="small"
            >
              <i class="ri-file-copy-line"></i>
              复制结果
            </el-button>
            <el-button
              v-if="activeResultTab === 'examples'"
              @click="copyCodeExample"
              size="small"
            >
              <i class="ri-file-copy-line"></i>
              复制代码
            </el-button>
            <el-button v-if="lastResponse" @click="clearResponse" size="small">
              <i class="ri-delete-bin-line"></i>
              清空
            </el-button>
          </div>
        </div>

        <div class="result-content">
          <!-- 执行结果标签页 -->
          <div v-if="activeResultTab === 'result'">
            <div v-if="!lastResponse" class="no-result">
              <el-empty description="暂无执行结果" :image-size="100" />
            </div>
            <div v-else class="response-container">
              <!-- 响应状态 -->
              <div class="response-status">
                <div class="status-info">
                  <span
                    class="status-code"
                    :class="getStatusClass(lastResponse.status)"
                  >
                    {{ lastResponse.status }}
                  </span>
                  <span class="status-text">{{
                    getStatusText(lastResponse.status)
                  }}</span>
                </div>
                <div class="response-time">
                  <i class="ri-time-line"></i>
                  {{ lastResponse.duration }}ms
                </div>
              </div>

              <!-- 响应头 -->
              <div class="response-headers">
                <div class="section-header" @click="toggleHeadersCollapse">
                  <h4>
                    <i class="ri-file-list-3-line"></i>
                    响应头
                    <span
                      v-if="
                        lastResponse.headers &&
                        Object.keys(lastResponse.headers).length > 0
                      "
                      class="header-count"
                    >
                      ({{ Object.keys(lastResponse.headers).length }})
                    </span>
                  </h4>
                  <div class="header-actions">
                    <el-button
                      size="small"
                      text
                      @click.stop="copyHeaders"
                      v-if="
                        lastResponse.headers &&
                        Object.keys(lastResponse.headers).length > 0
                      "
                    >
                      <i class="ri-file-copy-line"></i>
                      复制
                    </el-button>
                    <el-button
                      size="small"
                      text
                      @click.stop="toggleHeadersCollapse"
                      class="collapse-btn"
                    >
                      <i
                        :class="
                          headersCollapsed
                            ? 'ri-arrow-down-s-line'
                            : 'ri-arrow-up-s-line'
                        "
                      ></i>
                    </el-button>
                  </div>
                </div>
                <el-collapse-transition>
                  <div v-show="!headersCollapsed" class="headers-content">
                    <div
                      v-if="
                        !lastResponse.headers ||
                        Object.keys(lastResponse.headers).length === 0
                      "
                      class="empty-state"
                    >
                      <i class="ri-inbox-line"></i>
                      <span>无响应头信息</span>
                    </div>
                    <div v-else class="headers-table">
                      <div
                        v-for="(value, key) in lastResponse.headers"
                        :key="key"
                        class="header-row"
                      >
                        <div class="header-key">{{ key }}</div>
                        <div class="header-value">{{ value }}</div>
                      </div>
                    </div>
                  </div>
                </el-collapse-transition>
              </div>

              <!-- 响应体 -->
              <div class="response-body">
                <div class="section-header">
                  <h4>
                    <IconifyIconOnline icon="ri:code-box-line" />
                    响应体
                    <span v-if="getContentType()" class="content-type-badge">
                      {{ getContentType() }}
                    </span>
                  </h4>
                  <div class="body-actions">
                    <el-button
                      size="small"
                      text
                      @click="copyResponseBody"
                      v-if="lastResponse.data"
                    >
                      <IconifyIconOnline icon="ri:file-copy-line" />
                      复制
                    </el-button>
                    <el-button
                      size="small"
                      text
                      @click="downloadResponse"
                      v-if="lastResponse.data"
                    >
                      <IconifyIconOnline icon="ri:download-line" />
                      下载
                    </el-button>
                  </div>
                </div>
                <div class="body-content">
                  <div v-if="!lastResponse.data" class="empty-state">
                    <IconifyIconOnline icon="ri:inbox-line" />
                    <span>无响应体内容</span>
                  </div>
                  <!-- JSON 内容 -->
                  <div v-else-if="isJsonContent()" class="json-viewer">
                    <codemirror-editor-vue3
                      v-model:value="formattedResponseData"
                      :options="jsonEditorOptions"
                      height="400px"
                      :read-only="true"
                    />
                  </div>
                  <!-- 图片内容 -->
                  <div v-else-if="isImageContent()" class="image-viewer">
                    <img
                      :src="getImageSrc()"
                      alt="响应图片"
                      class="response-image"
                      @error="handleImageError"
                    />
                  </div>
                  <!-- HTML 内容 -->
                  <div v-else-if="isHtmlContent()" class="html-viewer">
                    <codemirror-editor-vue3
                      v-model:value="lastResponse.data"
                      :options="htmlEditorOptions"
                      height="400px"
                      :read-only="true"
                    />
                  </div>
                  <!-- XML 内容 -->
                  <div v-else-if="isXmlContent()" class="xml-viewer">
                    <codemirror-editor-vue3
                      v-model:value="formattedXmlData"
                      :options="xmlEditorOptions"
                      height="400px"
                      :read-only="true"
                    />
                  </div>
                  <!-- 纯文本内容 -->
                  <div v-else class="text-viewer">
                    <codemirror-editor-vue3
                      v-model:value="lastResponse.data"
                      :options="textEditorOptions"
                      height="400px"
                      :read-only="true"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <!-- 代码示例标签页 -->
          <div v-if="activeResultTab === 'examples'" class="code-examples">
            <div v-if="!selectedApi" class="no-selection">
              <el-empty description="请选择一个API接口" :image-size="100" />
            </div>
            <div v-else class="examples-container">
              <el-tabs v-model="activeLanguageTab" class="language-tabs">
                <el-tab-pane label="Java" name="java">
                  <div class="code-block">
                    <codemirror-editor-vue3
                      v-if="javaCode"
                      :value="javaCode"
                      :options="javaEditorOptions"
                      height="100%"
                      :read-only="true"
                    />
                    <div v-else class="empty-code">
                      <el-empty
                        :description="
                          selectedApi
                            ? '正在生成Java代码...'
                            : '请先选择一个API接口'
                        "
                        :image-size="80"
                      />
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="JavaScript" name="javascript">
                  <div class="code-block">
                    <codemirror-editor-vue3
                      v-if="selectedApi && javascriptCode"
                      :value="javascriptCode"
                      :options="javascriptEditorOptions"
                      height="100%"
                      :read-only="true"
                    />
                    <div v-else class="empty-code">
                      <el-empty
                        :description="
                          selectedApi
                            ? '正在生成JavaScript代码...'
                            : '请先选择一个API接口'
                        "
                        :image-size="80"
                      />
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="Python" name="python">
                  <div class="code-block">
                    <codemirror-editor-vue3
                      v-if="selectedApi && pythonCode"
                      :value="pythonCode"
                      :options="pythonEditorOptions"
                      height="100%"
                      :read-only="true"
                    />
                    <div v-else class="empty-code">
                      <el-empty
                        :description="
                          selectedApi
                            ? '正在生成Python代码...'
                            : '请先选择一个API接口'
                        "
                        :image-size="80"
                      />
                    </div>
                  </div>
                </el-tab-pane>
                <el-tab-pane label="cURL" name="curl">
                  <div class="code-block">
                    <codemirror-editor-vue3
                      v-if="selectedApi && curlCode"
                      :value="curlCode"
                      :options="shellEditorOptions"
                      height="100%"
                      :read-only="true"
                    />
                    <div v-else class="empty-code">
                      <el-empty
                        :description="
                          selectedApi
                            ? '正在生成cURL代码...'
                            : '请先选择一个API接口'
                        "
                        :image-size="80"
                      />
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局请求头设置对话框 -->
    <sc-dialog
      v-model="showHeaderDialog"
      title="全局请求头设置"
      width="600px"
      :before-close="handleHeaderDialogClose"
    >
      <div class="header-dialog-content">
        <div class="dialog-description">
          <p>设置的全局请求头将应用于所有API请求</p>
        </div>

        <div class="header-list">
          <div
            v-for="(header, index) in tempHeaders"
            :key="index"
            class="header-row"
          >
            <el-input
              v-model="header.key"
              placeholder="请求头名称"
              size="small"
              style="flex: 1"
            />
            <el-input
              v-model="header.value"
              placeholder="请求头值"
              size="small"
              style="flex: 2; margin-left: 8px"
            />
            <el-button
              @click="removeHeader(index)"
              size="small"
              type="danger"
              plain
              style="margin-left: 8px"
            >
              <i class="ri-delete-bin-line"></i>
            </el-button>
          </div>
        </div>

        <div class="header-actions">
          <el-button @click="addHeader" size="small" type="primary" plain>
            <i class="ri-add-line"></i>
            添加请求头
          </el-button>
          <el-button
            @click="addCommonHeaders"
            size="small"
            type="success"
            plain
          >
            <i class="ri-magic-line"></i>
            添加常用请求头
          </el-button>
        </div>

        <div class="common-headers-tips">
          <el-collapse>
            <el-collapse-item title="常用请求头示例" name="examples">
              <div class="examples-list">
                <div class="example-item">
                  <strong>Authorization:</strong> Bearer your-token-here
                </div>
                <div class="example-item">
                  <strong>Content-Type:</strong> application/json
                </div>
                <div class="example-item">
                  <strong>Accept:</strong> application/json
                </div>
                <div class="example-item">
                  <strong>X-API-Key:</strong> your-api-key
                </div>
                <div class="example-item">
                  <strong>User-Agent:</strong> NodeDocumentation/1.0
                </div>
              </div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </div>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="resetHeaders" size="small">
            <i class="ri-refresh-line"></i>
            重置
          </el-button>
          <el-button @click="showHeaderDialog = false" size="small">
            取消
          </el-button>
          <el-button @click="saveHeaders" type="primary" size="small">
            <i class="ri-save-line"></i>
            保存
          </el-button>
        </div>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  executeNodeApi,
  fetchNodeApiDocs,
  fetchNodeSwaggerResources,
} from "@/api/server/node-documentation";
import CodemirrorEditorVue3 from "codemirror-editor-vue3";
import { message } from "@repo/utils";
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

// 路由相关
const route = useRoute();
const router = useRouter();

// 响应式数据
const loading = ref(false);
const executing = ref(false);
const searchKeyword = ref("");
const activeParamTab = ref("path");
const activeResultTab = ref("result");
const activeLanguageTab = ref("java");
const showOnlyRequired = ref(false);

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

// 全局请求头管理
const globalHeaders = ref<Record<string, string>>({});
const showHeaderDialog = ref(false);
const tempHeaders = ref<Array<{ key: string; value: string }>>([]);

// 节点接口定义
interface NodeOption {
  address: string;
  status: string;
  nodeId: string;
}

// API文档数据
const apiGroups = ref<ApiGroup[]>([]);
const selectedApi = ref<ApiInfo | null>(null);
const expandedGroups = ref<string[]>([]);

// 参数数据
const paramValues = reactive({
  path: {} as Record<string, string>,
  query: {} as Record<string, string>,
});
const requestBody = ref("");

// 响应数据
const lastResponse = ref<ApiResponse | null>(null);
const headersCollapsed = ref(true); // 默认折叠响应头

// 布局拖拽相关
const sidebarWidth = ref(320);
const paramsWidth = ref(400);
const mainContentWidth = ref(0);
const isDragging = ref(false);
const dragType = ref("");

// 类型定义
interface ApiGroup {
  name: string;
  apis: ApiInfo[];
}

interface ApiInfo {
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: ApiParameter[];
  requestBody?: any;
  responses?: any;
}

interface ApiParameter {
  name: string;
  in: string; // path, query, header, body
  required: boolean;
  type: string;
  description?: string;
}

interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  duration: number;
}

// 计算属性
const filteredApiGroups = computed(() => {
  if (!searchKeyword.value) return apiGroups.value;

  return apiGroups.value
    .map((group) => ({
      ...group,
      apis: group.apis.filter(
        (api) =>
          api.path.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
          api.summary
            ?.toLowerCase()
            .includes(searchKeyword.value.toLowerCase()) ||
          api.method.toLowerCase().includes(searchKeyword.value.toLowerCase())
      ),
    }))
    .filter((group) => group.apis.length > 0);
});

const pathParams = computed(() => {
  return selectedApi.value?.parameters?.filter((p) => p.in === "path") || [];
});

const queryParams = computed(() => {
  return selectedApi.value?.parameters?.filter((p) => p.in === "query") || [];
});

const filteredPathParams = computed(() => {
  const params = pathParams.value;
  return showOnlyRequired.value ? params.filter((p) => p.required) : params;
});

const filteredQueryParams = computed(() => {
  const params = queryParams.value;
  return showOnlyRequired.value ? params.filter((p) => p.required) : params;
});

const hasRequestBody = computed(() => {
  if (!selectedApi.value) return false;
  const method = selectedApi.value.method.toUpperCase();
  // 支持POST、PUT、PATCH、DELETE等需要请求体的方法
  return ["POST", "PUT", "PATCH"].includes(method);
});

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
    // 这里应该调用API获取同名节点列表
    // 暂时使用模拟数据
    const mockNodes = [
      {
        address: nodeInfo.nodeAddress,
        status: "ONLINE",
        nodeId: nodeInfo.nodeId,
      },
    ];

    // TODO: 实际实现中应该调用后端API
    // const response = await fetchSameNameNodes(nodeInfo.nodeName);
    // sameNameNodes.value = response.data || mockNodes;

    sameNameNodes.value = mockNodes;
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

  // 更新当前节点信息
  nodeInfo.nodeAddress = newAddress;
  nodeInfo.nodeId = selectedNode.nodeId;
  nodeInfo.status = selectedNode.status;

  // 重新加载API文档
  await loadApiDocs();

  message.success(`已切换到节点: ${newAddress}`);
};

const loadApiDocs = async () => {
  loading.value = true;
  try {
    console.log("开始加载API文档、接口列表和Swagger资源:", {
      nodeId: nodeInfo.nodeId,
      nodeAddress: nodeInfo.nodeAddress,
      contextPath: nodeInfo.contextPath,
    });

    // 同时调用三个接口
    const [docsResponse, resourcesResponse] = await Promise.allSettled([
      fetchNodeApiDocs(
        nodeInfo.nodeId,
        nodeInfo.nodeAddress,
        nodeInfo.contextPath
      ),
      fetchNodeSwaggerResources(
        nodeInfo.nodeId,
        nodeInfo.nodeAddress,
        nodeInfo.contextPath
      ),
    ]);

    console.log("API文档响应:", docsResponse);
    console.log("Swagger资源响应:", resourcesResponse);

    let hasValidData = false;

    // 处理API文档响应
    if (docsResponse.status === "fulfilled" && docsResponse.value.success) {
      apiGroups.value = docsResponse.value.data || [];
      console.log("API分组数据:", apiGroups.value);
      hasValidData = apiGroups.value.length > 0;
    }

    // 处理Swagger资源响应
    if (
      resourcesResponse.status === "fulfilled" &&
      resourcesResponse.value.success
    ) {
      const resources = resourcesResponse.value.data || [];
      console.log("Swagger资源数据:", resources);

      // 如果前两个接口都没有数据，但有Swagger资源，可以基于资源信息生成基础API结构
      if (!hasValidData && resources.length > 0) {
        apiGroups.value = convertSwaggerResourcesToGroups(resources);
        hasValidData = true;
      }
    }

    // 如果三个接口都没有返回有效数据，使用模拟数据
    if (!hasValidData) {
      console.warn("没有获取到有效的API数据，使用模拟数据");
      apiGroups.value = createMockApiGroups();
    }

    // 默认展开第一个分组
    if (apiGroups.value.length > 0) {
      expandedGroups.value = [apiGroups.value[0].name];
    }

    // 显示加载结果
    if (hasValidData) {
      message.success("API文档加载成功");
    } else {
      message.warning("未获取到API数据，显示模拟数据");
    }
  } catch (error) {
    console.error("加载API文档异常:", error);
    message.error("加载API文档失败: " + (error as Error).message);

    // 异常时也提供模拟数据
    apiGroups.value = createMockApiGroups();
    if (apiGroups.value.length > 0) {
      expandedGroups.value = [apiGroups.value[0].name];
    }
  } finally {
    loading.value = false;
  }
};

const toggleGroup = (groupName: string) => {
  const index = expandedGroups.value.indexOf(groupName);
  if (index > -1) {
    expandedGroups.value.splice(index, 1);
  } else {
    expandedGroups.value.push(groupName);
  }
};

// 生成示例请求体
const generateExampleRequestBody = (api: ApiInfo) => {
  const method = api.method.toUpperCase();
  const path = api.path.toLowerCase();

  // 根据HTTP方法和路径生成相应的示例
  if (method === "POST") {
    if (path.includes("user") || path.includes("account")) {
      return JSON.stringify(
        {
          username: "john_doe",
          email: "john@example.com",
          password: "password123",
          firstName: "John",
          lastName: "Doe",
          phone: "+86 138 0013 8000",
          role: "user",
        },
        null,
        2
      );
    } else if (path.includes("product") || path.includes("item")) {
      return JSON.stringify(
        {
          name: "新产品",
          description: "这是一个新产品的描述",
          price: 299.99,
          category: "electronics",
          brand: "示例品牌",
          inStock: true,
          tags: ["新品", "热销"],
        },
        null,
        2
      );
    } else if (path.includes("order")) {
      return JSON.stringify(
        {
          customerId: 1001,
          items: [
            {
              productId: 2001,
              quantity: 2,
              unitPrice: 299.99,
            },
          ],
          shippingAddress: {
            street: "北京市朝阳区建国路1号",
            city: "北京",
            province: "北京市",
            zipCode: "100000",
            country: "中国",
          },
          paymentMethod: "credit_card",
        },
        null,
        2
      );
    } else {
      return JSON.stringify(
        {
          name: "示例名称",
          description: "示例描述",
          type: "example",
          status: "active",
          metadata: {
            source: "api_test",
            version: "1.0",
          },
        },
        null,
        2
      );
    }
  } else if (method === "PUT") {
    if (path.includes("user") || path.includes("account")) {
      return JSON.stringify(
        {
          id: 1001,
          username: "john_doe_updated",
          email: "john.updated@example.com",
          firstName: "John",
          lastName: "Doe",
          phone: "+86 138 0013 8001",
          status: "active",
          lastModified: new Date().toISOString(),
        },
        null,
        2
      );
    } else if (path.includes("product") || path.includes("item")) {
      return JSON.stringify(
        {
          id: 2001,
          name: "更新的产品名称",
          description: "更新后的产品描述",
          price: 399.99,
          category: "electronics",
          inStock: false,
          lastUpdated: new Date().toISOString(),
        },
        null,
        2
      );
    } else {
      return JSON.stringify(
        {
          id: 1,
          name: "更新的名称",
          description: "更新的描述",
          status: "updated",
          version: 2,
          updatedAt: new Date().toISOString(),
        },
        null,
        2
      );
    }
  } else if (method === "PATCH") {
    if (path.includes("user") || path.includes("account")) {
      return JSON.stringify(
        {
          email: "new.email@example.com",
          phone: "+86 138 0013 8002",
          status: "active",
        },
        null,
        2
      );
    } else if (path.includes("product") || path.includes("item")) {
      return JSON.stringify(
        {
          price: 199.99,
          inStock: true,
          description: "部分更新的产品描述",
        },
        null,
        2
      );
    } else {
      return JSON.stringify(
        {
          status: "updated",
          description: "部分更新的描述",
        },
        null,
        2
      );
    }
  } else {
    // 默认示例
    return JSON.stringify(
      {
        message: "请根据API文档填写请求参数",
        example: "这是一个示例请求体",
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
  }
};

const selectApi = (api: ApiInfo) => {
  selectedApi.value = api;
  // 重置参数值
  paramValues.path = {};
  paramValues.query = {};

  // 为POST/PUT/PATCH请求设置示例请求体
  if (api.method !== "GET" && api.method !== "DELETE") {
    requestBody.value = generateExampleRequestBody(api);
  } else {
    requestBody.value = "";
  }

  // 设置默认参数标签页
  if (pathParams.value.length > 0) {
    activeParamTab.value = "path";
  } else if (queryParams.value.length > 0) {
    activeParamTab.value = "query";
  } else if (hasRequestBody.value) {
    activeParamTab.value = "body";
  }
};

const executeApi = async () => {
  if (!selectedApi.value) return;

  executing.value = true;
  const startTime = Date.now();

  try {
    const response = await executeNodeApi({
      nodeId: nodeInfo.nodeId,
      nodeAddress: nodeInfo.nodeAddress,
      contextPath: nodeInfo.contextPath,
      api: selectedApi.value,
      pathParams: paramValues.path,
      queryParams: paramValues.query,
      requestBody: requestBody.value,
      headers: globalHeaders.value, // 使用全局请求头
    });

    const duration = Date.now() - startTime;

    // 检查响应是否成功
    if ((response as any).success && (response as any).data) {
      const apiResponse = (response as any).data;
      lastResponse.value = {
        status: apiResponse.status || 200,
        statusText: apiResponse.statusText || "OK",
        headers: apiResponse.headers || {},
        data: apiResponse.data,
        duration,
      };

      if (apiResponse.status >= 400) {
        message.warning("请求执行完成，但返回了错误状态");
      } else {
        message.success("API执行成功");
      }
    } else {
      // 如果响应不成功，显示错误信息
      lastResponse.value = {
        status: 500,
        statusText: "Internal Server Error",
        headers: {},
        data: (response as any).msg || "API执行失败",
        duration,
      };
      message.error((response as any).msg || "API执行失败");
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    lastResponse.value = {
      status: error.status || 500,
      statusText: error.statusText || "Internal Server Error",
      headers: error.headers || {},
      data: error.message || "请求执行失败",
      duration,
    };
    message.error("请求执行失败");
  } finally {
    executing.value = false;
  }
};

const copyResponse = () => {
  if (!lastResponse.value) return;

  const content = JSON.stringify(lastResponse.value.data, null, 2);
  navigator.clipboard
    .writeText(content)
    .then(() => {
      message.success("响应内容已复制到剪贴板");
    })
    .catch(() => {
      message.error("复制失败");
    });
};

const clearResponse = () => {
  lastResponse.value = null;
};

const clearAllParams = () => {
  paramValues.path = {};
  paramValues.query = {};
  requestBody.value = "";
  message.success("已清空所有参数");
};

const copyCodeExample = () => {
  let code = "";
  switch (activeLanguageTab.value) {
    case "java":
      code = javaCode.value;
      break;
    case "javascript":
      code = javascriptCode.value;
      break;
    case "python":
      code = pythonCode.value;
      break;
    case "curl":
      code = curlCode.value;
      break;
    default:
      code = javaCode.value;
  }

  navigator.clipboard
    .writeText(code)
    .then(() => {
      message.success("代码已复制到剪贴板");
    })
    .catch(() => {
      message.error("复制失败");
    });
};

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400 && status < 500) return "error";
  if (status >= 500) return "danger";
  return "info";
};

const getStatusText = (status: number) => {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    500: "Internal Server Error",
  };
  return statusTexts[status] || "Unknown";
};

// 代码生成方法
const generateJavaCode = () => {
  if (!selectedApi.value) return "";

  const api = selectedApi.value;
  const baseUrl = `http://${nodeInfo.nodeAddress}${nodeInfo.contextPath}`;
  let url = baseUrl + api.path;

  // 替换路径参数
  Object.entries(paramValues.path).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value || `{${key}}`);
  });

  // 构建查询参数
  const queryString = Object.entries(paramValues.query)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  if (queryString) {
    url += `?${queryString}`;
  }

  let code = `// Java - 使用 OkHttp
import okhttp3.*;
import java.io.IOException;

public class ApiClient {
    private static final OkHttpClient client = new OkHttpClient();

    public void callApi() throws IOException {
        String url = "${url}";

        // 构建请求头
        Headers.Builder headersBuilder = new Headers.Builder();`;

  // 添加全局请求头
  Object.entries(globalHeaders.value).forEach(([key, value]) => {
    code += `\n        headersBuilder.add("${key}", "${value}");`;
  });

  if (api.method === "GET") {
    code += `

        // 构建GET请求
        Request request = new Request.Builder()
            .url(url)
            .headers(headersBuilder.build())
            .get()
            .build();

        // 执行请求
        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                System.out.println("Response: " + response.body().string());
            }
        }
    }
}`;
  } else {
    const bodyContent = requestBody.value
      ? requestBody.value.replace(/"/g, '\\"')
      : "{}";
    code += `
        headersBuilder.add("Content-Type", "application/json");

        // 请求体
        String jsonBody = "${bodyContent}";
        RequestBody body = RequestBody.create(jsonBody, MediaType.get("application/json"));

        // 构建${api.method}请求
        Request request = new Request.Builder()
            .url(url)
            .headers(headersBuilder.build())
            .method("${api.method}", body)
            .build();

        // 执行请求
        try (Response response = client.newCall(request).execute()) {
            if (response.body() != null) {
                System.out.println("Response: " + response.body().string());
            }
        }
    }
}`;
  }

  return code;
};

const generateJavaScriptCode = () => {
  if (!selectedApi.value) return "";

  const api = selectedApi.value;
  const baseUrl = `http://${nodeInfo.nodeAddress}${nodeInfo.contextPath}`;
  let url = baseUrl + api.path;

  // 替换路径参数
  Object.entries(paramValues.path).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value || `{${key}}`);
  });

  // 构建查询参数
  const queryString = Object.entries(paramValues.query)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  if (queryString) {
    url += `?${queryString}`;
  }

  let code = `// JavaScript - 使用 fetch API
const callApi = async () => {
    const url = '${url}';

    const options = {
        method: '${api.method}',
        headers: {`;

  // 添加全局请求头
  Object.entries(globalHeaders.value).forEach(([key, value]) => {
    code += `\n            '${key}': '${value}',`;
  });

  if (api.method !== "GET" && requestBody.value) {
    code += `\n            'Content-Type': 'application/json',`;
    code += `
        },
        body: JSON.stringify(${requestBody.value || "{}"})
    };`;
  } else {
    code += `
        }
    };`;
  }

  code += `

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
};

callApi();`;

  return code;
};

const generatePythonCode = () => {
  if (!selectedApi.value) return "";

  const api = selectedApi.value;
  const baseUrl = `http://${nodeInfo.nodeAddress}${nodeInfo.contextPath}`;
  let url = baseUrl + api.path;

  // 替换路径参数
  Object.entries(paramValues.path).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value || `{${key}}`);
  });

  // 构建查询参数
  const queryParams = Object.entries(paramValues.query)
    .filter(([_, value]) => value)
    .reduce(
      (acc, [key, value]) => {
        acc[key] = value;
        return acc;
      },
      {} as Record<string, string>
    );

  let code = `# Python - 使用 requests 库
import requests
import json

def call_api():
    url = "${url}"

    # 请求头
    headers = {`;

  // 添加全局请求头
  Object.entries(globalHeaders.value).forEach(([key, value]) => {
    code += `\n        "${key}": "${value}",`;
  });

  code += `
    }

    # 查询参数
    params = ${JSON.stringify(queryParams, null, 8)}`;

  if (api.method === "GET") {
    code += `

    response = requests.get(url, headers=headers, params=params)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")`;
  } else {
    code += `

    # 请求体
    data = ${requestBody.value || "{}"}

    response = requests.${api.method.toLowerCase()}(
        url,
        headers=headers,
        params=params,
        json=data
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.json()}")`;
  }

  code += `

if __name__ == "__main__":
    call_api()`;

  return code;
};

const generateCurlCode = () => {
  if (!selectedApi.value) return "";

  const api = selectedApi.value;
  const baseUrl = `http://${nodeInfo.nodeAddress}${nodeInfo.contextPath}`;
  let url = baseUrl + api.path;

  // 替换路径参数
  Object.entries(paramValues.path).forEach(([key, value]) => {
    url = url.replace(`{${key}}`, value || `{${key}}`);
  });

  // 构建查询参数
  const queryString = Object.entries(paramValues.query)
    .filter(([_, value]) => value)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  if (queryString) {
    url += `?${queryString}`;
  }

  let code = `curl -X ${api.method} \\
  "${url}"`;

  // 添加全局请求头
  Object.entries(globalHeaders.value).forEach(([key, value]) => {
    code += ` \\
  -H "${key}: ${value}"`;
  });

  if (api.method !== "GET" && requestBody.value) {
    code += ` \\
  -H "Content-Type: application/json" \\
  -d '${requestBody.value}'`;
  }

  return code;
};

// 全局请求头管理方法
const addHeader = () => {
  tempHeaders.value.push({ key: "", value: "" });
};

const removeHeader = (index: number) => {
  tempHeaders.value.splice(index, 1);
};

const addCommonHeaders = () => {
  const commonHeaders = [
    { key: "Content-Type", value: "application/json" },
    { key: "Accept", value: "application/json" },
    { key: "Authorization", value: "Bearer " },
    { key: "X-API-Key", value: "" },
  ];

  commonHeaders.forEach((header) => {
    // 检查是否已存在相同的key
    const exists = tempHeaders.value.some((h) => h.key === header.key);
    if (!exists) {
      tempHeaders.value.push({ ...header });
    }
  });
};

const resetHeaders = () => {
  tempHeaders.value = [];
  globalHeaders.value = {};
};

const saveHeaders = () => {
  // 过滤掉空的请求头
  const validHeaders: Record<string, string> = {};
  tempHeaders.value.forEach((header) => {
    if (header.key.trim() && header.value.trim()) {
      validHeaders[header.key.trim()] = header.value.trim();
    }
  });

  globalHeaders.value = validHeaders;
  showHeaderDialog.value = false;

  // 保存到本地存储
  localStorage.setItem("nodeDocGlobalHeaders", JSON.stringify(validHeaders));

  message.success(`已保存 ${Object.keys(validHeaders).length} 个全局请求头`);
};

const handleHeaderDialogClose = () => {
  // 恢复临时数据
  tempHeaders.value = Object.entries(globalHeaders.value).map(
    ([key, value]) => ({
      key,
      value,
    })
  );
};

const loadGlobalHeaders = () => {
  try {
    const saved = localStorage.getItem("nodeDocGlobalHeaders");
    if (saved) {
      globalHeaders.value = JSON.parse(saved);
    }
  } catch (error) {
    console.error("加载全局请求头失败:", error);
  }
};

// 创建模拟API数据用于测试
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
          requestBody: {
            type: "object",
            properties: {
              username: { type: "string", description: "用户名" },
              email: { type: "string", description: "邮箱地址" },
              password: { type: "string", description: "密码" },
              firstName: { type: "string", description: "名字" },
              lastName: { type: "string", description: "姓氏" },
            },
          },
        },
        {
          path: "/api/users/{id}",
          method: "PUT",
          summary: "更新用户",
          description: "更新指定用户的信息",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              type: "integer",
              description: "用户ID",
            },
          ],
          requestBody: {
            type: "object",
            properties: {
              username: { type: "string", description: "用户名" },
              email: { type: "string", description: "邮箱地址" },
              firstName: { type: "string", description: "名字" },
              lastName: { type: "string", description: "姓氏" },
              status: { type: "string", description: "用户状态" },
            },
          },
        },
        {
          path: "/api/users/{id}",
          method: "PATCH",
          summary: "部分更新用户",
          description: "部分更新指定用户的信息",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              type: "integer",
              description: "用户ID",
            },
          ],
          requestBody: {
            type: "object",
            properties: {
              email: { type: "string", description: "邮箱地址" },
              status: { type: "string", description: "用户状态" },
            },
          },
        },
      ],
    },
    {
      name: "产品管理",
      apis: [
        {
          path: "/api/products",
          method: "GET",
          summary: "获取产品列表",
          description: "获取所有产品的列表",
          parameters: [
            {
              name: "page",
              in: "query",
              required: false,
              type: "integer",
              description: "页码",
            },
            {
              name: "size",
              in: "query",
              required: false,
              type: "integer",
              description: "每页数量",
            },
          ],
        },
        {
          path: "/api/products",
          method: "POST",
          summary: "创建产品",
          description: "创建新的产品",
          parameters: [],
          requestBody: {
            type: "object",
            properties: {
              name: { type: "string", description: "产品名称" },
              description: { type: "string", description: "产品描述" },
              price: { type: "number", description: "产品价格" },
              category: { type: "string", description: "产品分类" },
              brand: { type: "string", description: "品牌" },
            },
          },
        },
        {
          path: "/api/products/{id}",
          method: "PUT",
          summary: "更新产品",
          description: "更新指定产品的信息",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              type: "integer",
              description: "产品ID",
            },
          ],
          requestBody: {
            type: "object",
            properties: {
              name: { type: "string", description: "产品名称" },
              description: { type: "string", description: "产品描述" },
              price: { type: "number", description: "产品价格" },
              category: { type: "string", description: "产品分类" },
              inStock: { type: "boolean", description: "是否有库存" },
            },
          },
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
        {
          path: "/actuator/metrics",
          method: "GET",
          summary: "系统指标",
          description: "获取系统性能指标",
          parameters: [],
        },
      ],
    },
    {
      name: "文件管理",
      apis: [
        {
          path: "/api/files",
          method: "GET",
          summary: "文件列表",
          description: "获取文件系统中的文件列表",
          parameters: [
            {
              name: "path",
              in: "query",
              required: false,
              type: "string",
              description: "文件路径",
            },
          ],
        },
        {
          path: "/api/files/upload",
          method: "POST",
          summary: "上传文件",
          description: "上传文件到服务器",
          parameters: [],
        },
      ],
    },
  ];
};

// 将API列表转换为分组格式
const convertApiListToGroups = (apiList: ApiInfo[]) => {
  const groups: Record<string, ApiInfo[]> = {};

  // 根据路径前缀对API进行分组
  apiList.forEach((api) => {
    const pathParts = api.path.split("/").filter((part) => part);
    let groupName = "默认分组";

    if (pathParts.length > 0) {
      const firstPart = pathParts[0];

      // 根据路径前缀确定分组名称
      if (firstPart === "api") {
        groupName = pathParts[1] ? `${pathParts[1]}管理` : "API接口";
      } else if (firstPart === "actuator") {
        groupName = "系统监控";
      } else if (firstPart.includes("user")) {
        groupName = "用户管理";
      } else if (firstPart.includes("file")) {
        groupName = "文件管理";
      } else if (firstPart.includes("system")) {
        groupName = "系统管理";
      } else {
        groupName = `${firstPart}接口`;
      }
    }

    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(api);
  });

  // 转换为分组数组格式
  return Object.entries(groups).map(([name, apis]) => ({
    name,
    apis,
  }));
};

// 将Swagger资源转换为分组格式
const convertSwaggerResourcesToGroups = (resources: any[]) => {
  const groups: any[] = [];

  resources.forEach((resource) => {
    const groupName = resource.name || resource.location || "默认分组";

    // 基于Swagger资源创建基础API结构
    const apis: ApiInfo[] = [
      {
        path: resource.url || "/swagger-ui.html",
        method: "GET",
        summary: `${groupName} - Swagger文档`,
        description: `访问 ${groupName} 的Swagger UI文档`,
        parameters: [],
      },
    ];

    // 如果有swaggerVersion信息，添加版本相关的API
    if (resource.swaggerVersion) {
      apis.push({
        path: resource.location || "/v2/api-docs",
        method: "GET",
        summary: `${groupName} - API文档JSON`,
        description: `获取 ${groupName} 的API文档JSON格式`,
        parameters: [],
      });
    }

    groups.push({
      name: groupName,
      apis,
    });
  });

  return groups.length > 0
    ? groups
    : [
        {
          name: "Swagger资源",
          apis: [
            {
              path: "/swagger-ui.html",
              method: "GET",
              summary: "Swagger UI",
              description: "访问Swagger UI界面",
              parameters: [],
            },
            {
              path: "/v2/api-docs",
              method: "GET",
              summary: "API文档",
              description: "获取API文档JSON格式",
              parameters: [],
            },
          ],
        },
      ];
};

// 响应内容处理方法
const getContentType = () => {
  if (!lastResponse.value?.headers) return "";

  const contentType =
    lastResponse.value.headers["content-type"] ||
    lastResponse.value.headers["Content-Type"] ||
    "";

  // 提取主要的content-type，去掉charset等参数
  return contentType.split(";")[0].trim();
};

const isJsonContent = () => {
  const contentType = getContentType();
  return (
    contentType.includes("application/json") ||
    contentType.includes("text/json") ||
    typeof lastResponse.value?.data === "object"
  );
};

const isImageContent = () => {
  const contentType = getContentType();
  return contentType.startsWith("image/");
};

const isHtmlContent = () => {
  const contentType = getContentType();
  return contentType.includes("text/html");
};

const isXmlContent = () => {
  const contentType = getContentType();
  return (
    contentType.includes("application/xml") || contentType.includes("text/xml")
  );
};

const getImageSrc = () => {
  if (!lastResponse.value?.data) return "";

  // 如果是base64数据
  if (
    typeof lastResponse.value.data === "string" &&
    lastResponse.value.data.startsWith("data:")
  ) {
    return lastResponse.value.data;
  }

  // 如果是二进制数据，需要转换为blob URL
  // 这里简化处理，实际项目中需要根据具体情况处理
  return "";
};

const handleImageError = () => {
  message.error("图片加载失败");
};

// 格式化响应数据
const formattedResponseData = computed(() => {
  if (!lastResponse.value?.data) return "";

  if (typeof lastResponse.value.data === "string") {
    try {
      const parsed = JSON.parse(lastResponse.value.data);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return lastResponse.value.data;
    }
  }

  return JSON.stringify(lastResponse.value.data, null, 2);
});

const formattedXmlData = computed(() => {
  if (!lastResponse.value?.data) return "";

  // 简单的XML格式化，实际项目中可以使用专门的XML格式化库
  let xml = String(lastResponse.value.data);
  xml = xml.replace(/></g, ">\n<");
  return xml;
});

// 代码示例计算属性
const javaCode = computed(() => {
  const code = generateJavaCode();
  console.log("Java Code:", code);
  return code;
});
const javascriptCode = computed(() => {
  const code = generateJavaScriptCode();
  console.log("JavaScript Code:", code);
  return code;
});
const pythonCode = computed(() => {
  const code = generatePythonCode();
  console.log("Python Code:", code);
  return code;
});
const curlCode = computed(() => {
  const code = generateCurlCode();
  console.log("cURL Code:", code);
  return code;
});

// CodeMirror编辑器配置
const jsonEditorOptions = {
  mode: "application/json",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const htmlEditorOptions = {
  mode: "text/html",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const xmlEditorOptions = {
  mode: "application/xml",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const textEditorOptions = {
  mode: "text/plain",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  lineWrapping: true,
};

const codeEditorOptions = {
  mode: "text/x-java",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const bashEditorOptions = {
  mode: "shell",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  lineWrapping: true,
};

// 代码示例编辑器配置
const javaEditorOptions = {
  mode: "text/x-java",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const javascriptEditorOptions = {
  mode: "text/javascript",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const pythonEditorOptions = {
  mode: "text/x-python",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

const shellEditorOptions = {
  mode: "shell",
  theme: "default",
  lineNumbers: true,
  readOnly: true,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
};

// 请求体编辑器配置
const requestBodyEditorOptions = {
  mode: "application/json",
  theme: "default",
  lineNumbers: true,
  readOnly: false,
  foldGutter: true,
  gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
  lineWrapping: true,
  autoCloseBrackets: true,
  matchBrackets: true,
  indentUnit: 2,
  tabSize: 2,
};

// 复制和下载方法
const copyHeaders = () => {
  if (!lastResponse.value?.headers) return;

  const headersText = Object.entries(lastResponse.value.headers)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

  navigator.clipboard
    .writeText(headersText)
    .then(() => {
      message.success("响应头已复制到剪贴板");
    })
    .catch(() => {
      message.error("复制失败");
    });
};

const copyResponseBody = () => {
  if (!lastResponse.value?.data) return;

  let content = "";
  if (typeof lastResponse.value.data === "string") {
    content = lastResponse.value.data;
  } else {
    content = JSON.stringify(lastResponse.value.data, null, 2);
  }

  navigator.clipboard
    .writeText(content)
    .then(() => {
      message.success("响应体已复制到剪贴板");
    })
    .catch(() => {
      message.error("复制失败");
    });
};

const downloadResponse = () => {
  if (!lastResponse.value?.data) return;

  let content = "";
  let filename = "response";
  let mimeType = "text/plain";

  const contentType = getContentType();

  if (isJsonContent()) {
    content = formattedResponseData.value;
    filename = "response.json";
    mimeType = "application/json";
  } else if (isXmlContent()) {
    content = formattedXmlData.value;
    filename = "response.xml";
    mimeType = "application/xml";
  } else if (isHtmlContent()) {
    content = String(lastResponse.value.data);
    filename = "response.html";
    mimeType = "text/html";
  } else {
    content = String(lastResponse.value.data);
    filename = "response.txt";
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  message.success(`已下载响应内容: ${filename}`);
};

// 响应头折叠切换
const toggleHeadersCollapse = () => {
  headersCollapsed.value = !headersCollapsed.value;
};

// 拖拽调整大小相关方法
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

// 生命周期
onMounted(() => {
  loadGlobalHeaders();
  loadSameNameNodes();
  loadApiDocs();
});

// 监听搜索关键词变化
watch(searchKeyword, () => {
  // 如果有搜索结果，自动展开所有分组
  if (searchKeyword.value && filteredApiGroups.value.length > 0) {
    expandedGroups.value = filteredApiGroups.value.map((group) => group.name);
  }
});

// 监听对话框打开，初始化临时数据
watch(showHeaderDialog, (newValue) => {
  if (newValue) {
    tempHeaders.value = Object.entries(globalHeaders.value).map(
      ([key, value]) => ({
        key,
        value,
      })
    );
    // 如果没有任何请求头，添加一个空行
    if (tempHeaders.value.length === 0) {
      tempHeaders.value.push({ key: "", value: "" });
    }
  }
});
</script>

<style lang="scss" scoped>

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.node-documentation {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f8fafc;

  .doc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 32px;
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    backdrop-filter: blur(10px);

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;

      .node-info {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;

        i {
          color: #3b82f6;
          font-size: 20px;
        }

        .node-name {
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
    }

    .header-actions {
      display: flex;
      gap: 12px;

      .el-button {
        border-radius: 12px;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  .doc-content {
    flex: 1;
    display: flex;
    height: calc(100vh - 73px);
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    padding: 20px;
    position: relative;

    .doc-sidebar {
      min-width: 200px;
      max-width: 600px;
      background: var(--el-bg-color-overlay);
      border-radius: 16px;
      box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 20px 40px -10px rgba(0, 0, 0, 0.15),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .sidebar-header {
        padding: 28px 24px;
        border-bottom: none;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: var(--el-text-color-primary);
        border-radius: 16px 16px 0 0;
        position: relative;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.2),
            transparent
          );
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;

          i {
            font-size: 20px;
          }

          h3 {
            margin: 0;
            font-size: 18px;
            font-weight: 600;
          }
        }

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

        .global-headers {
          margin-bottom: 16px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
          border: 1px solid #e5e7eb;

          .headers-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .selector-label {
              font-size: 13px;
              font-weight: 500;
              color: #374151;
            }
          }

          .headers-preview {
            .header-item {
              display: flex;
              margin-bottom: 4px;
              font-size: 12px;

              .header-key {
                font-weight: 500;
                color: #6b7280;
                margin-right: 4px;
              }

              .header-value {
                color: #374151;
                word-break: break-all;
                flex: 1;
              }
            }
          }

          .no-headers {
            .placeholder-text {
              font-size: 12px;
              color: #9ca3af;
              font-style: italic;
            }
          }
        }
      }

      .api-tree {
        flex: 1;
        overflow-y: auto;

        .loading-container,
        .empty-container {
          padding: 40px 20px;
        }

        .api-groups {
          .api-group {
            .group-header {
              display: flex;
              align-items: center;
              gap: 8px;
              padding: 12px 20px;
              cursor: pointer;
              transition: all 0.2s ease;
              border-bottom: 1px solid #f3f4f6;

              &:hover {
                background: #f9fafb;
              }

              &.expanded {
                background: #f3f4f6;

                .expand-icon {
                  transform: rotate(90deg);
                }
              }

              .group-icon {
                color: #6b7280;
                font-size: 16px;
              }

              .group-name {
                flex: 1;
                font-weight: 500;
                color: #374151;
              }

              .api-count {
                font-size: 12px;
                color: #9ca3af;
              }

              .expand-icon {
                color: #9ca3af;
                transition: transform 0.2s ease;
              }
            }

            .group-apis {
              .api-item {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                padding: 16px 20px 16px 48px;
                cursor: pointer;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-bottom: 1px solid #f1f5f9;
                margin: 2px 8px;
                border-radius: 8px;
                position: relative;
                overflow: hidden;

                &::before {
                  content: "";
                  position: absolute;
                  top: 0;
                  left: -100%;
                  width: 100%;
                  height: 100%;
                  background: linear-gradient(
                    90deg,
                    transparent,
                    rgba(255, 255, 255, 0.6),
                    transparent
                  );
                  transition: left 0.5s ease;
                }

                &:hover {
                  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
                  transform: translateX(4px);
                  box-shadow: 0 4px 12px -4px rgba(0, 0, 0, 0.1);
                  border-bottom-color: transparent;

                  &::before {
                    left: 100%;
                  }
                }

                &.active {
                  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
                  border-left: 4px solid #3b82f6;
                  transform: translateX(2px);
                  box-shadow: 0 4px 15px -4px rgba(59, 130, 246, 0.25);
                  border-bottom-color: transparent;
                }

                .api-method {
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 11px;
                  font-weight: 700;
                  text-transform: uppercase;
                  min-width: 50px;
                  text-align: center;
                  letter-spacing: 0.5px;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                  transition: all 0.2s ease;

                  &.get {
                    background: linear-gradient(
                      135deg,
                      #dcfce7 0%,
                      #bbf7d0 100%
                    );
                    color: #166534;
                    border: 1px solid #86efac;
                  }
                  &.post {
                    background: linear-gradient(
                      135deg,
                      #dbeafe 0%,
                      #bfdbfe 100%
                    );
                    color: #1d4ed8;
                    border: 1px solid #93c5fd;
                  }
                  &.put {
                    background: linear-gradient(
                      135deg,
                      #fef3c7 0%,
                      #fde68a 100%
                    );
                    color: #92400e;
                    border: 1px solid #fcd34d;
                  }
                  &.delete {
                    background: linear-gradient(
                      135deg,
                      #fee2e2 0%,
                      #fecaca 100%
                    );
                    color: #dc2626;
                    border: 1px solid #f87171;
                  }
                  &.patch {
                    background: linear-gradient(
                      135deg,
                      #f3e8ff 0%,
                      #e9d5ff 100%
                    );
                    color: #7c3aed;
                    border: 1px solid #c4b5fd;
                  }
                }

                .api-info {
                  flex: 1;
                  min-width: 0;

                  .api-path {
                    font-size: 13px;
                    font-weight: 500;
                    color: #374151;
                    word-break: break-all;
                  }

                  .api-summary {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 2px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 拖拽分割线样式
    .resize-handle {
      width: 4px;
      background: transparent;
      cursor: col-resize;
      position: relative;
      z-index: 10;
      transition: all 0.2s ease;

      &:hover {
        background: rgba(59, 130, 246, 0.3);
      }

      &:active {
        background: rgba(59, 130, 246, 0.6);
      }

      &::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 40px;
        background: rgba(148, 163, 184, 0.4);
        border-radius: 1px;
        transition: all 0.2s ease;
      }

      &:hover::before {
        background: rgba(59, 130, 246, 0.8);
        height: 60px;
      }
    }

    .doc-params {
      min-width: 300px;
      max-width: 800px;
      background: var(--el-bg-color-overlay);
      border-radius: 16px;
      box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      transition: box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 20px 40px -10px rgba(0, 0, 0, 0.15),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .no-selection {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .api-details {
        flex: 1;
        display: flex;
        flex-direction: column;

        .api-header {
          padding: 28px 24px;
          border-bottom: none;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 16px 16px 0 0;
          position: relative;

          &::after {
            content: "";
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 1px;
            background: linear-gradient(
              90deg,
              transparent,
              rgba(148, 163, 184, 0.3),
              transparent
            );
          }

          .api-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .method-badge {
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;

              &.get {
                background: #dcfce7;
                color: #166534;
              }
              &.post {
                background: #dbeafe;
                color: #1d4ed8;
              }
              &.put {
                background: #fef3c7;
                color: #92400e;
              }
              &.delete {
                background: #fee2e2;
                color: #dc2626;
              }
              &.patch {
                background: #f3e8ff;
                color: #7c3aed;
              }
            }

            .api-path {
              font-size: 18px;
              font-weight: 600;
              color: #111827;
              font-family: "Monaco", "Menlo", monospace;
            }
          }

          .api-summary {
            color: #6b7280;
            font-size: 14px;
          }
        }

        .param-controls {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f1f5f9;

          .el-button-group {
            display: flex;
            gap: 8px;
          }
        }

        .params-section {
          flex: 1;
          display: flex;
          flex-direction: column;

          .params-tabs {
            flex: 1;
            padding: 0 24px;

            :deep(.el-tabs__content) {
              height: calc(100% - 40px);
              overflow-y: auto;
            }

            .param-list {
              .param-item {
                margin-bottom: 20px;

                .param-label {
                  display: block;
                  margin-bottom: 6px;
                  font-size: 14px;
                  font-weight: 500;
                  color: #374151;

                  .required {
                    color: #dc2626;
                    margin-left: 4px;
                  }

                  .required-tag {
                    margin-left: 8px;
                  }
                }

                .param-desc {
                  margin-top: 4px;
                  font-size: 12px;
                  color: #6b7280;
                }
              }
            }

            .body-editor {
              height: 300px;
              border: 1px solid #e1e5e9;
              border-radius: 8px;
              overflow: hidden;

              :deep(.el-textarea__inner) {
                font-family: "Monaco", "Menlo", monospace;
                font-size: 13px;
              }

              :deep(.CodeMirror) {
                height: 100%;
                font-family: "Monaco", "Menlo", "Consolas", monospace;
                font-size: 13px;
                border-radius: 8px;
              }

              :deep(.CodeMirror-scroll) {
                height: 100%;
              }
            }
          }

          .execute-section {
            padding: 24px;
            border-top: 1px solid #f3f4f6;
            text-align: center;
          }
        }
      }
    }

    .doc-result {
      flex: 1;
      min-width: 0; // 确保能够收缩
      background: var(--el-bg-color-overlay);
      border-radius: 16px;
      box-shadow:
        0 10px 25px -5px rgba(0, 0, 0, 0.1),
        0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: flex;
      flex-direction: column;
      transition: all 0.3s ease;
      overflow: hidden;

      &:hover {
        transform: translateY(-2px);
        box-shadow:
          0 20px 40px -10px rgba(0, 0, 0, 0.15),
          0 10px 10px -5px rgba(0, 0, 0, 0.04);
      }

      .result-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 28px;
        border-bottom: none;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-radius: 16px 16px 0 0;
        position: relative;

        &::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(148, 163, 184, 0.3),
            transparent
          );
        }

        .result-tabs {
          flex: 1;

          .tab-label {
            display: flex;
            align-items: center;
            gap: 6px;

            i {
              font-size: 16px;
            }
          }
        }

        .result-actions {
          display: flex;
          gap: 8px;
        }
      }

      .result-content {
        flex: 1;
        overflow-y: auto;

        .no-result {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .response-container {
          padding: 20px 24px;

          .response-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 12px;
            background: #f9fafb;
            border-radius: 8px;

            .status-info {
              display: flex;
              align-items: center;
              gap: 8px;

              .status-code {
                padding: 4px 8px;
                border-radius: 4px;
                font-weight: 600;
                font-size: 12px;

                &.success {
                  background: #dcfce7;
                  color: #166534;
                }
                &.warning {
                  background: #fef3c7;
                  color: #92400e;
                }
                &.error {
                  background: #fee2e2;
                  color: #dc2626;
                }
                &.danger {
                  background: #fee2e2;
                  color: #dc2626;
                }
                &.info {
                  background: #e0e7ff;
                  color: #3730a3;
                }
              }

              .status-text {
                font-size: 14px;
                color: #374151;
              }
            }

            .response-time {
              display: flex;
              align-items: center;
              gap: 4px;
              font-size: 12px;
              color: #6b7280;
            }
          }

          .response-headers,
          .response-body {
            margin-bottom: 24px;

            .section-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 16px;
              padding: 12px 16px;
              border-radius: 8px 8px 0 0;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 1px solid #e2e8f0;
              cursor: pointer;
              transition: all 0.2s ease;

              &:hover {
                background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              }

              h4 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                display: flex;
                align-items: center;
                gap: 8px;

                i {
                  color: #6366f1;
                  font-size: 18px;
                }

                .header-count {
                  background: #6366f1;
                  color: var(--el-text-color-primary);
                  padding: 2px 8px;
                  border-radius: 12px;
                  font-size: 12px;
                  font-weight: 500;
                  margin-left: 8px;
                }

                .content-type-badge {
                  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                  color: var(--el-text-color-primary);
                  padding: 4px 12px;
                  border-radius: 20px;
                  font-size: 12px;
                  font-weight: 500;
                  margin-left: 12px;
                  text-transform: uppercase;
                  letter-spacing: 0.5px;
                }
              }

              .header-actions,
              .body-actions {
                display: flex;
                gap: 8px;
                align-items: center;

                .collapse-btn {
                  padding: 4px 8px;

                  i {
                    font-size: 16px;
                    transition: transform 0.2s ease;
                  }
                }
              }
            }

            .headers-content {
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 40px 20px;
                color: #9ca3af;
                background: #f9fafb;
                border-radius: 12px;
                border: 2px dashed #e5e7eb;

                i {
                  font-size: 32px;
                  margin-bottom: 8px;
                  opacity: 0.6;
                }

                span {
                  font-size: 14px;
                }
              }

              .headers-table {
                background: #f8fafc;
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;

                .header-row {
                  display: grid;
                  grid-template-columns: 1fr 2fr;
                  border-bottom: 1px solid #e2e8f0;
                  transition: background-color 0.2s ease;

                  &:hover {
                    background: #f1f5f9;
                  }

                  &:last-child {
                    border-bottom: none;
                  }

                  .header-key {
                    padding: 12px 16px;
                    font-weight: 600;
                    color: #374151;
                    background: #f1f5f9;
                    border-right: 1px solid #e2e8f0;
                    font-family: "Monaco", "Menlo", monospace;
                    font-size: 13px;
                  }

                  .header-value {
                    padding: 12px 16px;
                    color: #6b7280;
                    font-family: "Monaco", "Menlo", monospace;
                    font-size: 13px;
                    word-break: break-all;
                  }
                }
              }
            }

            .body-content {
              .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px 20px;
                color: #9ca3af;
                background: #f9fafb;
                border-radius: 12px;
                border: 2px dashed #e5e7eb;

                i {
                  font-size: 48px;
                  margin-bottom: 12px;
                  opacity: 0.6;
                }

                span {
                  font-size: 16px;
                }
              }

              .json-viewer,
              .html-viewer,
              .xml-viewer,
              .text-viewer {
                border-radius: 12px;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

                :deep(.CodeMirror) {
                  height: 400px;
                  font-family: "Monaco", "Menlo", "Consolas", monospace;
                  font-size: 13px;
                  line-height: 1.5;
                }

                :deep(.CodeMirror-scroll) {
                  padding: 16px;
                }

                :deep(.CodeMirror-gutters) {
                  background: #f8fafc;
                  border-right: 1px solid #e2e8f0;
                }

                :deep(.CodeMirror-linenumber) {
                  color: #9ca3af;
                  padding: 0 8px;
                }
              }

              .image-viewer {
                background: #f9fafb;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                border: 1px solid #e2e8f0;

                .response-image {
                  max-width: 100%;
                  max-height: 400px;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  transition: transform 0.2s ease;

                  &:hover {
                    transform: scale(1.02);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}

// 动画效果
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  opacity: 0;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 1000px;
  opacity: 1;
}

// 全局请求头对话框样式
.header-dialog-content {
  .dialog-description {
    margin-bottom: 20px;

    p {
      margin: 0;
      color: #6b7280;
      font-size: 14px;
    }
  }

  .header-list {
    margin-bottom: 16px;

    .header-row {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
  }

  .header-actions {
    margin-bottom: 20px;
    display: flex;
    gap: 8px;
  }

  .common-headers-tips {
    .examples-list {
      .example-item {
        padding: 8px 12px;
        background: #f9fafb;
        border-radius: 6px;
        margin-bottom: 6px;
        font-size: 13px;
        font-family: "Monaco", "Menlo", monospace;

        strong {
          color: #374151;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

// 代码示例样式
.code-examples {
  padding: 24px;
  height: 100%;
  overflow-y: auto;

  .examples-container {
    height: 100%;

    .examples-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f1f5f9;

      h4 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        display: flex;
        align-items: center;
        gap: 8px;

        i {
          color: #6366f1;
          font-size: 20px;
        }
      }
    }

    .language-tabs {
      height: calc(100% - 80px);

      :deep(.el-tabs__header) {
        margin-bottom: 16px;
      }

      :deep(.el-tabs__content) {
        height: calc(100% - 60px);
      }

      :deep(.el-tab-pane) {
        height: 100%;
      }

      .code-block {
        height: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);

        :deep(.CodeMirror) {
          height: 100%;
          font-family: "Monaco", "Menlo", "Consolas", monospace;
          font-size: 13px;
          line-height: 1.5;
        }

        :deep(.CodeMirror-scroll) {
          padding: 16px;
        }

        :deep(.CodeMirror-gutters) {
          background: #f8fafc;
          border-right: 1px solid #e2e8f0;
        }

        :deep(.CodeMirror-linenumber) {
          color: #9ca3af;
          padding: 0 8px;
        }

        .code-content {
          padding: 16px;
          background: #f8fafc;
          height: 100%;
          overflow-y: auto;

          .code-pre {
            margin: 0;
            padding: 0;
            background: transparent;
            border: none;
            font-family: "Monaco", "Menlo", "Consolas", monospace;
            font-size: 13px;
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-all;
            color: #374151;
          }
        }
      }
    }
  }

  .no-selection {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .empty-code {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    background: #f8fafc;
    border-radius: 8px;
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
