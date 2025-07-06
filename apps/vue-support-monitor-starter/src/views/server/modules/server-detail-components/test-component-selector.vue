<template>
  <div class="test-component-selector">
    <el-card>
      <template #header>
        <h3>组件选择器测试</h3>
      </template>
      
      <el-space direction="vertical" size="large" style="width: 100%">
        <!-- 服务器选择 -->
        <el-card>
          <template #header>
            <h4>选择服务器</h4>
          </template>
          
          <el-select v-model="selectedServerId" placeholder="请选择服务器" style="width: 300px" @change="loadServerComponents">
            <el-option
              v-for="server in servers"
              :key="server.monitorSysGenServerId"
              :label="server.monitorSysGenServerName"
              :value="server.monitorSysGenServerId"
            />
          </el-select>
        </el-card>
        
        <!-- 组件数据显示 -->
        <el-card v-if="selectedServerId">
          <template #header>
            <h4>服务器组件数据</h4>
          </template>
          
          <el-descriptions :column="2" border>
            <el-descriptions-item label="服务器ID">{{ selectedServerId }}</el-descriptions-item>
            <el-descriptions-item label="总组件数">{{ allComponents.length }}</el-descriptions-item>
            <el-descriptions-item label="启用组件数">{{ enabledComponents.length }}</el-descriptions-item>
            <el-descriptions-item label="禁用组件数">{{ allComponents.length - enabledComponents.length }}</el-descriptions-item>
          </el-descriptions>
          
          <el-divider />
          
          <!-- 组件列表 -->
          <div v-if="enabledComponents.length > 0">
            <h5>启用的组件列表:</h5>
            <el-table :data="enabledComponents" style="width: 100%" max-height="400">
              <el-table-column prop="monitorSysGenServerComponentId" label="组件ID" width="100" />
              <el-table-column prop="monitorSysGenServerComponentName" label="组件名称" />
              <el-table-column prop="monitorSysGenServerComponentType" label="组件类型" width="120">
                <template #default="{ row }">
                  <el-tag :type="getComponentTypeTagColor(row.monitorSysGenServerComponentType)" size="small">
                    {{ getComponentTypeDisplayName(row.monitorSysGenServerComponentType) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="monitorSysGenServerComponentStatus" label="状态" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.monitorSysGenServerComponentStatus === 1 ? 'success' : 'danger'" size="small">
                    {{ row.monitorSysGenServerComponentStatus === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="monitorSysGenServerComponentDescription" label="描述" />
            </el-table>
          </div>
          
          <el-empty v-else description="该服务器暂无启用的组件" />
        </el-card>
        
        <!-- 测试组件选择器 -->
        <el-card v-if="selectedServerId">
          <template #header>
            <h4>测试组件选择器</h4>
          </template>
          
          <el-space>
            <el-button type="primary" @click="testComponentSelector">
              打开组件选择器
            </el-button>
            <el-button @click="refreshData">
              刷新数据
            </el-button>
          </el-space>
          
          <div v-if="selectedComponentIds.length > 0" style="margin-top: 16px">
            <h5>已选择的组件:</h5>
            <el-tag
              v-for="componentId in selectedComponentIds"
              :key="componentId"
              style="margin-right: 8px; margin-bottom: 8px"
              closable
              @close="removeSelectedComponent(componentId)"
            >
              组件 {{ componentId }}
            </el-tag>
          </div>
        </el-card>
      </el-space>
    </el-card>
    
    <!-- 模拟组件选择器对话框 -->
    <el-dialog v-model="showSelector" title="选择组件" width="60%" destroy-on-close>
      <div class="component-selector">
        <div class="component-cards">
          <el-empty v-if="enabledComponents.length === 0" description="暂无可用组件" />
          <div v-else class="component-grid">
            <div 
              v-for="item in enabledComponents" 
              :key="item.monitorSysGenServerComponentId" 
              class="component-card" 
              :class="{ 'component-card-selected': selectedComponentIds.includes(item.monitorSysGenServerComponentId) }" 
              @click="toggleComponentSelection(item)"
            >
              <div class="component-card-header">
                <span class="component-card-title">{{ item.monitorSysGenServerComponentName }}</span>
                <el-tag size="small" :type="getComponentTypeTagColor(item.monitorSysGenServerComponentType)">
                  {{ getComponentTypeDisplayName(item.monitorSysGenServerComponentType) }}
                </el-tag>
              </div>
              <div class="component-card-content">
                <div class="component-expression">{{ item.monitorSysGenServerComponentExpression || item.monitorSysGenServerComponentDescription }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="selector-footer">
          <div class="selected-info">
            已选择 {{ selectedComponentIds.length }} 个组件
          </div>
          <div class="selector-actions">
            <el-button @click="showSelector = false">取消</el-button>
            <el-button type="primary" @click="confirmSelection" :disabled="selectedComponentIds.length === 0">
              确认选择
            </el-button>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import {
  getServerList,
  getComponentsByServerId,
  getEnabledServerDetailComponents,
  type Server,
  type ServerComponent
} from '@/api/server';
import {
  getComponentTypeDisplayName,
  getComponentTypeTagColor
} from '@/utils/component-field-mapping';

// 响应式数据
const servers = ref<Server[]>([]);
const selectedServerId = ref<number>(0);
const allComponents = ref<ServerComponent[]>([]);
const enabledComponents = ref<ServerComponent[]>([]);
const showSelector = ref(false);
const selectedComponentIds = ref<number[]>([]);

/**
 * 加载服务器列表
 */
const loadServers = async () => {
  try {
    const res = await getServerList();
    if (res.code === "00000") {
      servers.value = res.data || [];
      if (servers.value.length > 0) {
        selectedServerId.value = servers.value[0].monitorSysGenServerId;
        await loadServerComponents();
      }
    }
  } catch (error) {
    console.error("加载服务器列表失败:", error);
    ElMessage.error("加载服务器列表失败");
  }
};

/**
 * 加载服务器组件
 */
const loadServerComponents = async () => {
  if (!selectedServerId.value) return;
  
  try {
    // 加载所有组件
    const allRes = await getComponentsByServerId(selectedServerId.value);
    if (allRes.code === "00000") {
      allComponents.value = allRes.data || [];
    }
    
    // 加载启用的组件
    const enabledRes = await getEnabledServerDetailComponents(selectedServerId.value);
    if (enabledRes.code === "00000") {
      enabledComponents.value = enabledRes.data || [];
    }
    
    console.log("所有组件:", allComponents.value);
    console.log("启用组件:", enabledComponents.value);
    
  } catch (error) {
    console.error("加载组件失败:", error);
    ElMessage.error("加载组件失败");
  }
};

/**
 * 测试组件选择器
 */
const testComponentSelector = () => {
  showSelector.value = true;
};

/**
 * 切换组件选择
 */
const toggleComponentSelection = (component: ServerComponent) => {
  const componentId = component.monitorSysGenServerComponentId!;
  const index = selectedComponentIds.value.indexOf(componentId);

  if (index > -1) {
    selectedComponentIds.value.splice(index, 1);
  } else {
    selectedComponentIds.value.push(componentId);
  }
};

/**
 * 移除选中的组件
 */
const removeSelectedComponent = (componentId: number) => {
  const index = selectedComponentIds.value.indexOf(componentId);
  if (index > -1) {
    selectedComponentIds.value.splice(index, 1);
  }
};

/**
 * 确认选择
 */
const confirmSelection = () => {
  showSelector.value = false;
  ElMessage.success(`已选择 ${selectedComponentIds.value.length} 个组件`);
};

/**
 * 刷新数据
 */
const refreshData = () => {
  loadServerComponents();
  ElMessage.info("数据已刷新");
};

// 组件挂载时加载数据
onMounted(() => {
  loadServers();
});
</script>

<style lang="scss" scoped>
.test-component-selector {
  padding: 20px;
}

.component-selector {
  .component-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .component-card {
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
      box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    }

    &.component-card-selected {
      border-color: #409eff;
      background-color: #f0f9ff;
    }
  }

  .component-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .component-card-title {
    font-weight: 500;
    color: #303133;
  }

  .component-card-content {
    .component-expression {
      font-size: 12px;
      color: #909399;
      line-height: 1.4;
    }
  }

  .selector-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 16px;
    border-top: 1px solid #e4e7ed;
  }

  .selected-info {
    color: #606266;
    font-size: 14px;
  }

  .selector-actions {
    display: flex;
    gap: 12px;
  }
}
</style>
