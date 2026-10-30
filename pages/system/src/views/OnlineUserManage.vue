<script setup lang="ts">
/**
 * 在线用户管理页面 —— 查看当前在线用户（仅管理员及以上）
 *
 * 数据来自 OAuth 服务端（后端 SysOnlineController /v2/online/* 调用
 * AuthClientExecute 拉取在线名单，接口层 @Permission(role=ADMIN/SUPER_ADMIN)
 * 拦截非管理员）。页面只读展示 + 强制下线，不做新增/编辑。
 *
 * 登录历史：后端按 sys_user_log 聚合，列表行内直接带「全部登录 IP」与
 * 「最近 30 天登录情况」；点击稀疏条/操作列时钟按钮再拉完整时间轴。
 */
import { message } from "@repo/core";
import { computed, ref } from "vue";
import { ElMessageBox } from "element-plus";

import { countOnline, getOnlineLoginHistory, kickUser, listOnline } from "../api/systemApi";
import type { OnlineLoginDay, OnlineLoginHistory, OnlineLoginIp, OnlineUser } from "../api/types";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import ReTable from "@repo/ui/re-table";

/** IP 折叠阈值：超过这个数量用「+N」收进 popover */
const IP_PREVIEW_COUNT = 2;
/** 登录时间轴窗口天数（与后端默认值保持一致） */
const LOGIN_WINDOW_DAYS = 30;

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

/* ==================== 全部登录 IP ==================== */

/** 行的全部登录 IP：优先后端聚合结果，缺失时退回当前会话 IP */
function loginIpsOf(row: OnlineUser): OnlineLoginIp[] {
  const list = (row.loginIps ?? []).filter((item) => !!item?.ip);
  if (list.length) return list;
  if (row.ip) return [{ ip: row.ip, address: row.address }];
  return [];
}

/** 折叠后展示的 IP（默认前两个） */
function previewIps(row: OnlineUser): OnlineLoginIp[] {
  return loginIpsOf(row).slice(0, IP_PREVIEW_COUNT);
}

/** 被折叠的 IP 数量 */
function hiddenIpCount(row: OnlineUser): number {
  return Math.max(0, loginIpsOf(row).length - IP_PREVIEW_COUNT);
}

/* ==================== 最近 30 天登录 ==================== */

/** 12 个月内的日期键补零，避免 toISOString 的时区偏移 */
function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

interface DayCell {
  date: string;
  total: number;
  success: number;
  fail: number;
  ips: string[];
}

/** 行 → 30 个连续日期格子（无记录的日期补 0） */
function buildDayCells(row: OnlineUser): DayCell[] {
  const recorded = new Map<string, OnlineLoginDay>();
  for (const day of row.loginDays ?? []) {
    if (day?.date) recorded.set(day.date, day);
  }
  const today = new Date();
  const cells: DayCell[] = [];
  for (let i = LOGIN_WINDOW_DAYS - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dayKey(date);
    const hit = recorded.get(key);
    cells.push({
      date: key,
      total: hit?.total ?? 0,
      success: hit?.success ?? 0,
      fail: hit?.fail ?? 0,
      ips: hit?.ips ?? [],
    });
  }
  return cells;
}

/**
 * 行 → 日期格子缓存。
 * ReTable 每次刷新都会给新行对象，WeakMap 随旧行回收，不需要手动清理。
 */
const dayCellsCache = new WeakMap<OnlineUser, DayCell[]>();

function dayCellsOf(row: OnlineUser): DayCell[] {
  const cached = dayCellsCache.get(row);
  if (cached) return cached;
  const cells = buildDayCells(row);
  dayCellsCache.set(row, cells);
  return cells;
}

/** 格子强度：0 无登录，1~4 逐级加深 */
function cellLevel(cell: DayCell): number {
  if (!cell.total) return 0;
  return Math.min(4, cell.total);
}

/** 30 天登录总次数 */
function daysTotal(row: OnlineUser): number {
  return dayCellsOf(row).reduce((sum, cell) => sum + cell.total, 0);
}

