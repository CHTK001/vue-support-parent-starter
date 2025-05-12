/**
 * 飞线图面板组件
 * @description 显示飞线图数据列表，支持选择和多选
 */
<template>
  <div class="flight-line-panel" :class="{ active, collapsed, 
    'position-top-left': position === 'top-left',
    'position-top-right': position === 'top-right', 
    'position-bottom-left': position === 'bottom-left',
    'position-bottom-right': position === 'bottom-right'
  }" @click.stop>
    <div class="flight-line-panel-header">
      <span class="panel-title">飞线数据</span>
      <div class="panel-actions">
        <span class="panel-count" v-if="!collapsed">{{ flightLines.length }}条</span>
        <button class="minimize-btn" @click.stop="toggleCollapse" title="最小化/展开面板">
          <span v-if="collapsed">+</span>
          <span v-else>-</span>
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
        <button class="toolbar-btn toolbar-btn-primary" @click.stop="setOptimalView" title="调整到最佳视角">
          最佳视角
        </button>
      </div>
      <div class="flight-line-list">
        <div v-if="flightLines.length === 0" class="no-flight-lines">
          暂无飞线数据
        </div>
        <div 
          v-for="line in flightLines" 
          :key="line.id" 
          class="flight-line-item thin-scrollbar"
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
    <!-- 折叠/最小化状态下的图标 -->
    <div class="track-player-minimized" v-if="collapsed" @click.stop="toggleCollapse">
      <div class="minimized-restore-icon">        
        <span v-html="FLIGHT_LINE_ICON" />
    </div>
    </div>
  </div>
</template>

<script lang="ts">
export default {
  name: 'FlightLinePanel'
};
</script>

