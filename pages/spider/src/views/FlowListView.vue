<template>
  <div class="page-container">
    <el-card shadow="never" class="toolbar">
      <div class="flex items-center gap-3">
        <el-input
          v-model="keyword"
          placeholder="搜索流程编码 / 名称"
          clearable
          style="width: 280px"
          @keyup.enter="reload"
        />
        <el-button type="primary" :icon="Search" @click="reload">查询</el-button>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建流程</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="mt-3">
      <ReTable
        ref="tableRef"
        v-model:page="pageNo"
        v-model:page-size="pageSize"
        :loader="loadFlows"
        :columns="columns"
        :row-key="'flowCode'"
        :pagination="true"
        :table-id="'spider-flow-list'"
      >
        <template #col-flowVersion="{ row }">
          <el-tag>v{{ row.flowVersion || 1 }}</el-tag>
        </template>
        <template #col-flowStatus="{ row }">
          <el-tag :type="row.flowStatus === 0 ? 'info' : 'success'">
            {{ row.flowStatus === 0 ? '禁用' : '启用' }}
          </el-tag>
        </template>
        <template #col-actions="{ row }">
          <el-button link type="primary" @click="openDesigner(row)">编排</el-button>
          <el-button link type="primary" @click="openDebug(row)">调试</el-button>
          <el-button link type="success" @click="toggleStatus(row)" v-if="row.flowStatus === 0">启用</el-button>
          <el-button link type="warning" @click="toggleStatus(row)" v-else>禁用</el-button>
          <el-button link type="primary" @click="viewHistory(row)">历史</el-button>
          <el-popconfirm :title="`确认删除流程 ${row.flowCode} 吗？`" @confirm="remove(row)">
            <template #reference>
              <el-button link type="danger">删除</el-button>
            </template>
          </el-popconfirm>
        </template>
      </ReTable>
    </el-card>

    <el-drawer v-model="historyDrawer" title="历史版本" size="420">
      <ReTable
        :data="historyList"
        :columns="historyColumns"
        :row-key="'flowHistoryId'"
        :pagination="false"
        :toolbar="false"
      >
        <template #col-rollback="{ row }">
          <el-button link type="primary" @click="rollback(row)">回滚</el-button>
        </template>
      </ReTable>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
/**
 * 流程定义列表页（RelationGraph 编排）。
 *
 * - 表格列出全部流程（编码/名称/版本/节点数/状态/更新时间）
 * - 跳转到编排页 / 调试页
 * - 启停切换、历史版本、删除
 */
import { ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn, RePageResult } from '@repo/ui/re-table';
import { spiderApi } from '../api/spiderApi';
import type { SpiderFlow, FlowHistory } from '../api/types';

const router = useRouter();
const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const flows = ref<SpiderFlow[]>([]);
const tableRef = ref<{ reload: () => Promise<void> } | null>(null);

const historyDrawer = ref(false);
const historyList = ref<FlowHistory[]>([]);
const historyFlow = ref<SpiderFlow | null>(null);

/** 主表格列定义 */
const columns: ReTableColumn[] = [
  { prop: 'flowCode', label: '流程编码', minWidth: 160 },
  { prop: 'flowName', label: '流程名称', minWidth: 180 },
  { prop: 'flowVersion', label: '当前版本', width: 100, align: 'center', slot: 'flowVersion' },
  { prop: 'flowNodeCount', label: '节点数', width: 100, align: 'center' },
  { prop: 'flowStatus', label: '状态', width: 100, align: 'center', slot: 'flowStatus' },
  { prop: 'updateTime', label: '更新时间', width: 180 },
  { prop: 'actions', label: '操作', width: 320, fixed: 'right', slot: 'actions' },
];

/** 历史抽屉列定义 */
const historyColumns: ReTableColumn[] = [
  { prop: 'flowVersion', label: '版本', width: 80 },
  { prop: 'flowChangeUser', label: '修改人', width: 100 },
  { prop: 'flowChangeNote', label: '变更说明' },
  { prop: 'createTime', label: '时间', width: 160 },
  { prop: 'rollback', label: '操作', width: 100, fixed: 'right', slot: 'rollback' },
];

/** ReTable loader：适配 spiderApi.pageFlows 分页 */
const loadFlows = async (p: { page: number; pageSize: number; params: Record<string, unknown> }): Promise<RePageResult> => {
  const res = await spiderApi.pageFlows(p.page, p.pageSize, keyword.value || undefined);
  flows.value = (res?.records ?? []) as SpiderFlow[];
  return { total: res?.total ?? 0, records: flows.value };
};

const reload = async () => {
  // 关键字查询：重置到第 1 页后由 ReTable loader 重新拉取
  pageNo.value = 1;
  await tableRef.value?.reload?.();
};

const openCreate = () => {
  ElMessageBox.prompt('请输入流程编码（英文，建议业务唯一）', '新建流程', {
    confirmButtonText: '下一步',
    cancelButtonText: '取消',
    inputPattern: /^[a-zA-Z][a-zA-Z0-9_-]*$/,
    inputErrorMessage: '编码只能包含字母、数字、下划线和连字符，且以字母开头',
  })
    .then(({ value }) => {
      const code = (value as string).trim();
      router.push(`/spider/flow-designer/${code}`);
    })
    .catch(() => {
      // 用户取消
    });
};

const openDesigner = (row: SpiderFlow) => {
  router.push(`/spider/flow-designer/${row.flowCode}`);
};

const openDebug = (row: SpiderFlow) => {
  router.push(`/spider/flow-debug/${row.flowCode}`);
};

const toggleStatus = async (row: SpiderFlow) => {
  try {
    const newStatus = row.flowStatus === 0 ? 1 : 0;
    await spiderApi.toggleFlow(row.flowCode, newStatus);
    ElMessage.success(newStatus === 1 ? '已启用' : '已禁用');
    await reload();
  } catch (e) {
    ElMessage.error('切换失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const viewHistory = async (row: SpiderFlow) => {
  historyFlow.value = row;
  try {
    historyList.value = await spiderApi.flowHistory(row.flowCode);
    historyDrawer.value = true;
  } catch (e) {
    ElMessage.error('历史加载失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const rollback = async (row: FlowHistory) => {
  try {
    await ElMessageBox.confirm(
      `确认回滚到版本 v${row.flowVersion}？当前版本会被备份。`,
      '回滚确认',
      { type: 'warning' }
    );
    await spiderApi.rollbackFlow(historyFlow.value!.flowCode, row.flowVersion || 1);
    ElMessage.success('回滚成功');
    historyDrawer.value = false;
    await reload();
  } catch (e) {
    if ((e as any) === 'cancel') return;
    ElMessage.error('回滚失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};

const remove = async (row: SpiderFlow) => {
  try {
    await spiderApi.deleteFlow(row.flowCode);
    ElMessage.success('已删除');
    await reload();
  } catch (e) {
    ElMessage.error('删除失败: ' + (e instanceof Error ? e.message : String(e)));
  }
};
</script>

<style scoped>
.page-container {
  padding: 16px;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.toolbar :deep(.el-card__body) {
  padding: 12px 16px;
}
</style>
