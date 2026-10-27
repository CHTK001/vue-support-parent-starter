<template>
  <div class="view">
    <!-- 操作条：无标题大卡 -->
    <div class="view-bar">
      <span class="match-hint">
        <ReTag :type="storage && storage.available ? 'success' : 'warning'" round>
          {{ storage ? `存储 ${storage.type}` : "未连接" }}
        </ReTag>
        <template v-if="storage">
          · 引擎{{ storage.engineActive ? "已激活" : "未激活" }}
        </template>
      </span>
      <div class="view-bar__actions">
        <ReButton icon="Refresh" show-text :loading="probing" @click="() => probe()">重新检测</ReButton>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <span>观测接口地址</span>
        <span class="panel-sub">所有页面的数据都从这里取</span>
      </div>

      <div class="setting-row">
        <ReInput
          id="apm-api-base"
          v-model="draftBase"
          placeholder="留空表示与当前页面同源，例如 http://10.0.0.8:19170"
          clearable
          class="grow"
        />
        <ReButton show-text :disabled="saving" @click="save">保存并重连</ReButton>
        <ReButton show-text type="info" :disabled="saving" @click="reset">恢复默认</ReButton>
      </div>

      <p class="setting-hint">
        只填源地址（协议 + 主机 + 端口），不要带 <code>{{ APM_PREFIX }}</code> 前缀 ——
        前缀由页面统一拼接。同源时由平台网关转发，跨域直连需要后端放开 CORS。
      </p>

      <div class="setting-facts">
        <div class="fact">
          <span class="fact-label">当前地址</span>
          <code>{{ displayBase }}</code>
        </div>
        <div class="fact">
          <span class="fact-label">请求前缀</span>
          <code>{{ APM_PREFIX }}</code>
        </div>
        <div class="fact">
          <span class="fact-label">实时通道</span>
          <code>{{ displayWs }}</code>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-head">
        <span>存储状态</span>
        <span class="panel-sub">
          后端 <code>/storage/status</code> 实测：实际生效的存储类型与配置键值
        </span>
      </div>

      <ReSkeleton v-if="probing && !storage" :loading="true" :rows="3" animated />
      <div class="panel-empty" v-else-if="!storage">
        无法连接观测接口<br />请检查上面的地址是否正确，或后端是否已启动
      </div>
      <template v-else>
        <div class="storage-summary">
          <ReTag :type="storage.available ? 'success' : 'info'" round>
            {{ storage.available ? "可用" : "不可用" }}
          </ReTag>
          <span class="mono">类型 {{ storage.type }}</span>
          <span class="muted">引擎{{ storage.engineActive ? "已激活" : "未激活" }}</span>
        </div>
        <ReTable
          :data="configRows"
          :columns="configColumns"
          engine="element"
          :settings="{ border: false }"
          :layout-table="{ minHeight: 0 }"
          class="apm-table"
          empty-text="后端未返回存储配置项"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-key="{ row }">
            <span class="mono">{{ row.key }}</span>
          </template>
          <template #col-value="{ row }">
            <span class="mono muted">{{ row.value || "—" }}</span>
          </template>
        </ReTable>
      </template>
    </div>

    <!-- 运维工具：健康自检 / 诊断包导出 / 数据清理 / 线程转储下载 -->
    <div class="panel">
      <div class="panel-head">
        <span>运维工具</span>
        <span class="panel-sub">排查 / 归档 / 清理，全部走真实观测接口</span>
      </div>

      <div class="ops-grid">
        <button class="ops-card" type="button" :disabled="diagnosing" @click="runHealthCheck">
          <span class="ops-icon">⚕️</span>
          <span class="ops-body">
            <span class="ops-title">健康自检</span>
            <span class="ops-desc">执行后端 /health，输出告警源健康状态</span>
          </span>
          <span class="ops-arrow">→</span>
        </button>

        <button class="ops-card" type="button" :disabled="exporting" @click="exportDiagnostic">
          <span class="ops-icon">📦</span>
          <span class="ops-body">
            <span class="ops-title">导出诊断包</span>
            <span class="ops-desc">agent / JVM / 慢调用 / 错误排行 / SkyWalking 段等一键打包 JSON</span>
          </span>
          <span class="ops-arrow">→</span>
        </button>

        <button class="ops-card" type="button" :disabled="cleaning" @click="runCleanup">
          <span class="ops-icon">🧹</span>
          <span class="ops-body">
            <span class="ops-title">清理过期数据</span>
            <span class="ops-desc">按保留时长删除老记录，释放存储空间</span>
          </span>
          <span class="ops-arrow">→</span>
        </button>

        <button class="ops-card" type="button" :disabled="dumping" @click="downloadThreadDump">
          <span class="ops-icon">🧵</span>
          <span class="ops-body">
            <span class="ops-title">下载线程转储</span>
            <span class="ops-desc">导出全量线程栈文本，供性能分析</span>
          </span>
          <span class="ops-arrow">→</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import ReButton from "@repo/ui/re-button";
