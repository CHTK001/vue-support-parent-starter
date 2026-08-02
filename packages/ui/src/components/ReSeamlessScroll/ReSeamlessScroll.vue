<script setup lang="ts">
/**
 * ReSeamlessScroll —— 无缝滚动组件
 *
 * 来源：原 pureadmin ReSeamlessScroll（参考实现）。
 *
 * 支持上下左右四向无缝滚动、单击步进、鼠标悬停暂停、touch 拖动、滚轮滚动。
 *
 * Props:
 *   - data: 列表数据（数组），用于判断是否可以滚动（>= limitMoveNum 时启动）
 *   - classOption: 滚动配置项，详见下方的 ReSeamlessScrollOptions
 *
 * Events:
 *   - scrollEnd: 滚动一圈结束时触发
 *
 * Slots:
 *   - default: 列表内容
 *   - left-switch / right-switch: 左右切换按钮（仅 navigation=true 时显示）
 *
 * Expose:
 *   - reset: 重新初始化位置并启动滚动
 */
import {
  type CSSProperties,
  type PropType,
  computed,
  nextTick,
  ref,
  unref,
} from "vue";
import { templateRef, tryOnMounted, tryOnUnmounted, useDebounceFn } from "@vueuse/core";
import { animationFrame, copyObj } from "./utils";
import type { ReSeamlessScrollOptions } from "./types";

defineOptions({ name: "ReSeamlessScroll" });

const props = defineProps({
  data: {
    type: Array as PropType<unknown[]>,
    default: () => [],
  },
  classOption: {
    type: Object as PropType<ReSeamlessScrollOptions>,
    default: () => ({}),
  },
});

const emit = defineEmits<{
  (e: "scrollEnd"): void;
}>();

// 兼容老用法：classOption 没传 key 时，给个 0
if (props.classOption.key === undefined) {
  props.classOption.key = 0;
}

animationFrame();

const xPos = ref(0);
const yPos = ref(0);
const delay = ref(0);
const height = ref(0);
// 外容器宽度
const width = ref(0);
// 内容实际宽度
const realBoxWidth = ref(0);
const realBoxHeight = ref(0);
const copyHtml = ref("");
// single 单步滚动的定时器
let singleWaitTime: ReturnType<typeof setTimeout> | null = null;
// move 动画的 animationFrame 定时器
let reqFrame: number | null = null;
let startPos: { x: number; y: number } | null = null;
let startPosY: number | null = null;
let startPosX: number | null = null;
let isHover = false;
let ease = "ease-in";

const key = computed(() => props.classOption.key ?? 0);
const wrap = templateRef<HTMLElement | null>(`wrap${key.value}`, null);
const slotList = templateRef<HTMLElement | null>(`slotList${key.value}`, null);
const realBox = templateRef<HTMLElement | null>(`realBox${key.value}`, null);

const defaultOption: Required<Omit<ReSeamlessScrollOptions, "key">> = {
  step: 1,
  limitMoveNum: 5,
  hoverStop: true,
  direction: "top",
  openTouch: true,
  singleHeight: 0,
  singleWidth: 0,
  waitTime: 1000,
  switchOffset: 30,
  autoPlay: true,
  navigation: false,
  switchSingleStep: 134,
  switchDelay: 400,
  switchDisabledClass: "disabled",
  isSingleRemUnit: false,
};

const options = computed(() =>
  copyObj({}, defaultOption, props.classOption) as Required<Omit<ReSeamlessScrollOptions, "key">>,
);

const leftSwitchState = computed(() => unref(xPos) < 0);

const rightSwitchState = computed(
  () => Math.abs(unref(xPos)) < unref(realBoxWidth) - unref(width),
);

const leftSwitchClass = computed(() =>
  unref(leftSwitchState) ? "" : unref(options).switchDisabledClass,
);

const rightSwitchClass = computed(() =>
  unref(rightSwitchState) ? "" : unref(options).switchDisabledClass,
);

const leftSwitch = computed<CSSProperties>(() => ({
  position: "absolute",
  margin: `${unref(height) / 2}px 0 0 -${unref(options).switchOffset}px`,
  transform: "translate(-100%,-50%)",
}));

const rightSwitch = computed<CSSProperties>(() => ({
  position: "absolute",
  margin: `${unref(height) / 2}px 0 0 ${unref(width) + unref(options).switchOffset}px`,
  transform: "translateY(-50%)",
}));

const isHorizontal = computed(
  () => unref(options).direction !== "bottom" && unref(options).direction !== "top",
);

const float = computed<CSSProperties>(() =>
  unref(isHorizontal) ? { float: "left", overflow: "hidden" } : { overflow: "hidden" },
);

