<!--
  /**
   * 虚拟桌面 · 文件窗口
   *
   * <p>数据面全部走既有 SFTP 接口（list / read / write / mkdir / rename / delete /
   * upload / download），不拼任何远端 shell 命令：文件名的空格、引号、通配符都不需要
   * 转义，Windows 主机也照样能用。</p>
   *
   * <p>三种布局各有用处，不是换个皮：</p>
   * <ul>
   *   <li>{@code icon}：大图标网格，适合图片 / 少量目录快速浏览；</li>
   *   <li>{@code list}：紧凑单行，适合文件很多的目录；</li>
   *   <li>{@code detail}：多列明细 + 右侧信息栏，适合按大小 / 类型核对。</li>
   * </ul>
   *
   * <p>读文件默认只读：{@code .log}、配置、脚本可以就地看，点「编辑」才允许保存，
   * 避免在桌面上误触把远端配置写坏。</p>
   */
  -->
<template>
  <div class="df" tabindex="0" @contextmenu.stop.prevent="openCtx($event, null)" @keydown="onKey">
    <!-- 工具条：导航 / 面包屑 / 筛选 / 新建 / 上传 / 布局 / 排序 -->
    <div class="df__bar">
      <button type="button" class="df__btn" title="后退" :disabled="!canBack" @click="back">
        <ReIcon name="ArrowLeft" :size="12" />
      </button>
      <button type="button" class="df__btn" title="前进" :disabled="!canForward" @click="forward">
        <ReIcon name="ArrowRight" :size="12" />
      </button>
      <button type="button" class="df__btn" title="上级目录" :disabled="!current" @click="enterParent">
        <ReIcon name="ArrowUp" :size="12" />
      </button>
      <button type="button" class="df__btn" title="刷新" :disabled="loading" @click="reload">
        <ReIcon name="RefreshRight" :size="12" />
      </button>

      <div class="df__crumbs" :title="current || '/'">
        <button
          v-for="(c, i) in crumbs"
          :key="c.path + i"
          type="button"
          class="df__crumb"
          :class="{ 'is-last': i === crumbs.length - 1 }"
          @click="go(c.path)"
        >
          {{ c.label }}
        </button>
      </div>

      <label class="df__search" title="只筛选当前目录，不递归">
        <ReIcon name="Search" :size="12" />
        <input v-model="query" type="text" placeholder="筛选" spellcheck="false" @keydown.stop @keydown.esc="query = ''" />
      </label>

      <button type="button" class="df__btn" title="新建文件夹" :disabled="busy" @click="mkdir">
        <ReIcon name="FolderAdd" :size="12" />
      </button>
      <button type="button" class="df__btn" title="上传到当前目录" :disabled="busy" @click="pickUpload">
        <ReIcon name="Upload" :size="12" />
      </button>

      <div class="df__seg" role="group" aria-label="布局">
        <button
          v-for="l in LAYOUTS"
          :key="l.key"
          type="button"
          class="df__seg-btn"
          :class="{ 'is-on': layout === l.key }"
          :title="l.label"
          @click="setLayout(l.key)"
        >
          <ReIcon :name="l.icon" :size="12" />
        </button>
      </div>

      <div class="df__sort">
        <button type="button" class="df__btn" :title="`排序：${sortLabel}`" @click.stop="sortOpen = !sortOpen">
          <ReIcon name="Sort" :size="12" />
          <span class="df__sort-text">{{ sortLabel }}</span>
        </button>
        <div v-if="sortOpen" class="df__pop" @pointerdown.stop>
          <button
            v-for="s in SORTS"
            :key="s.key"
            type="button"
            class="df__pop-item"
            :class="{ 'is-on': sortKey === s.key }"
            @click="setSort(s.key)"
          >
            <ReIcon :name="s.icon" :size="12" /><span>{{ s.label }}</span>
            <em v-if="sortKey === s.key">{{ sortAsc ? "升序" : "降序" }}</em>
          </button>
          <div class="df__pop-sep" />
          <button type="button" class="df__pop-item" @click="sortAsc = !sortAsc">
            <ReIcon name="Switch" :size="12" /><span>{{ sortAsc ? "改为降序" : "改为升序" }}</span>
          </button>
        </div>
        <div v-if="sortOpen" class="df__pop-mask" @pointerdown="sortOpen = false" />
      </div>

      <button type="button" class="df__btn" :title="showHidden ? '隐藏以点开头的条目' : '显示隐藏条目'" @click="toggleHidden">
        <ReIcon :name="showHidden ? 'View' : 'Hide'" :size="12" />
      </button>
    </div>

    <div v-if="error" class="df__error">
      <ReIcon name="WarningFilled" :size="13" />
      <span>{{ error }}</span>
      <button type="button" class="df__err-retry" @click="reload">重试</button>
    </div>

    <div class="df__body">
      <div class="df__main" :class="`is-${layout}`">
        <div v-if="loading" class="df__empty">正在读取目录…</div>
        <div v-else-if="!view.length" class="df__empty">
          {{ query ? "没有匹配的条目" : "目录为空" }}
        </div>

        <!-- 图标网格 -->
        <div v-else-if="layout === 'icon'" class="df__grid">
          <button
            v-for="(e, i) in view"
            :key="e.path"
            type="button"
            class="df__tile"
            :class="{ 'is-dir': e.directory, 'is-on': isSel(e.path) }"
            :title="`${e.name}\n${e.path}`"
            @click="pick(e, i, $event)"
            @dblclick="enter(e)"
            @contextmenu.stop.prevent="openCtx($event, e)"
          >
            <ReIcon :name="iconOf(e)" :size="34" class="df__tile-ico" />
            <span class="df__tile-name">{{ e.name }}</span>
            <span class="df__tile-meta">{{ e.directory ? "文件夹" : sizeText(e.size) }}</span>
          </button>
        </div>

        <!-- 紧凑列表 -->
        <div v-else-if="layout === 'list'" class="df__list">
          <button
            v-for="(e, i) in view"
            :key="e.path"
            type="button"
            class="df__row"
            :class="{ 'is-dir': e.directory, 'is-on': isSel(e.path) }"
            :title="e.path"
            @click="pick(e, i, $event)"
            @dblclick="enter(e)"
            @contextmenu.stop.prevent="openCtx($event, e)"
          >
            <span class="df__c-name">
              <ReIcon :name="iconOf(e)" :size="13" class="df__ico" />
              <span class="df__name">{{ e.name }}</span>
              <em v-if="showHidden && e.name.startsWith('.')" class="df__badge">隐藏</em>
            </span>
            <span class="df__c-size">{{ e.directory ? "—" : sizeText(e.size) }}</span>
          </button>
        </div>

        <!-- 明细：多列 + 可点表头排序 -->
        <div v-else class="df__table">
          <div class="df__thead">
            <span class="df__th is-name" @click="setSort('name')">
              名称<ReIcon v-if="sortKey === 'name'" :name="sortAsc ? 'SortUp' : 'SortDown'" :size="11" />
            </span>
            <span class="df__th is-type" @click="setSort('type')">
              类型<ReIcon v-if="sortKey === 'type'" :name="sortAsc ? 'SortUp' : 'SortDown'" :size="11" />
            </span>
            <span class="df__th is-size" @click="setSort('size')">
              大小<ReIcon v-if="sortKey === 'size'" :name="sortAsc ? 'SortUp' : 'SortDown'" :size="11" />
            </span>
          </div>
          <div class="df__tbody">
            <button
              v-for="(e, i) in view"
              :key="e.path"
              type="button"
              class="df__row is-detail"
              :class="{ 'is-dir': e.directory, 'is-on': isSel(e.path) }"
              :title="e.path"
              @click="pick(e, i, $event)"
              @dblclick="enter(e)"
              @contextmenu.stop.prevent="openCtx($event, e)"
            >
              <span class="df__c-name">
                <ReIcon :name="iconOf(e)" :size="13" class="df__ico" />
                <span class="df__name">{{ e.name }}</span>
              </span>
              <span class="df__c-type">{{ typeOf(e) }}</span>
              <span class="df__c-size">{{ e.directory ? "—" : sizeText(e.size) }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 明细布局的右侧信息栏 -->
      <aside v-if="layout === 'detail'" class="df__side">
        <template v-if="selectedEntry">
          <ReIcon :name="iconOf(selectedEntry)" :size="30" class="df__side-ico" />
          <b class="df__side-name" :title="selectedEntry.name">{{ selectedEntry.name }}</b>
          <span class="df__side-path" :title="selectedEntry.path">{{ selectedEntry.path }}</span>
          <div class="df__side-row"><span>类型</span><em>{{ typeOf(selectedEntry) }}</em></div>
          <div class="df__side-row"><span>大小</span><em>{{ selectedEntry.directory ? "—" : sizeText(selectedEntry.size) }}</em></div>
          <div class="df__side-acts">
            <button v-if="!selectedEntry.directory" type="button" class="df__btn is-primary" @click="previewFile(selectedEntry)">
              <ReIcon name="View" :size="12" /><span>预览</span>
            </button>
            <button type="button" class="df__btn" @click="download(selectedEntry)">
              <ReIcon name="Download" :size="12" /><span>下载</span>
            </button>
          </div>
        </template>
        <span v-else class="df__side-hint">选中一个条目查看详情</span>
      </aside>
    </div>

    <div class="df__foot">
      <span class="df__sel" :title="selectedEntry?.path">
        {{ selectionText }}
      </span>
      <span class="df__spacer" />
      <span class="df__total">{{ view.length }} 项 · {{ totalText }}</span>
      <button
        v-if="selected.length === 1 && selectedEntry && !selectedEntry.directory"
        type="button"
        class="df__btn"
        @click="download(selectedEntry)"
      >
        <ReIcon name="Download" :size="12" /><span>下载</span>
      </button>
      <button v-if="selected.length === 1" type="button" class="df__btn" :disabled="busy" @click="rename">
        <ReIcon name="EditPen" :size="12" /><span>重命名</span>
      </button>
      <button v-if="selected.length" type="button" class="df__btn is-danger" :disabled="busy" @click="removeSelected">
        <ReIcon name="Delete" :size="12" /><span>删除</span>
      </button>
    </div>

    <!-- 文本预览 / 只读编辑 -->
    <div v-if="pv.open" class="df__pv">
      <div class="df__pv-bar">
        <ReIcon :name="pv.editing ? 'EditPen' : 'Document'" :size="12" />
        <span class="df__pv-name" :title="pv.path">{{ pv.name }}</span>
        <em v-if="pv.truncated" class="df__pv-trunc">文件过大，只显示前一段</em>
        <span class="df__spacer" />
        <button type="button" class="df__btn" :disabled="pv.saving" @click="toggleEdit">
          {{ pv.editing ? "取消编辑" : "编辑" }}
        </button>
        <button v-if="pv.editing" type="button" class="df__btn is-primary" :disabled="pv.saving" @click="savePreview">
          {{ pv.saving ? "保存中…" : "保存" }}
        </button>
        <button type="button" class="df__btn" title="关闭" @click="closePreview">
          <ReIcon name="Close" :size="12" />
        </button>
      </div>
      <div v-if="pv.error" class="df__error">{{ pv.error }}</div>
      <textarea
        v-else
        v-model="pv.draft"
        class="df__pv-text"
        spellcheck="false"
        :readonly="!pv.editing"
        :class="{ 'is-readonly': !pv.editing }"
      />
    </div>

    <!-- 行右键菜单（接管浏览器原生菜单） -->
    <Teleport to="body">
      <div
        v-if="ctx.open"
        class="dctx-mask"
        @pointerdown="closeCtx"
        @contextmenu.prevent="closeCtx"
      />
      <div
        v-if="ctx.open"
        class="dctx"
        :style="{ left: `${ctx.x}px`, top: `${ctx.y}px` }"
        role="menu"
        @contextmenu.prevent
      >
        <div class="dctx__head">
          <b>{{ ctx.entry ? ctx.entry.name : current || "/" }}</b>
          <span v-if="ctx.entry" class="mono">{{ ctx.entry.path }}</span>
        </div>
        <template v-if="ctx.entry">
          <button type="button" class="dctx__item" @click="ctxEnter">
            <ReIcon :name="ctx.entry.directory ? 'FolderOpened' : 'Document'" :size="13" />
            <span>{{ ctx.entry.directory ? "打开文件夹" : "打开 / 下载" }}</span>
          </button>
          <button v-if="!ctx.entry.directory" type="button" class="dctx__item" @click="ctxPreview">
            <ReIcon name="View" :size="13" /><span>预览文本</span>
          </button>
          <button type="button" class="dctx__item" @click="ctxRename">
            <ReIcon name="EditPen" :size="13" /><span>重命名</span>
          </button>
          <button type="button" class="dctx__item" @click="ctxCopy">
            <ReIcon name="CopyDocument" :size="13" /><span>复制完整路径</span>
          </button>
          <div class="dctx__sep" />
          <button type="button" class="dctx__item is-danger" @click="ctxDelete">
            <ReIcon name="Delete" :size="13" /><span>删除</span>
          </button>
        </template>
        <template v-else>
          <button type="button" class="dctx__item" @click="ctxMkdir">
            <ReIcon name="FolderAdd" :size="13" /><span>新建文件夹</span>
          </button>
          <button type="button" class="dctx__item" @click="ctxUpload">
            <ReIcon name="Upload" :size="13" /><span>上传到此处</span>
          </button>
          <div class="dctx__sep" />
          <button type="button" class="dctx__item" @click="ctxRefresh">
            <ReIcon name="RefreshRight" :size="13" /><span>刷新</span>
          </button>
        </template>
      </div>
    </Teleport>

    <input ref="uploadRef" class="df__file" type="file" multiple @change="onPicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { sftpDelete, sftpList, sftpMkdir, sftpReadContent, sftpRename, sftpUpload, sftpWriteContent, sftpDownloadUrl } from "../../../api";

interface FsEntry {
  name: string;
  path: string;
  directory: boolean;
  file: boolean;
  size?: number | null;
}

/** 布局定义 */
type LayoutKey = "icon" | "list" | "detail";
const LAYOUTS: Array<{ key: LayoutKey; label: string; icon: string }> = [
  { key: "icon", label: "图标布局", icon: "Grid" },
  { key: "list", label: "列表布局", icon: "List" },
  { key: "detail", label: "明细布局", icon: "Tickets" },
];

/** 排序定义 */
type SortKey = "name" | "type" | "size";
const SORTS: Array<{ key: SortKey; label: string; icon: string }> = [
  { key: "name", label: "按名称", icon: "Sort" },
  { key: "type", label: "按类型", icon: "Files" },
  { key: "size", label: "按大小", icon: "Coin" },
];

/** 允许就地预览 / 编辑的文本扩展名（二进制文件读出来只会是乱码） */
const TEXT_EXT = new Set([
  "txt", "log", "md", "json", "xml", "yml", "yaml", "ini", "conf", "cfg", "properties",
  "sh", "bash", "bat", "cmd", "ps1", "py", "js", "mjs", "cjs", "ts", "java", "kt", "go", "rs",
  "c", "h", "cpp", "hpp", "css", "scss", "less", "html", "htm", "vue", "sql", "csv", "tsv",
  "env", "gitignore", "dockerfile", "makefile", "gradle", "toml", "lock", "service",
]);

const props = defineProps<{
  /** 主机标识 */
  hostId: number;
  /** 窗口是否激活（父级透传） */
  active?: boolean;
}>();

/** 布局与排序偏好记在浏览器里：同一台机器下次打开还是上次的版式 */
const LS_LAYOUT = "vdesk.files.layout";
const LS_SORT = "vdesk.files.sort";
const LS_DIR = "vdesk.files.sortAsc";
const LS_HIDDEN = "vdesk.files.hidden";

const current = ref("");
const entries = ref<FsEntry[]>([]);
const loading = ref(false);
const busy = ref(false);
const error = ref("");
const selected = ref<string[]>([]);
/** 范围选择锚点（上一次单选的下标） */
const anchor = ref(-1);
const query = ref("");
const layout = ref<LayoutKey>(readPref<LayoutKey>(LS_LAYOUT, "list", ["icon", "list", "detail"]));
const sortKey = ref<SortKey>(readPref<SortKey>(LS_SORT, "name", ["name", "type", "size"]));
const sortAsc = ref(readPref(LS_DIR, true, [true, false]));
const showHidden = ref(readPref(LS_HIDDEN, false, [true, false]));
const sortOpen = ref(false);
const uploadRef = ref<HTMLInputElement | null>(null);

/** 浏览历史：后退 / 前进 */
const stack = ref<string[]>([""]);
const cursor = ref(0);
const canBack = computed(() => cursor.value > 0);
const canForward = computed(() => cursor.value < stack.value.length - 1);

/** 文本预览状态 */
const pv = ref({
  open: false,
  path: "",
  name: "",
  draft: "",
  original: "",
  truncated: false,
  editing: false,
  saving: false,
  error: "",
});

/** 右键菜单状态 */
const ctx = ref<{ open: boolean; x: number; y: number; entry: FsEntry | null }>({
  open: false,
  x: 0,
  y: 0,
  entry: null,
});

/**
 * 读本地偏好。
 *
 * @param key 键
 * @param fallback 默认值
 * @param allowed 允许值
 */
function readPref<T>(key: string, fallback: T, allowed: T[]): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const val = JSON.parse(raw) as T;
    return allowed.includes(val) ? val : fallback;
  } catch {
    return fallback;
  }
}

