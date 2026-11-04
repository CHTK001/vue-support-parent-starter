<script setup lang="ts">
/**
 * 监听端口分区 —— 按协议分组的端口块。
 *
 * <p>设计意图：端口页要回答的是「这台机器对外开了哪些口」。表格里 0.0.0.0 和 127.0.0.1
 * 长得一样，得逐行读地址才知道暴露面。这里把端口号放大、把「对外 / 仅本机」做成标签，
 * 再按协议分组，暴露面直接可数。</p>
 *
 * <p>字段来自 {@code NetProcessRowVO}：protocol / local / port / remote / remotePort / state /
 * pid / process。列表视图逐列可排序，默认仍按「协议 → 端口」升序，保证首屏顺序与旧版一致。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref } from "vue";
import { leadTileOf, numOf, portOpen, stateTone } from "../../utils/hostProfileUi";
import ProfileSectionShell from "./ProfileSectionShell.vue";
import ProfileSortHead from "./ProfileSortHead.vue";
import type { StripItem } from "./types";

interface Props {
  rows: Record<string, any>[];
  keyword?: string;
  loading?: boolean;
  error?: string;
  paged?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  truncated?: boolean;
  busyKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  keyword: "",
  loading: false,
  error: "",
  paged: true,
  page: 1,
  pageSize: 10,
  total: 0,
  truncated: false,
  busyKey: "",
});

const emit = defineEmits<{
  (e: "search", keyword: string): void;
  (e: "commit", keyword: string): void;
  (e: "page", delta: number): void;
  (e: "refresh"): void;
  (e: "close", row: Record<string, any>): void;
}>();

/** 端口视图行 */
interface PortView {
  raw: Record<string, any>;
  /** 协议（大写），来自 protocol / type */
  proto: string;
  port: number;
  /** 本地 IP（不带端口） */
  localAddr: string;
  /** 已建立的远端 IP（不带端口） */
  remoteAddr: string;
  remotePort: number;
  /** 远端展示文本；未建立连接时为空串，由模板统一渲染「—」 */
  remoteText: string;
  open: boolean | null;
  tone: string;
  /** 是否监听在所有网卡上（对外暴露） */
  exposed: boolean;
  /** 占用进程名 */
  process: string;
  pid: number;
  /** 进程前置图标：品牌 Logo / 品牌色块 + 线性图形 / 首字母 */
  tile: ReturnType<typeof leadTileOf>;
}

/** 通配地址：监听态的本端/对端在这些取值上都代表「任意地址」 */
const WILDCARD = new Set(["", "*", "0.0.0.0", "::", "[::]", "0:0:0:0:0:0:0:0"]);

/**
 * 是否对外暴露：0.0.0.0 / :: / * / [::] 视为全部网卡；
 * 127.x、::1、localhost 视为仅本机。
 */
function isExposed(local: unknown): boolean {
  const s = String(local ?? "").trim();
  if (!s) return false;
  if (s === "*" || s === "0.0.0.0" || s === "::" || s === "[::]") return true;
  if (s.startsWith("127.") || s === "::1" || s === "[::1]" || s.startsWith("localhost")) return false;
  return true;
}

/** 本端地址：优先取 localAddr，老数据只给 local（addr:port）时按最后一个冒号切 */
function localAddrOf(raw: Record<string, any>): string {
  const addr = String(raw.localAddr ?? "").trim();
  if (addr) return addr;
  const text = String(raw.local ?? "").trim();
  if (!text) return "";
  const i = text.lastIndexOf(":");
  return i > -1 ? text.slice(0, i) : text;
}

