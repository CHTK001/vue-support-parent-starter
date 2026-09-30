<template>
  <div class="ssw">
    <div class="ssw__header">
      <div class="ssw__title">
        <el-icon><Monitor /></el-icon>
        <span>{{ widget.title }}</span>
      </div>
      <button class="ssw__refresh" :disabled="loading" @click="fetchData">
        <el-icon :size="14" :class="{ 'is-spinning': loading }"><Refresh /></el-icon>
      </button>
    </div>

    <div class="ssw__list" v-if="servers.length">
      <div
        v-for="server in servers"
        :key="server.id"
        class="ssw__item"
      >
        <div class="ssw__item-left">
          <div class="ssw__item-icon" :class="getStatusClass(server)">
            <el-icon :size="16"><Cpu /></el-icon>
          </div>
          <div class="ssw__item-info">
            <div class="ssw__item-name">{{ server.name || `服务器 #${server.id}` }}</div>
            <div class="ssw__item-meta">
              <span>{{ server.host || server.ip || '-' }}</span>
              <span class="ssw__item-dot">·</span>
              <span>{{ server.os || '-' }}</span>
            </div>
          </div>
        </div>
        <div class="ssw__item-right">
          <span class="ssw__item-status" :class="getStatusClass(server)">{{ server.status === 1 ? '正常' : '离线' }}</span>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="ssw__empty">
      <el-icon :size="32" color="#999"><Monitor /></el-icon>
      <p>暂无被监控服务器</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { Cpu, Monitor, Refresh } from "@element-plus/icons-vue";
import type { WidgetItem } from "../types";
import { getApiHttp } from "@repo/core";

const props = defineProps<{ widget: WidgetItem }>();

interface Server {
  id: number;
  name?: string;
  host?: string;
  ip?: string;
  os?: string;
  status?: number;
  [key: string]: unknown;
}

const servers = ref<Server[]>([]);
const loading = ref(false);
let scheduler: ReturnType<typeof setInterval> | null = null;

function getStatusClass(s: Server): string {
  return s.status === 1 ? 'is-online' : 'is-offline';
}

async function fetchData() {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await getApiHttp()
      .get("/ms/monitor")
      .then<{ code?: string; data?: Server[] }>((r) => r.data);
    if (Array.isArray(res?.data)) {
      servers.value = res.data;
    }
  } catch {
    // 静默
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
  scheduler = setInterval(fetchData, 60000);
});

onBeforeUnmount(() => {
  if (scheduler) clearInterval(scheduler);
});
</script>

<style scoped>
.ssw {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;
}

.ssw__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 8px 12px 0;
}

.ssw__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.ssw__refresh {
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

.ssw__refresh:hover:not(:disabled) {
  background: var(--el-fill-color);
  color: var(--el-color-primary);
}

.ssw__refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.is-spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.ssw__list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ssw__list::-webkit-scrollbar {
  width: 3px;
}

.ssw__list::-webkit-scrollbar-thumb {
  background: var(--el-border-color-darker);
  border-radius: 3px;
}

.ssw__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 10px;
  transition: all 0.2s;
  cursor: default;
}

.ssw__item:hover {
  background: var(--el-fill-color-light);
}

.ssw__item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.ssw__item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  flex-shrink: 0;
}

.ssw__item-icon.is-online {
  background: rgba(34, 197, 94, 0.12);
  color: #22c55e;
}

.ssw__item-icon.is-offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ssw__item-info {
  flex: 1;
  min-width: 0;
}

.ssw__item-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ssw__item-meta {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ssw__item-dot {
  margin: 0 4px;
}

.ssw__item-right {
  flex-shrink: 0;
  margin-left: 8px;
}

.ssw__item-status {
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 10px;
}

.ssw__item-status.is-online {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.ssw__item-status.is-offline {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.ssw__empty {
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