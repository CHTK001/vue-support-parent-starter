<script setup lang="ts">
/**
 * 向导步骤条（导入 / 导出共用）。
 *
 * <p>两种方向、同一套数据和同一套视觉：弹窗态用横向，页面态用竖向。
 * 形态照 Element Plus 的 {@code el-steps} —— 22px 圆圈、2px 连接线、
 * {@code is-process} 主色描边、{@code is-success} 打勾，颜色全部取 koi 令牌，
 * 不另造一套皮肤。</p>
 */
import ReIcon from "@repo/ui/re-icon";

interface WizardStepItem {
  /** 步骤标题 */
  title: string;
  /** 已完成时显示在标题下的摘要 */
  summary?: string;
  /** 未完成时的说明 */
  desc?: string;
}

const props = withDefaults(
  defineProps<{
    /** 步骤清单 */
    steps: WizardStepItem[];
    /** 当前步骤下标（0 起） */
    current: number;
    /** 横排（弹窗）或竖排（页面） */
    direction?: "horizontal" | "vertical";
    /** 竖排时是否允许点回已完成的步骤 */
    clickable?: boolean;
  }>(),
  { direction: "horizontal", clickable: false },
);

const emit = defineEmits<{
  /** 点击某个已完成的步骤 */
  (e: "select", index: number): void;
}>();

/**
 * 步骤状态。
 *
 * @param index 下标
 * @returns 状态名
 */
function stateOf(index: number): "done" | "on" | "todo" {
  if (index < props.current) return "done";
  return index === props.current ? "on" : "todo";
}

/**
 * 点击某个步骤。
 *
 * @param index 下标
 */
function onSelect(index: number): void {
  if (!props.clickable || index >= props.current) return;
  emit("select", index);
}
</script>

<template>
  <ol v-if="direction === 'horizontal'" class="wz-steps" role="list">
    <li
      v-for="(item, index) in steps"
      :key="item.title"
      class="wz-step"
      :class="`is-${stateOf(index)}`"
    >
      <span class="wz-dot">
        <ReIcon v-if="stateOf(index) === 'done'" name="Select" :size="12" />
        <template v-else>{{ index + 1 }}</template>
      </span>
      <span class="wz-name">{{ item.title }}</span>
      <span v-if="index < steps.length - 1" class="wz-line" />
    </li>
  </ol>

  <ol v-else class="wz-vsteps" role="list">
    <li
      v-for="(item, index) in steps"
      :key="item.title"
      class="wz-vstep"
      :class="[`is-${stateOf(index)}`, { 'is-clickable': clickable && index < current }]"
      @click="onSelect(index)"
    >
      <span class="wz-rail">
        <span class="wz-dot">
          <ReIcon v-if="stateOf(index) === 'done'" name="Select" :size="12" />
          <template v-else>{{ index + 1 }}</template>
        </span>
        <span v-if="index < steps.length - 1" class="wz-line" />
      </span>
      <span class="wz-body">
        <span class="wz-name">{{ item.title }}</span>
        <span v-if="stateOf(index) === 'done' && item.summary" class="wz-sum">{{ item.summary }}</span>
        <span v-else-if="stateOf(index) === 'on' && item.desc" class="wz-sum">{{ item.desc }}</span>
      </span>
    </li>
  </ol>
</template>

<style scoped>
/* ---------- 横排 ---------- */
.wz-steps {
  display: flex;
  align-items: center;
  flex: none;
  margin: 0;
  padding: 12px 0 14px;
  list-style: none;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.wz-step {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: none;
  min-width: 0;
}
.wz-name {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}
.wz-line {
  flex: none;
  width: 24px;
  height: 2px;
  margin: 0 8px;
  border-radius: 1px;
  background: var(--el-border-color-lighter);
}
.wz-step.is-on .wz-line,
.wz-step.is-done .wz-line {
  background: var(--el-color-primary-light-5);
}

/* ---------- 竖排 ---------- */
.wz-vsteps {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.wz-vstep {
  display: flex;
  gap: 9px;
  padding-bottom: 14px;
  min-width: 0;
}
.wz-vstep:last-child {
  padding-bottom: 0;
}
.wz-vstep.is-clickable {
  cursor: pointer;
}
.wz-vstep.is-clickable:hover .wz-name {
  color: var(--el-color-primary);
}
.wz-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: none;
  width: 22px;
}
.wz-vstep .wz-line {
  flex: 1;
  width: 2px;
  min-height: 8px;
  height: auto;
  margin: 0;
}
.wz-vstep.is-done .wz-line {
  background: var(--el-color-primary-light-5);
}
.wz-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding-top: 2px;
}
.wz-sum {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.wz-vstep.is-on .wz-name {
  color: var(--el-color-primary);
  font-weight: 600;
}
.wz-vstep.is-on .wz-sum {
  color: var(--el-color-primary);
}
.wz-vstep.is-done .wz-name {
  color: var(--el-text-color-regular);
}

/* ---------- 圆圈：与 el-steps 同形 ---------- */
.wz-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 22px;
  height: 22px;
  border: 2px solid var(--el-border-color);
  border-radius: 50%;
  background: var(--el-bg-color);
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  line-height: 1;
}
.is-on .wz-dot {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
  font-weight: 600;
}
.is-done .wz-dot {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.is-on .wz-name {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

@media (max-width: 720px) {
  .wz-steps {
    padding: 10px 0 12px;
  }
  .wz-step .wz-name {
    display: none;
  }
  .wz-step.is-on .wz-name {
    display: inline;
  }
  .wz-line {
    width: 14px;
    margin: 0 5px;
  }
}
</style>
