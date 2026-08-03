<script setup lang="ts">
/**
 * 在线用户管理页面
 *
 * 展示当前系统在线用户列表（来自 /v2/online/list），
 * 支持按账号/IP 过滤、强制踢出（kick）。
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Connection, Search, Refresh, CircleClose } from "@element-plus/icons-vue";
import { listOnline, kickUser, countOnline } from "../api/systemApi";
import type { OnlineUser } from "../api/types";

const query = reactive<{ username?: string; ip?: string }>({
  username: undefined,
  ip: undefined,
});
const list = ref<OnlineUser[]>([]);
const total = ref(0);
const loading = ref(false);
const onlineCount = ref(0);

async function loadList() {
  loading.value = true;
  try {
    const res = await listOnline(query);
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
  query.username = undefined;
  query.ip = undefined;
  loadList();
}

async function handleKick(row: OnlineUser) {
  if (!row.userId) return;
  await ElMessageBox.confirm(`确认强制下线「${row.username ?? row.userId}」？`, "提示", {
    type: "warning",
  });
  await kickUser(row.userId);
  ElMessage.success("已强制下线");
  loadList();
  loadCount();
}

onMounted(() => {
  loadList();
  loadCount();
});
</script>

<template>
  <div class="p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
          在线用户
        </h2>
        <p class="mt-1 text-sm text-[--el-text-color-secondary]">
          实时显示当前系统在线用户，可强制下线
        </p>
      </div>
      <el-tag type="success" size="large" effect="dark">
        当前在线：{{ onlineCount }} 人
      </el-tag>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input v-model="query.username" placeholder="账号" clearable class="!w-44" @keyup.enter="loadList" />
        <el-input v-model="query.ip" placeholder="IP 地址" clearable class="!w-44" @keyup.enter="loadList" />
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="username" label="账号" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="ip" label="IP 地址" min-width="140" />
        <el-table-column prop="address" label="登录地点" min-width="160" show-overflow-tooltip />
        <el-table-column prop="os" label="操作系统" min-width="120" />
        <el-table-column prop="browser" label="浏览器" min-width="120" />
        <el-table-column prop="loginTime" label="登录时间" min-width="170" />
        <el-table-column prop="lastAccessTime" label="最后访问" min-width="170" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" :icon="CircleClose" @click="handleKick(row)">
              强退
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 text-right text-sm text-[--el-text-color-secondary]">
        共 {{ total }} 条记录
      </div>
    </el-card>
  </div>
</template>
