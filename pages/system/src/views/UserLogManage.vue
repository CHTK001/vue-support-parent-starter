<script setup lang="ts">
/**
 * 登录日志管理页面 —— 查看系统登录日志，支持删除与清空
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化），
 * 搜索区用 ReSearch 外壳，管理按钮用 v-admin 指令。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Refresh, Search } from "@element-plus/icons-vue";
import { pageForUserLog, deleteUserLog, cleanupUserLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const query = ref<{ page: number; pageSize: number; sysLogUsername?: string }>({
  page: 1,
  pageSize: 20,
});

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForUserLog({
    page,
    pageSize,
    sysLogUsername: (params.sysLogUsername as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

async function handleDelete(row: Record<string, unknown>) {
  await ElMessageBox.confirm(`确认删除登录日志（${row.sysLogUsername ?? "未知用户"}）？`, "提示", { type: "warning" });
  await deleteUserLog(row.sysLogId as number);
  ElMessage.success("删除成功");
  tableRef.value?.reload();
}

async function handleCleanup() {
  await ElMessageBox.confirm("确认清空全部登录日志？", "提示", { type: "warning" });
  await cleanupUserLog();
  ElMessage.success("清理成功");
  tableRef.value?.reload();
}

const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "用户名", width: 120 },
  { prop: "sysDeptName", label: "部门", width: 130 },
  { prop: "sysLogLoginType", label: "登录方式", width: 100 },
  { prop: "sysLogIp", label: "IP", width: 130 },
  { prop: "sysLogAddress", label: "归属地", minWidth: 130 },
  { prop: "sysLogBrowser", label: "浏览器", width: 120 },
  { prop: "sysLogSystem", label: "系统", width: 110 },
  { prop: "sysLogStatus", label: "状态", width: 90, slot: "status" },
  { prop: "createTime", label: "登录时间", width: 170 },
  { prop: "action", label: "操作", width: 80, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="system-page">
    <div class="system-page__header">
      <div>
        <h2 class="system-page__title">登录日志</h2>
        <p class="system-page__subtitle">记录用户登录系统时的来源与状态</p>
      </div>
      <div class="flex gap-2">
        <ReButton layout="modern" type="primary" plain icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        <ReButton layout="modern" type="danger" plain icon="Delete" v-admin @click="handleCleanup">清空日志</ReButton>
      </div>
    </div>

    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysLogUsername"
            placeholder="用户名"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <div class="flex-1" />
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysLogUsername = undefined; tableRef?.reload()">重置</ReButton>
        </div>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-userlog"
        :loader="loadLogs"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysLogId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
      >
        <template #status="{ row }">
          <ReTag :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
            {{ row.sysLogStatus === 1 ? "成功" : "失败" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton layout="modern" link type="danger" v-admin @click="handleDelete(row)">删除</ReButton>
        </template>
      </ReTable>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.system-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.system-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.system-page__card {
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
}
.system-page__search {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
}
</style>
