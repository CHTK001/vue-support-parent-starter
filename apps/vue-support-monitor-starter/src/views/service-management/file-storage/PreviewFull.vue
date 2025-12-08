<template>
  <div class="fs-full">
    <aside :class="['fs-left', { collapsed }]">
      <div class="left-header">
        <div class="title">
          <IconifyIconOnline icon="ri:hard-drive-2-line" />
          已安装的存储
        </div>
        <div class="actions">
          <el-button size="small" type="primary" @click="addStorage">
            <IconifyIconOnline icon="ri:add-line" />
          </el-button>
          <el-button size="small" @click="reload">
            <IconifyIconOnline icon="ri:refresh-line" />
          </el-button>
        </div>
      </div>

      <el-scrollbar class="left-list thin-scrollbar">
        <div
          v-for="(s, idx) in storages"
          :key="idx"
          :class="['left-item', { active: selectedIndex === idx }]"
          @click="selectStorage(idx)"
        >
          <div class="row1">
            <span class="seq">#{{ idx + 1 }}</span>
            <span class="type">{{ s.fileStorageType }}</span>
            <el-tag
              size="small"
              :type="s.fileStorageEnabled ? 'success' : 'info'"
            >
              {{ s.fileStorageEnabled ? "启用" : "禁用" }}
            </el-tag>
          </div>
          <div class="row2">
            <span v-if="s.fileStorageType === 'FILESYSTEM'">
              {{ s.fileStorageEndpoint || "未配置路径" }}
            </span>
            <span v-else>
              {{ s.fileStorageBucket || "-" }} @
              {{ s.fileStorageEndpoint || "-" }}
            </span>
          </div>
          <div class="row3">
            <el-button link size="small" @click.stop="doPreview(idx)">
              <IconifyIconOnline icon="ri:eye-line" />
              预览
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </aside>

    <main class="fs-right">
      <div class="toolbar">
        <el-radio-group v-model="mode" size="small">
          <el-radio-button label="list">列表</el-radio-button>
          <el-radio-button label="card">卡片</el-radio-button>
          <el-radio-button label="image">大图</el-radio-button>
        </el-radio-group>
        <el-button size="small" @click="fetchPreviewItems">
          <IconifyIconOnline icon="ri:refresh-line" />
          刷新
        </el-button>
        <!-- 面包屑与上级 -->
        <div class="crumbs">
          <el-button size="small" @click="goUp" :disabled="!canGoUp"
            >上级</el-button
          >
          <el-breadcrumb separator="/" class="bc">
            <el-breadcrumb-item
              v-for="(c, i) in crumbs"
              :key="i"
              @click="onCrumbClick(i)"
              class="bc-item"
            >
              {{ c.name || "/" }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <!-- 服务器信息 -->
        <div class="server-info">
          <template v-if="serverInfo">
            <IconifyIconOnline icon="ri:server-line" />
            <span class="si-name" :title="serverInfo.monitorSysGenServerName">
              {{ serverInfo.monitorSysGenServerName }}
            </span>
            <span
              class="si-addr"
              :title="
                serverInfo.monitorSysGenServerHost +
                ':' +
                serverInfo.monitorSysGenServerPort
              "
            >
              {{ serverInfo.monitorSysGenServerHost }}:{{
                serverInfo.monitorSysGenServerPort
              }}
            </span>
          </template>
          <template v-else>
            <IconifyIconOnline icon="ri:server-line" />
            <span class="si-name">服务器: -</span>
          </template>
        </div>
        <div class="spacer" />
        <div class="pager">
          <span>每页</span>
          <el-select
            v-model="pager.limit"
            size="small"
            style="width: 90px"
            @change="onLimitChange"
          >
            <el-option :value="20" label="20" />
            <el-option :value="50" label="50" />
            <el-option :value="100" label="100" />
          </el-select>
          <span>条</span>
          <span class="gap" />
          <el-button
            size="small"
            @click="goPrevPage"
            :disabled="pager.page <= 1"
            >上一页</el-button
          >
          <el-button
            size="small"
            @click="goNextPage"
            :disabled="previewItems.length < pager.limit"
            >下一页</el-button
          >
        </div>
      </div>

      <div
        class="preview-body thin-scrollbar"
        :class="{ 'drag-over': isDragOver }"
        @dragover.prevent="onDragOver"
        @dragleave.prevent="onDragLeave"
        @drop.prevent="onDrop"
      >
        <!-- 拖拽上传提示层 -->
        <div v-if="isDragOver" class="drop-overlay">
          <div class="drop-content">
            <IconifyIconOnline
              icon="ri:upload-cloud-2-line"
              class="drop-icon"
            />
            <div class="drop-text">拖放文件到此处上传</div>
            <div class="drop-hint">支持图片和小文件（10MB以内）</div>
          </div>
        </div>
        <!-- 上传进度 -->
        <div v-if="uploadingFiles.length > 0" class="upload-progress">
          <div v-for="(f, i) in uploadingFiles" :key="i" class="upload-item">
            <span class="upload-name">{{ f.name }}</span>
            <el-progress
              :percentage="f.progress"
              :status="f.status"
              :stroke-width="6"
              style="flex: 1"
            />
          </div>
        </div>
        <template v-if="mode === 'list'">
          <div class="list-view">
            <div
              v-for="it in previewItems"
              :key="it.id"
              :class="['list-item', getFileCategory(it)]"
              @click="onItemClick(it)"
            >
              <div class="list-icon">
                <img :src="getFileThumb(it)" alt="" />
              </div>
              <div class="list-info">
                <div class="list-name" :title="it.name">{{ it.name }}</div>
                <div class="list-meta">
                  <el-tag
                    :type="getFileTagType(it)"
                    size="small"
                    effect="plain"
                  >
                    {{ getFileTypeLabel(it) }}
                  </el-tag>
                  <span class="list-size">{{ formatSize(it.size) }}</span>
                  <span class="list-time">{{ it.modified }}</span>
                </div>
              </div>
              <div class="list-actions">
                <el-button link size="small" @click.stop="onItemClick(it)">
                  <IconifyIconOnline icon="ri:eye-line" />
                </el-button>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="mode === 'card'">
          <div class="card-grid">
            <div
              v-for="it in previewItems"
              :key="it.id"
              :class="['file-card', getFileCategory(it)]"
              @click="onItemClick(it)"
            >
              <div :class="['card-badge', getFileCategory(it)]">
                {{ getFileTypeLabel(it) }}
              </div>
              <div class="thumb-wrap">
                <template v-if="isImage(it)">
                  <el-image
                    :key="getImageUrl(it)"
                    :src="getImageUrl(it)"
                    fit="cover"
                    lazy
                  >
                    <template #placeholder>
                      <div class="img-skeleton" />
                    </template>
                    <template #error>
                      <div class="img-error">
                        <span>加载失败</span>
                        <el-button size="small" @click.stop="retryImage(it)"
                          >重试</el-button
                        >
                      </div>
                    </template>
                  </el-image>
                </template>
                <template v-else>
                  <div class="file-icon-wrap">
                    <img :src="getFileThumb(it)" class="ph-img" />
                  </div>
                </template>
              </div>
              <div class="card-footer">
                <div class="card-name" :title="it.name">{{ it.name }}</div>
                <div class="card-meta">
                  <span class="card-size">{{ formatSize(it.size) }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="image-grid">
            <div
              v-for="it in previewItems"
              :key="it.id"
              :class="['img-card', getFileCategory(it)]"
              @click="onItemClick(it)"
            >
              <div :class="['img-badge', getFileCategory(it)]">
                {{ getFileTypeLabel(it) }}
              </div>
              <template v-if="isImage(it)">
                <el-image
                  :key="getImageUrl(it)"
                  :src="getImageUrl(it)"
                  fit="cover"
                  lazy
                >
                  <template #placeholder>
                    <div class="img-skeleton" />
                  </template>
                  <template #error>
                    <div class="img-error">
                      <span>加载失败</span>
                      <el-button size="small" @click.stop="retryImage(it)"
                        >重试</el-button
                      >
                    </div>
                  </template>
                </el-image>
              </template>
              <template v-else>
                <div class="big-icon-wrap">
                  <img :src="getFileThumb(it)" alt="file" class="big-icon" />
                </div>
              </template>
              <div class="overlay">
                <div class="ov-name" :title="it.name">{{ it.name }}</div>
                <div class="ov-meta">
                  <span class="ov-size">{{ formatSize(it.size) }}</span>
                  <span class="ov-time">{{ it.modified }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </main>
    <!-- 预览弹窗：非图片文件用 iframe 预览（?preview） -->
    <el-dialog
      v-model="previewDialogVisible"
      width="80%"
      top="20px"
      title="预览"
    >
      <iframe
        v-if="previewUrl"
        :src="previewUrl"
        style="width: 100%; height: 70vh; border: none"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";

import {
  getFileStorageConfig,
  getSystemServerSettingByServerId,
  type FileStorageConfig,
  type SystemServerSetting,
} from "@/api/system-server-setting";
import { getSystemServerById, type SystemServer } from "@/api/system-server";
import {
  fileStorageList,
  uploadSmallFile,
} from "@/api/file-manager/file-storage";
import {
  createFileIconManager,
  getFileCategory as getFileCategoryUtil,
  getFileTypeLabel as getFileTypeLabelUtil,
  getFileTagType as getFileTagTypeUtil,
  isImageFile,
  type FileItem,
  type TagType,
} from "@repo/utils";

// 批量导入所有图标图片
const iconModules = import.meta.glob("@/assets/images/*.{png,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

// 创建文件图标管理器
const iconManager = createFileIconManager(
  iconModules,
  iconModules["/src/assets/images/unknown.png"] || ""
);

const serverInfo = ref<SystemServer | any>({});

// 整个服务的设置数据（预览页可使用）
const serverSettings = ref<SystemServerSetting[]>([]);

const route = useRoute();
const serverId = Number(route.params.serverId);

// 根目录（限制返回上级时不越过）
const rootPath = ref<string>("/");

const crumbs = computed(() => {
  // 生成面包屑：/a/b/c => ['/', 'a', 'b', 'c']
  const p = (currentPath.value || "/").replace(/\\+/g, "/");
  if (p === "/") return [{ name: "/", full: "/" }];
  const seg = p.split("/").filter(Boolean);
  const arr: { name: string; full: string }[] = [{ name: "/", full: "/" }];
  let acc = "";
  for (const s of seg) {
    acc = joinPath(acc || "/", s);
    arr.push({ name: s, full: acc });
  }
  return arr;
});

const canGoUp = computed(() => {
  const cp = currentPath.value || "/";
  const rp = rootPath.value || "/";
  if (cp === rp) return false;
  // 允许回到 rootPath 但不越过
  return true;
});

function goUp() {
  if (!canGoUp.value) return;
  const rp = rootPath.value || "/";
  const cp = currentPath.value || "/";
  if (cp === rp) return;
  const parts = cp.split("/").filter(Boolean);
  parts.pop();
  const target = parts.length ? `/${parts.join("/")}` : rp;
  currentPath.value = target;
  resetPager();
  fetchPreviewItems();
}

function onCrumbClick(index: number) {
  const list = crumbs.value;
  if (!list.length) return;
  const rp = rootPath.value || "/";
  const target = list[index]?.full || rp;
  // 不越过根
  if (target.length < rp.length) {
    currentPath.value = rp;
  } else {
    currentPath.value = target;
  }
  resetPager();
  fetchPreviewItems();
}

const collapsed = ref(false);
const storages = ref<FileStorageConfig[]>([]);
const selectedIndex = ref<number | null>(null);
const mode = ref<"list" | "card" | "image">("list");
const previewItems = ref<any[]>([]);

// 当前目录（点击文件夹进入）
const currentPath = ref<string>("/");

// 预览弹窗
const previewDialogVisible = ref(false);
const previewUrl = ref("");

// 拖拽上传状态
const isDragOver = ref(false);
interface UploadingFile {
  name: string;
  progress: number;
  status: "" | "success" | "exception";
}
const uploadingFiles = ref<UploadingFile[]>([]);

// 拖拽事件处理
function onDragOver(e: DragEvent) {
  isDragOver.value = true;
}

function onDragLeave(e: DragEvent) {
  isDragOver.value = false;
}

async function onDrop(e: DragEvent) {
  isDragOver.value = false;
  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  // 获取当前选中的存储配置
  const s =
    selectedIndex.value != null ? storages.value[selectedIndex.value] : null;
  if (!s) {
    ElMessage.warning("请先选择一个存储配置");
    return;
  }

  // 最大文件大小：10MB
  const maxSize = 10 * 1024 * 1024;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // 检查文件大小
    if (file.size > maxSize) {
      ElMessage.warning(`文件 ${file.name} 超过10MB限制，请使用分片上传`);
      continue;
    }

    // 添加到上传列表
    const uploadItem: UploadingFile = {
      name: file.name,
      progress: 0,
      status: "",
    };
    uploadingFiles.value.push(uploadItem);

    try {
      // 模拟进度
      uploadItem.progress = 30;

      // 调用上传接口
      const res = await uploadSmallFile({
        serverId: serverId,
        bucket: s.fileStorageBucket,
        filePath: currentPath.value || "/",
        file: file,
      });

      uploadItem.progress = 100;
      uploadItem.status = "success";
      ElMessage.success(`${file.name} 上传成功`);

      // 刷新文件列表
      await fetchPreviewItems();
    } catch (err: any) {
      uploadItem.progress = 100;
      uploadItem.status = "exception";
      ElMessage.error(`${file.name} 上传失败: ${err?.message || "未知错误"}`);
    }

    // 3秒后移除上传项
    setTimeout(() => {
      const idx = uploadingFiles.value.indexOf(uploadItem);
      if (idx > -1) {
        uploadingFiles.value.splice(idx, 1);
      }
    }, 3000);
  }
}

// 根据文件项获取图标
function getFileThumb(it: unknown): string {
  return iconManager.getIcon(it as FileItem);
}

// 获取文件分类
function getFileCategory(it: unknown): string {
  return getFileCategoryUtil(it as FileItem);
}

// 获取文件类型标签
function getFileTypeLabel(it: unknown): string {
  return getFileTypeLabelUtil(it as FileItem);
}

// 获取文件标签类型（用于 el-tag）
function getFileTagType(it: unknown): TagType {
  return getFileTagTypeUtil(it as FileItem);
}

// 判断是否为图片
function isImage(it: unknown): boolean {
  return isImageFile(it as FileItem);
}

// 轻量缓存：30秒内同参命中直接返回，减少请求
const listCache = new Map<
  string,
  { ts: number; items: any[]; marker: string }
>();
const CACHE_TTL = 30_000;
function makeCacheKey(s: any, basePath: string, limit: number, marker: string) {
  return [
    serverId,
    s?.fileStorageType,
    s?.fileStorageEndpoint,
    s?.fileStorageBucket,
    basePath,
    limit,
    marker,
  ].join("|");
}

// 基于 marker 的分页（与后端 AbstractFileStorage#calcIndex 对齐）
const pager = ref({ page: 1, limit: 20, marker: "", nextMarker: "" });
function base64EncodeUtf8(input: string) {
  // 这里的 input 仅包含 ASCII（如 "index_0"），直接 btoa 即可
  return btoa(input);
}
function hexEncode(str: string) {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
function makeMarker(index: number) {
  if (!index || index <= 1) return "";
  const raw = `${index}_0`;
  const b64 = base64EncodeUtf8(raw);
  return hexEncode(b64);
}
function resetPager() {
  pager.value.page = 1;
  pager.value.marker = "";
  pager.value.nextMarker = "";
}
function onLimitChange() {
  resetPager();
  fetchPreviewItems();
}
function goPrevPage() {
  if (pager.value.page <= 1) return;
  pager.value.page -= 1;
  pager.value.marker =
    pager.value.page === 1 ? "" : makeMarker(pager.value.page);
  fetchPreviewItems();
}
function goNextPage() {
  if (previewItems.value.length < pager.value.limit) return;
  pager.value.page += 1;
  pager.value.marker = makeMarker(pager.value.page);
  fetchPreviewItems();
}

function toggleCollapse() {
  collapsed.value = !collapsed.value;
}
function selectStorage(idx: number) {
  selectedIndex.value = idx;
  const s = storages.value[idx];
  const base = s?.fileStorageBasePath || "/";
  // 切换存储时重置根目录与当前目录
  rootPath.value = base;
  currentPath.value = base;
  resetPager();
  fetchPreviewItems();
}

function addStorage() {
  storages.value.push({
    fileStorageServerId: serverId,
    fileStorageEnabled: true,
    fileStorageType: "FILESYSTEM",
    fileStorageEndpoint: "",
    fileStorageBucket: "",
    fileStorageAccessKey: "",
    fileStorageSecretKey: "",
    fileStorageRegion: "",
  } as any);
  selectedIndex.value = storages.value.length - 1;
}

// 工具：拼路径，确保只有一个斜杠
function joinPath(parent: string, name: string) {
  const a = (parent || "/").replace(/\\+/g, "/").replace(/\/+/g, "/");
  const b = (name || "").replace(/\\+/g, "/").replace(/\/+/g, "/");
  const p = `${a.endsWith("/") ? a.slice(0, -1) : a}/${b.startsWith("/") ? b.slice(1) : b}`;
  return p || "/";
}

function formatSize(size: number | string) {
  const n = Number(size || 0);
  if (isNaN(n)) return "-";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getImageUrl(it: any) {
  // 单独的图片URL构造（避免与iframe预览URL混淆）
  return buildUrl(it, false);
}

function retryImage(it: any) {
  // 通过变更 key 触发 el-image 重新加载
  // 在模板中已使用 :key="getImageUrl(it)" 达到刷新效果
  // 这里保留空函数以兼容点击事件，不产生报错
}

function buildUrl(it: any, usePreview = false) {
  const s =
    selectedIndex.value != null
      ? storages.value[selectedIndex.value]
      : storages.value[0];
  if (!s) return "";

  const si = (serverInfo as any).value || {};
  const host = si.systemServerHost || si.monitorSysGenServerHost || "127.0.0.1";
  const port = si.systemServerPort || si.monitorSysGenServerPort || 8080;
  const context =
    si.systemServerContextPath || si.systemServerContentPath || "";

  // 构建基础URL
  const base = `http://${host}:${port}${context}`;

  // 构建文件路径
  const fileName = String(it?.name || "");
  const itemPath = String(it?.filePath || currentPath.value || "/");
  const fullPath = joinPath(itemPath, fileName);

  // 根据存储类型构建完整URL
  let url = "";
  if (s.fileStorageType === "FILESYSTEM") {
    // 文件系统类型：直接使用文件路径
    url = `${base}/file-storage/download${fullPath}`;
  } else {
    // 对象存储类型：包含bucket信息
    const bucket = s?.fileStorageBucket || "";
    url = `${base}/file-storage/download/${bucket}${fullPath}`;
  }

  // 清理多余的斜杠
  url = url.replace(/([^:]\/)\/+/g, "$1");

  return usePreview ? `${url}?preview=true` : url;
}

function onItemClick(it: any) {
  // 目录：进入
  if (it?.directory) {
    currentPath.value = joinPath(currentPath.value || "/", it.name || "");
    resetPager();
    fetchPreviewItems();
    return;
  }
  // 文件：弹窗 iframe 预览
  previewUrl.value = buildUrl(it, true);
  previewDialogVisible.value = true;
}

async function reload() {
  try {
    pager.value.marker = null;
    getFileStorageConfig(serverId).then(async (res) => {
      if (res?.success && Array.isArray(res.data)) {
        storages.value = res.data as any[];
        if (!storages.value.length)
          ElMessage.info("当前服务器暂无已安装的存储");
        selectedIndex.value = storages.value.length ? 0 : null;
        const s = storages.value[0];
        const base = s?.fileStorageBasePath || "/";
        rootPath.value = base;
        currentPath.value = base;
        await fetchPreviewItems();
      }
    });
  } catch (e) {
    storages.value = [];
  }
}

async function doPreview(idx: number) {
  selectedIndex.value = idx;
  const s = storages.value[idx];
  pager.value.marker = null;
  const base = s?.fileStorageBasePath || "/";
  rootPath.value = base;
  currentPath.value = base;
  await fetchPreviewItems();
}

async function fetchPreviewItems() {
  try {
    const s =
      selectedIndex.value != null
        ? storages.value[selectedIndex.value]
        : storages.value[0];
    if (!s) {
      previewItems.value = [];
      return;
    }
    if (!currentPath.value) currentPath.value = s.fileStorageBasePath || "/";

    // 缓存命中：直接使用
    const key = makeCacheKey(
      s,
      currentPath.value,
      pager.value.limit,
      pager.value.marker || ""
    );
    const now = Date.now();
    const cached = listCache.get(key);
    if (cached && now - cached.ts < CACHE_TTL) {
      previewItems.value = cached.items;
      pager.value.marker = cached.marker || pager.value.marker;
      return;
    }

    const params = new URLSearchParams();
    params.append("serverId", String(serverId));
    params.append("type", s.fileStorageType || "");
    params.append("bucket", s.fileStorageBucket || "");
    params.append("endpoint", s.fileStorageEndpoint || "");
    params.append(
      "basePath",
      currentPath.value || s.fileStorageBasePath || "/"
    );
    // 通过 limit 控制后端返回条数
    params.append("limit", String(pager.value.limit));
    // 通过 marker 控制分页游标
    params.append("marker", pager.value.marker || "");
    // 请求裁剪字段，提示后端只返回必要字段（若后端不支持，会被忽略）
    params.append("fields", "name,size,modified,ext,directory,filePath");
    // 请求简化模式（若后端不支持，会被忽略）
    params.append("simple", "1");

    const res = await fileStorageList(params);
    const rr = res?.data; // ReturnResult<ListObjectResult>
    const items = Array.isArray(rr?.metadata) ? rr.metadata : [];
    pager.value.marker = rr?.marker || pager.value.marker;

    // 仅取必要字段，避免在前端继续扩大对象
    const mapped = (items || []).map((it: any, i: number) => ({
      id: it.fileId || it.id || i,
      name:
        it.name ||
        it.filename ||
        it.fileName ||
        it.originalFilename ||
        it.path ||
        "",
      size: it.size || it.fileSize || it.length || 0,
      modified: it.modified || it.lastModified || it.updateTime || "",
      ext: it.ext || it.suffix || "",
      filePath: it.filePath || it.parentPath || currentPath.value || "/",
      directory: it.directory === true,
    }));

    previewItems.value = mapped;
    listCache.set(key, { ts: now, items: mapped, marker: pager.value.marker });
  } catch (e) {
    previewItems.value = [];
  }
}

const loadServerInfo = async () => {
  try {
    const res = await getSystemServerById(serverId);
    if (res?.success) {
      serverInfo.value = res.data;
    }
  } catch (e) {
    ElMessage.error(e.message);
  }
};

onMounted(() => {
  loadServerInfo();
  reload();
});
</script>

<style scoped>
.fs-full {
  display: grid;
  grid-template-columns: 340px 1fr;
  height: calc(100vh - 24px);
  gap: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%);
}
.fs-left {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  padding: 0;
}
.fs-left:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.fs-left.collapsed {
  width: 0;
  padding: 0;
  margin: 0;
  border: none;
}
.left-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
.left-header .title {
  font-weight: 700;
  font-size: 17px;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 10px;
}
.left-header .title .iconify {
  font-size: 22px;
}
.left-header .actions {
  display: flex;
  gap: 8px;
}
.left-header .actions :deep(.el-button) {
  border-radius: 10px;
}
.left-header .actions :deep(.el-button:hover) {
  border-color: var(--el-color-primary);
}
.left-list {
  height: calc(100vh - 180px);
  padding: 12px;
}
.left-item {
  padding: 16px;
  margin-bottom: 10px;
  border-radius: 14px;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}
.left-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: #e5e7eb;
  transition: all 0.3s ease;
}
.left-item:hover {
  background: #fff;
  border-color: #d1d5db;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateX(4px);
}
.left-item:hover::before {
  background: var(--el-color-primary);
}
.left-item.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  box-shadow: 0 6px 24px var(--el-color-primary-light-7);
}
.left-item.active::before {
  background: var(--el-color-primary);
  width: 5px;
}
.left-item .row1 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.left-item .row1 .seq {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.left-item .row1 .type {
  font-weight: 700;
  color: #1e293b;
  font-size: 15px;
  flex: 1;
}
.left-item .row2 {
  color: #64748b;
  font-size: 13px;
  padding: 8px 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-left: 8px;
  margin-bottom: 10px;
}
.left-item .row3 {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
  margin-top: 8px;
  border-top: 1px solid #e2e8f0;
}
.fs-right {
  min-width: 0;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  border: none;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  padding: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
.fs-right:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  padding: 18px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
}
.toolbar :deep(.el-radio-group) {
  border-radius: 12px;
  overflow: hidden;
}
.toolbar :deep(.el-button) {
  border-radius: 10px;
}
.toolbar :deep(.el-button:hover) {
  border-color: var(--el-color-primary);
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 10px;
}
.crumbs :deep(.el-button) {
  border-radius: 10px;
}
.crumbs .bc {
  max-width: 100%;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.crumbs :deep(.el-breadcrumb__inner) {
  color: var(--el-text-color-regular);
}
.crumbs :deep(.el-breadcrumb__separator) {
  color: var(--el-text-color-secondary);
}
.crumbs .bc-item {
  cursor: pointer;
  transition: all 0.2s ease;
}
.crumbs .bc-item:hover :deep(.el-breadcrumb__inner) {
  color: var(--el-color-primary);
}
.server-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--el-fill-color-light);
  padding: 8px 14px;
  border-radius: 12px;
  color: var(--el-text-color-primary);
  margin-left: auto;
}
.server-info .iconify {
  font-size: 18px;
  color: var(--el-color-primary);
}
.server-info .si-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.server-info .si-addr {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.spacer {
  flex: 1;
}
.pager {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-regular);
}
.pager :deep(.el-select) {
  border-radius: 8px;
}
.preview-body {
  height: calc(100vh - 180px);
  overflow: auto;
  padding: 20px 24px;
  position: relative;
}
.preview-body.drag-over {
  background: var(--el-color-primary-light-9);
  border: 2px dashed var(--el-color-primary);
  border-radius: 12px;
}

/* ========== 拖拽上传样式 ========== */
.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(var(--el-color-primary-rgb), 0.08);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 12px;
}
.drop-content {
  text-align: center;
  padding: 40px;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.drop-icon {
  font-size: 64px;
  color: var(--el-color-primary);
  margin-bottom: 16px;
}
.drop-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}
.drop-hint {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 上传进度条 */
.upload-progress {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.upload-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}
.upload-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 列表视图样式 ========== */
.list-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.list-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.25s ease;
  position: relative;
  overflow: hidden;
}
.list-item::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--el-border-color-lighter);
  transition: all 0.25s ease;
}
.list-item:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary-light-5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateX(4px);
}
.list-item:hover::before {
  background: var(--el-color-primary);
}
.list-item.folder::before {
  background: var(--el-color-warning);
}
.list-item.image::before {
  background: var(--el-color-success);
}
.list-item.document::before {
  background: var(--el-color-primary);
}
.list-item.archive::before {
  background: var(--el-color-danger);
}
.list-item.video::before {
  background: #9333ea;
}
.list-item.audio::before {
  background: #06b6d4;
}
.list-item.code::before {
  background: #f59e0b;
}
.list-item.executable::before {
  background: #ef4444;
}
.list-icon {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  padding: 8px;
}
.list-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.list-info {
  flex: 1;
  min-width: 0;
}
.list-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.list-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.list-size {
  color: var(--el-text-color-regular);
}
.list-time {
  color: var(--el-text-color-placeholder);
}
.list-actions {
  flex-shrink: 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}
