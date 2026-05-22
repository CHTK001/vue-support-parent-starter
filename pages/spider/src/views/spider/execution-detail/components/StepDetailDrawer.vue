<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible" class="step-drawer-overlay" @click.self="$emit('close')">
        <div class="step-drawer">
          <div class="step-drawer__head">
            <h2 class="step-drawer__title">{{ step?.spiderNodeName || "步骤详情" }}</h2>
            <button type="button" class="step-drawer__close" @click="$emit('close')">&times;</button>
          </div>

          <div class="step-drawer__body">
            <!-- 元数据 -->
            <div class="step-drawer__section">
              <span class="step-drawer__section-title">节点元数据</span>
              <div class="step-drawer__grid">
                <div class="step-drawer__field">
                  <span class="step-drawer__label">节点编码</span>
                  <span class="step-drawer__val">{{ step?.spiderNodeCode || "-" }}</span>
                </div>
                <div class="step-drawer__field">
                  <span class="step-drawer__label">节点类型</span>
                  <span class="step-drawer__val">{{ nodeTypeLabel }}</span>
                </div>
                <div class="step-drawer__field">
                  <span class="step-drawer__label">状态</span>
                  <span class="step-drawer__badge" :class="'is-' + statusClass">{{ statusLabel }}</span>
                </div>
                <div class="step-drawer__field">
                  <span class="step-drawer__label">开始时间</span>
                  <span class="step-drawer__val">{{ formatTime(step?.spiderStartedAt) }}</span>
                </div>
                <div class="step-drawer__field">
                  <span class="step-drawer__label">结束时间</span>
                  <span class="step-drawer__val">{{ formatTime(step?.spiderFinishedAt) }}</span>
                </div>
                <div class="step-drawer__field">
                  <span class="step-drawer__label">耗时</span>
                  <span class="step-drawer__val step-drawer__val--accent">{{ duration }}</span>
                </div>
              </div>
            </div>

            <!-- 显示信息 -->
            <div class="step-drawer__section" v-if="step?.spiderDisplayInfo">
              <span class="step-drawer__section-title">显示信息</span>
              <p class="step-drawer__text">{{ step.spiderDisplayInfo }}</p>
            </div>

            <!-- 错误信息 -->
            <div class="step-drawer__section" v-if="step?.spiderErrorMessage">
              <span class="step-drawer__section-title step-drawer__section-title--error">错误信息</span>
              <pre class="step-drawer__error">{{ step.spiderErrorMessage }}</pre>
            </div>

            <!-- BROWSER_AGENT 操作历史 -->
            <div class="step-drawer__section" v-if="isBrowserAgent && decisions.length > 0">
              <span class="step-drawer__section-title">AI 操作历史</span>
              <div class="step-drawer__decisions">
                <div v-for="(dec, idx) in decisions" :key="idx" class="step-drawer__decision">
                  <div class="step-drawer__decision-head">
                    <span class="step-drawer__decision-step">#{{ dec.step }}</span>
                    <span class="step-drawer__decision-action">{{ dec.action }}</span>
                    <span class="step-drawer__decision-desc">{{ dec.description }}</span>
                  </div>
                  <div class="step-drawer__decision-body" v-if="dec.result || dec.thought">
                    <p class="step-drawer__decision-thought" v-if="dec.thought">
                      <span class="step-drawer__decision-label">AI 思考:</span> {{ dec.thought }}
                    </p>
                    <p class="step-drawer__decision-result" v-if="dec.result">
                      <span class="step-drawer__decision-label">结果:</span> {{ dec.result }}
                    </p>
                  </div>
                  <img v-if="dec.screenshotUrl" :src="dec.screenshotUrl" class="step-drawer__decision-screenshot" alt="操作截图" @click="previewScreenshot = dec.screenshotUrl" />
                </div>
              </div>
            </div>

            <!-- 调试数据 -->
            <DebugDataViewer label="步骤完整数据" :data="step" />
          </div>
        </div>
      </div>
    </Transition>

    <!-- 截图预览 -->
    <div v-if="previewScreenshot" class="step-drawer-img-preview" @click.self="previewScreenshot = ''">
      <button class="step-drawer-img-preview__close" @click="previewScreenshot = ''">&times;</button>
      <img :src="previewScreenshot" class="step-drawer-img-preview__img" alt="截图预览" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { SpiderExecutionStepView, SpiderAgentDecisionView } from "../../../../types/orchestration";
import DebugDataViewer from "./DebugDataViewer.vue";

const props = defineProps<{
  visible: boolean;
  step: SpiderExecutionStepView | null;
  decisions?: SpiderAgentDecisionView[];
}>();

defineEmits<{
  (e: "close"): void;
}>();

const previewScreenshot = ref("");

const isBrowserAgent = computed(() => props.step?.spiderNodeType === "BROWSER_AGENT");

const nodeTypeLabel = computed(() => {
  const typeMap: Record<string, string> = {
    START: "开始节点",
    END: "结束节点",
    PAGE_ACCESS: "页面访问",
    AI_PAGE_ACCESS: "AI 页面访问",
    BROWSER_AGENT: "浏览器 Agent",
    URL_PARSE: "URL 解析",
    DATA_PARSE: "数据解析",
    DOWNLOADER: "下载器",
    SUB_FLOW: "子流程",
    HUMAN_INTERVENE: "人工介入",
    CONDITION: "条件节点",
    SAVE_RESULT: "保存结果",
    ASYNC_SAVE: "异步保存",
  };
  return typeMap[props.step?.spiderNodeType || ""] || props.step?.spiderNodeType || "-";
});

