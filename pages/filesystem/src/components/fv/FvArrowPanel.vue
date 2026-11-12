<script setup lang="ts">
/**
 * Apache Arrow（IPC / Feather / Arrow 文件）检视面板。
 *
 * <p>{@code @file-viewer/renderer-data} 不收录 Arrow 格式（它只支持
 * psd / sqlite / parquet(hyrparquet) / avro / wasm / 字体 / AI / EPS /
 * webarchive），交给它会落到「暂无渲染器」。本面板改用
 * {@code apache-arrow} 的 {@code tableFromIPC} 在前端解析：读出 schema
 * （列名 + 类型 + 可空）与数据行，按表格展示。</p>
 *
 * <p>数据类型口径：Arrow 是列式内存格式，IPC 文件（.arrow / .feather /
 * .ipc）自带 schema 与字典编码；解析后 {@code table.getChildAt(i).get(r)}
 * 按列取原始值，{@code Date} / {@code BigInt} / {@code Uint8Array} 等
 * 特殊值由 {@link formatCell} 转成可读文本。</p>
 *
 * <p>渲染量约束：列式文件动辄百万行，全量铺进 DOM 会把页面拖死。默认只渲染
 * 前 {@link PAGE_SIZE} 行，其余通过分页按钮查看（解析是一次性的，翻页不重解码）。</p>
 *
 * @author CH
 * @since 2026/11/10
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { authHeaders, rawBytesUrl, resolveObjectUrl } from "../../api/filestorageApi";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀）；传 inner 时是压缩包自身的 Key */
  objectKey: string;
  /** 文件名（顶层对象名；包内条目时为压缩包名，展示与判型请用生效名） */
  fileName: string;
  /** 直接可取的字节地址（有则优先使用，不走票据签发） */
  src?: string;
  /** 压缩包内条目路径（空串表示对象本身） */
  inner?: string;
  /** 文件大小（字节），列表行传入 */
  size?: number;
}>();

const emit = defineEmits<{
  /** 解析并渲染完成 */
  rendered: [];
  /** 本面板无法渲染，父组件应退回服务端通道 */
  fallback: [];
  /** 加载或解析失败（msg 为中文可读文案） */
  error: [msg: string];
}>();

/** 在线检视体积上限：IPC 全量解码进内存，超大文件会把标签页拖死 */
const MAX_BYTES = 128 * 1024 * 1024;

/** 每页行数 */
const PAGE_SIZE = 50;

/** 加载中（取数 + 解析） */
const loading = ref(true);
/** 失败文案（空串表示无错） */
const failReason = ref("");
/** 生效文件名：包内条目取路径末段 */
const effectiveName = computed(() => {
  const p = props.inner;
  if (!p) {
    return props.fileName;
  }
  const slash = p.lastIndexOf("/");
  return slash >= 0 ? p.slice(slash + 1) : p;
});

/** 列定义（name + 类型 + 可空） */
interface ArrowColumn {
  name: string;
  type: string;
  nullable: boolean;
}

/** 解析结果：列定义 + 行数据（原始值，渲染时格式化） */
interface ArrowTable {
  columns: ArrowColumn[];
  rows: unknown[][];
  numRows: number;
  numCols: number;
  /** 解析耗时（ms） */
  parseMs: number;
}

const table = shallowRef<ArrowTable | null>(null);
/** 当前页（0 基） */
const page = ref(0);
/** 组件是否已卸载（拦截在途异步回调） */
let disposed = false;

/** 总页数 */
const pageCount = computed(() => {
  const t = table.value;
  if (!t || t.numRows <= 0) {
    return 1;
  }
  return Math.ceil(t.numRows / PAGE_SIZE);
});

/** 当前页的数据行 */
const pageRows = computed(() => {
  const t = table.value;
  if (!t) {
    return [];
  }
  const start = page.value * PAGE_SIZE;
  return t.rows.slice(start, start + PAGE_SIZE).map((row, i) => ({
    index: start + i + 1,
    cells: row,
  }));
});

/** 当前页区间文案 */
const pageRangeText = computed(() => {
  const t = table.value;
  if (!t || t.numRows === 0) {
    return "0 行";
  }
  const start = page.value * PAGE_SIZE + 1;
  const end = Math.min((page.value + 1) * PAGE_SIZE, t.numRows);
  return `${start}–${end} / ${t.numRows}`;
});

