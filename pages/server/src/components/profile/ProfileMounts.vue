<script setup lang="ts">
/**
 * 挂载盘分区 —— 当前挂载列表 + 挂载 / 卸载。
 *
 * <p>设计意图：挂载点本身是「一行一个设备」的定长结构，逐行用容量条把
 * 已用 / 总量画出来，比再开一张磁盘卡更容易横向比较。挂载与卸载都属于
 * 改变系统状态的动作，因此在分区内展开一个表单，而不是再叠一层弹窗。</p>
 *
 * <p>字段来自 {@code MountRowVO}：source / target / fsType / options /
 * totalBytes / usedBytes / availBytes / usage / volumeId。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, ref, watch } from "vue";
import ProfileSectionShell from "./ProfileSectionShell.vue";
import type { StripItem } from "./types";

interface Props {
  rows: Record<string, any>[];
  keyword?: string;
  loading?: boolean;
  error?: string;
  busyKey?: string;
}

const props = withDefaults(defineProps<Props>(), {
  keyword: "",
  loading: false,
  error: "",
  busyKey: "",
});

const emit = defineEmits<{
  (e: "search", keyword: string): void;
  (e: "commit", keyword: string): void;
  (e: "refresh"): void;
  (e: "mount", payload: { source: string; target: string; fsType: string }): void;
  (e: "unmount", row: Record<string, any>): void;
}>();

/** 挂载表单开关与草稿 */
const formOpen = ref(false);
const form = ref({ source: "", target: "", fsType: "" });

function openForm(): void {
  form.value = { source: "", target: "", fsType: "" };
  formOpen.value = true;
}

function submit(): void {
  const source = form.value.source.trim();
  const target = form.value.target.trim();
  if (!source || !target) return;
  emit("mount", { source, target, fsType: form.value.fsType.trim() });
}

