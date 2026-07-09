<template>
  <div class="dashboard-page">
    <!-- Hero Header -->
    <div class="dash-hero">
      <div class="hero-text">
        <h1>{{ t("menu.dashboard") }}</h1>
        <p class="hero-sub">{{ activeTitle }}</p>
      </div>
    </div>

    <!-- Module Cards Grid -->
    <div class="cards-grid">
      <div v-for="(card, idx) in moduleCards" :key="card.path" class="module-card"
        :class="[`card-${idx}`, { active: lastOpened === card.path }]"
        :style="{ '--card-hue': card.hue }"
        @click="openModule(card)">
        <div class="card-glow" />
        <div class="card-icon-wrap">
          <span class="card-icon" v-html="card.icon" />
        </div>
        <div class="card-body">
          <div class="card-name">{{ card.name }}</div>
          <div class="card-path">{{ card.path }}</div>
        </div>
        <div v-if="lastOpened === card.path" class="card-badge">上次</div>
      </div>

      <!-- Add blank card -->
      <div class="module-card card-add" @click="showAddDialog = true">
        <div class="card-icon-wrap"><span class="card-icon" v-html="icons.add" /></div>
        <div class="card-body">
          <div class="card-name">添加模块</div>
          <div class="card-path">点击选择</div>
        </div>
      </div>
    </div>

    <!-- Add Module Dialog -->
    <el-dialog v-model="showAddDialog" title="添加模块" width="400px" top="20vh">
      <div class="add-list">
        <div v-for="card in availableToAdd" :key="card.path" class="add-item" @click="addModule(card)">
          <span class="add-icon" v-html="card.icon" />
          <span>{{ card.name }}</span>
        </div>
      </div>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { useMcpStore } from "@/stores/mcp";
import { useSkillsStore } from "@/stores/skills";
import { MCP_CLIENTS } from "@/utils/mcp-config";

const { t } = useI18n();
const router = useRouter();
const mcpStore = useMcpStore();
const skillsStore = useSkillsStore();

const showAddDialog = ref(false);
const lastOpened = ref(localStorage.getItem("last-opened-card") || "");

const icons = {
  dashboard: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  ai: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4z"/><path d="M8 15h8l1 2H7l1-2z"/><path d="M14 21a2 2 0 11-4 0"/></svg>',
  mcp: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>',
  settings: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
  add: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 5v14M5 12h14"/></svg>',
  sync: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>',
  provider: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>',
  system: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
  remote: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M6 8l4 4-4 4" /><circle cx="16" cy="12" r="1" fill="currentColor"/></svg>',
};

const moduleCards = ref([
  { name: "AI 配置", path: "/ai/config", icon: icons.ai, hue: 270 },
  { name: "系统管理", path: "/system", icon: icons.system, hue: 280 },
]);

const activeTitle = computed(() => {
  const c = moduleCards.value.find(x => x.path === lastOpened.value);
  return c ? `上次打开: ${c.name}` : "选择一个模块开始";
});

const availableToAdd = computed(() => {
  const existing = new Set(moduleCards.value.map(c => c.path));
  return allModules.filter(c => !existing.has(c.path));
});

const allModules = [
  { name: "AI 配置", path: "/ai/config", icon: icons.ai },
  { name: "系统管理", path: "/system", icon: icons.system },
];

function openModule(card: { name: string; path: string }) {
  localStorage.setItem("last-opened-card", card.path);
  lastOpened.value = card.path;
  router.push(card.path);
}

function addModule(card: { name: string; path: string; icon: string }) {
  moduleCards.value.push({ ...card, hue: Math.floor(Math.random() * 360) });
  showAddDialog.value = false;
}

onMounted(() => {
  // language is managed in layout
});
</script>

<style scoped>
.dashboard-page { padding: 0; position: relative; min-height: calc(100vh - 100px); }
.dash-hero { margin-bottom: 28px; }
.dash-hero h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
.hero-sub { font-size: 13px; color: var(--el-text-color-secondary); margin: 4px 0 0; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }

.module-card {
  position: relative; overflow: hidden;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color);
  border-radius: 14px; padding: 22px 20px; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.module-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.07); border-color: transparent; }
.module-card.active { border-color: var(--el-color-primary); box-shadow: 0 0 0 2px var(--el-color-primary-light-7); }

.card-glow {
  position: absolute; top: -60%; right: -40%; width: 120px; height: 120px;
  border-radius: 50%; opacity: 0.06;
  background: hsla(var(--card-hue, 200), 70%, 50%, 1);
  transition: opacity 0.3s;
}
.module-card:hover .card-glow { opacity: 0.12; }

.card-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
  background: hsla(var(--card-hue, 200), 60%, 55%, 0.1);
  color: hsla(var(--card-hue, 200), 60%, 45%, 1);
}
.card-icon { display: flex; }
.card-body { }
.card-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.card-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; }
.card-badge {
  position: absolute; top: 12px; right: 12px;
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: var(--el-color-primary); color: #fff; font-weight: 500;
}

.card-add { border-style: dashed; opacity: 0.6; }
.card-add:hover { opacity: 1; }

.card-settings { }
.card-settings .card-icon-wrap { background: rgba(100,116,139,0.1); color: #64748b; }

.add-list { display: flex; flex-direction: column; gap: 6px; }
.add-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: 8px; cursor: pointer; transition: background 0.15s; }
.add-item:hover { background: var(--el-color-primary-light-9); }
.add-icon { display: flex; color: var(--el-color-primary); }

</style>
