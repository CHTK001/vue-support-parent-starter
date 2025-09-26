<template>
  <div class="io-data">
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

<style scoped>
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
</style>