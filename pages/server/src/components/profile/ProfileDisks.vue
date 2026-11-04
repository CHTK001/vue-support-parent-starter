<script setup lang="ts">
/**
 * 磁盘分区 —— 进程磁盘活动表。
 *
 * <p>设计意图：磁盘页要回答的不再只是「哪块盘快满了」，而是「谁在读写磁盘、慢在哪」。
 * 表格按 Windows 资源监视器的磁盘活动口径组织：名称（进程图标）/ PID / 文件 /
 * 读、写、总速率均值 / I/O 优先级 / 响应时间。所有数据列可点击排序，默认按总速率降序，
 * 最忙的进程自然排在最前。</p>
 *
 * <p>字段来源分两类，前端都按可选处理：</p>
 * <ul>
 *   <li>磁盘活动：{@code name / pid / file / readBytesPerSecAvg / writeBytesPerSecAvg /
 *       totalBytesPerSecAvg / ioPriority / responseTimeMs}，兼容 {@code *RateAvg} 等别名；</li>
 *   <li>分区容量（旧接口 {@code DiskRowVO}）：{@code name / mount / fsType / totalGb / usedGb /
 *       availGb / usage}。</li>
 * </ul>
 *
 * <p>后端当前只保证第二类字段。若整批行都没有活动字段，表格降级为分区容量视图并给出说明，
 * 避免真实主机在这一页直接变空；一旦采集侧补上活动字段，表格自动切回磁盘活动视图。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed, ref } from "vue";
import {
  diskLetterOf,
  diskRootOf,
  diskTight,
  diskTone,
  diskUsageOf,
  fmt1,
  fmtCapacity,
  leadTileOf,
  numOf,
  type Tone,
} from "../../utils/hostProfileUi";
import ProfileSectionShell from "./ProfileSectionShell.vue";
import ProfileSortHead from "./ProfileSortHead.vue";
import type { StripItem } from "./types";

interface Props {
  /** 当前分区的行数据（磁盘分区不分页） */
  rows: Record<string, any>[];
  /** 前端检索关键字 */
  keyword?: string;
  loading?: boolean;
  error?: string;
}

const props = withDefaults(defineProps<Props>(), {
  keyword: "",
  loading: false,
  error: "",
});

const emit = defineEmits<{
  (e: "open", root: string): void;
  (e: "refresh"): void;
  (e: "search", keyword: string): void;
  (e: "commit", keyword: string): void;
}>();

/** 分区容量行没有进程图标，用一个中性的硬盘图形兜底 */
const DISK_GLYPH = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" '
  + 'stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
  + '<rect x="2.5" y="5" width="19" height="10.5" rx="2"/>'
  + '<circle cx="6.5" cy="10.2" r="1.1" fill="currentColor" stroke="none"/>'
  + '<path d="M10.5 10.2h7.5M6 20.5h12"/></svg>';

/** 活动字段的读取顺序：新字段优先，兼容后端可能采用的别名 */
const READ_KEYS = ["readBytesPerSecAvg", "readRateAvg", "readRateAverage", "readAvg", "readBytesPerSec"];
const WRITE_KEYS = ["writeBytesPerSecAvg", "writeRateAvg", "writeRateAverage", "writeAvg", "writeBytesPerSec"];
const TOTAL_KEYS = ["totalBytesPerSecAvg", "totalRateAvg", "totalRateAverage", "totalAvg", "totalBytesPerSec"];
const RESPONSE_KEYS = ["responseTimeMs", "responseTime", "responseMs", "latencyMs"];