/** 远端地址 / 端口：未连接时后端给 0.0.0.0:0 或空串 */
function remoteOf(raw: Record<string, any>): { addr: string; port: number; text: string } {
  const addr = String(raw.remoteAddr ?? "").trim();
  const port = numOf(raw.remotePort);
  if (port > 0 || !WILDCARD.has(addr)) return { addr, port, text: `${addr || "*"}:${port}` };
  // 只有 remote 展示文本、没有拆分字段时，从 addr:port 里还原
  const text = String(raw.remote ?? "").trim();
  if (text) {
    const i = text.lastIndexOf(":");
    const p = i > -1 ? numOf(text.slice(i + 1)) : 0;
    const a = i > -1 ? text.slice(0, i) : text;
    if (p > 0 || !WILDCARD.has(a)) return { addr: a, port: p, text };
  }
  return { addr: "", port: 0, text: "" };
}

const view = computed<PortView[]>(() => props.rows.map(raw => {
  const remote = remoteOf(raw);
  const proto = String(raw.protocol ?? raw.type ?? "OTHER").trim().toUpperCase() || "OTHER";
  const localAddr = localAddrOf(raw);
  return {
    raw,
    proto,
    port: numOf(raw.port ?? raw.localPort),
    localAddr,
    remoteAddr: remote.addr,
    remotePort: remote.port,
    remoteText: remote.text,
    open: portOpen(raw.state),
    tone: stateTone(raw.state),
    exposed: isExposed(localAddr),
    process: String(raw.process ?? "").trim(),
    pid: numOf(raw.pid),
    // 端口行只有 process 字段，图标要按进程名取，不能直接把整行交给 leadTileOf（它读 name）
    tile: leadTileOf("processes", { name: String(raw.process ?? raw.name ?? "").trim() }),
  };
}));

/** 协议的固定顺序：TCP 在前、UDP 在后，未知协议沉底 */
const PROTO_ORDER = ["TCP", "TCP4", "TCP6", "UDP", "UDP4", "UDP6"];

/** 协议名 → 排序权重 */
function protoRank(proto: string): number {
  const i = PROTO_ORDER.indexOf(proto);
  return i === -1 ? 99 : i;
}

/** 按协议分组：TCP 在前，其余按出现顺序 */
const groups = computed<Array<{ name: string; list: PortView[] }>>(() => {
  const map = new Map<string, PortView[]>();
  for (const p of view.value) {
    if (!map.has(p.proto)) map.set(p.proto, []);
    map.get(p.proto)!.push(p);
  }
  return [...map.entries()]
    .sort((a, b) => {
      const ai = protoRank(a[0]);
      const bi = protoRank(b[0]);
      if (ai !== 99 || bi !== 99) return ai - bi;
      return a[0].localeCompare(b[0]);
    })
    .map(([name, list]) => ({
      name,
      // 端口号升序，扫读时 22 / 80 / 443 自然排在一起
      list: [...list].sort((x, y) => x.port - y.port),
    }));
});

/** 聚合条：监听总数、TCP、UDP、对外暴露 */
const strip = computed<StripItem[]>(() => {
  const rows = view.value;
  const total = props.paged ? props.total : rows.length;
  const tcp = rows.filter(p => p.proto.startsWith("TCP")).length;
  const udp = rows.filter(p => p.proto.startsWith("UDP")).length;
  const exposed = rows.filter(p => p.exposed).length;
  return [
    { label: "监听总数", value: `${total} 个` },
    { label: "本页 TCP", value: `${tcp} 个` },
    { label: "本页 UDP", value: `${udp} 个` },
    {
      label: "本页对外暴露",
      value: `${exposed} 个`,
      sub: "监听在全部网卡",
      tone: exposed > 0 ? "warn" : "",
    },
  ];
});

/** 视图模式：卡片 / 列表 */
const viewMode = ref<"card" | "list">("list");

/* ==================== 列表视图排序 ==================== */

/** 可排序列；操作列没有可比较的值，不参与排序 */
type SortKey = "protocol" | "port" | "local" | "remote" | "remotePort" | "state" | "process" | "pid" | "scope";

const sortKey = ref<SortKey | "">("");
const sortDir = ref<"asc" | "desc">("asc");

