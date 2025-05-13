/**
 * 飞线图面板组件
 * @description 显示飞线图数据列表，支持单选
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
        <span class="panel-selected" v-if="!collapsed && selectedId">
          <span class="selected-indicator"></span>
          已选中
        </span>
        <button class="minimize-btn" @click.stop="toggleCollapse" title="最小化/展开面板">
          <span v-if="collapsed">+</span>
          <span v-else>-</span>
        </button>
      </div>
    </div>
    <div class="flight-line-panel-content" v-if="!collapsed">
      <div class="flight-line-stats">
        <span>总数: {{ flightLineCount }}</span>
        <span>显示: {{ visibleFlightLineCount }}</span>
        <span>选中: {{ selectedCount }}</span>
      </div>
      <div class="flight-line-toolbar">
        <button class="toolbar-btn" :disabled="!selectedId" @click.stop="clearSelection">
          全部显示
        </button>
        <button class="toolbar-btn" :disabled="!selectedId" @click.stop="hideSelected">
          {{ hideMode ? '显示' : '隐藏' }}选中
        </button>
        <button class="toolbar-btn" :class="{'toolbar-btn-active': showOnlyVisible}" @click.stop="showOnlyVisible = !showOnlyVisible" title="切换是否只显示可见飞线">
          {{ showOnlyVisible ? '仅显示可见飞线' : '显示全部飞线' }}
        </button>
        <button class="toolbar-btn toolbar-btn-primary" @click.stop="setOptimalView" title="调整到最佳视角">
          最佳视角
        </button>
        <button class="toolbar-btn" @click.stop="addDemoFlightLines" title="添加演示数据">
          添加演示数据
        </button>
        <button class="toolbar-btn" @click.stop="forceRefreshList" title="强制刷新列表">
          刷新列表
        </button>
      </div>

      <!-- 添加性能相关设置 -->
      <div class="performance-settings">
        <div class="performance-option">
          <input type="checkbox" id="performanceMode" v-model="performanceMode" @change="updatePerformanceMode">
          <label for="performanceMode">性能模式 (移动/缩放时隐藏飞线)</label>
        </div>

        <div class="performance-option">
          <input type="checkbox" id="forcedPrecomposeRerenderMode" v-model="forcedPrecomposeRerenderMode"
            @change="updateForcedPrecomposeRerenderMode">
          <label for="forcedPrecomposeRerenderMode">强制重渲染 (强制重渲染)</label>
        </div>

        <div class="performance-option">
          <input type="checkbox" id="glRenderMode" v-model="glRenderMode" @change="updateGLRenderMode">
          <label for="glRenderMode">3D渲染 (提高帧率)</label>
          <div v-if="!glModeAvailable" class="gl-mode-notice">
            暂不支持
          </div>
        </div>
      </div>
      <div class="flight-line-list thin-scrollbar">
        <div v-if="flightLines.length === 0" class="no-flight-lines">
          暂无飞线数据
          <div class="diagnose-info">
            请点击"添加演示数据"或"刷新列表"按钮
          </div>
        </div>
        <div v-else-if="filteredFlightLines.length === 0 && showOnlyVisible" class="no-flight-lines">
          没有可见的飞线
          <div class="diagnose-info">
            请点击"显示全部"按钮查看所有飞线，或选择一条飞线使其可见
          </div>
        </div>
        <div v-if="flightLines.length === 0" class="empty-list-debug">
          <div class="debug-panel">
            <h4>调试信息</h4>
            <p>flightLineObj存在: {{ !!props.flightLineObj }}</p>
            <p>面板激活状态: {{ props.active }}</p>
            <p>面板初始化状态: {{ panelInitialized }}</p>
          </div>
        </div>
        <div v-if="filteredFlightLines.length > 0 && !selectedId" class="initial-tip">
          <i class="initial-tip-icon">☝️</i>
          <span class="initial-tip-text">点击列表项可以在地图上显示对应飞线</span>
        </div>
        <div 
          v-for="line in filteredFlightLines" 
          :key="line.id" 
          class="flight-line-item"
          :class="{
            'flight-line-item-active': line.id === selectedId,
            'flight-line-item-hidden': !line.visible
          }" 
          @click="selectFlightLine(line.id)"
        >
          <div class="flight-line-content">
            <div class="flight-line-title">{{ line.fromName }} → {{ line.toName }}</div>
            <div class="flight-line-details">
              <span class="flight-line-id">ID: {{ line.id.slice(0, 8) }}...</span>
              <span class="flight-line-value" v-if="line.value">值: {{ line.value }}</span>
          </div>
          </div>
          <div v-if="line.id === selectedId" class="flight-line-active-badge">
            激活
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
import { ElButton, ElTooltip, ElSlider, ElPopover } from 'element-plus';

const props = defineProps<{
  flightLineObj: any;
  active: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}>();

const emit = defineEmits<{
  (e: 'collapse-change', collapsed: boolean): void;
  (e: 'selection-change', selectedId: string | null): void;
}>();

// 状态
const collapsed = ref(false);
const flightLines = ref<Array<FlightLineData & { id: string }>>([]);
const selectedId = ref<string | null>(null);
const hiddenIds = ref<Array<string>>([]);
const hideMode = ref(false);
const isInitialized = ref(false);
const isPanelTouched = ref(false);
const panelInitialized = ref(false);
// 是否只显示可见飞线 - 默认为false，即显示所有飞线，包括不可见的
const showOnlyVisible = ref(false);

// 性能模式
const performanceMode = ref(false);

// 强制重渲染
const forcedPrecomposeRerenderMode = ref(true);
// GL渲染模式
const glRenderMode = ref(false);
// GL模式是否可用
const glModeAvailable = ref(false);

// 图标选择
const selectedIcon = ref('plane');
const customIconPath = ref('');
const iconSize = ref(15);

// 图标路径定义
const iconPaths = {
  plane: 'M1705.06,1318.313v-89.254l-319.9-221.799l0.073-208.063c0.521-84.662-26.629-121.796-63.961-121.491c-37.332-0.305-64.482,36.829-63.961,121.491l0.073,208.063l-319.9,221.799v89.254l330.343-157.288l12.238,241.308l-134.449,92.931l0.531,42.034l175.125-42.917l175.125,42.917l0.531-42.034l-134.449-92.931l12.238-241.308L1705.06,1318.313z',
  arrow: 'M30,10 L5,25 L30,40 L40,30 L25,25 L40,20 L30,10 z',
  triangle: 'M16,0 L32,32 L0,32 L16,0 z',
  circle: 'M16,0 C7.16,0 0,7.16 0,16 C0,24.84 7.16,32 16,32 C24.84,32 32,24.84 32,16 C32,7.16 24.84,0 16,0 Z',
  pin: 'M16,0 C7.16,0 0,7.16 0,16 C0,24.84 7.16,32 16,32 C24.84,32 32,24.84 32,16 C32,7.16 24.84,0 16,0 Z M16,5 C21.15,5 25.33,9.18 25.33,14.33 C25.33,19.48 21.15,23.67 16,23.67 C10.85,23.67 6.67,19.48 6.67,14.33 C6.67,9.18 10.85,5 16,5 Z'
};

// 飞线图标预览动画
const previewTransform = computed(() => {
  return 'translateX(' + Math.sin(Date.now() / 600) * 10 + 'px)';
});

// 计算属性
const selectedCount = computed(() => selectedId.value ? 1 : 0);
const position = computed(() => props.position || 'top-right'); // 默认右上角，使用props传入的值
const flightLineCount = computed(() => flightLines.value.length);
// 只显示可见的飞线（visible为true）或被选中的飞线
const filteredFlightLines = computed(() => {
  if (showOnlyVisible.value) {
    return flightLines.value.filter(line => line.visible !== false);
  }
  return flightLines.value;
});
// 可见飞线数量
const visibleFlightLineCount = computed(() => 
  flightLines.value.filter(line => line.visible !== false).length
);

// 调试用：列出飞线数据
const dumpFlightLines = () => {
  console.log('当前飞线列表数据:');
  flightLines.value.forEach((line, index) => {
    console.log(`[${index}] ID: ${line.id}, 名称: ${line.fromName} → ${line.toName}, 可见: ${line.visible}`);
  });
};

// 强制刷新列表按钮
const forceRefreshList = () => {
  console.log('强制刷新飞线列表');
  refreshFlightLineList();
  nextTick(() => {
    dumpFlightLines();
  });
};

// 刷新飞线列表数据
const refreshFlightLineList = () => {
  if (!props.flightLineObj) {
    console.warn('无法刷新飞线列表，飞线图对象不存在');
    return;
  }
  
  // 获取所有飞线数据
  const allFlightLines = props.flightLineObj.getAllFlightLines();
  if (!allFlightLines) {
    flightLines.value = [];
    selectedId.value = null;
    return;
  }
  
  // 转换Map为数组
  const linesArray: Array<FlightLineData & { id: string }> = [];
  allFlightLines.forEach((line, id) => {
    linesArray.push({
      ...line,
      id
    });
  });
  
  // 按创建时间排序，新的在前面
  linesArray.sort((a, b) => {
    const timeA = a._createTime || 0;
    const timeB = b._createTime || 0;
    return timeB - timeA;
  });
  
  // 更新飞线列表
  flightLines.value = linesArray;
  
  // 获取当前活跃的飞线ID，但不自动选中
  const activeId = props.flightLineObj.getActiveFlightLine();
  
  // 只有当存在活跃飞线ID时才更新选中状态
  if (activeId) {
    selectedId.value = activeId;
    console.log(`刷新飞线列表，当前活跃飞线ID: ${activeId}`);
  } else {
    // 当没有活跃飞线时，确保selectedId为null
    selectedId.value = null;
    console.log('刷新飞线列表，当前没有活跃飞线');
    
    // 确保地图上没有显示任何飞线
    if (props.flightLineObj.isEnabled()) {
      props.flightLineObj.clearFlightLines();
    }
  }
};

// 缩短ID显示
const shortId = (id: string) => {
  if (!id) return '无ID';
  return typeof id === 'string' ? id.slice(-8) : String(id);
};

// 检查是否选中
const isSelected = (id: string) => {
  return selectedId.value === id;
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

// 选择飞线
const selectFlightLine = (id: string) => {
  if (!props.flightLineObj) return;
  
  // 如果点击的是当前选中的飞线，则取消选择并清空图层
  if (selectedId.value === id) {
    // 调用clearSelection方法完全清空图层
    clearSelection();
    return;
  }
  
  // 记录选中的飞线ID
  selectedId.value = id;
  emit('selection-change', id);
  
  // 调用API只显示选中的飞线
  props.flightLineObj.showOnlyFlightLine(id);
};

// 清除选择并清空图层
const clearSelection = () => {
  if (!props.flightLineObj) return;
  
  // 清除选中状态
  selectedId.value = null;
  emit('selection-change', null);
  
  // 调用API清空飞线图层
  clearFlightLineLayer(); // 使用更彻底的清空方法
  
  // 确保UI状态更新
  nextTick(() => {
    refreshFlightLineList();
  });
};

// 清空飞线图层
const clearFlightLineLayer = () => {
  if (!props.flightLineObj) return;
  
  // 调用API清空飞线图层
  props.flightLineObj.clearFlightLines();
  
  // 再次尝试强制清空echarts图层
  try {
    if (props.flightLineObj.echartsLayer) {
      props.flightLineObj.echartsLayer.setChartOptions({
        animation: false,
        backgroundColor: 'transparent',
        tooltip: {},
        series: [] // 完全空的系列
      });
      
      // 强制重绘
      props.flightLineObj.echartsLayer.redraw();
      
      // 延迟再次确认清除
      setTimeout(() => {
        if (props.flightLineObj && props.flightLineObj.echartsLayer) {
          props.flightLineObj.echartsLayer.setChartOptions({
            series: []
          });
          
          props.flightLineObj.echartsLayer.redraw();
        }
      }, 50);
    }
  } catch (error) {
    console.error('强制清空图层失败:', error);
  }
  
  console.log('已清空飞线图层');
};

// 隐藏/显示选中的飞线
const hideSelected = () => {
  if (!selectedId.value) return;
  
  // 切换hideMode
  hideMode.value = !hideMode.value;
  
  if (hideMode.value) {
    // 隐藏选中的飞线
    if (!hiddenIds.value.includes(selectedId.value)) {
      hiddenIds.value.push(selectedId.value);
    }
  } else {
    // 显示选中的飞线
    const index = hiddenIds.value.indexOf(selectedId.value);
    if (index !== -1) {
      hiddenIds.value.splice(index, 1);
    }
  }
  
  // 标记面板已被用户触摸
  isPanelTouched.value = true;
  
  // 更新飞线显示状态
  updateVisibility();
};

// 设置最佳视角
const setOptimalView = () => {
  if (!props.flightLineObj) {
    console.error('无法设置最佳视角：flightLineObj不可用');
    return;
  }
  
  try {
    console.log('正在设置飞线图最佳视角...');
    
    // 确保飞线图已启用
    if (!props.flightLineObj.isEnabled()) {
      console.log('飞线图未启用，正在启用...');
      props.flightLineObj.enable().then(() => {
        // 启用后再设置最佳视角
        console.log('飞线图已启用，设置最佳视角');
        props.flightLineObj.setOptimalView(5);
      }).catch(err => {
        console.error('启用飞线图失败:', err);
      });
    } else {
      // 已启用，直接设置最佳视角
      props.flightLineObj.setOptimalView(5);
      console.log('已设置飞线图最佳视角');
    }
  } catch (error) {
    console.error('设置最佳视角时发生错误:', error);
  }
};

// 为指定飞线设置最佳视角
const setOptimalViewForLine = (id: string) => {
  if (!props.flightLineObj) return;
  
  try {
    // 获取选中的飞线数据
    const line = flightLines.value.find(l => l.id === id);
    if (!line) return;
    
    // 使用飞线对象的setOptimalView方法设置最佳视角
    // 飞线的对象已经知道如何处理这个飞线的视角
    props.flightLineObj.setOptimalView(6); // 使用6作为缩放级别
    
    console.log(`已设置飞线 ${id} 的最佳视角`);
  } catch (error) {
    console.error(`设置飞线 ${id} 最佳视角失败:`, error);
  }
};

// 更新单个飞线高亮状态
const updateFlightLineHighlight = (id: string) => {
  if (!props.flightLineObj) return;
  
  try {
    const selected = selectedId.value === id;
    
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
        color: '#1890ff' // 蓝色高亮
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
  if (!props.flightLineObj.isEnabled() && selectedId.value) {
    props.flightLineObj.enable().catch(err => {
      console.error('启用飞线图失败:', err);
    });
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

// 显示单个飞线
const showFlightLine = (id: string) => {
  if (!props.flightLineObj) return;
  
  try {
    // 从隐藏列表中移除
    const index = hiddenIds.value.indexOf(id);
    if (index !== -1) {
      hiddenIds.value.splice(index, 1);
    }
    
    // 更新飞线可见性
      props.flightLineObj.updateFlightLine(id, {
      visible: true
    });
    
    // 更新本地状态
    const lineIndex = flightLines.value.findIndex(l => l.id === id);
    if (lineIndex !== -1) {
      flightLines.value[lineIndex].visible = true;
    }
    
    console.log(`已显示飞线: ${id}`);
  } catch (error) {
    console.error(`显示飞线 ${id} 失败:`, error);
  }
};

// 隐藏单个飞线
const hideFlightLine = (id: string) => {
  if (!props.flightLineObj) return;
  
  try {
    // 添加到隐藏列表
    if (!hiddenIds.value.includes(id)) {
      hiddenIds.value.push(id);
    }
    
    // 更新飞线可见性
        props.flightLineObj.updateFlightLine(id, {
      visible: false
    });
    
    // 更新本地状态
    const lineIndex = flightLines.value.findIndex(l => l.id === id);
    if (lineIndex !== -1) {
      flightLines.value[lineIndex].visible = false;
    }
    
    console.log(`已隐藏飞线: ${id}`);
  } catch (error) {
    console.error(`隐藏飞线 ${id} 失败:`, error);
  }
};

// 添加示例飞线数据
const addDemoFlightLines = () => {
  if (!props.flightLineObj) {
    console.error('添加演示数据失败：flightLineObj不存在');
    return;
  }
  
  try {
    console.log('开始添加演示飞线数据');
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
        visible: false, // 默认不可见，只有在选中时才会显示
        toName: to.name,
        value: Math.floor(Math.random() * 1000) + 100,
        style: {
          color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`,
          width: 2 + Math.random() * 2
        }
      });
    }

    console.log('准备添加演示数据:', demoLines);
    
    // 添加示例数据
    const ids = props.flightLineObj.addFlightLines(demoLines, false, 5);
    console.log('添加演示数据完成，返回的ID:', ids);
    
    // 刷新列表
    console.log('开始延迟刷新列表');
    setTimeout(() => {
      console.log('执行刷新列表');
      refreshFlightLineList();
    }, 200);
    
    console.log('已添加示例飞线数据，默认不可见，需要选择才能显示');
  } catch (error) {
    console.error('添加示例飞线数据失败:', error);
  }
};

// 加载并确保数据显示
const loadAndEnsureData = () => {
  console.log('执行loadAndEnsureData，确保面板有数据显示');
  
  // 首先尝试刷新飞线列表
  refreshFlightLineList();
  
  // 设置延迟检查，如果刷新后仍然没有数据，则加载样例数据
  setTimeout(() => {
    if (flightLines.value.length === 0) {
      console.log('刷新后列表仍为空，显示样例数据');
      showSampleData();
      
      // 再次延迟检查，确保UI已更新
      setTimeout(() => {
        if (flightLines.value.length > 0 && !selectedId.value && !isPanelTouched.value) {
          console.log('已加载样例数据，自动选中第一条');
          selectFlightLine(flightLines.value[0].id);
        }
      }, 100);
    } else if (!selectedId.value && !isPanelTouched.value) {
      // 有数据但没有选中项且用户未交互，则自动选中第一条
      console.log('列表已有数据，自动选中第一条');
      selectFlightLine(flightLines.value[0].id);
    }
  }, 300);
};

// 初始化面板
const initPanel = () => {
  console.log('初始化面板，panelInitialized =', panelInitialized.value);
  
  if (panelInitialized.value) {
    console.log('面板已初始化，跳过');
    return;
  }
  
  // 延迟加载数据，确保组件已完全挂载
  nextTick(() => {
    console.log('nextTick执行，开始延迟加载数据');
    setTimeout(() => {
      loadAndEnsureData();
      panelInitialized.value = true;
    }, 300);
  });
};

// 更新性能模式
const updatePerformanceMode = () => {
  if (!props.flightLineObj) return;
  
  try {
    // 更新飞线图对象的性能配置
    props.flightLineObj.setConfig({
      enablePerformanceMode: performanceMode.value,
      hideOnMoving: performanceMode.value,
      hideOnZooming: performanceMode.value,
      forcedPrecomposeRerender: forcedPrecomposeRerenderMode.value
    });
    
    console.log(`飞线图性能模式已${performanceMode.value ? '启用' : '禁用'}`);
  } catch (error) {
    console.error('更新性能模式设置失败:', error);
  }
};

const updateForcedPrecomposeRerenderMode = () => {
  if (!props.flightLineObj) return;
  
  props.flightLineObj.setConfig({
    forcedPrecomposeRerender: forcedPrecomposeRerenderMode.value
  });
};

// 更新GL渲染模式
const updateGLRenderMode = () => {
  if (!props.flightLineObj) return;
  
  try {
    // 检查是否可以使用GL模式
    checkGLModeAvailable().then(available => {
      if (!available && glRenderMode.value) {
        console.warn('echarts-gl未安装，无法使用GL渲染模式');
        glRenderMode.value = false;
      }
      
      // 更新飞线图对象的GL渲染模式
      props.flightLineObj.setConfig({
        useGLMode: glRenderMode.value && available
      });
      
      console.log(`飞线图GL渲染模式已${(glRenderMode.value && available) ? '启用' : '禁用'}`);
    });
  } catch (error) {
    console.error('更新GL渲染模式设置失败:', error);
  }
};

// 检查GL模式是否可用
const checkGLModeAvailable = async (): Promise<boolean> => {
  try {
    // 尝试动态导入echarts-gl，如果成功则可用
    await import('echarts-gl');
    glModeAvailable.value = true;
    return true;
  } catch (error) {
    glModeAvailable.value = false;
    return false;
  }
};

// 更新飞线图标
const updateFlightLineIcon = () => {
  if (!props.flightLineObj) return;
  
  try {
    // 更新飞线图对象的图标配置
    props.flightLineObj.setConfig({
      effectSymbol: selectedIcon.value === 'circle' ? 'circle' : 'path',
      effectSymbolPath: currentIconPath.value
    });
    
    console.log(`飞线图图标已更新为: ${selectedIcon.value}`);
  } catch (error) {
    console.error('更新飞线图图标失败:', error);
  }
};

// 更新图标大小
const updateIconSize = () => {
  if (!props.flightLineObj) return;
  
  try {
    // 更新飞线图对象的图标大小配置
    props.flightLineObj.setConfig({
      effectSymbolSize: iconSize.value
    });
    
    console.log(`飞线图图标大小已更新为: ${iconSize.value}`);
  } catch (error) {
    console.error('更新飞线图图标大小失败:', error);
  }
};

// 在script setup部分添加新的变量和方法
const tempSelectedIcon = ref<string>('plane');
const tempIconSize = ref<number>(5);

// 获取指定飞线的图标类型
const getLineIcon = (id) => {
  const line = flightLines.value.find(l => l.id === id);
  if (line && line.effectSymbol) {
    return line.effectSymbol;
  }
  return selectedIcon.value; // 默认使用全局设置
};

// 获取指定飞线的图标大小
const getLineIconSize = (id) => {
  const line = flightLines.value.find(l => l.id === id);
  if (line && line.effectSymbolSize !== undefined) {
    return line.effectSymbolSize;
  }
  return iconSize.value; // 默认使用全局设置
};

// 应用图标更改到特定飞线
const applyIconChanges = (id, icon, size) => {
  if (!props.flightLineObj) return;
  
  try {
    // 查找对应的飞线
    const line = flightLines.value.find(l => l.id === id);
    if (!line) return;
    
    // 获取图标路径
    let symbolPath = null;
    if (icon in iconPaths) {
      symbolPath = `path://${iconPaths[icon]}`;
    }
    
    // 更新飞线数据
    props.flightLineObj.updateFlightLine(id, {
      custom: {
        effectSymbol: icon,
        effectSymbolPath: symbolPath,
        effectSymbolSize: size
      }
    });
    
    // 更新本地数据
    line.effectSymbol = icon;
    line.effectSymbolPath = symbolPath;
    line.effectSymbolSize = size;
    
    console.log(`已为飞线 ${id} 设置自定义图标: ${icon}, 大小: ${size}`);
    
    // 刷新列表视图
    refreshFlightLineList();
  } catch (error) {
    console.error('为飞线设置自定义图标失败:', error);
  }
};

// 切换飞线可见性
const toggleLineVisibility = (id) => {
  const line = flightLines.value.find(l => l.id === id);
  if (!line) return;
  
  const newVisibility = !line.visible;
  
  // 如果当前飞线是选中状态且要隐藏它，则先取消选择
  if (selectedId.value === id && !newVisibility) {
    // 先清除选择
    clearSelection();
    // 然后隐藏这条飞线
    hideFlightLine(id);
    return;
  }
  
  // 如果当前有选中的飞线且不是当前飞线，则不改变其它飞线的可见性状态
  if (selectedId.value && selectedId.value !== id) {
    if (newVisibility) {
      // 如果要显示这条飞线，需要先取消选择再显示所有飞线，然后重新选择之前选中的飞线
      const prevSelectedId = selectedId.value;
      clearSelection();
      showFlightLine(id);
      selectFlightLine(prevSelectedId);
    } else {
      // 如果要隐藏，但它本来就隐藏了（因为不是当前选中的飞线），则将其添加到hiddenIds中
      if (!hiddenIds.value.includes(id)) {
        hiddenIds.value.push(id);
      }
    }
    return;
  }
  
  // 常规切换可见性
  if (newVisibility) {
    showFlightLine(id);
  } else {
    hideFlightLine(id);
  }
  
  // 更新本地状态
  const lineIndex = flightLines.value.findIndex(l => l.id === id);
  if (lineIndex !== -1) {
    flightLines.value[lineIndex].visible = newVisibility;
  }
};

// 获取飞线的图标路径
const getSymbolPathForLine = (line) => {
  if (line.effectSymbolPath && line.effectSymbolPath.startsWith('path://')) {
    return line.effectSymbolPath.substring(7); // 移除'path://'前缀
  }
  
  if (line.effectSymbol && line.effectSymbol in iconPaths) {
    return iconPaths[line.effectSymbol];
  }
  
  // 默认使用当前选择的图标
  return getIconPreviewPath(selectedIcon.value);
};

// 获取当前选中图标的路径
const currentIconPath = computed(() => {
  if (tempSelectedIcon.value in iconPaths) {
    return `path://${iconPaths[tempSelectedIcon.value]}`;
  }
  return `path://${iconPaths.plane}`;
});

// 获取图标预览路径
const getIconPreviewPath = (icon) => {
  if (icon in iconPaths) {
    return iconPaths[icon];
  }
  return iconPaths.circle;
};

// 更新updateFlightLine方法以支持自定义配置
const updateFlightLine = (id, options) => {
  if (!props.flightLineObj) return false;
  
  try {
    // 更新飞线配置
    const result = props.flightLineObj.updateFlightLine(id, options);
    
    // 如果成功且有自定义设置，更新本地数据
    if (result && options.custom) {
      const line = flightLines.value.find(l => l.id === id);
      if (line) {
        if (options.custom.effectSymbol !== undefined) {
          line.effectSymbol = options.custom.effectSymbol;
        }
        if (options.custom.effectSymbolPath !== undefined) {
          line.effectSymbolPath = options.custom.effectSymbolPath;
        }
        if (options.custom.effectSymbolSize !== undefined) {
          line.effectSymbolSize = options.custom.effectSymbolSize;
        }
      }
    }
    
    return result;
  } catch (error) {
    console.error(`更新飞线 ${id} 失败:`, error);
    return false;
  }
};

// 强制显示样例数据，不依赖flightLineObj
const showSampleData = () => {
  console.log('强制显示样例数据');
  
  const sampleData = [
    {
      id: 'sample-1',
      fromName: '北京',
      toName: '上海',
      coords: [[116.4, 39.9], [121.5, 31.2]],
      visible: false, // 默认不可见，只有在选中时才会显示
      highlight: false,
      _createTime: Date.now() - 100000
    },
    {
      id: 'sample-2',
      fromName: '广州',
      toName: '深圳',
      coords: [[113.3, 23.1], [114.1, 22.5]],
      visible: false, // 默认不可见
      highlight: false,
      _createTime: Date.now() - 90000
    },
    {
      id: 'sample-3',
      fromName: '成都',
      toName: '重庆',
      coords: [[104.1, 30.7], [106.5, 29.5]],
      visible: false, // 默认不可见
      highlight: false,
      _createTime: Date.now() - 80000
    },
    {
      id: 'sample-4',
      fromName: '西安',
      toName: '武汉',
      coords: [[108.9, 34.3], [114.3, 30.6]],
      visible: false, // 默认不可见
      highlight: false,
      _createTime: Date.now() - 70000
    },
    {
      id: 'sample-5',
      fromName: '杭州',
      toName: '南京',
      coords: [[120.2, 30.3], [118.8, 32.0]],
      visible: false, // 默认不可见
      highlight: false,
      _createTime: Date.now() - 60000
    }
  ];
  
  // 直接设置数据
  flightLines.value = sampleData;
  console.log('设置了样例数据，飞线数量:', flightLines.value.length);
  console.log('样例数据默认不可见，需要选择才会在地图上显示');
};

// 初始化数据加载
onMounted(() => {
  console.log('FlightLinePanel组件挂载');
  
  // 确保初始化只执行一次
  initPanel();
  
  // 检查GL模式是否可用
  checkGLModeAvailable().then(available => {
    glModeAvailable.value = available;
    glRenderMode.value = available; // 如果可用则默认启用
  });
  
  // 初始应用性能模式和GL渲染模式设置
  nextTick(() => {
    if (props.flightLineObj) {
      updatePerformanceMode();
      updateGLRenderMode();
      updateFlightLineIcon(); // 初始应用图标设置
    }
  });
  
  // 监听active属性变化
  watch(() => props.active, (active) => {
    console.log('面板active状态变更:', active);
    if (active) {
      // 当面板变为活动状态时，加载数据
      nextTick(() => {
        console.log('面板激活，加载数据');
        loadAndEnsureData();
      });
    }
  }, { immediate: true });
});

// 暴露方法给父组件
defineExpose({
  refreshFlightLineList,
  selectFlightLine,
  clearSelection,
  addDemoFlightLines,
  setOptimalView,
  showFlightLine,
  hideFlightLine,
  updateFlightLine,
  showSampleData,
  loadAndEnsureData, // 暴露新方法
  clearFlightLineLayer // 暴露清空图层方法
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

.panel-selected {
  font-size: 12px;
  opacity: 0.8;
  margin-right: 5px;
}

.selected-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #1890ff;
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

.flight-line-note {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.note-icon {
  font-size: 16px;
  color: #1890ff;
}

.note-text {
  font-size: 12px;
  line-height: 1.5;
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

.toolbar-btn-active {
  background-color: #e6f7ff;
  border-color: #1890ff;
  color: #1890ff;
}

.toolbar-btn-primary {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.toolbar-btn-primary:hover {
  background-color: #2980b9;
}

.toolbar-btn-info {
  background-color: #3498db;
  color: white;
  border-color: #2980b9;
}

.toolbar-btn-info:hover {
  background-color: #2980b9;
}

.toolbar-btn-highlight {
  position: relative;
  animation: pulse 2s infinite;
  box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  }
  50% {
    box-shadow: 0 0 10px rgba(24, 144, 255, 0.8);
  }
  100% {
    box-shadow: 0 0 5px rgba(24, 144, 255, 0.5);
  }
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

.initial-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin: 10px 0;
  padding: 10px;
  background-color: #f0f8ff;
  border-left: 3px solid #1890ff;
  border-radius: 4px;
}

.initial-tip-icon {
  font-size: 16px;
  color: #1890ff;
}

.initial-tip-text {
  font-size: 12px;
  line-height: 1.5;
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
  position: relative;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flight-line-item:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.flight-line-item-active {
  border: 2px solid #1677ff;
  background-color: #e6f7ff;
}

.flight-line-content {
  flex: 1;
}

.flight-line-title {
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 14px;
  color: #333;
}

.flight-line-details {
  display: flex;
  font-size: 12px;
  color: #666;
  gap: 10px;
}

.flight-line-active-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  padding: 2px 8px;
  background-color: #1677ff;
  color: #fff;
  border-radius: 10px;
  font-size: 12px;
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

/* 性能设置 */
.performance-settings {
  margin: 8px 0;
  padding: 8px 0;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.performance-option {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.performance-option input[type="checkbox"] {
  margin: 0;
}

/* GL模式提示 */
.gl-mode-notice {
  font-size: 11px;
  color: #ff6a00;
  margin-top: 4px;
  line-height: 1.2;
}

.gl-mode-notice code {
  background-color: #f5f5f5;
  padding: 2px 4px;
  border-radius: 3px;
  font-family: monospace;
}

/* 图标设置 */
.icon-settings {
  margin-top: 10px;
  border-top: 1px solid #eee;
  padding-top: 10px;
  font-size: 12px;
}

.section-title {
  font-weight: bold;
  margin-bottom: 8px;
  color: #666;
}

.icon-option {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.icon-option label {
  width: 80px;
  flex-shrink: 0;
}

.icon-option select {
  flex: 1;
  padding: 4px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.custom-icon {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.custom-icon label {
  display: block;
  margin-bottom: 4px;
}

.custom-icon textarea {
  resize: vertical;
  width: 100%;
  height: 60px;
  padding: 4px;
  font-family: monospace;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.icon-preview {
  display: flex;
  align-items: center;
  margin-top: 4px;
}

.icon-preview-title {
  width: 80px;
  flex-shrink: 0;
}

.icon-preview-container {
  width: 50px;
  height: 50px;
  border: 1px dashed #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
}

.icon-preview img {
  max-width: 100%;
  max-height: 100%;
}

.icon-preview-error {
  font-size: 10px;
  color: #ff6a00;
}

.icon-size {
  display: flex;
  align-items: center;
  margin-top: 8px;
  gap: 8px;
}

.icon-size label {
  width: 80px;
  flex-shrink: 0;
}

.icon-size input {
  flex: 1;
}

.icon-size span {
  width: 30px;
  text-align: center;
}

.line-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.line-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  font-size: 12px;
  padding: 4px;
  height: 24px;
  width: 24px;
}

.current-icon-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.current-icon-preview svg {
  transform: scale(1.2);
}

.flight-icon-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
}

.flight-icon-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 10px;
  height: 60px;
  transition: transform 0.3s;
}

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.icon-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.icon-option {
  width: 36px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  cursor: pointer;
  transition: background-color 0.2s;
}

.icon-option:hover {
  background-color: #e6f7ff;
}

.icon-option.selected {
  background-color: #1677ff;
}

.icon-option.selected svg path {
  fill: white;
}

.icon-size-slider {
  margin-top: 10px;
}

.line-style {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.style-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.style-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}

.style-label {
  font-size: 11px;
}

.line-info {
  display: flex;
  flex-direction: column;
  margin-top: 6px;
  font-size: 12px;
}

.line-detail {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 2px;
}

.detail-label {
  font-weight: bold;
  color: #666;
  width: 40px;
}

.detail-value {
  color: #333;
}

.selection-tip {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
}

.selection-tip-icon {
  font-size: 16px;
  color: #1890ff;
}

.selection-tip-text {
  font-size: 12px;
  line-height: 1.5;
}

.empty-list-debug {
  margin: 15px 0;
}

.debug-panel {
  background-color: #f8f8f8;
  border: 1px dashed #ccc;
  padding: 10px;
  border-radius: 4px;
  font-size: 12px;
}

.debug-panel h4 {
  margin: 0 0 8px 0;
  color: #666;
}

.debug-panel p {
  margin: 3px 0;
  color: #333;
}

.diagnose-info {
  font-size: 12px;
  color: #ff6a00;
  margin-top: 8px;
}
</style> 