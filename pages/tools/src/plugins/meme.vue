<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
import { http } from "@repo/utils";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 防抖搜索函数
const debounceSearch = (value) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    searchMemes();
  }, 500);
};

/**
 * 获取分类图标
 * @param {string} category - 分类名称
 * @returns {string} - 图标名称
 */
const getCategoryIcon = (category) => {
  switch (category) {
    case "热门":
      return "ri:fire-fill";
    case "搞笑":
      return "ri:emotion-laugh-line";
    case "动物":
      return "ri:bear-smile-line";
    case "动漫":
      return "ri:gamepad-line";
    case "人物":
      return "ri:user-smile-line";
    case "情感":
      return "ri:heart-3-fill";
    case "反应":
      return "ri:emotion-2-line";
    case "问号":
      return "ri:question-mark";
    default:
      return "ri:image-line";
  }
};

// API配置
const API_CONFIG = {
  // 表情包搜索API
  MEME_SEARCH_API: "https://api.vvhan.com/api/tao",
  // 热门表情包API
  MEME_HOT_API: "https://api.vvhan.com/api/moyu",
};

// 环境变量
const env = reactive({
  loading: false,
  searchLoading: false,
  searchKeyword: "",
  selectedCategory: "全部",
  searchResults: [],
  favorites: [],
  history: [],
  categories: [
    { label: "全部", value: "全部", icon: "ri:apps-line" },
    { label: "热门", value: "热门", icon: "ri:fire-fill" },
    { label: "搞笑", value: "搞笑", icon: "ri:emotion-laugh-line" },
    { label: "动物", value: "动物", icon: "ri:bear-smile-line" },
    { label: "动漫", value: "动漫", icon: "ri:gamepad-line" },
    { label: "人物", value: "人物", icon: "ri:user-smile-line" },
    { label: "情感", value: "情感", icon: "ri:heart-3-fill" },
    { label: "反应", value: "反应", icon: "ri:emotion-2-line" },
    { label: "问号", value: "问号", icon: "ri:question-mark" },
  ],
  // 后备模拟数据，在API请求失败时使用
  mockMemes: [
    {
      id: 1,
      url: "https://pic1.zhimg.com/v2-3c11f3939a7c10d7a8518e0988723846_r.jpg",
      title: "滑稽",
      category: "搞笑",
      tags: ["滑稽", "微笑", "黄脸"],
    },
    {
      id: 2,
      url: "https://pic1.zhimg.com/v2-b1f3d3c2c2e7a28a8fa3e89fd7df1ada_r.jpg",
      title: "狗头",
      category: "动物",
      tags: ["狗头", "微笑", "坏笑"],
    },
    {
      id: 3,
      url: "https://pic2.zhimg.com/v2-b64bebec12fb6d7dcca148d8e3ca5c13_r.jpg",
      title: "猫咪",
      category: "动物",
      tags: ["猫咪", "可爱", "疑惑"],
    },
    {
      id: 4,
      url: "https://pic1.zhimg.com/v2-2a8b76afeeee2d9a7b5b5a3d4a33b40c_r.jpg",
      title: "惊讶",
      category: "反应",
      tags: ["惊讶", "震惊", "吃惊"],
    },
    {
      id: 5,
      url: "https://pic1.zhimg.com/v2-1f3ae93a108a26b0ef7b08e1b12e85d8_r.jpg",
      title: "问号脸",
      category: "问号",
      tags: ["问号", "疑惑", "不解"],
    },
    {
      id: 6,
      url: "https://pic1.zhimg.com/v2-8d6d2c7d0d8f51a9b673bd40e4c4ea46_r.jpg",
      title: "哭泣",
      category: "情感",
      tags: ["哭泣", "伤心", "难过"],
    },
    {
      id: 7,
      url: "https://pic1.zhimg.com/v2-d41c2ceaed8f51a9b673bd40e4c4ea46_r.jpg",
      title: "柴犬",
      category: "动物",
      tags: ["柴犬", "狗", "可爱"],
    },
    {
      id: 8,
      url: "https://pic2.zhimg.com/v2-a2996f231d0fa8170f934494f5b8a3f0_r.jpg",
      title: "皮卡丘",
      category: "动漫",
      tags: ["皮卡丘", "宝可梦", "可爱"],
    },
    {
      id: 9,
      url: "https://pic1.zhimg.com/v2-5e0347c8a2a4c8c4888db1d3db738a8a_r.jpg",
      title: "熊猫头",
      category: "热门",
      tags: ["熊猫头", "恶搞", "搞笑"],
    },
    {
      id: 10,
      url: "https://pic1.zhimg.com/v2-224373208f7c4a53535f35f3f3bd7fa2_r.jpg",
      title: "小黄人",
      category: "动漫",
      tags: ["小黄人", "可爱", "电影"],
    },
    {
      id: 11,
      url: "https://pic1.zhimg.com/v2-5c25cbf3d5f01f566fbc86c5ca87a15c_r.jpg",
      title: "蘑菇头",
      category: "热门",
      tags: ["蘑菇头", "搞笑", "表情"],
    },
    {
      id: 12,
      url: "https://pic1.zhimg.com/v2-b1f3d3c2c2e7a28a8fa3e89fd7df1ada_r.jpg",
      title: "金馆长",
      category: "人物",
      tags: ["金馆长", "愤怒", "经典"],
    },
  ],
});

