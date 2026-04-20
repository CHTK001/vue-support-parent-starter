<template>
  <div class="nginx-dashboard">
    <!-- 顶部操作栏 -->
    <div class="dash-toolbar">
      <div class="dash-toolbar__left">
        <span class="dash-title">
          <ElIcon class="dash-title__icon"><Monitor /></ElIcon>
          Nginx 监控大屏
        </span>
        <ElTag v-if="stats?.running" type="success" size="small" effect="dark">运行中</ElTag>
        <ElTag v-else-if="stats" type="danger" size="small" effect="dark">已停止</ElTag>
      </div>
      <div class="dash-toolbar__right">
        <span class="dash-version" v-if="stats?.version">{{ stats.version }}</span>
        <ElTooltip content="自动刷新">
          <ElButton
            :type="autoRefresh ? 'primary' : ''"
            :icon="autoRefresh ? VideoPause : VideoPlay"
            circle
            @click="toggleAutoRefresh"
          />
        </ElTooltip>
        <!-- 刷新间隔选择 -->
        <ElSelect
          v-if="autoRefresh"
          v-model="refreshInterval"
          size="small"
          style="width: 80px"
          @change="onIntervalChange"
        >
          <ElOption label="5s" :value="5000" />
          <ElOption label="10s" :value="10000" />
          <ElOption label="30s" :value="30000" />
          <ElOption label="60s" :value="60000" />
        </ElSelect>
        
        <ElTooltip content="刷新">
          <ElButton :icon="RefreshRight" circle :loading="loading" @click="() => load()" />
        </ElTooltip>  

        <ElTooltip content="重载服务">
          <ElButton type="primary" circle :loading="reloading" @click="doReload">
            <ElIcon><RefreshRight /></ElIcon>
          </ElButton>
        </ElTooltip>

        <ElTooltip content="重启服务">
          <ElButton type="warning" circle :loading="restarting" @click="doRestart">
            <ElIcon><VideoPlay /></ElIcon>
          </ElButton>
        </ElTooltip>
        
        <ElTooltip content="停止服务">
          <ElButton type="danger" circle :loading="stopping" @click="doStop">
            <ElIcon><VideoPause /></ElIcon>
          </ElButton>
        </ElTooltip>

        <ElDivider direction="vertical" />

        <ElTooltip v-if="showInstallButton" content="安装 Nginx">
          <ElButton type="primary" plain @click="showSpiInstallDialog = true">
            <ElIcon><Download /></ElIcon>
            安装 Nginx
          </ElButton>
        </ElTooltip>
      </div>
    </div>

    <ElScrollbar class="dash-scroll">
      <div v-if="loading && !stats" class="dash-loading">
        <ElIcon class="is-loading"><Loading /></ElIcon>
        <span>加载中…</span>
      </div>
      <div v-else-if="!stats" class="dash-empty">
        <ElEmpty description="点击刷新获取监控数据" :image-size="64" />
      </div>
      <div v-else class="dash-content">

        <!-- 第一行：核心指标卡片 -->
        <div class="metric-row">
          <div class="metric-card metric-card--primary">
            <div class="metric-card__icon"><ElIcon><Connection /></ElIcon></div>
            <div class="metric-card__body">
              <span class="metric-card__label">活跃连接</span>
              <span class="metric-card__value">{{ stats.activeConnections }}</span>
            </div>
          </div>
          <div class="metric-card metric-card--blue">
            <div class="metric-card__icon"><ElIcon><DataLine /></ElIcon></div>
            <div class="metric-card__body">
              <span class="metric-card__label">总请求数</span>
              <span class="metric-card__value">{{ formatNum(stats.requests) }}</span>
            </div>
          </div>
          <div class="metric-card metric-card--green">
            <div class="metric-card__icon"><ElIcon><Cpu /></ElIcon></div>
            <div class="metric-card__body">
              <span class="metric-card__label">Reading</span>
              <span class="metric-card__value">{{ stats.reading }}</span>
            </div>
          </div>
          <div class="metric-card metric-card--orange">
            <div class="metric-card__icon"><ElIcon><Upload /></ElIcon></div>
            <div class="metric-card__body">
              <span class="metric-card__label">Writing</span>
              <span class="metric-card__value">{{ stats.writing }}</span>
            </div>
          </div>
          <div class="metric-card metric-card--purple">
            <div class="metric-card__icon"><ElIcon><Timer /></ElIcon></div>
            <div class="metric-card__body">
              <span class="metric-card__label">Waiting</span>
              <span class="metric-card__value">{{ stats.waiting }}</span>
            </div>
          </div>
          <div class="metric-card metric-card--teal">
            <div class="metric-card__icon"><ElIcon><User /></ElIcon></div>
            <div class="metric-card__body">
              <span class="metric-card__label">独立 IP</span>
              <span class="metric-card__value">{{ stats.uniqueIps }}</span>
            </div>
          </div>
        </div>

        <!-- 第二行：按天/周/月统计 -->
        <div class="period-row">
          <div class="period-card">
            <div class="period-card__head">
              <span>近 24 小时</span>
              <small>Day</small>
            </div>
            <strong>{{ formatNum(stats.dailyRequests) }}</strong>
            <div class="period-card__meta">
              <span>请求数</span>
              <span>{{ stats.dailyUniqueIps }} 个独立 IP</span>
            </div>
          </div>
          <div class="period-card">
            <div class="period-card__head">
              <span>近 7 天</span>
              <small>Week</small>
            </div>
            <strong>{{ formatNum(stats.weeklyRequests) }}</strong>
            <div class="period-card__meta">
              <span>请求数</span>
              <span>{{ stats.weeklyUniqueIps }} 个独立 IP</span>
            </div>
          </div>
          <div class="period-card">
            <div class="period-card__head">
              <span>近 30 天</span>
              <small>Month</small>
            </div>
            <strong>{{ formatNum(stats.monthlyRequests) }}</strong>
            <div class="period-card__meta">
              <span>请求数</span>
              <span>{{ stats.monthlyUniqueIps }} 个独立 IP</span>
            </div>
          </div>
        </div>

        <NginxSiteTrafficPanel :connection-id="props.connectionId" />

        <!-- 第三行：Top IP 表 + 最近请求 -->
        <div class="dash-row">
          <!-- Top IP 访问排行 -->
          <div class="dash-card dash-card--half">
            <div class="dash-card__header">
              <span class="dash-card__title">
                <ElIcon><DataAnalysis /></ElIcon>
                Top {{ topN }} 访问 IP
              </span>
              <div class="dash-card__actions">
                <ElInputNumber
                  v-model="topN"
                  :min="5"
                  :max="100"
                  :step="5"
                  :controls="false"
                  size="small"
                  style="width: 60px"
                  @change="() => load()"
                />
              </div>
            </div>
            <ElScrollbar class="dash-card__scroll">
              <div v-if="!topIpList.length" class="dash-card__empty">
                <ElEmpty description="暂无数据" :image-size="40" />
              </div>
              <table v-else class="ip-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>IP 地址</th>
                    <th>请求数</th>
                    <th>占比</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item, idx) in topIpList"
                    :key="item.ip"
                    :class="{ 'is-top3': idx < 3 }"
                  >
                    <td class="ip-rank">
                      <span class="rank-badge" :class="`rank-${idx + 1}`">{{ idx + 1 }}</span>
                    </td>
                    <td class="ip-addr">{{ item.ip }}</td>
                    <td class="ip-count">{{ formatNum(item.count) }}</td>
                    <td class="ip-bar-cell">
                      <div class="ip-bar">
                        <div
                          class="ip-bar__fill"
                          :style="{ width: `${item.percent}%` }"
                          :class="idx < 3 ? 'ip-bar__fill--hot' : ''"
                        />
                        <span class="ip-bar__label">{{ item.percent.toFixed(1) }}%</span>
                      </div>
                    </td>
                    <td class="ip-actions">
                      <ElTooltip content="封禁此 IP（添加 deny 规则）">
                        <ElButton
                          :icon="Lock"
                          circle
                          plain
                          type="danger"
                          @click="blockIp(item.ip)"
                        />
                      </ElTooltip>
                    </td>
                  </tr>
                </tbody>
              </table>
            </ElScrollbar>
          </div>

          <!-- 最近请求日志 -->
          <div class="dash-card dash-card--half">
            <div class="dash-card__header">
              <span class="dash-card__title">
                <ElIcon><Document /></ElIcon>
                最近访问记录
              </span>
              <ElTag v-if="stats.stubStatusAvailable" type="success" size="small">stub_status ✓</ElTag>
              <ElTag v-else type="warning" size="small">log / netstat 回退</ElTag>
            </div>
            <ElScrollbar class="dash-card__scroll">
              <div v-if="!stats.recentRequests?.length" class="dash-card__empty">
                <ElEmpty description="暂无日志" :image-size="40" />
              </div>
              <div v-else class="log-lines">
                <div
                  v-for="(line, i) in stats.recentRequests"
                  :key="i"
                  class="log-line"
                  :class="getLogClass(line)"
                >
                  {{ line }}
                </div>
              </div>
            </ElScrollbar>
          </div>
        </div>

        <!-- 第四行：连接详情 + 配置状态 -->
        <div class="dash-row">
          <div class="dash-card dash-card--third">
            <div class="dash-card__header">
              <span class="dash-card__title"><ElIcon><Cpu /></ElIcon> 连接统计</span>
            </div>
            <div class="stat-rows">
              <div class="stat-row">
                <span class="stat-row__label">总接受连接</span>
                <span class="stat-row__val">{{ formatNum(stats.accepts) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">总处理连接</span>
                <span class="stat-row__val">{{ formatNum(stats.handled) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">总请求数</span>
                <span class="stat-row__val">{{ formatNum(stats.requests) }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">分析日志行</span>
                <span class="stat-row__val">{{ formatNum(stats.analyzedLines) }}</span>
              </div>
            </div>
          </div>

          <div class="dash-card dash-card--third">
            <div class="dash-card__header">
              <span class="dash-card__title"><ElIcon><Setting /></ElIcon> 服务信息</span>
            </div>
            <div class="stat-rows">
              <div class="stat-row">
                <span class="stat-row__label">版本</span>
                <span class="stat-row__val stat-row__val--mono">{{ stats.version || '—' }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">主进程 PID</span>
                <span class="stat-row__val stat-row__val--mono">{{ stats.pid || '—' }}</span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">运行状态</span>
                <span class="stat-row__val" :class="stats.running ? 'is-ok' : 'is-err'">
                  {{ stats.running ? '✓ 运行中' : '✗ 已停止' }}
                </span>
              </div>
              <div class="stat-row">
                <span class="stat-row__label">配置检查</span>
                <span class="stat-row__val" :class="stats.configOk ? 'is-ok' : 'is-err'">
                  {{ stats.configOk ? '✓ 通过' : '✗ 失败' }}
                </span>
              </div>
            </div>
          </div>

          <div class="dash-card dash-card--third">
            <div class="dash-card__header">
              <span class="dash-card__title"><ElIcon><DataLine /></ElIcon> 请求频率</span>
            </div>
            <div class="rate-display">
              <span class="rate-value">{{ stats.requestsPerMinute.toFixed(1) }}</span>
              <span class="rate-unit">req/min</span>
            </div>
            <div class="stat-rows">
              <div class="stat-row">
                <span class="stat-row__label">独立 IP 数</span>
                <span class="stat-row__val">{{ stats.uniqueIps }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 第五行：服务状态（原面板 tab 内容） -->
        <div class="dash-row dash-row--full">
          <div class="dash-card">
            <div v-if="statusLoading" class="dash-card__empty">
              <ElIcon class="is-loading"><Loading /></ElIcon>
            </div>
            <div v-else-if="nginxStatus" class="status-inline">
              <div class="status-chips-row">
                <span class="status-chip-sm" :class="statusIsActive ? 'is-active' : 'is-inactive'">
                  <span class="dot" />{{ statusIsActive ? '运行中' : '已停止' }}
                </span>
                <span class="status-chip-sm is-mono">{{ nginxStatus.version || '—' }}</span>
                <span class="status-chip-sm is-mono">PID {{ nginxStatus.pid || '—' }}</span>
                <span class="status-chip-sm" :class="configTestOk ? 'is-ok' : 'is-fail'">
                  配置 {{ configTestOk ? '✓ pass' : '✗ fail' }}
                </span>
              </div>
              <div class="status-pre-row">
                <div class="status-pre-block">
                  <div class="status-pre-label">配置检查 (nginx -t)</div>
                  <pre class="status-pre">{{ nginxStatus.configTest }}</pre>
                </div>
                <div class="status-pre-block">
                  <div class="status-pre-label">服务状态</div>
                  <pre class="status-pre">{{ nginxStatus.systemctlStatus }}</pre>
                </div>
              </div>
            </div>
            <div v-else class="dash-card__empty">
              <ElEmpty description="点击刷新获取状态" :image-size="40" />
            </div>
          </div>
        </div>

      </div>
    </ElScrollbar>
  </div>

  <!-- 安装向导 -->
  <NginxSpiInstallDialog
    v-model="showSpiInstallDialog"
    :connection-id="props.connectionId"
    :host="props.host || ''"
    :port="props.port || 22"
    :username="props.username || 'root'"
    :password="props.password"
    :private-key="props.privateKey"
    @installed="onSpiInstalled"
  />
</template>

<script setup lang="ts">
import {
  Connection,
  Cpu,
  DataAnalysis,
  DataLine,
  Document,
  Download,
  Loading,
  Lock,
  Monitor,
  RefreshRight,
  Setting,
  Timer,
  Upload,
  User,
  VideoPause,
  VideoPlay,
} from "@element-plus/icons-vue";
import {
  ElButton,
  ElDivider,
  ElEmpty,
  ElIcon,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElScrollbar,
  ElSelect,
  ElTag,
  ElTooltip,
} from "element-plus";
import { computed, onMounted, onUnmounted, ref } from "vue";
import {
  fetchNginxDashboard,
  fetchNginxStatus,
  reloadNginx,
  restartNginx,
  stopNginx,
  type NginxDashboardStats,
  type NginxStatusResult,
} from "../../api/nginx";
import NginxSiteTrafficPanel from "./NginxSiteTrafficPanel.vue";
import NginxSpiInstallDialog from "./NginxSpiInstallDialog.vue";

const props = defineProps<{
  connectionId: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  privateKey?: string;
}>();

const stats = ref<NginxDashboardStats | null>(null);
const loading = ref(false);
const topN = ref(20);
const autoRefresh = ref(false);
const refreshInterval = ref(5000);
const reloading = ref(false);
const restarting = ref(false);
const stopping = ref(false);
const showSpiInstallDialog = ref(false);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// ─── 计算属性 ──────────────────────────────────────────────────────────────────

const topIpList = computed(() => {
  if (!stats.value?.topIps) return [];
  const entries = Object.entries(stats.value.topIps);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  return entries.map(([ip, count]) => ({
    ip,
    count,
    percent: total > 0 ? (count / total) * 100 : 0,
  }));
});

const nginxBinaryDetected = computed(() => {
  const versionText = [stats.value?.version, nginxStatus.value?.version].filter(Boolean).join(" ");
  return /nginx\/|nginx version/i.test(versionText);
});

const showInstallButton = computed(() => Boolean(stats.value || nginxStatus.value) && !nginxBinaryDetected.value);

// ─── 数据加载 ──────────────────────────────────────────────────────────────────

const load = async (silent = false) => {
  if (!silent) loading.value = true;
  try {
    const res = await fetchNginxDashboard(props.connectionId, undefined, topN.value, silent);
    stats.value = res?.data ?? null;
  } catch (e: any) {
    if (!silent) ElMessage.error("加载大屏数据失败: " + (e?.message ?? ""));
  } finally {
    if (!silent) loading.value = false;
  }
};

const toggleAutoRefresh = () => {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    // 立即刷新一次（静默），然后按间隔轮询
    load(true);
    refreshTimer = setInterval(() => load(true), refreshInterval.value);
  } else {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

/** 切换刷新间隔时重置定时器 */
const onIntervalChange = () => {
  if (autoRefresh.value && refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = setInterval(() => load(true), refreshInterval.value);
  }
};

// ─── 快捷操作 ──────────────────────────────────────────────────────────────────

const doReload = async () => {
  reloading.value = true;
  try {
    await reloadNginx(props.connectionId);
    ElMessage.success("Reload 成功");
    await Promise.all([load(), loadStatus()]);
  } catch (e: any) {
    ElMessage.error("Reload 失败: " + (e?.message ?? ""));
  } finally {
    reloading.value = false;
  }
};

const doRestart = async () => {
  restarting.value = true;
  try {
    await restartNginx(props.connectionId);
    ElMessage.success("重启成功");
    await Promise.all([load(), loadStatus()]);
  } catch (e: any) {
    ElMessage.error("重启失败: " + (e?.message ?? ""));
  } finally {
    restarting.value = false;
  }
};

const doStop = async () => {
  try {
    await ElMessageBox.confirm("确认停止 Nginx？", "停止确认", {
      type: "warning", confirmButtonText: "停止", cancelButtonText: "取消",
    });
    stopping.value = true;
    await stopNginx(props.connectionId);
    ElMessage.success("已停止");
    await Promise.all([load(), loadStatus()]);
  } catch { /* 取消 */ } finally {
    stopping.value = false;
  }
};

const blockIp = async (ip: string) => {
  try {
    await ElMessageBox.confirm(
      `确认封禁 IP ${ip}？将在 nginx.conf 中添加 deny ${ip}; 规则并 reload。`,
      "封禁 IP",
      { type: "warning", confirmButtonText: "封禁", cancelButtonText: "取消" }
    );
    ElMessage.info("封禁功能需要在配置编辑器中手动添加 deny 规则，或通过后续版本自动化实现。");
  } catch { /* 取消 */ }
};

// ─── 工具函数 ──────────────────────────────────────────────────────────────────

const formatNum = (n: number) => {
  if (!n) return "0";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
};

const getLogClass = (line: string) => {
  if (line.includes('" 5')) return "log-line--error";
  if (line.includes('" 4')) return "log-line--warn";
  if (line.includes('" 2')) return "log-line--ok";
  return "";
};

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
});

// ─── 状态面板（合并自原 status tab） ──────────────────────────────────────────
const nginxStatus = ref<NginxStatusResult | null>(null);
const statusLoading = ref(false);

const statusIsActive = computed(() =>
  (nginxStatus.value?.systemctlStatus ?? "").includes("active (running)")
);
const configTestOk = computed(() => {
  const s = nginxStatus.value?.configTest ?? "";
  return s.includes("syntax is ok") || s.includes("test is successful");
});

const loadStatus = async () => {
  statusLoading.value = true;
  try {
    const res = await fetchNginxStatus(props.connectionId);
    nginxStatus.value = (res?.data as any) ?? null;
  } catch { /* 静默 */ } finally {
    statusLoading.value = false;
  }
};

// 初始化时同时加载状态
onMounted(() => { load(); loadStatus(); });

const onSpiInstalled = async () => {
  showSpiInstallDialog.value = false;
  await Promise.all([load(), loadStatus()]);
};
</script>

<style scoped lang="scss">
.nginx-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: #f1f5f9;
}

/* ── 顶部工具栏 ── */
.dash-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.95);
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
  backdrop-filter: blur(8px);
  flex-shrink: 0;
}

.dash-toolbar__left,
.dash-toolbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dash-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.dash-title__icon {
  font-size: 18px;
  color: #6366f1;
}

.dash-version {
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
  color: #64748b;
  background: rgba(148, 163, 184, 0.12);
  padding: 3px 10px;
  border-radius: 6px;
}

/* ── 滚动区 ── */
.dash-scroll {
  flex: 1;
  min-height: 0;
}

.dash-loading,
.dash-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  height: 300px;
  color: #94a3b8;
  font-size: 14px;
}

.dash-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── 指标卡片行 ── */
.metric-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.period-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.period-card {
  display: grid;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, rgba(99, 102, 241, 0.08), transparent 55%),
    linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid rgba(99, 102, 241, 0.12);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.05);
}