/** 格子悬浮说明 */
function cellTip(cell: DayCell): string {
  if (!cell.total) return `${cell.date} 无登录`;
  const parts = [`${cell.date} 登录 ${cell.total} 次`];
  if (cell.success) parts.push(`成功 ${cell.success}`);
  if (cell.fail) parts.push(`失败 ${cell.fail}`);
  if (cell.ips.length) parts.push(cell.ips.join(", "));
  return parts.join(" · ");
}

/* ==================== 登录时间轴抽屉 ==================== */

const historyVisible = ref(false);
const historyLoading = ref(false);
const historyUser = ref<OnlineUser | null>(null);
const history = ref<OnlineLoginHistory | null>(null);

/** 只保留有登录记录的日期，并倒序（最近在前） */
const historyDays = computed<OnlineLoginDay[]>(() =>
  (history.value?.items ?? []).filter((day) => (day.total ?? 0) > 0).slice().reverse(),
);

/** 打开某用户的登录时间轴 */
async function openHistory(row: OnlineUser) {
  const username = (row.username ?? "").trim();
  if (!username) {
    message.warning("该用户缺少用户名，无法查询登录时间轴");
    return;
  }
  historyUser.value = row;
  historyVisible.value = true;
  historyLoading.value = true;
  history.value = null;
  try {
    const res = await getOnlineLoginHistory({ username, days: LOGIN_WINDOW_DAYS });
    history.value = res?.data ?? null;
  } catch (e) {
    message.error((e as Error)?.message ?? "加载登录时间轴失败");
    history.value = null;
  } finally {
    historyLoading.value = false;
  }
}

/** 星期文案 */
function weekdayOf(date?: string): string {
  if (!date) return "";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()] ?? "";
}

/** 单日节点色：全成功 / 有成功有失败 / 全失败 */
function dayTone(day: OnlineLoginDay): "success" | "warning" | "danger" {
  const total = day.total ?? 0;
  const fail = day.fail ?? 0;
  if (!fail) return "success";
  if (fail >= total) return "danger";
  return "warning";
}

