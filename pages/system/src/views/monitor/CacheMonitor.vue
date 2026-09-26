<script setup lang="ts">
/**
 * 缓存监控页面（REST 版 · 可观测控制台风格）
 *
 * 页头 + 4统计卡 + 三栏主从（胶囊行 + 深色代码查看器）
 */
import { onMounted, ref, computed } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Refresh, Delete, Edit, FolderOpened, Document,
  Coin, User, Files, TrendCharts, ArrowRight, CircleCheck,
  CopyDocument, Tickets, Odometer,
} from "@element-plus/icons-vue";
import {
  getCacheStats,
  listCacheMonitorModules,
  listCacheMonitorKeys,
  getCacheValue,
  updateCacheValue,
  deleteCacheMonitorKey,
  clearCacheMonitorModule,
} from "../../api/systemApi";
import type { CacheModuleInfo, CacheValueInfo, CacheStats } from "../../api/types";

/* ============ 统计 ============ */
const stats = ref<CacheStats>({});
async function loadStats() {
  try {
    const res = await getCacheStats();
    stats.value = res?.data ?? {};
  } catch { /* 静默 */ }
}

/* ============ 左栏：缓存模块 ============ */
const modules = ref<CacheModuleInfo[]>([]);
const moduleLoading = ref(false);
const selectedModule = ref<CacheModuleInfo | null>(null);

/** 列表展示顺序：「全部」（__all__）固定在第一位，其余保持后端返回顺序 */
const orderedModules = computed<CacheModuleInfo[]>(() => {
  const all = modules.value.filter((m) => m.module === "__all__");
  const rest = modules.value.filter((m) => m.module !== "__all__");
  return [...all, ...rest];
});

async function loadModules() {
  moduleLoading.value = true;
  try {
    const res = await listCacheMonitorModules();
    modules.value = res?.data ?? [];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "缓存列表加载失败");
  } finally {
    moduleLoading.value = false;
  }
}

function selectModule(mod: CacheModuleInfo) {
  selectedModule.value = mod;
  selectedKey.value = null;
  cacheValue.value = null;
  loadKeys();
}

async function handleDeleteModule(mod: CacheModuleInfo) {
  try {
    await ElMessageBox.confirm(`确认清空缓存模块「${mod.name}」下的所有键？`, "提示", {
      type: "warning", confirmButtonText: "确定清空",
    });
  } catch { return; }
  try {
    await clearCacheMonitorModule(mod.module ?? "");
    ElMessage.success("已清空");
    loadModules();
    loadStats();
    if (selectedModule.value?.module === mod.module) {
      selectedModule.value = null;
      selectedKey.value = null;
      cacheValue.value = null;
      keys.value = [];
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "清空失败");
  }
}

/* ============ 中栏：键名列表 ============ */
const keys = ref<string[]>([]);
const keyLoading = ref(false);
const selectedKey = ref<string | null>(null);

async function loadKeys() {
  if (!selectedModule.value?.module) return;
  keyLoading.value = true;
  try {
    const res = await listCacheMonitorKeys(selectedModule.value.module);
    keys.value = res?.data ?? [];
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "键名列表加载失败");
    keys.value = [];
  } finally {
    keyLoading.value = false;
  }
}

function selectKey(key: string) {
  selectedKey.value = key;
  loadValue();
}

async function handleDeleteKey(key: string) {
  try {
    await ElMessageBox.confirm(`确认删除缓存键「${key}」？`, "提示", {
      type: "warning", confirmButtonText: "确定删除",
    });
  } catch { return; }
  try {
    await deleteCacheMonitorKey(key);
    ElMessage.success("已删除");
    loadKeys();
    loadModules();
    loadStats();
    if (selectedKey.value === key) { selectedKey.value = null; cacheValue.value = null; }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  }
}

/* ============ 右栏：缓存内容 ============ */
const cacheValue = ref<CacheValueInfo | null>(null);
const valueLoading = ref(false);