.period-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.period-card__head small {
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  color: #6366f1;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.period-card strong {
  color: #0f172a;
  font-size: 28px;
  line-height: 1;
}

.period-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  color: #64748b;
  font-size: 12px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 14px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.1);
  }
}

.metric-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 18px;
  flex-shrink: 0;
}

.metric-card--primary .metric-card__icon { background: rgba(99, 102, 241, 0.12); color: #6366f1; }
.metric-card--blue .metric-card__icon { background: rgba(59, 130, 246, 0.12); color: #3b82f6; }
.metric-card--green .metric-card__icon { background: rgba(16, 185, 129, 0.12); color: #10b981; }
.metric-card--orange .metric-card__icon { background: rgba(249, 115, 22, 0.12); color: #f97316; }
.metric-card--purple .metric-card__icon { background: rgba(168, 85, 247, 0.12); color: #a855f7; }
.metric-card--teal .metric-card__icon { background: rgba(20, 184, 166, 0.12); color: #14b8a6; }

.metric-card__body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.metric-card__label {
  font-size: 11px;
  color: #94a3b8;
  font-weight: 500;
}

.metric-card__value {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}

/* ── 内容行 ── */
.dash-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;

  &:last-child {
    grid-template-columns: repeat(3, 1fr);
  }
}

.dash-card {
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.14);
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  min-height: 280px;
}

.dash-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(248, 250, 252, 0.8);
  flex-shrink: 0;
}

.dash-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #334155;

  .el-icon { color: #6366f1; }
}

.dash-card__actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.dash-card__scroll {
  flex: 1;
  min-height: 0;
}

.dash-card__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 20px;
}

/* ── IP 表格 ── */
.ip-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;

  th {
    padding: 8px 12px;
    text-align: left;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    background: rgba(248, 250, 252, 0.9);
    border-bottom: 1px solid rgba(148, 163, 184, 0.12);
    white-space: nowrap;
  }

  td {
    padding: 8px 12px;
    border-bottom: 1px solid rgba(148, 163, 184, 0.07);
    vertical-align: middle;
  }

  tr:hover td { background: rgba(99, 102, 241, 0.04); }
  tr.is-top3 td { background: rgba(249, 115, 22, 0.03); }
}

.ip-rank { width: 40px; }

.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(148, 163, 184, 0.15);
  color: #64748b;
}

