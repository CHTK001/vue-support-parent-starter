<template>
  <div class="process-section tool-calls-section space-y-2">
    <div class="" v-for="(tool, toolIndex) in toolCalls" :key="toolIndex">
      <!--
        工具调用行（可折叠）：
          默认  → 工具对应图标（失败/终止态换色）
          悬停  → 「>」右折角（提示可展开）
          展开  → 「v」折下箭头（chevron 旋转 90° 得到，展开态优先于悬停态）
        点击行体 = 行内展开/收起参数与结果；行尾「详情」按钮打开原弹窗（大内容用）。

        a11y：行体是 role="button"，行尾「详情」是真正的 <button>。二者**必须同级**——
        把 button 嵌在 role="button" 里属于交互控件嵌套，读屏会把内层按钮当装饰、
        键盘可达性也变得不可预测（2026-10-08 修正）。
      -->
      <div class="tool-row-line flex items-center min-w-0">
        <div
          class="tool-row flex items-center flex-1 min-w-0 text-sm text-gray-700 dark:text-[#8b8d95] cursor-pointer font-medium transition-colors duration-200"
          :class="{ 'is-expanded': isExpanded(toolIndex) }" role="button" tabindex="0"
          :aria-expanded="isExpanded(toolIndex)" @click.stop="toggleTool(toolIndex)"
          @keydown.enter.prevent="toggleTool(toolIndex)" @keydown.space.prevent="toggleTool(toolIndex)">
          <span class="tool-row__glyph shrink-0">
            <el-icon v-if="tool.outcome === 'error' || tool.outcome === 'rejected'" class="glyph-icon" size="15"
              style="color: #f56c6c;">
              <component :is="getToolIcon(tool)" />
            </el-icon>
            <el-icon v-else-if="tool.outcome === 'aborted'" class="glyph-icon" size="15" style="color: #c0c4cc;">
              <component :is="getToolIcon(tool)" />
            </el-icon>
            <el-icon v-else class="glyph-icon" size="15" :class="{ 'shimmer-icon': isToolExecuting(tool, toolIndex) }">
              <component :is="getToolIcon(tool)" class="text-gray-500" />
            </el-icon>
            <el-icon class="glyph-chevron" size="12">
              <ChevronRight12Regular />
            </el-icon>
          </span>
          <div class="ml-1.5 min-w-0 flex-1 flex items-center text-gray-400 dark:text-gray-500 overflow-hidden">
            <span class="shrink-0"
              :class="tool.outcome === 'aborted' ? 'text-gray-400 dark:text-gray-500 font-medium' : 'text-gray-700 dark:text-gray-300 font-medium'">{{
                getActionText(tool, toolIndex) }}</span>
            <span v-if="getArgsText(tool)" class="text-sm ml-2 truncate">{{ getArgsText(tool) }}</span>
          </div>
        </div>

        <!-- 「详情」入口（与行体同级）：悬停/展开时出现；单独弹窗承载超长内容 -->
        <button type="button" class="tool-row__detail shrink-0" :title="t('chat.toolCalls.viewDetail')"
          :aria-label="t('chat.toolCalls.viewDetail')" @click.stop="openSingleToolDialog(toolIndex)">
          <el-icon size="14">
            <Info24Regular />
          </el-icon>
        </button>
      </div>

      <!-- 行内展开：调用参数 + 执行结果（与弹窗同源） -->
      <div v-if="isExpanded(toolIndex)" class="tool-inline" @click.stop>
        <div v-if="isLoadingDetails" class="tool-inline__loading">
          <el-icon size="14" class="animate-spin text-blue-500 mr-1">
            <Loading />
          </el-icon>
          <span>{{ t('chat.toolCalls.loadingDetails') }}</span>
        </div>
        <ToolCallDetail v-else :tool="tool" :response="inlineResponse(toolIndex)"
          :executing="isToolExecuting(tool, toolIndex)" />
      </div>
    </div>
  </div>


  <!-- 单个工具详情对话框（保留入口：超长参数/结果的完整视图） -->
  <LDialog v-if="keepElement && selectedToolIndex !== null" v-model="showDialog"
    :title="t('chat.toolCalls.detailTitle', { index: selectedToolIndex + 1 })" width="700px" :close-on-click-modal="true" destroy-on-close
    :append-to-body="true" class="tool-dialog" @closed="keepElement = false">
    <div class="tool-dialog-content">
      <!-- 加载状态 -->
      <div v-if="isLoadingDetails" class="flex items-center justify-center py-8">
        <el-icon size="24" class="animate-spin text-blue-500 mr-2">
          <Loading />
        </el-icon>
        <span class="text-gray-500">{{ t('chat.toolCalls.loadingDetails') }}</span>
      </div>
      <div v-else-if="selectedTool" class="tool-call-detail-wrap">
        <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <el-icon v-if="isExecuting" size="18" class="text-blue-500">
            <component :is="getToolIcon(selectedTool)" />
          </el-icon>
          <el-icon v-else-if="selectedTool?.outcome === 'error' || selectedTool?.outcome === 'rejected'" size="18"
            style="color:#f56c6c">
            <component :is="getToolIcon(selectedTool)" />
          </el-icon>
          <el-icon v-else size="18" class="text-blue-500">
            <component :is="getToolIcon(selectedTool)" />
          </el-icon>
          <span class="text-base font-semibold text-gray-800 dark:text-gray-200">
            {{ getToolDisplayName(selectedTool) }}
          </span>
          <span class="text-xs text-gray-400 ml-auto">
            #{{ selectedToolIndex + 1 }}
          </span>
        </div>

        <ToolCallDetail :tool="selectedTool" :response="currentToolResponses?.[selectedToolIndex]"
          :executing="isExecuting" />
      </div>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">关闭</el-button>
      </span>
    </template>
  </LDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ElIcon, ElButton } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { Info24Regular, ChevronRight12Regular } from '@vicons/fluent';
