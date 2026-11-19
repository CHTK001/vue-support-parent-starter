<!--
  自动配置（`/actuator/conditions`）

  positive / negative 两类合并成一张表：排障要回答的是「我配的东西为什么没生效」，
  未命中的条件（negativeMatches）才是答案所在，单独藏一栏会让人先去翻源码。

  表格走 2A 底盘：结果列钉在左边，行高跟全页密度档走，分页贴底。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤自动配置 / 条件说明…"
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
        <template #col-result="{ row }">
          <ReTag :type="row.result === 'positive' ? 'success' : 'info'" effect="light" round>
            {{ row.result === "positive" ? "命中" : "未命中" }}
          </ReTag>
        </template>
      </ReTable>
      <ActTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorConditionsView">
/**
 * 自动配置页签。
 *
 * <p>条件说明字段在不同 Spring Boot 版本里可能叫 {@code message} 或 {@code condition}，
 * 两个都取，取不到就留空，不因结构差异丢掉整行。</p>
 */
import { computed, watch } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import TabShell from "../TabShell.vue";
import ActTablePager from "../ActTablePager.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import { actuatorTableSize, useActuatorPager } from "../useActuatorTable";

const { data, loading, error, keyword, reload, hit } = useActuatorPanel("conditions");

interface ConditionRow {
  ctx: string;
  result: string;
  name: string;
  message: string;
}

const rows = computed<ConditionRow[]>(() => {
  const contexts = (data.value?.contexts as Record<string, unknown> | undefined) ?? {};
  const out: ConditionRow[] = [];
  const push = (ctx: string, list: unknown, result: string) => {
    Object.entries((list as Record<string, { message?: unknown; condition?: unknown }> | undefined) ?? {}).forEach(
      ([name, value]) => {
        out.push({
          ctx,
          result,
          name,
          message: String(value?.message ?? value?.condition ?? ""),
        });
      },
    );
  };
  Object.entries(contexts).forEach(([ctx, context]) => {
    const entry = context as { positiveMatches?: unknown; negativeMatches?: unknown } | null;
    push(ctx, entry?.positiveMatches, "positive");
    push(ctx, entry?.negativeMatches, "negative");
  });
  return out.filter((row) => hit(row.name, row.message));
});

const { page, pageSize, total, pagedRows, resetPage } = useActuatorPager(rows);
watch(keyword, resetPage);

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "result", label: "结果", width: 110, align: "center", fixed: "left", slot: "result" },
  { prop: "name", label: "自动配置", minWidth: 300, showOverflowTooltip: true },
  { prop: "message", label: "条件说明", minWidth: 360, showOverflowTooltip: true },
];
</script>