const pos = computed<CSSProperties>(() => ({
  transform: `translate(${unref(xPos)}px,${unref(yPos)}px)`,
  transition: `all ${ease} ${unref(delay)}ms`,
  overflow: "hidden",
}));

const navigation = computed(() => unref(options).navigation);

const autoPlay = computed(() => {
  if (unref(navigation)) return false;
  return unref(options).autoPlay;
});

const scrollSwitch = computed(() => props.data.length >= unref(options).limitMoveNum);

const hoverStopSwitch = computed(
  () => unref(options).hoverStop && unref(autoPlay) && unref(scrollSwitch),
);

const canTouchScroll = computed(() => unref(options).openTouch);

const baseFontSize = computed(() =>
  unref(options).isSingleRemUnit
    ? parseInt(window.getComputedStyle(document.documentElement).fontSize)
    : 1,
);

const realSingleStopWidth = computed(() => unref(options).singleWidth * unref(baseFontSize));

const realSingleStopHeight = computed(() => unref(options).singleHeight * unref(baseFontSize));

const step = computed(() => {
  const optStep = unref(options).step;
  const singleStep = unref(isHorizontal) ? unref(realSingleStopWidth) : unref(realSingleStopHeight);
  if (singleStep > 0 && singleStep % optStep > 0) {
    throw new Error(
      "如果设置了单步滚动，step 需是单步大小的约数，否则无法保证单步滚动结束的位置是否准确",
    );
  }
  return optStep;
});

function reset() {
  xPos.value = 0;
  yPos.value = 0;
  scrollCancle();
  scrollInitMove();
}

function leftSwitchClick() {
  if (!unref(leftSwitchState)) return;
  if (Math.abs(unref(xPos)) < unref(options).switchSingleStep) {
    xPos.value = 0;
    return;
  }
  xPos.value += unref(options).switchSingleStep;
}

function rightSwitchClick() {
  if (!unref(rightSwitchState)) return;
  if (
    unref(realBoxWidth) - unref(width) + unref(xPos) <
    unref(options).switchSingleStep
  ) {
    xPos.value = unref(width) - unref(realBoxWidth);
    return;
  }
  xPos.value -= unref(options).switchSingleStep;
}

function scrollCancle() {
  if (reqFrame !== null) cancelAnimationFrame(reqFrame);
  reqFrame = null;
}

function touchStart(e: TouchEvent) {
  if (!unref(canTouchScroll)) return;
  const touch = e.targetTouches[0];
  const { waitTime, singleHeight, singleWidth } = unref(options);
  startPos = { x: touch.pageX, y: touch.pageY };
  startPosY = unref(yPos);
  startPosX = unref(xPos);
  let timer: ReturnType<typeof setTimeout> | null = null;
  if (singleHeight && singleWidth) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => scrollCancle(), waitTime + 20);
  } else {
    scrollCancle();
  }
}

function touchMove(e: TouchEvent) {
  if (!unref(canTouchScroll) || e.targetTouches.length > 1) return;
  if (!startPos) return;
  const touch = e.targetTouches[0];
  const { direction } = unref(options);
  const endPos = {
    x: touch.pageX - startPos.x,
    y: touch.pageY - startPos.y,
  };
  e.preventDefault();
  const dir = Math.abs(endPos.x) < Math.abs(endPos.y) ? 1 : 0;
  if ((dir === 1 && direction === "bottom") || (dir === 1 && direction === "top")) {
    yPos.value = (startPosY ?? 0) + endPos.y;
  } else if (
    (dir === 0 && direction === "left") ||
    (dir === 0 && direction === "right")
  ) {
    xPos.value = (startPosX ?? 0) + endPos.x;
  }
}

function touchEnd() {
  if (!unref(canTouchScroll)) return;
  const direction = unref(options).direction;
  delay.value = 50;
  if (direction === "top") {
    if (unref(yPos) > 0) yPos.value = 0;
  } else if (direction === "bottom") {
    const h = (unref(realBoxHeight) / 2) * -1;
    if (unref(yPos) < h) yPos.value = h;
  } else if (direction === "left") {
    if (unref(xPos) > 0) xPos.value = 0;
  } else if (direction === "right") {
    const w = unref(realBoxWidth) * -1;
    if (unref(xPos) < w) xPos.value = w;
  }
  let timer: ReturnType<typeof setTimeout> | null = null;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    delay.value = 0;
    scrollMove();
  }, unref(delay));
}

function enter() {
  if (unref(hoverStopSwitch)) scrollStopMove();
}

function leave() {
  if (unref(hoverStopSwitch)) scrollStartMove();
}