async function loadValue() {
  if (!selectedKey.value) return;
  valueLoading.value = true;
  try {
    const res = await getCacheValue(selectedKey.value, selectedModule.value?.module);
    cacheValue.value = res?.data ?? null;
    previewMode.value = "json"; // 新值默认自动 JSON（不可解析时自动回落原始）
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "缓存内容加载失败");
    cacheValue.value = null;
  } finally {
    valueLoading.value = false;
  }
}

/* ============ 缓存内容编辑（仅 Spring Cache 管理的缓存） ============ */
const editVisible = ref(false);
const editLoading = ref(false);
const editValue = ref("");
/** 编辑内容是否按 JSON 校验（Spring Cache 值均为 JSON） */
const editAsJson = ref(true);

/** 当前值是否可编辑 */
const canEditValue = computed(() => cacheValue.value?.editable === true);

const editJsonValid = computed(() => {
  if (!editAsJson.value) return true;
  try {
    JSON.parse(editValue.value);
    return true;
  } catch {
    return false;
  }
});

function openEditValue() {
  if (!canEditValue.value) return;
  // 优先「业务 JSON」（无类型信封）；后端未提供时回退原始值
  editValue.value = cacheValue.value?.plainValue ?? cacheValue.value?.value ?? "";
  editAsJson.value = true;
  editVisible.value = true;
}

function formatEditJson() {
  try {
    editValue.value = JSON.stringify(JSON.parse(editValue.value), null, 2);
    ElMessage.success("已格式化");
  } catch {
    ElMessage.error("当前内容不是合法 JSON，无法格式化");
  }
}

async function submitEditValue() {
  const module = selectedModule.value?.module;
  if (!module || !selectedKey.value) return;
  if (!editJsonValid.value) {
    ElMessage.warning("JSON 格式不合法，请修正后再保存");
    return;
  }
  editLoading.value = true;
  try {
    await updateCacheValue({ module, key: selectedKey.value, value: editValue.value });
    ElMessage.success("缓存值已更新");
    editVisible.value = false;
    await loadValue();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "缓存值更新失败");
  } finally {
    editLoading.value = false;
  }
}

async function handleClearValue() {
  if (!selectedKey.value) return;
  await handleDeleteKey(selectedKey.value);
}

/* ============ 整体刷新 ============ */
const refreshing = ref(false);
async function refreshAll() {
  refreshing.value = true;
  try {
    await Promise.all([loadStats(), loadModules()]);
    if (selectedModule.value?.module) await loadKeys();
    if (selectedKey.value) await loadValue();
  } finally {
    refreshing.value = false;
  }
}

onMounted(() => { loadStats(); loadModules(); });

