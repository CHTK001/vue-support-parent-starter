<template>
  <div class="hybrid-document">
    <!-- 加载状态 -->
    <div v-if="loading" class="document-loading">
      <div class="loading-spinner" />
      <p class="loading-text">文档加载中，请稍候...</p>
    </div>

    <!-- 三列文档结构 -->
    <div v-else class="document-layout" :class="{ 'list-minimized': isApiListMinimized }">
      <!-- 第一列：API 接口列表 -->
      <ApiList 
        ref="apiListRef"
        :categories="filteredCategories" 
        :selectedApiId="selectedApi?.id || null"
        @api-selected="handleApiSelected"
        @search-change="handleSearchChange"
      />

      <!-- 第一个拖动调整条 -->
      <div 
        class="column-resizer first-resizer"
        @mousedown="startResizeFirstColumn"
        @touchstart="startTouchResizeFirstColumn"
      ></div>

      <!-- 第二列：API 参数设置 -->
      <div class="params-column" :style="{ width: `${paramsColumnWidth}px` }">
        <!-- 添加环境管理组件 -->
        <EnvironmentManager 
          ref="envManagerRef"
          @headers-updated="handleGlobalHeadersUpdated"
        />
        
        <ApiParams 
          ref="apiParamsRef"
          :selectedApi="selectedApi"
          :apiServers="apiServers"
          @execute-request="executeRequest"
          @params-reset="handleParamsReset"
          @params-updated="handleParamsUpdated"
        />
      </div>

      <!-- 第二个拖动调整条 -->
      <div 
        class="column-resizer second-resizer"
        @mousedown="startResizeSecondColumn"
        @touchstart="startTouchResizeSecondColumn"
      ></div>

      <!-- 第三列：API 结果展示 -->
      <ApiResult 
        ref="apiResultRef"
        :style="{ width: `${resultColumnWidth}px`, minWidth: '300px' }"
        :selectedApi="selectedApi"
        :requestExample="getRequestExample()"
        :requestLoading="requestLoading"
        :customResponse="customResponse"
        :responseStatus="responseStatus"
        :responseTime="responseTime"
        :responseHeaders="responseHeaders"
        :responseContentType="responseContentType"
        @execute-request="executeRequest"
        @copy-request="copyRequestExample"
        @copy-response="copyCustomResponse"
        @copy-code="copyCode"
        @tab-change="handleTabChange"
        @fill-params="handleFillParams"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from "vue";
import { message } from "@repo/utils";
// 如果导入路径有误，请根据实际情况修改
// @ts-ignore 忽略模块导入错误
import { fetchAppDocumentList, fetchForwardDocument } from "@/api/monitor/app-document";
import ApiList from "./ApiList.vue";
import ApiParams from "./ApiParams.vue";
import ApiResult from "./ApiResult.vue";
import EnvironmentManager from "./EnvironmentManager.vue";

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
  [key: string]: string | undefined;
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
    [key: string]: ApiResponse | undefined;
  };
  examples?: ApiExample;
}

// 组件引用类型定义
interface ApiListRef {
  isMinimized?: boolean;
}

interface ApiParamsRef {
  paramsColumnWidth?: number;
  isResizing?: boolean;
  updateParams?: (params: Record<string, any>) => void;
  setCallStatus?: (status: string, message: string) => void;
}

interface ApiResultRef {
  resultColumnWidth?: number;
  isResizing?: boolean;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  recordApiCall?: (status: string, params: Record<string, any>, response: any) => void;
}

