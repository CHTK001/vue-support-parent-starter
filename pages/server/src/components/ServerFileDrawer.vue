<template>
  <el-drawer
    v-model="visible"
    size="1220px"
    destroy-on-close
    :title="host ? `${host.serverName} · 文件管理` : '文件管理'"
  >
    <template v-if="host">
      <section class="server-file-shell">
        <header class="server-file-shell__hero">
          <div>
            <p class="server-file-shell__eyebrow">File Workspace</p>
            <h3>相对路径视图 + 文本同步编辑</h3>
            <p class="server-file-shell__hint">
              左侧快速切换目录，右侧专注预览与编辑，减少无效层级和路径噪声。
            </p>
          </div>
          <div class="server-chip-group">
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              当前目录 {{ displayCurrentPath }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ liveStatus }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              预览 {{ previewLines }} 行
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              根目录 ./
            </el-tag>
          </div>
        </header>

        <div class="server-file-toolbar">
          <div class="server-action-row server-file-toolbar__actions">
            <el-radio-group v-model="viewMode" size="small">
              <el-radio-button label="list" value="list">列表</el-radio-button>
              <el-radio-button label="tree" value="tree">树状</el-radio-button>
            </el-radio-group>
            <el-button
              v-if="canNavigateParentDirectory"
              circle
              @click="$emit('open-parent-directory')"
            >
              <IconifyIconOnline icon="ri:arrow-up-line" />
            </el-button>
            <el-button circle @click="$emit('refresh')">
              <IconifyIconOnline icon="ri:refresh-line" />
            </el-button>
            <el-button circle @click="$emit('create-folder')">
              <IconifyIconOnline icon="ri:folder-add-line" />
            </el-button>
            <el-button circle @click="$emit('trigger-upload')">
              <IconifyIconOnline icon="ri:upload-2-line" />
            </el-button>
            <el-button
              circle
              :type="watchEnabled ? 'danger' : 'success'"
              @click="$emit('toggle-watch')"
            >
              <IconifyIconOnline
                :icon="watchEnabled ? 'ri:stop-circle-line' : 'ri:radar-line'"
              />
            </el-button>
          </div>
        </div>

        <input
          id="server-file-upload-input"
          :key="uploadInputKey"
          class="server-file-upload-input"
          type="file"
          @change="$emit('upload', $event)"
        />

        <div class="server-file-grid">
          <div v-loading="loading" class="server-file-list thin-scroller">
            <template v-if="viewMode === 'list'">
              <div
                v-for="entry in fileEntries"
                :key="entry.path"
                class="server-file-item"
                :class="{
                  'is-active': entry.path === previewPath,
                  'is-directory': entry.directory,
                  'is-file': entry.file,
                }"
                @click="$emit('open-entry', entry)"
              >
                <div class="server-file-item__main">
                  <span class="server-file-item__icon">
                    <IconifyIconOnline :icon="entry.icon" />
                  </span>
                  <div>
                    <strong>{{ entry.name }}</strong>
                    <p>{{ entry.relativePath }}</p>
                    <p>
                      {{ formatFileSize(entry.size) }} ·
                      {{ formatFileTime(entry.lastModified) }}
                    </p>
                  </div>
                </div>
                <div class="server-action-row">
                  <el-button circle @click.stop="$emit('rename-entry', entry)">
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                  <el-button
                    circle
                    :disabled="entry.directory"
                    @click.stop="$emit('download-entry', entry)"
                  >
                    <IconifyIconOnline icon="ri:download-2-line" />
                  </el-button>
                  <el-button
                    circle
                    type="danger"
                    plain
                    @click.stop="$emit('remove-entry', entry)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-6-line" />
                  </el-button>
                </div>
              </div>
              <el-empty
                v-if="!fileEntries.length"
                description="当前目录没有文件"
              />
            </template>
            <div v-else class="server-file-tree thin-scroller">
              <button
                v-for="entry in fileEntries"
                :key="entry.path"
                type="button"
                class="server-file-tree__node server-file-tree__node--classic"
                :class="{
                  'is-active': entry.path === previewPath,
                  'is-directory': entry.directory,
                }"
                @click="$emit('open-entry', entry)"
              >
                <span class="server-file-item__icon server-file-tree__icon">
                  <IconifyIconOnline :icon="entry.icon" />
                </span>
                <div class="server-file-tree__meta">
                  <strong>{{ entry.name }}</strong>
                  <p>{{ entry.relativePath }}</p>
                  <small>
                    {{ formatFileSize(entry.size) }} ·
                    {{ formatFileTime(entry.lastModified) }}
                  </small>
                </div>
              </button>
              <el-empty
                v-if="!fileEntries.length"
                description="当前根目录没有可展示的文件"
              />
            </div>
          </div>

          <div class="server-file-preview thin-scroller">
            <div class="server-file-preview__header">
              <div>
                <p class="server-file-preview__eyebrow">Preview</p>
                <h4>{{ displayPreviewPath || "选择文件查看内容" }}</h4>
                <p>
                  {{
                    preview?.truncated
                      ? "当前内容为截断预览，暂不允许直接同步"
                      : dirty
                        ? "内容已修改，点击同步写回服务器"
                        : "支持文本编辑与日志实时追尾"
                  }}
                </p>
              </div>
              <div class="server-file-preview__header-actions">
                <el-tag
                  class="server-inline-tag"
                  effect="plain"
                  round
                  size="small"
                >
                  {{ preview?.language || "text" }}
                </el-tag>
                <el-button v-if="dirty" size="small" plain @click="$emit('reset-draft')">
                  还原
                </el-button>
                <el-button
                  v-if="dirty"
                  size="small"
                  type="primary"
                  :loading="saving"
                  @click="$emit('save-draft')"
                >
                  同步
                </el-button>
              </div>
            </div>
            <div
              v-if="previewPath"
              v-loading="contentLoading"
              class="server-file-preview__editor"
            >
              <ScCodeEditor
                :model-value="draftContent"
                :read-only="editorReadonly"
                :height="'420px'"
                :mode="editorMode"
                @update:model-value="updateDraftContent"
              />
            </div>
            <el-empty v-else description="选择左侧文件后在这里预览" />
          </div>
        </div>
      </section>
    </template>
    <el-empty v-else description="请选择服务器后再查看文件管理" />
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScCodeEditor from "@repo/components/ScCodeEditor/index.vue";
import type { ServerFileContent, ServerHost } from "../api";
import type { FileViewMode, ServerFileEntryCard } from "./server-types";

