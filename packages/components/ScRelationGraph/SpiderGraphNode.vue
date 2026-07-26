<template>
  <div class="rg-node__shell" :class="nodeShellClasses">
    <div class="rg-node__border" :style="borderStyle" />
    <div class="rg-node__body">
      <div v-if="nodeIcon" class="rg-node__icon-box" :style="iconBoxStyle">
        <span class="rg-node__icon" v-html="nodeIconSvg" />
        <span v-if="isRunning" class="rg-node__spinner" />
      </div>
      <div class="rg-node__info">
        <span class="rg-node__title">{{ nodeLabel }}</span>
        <span v-if="nodeKind" class="rg-node__type">{{ nodeKind }}</span>
      </div>
    </div>
    <span v-if="statusDotColor" class="rg-node__dot" :style="{ background: statusDotColor }" />
    <div class="rg-node__pulse" />
    <div class="rg-node__pulse rg-node__pulse--warning" />
    <button
      v-if="showDelete"
      type="button"
      class="rg-node__del"
      @click.stop="onDelete"
    >
      ×
    </button>
    <div v-if="tooltipText" class="rg-node__tooltip" :class="tooltipClass">
      {{ tooltipText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties, type PropType } from "vue";

const props = defineProps({
  node: { type: Object as PropType<any>, required: true },
  mode: { type: String as PropType<"edit" | "preview">, default: "edit" },
});

const emit = defineEmits<{
  (e: "delete", nodeId: string): void;
}>();

const p = computed(() => props.node?.data || props.node?.properties || {});
const nodeKind = computed(() => p.value.kind || "");
const nodeLabel = computed(() => props.node?.text || p.value.label || "");
const nodeIcon = computed(() => p.value.icon || "");
const runtimeStatus = computed(() => p.value.runtimeStatus || "");
const displayInfo = computed(() => p.value.displayInfo || "");
const errorMessage = computed(() => p.value.errorMessage || "");
const executionRound = computed(() => p.value.executionRound || 0);

const isRunning = computed(() => runtimeStatus.value === "RUNNING");
const isSuccess = computed(() => runtimeStatus.value === "SUCCESS");
const isFailed = computed(() => runtimeStatus.value === "FAILED");
const isWaitManual = computed(() => runtimeStatus.value === "WAIT_MANUAL");
const hasStatus = computed(
  () => !!runtimeStatus.value && !["PENDING", "WAITING"].includes(runtimeStatus.value)
);

const showDelete = computed(() => props.mode === "edit");

const typeColor = computed(() => {
  const map: Record<string, string> = {
    START: "#10b981",
    END: "#ef4444",
    PAGE_ACCESS: "#3b82f6",
    AI_PAGE_ACCESS: "#7c3aed",
    URL_PARSE: "#6366f1",
    DATA_PARSE: "#8b5cf6",
    SAVE_RESULT: "#14b8a6",
    ASYNC_SAVE: "#0891b2",
    CONDITION: "#f59e0b",
    DOWNLOADER: "#64748b",
    SUB_FLOW: "#06b6d4",
    HUMAN_INTERVENE: "#f97316",
    STRUCTURE: "#0f766e",
  };
  return map[nodeKind.value] || "#6b7280";
});

function getStatusColor(status?: string) {
  switch (status) {
    case "RUNNING":
      return "#3b82f6";
    case "SUCCESS":
      return "#22c55e";
    case "FAILED":
      return "#ef4444";
    case "WAIT_MANUAL":
      return "#eab308";
    default:
      return "#d1d5db";
  }
}

const borderColor = computed(() => getStatusColor(runtimeStatus.value) || typeColor.value);
const statusDotColor = computed(() => (hasStatus.value ? getStatusColor(runtimeStatus.value) : ""));
const tooltipText = computed(() => {
  const rs = runtimeStatus.value;
  let text = "";
  if (rs === "RUNNING" && displayInfo.value) {
    text = displayInfo.value;
    if (executionRound.value > 0) text += ` — 第 ${executionRound.value} 轮`;
  } else if (rs === "FAILED" && errorMessage.value) {
    text =
      errorMessage.value.length > 25
        ? errorMessage.value.substring(0, 25) + "..."
        : errorMessage.value;
  } else if (rs === "SUCCESS") {
    text = displayInfo.value || "执行成功";
    if (executionRound.value > 0) text += ` — 第 ${executionRound.value} 轮`;
  } else if (rs === "WAIT_MANUAL") {
    text = "等待人工处理";
  }
  return text;
});
const tooltipClass = computed(() => (isFailed.value ? "rg-node__tooltip--error" : ""));

const nodeIconSvg = computed(() => {
  const iconName = nodeIcon.value;
  const body =
    ICON_SVGS[iconName as keyof typeof ICON_SVGS] || ICON_SVGS.FALLBACK;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">${body}</svg>`;
});

const nodeShellClasses = computed(() => {
  const classes: string[] = [
    "rg-node",
    `rg-node--${nodeKind.value.toLowerCase()}`,
    `rg-node--${props.mode}`,
  ];
  if (isRunning.value) classes.push("rg-node--running");
  if (isSuccess.value) classes.push("rg-node--success");
  if (isFailed.value) classes.push("rg-node--failed");
  if (isWaitManual.value) classes.push("rg-node--wait-manual");
  return classes.join(" ");
});

const borderStyle = computed<CSSProperties>(() => ({
  "--clr": typeColor.value,
  "--bdr": borderColor.value,
}));

const iconBoxStyle = computed<CSSProperties>(() => ({
  background: `${typeColor.value}18`,
}));

function onDelete() {
  emit("delete", props.node.id);
}

const ICON_SVGS: Record<string, string> = {
  START:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm0-2a8 8 0 1 0 0-16a8 8 0 0 0 0 16ZM10.622 8.415l4.879 3.252a.4.4 0 0 1 0 .666l-4.88 3.252a.4.4 0 0 1-.621-.332V8.747a.4.4 0 0 1 .622-.332Z"/>',
  PAGE_ACCESS:
    '<path fill="currentColor" d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10s-4.477 10-10 10Zm-2.29-2.333A17.9 17.9 0 0 1 8.027 13H4.062a8.008 8.008 0 0 0 5.648 6.667ZM10.03 13c.151 2.439.848 4.73 1.97 6.752A15.905 15.905 0 0 0 13.97 13h-3.94Zm9.908 0h-3.965a17.9 17.9 0 0 1-1.683 6.667A8.008 8.008 0 0 0 19.938 13ZM4.062 11h3.965A17.9 17.9 0 0 1 9.71 4.333A8.008 8.008 0 0 0 4.062 11Zm5.969 0h3.938A15.905 15.905 0 0 0 12 4.248A15.905 15.905 0 0 0 10.03 11Zm4.259-6.667A17.9 17.9 0 0 1 15.973 11h3.965a8.008 8.008 0 0 0-5.648-6.667Z"/>',
  AI_PAGE_ACCESS:
    '<path fill="currentColor" d="M13.5 2c0 .444-.193.843-.5 1.118V5h5a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h5V3.118A1.5 1.5 0 1 1 13.5 2ZM6 7a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1H6Zm-4 3H0v6h2v-6Zm20 0h2v6h-2v-6ZM9 14.5a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Zm6 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z"/>',
  URL_PARSE:
    '<path fill="currentColor" d="m18.364 15.535l-1.414-1.414l1.414-1.414a5 5 0 0 0-7.07-7.071L9.878 7.05L8.465 5.636l1.414-1.414a7 7 0 0 1 9.9 9.9l-1.415 1.413Zm-2.828 2.829l-1.414 1.414a7 7 0 1 1-9.9-9.9l1.414-1.414l1.415 1.414l-1.415 1.415a5 5 0 0 0 7.071 7.07l1.415-1.413l1.414 1.414Zm-.707-10.607l1.414 1.414l-7.071 7.072l-1.414-1.415l7.07-7.07Z"/>',
  DATA_PARSE:
    '<path fill="currentColor" d="m18.031 16.617l4.283 4.282l-1.415 1.415l-4.282-4.283A8.96 8.96 0 0 1 11 20c-4.968 0-9-4.032-9-9s4.032-9 9-9s9 4.032 9 9a8.96 8.96 0 0 1-1.969 5.617Zm-2.006-.742A6.977 6.977 0 0 0 18 11c0-3.867-3.133-7-7-7s-7 3.133-7 7s3.133 7 7 7a6.977 6.977 0 0 0 4.875-1.975l.15-.15Zm-3.847-8.699a2 2 0 1 0 2.646 2.646a4 4 0 1 1-2.646-2.646Z"/>',
  SAVE_RESULT:
    '<path fill="currentColor" d="M5 12.5c0 .313.461.858 1.53 1.393C7.914 14.585 9.877 15 12 15c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171C17.35 11.349 14.827 12 12 12s-5.35-.652-7-1.671V12.5Zm14 2.829C17.35 16.349 14.827 17 12 17s-5.35-.652-7-1.671V17.5c0 .313.461.858 1.53 1.393C7.914 19.585 9.877 20 12 20c2.123 0 4.086-.415 5.47-1.107c1.069-.535 1.53-1.08 1.53-1.393v-2.171ZM3 17.5v-10C3 5.015 7.03 3 12 3s9 2.015 9 4.5v10c0 2.485-4.03 4.5-9 4.5s-9-2.015-9-4.5Zm9-7.5c2.123 0 4.086-.415 5.47-1.107C18.538 8.358 19 7.813 19 7.5c0-.313-.461-.858-1.53-1.393C16.085 5.415 14.123 5 12 5c-2.123 0-4.086.415-5.47 1.107C5.461 6.642 5 7.187 5 7.5c0 .313.461.858 1.53 1.393C7.914 9.585 9.877 10 12 10Z"/>',
  ASYNC_SAVE:
    '<path fill="currentColor" d="M7 19v-6h10v6h2V7.828L16.172 5H5v14h2ZM4 3h13l4 4v13a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm5 12v4h6v-4H9Z"/>',
  CONDITION:
    '<path fill="currentColor" d="M7.105 15.21A3.001 3.001 0 1 1 5 15.17V8.83a3.001 3.001 0 1 1 2 0V12c.836-.628 1.874-1 3-1h4a3.001 3.001 0 0 0 2.895-2.21a3.001 3.001 0 1 1 2.032.064A5.002 5.002 0 0 1 14 13h-4a3.001 3.001 0 0 0-2.895 2.21ZM6 17a1 1 0 1 0 0 2a1 1 0 0 0 0-2ZM6 5a1 1 0 1 0 0 2a1 1 0 0 0 0-2Zm12 0a1 1 0 1 0 0 2a1 1 0 0 0 0-2Z"/>',
  DOWNLOADER:
    '<path fill="currentColor" d="M13 10h5l-6 6l-6-6h5V3h2v7Zm-9 9h16v-7h2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-8h2v7Z"/>',
  HUMAN_INTERVENE:
    '<path fill="currentColor" d="m17.841 15.659l.176.177l.178-.177a2.25 2.25 0 1 1 3.181 3.182L18.018 22.2l-3.359-3.359a2.25 2.25 0 1 1 3.182-3.182ZM12 14v2a6 6 0 0 0-6 6H4a8 8 0 0 1 7.75-7.996L12 14Zm0-13c3.315 0 6 2.685 6 6a5.998 5.998 0 0 1-5.775 5.996L12 13c-3.315 0-6-2.685-6-6a5.998 5.998 0 0 1 5.775-5.996L12 1Zm0 2C9.79 3 8 4.79 8 7s1.79 4 4 4s4-1.79 4-4s-1.79-4-4-4Z"/>',
  SUB_FLOW:
    '<path fill="currentColor" d="M6 21.5A3.5 3.5 0 1 1 9.355 17H15v-2h2V9.242L14.757 7H9v2H3V3h6v2h5.757L18 1.756L22.243 6L19 9.241V15h2v6h-6v-2H9.355A3.502 3.502 0 0 1 6 21.5Zm0-5a1.5 1.5 0 1 0 0 3a1.5 1.5 0 0 0 0-5Zm13 .5h-2v2h2v-2ZM18 4.586L16.586 6L18 7.414L19.414 6L18 4.586ZM7 5H5v2h2V5Z"/>',
  STRUCTURE:
    '<path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2ZM0 12C0 5.37 5.37 0 12 0S24 5.37 24 12 18.63 24 12 24 0 18.63 0 12Zm4.24 2.14A8.1 8.1 0 0 1 12 4a8.1 8.1 0 0 1 7.76 6.14A10 10 0 0 0 12 2a10 10 0 0 0-7.76 12.14ZM12 22a10 10 0 0 0 7.76-12.14A8.1 8.1 0 0 1 12 20a8.1 8.1 0 0 1-7.76-6.14A10 10 0 0 0 12 22Z"/>',
  FALLBACK:
    '<path fill="currentColor" d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"/>',
};
</script>

<style scoped>
.rg-node {
  position: absolute;
  cursor: pointer;
  box-sizing: border-box;
}
.rg-node__border {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  border: 2px solid var(--bdr, var(--clr, #6b7280));
  background: color-mix(in srgb, var(--clr, #6b7280) 12%, transparent);
  backdrop-filter: blur(6px);
  transition: border-color 0.3s, box-shadow 0.3s;
}
.rg-node:hover .rg-node__border {
  box-shadow: 0 4px 20px color-mix(in srgb, var(--clr, #6b7280) 25%, transparent);
}
.rg-node--running .rg-node__border {
  border-color: #3b82f6;
  border-width: 2.5px;
  box-shadow: 0 0 0 3px color-mix(in srgb, #3b82f6 15%, transparent);
  animation: node-breath 1.2s ease-in-out infinite;
}
.rg-node--success .rg-node__border {
  border-color: #22c55e;
  border-width: 2.5px;
}
.rg-node--failed .rg-node__border {
  border-color: #ef4444;
  border-width: 2.5px;
}
.rg-node--wait-manual .rg-node__border {
  border-color: #eab308;
  border-width: 2.5px;
  animation: node-wait-manual 1.6s ease-in-out infinite;
}

.rg-node__body {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px 10px 10px;
  min-width: 0;
}
.rg-node__icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rg-node__icon {
  font-size: 16px;
  line-height: 1;
  color: var(--clr, #3b82f6);
  display: flex;
}
.rg-node--running .rg-node__icon {
  display: none;
}
.rg-node--wait-manual .rg-node__icon {
  display: none;
}
.rg-node__spinner {
  display: none;
  width: 16px;
  height: 16px;
  border: 2px solid color-mix(in srgb, #3b82f6 30%, transparent);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
.rg-node--running .rg-node__spinner {
  display: inline-block;
}
.rg-node--wait-manual .rg-node__spinner {
  display: inline-block;
  border-top-color: #eab308;
  border-color: color-mix(in srgb, #eab308 30%, transparent);
  animation-duration: 0.9s;
}
.rg-node__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.rg-node__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary, #e8edf5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}
.rg-node__type {
  font-size: 10px;
  font-weight: 600;
  color: var(--el-text-color-placeholder, #5a6478);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1;
}
.rg-node__dot {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--el-bg-color, #070b14);
  z-index: 2;
  transition: background 0.3s;
}
.rg-node__tooltip {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  pointer-events: none;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 100;
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}
.rg-node__tooltip--error {
  background: #7f1d1d;
  border-color: #991b1b;
  color: #fecaca;
}
.rg-node:hover .rg-node__tooltip {
  display: block;
}
.rg-node--running .rg-node__tooltip,
.rg-node--success .rg-node__tooltip,
.rg-node--failed .rg-node__tooltip,
.rg-node--wait-manual .rg-node__tooltip {
  display: block;
}
.rg-node__pulse {
  display: none;
  position: absolute;
  inset: -3px;
  border-radius: 14px;
  pointer-events: none;
  animation: node-pulse 1.5s ease-in-out infinite;
  border: 2px solid #3b82f6;
}
.rg-node__pulse--warning {
  border-color: #eab308;
  animation-name: node-pulse-warning;
}
.rg-node--running .rg-node__pulse {
  display: block;
}
.rg-node--wait-manual .rg-node__pulse--warning {
  display: block;
}
.rg-node__del {
  display: none;
  position: absolute;
  top: -10px;
  right: -10px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #ef4444;
  color: #fff;
  border: 2px solid var(--el-bg-color, #070b14);
  cursor: pointer;
  z-index: 20;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  align-items: center;
  justify-content: center;
  padding: 0;
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
  transition: transform 0.15s;
}
.rg-node:hover .rg-node__del {
  display: flex;
}
.rg-node__del:hover {
  transform: scale(1.2);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes node-breath {
  0%,
  100% {
    box-shadow: 0 0 0 2px color-mix(in srgb, #3b82f6 20%, transparent),
      0 0 12px color-mix(in srgb, #3b82f6 15%, transparent);
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, #3b82f6 35%, transparent),
      0 0 20px color-mix(in srgb, #3b82f6 25%, transparent);
  }
}
@keyframes node-pulse {
  0%,
  100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0;
  }
}
@keyframes node-wait-manual {
  0%,
  100% {
    box-shadow: 0 0 0 2px color-mix(in srgb, #eab308 15%, transparent);
  }
  50% {
    box-shadow: 0 0 0 5px color-mix(in srgb, #eab308 30%, transparent);
  }
}
</style>
