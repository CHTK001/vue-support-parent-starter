<template>
  <div class="api-params-column" :style="{ width: `${paramsColumnWidth}px` }">
    <div v-if="!selectedApi" class="empty-state">
      <el-empty description="请选择一个 API" :image-size="120">
        <template #description>
          <p>从左侧列表选择一个 API 接口查看详情</p>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div class="column-header">
        <h3 class="column-title">{{ selectedApi.name }}</h3>
        <div class="api-path">
          <div class="api-server-select">
            <el-select v-model="selectedServer" placeholder="选择接口地址" size="small">
              <el-option
                v-for="server in apiServers"
                :key="server.url"
                :label="server.description || server.url"
                :value="server.url"
              />
            </el-select>
          </div>
          <div class="api-endpoint">
            <span class="method-badge" :class="selectedApi.method.toLowerCase()">{{ selectedApi.method }}</span>
            <span class="path-text">{{ selectedApi.path }}</span>
          </div>
        </div>
      </div>

      <div class="params-container">
        <!-- API 描述 -->
        <div class="param-section">
          <div class="section-header">
            <h4 class="section-title">API 说明</h4>
          </div>
          <div class="section-content description-content">
            <p>{{ selectedApi.description || "暂无描述" }}</p>
          </div>
        </div>
        
        <!-- 请求参数 -->
        <div class="param-section">
          <div class="section-header">
            <h4 class="section-title">请求参数</h4>
            <div class="section-actions">
              <el-switch
                v-model="showRequiredOnly"
                active-text="仅显示必填"
                inactive-text=""
                size="small"
                style="margin-right: 12px;"
              />
              <el-button type="primary" size="small" plain @click="resetParams">重置参数</el-button>
            </div>
          </div>
          <div class="section-content">
            <div v-if="filteredParameters.length > 0" class="params-form">
              <div v-for="param in filteredParameters" :key="param.name" class="param-item">
                <div class="param-header">
                  <span class="param-name">{{ param.name }}</span>
                  <el-tag v-if="param.required" type="danger" size="small" effect="plain">必填</el-tag>
                </div>
                <div class="param-input">
                  <el-input 
                    v-model="requestParams[param.name]" 
                    :placeholder="param.description || '请输入'"
                    size="default"
                  />
                </div>
                <div class="param-desc">
                  <span class="param-type">类型: {{ param.type }}</span>
                  <p>{{ param.description }}</p>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无请求参数" :image-size="100" />
          </div>
        </div>

        <!-- 请求示例 -->
        <div class="param-section">
          <div class="section-header">
            <h4 class="section-title">请求示例</h4>
            <div class="section-actions">
              <el-button 
                type="primary" 
                size="small" 
                @click="executeRequest"
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
                复制
              </el-button>
            </div>
          </div>
          <div class="section-content">
            <pre class="code-block">{{ requestExample }}</pre>
          </div>
        </div>
      </div>
    </template>
    
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
  apiServers: { url: string; description: string }[];
}>();

const emit = defineEmits(['execute-request', 'params-reset', 'params-updated']);

// 状态变量
const selectedServer = ref("");
const requestParams = ref<Record<string, any>>({});
const showRequiredOnly = ref(false);
const requestLoading = ref(false);

// 列宽调整相关变量
const STORAGE_KEY = 'hybrid-doc-params-width';
const DEFAULT_PARAMS_WIDTH = 380; // 默认参数列宽度
const MIN_PARAMS_WIDTH = 280; // 最小参数列宽度
const MAX_PARAMS_WIDTH = 800; // 最大参数列宽度

const paramsColumnWidth = ref(DEFAULT_PARAMS_WIDTH);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

// 计算属性：过滤后的参数列表
const filteredParameters = computed(() => {
  if (!props.selectedApi || !props.selectedApi.parameters) {
    return [];
  }
  
  if (showRequiredOnly.value) {
    return props.selectedApi.parameters.filter(param => param.required);
  }
  
  return props.selectedApi.parameters;
});

// 计算属性：请求示例
const requestExample = computed(() => {
  return getRequestExample();
});

