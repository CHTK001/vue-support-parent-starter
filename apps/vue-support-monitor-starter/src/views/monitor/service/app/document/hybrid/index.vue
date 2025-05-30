<template>
  <div class="hybrid-document">
    <!-- 加载状态 -->
    <div v-if="loading" class="document-loading">
      <div class="loading-spinner" />
      <p class="loading-text">文档加载中，请稍候...</p>
    </div>

    <!-- 三列文档结构 -->
    <div v-else class="document-layout">
      <!-- 第一列：API 接口列表 -->
      <ApiList 
        :categories="filteredCategories" 
        :selectedApiId="selectedApi?.id"
        @api-selected="handleApiSelected"
        @search-change="handleSearchChange"
      />

      <!-- 拖动调整条 -->
      <div 
        class="column-resizer"
        @mousedown="startResize"
        @touchstart="startTouchResize"
      ></div>

      <!-- 第二列：API 参数设置 -->
      <ApiParams 
        :selectedApi="selectedApi"
        :apiServers="apiServers"
        @execute-request="executeRequest"
        @params-reset="handleParamsReset"
        @params-updated="handleParamsUpdated"
      />

      <!-- 第三列：API 结果展示 -->
      <ApiResult 
        :selectedApi="selectedApi"
        :requestExample="getRequestExample()"
        :requestLoading="requestLoading"
        :customResponse="customResponse"
        :responseStatus="responseStatus"
        :responseTime="responseTime"
        @execute-request="executeRequest"
        @copy-request="copyRequestExample"
        @copy-response="copyCustomResponse"
        @copy-code="copyCode"
        @tab-change="handleTabChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";
import { fetchAppDocumentList } from "@/api/monitor/app-document";
import ApiList from "./ApiList.vue";
import ApiParams from "./ApiParams.vue";
import ApiResult from "./ApiResult.vue";

// 接口类型
interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  in?: string; 
  schema?: any;
}

interface ApiResponse {
  code: number;
  message: string;
  data: any;
  description?: string;
}

interface ApiExample {
  java?: string;
  python?: string;
  javascript?: string;
  go?: string;
  curl?: string;
  [key: string]: string;
}

interface ApiItem {
  id: string;
  name: string;
  path: string;
  method: string;
  description: string;
  summary?: string;
  serviceId: string;
  operationId?: string;
  tags?: string[];
  parameters?: ApiParameter[];
  requestBody?: {
    content?: Record<string, {
      schema?: any;
    }>;
    required?: boolean;
  };
  responses?: {
    success?: ApiResponse;
    error?: ApiResponse;
    [key: string]: ApiResponse;
  };
  examples?: ApiExample;
}

// 接收服务列表属性
const props = defineProps<{
  services: any[];
  documentId: string;
  selectedDocumentId: string[];
}>();

// 定义emit
const emit = defineEmits(['update:services', 'loaded']);

// 状态变量
const loading = ref(true);
const searchQuery = ref("");
const selectedApi = ref<ApiItem | null>(null);
const requestParams = ref<Record<string, any>>({});
const activeResultTab = ref("doc");
const activeLanguage = ref("curl");
const requestLoading = ref(false);
const customResponse = ref("");
const responseStatus = ref(200);
const responseTime = ref(0);

// API文档数据（从接口获取）
const apiDocData = ref<any[]>([]);

// 服务器相关变量
const apiServers = ref([
  { url: "http://api.example.com", description: "生产环境" },
  { url: "http://test-api.example.com", description: "测试环境" },
  { url: "http://dev-api.example.com", description: "开发环境" }
]);

// OpenAPI 原始数据
const openApis = ref<any[]>([]);

// 列宽调整相关变量
const STORAGE_KEY = 'hybrid-doc-params-width';
const DEFAULT_PARAMS_WIDTH = 380; // 默认参数列宽度
const MIN_PARAMS_WIDTH = 280; // 最小参数列宽度
const MAX_PARAMS_WIDTH = 800; // 最大参数列宽度

const paramsColumnWidth = ref(DEFAULT_PARAMS_WIDTH);
const isResizing = ref(false);
const startX = ref(0);
const startWidth = ref(0);

