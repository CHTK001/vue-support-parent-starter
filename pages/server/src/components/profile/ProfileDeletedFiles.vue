<script setup lang="ts">
/**
 * 已删除文件分区 —— 文件已 unlink、空间仍被进程句柄占着。
 *
 * <p>设计意图：这一屏回答的是「磁盘满了但 du 找不到大文件」这个经典问题。
 * 因此每一行必须同时给出「谁占着（pid / ppid / 进程名 / 属主）」和
 * 「占了多少」，路径只作为定位线索。释放动作是把该 fd 截断为 0，
 * 不是杀进程，行内的按钮文案也按这个语义写。</p>
 *
 * <p>平台不支持时（Windows 未接入句柄枚举）展示原因，而不是一张空表 ——
 * 「采不到」和「没有这种文件」是两件事。</p>
 *
 * <p>字段来自 {@code DeletedFileRowVO}：pid / ppid / process / user / fd /
 * path / sizeBytes / sizeText。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed } from "vue";
import ProfileSectionShell from "./ProfileSectionShell.vue";
import type { StripItem } from "./types";

interface Props {
  rows: Record<string, any>[];
  keyword?: string;
  loading?: boolean;
  error?: string;
  supported?: boolean;
  reason?: string;
  busyKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  keyword: "",
  loading: false,
  error: "",
  supported: true,
  reason: "",
  busyKey: "",
});

const emit = defineEmits<{
  (e: "search", keyword: string): void;
  (e: "commit", keyword: string): void;
  (e: "refresh"): void;
  (e: "release", row: Record<string, any>): void;
}>();

function size(row: Record<string, any>): string {
  const text = String(row.sizeText ?? "").trim();
  if (text) return text;
  const n = Number(row.sizeBytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

/** 聚合条：文件数、占用总量、涉及进程、最大单文件 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  let total = 0;
  let max = 0;
  const pids = new Set<number>();
  for (const r of rows) {
    const n = Number(r.sizeBytes);
    if (Number.isFinite(n) && n > 0) total += n;
    if (Number.isFinite(n) && n > max) max = n;
    const pid = Number(r.pid);
    if (Number.isFinite(pid)) pids.add(pid);
  }
  const fmt = (n: number): string => {
    const units = ["B", "KB", "MB", "GB", "TB", "PB"];
    let value = n;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
  };
  return [
    { label: "被占用文件", value: `${rows.length} 个`, tone: rows.length ? "warn" : "ok" },
    { label: "可释放空间", value: fmt(total), sub: "截断后回收" },
    { label: "涉及进程", value: `${pids.size} 个` },
    { label: "最大单文件", value: fmt(max) },
  ];
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="路径 / 进程名 / PID"
    :loading="loading"
    :error="error"
    :has-rows="supported && rows.length > 0"
    :empty-text="supported ? '没有被进程占用却已删除的文件' : '当前平台未接入该能力'"
    unit="个文件"
    :total="rows.length"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @refresh="emit('refresh')"
  >
    <!-- 平台不支持：如实说明原因与替代做法，不摆空表 -->
    <div v-if="!supported" class="del-unsupported">
      <b>当前平台采不到「已删除但仍被占用」的文件</b>
      <p>{{ reason || '采集通道未接入该平台的文件句柄枚举。' }}</p>
      <p class="pf-dim">在 Linux 上本页读取 /proc/&lt;pid&gt;/fd 的 (deleted) 标记；其他平台需要管理员权限与句柄枚举工具。</p>
    </div>

    <div v-else class="del-list">
      <div class="del-row is-head">
        <span>文件路径</span>
        <span>占用进程（PID / PPID）</span>
        <span>属主</span>
        <span>fd</span>
        <span>占用大小</span>
        <span>释放</span>
      </div>
      <div v-for="r in rows" :key="`${r.pid}-${r.fd}-${r.path}`" class="del-row">
        <b class="pf-mono pf-ellipsis" :title="String(r.path ?? '')">{{ r.path || "—" }}</b>
        <span class="del-proc">
          <span class="pf-ellipsis">{{ r.process || "—" }}</span>
          <span class="del-pids pf-mono">PID {{ r.pid ?? "—" }} · PPID {{ r.ppid ?? "—" }}</span>
        </span>
        <span class="pf-ellipsis">{{ r.user || "—" }}</span>
        <span class="pf-mono">{{ r.fd ?? "—" }}</span>
        <span class="del-size pf-mono">{{ size(r) }}</span>
        <span>
          <button
            class="pf-btn is-bad"
            :disabled="busyKey === `deleted-${r.pid}-${r.fd}`"
            :title="`把 fd ${r.fd} 截断为 0，释放 ${size(r)}`"
            @click="emit('release', r)"
          >{{ busyKey === `deleted-${r.pid}-${r.fd}` ? "…" : "释放" }}</button>
        </span>
      </div>
    </div>

    <div v-if="supported && rows.length" class="del-note pf-dim">
      「释放」= 将 /proc/&lt;pid&gt;/fd/&lt;fd&gt; 截断为 0，空间立即归还，进程继续运行；
      若进程正在写这个文件，它之后读到的是空内容。也可以选择重启该进程，效果等同但会中断服务。
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.del-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.del-row {
  display: grid;
  grid-template-columns: minmax(180px, 1.5fr) minmax(150px, 1fr) minmax(80px, 0.5fr) 46px minmax(90px, 0.6fr) auto;
  gap: 10px;
  align-items: center;
  padding: 7px 11px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  font-size: 11.5px;
  transition: background 0.14s;
}
.del-row:last-child {
  border-bottom: 0;
}
.del-row:hover {
  background: var(--el-color-warning-light-9, rgba(245, 158, 11, 0.06));
}
.del-row.is-head {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: var(--el-fill-color-light, #f5f7fa);
}
.del-row.is-head:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.del-proc {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.del-pids {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.del-size {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-warning, #b8741a);
}
.del-unsupported {
  padding: 14px 16px;
  background: var(--el-color-warning-light-9, rgba(245, 158, 11, 0.07));
  border: 1px solid var(--el-color-warning-light-7, rgba(245, 158, 11, 0.26));
  border-radius: 10px;
  font-size: 12.5px;
  line-height: 1.75;
  color: var(--el-text-color-regular, #4a5162);
}
.del-unsupported b {
  color: var(--el-color-warning, #b8741a);
}
.del-unsupported p {
  margin: 4px 0 0;
}
.del-note {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .del-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr) auto;
  }
  .del-row > :nth-child(3),
  .del-row > :nth-child(4),
  .del-row > :nth-child(5) {
    display: none;
  }
}
</style>
