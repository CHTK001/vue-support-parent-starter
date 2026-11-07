<!--
  协同管理 —— 文件管理器样式重构。

  结构：
    - 左侧目录树：从协同文档的 path 字段聚合出虚拟目录（层级缩进 + 文档数）
    - 主区卡片网格：真实 Office 图标 + 文件名 + 大小，圆角卡片
    - 右键菜单：打开 / 重命名 / 复制 / 下载 / 分享连接 / 历史记录 / 权限 / 删除
    - 新建协同：excel/word/text 三类；支持上传 xlsx/docx/txt 转为协同
    - 打开协同：ReLoader 加载态 → 全屏专注层（非弹框）
    - 版本历史：查看 / 「回退」（复制历史版本为新文件）

  数据来源：@pages/filesystem/api/filestorageApi 的 fileCollab* 系列。
-->

<template>
  <div class="cm-page">
    <!-- ===== 左侧目录树 ===== -->
    <aside class="cm-side">
      <div class="cm-side-hd">
        <span>目录</span>
        <span class="cm-side-sub">按文档所属目录聚合</span>
      </div>
      <div class="cm-tree" role="tree" aria-label="协同目录">
        <button
          v-for="node in treeNodes"
          :key="node.key"
          type="button"
          class="cm-node"
          :class="{ active: node.path === currentPath }"
          :style="{ paddingLeft: 10 + node.depth * 16 + 'px' }"
          role="treeitem"
          :aria-selected="node.path === currentPath"
          @click="selectDir(node.path)"
        >
          <span class="cm-node-icon">{{ node.depth === 0 ? "🗂️" : "📁" }}</span>
          <span class="cm-node-label">{{ node.label }}</span>
          <span class="cm-node-count">{{ node.count }}</span>
        </button>
      </div>
    </aside>

    <!-- ===== 主区 ===== -->
    <!-- 空白处右键 = 全部操作入口（新建 / 上传 / 搜索 / 刷新），顶部不再放工具栏 -->
    <section class="cm-main" @contextmenu.prevent="openBlankMenu($event)">
      <!-- 文档列表 -->
      <div class="cm-body">
        <div class="cm-body-hd">
          <span class="cm-body-title" :title="bodyTitle">{{ bodyTitle }}</span>
          <span class="cm-body-hd-right">
            <span v-if="filterActive" class="cm-body-kw" :title="`筛选：${keyword}`">筛选：{{ keyword }}</span>
            <span v-if="selectedIds.length > 0" class="cm-body-sel">已选 {{ selectedIds.length }} 个</span>
            <span class="cm-body-sub">{{ docs.length }} 个文档</span>
            <button
              v-if="filterActive"
              type="button"
              class="cm-body-clear"
              title="清除筛选"
              @click="clearFilter"
            >清除</button>
          </span>
        </div>

        <div v-if="docs.length === 0" class="cm-empty">
          <span class="cm-empty-icon">📄</span>
          <span>{{ collabEmptyText }}</span>
          <span class="cm-empty-sub">
            在空白处右键「新建协同」创建文档，右键「上传为协同」把 xlsx/docx/txt 转为协同文档
          </span>
        </div>

        <div v-else class="cm-grid">
          <div
            v-for="(c, i) in docs"
            :key="c.id"
            class="cm-card"
            :class="{ 'is-selected': isSelected(c) }"
            @click="onCardClick($event, c, i)"
            @dblclick="onCardDblClick(c)"
            @contextmenu.prevent.stop="openMenuAt($event, c, i)"
          >
            <button
              type="button"
              class="cm-card-more"
              title="右键更多操作"
              @click.stop="openMenuAt($event, c, i)"
            >
              <el-icon :size="14"><MoreFilled /></el-icon>
            </button>
            <div class="cm-card-top">
              <span class="cm-card-icon" v-html="collabIcon(c)" />
            </div>
            <div class="cm-card-name" :title="c.fileName">{{ c.fileName }}</div>
            <div class="cm-card-sub">{{ formatSize(c.size) }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== 空白处右键菜单：新建 / 上传 / 搜索 / 刷新（顶部工具栏已移除） ===== -->
    <teleport to="body">
      <div
        v-if="blankMenu.visible"
        ref="blankMenuRef"
        class="cm-ctx"
        :style="{ left: blankMenu.x + 'px', top: blankMenu.y + 'px' }"
        @contextmenu.prevent
      >
        <div class="cm-ctx-item" @click="blankAction('excel')"><el-icon><Plus /></el-icon>新建表格（Excel）</div>
        <div class="cm-ctx-item" @click="blankAction('word')"><el-icon><Plus /></el-icon>新建文档（Word）</div>
        <div class="cm-ctx-item" @click="blankAction('text')"><el-icon><Plus /></el-icon>新建文本（Text）</div>
        <div class="cm-ctx-sep" />
        <div class="cm-ctx-item" @click="blankAction('upload')"><el-icon><Upload /></el-icon>上传为协同</div>
        <div class="cm-ctx-sep" />
        <div class="cm-ctx-item" @click="blankAction('search')">
          <el-icon><Search /></el-icon>搜索文件名（{{ currentPath || "全部文件" }}）
        </div>
        <div class="cm-ctx-item" @click="blankAction('searchAll')"><el-icon><Search /></el-icon>全局搜索文件名</div>
        <div class="cm-ctx-sep" />
        <div class="cm-ctx-item" :class="{ 'is-disabled': listLoading }" @click="blankAction('refresh')">
          <el-icon><Refresh /></el-icon>{{ listLoading ? "刷新中…" : "刷新列表" }}
        </div>
        <template v-if="filterActive">
          <div class="cm-ctx-sep" />
          <div class="cm-ctx-item" @click="blankAction('clear')"><el-icon><Close /></el-icon>清除筛选</div>
        </template>
      </div>
    </teleport>

    <!-- ===== 卡片右键菜单（多选时为批量菜单） ===== -->
    <teleport to="body">
      <div
        v-if="ctxMenu.visible"
        ref="ctxMenuRef"
        class="cm-ctx"
        :style="{ left: ctxMenu.x + 'px', top: ctxMenu.y + 'px' }"
        @contextmenu.prevent
      >
        <!-- 批量：选中的卡片被右键时，作用对象是整批 -->
        <template v-if="ctxMenu.batch">
          <div class="cm-ctx-title">已选 {{ selectedIds.length }} 个</div>
          <div class="cm-ctx-item" @click="menuAction('batchOpen')"><el-icon><View /></el-icon>打开第一个</div>
          <div class="cm-ctx-item" @click="menuAction('batchDownload')"><el-icon><Download /></el-icon>批量下载</div>
          <div class="cm-ctx-sep" />
          <div class="cm-ctx-item" @click="menuAction('batchPublic')"><el-icon><Lock /></el-icon>批量设为公开</div>
          <div class="cm-ctx-item" @click="menuAction('batchPrivate')"><el-icon><Lock /></el-icon>批量设为私有</div>
          <div class="cm-ctx-sep" />
          <div class="cm-ctx-item is-danger" @click="menuAction('batchDelete')"><el-icon><Delete /></el-icon>批量删除</div>
          <div class="cm-ctx-sep" />
          <div class="cm-ctx-item" @click="menuAction('batchClear')"><el-icon><Close /></el-icon>取消选择</div>
        </template>
        <template v-else>
          <!-- 无写权限时不给「全屏编辑」入口：进去也只能只读，不如直接标成只读预览 -->
          <div v-if="canWriteDoc(ctxMenu.row)" class="cm-ctx-item" @click="menuAction('open')"><el-icon><View /></el-icon>打开（全屏编辑）</div>
          <div class="cm-ctx-item" @click="menuAction('preview')"><el-icon><View /></el-icon>{{ canWriteDoc(ctxMenu.row) ? "打开（弹框预览）" : "打开（只读预览）" }}</div>
          <div class="cm-ctx-sep" />
          <div
            v-if="canWriteDoc(ctxMenu.row)"
            class="cm-ctx-item"
            @click="menuAction('rename')"
          ><el-icon><EditPen /></el-icon>重命名</div>
          <div v-if="canWriteDoc(ctxMenu.row)" class="cm-ctx-item" @click="menuAction('copy')"><el-icon><CopyDocument /></el-icon>复制</div>
          <div class="cm-ctx-item" @click="menuAction('download')"><el-icon><Download /></el-icon>下载</div>
          <div class="cm-ctx-sep" />
          <div class="cm-ctx-item" @click="menuAction('share')"><el-icon><Link /></el-icon>分享连接</div>
          <div class="cm-ctx-item" @click="menuAction('history')"><el-icon><Clock /></el-icon>历史记录</div>
          <div class="cm-ctx-sep" />
          <!-- 权限与删除只对创建者开放：与终端共享「仅发起者可改权限 / 取消共享」一致 -->
          <div
            v-if="isOwnerDoc(ctxMenu.row)"
            class="cm-ctx-item"
            @click="menuAction('access')"
          ><el-icon><Lock /></el-icon>权限</div>
          <div
            v-if="isOwnerDoc(ctxMenu.row)"
            class="cm-ctx-item is-danger"
            @click="menuAction('delete')"
          ><el-icon><Delete /></el-icon>删除</div>
          <div
            v-if="!canWriteDoc(ctxMenu.row)"
            class="cm-ctx-note"
          >只读：当前账号未被授权编辑该协同文档</div>
        </template>
      </div>
    </teleport>

    <!-- ===== 新建协同弹窗 ===== -->
    <el-dialog v-model="createVisible" :title="createDialogTitle" width="540px" append-to-body>
      <div class="cm-dialog-body">
        <el-form label-width="90px" label-position="left">
          <el-form-item label="文档类型">
            <el-radio-group v-model="createForm.type">
              <el-radio value="excel">表格 Excel</el-radio>
              <el-radio value="word">文档 Word</el-radio>
              <el-radio value="text">文本 Text</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="文件名">
            <el-input
              v-model="createForm.fileName"
              :placeholder="fileNamePlaceholder"
              class="cm-form-file-input"
            />
            <div class="cm-form-file-hint">留空自动命名</div>
          </el-form-item>
          <el-form-item label="目录">
            <el-input
              v-model="createForm.path"
              placeholder="留空 = 根目录；如 项目A/台账"
              class="cm-form-file-input"
              list="cm-dir-suggest"
            />
            <datalist id="cm-dir-suggest">
              <option v-for="d in dirOptions" :key="d" :value="d" />
            </datalist>
            <div class="cm-form-file-hint">按「/」分隔层级，例如：项目A/台账/2026</div>
          </el-form-item>
          <el-form-item label="可见性">
            <el-radio-group v-model="createForm.visibility">
              <el-radio value="PUBLIC">公开（全员可编辑）</el-radio>
              <el-radio value="PRIVATE">私有（仅指定用户）</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="createForm.visibility === 'PRIVATE'" label="授权用户">
            <el-select
              v-model="createForm.userIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              class="cm-user-select"
              placeholder="选择可编辑的用户"
            >
              <el-option v-for="u in userOptions" :key="u.userId" :label="u.label" :value="u.userId" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="onCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- ===== 上传为协同弹窗 ===== -->
    <el-dialog v-model="uploadVisible" title="上传为协同" width="560px" append-to-body>
      <div class="cm-dialog-body">
        <div class="cm-upload-drop" @click="uploadInput?.click()">
          <el-icon :size="30"><UploadFilled /></el-icon>
          <span>点击选择 xlsx / xls / csv / docx / doc / txt / md 文件</span>
        </div>
        <div v-if="uploadFileName" class="cm-upload-file">
          <span class="cm-upload-file-name">{{ uploadFileName }}</span>
          <span class="cm-upload-file-size">{{ formatSize(uploadFileSize) }}</span>
        </div>
        <el-form label-width="90px" label-position="left" style="margin-top: 12px">
          <el-form-item label="文件名">
            <el-input v-model="uploadForm.fileName" placeholder="留空沿用源文件名" class="cm-form-file-input" />
          </el-form-item>
          <el-form-item label="目录">
            <el-input v-model="uploadForm.path" placeholder="留空 = 根目录" class="cm-form-file-input" list="cm-dir-suggest" />
          </el-form-item>
        </el-form>
        <input ref="uploadInputRef" type="file" accept=".xlsx,.xls,.csv,.docx,.doc,.txt,.md" style="display: none" @change="onUploadFilePicked" />
      </div>
      <template #footer>
        <el-button @click="uploadVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" :disabled="!uploadFile" @click="onUploadConvert">转协同</el-button>
      </template>
    </el-dialog>

    <!-- ===== 权限管理弹窗 ===== -->
    <el-dialog v-model="accessVisible" title="协同权限" width="540px" append-to-body>
      <div class="cm-dialog-body">
        <el-form label-width="90px" label-position="left">
          <el-form-item label="文档">
            <div class="cm-form-file">
              <span class="cm-form-file-name">{{ accessForm.fileName }}</span>
              <span v-if="accessForm.path" class="cm-form-file-dir">📁 {{ accessForm.path }}</span>
            </div>
          </el-form-item>
          <el-form-item label="可见性">
            <el-radio-group v-model="accessForm.visibility">
              <el-radio value="PUBLIC">公开</el-radio>
              <el-radio value="PRIVATE">私有</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="accessForm.visibility === 'PRIVATE'" label="授权用户">
            <el-select
              v-model="accessForm.userIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              class="cm-user-select"
              placeholder="选择可编辑的用户"
            >
              <el-option v-for="u in userOptions" :key="u.userId" :label="u.label" :value="u.userId" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="accessVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingAccess" @click="onSaveAccess">保存</el-button>
      </template>
    </el-dialog>

    <!-- ===== 重命名弹窗 ===== -->
    <el-dialog v-model="renameVisible" title="重命名" width="420px" append-to-body>
      <el-input v-model="renameForm.fileName" placeholder="新文件名（含扩展名）" @keyup.enter="onRename" />
      <template #footer>
        <el-button @click="renameVisible = false">取消</el-button>
        <el-button type="primary" :loading="renaming" @click="onRename">确定</el-button>
      </template>
    </el-dialog>

    <!-- ===== 历史记录弹窗 ===== -->
    <el-dialog v-model="historyVisible" title="版本历史" width="640px" append-to-body>
      <div class="cm-history-hd">
        <span class="cm-history-name">{{ historyCollab?.fileName }}</span>
        <span class="cm-history-hint">回退会复制所选版本为一个新文件</span>
      </div>
      <div v-if="historyLoading" class="cm-history-empty">加载中…</div>
      <div v-else-if="historyEntries.length === 0" class="cm-history-empty">暂无历史版本</div>
      <div v-else class="cm-history-list">
        <div v-for="h in historyEntries" :key="h.version" class="cm-history-item">
          <span class="cm-history-ver">v{{ h.version }}</span>
          <span class="cm-history-time">{{ formatTime(h.updatedAt) }}</span>
          <span class="cm-history-size">{{ formatSize(h.size) }}</span>
          <el-button size="small" text type="primary" @click="rollbackVersion(h)">回退复制</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ===== 分享连接弹窗 ===== -->
    <el-dialog v-model="shareVisible" title="分享连接" width="460px" append-to-body>
      <div class="cm-share">
        <div class="cm-share-preview">
          <span class="cm-share-icon" v-html="collabIcon(shareCollab)" />
          <div class="cm-share-meta">
            <span class="cm-share-name">{{ shareCollab?.fileName }}</span>
            <span class="cm-share-dim">全屏打开 · 只读 · 无返回栏</span>
          </div>
        </div>
        <el-input :model-value="shareUrl" readonly>
          <template #append>
            <el-button @click="copyShareUrl">复制</el-button>
          </template>
        </el-input>
        <div class="cm-share-actions">
          <el-button type="primary" @click="openShareTab">在新标签页打开</el-button>
        </div>
      </div>
    </el-dialog>

    <!-- ===== 轻量预览弹框（word/text 渲染快照，excel 只读渲染） ===== -->
    <el-dialog v-model="previewVisible" :title="previewCollab?.fileName || '文档预览'" width="720px" append-to-body>
      <div v-loading="previewLoading" class="cm-preview">
        <template v-if="previewCollab">
          <div v-if="previewCollab.type === 'excel' || previewCollab.type === 'word'" class="cm-preview-excel">
            <FileCollabEditor
              :collab-id="previewCollab.id"
              :file-name="previewCollab.fileName"
              :doc-type="previewCollab.type"
              readonly
              :initial-snapshot="previewSnapshot"
              :initial-version="previewVersion"
            />
          </div>
          <pre v-else class="cm-preview-text">{{ previewSnapshot || "（空文档）" }}</pre>
        </template>
        <div v-else class="cm-preview-empty">暂无可预览内容</div>
      </div>
      <template #footer>
        <el-button @click="previewVisible = false">关闭</el-button>
        <!-- 只读文档没有「全屏编辑」：进去也只能看，按钮留着会转回本弹框 -->
        <el-button v-if="canWriteDoc(previewCollab)" type="primary" @click="previewFullscreen">全屏编辑</el-button>
      </template>
    </el-dialog>

    <!-- ===== 全屏专注编辑（非弹框）+ ReLoader 防白屏 ===== -->
    <div v-if="focusVisible" class="cm-focus" role="dialog" aria-modal="true" aria-label="协同专注编辑">
      <ReLoader :loading="opening" :text="openingText" fullscreen>
        <div class="cm-focus">
          <div class="cm-focus-bar">
            <button type="button" class="cm-focus-back" @click="closeFocus">
              <el-icon><ArrowLeft /></el-icon><span>返回</span>
            </button>
            <span class="cm-focus-title">
              <span class="cm-focus-icon" v-html="collabIcon(focusCollab)"></span>
              {{ focusCollab?.fileName }}
            </span>
            <span class="cm-focus-sub">
              {{ focusCollab ? `${focusCollab.path || "根目录"} · ${visibilityLabel(focusCollab)}` : "" }}
            </span>
          </div>
          <div class="cm-focus-body">
            <FileCollabEditor
              v-if="focusCollab && (focusCollab.type === 'excel' || focusCollab.type === 'word')"
              :collab-id="focusCollab.id"
              :file-name="focusCollab.fileName"
              :doc-type="focusCollab.type"
              v-model:initial-snapshot="focusSnapshot"
              v-model:initial-version="focusVersion"
            />
            <TextCollabEditor
              v-else-if="focusCollab"
              :collab-id="focusCollab.id"
              :file-name="focusCollab.fileName"
              v-model:initial-snapshot="focusSnapshot"
              v-model:initial-version="focusVersion"
            />
          </div>
        </div>
      </ReLoader>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  ArrowLeft, Clock, Close, CopyDocument, Delete, Download, EditPen, Link,
  Lock, MoreFilled, Plus, Refresh, Search, Upload, UploadFilled, View,
} from "@element-plus/icons-vue";
import { message } from "@repo/core";
import ReLoader from "@repo/ui/re-loader";
import FileCollabEditor from "../components/collab/FileCollabEditor.vue";
import TextCollabEditor from "../components/collab/TextCollabEditor.vue";
import { fileSvg } from "../utils/fileKind";
import { docxFileName } from "../utils/collabDocx";
import { snapshotToBlob } from "../utils/collabExport";
import { encodeOfficeSnapshot } from "../utils/collabOffice";
import { clearImageMetaCache } from "../utils/imageMeta";
import {
  createFileCollab,
  deleteFileCollab,
  getFileCollab,
  listFileCollabs,
  putObject,
  updateFileCollabAccess,
  renameFileCollab,
  copyFileCollab,
  listCollabHistory,
  saveFileCollabSnapshot,
  collabCurrentUserId,
  type CollabDocType,
  type CollabVisibility,
  type CollabVersionEntry,
  type FileCollabInfo,
} from "../api/filestorageApi";
// 用户列表（选择授权用户）：复用系统用户管理页的分页接口
import { listUsersForPicker } from "./collabUserApi";

