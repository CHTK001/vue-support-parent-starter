<template>
  <el-header class="content-header">
    <div class="flex justify-between items-center w-full">
      <div class="search-filter flex items-center gap-4">
        <el-input 
          :model-value="keyword" 
          @update:model-value="(val) => $emit('update:keyword', val)"
          class="!w-[280px] search-input" 
          placeholder="搜索软件名称" 
          clearable 
          @input="handleSearch"
        >
          <template #prefix>
            <IconifyIconOnline icon="ep:search" class="search-icon" />
          </template>
        </el-input>
        <el-select 
          :model-value="sort" 
          @update:model-value="(val) => $emit('update:sort', val)"
          class="!w-[120px]" 
          placeholder="排序方式" 
          @change="handleSearch"
        >
          <el-option label="默认排序" value="default" />
          <el-option label="最新" value="newest" />
          <el-option label="最热" value="popular" />
        </el-select>
      </div>
      <el-button type="primary" class="add-button" @click="$emit('add')">
        <IconifyIconOnline icon="ep:plus" />新增软件
      </el-button>
    </div>
  </el-header>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  keyword: {
    type: String,
    default: ''
  },
  sort: {
    type: String,
    default: 'default'
  }
});

const emit = defineEmits(['update:keyword', 'update:sort', 'search', 'add']);

// 处理搜索
const handleSearch = () => {
  emit('search');
};
</script>

<style lang="scss" scoped>
.content-header {
  border-bottom: 1px solid var(--el-border-color-light);
  height: auto;
  background-color: var(--el-bg-color);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  z-index: 1;
  padding: 16px 20px;

  .search-input {
    :deep(.el-input__wrapper) {
      padding-left: 12px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
      transition: all 0.3s;

      &:hover,
      &:focus,
      &.is-focus {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }
    }

    .search-icon {
      color: var(--el-text-color-secondary);
      font-size: 18px;
      margin-right: 6px;
    }
  }

  .add-button {
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: 500;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}
</style> 