.list-item:hover .list-actions {
  opacity: 1;
}

/* ========== 卡片视图样式 ========== */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.file-card {
  width: 100%;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: var(--el-bg-color);
  position: relative;
}
.file-card:hover {
  border-color: var(--el-color-primary);
  box-shadow: 0 8px 24px var(--el-color-primary-light-7);
  transform: translateY(-6px);
}
/* 卡片徽章 */
.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  z-index: 10;
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.card-badge.folder {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}
.card-badge.image {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.card-badge.document {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.card-badge.text {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}
.card-badge.archive {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.card-badge.video {
  background: #f3e8ff;
  color: #9333ea;
}
.card-badge.audio {
  background: #ecfeff;
  color: #06b6d4;
}
.card-badge.code {
  background: #fef3c7;
  color: #d97706;
}
.card-badge.executable {
  background: #fee2e2;
  color: #dc2626;
}
.card-badge.email {
  background: #e0e7ff;
  color: #4f46e5;
}
.thumb-wrap {
  height: 140px;
  background: var(--el-fill-color-lighter);
  border-radius: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.file-icon-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
.ph-img {
  max-width: 80px;
  max-height: 80px;
  object-fit: contain;
}
.card-footer {
  padding: 14px;
  background: var(--el-bg-color);
}
.card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
}
.card-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
.card-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

/* 图片加载占位与错误样式 */
.img-skeleton {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #f5f7fa 25%, #eef1f5 37%, #f5f7fa 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.2s ease-in-out infinite;
}
@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
.img-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: var(--el-text-color-secondary);
  background: #fafafa;
}
/* ========== 大图视图样式 ========== */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}
.img-card {
  position: relative;
  height: 240px;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: var(--el-fill-color-lighter);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.img-card:hover {
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
  transform: translateY(-6px);
  border-color: var(--el-color-primary-light-5);
}
/* 大图徽章 */
.img-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  z-index: 10;
  backdrop-filter: blur(8px);
  background: rgba(255, 255, 255, 0.85);
  color: var(--el-text-color-regular);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.img-badge.folder {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}
.img-badge.image {
  background: rgba(34, 197, 94, 0.15);
  color: #16a34a;
}
.img-badge.document {
  background: rgba(59, 130, 246, 0.15);
  color: #2563eb;
}
.img-badge.text {
  background: rgba(107, 114, 128, 0.15);
  color: #4b5563;
}
.img-badge.archive {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
.img-badge.video {
  background: rgba(147, 51, 234, 0.15);
  color: #9333ea;
}
.img-badge.audio {
  background: rgba(6, 182, 212, 0.15);
  color: #0891b2;
}
.img-badge.code {
  background: rgba(245, 158, 11, 0.15);
  color: #d97706;
}
.img-badge.executable {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
}
.img-badge.email {
  background: rgba(79, 70, 229, 0.15);
  color: #4f46e5;
}
.img-card .el-image {
  width: 100%;
  height: 100%;
  display: block;
  transition: transform 0.4s ease;
}
.img-card:hover .el-image {
  transform: scale(1.03);
}
.big-icon-wrap {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-fill-color-light);
}
.big-icon {
  width: 80px;
  height: 80px;
  object-fit: contain;
  transition: transform 0.3s ease;
}
.img-card:hover .big-icon {
  transform: scale(1.1);
}
.overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 14px 16px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.75) 100%);
  color: #fff;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
.img-card:hover .overlay {
  transform: translateY(0);
}
.overlay .ov-name {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}
.overlay .ov-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  opacity: 0.85;
}
.overlay .ov-size {
  font-weight: 500;
}
.overlay .ov-time {
  opacity: 0.7;
}
@media (max-width: 1080px) {
  .fs-full {
    grid-template-columns: 1fr;
  }
  .fs-left {
    display: none;
  }
}
</style>
