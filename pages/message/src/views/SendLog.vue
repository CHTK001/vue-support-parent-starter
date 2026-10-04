<script setup lang="ts">
/**
 * 消息推送日志页面
 *
 * 顶部支持切换「全部日志」或指定提供商，展示推送日志分页列表，
 * 可按接收人、返回码过滤，并查看发送详情。
 */
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Document, Search, Refresh, Delete } from "@element-plus/icons-vue";
import { cleanLog, listForProvider, pageForLog } from "../api/messageApi";
import type { MessageLog, MessageProvider } from "../api/types";
import ReProviderFilterBar from "../components/ReProviderFilterBar.vue";
import ReLogDetailDialog from "../components/ReLogDetailDialog.vue";
import ReStationMessage from "@repo/ui/re-station-message";
import ReTime from "@repo/ui/re-time";
import { costMs } from "@repo/utils";

const route = useRoute();
const router = useRouter();

// 查询条件
const query = reactive<{
  page: number;
  pageSize: number;
  sysMessageProviderId?: number;
  sysMessageLogTarget?: string;
  sysMessageCode?: string;
  sysMessageReadStatus?: number;
}>({
  page: 1,
  pageSize: 10,
  sysMessageProviderId: undefined,
  sysMessageLogTarget: undefined,
  sysMessageCode: undefined,
  sysMessageReadStatus: undefined,
});

const list = ref<MessageLog[]>([]);
const providers = ref<MessageProvider[]>([]);
const total = ref(0);
const loading = ref(false);

/** 当前提供商（用于上下文展示） */
const currentProvider = computed(() =>
  providers.value.find((p) => p.sysMessageProviderId === query.sysMessageProviderId),
);

// 日志详情弹窗
const detailVisible = ref(false);
const detail = ref<MessageLog | null>(null);

/** 查询日志列表 */
async function loadList() {
  loading.value = true;
  try {
    const res = await pageForLog(query);
    list.value = res?.data?.data ?? [];
    total.value = res?.data?.total ?? 0;
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "日志列表加载失败");
  } finally {
    loading.value = false;
  }
}

/** 加载提供商列表 */
async function loadProviders() {
  try {
    const res = await listForProvider();
    providers.value = res?.data ?? [];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "提供商列表加载失败");
  }
}

/** 切换提供商：更新 query 并刷新列表 */
function handleProviderChange() {
  query.page = 1;
  if (query.sysMessageProviderId) {
    router.replace({
      path: "/message/log",
      query: { providerId: query.sysMessageProviderId },
    });
  } else {
    router.replace({ path: "/message/log" });
  }
  loadList();
}

function handleReset() {
  query.sysMessageLogTarget = undefined;
  query.sysMessageCode = undefined;
  query.sysMessageReadStatus = undefined;
  query.page = 1;
  loadList();
}

/** 查看日志详情 */
function showDetail(row: MessageLog) {
  detail.value = row;
  detailVisible.value = true;
}

const pagination = computed(() => ({
  total: total.value,
  page: query.page,
  pageSize: query.pageSize,
}));

function handlePageChange(p: number) {
  query.page = p;
  loadList();
}

/** 清理日志 */
async function handleClean() {
  try {
    const { value } = await ElMessageBox.prompt(
      "输入截止日期（格式：YYYY-MM-DD），将删除该日期及之前的全部日志，此操作不可恢复",
      "清理日志",
      {
        confirmButtonText: "确认清理",
        cancelButtonText: "取消",
        inputValue: new Date().toISOString().slice(0, 10),
        inputPlaceholder: "如 2026-01-01",
        inputValidator: (v) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(v ?? "")) {
            return "请输入 YYYY-MM-DD 格式的日期";
          }
          return true;
        },
        type: "warning",
      },
    );
    const res = await cleanLog(`${value}T00:00:00`);
    ElMessage.success(`已清理 ${res?.data ?? 0} 条日志`);
    loadList();
  } catch {
    // 用户取消，忽略
  }
}

onMounted(() => {
  loadProviders().then(() => {
    const pid = route.query.providerId;
    if (pid) {
      query.sysMessageProviderId = Number(pid);
    }
    loadList();
  });
});
</script>

<template>
  <div class="p-6">
    <!-- 页面头部 -->
    <div class="mb-6">
      <h2 class="text-xl font-semibold tracking-tight text-[--el-text-color-primary]">
        推送日志
      </h2>
      <p class="mt-1 text-sm text-[--el-text-color-secondary]">
        查看各渠道的推送记录与发送结果
      </p>
    </div>

    <!-- 站内消息入口 -->
    <div class="mb-4 flex items-center justify-end">
      <ReStationMessage />
    </div>

    <!-- 顶部：全部 / 提供商上下文切换 -->
    <ReProviderFilterBar
      v-model:provider-id="query.sysMessageProviderId"
      title="推送日志"
      :icon="Document"
      :providers="providers"
      :current-provider="currentProvider"
      @change="handleProviderChange"
    >
      <el-button type="danger" plain :icon="Delete" @click="handleClean">清理日志</el-button>
    </ReProviderFilterBar>

    <!-- 列表区域 -->
    <el-card shadow="never" class="mt-6 rounded-xl border border-solid border-[--el-border-color-lighter]">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <el-input
          v-model="query.sysMessageLogTarget"
          placeholder="接收人"
          clearable
          class="!w-56"
          @keyup.enter="handleReset"
        />
        <el-select v-model="query.sysMessageCode" placeholder="返回码" clearable class="!w-32">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILURE" />
        </el-select>
        <el-select
          v-model="query.sysMessageReadStatus"
          placeholder="阅读状态"
          clearable
          class="!w-32"
        >
          <el-option label="已读" :value="1" />
          <el-option label="未读" :value="0" />
        </el-select>
        <div class="flex-1" />
        <el-button type="primary" :icon="Search" @click="loadList">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
      <el-table v-loading="loading" :data="list" stripe class="w-full">
        <el-table-column prop="sysMessageLogTarget" label="接收人" min-width="140" />
        <el-table-column prop="sysMessageLogChannel" label="渠道" width="110">
          <template #default="{ row }">
            <el-tag  effect="plain">{{ row.sysMessageLogChannel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag
              
              :type="row.sysMessageCode === 'SUCCESS' ? 'success' : 'danger'"
              effect="plain"
            >
              {{ row.sysMessageCode === "SUCCESS" ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阅读" width="90">
          <template #default="{ row }">
            <template v-if="row.sysMessageTrackToken">
              <el-tag
                
                :type="row.sysMessageReadStatus === 1 ? 'success' : 'info'"
                effect="plain"
              >
                {{ row.sysMessageReadStatus === 1 ? "已读" : "未读" }}
              </el-tag>
            </template>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sysMessageLogSubject" label="主题" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span>{{ row.sysMessageLogSubject ?? "-" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sysMessageLogContent" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column label="耗时" width="100">
          <template #default="{ row }">
            <span class="text-[--el-text-color-secondary]"><ReTime :value="costMs(row.sysMessageCost)" format="duration" placeholder="—" /></span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="发送时间" width="170" />
        <el-table-column label="操作" width="90" fixed="right" align="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="mt-4 flex justify-end">
        <el-pagination
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 日志详情弹窗 -->
    <ReLogDetailDialog v-model:visible="detailVisible" v-model:model="detail" />
  </div>
</template>
