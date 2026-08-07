<script setup lang="ts">
/**
 * 操作日志管理页面 —— 查看系统操作日志，支持删除
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化），
 * 搜索区用 ReSearch 外壳，管理按钮用 v-admin 指令。
 */
import { ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Delete, Refresh } from "@element-plus/icons-vue";
import { pageForSysLog, deleteSysLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/** 查询条件 */
const query = ref<{ page: number; pageSize: number; sysLogUsername?: string; sysLogFrom?: string; sysLogStatus?: number }>({
  page: 1,
  pageSize: 20,
});

/** ReTable loader：远程分页加载 */
async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForSysLog({
    page,
    pageSize,
    sysLogUsername: (params.sysLogUsername as string) || undefined,
    sysLogFrom: (params.sysLogFrom as string) || undefined,
    sysLogStatus: params.sysLogStatus === "" ? undefined : (params.sysLogStatus as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

async function handleDelete(row: Record<string, unknown>) {
  await ElMessageBox.confirm(`确认删除操作日志（${row.sysLogUsername ?? "未知用户"}）？`, "提示", { type: "warning" });
  await deleteSysLog(row.sysLogId as number);
  ElMessage.success("删除成功");
  tableRef.value?.reload();
}

/** 列定义 */
const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "操作人", width: 110 },
  { prop: "sysLogFrom", label: "模块", width: 120 },
  { prop: "sysLogContent", label: "操作内容", minWidth: 220 },
  { prop: "sysLogUrl", label: "请求URL", minWidth: 180 },
  { prop: "sysLogAddress", label: "IP", width: 120 },
  { prop: "sysLogBrowser", label: "浏览器", width: 120 },
  { prop: "sysLogCost", label: "耗时(ms)", width: 90 },
  { prop: "sysLogStatus", label: "状态", width: 80, slot: "status" },
  { prop: "createTime", label: "操作时间", width: 170 },
  { prop: "action", label: "操作", width: 80, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="flex h-full flex-col gap-4 p-4">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-lg font-semibold">操作日志</h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">记录用户操作系统的行为轨迹，用于安全审计</p>
      </div>
      <div class="flex gap-2">
        <el-button type="primary" plain :icon="Refresh" @click="tableRef?.reload()">刷新</el-button>
      </div>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <ReSearch :is-expanded="true">
        <div class="flex flex-wrap items-center gap-3">
          <el-input
            v-model="query.sysLogUsername"
            placeholder="操作人"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <el-input
            v-model="query.sysLogFrom"
            placeholder="模块"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <el-select
            v-model="query.sysLogStatus"
            placeholder="状态"
            clearable
            class="!w-32"
            @change="tableRef?.reload()"
          >
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
          <el-button type="primary" :icon="Refresh" @click="tableRef?.reload()">查询</el-button>
          <el-button
            @click="
              query.sysLogUsername = undefined;
              query.sysLogFrom = undefined;
              query.sysLogStatus = undefined;
              tableRef?.reload()
            "
          >
            重置
          </el-button>
        </div>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-syslog"
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
