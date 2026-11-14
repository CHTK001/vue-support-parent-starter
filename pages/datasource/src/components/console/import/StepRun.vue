<script setup lang="ts">
/**
 * 第 7 步：执行。
 *
 * <p>进度条与日志都直接吃 SSE 推来的事件：进度条回答「还要多久」，日志回答
 * 「哪几行失败了、为什么」。两者不分页、不折叠，出错时用户不用再去点开什么。</p>
 */
import { nextTick, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import WizardStepHead from "../wizard/WizardStepHead.vue";
import type { ImportWizardCtx } from "./useImportWizard";

const props = defineProps<{
  /** 向导控制器 */
  ctx: ImportWizardCtx;
}>();

/** 日志框：滚动到底要拿到 DOM，留在这一步 */
const logBox = ref<HTMLDivElement | null>(null);

watch(
  () => props.ctx.logLines.length,
  () => {
    void nextTick(() => {
      if (logBox.value) {
        logBox.value.scrollTop = logBox.value.scrollHeight;
      }
    });
  },
);
</script>

<template>
  <section class="wz-pane">
    <WizardStepHead title="执行" desc="核对下面这组参数，点「开始」按当前模式写库；失败的行会逐条留在日志里。">
      <template #meta>
        步骤 7 / 7<br />
        {{ ctx.modeLabel }} · 每批 {{ ctx.batchSize }} 行
      </template>
    </WizardStepHead>

    <div class="wz-kv">
      <div class="wz-kv-cell is-name">
        <span class="wz-kv-label">目标表</span>
        <span class="wz-kv-value" :title="ctx.targetDisplay || ''">{{ ctx.targetDisplay || "—" }}</span>
      </div>
      <div>
        <span class="wz-kv-label">已处理</span>
        <span class="wz-kv-value">
          {{ ctx.run.done }}<small> / {{ ctx.run.total || ctx.preview?.rowCount || 0 }}</small>
        </span>
      </div>
      <div>
        <span class="wz-kv-label">已新增</span>
        <span class="wz-kv-value">{{ ctx.run.inserted }}</span>
      </div>
      <div>
        <span class="wz-kv-label">已更新</span>
        <span class="wz-kv-value">{{ ctx.run.updated }}</span>
      </div>
      <div>
        <span class="wz-kv-label">已删除</span>
        <span class="wz-kv-value">{{ ctx.run.deleted }}</span>
      </div>
      <div>
        <span class="wz-kv-label">错误</span>
        <span class="wz-kv-value" :class="{ 'is-bad': ctx.runErrors > 0 }">{{ ctx.runErrors }}</span>
      </div>
      <div>
        <span class="wz-kv-label">耗时</span>
        <span class="wz-kv-value">{{ ctx.elapsedText }}</span>
      </div>
    </div>

    <div class="wz-progress-block">
      <div class="wz-progress-meta">
        <span v-if="ctx.batchTotal">第 {{ Math.min(ctx.batchTotal, Math.ceil(ctx.run.done / Math.max(1, ctx.batchSize))) }} / {{ ctx.batchTotal }} 批</span>
        <span v-else>{{ ctx.running ? "正在准备…" : "尚未开始" }}</span>
        <span class="wz-progress-pct">{{ ctx.progressPercent }}%</span>
      </div>
      <el-progress :percentage="ctx.progressPercent" :stroke-width="6" :show-text="false" />
    </div>

    <div class="wz-log-head">
      <span class="wz-log-title">日志</span>
      <span class="wz-spacer" />
      <ReButton size="small" icon="Download" :disabled="!ctx.logLines.length" @click="ctx.saveLog()">保存日志</ReButton>
      <ReButton size="small" icon="Document" :disabled="!ctx.logLines.length" @click="ctx.copyLog()">复制</ReButton>
    </div>
    <div ref="logBox" class="wz-log">
      <div v-for="(line, i) in ctx.logLines" :key="i" class="wz-log-line" :class="`is-${line.tone}`">
        <span class="wz-log-time">{{ line.at }}</span>
        <span class="wz-log-text">{{ line.text }}</span>
      </div>
      <div v-if="!ctx.logLines.length" class="wz-log-empty">
        还没有开始。点右下角「开始」按钮执行导入。
      </div>
    </div>
  </section>
</template>

<style scoped>
.wz-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* KPI：一格一边线，像 el-descriptions 的紧凑版 */
.wz-kv {
  display: grid;
  /* 第一格放「库.表」这种长名，给足宽度，其余六格均分 */
  grid-template-columns: minmax(0, 2.4fr) repeat(6, minmax(0, 1fr));
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  overflow: hidden;
  background: var(--el-bg-color);
}
.wz-kv > div {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 9px 11px;
  border-left: 1px solid var(--el-border-color-lighter);
  min-width: 0;
}
.wz-kv > div:first-child {
  border-left: 0;
}
.wz-kv-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.wz-kv-value {
  font-family: var(--el-font-family-mono, monospace);
  font-size: 15px;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wz-kv-value small {
  font-size: 10px;
  color: var(--el-text-color-placeholder);
}
.wz-kv-value.is-bad {
  color: var(--el-color-danger);
}
/* 表名比数字长得多：降一档字号并允许折行，库.表 才能完整显示 */
.wz-kv-cell.is-name .wz-kv-value {
  font-size: 13px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-all;
  cursor: help;
}

.wz-progress-block {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.wz-progress-meta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.wz-progress-pct {
  margin-left: auto;
  font-family: var(--el-font-family-mono, monospace);
}

.wz-log-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.wz-log-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.wz-spacer {
  flex: 1;
}
.wz-log {
  height: 172px;
  overflow-y: auto;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md);
  background: var(--el-fill-color-lighter);
  font-family: var(--el-font-family-mono, monospace);
  font-size: 12px;
  line-height: 1.7;
}
.wz-log-line {
  display: flex;
  gap: 8px;
}
.wz-log-time {
  flex: none;
  color: var(--el-text-color-placeholder);
}
.wz-log-text {
  flex: 1;
  min-width: 0;
  word-break: break-all;
  color: var(--el-text-color-regular);
}
.wz-log-line.is-error .wz-log-text {
  color: var(--el-color-danger);
}
.wz-log-line.is-warn .wz-log-text {
  color: var(--el-color-warning-dark-2);
}
.wz-log-line.is-ok .wz-log-text {
  color: var(--el-color-success);
}
.wz-log-empty {
  color: var(--el-text-color-placeholder);
}

@media (max-width: 860px) {
  .wz-kv {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .wz-kv > div:nth-child(4n + 1) {
    border-left: 0;
  }
  .wz-kv > div:nth-child(n + 5) {
    border-top: 1px solid var(--el-border-color-lighter);
  }
}
</style>
