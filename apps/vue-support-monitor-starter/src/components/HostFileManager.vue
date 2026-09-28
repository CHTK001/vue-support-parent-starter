<template>
  <div
    class="we"
    @dragover.prevent
    @dragenter.prevent="onDragEnter"
    @dragleave="onDragLeave"
    @drop.prevent="onDrop"
  >
    <!-- ============ 顶部命令栏 ============ -->
    <div class="we-bar">
      <div class="we-nav">
        <button class="we-btn" title="后退" :disabled="!canBack" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
        </button>
        <button class="we-btn" title="前进" :disabled="!canForward" @click="goForward">
          <el-icon><ArrowRight /></el-icon>
        </button>
        <button class="we-btn" title="向上" :disabled="!canGoUp" @click="goUp">
          <el-icon><Top /></el-icon>
        </button>
      </div>

      <div class="we-address">
        <el-icon class="we-address-ico"><Monitor /></el-icon>
        <input
          v-model="pathInput"
          class="we-address-input"
          spellcheck="false"
          @keyup.enter="navigate(pathInput)"
        />
      </div>

      <div class="we-search">
        <el-icon class="we-search-ico"><Search /></el-icon>
        <input
          v-model="filterText"
          class="we-search-input"
          :placeholder="'搜索 ' + currentName"
          spellcheck="false"
        />
      </div>
    </div>

    <!-- 操作行 -->
    <div class="we-actions">
      <button class="we-action" @click="openMkdir">
        <el-icon><FolderAdd /></el-icon><span>新建文件夹</span>
      </button>
      <button class="we-action" @click="pickFiles">
        <el-icon><Upload /></el-icon><span>上传</span>
      </button>
      <button class="we-action" @click="load">
        <el-icon><Refresh /></el-icon><span>刷新</span>
      </button>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="we-file-input"
        @change="onFilePicked"
      />
    </div>

    <!-- ============ 主体：左导航 + 右内容 ============ -->
    <div class="we-body">
      <!-- 左侧导航窗格 -->
      <aside class="we-pane">
        <div class="we-pane-sec">快速访问</div>
        <div class="we-pane-item" @click="navigate(homePath)">
          <el-icon class="we-pane-ico we-pane-ico--home"><HomeFilled /></el-icon>
          <span>主页</span>
        </div>

        <div class="we-pane-sec we-pane-sec--tree" @click="navExpanded = !navExpanded">
          <el-icon class="we-caret"><CaretBottom v-if="navExpanded" /><CaretRight v-else /></el-icon>
          <el-icon class="we-pane-ico we-pane-ico--pc"><Monitor /></el-icon>
          <span>此电脑</span>
        </div>

        <div v-if="navExpanded" class="we-pane-children">
          <div
            v-for="(d, i) in drives"
            :key="i"
            class="we-pane-item we-pane-item--drive"
            :class="{ active: isSamePath(currentPath, driveRoot(d)) }"
            @click="navigate(driveRoot(d))"
          >
            <span class="we-drive-ico" v-html="driveSvg(17)"></span>
            <span class="we-drive-label">{{ driveLabel(d) }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧内容窗格 -->
      <section
        class="we-content"
        @click="selected = ''; closeMenu()"
        @contextmenu.prevent="onEmptyContextMenu($event)"
      >
        <!-- 列状视图（macOS Finder） -->
        <div v-if="viewMode === 'columns'" class="we-columns" @click.stop>
          <div v-for="(col, ci) in colStack" :key="ci" class="we-col">
            <!-- 目录列 -->
            <div v-if="!col.file" v-loading="col.loading" class="we-col-list">
              <button
                v-for="f in colSorted(col)"
                :key="f.name"
                class="we-col-row"
                :class="{ selected: col.selected === f.name }"
                @click.stop="onColPick(ci, f)"
              >
                <span class="we-col-glyph" v-html="iconSvg(f, 17)"></span>
                <span class="we-col-name">{{ f.name }}</span>
                <span v-if="f.isDir" class="we-col-caret">›</span>
              </button>
              <div v-if="!col.loading && col.error" class="we-col-empty we-col-error">{{ col.error }}</div>
              <div v-else-if="!col.loading && !col.files.length" class="we-col-empty">空文件夹</div>
            </div>
            <!-- 预览列（文件） -->
            <div v-else v-loading="col.previewLoading" class="we-col-preview">
              <img v-if="col.previewUrl" :src="col.previewUrl" class="we-col-preview-img" />
              <span v-else class="we-col-preview-icon" v-html="iconSvg(col.file, 72)"></span>
              <b class="we-col-preview-name">{{ col.file.name }}</b>
              <div class="we-col-preview-meta">
                <div><span>类型</span>{{ typeLabel(col.file) }}</div>
                <div><span>大小</span>{{ col.file.isDir ? '—' : formatSize(col.file.size) }}</div>
                <div><span>修改日期</span>{{ formatDateShort(col.file.modified) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 大图标视图 -->
        <div v-else-if="viewMode === 'icons'" v-loading="loading" class="we-icons">
          <button
            v-for="file in displayFiles"
            :key="file.name"
            class="we-icon-cell"
            :class="{ selected: selected === file.name, 'move-over': moveOver === file.name }"
            draggable="true"
            @click.stop="selected = file.name"
            @dblclick.stop="onOpen(file)"
            @contextmenu.prevent.stop="onFileContextMenu($event, file)"
            @dragstart="onRowDragStart($event, file)"
            @dragend="onRowDragEnd"
            @dragover="onFolderDragOver($event, file)"
            @dragleave="onFolderDragLeave(file)"
            @drop="onFolderDrop($event, file)"
          >
            <span class="we-icon-glyph" v-html="iconSvg(file, 46)"></span>
            <span class="we-icon-label">{{ file.name }}</span>
          </button>
          <div v-if="!loading && displayFiles.length === 0" class="we-empty" :class="{ 'we-empty--error': !!loadError }">
            <span v-html="folderSvg(44)"></span>
            <p>{{ emptyHint }}</p>
          </div>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="viewMode === 'list'" v-loading="loading" class="we-list">
          <button
            v-for="file in displayFiles"
            :key="file.name"
            class="we-list-cell"
            :class="{ selected: selected === file.name, 'move-over': moveOver === file.name }"
            draggable="true"
            @click.stop="selected = file.name"
            @dblclick.stop="onOpen(file)"
            @contextmenu.prevent.stop="onFileContextMenu($event, file)"
            @dragstart="onRowDragStart($event, file)"
            @dragend="onRowDragEnd"
            @dragover="onFolderDragOver($event, file)"
            @dragleave="onFolderDragLeave(file)"
            @drop="onFolderDrop($event, file)"
          >
            <span class="we-list-glyph" v-html="iconSvg(file, 16)"></span>
            <span class="we-list-label">{{ file.name }}</span>
          </button>
          <div v-if="!loading && displayFiles.length === 0" class="we-empty we-empty--small" :class="{ 'we-empty--error': !!loadError }">
            {{ emptyHint }}
          </div>
        </div>

        <!-- 详细信息视图 -->
        <div v-else v-loading="loading" class="we-details">
          <table class="we-table">
            <thead>
              <tr>
                <th class="col-name">名称</th>
                <th class="col-date">修改日期</th>
                <th class="col-type">类型</th>
                <th class="col-size">大小</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="file in displayFiles"
                :key="file.name"
                :class="{ selected: selected === file.name, 'move-over': moveOver === file.name }"
                @click.stop="selected = file.name"
                @dblclick.stop="onOpen(file)"
                @contextmenu.prevent.stop="onFileContextMenu($event, file)"
                @dragover="onFolderDragOver($event, file)"
                @dragleave="onFolderDragLeave(file)"
                @drop="onFolderDrop($event, file)"
              >
                <td class="col-name">
                  <div class="we-name-inner">
                    <span class="we-list-glyph" v-html="iconSvg(file, 17)"></span>
                    <span class="we-table-name">{{ file.name }}</span>
                  </div>
                </td>
                <td class="col-date">{{ formatDateShort(file.modified) }}</td>
                <td class="col-type"><span class="we-type-tag">{{ typeLabel(file) }}</span></td>
                <td class="col-size">{{ file.isDir ? '' : formatSize(file.size) }}</td>
              </tr>
            </tbody>
          </table>
          <div v-if="!loading && displayFiles.length === 0" class="we-empty we-empty--small" :class="{ 'we-empty--error': !!loadError }">
            {{ emptyHint }}
          </div>
        </div>
      </section>
    </div>

    <!-- 传输状态 -->
    <div v-if="transfers.length" class="we-transfers">
      <div v-for="(t, i) in transfers" :key="i" class="we-tr">
        <el-icon class="we-tr-ico">
          <CircleCheck v-if="t.state === 'done'" />
          <CircleClose v-else-if="t.state === 'error'" />
          <Loading v-else />
        </el-icon>
        <span class="we-tr-name">{{ t.name }}</span>
        <span class="we-tr-state">{{ stateText(t.state) }}</span>
      </div>
    </div>

    <!-- 拖拽遮罩 -->
    <div v-if="dragging" class="we-drop">
      <el-icon :size="46"><Upload /></el-icon>
      <p>松开以上传到当前文件夹</p>
    </div>

    <!-- 右键菜单 -->
    <Teleport to="body">
      <div
        v-if="menu.visible"
        class="we-menu"
        :style="{ left: menu.x + 'px', top: menu.y + 'px' }"
        @click.stop
      >
        <template v-for="(item, i) in menu.items" :key="i">
          <div v-if="item.divider" class="we-menu-divider" />
          <div
            v-else
            class="we-menu-item"
            :class="{ danger: item.danger }"
            @click="item.action"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </div>
        </template>
      </div>
    </Teleport>

    <!-- 新建文件夹 -->
    <el-dialog
      v-model="mkdirVisible"
      title="新建文件夹"
      width="340px"
      append-to-body
      class="we-mini-dialog"
    >
      <el-input
        v-model="newName"
        placeholder="文件夹名称"
        autofocus
        @keyup.enter="confirmMkdir"
      />
      <template #footer>
        <el-button @click="mkdirVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!newName.trim()" @click="confirmMkdir">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 文本编辑 -->
    <el-dialog
      v-model="editorVisible"
      :title="'编辑 - ' + (editorName || '')"
      width="70%"
      append-to-body
      class="we-editor-dialog"
    >
      <el-input
        v-model="editorContent"
        type="textarea"
        :rows="20"
        class="we-editor-area"
      />
      <template #footer>
        <el-button @click="editorVisible = false">关闭</el-button>
        <el-button type="primary" :loading="saving" @click="saveEditor">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览 -->
    <el-dialog
      v-model="previewVisible"
      :title="'预览 - ' + previewName"
      width="78%"
      top="6vh"
      append-to-body
      destroy-on-close
      class="we-preview-dialog"
      @close="closePreview"
    >
      <div v-loading="previewLoading" class="we-preview">
        <img v-if="previewUrl" :src="previewUrl" :alt="previewName" class="we-preview-img" />
      </div>
      <template #footer>
        <span class="we-preview-meta dim">{{ previewName }} · {{ formatSize(previewSize) }}</span>
        <el-button @click="closePreview">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 权限编辑（类 Unix） -->
    <el-dialog
      v-model="permVisible"
      title="权限"
      width="430px"
      append-to-body
      destroy-on-close
      class="we-perm-dialog"
    >
      <div v-loading="permLoading">
        <div class="we-perm-owner">
          <span>所有者：<b>{{ permOwner }}</b></span>
          <span>组：<b>{{ permGroup }}</b></span>
        </div>
        <table class="we-perm-table">
          <thead>
            <tr>
              <th></th>
              <th v-for="b in PERM_BITS" :key="b">{{ b }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(g, gi) in permBits" :key="gi">
              <th>{{ PERM_GROUPS[gi] }}</th>
              <td v-for="(v, bi) in g" :key="bi">
                <el-checkbox v-model="permBits[gi][bi]" />
              </td>
            </tr>
          </tbody>
        </table>
        <div class="we-perm-mode">
          数字模式：<b class="mono">{{ permMode }}</b>
        </div>
      </div>
      <template #footer>
        <el-button @click="permVisible = false">取消</el-button>
        <el-button type="primary" :loading="permSaving" @click="savePerms">应用</el-button>
      </template>
    </el-dialog>

    <!-- 状态栏 -->
    <div class="we-status">
      <span class="we-status-count">
        {{ displayFiles.length }} 个项目<span v-if="selected">　已选择 1 项</span>
      </span>
      <div class="we-status-views">
        <button
          class="we-status-btn"
          :class="{ on: viewMode === 'icons' }"
          title="大图标"
          @click="viewMode = 'icons'"
        ><el-icon><Grid /></el-icon></button>
        <button
          class="we-status-btn"
          :class="{ on: viewMode === 'list' }"
          title="列表"
          @click="viewMode = 'list'"
        ><el-icon><Menu /></el-icon></button>
        <button
          class="we-status-btn"
          :class="{ on: viewMode === 'details' }"
          title="详细信息"
          @click="viewMode = 'details'"
        ><el-icon><Tickets /></el-icon></button>
        <button
          class="we-status-btn"
          :class="{ on: viewMode === 'columns' }"
          title="列状（macOS）"
          @click="viewMode = 'columns'"
        ><el-icon><Operation /></el-icon></button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  FolderAdd, Upload, Refresh, Top, Search,
  ArrowLeft, ArrowRight, Grid, Menu, Tickets, Operation,
  CircleCheck, CircleClose, Loading,
  View, Edit, Download, EditPen, Delete,
  Monitor, HomeFilled, CaretBottom, CaretRight,
  Key,
} from "@element-plus/icons-vue";
import {
  fetchHostFiles,
  fetchHostProfileSection,
  readHostFileContent,
  writeHostFileContent,
  mkdirHostFile,
  deleteHostFile,
  renameHostFile,
  uploadHostFile,
  downloadHostFile,
  fetchHostPerms,
  saveHostPerms,
  type HostFileItem,
} from "../monitorApi";

interface Props {
  hostId: number;
  initialPath?: string;
  platform?: string;
}
const props = withDefaults(defineProps<Props>(), {
  initialPath: "",
  platform: "LINUX",
});

const isWindows = computed(() => "WINDOWS" === (props.platform || "").toUpperCase());
const sep = computed(() => (isWindows.value ? "\\" : "/"));
const defaultRoot = computed(() => (isWindows.value ? "C:\\" : "/"));
const homePath = computed(() => defaultRoot.value);

const currentPath = ref(props.initialPath || defaultRoot.value);
const pathInput = ref(currentPath.value);
const files = ref<HostFileItem[]>([]);
const loading = ref(false);
/** 当前目录的加载失败原因：非空表示「读不到」，不能显示成「此文件夹为空」 */
const loadError = ref("");
const selected = ref("");
const filterText = ref("");
const viewMode = ref<"icons" | "list" | "details" | "columns">("icons");
const navExpanded = ref(true);
const drives = ref<any[]>([]);

/* ---------- 列状视图（macOS Finder） ---------- */
interface Col {
  path: string;
  files: HostFileItem[];
  loading: boolean;
  selected: string;
  /** 预览列承载的文件（存在时该列为预览列） */
  file?: HostFileItem;
  previewUrl?: string;
  previewLoading?: boolean;
  /** 加载失败原因：空目录与读不到是两回事，不能都显示成「空文件夹」 */
  error?: string;
}
const colStack = ref<Col[]>([]);
async function loadColFiles(col: Col): Promise<void> {
  col.loading = true;
  col.error = "";
  try {
    col.files = await fetchHostFiles(props.hostId, col.path);
  } catch (e: any) {
    col.files = [];
    col.error = e?.message || String(e);
  } finally {
    col.loading = false;
  }
}
/** 从指定路径开始重建列栈（单列） */
function startColumns(path: string): void {
  const col: Col = { path, files: [], loading: false, selected: "" };
  colStack.value = [col];
  // 必须取回代理对象：ref 数组会包装元素，直接改原对象不触发重绘（加载态会永远转圈）
  void loadColFiles(colStack.value[0]);
}
/** 列内文件：文件夹优先、名称排序 */
function colSorted(col: Col): HostFileItem[] {
  return [...col.files].sort((a, b) =>
    a.isDir !== b.isDir ? (a.isDir ? -1 : 1)
      : a.name.toLowerCase().localeCompare(b.name.toLowerCase()));
}
/** 在某列点选：文件夹→截断并追加下一列；文件→追加预览列 */
async function onColPick(colIndex: number, file: HostFileItem): Promise<void> {
  colStack.value = colStack.value.slice(0, colIndex + 1);
  const col = colStack.value[colIndex];
  col.selected = file.name;
  const full = join(col.path, file.name);
  if (file.isDir) {
    const next: Col = { path: full, files: [], loading: false, selected: "" };
    colStack.value.push(next);
    await loadColFiles(colStack.value[colStack.value.length - 1]);
    return;
  }
  const image = isImageLike(file.name);
  const preview: Col = {
    path: full, files: [], loading: false, selected: "",
    file, previewLoading: image,
  };
  colStack.value.push(preview);
  if (image) {
    const colRef = colStack.value[colStack.value.length - 1];
    try {
      const blob = await downloadHostFile(props.hostId, full);
      colRef.previewUrl = URL.createObjectURL(blob);
    } catch {
      colRef.previewUrl = "";
    } finally {
      colRef.previewLoading = false;
    }
  }
}

const transfers = ref<Array<{ name: string; state: "doing" | "done" | "error" }>>([]);
let dragCounter = 0;
const dragging = ref(false);
const fileInput = ref<HTMLInputElement>();
/** 内部拖拽移动：被拖动的文件（外部拖入上传时该值为空） */
const moveFile = ref<HostFileItem | null>(null);
/** 拖拽悬停的目标文件夹名，用于高亮 */
const moveOver = ref("");

interface MenuItem {
  label?: string; icon?: any; action?: () => void; divider?: boolean; danger?: boolean;
}
const menu = ref<{ visible: boolean; x: number; y: number; items: MenuItem[] }>({
  visible: false, x: 0, y: 0, items: [],
});
/** 右键菜单已 teleport 到 body，组件外（左栏/命令栏/弹窗外）的左键点击也要能关闭 */
function onDocPointerDown(e: MouseEvent) {
  if (!menu.value.visible) return;
  const t = e.target as HTMLElement | null;
  if (t && t.closest && t.closest(".we-menu")) return; // 点在菜单内：交给菜单项
  menu.value.visible = false;
}
function onDocKeydown(e: KeyboardEvent) { if (e.key === "Escape") menu.value.visible = false; }
function onDocScroll() { if (menu.value.visible) menu.value.visible = false; }
onMounted(() => {
  document.addEventListener("mousedown", onDocPointerDown, true);
  document.addEventListener("keydown", onDocKeydown);
  window.addEventListener("resize", closeMenu);
  document.addEventListener("scroll", onDocScroll, true);
});
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", onDocPointerDown, true);
  document.removeEventListener("keydown", onDocKeydown);
  window.removeEventListener("resize", closeMenu);
  document.removeEventListener("scroll", onDocScroll, true);
});

const mkdirVisible = ref(false);
const newName = ref("");
const editorVisible = ref(false);
const editorName = ref("");
const editorContent = ref("");
const saving = ref(false);

/* ---------- 图片预览 ---------- */
const previewVisible = ref(false);
const previewName = ref("");
const previewSize = ref(0);
const previewUrl = ref("");
const previewLoading = ref(false);
async function openImagePreview(file: HostFileItem) {
  previewName.value = file.name;
  previewSize.value = file.size;
  previewVisible.value = true;
  previewLoading.value = true;
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = ""; }
  try {
    const blob = await downloadHostFile(props.hostId, join(currentPath.value, file.name));
    previewUrl.value = URL.createObjectURL(blob);
  } catch (e: any) {
    ElMessage.error("加载图片失败: " + (e?.message || e));
  } finally {
    previewLoading.value = false;
  }
}
function closePreview() {
  previewVisible.value = false;
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = ""; }
}

