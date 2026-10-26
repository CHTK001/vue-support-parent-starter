<script setup lang="ts">
/**
 * 防火墙分区 —— 方向优先的规则行。
 *
 * <p>设计意图：防火墙规则的判读顺序是「方向 → 动作 → 协议/端口」。表格把方向压成一列文字，
 * 需要横着读才拼得出语义。这里把方向做成带箭头的前置块，动作做成胶囊，协议与端口紧跟其后，
 * 一眼看出「哪些入站是放行的」。</p>
 *
 * <p>字段来自 {@code FirewallRuleRowVO}：name / direction / action / protocol / localPort / profile / chain。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import { stateTone } from "../../utils/hostProfileUi";
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
});

const emit = defineEmits<{
  (e: "search", keyword: string): void;
  (e: "commit", keyword: string): void;
  (e: "page", delta: number): void;
  (e: "refresh"): void;
}>();

/** 方向归一：inbound / outbound，兼容中文与 Windows 的 In/Out */
function isInbound(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s.includes("in") || s.includes("入");
}

/** 动作归一：allow / deny */
function isAllow(v: unknown): boolean {
  const s = String(v ?? "").trim().toLowerCase();
  return s.includes("allow") || s.includes("permit") || s.includes("accept") || s.includes("放行");
}

const view = computed(() => props.rows.map(r => ({
  raw: r,
  inbound: isInbound(r.direction),
  allow: isAllow(r.action),
  tone: stateTone(r.action),
})));

/** 聚合条：规则数、放行、拒绝、入站 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  const total = props.paged ? props.total : rows.length;
  const allow = rows.filter(r => isAllow(r.action)).length;
  const deny = rows.length - allow;
  const inbound = rows.filter(r => isInbound(r.direction)).length;
  return [
    { label: "规则", value: `${total} 条` },
    { label: "本页放行", value: `${allow} 条`, tone: "ok" },
    { label: "本页拒绝", value: `${deny} 条`, tone: deny > 0 ? "bad" : "" },
    { label: "本页入站", value: `${inbound} 条` },
  ];
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="规则名 / 链 / 方向 / 动作 / 协议 / 端口"
    :loading="loading"
    :error="error"
    :has-rows="view.length > 0"
    empty-text="该主机未上报防火墙规则"
    unit="条规则"
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
    <div class="fw-list">
      <div v-for="(f, idx) in view" :key="idx" class="fw-row">
        <span :class="['fw-dir', f.inbound ? 'is-in' : 'is-out']" :title="f.inbound ? '入站' : '出站'">
          {{ f.inbound ? "↓" : "↑" }}
        </span>

        <div class="fw-main">
          <b class="fw-name pf-ellipsis" :title="String(f.raw.name ?? '')">{{ f.raw.name || "—" }}</b>
          <span class="fw-spec pf-mono pf-dim">
            {{ f.raw.protocol || "any" }}
            <template v-if="f.raw.localPort !== null && f.raw.localPort !== undefined">
              / {{ f.raw.localPort }}
            </template>
          </span>
        </div>

        <span :class="['pf-pill', f.allow ? 't-ok' : 't-bad']">
          {{ f.allow ? "放行" : "拒绝" }}
        </span>
        <span v-if="f.raw.profile" class="pf-pill t-mute">{{ f.raw.profile }}</span>
        <span v-if="f.raw.chain" class="fw-chain pf-mono pf-dim">{{ f.raw.chain }}</span>
      </div>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.fw-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.fw-row {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr) auto auto auto;
  gap: 10px;
  align-items: center;
  padding: 8px 11px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  transition: background 0.14s;
}
.fw-row:last-child {
  border-bottom: 0;
}
.fw-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.fw-dir {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
}
.fw-dir.is-in {
  color: var(--el-color-primary, #3b82f6);
  background: var(--el-color-primary-light-9, rgba(59, 130, 246, 0.1));
}
.fw-dir.is-out {
  color: var(--el-color-info, #06b6d4);
  background: var(--el-color-info-light-9, rgba(6, 182, 212, 0.1));
}
.fw-main {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}
.fw-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.fw-spec {
  font-size: 11px;
}
.fw-chain {
  font-size: 11px;
  white-space: nowrap;
}

@media (max-width: 620px) {
  .fw-row {
    grid-template-columns: 24px minmax(0, 1fr) auto;
  }
  .fw-chain,
  .fw-row .pf-pill.t-mute {
    display: none;
  }
}
</style>
