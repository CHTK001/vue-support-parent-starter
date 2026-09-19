<script setup lang="ts">
/**
 * 远程控制工作区 —— design.md §4.8（沉浸式 master–detail）
 * 左侧主机资源条（点选即切）+ 右侧 ScGuacViewer 远控渲染（guacamole 客户端直连隧道）
 * 支持 ?hostId= 直达：从资产页「连接」进入并自动选中、自动连接。
 * @author CH
 * @since 4.0.0
 */
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { queryHosts, getHost } from "@pages/server/src/api";
import ScGuacViewer from "@pages/server/src/components/ScGuacViewer.vue";
import ScSshDirectViewer from "@pages/server/src/components/ScSshDirectViewer.vue";
import ReInput from "@repo/ui/re-input";
import ReScrollbar from "@repo/ui/re-scrollbar";
import { osIconSvg } from "../utils/osIcon";

interface Host {
  id: number;
  serverHostName: string;
  serverHostAddress: string;
  serverHostPort: number;
  serverHostOsType: string;
  serverHostOnline: number;
  serverHostRemoteEnabled: number;
  /** 远控协议（空表示按平台推断） */
  serverHostRemoteProtocol?: string | null;
  /** 远控端口（空表示按协议默认） */
  serverHostRemotePort?: number | null;
  /** 远控通道：GUACD 中转 / DIRECT 直连 */
  serverHostRemoteMode?: string | null;
}
/** 复杂/新信息类型尽量少展开，读取必需字段用 any 规约 */
const layout = { railWidth: 288, railCollapsed: 48 };

const route = useRoute();
const router = useRouter();

const hosts = ref<Host[]>([]);
const loading = ref(false);
const error = ref("");
const selectedId = ref<number | null>(null);
const railOpen = ref(true);
const keyword = ref("");

/**
 * 生效远控协议：主机配置优先，未配置时按平台推断
 * @param h 主机
 */
function protocolOf(h: Host): string {
  const q = (route.query.protocol as string) || "";
  const configured = (h.serverHostRemoteProtocol ?? "").toUpperCase();
  if (configured === "SSH" || configured === "RDP" || configured === "VNC") return configured.toLowerCase();
  if (q) return q.toLowerCase();
  const s = (h.serverHostOsType ?? "").toUpperCase();
  if (s.includes("WIN")) return "rdp";
  if (s.includes("MAC")) return "vnc";
  return "ssh";
}
/**
 * 生效远控端口：主机配置优先，SSH 沿用端口字段，其余按协议默认
 * @param h 主机
 */
function remotePortOf(h: Host): number | null {
  const p = protocolOf(h);
  if (h.serverHostRemotePort && h.serverHostRemotePort > 0) return h.serverHostRemotePort;
  // SSH 交由后端按 ms_server_host_port 处理，避免前端重复推断
  return p === "ssh" ? null : (p === "rdp" ? 3389 : 5900);
}

const railWidth = computed(() => (railOpen.value ? `${layout.railWidth}px` : `${layout.railCollapsed}px`));

/** 当前选中资产 */
const selectedHost = computed(() => hosts.value.find(h => h.id === selectedId.value) ?? null);

/** 手动断开标记：切换主机或点关闭时复位 */
const disconnected = ref(false);

/** 传给远控渲染组件的连接对象 */
const connection = computed(() => {
  const h = selectedHost.value;
  if (!h || disconnected.value) return null;
  const qIdentity = route.query.identityId ? Number(route.query.identityId) : null;
  const mode = (h.serverHostRemoteMode ?? "").toUpperCase();
  return {
    hostId: h.id,
    hostName: `${h.serverHostName} (${h.serverHostAddress})`,
    address: h.serverHostAddress,
    protocol: protocolOf(h),
    identityId: Number.isFinite(qIdentity as number) ? (qIdentity as number) : null,
    targetPort: remotePortOf(h),
    mode: mode === "DIRECT" || mode === "NONE" ? mode : "GUACD",
  };
});

/** 选中主机：复位断开标记 */
function selectHost(h: Host): void {
  selectedId.value = h.id;
  disconnected.value = false;
  const q: Record<string, string> = { hostId: String(h.id), protocol: protocolOf(h) };
  const qId = route.query.identityId;
  if (qId) q.identityId = String(qId);
  router.replace({ path: "/terminal", query: q });
}

const filteredHosts = computed(() => {
  let list = hosts.value;
  if (keyword.value) {
    const k = keyword.value.toLowerCase();
    list = list.filter(
      h => h.serverHostName.toLowerCase().includes(k) || h.serverHostAddress.toLowerCase().includes(k),
    );
  }
  return [...list].sort((a, b) => (b.serverHostOnline ?? 0) - (a.serverHostOnline ?? 0));
});