/* ==================== 基础状态 ==================== */

/** 全部文档（用于目录树与概览统计） */
const allDocs = ref<FileCollabInfo[]>([]);
/** 当前作用域下展示的文档 */
const docs = ref<FileCollabInfo[]>([]);
const listLoading = ref(false);

/** 搜索关键字（防抖） */
const keyword = ref("");
/** 全局检索开关 */
const globalSearch = ref(false);
/** 当前目录（空 = 全部文件 / 根目录） */
const currentPath = ref("");

/**
 * 当前用户标识
 *
 * <p>与终端共享同一口径：由 {@code filestorageApi} 的
 * {@code collabCurrentUserId()} 从框架 storage 取（{@code sysUserId} →
 * {@code userId} → {@code id}）。之前这里硬编码 {@code "admin"}，导致所有账号
 * 都被当成同一个「创建者」，私有文档的授权判断形同虚设。</p>
 */
const currentUserId = ref(collabCurrentUserId());

/* ==================== 列表头（状态行） ==================== */

/**
 * 列表头标题
 *
 * <p>顶部工具栏（面包屑 / 搜索框 / 统计卡）已整体移除：目录选择交给左侧目录树，
 * 新建/上传/搜索/刷新走右键菜单；这里只留一行文字，说明「现在看的是哪一批」。</p>
 */