// 方法：获取请求示例
const getRequestExample = () => {
  if (!props.selectedApi) return "";
  
  // 使用选定的服务器URL，如果没有选择则使用示例URL
  const baseUrl = selectedServer.value || "http://example.com/api";
  let url = `${baseUrl}${props.selectedApi.path}`;
  const method = props.selectedApi.method;
  
  // 区分不同类型的参数
  const pathParams: Record<string, any> = {};
  const queryParams: Record<string, any> = {};
  const bodyParams: Record<string, any> = {};
  
  // 处理参数
  if (props.selectedApi.parameters && props.selectedApi.parameters.length > 0) {
    props.selectedApi.parameters.forEach(param => {
      const value = requestParams.value[param.name];
      
      // 跳过没有值的参数
      if (value === undefined || value === "") return;
      
      // 处理路径参数
      if (url.includes(`{${param.name}}`)) {
        pathParams[param.name] = value;
        // 替换URL中的路径参数
        url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
      } 
      // 对于GET请求，非路径参数视为查询参数
      else if (method === 'GET') {
        queryParams[param.name] = value;
      } 
      // 对于其他请求，将参数放入请求体
      else {
        bodyParams[param.name] = value;
      }
    });
  }
  
  // 构建查询字符串
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  // 添加查询字符串到URL
  if (queryString) {
    url += `?${queryString}`;
  }
  
  // 构建cURL命令
  let curlCmd = `curl -X ${method} "${url}"`;
  
  // 添加请求头
  curlCmd += ` \\\n  -H "Content-Type: application/json"`;
  
  // 添加请求体
  if (method !== 'GET' && Object.keys(bodyParams).length > 0) {
    curlCmd += ` \\\n  -d '${JSON.stringify(bodyParams, null, 2)}'`;
  }
  
  return curlCmd;
};

// 方法：重置请求参数
const resetParams = () => {
  requestParams.value = {};
  
  // 初始化参数默认值
  if (props.selectedApi?.parameters) {
    props.selectedApi.parameters.forEach(param => {
      // 如果是必填参数，可以设置一些默认值示例
      if (param.required) {
        if (param.type === 'string') {
          requestParams.value[param.name] = '';
        } else if (param.type === 'integer' || param.type === 'number') {
          requestParams.value[param.name] = '';
        } else if (param.type === 'boolean') {
          requestParams.value[param.name] = false;
        }
      }
    });
  }
  
  emit('params-reset', requestParams.value);
};

// 方法：执行请求
const executeRequest = () => {
  if (!props.selectedApi) return;
  
  requestLoading.value = true;
  
  // 将请求参数和API信息传给父组件处理
  emit('execute-request', {
    api: props.selectedApi,
    params: requestParams.value,
    server: selectedServer.value
  });
  
  // 假设请求完成后会由父组件设置requestLoading为false
  // 这里模拟一个短暂的加载状态
  setTimeout(() => {
    requestLoading.value = false;
  }, 1500);
};

// 方法：复制请求示例
const copyRequestExample = () => {
  const example = getRequestExample();
  navigator.clipboard.writeText(example)
    .then(() => {
      message("请求示例已复制到剪贴板", { type: "success" });
    })
    .catch(err => {
      message("复制失败，请手动复制", { type: "error" });
    });
};

// 开始鼠标拖动调整
const startResize = (e: MouseEvent) => {
  isResizing.value = true;
  startX.value = e.clientX;
  startWidth.value = paramsColumnWidth.value;
  
  // 添加事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  
  // 添加禁止选择文本的类
  document.body.classList.add('resizing');
};

// 开始触摸拖动调整（移动设备）
const startTouchResize = (e: TouchEvent) => {
  isResizing.value = true;
  startX.value = e.touches[0].clientX;
  startWidth.value = paramsColumnWidth.value;
  
  // 添加事件监听
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', stopTouchResize);
  
  // 添加禁止选择文本的类
  document.body.classList.add('resizing');
  
  // 阻止默认行为（避免移动设备上的滚动）
  e.preventDefault();
};

// 处理鼠标移动
const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;
  
  const offsetX = e.clientX - startX.value;
  let newWidth = startWidth.value + offsetX;
  
  // 限制最小和最大宽度
  newWidth = Math.max(MIN_PARAMS_WIDTH, Math.min(MAX_PARAMS_WIDTH, newWidth));
  
  paramsColumnWidth.value = newWidth;
};

// 处理触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (!isResizing.value) return;
  
  const offsetX = e.touches[0].clientX - startX.value;
  let newWidth = startWidth.value + offsetX;
  
  // 限制最小和最大宽度
  newWidth = Math.max(MIN_PARAMS_WIDTH, Math.min(MAX_PARAMS_WIDTH, newWidth));
  
  paramsColumnWidth.value = newWidth;
};

// 停止鼠标拖动调整
const stopResize = () => {
  isResizing.value = false;
  
  // 移除事件监听
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  
  // 移除禁止选择文本的类
  document.body.classList.remove('resizing');
  
  // 保存宽度到 localStorage
  saveWidthToStorage();
};

