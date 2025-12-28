<template>
  <div ref="tableContainer" class="canvas-table-container" :style="containerStyle">
    <div class="controls-container">
      <slot name="table-header" />
    </div>
    <div ref="canvasWrapper" class="canvas-wrapper" :style="canvasWrapperStyle">
      <canvas ref="headerCanvas" class="header-canvas" />
      <div ref="bodyContainer" class="body-container thin-scrollbar" @scroll="handleScroll">
        <canvas ref="bodyCanvas" class="body-canvas" />
      </div>
    </div>
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner" />
    </div>
    <!-- 右键菜单组件 -->
    <ContextMenu ref="contextMenuRef" :menu-items="menuItems" :row-data="currentRowData" :class-name="config.contextmenuClass" @menu-action="handleMenuAction" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, onBeforeUnmount } from "vue";
import { debounce } from "lodash-es";
import ContextMenu from "../plugins/ContextMenu.vue";

// 定义props
const props = defineProps({
  tableData: {
    type: Array,
    default: () => []
  },
  userColumn: {
    type: Array,
    default: () => []
  },
  config: {
    type: Object,
    required: true,
    default: () => ({
      border: false,
      stripe: false,
      size: "default"
    })
  },
  paginationType: {
    type: String,
    default: "default"
  },
  contextmenu: Function,
  rowKey: String,
  height: [String, Number],
  columnInTemplate: Boolean,
  remoteFilter: Boolean,
  remoteSummary: Boolean,
  summaryMethod: Function,
  toggleIndex: Number,
  emptyText: String,
  stickyTop: {
    type: Number,
    default: 0
  }
});

// 定义emit
const emit = defineEmits(["row-click", "selection-change", "sort-change", "filter-change", "col-click"]);

// refs
const tableContainer = ref(null);
const canvasWrapper = ref(null);
const headerCanvas = ref(null);
const bodyCanvas = ref(null);
const bodyContainer = ref(null);

// 状态变量
const loading = ref(false);
const visibleStartRow = ref(0);
const visibleEndRow = ref(0);
const scrollLeft = ref(0);
const sortState = ref({ prop: "", order: "" });
const selectedRows = ref([]);
const headerHeight = ref(40);
const rowHeight = ref(40);
const columnWidths = ref([]);
const devicePixelRatio = ref(window.devicePixelRatio || 1);
// 检测深色主题
const isDark = ref(document.documentElement.classList.contains("dark"));

// 监听主题变化
const themeObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.attributeName === "class") {
      isDark.value = document.documentElement.classList.contains("dark");
      updateTheme();
    }
  });
});

// 更新主题颜色
const updateTheme = () => {
  if (isDark.value) {
    theme.value = {
      headerBgColor: "#1d1e1f",
      headerTextColor: "#e5eaf3",
      rowBgColor: "#141414",
      rowAltBgColor: "#1d1e1f",
      rowHoverBgColor: "#262727",
      rowSelectedBgColor: "#18222c",
      borderColor: "#414243",
      textColor: "#e5eaf3",
      fontSize: 14,
      fontFamily: "Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif"
    };
  } else {
    theme.value = {
      headerBgColor: "#f5f7fa",
      headerTextColor: "#606266",
      rowBgColor: "#ffffff",
      rowAltBgColor: "#fafafa",
      rowHoverBgColor: "#f5f7fa",
      rowSelectedBgColor: "#ecf5ff",
      borderColor: "#ebeef5",
      textColor: "#606266",
      fontSize: 14,
      fontFamily: "Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif"
    };
  }
  // 主题变化后重新渲染表格
  nextTick(() => {
    rerenderTable();
  });
};

const theme = ref({
  headerBgColor: "#f5f7fa",
  headerTextColor: "#606266",
  rowBgColor: "#ffffff",
  rowAltBgColor: "#fafafa",
  rowHoverBgColor: "#f5f7fa",
  rowSelectedBgColor: "#ecf5ff",
  borderColor: "#ebeef5",
  textColor: "#606266",
  fontSize: 14,
  fontFamily: "Helvetica Neue, Helvetica, PingFang SC, Hiragino Sans GB, Microsoft YaHei, Arial, sans-serif"
});

