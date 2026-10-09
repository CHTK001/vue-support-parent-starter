<!--
  数据库控制台的开关。

  <p>控制台里没有「语义不明」的开关——可空 / 主键 / 唯一 / 自增 / 事务 / 有表头…
  全是「是 / 否」两态，靠 el-switch 的左右位置去猜哪边是开，看一眼记不住。
  所以控制台的开关**默认渲染成 ReRadio（分段单选，见 ReSwitch 的 radio 布局）**：
  两个选项文字都在，当前值直接读出来，密集表单里也更容易对齐。</p>

  <p>这个组件只做「把默认布局钉成 radio」这一件事：对外 API 与 ReSwitch 完全一致
  （v-model / 事件 / 插槽全部透传），需要别的布局时显式传 {@code layout} 即可覆盖。
  控制台新增开关时直接 import 本文件（或沿用现在的别名 ReSwitch），不用记这条默认值。</p>
-->
<script setup lang="ts">
import ReSwitch from "@repo/ui/re-switch";

defineOptions({ name: "ConsoleSwitch", inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /** 显式指定布局；不传即本组件的意义所在 —— 默认 ReRadio 分段单选 */
    layout?: "default" | "card" | "modern" | "square" | "popover" | "radio";
    /** 「开」的文案（radio 布局） */
    radioOnLabel?: string;
    /** 「关」的文案（radio 布局） */
    radioOffLabel?: string;
  }>(),
  {
    layout: "radio",
    radioOnLabel: "是",
    radioOffLabel: "否",
  },
);

const modelValue = defineModel<boolean | string | number>({ default: false });
</script>

<template>
  <ReSwitch
    :layout="props.layout"
    :radio-on-label="props.radioOnLabel"
    :radio-off-label="props.radioOffLabel"
    v-model="modelValue"
    v-bind="$attrs"
  >
    <slot />
  </ReSwitch>
</template>
