<script setup lang="ts">
/**
 * 代理（反向代理服务器） —— 管理 http-proxy / tcp-proxy 协议节点
 * 后端端点：/ms/monitor/server/proxies（过滤 requiresBackend 的节点）
 * 启停复用现有 startServerNode / stopServerNode 接口。
 * @author CH
 * @since 4.0.0
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  fetchProxyServers, startServerNode, stopServerNode,
  type ServerNodeView,
} from "../monitorApi";

/** 代理节点列表 */
const list = ref<ServerNodeView[]>([]);
/** 加载中 */
const loading = ref(false);

/** 表格列定义 */
const columns = [
  { prop: "name", label: "名称", width: 180 },
  { prop: "protocol", label: "协议", width: 110 },
  { prop: "listen", label: "监听地址", width: 150, slot: "listen" },
  { prop: "backend", label: "后端地址", width: 160, slot: "backend" },
  { prop: "status", label: "运行状态", width: 100, slot: "status" },
  { prop: "actions", label: "操作", width: 120, fixed: "right", slot: "actions" },
];

/**
 * 监听地址 host:port
 * @param row 节点
 */
function listenAddr(row: ServerNodeView): string {
  const host = row.host ?? "0.0.0.0";
  const port = row.port ?? "";
  return port === "" ? host : `${host}:${port}`;
}

/**
 * 后端地址（取自 config.backendHost / backendPort）
 * @param row 节点
 */
function backendAddr(row: ServerNodeView): string {
  const c = row.config ?? {};
  const bh = c["backendHost"] as string | undefined;
  const bp = c["backendPort"] as string | number | undefined;
  if (!bh && bp === undefined) return "—";
  return `${bh ?? ""}${bp !== undefined ? ":" + bp : ""}`;
}

/**
 * 状态样式类
 * @param s 状态值
 */
function statusClass(s?: string): string {
  if (s === "RUNNING") return "status-running";
  if (s === "ERROR") return "status-error";
  return "status-stopped";
}

/**
 * 状态文案
 * @param s 状态值
 */
function statusText(s?: string): string {
  if (s === "RUNNING") return "运行中";
  if (s === "ERROR") return "错误";
  return "已停止";
}

/**
 * 启动节点
 * @param row 节点
 */
async function doStart(row: ServerNodeView) {
  try {
    await startServerNode(row.id!);
    ElMessage.success("已启动");
    loadList();
  } catch (e: any) {
    ElMessage.error(`启动失败：${e?.message ?? e}`);
  }
}

/**
 * 停止节点
 * @param row 节点
 */
async function doStop(row: ServerNodeView) {
  try {
    await stopServerNode(row.id!);
    ElMessage.success("已停止");
    loadList();
  } catch (e: any) {
    ElMessage.error(`停止失败：${e?.message ?? e}`);
  }
}

/**
 * 加载代理节点列表
 */
async function loadList() {
  loading.value = true;
  try {
    list.value = (await fetchProxyServers()) ?? [];
  } catch (e: any) {
    ElMessage.error(`加载失败：${e?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <div class="px proxy-server-page">
    <ReSectionHead description="反向代理节点（http-proxy / tcp-proxy），支持启停管理">
      <template #title>代理（反向代理服务器）</template>
      <template #actions>
        <ReButton icon="RefreshRight" :show-text="true" size="small" :loading="loading" @click="loadList">
          刷新
        </ReButton>
      </template>
    </ReSectionHead>

    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">反向代理节点</span></template>
      <ReEmpty v-if="!list.length && !loading" description="暂无反向代理节点" :image-size="80" style="padding: 24px 0" />
      <ReTable
        v-else
        :data="list"
        :columns="columns"
        :loading="loading"
        size="small"
        stripe
        table-id="proxy-server-list"
      >
        <template #col-listen="{ row }">
          <span class="mono">{{ listenAddr(row) }}</span>
        </template>
        <template #col-backend="{ row }">
          <span class="mono">{{ backendAddr(row) }}</span>
        </template>
        <template #col-status="{ row }">
          <span :class="['status-badge', statusClass(row.status)]">{{ statusText(row.status) }}</span>
        </template>
        <template #col-actions="{ row }">
          <div class="op-cell">
            <ReButton icon="Play" layout="square" size="small" type="success" title="启动" :disabled="row.status === 'RUNNING'" @click="doStart(row)" />
            <ReButton icon="Pause" layout="square" size="small" type="warning" title="停止" :disabled="row.status !== 'RUNNING'" @click="doStop(row)" />
          </div>
        </template>
      </ReTable>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.px { display: flex; flex-direction: column; gap: 14px; }
.mono { font-family: monospace; font-size: 12px; }
.op-cell { display: flex; gap: 4px; }
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}
.status-running { background: rgba(34, 197, 94, 0.15); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); }
.status-stopped { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }
.status-error { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
</style>
