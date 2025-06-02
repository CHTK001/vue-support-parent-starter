<template>
  <div class="api-result-column">
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
        <div v-if="customResponse" class="debug-response">
          <!-- 响应状态信息 -->
          <div class="response-status-bar">
            <div class="response-status-info">
              <span class="status-code" :class="responseStatus < 400 ? 'success' : 'error'">
                状态码: {{ responseStatus }}
              </span>
              <span class="response-time">响应时间: {{ responseTime }}ms</span>
              <span 
                v-if="responseContentType" 
                class="response-type-tag"
                :class="{
                  'json': isJsonResponse,
                  'image': isImageResponse,
                  'pdf': isPdfResponse
                }"
              >
                {{ getResponseTypeName() }}
              </span>
            </div>
            <div class="result-actions">
              <el-button-group>
                <el-button 
                  type="info" 
                  size="small"
                  plain
                  @click="formatResponse"
                >
                  格式化
                </el-button>
                <el-button 
                  type="info" 
                  size="small"
                  plain
                  @click="copyCustomResponse"
                >
                  复制
                </el-button>
              </el-button-group>
            </div>
          </div>
          
          <!-- 响应头信息 -->
          <div class="response-headers">
            <div class="headers-title" @click="toggleHeaders">
              响应头信息
              <span class="toggle-icon">{{ showHeaders ? '▲' : '▼' }}</span>
            </div>
            <div v-if="showHeaders" class="headers-content">
              <div v-if="Object.keys(responseHeaders).length" class="headers-list">
                <div v-for="(value, key) in responseHeaders" :key="key" class="header-item">
                  <span class="header-name">{{ key }}:</span>
                  <span class="header-value">{{ value }}</span>
                </div>
              </div>
              <div v-else class="no-headers">无响应头信息</div>
            </div>
          </div>
          
          <!-- 响应内容，根据内容类型显示不同格式 -->
          <div class="response-content">
            <!-- 响应内容主体区域 -->
            <div class="response-main">
              <!-- 如果是JSON或默认文本 -->
              <div v-if="!isImageResponse && !isPdfResponse" class="text-response">
                <sc-code-editor
                  v-if="isJsonResponse"
                  v-model="formattedResponse"
                  :mode="getResponseMode()"
                  :readOnly="true"
                  :height="650"
                  :options="{
                    lineNumbers: true,
                    foldGutter: true,
                    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                    matchBrackets: true,
                    autoRefresh: true,
                    styleActiveLine: true,
                  }"
                />
                <pre v-else class="code-block">{{ customResponse }}</pre>
              </div>

              <!-- 如果是PDF或其他文档 -->
              <div v-if="isPdfResponse" class="pdf-response">
                <div class="document-info">
                  <span class="document-icon">📄</span>
                  <span>{{ getDocumentTypeName() }} 文档</span>
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="downloadResponse"
                  >
                    下载文件
                  </el-button>
                </div>
              </div>
            </div>
            
            <!-- 图片显示区域 - 固定在底部 -->
            <div v-if="isImageResponse" class="image-response-container">
              <div class="image-response-header">
                <span class="image-title">
                  <i class="el-icon-picture-outline"></i>
                  图片预览
                </span>
                <el-button 
                  type="primary" 
                  size="small"
                  @click="openImageInNewTab"
                  v-if="getImageDataUrl()"
                >
                  查看原图
                </el-button>
              </div>
              <div class="image-response">
                <div v-if="getImageDataUrl()" class="image-container">
                  <img 
                    :src="getImageDataUrl()" 
                    alt="API Response Image" 
                    @error="handleImageError"
                    @load="imageLoaded = true"
                    v-show="imageLoaded"
                  />
                  <div v-if="!imageLoaded && !imageError" class="image-loading">
                    <div class="loading-spinner"></div>
                    <span>图片加载中...</span>
                  </div>
                  <div v-if="imageError" class="image-error">
                    <i class="el-icon-picture-outline"></i>
                    <span>{{ imageErrorMessage }}</span>
                  </div>
                </div>
                <div v-else class="image-error">
                  <i class="el-icon-picture-outline"></i>
                  <span>无法解析图片数据</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 空状态 -->
        <div v-else class="empty-debug-state">
          <el-empty description="暂无响应数据" :image-size="120">
            <template #description>
              <p>发送请求后，这里将显示API响应结果</p>
            </template>
            <el-button type="primary" @click="$emit('execute-request')">发送请求</el-button>
          </el-empty>
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
          <sc-code-editor
            v-if="selectedApi"
            :modelValue="generateSdkExample(selectedApi, activeLanguage)"
            :mode="getLanguageMode(activeLanguage)"
            :readOnly="true"
            :height="'100%'"
          ></sc-code-editor>
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
          <el-table-column label="操作" width="180">
            <template #default="scope">
              <el-button type="text" size="small" @click="viewHistoryDetail(scope.row)">
                查看详情
              </el-button>
              <el-button type="text" size="small" @click="fillHistoryParams(scope.row)">
                使用参数
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
            <div class="dialog-footer">
              <el-button @click="historyDetailVisible = false">关闭</el-button>
              <el-button type="primary" @click="fillHistoryParams(selectedHistory)">使用这些参数</el-button>
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
          :data="highlightedErrorCodes"
          border
          style="width: 100%"
          size="small"
        >
          <el-table-column label="错误码" width="120">
            <template #default="scope">
              <span v-html="scope.row.highlightedCode || scope.row.code"></span>
            </template>
          </el-table-column>
          <el-table-column label="错误信息">
            <template #default="scope">
              <span v-html="scope.row.highlightedMessage || scope.row.message"></span>
            </template>
          </el-table-column>
          <el-table-column label="错误说明">
            <template #default="scope">
              <span v-html="scope.row.highlightedDescription || scope.row.description"></span>
            </template>
          </el-table-column>
          <el-table-column prop="solution" label="解决方案" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { message } from "@repo/utils";
