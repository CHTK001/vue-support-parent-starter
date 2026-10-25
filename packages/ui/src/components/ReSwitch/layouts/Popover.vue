<template>
  <ElPopover
    :visible="visible"
    :placement="placement"
    :width="popoverWidth"
    :trigger="disabled ? [] : 'click'"
    :persistent="false"
    popper-class="re-switch-popover"
    :popper-style="popperStyle"
    @update:visible="onVisibleChange"
  >
    <template #reference>
      <span class="re-switch-popover__trigger">
        <ReButton
          layout="square"
          :icon="icon"
          :active-icon="activeIcon"
          :inactive-icon="inactiveIcon"
          :preset="preset"
          :active="isActive"
          :tip="title"
          :type="isActive ? 'primary' : ''"
          :size="size"
          :disabled="disabled"
        />
        <!-- 状态角标：视觉复刻 square 布局的右上角打勾，让本布局与 ReSwitch layout="square"
             读起来是同一族；语义由 ReButton 的 aria-label（title 里的状态文案）承担，故 aria-hidden。
             亮灭有两个信号：type="primary" 让方块按钮转主色（实测 2026-09-28 确认生效：
             关闭态 rs-btn--default / rgb(92,98,112)，点亮态 rs-btn--primary / rgb(41,146,255)），
             角标再补一个显式打勾。 -->
        <span v-if="isActive" class="re-switch-popover__check" aria-hidden="true">
          <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="2 6 5 9 10 3" />
          </svg>
        </span>
      </span>
    </template>
    <div class="re-switch-popover__panel">
      <slot :active="isActive" :close="close" />
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
/**
 * PopoverReSwitch —— 纯方形按钮触发 + 浮层取值的开关布局
 *
 * 与其它 ReSwitch 布局的区别：触发器不是「点一下就翻状态」的开关，而是一枚**纯入口**，
 * 状态由浮层里的内容（档位菜单、下拉、数字输入……）来改。适合「同一个开关有若干档」的场景 ——
 * 例如表格的自动刷新间隔：关闭 / 每 5 秒 / 每 30 秒，档位本身即状态。
 *
 * <p><b>结构</b>：触发器是 {@code ReButton layout="square"}（与工具栏其它方块按钮同尺寸），
 * 点开是**无边框**浮层 —— 面板自身不画分隔线，浮层外壳去描边，选中态只靠底色 + 右侧对勾表达，
 * 避免窄浮层里出现一串框。</p>
 *
 * <p><b>状态判定</b>：{@code 0 / "" / false} 视为「关」，其余一律视为「开」。
 * 这样布尔开关、字符串 id、毫秒间隔三种模型值共用一套判定，不必为每种模型各配一个 activeValue。</p>
 *
 * <p><b>选中即收起</b>：模型值变化会自动关闭浮层（值只可能由面板内容改动，
 * 触发器是纯入口不会自己翻状态），这是「选完即生效」的常规预期。</p>
 *
 * <p><b>无障碍</b>：本布局是纯图标按钮，{@code title} 既是 tooltip 也是按钮的可访问名
 * （经 ReButton 落到 aria-label），<b>务必传入含状态文案的 title</b>，否则读屏只会报「按钮」；
 * 浮层内容由使用方保证有可读文本。角标为纯装饰，已 aria-hidden。</p>
 *
 * <p><b>无边框与内距</b>：浮层外壳去描边，内距由 {@code popoverPadding} 控制（默认 8px，
 * 档位多的场景可调到 10~12），两者写在同一段非 scoped CSS 里，弹层 teleport 到 body 仍能生效。</p>
 *
 * <p><b>约定</b>：{@code disabled} 时触发器置灰，浮层的 trigger 置空数组（不绑任何触发事件，
 * 彻底点不开）。Element Plus 的 trigger 类型里没有 manual，传空数组才是合法写法。
 * 开启时向 ReButton 传 {@code type="primary"}，方块按钮转主色，与右上角角标一起表达亮灭
 * （2026-09-28 实测 type 生效：关闭态 {@code rs-btn--default} / rgb(92,98,112)，
 * 点亮态 {@code rs-btn--primary} / rgb(41,146,255)）。</p>
 *
 * 用法：
 *   <ReSwitch
 *     layout="popover"
 *     icon="Timer"
 *     :title="ms > 0 ? `自动刷新中：每 ${ms / 1000} 秒` : '自动刷新：已关闭'"
 *     :popover-padding="10"
 *     v-model="ms"
 *   >
 *     <ReSelect v-model="ms" layout="square" vertical :data="options" />
 *   </ReSwitch>
 */
import { computed, ref, watch } from "vue";
import { ElPopover } from "element-plus";
import ReButton from "../../ReButton/ReButton.vue";

