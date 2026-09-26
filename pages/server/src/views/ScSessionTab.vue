<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ElDropdown, ElDropdownMenu, ElDropdownItem } from 'element-plus';
import { message } from '@repo/core';
import { getSessions, closeSession, queryHosts } from '../api';

/**
 * 会话审计 —— 审计日志工作台
 *
 * 视觉对齐 UI 稿：居中大卡片 + 顶部标题/刷新 + 三宫格统计 + 状态分段筛选
 * + 高级筛选条 + 审计明细表。颜色/圆角/边框全部走 koi（Element Plus）变量，
 * 随主题色与暗色模式自动切换。
 *
 * @author CH
 * @since 4.0.0
 */

/** 会话审计行 */
interface SessionRow {
  id: number;
  msTerminalSessionHostId?: number;
  msTerminalSessionHostName?: string;
  msTerminalSessionProtocol: string;
  msTerminalSessionUser?: string;
  msTerminalSessionClientIp?: string;
  msTerminalSessionConnectTime?: string;
  msTerminalSessionCloseTime?: string;
  msTerminalSessionStatus: string;
  msTerminalSessionCloseReason?: string;
}

/** 状态筛选值 */
type SessionStatus = '' | 'OPEN' | 'CLOSED';

/** 筛选表单 */
interface FilterForm {
  keyword: string;
  protocol: string;
  ip: string;
  status: SessionStatus;
}

/** 会话列表 */
const sessions = ref<SessionRow[]>([]);

/** 加载态 */
const loading = ref(false);

/** 主机名映射（主机名为空时兜底展示） */
const hostMap = ref<Record<number, string>>({});

/** 筛选表单（编辑中） */
const form = reactive<FilterForm>({ keyword: '', protocol: '', ip: '', status: '' });

/** 已应用筛选（点「查询」或状态快捷筛选后生效） */
const applied = reactive<FilterForm>({ keyword: '', protocol: '', ip: '', status: '' });

/** 详情抽屉 */
const detailVisible = ref(false);
const detailSession = ref<SessionRow | null>(null);

/** 协议下拉 */
const protocolOptions = [
  { label: '全部协议', value: '' },
  { label: 'SSH', value: 'SSH' },
  { label: 'RDP', value: 'RDP' },
  { label: 'VNC', value: 'VNC' },
];

/** 状态下拉 */
const statusOptions = [
  { label: '全部', value: '' },
  { label: '进行中', value: 'OPEN' },
  { label: '已结束', value: 'CLOSED' },
];

/** 统计：总连接数 / 进行中 / 已结束 */
const stats = computed(() => {
  const list = sessions.value;
  return {
    total: list.length,
    open: list.filter(s => s.msTerminalSessionStatus === 'OPEN').length,
    closed: list.filter(s => s.msTerminalSessionStatus === 'CLOSED').length,
  };
});

/** 应用筛选后的会话列表 */
const filteredSessions = computed(() => {
  const kw = applied.keyword.trim().toLowerCase();
  const ip = applied.ip.trim().toLowerCase();
  return sessions.value.filter(row => {
    if (applied.status && row.msTerminalSessionStatus !== applied.status) return false;
    if (applied.protocol && (row.msTerminalSessionProtocol || '').toUpperCase() !== applied.protocol) return false;
    if (ip && !(row.msTerminalSessionClientIp || '').toLowerCase().includes(ip)) return false;
    if (kw) {
      const hay = [
        row.msTerminalSessionHostName,
        row.msTerminalSessionUser,
        row.msTerminalSessionClientIp,
        hostMap.value[row.msTerminalSessionHostId ?? 0],
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(kw)) return false;
    }
    return true;
  });
});

/** 应用筛选（查询按钮） */
function applyFilters(): void {
  Object.assign(applied, form);
}

/**
 * 状态快捷筛选：下拉 / 分段控件共用；重复点击当前项回到「全部」
 *
 * @param value 目标状态
 */
function setQuickStatus(value: SessionStatus): void {
  const next: SessionStatus = form.status === value ? '' : value;
  form.status = next;
  applied.status = next;
}

/**
 * 状态下拉命令
 *
 * @param command 状态值
 */
function onStatusCommand(command: string): void {
  form.status = command as SessionStatus;
  applied.status = command as SessionStatus;
}

/**
 * 协议显示名
 *
 * @param protocol 协议
 */
