<script setup lang="ts">
/**
 * 系统配置分区 —— 句柄上限 / 用户限制 / 全局权限。
 *
 * <p>设计意图：这些都是「改错会影响整台机器」的开关，所以列表里必须同时给出
 * 当前值、作用域、来源文件与生效时机。可热更新的项打「热更新」胶囊，
 * 需要新会话的项打「新会话」胶囊；重要项在行内加红色「重要」标记，
 * 应用时由父级弹两次 MessageBox（本组件只负责提交草稿）。</p>
 *
 * <p>字段来自 {@code SystemConfigItemVO}：key / label / value / unit / scope /
 * source / editable / hot / requiresConfirm / tip。</p>
 *
 * @author CH
 * @since 4.0.0.51
 */
import { computed, reactive, watch } from "vue";
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
  (e: "apply", payload: {
    key: string;
    value: string;
    label: string;
    tip: string;
    hot: boolean;
    requiresConfirm: boolean;
  }): void;
}>();

/** 每行草稿：以 key 为键，刷新后用服务端当前值覆盖 */
const drafts = reactive<Record<string, string>>({});

watch(
  () => props.rows,
  rows => {
    for (const r of rows) {
      const key = String(r.key ?? "");
      if (key) drafts[key] = String(r.value ?? "");
    }
  },
  { immediate: true, deep: true },
);

function apply(row: Record<string, any>): void {
  const key = String(row.key ?? "");
  if (!key) return;
  emit("apply", {
    key,
    value: String(drafts[key] ?? "").trim(),
    label: String(row.label ?? key),
    tip: String(row.tip ?? ""),
    hot: !!row.hot,
    requiresConfirm: !!row.requiresConfirm,
  });
}

function dirty(row: Record<string, any>): boolean {
  const key = String(row.key ?? "");
  return String(drafts[key] ?? "").trim() !== String(row.value ?? "").trim();
}

