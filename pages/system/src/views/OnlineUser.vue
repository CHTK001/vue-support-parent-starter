<script setup lang="ts">
/**
 * 在线用户管理页面
 *
 * 展示当前系统在线用户列表（来自 /v2/online/list），
 * 支持按账号/IP 过滤、强制踢出（kick）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, onUnmounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Connection, Search, Refresh, CircleClose, Switch } from "@element-plus/icons-vue";
import { listOnline, kickUser, kickUsers, countOnline, listForRole, listDept } from "../api/systemApi";
import type { OnlineUser, SysDept, SysRole } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const query = ref<{ username?: string; ip?: string; roleCode?: string; deptId?: number }>({});
const list = ref<OnlineUser[]>([]);
const total = ref(0);
const loading = ref(false);
const onlineCount = ref(0);

/** 角色 / 部门筛选选项 */
const roleOptions = ref<SysRole[]>([]);
const deptOptions = ref<SysDept[]>([]);

async function loadFilterOptions(): Promise<void> {
  try {
    const [roleRes, deptRes] = await Promise.all([listForRole(), listDept()]);
    roleOptions.value = (roleRes?.data ?? []) as SysRole[];
    deptOptions.value = (deptRes?.data ?? []) as SysDept[];
  } catch {
    /* 筛选选项加载失败不影响主列表 */
  }
}

/** 部门树展平为 el-tree-select 数据 */
const deptTreeProps = { value: "sysDeptId", label: "sysDeptName", children: "children" };

/* ================== 多选与批量操作 ================== */
const selectedRows = ref<OnlineUser[]>([]);
const batchKicking = ref(false);

function handleSelectionChange(rows: OnlineUser[]) {
  selectedRows.value = rows;
}

async function handleBatchKick() {
  if (!selectedRows.value.length) {
    ElMessage.warning("请先选择要下线的用户");
    return;
  }
  const userIds = selectedRows.value.map((u) => u.userId).filter((v): v is string => !!v);
  await ElMessageBox.confirm(`确认强制下线选中的 ${userIds.length} 个用户？`, "批量下线确认", {
    type: "warning",
  });
  batchKicking.value = true;
  try {
    const res = await kickUsers(userIds);
    ElMessage.success(`已强制下线 ${res?.data ?? userIds.length} 个用户`);
    selectedRows.value = [];
    loadList();
    loadCount();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量下线失败");
  } finally {
    batchKicking.value = false;
  }
}

/* ================== 自动刷新 ================== */
const autoRefresh = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

function toggleAutoRefresh(val: boolean) {
  if (val) {
    refreshTimer = setInterval(() => {
      loadList();
      loadCount();
    }, 30000);
    ElMessage.info("已开启自动刷新（每30秒）");
  } else {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
    ElMessage.info("已关闭自动刷新");
  }
}

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});

