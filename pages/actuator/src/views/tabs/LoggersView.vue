<!--
  日志级别（`/actuator/loggers`）

  这是 11 个页签里唯一有写操作的一页：每行的「配置级别」是一个下拉框，选中即提交
  （{@code POST /actuator/loggers/{name}}），成功后重取清单。因此分页放在前端：
  Actuator 一次返回全部 logger，后端不提供分页参数。

  表格走 2A 底盘：首列（Logger 名）钉在左边，行高跟全页密度档走，分页贴底。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤 logger / 生效级别…"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    :error-kind="errorKind"
    density
    @refresh="reload"
  >
    <template #tools>
      <label class="act__tool">
        <ElSwitch v-model="onlyConfigured" size="small" />
        只看已配置
      </label>
      <ElButton size="small" :disabled="!changedLevels.size" :loading="reverting" @click="revertLevels">
        一键还原{{ changedLevels.size ? `（${changedLevels.size}）` : "" }}
      </ElButton>
      <ElButton size="small" @click="logVisible = true">
        变更记录{{ changeLog.length ? `（${changeLog.length}）` : "" }}
      </ElButton>
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
      >
        <template #col-effective="{ row }">
          <span class="act-lvl">
            <i class="act-lvl__dot" :class="`is-${levelClassOf(row)}`" />
            {{ row.effective }}
          </span>
        </template>
        <template #col-configured="{ row }">
          <ElSelect
            :model-value="levelOf(row)"
            :disabled="saving === String(row.name ?? '')"
            style="width: 160px"
            @change="(v: unknown) => changeLoggerLevelOfRow(row, String(v))"
          >
            <ElOption
              v-for="level in levels"
              :key="level"
              :label="level === 'INHERITED' ? '继承(INHERITED)' : level"
              :value="level"
            />
          </ElSelect>
        </template>
      </ReTable>
      <ActTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>

    <ElDrawer v-model="logVisible" title="日志级别变更记录" size="480px" class="act-changelog-drawer">
      <div class="act-changelog__ops">
        <ElButton size="small" :disabled="!changeLog.length" @click="clearChangeLog">清空记录</ElButton>
        <span class="act-changelog__hint">仅存本机浏览器 · 最近 100 条</span>
      </div>
      <div v-if="!changeLog.length" class="act__empty">暂无变更记录</div>
      <ol v-else class="act-changelog">
        <li v-for="(entry, index) in changeLog" :key="`${entry.time}-${index}`" class="act-changelog__row">
          <span class="act-changelog__time">{{ formatLogTime(entry.time) }}</span>
          <span class="act-changelog__name" :title="entry.name">{{ entry.name }}</span>
          <span class="act-changelog__delta" :class="{ 'is-revert': entry.revert }">
            {{ entry.revert ? `还原为 ${levelText(entry.to)}` : `${levelText(entry.from)} → ${levelText(entry.to)}` }}
          </span>
        </li>
      </ol>
    </ElDrawer>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorLoggersView">
/**
 * 日志级别页签。
 *
 * <p>写操作的失败路径必须把清单重新拉一遍：级别提交成功但本地没刷新时，界面显示的
 * 是「用户以为改成了」的旧值，比报错更误导。</p>
 */
import { computed, ref, watch } from "vue";
import { ElButton, ElDrawer, ElMessage, ElMessageBox, ElOption, ElSelect, ElSwitch } from "element-plus";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import TabShell from "../TabShell.vue";
import ActTablePager from "../ActTablePager.vue";
import { csvStamp, exportRowsToCsv } from "../csvExport";
import { useActuatorPanel } from "../useActuatorPanel";
import { actuatorTableSize, useActuatorPager } from "../useActuatorTable";
import { setActuatorLogger } from "../../api/actuatorCardApi";

const { data, loading, error, errorKind, keyword, reload, hit } = useActuatorPanel("loggers");

/** 服务端支持的级别 + 「继承」（提交时转成 null） */
const levels = computed<string[]>(() => ["INHERITED", ...((data.value?.levels as string[] | undefined) ?? [])]);

interface LoggerRow {
  name: string;
  configured: string;
  effective: string;
}

