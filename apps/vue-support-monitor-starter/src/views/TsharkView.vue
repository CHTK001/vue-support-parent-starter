<script setup lang="ts">
/**
 * 抓包分析 —— design.md §4.6
 * 会话列表 + 新建抓包 + 数据包流表 + 协议统计。
 * 数据来自 /ms/monitor/tshark/*（接口缺失时优雅降级）。
 */
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  checkTshark, getTsharkInterfaces, startTsharkCapture, stopTsharkCapture,
  getTsharkSessions, getTsharkPackets, getTsharkProtocolStats,
} from "@pages/monitor/src/api";

const available = ref<boolean | null>(null);
const interfaces = ref<string[]>([]);
const sessions = ref<any[]>([]);
const packets = ref<any[]>([]);
const protocolStats = ref<{ protocol: string; count: number }[]>([]);
const currentSession = ref<number | null>(null);
const loading = ref(false);
const captureError = ref("");

const form = ref({ interface: "", filter: "", limit: 10000, running: false });

async function init(): Promise<void> {
  try {
    available.value = await checkTshark();
    interfaces.value = (await getTsharkInterfaces()) ?? [];
    if (interfaces.value.length) form.value.interface = interfaces.value[0];
    await loadSessions();
  } catch {
    available.value = false;
    captureError.value = "抓包模块不可用（tshark 未部署或接口缺失）";
  }
}
async function loadSessions(): Promise<void> {
  try {
    const r = (await getTsharkSessions(1, 20)) as any;
    sessions.value = r?.list ?? r ?? [];
  } catch { /* 降级 */ }
}
async function openSession(id: number): Promise<void> {
  currentSession.value = id;
  try {
    const [p, s] = await Promise.all([getTsharkPackets(id, 1, 20), getTsharkProtocolStats(id)]);
    packets.value = (p as any)?.list ?? p ?? [];
    protocolStats.value = (s as any[] | undefined) ?? [];
  } catch {
    packets.value = []; protocolStats.value = [];
  }
}
async function start(): Promise<void> {
  captureError.value = "";
  try {
    await startTsharkCapture({ interfaceName: form.value.interface, filter: form.value.filter || undefined, limit: form.value.limit });
    form.value.running = true;
    ElMessage.success("抓包已启动");
    setTimeout(loadSessions, 1500);
  } catch (e) {
    captureError.value = String((e as Error)?.message ?? e);
  }
}
async function stop(id: number): Promise<void> {
  try {
    await stopTsharkCapture(id);
    form.value.running = false;
    await loadSessions();
  } catch (e) {
    ElMessage.error(String((e as Error)?.message ?? e));
  }
}
const totalProto = () => protocolStats.value.reduce((a, b) => a + b.count, 0) || 1;
onMounted(init);
</script>