// 计算属性：获取所有分类列表，并根据搜索关键词过滤
const filteredCategories = computed(() => {
  console.log('apiDocData数据:', apiDocData.value);
  
  // 使用从接口获取的API文档数据
  if (apiDocData.value && apiDocData.value.length > 0) {
    const categories = [];
    // 将服务下的各个分类提取出来
    for (const service of apiDocData.value) {
      console.log('处理服务:', service);
      if (service.apis && service.apis.length > 0) {
        console.log('服务的APIs:', service.apis);
        for (const api of service.apis) {
          if (api.isCategory) {
            console.log('找到分类:', api);
            categories.push(api);
          }
        }
      } else {
        // 如果服务没有APIs或APIs为空，创建一个默认分类
        console.log('服务没有APIs或APIs为空，创建默认分类');
        const defaultCategory = {
          id: `category-default-${service.serviceId}`,
          name: `${service.name} 默认分类`,
          description: `${service.name} 的API`,
          isCategory: true,
          apis: []
        };
        categories.push(defaultCategory);
      }
    }
    console.log('提取的分类列表:', categories);
    return categories;
  }
  console.log('没有找到任何API文档数据');
  return [];
});

// 初始化文档
const initialApiDoc = () => {
  // 设置加载状态
  loading.value = true;
  
  //获取文档信息
  fetchAppDocumentList({
    monitorId: props.documentId,
    serverId: props.selectedDocumentId?.join(',')
  }).then(res => {
    if (res.code === "00000" && res.data) {
      // 保存原始OpenAPI数据
      openApis.value = res.data;
      console.log('API文档接口返回数据:', res.data);
      
      // 将OpenAPI格式转换为页面可用的树形结构数据
      const convertedData = convertOpenApiToTreeData(res.data);
      console.log('转换后的API文档数据:', convertedData);
      
      // 将转换后的数据保存到本地状态
      apiDocData.value = convertedData;
      
      // 如果当前没有选中的API且有数据，选择第一个API
      if (!selectedApi.value && filteredCategories.value && filteredCategories.value.length > 0) {
        const firstCategory = filteredCategories.value[0];
        if (firstCategory.apis && firstCategory.apis.length > 0) {
          selectedApi.value = firstCategory.apis[0];
          resetParams();
        }
      }
      
      // 通知父组件数据加载完成
      emit('loaded', { success: true, data: convertedData });
    } else {
      // 处理API加载失败的情况
      message(`获取API文档失败: ${res.msg || '未知错误'}`, { type: "error" });
      emit('loaded', { success: false, error: res.msg || '获取API文档失败' });
    }
  }).catch(error => {
    console.error('获取API文档出错:', error);
    message("获取API文档失败，请稍后重试", { type: "error" });
    // 通知父组件加载失败
    emit('loaded', { success: false, error: '获取API文档失败，请稍后重试' });
  }).finally(() => {
    // 延迟关闭加载状态，给UI一些时间渲染
    setTimeout(() => {
      loading.value = false;
    }, 500);
  });
};

