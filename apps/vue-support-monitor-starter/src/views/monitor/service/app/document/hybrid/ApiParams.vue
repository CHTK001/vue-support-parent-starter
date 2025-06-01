<template>
  <div class="api-params-column">
    <div v-if="!selectedApi" class="empty-state">
      <el-empty description="请选择一个 API" :image-size="120">
        <template #description>
          <p>从左侧列表选择一个 API 接口查看详情</p>
        </template>
      </el-empty>
    </div>
    <template v-else>
      <div class="column-header">
        <h3 class="column-title">
          <el-tag v-if="selectedApi.method.toLowerCase() === 'DELETE'" type="danger" class="method-badge"
            :class="selectedApi.method.toLowerCase()">{{ selectedApi.method }}</el-tag>
          <el-tag v-else type="primary" class="method-badge" :class="selectedApi.method.toLowerCase()">{{
            selectedApi.method }}</el-tag>
          {{ selectedApi.name }}
        </h3>
        <div class="api-path">
          <div class="api-server-select flex justify-between">
            <div class="text-sm w-[100px]">服务地址：</div>
            <el-select v-model="selectedServer" placeholder="选择接口地址" size="small">
              <el-option v-for="server in apiServers" :key="server.url" :label="server.description || server.url"
                :value="server.url" />
            </el-select>
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
              <el-switch v-model="showRequiredOnly" active-text="仅显示必填" inactive-text="" size="small"
                style="margin-right: 12px;" />
              <el-button type="primary" size="small" plain @click="resetParams">重置参数</el-button>
            </div>
          </div>
          <div class="section-content">
            <div v-if="filteredParameters.length > 0" class="params-form">
              <div v-for="param in filteredParameters" :key="param.name" class="param-item">
                <div class="param-header">
                  <div class="param-name-container">
                    <span class="param-name">{{ param.name }}</span>
                    <span class="param-desc-inline">{{ param.description }}</span>
                  </div>
                  <div class="param-tags">
                    <span class="param-type">{{ param.type }}</span>
                    <el-tag v-if="param.required" type="danger" size="small" effect="plain">必填</el-tag>
                  </div>
                </div>
                <div class="param-input">
                  <div class="input-with-example">
                    <el-input v-model="requestParams[param.name]" :placeholder="param.description || '请输入'"
                      size="default" />
                    <el-tooltip v-if="getExampleValue(param.type)" content="填充示例值" placement="top" :show-after="300">
                      <el-button class="example-btn" type="primary" link size="small" @click="fillExampleValue(param)">
                        示例值
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>
              </div>
            </div>
            <el-empty v-else description="暂无请求参数" :image-size="100" />
          </div>
        </div>

        <!-- 请求体 -->
        <div class="param-section">
          <div class="section-header">
            <h4 class="section-title">请求体</h4>
            <div class="section-actions">
              <el-button type="info" size="small" plain @click="copyRequestBody">
                复制
              </el-button>
            </div>
          </div>
          <div class="section-content">
            <sc-code-editor v-model="requestBody" mode="json" :height="200" />
          </div>
        </div>
        <!-- 发送请求按钮移至参数表单下方 -->
        <div class="form-actions">
          <el-button type="primary" @click="executeRequest" >
            发送请求
          </el-button>
          <div v-if="showCallStatus" class="call-status" :class="callStatusType">
            <i :class="callStatusIcon"></i>
            <span>{{ callStatusText }}</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { message } from "@repo/utils";
import scCodeEditor from "@repo/components/scCodeEditor/index.vue";

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
const requestBody = ref(""); // 用户可编辑的请求体内容

// 调用状态显示
const showCallStatus = ref(false);
const callStatusType = ref('');
const callStatusText = ref('');
const callStatusIcon = ref('');

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
  
  // 检查必填参数
  const missingRequiredParams = [];
  if (props.selectedApi.parameters) {
    props.selectedApi.parameters.forEach(param => {
      if (param.required && 
         (requestParams.value[param.name] === undefined || 
          requestParams.value[param.name] === '' ||
          requestParams.value[param.name] === null)) {
        missingRequiredParams.push(param.name);
      }
    });
  }
  
  // 如果有缺失的必填参数，显示错误信息并中断请求
  if (missingRequiredParams.length > 0) {
    const errorMsg = `请填写必填参数: ${missingRequiredParams.join(', ')}`;
    message(errorMsg, { type: "error" });
    setCallStatus('error', errorMsg);
    return;
  }
  
  requestLoading.value = true;
  showCallStatus.value = false;
  
  // 将请求参数、请求体和API信息传给父组件处理
  emit('execute-request', {
    api: props.selectedApi,
    params: requestParams.value,
    body: requestBody.value,
    server: selectedServer.value
  });
};

// 方法：设置调用状态
const setCallStatus = (status: string, message: string) => {
  showCallStatus.value = true;
  callStatusType.value = status;
  callStatusText.value = message;
  callStatusIcon.value = status === 'success' ? 'el-icon-check' : 'el-icon-close';
  
  // 5秒后自动隐藏状态提示
  setTimeout(() => {
    showCallStatus.value = false;
  }, 5000);
};

