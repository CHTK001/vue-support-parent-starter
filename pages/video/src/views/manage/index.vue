<template>
  <div class="system-container modern-bg">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-header-content">
        <IconifyIconOnline icon="ri:video-line" class="page-header-icon" />
        <div>
          <h2 class="page-header-title">视频管理</h2>
          <p class="page-header-desc">浏览、搜索和管理您的视频资源</p>
        </div>
      </div>
      <div class="page-header-actions">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频..."
          clearable
          style="width: 280px"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><IconifyIconOnline icon="ep:search" /></el-icon>
          </template>
        </el-input>
      </div>
    </div>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <span
        v-for="category in videoCategories"
        :key="category.value"
        :class="['tab', { active: selectedCategories === category.value }]"
        @click="handleCategoryClick(category)"
      >
        {{ category.label }}
      </span>
    </div>

    <!-- 内容区 -->
    <Search
      ref="searchRef"
      :keyword="searchKeyword"
      :category="selectedCategories"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from "vue";
import { videoCategories } from "../../data/categories";
import Search from "./search.vue";

const searchRef = ref();
const selectedCategories = ref("ALL");
const searchKeyword = ref("");

// 处理分类点击
const handleCategoryClick = async (category: any): Promise<void> => {
  selectedCategories.value = category.value;
  await nextTick();
  searchRef.value.handleSearch();
};

const handleSearch = () => {
  searchRef.value.handleSearch();
};
</script>

<style scoped lang="scss">
/* 页面头部 */
.page-header {
  background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.page-header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-header-icon {
  font-size: 48px;
  opacity: 0.9;
}

.page-header-title {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 600;
}

.page-header-desc {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 20px;
  background: var(--el-bg-color-overlay);
  border-radius: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tab {
  padding: 8px 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-weight: 500;
  border: 1px solid transparent;

  &:hover {
    color: var(--el-color-primary);
    background: rgba(var(--el-color-primary-rgb), 0.1);
    border-color: rgba(var(--el-color-primary-rgb), 0.2);
  }

  &.active {
    color: white;
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    box-shadow: 0 2px 8px rgba(var(--el-color-primary-rgb), 0.3);
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    padding: 20px;
  }

  .page-header-content {
    width: 100%;
  }

  .page-header-actions {
    width: 100%;
  }

  .page-header-actions .el-input {
    width: 100%;
  }

  .category-tabs {
    padding: 12px 16px;
  }
}
</style>