/* ============ 工具函数 ============ */
/** TTL 秒 → HH:MM:SS；-1=永久；-2/null=— */
function formatTtl(ttl?: number): string {
  if (ttl === undefined || ttl === null || ttl === -2) return "—";
  if (ttl === -1) return "永久";
  const h = Math.floor(ttl / 3600);
  const m = Math.floor((ttl % 3600) / 60);
  const s = ttl % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatNum(v?: number): string {
  return (v ?? 0).toLocaleString();
}

/** HTML 转义 */
function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** JSON 语法高亮 → HTML 字符串 */
function highlightJson(val: unknown, indent: number): string {
  const pad = "  ".repeat(indent);
  const childPad = "  ".repeat(indent + 1);

  if (val === null || val === undefined) return `<span class="tok-null">null</span>`;
  if (typeof val === "boolean") return `<span class="tok-bool">${val}</span>`;
  if (typeof val === "number") return `<span class="tok-num">${val}</span>`;
  if (typeof val === "string") return `<span class="tok-str">&quot;${esc(val)}&quot;</span>`;

  if (Array.isArray(val)) {
    if (val.length === 0) return "[]";
    const items = val.map((item) => childPad + highlightJson(item, indent + 1));
    return "[\n" + items.join(",\n") + "\n" + pad + "]";
  }

  if (typeof val === "object") {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return "{}";
    const items = entries.map(([k, v]) =>
      `${childPad}<span class="tok-key">&quot;${esc(k)}&quot;</span>: ${highlightJson(v, indent + 1)}`
    );
    return "{\n" + items.join(",\n") + "\n" + pad + "}";
  }

  return esc(String(val));
}

/** 尝试把缓存值解析为 JSON（兼容「字符串里再包一层 JSON」），失败返回 null */
function parseJsonValue(raw: string): unknown | null {
  try {
    const once = JSON.parse(raw);
    if (typeof once === "string") {
      try {
        return JSON.parse(once);
      } catch {
        return once;
      }
    }
    return once;
  } catch {
    return null;
  }
}

/** 当前值是否可解析为 JSON（决定 JSON 预览是否可用） */
const isJsonValue = computed(() => {
  const raw = cacheValue.value?.value;
  return !!raw && parseJsonValue(raw) !== null;
});

/** 预览方式：json / raw；不可解析时自动回落 raw */
const previewMode = ref<"json" | "raw">("json");
const effectivePreviewMode = computed<"json" | "raw">(() =>
  isJsonValue.value ? previewMode.value : "raw",
);

/** 当前展示内容的纯文本（供复制，与查看器所见一致） */
const codeText = computed(() => {
  const raw = cacheValue.value?.value;
  if (!raw) return "";
  if (effectivePreviewMode.value === "json") {
    try {
      return JSON.stringify(parseJsonValue(raw), null, 2);
    } catch {
      return raw;
    }
  }
  return raw;
});

/** 缓存内容 → 高亮 HTML 行数组（JSON 美化 / 原始文本） */
const codeLines = computed(() => {
  const raw = cacheValue.value?.value;
  if (!raw) return [] as string[];
  let highlighted: string;
  if (effectivePreviewMode.value === "json") {
    highlighted = highlightJson(parseJsonValue(raw), 0);
  } else {
    highlighted = esc(raw)
      .split("\n")
      .map((line) => `<span class="tok-plain">${line || " "}</span>`)
      .join("\n");
  }
  return highlighted.split("\n");
});

/** 查看器统计：行数 / 字符数 */
const codeStats = computed(() => ({
  lines: codeLines.value.length,
  chars: codeText.value.length,
}));

/** 复制缓存内容（与查看器所见一致） */
async function copyCode() {
  const text = codeText.value;
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success("已复制缓存内容");
  } catch {
    ElMessage.error("复制失败，请手动选择复制");
  }
}
</script>

