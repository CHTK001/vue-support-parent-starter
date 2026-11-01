<script setup lang="ts">
/**
 * 渠道健康页（对标 Sub2API Channel Monitor）。
 *
 * <p>对全部已启用的 AI 供应商（API Key / Bearer / OAuth / 无认证）按「供应商 + 连接」
 * 维度维护探针状态：UNKNOWN / ONLINE / WARNING / DOWN / RATE_LIMITED。</p>
 *
 * <p>页面行为（也就是 Sub2API 的 "Channel Health"）：</p>
 * <ul>
 *   <li>定时轮询：全局健康设置中设定间隔（最小 30s），后端 ChannelHealthProbeTask 逐渠道探针；</li>
 *   <li>手动「立即探针」：单连接 / 全部；</li>
 *   <li>手动介入：重置状态、设单连接探针间隔（0 = 走全局）；</li>
 *   <li>超限自动雕刻：连续失败达阈值 → DOWN（路由层剔除），连续成功达阈值 → 恢复。</li>
 * </ul>
 *
 * @author CH
 * @since 4.0.0.57
 */
import { Refresh as RefreshIcon } from '@element-plus/icons-vue';
import { onMounted, onUnmounted, reactive, ref } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

import RePageHead from '@/components/ui/RePageHead.vue';
import { channelHealthApi, type ChannelHealthSummary } from '@/services/javaApi';

const loading = ref(false);
const probing = ref(false);
const probingId = ref<string | null>(null);
const error = ref('');
const states = ref<ChannelHealthSummary[]>([]);

// 页面轮询（与后端探针间隔同频）
const POLL_INTERVAL_SEC = 30;
const timer = ref<ReturnType<typeof setInterval> | null>(null);

const KPI_KEYS = ['UNKNOWN', 'ONLINE', 'WARNING', 'DOWN', 'RATE_LIMITED'] as const;
const kpis = reactive<Record<string, number>>({
  UNKNOWN: 0, ONLINE: 0, WARNING: 0, DOWN: 0, RATE_LIMITED: 0,
});

// 探针间隔选项（默认 30/60/300，与后端 health 组设置对齐）
const INTERVAL_OPTIONS = [30, 60, 300].map((v) => ({ label: v + 's', value: v }));

const stateStyles: Record<string, { class: string; label: string; dot: string }> = {
  UNKNOWN: { class: 'is-unknown', label: '未探针', dot: '#94a3b8' },
  ONLINE: { class: 'is-online', label: '在线', dot: '#22c55e' },
  WARNING: { class: 'is-warning', label: '告警', dot: '#f59e0b' },
  DOWN: { class: 'is-down', label: '下线', dot: '#ef4444' },
  RATE_LIMITED: { class: 'is-rate', label: '限流', dot: '#a855f7' },
};

function stateStyle(state: string) {
  return stateStyles[state] ?? { class: 'is-unknown', label: state, dot: '#94a3b8' };
}

function relative(ts: number | undefined): string {
  if (!ts) return '—';
  const d = Date.now() - ts;
  if (d < 0) return '未来';
  if (d < 60_000) return '刚刚';
  if (d < 3600_000) return Math.floor(d / 60_000) + ' 分钟前';
  if (d < 86400_000) return Math.floor(d / 3600_000) + ' 小时前';
  return new Date(ts).toLocaleDateString();
}

function formatLatency(ms: number | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return ms + ' ms';
  return (ms / 1000).toFixed(2) + ' s';
}

// ---------- 取数 ----------
async function load() {
  loading.value = true;
  error.value = '';
  try {
    const res = await channelHealthApi.list();
    const list: ChannelHealthSummary[] = Array.isArray(res?.data) ? res.data : [];
    states.value = list;
    // 统计 KPI
    for (const k of KPI_KEYS) kpis[k] = list.filter((s) => s.state === k).length;
  } catch (e: any) {
    error.value = e?.message ?? String(e);
    ElMessage.error('渠道健康页加载失败：' + (e?.message ?? e));
  } finally {
    loading.value = false;
  }
}

