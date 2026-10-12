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
          <div class="ml-1.5 min-w-0 flex-1 flex items-baseline overflow-hidden">
            <!-- 动作名：按工具给出可辨认的动词（编辑 / 写入 / 搜索文件内容 / 运行命令 …） -->
            <span class="tool-row__action shrink-0"
              :class="rowInfo(toolIndex).failed ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'">{{
                getToolActionLabel(tool) }}</span>
            <span v-if="tool.outcome === 'aborted'" class="shrink-0 text-gray-400">{{
              `（${t('chat.toolCalls.aborted')}）` }}</span>

            <!--
              目标摘要：文件路径 / 命令 / 检索式，用「·」与动作名分隔。
              命令类失败时整段标红——一屏工具行里只有失败那几行刺眼，才看得出问题在哪。
            -->
            <span v-if="rowInfo(toolIndex).target" class="tool-row__target"
              :class="rowInfo(toolIndex).isCommand && rowInfo(toolIndex).failed
                ? 'tool-row__target--failed'
                : 'text-gray-500 dark:text-gray-400'"
              :title="rowInfo(toolIndex).target">· {{ rowInfo(toolIndex).target }}</span>

            <!-- 文件路径可点开在工作区预览 -->
            <button v-if="rowInfo(toolIndex).targetIsPath" type="button" class="tool-row__ext shrink-0"
              :title="t('chat.toolCalls.openFileInWorkspace')"
              :aria-label="t('chat.toolCalls.openFileInWorkspace')"
              @click.stop="previewFile(rowInfo(toolIndex).filePath)">
              <el-icon size="12"><Open16Regular /></el-icon>
            </button>

            <!-- write/edit 增删行数：与文件变更条同一 diffLines 口径，绿色加 / 红色减 -->
            <span v-if="rowInfo(toolIndex).diff.added || rowInfo(toolIndex).diff.removed" class="tool-diff shrink-0">
              <span v-if="rowInfo(toolIndex).diff.added" class="tool-diff__added">+{{ rowInfo(toolIndex).diff.added }}</span>
              <span v-if="rowInfo(toolIndex).diff.removed" class="tool-diff__removed">−{{ rowInfo(toolIndex).diff.removed }}</span>
            </span>

            <!-- 单工具耗时徽标：后端仅工具响应完成后 metadata 里才有 duration，缺省不渲染 -->
            <span v-if="rowInfo(toolIndex).durationMs" class="tool-duration shrink-0">{{ formatToolDuration(rowInfo(toolIndex).durationMs) }}</span>
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

      <!-- 行内展开：调用参数 + 执行结果（与弹窗同源）；max-height 过渡做平滑展开/收起 -->
      <transition name="tool-expand">
        <div v-if="isExpanded(toolIndex)" class="tool-inline" @click.stop>
          <!--
            详情直读消息自带的 toolCalls / toolCallsResponse 轨迹（历史消息接口随消息返回，
            AiSessionController 已把 toolTrace 写进 contentMetadata）。
            不再请求 /message-content/{id}/tool-details：该端点后端从未存在，
            每次展开必 404 → 弹「加载工具详情失败」（2026-10-09 报障根因）。
          -->
          <ToolCallDetail :tool="tool" :response="inlineResponse(toolIndex)"
            :executing="isToolExecuting(tool, toolIndex)" />
        </div>
      </transition>
    </div>
  </div>


  <!-- 单个工具详情对话框（保留入口：超长参数/结果的完整视图） -->
  <LDialog v-if="keepElement && selectedToolIndex !== null" v-model="showDialog"
    :title="t('chat.toolCalls.detailTitle', { index: selectedToolIndex + 1 })" width="700px" :close-on-click-modal="true" destroy-on-close
    :append-to-body="true" class="tool-dialog" @closed="keepElement = false">
    <div class="tool-dialog-content">
      <div v-if="selectedTool" class="tool-call-detail-wrap">
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

        <ToolCallDetail :tool="selectedTool" :response="inlineResponse(selectedToolIndex)"
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
import { computed, ref } from 'vue';
import { ElIcon, ElButton } from 'element-plus';
import { useI18n } from 'vue-i18n';
import { Info24Regular, ChevronRight12Regular, Open16Regular } from '@vicons/fluent';
import LDialog from '@/components/ui/LDialog.vue';
import ToolCallDetail from './ToolCallDetail.vue';
import {
  type ToolCall,
  resolveToolName, getToolIcon,
  getArgsText, getToolActionLabel, isCommandTool,
} from '@/utils/toolDisplay';
import { diffLines } from 'diff';
import { previewFile } from '@/utils/workspacePreview';

