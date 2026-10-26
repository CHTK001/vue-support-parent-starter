<!--
  协同管理 —— 在线表格协同文档的列表与管理。

  功能：
    列表（公开 + 我创建的 + 授权给我的，新→旧）、打开协同编辑、
    权限管理（公开 ⇄ 私有 + 指定用户）、删除。
  数据来源：@pages/filesystem/api/filestorageApi 的 fileCollab* 系列。

  打开协同：内嵌 FileCollabEditor（Univer 在线表格 + 快照式协同），
  从列表行数据带入初始快照与版本，编辑器内部轮询同步。
-->

<template>
  <div class="collab-manage-page">
    <!-- 概览条 -->
    <div class="stat-grid" role="group" aria-label="协同概览">
      <div class="stat-card" style="--accent: var(--brand-500)">
        <span class="stat-label">协同总数</span>
        <span class="stat-value">{{ collabs.length }}</span>
        <span class="stat-trend">内存态文档</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-success)">
        <span class="stat-label">公开</span>
        <span class="stat-value">{{ publicCount }}</span>
        <span class="stat-trend">全员可编辑</span>
      </div>
      <div class="stat-card" style="--accent: var(--status-warning)">
        <span class="stat-label">私有</span>
        <span class="stat-value">{{ privateCount }}</span>
        <span class="stat-trend">创建者 + 授权用户</span>
      </div>
      <div class="stat-card" style="--accent: var(--metric-cpu)">
        <span class="stat-label">我创建的</span>
        <span class="stat-value">{{ mineCount }}</span>
        <span class="stat-trend">owner = 当前用户</span>
      </div>
    </div>

    <!-- 工具栏：搜索 + 刷新 + 新建 -->
    <div class="cm-toolbar koi-card">
      <el-input
        v-model="keyword"
        size="small"
        clearable
        placeholder="搜索文件名 / 创建者"
        class="cm-search"
      >
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="visFilter" size="small" clearable placeholder="全部可见性" class="cm-filter">
        <el-option label="公开" value="PUBLIC" />
        <el-option label="私有" value="PRIVATE" />
      </el-select>
      <el-button size="small" text :icon="Refresh" :loading="listLoading" @click="loadCollabs">
        刷新
      </el-button>
      <el-button size="small" type="primary" @click="openCreateDialog">
        <el-icon><Plus /></el-icon>新建协同
      </el-button>
    </div>

    <!-- 协同列表 -->
    <div class="cm-list-wrap koi-card">
      <div class="md-card-hd">
        <span class="md-card-title">协同文档</span>
        <span class="cm-hint">右键表格文件可在文件资产页创建协同</span>
      </div>

      <div v-if="collabs.length === 0" class="cm-empty">
        <span class="cm-empty-icon">📄</span>
        <span>暂无协同文档</span>
        <span class="cm-empty-sub">
          前往「文件管理 → 文件资产」，对 Excel 表格文件右键「创建协同」
        </span>
      </div>

      <div v-else class="cm-list">
        <div v-for="c in filteredCollabs" :key="c.id" class="cm-item">
          <div class="cm-item-main" @dblclick="openEditor(c)">
            <span class="cm-file-icon">📊</span>
            <div class="cm-file-meta">
              <span class="cm-file-name">{{ c.fileName }}</span>
              <span class="cm-file-sub">
                {{ visibilityLabel(c) }} · 版本 v{{ c.version }} · {{ formatTime(c.updatedAt) }}
              </span>
            </div>
          </div>
          <div class="cm-item-actions">
            <el-button size="small" text type="primary" @click="openEditor(c)">打开</el-button>
            <el-button size="small" text @click="openAccessDialog(c)">权限</el-button>
            <el-button size="small" text type="danger" @click="onDelete(c)">删除</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 新建协同弹窗 ===== -->
    <el-dialog v-model="createVisible" title="新建协同文档" width="520px" append-to-body>
      <div class="cm-dialog-body">
        <el-form label-width="90px" label-position="left">
          <el-form-item label="源文件">
            <span class="cm-form-file">{{ createForm.fileName || "（空工作簿）" }}</span>
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

    <!-- ===== 权限管理弹窗 ===== -->
    <el-dialog v-model="accessVisible" title="协同权限" width="520px" append-to-body>
      <div class="cm-dialog-body">
        <el-form label-width="90px" label-position="left">
          <el-form-item label="文档">
            <span class="cm-form-file">{{ accessForm.fileName }}</span>
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

    <!-- ===== 协同编辑（Univer）===== -->
    <el-dialog
      v-model="editorVisible"
      :title="editorFileName"
      width="94%"
      top="3vh"
      destroy-on-close
      append-to-body
      class="cm-editor-dialog"
    >
      <FileCollabEditor
        v-if="editorCollab"
        :collab-id="editorCollab.id"
        :file-name="editorCollab.fileName"
        v-model:initial-snapshot="editorSnapshot"
        v-model:initial-version="editorVersion"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh, Search } from "@element-plus/icons-vue";
