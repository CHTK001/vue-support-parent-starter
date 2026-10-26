<script setup lang="ts">
/**
 * 磁盘分区 —— 容量环卡片。
 *
 * <p>设计意图：磁盘的核心问题是「哪块盘快满了」，所以第一眼给的是使用率环而不是容量数字。
 * 环的颜色按 90% / 75% 分档，剩余不足一成再单独标「空间不足」，避免小容量盘被容量绝对值误导。
 * 点击卡片或「文件」按钮打开该盘的根目录。</p>
 *
 * <p>字段全部来自 {@code DiskRowVO}：name / mount / fsType / totalGb / usedGb / availGb / usage。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
import {
  diskLetterOf,
  diskRootOf,
  diskTight,
  diskTone,
  diskUsageOf,
  fmtCapacity,
  type Tone,
} from "../../utils/hostProfileUi";
import ProfileSectionShell from "./ProfileSectionShell.vue";
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

/** 带派生字段的视图行：使用率、盘符、根路径、等级一次算好，模板里不再重复计算 */
interface DiskView {
  raw: Record<string, any>;
  letter: string;
  root: string;
  usage: number;
  tone: Tone;
  tight: boolean;
}

const view = computed<DiskView[]>(() => props.rows.map(raw => {
  const usage = diskUsageOf(raw);
  return {
    raw,
    letter: diskLetterOf(raw),
    root: diskRootOf(raw),
    usage,
    tone: diskTone(usage),
    tight: diskTight(raw),
  };
}));

const filtered = computed<DiskView[]>(() => {
  const kw = String(props.keyword || "").trim().toLowerCase();
  if (!kw) return view.value;
  return view.value.filter(d => Object.values(d.raw).some(v =>
    v !== null && v !== undefined && String(v).toLowerCase().includes(kw)));
});

/** 聚合条：总容量、已用、平均使用率、需要处理的盘数 */
const strip = computed<StripItem[]>(() => {
  let total = 0;
  let used = 0;
  let bad = 0;
  let warn = 0;
  for (const d of view.value) {
    total += Number(d.raw.totalGb) || 0;
    used += Number(d.raw.usedGb) || 0;
    if (d.tone === "bad" || d.tight) bad += 1;
    else if (d.tone === "warn") warn += 1;
  }
  const avg = total > 0 ? used / total * 100 : 0;
  return [
    { label: "总容量", value: fmtCapacity(total) },
    { label: "已用", value: fmtCapacity(used), sub: total > 0 ? `${avg.toFixed(1)}%` : "" },
    {
      label: "平均使用率",
      value: `${avg.toFixed(1)}%`,
      tone: diskTone(avg) as Tone,
    },
    {
      label: "接近写满",
      value: `${bad} 个`,
      sub: bad ? "需处理" : (warn ? `${warn} 个偏高` : "正常"),
      tone: bad ? "bad" : (warn ? "warn" : "ok"),
    },
  ];
});

function openDisk(d: DiskView): void {
  emit("open", d.root);
}
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="盘符 / 卷标 / 文件系统"
    :loading="loading"
    :error="error"
    :has-rows="filtered.length > 0"
    empty-text="该主机未上报磁盘信息"
    unit="个驱动器"
    :total="filtered.length"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @refresh="emit('refresh')"
  >
    <div class="pf-grid">
      <div
        v-for="(d, idx) in filtered"
        :key="idx"
        class="pf-card disk-card"
        :title="`打开 ${d.root}`"
        @click="openDisk(d)"
      >
        <div class="disk-head">
          <span :class="['pf-ring', d.tone ? `t-${d.tone}` : 't-brand']"
            :style="{ '--p': d.usage, width: '58px', height: '58px' }">
            <b>{{ Math.round(d.usage) }}%</b>
          </span>
          <div class="disk-meta">
            <b class="disk-letter pf-mono">{{ d.letter }}</b>
            <span class="disk-name pf-ellipsis">{{ d.raw.name || d.raw.mount || "—" }}</span>
            <span class="disk-fs pf-dim">{{ d.raw.fsType || "未知文件系统" }}</span>
          </div>
        </div>

        <div class="disk-nums">
          <span><i>已用</i><b class="pf-mono">{{ fmtCapacity(d.raw.usedGb) }}</b></span>
          <span><i>可用</i><b class="pf-mono">{{ fmtCapacity(d.raw.availGb) }}</b></span>
          <span><i>总量</i><b class="pf-mono">{{ fmtCapacity(d.raw.totalGb) }}</b></span>
        </div>

        <div class="disk-foot">
          <span v-if="d.tight" class="pf-pill t-bad">空间不足</span>
          <span v-else-if="d.tone === 'bad'" class="pf-pill t-bad">接近写满</span>
          <span v-else-if="d.tone === 'warn'" class="pf-pill t-warn">偏高</span>
          <span v-else class="pf-pill t-ok">正常</span>
          <span class="disk-mount pf-mono pf-dim pf-ellipsis">{{ d.root }}</span>
          <button class="pf-btn disk-open" @click.stop="openDisk(d)">文件</button>
        </div>
      </div>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.disk-card {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}
.disk-head {
  display: flex;
  gap: 11px;
  align-items: center;
}
.disk-meta {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.disk-letter {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.2px;
  color: var(--el-text-color-primary, #1f2430);
}
.disk-name {
  font-size: 12px;
  color: var(--el-text-color-secondary, #5c6270);
}
.disk-fs {
  font-size: 11px;
}
.disk-nums {
  display: flex;
  gap: 12px;
  margin: 10px 0 9px;
  padding-top: 9px;
  border-top: 1px dashed var(--el-border-color-extra-light, #eef0f6);
}
.disk-nums span {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.disk-nums i {
  font-style: normal;
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.disk-nums b {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  color: var(--el-text-color-primary, #1f2430);
}
.disk-foot {
  display: flex;
  gap: 7px;
  align-items: center;
  min-width: 0;
}
.disk-mount {
  flex: 1;
  min-width: 0;
  font-size: 11px;
}
.disk-open {
  flex: none;
}
</style>