interface EnvironmentManagerRef {
  getCurrentHeaders?: () => Record<string, string>;
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
const responseHeaders = ref<Record<string, string>>({});
const responseContentType = ref("");
// 全局 headers
const globalHeaders = ref<Record<string, string>>({});

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
const DEFAULT_API_LIST_WIDTH = 330;
const DEFAULT_PARAMS_WIDTH = 450;
const DEFAULT_RESULT_WIDTH = 450;
const MIN_COLUMN_WIDTH = 200;
const MAX_COLUMN_WIDTH = 800;

const isResizing = ref(false);
const currentResizingColumn = ref<'first' | 'second'>('first');
const startX = ref(0);
const startWidth = ref(0);
const apiListWidth = ref(DEFAULT_API_LIST_WIDTH);
const paramsColumnWidth = ref(DEFAULT_PARAMS_WIDTH);
const resultColumnWidth = ref(DEFAULT_RESULT_WIDTH);

// 存储键
const STORAGE_KEY_PARAMS = 'api-document-params-width';
const STORAGE_KEY_RESULT = 'api-document-result-width';

const apiListRef = ref<ApiListRef | null>(null);
const apiParamsRef = ref<ApiParamsRef | null>(null);
const apiResultRef = ref<ApiResultRef | null>(null);
const isApiListMinimized = computed(() => apiListRef.value?.isMinimized || false);
const isParamsResizing = computed(() => apiParamsRef.value?.isResizing || false);
const resultResizing = computed(() => apiResultRef.value?.isResizing || false);

// 添加环境管理器引用
const envManagerRef = ref<EnvironmentManagerRef | null>(null);

// 计算属性：获取所有分类列表，并根据搜索关键词过滤
const filteredCategories = computed(() => {
  console.log('apiDocData数据:', apiDocData.value);
  
  // 使用从接口获取的API文档数据
  if (apiDocData.value && apiDocData.value.length > 0) {
    const categories: any[] = []; // 使用any[]类型避免never类型错误
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
          apis: [] as any[] // 使用any[]类型避免never类型错误
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
                      if (!api.parameters) {
                        api.parameters = [];
                      }
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
  if (!selectedApi.value) return '';
  
  const api = selectedApi.value;
  const method = api.method.toUpperCase();
  const serverUrl = apiServers.value[0].url;
  const url = serverUrl + api.path;
  
  // 获取当前环境的全局 headers
  const currentGlobalHeaders = envManagerRef.value?.getCurrentHeaders?.() || {};
  
  // 构建参数
  const queryParams: Record<string, any> = {};
  const pathParams: Record<string, any> = {};
  const bodyParams: Record<string, any> = {};
  
  if (api.parameters) {
    api.parameters.forEach(param => {
      const paramValue = requestParams.value[param.name];
      
      if (paramValue !== undefined && paramValue !== '') {
        if (param.in === 'query') {
          queryParams[param.name] = paramValue;
        } else if (param.in === 'path') {
          pathParams[param.name] = paramValue;
        } else if (param.in === 'body' || !param.in) {
          bodyParams[param.name] = paramValue;
        }
      }
    });
  }
  
  // 构建查询字符串
  const queryString = Object.entries(queryParams)
    .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
    .join('&');
  
  // 添加查询字符串到URL
  let fullUrl = url;
  if (queryString) {
    fullUrl += `?${queryString}`;
  }
  
  // 构建 cURL 命令
  let curlCmd = `curl -X ${method} "${fullUrl}"`;
  
  // 添加请求头
  curlCmd += ` \\\n  -H "Content-Type: application/json"`;
  
  // 添加全局 headers
  Object.entries(currentGlobalHeaders).forEach(([key, value]) => {
    if (key && value) {
      curlCmd += ` \\\n  -H "${key}: ${value}"`;
    }
  });
  
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
const executeRequest = (requestData?: any) => {
  if (!selectedApi.value) return;
  
  requestLoading.value = true;
  
  // 记录开始时间
  const startTime = Date.now();
  
  // 获取请求数据
  const apiInfo = selectedApi.value;
  const method = apiInfo.method.toLowerCase();
  const serverUrl = requestData?.server || apiServers.value[0].url;
  const paramsData = requestData?.params || requestParams.value;
  let body;
  
  try {
    // 解析请求体，如果是JSON字符串
    if (requestData?.body) {
      body = typeof requestData.body === 'string' 
        ? JSON.parse(requestData.body) 
        : requestData.body;
    }
  } catch (error) {
    console.error('解析请求体失败:', error);
    message('请求体JSON格式错误', { type: 'error' });
    requestLoading.value = false;
    
    // 显示调用失败状态
    if (apiParamsRef.value) {
      apiParamsRef.value.setCallStatus?.('error', '请求体JSON格式错误');
    }
    return;
  }
  
  // 获取当前环境的全局 headers
  const currentGlobalHeaders = envManagerRef.value?.getCurrentHeaders?.() || {};
  
  // 构建请求参数
  const reqParams = {
    url: serverUrl + apiInfo.path,
    method: method,
    params: method === 'get' || method === 'delete' ? paramsData : undefined,
    data: (method === 'post' || method === 'put' || method === 'patch') ? body : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...currentGlobalHeaders, // 合并全局 headers
      ...(requestData?.headers || {}) // 合并请求特定的 headers
    }
  };
  
  // 确保结果标签页显示调试结果
  if (apiResultRef.value?.setActiveTab) {
    apiResultRef.value.setActiveTab('debug');
  }
  
  // 发送请求
  fetchForwardDocument(method as any, reqParams)
    .then(response => {
      // 计算响应时间
      responseTime.value = Date.now() - startTime;
      
      // 设置响应状态码
      responseStatus.value = 200;
      
      // 设置响应头信息
      if (response.headers) {
        responseHeaders.value = response.headers;
        responseContentType.value = response.headers['content-type'] || '';
      } else {
        responseHeaders.value = {};
        responseContentType.value = '';
      }
      
      // 设置响应内容
      customResponse.value = JSON.stringify(response, null, 2);
      
      // 记录到历史记录
      if (apiResultRef.value?.recordApiCall) {
        apiResultRef.value.recordApiCall('success', paramsData, response);
      }
      
      // 显示调用成功状态
      if (apiParamsRef.value) {
        apiParamsRef.value.setCallStatus?.('success', '调用成功');
      }
    })
    .catch(error => {
      // 计算响应时间
      responseTime.value = Date.now() - startTime;
      
      // 设置错误状态码
      responseStatus.value = error.status || 500;
      
      // 设置响应头信息
      if (error.headers) {
        responseHeaders.value = error.headers;
        responseContentType.value = error.headers['content-type'] || '';
      } else {
        responseHeaders.value = {};
        responseContentType.value = '';
      }
      
      // 设置错误响应
      let errorResponse;
      try {
        errorResponse = error.data || {
          code: 'ERROR',
          message: error.message || '请求失败',
          data: null
        };
      } catch (e) {
        errorResponse = {
          code: 'ERROR',
          message: '请求失败',
          data: null
        };
      }
      
      customResponse.value = JSON.stringify(errorResponse, null, 2);
      
      // 记录到历史记录
      if (apiResultRef.value?.recordApiCall) {
        apiResultRef.value.recordApiCall('error', paramsData, errorResponse);
      }
      
      // 显示调用失败状态
      if (apiParamsRef.value) {
        apiParamsRef.value.setCallStatus?.('error', errorResponse.message || '调用失败');
      }
    })
    .finally(() => {
      // 确保在任何情况下都重置loading状态
      requestLoading.value = false;
    });
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

// 处理来自历史记录的参数填充请求
const handleFillParams = (params: Record<string, any>) => {
  if (!params) return;
  
  console.log('填充历史参数:', params);
  
  // 更新请求参数
  requestParams.value = {
    ...requestParams.value,
    ...params
  };
  
  // 通知参数组件参数已更新
  if (apiParamsRef.value) {
    apiParamsRef.value.updateParams?.(requestParams.value);
  } else {
    message("参数已更新，但无法自动填充到表单", { type: "warning" });
  }
  
  // 如果当前不在调试标签页，切换到调试标签页
  if (apiResultRef.value?.activeTab !== 'debug' && apiResultRef.value?.setActiveTab) {
    apiResultRef.value.setActiveTab('debug');
  }
};

// 方法：处理全局 headers 更新
const handleGlobalHeadersUpdated = (headers: Record<string, string>) => {
  globalHeaders.value = headers;
  console.log('全局 headers 已更新:', headers);
};

// 第一个拖动条事件处理
const startResizeFirstColumn = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  isResizing.value = true;
  currentResizingColumn.value = 'first';
  startX.value = e.clientX;
  startWidth.value = paramsColumnWidth.value;
  
  // 添加事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  
  // 添加调整时的样式
  document.body.classList.add('resizing');
};

// 第二个拖动条事件处理
const startResizeSecondColumn = (e: MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  
  isResizing.value = true;
  currentResizingColumn.value = 'second';
  startX.value = e.clientX;
  startWidth.value = resultColumnWidth.value;
  
  // 添加事件监听
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', stopResize);
  
  // 添加调整时的样式
  document.body.classList.add('resizing');
};

// 鼠标移动事件处理
const handleMouseMove = (e: MouseEvent) => {
  if (!isResizing.value) return;
  e.preventDefault();
  
  const movementX = e.clientX - startX.value;
  let newWidth = 0;
  
  if (currentResizingColumn.value === 'first') {
    // 第一个拖动条 - 调整参数列宽度
    newWidth = startWidth.value + movementX;
    
    // 限制最小/最大宽度
    if (newWidth < MIN_COLUMN_WIDTH) newWidth = MIN_COLUMN_WIDTH;
    if (newWidth > MAX_COLUMN_WIDTH) newWidth = MAX_COLUMN_WIDTH;
    
    // 更新参数列宽度
    paramsColumnWidth.value = newWidth;
  } else {
    // 第二个拖动条 - 调整结果列宽度
    newWidth = startWidth.value - movementX; // 注意这里是减号，因为是从右向左拖动
    
    // 限制最小/最大宽度
    if (newWidth < MIN_COLUMN_WIDTH) newWidth = MIN_COLUMN_WIDTH;
    if (newWidth > MAX_COLUMN_WIDTH) newWidth = MAX_COLUMN_WIDTH;
    
    // 更新结果列宽度
    resultColumnWidth.value = newWidth;
  }
};

// 停止调整大小
const stopResize = () => {
  if (!isResizing.value) return;
  
  isResizing.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  
  // 移除调整时的样式
  document.body.classList.remove('resizing');
  
  // 保存列宽到本地存储
  if (currentResizingColumn.value === 'first') {
    localStorage.setItem(STORAGE_KEY_PARAMS, paramsColumnWidth.value.toString());
  } else {
    localStorage.setItem(STORAGE_KEY_RESULT, resultColumnWidth.value.toString());
  }
};

// 触摸调整方法 - 第一列和第二列之间
const startTouchResizeFirstColumn = (e: TouchEvent) => {
  isResizing.value = true;
  currentResizingColumn.value = 'first';
  startX.value = e.touches[0].clientX;
  startWidth.value = paramsColumnWidth.value;
  
  // 添加事件监听
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', stopTouchResize);
  
  // 添加禁止选择文本的类
  document.body.classList.add('resizing');
  
  e.preventDefault();
  e.stopPropagation();
};

// 触摸调整方法 - 第二列和第三列之间
const startTouchResizeSecondColumn = (e: TouchEvent) => {
  isResizing.value = true;
  currentResizingColumn.value = 'second';
  startX.value = e.touches[0].clientX;
  startWidth.value = resultColumnWidth.value;
  
  // 添加事件监听
  document.addEventListener('touchmove', handleTouchMove);
  document.addEventListener('touchend', stopTouchResize);
  
  // 添加禁止选择文本的类
  document.body.classList.add('resizing');
  
  e.preventDefault();
  e.stopPropagation();
};

// 处理触摸移动
const handleTouchMove = (e: TouchEvent) => {
  if (!isResizing.value) return;
  
  const offsetX = e.touches[0].clientX - startX.value;
  
  if (currentResizingColumn.value === 'first') {
    // 调整参数列宽度
    let newWidth = startWidth.value + offsetX;
    newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, newWidth));
    paramsColumnWidth.value = newWidth;
  } else {
    // 调整结果列宽度
    let newWidth = startWidth.value - offsetX;
    newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, newWidth));
    resultColumnWidth.value = newWidth;
  }
  
  e.preventDefault();
  e.stopPropagation();
};

