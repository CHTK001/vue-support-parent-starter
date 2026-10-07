<script setup lang="ts">
/**
 * 数据文件预览面板（SQLite / Parquet，前端直渲）。
 *
 * <p>与后端 SqlitePreviewProvider / ParquetPreviewProvider 同口径：
 * 展示表/列清单与前 100 行。字节经 {@code authHeaders()} 拉取，
 * 顶层直取对象字节，包内走 {@code ?preview&inner=} 的 inner-raw 通道。</p>
 *
 * <p>SQLite 走 sql.js（WASM 同源 {@code ?url} + locateFile），
 * Parquet 走 hyparquet（纯 JS，直接传 ArrayBuffer）。
 * 任一环节失败都经 {@code fallback} 交回父组件切 iframe 服务端通道。</p>
 *
 * @author Buffy
 * @since 2026/10/07
 */
import { computed, onMounted, ref, watch } from "vue";
import { Download, Refresh } from "@element-plus/icons-vue";
import { parquetMetadataAsync, parquetReadObjects, parquetSchema } from "hyparquet";
import type { AsyncBuffer } from "hyparquet";
import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import { authHeaders, objectUrl, resolveObjectUrl } from "../api/filestorageApi";
import { extensionOf } from "../utils/officeRenderer";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key） */
  objectKey: string;
  /** 文件名（用于判定 sqlite / parquet） */
  fileName: string;
  /** 压缩包内条目路径，为空表示解析对象本身 */
  inner?: string;
}>();

const emit = defineEmits<{
  /** 前端解析失败，请求父组件切回 iframe 服务端通道 */
  fallback: [];
}>();

/** 在线预览体积上限（与后端 SQLite/Parquet 512MB 一致） */
const MAX_BYTES = 512 * 1024 * 1024;
/** 每表展示上限（与后端前 100 行一致） */
const MAX_ROWS = 100;

/** 是否加载中 */
const loading = ref(true);
/** 加载阶段文案 */
const phase = ref("读取文件…");
/** 错误信息 */
const errorMsg = ref("");
/** 文件字节数 */
const byteSize = ref(0);
/** 是否 SQLite（否则为 Parquet） */
const isSqlite = computed(() => ["sqlite", "sqlite3", "db"].includes(extensionOf(props.fileName)));

/** 表名清单 */
const tables = ref<string[]>([]);
/** 当前表 */
const activeTable = ref("");
/** 当前表的列名 */
const columns = ref<string[]>([]);
/** 当前表的前 N 行（每行按列顺序排成数组） */
const rows = ref<string[][]>([]);
/** 当前表总行数（SQLite 用 count(*) 实算，Parquet 用 footer 元数据） */
const totalRows = ref(0);
/** Parquet schema 描述（列名:类型） */
const schemaText = ref("");

/** 字节数可读化 */
function formatSize(bytes: number): string {
  if (!bytes || bytes < 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/** 单元格可读化（对象/数组转 JSON，超长截断） */
function cellText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.length > 200 ? `${v.slice(0, 200)}…` : v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  try {
    const s = JSON.stringify(v);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return String(v);
  }
}

/** 拉取文件字节（顶层直取，包内走 inner-raw 通道） */
async function fetchBytes(): Promise<ArrayBuffer> {
  const base = objectUrl(props.bucket, props.objectKey);
  const url = props.inner
    ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}`
    : base;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`读取文件失败：HTTP ${res.status}`);
  }
  return res.arrayBuffer();
}

/** 解析 SQLite：表清单 + 每表前 100 行 */
async function parseSqlite(buf: ArrayBuffer): Promise<void> {
  const SQL = await initSqlJs({ locateFile: (f: string) => (f.endsWith(".wasm") ? sqlWasmUrl : f) });
  const db = new SQL.Database(new Uint8Array(buf));
  try {
    const tableRes = db.exec(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name LIMIT 50",
    );
    const names: string[] = tableRes.length ? (tableRes[0].values.map((r) => String(r[0])) as string[]) : [];
    tables.value = names;
    if (!names.length) {
      columns.value = [];
      rows.value = [];
      totalRows.value = 0;
      return;
    }
    activeTable.value = names[0];
    await loadSqliteTable(db, names[0]);
  } finally {
    db.close();
  }
}

/** 切表时重新查询（db 句柄由调用方持有期间调用） */
async function loadSqliteTable(db: { exec: (sql: string) => { columns: string[]; values: unknown[][] }[] }, table: string): Promise<void> {
  const quoted = `"${table.replace(/"/g, '""')}"`;
  const countRes = db.exec(`SELECT COUNT(*) AS c FROM ${quoted}`);
  totalRows.value = countRes.length ? Number(countRes[0].values[0]?.[0] ?? 0) : 0;
  const dataRes = db.exec(`SELECT * FROM ${quoted} LIMIT ${MAX_ROWS}`);
  if (!dataRes.length) {
    columns.value = [];
    rows.value = [];
    return;
  }
  columns.value = dataRes[0].columns;
  rows.value = dataRes[0].values.map((r) => r.map((c) => cellText(c)));
}

