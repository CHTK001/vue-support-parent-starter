<template>
  <ScDrawer
    v-model="visible"
    size="1220px"
    destroy-on-close
    append-to-body
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
            <el-tooltip
              v-if="canNavigateParentDirectory"
              content="返回上级目录"
              placement="top"
            >
              <ScButton
                circle
                @click="$emit('open-parent-directory')"
              >
                <IconifyIconOnline icon="ri:arrow-up-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="刷新目录" placement="top">
              <ScButton circle @click="$emit('refresh')">
                <IconifyIconOnline icon="ri:refresh-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="新建目录" placement="top">
              <ScButton circle @click="$emit('create-folder')">
                <IconifyIconOnline icon="ri:folder-add-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip content="上传文件" placement="top">
              <ScButton circle @click="$emit('trigger-upload')">
                <IconifyIconOnline icon="ri:upload-2-line" />
              </ScButton>
            </el-tooltip>
            <el-tooltip :content="watchEnabled ? '停止追尾' : '开启追尾'" placement="top">
              <ScButton
                circle
                :type="watchEnabled ? 'danger' : 'success'"
                @click="$emit('toggle-watch')"
              >
                <IconifyIconOnline
                  :icon="watchEnabled ? 'ri:stop-circle-line' : 'ri:radar-line'"
                />
              </ScButton>
            </el-tooltip>
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
                    <div class="server-file-item__meta-grid">
                      <span>{{ entry.directory ? "目录" : "文件" }}</span>
                      <span>{{ formatFilePermissions(entry) }}</span>
                      <span>{{ formatFileOwner(entry) }}</span>
                      <span>{{ formatFileGroup(entry) }}</span>
                    </div>
                  </div>
                </div>
                <div class="server-action-row">
                  <ScButton circle @click.stop="$emit('rename-entry', entry)">
                    <IconifyIconOnline icon="ri:edit-line" />
                  </ScButton>
                  <ScButton
                    circle
                    :disabled="entry.directory"
                    @click.stop="$emit('download-entry', entry)"
                  >
                    <IconifyIconOnline icon="ri:download-2-line" />
                  </ScButton>
                  <ScButton
                    circle
                    type="danger"
                    plain
                    @click.stop="$emit('remove-entry', entry)"
                  >
                    <IconifyIconOnline icon="ri:delete-bin-6-line" />
                  </ScButton>
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
                  <div class="server-file-item__meta-grid">
                    <span>{{ entry.directory ? "目录" : "文件" }}</span>
                    <span>{{ formatFilePermissions(entry) }}</span>
                    <span>{{ formatFileOwner(entry) }}</span>
                    <span>{{ formatFileGroup(entry) }}</span>
                  </div>
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
                    previewType === "text"
                      ? preview?.truncated
                        ? "当前内容为截断预览，暂不允许直接同步"
                        : dirty
                          ? "内容已修改，点击同步写回服务器"
                          : "支持文本编辑与日志实时追尾"
                      : previewType === "image"
                        ? "图片预览"
                        : previewType === "pdf"
                          ? "PDF 文档预览"
                          : "文件信息 — 不支持在线预览"
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
                  {{ fileExtensionLabel }}
                </el-tag>
                <template v-if="previewType === 'text'">
                  <el-tooltip v-if="dirty" content="还原修改" placement="top">
                    <ScButton circle size="small" plain @click="$emit('reset-draft')">
                      <IconifyIconOnline icon="ri:refresh-line" />
                    </ScButton>
                  </el-tooltip>
                  <el-tooltip v-if="dirty" content="同步到服务器" placement="top">
                    <ScButton
                      circle
                      size="small"
                      type="primary"
                      :loading="saving"
                      @click="$emit('save-draft')"
                    >
                      <IconifyIconOnline icon="ri:save-line" />
                    </ScButton>
                  </el-tooltip>
                </template>
              </div>
            </div>
            <!-- 文本编辑器 -->
            <div
              v-if="previewPath && (previewType ?? 'text') === 'text'"
              v-loading="contentLoading"
              class="server-file-preview__editor"
            >
              <el-input
                type="textarea"
                :model-value="draftContent"
                :readonly="editorReadonly"
                :autosize="{ minRows: 18, maxRows: 24 }"
                @update:model-value="updateDraftContent"
              />
            </div>

            <!-- 图片预览 -->
            <div
              v-else-if="previewPath && previewType === 'image'"
              class="server-file-preview__image"
            >
              <img
                :src="previewUrl"
                :alt="displayPreviewPath"
                @error="onImageError"
              />
            </div>

            <!-- PDF 预览 -->
            <div
              v-else-if="previewPath && previewType === 'pdf'"
              class="server-file-preview__pdf-wrapper"
            >
              <iframe
                :src="previewUrl"
                class="server-file-preview__pdf"
                frameborder="0"
                allowfullscreen
              />
            </div>

            <!-- 二进制/Office 文件信息 -->
            <div
              v-else-if="previewPath && (previewType === 'binary' || previewType === 'office')"
              class="server-file-preview__metadata"
            >
              <div class="server-file-preview__metadata-card">
                <div class="server-file-preview__metadata-icon">
                  <IconifyIconOnline :icon="binaryFileIcon" />
                </div>
                <div class="server-file-preview__metadata-fields">
                  <div class="server-file-preview__metadata-row">
                    <span class="server-file-preview__metadata-label">文件名</span>
                    <span class="server-file-preview__metadata-value">{{ fileName }}</span>
                  </div>
                  <div class="server-file-preview__metadata-row">
                    <span class="server-file-preview__metadata-label">类型</span>
                    <span class="server-file-preview__metadata-value">{{ fileExtensionLabel }}</span>
                  </div>
                  <div class="server-file-preview__metadata-row">
                    <span class="server-file-preview__metadata-label">路径</span>
                    <span class="server-file-preview__metadata-value">{{ previewPath }}</span>
                  </div>
                </div>
                <el-button type="primary" @click="downloadCurrentFile">
                  <IconifyIconOnline icon="ri:download-line" />
                  下载文件
                </el-button>
              </div>
            </div>

            <div v-else-if="!previewPath" class="server-file-preview__empty">
              <el-empty description="选择左侧文件后在这里预览" />
            </div>
          </div>
        </div>
      </section>
    </template>
    <el-empty v-else description="请选择服务器后再查看文件管理" />
  </ScDrawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { ScDrawer } from "@repo/components/ScDrawer";
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
  /** 预览类型: text | image | pdf | office | binary */
  previewType?: string;
  /** 图片/PDF 的预览 URL */
  previewUrl?: string;
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