// 停止触摸拖动调整
const stopTouchResize = (e: TouchEvent) => {
  if (!isResizing.value) return;
  
  isResizing.value = false;
  
  // 移除事件监听
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopTouchResize);
  
  // 移除禁止选择文本的类
  document.body.classList.remove('resizing');
  
  // 保存宽度到 localStorage
  saveWidthToStorage();
  
  e.preventDefault();
  e.stopPropagation();
};

// 保存宽度设置到 localStorage
const saveWidthToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY_PARAMS, paramsColumnWidth.value.toString());
    localStorage.setItem(STORAGE_KEY_RESULT, resultColumnWidth.value.toString());
  } catch (error) {
    console.error('保存列宽到本地存储时出错:', error);
  }
};

// 从 localStorage 加载宽度设置
const loadWidthFromStorage = () => {
  try {
    // 加载参数列宽度
    const savedParamsWidth = localStorage.getItem(STORAGE_KEY_PARAMS);
    if (savedParamsWidth) {
      const width = parseInt(savedParamsWidth, 10);
      if (!isNaN(width) && width >= MIN_COLUMN_WIDTH && width <= MAX_COLUMN_WIDTH) {
        paramsColumnWidth.value = width;
      }
    }
    
    // 加载结果列宽度
    const savedResultWidth = localStorage.getItem(STORAGE_KEY_RESULT);
    if (savedResultWidth) {
      const width = parseInt(savedResultWidth, 10);
      if (!isNaN(width) && width >= MIN_COLUMN_WIDTH && width <= MAX_COLUMN_WIDTH) {
        resultColumnWidth.value = width;
      }
    }
  } catch (error) {
    console.error('从本地存储加载列宽时出错:', error);
  }
};

