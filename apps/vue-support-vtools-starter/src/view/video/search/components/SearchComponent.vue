<script setup>
import { inject, ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { hotSearchTerms } from "../config/videoData";

// 获取共享状态
const videoStore = inject("videoStore");
const router = useRouter();
const emit = defineEmits(["minimize"]);

// 控制筛选面板显示状态
const showFilterPanel = ref(false);
// 控制搜索框位置状态
const searchBoxMinimized = ref(false);

// 控制各分类的展开状态
const expandState = reactive({
  category: false,
  year: false,
  region: false,
  language: false,
});

// 当前激活的筛选类型
const activeFilterType = ref("category");

// 控制显示数量
const displayCounts = reactive({
  category: 20,
  year: 20,
  region: 20,
  language: 20,
});

// 获取应该显示的项目
const getDisplayItems = (type, items) => {
  if (expandState[type]) {
    return items;
  } else {
    return items.slice(0, displayCounts[type]);
  }
};

// 检查是否有更多项目
const hasMoreItems = (type, items) => {
  return items.length > displayCounts[type];
};

// 切换筛选面板
const toggleFilterPanel = () => {
  showFilterPanel.value = !showFilterPanel.value;
  searchBoxMinimized.value = showFilterPanel.value;
  if (searchBoxMinimized.value) {
    emit("minimize");
  }
};

// 切换筛选类型
const switchFilterType = (type) => {
  activeFilterType.value = type;
};

// 切换展开状态
const toggleExpand = (type) => {
  expandState[type] = !expandState[type];
};

// 判断是否选中
const isSelected = (type, id) => {
  return videoStore.filters[type].includes(id);
};

// 切换选择状态
const toggleSelection = (type, id) => {
  const index = videoStore.filters[type].indexOf(id);
  if (index === -1) {
    videoStore.filters[type].push(id);
  } else {
    videoStore.filters[type].splice(index, 1);
  }
};

// 全选/取消全选
const toggleAll = (type, selected) => {
  if (selected) {
    // 如果当前已选中，则清空选择
    videoStore.filters[type] = [];
  } else {
    // 如果当前未选中，则选择"全部"
    videoStore.filters[type] = [];
  }
};

// 搜索并跳转到结果页
const searchResults = ref([]);
const searchAndNavigate = () => {
  emit("minimize");
  searchBoxMinimized.value = true;
  videoStore.currentPage = 1;
  videoStore.search();
};

// 防抖定时器
let debounceTimer = null;

// 防抖搜索
const debounceSearch = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    searchAndNavigate();
  }, 500);
};

// 重置搜索条件
const resetFilters = () => {
  videoStore.resetFilters();
};

// 点击热门搜索词
const searchHotTerm = (term) => {
  videoStore.filters.keyword = term;
  searchAndNavigate();
};

// 获取已选择的筛选条件数量
const getSelectedCount = (type) => {
  return videoStore.filters[type].length;
};

// 关闭筛选面板并搜索
const applyFiltersAndSearch = () => {
  showFilterPanel.value = false;
  searchAndNavigate();
};

// 获取筛选条件名称
const getFilterName = (type, id) => {
  if (type === "category") {
    return videoStore.categories.find((item) => item.id === id)?.name || id;
  } else if (type === "year") {
    return videoStore.years.find((item) => item.id === id)?.name || id;
  } else if (type === "region") {
    return videoStore.regions.find((item) => item.id === id)?.name || id;
  } else if (type === "language") {
    return videoStore.languages.find((item) => item.id === id)?.name || id;
  }
  return id;
};
</script>

