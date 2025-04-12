<script setup>
import { ref, computed, watch } from 'vue';
import { config } from '../column';

// 定义组件属性
const props = defineProps({
  currentPage: { type: Number, default: 1 },
  pageSize: { type: Number, default: config.pageSize },
  pageSizes: { type: Array, default: () => config.pageSizes },
  total: { type: Number, default: 0 },
  layout: { type: String, default: config.paginationLayout },
  paginationType: { type: String, default: "default" }, // 分页类型：default-当前分页，scroll-滚动分页
  loading: { type: Boolean, default: false },
  hidePagination: { type: Boolean, default: false }
});

// 定义组件事件
const emit = defineEmits(['update:currentPage', 'current-change', 'update:pageSize', 'size-change', 'load-more']);

// 响应式数据
const currentPageValue = ref(props.currentPage);
const pageSizeValue = ref(props.pageSize);

// 监听属性变化
watch(() => props.currentPage, (newValue) => {
  currentPageValue.value = newValue;
}, { immediate: true });

watch(() => props.pageSize, (newValue) => {
  pageSizeValue.value = newValue;
}, { immediate: true });

// 分页点击
const handleCurrentChange = (page) => {
  currentPageValue.value = page;
  emit('update:currentPage', page);
  emit('current-change', page);
};

// 条数变化
const handleSizeChange = (size) => {
  pageSizeValue.value = size;
  emit('update:pageSize', size);
  emit('size-change', size);
};

// 加载更多数据（滚动分页）
const loadMore = () => {
  if (props.paginationType !== 'scroll') return;
  emit('load-more');
};
</script>

<template>
  <div class="pagination-container">
    <!-- 标准分页 -->
    <el-pagination 
      v-if="!props.hidePagination && props.paginationType === 'default'" 
      v-model:currentPage="currentPageValue" 
      background 
      :small="false"
      :layout="props.layout" 
      :total="props.total" 
      :page-size="pageSizeValue" 
      :page-sizes="props.pageSizes"
      @current-change="handleCurrentChange" 
      @update:page-size="handleSizeChange" 
    />
    
    <!-- 滚动加载更多按钮 -->
    <div v-if="props.paginationType === 'scroll' && !props.hidePagination" class="load-more-container">
      <el-button 
        v-if="currentPageValue * pageSizeValue < props.total" 
        type="primary" 
        :loading="props.loading"
        @click="loadMore"
      >
        加载更多
      </el-button>
      <span v-else class="no-more-text">没有更多数据了</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.pagination-container {
  display: flex;
  justify-content: start;
  align-items: center;
  padding: 10px 0;
}

.load-more-container {
  display: flex;
  justify-content: center;
  margin-top: 10px;
  
  .no-more-text {
    color: var(--el-text-color-secondary);
    font-size: 14px;
  }
}
</style>