const bodyTitle = computed(() => {
  const kw = keyword.value.trim();
  if (globalSearch.value && kw) return `全局搜索「${kw}」`;
  const where = currentPath.value || "全部文件";
  return kw ? `${where}中搜索「${kw}」` : where;
});

/** 是否处于筛选态（有关键字） */
const filterActive = computed(() => keyword.value.trim().length > 0);

/** 清除筛选：回到「当前目录全部文档」 */
function clearFilter(): void {
  keyword.value = "";
  globalSearch.value = false;
  void loadDocs();
}

/* ==================== 多选 ==================== */

/** 已选文档 id（顺序即选择顺序） */
const selectedIds = ref<string[]>([]);
/** Shift 连选的锚点（上一次单击/多选所在下标） */
let selectAnchor = -1;

/**
 * 卡片是否选中
 *
 * @param c 文档
 * @return 选中为 true
 */
function isSelected(c: FileCollabInfo): boolean {
  return selectedIds.value.includes(c.id);
}

/** 清空选择 */
function clearSelection(): void {
  selectedIds.value = [];
  selectAnchor = -1;
}

/** 已选文档对象（按当前列表顺序） */
const selectedDocs = computed(() => docs.value.filter((d) => selectedIds.value.includes(d.id)));

/**
 * 单击卡片：单选 / Ctrl 反选 / Shift 连选
 *
 * @param e     鼠标事件（取 ctrlKey / metaKey / shiftKey）
 * @param c     文档
 * @param index 该卡片在当前列表中的下标（Shift 连选用）
 */
function onCardClick(e: MouseEvent, c: FileCollabInfo, index: number): void {
  if (e.shiftKey && selectAnchor >= 0) {
    const from = Math.min(selectAnchor, index);
    const to = Math.max(selectAnchor, index);
    selectedIds.value = docs.value.slice(from, to + 1).map((d) => d.id);
    return;
  }
  if (e.ctrlKey || e.metaKey) {
    selectedIds.value = isSelected(c)
      ? selectedIds.value.filter((id) => id !== c.id)
      : [...selectedIds.value, c.id];
    selectAnchor = index;
    return;
  }
  selectedIds.value = [c.id];
  selectAnchor = index;
}

/**
 * 双击卡片打开（单击已改为选择，打开动作挂双击）
 *
 * @param c 文档
 */
function onCardDblClick(c: FileCollabInfo): void {
  void openEditor(c);
}

/* ==================== 图标 ==================== */

/** 卡片图标：真实 Office SVG（复用 fileKind 的 Windows 风格图标） */
function collabIcon(c: FileCollabInfo | null | undefined): string {
  if (!c) return fileSvg("file.txt", false);
  const name = c.fileName || "file";
  const lower = name.toLowerCase();
  if (c.type === "text" || lower.endsWith(".txt") || lower.endsWith(".md")) return fileSvg("a.txt", false);
  return fileSvg(name, false);
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/* ==================== 目录树 ==================== */

interface DirNode {
  key: string;
  label: string;
  path: string;
  depth: number;
  count: number;
  children: DirNode[];
}

/** 现有目录选项（datalist 建议用） */
const dirOptions = computed(() =>
  [...new Set(allDocs.value.map((c) => c.path).filter(Boolean))].sort(),
);

/** 从全部文档聚合出层级目录树（拍平成数组供渲染，含中间目录） */
const treeNodes = computed<DirNode[]>(() => {
  const root: DirNode = { key: "__root__", label: "全部文件", path: "", depth: 0, count: 0, children: [] };
  const byPath = new Map<string, DirNode>();
  byPath.set("", root);
  for (const c of allDocs.value) {
    const segs = c.path.split("/").filter(Boolean);
    let cur = "";
    let parent = root;
    for (const s of segs) {
      cur = cur ? `${cur}/${s}` : s;
      let node = byPath.get(cur);
      if (!node) {
        node = { key: cur, label: s, path: cur, depth: parent.depth + 1, count: 0, children: [] };
        byPath.set(cur, node);
        parent.children.push(node);
      }
      parent = node;
    }
    parent.count += 1;
  }
  // 目录计数向上汇总：父目录要包含子目录里的文档，
  // 否则「项目A」显示 0、展开后却有几十份文档，看着像统计坏了。
  const rollUp = (node: DirNode): number => {
    for (const child of node.children) node.count += rollUp(child);
    return node.count;
  };
  root.count = rollUp(root);
  const flat: DirNode[] = [];
  const walk = (nodes: DirNode[]): void => {
    for (const n of nodes) {
      flat.push(n);
      walk(n.children);
    }
  };
  walk([root]);
  return flat;
});

function selectDir(path: string): void {
  globalSearch.value = false;
  currentPath.value = path;
  clearSelection();
  void loadDocs();
}

/* ==================== 检索（入口在右键菜单 / Ctrl+F） ==================== */

/**
 * 弹出搜索框并按关键字检索
 *
 * <p>搜索框从顶部移到了右键菜单：{@code global=false} 只搜当前目录，
 * {@code global=true} 忽略目录跨全部文档搜。留空即清除筛选。</p>
 *
 * @param global 是否全局检索
 */
async function promptSearch(global: boolean): Promise<void> {
  const where = global ? "全部目录" : currentPath.value || "全部文件";
  try {
    const { value } = await ElMessageBox.prompt(
      `在「${where}」中按文件名搜索（留空 = 取消筛选）`,
      global ? "全局搜索文件名" : "搜索文件名",
      {
        inputValue: keyword.value,
        inputPlaceholder: "文件名关键字",
        confirmButtonText: "搜索",
        cancelButtonText: "取消",
      },
    );
    globalSearch.value = global;
    keyword.value = (value ?? "").trim();
    await loadDocs();
  } catch {
    // 用户取消：什么都不做
  }
}

let loadSeq = 0;
async function loadDocs(): Promise<void> {
  const kw = keyword.value.trim();
  const path = globalSearch.value ? "" : currentPath.value;
  loadSeq += 1;
  const seq = loadSeq;
  try {
    const list = await listFileCollabs(currentUserId.value, path || undefined, kw || undefined);
    if (seq === loadSeq) docs.value = list;
  } catch (e) {
    if (seq === loadSeq) message.error(e instanceof Error ? e.message : "获取协同列表失败");
  }
}

async function reloadAll(): Promise<void> {
  listLoading.value = true;
  try {
    allDocs.value = await listFileCollabs(currentUserId.value);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "获取协同列表失败");
  } finally {
    listLoading.value = false;
  }
  // 根目录 + 无关键字时，allDocs 就是 docs 的全集：
  // 再调一次 loadDocs() 会打出与上面完全相同的 /collab/list，纯属重复请求。
  if (!keyword.value.trim() && !globalSearch.value && !currentPath.value) {
    loadSeq += 1; // 让在途的旧请求结果作废
    docs.value = allDocs.value;
    return;
  }
  await loadDocs();
}

