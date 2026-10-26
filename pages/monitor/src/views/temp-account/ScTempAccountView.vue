<script setup lang="ts">
/**
 * 临时账号 —— 随机虚拟身份的列表与实时推送。
 *
 * 主页面职责：
 *   1. 一键「新增账号」：后端随机生成虚拟号码（接码）+ 临时邮箱，列表实时出现
 *   2. 操作列「详情」弹出 ReDrawer：抽屉内分短信 / 邮件两个 Tab 实时展示
 *   3. SSE 订阅全局消息流：账号新增 / 新短信 / 新邮件 / 账号删除，列表计数实时刷新
 *
 * 视觉：与「服务管理」页对齐 —— 顶部统计卡 + 筛选行右侧工具按钮 + 数据表格吃满高度。
 */
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { CircleCheckFilled, ChatDotRound, Message, Plus, User, View } from '@element-plus/icons-vue';
import { message } from '@repo/core';
import type { SseClient } from '@repo/utils';
import {
  listTempAccounts,
  createTempAccount,
  deleteTempAccount,
  subscribeTempAccountStream,
  type TempAccount,
} from '../../api/tempAccount';
import ScTempAccountDrawer from '../../components/ScTempAccountDrawer.vue';
import { confirmThen } from '../../utils/confirmThen';
import { copyText } from '../../utils/clipboard';

/** 账号列表 */
const accounts = ref<TempAccount[]>([]);
/** 加载态 */
const loading = ref(false);
/** 创建中（按钮 loading） */
const creating = ref(false);
/** 操作中的账号 id（按钮 loading） */
const actingId = ref<string | null>(null);
/** 详情抽屉 */
const detailVisible = ref(false);
const detailAccountId = ref<string | null>(null);
/** 类型选择弹窗 */
const typePickerVisible = ref(false);
/** 正在创建的通道类型（null = 空闲），用于弹窗内加载动画 */
const pendingType = ref<'sms' | 'email' | 'both' | null>(null);
/** SSE 释放函数 */
let closeSse: SseClient | null = null;

/** 统计 */
const stats = computed(() => {
  const totalSms = accounts.value.reduce((s, a) => s + (a.smsCount ?? 0), 0);
  const totalEmail = accounts.value.reduce((s, a) => s + (a.emailCount ?? 0), 0);
  return { accounts: accounts.value.length, totalSms, totalEmail };
});

