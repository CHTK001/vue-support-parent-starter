<template>
  <div class="sc-time-text-root flex flex-col items-start gap-1" :class="rootClass">
    <!-- 相对时间 + Tooltip 悬浮提示 -->
    <el-tooltip
      :content="modelValue || 'No date available'"
      placement="top"
      effect="light"
    >
      <span class="relative-time inline-flex items-center text-sm">
        {{ displayTimeAgo }}
      </span>
    </el-tooltip>

    <!-- 原始日期（灰色小字，可选显示） -->
    <span
      v-if="modelValue"
      class="absolute-time text-gray-400 text-xs whitespace-nowrap"
    >
      {{ modelValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { getTimeAgo } from "@repo/utils";
import { ElTooltip } from 'element-plus';

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  skin: {
    type: String,
    default: "",
  },
});

const rootClass = computed(() => ({}));

const displayTimeAgo = computed<string>(() => {
  if (!props.modelValue) return "N/A";
  try {
    const result = getTimeAgo(props.modelValue);
    return result || "Invalid Date";
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error";
  }
});
</script>

<style scoped>
.relative-time {
  font-weight: 500;
  color: #374151;
  cursor: help;
  transition: color 0.2s ease;
}

.relative-time:hover {
  color: #165dff;
}

.absolute-time {
  line-height: 1.2;
}

</style>