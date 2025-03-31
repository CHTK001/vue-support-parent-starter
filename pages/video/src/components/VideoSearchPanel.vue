<script setup>
import { ref, defineProps, defineEmits } from 'vue';
import { IconifyIconOnline } from '@iconify/vue';
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const props = defineProps({
  env: Object,
  searchVideo: Function,
  selectFromHistory: Function,
  clearHistory: Function,
  usePopularKeyword: Function,
  openSearchPlatform: Function
});

const emit = defineEmits(['update:keyword', 'update:selectedType']);

const isSearchPanelCollapsed = ref(true);

const toggleSearchPanel = () => {
  isSearchPanelCollapsed.value = !isSearchPanelCollapsed.value;
};

const updateKeyword = (value) => {
  emit('update:keyword', value);
};

const updateSelectedType = (value) => {
  emit('update:selectedType', value);
  if (props.env.keyword) {
    props.searchVideo();
  }
};
</script>

<template>
  <el-card class="video-search-panel" shadow="hover">
    <template #header>
      <div class="video-search-panel__header" @click="toggleSearchPanel">
        <IconifyIconOnline icon="ri:search-line" class="video-search-panel__icon" />
        <span>搜索选项</span>
        <div class="video-search-panel__toggle">
          <IconifyIconOnline :icon="isSearchPanelCollapsed ? 'ri:arrow-down-s-line' : 'ri:arrow-up-s-line'" />
        </div>
      </div>
    </template>

    <div class="video-search-panel__container" :class="{ 'is-collapsed': isSearchPanelCollapsed }">
      <div class="video-search-panel__input-container">
        <el-input 
          :value="env.keyword" 
          @input="updateKeyword" 
          placeholder="输入视频关键词搜索..." 
          class="video-search-panel__input" 
          clearable
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:search-line" class="video-search-panel__search-icon" />
          </template>
          <template #append>
            <el-button :icon="useRenderIcon('ep:search')" type="primary" @click="searchVideo" :loading="env.loading">
            </el-button>
          </template>
        </el-input>
      </div>

      <div class="video-search-panel__collapsible-content" :class="{ 'is-collapsed': isSearchPanelCollapsed }">
        <!-- 视频类型选择 -->
        <div class="video-search-panel__types">
          <div class="video-search-panel__types-label">视频类型:</div>
          <div class="video-search-panel__types-list">
            <el-button
              v-for="type in env.types"
              :key="type.videoId"
              :type="env.selectedType === type.videoId ? 'primary' : 'default'"
              size="small"
              class="video-search-panel__type-btn"
              @click="updateSelectedType(type.videoId)"
            >
              <IconifyIconOnline 
                :icon="type.videoIcon" 
                class="video-search-panel__type-icon" 
                :style="{ color: env.selectedType === type.videoId ? '#ffffff' : type.videoColor }" 
              />
              <span>{{ type.videoName }}</span>
            </el-button>
          </div>
        </div>

        <!-- 平台选择 -->
        <div class="video-search-panel__platforms">
          <div class="video-search-panel__platforms-label">搜索平台:</div>
          <div class="video-search-panel__platforms-list">
            <el-button 
              v-for="platform in env.platforms" 
              :key="platform.videoId" 
              size="small" 
              class="video-search-panel__platform-btn" 
              @click="platform.videoId === 'all' ? searchVideo() : openSearchPlatform(platform.videoId)"
            >
              <IconifyIconOnline 
                :icon="platform.videoIcon" 
                class="video-search-panel__platform-icon" 
                :style="{ color: platform.videoColor }" 
              />
              <span>{{ platform.videoName }}</span>
            </el-button>
          </div>
        </div>

        <!-- 历史记录和热门搜索 -->
        <div class="video-search-panel__search-helpers" v-if="env.showHistory">
          <!-- 历史记录 -->
          <div class="video-search-panel__history" v-if="env.history.length > 0">
            <div class="video-search-panel__history-header">
              <div class="video-search-panel__history-title">
                <IconifyIconOnline icon="ri:history-line" class="video-search-panel__history-icon" />
                <span>搜索历史</span>
              </div>
              <el-button type="danger" link size="small" @click="clearHistory">
                <IconifyIconOnline icon="ri:delete-bin-line" />
                <span>清空</span>
              </el-button>
            </div>
            <div class="video-search-panel__history-items">
              <el-tag 
                v-for="(item, index) in env.history" 
                :key="index" 
                class="video-search-panel__history-item" 
                @click="selectFromHistory(item)" 
                :effect="env.keyword === item ? 'dark' : 'plain'"
              >
                {{ item }}
              </el-tag>
            </div>
          </div>

          <!-- 热门搜索 -->
          <div class="video-search-panel__popular">
            <div class="video-search-panel__popular-title">
              <IconifyIconOnline icon="ri:fire-line" class="video-search-panel__popular-icon" />
              <span>热门搜索</span>
            </div>
            <div class="video-search-panel__popular-items">
              <el-tag 
                v-for="(item, index) in env.popularKeywords" 
                :key="index" 
                class="video-search-panel__popular-item" 
                @click="usePopularKeyword(item)" 
                :effect="env.keyword === item ? 'dark' : 'plain'" 
                type="success"
              >
                {{ item }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.video-search-panel {
  margin-bottom: 20px;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
  }

  &__header {
    display: flex;
    align-items: center;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  &__icon {
    margin-right: 8px;
    font-size: 20px;
    color: var(--el-color-primary);
  }

  &__toggle {
    margin-left: auto;
    transition: transform 0.3s;
  }

  &__container {
    transition: max-height 0.5s ease;
    overflow: hidden;

    &.is-collapsed {
      max-height: 70px;
    }
  }

  &__input-container {
    margin-bottom: 15px;
  }

  &__input {
    width: 100%;
  }

  &__search-icon {
    color: var(--el-color-primary);
    font-size: 18px;
  }

  &__collapsible-content {
    transition:
      opacity 0.3s,
      transform 0.3s;
    transform-origin: top;

    &.is-collapsed {
      opacity: 0;
      transform: scaleY(0);
      height: 0;
      overflow: hidden;
    }
  }

  /* 视频类型样式 */
  &__types {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  &__types-label {
    font-weight: 600;
    margin-right: 10px;
    margin-bottom: 8px;
  }

  &__types-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__type-btn {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  &__type-icon {
    margin-right: 5px;
    font-size: 16px;
  }

  /* 平台样式 */
  &__platforms {
    display: flex;
    align-items: center;
    margin-bottom: 15px;
    flex-wrap: wrap;
  }

  &__platforms-label {
    font-weight: 600;
    margin-right: 10px;
    margin-bottom: 8px;
  }

  &__platforms-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  &__platform-btn {
    display: flex;
    align-items: center;
    margin-bottom: 8px;
  }

  &__platform-icon {
    margin-right: 5px;
    font-size: 16px;
  }

  /* 历史记录和热门搜索 */
  &__search-helpers {
    margin-top: 15px;
    border-top: 1px dashed var(--el-border-color-lighter);
    padding-top: 15px;
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
}
</style>