.rank-1 { background: rgba(245, 158, 11, 0.2); color: #d97706; }
.rank-2 { background: rgba(148, 163, 184, 0.25); color: #475569; }
.rank-3 { background: rgba(180, 83, 9, 0.15); color: #b45309; }

.ip-addr {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #1e293b;
  font-weight: 600;
}

.ip-count {
  font-family: "JetBrains Mono", monospace;
  font-size: 12px;
  color: #6366f1;
  font-weight: 600;
  white-space: nowrap;
}

.ip-bar-cell { min-width: 120px; }

.ip-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 16px;
  background: rgba(148, 163, 184, 0.1);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.ip-bar__fill {
  height: 100%;
  background: rgba(99, 102, 241, 0.4);
  border-radius: 8px;
  transition: width 0.3s ease;

  &--hot { background: rgba(249, 115, 22, 0.5); }
}

.ip-bar__label {
  position: absolute;
  right: 6px;
  font-size: 10px;
  color: #475569;
  font-weight: 600;
}

.ip-actions { width: 40px; }

/* ── 日志行 ── */
.log-lines {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.log-line {
  font-family: "JetBrains Mono", "Fira Code", monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #64748b;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &--ok { color: #059669; background: rgba(16, 185, 129, 0.05); }
  &--warn { color: #d97706; background: rgba(245, 158, 11, 0.05); }
  &--error { color: #dc2626; background: rgba(239, 68, 68, 0.06); }
}

/* ── 统计行 ── */
.stat-rows {
  padding: 8px 0;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.07);

  &:last-child { border-bottom: none; }
}

.stat-row__label {
  font-size: 12px;
  color: #64748b;
}

.stat-row__val {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;

  &--mono { font-family: "JetBrains Mono", monospace; font-size: 12px; }
  &.is-ok { color: #059669; }
  &.is-err { color: #dc2626; }
}

/* ── 请求频率 ── */
.rate-display {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 16px 16px 8px;
}

.rate-value {
  font-size: 36px;
  font-weight: 800;
  color: #6366f1;
  line-height: 1;
}

.rate-unit {
  font-size: 13px;
  color: #94a3b8;
}

@media (max-width: 1200px) {
  .metric-row { grid-template-columns: repeat(3, 1fr); }
  .period-row { grid-template-columns: 1fr; }
  .dash-row { grid-template-columns: 1fr; }
  .dash-row:last-child { grid-template-columns: 1fr; }
}

/* ── 服务状态（合并面板） ── */
.dash-row--full {
  grid-template-columns: 1fr !important;
}

.status-inline {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-chips-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip-sm {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(148, 163, 184, 0.08);
  color: #475569;

  &.is-active { background: rgba(16, 185, 129, 0.12); color: #059669; border-color: rgba(16, 185, 129, 0.25); }
  &.is-inactive { background: rgba(239, 68, 68, 0.1); color: #dc2626; border-color: rgba(239, 68, 68, 0.2); }
  &.is-ok { background: rgba(16, 185, 129, 0.1); color: #059669; border-color: rgba(16, 185, 129, 0.2); }
  &.is-fail { background: rgba(239, 68, 68, 0.1); color: #dc2626; border-color: rgba(239, 68, 68, 0.2); }
  &.is-mono { font-family: "JetBrains Mono", monospace; }

  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    flex-shrink: 0;
  }
}

.status-pre-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.status-pre-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-pre-label {
  font-size: 11px;
  font-weight: 600;
  color: #64748b;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.status-pre {
  margin: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.12);
  font-family: "JetBrains Mono", monospace;
  font-size: 11.5px;
  line-height: 1.6;
  color: #334155;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
}
</style>