/** 标签分割 */
function splitTags(tags?: string | null): string[] {
  if (!tags || !tags.trim()) return [];
  return tags.split(",").map(t => t.trim()).filter(Boolean);
}

/** 按标签分组：有标签的按首个标签归组，无标签进「默认」 */
const tagGroups = computed(() => {
  const map = new Map<string, Host[]>();
  const def: Host[] = [];
  for (const h of filteredHosts.value) {
    const tags = splitTags((h as any).serverHostTags);
    if (tags.length) {
      const key = tags[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(h);
    } else {
      def.push(h);
    }
  }
  const groups: { label: string; list: Host[] }[] = [];
  for (const [label, list] of map) groups.push({ label, list });
  if (def.length) groups.push({ label: "默认", list: def });
  return groups;
});

/** 终端字体大小（默认 / 小 / 中 / 大） */
const fontScale = ref<number>(13);
/**
 * 终端字体样式
 */
function fontStyle(): Record<string, string> {
  return { "--term-font-size": `${fontScale.value}px` };
}
/**
 * 字号标签
 * @param n 字号
 */
function fontLabel(n: number): string {
  return n + "px";
}

async function loadHosts(): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    hosts.value = (await queryHosts()) ?? [];
  } catch (e) {
    error.value = String((e as Error)?.message ?? e);
  } finally {
    loading.value = false;
  }
}

/** 同步路由 query.hostId → 选中 */
function syncFromQuery(qid: string | string[] | undefined): void {
  const base = qid instanceof Array ? qid[0] : qid;
  if (!base) return;
  const id = Number(base);
  if (!Number.isFinite(id)) return;
  selectedId.value = id;
  disconnected.value = false;
}

/** 从资产页直达时：先按 query 选中，若无该 host 再从后端补拉 */
async function selectFromQuery(): Promise<void> {
  const qid = route.query.hostId;
  if (!qid) return;
  const base = qid instanceof Array ? qid[0] : qid;
  const id = Number(base);
  if (!Number.isFinite(id)) return;
  if (hosts.value.some(h => h.id === id)) {
    selectedId.value = id;
    return;
  }
  try {
    const h = await getHost(id);
    if (h) {
      const mapped: Host = {
        id: h.id,
        serverHostName: h.serverHostName,
        serverHostAddress: h.serverHostAddress,
        serverHostPort: h.serverHostPort,
        serverHostOsType: h.serverHostOsType,
        serverHostOnline: h.serverHostOnline,
        serverHostRemoteEnabled: h.serverHostRemoteEnabled,
        serverHostRemoteProtocol: h.serverHostRemoteProtocol,
        serverHostRemotePort: h.serverHostRemotePort,
        serverHostRemoteMode: h.serverHostRemoteMode,
      };
      hosts.value = [mapped, ...hosts.value];
      selectedId.value = id;
    }
  } catch {
    /* 静默：拿不到就保持空选 */
  }
}

/** 左列表点选：就地断言 + 更新 URL（同路由不重建整页，保留 identityId） */
watch(() => route.query.hostId, (val) => { if (val != null) syncFromQuery(val as string | string[]); });

async function onMountedInit(): Promise<void> {
  await loadHosts();
  await selectFromQuery();
}
onMounted(onMountedInit);
</script>

