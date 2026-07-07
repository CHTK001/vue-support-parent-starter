<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.sync") }}</h2>
      <el-tag v-if="anyTimerRunning" size="small" type="success">{{ t('settings.syncRunning') }}</el-tag>
    </div>

    <p class="sync-desc">{{ t('settings.syncDesc') }}</p>

    <div class="sync-cards-section">
      <div class="sync-cards-row">
        <div :class="['sync-card', 'sync-card-stacked', { active: ccswitch }]" @click="ccswitch = !ccswitch">
          <div class="sync-card-main">
            <div class="sync-card-left">
              <div class="sync-card-icon ccswitch">CC</div>
              <div>
                <div class="sync-card-title">CCSwitch</div>
                <div class="sync-card-sub">{{ t('settings.syncLocal') }}</div>
              </div>
            </div>
            <el-switch v-model="ccswitch" @click.stop />
          </div>
          <div v-if="ccswitch" class="sync-card-interval" @click.stop>
            <span class="interval-label">间隔</span>
            <el-input-number v-model="ccswitchInterval" :min="5" :max="300" size="small" style="width: 90px" />
            <span class="option-unit">秒</span>
          </div>
        </div>

        <div :class="['sync-card', 'sync-card-stacked', { active: zcode }]" @click="zcode = !zcode">
          <div class="sync-card-main">
            <div class="sync-card-left">
              <div class="sync-card-icon zcode">ZC</div>
              <div>
                <div class="sync-card-title">ZCode</div>
                <div class="sync-card-sub">{{ t('settings.syncLocal') }}</div>
              </div>
            </div>
            <el-switch v-model="zcode" @click.stop />
          </div>
          <div v-if="zcode" class="sync-card-interval" @click.stop>
            <span class="interval-label">间隔</span>
            <el-input-number v-model="zcodeInterval" :min="5" :max="300" size="small" style="width: 90px" />
            <span class="option-unit">秒</span>
          </div>
        </div>

        <div :class="['sync-card', 'sync-card-stacked', { active: cursorByok }]" @click="cursorByok = !cursorByok">
          <div class="sync-card-main">
            <div class="sync-card-left">
              <div class="sync-card-icon cursor">CB</div>
              <div>
                <div class="sync-card-title">Cursor BYOK</div>
                <div class="sync-card-sub">{{ t('settings.syncLocal') }}</div>
              </div>
            </div>
            <el-switch v-model="cursorByok" @click.stop />
          </div>
          <div v-if="cursorByok" class="sync-card-interval" @click.stop>
            <span class="interval-label">间隔</span>
            <el-input-number v-model="cursorInterval" :min="5" :max="300" size="small" style="width: 90px" />
            <span class="option-unit">秒</span>
          </div>
        </div>
      </div>

      <div class="sync-cards-row">
        <div :class="['sync-card', 'sync-card-stacked', { active: syncMcp }]" @click="syncMcp = !syncMcp">
          <div class="sync-card-main">
            <div class="sync-card-left">
              <div class="sync-card-icon mcp-sync">MCP</div>
              <div>
                <div class="sync-card-title">MCP 定时同步</div>
                <div class="sync-card-sub">同步 MCP 服务器配置</div>
              </div>
            </div>
            <el-switch v-model="syncMcp" @click.stop />
          </div>
          <div v-if="syncMcp" class="sync-card-interval" @click.stop>
            <span class="interval-label">间隔</span>
            <el-input-number v-model="mcpInterval" :min="5" :max="300" size="small" style="width: 90px" />
            <span class="option-unit">秒</span>
            <el-tag v-if="mcpTimerRunning" size="small" type="success" style="margin-left:8px">运行中</el-tag>
          </div>
        </div>

        <div :class="['sync-card', 'sync-card-stacked', { active: syncSkills }]" @click="syncSkills = !syncSkills">
          <div class="sync-card-main">
            <div class="sync-card-left">
              <div class="sync-card-icon skills-sync">SK</div>
              <div>
                <div class="sync-card-title">Skills 定时同步</div>
                <div class="sync-card-sub">同步 Skills 技能配置</div>
              </div>
            </div>
            <el-switch v-model="syncSkills" @click.stop />
          </div>
          <div v-if="syncSkills" class="sync-card-interval" @click.stop>
            <span class="interval-label">间隔</span>
            <el-input-number v-model="skillsInterval" :min="5" :max="300" size="small" style="width: 90px" />
            <span class="option-unit">秒</span>
            <el-tag v-if="skillsTimerRunning" size="small" type="success" style="margin-left:8px">运行中</el-tag>
          </div>
        </div>
      </div>
    </div>

    <el-divider />

    <div class="sync-options">
      <div class="option-item">
        <span class="option-label">最近同步</span>
        <span class="option-value-text">{{ lastSyncTime || '暂无' }}</span>
      </div>
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
const syncing = ref(false);
const lastSyncTime = ref("");
const mcpTimerRunning = ref(false);
const skillsTimerRunning = ref(false);

