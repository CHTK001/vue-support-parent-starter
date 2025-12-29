<template>
  <div
    ref="waterfallContainer"
    class="waterfall-view-container thin-scrollbar"
    :class="{
      'flex justify-center items-center': !currentDataList || currentDataList.length === 0
    }"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- 空状态 -->
    <template v-if="!currentDataList || currentDataList.length === 0">
      <slot name="empty">
        <el-empty :description="emptyText" :image-size="100" />
      </slot>
    </template>

    <!-- 瀑布流布局容器 -->
    <template v-else>
      <!-- 经典瀑布流/虚拟滚动模式 -->
      <div v-if="layoutMode === 'waterfall'" class="waterfall-scroll-container" :style="{ height: `${totalHeight}px`, position: 'relative' }">
        <div
          v-for="item in visibleItems"
          :key="item.key"
          class="waterfall-item"
          :style="item.style"
          @contextmenu="handleContextMenu($event, item.data)"
          @click="onRowClick(item.data)"
        >
          <div v-if="showIndex" class="waterfall-index-badge">{{ item.index + 1 }}</div>
          <slot :row="item.data" :index="item.index" />
        </div>
      </div>

      <!-- Flex 瀑布流模式 -->
      <div v-else-if="layoutMode === 'flex'" class="waterfall-flex-container" :style="flexContainerStyle">
        <div
          v-for="(row, index) in currentDataList"
          :key="rowKey ? row[rowKey] : index"
          class="waterfall-flex-item"
          :style="flexItemStyle"
          @contextmenu="handleContextMenu($event, row)"
          @click="onRowClick(row)"
        >
          <div v-if="showIndex" class="waterfall-index-badge">{{ index + 1 }}</div>
          <slot :row="row" :index="index" />
        </div>
      </div>

      <!-- CSS Masonry 模式 -->
      <div v-else class="waterfall-masonry-container" :style="masonryContainerStyle">
        <div
          v-for="(row, index) in currentDataList"
          :key="rowKey ? row[rowKey] : index"
          class="waterfall-masonry-item"
          @contextmenu="handleContextMenu($event, row)"
          @click="onRowClick(row)"
        >
          <div v-if="showIndex" class="waterfall-index-badge">{{ index + 1 }}</div>
          <slot :row="row" :index="index" />
        </div>
      </div>
    </template>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <el-icon class="is-loading">
        <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <path
            fill="currentColor"
            d="M512 64a32 32 0 0 1 32 32v192a32 32 0 0 1-64 0V96a32 32 0 0 1 32-32zm0 640a32 32 0 0 1 32 32v192a32 32 0 1 1-64 0V736a32 32 0 0 1 32-32zm448-192a32 32 0 0 1-32 32H736a32 32 0 1 1 0-64h192a32 32 0 0 1 32 32zm-640 0a32 32 0 0 1-32 32H96a32 32 0 0 1 0-64h192a32 32 0 0 1 32 32zM195.2 195.2a32 32 0 0 1 45.248 0L376.32 331.008a32 32 0 0 1-45.248 45.248L195.2 240.448a32 32 0 0 1 0-45.248zm452.544 452.544a32 32 0 0 1 45.248 0L828.8 783.552a32 32 0 0 1-45.248 45.248L647.744 692.992a32 32 0 0 1 0-45.248zM828.8 195.264a32 32 0 0 1 0 45.184L692.992 376.32a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0zm-452.544 452.48a32 32 0 0 1 0 45.248L240.448 828.8a32 32 0 0 1-45.248-45.248l135.808-135.808a32 32 0 0 1 45.248 0z"
          />
        </svg>
      </el-icon>
      <span>加载中...</span>
    </div>

    <!-- 底部加载更多 -->
    <div v-if="hasMoreData && !loading" class="load-more-trigger" ref="loadMoreTrigger">
      <span>加载更多...</span>
    </div>

    <!-- 没有更多数据 -->
    <div v-if="!hasMoreData && currentDataList.length > 0" class="no-more">
      <span>没有更多数据了</span>
    </div>

    <!-- 右键菜单 -->
    <ContextMenu
      ref="contextMenuRef"
      :menu-items="menuItems"
      :row-data="currentRowData"
      :class-name="config.contextmenuClass"
      @menu-action="handleMenuAction"
    />
  </div>
</template>

<script setup>
import { throttle } from "lodash-es";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import ContextMenu from "../plugins/ContextMenu.vue";

