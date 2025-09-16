<template>
  <div class="video-search-home">
    <div class="video-search-home__container">
      <div class="video-search-home__title">影视搜索</div>
      <div class="video-search-home__box">
        <el-input v-model="searchKeyword" placeholder="请输入视频名称、演员、导演等关键词" class="video-search-home__input" clearable @keyup.enter="handleSearch">
          <template #prefix>
            <IconifyIconOnline icon="ep:search" />
          </template>
        </el-input>
        <el-button type="primary" class="video-search-home__button" @click="handleSearch">
          <IconifyIconOnline icon="ep:search" />
          搜索
        </el-button>
      </div>

      <!-- 热门搜索标签 -->
      <div class="video-search-home__hot">
        <div class="video-search-home__hot-title">
          <IconifyIconOnline icon="ri:fire-line" />
          热门搜索:
        </div>
        <div class="video-search-home__hot-tags">
          <el-tag v-for="item in hotSearchKeywords" :key="item.value" class="video-search-home__hot-tag" @click="handleHotTagClick(item.value)">
            {{ item.label }}
          </el-tag>
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
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #e0f2ff 0%, #f0f9ff 100%);

  &__container {
    width: 100%;
    max-width: 800px;
  }

  &__title {
    font-size: 48px;
    font-weight: bold;
    color: var(--el-color-primary);
    margin-bottom: 40px;
    text-align: center;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &__box {
    display: flex;
    width: 100%;
    margin-bottom: 30px;
  }

  &__input {
    flex: 1;

    :deep(.el-input__wrapper) {
      height: 56px;
      border-radius: 28px 0 0 28px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
  }

  &__button {
    height: 56px;
    border-radius: 0 28px 28px 0;
    padding: 0 30px;
    font-size: 18px;
  }

  &__hot {
    display: flex;
    flex-direction: column;
    width: 100%;
    background-color: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }

  &__hot-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: bold;
    color: var(--el-text-color-primary);
    margin-bottom: 15px;

    .iconify-icon-online {
      color: var(--el-color-danger);
      margin-right: 8px;
    }
  }

  &__hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  &__hot-tag {
    cursor: pointer;
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 20px;
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-color-primary);
      color: white;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .video-search-home {
    &__title {
      font-size: 36px;
    }

    &__button {
      padding: 0 20px;
    }
  }
}
</style>