/** 点同一列切换升 / 降序，点另一列从升序重新开始 */
function toggleSort(key: SortKey): void {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDir.value = "asc";
}

/** IPv4 按四段数值比较，IPv6 / 主机名退化为字典序 */
function ipParts(addr: string): number[] | null {
  const s = addr.replace(/^\[|\]$/g, "");
  if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(s)) return null;
  return s.split(".").map(Number);
}

function cmpAddr(a: string, b: string): number {
  const pa = ipParts(a);
  const pb = ipParts(b);
  if (pa && pb) {
    for (let i = 0; i < 4; i++) {
      if (pa[i] !== pb[i]) return pa[i] - pb[i];
    }
    return 0;
  }
  return a.localeCompare(b);
}

/** 空值判定：无论升序还是降序，没有值的行都沉底 */
function isBlank(key: SortKey, p: PortView): boolean {
  if (key === "remote" || key === "remotePort") return p.remoteText === "";
  if (key === "process") return p.process === "";
  if (key === "pid") return p.pid <= 0;
  return false;
}

function compareBy(key: SortKey, a: PortView, b: PortView): number {
  switch (key) {
    case "protocol":
      return protoRank(a.proto) - protoRank(b.proto) || a.proto.localeCompare(b.proto);
    case "port":
      return a.port - b.port;
    case "local":
      return cmpAddr(a.localAddr, b.localAddr) || a.port - b.port;
    case "remote":
      return cmpAddr(a.remoteAddr, b.remoteAddr) || a.remotePort - b.remotePort;
    case "remotePort":
      return a.remotePort - b.remotePort;
    case "state": {
      // 监听态在前：一眼先看到「开着什么」，再是已建立的连接
      const oa = a.open === null ? 2 : a.open ? 0 : 1;
      const ob = b.open === null ? 2 : b.open ? 0 : 1;
      return oa - ob || String(a.raw.state ?? "").localeCompare(String(b.raw.state ?? ""));
    }
    case "process":
      return a.process.localeCompare(b.process);
    case "pid":
      return a.pid - b.pid;
    case "scope":
      return Number(b.exposed) - Number(a.exposed) || a.port - b.port;
    default:
      return 0;
  }
}

