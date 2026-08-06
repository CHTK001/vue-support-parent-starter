<template>
  <div
    ref="rootRef"
    class="re-carousel"
    :class="[`re-carousel--${direction}`, { 'is-hover': isHovering }]"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      class="re-carousel__track"
      :style="trackStyle"
      @transitionend="handleTransitionEnd"
    >
      <div
        v-for="(item, index) in displayItems"
        :key="getItemKey(item, index)"
        class="re-carousel__item"
        :style="itemStyle"
        @click="handleItemClick(item, index)"
      >
        <slot :item="item" :index="realIndex(index)" :active="realIndex(index) === activeIndex">
          <img v-if="isImage(item)" :src="item" :alt="getItemAlt(item, index)" class="re-carousel__img" />
          <div v-else class="re-carousel__default">{{ item }}</div>
        </slot>
      </div>
    </div>

    <!-- 左右箭头 -->
    <template v-if="arrow !== 'never'">
      <button
        v-if="arrow === 'always' || isHovering"
        class="re-carousel__arrow re-carousel__arrow--left"
        @click="handlePrev"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M15 18l-6-6 6-6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
      <button
        v-if="arrow === 'always' || isHovering"
        class="re-carousel__arrow re-carousel__arrow--right"
        @click="handleNext"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </template>

    <!-- 指示器 -->
    <div v-if="indicator !== 'never' && items.length > 0" class="re-carousel__indicators">
      <button
        v-for="(item, index) in items"
        :key="`ind-${getItemKey(item, index)}`"
        class="re-carousel__indicator"
        :class="{ 'is-active': realIndex(index) === activeIndex }"
        :style="indicatorStyle"
        @click="setActive(realIndex(index))"
      >
        <slot name="indicator" :item="item" :index="index" :active="realIndex(index) === activeIndex">
          <span class="re-carousel__indicator-dot" />
        </slot>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * ReCarousel —— 轮播图组件
 *
 * 自实现 CSS transform + transition，无外部依赖
 * 支持自动播放、循环、垂直/水平、箭头/指示器
 *   <ReCarousel :items="images" :interval="3000" />
 */
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";

interface Props {
  /** 轮播项数组（string URL 或任意对象） */
  items: Array<string | Record<string, unknown>>;
  /** 当前激活索引（受控） */
  modelValue?: number;
  /** 自动播放间隔（ms，0 禁用） */
  interval?: number;
  /** 方向 */
  direction?: "horizontal" | "vertical";
  /** 循环 */
  loop?: boolean;
  /** 箭头显示：hover 悬停时 / always 始终 / never 不显示 */
  arrow?: "hover" | "always" | "never";
  /** 指示器显示 */
  indicator?: "always" | "never";
  /** 暂停自动播放（hover） */
  pauseOnHover?: boolean;
  /** 初始索引 */
  initialIndex?: number;
  /** 指示器位置 */
  indicatorPosition?: "inside" | "outside" | "none";
  /** 自定义键名 */
  itemKey?: string;
  /** 切换时回调 */
  onChange?: (index: number) => void;
  /** 切换前钩子（返回 false 阻止） */
  beforeChange?: (newIndex: number, oldIndex: number) => boolean | Promise<boolean>;
}

const props = withDefaults(defineProps<Props>(), {
  interval: 3000,
  direction: "horizontal",
  loop: true,
  arrow: "hover",
  indicator: "always",
  pauseOnHover: true,
  initialIndex: 0,
  indicatorPosition: "inside",
  itemKey: "",
});

const emit = defineEmits<{
  (e: "update:modelValue", value: number): void;
  (e: "change", index: number): void;
}>();

const rootRef = ref<HTMLElement | null>(null);
const activeIndex = ref(props.modelValue ?? props.initialIndex);
const isHovering = ref(false);
const slideTransition = ref(true);
let timer: number | null = null;

const itemsCount = computed(() => props.items.length);

const displayItems = computed(() => {
  if (!props.loop || itemsCount.value <= 1) return props.items;
  // 首尾各加一个用于无缝循环
  return [
    props.items[itemsCount.value - 1],
    ...props.items,
    props.items[0],
  ];
});

const indicatorOffset = computed(() => (props.loop ? 1 : 0));

const trackOffset = computed(() =>
  props.loop ? -(activeIndex.value + 1) * 100 : -activeIndex.value * 100,
);

const trackStyle = computed<Record<string, string>>(() => {
  const transition = slideTransition.value ? `transform ${props.interval && props.interval > 0 ? 500 : 350}ms ease-in-out` : "none";
  return {
    transform:
      props.direction === "horizontal"
        ? `translateX(${trackOffset.value}%)`
        : `translateY(${trackOffset.value}%)`,
    transition,
    display: "flex",
    flexDirection: props.direction === "horizontal" ? "row" : "column",
    width: "100%",
    height: "100%",
  };
});

const itemStyle = computed<Record<string, string>>(() => ({
  flex: "0 0 100%",
  width: "100%",
  height: "100%",
}));

const indicatorStyle = computed(() => ({}));

const getItemKey = (item: string | Record<string, unknown>, index: number): string => {
  if (props.itemKey && typeof item === "object" && item !== null) {
    return String((item as Record<string, unknown>)[props.itemKey] ?? index);
  }
  if (typeof item === "string") return item;
  return String(index);
};

