<script setup lang="ts">
/**
 * 文件存储服务页
 *
 * 对接独立文件存储服务器（FileStorageServerFilter），提供类 Windows 资源管理器体验：
 * 目录点击进入（面包屑导航）、文件弹窗预览（图片大图查看 / 文本 / PDF / 音视频）、
 * 上传（支持当前子目录）、下载、存在性检查与删除。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Back,
  Delete,
  Document,
  Download,
  Folder,
  FolderOpened,
  Refresh,
  Search,
  Upload,
} from "@element-plus/icons-vue";
import {
  DEFAULT_BUCKET,
  DEFAULT_SERVER,
  deleteObject,
  existObject,
  fetchObjectText,
  getDefaultBucket,
  getServerBase,
  listObjects,
  objectUrl,
  putObject,
  setDefaultBucket,
  setServerBase,
} from "../api/filestorageApi";
import type { StorageObject } from "../api/filestorageApi";

/** 预览类型 */
type PreviewKind = "image" | "text" | "pdf" | "office" | "video" | "audio" | "font" | "unknown";

/* ================== 连接配置 ================== */

/** 服务器地址 */
const server = ref(getServerBase() || DEFAULT_SERVER);
/** 存储桶名称 */
const bucket = ref(getDefaultBucket() || DEFAULT_BUCKET);
/** 当前目录（空字符串表示根目录） */
const currentPath = ref("");
/** 对象列表 */
const objects = ref<StorageObject[]>([]);
/** 加载状态 */
const loading = ref(false);
/** 关键字过滤 */
const keyword = ref("");

/**
 * 面包屑片段（根目录 + 各级目录名）
 */
const breadcrumbs = computed(() => {
  const segments = currentPath.value ? currentPath.value.split("/") : [];
  return [{ name: "根目录", path: "" }, ...segments.map((name, index) => ({
    name,
    path: segments.slice(0, index + 1).join("/"),
  }))];
});

/**
 * 过滤后的对象列表
 */
const filteredObjects = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  if (!kw) return objects.value;
  return objects.value.filter((item) => item.name.toLowerCase().includes(kw));
});

/**
 * 文件对象数量
 */
const fileCount = computed(() => objects.value.filter((item) => !item.directory).length);

/**
 * 目录数量
 */
const dirCount = computed(() => objects.value.filter((item) => item.directory).length);

/**
 * 对象总大小（字节）
 */
const totalSize = computed(() =>
  objects.value.reduce((sum, item) => sum + (item.directory ? 0 : item.size || 0), 0),
);

/**
 * 格式化字节大小
 *
 * @param bytes 字节数
 * @return 可读字符串
 */
function formatSize(bytes?: number): string {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * 格式化修改时间
 *
 * @param ts 毫秒时间戳
 * @return 可读字符串
 */
function formatTime(ts?: number): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleString();
}

/**
 * 根据扩展名推断预览类型
 *
 * @param name 文件名
 * @return 预览类型
 */
function kindOf(name: string): PreviewKind {
  const ext = name.slice(name.lastIndexOf(".") + 1).toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico"].includes(ext)) return "image";
  if (["txt", "log", "json", "xml", "html", "css", "js", "ts", "md", "yaml", "yml", "csv"].includes(ext)) return "text";
  if (ext === "pdf") return "pdf";
  if (["xlsx", "xls", "docx", "doc", "pptx", "ppt", "odt", "ods", "odp", "vsd",
       "dwg", "dgn", "step", "stp", "iges", "igs", "brep",
       "xlsb", "xlt", "xltx", "xltm", "xlam", "xlsxml",
       "dotx", "dotm", "potx", "potm"].includes(ext)) return "office";
  if (["mp4", "webm", "ogg", "mov", "avi", "mkv", "flv", "wmv", "m4v", "3gp"].includes(ext)) return "video";
  if (["mp3", "wav", "flac", "m4a"].includes(ext)) return "audio";
  if (["ttf", "otf", "woff", "woff2", "eot"].includes(ext)) return "font";
  return "unknown";
}

/**
 * 拼接完整对象 Key
 *
 * @param name 对象名
 * @return 含当前目录前缀的 Key
 */
function fullKey(name: string): string {
  return currentPath.value ? `${currentPath.value}/${name}` : name;
}

/* ================== 目录导航 ================== */