import scCodeEditor from "@repo/components/scCodeEditor/index.vue";
import "codemirror/mode/yaml/yaml";
import "codemirror/mode/python/python";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/go/go";
// 导入json模式用于高亮
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/fold/foldcode";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/fold/foldgutter.css";

const props = defineProps<{
  selectedApi: any | null;
  requestExample: string;
  requestLoading: boolean;
  customResponse: string;
  requestUrl: string;
  responseStatus: number;
  responseTime: number;
  responseHeaders: Record<string, string>;
  responseContentType: string;
}>();

const emit = defineEmits(['execute-request', 'copy-request', 'copy-response', 'copy-code', 'tab-change', 'fill-params']);

// 状态变量
const activeTab = ref("doc");
const activeLanguage = ref("curl");
const activeResponseTab = ref("success");
const errorCodeSearch = ref("");
const historyDetailVisible = ref(false);
const selectedHistory = ref<any>(null);
const callHistory = ref<any[]>([]);
const showHeaders = ref(false);
const formattedResponse = ref("");

// 图片状态
const imageLoaded = ref(false);
const imageError = ref(false);
const imageErrorMessage = ref('');

// 历史记录存储键
const HISTORY_STORAGE_KEY = 'api-call-history';
const MAX_HISTORY_ITEMS = 10;

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

// 计算属性：获取高亮的错误码列表（用于呈现）
const highlightedErrorCodes = computed(() => {
  if (!errorCodeSearch.value) {
    return filteredErrorCodes.value;
  }
  
  const searchLower = errorCodeSearch.value.toLowerCase();
  return filteredErrorCodes.value.map(code => {
    const highlightedCode = {
      ...code,
      highlightedCode: highlightText(code.code, searchLower),
      highlightedMessage: highlightText(code.message, searchLower),
      highlightedDescription: highlightText(code.description, searchLower)
    };
    return highlightedCode;
  });
});

// 计算属性：判断响应内容类型
const isJsonResponse = computed(() => {
  if (!props.responseContentType) return false;
  
  return props.responseContentType.includes('application/json') || 
         props.responseContentType.includes('text/json') ||
         (typeof props.customResponse === 'string' && 
          (props.customResponse.trim().startsWith('{') || 
           props.customResponse.trim().startsWith('[')));
});

const isImageResponse = computed(() => {
  if (!props.responseContentType) return false;
  
  return props.responseContentType.includes('image/');
});

const isPdfResponse = computed(() => {
  if (!props.responseContentType) return false;
  
  return props.responseContentType.includes('application/pdf') || 
         props.responseContentType.includes('application/vnd.openxmlformats-officedocument') ||
         props.responseContentType.includes('application/msword');
});

// 本地存储API的最后选择
const LAST_SELECTED_TAB_KEY = 'hybrid-doc-last-selected-tab';

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
  if (!props.selectedApi) return;
  
  const code = generateSdkExample(props.selectedApi, language);
  navigator.clipboard.writeText(code)
    .then(() => {
      message(`${language.toUpperCase()} 代码已复制到剪贴板`, { type: "success" });
    })
    .catch(err => {
      message("复制失败，请手动复制", { type: "error" });
    });
};

// 获取语言对应的CodeMirror模式
const getLanguageMode = (language: string): string => {
  const modeMap: Record<string, string> = {
    'curl': 'bash',
    'java': 'text/x-java',
    'python': 'python',
    'javascript': 'javascript',
    'go': 'go'
  };
  return modeMap[language] || 'text';
};

