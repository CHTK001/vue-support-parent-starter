<script setup lang="ts">
/**
 * 监听端口分区 —— 按协议分组的端口块。
 *
 * <p>设计意图：端口页要回答的是「这台机器对外开了哪些口」。表格里 0.0.0.0 和 127.0.0.1
 * 长得一样，得逐行读地址才知道暴露面。这里把端口号放大、把「对外 / 仅本机」做成标签，
 * 再按协议分组，暴露面直接可数。</p>
 *
 * <p>字段来自 {@code NetProcessRowVO}：protocol / local / port / state / pid / process。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import { numOf, portOpen, stateTone } from "../../utils/hostProfileUi";
import ProfileSectionShell from "./ProfileSectionShell.vue";
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
  port: number;
  open: boolean | null;
  tone: string;
  /** 是否监听在所有网卡上（对外暴露） */
  exposed: boolean;
}

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

const view = computed<PortView[]>(() => props.rows.map(raw => ({
  raw,
  port: numOf(raw.port),
  open: portOpen(raw.state),
  tone: stateTone(raw.state),
  exposed: isExposed(raw.local),
})));

/** 按协议分组：TCP 在前，其余按出现顺序 */
const groups = computed<Array<{ name: string; list: PortView[] }>>(() => {
  const map = new Map<string, PortView[]>();
  for (const p of view.value) {
    const key = String(p.raw.protocol ?? "OTHER").trim().toUpperCase() || "OTHER";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(p);
  }
  const order = ["TCP", "TCP6", "UDP", "UDP6"];
  return [...map.entries()]
    .sort((a, b) => {
      const ai = order.indexOf(a[0]);
      const bi = order.indexOf(b[0]);
      if (ai !== -1 || bi !== -1) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
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
  const rows = props.rows;
  const total = props.paged ? props.total : rows.length;
  const tcp = rows.filter(r => String(r.protocol ?? "").toUpperCase().startsWith("TCP")).length;
  const udp = rows.filter(r => String(r.protocol ?? "").toUpperCase().startsWith("UDP")).length;
  const exposed = rows.filter(r => isExposed(r.local)).length;
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
    <div class="port-groups">
      <section v-for="g in groups" :key="g.name" class="port-group">
        <header class="port-group-head">
          <span :class="['pf-pill', g.name.startsWith('TCP') ? 't-brand' : 't-warn']">{{ g.name }}</span>
          <span class="pf-dim port-group-count">{{ g.list.length }} 个</span>
        </header>

        <div class="port-chips">
          <div
            v-for="p in g.list"
            :key="`${p.raw.protocol}-${p.raw.local}-${p.port}`"
            :class="['port-chip', p.open === false ? 'is-closed' : '']"
          >
            <div class="port-chip-top">
              <b class="port-no pf-mono">{{ p.port }}</b>
              <span v-if="p.open !== null" :class="['pf-pill', p.open ? 't-ok' : 't-bad']">
                {{ p.open ? "监听" : "关闭" }}
              </span>
              <span v-else class="pf-pill t-mute">未知</span>
            </div>
            <div class="port-proc pf-mono pf-ellipsis" :title="String(p.raw.process ?? '')">
              {{ p.raw.process || "—" }}
            </div>
            <div class="port-addr pf-mono pf-dim pf-ellipsis">{{ p.raw.local || "—" }}</div>
            <div class="port-foot">
              <span :class="['pf-pill', p.exposed ? 't-warn' : 't-mute']">
                {{ p.exposed ? "对外" : "仅本机" }}
              </span>
              <span class="port-pid pf-mono pf-dim">PID {{ p.raw.pid ?? "—" }}</span>
              <button
                class="pf-btn is-bad port-kill"
                :disabled="numOf(p.raw.pid) <= 0 || busyKey === `netproc-${p.raw.pid}-${p.port}`"
                :title="numOf(p.raw.pid) > 0 ? '' : '该端口无归属进程，无法结束'"
                @click="emit('close', p.raw)"
              >{{ busyKey === `netproc-${p.raw.pid}-${p.port}` ? "…" : "结束" }}</button>
            </div>
          </div>
        </div>
      </section>
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
  font-size: 11.5px;
  color: var(--el-text-color-regular, #4a5162);
}
.port-addr {
  font-size: 11px;
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
.port-kill {
  flex: none;
}
</style>