// @ts-ignore - icons 组件尚未迁移到 TypeScript
import { Loading } from '@/components/icons';
import { apiService } from '@/services/ApiService';
import { usePopup } from '@/composables/usePopup';
import LDialog from '@/components/ui/LDialog.vue';
import ToolCallDetail from './ToolCallDetail.vue';
import {
  type ToolCall,
  resolveToolName, getToolConfig, getToolIcon,
  getArgsText,
} from '@/utils/toolDisplay';

const props = defineProps<{
  toolCalls: ToolCall[];
  toolResponses?: any[];
  isStreaming?: boolean;
  contentId?: string;
}>();

const { toast } = usePopup();
const { t } = useI18n();

// ── 行内展开状态 ──

/**
 * 已展开的行下标（允许同时展开多行：用户常需要对照两次调用的参数/结果）。
 * 展开是纯展示状态，不写回消息数据。
 */
const expandedIndexes = ref<number[]>([]);

const isExpanded = (index: number): boolean => expandedIndexes.value.includes(index);

/**
 * 点击行体：切换展开；首次展开且详情需懒加载时，顺带把完整 details 拉回来。
 */
const toggleTool = (index: number) => {
  const at = expandedIndexes.value.indexOf(index);
  if (at >= 0) {
    expandedIndexes.value = expandedIndexes.value.filter((i) => i !== index);
    return;
  }
  expandedIndexes.value = [...expandedIndexes.value, index];
  void loadToolDetails();
};

// ── 执行状态 ──

const isExecuting = computed(() => {
  if (props.isStreaming === false) return false;
  if (props.toolResponses && props.toolResponses.length > 0) return false;
  if (props.toolCalls?.some((tc) => tc.outcome)) return false;
  return true;
});

const isToolExecuting = (tool: ToolCall, index: number): boolean => {
  if (tool.outcome) return false;
  if (props.isStreaming === false) return false;
  if (props.toolResponses && props.toolResponses[index]) return false;
  return true;
};

// ── 展示文案 ──

const getActionText = (tool: ToolCall, toolIndex: number): string => {
  const config = getToolConfig(tool);
  const executing = isToolExecuting(tool, toolIndex);
  if (tool.outcome === 'aborted') {
    return `${config.text.completed}（${t('chat.toolCalls.aborted')}）`;
  }
  return executing ? config.text.executing : config.text.completed;
};

const getToolDisplayName = (tool: ToolCall): string => {
  const name = resolveToolName(tool);
  if (tool.name === 'tool_use' && name !== tool.name) {
    return `tool_use.${name}`;
  }
  return tool.name || 'Unknown Tool';
};