// 辅助函数：高亮文本中的搜索关键词
const highlightText = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<span class="highlight-text">$1</span>');
};

// 生成SDK示例代码
const generateSdkExample = (api: any, language: string): string => {
  if (!api) return '';
  
  const baseUrl = 'http://example.com/api';
  const path = api.path;
  const method = api.method;
  const parameters = api.parameters || [];
  
  // 提取不同类型的参数
  const pathParams = parameters.filter(p => path.includes(`{${p.name}}`));
  const queryParams = method === 'GET' 
    ? parameters.filter(p => !path.includes(`{${p.name}}`))
    : [];
  const bodyParams = method !== 'GET' 
    ? parameters.filter(p => !path.includes(`{${p.name}}`))
    : [];
  
  // 替换路径参数的URL
  let url = path;
  pathParams.forEach(param => {
    url = url.replace(`{${param.name}}`, `\${${param.name}}`);
  });
  
  // 根据语言生成不同的示例
  switch (language) {
    case 'curl':
      return generateCurlExample(baseUrl, url, method, queryParams, bodyParams);
    case 'java':
      return generateJavaExample(baseUrl, url, method, pathParams, queryParams, bodyParams, api.name);
    case 'python':
      return generatePythonExample(baseUrl, url, method, pathParams, queryParams, bodyParams);
    case 'javascript':
      return generateJavaScriptExample(baseUrl, url, method, pathParams, queryParams, bodyParams);
    case 'go':
      return generateGoExample(baseUrl, url, method, pathParams, queryParams, bodyParams, api.name);
    default:
      return 'No example available for this language.';
  }
};

// 方法：加载调用历史记录
const loadCallHistory = () => {
  try {
    // 从本地存储加载历史记录
    const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (savedHistory) {
      callHistory.value = JSON.parse(savedHistory);
      message("已加载历史记录", { type: "success" });
      return;
    }
  } catch (error) {
    console.error('加载历史记录失败:', error);
  }
  
  // 如果没有历史记录或加载失败，生成模拟数据
  // 在实际应用中，这部分应该被移除
  const now = new Date();
  
  // 生成模拟数据
  callHistory.value = Array.from({ length: 5 }, (_, i) => {
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
        params: { 
          param1: "测试参数1",
          param2: i * 10
        }
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
  
  // 保存到本地存储
  saveCallHistory();
  message("历史记录已刷新", { type: "success" });
};

// 保存调用历史到本地存储
const saveCallHistory = () => {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(callHistory.value.slice(0, MAX_HISTORY_ITEMS)));
  } catch (error) {
    console.error('保存历史记录失败:', error);
  }
};

// 查看历史详情
const viewHistoryDetail = (historyItem: any) => {
  selectedHistory.value = historyItem;
  historyDetailVisible.value = true;
};

// 填充历史参数
const fillHistoryParams = (historyItem: any) => {
  if (historyItem && historyItem.request && historyItem.request.params) {
    emit('fill-params', historyItem.request.params);
    message("已填充历史参数", { type: "success" });
  } else {
    message("无可用的历史参数", { type: "warning" });
  }
};

// 响应头
const responseHeaders = ref<Record<string, string>>({});

// 方法：格式化响应内容
const formatResponse = () => {
  try {
    if (isJsonResponse.value) {
      // 尝试格式化JSON
      const parsedJson = JSON.parse(props.customResponse);
      formattedResponse.value = JSON.stringify(parsedJson.response.data, null, 2);
      responseHeaders.value = parsedJson.response.headers;
    } else {
      // 非JSON内容，保持原样
      formattedResponse.value = props.customResponse;
    }
    message("响应内容已格式化", { type: "success" });
  } catch (error) {
    console.error('格式化响应失败:', error);
    message("格式化响应失败，内容可能不是有效的JSON", { type: "error" });
    formattedResponse.value = props.customResponse;
  }
};

// 方法：切换显示响应头
const toggleHeaders = () => {
  showHeaders.value = !showHeaders.value;
};

// 方法：获取响应内容模式
const getResponseMode = () => {
  if (isJsonResponse.value) {
    return 'application/json';
  }
  return 'text';
};

// 方法：获取文档类型名称
const getDocumentTypeName = () => {
  if (props.responseContentType.includes('application/pdf')) {
    return 'PDF';
  } else if (props.responseContentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
    return 'Word';
  } else if (props.responseContentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
    return 'Excel';
  } else if (props.responseContentType.includes('application/vnd.openxmlformats-officedocument.presentationml.presentation')) {
    return 'PowerPoint';
  } else if (props.responseContentType.includes('application/msword')) {
    return 'Word';
  }
  return '文档';
};