function protocolLabel(protocol?: string): string {
  return (protocol || '').toUpperCase() || '-';
}

/**
 * 协议 pill 样式类
 *
 * @param protocol 协议
 */
function protoClass(protocol?: string): string {
  const v = (protocol || '').toLowerCase();
  return v === 'ssh' || v === 'rdp' || v === 'vnc' ? `is-${v}` : 'is-unknown';
}

/**
 * 状态显示名
 *
 * @param status 状态
 */
function statusLabel(status?: string): string {
  if (status === 'OPEN') return '进行中';
  if (status === 'CLOSED') return '已结束';
  return '全部';
}

/**
 * 状态文本（表格单元格）
 *
 * @param status 状态
 */
function statusText(status?: string): string {
  if (status === 'OPEN') return '进行中';
  if (status === 'CLOSED') return '已结束';
  return status || '-';
}

/**
 * 时间格式化（统一 yyyy-MM-dd HH:mm:ss）
 *
 * @param t 时间字符串
 */
function fmtTime(t?: string): string {
  if (!t) return '-';
  const s = String(t);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) return s.slice(0, 19);
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  const p = (n: number): string => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

/** 打开详情 */
function openDetail(row: SessionRow): void {
  detailSession.value = row;
  detailVisible.value = true;
}

/** 刷新会话记录 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const audit = await getSessions();
    sessions.value = audit ?? [];
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/**
 * 强制关闭会话
 *
 * @param row 会话
 */
async function onForceClose(row: SessionRow): Promise<void> {
  const name = row.msTerminalSessionHostName || row.msTerminalSessionClientIp || String(row.id);
  try {
    await message.confirm(`确认强制关闭「${name}」的会话？`, '强制关闭');
  } catch {
    return;
  }
  try {
    await closeSession(row.id);
    message.success('已关闭');
    await refresh();
  } catch (e) {
    message.error((e as Error).message);
  }
}

onMounted(async () => {
  const hosts = await queryHosts().catch(() => []);
  for (const h of hosts ?? []) {
    hostMap.value[h.id] = h.serverHostName;
  }
  await refresh();
});
</script>

