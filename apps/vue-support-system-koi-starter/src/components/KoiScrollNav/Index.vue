<template>
  <div ref="rootRef" class="koi-scroll-nav" :style="{ height: height + 'px' }">
    <div class="koi-scroll-nav__track" ref="trackRef">
      <slot />
    </div>
    <div v-if="showPrev" class="koi-scroll-nav__btn koi-scroll-nav__btn--prev" @click="scroll('prev')">
      <el-icon><ArrowLeft /></el-icon>
    </div>
    <div v-if="showNext" class="koi-scroll-nav__btn koi-scroll-nav__btn--next" @click="scroll('next')">
      <el-icon><ArrowRight /></el-icon>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { ArrowLeft, ArrowRight } from "@element-plus/icons-vue";

const props = defineProps({
  height: { type: Number, default: 42 },
  gap: { type: Number, default: 6 },
  activeSelector: { type: String, default: "" },
  prevAriaLabel: { type: String, default: "向左滚动" },
  nextAriaLabel: { type: String, default: "向右滚动" }
});

const rootRef = ref<HTMLElement | null>(null);
const trackRef = ref<HTMLElement | null>(null);
const showPrev = ref(false);
const showNext = ref(false);

const updateScrollState = () => {
  if (!trackRef.value) return;
  const { scrollLeft, scrollWidth, clientWidth } = trackRef.value;
  showPrev.value = scrollLeft > 0;
  showNext.value = scrollLeft < scrollWidth - clientWidth - 1;
};

const scroll = (direction: "prev" | "next") => {
  if (!trackRef.value) return;
  const { clientWidth } = trackRef.value;
  const scrollAmount = clientWidth * 0.8;
  trackRef.value.scrollBy({
    left: direction === "next" ? scrollAmount : -scrollAmount,
    behavior: "smooth"
  });
};

onMounted(() => {
  updateScrollState();
  if (trackRef.value) {
    trackRef.value.addEventListener("scroll", updateScrollState);
  }
});

onUnmounted(() => {
  if (trackRef.value) {
    trackRef.value.removeEventListener("scroll", updateScrollState);
  }
});

defineExpose({ updateScrollState });
</script>

<style scoped lang="scss">
.koi-scroll-nav {
  position: relative;
  width: 100%;
  min-width: 0;
}

.koi-scroll-nav__track {
  display: flex;
  align-items: center;
  gap: v-bind('props.gap + "px"');
  overflow-x: auto;
  height: 100%;
  padding-bottom: 2px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}

.koi-scroll-nav__btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;

  &:hover {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary);
    color: var(--el-color-primary);
  }
}

.koi-scroll-nav__btn--prev { left: 4px; }
.koi-scroll-nav__btn--next { right: 4px; }
</style>