// 方法：获取图片数据URL
const getImageDataUrl = () => {
  try {
    // 检查内容类型是否为图片
    if (isImageResponse.value) {
      // 1. 首先尝试解析JSON响应，查找图片URL
      if (props.customResponse.trim().startsWith('{')) {
        const response = JSON.parse(props.customResponse);
        
        // 如果响应中包含图片URL
        if (response && response.data) {
          // 情况1: 响应data字段直接是完整的URL
          if (typeof response.data === 'string' && (
              response.data.startsWith('http://') || 
              response.data.startsWith('https://') ||
              response.data.startsWith('//')
            )) {
            return response.data;
          }
          
          // 情况2: data字段是base64编码的图片数据
          if (typeof response.data === 'string' && response.data.startsWith('data:image/')) {
            return response.data;
          }
          
          // 情况3: data字段是普通base64字符串（无data:URL前缀）
          if (typeof response.data === 'string' && isBase64(response.data)) {
            return `data:${props.responseContentType};base64,${response.data}`;
          }
          
          // 情况4: data字段中可能包含URL属性
          if (typeof response.data === 'object' && response.data !== null) {
            // 尝试查找常见的URL字段名
            const urlFields = ['url', 'imageUrl', 'image', 'src', 'path', 'link'];
            for (const field of urlFields) {
              if (response.data[field] && typeof response.data[field] === 'string') {
                return response.data[field];
              }
            }
          }
        }
        
        // 检查其他可能包含图片URL的字段
        const urlFields = ['url', 'imageUrl', 'image', 'src', 'path', 'link'];
        for (const field of urlFields) {
          if (response[field] && typeof response[field] === 'string') {
            return response[field];
          }
        }
      }
      
      // 2. 如果不是JSON或没有找到URL，检查响应本身是否为URL
      const trimmedResponse = props.customResponse.trim();
      if (trimmedResponse.startsWith('http://') || trimmedResponse.startsWith('https://') || trimmedResponse.startsWith('//')) {
        return trimmedResponse;
      }
      
      // 3. 检查响应是否为base64编码
      if (trimmedResponse.startsWith('data:image/')) {
        return trimmedResponse;
      }
      
      // 4. 检查是否为纯base64字符串
      if (isBase64(trimmedResponse)) {
        return `data:${props.responseContentType};base64,${trimmedResponse}`;
      }
      
      // 如果都不是，显示提示信息
      console.warn('图片数据格式无法识别，无法显示');
      return props.requestUrl;
    }
  } catch (e) {
    console.error('解析图片数据失败:', e);
  }
  
  // 如果没有合适的数据或解析失败，返回空字符串
  return '';
};

// 辅助函数：检查字符串是否是有效的Base64
const isBase64 = (str: string): boolean => {
  try {
    return btoa(atob(str)) === str;
  } catch (err) {
    return false;
  }
};

// 处理图片加载错误
const handleImageError = (e: Event) => {
  imageError.value = true;
  imageLoaded.value = false;
  imageErrorMessage.value = '图片加载失败';
  console.error('图片加载失败:', e);
};

// 在新标签页中打开图片
const openImageInNewTab = () => {
  const url = getImageDataUrl();
  if (url) {
    window.open(url, '_blank');
  }
};

// 生成cURL示例
const generateCurlExample = (baseUrl, url, method, queryParams, bodyParams) => {
  let queryString = '';
  if (queryParams.length > 0) {
    queryString = '?' + queryParams.map(p => `${p.name}=value`).join('&');
  }
  
  let example = `curl -X ${method} "${baseUrl}${url}${queryString}"`;
  example += ` \\\n  -H "Content-Type: application/json"`;
  
  if (method !== 'GET' && bodyParams.length > 0) {
    const body = {};
    bodyParams.forEach(param => {
      body[param.name] = getDefaultValueByType(param.type);
    });
    example += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  }
  
  return example;
};

// 辅助函数：根据类型获取默认值
const getDefaultValueByType = (type: string): any => {
  switch (type.toLowerCase()) {
    case 'string':
      return 'example';
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'object':
      return {};
    case 'array':
      return [];
    default:
      return null;
  }
};

// 方法：下载响应内容为文件
const downloadResponse = () => {
  try {
    // 尝试将响应内容解析为对象
    const response = JSON.parse(props.customResponse);
    
    if (response && response.data) {
      // 创建Blob对象
      const blob = b64toBlob(response.data, props.responseContentType);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `api-response-${Date.now()}.${getFileExtension()}`;
      document.body.appendChild(a);
      a.click();
      
      // 清理
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      message("文件下载已开始", { type: "success" });
    } else {
      message("响应数据格式不正确，无法下载", { type: "warning" });
    }
  } catch (error) {
    console.error('下载文件失败:', error);
    message("下载文件失败", { type: "error" });
  }
};

