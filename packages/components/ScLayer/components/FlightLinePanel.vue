/**
 * 飞线图面板组件
 * @description 显示飞线图数据列表，支持选择和多选
 */
<template>
  <div class="flight-line-panel" :class="{ active, collapsed }" @click.stop>
    <div class="flight-line-panel-header">
      <span class="panel-title">飞线数据</span>
      <div class="panel-actions">
        <span class="panel-count" v-if="!collapsed">{{ flightLines.length }}条</span>
        <button class="collapse-btn" @click.stop="toggleCollapse">
          {{ collapsed ? '展开' : '收起' }}
        </button>
      </div>
    </div>
    <div class="flight-line-panel-content" v-if="!collapsed">
      <div class="flight-line-stats">
        <span>总数: {{ flightLines.length }}</span>
        <span>已选择: {{ selectedCount }}</span>
      </div>
      <div class="flight-line-toolbar">
        <button class="toolbar-btn" @click.stop="selectAll">全选</button>
        <button class="toolbar-btn" @click.stop="unselectAll">取消全选</button>
        <button class="toolbar-btn" :disabled="selectedCount === 0" @click.stop="hideSelected">
          {{ hideMode ? '显示' : '隐藏' }}所选
        </button>
      </div>
      <div class="flight-line-list">
        <div v-if="flightLines.length === 0" class="no-flight-lines">
          暂无飞线数据
        </div>
        <div 
          v-for="line in flightLines" 
          :key="line.id" 
          class="flight-line-item"
          :class="{
            'flight-line-selected': isSelected(line.id),
            'flight-line-hidden': isHidden(line.id)
          }"
          @click.stop="toggleSelection(line.id)"
        >
          <div class="flight-line-header">
            <span class="flight-line-id">ID: {{ shortId(line.id) }}</span>
            <span class="flight-line-value" v-if="line.value !== undefined">
              值: {{ line.value }}
            </span>
          </div>
          <div class="flight-line-route">
            <span>{{ line.fromName }}</span>
            <span class="flight-line-arrow">→</span>
            <span>{{ line.toName }}</span>
          </div>
        </div>
      </div>
    </div>
    <!-- 添加最小化状态下的图标，点击即可展开 -->
    <div class="flight-line-panel-minimized" v-if="collapsed" @click.stop="toggleCollapse">
      <i class="flight-line-icon"></i>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'FlightLinePanel'
};
</script>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits, watch, onMounted, onBeforeUnmount } from 'vue';
import type { FlightLineData } from '../types/flightline';

const props = defineProps<{
  flightLineObj: any;
  active: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'collapse-change', collapsed: boolean): void;
  (e: 'selection-change', selectedIds: string[]): void;
}>();

// 状态
const collapsed = ref(false);
const flightLines = ref<Array<FlightLineData & { id: string }>>([]);
const selectedIds = ref<Array<string>>([]);
const hiddenIds = ref<Array<string>>([]);
const hideMode = ref(false);
const isInitialized = ref(false);
const isPanelTouched = ref(false);

// 计算属性
const selectedCount = computed(() => selectedIds.value.length);

// 缩短ID显示
const shortId = (id: string) => {
  if (!id) return '无ID';
  return typeof id === 'string' ? id.slice(-8) : String(id);
};

// 检查是否选中
const isSelected = (id: string) => {
  return selectedIds.value.includes(id);
};

// 检查是否隐藏
const isHidden = (id: string) => {
  return hiddenIds.value.includes(id);
};

// 切换折叠状态
const toggleCollapse = () => {
  collapsed.value = !collapsed.value;
  emit('collapse-change', collapsed.value);
  
  // 标记面板已被用户触摸
  isPanelTouched.value = true;
};

// 处理关闭面板
const handleClose = () => {
  emit('close');
};

// 切换选择状态
const toggleSelection = (id: string) => {
  const index = selectedIds.value.indexOf(id);
  if (index === -1) {
    // 如果未选中，添加到选中列表
    selectedIds.value.push(id);
  } else {
    // 如果已选中，从选中列表中移除
    selectedIds.value.splice(index, 1);
  }
  
  // 标记面板已被用户触摸
  isPanelTouched.value = true;
  
  // 通知选中状态变化
  emit('selection-change', selectedIds.value);
  
  // 如果有飞线图对象，更新飞线显示状态
  updateFlightLineHighlight(id);
};

// 全选
const selectAll = () => {
  selectedIds.value = flightLines.value.map(line => line.id);
  emit('selection-change', selectedIds.value);
  updateAllFlightLineHighlights();
  
  // 标记面板已被用户触摸
  isPanelTouched.value = true;
};

// 取消全选
const unselectAll = () => {
  selectedIds.value = [];
  emit('selection-change', selectedIds.value);
  updateAllFlightLineHighlights();
  
  // 标记面板已被用户触摸
  isPanelTouched.value = true;
};