let ccswitchTimer: ReturnType<typeof setInterval> | null = null;
let zcodeTimer: ReturnType<typeof setInterval> | null = null;
let cursorTimer: ReturnType<typeof setInterval> | null = null;
let mcpTimer: ReturnType<typeof setInterval> | null = null;
let skillsTimer: ReturnType<typeof setInterval> | null = null;

const anyTimerRunning = computed(() => mcpTimerRunning.value || skillsTimerRunning.value);

function saveSettings() {
  settings.updateSettings({
    syncCcswitch: ccswitch.value,
    syncCcswitchInterval: ccswitchInterval.value,
    syncZcode: zcode.value,
    syncZcodeInterval: zcodeInterval.value,
    syncCursorByok: cursorByok.value,
    syncCursorByokInterval: cursorInterval.value,
    syncMcp: syncMcp.value,
    syncSkills: syncSkills.value,
    syncMcpInterval: mcpInterval.value,
    syncSkillsInterval: skillsInterval.value,
  });
}

watch([ccswitch, ccswitchInterval, zcode, zcodeInterval, cursorByok, cursorInterval, syncMcp, syncSkills, mcpInterval, skillsInterval], () => {
  saveSettings();
  restartTimers();
});

async function doMcpSync() {
  if (syncing.value) return;
  syncing.value = true;
  try { await scanAllClients("mcp"); } catch {}
  syncing.value = false;
  lastSyncTime.value = new Date().toLocaleString();
}

async function doSkillsSync() {
  if (syncing.value) return;
  syncing.value = true;
  try { await scanAllClients("skills"); } catch {}
  syncing.value = false;
  lastSyncTime.value = new Date().toLocaleString();
}

function stopTimer(ref: ReturnType<typeof setInterval> | null): null {
  if (ref) clearInterval(ref);
  return null;
}

function restartTimers() {
  ccswitchTimer = stopTimer(ccswitchTimer);
  zcodeTimer = stopTimer(zcodeTimer);
  cursorTimer = stopTimer(cursorTimer);
  mcpTimer = stopTimer(mcpTimer);
  skillsTimer = stopTimer(skillsTimer);

  if (ccswitch.value) ccswitchTimer = setInterval(() => lastSyncTime.value = new Date().toLocaleString(), ccswitchInterval.value * 1000);
  if (zcode.value) zcodeTimer = setInterval(() => lastSyncTime.value = new Date().toLocaleString(), zcodeInterval.value * 1000);
  if (cursorByok.value) cursorTimer = setInterval(() => lastSyncTime.value = new Date().toLocaleString(), cursorInterval.value * 1000);
  if (syncMcp.value) mcpTimer = setInterval(() => doMcpSync(), mcpInterval.value * 1000);
  if (syncSkills.value) skillsTimer = setInterval(() => doSkillsSync(), skillsInterval.value * 1000);

  mcpTimerRunning.value = !!mcpTimer;
  skillsTimerRunning.value = !!skillsTimer;
}

function stopAll() {
  ccswitchTimer = stopTimer(ccswitchTimer);
  zcodeTimer = stopTimer(zcodeTimer);
  cursorTimer = stopTimer(cursorTimer);
  mcpTimer = stopTimer(mcpTimer);
  skillsTimer = stopTimer(skillsTimer);
  mcpTimerRunning.value = false;
  skillsTimerRunning.value = false;
}

onMounted(() => { restartTimers(); });
onUnmounted(() => { stopAll(); });
</script>

<style scoped>
.sync-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 20px; }
.sync-cards-row { display: flex; gap: 12px; }
.sync-cards-row .sync-card { flex: 1; display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.sync-cards-row .sync-card:hover { border-color: var(--el-color-primary-light-5); }
.sync-cards-row .sync-card.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.sync-card-left { display: flex; align-items: center; gap: 14px; }
.sync-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
.sync-card-icon.ccswitch { background: linear-gradient(135deg, #667eea, #764ba2); }
.sync-card-icon.zcode { background: linear-gradient(135deg, #f093fb, #f5576c); }
.sync-card-icon.cursor { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.sync-card-icon.mcp-sync { background: linear-gradient(135deg, #43e97b, #38f9d7); }
.sync-card-icon.skills-sync { background: linear-gradient(135deg, #fa709a, #fee140); }
.sync-cards-section { display: flex; flex-direction: column; gap: 12px; }
.sync-card-title { font-size: 15px; font-weight: 600; }
.sync-card-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }
.sync-card-stacked { flex-direction: column; align-items: stretch; gap: 0; }
.sync-card-main { display: flex; align-items: center; justify-content: space-between; }
.sync-card-interval { display: flex; align-items: center; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); }
.interval-label { font-size: 12px; color: var(--el-text-color-secondary); white-space: nowrap; }
.sync-options { display: flex; flex-direction: column; gap: 16px; padding: 0 4px; }
.option-item { display: flex; align-items: center; justify-content: space-between; }
.option-label { font-size: 14px; color: var(--el-text-color-primary); }
.option-value { display: flex; align-items: center; gap: 8px; }
.option-unit { font-size: 12px; color: var(--el-text-color-secondary); }
.option-value-text { font-size: 13px; color: var(--el-text-color-secondary); }
</style>
