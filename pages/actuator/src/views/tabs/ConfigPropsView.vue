<!--
  配置属性（`/actuator/configprops`）

  按 {@code @ConfigurationProperties} 前缀分组展开成「前缀 / 属性 / 值」三列：
  前缀是定位配置类的锚点，把它并进属性名会让长列表失去分层。

  表格走 2A 底盘：前缀钉在左边，行高跟全页密度档走，分页贴底。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤前缀 / 属性 / 值…"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    :error-kind="errorKind"
    density
    auto-refresh
    :updated-at="updatedAt"
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
      />
      <ActTablePager v-model:page="page" v-model:page-size="pageSize" :total="total" />
    </div>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorConfigPropsView">
/**
 * 配置属性页签。
 *
 * <p>值一律按字符串展示：配置项的值可能是布尔 / 数字 / 列表，但这一页的用途是
 * 「确认生效值」，保留原始文本比按类型渲染更接近 application.yml 里写的东西。</p>
 */
import { computed, watch } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import TabShell from "../TabShell.vue";
import ActTablePager from "../ActTablePager.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import { actuatorTableSize, useActuatorPager } from "../useActuatorTable";

const { data, loading, error, errorKind, keyword, updatedAt, reload, hit } = useActuatorPanel("configprops");

interface ConfigRow {
  ctx: string;
  prefix: string;
  key: string;
  value: string;
}

const rows = computed<ConfigRow[]>(() => {
  const contexts = (data.value?.contexts as Record<string, unknown> | undefined) ?? {};
  const out: ConfigRow[] = [];
  Object.entries(contexts).forEach(([ctx, context]) => {
    const beans = (context as { beans?: Record<string, { properties?: Record<string, { value?: unknown }> }> } | null)?.beans;
    Object.entries(beans ?? {}).forEach(([prefix, bean]) => {
      Object.entries(bean?.properties ?? {}).forEach(([key, property]) => {
        out.push({ ctx, prefix, key, value: String(property?.value ?? "") });
      });
    });
  });
  return out.filter((row) => hit(row.prefix, row.key, row.value));
});

const { page, pageSize, total, pagedRows, resetPage } = useActuatorPager(rows);
watch(keyword, resetPage);

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => pagedRows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "prefix", label: "前缀", minWidth: 240, fixed: "left", showOverflowTooltip: true },
  { prop: "key", label: "属性", minWidth: 260, showOverflowTooltip: true },
  { prop: "value", label: "值", minWidth: 300, showOverflowTooltip: true },
];
</script>
