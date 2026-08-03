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
      <el-table v-loading="loading" :data="flows" border stripe>
        <el-table-column prop="flowCode" label="流程编码" min-width="160" />
        <el-table-column prop="flowName" label="流程名称" min-width="180" />
        <el-table-column prop="flowVersion" label="当前版本" width="100" align="center">
          <template #default="{ row }">
            <el-tag>v{{ row.flowVersion || 1 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="flowNodeCount" label="节点数" width="100" align="center" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.flowStatus === 0 ? 'info' : 'success'">
              {{ row.flowStatus === 0 ? '禁用' : '启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column label="操作" width="320" fixed="right">
          <template #default="{ row }">
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
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
    </el-card>

    <el-drawer v-model="historyDrawer" title="历史版本" size="420">
      <el-table :data="historyList" border stripe>
        <el-table-column prop="flowVersion" label="版本" width="80" />
        <el-table-column prop="flowChangeUser" label="修改人" width="100" />
        <el-table-column prop="flowChangeNote" label="变更说明" />
        <el-table-column prop="createTime" label="时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="rollback(row)">回滚</el-button>
          </template>
        </el-table-column>
      </el-table>
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
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus, Search } from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import { spiderApi } from '../api/spiderApi';
import type { SpiderFlow, FlowHistory } from '../api/types';

const router = useRouter();
const keyword = ref('');
const pageNo = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const flows = ref<SpiderFlow[]>([]);

const historyDrawer = ref(false);
const historyList = ref<FlowHistory[]>([]);
const historyFlow = ref<SpiderFlow | null>(null);

const reload = async () => {
  loading.value = true;
  try {
    const res = await spiderApi.pageFlows(pageNo.value, pageSize.value, keyword.value || undefined);
    flows.value = (res?.records ?? []) as SpiderFlow[];
    total.value = res?.total ?? 0;
  } catch (e) {
    ElMessage.error('加载失败: ' + (e instanceof Error ? e.message : String(e)));
  } finally {
    loading.value = false;
  }
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

onMounted(reload);
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
