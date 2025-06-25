<template>
  <div class="grid-layout-editor">
    <!-- 工具栏 -->
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button
            :type="editorState.mode === 'view' ? 'primary' : 'default'"
            size="small"
            @click="setEditMode('view')"
          >
            <IconifyIconOnline icon="ri:eye-line" />
            预览
          </el-button>
          <el-button
            :type="editorState.mode === 'edit' ? 'primary' : 'default'"
            size="small"
            @click="setEditMode('edit')"
          >
            <IconifyIconOnline icon="ri:edit-line" />
            编辑
          </el-button>
        </el-button-group>
        
        <el-divider direction="vertical" />
        
        <el-button-group v-if="isEditMode">
          <el-button
            size="small"
            :disabled="!canUndo"
            @click="undo"
          >
            <IconifyIconOnline icon="ri:arrow-go-back-line" />
            撤销
          </el-button>
          <el-button
            size="small"
            :disabled="!canRedo"
            @click="redo"
          >
            <IconifyIconOnline icon="ri:arrow-go-forward-line" />
            重做
          </el-button>
        </el-button-group>
        
        <el-divider direction="vertical" />
        
        <el-dropdown @command="handleToolbarAction">
          <el-button size="small">
            <IconifyIconOnline icon="ri:add-line" />
            添加组件
            <IconifyIconOnline icon="ri:arrow-down-s-line" />
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="add-card">
                <IconifyIconOnline icon="ri:file-text-line" />
                卡片组件
              </el-dropdown-item>
              <el-dropdown-item command="add-gauge">
                <IconifyIconOnline icon="ri:dashboard-line" />
                仪表盘
              </el-dropdown-item>
              <el-dropdown-item command="add-line-chart">
                <IconifyIconOnline icon="ri:line-chart-line" />
                折线图
              </el-dropdown-item>
              <el-dropdown-item command="add-bar-chart">
                <IconifyIconOnline icon="ri:bar-chart-line" />
                柱状图
              </el-dropdown-item>
              <el-dropdown-item command="add-pie-chart">
                <IconifyIconOnline icon="ri:pie-chart-line" />
                饼图
              </el-dropdown-item>
              <el-dropdown-item command="add-table">
                <IconifyIconOnline icon="ri:table-line" />
                表格
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
      
      <div class="toolbar-right">
        <el-button-group>
          <el-button size="small" @click="showGridLines = !showGridLines">
            <IconifyIconOnline icon="ri:grid-line" />
            {{ showGridLines ? '隐藏' : '显示' }}网格
          </el-button>
          <el-button size="small" @click="resetLayout">
            <IconifyIconOnline icon="ri:refresh-line" />
            重置布局
          </el-button>
          <el-button
            type="primary"
            size="small"
            @click="saveLayout"
            :loading="loading"
            :disabled="!editorState.isDirty"
          >
            <IconifyIconOnline icon="ri:save-line" />
            保存布局
          </el-button>
        </el-button-group>
      </div>
    </div>

    <!-- 布局容器 -->
    <div class="layout-container" :class="{ 'show-grid': showGridLines }">
      <div class="grid-layout">
        <div
          v-for="item in layout"
          :key="item.i"
          class="grid-item"
          :class="{
            'selected': editorState.selectedComponent === item.i,
            'edit-mode': isEditMode,
            'draggable': isEditMode && !item.static
          }"
          :style="getItemStyle(item)"
          @click="selectComponent(item.i)"
          @mousedown="handleMouseDown($event, item)"
        >
          <!-- 组件内容 -->
          <div class="component-content">
            <!-- 编辑模式下的组件头部 -->
            <div v-if="isEditMode" class="component-header">
              <div class="component-title">
                <IconifyIconOnline :icon="getComponentIcon(item.componentType)" />
                <span>{{ getComponentTitle(item) }}</span>
              </div>
              <div class="component-actions">
                <el-button
                  size="small"
                  text
                  @click.stop="configureComponent(item)"
                >
                  <IconifyIconOnline icon="ri:settings-line" />
                </el-button>
                <el-button
                  size="small"
                  text
                  @click.stop="duplicateComponent(item)"
                >
                  <IconifyIconOnline icon="ri:file-copy-line" />
                </el-button>
                <el-button
                  size="small"
                  text
                  type="danger"
                  @click.stop="removeComponent(item.i)"
                >
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                </el-button>
              </div>
            </div>
            
            <!-- 实际组件内容 -->
            <div class="component-body">
              <component
                :is="getComponentByType(item.componentType)"
                :component-data="getComponentData(item)"
                :config="getComponentConfig(item)"
                :preview-mode="editorState.mode !== 'view'"
                @configure="configureComponent(item)"
              />
            </div>
          </div>
          
          <!-- 选中状态的边框 -->
          <div
            v-if="editorState.selectedComponent === item.i && isEditMode"
            class="selection-border"
          />
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="!hasLayout" class="empty-layout">
        <el-empty description="暂无组件">
          <template #image>
            <IconifyIconOnline icon="ri:layout-grid-line" />
          </template>
          <el-button type="primary" @click="handleToolbarAction('add-card')">
            添加第一个组件
          </el-button>
        </el-empty>
      </div>
    </div>

    <!-- 属性面板 -->
    <div v-if="selectedItem && isEditMode" class="properties-panel">
      <el-card shadow="never">
        <template #header>
          <div class="panel-header">
            <span>组件属性</span>
            <el-button size="small" text @click="selectComponent()">
              <IconifyIconOnline icon="ri:close-line" />
            </el-button>
          </div>
        </template>
        
        <el-form label-width="80px" size="small">
          <el-form-item label="组件ID">
            <el-input v-model="selectedItem.i" disabled />
          </el-form-item>
          <el-form-item label="X坐标">
            <el-input-number
              v-model="selectedItem.x"
              :min="0"
              :max="layoutConfig.colNum - selectedItem.w"
              controls-position="right"
              @change="updateSelectedItem"
            />
          </el-form-item>
          <el-form-item label="Y坐标">
            <el-input-number
              v-model="selectedItem.y"
              :min="0"
              controls-position="right"
              @change="updateSelectedItem"
            />
          </el-form-item>
          <el-form-item label="宽度">
            <el-input-number
              v-model="selectedItem.w"
              :min="selectedItem.minW || 1"
              :max="selectedItem.maxW || layoutConfig.colNum"
              controls-position="right"
              @change="updateSelectedItem"
            />
          </el-form-item>
          <el-form-item label="高度">
            <el-input-number
              v-model="selectedItem.h"
              :min="selectedItem.minH || 1"
              :max="selectedItem.maxH || 50"
              controls-position="right"
              @change="updateSelectedItem"
            />
          </el-form-item>
          <el-form-item label="静态">
            <el-switch
              v-model="selectedItem.static"
              @change="updateSelectedItem"
            />
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 组件配置对话框 -->
    <ComponentConfigDialog
      ref="componentConfigRef"
      :server-id="serverId"
      @success="handleComponentConfigSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, reactive } from 'vue';