/**
 * 写本地偏好。
 *
 * @param key 键
 * @param val 值
 */
function writePref(key: string, val: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    /* 隐私模式下写不进去，不影响使用 */
  }
}

const selectedEntry = computed(() => entries.value.find((e) => e.path === selected.value[0]) ?? null);
const sortLabel = computed(() => SORTS.find((s) => s.key === sortKey.value)?.label.slice(1) ?? "名称");

/** 面包屑：根 + 逐级路径（Windows 反斜杠也拆得开） */
const crumbs = computed<Array<{ label: string; path: string }>>(() => {
  const p = current.value;
  if (!p) return [{ label: "/", path: "" }];
  const lead = /^[\\/]/.test(p) ? "/" : "";
  const segs = p.split(/[\\/]+/).filter(Boolean);
  const out: Array<{ label: string; path: string }> = [{ label: lead ? "/" : segs[0] || "/", path: "" }];
  segs.forEach((s, i) => {
    out.push({ label: s, path: `${lead}${segs.slice(0, i + 1).join("/")}` });
  });
  return out;
});

/** 当前目录里的可见条目（筛选 + 排序，目录始终在前） */
const view = computed<FsEntry[]>(() => {
  const q = query.value.trim().toLowerCase();
  const rows = entries.value.filter(
    (e) => (showHidden.value || !e.name.startsWith(".")) && (!q || e.name.toLowerCase().includes(q)),
  );
  const dir = sortAsc.value ? 1 : -1;
  return [...rows].sort((a, b) => {
    if (a.directory !== b.directory) return a.directory ? -1 : 1;
    let r = 0;
    if (sortKey.value === "size") r = (a.size ?? 0) - (b.size ?? 0);
    else if (sortKey.value === "type") r = typeOf(a).localeCompare(typeOf(b), "zh-CN");
    else r = a.name.localeCompare(b.name, "zh-CN");
    return r * dir;
  });
});