<template>
  <div class="cache-monitor">
    <!-- ===== 统计卡 ===== -->
    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--primary">
          <el-icon :size="20"><Coin /></el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__label">缓存实例</div>
          <div class="stat-card__value">{{ formatNum(stats.cacheCount) }}</div>
        </div>
        <el-icon :size="14" class="stat-card__trail"><Files /></el-icon>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--info">
          <el-icon :size="20"><User /></el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__label">总键数</div>
          <div class="stat-card__value">{{ formatNum(stats.totalKeys) }}</div>
        </div>
        <el-icon :size="14" class="stat-card__trail"><ArrowRight /></el-icon>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--success">
          <el-icon :size="20"><Odometer /></el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__label">内存占用</div>
          <div class="stat-card__value stat-card__value--success">{{ stats.usedMemory || "—" }}</div>
        </div>
        <el-icon :size="14" class="stat-card__trail"><ArrowRight /></el-icon>
      </div>

      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--warning">
          <el-icon :size="20"><TrendCharts /></el-icon>
        </div>
        <div class="stat-card__body">
          <div class="stat-card__label">命中率</div>
          <div class="stat-card__value stat-card__value--warning">
            <el-tooltip v-if="!stats.hitRateAvailable" content="当前 Redis 不支持命中率统计" placement="top">
              <span>—</span>
            </el-tooltip>
            <template v-else>{{ (stats.hitRate ?? 0).toFixed(1) }}<small>%</small></template>
          </div>
          <div v-if="stats.hitRateAvailable" class="stat-card__meter">
            <span :style="{ width: Math.min(100, stats.hitRate ?? 0) + '%' }" />
          </div>
        </div>
        <el-icon :size="14" class="stat-card__trail"><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- ===== 三栏 ===== -->
    <div class="cols-row">
      <!-- 左栏：缓存列表 -->
      <div class="col-panel col-panel--left">
        <div class="col-panel__head">
          <div class="col-panel__title-wrap">
            <span class="col-panel__icon"><el-icon :size="15"><FolderOpened /></el-icon></span>
            <span class="col-panel__title">缓存列表</span>
          </div>
          <div class="col-panel__head-right">
            <span class="col-badge">{{ modules.length }}项</span>
            <button class="refresh-btn" :class="{ 'refresh-btn--spinning': refreshing }" @click="refreshAll" title="刷新">
              <el-icon :size="16"><Refresh /></el-icon>
            </button>
          </div>
        </div>
        <div v-loading="moduleLoading" class="col-panel__body">
          <template v-if="orderedModules.length > 0">
            <div
              v-for="mod in orderedModules" :key="mod.module"
              class="capsule-row"
              :class="{ 'capsule-row--active': selectedModule?.module === mod.module }"
              @click="selectModule(mod)"
            >
              <div class="capsule-row__icon">
                <el-icon :size="16"><FolderOpened /></el-icon>
              </div>
              <div class="capsule-row__main">
                <div class="capsule-row__name">{{ mod.name || mod.module }}</div>
                <div class="capsule-row__desc">{{ mod.description || "—" }}</div>
              </div>
              <ReButton
                layout="square" type="danger" :icon="Delete" size="small"
                class="capsule-row__del"
                @click.stop="handleDeleteModule(mod)"
              />
            </div>
          </template>
          <el-empty v-else description="暂无缓存模块" :image-size="48" />
        </div>
      </div>

      <!-- 中栏：键名列表 -->
      <div class="col-panel col-panel--center">
        <div class="col-panel__head">
          <div class="col-panel__title-wrap">
            <span class="col-panel__icon col-panel__icon--info"><el-icon :size="15"><Tickets /></el-icon></span>
            <span class="col-panel__title">键名列表</span>
          </div>
          <div class="col-panel__head-right">
            <ReTag v-if="selectedModule && keys.length > 0" effect="light" round size="small" class="type-tag">
              <el-icon :size="12" class="type-tag__icon"><CircleCheck /></el-icon>
              {{ cacheValue?.type || "string" }}
            </ReTag>
            <span class="col-badge">{{ keys.length }}项</span>
            <ReButton layout="square" icon="Refresh" :loading="keyLoading" :disabled="!selectedModule" @click="loadKeys" />
          </div>
        </div>
        <div v-loading="keyLoading" class="col-panel__body">
          <template v-if="selectedModule && keys.length > 0">
            <div
              v-for="key in keys" :key="key"
              class="capsule-row"
              :class="{ 'capsule-row--active': selectedKey === key }"
              @click="selectKey(key)"
            >
              <div class="capsule-row__main">
                <div class="capsule-row__key">{{ key }}</div>
              </div>
              <ReButton
                layout="square" type="danger" :icon="Delete" size="small"
                class="capsule-row__del"
                @click.stop="handleDeleteKey(key)"
              />
            </div>
          </template>
          <el-empty v-else-if="!selectedModule" description="请选择左侧缓存模块" :image-size="48" />
          <el-empty v-else description="该缓存下暂无键" :image-size="48" />
        </div>
      </div>

      <!-- 右栏：缓存内容 -->
      <div class="col-panel col-panel--wide">
        <div class="col-panel__head">
          <div class="col-panel__title-wrap">
            <span class="col-panel__icon col-panel__icon--success"><el-icon :size="15"><Document /></el-icon></span>
            <span class="col-panel__title">缓存内容</span>
          </div>
          <div v-if="selectedKey" class="col-panel__head-right">
            <el-tooltip
              :content="canEditValue ? '编辑缓存值' : '该缓存不支持在线编辑（仅 Spring Cache 可编辑）'"
              placement="top"
            >
              <button
                class="head-icon-btn"
                :disabled="!canEditValue || !cacheValue"
                @click="openEditValue"
              >
                <el-icon :size="15"><Edit /></el-icon>
              </button>
            </el-tooltip>
            <button class="del-circle-btn" title="删除此键" @click="handleClearValue">
              <el-icon :size="16" color="var(--el-color-white)"><Delete /></el-icon>
            </button>
          </div>
        </div>
        <div v-loading="valueLoading" class="col-panel__body">
          <template v-if="selectedKey && cacheValue">
            <!-- 两个信息块 -->
            <div class="info-row">
              <div class="info-block">
                <div class="info-block__label">缓存名称</div>
                <div class="info-block__value">{{ selectedModule?.name || "—" }}</div>
              </div>
              <div class="info-block">
                <div class="info-block__label">缓存时间</div>
                <div class="info-block__value">{{ formatTtl(cacheValue.ttl) }}</div>
              </div>
            </div>

            <!-- 键名 -->
            <div class="kv-label">缓存键名</div>
            <div class="kv-row">
              <span class="kv-key" :title="selectedKey">{{ selectedKey }}</span>
              <ReTag v-if="cacheValue.type" effect="dark" size="small" class="type-tag-blue">{{ cacheValue.type }}</ReTag>
            </div>

            <!-- 查看器工具条：预览切换 + 统计 + 复制 -->
            <div class="code-toolbar">
              <div class="code-mode">
                <button
                  type="button"
                  class="code-mode__btn"
                  :class="{ 'is-active': effectivePreviewMode === 'json' }"
                  :disabled="!isJsonValue"
                  :title="isJsonValue ? '格式化为 JSON 展示' : '当前值不是合法 JSON'"
                  @click="previewMode = 'json'"
                >
                  JSON
                </button>
                <button
                  type="button"
                  class="code-mode__btn"
                  :class="{ 'is-active': effectivePreviewMode === 'raw' }"
                  @click="previewMode = 'raw'"
                >
                  原始
                </button>
              </div>
              <span class="code-stats">
                {{ codeStats.lines }} 行 · {{ formatNum(codeStats.chars) }} 字符
              </span>
              <button type="button" class="code-copy" title="复制内容" @click="copyCode">
                <el-icon :size="14"><CopyDocument /></el-icon>
                <span>复制</span>
              </button>
            </div>

            <!-- 深色代码查看器 -->
            <div class="code-viewer">
              <div class="code-lines">
                <div v-for="(_, i) in codeLines.length" :key="i" class="code-line-num">{{ i + 1 }}</div>
              </div>
              <pre class="code-pre"><code v-html="codeLines.join('\n')"></code></pre>
            </div>
          </template>
          <el-empty v-else description="选择键名后查看缓存内容" :image-size="56" />
        </div>
      </div>
    </div>

    <!-- ===== 编辑缓存值弹窗（仅 Spring Cache） ===== -->
    <ReDialog
      v-model="editVisible"
      title="编辑缓存值"
      width="720px"
      :show-footer="false"
      :close-on-click-modal="false"
    >
      <div class="cache-edit">
        <div class="cache-edit__meta">
          <span class="cache-edit__label">Key</span>
          <code class="cache-edit__key" :title="selectedKey || ''">{{ selectedKey }}</code>
          <ReTag v-if="cacheValue?.rootType" effect="light" round size="small" class="cache-edit__type">
            {{ cacheValue.rootType }}
          </ReTag>
        </div>
        <div class="cache-edit__toolbar">
          <span class="cache-edit__hint">
            业务 JSON（不含类型信封）· Spring Cache 无单条 TTL，写入不改变 TTL
          </span>
          <div class="cache-edit__actions">
            <el-checkbox v-model="editAsJson" size="small">JSON 校验</el-checkbox>
            <ReButton layout="modern" size="small" icon="MagicStick" @click="formatEditJson">格式化</ReButton>
          </div>
        </div>
        <el-input
          v-model="editValue"
          type="textarea"
          :rows="16"
          spellcheck="false"
          class="cache-edit__editor"
          :class="{ 'is-invalid': !editJsonValid }"
        />
        <p v-if="!editJsonValid" class="cache-edit__error">JSON 格式不合法，请修正后再保存</p>
        <p class="cache-edit__note">
          提示：嵌套泛型集合在编辑后会退化为通用结构；若对类型敏感，建议编辑后清空该缓存让其自然重建。
        </p>
      </div>
      <template #footer>
        <ReButton @click="editVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="editLoading" :disabled="!editJsonValid" @click="submitEditValue">
          保存
        </ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.cache-monitor {
  display: flex; flex-direction: column; gap: 16px;
  height: 100%; min-height: 0;
  overflow: hidden;
  padding: 4px 0;

  /* 代码查看器配色（全部走系统变量；亮色下深色底，暗色下跟随 koi 暗色容器） */
  --cm-code-bg: var(--el-text-color-primary);
  --cm-code-fg: var(--el-color-white);
  --cm-code-muted: color-mix(in srgb, var(--el-color-white) 45%, transparent);
  --cm-code-line: color-mix(in srgb, var(--el-color-white) 14%, transparent);
  --cm-tok-key: var(--el-color-primary-light-3);
  --cm-tok-str: var(--el-color-warning-light-3);
  --cm-tok-num: var(--el-color-success-light-3);
  --cm-tok-bool: var(--el-color-primary-light-5);
  --cm-tok-null: var(--el-color-info-light-5);
}
html.dark .cache-monitor {
  --cm-code-bg: var(--el-bg-color);
  --cm-code-fg: var(--el-text-color-primary);
  --cm-code-muted: var(--el-text-color-secondary);
  --cm-code-line: var(--el-border-color-darker, var(--el-border-color-dark));
}