import ReTag from "@repo/ui/re-tag";
import ReInput from "@repo/ui/re-input";
import ReSkeleton from "@repo/ui/re-skeleton";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { message } from "@repo/core";
import { APM_PREFIX, getApiBase, resetApiBase, setApiBase, wsUrl } from "../config";
import {
  getHealth,
  getThreadDump,
  cleanup,
  downloadDiagnosticBundle,
  download,
} from "../api/apmApi";

/**
 * 接口设置页：把 `config.ts` 里的运行时地址真正暴露给使用者。
 *
 * <p>地址存在 `localStorage`（键 `hotsport.api-base`），保存后立即重建 axios 实例
 * 并让实时通道重连，无需刷新页面、也无需重新构建。留空 = 同源。</p>
 */

const draftBase = ref(getApiBase());
const storage = ref<ApmStorageStatus | null>(null);
const probing = ref(false);
const saving = ref(false);
const diagnosing = ref(false);
const exporting = ref(false);
const cleaning = ref(false);
const dumping = ref(false);

/** 当前生效地址（空串显示为「同源」） */
const displayBase = computed(() => getApiBase() || "同源（跟随当前页面）");

/** WebSocket 地址，同样受地址设置影响 */
const displayWs = computed(() => wsUrl());

/** 存储配置键值表行：直接展开后端返回的 configured，不做任何填充 */
const configRows = computed(() =>
  Object.entries(storage.value?.configured ?? {}).map(([key, value]) => ({ key, value })),
);

const configColumns: ReTableColumn[] = [
  { prop: "key", label: "配置项", minWidth: 260, slot: "key" },
  { prop: "value", label: "当前值", minWidth: 200, slot: "value" },
];

/**
 * 运维工具 —— 健康自检：调用后端 /health，弹窗展示关键健康指标。
 */
async function runHealthCheck(): Promise<void> {
  diagnosing.value = true;
  try {
    const health = await getHealth();
    message.success(`健康自检完成：${health.health ?? "HEALTHY"}`);
    // 汇总展示：把健康快照里的关键项打印出来
    const lines = Object.entries(health)
      .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
      .join("\n");
    console.info("[Hotsport] 健康自检结果:\n" + lines);
  } catch (error) {
    message.error(`健康自检失败：${(error as Error)?.message || "无法访问 /health"}`);
  } finally {
    diagnosing.value = false;
  }
}

/**
 * 运维工具 —— 导出诊断包：拉取 /diagnostics/bundle 全量真实数据为 JSON 下载。
 */
async function exportDiagnostic(): Promise<void> {
  exporting.value = true;
  try {
    await downloadDiagnosticBundle();
    message.success("诊断包已导出（JSON）");
  } catch (error) {
    message.error(`诊断包导出失败：${(error as Error)?.message || "无法访问 /diagnostics/bundle"}`);
  } finally {
    exporting.value = false;
  }
}

/**
 * 运维工具 —— 清理过期数据：默认保留最近 7 天，可传参覆盖。
 */
async function runCleanup(): Promise<void> {
  cleaning.value = true;
  try {
    // 保留最近 7 天（与后端默认 retention 一致）
    const result = await cleanup(7 * 24 * 60 * 60 * 1000);
    const cleaned = (result as Record<string, unknown>).cleaned;
    message.success(`已清理过期记录：${String(cleaned ?? "0")} 条`);
  } catch (error) {
    message.error(`清理失败：${(error as Error)?.message || "无法访问 /cleanup"}`);
  } finally {
    cleaning.value = false;
  }
}

/**
 * 运维工具 —— 下载线程转储：拉取 /jvm/thread-dump 全量线程栈，导出为文本文件。
 */
