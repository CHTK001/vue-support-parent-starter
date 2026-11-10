<script setup lang="ts">
/**
 * 系统配置分区 —— 按平台动态渲染的「主机配置」。
 *
 * <p>参数集合由后端平台 SPI 给出（Windows 走注册表，Linux 走 sysctl / limits.d），
 * 前端不再区分系统：{@code group} 分组、{@code type} 决定控件（数字 / 开关 / 下拉 / 文本），
 * {@code hot=false} 统一提示「需重启 / 新会话」。只读项（句柄总数等实时统计）不给输入框。</p>
 *
 * <p>字段来自 {@code SystemConfigItemVO}：key / label / value / unit / scope /
 * source / editable / hot / requiresConfirm / tip / group / type / options。</p>
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

/** 按后端给的 group 分组，保持首次出现顺序（Windows / Linux 的组不同，不写死） */
const groups = computed<Array<{ name: string; rows: Record<string, any>[] }>>(() => {
  const out: Array<{ name: string; rows: Record<string, any>[] }> = [];
  for (const row of props.rows) {
    const name = String(row.group ?? "其它");
    let g = out.find(x => x.name === name);
    if (!g) {
      g = { name, rows: [] };
      out.push(g);
    }
    g.rows.push(row);
  }
  return out;
});

/**
 * 解析枚举候选。
 * @param row 配置行
 * @returns 候选项；非枚举返回空数组
 */
function optionsOf(row: Record<string, any>): Array<{ label: string; value: string }> {
  const raw = String(row.options ?? "").trim();
  if (!raw) return [];
  return raw.split(";").map(part => {
    const at = part.indexOf("=");
    return at < 0
      ? { label: part.trim(), value: part.trim() }
      : { label: part.slice(at + 1).trim(), value: part.slice(0, at).trim() };
  }).filter(o => o.value !== "");
}

/**
 * 判断控件类型：优先用后端 type，缺失时按候选/值形态推断。
 * @param row 配置行
 * @returns int / bool / enum / text
 */
function controlType(row: Record<string, any>): string {
  const declared = String(row.type ?? "").trim();
  if (declared) return declared;
  const opts = optionsOf(row);
  if (opts.length === 2 && opts.every(o => o.value === "0" || o.value === "1")) return "bool";
  if (opts.length) return "enum";
  return /^-?\d+$/.test(String(row.value ?? "")) ? "int" : "text";
}

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

/** 聚合条：项数、可热更新、需重启/新会话、重要项 */
const strip = computed<StripItem[]>(() => {
  const rows = props.rows;
  const hot = rows.filter(r => r.hot && r.editable).length;
  const cold = rows.filter(r => !r.hot && r.editable).length;
  const important = rows.filter(r => r.requiresConfirm).length;
  return [
    { label: "配置项", value: `${rows.length} 项` },
    { label: "立即生效", value: `${hot} 项`, sub: "写入即生效", tone: hot ? "ok" : "" },
    { label: "需重启/新会话", value: `${cold} 项`, sub: "已运行进程不变" },
    { label: "重要项", value: `${important} 项`, sub: "二次确认", tone: important ? "warn" : "" },
  ];
});
</script>

<template>
  <ProfileSectionShell
    :strip="strip"
    :keyword="keyword"
    keyword-placeholder="配置键 / 分组 / 说明"
    :loading="loading"
    :error="error"
    :has-rows="rows.length > 0"
    empty-text="该主机未上报系统配置项（平台通道未接入或读取失败）"
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
      <template v-for="g in groups" :key="g.name">
        <div class="cfg-group">{{ g.name }}<span class="cfg-group-n">{{ g.rows.length }}</span></div>
        <div v-for="r in g.rows" :key="String(r.key)" class="cfg-row">
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
            <span class="pf-pill" :class="r.hot ? 't-brand' : 't-mute'">{{ r.hot ? "立即生效" : "需重启/新会话" }}</span>
            <el-tooltip v-if="r.tip" :content="String(r.tip)" placement="top" :show-after="200">
              <span class="cfg-tip">ⓘ</span>
            </el-tooltip>
          </div>
          <div class="cfg-edit">
            <template v-if="r.editable">
              <select
                v-if="controlType(r) === 'bool' || controlType(r) === 'enum'"
                v-model="drafts[String(r.key)]"
                class="cfg-input cfg-select"
                :disabled="busyKey === `cfg-${r.key}`"
              >
                <option v-for="o in optionsOf(r)" :key="o.value" :value="o.value">{{ o.label }}（{{ o.value }}）</option>
              </select>
              <input
                v-else
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
            <span v-else class="pf-dim">实时只读</span>
          </div>
        </div>
      </template>
    </div>

    <div class="cfg-note pf-dim">
      说明：参数集合由目标平台决定——Linux 写 /proc/sys 并持久化到 sysctl.d / limits.d；
      Windows 写注册表并回读确认，标注「需重启/新会话」的项在重启对应服务或系统后才生效。
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
.cfg-group {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.4px;
  color: var(--el-text-color-secondary, #5c6270);
  background: var(--el-fill-color-light, #f5f7fa);
  border-bottom: 1px solid var(--el-border-color-extra-light, #eef0f6);
}
.cfg-group-n {
  padding: 0 5px;
  font-weight: 500;
  color: var(--el-text-color-placeholder, #a8abb2);
  border: 1px solid var(--el-border-color-light, #e3e6ef);
  border-radius: 20px;
}
.cfg-row {
  display: grid;
  grid-template-columns: minmax(170px, 1.1fr) minmax(80px, 0.6fr) minmax(170px, 1.2fr) minmax(110px, 0.7fr) minmax(210px, 1.2fr);
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
.cfg-select {
  cursor: pointer;
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