// 隐藏/显示选中的飞线
const hideSelected = () => {
  if (selectedIds.value.length === 0) return;
  
  // 切换hideMode
  hideMode.value = !hideMode.value;
  
  if (hideMode.value) {
    // 隐藏选中的飞线
    hiddenIds.value = [...selectedIds.value];
  } else {
    // 显示选中的飞线
    hiddenIds.value = [];
  }
  
  // 标记面板已被用户触摸
  isPanelTouched.value = true;
  
  // 更新飞线显示状态
  updateVisibility();
};

// 更新单个飞线高亮状态
const updateFlightLineHighlight = (id: string) => {
  if (!props.flightLineObj) return;
  
  try {
    const selected = selectedIds.value.includes(id);
    
    // 更新飞线样式
    props.flightLineObj.updateFlightLine(id, {
      highlight: selected,
      style: selected ? {
        width: 3, // 加粗线条
        opacity: 1,
        color: '#ff0000' // 红色高亮
      } : undefined
    });
  } catch (error) {
    console.error('更新飞线高亮状态失败:', error);
  }
};

// 更新所有飞线高亮状态
const updateAllFlightLineHighlights = () => {
  if (!props.flightLineObj) return;
  
  flightLines.value.forEach(line => {
    updateFlightLineHighlight(line.id);
  });
};

// 更新飞线可见性
const updateVisibility = () => {
  if (!props.flightLineObj) return;
  
  try {
    hiddenIds.value.forEach(id => {
      props.flightLineObj.updateFlightLine(id, {
        visible: false
      });
    });
    
    // 当退出隐藏模式时，恢复所有飞线可见性
    if (!hideMode.value && hiddenIds.value.length > 0) {
      // 恢复之前隐藏的飞线可见性
      hiddenIds.value.forEach(id => {
        props.flightLineObj.updateFlightLine(id, {
          visible: true
        });
      });
      hiddenIds.value = [];
    }
  } catch (error) {
    console.error('更新飞线可见性失败:', error);
  }
};

/**
 * 刷新飞线列表数据
 */
const refreshFlightLineList = () => {
  if (!props.flightLineObj) {
    console.warn('飞线图对象不可用，无法刷新飞线列表');
    return;
  }
  
  try {
    console.log('[FlightLine] 开始刷新飞线列表');
    // 获取所有飞线数据
    const allFlightLines = props.flightLineObj.getAllFlightLines();
    
    // 转换Map为数组 - 使用as断言解决类型问题
    flightLines.value = Array.from((allFlightLines as Map<string, FlightLineData>).entries()).map(([id, data]) => {
      return {
        ...data,
        id
      };
    });
    
    console.log(`[FlightLine] 刷新飞线列表完成，共${flightLines.value.length}条飞线`);
    
    // 当有选中项时，确保选中状态正确
    if (selectedIds.value.length > 0) {
      // 过滤掉不存在的ID
      selectedIds.value = selectedIds.value.filter(id => 
        flightLines.value.some(line => line.id === id)
      );
      
      // 更新所有飞线的高亮状态
      updateAllFlightLineHighlights();
    }
    
    // 更新隐藏状态
    if (hiddenIds.value.length > 0) {
      // 过滤掉不存在的ID
      hiddenIds.value = hiddenIds.value.filter(id => 
        flightLines.value.some(line => line.id === id)
      );
      
      // 更新可见性
      updateVisibility();
    }
    
    // 标记为已初始化
    isInitialized.value = true;
  } catch (error) {
    console.error('[FlightLine] 刷新飞线列表失败:', error);
  }
};

// 防止点击外部关闭面板的处理函数
const handleOutsideClick = (event: MouseEvent) => {
  // 如果用户已与面板交互，则不自动关闭
  if (isPanelTouched.value) {
    return;
  }
  
  // 获取面板DOM元素
  const panelEl = document.querySelector('.flight-line-panel');
  
  // 如果点击事件不是发生在面板内，则触发关闭
  if (panelEl && !panelEl.contains(event.target as Node)) {
    console.debug('[FlightLine] 检测到外部点击，但面板被锁定，不关闭');
  }
};

// 监听props变化
watch(() => props.active, (newActive) => {
  console.log(`[FlightLine] 面板活动状态变更为: ${newActive}`);
  
  if (newActive) {
    // 当面板激活时刷新数据
    refreshFlightLineList();
  }
}, { immediate: true });