// 辅助方法：Base64转Blob
const b64toBlob = (base64: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

// 辅助方法：获取文件扩展名
const getFileExtension = () => {
  if (props.responseContentType.includes('pdf')) {
    return 'pdf';
  } else if (props.responseContentType.includes('msword')) {
    return 'doc';
  } else if (props.responseContentType.includes('officedocument.word')) {
    return 'docx';
  } else if (props.responseContentType.includes('excel') || props.responseContentType.includes('spreadsheet')) {
    return 'xlsx';
  } else {
    return 'bin';
  }
};

// 生命周期钩子和其他方法
// 设置活动标签页
const setActiveTab = (tab: string) => {
  activeTab.value = tab;
  emit("tab-change", tab);
};

// 在组件挂载时初始化
onMounted(() => {
  loadSettings();
  loadCallHistory(); // 确保初始化加载历史数据
});

// 加载设置
const loadSettings = () => {
  try {
    // 加载上次选择的API和标签页
    const lastSelectedTab = localStorage.getItem(LAST_SELECTED_TAB_KEY);
    if (lastSelectedTab) {
      activeTab.value = lastSelectedTab;
    }
  } catch (e) {
    console.error("Error loading settings:", e);
  }
};

// 记录当前API调用
const recordApiCall = (status: 'success' | 'error', params: any, response: any) => {
  const now = new Date();
  const timeStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  
  const historyItem = {
    id: `call-${Date.now()}`,
    time: timeStr,
    status: status,
    duration: props.responseTime,
    ip: '127.0.0.1', // 在实际应用中可能需要从别处获取
    request: {
      method: props.selectedApi?.method || 'GET',
      path: props.selectedApi?.path || '',
      params: params
    },
    response: response
  };
  
  // 添加到历史记录
  callHistory.value.unshift(historyItem);
  
  // 限制历史记录数量
  if (callHistory.value.length > MAX_HISTORY_ITEMS) {
    callHistory.value = callHistory.value.slice(0, MAX_HISTORY_ITEMS);
  }
  
  // 保存到本地存储
  saveCallHistory();
};

// 监听自定义响应变化，自动格式化
watch(() => props.customResponse, (newValue) => {
  if (newValue) {
    formatResponse();
  }
});

// 在每次响应变化时重置图片状态
watch(() => props.customResponse, () => {
  imageLoaded.value = false;
  imageError.value = false;
  imageErrorMessage.value = '';
});

// 获取响应类型名称
const getResponseTypeName = () => {
  if (isJsonResponse.value) {
    return 'JSON';
  } else if (isImageResponse.value) {
    return '图片';
  } else if (isPdfResponse.value) {
    return '文档';
  } else if (props.responseContentType) {
    // 从Content-Type中提取主要类型
    const mainType = props.responseContentType.split(';')[0].trim();
    return mainType;
  }
  return '未知类型';
};

// 生成Java (OkHttp) 示例
const generateJavaExample = (baseUrl, url, method, pathParams, queryParams, bodyParams, apiName) => {
  let methodName = apiName.replace(/[^a-zA-Z0-9]/g, '');
  methodName = methodName.charAt(0).toLowerCase() + methodName.slice(1);
  
  let fullUrl = `${baseUrl}${url}`;
  if (queryParams.length > 0) {
    fullUrl += '?' + queryParams.map(p => `${p.name}=\${${p.name}}`).join('&');
  }
  
  let example = `import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.RequestBody;
import okhttp3.MediaType;
import java.io.IOException;

public class ApiClient {
    private final OkHttpClient client = new OkHttpClient();
    private static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    
    public void ${methodName}(`;

  // 添加方法参数
  const allParams = [...pathParams, ...queryParams, ...bodyParams];
  example += allParams.map(param => {
    const javaType = getJavaTypeForParam(param.type);
    return `${javaType} ${param.name}`;
  }).join(', ');
  
  example += `) throws IOException {
`;

  // 构建请求体
  if (method !== 'GET' && bodyParams.length > 0) {
    example += `        // 构建请求体
        String jsonBody = "{\\"`;
    example += bodyParams.map(p => `${p.name}\\":" + ${p.name} + "\\"`).join(', "');
    example += `}";
    RequestBody body = RequestBody.create(jsonBody, JSON);
`;
  }
  
  // 构建请求
  example += `        // 构建请求
       Request request = new Request.Builder()
           .url("${fullUrl}")`;

  if (method !== 'GET') {
    example += `
           .${method.toLowerCase()}(${bodyParams.length > 0 ? 'body' : 'null'})`;
  }

  example += `
           .addHeader("Content-Type", "application/json")
           .build();
           
       // 执行请求
       try (Response response = client.newCall(request).execute()) {
           if (!response.isSuccessful()) throw new IOException("Unexpected code " + response);
           
           // 处理响应
           String responseBody = response.body().string();
           System.out.println(responseBody);
       }
   }
}`;

  return example;
};

// 生成Python示例
const generatePythonExample = (baseUrl, url, method, pathParams, queryParams, bodyParams) => {
  let fullUrl = `${baseUrl}${url}`;
  
  let example = `import requests
import json

# 设置API参数
`;

  // 添加参数
  [...pathParams, ...queryParams, ...bodyParams].forEach(param => {
    example += `${param.name} = ${getPythonValueByType(param.type)}  # ${param.description || 'Parameter description'}\n`;
  });
  
  example += `
# 设置请求头
headers = {
    'Content-Type': 'application/json'
}

`;

  // 处理URL和查询参数
  if (queryParams.length > 0) {
    example += `# 设置查询参数
params = {
`;
    queryParams.forEach(param => {
      example += `    '${param.name}': ${param.name},\n`;
    });
    example += `}

`;
  }

  // 处理请求体
  if (method !== 'GET' && bodyParams.length > 0) {
    example += `# 设置请求体
payload = {
`;
    bodyParams.forEach(param => {
      example += `    '${param.name}': ${param.name},\n`;
    });
    example += `}

`;
  }

  // 发送请求
  example += `# 发送请求
response = requests.${method.toLowerCase()}(
    '${fullUrl}',
    headers=headers,`;

  if (queryParams.length > 0) {
    example += `
    params=params,`;
  }

  if (method !== 'GET' && bodyParams.length > 0) {
    example += `
    data=json.dumps(payload),`;
  }

  example += `
)

# 处理响应
if response.status_code == 200:
    data = response.json()
    print(data)
else:
    print(f"Error: {response.status_code}, {response.text}")`;

  return example;
};

// 生成JavaScript示例
const generateJavaScriptExample = (baseUrl, url, method, pathParams, queryParams, bodyParams) => {
  let fullUrl = `${baseUrl}${url}`;
  
  let example = `// 使用Fetch API发送请求

// 设置API参数
`;

  // 添加参数
  [...pathParams, ...queryParams, ...bodyParams].forEach(param => {
    example += `const ${param.name} = ${getJsValueByType(param.type)}; // ${param.description || 'Parameter description'}\n`;
  });
  
  example += `
// 替换URL中的路径参数
let apiUrl = \`${fullUrl}\`;
`;

  // 替换路径参数
  if (pathParams.length > 0) {
    pathParams.forEach(param => {
      example += `// 替换${param.name}参数\n`;
    });
  }

  // 处理查询参数
  if (queryParams.length > 0) {
    example += `
// 添加查询参数
const queryParams = new URLSearchParams();
`;
    queryParams.forEach(param => {
      example += `queryParams.append('${param.name}', ${param.name});\n`;
    });
    example += `apiUrl += \`?\${queryParams.toString()}\`;
`;
  }

  example += `
// 设置请求选项
const options = {
    method: '${method}',
    headers: {
        'Content-Type': 'application/json'
    }`;
  
  // 添加请求体
  if (method !== 'GET' && bodyParams.length > 0) {
    example += `,
    body: JSON.stringify({
`;
    bodyParams.forEach((param, index) => {
      example += `        ${param.name}${index < bodyParams.length - 1 ? ',' : ''}\n`;
    });
    example += `    })`;
  }
  
  example += `
};

// 发送请求
fetch(apiUrl, options)
    .then(response => {
        if (!response.ok) {
            throw new Error(\`HTTP error! Status: \${response.status}\`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Success:', data);
    })
    .catch(error => {
        console.error('Error:', error);
    });`;
  
  return example;
};

// 生成Go示例
const generateGoExample = (baseUrl, url, method, pathParams, queryParams, bodyParams, apiName) => {
  let funcName = apiName.replace(/[^a-zA-Z0-9]/g, '');
  funcName = funcName.charAt(0).toUpperCase() + funcName.slice(1);
  
  let fullUrl = `${baseUrl}${url}`;
  
  let example = `package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "net/url"
)

// ${funcName} sends a request to ${method} ${url}
func ${funcName}() {
    // 设置API参数
`;

  // 添加参数定义
  [...pathParams, ...queryParams, ...bodyParams].forEach(param => {
    example += `    var ${param.name} ${getGoTypeForParam(param.type)} = ${getGoValueByType(param.type)} // ${param.description || 'Parameter description'}\n`;
  });
  
  example += `
    // 构建URL
    baseURL := "${baseUrl}"
    path := "${url}"
`;

  // 替换路径参数
  if (pathParams.length > 0) {
    example += `
    // 替换路径参数
`;
    // 在实际代码中需要实现替换逻辑
  }

  // 添加查询参数
  if (queryParams.length > 0) {
    example += `
    // 添加查询参数
    queryValues := url.Values{}
`;
    queryParams.forEach(param => {
      example += `    queryValues.Add("${param.name}", fmt.Sprintf("%v", ${param.name}))\n`;
    });
  }

  example += `

`;

  // 添加请求体
  if (method !== 'GET' && bodyParams.length > 0) {
    example += `    // 构建请求体
    requestBody := map[string]interface{}{
`;
    bodyParams.forEach(param => {
      example += `        "${param.name}": ${param.name},\n`;
    });
    example += `    }
    
    jsonBody, err := json.Marshal(requestBody)
    if err != nil {
        fmt.Println("Error marshaling JSON:", err)
        return
    }

`;
  }

  // 创建请求
  example += `    // 创建HTTP请求
    client := &http.Client{}
`;

  if (method !== 'GET' && bodyParams.length > 0) {
    example += `    req, err := http.NewRequest("${method}", requestURL, bytes.NewBuffer(jsonBody))
`;
  } else {
    example += `    req, err := http.NewRequest("${method}", requestURL, nil)
`;
  }

  example += `    if err != nil {
        fmt.Println("Error creating request:", err)
        return
    }

    // 设置请求头
    req.Header.Set("Content-Type", "application/json")

    // 发送请求
    resp, err := client.Do(req)
    if err != nil {
        fmt.Println("Error sending request:", err)
        return
    }
    defer resp.Body.Close()

    // 读取响应
    body, err := ioutil.ReadAll(resp.Body)
    if err != nil {
        fmt.Println("Error reading response:", err)
        return
    }

    // 处理响应
    fmt.Println("Status:", resp.Status)
    fmt.Println("Response:", string(body))
}

func main() {
    ${funcName}()
}`;

  return example;
};

// 辅助函数：根据参数类型获取Java类型
const getJavaTypeForParam = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'string':
      return 'String';
    case 'integer':
      return 'int';
    case 'number':
      return 'double';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'Map<String, Object>';
    case 'array':
      return 'List<Object>';
    default:
      return 'Object';
  }
};