/** 底栏选中摘要 */
const selectionText = computed(() => {
  if (!selected.value.length) return "单击选中，双击打开 / 下载";
  if (selected.value.length === 1) return selectedEntry.value?.name ?? "";
  return `已选中 ${selected.value.length} 项`;
});

/** 当前目录条目总大小 */
const totalText = computed(() => {
  const sum = view.value.reduce((acc, e) => acc + (e.directory ? 0 : Number(e.size ?? 0)), 0);
  return sizeText(sum);
});

/**
 * 加载目录并维护浏览历史。
 *
 * @param path 目标目录（空串 = 后端默认根）
 * @param mode push 记入历史 / replace 替换当前 / none 只读历史位置
 */
async function load(path: string, mode: "push" | "replace" | "none" = "push"): Promise<void> {
  loading.value = true;
  error.value = "";
  try {
    const list = await sftpList(props.hostId, path);
    entries.value = (list ?? []) as FsEntry[];
    current.value = path;
    selected.value = [];
    anchor.value = -1;
    closeCtx();
    closePreview();
    if (mode === "push") {
      stack.value = [...stack.value.slice(0, cursor.value + 1), path];
      cursor.value = stack.value.length - 1;
    } else if (mode === "replace") {
      stack.value = [...stack.value.slice(0, cursor.value), path];
      cursor.value = stack.value.length - 1;
    }
  } catch (e) {
    entries.value = [];
    error.value = `目录读取失败：${String((e as Error)?.message ?? e)}`;
  } finally {
    loading.value = false;
  }
}

