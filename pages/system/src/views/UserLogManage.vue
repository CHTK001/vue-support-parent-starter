<script setup lang="ts">
/**
 * 登录日志管理页面 —— 查看系统登录日志，支持删除与清空
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化），
 * 搜索区用 ReSearch 外壳，管理按钮用 v-admin 指令。
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Refresh } from "@element-plus/icons-vue";
import { pageForUserLog, deleteUserLog, cleanupUserLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/** 查询条件 */
const query = ref<{ page: number; pageSize: number; sysLogUsername?: string }>({
  page: 1,
  pageSize: 20,
});

/** ReTable loader：远程分页加载 */
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

/** 列定义 */
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
  <div class="flex h-full flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">登录日志</h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">记录用户登录系统时的来源与状态</p>
      </div>
      <div class="flex gap-2">
        <el-button type="primary" plain :icon="Refresh" @click="tableRef?.reload()">刷新</el-button>
        <el-button v-admin type="danger" plain :icon="Delete" @click="handleCleanup">清空日志</el-button>
      </div>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <ReSearch :is-expanded="true">
        <div class="flex flex-wrap items-center gap-3">
          <el-input
            v-model="query.sysLogUsername"
            placeholder="用户名"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <el-button type="primary" :icon="Refresh" @click="tableRef?.reload()">查询</el-button>
          <el-button @click="query.sysLogUsername = undefined; tableRef?.reload()">重置</el-button>
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
        class="mt-2"
      >
        <template #status="{ row }">
          <el-tag :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="small">
            {{ row.sysLogStatus === 1 ? "成功" : "失败" }}
          </el-tag>
        </template>
        <template #action="{ row }">
          <el-button v-admin link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </ReTable>
    </el-card>
  </div>
</template>
