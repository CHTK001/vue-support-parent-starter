<template>
  <div class="widget-renderer" :style="{
      boxShadow: shadowCss,
      borderRadius: radiusCss,
      overflowX: overflowX,
      overflowY: overflowY,
    }">
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
    <!--
      占位卡片：当前 app 未注册该 type（通常是贡献它的 pages 模块没被这个 app 引入）。
      刻意不提供「重试」—— 未注册时重试永远不会成功，给一个必然无效的按钮比不给更糟。
      卡片与网格位置都保留，切回启用了该模块的 app 即可复原。
    -->
    <div v-else-if="loader.state === 'unregistered'" class="widget-renderer__placeholder">
      <el-icon class="widget-renderer__placeholder-icon" :size="22">
        <Box />
      </el-icon>
      <span class="widget-renderer__placeholder-title">{{ widget.title }}</span>
      <span class="widget-renderer__placeholder-hint">{{ placeholderHint }}</span>
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
import { Box, Loading, WarningFilled } from "@element-plus/icons-vue";
import { useWidgetLoader } from "./useWidgetLoader";
import { WIDGET_SHADOW_MAP, type WidgetShadowLevel } from "./widgets";
import type { WidgetItem } from "./types";

const ReButton = defineAsyncComponent(() => import("@repo/ui/re-button").then((m) => m.default));

const props = defineProps<{ widget: WidgetItem }>();

const loader = useWidgetLoader(() => props.widget.type);

/**
 * 占位卡片的说明文案。
 *
 * <p>{@code WidgetItem.source} 随布局持久化，记录该 widget 由哪个模块贡献 ——
 * 正因为它写在存档里，缺少该模块的 app 才能说出「由 collect 模块提供」，而不是
 * 一句「未知组件」。内置 widget 在所有 app 中都可用，走不到这个分支，故无 source。</p>
 */
const placeholderHint = computed(() =>
  props.widget.source
    ? `该组件由「${props.widget.source}」模块提供，当前应用未启用`
    : "该组件在当前应用未启用",
);

/** 由 widget 外观配置解析 box-shadow（未配置时默认无阴影） */
const shadowCss = computed(() => {
  const level = props.widget.appearance?.shadow ?? "none";
  return WIDGET_SHADOW_MAP[level] ?? WIDGET_SHADOW_MAP.none;
});

/** 卡片圆角（默认 12px，与 widget 内部容器 border-radius 一致） */
const radiusCss = computed(() => {
  const r = props.widget.appearance?.borderRadius;
  return r != null ? r + "px" : "12px";
});

const overflowX = computed(() => props.widget.appearance?.showHorizontalScrollbar ? "auto" : "hidden");
const overflowY = computed(() => props.widget.appearance?.showVerticalScrollbar ? "auto" : "hidden");
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
.widget-renderer__placeholder,
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

/* 占位卡片：中性灰（缺模块是「暂缺」而非「故障」，不该染上危险色） */
.widget-renderer__placeholder {
  gap: 6px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  margin: 4px;
}

.widget-renderer__placeholder-icon {
  color: var(--el-text-color-placeholder);
}

.widget-renderer__placeholder-title {
  color: var(--el-text-color-regular);
  font-weight: 600;
}

.widget-renderer__placeholder-hint {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  line-height: 1.6;
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
