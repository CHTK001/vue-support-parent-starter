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
/* ============================================================================
   令牌口径（与本批 8 个聊天组件统一）：
   1. 颜色走 --el-*（refactor.css 已把 --el-* 映射到 --color-* 主题层，
      9 套配色换肤时自动跟随）。
   2. 阶段标签的配色全部改成「语义色 + 透明度」派生：浅底用
      color-mix 打 tinted 底，深色下自动变暗底，不会再出现「暗色模式下一排
      亮蓝底」的割裂感。文字取各语义色的 dark-2 档——这正是原代码用
      #b88230 / #529b2e 而不是基色的原因：8%~16% 的浅底上必须用深一档的
      同色系文字才够对比度。
   3. 摘要条是行不是卡片，不加投影；本文件唯一允许的 box-shadow 是焦点环。
   ============================================================================ */

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
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color-overlay);
  cursor: pointer;
  text-align: left;
  outline: none;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s) ease,
    border-color var(--el-transition-duration-fast, 0.2s) ease;
}

/* 键盘焦点环：这是原生 button，浏览器默认 outline 会被容器边框压住，改用主色光环 */
.ts-head:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.ts-head:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-border-color-light);
}

.ts-icon {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  transition: transform var(--el-transition-duration-fast, 0.2s) ease;
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
  /* 原值 999px → full 档 */
  border-radius: var(--el-radius-full, 9999px);
  font-size: 11px;
  line-height: 16px;
  white-space: nowrap;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-regular);
}

/* 阶段配色：思考/检索偏冷，编辑文件与执行命令是用户最关心的两类，给暖色。
   底色一律由语义色按原透明度派生（color-mix），文字取同色系 dark-2 档。
   原值对照：think #409eff / search #7a7e85 / editFile #b88230 /
             command #529b2e / read #5b8fd0 / compose #4d8f2c */
.ts-chip--think { background: color-mix(in srgb, var(--el-color-primary) 12%, transparent); color: var(--el-color-primary); }
.ts-chip--search,
.ts-chip--web { background: color-mix(in srgb, var(--el-text-color-regular) 15%, transparent); color: var(--el-text-color-regular); }
.ts-chip--editFile { background: color-mix(in srgb, var(--el-color-warning) 16%, transparent); color: var(--el-color-warning-dark-2); }
.ts-chip--command { background: color-mix(in srgb, var(--el-color-success) 16%, transparent); color: var(--el-color-success-dark-2); }
.ts-chip--read { background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); color: var(--el-color-primary-dark-2); }
.ts-chip--compose { background: color-mix(in srgb, var(--el-color-success) 10%, transparent); color: var(--el-color-success-dark-2); }

/* 尊重系统「减少动态效果」偏好 */
@media (prefers-reduced-motion: reduce) {
  .ts-head,
  .ts-icon {
    transition: none;
  }
  .ts-icon.spinning {
    animation: none;
  }
}
</style>
