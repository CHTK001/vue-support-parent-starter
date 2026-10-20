<!--
  任务质量报告：从任务节点日志聚合节点成功率、入库情况与最慢节点，
  供运行记录页快速判断一次采集是否健康。
-->
<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { msgError } from "@repo/core";
import ReDialog from "@repo/ui/re-dialog";
import ReTag from "@repo/ui/re-tag";
import { fetchTaskQuality } from "../api/collectApi";
import { errText } from "../composables/useCollectView";
import type { CollectQuality, CollectTask } from "../types/collect";

const props = defineProps<{
  modelValue: boolean;
  task: CollectTask | null;
}>();

const emit = defineEmits<{ (e: "update:modelValue", value: boolean): void }>();

const visible = ref(props.modelValue);
const loading = ref(false);
const quality = ref<CollectQuality | null>(null);

watch(
  () => props.modelValue,
  value => {
    visible.value = value;
    if (value && props.task) {
      void load();
    }
  },
);

watch(visible, value => emit("update:modelValue", value));

onMounted(() => {
  if (visible.value && props.task) {
    void load();
  }
});

async function load(): Promise<void> {
  if (!props.task) return;
  loading.value = true;
  quality.value = null;
  try {
    quality.value = (await fetchTaskQuality(props.task.collectTaskId)) ?? null;
  } catch (error) {
    msgError(errText(error));
  } finally {
    loading.value = false;
  }
}

const scoreColor = (score: number): "success" | "warning" | "danger" =>
  score >= 90 ? "success" : score >= 70 ? "warning" : "danger";

const scoreText = (score: number): string =>
  score >= 90 ? "优秀" : score >= 70 ? "良好" : score >= 50 ? "一般" : "差";
</script>

<template>
  <ReDialog
    v-model="visible"
    title="任务质量报告"
    width="760px"
    top="6vh"
    footer-hidden
    :loading="loading"
  >
    <div v-if="quality" class="quality-wrap">
      <div class="quality-head">
        <div class="quality-score" :class="scoreColor(quality.qualityScore)">
          <div class="score-num">{{ quality.qualityScore }}</div>
          <div class="score-label">{{ scoreText(quality.qualityScore) }}</div>
        </div>
        <div class="quality-meta">
          <div class="meta-row">
            <span class="meta-label">任务</span>
            <span class="meta-value">{{ quality.taskNo }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">总耗时</span>
            <span class="meta-value">{{ quality.totalCostMs ?? 0 }} ms</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">最慢节点</span>
            <span class="meta-value">{{ quality.slowestNode || "—" }}（{{ quality.slowestNodeCostMs ?? 0 }} ms）</span>
          </div>
          <div v-if="quality.errorSummary" class="meta-row error-row">
            <span class="meta-label">错误摘要</span>
            <span class="meta-value">{{ quality.errorSummary }}</span>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">产出记录</div>
          <div class="kpi-num">{{ quality.recordCount }}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">节点</div>
          <div class="kpi-num">
            {{ quality.successNodes }}<span class="kpi-unit">成功</span>
          </div>
          <div class="kpi-sub">{{ quality.failedNodes }} 失败 / {{ quality.skippedNodes }} 跳过</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">请求</div>
          <div class="kpi-num">
            {{ quality.requestSuccess }}<span class="kpi-unit">成功</span>
          </div>
          <div class="kpi-sub">{{ quality.requestFailed }} 失败</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">节点成功率</div>
          <div class="kpi-num">{{ quality.nodeSuccessRate ?? 0 }}<span class="kpi-unit">%</span></div>
        </div>
      </div>

      <div class="section-title">节点明细</div>
      <div class="node-list">
        <div v-for="node in quality.nodes" :key="node.nodeId" class="node-row">
          <div class="node-main">
            <div class="node-name">{{ node.nodeName || node.nodeId }}</div>
            <div class="node-id">{{ node.nodeId }}</div>
          </div>
          <ReTag :type="node.failedCount > 0 ? 'danger' : node.successCount > 0 ? 'success' : 'info'" effect="plain">
            {{ node.failedCount > 0 ? `${node.failedCount} 失败` : `${node.successCount}/${node.execCount} 成功` }}
          </ReTag>
          <div class="node-cost">{{ node.totalCostMs ?? 0 }} ms</div>
          <div class="node-rate">{{ node.successRate ?? 0 }}%</div>
        </div>
      </div>
    </div>
  </ReDialog>
</template>

<style scoped>
.quality-wrap {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.quality-head {
  display: flex;
  gap: 20px;
  align-items: center;
  background: color-mix(in srgb, var(--el-color-primary-light-9) 45%, transparent);
  border-radius: 8px;
  padding: 14px 16px;
}
.quality-score {
  min-width: 84px;
  min-height: 84px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.quality-score.success { background: var(--el-color-success); }
.quality-score.warning { background: var(--el-color-warning); }
.quality-score.danger { background: var(--el-color-danger); }
.score-num {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
.score-label { margin-top: 4px; font-size: 12px; opacity: 0.92; }
.quality-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.meta-row { display: flex; gap: 10px; font-size: 13px; }
.meta-label { width: 72px; color: var(--el-text-color-secondary); flex-shrink: 0; }
.meta-value { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.error-row .meta-value { color: var(--el-color-danger); }
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}
.kpi {
  background: color-mix(in srgb, var(--el-fill-color) 40%, transparent);
  border-radius: 8px;
  padding: 12px;
}
.kpi-label { font-size: 12px; color: var(--el-text-color-secondary); }
.kpi-num { font-size: 22px; font-weight: 700; margin-top: 4px; }
.kpi-unit { font-size: 12px; font-weight: 400; color: var(--el-text-color-secondary); margin-left: 2px; }
.kpi-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  padding: 8px 0 4px;
}
.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 280px;
  overflow-y: auto;
}
.node-row {
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 8px 4px;
}
.node-main { flex: 1; min-width: 0; }
.node-name { font-size: 13px; font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node-id { font-size: 11px; color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.node-cost { width: 88px; text-align: right; font-family: var(--el-font-family-mono); font-size: 12px; }
.node-rate { width: 64px; text-align: right; font-family: var(--el-font-family-mono); font-size: 12px; }
@media (max-width: 640px) {
  .quality-head { flex-direction: column; align-items: flex-start; }
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