/**
 * 进入目录（目录进入，文件打开）。
 *
 * @param path 目标目录
 */
function go(path: string): void {
  void load(path, "push");
}

/** 后退 */
function back(): void {
  if (!canBack.value) return;
  cursor.value -= 1;
  void load(stack.value[cursor.value], "none");
}

/** 前进 */
function forward(): void {
  if (!canForward.value) return;
  cursor.value += 1;
  void load(stack.value[cursor.value], "none");
}

/** 原地刷新：保留当前位置与选中项 */
async function reload(): Promise<void> {
  const keep = [...selected.value];
  await load(current.value, "none");
  selected.value = keep.filter((p) => entries.value.some((e) => e.path === p));
}

/**
 * 双击条目：目录进入，文件下载或预览。
 *
 * @param e 条目
 */
function enter(e: FsEntry): void {
  if (e.directory) {
    go(e.path);
    return;
  }
  if (isText(e)) {
    void previewFile(e);
    return;
  }
  download(e);
}

/**
 * 单击选择：Ctrl / Cmd 追加，Shift 范围，普通单击单选。
 *
 * @param e 条目
 * @param i 在可视列表里的下标
 * @param ev 鼠标事件
 */
function pick(e: FsEntry, i: number, ev: MouseEvent): void {
  if (ev.ctrlKey || ev.metaKey) {
    selected.value = isSel(e.path) ? selected.value.filter((p) => p !== e.path) : [...selected.value, e.path];
    anchor.value = i;
    return;
  }
  if (ev.shiftKey && anchor.value >= 0) {
    const [a, b] = [Math.min(anchor.value, i), Math.max(anchor.value, i)];
    selected.value = view.value.slice(a, b + 1).map((x) => x.path);
    return;
  }
  selected.value = [e.path];
  anchor.value = i;
}

