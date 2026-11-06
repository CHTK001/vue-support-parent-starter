<!--
  ApmGate —— APM 可用性门禁。

  需求 2.1：前端必须先请求 APM 接口确认「本服务器注册的 APM 是否开启」，
  并且要能接受「一个都没有」这种结果。做法是把这段判断收在一个壳里：

    <ApmGate v-slot="{ status }">  页面真正的内容  </ApmGate>

  · 取不到状态（后端不可达）→ 显式错误 + 重试，不假装「无 APM」；
  · present=false（装了但连不上 / 压根没装）→ 降级视图，列出全部候选引擎与原因，
    让运维一眼区分「没装」和「装了连不上」，而不是看到一片空白；
  · present=true → 渲染页面，并把 status 透传给页面（引擎名、能力清单等）。

  状态取用共享单例（useApmStatus）——9 个页面同时挂载也只发一次 /status。
-->
<template>
  <!-- 首次加载：骨架 -->
  <div v-if="loading && !status" class="apm-page">
    <ReSkeleton :rows="6" animated />
  </div>

  <!-- 前端配置里关闭了 APM 模块：与「后端没有 APM」是两件事。
       必须排在「取不到状态」之前 —— 关闭时本来就不探活，不会有 status。 -->
  <div v-else-if="!moduleEnabled" class="apm-absent">
    <h3 class="apm-absent__title">APM 模块已在前端关闭</h3>
    <p class="apm-absent__msg">
      app.yaml 的 <span class="apm-mono">apmConfig.enable</span> 为 false。
      后端是否装了 APM 与此无关，改回 true 即可恢复展示。
    </p>
  </div>

  <!-- 后端不可达：和「没有 APM」是两件事，措辞必须区分 -->
  <div v-else-if="!status" class="apm-absent">
    <h3 class="apm-absent__title">无法获取 APM 状态</h3>
    <p class="apm-absent__msg">{{ error || "APM 状态接口没有返回数据" }}</p>
    <ReButton icon="Refresh" :loading="loading" @click="refresh">重试</ReButton>
  </div>

  <!-- 后端模块被关掉：不是「没装」，也不是故障，要给出明确的打开入口 -->
  <div v-else-if="status && status.enabled === false" class="apm-absent">
    <h3 class="apm-absent__title">APM 模块已关闭</h3>
    <p class="apm-absent__msg">{{ status.message || "后端 plugin.apm.enabled=false。" }}</p>
    <p class="apm-absent__hint">这不是故障：开关在「APM 设置」页签里，打开后本页立即恢复。</p>
    <ReButton icon="Setting" type="primary" @click="openSettings">去 APM 设置</ReButton>
  </div>

  <!-- 没有 APM：降级视图（正常业务状态，不是错误） -->
  <div v-else-if="!status.present" class="apm-absent">
    <h3 class="apm-absent__title">当前服务器未接入 APM</h3>
    <p class="apm-absent__msg">{{ status.message || "未探测到可用的 APM 引擎" }}</p>

    <div v-if="status.candidates?.length" class="apm-absent__candidates">
      <ReTable
        :data="candidateRows"
        :columns="candidateColumns"
        engine="element"
        :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        :settings="{ border: false }"
        empty-text="没有探测到任何 APM 引擎"
        table-id="apm-absent-candidates"
      >
        <template #col-available="{ row }">
          <ReTag :type="row.available ? 'success' : 'info'" round>
            {{ row.available ? "可用" : "不可用" }}
          </ReTag>
        </template>
        <template #col-message="{ row }">
          <span class="apm-muted">{{ row.message || "—" }}</span>
        </template>
      </ReTable>
    </div>

    <p class="apm-absent__hint">
      接入方式：引入 <span class="apm-mono">spring-support-apm-skywalking-starter</span> 或
      <span class="apm-mono">spring-support-apm-hotspot-starter</span>，
      并在配置里打开 <span class="apm-mono">plugin.apm.enabled=true</span>。
    </p>
    <ReButton icon="Refresh" :loading="loading" @click="refresh">重新探测</ReButton>
  </div>

  <!-- 可用：渲染页面本体 -->
  <div v-else class="apm-page">
    <div v-if="showEngine" class="apm-engine">
      <span class="apm-engine__chip">引擎 {{ status.name }}</span>
      <span class="apm-engine__chip">版本 {{ status.version }}</span>
      <span class="apm-engine__chip">模式 {{ status.mode }}</span>
      <span v-if="status.endpoint" class="apm-engine__chip">{{ status.endpoint }}</span>
      <span class="apm-muted">能力 {{ status.capabilities.length }} 项</span>
    </div>
    <p v-if="expectedMismatch" class="apm-engine apm-warn">
      配置里预期的引擎是 {{ expectedEngine }}，实际探测到 {{ status.name }} —— 以实际探测为准。
    </p>
    <slot :status="status" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import ReButton from "@repo/ui/re-button";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import { useApmStatus } from "../composables/useApmStatus";
import { apmConfig } from "../config";
import { openApmTab } from "../tabs";

withDefaults(
  defineProps<{
    /** 是否在内容顶部显示引擎信息条 */
    showEngine?: boolean;
  }>(),
  { showEngine: false },
);

const { status, loading, error, ensure, refresh } = useApmStatus();

/** 切到「APM 设置」页签（工作台内切页，不重建路由） */
function openSettings(): void {
  openApmTab("settings");
}

onMounted(() => {
  // 前端配置已关闭时不必探活：省一次请求，也避免「关了还在打后端」的困惑
  if (!apmConfig().enable) {
    return;
  }
  ensure();
});

/**
 * 配置里声明的预期引擎。
 *
 * <p>用途只是「对不上时提醒一句」：真正用哪个引擎永远由后端探测决定 ——
 * 让前端配置去覆盖探测结论，会导致「页面显示 SkyWalking，实际读的是 hotspot」这种
 * 比没有提示更糟的状态。</p>
 */
const expectedEngine = computed(() => apmConfig().engine);

/** 前端是否启用 APM 模块（app.yaml 的 apmConfig.enable） */
const moduleEnabled = computed(() => apmConfig().enable);

const expectedMismatch = computed(() => {
  const expected = expectedEngine.value;
  if (!expected || !status.value?.name) {
    return false;
  }
  return expected !== String(status.value.name).toLowerCase();
});

/** 候选引擎行（表格要求 Record 形状） */
const candidateRows = computed(() => (status.value?.candidates ?? []) as unknown as Record<string, unknown>[]);

const candidateColumns: ReTableColumn[] = [
  { prop: "name", label: "引擎", width: 140 },
  { prop: "available", label: "状态", width: 90, align: "center", slot: "available" },
  { prop: "mode", label: "模式", width: 100 },
  { prop: "version", label: "版本", width: 120 },
  { prop: "endpoint", label: "后端地址", minWidth: 160 },
  { prop: "message", label: "说明", minWidth: 220, slot: "message" },
];
</script>

<style scoped>
.apm-absent__candidates {
  width: 100%;
  max-width: 860px;
}

.apm-absent__hint {
  margin: 0;
  font-size: 12px;
  text-align: center;
  color: var(--text-tertiary, var(--el-text-color-secondary));
}
</style>
