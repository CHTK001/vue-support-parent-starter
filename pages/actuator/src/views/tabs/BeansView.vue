<!--
  Bean 列表（`/actuator/beans`）

  纯展示表：排障时用来确认「某个 Bean 到底有没有被装配进来、是什么类型、来自哪个 jar」。
  不做作用域筛选 —— 关键字过滤已经能覆盖绝大多数「找某个 Bean」的场景。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤 Bean 名称 / 类型…"
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
    />
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorBeansView">
/**
 * Bean 列表页签。
 *
 * <p>按上下文分组收集：多上下文（父子容器）时同名 Bean 可能各有一份，
 * 丢掉 {@code ctx} 就会看到两条一模一样的行。</p>
 */
import { computed } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";

const { data, loading, error, keyword, reload, hit } = useActuatorPanel("beans");

interface BeanRow {
  ctx: string;
  name: string;
  type: string;
  scope: string;
  resource: string;
}

const rows = computed<BeanRow[]>(() => {
  const contexts = (data.value?.contexts as Record<string, unknown> | undefined) ?? {};
  const out: BeanRow[] = [];
  Object.entries(contexts).forEach(([ctx, context]) => {
    const beans = (context as { beans?: Record<string, { type?: unknown; scope?: unknown; resource?: unknown }> } | null)?.beans;
    Object.entries(beans ?? {}).forEach(([name, bean]) => {
      out.push({
        ctx,
        name,
        type: String(bean?.type ?? ""),
        scope: String(bean?.scope ?? ""),
        resource: String(bean?.resource ?? ""),
      });
    });
  });
  return out.filter((row) => hit(row.name, row.type));
});

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => rows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "name", label: "Bean 名称", minWidth: 240, showOverflowTooltip: true },
  { prop: "type", label: "类型", minWidth: 320, showOverflowTooltip: true },
  { prop: "scope", label: "作用域", width: 110, align: "center" },
  { prop: "resource", label: "来源", minWidth: 200, showOverflowTooltip: true },
];
</script>