<script setup lang="ts">
import { FLIGHT_LINE_ICON } from '../types/icon';
import { ref, computed, defineProps, defineEmits, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';
import type { FlightLineData } from '../types/flightline';

const props = defineProps<{
  flightLineObj: any;
  active: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}>();

const emit = defineEmits<{
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
const panelInitialized = ref(false);

// 计算属性
const selectedCount = computed(() => selectedIds.value.length);
const position = computed(() => props.position || 'top-right'); // 默认右上角，使用props传入的值

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
  
  // 如果是从折叠状态展开，则刷新列表
  if (!collapsed.value) {
    nextTick(() => {
      refreshFlightLineList();
    });
  }
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

// 设置最佳视角
const setOptimalView = () => {
  if (!props.flightLineObj) return;
  
  try {
    // 使用飞线对象的setOptimalView方法设置最佳视角，缩放级别为5
    props.flightLineObj.setOptimalView(5);
  } catch (error) {
    console.error('设置最佳视角失败:', error);
  }
};

// 更新单个飞线高亮状态
const updateFlightLineHighlight = (id: string) => {
  if (!props.flightLineObj) return;
  
  try {
    const selected = selectedIds.value.includes(id);
    
    // 首先确保飞线图对象已启用
    if (selected && !props.flightLineObj.isEnabled()) {
      props.flightLineObj.enable().catch(err => {
        console.error('启用飞线图失败:', err);
      });
    }
    
    // 更新飞线样式
    props.flightLineObj.updateFlightLine(id, {
      highlight: selected,
      visible: !isHidden(id), // 根据隐藏状态设置可见性
      style: selected ? {
        width: 3, // 加粗线条
        opacity: 1,
        color: '#1890ff' // 蓝色高亮，从红色(#ff0000)改为蓝色(#1890ff)
      } : undefined
    });
  } catch (error) {
    console.error('更新飞线高亮状态失败:', error);
  }
};

// 更新所有飞线高亮状态
const updateAllFlightLineHighlights = () => {
  if (!props.flightLineObj) return;
  
  // 首先确保飞线图对象已启用
  if (!props.flightLineObj.isEnabled() && selectedIds.value.length > 0) {
    props.flightLineObj.enable().catch(err => {
      console.error('启用飞线图失败:', err);
    });
  }
  
  // 如果没有选中任何飞线，则尝试禁用飞线图层
  if (selectedIds.value.length === 0 && props.flightLineObj.isEnabled()) {
    // 可选: 禁用图层
    // props.flightLineObj.disable();
    // 或者只更新所有飞线为非高亮状态
  }
  
  flightLines.value.forEach(line => {
    updateFlightLineHighlight(line.id);
  });
};

// 更新飞线可见性
const updateVisibility = () => {
  if (!props.flightLineObj) return;
  
  flightLines.value.forEach(line => {
    props.flightLineObj.updateFlightLine(line.id, {
      visible: !isHidden(line.id)
    });
  });
};

// 刷新飞线列表数据
const refreshFlightLineList = () => {
  if (!props.flightLineObj) {
    flightLines.value = [];
    return;
  }
  
  try {
    // 获取飞线数据
    const linesMap = props.flightLineObj.getAllFlightLines();
    const linesArray: Array<FlightLineData & { id: string }> = [];
    
    // 转换为数组
    linesMap.forEach((line, id) => {
      linesArray.push({
        ...line,
        id // 确保id字段存在
      });
    });
    
    // 更新飞线数据
    flightLines.value = linesArray;
    
    // 如果未初始化过，则自动选中所有飞线
    if (!isInitialized.value && linesArray.length > 0 && !isPanelTouched.value) {
      selectAll();
      isInitialized.value = true;
    }
    
    console.log(`已刷新飞线列表，共 ${linesArray.length} 条数据`);
  } catch (error) {
    console.error('刷新飞线列表失败:', error);
  }
};

// 添加示例飞线数据
const addDemoFlightLines = () => {
  if (!props.flightLineObj) return;
  
  try {
    const cities = [
      { name: '北京', lng: 116.4, lat: 39.9 },
      { name: '上海', lng: 121.4, lat: 31.2 },
      { name: '广州', lng: 113.2, lat: 23.1 },
      { name: '成都', lng: 104.0, lat: 30.6 },
      { name: '西安', lng: 108.9, lat: 34.2 },
      { name: '武汉', lng: 114.3, lat: 30.5 },
      { name: '深圳', lng: 114.0, lat: 22.5 },
      { name: '南京', lng: 118.8, lat: 32.0 },
      { name: '重庆', lng: 106.5, lat: 29.5 },
      { name: '杭州', lng: 120.1, lat: 30.2 }
    ];
    
    const demoLines = [];
    
    // 创建示例飞线数据
    for (let i = 0; i < 8; i++) {
      const fromIndex = Math.floor(Math.random() * cities.length);
      let toIndex = Math.floor(Math.random() * cities.length);
      
      // 确保起点和终点不同
      while (toIndex === fromIndex) {
        toIndex = Math.floor(Math.random() * cities.length);
      }
      
      const from = cities[fromIndex];
      const to = cities[toIndex];
      
      demoLines.push({
        from: [from.lng, from.lat],
        to: [to.lng, to.lat],
        fromName: from.name,
        visible: false,
        toName: to.name,
        value: Math.floor(Math.random() * 1000) + 100,
        style: {
          color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`,
          width: 2 + Math.random() * 2
        }
      });
    }

    // 添加示例数据
    props.flightLineObj.addFlightLines(demoLines, true, 5);
    
    // 刷新列表
    setTimeout(() => {
      refreshFlightLineList();
    }, 200);
    
    console.log('已添加示例飞线数据');
  } catch (error) {
    console.error('添加示例飞线数据失败:', error);
  }
};

// 修复首次展示问题
const initPanel = () => {
  if (panelInitialized.value) return;
  
  // 延迟刷新数据，确保组件已完全挂载
  nextTick(() => {
    setTimeout(() => {
      refreshFlightLineList();
      panelInitialized.value = true;
    }, 300);
  });
};

// 初始化数据加载
onMounted(() => {
  // 确保初始化只执行一次
  initPanel();
  
  // 监听active属性变化
  watch(() => props.active, (active) => {
    if (active) {
      // 当面板变为活动状态时，刷新飞线列表
      initPanel();
      nextTick(() => {
        refreshFlightLineList();
      });
    }
  }, { immediate: true });
});

// 暴露方法给父组件
defineExpose({
  refreshFlightLineList,
  selectAll,
  unselectAll,
  addDemoFlightLines,
  setOptimalView
});
</script>

<style scoped>
.flight-line-panel {
  position: absolute;
  width: 320px;
  max-height: 600px;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  z-index: 1000;
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s, transform 0.3s;
  transform: translateY(-10px);
}

.flight-line-panel.active {
  opacity: 1;
  pointer-events: all;
  transform: translateY(0);
}

.flight-line-panel.collapsed {
  width: 40px !important;
  height: 40px !important;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
  background: linear-gradient(135deg, #1890ff, #096dd9);
  cursor: pointer;
  border-radius: 10px;
}

/* 位置样式 */
.flight-line-panel.position-top-left {
  top: 10px;
  left: 10px;
}
.flight-line-panel.collapsed.position-top-left {
  top: 60px !important;
}

.flight-line-panel.position-top-right {
  top: 10px;
  right: 10px;
}

.flight-line-panel.collapsed.position-top-right {
  top: 60px !important;
}

.flight-line-panel.position-bottom-left {
  bottom: 10px;
  left: 10px;
}

.flight-line-panel.position-bottom-right {
  bottom: 10px;
  right: 10px;
}

.flight-line-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #3498db;
  color: white;
  padding: 8px 12px;
  font-weight: bold;
}

.flight-line-panel.collapsed .flight-line-panel-header {
  display: none;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-count {
  font-size: 12px;
  opacity: 0.8;
  margin-right: 5px;
}

.minimize-btn {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimize-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.flight-line-panel-content {
  flex: 1;
  overflow-y: auto;
  max-height: 500px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.flight-line-stats {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  padding: 5px 0;
  border-bottom: 1px solid #eee;
}

.flight-line-toolbar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.toolbar-btn {
  padding: 4px 8px;
  font-size: 12px;
  border: 1px solid #ddd;
  background-color: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
}

.toolbar-btn:hover {
  background-color: #e0e0e0;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn-primary {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.toolbar-btn-primary:hover {
  background-color: #2980b9;
}

.flight-line-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.no-flight-lines {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: #999;
  font-size: 14px;
}
.thin-scrollbar,
.pure-scrollbar {
  scrollbar-color: var(--el-color-primary) transparent;
  /* 滑块颜色、轨道颜色 */

  /* Firefox */
  scrollbar-width: thin;

  /* 可选值为 'auto', 'thin', 'none' */
  ::-webkit-scrollbar {
    width: 6px;
    /* 滚动条宽度 */
  }

  /* 滚动条轨道 */
  ::-webkit-scrollbar-track {
    background: transparent;
    /* 轨道颜色 */
  }

  /* 滚动条滑块 */
  ::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-1);
    ;
    border-radius: 4px;
  }

  /* 滚动条滑块：hover状态 */
  ::-webkit-scrollbar-thumb:hover {
    background: var(--el-color-primary);
    /* 滑块hover颜色 */
  }
}
.flight-line-item {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s;
}

.flight-line-item:hover {
  border-color: #3498db;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.flight-line-item.flight-line-selected {
  border-color: #1890ff;
  background-color: rgba(24, 144, 255, 0.05);
}

.flight-line-item.flight-line-hidden {
  opacity: 0.5;
}

.flight-line-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  font-size: 12px;
  color: #666;
}

.flight-line-route {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
}

.flight-line-arrow {
  color: #3498db;
  font-weight: bold;
}

/* 最小化后的样式，参考轨迹播放器的实现 */
.track-player-minimized {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  font-size: 18px;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  /* border-radius: 50%; */
  transition: transform 0.3s;
}

.track-player-minimized:hover {
  transform: scale(1.05);
}

.minimized-restore-icon {
  font-size: 20px;
  font-weight: bold;
}
</style> 