/** 取第一个能转成数字的字段；全都缺失时返回 null（模板渲染为「—」） */
function pickNum(raw: Record<string, any>, keys: string[]): number | null {
  for (const k of keys) {
    const v = raw?.[k];
    if (v === null || v === undefined || v === "") continue;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** 视图行：活动字段、容量字段与展示派生值一次算好，模板不再重复计算 */
interface DiskRow {
  raw: Record<string, any>;
  name: string;
  /** 名称副行：容量视图放挂载点与文件系统 */
  sub: string;
  pid: number;
  file: string;
  read: number | null;
  write: number | null;
  total: number | null;
  ioPriority: string;
  responseMs: number | null;
  letter: string;
  root: string;
  usage: number;
  tone: Tone;
  tight: boolean;
  /** 该行是否携带进程磁盘活动字段 */
  activity: boolean;
  tile: { brand: string; bg: string; glyph: string; letter: string };
}

const view = computed<DiskRow[]>(() => props.rows.map(raw => {
  const usage = diskUsageOf(raw);
  const name = String(raw.name ?? raw.process ?? raw.image ?? raw.mount ?? "").trim();
  const mount = String(raw.mount ?? "").trim();
  const fsType = String(raw.fsType ?? "").trim();
  const pid = numOf(raw.pid);
  const file = String(raw.file ?? raw.path ?? "").trim();
  const read = pickNum(raw, READ_KEYS);
  const write = pickNum(raw, WRITE_KEYS);
  // 后端只给读写两项时，总速率按两者之和补齐
  const total = pickNum(raw, TOTAL_KEYS) ?? (read !== null || write !== null ? (read ?? 0) + (write ?? 0) : null);
  const ioPriority = String(raw.ioPriority ?? raw.priority ?? "").trim();
  const responseMs = pickNum(raw, RESPONSE_KEYS);
  const activity = pid > 0 || file !== "" || read !== null || write !== null
    || ioPriority !== "" || responseMs !== null;
  return {
    raw,
    name,
    sub: activity ? "" : [mount, fsType].filter(Boolean).join(" · "),
    pid,
    file,
    read,
    write,
    total,
    ioPriority,
    responseMs,
    letter: diskLetterOf(raw),
    root: diskRootOf(raw),
    usage,
    tone: diskTone(usage),
    tight: diskTight(raw),
    activity,
    tile: activity
      ? leadTileOf("processes", { name })
      : { brand: "", bg: "#5b6b8c", glyph: DISK_GLYPH, letter: "" },
  };
}));

/** 整批行是否带磁盘活动字段：全都没有时降级为分区容量视图 */
const hasActivity = computed(() => view.value.some(d => d.activity));

const filtered = computed<DiskRow[]>(() => {
  const kw = String(props.keyword || "").trim().toLowerCase();
  if (!kw) return view.value;
  return view.value.filter(d => [d.name, d.file, d.sub, d.raw.fsType, d.raw.mount]
    .some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(kw)));
});

/* ==================== 排序 ==================== */

/** 活动视图与容量视图共用一个排序状态；切换视图时由默认列兜底 */
type SortKey =
  | "name" | "pid" | "file" | "read" | "write" | "total" | "io" | "response"
  | "mount" | "fs" | "size" | "used" | "avail" | "usage" | "state";

const sortKey = ref<SortKey | "">("");
const sortDir = ref<"asc" | "desc">("asc");

/** 没点过列头时的默认排序：活动视图看总速率，容量视图看使用率 */
const defaultKey = computed<SortKey>(() => (hasActivity.value ? "total" : "usage"));
const activeKey = computed<SortKey>(() => sortKey.value || defaultKey.value);
const activeDir = computed<"asc" | "desc">(() => (sortKey.value ? sortDir.value : "desc"));

/** 点同一列切换升 / 降序，点另一列从升序重新开始 */
function toggleSort(key: SortKey): void {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === "asc" ? "desc" : "asc";
    return;
  }
  sortKey.value = key;
  sortDir.value = "asc";
}

/** I/O 优先级的固定档位：越低越让路，越高越抢占 */
const IO_RANK: Record<string, number> = { "very low": 0, low: 1, normal: 2, high: 3, critical: 4 };

function ioRank(v: string): number {
  return IO_RANK[v.trim().toLowerCase()] ?? -1;
}

/** I/O 优先级胶囊：关键 / 高要显眼，普通保持安静 */
function ioTone(v: string): string {
  const r = ioRank(v);
  if (r >= 4) return "t-bad";
  if (r === 3) return "t-warn";
  if (r <= 1) return "t-mute";
  return "t-ok";
}

/** 状态等级排序权重 */
function stateRank(d: DiskRow): number {
  if (d.tight || d.tone === "bad") return 3;
  if (d.tone === "warn") return 2;
  return 1;
}

/** 空值判定：没有值的行无论升序降序都沉底 */
function isBlank(key: SortKey, d: DiskRow): boolean {
  if (key === "pid") return d.pid <= 0;
  if (key === "file") return d.file === "";
  if (key === "read") return d.read === null;
  if (key === "write") return d.write === null;
  if (key === "total") return d.total === null;
  if (key === "io") return d.ioPriority === "";
  if (key === "response") return d.responseMs === null;
  if (key === "name") return d.name === "";
  return false;
}