/**
 * 瀑布流虚拟滚动视图组件
 * 实现滚动位置判断，只渲染可见区域的项目以提高性能
 * @author CH
 * @version 1.0.0
 * @since 2025-12-01
 */

// 定义props
const props = defineProps({
  /**
   * 表格数据
   */
  tableData: {
    type: Array,
    default: () => []
  },
  /**
   * 列配置
   */
  userColumn: {
    type: Array,
    default: () => []
  },
  /**
   * 列数
   */
  colSize: {
    type: Number,
    default: 3
  },
  /**
   * 配置对象
   */
  config: {
    type: Object,
    required: true
  },
  /**
   * 是否居中
   */
  center: {
    type: Boolean,
    default: false
  },
  /**
   * 右键菜单函数
   */
  contextmenu: Function,
  /**
   * 行唯一标识
   */
  rowKey: String,
  /**
   * 容器高度
   */
  height: [String, Number],
  /**
   * 空状态文本
   */
  emptyText: String,
  /**
   * 每页大小
   */
  pageSize: {
    type: Number,
    default: 20
  },
  /**
   * 是否加载中
   */
  loading: {
    type: Boolean,
    default: false
  },
  /**
   * 总数据量
   */
  total: {
    type: Number,
    default: 0
  },
  /**
   * 当前页码
   */
  currentPage: {
    type: Number,
    default: 1
  },
  /**
   * 卡片间距
   */
  gap: {
    type: Number,
    default: 16
  },
  /**
   * 预估卡片高度（用于初始计算）
   */
  estimatedItemHeight: {
    type: Number,
    default: 200
  },
  /**
   * 缓冲区大小（可视区域外额外渲染的项目数）
   */
  bufferSize: {
    type: Number,
    default: 5
  },
  /**
   * 布局模式: waterfall(经典瀑布流) | flex(弹性瀑布流) | masonry(CSS masonry)
   */
  layoutMode: {
    type: String,
    default: "waterfall",
    validator: val => ["waterfall", "flex", "masonry"].includes(val)
  },
  /**
   * 是否显示序号
   */
  showIndex: {
    type: Boolean,
    default: false
  },
  /**
   * 卡片最小宽度 (flex 模式)
   */
  cardMinWidth: {
    type: Number,
    default: 280
  }
});

// 定义emits
const emit = defineEmits(["row-click", "selection-change", "load-more", "next-page", "update:currentPage", "col-click"]);

// 响应式数据
const waterfallContainer = ref(null);
const loadMoreTrigger = ref(null);
const currentDataList = ref([]);
const scrollTop = ref(0);
const containerWidth = ref(0);
const containerHeight = ref(0);

// 存储每个项目的位置信息
const itemPositions = ref([]);
// 每列的当前高度
const columnHeights = ref([]);

// 右键菜单相关
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// IntersectionObserver 实例
let loadMoreObserver = null;

/**
 * 计算容器样式
 */
const containerStyle = computed(() => {
  const style = {
    width: "100%",
    padding: `${props.gap}px`,
    overflowY: "auto",
    position: "relative"
  };

  if (!props.height || props.height === "auto") {
    style.height = "100%";
    style.maxHeight = "calc(100vh - 200px)";
  } else if (typeof props.height === "number") {
    style.height = `${props.height}px`;
  } else {
    style.height = props.height;
  }

  return style;
});

/**
 * 计算列宽
 */
const columnWidth = computed(() => {
  if (!containerWidth.value) return 0;
  const totalGap = (props.colSize - 1) * props.gap;
  return (containerWidth.value - totalGap - props.gap * 2) / props.colSize;
});

/**
 * 计算总高度
 */
const totalHeight = computed(() => {
  if (columnHeights.value.length === 0) return 0;
  return Math.max(...columnHeights.value) + props.gap;
});

/**
 * 是否还有更多数据
 */
const hasMoreData = computed(() => {
  if (!props.total || !props.pageSize) return false;
  return currentDataList.value.length < props.total;
});

/**
 * Flex 布局容器样式
 */
const flexContainerStyle = computed(() => ({
  display: 'flex',
  flexWrap: 'wrap',
  gap: `${props.gap}px`,
  alignItems: 'flex-start',
  alignContent: 'flex-start'
}));

/**
 * Flex 布局卡片样式
 */
const flexItemStyle = computed(() => ({
  flex: `1 1 ${props.cardMinWidth}px`,
  maxWidth: `calc(${100 / props.colSize}% - ${props.gap * (props.colSize - 1) / props.colSize}px)`,
  minWidth: `${props.cardMinWidth}px`
}));

