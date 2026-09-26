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
 *
 * 视觉定位：本组件属 **Modern 族**（配 modern-vars 的 --rm-* 令牌：扁平、密集、
 * 12px 圆角系），服务于业务自建卡片；与统计卡族的统一表面基线
 * （shared/re-surface.css，16px + 柔光投影）是两套用途，**刻意不合并**。
 * 统计卡场景请用 ReStatCard / ReStatsCard，不要用本组件套 baseline。
 */
import { computed } from "vue";
import { ElCard } from "element-plus";
import "../../../shared/modern-vars.css";

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
    /** 圆角（px） */
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
    radius: 8,
    hoverable: false,
    bordered: true,
    padding: 16,
  },
);

/** simple 布局：自动关闭边框 + 加大圆角 + 强制 hover 浮起，shadow 不生效 */
const isSimple = computed<boolean>(() => props.layout === "simple");
const finalBordered = computed<boolean>(() => (isSimple.value ? false : props.bordered));
const finalRadius = computed<number>(() => (isSimple.value ? Math.max(props.radius, 16) : props.radius));
const finalHoverable = computed<boolean>(() => (isSimple.value ? true : props.hoverable));

const finalHeader = computed<string>(() => props.header || props.title);

const customStyle = computed<Record<string, string>>(() => ({
  "--re-card-radius": `${finalRadius.value}px`,
  "--re-card-padding": typeof props.padding === "number" ? `${props.padding}px` : props.padding,
}));

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
.re-card {
  --re-card-shadow-color: 15, 23, 42;
  border-radius: var(--re-card-radius, 12px);
  overflow: hidden;
  transition: border-color var(--rm-transition);
}
.re-card :deep(.el-card__body) {
  padding: var(--re-card-padding, 16px);
}
.re-card--hoverable:hover {
  border-color: var(--rm-border-hover);
}
.re-card--bordered {
  border: 1px solid var(--rm-border);
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