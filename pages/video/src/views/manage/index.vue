<template>
  <div class="video-search-results">
    <div class="nav flex justify-between">
      <div class="category-nav">
        <div v-for="category in videoCategories" :key="category.value" :class="['category-item', { active: selectedCategories === category.value }]" @click="handleCategoryClick(category)">
          <IconifyIconOnline v-if="category.icon" :icon="category.icon" :size="18" />
          <span>{{ category.label }}</span>
        </div>
      </div>
      <div class="search-box flex justify-start items-center">
        <el-input v-model="searchKeyword" placeholder="请输入视频名称、演员、导演等关键词" class="search-input h-[38px]" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
        <el-button type="primary" class="search-button !h-[38px] !w-[48px] m-4" @click="handleSearch">
          <IconifyIconOnline icon="ep:search" />
        </el-button>
      </div>
    </div>
    <Search ref="searchRef" :keyword="searchKeyword" :category="selectedCategories"></Search>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { videoCategories } from "../../data/categories";
import Search from "../search/search.vue";

const searchRef = ref();
const selectedCategories = ref("ALL");
const searchKeyword = ref("");

// 处理分类点击
const handleCategoryClick = (category: any): void => {
  selectedCategories.value = category.value;
  searchRef.value.handleSearch();
};

const handleSearch = () => {
  searchRef.value.handleSearch();
};
</script>
<style lang="scss" scoped>
.video-search-results {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.category-nav {
  display: flex;
  min-height: 70px;
  overflow: hidden;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  padding: 12px 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  overflow-x: auto;
  position: sticky;
  top: 0;
  z-index: 10;
  flex-wrap: wrap;
  align-items: center;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  margin: 4px 8px 4px 0;
  font-size: 15px;
  cursor: pointer;
  white-space: nowrap;
  border-radius: 30px;
  transition: all 0.3s;
  gap: 6px;

  &:hover {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }

  &.active {
    color: white;
    background-color: var(--el-color-primary);
    font-weight: 500;
    box-shadow: 0 3px 8px rgba(var(--el-color-primary-rgb), 0.25);
  }
}
</style>