// 从API获取热门表情包
const fetchHotMemes = async () => {
  env.loading = true;
  try {
    const response = await http.get(API_CONFIG.MEME_HOT_API);
    if (response.data && response.data.url) {
      // 单个表情包返回处理
      const meme = {
        id: Date.now(),
        url: response.data.url,
        title: response.data.title || "热门表情",
        category: "热门",
        tags: ["热门", "摸鱼", "每日"],
      };
      env.searchResults = [meme, ...env.searchResults];
    }
  } catch (error) {
    console.error("获取热门表情包失败:", error);
    message(t("message.fetchError"), { type: "error" });
  } finally {
    env.loading = false;
  }
};

// 从API获取表情包
const fetchMemes = async (keyword = "") => {
  env.searchLoading = true;
  try {
    const params = keyword ? { key: keyword } : {};
    const response = await http.get(API_CONFIG.MEME_SEARCH_API, { params });

    if (response.data && response.data.imgurl) {
      // 处理API返回的数据
      const fetchedMemes = [];
      const meme = {
        id: Date.now(),
        url: response.data.imgurl,
        title: keyword || "表情包",
        category: assignRandomCategory(),
        tags: [keyword || "表情包", "搜索结果"],
      };
      fetchedMemes.push(meme);

      // 更新搜索结果
      if (fetchedMemes.length > 0) {
        env.searchResults = fetchedMemes;
      } else {
        // 如果API返回为空，使用模拟数据
        env.searchResults = [...env.mockMemes];
        message(t("message.noResults"), { type: "info" });
      }
    } else {
      // API返回结构不符合预期，使用模拟数据
      env.searchResults = [...env.mockMemes];
    }
  } catch (error) {
    console.error("获取表情包失败:", error);
    message(t("message.fetchError"), { type: "error" });
    // 使用模拟数据作为后备
    env.searchResults = [...env.mockMemes];
  } finally {
    env.searchLoading = false;
  }
};

// 随机分配一个分类（用于API返回的数据没有分类时）
const assignRandomCategory = () => {
  const categories = ["搞笑", "动物", "动漫", "人物", "情感", "反应", "问号"];
  const randomIndex = Math.floor(Math.random() * categories.length);
  return categories[randomIndex];
};

// 计算属性：过滤后的表情包
const filteredMemes = computed(() => {
  if (!env.searchResults.length) {
    return [];
  }
  if (env.selectedCategory === "全部") {
    return env.searchResults;
  }
  return env.searchResults.filter((meme) => meme.category === env.selectedCategory);
});

/**
 * 搜索表情包
 */
const searchMemes = () => {
  // 添加到搜索历史
  if (env.searchKeyword) {
    addToHistory(env.searchKeyword);
  }

  // 从API获取表情包
  fetchMemes(env.searchKeyword);
};

/**
 * 添加到历史记录
 * @param {string} keyword - 搜索关键词
 */
const addToHistory = (keyword) => {
  // 避免重复添加
  if (!env.history.includes(keyword)) {
    env.history.unshift(keyword);
    // 限制历史记录数量
    if (env.history.length > 10) {
      env.history.pop();
    }
  }
};

/**
 * 从历史记录中删除
 * @param {string} keyword - 要删除的关键词
 */
const removeFromHistory = (keyword) => {
  const index = env.history.indexOf(keyword);
  if (index > -1) {
    env.history.splice(index, 1);
  }
};

/**
 * 清空历史记录
 */
const clearHistory = () => {
  env.history = [];
  message(t("message.clearHistorySuccess"), { type: "success" });
};

/**
 * 添加到收藏
 * @param {Object} meme - 要收藏的表情包
 */