// 将OpenAPI格式数据转换为页面可用的格式
const convertOpenApiToTreeData = (openApiData: any) => {
  if (!openApiData) return [];
  
  const serviceGroups: any[] = [];
  
  // 遍历OpenAPI数据，按服务分组
  Object.keys(openApiData).forEach(serviceKey => {
    const serviceData = openApiData[serviceKey];
    
    if (!serviceData || !serviceData.paths) {
      return;
    }
    
    // 创建服务分组
    const serviceGroup: any = {
      id: `service-${serviceKey}`,
      name: serviceData.info?.title || serviceKey,
      description: serviceData.info?.description || '',
      serviceId: serviceKey,
      apis: []
    };
    
    // 处理服务器信息
    if (serviceData.servers && serviceData.servers.length > 0) {
      // 更新全局的服务器列表
      apiServers.value = serviceData.servers.map((server: any) => ({
        url: server.url,
        description: server.description || server.url
      }));
    }
    
    // 处理API路径信息
    const paths = serviceData.paths;
    if (paths) {
      // 分类集合，用于将API分组
      const categories: Record<string, any> = {};
      
      // 遍历所有路径
      Object.keys(paths).forEach(path => {
        const pathItem = paths[path];
        
        // 遍历所有HTTP方法（GET, POST, PUT, DELETE等）
        Object.keys(pathItem).forEach(method => {
          if (method === 'parameters') return; // 跳过全局参数
          
          const operation = pathItem[method];
          if (!operation) return;
          
          // 获取API标签（分类）
          const tags = operation.tags || ['default'];
          
          // 对于每个标签，将API添加到对应的分类中
          tags.forEach((tag: string) => {
            // 如果分类不存在，创建新分类
            if (!categories[tag]) {
              categories[tag] = {
                id: `category-${tag}`,
                name: tag,
                description: `${tag}分类下的API`,
                isCategory: true,
                apis: []
              };
            }
            
            // 构造API对象
            const apiId = operation.operationId || `${method}-${path}`;
            const api: ApiItem = {
              id: apiId,
              name: operation.summary || path,
              path: path,
              method: method.toUpperCase(),
              description: operation.description || operation.tags?.[0] || '',
              summary: operation.summary || '',
              serviceId: serviceKey,
              operationId: operation.operationId,
              tags: operation.tags,
              parameters: []
            };
            
            // 添加参数信息
            const parameters = [...(pathItem.parameters || []), ...(operation.parameters || [])];
            if (parameters.length > 0) {
              api.parameters = parameters.map((param: any) => ({
                name: param.name,
                type: param.schema?.type || 'string',
                required: param.required || false,
                description: param.description || '',
                in: param.in
              }));
            }
            
            // 处理请求体参数
            if (operation.requestBody) {
              api.requestBody = operation.requestBody;
              
              // 添加请求体参数到parameters数组
              const content = operation.requestBody.content;
              if (content) {
                Object.keys(content).forEach(contentType => {
                  const schema = content[contentType].schema;
                  if (schema && schema.properties) {
                    Object.keys(schema.properties).forEach(propName => {
                      const prop = schema.properties[propName];
                      // 添加请求体参数
                      api.parameters.push({
                        name: propName,
                        type: prop.type || 'string',
                        required: (schema.required || []).includes(propName),
                        description: prop.description || '',
                        in: 'body'
                      });
                    });
                  }
                });
              }
            }
            
            // 处理响应信息
            if (operation.responses) {
              api.responses = {};
              
              // 成功响应
              if (operation.responses['200']) {
                api.responses.success = {
                  code: 200,
                  message: 'Success',
                  description: operation.responses['200'].description || 'Successful operation',
                  data: {}
                };
              }
              
              // 错误响应
              if (operation.responses['400'] || operation.responses['500']) {
                api.responses.error = {
                  code: operation.responses['400'] ? 400 : 500,
                  message: 'Error',
                  description: (operation.responses['400'] || operation.responses['500']).description || 'Error occurred',
                  data: {}
                };
              }
            }
            
            // 添加API到分类
            categories[tag].apis.push(api);
          });
        });
      });
      
      // 将所有分类添加到服务分组
      serviceGroup.apis = Object.values(categories);
    }
    
    serviceGroups.push(serviceGroup);
  });
  
  return serviceGroups;
};

