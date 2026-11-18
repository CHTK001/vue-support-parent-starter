<!--
  定时任务（`/actuator/scheduledtasks`）

  两段式：上半是「可编辑任务」（动态调度注册中心，能改 cron / 启停 / 立即执行），
  下半是「只读任务」（Spring 自己托管的 @Scheduled，Actuator 只读）。
  两段的数据来源不同，混成一张表会让「这行能不能改」变得不可预测。
-->
<template>
  <TabShell
    :searchable="false"
    :count-text="`Actuator 只读任务 ${scheduledRows.length} 个`"
    :loading="loading || managedLoading"
    :error="error"
    @refresh="refresh"
  >
    <div class="act-sched-managed">
      <div class="act-sched-managed__head">
        <span>可编辑任务（改 cron / 启停 / 立即执行）</span>
        <small v-if="managedLoading">加载中…</small>
        <small v-else-if="managedError" class="is-error">{{ managedError }}</small>
        <small v-else>共 {{ managed.length }} 个</small>
      </div>
      <ReTable
        :data="managedRows"
        :columns="managedColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :settings="{ border: false }"
        :layout-table="{ showHeader: true, minHeight: 0 }"
        class="act-table"
      >
        <template #col-cron="{ row }">
          <ReInput
            v-model="row.cron"
            placeholder="如 0 * * * * ?"
            :disabled="managedSaving === row.key"
            @keyup.enter="saveManagedCron(managedTaskOf(row))"
          />
        </template>
        <template #col-enabled="{ row }">
          <ElSwitch
            :model-value="!!row.enabled"
            :loading="managedSaving === row.key"
            @change="(v: string | number | boolean) => toggleManagedTask(managedTaskOf(row), !!v)"
          />
        </template>
        <template #col-lastStatus="{ row }">
          <ReTag
            :type="
              String(row.lastStatus || '').startsWith('FAILED')
                ? 'danger'
                : row.lastStatus === 'SUCCESS'
                  ? 'success'
                  : 'info'
            "
            effect="light"
            round
          >
            {{ row.lastStatus || "-" }}
          </ReTag>
        </template>
        <template #col-action="{ row }">
          <ElButton link type="primary" :disabled="managedSaving === row.key" @click="saveManagedCron(managedTaskOf(row))">
            保存
          </ElButton>
          <ElButton link type="warning" :disabled="managedSaving === row.key" @click="runManagedTask(managedTaskOf(row))">
            执行一次
          </ElButton>
        </template>
      </ReTable>
    </div>

    <div class="act-sched-managed__head">
      <span>Actuator 只读任务（Spring 托管）</span>
      <small>共 {{ scheduledRows.length }} 个</small>
    </div>
    <ReTable
      :data="scheduledTableRows"
      :columns="scheduledColumns"
      engine="element"
      :pagination="false"
      :toolbar="false"
      :settings="{ border: false }"
      :layout-table="{ maxHeight: 260 }"
      class="act-table"
    >
      <template #col-lastStatus="{ row }">
        <ReTag :type="row.lastStatus === 'SUCCESS' ? 'success' : 'info'" effect="light" round>
          {{ row.lastStatus }}
        </ReTag>
      </template>
    </ReTable>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorScheduledTasksView">
/**
 * 定时任务页签。
 *
 * <p>写操作（保存 cron / 启停 / 立即执行）失败后一律重取列表：后端可能已经部分生效，
 * 只弹错误而不刷新会让界面停在一个不存在的状态上。</p>
 */
import { computed, ref, watch } from "vue";
import { ElButton, ElMessage, ElSwitch } from "element-plus";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReInput from "@repo/ui/re-input";
import ReTag from "@repo/ui/re-tag";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import {
  getScheduleTasks,
  runScheduleTask,
  updateScheduleTask,
  type ManagedScheduleTask,
} from "../../api/actuatorCardApi";

const { data, loading, error, updatedAt, reload } = useActuatorPanel("scheduledtasks");

/* ---------- 可编辑任务（动态调度注册中心） ---------- */

const managed = ref<ManagedScheduleTask[]>([]);
const managedLoading = ref(false);
const managedSaving = ref("");
const managedError = ref("");

async function loadManaged(): Promise<void> {
  managedLoading.value = true;
  try {
    managed.value = await getScheduleTasks();
    managedError.value = "";
  } catch (err) {
    managedError.value = (err as Error)?.message ?? "加载定时任务失败";
  } finally {
    managedLoading.value = false;
  }
}

