<script setup lang="ts">
/**
 * ReSearch koi 主题 —— 搜索区折叠组件（KoiSearch 移植）
 *
 * <p>支持两种检索模式：</p>
 * <ul>
 *   <li>mode=1（默认）：紧凑模式，所有表单项水平排列，适合少量检索条件</li>
 *   <li>mode=2（表单模式）：左侧标签右侧组件，类似 el-form label-position="right"，适合多项检索</li>
 * </ul>
 *
 * <p>折叠按钮：</p>
 * <ul>
 *   <li>默认隐藏（showSearch=false 时整个区域不显示）</li>
 *   <li>默认不显示边框（bordered=false），开启后显示容器边框</li>
 *   <li>按钮默认不显示文字，hover 显示 tooltip</li>
 *   <li>通过 #action 插槽可自定义按钮内容</li>
 * </ul>
 */
import { ref, onMounted, computed, defineAsyncComponent } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import { useSlots } from "vue";

/** Modern 布局（按需异步加载） */
const ModernLayout = defineAsyncComponent(() => import("../../layouts/Modern.vue"));

const slots = useSlots();

defineOptions({ name: "ReSearch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 初始展开状态 */
    isExpanded?: boolean;
    /** 是否显示搜索区域（false 时整个区域隐藏，不可折叠） */
    showSearch?: boolean;
    /** 布局模式：default / modern */
    layout?: "default" | "modern";
    /** 检索模式：1=紧凑水平排列，2=表单样式（左标签右组件） */
    mode?: 1 | 2;
    /** 是否显示容器边框，默认不显示 */
    bordered?: boolean;
    /** 折叠按钮是否显示文字，默认不显示（仅图标 + tooltip） */
    showLabel?: boolean;
    /** 折叠按钮 tooltip 文字 */
    tooltipText?: string;
  }>(),
  {
    isExpanded: false,
    showSearch: true,
    layout: "default",
    mode: 1,
    bordered: false,
    showLabel: false,
    tooltipText: "搜索",
  },
);

const showExpanded = ref(false);
const isTooltipVisible = ref(false);

const toggleExpanded = () => {
  showExpanded.value = !showExpanded.value;
};

const tooltipContent = computed(() => {
  if (showExpanded.value) {
    return "收起";
  }
  return "展开";
});

const triggerIconClass = computed(() => ({
  "is-expanded": showExpanded.value,
}));

onMounted(() => {
  if (props.isExpanded !== undefined) {
    showExpanded.value = props.isExpanded;
  }
});

/** 表单模式下每项的左侧标签宽度 */
const labelWidth = "100px";
</script>

<template>
  <ModernLayout v-if="layout === 'modern'" :is-expanded="isExpanded" :show-search="showSearch" :bordered="bordered" :mode="mode" :show-label="showLabel">
    <slot />
  </ModernLayout>

  <transition v-else name="el-zoom-in-bottom">
    <div v-show="showSearch" :class="['koi-search', { 'koi-search--bordered': bordered, 'koi-search--form': mode === 2 }]">
      <el-collapse-transition>
        <div v-if="showExpanded" class="koi-search__content" :style="mode === 2 ? { '--label-width': labelWidth } : {}">
          <slot />
        </div>
      </el-collapse-transition>
      <div class="koi-search__footer">
        <div class="koi-search__spacer" />
        <el-tooltip :content="tooltipContent" placement="left" :show-after="100" popper-class="koi-search__tooltip">
          <div
            class="koi-search__trigger"
            @click="toggleExpanded"
            :class="{ 'koi-search__trigger--label': showLabel }"
          >
            <slot name="action">
              <el-icon :size="16" :class="triggerIconClass">
                <ArrowDown />
              </el-icon>
              <span v-if="showLabel" class="koi-search__label">
                {{ tooltipContent }}
              </span>
            </slot>
          </div>
        </el-tooltip>
      </div>
    </div>
  </transition>
</template>

<style scoped lang="scss">
.koi-search {
  margin: 5px 6px 0;
  padding: 12px 20px 0;
  overflow: hidden;
  color: var(--theme-color-text, #303133);
  background-color: var(--theme-color-bg-container, #ffffff);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.koi-search--bordered {
  border: 1px solid var(--theme-color-border, #e5e7ed);
}

.koi-search__content {
  padding: 0 0 8px;
}

/** 表单模式：标签 + 组件网格 */
.koi-search--form {
  .koi-search__content {
    padding: 0 0 12px;
  }

  /* 表单模式：每个直接子元素作为一行，左侧标签右侧组件 */
  :deep(> *:not(.el-row)) {
    display: grid;
    grid-template-columns: var(--label-width) 1fr;
    align-items: center;
    gap: 12px;
    padding: 6px 0;
  }
}

.koi-search__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 6px 0 10px;
}

.koi-search__spacer {
  flex: 1;
}

.koi-search__trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: var(--el-color-primary);
  border-radius: 4px;
  user-select: none;
  white-space: nowrap;

  &:hover {
    background-color: var(--el-color-primary-light-9);
  }

  .el-icon {
    transition: transform 0.3s ease;

    &.is-expanded {
      transform: rotate(180deg);
    }
  }
}

.koi-search__trigger--label {
  padding: 4px 12px;
}

.koi-search__label {
  font-size: 13px;
}

.koi-search__tooltip {
  font-size: 12px;
}
</style>
