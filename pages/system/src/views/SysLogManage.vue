<script setup lang="ts">
/**
 * 操作日志管理页面 —— 查看系统操作日志，只读，不提供删除功能
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { ref, defineAsyncComponent } from "vue";
import { Refresh, Search } from "@element-plus/icons-vue";
import { pageForSysLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default()));

const query = ref<{ page: number; pageSize: number; sysLogUsername?: string; sysLogFrom?: string; sysLogStatus?: number }>({
  page: 1,
  pageSize: 20,
});

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
  { prop: "sysLogContent", label: "操作内容", minWidth: 220 },
  { prop: "sysLogUrl", label: "请求URL", minWidth: 180 },
  { prop: "sysLogIp", label: "IP / 归属地", minWidth: 140, slot: "ip" },
  { prop: "sysLogBrowser", label: "浏览器/系统", minWidth: 140, slot: "info" },
  { prop: "sysLogCost", label: "耗时(ms)", width: 90 },
  { prop: "sysLogStatus", label: "状态", width: 80, slot: "status" },
  { prop: "createTime", label: "操作时间", width: 170 },
];
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" :add-button="false">
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