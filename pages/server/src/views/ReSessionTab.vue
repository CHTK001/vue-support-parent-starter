<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
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
    ElMessage.error((e as Error).message);
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
  await ElMessageBox.confirm(`确认强制关闭 ${row.msTerminalSessionHostName} 的会话?`, '关闭', { type: 'warning' });
  await closeSession(row.id);
  ElMessage.success('已关闭');
  refresh();
}
</script>

<template>
  <div class="session-tab">
    <div class="online-section" v-if="onlineSessions.length > 0 || loading">
      <div class="online-header">
        <span class="online-title">在线会话</span>
        <span class="online-count">{{ onlineSessions.length }} 个活跃</span>
      </div>
      <el-table :data="onlineSessions" size="small" border :loading="loading">
        <el-table-column label="协议" width="90">
          <template #default="{ row }">
            <el-tag size="small" type="success">{{ protocolLabel(row.protocol) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="hostId" label="主机 ID" width="100" />
        <el-table-column prop="recordId" label="审计 ID" width="110" />
        <el-table-column prop="tunnelId" label="隧道 ID" min-width="180" show-overflow-tooltip />
        <el-table-column label="最近活跃" width="170">
          <template #default="{ row }">{{ formatActive(row.lastActiveTime) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div class="toolbar">
      <el-radio-group v-model="statusFilter" @change="refresh">
        <el-radio-button value="">全部</el-radio-button>
        <el-radio-button value="OPEN">进行中</el-radio-button>
        <el-radio-button value="CLOSED">已结束</el-radio-button>
      </el-radio-group>
      <el-button @click="refresh">刷新</el-button>
    </div>

    <el-table v-loading="loading" :data="sessions" size="small" border>
      <el-table-column prop="msTerminalSessionHostName" label="主机" min-width="130" />
      <el-table-column prop="msTerminalSessionProtocol" label="协议" width="80" />
      <el-table-column prop="msTerminalSessionUser" label="用户" width="100" />
      <el-table-column prop="msTerminalSessionClientIp" label="客户端 IP" width="130" />
      <el-table-column prop="msTerminalSessionConnectTime" label="连接时间" width="160" />
      <el-table-column prop="msTerminalSessionCloseTime" label="关闭时间" width="160" />
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.msTerminalSessionStatus === 'OPEN' ? 'success' : 'info'" size="small">
            {{ row.msTerminalSessionStatus === 'OPEN' ? '进行中' : '已结束' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="msTerminalSessionCloseReason" label="关闭原因" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button link size="small" type="primary" @click="openDetail(row)">详情</el-button>
          <el-button
            v-if="row.msTerminalSessionStatus === 'OPEN'"
            link
            type="danger"
            size="small"
            @click="onForceClose(row)"
          >强制关闭</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-drawer v-model="detailVisible" :title="`会话详情`" direction="rtl" size="500px" destroy-on-close>
      <template v-if="detailSession">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="主机">{{ detailSession.msTerminalSessionHostName || hostMap[detailSession.msTerminalSessionHostId ?? 0] || '-' }}</el-descriptions-item>
          <el-descriptions-item label="协议">{{ detailSession.msTerminalSessionProtocol }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ detailSession.msTerminalSessionUser || '-' }}</el-descriptions-item>
          <el-descriptions-item label="客户端IP">{{ detailSession.msTerminalSessionClientIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="连接时间">{{ detailSession.msTerminalSessionConnectTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关闭时间">{{ detailSession.msTerminalSessionCloseTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="detailSession.msTerminalSessionStatus === 'OPEN' ? 'success' : 'info'" size="small">
              {{ detailSession.msTerminalSessionStatus === 'OPEN' ? '进行中' : '已结束' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="关闭原因">{{ detailSession.msTerminalSessionCloseReason || '-' }}</el-descriptions-item>
        </el-descriptions>
      </template>
    </el-drawer>
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
