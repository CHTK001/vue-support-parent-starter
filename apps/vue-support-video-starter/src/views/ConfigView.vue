<script setup lang="ts">
/**
 * 配置管理页 —— 在页面上维护视频/直播配置（第二版）
 *
 * 结构：存储状态 + 基础配置 + 分类关键词 + 直播目录（JSON 编辑/校验）+ 操作区。
 * 数据：configApi（GET /config、/config/export；POST /import、/reload、/sync）。
 * 保存：把表单与目录 JSON 组装为 VideoConfigSnapshot，POST /config/import。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";

import { Refresh, Download, Upload, Connection, Plus, Delete, MagicStick } from "@element-plus/icons-vue";
import {
  exportConfigSnapshot,
  fetchConfigOverview,
  importConfigSnapshot,
  reloadConfig,
  syncConfig,
} from "@/api/configApi";
import type { LiveCatalog, VideoConfigOverview, VideoConfigSnapshot } from "@/types/config";

/* ── 状态 ─────────────────────────────────── */
const loading = ref(true);
const saving = ref(false);
const overview = ref<VideoConfigOverview | null>(null);
const catalogUrl = ref("");
const defaultKeyword = ref("");
const browseRows = ref<{ key: string; value: string }[]>([]);
const liveCatalogText = ref("");
const liveCatalogError = ref("");

/** 分类码提示 */
const BROWSE_HINTS = ["movie", "tv", "anime", "variety", "documentary"];

/** 解析后的直播目录（用于预览） */
const parsedCatalog = computed<LiveCatalog | null>(() => {
  try {
    const obj = JSON.parse(liveCatalogText.value || "{}") as LiveCatalog;
    return Array.isArray(obj?.channels) ? obj : null;
  } catch {
    return null;
  }
});

/** 频道数量 */
const channelCount = computed(
  () => parsedCatalog.value?.channels?.length ?? overview.value?.liveChannelCount ?? 0,
);

/* ── 加载 ─────────────────────────────────── */
async function load() {
  loading.value = true;
  try {
    const [ov, snap] = await Promise.all([fetchConfigOverview(), exportConfigSnapshot()]);
    overview.value = ov;
    applySnapshot(snap);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "配置加载失败，请确认后端服务已启动");
  } finally {
    loading.value = false;
  }
}

/** 用快照回填表单 */
function applySnapshot(snap: VideoConfigSnapshot) {
  catalogUrl.value = snap.catalogUrl ?? "";
  defaultKeyword.value = snap.defaultKeyword ?? "";
  browseRows.value = Object.entries(snap.browseKeywords ?? {}).map(([key, value]) => ({
    key,
    value,
  }));
  liveCatalogText.value = JSON.stringify(snap.liveCatalog ?? { groups: [], channels: [] }, null, 2);
  liveCatalogError.value = "";
}

/** 表单 → 快照 */
function buildSnapshot(): VideoConfigSnapshot | null {
  try {
    const liveCatalog = JSON.parse(liveCatalogText.value || "{}") as LiveCatalog;
    liveCatalogError.value = "";
    const browseKeywords: Record<string, string> = {};
    for (const row of browseRows.value) {
      const key = row.key.trim();
      if (key) browseKeywords[key] = row.value.trim();
    }
    return {
      catalogUrl: catalogUrl.value.trim(),
      defaultKeyword: defaultKeyword.value.trim(),
      browseKeywords,
      liveCatalog,
    };
  } catch (e) {
    liveCatalogError.value = e instanceof Error ? e.message : "直播目录 JSON 解析失败";
    message.error("直播目录 JSON 格式有误：" + liveCatalogError.value);
    return null;
  }
}

/* ── 操作 ─────────────────────────────────── */
async function save() {
  const snapshot = buildSnapshot();
  if (!snapshot) return;
  saving.value = true;
  try {
    await importConfigSnapshot(snapshot, true);
    message.success("配置已保存并热加载");
    await load();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "配置保存失败");
  } finally {
    saving.value = false;
  }
}

async function reload() {
  try {
    await reloadConfig();
    message.success("已从配置库热加载");
    await load();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "热加载失败");
  }
}

async function sync() {
  try {
    const result = await syncConfig();
    message.success(`配置同步完成（pulled=${String(result.pulled)}）`);
    await load();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "配置同步失败");
  }
}

async function download() {
  const snapshot = buildSnapshot();
  if (!snapshot) return;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "video-config.json";
  a.click();
  URL.revokeObjectURL(url);
}

function formatCatalog() {
  const catalog = parsedCatalog.value;
  if (!catalog) {
    message.error("直播目录 JSON 格式有误");
    return;
  }
  liveCatalogText.value = JSON.stringify(catalog, null, 2);
  liveCatalogError.value = "";
  message.success("已格式化");
}

function addBrowseRow() {
  browseRows.value.push({ key: "", value: "" });
}

function removeBrowseRow(index: number) {
  browseRows.value.splice(index, 1);
}

onMounted(() => void load());
</script>

