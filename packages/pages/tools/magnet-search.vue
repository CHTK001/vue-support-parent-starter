<script setup>
import { reactive, ref, onMounted, computed } from "vue";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";

// 国际化
const { t } = useI18n();

// 防抖定时器
let debounceTimer = null;

// 环境变量
const env = reactive({
  loading: false,
  keyword: "",
  selectedCategory: "all",
  searchResults: [],
  history: [],
  currentPage: 1,
  pageSize: 10,
  totalResults: 0,
  showHistory: true,
  sortBy: "relevance",
  minSize: "",
  maxSize: "",
  categories: [
    { id: "all", name: "全部", icon: "ri:folder-line", color: "#409EFF" },
    { id: "video", name: "视频", icon: "ri:movie-line", color: "#FF9C00" },
    { id: "audio", name: "音频", icon: "ri:music-line", color: "#67C23A" },
    { id: "image", name: "图片", icon: "ri:image-line", color: "#E6A23C" },
    { id: "document", name: "文档", icon: "ri:file-text-line", color: "#909399" },
    { id: "software", name: "软件", icon: "ri:apps-line", color: "#F56C6C" },
    { id: "game", name: "游戏", icon: "ri:gamepad-line", color: "#9C27B0" },
    { id: "other", name: "其他", icon: "ri:more-line", color: "#607D8B" },
  ],
  sortOptions: [
    { value: "relevance", label: "相关性" },
    { value: "date", label: "发布日期" },
    { value: "size", label: "文件大小" },
    { value: "seeders", label: "做种人数" },
  ],
  popularKeywords: ["最新电影", "热门音乐", "经典游戏", "编程教程", "电子书籍", "Linux系统", "设计素材", "学习资料"],
  advancedSearch: false,
});

// 计算属性：分页后的搜索结果
const paginatedResults = computed(() => {
  const start = (env.currentPage - 1) * env.pageSize;
  const end = start + env.pageSize;
  return env.searchResults.slice(start, end);
});

// 计算属性：总页数
const totalPages = computed(() => {
  return Math.ceil(env.searchResults.length / env.pageSize);
});

/**
 * 搜索磁力链接
 */
const searchMagnet = async () => {
  if (!env.keyword.trim()) {
    message(t("message.emptyKeyword") || "请输入搜索关键词", { type: "warning" });
    return;
  }

  env.loading = true;
  env.searchResults = [];

  try {
    // 模拟搜索结果
    // 实际应用中，这里应该调用后端API或第三方搜索服务
    await new Promise((resolve) => setTimeout(resolve, 800));

    // 添加到历史记录
    addToHistory(env.keyword);

    // 生成模拟搜索结果
    const mockResults = [];
    const categories = ["视频", "音频", "图片", "文档", "软件", "游戏", "其他"];
    const fileTypes = {
      视频: ["MP4", "MKV", "AVI", "MOV", "WMV"],
      音频: ["MP3", "FLAC", "WAV", "AAC", "OGG"],
      图片: ["JPG", "PNG", "GIF", "BMP", "TIFF"],
      文档: ["PDF", "DOC", "DOCX", "XLS", "PPT"],
      软件: ["EXE", "DMG", "APK", "MSI", "ZIP"],
      游戏: ["ISO", "ROM", "BIN", "PKG", "RAR"],
      其他: ["TORRENT", "TXT", "HTML", "XML", "JSON"],
    };

    for (let i = 0; i < 50; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const fileType = fileTypes[category][Math.floor(Math.random() * fileTypes[category].length)];
      const size = Math.floor(Math.random() * 10000) + 1; // 1MB - 10GB
      const seeders = Math.floor(Math.random() * 1000);
      const leechers = Math.floor(Math.random() * 500);
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 365));

      mockResults.push({
        id: `result-${i}`,
        title: `${env.keyword} - ${category}资源 ${i + 1}.${fileType.toLowerCase()}`,
        category: category,
        size: size,
        sizeFormatted: formatFileSize(size),
        seeders: seeders,
        leechers: leechers,
        publishDate: date.toISOString().split("T")[0],
        magnetLink: `magnet:?xt=urn:btih:${generateRandomHash()}`,
        fileType: fileType,
      });
    }

    // 根据分类筛选
    if (env.selectedCategory !== "all") {
      const categoryMap = {
        video: "视频",
        audio: "音频",
        image: "图片",
        document: "文档",
        software: "软件",
        game: "游戏",
        other: "其他",
      };
      mockResults = mockResults.filter((item) => item.category === categoryMap[env.selectedCategory]);
    }

    // 根据文件大小筛选
    if (env.minSize) {
      const minSizeMB = parseFloat(env.minSize);
      mockResults = mockResults.filter((item) => item.size >= minSizeMB);
    }

    if (env.maxSize) {
      const maxSizeMB = parseFloat(env.maxSize);
      mockResults = mockResults.filter((item) => item.size <= maxSizeMB);
    }

    // 排序
    if (env.sortBy === "date") {
      mockResults.sort((a, b) => new Date(b.publishDate) - new Date(a.publishDate));
    } else if (env.sortBy === "size") {
      mockResults.sort((a, b) => b.size - a.size);
    } else if (env.sortBy === "seeders") {
      mockResults.sort((a, b) => b.seeders - a.seeders);
    }

    env.searchResults = mockResults;
    env.totalResults = mockResults.length;
    env.currentPage = 1;

    message(t("message.searchSuccess") || "搜索成功", { type: "success" });
  } catch (error) {
    console.error("搜索失败:", error);
    message(t("message.searchError") || "搜索失败", { type: "error" });
  } finally {
    env.loading = false;
  }
};

