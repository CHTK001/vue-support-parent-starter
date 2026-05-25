<template>
  <div class="widget-renderer">
    <component
      v-if="resolvedComponent"
      :is="resolvedComponent"
      v-bind="componentProps"
    >
      <!-- 对接 scifi 组件的 title slot -->
      <template v-if="widget.title && (typeDef?.category === 'header' || typeDef?.category === 'panel-title')" #title>
        <span>{{ widget.title }}</span>
      </template>
    </component>
    <div v-else class="widget-renderer__unknown">
      未识别: {{ widget.type }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from "vue";
import type { WidgetConfig } from "../types/widget";
import { getWidgetType } from "../composables/useWidgetRegistry";
import BigScreenScrollingText from "./BigScreenScrollingText.vue";
import BigScreenIframe from "./BigScreenIframe.vue";

const customComponents: Record<string, unknown> = {
  BigScreenScrollingText,
  BigScreenIframe,
};

const props = defineProps<{
  widget: WidgetConfig;
}>();

const typeDef = computed(() => getWidgetType(props.widget.type));

const resolvedComponent = computed(() => {
  const def = typeDef.value;
  if (!def) return null;
  const name = def.renderComponent(props.widget.variant);
  if (customComponents[name]) return customComponents[name];
  try {
    return resolveComponent(name);
  } catch {
    return null;
  }
});

const componentProps = computed(() => {
  const w = props.widget;
  const base: Record<string, unknown> = {};

  // 外观共用属性
  if (w.glow !== undefined) base.glow = w.glow;
  if (w.glowOpacity !== undefined) base["glow-opacity"] = w.glowOpacity;
  if (w.backgroundOpacity !== undefined)
    base["background-opacity"] = w.backgroundOpacity;
  if (w.decorationColorAlt !== undefined)
    base["decoration-color-alt"] = w.decorationColorAlt;

  // 面板/header 标题
  if (
    w.title &&
    (typeDef.value?.category === "panel" ||
      typeDef.value?.category === "header" ||
      typeDef.value?.category === "panel-title")
  ) {
    base.title = w.title;
  }

  // 几何图形宽高
  if (w.type === "geometry") {
    base.width = w.rect.width;
    base.height = w.rect.height;
  }

  // 装饰线条宽高
  if (w.type === "decoration") {
    base.width = `${w.rect.width}px`;
    base.height = w.rect.height;
  }

  // header sub-title
  if (w.type === "header") {
    base["sub-title"] = w.icon || "";
  }

  // 滚动字幕
  if (w.type === "scrolling-text" && w.scrollingText) {
    Object.assign(base, {
      content: w.scrollingText.content,
      speed: w.scrollingText.speed,
      direction: w.scrollingText.direction,
      "font-size": w.scrollingText.fontSize,
      color: w.scrollingText.color,
    });
  }

  // iframe
  if (w.type === "iframe" && w.iframe) {
    Object.assign(base, {
      src: w.iframe.src,
      "allow-fullscreen": w.iframe.allowFullscreen,
      sandbox: w.iframe.sandbox,
    });
  }

  return base;
});
</script>

<style scoped>
.widget-renderer {
  width: 100%;
  height: 100%;
}

.widget-renderer__unknown {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 0, 0, 0.1);
  border: 1px dashed rgba(255, 0, 0, 0.3);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
</style>