/**
 * 加载当前目录对象列表
 */
async function loadObjects(): Promise<void> {
  loading.value = true;
  try {
    objects.value = await listObjects(bucket.value, currentPath.value);
    setServerBase(server.value);
    setDefaultBucket(bucket.value);
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "连接文件存储服务器失败");
    objects.value = [];
  } finally {
    loading.value = false;
  }
}

/**
 * 进入子目录
 *
 * @param row 行数据
 */
function enterDir(row: StorageObject): void {
  currentPath.value = fullKey(row.name);
  loadObjects();
}

/**
 * 跳转到面包屑对应层级
 *
 * @param path 目标路径（空表示根目录）
 */
function goCrumb(path: string): void {
  currentPath.value = path;
  loadObjects();
}

/**
 * 返回上一级目录
 */
function goUp(): void {
  if (!currentPath.value) return;
  const index = currentPath.value.lastIndexOf("/");
  currentPath.value = index > 0 ? currentPath.value.slice(0, index) : "";
  loadObjects();
}

/* ================== 上传 ================== */

const uploadVisible = ref(false);
const uploading = ref(false);
const uploadInput = ref<HTMLInputElement>();

/**
 * 打开上传对话框
 */
function openUpload(): void {
  uploadVisible.value = true;
}

/**
 * 触发文件选择
 */
function pickFiles(): void {
  uploadInput.value?.click();
}

/**
 * 处理文件选择并逐个上传到当前目录
 *
 * @param event 输入框变更事件
 */
async function handleFileChange(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  if (!files.length) return;

  uploading.value = true;
  let success = 0;
  try {
    for (const file of files) {
      await putObject(bucket.value, fullKey(file.name), file);
      success += 1;
    }
    ElMessage.success(`成功上传 ${success} 个文件`);
    uploadVisible.value = false;
    await loadObjects();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "上传失败");
  } finally {
    uploading.value = false;
  }
}

/* ================== 弹窗预览 ================== */

const previewVisible = ref(false);
const previewLoading = ref(false);
/** 预览对象名 */
const previewName = ref("");
/** 预览类型 */
const previewKind = ref<PreviewKind>("unknown");
/** 文本类内容 */
const previewText = ref("");
/** 预览对象 Key（用于 image/pdf/video/audio 直链） */
const previewKey = ref("");

/**
 * 打开预览弹窗
 *
 * 图片使用 el-image 大图查看器（缩放/旋转/全屏）；
 * 文本类拉取内容展示；PDF/音视频内嵌原生标签；其余提示下载。
 *
 * @param row 行数据
 */
async function openPreview(row: StorageObject): Promise<void> {
  const kind = kindOf(row.name);
  previewName.value = row.name;
  previewKind.value = kind;
  previewText.value = "";
  previewKey.value = fullKey(row.name);
  previewVisible.value = true;

  if (kind === "text") {
    previewLoading.value = true;
    try {
      previewText.value = await fetchObjectText(bucket.value, fullKey(row.name));
    } catch (e) {
      ElMessage.error((e as Error)?.message ?? "内容读取失败");
      previewVisible.value = false;
    } finally {
      previewLoading.value = false;
    }
  }
}

/**
 * 预览对象的直链地址
 */
const previewSrc = computed(() => objectUrl(bucket.value, previewKey.value));

/* ================== 操作 ================== */

/**
 * 以附件方式下载对象
 *
 * @param row 行数据
 */
function handleDownload(row: StorageObject): void {
  window.open(objectUrl(bucket.value, fullKey(row.name), true), "_blank");
}

/**
 * 存在性检查（HEAD 请求演示）
 *
 * @param row 行数据
 */
async function handleExist(row: StorageObject): Promise<void> {
  try {
    const exists = await existObject(bucket.value, fullKey(row.name));
    if (exists) {
      ElMessage.success(`「${row.name}」存在`);
    } else {
      ElMessage.warning(`「${row.name}」不存在`);
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "检查失败");
  }
}

/**
 * 删除对象
 *
 * @param row 行数据
 */