<template>
  <div class="search-page" :class="{ 'h-[100vh]': !searchBoxMinimized }">
    <!-- 背景装饰元素 -->
    <div class="decoration-circle circle-1"></div>
    <div class="decoration-circle circle-2"></div>
    <div class="decoration-circle circle-3"></div>
    <div class="decoration-circle circle-4"></div>

    <div class="search-content-wrapper" :class="{ 'filter-active': searchBoxMinimized }">
      <!-- 标题和搜索区域 -->
      <div class="search-header-container" :class="{ 'top-right': searchBoxMinimized }">
        <!-- 标题区域 -->
        <div v-if="!searchBoxMinimized" class="search-header" :class="{ minimized: searchBoxMinimized, 'horizontal-layout': searchBoxMinimized }">
          <h1 class="search-title text-center" :class="{ minimized: searchBoxMinimized }">视频搜索</h1>
        </div>

        <!-- 搜索区域 -->
        <div class="search-container" :class="{ minimized: searchBoxMinimized }">
          <div class="search-box-wrapper" :class="{ minimized: searchBoxMinimized }">
            <el-input v-model="videoStore.filters.keyword" placeholder="输入影片名称、演员、导演等关键词" clearable @keyup.enter="searchAndNavigate" class="search-input">
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" class="search-icon" />
              </template>
              <template #append>
                <el-button-group>
                  <el-button @click="toggleFilterPanel" type="primary" class="filter-button" v-if="!searchBoxMinimized">
                    <IconifyIconOnline icon="ri:filter-3-line" class="filter-icon" />
                    <el-badge
                      v-if="getSelectedCount('category') + getSelectedCount('year') + getSelectedCount('region') + getSelectedCount('language') > 0"
                      :value="getSelectedCount('category') + getSelectedCount('year') + getSelectedCount('region') + getSelectedCount('language')"
                      class="filter-badge"
                    />
                  </el-button>
                  <el-button @click="searchAndNavigate" type="primary" class="search-button">
                    <IconifyIconOnline icon="ri:search-2-line" class="search-btn-icon" />
                  </el-button>
                </el-button-group>
              </template>
            </el-input>
          </div>

          <!-- 热门搜索区域 -->
          <div class="hot-search" v-if="!searchBoxMinimized">
            <span class="hot-label">
              <IconifyIconOnline icon="ri:fire-fill" class="hot-icon" />
              热门搜索：
            </span>
            <div class="hot-tags">
              <el-tag v-for="(tag, index) in hotSearchTerms.slice(0, 8)" :key="index" effect="plain" class="hot-tag" @click="searchHotTerm(tag)">
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
      <!-- 筛选面板 -->
      <transition name="filter-fade">
        <div v-if="searchBoxMinimized" class="filter-panel-container">
          <!-- 筛选选项 -->
          <div class="filter-options-container">
            <!-- 分类筛选 -->
            <div class="filter-category-section">
              <div class="filter-category-options">
                <IconifyIconOnline icon="ri:apps-line" class="filter-category-icon" />
                <span>类型</span>
                <div class="filter-tags-container">
                  <el-tag :key="'all-category'" :type="videoStore.filters.category.length === 0 ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleAll('category', videoStore.filters.category.length === 0)"> 全部 </el-tag>
                  <el-tag v-for="category in getDisplayItems('category', videoStore.categories.slice(1))" :key="category.id" :type="isSelected('category', category.id) ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleSelection('category', category.id)">
                    {{ category.name }}
                  </el-tag>
                </div>
                <el-button v-if="hasMoreItems('category', videoStore.categories.slice(1))" @click="toggleExpand('category')" class="more-button" size="small" text>
                  {{ expandState.category ? "收起" : "更多" }}
                  <IconifyIconOnline :icon="expandState.category ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="more-icon" />
                </el-button>
              </div>
            </div>

            <!-- 年代筛选 -->
            <div class="filter-category-section">
              <div class="filter-category-options">
                <IconifyIconOnline icon="ri:calendar-line" class="filter-category-icon" />
                <span>年代</span>
                <div class="filter-tags-container">
                  <el-tag :key="'all-year'" :type="videoStore.filters.year.length === 0 ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleAll('year', videoStore.filters.year.length === 0)"> 全部 </el-tag>
                  <el-tag v-for="year in getDisplayItems('year', videoStore.years.slice(1))" :key="year.id" :type="isSelected('year', year.id) ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleSelection('year', year.id)">
                    {{ year.name }}
                  </el-tag>
                </div>
                <el-button v-if="hasMoreItems('year', videoStore.years.slice(1))" @click="toggleExpand('year')" class="more-button" size="small" text>
                  {{ expandState.year ? "收起" : "更多" }}
                  <IconifyIconOnline :icon="expandState.year ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="more-icon" />
                </el-button>
              </div>
            </div>

            <!-- 地区筛选 -->
            <div class="filter-category-section">
              <div class="filter-category-options">
                <IconifyIconOnline icon="ri:map-pin-line" class="filter-category-icon" />
                <span>地区</span>
                <div class="filter-tags-container">
                  <el-tag :key="'all-region'" :type="videoStore.filters.region.length === 0 ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleAll('region', videoStore.filters.region.length === 0)"> 全部 </el-tag>
                  <el-tag v-for="region in getDisplayItems('region', videoStore.regions.slice(1))" :key="region.id" :type="isSelected('region', region.id) ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleSelection('region', region.id)">
                    {{ region.name }}
                  </el-tag>
                </div>
                <el-button v-if="hasMoreItems('region', videoStore.regions.slice(1))" @click="toggleExpand('region')" class="more-button" size="small" text>
                  {{ expandState.region ? "收起" : "更多" }}
                  <IconifyIconOnline :icon="expandState.region ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="more-icon" />
                </el-button>
              </div>
            </div>

            <!-- 语言筛选 -->
            <div class="filter-category-section">
              <div class="filter-category-options">
                <IconifyIconOnline icon="ri:translate" class="filter-category-icon" />
                <span>语言</span>
                <div class="filter-tags-container">
                  <el-tag :key="'all-language'" :type="videoStore.filters.language.length === 0 ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleAll('language', videoStore.filters.language.length === 0)"> 全部 </el-tag>
                  <el-tag v-for="language in getDisplayItems('language', videoStore.languages.slice(1))" :key="language.id" :type="isSelected('language', language.id) ? 'danger' : 'info'" effect="plain" class="filter-option-tag" @click="toggleSelection('language', language.id)">
                    {{ language.name }}
                  </el-tag>
                </div>
                <el-button v-if="hasMoreItems('language', videoStore.languages.slice(1))" @click="toggleExpand('language')" class="more-button" size="small" text>
                  {{ expandState.language ? "收起" : "更多" }}
                  <IconifyIconOnline :icon="expandState.language ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" class="more-icon" />
                </el-button>
              </div>
            </div>

            <!-- 操作按钮 -->
            <div class="filter-actions">
              <el-button @click="resetFilters" plain>
                <IconifyIconOnline icon="ri:refresh-line" class="action-icon" />
              </el-button>
              <el-button type="primary" @click="searchAndNavigate">
                <IconifyIconOnline icon="ri:search-line" class="action-icon" />
              </el-button>
            </div>
          </div>
        </div>
      </transition>

      <!-- 结果显示区域 -->
      <div v-if="searchResults.length > 0" class="search-results">
        <h2>搜索结果：</h2>
        <ul>
          <li v-for="result in searchResults" :key="result.id">
            {{ result.title }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// 使用Element-plus变量
:root {
  --el-color-primary: #5e72e4;
  --el-color-primary-light-3: #7d8ce9;
  --el-color-primary-light-5: #9ba6ef;
  --el-color-primary-light-7: #bac1f4;
  --el-color-primary-light-9: #e8eafa;
  --el-color-primary-dark-2: #4a5bd4;
  --el-color-success: #2dce89;
  --el-color-warning: #fb6340;
  --el-color-danger: #f5365c;
  --el-color-info: #11cdef;
  --el-color-white: #ffffff;
  --el-border-radius-base: 4px;
  --el-border-radius-small: 2px;
  --el-border-radius-round: 20px;
  --el-border-radius-circle: 100%;
  --el-transition-duration: 0.3s;
  --el-transition-duration-fast: 0.2s;
}
:deep(.el-input__suffix-inner) {
  margin-right: 8px;
}
.search-page {
  padding: 0;
  background: linear-gradient(135deg, #f6f9fc 0%, #e3eeff 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

// 背景装饰元素
.decoration-circle {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  z-index: 0;
  opacity: 0.4;
  transition: all 3s ease-in-out;

  &.circle-1 {
    width: 350px;
    height: 350px;
    background: linear-gradient(45deg, #4facfe 0%, #00f2fe 100%);
    top: -150px;
    right: -100px;
    animation: float 20s ease-in-out infinite alternate;
  }

  &.circle-2 {
    width: 450px;
    height: 450px;
    background: linear-gradient(45deg, #fa709a 0%, #fee140 100%);
    bottom: -200px;
    left: -150px;
    animation: float 25s ease-in-out infinite alternate-reverse;
  }

  &.circle-3 {
    width: 250px;
    height: 250px;
    background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
    top: 40%;
    right: 15%;
    animation: float 18s ease-in-out infinite alternate;
  }

  &.circle-4 {
    width: 200px;
    height: 200px;
    background: linear-gradient(45deg, #2dce89 0%, #11cdef 100%);
    top: 60%;
    left: 10%;
    animation: float 15s ease-in-out infinite alternate-reverse;
  }
}

// 内容包装器
.search-content-wrapper {
  width: 100%;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 40px;

  &.filter-active {
    margin-top: 20px;
  }
}

// 搜索头部容器
.search-header-container {
  width: 100%;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.top-right {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 100;
    width: auto;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20px;
  }
}

// 标题区域
.search-header {
  text-align: center;
  margin-bottom: 50px;
  animation: fadeInDown 0.8s ease-out;
  position: relative;
  z-index: 1;
  align-items: center;
  top: 10px;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 100%;

  &.minimized {
    margin-bottom: 20px;
    transform: scale(0.9);
    opacity: 0.9;
  }

  &.horizontal-layout {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    text-align: left;
    margin-right: 20px;
  }

  .search-title {
    font-size: 52px;
    background: linear-gradient(45deg, var(--el-color-primary) 0%, #8e54e9 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 15px;
    font-weight: 800;
    letter-spacing: 1px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

    &.minimized {
      font-size: 28px;
      margin-bottom: 0;
      margin-right: 15px;
    }
  }

  .search-subtitle {
    font-size: 18px;
    color: #5a6a85;
    font-weight: 500;
    opacity: 0.9;
    transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

    &.minimized {
      font-size: 14px;
      opacity: 0.7;
      display: none;
    }
  }
}

// 搜索容器
.search-container {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  animation: fadeInUp 0.8s ease-out;
  position: relative;
  z-index: 1;
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);

  &.minimized {
    max-width: 450px;
    margin: 0;
  }
}

// 搜索框包装器
.search-box-wrapper {
  margin-bottom: 30px;
  transform: translateY(0);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative;
  width: 100%;

  &.minimized {
    width: 400px;
    margin-bottom: 0;
    transform: translateY(0) scale(0.95);
    transform-origin: right top;
    position: relative;
    z-index: 1000;
  }

  &:hover:not(.minimized) {
    transform: translateY(-5px);
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -15px;
    left: 5%;
    width: 90%;
    height: 15px;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.08), transparent);
    border-radius: 50%;
    filter: blur(5px);
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:not(.minimized)::after {
    opacity: 1;
  }

  .search-input {
    :deep(.el-input__wrapper) {
      padding-left: 20px;
      box-shadow:
        0 15px 35px rgba(50, 50, 93, 0.1),
        0 5px 15px rgba(0, 0, 0, 0.07);
      border-radius: 20px;
      overflow: hidden;
      transition: all 0.3s ease;
      border: 2px solid transparent;

      &:hover,
      &:focus-within {
        box-shadow:
          0 20px 40px rgba(50, 50, 93, 0.15),
          0 10px 20px rgba(0, 0, 0, 0.1);
        border-color: rgba(94, 114, 228, 0.2);
      }
    }

    .search-icon {
      font-size: 22px;
      color: var(--el-color-primary);
      margin-right: 5px;
    }

    :deep(.el-input__inner) {
      height: 60px;
      font-size: 17px;
      font-weight: 500;
      color: #3a4858;
    }

    :deep(.el-input-group__append) {
      padding: 0;
    }

    .button-group {
      display: flex;
      height: 60px;
    }

    .filter-button {
      height: 60px;
      border-radius: 0;
      padding: 0 22px;
      display: flex;
      align-items: center;
      background: linear-gradient(45deg, var(--el-color-primary) 0%, #825ee4 100%);
      border: none;
      font-weight: 600;
      transition: all 0.3s ease;
      border-right: 1px solid rgba(255, 255, 255, 0.2);
      color: white;

      &:hover {
        background: linear-gradient(45deg, var(--el-color-primary-dark-2) 0%, #7349d4 100%);
        box-shadow: 0 5px 15px rgba(94, 114, 228, 0.4);
      }

      .filter-icon {
        margin-right: 8px;
        font-size: 20px;
      }

      span {
        margin: 0 3px;
        font-size: 16px;
      }

      .filter-badge {
        margin-left: 5px;

        :deep(.el-badge__content) {
          background-color: #fff;
          color: var(--el-color-primary);
          font-weight: bold;
          border: none;
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
      }
    }

    .search-button {
      height: 60px;
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      border-top-right-radius: 20px;
      border-bottom-right-radius: 20px;
      padding: 0 30px;
      font-size: 16px;
      font-weight: 600;
      background: linear-gradient(45deg, var(--el-color-info) 0%, #1171ef 100%);
      border: none;
      transition: all 0.3s ease;
      color: white;
      display: flex;
      align-items: center;

      .search-btn-icon {
        margin-right: 8px;
        font-size: 20px;
      }

      &:hover {
        background: linear-gradient(45deg, #0fb8d9 0%, #0f62d9 100%);
        box-shadow: 0 5px 15px rgba(17, 205, 239, 0.4);
        transform: translateX(2px);
      }
    }
  }
}

// 热门搜索区域
.hot-search {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 18px 25px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  box-shadow:
    0 10px 25px rgba(50, 50, 93, 0.1),
    0 5px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    box-shadow:
      0 15px 35px rgba(50, 50, 93, 0.15),
      0 5px 15px rgba(0, 0, 0, 0.1);
    transform: translateY(-3px);
  }

  .hot-label {
    font-size: 16px;
    color: #5a6a85;
    margin-right: 20px;
    white-space: nowrap;
    font-weight: 600;
    display: flex;
    align-items: center;

    .hot-icon {
      color: var(--el-color-danger);
      font-size: 20px;
      margin-right: 8px;
    }
  }

  .hot-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;

    .hot-tag {
      cursor: pointer;
      padding: 8px 18px;
      font-size: 14px;
      border-radius: 30px;
      transition: all 0.3s ease;
      background-color: rgba(255, 255, 255, 0.9);
      border: 1px solid #e6e9f0;
      color: #fff;

      &:hover {
        color: #fff;
        background: linear-gradient(45deg, var(--el-color-primary) 0%, #825ee4 100%);
        border-color: transparent;
        transform: translateY(-3px) scale(1.05);
        box-shadow:
          0 7px 14px rgba(50, 50, 93, 0.1),
          0 3px 6px rgba(0, 0, 0, 0.08);
      }
    }
  }
}

// 筛选面板容器
.filter-panel-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  margin-top: 30px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  padding: 30px;
  box-shadow:
    0 15px 35px rgba(50, 50, 93, 0.1),
    0 5px 15px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);

  .search-header-container.top-right & {
    position: fixed;
    top: 90px;
    right: 20px;
    width: 450px;
    z-index: 99;
  }
}

// 筛选信息容器
.filter-info-container {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  padding: 25px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  height: fit-content;

  .filter-info-header {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(234, 236, 239, 0.7);

    .filter-info-icon {
      font-size: 22px;
      color: var(--el-color-primary);
      margin-right: 10px;
    }

    span {
      font-size: 18px;
      font-weight: 600;
      color: #3a4858;
    }
  }

  .filter-info-content {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .filter-info-row {
    display: flex;
    margin-bottom: 10px;

    .filter-info-label {
      width: 70px;
      font-weight: 600;
      color: #5a6a85;
      flex-shrink: 0;
      padding-top: 8px;
    }

    .filter-info-value {
      flex: 1;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;

      .filter-info-tag {
        margin-bottom: 8px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;

        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
      }
    }
  }

  .no-filter-info {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 30px 20px;
    background-color: rgba(248, 250, 252, 0.7);
    border-radius: 12px;
    color: #8898aa;

    .no-filter-icon {
      font-size: 24px;
      margin-right: 10px;
      color: var(--el-color-info);
    }
  }
}

// 筛选选项容器
.filter-options-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding-bottom: 10px;
}

// 筛选分类部分
.filter-category-section {
  background-color: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.03);
  transition: all 0.3s ease;
  width: 100%;
  display: flex;
  flex-direction: column;

  &:hover {
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
    transform: translateY(-2px);
  }

  .filter-category-header {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(234, 236, 239, 0.7);

    .filter-category-icon {
      font-size: 20px;
      color: var(--el-color-primary);
      margin-right: 8px;
    }

    span {
      font-size: 16px;
      font-weight: 600;
      color: #3a4858;
    }
  }

  .filter-category-options {
    display: flex;
    flex-wrap: nowrap;
    gap: 10px;
    position: relative;
    align-items: center;
    padding: 10px;
    overflow: visible;
    justify-content: space-between;

    span {
      white-space: nowrap;
      flex-shrink: 0;
    }

    .filter-tags-container {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      flex-grow: 1;
      margin-right: 10px;
    }

    .filter-option-tag {
      cursor: pointer;
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 8px;
      transition: all 0.25s ease;
      margin-bottom: 5px;
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
      }

      &[type="danger"] {
        background: linear-gradient(45deg, var(--el-color-danger) 0%, #f56036 100%);
        border-color: transparent;
        color: white;
        box-shadow: 0 4px 10px rgba(245, 54, 92, 0.3);
        font-weight: 600;
        transform: scale(1.05);
        border: 2px solid white;
        position: relative;
        z-index: 1;
        padding-right: 28px;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(255, 255, 255, 0.1);
          z-index: -1;
          animation: pulse 2s infinite;
        }

        &::after {
          content: "✓";
          position: absolute;
          top: 50%;
          right: 8px;
          transform: translateY(-50%);
          font-size: 12px;
          font-weight: bold;
        }
      }
    }

    .more-button {
      cursor: pointer;
      padding: 8px 16px;
      font-size: 14px;
      border-radius: 8px;
      transition: all 0.25s ease;
      margin-bottom: 5px;
      color: var(--el-color-primary);
      font-weight: 600;
      display: flex;
      align-items: center;
      background-color: rgba(94, 114, 228, 0.1);
      border: 1px dashed rgba(94, 114, 228, 0.3);
      position: sticky;
      right: 10px;
      margin-left: auto;
      z-index: 2;
      flex-shrink: 0;
      align-self: flex-start;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
        background-color: rgba(94, 114, 228, 0.15);
      }

      .more-icon {
        margin-left: 4px;
        font-size: 16px;
        transition: transform 0.3s ease;
      }
    }
  }
}

// 操作按钮
.filter-actions {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  border-top: 1px solid rgba(234, 236, 239, 0.7);

  .el-button {
    min-width: 120px;
    font-size: 16px;
    font-weight: 600;
    border-radius: 12px;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;

    .action-icon {
      margin-right: 8px;
      font-size: 18px;
    }

    &:hover {
      transform: translateY(-3px);
      box-shadow:
        0 7px 14px rgba(50, 50, 93, 0.1),
        0 3px 6px rgba(0, 0, 0, 0.08);
    }

    &[type="primary"] {
      background: linear-gradient(45deg, var(--el-color-primary) 0%, #825ee4 100%);
      border-color: transparent;

      &:hover {
        background: linear-gradient(45deg, var(--el-color-primary-dark-2) 0%, #7349d4 100%);
      }
    }
  }
}

// 动画
@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

@keyframes pulse {
  0% {
    opacity: 0.5;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0.5;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 过渡动画
.filter-fade-enter-active,
.filter-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.filter-fade-enter-from,
.filter-fade-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
