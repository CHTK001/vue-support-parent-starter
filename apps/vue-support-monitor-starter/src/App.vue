<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { Search, Star, StarFilled } from "@element-plus/icons-vue";
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

type FilterKey = "all" | "online" | "starred";

const hosts = ref<Host[]>([]);
const loading = ref(false);
const keyword = ref("");
const activeHost = ref<Host | null>(null);
const connection = ref<{ hostId: number; hostName: string; protocol: string } | null>(null);
const filter = ref<FilterKey>("all");
const stars = ref<Set<number>>(loadStars());

function loadStars(): Set<number> {
  try {
    const raw = localStorage.getItem("ms.host.stars");
    return new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set<number>();
  }
}

function toggleStar(id: number): void {
  if (stars.value.has(id)) {
    stars.value.delete(id);
  } else {
    stars.value.add(id);
  }
  stars.value = new Set(stars.value);
  localStorage.setItem("ms.host.stars", JSON.stringify([...stars.value]));
}

/** 按设计 §4.8：Linux→SSH、Windows→RDP、macOS→VNC */
function protocolOf(host: Host): string {
  const os = host.serverHostOsType?.toUpperCase() ?? "";
  if (os.includes("WIN")) return "rdp";
  if (os.includes("MAC")) return "vnc";
  return "ssh";
}

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "online", label: "在线" },
  { key: "starred", label: "星标" },
];

const filteredHosts = computed(() => {
  let list = hosts.value;
  if (filter.value === "online") list = list.filter(h => h.serverHostOnline === 1);
  if (filter.value === "starred") list = list.filter(h => stars.value.has(h.id));
  if (!keyword.value) return list;
  const k = keyword.value.toLowerCase();
  return list.filter(
    h =>
      h.serverHostName.toLowerCase().includes(k) ||
      h.serverHostAddress.toLowerCase().includes(k),
  );
});

/** 按 OS 分组，组内在线优先、名称升序 */
const hostGroups = computed(() => {
  const map = new Map<string, Host[]>();
  for (const h of filteredHosts.value) {
    const os = normalizeOs(h.serverHostOsType);
    if (!map.has(os)) map.set(os, []);
    map.get(os)!.push(h);
  }
  for (const list of map.values()) {
    list.sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0) || a.serverHostName.localeCompare(b.serverHostName));
  }
  return [...map.entries()];
});

function normalizeOs(osType?: string): string {
  const t = osType?.toUpperCase() ?? "";
  if (t.includes("WIN")) return "Windows";
  if (t.includes("LINUX")) return "Linux";
  if (t.includes("MAC")) return "macOS";
  return "其他";
}

function osIcon(osType: string): string {
  const t = osType?.toUpperCase() ?? "";
  if (t.includes("WIN")) return "🪟";
  if (t.includes("LINUX")) return "🐧";
  if (t.includes("MAC")) return "🍎";
  return "🖥️";
}

const onlineCount = computed(() => hosts.value.filter(h => h.serverHostOnline === 1).length);

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
    protocol: protocolOf(host),
  };
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
          <div class="ws-sub">沉浸式远程控制台</div>
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

      <div class="ws-filters">
        <button
          v-for="f in FILTERS"
          :key="f.key"
          :class="['ws-filter-chip', { active: filter === f.key }]"
          @click="filter = f.key"
        >
          {{ f.label }}
        </button>
        <span class="ws-online-stat">
          <span class="ws-online-dot" />
          {{ onlineCount }}/{{ hosts.length }}
        </span>
      </div>

      <el-scrollbar class="ws-host-list">
        <template v-for="[group, list] in hostGroups" :key="group">
          <div class="ws-group-title">
            <span>{{ osIcon(group) }} {{ group }}</span>
            <span class="ws-group-count">{{ list.length }}</span>
          </div>
          <div
            v-for="host in list"
            :key="host.id"
            :class="['ws-host-item', { active: activeHost?.id === host.id, online: host.serverHostOnline === 1 }]"
            @click="selectHost(host)"
          >
            <div class="ws-host-row">
              <span class="ws-host-os">{{ osIcon(host.serverHostOsType) }}</span>
              <span class="ws-host-name" :title="host.serverHostName">{{ host.serverHostName }}</span>
              <span
                :class="['ws-host-proto', `proto-${protocolOf(host)}`]"
              >{{ protocolOf(host).toUpperCase() }}</span>
              <span
                class="ws-host-star"
                :class="{ on: stars.has(host.id) }"
                title="星标书签"
                @click.stop="toggleStar(host.id)"
              >
                <el-icon :size="13">
                  <StarFilled v-if="stars.has(host.id)" />
                  <Star v-else />
                </el-icon>
              </span>
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
        </template>

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
  width: 288px;
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
  border-radius: 6px;
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
  padding: 12px 16px 8px;
}
.ws-filters {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px 10px;
}
.ws-filter-chip {
  height: 24px;
  padding: 0 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.15s ease;
  &:hover {
    color: var(--el-color-primary);
    border-color: var(--el-color-primary-light-5);
  }
  &.active {
    color: #fff;
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
  }
}
.ws-online-stat {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.ws-online-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #67c23a;
}
.ws-host-list {
  flex: 1;
  min-height: 0;
  padding: 0 12px 12px;
}
.ws-group-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 6px 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  &:not(:first-child) {
    margin-top: 6px;
  }
}
.ws-group-count {
  font-weight: 400;
  opacity: 0.7;
}
.ws-host-item {
  padding: 10px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.15s ease;
  border: 1px solid transparent;
  &:hover {
    background: var(--el-fill-color-light);
    .ws-host-star {
      opacity: 1;
    }
  }
  &.active {
    background: var(--el-color-primary-light-9);
    border-color: var(--el-color-primary-light-5);
  }
}
.ws-host-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ws-host-os {
  font-size: 14px;
  line-height: 1;
}
.ws-host-name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ws-host-proto {
  flex-shrink: 0;
  padding: 1px 5px;
  font-size: 10px;
  font-weight: 700;
  font-family: monospace;
  border-radius: 2px;
  letter-spacing: 0.5px;
  &.proto-ssh {
    color: #409eff;
    background: rgba(64, 158, 255, 0.12);
  }
  &.proto-rdp {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.14);
  }
  &.proto-vnc {
    color: #9254de;
    background: rgba(146, 84, 222, 0.12);
  }
}
.ws-host-star {
  display: inline-flex;
  color: var(--el-text-color-placeholder);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s ease, color 0.15s ease;
  &:hover {
    color: #e6a23c;
  }
  &.on {
    opacity: 1;
    color: #e6a23c;
  }
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
  font-family: monospace;
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