import FileCollabEditor from "../components/collab/FileCollabEditor.vue";
import {
  createFileCollab,
  deleteFileCollab,
  listFileCollabs,
  updateFileCollabAccess,
  type CollabVisibility,
  type FileCollabInfo,
} from "../api/filestorageApi";
// 用户列表（选择授权用户）：复用系统用户管理页的分页接口
import { listUsersForPicker } from "./collabUserApi";

/** 协作文档列表 */
const collabs = ref<FileCollabInfo[]>([]);
const listLoading = ref(false);

/** 搜索关键字 */
const keyword = ref("");
/** 可见性筛选 */
const visFilter = ref<"" | CollabVisibility>("");

/** 当前用户 id（本页从登录态取，内部功能） */
const currentUserId = ref("admin");

/** 概览统计 */
const publicCount = computed(() => collabs.value.filter((c) => c.visibility === "PUBLIC").length);
const privateCount = computed(() => collabs.value.filter((c) => c.visibility === "PRIVATE").length);
const mineCount = computed(() => collabs.value.filter((c) => c.owner === currentUserId.value).length);

/** 搜索 + 筛选后的文档 */
const filteredCollabs = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return collabs.value.filter((c) => {
    if (visFilter.value && c.visibility !== visFilter.value) return false;
    if (kw && !c.fileName.toLowerCase().includes(kw) && !c.owner.toLowerCase().includes(kw)) return false;
    return true;
  });
});

/** 可见性文字 */
function visibilityLabel(c: FileCollabInfo): string {
  return c.visibility === "PUBLIC" ? "公开" : `私有（${c.allowedUserIds?.length ?? 0} 人）`;
}

/** 时间显示 */
function formatTime(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 拉取列表 */
async function loadCollabs(): Promise<void> {
  listLoading.value = true;
  try {
    collabs.value = await listFileCollabs(currentUserId.value);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "获取协同列表失败");
  } finally {
    listLoading.value = false;
  }
}

/* ==================== 用户选择（授权） ==================== */

/** 用户选项（userId → label） */
const userOptions = ref<Array<{ userId: string; label: string }>>([]);

/** 加载用户选项（复用系统用户分页接口） */
async function loadUsers(): Promise<void> {
  try {
    const users = await listUsersForPicker();
    userOptions.value = users;
  } catch {
    // 用户列表不可用时授权用户选择降级为空（公开协同不受影响）
    userOptions.value = [];
  }
}

/* ==================== 新建协同 ==================== */

const createVisible = ref(false);
const creating = ref(false);
const createForm = ref<{
  fileName: string;
  visibility: CollabVisibility;
  userIds: string[];
}>({ fileName: "", visibility: "PUBLIC", userIds: [] });

function openCreateDialog(): void {
  createForm.value = { fileName: "", visibility: "PUBLIC", userIds: [] };
  createVisible.value = true;
  void loadUsers();
}

