<template>
  <el-dialog v-model="dialogVisible" :title="software.softServiceName + ' 详情'" width="50%" top="10px">
    <div class="software-detail">
      <div class="detail-header">
        <el-image :src="software.softServiceLogo" fit="contain" style="width: 60px; height: 60px" class="software-logo">
          <template #error>
            <div class="app-logo-fallback" style="width: 60px; height: 60px">
              <IconifyIconOnline icon="ep:picture" />
            </div>
          </template>
        </el-image>
        <div class="detail-title">
          <h2>{{ software.softServiceName }}</h2>
          <div class="detail-meta">
            <el-tag size="small" type="primary">{{ getCategoryName(software.softServiceCategory) }}</el-tag>
            <el-tag size="small" type="success">v{{ software.softServiceVersion }}</el-tag>
          </div>
        </div>
      </div>

      <el-divider />

      <div class="detail-content">
        <h3>软件描述</h3>
        <p>{{ software.softServiceRemark || '暂无描述' }}</p>

        <h3>安装信息</h3>
        <div class="detail-info-grid">
          <div class="detail-info-item">
            <IconifyIconOnline icon="ep:folder" class="mr-2" />
            <span class="detail-info-label">安装路径:</span>
            <span class="detail-info-value">{{ software.installPath || "默认路径" }}</span>
          </div>
          <div class="detail-info-item">
            <IconifyIconOnline icon="ep:connection" class="mr-2" />
            <span class="detail-info-label">端口:</span>
            <span class="detail-info-value">{{ software.port || "自动分配" }}</span>
          </div>
        </div>

        <h3>系统要求</h3>
        <div class="requirements-card">
          <p>{{ software.requirements || "无特殊要求" }}</p>
        </div>
        
        <h3>统计信息</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ software.installCount || 0 }}</div>
            <div class="stat-label">
              <IconifyIconOnline icon="ep:download" class="mr-1" />
              安装次数
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ software.favoriteCount || 0 }}</div>
            <div class="stat-label">
              <IconifyIconOnline icon="ep:star" class="mr-1" />
              收藏数
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="handleInstall" class="install-btn">
          <IconifyIconOnline icon="ep:download" class="mr-1" />安装
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue'
import type { PartialSoftService } from '@/api/soft'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  software: {
    type: Object as () => PartialSoftService,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'install', 'close'])

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// 获取分类名称
const getCategoryName = (category: string) => {
  if (!category) return "未分类"
  
  const categories = [
    { label: "全部", value: "all" },
    { label: "数据库", value: "database" },
    { label: "Web服务器", value: "web_server" },
    { label: "开发工具", value: "development" },
    { label: "监控工具", value: "monitoring" },
    { label: "容器", value: "container" },
    { label: "其他", value: "other" }
  ]
  
  const found = categories.find((item) => item.value === category)
  return found ? found.label : "未知"
}

// 处理安装
const handleInstall = () => {
  emit('install', props.software)
}

// 处理关闭
const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
.software-detail {
  .detail-header {
    display: flex;
    align-items: center;
    padding: 20px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;

    .software-logo {
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .detail-title {
      margin-left: 20px;

      h2 {
        margin: 0 0 10px 0;
        font-weight: 600;
        font-size: 20px;
      }

      .detail-meta {
        display: flex;
        align-items: center;
        gap: 12px;

        .el-tag {
          padding: 0 10px;
        }
      }
    }
  }

  .detail-content {
    padding: 20px 0;
    
    h3 {
      margin: 24px 0 12px 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      position: relative;
      padding-left: 12px;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 4px;
        height: 16px;
        width: 3px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
      }
    }

    p {
      margin: 8px 0;
      color: var(--el-text-color-secondary);
      line-height: 1.8;
      font-size: 14px;
    }
    
    .detail-info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 12px;
      
      .detail-info-item {
        display: flex;
        align-items: center;
        padding: 12px;
        background-color: var(--el-fill-color-light);
        border-radius: 6px;
        
        .detail-info-label {
          margin-right: 8px;
          color: var(--el-text-color-secondary);
          font-weight: 500;
        }
        
        .detail-info-value {
          color: var(--el-text-color-primary);
        }
      }
    }
    
    .requirements-card {
      background-color: var(--el-fill-color-light);
      border-radius: 6px;
      padding: 16px;
      margin-top: 12px;
      
      p {
        margin: 0;
      }
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 12px;
      
      .stat-card {
        background-color: var(--el-fill-color-light);
        border-radius: 6px;
        padding: 16px;
        text-align: center;
        transition: all 0.3s;
        
        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: var(--el-color-primary);
          margin-bottom: 8px;
        }
        
        .stat-label {
          font-size: 14px;
          color: var(--el-text-color-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }
  }
}

.install-btn {
  padding: 10px 20px;
  font-weight: 500;
  border-radius: 6px;
  
  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

.app-logo-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  border-radius: 8px;
  
  .iconify {
    font-size: 24px;
  }
}
</style> 