import { message } from '@repo/utils';
import { useLayoutManager } from '../composables/useLayoutManager';
import type { LayoutItem } from '../../../shared/types/layout';
import type { ComponentType } from '../../../shared/types/component';

// 导入组件
import ComponentConfigDialog from '../../component-config/components/ComponentConfigDialog.vue';
import CardComponent from '../../../shared/components/charts/CardComponent.vue';
import GaugeComponent from '../../../shared/components/charts/GaugeComponent.vue';
import LineChartComponent from '../../../shared/components/charts/LineChartComponent.vue';
import BarChartComponent from '../../../shared/components/charts/BarChartComponent.vue';
import PieChartComponent from '../../../shared/components/charts/PieChartComponent.vue';
import TableComponent from '../../../shared/components/charts/TableComponent.vue';

// Props
const props = defineProps<{
  serverId?: number;
  initialLayout?: LayoutItem[];
}>();

// Emits
const emit = defineEmits<{
  layoutChange: [layout: LayoutItem[]];
  save: [layout: LayoutItem[]];
}>();

// 组合式函数
const {
  loading,
  layout,
  editorState,
  layoutConfig,
  hasLayout,
  canUndo,
  canRedo,
  isEditMode,
  selectedItem,
  setLayout,
  addComponent,
  removeComponent,
  updateComponent,
  undo,
  redo,
  resetLayout,
  setEditMode,
  selectComponent,
  saveLayout: saveLayoutToStore
} = useLayoutManager();

// 响应式状态
const showGridLines = ref(true);
const componentConfigRef = ref();