// 监听API列表最小化状态
watch(isApiListMinimized, (minimized) => {
  console.log('API列表最小化状态变化:', minimized);
  // 可以添加其他响应逻辑
});

// 监听参数列和结果列宽度变化
watch([paramsColumnWidth, resultColumnWidth], () => {
  // 在开发模式下，打印列宽
  if (import.meta.env.DEV) {
    console.log('Column widths:', {
      params: paramsColumnWidth.value,
      result: resultColumnWidth.value
    });
  }
});

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
  // 清理已不再需要的事件监听器
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', stopResize);
  document.removeEventListener('touchmove', handleTouchMove);
  document.removeEventListener('touchend', stopTouchResize);
  document.body.classList.remove('resizing');
});

// 在组件挂载时初始化
onMounted(() => {
  // 初始化
  initialApiDoc();
  
  // 加载保存的列宽设置
  loadWidthFromStorage();
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
      width: 8px; // 增加宽度，使其更容易点击
      height: 100%;
      background-color: var(--el-border-color-light);
      cursor: col-resize;
      transition: background-color 0.2s;
      z-index: 100; // 提高层级，确保可点击
      position: relative;
      flex: 0 0 8px; // 固定宽度
      
      &:hover, &:active {
        background-color: var(--el-color-primary-light-5);
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 2px;
        height: 30px;
        background-color: var(--el-color-primary-light-7);
        opacity: 0;
        transition: opacity 0.2s;
      }
      
      &:hover::after {
        opacity: 1;
      }
      
      // 添加更多样式以增强视觉反馈
      &.first-resizer, &.second-resizer {
        &:hover {
          background-color: var(--el-color-primary-light-3);
        }
        
        &:before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 2px;
          height: 100px;
          background-color: var(--el-color-primary-light-5);
        }
      }
    }
    
    // 最小化列表时的布局调整
    &.list-minimized {
      .column-resizer:first-of-type {
        margin-left: 50px; // 最小化列表宽度
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
  user-select: none !important;
  cursor: col-resize !important;
  * {
    user-select: none !important;
    cursor: col-resize !important;
  }
}

// 参数列样式，包含环境管理器
.params-column {
  display: flex;
  flex-direction: column;
  flex: 0 0 auto;
  overflow: hidden;
  border-right: 1px solid var(--el-border-color-light);
  padding-top: 10px;
}
</style> 