<script setup lang="ts">
/**
 * 日志级别标签：按 --log-level-* 着色（见 styles/logger.css）。
 * 未知级别原样展示、走默认（无色）样式。
 */
import { computed } from "vue";
import { normLevel } from "../api/logger";

const props = defineProps<{ level?: string }>();

const normalized = computed(() => normLevel(props.level));
const levelClass = computed(() => `log-level-tag--${normalized.value.toLowerCase()}`);
</script>

<template>
  <span class="log-level-tag" :class="levelClass">{{ normalized }}</span>
</template>