// 拖拽状态
const dragState = reactive({
  isDragging: false,
  dragItem: null as LayoutItem | null,
  startX: 0,
  startY: 0,
  startItemX: 0,
  startItemY: 0,
});

// 组件映射
const componentMap = {
  card: CardComponent,
  gauge: GaugeComponent,
  line: LineChartComponent,
  bar: BarChartComponent,
  pie: PieChartComponent,
  table: TableComponent,
};

// 组件图标映射
const componentIcons = {
  card: 'ri:file-text-line',
  gauge: 'ri:dashboard-line',
  line: 'ri:line-chart-line',
  bar: 'ri:bar-chart-line',
  pie: 'ri:pie-chart-line',
  table: 'ri:table-line',
};

/**
 * 根据类型获取组件
 */
const getComponentByType = (type?: string) => {
  return componentMap[type as keyof typeof componentMap] || CardComponent;
};

/**
 * 获取组件图标
 */
const getComponentIcon = (type?: string) => {
  return componentIcons[type as keyof typeof componentIcons] || 'ri:file-text-line';
};

/**
 * 获取组件标题
 */
const getComponentTitle = (item: LayoutItem) => {
  return item.title || item.componentType || item.i;
};

/**
 * 获取组件数据
 */
const getComponentData = (item: LayoutItem) => {
  // 这里应该根据组件配置获取实际数据
  // 暂时返回模拟数据
  return item.data || { value: Math.random() * 100 };
};

/**
 * 获取组件配置
 */
const getComponentConfig = (item: LayoutItem) => {
  return item.config || {};
};

/**
 * 获取组件样式
 */
const getItemStyle = (item: LayoutItem) => {
  const colWidth = 100 / layoutConfig.colNum;
  const left = item.x * colWidth;
  const width = item.w * colWidth;
  const top = item.y * layoutConfig.rowHeight;
  const height = item.h * layoutConfig.rowHeight;
  
  return {
    position: 'absolute',
    left: `${left}%`,
    width: `${width}%`,
    top: `${top}px`,
    height: `${height}px`,
    zIndex: dragState.dragItem?.i === item.i ? 1000 : 1,
  };
};

/**
 * 处理鼠标按下事件
 */
const handleMouseDown = (event: MouseEvent, item: LayoutItem) => {
  if (!isEditMode.value || item.static) return;
  
  event.preventDefault();
  event.stopPropagation();
  
  dragState.isDragging = true;
  dragState.dragItem = item;
  dragState.startX = event.clientX;
  dragState.startY = event.clientY;
  dragState.startItemX = item.x;
  dragState.startItemY = item.y;
  
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  
  selectComponent(item.i);
};

/**
 * 处理鼠标移动事件
 */
const handleMouseMove = (event: MouseEvent) => {
  if (!dragState.isDragging || !dragState.dragItem) return;
  
  const deltaX = event.clientX - dragState.startX;
  const deltaY = event.clientY - dragState.startY;
  
  const colWidth = 100 / layoutConfig.colNum;
  const gridWidth = document.querySelector('.grid-layout')?.clientWidth || 1000;
  const actualColWidth = gridWidth * colWidth / 100;
  
  const newX = Math.max(0, Math.min(
    layoutConfig.colNum - dragState.dragItem.w,
    dragState.startItemX + Math.round(deltaX / actualColWidth)
  ));
  
  const newY = Math.max(0, dragState.startItemY + Math.round(deltaY / layoutConfig.rowHeight));
  
  updateComponent(dragState.dragItem.i, {
    ...dragState.dragItem,
    x: newX,
    y: newY
  });
};

/**
 * 处理鼠标释放事件
 */
const handleMouseUp = () => {
  if (dragState.isDragging) {
    dragState.isDragging = false;
    dragState.dragItem = null;
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    handleLayoutUpdated(layout.value);
  }
};

/**
 * 处理工具栏操作
 */
const handleToolbarAction = (command: string) => {
  const componentType = command.replace('add-', '') as ComponentType;
  
  const newComponent = addComponent({
    componentType,
    title: getComponentTypeName(componentType),
    w: getDefaultSize(componentType).w,
    h: getDefaultSize(componentType).h,
  });
  
  if (newComponent) {
    selectComponent(newComponent.i);
    message.success(`${getComponentTypeName(componentType)}组件已添加`);
  }
};

/**
 * 获取组件类型名称
 */
