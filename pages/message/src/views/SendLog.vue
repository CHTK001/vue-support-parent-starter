<script setup lang="ts">
/**
 * 消息推送日志页面
 *
 * 顶部支持切换「全部日志」或指定提供商，展示推送日志分页列表，
 * 可按接收人、返回码过滤，并查看发送详情。
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { Document, Search, Refresh, Delete } from "@element-plus/icons-vue";
import { cleanLog, listForProvider, pageForLog } from "../api/messageApi";
import type { MessageLog, MessageProvider } from "../api/types";
import ReProviderFilterBar from "../components/ReProviderFilterBar.vue";
import ReLogDetailDialog from "../components/ReLogDetailDialog.vue";
import ReStationMessage from "@repo/ui/re-station-message";
import ReTime from "@repo/ui/re-time";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn } from "@repo/ui/re-table";
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

/** 推送日志表列配置（原模板里的 el-table-column 收敛到数组；带 #default 的列配 slot + #col-<slot>） */
const logColumns: ReTableColumn[] = [
  { prop: "sysMessageLogTarget", label: "接收人", minWidth: 140 },
  { prop: "sysMessageLogChannel", label: "渠道", width: 110, slot: "sysMessageLogChannel" },
  { prop: "status", label: "状态", width: 90, slot: "status" },
  { prop: "readStatus", label: "阅读", width: 90, slot: "readStatus" },
  { prop: "sysMessageLogSubject", label: "主题", minWidth: 140, showOverflowTooltip: true, slot: "sysMessageLogSubject" },
  { prop: "sysMessageLogContent", label: "内容", minWidth: 200, showOverflowTooltip: true },
  { prop: "cost", label: "耗时", width: 100, slot: "cost" },
  { prop: "createTime", label: "发送时间", width: 170 },
  { prop: "actions", label: "操作", width: 90, fixed: "right", slot: "actions" },
];

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
    message.error((e as Error)?.message ?? "日志列表加载失败");
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
    message.error((e as Error)?.message ?? "提供商列表加载失败");
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
    message.success(`已清理 ${res?.data ?? 0} 条日志`);
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
  <div class="log-page">
    <ReSectionHead
      class="log-head"
      title="推送日志"
      description="查看各渠道的推送记录与发送结果"
    >
      <template #actions>
        <ReStationMessage />
      </template>
    </ReSectionHead>

    <!-- 概览统计：总数 / 成功 / 失败 / 未读，窄屏 2 列 -->
    <div class="stat-grid" role="group" aria-label="推送日志概览">
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">日志总数</span>
        <span class="stat-value">{{ pagination.total }}</span>
        <span class="stat-trend">累计发送</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <span class="stat-label">成功</span>
        <span class="stat-value">{{ list.filter((r) => r.sysMessageCode === "SUCCESS").length }}</span>
        <span class="stat-trend">当前页成功</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-error)">
        <span class="stat-label">失败</span>
        <span class="stat-value">{{ list.filter((r) => r.sysMessageCode === "FAILURE").length }}</span>
        <span class="stat-trend">当前页失败</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-info)">
        <span class="stat-label">未读</span>
        <span class="stat-value">{{ list.filter((r) => r.sysMessageReadStatus === 0).length }}</span>
        <span class="stat-trend">当前页未读</span>
      </div>
    </div>

    <!-- 站内消息入口 + 提供商上下文切换（ReProviderFilterBar 保持原样） -->
    <ReProviderFilterBar
      v-model:provider-id="query.sysMessageProviderId"
      title="推送日志"
      :icon="Document"
      :providers="providers"
      :current-provider="currentProvider"
      @change="handleProviderChange"
    >
      <ReButton type="danger" size="small" :icon="Delete" @click="handleClean">清理日志</ReButton>
    </ReProviderFilterBar>

    <!-- 列表区域：koi 卡片外壳包裹 ReTable；列插槽 / 搜索协议 / el-pagination 原样保留 -->
    <div class="table-card">
      <div class="filter-bar">
        <el-input
          v-model="query.sysMessageLogTarget"
          placeholder="接收人"
          clearable
          class="filter-field"
          @keyup.enter="handleReset"
        />
        <el-select v-model="query.sysMessageCode" placeholder="返回码" clearable class="filter-field filter-field--sm">
          <el-option label="成功" value="SUCCESS" />
          <el-option label="失败" value="FAILURE" />
        </el-select>
        <el-select
          v-model="query.sysMessageReadStatus"
          placeholder="阅读状态"
          clearable
          class="filter-field filter-field--sm"
        >
          <el-option label="已读" :value="1" />
          <el-option label="未读" :value="0" />
        </el-select>
        <div class="filter-spacer" />
        <ReButton type="primary" size="small" :icon="Search" @click="loadList">查询</ReButton>
        <ReButton size="small" :icon="Refresh" @click="handleReset">重置</ReButton>
      </div>
      <ReTable
        :loading="loading"
        :data="list"
        :columns="logColumns"
        stripe
        class="log-table"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        :settings="{ border: false }"
      >
        <template #col-sysMessageLogChannel="{ row }">
          <el-tag effect="plain">{{ row.sysMessageLogChannel }}</el-tag>
        </template>
        <template #col-status="{ row }">
          <el-tag
            :type="row.sysMessageCode === 'SUCCESS' ? 'success' : 'danger'"
            effect="plain"
          >
            {{ row.sysMessageCode === "SUCCESS" ? "成功" : "失败" }}
          </el-tag>
        </template>
        <template #col-readStatus="{ row }">
          <template v-if="row.sysMessageTrackToken">
            <el-tag
              :type="row.sysMessageReadStatus === 1 ? 'success' : 'info'"
              effect="plain"
            >
              {{ row.sysMessageReadStatus === 1 ? "已读" : "未读" }}
            </el-tag>
          </template>
          <span v-else class="log-dim">-</span>
        </template>
        <template #col-sysMessageLogSubject="{ row }">
          <span>{{ row.sysMessageLogSubject ?? "-" }}</span>
        </template>
        <template #col-cost="{ row }">
          <span class="log-dim"><ReTime :value="costMs(row.sysMessageCost)" format="duration" placeholder="—" /></span>
        </template>
        <template #col-actions="{ row }">
          <el-button link type="primary" @click="showDetail(row)">详情</el-button>
        </template>
      </ReTable>
      <!-- 表格空态：ReEmpty 扁平呈现 -->
      <div v-if="!list.length && !loading" class="table-empty">
        <ReEmpty description="暂无可展示的推送日志，调整筛选条件后再试" />
      </div>
      <div class="pager">
        <el-pagination
          :total="pagination.total"
          :current-page="pagination.page"
          :page-size="pagination.pageSize"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 日志详情弹窗 -->
    <ReLogDetailDialog v-model:visible="detailVisible" v-model:model="detail" />
  </div>
</template>

<style scoped lang="scss">
.log-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 4px;
}

/* ===== 概览条 ===== */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  position: relative;
  overflow: hidden;
  padding: 14px 16px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-label {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--text-secondary);
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.stat-trend {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 筛选工具条 ===== */
.filter-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 0 12px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 4px;
}
.filter-field {
  width: 220px;
}
.filter-field--sm {
  width: 150px;
}
.filter-spacer {
  flex: 1;
}

/* ===== 表格壳 ===== */
.table-card {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.log-table {
  flex: 1 1 auto;
  min-height: 0;
}
.log-dim {
  color: var(--text-secondary);
  font-size: 12px;
}
.table-empty {
  box-sizing: border-box;
  width: 100%;
  padding: 12px 0 4px;
}
.pager {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

/* ===== 响应式：移动端 2 列概览 + 筛选占满 ===== */
@media (max-width: 768px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .filter-field {
    width: 100%;
  }
  .filter-field--sm {
    width: 48%;
  }
  .filter-spacer {
    flex-basis: 100%;
  }
}

/* ===== 减少动态效果 ===== */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    transition: none;
  }
  .stat-card:hover {
    transform: none;
  }
}
</style>