const columns: ReTableColumn[] = [
  { prop: "username", label: "用户名", width: 130, slot: "username" },
  { prop: "nickname", label: "昵称", width: 120 },
  { prop: "deptName", label: "部门", width: 120, slot: "dept" },
  { prop: "ip", label: "IP / 归属地", minWidth: 180, slot: "ip" },
  { prop: "browser", label: "浏览器 / 系统", minWidth: 150, slot: "info" },
  { prop: "loginType", label: "登录方式", width: 100, slot: "loginType" },
  { prop: "loginTime", label: "登录时间", width: 165 },
  { prop: "lastAccessTime", label: "最后访问", width: 165 },
  { prop: "loginDays", label: "近 30 天登录", width: 200, slot: "days" },
  { prop: "action", label: "操作", width: 120, slot: "action", fixed: "right", align: "center" },
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
          <div v-if="loginIpsOf(row as OnlineUser).length" class="online-ip__line">
            <span
              v-for="(item, idx) in previewIps(row as OnlineUser)"
              :key="item.ip"
              class="online-ip__ip"
              :title="item.address ? `${item.ip}（${item.address}）` : item.ip"
            >{{ item.ip }}<span v-if="idx < previewIps(row as OnlineUser).length - 1" class="online-ip__sep">,</span></span>
            <el-popover
              v-if="hiddenIpCount(row as OnlineUser) > 0"
              placement="bottom-start"
              :width="340"
              trigger="click"
              popper-class="online-ip-popper"
            >
              <template #reference>
                <button
                  type="button"
                  class="online-ip__more"
                  :aria-label="`展开全部 ${loginIpsOf(row as OnlineUser).length} 个登录 IP`"
                >+{{ hiddenIpCount(row as OnlineUser) }}</button>
              </template>
              <div class="ip-pop">
                <div class="ip-pop__title">全部登录 IP（{{ loginIpsOf(row as OnlineUser).length }} 个）</div>
                <div class="ip-pop__list">
                  <div v-for="item in loginIpsOf(row as OnlineUser)" :key="item.ip" class="ip-pop__item">
                    <div class="ip-pop__row">
                      <span class="ip-pop__ip">{{ item.ip }}</span>
                      <ReTag v-if="item.ip === row.ip" size="small" effect="plain" type="success">当前</ReTag>
                    </div>
                    <div class="ip-pop__meta">
                      <span v-if="item.address" class="ip-pop__addr">{{ item.address }}</span>
                      <span v-if="item.total" class="ip-pop__count">登录 {{ item.total }} 次</span>
                      <span v-if="item.lastTime" class="ip-pop__time">最近 {{ formatTime(item.lastTime) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </el-popover>
          </div>
          <span v-else class="online-empty">-</span>
          <span v-if="row.address" class="online-ip__addr">{{ row.address }}</span>
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
      <template #days="{ row }">
        <div class="online-days">
          <button
            type="button"
            class="online-days__strip"
            :aria-label="`查看 ${row.username ?? ''} 最近 ${LOGIN_WINDOW_DAYS} 天登录时间轴`"
            @click="openHistory(row as OnlineUser)"
          >
            <span
              v-for="cell in dayCellsOf(row as OnlineUser)"
              :key="cell.date"
              class="online-days__cell"
              :class="[`is-lv${cellLevel(cell)}`, { 'is-mixed': cell.fail > 0 && cell.success > 0, 'is-danger': cell.fail > 0 && !cell.success }]"
              :title="cellTip(cell)"
            />
          </button>
          <span class="online-days__total">{{ daysTotal(row as OnlineUser) }} 次</span>
        </div>
      </template>
      <template #action="{ row }">
        <ReButton layout="square" icon="Clock" tip="登录时间轴" @click="openHistory(row as OnlineUser)" />
        <ReButton layout="square" type="danger" icon="SwitchButton" tip="强制下线" @click="handleKick(row as OnlineUser)" />
      </template>
    </ReTable>

    <el-drawer
      v-model="historyVisible"
      :title="`登录时间轴 · ${historyUser?.username ?? '-'}`"
      size="480px"
      class="online-history-drawer"
    >
      <div v-loading="historyLoading" class="history">
        <template v-if="history">
          <div class="history__summary">
            <div class="history__stat">
              <span class="history__num">{{ history.total ?? 0 }}</span>
              <span class="history__label">近 {{ history.windowDays ?? LOGIN_WINDOW_DAYS }} 天登录</span>
            </div>
            <div class="history__stat is-success">
              <span class="history__num">{{ history.success ?? 0 }}</span>
              <span class="history__label">成功</span>
            </div>
            <div class="history__stat is-danger">
              <span class="history__num">{{ history.fail ?? 0 }}</span>
              <span class="history__label">失败</span>
            </div>
          </div>
          <div class="history__meta">
            <span>最近成功登录：{{ formatTime(history.lastTime) }}</span>
            <span v-if="history.ips?.length">登录 IP {{ history.ips.length }} 个</span>
          </div>

          <div v-if="historyDays.length" class="history__timeline">
            <div
              v-for="day in historyDays"
              :key="day.date"
              class="history__item"
              :class="`is-${dayTone(day)}`"
            >
              <span class="history__dot" />
              <div class="history__head">
                <span class="history__date">{{ day.date }}</span>
                <span class="history__weekday">{{ weekdayOf(day.date) }}</span>
                <ReTag
                  size="small"
                  effect="plain"
                  :type="dayTone(day) === 'success' ? 'success' : dayTone(day) === 'danger' ? 'danger' : 'warning'"
                >{{ day.total ?? 0 }} 次</ReTag>
              </div>
              <div class="history__detail">
                <span v-if="day.success">成功 {{ day.success }}</span>
                <span v-if="day.fail" class="is-danger">失败 {{ day.fail }}</span>
                <span v-if="day.lastTime">最近 {{ formatTime(day.lastTime) }}</span>
              </div>
              <div v-if="day.ips?.length" class="history__ips">
                <code v-for="ip in day.ips" :key="ip" class="history__ip">{{ ip }}</code>
              </div>
            </div>
          </div>
          <div v-else class="history__empty">
            最近 {{ history.windowDays ?? LOGIN_WINDOW_DAYS }} 天没有登录记录
          </div>

          <div v-if="history.ips?.length" class="history__allips">
            <div class="history__allips-title">全部登录 IP（{{ history.ips.length }} 个）</div>
            <div v-for="item in history.ips" :key="item.ip" class="ip-pop__item">
              <div class="ip-pop__row">
                <span class="ip-pop__ip">{{ item.ip }}</span>
              </div>
              <div class="ip-pop__meta">
                <span v-if="item.address" class="ip-pop__addr">{{ item.address }}</span>
                <span v-if="item.total" class="ip-pop__count">登录 {{ item.total }} 次</span>
                <span v-if="item.lastTime" class="ip-pop__time">最近 {{ formatTime(item.lastTime) }}</span>
              </div>
            </div>
          </div>
        </template>
        <div v-else-if="!historyLoading" class="history__empty">没有查询到该用户的登录记录</div>
      </div>
    </el-drawer>
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
  min-width: 0;
}
.online-ip__line {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 2px;
}
.online-ip__ip {
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}
.online-ip__sep {
  color: var(--el-text-color-placeholder);
}
.online-ip__more {
  margin-left: 2px;
  padding: 0 5px;
  height: 18px;
  line-height: 16px;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 9px;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.online-ip__more:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
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

/* ==================== 登录 IP popover ==================== */
.ip-pop__title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.ip-pop__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 260px;
  overflow-y: auto;
}
.ip-pop__item {
  padding-bottom: 6px;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.ip-pop__item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}
.ip-pop__row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ip-pop__ip {
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ip-pop__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 2px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* ==================== 近 30 天稀疏条 ==================== */
.online-days {
  display: flex;
  align-items: center;
  gap: 8px;
}
.online-days__strip {
  display: flex;
  align-items: flex-end;
  gap: 1px;
  padding: 2px;
  background: none;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}
.online-days__strip:hover {
  background: var(--el-fill-color-light);
}
.online-days__cell {
  width: 4px;
  height: 16px;
  border-radius: 1px;
  background: var(--el-fill-color);
  transition: transform 0.12s;
}
.online-days__strip:hover .online-days__cell {
  transform: scaleY(1.08);
}
.online-days__cell.is-lv1 {
  background: color-mix(in srgb, var(--el-color-success) 30%, var(--el-fill-color));
}
.online-days__cell.is-lv2 {
  background: color-mix(in srgb, var(--el-color-success) 55%, var(--el-fill-color));
}
.online-days__cell.is-lv3 {
  background: color-mix(in srgb, var(--el-color-success) 80%, var(--el-fill-color));
}
.online-days__cell.is-lv4 {
  background: var(--el-color-success);
}
.online-days__cell.is-mixed {
  background: color-mix(in srgb, var(--el-color-warning) 70%, var(--el-fill-color));
}
.online-days__cell.is-danger {
  background: var(--el-color-danger);
}
.online-days__total {
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

/* ==================== 登录时间轴抽屉 ==================== */
.history {
  min-height: 120px;
  padding-right: 4px;
}
.history__summary {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.history__stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.history__num {
  font-size: 20px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}
.history__stat.is-success .history__num {
  color: var(--el-color-success);
}
.history__stat.is-danger .history__num {
  color: var(--el-color-danger);
}
.history__label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.history__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin: 12px 0 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.history__timeline {
  margin-top: 8px;
}
.history__item {
  position: relative;
  padding: 0 0 14px 20px;
}
.history__item::before {
  content: "";
  position: absolute;
  left: 5px;
  top: 14px;
  bottom: 0;
  width: 1px;
  background: var(--el-border-color-lighter);
}
.history__item:last-child::before {
  display: none;
}
.history__dot {
  position: absolute;
  left: 0;
  top: 6px;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-success) 15%, transparent);
}
.history__item.is-warning .history__dot {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-warning) 15%, transparent);
}
.history__item.is-danger .history__dot {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-danger) 15%, transparent);
}
.history__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.history__date {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.history__weekday {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.history__detail {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.history__detail .is-danger {
  color: var(--el-color-danger);
}
.history__ips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 5px;
}
.history__ip {
  padding: 0 5px;
  font-family: var(--el-font-family-mono, ui-monospace, Menlo, Consolas, monospace);
  font-size: 11px;
  line-height: 18px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 3px;
}
.history__empty {
  padding: 32px 0;
  font-size: 13px;
  text-align: center;
  color: var(--el-text-color-secondary);
}
.history__allips {
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.history__allips-title {
  margin-bottom: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}
.history__allips .ip-pop__item:last-child {
  border-bottom: none;
}
</style>