function compareBy(key: SortKey, a: DiskRow, b: DiskRow): number {
  switch (key) {
    case "name":
      return a.name.localeCompare(b.name);
    case "pid":
      return a.pid - b.pid;
    case "file":
      return a.file.localeCompare(b.file);
    case "read":
      return (a.read ?? 0) - (b.read ?? 0);
    case "write":
      return (a.write ?? 0) - (b.write ?? 0);
    case "total":
      return (a.total ?? 0) - (b.total ?? 0);
    case "io":
      return ioRank(a.ioPriority) - ioRank(b.ioPriority);
    case "response":
      return (a.responseMs ?? 0) - (b.responseMs ?? 0);
    case "mount":
      return String(a.raw.mount ?? "").localeCompare(String(b.raw.mount ?? ""));
    case "fs":
      return String(a.raw.fsType ?? "").localeCompare(String(b.raw.fsType ?? ""));
    case "size":
      return numOf(a.raw.totalGb) - numOf(b.raw.totalGb);
    case "used":
      return numOf(a.raw.usedGb) - numOf(b.raw.usedGb);
    case "avail":
      return numOf(a.raw.availGb) - numOf(b.raw.availGb);
    case "usage":
      return a.usage - b.usage;
    case "state":
      return stateRank(a) - stateRank(b);
    default:
      return 0;
  }
}

const sorted = computed<DiskRow[]>(() => {
  const key = activeKey.value;
  const dir = activeDir.value === "asc" ? 1 : -1;
  return [...filtered.value].sort((a, b) => {
    const ba = isBlank(key, a);
    const bb = isBlank(key, b);
    if (ba !== bb) return ba ? 1 : -1;
    return compareBy(key, a, b) * dir;
  });
});

/* ==================== 聚合条 ==================== */

