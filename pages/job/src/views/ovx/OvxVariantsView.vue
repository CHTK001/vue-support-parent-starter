<!--
  [临时] 调度概览设计探索容器 —— 仅供本轮方案对比，选定后整目录删除。

  职责：只做装配与取数（复用真实接口与真实字段），把同一份视图模型交给 5 个候选方案。
  方案组件不取数、不写死数据，只负责「怎么摆」。
-->
<template>
  <div class="ovx">
    <div v-loading="loading" class="ovx__stage">
      <component :is="current.component" :data="data"/>
    </div>

    <!-- 切换器：Query 参数 + 数字键 + 点击 -->
    <div class="ovx__switch" role="tablist" aria-label="设计稿切换">
      <button
        v-for="(item, index) in variants"
        :key="item.key"
        type="button"
        role="tab"
        class="ovx__switch-btn"
        :class="{ 'is-active': item.key === active }"
        :aria-selected="item.key === active"
        @click="pick(item.key)"
      >
        <b>{{ index + 1 }}</b>
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useOvxData } from "./useOvxData";

defineOptions({ name: "OvxVariantsView" });

const variants = [
  { key: "beat", label: "节拍", component: defineAsyncComponent(() => import("./variants/Beat.vue")) },
  { key: "board", label: "值班台", component: defineAsyncComponent(() => import("./variants/Board.vue")) },
  { key: "ledger", label: "交班报告", component: defineAsyncComponent(() => import("./variants/Ledger.vue")) },
  { key: "matrix", label: "矩阵", component: defineAsyncComponent(() => import("./variants/Matrix.vue")) },
  { key: "flow", label: "流转", component: defineAsyncComponent(() => import("./variants/Flow.vue")) },
] as const;

const route = useRoute();
const router = useRouter();
const active = ref<string>(String(route.query.ov || "beat"));
const current = computed(() => variants.find(item => item.key === active.value) ?? variants[0]);

function pick(key: string): void {
  active.value = key;
}

watch(active, (key) => {
  void router.replace({ query: { ...route.query, ov: key } });
});

function onKey(event: KeyboardEvent): void {
  const index = Number(event.key);
  if (index >= 1 && index <= variants.length) {
    active.value = variants[index - 1].key;
  }
}

onMounted(() => window.addEventListener("keydown", onKey));
onUnmounted(() => window.removeEventListener("keydown", onKey));

const { data, loading } = useOvxData();
</script>

<style scoped>
.ovx {
  position: relative;
  min-height: 100%;
}

.ovx__stage {
  min-height: 400px;
}

.ovx__switch {
  position: fixed;
  left: 50%;
  bottom: 18px;
  z-index: 30;
  display: flex;
  gap: 2px;
  padding: 4px;
  transform: translateX(-50%);
  border: 1px solid var(--border-default);
  border-radius: 999px;
  background: color-mix(in srgb, var(--bg-container) 92%, transparent);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
}

.ovx__switch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: 0;
  border-radius: 999px;
  background: none;
  color: var(--text-secondary);
  font: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: color 160ms var(--ease-out), background 160ms var(--ease-out);
}

.ovx__switch-btn b {
  font-size: 11px;
  color: var(--text-tertiary);
}

.ovx__switch-btn.is-active {
  color: var(--text-inverse);
  background: var(--brand-500);
}

.ovx__switch-btn.is-active b {
  color: color-mix(in srgb, var(--text-inverse) 75%, transparent);
}
</style>
