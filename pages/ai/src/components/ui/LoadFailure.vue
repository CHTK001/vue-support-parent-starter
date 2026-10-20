<template>
  <!--
    统一的「加载失败」占位：接口出错时不要和「确实没有数据」长得一样。
    role="alert" 让读屏用户在进入该区域时立刻听到失败原因。
  -->
  <div class="load-failure" role="alert">
    <el-icon :size="24" class="lf-icon"><WarningOutlined /></el-icon>
    <p class="lf-title">{{ title || '加载失败' }}</p>
    <p v-if="message" class="lf-desc">{{ message }}</p>
    <el-button size="small" round class="lf-retry" @click="$emit('retry')">重试</el-button>
  </div>
</template>

<script setup lang="ts">
import { WarningOutlined } from '@vicons/antd'

defineOptions({ name: 'LoadFailure' })

defineProps<{
  /** 失败标题，缺省「加载失败」 */
  title?: string
  /** 失败原因（后端 message 或兜底文案） */
  message?: string
}>()

defineEmits<{ (e: 'retry'): void }>()
</script>

<style scoped>
.load-failure {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 40px 20px;
  text-align: center;
  border: 1px dashed var(--color-surface-border);
  border-radius: calc(var(--size-surface-radius) + 4px);
}
.lf-icon { color: var(--el-color-warning); }
.lf-title {
  margin: 2px 0 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.lf-desc {
  margin: 0;
  max-width: 460px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--color-text-gray);
  word-break: break-word;
}
.lf-retry { margin-top: 6px; }
</style>
