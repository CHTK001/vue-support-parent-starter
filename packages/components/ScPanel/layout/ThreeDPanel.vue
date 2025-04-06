<template>
  <div
    ref="panelRef"
    class="sc-panel sc-panel-3d"
    :class="[
      `sc-panel-${size}`,
      `sc-panel-${theme}`,
      `sc-panel-header-${headerPosition}`,
      { 'is-collapsed': isCollapsed, 'is-loading': loading }
    ]"
    @mousemove="handleMouseMove"
    @mouseleave="handleMouseLeave"
  >
    <div class="sc-panel-header" v-if="$slots.header || title">
      <div class="sc-panel-title">
        <slot name="icon"></slot>
        <span v-if="title">{{ title }}</span>
      </div>
      <div class="sc-panel-header-actions">
        <slot name="actions"></slot>
        <el-button
          v-if="collapsible"
          @click.stop="toggleCollapse"
          :size="size"
          class="collapse-btn"
        >
          <el-icon v-if="isCollapsed"><arrow-right /></el-icon>
          <el-icon v-else><arrow-down /></el-icon>
        </el-button>
      </div>
    </div>
    <div
      v-if="!isCollapsed"
      class="sc-panel-body"
      :style="bodyStyle"
    >
      <div v-if="loading" class="sc-panel-loading">
        <el-icon class="is-loading"><loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else class="3d-transform-container" :style="transformStyle">
        <slot></slot>
      </div>
    </div>
    <div v-if="$slots.footer && !isCollapsed" class="sc-panel-footer">
      <slot name="footer"></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { PanelSize, PanelTheme, PanelHeaderPosition } from '../types';

const props = defineProps({
  // 面板标题
  title: {
    type: String,
    default: ''
  },
  // 面板大小
  size: {
    type: String,
    default: PanelSize.DEFAULT,
    validator: (value) => Object.values(PanelSize).includes(value),
  },
  // 面板主题
  theme: {
    type: String,
    default: PanelTheme.DEFAULT,
    validator: (value) => Object.values(PanelTheme).includes(value),
  },
  // 头部位置
  headerPosition: {
    type: String,
    default: PanelHeaderPosition.TOP,
    validator: (value) => Object.values(PanelHeaderPosition).includes(value),
  },
  // 是否可折叠
  collapsible: {
    type: Boolean,
    default: false
  },
  // 是否默认折叠
  collapsed: {
    type: Boolean,
    default: false
  },
  // 是否有边框
  bordered: {
    type: Boolean,
    default: true
  },
  // 面板高度
  height: {
    type: [String, Number],
    default: ''
  },
  // 面板宽度
  width: {
    type: [String, Number],
    default: ''
  },
  // 是否显示头部
  showHeader: {
    type: Boolean,
    default: true
  },
  // 是否显示底部
  showFooter: {
    type: Boolean,
    default: false
  },
  // 自定义类名
  className: {
    type: String,
    default: ''
  },
  // 自定义样式
  style: {
    type: Object,
    default: () => ({})
  },
  // 是否加载中
  loading: {
    type: Boolean,
    default: false
  },
  // 3D效果强度
  depth: {
    type: Number,
    default: 20
  },
  // 鼠标灵敏度
  sensitivity: {
    type: Number,
    default: 5
  },
  // 是否跟随鼠标移动
  followMouse: {
    type: Boolean,
    default: true
  },
  // 3D角度上限
  maxTilt: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['collapse-change']);

const panelRef = ref(null);
const isCollapsed = ref(props.collapsed);
const mousePosition = ref({ x: 0, y: 0 });
const transformStyle = computed(() => {
  const { x, y } = mousePosition.value;
  const rotateX = y / props.sensitivity;
  const rotateY = -x / props.sensitivity;
  const translateZ = props.depth;

  return {
    transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
    transition: 'transform 0.1s ease-out'
  };
});

const handleMouseMove = (event) => {
  if (!panelRef.value) return;
  
  const rect = panelRef.value.getBoundingClientRect();
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  
  mousePosition.value = {
    x: ((event.clientX - rect.left) - centerX) / 10,
    y: ((event.clientY - rect.top) - centerY) / 10
  };
};

const handleMouseLeave = () => {
  mousePosition.value = { x: 0, y: 0 };
};

const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value;
  emit('collapse-change', isCollapsed.value);
};

watch(() => props.collapsed, (val) => {
  isCollapsed.value = val;
});

