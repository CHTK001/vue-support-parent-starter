<script setup lang="ts">
/**
 * 网络分区 —— 网卡总览 + 原有配置入口。
 *
 * <p>设计意图：网卡本身需要「状态 / 属性 / 改 IPv4」这些 Windows 语义的操作，
 * 这套能力已在 {@code HostNetworkAdapters} 里实现完整，不该重写第二遍。
 * 因此这里只补一层「仪表」形态的总览卡（地址、MAC、速率、上下行），
 * 下方仍挂载原组件负责读写配置 —— 两者读同一份 rows，不会出现两套数据。</p>
 *
 * <p>字段来自 {@code NetworkInterfaceRowVO}：name / status / mac / ipv4 / ipv6 / mtu / speed。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import HostNetworkAdapters from "../HostNetworkAdapters.vue";
import NetAdapterGlyph from "../NetAdapterGlyph.vue";
import ProfileSectionShell from "./ProfileSectionShell.vue";
import type { StripItem } from "./types";

interface Props {
  hostId: number;
  rows: Record<string, any>[];
  platform?: string;
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  platform: "LINUX",
  loading: false,
  error: "",
});

const emit = defineEmits<{
  (e: "refresh"): void;
  (e: "applied"): void;
}>();

/** 网卡是否连接（Up） */
function isUp(r: Record<string, any>): boolean {
  const s = String(r.status ?? "").toLowerCase();
  return s.includes("up") || s.includes("connected") || s.includes("已连接");
}

/** 网卡类型：无线 / 回环 / 以太网，决定图标 */
function kindOf(r: Record<string, any>): "ethernet" | "wifi" | "loopback" {
  const text = `${r.name ?? ""} ${r.description ?? ""}`.toLowerCase();
  if (/wi-?fi|wlan|wireless|802\.11/.test(text)) return "wifi";
  if (/loopback|^\s*lo\b/.test(text)) return "loopback";
  return "ethernet";
}

/** 地址可能是逗号分隔的多地址，展示时拆开 */
function addresses(v: unknown): string[] {
  return String(v ?? "").split(/[,\s]+/).filter(Boolean);
}

const view = computed(() => props.rows.map(r => ({
  raw: r,
  up: isUp(r),
  kind: kindOf(r),
  v4: addresses(r.ipv4),
  v6: addresses(r.ipv6),
})));

/** 聚合条：网卡数、已连接、IPv4 数、主链路 */
const strip = computed<StripItem[]>(() => {
  const upCount = view.value.filter(v => v.up).length;
  const v4Count = view.value.filter(v => v.v4.length > 0).length;
  // 主链路：优先取第一块已连接的非回环网卡
  const primary = view.value.find(v => v.up && v.kind !== "loopback")
    ?? view.value.find(v => v.up);
  return [
    { label: "网卡", value: `${view.value.length} 块` },
    { label: "已连接", value: `${upCount} 块`, tone: upCount > 0 ? "ok" : "bad" },
    { label: "有 IPv4", value: `${v4Count} 块` },
    { label: "主链路", value: primary ? String(primary.raw.name ?? "—") : "—" },
  ];
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :searchable="false"
    :loading="loading"
    :error="error"
    :has-rows="view.length > 0"
    empty-text="该主机未上报网卡信息"
    unit="块网卡"
    :total="view.length"
    @refresh="emit('refresh')"
  >
    <!-- 网卡总览卡：一眼看清地址与链路状态 -->
    <div class="pf-grid net-grid">
      <div v-for="(n, idx) in view" :key="idx" :class="['pf-card net-card', { off: !n.up }]">
        <div class="net-head">
          <span class="net-icon"><NetAdapterGlyph :kind="n.kind" :size="26" /></span>
          <b class="net-name pf-mono pf-ellipsis">{{ n.raw.name || "—" }}</b>
          <span :class="['pf-pill', n.up ? 't-ok' : 't-mute']">{{ n.up ? "已连接" : "未连接" }}</span>
        </div>

        <div class="net-ip">
          <template v-if="n.v4.length">
            <div v-for="ip in n.v4" :key="ip" class="net-ip-line pf-mono">{{ ip }}</div>
          </template>
          <div v-else class="net-ip-line pf-dim">无 IPv4 地址</div>
          <div v-for="ip in n.v6.slice(0, 2)" :key="ip" class="net-ip-v6 pf-mono pf-dim">{{ ip }}</div>
        </div>

        <div class="net-meta">
          <span class="pf-ellipsis" :title="String(n.raw.mac ?? '')">MAC {{ n.raw.mac || "—" }}</span>
          <span v-if="n.raw.mtu">MTU {{ n.raw.mtu }}</span>
          <span v-if="n.raw.speed">{{ n.raw.speed }}</span>
        </div>
      </div>
    </div>

    <!-- 配置区：保留原网卡的「状态 / 属性 / IPv4」能力 -->
    <div class="net-config">
      <div class="net-config-head">
        <span class="net-config-title">网卡配置</span>
        <span class="pf-dim net-config-hint">
          {{ String(platform || '').toUpperCase().includes('WIN') ? '可查看状态、修改 IPv4' : '查看网卡明细' }}
        </span>
      </div>
      <HostNetworkAdapters
        :host-id="hostId"
        :rows="rows"
        :platform="platform"
        @applied="emit('applied')"
      />
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.net-grid {
  margin-bottom: 14px;
}
.net-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.net-card.off {
  opacity: 0.72;
}
.net-head {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.net-icon {
  display: inline-flex;
  flex: none;
  color: var(--el-color-primary, #6d5dfc);
}
.net-card.off .net-icon {
  color: var(--el-text-color-placeholder, #a8abb2);
}
.net-name {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.net-ip {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.net-ip-line {
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--el-text-color-primary, #1f2430);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.net-ip-v6 {
  font-size: 10.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.net-meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
  padding-top: 6px;
  border-top: 1px dashed var(--el-border-color-extra-light, #eef0f6);
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.net-config {
  border-top: 1px solid var(--el-border-color-extra-light, #eef0f6);
  padding-top: 11px;
}
.net-config-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}
.net-config-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.net-config-hint {
  font-size: 11.5px;
}
</style>