/**
 * CSS Masonry 容器样式
 */
const masonryContainerStyle = computed(() => ({
  columnCount: props.colSize,
  columnGap: `${props.gap}px`
}));

/**
 * 计算可见项目
 * 只渲染在可视区域内（包含缓冲区）的项目
 */
const visibleItems = computed(() => {
  if (!itemPositions.value.length) return [];

  const viewportTop = scrollTop.value;
  const viewportBottom = viewportTop + containerHeight.value;
  
  // 缓冲区高度
  const bufferHeight = props.estimatedItemHeight * props.bufferSize;
  const renderTop = Math.max(0, viewportTop - bufferHeight);
  const renderBottom = viewportBottom + bufferHeight;

  const visible = [];

  for (let i = 0; i < itemPositions.value.length; i++) {
    const pos = itemPositions.value[i];
    if (!pos) continue;

    const itemTop = pos.top;
    const itemBottom = itemTop + pos.height;

    // 检查项目是否在渲染区域内
    if (itemBottom >= renderTop && itemTop <= renderBottom) {
      visible.push({
        key: props.rowKey ? currentDataList.value[i][props.rowKey] : i,
        index: i,
        data: currentDataList.value[i],
        style: {
          position: "absolute",
          left: `${pos.left}px`,
          top: `${pos.top}px`,
          width: `${pos.width}px`,
          transform: "translateZ(0)" // 启用GPU加速
        }
      });
    }
  }

  return visible;
});

/**
 * 初始化列高度数组
 */
const initColumnHeights = () => {
  columnHeights.value = new Array(props.colSize).fill(0);
};

/**
 * 获取最短列的索引
 */
const getShortestColumnIndex = () => {
  let minHeight = Infinity;
  let minIndex = 0;
  
  for (let i = 0; i < columnHeights.value.length; i++) {
    if (columnHeights.value[i] < minHeight) {
      minHeight = columnHeights.value[i];
      minIndex = i;
    }
  }
  
  return minIndex;
};

/**
 * 计算所有项目的位置
 */
const calculatePositions = () => {
  if (!currentDataList.value.length || !columnWidth.value) return;

  initColumnHeights();
  itemPositions.value = [];

  for (let i = 0; i < currentDataList.value.length; i++) {
    // 找到最短的列
    const columnIndex = getShortestColumnIndex();
    
    // 计算位置
    const left = props.gap + columnIndex * (columnWidth.value + props.gap);
    const top = columnHeights.value[columnIndex] + props.gap;
    
    // 使用预估高度（实际高度会在渲染后更新）
    const height = props.estimatedItemHeight;
    
    itemPositions.value.push({
      left,
      top,
      width: columnWidth.value,
      height,
      columnIndex
    });

    // 更新列高度
    columnHeights.value[columnIndex] = top + height;
  }
};

/**
 * 更新单个项目的实际高度
 */
const updateItemHeight = (index, actualHeight) => {
  if (!itemPositions.value[index]) return;
  
  const oldHeight = itemPositions.value[index].height;
  if (oldHeight === actualHeight) return;

  const heightDiff = actualHeight - oldHeight;
  const columnIndex = itemPositions.value[index].columnIndex;

  // 更新当前项目高度
  itemPositions.value[index].height = actualHeight;

  // 更新该列后续所有项目的位置
  for (let i = index + 1; i < itemPositions.value.length; i++) {
    if (itemPositions.value[i].columnIndex === columnIndex) {
      itemPositions.value[i].top += heightDiff;
    }
  }

  // 更新列高度
  columnHeights.value[columnIndex] += heightDiff;
};

/**
 * 处理滚动事件
 */
const handleScroll = throttle(() => {
  if (!waterfallContainer.value) return;
  scrollTop.value = waterfallContainer.value.scrollTop;
}, 16); // 约60fps

/**
 * 更新容器尺寸
 */
const updateContainerSize = () => {
  if (!waterfallContainer.value) return;
  
  containerWidth.value = waterfallContainer.value.clientWidth;
  containerHeight.value = waterfallContainer.value.clientHeight;
  
  // 重新计算位置
  nextTick(() => {
    calculatePositions();
  });
};

/**
 * 设置加载更多的 IntersectionObserver
 */