// 右键菜单相关状态
const contextMenuRef = ref(null);
const menuItems = ref([]);
const currentRowData = ref({});

// 计算容器样式
const containerStyle = computed(() => {
  return {
    position: "relative",
    width: "100%",
    height: props.height === "auto" ? "100%" : typeof props.height === "number" ? `${props.height}px` : props.height
  };
});

// 计算Canvas包装器样式
const canvasWrapperStyle = computed(() => {
  return {
    width: "100%",
    height: _height.value,
    maxWidth: "100%",
    overflow: "hidden",
    position: "relative"
  };
});

// 计算高度
const _height = computed(() => {
  if (props.height === "auto") {
    // 当设置为auto时，尝试获取父元素的可视高度
    return "100%";
  }
  return typeof props.height === "number" ? `${props.height}px` : props.height;
});

// 计算有效列（排除隐藏的列）
const visibleColumns = computed(() => {
  return props.userColumn.filter(col => !col.hide && (!col.handleHide || !col.handleHide(col)));
});

// 计算表格总宽度
const tableWidth = computed(() => {
  return columnWidths.value.reduce((total, width) => total + width, 0);
});

// 初始化列宽
const initColumnWidths = () => {
  const container = tableContainer.value;
  if (!container) return;

  const containerWidth = container.clientWidth;
  const columns = visibleColumns.value;

  // 如果有明确指定宽度的列，使用指定的宽度
  let totalWidth = 0;
  let flexColumns = 0;

  columnWidths.value = columns.map(col => {
    if (col.width) {
      const width = parseInt(col.width, 10);
      totalWidth += width;
      return width;
    } else {
      flexColumns++;
      return 0; // 临时值，稍后计算
    }
  });

  // 计算灵活列的宽度
  if (flexColumns > 0) {
    const remainingWidth = Math.max(containerWidth - totalWidth, 0);
    const flexWidth = remainingWidth / flexColumns;

    columnWidths.value = columnWidths.value.map((width, index) => {
      if (width === 0) {
        return Math.floor(flexWidth);
      }
      return width;
    });
  }
};

// 计算可见行的范围
const calculateVisibleRows = () => {
  if (!bodyContainer.value) return;

  const containerHeight = bodyContainer.value.clientHeight;
  const scrollTop = bodyContainer.value.scrollTop;

  // 计算可见行的范围
  const start = Math.floor(scrollTop / rowHeight.value);
  const visibleRows = Math.ceil(containerHeight / rowHeight.value);
  const end = Math.min(start + visibleRows + 2, props.tableData.length); // +2 为了缓冲

  visibleStartRow.value = Math.max(0, start - 2); // -2 为了缓冲
  visibleEndRow.value = end;

  // 渲染可见区域
  renderBodyCanvas();
};

// 处理滚动事件
const handleScroll = debounce(() => {
  if (!bodyContainer.value) return;

  const newScrollLeft = bodyContainer.value.scrollLeft;
  if (scrollLeft.value !== newScrollLeft) {
    scrollLeft.value = newScrollLeft;
    renderHeaderCanvas(); // 同步表头滚动
  }

  calculateVisibleRows();
}, 10);

// 改进渲染表格的方法，确保会渲染内容
const rerenderTable = () => {
  nextTick(() => {
    initCanvases();
    initColumnWidths();
    renderHeaderCanvas();

    // 强制计算和渲染可见行，不依赖滚动事件
    if (bodyContainer.value) {
      const containerHeight = bodyContainer.value.clientHeight;

      // 计算初始可见行范围
      const visibleRows = Math.ceil(containerHeight / rowHeight.value);
      visibleStartRow.value = 0;
      visibleEndRow.value = Math.min(visibleRows + 5, props.tableData.length); // 多渲染几行作为缓冲

      // 立即渲染表体
      renderBodyCanvas();
    }
  });
};

