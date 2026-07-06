<template>
  <div class="layout">
    <div class="layout-sidebar">
      <div class="logo">
        <img src="/vite.svg" alt="logo" />
        <h1>{{ t("app.title") }}</h1>
      </div>
      <el-menu :default-active="activeMenu" class="koi-sidebar-menu" router background-color="#191a20" text-color="rgba(255,255,255,0.65)" active-text-color="#ffffff">
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>{{ t("menu.dashboard") }}</span>
        </el-menu-item>

        <el-sub-menu index="/ai">
          <template #title>
            <el-icon><MagicStick /></el-icon>
            <span>{{ t("menu.ai") }}</span>
          </template>
          <el-menu-item index="/ai/config">{{ t("menu.aiConfig") }}</el-menu-item>
          <el-menu-item index="/ai/providers">{{ t("menu.providers") }}</el-menu-item>
          <el-menu-item index="/ai/stats">{{ t("menu.stats") || "Stats" }}</el-menu-item>
          <el-menu-item index="/ai/usage">{{ t("menu.aiUsage") }}</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/mcp/manager">
          <el-icon><Connection /></el-icon>
          <span>{{ t("menu.mcp") }}</span>
        </el-menu-item>

        <el-menu-item index="/skills/manager">
          <el-icon><Promotion /></el-icon>
          <span>{{ t("menu.skills") }}</span>
        </el-menu-item>

        <el-menu-item index="/system">
          <el-icon><Monitor /></el-icon>
          <span>{{ t("menu.system") }}</span>
        </el-menu-item>
      </el-menu>

      <div class="sidebar-footer">
        <el-dropdown trigger="click" @command="handleSettingsCmd">
          <el-button text class="settings-btn">
            <el-icon><Setting /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings-general">{{ t("menu.settingsGeneral") }}</el-dropdown-item>
              <el-dropdown-item command="settings-ai">{{ t("menu.settingsAI") }}</el-dropdown-item>
              <el-dropdown-item command="settings-sync">{{ t("menu.settingsSync") }}</el-dropdown-item>
              <el-dropdown-item command="settings-clients">{{ t("menu.settingsClients") }}</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-dropdown trigger="click" @command="handleLangChange">
          <el-button text class="lang-btn">
            <el-icon><Message /></el-icon>
            <span>{{ currentLangLabel }}</span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="zh-CN">中文</el-dropdown-item>
              <el-dropdown-item command="en">English</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <div class="layout-main">
      <div class="layout-header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/' }">Home</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tooltip :content="t('common.refresh')" placement="bottom">
            <el-button :icon="Refresh" circle size="small" @click="refreshPage" />
          </el-tooltip>
        </div>
      </div>
      <div class="layout-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { Odometer, MagicStick, Setting, Monitor, Refresh, Message, Connection, Promotion } from "@element-plus/icons-vue";
import { setLocale, getLocale } from "@/locales";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();

const activeMenu = computed(() => route.path);
const currentTitle = computed(() => {
  const key = route.meta.title as string;
  return key ? t(key) : "";
});
const currentLangLabel = computed(() => getLocale() === "zh-CN" ? "中文" : "EN");

function handleLangChange(lang: string) { setLocale(lang); }
function handleSettingsCmd(cmd: string) { router.push(`/${cmd.replace("-", "/")}`); }
function refreshPage() { router.go(0); }
</script>

<style scoped>
.sidebar-footer { padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08); margin-top: auto; display: flex; align-items: center; gap: 8px; }
.settings-btn { color: rgba(255,255,255,0.65) !important; padding: 8px; font-size: 18px; }
.settings-btn:hover { color: #ffffff !important; }
.lang-btn { color: rgba(255,255,255,0.65) !important; width: 100%; display: flex; align-items: center; gap: 6px; justify-content: flex-start; }
.lang-btn:hover { color: #ffffff !important; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
