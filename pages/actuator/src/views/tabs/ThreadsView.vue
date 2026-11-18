<!--
  线程快照（`/actuator/threaddump`）

  不铺整份 stackTrace：几十个线程 × 几十帧会把页面变成不可读的日志墙。
  这里只留「谁在阻塞、阻塞了几次、多久、栈顶在哪」，需要完整栈时再回接口取。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤线程 / 状态 / 栈顶…"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    @refresh="reload"
  >
    <ReTable
      :data="tableRows"
      :columns="columns"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :settings="{ border: false }"
      :layout-table="{ height: 440 }"
      class="act-table"
    >
      <template #col-state="{ row }">
        <ReTag :type="threadStateTypeOfRow(row)" effect="light" round>{{ row.state }}</ReTag>
      </template>
      <template #col-daemon="{ row }">{{ row.daemon ? "是" : "否" }}</template>
      <template #col-blockedCount="{ row }">{{ blockedText(row) }}</template>
      <template #col-waitedCount="{ row }">{{ waitedText(row) }}</template>
    </ReTable>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorThreadsView">
/**
 * 线程快照页签。
 *
 * <p>ReTable 的插槽 row 是宽类型 {@code Record<string, unknown>}，所以「状态取配色」
 * 「次数拼文案」都在 script 里收窄，不在模板里堆 {@code as any}。</p>
 */
import { computed } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";

const { data, loading, error, keyword, reload, hit } = useActuatorPanel("threaddump");

interface ThreadRow {
  name: string;
  state: string;
  daemon: boolean;
  blockedCount: number;
  blockedTime: number;
  waitedCount: number;
  waitedTime: number;
  top: string;
}

/** Actuator 原始线程结构（只取本页要用的字段） */
interface RawThread {
  threadName?: string;
  threadState?: string;
  daemon?: boolean;
  blockedCount?: number;
  blockedTime?: number;
  waitedCount?: number;
  waitedTime?: number;
  stackTrace?: { className?: string; methodName?: string }[];
}

const rows = computed<ThreadRow[]>(() => {
  const threads = (data.value?.threads as RawThread[] | undefined) ?? [];
  return threads
    .map((thread) => {
      const stack = thread?.stackTrace ?? [];
      return {
        name: String(thread?.threadName ?? "-"),
        state: String(thread?.threadState ?? "-"),
        daemon: thread?.daemon === true,
        blockedCount: Number(thread?.blockedCount ?? 0),
        blockedTime: Number(thread?.blockedTime ?? 0),
        waitedCount: Number(thread?.waitedCount ?? 0),
        waitedTime: Number(thread?.waitedTime ?? 0),
        top: (stack[0]?.className ?? "") + (stack[0]?.methodName ? "." + stack[0].methodName : ""),
      };
    })
    .filter((row) => hit(row.name, row.state, row.top));
});

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => rows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "name", label: "线程", minWidth: 240, showOverflowTooltip: true },
  { prop: "state", label: "状态", width: 120, align: "center", slot: "state" },
  { prop: "daemon", label: "守护", width: 70, align: "center", slot: "daemon" },
  { prop: "blockedCount", label: "阻塞", width: 120, align: "center", slot: "blockedCount" },
  { prop: "waitedCount", label: "等待", width: 120, align: "center", slot: "waitedCount" },
  { prop: "top", label: "栈顶", minWidth: 320, showOverflowTooltip: true },
];

/** 线程状态 → 标签配色 */
function threadStateType(state: string): "success" | "warning" | "danger" | "info" {
  if (state === "RUNNABLE") return "success";
  if (state === "BLOCKED") return "danger";
  if (state === "WAITING" || state === "TIMED_WAITING") return "warning";
  return "info";
}

/** 状态列：宽 row → 字符串状态再取配色 */
function threadStateTypeOfRow(row: Record<string, unknown>): "success" | "warning" | "danger" | "info" {
  return threadStateType(String(row.state ?? "-"));
}

/** 阻塞列：`N次/Mms` 文案 */
function blockedText(row: Record<string, unknown>): string {
  const count = Number(row.blockedCount ?? 0);
  return count ? `${count}次/${Number(row.blockedTime ?? 0)}ms` : "-";
}

/** 等待列：`N次/Mms` 文案 */
function waitedText(row: Record<string, unknown>): string {
  const count = Number(row.waitedCount ?? 0);
  return count ? `${count}次/${Number(row.waitedTime ?? 0)}ms` : "-";
}
</script>