// ── 弹窗 & 懒加载 ──

const showDialog = ref(false);
const keepElement = ref(false);
const selectedToolIndex = ref<number | null>(null);
const isLoadingDetails = ref(false);
const loadedToolCalls = ref<ToolCall[] | null>(null);
const loadedToolResponses = ref<any[] | null>(null);

const selectedTool = computed(() => {
  if (selectedToolIndex.value === null) return null;
  if (loadedToolCalls.value && loadedToolCalls.value[selectedToolIndex.value]) {
    return loadedToolCalls.value[selectedToolIndex.value];
  }
  if (props.toolCalls) {
    return props.toolCalls[selectedToolIndex.value];
  }
  return null;
});

const currentToolResponses = computed(() => {
  if (loadedToolResponses.value) return loadedToolResponses.value;
  return props.toolResponses;
});

/** 行内展开取用与弹窗同源的结果载荷 */
const inlineResponse = (index: number): any => currentToolResponses.value?.[index];

const needsLazyLoad = computed(() => {
  if (!props.contentId) return false;
  if (isExecuting.value) return false;
  return true;
});

async function loadToolDetails() {
  if (!props.contentId || !needsLazyLoad.value) return;
  if (isLoadingDetails.value) return;
  if (loadedToolResponses.value) return;

  isLoadingDetails.value = true;
  try {
    const result = await apiService.fetchMessageContentToolDetails(props.contentId);
    loadedToolCalls.value = result.toolCalls || [];
    loadedToolResponses.value = result.toolCallsResponse || [];
  } catch (error: any) {
    console.error('加载工具调用详情失败:', error);
    toast.error(t('chat.toolCalls.loadDetailsFailed'));
  } finally {
    isLoadingDetails.value = false;
  }
}

watch(showDialog, (newVal) => {
  if (newVal && needsLazyLoad.value) {
    loadToolDetails();
  }
});

const openSingleToolDialog = (index: number) => {
  selectedToolIndex.value = index;
  loadedToolCalls.value = null;
  loadedToolResponses.value = null;
  showDialog.value = true;
  keepElement.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
  selectedToolIndex.value = null;
};
</script>

<style scoped>
.tool-dialog-content {
  line-height: 1.6;
}

/* ── 行首字形：默认工具图标 / 悬停「>」/ 展开「v」 ── */
.tool-row {
  user-select: none;
}

.tool-row__glyph {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 20px;
}

.tool-row__glyph .glyph-icon {
  display: inline-flex;
}

.tool-row__glyph .glyph-chevron {
  display: none;
  color: var(--el-text-color-secondary);
  transition: transform 0.15s ease;
}

/* 悬停（未展开）：图标让位给右折角 */
.tool-row:not(.is-expanded):hover .glyph-icon {
  display: none;
}

.tool-row:not(.is-expanded):hover .glyph-chevron {
  display: inline-flex;
}

/* 展开：折下的箭头（右折角旋转 90°），优先于悬停态 */
.tool-row.is-expanded .glyph-icon {
  display: none;
}

.tool-row.is-expanded .glyph-chevron {
  display: inline-flex;
  transform: rotate(90deg);
}

/* 「详情」入口：悬停或展开时可见（触屏/键盘聚焦也能看到） */
.tool-row__detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 6px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

/* 「详情」入口：悬停或展开时可见（触屏/键盘聚焦也能看到）。
   按钮与行体同级，故悬停态挂在整行容器 .tool-row-line 上；
   展开态用相邻兄弟选择器 `.tool-row.is-expanded + .tool-row__detail`。 */
.tool-row-line:hover .tool-row__detail,
.tool-row.is-expanded + .tool-row__detail,
.tool-row__detail:focus-visible {
  opacity: 1;
}

.tool-row__detail:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

/* ── 行内展开区：左侧细线缩进，与「过程行」层级一致 ── */
.tool-inline {
  margin: 4px 0 2px 16px;
  padding-left: 12px;
  border-left: 2px solid var(--el-border-color-lighter);
}

.tool-inline__loading {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 工具正在执行时图标闪烁提示（原定义已被清理，补回） */
.shimmer-icon {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
</style>