/* ---------- 权限编辑（类 Unix） ---------- */
const permVisible = ref(false);
const permPath = ref("");
const permOwner = ref("");
const permGroup = ref("");
const permLoading = ref(false);
const permSaving = ref(false);
/** 三组（所有者/组/其他）× 三位（r/w/x） */
const permBits = ref<boolean[][]>([[false, false, false], [false, false, false], [false, false, false]]);
const PERM_GROUPS = ["所有者", "组", "其他"];
const PERM_BITS = ["读取", "写入", "执行"];
const permMode = computed(() =>
  permBits.value.map(g => (g[0] ? 4 : 0) + (g[1] ? 2 : 0) + (g[2] ? 1 : 0)).join(""));
async function openPerms(file: HostFileItem) {
  const full = join(currentPath.value, file.name);
  permPath.value = full;
  permVisible.value = true;
  permLoading.value = true;
  try {
    const p = await fetchHostPerms(props.hostId, full);
    const digits = String(p.mode).padStart(3, "0").slice(-3).split("").map(Number);
    permBits.value = digits.map(d => [!!(d & 4), !!(d & 2), !!(d & 1)]);
    permOwner.value = p.owner;
    permGroup.value = p.group;
  } catch (e: any) {
    ElMessage.error("读取权限失败: " + (e?.message || e));
  } finally {
    permLoading.value = false;
  }
}
async function savePerms() {
  permSaving.value = true;
  try {
    await saveHostPerms(props.hostId, permPath.value, permMode.value);
    ElMessage.success("权限已更新");
    permVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error("更新权限失败: " + (e?.message || e));
  } finally {
    permSaving.value = false;
  }
}