// 辅助函数：根据参数类型获取Python默认值
const getPythonValueByType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'string':
      return '"example"';
    case 'integer':
    case 'number':
      return '0';
    case 'boolean':
      return 'False';
    case 'object':
      return '{}';
    case 'array':
      return '[]';
    default:
      return 'None';
  }
};

// 辅助函数：根据参数类型获取JavaScript默认值
const getJsValueByType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'string':
      return '"example"';
    case 'integer':
    case 'number':
      return '0';
    case 'boolean':
      return 'false';
    case 'object':
      return '{}';
    case 'array':
      return '[]';
    default:
      return 'null';
  }
};

// 辅助函数：根据参数类型获取Go类型
const getGoTypeForParam = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'string':
      return 'string';
    case 'integer':
      return 'int';
    case 'number':
      return 'float64';
    case 'boolean':
      return 'bool';
    case 'object':
      return 'map[string]interface{}';
    case 'array':
      return '[]interface{}';
    default:
      return 'interface{}';
  }
};

// 辅助函数：根据参数类型获取Go默认值
const getGoValueByType = (type: string): string => {
  switch (type.toLowerCase()) {
    case 'string':
      return '"example"';
    case 'integer':
      return '0';
    case 'number':
      return '0.0';
    case 'boolean':
      return 'false';
    case 'object':
      return 'make(map[string]interface{})';
    case 'array':
      return 'make([]interface{}, 0)';
    default:
      return 'nil';
  }
};

