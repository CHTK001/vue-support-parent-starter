<template>
  <div class="ds-oplog">
    <div class="ds-oplog__bar">
      <ReSelect
        v-model="actionFilter"
        class="ds-oplog__filter"
        placeholder="全部操作"
        :options="actionOptions"
        @update:model-value="reload"
      />
      <span class="ds-oplog__spacer" />
      <ReButton icon="Refresh" :loading="loading" tip="刷新" @click="reload" />
    </div>

    <p v-if="error" class="ds-oplog__error">{{ error }}</p>

    <div class="ds-oplog__table">
      <ReTable
        v-loading="loading"
        :data="rows"
        :columns="columns"
        :pagination="false"
        stripe
        border
        height="100%"
      />
    </div>

    <div v-if="total > 0" class="ds-oplog__pager">
      <span class="ds-oplog__total">共 {{ total }} 条</span>
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="size"
        :total="total"
        :page-sizes="[20, 50, 100]"
        layout="sizes, prev, pager, next"
        background
        @current-change="reload"
        @size-change="onSizeChange"
      />
    </div>

    <div v-else-if="!loading && !error" class="ds-oplog__empty">
      <ReEmpty description="还没有操作记录" :image-size="80" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源操作日志面板。
 *
 * <p><strong>入口按需求先不露出</strong>（见 ScDataSourceView 的
 * {@code OPER_LOG_ENTRY_VISIBLE}），本面板先按可用状态写完并留好开关说明。
 * 数据源切换时重新拉第一页而不是保留当前页：换数据源后当前页码多半已越界，
 * 停在那一页会显示成「这个数据源没有日志」。</p>
 *
 * @author CH
 * @since 4.0.0.43
 */
import { computed, onMounted, ref, toRef, watch } from "vue";
import { ElPagination } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReEmpty from "@repo/ui/re-empty";
import ReSelect from "@repo/ui/re-select";
import ReTable from "@repo/ui/re-table";
import { costMs } from "@repo/utils";
import {
  fetchDatasourceOperLog,
  type DatasourceOperLog,
  type DatasourceOperLogQuery,
} from "../api";
import type { ReTableColumn } from "@repo/ui/re-table";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
}>();

const rows = ref<DatasourceOperLog[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const actionFilter = ref<string>("");
const loading = ref(false);
const error = ref<string | null>(null);

/** 操作码 → 中文名。码在后端、前端也要显示，不能各处各写一份中文 */
const ACTION_LABELS: Record<string, string> = {
  CREATE: "新增数据源",
  UPDATE: "更新数据源",
  DELETE: "删除数据源",
  TEST: "连接测试",
  TUNNEL_QUERY: "查询隧道",
  TUNNEL_SAVE: "保存隧道",
  TUNNEL_DELETE: "删除隧道",
};

/** 后端返回 actionName 时优先用它（新增操作码不必等前端跟上） */
function actionText(code: string | null, name: string | null): string {
  return name || (code ? (ACTION_LABELS[code] ?? code) : "—");
}

/** 时间格式化；解析不了就原样返回，不吞成空串（原样更利于排查） */
function formatTime(time: string): string {
  if (!time) {
    return "—";
  }
  const v = Date.parse(time);
  return Number.isNaN(v) ? time : new Date(v).toLocaleString("zh-CN", { hour12: false });
}

/**
 * 筛选下拉的选项。
 *
 * <p>只列已知操作码而不是把库里出现过的码都拉出来：后者需要先查一次全量日志
 * 才能拿到码集合，而「筛选器本身要先查一次全量数据才能用」是个循环。</p>
 */
const actionOptions = computed(() => [
  { label: "全部操作", value: "" },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ label, value })),
]);

const columns: ReTableColumn[] = [
  {
    prop: "createTime",
    label: "时间",
    width: 165,
    // 后端返回的是 ISO 本地时间（"2026-10-11T09:00:00"），直接显示比
    // 让用户自己换算时区好；换不成时原样返回，不吞成空串
    formatter: row => formatTime(String(row.createTime ?? "")),
  },
  { prop: "action", label: "操作", width: 130, formatter: row => actionText(row.action as string | null, row.actionName as string | null) },
  { prop: "operator", label: "操作人", width: 100 },
  { prop: "clientIp", label: "来源 IP", width: 130 },
  {
    prop: "costMs",
    label: "耗时",
    width: 90,
    align: "right",
    // 没采到耗时就显示 —，不是 0ms：0ms 读起来像「瞬间完成」
    formatter: row => (row.costMs == null ? "—" : String(costMs(Number(row.costMs)))),
  },
  {
    prop: "success",
    label: "结果",
    width: 80,
    align: "center",
    // null 是「未判定」，不能并进「成功」：切面只在抛异常时写 0，
    // 正常路径下它可能根本没填这一列
    formatter: row => {
      const v = row.success;
      return v === 1 ? "成功" : v === 0 ? "失败" : "—";
    },
  },
  { prop: "detail", label: "说明", minWidth: 220, showOverflowTooltip: true },
  { prop: "requestUrl", label: "请求路径", minWidth: 200, showOverflowTooltip: true },
];

const idRef = toRef(props, "datasourceId");

async function reload(): Promise<void> {
  const id = idRef.value;
  if (!id) {
    rows.value = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const query: DatasourceOperLogQuery = {
      action: actionFilter.value || null,
      page: page.value,
      size: size.value,
    };
    const res = await fetchDatasourceOperLog(id, query);
    rows.value = res?.records ?? [];
    // 后端封顶 200；前端把 size 调到 300 时后端会夹到 200，
    // 用回读的实际值避免分页器显示「第 3 页」而其实只有 200 条
    if (res?.size && res.size !== size.value) {
      size.value = res.size;
    }
    total.value = res?.total ?? 0;
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

/** 改每页条数后回到第 1 页：留在第 5 页而总数只有 2 页会显示空列表 */
function onSizeChange(): void {
  page.value = 1;
  void reload();
}

watch(idRef, () => {
  page.value = 1;
  void reload();
});

onMounted(reload);

defineExpose({ reload });
</script>

<style scoped lang="scss">
.ds-oplog {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
}

.ds-oplog__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
}

.ds-oplog__filter {
  width: 160px;
}

.ds-oplog__spacer {
  flex: 1 1 auto;
}

.ds-oplog__error {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--status-error, var(--el-color-danger));
}

.ds-oplog__table {
  flex: 1 1 auto;
  min-height: 0;
}

.ds-oplog__pager {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
}

.ds-oplog__total {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ds-oplog__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
</style>