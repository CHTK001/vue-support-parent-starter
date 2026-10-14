<template>
  <div class="prc">
    <div class="prc-body">
      <!-- 左：文件与备份 -->
      <aside class="prc-side">
        <div class="prc-side-head">
          <span class="prc-side-title">配置文件</span>
          <ReButton icon="Refresh" text :title="'刷新列表'" data-testid="prc-btn-files" @click="loadFiles" />
        </div>
        <div class="prc-side-body">
          <div
            v-for="f in files"
            :key="f.path"
            class="prc-file"
            data-testid="prc-file"
            :class="{ active: f.path === currentPath }"
            :title="f.path"
            @click="openFile(f.path)"
          >
            <ReIcon name="Document" :size="13" />
            <span class="prc-filename">{{ shortName(f.path) }}</span>
            <span v-if="f.main" class="prc-main-tag">主</span>
          </div>
          <div v-if="!files.length && !filesLoading" class="prc-empty">未发现配置文件</div>
        </div>

        <div class="prc-side-head prc-side-head--backup">
          <span class="prc-side-title">备份记录</span>
          <ReButton icon="Refresh" text :title="'刷新备份'" data-testid="prc-btn-backups" @click="loadBackups" />
        </div>
        <div class="prc-side-body prc-side-body--backup">
          <div
            v-for="b in backups"
            :key="b.path"
            class="prc-file"
            data-testid="prc-backup"
            :title="b.path"
            @click="previewBackup(b)"
          >
            <ReIcon name="Clock" :size="13" />
            <span class="prc-filename">{{ shortName(b.path) }}</span>
            <span class="prc-size">{{ humanSize(b.size) }}</span>
          </div>
          <div v-if="!backups.length && !backupsLoading" class="prc-empty">暂无备份</div>
        </div>
      </aside>

      <!-- 右：编辑区 -->
      <section class="prc-main">
        <div class="prc-bar">
          <span class="prc-path" :title="currentPath">{{ currentPath || "请选择左侧配置文件" }}</span>
          <ReTag v-if="dirty" type="warning">未保存</ReTag>
        </div>

        <div class="prc-editor">
          <div class="prc-gutter">
            <div v-for="n in lineCount" :key="n" class="prc-lineno">{{ n }}</div>
          </div>
          <textarea
            v-model="content"
            class="prc-textarea"
            data-testid="prc-textarea"
            spellcheck="false"
            :disabled="loading || !currentPath"
            placeholder="选择左侧配置文件后在此编辑"
          />
          <div v-if="loading" class="prc-editor-mask">加载中…</div>
        </div>

        <div v-if="result" class="prc-result" :class="result.success ? 'is-ok' : 'is-fail'">
          <div class="prc-result-head">
            <ReIcon :name="result.success ? 'CircleCheck' : 'CircleClose'" :size="14" />
            <span>{{ result.message }}</span>
            <span v-if="result.validated === false" class="prc-result-sub">（未通过 promtool 校验）</span>
            <span v-if="!result.reloaded" class="prc-result-sub">（未重载）</span>
          </div>
          <ul v-if="result.steps?.length" class="prc-steps">
            <li v-for="(s, i) in result.steps" :key="i">{{ s }}</li>
          </ul>
          <pre v-if="result.output" class="prc-output">{{ result.output }}</pre>
        </div>

        <div class="prc-foot">
          <div class="prc-opts">
            <ReSwitch v-model="optBackup" aria-label="保存前备份" />
            <span class="prc-opt-label">保存前备份</span>
            <ReSwitch v-model="optValidate" aria-label="promtool 校验" />
            <span class="prc-opt-label">promtool 校验</span>
            <ReSwitch v-model="optReload" aria-label="保存后重载" />
            <span class="prc-opt-label">保存后重载</span>
          </div>
          <div class="prc-ops">
            <ReButton :loading="reloading" data-testid="prc-btn-reload" @click="doReload">
              <template #icon><ReIcon name="RefreshRight" :size="13" /></template>
              重载
            </ReButton>
            <ReButton type="primary" :disabled="!dirty || !currentPath" :loading="saving" data-testid="prc-btn-save" @click="doSave">
              <template #icon><ReIcon name="Check" :size="13" /></template>
              保存
            </ReButton>
          </div>
        </div>
      </section>
    </div>

    <!-- 备份预览 / 恢复 -->
    <ReDialog v-model="backupVisible" title="备份预览" width="760px">
      <div class="prc-backup-head">
        <span class="prc-path" :title="backupPreview?.path">{{ backupPreview?.path }}</span>
      </div>
      <pre class="prc-backup-content">{{ backupPreview?.content ?? "" }}</pre>
      <template #footer>
        <ReButton data-testid="prc-btn-restore-cancel" @click="backupVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="restoring" data-testid="prc-btn-restore-do" @click="doRestore">恢复此备份</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts" name="PromConfigPanel">
