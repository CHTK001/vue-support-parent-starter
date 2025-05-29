<template>
  <div class="service-document">
    <!-- 页面加载状态 -->
    <div v-if="loading" class="document-loading">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- 文档内容区域 -->
    <div v-else class="document-container">
      <!-- 空状态展示 -->
      <el-empty v-if="!hasDocuments" description="暂无可用文档" :image-size="200" class="empty-state">
        <template #description>
          <p class="empty-text">未找到可用的文档地址或未选择文档</p>
        </template>
        <el-button type="primary" @click="goBack">返回应用列表</el-button>
      </el-empty>

      <!-- 文档展示区域 -->
      <div v-else class="document-content">
        <!-- 根据文档类型展示不同组件 -->
        <knife4j-document v-if="selectedType === 'knife4j'" :document-url="currentDocument.url" class="document-component" />

        <hybrid-document v-else-if="selectedType === 'hybrid'" :services="convertedServices" class="document-component" />
      </div>
    </div>

    <!-- 右上角固定配置面板 -->
    <div class="document-config" :class="{ 'config-expanded': configVisible }">
      <div class="config-toggle" @click="toggleConfig">
        <IconifyIconOnline :icon="configVisible ? 'ep:close' : 'ep:setting'" />
      </div>

      <div class="config-panel">
        <h3 class="config-title">文档配置</h3>

        <!-- 文档类型选择 -->
        <div class="config-section">
          <h4 class="section-title">文档类型</h4>
          <el-radio-group v-model="selectedType" @change="handleTypeChange">
            <el-radio label="knife4j">Knife4j</el-radio>
            <el-radio label="hybrid">混合模式</el-radio>
          </el-radio-group>
        </div>

        <!-- 服务选择 -->
        <div class="config-section">
          <h4 class="section-title">可用服务</h4>
          <el-checkbox-group v-model="selectedServices">
            <el-checkbox v-for="service in availableServices" :key="service.id" :label="service.id">
              {{ service.name }}
            </el-checkbox>
          </el-checkbox-group>
        </div>

        <!-- 文档选择（只在Knife4j模式下显示） -->
        <div v-if="selectedType === 'knife4j'" class="config-section">
          <h4 class="section-title">文档列表</h4>
          <el-radio-group v-model="selectedDocumentId" class="document-radio-group">
            <el-radio v-for="doc in filteredDocuments" :key="doc.id" :label="doc.id" :disabled="!selectedServices.includes(doc.serviceId)">
              {{ doc.name }}
            </el-radio>
          </el-radio-group>
          <div v-if="filteredDocuments.length === 0" class="no-docs-tip">没有符合条件的文档</div>
        </div>

        <!-- 确认按钮 -->
        <div class="config-actions">
          <el-button type="primary" @click="applyConfig">确认</el-button>
          <el-button @click="resetConfig">重置</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/utils";
