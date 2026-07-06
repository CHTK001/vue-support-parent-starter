<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.sync") }}</h2>
      <el-tag v-if="timerRunning" size="small" type="success">{{ t('settings.syncRunning') }}</el-tag>
    </div>

    <p class="sync-desc">{{ t('settings.syncDesc') }}</p>

    <div class="sync-cards">
      <div class="sync-card-group">
        <div :class="['sync-card', { active: ccswitch }]" @click="ccswitch = !ccswitch">
          <div class="sync-card-left">
            <div class="sync-card-icon ccswitch">CC</div>
            <div>
              <div class="sync-card-title">CCSwitch</div>
              <div class="sync-card-sub">{{ t('settings.syncLocal') }}</div>
            </div>
          </div>
          <el-switch v-model="ccswitch" @click.stop />
        </div>
        <div v-if="ccswitch" class="sync-url-row">
          <el-input v-model="ccswitchUrl" placeholder="CCSwitch API URL" size="small" clearable @input="onUrlChange" />
        </div>
      </div>

      <div class="sync-card-group">
        <div :class="['sync-card', { active: zcode }]" @click="zcode = !zcode">
          <div class="sync-card-left">
            <div class="sync-card-icon zcode">ZC</div>
            <div>
              <div class="sync-card-title">ZCode</div>
              <div class="sync-card-sub">{{ t('settings.syncLocal') }}</div>
            </div>
          </div>
          <el-switch v-model="zcode" @click.stop />
        </div>
        <div v-if="zcode" class="sync-url-row">
          <el-input v-model="zcodeUrl" placeholder="ZCode API URL" size="small" clearable @input="onUrlChange" />
        </div>
      </div>

      <div class="sync-card-group">
        <div :class="['sync-card', { active: cursorByok }]" @click="cursorByok = !cursorByok">
          <div class="sync-card-left">
            <div class="sync-card-icon cursor">CB</div>
            <div>
              <div class="sync-card-title">Cursor BYOK</div>
              <div class="sync-card-sub">{{ t('settings.syncLocal') }}</div>
            </div>
          </div>
          <el-switch v-model="cursorByok" @click.stop />
        </div>
        <div v-if="cursorByok" class="sync-url-row">
          <el-input v-model="cursorByokUrl" placeholder="Cursor BYOK API URL" size="small" clearable @input="onUrlChange" />
        </div>
      </div>
    </div>

    <el-divider />

    <div class="sync-options">
      <div class="option-item">
        <span class="option-label">{{ t('settings.syncInterval') }}</span>
        <div class="option-value">
          <el-input-number v-model="intervalMinutes" :min="1" :max="60" size="small" style="width: 100px" />
          <span class="option-unit">分钟</span>
        </div>
      </div>
      <div class="option-item">
        <span class="option-label">{{ t('settings.syncAutoImport') }}</span>
        <el-switch v-model="autoImport" size="small" />
      </div>
    </div>

    <el-divider />

    <div class="sync-manual">
      <el-button size="small" @click="manualSync" :loading="syncing" :disabled="!hasAnySource">
        <el-icon><Refresh /></el-icon> 立即同步
      </el-button>
      <span v-if="lastSyncTime" class="sync-last">上次同步：{{ lastSyncTime }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { Refresh } from "@element-plus/icons-vue";
import { useSettingsStore } from "@/stores/settings";
import { insertUsageRecord } from "@/services";

const { t } = useI18n();
const settings = useSettingsStore();

const ccswitch = ref(settings.state.syncCcswitch || false);
const zcode = ref(settings.state.syncZcode || false);
const cursorByok = ref(settings.state.syncCursorByok || false);
const ccswitchUrl = ref(settings.state.syncCcswitchUrl || "");
const zcodeUrl = ref(settings.state.syncZcodeUrl || "");
const cursorByokUrl = ref(settings.state.syncCursorByokUrl || "");
const intervalMinutes = ref(settings.state.syncIntervalMinutes || 1);
const autoImport = ref(settings.state.syncAutoImport !== false);
const syncing = ref(false);
const lastSyncTime = ref("");
const timerRunning = ref(false);

let syncTimer: ReturnType<typeof setInterval> | null = null;

const hasAnySource = computed(() => ccswitch.value || zcode.value || cursorByok.value);

function onUrlChange() {
  saveSettings();
}

function saveSettings() {
  settings.updateSettings({
    syncCcswitch: ccswitch.value,
    syncZcode: zcode.value,
    syncCursorByok: cursorByok.value,
    syncCcswitchUrl: ccswitchUrl.value,
    syncZcodeUrl: zcodeUrl.value,
    syncCursorByokUrl: cursorByokUrl.value,
    syncIntervalMinutes: intervalMinutes.value,
    syncAutoImport: autoImport.value,
  });
}

watch([ccswitch, zcode, cursorByok, intervalMinutes, autoImport], () => {
  saveSettings();
  restartTimer();
});

async function fetchAndRecord(source: string, url: string) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return;
    const data = await res.json();
    const records: Array<{
      model?: string;
      providerId?: string;
      providerName?: string;
      promptTokens?: number;
      completionTokens?: number;
      totalTokens?: number;
      cost?: number;
      timestamp?: string;
    }> = Array.isArray(data) ? data : data.records || data.data || [];

    for (const item of records) {
      if (!item.model) continue;
      await insertUsageRecord({
        id: `${source}-${item.timestamp || Date.now()}-${item.model}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: item.timestamp || new Date().toISOString(),
        model: item.model,
        providerId: item.providerId || source,
        providerName: item.providerName || source,
        promptTokens: item.promptTokens || 0,
        completionTokens: item.completionTokens || 0,
        totalTokens: item.totalTokens || (item.promptTokens || 0) + (item.completionTokens || 0),
        cost: item.cost || 0,
        source,
      });
    }
  } catch {
    // silently ignore fetch errors
  }
}

async function doSync() {
  if (syncing.value) return;
  syncing.value = true;
  const promises: Promise<void>[] = [];

  if (ccswitch.value && ccswitchUrl.value) {
    promises.push(fetchAndRecord("ccswitch", ccswitchUrl.value));
  }
  if (zcode.value && zcodeUrl.value) {
    promises.push(fetchAndRecord("zcode", zcodeUrl.value));
  }
  if (cursorByok.value && cursorByokUrl.value) {
    promises.push(fetchAndRecord("cursor-byok", cursorByokUrl.value));
  }

  await Promise.allSettled(promises);
  syncing.value = false;
  lastSyncTime.value = new Date().toLocaleString();
}

async function manualSync() {
  await doSync();
}

function startTimer() {
  stopTimer();
  const ms = intervalMinutes.value * 60 * 1000;
  syncTimer = setInterval(() => doSync(), ms);
  timerRunning.value = true;
}

function stopTimer() {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
  timerRunning.value = false;
}

function restartTimer() {
  if (hasAnySource.value) {
    startTimer();
  } else {
    stopTimer();
  }
}

onMounted(() => {
  if (hasAnySource.value) startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.sync-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 20px; }

.sync-cards { display: flex; flex-direction: column; gap: 12px; }

.sync-card-group { display: flex; flex-direction: column; gap: 4px; }

.sync-card { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.sync-card:hover { border-color: var(--el-color-primary-light-5); }
.sync-card.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }

.sync-card-left { display: flex; align-items: center; gap: 14px; }

.sync-card-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #fff; flex-shrink: 0; }
.sync-card-icon.ccswitch { background: linear-gradient(135deg, #667eea, #764ba2); }
.sync-card-icon.zcode { background: linear-gradient(135deg, #f093fb, #f5576c); }
.sync-card-icon.cursor { background: linear-gradient(135deg, #4facfe, #00f2fe); }

.sync-card-title { font-size: 15px; font-weight: 600; }
.sync-card-sub { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 2px; }

.sync-url-row { padding: 0 20px 8px; }

.sync-options { display: flex; flex-direction: column; gap: 16px; padding: 0 4px; }
.option-item { display: flex; align-items: center; justify-content: space-between; }
.option-label { font-size: 14px; color: var(--el-text-color-primary); }
.option-value { display: flex; align-items: center; gap: 8px; }
.option-unit { font-size: 12px; color: var(--el-text-color-secondary); }

.sync-manual { display: flex; align-items: center; gap: 12px; }
.sync-last { font-size: 12px; color: var(--el-text-color-secondary); }
</style>