/** 容量格式化：统一按 1024 进位，取一位小数 */
function size(bytes: unknown): string {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let value = n;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${unit === 0 ? value : value.toFixed(1)} ${units[unit]}`;
}

function pct(row: Record<string, any>): number {
  const v = Number(row.usage);
  return Number.isFinite(v) && v >= 0 ? Math.max(0, Math.min(100, v)) : 0;
}

function tone(v: number): string {
  if (v >= 85) return "t-bad";
  if (v >= 70) return "t-warn";
  return "t-ok";
}

/** 聚合条：挂载点数、总容量、已用容量、最满的挂载点 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  let total = 0;
  let used = 0;
  let worst = 0;
  let worstTarget = "—";
  for (const r of rows) {
    const t = Number(r.totalBytes);
    const u = Number(r.usedBytes);
    if (Number.isFinite(t) && t > 0) total += t;
    if (Number.isFinite(u) && u > 0) used += u;
    const p = pct(r);
    if (p > worst) {
      worst = p;
      worstTarget = String(r.target ?? "—");
    }
  }
  return [
    { label: "挂载点", value: `${rows.length} 个` },
    { label: "总容量", value: size(total) },
    { label: "已用", value: size(used) },
    { label: "最满", value: `${worst.toFixed(1)}%`, sub: worstTarget, tone: worst >= 85 ? "bad" : worst >= 70 ? "warn" : "ok" },
  ];
});

// 表单关闭时清掉草稿，避免下一次打开看到上次失败的值
watch(formOpen, open => {
  if (!open) form.value = { source: "", target: "", fsType: "" };
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="设备 / 挂载点 / 文件系统"
    :loading="loading"
    :error="error"
    :has-rows="rows.length > 0"
    empty-text="该主机没有可见的挂载点"
    unit="个挂载点"
    :total="rows.length"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @refresh="emit('refresh')"
  >
    <template #tools>
      <ReButton icon="Plus" layout="square" :show-text="false" title="挂载设备" tip="挂载设备" @click="openForm" />
    </template>

    <!-- 挂载表单：设备 + 目标目录 + 可选文件系统类型 -->
    <div v-if="formOpen" class="mount-form">
      <label class="mf-field">
        <span class="mf-label">设备 / 卷</span>
        <input v-model="form.source" class="mf-input pf-mono" placeholder="/dev/sdb1 或 \\?\Volume{...}\" />
      </label>
      <label class="mf-field">
        <span class="mf-label">挂载点 / 盘符</span>
        <input v-model="form.target" class="mf-input pf-mono" placeholder="/mnt/data 或 X:" />
      </label>
      <label class="mf-field is-narrow">
        <span class="mf-label">文件系统</span>
        <input v-model="form.fsType" class="mf-input pf-mono" placeholder="ext4（可空）" />
      </label>
      <div class="mf-acts">
        <button class="pf-btn" @click="formOpen = false">取消</button>
        <button class="pf-btn is-primary" :disabled="!form.source.trim() || !form.target.trim()" @click="submit">挂载</button>
      </div>
    </div>

    <div class="mount-list">
      <div class="mount-row is-head">
        <span>设备 / 卷</span>
        <span>挂载点</span>
        <span>文件系统</span>
        <span>已用 / 总量</span>
        <span>使用率</span>
        <span />
      </div>
      <div v-for="r in rows" :key="`${r.target}-${r.source}`" class="mount-row">
        <b class="pf-mono pf-ellipsis" :title="String(r.source ?? '')">{{ r.source || "—" }}</b>
        <span class="pf-mono pf-ellipsis" :title="String(r.target ?? '')">{{ r.target || "—" }}</span>
        <span class="pf-ellipsis">
          {{ r.fsType || "—" }}
          <span v-if="r.options" class="mf-opts" :title="String(r.options)">· 选项</span>
        </span>
        <span class="mf-cap">
          <span class="pf-mono">{{ size(r.usedBytes) }}</span>
          <span class="pf-dim"> / {{ size(r.totalBytes) }}</span>
          <span class="pf-dim">（可用 {{ size(r.availBytes) }}）</span>
        </span>
        <span class="mf-usage">
          <span class="pf-bar" :class="tone(pct(r))"><i :style="{ width: pct(r) + '%' }" /></span>
          <span class="pf-mono">{{ pct(r).toFixed(1) }}%</span>
        </span>
        <span class="mf-acts">
          <button
            class="pf-btn is-bad"
            :disabled="busyKey === `umount-${r.target}` || !r.target"
            :title="`卸载 ${r.target || ''}`"
            @click="emit('unmount', r)"
          >{{ busyKey === `umount-${r.target}` ? "…" : "卸载" }}</button>
        </span>
      </div>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.mount-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 10px;
  margin-bottom: 10px;
  padding: 10px 12px;
  background: var(--el-fill-color-light, #f5f7fa);
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.mf-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 190px;
  flex: 1 1 190px;
}
.mf-field.is-narrow {
  flex: 0 1 130px;
  min-width: 110px;
}
.mf-label {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.mf-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color-light, #e3e6ef);
  border-radius: 6px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary, #1f2430);
  font-size: 12px;
  outline: none;
}
.mf-input:focus {
  border-color: var(--el-color-primary, #6d5dfc);
}
.mf-acts {
  display: flex;
  gap: 6px;
  margin-left: auto;
}
.pf-btn.is-primary {
  color: var(--el-color-primary, #5a4bd9);
  border-color: var(--el-color-primary-light-5, #b3a9fe);
  background: var(--el-color-primary-light-9, #f6f4ff);
}

.mount-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.mount-row {
  display: grid;
  grid-template-columns: minmax(140px, 1.1fr) minmax(120px, 1fr) minmax(90px, 0.7fr) minmax(190px, 1.2fr) minmax(120px, 0.9fr) auto;
  gap: 10px;
  align-items: center;
  padding: 7px 11px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  font-size: 11.5px;
  transition: background 0.14s;
}
.mount-row:last-child {
  border-bottom: 0;
}
.mount-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.mount-row.is-head {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: var(--el-fill-color-light, #f5f7fa);
}
.mount-row.is-head:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.mf-opts {
  color: var(--el-text-color-placeholder, #a8abb2);
  cursor: help;
}
.mf-cap {
  min-width: 0;
}
.mf-usage {
  display: flex;
  align-items: center;
  gap: 6px;
}
.mf-usage .pf-bar {
  flex: 1 1 auto;
  min-width: 42px;
}

@media (max-width: 900px) {
  .mount-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  }
  .mount-row > :nth-child(3),
  .mount-row > :nth-child(4),
  .mount-row > :nth-child(5) {
    display: none;
  }
}
</style>