const addToFavorites = (meme) => {
  // 检查是否已经收藏
  const isAlreadyFavorite = env.favorites.some((item) => item.id === meme.id);
  if (!isAlreadyFavorite) {
    env.favorites.push(meme);
    message(t("message.addToFavoritesSuccess"), { type: "success" });
  } else {
    message(t("message.alreadyInFavorites"), { type: "warning" });
  }
};

/**
 * 从收藏中移除
 * @param {Object} meme - 要移除的表情包
 */
const removeFromFavorites = (meme) => {
  const index = env.favorites.findIndex((item) => item.id === meme.id);
  if (index > -1) {
    env.favorites.splice(index, 1);
    message(t("message.removeFromFavoritesSuccess"), { type: "success" });
  }
};

/**
 * 复制表情包链接到剪贴板
 * @param {string} url - 表情包URL
 */
const copyToClipboard = (url) => {
  navigator.clipboard
    .writeText(url)
    .then(() => {
      message(t("message.copySuccess"), { type: "success" });
    })
    .catch((err) => {
      console.error("复制失败:", err);
      message(t("message.copyError"), { type: "error" });
    });
};

/**
 * 下载表情包
 * @param {Object} meme - 要下载的表情包
 */
const downloadMeme = (meme) => {
  try {
    const link = document.createElement("a");
    link.href = meme.url;
    link.download = `${meme.title}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message(t("message.downloadSuccess"), { type: "success" });
  } catch (error) {
    console.error("下载失败:", error);
    message(t("message.downloadError"), { type: "error" });
  }
};

/**
 * 刷新获取新表情包
 */
const refreshMemes = () => {
  fetchHotMemes();
  message(t("message.refreshSuccess"), { type: "success" });
};

/**
 * 重置搜索
 */
const resetSearch = () => {
  env.searchKeyword = "";
  env.selectedCategory = "全部";
  searchMemes();
};

// 组件挂载时初始化
onMounted(() => {
  // 首次加载获取数据
  fetchMemes();
  // 获取热门表情包
  fetchHotMemes();
});
</script>

<template>
  <div class="meme-tool">
    <div class="meme-tool__content">
      <!-- 头部区域 -->
      <div class="meme-tool__header">
        <div class="meme-tool__header-content">
          <IconifyIconOnline icon="ri:emotion-laugh-fill" class="meme-tool__header-icon" />
          <div>
            <h2 class="meme-tool__header-title">斗图搜索引擎</h2>
            <p class="meme-tool__header-desc">快速搜索、收藏和分享你喜欢的表情包，让聊天更有趣！</p>
          </div>
        </div>
      </div>

      <!-- 搜索区域 -->
      <div class="meme-tool__search-container">
        <ScInput v-model="env.searchKeyword" placeholder="搜索表情包关键词，如：滑稽、狗头、熊猫..." clearable @input="debounceSearch" @clear="searchMemes" class="meme-tool__search-input">
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" />
          </template>
          <template #append>
            <ScButton :loading="env.searchLoading" @click="searchMemes">
              <IconifyIconOnline icon="ri:search-eye-line" />
              <span>搜索</span>
            </ScButton>
          </template>
        </ScInput>

        <!-- 历史记录下拉 -->
        <div v-if="env.history.length" class="meme-tool__search-history">
          <div class="meme-tool__search-history-header">
            <span>搜索历史</span>
            <ScButton type="danger" link size="small" @click="clearHistory">
              <IconifyIconOnline icon="ri:delete-bin-line" />
              <span>清空</span>
            </ScButton>
          </div>
          <div class="meme-tool__search-history-list">
            <div v-for="(item, index) in env.history" :key="index" class="meme-tool__search-history-item">
              <div
                class="meme-tool__search-history-keyword"
                @click="
                  env.searchKeyword = item;
                  searchMemes();
                "
              >
                <IconifyIconOnline icon="ri:history-line" />
                <span>{{ item }}</span>
              </div>
              <ScButton type="danger" link size="small" @click="removeFromHistory(item)">
                <IconifyIconOnline icon="ri:close-line" />
              </ScButton>
            </div>
          </div>
        </div>
      </div>

      <!-- 分类选择 -->
      <div class="meme-tool__categories">
        <div v-for="category in env.categories" :key="category.value" class="meme-tool__category-item" :class="{ 'meme-tool__category-item--active': env.selectedCategory === category.value }" @click="env.selectedCategory = category.value">
          <IconifyIconOnline :icon="category.icon" class="meme-tool__category-icon" />
          <span>{{ category.label }}</span>
        </div>
      </div>

      <ScRow :gutter="24">
        <!-- 表情包展示区域 -->
        <ScCol :xs="24" :sm="24" :md="16" :lg="18">
          <ScCard class="meme-tool__results-card" shadow="hover">
            <template #header>
              <div class="meme-tool__card-header">
                <IconifyIconOnline icon="ri:image-line" class="meme-tool__card-icon" />
                <span>表情包 ({{ filteredMemes.length }})</span>
                <div class="meme-tool__card-actions">
                  <ScButton type="success" link @click="refreshMemes" :loading="env.loading">
                    <IconifyIconOnline icon="ri:refresh-line" />
                    <span>换一换</span>
                  </ScButton>
                  <ScButton type="primary" link @click="resetSearch">
                    <IconifyIconOnline icon="ri:restart-line" />
                    <span>重置</span>
                  </ScButton>
                </div>
              </div>
            </template>

            <!-- 加载状态 -->
            <div v-if="env.searchLoading" class="meme-tool__loading">
              <el-skeleton :rows="3" animated />
            </div>

            <!-- 空状态 -->
            <ScEmpty v-else-if="!filteredMemes.length" description="没有找到相关表情包" class="meme-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:emotion-sad-line" class="meme-tool__empty-icon" />
              </template>
              <el-button-group>
                <ScButton type="primary" @click="resetSearch">重置搜索</ScButton>
                <ScButton type="success" @click="refreshMemes">换一张</ScButton>
              </el-button-group>
            </ScEmpty>

            <!-- 表情包网格 -->
            <div v-else class="meme-tool__grid">
              <div v-for="meme in filteredMemes" :key="meme.id" class="meme-tool__grid-item">
                <div class="meme-tool__meme-card">
                  <div class="meme-tool__meme-image-container">
                    <img :src="meme.url" :alt="meme.title" class="meme-tool__meme-image" />
                    <div class="meme-tool__meme-overlay">
                      <div class="meme-tool__meme-actions">
                        <ScButton type="primary" circle @click="copyToClipboard(meme.url)">
                          <IconifyIconOnline icon="ri:file-copy-line" />
                        </ScButton>
                        <ScButton type="success" circle @click="downloadMeme(meme)">
                          <IconifyIconOnline icon="ri:download-line" />
                        </ScButton>
                        <ScButton type="warning" circle @click="addToFavorites(meme)">
                          <IconifyIconOnline icon="ri:star-line" />
                        </ScButton>
                      </div>
                    </div>
                  </div>
                  <div class="meme-tool__meme-info">
                    <div class="meme-tool__meme-title">{{ meme.title }}</div>
                    <ScTag size="small" :type="meme.category === '热门' ? 'danger' : 'info'">
                      <IconifyIconOnline :icon="getCategoryIcon(meme.category)" />
                      {{ meme.category }}
                    </ScTag>
                  </div>
                  <div class="meme-tool__meme-tags">
                    <ScTag 
                      v-for="(tag, tagIndex) in meme.tags"
                      :key="tagIndex"
                      size="small"
                      effect="plain"
                      class="meme-tool__meme-tag"
                      @click="
                        env.searchKeyword = tag;
                        searchMemes();
                      "
                    >
                      #{{ tag }}
                    </ScTag>
                  </div>
                </div>
              </div>
            </div>
          </ScCard>
        </ScCol>

        <!-- 收藏夹区域 -->
        <ScCol :xs="24" :sm="24" :md="8" :lg="6">
          <ScCard class="meme-tool__favorites-card" shadow="hover">
            <template #header>
              <div class="meme-tool__card-header">
                <IconifyIconOnline icon="ri:star-line" class="meme-tool__card-icon" />
                <span>我的收藏 ({{ env.favorites.length }})</span>
              </div>
            </template>

            <!-- 空状态 -->
            <ScEmpty v-if="!env.favorites.length" description="暂无收藏表情包" class="meme-tool__empty">
              <template #image>
                <IconifyIconOnline icon="ri:star-line" class="meme-tool__empty-icon" />
              </template>
            </ScEmpty>

            <!-- 收藏列表 -->
            <div v-else class="meme-tool__favorites-list">
              <div v-for="meme in env.favorites" :key="meme.id" class="meme-tool__favorite-item">
                <div class="meme-tool__favorite-image-container">
                  <img :src="meme.url" :alt="meme.title" class="meme-tool__favorite-image" />
                </div>
                <div class="meme-tool__favorite-info">
                  <div class="meme-tool__favorite-title">{{ meme.title }}</div>
                  <div class="meme-tool__favorite-actions">
                    <ScButton type="primary" link size="small" @click="copyToClipboard(meme.url)">
                      <IconifyIconOnline icon="ri:file-copy-line" />
                    </ScButton>
                    <ScButton type="danger" link size="small" @click="removeFromFavorites(meme)">
                      <IconifyIconOnline icon="ri:delete-bin-line" />
                    </ScButton>
                  </div>
                </div>
              </div>
            </div>
          </ScCard>

          <!-- 使用技巧卡片 -->
          <ScCard class="meme-tool__tips-card" shadow="hover">
            <template #header>
              <div class="meme-tool__card-header">
                <IconifyIconOnline icon="ri:lightbulb-flash-line" class="meme-tool__card-icon" />
                <span>使用技巧</span>
              </div>
            </template>

            <div class="meme-tool__tips-list">
              <div class="meme-tool__tip-item">
                <IconifyIconOnline icon="ri:search-line" class="meme-tool__tip-icon" />
                <span>输入关键词搜索表情包</span>
              </div>
              <div class="meme-tool__tip-item">
                <IconifyIconOnline icon="ri:price-tag-3-line" class="meme-tool__tip-icon" />
                <span>点击标签快速搜索相关表情</span>
              </div>
              <div class="meme-tool__tip-item">
                <IconifyIconOnline icon="ri:star-line" class="meme-tool__tip-icon" />
                <span>收藏喜欢的表情包方便查找</span>
              </div>
              <div class="meme-tool__tip-item">
                <IconifyIconOnline icon="ri:file-copy-line" class="meme-tool__tip-icon" />
                <span>复制表情包链接到聊天工具</span>
              </div>
              <div class="meme-tool__tip-item">
                <IconifyIconOnline icon="ri:download-line" class="meme-tool__tip-icon" />
                <span>下载表情包到本地收藏</span>
              </div>
            </div>
          </ScCard>
        </ScCol>
      </ScRow>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.meme-tool {
  padding: 20px;

  &__content {
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.08);
    padding: 24px;
  }

  /* 头部样式 */
  &__header {
    background: linear-gradient(135deg, var(--el-color-warning-light-3) 0%, var(--el-color-warning) 100%);
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    color: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &__header-content {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  &__header-icon {
    font-size: 48px;
    opacity: 0.9;
  }

  &__header-title {
    margin: 0 0 8px 0;
    font-size: 24px;
    font-weight: 600;
  }

  &__header-desc {
    margin: 0;
    font-size: 14px;
    opacity: 0.9;
  }

  /* 搜索区域样式 */
  &__search-container {
    margin-bottom: 24px;
    position: relative;
  }

  &__search-input {
    width: 100%;

    :deep(.el-input__wrapper) {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
      padding: 12px;
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover,
      &.is-focus {
        box-shadow:
          0 4px 16px rgba(0, 0, 0, 0.12),
          0 0 0 1px var(--el-color-primary-light-5);
        transform: translateY(-2px);
      }
    }

    :deep(.el-input-group__append) {
      border-top-right-radius: 12px;
      border-bottom-right-radius: 12px;
      overflow: hidden;

      .el-button {
        border-radius: 0;
        padding: 12px 20px;
        display: flex;
        align-items: center;
        gap: 5px;
      }
    }
  }

  &__search-history {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    background-color: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    padding: 12px;
    margin-top: 8px;
    z-index: 10;
  }

  &__search-history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 8px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
  }

  &__search-history-list {
    max-height: 200px;
    overflow-y: auto;
  }

  &__search-history-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    border-radius: 6px;
    transition: all 0.2s ease;

    &:hover {
      background-color: var(--el-fill-color-light);
    }
  }

  &__search-history-keyword {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    color: var(--el-text-color-regular);
    font-size: 14px;
  }

  /* 分类选择样式 */
  &__categories {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 24px;
    padding: 8px;
    background-color: var(--el-fill-color-light);
    border-radius: 12px;
  }

  &__category-item {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 8px;
    background-color: var(--el-bg-color);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    &--active {
      background-color: var(--el-color-primary);
      color: var(--el-text-color-primary);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);

      .meme-tool__category-icon {
        color: var(--el-text-color-primary);
      }
    }
  }

  &__category-icon {
    font-size: 18px;
    color: var(--el-color-primary);
  }

  /* 卡片样式 */
  &__results-card,
  &__favorites-card,
  &__tips-card {
    height: 100%;
    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    border-radius: 12px;
    overflow: hidden;
    border: none;
    margin-bottom: 24px;

    &:hover {
      transform: translateY(-5px);
      box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    padding: 16px;
    border-bottom: 1px solid var(--el-border-color-light);
    background-color: var(--el-fill-color-light);
    position: relative;
  }

  &__card-icon {
    font-size: 22px;
    margin-right: 10px;
    color: var(--el-color-primary);
  }

  &__card