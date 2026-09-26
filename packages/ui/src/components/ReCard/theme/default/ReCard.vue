<script setup lang="ts">
/**
 * ReCard default 主题 —— 卡片组件（el-card 封装）
 *
 * 透传 el-card 全部能力。
 * 增强：
 *   - layout：default（标准带框） / simple（无边框、hover 浮起，圆角更大，玻璃质感）
 *   - radius：自定义圆角（默认 8）
 *   - hoverable：hover 时浮起（box-shadow + translateY）
 *   - bordered：是否显示边框
 *   - header / footer 插槽
 *   - title / subtitle 便捷字段（适用于通用卡片头部）
 */
import { computed } from "vue";
import { ElCard } from "element-plus";
import "../../../shared/modern-vars.css";
// 卡片视觉基线（库级共享，ReStatCard 风格）：圆角 / 边框 / 投影
import "../../../shared/re-surface.css";

defineOptions({ name: "ReCard", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 布局：default（标准带框） / simple（无边框、hover 浮起） */
    layout?: "default" | "simple";
    header?: string;
    /** 卡片标题（与 header 二选一，更语义化） */
    title?: string;
    /** 卡片副标题 */
    subtitle?: string;
    shadow?: "always" | "hover" | "never";
    bodyStyle?: Record<string, string>;
    /** 圆角（px）；不传时用基线圆角 var(--re-surface-radius) */
    radius?: number;
    /** 是否可悬浮 */
    hoverable?: boolean;
    /** 是否显示边框 */
    bordered?: boolean;
    /** 内边距 */
    padding?: number | string;
  }>(),
  {
    layout: "default",
    header: "",
    title: "",
    subtitle: "",
    shadow: "never",
    bodyStyle: undefined,
    // 缺省交回基线（16px），不再由本组件硬编码 8px
    radius: undefined,
    hoverable: false,
    bordered: true,
    padding: 16,
  },
);

/** simple 布局：自动关闭边框 + 强制 hover 浮起，shadow 不生效 */
const isSimple = computed<boolean>(() => props.layout === "simple");
const finalBordered = computed<boolean>(() => (isSimple.value ? false : props.bordered));
/** 圆角：未显式指定时用基线圆角（simple 下不小于基线圆角） */
const finalRadius = computed<number | undefined>(() => {
  if (props.radius != null) {
    return isSimple.value ? Math.max(props.radius, 16) : props.radius;
  }
  return undefined;
});
const finalHoverable = computed<boolean>(() => (isSimple.value ? true : props.hoverable));

const finalHeader = computed<string>(() => props.header || props.title);

/**
 * 圆角未显式指定时**不写** --re-card-radius，让 CSS 回落到基线
 * var(--re-surface-radius)；写 `undefinedpx` 会产生非法值。
 */
const customStyle = computed<Record<string, string>>(() => {
  const style: Record<string, string> = {
    "--re-card-padding": typeof props.padding === "number" ? `${props.padding}px` : props.padding,
  };
  if (finalRadius.value != null) {
    style["--re-card-radius"] = `${finalRadius.value}px`;
  }
  return style;
});

const mergedBodyStyle = computed<Record<string, string>>(() => ({
  ...(props.bodyStyle ?? {}),
}));
</script>

<template>
  <ElCard
    v-bind="$attrs"
    :header="finalHeader || undefined"
    :shadow="isSimple ? 'hover' : shadow"
    :body-style="mergedBodyStyle"
    :class="[
      're-card',
      `re-card--${layout}`,
      { 're-card--hoverable': finalHoverable, 're-card--bordered': finalBordered },
    ]"
    :style="customStyle"
  >
    <template v-if="finalHeader" #header>
      <slot name="header">
        <div class="re-card__header-inner">
          <div class="re-card__header-main">
            <span class="re-card__title">{{ finalHeader }}</span>
            <span v-if="subtitle" class="re-card__subtitle">{{ subtitle }}</span>
          </div>
          <div v-if="$slots.extra" class="re-card__extra">
            <slot name="extra" />
          </div>
        </div>
      </slot>
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </ElCard>
</template>

<style scoped>
/* 圆角缺省走基线（--re-surface-radius，16px），显式传 radius 时才用 --re-card-radius */
.re-card {
  --re-card-shadow-color: 15, 23, 42;
  border-radius: var(--re-card-radius, var(--re-surface-radius, 16px));
  overflow: hidden;
  transition: border-color var(--rm-transition);
}
.re-card :deep(.el-card__body) {
  padding: var(--re-card-padding, 16px);
}
/* bordered：基线语言是"透明边框 + 柔光投影"，实色边框仅作可选的强调形态 */
.re-card--hoverable:hover {
  border-color: var(--rm-border-hover);
}
.re-card--bordered {
  border: 1px solid var(--color-surface-border, var(--rm-border));
}
/* simple 布局：无边框 + 大圆角 */
.re-card--simple {
  background: var(--rm-bg);
}
.re-card--simple :deep(.el-card) {
  border: none !important;
  background: transparent !important;
}
.re-card--simple:hover {
  background: var(--rm-bg-hover);
}
.re-card__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.re-card__header-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.re-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--rm-text);
  line-height: 1.4;
  letter-spacing: 0.01em;
}
.re-card__subtitle {
  font-size: 12px;
  color: var(--rm-text-secondary);
  line-height: 1.3;
}
.re-card__extra {
  flex: 0 0 auto;
}

@media (prefers-reduced-motion: reduce) {
  .re-card,
  .re-card--hoverable:hover,
  .re-card--simple:hover {
    transition: none;
    transform: none;
  }
}
</style>