/**
 * 是否已选中。
 *
 * @param path 路径
 */
function isSel(path: string): boolean {
  return selected.value.includes(path);
}

/** 上级目录 */
function enterParent(): void {
  const s = current.value.replace(/[\\/]+$/, "");
  const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
  if (i < 0) return;
  go(i <= 0 ? (s.startsWith("/") || s.startsWith("\\") ? "/" : "") : s.slice(0, i));
}

/**
 * 切换布局并记住。
 *
 * @param key 布局
 */
function setLayout(key: LayoutKey): void {
  layout.value = key;
  writePref(LS_LAYOUT, key);
}

/**
 * 切换排序字段：点同一字段翻转方向。
 *
 * @param key 排序字段
 */
function setSort(key: SortKey): void {
  if (sortKey.value === key) sortAsc.value = !sortAsc.value;
  else {
    sortKey.value = key;
    sortAsc.value = key !== "size";
  }
  writePref(LS_SORT, sortKey.value);
  writePref(LS_DIR, sortAsc.value);
  sortOpen.value = false;
}

/** 切换隐藏条目 */
function toggleHidden(): void {
  showHidden.value = !showHidden.value;
  writePref(LS_HIDDEN, showHidden.value);
}

/**
 * 新建文件夹（在当前目录下）。
 */
