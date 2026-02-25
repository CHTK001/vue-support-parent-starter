<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";

const { $storage } = useGlobal<GlobalPropertiesApi>();

const isDevEnv = import.meta.env.DEV || import.meta.env.MODE === "development";

const devLiteTools = computed<boolean>(
  () => !!$storage?.configure?.devLiteTools,
);
const devRuler = computed<boolean>(() => !!$storage?.configure?.devRuler);
const devGrid = computed<boolean>(() => !!$storage?.configure?.devGrid);
const devHoverInspector = computed<boolean>(
  () => !!$storage?.configure?.devHoverInspector,
);

const enabled = computed<boolean>(
  () => isDevEnv && devLiteTools.value,
);

const hoverVisible = ref(false);
const hoverX = ref(0);
const hoverY = ref(0);
const hoverTag = ref("");
const hoverClass = ref("");
const hoverSize = ref("");

let hoverHandler: ((e: MouseEvent) => void) | null = null;

function attachHoverListener(): void {
  if (hoverHandler || !enabled.value || !devHoverInspector.value) {
    return;
  }
  hoverHandler = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null;
    if (!target || !(target instanceof HTMLElement)) {
      hoverVisible.value = false;
      return;
    }
    const rect = target.getBoundingClientRect();
    hoverX.value = rect.left + rect.width / 2;
    hoverY.value = rect.top - 8;
    hoverTag.value = target.tagName.toLowerCase();
    hoverClass.value = target.className.toString();
    hoverSize.value = `${Math.round(rect.width)} × ${Math.round(rect.height)}`;
    hoverVisible.value = true;
  };
  window.addEventListener("mousemove", hoverHandler, { capture: true });
}

function detachHoverListener(): void {
  if (hoverHandler) {
    window.removeEventListener("mousemove", hoverHandler, { capture: true });
    hoverHandler = null;
  }
  hoverVisible.value = false;
}

watch(
  () => (enabled.value && devHoverInspector.value) as boolean,
  (active) => {
    if (active) {
      attachHoverListener();
    } else {
      detachHoverListener();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (enabled.value && devHoverInspector.value) {
    attachHoverListener();
  }
});

onBeforeUnmount(() => {
  detachHoverListener();
});
</script>

<template>
  <div v-if="enabled" class="lite-dev-overlay" aria-hidden="true">
    <!-- 顶部/侧边标尺 -->
    <div v-if="devRuler" class="lite-dev-ruler lite-dev-ruler-top" />
    <div v-if="devRuler" class="lite-dev-ruler lite-dev-ruler-left" />

    <!-- 网格覆盖层 -->
    <div v-if="devGrid" class="lite-dev-grid" />

    <!-- 悬停元素信息 -->
    <div
      v-if="devHoverInspector && hoverVisible"
      class="lite-dev-hover-info"
      :style="{ left: `${hoverX}px`, top: `${hoverY}px` }"
    >
      <div class="lite-dev-hover-tag">
        {{ hoverTag }}
        <span v-if="hoverClass" class="lite-dev-hover-class">
          .{{ hoverClass }}
        </span>
      </div>
      <div class="lite-dev-hover-size">
        {{ hoverSize }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.lite-dev-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
}

.lite-dev-ruler {
  position: absolute;
  background-image: linear-gradient(
      to right,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      rgba(255, 255, 255, 0.08) 1px,
      transparent 1px
    );
  background-size: 10px 1px, 1px 10px;
  background-color: rgba(15, 23, 42, 0.75);
  color: rgba(248, 250, 252, 0.8);
  font-size: 10px;
}

.lite-dev-ruler-top {
  top: 0;
  left: 0;
  right: 0;
  height: 18px;
}

.lite-dev-ruler-left {
  top: 0;
  left: 0;
  bottom: 0;
  width: 18px;
}

.lite-dev-grid {
  position: absolute;
  inset: 0;
  background-image: linear-gradient(
      to right,
      rgba(56, 189, 248, 0.18) 1px,
      transparent 1px
    ),
    linear-gradient(
      to bottom,
      rgba(56, 189, 248, 0.18) 1px,
      transparent 1px
    );
  background-size: 40px 40px;
  mix-blend-mode: screen;
  opacity: 0.75;
}

.lite-dev-hover-info {
  position: fixed;
  transform: translate(-50%, -100%);
  padding: 4px 8px;
  border-radius: 6px;
  background: rgba(15, 23, 42, 0.94);
  color: #e5e7eb;
  font-size: 11px;
  line-height: 1.4;
  white-space: nowrap;
  box-shadow:
    0 8px 16px rgba(15, 23, 42, 0.6),
    0 0 0 1px rgba(148, 163, 184, 0.4);
}

.lite-dev-hover-tag {
  font-weight: 600;
}

.lite-dev-hover-class {
  margin-left: 4px;
  color: #a5b4fc;
}

.lite-dev-hover-size {
  margin-top: 2px;
  color: #94a3b8;
}
</style>


