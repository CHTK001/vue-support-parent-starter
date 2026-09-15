<script setup lang="ts">
/**
 * 登录日志管理页面 —— 查看系统登录日志，只读，不提供删除功能
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Search, Download } from "@element-plus/icons-vue";
import { pageForUserLog, exportUserLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import { defineAsyncComponent } from "vue";
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default()));

const query = ref<{ page: number; pageSize: number; sysLogUsername?: string; sysLogStatus?: number }>({
  page: 1,
  pageSize: 20,
});

/* 导出登录日志 */
const exporting = ref(false);
async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportUserLog({
      sysLogUsername: query.value.sysLogUsername,
      sysLogStatus: query.value.sysLogStatus,
    });
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `登录日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

/** 登录失败行：红色文字高亮 */
function rowClassName({ row }: { row: Record<string, unknown> }): string {
  return row.sysLogStatus === 0 ? "login-fail-row" : "";
}

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForUserLog({
    page,
    pageSize,
    sysLogUsername: (params.sysLogUsername as string) || undefined,
    sysLogStatus: params.sysLogStatus === "" || params.sysLogStatus == null ? undefined : (params.sysLogStatus as number),
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

/* 详情弹窗 */
const detailVisible = ref(false);
const currentLog = ref<Record<string, unknown> | null>(null);
function openDetail(row: Record<string, unknown>) {
  currentLog.value = row;
  detailVisible.value = true;
}

const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "用户名", width: 120, slot: "username" },
  { prop: "sysDeptName", label: "部门", width: 130 },
  { prop: "sysLogLoginType", label: "登录方式", width: 100 },
  { prop: "sysLogIp", label: "IP / 归属地", minWidth: 140, slot: "ip" },
  { prop: "sysLogBrowser", label: "浏览器", minWidth: 140, slot: "info" },
  { prop: "sysLogStatus", label: "状态", width: 90, slot: "status" },
  { prop: "createTime", label: "登录时间", width: 170 },
  { prop: "action", label: "操作", width: 90, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" filter-mode="data" :add-button="false">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysLogUsername"
            placeholder="用户名"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysLogStatus"
            placeholder="状态（全部/成功/失败）"
            clearable
            class="!w-48"
            :data="[
              { label: '成功', value: 1 },
              { label: '失败', value: 0 },
            ]"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysLogUsername = undefined; query.sysLogStatus = undefined; tableRef?.reload()">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
          <ReButton layout="modern" type="success" icon="Download" :loading="exporting" @click="handleExport">导出</ReButton>
        </template>
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
        :row-class-name="rowClassName"
      >
        <template #username="{ row }">
          <span class="log-content-link" @click="openDetail(row)">{{ row.sysLogUsername ?? '-' }}</span>
        </template>
        <template #status="{ row }">
          <el-tooltip
            v-if="row.sysLogStatus === 0 && row.sysLogMessage"
            :content="row.sysLogMessage"
            placement="top"
          >
            <ReTag type="danger" size="small" effect="plain">失败</ReTag>
          </el-tooltip>
          <ReTag v-else :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
            {{ row.sysLogStatus === 1 ? "成功" : "失败" }}
          </ReTag>
        </template>
        <template #ip="{ row }">
          <ReIpText :ip="row.sysLogIp ?? ''" :address="row.sysLogAddress ?? ''" :clickable="true" />
        </template>
        <template #info="{ row }">
          <div class="flex flex-col gap-0.5 text-xs text-[--el-text-color-secondary]">
            <span>{{ row.sysLogBrowser ?? '--' }}</span>
            <span>{{ row.sysLogSystem ?? '--' }}</span>
          </div>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" @click="openDetail(row)">详情</ReButton>
        </template>
      </ReTable>
    </el-card>

    <!-- 登录日志详情弹窗 -->
    <ReDialog v-model="detailVisible" title="登录日志详情" width="640" :footer-hidden="true">
      <el-descriptions v-if="currentLog" :column="1" border>
        <el-descriptions-item label="用户名">{{ currentLog.sysLogUsername ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录时间">{{ currentLog.createTime ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录IP">{{ currentLog.sysLogIp ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="登录地点">{{ currentLog.sysLogAddress ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ currentLog.sysLogBrowser ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ currentLog.sysLogSystem ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="User-Agent">
          <pre class="log-detail-ua">{{ currentLog.sysLogUa ?? '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="登录状态">
          <ReTag :type="currentLog.sysLogStatus === 1 ? 'success' : 'danger'" size="small">
            {{ currentLog.sysLogStatus === 1 ? '成功' : '失败' }}
          </ReTag>
        </el-descriptions-item>
        <el-descriptions-item v-if="currentLog.sysLogStatus === 0" label="失败原因">
          <span class="text-[--el-color-danger]">{{ currentLog.sysLogMessage ?? '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </ReDialog>
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

:deep(.login-fail-row) {
  td {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9) !important;
  }
}

.log-content-link {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.log-detail-ua {
  margin: 0;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow: auto;
}
</style>