// 辅助方法：根据参数类型获取示例值
const getExampleValue = (type: string): any => {
  switch (type.toLowerCase()) {
    case 'string':
      return 'example';
    case 'integer':
    case 'number':
      return 10;
    case 'boolean':
      return true;
    case 'array':
      return [1, 2, 3];
    case 'object':
      return { key: 'value' };
    default:
      return null;
  }
};

// 方法：填充示例值
const fillExampleValue = (param: any) => {
  const exampleValue = getExampleValue(param.type);
  if (exampleValue !== null) {
    requestParams.value[param.name] = exampleValue;
    message(`已为 ${param.name} 填充示例值`, { type: "success" });
  }
};

// 方法：复制请求体
const copyRequestBody = () => {
  navigator.clipboard.writeText(requestBody.value)
    .then(() => {
      message("请求体已复制到剪贴板", { type: "success" });
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

// 获取参数对象的辅助函数
const getParamsObject = () => {
  const paramsObj: Record<string, any> = {};
  requestParams.value.forEach(param => {
    if (param.value !== undefined && param.value !== '') {
      paramsObj[param.name] = param.value;
    }
  });
  return paramsObj;
};

// 监听参数变化
watch(requestParams, () => {
  emit('params-updated', requestParams.value);
}, { deep: true });

// 监听选中的API变化
watch(() => props.selectedApi, (newApi) => {
  if (newApi) {
    console.log(newApi);
    resetParams();
    
    // 初始化请求体
    if (newApi.method !== 'GET') {
      // 对于非GET请求，从参数中提取body参数作为初始JSON
      const bodyParams = {};
      if (newApi.parameters) {
        newApi.parameters.forEach(param => {
          // 跳过路径参数
          if (!newApi.path.includes(`{${param.name}}`)) {
            bodyParams[param.name] = '';
          }
        });
      }
      requestBody.value = Object.keys(bodyParams).length > 0 
        ? JSON.stringify(bodyParams, null, 2) 
        : '{\n  \n}';
    } else {
      // GET请求通常不需要请求体
      requestBody.value = '';
    }
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

// 暴露方法给父组件
defineExpose({
  paramsColumnWidth,
  isResizing,
  updateParams: (params: Record<string, any>) => {
    // 遍历参数并更新表单值
    if (params && typeof params === 'object') {
      Object.keys(params).forEach(key => {
        // 查找匹配的参数字段
        const index = requestParams.value.findIndex(param => param.name === key);
        if (index !== -1) {
          // 更新参数值
          requestParams.value[index].value = params[key];
        }
      });
      
      // 触发表单更新
      nextTick(() => {
        emit('params-updated', getParamsObject());
      });
    }
  },
  setCallStatus
});
</script>

<style scoped lang="scss">
// API 参数样式
.api-params-column {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  padding: 0 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  color: var(--el-text-color-secondary);
}

.column-header {
  padding: 12px 0;
  position: sticky;
  top: 0;
  background-color: var(--el-bg-color);
  z-index: 10;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 16px;
  
  .column-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 10px 0;
    
    .method-badge {
      margin-right: 8px;
      font-weight: 600;
      
      &.get {
        background-color: #67c23a;
        border-color: #67c23a;
      }
      
      &.post {
        background-color: #409eff;
        border-color: #409eff;
      }
      
      &.put {
        background-color: #e6a23c;
        border-color: #e6a23c;
      }
      
      &.delete {
        background-color: #f56c6c;
        border-color: #f56c6c;
      }
    }
  }
  
  .api-path {
    font-size: 13px;
    word-break: break-all;
    margin-top: 8px;
    
    .api-server-select {
      margin-top: 8px;
    }
  }
}

.params-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 24px;
}

.param-section {
  display: flex;
  flex-direction: column;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .section-title {
      font-size: 15px;
      font-weight: 600;
      margin: 0;
      color: var(--el-text-color-primary);
    }
    
    .section-actions {
      display: flex;
      align-items: center;
    }
  }
  
  .section-content {
    background-color: var(--el-fill-color-light);
    border-radius: 4px;
    padding: 16px;
    
    &.description-content {
      font-size: 14px;
      line-height: 1.5;
      color: var(--el-text-color-regular);
    }
  }
}

.params-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  .param-item {
    display: flex;
    flex-direction: column;
    gap: 8px;
    
    .param-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      
      .param-name-container {
        display: flex;
        flex-direction: column;
        
        .param-name {
          font-size: 14px;
          font-weight: 500;
        }
        
        .param-desc-inline {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          margin-top: 2px;
        }
      }
      
      .param-tags {
        display: flex;
        align-items: center;
        gap: 6px;
        
        .param-type {
          font-size: 12px;
          color: var(--el-text-color-secondary);
          background: var(--el-fill-color);
          padding: 2px 6px;
          border-radius: 4px;
        }
      }
    }
    
    .param-input {
      .input-with-example {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .el-input {
          flex: 1;
        }
        
        .example-btn {
          flex-shrink: 0;
        }
      }
    }
  }
}

.form-actions {
  display: flex;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-light);
  
  .call-status {
    margin-left: 16px;
    font-size: 14px;
    display: flex;
    align-items: center;
    
    i {
      margin-right: 6px;
    }
    
    &.success {
      color: var(--el-color-success);
    }
    
    &.error {
      color: var(--el-color-danger);
    }
  }
}
</style> 