/**
 * 把 Arrow 单元格的原始值转成可读文本。
 *
 * @param v 原始值
 * @returns 展示文本
 */
function formatCell(v: unknown): string {
  if (v === null || v === undefined) {
    return "—";
  }
  if (typeof v === "bigint") {
    return v.toString();
  }
  if (v instanceof Date) {
    return Number.isNaN(v.getTime()) ? "Invalid Date" : v.toISOString();
  }
  if (v instanceof Uint8Array) {
    const n = Math.min(v.length, 24);
    let hex = "";
    for (let i = 0; i < n; i++) {
      hex += v[i].toString(16).padStart(2, "0");
    }
    return `0x${hex}${v.length > n ? `…（${v.length} 字节）` : ""}`;
  }
  if (Array.isArray(v)) {
    return JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x));
  }
  if (typeof v === "object") {
    const withJson = v as { toJSON?: () => unknown };
    if (typeof withJson.toJSON === "function") {
      try {
        return JSON.stringify(withJson.toJSON(), (_k, x) => (typeof x === "bigint" ? x.toString() : x));
      } catch {
        // 落到 String()
      }
    }
    return String(v);
  }
  return String(v);
}

/** 单元格是否为空值（渲染时给弱化样式） */
function isNullCell(v: unknown): boolean {
  return v === null || v === undefined;
}

/**
 * 取字节并解析 Arrow IPC。
 *
 * <p>取数口径与 {@code FvBinaryPanel} 一致：直传 {@code src} 优先，否则
 * {@code resolveObjectUrl} 签短时票据后 fetch（包内条目必须带
 * {@code preview=true&inner=}）。</p>
 */
async function load(): Promise<void> {
  loading.value = true;
  failReason.value = "";
  table.value = null;
  page.value = 0;
  try {
    let buf: ArrayBuffer;
    if (props.src) {
      // src 是父组件的「渲染预览地址」，本面板自己解码 IPC，必须要求原始字节
      const res = await fetch(rawBytesUrl(props.src), { headers: authHeaders() });
      if (!res.ok) {
        throw new Error(`读取文件失败（HTTP ${res.status}）`);
      }
      buf = await res.arrayBuffer();
    } else {
      const params: Record<string, string> = { raw: "true" };
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      const url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) {
        throw new Error("获取文件地址失败");
      }
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`读取文件失败（HTTP ${res.status}）`);
      }
      buf = await res.arrayBuffer();
    }
    if (disposed) {
      return;
    }
    if (buf.byteLength === 0) {
      throw new Error("文件内容为空");
    }
    if (buf.byteLength > MAX_BYTES) {
      throw new Error("文件过大（超过 128 MB），请下载后用本地工具查看");
    }
    const t0 = performance.now();
    // 懒加载：apache-arrow 约 180 KB，不预览 Arrow 文件的人不必付这份首屏成本
    const arrow = await import("apache-arrow");
    if (disposed) {
      return;
    }
    const parsed = arrow.tableFromIPC(new Uint8Array(buf));
    if (disposed) {
      return;
    }
    const columns: ArrowColumn[] = parsed.schema.fields.map((f) => ({
      name: f.name,
      type: String(f.type),
      nullable: f.nullable,
    }));
    const numRows = parsed.numRows;
    const numCols = columns.length;
    const rows: unknown[][] = [];
    for (let r = 0; r < numRows; r++) {
      const row: unknown[] = new Array(numCols);
      for (let c = 0; c < numCols; c++) {
        const vec = parsed.getChildAt(c);
        row[c] = vec ? vec.get(r) : null;
      }
      rows.push(row);
    }
    table.value = {
      columns,
      rows,
      numRows,
      numCols,
      parseMs: Math.round(performance.now() - t0),
    };
    emit("rendered");
  } catch (e) {
    if (disposed) {
      return;
    }
    console.warn("[FvArrowPanel] Arrow 解析失败", e);
    const msg = e instanceof Error && e.message
      ? `Arrow 文件解析失败：${e.message}`
      : "Arrow 文件解析失败，文件可能已损坏";
    failReason.value = msg;
    emit("error", msg);
    emit("fallback");
  } finally {
    if (!disposed) {
      loading.value = false;
    }
  }
}

/** 上一页 */
function prevPage(): void {
  if (page.value > 0) {
    page.value--;
  }
}

