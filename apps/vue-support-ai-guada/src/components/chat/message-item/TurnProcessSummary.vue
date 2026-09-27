<template>
  <!--
    回合级执行摘要条
    折叠态：单行展示「模型 · 全部阶段」，即本回合发生过什么一目了然；
    展开态：展示完整的阶段明细。
  -->
  <div class="turn-summary" :class="{ 'is-expanded': expanded }">
    <button class="ts-head" type="button" :title="expanded ? t('chat.turn.collapseProcess') : t('chat.turn.expandProcess')"
      @click="emit('toggle')">
      <el-icon class="ts-icon" :class="{ spinning: active }">
        <Loading v-if="active" />
        <ChevronDown12Regular v-else />
      </el-icon>
      <span v-if="modelName" class="ts-model">{{ modelName }}</span>
      <span v-if="modelName && phases.length" class="ts-dot">·</span>

      <span v-if="!phases.length" class="ts-empty">{{ t('chat.turn.noProcess') }}</span>

      <!-- 阶段标签：按本回合真实发生顺序平铺 -->
      <span class="ts-phases">
        <span v-for="p in phases" :key="p.kind" class="ts-chip" :class="'ts-chip--' + p.kind">
          {{ phaseLabel(p.kind) }}<template v-if="p.count > 1"> ×{{ p.count }}</template>
        </span>
      </span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Loading } from '@element-plus/icons-vue';
import { ChevronDown12Regular } from '@vicons/fluent';
import type { PhaseKind, TurnPhase } from '@/utils/turnPhases';

const props = defineProps<{
  phases: TurnPhase[];
  modelName?: string;
  expanded?: boolean;
  /** 流式进行中：图标转为加载态 */
  active?: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();

const { t } = useI18n();

const LABEL_KEY: Record<PhaseKind, string> = {
  search: 'chat.turn.phaseSearch',
  think: 'chat.turn.phaseThink',
  command: 'chat.turn.phaseCommand',
  editFile: 'chat.turn.phaseEditFile',
  read: 'chat.turn.phaseRead',
  web: 'chat.turn.phaseWeb',
  tool: 'chat.turn.phaseTool',
  compose: 'chat.turn.phaseCompose',
};

function phaseLabel(kind: PhaseKind): string {
  return t(LABEL_KEY[kind] || 'chat.turn.phaseTool');
}
</script>

<style scoped>
.turn-summary {
  margin: 2px 0 6px;
}

.ts-head {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 8px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--color-surface, transparent);
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s, border-color 0.15s;
}

.ts-head:hover {
  background: var(--color-surface-hover, var(--el-fill-color-light));
  border-color: var(--el-border-color-light);
}

.ts-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: transform 0.2s ease;
}

.is-expanded .ts-icon {
  transform: rotate(180deg);
}

.ts-icon.spinning {
  animation: ts-spin 1s linear infinite;
}

@keyframes ts-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ts-model {
  flex-shrink: 0;
  font-size: 13px;
  color: var(--el-text-color-primary);
}

.ts-dot {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
}

.ts-empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

/* 允许换行：分栏较窄时宁可多占一行，也不能把后面的阶段标签静默截断 */
.ts-phases {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex-wrap: wrap;
}

.ts-chip {
  flex-shrink: 0;
  padding: 1px 7px;
  border-radius: 999px;
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

/* 阶段配色：思考/检索偏冷，编辑文件与执行命令是用户最关心的两类，给暖色 */
.ts-chip--think { background: rgba(64, 158, 255, 0.12); color: #409eff; }
.ts-chip--search,
.ts-chip--web { background: rgba(144, 147, 153, 0.15); color: #7a7e85; }
.ts-chip--editFile { background: rgba(230, 162, 60, 0.16); color: #b88230; }
.ts-chip--command { background: rgba(103, 194, 58, 0.16); color: #529b2e; }
.ts-chip--read { background: rgba(64, 158, 255, 0.08); color: #5b8fd0; }
.ts-chip--compose { background: rgba(103, 194, 58, 0.1); color: #4d8f2c; }
</style>
