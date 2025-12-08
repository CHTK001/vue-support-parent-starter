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

      <div class="preview-body thin-scrollbar">
        <template v-if="mode === 'list'">
          <el-table
            :data="previewItems"
            height="calc(100vh - 180px)"
            size="small"
            border
          >
            <el-table-column prop="name" label="名称" min-width="240" />
            <el-table-column prop="size" label="大小" width="120" />
            <el-table-column prop="modified" label="修改时间" width="200" />
          </el-table>
        </template>
        <template v-else-if="mode === 'card'">
          <div class="card-grid">
            <el-card
              v-for="it in previewItems"
              :key="it.id"
              class="file-card"
              shadow="hover"
              @click="onItemClick(it)"
            >
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
                  <img :src="getFileThumb(it)" class="ph-img" />
                </template>
              </div>
              <div class="meta">
                <div class="name" :title="it.name">{{ it.name }}</div>
                <div class="sub">{{ formatSize(it.size) }}</div>
              </div>
            </el-card>
          </div>
        </template>
        <template v-else>
          <div class="image-grid">
            <div
              v-for="it in previewItems"
              :key="it.id"
              class="img-card"
              @click="onItemClick(it)"
            >
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
                <img :src="getFileThumb(it)" alt="file" />
              </template>
              <div class="overlay">
                <div class="ov-name" :title="it.name">{{ it.name }}</div>
                <div class="ov-sub">{{ formatSize(it.size) }}</div>
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
import { fileStorageList } from "@/api/file-manager/file-storage";
// 本地静态资源（按后缀）
import imgFolder from "@/assets/images/folder.png";
import imgFile from "@/assets/images/File.png";
import imgUnknown from "@/assets/images/unknown.png";
import imgPdf from "@/assets/images/pdf.png";
import imgDoc from "@/assets/images/doc.png";
import imgDocx from "@/assets/images/docx.png";
import imgXls from "@/assets/images/xls.png";
import imgXlsx from "@/assets/images/xlsx.png";
import imgXlsm from "@/assets/images/xlsm.png";
import imgPpt from "@/assets/images/ppt.png";
import imgPptx from "@/assets/images/pptx.png";
import imgTxt from "@/assets/images/txt.png";
import imgMd from "@/assets/images/md.png";
import imgCsv from "@/assets/images/csv.png";
import imgZip from "@/assets/images/zip.png";
import imgRar from "@/assets/images/rar.png";
import img7z from "@/assets/images/7z.png";
import imgGz from "@/assets/images/gz.png";
import imgTgz from "@/assets/images/tgz.png";
import imgBmp from "@/assets/images/bmp.png";
import imgGif from "@/assets/images/gif.png";
import imgPng from "@/assets/images/png.png";
import imgJpg from "@/assets/images/jpg.png";
import imgJpeg from "@/assets/images/jpeg.png";
import imgWebp from "@/assets/images/webp.png";
import imgTiff from "@/assets/images/tiff.png";
import imgHeic from "@/assets/images/heic.png";
import imgMp4 from "@/assets/images/mp4.png";
import imgJar from "@/assets/images/jar.png";
import imgJava from "@/assets/images/java.png";
import imgExe from "@/assets/images/exe.png";
import imgSh from "@/assets/images/sh.png";
import imgBat from "@/assets/images/bat.png";
import imgPy from "@/assets/images/py.png";
import imgJs from "@/assets/images/js.png";
import imgTs from "@/assets/images/ts.png";
import imgCss from "@/assets/images/css.png";
import imgScss from "@/assets/images/scss.png";
import imgHtml from "@/assets/images/html.png";
import imgXml from "@/assets/images/xml.png";
import imgYaml from "@/assets/images/yaml.png";
import imgYml from "@/assets/images/yml.png";
import imgJson from "@/assets/images/json.png";
import imgSql from "@/assets/images/sql.png";
import imgSqlite from "@/assets/images/sqlite.png";
import imgMdb from "@/assets/images/mdb.png";
import imgLog from "@/assets/images/log.png";
import imgOfd from "@/assets/images/OFD.png";
import imgEml from "@/assets/images/EML.png";
import img404 from "@/assets/images/404.webp";

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

// 图片模式占位（本地替代图）
const IMAGE_FALLBACK_CARD = img404;
const IMAGE_FALLBACK_BIG = img404;
// 在线直观图标已不再使用，统一改成本地静态图（见 EXT_ICON_MAP）

