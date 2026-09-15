<script setup lang="ts">
/**
 * 操作日志管理页面 —— 查看系统操作日志，只读，不提供删除功能
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { ref, defineAsyncComponent } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Search, Download } from "@element-plus/icons-vue";
import { pageForSysLog, exportSysLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default()));

const query = ref<{ page: number; pageSize: number; sysLogUsername?: string; sysLogFrom?: string; sysLogStatus?: number }>({
  page: 1,
  pageSize: 20,
});

/* 导出日志 */
const exporting = ref(false);
async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportSysLog({
      sysLogUsername: query.value.sysLogUsername,
      sysLogFrom: query.value.sysLogFrom,
      sysLogStatus: query.value.sysLogStatus,
    });
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `操作日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

/* 详情弹窗 */
const detailVisible = ref(false);
const currentLog = ref<Record<string, unknown> | null>(null);
function openDetail(row: Record<string, unknown>) {
  currentLog.value = row;
  detailVisible.value = true;
}

/** 请求参数 JSON 美化（解析失败则原样展示） */
function prettyParams(raw: unknown): string {
  if (!raw) return "-";
  const text = String(raw);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

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

const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "操作人", width: 110 },
  { prop: "sysLogFrom", label: "模块", width: 120 },
  { prop: "sysLogContent", label: "操作内容", minWidth: 220, slot: "content" },
  { prop: "sysLogUrl", label: "请求URL", minWidth: 180 },
  { prop: "sysLogIp", label: "IP / 归属地", minWidth: 140, slot: "ip" },
  { prop: "sysLogBrowser", label: "浏览器/系统", minWidth: 140, slot: "info" },
  { prop: "sysLogCost", label: "耗时(ms)", width: 90 },
  { prop: "sysLogStatus", label: "状态", width: 80, slot: "status" },
  { prop: "createTime", label: "操作时间", width: 170 },
  { prop: "action", label: "操作", width: 80, slot: "action", fixed: "right", align: "center" },
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
            placeholder="操作人"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReInput
            layout="modern"
            v-model="query.sysLogFrom"
            placeholder="模块"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
          <ReSelect
            v-model="query.sysLogStatus"
            placeholder="状态"
            clearable
            class="!w-32"
            :data="[
              { label: '成功', value: 1 },
              { label: '失败', value: 0 },
            ]"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysLogUsername = undefined; query.sysLogFrom = undefined; query.sysLogStatus = undefined; tableRef?.reload()">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
          <ReButton layout="modern" type="success" icon="Download" :loading="exporting" @click="handleExport">导出</ReButton>
        </template>
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
      >
        <template #content="{ row }">
          <span class="log-content-link" @click="openDetail(row)">{{ row.sysLogContent ?? '-' }}</span>
        </template>
        <template #status="{ row }">
          <ReTag :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
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

    <!-- 日志详情弹窗 -->
    <ReDialog v-model="detailVisible" title="操作日志详情" width="700" :footer-hidden="true">
      <el-descriptions v-if="currentLog" :column="1" border>
        <el-descriptions-item label="日志ID">{{ currentLog.sysLogId }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.sysLogUsername ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{ currentLog.sysLogFrom ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作内容">{{ currentLog.sysLogContent ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求URL">{{ currentLog.sysLogUrl ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ currentLog.sysLogMethod ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre class="log-detail-params">{{ prettyParams(currentLog.sysLogParam) }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.sysLogIp ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="归属地">{{ currentLog.sysLogAddress ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="浏览器">{{ currentLog.sysLogBrowser ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作系统">{{ currentLog.sysLogSystem ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.sysLogCost ?? '-' }} ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <ReTag :type="currentLog.sysLogStatus === 1 ? 'success' : 'danger'" size="small">
            {{ currentLog.sysLogStatus === 1 ? '成功' : '失败' }}
          </ReTag>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" v-if="currentLog.sysLogError">{{ currentLog.sysLogError }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.createTime ?? '-' }}</el-descriptions-item>
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

.log-detail-params {
  margin: 0;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
}

.log-content-link {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}
</style>