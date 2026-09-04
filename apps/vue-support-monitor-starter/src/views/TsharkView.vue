<script setup lang="ts">
/**
 * 抓包分析 —— ReSectionHead + ReCard + ReTag + ReButton(square)
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
  try { sessions.value = ((await getTsharkSessions(1, 20)) as any)?.list ?? (await getTsharkSessions(1, 20)) as any ?? []; }
  catch { /* 降级 */ }
}
async function openSession(id: number): Promise<void> {
  currentSession.value = id;
  try {
    const [p, s] = await Promise.all([getTsharkPackets(id, 1, 20), getTsharkProtocolStats(id)]);
    packets.value = (p as any)?.list ?? p ?? [];
    protocolStats.value = (s as any[]) ?? [];
  } catch { packets.value = []; protocolStats.value = []; }
}
async function start(): Promise<void> {
  captureError.value = "";
  try {
    await startTsharkCapture({ interfaceName: form.value.interface, filter: form.value.filter || undefined, limit: form.value.limit });
    form.value.running = true;
    ElMessage.success("抓包已启动");
    setTimeout(loadSessions, 1500);
  } catch (e) { captureError.value = String((e as Error)?.message ?? e); }
}
async function stop(id: number): Promise<void> {
  try {
    await stopTsharkCapture(id);
    form.value.running = false;
    await loadSessions();
  } catch (e) { ElMessage.error(String((e as Error)?.message ?? e)); }
}
const totalProto = () => protocolStats.value.reduce((a, b) => a + b.count, 0) || 1;
onMounted(init);
</script>

<template>
  <div class="ts">
    <ReSectionHead :description="available === false ? '抓包模块不可用' : '网络抓包 · 会话 / 包 / 协议统计'">
      <template #title>抓包分析</template>
      <template #actions>
        <ReButton v-if="available === false" icon="RefreshRight" :show-text="true" size="small" @click="init">重试初始化</ReButton>
      </template>
    </ReSectionHead>

    <div v-if="captureError" class="ts-note warn">{{ captureError }}</div>

    <!-- 新建抓包 -->
    <ReCard v-if="available" :radius="12" shadow="never" class="form-card">
      <div class="form-row">
        <ReSelect v-model="form.interface" placeholder="网卡" size="small" style="width: 200px">
          <el-option v-for="i in interfaces" :key="i" :label="i" :value="i" />
        </ReSelect>
        <ReInput v-model="form.filter" placeholder="过滤表达式，如 tcp and port 22" clearable size="small" style="width: 320px" />
        <ReInputNumber v-model="form.limit" :min="100" :max="100000" :step="1000" size="small" />
        <ReButton icon="VideoPlay" :show-text="true" size="small" type="primary" @click="start">开始抓包</ReButton>
      </div>
      <div class="form-hint">接口 {{ interfaces.length }} 个 · tshark 可用</div>
    </ReCard>

    <!-- 会话 + 包 -->
    <div class="split">
      <ReCard :radius="12" shadow="never" class="sess-card">
        <template #header><span class="card-h">会话列表</span></template>
        <div class="sess-list">
          <ReEmpty v-if="sessions.length === 0" :description="available === false ? '接口不可用' : '暂无会话'" style="padding: 24px 0" />
          <template v-else>
            <button v-for="s in sessions" :key="s.id" :class="['sess', { active: currentSession === s.id }]" @click="openSession(s.id)">
              <span class="sess-name">会话 #{{ s.id }}</span>
              <ReTag :type="s.status === 'RUNNING' ? 'success' : 'info'" size="small">{{ s.status === 'RUNNING' ? '活跃' : '已停止' }}</ReTag>
              <ReButton v-if="s.status === 'RUNNING'" icon="VideoPause" layout="square" size="small" title="停止" @click.stop="stop(s.id)" />
            </button>
          </template>
        </div>
      </ReCard>

      <ReCard :radius="12" shadow="never" class="detail-card">
        <template #header><span class="card-h">数据包 <span class="dim">(会话 #{{ currentSession ?? "—" }})</span></span></template>
        <el-table :data="packets" size="small" height="300" empty-text="选择会话查看数据包">
          <el-table-column label="时间" width="90"><template #default="{ row }"><span class="mono">{{ row.time ?? row.timestamp ?? "—" }}</span></template></el-table-column>
          <el-table-column label="源" min-width="120"><template #default="{ row }"><span class="mono">{{ row.src ?? row.source ?? "—" }}</span></template></el-table-column>
          <el-table-column label="目的" min-width="120"><template #default="{ row }"><span class="mono">{{ row.dst ?? row.destination ?? "—" }}</span></template></el-table-column>
          <el-table-column label="协议" width="80"><template #default="{ row }"><span class="mono">{{ row.protocol ?? "—" }}</span></template></el-table-column>
          <el-table-column label="长度" width="80"><template #default="{ row }"><span class="mono">{{ row.length ?? "—" }}</span></template></el-table-column>
        </el-table>
      </ReCard>
    </div>

    <!-- 协议统计 -->
    <ReCard :radius="12" shadow="never">
      <template #header><span class="card-h">协议统计</span></template>
      <el-table :data="protocolStats" size="small" empty-text="暂无统计">
        <el-table-column prop="protocol" label="协议" />
        <el-table-column prop="count" label="数量" />
        <el-table-column label="占比" width="320"><template #default="{ row }">
          <div class="use-row"><div class="bar"><div class="bar-fill" :style="{ width: `${((row.count / totalProto()) * 100).toFixed(1)}%` }" /></div><span class="mono dim">{{ ((row.count / totalProto()) * 100).toFixed(1) }}%</span></div>
        </template></el-table-column>
      </el-table>
    </ReCard>
  </div>
</template>

<style scoped lang="scss">
.card-h { font-size: 15px; font-weight: 600; }
.ts-note { padding: 10px 14px; margin-bottom: 16px; font-size: 13px; border-radius: 8px; &.warn { color: #8a5a00; background: #fff7e6; border: 1px solid #fde2a4; } }
.form-card { margin-bottom: 16px; }
.form-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.form-hint { margin-top: 8px; font-size: 12px; color: var(--text-tertiary); }
.split { display: grid; grid-template-columns: 280px 1fr; gap: 14px; margin-bottom: 16px; }
.sess-card { }
.sess-list { display: flex; flex-direction: column; gap: 6px; }
.sess { display: flex; align-items: center; gap: 8px; padding: 9px 10px; border: 1px solid var(--border-subtle); border-radius: 8px; background: transparent; cursor: pointer; text-align: left; &.active { background: var(--brand-50); border-color: var(--brand-100); } }
.sess-name { flex: 1; font-size: 13px; font-weight: 600; }
.dim { color: var(--text-tertiary); }
.mono { font-family: monospace; font-size: 12px; }
.use-row { display: flex; align-items: center; gap: 8px; }
.bar { flex: 1; height: 6px; background: var(--border-subtle); border-radius: 3px; overflow: hidden; }
.bar-fill { height: 100%; background: var(--metric-net); border-radius: 3px; }
@media (max-width: 900px) { .split { grid-template-columns: 1fr; } }
</style>