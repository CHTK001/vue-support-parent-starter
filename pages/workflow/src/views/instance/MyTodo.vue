<template>
  <PmPageShell page-class="workflow-my-todo-page">
    <PmSurface title="我的待办" description="待我审批的流程任务，支持通过、驳回、退回和转交">
      <template #actions>
        <ScButton circle :icon="RefreshRight" @click="reloadTable" />
      </template>
    </PmSurface>

    <!-- 搜索栏 -->
    <PmToolbar>
      <template #form>
        <el-form :model="queryForm" inline>
          <el-form-item label="状态">
            <el-select v-model="queryForm.taskStatus" clearable placeholder="全部" style="width: 140px">
              <el-option label="待处理" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
              <el-option label="已退回" value="RETURNED" />
              <el-option label="已转交" value="TRANSFERRED" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input
              v-model="queryForm.instTitle"
              clearable
              placeholder="搜索标题"
              style="width: 160px"
              @keyup.enter="reloadTable"
            />
          </el-form-item>
          <el-form-item>
            <ScButton :icon="Search" @click="reloadTable">查询</ScButton>
            <ScButton :icon="Refresh" @click="resetQuery">重置</ScButton>
          </el-form-item>
        </el-form>
      </template>
    </PmToolbar>

    <!-- 表格 -->
    <PmPanel title="待办列表">
      <ScTable
        ref="tableRef"
        table-name="workflow-my-todo"
        row-key="wfInstId"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchMyTodo"
      >
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)">
              {{ row.instTitle }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="wfDefName" label="流程" width="160" />
        <el-table-column label="当前节点" width="130">
          <template #default="{ row }">
            <el-tag effect="plain" type="primary">{{ row.currentNodeName || "-" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="发起人" width="120">
          <template #default="{ row }">
            {{ row.createName || `#${row.starterId}` }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.instStatus === 'PENDING' ? 'warning' : 'info'" effect="plain">
              {{ row.instStatus === 'PENDING' ? '审批中' : row.instStatus }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createTime }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="260" fixed="right">
          <template #default="{ row }">
            <ScButton text type="primary" size="small" @click="viewDetail(row)">处理</ScButton>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RefreshRight, Search, Refresh } from "@element-plus/icons-vue";
import { fetchMyTodo } from "../../api/instance";

const router = useRouter();
const tableRef = ref<any>(null);
const queryForm = ref<any>({
  taskStatus: undefined,
  instTitle: undefined,
});

function reloadTable() {
  tableRef.value?.refresh?.();
}

function resetQuery() {
  queryForm.value = { taskStatus: undefined, instTitle: undefined };
  reloadTable();
}

function viewDetail(row: any) {
  router.push(`/workflow/detail/${row.wfInstId}`);
}
</script>
