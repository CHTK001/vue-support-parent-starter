<script setup>
import { reactive, ref, onMounted, computed, watch } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { http } from "@repo/utils";
import { saveAs } from "file-saver";
import { message } from "@repo/utils";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 环境变量
const env = reactive({
  // 请求相关
  method: "GET",
  url: "",
  params: [],
  headers: [],
  body: {
    type: "none", // none, form-data, x-www-form-urlencoded, raw, binary, graphql
    formData: [],
    urlencoded: [],
    raw: {
      type: "json", // json, text, xml, html, javascript
      content: "",
    },
    binary: null,
    graphql: {
      query: "",
      variables: "",
    },
  },
  // 响应相关
  response: {
    status: null,
    statusText: "",
    headers: {},
    data: null,
    time: 0,
    size: 0,
    type: "json", // json, text, html, xml
  },
  // 历史记录
  history: [],
  // 收藏夹
  collections: [],
  // 环境变量
  environments: [
    {
      name: "默认环境",
      variables: [
        { key: "baseUrl", value: "https://api.example.com", enabled: true },
        { key: "apiKey", value: "your-api-key", enabled: true },
      ],
      isActive: true,
    },
  ],
  // UI 状态
  loading: false,
  activeTab: "request", // request, response, history, collections
  bodyTab: "params", // params, headers, body, auth
  responseTab: "body", // body, headers, cookies
  showEnvironmentModal: false,
  showCollectionModal: false,
  newCollection: {
    name: "",
    description: "",
  },
  newEnvironment: {
    name: "",
    variables: [{ key: "", value: "", enabled: true }],
  },
  // 请求方法列表
  methods: [
    { label: "GET", value: "GET" },
    { label: "POST", value: "POST" },
    { label: "PUT", value: "PUT" },
    { label: "DELETE", value: "DELETE" },
    { label: "PATCH", value: "PATCH" },
    { label: "HEAD", value: "HEAD" },
    { label: "OPTIONS", value: "OPTIONS" },
  ],
  // 内容类型列表
  contentTypes: [
    { label: "JSON", value: "application/json" },
    { label: "XML", value: "application/xml" },
    { label: "Form URL Encoded", value: "application/x-www-form-urlencoded" },
    { label: "Form Data", value: "multipart/form-data" },
    { label: "Text", value: "text/plain" },
    { label: "HTML", value: "text/html" },
    { label: "JavaScript", value: "application/javascript" },
  ],
  // 常用请求示例
  examples: [
    { name: "获取用户列表", method: "GET", url: "https://jsonplaceholder.typicode.com/users" },
    { name: "获取单个用户", method: "GET", url: "https://jsonplaceholder.typicode.com/users/1" },
    { name: "创建用户", method: "POST", url: "https://jsonplaceholder.typicode.com/users", body: { type: "raw", raw: { type: "json", content: '{\n  "name": "John Doe",\n  "email": "john@example.com"\n}' } } },
    { name: "更新用户", method: "PUT", url: "https://jsonplaceholder.typicode.com/users/1", body: { type: "raw", raw: { type: "json", content: '{\n  "name": "John Smith",\n  "email": "john.smith@example.com"\n}' } } },
    { name: "删除用户", method: "DELETE", url: "https://jsonplaceholder.typicode.com/users/1" },
  ],
});

// 计算属性：当前环境
const currentEnvironment = computed(() => {
  return env.environments.find((env) => env.isActive) || env.environments[0];
});

// 计算属性：替换环境变量后的URL
const processedUrl = computed(() => {
  if (!env.url) return "";

  let url = env.url;
  if (currentEnvironment.value) {
    currentEnvironment.value.variables.forEach((variable) => {
      if (variable.enabled) {
        const regex = new RegExp(`{{\\s*${variable.key}\\s*}}`, "g");
        url = url.replace(regex, variable.value);
      }
    });
  }
  return url;
});

// 计算属性：请求体大小
const requestBodySize = computed(() => {
  if (env.body.type === "none") return 0;
  if (env.body.type === "raw") {
    return new Blob([env.body.raw.content]).size;
  }
  // 其他类型的请求体大小计算...
  return 0;
});

// 计算属性：响应体格式化后的内容
const formattedResponse = computed(() => {
  if (!env.response.data) return "";

  try {
    if (env.response.type === "json") {
      return JSON.stringify(env.response.data, null, 2);
    } else {
      return env.response.data;
    }
  } catch (error) {
    return env.response.data;
  }
});

// 添加请求参数
const addParam = () => {
  env.params.push({ key: "", value: "", description: "", enabled: true });
};

// 删除请求参数
const removeParam = (index) => {
  env.params.splice(index, 1);
};

// 添加请求头
const addHeader = () => {
  env.headers.push({ key: "", value: "", description: "", enabled: true });
};

// 删除请求头
const removeHeader = (index) => {
  env.headers.splice(index, 1);
};

// 添加表单数据
const addFormData = () => {
  env.body.formData.push({ key: "", value: "", type: "text", enabled: true });
};

// 删除表单数据
const removeFormData = (index) => {
  env.body.formData.splice(index, 1);
};

// 添加URL编码数据
const addUrlEncoded = () => {
  env.body.urlencoded.push({ key: "", value: "", description: "", enabled: true });
};

// 删除URL编码数据
const removeUrlEncoded = (index) => {
  env.body.urlencoded.splice(index, 1);
};

// 设置请求体类型
const setBodyType = (type) => {
  env.body.type = type;

  // 初始化对应类型的数据
  if (type === "form-data" && env.body.formData.length === 0) {
    addFormData();
  } else if (type === "x-www-form-urlencoded" && env.body.urlencoded.length === 0) {
    addUrlEncoded();
  } else if (type === "raw" && !env.body.raw.content) {
    env.body.raw.content = "";
  }
};