/** 速率格式化：B/s → KB/s → MB/s → GB/s */
function fmtRate(bytes: number | null): string {
  if (bytes === null) return "—";
  const n = Math.abs(bytes);
  if (n >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB/s`;
  if (n >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB/s`;
  if (n >= 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${Math.round(bytes)} B/s`;
}

const strip = computed<StripItem[]>(() => {
  if (!hasActivity.value) {
    let total = 0;
    let used = 0;
    let bad = 0;
    let warn = 0;
    for (const d of view.value) {
      total += numOf(d.raw.totalGb);
      used += numOf(d.raw.usedGb);
      if (d.tone === "bad" || d.tight) bad += 1;
      else if (d.tone === "warn") warn += 1;
    }
    const avg = total > 0 ? used / total * 100 : 0;
    return [
      { label: "总容量", value: fmtCapacity(total) },
      { label: "已用", value: fmtCapacity(used), sub: total > 0 ? `${avg.toFixed(1)}%` : "" },
      { label: "平均使用率", value: `${avg.toFixed(1)}%`, tone: diskTone(avg) as Tone },
      {
        label: "接近写满",
        value: `${bad} 个`,
        sub: bad ? "需处理" : (warn ? `${warn} 个偏高` : "正常"),
        tone: bad ? "bad" : (warn ? "warn" : "ok"),
      },
    ];
  }

  let read = 0;
  let write = 0;
  let maxResponse = 0;
  let active = 0;
  for (const d of view.value) {
    if (!d.activity) continue;
    active += 1;
    read += d.read ?? 0;
    write += d.write ?? 0;
    maxResponse = Math.max(maxResponse, d.responseMs ?? 0);
  }
  return [
    { label: "活动进程", value: `${active} 个` },
    { label: "读取合计", value: fmtRate(read) },
    { label: "写入合计", value: fmtRate(write) },
    {
      label: "最高响应",
      value: `${fmt1(maxResponse)} ms`,
      tone: maxResponse >= 200 ? "bad" : maxResponse >= 50 ? "warn" : "",
    },
  ];
});

/** 容量视图里点行仍可打开该盘根目录（沿用旧卡片的行为） */
function openVolume(d: DiskRow): void {
  if (d.activity) return;
  emit("open", d.root || "/");
}
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    :keyword-placeholder="hasActivity ? '进程 / PID / 文件 / I/O 优先级' : '盘符 / 挂载点 / 文件系统'"
    :loading="loading"
    :error="error"
    :has-rows="filtered.length > 0"
    :empty-text="hasActivity ? '该主机未上报磁盘活动明细' : '该主机未上报磁盘信息'"
    :unit="hasActivity ? '个磁盘活动' : '个驱动器'"
    :total="filtered.length"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @refresh="emit('refresh')"
  >
    <p v-if="!hasActivity && filtered.length" class="disk-note">
      后端当前只上报分区容量，未上报进程级磁盘活动；下表为分区容量与占用情况。
    </p>

    <div :class="['disk-table', hasActivity ? 'disk-table--activity' : 'disk-table--volume']">
      <div class="disk-scroll">
        <!-- 磁盘活动视图：进程读写明细 -->
        <template v-if="hasActivity">
          <div class="disk-head">
            <ProfileSortHead label="名称" :active="activeKey === 'name'" :dir="activeDir" @sort="toggleSort('name')" />
            <ProfileSortHead label="PID" :active="activeKey === 'pid'" :dir="activeDir" align="right" @sort="toggleSort('pid')" />
            <ProfileSortHead label="文件" :active="activeKey === 'file'" :dir="activeDir" @sort="toggleSort('file')" />
            <ProfileSortHead label="读取速率均值" :active="activeKey === 'read'" :dir="activeDir" align="right" @sort="toggleSort('read')" />
            <ProfileSortHead label="写入速率均值" :active="activeKey === 'write'" :dir="activeDir" align="right" @sort="toggleSort('write')" />
            <ProfileSortHead label="总速率均值" :active="activeKey === 'total'" :dir="activeDir" align="right" @sort="toggleSort('total')" />
            <ProfileSortHead label="I/O 优先级" :active="activeKey === 'io'" :dir="activeDir" @sort="toggleSort('io')" />
            <ProfileSortHead label="响应时间(ms)" :active="activeKey === 'response'" :dir="activeDir" align="right" @sort="toggleSort('response')" />
          </div>
          <div v-for="d in sorted" :key="`${d.name}-${d.pid}-${d.file}`" class="disk-row">
            <span class="dc-name">
              <span v-if="d.tile.brand" class="dc-tile dc-tile--brand" v-html="d.tile.brand"></span>
              <span v-else class="dc-tile" :style="{ background: d.tile.bg }">
                <span v-if="d.tile.glyph" class="dc-glyph" v-html="d.tile.glyph"></span>
                <template v-else>{{ d.tile.letter }}</template>
              </span>
              <b class="pf-ellipsis" :title="d.name">{{ d.name || "—" }}</b>
            </span>
            <span class="dc-num pf-mono pf-dim">{{ d.pid > 0 ? d.pid : "—" }}</span>
            <span class="dc-file pf-mono pf-ellipsis" :title="d.file">{{ d.file || "—" }}</span>
            <span class="dc-rate pf-mono">{{ fmtRate(d.read) }}</span>
            <span class="dc-rate pf-mono">{{ fmtRate(d.write) }}</span>
            <b class="dc-rate dc-rate--total pf-mono">{{ fmtRate(d.total) }}</b>
            <span class="dc-io">
              <span v-if="d.ioPriority" :class="['pf-pill', ioTone(d.ioPriority)]">{{ d.ioPriority }}</span>
              <span v-else class="pf-dim">—</span>
            </span>
            <span class="dc-rate pf-mono" :class="{ 'pf-dim': d.responseMs === null }">
              {{ d.responseMs === null ? "—" : `${fmt1(d.responseMs)} ms` }}
            </span>
          </div>
        </template>

        <!-- 容量降级视图：后端只有 DiskRowVO 字段时 -->
        <template v-else>
          <div class="disk-head">
            <ProfileSortHead label="名称" :active="activeKey === 'name'" :dir="activeDir" @sort="toggleSort('name')" />
            <ProfileSortHead label="挂载点" :active="activeKey === 'mount'" :dir="activeDir" @sort="toggleSort('mount')" />
            <ProfileSortHead label="文件系统" :active="activeKey === 'fs'" :dir="activeDir" @sort="toggleSort('fs')" />
            <ProfileSortHead label="总量" :active="activeKey === 'size'" :dir="activeDir" align="right" @sort="toggleSort('size')" />
            <ProfileSortHead label="已用" :active="activeKey === 'used'" :dir="activeDir" align="right" @sort="toggleSort('used')" />
            <ProfileSortHead label="可用" :active="activeKey === 'avail'" :dir="activeDir" align="right" @sort="toggleSort('avail')" />
            <ProfileSortHead label="使用率" :active="activeKey === 'usage'" :dir="activeDir" align="right" @sort="toggleSort('usage')" />
            <ProfileSortHead label="状态" :active="activeKey === 'state'" :dir="activeDir" @sort="toggleSort('state')" />
          </div>
          <div
            v-for="d in sorted"
            :key="`${d.letter}-${d.root}-${d.name}`"
            class="disk-row is-clickable"
            :title="`打开 ${d.root}`"
            @click="openVolume(d)"
          >
            <span class="dc-name">
              <span class="dc-tile" :style="{ background: d.tile.bg }">
                <span class="dc-glyph" v-html="d.tile.glyph"></span>
              </span>
              <span class="dc-name-text">
                <b class="pf-ellipsis" :title="d.name">{{ d.name || d.letter || "—" }}</b>
                <i v-if="d.sub" class="pf-ellipsis" :title="d.sub">{{ d.sub }}</i>
              </span>
            </span>
            <span class="dc-file pf-mono pf-ellipsis" :title="String(d.raw.mount ?? '')">{{ d.raw.mount || "—" }}</span>
            <span class="dc-fs pf-dim pf-ellipsis">{{ d.raw.fsType || "—" }}</span>
            <span class="dc-rate pf-mono">{{ fmtCapacity(d.raw.totalGb) }}</span>
            <span class="dc-rate pf-mono">{{ fmtCapacity(d.raw.usedGb) }}</span>
            <span class="dc-rate pf-mono">{{ fmtCapacity(d.raw.availGb) }}</span>
            <span class="dc-usage pf-mono" :class="d.tone ? `t-${d.tone}` : ''">
              <span class="pf-bar"><i :style="{ width: `${Math.min(100, Math.max(0, d.usage))}%` }" /></span>
              <b>{{ d.usage.toFixed(1) }}%</b>
            </span>
            <span class="dc-io">
              <span v-if="d.tight" class="pf-pill t-bad">空间不足</span>
              <span v-else-if="d.tone === 'bad'" class="pf-pill t-bad">接近写满</span>
              <span v-else-if="d.tone === 'warn'" class="pf-pill t-warn">偏高</span>
              <span v-else class="pf-pill t-ok">正常</span>
            </span>
          </div>
        </template>
      </div>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.disk-note {
  margin: 0 0 8px;
  padding: 6px 10px;
  border: 1px solid var(--el-color-warning-light-7, rgba(245, 158, 11, 0.26));
  border-radius: 7px;
  background: var(--el-color-warning-light-9, rgba(245, 158, 11, 0.11));
  font-size: 11.5px;
  line-height: 1.6;
  color: var(--el-text-color-regular, #4a5162);
}

.disk-table {
  display: flex;
  flex-direction: column;
}
.disk-scroll {
  overflow-x: auto;
}

/* 两种视图共用一套壳，只有列宽不同 */
.disk-head,
.disk-row {
  display: grid;
  gap: 8px;
  align-items: center;
  min-width: 840px;
  padding: 5px 10px;
  border-radius: 6px;
}
.disk-table--activity .disk-head,
.disk-table--activity .disk-row {
  grid-template-columns: minmax(150px, 1.35fr) 58px minmax(150px, 1.55fr) 100px 100px 100px 84px 92px;
}
.disk-table--volume .disk-head,
.disk-table--volume .disk-row {
  grid-template-columns: minmax(150px, 1.35fr) minmax(110px, 1fr) 84px 88px 88px 88px 96px 84px;
}

.disk-head {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: var(--el-fill-color-light, #f5f7fa);
}
.disk-row {
  font-size: 12px;
  transition: background 0.14s;
}
.disk-row + .disk-row {
  border-top: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.disk-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.disk-row.is-clickable {
  cursor: pointer;
}

/* ---------- 名称单元格：图标 + 名称 ---------- */
.dc-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.dc-name-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.dc-name-text b {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.dc-name-text i {
  font-style: normal;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.dc-name > b {
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.dc-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex: none;
  border-radius: 6px;
  color: #fff;
  font-size: 9.5px;
  font-weight: 700;
}
.dc-tile--brand {
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.dc-tile :deep(svg) {
  display: block;
  width: 15px;
  height: 15px;
}
.dc-glyph {
  display: inline-flex;
  line-height: 0;
}

/* ---------- 数值列 ---------- */
.dc-num {
  font-size: 11px;
  text-align: right;
}
.dc-file {
  min-width: 0;
  font-size: 11px;
  color: var(--el-text-color-regular, #4a5162);
}
.dc-fs {
  min-width: 0;
  font-size: 11px;
}
.dc-rate {
  font-size: 11.5px;
  text-align: right;
  color: var(--el-text-color-regular, #4a5162);
  white-space: nowrap;
}
.dc-rate--total {
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.dc-io {
  display: flex;
  align-items: center;
  min-width: 0;
}
.dc-usage {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}
.dc-usage .pf-bar {
  flex: 1;
  min-width: 24px;
}
.dc-usage b {
  flex: none;
  font-size: 11px;
  font-weight: 600;
  text-align: right;
  color: var(--tone, var(--el-text-color-primary, #1f2430));
}
</style>
