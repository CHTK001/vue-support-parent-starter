<template>
  <!-- 透传 el-badge 全部能力 -->
  <el-badge
    ref="root"
    v-bind="$attrs"
    :value="value"
    :max="max"
    :is-dot="isDot"
    :hidden="hidden"
    :type="type"
    :show-zero="showZero"
    :color="color"
    :offset="offset"
    :badge-style="badgeStyle"
    :badge-class="badgeClass"
    :class="['re-badge', breath && isDot ? 're-badge--breath-host' : null]"
  >
    <template v-if="$slots.default" #default>
      <slot />
    </template>
    <template v-if="$slots.content" #content>
      <slot name="content" />
    </template>
  </el-badge>
</template>

<script setup lang="ts">
/**
 * ReBadge —— 徽标组件
 *
 * 透传 el-badge 全部能力，封装统一前缀 re-badge：
 *   - value / max / isDot / hidden / type / showZero / color
 *   - offset / badgeStyle / badgeClass
 *   - 默认插槽与 content 插槽
 *   - breath：是否开启呼吸动画（仅对 is-dot 红点生效，添加脉冲光圈）
 *
 * 说明：原 `layout` 变体（"modern" / "pill" / "status"，对应 layouts/ 三个文件）
 * 经审计确认全仓无人使用，已随统一表面方案移除；需要时从
 * backups/ui-unused-layouts-retire-20260926/ 取回。
 */
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { CSSProperties, StyleValue } from "vue";

defineOptions({ name: "ReBadge", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 显示值 */
    value?: string | number;
    /** 最大值，超过显示 {max}+，仅当 value 为数字时生效 */
    max?: number;
    /** 是否显示为小圆点 */
    isDot?: boolean;
    /** 是否隐藏徽标 */
    hidden?: boolean;
    /** 徽标类型 */
    type?: "primary" | "success" | "warning" | "info" | "danger";
    /** 值为 0 时是否显示 */
    showZero?: boolean;
    /** 自定义背景色（覆盖 type 颜色） */
    color?: string;
    /** 徽标偏移量 [x, y] */
    offset?: [number, number];
    /** 徽标样式 */
    badgeStyle?: string | false | CSSProperties | StyleValue[];
    /** 徽标自定义类名 */
    badgeClass?: string;
    /** 是否开启呼吸动画（脉冲光圈），常用于新功能提醒 */
    breath?: boolean;
  }>(),
  {
    value: "",
    max: 99,
    isDot: false,
    hidden: false,
    type: "danger",
    showZero: true,
    color: "",
    offset: () => [0, 0] as [number, number],
    badgeStyle: undefined,
    badgeClass: "",
    breath: false,
  },
);

/** 根节点引用 */
const root = ref<HTMLElement | null>(null);
/** 当前正在监听的目标 dot 元素（用于清除 MutationObserver） */
let observed: HTMLElement | null = null;
let observer: MutationObserver | null = null;

/**
 * 为当前根节点内的 .el-badge__dot 元素添加 re-badge--breath 类，
 * 使用 MutationObserver 监听 dot 元素的出现/消失（el-badge 会按需挂载）。
 */
function applyBreath() {
  if (!root.value) return;
  const dot = root.value.querySelector<HTMLElement>(".el-badge__dot");
  if (dot === observed) return;
  // 解除旧观察
  if (observer && observed) {
    observer.disconnect();
    observed.classList.remove("re-badge--breath");
  }
  observed = dot;
  if (!dot) {
    observer = null;
    return;
  }
  if (props.breath && props.isDot) {
    dot.classList.add("re-badge--breath");
  }
  observer = new MutationObserver(applyBreath);
  observer.observe(root.value, { childList: true, subtree: true });
}

/** 同步 breath 类到当前 dot 元素 */
function syncBreathClass() {
  if (!observed) return;
  observed.classList.toggle("re-badge--breath", !!props.breath && !!props.isDot);
}

watch(
  () => [props.breath, props.isDot] as const,
  () => {
    syncBreathClass();
    applyBreath();
  },
);

onMounted(() => {
  applyBreath();
});

onBeforeUnmount(() => {
  if (observer) observer.disconnect();
  if (observed) observed.classList.remove("re-badge--breath");
  observer = null;
  observed = null;
});
</script>

<style>
/**
 * ReBadge 呼吸动画
 *
 * 通过 CSS 变量 --re-badge-breath-color 控制脉冲颜色，
 * 未设置时回退为 el-badge 自带的危险色（var(--el-color-danger)）。
 *
 * 使用方式：
 *   <ReBadge :is-dot="true" breath />
 *   <ReBadge :is-dot="true" breath style="--re-badge-breath-color: #67c23a" />
 */
@keyframes re-badge-breath {
  0% {
    box-shadow: 0 0 0 0 var(--re-badge-breath-color, var(--el-color-danger));
    opacity: 0.9;
  }
  70% {
    box-shadow: 0 0 0 8px transparent;
    opacity: 0.4;
  }
  100% {
    box-shadow: 0 0 0 0 transparent;
    opacity: 0.9;
  }
}

.re-badge--breath.el-badge__dot {
  animation: re-badge-breath 1.8s ease-out infinite;
}
</style>