const formatFilePermissions = (entry?: ServerFileEntryCard | null) => {
  const candidate = String(
    (entry as Record<string, unknown> | undefined)?.permissions ||
      (entry as Record<string, unknown> | undefined)?.permission ||
      "",
  ).trim();
  return candidate || "权限 --/--/--";
};

const formatFileOwner = (entry?: ServerFileEntryCard | null) => {
  const candidate = String(
    (entry as Record<string, unknown> | undefined)?.owner ||
      (entry as Record<string, unknown> | undefined)?.username ||
      "",
  ).trim();
  return `所有者 ${candidate || "--"}`;
};

const formatFileGroup = (entry?: ServerFileEntryCard | null) => {
  const candidate = String(
    (entry as Record<string, unknown> | undefined)?.group ||
      (entry as Record<string, unknown> | undefined)?.groupName ||
      "",
  ).trim();
  return `分组 ${candidate || "--"}`;
};

/** 从预览路径中提取文件扩展名标签 */
const fileExtensionLabel = computed(() => {
  if (props.previewType === "text" && props.preview?.language) {
    return props.preview.language;
  }
  const path = props.previewPath || "";
  const idx = path.lastIndexOf(".");
  return idx >= 0 ? path.slice(idx + 1).toLowerCase() : "未知";
});

/** 从预览路径中提取文件名 */
const fileName = computed(() => {
  const path = props.previewPath || "";
  const sep = path.includes("\\") ? "\\" : "/";
  const idx = path.lastIndexOf(sep);
  return idx >= 0 ? path.slice(idx + 1) : path;
});

/** 二进制/Office 文件的图标 */
const binaryFileIcon = computed(() => {
  const ext = fileExtensionLabel.value;
  if (["doc", "docx"].includes(ext)) return "ri:file-word-2-line";
  if (["xls", "xlsx"].includes(ext)) return "ri:file-excel-2-line";
  if (["ppt", "pptx"].includes(ext)) return "ri:file-ppt-2-line";
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "ri:file-zip-line";
  return "ri:file-line";
});

/** 图片加载失败时隐藏容器 */
const onImageError = (e: Event) => {
  const img = e.target as HTMLImageElement;
  img.style.display = "none";
};

