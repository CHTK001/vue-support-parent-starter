<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Search } from "@element-plus/icons-vue";
import { queryHosts } from "@pages/server/src/api";
import ImmersiveTerminal from "./components/ImmersiveTerminal.vue";

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  serverHostStatus: number;
  serverHostOnline: number;
  serverHostRemoteEnabled: number;
}

const hosts = ref<Host[]>([]);
const loading = ref(false);
const keyword = ref("");
const activeHost = ref<Host | null>(null);
const connection = ref<{ hostId: number; hostName: string; protocol: string } | null>(null);

const filteredHosts = computed(() => {
  if (!keyword.value) return hosts.value;
  const k = keyword.value.toLowerCase();
  return hosts.value.filter(
    h =>
      h.serverHostName.toLowerCase().includes(k) ||
      h.serverHostAddress.toLowerCase().includes(k),
  );
});

async function fetchHosts() {
  loading.value = true;
  try {
    const res = await queryHosts();
    hosts.value = (res ?? []).sort((a: Host, b: Host) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0));
  } catch (e) {
    console.error("获取主机列表失败", e);
  } finally {
    loading.value = false;
  }
}

function selectHost(host: Host) {
  activeHost.value = host;
  connection.value = {
    hostId: host.id,
    hostName: `${host.serverHostName} (${host.serverHostAddress})`,
    protocol: host.serverHostPort === 3389 ? "rdp" : "ssh",
  };
}

function osIcon(osType: string) {
  const t = osType?.toUpperCase() ?? "";
  if (t.includes("WIN")) return "🪟";
  if (t.includes("LINUX")) return "🐧";
  if (t.includes("MAC")) return "🍎";
  return "🖥️";
}

onMounted(fetchHosts);
</script>

<template>
  <div class="ws-shell">
    <aside class="ws-side">
      <div class="ws-brand">
        <div class="ws-logo">
          <el-icon :size="22"><Monitor /></el-icon>
        </div>
        <div class="ws-title">
          <div class="ws-name">监控管理平台</div>
          <div class="ws-sub">本地工作台</div>
        </div>
      </div>

      <div class="ws-search">
        <el-input
          v-model="keyword"
          placeholder="搜索主机 / IP"
          clearable
          :prefix-icon="Search"
          size="small"
        />
      </div>

      <div class="ws-section-title">
        主机资源
        <el-tag type="info" size="small">{{ filteredHosts.length }}</el-tag>
      </div>

      <el-scrollbar class="ws-host-list">
        <div
          v-for="host in filteredHosts"
          :key="host.id"
          :class="['ws-host-item', { active: activeHost?.id === host.id, online: host.serverHostOnline === 1 }]"
          @click="selectHost(host)"
        >
          <div class="ws-host-row">
            <span class="ws-host-os">{{ osIcon(host.serverHostOsType) }}</span>
            <span class="ws-host-name" :title="host.serverHostName">{{ host.serverHostName }}</span>
            <span
              class="ws-host-dot"
              :class="host.serverHostOnline === 1 ? 'online' : 'offline'"
            />
          </div>
          <div class="ws-host-meta">
            {{ host.serverHostAddress }}:{{ host.serverHostPort }}
            <span v-if="host.serverHostRemoteEnabled" class="ws-host-remote">远控</span>
          </div>
        </div>

        <el-empty v-if="!loading && filteredHosts.length === 0" description="暂无主机" />
      </el-scrollbar>

      <div class="ws-footer">
        <el-text type="info" size="small">guacd: 124.221.230.112:4822</el-text>
      </div>
    </aside>

    <main class="ws-main">
      <ImmersiveTerminal :connection="connection" />
    </main>
  </div>
</template>

<style scoped lang="scss">
.ws-shell {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}
.ws-side {
  display: flex;
  flex-direction: column;
  width: 280px;
  flex-shrink: 0;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color-lighter);
}
.ws-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 64px;
  padding: 0 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.ws-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  color: #fff;
  background: linear-gradient(135deg, #409eff 0%, #6f42c1 100%);
  border-radius: 10px;
}
.ws-name {
  font-size: 15px;
  font-weight: 700;
}
.ws-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}
.ws-search {
  padding: 12px 16px;
}
.ws-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.ws-host-list {
  flex: 1;
  min-height: 0;
  padding: 0 12px 12px;
}
.ws-host-item {
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  border: 1px solid transparent;
  &:hover {
    background: var(--el-fill-color-light);
  }
  &.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }
}
.ws-host-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ws-host-os {
  font-size: 14px;
  line-height: 1;
}
.ws-host-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-host-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  &.online {
    background: #67c23a;
    box-shadow: 0 0 0 2px rgba(103, 194, 58, 0.2);
  }
  &.offline {
    background: #909399;
  }
}
.ws-host-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ws-host-remote {
  color: var(--el-color-primary);
  font-size: 11px;
  font-weight: 600;
}
.ws-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}
.ws-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
</style>