// 停止轮询
function stopPoll() {
  if (timer.value) {
    clearInterval(timer.value);
    timer.value = null;
  }
}

// ---------- 探针 ----------
async function probe(id?: string) {
  try {
    probingId.value = id ?? 'ALL';
    if (id) {
      await channelHealthApi.probe(id);
    } else {
      await channelHealthApi.probeAll();
    }
    ElMessage.success('探针完成');
  } catch (e: any) {
    ElMessage.error('探针失败：' + (e?.message ?? e));
  } finally {
    probingId.value = null;
  }
}

// 批量重新探针
async function probeAll() {
  try {
    probing.value = true;
    await probe();
  } finally {
    probing.value = false;
  }
}

// ---------- 重置/间隔 ----------
async function resetState(row: ChannelHealthSummary) {
  try {
    await ElMessageBox.confirm(`重置「${row.label ?? row.providerId ?? row.channel ?? row.connectionId}」的健康状态？`, '确认', {
      type: 'warning',
    });
  } catch {
    return;
  }
  try {
    // 间隔回全局 + 状态清零
    await channelHealthApi.updateInterval(row.connectionId!, 0);
    ElMessage.success('已重置');
    await load();
  } catch (e: any) {
    ElMessage.error('重置失败：' + (e?.message ?? e));
  }
}

async function updateInterval(row: ChannelHealthSummary, interval: number) {
  try {
    await channelHealthApi.updateInterval(row.connectionId!, interval);
    ElMessage.success('探针间隔已设定');
    await load();
  } catch (e: any) {
    ElMessage.error('间隔设定失败：' + (e?.message ?? e));
  }
}

// ---------- 启动 ----------
onMounted(() => {
  load();
  // 页面常驻：轮询刷新（不依赖后端探针轮询）
  timer.value = setInterval(load, POLL_INTERVAL_SEC * 1000);
});
onUnmounted(stopPoll);
</script>

