<template>
  <div class="software-info detail-card">
    <div class="section-title mb-4 flex ">
      <IconifyIconOnline icon="ep:info-filled" class="mr-2 text-primary text-xl" />
      <span>软件信息</span>
    </div>
    
    <el-scrollbar height="300px" class="software-scrollbar">
      <div class="software-detail-section">
        <div class="flex items-center mb-4 software-header">
          <div class="flex items-center">
            <el-avatar :src="software.softServiceLogo" :alt="software.softServiceName" shape="square" :size="60" class="mr-4 software-logo">
              <IconifyIconOnline icon="ep:software" />
            </el-avatar>
            <div>
              <h3 class="text-xl font-semibold mb-1">{{ software.softServiceName }}</h3>
              <div class="flex items-center text-sm text-gray-500">
                <el-tag size="small" type="success" class="mr-1">v{{ software.softServiceVersion }}</el-tag>
                <span class="mx-2">·</span>
                <el-tag size="small" type="info">{{ software.softServiceCategory }}</el-tag>
              </div>
            </div>
          </div>
        </div>
        
        <div class="detail-card mb-4">
          <h4 class="detail-subtitle">软件描述</h4>
          <p class="detail-text">{{ software.softServiceRemark || "暂无描述" }}</p>
        </div>
        
        <div class="detail-card">
          <h4 class="detail-subtitle">系统要求</h4>
          <div class="requirements-content">
            <p>{{ software.requirements || "无特殊要求" }}</p>
          </div>
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { PartialSoftService } from '@/api/soft'

const props = defineProps({
  software: {
    type: Object as () => PartialSoftService,
    required: true
  }
})
</script>

<style lang="scss" scoped>
.software-info {
  margin-bottom: 24px;
}

.software-scrollbar {
  :deep(.el-scrollbar__bar) {
    width: 6px;
    
    &.is-horizontal {
      height: 6px;
    }
  }
}

.software-header {
  padding-bottom: 16px;
  border-bottom: 1px dashed var(--el-border-color-light);
}

.software-logo {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--el-border-color-light);
}

.detail-card {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid var(--el-border-color-lighter);
}

.detail-subtitle {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;
  position: relative;
  padding-left: 10px;
  
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 4px;
    height: 14px;
    width: 3px;
    background-color: var(--el-color-primary);
    border-radius: 2px;
  }
  
  &:first-child {
    margin-top: 0;
  }
}

.detail-text {
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.requirements-content {
  font-size: 13px;
  
  p {
    margin: 0;
    color: var(--el-text-color-regular);
    line-height: 1.6;
  }
}
</style> 