const statusClass = computed(() => {
  switch (props.step?.spiderStepStatus) {
    case "RUNNING": return "running";
    case "SUCCESS": return "success";
    case "FAILED": return "failed";
    case "WAIT_MANUAL": return "manual";
    default: return "unknown";
  }
});

const statusLabel = computed(() => {
  switch (props.step?.spiderStepStatus) {
    case "RUNNING": return "运行中";
    case "SUCCESS": return "已完成";
    case "FAILED": return "失败";
    case "WAIT_MANUAL": return "等待人工";
    default: return props.step?.spiderStepStatus || "未知";
  }
});

const duration = computed(() => {
  const start = props.step?.spiderStartedAt;
  const finish = props.step?.spiderFinishedAt;
  if (!start || !finish) return "-";
  try {
    const ms = new Date(finish).getTime() - new Date(start).getTime();
    if (ms < 1000) return ms + "ms";
    if (ms < 60000) return (ms / 1000).toFixed(1) + "s";
    return Math.floor(ms / 60000) + "m " + Math.floor((ms % 60000) / 1000) + "s";
  } catch {
    return "-";
  }
});

function formatTime(t?: string): string {
  if (!t) return "-";
  try {
    return new Date(t).toLocaleString();
  } catch {
    return t;
  }
}
</script>

<style scoped>
.step-drawer-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: flex-end;
}
.step-drawer {
  width: 480px;
  max-width: 90vw;
  height: 100%;
  background: var(--lay-bg, #0a0e1a);
  border-left: 1px solid rgba(255,255,255,0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.step-drawer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
  flex-shrink: 0;
}
.step-drawer__title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--lay-text-primary);
}
.step-drawer__close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.04);
  color: var(--lay-text-secondary);
  font-size: 20px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-drawer__close:hover {
  background: rgba(244,67,54,0.1);
  color: #f44336;
}
.step-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.step-drawer__section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step-drawer__section-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.step-drawer__section-title--error { color: #f44336; }
.step-drawer__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.step-drawer__field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.step-drawer__label {
  font-size: 9px;
  color: var(--lay-text-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.step-drawer__val {
  font-size: 12px;
  color: var(--lay-text-primary);
  font-weight: 500;
}
.step-drawer__val--accent {
  color: #22d3ee;
}
.step-drawer__badge {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  width: fit-content;
}
.step-drawer__badge.is-running { background: rgba(255,152,0,0.12); color: #ff9800; }
.step-drawer__badge.is-success { background: rgba(76,175,80,0.12); color: #4caf50; }
.step-drawer__badge.is-failed { background: rgba(244,67,54,0.12); color: #f44336; }
.step-drawer__badge.is-manual { background: rgba(234,179,8,0.12); color: #eab308; }
.step-drawer__text {
  margin: 0;
  font-size: 12px;
  color: var(--lay-text-secondary);
  line-height: 1.5;
}
.step-drawer__error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: rgba(244,67,54,0.06);
  border: 1px solid rgba(244,67,54,0.15);
  font-size: 11px;
  color: #f44336;
  line-height: 1.5;
  white-space: pre-wrap;
  font-family: "JetBrains Mono", "Fira Code", monospace;
}
.step-drawer__decisions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.step-drawer__decision {
  background: rgba(255,255,255,0.02);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 8px;
  padding: 10px 12px;
}
.step-drawer__decision-head {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.step-drawer__decision-step {
  font-size: 10px;
  font-weight: 700;
  color: #22d3ee;
  font-family: monospace;
}
.step-drawer__decision-action {
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(99,102,241,0.12);
  color: #818cf8;
  font-size: 9px;
  font-weight: 600;
  text-transform: uppercase;
}
.step-drawer__decision-desc {
  font-size: 11px;
  color: var(--lay-text-primary);
  flex: 1;
}
.step-drawer__decision-body {
  margin-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.step-drawer__decision-thought,
.step-drawer__decision-result {
  margin: 0;
  font-size: 10px;
  line-height: 1.4;
  color: var(--lay-text-secondary);
}
.step-drawer__decision-label {
  font-weight: 600;
  color: var(--lay-text-placeholder);
}
.step-drawer__decision-screenshot {
  width: 100%;
  margin-top: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
  max-height: 160px;
  object-fit: contain;
  background: #000;
}
.step-drawer__decision-screenshot:hover { opacity: 0.85; }

/* Transition */
.drawer-enter-active,
.drawer-leave-active {
  transition: opacity 0.25s ease;
}
.drawer-enter-active .step-drawer,
.drawer-leave-active .step-drawer {
  transition: transform 0.25s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .step-drawer,
.drawer-leave-to .step-drawer {
  transform: translateX(100%);
}

/* Image Preview */
.step-drawer-img-preview {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0,0,0,0.75);
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-drawer-img-preview__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
}
.step-drawer-img-preview__img {
  max-width: 90vw;
  max-height: 90vh;
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0,0,0,0.4);
}
</style>
