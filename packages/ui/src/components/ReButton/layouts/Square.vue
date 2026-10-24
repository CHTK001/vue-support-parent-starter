<script setup lang="ts">
/**
 * ReButton Square 布局 —— 正方形纯图标按钮
 *
 * <p><b>loading 与图标互斥</b>：spinner 出现时图标必须让位。此前两者是各自独立的
 * {@code v-if}，loading 态下会同时渲染 —— 按钮里并排两个 14px 图形，图标根本没被替换掉，
 * spinner 转圈时图标还杵在旁边（2026-09-28 在 ReTable 刷新按钮上实测：loading 态
 * {@code children.length === 2}、图标仍在）。现在 spinner 用 {@code v-if}、
 * 图标整块用 {@code v-else}，二者互斥，实测 loading 态 {@code children.length === 1}。</p>
 */
import "../../shared/modern-vars.css";
import ReIcon from "../../ReIcon/theme/default/ReIcon.vue";
import StateIcon from "../../ReStateIcon/StateIcon.vue";
import { ElIcon } from "element-plus";
import { computed, type Component } from "vue";

defineOptions({ name: "ReButtonSquare", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    type?: "primary" | "success" | "warning" | "info" | "danger" | "text" | "";
    size?: "large" | "default" | "small";
    plain?: boolean;
    loading?: boolean;
    disabled?: boolean;
    icon?: string | Component;
    /**
     * 动画图标（{@code anim:<lib>:<icon>}）的尺寸 px。
     *
     * <p>动画图标是内联 SVG，尺寸必须显式给（普通图标由字体决定，无需此值）。
     * 不给就用 ReIcon 的默认 18px。</p>
     */
    animIconSize?: number;
    nativeType?: "button" | "submit" | "reset";
    /**
     * 纯装饰：不渲染成可交互控件。
     *
     * 卡片标题旁的图标徽标常被顺手写成 `<ReButton icon="Warning" layout="square" />`，
     * 但它既没有 @click、也没有 auth/tip —— 组件却照样吐出一个真实的 <button>。
     * 后果有两个，都不是「看起来小问题」：
     *   1. 无障碍：按钮进了 Tab 序列、读屏会念出一个没有名字的「按钮」，用户聚焦后按回车毫无反应；
     *   2. 功能：它是货真价实的死控件，点下去什么都不发生。
     * 验收遍历正是靠这一点把它们抓出来的（/workbench 4 个 + /alarms 5 个 KPI 徽标）。
     *
     * 打开后改渲染 <span aria-hidden="true">，外观类名完全不变，但不再可聚焦、
     * 不再可点、也不再吃悬停/按压反馈 —— 该图标本来就只是视觉装饰。
     */
    decorative?: boolean;
    /** 两态图标：激活态图标名 */
    activeIcon?: string;
    /** 两态图标：非激活态图标名 */
    inactiveIcon?: string;
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset?: string;
    /** 当前是否激活（配合两态图标使用） */
    active?: boolean;
  }>(),
  {
    type: "",
    size: "default",
    plain: false,
    loading: false,
    disabled: false,
    icon: "",
    animIconSize: undefined,
    nativeType: "button",
    decorative: false,
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
    active: false,
  },
);

const emit = defineEmits<{
  (e: "click", evt: MouseEvent): void;
}>();

function onClick(e: MouseEvent): void {
  if (props.disabled || props.loading) return;
  emit("click", e);
}

const iconIsComponent = computed<boolean>(() => typeof props.icon !== "string" && props.icon != null);
const iconName = computed<string>(() => (typeof props.icon === "string" ? props.icon : ""));

/** 图标是不是动画图标（`anim:<lib>:<icon>`） */
const isAnimIcon = computed<boolean>(() => iconName.value.startsWith("anim:"));

/**
 * 是否启用两态图标动画。
 *
 * 需要「至少一个能区分两态的来源」：activeIcon / inactiveIcon / preset 任一非空即启用，
 * 通用 `icon` 作为两态的最终兜底；只传 `icon` 时两态相同，交给 ReIcon 即可（不动画）。
 * 组件对象形态的图标（{@code iconIsComponent}）不参与两态解析。
 */
const useStateIcon = computed<boolean>(
  () => !iconIsComponent.value && Boolean(props.activeIcon || props.inactiveIcon || props.preset),
);
</script>

<template>
  <!-- decorative 时降级成 <span>：不进入 Tab 序列、不响应点击、不吃悬停/按压反馈。
       用 v-on 对象而不是 @click="cond ? undefined : onClick"，是为了让装饰态根本不挂监听器，
       而不是在每次点击时求值出一个 undefined 再跳过。 -->
  <component
    :is="decorative ? 'span' : 'button'"
    :type="decorative ? undefined : (nativeType as any)"
    :disabled="decorative ? undefined : (disabled || loading)"
    :aria-hidden="decorative ? 'true' : undefined"
    :class="[
      'rs-btn',
      `rs-btn--${type || 'default'}`,
      `rs-btn--size-${size || 'default'}`,
      {
        'rs-btn--plain': plain,
        'is-loading': loading,
        'is-disabled': disabled,
        'rs-btn--decorative': decorative,
      },
    ]"
    v-bind="$attrs"
    v-on="decorative ? {} : { click: onClick }"
  >
    <!-- loading 态：
         · 普通图标 → 换成 spinner（图标让位，两者是互斥的 v-if/v-else）
         · 两态/动画图标 → **保留图标并让它转起来**：上游动画图标自带 hover 动效，
           加载中再叠一个持续旋转，比「图标消失、换成另一个圈」更连贯，
           也让用户一眼看出「还是这个按钮，正在转」。
         两者都保留 spinner 的语义（旋转 = 进行中），只是形态不同。 -->
    <span v-if="loading && (useStateIcon || isAnimIcon)" class="rs-btn__spinner rs-btn__spinner--icon">
      <StateIcon
        v-if="useStateIcon"
        :active="active"
        :icon="iconName"
        :active-icon="activeIcon"
        :inactive-icon="inactiveIcon"
        :preset="preset"
        :size="animIconSize"
        class="rs-btn__icon"
      />
      <ReIcon v-else :name="iconName" :size="animIconSize" class="rs-btn__icon" />
    </span>
    <span v-else-if="loading" class="rs-btn__spinner">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round" />
      </svg>
    </span>
    <template v-else>
      <StateIcon
        v-if="useStateIcon"
        :active="active"
        :icon="iconName"
        :active-icon="activeIcon"
        :inactive-icon="inactiveIcon"
        :preset="preset"
        :size="animIconSize"
        class="rs-btn__icon"
      />
      <ReIcon v-else-if="icon && !iconIsComponent" :name="iconName" :size="animIconSize" class="rs-btn__icon" />
      <ElIcon v-else-if="iconIsComponent" class="rs-btn__icon">
        <component :is="icon" />
      </ElIcon>
    </template>
  </component>
