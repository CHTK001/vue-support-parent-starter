<script setup lang="ts">
/**
 * ReSwitch —— 开关组件（layout 驱动，异步加载布局实现）
 *
 * 封装 el-switch，通过 layout 属性切换不同布局：
 *   <ReSwitch layout="card" title="多标签导航" sub="顶部标签栏" tip="..." v-model="val" />
 *   <ReSwitch title="菜单手风琴" v-model="val" />  <!-- layout="default" -->
 *   <ReSwitch layout="popover" icon="Timer" title="自动刷新：已关闭" v-model="ms">
 *     <ReSelect layout="square" vertical :data="档位" />   <!-- 纯方块入口 + 无边框浮层取档 -->
 *   </ReSwitch>
 *   <ReSwitch layout="radio" title="允许为空" v-model="nullable" />  <!-- 分段单选 是/否，两态文字直读 -->
 *
 * 布局通用 props：title / tip / sub / description
 * 布局专属 props：以布局名开头，如 card-hide-switch / card-show-radio
 *
 * 布局组件位于 layouts/ 目录，按需异步加载，不会一次性全部打包。
 */
import { shallowRef, watch, type Component } from "vue";

defineOptions({ name: "ReSwitch", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 布局类型：default（原生行内）| card（卡片式）| modern（现代化扁平）| square（正方形纯图标）| popover（纯方块入口 + 无边框浮层取档）| radio（分段单选是/否） */
    layout?: "default" | "card" | "modern" | "square" | "popover" | "radio";
    /** 主标题（通用） */
    title?: string;
    /** 灰色小标题（通用） */
    sub?: string;
    /** 提示文案，标题旁问号图标（通用） */
    tip?: string;
    /** 副标题说明（通用） */
    description?: string;
    /** card 布局：隐藏内部 el-switch（默认 true） */
    cardHideSwitch?: boolean;
    /** card 布局：以 radio 样式展示（隐藏 el-switch，仅靠边框/背景表示状态，默认 false） */
    cardShowRadio?: boolean;
    /** square 布局：通用图标名（激活/非激活都用它，两态相同，如 ep:star） */
    icon?: string;
    /** square 布局：激活态图标名（缺省回退到 icon） */
    activeIcon?: string;
    /** square 布局：非激活态图标名（缺省回退到 icon） */
    inactiveIcon?: string;
    /** radio 布局：「开」的文案 */
    radioOnLabel?: string;
    /** radio 布局：「关」的文案 */
    radioOffLabel?: string;
  }>(),
  {
    layout: "default",
    cardHideSwitch: true,
    cardShowRadio: false,
    icon: "",
    activeIcon: "",
    inactiveIcon: "",
    radioOnLabel: "是",
    radioOffLabel: "否",
  },
);

const modelValue = defineModel<boolean | string | number>({ default: false });

const layoutComp = shallowRef<Component | null>(null);

watch(
  () => props.layout,
  async (layout) => {
    try {
      if (layout === "card") {
        const mod = await import("./layouts/CardReSwitch.vue");
        layoutComp.value = mod.default;
      } else if (layout === "modern") {
        const mod = await import("./layouts/Modern.vue");
        layoutComp.value = mod.default;
      } else if (layout === "square") {
        const mod = await import("./layouts/SquareReSwitch.vue");
        layoutComp.value = mod.default;
      } else if (layout === "popover") {
        const mod = await import("./layouts/Popover.vue");
        layoutComp.value = mod.default;
      } else if (layout === "radio") {
        const mod = await import("./layouts/Radio.vue");
        layoutComp.value = mod.default;
      } else {
        const mod = await import("./layouts/DefaultReSwitch.vue");
        layoutComp.value = mod.default;
      }
    } catch {
      console.warn("[ReSwitch] 布局加载失败:", layout);
    }
  },
  { immediate: true },
);
</script>

<template>
  <component
    :is="layoutComp"
    v-bind="$attrs"
    :title="title"
    :sub="sub"
    :tip="tip"
    :description="description"
    :card-hide-switch="cardHideSwitch"
    :card-show-radio="cardShowRadio"
    :icon="icon"
    :active-icon="activeIcon"
    :inactive-icon="inactiveIcon"
    :radio-on-label="layout === 'radio' ? radioOnLabel : undefined"
    :radio-off-label="layout === 'radio' ? radioOffLabel : undefined"
    v-model="modelValue"
  >
    <slot />
  </component>
</template>