<template>
  <div class="vd-page vd-page--narrow">
    <header class="vd-header">
      <div>
        <h1>配置管理</h1>
        <p class="vd-subtitle">在页面上维护视频检索与电视直播配置，保存后立即热加载</p>
      </div>
      <el-tag :type="overview?.storage === 'db' ? 'success' : 'warning'" effect="dark" round>
        存储：{{ overview?.storage === "db" ? "配置库 sys_setting" : "本地 JSON（未落库）" }}
      </el-tag>
    </header>

    <el-alert
      v-if="!loading && overview?.storage !== 'db'"
      class="vdc-alert"
      type="warning"
      :closable="false"
      show-icon
      title="配置数据库不可用"
      description="当前宿主未引入通用配置服务，页面修改不会持久化（回退内置 JSON）。请引入 spring-api-support-common-service-starter。"
    />

    <!-- 基础配置 -->
    <el-card class="vdc-card" shadow="never">
      <template #header><span class="vdc-card-title">基础配置</span></template>
      <el-form label-width="140px" label-position="right">
        <el-form-item label="资源站采集地址">
          <el-input v-model="catalogUrl" placeholder="https://example.com/api.php/provide/vod/" clearable />
        </el-form-item>
        <el-form-item label="兜底检索关键词">
          <el-input v-model="defaultKeyword" placeholder="分类浏览不可用时的检索词，可空" clearable />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 分类关键词 -->
    <el-card class="vdc-card" shadow="never">
      <template #header>
        <div class="vdc-card-head">
          <span class="vdc-card-title">分类浏览关键词</span>
          <el-button :icon="Plus" @click="addBrowseRow">添加</el-button>
        </div>
      </template>
      <p class="vdc-hint">分类码（{{ BROWSE_HINTS.join(" / ") }}）→ 资源站检索关键词。</p>
      <div v-if="browseRows.length" class="vdc-rows">
        <div v-for="(row, i) in browseRows" :key="i" class="vdc-row">
          <el-input v-model="row.key" class="vdc-row-key" placeholder="分类码，如 movie" />
          <span class="vdc-row-arrow">→</span>
          <el-input v-model="row.value" class="vdc-row-value" placeholder="检索关键词，如 电影" />
          <el-button :icon="Delete" text type="danger" aria-label="删除" @click="removeBrowseRow(i)" />
        </div>
      </div>
      <el-empty v-else :image-size="60" description="暂无分类关键词" />
    </el-card>

    <!-- 直播目录 -->
    <el-card class="vdc-card" shadow="never">
      <template #header>
        <div class="vdc-card-head">
          <span class="vdc-card-title">直播目录（分组 / 频道 / 候选源）</span>
          <div class="vdc-card-actions">
            <el-tag round>频道 {{ channelCount }}</el-tag>
            <el-button :icon="MagicStick" @click="formatCatalog">格式化</el-button>
          </div>
        </div>
      </template>
      <el-input
        v-model="liveCatalogText"
        type="textarea"
        :rows="16"
        spellcheck="false"
        class="vdc-json"
        placeholder='{"groups":[...],"channels":[{"id":"cctv1","name":"CCTV-1 综合","group":"cctv","sort":1,"sources":["http://...m3u8"]}]}'
      />
      <p v-if="liveCatalogError" class="vdc-json-error">JSON 错误：{{ liveCatalogError }}</p>
      <div v-if="parsedCatalog?.channels?.length" class="vdc-channels">
        <el-tag
          v-for="c in parsedCatalog.channels.slice(0, 60)"
          :key="c.id"
          class="vdc-channel-tag"
          :type="c.cctv ? 'primary' : 'info'"
          effect="plain"
          round
        >
          {{ c.name }}<span class="vdc-channel-src">（{{ c.sources?.length ?? 0 }} 源）</span>
        </el-tag>
      </div>
    </el-card>

    <!-- 操作 -->
    <div class="vdc-actions">
      <el-button type="primary" :icon="Upload" :loading="saving" :disabled="loading" @click="save">
        保存配置
      </el-button>
      <el-button :icon="Refresh" :disabled="loading" @click="reload">重新加载</el-button>
      <el-button :icon="Connection" :disabled="loading" @click="sync">同步配置</el-button>
      <el-button :icon="Download" :disabled="loading" @click="download">导出快照</el-button>
    </div>
  </div>
</template>

<style scoped>
.vdc-alert {
  margin-bottom: 18px;
}

.vdc-card {
  margin-bottom: 18px;
  background: var(--vd-surface-card);
  border: 1px solid var(--vd-border);
  border-radius: var(--vd-radius-lg);
  --el-card-bg-color: var(--vd-surface-card);
}

.vdc-card :deep(.el-card__header) {
  border-bottom: 1px solid var(--vd-border);
  padding: 16px 20px;
}

.vdc-card :deep(.el-card__body) {
  padding: 20px;
}

.vdc-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.vdc-card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.vdc-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--vd-text);
}

.vdc-hint {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--vd-text-secondary);
}

.vdc-rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.vdc-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.vdc-row-key {
  max-width: 220px;
}

.vdc-row-value {
  flex: 1;
}

.vdc-row-arrow {
  color: var(--vd-text-muted);
}

.vdc-json :deep(.el-textarea__inner) {
  font-family: "JetBrains Mono", Consolas, Monaco, monospace;
  font-size: 12.5px;
  line-height: 1.6;
  background: var(--vd-bg-deep);
  color: var(--vd-text);
  box-shadow: 0 0 0 1px var(--vd-border) inset;
}

.vdc-json-error {
  margin: 8px 0 0;
  font-size: 13px;
  color: color-mix(in srgb, var(--vd-live) 62%, var(--vd-text));
}

.vdc-channels {
  margin-top: 14px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.vdc-channel-src {
  opacity: 0.65;
  font-size: 11px;
}

.vdc-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 4px;
}

@media (prefers-reduced-motion: reduce) {
  .vdc-card,
  .vdc-row,
  .vdc-actions {
    transition: none;
    animation: none;
  }
}
</style>