async function onCreate(): Promise<void> {
  if (!createForm.value.fileName) {
    ElMessage.warning("请先填写源文件名（或在文件资产页右键创建）");
    return;
  }
  creating.value = true;
  try {
    const created = await createFileCollab({
      userId: currentUserId.value,
      fileName: createForm.value.fileName,
      visibility: createForm.value.visibility,
      userIds: createForm.value.visibility === "PRIVATE" ? createForm.value.userIds : [],
    });
    createVisible.value = false;
    ElMessage.success("协同文档已创建");
    await loadCollabs();
    // 创建后直接打开编辑
    openEditorFromId(created.id);
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "创建协同失败");
  } finally {
    creating.value = false;
  }
}

/* ==================== 权限管理 ==================== */

const accessVisible = ref(false);
const savingAccess = ref(false);
const accessForm = ref<{
  id: string;
  fileName: string;
  visibility: CollabVisibility;
  userIds: string[];
}>({ id: "", fileName: "", visibility: "PUBLIC", userIds: [] });

function openAccessDialog(c: FileCollabInfo): void {
  accessForm.value = {
    id: c.id,
    fileName: c.fileName,
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
    );
    accessVisible.value = false;
    ElMessage.success("协同权限已更新");
    await loadCollabs();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "更新权限失败");
  } finally {
    savingAccess.value = false;
  }
}

/* ==================== 删除 ==================== */

async function onDelete(c: FileCollabInfo): Promise<void> {
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
    await deleteFileCollab(c.id);
    ElMessage.success("协同文档已删除");
    await loadCollabs();
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "删除协同失败");
  }
}

/* ==================== 协同编辑 ==================== */

const editorVisible = ref(false);
const editorFileName = ref("");
const editorCollab = ref<FileCollabInfo | null>(null);
const editorSnapshot = ref("");
const editorVersion = ref(0);

/** 打开协同编辑（列表行） */
function openEditor(c: FileCollabInfo): void {
  editorCollab.value = c;
  editorFileName.value = c.fileName;
  editorSnapshot.value = c.snapshot ?? "";
  editorVersion.value = c.version ?? 0;
  editorVisible.value = true;
}

/** 按 id 打开（创建后直接进入） */
async function openEditorFromId(id: string): Promise<void> {
  const c = collabs.value.find((x) => x.id === id) ?? collabs.value[0];
  if (c) openEditor(c);
}

onMounted(() => {
  void loadCollabs();
  void loadUsers();
});
</script>

<style scoped>
.collab-manage-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 概览条 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md, 10px);
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  background: var(--el-bg-color, #fff);
  padding: 14px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.stat-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500, #409eff));
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  font-variant-numeric: tabular-nums;
}
.stat-trend {
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}

/* 工具栏 */
.cm-toolbar {
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.cm-search {
  flex: 1;
  min-width: 200px;
}
.cm-filter {
  width: 130px;
}

/* 列表 */
.cm-list-wrap {
  padding: 12px;
  min-height: 240px;
}
.md-card-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-bottom: 10px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
}
.md-card-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.cm-hint {
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.cm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 48px 0;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.cm-empty-icon {
  font-size: 34px;
}
.cm-empty-sub {
  font-size: 12px;
  opacity: 0.75;
}
.cm-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cm-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-subtle, var(--el-border-color-lighter, #e8ebf0));
  border-radius: var(--radius-md, 8px);
  background: var(--el-color-primary-light-9, #f8faff);
  transition: border-color 0.15s;
}
.cm-item:hover {
  border-color: var(--brand-500, #409eff);
}
.cm-item-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  cursor: pointer;
}
.cm-file-icon {
  font-size: 22px;
  line-height: 1;
}
.cm-file-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.cm-file-name {
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cm-file-sub {
  font-size: 11px;
  color: var(--text-secondary, var(--el-text-color-secondary, #909399));
}
.cm-item-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.cm-dialog-body {
  padding-top: 6px;
}
.cm-form-file {
  font-size: 13px;
  color: var(--text-primary, var(--el-text-color-primary, #303133));
}
.cm-user-select {
  width: 100%;
}

:deep(.cm-editor-dialog .el-dialog__body) {
  padding: 10px;
  height: 72vh;
}

@media (max-width: 900px) {
  .stat-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>