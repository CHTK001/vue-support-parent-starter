<template>
  <span class="guide-label">
    <span class="guide-label__text">{{ label }}</span>
    <el-tooltip content="查看填写说明" placement="top">
      <button type="button" class="guide-label__button" @click.stop="$emit('open')">
        <el-icon><QuestionFilled /></el-icon>
      </button>
    </el-tooltip>
  </span>
</template>

<script setup lang="ts">
import { QuestionFilled } from "@element-plus/icons-vue";

defineProps<{
  label: string;
}>();

defineEmits<{
  open: [];
}>();
</script>

<style scoped>
.guide-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  line-height: 1.2;
}

.guide-label__text {
  color: #5c4b3f;
}

.guide-label__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border: none;
  border-radius: 999px;
  padding: 0;
  background: rgba(191, 132, 69, 0.14);
  color: #b35f18;
  cursor: pointer;
  transition: transform 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.guide-label__button:hover {
  transform: translateY(-1px);
  background: rgba(191, 132, 69, 0.24);
  color: #8c470d;
}
</style>