// 设置原始请求体类型
const setRawType = (type) => {
  env.body.raw.type = type;

  // 根据类型提供模板
  if (type === "json" && !env.body.raw.content) {
    env.body.raw.content = '{\n  "key": "value"\n}';
  } else if (type === "xml" && !env.body.raw.content) {
    env.body.raw.content = '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n  <element>value</element>\n</root>';
  }
};

// 上传二进制文件
const uploadBinaryFile = (event) => {
  const file = event.target.files[0];
  if (file) {
    env.body.binary = file;
  }
};

// 移除二进制文件
const removeBinaryFile = () => {
  env.body.binary = null;
};

// 构建请求配置
const buildRequestConfig = () => {
  const config = {
    method: env.method,
    url: processedUrl.value,
    headers: {},
    timeout: 30000,
  };

  // 添加请求头
  env.headers.forEach((header) => {
    if (header.enabled && header.key) {
      config.headers[header.key] = header.value;
    }
  });

  // 添加请求参数
  if (env.params.length > 0) {
    config.params = {};
    env.params.forEach((param) => {
      if (param.enabled && param.key) {
        config.params[param.key] = param.value;
      }
    });
  }

  // 添加请求体
  if (["POST", "PUT", "PATCH"].includes(env.method)) {
    if (env.body.type === "raw") {
      if (env.body.raw.type === "json") {
        config.headers["Content-Type"] = "application/json";
        try {
          config.data = JSON.parse(env.body.raw.content);
        } catch (e) {
          config.data = env.body.raw.content;
        }
      } else {
        config.data = env.body.raw.content;
        if (env.body.raw.type === "xml") {
          config.headers["Content-Type"] = "application/xml";
        } else if (env.body.raw.type === "html") {
          config.headers["Content-Type"] = "text/html";
        } else if (env.body.raw.type === "javascript") {
          config.headers["Content-Type"] = "application/javascript";
        } else {
          config.headers["Content-Type"] = "text/plain";
        }
      }
    } else if (env.body.type === "form-data") {
      const formData = new FormData();
      env.body.formData.forEach((item) => {
        if (item.enabled && item.key) {
          if (item.type === "file" && item.file) {
            formData.append(item.key, item.file);
          } else {
            formData.append(item.key, item.value);
          }
        }
      });
      config.data = formData;
    } else if (env.body.type === "x-www-form-urlencoded") {
      config.headers["Content-Type"] = "application/x-www-form-urlencoded";
      const params = new URLSearchParams();
      env.body.urlencoded.forEach((item) => {
        if (item.enabled && item.key) {
          params.append(item.key, item.value);
        }
      });
      config.data = params;
    } else if (env.body.type === "binary" && env.body.binary) {
      config.data = env.body.binary;
    } else if (env.body.type === "graphql") {
      config.headers["Content-Type"] = "application/json";
      config.data = {
        query: env.body.graphql.query,
        variables: env.body.graphql.variables ? JSON.parse(env.body.graphql.variables) : {},
      };
    }
  }

  return config;
};