// 后缀到占位图映射（小写）
const EXT_ICON_MAP: Record<string, string> = {
  // 文档类
  pdf: imgPdf,
  doc: imgDoc,
  docx: imgDocx,
  xls: imgXls,
  xlsx: imgXlsx,
  xlsm: imgXlsm,
  ppt: imgPpt,
  pptx: imgPptx,
  txt: imgTxt,
  md: imgMd,
  csv: imgCsv,
  // 压缩与包
  zip: imgZip,
  rar: imgRar,
  "7z": img7z,
  gz: imgGz,
  tgz: imgTgz,
  bz2: imgZip,
  tar: imgZip,
  // 图片
  bmp: imgBmp,
  gif: imgGif,
  png: imgPng,
  jpg: imgJpg,
  jpeg: imgJpeg,
  webp: imgWebp,
  tiff: imgTiff,
  heic: imgHeic,
  // 视频/音频（示例仅 mp4，其他可按需扩展本地图）
  mp4: imgMp4,
  // 运行包/脚本/二进制
  jar: imgJar,
  exe: imgExe,
  sh: imgSh,
  bat: imgBat,
  // 代码/配置
  py: imgPy,
  js: imgJs,
  ts: imgTs,
  css: imgCss,
  scss: imgScss,
  html: imgHtml,
  xml: imgXml,
  yaml: imgYaml,
  yml: imgYml,
  json: imgJson,
  sql: imgSql,
  sqlite: imgSqlite,
  mdb: imgMdb,
  log: imgLog,
  ofd: imgOfd,
  eml: imgEml,
};

// 提取后缀
function getExt(it: any): string {
  const direct = String(it?.ext || it?.suffix || "").toLowerCase();
  if (direct) return direct;
  const name = String(it?.name || "");
  const i = name.lastIndexOf(".");
  return i > -1 ? name.slice(i + 1).toLowerCase() : "";
}

// 根据后缀选择占位
function getFileThumb(it: any): string {
  if (it?.directory) return imgFolder;
  const ext = getExt(it);
  if (!ext) return imgUnknown || imgFile;
  return EXT_ICON_MAP[ext] || imgUnknown || imgFile;
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

function isImage(it: any) {
  // 先尝试从ext字段获取后缀，如果没有则从文件名提取
  let ext = String(it?.ext || it?.suffix || "").toLowerCase();
  if (!ext) {
    ext = getExt(it);
  }
  const imageExts = [
    "jpg",
    "jpeg",
    "png",
    "gif",
    "bmp",
    "webp",
    "svg",
    "tiff",
    "heic",
  ];
  return imageExts.includes(ext);
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
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
}
.left-header .title {
  font-weight: 700;
  font-size: 17px;
  color: #fff;
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
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}
.left-header .actions :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
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
  background: #6366f1;
}
.left-item.active {
  background: linear-gradient(145deg, #eef2ff 0%, #e0e7ff 100%);
  border-color: #6366f1;
  box-shadow: 0 6px 24px rgba(99, 102, 241, 0.2);
}
.left-item.active::before {
  background: linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%);
  width: 5px;
}
.left-item .row1 {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.left-item .row1 .seq {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  color: #4f46e5;
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
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
.toolbar :deep(.el-radio-group) {
  border-radius: 12px;
  overflow: hidden;
}
.toolbar :deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
  color: #fff;
}
.toolbar
  :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: #fff;
  color: #059669;
  border-color: #fff;
}
.toolbar :deep(.el-button) {
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}
.toolbar :deep(.el-button:hover) {
  background: rgba(255, 255, 255, 0.3);
}
.crumbs {
  display: flex;
  align-items: center;
  gap: 10px;
}
.crumbs :deep(.el-button) {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
}
.crumbs .bc {
  max-width: 40%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.crumbs :deep(.el-breadcrumb__inner) {
  color: rgba(255, 255, 255, 0.8);
}
.crumbs :deep(.el-breadcrumb__separator) {
  color: rgba(255, 255, 255, 0.5);
}
.crumbs .bc-item {
  cursor: pointer;
  transition: all 0.2s ease;
}
.crumbs .bc-item:hover :deep(.el-breadcrumb__inner) {
  color: #fff;
}
.server-info {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.2);
  padding: 8px 14px;
  border-radius: 12px;
  color: #fff;
  margin-left: auto;
}
.server-info .iconify {
  font-size: 18px;
}
.server-info .si-name {
  font-weight: 600;
  color: #fff;
}
.server-info .si-addr {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}
.spacer {
  flex: 1;
}
.pager {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pager :deep(.el-select) {
  border-radius: 8px;
}
.preview-body {
  height: calc(100vh - 180px);
  overflow: auto;
  padding: 20px 24px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
}
.file-card {
  width: 100%;
  border-radius: 16px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
}
.file-card:hover {
  border-color: #10b981;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.2);
  transform: translateY(-6px);
}
.thumb-wrap {
  height: 150px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.thumb-wrap::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.03));
}
.ph-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.meta {
  margin-top: 6px;
  font-size: 12px;
}
.meta .name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.meta .sub {
  color: var(--el-text-color-secondary);
  margin-top: 2px;
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
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.img-card {
  position: relative;
  height: 260px;
  overflow: hidden;
  border-radius: 18px;
  border: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
}
.img-card:hover {
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
  transform: translateY(-8px) scale(1.02);
}
.img-card .el-image,
.img-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.img-card:hover .el-image,
.img-card:hover img {
  transform: scale(1.05);
}
.overlay {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16px;
  background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  color: #fff;
  transform: translateY(100%);
  transition: transform 0.3s ease;
}
.img-card:hover .overlay {
  transform: translateY(0);
}
.overlay .ov-name {
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.overlay .ov-sub {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
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