/** 手动刷新 = Actuator 只读清单 + 可编辑清单 */
async function refresh(): Promise<void> {
  await Promise.all([reload(), loadManaged()]);
}

// Actuator 数据每成功拉一次（首次加载 / 刷新 / 切回页签）就同步一次注册中心
watch(updatedAt, (ts) => {
  if (ts) void loadManaged();
});

const managedRows = computed(() => managed.value as unknown as Record<string, unknown>[]);

/** 列插槽里的宽 row → 强类型任务（保存/执行/启停都吃这个类型） */
function managedTaskOf(row: Record<string, unknown>): ManagedScheduleTask {
  return row as unknown as ManagedScheduleTask;
}

async function saveManagedCron(row: ManagedScheduleTask): Promise<void> {
  if (!row.key) return;
  managedSaving.value = row.key;
  try {
    await updateScheduleTask(row.key, { cron: row.cron });
    ElMessage.success(`「${row.label || row.key}」执行周期已更新`);
    await loadManaged();
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "更新 cron 失败");
    await loadManaged();
  } finally {
    managedSaving.value = "";
  }
}

async function toggleManagedTask(row: ManagedScheduleTask, enabled: boolean): Promise<void> {
  if (!row.key) return;
  managedSaving.value = row.key;
  try {
    await updateScheduleTask(row.key, { enabled });
    ElMessage.success(`已${enabled ? "启用" : "停用"}「${row.label || row.key}」`);
    await loadManaged();
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "更新任务状态失败");
    await loadManaged();
  } finally {
    managedSaving.value = "";
  }
}

async function runManagedTask(row: ManagedScheduleTask): Promise<void> {
  if (!row.key) return;
  managedSaving.value = row.key;
  try {
    await runScheduleTask(row.key);
    ElMessage.success(`已触发「${row.label || row.key}」`);
    await loadManaged();
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "触发任务失败");
  } finally {
    managedSaving.value = "";
  }
}

const managedColumns: ReTableColumn[] = [
  { prop: "label", label: "任务", minWidth: 150, showOverflowTooltip: true },
  { prop: "cron", label: "cron 表达式", minWidth: 210, slot: "cron" },
  { prop: "enabled", label: "启用", width: 80, align: "center", slot: "enabled" },
  { prop: "nextTime", label: "下次执行", minWidth: 160, showOverflowTooltip: true },
  { prop: "lastTime", label: "上次执行", minWidth: 160, showOverflowTooltip: true },
  { prop: "lastStatus", label: "上次状态", width: 100, align: "center", slot: "lastStatus" },
  { prop: "action", label: "操作", width: 150, align: "center", fixed: "right", slot: "action" },
];

/* ---------- 只读任务（Actuator scheduledtasks） ---------- */

interface ScheduledRow {
  type: string;
  target: string;
  expr: string;
  next: string;
  last: string;
  lastStatus: string;
}

const scheduledRows = computed<ScheduledRow[]>(() => {
  const source = data.value ?? {};
  const out: ScheduledRow[] = [];
  (["cron", "fixedDelay", "fixedRate", "custom"] as const).forEach((type) => {
    const list = (source[type] as
      | { runnable?: { target?: unknown }; expression?: unknown; interval?: unknown; nextExecution?: { time?: unknown }; lastExecution?: { time?: unknown; status?: unknown } }[]
      | undefined) ?? [];
    list.forEach((task) => {
      out.push({
        type,
        target: String(task?.runnable?.target ?? "-"),
        expr: String(task?.expression ?? task?.interval ?? ""),
        next: String(task?.nextExecution?.time ?? "-"),
        last: String(task?.lastExecution?.time ?? "-"),
        lastStatus: String(task?.lastExecution?.status ?? "-"),
      });
    });
  });
  return out;
});

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const scheduledTableRows = computed(() => scheduledRows.value as unknown as Record<string, unknown>[]);

const scheduledColumns: ReTableColumn[] = [
  { prop: "type", label: "类型", width: 120, align: "center" },
  { prop: "target", label: "任务", minWidth: 300, showOverflowTooltip: true },
  { prop: "expr", label: "表达式 / 间隔", minWidth: 160 },
  { prop: "next", label: "下次执行", minWidth: 220, showOverflowTooltip: true },
  { prop: "last", label: "上次执行", minWidth: 220, showOverflowTooltip: true },
  { prop: "lastStatus", label: "上次状态", width: 110, align: "center", slot: "lastStatus" },
];
</script>
