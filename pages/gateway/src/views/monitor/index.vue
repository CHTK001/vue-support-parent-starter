<!--
  会话监控 —— 实时显示当前所有 SSH/桌面/会议 会话的状态与指标
  设计风格：Vercel / Linear · 低饱和度 · 表格化 · 状态点
-->
<template>
  <ReCard class="monitor-page">
    <div class="monitor-head mb-4">
      <div class="monitor-head__title text-[18px] font-semibold text-el-text-primary">会话监控</div>
      <div class="monitor-head__desc mt-1 text-[12px] text-el-text-secondary">
        实时查看活跃会话的连接状态、协议、目标
      </div>
    </div>

    <ReTable
      :data="rows"
      :columns="columns"
      row-key="sessionId"
      :pagination="false"
      empty-text="暂无活跃会话"
      table-id="session-monitor"
    >
      <template #protocol="{ row }">
        <ReTag size="small" :type="protocolTagType(row.protocol)" effect="plain">{{ row.protocol }}</ReTag>
      </template>
      <template #state="{ row }">
        <span class="state-dot" :class="`state-dot--${row.state.toLowerCase()}`" />
        {{ stateText(row.state) }}
      </template>
      <template #createdAt="{ row }">
        {{ formatTime(row.createdAt) }}
      </template>
      <template #duration="{ row }">
        {{ formatDuration(row.createdAt) }}
      </template>
    </ReTable>
  </ReCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRemoteControl, type ConnectionState, type RemoteProtocol } from "../../composables/useRemoteControl";
import type { ReTableColumn } from "@repo/ui/re-table";

const remote = useRemoteControl();

interface Row {
  sessionId: string;
  targetId: string;
  protocol: RemoteProtocol;
  state: ConnectionState;
  createdAt: number;
  duration: number;
}

const rows = computed<Row[]>(() =>
  Array.from(remote.sessions.values()).map((s) => ({
    sessionId: s.sessionId,
    targetId: s.targetId || "(空)",
    protocol: s.protocol,
    state: s.state,
    createdAt: s.createdAt,
    duration: Date.now() - s.createdAt,
  })),
);

const columns: ReTableColumn[] = [
  { prop: "sessionId", label: "会话 ID", minWidth: 220 },
  { prop: "targetId", label: "目标", minWidth: 160 },
  { prop: "protocol", label: "协议", width: 120, slot: "protocol" },
  { prop: "state", label: "状态", width: 120, slot: "state" },
  { prop: "createdAt", label: "开始时间", width: 180, slot: "createdAt" },
  { prop: "duration", label: "持续时长", width: 120, slot: "duration" },
];

function stateText(state: ConnectionState): string {
  switch (state) {
    case "connected":
      return "已连接";
    case "connecting":
      return "连接中";
    case "error":
      return "错误";
    default:
      return "未连接";
  }
}

function protocolTagType(p: RemoteProtocol): "info" | "warning" | "success" | "danger" {
  if (p === "SSH") return "info";
  if (p === "DESKTOP") return "warning";
  if (p === "CONFERENCE") return "success";
  return "danger";
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleString();
}

function formatDuration(start: number): string {
  const ms = Date.now() - start;
  if (ms < 60_000) return `${Math.floor(ms / 1000)} 秒`;
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)} 分`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)} 时`;
  return `${Math.floor(ms / 86_400_000)} 天`;
}
</script>

<style scoped>
.monitor-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.state-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
  background: var(--el-text-color-placeholder);
}

.state-dot--connected {
  background: var(--el-color-success);
}

.state-dot--connecting {
  background: var(--el-color-warning);
}

.state-dot--error {
  background: var(--el-color-danger);
}
</style>
