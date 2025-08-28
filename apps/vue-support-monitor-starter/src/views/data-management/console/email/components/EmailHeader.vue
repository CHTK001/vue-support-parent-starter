<template>
  <div class="email-header">
    <div class="header-left">
      <IconifyIconOnline icon="ri:mail-line" class="email-icon" />
      <h2 class="email-title">邮箱控制台</h2>
    </div>
    <div class="header-right">
      <el-button type="primary" :icon="useRenderIcon('ri:add-line')" @click="handleCompose">撰写邮件</el-button>
      <el-button :icon="useRenderIcon('ri:refresh-line')" @click="handleRefresh">刷新</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

// 定义事件
const emit = defineEmits<{
  compose: [];
  refresh: [];
}>();

// 事件处理
function handleCompose() {
  emit('compose');
}

function handleRefresh() {
  emit('refresh');
}
</script>

<style scoped>
.email-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.email-icon {
  font-size: 24px;
  color: #409eff;
}

.email-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  gap: 12px;
}
</style>