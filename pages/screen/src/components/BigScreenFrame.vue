<!--
  BigScreenFrame —— 大屏舞台适配器

  <p>把拼装好的完整 HTML 文档（three-screen-lab 产物）以 iframe srcdoc 承载。
  three-screen-lab 的 VizLabRuntime.mountStage 按 iframe 的 innerWidth/innerHeight
  等比缩放舞台，所以本组件只需让 iframe 铺满一个固定宽高比的容器，
  内部缩放由屏幕自身的 runtime 完成。</p>

  @since 4.0.0.52
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    /** 已拼装的完整 HTML 文档文本；null/undefined 表示尚未就绪 */
    doc?: string | null;
    /** 舞台设计宽度（px），决定容器宽高比 */
    width: number;
    /** 舞台设计高度（px） */
    height: number;
    /** 文档仍在异步拼装 */
    loading?: boolean;
  }>(),
  { doc: null, loading: false },
);

const emit = defineEmits<{ (e: "loaded"): void }>();

/** srcdoc 每次更换都要重新等 load 事件 */
const rendered = ref(false);
watch(
  () => props.doc,
  () => {
    rendered.value = false;
  },
);

const stageStyle = computed(() => ({ aspectRatio: `${props.width} / ${props.height}` }));

function onLoad(): void {
  rendered.value = true;
  emit("loaded");
}
</script>

<template>
  <div class="bs-frame" :style="stageStyle">
    <iframe
      v-if="doc"
      class="bs-frame__stage"
      title="可视化大屏舞台"
      :srcdoc="doc"
      @load="onLoad"
    />
    <div v-if="loading || !doc || !rendered" class="bs-frame__veil">
      <span class="bs-frame__orbit" aria-hidden="true" />
      <span class="bs-frame__hint">正在装载大屏…</span>
    </div>
  </div>
</template>

<style scoped>
.bs-frame {
  position: relative;
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  background: #070b14;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(2, 6, 23, 0.55);
}

.bs-frame__stage {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  background: #070b14;
}

.bs-frame__veil {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  background: #070b14;
  color: #94a3b8;
  font-size: 0.85rem;
  letter-spacing: 0.08em;
}

.bs-frame__orbit {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  border: 2px solid rgba(56, 189, 248, 0.25);
  border-top-color: #38bdf8;
  animation: bs-frame-spin 0.9s linear infinite;
}

@keyframes bs-frame-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