/* ---------- 历史（后退/前进） ---------- */
const hist = ref<string[]>([currentPath.value]);
const hIdx = ref(0);
const canBack = computed(() => hIdx.value > 0);
const canForward = computed(() => hIdx.value < hist.value.length - 1);
const canGoUp = computed(() => {
  const p = currentPath.value;
  if (!p) return false;
  if (isWindows.value) return !/^[a-zA-Z]:\\?$/.test(p);
  return p !== "/";
});

const currentName = computed(() => {
  const p = currentPath.value;
  if (isWindows.value && /^[a-zA-Z]:\\?$/.test(p)) return "此电脑";
  if (!isWindows.value && p === "/") return "根目录";
  const parts = p.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || "";
});

/* ---------- 路径工具 ---------- */
function join(base: string, name: string): string {
  if (!base) return name;
  const b = base.endsWith("/") || base.endsWith("\\") ? base.slice(0, -1) : base;
  return b + sep.value + name;
}
function parentOf(p: string): string {
  if (isWindows.value) {
    const trimmed = p.endsWith("\\") ? p.slice(0, -1) : p;
    const idx = trimmed.lastIndexOf("\\");
    if (idx <= 2) return trimmed.substring(0, 3);
    return trimmed.substring(0, idx);
  }
  const idx = p.lastIndexOf("/");
  if (idx <= 0) return "/";
  return p.substring(0, idx);
}
function normalize(p: string): string {
  let s = (p || "").trim().replace(/[\\/]+$/, "");
  if (isWindows.value) {
    s = s.replace(/\//g, "\\");
    if (/^[a-zA-Z]:$/.test(s)) s += "\\";
  } else {
    s = s.replace(/\\/g, "/");
    if (!s.startsWith("/")) s = "/" + s;
  }
  return s;
}
function isSamePath(a: string, b: string): boolean {
  return normalize(a).toLowerCase() === normalize(b).toLowerCase();
}

/* ---------- 驱动器 ---------- */
function driveLetter(d: any): string {
  const n = String(d.name || d.mount || "");
  const m = n.match(/([A-Za-z]):/);
  if (m) return m[1].toUpperCase() + ":";
  return String(d.mount || d.name || "");
}
function driveLabel(d: any): string {
  const letter = driveLetter(d);
  if (/^[A-Za-z]:$/.test(letter)) {
    const tag = String(d.name || "");
    const mm = tag.match(/^(.+?)\s*\([A-Za-z]:\)/);
    const prefix = mm ? mm[1].trim() : "本地磁盘";
    return `${prefix} (${letter})`;
  }
  return String(d.name || d.mount || "");
}
function driveRoot(d: any): string {
  const letter = driveLetter(d);
  if (/^[A-Za-z]:$/.test(letter)) return letter + "\\";
  return String(d.mount || d.name || "/");
}
async function loadDrives() {
  try {
    drives.value = await fetchHostProfileSection(props.hostId, "disks");
  } catch {
    drives.value = [];
  }
}

/* ---------- 展示列表（过滤 + 文件夹优先排序） ---------- */
const emptyHint = computed(() => {
  if (loadError.value) return "无法打开此文件夹：" + loadError.value;
  return filterText.value ? "没有匹配的项目" : "此文件夹为空";
});
const displayFiles = computed<HostFileItem[]>(() => {
  const kw = filterText.value.trim().toLowerCase();
  let list = files.value;
  if (kw) list = list.filter(f => f.name.toLowerCase().includes(kw));
  return [...list].sort((a, b) => {
    if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
});

/* ---------- 加载 / 导航 ---------- */
async function load() {
  loading.value = true;
  selected.value = "";
  try {
    files.value = await fetchHostFiles(props.hostId, currentPath.value);
    loadError.value = "";
  } catch (e: any) {
    ElMessage.error("加载目录失败: " + (e?.message || e));
    files.value = [];
    loadError.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}
function navigate(path: string, push = true) {
  const target = (path || "").trim();
  if (!target) return;
  currentPath.value = target;
  pathInput.value = target;
  filterText.value = "";
  if (push) {
    hist.value = hist.value.slice(0, hIdx.value + 1);
    hist.value.push(target);
    hIdx.value = hist.value.length - 1;
  }
  load();
}
function goBack() {
  if (!canBack.value) return;
  hIdx.value--;
  const p = hist.value[hIdx.value];
  currentPath.value = p; pathInput.value = p; load();
}
function goForward() {
  if (!canForward.value) return;
  hIdx.value++;
  const p = hist.value[hIdx.value];
  currentPath.value = p; pathInput.value = p; load();
}
function goUp() {
  if (!canGoUp.value) return;
  navigate(parentOf(currentPath.value));
}
function onOpen(file: HostFileItem) {
  const full = join(currentPath.value, file.name);
  if (file.isDir) { navigate(full); return; }
  if (isImageLike(file.name)) { openImagePreview(file); return; }
  if (isTextLike(file.name)) openEditor(file.name, full);
  else doDownload(file.name, full);
}
function isImageLike(name: string): boolean {
  return /\.(png|jpe?g|gif|svg|webp|bmp|ico|avif)$/i.test(name);
}

/* ---------- 文件分类 ---------- */
function isTextLike(name: string): boolean {
  const n = name.toLowerCase();
  return /\.(txt|md|log|yml|yaml|json|js|ts|vue|java|py|sh|bash|conf|cfg|ini|properties|xml|html|css|sql|env|service)$/.test(n)
    || n.endsWith("rc");
}
function fileCategory(name: string): { ext: string; color: string } {
  const n = name.toLowerCase();
  const rawExt = (n.split(".").pop() || "").replace(/[^a-z0-9]/g, "").slice(0, 4);
  const ext = (rawExt || "file").toUpperCase();
  let color = "#8a93a6";
  if (/\.(png|jpe?g|gif|svg|webp|bmp|ico)$/.test(n)) color = "#a855f7";
  else if (/\.(zip|tar|gz|rar|7z|bz2|xz)$/.test(n)) color = "#d97706";
  else if (/\.(exe|bat|cmd|msi|sh|bin)$/.test(n)) color = "#2563eb";
  else if (/\.(txt|log|md|csv)$/.test(n)) color = "#64748b";
  else if (/\.(js|ts|vue|java|py|go|c|cpp|html|css|json|xml|yml|yaml|sql|sh)$/.test(n)) color = "#0ea5e9";
  return { ext, color };
}
const TYPE_MAP: Record<string, string> = {
  TXT: "文本文档", LOG: "文本文档", MD: "Markdown 文件",
  ZIP: "压缩(zipped)文件夹", RAR: "WinRAR 压缩文件", GZ: "压缩文件", TAR: "压缩文件", "7Z": "压缩文件",
  EXE: "应用程序", BAT: "Windows 批处理文件", MSI: "安装程序包", SH: "Shell 脚本",
  JPG: "JPG 图像文件", PNG: "PNG 图像文件", GIF: "GIF 图像文件", SVG: "SVG 文件",
  PDF: "PDF 文档", DOC: "Word 文档", XLS: "Excel 工作表",
  JSON: "JSON 文件", JS: "JavaScript 文件", TS: "TypeScript 文件", JAVA: "Java 源文件", PY: "Python 文件",
  YML: "YAML 文件", YAML: "YAML 文件", XML: "XML 文档", HTML: "HTML 文档", CSS: "CSS 文件", SQL: "SQL 文件",
};
function typeLabel(file: HostFileItem): string {
  if (file.isDir) return "文件夹";
  const rawExt = (file.name.toLowerCase().split(".").pop() || "").toUpperCase();
  return TYPE_MAP[rawExt] || (rawExt ? `${rawExt} 文件` : "文件");
}
function formatSize(bytes: number): string {
  const b = Number(bytes) || 0;
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + " KB";
  if (b < 1024 * 1024 * 1024) return (b / 1024 / 1024).toFixed(2) + " MB";
  return (b / 1024 / 1024 / 1024).toFixed(2) + " GB";
}
/** 紧凑日期：YYYY-MM-DD HH:mm，无法解析则原样返回 */
function formatDateShort(s?: string): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------- Windows 风格 SVG 图标 ---------- */
function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function folderSvg(px: number): string {
  return `<svg width="${px}" height="${px}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="wef" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#ffd873"/><stop offset="1" stop-color="#f0b90b"/>
  </linearGradient></defs>
  <path d="M5 13c0-1.7 1.3-3 3-3h11l4 4h17c1.7 0 3 1.3 3 3v1c0 .6-.4 1-1 1H4v-2c0-.6.4-1 1-1z" fill="#e0a800"/>
  <path d="M4 16h40c.6 0 1 .4 1 1v17c0 2.2-1.8 4-4 4H7c-2.2 0-4-1.8-4-4V17c0-.6.4-1 1-1z" fill="url(#wef)"/>
</svg>`;
}
function driveSvg(px: number): string {
  return `<svg width="${px}" height="${px}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wedb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fcfdff"/><stop offset=".55" stop-color="#edf0f5"/><stop offset="1" stop-color="#d6dbe4"/>
    </linearGradient>
  </defs>
  <rect x="4" y="15" width="40" height="20" rx="4.5" fill="url(#wedb)" stroke="#b4bac7" stroke-width="1"/>
  <rect x="4" y="15" width="40" height="7.6" fill="#eef1f7"/>
  <line x1="4.5" y1="22.6" x2="43.5" y2="22.6" stroke="#c4cad4" stroke-width=".9"/>
  <circle cx="39.4" cy="18.8" r="2.7" fill="#7ed957" opacity=".28"/>
  <circle cx="39.4" cy="18.8" r="1.5" fill="#57b834"/>
  <line x1="9" y1="30.4" x2="25" y2="30.4" stroke="#c0c6d1" stroke-width=".9" stroke-linecap="round"/>
</svg>`;
}
function fileSvg(px: number, name: string): string {
  const cat = fileCategory(name);
  const fs = px * 0.62;
  const label = cat.ext.slice(0, 4);
  return `<svg width="${px}" height="${px}" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 4h18l10 10v26c0 2.2-1.8 4-4 4H12c-2.2 0-4-1.8-4-4V8c0-2.2 1.8-4 4-4z" fill="#ffffff" stroke="#c4cad4" stroke-width="1"/>
  <path d="M30 4l10 10h-10z" fill="#e6eaf1"/>
  <rect x="8" y="33" width="32" height="9" rx="1.5" fill="${cat.color}"/>
  <text x="24" y="39.6" font-size="${fs > 20 ? 7.5 : 6}" text-anchor="middle" fill="#ffffff" font-weight="700" font-family="Segoe UI, Arial" font-size-adjust="0.5">${esc(label)}</text>
</svg>`;
}
function iconSvg(file: HostFileItem, px: number): string {
  return file.isDir ? folderSvg(px) : fileSvg(px, file.name);
}

/* ---------- 编辑器 ---------- */
async function openEditor(name: string, full: string) {
  editorName.value = name;
  editorContent.value = "";
  editorVisible.value = true;
  try {
    editorContent.value = await readHostFileContent(props.hostId, full);
  } catch (e: any) {
    ElMessage.error("读取文件失败: " + (e?.message || e));
  }
}
async function saveEditor() {
  const full = join(currentPath.value, editorName.value);
  saving.value = true;
  try {
    await writeHostFileContent(props.hostId, full, editorContent.value);
    ElMessage.success("已保存");
    editorVisible.value = false;
  } catch (e: any) {
    ElMessage.error("保存失败: " + (e?.message || e));
  } finally {
    saving.value = false;
  }
}
async function doDownload(name: string, full: string, isDir = false) {
  try {
    const blob = await downloadHostFile(props.hostId, full);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = isDir ? name + ".zip" : name;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch (e: any) {
    ElMessage.error("下载失败: " + (e?.message || e));
  }
}

/* ---------- 新建文件夹 ---------- */
function openMkdir() { newName.value = ""; mkdirVisible.value = true; }
async function confirmMkdir() {
  const name = newName.value.trim();
  if (!name) return;
  try {
    await mkdirHostFile(props.hostId, join(currentPath.value, name));
    ElMessage.success("已创建");
    mkdirVisible.value = false;
    load();
  } catch (e: any) {
    ElMessage.error("创建失败: " + (e?.message || e));
  }
}

/* ---------- 删除 / 重命名 ---------- */
async function confirmDelete(file: HostFileItem) {
  try {
    await ElMessageBox.confirm(`确定删除 “${file.name}” ？`, "删除确认", {
      type: "warning", confirmButtonText: "删除", cancelButtonText: "取消",
    });
  } catch { return; }
  try {
    await deleteHostFile(props.hostId, join(currentPath.value, file.name));
    ElMessage.success("已删除");
    load();
  } catch (e: any) {
    ElMessage.error("删除失败: " + (e?.message || e));
  }
}
async function confirmRename(file: HostFileItem) {
  let value: string;
  try {
    const { value: v } = await ElMessageBox.prompt("新名称", `重命名 - ${file.name}`, {
      confirmButtonText: "确定", cancelButtonText: "取消", inputValue: file.name,
    });
    value = v;
  } catch { return; }
  const target = (value || "").trim();
  if (!target || target === file.name) return;
  try {
    await renameHostFile(
      props.hostId,
      join(currentPath.value, file.name),
      join(currentPath.value, target)
    );
    ElMessage.success("已重命名");
    load();
  } catch (e: any) {
    ElMessage.error("重命名失败: " + (e?.message || e));
  }
}

/* ---------- 上传 ---------- */
async function uploadFiles(fileList: File[]) {
  for (const file of fileList) {
    transfers.value.push({ name: file.name, state: "doing" });
    const idx = transfers.value.length - 1;
    try {
      await uploadHostFile(props.hostId, currentPath.value, file);
      transfers.value[idx].state = "done";
    } catch {
      transfers.value[idx].state = "error";
    }
  }
  load();
  setTimeout(() => {
    transfers.value = transfers.value.filter(t => t.state === "doing");
  }, 8000);
}
function pickFiles() { fileInput.value?.click(); }
function onFilePicked(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length) uploadFiles(Array.from(input.files));
  input.value = "";
}
function onDragEnter() { dragCounter++; dragging.value = true; }
function onDragLeave() {
  dragCounter--;
  if (dragCounter <= 0) { dragging.value = false; dragCounter = 0; }
}
function onDrop(e: DragEvent) {
  dragging.value = false; dragCounter = 0;
  if (e.dataTransfer?.files?.length) uploadFiles(Array.from(e.dataTransfer.files));
}
function onRowDragStart(e: DragEvent, file: HostFileItem) {
  moveFile.value = file;
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/x-we-move", file.name); } catch { /* ignore */ }
  }
}
function onRowDragEnd() { moveFile.value = null; moveOver.value = ""; }
function onFolderDragOver(e: DragEvent, folder: HostFileItem) {
  if (!moveFile.value || !folder.isDir) return;
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
  moveOver.value = folder.name;
}
function onFolderDragLeave(folder: HostFileItem) { if (moveOver.value === folder.name) moveOver.value = ""; }
async function onFolderDrop(e: DragEvent, folder: HostFileItem) {
  e.stopPropagation();
  const file = moveFile.value;
  moveOver.value = ""; moveFile.value = null;
  if (!file || !folder.isDir || file.name === folder.name) return;
  const from = join(currentPath.value, file.name);
  const to = join(join(currentPath.value, folder.name), file.name);
  try {
    await renameHostFile(props.hostId, from, to);
    ElMessage.success(`已移动到 ${folder.name}`);
    load();
  } catch (err: any) {
    ElMessage.error("移动失败: " + (err?.message || err));
  }
}
function stateText(state: string) {
  if (state === "done") return "完成";
  if (state === "error") return "失败";
  return "上传中…";
}

/* ---------- 右键菜单 ---------- */
function closeMenu() { menu.value.visible = false; }
function onFileContextMenu(e: MouseEvent, file: HostFileItem) {
  const full = () => join(currentPath.value, file.name);
  const items: MenuItem[] = [
    { label: "打开", icon: View, action: () => { closeMenu(); onOpen(file); } },
  ];
  if (!file.isDir) {
    if (isTextLike(file.name)) {
      items.push({ label: "编辑", icon: Edit, action: () => { closeMenu(); openEditor(file.name, full()); } });
    }
    items.push({ label: "下载", icon: Download, action: () => { closeMenu(); doDownload(file.name, full(), false); } });
  } else {
    items.push({ label: "打包下载(zip)", icon: Download, action: () => { closeMenu(); doDownload(file.name, full(), true); } });
  }
  if (!isWindows.value) {
    items.push({ label: "权限", icon: Key, action: () => { closeMenu(); openPerms(file); } });
  }
  items.push({ divider: true });
  items.push({ label: "重命名", icon: EditPen, action: () => { closeMenu(); confirmRename(file); } });
  items.push({ label: "删除", icon: Delete, danger: true, action: () => { closeMenu(); confirmDelete(file); } });
  menu.value = { visible: true, x: e.clientX, y: e.clientY, items };
}
function onEmptyContextMenu(e: MouseEvent) {
  menu.value = {
    visible: true, x: e.clientX, y: e.clientY,
    items: [
      { label: "刷新", icon: Refresh, action: () => { closeMenu(); load(); } },
      { label: "新建文件夹", icon: FolderAdd, action: () => { closeMenu(); openMkdir(); } },
      { divider: true },
      { label: "上传文件", icon: Upload, action: () => { closeMenu(); pickFiles(); } },
    ],
  };
}

watch(
  () => [props.hostId, props.initialPath],
  () => {
    const p = props.initialPath || defaultRoot.value;
    currentPath.value = p; pathInput.value = p;
    hist.value = [p]; hIdx.value = 0;
    load(); loadDrives();
  }
);

/* 切到列状视图时按当前路径初始化；列状视图下用导航按钮则按新路径重建 */
watch(viewMode, (m) => {
  if (m === "columns" && !colStack.value.length) startColumns(currentPath.value);
});
watch(currentPath, (p) => {
  if (viewMode.value === "columns") startColumns(p);
});

load();
loadDrives();
</script>

<style scoped>
.we {
  display: flex; flex-direction: column; height: 100%;
  position: relative; background: var(--el-bg-color);
  font-size: 13px; overflow: hidden;
}

/* 命令栏 */
.we-bar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px 4px; flex-shrink: 0;
}
.we-nav { display: flex; gap: 2px; }
.we-btn {
  width: 30px; height: 30px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 6px;
  background: transparent; color: var(--el-text-color-regular); cursor: pointer;
}
.we-btn:hover:not(:disabled) { background: var(--el-fill-color); }
.we-btn:disabled { opacity: .35; cursor: default; }

.we-address {
  flex: 1; display: flex; align-items: center; gap: 7px;
  height: 32px; padding: 0 10px;
  border: 1px solid var(--el-border-color); border-radius: 6px;
  background: var(--el-bg-color);
}
.we-address:focus-within { border-color: var(--el-color-primary); }
.we-address-ico { color: var(--el-text-color-secondary); }
.we-address-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 13px; color: var(--el-text-color-primary);
}
.we-search {
  display: flex; align-items: center; gap: 7px;
  width: 190px; height: 32px; padding: 0 10px;
  border: 1px solid var(--el-border-color); border-radius: 6px;
  background: var(--el-fill-color-blank);
}
.we-search:focus-within { border-color: var(--el-color-primary); }
.we-search-ico { color: var(--el-text-color-secondary); }
.we-search-input {
  flex: 1; border: none; outline: none; background: transparent;
  font-size: 13px; color: var(--el-text-color-primary); min-width: 0;
}

/* 操作行 */
.we-actions {
  display: flex; gap: 2px; padding: 2px 10px 6px; flex-shrink: 0;
}
.we-action {
  display: inline-flex; align-items: center; gap: 6px;
  height: 30px; padding: 0 10px;
  border: 1px solid transparent; border-radius: 6px;
  background: transparent; color: var(--el-text-color-regular);
  font-size: 13px; cursor: pointer;
}
.we-action:hover { background: var(--el-fill-color); }
.we-file-input { display: none; }

/* 主体 */
.we-body { flex: 1; min-height: 0; display: flex; }

/* 左导航 */
.we-pane {
  width: 210px; flex-shrink: 0; overflow-y: auto;
  border-right: 1px solid var(--el-border-color-lighter);
  padding: 6px 6px 10px;
}
.we-pane-sec {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 8px; font-size: 12px; font-weight: 600;
  color: var(--el-text-color-secondary); user-select: none;
}
.we-pane-sec--tree { cursor: pointer; font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
.we-caret { font-size: 11px; color: var(--el-text-color-secondary); }
.we-pane-ico { font-size: 16px; }
.we-pane-ico--pc { color: var(--el-color-primary); }
.we-pane-ico--home { color: var(--el-color-warning); }
.we-pane-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: 6px; cursor: pointer;
  color: var(--el-text-color-primary);
}
.we-pane-item:hover { background: var(--el-fill-color); }
.we-pane-item.active { background: var(--el-color-primary-light-9); }
.we-pane-children { padding-left: 14px; }
.we-pane-item--drive { padding: 5px 8px; }
.we-drive-label { font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.we-drive-ico { display: inline-flex; flex-shrink: 0; }

/* 内容区 */
.we-content { flex: 1; min-width: 0; position: relative; overflow: hidden; }

/* 列状视图（macOS Finder） */
.we-columns { display: flex; height: 100%; overflow-x: auto; overflow-y: hidden; }
.we-col {
  width: 232px; flex-shrink: 0; min-height: 0;
  display: flex; flex-direction: column;
  border-right: 1px solid var(--el-border-color);
}
.we-col-list { flex: 1; min-height: 0; overflow-y: auto; padding: 5px; }
.we-col-row {
  display: flex; align-items: center; gap: 7px; width: 100%;
  padding: 4px 7px; border: 1px solid transparent; border-radius: 5px;
  background: transparent; text-align: left; cursor: default;
}
.we-col-row:hover { background: var(--el-fill-color); }
.we-col-row.selected { background: var(--el-color-primary); color: #fff; }
.we-col-row.selected .we-col-caret { color: #fff; }
.we-col-glyph { display: inline-flex; flex-shrink: 0; }
.we-col-name {
  flex: 1; min-width: 0; font-size: 12.5px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.we-col-caret { color: var(--el-text-color-secondary); font-weight: 700; font-size: 14px; }
.we-col-empty { padding: 16px; text-align: center; font-size: 12px; color: var(--el-text-color-placeholder); }
.we-col-error { color: var(--el-color-danger); text-align: left; word-break: break-all; line-height: 1.5; }
.we-col-preview {
  flex: 1; min-height: 0; overflow-y: auto;
  padding: 20px 14px; display: flex; flex-direction: column; align-items: center; gap: 10px;
}
.we-col-preview-img { max-width: 100%; border-radius: 8px; box-shadow: 0 4px 16px rgba(0, 0, 0, .12); }
.we-col-preview-icon { display: inline-flex; }
.we-col-preview-name { font-size: 13px; font-weight: 600; text-align: center; word-break: break-all; }
.we-col-preview-meta { width: 100%; font-size: 12px; margin-top: 6px; }
.we-col-preview-meta div {
  display: flex; justify-content: space-between; gap: 10px;
  padding: 5px 2px; border-bottom: 1px solid var(--el-border-color-lighter);
}
.we-col-preview-meta span { color: var(--el-text-color-secondary); flex-shrink: 0; }

.we-icons {
  height: 100%; overflow-y: auto; padding: 12px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  align-content: start; gap: 4px;
}
.we-icon-cell {
  display: flex; flex-direction: column; align-items: center; gap: 5px;
  padding: 10px 4px 8px; border: 1px solid transparent; border-radius: 8px;
  background: transparent; cursor: default;
}
.we-icon-cell:hover { background: var(--el-fill-color-light); }
.we-icon-cell.selected { background: var(--el-color-primary-light-9); border-color: var(--el-color-primary-light-5); }
.we-icon-label {
  width: 100%; text-align: center; font-size: 12px; line-height: 1.3;
  color: var(--el-text-color-primary); word-break: break-all;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.we-list {
  height: 100%; overflow: auto; padding: 8px 10px;
  display: flex; flex-direction: column; flex-wrap: wrap; align-content: flex-start;
}
.we-list-cell {
  display: flex; align-items: center; gap: 7px;
  width: 210px; padding: 4px 8px; border: 1px solid transparent; border-radius: 5px;
  background: transparent; text-align: left; cursor: default;
}
.we-list-cell:hover { background: var(--el-fill-color-light); }
.we-list-cell.selected { background: var(--el-color-primary-light-9); }.we-icon-cell.move-over, .we-list-cell.move-over {
  background: var(--el-color-primary-light-8); border-color: var(--el-color-primary);
}
.we-table tbody tr.move-over td { background: var(--el-color-primary-light-8); box-shadow: inset 2px 0 0 var(--el-color-primary); }
.we-list-label {
  font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: var(--el-text-color-primary);
}
.we-list-glyph { display: inline-flex; flex-shrink: 0; }

/* 详细信息 */
.we-details { height: 100%; overflow: auto; padding: 4px 10px 10px; }
.we-table {
  width: 100%; border-collapse: separate; border-spacing: 0;
  font-size: 12.5px; table-layout: fixed;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px; overflow: hidden;
}
.we-table thead th {
  position: sticky; top: 0; z-index: 2;
  text-align: left; font-weight: 600;
  font-size: 11px; letter-spacing: .5px; text-transform: uppercase;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  padding: 9px 12px;
}
.we-table tbody td {
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  vertical-align: middle;
}
.we-table tbody tr:last-child td { border-bottom: none; }
.we-table tbody tr { cursor: default; }
.we-table tbody tr:nth-child(even) td { background: var(--el-fill-color-lighter); }
.we-table tbody tr:hover td { background: var(--el-fill-color); }
.we-table tbody tr.selected td { background: var(--el-color-primary-light-9); }
.col-name { width: 42%; }
.col-date { width: 23%; white-space: nowrap; color: var(--el-text-color-secondary); font-variant-numeric: tabular-nums; }
.col-type { width: 19%; white-space: nowrap; }
.col-size { width: 16%; text-align: right; }
.we-table .col-size { text-align: right; color: var(--el-text-color-regular); font-variant-numeric: tabular-nums; }
.we-table-name { flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.we-name-inner { display: flex; align-items: center; gap: 8px; min-width: 0; }
.we-type-tag {
  display: inline-flex; align-items: center;
  font-size: 11px; line-height: 1;
  padding: 4px 8px; border-radius: 6px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color);
  border: 1px solid var(--el-border-color-lighter);
  white-space: nowrap;
}

.we-empty {
  grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 10px;
  color: var(--el-text-color-placeholder); padding: 60px 0;
}
.we-empty--small { padding: 40px 0; font-size: 13px; }
.we-empty--error { color: var(--el-color-danger); text-align: left; white-space: normal; line-height: 1.6; }

/* 传输 */
.we-transfers {
  flex-shrink: 0; border-top: 1px solid var(--el-border-color-lighter);
  padding: 5px 12px; max-height: 110px; overflow-y: auto;
}
.we-tr { display: flex; align-items: center; gap: 8px; padding: 2px 0; font-size: 12px; }
.we-tr-ico { color: var(--el-color-primary); }
.we-tr-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.we-tr-state { color: var(--el-text-color-secondary); }

/* 拖拽遮罩 */
.we-drop {
  position: absolute; inset: 6px; border: 2px dashed var(--el-color-primary);
  border-radius: 10px; background: var(--el-color-primary-light-9);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; color: var(--el-color-primary); z-index: 20;
}

/* 右键菜单 */
.we-menu {
  position: fixed; z-index: 9999; min-width: 172px;
  background: var(--el-bg-color-overlay); border: 1px solid var(--el-border-color-light);
  border-radius: 8px; padding: 5px; box-shadow: var(--el-box-shadow);
}
.we-menu-item {
  display: flex; align-items: center; gap: 9px; padding: 7px 10px;
  border-radius: 6px; font-size: 13px; cursor: pointer;
}
.we-menu-item:hover { background: var(--el-fill-color); }
.we-menu-item.danger { color: var(--el-color-danger); }
.we-menu-divider { height: 1px; margin: 4px 6px; background: var(--el-border-color-lighter); }

.we-editor-area :deep(textarea) {
  font-family: "JetBrains Mono", "Fira Code", Consolas, monospace;
  font-size: 13px; line-height: 1.6;
}

/* 图片预览 */
.we-preview {
  min-height: 320px; max-height: 72vh;
  display: flex; align-items: center; justify-content: center;
  background: var(--el-fill-color-lighter);
  border-radius: 10px; padding: 12px; overflow: auto;
}
.we-preview-img {
  max-width: 100%; max-height: 68vh;
  object-fit: contain; border-radius: 6px;
  box-shadow: 0 6px 24px rgba(20, 20, 40, .12);
}
.we-preview-meta { margin-right: auto; font-size: 12px; }

/* 权限编辑 */
.we-perm-owner {
  display: flex; gap: 18px; font-size: 12.5px;
  color: var(--el-text-color-secondary); margin-bottom: 12px;
}
.we-perm-owner b { color: var(--el-text-color-primary); font-weight: 600; }
.we-perm-table { width: 100%; border-collapse: collapse; }
.we-perm-table th, .we-perm-table td {
  text-align: center; padding: 8px 6px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.we-perm-table thead th {
  font-size: 11px; font-weight: 500;
  color: var(--el-text-color-secondary);
}
.we-perm-table tbody th {
  text-align: left; font-size: 12.5px; font-weight: 500;
  color: var(--el-text-color-primary);
}
.we-perm-table :deep(.el-checkbox) { height: auto; margin-right: 0; }
.we-perm-mode {
  margin-top: 12px; font-size: 12.5px; color: var(--el-text-color-secondary);
}
.we-perm-mode b { color: var(--el-color-primary); font-size: 14px; }

/* 状态栏 */
.we-status {
  display: flex; align-items: center; justify-content: space-between;
  flex-shrink: 0; height: 30px; padding: 0 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 12px; color: var(--el-text-color-secondary);
}
.we-status-views { display: flex; gap: 2px; }
.we-status-btn {
  width: 26px; height: 24px; display: inline-flex; align-items: center; justify-content: center;
  border: 1px solid transparent; border-radius: 5px;
  background: transparent; color: var(--el-text-color-regular); cursor: pointer;
}
.we-status-btn:hover { background: var(--el-fill-color); }
.we-status-btn.on { background: var(--el-color-primary-light-9); color: var(--el-color-primary); }

.we-pane::-webkit-scrollbar,
.we-icons::-webkit-scrollbar,
.we-list::-webkit-scrollbar,
.we-details::-webkit-scrollbar,
.we-columns::-webkit-scrollbar,
.we-col-list::-webkit-scrollbar { width: 9px; height: 9px; }
.we-pane::-webkit-scrollbar-thumb,
.we-icons::-webkit-scrollbar-thumb,
.we-list::-webkit-scrollbar-thumb,
.we-details::-webkit-scrollbar-thumb,
.we-columns::-webkit-scrollbar-thumb,
.we-col-list::-webkit-scrollbar-thumb { background: var(--el-border-color); border-radius: 5px; }
.we-pane::-webkit-scrollbar-thumb:hover,
.we-icons::-webkit-scrollbar-thumb:hover,
.we-list::-webkit-scrollbar-thumb:hover,
.we-details::-webkit-scrollbar-thumb:hover,
.we-columns::-webkit-scrollbar-thumb:hover,
.we-col-list::-webkit-scrollbar-thumb:hover { background: var(--el-border-color-dark); }
</style>
