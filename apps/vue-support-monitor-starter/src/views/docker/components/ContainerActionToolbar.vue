<template>
  <div class="container-action-toolbar">
    <div class="toolbar-left">
      <el-button type="primary" @click="handleCreate">
        <IconifyIconOnline icon="ri:add-line" class="mr-1" />
        创建容器
      </el-button>
      <el-button @click="handleRefresh">
        <IconifyIconOnline icon="ri:refresh-line" class="mr-1" />
        刷新
      </el-button>
      <el-button @click="handleAutoRefresh">
        <IconifyIconOnline 
          :icon="autoRefresh ? 'ri:pause-line' : 'ri:play-line'" 
          class="mr-1" 
        />
        {{ autoRefresh ? '暂停自动刷新' : '自动刷新' }}
      </el-button>
    </div>
    
    <div class="toolbar-right">
      <el-button @click="handleExport">
        <IconifyIconOnline icon="ri:download-line" class="mr-1" />
        导出数据
      </el-button>
      <el-dropdown @command="handleCommand">
        <el-button>
          更多操作
          <IconifyIconOnline icon="ri:arrow-down-s-line" class="ml-1" />
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="batchStart">
              <IconifyIconOnline icon="ri:play-line" class="mr-2" />
              批量启动
            </el-dropdown-item>
            <el-dropdown-item command="batchStop">
              <IconifyIconOnline icon="ri:stop-line" class="mr-2" />
              批量停止
            </el-dropdown-item>
            <el-dropdown-item command="batchRestart">
              <IconifyIconOnline icon="ri:restart-line" class="mr-2" />
              批量重启
            </el-dropdown-item>
            <el-dropdown-item command="batchRemove" divided>
              <IconifyIconOnline icon="ri:delete-bin-line" class="mr-2" />
              批量删除
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Emits {
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'auto-refresh', enabled: boolean): void
  (e: 'export'): void
  (e: 'batch-operation', command: string): void
}

const emit = defineEmits<Emits>()

const autoRefresh = ref(false)

// 创建容器
const handleCreate = () => {
  emit('create')
}

// 刷新
const handleRefresh = () => {
  emit('refresh')
}

// 自动刷新
const handleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value
  emit('auto-refresh', autoRefresh.value)
}

// 导出数据
const handleExport = () => {
  emit('export')
}

// 处理下拉菜单命令
const handleCommand = (command: string) => {
  emit('batch-operation', command)
}
</script>

<style scoped>
.container-action-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e4e7ed;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .container-action-toolbar {
    flex-direction: column;
    gap: 16px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
    flex-wrap: wrap;
  }
}
</style>