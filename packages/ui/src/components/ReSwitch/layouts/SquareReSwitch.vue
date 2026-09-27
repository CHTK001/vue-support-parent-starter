<template>
  <ElTooltip v-if="title" :content="title" placement="top">
    <button
      :class="[
        're-switch-square',
        `re-switch-square--${size}`,
        { 're-switch-square--active': isActive, 're-switch-square--disabled': disabled },
      ]"
      :disabled="disabled"
      type="button"
      role="switch"
      :aria-checked="isActive"
      @click="toggle"
    >
      <span class="re-switch-square__label">
        <slot v-if="useNamedSlot" :name="isActive ? 'active' : 'inactive'" />
        <ReIcon v-else-if="centerIcon" :name="centerIcon" :size="iconSize" />
        <slot v-else-if="hasSlotContent" />
        <svg
          v-else
          class="re-switch-square__default-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="7" width="18" height="10" rx="5"/>
          <circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>
        </svg>
      </span>
      <span v-if="isActive" class="re-switch-square__check">
        <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="2 6 5 9 10 3" />
        </svg>
      </span>
    </button>
  </ElTooltip>
  <button
    v-else
    :class="[
      're-switch-square',
      `re-switch-square--${size}`,
      { 're-switch-square--active': isActive, 're-switch-square--disabled': disabled },
    ]"
    :disabled="disabled"
    type="button"
    role="switch"
    :aria-checked="isActive"
    @click="toggle"
  >
    <span class="re-switch-square__label">
      <slot v-if="useNamedSlot" :name="isActive ? 'active' : 'inactive'" />
      <ReIcon v-else-if="centerIcon" :name="centerIcon" :size="iconSize" />
      <slot v-else-if="hasSlotContent" />
      <svg
        v-else
        class="re-switch-square__default-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <rect x="3" y="7" width="18" height="10" rx="5"/>
        <circle cx="17" cy="12" r="2.5" fill="currentColor" stroke="none"/>
      </svg>
    </span>
    <span v-if="isActive" class="re-switch-square__check">
      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="2 6 5 9 10 3" />
      </svg>
    </span>
  </button>
</template>

<script setup lang="ts">
/**
 * SquareReSwitch —— 正方形纯图标开关
 *
 * 以正方形按钮形式展示，激活时右上角打勾 + 边框高亮。
 * 可通过默认插槽传入图标/文字。
 *
 * <p><b>无障碍</b>：激活态只有视觉信号（边框色 + 右上角打勾），颜色/图形本身
 * 对屏幕阅读器不可见。所以按钮必须带 {@code role="switch"} 与
 * {@code :aria-checked="isActive"}，否则读屏只会报「某按钮」，
 * 用户无从判断开关状态（WCAG 4.1.2 名称/角色/值）。两个分支
 * （有/无 tooltip）都要带，缺一个就有一半场景失效。</p>
 */
import { computed, useSlots } from "vue";
import { ElTooltip } from "element-plus";
import ReIcon from "../../ReIcon";

defineOptions({ name: "SquareReSwitch", inheritAttrs: true });

const slots = useSlots();

/** 默认插槽是否有实际内容（排除注释/空白节点） */
const hasSlotContent = computed(() => {
  const nodes = slots.default?.() ?? [];
  return nodes.some((n) => {
    if (typeof n.type === "symbol") return false;
    if (typeof n.children === "string") return n.children.trim().length > 0;
    return true;
  });
});

/** 命名插槽是否有实际内容 */
function hasNamedSlot(name: "active" | "inactive") {
  const nodes = slots[name]?.() ?? [];
  return nodes.some((n) => typeof n.type !== "symbol");
}
const hasActiveSlot = computed(() => hasNamedSlot("active"));
const hasInactiveSlot = computed(() => hasNamedSlot("inactive"));

const props = withDefaults(
  defineProps<{
    /** 主标题（tooltip） */
    title?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 尺寸 */
    size?: "small" | "default" | "large";
    /** 激活值 */
    activeValue?: boolean | string | number;
    /** 非激活值 */
    inactiveValue?: boolean | string | number;
    /** 通用图标名（激活/非激活都用它，如 ep:star）；配置后两态相同 */
    icon?: string;
    /** 激活态图标名（缺省回退到 icon） */
    activeIcon?: string;
    /** 非激活态图标名（缺省回退到 icon） */
    inactiveIcon?: string;
  }>(),
  {
    title: "",
    disabled: false,
    size: "default",
    activeValue: true,
    inactiveValue: false,
    icon: "",
    activeIcon: "",
    inactiveIcon: "",
  },
);

const modelValue = defineModel<boolean | string | number>({ default: false });

const isActive = computed(() => modelValue.value === props.activeValue);

/** 中心图标尺寸（随按钮尺寸） */
const iconSize = computed(() =>
  props.size === "small" ? 15 : props.size === "large" ? 22 : 18,
);

/** 当前态解析出的图标名（0 长度表示未配置，回退到默认插槽/内置图形） */
const centerIcon = computed(() => {
  const specific = isActive.value ? props.activeIcon : props.inactiveIcon;
  return specific || props.icon || "";
});

/** 当前态是否使用专属命名插槽 */
const useNamedSlot = computed(() =>
  isActive.value ? hasActiveSlot.value : hasInactiveSlot.value,
);

function toggle() {
  if (props.disabled) return;
  modelValue.value = isActive.value ? props.inactiveValue : props.activeValue;
}
</script>

<style scoped>
.re-switch-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  outline: none;
  padding: 0;
  position: relative;
  overflow: visible;
}

/* 尺寸 */
.re-switch-square--small {
  width: 32px;
  height: 32px;
}
.re-switch-square--default {
  width: 40px;
  height: 40px;
}
.re-switch-square--large {
  width: 48px;
  height: 48px;
}

/* 中心内容（图标/文字） */
.re-switch-square__label {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}
.re-switch-square__label :deep(.el-icon) {
  font-size: 18px;
}
.re-switch-square__default-icon {
  width: 18px;
  height: 18px;
}
.re-switch-square__fallback {
  font-size: 16px;
  font-weight: 700;
}

/* 交互 */
.re-switch-square:hover:not(.re-switch-square--disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.re-switch-square:active:not(.re-switch-square--disabled) {
  transform: scale(0.92);
}

/* 激活态：边框高亮 + 右上角打勾 */
.re-switch-square--active {
  border: 2px solid var(--el-color-primary, #409eff);
  background: #fff;
  color: var(--el-color-primary, #409eff);
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.12);
}
.re-switch-square--active:hover:not(.re-switch-square--disabled) {
  border-color: var(--el-color-primary-light-3, #79bbff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}

/* 右上角打勾 */
.re-switch-square__check {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: var(--el-color-primary, #409eff);
  border-radius: 50%;
  color: #fff;
  box-shadow: 0 1px 4px rgba(64, 158, 255, 0.4);
}
.re-switch-square__check svg {
  width: 10px;
  height: 10px;
}

/* 禁用态 */
.re-switch-square--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>