const WRITE_TOOLS = new Set(['write', 'edit']);

/** 工具参数 → 可寻址文件路径（write/edit 的 file_path / path） */
function parseArgs(raw: any): Record<string, any> | null {
  if (!raw) return null;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return typeof raw === 'object' ? raw : null;
}

/**
 * 单次 write/edit 调用的增删行数：与 useFileChanges 同一套 diffLines 口径
 * （末尾空行不计），供工具行直接展示「+n / −n」，无需再等文件变更条聚合。
 */
function diffStatFor(tool: ToolCall): { added: number; removed: number } {
  const name = tool.name;
  if (!name || !WRITE_TOOLS.has(name)) return { added: 0, removed: 0 };
  if (tool.outcome && tool.outcome !== 'success') return { added: 0, removed: 0 };
  const args = parseArgs(tool.arguments);
  if (!args) return { added: 0, removed: 0 };
  const oldText: string = name === 'edit' ? (args.old_text ?? '') : '';
  const newText: string = name === 'edit' ? (args.new_text ?? '') : (args.content ?? '');
  let added = 0;
  let removed = 0;
  for (const part of diffLines(oldText, newText)) {
    const effective = part.value.endsWith('\n')
      ? part.value.slice(0, -1).split('\n').length
      : part.value.split('\n').length;
    if (part.added) added += effective;
    else if (part.removed) removed += effective;
  }
  return { added, removed };
}

/** 单工具耗时（毫秒）：后端 SSE 的 toolCallsResponse 不带 duration，
 *  目前取 metadata；缺省时徽标不渲染（见模板 tool-duration）。 */