<template>
  <div class="session-audit">
    <section class="sa-card">
      <!-- 统计 -->
      <div class="sa-stats">
        <div class="sa-stat">
          <div class="sa-stat__main">
            <span class="sa-stat__label"><i class="sa-stat__dot" />总连接数</span>
            <span class="sa-stat__value">{{ stats.total }}</span>
          </div>
          <span class="sa-stat__icon"><ReIcon name="Calendar" /></span>
        </div>
        <div class="sa-stat">
          <div class="sa-stat__main">
            <span class="sa-stat__label"><i class="sa-stat__dot" />进行中</span>
            <span class="sa-stat__value">{{ stats.open }}</span>
          </div>
          <span class="sa-stat__icon"><ReIcon name="CircleCheck" /></span>
        </div>
        <div class="sa-stat">
          <div class="sa-stat__main">
            <span class="sa-stat__label"><i class="sa-stat__dot" />已结束</span>
            <span class="sa-stat__value">{{ stats.closed }}</span>
          </div>
          <span class="sa-stat__icon"><ReIcon name="User" /></span>
        </div>
      </div>

      <!-- 状态快捷筛选 -->
      <div class="sa-segrow">
        <ElDropdown trigger="click" placement="bottom-start" @command="onStatusCommand">
          <span class="sa-pill" role="button" tabindex="0">
            <span>{{ statusLabel(form.status) }}</span>
            <ReIcon name="ArrowDown" />
          </span>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem v-for="o in statusOptions" :key="o.value" :command="o.value">{{ o.label }}</ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <div class="sa-seg">
          <button
            type="button"
            :class="['sa-seg__btn', { 'is-active': form.status === 'OPEN' }]"
            @click="setQuickStatus('OPEN')"
          >进行中</button>
          <button
            type="button"
            :class="['sa-seg__btn', { 'is-active': form.status === 'CLOSED' }]"
            @click="setQuickStatus('CLOSED')"
          >已结束</button>
        </div>
        <button
          class="sa-refresh"
          :class="{ 'is-loading': loading }"
          type="button"
          title="刷新"
          @click="refresh"
        >
          <ReIcon name="Refresh" />
          <span>刷新</span>
        </button>
      </div>

      <!-- 高级筛选 -->
      <div class="sa-filters">
        <ReInput
          v-model="form.keyword"
          class="sa-filters__search"
          placeholder="搜索主机/用户/IP"
          prefix-icon="Search"
          clearable
          @keyup.enter="applyFilters"
        />
        <ReSelect v-model="form.protocol" class="sa-filters__select" :options="protocolOptions" placeholder="协议" />
        <ReInput v-model="form.ip" class="sa-filters__select" placeholder="IP" clearable @keyup.enter="applyFilters" />
        <ReSelect v-model="form.status" class="sa-filters__select" :options="statusOptions" placeholder="状态" />
        <ReButton class="sa-filters__query" type="primary" @click="applyFilters">查询</ReButton>
      </div>

      <!-- 审计明细 -->
      <ReTable
        class="sa-table"
        :data="filteredSessions"
        :loading="loading"
        :pagination="true"
        :page-size="15"
        :toolbar="false"
        empty-text="暂无会话记录"
      >
        <ReTableColumn label="主机" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.msTerminalSessionHostName || hostMap[row.msTerminalSessionHostId ?? 0] || '-' }}
          </template>
        </ReTableColumn>
        <ReTableColumn label="协议" width="84">
          <template #default="{ row }">
            <span class="sa-proto" :class="protoClass(row.msTerminalSessionProtocol)">
              {{ protocolLabel(row.msTerminalSessionProtocol) }}
            </span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="用户" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.msTerminalSessionUser || row.msTerminalSessionClientIp || '-' }}
          </template>
        </ReTableColumn>
        <ReTableColumn label="连接时间" min-width="178">
          <template #default="{ row }">{{ fmtTime(row.msTerminalSessionConnectTime) }}</template>
        </ReTableColumn>
        <ReTableColumn label="关闭时间" min-width="178">
          <template #default="{ row }">{{ fmtTime(row.msTerminalSessionCloseTime) }}</template>
        </ReTableColumn>
        <ReTableColumn label="状态" width="96">
          <template #default="{ row }">
            <span class="sa-status" :class="{ 'is-open': row.msTerminalSessionStatus === 'OPEN' }">
              <i class="sa-status__dot" />{{ statusText(row.msTerminalSessionStatus) }}
            </span>
          </template>
        </ReTableColumn>
        <ReTableColumn label="操作" width="132">
          <template #default="{ row }">
            <button class="sa-link" type="button" @click="openDetail(row)">
              <i class="sa-link__dot" />详情
            </button>
            <button
              v-if="row.msTerminalSessionStatus === 'OPEN'"
              class="sa-link is-danger"
              type="button"
              @click="onForceClose(row)"
            >强制关闭</button>
          </template>
        </ReTableColumn>
      </ReTable>
    </section>

    <!-- 详情 -->
    <ReDrawer
      v-model="detailVisible"
      title="会话详情"
      direction="rtl"
      size="460px"
      destroy-on-close
      close-only
      :footer-hidden="true"
    >
      <template #content>
        <ReDescriptions v-if="detailSession" :column="1" border size="small">
          <ReDescriptionsItem label="主机">
            {{ detailSession.msTerminalSessionHostName || hostMap[detailSession.msTerminalSessionHostId ?? 0] || '-' }}
          </ReDescriptionsItem>
          <ReDescriptionsItem label="协议">{{ protocolLabel(detailSession.msTerminalSessionProtocol) }}</ReDescriptionsItem>
          <ReDescriptionsItem label="用户">{{ detailSession.msTerminalSessionUser || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="客户端 IP">{{ detailSession.msTerminalSessionClientIp || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="连接时间">{{ fmtTime(detailSession.msTerminalSessionConnectTime) }}</ReDescriptionsItem>
          <ReDescriptionsItem label="关闭时间">{{ fmtTime(detailSession.msTerminalSessionCloseTime) }}</ReDescriptionsItem>
          <ReDescriptionsItem label="状态">
            <span class="sa-status" :class="{ 'is-open': detailSession.msTerminalSessionStatus === 'OPEN' }">
              <i class="sa-status__dot" />{{ statusText(detailSession.msTerminalSessionStatus) }}
            </span>
          </ReDescriptionsItem>
          <ReDescriptionsItem label="关闭原因">{{ detailSession.msTerminalSessionCloseReason || '-' }}</ReDescriptionsItem>
        </ReDescriptions>
        <div v-if="detailSession?.msTerminalSessionStatus === 'OPEN'" class="sa-drawer-actions">
          <ReButton type="danger" @click="onForceClose(detailSession)">强制关闭</ReButton>
        </div>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.session-audit {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: 100%;
  box-sizing: border-box;
}

/* 主卡片 */
.sa-card {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  padding: 28px 32px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
  border-radius: var(--el-radius-xl, 16px);
  box-shadow: var(--el-box-shadow-lighter);
}

/* 刷新（工具条右侧） */
.sa-refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  height: 40px;
  padding: 0 18px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color var(--el-transition-duration), border-color var(--el-transition-duration),
    background var(--el-transition-duration);
}
.sa-refresh:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.sa-refresh.is-loading :deep(svg) {
  animation: sa-spin 0.8s linear infinite;
}
@keyframes sa-spin {
  to { transform: rotate(360deg); }
}

/* 统计 */
.sa-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}
.sa-stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
}
.sa-stat__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.sa-stat__label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.sa-stat__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.sa-stat__value {
  margin-top: 8px;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.sa-stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 46px;
  height: 46px;
  font-size: 20px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: var(--el-radius-md, 8px);
}

/* 状态快捷筛选 */
.sa-segrow {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.sa-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 18px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color var(--el-transition-duration), border-color var(--el-transition-duration);
}
.sa-pill:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.sa-seg {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-full, 9999px);
}
.sa-seg__btn {
  height: 32px;
  padding: 0 22px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-regular);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color var(--el-transition-duration), background var(--el-transition-duration);
}
.sa-seg__btn:hover:not(.is-active) {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sa-seg__btn.is-active {
  color: var(--el-color-white, #fff);
  background: var(--el-color-primary);
}

/* 高级筛选 */
.sa-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-lg, 12px);
}
.sa-filters__search {
  flex: 1 1 240px;
  min-width: 200px;
}
.sa-filters__select {
  flex: 0 0 130px;
  width: 130px;
}
.sa-filters__query {
  margin-left: auto;
  flex-shrink: 0;
}

