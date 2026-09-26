<template>
  <div class="process-section search-section">
    <!-- 标题行 -->
    <div
      class="search-section__header flex items-center text-sm text-gray-700 dark:text-[#8b8d95] cursor-pointer font-medium transition-colors duration-200"
      @click.stop="handleToggle">
      <el-icon size="15" class="shrink-0" :class="{ 'is-spinning': isSearching }">
        <GlobeShield20Regular />
      </el-icon>
      <span class="text-gray-600 dark:text-gray-400 ml-1.5">
        {{ isSearching ? t('chat.turn.searchActive') : t('chat.turn.searchDone', { n: searchResults.length }) }}
      </span>
    </div>

    <!-- 内容区 -->
    <div
      v-if="isExpanded"
      class="search-section__content-wrapper border-l ml-1.75 pl-4 text-sm border-gray-300 dark:border-gray-700">
      <!-- 检索中：显示检索词 -->
      <div v-if="isSearching" class="flex items-center py-1 text-gray-400 dark:text-gray-500">
        <span v-if="searchQuery" class="truncate">{{ searchQuery }}</span>
        <span v-else class="search-dots"><i>.</i><i>.</i><i>.</i></span>
      </div>
      <!-- 来源列表 -->
      <ul v-else class="search-source-list space-y-1 py-1">
        <li v-for="(r, i) in searchResults" :key="i">
          <a
            :href="r.url"
            target="_blank"
            rel="noopener noreferrer"
            class="search-source__link flex items-center gap-1.5 text-gray-500 dark:text-gray-400 transition-colors duration-200"
            @click.stop>
            <span class="search-source__index shrink-0">{{ i + 1 }}</span>
            <span class="truncate">{{ r.title }}</span>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import { ElIcon } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { GlobeShield20Regular } from '@vicons/fluent';

const { t } = useI18n();

const props = defineProps<{
  isSearching: boolean;
  searchResults: Array<{ title: string; url: string }>;
  searchQuery?: string;
}>();

const isExpanded = ref(props.isSearching);

// 从 ChatPanel 注入锁定滚动方法，展开内容时调用
const lockScrollAnchor = inject<() => void>('lockScrollAnchor', () => {});

const handleToggle = () => {
  if (!isExpanded.value) {
    lockScrollAnchor();
  }
  isExpanded.value = !isExpanded.value;
};

watch(() => props.isSearching, (v: boolean) => {
  isExpanded.value = v;
}, { immediate: true });
</script>

<style scoped>
.search-section {
  border-radius: 8px;
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.search-section__header {
  user-select: none;
}

.search-source__link:hover {
  color: var(--el-color-primary);
}

.search-source__index {
  min-width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.is-spinning {
  animation: spin 1.2s linear infinite;
}

.search-dots i {
  font-style: normal;
  animation: dotPulse 1.4s infinite;
}

.search-dots i:nth-child(2) {
  animation-delay: 0.2s;
}

.search-dots i:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes dotPulse {
  0%,
  60%,
  100% {
    opacity: 0.2;
  }

  30% {
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
