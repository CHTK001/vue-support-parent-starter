<script setup lang="ts">
/**
 * 登录日志管理页面 —— 查看系统登录日志，只读，不提供删除功能
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { ArrowRight, Download, Stamp, UserFilled } from "@element-plus/icons-vue";
import { pageForUserLog, exportUserLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import { defineAsyncComponent } from "vue";
/** ReIpText 的 default 已是异步组件，不能当函数调用（`m.default()` 会抛 not a function） */
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default));
/** 耗时着色文本：绿 / 黄 / 红标识登录快慢 */
const ReCostText = defineAsyncComponent(() => import("@repo/ui/re-cost-text").then((m) => m.default));
/** 品牌图标（浏览器 / 操作系统）：走 Iconify logos 集合 */
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default));

const query = ref<{ page: number; pageSize: number; sysLogUsername?: string; sysLogStatus?: number }>({
  page: 1,
  pageSize: 20,
});

const searchFilters = computed(() => [
  { key: 'sysLogUsername', label: '用户名', type: 'input' as const, placeholder: '请输入' },
  {
    key: 'sysLogStatus', label: '状态', type: 'select' as const, placeholder: '请选择',
    options: [
      { label: '成功', value: 1 },
      { label: '失败', value: 0 },
    ],
  },
]);

function handleReset() {
  query.value = { page: 1, pageSize: 20 };
  tableRef.value?.reload();
}