const getComponentTypeName = (type: ComponentType) => {
  const typeNames = {
    card: '卡片',
    gauge: '仪表盘',
    line: '折线图',
    bar: '柱状图',
    pie: '饼图',
    table: '表格',
  };
  return typeNames[type] || type;
};

/**
 * 获取默认尺寸
 */
const getDefaultSize = (type: ComponentType) => {
  const defaultSizes = {
    card: { w: 6, h: 4 },
    gauge: { w: 8, h: 8 },
    line: { w: 12, h: 8 },
    bar: { w: 12, h: 8 },
    pie: { w: 8, h: 8 },
    table: { w: 24, h: 12 },
  };
  return defaultSizes[type] || { w: 6, h: 6 };
};

/**
 * 配置组件
 */
const configureComponent = (item: LayoutItem) => {
  // 打开组件配置对话框
  componentConfigRef.value?.open('edit', {
    monitorSysGenServerDetailComponentId: item.componentId,
    monitorSysGenServerDetailComponentName: item.i,
    monitorSysGenServerDetailComponentTitle: item.title || '',
    monitorSysGenServerDetailComponentType: item.componentType || 'card',
    monitorSysGenServerDetailComponentPosition: JSON.stringify({
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h
    }),
    monitorSysGenServerDetailComponentChartConfig: JSON.stringify(item.config || {}),
  });
};

/**
 * 复制组件
 */
const duplicateComponent = (item: LayoutItem) => {
  const newComponent = addComponent({
    ...item,
    i: `${item.i}_copy_${Date.now()}`,
    title: `${item.title || item.i} (副本)`,
  });
  
  if (newComponent) {
    selectComponent(newComponent.i);
    message.success('组件已复制');
  }
};

/**
 * 更新选中项
 */
const updateSelectedItem = () => {
  if (selectedItem.value) {
    updateComponent(selectedItem.value.i, selectedItem.value);
  }
};

/**
 * 处理布局更新
 */
const handleLayoutUpdated = (newLayout: LayoutItem[]) => {
  emit('layoutChange', newLayout);
  editorState.isDirty = true;
};

/**
 * 保存布局
 */
const saveLayout = async () => {
  const success = await saveLayoutToStore(props.serverId);
  if (success) {
    emit('save', layout.value);
  }
};

/**
 * 处理组件配置成功
 */
const handleComponentConfigSuccess = () => {
  // 重新加载组件数据
  message.success('组件配置已更新');
};

// 监听初始布局变化
watch(() => props.initialLayout, (newLayout) => {
  if (newLayout) {
    setLayout(newLayout);
  }
}, { immediate: true });

// 监听服务器ID变化
watch(() => props.serverId, (newServerId) => {
  if (newServerId) {
    // 可以在这里加载服务器特定的布局
  }
});

// 暴露方法
defineExpose({
  setLayout,
  getLayout: () => layout.value,
  setEditMode,
  saveLayout,
  resetLayout
});
</script>

<style scoped lang="scss">
.grid-layout-editor {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  
  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.layout-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #fafafa;
  
  &.show-grid {
    background-image: 
      linear-gradient(to right, #e0e0e0 1px, transparent 1px),
      linear-gradient(to bottom, #e0e0e0 1px, transparent 1px);
    background-size: 20px 20px;
  }
  
  .grid-layout {
    position: relative;
    min-height: 100%;
    width: 100%;
  }
}

.grid-item {
  border: 1px solid transparent;
  border-radius: 4px;
  transition: all 0.2s;
  
  &.edit-mode {
    border-color: var(--el-border-color);
    
    &:hover {
      border-color: var(--el-color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
    
    &.selected {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
    }
  }
  
  .component-content {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: white;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .component-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    .component-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
    
    .component-actions {
      display: flex;
      gap: 4px;
    }
  }
  
  .component-body {
    flex: 1;
    overflow: hidden;
  }
  
  .selection-border {
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    border: 2px solid var(--el-color-primary);
    border-radius: 6px;
    pointer-events: none;
  }
}

.empty-layout {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.properties-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 280px;
  z-index: 1000;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }
  
  :deep(.el-card__body) {
    padding: 16px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    gap: 12px;
    
    .toolbar-left,
    .toolbar-right {
      width: 100%;
      justify-content: center;
    }
  }
  
  .properties-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: auto;
    border-radius: 8px 8px 0 0;
  }
}
</style>