/** 下一页 */
function nextPage(): void {
  if (page.value < pageCount.value - 1) {
    page.value++;
  }
}

/** 跳到首页 / 末页 */
function firstPage(): void {
  page.value = 0;
}
function lastPage(): void {
  page.value = pageCount.value - 1;
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.src, props.fileName],
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
});
</script>

<template>
  <section class="fv-arrow" aria-label="Apache Arrow 文件检视">
    <div v-if="table" class="fv-arrow__bar">
      <span class="fv-arrow__meta">
        {{ table.numRows }} 行 × {{ table.numCols }} 列 · 解析 {{ table.parseMs }} ms
      </span>
      <span class="fv-arrow__range">{{ pageRangeText }}</span>
      <div class="fv-arrow__pager">
        <button type="button" class="fv-arrow__btn" :disabled="page === 0" @click="firstPage">首页</button>
        <button type="button" class="fv-arrow__btn" :disabled="page === 0" @click="prevPage">上一页</button>
        <button type="button" class="fv-arrow__btn" :disabled="page >= pageCount - 1" @click="nextPage">下一页</button>
        <button type="button" class="fv-arrow__btn" :disabled="page >= pageCount - 1" @click="lastPage">末页</button>
      </div>
    </div>
    <div v-if="loading" class="fv-arrow__mask">
      <span class="fv-arrow__mask-text">加载中…</span>
    </div>
    <div v-else-if="failReason" class="fv-arrow__mask">
      <span class="fv-arrow__mask-text">{{ failReason }}</span>
    </div>
    <div v-else-if="table" class="fv-arrow__body">
      <div class="fv-arrow__scroll">
        <table class="fv-arrow__table" data-testid="arrow-table">
          <thead>
            <tr>
              <th class="fv-arrow__idx">#</th>
              <th v-for="col in table.columns" :key="col.name">
                <span class="fv-arrow__col-name">{{ col.name }}</span>
                <span class="fv-arrow__col-type">{{ col.type }}{{ col.nullable ? "?" : "" }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in pageRows" :key="row.index">
              <td class="fv-arrow__idx">{{ row.index }}</td>
              <td
                v-for="(cell, ci) in row.cells"
                :key="ci"
                :class="{ 'fv-arrow__null': isNullCell(cell) }"
              >{{ formatCell(cell) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="table.numRows === 0" class="fv-arrow__empty">该文件只有 schema，没有数据行</div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fv-arrow {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.fv-arrow__bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 0 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #6e7781);
}
.fv-arrow__meta {
  white-space: nowrap;
}
.fv-arrow__range {
  margin-left: auto;
  white-space: nowrap;
}
.fv-arrow__pager {
  display: flex;
  gap: 4px;
}
.fv-arrow__btn {
  height: 24px;
  padding: 0 8px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background: var(--el-bg-color, #fff);
  color: var(--el-text-color-regular, #444c56);
  font-size: 12px;
  cursor: pointer;
}
.fv-arrow__btn:disabled {
  opacity: 0.45;
  cursor: default;
}
.fv-arrow__btn:not(:disabled):hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.fv-arrow__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  min-height: 0;
}
.fv-arrow__mask-text {
  color: var(--el-text-color-secondary, #6e7781);
  font-size: 13px;
}
.fv-arrow__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.fv-arrow__scroll {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: var(--el-radius-md, 8px);
}
.fv-arrow__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12.5px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}
.fv-arrow__table th,
.fv-arrow__table td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  text-align: left;
  vertical-align: top;
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-arrow__table thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--el-fill-color-light, #f5f7fa);
  color: var(--el-text-color-primary, #303133);
  font-weight: 600;
}
.fv-arrow__col-name {
  display: block;
}
.fv-arrow__col-type {
  display: block;
  margin-top: 2px;
  font-weight: 400;
  font-size: 11px;
  color: var(--el-text-color-secondary, #6e7781);
}
.fv-arrow__idx {
  width: 1%;
  white-space: nowrap;
  color: var(--el-text-color-secondary, #6e7781);
  text-align: right;
  background: var(--el-fill-color-lighter, #fafafa);
}
.fv-arrow__null {
  color: var(--el-text-color-placeholder, #a8abb2);
}
.fv-arrow__empty {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary, #6e7781);
}
</style>