async function downloadThreadDump(): Promise<void> {
  dumping.value = true;
  try {
    const threads = await getThreadDump();
    const lines: string[] = [];
    lines.push(`Hotsport JVM 线程转储 @ ${new Date().toISOString()}`);
    lines.push(`线程总数: ${threads.length}`);
    lines.push("=".repeat(72));
    for (const t of threads) {
      lines.push(`"${t.name}" #${t.threadId} state=${t.state} daemon=${t.isDaemon} native=${t.isInNative}`);
      if (t.lockName) lines.push(`  - waiting on: ${t.lockName}${t.lockOwnerName ? ` (owned by: ${t.lockOwnerName})` : ""}`);
      for (const frame of t.stackTrace ?? []) lines.push(`\t${frame}`);
      lines.push("");
    }
    download(
      `hotsport-thread-dump-${new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19)}.txt`,
      lines.join("\n"),
      "text/plain",
    );
    message.success(`线程转储已导出（${threads.length} 个线程）`);
  } catch (error) {
    message.error(`线程转储失败：${(error as Error)?.message || "无法访问 /jvm/thread-dump"}`);
  } finally {
    dumping.value = false;
  }
}

/**
 * 探测后端存储状态：成功后把结果渲染到配置表。
 *
 * @param quiet 为 true 时不弹成功提示（用于页面首次加载）
 */
async function probe(quiet = false): Promise<void> {
  probing.value = true;
  try {
    storage.value = await getStorageStatus();
    if (!quiet) {
      message.success(`连接正常，存储 ${storage.value.type}`);
    }
  } catch (error) {
    storage.value = null;
    if (!quiet) {
      message.error(`连接失败：${(error as Error)?.message || "无法访问观测接口"}`);
    }
  } finally {
    probing.value = false;
  }
}

/** 保存地址：写入本地、重建客户端、重连实时通道，然后重新探测 */
async function save(): Promise<void> {
  const next = draftBase.value.trim();
  if (next && !/^https?:\/\//i.test(next)) {
    message.warning("地址需要以 http:// 或 https:// 开头；留空表示同源");
    return;
  }
  saving.value = true;
  try {
    setApiBase(next);
    draftBase.value = getApiBase();
    resetApiClient();
    await probe(true);
    message.success(`已切换到 ${displayBase.value}`);
  } finally {
    saving.value = false;
  }
}

/** 恢复为构建期默认（同源或 VITE_HOTSPORT_BASE），并重新探测 */
async function reset(): Promise<void> {
  saving.value = true;
  try {
    resetApiBase();
    draftBase.value = getApiBase();
    resetApiClient();
    await probe(true);
    message.success(`已恢复默认：${displayBase.value}`);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  void probe(true);
});
</script>

<script lang="ts">
import type { ApmStorageStatus } from "../api/apmApi";
import { getStorageStatus, resetApiClient } from "../api/apmApi";
</script>

<style scoped>
.setting-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.setting-row .grow {
  flex: 1;
}

.setting-hint {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--apm-muted);
}

.setting-hint code {
  padding: 0 4px;
  border-radius: var(--apm-radius-sm);
  background: var(--apm-panel-raised);
}

.setting-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 28px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--apm-border);
}

.fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.fact-label {
  font-size: 12px;
  color: var(--apm-muted);
}

.fact code {
  font-size: 12px;
  word-break: break-all;
}

/* 存储状态摘要行：可用性徽章 + 类型 + 引擎状态，横排一行 */
.storage-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 12px;
}

/* 运维工具卡片：四宫格，每个动作一个卡片 */
.ops-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.ops-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--apm-border);
  border-radius: var(--apm-radius-md, 10px);
  background: var(--apm-panel-raised);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
  font: inherit;
  color: var(--apm-fg);
}

.ops-card:hover:not(:disabled) {
  border-color: var(--apm-accent);
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.06);
}

.ops-card:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ops-icon {
  font-size: 20px;
  line-height: 1;
  flex-shrink: 0;
}

.ops-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.ops-title {
  font-size: 13px;
  font-weight: 600;
}

.ops-desc {
  font-size: 11px;
  line-height: 1.5;
  color: var(--apm-muted);
}

.ops-arrow {
  flex-shrink: 0;
  color: var(--apm-muted);
  font-size: 14px;
}

</style>
