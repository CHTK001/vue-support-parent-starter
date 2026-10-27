<script setup lang="ts">
/**
 * 在线用户管理页面 —— 查看当前在线用户（仅管理员及以上）
 *
 * 数据来自 OAuth 服务端（后端 SysOnlineController /v2/online/* 调用
 * AuthClientExecute 拉取在线名单，接口层 @Permission(role=ADMIN/SUPER_ADMIN)
 * 拦截非管理员）。页面只读展示 + 强制下线，不做新增/编辑。
 */
import { message } from "@repo/core";
import { computed, ref } from "vue";
import { ElMessageBox } from "element-plus";

import { countOnline, kickUser, listOnline } from "../api/systemApi";
import type { OnlineUser } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReTable from "@repo/ui/re-table";

const query = ref<{ page: number; pageSize: number; username?: string; ip?: string }>({
  page: 1,
  pageSize: 20,
});

const searchFilters = computed(() => [
  { key: "username", label: "用户名", type: "input" as const, placeholder: "请输入" },
  { key: "ip", label: "IP 地址", type: "input" as const, placeholder: "请输入" },
]);

function handleReset() {
  query.value = { page: 1, pageSize: 20 };
  tableRef.value?.reload();
}

/** 在线用户总数（顶部徽标） */
const onlineTotal = ref<number | null>(null);

/** 刷新在线总数徽标 */
async function refreshTotal() {
  try {
    const res = await countOnline();
    onlineTotal.value = res?.data ?? null;
  } catch {
    onlineTotal.value = null;
  }
}

async function loadOnline({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const username = (params.username as string)?.trim() || undefined;
  const ip = (params.ip as string)?.trim() || undefined;
  // 后端 /v2/online/list 返回的是「整份在线名单」而非分页对象（在线人数一般不大），
  // 这里整份渲染，把 total 设为名单长度以复用 ReTable 分页/空态语义。
  const res = await listOnline({ username, ip });
  const arr = (res?.data ?? []) as OnlineUser[];
  return { total: arr.length, data: arr as unknown as Record<string, unknown>[] };
}

const tableRef = ref();

/** 空态「刷新」：只重取当前页，不清空筛选条件 */
function reload() {
  tableRef.value?.reload();
}

/** 强制下线单个用户（仅管理员及以上可调用，后端 @Permission 兜底） */
async function handleKick(row: OnlineUser) {
  try {
    await ElMessageBox.confirm(
      `确认将用户「${row.username ?? row.userId ?? "-"}」强制下线？该用户所有会话将被吊销，需重新登录。`,
      "强制下线",
      { type: "warning", confirmButtonText: "强制下线", cancelButtonText: "取消" },
    );
  } catch {
    return; // 用户取消
  }
  try {
    const res = await kickUser(row.userId ?? "");
    if (res?.data === false) {
      message.error("强制下线失败");
      return;
    }
    message.success("已强制下线");
    tableRef.value?.reload();
    refreshTotal();
  } catch (e) {
    message.error((e as Error)?.message ?? "强制下线失败");
  }
}

/** 登录类型文案 */
function loginTypeLabel(v: unknown): string {
  const s = String(v ?? "").toUpperCase();
  if (!s) return "--";
  const map: Record<string, string> = {
    WEB: "网页",
    APP: "应用",
    GITEE: "Gitee",
    SMS: "短信",
  };
  return map[s] ?? s;
}

/** 时间戳/日期文本渲染为可读时间 */
function formatTime(v: unknown): string {
  if (v == null || v === "") return "--";
  const s = String(v);
  // 已是标准时间字符串（后端 LocalDateTime 序列化）直接替换分隔符展示
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.replace("T", " ");
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) return s;
  const t = Number(v);
  if (Number.isFinite(t) && t > 0) {
    const d = new Date(t);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString("zh-CN", { hour12: false });
  }
  return s;
}

const columns: ReTableColumn[] = [
  { prop: "username", label: "用户名", width: 130, slot: "username" },
  { prop: "nickname", label: "昵称", width: 120 },
  { prop: "deptName", label: "部门", width: 120, slot: "dept" },
  { prop: "ip", label: "IP / 归属地", minWidth: 150, slot: "ip" },
  { prop: "browser", label: "浏览器 / 系统", minWidth: 150, slot: "info" },
  { prop: "loginType", label: "登录方式", width: 100, slot: "loginType" },
  { prop: "loginTime", label: "登录时间", width: 165 },
  { prop: "lastAccessTime", label: "最后访问", width: 165 },
  { prop: "action", label: "操作", width: 100, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="system-page">
    <ReTable
      ref="tableRef"
      table-id="system-online"
      :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
      :search-gap="16"
      v-model:search-model="query"
      @search-reset="handleReset"
      :loader="loadOnline"
      :columns="columns"
      :pagination="true"
      :params="query"
      row-key="userId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
    >
      <template #toolbar>
        <span v-if="onlineTotal != null" class="online-total">
          <span class="online-total__dot" />
          当前在线 {{ onlineTotal }} 人
        </span>
        <ReButton icon="Refresh" @click="reload">刷新</ReButton>
      </template>
      <!-- 可操作空态：在线名单由登录态实时产生，只给「刷新」出口，不给「新增」 -->
      <template #empty>
        <div class="page-empty">
          <span class="page-empty__icon"><ReIcon name="User" :size="22" /></span>
          <span class="page-empty__title">当前没有在线用户</span>
          <span class="page-empty__desc">用户登录后会自动出现在这里；该页面仅管理员及以上可见。</span>
          <span class="page-empty__actions">
            <ReButton icon="Refresh" @click="reload">刷新</ReButton>
          </span>
        </div>
      </template>
      <template #username="{ row }">
        <span class="online-user">{{ row.username ?? '-' }}</span>
      </template>
      <template #dept="{ row }">
        <span v-if="row.deptName">{{ row.deptName }}</span>
        <span v-else class="online-empty">-</span>
      </template>
      <template #ip="{ row }">
        <div class="online-ip">
          <span v-if="row.ip" class="online-ip__ip">{{ row.ip }}</span>
          <span v-if="row.address" class="online-ip__addr">{{ row.address }}</span>
          <span v-if="!row.ip && !row.address" class="online-empty">-</span>
        </div>
      </template>
      <template #info="{ row }">
        <div class="online-info">
          <span v-if="row.browser">{{ row.browser }}</span>
          <span v-if="row.os">{{ row.os }}</span>
          <span v-if="!row.browser && !row.os" class="online-empty">-</span>
        </div>
      </template>
      <template #loginType="{ row }">
        <ReTag effect="plain" size="small">{{ loginTypeLabel(row.loginType) }}</ReTag>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" type="danger" icon="SwitchButton" tip="强制下线" @click="handleKick(row as OnlineUser)" />
      </template>
    </ReTable>
  </div>
</template>

<style scoped>
.online-total {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.online-total__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 18%, transparent);
}
.online-user {
  font-weight: 600;
}
.online-empty {
  color: var(--el-text-color-placeholder);
}
.online-ip {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.online-ip__ip {
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 13px;
}
.online-ip__addr {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.online-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>