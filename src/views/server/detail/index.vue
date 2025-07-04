<template>
  <div class="server-detail-container">
    <!-- 头部信息 -->
    <div class="server-detail-header">
      <div class="server-info">
        <div class="server-title">
          <IconifyIconOnline icon="ri:server-line" class="server-icon" />
          <span class="server-name">{{ serverData?.monitorSysGenServerName || '服务器详情' }}</span>
          <el-tag 
            :type="serverData?.monitorSysGenServerStatus === 1 ? 'success' : 'danger'" 
            size="small"
          >
            {{ serverData?.monitorSysGenServerStatus === 1 ? '在线' : '离线' }}
          </el-tag>
        </div>
        <div class="server-meta">
          <span>{{ serverData?.monitorSysGenServerHost }}:{{ serverData?.monitorSysGenServerPort }}</span>
          <span v-if="serverData?.monitorSysGenServerDescription">{{ serverData.monitorSysGenServerDescription }}</span>
        </div>
      </div>
      
      <div class="server-actions">
        <el-button 
          v-if="editMode" 
          type="primary" 
          @click="showAddComponentDialog = true"
        >
          <IconifyIconOnline icon="ri:add-line" class="mr-1" />
          添加组件
        </el-button>
        <el-button 
          v-if="editMode" 
          type="primary" 
          @click="showSharedComponentsDialog = true"
        >
          <IconifyIconOnline icon="ri:share-line" class="mr-1" />
          共享组件
        </el-button>
        <el-button 
          v-if="editMode && layoutChanged" 
          type="success" 
          @click="saveLayout"
        >
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          保存布局
        </el-button>
        <el-button 
          :type="editMode ? 'warning' : 'primary'" 
          @click="toggleEditMode"
        >
          <IconifyIconOnline :icon="editMode ? 'ri:eye-line' : 'ri:edit-line'" class="mr-1" />
          {{ editMode ? '预览模式' : '编辑模式' }}
        </el-button>
      </div>
    </div>

    <!-- 组件布局区域 -->
    <div class="server-detail-content">
      <el-scrollbar class="layout-scrollbar">
        <div class="layout-container">
          <GridLayout
            v-if="layout.length > 0"
            :layout="layout"
            :col-num="24"
            :row-height="30"
            :is-draggable="editMode"
            :is-resizable="editMode"
            :vertical-compact="true"
            :use-css-transforms="true"
            :margin="[10, 10]"
            @layout-updated="handleLayoutUpdated"
          >
            <GridItem
              v-for="item in layout"
              :key="item.i"
              :x="item.x"
              :y="item.y"
              :w="item.w"
              :h="item.h"
              :i="item.i"
            >
              <div class="grid-item-content">
                <!-- 编辑模式下的操作按钮 -->
                <div v-if="editMode" class="grid-item-overlay">
                  <div class="grid-item-actions">
                    <el-tooltip content="编辑组件">
                      <el-button type="primary" circle size="small" @click="editComponent(item)">
                        <IconifyIconOnline icon="ri:edit-line" />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip content="共享组件">
                      <el-button type="warning" circle size="small" @click="shareComponent(item)">
                        <IconifyIconOnline icon="ri:share-line" />
                      </el-button>
                    </el-tooltip>
                    <el-tooltip v-if="!item.fixed" content="删除组件">
                      <el-button type="danger" circle size="small" @click="removeComponent(item)">
                        <IconifyIconOnline icon="ri:delete-bin-line" />
                      </el-button>
                    </el-tooltip>
                  </div>
                </div>

                <!-- 组件内容 -->
                <component
                  :is="getComponentByType(item.type)"
                  :server-id="serverId"
                  :component-config="getComponentConfig(item)"
                  :height="getComponentHeight(item)"
                  :editable="editMode"
                  @edit="editComponent(item)"
                  @share="shareComponent(item)"
                  @remove="removeComponent(item)"
                />
              </div>
            </GridItem>
          </GridLayout>
          
          <!-- 空状态 -->
          <div v-else class="empty-layout">
            <el-empty description="暂无组件">
              <el-button type="primary" @click="initFixedComponents">
                初始化默认组件
              </el-button>
            </el-empty>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 添加组件对话框 -->
    <AddComponentDialog
      v-model="showAddComponentDialog"
      :server-id="serverId"
      @confirm="handleAddComponent"
    />

    <!-- 共享组件对话框 -->
    <SharedComponentsDialog
      v-model="showSharedComponentsDialog"
      :server-id="serverId"
      @confirm="handleCopySharedComponent"
    />

    <!-- 编辑组件对话框 -->
    <EditComponentDialog
      v-model="showEditComponentDialog"
      :component="editingComponent"
      @confirm="handleUpdateComponent"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { GridLayout, GridItem } from 'grid-layout-plus';
