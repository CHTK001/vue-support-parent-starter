<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getSessions, closeSession } from '../api';

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

/** 会话列表 */
const sessions = ref<SessionRow[]>([]);

/** 状态过滤 */
const statusFilter = ref('');

/** 加载态 */
const loading = ref(false);

onMounted(refresh);

/**
 * 刷新会话记录
 */
async function refresh(): Promise<void> {
  loading.value = true;
  try {
    sessions.value = await getSessions(statusFilter.value || undefined);
  } catch (e) {
    ElMessage.error((e as Error).message);
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
  await ElMessageBox.confirm(`确认强制关闭 ${row.msTerminalSessionHostName} 的会话?`, '关闭', { type: 'warning' });
  await closeSession(row.id);
  ElMessage.success('已关闭');
  refresh();
}
</script>

<template>
  <div class="session-tab">
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
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
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
  </div>
</template>

<style scoped lang="scss">
.session-tab {
  display: flex;
  flex-direction: column;
  gap: 12px;

  .toolbar {
    display: flex;
    gap: 8px;
  }
}
</style>