.refresh-btn {
  width: 28px; height: 28px; border-radius: var(--el-radius-full);
  border: 1px solid var(--el-border-color-lighter); cursor: pointer;
  background: var(--el-bg-color);
  display: flex; align-items: center; justify-content: center;
  color: var(--el-text-color-secondary);
  transition: color 0.2s, border-color 0.2s, transform 0.3s ease;
}
.refresh-btn:hover { color: var(--el-color-primary); border-color: var(--el-color-primary-light-5); }
.refresh-btn--spinning { animation: spin 0.6s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* 统计卡 / 三栏：共用同一 4 列网格，保证逐列对齐 */
.stat-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  flex-shrink: 0;
}
.stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  transition:
    transform var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease,
    border-color var(--el-transition-duration, 0.2s) ease;
}
.stat-card:hover {
  transform: translateY(-2px);
  border-color: var(--el-color-primary-light-7);
  box-shadow: var(--el-box-shadow);
}
.stat-card:hover .stat-card__trail { transform: translateX(2px); color: var(--el-color-primary); }

/* 图标磁贴：四张卡统一「浅底 + 同色图标」，亮暗色自动适配 */
.stat-card__icon {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  width: 46px; height: 46px;
  border-radius: var(--el-radius-lg, 12px);
}
.stat-card__icon--primary { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.stat-card__icon--info { background: var(--el-color-info-light-9); color: var(--el-color-info); }
.stat-card__icon--success { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.stat-card__icon--warning { background: var(--el-color-warning-light-9); color: var(--el-color-warning); }

.stat-card__body { flex: 1; min-width: 0; }
.stat-card__label { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.stat-card__value {
  font-size: 26px; font-weight: 800; line-height: 1.1;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.stat-card__value small { font-size: 14px; font-weight: 600; margin-left: 1px; }
.stat-card__value--success { color: var(--el-color-success); }
.stat-card__value--warning { color: var(--el-color-warning); }
/* 命中率迷你进度条 */
.stat-card__meter {
  height: 4px; margin-top: 8px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color);
  overflow: hidden;
}
.stat-card__meter > span {
  display: block; height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--el-color-warning), var(--el-color-warning-light-3));
  transition: width 0.4s ease;
}
.stat-card__trail {
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  transition: transform var(--el-transition-duration, 0.2s) ease, color var(--el-transition-duration, 0.2s) ease;
}

/* 三栏 */
.cols-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  flex: 1;
  min-height: 0;
}
.col-panel {
  display: flex; flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px); background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden; min-width: 0;
}
/* 左栏对齐「缓存实例」，中栏对齐「总键数」，右栏跨「内存占用 + 命中率」两列 */
.col-panel--left { grid-column: span 1; }
.col-panel--center { grid-column: span 1; }
.col-panel--wide { grid-column: span 2; }

