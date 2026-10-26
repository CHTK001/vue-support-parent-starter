<script setup lang="ts">
/**
 * 环境变量分区 —— 键值台账 + 复制 / 删除。
 *
 * <p>设计意图：变量名是等宽字体的定宽键，值是可能很长的路径串。用两列网格对齐后
 * 可以纵向扫读键名，值超出时单行省略、hover 看全文，不把行高撑乱。</p>
 *
 * <p>字段来自 {@code EnvVarVO}：name / value。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { computed } from "vue";
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
  (e: "add"): void;
  (e: "remove", row: Record<string, any>): void;
  (e: "copy", text: string, label: string): void;
}>();

/** 聚合条：变量条数、最长值、含路径的条数 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  let longest = 0;
  let paths = 0;
  for (const r of rows) {
    const len = String(r.value ?? "").length;
    if (len > longest) longest = len;
    if (/[\\/]/.test(String(r.value ?? ""))) paths += 1;
  }
  return [
    { label: "变量", value: `${rows.length} 条` },
    { label: "最长值", value: `${longest} 字符` },
    { label: "路径类", value: `${paths} 条`, sub: "含目录分隔符" },
    { label: "作用域", value: "系统级" },
  ];
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="变量名 / 变量值"
    :loading="loading"
    :error="error"
    :has-rows="rows.length > 0"
    empty-text="该主机未上报环境变量"
    unit="条环境变量"
    :total="rows.length"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @refresh="emit('refresh')"
  >
    <template #tools>
      <ReButton icon="Plus" layout="square" :show-text="false" title="新增变量" tip="新增变量" @click="emit('add')" />
    </template>

    <div class="env-list">
      <div v-for="(r, idx) in rows" :key="idx" class="env-row">
        <b class="env-key pf-mono pf-ellipsis" :title="String(r.name ?? '')">{{ r.name || "—" }}</b>
        <span class="env-val pf-mono pf-ellipsis" :title="String(r.value ?? '')">{{ r.value ?? "" }}</span>
        <div class="env-acts">
          <button class="pf-btn" @click="emit('copy', String(r.value ?? ''), String(r.name ?? ''))">复制</button>
          <button
            class="pf-btn is-bad"
            :disabled="busyKey === `env-del-${r.name}`"
            @click="emit('remove', r)"
          >{{ busyKey === `env-del-${r.name}` ? "…" : "删除" }}</button>
        </div>
      </div>
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.env-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.env-row {
  display: grid;
  grid-template-columns: minmax(140px, 230px) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 7px 11px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  transition: background 0.14s;
}
.env-row:last-child {
  border-bottom: 0;
}
.env-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.env-key {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.env-val {
  font-size: 11.5px;
  color: var(--el-text-color-secondary, #5c6270);
}
.env-acts {
  display: flex;
  gap: 4px;
  flex: none;
}

@media (max-width: 640px) {
  .env-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .env-val {
    grid-column: 1 / -1;
  }
}
</style>
