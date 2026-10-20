<template>
  <!--
    顶栏 AI 状态点：挂在布局的 #koi-header-extra 扩展槽里（见 koi ReToolbar.vue）。
    只回答两个问题：现在用哪个模型、AI 通不通。点击进入 AI 配置页。
  -->
  <button
    type="button"
    class="ai-badge"
    :class="`ai-badge--${tone}`"
    :title="tooltip"
    :aria-label="tooltip"
    @click="openConfig"
  >
    <span class="ai-badge__dot" aria-hidden="true" />
    <span class="ai-badge__text">{{ label }}</span>
  </button>
</template>

<script setup lang="ts">
/**
 * 顶栏 AI 状态徽标。
 *
 * <p><b>为什么放在顶栏。</b>AI 配置坏掉时，症状只会出现在组卷/阅卷等业务页；
 * 用户要等到用的时候才发现。顶栏常驻一个状态点，让「模型是什么、通不通」
 * 在任何页面都可见，并且一步跳到配置页。</p>
 *
 * <p>组件刻意不使用 Element Plus：它以独立小应用挂载（见
 * apps/vue-support-eduai-starter/src/ai-header-badge.ts），宿主布局的组件注册
 * 不会传进来。样式全部用主题 CSS 变量，明暗主题自动跟随。</p>
 */
import { computed, onMounted, onUnmounted, ref } from "vue";
import { getRouter } from "@repo/core";
import { getAccessToken } from "@repo/utils";
import { eduaiApi } from "../../api/eduaiApi";
import type { EduAiCapability } from "../../api/types";

/** 轮询间隔：能力探测无副作用、开销极小，一分钟一次足够 */
const POLL_INTERVAL_MS = 60_000;

const capability = ref<EduAiCapability | null>(null);
let timer: ReturnType<typeof setInterval> | null = null;

const available = computed(() => capability.value?.available === true);
const tone = computed<"ok" | "warn" | "unknown">(() => {
  if (!capability.value) return "unknown";
  return available.value ? "ok" : "warn";
});

/** 顶栏空间有限：优先显示模型名，过长截断 */
const label = computed(() => {
  if (!capability.value) return "AI";
  if (!available.value) return "AI 不可用";
  const model = capability.value.model?.trim();
  return model ? `AI · ${model}` : "AI 就绪";
});

const tooltip = computed(() => {
  if (!capability.value) return "正在探测 AI 能力…";
  if (!available.value) {
    return `${capability.value.reason || "AI 不可用"}（点击打开 AI 配置）`;
  }
  const provider = capability.value.provider?.trim();
  const model = capability.value.model?.trim();
  const name = [provider, model].filter(Boolean).join(" · ") || "未回显模型名";
  return `当前模型：${name}（点击打开 AI 配置）`;
});

async function refresh(): Promise<void> {
  try {
    capability.value = await eduaiApi.aiCapability();
  } catch {
    capability.value = { available: false, reason: "AI 能力探测失败", provider: null, model: null };
  }
}

function openConfig(): void {
  void getRouter().push("/edu/ai-provider");
}

onMounted(() => {
  // 登录页也会挂载本组件（布局尚未出现），此时没有令牌，探测必然 401 —
  // 不要用一个注定失败的请求给状态定调；进入后台布局时由宿主调用 refresh()。
  if (getAccessToken()) {
    void refresh();
  }
  timer = setInterval(() => {
    if (getAccessToken()) void refresh();
  }, POLL_INTERVAL_MS);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  timer = null;
});

/** 供宿主在徽标进入顶栏后立即刷新（登录完成时令牌才就绪） */
defineExpose({ refresh });
</script>

<style scoped>
.ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  max-width: 180px;
  padding: 0 10px;
  font-family: var(--el-font-family, inherit);
  font-size: 12px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  transition: background-color 0.2s ease, border-color 0.2s ease;
}

.ai-badge:hover {
  background: var(--el-fill-color);
  border-color: var(--el-color-primary-light-7);
}

.ai-badge__dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--el-color-info);
}

.ai-badge--ok .ai-badge__dot {
  background: var(--el-color-success);
  box-shadow: 0 0 0 2px var(--el-color-success-light-9);
}

.ai-badge--warn {
  color: var(--el-color-warning-dark-2);
  border-color: var(--el-color-warning-light-5);
  background: var(--el-color-warning-light-9);
}

.ai-badge--warn .ai-badge__dot {
  background: var(--el-color-warning);
}

.ai-badge__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