// 暴露属性给父组件
defineExpose({
  activeTab,
  setActiveTab,
  recordApiCall,
  getResponseTypeName,
  getDocumentTypeName,
  getResponseMode,
  isJsonResponse,
  isImageResponse,
  isPdfResponse
});
</script>

<style scoped lang="scss">
.api-result-column {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  border-left: 1px solid #e0e0e0;
  overflow: hidden;
  min-width: 300px;
  max-width: 100%;

  .column-header {
    flex: 0 0 auto;
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
    height: 100%;
    
    .result-content {
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      overflow: auto;
      margin-bottom: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      max-height: 100%;
      
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
      .debug-response {
        display: flex;
        flex-direction: column;
        
        .response-status-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background-color: #f5f7fa;
          border: 1px solid var(--el-border-color-light);
          border-radius: 4px;
          padding: 10px 16px;
          margin-bottom: 16px;
          
          .response-status-info {
            display: flex;
            align-items: center;
            gap: 16px;
          }
          
          .status-code {
            font-weight: 500;
            padding: 3px 8px;
            border-radius: 3px;
            
            &.success {
              background-color: var(--el-color-success-light-9);
              color: var(--el-color-success);
            }
            
            &.error {
              background-color: var(--el-color-danger-light-9);
              color: var(--el-color-danger);
            }
          }
          
          .response-time {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }
      
      .empty-debug-state {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 300px;
        
        p {
          margin-top: 8px;
          color: var(--el-text-color-secondary);
        }
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
        height: 100%;
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

/* 当正在调整大小时应用于body的样式 */
:global(body.resizing) {
  cursor: col-resize;
  user-select: none;
}

// 响应头样式
.response-headers {
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
  
  .headers-title {
    padding: 10px 16px;
    background-color: #f5f7fa;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    &:hover {
      background-color: var(--el-fill-color);
    }
    
    .toggle-icon {
      font-size: 12px;
    }
  }
  
  .headers-content {
    max-height: 200px;
    overflow-y: auto;
    background-color: #fff;
    
    .headers-list {
      .header-item {
        padding: 8px 16px;
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        
        &:nth-child(even) {
          background-color: var(--el-fill-color-light);
        }
        
        .header-name {
          font-weight: 500;
          color: var(--el-text-color-primary);
          min-width: 150px;
          margin-right: 10px;
        }
        
        .header-value {
          color: var(--el-text-color-regular);
          word-break: break-all;
        }
      }
    }
    
    .no-headers {
      padding: 12px 16px;
      color: var(--el-text-color-secondary);
      font-style: italic;
    }
  }
}

// 响应内容类型样式
.response-content {
  border: 1px solid var(--el-border-color-light);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  .response-main {
    flex: 1;
    
    .text-response {
      .code-block {
        margin: 0;
        padding: 16px;
        background-color: #f8f8f8;
        overflow: auto;
        max-height: 350px;
        font-family: monospace;
        white-space: pre-wrap;
        color: var(--el-text-color-primary);
        border-radius: 0;
      }
    }
    
    .pdf-response {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--el-fill-color-light);
      min-height: 200px;
      
      .document-info {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 24px;
        background-color: white;
        border-radius: 4px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        
        .document-icon {
          font-size: 24px;
        }
      }
    }
  }
}

.image-response-container {
  border-top: 1px solid var(--el-border-color-light);
  
  .image-response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 16px;
    background-color: #f5f7fa;
    
    .image-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      
      i {
        font-size: 16px;
      }
    }
  }
  
  .image-response {
    padding: 16px;
    background-color: #fff;
    max-height: 200px;
    overflow: auto;
    display: flex;
    justify-content: center;
    
    .image-container {
      position: relative;
      max-width: 100%;
      
      img {
        max-width: 100%;
        max-height: 180px;
        object-fit: contain;
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 4px;
        background-color: var(--el-fill-color-lighter);
      }
      
      .image-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        background-color: var(--el-fill-color-lighter);
        border-radius: 4px;
        min-width: 200px;
        min-height: 150px;
        
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid var(--el-border-color);
          border-top-color: var(--el-color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 12px;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      }
      
      .image-error {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        background-color: var(--el-fill-color-lighter);
        border-radius: 4px;
        color: var(--el-text-color-secondary);
        min-width: 200px;
        min-height: 150px;
        
        i {
          font-size: 24px;
          margin-bottom: 12px;
          color: var(--el-color-info);
        }
      }
    }
  }
}

// 响应状态标签
.response-type-tag {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  margin-left: 8px;
  font-size: 12px;
  font-weight: normal;
  border-radius: 3px;
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
  
  &.json {
    background-color: var(--el-color-success-light-9);
    color: var(--el-color-success);
  }
  
  &.image {
    background-color: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }
  
  &.pdf {
    background-color: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
  }
}

// 高亮文本样式
:deep(.highlight-text) {
  background-color: #ffff00;
  color: #000000;
  font-weight: bold;
  padding: 0 2px;
  border-radius: 2px;
}

// 对话框按钮区域
.dialog-footer {
  padding-top: 20px;
  text-align: right;
}

// 增加表格操作按钮间距
:deep(.el-table) {
  .el-button+.el-button {
    margin-left: 8px;
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
</style> 