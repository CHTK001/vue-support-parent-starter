<template>
  <ScCard
    class="server-host-card"
    :class="[
      `is-${mode}`,
      metricToneClass(entry.snapshot, entry.host.enabled !== false),
      {
        'is-active': active,
        'is-collapsed': collapsed,
      },
    ]"
    shadow="hover"
    @click="emit('select', entry.host)"
    @contextmenu.prevent.stop="emit('contextmenu', $event, entry)"
  >
    <el-tooltip v-if="collapsed" placement="right" effect="light">
      <template #content>
        <div class="server-host-card__tooltip">
          <strong>{{ entry.host.serverName }}</strong>
          <span>{{ hostAddress(entry.host) }}</span>
          <span
            >{{ osLabel(entry.host.osType) }} /
            {{ serverTypeLabel(entry.host.serverType) }}</span
          >
          <span>{{ formatLatency(entry.snapshot?.latencyMs) }}</span>
          <span>
            CPU {{ Math.round(Number(entry.snapshot?.cpuUsage || 0)) }}% / 内存
            {{ Math.round(Number(entry.snapshot?.memoryUsage || 0)) }}%
          </span>
        </div>
      </template>
      <div class="server-host-card__collapsed-shell">
        <div class="server-host-card__collapsed-icon">
          <IconifyIconOnline :icon="hostAvatarIcon(entry.host)" />
        </div>
        <span
          class="server-host-card__collapsed-dot"
          :class="metricDotClass(entry.snapshot, entry.host.enabled !== false)"
        />
      </div>
    </el-tooltip>

    <template v-else>
      <div v-if="active" class="server-host-card__active-bar" />

      <div class="server-host-card__main">
        <div class="server-host-card__visual">
          <div
            class="server-host-card__orb"
            :class="`is-${normalizeOs(entry.host.osType) || 'default'}`"
          >
            <IconifyIconOnline :icon="osIcon(entry.host.osType)" />
            <span
              class="server-host-card__dot"
              :class="
                metricDotClass(entry.snapshot, entry.host.enabled !== false)
              "
            />
            <div class="server-host-card__metric-arcs">
              <span
                class="is-cpu"
                :style="{ '--ratio': metricRatio(entry.snapshot?.cpuUsage) }"
              />
              <span
                class="is-memory"
                :style="{ '--ratio': metricRatio(entry.snapshot?.memoryUsage) }"
              />
              <span
                class="is-disk"
                :style="{ '--ratio': metricRatio(entry.snapshot?.diskUsage) }"
              />
            </div>
          </div>
        </div>

        <div class="server-host-card__content">
          <div class="server-host-card__content-top">
            <small class="server-host-card__name">{{
              entry.host.serverName
            }}</small>
            <ScTag
              size="small"
              effect="plain"
              round
              class="server-host-card__latency"
              :type="latencyTagType(entry.snapshot?.latencyMs)"
            >
              {{ formatLatency(entry.snapshot?.latencyMs) }}
            </ScTag>
          </div>
          <strong class="server-host-card__address-text">{{
            hostAddress(entry.host)
          }}</strong>
          <span class="server-host-card__meta">
            {{ osLabel(entry.host.osType) }} ·
            {{ serverTypeLabel(entry.host.serverType) }}
          </span>
        </div>
      </div>

      <div class="server-host-card__toolbar">
        <el-tooltip content="编辑" placement="top">
          <el-button circle @click.stop="emit('edit', entry.host)">
            <IconifyIconOnline icon="ri:edit-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          :content="entry.host.enabled ? '停用' : '启用'"
          placement="top"
        >
          <el-button
            circle
            :type="entry.host.enabled ? 'warning' : 'success'"
            plain
            @click.stop="emit('toggle-enabled', entry.host)"
          >
            <IconifyIconOnline
              :icon="
                entry.host.enabled
                  ? 'ri:pause-circle-line'
                  : 'ri:play-circle-line'
              "
            />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="canOpenRemote" content="远程控制" placement="top">
          <el-button
            circle
            type="info"
            plain
            @click.stop="emit('open-remote', entry.host)"
          >
            <IconifyIconOnline icon="ri:remote-control-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip content="进程管理" placement="top">
          <el-button
            circle
            plain
            @click.stop="emit('open-processes', entry.host)"
          >
            <IconifyIconOnline icon="ri:stack-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip v-if="softEnabled" content="安装软件" placement="top">
          <el-button
            circle
            type="success"
            plain
            @click.stop="emit('open-install', entry.host)"
          >
            <IconifyIconOnline icon="ri:download-cloud-2-line" />
          </el-button>
        </el-tooltip>
        <el-tooltip
          v-if="softEnabled && entry.summary.installations > 0"
          content="软件视图"
          placement="top"
        >
          <el-button
            circle
            type="primary"
            plain
            @click.stop="emit('open-soft', entry.host)"
          >
            <IconifyIconOnline icon="ri:apps-2-line" />
          </el-button>
        </el-tooltip>
      </div>
    </template>
  </ScCard>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScCard from "@repo/components/ScCard/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import type { ServerHost } from "../api";
