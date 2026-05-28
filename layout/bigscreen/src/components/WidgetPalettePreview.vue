<template>
  <div class="palette-preview">
    <!-- 优先渲染真实 scifi 组件 -->
    <div v-if="liveComp" class="palette-preview__stage" :style="stageStyle">
      <component :is="liveComp" v-bind="liveProps" />
    </div>
    <!-- CSS fallback 缩略图 -->
    <div v-else class="palette-preview__css" :class="cssClass">
      <svg v-if="isPanel" class="pp-svg" viewBox="0 0 180 80" preserveAspectRatio="none">
        <rect x="1" y="1" width="178" height="78" :stroke="panelColor" stroke-width="1" fill="none" opacity="0.6" />
        <line x1="8" y1="2" x2="50" y2="2" :stroke="panelColor" stroke-width="2" opacity="0.8" />
        <line x1="1" y1="8" x2="1" y2="35" :stroke="panelColor" stroke-width="2" opacity="0.8" />
        <rect x="0" y="0" width="180" height="80" :fill="panelColor" opacity="0.08" />
      </svg>
      <svg v-else-if="isHeader" class="pp-svg" viewBox="0 0 180 60" preserveAspectRatio="none">
        <rect x="0" y="20" width="180" height="24" fill="#00f6ff" opacity="0.1" />
        <line x1="0" y1="20" x2="180" y2="20" stroke="#00f6ff" stroke-width="1" opacity="0.6" />
        <line x1="0" y1="44" x2="180" y2="44" stroke="#00f6ff" stroke-width="1" opacity="0.6" />
      </svg>
      <div v-else-if="isGeometry" class="pp-geo">
        <div class="pp-geo__shape" :class="`pp-geo__shape--${geoShape}`" />
      </div>
      <svg v-else-if="isDecoration" class="pp-svg" viewBox="0 0 180 30" preserveAspectRatio="none">
        <line x1="4" y1="15" x2="176" y2="15" stroke="#00f6ff" stroke-width="1.5" opacity="0.5" />
        <rect x="0" y="10" width="8" height="10" fill="#00f6ff" opacity="0.6" />
        <rect x="172" y="10" width="8" height="10" fill="#00f6ff" opacity="0.6" />
        <circle cx="90" cy="15" r="3" fill="#00f6ff" opacity="0.4" />
      </svg>
      <div v-else-if="isPanelTitle" class="pp-panel-title">
        <span class="pp-panel-title__text">Title</span>
      </div>
      <div v-else class="pp-generic">
        <span>{{ variant }}</span>
      </div>
    </div>
    <!-- 变体标签 -->
    <span class="pp-variant">{{ variant }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from "vue";
import type { WidgetTypeDefinition } from "../types/widget";
import BigScreenScrollingText from "./BigScreenScrollingText.vue";
import BigScreenIframe from "./BigScreenIframe.vue";

const CUSTOM: Record<string, unknown> = {
  BigScreenScrollingText,
  BigScreenIframe,
};

const props = defineProps<{
  typeDef: WidgetTypeDefinition;
  variant: string;
}>();

const category = computed(() => props.typeDef.category);
const type = computed(() => props.typeDef.type);
const isPanel = computed(() => category.value === "panel");
const isHeader = computed(() => category.value === "header");
const isGeometry = computed(() => category.value === "geometry");
const isDecoration = computed(() => category.value === "decoration");
const isPanelTitle = computed(() => category.value === "panel-title");
const geoShape = computed(() => props.variant.toLowerCase());

const liveComp = computed(() => {
  const name = props.typeDef.renderComponent(props.variant);
  if (CUSTOM[name]) return CUSTOM[name];
  try {
    const c = resolveComponent(name);
    // resolveComponent 在找不到时返回字符串（原生元素名），需要过滤
    if (typeof c === "string") return null;
    return c;
  } catch {
    return null;
  }
});

const liveProps = computed(() => {
  const cat = category.value;
  const base: Record<string, unknown> = {};
  if (cat === "panel") {
    base.glow = true;
    base["glow-opacity"] = 0.5;
    base["background-opacity"] = 0.3;
    base.title = "";
  }
  if (cat === "header") {
    base.title = "标题";
    base["sub-title"] = "SUBTITLE";
  }
  if (cat === "geometry") {
    base.glow = true;
    base["glow-opacity"] = 0.6;
    base.width = 80;
    base.height = 80;
  }
  if (cat === "decoration") {
    base.width = "160px";
    base.height = 16;
  }
  return base;
});

const stageStyle = computed(() => {
  const cat = category.value;
  if (cat === "panel") return { width: "400px", height: "300px", transform: "scale(0.42)", transformOrigin: "top left" };
  if (cat === "header") return { width: "400px", height: "70px", transform: "scale(0.42)", transformOrigin: "top left" };
  if (cat === "geometry") return { width: "80px", height: "80px", transform: "scale(0.9)", transformOrigin: "center center" };
  if (cat === "decoration") return { width: "200px", height: "20px", transform: "scale(0.85)", transformOrigin: "top left" };
  return { width: "200px", height: "50px", transform: "scale(0.85)", transformOrigin: "top left" };
});

const panelColor = computed(() => {
  const v = props.variant;
  if (v.startsWith("DV")) return "#22d3ee";
  if (v.startsWith("B")) return "#a855f7";
  return "#00f6ff";
});

const cssClass = computed(() => `pp-css--${category.value}`);
</script>

<style lang="scss" scoped>
.palette-preview {
  width: 100%;
  height: 80px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: rgba(0, 10, 25, 0.3);
  pointer-events: none;
}

.palette-preview__stage {
  pointer-events: none;
}

.pp-variant {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 9px;
  font-family: "JetBrains Mono", monospace;
  color: rgba(255, 255, 255, 0.25);
  background: rgba(0, 0, 0, 0.5);
  padding: 0 4px;
  border-radius: 2px;
  line-height: 1.4;
}

// CSS fallback
.palette-preview__css {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pp-svg {
  width: 100%;
  height: 100%;
}

.pp-geo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  &__shape {
    &--hexagon {
      width: 34px;
      height: 34px;
      background: rgba(0, 246, 255, 0.15);
      clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
    }
    &--circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(0, 246, 255, 0.12);
      border: 1px solid rgba(0, 246, 255, 0.4);
    }
    &--diamond {
      width: 32px;
      height: 32px;
      background: rgba(0, 246, 255, 0.12);
      transform: rotate(45deg);
    }
    &--triangle {
      width: 0;
      height: 0;
      border-left: 18px solid transparent;
      border-right: 18px solid transparent;
      border-bottom: 32px solid rgba(0, 246, 255, 0.15);
    }
    &--line {
      width: 50px;
      height: 2px;
      background: rgba(0, 246, 255, 0.5);
    }
    &--parallelogram {
      width: 38px;
      height: 24px;
      background: rgba(0, 246, 255, 0.12);
      transform: skewX(-15deg);
    }
    &--rectangle {
      width: 36px;
      height: 24px;
      background: rgba(0, 246, 255, 0.12);
      border: 1px solid rgba(0, 246, 255, 0.4);
    }
    &--trapezoid {
      width: 36px;
      height: 0;
      border-left: 8px solid transparent;
      border-right: 8px solid transparent;
      border-bottom: 24px solid rgba(0, 246, 255, 0.15);
    }
  }
}

.pp-generic {
  font-size: 16px;
  color: rgba(0, 246, 255, 0.3);
  font-family: "JetBrains Mono", monospace;
  font-weight: 700;
}

.pp-panel-title {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  &__text {
    font-size: 14px;
    font-weight: 600;
    color: rgba(0, 246, 255, 0.6);
    letter-spacing: 2px;
    text-transform: uppercase;
  }
}
</style>