/** 下载当前二进制/Office 文件 */
const downloadCurrentFile = () => {
  if (props.previewUrl) {
    window.open(props.previewUrl, "_blank");
  }
};
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
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: -40%;
    right: -10%;
    width: 180px;
    height: 180px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.12), transparent 70%);
    animation: fileHeroOrb 14s ease-in-out infinite;
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: -30%;
    left: 20%;
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.1), transparent 70%);
    animation: fileHeroOrb 18s ease-in-out infinite reverse;
    pointer-events: none;
  }
}

@keyframes fileHeroOrb {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(18px, -12px) scale(1.08); }
  66% { transform: translate(-10px, 10px) scale(0.92); }
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
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 14px 16px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(245, 158, 11, 0.08), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.92));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow:
    0 16px 28px rgba(15, 23, 42, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);

  :deep(.el-radio-button__inner) {
    border-radius: 14px;
    font-size: 12px;
    font-weight: 600;
  }
}

.server-file-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;

  :deep(.el-radio-group) {
    background: color-mix(in srgb, var(--el-fill-color-light) 88%, white);
    border-radius: 14px;
    padding: 2px;
  }

  :deep(.el-radio-button__inner) {
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    border: none;
  }
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

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 3px;

    &:hover {
      background: rgba(148, 163, 184, 0.5);
    }
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }
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
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92));
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
  position: relative;
  transition:
    border-color 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 0.22s ease;

  &::before {
    content: "";
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(245, 158, 11, 0.12));
    opacity: 0;
    transition: opacity 0.22s ease;
    z-index: -1;
    filter: blur(6px);
  }
}

.server-file-item.is-directory {
  cursor: pointer;
}

.server-file-item.is-file {
  cursor: text;
}

.server-file-item:hover,
.server-file-item.is-active {
  transform: translateY(-2px);
  border-color: rgba(14, 165, 233, 0.34);
  box-shadow:
    0 14px 24px rgba(15, 23, 42, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.82);

  &::before {
    opacity: 1;
  }
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

.server-file-item__meta-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
}

.server-file-item__meta-grid span {
  display: inline-flex;
  align-items: center;
  min-height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: #64748b;
  font-size: 11px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  transition: all 0.2s ease;
}

.server-file-item:hover .server-file-item__meta-grid span {
  background: color-mix(in srgb, var(--el-color-primary) 6%, white);
  border-color: color-mix(in srgb, var(--el-color-primary) 14%, transparent);
  color: #0369a1;
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
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.06));
  color: #0284c7;
  flex-shrink: 0;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.22s ease;
}

.server-file-item:hover .server-file-item__icon {
  transform: scale(1.08);
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), rgba(14, 165, 233, 0.1));
}

.server-file-preview {
  display: grid;
  gap: 12px;
  max-height: calc(100vh - 260px);
  overflow: hidden;

  :deep(.el-textarea__inner) {
    border-radius: 14px;
    font-family: "SF Mono", "Cascadia Code", "Consolas", monospace;
    font-size: 13px;
    line-height: 1.65;
    padding: 14px 16px;
    border-color: rgba(148, 163, 184, 0.18);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    &:focus {
      border-color: rgba(14, 165, 233, 0.4);
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
    }
  }
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

/* ===== 图片预览 ===== */
.server-file-preview__image {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  max-height: calc(100vh - 320px);
  overflow: auto;
  padding: 16px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.14);
}

.server-file-preview__image img {
  max-width: 100%;
  max-height: 65vh;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
}

/* ===== PDF 预览 ===== */
.server-file-preview__pdf-wrapper {
  height: calc(100vh - 320px);
  border-radius: 18px;
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(255, 255, 255, 0.72);
}

.server-file-preview__pdf {
  width: 100%;
  height: 100%;
  border: none;
}

/* ===== 二进制/Office 文件信息卡片 ===== */
.server-file-preview__metadata {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  padding: 24px;
}

.server-file-preview__metadata-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px 40px;
  border-radius: 24px;
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.94));
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.server-file-preview__metadata-icon {
  width: 64px;
  height: 64px;
  display: grid;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(14, 165, 233, 0.15), rgba(14, 165, 233, 0.06));
  color: #0284c7;
  font-size: 32px;
}

.server-file-preview__metadata-fields {
  width: 100%;
  display: grid;
  gap: 10px;
}

.server-file-preview__metadata-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.server-file-preview__metadata-label {
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.server-file-preview__metadata-value {
  color: #0f172a;
  font-size: 13px;
  font-weight: 500;
  word-break: break-all;
  text-align: right;
  max-width: 60%;
}

.server-file-preview__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

@media (max-width: 1100px) {
  .server-file-grid {
    grid-template-columns: 1fr;
  }
}
</style>