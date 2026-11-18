<!--
  请求映射（`/actuator/mappings`）

  Actuator 只给「这条路由挂在哪个处理器上」，请求次数 / 耗时 / 访问 IP 来自
  `/v2/server/api/stats`。两个数据源按「方法 + 路径」对齐，对不上的路由保留在表里、
  统计列显示为弱化横线 —— 从没被调用过的接口同样是有价值的信息。
-->
<template>
  <TabShell
    v-model="keyword"
    placeholder="过滤映射条件 / 处理器…"
    :count-text="`共 ${rows.length} 项`"
    :loading="loading"
    :error="error"
    @refresh="refresh"
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
      <template #col-count="{ row }">
        <span :class="{ 'act-muted': !row.count }">{{ row.count }}</span>
      </template>
      <template #col-avgMs="{ row }">
        <span :class="{ 'act-muted': !row.count }">
          <ReTime v-if="row.count" :value="costMs(row.avgMs)" format="duration" placeholder="-" />
          <template v-else>-</template>
        </span>
      </template>
      <template #col-ips="{ row }">
        <span :class="{ 'act-muted': !row.ips }">{{ row.ips || "-" }}</span>
      </template>
    </ReTable>
  </TabShell>
</template>

<script setup lang="ts" name="ActuatorMappingsView">
/**
 * 请求映射页签。
 *
 * <p>统计接口只在拿到映射之后取一次：映射刷新（含切回页签的静默刷新）会更新
 * {@code updatedAt}，这里监听这个时间戳再取统计，保证两侧永远同一轮。</p>
 */
import { computed, ref, watch } from "vue";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import ReTime from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import TabShell from "../TabShell.vue";
import { useActuatorPanel } from "../useActuatorPanel";
import { getRestfulApiStats, matchRestfulStat, type RestfulApiStats } from "../../api/actuatorCardApi";

const { data, loading, error, keyword, updatedAt, reload, hit } = useActuatorPanel("mappings");

/** RESTful 统计（拉失败时保持 undefined：统计列显示弱化横线，不影响映射本身） */
const stats = ref<RestfulApiStats | undefined>(undefined);

async function loadStats(): Promise<void> {
  try {
    stats.value = await getRestfulApiStats();
  } catch {
    // 统计是旁证数据：拿不到就不显示次数，不要把整页打成「加载失败」
    stats.value = undefined;
  }
}

/** 手动刷新 = 映射 + 统计一起重取 */
async function refresh(): Promise<void> {
  await Promise.all([reload(), loadStats()]);
}

// 映射数据每成功拉一次（首次加载 / 手动刷新 / 切回页签）就同步一次统计
watch(updatedAt, (ts) => {
  if (ts) void loadStats();
});

interface MappingRow {
  ctx: string;
  handler: string;
  predicate: string;
  count: number;
  avgMs: number;
  ips: string;
}

const rows = computed<MappingRow[]>(() => {
  const contexts = (data.value?.contexts as Record<string, unknown> | undefined) ?? {};
  const out: MappingRow[] = [];
  Object.entries(contexts).forEach(([ctx, context]) => {
    const dispatcher = (context as { mappings?: { dispatcherServlets?: Record<string, unknown[]> } } | null)?.mappings
      ?.dispatcherServlets;
    Object.values(dispatcher ?? {}).forEach((list) => {
      (list ?? []).forEach((item) => {
        const mapping = item as { predicate?: unknown; handler?: unknown };
        const predicate = String(mapping?.predicate ?? "");
        // 统计是纯函数匹配：这里只是查表，不发请求
        const stat = matchRestfulStat(predicate, stats.value);
        out.push({
          ctx,
          handler: String(mapping?.handler ?? "-"),
          predicate,
          count: stat?.count ?? 0,
          avgMs: stat?.avgMs ?? 0,
          ips: stat?.ips?.map((entry) => entry.ip).filter(Boolean).join("、") ?? "",
        });
      });
    });
  });
  return out.filter((row) => hit(row.handler, row.predicate));
});

/** ReTable 的行类型是宽类型；一次性转换，避免模板里到处 as any */
const tableRows = computed(() => rows.value as unknown as Record<string, unknown>[]);

const columns: ReTableColumn[] = [
  { prop: "predicate", label: "映射条件", minWidth: 320, showOverflowTooltip: true },
  { prop: "handler", label: "处理器", minWidth: 220, showOverflowTooltip: true },
  { prop: "count", label: "请求次数", width: 110, align: "right", sortable: true, slot: "count" },
  { prop: "avgMs", label: "平均延迟", width: 110, align: "right", sortable: true, slot: "avgMs" },
  { prop: "ips", label: "访问 IP", minWidth: 150, showOverflowTooltip: true, sortable: true, slot: "ips" },
  { prop: "ctx", label: "上下文", width: 110, align: "center", sortable: true },
];
</script>
