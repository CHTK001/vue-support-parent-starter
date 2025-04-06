<template>
  <div
    class="tab-panel"
    :class="[
      `tab-panel--${size}`,
      `tab-panel--${theme}`,
      {
        'is-collapsed': isCollapsed,
      },
      className
    ]"
    :style="panelStyle"
  >
    <!-- 头部区域 -->
    <div
      v-if="showHeader"
      class="tab-panel__header"
      @click="handleHeaderClick"
    >
      <div class="tab-panel__tabs">
        <div
          v-for="(item, index) in tabs || []"
          :key="index"
          class="tab-panel__tab"
          :class="{ 'is-active': activeTab === index }"
          @click.stop="handleTabClick(index)"
        >
          <el-icon v-if="item.icon" class="tab-icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </div>
      </div>
      <div class="tab-panel__extra">
        <slot name="header-extra"></slot>
        <el-icon
          v-if="collapsible"
          class="tab-panel__collapse-icon"
          :class="{ 'is-collapsed': isCollapsed }"
        >
          <IconifyIconOnline icon="ep:arrow-down" />
        </el-icon>
      </div>
    </div>

    <!-- 内容区域 -->
    <el-collapse-transition>
      <div v-show="!isCollapsed" class="tab-panel__body">
        <div v-if="loading" class="tab-panel__loading">
          <el-icon class="loading-icon" :size="30">
            <IconifyIconOnline icon="svg-spinners:180-ring" />
          </el-icon>
          <span class="loading-text">加载中...</span>
        </div>
        <template v-else>
          <slot></slot>
        </template>
      </div>
    </el-collapse-transition>

    <!-- 底部区域 -->
    <div v-if="showFooter && !isCollapsed" class="tab-panel__footer">
      <div class="tab-panel__footer-content">
        <slot name="footer"></slot>
      </div>
      <div class="tab-panel__footer-extra">
        <slot name="footer-extra"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElCollapseTransition, ElIcon } from 'element-plus';
import { IconifyIconOnline } from '@repo/components/ReIcon';
import { PanelSize, PanelTheme } from '../types';

interface TabItem {
  title: string;
  icon?: string;
}

