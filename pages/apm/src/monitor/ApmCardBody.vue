<!--
  ApmCardBody —— APM 卡片的可用性外壳

  卡片正文只写「有数据时画什么」，引擎探测 / 未接入 / 能力缺失这些分支统一在这里收口，
  避免 5 张卡片各写一遍且文案互相打架。判定结果来自 useApmCardGate（与页面共用一份状态）。

  与 ApmGate.vue 的差异：ApmGate 是整页级门禁（带候选引擎表格），这里是卡片内的紧凑版，
  尺寸只有几行高，因此只保留「一句话原因 + 重试」。
-->
<template>
  <div v-if="verdict === 'ready'" class="apm-card-body">
    <slot />
  </div>

  <div v-else class="apm-card-fallback" :class="`is-${verdict}`">
    <span class="apm-card-fallback__title">{{ title }}</span>
    <p class="apm-card-fallback__msg">{{ detail }}</p>
    <button
      v-if="verdict === 'absent' || verdict === 'unreachable'"
      type="button"
      class="apm-card-fallback__btn"
      :disabled="retrying"
      @click="retry"
    >
      {{ retrying ? "探测中…" : "重新探测" }}
    </button>
  </div>
</template>

<script setup lang="ts" name="ApmCardBody">
import { computed, onMounted, ref } from "vue";
import { useApmCardGate } from "./useApmCardGate";

const props = defineProps<{
  /** 这张卡片需要引擎提供的能力（services / traces / metrics / alarms…），不传 = 不校验 */
  capability?: string;
}>();

const gate = useApmCardGate(() => props.capability);

/** 模板里自动解包 ComputedRef，先在顶层取出来 */
const verdict = gate.verdict;
const error = gate.error;
const engine = gate.engine;
const message = gate.message;
const capabilityLabel = gate.capabilityLabel;

const retrying = ref(false);

onMounted(() => {
  // 幂等：同屏多张卡片只会有一次 /status（见 useApmStatus）
  gate.ensure();
});

const title = computed(() => {
  switch (verdict.value) {
    case "module-off":
      return "APM 模块已关闭";
    case "probing":
      return "正在探测 APM 引擎…";
    case "unreachable":
      return "无法获取 APM 状态";
    case "absent":
      return "当前服务器未接入 APM";
    case "unsupported":
      return `引擎不支持${capabilityLabel.value}`;
    default:
      return "";
  }
});

const detail = computed(() => {
  switch (verdict.value) {
    case "module-off":
      return "app.yaml 的 apmConfig.enable 为 false。后端是否装了 APM 与此无关，改回 true 即可恢复。";
    case "probing":
      return "首次打开会先确认服务器注册的 APM，稍等一下。";
    case "unreachable":
      return error.value || "APM 状态接口没有返回数据。";
    case "absent":
      return message.value || "未探测到可用的 APM 引擎（SkyWalking / hotspot / OpenTelemetry）。";
    case "unsupported":
      return `当前引擎 ${engine.value || "—"} 的能力清单里没有 ${capabilityLabel.value}。`;
    default:
      return "";
  }
});

async function retry(): Promise<void> {
  if (retrying.value) return;
  retrying.value = true;
  try {
    await gate.refresh();
  } finally {
    retrying.value = false;
  }
}
</script>

<style scoped>
.apm-card-body {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
}

.apm-card-fallback {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  min-height: 0;
  padding: 12px;
  box-sizing: border-box;
  border: 1px dashed var(--border-subtle, var(--el-border-color));
  border-radius: 9px;
  text-align: center;
}

.apm-card-fallback__title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

.apm-card-fallback__msg {
  margin: 0;
  max-width: 520px;
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

.apm-card-fallback.is-unreachable .apm-card-fallback__title {
  color: var(--el-color-danger);
}

.apm-card-fallback.is-unsupported .apm-card-fallback__title {
  color: var(--el-color-warning);
}

.apm-card-fallback__btn {
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.apm-card-fallback__btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
}

.apm-card-fallback__btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
