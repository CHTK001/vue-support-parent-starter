<template>
  <el-drawer v-model="visible" title="主题配置" size="300px">
    <div class="theme-config-section">
      <h4>布局模式</h4>
      <el-radio-group v-model="globalStore.layout" @change="handleLayoutChange">
        <el-radio-button value="vertical">纵向</el-radio-button>
        <el-radio-button value="columns">分栏</el-radio-button>
        <el-radio-button value="classic">经典</el-radio-button>
        <el-radio-button value="horizontal">横向</el-radio-button>
        <el-radio-button value="optimum">混合</el-radio-button>
      </el-radio-group>
    </div>
    <div class="theme-config-section">
      <h4>主题色</h4>
      <el-color-picker v-model="globalStore.themeColor" @change="handleThemeColorChange" />
    </div>
    <div class="theme-config-section">
      <h4>深色模式</h4>
      <el-switch v-model="globalStore.isDark" @change="handleDarkChange" />
    </div>
    <div class="theme-config-section">
      <h4>标签风格</h4>
      <el-radio-group v-model="globalStore.tabsStyle" @change="handleTabsStyleChange">
        <el-radio-button value="google">谷歌</el-radio-button>
        <el-radio-button value="card">卡片</el-radio-button>
        <el-radio-button value="plain">简约</el-radio-button>
      </el-radio-group>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useKoiGlobalStore } from "../../stores/global";
import { useDark, useToggle } from "@vueuse/core";

const visible = ref(false);
const globalStore = useKoiGlobalStore();
const isDark = useDark();
const toggleDark = useToggle(isDark);

function handleLayoutChange(val: string) { globalStore.setGlobalState("layout", val); }
function handleThemeColorChange(val: string) { globalStore.setGlobalState("themeColor", val); }
function handleDarkChange(val: boolean) { globalStore.setGlobalState("isDark", val); toggleDark(val); }
function handleTabsStyleChange(val: string) { globalStore.setGlobalState("tabsStyle", val); }

function open() { visible.value = true; }
defineExpose({ open });
</script>

<style scoped>
.theme-config-section { margin-bottom: 20px; }
.theme-config-section h4 { margin: 0 0 8px; font-size: 14px; color: var(--el-text-color-primary); }
</style>