async function mkdir(): Promise<void> {
  try {
    const { value } = await ElMessageBox.prompt("文件夹名称", "新建文件夹", {
      inputValue: "新建文件夹",
      inputPattern: /^[^\\/:*?"<>|]+$/,
      inputErrorMessage: "名称不能包含路径分隔符或非法字符",
      confirmButtonText: "创建",
      cancelButtonText: "取消",
    });
    const name = String(value ?? "").trim();
    if (!name) return;
    busy.value = true;
    await sftpMkdir(props.hostId, join(current.value, name));
    ElMessage.success(`已创建 ${name}`);
    await reload();
  } catch (e) {
    if (isCancel(e)) return;
    ElMessage.error(`新建失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    busy.value = false;
  }
}

/**
 * 重命名选中项。
 */
async function rename(): Promise<void> {
  const e = selectedEntry.value;
  if (!e) return;
  try {
    const { value } = await ElMessageBox.prompt("新的名称", `重命名 ${e.name}`, {
      inputValue: e.name,
      inputPattern: /^[^\\/:*?"<>|]+$/,
      inputErrorMessage: "名称不能包含路径分隔符或非法字符",
      confirmButtonText: "重命名",
      cancelButtonText: "取消",
    });
    const name = String(value ?? "").trim();
    if (!name || name === e.name) return;
    busy.value = true;
    await sftpRename(props.hostId, e.path, join(current.value, name));
    ElMessage.success("已重命名");
    await reload();
  } catch (err) {
    if (isCancel(err)) return;
    ElMessage.error(`重命名失败：${String((err as Error)?.message ?? err)}`);
  } finally {
    busy.value = false;
  }
}

/**
 * 删除所有选中项（目录递归删除，先确认）。
 */
async function removeSelected(): Promise<void> {
  if (!selected.value.length) return;
  const rows = entries.value.filter((e) => selected.value.includes(e.path));
  if (!rows.length) return;
  try {
    await ElMessageBox.confirm(
      `将删除 ${rows.length} 项${rows.some((r) => r.directory) ? "（文件夹连同里面的内容）" : ""}，不可恢复。`,
      "确认删除",
      { type: "warning", confirmButtonText: "删除", cancelButtonText: "取消", confirmButtonClass: "el-button--danger" },
    );
  } catch (e) {
    if (isCancel(e)) return;
    return;
  }
  busy.value = true;
  let failed = 0;
  for (const r of rows) {
    try {
      await sftpDelete(props.hostId, r.path, r.directory);
    } catch {
      failed += 1;
    }
  }
  busy.value = false;
  if (failed) ElMessage.error(`${failed} 项删除失败`);
  else ElMessage.success(`已删除 ${rows.length} 项`);
  await reload();
}

/**
 * 下载单个条目。
 *
 * @param e 条目
 */
function download(e: FsEntry): void {
  window.open(sftpDownloadUrl(props.hostId, e.path), "_blank");
}

/** 打开系统文件选择框 */
function pickUpload(): void {
  uploadRef.value?.click();
}

/**
 * 上传选中的本地文件到当前目录。
 *
 * @param ev change 事件
 */
async function onPicked(ev: Event): Promise<void> {
  const input = ev.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;
  busy.value = true;
  let ok = 0;
  for (const f of files) {
    try {
      await sftpUpload(props.hostId, current.value || "", f);
      ok += 1;
    } catch (e) {
      ElMessage.error(`${f.name} 上传失败：${String((e as Error)?.message ?? e)}`);
    }
  }
  busy.value = false;
  if (ok) ElMessage.success(`已上传 ${ok} 个文件`);
  await reload();
}

/**
 * 打开文本预览（大文件由后端截断）。
 *
 * @param e 条目
 */
async function previewFile(e: FsEntry): Promise<void> {
  if (!isText(e)) {
    download(e);
    return;
  }
  pv.value = { open: true, path: e.path, name: e.name, draft: "", original: "", truncated: false, editing: false, saving: false, error: "" };
  try {
    const r = await sftpReadContent(props.hostId, e.path);
    const text = r?.content ?? "";
    pv.value.draft = text;
    pv.value.original = text;
    pv.value.truncated = Boolean(r?.truncated);
  } catch (err) {
    pv.value.error = `读取失败：${String((err as Error)?.message ?? err)}`;
  }
}

/** 切换预览的只读 / 编辑 */
function toggleEdit(): void {
  if (pv.value.editing) pv.value.draft = pv.value.original;
  pv.value.editing = !pv.value.editing;
}

/** 保存预览里的改动 */
async function savePreview(): Promise<void> {
  if (!pv.value.open || !pv.value.editing) return;
  pv.value.saving = true;
  try {
    await sftpWriteContent(props.hostId, pv.value.path, pv.value.draft);
    pv.value.original = pv.value.draft;
    pv.value.editing = false;
    ElMessage.success("已保存");
    await reload();
  } catch (e) {
    ElMessage.error(`保存失败：${String((e as Error)?.message ?? e)}`);
  } finally {
    pv.value.saving = false;
  }
}

/** 关闭预览 */
function closePreview(): void {
  pv.value.open = false;
  pv.value.error = "";
}

/**
 * 打开右键菜单。
 *
 * @param ev 鼠标事件
 * @param entry 命中的条目；空表示空白处
 */
function openCtx(ev: MouseEvent, entry: FsEntry | null): void {
  if (entry) selected.value = [entry.path];
  const W = 210;
  const H = entry ? 210 : 160;
  ctx.value = {
    open: true,
    entry,
    x: Math.max(8, Math.min(ev.clientX, window.innerWidth - W - 8)),
    y: Math.max(8, Math.min(ev.clientY, window.innerHeight - H - 8)),
  };
}

/** 关闭右键菜单 */
function closeCtx(): void {
  ctx.value.open = false;
  ctx.value.entry = null;
}

/** 右键 → 打开 */
function ctxEnter(): void {
  const e = ctx.value.entry;
  closeCtx();
  if (e) enter(e);
}

/** 右键 → 预览 */
function ctxPreview(): void {
  const e = ctx.value.entry;
  closeCtx();
  if (e) void previewFile(e);
}

/** 右键 → 重命名 */
function ctxRename(): void {
  const e = ctx.value.entry;
  closeCtx();
  if (e) {
    selected.value = [e.path];
    void rename();
  }
}

/** 右键 → 复制完整路径 */
async function ctxCopy(): Promise<void> {
  const e = ctx.value.entry;
  closeCtx();
  if (!e) return;
  try {
    await navigator.clipboard.writeText(e.path);
    ElMessage.success("路径已复制");
  } catch {
    ElMessage.warning("浏览器拒绝写剪贴板");
  }
}

/** 右键 → 删除 */
function ctxDelete(): void {
  const e = ctx.value.entry;
  closeCtx();
  if (!e) return;
  selected.value = [e.path];
  void removeSelected();
}

/** 右键 → 新建文件夹 */
function ctxMkdir(): void {
  closeCtx();
  void mkdir();
}

/** 右键 → 上传 */
function ctxUpload(): void {
  closeCtx();
  pickUpload();
}

/** 右键 → 刷新 */
function ctxRefresh(): void {
  closeCtx();
  void reload();
}

/**
 * 键盘：Enter 打开、Backspace 上级、Delete 删除、F2 重命名、Ctrl+A 全选。
 *
 * @param ev 键盘事件
 */
function onKey(ev: KeyboardEvent): void {
  const tag = (ev.target as HTMLElement | null)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (ev.key === "Enter" && selectedEntry.value) enter(selectedEntry.value);
  else if (ev.key === "Backspace") enterParent();
  else if (ev.key === "Delete") void removeSelected();
  else if (ev.key === "F2") void rename();
  else if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === "a") {
    ev.preventDefault();
    selected.value = view.value.map((e) => e.path);
  }
}

/**
 * 条目图标：目录 / 图片 / 压缩包 / 音视频 / 文档。
 *
 * @param e 条目
 */
function iconOf(e: FsEntry): string {
  if (e.directory) return "FolderOpened";
  const ext = extOf(e.name);
  if (["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "ico"].includes(ext)) return "Picture";
  if (["zip", "gz", "tar", "rar", "7z", "xz", "bz2"].includes(ext)) return "Box";
  if (["mp4", "mkv", "avi", "mov", "webm"].includes(ext)) return "Film";
  if (["mp3", "wav", "flac", "ogg", "m4a"].includes(ext)) return "Headset";
  if (TEXT_EXT.has(ext)) return "Document";
  return "Files";
}

/**
 * 条目类型文案。
 *
 * @param e 条目
 */
function typeOf(e: FsEntry): string {
  if (e.directory) return "文件夹";
  const ext = extOf(e.name);
  return ext ? `${ext.toUpperCase()} 文件` : "文件";
}

/**
 * 扩展名（小写，无点）。
 *
 * @param name 文件名
 */
function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i > 0 ? name.slice(i + 1).toLowerCase() : "";
}

/**
 * 是否可按文本预览。
 *
 * @param e 条目
 */
function isText(e: FsEntry): boolean {
  return !e.directory && TEXT_EXT.has(extOf(e.name));
}

/**
 * 拼接远端路径（统一用 /，与后端 SFTP 一致）。
 *
 * @param parent 父目录
 * @param name 名称
 */
function join(parent: string, name: string): string {
  const base = parent.replace(/[\\/]+$/, "");
  return base ? `${base}/${name}` : `/${name}`;
}

/**
 * 字节数转可读大小。
 *
 * @param size 字节数
 */
function sizeText(size?: number | null): string {
  if (size == null) return "—";
  if (size < 1024) return `${size} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let v = size / 1024;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`;
}

/**
 * 是否用户取消（ElMessageBox 用字符串 reject）。
 *
 * @param e 异常
 */
function isCancel(e: unknown): boolean {
  return e === "cancel" || e === "close";
}

/** 点击空白处关闭排序面板 */
function onDocPointer(ev: PointerEvent): void {
  if (!sortOpen.value) return;
  const el = ev.target as HTMLElement | null;
  if (el?.closest(".df__sort")) return;
  sortOpen.value = false;
}

onMounted(() => {
  document.addEventListener("pointerdown", onDocPointer, true);
  void load(current.value, "none");
});

onBeforeUnmount(() => {
  document.removeEventListener("pointerdown", onDocPointer, true);
});

// 同一窗口只服务一台主机；主机变了就重新从根目录读
watch(
  () => props.hostId,
  () => {
    stack.value = [""];
    cursor.value = 0;
    void load("", "none");
  },
);
</script>

<style scoped>
.df {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  font-size: 12px;
  color: #d8d3e0;
  background: #16141c;
}

.df:focus {
  outline: none;
}

/* ---------- 工具条 ---------- */
.df__bar {
  display: flex;
  flex: none;
  flex-wrap: wrap;
  gap: 5px;
  align-items: center;
  padding: 5px 8px;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.df__btn {
  display: inline-flex;
  flex: none;
  gap: 4px;
  align-items: center;
  height: 21px;
  padding: 0 7px;
  font-size: 11px;
  color: #cfc9da;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 5px;
}

.df__btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.df__btn:not(:disabled):hover {
  color: #fff;
  background: rgba(233, 84, 32, 0.24);
  border-color: rgba(233, 84, 32, 0.45);
}

.df__btn.is-primary {
  color: #fff;
  background: rgba(233, 84, 32, 0.85);
  border-color: transparent;
}

.df__btn.is-danger {
  color: #ff9a86;
}

.df__btn.is-danger:not(:disabled):hover {
  color: #fff;
  background: rgba(211, 58, 44, 0.85);
  border-color: transparent;
}

.df__crumbs {
  display: flex;
  flex: 1 1 160px;
  gap: 1px;
  align-items: center;
  min-width: 110px;
  height: 21px;
  padding: 0 4px;
  overflow-x: auto;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 5px;
  scrollbar-width: none;
}

.df__crumbs::-webkit-scrollbar {
  display: none;
}

.df__crumb {
  flex: none;
  max-width: 140px;
  padding: 0 3px;
  overflow: hidden;
  color: #9d97ab;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 3px;
}

.df__crumb:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.df__crumb:not(.is-last)::after {
  margin-left: 3px;
  color: #5d5867;
  content: "/";
}

.df__crumb.is-last {
  color: #efeaf7;
}

.df__search {
  display: flex;
  flex: 0 1 118px;
  gap: 4px;
  align-items: center;
  height: 21px;
  padding: 0 6px;
  color: #7e7889;
  background: #100e15;
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 5px;
}

.df__search input {
  width: 100%;
  min-width: 0;
  font-size: 11px;
  color: #e6e1ef;
  background: transparent;
  border: 0;
  outline: none;
}

.df__search input::placeholder {
  color: #6f6a79;
}

.df__seg {
  display: inline-flex;
  flex: none;
  padding: 1px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.07);
  border-radius: 6px;
}

.df__seg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 19px;
  color: #9d97ab;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.df__seg-btn:hover {
  color: #fff;
}

.df__seg-btn.is-on {
  color: #fff;
  background: rgba(233, 84, 32, 0.7);
}

.df__sort {
  position: relative;
  flex: none;
}

.df__sort-text {
  max-width: 52px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__pop {
  position: absolute;
  top: 25px;
  right: 0;
  z-index: 40;
  min-width: 150px;
  padding: 4px;
  background: rgba(30, 25, 36, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.13);
  border-radius: 7px;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.5);
}

.df__pop-item {
  display: flex;
  gap: 7px;
  align-items: center;
  width: 100%;
  padding: 5px 7px;
  font-size: 11.5px;
  color: #ded8e6;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.df__pop-item:hover {
  background: rgba(233, 84, 32, 0.3);
}

.df__pop-item.is-on {
  color: #fff;
}

.df__pop-item em {
  margin-left: auto;
  font-size: 10px;
  font-style: normal;
  color: #9d97ab;
}

.df__pop-sep {
  height: 1px;
  margin: 3px 2px;
  background: rgba(255, 255, 255, 0.1);
}

.df__pop-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
}

.df__error {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  padding: 6px 10px;
  font-size: 11.5px;
  color: #ffb4a2;
  background: rgba(255, 86, 48, 0.12);
  border-bottom: 1px solid rgba(255, 86, 48, 0.2);
}

.df__err-retry {
  margin-left: auto;
  font-size: 11px;
  color: #ffd2c8;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.1);
  border: 0;
  border-radius: 4px;
  padding: 2px 8px;
}

/* ---------- 内容区 ---------- */
.df__body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.df__main {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.df__main.is-icon,
.df__main.is-list {
  overflow-y: auto;
}

.df__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 4px;
  padding: 10px;
  align-content: start;
}

.df__tile {
  display: flex;
  flex-direction: column;
  gap: 3px;
  align-items: center;
  padding: 10px 6px 8px;
  color: #d8d3e0;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
}

.df__tile:hover {
  background: rgba(255, 255, 255, 0.06);
}

.df__tile.is-on {
  background: rgba(233, 84, 32, 0.2);
  border-color: rgba(233, 84, 32, 0.5);
}

.df__tile-ico {
  color: #9a94a8;
}

.df__tile.is-dir .df__tile-ico {
  color: #e9a13b;
}

.df__tile-name {
  display: -webkit-box;
  width: 100%;
  overflow: hidden;
  font-size: 11px;
  line-height: 1.35;
  color: #e6e1ef;
  text-align: center;
  word-break: break-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.df__tile-meta {
  font-size: 9.5px;
  color: #7e7889;
}

.df__list {
  display: flex;
  flex-direction: column;
}

.df__row {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  height: 26px;
  padding: 0 10px;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
}

.df__row:hover {
  background: rgba(255, 255, 255, 0.05);
}

.df__row.is-on {
  background: rgba(233, 84, 32, 0.18);
}

.df__c-name {
  display: flex;
  flex: 1;
  gap: 6px;
  align-items: center;
  min-width: 0;
}

.df__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__badge {
  flex: none;
  padding: 0 4px;
  font-size: 9px;
  font-style: normal;
  color: #9d97ab;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.df__c-size {
  flex: none;
  width: 84px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11px;
  color: #918b9e;
  text-align: right;
}

.df__c-type {
  flex: none;
  width: 108px;
  overflow: hidden;
  font-size: 10.5px;
  color: #918b9e;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__ico {
  flex: none;
  color: #8f8a9b;
}

.df__row.is-dir .df__ico {
  color: #e9a13b;
}

.df__table {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.df__thead {
  display: flex;
  flex: none;
  gap: 10px;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  font-size: 10.5px;
  color: #7e7889;
  background: #191720;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.df__th {
  display: inline-flex;
  gap: 3px;
  align-items: center;
  cursor: pointer;
}

.df__th:hover {
  color: #cfc9da;
}

.df__th.is-name {
  flex: 1;
  min-width: 0;
}

.df__th.is-type {
  width: 108px;
}

.df__th.is-size {
  width: 84px;
  justify-content: flex-end;
}

.df__tbody {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.df__empty {
  padding: 22px;
  font-size: 11.5px;
  color: #7e7889;
  text-align: center;
}

/* 明细布局的右侧信息栏 */
.df__side {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 6px;
  width: 208px;
  padding: 12px 10px;
  overflow-y: auto;
  background: #191720;
  border-left: 1px solid rgba(255, 255, 255, 0.06);
}

.df__side-ico {
  align-self: center;
  margin: 4px 0 2px;
  color: #e9a13b;
}

.df__side-name {
  overflow: hidden;
  font-size: 12px;
  color: #efeaf7;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__side-path {
  display: -webkit-box;
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10px;
  line-height: 1.5;
  color: #7e7889;
  word-break: break-all;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.df__side-row {
  display: flex;
  gap: 8px;
  align-items: baseline;
  justify-content: space-between;
  padding: 5px 8px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 5px;
}

.df__side-row span {
  color: #8f8a9b;
}

.df__side-row em {
  overflow: hidden;
  font-style: normal;
  color: #e6e1ef;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__side-acts {
  display: flex;
  gap: 6px;
  margin-top: auto;
  padding-top: 8px;
}

.df__side-hint {
  margin-top: 30px;
  font-size: 11px;
  color: #6f6a79;
  text-align: center;
}

/* ---------- 底栏 ---------- */
.df__foot {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  height: 30px;
  padding: 0 8px;
  background: #1b1922;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.df__sel {
  max-width: 46%;
  overflow: hidden;
  font-size: 11px;
  color: #cfc9da;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__total {
  flex: none;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10.5px;
  color: #7e7889;
}

.df__spacer {
  flex: 1;
}

/* ---------- 文本预览 ---------- */
.df__pv {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: #121016;
}

.df__pv-bar {
  display: flex;
  flex: none;
  gap: 6px;
  align-items: center;
  height: 30px;
  padding: 0 8px;
  color: #b9b4c2;
  background: #1b1922;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.df__pv-name {
  max-width: 42%;
  overflow: hidden;
  font-size: 11.5px;
  color: #efeaf7;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.df__pv-trunc {
  font-size: 10.5px;
  font-style: normal;
  color: #e9a13b;
}

.df__pv-text {
  flex: 1;
  width: 100%;
  min-height: 0;
  padding: 10px 12px;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 11.5px;
  line-height: 1.6;
  color: #d8d3e0;
  resize: none;
  background: #121016;
  border: 0;
  outline: none;
}

.df__pv-text.is-readonly {
  color: #b9b4c2;
}

/* ---------- 右键菜单 ---------- */
.dctx-mask {
  position: fixed;
  inset: 0;
  z-index: 3000;
}

.dctx {
  position: fixed;
  z-index: 3001;
  min-width: 178px;
  max-width: 260px;
  padding: 5px;
  color: #efeaf7;
  background: rgba(30, 21, 30, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(18px);
}

.dctx__head {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 6px 8px 7px;
  margin: -5px -5px 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.dctx__head b {
  overflow: hidden;
  font-size: 12px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dctx__head .mono {
  overflow: hidden;
  font-family: var(--font-mono, ui-monospace, Consolas, monospace);
  font-size: 10px;
  color: rgba(255, 255, 255, 0.45);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dctx__item {
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  padding: 6px 8px;
  font-size: 12px;
  color: #efeaf7;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 5px;
}

.dctx__item:hover {
  background: rgba(233, 84, 32, 0.32);
}

.dctx__item.is-danger {
  color: #ff8e8e;
}

.dctx__sep {
  height: 1px;
  margin: 4px 2px;
  background: rgba(255, 255, 255, 0.1);
}

.df__file {
  display: none;
}
</style>