import type { ServerHostListEntry } from "./server-types";
import {
  formatLatency,
  hostAddress,
  hostAvatarIcon,
  metricDotClass,
  metricToneClass,
  normalizeOs,
  osIcon,
  osLabel,
  serverTypeLabel,
} from "../utils/serverHost";

const props = withDefaults(
  defineProps<{
    entry: ServerHostListEntry;
    active?: boolean;
    collapsed?: boolean;
    mode?: "sidebar" | "grid";
    softEnabled?: boolean;
  }>(),
  {
    active: false,
    collapsed: false,
    mode: "sidebar",
    softEnabled: false,
  },
);

const emit = defineEmits<{
  select: [host: ServerHost];
  edit: [host: ServerHost];
  "toggle-enabled": [host: ServerHost];
  "open-soft": [host: ServerHost];
  "open-install": [host: ServerHost];
  "open-remote": [host: ServerHost];
  "open-processes": [host: ServerHost];
  contextmenu: [event: MouseEvent, entry: ServerHostListEntry];
}>();

const canOpenRemote = computed(
  () => Boolean(props.entry.remoteConfig?.enabled),
);

const metricRatio = (value?: number | null) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0.08;
  }
  return Math.min(1, Math.max(0.08, numeric / 100));
};

const latencyTagType = (value?: number | null) => {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "info";
  if (numeric >= 350) return "danger";
  if (numeric >= 180) return "warning";
  return "success";
};
</script>

<style scoped lang="scss">
.server-host-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border-radius: 20px;
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent),
      transparent 60%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-bg-color-overlay) 98%, white) 0%,
      color-mix(in srgb, var(--el-bg-color-overlay) 92%, #f8fafc) 100%
    );
  box-shadow:
    0 10px 24px rgba(15, 23, 42, 0.06),
    0 22px 38px rgba(15, 23, 42, 0.03);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background 0.18s ease;
}

.server-host-card:hover {
  transform: translateY(-3px);
  border-color: color-mix(
    in srgb,
    var(--el-color-primary) 32%,
    var(--el-border-color)
  );
  box-shadow:
    0 16px 30px rgba(15, 23, 42, 0.09),
    0 28px 48px rgba(15, 23, 42, 0.06);
}

.server-host-card.is-active {
  border-color: color-mix(
    in srgb,
    var(--el-color-primary) 46%,
    var(--el-border-color)
  );
  background:
    radial-gradient(
      circle at top left,
      color-mix(in srgb, var(--el-color-primary) 20%, transparent),
      transparent 62%
    ),
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-color-primary) 9%, white) 0%,
      color-mix(in srgb, var(--el-bg-color-overlay) 94%, #eff6ff) 100%
    );
  box-shadow:
    0 18px 34px rgba(37, 99, 235, 0.16),
    0 32px 52px rgba(37, 99, 235, 0.08);
}

.server-host-card:not(.is-active) {
  filter: saturate(0.9);
  box-shadow:
    0 8px 20px rgba(15, 23, 42, 0.05),
    0 16px 28px rgba(15, 23, 42, 0.03);
}

.server-host-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 16px 16px 13px;
  min-height: 126px;
}

.server-host-card.is-collapsed {
  border-radius: 18px;
}

.server-host-card.is-collapsed :deep(.el-card__body) {
  justify-content: center;
  min-height: 48px;
  padding: 4px 3px;
}

.server-host-card.is-collapsed.is-active {
  box-shadow:
    0 14px 26px rgba(37, 99, 235, 0.16),
    inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 32%, transparent);
}

