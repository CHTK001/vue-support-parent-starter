<script setup lang="ts">
/**
 * 操作日志管理页面 —— 查看系统操作日志，只读，不提供删除功能
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化）。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { message } from "@repo/core";
import { computed, ref, defineAsyncComponent } from "vue";

import { ArrowRight, Document, Download, Refresh, Search, Stamp } from "@element-plus/icons-vue";
import { pageForSysLog, exportSysLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReTime from "@repo/ui/re-time";
import ReSelect from "@repo/ui/re-select";
import { costMs } from "@repo/utils";
/** ReIpText 的 default 已是异步组件，不能当函数调用（`m.default()` 会抛 not a function） */
const ReIpText = defineAsyncComponent(() => import("@repo/ui/re-ip-text").then((m) => m.default));
/** 耗时着色文本：绿 / 黄 / 红标识请求快慢 */
const ReCostText = defineAsyncComponent(() => import("@repo/ui/re-cost-text").then((m) => m.default));
/** 品牌图标（浏览器 / 操作系统）：走 Iconify logos 集合 */
const ReIcon = defineAsyncComponent(() => import("@repo/ui/re-icon").then((m) => m.default));

const query = ref<{ page: number; pageSize: number; sysLogUsername?: string; sysLogFrom?: string; sysLogStatus?: number }>({
  page: 1,
  pageSize: 20,
});

/** 日志级别筛选 */
const levelFilter = ref("");