const collabEmptyText = computed(() =>
  allDocs.value.length === 0 ? "暂无协同文档" : "没有匹配的协同文档",
);

/* ==================== 展示辅助 ==================== */

function visibilityLabel(c: FileCollabInfo): string {
  return c.visibility === "PUBLIC" ? "公开" : `私有（${c.allowedUserIds?.length ?? 0} 人）`;
}

function formatTime(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ==================== 用户选择（授权） ==================== */

const userOptions = ref<Array<{ userId: string; label: string }>>([]);

/** 用户下拉只在真正打开「新建 / 权限」对话框时才需要，且同一会话内拉一次即可 */
let usersLoaded = false;

async function loadUsers(): Promise<void> {
  if (usersLoaded) return;
  try {
    userOptions.value = await listUsersForPicker();
    usersLoaded = true;
  } catch {
    userOptions.value = [];
  }
}

/* ==================== 新建协同 ==================== */

const createVisible = ref(false);
const creating = ref(false);
const createForm = ref<{
  type: CollabDocType;
  fileName: string;
  path: string;
  visibility: CollabVisibility;
  userIds: string[];
}>({ type: "excel", fileName: "", path: "", visibility: "PUBLIC", userIds: [] });

const createDialogTitle = computed(() => {
  const map: Record<CollabDocType, string> = {
    excel: "新建协同文档（Excel）",
    word: "新建协同文档（Word）",
    text: "新建协同文档（文本）",
  };
  return map[createForm.value.type] ?? "新建协同文档";
});

const fileNamePlaceholder = computed(() => {
  const map: Record<CollabDocType, string> = {
    excel: "未命名表格.xlsx",
    word: "未命名文档.docx",
    text: "未命名.txt",
  };
  return map[createForm.value.type];
});

function openCreateDialog(type: CollabDocType): void {
  createForm.value = {
    type: type ?? "excel",
    fileName: "",
    path: globalSearch.value ? "" : currentPath.value,
    visibility: "PUBLIC",
    userIds: [],
  };
  createVisible.value = true;
  void loadUsers();
}

async function onCreate(): Promise<void> {
  createForm.value.fileName = (createForm.value.fileName || "").trim()
    || (createForm.value.type === "word" ? "未命名文档.docx"
      : createForm.value.type === "text" ? "未命名.txt" : "未命名表格.xlsx");
  const path = (createForm.value.path || "").trim().replace(/^\/+|\/+$/g, "");
  creating.value = true;
  try {
    const created = await createFileCollab({
      userId: currentUserId.value,
      fileName: createForm.value.fileName,
      visibility: createForm.value.visibility,
      userIds: createForm.value.visibility === "PRIVATE" ? createForm.value.userIds : [],
      path,
      type: createForm.value.type,
    });
    createVisible.value = false;
    message.success("协同文档已创建");
    await reloadAll();
    openEditorFromId(created.id);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "创建协同失败");
  } finally {
    creating.value = false;
  }
}

/* ==================== 上传为协同（xlsx/docx/txt 转换） ==================== */

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadInputRef = ref<HTMLInputElement | null>(null);
const uploadInput = computed(() => uploadInputRef.value);
const uploadFile = ref<File | null>(null);
const uploadFileName = ref("");
const uploadFileSize = ref(0);
const uploadForm = ref<{ fileName: string; path: string }>({ fileName: "", path: "" });

function openUploadDialog(): void {
  uploadForm.value = { fileName: "", path: globalSearch.value ? "" : currentPath.value };
  uploadFile.value = null;
  uploadFileName.value = "";
  uploadFileSize.value = 0;
  uploadVisible.value = true;
}

function onUploadFilePicked(e: Event): void {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  uploadFile.value = file;
  uploadFileName.value = file.name;
  uploadFileSize.value = file.size;
}

/**
 * 把上传文件转为协同快照。
 *
 * <p>office-engine 之后快照就是真实文件字节（见 {@code utils/collabOffice.ts}），
 * 所以能直接装的格式一律原样封装、零转换（保真度最高）：</p>
 * <ul>
 *   <li>xlsx / docx → 原字节直接 {@code ooxml1:} 封装；</li>
 *   <li>xls / csv / ods → SheetJS 读出来再写成 xlsx 字节；</li>
 *   <li>doc / rtf → mammoth 转 HTML，再走最小 docx 生成；</li>
 *   <li>txt / md → 纯文本（不套壳）。</li>
 * </ul>
 */
async function convertFileToSnapshot(file: File, type: CollabDocType): Promise<string> {
  const lower = file.name.toLowerCase();
  if (type === "excel") {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (/\.xlsx$/.test(lower)) return encodeOfficeSnapshot(buf);
    const XLSX = await import("xlsx");
    const wb = XLSX.read(buf, { type: "array" });
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
    return encodeOfficeSnapshot(new Uint8Array(out));
  }
  if (type === "word") {
    if (/\.docx$/.test(lower)) return encodeOfficeSnapshot(new Uint8Array(await file.arrayBuffer()));
    // .doc / .rtf 引擎不能直接开：先转 HTML，再生成最小 docx
    const mammoth = await import("mammoth");
    const result = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() });
    const { blob } = await snapshotToBlob("word", result.value || "", file.name);
    return encodeOfficeSnapshot(new Uint8Array(await blob.arrayBuffer()));
  }
  // text
  return await file.text();
}

async function onUploadConvert(): Promise<void> {
  const file = uploadFile.value;
  if (!file) return;
  const lower = file.name.toLowerCase();
  let type: CollabDocType;
  if (/\.(xlsx|xls|csv|ods)$/.test(lower)) type = "excel";
  else if (/\.(docx?|rtf)$/.test(lower)) type = "word";
  else type = "text";
  const fileName = (uploadForm.value.fileName || "").trim() || file.name;
  const path = (uploadForm.value.path || "").trim().replace(/^\/+|\/+$/g, "");
  uploading.value = true;
  try {
    const snapshot = await convertFileToSnapshot(file, type);
    const created = await createFileCollab({
      userId: currentUserId.value,
      fileName,
      visibility: "PUBLIC",
      path: path || undefined,
      type,
    });
    if (snapshot) {
      await saveFileCollabSnapshot(created.id, snapshot, created.version);
    }
    uploadVisible.value = false;
    message.success("已转为协同文档");
    await reloadAll();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "转换失败");
  } finally {
    uploading.value = false;
  }
}

/* ==================== 权限管理 ==================== */

