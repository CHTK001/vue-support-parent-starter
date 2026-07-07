<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.sync") }}</h2>
      <div class="header-badges">
        <el-tag v-if="anyTimerRunning" size="small" type="success" effect="dark">运行中</el-tag>
      </div>
    </div>

    <p class="sync-desc">{{ t('settings.syncDesc') }}</p>

    <div class="sync-grid">
      <div class="section-block">
        <h4 class="block-title">数据源同步</h4>
        <div class="card-row">
          <div v-for="item in dataSources" :key="item.key" :class="['sync-card', { active: item.active }]"
            @click="item.toggle()">
            <div class="card-top">
              <div class="card-left">
                <div class="card-icon" :style="{ background: item.gradient }">{{ item.labelChar }}</div>
                <div>
                  <div class="card-title">{{ item.title }}</div>
                  <div class="card-sub">{{ item.sub }}</div>
                </div>
              </div>
            </div>
            <div v-if="item.active" class="card-interval" @click.stop>
              <span class="int-label">间隔</span>
              <el-input-number v-model="item.intervalVal" :min="5" :max="86400" size="small" style="width:90px" />
              <span class="int-unit">秒</span>
              <span v-if="item.active" class="dot-active" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="sync-footer">
      <span class="last-sync">最近同步：{{ lastSyncTime || '暂无' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useSettingsStore } from "@/stores/settings";
import { scanAllClients } from "@/services";

const { t } = useI18n();
const settings = useSettingsStore();

const syncing = ref(false);
const lastSyncTime = ref("");

let mcpTimer: ReturnType<typeof setInterval> | null = null;
let skillsTimer: ReturnType<typeof setInterval> | null = null;
let dailyTimer: ReturnType<typeof setInterval> | null = null;
let ccTimer: ReturnType<typeof setInterval> | null = null;
let zcTimer: ReturnType<typeof setInterval> | null = null;
let cbTimer: ReturnType<typeof setInterval> | null = null;

const anyTimerRunning = computed(() => !!mcpTimer || !!skillsTimer || !!dailyTimer || !!ccTimer || !!zcTimer || !!cbTimer);

const ccswitch = ref(settings.state.syncCcswitch !== false);
const ccswitchInterval = ref(settings.state.syncCcswitchInterval || 20);
const zcode = ref(settings.state.syncZcode !== false);
const zcodeInterval = ref(settings.state.syncZcodeInterval || 20);
const cursorByok = ref(settings.state.syncCursorByok !== false);
const cursorInterval = ref(settings.state.syncCursorByokInterval || 20);
const syncMcp = ref(settings.state.syncMcp !== false);
const syncSkills = ref(settings.state.syncSkills !== false);
const mcpInterval = ref(settings.state.syncMcpInterval || 20);
const skillsInterval = ref(settings.state.syncSkillsInterval || 20);
const syncDaily = ref(settings.state.syncDaily !== false);
const dailyInterval = ref(settings.state.syncDailyInterval || 3600);

const dataSources = [
  { key: 'cc', active: ccswitch, toggle: () => ccswitch.value = !ccswitch.value, intervalVal: ccswitchInterval, labelChar: 'C', title: 'CCSwitch', sub: '同步用量数据', gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { key: 'zc', active: zcode, toggle: () => zcode.value = !zcode.value, intervalVal: zcodeInterval, labelChar: 'Z', title: 'ZCode', sub: '同步用量数据', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { key: 'cb', active: cursorByok, toggle: () => cursorByok.value = !cursorByok.value, intervalVal: cursorInterval, labelChar: 'B', title: 'Cursor BYOK', sub: '同步用量数据', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { key: 'mcp', active: syncMcp, toggle: () => syncMcp.value = !syncMcp.value, intervalVal: mcpInterval, labelChar: 'M', title: 'MCP 同步', sub: '同步 MCP 服务器配置', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { key: 'sk', active: syncSkills, toggle: () => syncSkills.value = !syncSkills.value, intervalVal: skillsInterval, labelChar: 'S', title: 'Skills 同步', sub: '同步 Skills 技能配置', gradient: 'linear-gradient(135deg,#fa709a,#fee140)' },
  { key: 'dl', active: syncDaily, toggle: () => syncDaily.value = !syncDaily.value, intervalVal: dailyInterval, labelChar: 'D', title: '日汇总', sub: '定时汇总用量数据', gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
];

const watchSources = [ccswitch, ccswitchInterval, zcode, zcodeInterval, cursorByok, cursorInterval, syncMcp, syncSkills, mcpInterval, skillsInterval, syncDaily, dailyInterval];
watch(watchSources, () => { saveSettings(); restartTimers(); });

function saveSettings() {
  settings.updateSettings({
    syncCcswitch: ccswitch.value, syncCcswitchInterval: ccswitchInterval.value,
    syncZcode: zcode.value, syncZcodeInterval: zcodeInterval.value,
    syncCursorByok: cursorByok.value, syncCursorByokInterval: cursorInterval.value,
    syncMcp: syncMcp.value, syncSkills: syncSkills.value,
    syncMcpInterval: mcpInterval.value, syncSkillsInterval: skillsInterval.value,
    syncDaily: syncDaily.value, syncDailyInterval: dailyInterval.value,
  });
}

async function doMcpSync() { if (syncing.value) return; syncing.value = true; try { await scanAllClients("mcp"); } catch {} syncing.value = false; lastSyncTime.value = new Date().toLocaleString(); }
async function doSkillsSync() { if (syncing.value) return; syncing.value = true; try { await scanAllClients("skills"); } catch {} syncing.value = false; lastSyncTime.value = new Date().toLocaleString(); }
async function doDailySync() { try { await fetch("/api/usage/sync", { method: "POST" }); } catch {} lastSyncTime.value = new Date().toLocaleString(); }
async function doUsageSync() { try { await fetch("/api/usage/sync", { method: "POST" }); } catch {} lastSyncTime.value = new Date().toLocaleString(); }

function stopTimer(r: any) { if (r) clearInterval(r); return null; }
function restartTimers() {
  mcpTimer = stopTimer(mcpTimer); skillsTimer = stopTimer(skillsTimer);
  dailyTimer = stopTimer(dailyTimer); ccTimer = stopTimer(ccTimer);
  zcTimer = stopTimer(zcTimer); cbTimer = stopTimer(cbTimer);
  if (syncMcp.value) mcpTimer = setInterval(() => doMcpSync(), mcpInterval.value * 1000);
  if (syncSkills.value) skillsTimer = setInterval(() => doSkillsSync(), skillsInterval.value * 1000);
  if (syncDaily.value) dailyTimer = setInterval(() => doDailySync(), dailyInterval.value * 1000);
  if (ccswitch.value) ccTimer = setInterval(() => doUsageSync(), ccswitchInterval.value * 1000);
  if (zcode.value) zcTimer = setInterval(() => doUsageSync(), zcodeInterval.value * 1000);
  if (cursorByok.value) cbTimer = setInterval(() => doUsageSync(), cursorInterval.value * 1000);
}

onMounted(() => restartTimers());
onUnmounted(() => { [mcpTimer, skillsTimer, dailyTimer, ccTimer, zcTimer, cbTimer].forEach(stopTimer); });
</script>

<style scoped>
.sync-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 24px; }
.sync-grid { display: flex; flex-direction: column; gap: 24px; }
.section-block { }
.block-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--el-text-color-primary); }
.card-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px; }
.sync-card { padding: 14px 16px; background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 10px; cursor: pointer; transition: all 0.2s; }
.sync-card:hover { border-color: var(--el-color-primary-light-5); }
.sync-card.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.card-top { display: flex; align-items: center; justify-content: space-between; }
.card-left { display: flex; align-items: center; gap: 10px; }
.card-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; }
.card-title { font-size: 13px; font-weight: 600; }
.card-sub { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 1px; }
.card-interval { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); }
.int-label { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; }
.int-unit { font-size: 11px; color: var(--el-text-color-secondary); }
.dot-active { width: 8px; height: 8px; border-radius: 50%; background: var(--el-color-success); margin-left: auto; animation: pulse 2s infinite; }
@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
.sync-footer { }
.last-sync { font-size: 12px; color: var(--el-text-color-secondary); }
</style>
