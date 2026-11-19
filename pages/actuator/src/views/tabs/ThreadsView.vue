<!--
  线程快照（`/actuator/threaddump`）

  不铺整份 stackTrace：几十个线程 × 几十帧会把页面变成不可读的日志墙。
  这里只留「谁在阻塞、阻塞了几次、多久、栈顶在哪」；完整栈放在行点击抽屉里，
  数据就是本次快照自带的 stackTrace，不再回接口取。

  表格走 2A 底盘：线程名钉在左边，行高跟全页密度档走，分页贴底。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤线程 / 状态 / 栈顶…"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    density
    auto-refresh
    :updated-at="updatedAt"
    @refresh="reload"
  >
    <template #tools>
      <div class="act-chips" role="group" aria-label="按线程状态筛选">
        <button type="button" class="act-chip" :class="{ 'is-active': stateFilter === '' }" @click="setStateFilter('')">
          全部<span class="act-chip__count">{{ rowsAll.length }}</span>
        </button>
        <button
          v-for="opt in stateOptions"
          :key="opt.state"
          type="button"
          class="act-chip"
          :class="{ 'is-active': stateFilter === opt.state }"
          @click="setStateFilter(opt.state)"
        >
          {{ opt.state }}<span class="act-chip__count">{{ opt.count }}</span>
        </button>
      </div>
      <ElButton size="small" @click="exportCsv">导出 CSV</ElButton>
    </template>
    <div class="act-table-wrap">
      <ReTable
        :data="tableRows"
        :columns="columns"
        engine="element"
        :size="actuatorTableSize"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ fill: true }"
        class="act-table"
        @row-click="openStack"
      >
        <template #col-state="{ row }">
          <ReTag :type="threadStateTypeOfRow(row)" effect="light" round>{{ row.state }}</ReTag>
        </template>
        <template #col-daemon="{ row }">{{ row.daemon ? "是" : "否" }}</template>
        <template #col-blockedCount="{ row }">{{ blockedText(row) }}</template>
        <template #col-waitedCount="{ row }">{{ waitedText(row) }}</template>
      </ReTable>
      <ActTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <ElDrawer v-model="stackVisible" :title="stackRow ? `线程栈 · ${stackRow.name}` : '线程栈'" size="560px" class="act-stack-drawer">
      <div v-if="stackRow" class="act-stack">
        <div class="act-stack__meta">
          <ReTag :type="threadStateType(stackRow.state)" effect="light" round>{{ stackRow.state }}</ReTag>
          <span>守护：{{ stackRow.daemon ? "是" : "否" }}</span>
          <span>阻塞：{{ blockedText(stackRow) }}</span>
          <span>等待：{{ waitedText(stackRow) }}</span>
        </div>
        <div class="act-stack__ops">
          <ElButton size="small" :disabled="!stackRow.stack.length" @click="copyStack">复制全部栈帧</ElButton>
        </div>
        <ol v-if="stackRow.stack.length" class="act-stack__frames">
          <li v-for="(frame, index) in stackRow.stack" :key="index" class="act-stack__frame">
            <span class="act-stack__idx">{{ index + 1 }}</span>
            <span class="act-stack__cls">{{ frame }}</span>
          </li>
        </ol>
        <div v-else class="act-stack__empty">该线程没有 Java 栈帧（可能是外部原生线程）。</div>
      </div>
    </ElDrawer>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorThreadsView">
/**
 * 线程快照页签。
 *
 * <p>ReTable 的插槽 row 是宽类型 {@code Record<string, unknown>}，所以「状态取配色」
 * 「次数拼文案」都在 script 里收窄，不在模板里堆 {@code as any}。</p>
 */
import { computed, ref, watch } from "vue";
import { ElButton, ElDrawer, ElMessage } from "element-plus";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import TabShell from "../TabShell.vue";
import ActTablePager from "../ActTablePager.vue";
import { csvStamp, exportRowsToCsv } from "../csvExport";
import { useActuatorPanel } from "../useActuatorPanel";
import { actuatorTableSize, useActuatorPager } from "../useActuatorTable";

const { data, loading, error, keyword, updatedAt, reload, hit } = useActuatorPanel("threaddump");