<template>
  <div class="tw tel-page">
    <!-- 左侧主机资源条 -->
    <aside :style="{ width: railWidth }" class="rail tel-rail">
      <div v-if="railOpen" class="rail-inner">
        <div class="rail-head">
          <span class="rail-title">主机资源</span>
          <span class="rail-count">{{ hosts.length }}</span>
          <span class="rail-collapse-btn" @click="railOpen = false" title="折叠资源条">«</span>
        </div>
        <ReInput v-model="keyword" placeholder="搜索主机 / IP" clearable size="small" class="rail-search" />
        <div v-if="loading" class="tip">加载中…</div>
        <div v-else-if="error" class="tip err">{{ error }}</div>
        <ReScrollbar v-else class="rail-list">
          <template v-for="g in tagGroups" :key="g.label">
            <div class="g-title">
              {{ g.label === "默认" ? "∅ 默认" : "#" + g.label }}
              <span class="g-count">{{ g.list.length }}</span>
            </div>
            <div v-for="h in g.list" :key="h.id" class="rail-group">
              <div
                :class="['rail-item', { active: selectedId === h.id }]"
                @click="selectHost(h)"
              >
                <span class="ri-os"><span v-html="osIconSvg(h.serverHostOsType)"></span></span>
                <span class="ri-name">{{ h.serverHostName }}</span>
                <span :class="['pdot', h.serverHostOnline === 1 ? 'pdot-online' : 'pdot-offline']" />
                <span :class="['ri-proto', `proto-${protocolOf(h)}`]">{{ protocolOf(h).toUpperCase() }}</span>
              </div>
              <div class="g-meta" v-if="false">{{ h.serverHostAddress }}:{{ h.serverHostPort }}</div>
            </div>
          </template>
          <div v-if="tagGroups.length === 0" class="tip">暂无主机</div>
        </ReScrollbar>
        <div class="rail-foot">
          <span class="foot-hint" v-if="!selectedHost">从左侧选择一台主机开始控制</span>
          <span class="foot-hint" v-else>已选择 {{ selectedHost.serverHostName }}</span>
        </div>
      </div>
      <div v-else class="rail-collapsed" @click="railOpen = true" title="展开资源条">☰</div>
    </aside>

    <!-- 右侧控制台：SSH 直连走自研终端（xterm + /ws/.../terminal/ssh），其余经 guacd 隧道 -->
    <main class="term-main">
      <ScSshDirectViewer v-if="connection && connection.protocol === 'ssh' && connection.mode !== 'GUACD'" :connection="connection" @close="disconnected = true" />
      <div v-else-if="connection && connection.mode === 'NONE'" class="remote-empty">
        「{{ connection.hostName }}」的远控通道为「无需通道」，平台不做中转：VNC 请用本机客户端连接
        <b class="mono">{{ connection.address }}:{{ connection.targetPort ?? 5900 }}</b>
        ；需要网页远控请把该主机的远控通道改为「Guacd 中转」。
      </div>
      <ScGuacViewer v-else :connection="connection" inline @close="disconnected = true" />
      <div v-if="!connection" class="remote-empty">从左侧选择一台主机开始控制</div>
    </main>
  </div>
</template>

<style scoped lang="scss">
.tw {
  display: flex;
  width: 100%;
  height: calc(100vh - 56px); /* 顶栏 56px */
  min-height: 0;
}
.rail {
  flex-shrink: 0;
  height: 100%;
  background: var(--bg-container);
  border-right: 1px solid var(--border-subtle);
  transition: width 0.2s ease;
  overflow: hidden;
}
.rail-inner {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.rail-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 16px 8px;
}
.rail-title {
  font-size: 15px;
  font-weight: 600;
}
.rail-count {
  padding: 0 7px;
  font-size: 11px;
  line-height: 18px;
  color: var(--text-tertiary);
  background: var(--border-subtle);
  border-radius: 9px;
}
.rail-search {
  padding: 0 12px 8px;
}
.rail-list {
  flex: 1;
  min-height: 0;
  padding: 0 12px 8px;
}
.tip {
  padding: 20px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
  &.err { color: var(--pulse-alarm); }
}
.rail-group {
  margin-bottom: 6px;
}
.g-title {
  padding: 8px 6px 4px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.g-meta {
  padding: 0 6px 6px 28px;
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: monospace;
}
.rail-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  &:hover {
    background: var(--brand-50);
  }
  &.active {
    background: var(--brand-100);
    border-color: var(--brand-100);
  }
}
.ri-os {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  font-size: 16px;
  color: var(--brand-500);
}
.ri-os :deep(svg) { display: block; }
.ri-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ri-proto {
  padding: 1px 5px;
  font-size: 9px;
  font-weight: 700;
  font-family: monospace;
  border-radius: 3px;
  &.proto-ssh { color: var(--proto-ssh); background: color-mix(in srgb, var(--proto-ssh) 10%, transparent); }
  &.proto-rdp { color: var(--proto-rdp); background: color-mix(in srgb, var(--proto-rdp) 10%, transparent); }
  &.proto-vnc { color: var(--proto-vnc); background: color-mix(in srgb, var(--proto-vnc) 10%, transparent); }
}
.rail-foot {
  padding: 10px 16px;
  border-top: 1px solid var(--border-subtle);
}
.foot-hint {
  font-size: 12px;
  color: var(--text-tertiary);
}
.rail-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 18px;
  color: var(--text-tertiary);
  cursor: pointer;
}
.term-main {
  flex: 1;
  min-width: 0;
  min-height: 0;
}
.remote-frame {
  width: 100%;
  height: 100%;
  display: block;
  border: none;
  background: #000;
}
.remote-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary, #909399);
  font-size: 14px;
}
</style>