<template>
  <!--
    AI 状态条：回答「现在到底用哪个模型、能不能跑通」。
    配置页与会话页共用 —— 改完配置不必靠猜，测试连通能立刻给出结论。
  -->
  <div class="ai-status" :class="`ai-status--${tone}`">
    <span class="ai-status__dot" aria-hidden="true" />
    <div class="ai-status__body">
      <div class="ai-status__title">{{ title }}</div>
      <div class="ai-status__sub">{{ subtitle }}</div>
    </div>
    <div class="ai-status__actions">
      <el-button size="small" :loading="loading" @click="refresh">刷新</el-button>
      <el-button size="small" :loading="probing" @click="probe">测试连通</el-button>
      <el-button v-if="!available && showConfigLink" size="small" type="primary" @click="goConfig">去配置</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AI 状态条。
 *
 * <p><b>为什么需要。</b>后端 `/v2/edu/ai/capability` 一直返回生效的 provider / model，
 * 但页面只用 available 与 reason，用户改完 AI 配置后没有任何地方能确认「现在用的是哪个模型」。
 * 本组件把这事显式化，并提供一次真实调用的「测试连通」——
 * 能力探测无法发现密钥过期、网关不可达、模型名写错这三类问题。</p>
 *
 * <p>独立成组件是为了让配置页、组卷页、阅卷页共用同一份取值与文案，
 * 避免三处各写一遍后口径分叉。</p>
 */
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../../api/eduaiApi";
import type { EduAiCapability } from "../../api/types";

withDefaults(
  defineProps<{
    /** 是否展示「去配置」按钮（配置页自身不需要） */
    showConfigLink?: boolean;
  }>(),
  { showConfigLink: true }
);

const router = useRouter();
const loading = ref(false);
const probing = ref(false);
const capability = ref<EduAiCapability | null>(null);

/** 探测结论；未探测前按未知处理，不误报为可用 */
const available = computed(() => capability.value?.available === true);

const tone = computed<"ok" | "warn" | "unknown">(() => {
  if (!capability.value) return "unknown";
  return available.value ? "ok" : "warn";
});

const title = computed(() => {
  if (!capability.value) return "正在探测 AI 能力…";
  if (!available.value) return "AI 当前不可用";
  const provider = capability.value.provider?.trim();
  const model = capability.value.model?.trim();
  if (provider && model) return `当前模型：${provider} · ${model}`;
  if (model) return `当前模型：${model}`;
  return "AI 已就绪（未回显模型名）";
});

const subtitle = computed(() => {
  if (!capability.value) return "读取后端能力探测结果";
  return available.value
    ? "AI 组卷与 AI 阅卷都会使用这个模型；改动后无需重启后端"
    : capability.value.reason || "后端未给出具体原因";
});

/** 重新探测能力（无副作用） */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    capability.value = await eduaiApi.aiCapability();
  } catch (e) {
    capability.value = {
      available: false,
      reason: `能力探测失败：${e instanceof Error ? e.message : String(e)}`,
      provider: null,
      model: null,
    };
  } finally {
    loading.value = false;
  }
}

/**
 * 真实发一条最小请求验证连通性。
 *
 * <p>成功与失败都用 message 提示，失败时同时刷新能力条，避免状态条与真实情况不一致。</p>
 */
async function probe(): Promise<void> {
  probing.value = true;
  try {
    const result = await eduaiApi.aiProbe();
    if (result.ok) {
      const sample = result.sample ? `，返回「${result.sample}」` : "";
      ElMessage.success(`连通正常（${result.costMillis} ms${sample}）`);
    } else {
      ElMessage.error(result.message || "连通测试失败");
    }
    await refresh();
  } catch (e) {
    ElMessage.error(`连通测试失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    probing.value = false;
  }
}

/** 跳到 AI 配置页（路径与路由表保持一致） */
function goConfig(): void {
  void router.push("/edu/ai-provider");
}

onMounted(() => {
  void refresh();
});

defineExpose({ refresh });
</script>

<style scoped>
.ai-status {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: var(--el-border-radius-base);
  background: var(--el-fill-color-lighter);
  margin-bottom: 12px;
}

.ai-status__dot {
  flex: 0 0 auto;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-info);
}

.ai-status--ok .ai-status__dot {
  background: var(--el-color-success);
}

.ai-status--warn {
  background: var(--el-color-warning-light-9);
}

.ai-status--warn .ai-status__dot {
  background: var(--el-color-warning);
}

.ai-status__body {
  flex: 1 1 auto;
  min-width: 0;
}

.ai-status__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-status__sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.ai-status__actions {
  flex: 0 0 auto;
  display: flex;
  gap: 6px;
}
</style>
