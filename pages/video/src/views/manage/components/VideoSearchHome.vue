<template>
  <div class="video-search-home">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="bg-circle bg-circle-1"></div>
      <div class="bg-circle bg-circle-2"></div>
      <div class="bg-circle bg-circle-3"></div>
    </div>

    <div class="search-container">
      <!-- Logo 和标题 -->
      <div class="brand-section">
        <div class="logo-wrapper">
          <div class="logo-icon">
            <IconifyIconOnline icon="ri:movie-2-line" />
          </div>
          <div class="logo-glow"></div>
        </div>
        <h1 class="brand-title">影视搜索</h1>
        <p class="brand-subtitle">发现精彩影视内容，开启视觉盛宴</p>
      </div>

      <!-- 搜索框 -->
      <div class="search-box">
        <div class="search-input-wrapper">
          <IconifyIconOnline icon="ri:search-line" class="search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索电影、电视剧、演员、导演..."
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">
            <IconifyIconOnline icon="ri:search-line" />
            <span>搜索</span>
          </button>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div class="hot-section">
        <div class="hot-header">
          <div class="hot-icon">
            <IconifyIconOnline icon="ri:fire-fill" />
          </div>
          <span class="hot-title">热门搜索</span>
        </div>
        <div class="hot-tags">
          <button
            v-for="(item, index) in hotSearchKeywords"
            :key="item.value"
            class="hot-tag"
            :class="{ 'is-top': index < 3 }"
            @click="handleHotTagClick(item.value)"
          >
            <span class="tag-rank" v-if="index < 3">{{ index + 1 }}</span>
            <span class="tag-text">{{ item.label }}</span>
          </button>
        </div>
      </div>

      <!-- 快捷分类 -->
      <div class="quick-categories">
        <div
          v-for="category in quickCategories"
          :key="category.value"
          class="category-item"
          @click="handleHotTagClick(category.value)"
        >
          <div class="category-icon" :style="{ background: category.gradient }">
            <IconifyIconOnline :icon="category.icon" />
          </div>
          <span class="category-name">{{ category.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/utils";
import { ref } from "vue";
import { getVideoHotKeywords } from "../../../api/video";
import { hotSearchKeywords } from "../../../data/categories";

// 定义组件事件
const emit = defineEmits<{
  (e: "search", keyword: string): void;
}>();

// 搜索关键词
const searchKeyword = ref("");

// 快捷分类
const quickCategories = [
  {
    label: "电影",
    value: "电影",
    icon: "ri:film-line",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    label: "电视剧",
    value: "电视剧",
    icon: "ri:tv-line",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    label: "综艺",
    value: "综艺",
    icon: "ri:star-smile-line",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    label: "动漫",
    value: "动漫",
    icon: "ri:ghost-smile-line",
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
  {
    label: "纪录片",
    value: "纪录片",
    icon: "ri:vidicon-line",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  },
  {
    label: "短剧",
    value: "短剧",
    icon: "ri:clapperboard-line",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
  },
];

/**
 * 处理热门标签点击
 * @param keyword 关键词
 */
const handleHotTagClick = (keyword: string) => {
  searchKeyword.value = keyword;
  handleSearch();
};

/**
 * 处理搜索
 */
const handleSearch = () => {
  emit("search", searchKeyword.value.trim());
};

/**
 * 获取热门搜索关键词
 */
const fetchHotKeywords = () => {
  getVideoHotKeywords()
    .then((res) => {
      if (res.code === 0 && res.data) {
        // 如果API返回成功，可以使用返回的数据替换本地数据
        // 这里暂时保留本地数据
      } else {
        console.error("获取热门搜索关键词API返回错误:", res.msg);
      }
    })
    .catch((error) => {
      console.error("获取热门搜索关键词失败:", error);
      message("获取热门搜索关键词失败", { type: "error" });
    });
};

// 初始化
fetchHotKeywords();
</script>

<style lang="scss" scoped>
.video-search-home {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 24px;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  overflow: hidden;
}

// 背景装饰
.bg-decoration {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.bg-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.4;
  animation: float 20s ease-in-out infinite;
}

.bg-circle-1 {
  width: 500px;
  height: 500px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  top: -150px;
  right: -100px;
  animation-delay: 0s;
}

.bg-circle-2 {
  width: 400px;
  height: 400px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  bottom: -100px;
  left: -100px;
  animation-delay: -7s;
}

.bg-circle-3 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-30px) scale(1.05);
  }
}

// 搜索容器
.search-container {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 品牌区域
.brand-section {
  text-align: center;
  margin-bottom: 48px;
}

.logo-wrapper {
  position: relative;
  display: inline-flex;
  margin-bottom: 20px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  color: #fff;
  box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
  animation: pulse 2s ease-in-out infinite;
}

.logo-glow {
  position: absolute;
  inset: -10px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 30px;
  filter: blur(20px);
  opacity: 0.5;
  z-index: -1;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

@keyframes glow {
  from {
    opacity: 0.3;
  }
  to {
    opacity: 0.6;
  }
}

.brand-title {
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.brand-subtitle {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  letter-spacing: 1px;
}

// 搜索框
.search-box {
  width: 100%;
  margin-bottom: 32px;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 60px;
  padding: 8px 8px 8px 24px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  &:hover,
  &:focus-within {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  }
}

.search-icon {
  font-size: 22px;
  color: rgba(255, 255, 255, 0.6);
  margin-right: 12px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  height: 48px;
  border: none;
  background: transparent;
  font-size: 16px;
  color: #fff;
  outline: none;

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
}

.search-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 48px;
  padding: 0 28px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 30px;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
  }

  &:active {
    transform: scale(0.98);
  }
}

// 热门搜索
.hot-section {
  width: 100%;
  margin-bottom: 40px;
}

.hot-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.hot-icon {
  width: 28px;
  height: 28px;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
}

.hot-title {
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.hot-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hot-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.2);
    color: #fff;
    transform: translateY(-2px);
  }

  &.is-top {
    background: rgba(102, 126, 234, 0.2);
    border-color: rgba(102, 126, 234, 0.3);
  }

  &.is-top .tag-rank {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
}

.tag-rank {
  width: 18px;
  height: 18px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
}

.tag-text {
  line-height: 1;
}

// 快捷分类
.quick-categories {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
  width: 100%;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
  }

  &:hover .category-icon {
    box-shadow: 0 12px 28px rgba(0, 0, 0, 0.3);
  }
}

.category-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  color: #fff;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.category-name {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

// 响应式设计
@media (max-width: 768px) {
  .brand-title {
    font-size: 32px;
  }

  .brand-subtitle {
    font-size: 14px;
  }

  .logo-icon {
    width: 64px;
    height: 64px;
    font-size: 32px;
  }

  .search-input-wrapper {
    padding: 6px 6px 6px 16px;
  }

  .search-input {
    height: 42px;
    font-size: 14px;
  }

  .search-btn {
    height: 42px;
    padding: 0 20px;
    font-size: 14px;

    span {
      display: none;
    }
  }

  .quick-categories {
    grid-template-columns: repeat(3, 1fr);
  }

  .category-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }

  .bg-circle-1 {
    width: 300px;
    height: 300px;
  }

  .bg-circle-2 {
    width: 250px;
    height: 250px;
  }

  .bg-circle-3 {
    width: 200px;
    height: 200px;
  }
}

@media (max-width: 480px) {
  .video-search-home {
    padding: 24px 16px;
  }

  .brand-title {
    font-size: 28px;
  }

  .hot-tags {
    gap: 8px;
  }

  .hot-tag {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>
