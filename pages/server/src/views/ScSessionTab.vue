<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { message } from '@repo/core';
import { getSessions, getOnlineSessions, closeSession, queryHosts } from '../api';

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

/** 在线会话行（/terminal/online） */
interface OnlineSession {
  tunnelId?: string;
  hostId?: number;
  recordId?: number;
  protocol?: string;
  lastActiveTime?: string;
}

/** 会话列表 */
const sessions = ref<SessionRow[]>([]);

/** 在线会话列表 */
const onlineSessions = ref<OnlineSession[]>([]);

/** 状态过滤 */
const statusFilter = ref('');

/** 加载态 */
const loading = ref(false);

/** 主机名映射 */
const hostMap = ref<Record<number, string>>({});

/** 详情抽屉 */
const detailVisible = ref(false);
const detailSession = ref<SessionRow | null>(null);

function openDetail(row: SessionRow) {
  detailSession.value = row;
  detailVisible.value = true;
}

onMounted(async () => {
  const hosts = await queryHosts().catch(() => []);
  for (const h of hosts ?? []) {
    hostMap.value[h.id] = h.serverHostName;
  }
  refresh();
});

/**
 * 刷新会话记录与在线会话
 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    const [audit, online] = await Promise.all([
      getSessions(statusFilter.value || undefined),
      getOnlineSessions(),
    ]);
    sessions.value = audit;
    onlineSessions.value = online || [];
  } catch (e) {
    message.error((e as Error).message);
  } finally {
    loading.value = false;
  }
}

/**
 * 协议显示名
 *
 * @param protocol 协议
 */
function protocolLabel(protocol?: string): string {
  return (protocol || '').toUpperCase();
}

/**
 * 格式化最近活跃时间
 *
 * @param t 时间字符串
 */
function formatActive(t?: string): string {
  if (!t) return '-';
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) {
    return t;
  }
  return d.toLocaleString('zh-CN', { hour12: false });
}

/**
 * 强制关闭会话
 *
 * @param row 会话
 */
async function onForceClose(row: SessionRow): Promise<void> {
  await message.confirm(`确认强制关闭 ${row.msTerminalSessionHostName} 的会话?`, '关闭');
  await closeSession(row.id);
  message.success('已关闭');
  refresh();
}
</script>

<template>
  <div class="session-tab sc-page">
    <div class="online-section" v-if="onlineSessions.length > 0 || loading">
      <div class="online-header">
        <span class="online-title">在线会话</span>
        <span class="online-count">{{ onlineSessions.length }} 个活跃</span>
      </div>
      <ReTable :data="onlineSessions" size="small" border :loading="loading" :pagination="false" :toolbar="false">
        <ReTableColumn label="协议" width="90">
          <template #default="{ row }">
            <ReTag size="small" type="success">{{ protocolLabel(row.protocol) }}</ReTag>
          </template>
        </ReTableColumn>
        <ReTableColumn prop="hostId" label="主机 ID" width="100" />
        <ReTableColumn prop="recordId" label="审计 ID" width="110" />
        <ReTableColumn prop="tunnelId" label="隧道 ID" min-width="180" show-overflow-tooltip />
        <ReTableColumn label="最近活跃" width="170">
          <template #default="{ row }">{{ formatActive(row.lastActiveTime) }}</template>
        </ReTableColumn>
      </ReTable>
    </div>

    <div class="toolbar">
      <ReRadioGroup v-model="statusFilter" button capsule @change="refresh">
        <ReRadioButton value="">全部</ReRadioButton>
        <ReRadioButton value="OPEN">进行中</ReRadioButton>
        <ReRadioButton value="CLOSED">已结束</ReRadioButton>
      </ReRadioGroup>
      <ReButton layout="square" icon="Refresh" @click="refresh">刷新</ReButton>
    </div>

    <ReTable :data="sessions" :loading="loading" size="small" border :pagination="false" :toolbar="false">
      <ReTableColumn prop="msTerminalSessionHostName" label="主机" min-width="130" />
      <ReTableColumn prop="msTerminalSessionProtocol" label="协议" width="80" />
      <ReTableColumn prop="msTerminalSessionUser" label="用户" width="100" />
      <ReTableColumn prop="msTerminalSessionClientIp" label="客户端 IP" width="130" />
      <ReTableColumn prop="msTerminalSessionConnectTime" label="连接时间" width="160" />
      <ReTableColumn prop="msTerminalSessionCloseTime" label="关闭时间" width="160" />
      <ReTableColumn label="状态" width="90">
        <template #default="{ row }">
          <ReTag :type="row.msTerminalSessionStatus === 'OPEN' ? 'success' : 'info'" size="small">
            {{ row.msTerminalSessionStatus === 'OPEN' ? '进行中' : '已结束' }}
          </ReTag>
        </template>
      </ReTableColumn>
      <ReTableColumn prop="msTerminalSessionCloseReason" label="关闭原因" min-width="120" show-overflow-tooltip />
      <ReTableColumn label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <ReButton link size="small" type="primary" @click="openDetail(row)">详情</ReButton>
          <ReButton
            v-if="row.msTerminalSessionStatus === 'OPEN'"
            link
            type="danger"
            size="small"
            @click="onForceClose(row)"
          >强制关闭</ReButton>
        </template>
      </ReTableColumn>
    </ReTable>

    <ReDrawer v-model="detailVisible" :title="`会话详情`" direction="rtl" size="500px" destroy-on-close close-only :footer-hidden="true">
      <template #content>
        <ReDescriptions v-if="detailSession" :column="2" border size="small">
          <ReDescriptionsItem label="主机">{{ detailSession.msTerminalSessionHostName || hostMap[detailSession.msTerminalSessionHostId ?? 0] || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="协议">{{ detailSession.msTerminalSessionProtocol }}</ReDescriptionsItem>
          <ReDescriptionsItem label="用户">{{ detailSession.msTerminalSessionUser || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="客户端IP">{{ detailSession.msTerminalSessionClientIp || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="连接时间">{{ detailSession.msTerminalSessionConnectTime || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="关闭时间">{{ detailSession.msTerminalSessionCloseTime || '-' }}</ReDescriptionsItem>
          <ReDescriptionsItem label="状态">
            <ReTag :type="detailSession.msTerminalSessionStatus === 'OPEN' ? 'success' : 'info'" size="small">
              {{ detailSession.msTerminalSessionStatus === 'OPEN' ? '进行中' : '已结束' }}
            </ReTag>
          </ReDescriptionsItem>
          <ReDescriptionsItem label="关闭原因">{{ detailSession.msTerminalSessionCloseReason || '-' }}</ReDescriptionsItem>
        </ReDescriptions>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.session-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .online-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .online-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .online-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .online-count {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .toolbar {
    display: flex;
    gap: 8px;
  }
}
</style>