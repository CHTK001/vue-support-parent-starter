<script setup lang="ts">
/**
 * 服务分区 —— 运行中 / 已停止 双列。
 *
 * <p>设计意图：服务页的判读动作是「有没有该起没起的」。平铺表格要把状态列逐行扫一遍，
 * 拆成两列后「已停止」这一列本身就是待办清单；列头带计数，空列也能一眼确认。</p>
 *
 * <p>字段来自 {@code ServiceRowVO}：name / displayName / state / startType / pid。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import {
  leadTileOf,
  numOf,
  serviceRunning,
  stateTone,
} from "../../utils/hostProfileUi";
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
  (e: "start", row: Record<string, any>): void;
  (e: "stop", row: Record<string, any>): void;
  (e: "restart", row: Record<string, any>): void;
}>();

/** 列内一项：图标与等级预先算好 */
interface ServiceView {
  raw: Record<string, any>;
  running: boolean;
  tone: string;
  tile: { brand: string; bg: string; glyph: string; letter: string };
}

const view = computed<ServiceView[]>(() => props.rows.map(raw => {
  const running = serviceRunning(raw);
  return {
    raw,
    running,
    tone: stateTone(raw.state),
    tile: leadTileOf("services", raw),
  };
}));

const runningList = computed(() => view.value.filter(s => s.running));
const stoppedList = computed(() => view.value.filter(s => !s.running));

/** 聚合条：总数、运行中、已停止、开机自启 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  const total = props.paged ? props.total : rows.length;
  const running = rows.filter(r => serviceRunning(r)).length;
  const auto = rows.filter(r => String(r.startType ?? "").trim().toUpperCase() === "AUTOMATIC").length;
  return [
    { label: "服务总数", value: `${total} 个` },
    { label: "本页运行中", value: `${running} 个`, tone: "ok" },
    {
      label: "本页已停止",
      value: `${rows.length - running} 个`,
      tone: rows.length - running > 0 ? "bad" : "ok",
    },
    { label: "本页开机自启", value: `${auto} 个` },
  ];
});

function act(kind: "start" | "stop" | "restart", row: Record<string, any>): void {
  if (kind === "start") emit("start", row);
  else if (kind === "stop") emit("stop", row);
  else emit("restart", row);
}
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="服务名 / 显示名 / 状态"
    :loading="loading"
    :error="error"
    :has-rows="view.length > 0"
    empty-text="该主机未上报服务信息"
    unit="个服务"
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
    <div class="svc-cols">
      <!-- 运行中 -->
      <section class="svc-col">
        <header class="svc-col-head">
          <span class="pf-dot t-ok" />
          <span class="svc-col-title">运行中</span>
          <em class="svc-col-count">{{ runningList.length }}</em>
        </header>
        <div v-if="!runningList.length" class="svc-col-empty pf-dim">本页没有运行中的服务</div>
        <div
          v-for="(s, idx) in runningList"
          :key="`run-${idx}`"
          class="svc-row"
        >
          <span v-if="s.tile.brand" class="svc-tile svc-tile--brand" v-html="s.tile.brand"></span>
          <span v-else class="svc-tile" :style="{ background: s.tile.bg }">
            <span v-if="s.tile.glyph" class="svc-glyph" v-html="s.tile.glyph"></span>
            <template v-else>{{ s.tile.letter }}</template>
          </span>
          <div class="svc-meta">
            <b class="svc-name pf-mono pf-ellipsis">{{ s.raw.name || "—" }}</b>
            <span class="svc-desc pf-ellipsis pf-dim">{{ s.raw.displayName || "—" }}</span>
          </div>
          <span class="svc-type pf-dim">{{ s.raw.startType || "—" }}</span>
          <div class="svc-acts">
            <button class="pf-btn" :disabled="busyKey === `service-restart-${s.raw.name}`"
              @click="act('restart', s.raw)">
              {{ busyKey === `service-restart-${s.raw.name}` ? "…" : "重启" }}
            </button>
            <button class="pf-btn is-bad" :disabled="busyKey === `service-stop-${s.raw.name}`"
              @click="act('stop', s.raw)">
              {{ busyKey === `service-stop-${s.raw.name}` ? "…" : "停止" }}
            </button>
          </div>
        </div>
      </section>

      <!-- 已停止 -->
      <section class="svc-col">
        <header class="svc-col-head">
          <span class="pf-dot t-bad" />
          <span class="svc-col-title">已停止</span>
          <em class="svc-col-count">{{ stoppedList.length }}</em>
        </header>
        <div v-if="!stoppedList.length" class="svc-col-empty pf-dim">本页服务全部在运行</div>
        <div
          v-for="(s, idx) in stoppedList"
          :key="`stop-${idx}`"
          class="svc-row"
        >
          <span class="svc-tile" :style="{ background: s.tile.bg }">
            <span v-if="s.tile.glyph" class="svc-glyph" v-html="s.tile.glyph"></span>
            <template v-else>{{ s.tile.letter }}</template>
          </span>
          <div class="svc-meta">
            <b class="svc-name pf-mono pf-ellipsis">{{ s.raw.name || "—" }}</b>
            <span class="svc-desc pf-ellipsis pf-dim">{{ s.raw.displayName || "—" }}</span>
          </div>
          <span class="svc-type pf-dim">{{ s.raw.startType || "—" }}</span>
          <div class="svc-acts">
            <button class="pf-btn" :disabled="busyKey === `service-start-${s.raw.name}`"
              @click="act('start', s.raw)">
              {{ busyKey === `service-start-${s.raw.name}` ? "…" : "启动" }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.svc-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
  align-items: start;
}
.svc-col {
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
}
.svc-col-head {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 11px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  background: var(--el-fill-color-lighter, #fafafa);
}
.svc-col-title {
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--el-text-color-secondary, #5c6270);
}
.svc-col-count {
  margin-left: auto;
  font-style: normal;
  font-size: 11.5px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.svc-col-empty {
  padding: 18px 11px;
  font-size: 12px;
  text-align: center;
}
.svc-row {
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto auto;
  gap: 9px;
  align-items: center;
  padding: 7px 10px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  transition: background 0.14s;
}
.svc-row:last-child {
  border-bottom: 0;
}
.svc-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.svc-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  flex: none;
}
.svc-tile--brand {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.svc-tile :deep(svg) {
  display: block;
}
.svc-glyph {
  display: inline-flex;
  line-height: 0;
}
.svc-meta {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
}
.svc-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.svc-desc {
  font-size: 11px;
}
.svc-type {
  font-size: 10.5px;
  white-space: nowrap;
}
.svc-acts {
  display: flex;
  gap: 4px;
}

@media (max-width: 820px) {
  .svc-cols {
    grid-template-columns: 1fr;
  }
}
</style>