const accessVisible = ref(false);
const savingAccess = ref(false);
const accessForm = ref<{
  id: string;
  fileName: string;
  path: string;
  visibility: CollabVisibility;
  userIds: string[];
}>({ id: "", fileName: "", path: "", visibility: "PUBLIC", userIds: [] });

function openAccessDialog(c: FileCollabInfo): void {
  // 权限弹框只对创建者开放（菜单已裁剪，这里是脚本/键盘路径的兜底）
  if (!isOwnerDoc(c)) {
    message.warning("只有创建者可以修改协同权限");
    return;
  }
  accessForm.value = {
    id: c.id,
    fileName: c.fileName,
    path: c.path,
    visibility: c.visibility,
    userIds: c.allowedUserIds ?? [],
  };
  accessVisible.value = true;
  void loadUsers();
}

async function onSaveAccess(): Promise<void> {
  savingAccess.value = true;
  try {
    await updateFileCollabAccess(
      accessForm.value.id,
      accessForm.value.visibility,
      accessForm.value.visibility === "PRIVATE" ? accessForm.value.userIds : [],
      currentUserId.value,
    );
    accessVisible.value = false;
    message.success("协同权限已更新");
    await reloadAll();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "更新权限失败");
  } finally {
    savingAccess.value = false;
  }
}

/* ==================== 右键菜单 ==================== */

const ctxMenu = ref<{
  visible: boolean;
  x: number;
  y: number;
  row: FileCollabInfo | null;
  /** 是否批量菜单（右键落在多选集合内时为 true） */
  batch: boolean;
}>({ visible: false, x: 0, y: 0, row: null, batch: false });
const ctxMenuRef = ref<HTMLElement | null>(null);

/**
 * 当前账号对某份协同文档是否可写
 *
 * <p>优先用后端下发的 {@code canWrite}（与终端共享同一字段口径），
 * 老接口/老数据没有该字段时按同一规则在本地兜底计算：公开 = 全员可写，
 * 私有 = 仅创建者与被授权用户可写。兜底只用于展示层面裁剪入口，
 * 真正的拦截在写接口（后端每个写接口都会再校验一次）。</p>
 *
 * @param c 协同文档（null = 不可写）
 * @return true = 可写
 */
function canWriteDoc(c: FileCollabInfo | null): boolean {
  if (!c) return false;
  if (typeof c.canWrite === "boolean") return c.canWrite;
  if (c.visibility === "PUBLIC") return true;
  const uid = currentUserId.value;
  return !!uid && (c.owner === uid || (c.allowedUserIds ?? []).includes(uid));
}

/**
 * 当前账号是否是该协同文档的创建者
 *
 * <p>归属与可写是两件事：被授权用户能编辑内容，但不能改授权名单、也不能删除
 * 别人的文档 —— 与终端共享「仅发起者可改权限 / 取消共享」一致。</p>
 *
 * @param c 协同文档
 * @return true = 创建者
 */
function isOwnerDoc(c: FileCollabInfo | null): boolean {
  if (!c) return false;
  if (typeof c.isOwner === "boolean") return c.isOwner;
  const uid = currentUserId.value;
  return !!uid && c.owner === uid;
}

/**
 * 在卡片上打开右键菜单
 *
 * <p>右键落在「已选集合」之外时，先把选择切到这张卡；落在集合之内且选了多个，
 * 出的是批量菜单 —— 和资源管理器的习惯一致。</p>
 *
 * @param e     右键事件（已 preventDefault / stopPropagation）
 * @param c     被右键的文档
 * @param index 该卡片在当前列表中的下标
 */
function openMenuAt(e: MouseEvent, c: FileCollabInfo, index = -1): void {
  // 与空白处菜单互斥：先关掉另一个，避免两个右键菜单叠在一起
  blankMenu.value.visible = false;
  if (!isSelected(c)) {
    selectedIds.value = [c.id];
    selectAnchor = index;
  }
  const batch = selectedIds.value.length > 1;
  ctxMenu.value = { visible: true, x: e.clientX, y: e.clientY, row: c, batch };
  void nextTick().then(() => {
    const el = ctxMenuRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    ctxMenu.value.x = Math.max(margin, Math.min(ctxMenu.value.x, window.innerWidth - rect.width - margin));
    ctxMenu.value.y = Math.max(margin, Math.min(ctxMenu.value.y, window.innerHeight - rect.height - margin));
  });
}

async function menuAction(action: string): Promise<void> {
  const c = ctxMenu.value.row;
  ctxMenu.value.visible = false;
  // 入口已按权限裁剪；这里再兜一道，防止键盘/脚本绕过 v-if 直接触发
  if (c) {
    if ((action === "rename" || action === "copy") && !canWriteDoc(c)) {
      message.warning("当前账号没有该协同文档的编辑权限，请联系创建者授权");
      return;
    }
    if ((action === "access" || action === "delete") && !isOwnerDoc(c)) {
      message.warning("只有创建者可以修改权限或删除该协同文档");
      return;
    }
  }
  switch (action) {
    // ---- 批量 ----
    case "batchOpen":
      if (c) await openEditor(c);
      break;
    case "batchDownload": await batchDownload(); break;
    case "batchPublic": await batchSetVisibility("PUBLIC"); break;
    case "batchPrivate": await batchSetVisibility("PRIVATE"); break;
    case "batchDelete": await batchDelete(); break;
    case "batchClear": clearSelection(); break;
    // ---- 单个 ----
    case "open":
      if (c) openFullscreenEditor(c);
      break;
    case "preview":
      if (c) await openPreview(c);
      break;
    case "rename":
      if (c) openRename(c);
      break;
    case "copy":
      if (c) await onCopy(c);
      break;
    case "download":
      if (c) void onDownload(c);
      break;
    case "share":
      if (c) openShare(c);
      break;
    case "history":
      if (c) await openHistory(c);
      break;
    case "access":
      if (c) openAccessDialog(c);
      break;
    case "delete":
      if (c) await onDelete(c);
      break;
  }
}

/* ==================== 批量操作 ==================== */

/**
 * 批量删除（逐个调后端，串行以免并发刷爆接口）
 *
 * <p>失败不中断：一个失败继续删其余的，最后统一汇报成功/失败条数 ——
 * 中断会让「到底删了哪些」变得说不清。</p>
 */