<template>
  <div class="ts scrollable">
    <header class="ts-head">
      <div class="ts-title-wrap">
        <h1 class="ts-title">抓包分析</h1>
        <div class="ts-sub">网络抓包 · 会话 / 包 / 协议统计</div>
      </div>
      <el-button v-if="available === false" size="small" @click="init">重试初始化</el-button>
    </header>

    <div v-if="captureError" class="ts-note warn">{{ captureError }}</div>

    <!-- 新建抓包 -->
    <div class="card form-card" v-if="available">
      <div class="form-row">
        <el-select v-model="form.interface" placeholder="网卡" size="small" style="width: 200px">
          <el-option v-for="i in interfaces" :key="i" :label="i" :value="i" />
        </el-select>
        <el-input v-model="form.filter" placeholder="过滤表达式，如 tcp and port 22" clearable size="small" style="width: 320px" />
        <el-input-number v-model="form.limit" :min="100" :max="100000" :step="1000" size="small" />
        <ReButton icon="VideoPlay" :show-text="true" size="small" type="primary" @click="start">开始抓包</ReButton>
      </div>
      <div class="form-hint">接口 {{ interfaces.length }} 个 · tshark 可用</div>
    </div>

    <!-- 会话列表 + 详情 -->
    <div class="split">
      <div class="card sess-card">
        <div class="card-title">会话列表</div>
        <div class="sess-list">
          <div v-if="sessions.length === 0" class="hint">暂无会话</div>
          <button
            v-for="s in sessions"
            :key="s.id"
            :class="['sess', { active: currentSession === s.id }]"
            @click="openSession(s.id)"
          >
            <span class="sess-name">会话 #{{ s.id }}</span>
            <span class="sess-meta">{{ s.status === 'RUNNING' ? '活跃' : '已停止' }}</span>
            <ReButton v-if="s.status === 'RUNNING'" icon="VideoPause" :show-text="false" :icon-size="24" title="停止" @click.stop="stop(s.id)" />
          </button>
          <div v-else class="hint-dim">{{ captureError }}</div>
        </div>
      </div>

      <div class="card detail-card">
        <div class="card-title">数据包 <span v-if="currentSession" class="dim">(会话 #{{ currentSession }})</span></div>
        <el-table :data="packets" size="small" height="300" empty-text="选择会话查看数据包">
          <el-table-column prop="time" label="时间" width="90"><template #default="{ row }"><span class="mono">{{ row.time ?? row.timestamp ?? "—" }}</span></template></el-table-column>
          <el-table-column prop="src" label="源" min-width="120"><template #default="{ row }"><span class="mono">{{ row.src ?? row.source ?? "—" }}</span></template></el-table-column>
          <el-table-column prop="dst" label="目的" min-width="120"><template #default="{ row }"><span class="mono">{{ row.dst ?? row.destination ?? "—" }}</span></template></el-table-column>
          <el-table-column prop="protocol" label="协议" width="80"><template #default="{ row }"><span class="mono">{{ row.protocol ?? "—" }}</span></template></el-table-column>
          <el-table-column prop="length" label="长度" width="80"><template #default="{ row }"><span class="mono">{{ row.length ?? "—" }}</span></template></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 协议统计 -->
    <div class="card">
      <div class="card-title">协议统计</div>
      <el-table :data="protocolStats" size="small" empty-text="暂无统计">
        <el-table-column prop="protocol" label="协议" />
        <el-table-column prop="count" label="数量" />
        <el-table-column label="占比" width="260">
          <template #default="{ row }">
            <div class="bar"><div class="bar-fill" :style="{ width: `${(row.count / totalProto() * 100).toFixed(1)}%` }" /></div>
            <span class="mono dim">{{ ((row.count / totalProto()) * 100).toFixed(1) }}%</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped lang="scss">
.ts { max-width: 1440px; padding: 24px; }
.ts-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 20px; }
.ts-title { margin: 0; font-size: 20px; font-weight: 600; }
.ts-sub { margin-top: 2px; font-size: 13px; color: var(--text-tertiary); }
.ts-note { padding: 10px 14px; margin-bottom: 16px; font-size: 13px; border-radius: 8px; &.warn { color: #8a5a00; background: #fff7e6; border: 1px solid #fde2a4; } }
.card { padding: 14px 16px; background: var(--bg-container); border: 1px solid var(--border-subtle); border-radius: 12px; box-shadow: var(--shadow-sm); }
.card-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.form-card { margin-bottom: 16px; }
.form-row { display: flex; align-items: center; gap: 10px; }
.form-hint { margin-top: 8px; font-size: 12px; color: var(--text-tertiary); }
.split { display: grid; grid-template-columns: 280px 1fr; gap: 16px; margin-bottom: 16px; }
.sess-card { max-height: 360px; overflow-y: auto; }
.sess-list { display: flex; flex-direction: column; gap: 6px; }
.sess { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid var(--border-subtle); border-radius: 8px; background: transparent; cursor: pointer; text-align: left; &.active { background: var(--brand-50); border-color: var(--brand-100); } }
.sess-name { flex: 1; font-size: 13px; font-weight: 600; }
.sess-meta { font-size: 11px; color: var(--text-tertiary); }
.hint, .hint-dim { padding: 20px; font-size: 12px; color: var(--text-tertiary); text-align: center; }
.dim { color: var(--text-tertiary); }
.mono { font-family: monospace; font-size: 12px; }
.bar { flex: 1; height: 6px; margin-right: 8px; background: var(--border-subtle); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--metric-net); border-radius: 3px; }
@media (max-width: 900px) { .split { grid-template-columns: 1fr; } }
</style>