const isImage = (item: string | Record<string, unknown>): boolean => {
  if (typeof item === "string") {
    return /^https?:\/\/|^\/|data:image/.test(item) || /\.(jpe?g|png|gif|webp|svg|avif)$/i.test(item);
  }
  return false;
};

const getItemAlt = (item: string | Record<string, unknown>, index: number): string => {
  if (typeof item === "object" && item !== null) {
    return String((item as Record<string, unknown>).alt ?? `slide-${index}`);
  }
  return `slide-${index}`;
};

const realIndex = (displayIndex: number): number => {
  if (!props.loop) return displayIndex;
  if (displayIndex === 0) return itemsCount.value - 1;
  if (displayIndex === itemsCount.value + 1) return 0;
  return displayIndex - 1;
};

const goTo = async (targetIndex: number) => {
  const oldIndex = activeIndex.value;
  if (targetIndex === oldIndex) return;
  if (props.beforeChange) {
    const ok = await props.beforeChange(targetIndex, oldIndex);
    if (!ok) return;
  }
  activeIndex.value = targetIndex;
  emit("update:modelValue", targetIndex);
  emit("change", targetIndex);
  props.onChange?.(targetIndex);
};

const setActive = (index: number) => {
  void goTo(index);
};

const handleNext = () => {
  if (itemsCount.value === 0) return;
  let next = activeIndex.value + 1;
  if (next >= itemsCount.value) {
    if (props.loop) next = 0;
    else return;
  }
  void goTo(next);
};

const handlePrev = () => {
  if (itemsCount.value === 0) return;
  let prev = activeIndex.value - 1;
  if (prev < 0) {
    if (props.loop) prev = itemsCount.value - 1;
    else return;
  }
  void goTo(prev);
};

const handleItemClick = (item: string | Record<string, unknown>, index: number) => {
  const real = realIndex(index);
  if (real !== activeIndex.value) {
    setActive(real);
  }
};

const handleTransitionEnd = () => {
  if (!props.loop) return;
  // 切换到 clone 节点时，无缝跳到真实索引
  if (activeIndex.value === -1) {
    slideTransition.value = false;
    activeIndex.value = itemsCount.value - 1;
    requestAnimationFrame(() => {
      slideTransition.value = true;
    });
  } else if (activeIndex.value === itemsCount.value) {
    slideTransition.value = false;
    activeIndex.value = 0;
    requestAnimationFrame(() => {
      slideTransition.value = true;
    });
  }
};

const startTimer = () => {
  if (props.interval <= 0 || itemsCount.value <= 1) return;
  stopTimer();
  timer = window.setInterval(() => {
    if (props.pauseOnHover && isHovering.value) return;
    handleNext();
  }, props.interval);
};

const stopTimer = () => {
  if (timer !== null) {
    window.clearInterval(timer);
    timer = null;
  }
};

const handleMouseEnter = () => {
  isHovering.value = true;
};

const handleMouseLeave = () => {
  isHovering.value = false;
};

const handleVisibilityChange = () => {
  if (document.hidden) {
    stopTimer();
  } else {
    startTimer();
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val !== undefined && val !== activeIndex.value) {
      slideTransition.value = true;
      activeIndex.value = val;
    }
  },
);

watch(
  () => props.items,
  () => {
    slideTransition.value = false;
    activeIndex.value = props.modelValue ?? props.initialIndex;
    requestAnimationFrame(() => {
      slideTransition.value = true;
    });
  },
  { deep: true },
);

onMounted(() => {
  startTimer();
  document.addEventListener("visibilitychange", handleVisibilityChange);
});

onBeforeUnmount(() => {
  stopTimer();
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});

defineExpose({ setActive, next: handleNext, prev: handlePrev });
</script>

<style scoped>
.re-carousel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-fill-color-light);
}

.re-carousel--vertical {
  display: flex;
  flex-direction: column;
}

.re-carousel__track {
  width: 100%;
  height: 100%;
}

.re-carousel__item {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
}

.re-carousel__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.re-carousel__default {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
}

.re-carousel__arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, opacity 0.2s;
  z-index: 1;
  opacity: 0;
}

.re-carousel.is-hover .re-carousel__arrow,
.re-carousel__arrow:focus {
  opacity: 1;
}

.re-carousel__arrow:hover {
  background: rgba(0, 0, 0, 0.6);
}

.re-carousel__arrow svg {
  width: 20px;
  height: 20px;
}

.re-carousel__arrow--left {
  left: 12px;
}

.re-carousel__arrow--right {
  right: 12px;
}

.re-carousel--vertical .re-carousel__arrow {
  top: auto;
  bottom: 12px;
  transform: none;
  left: 50%;
  margin-left: -18px;
}

.re-carousel--vertical .re-carousel__arrow--left {
  top: 12px;
  bottom: auto;
  transform: rotate(-90deg);
}

.re-carousel--vertical .re-carousel__arrow--right {
  transform: rotate(90deg);
}

.re-carousel__indicators {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 6px;
  z-index: 1;
}

.re-carousel--vertical .re-carousel__indicators {
  bottom: auto;
  left: auto;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  flex-direction: column;
}

.re-carousel__indicator {
  width: 24px;
  height: 4px;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.re-carousel__indicator-dot {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  transition: background 0.2s, transform 0.2s;
}

.re-carousel__indicator.is-active .re-carousel__indicator-dot {
  background: var(--el-color-primary);
}
</style>
