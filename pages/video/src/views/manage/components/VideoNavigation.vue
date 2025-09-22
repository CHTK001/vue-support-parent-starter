<template>
  <div class="video-nav">
    <div class="video-nav__category">
      <!-- 首页选项 -->
      <div class="video-nav__item" :class="{ 'video-nav__item--active': activeTab === 'home' }" @click="handleHomeClick">
        <IconifyIconOnline icon="ep:house" :size="18" />
        <span>首页</span>
      </div>

      <div v-for="category in categories" :key="category.value" :class="['video-nav__item', { 'video-nav__item--active': modelValue === category.value && activeTab !== 'home' }]" @click="handleCategoryClick(category)">
        <IconifyIconOnline v-if="category.icon" :icon="category.icon" :size="18" />
        <span>{{ category.label }}</span>
      </div>
      <div class="video-nav__search">
        <el-input v-model="searchKeyword" placeholder="请输入视频名称、演员、导演等关键词" class="video-nav__input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
        <el-button type="primary" class="video-nav__button" @click="handleSearch">
          <IconifyIconOnline icon="ep:search" />
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { videoCategories } from "../../../data/categories";

// 定义组件属性
const props = defineProps<{
  modelValue?: string;
}>();

// 定义组件事件
const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "search", keyword: string): void;
  (e: "category-change", category: string): void;
  (e: "home-click"): void;
}>();

const router = useRouter();
const route = useRoute();

// 搜索关键词状态
const searchKeyword = ref("");

// 当前活动标签（home或分类）
const activeTab = ref("");

// 分类数据 - 去掉"全部"选项
const categories = ref(videoCategories.filter((item) => item.value !== null));

/**
 * 处理首页点击事件
 */
const handleHomeClick = () => {
  activeTab.value = "home";
  // 触发首页点击事件，通知父组件显示VideoSearchHome
  emit("home-click");
  // 清空路由参数并确保跳转到视频首页
  router.push({
    path: "/video/home",
    replace: true,
  });
};

/**
 * 处理分类点击事件
 * @param category 被点击的分类项
 */
const handleCategoryClick = (category) => {
  activeTab.value = "category";
  emit("update:modelValue", category.value);
  // 添加新的事件，用于通知父组件分类变化
  emit("category-change", category.value);
};

/**
 * 处理搜索事件
 */
const handleSearch = () => {
  if (!searchKeyword.value.trim()) return;
  emit("search", searchKeyword.value);
};

/**
 * 初始化导航状态
 */
const initNavState = () => {
  // 根据当前路由判断应该激活哪个标签
  const path = route.path;
  const query = route.query;

  if (path === "/video" && !query.keyword && !query.type) {
    activeTab.value = "home";
  } else {
    activeTab.value = "category";
  }
};

// 组件挂载时初始化状态
onMounted(() => {
  initNavState();
});

// 监听路由变化
watch(
  () => route,
  () => {
    initNavState();
  },
  { deep: true }
);
</script>

<style lang="scss" scoped>
.video-nav {
  &__category {
    display: flex;
    background-color: var(--el-bg-color);
    border-radius: 12px;
    padding: 12px 20px;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    overflow-x: auto;
    position: sticky;
    top: 0;
    z-index: 10;
    flex-wrap: wrap;
    align-items: center;
  }

  &__item {
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

    &--active {
      color: var(--el-text-color-primary);
      background-color: var(--el-color-primary);
      font-weight: 500;
      box-shadow: 0 3px 8px rgba(var(--el-color-primary-rgb), 0.25);
    }
  }

  &__search {
    display: flex;
    margin-left: auto;
  }

  &__input {
    width: 300px;

    :deep(.el-input__wrapper) {
      border-radius: 20px 0 0 20px;
    }
  }

  &__button {
    border-radius: 0 20px 20px 0;
    padding: 0 20px;
  }
}

@media (max-width: 768px) {
  .video-nav {
    &__search {
      width: 100%;
      margin-top: 12px;
      margin-left: 0;
    }

    &__input {
      width: 100%;
    }

    &__category {
      flex-wrap: nowrap;
      overflow-x: auto;
      justify-content: flex-start;
    }
  }
}
</style>
