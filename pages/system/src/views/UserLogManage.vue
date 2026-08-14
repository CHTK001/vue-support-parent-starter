<script setup lang="ts">
/**
 * 登录日志管理页面 —— 查看系统登录日志，只读，不提供删除功能
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { ref } from "vue";
import { Refresh, Search } from "@element-plus/icons-vue";
import { pageForUserLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import { defineAsyncComponent } from "vue";
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default()));

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

const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "用户名", width: 120 },
  { prop: "sysDeptName", label: "部门", width: 130 },
  { prop: "sysLogLoginType", label: "登录方式", width: 100 },
  { prop: "sysLogIp", label: "IP", width: 150, slot: "ip" },
  { prop: "sysLogAddress", label: "归属地", minWidth: 150, slot: "address" },
  { prop: "sysLogBrowser", label: "浏览器", width: 120 },
  { prop: "sysLogSystem", label: "系统", width: 110 },
  { prop: "sysLogStatus", label: "状态", width: 90, slot: "status" },
  { prop: "createTime", label: "登录时间", width: 170 },
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
            placeholder="用户名"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysLogUsername = undefined; tableRef?.reload()">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
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
      >
        <template #status="{ row }">
          <ReTag :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
            {{ row.sysLogStatus === 1 ? "成功" : "失败" }}
          </ReTag>
        </template>
        <template #ip="{ row }">
          <ReIpText :ip="row.sysLogIp ?? ''" :address="row.sysLogAddress ?? ''" :clickable="true" />
        </template>
        <template #address="{ row }">
          <ReIpText :ip="row.sysLogIp ?? ''" :address="row.sysLogAddress ?? ''" placeholder="未知位置" />
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