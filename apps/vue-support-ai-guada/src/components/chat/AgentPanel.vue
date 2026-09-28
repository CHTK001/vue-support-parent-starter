<template>
  <div v-if="hasSubAgents" class="max-w-full w-full flex px-4">
    <div class="agent-panel w-full" :class="{ 'is-expanded': isExpanded }">
      <!-- Header bar (clickable to toggle) -->
      <div class="agent-panel-header" @click="isExpanded = !isExpanded">
        <span class="flex-1 text-xs text-gray-500 dark:text-[#8b8d95] truncate">
          <template v-if="!isExpanded">
            {{ t('chat.agent.subAgentCount', { count: subAgentCount }) }}<span v-if="runningCount > 0">{{ t('chat.agent.subAgentRunning', { count: runningCount }) }}</span>
          </template>
          <template v-else>{{ t('chat.agent.subAgent') }}</template>
        </span>
        <svg class="shrink-0 text-gray-400 dark:text-[#6b6d73] transition-transform duration-200"
          :class="{ 'rotate-180': isExpanded }" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
      <!-- Expandable agent list -->
      <div class="agent-panel-list-wrapper">
        <div class="agent-panel-list">
          <div v-for="tab in allTabs" :key="tab.id" class="agent-panel-item"
            :class="{ 'is-active': tab.id === activeTabId }" @click="$emit('switch', tab.id)">
            <img v-if="tab.avatarUrl" :src="tab.avatarUrl" class="w-5 h-5 rounded-full shrink-0 object-cover"
              alt="" />
            <span class="flex-1 text-xs truncate"
              :class="tab.id === activeTabId ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-600 dark:text-[#8b8d95]'"
              :title="tab.name">{{ tab.name }}</span>
            <el-icon v-if="tab.status === 'running'" size="12" class="text-blue-500 is-loading shrink-0">
              <Loading />
            </el-icon>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Loading } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

interface AgentTab {
  id: string;
  name: string;
  status: 'running' | 'completed' | 'error';
  loaded?: boolean;
  avatarUrl?: string;
}

const props = defineProps<{
  agentTabs?: AgentTab[];
  activeTabId?: string;
}>();

defineEmits<{
  switch: [tabId: string];
}>();

const isExpanded = ref(false);

const allTabs = computed(() => props.agentTabs || []);

const hasSubAgents = computed(() => allTabs.value.length > 1);

const subAgentCount = computed(() => Math.max(0, allTabs.value.length - 1));

const runningCount = computed(() =>
  allTabs.value.filter(t => t.id !== 'main' && t.status === 'running').length,
);
</script>

<style scoped>
/* 令牌口径：--color-secondary-surface / --size-dialog-rounded-radius 都锚在
   refactor.css 的主题层上（明暗各有一份），但圆角改走 --el-radius-* 六档统一口径；
   rgba(0,0,0,.03) 这类手写半透明蒙版在暗色下会变成黑块，一律改用 --el-fill-color-*。 */
.agent-panel {
  /* 原值 var(--size-dialog-rounded-radius)：refactor.css 里实为 18px → xl 档 */
  border-radius: var(--el-radius-xl, 16px) var(--el-radius-xl, 16px) 0 0;
  /* 原值 var(--color-secondary-surface) → 页面次级底色令牌（明暗自动切换） */
  background: var(--el-bg-color-page);
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  overflow: hidden;
}

.dark .agent-panel {
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  backdrop-filter: blur(20px) saturate(1.5);
}

/* 可点击的折叠头（div + @click）：光标与焦点环都要自己给 */
.agent-panel-header {
  display: flex;
  align-items: center;
  padding: 8px 16px 4px;
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
}

.agent-panel-header:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 原值 rgba(0,0,0,.03) / 暗色下 rgba(255,255,255,.04) → 悬停底色令牌，
   两侧都由 refactor.css 的 html.dark 统一给值，不再需要手写 .dark 分支。 */
.agent-panel-header:hover {
  background: var(--el-fill-color-lighter);
}

.agent-panel-list-wrapper {
  max-height: 0;
  overflow: hidden;
  transition: max-height var(--el-transition-duration-fast, 0.2s) ease;
}

.agent-panel.is-expanded .agent-panel-list-wrapper {
  max-height: 300px;
}

.agent-panel-list {
  padding: 0 8px 8px;
  max-height: 240px;
  overflow-y: auto;
  scrollbar-width: thin;
}

.agent-panel-list::-webkit-scrollbar {
  width: 4px;
}

.agent-panel-list::-webkit-scrollbar-thumb {
  background: var(--el-fill-color-dark);
  /* 原值 2px（约等于 4px 宽的一半即胶囊）→ full 档 */
  border-radius: var(--el-radius-full, 9999px);
}

.agent-panel-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 8px;
  /* 原值 calc(var(--size-dialog-rounded-radius)/2)，实为 9px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  cursor: pointer;
  outline: none;
  transition: background-color var(--el-transition-duration-fast, 0.2s) ease;
  margin-top: 2px;
}

.agent-panel-item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* 原值 rgba(0,0,0,.04) / 暗色下 rgba(255,255,255,.05) → 悬停底色令牌 */
.agent-panel-item:hover {
  background: var(--el-fill-color-lighter);
}

.agent-panel-item.is-active {
  background: var(--el-fill-color-light);
}

/* 尊重系统「减少动态效果」偏好。
   注意 .agent-panel-item 的选中态只靠底色区分，关掉过渡后仍然看得见，
   不需要额外的静态样式。 */
@media (prefers-reduced-motion: reduce) {
  .agent-panel-header,
  .agent-panel-list-wrapper,
  .agent-panel-item {
    transition: none;
  }
}
</style>