/** 切换 SQLite 表（复用“全量读一次”的 db 太重，按需重开，100 行量级可接受） */
async function switchTable(table: string): Promise<void> {
  if (table === activeTable.value || loading.value) return;
  loading.value = true;
  errorMsg.value = "";
  try {
    const SQL = await initSqlJs({ locateFile: (f: string) => (f.endsWith(".wasm") ? sqlWasmUrl : f) });
    const buf = await fetchBytes();
    const db = new SQL.Database(new Uint8Array(buf));
    try {
      activeTable.value = table;
      await loadSqliteTable(db, table);
    } finally {
      db.close();
    }
  } catch (e) {
    errorMsg.value = (e as Error)?.message ?? "数据表读取失败";
  } finally {
    loading.value = false;
  }
}

/** 解析 Parquet：footer 读 schema + 前 100 行 */
async function parseParquet(buf: ArrayBuffer): Promise<void> {
  // hyparquet 接受 ArrayBuffer 作为 AsyncBuffer（slice 同步返回亦可）
  const file = buf as unknown as AsyncBuffer;
  const metadata = await parquetMetadataAsync(file);
  totalRows.value = Number(metadata.num_rows ?? 0);
  try {
    const schema = parquetSchema(metadata);
    const names = schema.children.map((e) => e.element.name);
    columns.value = names;
    schemaText.value = schema.children.map((c) => `${c.element.name}`).join(" · ");
  } catch {
    columns.value = [];
    schemaText.value = "";
  }
  const data = await parquetReadObjects({ file, rowStart: 0, rowEnd: MAX_ROWS });
  if (!data.length) {
    rows.value = [];
    if (!columns.value.length) columns.value = [];
    tables.value = [];
    return;
  }
  const cols = columns.value.length ? columns.value : Object.keys(data[0] ?? {});
  columns.value = cols;
  rows.value = data.map((r) => cols.map((c) => cellText((r as Record<string, unknown>)[c])));
  tables.value = [];
  activeTable.value = "";
}

/** 主流程 */
async function load(fallbackOnError = true): Promise<void> {
  loading.value = true;
  errorMsg.value = "";
  phase.value = "读取文件…";
  tables.value = [];
  columns.value = [];
  rows.value = [];
  totalRows.value = 0;
  schemaText.value = "";
  activeTable.value = "";
  byteSize.value = 0;
  try {
    const buf = await fetchBytes();
    byteSize.value = buf.byteLength;
    if (buf.byteLength > MAX_BYTES) {
      throw new Error(`文件过大（${formatSize(buf.byteLength)}），超过在线预览上限 ${formatSize(MAX_BYTES)}，请下载后用专业软件打开`);
    }
    phase.value = isSqlite.value ? "解析 SQLite…" : "解析 Parquet…";
    await new Promise((r) => setTimeout(r, 30));
    if (isSqlite.value) {
      await parseSqlite(buf);
    } else {
      await parseParquet(buf);
    }
  } catch (e) {
    const msg = (e as Error)?.message ?? "数据文件解析失败";
    // parquet 压缩编解码缺失（gzip/zstd 等）时 hyparquet 直接抛错，回 iframe 让 DuckDB 兜底
    if (fallbackOnError) {
      emit("fallback");
      return;
    }
    errorMsg.value = msg;
  } finally {
    loading.value = false;
  }
}

/** 下载本体 */
async function downloadSelf(): Promise<void> {
  const url = await resolveObjectUrl(props.bucket, props.objectKey, { params: { download: "true" } });
  window.open(url, "_blank");
}

onMounted(() => void load());
watch(() => [props.bucket, props.objectKey, props.inner, props.fileName], () => void load());
</script>