/* 表格 */
.sa-table {
  --el-table-border-color: var(--el-border-color-lighter);
}
.sa-table :deep(.el-table__header-wrapper th.el-table__cell) {
  background: transparent;
  color: var(--el-text-color-secondary);
  font-weight: 500;
  font-size: 13px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.sa-table :deep(.el-table__row > td.el-table__cell) {
  border-bottom: 1px solid var(--el-border-color-extra-light, var(--el-border-color-lighter));
}
.sa-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}
.sa-table :deep(.el-table__row:hover > td.el-table__cell) {
  background: var(--el-color-primary-light-9);
}

/* 协议 pill */
.sa-proto {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 24px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-color-white, #fff);
  border-radius: var(--el-radius-full, 9999px);
}
.sa-proto.is-vnc { background: var(--el-color-primary); }
.sa-proto.is-rdp { background: var(--el-color-warning); }
.sa-proto.is-ssh { background: var(--el-color-success); }
.sa-proto.is-unknown { background: var(--el-color-info); }

/* 状态 */
.sa-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  white-space: nowrap;
}
.sa-status__dot {
  flex-shrink: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--el-text-color-disabled);
}
.sa-status.is-open .sa-status__dot {
  background: var(--el-color-success);
  animation: sa-pulse 1.8s ease-out infinite;
}
@keyframes sa-pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--el-color-success) 50%, transparent); }
  70% { box-shadow: 0 0 0 6px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

/* 行内链接按钮 */
.sa-link {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0;
  margin-right: 12px;
  font-size: 13px;
  color: var(--el-color-primary);
  background: none;
  border: none;
  cursor: pointer;
}
.sa-link:hover {
  color: var(--el-color-primary-dark-2);
}
.sa-link__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.sa-link.is-danger {
  color: var(--el-color-danger);
}
.sa-link.is-danger:hover {
  color: var(--el-color-danger-dark-2);
}
.sa-link.is-danger .sa-link__dot {
  background: var(--el-color-danger);
}

.sa-drawer-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 窄屏 */
@media (max-width: 720px) {
  .sa-card {
    padding: 20px 16px;
  }
  .sa-stats {
    grid-template-columns: 1fr;
  }
  .sa-filters {
    flex-wrap: wrap;
  }
  .sa-filters__search,
  .sa-filters__select {
    flex: 1 1 100%;
    width: 100%;
  }
  .sa-filters__query {
    margin-left: 0;
  }
}
</style>
