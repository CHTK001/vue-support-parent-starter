<template>
  <div class="page-card">
    <div class="page-header">
      <h2>{{ t("settings.sync") }}</h2>
    </div>

    <div class="card-nav-inline">
      <div v-for="item in settingsNav" :key="item.path" :class="['nav-card-inline', { active: route.path === item.path }]" @click="router.push(item.path)">
        <span class="nav-icon-inline" v-html="item.icon" />
        <div class="nav-info-inline">
          <span class="nav-name-inline">{{ item.name }}</span>
          <span class="nav-desc-inline">{{ item.desc }}</span>
        </div>
      </div>
    </div>

    <p class="sync-desc">{{ t('settings.syncDesc') }} 定时任务由后端执行，前端仅配置间隔时间。</p>

    <div class="sync-grid">
      <div class="section-block">
        <h4 class="block-title">数据源同步</h4>
        <div class="card-row">
          <div v-for="item in dataSources" :key="item.key" :class="['sync-card', { active: item.active }]">
            <div class="card-top">
              <div class="card-left">
                <div class="card-icon" :style="{ background: item.gradient }">{{ item.labelChar }}</div>
                <div>
                  <div class="card-title">{{ item.title }}</div>
                  <div class="card-sub">{{ item.sub }}</div>
                </div>
              </div>
              <el-switch v-model="item.active.value" size="small" @click.stop @change="saveSettings" />
            </div>
            <div v-if="item.active.value" class="card-bottom">
              <div class="card-interval" @click.stop>
                <span class="int-label">间隔</span>
                <el-input-number v-model="item.intervalVal.value" :min="5" :max="86400" size="small" style="width:90px" @change="saveSettings" />
                <span class="int-unit">秒</span>
              </div>
              <el-button size="small" type="primary" plain @click.stop="syncNow(item)" :loading="item.syncing">{{ t('common.refresh') }}</el-button>
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
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useSettingsStore } from "@/stores/settings";
import { scanAllClients } from "@/services";

const { t } = useI18n();
const settings = useSettingsStore();
const route = useRoute();
const router = useRouter();

const navIcons = {
  general: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  sync: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  clients: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  mcpskills: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
};

const settingsNav = computed(() => [
  { name: t('menu.settingsGeneral'), desc: '通用设置', path: '/settings/general', icon: navIcons.general },
  { name: t('menu.settingsSync'), desc: '同步配置', path: '/settings/sync', icon: navIcons.sync },
  { name: t('menu.settingsClients'), desc: '客户端管理', path: '/settings/clients', icon: navIcons.clients },
  { name: 'MCP / Skills', desc: 'MCP 与 Skills 配置', path: '/settings/mcpskills', icon: navIcons.mcpskills },
]);

const lastSyncTime = ref("");

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

const syncStates = { cc: ref(false), zc: ref(false), cb: ref(false), mcp: ref(false), sk: ref(false), dl: ref(false) };

const dataSources = [
  { key: 'cc', active: ccswitch, intervalVal: ccswitchInterval, syncing: syncStates.cc, labelChar: 'C', title: 'CCSwitch', sub: '同步用量数据', gradient: 'linear-gradient(135deg,#667eea,#764ba2)' },
  { key: 'zc', active: zcode, intervalVal: zcodeInterval, syncing: syncStates.zc, labelChar: 'Z', title: 'ZCode', sub: '同步用量数据', gradient: 'linear-gradient(135deg,#f093fb,#f5576c)' },
  { key: 'cb', active: cursorByok, intervalVal: cursorInterval, syncing: syncStates.cb, labelChar: 'B', title: 'Cursor BYOK', sub: '同步用量数据', gradient: 'linear-gradient(135deg,#4facfe,#00f2fe)' },
  { key: 'mcp', active: syncMcp, intervalVal: mcpInterval, syncing: syncStates.mcp, labelChar: 'M', title: 'MCP 同步', sub: '同步 MCP 服务器配置', gradient: 'linear-gradient(135deg,#43e97b,#38f9d7)' },
  { key: 'sk', active: syncSkills, intervalVal: skillsInterval, syncing: syncStates.sk, labelChar: 'S', title: 'Skills 同步', sub: '同步 Skills 技能配置', gradient: 'linear-gradient(135deg,#fa709a,#fee140)' },
  { key: 'dl', active: syncDaily, intervalVal: dailyInterval, syncing: syncStates.dl, labelChar: 'D', title: '日汇总', sub: '定时汇总用量数据', gradient: 'linear-gradient(135deg,#a18cd1,#fbc2eb)' },
];

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

async function syncNow(item: typeof dataSources[0]) {
  if (item.syncing.value) return;
  item.syncing.value = true;
  try {
    if (item.key === 'mcp') await scanAllClients("mcp");
    else if (item.key === 'sk') await scanAllClients("skills");
    else await fetch("/api/usage/sync", { method: "POST" });
    lastSyncTime.value = new Date().toLocaleString();
  } catch { /* ignore */ }
  item.syncing.value = false;
}
</script>

<style scoped>
.sync-desc { font-size: 13px; color: var(--el-text-color-secondary); margin: 0 0 24px; }
.sync-grid { display: flex; flex-direction: column; gap: 24px; }
.section-block { }
.block-title { font-size: 14px; font-weight: 600; margin: 0 0 12px; color: var(--el-text-color-primary); }
.card-row { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.sync-card { padding: 14px 16px; background: var(--el-fill-color-lighter); border: 2px solid transparent; border-radius: 10px; transition: all 0.2s; }
.sync-card:hover { border-color: var(--el-color-primary-light-5); }
.sync-card.active { border-color: var(--el-color-primary); background: var(--el-color-primary-light-9); }
.card-top { display: flex; align-items: center; justify-content: space-between; }
.card-left { display: flex; align-items: center; gap: 10px; }
.card-icon { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0; }
.card-title { font-size: 13px; font-weight: 600; }
.card-sub { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 1px; }
.card-bottom { display: flex; align-items: center; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-lighter); flex-wrap: wrap; }
.card-interval { display: flex; align-items: center; gap: 6px; }
.int-label { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; }
.int-unit { font-size: 11px; color: var(--el-text-color-secondary); }
.sync-footer { }
.last-sync { font-size: 12px; color: var(--el-text-color-secondary); }

/* Inline CardNav */
.card-nav-inline { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
.nav-card-inline { display: flex; align-items: center; gap: 10px; padding: 12px 16px; background: var(--el-bg-color); border: 1px solid var(--el-border-color); border-radius: 10px; cursor: pointer; transition: all 0.2s; min-width: 140px; flex: 1 1 140px; max-width: 260px; text-decoration: none; color: inherit; user-select: none; }
.nav-card-inline:hover { border-color: var(--el-color-primary-light-5); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
.nav-card-inline.active { border-color: var(--el-color-primary); background: var(--nexus-accent-glow, rgba(13,148,136,0.06)); box-shadow: 0 0 0 1px var(--el-color-primary); }
.nav-icon-inline { font-size: 20px; color: var(--el-color-primary); display: flex; flex-shrink: 0; }
.nav-info-inline { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.nav-name-inline { font-size: 13px; font-weight: 600; }
.nav-desc-inline { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