/**
 * 生成随机哈希值
 * @returns {string} 随机哈希值
 */
const generateRandomHash = () => {
  const chars = "0123456789abcdef";
  let hash = "";
  for (let i = 0; i < 40; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return hash;
};

/**
 * 格式化文件大小
 * @param {number} size - 文件大小（MB）
 * @returns {string} 格式化后的文件大小
 */
const formatFileSize = (size) => {
  if (size < 1024) {
    return `${size} MB`;
  } else {
    return `${(size / 1024).toFixed(2)} GB`;
  }
};

/**
 * 防抖搜索
 */
const debounceSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    if (env.keyword.trim()) {
      searchMagnet();
    }
  }, 500);
};

/**
 * 添加到历史记录
 * @param {string} keyword - 搜索关键词
 */
const addToHistory = (keyword) => {
  // 如果已存在，先移除
  const index = env.history.indexOf(keyword);
  if (index !== -1) {
    env.history.splice(index, 1);
  }

  // 添加到历史记录开头
  env.history.unshift(keyword);

  // 限制历史记录数量为10个
  if (env.history.length > 10) {
    env.history.pop();
  }

  // 保存到本地存储
  localStorage.setItem("magnet-search-history", JSON.stringify(env.history));
};

/**
 * 从历史记录中选择
 * @param {string} keyword - 历史关键词
 */
const selectFromHistory = (keyword) => {
  env.keyword = keyword;
  searchMagnet();
};

/**
 * 清空历史记录
 */
const clearHistory = () => {
  env.history = [];
  localStorage.removeItem("magnet-search-history");
};

/**
 * 使用热门关键词
 * @param {string} keyword - 热门关键词
 */
const usePopularKeyword = (keyword) => {
  env.keyword = keyword;
  searchMagnet();
};

/**
 * 复制磁力链接
 * @param {string} link - 磁力链接
 */
const copyMagnetLink = (link) => {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      message(t("message.copySuccess") || "复制成功", { type: "success" });
    })
    .catch(() => {
      message(t("message.copyError") || "复制失败", { type: "error" });
    });
};

/**
 * 切换页码
 * @param {number} page - 页码
 */