async function batchDelete(): Promise<void> {
  const all = selectedDocs.value;
  if (all.length === 0) return;
  // 只能删自己创建的：被授权用户可编辑内容，但不能删别人的文档
  const list = all.filter((d) => isOwnerDoc(d));
  const denied = all.length - list.length;
  if (list.length === 0) {
    message.warning("选中的文档都不是你创建的，只有创建者可以删除");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确认删除选中的 ${list.length} 个协同文档？此操作不可撤销。`
        + (denied > 0 ? `（另有 ${denied} 个非本人创建，已跳过）` : ""),
      "批量删除",
      { confirmButtonText: "删除", cancelButtonText: "取消", type: "warning" },
    );
  } catch {
    return;
  }
  let ok = 0;
  let bad = 0;
  for (const d of list) {
    try {
      await deleteFileCollab(d.id, currentUserId.value);
      ok += 1;
    } catch {
      bad += 1;
    }
  }
  if (bad === 0) message.success(`已删除 ${ok} 个协同文档`);
  else message.warning(`已删除 ${ok} 个，${bad} 个失败`);
  clearSelection();
  await reloadAll();
}

/** 批量下载：逐个导出（间隔 300ms，避免浏览器把连续下载当弹窗拦掉） */
async function batchDownload(): Promise<void> {
  const list = selectedDocs.value;
  for (const d of list) {
    await onDownload(d);
    await new Promise((r) => setTimeout(r, 300));
  }
}

/**
 * 批量改可见性
 *
 * @param visibility PUBLIC 全员可编辑 / PRIVATE 仅指定用户
 */
async function batchSetVisibility(visibility: CollabVisibility): Promise<void> {
  const all = selectedDocs.value;
  if (all.length === 0) return;
  // 改可见性 = 改授权名单，只有创建者能做
  const list = all.filter((d) => isOwnerDoc(d));
  const denied = all.length - list.length;
  if (list.length === 0) {
    message.warning("选中的文档都不是你创建的，只有创建者可以修改协同权限");
    return;
  }
  const label = visibility === "PUBLIC" ? "公开" : "私有";
  try {
    await ElMessageBox.confirm(
      `把选中的 ${list.length} 个协同文档设为「${label}」？`
        + (visibility === "PRIVATE" ? "原有授权用户保留不变。" : "")
        + (denied > 0 ? `（另有 ${denied} 个非本人创建，已跳过）` : ""),
      `批量设为${label}`,
      { confirmButtonText: "确定", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  let ok = 0;
  let bad = 0;
  for (const d of list) {
    try {
      await updateFileCollabAccess(
        d.id,
        visibility,
        visibility === "PRIVATE" ? d.allowedUserIds ?? [] : [],
        currentUserId.value,
      );
      ok += 1;
    } catch {
      bad += 1;
    }
  }
  if (bad === 0) message.success(`已把 ${ok} 个文档设为${label}`);
  else message.warning(`成功 ${ok} 个，失败 ${bad} 个`);
  await reloadAll();
}

/* ==================== 空白处右键菜单（全部操作入口） ==================== */

/** 空白处右键菜单状态 */
const blankMenu = ref<{ visible: boolean; x: number; y: number }>({ visible: false, x: 0, y: 0 });
const blankMenuRef = ref<HTMLElement | null>(null);

/**
 * 在空白处打开操作菜单
 *
 * @param e 右键事件（已 preventDefault）
 */
function openBlankMenu(e: MouseEvent): void {
  // 与卡片菜单互斥：右键空白先关掉文件卡片菜单
  ctxMenu.value.visible = false;
  blankMenu.value = { visible: true, x: e.clientX, y: e.clientY };
  void nextTick().then(() => {
    const el = blankMenuRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    blankMenu.value.x = Math.max(margin, Math.min(blankMenu.value.x, window.innerWidth - rect.width - margin));
    blankMenu.value.y = Math.max(margin, Math.min(blankMenu.value.y, window.innerHeight - rect.height - margin));
  });
}

/**
 * 空白处菜单动作
 *
 * @param action excel/word/text/upload/search/searchAll/refresh/clear
 */
async function blankAction(action: string): Promise<void> {
  blankMenu.value.visible = false;
  switch (action) {
    case "excel":
    case "word":
    case "text":
      openCreateDialog(action as CollabDocType);
      break;
    case "upload":
      openUploadDialog();
      break;
    case "search":
      await promptSearch(false);
      break;
    case "searchAll":
      await promptSearch(true);
      break;
    case "refresh":
      if (!listLoading.value) await reloadAll();
      break;
    case "clear":
      clearFilter();
      break;
  }
}

/* ==================== 快捷键（工具栏删掉后的效率补位） ==================== */

/** 焦点是否在输入控件里（此时不抢键） */
function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
}

/** 是否有弹层打开（有则不响应快捷键，避免和弹框里的 Enter/Esc 打架） */
function anyDialogOpen(): boolean {
  return createVisible.value || uploadVisible.value || accessVisible.value
    || renameVisible.value || shareVisible.value || historyVisible.value
    || previewVisible.value || focusVisible.value;
}

/**
 * 页面快捷键
 *
 * <p>Ctrl+F 搜索、Ctrl+A 全选、Esc 取消选择；选中一张时 F2 重命名 / Enter 打开，
 * 选中任意多张时 Delete 走批量删除。</p>
 *
 * @param e 键盘事件
 */
function onKeydown(e: KeyboardEvent): void {
  if (isTypingTarget(e.target)) return;
  // Esc 先关「专注编辑 / 弹框预览」这两层覆盖层：它们不是 el-dialog，
  // 没有自带的 Esc 关闭，不给快捷键的话用户只能去点返回按钮。
  if (e.key === "Escape" && (focusVisible.value || previewVisible.value)) {
    if (focusVisible.value) closeFocus();
    if (previewVisible.value) previewVisible.value = false;
    return;
  }
  if (anyDialogOpen()) return;
  const mod = e.ctrlKey || e.metaKey;
  const key = e.key.toLowerCase();
  if (mod && key === "f") {
    e.preventDefault();
    void promptSearch(false);
    return;
  }
  if (mod && key === "a") {
    e.preventDefault();
    selectedIds.value = docs.value.map((d) => d.id);
    return;
  }
  if (e.key === "Escape") {
    clearSelection();
    ctxMenu.value.visible = false;
    blankMenu.value.visible = false;
    return;
  }
  const picked = selectedDocs.value;
  if (picked.length === 0) return;
  if (e.key === "F2" && picked.length === 1) {
    e.preventDefault();
    // F2 是「重命名」的键盘入口，必须与右键菜单同一套权限判定：
    // 只拦右键会让无写权限的账号按 F2 就能弹出输入框，改完才被后端拒绝。
    if (!canWriteDoc(picked[0])) {
      message.warning("当前账号没有该协同文档的编辑权限，请联系创建者授权");
      return;
    }
    openRename(picked[0]);
    return;
  }
  if (e.key === "Enter" && picked.length === 1) {
    e.preventDefault();
    openFullscreenEditor(picked[0]);
    return;
  }
  if (e.key === "Delete") {
    e.preventDefault();
    void batchDelete();
  }
}

/** 点页面任意处收起两套右键菜单（卸载时摘掉，避免重复注册） */
function onGlobalClick(): void {
  ctxMenu.value.visible = false;
  blankMenu.value.visible = false;
}
window.addEventListener("click", onGlobalClick);
window.addEventListener("keydown", onKeydown);

/* ==================== 重命名 ==================== */

const renameVisible = ref(false);
const renaming = ref(false);
const renameForm = ref<{ id: string; fileName: string }>({ id: "", fileName: "" });

function openRename(c: FileCollabInfo): void {
  renameForm.value = { id: c.id, fileName: c.fileName };
  renameVisible.value = true;
}

async function onRename(): Promise<void> {
  const name = renameForm.value.fileName.trim();
  if (!name) return;
  renaming.value = true;
  try {
    await renameFileCollab(renameForm.value.id, name, currentUserId.value);
    renameVisible.value = false;
    message.success("已重命名");
    await reloadAll();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "重命名失败");
  } finally {
    renaming.value = false;
  }
}

/* ==================== 复制 ==================== */

async function onCopy(c: FileCollabInfo): Promise<void> {
  try {
    const copy = await copyFileCollab(c.id, currentUserId.value);
    message.success(`已复制为「${copy.fileName}」`);
    await reloadAll();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "复制失败");
  }
}

/* ==================== 下载 / 写回源文件 ==================== */

/**
 * 取文档当前快照（列表接口只给摘要，导出类动作都要先按 id 取详情）。
 *
 * @param c 协同文档（摘要即可）
 * @return 详情（含 snapshot）
 */
async function fetchSnapshotDoc(c: FileCollabInfo): Promise<FileCollabInfo> {
  return await getFileCollab(c.id, currentUserId.value);
}

/** 下载当前快照：excel 导出 xlsx（SheetJS），word 导出真 docx，text 导出 txt */
async function onDownload(c: FileCollabInfo): Promise<void> {
  try {
    const target = await fetchSnapshotDoc(c);
    const { blob, ext } = await snapshotToBlob(
      target.type,
      target.snapshot ?? "",
      target.fileName,
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = (target.fileName.replace(/\.[^.]+$/, "") || "collab") + ext;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "下载失败");
  }
}

/** 该协同文档是否可写回源文件（必须有源文件指针） */
function canWriteBackToSource(c: FileCollabInfo | null): boolean {
  return !!(c && c.bucket && c.objectKey && canWriteDoc(c));
}

/**
 * 把当前协同内容写回源文件（覆盖存储桶里的原文件）。
 *
 * <p><b>这是破坏性操作</b>：会用当前快照重新生成 xlsx/docx/txt 覆盖
 * {@code bucket/objectKey} 指向的对象，原文件内容不可恢复。所以：</p>
 * <ol>
 *   <li>只在文档确实记录了源文件时才给入口；</li>
 *   <li>执行前必须二次确认，确认框里写明桶、键和「不可恢复」；</li>
 *   <li>覆盖后不自动重新建协同（协同内容仍是当前快照，版本号不变）。</li>
 * </ol>
 *
 * @param c 协同文档
 */
async function onWriteBackToSource(c: FileCollabInfo): Promise<void> {
  if (!canWriteBackToSource(c)) {
    message.warning("该协同文档没有关联源文件，无法写回");
    return;
  }
  try {
    await ElMessageBox.confirm(
      `将用「${c.fileName}」当前的协同内容覆盖存储桶 ${c.bucket} 中的 `
        + `${c.objectKey}，原文件内容会被替换且不可恢复。确认继续？`,
      "写回源文件",
      { type: "warning", confirmButtonText: "覆盖源文件", cancelButtonText: "取消" },
    );
  } catch {
    return;
  }
  writingBackId.value = c.id;
  try {
    const target = await fetchSnapshotDoc(c);
    const { blob } = await snapshotToBlob(target.type, target.snapshot ?? "", target.fileName);
    await putObject(c.bucket, c.objectKey, blob);
    message.success("已写回源文件");
    // 源对象变了，图片/分析等缓存按对象失效（文件存储页复用同一份元信息缓存）
    clearImageMetaCache();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "写回源文件失败");
  } finally {
    writingBackId.value = "";
  }
}

/** 正在写回源文件的文档 id（按钮 loading 用） */
const writingBackId = ref("");

/* ==================== 分享连接（全屏只读视图） ==================== */

const shareVisible = ref(false);
const shareCollab = ref<FileCollabInfo | null>(null);
const shareUrl = computed(() => {
  if (!shareCollab.value) return "";
  const base = window.location.origin + window.location.pathname;
  return `${base}#/file-collabs/share/${shareCollab.value.id}`;
});

