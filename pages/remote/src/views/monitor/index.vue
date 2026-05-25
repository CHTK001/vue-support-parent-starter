<template>
  <div class="session-monitor-page">
    <!-- 顶部统计卡片 -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #409eff22; color: #409eff">
            <el-icon :size="28"><Connection /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activeSessions }}</div>
            <div class="stat-label">活跃会话</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #67c23a22; color: #67c23a">
            <el-icon :size="28"><Upload /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatBytes(stats.totalBytesSent) }}</div>
            <div class="stat-label">总上行</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #e6a23c22; color: #e6a23c">
            <el-icon :size="28"><Download /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ formatBytes(stats.totalBytesReceived) }}</div>
            <div class="stat-label">总下行</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-icon" style="background: #f5623c22; color: #f5623c">
            <el-icon :size="28"><Film /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalFramesTransferred }}</div>
            <div class="stat-label">总帧数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 会话表格 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="card-header">
          <span>会话列表</span>
          <div class="header-actions">
            <el-tag :type="wsConnected ? 'success' : 'danger'" size="small">
              {{ wsConnected ? 'WS 已连接' : 'WS 断开' }}
            </el-tag>
            <el-tag type="info" size="small">实时推送</el-tag>
          </div>
        </div>
      </template>

      <el-table :data="sessions" stripe style="width: 100%" max-height="600">
        <el-table-column prop="sessionId" label="Session ID" width="140">
          <template #default="{ row }">
            <el-text truncated>{{ row.sessionId?.slice(0, 12) }}...</el-text>
          </template>
        </el-table-column>
        <el-table-column prop="agentId" label="Agent" width="120" show-overflow-tooltip />
        <el-table-column prop="targetId" label="Target" width="120" show-overflow-tooltip />
        <el-table-column prop="protocol" label="协议" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.protocol === 'DESKTOP' ? 'primary' : 'success'" size="small">
              {{ row.protocol }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'info'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上行" width="100" align="right">
          <template #default="{ row }">{{ formatBytes(row.bytesSent) }}</template>
        </el-table-column>
        <el-table-column label="下行" width="100" align="right">
          <template #default="{ row }">{{ formatBytes(row.bytesReceived) }}</template>
        </el-table-column>
        <el-table-column prop="framesTransferred" label="帧数" width="80" align="right" />
        <el-table-column label="创建时间" width="170">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="最后活跃" width="170">
          <template #default="{ row }">{{ formatTime(row.lastActivityAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-popconfirm title="确定强制关闭此会话？" @confirm="closeSession(row.sessionId)">
              <template #reference>
                <el-button type="danger" size="small" link>关闭</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="sessions.length === 0" description="暂无活跃会话" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from "vue";
import { ElMessage } from "element-plus";
import { Connection, Upload, Download, Film } from "@element-plus/icons-vue";

/** Gateway DWS WebSocket 端口 */
const WS_PORT = 8082;

interface SessionInfo {
  sessionId: string;
  agentId: string;
  targetId: string;
  protocol: string;
  status: string;
  bytesSent: number;
  bytesReceived: number;
  framesTransferred: number;
  createdAt: string;
  lastActivityAt: string;
}

interface Stats {
  totalSessions: number;
  activeSessions: number;
  totalBytesSent: number;
  totalBytesReceived: number;
  totalFramesTransferred: number;
}

const stats = reactive<Stats>({
  totalSessions: 0,
  activeSessions: 0,
  totalBytesSent: 0,
  totalBytesReceived: 0,
  totalFramesTransferred: 0,
});

const sessions = ref<SessionInfo[]>([]);
const wsConnected = ref(false);
let ws: WebSocket | null = null;

function connectWs() {
  const host = location.hostname || "127.0.0.1";
  ws = new WebSocket(`ws://${host}:${WS_PORT}`);

  ws.onopen = () => {
    wsConnected.value = true;
    ws?.send(JSON.stringify({ type: "monitor_subscribe", interval: 2000 }));
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      if (msg.type === "monitor_update") {
        if (msg.stats) {
          stats.totalSessions = msg.stats.totalSessions ?? 0;
          stats.activeSessions = msg.stats.activeSessions ?? 0;
          stats.totalBytesSent = msg.stats.totalBytesSent ?? 0;
          stats.totalBytesReceived = msg.stats.totalBytesReceived ?? 0;
          stats.totalFramesTransferred = msg.stats.totalFramesTransferred ?? 0;
        }
        if (msg.sessions) {
          sessions.value = msg.sessions;
        }
      }
    } catch { /* ignore parse errors */ }
  };

  ws.onclose = () => {
    wsConnected.value = false;
    // 断线重连
    setTimeout(connectWs, 3000);
  };

  ws.onerror = () => {
    wsConnected.value = false;
  };
}

function disconnectWs() {
  if (ws) {
    ws.send(JSON.stringify({ type: "monitor_unsubscribe" }));
    ws.close();
    ws = null;
  }
}

async function closeSession(sessionId: string) {
  try {
    const res = await fetch(`/api/sessions/${sessionId}`, { method: "DELETE" });
    if (res.ok) {
      ElMessage.success("会话已关闭");
    } else {
      ElMessage.error("关闭失败");
    }
  } catch {
    ElMessage.error("网络错误");
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0) + " " + units[i];
}

function formatTime(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      hour12: false,
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

onMounted(connectWs);
onUnmounted(disconnectWs);
</script>

<style scoped>
.session-monitor-page {
  padding: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  width: 100%;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.table-card {
  margin-top: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