// 方法：获取请求示例
const getRequestExample = () => {
  if (!selectedApi.value) return "";
  
  // 使用选定的服务器URL，如果没有选择则使用示例URL
  const baseUrl = apiServers.value.length > 0 ? apiServers.value[0].url : "http://example.com/api";
  let url = `${baseUrl}${selectedApi.value.path}`;
  const method = selectedApi.value.method;
  
  // 区分不同类型的参数
  const pathParams: Record<string, any> = {};
  const queryParams: Record<string, any> = {};
  const bodyParams: Record<string, any> = {};
  
  // 处理参数
  if (selectedApi.value.parameters && selectedApi.value.parameters.length > 0) {
    selectedApi.value.parameters.forEach(param => {
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
  if (selectedApi.value?.parameters) {
    selectedApi.value.parameters.forEach(param => {
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
  
  // 清除自定义响应
  customResponse.value = "";
};

// 方法：执行请求
const executeRequest = () => {
  if (!selectedApi.value) return;
  
  requestLoading.value = true;
  
  // 记录开始时间
  const startTime = Date.now();
  
  // 模拟请求延迟
  setTimeout(() => {
    // 计算响应时间
    responseTime.value = Date.now() - startTime;
    
    // 随机生成成功或失败响应
    if (Math.random() > 0.2) {
      // 成功响应
      responseStatus.value = 200;
      
      // 创建动态响应结果
      const result = {
        code: "00000",
        message: "success",
        data: {
          requestId: `req-${Date.now()}`,
          timestamp: new Date().toISOString(),
          params: { ...requestParams.value },
          result: [
            {
              id: Math.floor(Math.random() * 1000),
              name: "示例数据" + Math.floor(Math.random() * 100),
              status: "active",
              createTime: new Date().toISOString()
            }
          ]
        }
      };
      
      customResponse.value = JSON.stringify(result, null, 2);
    } else {
      // 错误响应
      responseStatus.value = Math.random() > 0.5 ? 400 : 500;
      
      const errorTypes = [
        { code: "A0001", message: "用户请求参数错误" },
        { code: "B0001", message: "系统执行出错" },
        { code: "C0001", message: "调用第三方服务出错" }
      ];
      
      const randomError = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      
      // 创建错误响应
      const error = {
        code: randomError.code,
        message: randomError.message,
        data: null,
        requestId: `req-${Date.now()}`
      };
      
      customResponse.value = JSON.stringify(error, null, 2);
    }
    
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

// 方法：复制自定义响应
const copyCustomResponse = () => {
  if (!customResponse.value) {
    message("没有可复制的响应内容", { type: "warning" });
    return;
  }
  
  navigator.clipboard.writeText(customResponse.value)
    .then(() => {
      message("响应结果已复制到剪贴板", { type: "success" });
    })
    .catch(err => {
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
  navigator.clipboard.writeText(code as string)
    .then(() => {
      message(`${language} 代码示例已复制到剪贴板`, { type: "success" });
    })
    .catch(err => {
      message("复制失败，请手动复制", { type: "error" });
    });
};

// 处理来自子组件的事件
const handleApiSelected = (api: ApiItem) => {
  selectedApi.value = api;
  resetParams();
};

const handleSearchChange = (query: string) => {
  searchQuery.value = query;
};

const handleParamsReset = (params: Record<string, any>) => {
  requestParams.value = params;
};

const handleParamsUpdated = (params: Record<string, any>) => {
  requestParams.value = params;
};

const handleTabChange = (tab: string) => {
  activeResultTab.value = tab;
};

// 列宽调整方法
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

// 监听服务列表变化
watch(
  () => props.services,
  newServices => {
    if (newServices && newServices.length > 0) {
      // 如果有服务和API，默认选中第一个API
      if (!selectedApi.value) {
        // 尝试找到第一个分类的第一个API
        for (const service of newServices) {
          if (service.apis && service.apis.length > 0) {
            for (const category of service.apis) {
              if (category.isCategory && category.apis && category.apis.length > 0) {
                selectedApi.value = category.apis[0];
                resetParams();
                break;
              }
            }
            if (selectedApi.value) break;
          }
        }
      }
    }
  },
  { immediate: true, deep: true }
);

// 监听选中的文档ID变化
watch(
  () => props.selectedDocumentId,
  () => {
    // 当选中的文档ID变化时，重新加载API文档
    initialApiDoc();
  },
  { immediate: false }
);

// 组件卸载前清理事件监听
onBeforeUnmount(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopTouchResize);
  document.body.classList.remove('resizing');
});

// 在组件挂载时初始化
onMounted(() => {
  // 加载保存的列宽设置
  loadWidthFromStorage();
  
  // 初始化文档数据
  initialApiDoc();
});

// 导出组件
defineExpose({
  name: 'HybridDocument'
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

  // 三列布局
  .document-layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    
    // 拖动调整条
    .column-resizer {
      width: 5px;
      height: 100%;
      background-color: var(--el-border-color-light);
      cursor: col-resize;
      transition: background-color 0.2s;
      z-index: 10;
      position: relative;
      
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

// 全局样式：禁止文本选择
:global(.resizing) {
  user-select: none;
  cursor: col-resize !important;
}
</style> 