// 初始化Canvas
const initCanvases = () => {
  if (!headerCanvas.value || !bodyCanvas.value || !tableContainer.value || !bodyContainer.value) return;

  const container = tableContainer.value;
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  // 设置Canvas尺寸
  const headerCtx = headerCanvas.value.getContext("2d");
  headerCanvas.value.width = containerWidth * devicePixelRatio.value;
  headerCanvas.value.height = headerHeight.value * devicePixelRatio.value;
  headerCanvas.value.style.width = `${containerWidth}px`;
  headerCanvas.value.style.height = `${headerHeight.value}px`;
  headerCtx.scale(devicePixelRatio.value, devicePixelRatio.value);

  const bodyCtx = bodyCanvas.value.getContext("2d");
  const bodyHeight = Math.max(props.tableData.length * rowHeight.value, containerHeight - headerHeight.value);
  bodyCanvas.value.width = Math.max(tableWidth.value, containerWidth) * devicePixelRatio.value;
  bodyCanvas.value.height = bodyHeight * devicePixelRatio.value;
  bodyCanvas.value.style.width = `${Math.max(tableWidth.value, containerWidth)}px`;
  bodyCanvas.value.style.height = `${bodyHeight}px`;
  bodyCtx.scale(devicePixelRatio.value, devicePixelRatio.value);
};

