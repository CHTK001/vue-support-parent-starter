<template>
  <div class="api-result-column" :style="{ width: `${resultColumnWidth}px` }">
    <div class="column-header">
      <h3 class="column-title">接口详情</h3>
      <div class="result-tabs">
        <div 
          class="result-tab" 
          :class="{ active: activeTab === 'doc' }"
          @click="setActiveTab('doc')"
        >
          接口文档
        </div>
        <div 
          class="result-tab" 
          :class="{ active: activeTab === 'debug' }"
          @click="setActiveTab('debug')"
        >
          调试结果
        </div>
        <div 
          class="result-tab" 
          :class="{ active: activeTab === 'sdk' }"
          @click="setActiveTab('sdk')"
        >
          SDK示例
        </div>
        <div 
          class="result-tab" 
          :class="{ active: activeTab === 'history' }"
          @click="setActiveTab('history')"
        >
          调用历史
        </div>
        <div 
          class="result-tab" 
          :class="{ active: activeTab === 'errorCodes' }"
          @click="setActiveTab('errorCodes')"
        >
          错误码
        </div>
      </div>
    </div>

    <div class="result-container">
      <!-- 接口文档 -->
      <div v-if="activeTab === 'doc'" class="result-content">
        <div class="doc-section">
          <h4 class="doc-title">接口说明</h4>
          <div class="doc-content">
            <p>{{ selectedApi?.description || '暂无接口说明' }}</p>
          </div>
        </div>
        
        <div class="doc-section">
          <h4 class="doc-title">请求参数</h4>
          <div class="doc-content">
            <el-table
              v-if="selectedApi?.parameters && selectedApi.parameters.length > 0"
              :data="selectedApi.parameters"
              border
              style="width: 100%"
              size="small"
            >
              <el-table-column prop="name" label="参数名" width="150" />
              <el-table-column prop="type" label="类型" width="100" />
              <el-table-column label="必填" width="80">
                <template #default="scope">
                  <el-tag 
                    :type="scope.row.required ? 'danger' : 'info'" 
                    size="small"
                  >
                    {{ scope.row.required ? '是' : '否' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="说明" />
            </el-table>
            <el-empty v-else description="暂无请求参数" :image-size="100" />
          </div>
        </div>
        
        <div class="doc-section">
          <h4 class="doc-title">响应说明</h4>
          <div class="doc-content">
            <div class="response-tabs">
              <div 
                class="response-tab" 
                :class="{ active: activeResponseTab === 'success' }"
                @click="activeResponseTab = 'success'"
              >
                成功响应
              </div>
              <div 
                class="response-tab" 
                :class="{ active: activeResponseTab === 'error' }"
                @click="activeResponseTab = 'error'"
              >
                错误响应
              </div>
            </div>
            <div class="response-content">
              <pre v-if="selectedApi?.responses?.[activeResponseTab]" class="code-block">{{ JSON.stringify(selectedApi.responses[activeResponseTab], null, 2) }}</pre>
              <el-empty v-else description="暂无响应示例" :image-size="100" />
            </div>
          </div>
        </div>
      </div>

      <!-- 调试结果 -->
      <div v-if="activeTab === 'debug'" class="result-content">
        <div class="debug-toolbar">
          <el-button 
            type="primary" 
            size="small" 
            @click="handleExecuteRequest"
            :loading="requestLoading"
          >
            发送请求
          </el-button>
          <el-button 
            type="info" 
            size="small"
            plain
            @click="copyRequestExample"
          >
            复制请求
          </el-button>
        </div>
        
        <div class="debug-request">
          <h4 class="debug-title">请求示例</h4>
          <pre class="code-block">{{ requestExample }}</pre>
        </div>
        
        <div v-if="customResponse" class="debug-response">
          <h4 class="debug-title">
            响应结果
            <span class="response-time">{{ responseTime }}ms</span>
            <span class="status-code" :class="responseStatus < 400 ? 'success' : 'error'">
              状态码: {{ responseStatus }}
            </span>
          </h4>
          <div class="result-actions">
            <el-button 
              type="info" 
              size="small"
              plain
              @click="copyCustomResponse"
            >
              复制
            </el-button>
          </div>
          <pre class="code-block">{{ customResponse }}</pre>
        </div>
      </div>

      <!-- SDK示例 -->
      <div v-if="activeTab === 'sdk'" class="result-content">
        <div class="code-language-tabs">
          <div 
            v-for="lang in availableLanguages" 
            :key="lang.value"
            class="language-tab"
            :class="{ active: activeLanguage === lang.value }"
            @click="activeLanguage = lang.value"
          >
            {{ lang.label }}
          </div>
        </div>
        <div class="code-example">
          <div class="result-actions">
            <el-button 
              type="info" 
              size="small"
              plain
              @click="copyCode(activeLanguage)"
            >
              复制代码
            </el-button>
          </div>
          <pre v-if="selectedApi?.examples && selectedApi.examples[activeLanguage]" class="code-block">{{ selectedApi.examples[activeLanguage] }}</pre>
          <el-empty v-else description="暂无代码示例" :image-size="100" />
        </div>
      </div>

      <!-- 调用历史 -->
      <div v-if="activeTab === 'history'" class="result-content">
        <div class="history-toolbar">
          <el-button type="primary" size="small" plain @click="loadCallHistory">
            刷新历史
          </el-button>
        </div>
        
        <el-table
          v-if="callHistory.length > 0"
          :data="callHistory"
          border
          style="width: 100%"
          size="small"
        >
          <el-table-column prop="time" label="调用时间" width="180" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag 
                :type="scope.row.status === 'success' ? 'success' : 'danger'" 
                size="small"
              >
                {{ scope.row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="100">
            <template #default="scope">
              {{ scope.row.duration }}ms
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" width="140" />
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button type="text" size="small" @click="viewHistoryDetail(scope.row)">
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else description="暂无调用历史记录" :image-size="100" />
        
        <!-- 历史详情对话框 -->
        <el-dialog
          v-model="historyDetailVisible"
          title="调用详情"
          width="60%"
          destroy-on-close
        >
          <div v-if="selectedHistory" class="history-detail">
            <div class="detail-item">
              <div class="detail-label">调用时间:</div>
              <div class="detail-value">{{ selectedHistory.time }}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">状态:</div>
              <div class="detail-value">
                <el-tag 
                  :type="selectedHistory.status === 'success' ? 'success' : 'danger'" 
                  size="small"
                >
                  {{ selectedHistory.status === 'success' ? '成功' : '失败' }}
                </el-tag>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">请求参数:</div>
              <div class="detail-value">
                <pre class="code-block">{{ JSON.stringify(selectedHistory.request, null, 2) }}</pre>
              </div>
            </div>
            <div class="detail-item">
              <div class="detail-label">响应结果:</div>
              <div class="detail-value">
                <pre class="code-block">{{ JSON.stringify(selectedHistory.response, null, 2) }}</pre>
              </div>
            </div>
          </div>
        </el-dialog>
      </div>

      <!-- 错误码 -->
      <div v-if="activeTab === 'errorCodes'" class="result-content">
        <div class="error-codes-toolbar">
          <el-input 
            v-model="errorCodeSearch" 
            placeholder="搜索错误码..." 
            clearable
            prefix-icon="Search"
            size="small"
            style="width: 250px;"
          />
        </div>
        
        <el-table
          :data="filteredErrorCodes"
          border
          style="width: 100%"
          size="small"
        >
          <el-table-column prop="code" label="错误码" width="120" />
          <el-table-column prop="message" label="错误信息" />
          <el-table-column prop="description" label="错误说明" />
          <el-table-column prop="solution" label="解决方案" />
        </el-table>
      </div>
    </div>
    
    <!-- 拖动调整条 -->
    <div 
      class="column-resizer"
      @mousedown="startResize"
      @touchstart="startTouchResize"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { message } from "@repo/utils";

const props = defineProps<{
  selectedApi: any | null;
  requestExample: string;
  requestLoading: boolean;
  customResponse: string;
  responseStatus: number;
  responseTime: number;
}>();

const emit = defineEmits(['execute-request', 'copy-request', 'copy-response', 'copy-code', 'tab-change']);

// 状态变量
const activeTab = ref("doc");
const activeLanguage = ref("curl");
const activeResponseTab = ref("success");
const errorCodeSearch = ref("");
const historyDetailVisible = ref(false);
const selectedHistory = ref<any>(null);
const callHistory = ref<any[]>([]);

// 列宽调整相关变量
const STORAGE_KEY = 'hybrid-doc-result-width';
const DEFAULT_RESULT_WIDTH = 500; // 默认结果列宽度
const MIN_RESULT_WIDTH = 350; // 最小结果列宽度
const MAX_RESULT_WIDTH = 1200; // 最大结果列宽度

const resultColumnWidth = ref(DEFAULT_RESULT_WIDTH);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

// 本地存储API的最后选择
const LAST_SELECTED_API_KEY = 'hybrid-doc-last-selected-api';
const LAST_SELECTED_TAB_KEY = 'hybrid-doc-last-selected-tab';

// 可用的代码语言
const availableLanguages = [
  { label: "cURL", value: "curl" },
  { label: "Java", value: "java" },
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "Go", value: "go" }
];

// 错误码数据
const errorCodes = ref([
  { code: "A0001", message: "用户端错误", description: "用户请求参数错误", solution: "检查请求参数是否符合要求" },
  { code: "A0002", message: "用户登录异常", description: "用户账户不存在或密码错误", solution: "检查用户名和密码是否正确" },
  { code: "A0003", message: "权限不足", description: "用户无权限访问该资源", solution: "联系管理员申请权限" },
  { code: "B0001", message: "系统执行出错", description: "系统内部错误", solution: "请联系系统管理员" },
  { code: "B0002", message: "系统执行超时", description: "系统执行超出预定时间", solution: "请稍后重试或联系系统管理员" },
  { code: "C0001", message: "调用第三方服务出错", description: "调用第三方服务失败", solution: "检查第三方服务是否可用" },
  { code: "C0002", message: "中间件服务出错", description: "中间件服务异常", solution: "联系系统管理员检查中间件服务" },
  { code: "C0003", message: "数据库服务出错", description: "数据库服务异常", solution: "联系系统管理员检查数据库服务" }
]);

// 计算属性：过滤后的错误码列表
const filteredErrorCodes = computed(() => {
  if (!errorCodeSearch.value) {
    return errorCodes.value;
  }
  
  const searchLower = errorCodeSearch.value.toLowerCase();
  return errorCodes.value.filter(
    code => code.code.toLowerCase().includes(searchLower) || 
            code.message.toLowerCase().includes(searchLower) || 
            code.description.toLowerCase().includes(searchLower)
  );
});

// 方法：执行请求
const handleExecuteRequest = () => {
  emit('execute-request');
};

// 方法：复制请求示例
const copyRequestExample = () => {
  emit('copy-request');
};

// 方法：复制响应结果
const copyCustomResponse = () => {
  emit('copy-response');
};

// 方法：复制代码示例
const copyCode = (language: string) => {
  emit('copy-code', language);
};

// 加载调用历史记录
const loadCallHistory = () => {
  // 模拟加载历史记录
  const now = new Date();
  
  // 生成模拟数据
  callHistory.value = Array.from({ length: 10 }, (_, i) => {
    const date = new Date(now.getTime() - (i * 3600000));
    const timeStr = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const isSuccess = Math.random() > 0.3;
    
    return {
      id: `call-${Date.now()}-${i}`,
      time: timeStr,
      status: isSuccess ? 'success' : 'error',
      duration: Math.floor(Math.random() * 500) + 50,
      ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
      request: {
        method: props.selectedApi?.method || 'GET',
        path: props.selectedApi?.path || '/api/test',
        params: {} // 这里可以传入实际的请求参数
      },
      response: isSuccess 
        ? {
            code: "00000",
            message: "success",
            data: {
              id: Math.floor(Math.random() * 1000),
              name: `测试数据${i}`,
              createTime: timeStr
            }
          }
        : {
            code: "A0001",
            message: "用户请求参数错误",
            data: null
          }
    };
  });
  
  message("历史记录已刷新", { type: "success" });
};

// 查看历史详情
const viewHistoryDetail = (historyItem: any) => {
  selectedHistory.value = historyItem;
  historyDetailVisible.value = true;
};

// 监听选项卡变化
watch(activeTab, (newTab) => {
  emit('tab-change', newTab);
});

// 生命周期钩子
onMounted(() => {
  loadSettings();
  loadCallHistory(); // 确保初始化加载历史数据
  document.addEventListener("keydown", handleKeyDown);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", handleKeyDown);
  // 清理拖动相关的事件监听器
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", stopTouchResize);
  document.body.classList.remove("resizing");
});

// 加载设置
const loadSettings = () => {
  try {
    // 加载结果列宽度
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      resultColumnWidth.value = parseInt(savedWidth);
    }
    
    // 加载上次选择的API和标签页
    const lastSelectedTab = localStorage.getItem(LAST_SELECTED_TAB_KEY);
    if (lastSelectedTab) {
      activeTab.value = lastSelectedTab;
    }
  } catch (e) {
    console.error("Error loading settings:", e);
  }
};

// 保存设置
const saveSettings = () => {
  try {
    localStorage.setItem(STORAGE_KEY, resultColumnWidth.value.toString());
  } catch (e) {
    console.error("Error saving settings:", e);
  }
};

// 设置活动标签页
const setActiveTab = (tab: string) => {
  activeTab.value = tab;
  try {
    localStorage.setItem(LAST_SELECTED_TAB_KEY, tab);
  } catch (e) {
    console.error("Error saving active tab:", e);
  }
  emit("tab-change", tab);
};

// 拖动调整大小
const startResize = (e: MouseEvent) => {
  e.preventDefault();
  isResizing.value = true;
  startX.value = e.clientX;
  startWidth.value = resultColumnWidth.value;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResize);
  document.body.classList.add("resizing");
};

const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;
  const delta = startX.value - e.clientX;
  const newWidth = Math.min(
    Math.max(startWidth.value + delta, MIN_RESULT_WIDTH),
    MAX_RESULT_WIDTH
  );
  resultColumnWidth.value = newWidth;
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResize);
  document.body.classList.remove("resizing");
  saveSettings();
};