const changePage = (page) => {
  env.currentPage = page;
  // 滚动到顶部
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * 重置筛选条件
 */
const resetFilters = () => {
  env.selectedCategory = "all";
  env.sortBy = "relevance";
  env.minSize = "";
  env.maxSize = "";
  if (env.keyword) {
    searchMagnet();
  }
};

/**
 * 切换高级搜索
 */
const toggleAdvancedSearch = () => {
  env.advancedSearch = !env.advancedSearch;
};

// 组件挂载时的操作
onMounted(() => {
  // 从本地存储加载历史记录
  const savedHistory = localStorage.getItem("magnet-search-history");
  if (savedHistory) {
    try {
      env.history = JSON.parse(savedHistory);
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }
});
</script>

<template>
  <div class="magnet-search-tool">
    <div class="magnet-search-tool__content">
      <!-- 顶部区域：标题和说明 -->
      <div class="magnet-search-tool__header-container">
        <div class="magnet-search-tool__header">
          <div class="magnet-search-tool__header-inner">
            <div class="magnet-search-tool__header-title">磁力搜索工具</div>
            <div class="magnet-search-tool__header-subtitle">一站式搜索各类资源磁力链接</div>
          </div>
          <div class="magnet-search-tool__header-decoration">
            <div class="magnet-search-tool__header-circle"></div>
            <div class="magnet-search-tool__header-circle"></div>
            <div class="magnet-search-tool__header-circle"></div>
          </div>
        </div>
      </div>

      <!-- 搜索区域 -->
      <el-card class="magnet-search-tool__search-card" shadow="hover">
        <div class="magnet-search-tool__search-container">
          <div class="magnet-search-tool__search-input-container">
            <el-input v-model="env.keyword" placeholder="输入关键词搜索磁力链接..." class="magnet-search-tool__search-input" clearable @keyup.enter="searchMagnet" @input="debounceSearch">
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" class="magnet-search-tool__search-icon" />
              </template>
              <template #append>
                <el-button type="primary" @click="searchMagnet" :loading="env.loading">
                  <span>搜索</span>
                </el-button>
              </template>
            </el-input>
          </div>

          <!-- 高级搜索切换 -->
          <div class="magnet-search-tool__advanced-toggle">
            <el-button link type="primary" @click="toggleAdvancedSearch">
              <IconifyIconOnline :icon="env.advancedSearch ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" />
              <span>{{ env.advancedSearch ? "收起高级搜索" : "展开高级搜索" }}</span>
            </el-button>
          </div>

          <!-- 高级搜索选项 -->
          <div class="magnet-search-tool__advanced-options" v-if="env.advancedSearch">
            <el-row :gutter="20">
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="资源分类">
                  <el-select v-model="env.selectedCategory" placeholder="选择分类" class="magnet-search-tool__select">
                    <el-option v-for="category in env.categories" :key="category.id" :label="category.name" :value="category.id">
                      <div class="magnet-search-tool__option">
                        <IconifyIconOnline :icon="category.icon" :style="{ color: category.color }" />
                        <span>{{ category.name }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="排序方式">
                  <el-select v-model="env.sortBy" placeholder="排序方式" class="magnet-search-tool__select">
                    <el-option v-for="option in env.sortOptions" :key="option.value" :label="option.label" :value="option.value" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="最小大小 (MB)">
                  <el-input v-model="env.minSize" type="number" placeholder="最小大小" />
                </el-form-item>
              </el-col>
              <el-col :xs="24" :sm="12" :md="6">
                <el-form-item label="最大大小 (MB)">
                  <el-input v-model="env.maxSize" type="number" placeholder="最大大小" />
                </el-form-item>
              </el-col>
            </el-row>
            <div class="magnet-search-tool__filter-actions">
              <el-button type="primary" @click="searchMagnet">应用筛选</el-button>
              <el-button @click="resetFilters">重置筛选</el-button>
            </div>
          </div>

          <!-- 分类快速选择 -->
          <div class="magnet-search-tool__categories">
            <div class="magnet-search-tool__categories-label">快速分类:</div>
            <div class="magnet-search-tool__categories-list">
              <el-button
                v-for="category in env.categories"
                :key="category.id"
                :type="env.selectedCategory === category.id ? 'primary' : 'default'"
                size="small"
                class="magnet-search-tool__category-btn"
                @click="
                  env.selectedCategory = category.id;
                  if (env.keyword) searchMagnet();
                "
              >
                <IconifyIconOnline :icon="category.icon" class="magnet-search-tool__category-icon" :style="{ color: env.selectedCategory === category.id ? '#ffffff' : category.color }" />
                <span>{{ category.name }}</span>
              </el-button>
            </div>
          </div>

          <!-- 历史记录和热门搜索 -->
          <div class="magnet-search-tool__search-helpers" v-if="env.showHistory">
            <!-- 历史记录 -->
            <div class="magnet-search-tool__history" v-if="env.history.length > 0">
              <div class="magnet-search-tool__history-header">
                <div class="magnet-search-tool__history-title">
                  <IconifyIconOnline icon="ri:history-line" class="magnet-search-tool__history-icon" />
                  <span>搜索历史</span>
                </div>
                <el-button type="danger" link size="small" @click="clearHistory">
                  <IconifyIconOnline icon="ri:delete-bin-line" />
                  <span>清空</span>
                </el-button>
              </div>
              <div class="magnet-search-tool__history-items">
                <el-tag v-for="(item, index) in env.history" :key="index" class="magnet-search-tool__history-item" @click="selectFromHistory(item)" :effect="env.keyword === item ? 'dark' : 'plain'">
                  {{ item }}
                </el-tag>
              </div>
            </div>

            <!-- 热门搜索 -->
            <div class="magnet-search-tool__popular">
              <div class="magnet-search-tool__popular-title">
                <IconifyIconOnline icon="ri:fire-line" class="magnet-search-tool__popular-icon" />
                <span>热门搜索</span>
              </div>
              <div class="magnet-search-tool__popular-items">
                <el-tag v-for="(item, index) in env.popularKeywords" :key="index" class="magnet-search-tool__popular-item" @click="usePopularKeyword(item)" :effect="env.keyword === item ? 'dark' : 'plain'" type="success">
                  {{ item }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 搜索结果 -->
      <el-card class="magnet-search-tool__results-card" shadow="hover" v-if="env.searchResults.length > 0">
        <template #header>
          <div class="magnet-search-tool__card-header">
            <IconifyIconOnline icon="ri:link-m" class="magnet-search-tool__card-icon" />
            <span>搜索结果 (共 {{ env.totalResults }} 个)</span>
          </div>
        </template>

        <!-- 使用 ScTable 显示结果 -->
        <sc-table
          :data="env.searchResults"
          :pagination="{
            currentPage: env.currentPage,
            pageSize: env.pageSize,
            total: env.searchResults.length,
            onCurrentChange: changePage,
          }"
          height="500px"
        >
          <el-table-column label="资源名称" prop="title" min-width="300">
            <template #default="{ row }">
              <div class="magnet-search-tool__result-title" :title="row.title">
                <span class="magnet-search-tool__result-title-text">{{ row.title }}</span>
                <el-tag size="small" type="info" class="magnet-search-tool__result-type">{{ row.fileType }}</el-tag>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="分类" prop="category" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.category === '视频' ? 'warning' : row.category === '音频' ? 'success' : row.category === '图片' ? 'info' : row.category === '文档' ? 'primary' : row.category === '软件' ? 'danger' : row.category === '游戏' ? '' : 'info'">
                {{ row.category }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="大小" prop="sizeFormatted" width="100" sortable></el-table-column>

          <el-table-column label="做种" prop="seeders" width="80" sortable>
            <template #default="{ row }">
              <span class="magnet-search-tool__seeders">{{ row.seeders }}</span>
            </template>
          </el-table-column>

          <el-table-column label="下载" prop="leechers" width="80">
            <template #default="{ row }">
              <span class="magnet-search-tool__leechers">{{ row.leechers }}</span>
            </template>
          </el-table-column>

          <el-table-column label="发布日期" prop="publishDate" width="120" sortable></el-table-column>

          <el-table-column label="操作" width="150" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="copyMagnetLink(row.magnetLink)">
                <IconifyIconOnline icon="ri:file-copy-line" />
                <span>复制链接</span>
              </el-button>
              <el-button type="success" link size="small" @click="window.open(row.magnetLink)">
                <IconifyIconOnline icon="ri:download-line" />
                <span>下载</span>
              </el-button>
            </template>
          </el-table-column>
        </sc-table>
      </el-card>

      <!-- 空状态 -->
      <el-empty v-else-if="!env.loading && env.keyword" description="没有找到相关资源，请尝试其他关键词" class="magnet-search-tool__empty">
        <template #image>
          <IconifyIconOnline icon="ri:link-m" class="magnet-search-tool__empty-icon" />
        </template>
      </el-empty>

      <!-- 使用说明 -->
      <el-card class="magnet-search-tool__tips-card" shadow="hover" v-if="!env.searchResults.length && !env.keyword">
        <template #header>
          <div class="magnet-search-tool__card-header">
            <IconifyIconOnline icon="ri:information-line" class="magnet-search-tool__card-icon" />
            <span>使用说明</span>
          </div>
        </template>

        <div class="magnet-search-tool__tips">
          <div class="magnet-search-tool__tip-item">
            <div class="magnet-search-tool__tip-number">1</div>
            <div class="magnet-search-tool__tip-text">在搜索框中输入您想要查找的资源关键词</div>
          </div>
          <div class="magnet-search-tool__tip-item">
            <div class="magnet-search-tool__tip-number">2</div>
            <div class="magnet-search-tool__tip-text">点击"搜索"按钮或按回车键开始搜索</div>
          </div>
          <div class="magnet-search-tool__tip-item">
            <div class="magnet-search-tool__tip-number">3</div>
            <div class="magnet-search-tool__tip-text">您可以使用高级搜索选项筛选特定类型的资源</div>
          </div>
          <div class="magnet-search-tool__tip-item">
            <div class="magnet-search-tool__tip-number">4</div>
            <div class="magnet-search-tool__tip-text">点击"复制链接"可以复制磁力链接到剪贴板</div>
          </div>
          <div class="magnet-search-tool__tip-item magnet-search-tool__tip-item--warning">
            <IconifyIconOnline icon="ri:alert-line" class="magnet-search-tool__tip-icon" />
            <div class="magnet-search-tool__tip-text">注意：本工具仅供学习交流使用，请尊重版权，支持正版</div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.magnet-search-tool {
  /* 内容区域样式 */
  &__content {
    border-radius: 12px;
  }

  /* 头部样式 */
  &__header-container {
    margin-bottom: 20px;
  }

  &__header {
    background: linear-gradient(135deg, var(--el-color-primary-dark-2), var(--el-color-primary));
    border-radius: 12px;
    padding: 30px;
    position: relative;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(var(--el-color-primary-rgb), 0.3);
    display: flex;
    justify-content: space-between;
    align-items: center;

    &-inner {
      position: relative;
      z-index: 2;
    }

    &-title {
      font-size: 28px;
      font-weight: 700;
      color: #fff;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    &-subtitle {
      font-size: 16px;
      color: rgba(255, 255, 255, 0.9);
    }

    &-decoration {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
    }

    &-circle {
      position: absolute;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);

      &:nth-child(1) {
        width: 200px;
        height: 200px;
        top: -100px;
        right: -50px;
        animation: float 15s infinite ease-in-out;
      }

      &:nth-child(2) {
        width: 150px;
        height: 150px;
        bottom: -50px;
        left: -30px;
        animation: float 12s infinite ease-in-out reverse;
      }

      &:nth-child(3) {
        width: 100px;
        height: 100px;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        animation: pulse 8s infinite ease-in-out;
      }
    }
  }

  /* 卡片样式 */
  &__search-card,
  &__results-card,
  &__tips-card {
    margin-bottom: 20px;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
    }
  }

  &__card-header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
  }

  &__card-icon {
    margin-right: 8px;
    font-size: 20px;
    color: var(--el-color-primary);
  }

  /* 搜索区域样式 */
  &__search-container {
    padding: 10px 0;
  }

  &__search-input-container {
    margin-bottom: 15px;
  }

  &__search-input {
    width: 100%;
  }

  &__search-icon {
    color: var(--el-color-primary);
    font-size: 18px;
  }

  /* 高级搜索样式 */
  &__advanced-toggle {
    display: flex;
    justify-content: center;
    margin-bottom: 10px;
  }

  &__advanced-options {
    background-color: var(--el-bg-color-page);
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    border: 1px dashed var(--el-border-color);
  }

  &__filter-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;
  }

  &__select {
    width: 100%;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* 分类选择样式 */
  &__categories {
    margin: 15px 0;
    display: flex;
    align-items: center;
  }

  &__categories-label {
    font-weight: 500;
    margin-right: 10px;
    color: var(--el-text-color-secondary);
  }

  &__categories-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__category-btn {
    display: flex;
    align-items: center;
    gap: 5px;
  }

  &__category-icon {
    font-size: 16px;
  }

  /* 历史记录和热门搜索样式 */
  &__search-helpers {
    margin-top: 15px;
  }

  &__history,
  &__popular {
    margin-bottom: 15px;
  }

  &__history-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }

  &__history-title,
  &__popular-title {
    display: flex;
    align-items: center;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  &__history-icon,
  &__popular-icon {
    margin-right: 5px;
    font-size: 16px;
    color: var(--el-color-info);
  }

  &__history-items,
  &__popular-items {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__history-item,
  &__popular-item {
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }

  /* 搜索结果样式 */
  &__result-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__result-title-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__result-type {
    flex-shrink: 0;
  }

  &__seeders {
    color: var(--el-color-success);
    font-weight: 500;
  }

  &__leechers {
    color: var(--el-color-danger);
  }

  /* 空状态样式 */
  &__empty {
    padding: 40px 0;
  }

  &__empty-icon {
    font-size: 60px;
    color: var(--el-color-info-light-5);
  }

  /* 提示卡片样式 */
  &__tips {
    padding: 10px 0;
  }

  &__tip-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 15px;

    &--warning {
      background-color: var(--el-color-warning-light-9);
      padding: 10px;
      border-radius: 6px;
      border-left: 4px solid var(--el-color-warning);
    }
  }

  &__tip-number {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background-color: var(--el-color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 500;
    margin-right: 10px;
    flex-shrink: 0;
  }

  &__tip-icon {
    font-size: 20px;
    color: var(--el-color-warning);
    margin-right: 10px;
  }

  &__tip-text {
    flex: 1;
    line-height: 1.5;
  }
}

/* 动画效果 */
@keyframes pulse {
  0%,
  100% {
    transform: scale(1) translate(-50%, -50%);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1) translate(-45%, -45%);
    opacity: 1;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

/* 响应式调整 */
@media (max-width: 768px) {
  .magnet-search-tool {
    &__header-title {
      font-size: 24px;
    }

    &__categories-list {
      flex-wrap: wrap;
    }
  }
}
</style>
