<template>
  <div class="video-manage">
    <!-- 顶部栏 -->
    <header class="header">
      <div class="header-left">
        <h1 class="title">视频管理</h1>
      </div>
      <div class="header-right">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索视频..."
            clearable
            @keyup.enter="handleSearch"
          >
            <template #suffix>
              <IconifyIconOnline
                icon="ep:search"
                class="search-icon"
                @click="handleSearch"
              />
            </template>
          </el-input>
        </div>
      </div>
    </header>

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

<style scoped>
.video-manage {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 顶部栏 */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.search-box {
  width: 280px;
}

.search-box :deep(.el-input__wrapper) {
  border-radius: 20px;
}

.search-icon {
  cursor: pointer;
  color: #999;
}

.search-icon:hover {
  color: #1890ff;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #eee;
  flex-wrap: wrap;
}

.tab {
  padding: 6px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.2s;
}

.tab:hover {
  color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.tab.active {
  color: #fff;
  background: #1890ff;
}
</style>
