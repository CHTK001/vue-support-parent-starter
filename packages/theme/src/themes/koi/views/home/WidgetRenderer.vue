<template>
  <div class="widget-renderer" :style="{ boxShadow: shadowCss }">
    <component
      :is="loader.Component"
      v-if="loader.state === 'ready' && loader.Component"
      :widget="widget"
    />
    <div v-else-if="loader.state === 'loading'" class="widget-renderer__loading" aria-busy="true">
      <el-icon class="widget-renderer__loading-icon" :size="22">
        <Loading />
      </el-icon>
      <span class="widget-renderer__loading-text">{{ widget.title }} 加载中…</span>
    </div>
    <div v-else class="widget-renderer__error" role="alert">
      <el-icon :size="22"><WarningFilled /></el-icon>
      <span>{{ widget.title }} 加载失败</span>
      <ReButton link type="primary" @click="loader.reload()">重试</ReButton>
    </div>
  </div>
</template>

<script setup lang="ts" name="WidgetRenderer">
/**
 * Widget 渲染调度器
 *
 * 按 widget.type 异步加载对应组件：
 *   - calendar  → ./widgets/CalendarWidget.vue  (el-calendar + IndexedDB)
 *   - custom    → ./widgets/CustomWidget.vue    (iframe)
 *
 * 组件本身在首次需要时按需 import，组件内部还自带加载动画。
 * 加载 / 失败状态由本组件负责占位，避免空白。
 */
import { defineAsyncComponent, computed } from "vue";
import { Loading, WarningFilled } from "@element-plus/icons-vue";
import { useWidgetLoader } from "./useWidgetLoader";
import { WIDGET_SHADOW_MAP, type WidgetShadowLevel } from "./widgets";
import type { WidgetItem } from "./types";

const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));

const props = defineProps<{ widget: WidgetItem }>();

const loader = useWidgetLoader(() => props.widget.type);

/** 由 widget 外观配置解析 box-shadow（未配置时默认无阴影） */
const shadowCss = computed(() => {
  const level = props.widget.appearance?.shadow ?? "none";
  return WIDGET_SHADOW_MAP[level] ?? WIDGET_SHADOW_MAP.none;
});
</script>

<style lang="scss" scoped>
.widget-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  min-height: 0;
}

.widget-renderer__loading,
.widget-renderer__error {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 16px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.widget-renderer__loading-icon {
  color: var(--el-color-primary);
  animation: widget-renderer-spin 1.2s linear infinite;
}

.widget-renderer__error {
  color: var(--el-color-danger);
  flex-direction: row;
}

@keyframes widget-renderer-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