/** 聚合条：项数、可热更新、需新会话、重要项 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  const hot = rows.filter(r => r.hot && r.editable).length;
  const cold = rows.filter(r => !r.hot && r.editable).length;
  const important = rows.filter(r => r.requiresConfirm).length;
  return [
    { label: "配置项", value: `${rows.length} 项` },
    { label: "热更新", value: `${hot} 项`, sub: "立即生效", tone: hot ? "ok" : "" },
    { label: "新会话生效", value: `${cold} 项`, sub: "已运行进程不变" },
    { label: "重要项", value: `${important} 项`, sub: "二次确认", tone: important ? "warn" : "" },
  ];
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="配置键 / 说明"
    :loading="loading"
    :error="error"
    :has-rows="rows.length > 0"
    empty-text="该主机未上报系统配置项"
    unit="项配置"
    :total="rows.length"
    @search="(kw: string) => emit('search', kw)"
    @commit="(kw: string) => emit('commit', kw)"
    @refresh="emit('refresh')"
  >
    <div class="cfg-list">
      <div class="cfg-row is-head">
        <span>配置项</span>
        <span>当前值</span>
        <span>作用域 / 来源</span>
        <span>生效时机</span>
        <span>修改</span>
      </div>
      <div v-for="r in rows" :key="String(r.key)" class="cfg-row">
        <div class="cfg-name">
          <b>
            {{ r.label || r.key }}
            <span v-if="r.requiresConfirm" class="cfg-flag">重要</span>
          </b>
          <span class="cfg-key pf-mono">{{ r.key }}{{ r.unit && r.unit !== '—' ? ` · ${r.unit}` : '' }}</span>
        </div>
        <div class="cfg-now pf-mono pf-ellipsis" :title="String(r.value ?? '')">
          {{ r.value === "" || r.value == null ? "—" : r.value }}
        </div>
        <div class="cfg-src">
          <span class="cfg-scope">{{ r.scope || "—" }}</span>
          <span class="cf-sc dim pf-ellipsis" :title="String(r.source ?? '')">{{ r.source || "—" }}</span>
        </div>
        <div class="cfg-timing">
          <span class="pf-pill" :class="r.hot ? 't-brand' : 't-mute'">{{ r.hot ? "热更新" : "新会话" }}</span>
          <el-tooltip v-if="r.tip" :content="String(r.tip)" placement="top" :show-after="200">
            <span class="cfg-tip">ⓘ</span>
          </el-tooltip>
        </div>
        <div class="cfg-edit">
          <template v-if="r.editable">
            <input
              v-model="drafts[String(r.key)]"
              class="cfg-input pf-mono"
              :placeholder="String(r.value ?? '')"
              :disabled="busyKey === `cfg-${r.key}`"
            />
            <button
              class="pf-btn"
              :class="{ 'is-primary': dirty(r) }"
              :disabled="busyKey === `cfg-${r.key}` || !String(drafts[String(r.key)] ?? '').trim()"
              @click="apply(r)"
            >{{ busyKey === `cfg-${r.key}` ? "…" : "应用" }}</button>
          </template>
          <span v-else class="pf-dim">只读</span>
        </div>
      </div>
    </div>

    <div class="cfg-note pf-dim">
      说明：热更新项由后端执行 sysctl -w 并写入持久化文件后回读确认；
      限制类配置写入 limits.d，只对之后的新登录 / 新会话生效，已运行进程的 ulimit 不会改变。
    </div>
  </ProfileSectionShell>
</template>

<style scoped lang="scss">
@use "./_profile-kit.scss";

.cfg-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-extra-light, #eef0f6);
  border-radius: 10px;
}
.cfg-row {
  display: grid;
  grid-template-columns: minmax(170px, 1.1fr) minmax(80px, 0.6fr) minmax(170px, 1.2fr) minmax(110px, 0.7fr) minmax(190px, 1.1fr);
  gap: 10px;
  align-items: center;
  padding: 7px 11px;
  background: var(--el-bg-color, #fff);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
  font-size: 11.5px;
  transition: background 0.14s;
}
.cfg-row:last-child {
  border-bottom: 0;
}
.cfg-row:hover {
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.cfg-row.is-head {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
  background: var(--el-fill-color-light, #f5f7fa);
}
.cfg-row.is-head:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.cfg-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.cfg-name b {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.cfg-flag {
  margin-left: 5px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 600;
  color: var(--el-color-danger, #c9403a);
  background: var(--el-color-danger-light-9, rgba(229, 83, 75, 0.09));
  border: 1px solid var(--el-color-danger-light-7, rgba(229, 83, 75, 0.22));
  border-radius: 20px;
}
.cfg-key {
  font-size: 11px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.cfg-now {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #1f2430);
}
.cfg-src {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.cfg-scope {
  font-size: 11px;
  color: var(--el-text-color-secondary, #5c6270);
}
.cf-sc {
  font-size: 10.5px;
  color: var(--el-text-color-placeholder, #a8abb2);
}
.cfg-timing {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cfg-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder, #a8abb2);
  cursor: help;
}
.cfg-tip:hover {
  color: var(--el-color-primary, #6d5dfc);
}
.cfg-edit {
  display: flex;
  align-items: center;
  gap: 5px;
}
.cfg-input {
  width: 100%;
  min-width: 0;
  height: 26px;
  padding: 0 7px;
  border: 1px solid var(--el-border-color-light, #e3e6ef);
  border-radius: 6px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-primary, #1f2430);
  font-size: 11.5px;
  outline: none;
}
.cfg-input:focus {
  border-color: var(--el-color-primary, #6d5dfc);
}
.pf-btn.is-primary {
  flex: none;
  color: var(--el-color-primary, #5a4bd9);
  border-color: var(--el-color-primary-light-5, #b3a9fe);
  background: var(--el-color-primary-light-9, #f6f4ff);
}
.cfg-note {
  margin-top: 8px;
  font-size: 11px;
  line-height: 1.65;
}

@media (max-width: 900px) {
  .cfg-row {
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) auto;
  }
  .cfg-row > :nth-child(3),
  .cfg-row > :nth-child(4) {
    display: none;
  }
}
</style>