/**
 * Prometheus 配置面板（参考 nginx 控制台）：
 * 左侧文件 / 备份列表，右侧编辑 + 保存（临时文件 → promtool 校验 → 备份 → 覆盖 → 重载）。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref, watch } from "vue";

import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReSwitch from "@repo/ui/re-switch";
import ReTag from "@repo/ui/re-tag";
import {
  fetchPrometheusBackups,
  fetchPrometheusConfig,
  fetchPrometheusConfigFiles,
  reloadPrometheusConfig,
  restorePrometheusBackup,
  savePrometheusConfig,
  type PromApplyResult,
  type PromCommandResult,
  type PromConfig,
  type PromFile,
} from "../../../api/prometheus/api";

const props = defineProps<{
  datasourceId: number | null | undefined;
}>();

interface BackupPreview {
  path: string;
  content: string;
}

const files = ref<PromFile[]>([]);
const backups = ref<PromFile[]>([]);
const filesLoading = ref(false);
const backupsLoading = ref(false);
const loading = ref(false);
const saving = ref(false);
const reloading = ref(false);
const restoring = ref(false);
const currentPath = ref("");
const content = ref("");
const loadedContent = ref("");
const result = ref<(PromApplyResult & { output?: string }) | null>(null);
const commandResult = ref<PromCommandResult | null>(null);

const optBackup = ref(true);
const optValidate = ref(true);
const optReload = ref(true);

const backupVisible = ref(false);
const backupPreview = ref<BackupPreview | null>(null);
const pendingRestore = ref<PromFile | null>(null);

const dirty = computed(() => content.value !== loadedContent.value);
const lineCount = computed(() => content.value.split("\n").length);

function shortName(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

function humanSize(size: number | null | undefined): string {
  if (size === null || size === undefined) {
    return "";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

async function loadFiles(): Promise<void> {
  filesLoading.value = true;
  try {
    files.value = (await fetchPrometheusConfigFiles(props.datasourceId)) || [];
  } catch (e) {
    message.error(`读取配置文件列表失败：${(e as Error)?.message ?? e}`);
  } finally {
    filesLoading.value = false;
  }
}

async function loadBackups(): Promise<void> {
  backupsLoading.value = true;
  try {
    backups.value = (await fetchPrometheusBackups(props.datasourceId)) || [];
  } catch (e) {
    message.error(`读取备份列表失败：${(e as Error)?.message ?? e}`);
  } finally {
    backupsLoading.value = false;
  }
}

async function openFile(path: string): Promise<void> {
  if (dirty.value && !window.confirm("当前文件有未保存修改，切换将丢失，继续？")) {
    return;
  }
  loading.value = true;
  result.value = null;
  commandResult.value = null;
  try {
    const config: PromConfig = await fetchPrometheusConfig(props.datasourceId, path);
    currentPath.value = config.path || path;
    content.value = config.content ?? "";
    loadedContent.value = content.value;
  } catch (e) {
    message.error(`读取配置失败：${(e as Error)?.message ?? e}`);
  } finally {
    loading.value = false;
  }
}

async function doSave(): Promise<void> {
  if (!currentPath.value) {
    return;
  }
  saving.value = true;
  result.value = null;
  try {
    const apply = await savePrometheusConfig({
      datasourceId: props.datasourceId,
      path: currentPath.value,
      content: content.value,
      backup: optBackup.value,
      validate: optValidate.value,
      reload: optReload.value,
    });
    result.value = apply;
    if (apply.success) {
      loadedContent.value = content.value;
      message.success(apply.message || "保存成功");
      void loadBackups();
    } else {
      message.error(apply.message || "保存失败");
    }
  } catch (e) {
    message.error(`保存失败：${(e as Error)?.message ?? e}`);
  } finally {
    saving.value = false;
  }
}

async function doReload(): Promise<void> {
  reloading.value = true;
  commandResult.value = null;
  try {
    const cmd = await reloadPrometheusConfig(props.datasourceId);
    commandResult.value = cmd;
    if (cmd.success) {
      message.success(cmd.message || "重载成功");
    } else {
      message.error(cmd.message || "重载失败");
    }
  } catch (e) {
    message.error(`重载失败：${(e as Error)?.message ?? e}`);
  } finally {
    reloading.value = false;
  }
}

async function previewBackup(b: PromFile): Promise<void> {
  try {
    const config = await fetchPrometheusConfig(props.datasourceId, b.path);
    backupPreview.value = { path: config.path || b.path, content: config.content ?? "" };
    pendingRestore.value = b;
    backupVisible.value = true;
  } catch (e) {
    message.error(`读取备份失败：${(e as Error)?.message ?? e}`);
  }
}

async function doRestore(): Promise<void> {
  if (!pendingRestore.value) {
    return;
  }
  restoring.value = true;
  try {
    const apply = await restorePrometheusBackup(props.datasourceId, pendingRestore.value.path);
    backupVisible.value = false;
    result.value = apply;
    if (apply.success) {
      message.success(apply.message || "恢复成功");
      if (currentPath.value) {
        await openFile(currentPath.value);
      }
      void loadBackups();
    } else {
      message.error(apply.message || "恢复失败");
    }
  } catch (e) {
    message.error(`恢复失败：${(e as Error)?.message ?? e}`);
  } finally {
    restoring.value = false;
  }
}

watch(
  () => props.datasourceId,
  () => {
    currentPath.value = "";
    content.value = "";
    loadedContent.value = "";
    result.value = null;
    void loadFiles();
    void loadBackups();
  }
);

onMounted(async () => {
  await Promise.all([loadFiles(), loadBackups()]);
  // 默认打开主配置文件，进页面即可编辑
  const main = files.value.find(f => f.main) ?? files.value[0];
  if (main) {
    await openFile(main.path);
  }
});
</script>

<style scoped lang="scss">
.prc { display: flex; flex-direction: column; height: 100%; }
.prc-body {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 6px;
  flex: 1;
  min-height: 480px;
}
.prc-side {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
  min-height: 0;
}
.prc-side-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
  &--backup { border-top: 1px solid var(--border-subtle); }
}
.prc-side-title { font-size: 12px; font-weight: 600; color: var(--text-tertiary); }
.prc-side-body {
  overflow-y: auto;
  padding: 4px 0;
  flex: 1 1 40%;
  min-height: 80px;
  &--backup { flex: 1 1 60%; }
}
.prc-file {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  font-size: 12px;
  color: var(--text-primary);
  cursor: pointer;
  &:hover { background: var(--bg-hover); }
  &.active { background: var(--brand-50); color: var(--brand-600); font-weight: 600; }
}
.prc-filename { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prc-main-tag {
  flex-shrink: 0;
  font-size: 10px;
  padding: 0 4px;
  border-radius: 3px;
  background: color-mix(in srgb, var(--brand-500) 16%, transparent);
  color: var(--brand-600);
}
.prc-size { flex-shrink: 0; font-size: 11px; color: var(--text-tertiary); }
.prc-empty { text-align: center; font-size: 12px; color: var(--text-tertiary); padding: 16px 0; }

.prc-main {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  background: var(--bg-container);
  overflow: hidden;
  min-height: 0;
}
.prc-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.prc-path {
  flex: 1;
  font-size: 12px;
  font-family: ui-monospace, Consolas, monospace;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.prc-editor {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 240px;
  overflow: hidden;
  background: var(--bg-elevated);
}
.prc-gutter {
  width: 44px;
  flex-shrink: 0;
  padding: 8px 6px;
  overflow: hidden;
  text-align: right;
  border-right: 1px solid var(--border-subtle);
  background: var(--bg-fill);
  user-select: none;
}
.prc-lineno { font-size: 11px; line-height: 1.7; color: var(--text-tertiary); font-family: ui-monospace, Consolas, monospace; }
.prc-textarea {
  flex: 1;
  resize: none;
  border: 0;
  outline: none;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.7;
  font-family: ui-monospace, Consolas, monospace;
  color: var(--text-primary);
  background: transparent;
  white-space: pre;
  overflow: auto;
}
.prc-editor-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--text-tertiary);
  background: color-mix(in srgb, var(--bg-container) 72%, transparent);
}
.prc-result {
  flex-shrink: 0;
  padding: 8px 10px;
  border-top: 1px solid var(--border-subtle);
  font-size: 12px;
  &.is-ok { color: var(--status-success); }
  &.is-fail { color: var(--status-error); }
}
.prc-result-head { display: flex; align-items: center; gap: 6px; font-weight: 600; }
.prc-result-sub { font-weight: 400; color: var(--text-tertiary); }
.prc-steps { margin: 6px 0 0 18px; padding: 0; color: var(--text-secondary); }
.prc-steps li { line-height: 1.7; }
.prc-output {
  margin: 6px 0 0;
  padding: 6px 8px;
  border-radius: 4px;
  background: var(--bg-fill);
  color: var(--text-secondary);
  font-size: 11px;
  max-height: 120px;
  overflow: auto;
  white-space: pre-wrap;
}
.prc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 10px;
  border-top: 1px solid var(--border-subtle);
  flex-shrink: 0;
}
.prc-opts { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
.prc-opt-label { margin-right: 8px; }
.prc-ops { display: flex; gap: 8px; }
.prc-backup-head { margin-bottom: 8px; }
.prc-backup-content {
  margin: 0;
  padding: 10px;
  max-height: 52vh;
  overflow: auto;
  border-radius: 6px;
  background: var(--bg-fill);
  font-size: 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}
</style>