import { ElMessage, ElMessageBox } from 'element-plus';
import { IconifyIconOnline } from '@repo/components/ReIcon';

// API imports
import { 
  fetchServerComponents, 
  initServerFixedComponents,
  updateServerComponentPositions,
  deleteServerComponent,
  shareServerComponent,
  copySharedComponent,
  type ServerComponent,
  type ComponentPosition
} from '@/api/server/component';
import { fetchServerDetail, type ServerDetailComponent } from '@/api/server';

// Component imports
import AddComponentDialog from './components/AddComponentDialog.vue';
import SharedComponentsDialog from './components/SharedComponentsDialog.vue';
import EditComponentDialog from './components/EditComponentDialog.vue';

// Server component imports
import ServerCpuComponent from './components/ServerCpuComponent.vue';
import ServerMemoryComponent from './components/ServerMemoryComponent.vue';
import ServerDiskComponent from './components/ServerDiskComponent.vue';
import ServerNetworkComponent from './components/ServerNetworkComponent.vue';
import ServerSystemComponent from './components/ServerSystemComponent.vue';

const route = useRoute();
const serverId = computed(() => parseInt(route.params.id as string));

// 响应式数据
const serverData = ref<ServerDetailComponent | null>(null);
const layout = ref<ComponentPosition[]>([]);
const editMode = ref(false);
const layoutChanged = ref(false);
const loading = ref(false);

// 对话框状态
const showAddComponentDialog = ref(false);
const showSharedComponentsDialog = ref(false);
const showEditComponentDialog = ref(false);
const editingComponent = ref<ServerComponent | null>(null);

// 组件映射
const componentMap = {
  cpu: ServerCpuComponent,
  memory: ServerMemoryComponent,
  disk: ServerDiskComponent,
  network: ServerNetworkComponent,
  system: ServerSystemComponent
};

/**
 * 根据组件类型获取组件
 */
const getComponentByType = (type: string) => {
  return componentMap[type] || ServerSystemComponent;
};

/**
 * 获取组件配置
 */
const getComponentConfig = (item: ComponentPosition) => {
  // 从数据库中获取组件配置
  return {};
};

/**
 * 获取组件高度
 */
const getComponentHeight = (item: ComponentPosition) => {
  return item.h * 30 + (item.h - 1) * 10 - 40; // 减去头部高度
};

/**
 * 加载服务器详情
 */
const loadServerDetail = async () => {
  try {
    const res = await fetchServerDetail(serverId.value);
    if (res.code === '00000' && res.data) {
      serverData.value = res.data;
    }
  } catch (error) {
    console.error('加载服务器详情失败:', error);
    ElMessage.error('加载服务器详情失败');
  }
};

/**
 * 加载组件布局
 */
