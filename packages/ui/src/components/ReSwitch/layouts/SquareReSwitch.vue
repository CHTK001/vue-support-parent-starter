<template>
  <div class="re-switch-square-wrap" :class="{ 're-switch-square-wrap--with-label': hasLabel }">
    <!-- 用 disabled 控制 tooltip 而不是复制两份按钮：
         原来 v-if / v-else 各写一遍整块按钮，任何改动都要同步两处，
         而且根节点在不同分支下类型不同，$attrs 的落点也跟着变。 -->
    <ElTooltip :content="title" placement="top" :disabled="!title">
      <button
        v-bind="$attrs"
        :class="[
          're-switch-square',
          `re-switch-square--${size}`,
          { 're-switch-square--active': isActive, 're-switch-square--disabled': disabled },
        ]"
        :disabled="disabled"
        type="button"
        role="switch"
        :aria-checked="isActive"
        :aria-label="accessibleName"
        @click="toggle"
      >
        <span class="re-switch-square__label">
          <slot v-if="useNamedSlot" :name="isActive ? 'active' : 'inactive'" />
          <StateIcon
            v-else-if="hasIconConfig"
            :active="isActive"
            :icon="icon"
            :active-icon="activeIcon"
            :inactive-icon="inactiveIcon"
            :preset="preset"
            :size="iconSize"
          />
          <slot v-else-if="hasSlotContent" />
          <!-- 默认：内置两态图标（sunmoon，激活 Sunny / 非激活 Moon）。
               此前这里是一枚写死的静态 SVG，两态长得一模一样，
               用户看不出开关到底开没开；现在默认就有「两套图标」。 -->
          <StateIcon v-else :active="isActive" :size="iconSize" />
        </span>
        <span v-if="isActive" class="re-switch-square__check">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        </span>
      </button>
    </ElTooltip>

    <!-- 文案块：square 是纯图标按钮，标题/小标题/提示/副标题放在按钮右侧。
         没有文案时不渲染，保持「一颗方块」的原样。 -->
    <SwitchLabel
      v-if="hasLabel"
      :title="title"
      :sub="sub"
      :tip="tip"
      :description="description"
      inline
    />
  </div>
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
 *
 * <p>同一个 WCAG 条款还要「名称」。这个按钮常常只画一个图标
 * （{@code icon} 或内置图形），图标对读屏是空的，tooltip 又只在
 * {@code title} 非空时才出现 —— 于是 {@code title} 为空时按钮**一个名字都没有**，
 * 读屏只会念「开关」。实测演示站的参数面板就是这种状态：
 * 一颗 40×40 的纯图标开关，{@code aria-label} 与 {@code title} 全为 {@code null}。
 * 故 {@link accessibleName} 兜一层：{@code ariaLabel} → {@code title}。</p>
 */
import { computed, useSlots } from "vue";
import { ElTooltip } from "element-plus";
import StateIcon from "../../ReStateIcon/StateIcon.vue";
import SwitchLabel from "../shared/SwitchLabel.vue";

defineOptions({ name: "SquareReSwitch", inheritAttrs: false });

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
    /** 主标题：既当 tooltip 文案，也在按钮右侧作为标题显示 */
    title?: string;
    /** 灰色小标题（按钮右侧，圆角小标签） */
    sub?: string;
    /** 提示文案（按钮右侧标题旁的问号，hover 出浮层） */
    tip?: string;
    /** 副标题说明（按钮右侧次要文字） */
    description?: string;
    /**
     * 无障碍名称。
     *
     * <p>图标本身读不出来，`title` 又只喂给 tooltip，所以纯图标用法必须靠它
     * （或 `title`）给按钮一个名字，否则读屏只会报「开关」。</p>
     */
    ariaLabel?: string;
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
    /** 激活态图标名（缺省回退到 icon，再回退到内置 sunmoon） */
    activeIcon?: string;
    /** 非激活态图标名（缺省回退到 icon，再回退到内置 sunmoon） */
    inactiveIcon?: string;
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset?: string;
  }>(),
  {
    title: "",
    sub: "",
    tip: "",
    description: "",
    ariaLabel: "",
    disabled: false,
    size: "default",
    activeValue: true,
    inactiveValue: false,
    icon: "",
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
  },
);

/** 是否需要在按钮右侧渲染文案块 */
const hasLabel = computed(() => Boolean(props.sub || props.tip || props.description));

const modelValue = defineModel<boolean | string | number>({ default: false });

const isActive = computed(() => modelValue.value === props.activeValue);

/**
 * 无障碍名称：`ariaLabel` 优先，其次 `title`（tooltip 文案也能当名字用）。
 *
 * <p>两者都没有时返回 {@code undefined} 而不是空串 —— 空串会被当成"有个空名字"，
 * 读屏念出来是空白，比不设更糟。</p>
 */
const accessibleName = computed(() => props.ariaLabel || props.title || undefined);

/** 中心图标尺寸（随按钮尺寸） */
const iconSize = computed(() =>
  props.size === "small" ? 15 : props.size === "large" ? 22 : 18,
);

/** 是否配置了图标（配置后走 ReStateIcon 的两态动画切换；只传 preset 也算） */
const hasIconConfig = computed(() => Boolean(props.icon || props.activeIcon || props.inactiveIcon || props.preset));

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
/* 外壳：默认只包一颗方块（inline-flex 不影响既有布局）；
   带文案时变成「方块 + 文案块」的横向组合。 */
.re-switch-square-wrap {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  vertical-align: middle;
}

.re-switch-square-wrap--with-label {
  align-items: flex-start;
}

.re-switch-square-wrap--with-label .re-switch-square {
  flex-shrink: 0;
}

.re-switch-square {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid var(--el-border-color, #dcdfe6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  box-sizing: border-box;
  /* 只过渡绘制属性：原先 `transition: all` 会把 1.5px→2px 的边框宽度一起带进
     过渡，图标跟着轻微位移。尺寸用 border-box 固定，切换时外框不跳。 */
  transition:
    color 0.2s var(--el-transition-duration, 0.2s),
    border-color 0.2s var(--el-transition-duration, 0.2s),
    background-color 0.2s var(--el-transition-duration, 0.2s),
    box-shadow 0.2s var(--el-transition-duration, 0.2s),
    transform 0.12s cubic-bezier(0.22, 1, 0.36, 1);
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
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
  background: color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color, #fff));
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 14%, transparent);
}
/* 键盘焦点环只给焦点，鼠标点击不显示。用 outline（而非 box-shadow）：
   既让键盘用户看清焦点，又不增加组件库 surface 快照的 box-shadow 声明数。 */
.re-switch-square:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--el-color-primary) 30%, transparent);
  outline-offset: 2px;
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
  background: color-mix(in srgb, var(--el-color-primary, #409eff) 88%, var(--el-color-black, #000));
  border-radius: 50%;
  color: var(--el-color-white, #fff);
  box-shadow: 0 1px 4px color-mix(in srgb, var(--el-color-primary, #409eff) 45%, transparent);
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

@media (prefers-reduced-motion: reduce) {
  .re-switch-square {
    transition: none;
  }
  .re-switch-square:active:not(.re-switch-square--disabled) {
    transform: none;
  }
}
</style>