/** 创建时间展示 */
function fmtTime(ts: number) {
  if (!ts) return '-';
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 刷新列表 */
async function refresh(silent = false) {
  loading.value = true;
  try {
    accounts.value = (await listTempAccounts()) ?? [];
  } catch (e) {
    if (!silent) message.error(reasonText(e));
  } finally {
    loading.value = false;
  }
}

/** 新增账号：先弹出「通道类型」选择（号码 / 邮箱 / 两者） */
function onCreate() {
  typePickerVisible.value = true;
}

/** 按选择的通道类型创建（弹窗保持打开直到数据真实返回） */
async function createByType(type: 'sms' | 'email' | 'both') {
  if (pendingType.value) return; // 已在生成中，忽略重复点击
  pendingType.value = type;
  creating.value = true;
  try {
    const account = await createTempAccount(type);
    const label =
      type === 'sms' ? '仅号码' : type === 'email' ? '仅邮箱' : '号码 + 邮箱';
    // 数据真实返回成功才关闭弹窗
    typePickerVisible.value = false;
    message.success(
      `已创建${label}临时账号 ${account.phone?.phone || ''}${account.email ? ' / ' + account.email : ''}`,
    );
    await refresh(true);
  } catch (e) {
    // 失败保持弹窗打开，用户可重试
    message.error(reasonText(e));
  } finally {
    pendingType.value = null;
    creating.value = false;
  }
}

/** 删除账号 */
async function onDelete(row: TempAccount) {
  const confirmed = await confirmThen(
    message.confirm,
    `确认删除临时账号${row.phone?.phone ? `「${row.phone.phone}」` : ''}？相关短信/邮件记录将一并清除。`,
    '删除临时账号',
  );
  if (!confirmed) return;
  actingId.value = row.id;
  try {
    await deleteTempAccount(row.id);
    message.success('已删除');
    accounts.value = accounts.value.filter(a => a.id !== row.id);
  } catch (e) {
    message.error(reasonText(e));
  } finally {
    actingId.value = null;
  }
}

/** 打开详情抽屉 */
function openDetail(row: TempAccount) {
  detailAccountId.value = row.id;
  detailVisible.value = true;
}

/** 复制单元格文本（号码 / 邮箱），带成功提示 */
async function copyCell(text: string | null | undefined, label: string) {
  const ok = await copyText(text);
  if (ok) message.success(`${label}已复制`);
  else message.error('复制失败');
}

/** SSE 消息流订阅：账号新增 / 新消息 / 删除 → 列表实时联动 */
function initSse() {
  closeSse = subscribeTempAccountStream({
    onReady: () => message.success('临时账号实时推送已连接'),
    onAccount: account => {
      // 新增账号（create 已广播）→ 若无该 id 则追加
      if (!accounts.value.some(a => a.id === account.id)) {
        accounts.value = [account, ...accounts.value];
      }
    },
    onMessage: ({ id, sms, emails }) => {
      const target = accounts.value.find(a => a.id === id);
      if (!target) return;
      if (sms?.length) target.smsCount = (target.smsCount ?? 0) + sms.length;
      if (emails?.length) target.emailCount = (target.emailCount ?? 0) + emails.length;
      message.info(`账号 ${target.phone?.phone || ''} 收到新${sms?.length ? `短信×${sms.length}` : ''}${sms?.length && emails?.length ? '、' : ''}${emails?.length ? `邮件×${emails.length}` : ''}`);
    },
    onRemove: ({ id }) => {
      accounts.value = accounts.value.filter(a => a.id !== id);
    },
    onError: () => {
      // SSE 断开会自动重连（reconnect:true），静默即可
    },
  });
}

/** 异常压成短文本 */
function reasonText(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  if (e && typeof e === 'object' && 'msg' in e) {
    const msg = (e as { msg?: unknown }).msg;
    if (typeof msg === 'string' && msg) return msg;
  }
  return typeof e === 'string' && e ? e : '未知错误';
}

onMounted(() => {
  void refresh();
  initSse();
});

onUnmounted(() => {
  closeSse?.close();
});
</script>

<template>
  <div class="temp-account sc-page">
    <!-- 运行概览 -->
    <div class="stats-grid" title="随机虚拟身份：虚拟号码（接码）+ 临时邮箱，收到的验证码短信 / 邮件实时推送">
      <ReStatCard size="compact" title="账号总数" :value="stats.accounts" desc="随机虚拟身份" :icon="User" icon-color="var(--metric-cpu)">
        <template #value><ReCountup :value="stats.accounts" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard
        size="compact"
        title="已收短信"
        :value="stats.totalSms"
        desc="虚拟号码收到"
        :icon="ChatDotRound"
        icon-color="var(--status-success)"
      >
        <template #value><ReCountup :value="stats.totalSms" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard
        size="compact"
        title="已收邮件"
        :value="stats.totalEmail"
        desc="临时邮箱收到"
        :icon="Message"
        icon-color="var(--metric-jvm)"
      >
        <template #value><ReCountup :value="stats.totalEmail" :duration="600" /></template>
      </ReStatCard>
      <ReStatCard size="compact" title="实时推送" :value="1" desc="SSE 已连接" :icon="CircleCheckFilled" icon-color="var(--status-success)">
        <template #value><ReText type="success">SSE</ReText></template>
      </ReStatCard>
    </div>

    <!-- 工具条：新增账号 / 刷新 -->
    <div class="page-toolbar">
      <span class="dim tb-meta">共 {{ stats.accounts }} 个临时账号</span>
      <div class="tb-ops">
        <ReButton icon="Plus" layout="square" type="primary" tip="新增临时账号（随机生成）" :loading="creating" @click="onCreate" />
        <ReButton icon="Refresh" layout="square" tip="刷新" :loading="loading" @click="refresh" />
      </div>
    </div>

    <ReTable
      :data="accounts"
      :loading="loading"
      border
      stripe
      size="default"
      empty-text="暂无临时账号，点击右上角「新增」随机生成一个"
      :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
    >
      <ReTableColumn label="虚拟号码" min-width="180">
        <template #default="{ row }">
          <span v-if="row.phone" class="cell-copy">
            <span class="mono cell-val">
              {{ row.phone.phone }}
              <ReTag v-if="row.phone.countryName" :type="'info'" class="cc">{{ row.phone.countryName }}</ReTag>
            </span>
            <ReButton icon="CopyDocument" layout="square" size="small" tip="复制号码" @click.stop="copyCell(row.phone.phone, '号码')" />
          </span>
          <span v-else class="dim">-</span>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="email" label="临时邮箱" min-width="220">
        <template #default="{ row }">
          <span v-if="row.email" class="cell-copy">
            <ReText v-if="row.email" type="primary" class="mono cell-val">{{ row.email }}</ReText>
            <ReButton icon="CopyDocument" layout="square" size="small" tip="复制邮箱" @click.stop="copyCell(row.email, '邮箱')" />
          </span>
          <span v-else class="dim">-</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="已收短信" width="110" align="center">
        <template #default="{ row }">
          <ReTag :type="(row.smsCount ?? 0) > 0 ? 'success' : 'info'">{{ row.smsCount ?? 0 }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="已收邮件" width="110" align="center">
        <template #default="{ row }">
          <ReTag :type="(row.emailCount ?? 0) > 0 ? 'success' : 'info'">{{ row.emailCount ?? 0 }}</ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn label="创建时间" min-width="150">
        <template #default="{ row }">
          <span class="dim">{{ fmtTime(row.createdAt) }}</span>
        </template>
      </ReTableColumn>
      <ReTableColumn label="操作" width="120" fixed="right" align="right">
        <template #default="{ row }">
          <span class="ops" @click.stop>
            <ReButton icon="View" layout="square" type="primary" tip="实时信息（短信/邮件）" @click.stop="openDetail(row)" />
            <ReButton
              icon="Delete"
              layout="square"
              type="danger"
              tip="删除"
              :loading="actingId === row.id"
              @click="onDelete(row)"
            />
          </span>
        </template>
      </ReTableColumn>
    </ReTable>

    <ScTempAccountDrawer v-model="detailVisible" :account-id="detailAccountId" @changed="refresh(true)" />

    <!-- 新增临时账号：先选择通道类型 -->
    <ReDialog
      v-model="typePickerVisible"
      title="新增临时账号"
      width="560"
      :show-close="!creating"
      :close-on-click-modal="!creating"
      :footer-hidden="true"
      append-to-body
    >
      <div class="type-picker">
        <p class="tp-desc">选择要随机生成的通道 —— 临时账号可只含虚拟号码、只含邮箱，或两者兼具。</p>
        <div class="tp-grid">
          <button
            class="tp-option"
            type="button"
            :class="{ 'is-loading': pendingType === 'sms' }"
            :disabled="creating"
            @click="createByType('sms')"
          >
            <span v-if="pendingType === 'sms'" class="tp-spinner" aria-hidden="true" />
            <span v-else class="tp-icon">📱</span>
            <span class="tp-name">临时账号 · 仅号码</span>
            <span class="tp-sub">
              {{ pendingType === 'sms' ? '正在随机生成号码…' : '只含虚拟号码，收短信验证码（freephonenum）' }}
            </span>
          </button>
          <button
            class="tp-option"
            type="button"
            :class="{ 'is-loading': pendingType === 'email' }"
            :disabled="creating"
            @click="createByType('email')"
          >
            <span v-if="pendingType === 'email'" class="tp-spinner" aria-hidden="true" />
            <span v-else class="tp-icon">✉️</span>
            <span class="tp-name">临时账号 · 仅邮箱</span>
            <span class="tp-sub">
              {{ pendingType === 'email' ? '正在随机生成邮箱…' : '只含临时邮箱，收邮件验证码（mail-tm）' }}
            </span>
          </button>
          <button
            class="tp-option tp-wide"
            type="button"
            :class="{ 'is-loading': pendingType === 'both' }"
            :disabled="creating"
            @click="createByType('both')"
          >
            <span v-if="pendingType === 'both'" class="tp-spinner" aria-hidden="true" />
            <span v-else class="tp-icon">🧬</span>
            <span class="tp-name">临时账号 · 号码 + 邮箱</span>
            <span class="tp-sub">
              {{ pendingType === 'both' ? '正在随机生成号码与邮箱…' : '号码与邮箱都随机，短信 / 邮件验证码都收' }}
            </span>
          </button>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.temp-account {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

.stats-grid,
.page-toolbar {
  flex: none;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.stats-grid :deep(.re-stat-card) {
  background: color-mix(in srgb, var(--el-color-primary) 4%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, var(--el-border-color-lighter));
  border-left: 3px solid var(--el-color-primary);
  border-radius: var(--el-radius-lg);
}

.temp-account :deep(.re-table) {
  flex: 1 1 0;
  min-height: 0;
}
.temp-account :deep(.el-table__header th) {
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--el-color-primary) 8%, var(--el-table-header-bg-color)) 0%,
    color-mix(in srgb, var(--el-color-primary) 4%, var(--el-table-header-bg-color)) 100%) !important;
  color: var(--el-text-color-primary);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.3px;
}
.temp-account :deep(.el-table__row:hover td) {
  background-color: color-mix(in srgb, var(--el-color-primary) 5%, transparent) !important;
}

.page-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-lg, 12px);
  padding: 8px 12px;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      var(--el-color-primary-light-5) 30%,
      var(--el-color-primary) 50%,
      var(--el-color-primary-light-5) 70%,
      transparent 100%);
    opacity: 0.7;
  }
}

