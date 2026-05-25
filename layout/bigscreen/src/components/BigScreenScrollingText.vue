<template>
  <div
    class="bs-scrolling-text"
    :style="containerStyle"
    ref="containerRef"
  >
    <div
      class="bs-scrolling-text__track"
      :style="trackStyle"
      :class="{ 'bs-scrolling-text__track--vertical': direction === 'up' || direction === 'down' }"
    >
      <span class="bs-scrolling-text__content" :style="textStyle">{{ displayContent }}</span>
      <span v-if="!isVertical" class="bs-scrolling-text__content" :style="textStyle">{{ displayContent }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    content?: string;
    speed?: number;
    direction?: string;
    fontSize?: number;
    color?: string;
  }>(),
  {
    content: "这是一条滚动公告信息...",
    speed: 50,
    direction: "left",
    fontSize: 16,
    color: "#00f6ff",
  }
);

const containerRef = ref<HTMLElement>();

const displayContent = computed(() => props.content || "这是一条滚动公告信息...");
const isVertical = computed(() => props.direction === "up" || props.direction === "down");

const containerStyle = computed(() => ({
  width: "100%",
  height: "100%",
  overflow: "hidden",
  display: "flex",
  alignItems: "center",
}));

const animDuration = computed(() => {
  const len = displayContent.value.length;
  const charWidth = props.fontSize * 0.6;
  const totalWidth = len * charWidth;
  return Math.max(totalWidth / props.speed, 3);
});

const trackStyle = computed(() => {
  if (isVertical.value) {
    return {
      animation: `bs-scroll-${props.direction} ${animDuration.value}s linear infinite`,
    };
  }
  return {
    display: "inline-flex",
    whiteSpace: "nowrap" as const,
    animation: `bs-scroll-${props.direction} ${animDuration.value}s linear infinite`,
  };
});

const textStyle = computed(() => ({
  fontSize: `${props.fontSize}px`,
  color: props.color,
  whiteSpace: "nowrap" as const,
  paddingRight: "4em",
  textShadow: `0 0 8px ${props.color}40`,
}));
</script>

<style scoped>
.bs-scrolling-text {
  position: relative;
}

.bs-scrolling-text__track {
  display: inline-flex;
  white-space: nowrap;
  will-change: transform;
}

.bs-scrolling-text__track--vertical {
  flex-direction: column;
  writing-mode: horizontal-tb;
}

.bs-scrolling-text__content {
  display: inline-block;
  line-height: 1.4;
}

@keyframes bs-scroll-left {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

@keyframes bs-scroll-right {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(0);
  }
}

@keyframes bs-scroll-up {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

@keyframes bs-scroll-down {
  0% {
    transform: translateY(-50%);
  }
  100% {
    transform: translateY(0);
  }
}
</style>
