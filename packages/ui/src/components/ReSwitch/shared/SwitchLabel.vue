<!--
  SwitchLabel —— 开关的文案块（标题 / 灰色小标题 / 问号提示 / 副标题）

  <p>抽成共享组件的原因：这四段文案原本只有 card 布局在渲染，default 与 square
  拿到 tip / sub / description 后既不显示、又因为 inheritAttrs 被铺成按钮上的
  无意义 DOM 属性（页面上看不见，但 DOM 里挂着一堆 sub="…"）。</p>

  <p>现在三个布局共用同一份排版语义：主标题加粗、sub 是灰色圆角小标签、
  tip 是标题旁的问号（hover 出浮层）、description 是下一行的次要说明。</p>
-->
<template>
  <div v-if="hasAny" class="re-switch-label" :class="{ 're-switch-label--inline': inline }">
    <div v-if="title || sub || tip" class="re-switch-label__head">
      <span v-if="title" class="re-switch-label__title">{{ title }}</span>
      <span v-if="sub" class="re-switch-label__sub">{{ sub }}</span>
      <el-tooltip v-if="tip" :content="tip" placement="top">
        <el-icon class="re-switch-label__tip"><QuestionFilled /></el-icon>
      </el-tooltip>
    </div>
    <p v-if="description" class="re-switch-label__desc">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ElIcon, ElTooltip } from "element-plus";
import { QuestionFilled } from "@element-plus/icons-vue";

defineOptions({ name: "SwitchLabel", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 主标题 */
    title?: string;
    /** 灰色小标题（圆角小标签） */
    sub?: string;
    /** 问号提示文案 */
    tip?: string;
    /** 副标题说明（次要灰色文字） */
    description?: string;
    /** 与开关同行时的紧凑排版（square 布局用） */
    inline?: boolean;
  }>(),
  { title: "", sub: "", tip: "", description: "", inline: false },
);

/** 四段文案全空时不渲染容器，避免在 DOM 里留一个空 div 占位 */
const hasAny = computed(() => Boolean(props.title || props.sub || props.tip || props.description));
</script>

<style scoped>
.re-switch-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.re-switch-label--inline {
  align-items: flex-start;
}

.re-switch-label__head {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.re-switch-label__title {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.re-switch-label__sub {
  flex-shrink: 0;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--el-fill-color-light);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.3px;
  color: var(--el-text-color-secondary);
}

.re-switch-label__tip {
  flex-shrink: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  cursor: help;
  transition: color 0.2s var(--el-transition-duration, 0.2s);
}

.re-switch-label__tip:hover {
  color: var(--el-color-primary);
}

.re-switch-label__desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}

@media (prefers-reduced-motion: reduce) {
  .re-switch-label__tip {
    transition: none;
  }
}
</style>