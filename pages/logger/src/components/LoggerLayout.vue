<script setup lang="ts">
/**
 * 日志控制台布局：左侧固定侧栏（品牌 + 导航 + base 标注），右侧 RouterView。
 */
import { type Component } from "vue";
import { RouterLink, RouterView } from "vue-router";
import { Cpu, Connection, Monitor, Search, TrendCharts } from "@element-plus/icons-vue";

interface MenuOption {
  path: string;
  title: string;
  icon: Component;
}

const menus: MenuOption[] = [
  { path: "/console", title: "实时控制台", icon: Monitor },
  { path: "/search", title: "日志检索", icon: Search },
  { path: "/apps", title: "应用实例", icon: Cpu },
  { path: "/trace", title: "链路追踪", icon: Connection },
  { path: "/stats", title: "统计概览", icon: TrendCharts },
];
</script>

<template>
  <div class="logger-layout">
    <aside class="logger-aside">
      <div class="logger-brand">
        <span class="brand-dot"></span>
        <span>日志控制台</span>
      </div>
      <nav class="logger-nav">
        <RouterLink
          v-for="menu in menus"
          :key="menu.path"
          :to="menu.path"
          custom
          v-slot="{ navigate, isActive }"
        >
          <div class="nav-item" :class="{ 'is-active': isActive }" @click="navigate()">
            <el-icon :size="16"><component :is="menu.icon" /></el-icon>
            <span>{{ menu.title }}</span>
          </div>
        </RouterLink>
      </nav>
      <div class="logger-aside-footer">/v2/logger</div>
    </aside>
    <main class="logger-main">
      <RouterView />
    </main>
  </div>
</template>