/* 导出登录日志 */
const exporting = ref(false);
async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportUserLog({
      sysLogUsername: query.value.sysLogUsername,
      sysLogStatus: query.value.sysLogStatus,
    });
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `登录日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

/** 登录失败行：红色文字高亮 */
function rowClassName({ row }: { row: Record<string, unknown> }): string {
  return row.sysLogStatus === 0 ? "login-fail-row" : "";
}

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const queryParams = {
    page,
    pageSize,
    sysLogUsername: (params.sysLogUsername as string) || undefined,
    sysLogStatus: params.sysLogStatus === "" || params.sysLogStatus == null ? undefined : Number(params.sysLogStatus),
  };
  const res = await pageForUserLog(queryParams);
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

/* 详情弹窗 */
const detailVisible = ref(false);
const currentLog = ref<Record<string, unknown> | null>(null);
function openDetail(row: Record<string, unknown>) {
  currentLog.value = row;
  detailVisible.value = true;
}

/** 浏览器品牌图标（Iconify logos，未识别返回空） */
function browserIcon(name?: unknown): string {
  const n = String(name ?? "").toLowerCase();
  if (!n || n === "unknown") return "";
  if (n.includes("chrome") || n.includes("chromium")) return "logos:chrome";
  if (n.includes("edge")) return "logos:microsoft-edge";
  if (n.includes("firefox") || n.includes("gecko")) return "logos:firefox";
  if (n.includes("safari")) return "logos:safari";
  if (n.includes("opera")) return "logos:opera";
  if (n.includes("brave")) return "logos:brave";
  return "";
}

/** 操作系统品牌图标（Iconify logos，未识别返回空） */
function osIcon(name?: unknown): string {
  const n = String(name ?? "").toLowerCase();
  if (!n || n === "unknown") return "";
  if (n.includes("windows")) return "logos:microsoft-windows-icon";
  if (n.includes("android")) return "logos:android-icon";
  if (n.includes("linux") || n.includes("ubuntu")) return "logos:linux-tux";
  if (
    n.includes("mac") ||
    n.includes("darwin") ||
    n.includes("ios") ||
    n.includes("iphone") ||
    n.includes("ipad")
  ) {
    return "logos:apple";
  }
  return "";
}

const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "用户名", width: 120, slot: "username" },
  { prop: "sysLogLoginType", label: "登录方式", width: 100 },
  { prop: "sysLogIp", label: "IP / 归属地", minWidth: 140, slot: "ip" },
  { prop: "sysLogBrowser", label: "浏览器", minWidth: 140, slot: "info" },
  { prop: "sysLogUa", label: "User-Agent", minWidth: 180, slot: "ua" },
  { prop: "sysLogFingerprint", label: "指纹", width: 125, slot: "fingerprint" },
  { prop: "sysLogCost", label: "耗时(ms)", width: 100, slot: "cost", align: "center" },
  { prop: "sysLogStatus", label: "状态", width: 90, slot: "status" },
  { prop: "sysLogMessage", label: "失败原因", minWidth: 150, slot: "message" },
  { prop: "sysDeptName", label: "部门", width: 110, slot: "dept" },
  { prop: "createTime", label: "登录时间", width: 170 },
  { prop: "action", label: "操作", width: 90, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="system-page">
      <ReTable
        ref="tableRef"
        table-id="system-userlog"
        :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
        :search-gap="16"
        v-model:search-model="query"
        @search-reset="handleReset"
        :loader="loadLogs"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysLogId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        :row-class-name="rowClassName"
      >
        <template #toolbar>
          <ReButton type="success" text icon="Download" :loading="exporting" @click="handleExport">导出</ReButton>
        </template>
        <template #username="{ row }">
          <span class="log-content-link" @click="openDetail(row)">{{ row.sysLogUsername ?? '-' }}</span>
        </template>
        <template #status="{ row }">
          <el-tooltip
            v-if="row.sysLogStatus === 0 && row.sysLogMessage"
            :content="row.sysLogMessage"
            placement="top"
          >
            <ReTag type="danger" size="small" effect="plain">失败</ReTag>
          </el-tooltip>
          <ReTag v-else :type="row.sysLogStatus === 1 ? 'success' : 'danger'" size="small" effect="plain">
            {{ row.sysLogStatus === 1 ? "成功" : "失败" }}
          </ReTag>
        </template>
        <template #message="{ row }">
          <span v-if="row.sysLogStatus === 0" class="fail-msg">{{ row.sysLogMessage || '-' }}</span>
          <span v-else class="fail-msg--blank">-</span>
        </template>
        <template #ip="{ row }">
          <ReIpText :ip="row.sysLogIp ?? ''" :address="row.sysLogAddress ?? ''" :third-party-fix="true" :clickable="true" />
        </template>
        <template #info="{ row }">
          <div class="flex flex-col gap-0.5 text-xs text-[--el-text-color-secondary]">
            <span>{{ row.sysLogBrowser ?? '--' }}</span>
            <span>{{ row.sysLogSystem ?? '--' }}</span>
          </div>
        </template>
        <template #cost="{ row }">
          <ReCostText :cost="row.sysLogCost == null ? null : Number(row.sysLogCost)" />
        </template>
        <template #ua="{ row }">
          <el-tooltip :content="row.sysLogUa ?? '-'" placement="top" :show-after="200">
            <span class="ua-cell">{{ row.sysLogUa ?? '-' }}</span>
          </el-tooltip>
        </template>
        <template #fingerprint="{ row }">
          <el-tooltip
            v-if="row.sysLogFingerprint"
            :content="row.sysLogFingerprint"
            placement="top"
            :show-after="200"
          >
            <span class="fp-cell">
              <el-icon class="fp-cell__icon"><Stamp /></el-icon>
              <span class="fp-cell__text">{{ String(row.sysLogFingerprint).slice(0, 8) }}</span>
            </span>
          </el-tooltip>
          <span v-else class="fp-empty">-</span>
        </template>
        <template #dept="{ row }">
          <span v-if="row.sysDeptName">{{ row.sysDeptName }}</span>
          <span v-else class="dept-empty">暂无</span>
        </template>
        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="View" @click="openDetail(row)">详情</ReButton>
        </template>
      </ReTable>

    <!-- 登录日志详情弹窗（参考 UI 图） -->
    <ReDialog
      v-model="detailVisible"
      class="userlog-detail-dialog"
      width="640px"
      headless
      :show-footer="false"
      :footer-hidden="true"
    >
      <div v-if="currentLog" class="ul-detail">
        <!-- 头部：圆形图标 + 标题 + 副标题 -->
        <header class="ul-detail__header">
          <span class="ul-detail__icon">
            <el-icon :size="24"><UserFilled /></el-icon>
          </span>
          <div class="ul-detail__heading">
            <h3 class="ul-detail__title">登录日志详情</h3>
            <p class="ul-detail__subtitle">用户 {{ currentLog.sysLogUsername || '-' }} 的登录记录</p>
          </div>
        </header>

        <!-- 状态 + 耗时 -->
        <div class="ul-detail__summary">
          <ReTag
            round
            effect="light"
            size="large"
            :type="currentLog.sysLogStatus === 1 ? 'success' : 'danger'"
          >
            {{ currentLog.sysLogStatus === 1 ? "登录成功" : "登录失败" }}
          </ReTag>
          <span
            class="ul-detail__cost"
            :class="{ 'ul-detail__cost--fail': currentLog.sysLogStatus === 0 }"
          >
            {{ currentLog.sysLogCost == null ? "-" : `${currentLog.sysLogCost}ms` }}
          </span>
        </div>

        <div class="ul-detail__divider"></div>

        <!-- 2×2 信息卡 -->
        <div class="ul-detail__grid">
          <div class="ul-detail__cell">
            <span class="ul-detail__cell-label">
              登录时间
              <el-icon class="ul-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="ul-detail__cell-value">
              <span class="ul-detail__cell-text">{{ currentLog.createTime || '-' }}</span>
            </span>
          </div>
          <div class="ul-detail__cell">
            <span class="ul-detail__cell-label">
              登录IP
              <el-icon class="ul-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="ul-detail__cell-value">
              <span class="ul-detail__cell-text">{{ currentLog.sysLogIp || '-' }}</span>
            </span>
          </div>
          <div class="ul-detail__cell">
            <span class="ul-detail__cell-label">
              浏览器
              <el-icon class="ul-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="ul-detail__cell-value">
              <ReIcon
                v-if="browserIcon(currentLog.sysLogBrowser)"
                :name="browserIcon(currentLog.sysLogBrowser)"
                :size="18"
                class="ul-detail__cell-icon"
              />
              <span class="ul-detail__cell-text">{{ currentLog.sysLogBrowser || '-' }}</span>
            </span>
          </div>
          <div class="ul-detail__cell">
            <span class="ul-detail__cell-label">
              操作系统
              <el-icon class="ul-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="ul-detail__cell-value">
              <ReIcon
                v-if="osIcon(currentLog.sysLogSystem)"
                :name="osIcon(currentLog.sysLogSystem)"
                :size="18"
                class="ul-detail__cell-icon"
              />
              <span class="ul-detail__cell-text">{{ currentLog.sysLogSystem || '-' }}</span>
            </span>
          </div>
        </div>

        <!-- 浏览器指纹 -->
        <div class="ul-detail__block">
          <span class="ul-detail__block-label">浏览器指纹：</span>
          <span class="ul-detail__block-value">{{ currentLog.sysLogFingerprint || '-' }}</span>
          <el-icon class="ul-detail__block-chevron"><ArrowRight /></el-icon>
        </div>

        <!-- UserAgent -->
        <div class="ul-detail__block ul-detail__block--ua">
          <span class="ul-detail__block-label">UserAgent</span>
          <p class="ul-detail__ua">{{ currentLog.sysLogUa || '-' }}</p>
        </div>

        <!-- 失败原因 -->
        <div v-if="currentLog.sysLogStatus === 0" class="ul-detail__fail">
          <span class="ul-detail__fail-label">失败原因</span>
          <span class="ul-detail__fail-text">{{ currentLog.sysLogMessage || '-' }}</span>
        </div>

        <!-- 底部 -->
        <footer class="ul-detail__footer">
          <span class="ul-detail__address">
            登录地点：{{ currentLog.sysLogAddress || "未知" }}
          </span>
          <ReButton class="ul-detail__close" @click="detailVisible = false">关闭</ReButton>
        </footer>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
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

:deep(.login-fail-row) {
  td {
    color: var(--el-color-danger);
    background: var(--el-color-danger-light-9) !important;
  }
}

.fail-msg {
  color: var(--el-color-danger);
  font-size: 12px;
}
.fail-msg--blank {
  color: var(--el-text-color-placeholder);
}

.log-content-link {
  color: var(--el-color-primary);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
}

.ua-cell {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.dept-empty {
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.fp-cell {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: default;

  &__icon {
    font-size: 14px;
    color: var(--el-color-primary);
  }

  &__text {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
  }
}

.fp-empty {
  color: var(--el-text-color-placeholder);
}

/* ==================== 登录日志详情弹窗 ==================== */
.ul-detail {
  padding: 22px 24px 20px;
}

.ul-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 44px; /* 给右上角关闭圆钮留位 */
}

.ul-detail__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 46px;
  height: 46px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-color-white);
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-light-3)
  );
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-primary) 26%, transparent);
}

.ul-detail__heading {
  min-width: 0;
}

.ul-detail__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ul-detail__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ul-detail__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.ul-detail__cost {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-success);
}

.ul-detail__cost--fail {
  color: var(--el-color-danger);
}

.ul-detail__divider {
  height: 1px;
  margin: 16px 0;
  background: var(--el-border-color-lighter);
}

.ul-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.ul-detail__cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
}

.ul-detail__cell-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.ul-detail__cell-arrow {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.ul-detail__cell-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ul-detail__cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ul-detail__cell-icon {
  flex: none;
}

.ul-detail__block {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}

.ul-detail__block--ua {
  display: block;
}

.ul-detail__block-label {
  flex: none;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.ul-detail__block-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ul-detail__block-chevron {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.ul-detail__ua {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-all;
}

.ul-detail__fail {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-danger-light-9);
  font-size: 13px;
}

.ul-detail__fail-label {
  flex: none;
  color: var(--el-color-danger);
}

.ul-detail__fail-text {
  color: var(--el-color-danger);
  word-break: break-all;
}

.ul-detail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ul-detail__address {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.ul-detail__footer :deep(.ul-detail__close) {
  height: 36px;
  padding: 0 22px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
}

@media (max-width: 640px) {
  .ul-detail__grid {
    grid-template-columns: 1fr;
  }
}
</style>

<!-- 详情弹窗为 headless（teleport 到 body），弹窗外壳样式需非 scoped -->
<style>
.userlog-detail-dialog {
  position: relative;
  overflow: hidden;
  border-radius: var(--el-dialog-border-radius, var(--el-radius-xl, 16px));
}
</style>
