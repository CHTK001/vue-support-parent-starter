<template>
  <ScOperationMonitor
    title="Docker操作"
    icon="ri:docker-line"
    position="bottom-right"
    :offset-x="20"
    :offset-y="20"
    theme-color="#2496ED"
    :operations="operationList"
    empty-text="暂无操作"
    @clear="handleClear"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { ScOperationMonitor } from '@repo/components';
import { useDockerOperationStore } from '@/stores/dockerOperation';

/**
 * Docker操作监控组件
 * 使用通用ScOperationMonitor组件，显示在右下角
 * @author CH
 * @version 1.1.0
 * @since 2025-12-01
 */

const store = useDockerOperationStore();

// 转换操作列表格式
const operationList = computed(() => 
  store.operations.map(op => ({
    id: op.id,
    type: op.type,
    title: op.title,
    description: op.description,
    status: op.status,
    progress: op.progress,
    error: op.error,
    createdAt: op.createdAt,
    updatedAt: op.updatedAt,
  }))
);

// 清除已完成的操作
const handleClear = () => {
  store.clearCompleted();
};
</script>