// 触摸拖动调整大小
const startTouchResize = (e: TouchEvent) => {
  e.preventDefault();
  if (e.touches.length !== 1) return;
  
  isResizing.value = true;
  startX.value = e.touches[0].clientX;
  startWidth.value = resultColumnWidth.value;
  
  document.addEventListener("touchmove", handleTouchMove, { passive: false });
  document.addEventListener("touchend", stopTouchResize);
  document.body.classList.add("resizing");
};

const handleTouchMove = (e: TouchEvent) => {
  if (!isResizing.value || e.touches.length !== 1) return;
  e.preventDefault(); // 防止移动端滚动
  
  const delta = startX.value - e.touches[0].clientX;
  const newWidth = Math.min(
    Math.max(startWidth.value + delta, MIN_RESULT_WIDTH),
    MAX_RESULT_WIDTH
  );
  resultColumnWidth.value = newWidth;
};

const stopTouchResize = () => {
  isResizing.value = false;
  document.removeEventListener("touchmove", handleTouchMove);
  document.removeEventListener("touchend", stopTouchResize);
  document.body.classList.remove("resizing");
  saveSettings();
};

// 处理键盘事件
const handleKeyDown = (e: KeyboardEvent) => {
  // 快捷键处理，例如ESC关闭历史详情
  if (e.key === 'Escape' && historyDetailVisible.value) {
    historyDetailVisible.value = false;
  }
};

