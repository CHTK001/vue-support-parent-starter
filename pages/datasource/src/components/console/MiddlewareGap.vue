<template>
  <div v-if="text" class="mw-gap">
    <ReIcon name="WarningFilled" :size="14" class="mw-gap-icon" />
    <span class="mw-gap-text">{{ text }}</span>
    <ReButton link :show-text="true" @click="$emit('retry')">重试</ReButton>
  </div>
</template>

<script setup lang="ts">
/**
 * 中间件管理页的数据来源提示条：后端接口缺失或目标服务不可达时摊开原因。
 * @author CH
 * @since 4.0.0
 */
import ReButton from "@repo/ui/re-button";
import ReIcon from "@repo/ui/re-icon";
defineProps<{ text: string }>();
defineEmits<{ (e: "retry"): void }>();
</script>

<style scoped>
.mw-gap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  margin-bottom: 12px;
  border: 1px solid var(--brand-warning, #f59e0b);
  border-radius: 8px;
  background: var(--bg-warning, rgba(245, 158, 11, 0.08));
  color: var(--text-primary);
  font-size: 13px;
}

.mw-gap-icon {
  color: var(--brand-warning, #f59e0b);
  flex-shrink: 0;
}

.mw-gap-text {
  flex: 1;
}
</style>