/** 只看显式配置过的 logger：全量近 3000 条里绝大多数是继承，排障时只想看改过的那几十个 */
const onlyConfigured = ref(false);

const rows = computed<LoggerRow[]>(() => {
  const loggers = (data.value?.loggers as Record<string, { configuredLevel?: string; effectiveLevel?: string }> | undefined) ?? {};
  return Object.entries(loggers)
    .map(([name, value]) => ({
      name,
      configured: value?.configuredLevel ?? "",
      effective: String(value?.effectiveLevel ?? "-"),
    }))
    .filter((row) => hit(row.name, row.effective))
    .filter((row) => !onlyConfigured.value || row.configured !== "")
    .sort((a, b) => a.name.localeCompare(b.name));
});

/* 前端分页（过滤条件变化时回到第 1 页，翻页范围仍是全量） */
const { page, pageSize, total, pagedRows, resetPage } = useActuatorPager(rows);
watch(keyword, resetPage);
watch(onlyConfigured, resetPage);

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "name", label: "Logger", minWidth: 320, fixed: "left", showOverflowTooltip: true },
  { prop: "effective", label: "生效级别", width: 120, align: "center", slot: "effective" },
  { prop: "configured", label: "配置级别（可修改）", width: 200, align: "center", slot: "configured" },
];

/** 行里的当前配置级别（未配置过时显示「继承」） */
function levelOf(row: Record<string, unknown>): string {
  return String(row.configured || "INHERITED");
}

/** 生效级别 → 色点修饰符（ERROR 红 / WARN 黄 / DEBUG·TRACE 灰 / INFO 绿） */
function levelClassOf(row: Record<string, unknown>): string {
  const level = String(row.effective ?? "").toUpperCase();
  if (level === "ERROR") return "error";
  if (level === "WARN") return "warning";
  if (level === "DEBUG" || level === "TRACE") return "debug";
  if (level === "INFO") return "info";
  return "other";
}

/** 下拉框提交：先收窄行类型，再按名字提交（带上改动前的级别，供还原台账记账） */
function changeLoggerLevelOfRow(row: Record<string, unknown>, level: string): void {
  void changeLoggerLevel(String(row.name ?? ""), level, String(row.configured || "INHERITED"));
}

/** 正在提交的 logger 名（提交期间禁用该行下拉框，避免连点发出冲突写入） */
const saving = ref("");

/* ---------- 会话级改动台账与一键还原 ---------- */

/** 本次会话改过的日志级别：logger → 改动前的级别（INHERITED = 原本继承默认） */
const changedLevels = ref(new Map<string, string>());

/** 正在批量还原 */
const reverting = ref(false);

/** 导出当前过滤结果（全量，非当前页） */
function exportCsv(): void {
  exportRowsToCsv(
    `actuator-loggers-${csvStamp()}.csv`,
    ["Logger", "配置级别", "生效级别"],
    rows.value.map((row) => [row.name, row.configured || "INHERITED", row.effective]),
  );
  ElMessage.success(`已导出 ${rows.value.length} 行`);
}