.server-host-card__active-bar {
  position: absolute;
  top: 14px;
  right: 0;
  width: 5px;
  height: calc(100% - 28px);
  border-radius: 999px 0 0 999px;
  background: linear-gradient(
    180deg,
    var(--el-color-primary) 0%,
    color-mix(in srgb, var(--el-color-primary) 60%, white) 100%
  );
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.35);
}

.server-host-card__toolbar,
.server-host-card__visual,
.server-host-card__main {
  display: flex;
}

.server-host-card__main {
  align-items: center;
  gap: 14px;
  min-width: 0;
  flex: 1;
  padding-right: 12px;
}

.server-host-card__dot,
.server-host-card__collapsed-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-color-success);
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
}

.server-host-card__dot.is-warning,
.server-host-card__collapsed-dot.is-warning {
  background: var(--el-color-warning);
  box-shadow: 0 0 0 5px rgba(245, 158, 11, 0.12);
}

.server-host-card__dot.is-offline,
.server-host-card__collapsed-dot.is-offline,
.server-host-card__dot.is-disabled,
.server-host-card__collapsed-dot.is-disabled {
  background: var(--el-color-danger);
  box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.12);
}

.server-host-card__visual {
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.server-host-card__orb {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 18px;
  font-size: 22px;
  color: white;
  background: linear-gradient(145deg, #64748b, #1e293b);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -8px 18px rgba(15, 23, 42, 0.18),
    0 18px 28px rgba(15, 23, 42, 0.16);
}

.server-host-card__orb .server-host-card__dot {
  position: absolute;
  right: -3px;
  bottom: -3px;
}

.server-host-card__orb.is-windows {
  background: linear-gradient(145deg, #60a5fa, #2563eb);
}

.server-host-card__orb.is-linux {
  background: linear-gradient(145deg, #f59e0b, #d97706);
}

.server-host-card__orb.is-macos {
  background: linear-gradient(145deg, #94a3b8, #334155);
}

.server-host-card__metric-arcs {
  position: absolute;
  inset: -5px;
  pointer-events: none;
}

.server-host-card__metric-arcs span {
  position: absolute;
  inset: 0;
  border-radius: 24px;
  opacity: 0.92;
  transform: rotate(var(--rotate, 0deg));
  background: conic-gradient(
    from 0deg,
    var(--color) 0deg,
    var(--color) calc(var(--ratio, 0) * 165deg),
    transparent calc(var(--ratio, 0) * 165deg),
    transparent 360deg
  );
  -webkit-mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 3px),
    #000 calc(100% - 3px)
  );
  mask: radial-gradient(
    farthest-side,
    transparent calc(100% - 3px),
    #000 calc(100% - 3px)
  );
}

.server-host-card__metric-arcs .is-cpu {
  --color: rgba(255, 255, 255, 0.95);
  --rotate: -90deg;
}

.server-host-card__metric-arcs .is-memory {
  --color: rgba(191, 219, 254, 0.92);
  --rotate: 30deg;
}

.server-host-card__metric-arcs .is-disk {
  --color: rgba(254, 240, 138, 0.88);
  --rotate: 150deg;
}

.server-host-card__content {
  display: grid;
  gap: 7px;
  min-width: 0;
}

.server-host-card__content-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.server-host-card__name {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-host-card__latency {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-fill-color-light) 84%, white);
  color: color-mix(in srgb, var(--el-color-success) 76%, #0f172a);
  font-size: 11px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.7);
}

.server-host-card__address-text {
  color: var(--el-text-color-primary);
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-host-card__meta {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.35;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.server-host-card__toolbar {
  position: absolute;
  top: 50%;
  right: 12px;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateY(-50%) translateX(6px);
  pointer-events: none;
  transition:
    opacity 0.18s ease,
    transform 0.18s ease;
  padding: 7px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(16px);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
}

.server-host-card__toolbar :deep(.el-button) {
  width: 28px;
  height: 28px;
  min-height: 28px;
}

.server-host-card:hover .server-host-card__toolbar,
.server-host-card:focus-within .server-host-card__toolbar {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
  pointer-events: auto;
}

.server-host-card__collapsed-shell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
}

.server-host-card__collapsed-icon {
  width: 28px;
  height: 28px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  background: color-mix(in srgb, var(--el-color-primary) 14%, white);
  color: var(--el-color-primary);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.55),
    0 10px 20px rgba(15, 23, 42, 0.08);
}

.server-host-card__collapsed-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 8px;
  height: 8px;
}

.server-host-card__tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
}
</style>