function scrollMove() {
  if (isHover) return;
  reqFrame = requestAnimationFrame(() => {
    const h = unref(realBoxHeight) / 2;
    const w = unref(realBoxWidth) / 2;
    const { direction, waitTime } = unref(options);
    if (direction === "top") {
      if (Math.abs(unref(yPos)) >= h) {
        emit("scrollEnd");
        yPos.value = 0;
      }
      yPos.value -= step.value;
    } else if (direction === "bottom") {
      if (unref(yPos) >= 0) {
        emit("scrollEnd");
        yPos.value = h * -1;
      }
      yPos.value += step.value;
    } else if (direction === "left") {
      if (Math.abs(unref(xPos)) >= w) {
        emit("scrollEnd");
        xPos.value = 0;
      }
      xPos.value -= step.value;
    } else if (direction === "right") {
      if (unref(xPos) >= 0) {
        emit("scrollEnd");
        xPos.value = w * -1;
      }
      xPos.value += step.value;
    }
    if (singleWaitTime) clearTimeout(singleWaitTime);
    if (unref(realSingleStopHeight)) {
      if (Math.abs(unref(yPos)) % unref(realSingleStopHeight) < unref(step)) {
        singleWaitTime = setTimeout(() => scrollMove(), waitTime);
      } else {
        scrollMove();
      }
    } else if (unref(realSingleStopWidth)) {
      if (Math.abs(unref(xPos)) % unref(realSingleStopWidth) < unref(step)) {
        singleWaitTime = setTimeout(() => scrollMove(), waitTime);
      } else {
        scrollMove();
      }
    } else {
      scrollMove();
    }
  });
}

function scrollInitMove() {
  nextTick(() => {
    const wrapEl = unref(wrap);
    const slotListEl = unref(slotList);
    const realBoxEl = unref(realBox);
    if (!wrapEl || !slotListEl || !realBoxEl) return;

    const { switchDelay } = unref(options);
    copyHtml.value = "";
    if (unref(isHorizontal)) {
      height.value = wrapEl.offsetHeight;
      width.value = wrapEl.offsetWidth;
      let slotListWidth = slotListEl.offsetWidth;
      if (unref(autoPlay)) {
        slotListWidth = slotListWidth * 2 + 1;
      }
      realBoxEl.style.width = slotListWidth + "px";
      realBoxWidth.value = slotListWidth;
    }

    if (unref(autoPlay)) {
      ease = "ease-in";
      delay.value = 0;
    } else {
      ease = "linear";
      delay.value = switchDelay;
      return;
    }

    if (unref(scrollSwitch)) {
      let timer: ReturnType<typeof setTimeout> | null = null;
      if (timer) clearTimeout(timer);
      copyHtml.value = slotListEl.innerHTML;
      timer = setTimeout(() => {
        realBoxHeight.value = realBoxEl.offsetHeight;
        scrollMove();
      }, 0);
    } else {
      scrollCancle();
      yPos.value = 0;
      xPos.value = 0;
    }
  });
}

function scrollStartMove() {
  isHover = false;
  scrollMove();
}

function scrollStopMove() {
  isHover = true;
  if (singleWaitTime) clearTimeout(singleWaitTime);
  scrollCancle();
}

function wheel(e: WheelEvent) {
  if (unref(options).direction === "left" || unref(options).direction === "right") return;
  useDebounceFn(() => {
    e.deltaY > 0 ? (yPos.value -= step.value) : (yPos.value += step.value);
  }, 50)();
}

tryOnMounted(() => {
  scrollInitMove();
});

tryOnUnmounted(() => {
  scrollCancle();
  if (singleWaitTime) clearTimeout(singleWaitTime);
});

defineExpose({ reset });
</script>

<template>
  <div :ref="`wrap${key}`">
    <div
      v-if="navigation"
      :style="leftSwitch"
      :class="leftSwitchClass"
      @click="leftSwitchClick"
    >
      <slot name="left-switch" />
    </div>
    <div
      v-if="navigation"
      :style="rightSwitch"
      :class="rightSwitchClass"
      @click="rightSwitchClick"
    >
      <slot name="right-switch" />
    </div>
    <div
      :ref="`realBox${key}`"
      :style="pos"
      @mouseenter="enter"
      @mouseleave="leave"
      @touchstart.passive="touchStart"
      @touchmove.passive="touchMove"
      @touchend="touchEnd"
      @mousewheel.passive="wheel"
    >
      <div :ref="`slotList${key}`" :style="float">
        <slot />
      </div>
      <div :style="float" v-html="copyHtml" />
    </div>
  </div>
</template>