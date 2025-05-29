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
          <p class="empty-text">未找到可用的文档地址</p>
        </template>
        <el-button type="primary" @click="goBack">返回应用列表</el-button>
      </el-empty>

      <!-- 文档展示区域 -->
      <div v-else class="document-content">
        <!-- 文档标签页 -->
        <el-tabs v-model="activeTab" type="card" class="document-tabs" @tab-change="handleTabChange">
          <el-tab-pane 
            v-for="doc in filteredDocuments" 
            :key="doc.id" 
            :label="doc.name" 
            :name="doc.id"
          >
            <!-- 文档iframe展示 -->
            <div class="document-frame-container">
              <iframe 
                :src="doc.url" 
                class="document-frame" 
                frameborder="0" 
                allowfullscreen
              ></iframe>
            </div>
          </el-tab-pane>
        </el-tabs>
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
          <el-checkbox-group v-model="selectedTypes">
            <el-checkbox label="knife4j">Knife4j</el-checkbox>
            <el-checkbox label="swagger">Swagger</el-checkbox>
            <el-checkbox label="hybrid">混合模式</el-checkbox>
          </el-checkbox-group>
        </div>
        
        <!-- 服务选择 -->
        <div class="config-section">
          <h4 class="section-title">可用服务</h4>
          <el-checkbox-group v-model="selectedServices">
            <el-checkbox 
              v-for="service in availableServices" 
              :key="service.id" 
              :label="service.id"
            >
              {{ service.name }}
            </el-checkbox>
          </el-checkbox-group>
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
import { message } from '@repo/utils';
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { fetchAppDetail } from '@/api/monitor/app';

// 路由
const route = useRoute();
const router = useRouter();

// 状态管理
const loading = ref(true);
const appDetail = ref(null);
const configVisible = ref(false);
const activeTab = ref('');

// 文档配置
const selectedTypes = ref(['knife4j', 'swagger', 'hybrid']);
const selectedServices = ref([]);
const availableServices = ref([]);
const documentList = ref([]);

// 计算属性：过滤后的文档列表
const filteredDocuments = computed(() => {
  if (!documentList.value.length) return [];
  
  return documentList.value.filter(doc => {
    // 检查文档类型是否被选中
    const typeMatch = selectedTypes.value.includes(doc.type);
    
    // 检查服务是否被选中
    const serviceMatch = selectedServices.value.includes(doc.serviceId);
    
    return typeMatch && serviceMatch;
  });
});

// 计算属性：是否有可用文档
const hasDocuments = computed(() => {
  return filteredDocuments.value.length > 0;
});

// 方法：切换配置面板
const toggleConfig = () => {
  configVisible.value = !configVisible.value;
};

// 方法：应用配置
const applyConfig = () => {
  if (filteredDocuments.value.length > 0) {
    activeTab.value = filteredDocuments.value[0].id;
  }
  configVisible.value = false;
  message('文档配置已更新', { type: 'success' });
};

// 方法：重置配置
const resetConfig = () => {
  selectedTypes.value = ['knife4j', 'swagger', 'hybrid'];
  selectedServices.value = availableServices.value.map(service => service.id);
  applyConfig();
};

// 方法：处理标签页变化
const handleTabChange = (tabName) => {
  activeTab.value = tabName;
};

// 方法：返回应用列表
const goBack = () => {
  router.push("/service/app");
};

// 方法：解析文档地址
const parseDocumentUrls = (appData) => {
  const docs = [];
  
  if (!appData || !appData.monitorRequests || !appData.monitorRequests.length) {
    return docs;
  }
  
  // 解析每个服务实例的文档地址
  appData.monitorRequests.forEach((instance, index) => {
    const baseUrl = `http://${instance.host}:${instance.port}${instance.metadata?.contextPath || ''}`;
    const serviceName = instance.metadata?.applicationName || `服务 ${index + 1}`;
    const serviceId = `service-${index}`;
    
    // 添加服务到可用服务列表
    availableServices.value.push({
      id: serviceId,
      name: serviceName
    });
    
    // 添加Knife4j文档
    if (instance.metadata?.endpoints?.includes('knife4j')) {
      docs.push({
        id: `knife4j-${serviceId}`,
        name: `${serviceName} - Knife4j`,
        url: `${baseUrl}/doc.html`,
        type: 'knife4j',
        serviceId: serviceId
      });
    }
    
    // 添加Swagger文档
    if (instance.metadata?.endpoints?.includes('swagger')) {
      docs.push({
        id: `swagger-${serviceId}`,
        name: `${serviceName} - Swagger`,
        url: `${baseUrl}/swagger-ui/index.html`,
        type: 'swagger',
        serviceId: serviceId
      });
    }
    
    // 添加混合模式文档 (如果有自定义文档URL)
    if (instance.metadata?.docUrl) {
      docs.push({
        id: `hybrid-${serviceId}`,
        name: `${serviceName} - 自定义文档`,
        url: instance.metadata.docUrl,
        type: 'hybrid',
        serviceId: serviceId
      });
    }
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
      
      // 设置默认活动标签页
      if (filteredDocuments.value.length > 0) {
        activeTab.value = filteredDocuments.value[0].id;
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
watch(selectedServices, (newVal) => {
  // 如果没有选中任何服务，自动选择第一个
  if (newVal.length === 0 && availableServices.value.length > 0) {
    selectedServices.value = [availableServices.value[0].id];
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
      
      // 文档标签页
      .document-tabs {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
        
        :deep(.el-tabs__header) {
          margin-bottom: 16px;
          
          .el-tabs__nav {
            border-radius: 8px;
            
            .el-tabs__item {
              height: 40px;
              line-height: 40px;
              transition: all 0.3s;
              
              &.is-active {
                font-weight: 600;
              }
              
              &:hover {
                transform: translateY(-2px);
              }
            }
          }
        }
        
        :deep(.el-tabs__content) {
          flex: 1;
          overflow: hidden;
        }
        
        // iframe容器
        .document-frame-container {
          height: calc(100vh - 180px);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          background-color: white;
          transition: all 0.3s;
          
          &:hover {
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          }
          
          // iframe
          .document-frame {
            width: 100%;
            height: 100%;
            border: none;
          }
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
        width: 300px;
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
        content: '';
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
      .document-frame-container {
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
          width: 260px;
        }
      }
    }
    
    .document-content {
      .document-frame-container {
        height: calc(100vh - 160px);
      }
    }
  }
}
</style>