<template>
  <div class="ch-page">
    <RePageHead title="渠道健康" sub="AI 供应商通道探针状态、上下线雕刻与执行">
      <template #actions>
        <el-button class="ch-btn" :loading="loading" @click="load">
          <el-icon v-if="!loading" class="ch-btn__icon" aria-hidden="true"><RefreshIcon /></el-icon>
          刷新
        </el-button>
        <el-button type="primary" :loading="probing || probingId !== null" @click="probeAll">
          全部探针
        </el-button>
      </template>
    </RePageHead>

    <!-- 错误条 -->
    <div v-if="error" class="ch-alert is-danger">
      <span>渠道健康页加载失败：{{ error }}</span>
      <button @click="load">重试</button>
    </div>

    <!-- 空态 -->
    <el-empty v-if="!loading && !states.length" description="暂无通道探针数据" />

    <!-- 概览 KPI -->
    <div v-else class="ch-stats">
      <div v-for="k in KPI_KEYS" :key="k" class="ch-stat">
        <b :class="'ch-stat__value ' + stateStyle(k).class">{{ kpis[k] }}</b>
        <span class="ch-stat__label">{{ stateStyle(k).label }}</span>
      </div>
    </div>

    <!-- 通道列表 -->
    <div class="ch-table-wrap">
      <el-table :data="states" stripe v-loading="loading" class="ch-table">
        <el-table-column prop="providerId" label="供应商" min-width="130" show-overflow-tooltip />
        <el-table-column prop="channel" label="渠道" min-width="100" show-overflow-tooltip />
        <el-table-column prop="label" label="连接标签" min-width="150" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <span class="ch-status" :class="stateStyle(row.state).class">
              <i class="ch-status__dot" :style="{ background: stateStyle(row.state).dot }" />
              {{ stateStyle(row.state).label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="探针结果" width="200" align="center">
          <template #default="{ row }">
            <div class="ch-probe">
              <span class="ch-probe__status">{{ row.lastProbeStatus ?? '—' }}</span>
              <span class="ch-probe__latency" :title="formatLatency(row.lastProbeLatency)">
                {{ formatLatency(row.lastProbeLatency) }} · {{ relative(row.lastProbeAt) }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="连续失败" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'is-critical': row.consecutiveFailures && row.consecutiveFailures >= 3 }">
              {{ row.consecutiveFailures ?? 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="平均延迟" width="120" align="center">
          <template #default="{ row }">
            {{ formatLatency(row.averageLatency) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="340" align="center">
          <template #default="{ row }">
            <el-button class="ch-op" :loading="probingId === row.connectionId" @click="probe(row.connectionId)">
              探针
            </el-button>
            <el-select class="ch-op" v-model="row.intervalSeconds" placeholder="全局"
              @change="updateInterval(row, $event)">
              <el-option v-for="o in INTERVAL_OPTIONS" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-button class="ch-op ch-op--danger" @click="resetState(row)">重置</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.ch-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0 24px;
}

.ch-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  font-size: 13px;
  cursor: pointer;
  transition: all .15s ease;
}
.ch-btn:hover {
  border-color: var(--el-color-primary-light-5, #a0cfff);
  color: var(--el-color-primary, #409eff);
}

.ch-alert {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.ch-alert.is-danger {
  background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 8%, transparent);
  color: var(--el-color-danger, #f56c6c);
}
.ch-alert button {
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  border-radius: 4px;
  padding: 2px 10px;
  cursor: pointer;
  font-size: 12px;
}

/* ============ 概览 KPI ============ */
.ch-stats {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.ch-stat {
  flex: 1 1 140px;
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 10px;
  padding: 10px 14px;
  background: var(--bg-elevated, #f8fafc);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ch-stat__value {
  font-size: 22px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary, #0f172a);
}
.ch-stat__label {
  font-size: 12px;
  color: var(--text-secondary, #475569);
}

/* ============ 列表 ============ */
.ch-table-wrap {
  border: 1px solid var(--border-default, #e2e9f3);
  border-radius: 12px;
  background: var(--bg-container, #fff);
  overflow: hidden;
}
.ch-table {
  width: 100%;
  font-size: 13px;
}
.ch-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 10px;
  border-radius: 99px;
  font-size: 12px;
  font-weight: 500;
}
.ch-status__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}
.ch-status.is-unknown { color: var(--el-text-color-secondary, #909399); background: var(--el-fill-color-blank); }
.ch-status.is-online { color: var(--el-color-success, #67c23a); background: color-mix(in srgb, var(--el-color-success, #67c23a) 14%, transparent); }
.ch-status.is-warning { color: var(--el-color-warning, #e6a23c); background: color-mix(in srgb, var(--el-color-warning, #e6a23c) 14%, transparent); }
.ch-status.is-down { color: var(--el-color-danger, #f56c6c); background: color-mix(in srgb, var(--el-color-danger, #f56c6c) 14%, transparent); }
.ch-status.is-rate { color: var(--el-color-warning, #d946ef); background: color-mix(in srgb, var(--el-color-warning, #a855f7) 14%, transparent); }

.ch-probe {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  line-height: 1.4;
}
.ch-probe__status {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ch-probe__latency {
  font-size: 11px;
  color: var(--text-secondary, #475569);
}
.ch-probe__latency.is-negative { color: var(--el-color-danger, #f56c6c); }

.is-critical { color: var(--el-color-danger, #f56c6c); font-weight: 600; }

.ch-op {
  font-size: 12px;
  padding: 4px 10px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background: var(--el-fill-color-blank, #fff);
  color: var(--el-text-color-regular, #606266);
  cursor: pointer;
}
.ch-op:hover { border-color: var(--el-color-primary-light-5, #a0cfff); color: var(--el-color-primary, #409eff); }
.ch-op--danger:hover { border-color: var(--el-color-danger-light-5, #fab6b6); color: var(--el-color-danger, #f56c6c); }
</style>
