<script setup lang="ts">
/**
 * 慢查询面板（可内嵌于页签或弹窗）。
 *
 * <p>数据来自后端 SPI {@code SlowQueryManager}：MySQL 走
 * {@code performance_schema.events_statements_summary_by_digest}（失败退 {@code mysql.slow_log}），
 * 因此这里是「同类语句按摘要聚合后」的统计，不是逐条慢日志。</p>
 *
 * <p>阈值由后端决定（不传 {@code minAvgMs} 时按 {@code DEFAULT_SLOW_MS} = 1ms 过滤）：
 * performance_schema 里绝大多数是 0.0x ms 的短语句，下限取 0 会把真正要看的慢语句淹没。</p>
 *
 * @author CH
 * @since 4.0.0.44
 */
import { onMounted, ref, watch } from "vue";
import ReButton from "@repo/ui/re-button";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
import { fetchDbSlowQueries, type DbSlowQueryRow } from "../../api";

const props = withDefaults(
  defineProps<{
    /**
     * 数据源 ID。
     *
     * <p>{@code 0} 是<b>合法值</b>（后端解析为默认主数据源），只有 {@code undefined}
     * 才算缺少 ID。理由同 {@code DbProcessPanel}：早先用 {@code !props.datasourceId}
     * 判断，默认主数据源下会一直显示「缺少数据源 ID」。</p>
     */
    datasourceId?: number;
    /**
     * 表格高度。
     *
     * <p>给具体值（如 {@code 420px}）时表格定高，用于弹窗；传空串时交给 ReTable
     * 自适应填满父容器剩余高度，用于控制台页签（父链已有确定高度）。</p>
     */
    tableHeight?: string;
  }>(),
  { datasourceId: undefined, tableHeight: "420px" },
);

/** 是否支持慢查询分析（后端 SPI 判定） */
const supported = ref(true);
const messageText = ref("");
const loading = ref(false);
const rows = ref<DbSlowQueryRow[]>([]);

/** 慢查询列定义 */
const columns: ReTableColumn[] = [
  { prop: "digest", label: "语句（摘要）", minWidth: 320 },
  { prop: "avgMs", label: "平均耗时(ms)", width: 120, align: "right" },
  { prop: "maxMs", label: "最大耗时(ms)", width: 120, align: "right" },
  { prop: "calls", label: "次数", width: 90, align: "right" },
  { prop: "lastAt", label: "最近执行", width: 190, slot: "col-last", align: "center" },
];

/** 加载慢查询 */
const load = async () => {
  if (props.datasourceId === undefined) {
    supported.value = false;
    messageText.value = "缺少数据源 ID，无法查看慢查询";
    rows.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await fetchDbSlowQueries(props.datasourceId);
    supported.value = !!result.supported;
    messageText.value = result.message ?? "";
    rows.value = result.rows ?? [];
  } catch (e) {
    supported.value = false;
    messageText.value = String((e as Error)?.message ?? e);
    rows.value = [];
  } finally {
    loading.value = false;
  }
};

onMounted(load);
watch(() => props.datasourceId, () => void load());

defineExpose({ reload: load });
</script>

<template>
  <div class="dbs">
    <div class="dbs-bar">
      <ReButton
        layout="square"
        icon="Refresh"
        tip="刷新"
        data-testid="dbs-refresh"
        :loading="loading"
        @click="load"
      />
      <span class="dbs-count">共 {{ rows.length }} 条（按平均耗时降序）</span>
    </div>

    <p v-if="!supported" class="dbs-error">
      {{ messageText || "该数据库内核不支持慢查询分析" }}
    </p>
    <template v-else>
      <p v-if="messageText" class="dbs-warn">{{ messageText }}</p>
      <ReTable
        :data="rows"
        :columns="columns"
        :loading="loading"
        row-key="digest"
        size="mini"
        stripe
        border
        :layout-table="tableHeight ? { height: tableHeight } : undefined"
      >
        <template #col-last="{ row }">
          <span v-if="row.lastAt" class="dbs-mono">{{ row.lastAt }}</span>
          <span v-else class="dbs-muted">—</span>
        </template>      </ReTable>
    </template>
  </div>
</template>

<style scoped>
.dbs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  /* 同 .dbp：弹窗下 100% 退化为 auto，页签里吃满父级高度 */
  height: 100%;
}

/* tableHeight 传空串时表格自适应：剩余高度全部给表格，body 内部滚动 */
.dbs > .re-table {
  flex: 1 1 auto;
  min-height: 0;
}

.dbs-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.dbs-count {
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}

.dbs-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

.dbs-warn {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-color-warning-dark-2);
  background: var(--el-color-warning-light-9);
}

.dbs-mono {
  font-family: var(--el-font-family-mono, ui-monospace, monospace);
  /* 时间戳是定宽短串，折成两行只会把行高从 28 撑到 50 —— 加宽列并禁止换行 */
  white-space: nowrap;
}

.dbs-muted {
  color: var(--el-text-color-placeholder);
}
</style>