function openShare(c: FileCollabInfo): void {
  shareCollab.value = c;
  shareVisible.value = true;
}

async function copyShareUrl(): Promise<void> {
  try {
    await navigator.clipboard.writeText(shareUrl.value);
    message.success("连接已复制");
  } catch {
    message.info(shareUrl.value);
  }
}

function openShareTab(): void {
  window.open(shareUrl.value, "_blank");
}

/* ==================== 历史记录 + 版本回退 ==================== */

const historyVisible = ref(false);
const historyLoading = ref(false);
const historyCollab = ref<FileCollabInfo | null>(null);
const historyEntries = ref<CollabVersionEntry[]>([]);

async function openHistory(c: FileCollabInfo): Promise<void> {
  historyCollab.value = c;
  historyVisible.value = true;
  historyLoading.value = true;
  historyEntries.value = [];
  try {
    historyEntries.value = await listCollabHistory(c.id);
  } catch (e) {
    message.error(e instanceof Error ? e.message : "获取历史失败");
  } finally {
    historyLoading.value = false;
  }
}

/** 回退：取历史版本快照，复制成一个新协同文档 */
async function rollbackVersion(h: CollabVersionEntry): Promise<void> {
  const c = historyCollab.value;
  if (!c) return;
  try {
    const base = c.fileName.replace(/\.[^.]+$/, "") || "collab";
    const ext = c.fileName.slice(c.fileName.lastIndexOf(".")) || "";
    const newName = `${base}-v${h.version}${ext}`;
    const created = await createFileCollab({
      userId: currentUserId.value,
      fileName: newName,
      visibility: c.visibility,
      userIds: c.visibility === "PRIVATE" ? (c.allowedUserIds ?? []) : [],
      path: c.path || undefined,
      type: c.type,
    });
    if (h.snapshot) {
      await saveFileCollabSnapshot(created.id, h.snapshot, created.version);
    }
    historyVisible.value = false;
    message.success(`已回退为「${newName}」`);
    await reloadAll();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "回退失败");
  }
}

/* ==================== 删除 ==================== */