// 暴露属性给父组件
defineExpose({
  resultColumnWidth,
  isResizing,
  setActiveTab,
  activeTab
});
</script>

<style scoped lang="scss">
.api-result-column {
  flex: 0 0 auto;
  width: v-bind(resultColumnWidth + 'px');
  min-width: 350px;
  max-width: 1200px;
  height: 100%;
  position: relative;
  border-left: 1px solid #e0e0e0;
  transition: width 0.05s ease;

  .column-header {
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-bg-color-overlay);
    z-index: 1;

    .column-title {
      margin: 0 0 10px;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    .result-tabs {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
      
      .result-tab {
        padding: 4px 12px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-regular);
        
        &:hover {
          background-color: var(--el-color-primary-light-9);
        }
        
        &.active {
          background-color: var(--el-color-primary);
          color: white;
        }
      }
    }
  }
  
  .result-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    height: calc(100% - 90px);
    
    .result-content {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .result-actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--el-fill-color-light);
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
      
      .code-block {
        flex: 1;
        overflow-y: auto;
        margin: 0;
        padding: 16px;
        font-family: "Courier New", Courier, monospace;
        font-size: 14px;
        line-height: 1.5;
        background-color: var(--el-bg-color);
        white-space: pre-wrap;
        word-break: break-all;
        border-radius: 4px;
        border: 1px solid var(--el-border-color-lighter);
      }

      // 接口文档样式
      .doc-section {
        margin-bottom: 20px;
        padding: 0 16px;
        
        &:first-child {
          padding-top: 16px;
        }
        
        .doc-title {
          font-size: 16px;
          margin: 0 0 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--el-border-color-light);
          color: var(--el-text-color-primary);
        }
        
        .doc-content {
          padding: 0 8px;
          
          p {
            margin: 8px 0;
            line-height: 1.6;
            color: var(--el-text-color-regular);
          }
          
          .response-tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 16px;
            
            .response-tab {
              padding: 6px 12px;
              border-radius: 4px;
              font-size: 14px;
              cursor: pointer;
              background-color: var(--el-fill-color-light);
              color: var(--el-text-color-regular);
              
              &:hover {
                background-color: var(--el-color-primary-light-9);
              }
              
              &.active {
                background-color: var(--el-color-primary);
                color: white;
              }
            }
          }
          
          .response-content {
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 6px;
            overflow: hidden;
          }
        }
      }
      
      // 调试结果样式
      .debug-toolbar {
        padding: 16px;
        display: flex;
        gap: 12px;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
      
      .debug-request,
      .debug-response {
        padding: 16px;
        
        .debug-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 12px;
          font-size: 16px;
          color: var(--el-text-color-primary);
          
          .response-time {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            font-weight: normal;
          }
          
          .status-code {
            font-size: 14px;
            padding: 2px 8px;
            border-radius: 4px;
            
            &.success {
              background-color: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }
            
            &.error {
              background-color: var(--el-color-danger-light-9);
              color: var(--el-color-danger);
            }
          }
        }
      }
      
      .debug-response {
        margin-top: 20px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
      
      // SDK 代码示例样式
      .code-language-tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 16px;
        overflow-x: auto;
        padding: 16px 16px 0;
        flex-wrap: wrap;
        
        .language-tab {
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background-color: var(--el-fill-color-light);
          color: var(--el-text-color-regular);
          white-space: nowrap;
          
          &:hover {
            background-color: var(--el-color-primary-light-9);
          }
          
          &.active {
            background-color: var(--el-color-primary);
            color: white;
          }
        }
      }
      
      .code-example {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 0 16px 16px;
      }
      
      // 历史记录样式
      .history-toolbar {
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
      
      .history-detail {
        padding: 16px;
        
        .detail-item {
          margin-bottom: 16px;
          
          .detail-label {
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--el-text-color-primary);
          }
          
          .detail-value {
            padding: 8px;
            background-color: var(--el-fill-color-light);
            border-radius: 4px;
            
            pre {
              margin: 0;
            }
          }
        }
      }
      
      // 错误码样式
      .error-codes-toolbar {
        padding: 16px;
        border-bottom: 1px solid var(--el-border-color-lighter);
      }
    }
  }
}

.column-resizer {
  position: absolute;
  left: 0;
  top: 0;
  width: 6px;
  height: 100%;
  cursor: col-resize;
  background-color: transparent;
  transition: background-color 0.2s;
  z-index: 10;
}

.column-resizer:hover,
.column-resizer:active {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 当正在调整大小时应用于body的样式 */
:global(body.resizing) {
  cursor: col-resize;
  user-select: none;
}

// 响应式适配
@media (max-width: 1200px) {
  .api-result-column {
    width: 100%;
    min-width: 100%;
  }
}
</style> 