/** 把本次会话改过的 logger 批量恢复为改动前的级别（写操作，需确认） */
async function revertLevels(): Promise<void> {
  const entries = [...changedLevels.value.entries()];
  if (!entries.length || reverting.value) return;
  try {
    await ElMessageBox.confirm(`将把 ${entries.length} 个 logger 恢复为本次修改前的级别，确认执行？`, "一键还原", {
      confirmButtonText: "还原",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return; // 用户取消
  }
  reverting.value = true;
  const failed: string[] = [];
  for (const [name, level] of entries) {
    try {
      // 还原前的实际配置值（该 logger 本会话可能被改过不止一次）
      const before = String(
        (data.value?.loggers as Record<string, { configuredLevel?: string }> | undefined)?.[name]?.configuredLevel ||
          "INHERITED",
      );
      await setActuatorLogger(name, level);
      changedLevels.value.delete(name);
      appendChangeLog({ time: Date.now(), name, from: before, to: level, revert: true });
    } catch {
      failed.push(name);
    }
  }
  reverting.value = false;
  await reload(true);
  if (failed.length) {
    ElMessage.error(`${failed.length} 个 logger 还原失败，已保留在还原列表`);
  } else {
    ElMessage.success(`已还原 ${entries.length} 个 logger 的级别`);
  }
}

/** 级别显示文案：INHERITED 显示为「继承」 */
function levelText(level: string): string {
  return level === "INHERITED" ? "继承" : level;
}

/**
 * 修改日志级别。
 *
 * <p>这是全页签唯一的常驻写入口，误触成本高（改错级别轻则刷屏、重则淹掉故障日志），
 * 所以把「选中即提交」改成「确认后提交」：确认浮层写清 logger 与从什么改成什么；
 * 用户取消时静默重取一次，把下拉框显示弹回当前生效配置。</p>
 */
async function changeLoggerLevel(name: string, level: string, previous: string): Promise<void> {
  if (!name || level === previous) return;
  try {
    await ElMessageBox.confirm(
      `将把 logger「${name}」的日志级别从「${levelText(previous)}」改为「${levelText(level)}」。`,
      "修改日志级别",
      { confirmButtonText: "确认修改", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    void reload(true); // 用户取消：回填当前配置值
    return;
  }
  saving.value = name;
  try {
    await setActuatorLogger(name, level);
    // 台账只记第一次改动前的值；改回台账里的原值则出账
    const original = changedLevels.value.get(name);
    if (original !== undefined) {
      if (level === original) changedLevels.value.delete(name);
    } else if (level !== previous) {
      changedLevels.value.set(name, previous);
    }
    appendChangeLog({ time: Date.now(), name, from: previous, to: level });
    ElMessage.success(`已将「${name}」级别设为 ${levelText(level)}`);
    await reload(true);
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "修改日志级别失败");
    await reload(true);
  } finally {
    saving.value = "";
  }
}

/* ---------- 变更记录（localStorage 留痕，跨会话可查） ---------- */

/** 单条变更记录 */
interface LoggerChangeEntry {
  /** 发生时间（ms） */
  time: number;
  /** logger 名 */
  name: string;
  /** 改动前级别（INHERITED = 继承） */
  from: string;
  /** 改动后级别 */
  to: string;
  /** 是否批量还原动作 */
  revert?: boolean;
}

/** localStorage 键：变更记录只存本机，不上传 */
const CHANGE_LOG_KEY = "actuator.logger.changes";

/** 最多保留条数：排障回看足够，又不至于撑爆 localStorage */
const CHANGE_LOG_MAX = 100;

/** 变更记录（新在前） */
const changeLog = ref<LoggerChangeEntry[]>(readChangeLog());

/** 变更记录抽屉 */
const logVisible = ref(false);

function readChangeLog(): LoggerChangeEntry[] {
  try {
    const raw = localStorage.getItem(CHANGE_LOG_KEY);
    const list = raw ? (JSON.parse(raw) as LoggerChangeEntry[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

/** 追加一条记录并落盘；存储被禁用（隐私模式 / 配额）时静默放弃，不影响写操作本身 */
function appendChangeLog(entry: LoggerChangeEntry): void {
  const list = [entry, ...changeLog.value].slice(0, CHANGE_LOG_MAX);
  changeLog.value = list;
  try {
    localStorage.setItem(CHANGE_LOG_KEY, JSON.stringify(list));
  } catch {
    // 记录是辅助台账，存不下就算了
  }
}

/** 清空变更记录（删除类操作，需确认；确认后不执行删除以外的写操作） */
async function clearChangeLog(): Promise<void> {
  if (!changeLog.value.length) return;
  try {
    await ElMessageBox.confirm("清空后无法恢复，确认清空全部变更记录？", "清空变更记录", {
      confirmButtonText: "清空",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return; // 用户取消
  }
  changeLog.value = [];
  try {
    localStorage.removeItem(CHANGE_LOG_KEY);
  } catch {
    // 忽略存储异常
  }
  ElMessage.success("已清空变更记录");
}

/** 记录时间 → 本地可读时间 */
function formatLogTime(time: number): string {
  const date = new Date(time);
  return Number.isNaN(date.getTime()) ? String(time) : date.toLocaleString("zh-CN", { hour12: false });
}
</script>