const props = defineProps({
  // 标签列表
  tabs: {
    type: Array as () => TabItem[],
    default: () => []
  },
  // 默认激活的标签
  defaultActiveTab: {
    type: Number,
    default: 0
  },
  // 面板标题
  title: {
    type: String,
    default: ''
  },
  // 面板大小
  size: {
    type: String as () => PanelSize,
    default: 'default'
  },
  // 面板主题
  theme: {
    type: String as () => PanelTheme,
    default: 'default'
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
  // 是否有阴影
  shadow: {
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
  }
});

const emit = defineEmits(['collapse', 'expand', 'tab-change']);

// 是否折叠
const isCollapsed = ref(props.collapsed);

// 当前激活的标签
const activeTab = ref(props.defaultActiveTab);

// 面板样式
const panelStyle = computed(() => {
  const style: Record<string, string> = { ...props.style };
  if (props.width) {
    style.width = typeof props.width === 'number' ? `${props.width}px` : props.width;
  }
  if (props.height) {
    style.height = typeof props.height === 'number' ? `${props.height}px` : props.height;
  }
  return style;
});

// 监听折叠状态变化
watch(() => props.collapsed, (val) => {
  isCollapsed.value = val;
});

// 头部点击事件
const handleHeaderClick = () => {
  if (props.collapsible) {
    isCollapsed.value = !isCollapsed.value;
    if (isCollapsed.value) {
      emit('collapse');
    } else {
      emit('expand');
    }
  }
};

// 标签点击事件
const handleTabClick = (index: number) => {
  activeTab.value = index;
  emit('tab-change', index);
};

// 暴露方法
defineExpose({
  // 折叠面板
  collapse: () => {
    if (props.collapsible) {
      isCollapsed.value = true;
      emit('collapse');
    }
  },
  // 展开面板
  expand: () => {
    if (props.collapsible) {
      isCollapsed.value = false;
      emit('expand');
    }
  },
  // 切换折叠状态
  toggle: () => {
    if (props.collapsible) {
      handleHeaderClick();
    }
  },
  // 切换标签
  setActiveTab: (index: number) => {
    if (index >= 0 && index < (props.tabs?.length || 0)) {
      activeTab.value = index;
      emit('tab-change', index);
    }
  },
  // 获取当前标签
  getActiveTab: () => activeTab.value
});
</script>

<style lang="scss" scoped>
$sizes: (
  small: (
    padding: 8px 12px,
    font-size: 12px,
    header-height: 32px
  ),
  default: (
    padding: 12px 16px,
    font-size: 14px,
    header-height: 40px
  ),
  large: (
    padding: 16px 20px,
    font-size: 16px,
    header-height: 48px
  )
);

$themes: (
  default: var(--el-text-color-primary),
  primary: var(--el-color-primary),
  success: var(--el-color-success),
  warning: var(--el-color-warning),
  danger: var(--el-color-danger),
  info: var(--el-color-info)
);

.tab-panel {
  box-sizing: border-box;
  width: 100%;
  background-color: var(--el-bg-color);
  border-radius: 4px;
  transition: all 0.3s ease;
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-light);
  
  &.is-collapsed {
    .tab-panel__collapse-icon {
      transform: rotate(180deg);
    }
  }

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-light);
    padding: 0 16px;
    cursor: pointer;
    user-select: none;
  }

  &__tabs {
    display: flex;
    align-items: center;
    height: 100%;
    overflow-x: auto;
    scrollbar-width: none;
    
    &::-webkit-scrollbar {
      display: none;
    }
  }

  &__tab {
    padding: 0 16px;
    height: 100%;
    display: flex;
    align-items: center;
    white-space: nowrap;
    cursor: pointer;
    position: relative;
    transition: all 0.3s;
    
    .tab-icon {
      margin-right: 4px;
    }
    
    &.is-active {
      color: var(--el-color-primary);
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 2px;
        background-color: var(--el-color-primary);
      }
    }
    
    &:hover:not(.is-active) {
      color: var(--el-color-primary-light-3);
    }
  }

  &__extra {
    display: flex;
    align-items: center;
  }

  &__collapse-icon {
    margin-left: 8px;
    transition: transform 0.3s;
    font-size: 16px;
  }

  &__body {
    position: relative;
    overflow: hidden;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 24px;
    
    .loading-icon {
      margin-bottom: 8px;
      animation: rotate 1.5s linear infinite;
    }
    
    .loading-text {
      color: var(--el-text-color-secondary);
    }
  }

  &__footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-top: 1px solid var(--el-border-color-light);
  }

  &__footer-content {
    flex: 1;
  }

  // 主题
  @each $name, $color in $themes {
    &--#{$name} {
      .tab-panel__tab {
        &.is-active {
          color: $color;
          
          &::after {
            background-color: $color;
          }
        }
        
        &:hover:not(.is-active) {
          /* 
           * CSS变量不能直接在mix函数中使用
           * 根据主题调整亮度 
           */
          @if $name == 'default' {
            color: var(--el-text-color-regular);
          } @else if $name == 'primary' {
            color: var(--el-color-primary-light-3);
          } @else if $name == 'success' {
            color: var(--el-color-success-light-3);
          } @else if $name == 'warning' {
            color: var(--el-color-warning-light-3);
          } @else if $name == 'danger' {
            color: var(--el-color-danger-light-3);
          } @else if $name == 'info' {
            color: var(--el-color-info-light-3);
          }
        }
      }
    }
  }

  // 尺寸
  @each $size, $values in $sizes {
    &--#{$size} {
      font-size: map-get($values, font-size);
      
      .tab-panel__header {
        height: map-get($values, header-height);
      }
      
      .tab-panel__body {
        padding: map-get($values, padding);
      }
      
      .tab-panel__footer {
        padding: map-get($values, padding);
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style> 