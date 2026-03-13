<template>
  <el-card class="task-card" shadow="hover">
    <template #header>
      <div class="card-header">
        <span class="task-name">{{ task.syncTaskName }}</span>
        <el-tag :type="getStatusType(task.syncTaskStatus)" size="small">
          {{ getStatusText(task.syncTaskStatus) }}
        </el-tag>
      </div>
    </template>

    <div class="card-content">
      <p class="task-desc">{{ task.syncTaskDesc || '暂无描述' }}</p>
      
      <div class="task-info">
        <div class="info-item">
          <span class="label">数据源:</span>
          <span class="value">{{ task.syncTaskSourceType || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">目标源:</span>
          <span class="value">{{ task.syncTaskTargetType || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="label">最后运行:</span>
          <span class="value">{{ task.syncTaskLastRunTime || '-' }}</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="card-actions">
        <el-button size="small" @click="$emit('design', task)">设计</el-button>
        <el-button 
          size="small" 
          type="success" 
          @click="$emit('start', task)"
          :disabled="task.syncTaskStatus === 'RUNNING'"
        >
          启动
        </el-button>
        <el-button 
          size="small" 
          type="warning" 
          @click="$emit('stop', task)"
          :disabled="task.syncTaskStatus !== 'RUNNING'"
        >
          停止
        </el-button>
        <el-button size="small" type="danger" @click="$emit('delete', task)">删除</el-button>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
defineProps<{
  task: any;
}>();

defineEmits<{
  design: [task: any];
  start: [task: any];
  stop: [task: any];
  delete: [task: any];
}>();

const getStatusType = (status: string) => {
  const map: Record<string, any> = {
    RUNNING: 'success',
    STOPPED: 'info',
    FAILED: 'danger',
  };
  return map[status] || 'info';
};

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    RUNNING: '运行中',
    STOPPED: '已停止',
    FAILED: '失败',
  };
  return map[status] || status;
};
</script>

<style scoped lang="scss">
.task-card {
  height: 100%;
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    .task-name {
      font-weight: bold;
      font-size: 16px;
    }
  }
  
  .card-content {
    .task-desc {
      color: #606266;
      margin-bottom: 15px;
      min-height: 40px;
    }
    
    .task-info {
      .info-item {
        display: flex;
        margin-bottom: 8px;
        
        .label {
          color: #909399;
          width: 80px;
        }
        
        .value {
          color: #606266;
          flex: 1;
        }
      }
    }
  }
  
  .card-actions {
    display: flex;
    justify-content: space-between;
  }
}
</style>
