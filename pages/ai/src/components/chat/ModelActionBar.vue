<template>
  <!--
    模型动作条：贴在输入框上方的一行「模型此刻在干什么」。

    四种形态（优先级从高到低）：
      1. executing —— 正在跑工具：pill 提示 + 一张可展开的命令卡（命令摘要 + 耗时 + 停止按钮）
      2. waiting   —— 等待用户（plan_exit 人工确认挂起）
      3. thinking  —— 正在思考
      4. streaming —— 正在生成（无更具体的步骤时）
      5. idle      —— 不渲染整条（不占高度）

    数据全部由父级（ChatPanel）从会话轨迹推导后传入，本组件只负责展示与转发
    停止/展开动作，判据集中在会话状态一侧，避免同一状态多处计算分叉。

    展开行为（用户需求 2026-11-07）：命令卡右侧箭头点开 = 展开完整的
    命令行与执行输出（与时间线里工具行的展开详情同源数据）。
  -->
  <Transition name="mab-slide">
    <div v-if="visible" class="model-action-bar" data-testid="model-action-bar">
      <!-- 左：状态 pill -->
      <div class="mab-pill" :class="{ 'is-waiting': kind === 'waiting' }">
        <span v-if="kind === 'executing'" class="mab-spinner" aria-hidden="true"></span>
        <el-icon v-else-if="kind === 'waiting'" size="13"><Info12Filled /></el-icon>
        <span v-else-if="kind === 'thinking'" class="mab-spinner mab-spinner--think" aria-hidden="true"></span>
        <span class="mab-pill__text">{{ pillText }}</span>
        <!-- 收起/展开整条（需求 8：右上角小箭头收起，只留 pill） -->
        <button v-if="kind === 'executing' && card" type="button" class="mab-collapse-btn"
          :aria-label="cardOpen ? '收起命令详情' : '展开命令详情'"
          :aria-expanded="cardOpen"
          @click.stop="cardOpen = !cardOpen">
          <el-icon size="12" class="mab-collapse-chevron" :class="{ 'is-open': cardOpen }"><ArrowDown12Filled /></el-icon>
        </button>
      </div>

      <!-- 右：执行中的命令卡（默认收起为单行摘要；展开后显示完整命令与输出） -->
      <div v-if="kind === 'executing' && card" v-show="cardOpen" class="mab-card">
        <div class="mab-card__head">
          <el-icon size="14" class="mab-card__icon"><component :is="card.icon" /></el-icon>
          <span class="mab-card__cmd mono-ellipsis" :title="card.fullCommand">{{ card.summary }}</span>
          <span v-if="card.elapsedText" class="mab-card__elapsed">{{ card.elapsedText }}</span>
          <!-- 需求 7：卡住的 cmd 支持关闭（终止本轮执行） -->
          <button type="button" class="mab-card__stop" @click.stop="$emit('stop')">
            停止
          </button>
        </div>
        <div v-if="card.detail" class="mab-card__detail">
          <pre class="mab-card__pre">{{ card.detail }}</pre>
        </div>
      </div>

      <!-- 等待用户态：行动入口（定位到批准卡） -->
      <button v-if="kind === 'waiting'" type="button" class="mab-waiting-hint" @click="$emit('locate')">
        正在等待你在页面上作答
      </button>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { ElIcon } from 'element-plus';
import { ArrowDown12Filled, Info12Filled } from '@vicons/fluent';

/**
 * 卡片数据：由父级组装（含实时耗时文本），本组件不再自行计时。
 * summary 一行截断；fullCommand/detail 展开后可见。
 */
export interface ModelActionCard {
  /** 动作名（如「Shell Command」「编辑文件」） */
  label: string;
  /** 单行摘要（命令 / 路径） */
  summary: string;
  /** 完整命令（悬停 title + 展开详情用） */
  fullCommand?: string;
  /** 展开后的详情文本（调用参数 + 已有的部分输出） */
  detail?: string;
  /** 实时耗时（如「16秒」），后端未回传 duration 时不显示 */
  elapsedText?: string;
  /** 工具图标组件 */
  icon: any;
}

