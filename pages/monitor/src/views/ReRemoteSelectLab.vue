<script setup lang="ts">
/**
 * 远程数据组件能力验收台（隐藏路由，showLink:false）
 *
 * <p>验证「远程组件异步化 + 按钮动画化」这一组改动：</p>
 * <ul>
 *   <li>ReSelect（远程 loader）：刷新时 loading 先上屏、动画图标在转、界面不卡；</li>
 *   <li>ReRemoteSelect：同步按钮用动画刷新图标、加载中整体旋转；</li>
 *   <li>ReSearch / ReFilter：搜索 / 重置按钮用动画图标；</li>
 *   <li>ReTree：远程根节点 reload 时先让帧。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref } from "vue";

import ReSelect from "@repo/ui/re-select";
import ReRemoteSelect from "@repo/ui/re-remote-select";
import ReSearch from "@repo/ui/re-search";
import ReFilter from "@repo/ui/re-filter";
import ReTree from "@repo/ui/re-tree";
import type { ReOption } from "@repo/ui/re-select";

defineOptions({ name: "ReRemoteSelectLab" });

/** 模拟接口耗时（ms） */
const latency = ref(600);
/** 最近一次加载时间 */
const lastLoadedAt = ref(0);
/** 长任务统计 */
const longTasks = ref<Array<{ start: number; duration: number }>>([]);

function observeLongTasks() {
  if (typeof PerformanceObserver === "undefined") return;
  if (!PerformanceObserver.supportedEntryTypes?.includes("longtask")) return;
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      longTasks.value.push({ start: Math.round(entry.startTime), duration: Math.round(entry.duration) });
    }
  });
  observer.observe({ entryTypes: ["longtask"] });
}
observeLongTasks();

/** 造一批选项 */
function makeOptions(count: number): ReOption[] {
  return Array.from({ length: count }, (_, i) => ({
    label: `选项-${i + 1}`,
    value: i + 1,
  }));
}

/** ReSelect 的远程 loader */
async function selectLoader(): Promise<ReOption[]> {
  await new Promise((resolve) => setTimeout(resolve, latency.value));
  return makeOptions(200);
}

/** ReRemoteSelect 的远程 loader */
async function remoteSelectLoader(): Promise<ReOption[]> {
  await new Promise((resolve) => setTimeout(resolve, latency.value));
  return makeOptions(200);
}

/** ReTree 的远程 loader */
async function treeLoader(): Promise<Array<Record<string, unknown>>> {
  await new Promise((resolve) => setTimeout(resolve, latency.value));
  return [
    { id: "1", label: "根节点", children: [{ id: "1-1", label: "子节点 A" }] },
    { id: "2", label: "第二组" },
  ];
}

const selected = ref<string | number>("");
const remoteSelected = ref<string | number>("");
const treeRef = ref<any>(null);

const stats = computed(() => ({
  count: longTasks.value.length,
  max: longTasks.value.reduce((m, t) => Math.max(m, t.duration), 0),
}));

/** 重新加载树 */
async function reloadTree() {
  await treeRef.value?.reload?.();
}
</script>

<template>
  <div class="lab">
    <header class="lab-head">
      <h2>远程组件验收台 · 异步化 + 动画图标</h2>
      <div class="lab-controls">
        <label>接口耗时(ms) <input v-model.number="latency" type="number" min="0" max="5000" step="100" /></label>
        <button type="button" @click="longTasks = []">清空长任务</button>
        <button type="button" @click="reloadTree">重载树</button>
      </div>
      <div class="lab-stats">
        长任务数 <b>{{ stats.count }}</b> · 最长 <b>{{ stats.max }}ms</b>
        · 最近加载 {{ lastLoadedAt ? new Date(lastLoadedAt).toLocaleTimeString() : "-" }}
      </div>
    </header>

    <section class="lab-card">
      <h3>ReSelect（远程 loader）</h3>
      <ReSelect
        v-model="selected"
        :loader="selectLoader"
        placeholder="远程选项"
        filterable
        style="width: 320px"
        @load="lastLoadedAt = Date.now()"
      />
    </section>

    <section class="lab-card">
      <h3>ReRemoteSelect（同步按钮）</h3>
      <ReRemoteSelect
        v-model="remoteSelected"
        :loader="remoteSelectLoader"
        placeholder="远程搜索选择"
        style="width: 320px"
      />
    </section>

    <section class="lab-card">
      <h3>ReSearch（搜索 / 重置按钮）</h3>
      <ReSearch :loading="false" @search="lastLoadedAt = Date.now()" />
    </section>

    <section class="lab-card">
      <h3>ReFilter（远程筛选项）</h3>
      <ReFilter
        :items="[
          { prop: 'kw', label: '关键词', type: 'input' },
          { prop: 'host', label: '主机', type: 'select', loader: selectLoader },
        ]"
      />
    </section>

    <section class="lab-card">
      <h3>ReTree（远程根节点）</h3>
      <ReTree ref="treeRef" :loader="treeLoader" style="width: 320px" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.lab {
  padding: 16px;
}

.lab-head {
  margin-bottom: 12px;

  h2 {
    margin: 0 0 8px;
    font-size: 16px;
  }
}

.lab-controls {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-bottom: 8px;

  label {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    font-size: 13px;
  }

  input {
    width: 90px;
    padding: 4px 6px;
  }
}

.lab-stats {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.lab-card {
  margin-bottom: 16px;
  padding: 12px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;

  h3 {
    margin: 0 0 10px;
    font-size: 14px;
  }
}
</style>
