<script setup lang="ts">
/**
 * 在线用户管理页面
 *
 * 展示当前系统在线用户列表（来自 /v2/online/list），
 * 支持按账号/IP 过滤、强制踢出（kick）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Connection, Search, Refresh, CircleClose } from "@element-plus/icons-vue";
import { listOnline, kickUser, countOnline } from "../api/systemApi";
import type { OnlineUser } from "../api/types";
import type { ReTableColumn } from "@repo/ui/re-table";

const query = ref<{ username?: string; ip?: string }>({});
const list = ref<OnlineUser[]>([]);
const total = ref(0);
const loading = ref(false);
const onlineCount = ref(0);

async function loadList() {
  loading.value = true;
  try {
    const res = await listOnline(query.value);
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

const columns: ReTableColumn[] = [
  { prop: "index", label: "#", width: 60, slot: "index" },
  { prop: "username", label: "账号", minWidth: 120 },
  { prop: "nickname", label: "昵称", minWidth: 120 },
  { prop: "ip", label: "IP 地址", minWidth: 140 },
  { prop: "address", label: "登录地点", minWidth: 160, showOverflowTooltip: true },
  { prop: "os", label: "操作系统", minWidth: 120 },
  { prop: "browser", label: "浏览器", minWidth: 120 },
  { prop: "loginTime", label: "登录时间", minWidth: 170 },
  { prop: "lastAccessTime", label: "最后访问", minWidth: 170 },
  { prop: "action", label: "操作", width: 120, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  loadList();
  loadCount();
});
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true">
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
          <div class="flex-1" />
          <ReButton layout="modern" type="primary" icon="Search" @click="loadList">查询</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
        </div>
      </ReSearch>

      <ReTable
        :data="list"
        :columns="columns"
        :pagination="false"
        :loading="loading"
      >
        <template #index="{ $index }">
          <span>{{ $index + 1 }}</span>
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
</style>