async function loadList() {
  loading.value = true;
  try {
    const res = await listOnline(query.value as { username?: string; ip?: string });
    list.value = (res?.data ?? []) as OnlineUser[];
    total.value = list.value.length;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "在线用户加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadCount() {
  try {
    const res = await countOnline();
    onlineCount.value = res?.data ?? 0;
  } catch {
    onlineCount.value = 0;
  }
}

function handleReset() {
  query.value = {};
  loadList();
}

async function handleKick(row: Record<string, unknown>) {
  const user = row as unknown as OnlineUser;
  if (!user.userId) return;
  await ElMessageBox.confirm(`确认强制下线「${user.username ?? user.userId}」？`, "提示", {
    type: "warning",
  });
  await kickUser(user.userId);
  ElMessage.success("已强制下线");
  loadList();
  loadCount();
}

/** 根据登录时间计算已登录时长（如 2小时15分） */
function loginDuration(loginTime?: string): string {
  if (!loginTime) return "-";
  const start = new Date(loginTime.replace(/-/g, "/")).getTime();
  if (Number.isNaN(start)) return "-";
  const diff = Date.now() - start;
  if (diff < 0) return "-";
  const minutes = Math.floor(diff / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}小时${m}分`;
  if (m > 0) return `${m}分钟`;
  return `${Math.floor(diff / 1000)}秒`;
}

const columns: ReTableColumn[] = [
  { type: "selection", width: 50, align: "center" },
  { prop: "index", label: "#", width: 60, slot: "index" },
  { prop: "username", label: "账号", minWidth: 120 },
  { prop: "nickname", label: "昵称", minWidth: 120 },
  { prop: "ip", label: "IP 地址", minWidth: 140 },
  { prop: "address", label: "登录地点", minWidth: 160, showOverflowTooltip: true },
  { prop: "os", label: "操作系统", minWidth: 120 },
  { prop: "browser", label: "浏览器", minWidth: 120 },
  { prop: "loginTime", label: "登录时间", minWidth: 170 },
  { prop: "duration", label: "登录时长", width: 110, slot: "duration", align: "center" },
  { prop: "lastAccessTime", label: "最后访问", minWidth: 170 },
  { prop: "action", label: "操作", width: 120, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  loadFilterOptions();
  loadList();
  loadCount();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" filter-mode="data">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.username"
            placeholder="账号"
            clearable
            class="!w-44"
            @keyup.enter="loadList"
          />
          <ReInput
            layout="modern"
            v-model="query.ip"
            placeholder="IP 地址"
            clearable
            class="!w-44"
            @keyup.enter="loadList"
          />
          <ReSelect
            v-model="query.roleCode"
            placeholder="角色"
            clearable
            class="!w-44"
            :data="roleOptions.map((r) => ({ label: r.sysRoleName, value: r.sysRoleCode }))"
            @change="loadList"
          />
          <el-tree-select
            v-model="query.deptId"
            :data="deptOptions"
            :props="deptTreeProps"
            check-strictly
            clearable
            placeholder="部门"
            class="!w-44"
            @change="loadList"
          />
          <div class="flex-1" />
          <ReButton layout="modern" type="primary" icon="Search" @click="loadList">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
        </div>
        <template #footer>
          <ReButton
            layout="modern"
            type="danger"
            :icon="CircleClose"
            :disabled="!selectedRows.length"
            :loading="batchKicking"
            @click="handleBatchKick"
          >
            批量踢出{{ selectedRows.length ? `（${selectedRows.length}）` : "" }}
          </ReButton>
        </template>
      </ReSearch>

      <!-- 批量操作栏 -->
      <div class="batch-bar" v-if="selectedRows.length > 0">
        <span class="batch-bar__info">已选择 {{ selectedRows.length }} 个用户</span>
        <ReButton
          layout="modern"
          type="danger"
          :icon="CircleClose"
          :loading="batchKicking"
          @click="handleBatchKick"
        >
          批量强制下线
        </ReButton>
      </div>

      <!-- 在线人数 + 自动刷新 -->
      <div class="online-header">
        <div class="online-header__stat">
          <el-icon :size="18" color="var(--el-color-success)"><Connection /></el-icon>
          <span>当前在线：<strong>{{ onlineCount }}</strong> 人</span>
        </div>
        <div class="online-header__auto">
          <span class="text-sm text-[--el-text-color-secondary]">自动刷新</span>
          <el-switch v-model="autoRefresh" @change="toggleAutoRefresh" />
        </div>
      </div>

      <ReTable
        :data="list"
        :columns="columns"
        :pagination="false"
        :loading="loading"
        @selection-change="handleSelectionChange"
      >
        <template #index="{ $index }">
          <span>{{ $index + 1 }}</span>
        </template>
        <template #duration="{ row }">
          <span class="text-xs">{{ loginDuration(row.loginTime) }}</span>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="danger" :icon="CircleClose" @click="handleKick(row)">强退</ReButton>
        </template>
      </ReTable>

      <div class="mt-4 text-right text-sm text-[--el-text-color-secondary]">
        共 {{ total }} 条记录
      </div>
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

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  margin-bottom: 12px;
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  border: 1px solid var(--el-color-primary-light-7);

  &__info {
    font-size: 14px;
    color: var(--el-color-primary);
  }
}

.online-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;

  &__stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--el-text-color-regular);
  }

  &__auto {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}
</style>
