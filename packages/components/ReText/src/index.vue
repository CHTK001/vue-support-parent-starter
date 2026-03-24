<script lang="ts" setup>
import { h, onMounted, PropType, ref, useSlots } from "vue";
import { type TippyOptions, useTippy } from "vue-tippy";

defineOptions({
  name: "ReText"
});

const props = defineProps({
  // 行数
  lineClamp: {
    type: [String, Number]
  },
  tippyProps: {
    type: Object as PropType<TippyOptions>,
    default: () => ({})
  }
});

const textRef = ref();
const tippyFunc = ref();

const isTextEllipsis = (el: HTMLElement) => {
  if (!props.lineClamp) {
    // 单行省略判断
    return el.scrollWidth > el.clientWidth;
  } else {
    // 多行省略判断
    return el.scrollHeight > el.clientHeight;
  }
};

const getTooltipContent = () => {
  const el = (textRef.value?.$el ?? textRef.value) as HTMLElement | undefined;
  if (el) {
    return el.innerText;
  }
  return (props.tippyProps as TippyOptions)?.content ?? "";
};

const getTippyProps = () => ({
  ...props.tippyProps,
  content: getTooltipContent()
});

function handleHover(event: MouseEvent) {
  if (isTextEllipsis(event.target as HTMLElement)) {
    tippyFunc.value.setProps(getTippyProps());
    tippyFunc.value.enable();
  } else {
    tippyFunc.value.disable();
  }
}

onMounted(() => {
  tippyFunc.value = useTippy(textRef.value?.$el, getTippyProps());
});
</script>

<template>
  <el-text v-bind="{
    truncated: !lineClamp,
    lineClamp,
    ...$attrs
  }" ref="textRef" class="new-re-text" @mouseover.self="handleHover">
    <slot />
  </el-text>
</template>
<style lang="scss" scoped></style>