function durationFor(tool: ToolCall): number {
  const md = tool.metadata || {};
  const raw = md.durationMs ?? md.duration ?? md.elapsedMs ?? md.timecostMs;
  const ms = Number(raw);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

/** 毫秒 → 紧凑徽标：<10s 保留一位小数（"0.4s"），否则取整（"12s"） */
function formatToolDuration(ms: number): string {
  if (!ms || ms <= 0) return '';
  if (ms < 10000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms / 1000)}s`;
}

interface ToolRowInfo {
  filePath: string;
  diff: { added: number; removed: number };
  durationMs: number;
  /** 动作名后的目标摘要：文件路径 / 命令 / 检索式 */
  target: string;
  /** 目标是否落在 `target` 这个字段里（决定能不能点开文件预览） */
  targetIsPath: boolean;
  /** 命令类工具：失败时摘要标红 */
  isCommand: boolean;
  /** 该行是否失败（含被拒/中止） */
  failed: boolean;
}

/** 从参数里挑一个最有信息量的字段当摘要，按工具语义优先级取 */
function pickTarget(args: Record<string, any> | null, filePath: string): { text: string; isPath: boolean } {
  if (!args) return { text: '', isPath: false };
  if (filePath) return { text: filePath, isPath: true };
  const cmd = args.command ?? args.cmd ?? args.script;
  if (cmd) return { text: String(cmd), isPath: false };
  const pattern = args.pattern ?? args.regex ?? args.query ?? args.q;
  if (pattern) return { text: String(pattern), isPath: false };
  const url = args.url ?? args.uri;
  if (url) return { text: String(url), isPath: false };
  return { text: '', isPath: false };
}

/**
 * 按行预计算展示数据。diffStatFor/pickTarget 都要解析 arguments（file 类还要跑 diffLines），
 * 模板里直接调会重复 5 次/行；这里随 toolCalls 变化算一次，模板只做读取。
 */
const rowInfos = computed<ToolRowInfo[]>(() =>
  (props.toolCalls || []).map((tool) => {
    const args = parseArgs(tool.arguments);
    const filePath = args ? String(args.file_path || args.path || '') : '';
    const target = pickTarget(args, filePath);
    return {
      filePath,
      diff: diffStatFor(tool),
      durationMs: durationFor(tool),
      // getArgsText 的返回类型是 string | undefined（它对没有可读参数的工具返回 undefined），
      // 而 ToolRowInfo.target 声明为 string。模板里按字符串用，所以在此收敛成空串，
      // 与上面 pickTarget 返回空串的分支保持同一口径。
      target: target.text || getArgsText(tool) || '',
      targetIsPath: target.isPath,
      isCommand: isCommandTool(tool),
      failed: tool.outcome === 'error' || tool.outcome === 'rejected' || tool.outcome === 'aborted',
    };
  }),
);

const EMPTY_ROW: ToolRowInfo = {
  filePath: '', diff: { added: 0, removed: 0 }, durationMs: 0,
  target: '', targetIsPath: false, isCommand: false, failed: false,
};

const rowInfo = (index: number): ToolRowInfo => rowInfos.value[index] || EMPTY_ROW;

const props = defineProps<{
  toolCalls: ToolCall[];
  toolResponses?: any[];
  isStreaming?: boolean;
}>();

const { t } = useI18n();

// ── 行内展开状态 ──

/**
 * 已展开的行下标（允许同时展开多行：用户常需要对照两次调用的参数/结果）。
 * 展开是纯展示状态，不写回消息数据。
 */
const expandedIndexes = ref<number[]>([]);

const isExpanded = (index: number): boolean => expandedIndexes.value.includes(index);

/**
 * 点击行体：切换展开。详情**无需懒加载**——工具轨迹（toolCalls/toolCallsResponse）
 * 随消息本体返回，展开即渲染（历史幽灵端点已移除，见模板内注释）。
 */
const toggleTool = (index: number) => {
  const at = expandedIndexes.value.indexOf(index);
  if (at >= 0) {
    expandedIndexes.value = expandedIndexes.value.filter((i) => i !== index);
    return;
  }
  expandedIndexes.value = [...expandedIndexes.value, index];
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

const getToolDisplayName = (tool: ToolCall): string => {
  const name = resolveToolName(tool);
  if (tool.name === 'tool_use' && name !== tool.name) {
    return `tool_use.${name}`;
  }
  return tool.name || 'Unknown Tool';
};

// ── 弹窗 ──

const showDialog = ref(false);
const keepElement = ref(false);
const selectedToolIndex = ref<number | null>(null);

const selectedTool = computed(() => {
  if (selectedToolIndex.value === null) return null;
  return props.toolCalls[selectedToolIndex.value] || null;
});

/** 行内展开/弹窗共用的结果载荷：与工具行同索引的响应（历史轨迹随消息返回） */
const inlineResponse = (index: number | null): any =>
  (index === null ? undefined : props.toolResponses?.[index]);

const openSingleToolDialog = (index: number) => {
  selectedToolIndex.value = index;
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

/*
  动作名与目标摘要的排版：
  动作名（编辑 / 运行命令…）定宽不压缩，摘要吃掉剩余空间并在过长时省略，
  这样一列工具行的动词能对齐，扫一眼就知道每行做了哪类事。
*/
.tool-row__action {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.6;
}

.tool-row__target {
  margin-left: 6px;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tool-row__target--failed {
  color: #f56c6c;
  font-weight: 500;
}

/* 单工具耗时徽标（"0.4s"）：比名称更淡一档，等宽数字避免宽度跳动 */
.tool-duration {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

/* 文件路径外链：出现在工具名后，点击在工作区预览该文件 */
.tool-row__ext {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  flex-shrink: 0;
}

.tool-row__ext:hover {
  color: var(--el-color-primary);
}

/* write/edit 增删行数：与文件变更条同色（绿加 / 红减），等宽字体 */
.tool-diff {
  display: inline-flex;
  gap: 6px;
  margin-left: 8px;
  font-size: 12px;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.tool-diff__added {
  color: var(--el-color-success);
}

.tool-diff__removed {
  color: var(--el-color-danger);
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

/* 展开/收起过渡：max-height + opacity 平滑（与 FileChangesBar 同一档动画口径），
   避免 grid-template-rows 把左侧竖线与缩进的 margin/padding/border 破坏。 */
.tool-expand-enter-active,
.tool-expand-leave-active {
  transition: max-height var(--el-transition-duration-fast, 0.2s) ease,
    opacity var(--el-transition-duration-fast, 0.2s) ease;
}

.tool-expand-enter-from,
.tool-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .tool-expand-enter-active,
  .tool-expand-leave-active {
    transition: none;
  }
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