// 计算面板样式
const panelStyle = computed(() => {
  const style: Record<string, any> = { ...props.style };
  
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  
  style.transform = `perspective(1000px) rotateX(${mousePosition.value.y}deg) rotateY(${mousePosition.value.x}deg)`;
  style.transformStyle = 'preserve-3d';
  style.transition = 'transform 0.05s ease';
  
  if (props.bordered) {
    style.border = '1px solid rgba(0, 0, 0, 0.1)';
  }
  
  return style;
});

// 暴露方法
defineExpose({
  // 折叠面板
  collapse: () => {
    isCollapsed.value = true;
    emit('collapse-change', true);
  },
  // 展开面板
  expand: () => {
    isCollapsed.value = false;
    emit('collapse-change', false);
  },
  // 切换折叠状态
  toggle: toggleCollapse
});
</script>

<style scoped>
.sc-panel-3d {
  border-radius: 16px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(5px);
}

.sc-panel-3d-content {
  position: relative;
  display: flex;
  flex-direction: column;
  transform: translateZ(30px);
  height: 100%;
}

.sc-panel-3d-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-light);
  background-color: var(--el-bg-color-overlay);
}

.sc-panel-3d-body {
  padding: 20px;
  flex: 1;
  background-color: var(--el-bg-color-overlay);
}

.sc-panel-3d-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: var(--el-bg-color-overlay);
  border-top: 1px solid var(--el-border-color-light);
}

.sc-panel-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
}

.sc-panel-collapse-icon {
  margin-right: 8px;
  transition: transform 0.3s;
  font-size: 14px;
}

.sc-panel-collapse-icon.is-collapsed {
  transform: rotate(-90deg);
}

/* 尺寸样式 */
.sc-panel-small .sc-panel-3d-header,
.sc-panel-small .sc-panel-3d-footer {
  padding: 8px 12px;
}

.sc-panel-small .sc-panel-3d-body {
  padding: 12px;
}

.sc-panel-large .sc-panel-3d-header,
.sc-panel-large .sc-panel-3d-footer {
  padding: 20px 24px;
}

.sc-panel-large .sc-panel-3d-body {
  padding: 24px;
}

/* 主题样式 */
.sc-panel-primary {
  box-shadow: 0 15px 35px rgba(var(--el-color-primary-rgb), 0.15);
}

.sc-panel-primary .sc-panel-3d-header {
  background-color: var(--el-color-primary-light-9);
  border-bottom-color: var(--el-color-primary-light-7);
}

.sc-panel-primary .sc-panel-title {
  color: var(--el-color-primary);
}

.sc-panel-success {
  box-shadow: 0 15px 35px rgba(var(--el-color-success-rgb), 0.15);
}

.sc-panel-success .sc-panel-3d-header {
  background-color: var(--el-color-success-light-9);
  border-bottom-color: var(--el-color-success-light-7);
}

.sc-panel-success .sc-panel-title {
  color: var(--el-color-success);
}

.sc-panel-warning {
  box-shadow: 0 15px 35px rgba(var(--el-color-warning-rgb), 0.15);
}

.sc-panel-warning .sc-panel-3d-header {
  background-color: var(--el-color-warning-light-9);
  border-bottom-color: var(--el-color-warning-light-7);
}

.sc-panel-warning .sc-panel-title {
  color: var(--el-color-warning);
}

.sc-panel-danger {
  box-shadow: 0 15px 35px rgba(var(--el-color-danger-rgb), 0.15);
}

.sc-panel-danger .sc-panel-3d-header {
  background-color: var(--el-color-danger-light-9);
  border-bottom-color: var(--el-color-danger-light-7);
}

.sc-panel-danger .sc-panel-title {
  color: var(--el-color-danger);
}

.sc-panel-info {
  box-shadow: 0 15px 35px rgba(var(--el-color-info-rgb), 0.15);
}

.sc-panel-info .sc-panel-3d-header {
  background-color: var(--el-color-info-light-9);
  border-bottom-color: var(--el-color-info-light-7);
}

.sc-panel-info .sc-panel-title {
  color: var(--el-color-info);
}

/* 头部位置样式 */
.sc-panel-header-left {
  display: flex;
  
  .sc-panel-header {
    flex-direction: column;
    border-bottom: none;
    border-right: 1px solid var(--el-border-color-light);
    padding: 16px 12px;
    
    .sc-panel-header-actions {
      margin-top: 16px;
    }
  }
}

.sc-panel-header-right {
  display: flex;
  flex-direction: row-reverse;
  
  .sc-panel-header {
    flex-direction: column;
    border-bottom: none;
    border-left: 1px solid var(--el-border-color-light);
    padding: 16px 12px;
    
    .sc-panel-header-actions {
      margin-top: 16px;
    }
  }
}
</style> 