// 停止触摸拖动调整
const stopTouchResize = () => {
  isResizing.value = false;
  
  // 移除事件监听
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopTouchResize);
  
  // 移除禁止选择文本的类
  document.body.classList.remove('resizing');
  
  // 保存宽度到 localStorage
  saveWidthToStorage();
};

// 保存宽度设置到 localStorage
const saveWidthToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, paramsColumnWidth.value.toString());
  } catch (error) {
    console.error('保存列宽到本地存储时出错:', error);
  }
};

// 从 localStorage 加载宽度设置
const loadWidthFromStorage = () => {
  try {
    const savedWidth = localStorage.getItem(STORAGE_KEY);
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (!isNaN(width) && width >= MIN_PARAMS_WIDTH && width <= MAX_PARAMS_WIDTH) {
        paramsColumnWidth.value = width;
      }
    }
  } catch (error) {
    console.error('从本地存储加载列宽时出错:', error);
  }
};

// 监听参数变化
watch(requestParams, () => {
  emit('params-updated', requestParams.value);
}, { deep: true });

// 监听选中的API变化
watch(() => props.selectedApi, (newApi) => {
  if (newApi) {
    resetParams();
  }
});

// 在组件挂载时初始化
onMounted(() => {
  // 加载保存的列宽设置
  loadWidthFromStorage();
  
  // 初始化服务器选择
  if (props.apiServers && props.apiServers.length > 0 && !selectedServer.value) {
    selectedServer.value = props.apiServers[0].url;
  }
});

// 组件卸载前清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopTouchResize);
  document.body.classList.remove('resizing');
});
</script>

<style scoped lang="scss">
.api-params-column {
  min-width: 280px; // 最小宽度
  max-width: 800px; // 最大宽度
  flex-shrink: 0;
  overflow: hidden;
  transition: none; // 取消过渡效果以便拖动更流畅
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-right: 1px solid var(--el-border-color-light);
  
  // 拖动调整条
  .column-resizer {
    width: 5px;
    height: 100%;
    background-color: var(--el-border-color-light);
    cursor: col-resize;
    transition: background-color 0.2s;
    position: absolute;
    right: 0;
    top: 0;
    z-index: 10;
    
    &:hover, &:active {
      background-color: var(--el-color-primary-light-5);
    }
    
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 1px;
      height: 20px;
      background-color: var(--el-color-primary-light-7);
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    &:hover::after {
      opacity: 1;
    }
  }

  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: 20px;
  }

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
  }

  .api-path {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 8px 0;
    
    .api-server-select {
      width: 100%;
      
      .el-select {
        width: 100%;
      }
    }
    
    .api-endpoint {
      display: flex;
      align-items: center;
    }
    
    .method-badge {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 10px;
      
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
    
    .path-text {
      font-family: "Courier New", Courier, monospace;
      color: var(--el-text-color-regular);
      font-size: 14px;
      word-break: break-all;
    }
  }

  .params-container {
    flex: 1;
    overflow-y: auto;
    padding: 0 16px 16px;
    
    // 参数区块
    .param-section {
      margin-bottom: 24px;
      border: 1px solid var(--el-border-color-lighter);
      border-radius: 8px;
      overflow: hidden;
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: var(--el-fill-color-light);
        border-bottom: 1px solid var(--el-border-color-lighter);
        
        .section-title {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
        
        .section-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }
      
      .section-content {
        padding: 16px;
        
        &.description-content {
          color: var(--el-text-color-regular);
          font-size: 14px;
          line-height: 1.6;
        }
        
        .params-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          
          .param-item {
            .param-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 6px;
              
              .param-name {
                font-weight: 500;
                color: var(--el-text-color-primary);
              }
            }
            
            .param-input {
              margin-bottom: 4px;
            }
            
            .param-desc {
              font-size: 12px;
              color: var(--el-text-color-secondary);
              
              .param-type {
                background-color: var(--el-fill-color-light);
                padding: 2px 6px;
                border-radius: 4px;
                font-family: "Courier New", Courier, monospace;
                margin-right: 8px;
              }
              
              p {
                margin: 4px 0 0;
                line-height: 1.5;
              }
            }
          }
        }
      }
    }
  }
  
  .code-block {
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
}

// 响应式适配
@media (max-width: 1200px) {
  .api-params-column {
    width: 100% !important; // 覆盖内联样式
    min-width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--el-border-color-light);
    max-height: 40vh;
  }
}

@media (max-width: 768px) {
  .api-params-column {
    .params-container {
      .param-section {
        .section-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 8px;
        }
      }
    }
  }
}
</style> 