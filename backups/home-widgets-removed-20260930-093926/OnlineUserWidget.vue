<template>
  <div class="ouw">
    <div class="ouw__header">
      <div class="ouw__header-left">
        <div class="ouw__stat">
          <div class="ouw__stat-number" ref="countRef">{{ displayCount }}</div>
          <div class="ouw__stat-label">在线用户</div>
        </div>
      </div>
      <div class="ouw__header-right">
        <div class="ouw__badge" :class="loading ? 'is-loading' : ''">
          <span class="ouw__badge-dot" :class="onlineStatusClass"></span>
          {{ loading ? '刷新中' : `${onlineCount} 人在线` }}
        </div>
        <button class="ouw__refresh" :disabled="loading" @click="fetchData">
          <el-icon :size="14" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
        </button>
      </div>
    </div>

    <div class="ouw__list" v-if="users.length">
      <div
        v-for="user in users"
        :key="user.userId"
        class="ouw__item"
      >
        <div class="ouw__item-avatar">
          <el-avatar :size="32" :src="user.avatar">
            {{ (user.nickname || user.username || '?').charAt(0).toUpperCase() }}
          </el-avatar>
          <span class="ouw__item-dot"></span>
        </div>
        <div class="ouw__item-info">
          <div class="ouw__item-name">{{ user.nickname || user.username || '未知' }}</div>
          <div class="ouw__item-meta">{{ user.ip || '未知IP' }} · {{ user.os || '' }}</div>
        </div>
        <div class="ouw__item-time">{{ formatTime(user.loginTime) }}</div>
      </div>
    </div>

    <div v-else-if="!loading" class="ouw__empty">
      <el-icon :size="32" color="#999"><User /></el-icon>
      <p>暂无在线用户</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref } from "vue";
import { User, Refresh } from "@element-plus/icons-vue";
import type { WidgetItem } from "../types";
import { getApiHttp } from "@repo/core";

const props = defineProps<{ widget: WidgetItem }>();

interface OnlineUser {
  userId?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  ip?: string;
  os?: string;
  browser?: string;
  loginTime?: string;
  lastAccessTime?: string;
}

const users = ref<OnlineUser[]>([]);
const onlineCount = ref(0);
const loading = ref(false);
const countRef = ref<HTMLElement>();
const displayCount = ref(0);

let scheduler: ReturnType<typeof setInterval> | null = null;

const onlineStatusClass = computed(() => onlineCount.value > 0 ? 'is-online' : 'is-offline');

function formatTime(t?: string): string {
  if (!t) return '';
  try {
    const d = new Date(t);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  } catch {
    return t;
  }
}

async function fetchData() {
  if (loading.value) return;
  loading.value = true;
  try {
    const [countRes, listRes] = await Promise.all([
      getApiHttp().get("/v2/online/count").then<{ code?: string; data?: number }>((r) => r.data),
      getApiHttp().get("/v2/online/list").then<{ code?: string; data?: OnlineUser[] }>((r) => r.data),
    ]);
    if (countRes?.data !== undefined) {
      onlineCount.value = countRes.data;
      animateCount(countRes.data);
    }
    if (Array.isArray(listRes?.data)) {
      users.value = listRes.data.slice(0, 20);
    }
  } catch {
    // 静默失败
  } finally {
    loading.value = false;
  }
}

function animateCount(target: number) {
  const start = displayCount.value;
  const diff = target - start;
  if (diff === 0) return;
  const duration = 600;
  const startTime = Date.now();
  function tick() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    displayCount.value = Math.round(start + diff * easeOutCubic(progress));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

onMounted(() => {
  fetchData();
  scheduler = setInterval(fetchData, 30000);
});

onBeforeUnmount(() => {
  if (scheduler) clearInterval(scheduler);
});
</script>

<style scoped>
.ouw {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.ouw__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 12px 12px 0;
}

.ouw__header-left {
  flex: 1;
}

.ouw__stat-number {
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(135deg, var(--el-color-primary), #60a5fa);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  transition: all 0.3s;
}

.ouw__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.ouw__header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ouw__badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 3px 10px;
  border-radius: 20px;
  background: var(--el-fill-color-light);
  transition: all 0.3s;
}

.ouw__badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  transition: all 0.3s;
}

.ouw__badge-dot.is-online {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.ouw__badge-dot.is-offline {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

.ouw__refresh {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.ouw__refresh:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.ouw__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ouw__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ouw__list::-webkit-scrollbar {
  width: 3px;
}

.ouw__list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 3px;
}

.ouw__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  transition: all 0.2s;
  cursor: default;
}

.ouw__item:hover {
  background: var(--el-fill-color-light);
}

.ouw__item-avatar {
  position: relative;
  flex-shrink: 0;
}

.ouw__item-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  border: 2px solid var(--el-bg-color);
}

.ouw__item-info {
  flex: 1;
  min-width: 0;
}

.ouw__item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ouw__item-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ouw__item-time {
  font-size: 11px;
  color: var(--el-text-color-disabled);
  white-space: nowrap;
  flex-shrink: 0;
}

.ouw__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--el-text-color-disabled);
  font-size: 13px;
}
</style>