const setupLoadMoreObserver = () => {
  if (!loadMoreTrigger.value) return;

  loadMoreObserver = new IntersectionObserver(
    entries => {
      const entry = entries[0];
      if (entry.isIntersecting && hasMoreData.value && !props.loading) {
        emit("load-more");
        emit("next-page");
        emit("update:currentPage", props.currentPage + 1);
      }
    },
    {
      root: waterfallContainer.value,
      rootMargin: "100px",
      threshold: 0
    }
  );

  loadMoreObserver.observe(loadMoreTrigger.value);
};

/**
 * 行点击事件
 */
const onRowClick = row => {
  emit("row-click", row);
};

/**
 * 处理右键菜单
 */
const handleContextMenu = (event, row) => {
  if (!props.contextmenu) return;

  currentRowData.value = row;
  const items = props.contextmenu(row, null, event);

  if (items && items.length > 0) {
    menuItems.value = items;
    contextMenuRef.value.open(event, row);
  }
};

/**
 * 处理菜单动作
 */
const handleMenuAction = action => {
  // 菜单动作由父组件处理
};

/**
 * 重置布局
 */
const doLayout = () => {
  updateContainerSize();
};

/**
 * 滚动到顶部
 */
const scrollToTop = () => {
  if (waterfallContainer.value) {
    waterfallContainer.value.scrollTop = 0;
    scrollTop.value = 0;
  }
};

/**
 * 滚动到指定项目
 */
const scrollToItem = index => {
  if (!itemPositions.value[index] || !waterfallContainer.value) return;
  
  const pos = itemPositions.value[index];
  waterfallContainer.value.scrollTop = pos.top - props.gap;
};

// 监听数据变化 - 使用引用+长度作为版本号避免深度监听
const tableDataVersion = computed(() => props.tableData?.length ?? 0);
watch(
  [() => props.tableData, tableDataVersion],
  ([newVal]) => {
    currentDataList.value = newVal || [];
    nextTick(() => {
      calculatePositions();
    });
  },
  { immediate: true }
);

// 监听列数变化
watch(
  () => props.colSize,
  () => {
    nextTick(() => {
      calculatePositions();
    });
  }
);

// 监听容器高度变化
watch(
  () => props.height,
  () => {
    nextTick(() => {
      updateContainerSize();
    });
  }
);

// 生命周期
onMounted(() => {
  nextTick(() => {
    updateContainerSize();
    setupLoadMoreObserver();
  });

  // 监听窗口大小变化
  window.addEventListener("resize", updateContainerSize);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateContainerSize);
  
  if (loadMoreObserver) {
    loadMoreObserver.disconnect();
  }
});

// 暴露方法
defineExpose({
  doLayout,
  scrollToTop,
  scrollToItem,
  updateItemHeight,
  calculatePositions
});
</script>

<style lang="scss" scoped>
.waterfall-view-container {
  width: 100%;
  position: relative;

  // 经典瀑布流容器
  .waterfall-scroll-container {
    width: 100%;
    min-height: 100%;
  }

  // 瀑布流卡片项
  .waterfall-item,
  .waterfall-flex-item,
  .waterfall-masonry-item {
    position: relative;
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    will-change: transform;
    border-radius: 12px;
    overflow: visible;
    background: var(--el-bg-color);
    border: 1px solid var(--el-border-color-lighter);

    &:hover {
      transform: translateY(-4px) translateZ(0);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-primary-light-5);
      z-index: 10;
    }
  }

  // Flex 布局容器
  .waterfall-flex-container {
    width: 100%;
    min-height: 100%;
  }

  // Flex 布局卡片
  .waterfall-flex-item {
    margin-bottom: 0; // gap 已在容器中设置
  }

  // CSS Masonry 布局容器
  .waterfall-masonry-container {
    width: 100%;
    min-height: 100%;
  }

  // Masonry 卡片
  .waterfall-masonry-item {
    break-inside: avoid;
    margin-bottom: 16px;
  }

  // 序号角标
  .waterfall-index-badge {
    position: absolute;
    top: -8px;
    left: -8px;
    min-width: 26px;
    height: 26px;
    padding: 0 6px;
    background: linear-gradient(135deg, var(--el-color-primary-light-3), var(--el-color-primary));
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    border-radius: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 20;
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.4);
  }

  .loading-overlay {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-secondary);
    z-index: 10;

    svg {
      width: 32px;
      height: 32px;
      animation: rotating 1s linear infinite;
    }
  }

  .load-more-trigger {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }

  .no-more {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    border-top: 1px dashed var(--el-border-color-lighter);
  }
}

@keyframes rotating {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// 暗黑模式适配
:root[data-theme="dark"] {
  .waterfall-view-container {
    .waterfall-item:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    }
  }
}
</style>
