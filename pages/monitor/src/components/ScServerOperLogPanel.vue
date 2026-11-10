<script setup lang="ts">
/**
 * 服务节点操作日志面板（右键菜单「操作日志」的内容）。
 *
 * <p>数据来自本模块自己落的 {@code ms_server_oper_log}：{@code @SysLog} 切面
 * 发事件 → 监听器写入，所以这里能读到真正的操作历史，而不是那个全仓没有消费者、
 * 稳定返回「资源不存在」的通用日志端点。</p>
 *
 * <p>切换节点时回到第 1 页：换节点后原来的页码多半已越界，停在那儿会显示成
 * 「这个节点没有操作记录」。</p>
 *
 * @author CH
 * @since 4.0.0.55
 */
import { computed, onMounted, ref, toRef, watch } from 'vue';
import { ElPagination } from 'element-plus';
import ReButton from '@repo/ui/re-button';
import ReEmpty from '@repo/ui/re-empty';
import ReSelect from '@repo/ui/re-select';
import ReTable from '@repo/ui/re-table';
import { costMs } from '@repo/utils';
import {
  listServerOperLogs,
  type ServerOperLog,
  type ServerOperLogQuery,
} from '../api';
import type { ReTableColumn } from '@repo/ui/re-table';

const props = defineProps<{
  /** 节点 ID */
  nodeId?: number | null;
  /** 节点名称（标题用；日志行里也带，但为空时要有个落点） */
  nodeName?: string;
}>();

const rows = ref<ServerOperLog[]>([]);
const total = ref(0);
const page = ref(1);
const size = ref(20);
const actionFilter = ref<string>('');
const loading = ref(false);
const error = ref<string | null>(null);

/** 操作码 → 中文名。码在后端，前端显示中文，各写各的会导致文案不一致（行内优先用后端 actionName） */
const ACTION_LABELS: Record<string, string> = {
  CREATE: '创建服务器节点',
  UPDATE: '更新服务器节点',
  HOT_UPDATE: '热更新服务器节点',
  FILTER_TOGGLE: '热切换过滤器启用状态',
  FILTER_PARAMS_UPDATE: '热更新过滤器参数',
  DELETE: '删除服务器节点',
  START: '启动服务器节点',
  STOP: '停止服务器节点',
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
    width: 120,
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
    // null 是「未判定」，不能并进「成功」：切面只在抛异常时写 0
    formatter: row => {
      const v = row.success;
      return v === 1 ? '成功' : v === 0 ? '失败' : '—';
    },
  },
  { prop: 'target', label: '操作对象', minWidth: 170, showOverflowTooltip: true },
  { prop: 'detail', label: '说明', minWidth: 200, showOverflowTooltip: true },
  { prop: 'requestUrl', label: '请求路径', minWidth: 200, showOverflowTooltip: true },
];

const idRef = toRef(props, 'nodeId');

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
    const query: ServerOperLogQuery = {
      action: actionFilter.value || null,
      page: page.value,
      size: size.value,
    };
    const res = await listServerOperLogs(id, query);
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

watch(idRef, () => {
  page.value = 1;
  void reload();
});

onMounted(reload);

defineExpose({ reload });
</script>

<template>
  <div class="sv-oplog">
    <div class="sv-oplog__bar">
      <ReSelect
        v-model="actionFilter"
        class="sv-oplog__filter"
        placeholder="全部操作"
        :options="actionOptions"
        @update:model-value="onActionChange"
      />
      <span class="sv-oplog__hint">
        {{ nodeName ? `${nodeName} · ` : '' }}共 {{ total }} 条
      </span>
      <span class="sv-oplog__spacer" />
      <ReButton icon="Refresh" :loading="loading" tip="刷新" @click="reload" />
    </div>

    <p v-if="error" class="sv-oplog__error">{{ error }}</p>

    <div class="sv-oplog__table">
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

    <div v-if="total > 0" class="sv-oplog__pager">
      <span class="sv-oplog__total">共 {{ total }} 条</span>
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

    <div v-else-if="!loading && !error" class="sv-oplog__empty">
      <ReEmpty description="还没有操作记录" :image-size="80" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.sv-oplog {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.sv-oplog__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 10px;
}

.sv-oplog__filter {
  width: 160px;
}

.sv-oplog__hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sv-oplog__spacer {
  flex: 1 1 auto;
}

.sv-oplog__error {
  margin: 0 0 10px;
  font-size: 12px;
  color: var(--status-error, var(--el-color-danger));
}

.sv-oplog__table {
  flex: 1 1 auto;
  min-height: 0;
}

.sv-oplog__pager {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
}

.sv-oplog__total {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.sv-oplog__empty {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
</style>
