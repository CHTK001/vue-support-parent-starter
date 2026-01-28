<template>
  <div class="io-data system-container modern-bg">
    <div class="io-item" v-if="readValue !== undefined">
      <span class="io-label">{{ readLabel }}:</span>
      <span class="io-value">{{ formatBytes(readValue) }}</span>
    </div>
    <div class="io-item" v-if="writeValue !== undefined">
      <span class="io-label">{{ writeLabel }}:</span>
      <span class="io-value">{{ formatBytes(writeValue) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

interface Props {
  readValue?: number
  writeValue?: number
  readLabel?: string
  writeLabel?: string
}

const props = defineProps<Props>()

const readLabel = props.readLabel || '读取'
const writeLabel = props.writeLabel || '写入'

const formatBytes = (bytes: number = 0) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  /* 渐变背景 */
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.io-data {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.io-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.io-label {
  color: #909399;
}

.io-value {
  color: #303133;
  font-weight: 500;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>