const loadComponents = async () => {
  try {
    loading.value = true;
    const res = await fetchServerComponents(serverId.value);
    if (res.code === '00000' && res.data) {
      // 转换为布局格式
      layout.value = res.data.map(component => {
        const position = component.monitorSysGenServerComponentPosition 
          ? JSON.parse(component.monitorSysGenServerComponentPosition)
          : { x: 0, y: 0, w: 6, h: 8, i: `component_${component.monitorSysGenServerComponentId}` };
        
        return {
          ...position,
          componentId: component.monitorSysGenServerComponentId,
          type: component.monitorSysGenServerComponentType,
          name: component.monitorSysGenServerComponentName,
          fixed: component.monitorSysGenServerComponentFixed === 1
        };
      });
    }
  } catch (error) {
    console.error('加载组件布局失败:', error);
    ElMessage.error('加载组件布局失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 初始化固定组件
 */
const initFixedComponents = async () => {
  try {
    const res = await initServerFixedComponents(serverId.value);
    if (res.code === '00000') {
      ElMessage.success('初始化默认组件成功');
      await loadComponents();
    } else {
      ElMessage.error(res.message || '初始化失败');
    }
  } catch (error) {
    console.error('初始化固定组件失败:', error);
    ElMessage.error('初始化固定组件失败');
  }
};

/**
 * 切换编辑模式
 */
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  if (!editMode.value && layoutChanged.value) {
    // 退出编辑模式时提示保存
    ElMessageBox.confirm('布局已修改，是否保存？', '提示', {
      confirmButtonText: '保存',
      cancelButtonText: '不保存',
      type: 'warning'
    }).then(() => {
      saveLayout();
    }).catch(() => {
      layoutChanged.value = false;
    });
  }
};

/**
 * 处理布局更新
 */
const handleLayoutUpdated = (newLayout: ComponentPosition[]) => {
  layout.value = newLayout;
  layoutChanged.value = true;
};

/**
 * 保存布局
 */
const saveLayout = async () => {
  try {
    // 构建组件位置更新数据
    const components = layout.value.map(item => ({
      monitorSysGenServerComponentId: item.componentId,
      monitorSysGenServerId: serverId.value,
      monitorSysGenServerComponentPosition: JSON.stringify({
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        i: item.i
      })
    }));

    const res = await updateServerComponentPositions(serverId.value, components);
    if (res.code === '00000') {
      ElMessage.success('保存布局成功');
      layoutChanged.value = false;
    } else {
      ElMessage.error(res.message || '保存布局失败');
    }
  } catch (error) {
    console.error('保存布局失败:', error);
    ElMessage.error('保存布局失败');
  }
};

/**
 * 编辑组件
 */
const editComponent = (item: ComponentPosition) => {
  // 获取组件详情并打开编辑对话框
  editingComponent.value = {
    monitorSysGenServerComponentId: item.componentId,
    monitorSysGenServerId: serverId.value,
    monitorSysGenServerComponentName: item.name || '',
    monitorSysGenServerComponentType: item.type || ''
  };
  showEditComponentDialog.value = true;
};

/**
 * 共享组件
 */
const shareComponent = async (item: ComponentPosition) => {
  if (!item.componentId) return;

  try {
    const res = await shareServerComponent(item.componentId);
    if (res.code === '00000') {
      ElMessage.success('设置组件共享成功');
    } else {
      ElMessage.error(res.message || '设置组件共享失败');
    }
  } catch (error) {
    console.error('设置组件共享失败:', error);
    ElMessage.error('设置组件共享失败');
  }
};

/**
 * 删除组件
 */
const removeComponent = async (item: ComponentPosition) => {
  if (!item.componentId || item.fixed) return;

  try {
    await ElMessageBox.confirm('确定要删除此组件吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });

    const res = await deleteServerComponent(item.componentId);
    if (res.code === '00000') {
      ElMessage.success('删除组件成功');
      await loadComponents();
    } else {
      ElMessage.error(res.message || '删除组件失败');
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除组件失败:', error);
      ElMessage.error('删除组件失败');
    }
  }
};

/**
 * 处理添加组件
 */
const handleAddComponent = async (component: ServerComponent) => {
  await loadComponents();
  showAddComponentDialog.value = false;
};

/**
 * 处理复制共享组件
 */
const handleCopySharedComponent = async (sourceComponentId: number) => {
  try {
    const res = await copySharedComponent(serverId.value, sourceComponentId);
    if (res.code === '00000') {
      ElMessage.success('复制共享组件成功');
      await loadComponents();
    } else {
      ElMessage.error(res.message || '复制共享组件失败');
    }
  } catch (error) {
    console.error('复制共享组件失败:', error);
    ElMessage.error('复制共享组件失败');
  }
  showSharedComponentsDialog.value = false;
};

/**
 * 处理更新组件
 */
const handleUpdateComponent = async (component: ServerComponent) => {
  await loadComponents();
  showEditComponentDialog.value = false;
  editingComponent.value = null;
};

// 监听路由参数变化
watch(() => route.params.id, () => {
  if (route.params.id) {
    loadServerDetail();
    loadComponents();
  }
}, { immediate: true });

// 组件挂载时加载数据
onMounted(() => {
  loadServerDetail();
  loadComponents();
});
</script>

<style scoped lang="scss">
.server-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
}

.server-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  .server-info {
    .server-title {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;

      .server-icon {
        font-size: 20px;
        color: var(--el-color-primary);
      }

      .server-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }
    }

    .server-meta {
      display: flex;
      gap: 16px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }
  }

  .server-actions {
    display: flex;
    gap: 8px;
  }
}

.server-detail-content {
  flex: 1;
  overflow: hidden;

  .layout-scrollbar {
    height: 100%;

    :deep(.el-scrollbar__view) {
      height: 100%;
    }
  }

  .layout-container {
    min-height: 100%;
    padding: 16px;
  }

  .empty-layout {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
}

.grid-item-content {
  position: relative;
  height: 100%;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .grid-item-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;

    &:hover {
      opacity: 1;
    }

    .grid-item-actions {
      display: flex;
      gap: 8px;
    }
  }
}

// Grid Layout 样式覆盖
:deep(.vue-grid-layout) {
  background-color: transparent;
}

:deep(.vue-grid-item) {
  transition: all 0.3s ease;

  &.vue-grid-item--dragging {
    transition: none;
    z-index: 3;
  }

  &.vue-grid-item--resizing {
    opacity: 0.8;
  }
}

:deep(.vue-resizable-handle) {
  background-color: var(--el-color-primary);
  opacity: 0.3;

  &:hover {
    opacity: 0.8;
  }
}
</style>