/** 列表视图：未点列头时保持「协议 → 端口」升序，点了之后按选中列排 */
const listView = computed<PortView[]>(() => {
  const items = [...view.value];
  const key = sortKey.value;
  if (!key) {
    items.sort((a, b) => protoRank(a.proto) - protoRank(b.proto) || a.port - b.port);
    return items;
  }
  const dir = sortDir.value === "asc" ? 1 : -1;
  items.sort((a, b) => {
    const ba = isBlank(key, a);
    const bb = isBlank(key, b);
    if (ba !== bb) return ba ? 1 : -1;
    return compareBy(key, a, b) * dir;
  });
  return items;
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="端口 / 地址 / 状态 / 进程名"
    :loading="loading"
    :error="error"
    :has-rows="view.length > 0"
    empty-text="该主机未上报监听端口"
    unit="个监听端口"
    :paged="paged"
    :page="page"
    :page-size="pageSize"
    :total="total"
    :truncated="truncated"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @page="(d: number) => emit('page', d)"
    @refresh="emit('refresh')"
  >
    <template #tools>
      <div class="port-view-toggle">
        <ReButton
          class="port-view-btn"
          layout="square"
          size="small"
          icon="Grid"
          tip="卡片视图"
          :class="{ on: viewMode === 'card' }"
          @click="viewMode = 'card'"
        >
        </ReButton>
        <ReButton
          class="port-view-btn"
          layout="square"
          size="small"
          icon="Menu"
          tip="列表视图"
          :class="{ on: viewMode === 'list' }"
          @click="viewMode = 'list'"
        >
        </ReButton>
      </div>
    </template>

    <div v-if="viewMode === 'card'" class="port-groups">
      <section v-for="g in groups" :key="g.name" class="port-group">
        <header class="port-group-head">
          <span :class="['pf-pill', g.name.startsWith('TCP') ? 't-brand' : 't-warn']">{{ g.name }}</span>
          <span class="pf-dim port-group-count">{{ g.list.length }} 个</span>
        </header>

        <div class="port-chips">
          <div
            v-for="p in g.list"
            :key="`${p.proto}-${p.localAddr}-${p.port}-${p.remoteText}`"
            :class="['port-chip', p.open === false ? 'is-closed' : '']"
          >
            <div class="port-chip-top">
              <b class="port-no pf-mono">{{ p.port }}</b>
              <span v-if="p.open !== null" :class="['pf-pill', p.open ? 't-ok' : 't-bad']">
                {{ p.open ? "监听" : "关闭" }}
              </span>
              <span v-else class="pf-pill t-mute">未知</span>
            </div>
            <div class="port-proc" :title="p.process || '无归属进程'">
              <span v-if="p.tile.brand" class="port-tile port-tile--brand" v-html="p.tile.brand"></span>
              <span v-else class="port-tile" :style="{ background: p.tile.bg }">
                <span v-if="p.tile.glyph" class="port-glyph" v-html="p.tile.glyph"></span>
                <template v-else>{{ p.tile.letter }}</template>
              </span>
              <span class="pf-mono pf-ellipsis">{{ p.process || "—" }}</span>
            </div>
            <div class="port-addr pf-mono pf-dim pf-ellipsis">{{ p.raw.local || p.localAddr || "—" }}</div>
            <div
              v-if="p.remoteText"
              class="port-peer pf-mono pf-dim pf-ellipsis"
              :title="`远端 ${p.remoteText}`"
            >→ {{ p.remoteText }}</div>
            <div class="port-foot">
              <span :class="['pf-pill', p.exposed ? 't-warn' : 't-mute']">
                {{ p.exposed ? "对外" : "仅本机" }}
              </span>
              <span class="port-pid pf-mono pf-dim">PID {{ p.raw.pid ?? "—" }}</span>
              <ReButton
                layout="square"
                type="danger"
                icon="Delete"
                tip="结束"
                :title="numOf(p.raw.pid) > 0 ? '' : '该端口无归属进程，无法结束'"
                :disabled="numOf(p.raw.pid) <= 0 || busyKey === `netproc-${p.raw.pid}-${p.port}`"
                @click="emit('close', p.raw)"
              />
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 列表视图：表格行，所有数据列均可点击排序 -->
    <div v-else class="port-list">
      <div class="port-list-scroll">
        <div class="port-list-head">
          <ProfileSortHead label="进程" :active="sortKey === 'process'" :dir="sortDir" @sort="toggleSort('process')" />
          <ProfileSortHead label="协议" :active="sortKey === 'protocol'" :dir="sortDir" @sort="toggleSort('protocol')" />
          <ProfileSortHead label="端口" :active="sortKey === 'port'" :dir="sortDir" align="right" @sort="toggleSort('port')" />
          <ProfileSortHead label="地址" :active="sortKey === 'local'" :dir="sortDir" @sort="toggleSort('local')" />
          <ProfileSortHead label="远程地址" :active="sortKey === 'remote'" :dir="sortDir" @sort="toggleSort('remote')" />
          <ProfileSortHead label="远程端口" :active="sortKey === 'remotePort'" :dir="sortDir" align="right" @sort="toggleSort('remotePort')" />
          <ProfileSortHead label="状态" :active="sortKey === 'state'" :dir="sortDir" @sort="toggleSort('state')" />
          <ProfileSortHead label="PID" :active="sortKey === 'pid'" :dir="sortDir" align="right" @sort="toggleSort('pid')" />
          <ProfileSortHead label="范围" :active="sortKey === 'scope'" :dir="sortDir" @sort="toggleSort('scope')" />
          <span class="plh-action"></span>
        </div>
        <div
          v-for="p in listView"
          :key="`${p.proto}-${p.localAddr}-${p.port}-${p.remoteText}`"
          :class="['port-list-row', p.open === false ? 'is-closed' : '']"
        >
          <span class="plh-proc" :title="p.process || '无归属进程'">
            <span v-if="p.tile.brand" class="port-tile port-tile--brand" v-html="p.tile.brand"></span>
            <span v-else class="port-tile" :style="{ background: p.tile.bg }">
              <span v-if="p.tile.glyph" class="port-glyph" v-html="p.tile.glyph"></span>
              <template v-else>{{ p.tile.letter }}</template>
            </span>
            <span class="pf-mono pf-ellipsis">{{ p.process || "—" }}</span>
          </span>
          <span class="plh-proto"><span :class="['pf-pill', p.proto.startsWith('TCP') ? 't-brand' : 't-warn']">{{ p.proto }}</span></span>
          <b class="plh-port pf-mono">{{ p.port }}</b>
          <span class="plh-addr pf-mono pf-dim pf-ellipsis" :title="p.raw.local || p.localAddr">{{ p.raw.local || p.localAddr || "—" }}</span>
          <span v-if="p.remoteText" class="plh-remote pf-mono pf-ellipsis" :title="p.remoteText">{{ p.remoteAddr || p.remoteText }}</span>
          <span v-else class="plh-remote pf-dim">—</span>
          <span class="plh-rport pf-mono pf-dim">{{ p.remoteText ? p.remotePort : "—" }}</span>
          <span v-if="p.open !== null" :class="['pf-pill', p.open ? 't-ok' : 't-bad']">{{ p.open ? "监听" : "关闭" }}</span>
          <span v-else class="pf-pill t-mute">未知</span>
          <span class="plh-pid pf-mono pf-dim">{{ p.pid > 0 ? p.pid : "—" }}</span>
          <span :class="['pf-pill', p.exposed ? 't-warn' : 't-mute']">{{ p.exposed ? "对外" : "仅本机" }}</span>
          <ReButton
            layout="square"
            type="danger"
            icon="Delete"
            tip="结束"
            :title="p.pid > 0 ? '' : '该端口无归属进程，无法结束'"
            :disabled="p.pid <= 0 || busyKey === `netproc-${p.pid}-${p.port}`"
            @click="emit('close', p.raw)"
          />
        </div>
      </div>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.port-groups {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.port-group-head {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 7px;
}
.port-group-count {
  font-size: 11.5px;
}
.port-chips {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(164px, 1fr));
  gap: 7px;
}
.port-chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 8px;
  background: var(--el-bg-color, #fff);
  transition: border-color 0.16s, background 0.16s;
}
.port-chip:hover {
  border-color: var(--el-color-primary-light-7, #ece9ff);
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.port-chip.is-closed {
  opacity: 0.62;
}
.port-chip-top {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 1px;
}
.port-no {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.3px;
  color: var(--el-text-color-primary, #1f2430);
}
.port-proc {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11.5px;
  color: var(--el-text-color-regular, #4a5162);
}
/* 进程前置图标：与进程分区同一口径（品牌 Logo / 品牌色块 + 线性图形 / 首字母） */
.port-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  flex: none;
  border-radius: 5px;
  color: #fff;
  font-size: 9px;
  font-weight: 700;
}
.port-tile--brand {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.port-tile :deep(svg) {
  display: block;
  width: 13px;
  height: 13px;
}
.port-glyph {
  display: inline-flex;
  line-height: 0;
}
.port-addr {
  font-size: 11px;
}
.port-peer {
  font-size: 10.5px;
}
.port-foot {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 5px;
  padding-top: 5px;
  border-top: 1px dashed var(--el-border-color-extra-light, #eef0f6);
}
.port-pid {
  flex: 1;
  min-width: 0;
  font-size: 10.5px;
}

/* 视图切换按钮：ReButton 把 class 转发到内层 <button>，父组件的 scoped 属性
   只落在它外层 tooltip 包裹上，普通后代选择器永远命中不到真正的按钮
   （两个按钮看起来一样「激活」就是这么来的）。这里必须用 :deep()。 */
.port-view-toggle {
  display: inline-flex;
  gap: 2px;
  padding: 2px;
  border-radius: 7px;
  background: var(--el-fill-color-light, #f5f7fa);

  :deep(.rs-btn.port-view-btn) {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    margin: 0;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 5px;
    background: transparent;
    color: var(--el-text-color-secondary, #5c6270);
    box-shadow: none;
    cursor: pointer;
    transition: background 0.16s, color 0.16s, border-color 0.16s, box-shadow 0.16s;
  }

  /* 未选中：hover 只给一层浅底，不出现「白底 + 投影」，避免和真正选中的那个混淆 */
  :deep(.rs-btn.port-view-btn:hover:not(.on):not(.is-disabled):not(:disabled)) {
    background: var(--el-bg-color, #fff);
    color: var(--el-text-color-regular, #4a5162);
    border-color: var(--el-border-color-lighter, #e3e6ef);
  }

  /* 选中：唯一带白底 + 投影 + 主色的按钮，肉眼只会有这一个「亮着」 */
  :deep(.rs-btn.port-view-btn.on) {
    background: var(--el-bg-color, #fff);
    color: var(--el-color-primary, #5a4bd9);
    border-color: var(--el-border-color-lighter, #e3e6ef);
    box-shadow: 0 1px 2px rgba(31, 36, 48, 0.12);
  }

  /* 选中态 hover 保持不变色，只保留轻微的投影加深 */
  :deep(.rs-btn.port-view-btn.on:hover:not(.is-disabled):not(:disabled)) {
    background: var(--el-bg-color, #fff);
    color: var(--el-color-primary, #5a4bd9);
    border-color: var(--el-border-color-lighter, #e3e6ef);
    box-shadow: 0 1px 3px rgba(31, 36, 48, 0.16);
  }
}

/* 列表视图 */
.port-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
/* 窄屏横向滚动，不压扁列内容；表头与行共用同一套列宽 */
.port-list-scroll {
  overflow-x: auto;
}
.port-list-head {
  display: grid;
  grid-template-columns: minmax(126px, 1.05fr) 58px 56px minmax(92px, 1fr) minmax(104px, 1fr) 64px 56px 54px 52px 36px;
  gap: 8px;
  align-items: center;
  min-width: 760px;
  padding: 5px 10px;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: var(--el-fill-color-light, #f5f7fa);
  border-radius: 6px;
}
.port-list-row {
  display: grid;
  grid-template-columns: minmax(126px, 1.05fr) 58px 56px minmax(92px, 1fr) minmax(104px, 1fr) 64px 56px 54px 52px 36px;
  gap: 8px;
  align-items: center;
  min-width: 760px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 12px;
  transition: background 0.14s;
}
.port-list-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.port-list-row.is-closed {
  opacity: 0.62;
}
.plh-proto {
  display: flex;
}
.plh-port {
  font-size: 13px;
  font-weight: 600;
  text-align: right;
  color: var(--el-text-color-primary, #1f2430);
}
.plh-addr {
  min-width: 0;
  font-size: 11px;
}
.plh-remote {
  min-width: 0;
  font-size: 11px;
  color: var(--el-text-color-regular, #4a5162);
}
.plh-rport {
  font-size: 11px;
  text-align: right;
}
.plh-proc {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 11.5px;
  color: var(--el-text-color-regular, #4a5162);
}
.plh-pid {
  font-size: 11px;
  text-align: right;
}
.plh-action {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 720px) {
  .port-list-head,
  .port-list-row {
    grid-template-columns: minmax(0, 1fr) 44px 46px 50px 52px 34px;
    min-width: 0;
    gap: 6px;
  }
  .plh-addr,
  .plh-remote,
  .plh-rport,
  .plh-pid {
    display: none;
  }
}
</style>