// 渲染表头
const renderHeaderCanvas = () => {
  if (!headerCanvas.value) return;

  const ctx = headerCanvas.value.getContext("2d");
  const { width, height } = headerCanvas.value;

  // 清空画布
  ctx.clearRect(0, 0, width / devicePixelRatio.value, height / devicePixelRatio.value);

  // 设置样式
  ctx.fillStyle = theme.value.headerBgColor;
  ctx.fillRect(0, 0, width / devicePixelRatio.value, height / devicePixelRatio.value);

  // 绘制表头
  ctx.font = `${theme.value.fontSize}px ${theme.value.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = theme.value.headerTextColor;

  let xOffset = -scrollLeft.value;
  const columns = visibleColumns.value;

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const columnWidth = columnWidths.value[i] || 100;

    // 超出可视区域的列不渲染
    if (xOffset + columnWidth < 0) {
      xOffset += columnWidth;
      continue;
    }

    // 绘制列背景
    ctx.fillStyle = theme.value.headerBgColor;
    ctx.fillRect(xOffset, 0, columnWidth, headerHeight.value);

    // 绘制列文本
    ctx.fillStyle = theme.value.headerTextColor;
    ctx.textAlign = column.align === "right" ? "right" : column.align === "center" ? "center" : "left";
    const textX = column.align === "right" ? xOffset + columnWidth - 10 : column.align === "center" ? xOffset + columnWidth / 2 : xOffset + 10;
    ctx.fillText(column.label, textX, headerHeight.value / 2);

    // 绘制排序图标（如果有）
    if (column.sortable) {
      const isSorted = sortState.value.prop === column.prop;
      if (isSorted) {
        // 绘制排序图标
        const iconX = column.align === "right" ? xOffset + 10 : xOffset + columnWidth - 20;
        const iconY = headerHeight.value / 2;

        ctx.beginPath();
        if (sortState.value.order === "ascending") {
          // 绘制升序图标
          ctx.moveTo(iconX - 4, iconY + 2);
          ctx.lineTo(iconX, iconY - 2);
          ctx.lineTo(iconX + 4, iconY + 2);
        } else {
          // 绘制降序图标
          ctx.moveTo(iconX - 4, iconY - 2);
          ctx.lineTo(iconX, iconY + 2);
          ctx.lineTo(iconX + 4, iconY - 2);
        }
        ctx.closePath();
        ctx.fillStyle = theme.value.headerTextColor;
        ctx.fill();
      }
    }

    // 绘制列边框
    if (props.config.border) {
      ctx.strokeStyle = theme.value.borderColor;
      ctx.beginPath();
      ctx.moveTo(xOffset + columnWidth, 0);
      ctx.lineTo(xOffset + columnWidth, headerHeight.value);
      ctx.stroke();
    }

    xOffset += columnWidth;

    // 如果已经超出可视区域，停止渲染
    if (xOffset > width / devicePixelRatio.value) break;
  }

  // 绘制底部边框
  if (props.config.border) {
    ctx.strokeStyle = theme.value.borderColor;
    ctx.beginPath();
    ctx.moveTo(0, headerHeight.value - 0.5);
    ctx.lineTo(width / devicePixelRatio.value, headerHeight.value - 0.5);
    ctx.stroke();
  }
};

// 渲染表体
const renderBodyCanvas = () => {
  if (!bodyCanvas.value) return;

  const ctx = bodyCanvas.value.getContext("2d");
  const { width } = bodyCanvas.value;
  const visibleHeight = bodyContainer.value.clientHeight;

  // 清空可视区域
  ctx.clearRect(0, visibleStartRow.value * rowHeight.value, width / devicePixelRatio.value, (visibleEndRow.value - visibleStartRow.value) * rowHeight.value);

  // 设置样式
  ctx.font = `${theme.value.fontSize}px ${theme.value.fontFamily}`;
  ctx.textBaseline = "middle";

  const columns = visibleColumns.value;
  const tableData = props.tableData;

  // 仅渲染可见行
  for (let rowIndex = visibleStartRow.value; rowIndex < visibleEndRow.value; rowIndex++) {
    if (rowIndex >= tableData.length) break;

    const row = tableData[rowIndex];
    const y = rowIndex * rowHeight.value;
    const isSelected = selectedRows.value.some(selectedRow => selectedRow[props.rowKey] === row[props.rowKey]);

    // 绘制行背景
    if (isSelected) {
      ctx.fillStyle = theme.value.rowSelectedBgColor;
    } else if (props.config.stripe && rowIndex % 2 === 1) {
      ctx.fillStyle = theme.value.rowAltBgColor;
    } else {
      ctx.fillStyle = theme.value.rowBgColor;
    }
    ctx.fillRect(0, y, width / devicePixelRatio.value, rowHeight.value);

    // 绘制单元格
    let xOffset = -scrollLeft.value;

    for (let colIndex = 0; colIndex < columns.length; colIndex++) {
      const column = columns[colIndex];
      const columnWidth = columnWidths.value[colIndex] || 100;

      // 超出可视区域的列不渲染
      if (xOffset + columnWidth < 0) {
        xOffset += columnWidth;
        continue;
      }

      // 获取单元格内容
      let cellContent = row[column.prop];
      if (column.formatter) {
        cellContent = column.formatter(row);
      }
      if (cellContent === undefined || cellContent === null) {
        cellContent = column.defaultValue || "-";
      }

      // 绘制单元格文本
      ctx.fillStyle = theme.value.textColor;
      ctx.textAlign = column.align === "right" ? "right" : column.align === "center" ? "center" : "left";
      const textX = column.align === "right" ? xOffset + columnWidth - 10 : column.align === "center" ? xOffset + columnWidth / 2 : xOffset + 10;

      // 文本溢出处理
      const maxTextWidth = columnWidth - 20;
      const text = cellContent.toString();
      let displayText = text;

      const textWidth = ctx.measureText(text).width;
      if (textWidth > maxTextWidth) {
        // 文本溢出显示省略号
        let truncated = "";
        for (let i = 0; i < text.length; i++) {
          const part = text.substring(0, i + 1);
          if (ctx.measureText(part + "...").width > maxTextWidth) {
            truncated = text.substring(0, i) + "...";
            break;
          }
        }
        displayText = truncated;
      }

      ctx.fillText(displayText, textX, y + rowHeight.value / 2);

      // 绘制单元格边框
      if (props.config.border) {
        ctx.strokeStyle = theme.value.borderColor;

        // 右侧边框
        ctx.beginPath();
        ctx.moveTo(xOffset + columnWidth - 0.5, y);
        ctx.lineTo(xOffset + columnWidth - 0.5, y + rowHeight.value);
        ctx.stroke();

        // 底部边框
        ctx.beginPath();
        ctx.moveTo(xOffset, y + rowHeight.value - 0.5);
        ctx.lineTo(xOffset + columnWidth, y + rowHeight.value - 0.5);
        ctx.stroke();
      }

      xOffset += columnWidth;

      // 如果已经超出可视区域，停止渲染
      if (xOffset > width / devicePixelRatio.value) break;
    }
  }
};

// 处理行点击事件
const handleRowClick = event => {
  if (!bodyCanvas.value || !bodyContainer.value) return;

  const rect = bodyCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;

  // 计算点击的行索引
  const rowIndex = Math.floor((y + bodyContainer.value.scrollTop) / rowHeight.value);

  if (rowIndex >= 0 && rowIndex < props.tableData.length) {
    const row = props.tableData[rowIndex];
    emit("row-click", row, rowIndex);

    // 处理行选择
    toggleRowSelection(row);
  }
};

// 处理单元格点击事件（用于排序等）
const handleCellClick = event => {
  if (!headerCanvas.value) return;

  const rect = headerCanvas.value.getBoundingClientRect();
  const x = event.clientX - rect.left + scrollLeft.value;

  // 计算点击的列索引
  let xOffset = 0;
  let clickedColIndex = -1;

  for (let i = 0; i < columnWidths.value.length; i++) {
    xOffset += columnWidths.value[i];
    if (x < xOffset) {
      clickedColIndex = i;
      break;
    }
  }

  if (clickedColIndex !== -1) {
    const column = visibleColumns.value[clickedColIndex];

    // 处理排序
    if (column.sortable) {
      const prop = column.prop;
      let order = "ascending";

      if (sortState.value.prop === prop) {
        order = sortState.value.order === "ascending" ? "descending" : "ascending";
      }

      sortState.value = { prop, order };
      emit("sort-change", { prop, order });

      // 重新渲染表头以显示排序图标
      renderHeaderCanvas();
    }
  }
};

// 切换行选择状态
const toggleRowSelection = row => {
  const rowKey = props.rowKey;
  if (!rowKey) return;

  const index = selectedRows.value.findIndex(r => r[rowKey] === row[rowKey]);

  if (index > -1) {
    selectedRows.value.splice(index, 1);
  } else {
    selectedRows.value.push(row);
  }

  // 发出选择变更事件
  emit("selection-change", selectedRows.value);

  // 重新渲染表格以更新选中状态
  renderBodyCanvas();
};

// 设置行选择
const setSelection = rows => {
  if (!props.rowKey) return;

  selectedRows.value = rows;
  renderBodyCanvas();
};

// 清空选择
const clearSelection = () => {
  selectedRows.value = [];
  renderBodyCanvas();
};

// 监听窗口大小变化
const handleResize = debounce(() => {
  rerenderTable();
}, 100);

// 监听行数据变化 - 使用引用+长度作为版本号避免深度监听
const tableDataVersion = computed(() => props.tableData?.length ?? 0);
watch(
  [() => props.tableData, tableDataVersion],
  ([newData]) => {
    if (newData && newData.length > 0) {
      nextTick(() => {
        initCanvases();

        // 确保计算可见行并立即渲染
        if (bodyContainer.value) {
          calculateVisibleRows();
        } else {
          renderBodyCanvas();
        }
      });
    }
  },
  { immediate: true }
);

// 监听列配置变化 - 使用长度作为版本号避免深度监听
const userColumnVersion = computed(() => props.userColumn?.length ?? 0);
watch(
  [() => props.userColumn, userColumnVersion],
  () => {
    nextTick(() => {
      initColumnWidths();
      rerenderTable();
    });
  }
);

// 监听toggleIndex变化
watch(
  () => props.toggleIndex,
  () => {
    rerenderTable();
  }
);

// 监听config变化 - 使用关键属性版本号避免深度监听
const configVersion = computed(() => 
  `${props.config?.border}-${props.config?.stripe}-${props.config?.size}`
);
watch(
  configVersion,
  () => {
    rerenderTable();
  }
);

// 处理右键菜单
const handleCanvasContextMenu = e => {
  if (!props.contextmenu) return;

  const rect = bodyCanvas.value.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 计算点击的行索引
  const rowIndex = Math.floor(y / rowHeight.value);

  // 确认行索引有效
  if (rowIndex >= 0 && rowIndex < props.tableData.length) {
    // 阻止默认右键菜单
    e.preventDefault();

    const row = props.tableData[rowIndex];

    // 保存当前行数据
    currentRowData.value = row;

    // 调用外部传入的contextmenu函数获取菜单项
    const items = props.contextmenu(row, null, e);

    if (items && items.length > 0) {
      menuItems.value = items;
      // 显示右键菜单
      contextMenuRef.value.open(e, row);
    }
  }
};

// 处理菜单动作
const handleMenuAction = action => {
  // 如果需要，可以在这里处理菜单动作
  console.log("菜单动作:", action);
};

// 生命周期钩子
onMounted(() => {
  // 初始化主题
  updateTheme();

  // 启动主题观察器
  themeObserver.observe(document.documentElement, { attributes: true });

  // 设置事件监听
  window.addEventListener("resize", handleResize);
  headerCanvas.value?.addEventListener("click", handleCellClick);
  bodyCanvas.value?.addEventListener("click", handleRowClick);

  // 初始化表格，确保立即渲染
  nextTick(() => {
    rerenderTable();

    // 使用两次nextTick和一个短延时确保在DOM完全渲染后再次尝试渲染
    nextTick(() => {
      setTimeout(() => {
        if (bodyContainer.value && props.tableData.length > 0) {
          calculateVisibleRows();
        }
      }, 50);
    });
  });

  // 设置鼠标滚轮事件，支持水平滚动
  bodyContainer.value?.addEventListener("wheel", e => {
    if (e.shiftKey) {
      e.preventDefault();
      bodyContainer.value.scrollLeft += e.deltaY;
    }
  });

  // 添加右键菜单事件监听
  bodyCanvas.value?.addEventListener("contextmenu", handleCanvasContextMenu);
});

onBeforeUnmount(() => {
  // 断开主题观察器
  themeObserver.disconnect();

  // 移除事件监听
  window.removeEventListener("resize", handleResize);
  headerCanvas.value?.removeEventListener("click", handleCellClick);
  bodyCanvas.value?.removeEventListener("click", handleRowClick);
  bodyContainer.value?.removeEventListener("wheel", () => {});

  // 移除右键菜单事件监听
  bodyCanvas.value?.removeEventListener("contextmenu", handleCanvasContextMenu);
});

// 暴露方法给父组件
defineExpose({
  setSelection,
  clearSelection,
  rerenderTable
});
</script>

<style scoped lang="scss">
.canvas-table-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.controls-container {
  flex-shrink: 0;
}

.canvas-wrapper {
  position: relative;
  flex-grow: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.header-canvas {
  flex-shrink: 0;
  border-bottom: 1px solid #ebeef5;
}

.body-container {
  flex-grow: 1;
  overflow: auto;
  position: relative;
}

.body-canvas {
  position: absolute;
  top: 0;
  left: 0;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--el-mask-color-extra-light);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--el-fill-color-light);
  border-top: 4px solid var(--el-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.thin-scrollbar {
  scrollbar-color: var(--el-color-primary) transparent; /* 滑块颜色、轨道颜色 */

  /* Firefox */
  scrollbar-width: thin; /* 可选值为 'auto', 'thin', 'none' */
  ::-webkit-scrollbar {
    width: 6px; /* 滚动条宽度 */
  }

  /* 滚动条轨道 */
  ::-webkit-scrollbar-track {
    background: transparent; /* 轨道颜色 */
  }

  /* 滚动条滑块 */
  ::-webkit-scrollbar-thumb {
    background-color: var(--el-color-primary-light-1);
    border-radius: 4px;
  }

  /* 滚动条滑块：hover状态 */
  ::-webkit-scrollbar-thumb:hover {
    background: var(--el-color-primary); /* 滑块hover颜色 */
  }
}
</style>
