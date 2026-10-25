<template>
  <div class="process-section search-section">
    <!-- 标题行 -->
    <div
      class="search-section__header flex items-center text-sm text-gray-700 dark:text-gray-400 cursor-pointer font-medium transition-colors duration-200"
      @click.stop="handleToggle">
      <el-icon size="15" class="shrink-0" :class="{ 'is-spinning': isSearching }">
        <GlobeShield20Regular />
      </el-icon>
      <span class="text-gray-600 dark:text-gray-400 ml-1.5">
        {{ isSearching ? t('chat.turn.searchActive') : t('chat.turn.searchDone', { n: searchResults.length }) }}
      </span>
    </div>

    <!-- 内容区：极简展开态（与思考 / 工具行同一套细导轨口径） -->
    <div
      v-if="isExpanded"
      class="search-section__content-wrapper">
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
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  overflow: hidden;
  animation: fadeIn 0.3s ease;
}

.search-section__header {
  user-select: none;
}

/* 极简展开态：与思考块 / 工具行共用同一套「细导轨 + 纯文本」，
   不再各自写死 gray-300 / gray-700 两套灰。 */
.search-section__content-wrapper {
  margin-left: 7px;
  padding-left: 16px;
  border-left: 2px solid var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
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
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
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

/* 动效降级：系统开启「减少动态效果」时，检索块直接出现在终态。
   逐个列出，不写 `*` / `.process-section *` 通配，
   避免把 el-icon / a 标签内部 Element Plus 组件的合法过渡一起掐掉。 */
@media (prefers-reduced-motion: reduce) {
  .search-section {
    animation: none;
  }

  /* 地球图标旋转：标题文案本身已经在「正在检索 / 检索完成」之间切换，
     并不是唯一的加载信号；但仍先给一个静态的进行中标记再关动画，
     这样在颜色单一的场景下也不会把「还在转」这条线索彻底抹掉。 */
  .is-spinning {
    color: var(--el-color-primary);
    animation: none;
  }

  /* 三点等待动画（检索中且尚未拿到检索词时显示）：
     真正挂 animation 的是 .search-dots i，所以选择器要落到 i 上才关得掉。
     显式钉死 opacity: 1 —— dotPulse 是 0.2 ↔ 1 的循环，删掉动画后必须保证
     三个点仍然看得见，否则「正在检索」就只剩一片空白、用户以为卡死。 */
  .search-dots i {
    opacity: 1;
    animation: none;
  }
}

/* 键盘焦点可见性：标题行是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式沿用模板里已有的 cursor-pointer，不重复声明。
   环用主色 12% —— 底色是聊天区表面色，深浅主题下都只是一档主色描边。 */
.search-section__header {
  outline: none;
}

.search-section__header:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
</style>