import { ref, reactive, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { fetchAppDetail } from "@/api/monitor/app";
import Knife4jDocument from "./Knife4jDocument.vue";
import HybridDocument from "./HybridDocument.vue";

// 路由
const route = useRoute();
const router = useRouter();

// 状态管理
const loading = ref(true);
const appDetail = ref(null);
const configVisible = ref(false);
const selectedDocumentId = ref("");

// 文档配置
const selectedType = ref("knife4j");
const selectedServices = ref([]);
const availableServices = ref([]);
const documentList = ref([]);

// 计算属性：过滤后的文档列表
const filteredDocuments = computed(() => {
  if (!documentList.value.length) return [];

  return documentList.value.filter(doc => {
    // 检查文档类型是否被选中
    const typeMatch = doc.type === selectedType.value;

    // 检查服务是否被选中
    const serviceMatch = selectedServices.value.includes(doc.serviceId);

    return typeMatch && serviceMatch;
  });
});

// 计算属性：当前选中的文档
const currentDocument = computed(() => {
  if (!selectedDocumentId.value || !documentList.value.length) return null;
  return documentList.value.find(doc => doc.id === selectedDocumentId.value) || null;
});

// 计算属性：是否有可用文档
const hasDocuments = computed(() => {
  // 对于 Knife4j 模式，需要有选中的文档
  if (selectedType.value === "knife4j") {
    return currentDocument.value !== null;
  }

  // 对于混合模式，只要有选中的服务即可
  if (selectedType.value === "hybrid") {
    return selectedServices.value.length > 0;
  }

  return false;
});

// 计算属性：转换为混合模式所需的服务数据结构
const convertedServices = computed(() => {
  // 先根据服务ID分组文档
  const serviceMap = {};

  // 只处理被选中的服务
  selectedServices.value.forEach(serviceId => {
    const docs = documentList.value.filter(doc => doc.serviceId === serviceId);
    if (docs.length) {
      const serviceName = docs[0].name.split(" - ")[0]; // 从文档名提取服务名

      // 转换为服务对象
      serviceMap[serviceId] = {
        id: serviceId,
        name: serviceName,
        description: `${serviceName} 服务API文档`,
        apis: docs.map(doc => {
          // 从URL生成更多信息
          const url = new URL(doc.url);
          const path = url.pathname;

          // 生成模拟API数据
          return {
            id: doc.id,
            name: doc.name,
            path: path,
            method: "GET", // 默认为GET
            description: `${doc.name} API接口`,
            serviceId: serviceId,
            parameters: [
              {
                name: "pageSize",
                type: "integer",
                required: false,
                description: "每页记录数"
              },
              {
                name: "pageNum",
                type: "integer",
                required: false,
                description: "页码，从1开始"
              }
            ],
            responses: {
              success: {
                code: 200,
                message: "success",
                data: {
                  total: 100,
                  list: [
                    { id: 1, name: "示例数据1" },
                    { id: 2, name: "示例数据2" }
                  ]
                }
              },
              error: {
                code: 500,
                message: "error",
                data: null
              }
            },
            examples: {
              java: `import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

RestTemplate restTemplate = new RestTemplate();
String url = "${doc.url}";
ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
System.out.println(response.getBody());`,
              python: `import requests

url = "${doc.url}"
response = requests.get(url)
print(response.json())`,
              javascript: `fetch("${doc.url}")
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));`,
              go: `package main

import (
	"fmt"
	"io/ioutil"
	"net/http"
)

func main() {
	resp, err := http.Get("${doc.url}")
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()
	body, _ := ioutil.ReadAll(resp.Body)
	fmt.Println(string(body))
}`
            }
          };
        })
      };
    }
  });

  // 转换为数组
  return Object.values(serviceMap);
});

// 方法：切换配置面板
const toggleConfig = () => {
  configVisible.value = !configVisible.value;
};

// 方法：处理类型变更
const handleTypeChange = () => {
  // 清空选中的文档ID，等待用户重新选择
  selectedDocumentId.value = "";
};

// 方法：应用配置
const applyConfig = () => {
  if (selectedType.value === "knife4j") {
    // Knife4j模式需要选择文档
    if (!currentDocument.value && filteredDocuments.value.length > 0) {
      selectedDocumentId.value = filteredDocuments.value[0].id;
    }
  }

  configVisible.value = false;
  message("文档配置已更新", { type: "success" });
};

// 方法：重置配置
const resetConfig = () => {
  selectedType.value = "knife4j";
  selectedServices.value = availableServices.value.map(service => service.id);

  // 重置后自动选择第一个文档
  if (filteredDocuments.value.length > 0) {
    selectedDocumentId.value = filteredDocuments.value[0].id;
  }

  message("配置已重置", { type: "success" });
};

// 方法：返回应用列表
const goBack = () => {
  router.push("/service/app");
};

// 方法：解析文档地址
const parseDocumentUrls = appData => {
  const docs = [];

  if (!appData || !appData.monitorRequests || !appData.monitorRequests.length) {
    return docs;
  }

  // 解析每个服务实例的文档地址
  appData.monitorRequests.forEach((instance, index) => {
    const baseUrl = `http://${instance.host}:${instance.port}${instance.metadata?.contextPath || ""}`;
    const serviceName = instance.metadata?.applicationName || `服务 ${index + 1}`;
    const serviceId = `service-${index}`;

    // 添加服务到可用服务列表
    availableServices.value.push({
      id: serviceId,
      name: serviceName
    });

    // 添加Knife4j文档
    docs.push({
      id: `knife4j-${serviceId}`,
      name: `${serviceName} - Knife4j`,
      url: `${baseUrl}/doc.html`,
      type: "knife4j",
      serviceId: serviceId
    });
  });

  return docs;
};

// 组件挂载
onMounted(async () => {
  // 从路由参数获取应用ID
  const { id } = route.params;
  if (!id) {
    message("未找到有效的应用ID", { type: "error" });
    router.push("/service/app");
    return;
  }

  try {
    // 获取应用详情
    const res = await fetchAppDetail({ monitorId: id });

    if (res.code === "00000" && res.data) {
      appDetail.value = res.data;

      // 解析文档地址
      documentList.value = parseDocumentUrls(res.data);

      // 初始化选中的服务
      selectedServices.value = availableServices.value.map(service => service.id);

      // 设置默认文档
      if (filteredDocuments.value.length > 0) {
        selectedDocumentId.value = filteredDocuments.value[0].id;
      }
    } else {
      message(res.msg || "获取应用详情失败", { type: "error" });
    }
  } catch (error) {
    console.error("获取应用详情出错:", error);
    message("获取应用详情失败，请稍后重试", { type: "error" });
  } finally {
    loading.value = false;
  }
});

// 监听选中服务变化
watch(selectedServices, newVal => {
  // 如果没有选中任何服务，自动选择第一个
  if (newVal.length === 0 && availableServices.value.length > 0) {
    selectedServices.value = [availableServices.value[0].id];
  }

  // 如果当前选中的文档不在所选服务范围内，重置选中的文档
  if (currentDocument.value && !newVal.includes(currentDocument.value.serviceId)) {
    selectedDocumentId.value = "";
  }
});

// 监听过滤后的文档列表变化
watch(filteredDocuments, newDocs => {
  // 只在 Knife4j 模式下自动选择文档
  if (selectedType.value === "knife4j") {
    // 如果当前没有选中文档但有可用文档，则自动选择第一个
    if (!selectedDocumentId.value && newDocs.length > 0) {
      selectedDocumentId.value = newDocs[0].id;
    }

    // 如果当前选中的文档不在过滤后的列表中，清空选择
    if (selectedDocumentId.value && !newDocs.find(doc => doc.id === selectedDocumentId.value)) {
      selectedDocumentId.value = "";
    }
  }
});

// 监听文档类型变化
watch(selectedType, newType => {
  // 如果切换到混合模式，不需要选择具体文档
  if (newType === "hybrid") {
    selectedDocumentId.value = "";
  }
  // 如果切换到 Knife4j 模式且有文档，选择第一个
  else if (newType === "knife4j" && filteredDocuments.value.length > 0) {
    selectedDocumentId.value = filteredDocuments.value[0].id;
  }
});
</script>

<style scoped lang="scss">
.service-document {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: var(--el-bg-color);
  padding: 20px;

  // 加载状态
  .document-loading {
    padding: 40px;
  }

  // 文档容器
  .document-container {
    height: 100%;
    width: 100%;

    // 空状态
    .empty-state {
      padding: 60px 0;
      animation: float 6s ease-in-out infinite;

      :deep(.el-empty__image) {
        filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.1));
      }

      .empty-text {
        color: var(--el-text-color-secondary);
        font-size: 16px;
        margin-top: 16px;
      }

      .el-button {
        margin-top: 20px;
        border-radius: 20px;
        padding: 10px 20px;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 15px rgba(var(--el-color-primary-rgb), 0.3);
        }
      }
    }

    // 文档内容区域
    .document-content {
      height: 100%;
      display: flex;
      flex-direction: column;

      // 文档组件容器
      .document-component {
        flex: 1;
        height: calc(100vh - 40px);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        background-color: white;
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }

  // 配置面板
  .document-config {
    position: fixed;
    top: 80px;
    right: 0;
    z-index: 1000;
    display: flex;
    transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

    // 切换按钮
    .config-toggle {
      width: 48px;
      height: 48px;
      border-radius: 8px 0 0 8px;
      background-color: var(--el-color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.1);
      transition: all 0.3s;

      &:hover {
        transform: translateX(-4px);
        background-color: var(--el-color-primary-dark-1);
      }
    }

    // 配置面板
    .config-panel {
      width: 0;
      height: auto;
      background-color: var(--el-bg-color);
      border-radius: 8px 0 0 8px;
      box-shadow: -5px 0 20px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      opacity: 0;
      padding: 0;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    // 展开状态
    &.config-expanded {
      .config-toggle {
        border-radius: 8px 0 0 8px;
        background-color: var(--el-color-danger);

        &:hover {
          background-color: var(--el-color-danger-dark-1);
        }
      }

      .config-panel {
        width: 320px;
        padding: 20px;
        opacity: 1;
      }
    }

    // 配置标题
    .config-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 20px 0;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--el-border-color-lighter);
      position: relative;

      &::after {
        content: "";
        position: absolute;
        bottom: -1px;
        left: 0;
        width: 60px;
        height: 2px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
      }
    }

    // 配置区块
    .config-section {
      margin-bottom: 20px;

      .section-title {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-secondary);
        margin: 0 0 12px 0;
      }

      // 复选框组
      :deep(.el-checkbox-group) {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .el-checkbox {
          margin-right: 0;

          &.is-checked {
            .el-checkbox__label {
              color: var(--el-color-primary);
            }
          }

          .el-checkbox__input.is-checked .el-checkbox__inner {
            background-color: var(--el-color-primary);
            border-color: var(--el-color-primary);
          }
        }
      }

      // 单选框组
      :deep(.el-radio-group) {
        display: flex;
        flex-direction: column;
        gap: 10px;

        .el-radio {
          margin-right: 0;

          &.is-checked {
            .el-radio__label {
              color: var(--el-color-primary);
            }
          }
        }
      }

      // 文档单选组特殊样式
      .document-radio-group {
        max-height: 200px;
        overflow-y: auto;
        padding-right: 10px;
      }

      // 无文档提示
      .no-docs-tip {
        color: var(--el-text-color-secondary);
        font-size: 14px;
        padding: 10px;
        text-align: center;
        background-color: var(--el-fill-color-lighter);
        border-radius: 4px;
      }
    }

    // 操作按钮
    .config-actions {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;

      .el-button {
        flex: 1;
        transition: all 0.3s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }
}

// 动画
@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .service-document {
    .document-content {
      .document-component {
        background-color: var(--el-bg-color-overlay);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }

    .document-config {
      .config-panel {
        background-color: var(--el-bg-color-overlay);
        box-shadow: -5px 0 20px rgba(0, 0, 0, 0.3);
        border-left: 1px solid rgba(255, 255, 255, 0.05);
      }

      .config-title {
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .service-document {
    .document-config {
      top: 60px;

      .config-panel {
        width: 0;

        &.config-expanded {
          width: 280px;
        }
      }
    }

    .document-content {
      .document-component {
        height: calc(100vh - 100px);
      }
    }
  }
}
</style>
