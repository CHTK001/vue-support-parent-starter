<script setup lang="ts">
/**
 * 管理员签到汇总页面
 *
 * 按用户聚合展示签到天数和总积分，只读分页表格。
 */
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { Refresh, Search } from "@element-plus/icons-vue";
import { pageUserSummary } from "../api/signinApi";
import type { UserSignInSummary } from "../api/types";

const query = reactive<{ page: number; pageSize: number }>({
  page: 1,
  pageSize: 10,
});
const list = ref<UserSignInSummary[]>([]);
const total = ref(0);
const loading = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const res = await pageUserSummary(query);
    const data = res?.data;
    list.value = (data?.records ?? []) as UserSignInSummary[];
    total.value = data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "加载签到汇总失败");
  } finally {
    loading.value = false;
  }
}

function handlePage(p: number) {
  query.page = p;
  loadData();
}

onMounted(loadData);
</script>

<template>
  <div class="p-6">
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        Sign-in Summary
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        User-wise sign-in days and points overview
      </p>
    </div>

    <el-card shadow="never" class="rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="loadData">Search</el-button>
        <el-button :icon="Refresh" @click="loadData">Refresh</el-button>
      </div>

      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="userId" label="User ID" min-width="120" />
        <el-table-column prop="signInDays" label="Sign-in Days" width="160">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.signInDays }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="totalPoints" label="Total Points" min-width="160">
          <template #default="{ row }">
            <el-tag type="warning" effect="plain">{{ row.totalPoints }}</el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="mt-4 flex justify-end">
        <el-pagination
          :total="total"
          :current-page="query.page"
          :page-size="query.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePage"
        />
      </div>
    </el-card>
  </div>
</template>