defineOptions({ name: "PopoverReSwitch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 提示文案，同时作为触发器 tooltip 与可访问名（应含状态描述） */
    title?: string;
    /** 通用图标名（开 / 关两态相同） */
    icon?: string;
    /** 开启态图标名（缺省回退到 icon） */
    activeIcon?: string;
    /** 关闭态图标名（缺省回退到 icon） */
    inactiveIcon?: string;
    /** 内置图标集名（sunmoon / check / star / bell / arrow / anim）；"none" 关闭内置回落 */
    preset?: string;
    /** 是否禁用 */
    disabled?: boolean;
    /** 触发器尺寸（与工具栏其它方块按钮对齐，默认 30px） */
    size?: "large" | "default" | "small";
    /** 浮层弹出方位 */
    placement?: "top" | "top-start" | "top-end" | "bottom" | "bottom-start" | "bottom-end" | "left" | "left-start" | "left-end" | "right" | "right-start" | "right-end";
    /** 浮层宽度（px） */
    popoverWidth?: number;
    /**
     * 浮层内边距（px），默认 0。
     *
     * <p>默认零内距：本布局是「纯方块入口 + 无边框浮层」的极简语言，加内距会凭空
     * 多出一圈空白，让浮层显得比内容大一号（实测 8px 内距下 5 档菜单的浮层高 263px）。
     * 档位菜单自身已有行高与选中底色，贴边不挤。需要呼吸感时可调到 8~12。</p>
     *
     * <p>走 CSS 变量下发（见下方非 scoped 段），不直接写内联 padding，
     * 这样「去描边 + 内距」两条规则留在同一处，便于一起读。</p>
     */
    popoverPadding?: number;
  }>(),
  {
    title: "",
    icon: "",
    activeIcon: "",
    inactiveIcon: "",
    preset: undefined,
    disabled: false,
    size: "default",
    placement: "bottom-end",
    popoverWidth: 196,
    popoverPadding: 0,
  },
);

const model = defineModel<boolean | string | number>({ default: false });

/** 浮层显隐 */
const visible = ref(false);

/**
 * 是否点亮：0 / "" / false 视为「关」，其余视为「开」。
 *
 * 三种模型值（布尔 / 字符串 id / 毫秒间隔）共用这一条规则，
 * 调用方不必为每种模型单独配 activeValue。
 */
const isActive = computed<boolean>(() => {
  const v = model.value;
  if (typeof v === "number") {
    return v > 0;
  }
  if (typeof v === "string") {
    return v !== "" && v !== "0";
  }
  return v === true;
});

/** 触发器图标按状态取专属图标，交给 ReButton 的两态图标（activeIcon / inactiveIcon / preset）处理。 */

/**
 * 浮层外壳的内距：经 popper-style 下发 CSS 变量，而不是内联 padding。
 *
 * <p>为什么不直接写内联 padding：去描边（border: none !important）只能放在非 scoped 的
 * CSS 里（弹层 teleport 到 body），若内距走内联、描边走 CSS，同一个外壳的属性就分成了两处，
 * 以后改样式容易只改一处。内距改走变量后，「去描边 + 内距」两条规则都在同一段 CSS 里，
 * 内联只负责喂一个数值。</p>
 */
const popperStyle = computed<Record<string, string>>(() => ({
  "--re-switch-popover-padding": `${props.popoverPadding}px`,
}));

/** 关闭浮层（也作为 #close 插槽参数交给使用方） */
function close(): void {
  visible.value = false;
}

/**
 * 浮层显隐回写。
 *
 * @param v Element Plus 抛出的目标显隐态
 */
function onVisibleChange(v: boolean): void {
  visible.value = v;
}

/* 选中即生效并收起浮层：模型值只可能被面板内容改动（触发器不翻状态） */
watch(model, close);
</script>

<style scoped>
/* 触发器：相对定位容器，让状态角标挂在方块按钮右上角 */
.re-switch-popover__trigger {
  position: relative;
  display: inline-flex;
}

/* 状态角标：与 ReSwitch layout="square" 的右上角打勾同一规格（主色圆底 + 白色对勾）。
   刻意不加投影 —— 主色实心圆贴在方块按钮角上已经读得出来，koi 主题也主张控件不堆投影。 */
.re-switch-popover__check {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--el-color-primary, #409eff);
  color: #fff;
  pointer-events: none;
}
.re-switch-popover__check svg {
  width: 9px;
  height: 9px;
}

/* 浮层面板：无边框，且不留内部间距。
   gap 归零是配合「零内距」的极简语言：外壳 padding 与面板 gap 任一非零，
   都会让浮层比内容大一圈。档位菜单自身的行高与选中底色已经撑得起可读性。
   想要呼吸感请调 popoverPadding（作用于整块浮层，比调 gap 视觉更整）。 */
.re-switch-popover__panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}
</style>

<style>
/* 浮层外壳：无描边 + 可配内距。
   底色 / 投影 / 圆角继续用主题的 --bg-elevated、--shadow-lg、--el-popover-border-radius，
   跟随主题切换，不另写一套；这里只管 border 与 padding。
   写法与 Header/components/ReTyphoon.vue 的外壳去边一致：应用侧有通用弹层描边
   （`.el-popper` / `.el-popper.is-light` 等多来源、特异度 ≥ (0,3,0)），只堆类名压不住，
   必须带 !important。padding 无需 !important（本项目实测同分时本规则胜出）。
   弹层 teleport 到 body，本段必须非 scoped。 */
.el-popper.re-switch-popover.el-popover {
  padding: var(--re-switch-popover-padding, 8px);
  border: none !important;
}
</style>
