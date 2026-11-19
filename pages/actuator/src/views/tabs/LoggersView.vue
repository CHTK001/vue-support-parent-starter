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
    density
    @refresh="reload"
  >
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
import { ElMessage, ElOption, ElSelect } from "element-plus";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import TabShell from "../TabShell.vue";
import ActTablePager from "../ActTablePager.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import { actuatorTableSize, useActuatorPager } from "../useActuatorTable";
import { setActuatorLogger } from "../../api/actuatorCardApi";

const { data, loading, error, keyword, reload, hit } = useActuatorPanel("loggers");

/** 服务端支持的级别 + 「继承」（提交时转成 null） */
const levels = computed<string[]>(() => ["INHERITED", ...((data.value?.levels as string[] | undefined) ?? [])]);

interface LoggerRow {
  name: string;
  configured: string;
  effective: string;
}

const rows = computed<LoggerRow[]>(() => {
  const loggers = (data.value?.loggers as Record<string, { configuredLevel?: string; effectiveLevel?: string }> | undefined) ?? {};
  return Object.entries(loggers)
    .map(([name, value]) => ({
      name,
      configured: value?.configuredLevel ?? "",
      effective: String(value?.effectiveLevel ?? "-"),
    }))
    .filter((row) => hit(row.name, row.effective))
    .sort((a, b) => a.name.localeCompare(b.name));
});

/* 前端分页（过滤条件变化时回到第 1 页，翻页范围仍是全量） */
const { page, pageSize, total, pagedRows, resetPage } = useActuatorPager(rows);
watch(keyword, resetPage);

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "name", label: "Logger", minWidth: 320, fixed: "left", showOverflowTooltip: true },
  { prop: "effective", label: "生效级别", width: 120, align: "center" },
  { prop: "configured", label: "配置级别（可修改）", width: 200, align: "center", slot: "configured" },
];

/** 行里的当前配置级别（未配置过时显示「继承」） */
function levelOf(row: Record<string, unknown>): string {
  return String(row.configured || "INHERITED");
}

/** 下拉框提交：先收窄行类型，再按名字提交 */
function changeLoggerLevelOfRow(row: Record<string, unknown>, level: string): void {
  void changeLoggerLevel(String(row.name ?? ""), level);
}

/** 正在提交的 logger 名（提交期间禁用该行下拉框，避免连点发出冲突写入） */
const saving = ref("");

async function changeLoggerLevel(name: string, level: string): Promise<void> {
  if (!name) return;
  saving.value = name;
  try {
    await setActuatorLogger(name, level);
    ElMessage.success(`已将「${name}」级别设为 ${level === "INHERITED" ? "继承" : level}`);
    await reload(true);
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "修改日志级别失败");
    await reload(true);
  } finally {
    saving.value = "";
  }
}
</script>