async function handleDelete(row: StorageObject): Promise<void> {
  try {
    await ElMessageBox.confirm(`确认删除对象「${row.name}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确认删除",
    });
  } catch {
    return;
  }
  try {
    await deleteObject(bucket.value, fullKey(row.name));
    ElMessage.success("删除成功");
    await loadObjects();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  }
}

onMounted(() => {
  loadObjects();
});
</script>

<template>
  <div class="filesystem-page">
    <!-- 页面头部 -->
    <div class="filesystem-page__header">
      <div>
        <div class="filesystem-page__title">文件存储服务</div>
        <div class="filesystem-page__subtitle">
          直连独立文件存储服务器，类资源管理器目录浏览、弹窗预览、上传与删除
        </div>
      </div>
      <el-button type="primary" :icon="Upload" @click="openUpload">上传到当前目录</el-button>
    </div>

    <!-- 统计卡片 -->
    <div class="filesystem-page__stats">
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">对象总数</span>
        <span class="filesystem-page__stat-value">{{ objects.length }}</span>
      </div>
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">文件</span>
        <span class="filesystem-page__stat-value">{{ fileCount }}</span>
      </div>
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">目录</span>
        <span class="filesystem-page__stat-value">{{ dirCount }}</span>
      </div>
      <div class="filesystem-page__stat">
        <span class="filesystem-page__stat-label">总大小</span>
        <span class="filesystem-page__stat-value">{{ formatSize(totalSize) }}</span>
      </div>
    </div>

    <!-- 连接配置 -->
    <el-card shadow="never" class="filesystem-page__card">
      <div class="filestorage-conn">
        <el-input v-model="server" placeholder="服务器地址" clearable class="!w-72">
          <template #prepend>地址</template>
        </el-input>
        <el-input v-model="bucket" placeholder="存储桶" clearable class="!w-44">
          <template #prepend>存储桶</template>
        </el-input>
        <el-button type="primary" :icon="Search" :loading="loading" @click="loadObjects">连接</el-button>
        <el-button :icon="Refresh" @click="loadObjects">刷新</el-button>
        <el-divider direction="vertical" />
        <el-input
          v-model="keyword"
          placeholder="按名称过滤"
          clearable
          class="!w-56"
          :prefix-icon="Search"
        />
      </div>
    </el-card>

    <!-- 对象列表 -->
    <el-card shadow="never" class="filesystem-page__card">
      <!-- 工具栏：返回上级 + 面包屑 -->
      <div class="filestorage-toolbar">
        <el-button :icon="Back" :disabled="!currentPath" circle size="small" @click="goUp" />
        <el-breadcrumb separator="/">
          <el-breadcrumb-item
            v-for="crumb in breadcrumbs"
            :key="crumb.path || 'root'"
            :class="{ 'filestorage-crumb--active': crumb.path === currentPath }"
          >
            <span class="filestorage-crumb" @click="goCrumb(crumb.path)">{{ crumb.name }}</span>
          </el-breadcrumb-item>
        </el-breadcrumb>
      </div>

      <el-table
        :data="filteredObjects"
        v-loading="loading"
        stripe
        empty-text="暂无对象"
        @row-dblclick="(row: StorageObject) => (row.directory ? enterDir(row) : openPreview(row))"
      >
        <el-table-column label="名称" min-width="300">
          <template #default="{ row }">
            <div
              class="filestorage-name"
              :class="{ 'filestorage-name--dir': row.directory }"
              @click="row.directory && enterDir(row)"
              @dblclick="row.directory ? enterDir(row) : openPreview(row)"
            >
              <el-icon :size="18" :class="row.directory ? 'filestorage-icon--dir' : 'filestorage-icon--file'">
                <FolderOpened v-if="row.directory" />
                <Document v-else />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.directory ? 'warning' : 'info'" size="small">
              {{ row.directory ? "目录" : kindOf(row.name) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="大小" width="110" align="center">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="修改时间" width="180" align="center">
          <template #default="{ row }">{{ formatTime(row.lastModified) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" align="center" fixed="right">
          <template #default="{ row }">
            <template v-if="row.directory">
              <el-button text type="primary" :icon="FolderOpened" @click="enterDir(row)">打开</el-button>
            </template>
            <template v-else>
              <el-button text type="primary" :icon="Search" @click="openPreview(row)">预览</el-button>
              <el-button text type="primary" :icon="Download" @click="handleDownload(row)">下载</el-button>
            </template>
            <el-button text :icon="Search" :disabled="row.directory" @click="handleExist(row)">检查</el-button>
            <el-button text type="danger" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty description="当前目录为空，可点击右上角上传文件" />
        </template>
      </el-table>
    </el-card>

    <!-- 上传对话框 -->
    <el-dialog v-model="uploadVisible" title="上传文件" width="480px" destroy-on-close>
      <el-alert
        v-if="currentPath"
        :title="`将上传至：${bucket}/${currentPath}/`"
        type="info"
        :closable="false"
        class="mb-4"
      />
      <el-form label-width="90px">
        <el-form-item label="文件">
          <el-button :icon="Upload" :loading="uploading" @click="pickFiles">选择文件（可多选）</el-button>
        </el-form-item>
      </el-form>
      <input ref="uploadInput" type="file" multiple hidden @change="handleFileChange" />
    </el-dialog>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewName"
      width="720px"
      destroy-on-close
      append-to-body
    >
      <div v-loading="previewLoading" class="filestorage-preview">
        <!-- 图片：el-image 内置查看器（点击可全屏缩放/旋转） -->
        <template v-if="previewKind === 'image'">
          <el-image
            :src="previewSrc"
            :preview-src-list="[previewSrc]"
            fit="contain"
            class="filestorage-preview__image"
            hide-on-click-modal
          >
            <template #error>
              <el-empty description="图片加载失败" />
            </template>
          </el-image>
          <div class="filestorage-preview__tip">点击图片可进入全屏查看（滚轮缩放、旋转）</div>
        </template>

        <!-- PDF：内嵌 iframe（服务端支持 Range 分段加载） -->
        <iframe
          v-else-if="previewKind === 'pdf'"
          :src="previewSrc"
          class="filestorage-preview__frame"
        />

        <!-- Office 文档：服务端 SPI(Univer 等) 转 HTML 后 iframe 渲染 -->
        <iframe
          v-else-if="previewKind === 'office'"
          :src="previewSrc + '?preview=true'"
          class="filestorage-preview__frame"
        />

        <!-- 视频 -->
        <video
          v-else-if="previewKind === 'video'"
          :src="previewSrc"
          controls
          class="filestorage-preview__media"
        />

        <!-- 音频 -->
        <audio v-else-if="previewKind === 'audio'" :src="previewSrc" controls class="w-full" />

        <!-- 字体 -->
        <iframe
          v-else-if="previewKind === 'font'"
          :src="previewSrc + '?preview=true'"
          class="filestorage-preview__frame"
        />

        <!-- 文本类 -->
        <pre v-else-if="previewKind === 'text'" class="filestorage-preview__code">{{ previewText }}</pre>

        <!-- 其他类型 -->
        <el-empty v-else description="该类型不支持在线预览">
          <el-button type="primary" :icon="Download" @click="handleDownload({ name: previewName } as StorageObject)">
            下载文件
          </el-button>
        </el-empty>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 连接配置行 */
.filestorage-conn {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

/* 列表工具栏：返回按钮 + 面包屑 */
.filestorage-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

/* 面包屑可点击项 */
.filestorage-crumb {
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: color 0.15s ease;
}

.filestorage-crumb:hover {
  color: var(--el-color-primary);
}

.filestorage-crumb--active .filestorage-crumb {
  color: var(--el-text-color-primary);
  font-weight: 600;
}

/* 名称单元格 */
.filestorage-name {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  padding: 2px 6px;
  margin-left: -6px;
  border-radius: 6px;
  cursor: default;
}

/* 目录名称可点击 */
.filestorage-name--dir {
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.filestorage-name--dir:hover {
  background-color: var(--el-fill-color-light);
}

.filestorage-icon--dir {
  color: var(--el-color-warning);
  flex-shrink: 0;
}

.filestorage-icon--file {
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

/* 预览容器 */
.filestorage-preview {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.filestorage-preview__image {
  max-width: 100%;
  max-height: 60vh;
  border-radius: 8px;
}

.filestorage-preview__frame {
  width: 100%;
  height: 65vh;
  border: none;
  border-radius: 8px;
  background: var(--el-bg-color-page);
}

.filestorage-preview__media {
  max-width: 100%;
  border-radius: 8px;
}

.filestorage-preview__code {
  width: 100%;
  max-height: 60vh;
  margin: 0;
  padding: 14px 16px;
  overflow: auto;
  border-radius: 8px;
  background: var(--el-fill-color-lighter);
  color: var(--el-text-color-primary);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-all;
}

.filestorage-preview__tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