// 自动添加示例飞线 - 仅用于测试
const addDemoFlightLines = () => {
  if (!props.flightLineObj || flightLines.value.length > 0) return;
  
  try {
    console.log('[FlightLine] 添加示例飞线数据');
    
    // 添加示例坐标点
    props.flightLineObj.addCoordinates({
      '北京': [116.4, 39.9],
      '上海': [121.5, 31.2],
      '广州': [113.3, 23.1],
      '深圳': [114.1, 22.5],
      '成都': [104.1, 30.7],
    });
    
    // 添加示例飞线
    props.flightLineObj.addFlightLines([
      {
        fromName: '北京',
        toName: '上海',
        coords: [[116.4, 39.9], [121.5, 31.2]],
        value: 100
      },
      {
        fromName: '北京',
        toName: '广州',
        coords: [[116.4, 39.9], [113.3, 23.1]],
        value: 80
      },
      {
        fromName: '上海',
        toName: '深圳',
        coords: [[121.5, 31.2], [114.1, 22.5]],
        value: 60
      }
    ]);
    
    // 刷新列表
    refreshFlightLineList();
    
    // 标记面板已被触摸
    isPanelTouched.value = true;
  } catch (error) {
    console.error('[FlightLine] 添加示例飞线失败:', error);
  }
};

// 导出方法
defineExpose({
  refreshFlightLineList,
  selectAll,
  unselectAll,
  hideSelected,
  getSelectedIds: () => selectedIds.value,
  addDemoFlightLines
});

// 组件挂载时初始化
onMounted(() => {
  console.log('[FlightLine] 面板组件已挂载, active=', props.active);
  
  // 首次加载时检查面板状态
  if (props.active && props.flightLineObj) {
    setTimeout(() => {
      refreshFlightLineList();
      
      // 如果没有数据，添加示例数据（仅在开发环境）
      if (process.env.NODE_ENV !== 'production') {
        setTimeout(() => {
          if (flightLines.value.length === 0) {
            addDemoFlightLines();
          }
        }, 1000);
      }
    }, 200);
  }
  
  // 添加全局点击事件监听器
  document.addEventListener('click', handleOutsideClick);
});

// 组件卸载前移除事件监听器
onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.flight-line-panel {
  position: absolute;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  width: 300px;
  max-height: 400px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s;
  z-index: 1000;
}

/* 添加折叠状态下的样式 */
.flight-line-panel.collapsed {
  width: 40px;
  height: 40px;
  overflow: visible;
}

.flight-line-panel.active {
  display: flex;
}

.flight-line-panel:not(.active) {
  display: none;
}

.flight-line-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f0f2f5;
  border-bottom: 1px solid #e8e8e8;
}

/* 折叠状态下的头部样式 */
.flight-line-panel.collapsed .flight-line-panel-header {
  padding: 0;
  border: none;
  height: 100%;
  width: 100%;
  display: none;
}

.panel-title {
  font-weight: bold;
  font-size: 14px;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-count {
  font-size: 12px;
  color: #666;
}

.collapse-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 2px;
}

.collapse-btn:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.flight-line-panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.flight-line-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  font-size: 12px;
  color: #666;
}

.flight-line-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toolbar-btn {
  background-color: #f0f2f5;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.toolbar-btn:hover {
  color: #1890ff;
  border-color: #1890ff;
}

.toolbar-btn:disabled {
  cursor: not-allowed;
  color: #d9d9d9;
  background-color: #f5f5f5;
  border-color: #d9d9d9;
}

.flight-line-list {
  max-height: 250px;
  overflow-y: auto;
}

.no-flight-lines {
  text-align: center;
  color: #999;
  padding: 20px 0;
  font-style: italic;
}

.flight-line-item {
  padding: 8px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s;
}

.flight-line-item:hover {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.flight-line-selected {
  background-color: #e6f7ff;
  border-color: #1890ff;
}

.flight-line-hidden {
  opacity: 0.5;
  text-decoration: line-through;
}

.flight-line-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.flight-line-id {
  font-weight: bold;
  font-size: 12px;
}

.flight-line-value {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 10px;
  background-color: #e6f7ff;
  color: #1890ff;
}

.flight-line-route {
  font-size: 12px;
  color: #666;
  margin: 4px 0;
  display: flex;
  align-items: center;
}

.flight-line-arrow {
  margin: 0 6px;
  color: #999;
}

/* 位置样式 */
.flight-line-panel[position="top-left"] {
  top: 10px;
  left: 10px;
}

.flight-line-panel[position="top-right"] {
  top: 10px;
  right: 10px;
}

.flight-line-panel[position="bottom-left"] {
  bottom: 10px;
  left: 10px;
}

.flight-line-panel[position="bottom-right"] {
  bottom: 10px;
  right: 10px;
}

/* 添加最小化状态样式 */
.flight-line-panel-minimized {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

/* 飞线图标 */
.flight-line-icon {
  display: inline-block;
  width: 24px;
  height: 24px;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  /* 使用飞线图标的SVG作为背景 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%231890ff'%3E%3Cpath d='M17,9L7,19H5V17L15,7H17V9Z'/%3E%3Cpath d='M17,5V3L21,7L17,11V9L19,7L17,5M7,21V19L3,15L7,11V13L5,15L7,17L7,21Z'/%3E%3C/svg%3E");
}

/* 最小化时点击展开 */
.flight-line-panel-minimized:hover {
  background-color: #f0f2f5;
}
</style> 