const props = defineProps<{
  /** 当前状态类型；null = 不渲染 */
  kind: 'executing' | 'thinking' | 'streaming' | 'waiting' | null;
  /** 状态文案（已由父级 i18n 化） */
  text?: string;
  /** 模型名（如「卡扣-deepseek-v4.1-flash」） */
  modelName?: string;
  /** executing 时的命令卡数据 */
  card?: ModelActionCard | null;
}>();

defineEmits<{
  stop: [];
  locate: [];
}>();

const cardOpen = ref(false);

const visible = computed(() => props.kind !== null);

const pillText = computed(() => {
  if (!props.kind) return '';
  const model = props.modelName ? `${props.modelName}` : '';
  switch (props.kind) {
    case 'executing':
      return `${model}正在执行命令`;
    case 'thinking':
      return `${model}正在思考`;
    case 'streaming':
      return `${model}正在等待你的回答`;
    case 'waiting':
      return `${model}正在等待你的回答`;
    default:
      return '';
  }
});
</script>

<style scoped>
.model-action-bar {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 2px 4px 6px;
}

/* ── 状态 pill ── */
.mab-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  user-select: none;
}

.mab-pill.is-waiting {
  color: var(--el-color-primary);
  border-color: color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  background: color-mix(in srgb, var(--el-color-primary) 6%, transparent);
}

.mab-pill__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── spinner：小圆点旋转（思考/执行共用，色不同） ── */
.mab-spinner {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  border: 2px solid var(--el-color-primary);
  border-top-color: transparent;
  animation: mab-spin 0.9s linear infinite;
  flex-shrink: 0;
}

.mab-spinner--think {
  border-color: var(--el-text-color-placeholder);
  border-top-color: transparent;
}

@keyframes mab-spin {
  to { transform: rotate(360deg); }
}

/* 收起箭头按钮 */
.mab-collapse-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  flex-shrink: 0;
}

.mab-collapse-btn:hover {
  background: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.mab-collapse-chevron {
  transition: transform 0.18s ease;
}

.mab-collapse-chevron.is-open {
  transform: rotate(180deg);
}

/* ── 命令卡 ── */
.mab-card {
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}

.mab-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
}

.mab-card__icon {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  display: inline-flex;
}

/* 命令摘要：等宽字体、单行截断、悬停见全文 */
.mono-ellipsis {
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
  flex: 1;
}

.mab-card__elapsed {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  white-space: nowrap;
}

/* 停止按钮：红字轻按钮（与参考图「停止」一致） */
.mab-card__stop {
  border: none;
  background: transparent;
  color: var(--el-color-danger);
  font-size: 12.5px;
  padding: 2px 8px;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
}

.mab-card__stop:hover {
  background: color-mix(in srgb, var(--el-color-danger) 10%, transparent);
}

/* 展开的详情：等宽 pre，限高可滚 */
.mab-card__detail {
  border-top: 1px solid var(--el-border-color-lighter, #ebeef5);
  padding: 8px 10px;
  background: var(--el-fill-color-lighter, #fafafa);
}

.mab-card__pre {
  margin: 0;
  max-height: 180px;
  overflow-y: auto;
  font-family: var(--font-mono, "SF Mono", Consolas, monospace);
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  word-break: break-all;
}

/* ── 等待用户的行动入口 ── */
.mab-waiting-hint {
  align-self: flex-start;
  border: none;
  background: transparent;
  color: var(--el-color-primary);
  font-size: 12.5px;
  padding: 2px 0;
  cursor: pointer;
}

.mab-waiting-hint:hover {
  text-decoration: underline;
}

/* ── 进出场：轻微上滑淡入，GPU 属性 ── */
.mab-slide-enter-active,
.mab-slide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mab-slide-enter-from,
.mab-slide-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

@media (prefers-reduced-motion: reduce) {
  .mab-slide-enter-active,
  .mab-slide-leave-active {
    transition: none;
  }

  .mab-spinner {
    animation: none;
    border-top-color: var(--el-color-primary);
  }

  .mab-spinner--think {
    border-top-color: var(--el-text-color-placeholder);
  }
}
</style>
