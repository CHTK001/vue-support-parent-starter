<template>
  <div class="mc-body">
    <!-- 加载中：首次取数才显示，轮询刷新不闪（reload(silent) 不改 state） -->
    <div v-if="state === 'loading'" class="mc-state">
      <el-icon class="mc-state__spin" :size="18"><Loading /></el-icon>
      <span>加载中…</span>
    </div>

    <!--
      未接入：端点没暴露 / 没配数据源。
      这是**正常部署形态**（很多环境只放 health,info），重试永远不会成功，
      所以给的是「怎么开启」的指引，而不是一个骗人的「重试」按钮。
    -->
    <div v-else-if="state === 'unavailable'" class="mc-state mc-state--hint">
      <div class="mc-hint__head">
        <el-icon :size="15"><WarningFilled /></el-icon>
        <b>未接入</b>
      </div>
      <p class="mc-hint__text">{{ error || defaultHint }}</p>
      <div v-if="snippet" class="mc-hint__code"><code>{{ snippet }}</code></div>
      <button class="mc-mini-btn" @click="emit('retry')">重新检测</button>
    </div>

    <!-- 真故障：网络 / 500 / 解析失败，重试有意义 -->
    <div v-else-if="state === 'error'" class="mc-state mc-state--error">
      <div class="mc-hint__head">
        <el-icon :size="15"><CircleCloseFilled /></el-icon>
        <b>加载失败</b>
      </div>
      <p class="mc-hint__text">{{ error || "未知错误" }}</p>
      <button class="mc-mini-btn" @click="emit('retry')">重试</button>
    </div>

    <slot v-else />
  </div>
</template>

<script setup lang="ts" name="CardBody">
/**
 * 卡片正文状态壳
 *
 * <p>把「加载中 / 未接入 / 加载失败 / 正常」四种状态收在一处，各卡片组件只需要
 * 关心「有数据时怎么画」—— 否则每张卡片都要抄一遍同样的空态与错误态，
 * 抄漏一张就变成白屏卡片。</p>
 *
 * <p>沿用首页 {@code useWidgetLoader} 的教训：{@code unregistered} 与 {@code error}
 * 必须区分，未接入不是故障。</p>
 */
import { computed } from "vue";
import { CircleCloseFilled, Loading, WarningFilled } from "@element-plus/icons-vue";
import type { ResourceState } from "./useCardResource";

const props = withDefaults(
  defineProps<{
    /** 数据状态 */
    state: ResourceState;
    /** 错误 / 指引文案 */
    error?: string;
    /** 未接入时的兜底文案 */
    defaultHint?: string;
    /** 展示成可复制的配置片段（接入指引） */
    snippet?: string;
  }>(),
  { error: "", defaultHint: "该数据源未接入，卡片暂无数据", snippet: "" },
);

const emit = defineEmits<{ (e: "retry"): void }>();

/** 兜底文案 */
const defaultHint = computed(() => props.defaultHint);
</script>

<style lang="scss" scoped>
.mc-body {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.mc-state {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  text-align: center;
  overflow: auto;
}

.mc-state__spin {
  color: var(--el-color-primary);
  animation: mc-spin 1.1s linear infinite;
}

/* 未接入：中性色（「暂缺」而非「故障」，不该染危险色） */
.mc-state--hint {
  align-items: flex-start;
  justify-content: flex-start;
  text-align: left;
  gap: 6px;
  color: var(--el-text-color-secondary);
}

.mc-state--error {
  color: var(--el-color-danger);
}

.mc-hint__head {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.mc-hint__text {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: var(--el-text-color-secondary);
  word-break: break-word;
}

.mc-hint__code {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  overflow: auto;

  code {
    font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
    font-size: 11px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
    white-space: pre-wrap;
    word-break: break-all;
  }
}

.mc-mini-btn {
  margin-top: 2px;
  height: 24px;
  padding: 0 10px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 12px;
  cursor: pointer;
}

.mc-mini-btn:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-7);
  background: var(--el-color-primary-light-9);
}

@keyframes mc-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