const searchFilters = computed(() => [
  { key: 'sysLogUsername', label: '操作人', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysLogFrom', label: '模块', type: 'input' as const, placeholder: '请输入' },
  {
    key: 'sysLogStatus', label: '状态', type: 'select' as const, placeholder: '请选择',
    options: [
      { label: '成功', value: 1 },
      { label: '失败', value: 0 },
    ],
  },
  {
    key: 'level', label: '日志级别', type: 'select' as const, placeholder: '请选择',
    options: [
      { label: '全部', value: '' },
      { label: 'INFO', value: 'INFO' },
      { label: 'WARN', value: 'WARN' },
      { label: 'ERROR', value: 'ERROR' },
      { label: 'DEBUG', value: 'DEBUG' },
    ],
  },
]);

function handleReset() {
  query.value = { page: 1, pageSize: 20 };
  tableRef.value?.reload();
}

/* 导出日志 */
const exporting = ref(false);
async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportSysLog({
      sysLogUsername: query.value.sysLogUsername,
      sysLogFrom: query.value.sysLogFrom,
      sysLogStatus: query.value.sysLogStatus,
    });
    const url = URL.createObjectURL(blob as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `操作日志_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("导出成功");
  } catch (e) {
    message.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

/* 详情弹窗 */
const detailVisible = ref(false);
const currentLog = ref<Record<string, unknown> | null>(null);
function openDetail(row: Record<string, unknown>) {
  currentLog.value = row;
  detailVisible.value = true;
}

/** 请求参数 JSON 美化（解析失败则原样展示） */
function prettyParams(raw: unknown): string {
  if (!raw) return "-";
  const text = String(raw);
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** 请求方法标签配色 */
function methodTagType(method?: unknown): "primary" | "success" | "warning" | "danger" {
  const m = String(method ?? "").toUpperCase();
  if (m === "POST") return "success";
  if (m === "PUT" || m === "PATCH") return "warning";
  if (m === "DELETE") return "danger";
  return "primary";
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

/** IP：系统日志接口把 IP 放在 sysLogAddress（无 sysLogIp 字段） */
const detailIp = computed(() => {
  const v = currentLog.value?.sysLogIp || currentLog.value?.sysLogAddress;
  return String(v ?? "").trim() || "-";
});

/** 归属地：为空或与 IP 相同时显示「未知」 */
const detailAddress = computed(() => {
  const addr = String(currentLog.value?.sysLogAddress ?? "").trim();
  return addr && addr !== detailIp.value ? addr : "未知";
});

async function loadLogs({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForSysLog({
    page,
    pageSize,
    sysLogUsername: (params.sysLogUsername as string) || undefined,
    sysLogFrom: (params.sysLogFrom as string) || undefined,
    sysLogStatus: params.sysLogStatus === "" ? undefined : (params.sysLogStatus as number),
    level: (params.level as string) || undefined,
  });
  let list = (res?.data?.data ?? []) as Record<string, unknown>[];
  // 客户端兜底过滤（后端未返回 level 时）
  const lv = levelFilter.value || (params.level as string) || "";
  if (lv) list = list.filter((r: any) => (r.level || "") === lv);
  return { total: res?.data?.total ?? 0, data: list };
}

const tableRef = ref();

/**
 * 空态「刷新」按钮用：只重取当前页，不清空筛选条件。
 *
 * <p>与 handleReset 分开是刻意的——handleReset 是搜索区的「重置」，语义是丢掉条件；
 * 空态里用户表达的是「没看到东西，再取一次」，顺手把条件清掉会让人以为筛选失效。</p>
 */
function reload() {
  tableRef.value?.reload();
}

const columns: ReTableColumn[] = [
  { prop: "sysLogId", label: "ID", width: 70 },
  { prop: "sysLogUsername", label: "操作人", width: 110 },
  { prop: "sysLogFrom", label: "模块", width: 120 },
  { prop: "sysLogContent", label: "操作内容", minWidth: 220, slot: "content" },
  { prop: "level", label: "级别", width: 80, slot: "level", align: "center" },
  { prop: "sysLogUrl", label: "请求地址", minWidth: 180 },
  { prop: "sysLogIp", label: "IP / 归属地", minWidth: 140, slot: "ip" },
  { prop: "sysLogBrowser", label: "浏览器/系统", minWidth: 140, slot: "info" },
  { prop: "sysLogFingerprint", label: "指纹", width: 125, slot: "fingerprint" },
  { prop: "sysLogCost", label: "耗时(ms)", width: 100, slot: "cost", align: "center" },
  { prop: "sysLogStatus", label: "状态", width: 100, slot: "status" },
  { prop: "createTime", label: "操作时间", width: 170 },
  { prop: "action", label: "操作", width: 80, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="system-page">
      <ReTable
        ref="tableRef"
        table-id="system-syslog"
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
      >
        <template #toolbar>
          <ReButton type="success" text icon="Download" :loading="exporting" @click="handleExport">导出</ReButton>
        </template>
        <!--
          可操作空态：默认的 el-empty 只能看不能做。
          操作日志由切面在运行时写入，管理端造不出来，所以只给一个「刷新」出口，不给「新增」。
          语义用 Document（文档），与详情弹窗头部的图标同一个。
          page-empty 系列样式在 pages/system/src/styles/system-page.css 全局提供，本页不重复定义。
        -->
        <template #empty>
          <div class="page-empty">
            <span class="page-empty__icon"><ReIcon name="Document" :size="22" /></span>
            <span class="page-empty__title">还没有操作记录</span>
            <span class="page-empty__desc">系统操作审计会在这里汇总，含操作人、模块与结果；有人操作后自动出现。</span>
            <span class="page-empty__actions">
              <ReButton icon="Refresh" @click="reload">刷新</ReButton>
            </span>
          </div>
        </template>
        <template #content="{ row }">
          <span
            class="log-content-link"
            role="button"
            tabindex="0"
            @click="openDetail(row)"
            @keydown.enter.space="openDetail(row)"
          >{{ row.sysLogContent ?? '-' }}</span>
        </template>
        <template #level="{ row }">
          <span :class="['log-level-badge', `is-${(row.level || 'info').toLowerCase()}`]">
            {{ row.level || 'INFO' }}
          </span>
        </template>
        <template #status="{ row }">
          <ReTag :type="row.sysLogStatus === 1 ? 'success' : 'danger'" effect="plain" dot>
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
        <template #cost="{ row }">
          <ReCostText :cost="row.sysLogCost == null ? null : Number(row.sysLogCost)" />
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
        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="View" tip="详情" @click="openDetail(row)" />
        </template>
      </ReTable>

    <!-- 操作日志详情弹窗（与登录日志详情同款） -->
    <ReDialog
      v-model="detailVisible"
      class="syslog-detail-dialog"
      width="700px"
      headless
      :show-footer="false"
      :footer-hidden="true"
    >
      <div v-if="currentLog" class="sl-detail">
        <!-- 头部：圆形图标 + 标题 + 副标题 -->
        <header class="sl-detail__header">
          <span class="sl-detail__icon">
            <el-icon :size="24"><Document /></el-icon>
          </span>
          <div class="sl-detail__heading">
            <h3 class="sl-detail__title">操作日志详情</h3>
            <p class="sl-detail__subtitle">操作人 {{ currentLog.sysLogUsername || '-' }} 的操作记录</p>
          </div>
        </header>

        <!-- 状态 + 耗时 -->
        <div class="sl-detail__summary">
          <!--
            详情头部的状态胶囊比表格 chip 大一号，是页面里的状态主视觉，
            所以 effect 仍用 light（plain 的描边会和大号胶囊打架），只补状态点统一语义。
          -->
          <ReTag
            round
            effect="light"
            dot
            size="large"
            :type="currentLog.sysLogStatus === 1 ? 'success' : 'danger'"
          >
            {{ currentLog.sysLogStatus === 1 ? "操作成功" : "操作失败" }}
          </ReTag>
          <span
            class="sl-detail__cost"
            :class="{ 'sl-detail__cost--fail': currentLog.sysLogStatus === 0 }"
          >
            <ReTime :value="costMs(currentLog.sysLogCost)" format="duration" placeholder="-" />
          </span>
        </div>

        <div class="sl-detail__divider"></div>

        <!-- 2×2 信息卡 -->
        <div class="sl-detail__grid">
          <div class="sl-detail__cell">
            <span class="sl-detail__cell-label">
              操作时间
              <el-icon class="sl-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="sl-detail__cell-value">
              <span class="sl-detail__cell-text">{{ currentLog.createTime || '-' }}</span>
            </span>
          </div>
          <div class="sl-detail__cell">
            <span class="sl-detail__cell-label">
              IP地址
              <el-icon class="sl-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="sl-detail__cell-value">
              <span class="sl-detail__cell-text">{{ detailIp }}</span>
            </span>
          </div>
          <div class="sl-detail__cell">
            <span class="sl-detail__cell-label">
              浏览器
              <el-icon class="sl-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="sl-detail__cell-value">
              <ReIcon
                v-if="browserIcon(currentLog.sysLogBrowser)"
                :name="browserIcon(currentLog.sysLogBrowser)"
                :size="18"
                class="sl-detail__cell-icon"
              />
              <span class="sl-detail__cell-text">{{ currentLog.sysLogBrowser || '-' }}</span>
            </span>
          </div>
          <div class="sl-detail__cell">
            <span class="sl-detail__cell-label">
              操作系统
              <el-icon class="sl-detail__cell-arrow"><ArrowRight /></el-icon>
            </span>
            <span class="sl-detail__cell-value">
              <ReIcon
                v-if="osIcon(currentLog.sysLogSystem)"
                :name="osIcon(currentLog.sysLogSystem)"
                :size="18"
                class="sl-detail__cell-icon"
              />
              <span class="sl-detail__cell-text">{{ currentLog.sysLogSystem || '-' }}</span>
            </span>
          </div>
        </div>

        <!-- 模块 -->
        <div class="sl-detail__block">
          <span class="sl-detail__block-label">模块：</span>
          <span class="sl-detail__block-value">{{ currentLog.sysLogFrom || '-' }}</span>
          <el-icon class="sl-detail__block-chevron"><ArrowRight /></el-icon>
        </div>

        <!-- 操作内容 -->
        <div class="sl-detail__block sl-detail__block--text">
          <span class="sl-detail__block-label">操作内容</span>
          <p class="sl-detail__text">{{ currentLog.sysLogContent || '-' }}</p>
        </div>

        <!-- 请求地址 -->
        <div class="sl-detail__block">
          <span class="sl-detail__block-label">请求地址：</span>
          <ReTag
            v-if="currentLog.sysLogMethod"
            
            effect="light"
            :type="methodTagType(currentLog.sysLogMethod)"
          >
            {{ currentLog.sysLogMethod }}
          </ReTag>
          <span class="sl-detail__block-value">{{ currentLog.sysLogUrl || '-' }}</span>
        </div>

        <!-- 请求参数 -->
        <div class="sl-detail__block sl-detail__block--text">
          <span class="sl-detail__block-label">请求参数</span>
          <pre class="sl-detail__pre">{{ prettyParams(currentLog.sysLogParam) }}</pre>
        </div>

        <!-- 浏览器指纹 -->
        <div class="sl-detail__block">
          <span class="sl-detail__block-label">浏览器指纹：</span>
          <span class="sl-detail__block-value">{{ currentLog.sysLogFingerprint || '-' }}</span>
          <el-icon class="sl-detail__block-chevron"><ArrowRight /></el-icon>
        </div>

        <!-- 错误信息 -->
        <div v-if="currentLog.sysLogStatus === 0 && currentLog.sysLogError" class="sl-detail__fail">
          <span class="sl-detail__fail-label">错误信息</span>
          <span class="sl-detail__fail-text">{{ currentLog.sysLogError }}</span>
        </div>

        <!-- 底部 -->
        <footer class="sl-detail__footer">
          <span class="sl-detail__address">归属地：{{ detailAddress }}</span>
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
/*
  ReTable 的卡片外壳（描边 / 圆角 / 卡片投影 / focus-within 转主色）已由插件提供，
  页面不再自行补边：见 packages/ui ReTable/shared/table-vars.css 与
  ReTable.vue 的 `.re-table` / `.re-table--separated` 规则。
*/

/* ==================== 操作日志详情弹窗 ==================== */
.sl-detail {
  padding: 22px 24px 20px;
}

.sl-detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 44px; /* 给右上角关闭圆钮留位 */
}

.sl-detail__icon {
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
  /* 原这里有一层 0 6px 14px 的彩色投影，与 koi「卡片容器不加投影、只留焦点环与悬浮浮起」的规约冲突；
     徽标本身已有主色渐变，投影带不来信息，去掉后反而更干净。 */
}

.sl-detail__heading {
  min-width: 0;
}

.sl-detail__title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.sl-detail__subtitle {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.sl-detail__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
}

.sl-detail__cost {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-color-success);
}

.sl-detail__cost--fail {
  color: var(--el-color-danger);
}

.sl-detail__divider {
  height: 1px;
  margin: 16px 0;
  background: var(--el-border-color-lighter);
}

.sl-detail__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.sl-detail__cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
}

.sl-detail__cell-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.sl-detail__cell-arrow {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}

.sl-detail__cell-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.sl-detail__cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sl-detail__cell-icon {
  flex: none;
}

.sl-detail__block {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 14px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}

.sl-detail__block--text {
  display: block;
}

.sl-detail__block-label {
  flex: none;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.sl-detail__block-value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 14px;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sl-detail__block-chevron {
  flex: none;
  color: var(--el-text-color-placeholder);
}

.sl-detail__text {
  margin: 6px 0 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.sl-detail__pre {
  margin: 6px 0 0;
  max-height: 200px;
  overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-all;
}

.sl-detail__fail {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-danger-light-9);
  font-size: 13px;
}

.sl-detail__fail-label {
  flex: none;
  color: var(--el-color-danger);
}

.sl-detail__fail-text {
  color: var(--el-color-danger);
  word-break: break-all;
}

.sl-detail__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.sl-detail__address {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.sl-detail__footer :deep(.sl-detail__close) {
  height: 36px;
  padding: 0 22px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
}

@media (max-width: 640px) {
  .sl-detail__grid {
    grid-template-columns: 1fr;
  }
}

.log-content-link {
  color: var(--el-color-primary);
  cursor: pointer;
  /* 这个 span 是可点的：补圆角与过渡，键盘聚焦时才有东西可聚焦 */
  border-radius: var(--el-radius-xs, 4px);
  outline: none;
  transition: color var(--el-transition-duration-fast, 0.2s) ease;

  &:hover {
    text-decoration: underline;
  }
  /* 焦点环：键盘用户看不见系统光标时，靠这圈描边知道自己在哪 */
  &:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  }
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

/* 尊重系统「减少动态效果」偏好：把本页自己的过渡关掉
   （ReTable 的过渡由插件自带的同名媒体查询处理） */
@media (prefers-reduced-motion: reduce) {
  .log-content-link {
    transition: none;
  }
}

/* 日志级别徽章 */
.log-level-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
}
.log-level-badge.is-info,
.log-level-badge.is-i {
  background: color-mix(in srgb, #3b82f6 12%, transparent);
  color: #3b82f6;
}
.log-level-badge.is-warn,
.log-level-badge.is-w,
.log-level-badge.is-warning {
  background: color-mix(in srgb, #f59e0b 12%, transparent);
  color: #f59e0b;
}
.log-level-badge.is-error,
.log-level-badge.is-e {
  background: color-mix(in srgb, #ef4444 12%, transparent);
  color: #ef4444;
}
.log-level-badge.is-debug,
.log-level-badge.is-d {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-placeholder);
}
</style>

<!-- 详情弹窗为 headless（teleport 到 body），弹窗外壳样式需非 scoped -->
<style>
.syslog-detail-dialog {
  position: relative;
  overflow: hidden;
  border-radius: var(--el-dialog-border-radius, var(--el-radius-xl, 16px));
}
</style>