interface ThreadRow {
  name: string;
  state: string;
  daemon: boolean;
  blockedCount: number;
  blockedTime: number;
  waitedCount: number;
  waitedTime: number;
  top: string;
  /** 完整栈帧（行点击抽屉用；与表格行同一引用，不额外发请求） */
  stack: string[];
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
  stackTrace?: { className?: string; methodName?: string; fileName?: string; lineNumber?: number }[];
}

/** 一帧栈的可读文本：`类.方法 (文件:行号)`，缺文件时只给行号 */
function frameText(el: { className?: string; methodName?: string; fileName?: string; lineNumber?: number } | undefined): string {
  if (!el) return "";
  const cls = el.className ?? "";
  const method = el.methodName ? `.${el.methodName}` : "";
  const at = el.lineNumber != null ? `(${el.fileName ?? ""}${el.fileName ? ":" : ""}${el.lineNumber})` : "";
  return cls + method + (at ? ` ${at}` : "");
}

/** 全量行（只做映射，不过滤）：状态 chips 的计数也来自这里 */
const rowsAll = computed<ThreadRow[]>(() => {
  const threads = (data.value?.threads as RawThread[] | undefined) ?? [];
  return threads.map((thread) => {
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
      stack: stack.map((el) => frameText(el)),
    };
  });
});

/* ---------- 快捷状态筛选：查死锁时点 BLOCKED 直达，不用输关键字 ---------- */

/** 选中的状态（空串 = 全部；再点一次取消） */
const stateFilter = ref("");

/** 按数量倒序的状态选项（快照里没出现的状态不摆出来） */
const stateOptions = computed<{ state: string; count: number }[]>(() => {
  const counts = new Map<string, number>();
  rowsAll.value.forEach((row) => counts.set(row.state, (counts.get(row.state) ?? 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([state, count]) => ({ state, count }));
});

const rows = computed<ThreadRow[]>(() =>
  rowsAll.value
    .filter((row) => !stateFilter.value || row.state === stateFilter.value)
    .filter((row) => hit(row.name, row.state, row.top)),
);

/** 点已选中的 chip = 取消筛选（回到全部） */
function setStateFilter(state: string): void {
  stateFilter.value = stateFilter.value === state ? "" : state;
}

/** 导出当前过滤结果（全量，非当前页） */
function exportCsv(): void {
  exportRowsToCsv(
    `actuator-threads-${csvStamp()}.csv`,
    ["线程", "状态", "守护", "阻塞", "等待", "栈顶"],
    rows.value.map((row) => [row.name, row.state, row.daemon ? "是" : "否", blockedText(row), waitedText(row), row.top]),
  );
  ElMessage.success(`已导出 ${rows.value.length} 行`);
}

const { page, pageSize, total, pagedRows, resetPage } = useActuatorPager(rows);
watch(keyword, resetPage);
watch(stateFilter, resetPage);

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "name", label: "线程", minWidth: 240, fixed: "left", showOverflowTooltip: true },
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

/** 阻塞列：`N次/Mms` 文案（表格宽行与抽屉行共用） */
function blockedText(row: Record<string, unknown> | ThreadRow): string {
  const count = Number(row.blockedCount ?? 0);
  return count ? `${count}次/${Number(row.blockedTime ?? 0)}ms` : "-";
}

/** 等待列：`N次/Mms` 文案（表格宽行与抽屉行共用） */
function waitedText(row: Record<string, unknown> | ThreadRow): string {
  const count = Number(row.waitedCount ?? 0);
  return count ? `${count}次/${Number(row.waitedTime ?? 0)}ms` : "-";
}

/* ---------- 完整栈抽屉 ---------- */

const stackVisible = ref(false);
const stackRow = ref<ThreadRow | null>(null);

/** 行点击：展示该线程的完整调用栈（数据来自本次快照，不再发请求） */
function openStack(row: Record<string, unknown>): void {
  stackRow.value = row as unknown as ThreadRow;
  stackVisible.value = true;
}

/** 复制完整栈：优先 Clipboard API，非安全上下文回落到隐藏 textarea */
async function copyStack(): Promise<void> {
  const row = stackRow.value;
  if (!row) return;
  const text = `${row.name} [${row.state}]\n` + row.stack.map((frame, index) => `${index + 1}. ${frame}`).join("\n");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    ElMessage.success("已复制完整栈");
  } catch {
    ElMessage.error("复制失败，请手动选择栈帧复制");
  }
}
</script>