.tb-meta { margin-left: auto; white-space: nowrap; font-size: 12px; color: var(--el-text-color-secondary); font-family: ui-monospace, monospace; }
.tb-ops {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px solid var(--el-border-color-lighter);
}
.ops { display: inline-flex; align-items: center; gap: 8px; }
.cc { margin-left: 6px; }
.mono { font-family: ui-monospace, monospace; }

/* 单元格复制：值 + 复制图标 */
.cell-copy { display: inline-flex; align-items: center; gap: 6px; max-width: 100%; }
.cell-copy .cell-val {
  display: inline-flex; align-items: center; gap: 4px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  min-width: 0;
}
.cell-copy .el-button { flex-shrink: 0; opacity: 0; transition: opacity 0.15s ease; }
.cell-copy:hover .el-button,
.cell-copy .el-button:focus-visible { opacity: 1; }

/* 新增账号：通道类型选择弹窗 */
.type-picker { display: flex; flex-direction: column; gap: 14px; padding: 4px 2px; }
.tp-desc { margin: 0; font-size: 13px; color: var(--el-text-color-secondary); }
.tp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.tp-option {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 16px 18px; text-align: left; cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  transition: all 0.18s ease;
  color: var(--el-text-color-primary);
  font: inherit;
}
.tp-option:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  transform: translateY(-1px);
}
.tp-option:disabled { opacity: 0.55; cursor: not-allowed; }
.tp-option.tp-wide { grid-column: 1 / -1; flex-direction: row; align-items: center; }
.tp-icon { font-size: 24px; }
.tp-name { font-size: 15px; font-weight: 600; }
.tp-sub { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.6; }

/* 生成中：spinner + 主色边框 */
.tp-option.is-loading {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
  cursor: progress;
}
.tp-spinner {
  width: 22px; height: 22px; flex-shrink: 0;
  border: 2px solid color-mix(in srgb, var(--el-color-primary) 25%, transparent);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: tp-rotate 0.8s linear infinite;
}
@keyframes tp-rotate { to { transform: rotate(360deg); } }
</style>