const props = defineProps<{
  modelValue: boolean;
  host: ServerHost | null;
  loading: boolean;
  displayCurrentPath: string;
  liveStatus: string;
  previewLines: number | string;
  canNavigateParentDirectory: boolean;
  fileViewMode: FileViewMode;
  watchEnabled: boolean;
  uploadInputKey: number | string;
  fileEntries: ServerFileEntryCard[];
  previewPath: string;
  displayPreviewPath: string;
  preview: ServerFileContent | null;
  contentLoading: boolean;
  draftContent: string;
  editorReadonly: boolean;
  dirty: boolean;
  saving: boolean;
  editorMode: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:fileViewMode", value: FileViewMode): void;
  (event: "update:draftContent", value: string): void;
  (event: "refresh"): void;
  (event: "open-parent-directory"): void;
  (event: "create-folder"): void;
  (event: "trigger-upload"): void;
  (event: "toggle-watch"): void;
  (event: "upload", value: Event): void;
  (event: "open-entry", value: ServerFileEntryCard): void;
  (event: "rename-entry", value: ServerFileEntryCard): void;
  (event: "download-entry", value: ServerFileEntryCard): void;
  (event: "remove-entry", value: ServerFileEntryCard): void;
  (event: "reset-draft"): void;
  (event: "save-draft"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const viewMode = computed({
  get: () => props.fileViewMode,
  set: (value: FileViewMode) => emit("update:fileViewMode", value),
});

const updateDraftContent = (value: string) => {
  emit("update:draftContent", value);
};

const formatFileSize = (value?: number | null) => {
  const size = Number(value || 0);
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  if (size < 1024 * 1024 * 1024) {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const formatFileTime = (value?: string | null) => value || "未知时间";
</script>

<style scoped lang="scss">
.server-file-shell {
  display: grid;
  gap: 16px;
}

.server-file-shell__hero {
  display: grid;
  gap: 12px;
  padding: 20px 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 28px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.server-file-shell__hero h3,
.server-file-preview__header h4 {
  margin: 0;
  color: #0f172a;
}

.server-file-shell__eyebrow,
.server-file-preview__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0284c7;
}

.server-file-shell__hint,
.server-file-preview__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.server-file-toolbar {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-file-toolbar__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-file-upload-input {
  display: none;
}

.server-file-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(320px, 0.82fr) minmax(0, 1.18fr);
  min-height: 560px;
}

.server-file-list,
.server-file-preview {
  min-height: 0;
  padding: 16px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 22%),
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.08), transparent 32%),
    rgba(248, 250, 252, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow:
    0 20px 36px rgba(15, 23, 42, 0.06),
    inset 0 1px 0 rgba(255, 255, 255, 0.78);
}

.server-file-list {
  display: grid;
  align-content: start;
  gap: 8px;
  overflow: auto;
  max-height: calc(100vh - 260px);
}

.server-file-tree {
  min-height: 100%;
  display: grid;
  gap: 6px;
  align-content: start;
}

.server-file-tree__node {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 4px 8px;
}

.server-file-tree__node--classic {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.server-file-tree__node--classic:hover,
.server-file-tree__node--classic.is-active {
  transform: translateY(-1px);
  border-color: rgba(14, 165, 233, 0.3);
  box-shadow: 0 12px 20px rgba(15, 23, 42, 0.06);
}

.server-file-tree__icon {
  width: 26px;
  height: 26px;
  border-radius: 10px;
}

.server-file-tree__meta {
  min-width: 0;
  display: grid;
  gap: 2px;
}

.server-file-tree__meta strong {
  display: block;
  color: #0f172a;
  font-size: 13px;
  line-height: 1.1;
}

.server-file-tree__meta p {
  margin: 0;
  color: #64748b;
  font-size: 11px;
  line-height: 1.2;
}

.server-file-tree__meta small {
  color: #94a3b8;
  font-size: 11px;
  line-height: 1.2;
}

.server-file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.9));
  text-align: left;
  cursor: default;
  transition:
    border-color 0.18s ease,
    transform 0.18s ease,
    box-shadow 0.18s ease;
}

.server-file-item.is-directory {
  cursor: pointer;
}

.server-file-item.is-file {
  cursor: text;
}

.server-file-item:hover,
.server-file-item.is-active {
  transform: translateY(-1px);
  border-color: rgba(14, 165, 233, 0.34);
  box-shadow:
    0 14px 24px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);
}

.server-file-item__main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.server-file-item__main p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 11px;
}

.server-file-item__main strong {
  color: #0f172a;
  font-size: 13px;
}

.server-file-item__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: rgba(14, 165, 233, 0.12);
  color: #0284c7;
  flex-shrink: 0;
}

.server-file-preview {
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 260px);
  overflow: hidden;
}

.server-file-preview__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.14);
}

.server-file-preview__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-file-preview__editor {
  min-height: 0;
  overflow: hidden;
}

.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}

@media (max-width: 1100px) {
  .server-file-grid {
    grid-template-columns: 1fr;
  }
}
</style>
