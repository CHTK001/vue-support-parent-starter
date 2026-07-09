<template>
  <div class="layout">
    <div class="layout-content">
      <router-view />
    </div>

    <!-- Global bottom toolbar -->
    <div class="bottom-bar">
      <span v-if="route.path !== '/'" class="bb-btn" @click="goHome">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </span>
      <span v-if="route.path !== '/'" class="bb-divider" />
      <el-dropdown trigger="click" @command="switchLang">
        <span class="bb-btn">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
          <span class="bb-label">{{ currentLang }}</span>
        </span>
        <template #dropdown>
          <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
          <el-dropdown-item command="en">English</el-dropdown-item>
        </template>
      </el-dropdown>
      <span class="bb-divider" />
      <span class="bb-btn" @click="goSettings">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const router = useRouter();
const route = useRoute();
const { locale } = useI18n();

const currentLang = computed(() => locale.value === "en" ? "EN" : "中");

function goHome() { router.push("/"); }
function goSettings() { router.push("/settings/general"); }
function switchLang(lang: string) {
  locale.value = lang;
  localStorage.setItem("lang", lang);
}
</script>

<style scoped>
.layout { width: 100%; height: 100%; display: flex; }
.layout-content { flex: 1; overflow: auto; }

/* Bottom bar */
.bottom-bar {
  position: fixed; bottom: 20px; right: 24px;
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color);
  border-radius: 30px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  z-index: 1000;
}
.bb-btn {
  display: flex; align-items: center; gap: 4px;
  padding: 6px 10px; border-radius: 20px; cursor: pointer;
  font-size: 12px; color: var(--el-text-color-secondary);
  transition: background 0.15s, color 0.15s;
}
.bb-btn:hover { background: var(--el-fill-color); color: var(--el-text-color-primary); }
.bb-label { font-size: 11px; font-weight: 600; }
.bb-divider { width: 1px; height: 18px; background: var(--el-border-color); }
</style>
