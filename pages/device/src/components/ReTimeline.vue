<template>
  <el-card class="shadow-sm rounded-xl p-4">
    <div class="flex items-center justify-between mb-3">
      <span class="text-sm font-medium text-el-text">{{ title }}</span>
      <el-button text @click="emit('refresh')">
        <el-icon class="mr-1"><Refresh /></el-icon>刷新
      </el-button>
    </div>
    <el-timeline>
      <el-timeline-item
        v-for="item in items"
        :key="item.id"
        :timestamp="item.time"
        placement="top"
        :type="item.type"
      >
        <div class="text-sm text-el-text">{{ item.content }}</div>
      </el-timeline-item>
      <el-empty v-if="items.length === 0" description="暂无记录" :image-size="60" />
    </el-timeline>
  </el-card>
</template>

<script setup lang="ts">
import { Refresh } from '@element-plus/icons-vue'
import type { TimelineItem } from '@/types/device'

defineProps<{
  title?: string
  items: TimelineItem[]
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
}>()
</script>