<template>
  <section class="data" aria-label="数据文件预览">
    <div class="data__stats">
      <div class="data__stat">
        <span class="data__stat-label">{{ isSqlite ? "数据表" : "总行数" }}</span>
        <b class="data__stat-value">{{ isSqlite ? tables.length : totalRows.toLocaleString("zh-CN") }}</b>
      </div>
      <div class="data__stat">
        <span class="data__stat-label">列数</span>
        <b class="data__stat-value">{{ columns.length || "—" }}</b>
      </div>
      <div class="data__stat">
        <span class="data__stat-label">大小</span>
        <b class="data__stat-value data__stat-value--accent">{{ formatSize(byteSize) }}</b>
      </div>
    </div>

    <div class="data__toolbar">
      <span class="data__hint">{{ isSqlite ? "SQLite · 前端直读" : "Parquet · 前端直读" }} · 最多展示前 {{ MAX_ROWS }} 行</span>
      <div class="data__spacer" />
      <el-button :icon="Refresh" :loading="loading" title="刷新" aria-label="刷新" @click="() => load(false)" />
      <el-button :icon="Download" title="下载原文件" @click="downloadSelf">下载</el-button>
    </div>

    <div v-if="loading" class="data__placeholder">
      <el-skeleton :rows="6" animated />
      <div class="data__phase">{{ phase }}</div>
    </div>
    <el-empty v-else-if="errorMsg" class="data__placeholder" :description="errorMsg">
      <el-button type="primary" :icon="Refresh" @click="() => load(false)">重试</el-button>
      <el-button :icon="Download" @click="downloadSelf">下载文件</el-button>
    </el-empty>
    <div v-else class="data__body">
      <aside v-if="isSqlite && tables.length > 1" class="data__tables" aria-label="数据表清单">
        <div class="data__tables-title">数据表（{{ tables.length }}）</div>
        <ul class="data__tables-list">
          <li v-for="t in tables" :key="t">
            <button type="button" class="data__table-row" :class="{ 'is-active': t === activeTable }" @click="() => switchTable(t)">
              {{ t }}
            </button>
          </li>
        </ul>
      </aside>
      <div class="data__content">
        <div v-if="schemaText" class="data__schema" :title="schemaText">{{ schemaText }}</div>
        <table v-if="columns.length" class="data__table">
          <thead>
            <tr>
              <th v-for="c in columns" :key="c">{{ c }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in rows" :key="i">
              <td v-for="(c, j) in columns" :key="`${i}-${j}`">{{ r[j] }}</td>
            </tr>
            <tr v-if="!rows.length">
              <td :colspan="columns.length" class="data__empty">该表暂无数据</td>
            </tr>
          </tbody>
        </table>
        <el-empty v-else description="未读取到表结构" :image-size="72" />
        <div v-if="totalRows > rows.length" class="data__more">共 {{ totalRows.toLocaleString("zh-CN") }} 行，仅展示前 {{ rows.length }} 行</div>
      </div>
    </div>

    <footer class="data__footer">
      <span>{{ fileName }}</span>
      <span>{{ isSqlite ? "sql.js 前端解析" : "hyparquet 前端解析" }}</span>
    </footer>
  </section>
</template>

<style scoped>
.data {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 72vh;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 8px);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  overflow: hidden;
}
.data__stats {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  background: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color-lighter);
  overflow-x: auto;
}
.data__stat {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 16px;
  white-space: nowrap;
}
.data__stat:first-child { padding-left: 0; }
.data__stat + .data__stat { border-left: 1px solid var(--el-border-color-lighter); }
.data__stat-label { font-size: 13px; color: var(--el-text-color-secondary); }
.data__stat-value { font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums; }
.data__stat-value--accent { color: var(--el-color-primary); }
.data__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.data__hint { font-size: 12px; color: var(--el-text-color-placeholder); }
.data__spacer { flex: 1; min-width: 0; }
.data__placeholder { flex: 1; padding: 20px; }
.data__phase { margin-top: 12px; font-size: 13px; color: var(--el-text-color-secondary); text-align: center; }
.data__body { flex: 1; display: flex; min-height: 0; }
.data__tables {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  padding: 8px;
  border-right: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color-page);
}
.data__tables-title { padding: 2px 6px 8px; font-size: 12px; font-weight: 600; color: var(--el-text-color-secondary); }
.data__tables-list { list-style: none; margin: 0; padding: 0; }
.data__table-row {
  display: block;
  width: 100%;
  padding: 7px 8px;
  border: none;
  border-radius: var(--el-radius-sm, 6px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data__table-row:hover { background: var(--el-fill-color-light); }
.data__table-row.is-active { background: var(--el-color-primary-light-9); color: var(--el-color-primary); font-weight: 500; }
.data__content { flex: 1; min-width: 0; overflow: auto; padding: 12px 16px; }
.data__schema {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.data__table { width: 100%; border-collapse: collapse; font-size: 13px; }
.data__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  padding: 8px 12px;
  text-align: left;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  white-space: nowrap;
}
.data__table td {
  padding: 7px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  color: var(--el-text-color-regular);
  white-space: nowrap;
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.data__empty { text-align: center; color: var(--el-text-color-placeholder); }
.data__more { margin-top: 8px; font-size: 12px; color: var(--el-text-color-placeholder); }
.data__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