.col-panel__head {
  display: flex; align-items: center; justify-content: space-between; gap: 8px;
  padding: 14px 16px 12px; flex-shrink: 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
}
.col-panel__title-wrap { display: inline-flex; align-items: center; gap: 8px; min-width: 0; }
.col-panel__icon {
  display: inline-flex; align-items: center; justify-content: center;
  flex: none;
  width: 26px; height: 26px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.col-panel__icon--info { background: var(--el-color-info-light-9); color: var(--el-color-info); }
.col-panel__icon--success { background: var(--el-color-success-light-9); color: var(--el-color-success); }
.col-panel__title {
  font-size: 15px; font-weight: 700; color: var(--el-text-color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.col-panel__head-right { display: flex; align-items: center; gap: 8px; flex: none; }
.col-badge {
  background: var(--el-color-primary-light-9); color: var(--el-color-primary);
  font-size: 11px; font-weight: 700;
  padding: 2px 10px; border-radius: var(--el-radius-full);
  font-variant-numeric: tabular-nums;
}
.col-panel__body { flex: 1; min-height: 0; overflow-y: auto; padding: 10px 12px 12px; }

/* 胶囊行 */
.capsule-row {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; margin-bottom: 6px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px); cursor: pointer;
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    border-color var(--el-transition-duration, 0.2s) ease,
    box-shadow var(--el-transition-duration, 0.2s) ease;
}
.capsule-row:hover {
  background: var(--el-fill-color-lighter);
  border-color: var(--el-color-primary-light-7);
}
.capsule-row--active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-5);
  box-shadow: inset 3px 0 0 var(--el-color-primary);
}
.capsule-row--active:hover {
  background: var(--el-color-primary-light-8);
}
.capsule-row__icon {
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  width: 34px; height: 34px;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  transition: background-color var(--el-transition-duration, 0.2s) ease, color var(--el-transition-duration, 0.2s) ease;
}
.capsule-row--active .capsule-row__icon {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
}
.capsule-row__main { flex: 1; min-width: 0; }
.capsule-row__name {
  font-size: 13px; font-weight: 600; color: var(--el-text-color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.capsule-row__desc {
  font-size: 11px; color: var(--el-text-color-secondary); margin-top: 2px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.capsule-row__key {
  font-size: 12px; color: var(--el-text-color-regular);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  word-break: break-all; line-height: 1.5;
}
.capsule-row--active .capsule-row__key { color: var(--el-color-primary); }
.capsule-row__del { flex-shrink: 0; opacity: 0; transition: opacity var(--el-transition-duration, 0.2s) ease; }
.capsule-row:hover .capsule-row__del { opacity: 1; }

/* 右栏信息块 */
.info-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-bottom: 16px; }
.info-block {
  padding: 12px 14px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
}
.info-block__label { font-size: 11px; color: var(--el-text-color-secondary); margin-bottom: 5px; }
.info-block__value {
  font-size: 14px; font-weight: 700; color: var(--el-text-color-primary);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.kv-label { font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); margin-bottom: 6px; }
.kv-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
}
.kv-key {
  flex: 1; min-width: 0;
  font-size: 13px; color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  word-break: break-all; line-height: 1.5;
}
.type-tag { display: inline-flex; align-items: center; flex: none; }
.type-tag__icon { color: var(--el-color-success); margin-right: 3px; }
.type-tag-blue { flex: none; background: var(--el-color-primary); border: none; color: var(--el-color-white); }

/* 深色代码查看器 */
/* 查看器工具条：预览切换 + 统计 + 复制 */
.code-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.code-stats {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
.code-copy {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-bg-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    color var(--el-transition-duration, 0.2s) ease,
    border-color var(--el-transition-duration, 0.2s) ease,
    background-color var(--el-transition-duration, 0.2s) ease;
}
.code-copy:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.code-mode {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
}
.code-mode__btn {
  height: 26px;
  padding: 0 14px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  transition:
    background-color var(--el-transition-duration, 0.2s) ease,
    color var(--el-transition-duration, 0.2s) ease;
}
.code-mode__btn:hover:not(:disabled) { color: var(--el-color-primary); }
.code-mode__btn.is-active {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: var(--el-box-shadow-lighter);
}
.code-mode__btn:disabled { cursor: not-allowed; opacity: 0.45; }

.code-viewer {
  display: flex;
  background: var(--cm-code-bg);
  border-radius: var(--el-radius-lg, 12px);
  overflow: hidden;
  max-height: 460px;
  border: 1px solid color-mix(in srgb, var(--el-color-white) 8%, transparent);
}
.code-lines {
  flex-shrink: 0; padding: 14px 0; background: var(--cm-code-bg);
  border-right: 1px solid var(--cm-code-line); min-width: 44px;
  text-align: right; user-select: none;
}
.code-line-num {
  padding: 0 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 11px; line-height: 1.7; color: var(--cm-code-muted);
}
.code-pre {
  flex: 1; margin: 0; padding: 14px 16px; overflow: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; line-height: 1.7; color: var(--cm-code-fg);
  tab-size: 2;
}
.code-pre code { font-family: inherit; }
/* 查看器滚动条：暗底上更轻 */
.code-pre::-webkit-scrollbar { width: 8px; height: 8px; }
.code-pre::-webkit-scrollbar-thumb {
  border-radius: var(--el-radius-full, 9999px);
  background: var(--cm-code-line);
}
.code-pre::-webkit-scrollbar-thumb:hover {
  background: color-mix(in srgb, var(--cm-code-fg) 40%, transparent);
}
.code-pre::-webkit-scrollbar-track { background: transparent; }

.tok-key { color: var(--cm-tok-key); }
.tok-str { color: var(--cm-tok-str); }
.tok-num { color: var(--cm-tok-num); }
.tok-bool { color: var(--cm-tok-bool); }
.tok-null { color: var(--cm-tok-null); font-style: italic; }
.tok-plain { color: var(--cm-code-fg); }

/* 删除圆形按钮 */
.del-circle-btn {
  width: 32px; height: 32px; border-radius: var(--el-radius-full);
  border: none; cursor: pointer; background: var(--el-color-danger);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s;
}
.del-circle-btn:hover { transform: scale(1.08); }

/* 缓存内容头部：编辑图标按钮 */
.head-icon-btn {
  width: 28px; height: 28px; border-radius: var(--el-radius-full);
  border: 1px solid var(--el-border-color-lighter); cursor: pointer;
  background: var(--el-bg-color);
  display: flex; align-items: center; justify-content: center;
  color: var(--el-text-color-secondary);
  transition: color 0.15s, border-color 0.15s;
}
.head-icon-btn:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary-light-5);
}
.head-icon-btn:disabled { cursor: not-allowed; opacity: 0.45; }