async function onDelete(c: FileCollabInfo): Promise<void> {
  if (!isOwnerDoc(c)) {
    message.warning("只有创建者可以删除该协同文档");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除协同文档「${c.fileName}」？`, "删除协同", {
      confirmButtonText: "删除",
      cancelButtonText: "取消",
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    await deleteFileCollab(c.id, currentUserId.value);
    message.success("协同文档已删除");
    await reloadAll();
  } catch (e) {
    message.error(e instanceof Error ? e.message : "删除协同失败");
  }
}

/* ==================== 轻量弹框预览（右键「打开（弹框预览）」） ==================== */

const previewVisible = ref(false);
const previewLoading = ref(false);
const previewCollab = ref<FileCollabInfo | null>(null);
const previewSnapshot = ref("");
const previewVersion = ref(0);

/** 弹框预览：word/text 只读渲染快照，excel 用 FileCollabEditor 只读渲染 */
async function openPreview(c: FileCollabInfo): Promise<void> {
  previewCollab.value = c;
  previewSnapshot.value = c.snapshot ?? "";
  previewVersion.value = c.version ?? 0;
  previewVisible.value = true;
  previewLoading.value = true;
  try {
    const detail = await getFileCollab(c.id, currentUserId.value);
    if (detail.snapshot) {
      previewSnapshot.value = detail.snapshot;
      previewVersion.value = detail.version ?? 0;
    }
  } catch {
    // 详情拉取失败时退回列表快照，不阻断预览
  } finally {
    previewLoading.value = false;
  }
}

/** 弹框右下角「全屏编辑」：在新标签页打开全屏可编辑视图（顶部无返回，专注编辑） */
async function previewFullscreen(): Promise<void> {
  const c = previewCollab.value;
  previewVisible.value = false;
  if (c) openFullscreenEditor(c);
}

/**
 * 在新浏览器标签页打开全屏编辑视图。
 *
 * <p>与页面内的专注编辑浮层不同：新标签页无侧边栏、无返回栏，适合长时间专注编辑；
 * 无写权限或弹窗被拦截时退回页面内的预览/浮层，避免点了没反应。</p>
 *
 * @param c 协同文档
 */
function openFullscreenEditor(c: FileCollabInfo): void {
  if (!canWriteDoc(c)) {
    message.info("当前账号没有该协同文档的编辑权限，已切换为只读预览");
    void openPreview(c);
    return;
  }
  const base = window.location.origin + window.location.pathname;
  const url = `${base}#/file-collabs/edit/${c.id}`;
  const win = window.open(url, "_blank");
  if (!win) {
    message.warning("浏览器拦截了新标签页，已在当前页打开专注编辑");
    void openEditor(c);
  }
}

/* ==================== 专注编辑（非弹框）+ ReLoader 防白屏 ==================== */

const focusVisible = ref(false);
const focusCollab = ref<FileCollabInfo | null>(null);
const focusSnapshot = ref("");
const focusVersion = ref(0);
/** 打开加载中（ReLoader 驱动，避免 Univer/编辑器初始化前白屏） */
const opening = ref(false);
const openingText = ref("正在打开协同文档…");

async function openEditor(c: FileCollabInfo): Promise<void> {
  // 无写权限不进入编辑态：直接转只读预览，避免用户改了半天才在保存时被拒
  if (!canWriteDoc(c)) {
    message.info("当前账号没有该协同文档的编辑权限，已切换为只读预览");
    await openPreview(c);
    return;
  }
  opening.value = true;
  let target = c;
  try {
    target = await getFileCollab(c.id, currentUserId.value);
    if (!target.snapshot && c.snapshot) target = { ...target, snapshot: c.snapshot };
  } catch {
    // 详情拉取失败时退回列表快照，不阻断打开
  }
  focusCollab.value = target;
  focusSnapshot.value = target.snapshot ?? "";
  focusVersion.value = target.version ?? 0;
  focusVisible.value = true;
  // ReLoader 需要先渲染容器再结束加载态，避免容器不存在
  await nextTick();
  opening.value = false;
}

async function openEditorFromId(id: string): Promise<void> {
  const c = allDocs.value.find((x) => x.id === id);
  if (c) await openEditor(c);
}

function closeFocus(): void {
  focusVisible.value = false;
  focusCollab.value = null;
  void reloadAll();
}

onMounted(() => {
  void reloadAll();
  // 用户下拉延后到打开「新建 / 权限」对话框时再拉，进页面不需要它
});

onBeforeUnmount(() => {
  window.removeEventListener("click", onGlobalClick);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
.cm-page {
  display: flex;
  gap: 12px;
  height: 100%;
  min-height: 0;
}

/* ===== 左侧目录树 ===== */
.cm-side {
  flex: 0 0 220px;
  min-width: 180px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
  overflow: hidden;
}
.cm-side-hd {
  padding: 12px 14px 8px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.cm-side-sub {
  font-size: 11px;
  font-weight: 400;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.cm-tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cm-node {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  cursor: pointer;
  text-align: left;
  width: 100%;
  transition: background 0.15s ease;
}
.cm-node:hover { background: var(--brand-50, var(--el-fill-color-light, #f5f7fa)); }
.cm-node.active {
  background: var(--brand-100, var(--el-color-primary-light-9, #ecf5ff));
  color: var(--brand-600, var(--el-color-primary, #409eff));
  font-weight: 600;
}
.cm-node-icon { font-size: 15px; flex: 0 0 auto; }
.cm-node-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cm-node-count {
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
}

/* ===== 主区 ===== */
.cm-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

/* 概览条与顶部工具栏已移除（统计卡 / 面包屑 / 搜索 / 上传 / 新建 / 刷新 → 右键菜单） */

/* 主体列表 */
.cm-body {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
}
.cm-body-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.cm-body-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cm-body-sub { font-size: 12px; color: var(--text-secondary, var(--el-text-color-secondary, #909399)); }
.cm-body-hd-right {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
/* 筛选态提示：只说「当前有关键字」，可一键清掉（筛选入口本身在右键菜单） */
.cm-body-kw {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  color: var(--brand-600, var(--el-color-primary, #409eff));
  background: var(--brand-50, var(--el-color-primary-light-9, #ecf5ff));
}
/* 多选计数 */
.cm-body-sel {
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 999px;
  color: var(--brand-600, var(--el-color-primary, #409eff));
  background: var(--brand-50, var(--el-color-primary-light-9, #ecf5ff));
  font-variant-numeric: tabular-nums;
}
.cm-body-clear {
  border: 0;
  background: transparent;
  padding: 2px 4px;
  font-size: 12px;
  cursor: pointer;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  text-decoration: underline;
}
.cm-body-clear:hover { color: var(--brand-600, var(--el-color-primary, #409eff)); }

/* 卡片网格：大圆角卡片，图标居中 + 下方文件名 */
.cm-grid {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 14px;
  align-content: start;
  padding: 4px;
}
.cm-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 124px;
  padding: 16px 10px 10px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: 16px;
  background: var(--el-bg-color, #fff);
  transition: box-shadow 0.15s ease, border-color 0.15s ease, transform 0.1s ease;
}
.cm-card:hover {
  border-color: var(--brand-400, var(--el-color-primary-light-5, #79bbff));
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
/* 选中态：和资源管理器一致，主色描边 + 淡底，多选时一眼看出作用范围 */
.cm-card.is-selected {
  border-color: var(--brand-600, var(--el-color-primary, #409eff));
  background: var(--brand-50, var(--el-color-primary-light-9, #ecf5ff));
  box-shadow: 0 0 0 1px var(--brand-600, var(--el-color-primary, #409eff)) inset;
}
.cm-card-more {
  position: absolute;
  top: 7px;
  right: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 0;
  border-radius: 50%;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  background: transparent;
  cursor: pointer;
  opacity: 0;
  transform: scale(0.92);
  transition: opacity 0.15s ease, transform 0.15s ease, background 0.15s ease;
}
.cm-card:hover .cm-card-more,
.cm-card-more:focus-visible {
  opacity: 1;
  transform: scale(1);
}
.cm-card-more:hover {
  background: var(--brand-50, var(--el-fill-color-light, #f5f7fa));
  color: var(--brand-600, var(--el-color-primary, #409eff));
}
.cm-card-top {
  display: flex;
  justify-content: center;
  padding: 4px 0 8px;
  cursor: pointer;
}
.cm-card-icon {
  font-size: 56px;
  line-height: 1;
  display: inline-flex;
}
.cm-card-icon :deep(svg) {
  width: 56px;
  height: 56px;
}
.cm-card-name {
  width: 100%;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  padding: 0 4px;
}
.cm-card-sub {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  margin-top: 2px;
}

/* 右键菜单 */
.cm-ctx {
  position: fixed;
  z-index: 3200;
  min-width: 150px;
  padding: 4px;
  border-radius: 10px;
  background: var(--el-bg-color-overlay, var(--el-bg-color, #fff));
  border: 1px solid var(--el-border-color-lighter, #e8ebf0);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.14);
  user-select: none;
}
.cm-ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  border-radius: 6px;
  cursor: pointer;
}
.cm-ctx-item:hover { background: var(--brand-50, var(--el-fill-color-light, #f5f7fa)); }
.cm-ctx-item.is-danger { color: var(--status-error, #f56c6c); }
.cm-ctx-item.is-danger:hover { background: var(--el-color-danger-light-9, #fef0f0); }
/* 刷新中：置灰但保留文案，避免「点了没反应」 */
.cm-ctx-item.is-disabled {
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  cursor: default;
  pointer-events: none;
}
/* 批量菜单头：说明作用对象是整批，不是光标下那一个 */
.cm-ctx-title {
  padding: 6px 10px 4px;
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-variant-numeric: tabular-nums;
}
/* 无写权限时的只读提示：菜单项被裁掉了，得说明为什么少了 */
.cm-ctx-note {
  padding: 6px 10px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  border-top: 1px solid var(--el-border-color-lighter, #e8ebf0);
  margin-top: 4px;
}
.cm-ctx-sep { height: 1px; background: var(--el-border-color-lighter, #e8ebf0); margin: 4px 6px; }

/* 空态 */
.cm-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  font-size: 14px;
}
.cm-empty-icon { font-size: 36px; }
.cm-empty-sub { font-size: 12px; color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc)); }

/* ===== 对话框 ===== */
.cm-dialog-body { padding-top: 4px; }
.cm-form-file-input { width: 100%; }
.cm-form-file-hint { font-size: 12px; color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc)); margin-top: 4px; }
.cm-user-select { width: 100%; }
.cm-form-file { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cm-form-file-name { font-weight: 600; color: var(--text-primary, var(--el-text-color-primary, #303133)); word-break: break-all; }
.cm-form-file-dir { font-size: 12px; color: var(--text-secondary, var(--el-text-color-secondary, #909399)); }

/* 上传区 */
.cm-upload-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 12px;
  border: 1px dashed var(--el-border-color, #dcdfe6);
  border-radius: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.cm-upload-drop:hover { border-color: var(--el-color-primary, #409eff); color: var(--el-color-primary, #409eff); }
.cm-upload-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lighter, #f5f7fa);
}
.cm-upload-file-name { font-size: 13px; color: var(--text-primary, var(--el-text-color-primary, #303133)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cm-upload-file-size { font-size: 12px; color: var(--text-secondary, var(--el-text-color-secondary, #909399)); flex: 0 0 auto; }

/* 历史记录 */
.cm-history-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}
.cm-history-name { font-weight: 600; color: var(--text-primary, var(--el-text-color-primary, #303133)); }
.cm-history-hint { font-size: 12px; color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc)); }
.cm-history-empty { padding: 20px; text-align: center; color: var(--text-secondary, var(--el-text-color-secondary, #909399)); }
.cm-history-list { max-height: 360px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
.cm-history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.cm-history-ver { font-weight: 600; color: var(--brand-600, var(--el-color-primary, #409eff)); flex: 0 0 40px; }
.cm-history-time { font-size: 13px; color: var(--text-secondary, var(--el-text-color-secondary, #909399)); flex: 1; }
.cm-history-size { font-size: 12px; color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc)); flex: 0 0 60px; }

/* 分享 */
.cm-share { display: flex; flex-direction: column; gap: 12px; }
.cm-share-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: var(--el-fill-color-lighter, #f5f7fa);
}
.cm-share-icon { font-size: 40px; display: inline-flex; }
.cm-share-icon :deep(svg) { width: 40px; height: 40px; }
.cm-share-meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.cm-share-name { font-weight: 600; color: var(--text-primary, var(--el-text-color-primary, #303133)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cm-share-dim { font-size: 12px; color: var(--text-secondary, var(--el-text-color-secondary, #909399)); }
.cm-share-actions { display: flex; justify-content: flex-end; }

/* 轻量预览弹框 */
.cm-preview {
  min-height: 420px;
  max-height: 64vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.cm-preview-excel {
  flex: 1;
  min-height: 420px;
  display: flex;
}
.cm-preview-excel > * {
  flex: 1;
  min-width: 0;
}
.cm-preview-html {
  flex: 1;
  min-height: 420px;
  overflow-y: auto;
  padding: 16px 20px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: 8px;
  background: #fff;
  line-height: 1.7;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.cm-preview-html h1, .cm-preview-html h2 { margin: 0.4em 0; }
.cm-preview-html p { margin: 0.3em 0; }
.cm-preview-text {
  flex: 1;
  min-height: 420px;
  margin: 0;
  overflow-y: auto;
  padding: 16px 20px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: 8px;
  background: #fff;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--font-mono, "JetBrains Mono", Consolas, monospace);
  font-size: 13px;
  line-height: 1.7;
}
.cm-preview-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary, var(--el-text-color-placeholder, #c0c4cc));
  font-size: 13px;
  min-height: 420px;
}

/* ===== 全屏专注编辑 ===== */
.cm-focus {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color-page, #f5f7fa);
  padding: 14px 18px 18px;
  animation: cm-focus-in 0.22s ease;
}
@keyframes cm-focus-in {
  from { opacity: 0; transform: scale(0.985); }
  to { opacity: 1; transform: scale(1); }
}
.cm-focus-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 12px;
  flex: 0 0 auto;
}
.cm-focus-back {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  cursor: pointer;
  transition: background 0.15s ease;
}
.cm-focus-back:hover { background: var(--brand-50, var(--el-fill-color-light, #f5f7fa)); }
.cm-focus-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cm-focus-icon { font-size: 18px; display: inline-flex; }
.cm-focus-icon :deep(svg) { width: 18px; height: 18px; }
.cm-focus-sub {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
  margin-left: auto;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cm-focus-body {
  flex: 1;
  min-height: 0;
  display: flex;
}
.cm-focus-body > :deep(*) {
  flex: 1;
  min-width: 0;
}
</style>