// 发送请求
const sendRequest = async () => {
  if (!env.url) {
    message(t("message.urlRequired") || "请输入URL", { type: "warning" });
    return;
  }

  env.loading = true;
  env.response = {
    status: null,
    statusText: "",
    headers: {},
    data: null,
    time: 0,
    size: 0,
    type: "json",
  };

  const startTime = Date.now();

  try {
    const config = buildRequestConfig();
    // 使用 http.ts 替代 axios
    const response = await http.request(config.method.toLowerCase(), config.url, {
      params: config.params,
      headers: config.headers,
      data: config.data,
      timeout: config.timeout,
      responseType: config.responseType
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // 确定响应类型
    let responseType = "json";
    const contentType = response.headers["content-type"] || "";
    if (contentType.includes("application/json")) {
      responseType = "json";
    } else if (contentType.includes("text/html")) {
      responseType = "html";
    } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
      responseType = "xml";
    } else if (contentType.includes("text/plain")) {
      responseType = "text";
    }

    // 计算响应大小
    let responseSize = 0;
    if (response.data) {
      if (typeof response.data === "string") {
        responseSize = new Blob([response.data]).size;
      } else {
        responseSize = new Blob([JSON.stringify(response.data)]).size;
      }
    }

    // 更新响应信息
    env.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      time: responseTime,
      size: responseSize,
      type: responseType,
    };

    // 添加到历史记录
    addToHistory();

    // 切换到响应标签
    env.activeTab = "response";

    message(t("message.requestSuccess") || "请求成功", { type: "success" });
  } catch (error) {
    console.error("请求错误:", error);

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    if (error.response) {
      // 服务器返回了错误状态码
      env.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        time: responseTime,
        size: 0,
        type: "json",
      };
    } else {
      // 请求未到达服务器
      env.response = {
        status: 0,
        statusText: error.message || "请求失败",
        headers: {},
        data: { error: error.message },
        time: responseTime,
        size: 0,
        type: "json",
      };
    }

    message(t("message.requestError") || "请求失败: " + (error.message || "未知错误"), { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 添加到历史记录
const addToHistory = () => {
  const historyItem = {
    id: Date.now(),
    method: env.method,
    url: env.url,
    params: [...env.params],
    headers: [...env.headers],
    body: JSON.parse(JSON.stringify(env.body)),
    response: {
      status: env.response.status,
      statusText: env.response.statusText,
    },
    timestamp: new Date().toLocaleString(),
  };

  env.history.unshift(historyItem);

  // 限制历史记录数量
  if (env.history.length > 50) {
    env.history.pop();
  }

  // 保存到本地存储
  saveHistoryToLocalStorage();
};

// 保存历史记录到本地存储
const saveHistoryToLocalStorage = () => {
  try {
    localStorage.setItem("postman-history", JSON.stringify(env.history));
  } catch (error) {
    console.error("保存历史记录失败:", error);
  }
};

// 从本地存储加载历史记录
const loadHistoryFromLocalStorage = () => {
  try {
    const history = localStorage.getItem("postman-history");
    if (history) {
      env.history = JSON.parse(history);
    }
  } catch (error) {
    console.error("加载历史记录失败:", error);
  }
};

// 从历史记录加载请求
const loadFromHistory = (item) => {
  env.method = item.method;
  env.url = item.url;
  env.params = [...item.params];
  env.headers = [...item.headers];
  env.body = JSON.parse(JSON.stringify(item.body));

  message(t("message.loadedFromHistory") || "已从历史记录加载请求", { type: "success" });
};

// 复制到剪贴板
const copyToClipboard = (text, successMessage = "已复制到剪贴板") => {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      message(t("message.copySuccess") || successMessage, { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

// 下载响应内容
const downloadResponse = () => {
  if (!env.response.data) {
    message(t("message.noResponseToDownload") || "没有可下载的响应内容", { type: "warning" });
    return;
  }

  try {
    let content;
    let type;
    let extension;

    if (typeof env.response.data === "object") {
      content = JSON.stringify(env.response.data, null, 2);
      type = "application/json";
      extension = "json";
    } else {
      content = env.response.data;
      type = "text/plain";
      extension = "txt";
    }

    const blob = new Blob([content], { type: type });
    saveAs(blob, `response-${Date.now()}.${extension}`);
    message(t("message.downloadSuccess") || "下载成功", { type: "success" });
  } catch (error) {
    console.error("下载错误:", error);
    message(t("message.downloadError") || "下载失败: " + error.message, { type: "error" });
  }
};

// 重置表单
const resetForm = () => {
  env.method = "GET";
  env.url = "";
  env.params = [];
  env.headers = [];
  env.body = {
    type: "none",
    formData: [],
    urlencoded: [],
    raw: {
      type: "json",
      content: "",
    },
    binary: null,
    graphql: {
      query: "",
      variables: "",
    },
  };
  env.response = {
    status: null,
    statusText: "",
    headers: {},
    data: null,
    time: 0,
    size: 0,
    type: "json",
  };
};

// 应用示例请求
const applyExample = (example) => {
  env.method = example.method;
  env.url = example.url;

  if (example.body) {
    env.body = JSON.parse(JSON.stringify(example.body));
  } else {
    env.body = {
      type: "none",
      formData: [],
      urlencoded: [],
      raw: {
        type: "json",
        content: "",
      },
      binary: null,
      graphql: {
        query: "",
        variables: "",
      },
    };
  }

  message(t("message.exampleApplied") || "已应用示例请求", { type: "success" });
};

// 创建新集合
const createCollection = () => {
  if (!env.newCollection.name) {
    message(t("message.collectionNameRequired") || "请输入集合名称", { type: "warning" });
    return;
  }

  const collection = {
    id: Date.now(),
    name: env.newCollection.name,
    description: env.newCollection.description,
    requests: [],
  };

  env.collections.push(collection);
  env.showCollectionModal = false;
  env.newCollection = { name: "", description: "" };

  message(t("message.collectionCreated") || "集合创建成功", { type: "success" });
};

// 创建新环境
const createEnvironment = () => {
  if (!env.newEnvironment.name) {
    message(t("message.environmentNameRequired") || "请输入环境名称", { type: "warning" });
    return;
  }

  const environment = {
    id: Date.now(),
    name: env.newEnvironment.name,
    variables: env.newEnvironment.variables.filter((v) => v.key),
    isActive: false,
  };

  env.environments.push(environment);
  env.showEnvironmentModal = false;
  env.newEnvironment = { name: "", variables: [{ key: "", value: "", enabled: true }] };

  message(t("message.environmentCreated") || "环境创建成功", { type: "success" });
};

// 切换环境
const switchEnvironment = (environmentId) => {
  env.environments.forEach((environment) => {
    environment.isActive = environment.id === environmentId;
  });
};

// 添加环境变量
const addEnvironmentVariable = () => {
  env.newEnvironment.variables.push({ key: "", value: "", enabled: true });
};

// 删除环境变量
const removeEnvironmentVariable = (index) => {
  env.newEnvironment.variables.splice(index, 1);
};

// 获取响应状态颜色
const getStatusColor = (status) => {
  if (!status) return "";
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400) return "danger";
  return "info";
};

// 格式化响应大小
const formatSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// 组件挂载时初始化
onMounted(() => {
  // 加载历史记录
  loadHistoryFromLocalStorage();

  // 初始化请求头
  if (env.headers.length === 0) {
    env.headers.push({ key: "Content-Type", value: "application/json", description: "", enabled: true });
  }
});
</script>

<template>
  <div class="postman-tool">
    <div class="postman-tool__content">
      <!-- 头部区域 -->
      <div class="postman-tool__header-container">
        <div class="postman-tool__header">
          <div class="postman-tool__header-inner">
            <h1 class="postman-tool__header-title">Postman 工具</h1>
            <p class="postman-tool__header-subtitle">一个简单易用的 API 测试工具</p>
          </div>
          <div class="postman-tool__header-timestamp">
            <el-icon><IconifyIconOffline icon="ri:time-line" /></el-icon>
            <span>{{ new Date().toLocaleString() }}</span>
          </div>
        </div>
      </div>

      <!-- URL 输入区域 -->
      <el-card class="postman-tool__url-card">
        <div class="postman-tool__url-container">
          <el-select v-model="env.method" class="postman-tool__method-select">
            <el-option v-for="method in env.methods" :key="method.value" :label="method.label" :value="method.value" :class="`postman-tool__method-option--${method.value.toLowerCase()}`" />
          </el-select>
          <el-input v-model="env.url" placeholder="输入请求 URL" class="postman-tool__url-input" clearable @keyup.enter="sendRequest">
            <template #append>
              <el-button type="primary" @click="sendRequest" :loading="env.loading"> 发送 </el-button>
            </template>
          </el-input>
        </div>

        <div class="postman-tool__environment-selector">
          <el-select v-model="env.environments.find((e) => e.isActive).name" placeholder="选择环境" style="width: 200px">
            <el-option v-for="environment in env.environments" :key="environment.name" :label="environment.name" :value="environment.name" @click="switchEnvironment(environment.id)" />
          </el-select>
          <el-button type="primary" plain @click="env.showEnvironmentModal = true"> 管理环境 </el-button>
        </div>
      </el-card>

      <!-- 主要内容区域 -->
      <el-tabs v-model="env.activeTab" class="postman-tool__main-tabs">
        <el-tab-pane label="请求" name="request">
          <el-card class="postman-tool__request-card">
            <el-tabs v-model="env.bodyTab">
              <el-tab-pane label="参数" name="params">
                <div class="postman-tool__params-container">
                  <div class="postman-tool__params-header">
                    <h3 class="postman-tool__params-title">查询参数</h3>
                    <el-button type="primary" plain size="small" @click="addParam"> 添加参数 </el-button>
                  </div>
                  <div v-if="env.params.length === 0" class="postman-tool__empty">
                    <el-empty description="暂无查询参数" />
                  </div>
                  <div v-else>
                    <div v-for="(param, index) in env.params" :key="index" class="postman-tool__param-item">
                      <el-checkbox v-model="param.enabled" class="postman-tool__param-checkbox" />
                      <el-input v-model="param.key" placeholder="参数名" class="postman-tool__param-key" />
                      <el-input v-model="param.value" placeholder="参数值" class="postman-tool__param-value" />
                      <el-input v-model="param.description" placeholder="描述" class="postman-tool__param-description" />
                      <el-button type="danger" plain circle @click="removeParam(index)" :icon="useRenderIcon('ri:delete-bin-line')" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="请求头" name="headers">
                <div class="postman-tool__headers-container">
                  <div class="postman-tool__headers-header">
                    <h3 class="postman-tool__headers-title">请求头</h3>
                    <el-button type="primary" plain size="small" @click="addHeader"> 添加请求头 </el-button>
                  </div>
                  <div v-if="env.headers.length === 0" class="postman-tool__empty">
                    <el-empty description="暂无请求头" />
                  </div>
                  <div v-else>
                    <div v-for="(header, index) in env.headers" :key="index" class="postman-tool__header-item">
                      <el-checkbox v-model="header.enabled" class="postman-tool__header-checkbox" />
                      <el-input v-model="header.key" placeholder="请求头名" class="postman-tool__header-key" />
                      <el-input v-model="header.value" placeholder="请求头值" class="postman-tool__header-value" />
                      <el-input v-model="header.description" placeholder="描述" class="postman-tool__header-description" />
                      <el-button type="danger" plain circle @click="removeHeader(index)" :icon="useRenderIcon('ri:delete-bin-line')" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>

              <el-tab-pane label="请求体" name="body">
                <div class="postman-tool__body-container">
                  <div class="postman-tool__body-type-selector">
                    <el-radio-group v-model="env.body.type" @change="setBodyType">
                      <el-radio-button label="none">无</el-radio-button>
                      <el-radio-button label="form-data">表单数据</el-radio-button>
                      <el-radio-button label="x-www-form-urlencoded">URL 编码</el-radio-button>
                      <el-radio-button label="raw">原始数据</el-radio-button>
                      <el-radio-button label="binary">二进制文件</el-radio-button>
                      <el-radio-button label="graphql">GraphQL</el-radio-button>
                    </el-radio-group>
                  </div>

                  <!-- 表单数据 -->
                  <div v-if="env.body.type === 'form-data'">
                    <div class="postman-tool__form-data-header">
                      <h3 class="postman-tool__form-data-title">表单数据</h3>
                      <el-button type="primary" plain size="small" @click="addFormData"> 添加表单项 </el-button>
                    </div>
                    <div v-if="env.body.formData.length === 0" class="postman-tool__empty">
                      <el-empty description="暂无表单数据" />
                    </div>
                    <div v-else>
                      <div v-for="(item, index) in env.body.formData" :key="index" class="postman-tool__form-data-item">
                        <el-checkbox v-model="item.enabled" class="postman-tool__form-data-checkbox" />
                        <el-input v-model="item.key" placeholder="键名" class="postman-tool__form-data-key" />
                        <el-select v-model="item.type" class="postman-tool__form-data-type">
                          <el-option label="文本" value="text" />
                          <el-option label="文件" value="file" />
                        </el-select>
                        <el-input v-if="item.type === 'text'" v-model="item.value" placeholder="值" class="postman-tool__form-data-value" />
                        <el-upload v-else action="" :auto-upload="false" :show-file-list="false" class="postman-tool__form-data-value" @change="(e) => (item.file = e.raw)">
                          <el-button type="primary" plain>选择文件</el-button>
                          <span v-if="item.file">{{ item.file.name }}</span>
                        </el-upload>
                        <el-button type="danger" plain circle @click="removeFormData(index)" :icon="useRenderIcon('ri:delete-bin-line')" />
                      </div>
                    </div>
                  </div>

                  <!-- URL 编码 -->
                  <div v-if="env.body.type === 'x-www-form-urlencoded'">
                    <div class="postman-tool__urlencoded-header">
                      <h3 class="postman-tool__urlencoded-title">URL 编码数据</h3>
                      <el-button type="primary" plain size="small" @click="addUrlEncoded"> 添加数据项 </el-button>
                    </div>
                    <div v-if="env.body.urlencoded.length === 0" class="postman-tool__empty">
                      <el-empty description="暂无 URL 编码数据" />
                    </div>
                    <div v-else>
                      <div v-for="(item, index) in env.body.urlencoded" :key="index" class="postman-tool__urlencoded-item">
                        <el-checkbox v-model="item.enabled" class="postman-tool__urlencoded-checkbox" />
                        <el-input v-model="item.key" placeholder="键名" class="postman-tool__urlencoded-key" />
                        <el-input v-model="item.value" placeholder="值" class="postman-tool__urlencoded-value" />
                        <el-input v-model="item.description" placeholder="描述" class="postman-tool__urlencoded-description" />
                        <el-button type="danger" plain circle @click="removeUrlEncoded(index)" :icon="useRenderIcon('ri:delete-bin-line')" />
                      </div>
                    </div>
                  </div>

                  <!-- 原始数据 -->
                  <div v-if="env.body.type === 'raw'">
                    <div class="postman-tool__raw-header">
                      <h3 class="postman-tool__raw-title">原始数据</h3>
                      <el-select v-model="env.body.raw.type" class="postman-tool__raw-type-select" @change="setRawType">
                        <el-option label="JSON" value="json" />
                        <el-option label="文本" value="text" />
                        <el-option label="XML" value="xml" />
                        <el-option label="HTML" value="html" />
                        <el-option label="JavaScript" value="javascript" />
                      </el-select>
                    </div>
                    <el-input v-model="env.body.raw.content" type="textarea" :rows="10" class="postman-tool__raw-editor" placeholder="输入原始数据内容" />
                  </div>

                  <!-- 二进制文件 -->
                  <div v-if="env.body.type === 'binary'">
                    <div class="postman-tool__binary-header">
                      <h3 class="postman-tool__binary-title">二进制文件</h3>
                    </div>
                    <el-upload action="" :auto-upload="false" :show-file-list="false" drag @change="uploadBinaryFile">
                      <el-icon><IconifyIconOffline icon="ri:upload-cloud-line" /></el-icon>
                      <div class="el-upload__text">拖拽文件到此处或 <em>点击上传</em></div>
                    </el-upload>
                    <div v-if="env.body.binary" class="postman-tool__binary-info">
                      <p>已选择文件: {{ env.body.binary.name }}</p>
                      <p>文件大小: {{ formatSize(env.body.binary.size) }}</p>
                      <el-button type="danger" plain size="small" @click="removeBinaryFile"> 移除文件 </el-button>
                    </div>
                    <p class="postman-tool__binary-tip">注意: 二进制文件将直接作为请求体发送，不会进行任何编码处理。</p>
                  </div>

                  <!-- GraphQL -->
                  <div v-if="env.body.type === 'graphql'">
                    <div class="postman-tool__graphql-header">
                      <h3 class="postman-tool__graphql-title">GraphQL 查询</h3>
                    </div>
                    <div class="postman-tool__graphql-query">
                      <div class="postman-tool__graphql-label">查询</div>
                      <el-input v-model="env.body.graphql.query" type="textarea" :rows="6" placeholder="输入 GraphQL 查询" />
                    </div>
                    <div class="postman-tool__graphql-variables">
                      <div class="postman-tool__graphql-label">变量</div>
                      <el-input v-model="env.body.graphql.variables" type="textarea" :rows="4" placeholder="输入 JSON 格式的变量" />
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="响应" name="response">
          <el-card class="postman-tool__response-card">
            <div v-if="!env.response.status" class="postman-tool__empty">
              <el-empty description="暂无响应数据，请先发送请求" />
            </div>
            <div v-else>
              <div class="postman-tool__response-header">
                <div class="postman-tool__response-status">
                  <el-tag :type="getStatusColor(env.response.status)" size="large"> {{ env.response.status }} {{ env.response.statusText }} </el-tag>
                  <span class="postman-tool__response-time">
                    <el-icon><IconifyIconOffline icon="ri:time-line" /></el-icon>
                    {{ env.response.time }} ms
                  </span>
                  <span class="postman-tool__response-size">
                    <el-icon><IconifyIconOffline icon="ri:file-size-line" /></el-icon>
                    {{ formatSize(env.response.size) }}
                  </span>
                </div>
                <div class="postman-tool__response-actions">
                  <el-button type="primary" plain size="small" @click="copyToClipboard(formattedResponse)"> 复制响应 </el-button>
                  <el-button type="success" plain size="small" @click="downloadResponse"> 下载响应 </el-button>
                </div>
              </div>

              <el-tabs v-model="env.responseTab">
                <el-tab-pane label="响应体" name="body">
                  <pre class="postman-tool__response-content">{{ formattedResponse }}</pre>
                </el-tab-pane>
                <el-tab-pane label="响应头" name="headers">
                  <div v-if="Object.keys(env.response.headers).length === 0" class="postman-tool__empty">
                    <el-empty description="暂无响应头" />
                  </div>
                  <div v-else>
                    <div v-for="(value, key) in env.response.headers" :key="key" class="postman-tool__response-header-item">
                      <div class="postman-tool__response-header-key">{{ key }}</div>
                      <div class="postman-tool__response-header-value">{{ value }}</div>
                    </div>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="历史记录" name="history">
          <el-card class="postman-tool__history-card">
            <div v-if="env.history.length === 0" class="postman-tool__empty">
              <el-empty description="暂无历史记录" />
            </div>
            <div v-else>
              <div v-for="item in env.history" :key="item.id" class="postman-tool__history-item" @click="loadFromHistory(item)">
                <div :class="`postman-tool__history-method postman-tool__history-method--${item.method.toLowerCase()}`">
                  {{ item.method }}
                </div>
                <div class="postman-tool__history-url">{{ item.url }}</div>
                <div class="postman-tool__history-status">
                  <el-tag :type="getStatusColor(item.response.status)" size="small">
                    {{ item.response.status }}
                  </el-tag>
                </div>
                <div class="postman-tool__history-time">{{ item.timestamp }}</div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>

        <el-tab-pane label="示例" name="examples">
          <el-card>
            <div class="postman-tool__examples">
              <div v-for="(example, index) in env.examples" :key="index" class="postman-tool__example-item" @click="applyExample(example)">
                <h4 class="postman-tool__example-name">{{ example.name }}</h4>
                <div class="postman-tool__example-details">
                  <span class="postman-tool__example-method">{{ example.method }}</span>
                  <span class="postman-tool__example-url">{{ example.url }}</span>
                </div>
              </div>
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 环境变量管理对话框 -->
    <sc-dialog v-model="env.showEnvironmentModal" title="管理环境变量" width="600px">
      <el-tabs type="border-card">
        <el-tab-pane v-for="environment in env.environments" :key="environment.name" :label="environment.name">
          <div v-for="(variable, index) in environment.variables" :key="index" class="postman-tool__environment-variable">
            <el-input v-model="variable.key" placeholder="变量名" class="postman-tool__environment-variable-key" />
            <el-input v-model="variable.value" placeholder="变量值" class="postman-tool__environment-variable-value" />
            <el-checkbox v-model="variable.enabled" label="启用" class="postman-tool__environment-variable-enabled" />
            <el-button type="danger" plain circle :icon="useRenderIcon('ri:delete-bin-line')" @click="environment.variables.splice(index, 1)" />
          </div>
          <div class="postman-tool__environment-actions">
            <el-button type="primary" plain @click="environment.variables.push({ key: '', value: '', enabled: true })"> 添加变量 </el-button>
          </div>
        </el-tab-pane>
        <el-tab-pane label="+ 新环境">
          <el-form>
            <el-form-item label="环境名称">
              <el-input v-model="env.newEnvironment.name" placeholder="输入环境名称" />
            </el-form-item>
            <el-form-item label="环境变量">
              <div v-for="(variable, index) in env.newEnvironment.variables" :key="index" class="postman-tool__environment-variable">
                <el-input v-model="variable.key" placeholder="变量名" class="postman-tool__environment-variable-key" />
                <el-input v-model="variable.value" placeholder="变量值" class="postman-tool__environment-variable-value" />
                <el-checkbox v-model="variable.enabled" label="启用" class="postman-tool__environment-variable-enabled" />
                <el-button type="danger" plain circle :icon="useRenderIcon('ri:delete-bin-line')" @click="removeEnvironmentVariable(index)" />
              </div>
              <div class="postman-tool__environment-actions">
                <el-button type="primary" plain @click="addEnvironmentVariable"> 添加变量 </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      <template #footer>
        <el-button @click="env.showEnvironmentModal = false">取消</el-button>
        <el-button type="primary" @click="createEnvironment">创建环境</el-button>
      </template>
    </sc-dialog>
  </div>
</template>

<style lang="scss" scoped>
.postman-tool {
  padding: 20px;

  &__content {
    margin: 0 auto;
  }

  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-danger-light-3) 0%, var(--el-color-danger) 100%);
    border-radius: 12px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(var(--el-color-danger-rgb), 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    
    &:hover {
      box-shadow: 0 6px 24px rgba(var(--el-color-danger-rgb), 0.4);
      transform: translateY(-2px);
    }

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 600;
      color: #fff;
      margin-bottom: 10px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    &-timestamp {
      color: rgba(255, 255, 255, 0.8);
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  &__url-card {
    margin-bottom: 20px;
  }

  &__url-container {
    display: flex;
    gap: 10px;
    margin-bottom: 15px;
  }

  &__method-select {
    width: 120px;
  }

  &__url-input {
    flex: 1;
  }

  &__environment-selector {
    display: flex;
    justify-content: space-between;
  }

  &__method-option {
    &--get {
      color: #0ea5e9;
    }

    &--post {
      color: #10b981;
    }

    &--put {
      color: #f59e0b;
    }

    &--delete {
      color: #ef4444;
    }

    &--patch {
      color: #8b5cf6;
    }
  }

  &__example-method {
    display: inline-block;
    width: 60px;
    font-weight: bold;
  }

  &__main-tabs {
    margin-bottom: 20px;
  }

  &__request-card,
  &__response-card,
  &__history-card,
  &__collections-card {
    margin-bottom: 20px;
  }

  &__params-container,
  &__headers-container,
  &__body-container {
    padding: 10px 0;
  }

  &__params-header,
  &__headers-header,
  &__form-data-header,
  &__urlencoded-header,
  &__raw-header,
  &__binary-header,
  &__graphql-header,
  &__collections-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
  }

  &__params-title,
  &__headers-title,
  &__form-data-title,
  &__urlencoded-title,
  &__raw-title,
  &__binary-title,
  &__graphql-title,
  &__collections-title {
    font-size: 16px;
    font-weight: 500;
  }

  &__param-item,
  &__header-item,
  &__form-data-item,
  &__urlencoded-item {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
  }

  &__param-checkbox,
  &__header-checkbox,
  &__form-data-checkbox,
  &__urlencoded-checkbox {
    width: 40px;
  }

  &__param-key,
  &__header-key,
  &__form-data-key,
  &__urlencoded-key {
    width: 200px;
  }

  &__param-value,
  &__header-value,
  &__form-data-value,
  &__urlencoded-value {
    flex: 1;
  }

  &__param-description,
  &__header-description,
  &__urlencoded-description {
    width: 200px;
  }

  &__form-data-type {
    width: 100px;
  }

  &__body-type-selector {
    margin-bottom: 20px;
  }

  &__raw-type-select {
    width: 150px;
  }

  &__raw-editor,
  &__graphql-query,
  &__graphql-variables {
    margin-bottom: 15px;
  }

  &__graphql-label {
    margin-bottom: 5px;
    font-weight: 500;
  }

  &__response-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  &__response-status {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  &__response-time,
  &__response-size {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__response-content {
    background-color: var(--el-fill-color-light);
    padding: 15px;
    border-radius: 4px;
    overflow: auto;
    max-height: 500px;
    font-family: monospace;
    white-space: pre-wrap;
    word-break: break-all;
  }

  &__response-header-item {
    display: flex;
    margin-bottom: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    padding-bottom: 5px;
  }

  &__response-header-key {
    width: 200px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__response-header-value {
    flex: 1;
    word-break: break-all;
  }

  &__history-item {
    display: flex;
    padding: 10px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    transition: background-color 0.3s;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  &__history-method {
    width: 80px;
    font-weight: bold;

    &--get {
      color: #0ea5e9;
    }

    &--post {
      color: #10b981;
    }

    &--put {
      color: #f59e0b;
    }

    &--delete {
      color: #ef4444;
    }

    &--patch {
      color: #8b5cf6;
    }
  }

  &__history-url {
    flex: 1;
    margin-right: 15px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__history-status {
    margin-right: 15px;
  }

  &__history-time {
    width: 180px;
    text-align: right;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  &__collection-node {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__collection-icon {
    color: var(--el-color-primary);
  }

  &__environment-variable {
    display: flex;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
  }

  &__environment-variable-key {
    width: 200px;
  }

  &__environment-variable-value {
    flex: 1;
  }

  &__environment-variable-enabled {
    width: 80px;
  }

  &__environment-actions {
    margin-top: 15px;
  }

  &__empty {
    padding: 30px 0;
  }

  &__empty-icon {
    font-size: 48px;
    color: var(--el-text-color-secondary);
  }

  &__binary-tip {
    color: var(--el-text-color-secondary);
    font-size: 14px;
    margin-top: 5px;
  }

  @media (max-width: 768px) {
    &__url-container {
      flex-direction: column;
    }

    &__method-select {
      width: 100%;
    }

    &__param-item,
    &__header-item,
    &__form-data-item,
    &__urlencoded-item,
    &__environment-variable {
      flex-wrap: wrap;
    }

    &__param-key,
    &__header-key,
    &__form-data-key,
    &__urlencoded-key,
    &__environment-variable-key {
      width: calc(50% - 30px);
    }

    &__param-value,
    &__header-value,
    &__form-data-value,
    &__urlencoded-value,
    &__environment-variable-value {
      width: calc(50% - 30px);
      flex: none;
    }
    &__param-description,
    &__header-description,
    &__urlencoded-description {
      width: 200px;
    }

    &__form-data-type {
      width: 100px;
    }

    &__body-type-selector {
      margin-bottom: 20px;
    }

    &__raw-type-select {
      width: 150px;
    }

    &__raw-editor,
    &__graphql-query,
    &__graphql-variables {
      margin-bottom: 15px;
    }

    &__graphql-label {
      margin-bottom: 5px;
      font-weight: 500;
    }

    &__response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    &__response-status {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    &__response-time,
    &__response-size {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    &__response-content {
      background-color: var(--el-fill-color-light);
      padding: 15px;
      border-radius: 4px;
      overflow: auto;
      max-height: 500px;
      font-family: monospace;
      white-space: pre-wrap;
      word-break: break-all;
    }

    &__response-header-item {
      display: flex;
      margin-bottom: 10px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      padding-bottom: 5px;
    }

    &__response-header-key {
      width: 200px;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    &__response-header-value {
      flex: 1;
      word-break: break-all;
    }

    &__history-item {
      display: flex;
      padding: 10px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: var(--el-fill-color-light);
      }
    }

    &__history-method {
      width: 80px;
      font-weight: bold;

      &--get {
        color: #0ea5e9;
      }

      &--post {
        color: #10b981;
      }

      &--put {
        color: #f59e0b;
      }

      &--delete {
        color: #ef4444;
      }

      &--patch {
        color: #8b5cf6;
      }
    }

    &__history-url {
      flex: 1;
      margin-right: 15px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__history-status {
      margin-right: 15px;
    }

    &__history-time {
      width: 180px;
      text-align: right;
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    &__collection-node {
      display: flex;
      align-items: center;
      gap: 5px;
    }

    &__collection-icon {
      color: var(--el-color-primary);
    }

    &__environment-variable {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
      align-items: center;
    }

    &__environment-variable-key {
      width: 200px;
    }

    &__environment-variable-value {
      flex: 1;
    }

    &__environment-variable-enabled {
      width: 80px;
    }

    &__environment-actions {
      margin-top: 15px;
    }

    &__empty {
      padding: 30px 0;
    }

    &__empty-icon {
      font-size: 48px;
      color: var(--el-text-color-secondary);
    }

    &__binary-tip {
      color: var(--el-text-color-secondary);
      font-size: 14px;
      margin-top: 5px;
    }

    @media (max-width: 768px) {
      &__url-container {
        flex-direction: column;
      }

      &__method-select {
        width: 100%;
      }

      &__param-item,
      &__header-item,
      &__form-data-item,
      &__urlencoded-item,
      &__environment-variable {
        flex-wrap: wrap;
      }

      &__param-key,
      &__header-key,
      &__form-data-key,
      &__urlencoded-key,
      &__environment-variable-key {
        width: calc(50% - 30px);
      }

      &__param-value,
      &__header-value,
      &__form-data-value,
      &__urlencoded-value,
      &__environment-variable-value {
        width: calc(50% - 30px);
        flex: none;
      }

      &__param-description,
      &__header-description,
      &__urlencoded-description {
        width: 100%;
        margin-top: 10px;
      }

      &__history-item {
        flex-wrap: wrap;
      }

      &__history-url {
        width: 100%;
        margin-top: 5px;
        margin-bottom: 5px;
      }

      &__history-time {
        width: auto;
      }
    }
  }

  /* 自定义响应状态颜色 */
  :deep(.el-tag--success) {
    background-color: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  :deep(.el-tag--warning) {
    background-color: rgba(245, 158, 11, 0.1);
    border-color: rgba(245, 158, 11, 0.2);
    color: #f59e0b;
  }

  :deep(.el-tag--danger) {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }

  :deep(.el-tag--info) {
    background-color: rgba(107, 114, 128, 0.1);
    border-color: rgba(107, 114, 128, 0.2);
    color: #6b7280;
  }

  /* 自定义表单样式 */
  :deep(.el-form-item__label) {
    font-weight: 500;
  }

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
  }

  :deep(.el-input__wrapper:hover) {
    box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
  }

  :deep(.el-input__wrapper.is-focus) {
    box-shadow: 0 0 0 1px var(--el-color-primary) inset;
  }

  :deep(.el-textarea__inner) {
    font-family: monospace;
  }

  /* 自定义树形控件样式 */
  :deep(.el-tree-node__content) {
    height: 36px;
  }

  :deep(.el-tree-node__content:hover) {
    background-color: var(--el-fill-color-light);
  }

  /* 自定义标签页样式 */
  :deep(.el-tabs__item) {
    font-weight: 500;
  }

  :deep(.el-tabs__item.is-active) {
    font-weight: 600;
  }

  /* 自定义卡片样式 */
  :deep(.el-card) {
    border-radius: 8px;
    overflow: hidden;
    transition: box-shadow 0.3s;
  }

  :deep(.el-card:hover) {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  }

  :deep(.el-card__header) {
    padding: 15px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-light);
  }

  /* 自定义按钮样式 */
  :deep(.el-button--primary) {
    background-color: var(--el-color-primary);
  }

  :deep(.el-button--primary:hover) {
    background-color: var(--el-color-primary-light-3);
  }

  :deep(.el-button--success) {
    background-color: #10b981;
    border-color: #10b981;
  }

  :deep(.el-button--success:hover) {
    background-color: #34d399;
    border-color: #34d399;
  }

  :deep(.el-button--danger) {
    background-color: #ef4444;
    border-color: #ef4444;
  }

  :deep(.el-button--danger:hover) {
    background-color: #f87171;
    border-color: #f87171;
  }

  /* 自定义上传组件样式 */
  :deep(.el-upload) {
    width: 100%;
  }

  :deep(.el-upload-dragger) {
    width: 100%;
    height: 120px;
  }

  /* 自定义单选按钮组样式 */
  :deep(.el-radio-button__inner) {
    padding: 8px 15px;
  }

  /* 自定义下拉菜单样式 */
  :deep(.el-dropdown-menu__item) {
    padding: 8px 16px;
    font-size: 14px;
  }

  :deep(.el-dropdown-menu__item:hover) {
    background-color: var(--el-fill-color-light);
    color: var(--el-color-primary);
  }

  /* 自定义对话框样式 */
  :deep(.el-dialog) {
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 20px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-light);
  }

  :deep(.el-dialog__title) {
    font-weight: 600;
    font-size: 18px;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 15px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-fill-color-light);
  }

  /* 自定义分割线样式 */
  :deep(.el-divider__text) {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  /* 自定义空状态样式 */
  :deep(.el-empty__description) {
    margin-top: 15px;
    color: var(--el-text-color-secondary);
  }

  /* 自定义复选框样式 */
  :deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
    background-color: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }

  :deep(.el-checkbox__label) {
    font-size: 14px;
  }

  /* 自定义选择器样式 */
  :deep(.el-select-dropdown__item.selected) {
    color: var(--el-color-primary);
    font-weight: 600;
  }

  /* 自定义加载状态样式 */
  :deep(.el-loading-mask) {
    background-color: rgba(255, 255, 255, 0.8);
  }

  :deep(.el-loading-spinner .circular) {
    width: 36px;
    height: 36px;
  }

  :deep(.el-loading-spinner .path) {
    stroke: var(--el-color-primary);
    stroke-width: 3;
  }
}