/* ==================== 编辑缓存值弹窗 ==================== */
.cache-edit { display: flex; flex-direction: column; gap: 10px; }
.cache-edit__meta { display: flex; align-items: center; gap: 8px; min-width: 0; }
.cache-edit__label { flex: none; font-size: 12px; color: var(--el-text-color-secondary); }
.cache-edit__key {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; color: var(--el-text-color-primary);
}
.cache-edit__type { flex: none; }
.cache-edit__toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.cache-edit__hint { font-size: 12px; color: var(--el-text-color-secondary); }
.cache-edit__actions { display: inline-flex; align-items: center; gap: 8px; flex: none; }
.cache-edit__editor :deep(.el-textarea__inner) {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; line-height: 1.6;
}
.cache-edit__editor.is-invalid :deep(.el-textarea__inner) {
  box-shadow: 0 0 0 1px var(--el-color-danger) inset;
}
.cache-edit__error { margin: 0; font-size: 12px; color: var(--el-color-danger); }
.cache-edit__note { margin: 0; font-size: 12px; line-height: 1.6; color: var(--el-text-color-secondary); }

/* 空态：统一留白 */
.cache-monitor :deep(.el-empty) { padding: 28px 0; }

/* 响应式 */
@media screen and (max-width: 900px) {
  .cache-monitor { overflow-y: auto; }
  .stat-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .cols-row { grid-template-columns: minmax(0, 1fr); }
  .col-panel--left,
  .col-panel--center,
  .col-panel--wide { grid-column: span 1; }
  .col-panel { min-height: 200px; }
}
</style>
