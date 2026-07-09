
<template>
  <div class="card-nav">
    <div
      v-for="item in items"
      :key="item.path"
      :class="['nav-card', { active: route.path === item.path }]"
      role="button"
      tabindex="0"
      @click="navigate(item.path)"
      @keydown.enter="navigate(item.path)"
      @keydown.space.prevent="navigate(item.path)"
    >
      <span class="nav-icon" v-html="item.icon" />
      <div class="nav-info">
        <span class="nav-name">{{ item.name }}</span>
        <span class="nav-desc">{{ item.desc }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from "vue-router";

export interface NavItem {
  name: string;
  desc: string;
  path: string;
  icon: string;
}

defineProps<{ items: NavItem[] }>();
const router = useRouter();
const route = useRoute();

function navigate(path: string) {
  router.push(path);
}
</script>

<style scoped>
.card-nav {
  display: flex; gap: 10px; margin-bottom: 20px;
  flex-wrap: wrap;
}
.nav-card {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color);
  border-radius: 10px; cursor: pointer; transition: all 0.2s;
  min-width: 140px; flex: 1 1 140px; max-width: 260px;
  user-select: none;
}
.nav-card:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}
.nav-card.active {
  border-color: var(--el-color-primary);
  background: var(--nexus-accent-glow, rgba(13,148,136,0.06));
  box-shadow: 0 0 0 1px var(--el-color-primary);
}
.nav-icon { font-size: 20px; color: var(--el-color-primary); display: flex; flex-shrink: 0; }
.nav-info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.nav-name { font-size: 13px; font-weight: 600; }
.nav-desc { font-size: 11px; color: var(--el-text-color-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
