<script setup lang="ts">
/**
 * APM 操作日志面板（设置页与工作台共用）。
 *
 * <p>数据来自 monitor 模块落的 {@code ms_apm_oper_log}：APM 接口不走 Spring MVC，
 * {@code @SysLog} 切面拦不到，因此由 {@code ApmDispatcher} 在写操作结束时回调
 * {@code ApmOperLogSink} 写入。这里只读，不提供「记一条」的能力。</p>
 *
 * <p><strong>为什么只记写操作</strong>：日志的价值在「谁改了设置」。把每次打开页面
 * 的 GET 也记进来，真正要看的那几条会被淹掉。</p>
 *
 * <p>筛选或翻页后回到第 1 页的时机同 {@code ScServerOperLogPanel}：换了条件后
 * 原来的页码多半已越界，停在那儿会显示成「没有记录」。</p>
 *
 * @author CH
 * @since 4.0.0.56
 */
import { computed, onMounted, ref } from 'vue';
import { ElPagination } from 'element-plus';
import ReButton from '@repo/ui/re-button';
import ReEmpty from '@repo/ui/re-empty';
import ReSelect from '@repo/ui/re-select';
import ReTable from '@repo/ui/re-table';
import { costMs } from '@repo/utils';
import { listApmOperLogs, type ApmOperLog, type ApmOperLogQuery } from '../api/apmApi';
import type { ReTableColumn } from '@repo/ui/re-table';

const props = defineProps<{
  /**
   * 面板高度。
   *
   * <p>设置页里是页面中的一个区块，工作台里是弹框内容，两者需要的高度不一样，
   * 由调用方给，组件不写死。</p>
   */
  height?: string;
}>();

const rows = ref<ApmOperLog[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const actionFilter = ref<string>('');
const loading = ref(false);
const error = ref<string | null>(null);

/** 操作码 → 中文名。码在后端，前端显示中文，各写各的会导致文案不一致 */
const ACTION_LABELS: Record<string, string> = {
  CONFIG_UPDATE: '保存 APM 设置',
  DETECT: '重新探测 APM 引擎',
};

/** 后端返回 actionName 时优先用它（新增操作码不必等前端跟上） */
function actionText(code: string | null, name: string | null): string {
  return name || (code ? (ACTION_LABELS[code] ?? code) : '—');
}

/** 时间格式化；解析不了就原样返回，不吞成空串（原样更利于排查） */
function formatTime(time: string): string {
  if (!time) {
    return '—';
  }
  const v = Date.parse(time);
  return Number.isNaN(v) ? time : new Date(v).toLocaleString('zh-CN', { hour12: false });
}

/**
 * 筛选下拉的选项。
 *
 * <p>只列已知操作码：从库里反查出现过的码要先拉一次全量数据，
 * 而「筛选器要先查一次全量才能用」是个循环。</p>
 */
const actionOptions = computed(() => [
  { label: '全部操作', value: '' },
  ...Object.entries(ACTION_LABELS).map(([value, label]) => ({ label, value })),
]);

const columns: ReTableColumn[] = [
  {
    prop: 'createTime',
    label: '时间',
    width: 165,
    formatter: row => formatTime(String(row.createTime ?? '')),
  },
  {
    prop: 'action',
    label: '操作',
    width: 110,
    formatter: row => actionText(row.action as string | null, row.actionName as string | null),
  },
  { prop: 'operator', label: '操作人', width: 100 },
  { prop: 'clientIp', label: '来源 IP', width: 130 },
  {
    prop: 'costMs',
    label: '耗时',
    width: 90,
    align: 'right',
    // 没采到耗时就显示 —，不是 0ms：0ms 读起来像「瞬间完成」
    formatter: row => (row.costMs == null ? '—' : String(costMs(Number(row.costMs)))),
  },
  {
    prop: 'success',
    label: '结果',
    width: 80,
    align: 'center',
    // null 是「未判定」，不能并进「成功」：只有明确拿到失败结果才写 0
    formatter: row => {
      const v = row.success;
      return v === 1 ? '成功' : v === 0 ? '失败' : '—';
    },
  },
  { prop: 'target', label: '改动项', minWidth: 150, showOverflowTooltip: true },
  { prop: 'detail', label: '明细', minWidth: 220, showOverflowTooltip: true },
  { prop: 'requestUrl', label: '请求路径', minWidth: 160, showOverflowTooltip: true },
];

async function reload(): Promise<void> {
  loading.value = true;
  error.value = null;
  try {
    const query: ApmOperLogQuery = {
      action: actionFilter.value || null,
      page: page.value,
      size: size.value,
    };
    const res = await listApmOperLogs(query);
    rows.value = res?.records ?? [];
    // 后端封顶 200：前端把 size 调到更大时用回读的实际值，
    // 避免分页器显示「第 3 页」而其实只有 200 条
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

/** 换操作码后回到第 1 页，理由同 onSizeChange */
function onActionChange(): void {
  page.value = 1;
  void reload();
}

onMounted(reload);

defineExpose({ reload });
</script>

<template>
  <div class="apm-oplog" :style="props.height ? { height: props.height } : undefined">
    <div class="apm-oplog__bar">
      <ReSelect
        v-model="actionFilter"
        class="apm-oplog__filter"
        placeholder="全部操作"
        :options="actionOptions"
        @update:model-value="onActionChange"
      />
      <span class="apm-oplog__hint">共 {{ total }} 条</span>
      <span class="apm-oplog__spacer" />
      <ReButton icon="Refresh" :loading="loading" tip="刷新" @click="reload" />
    </div>

    <p v-if="error" class="apm-oplog__error">{{ error }}</p>

    <div class="apm-oplog__table">
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

    <div v-if="total > 0" class="apm-oplog__pager">
      <span class="apm-oplog__total">共 {{ total }} 条</span>
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

    <div v-else-if="!loading && !error" class="apm-oplog__empty">
      <ReEmpty description="还没有操作记录" :image-size="80" />
    </div>
  </div>
</template>

<style scoped>
.apm-oplog {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.apm-oplog__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
}

.apm-oplog__filter {
  width: 160px;
}

.apm-oplog__hint {
  font-size: 12px;
  color: var(--apm-faint, var(--el-text-color-secondary));
}

.apm-oplog__spacer {
  flex: 1 1 auto;
}

.apm-oplog__error {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--status-error, var(--el-color-danger));
}

.apm-oplog__table {
  flex: 1 1 auto;
  min-height: 0;
}

.apm-oplog__pager {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
}

.apm-oplog__total {
  font-size: 12px;
  color: var(--apm-faint, var(--el-text-color-secondary));
}

.apm-oplog__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
</style>