</template>

<style scoped>
.rs-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 4px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  /* 圆角统一用 Element 控件档（= 新增学生等 el-button 的 --el-border-radius-base，
     koi 里映射到 --el-radius-sm = 6px）。原先硬编码 10px，与 el-button 不一致。 */
  border-radius: var(--el-border-radius-base, 6px);
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-secondary, #909399);
  cursor: pointer;
  user-select: none;
  outline: none;
  /* 只过渡会变的视觉属性。原先是 `transition: all`，把 width/height/margin/padding
     这些会触发布局的属性也带进来，hover / 按下每次都多一轮 reflow；这里按需列举。 */
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.08s ease-out;
  font-family: inherit;
  flex-shrink: 0;
}
.rs-btn:hover:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
/* 按压反馈：缩放要跟手。transform 单独给 0.08s（见 .rs-btn 的 transition），
   若跟颜色一样 0.2s，30px 的按钮会先「塌」下去再弹回，看着发黏。 */
.rs-btn:active:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) {
  transform: scale(0.92);
}
.rs-btn--small {
  width: 28px;
  height: 28px;
  font-size: 12px;
}
.rs-btn--size-small {
  width: 28px;
  height: 28px;
  font-size: 12px;
}
.rs-btn--size-default {
  width: 30px;
  height: 30px;
  font-size: 14px;
}
.rs-btn--size-large {
  width: 36px;
  height: 36px;
  font-size: 16px;
}
.rs-btn--default {
  border-color: var(--el-border-color, #dcdfe6);
  color: var(--el-text-color-secondary, #909399);
}
.rs-btn--default:hover:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) {
  border-color: var(--el-color-primary-light-3, #a0cfff);
  color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rs-btn--primary {
  border-color: var(--el-color-primary, #409eff);
  color: var(--el-color-primary, #409eff);
}
.rs-btn--primary:hover:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.rs-btn--danger {
  border-color: var(--el-color-danger, #f56c6c);
  color: var(--el-color-danger, #f56c6c);
}
.rs-btn--danger:hover:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) {
  background: var(--el-color-danger, #f56c6c);
  color: #fff;
}
.rs-btn--plain.rs-btn--primary {
  background: var(--el-color-primary-light-9, #ecf5ff);
}
.rs-btn--plain.rs-btn--primary:hover:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) {
  background: var(--el-color-primary, #409eff);
  color: #fff;
}
.rs-btn.is-disabled,
.rs-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
/* 纯装饰徽标：鼠标指针、过渡反馈一律不要 —— 它不可点，给了 pointer 就是在骗用户。
   外观（尺寸/边框/配色）保持与同款按钮完全一致，避免卡片视觉走样。 */
.rs-btn--decorative {
  cursor: default;
  transition: none;
}
.rs-btn.is-loading {
  cursor: wait;
  opacity: 0.85;
}
.rs-btn__spinner {
  display: inline-flex;
  animation: rs-spin 0.8s linear infinite;
}
/* 动画图标在 loading 态：保留图标本体，外层套一个旋转。
   上游动画图标自己也会动（hover 时），两层动效叠在一个元素上会打架 ——
   所以这里把上游的 hover 动效在 loading 期间压掉，只留整体的旋转。 */
.rs-btn__spinner--icon {
  animation: rs-spin 0.9s linear infinite;

  :deep(.re-icon__anim) {
    animation: none;
  }
}
/* 尺寸写死并禁止收缩：spinner 是按钮里唯一的图形，尺寸必须与它替换掉的图标一致（14px），
   否则 loading 切换时按钮内容会跳一下 */
.rs-btn__spinner svg {
  width: 14px;
  height: 14px;
  flex: none;
  display: block;
}
.rs-btn--size-small .rs-btn__spinner svg { width: 12px; height: 12px; }
.rs-btn--size-large .rs-btn__spinner svg { width: 17px; height: 17px; }
@keyframes rs-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
.rs-btn__icon {
  display: inline-flex;
  flex-shrink: 0;
}
@media (prefers-reduced-motion: reduce) {
  .rs-btn { transition: none; }
  .rs-btn:active:not(.rs-btn--decorative):not(.is-disabled):not(:disabled) { transform: none; }
  /* 旋转动画本身要停：spinner 靠 animation 而非 transition 驱动，
     只写 transition: none 是停不下来的（此前漏了这条，reduced-motion 下仍在转）。 */
  .rs-btn__spinner { animation: none; }
}
</style>