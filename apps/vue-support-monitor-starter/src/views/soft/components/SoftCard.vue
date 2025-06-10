```vue
<template>
  <el-card class="software-card" shadow="hover">
    <div class="software-icon">
      <el-avatar :size="60" :icon="software.softServiceLogo" >
        <template #error>
          <IconifyIconOnline icon="mdi:package-variant" style="font-size: 24px; color: #ccc;" />
        </template>
        </el-avatar>
    </div>
    <div class="software-info">
      <h3>{{ software.softServiceName }}</h3>
      <p class="software-desc">{{ software.softServiceRemark }}</p>
      <div class="software-meta">
        <el-tag size="small" type="info">{{ software.softServiceVersion }}</el-tag>
        <el-tag size="small">{{ software.softServiceCategory }}</el-tag>
      </div>
      <div class="software-actions">
        <el-button-group>
          <el-button type="primary" @click="emit('install', software)">安装</el-button>
          <el-button type="warning" @click="emit('edit', software)">编辑</el-button>
          <el-button type="danger" @click="emit('delete', software)">删除</el-button>
        </el-button-group>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import type { SoftService } from '@/api/soft'

defineProps<{
  software: SoftService
}>()

const emit = defineEmits<{
  (e: 'install', software: SoftService): void
  (e: 'edit', software: SoftService): void 
  (e: 'delete', software: SoftService): void
}>()
</script>

<style lang="scss" scoped>
.software-card {
  height: 100%;
  
  .software-icon {
    text-align: center;
    margin-bottom: 16px;
  }

  .software-info {
    h3 {
      font-size: 16px;
      margin-bottom: 8px;
    }

    .software-desc {
      color: #666;
      font-size: 14px;
      margin-bottom: 16px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .software-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .software-actions {
      display: flex;
      justify-content: flex-end;
    }
  }
}
</style>
```
