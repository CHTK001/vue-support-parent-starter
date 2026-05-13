<template>
  <section class="face-library-workbench system-container modern-bg">
    <!-- Header -->
    <header class="face-library__header">
      <button class="face-library__back" @click="router.push('/ai/home')">
        <IconifyIconOnline icon="ri:arrow-left-s-line" />
      </button>
      <div class="face-library__header-body">
        <h2 class="face-library__header-title">图像库</h2>
        <p class="face-library__header-desc">上传、管理、以图搜图</p>
      </div>
      <nav class="face-library__nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="face-library__nav-item"
          :class="{ active: activeTab === tab.key }"
          @click="switchTab(tab.key)"
        >
          <IconifyIconOnline :icon="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </header>

    <!-- Hidden file input (shared across upload zones) -->
    <input ref="fileInputRef" class="face-library__file-input" type="file" accept="image/*" @change="handleFilePick" />

    <!-- ─── Tab: Search (以图搜图) ─────────────────── -->
    <section v-if="activeTab === 'search'" class="face-library__panel face-library__form-panel">
      <div class="face-library__recognize-layout">
        <div class="face-library__recognize-left">
          <div
            class="face-library__upload-zone face-library__upload-zone--compact"
            :class="{ 'is-dragging': dragging, 'is-filled': !!searchPreview }"
            @click="openFilePicker('search')"
            @dragenter.prevent="dragging = true"
            @dragover.prevent="dragging = true"
            @dragleave.prevent="dragging = false"
            @drop.prevent="handleDrop"
          >
            <img v-if="searchPreview" :src="searchPreview" alt="preview" class="face-library__upload-preview" />
            <div v-else class="face-library__upload-hint">
              <div class="face-library__upload-plus">
                <IconifyIconOnline icon="ri:search-eye-line" />
              </div>
              <span>点击或拖拽上传图片</span>
            </div>
          </div>

          <div class="face-library__recognize-controls">
            <label class="face-library__ctrl">
              <span class="face-library__ctrl-label">返回 Top-K</span>
              <div class="face-library__ctrl-input">
                <el-input-number v-model="searchForm.topK" :min="1" :max="50" size="small" style="width:100px" />
              </div>
            </label>
            <label class="face-library__ctrl">
              <span class="face-library__ctrl-label">最低相似度</span>
              <div class="face-library__ctrl-input">
                <el-slider v-model="searchForm.minSimilarity" :min="0" :max="1" :step="0.05" style="width:140px" />
                <span class="face-library__ctrl-value">{{ (searchForm.minSimilarity * 100).toFixed(0) }}%</span>
              </div>
            </label>
            <label class="face-library__ctrl">
              <span class="face-library__ctrl-label">标签过滤</span>
              <div class="face-library__ctrl-input">
                <input v-model="searchForm.tags" class="face-library__form-input" placeholder="标签,逗号分隔" style="width:140px" />
              </div>
            </label>
            <button
              class="face-library__btn face-library__btn--primary face-library__btn--lg"
              :disabled="!searchPreview || searching"
              @click="handleSearch"
            >
              <IconifyIconOnline v-if="searching" icon="ri:loader-4-line" class="face-library__spinner" />
              <IconifyIconOnline v-else icon="ri:search-eye-line" />
              <span>{{ searching ? '搜索中...' : '以图搜图' }}</span>
            </button>
          </div>
        </div>

        <div class="face-library__recognize-right">
          <div v-if="searchResults.length > 0" class="face-library__recognize-results">
            <h3 class="face-library__results-title">搜索结果 ({{ searchResults.length }})</h3>
            <div class="face-library__results-list">
              <div
                v-for="(r, idx) in searchResults"
                :key="'sr-' + idx"
                class="face-library__result-card"
                :style="{ animationDelay: (idx * 0.1) + 's' }"
                @click="openResultPreview(r)"
              >
                <div class="face-library__result-avatar">
                  <img v-if="r.thumbnail" :src="r.thumbnail" alt="" loading="lazy" />
                  <IconifyIconOnline v-else icon="ri:image-line" />
                </div>
                <div class="face-library__result-info">
                  <div class="face-library__result-name">{{ r.name || '未命名' }}</div>
                  <div v-if="r.tags" class="face-library__result-sub">{{ r.tags }}</div>
                  <div class="face-library__result-sub">{{ r.width }}×{{ r.height }}</div>
                  <div class="face-library__result-bar">
                    <div
                      class="face-library__result-bar-fill"
                      :class="scoreColor(r.similarity)"
                      :style="{ width: (r.similarity * 100) + '%' }"
                    />
                  </div>
                </div>
                <div class="face-library__result-score" :class="scoreColor(r.similarity)">
                  {{ (r.similarity * 100).toFixed(1) }}<small>%</small>
                </div>
              </div>
            </div>
          </div>
          <div v-else-if="searchedOnce" class="face-library__no-match">
            <IconifyIconOnline icon="ri:emotion-sad-line" />
            <p>未找到相似图像</p>
          </div>
          <div v-else class="face-library__results-idle">
            <IconifyIconOnline icon="ri:search-eye-line" />
            <p>上传图片后进行搜索</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Tab: Library (图像库) ──────────────────── -->
    <section v-if="activeTab === 'library'" class="face-library__panel face-library__list-panel">
      <div class="face-library__list-toolbar">
        <div style="display:flex;gap:8px;flex:1">
          <input v-model="listFilter.name" class="face-library__form-input" placeholder="按名称搜索" style="max-width:200px" @input="loadLibrary(1)" />
          <input v-model="listFilter.tags" class="face-library__form-input" placeholder="按标签搜索" style="max-width:200px" @input="loadLibrary(1)" />
        </div>
        <span class="face-library__list-count">共 {{ libraryTotal }} 张</span>
      </div>

      <div v-if="libraryItems.length === 0" class="face-library__empty">
        <div class="face-library__empty-icon">
          <IconifyIconOnline icon="ri:image-line" />
        </div>
        <p class="face-library__empty-text">图像库为空</p>
        <button class="face-library__btn face-library__btn--primary" @click="activeTab = 'upload'">
          <IconifyIconOnline icon="ri:add-line" />
          <span>上传第一张图片</span>
        </button>
      </div>

      <div v-else class="face-library__card-grid">
        <div
          v-for="item in libraryItems"
          :key="item.sysAiImageLibraryId"
          class="face-library__card"
          @click="openLibraryPreview(item)"
        >
          <div class="face-library__card-img">
            <img v-if="item.sysAiImageLibraryThumbnail" :src="item.sysAiImageLibraryThumbnail" alt="" loading="lazy" />
            <IconifyIconOnline v-else icon="ri:image-line" />
          </div>
          <div class="face-library__card-body">
            <div class="face-library__card-name">{{ item.sysAiImageLibraryName || '未命名' }}</div>
            <div v-if="item.sysAiImageLibraryTags" class="face-library__card-sub">
              <IconifyIconOnline icon="ri:price-tag-line" />{{ item.sysAiImageLibraryTags }}
            </div>
            <div class="face-library__card-sub">{{ item.sysAiImageLibraryWidth }}×{{ item.sysAiImageLibraryHeight }}</div>
            <div class="face-library__card-time">{{ item.createTime || '' }}</div>
          </div>
          <div class="face-library__card-actions" @click.stop>
            <button
              class="face-library__card-btn face-library__card-btn--danger"
              :disabled="deletingId === item.sysAiImageLibraryId"
              @click="handleDelete(item)"
            >
              <IconifyIconOnline icon="ri:delete-bin-line" />
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="libraryTotal > pageSize" class="face-library__records-pagination" style="margin-top:14px;padding-top:14px">
        <button class="face-library__btn face-library__btn--sm" :disabled="currentPage <= 1" @click="loadLibrary(currentPage - 1)">
          <IconifyIconOnline icon="ri:arrow-left-s-line" />上一页
        </button>
        <span class="face-library__records-page-info">{{ currentPage }} / {{ totalPages }}</span>
        <button class="face-library__btn face-library__btn--sm" :disabled="currentPage >= totalPages" @click="loadLibrary(currentPage + 1)">
          下一页<IconifyIconOnline icon="ri:arrow-right-s-line" />
        </button>
      </div>
    </section>

    <!-- ─── Tab: Upload (上传图像) ─────────────────── -->
    <section v-if="activeTab === 'upload'" class="face-library__panel face-library__form-panel">
      <div class="face-library__form-layout">
        <div
          class="face-library__upload-zone"
          :class="{ 'is-dragging': dragging, 'is-filled': !!uploadPreview }"
          @click="openFilePicker('upload')"
          @dragenter.prevent="dragging = true"
          @dragover.prevent="dragging = true"
          @dragleave.prevent="dragging = false"
          @drop.prevent="handleDrop"
        >
          <img v-if="uploadPreview" :src="uploadPreview" alt="preview" class="face-library__upload-preview" />
          <div v-else class="face-library__upload-hint">
            <div class="face-library__upload-plus">
              <IconifyIconOnline icon="ri:add-line" />
            </div>
            <span>点击或拖拽上传图片</span>
          </div>
        </div>

        <div class="face-library__form-body">
          <label class="face-library__form-field">
            <span class="face-library__form-label">图像名称</span>
            <input v-model="uploadForm.name" class="face-library__form-input" placeholder="输入图像名称（可选）" />
          </label>
          <label class="face-library__form-field">
            <span class="face-library__form-label">标签</span>
            <input v-model="uploadForm.tags" class="face-library__form-input" placeholder="标签，逗号分隔（可选）" />
          </label>
          <div class="face-library__form-actions">
            <button class="face-library__btn" @click="resetUpload">重置</button>
            <button
              class="face-library__btn face-library__btn--primary"
              :disabled="!uploadPreview || uploading"
              @click="handleUpload"
            >
              <IconifyIconOnline v-if="uploading" icon="ri:loader-4-line" class="face-library__spinner" />
              <span>{{ uploading ? '上传中...' : '上传' }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- ─── Tab: Settings (控制设置) ────────────────── -->
    <section v-if="activeTab === 'settings'" class="face-library__panel face-library__settings-panel">
      <div class="face-library__settings-head">
        <h3>图像搜索设置</h3>
        <p>配置图像特征提取模型等默认参数，修改后影响后续上传和搜索</p>
      </div>

      <div class="face-library__settings-body">
        <div class="face-library__settings-group">
          <h4 class="face-library__settings-group-title">模型配置</h4>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">特征提取模型</span>
            <div class="face-library__settings-control">
              <select v-model="settings.defaultImageFeatureModel" class="face-library__settings-select">
                <option value="">请选择</option>
                <option v-for="m in featureModules" :key="m.sysAiModuleCode" :value="m.sysAiModuleCode">
                  {{ m.sysAiModuleName || m.sysAiModuleCode }}
                </option>
              </select>
            </div>
          </label>
        </div>

        <div class="face-library__settings-group">
          <h4 class="face-library__settings-group-title">参数配置</h4>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">特征维度</span>
            <div class="face-library__settings-control">
              <el-input-number v-model="settings.featureDimension" :min="128" :max="2048" :step="128" style="width:120px" />
              <p class="face-library__settings-hint">必须与特征提取模型的输出维度一致</p>
            </div>
          </label>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">最低相似度</span>
            <div class="face-library__settings-control face-library__settings-control--inline">
              <el-slider v-model="settings.minSimilarity" :min="0" :max="1" :step="0.01" style="width:200px" />
              <span class="face-library__settings-value">{{ (settings.minSimilarity * 100).toFixed(0) }}%</span>
            </div>
          </label>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">向量存储引擎</span>
            <div class="face-library__settings-control">
              <select v-model="settings.vectorStorageEngine" class="face-library__settings-select">
                <option value="jvector">JVector - 本地内存向量引擎</option>
                <option value="milvus">Milvus - 高性能分布式向量数据库</option>
                <option value="pinecone">Pinecone - 云端向量数据库服务</option>
                <option value="qdrant">Qdrant - 向量相似度搜索引擎</option>
                <option value="weaviate">Weaviate - 开源向量数据库</option>
                <option value="elasticsearch">Elasticsearch - 全文与向量混合搜索</option>
              </select>
            </div>
          </label>

          <label class="face-library__settings-field">
            <span class="face-library__settings-label">最大图像边长</span>
            <div class="face-library__settings-control">
              <el-input-number v-model="settings.maxImageSize" :min="256" :max="4096" :step="128" style="width:120px" />
              <p class="face-library__settings-hint">上传时自动缩放，超此值将压缩</p>
            </div>
          </label>
        </div>
      </div>

      <div class="face-library__settings-foot">
        <div class="face-library__settings-foot-info">
          <IconifyIconOnline icon="ri:information-line" />
          <span>设置自动保存在数据库中，对所有用户生效</span>
        </div>
        <button
          class="face-library__btn face-library__btn--primary"
          :disabled="savingSettings"
          @click="handleSaveSettings"
        >
          <IconifyIconOnline v-if="savingSettings" icon="ri:loader-4-line" class="face-library__spinner" />
          <span>{{ savingSettings ? '保存中...' : '保存设置' }}</span>
        </button>
      </div>
    </section>

    <!-- ─── Preview Dialog ──────────────────────────── -->
    <div v-if="showPreview" class="face-library__overlay" @click.self="closePreview">
      <div class="face-library__dialog">
        <div class="face-library__dialog-head">
          <h3>{{ previewItem.name || '图像预览' }}</h3>
          <button class="face-library__dialog-close" @click="closePreview">
            <IconifyIconOnline icon="ri:close-line" />
          </button>
        </div>
        <div class="face-library__dialog-body">
          <div class="face-library__dialog-avatar" style="width:auto;height:auto;max-height:300px;padding:12px">
            <img v-if="previewItem.thumbnail" :src="previewItem.thumbnail" alt="" style="object-fit:contain;max-height:280px" />
            <IconifyIconOnline v-else icon="ri:image-line" />
          </div>
          <div class="face-library__dialog-meta">
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">名称</span>
              <span class="face-library__dialog-meta-value">{{ previewItem.name || '-' }}</span>
            </div>
            <div class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">尺寸</span>
              <span class="face-library__dialog-meta-value">{{ previewItem.width }}×{{ previewItem.height }}</span>
            </div>
            <div v-if="previewItem.tags" class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">标签</span>
              <span class="face-library__dialog-meta-value">{{ previewItem.tags }}</span>
            </div>
            <div v-if="previewItem.similarity !== undefined" class="face-library__dialog-meta-item">
              <span class="face-library__dialog-meta-label">相似度</span>
              <span class="face-library__dialog-meta-value" :class="scoreColor(previewItem.similarity)">
                {{ (previewItem.similarity * 100).toFixed(1) }}%
              </span>
            </div>
          </div>
        </div>
        <div class="face-library__dialog-foot">
          <button class="face-library__btn" @click="closePreview">关闭</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElInputNumber, ElMessageBox, ElSlider } from "element-plus";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import { message } from "@repo/utils";
import {
  uploadImage,
  searchImage,
  deleteImage,
  listImages,
  type ImageLibraryItem,
  type ImageSearchResultItem,
} from "../../../api/ai/image-library";
import { listAiGlobalSettings, replaceAiGlobalSettings } from "../../../api/ai/global-setting";
import { listAiModules, type AiModule } from "../../../api/ai/module";

const router = useRouter();

// ── Tabs ────────────────────────────────────────────
const tabs = [
  { key: "search", label: "以图搜图", icon: "ri:search-eye-line" },
  { key: "library", label: "图像库", icon: "ri:image-line" },
  { key: "upload", label: "上传图像", icon: "ri:upload-2-line" },
  { key: "settings", label: "控制设置", icon: "ri:settings-3-line" },
];
const activeTab = ref("search");

function switchTab(key: string) {
  activeTab.value = key;
  if (key !== "search") {
    searchedOnce.value = false;
  }
}

// ── File picker (shared) ───────────────────────────
const fileInputRef = ref<HTMLInputElement | null>(null);
const dragging = ref(false);
let currentPickerTarget = ref("search");

function openFilePicker(target: string) {
  currentPickerTarget.value = target;
  fileInputRef.value?.click();
}

function handleFilePick(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) applyFile(file);
  (e.target as HTMLInputElement).value = "";
}

function handleDrop(e: DragEvent) {
  dragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) applyFile(file);
}

function applyFile(file: File) {
  if (!file.type.startsWith("image/")) {
    message("请选择图片文件", { type: "warning" });
    return;
  }
  const dataUrl = readFileAsDataUrl(file);
  dataUrl.then((b64) => {
    if (currentPickerTarget.value === "search") {
      searchPreview.value = b64;
      searchImageBase64.value = b64;
    } else {
      uploadPreview.value = b64;
      uploadImageBase64.value = b64;
    }
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Search tab state ───────────────────────────────
const searchPreview = ref("");
const searchImageBase64 = ref("");
const searchForm = ref({ topK: 10, minSimilarity: 0.3, tags: "" });
const searching = ref(false);
const searchResults = ref<ImageSearchResultItem[]>([]);
const searchedOnce = ref(false);

async function handleSearch() {
  if (!searchImageBase64.value) return;
  searching.value = true;
  try {
    const res = await searchImage({
      image: searchImageBase64.value,
      topK: searchForm.value.topK,
      minSimilarity: searchForm.value.minSimilarity,
      tags: searchForm.value.tags || undefined,
    });
    searchResults.value = res.data || [];
    searchedOnce.value = true;
  } catch (e) {
    console.error("search failed", e);
  } finally {
    searching.value = false;
  }
}

// ── Library tab state ──────────────────────────────
const libraryItems = ref<ImageLibraryItem[]>([]);
const libraryTotal = ref(0);
const currentPage = ref(1);
const pageSize = 20;
const listFilter = ref({ name: "", tags: "" });
const deletingId = ref<number | null>(null);

const totalPages = computed(() => Math.max(1, Math.ceil(libraryTotal.value / pageSize)));

async function loadLibrary(page = 1) {
  currentPage.value = page;
  try {
    const res = await listImages({
      name: listFilter.value.name || undefined,
      tags: listFilter.value.tags || undefined,
      page,
      size: pageSize,
    });
    const data = res.data as { records: ImageLibraryItem[]; total: number } | undefined;
    libraryItems.value = data?.records || [];
    libraryTotal.value = data?.total || 0;
  } catch (e) {
    console.error("load library failed", e);
  }
}

async function handleDelete(item: ImageLibraryItem) {
  try {
    await ElMessageBox.confirm(
      `确认删除「${item.sysAiImageLibraryName || '未命名'}」？`,
      "提示",
      { type: "warning" }
    );
  } catch {
    return;
  }
  deletingId.value = item.sysAiImageLibraryId;
  try {
    await deleteImage(item.sysAiImageLibraryId);
    message("删除成功", { type: "success" });
    loadLibrary(currentPage.value);
  } catch (e: any) {
    message(e?.message || "删除失败", { type: "error" });
  } finally {
    deletingId.value = null;
  }
}

// ── Upload tab state ───────────────────────────────
const uploadPreview = ref("");
const uploadImageBase64 = ref("");
const uploadForm = ref({ name: "", tags: "" });
const uploading = ref(false);

function resetUpload() {
  uploadPreview.value = "";
  uploadImageBase64.value = "";
  uploadForm.value = { name: "", tags: "" };
}

async function handleUpload() {
  if (!uploadImageBase64.value) return;
  uploading.value = true;
  try {
    const res = await uploadImage({
      image: uploadImageBase64.value,
      name: uploadForm.value.name || undefined,
      tags: uploadForm.value.tags || undefined,
    });
    if ((res as any).success) {
      message("上传成功", { type: "success" });
      resetUpload();
      activeTab.value = "library";
      loadLibrary(1);
    }
  } catch (e: any) {
    message(e?.message || "上传失败", { type: "error" });
  } finally {
    uploading.value = false;
  }
}

// ── Preview dialog ─────────────────────────────────
const showPreview = ref(false);
const previewItem = ref<{
  name?: string;
  thumbnail?: string;
  tags?: string;
  width?: number;
  height?: number;
  similarity?: number;
}>({});

function openResultPreview(item: ImageSearchResultItem) {
  previewItem.value = {
    name: item.name,
    thumbnail: item.thumbnail,
    tags: item.tags,
    width: item.width,
    height: item.height,
    similarity: item.similarity,
  };
  showPreview.value = true;
}

function openLibraryPreview(item: ImageLibraryItem) {
  previewItem.value = {
    name: item.sysAiImageLibraryName,
    thumbnail: item.sysAiImageLibraryThumbnail,
    tags: item.sysAiImageLibraryTags,
    width: item.sysAiImageLibraryWidth,
    height: item.sysAiImageLibraryHeight,
  };
  showPreview.value = true;
}

function closePreview() {
  showPreview.value = false;
}

// ── Helpers ────────────────────────────────────────
function scoreColor(s: number | undefined): string {
  if (s === undefined) return "";
  if (s >= 0.8) return "score-high";
  if (s >= 0.5) return "score-mid";
  return "score-low";
}

// ── Settings ────────────────────────────────────────
const savingSettings = ref(false);
const settings = reactive({
  defaultImageFeatureModel: "",
  featureDimension: 512,
  minSimilarity: 0.3,
  vectorStorageEngine: "jvector",
  maxImageSize: 1024,
});

const featureModules = ref<AiModule[]>([]);

const loadModules = async () => {
  try {
    const featureRes = await listAiModules("IMAGE_FEATURE").catch(() => ({ data: [] }));
    const toArray = (v: unknown) => (Array.isArray(v) ? v : []);
    featureModules.value = toArray(featureRes.data).filter((m: any) => m.sysAiModuleStatus !== 0);
  } catch { /* ignore */ }
};

const loadSettings = async () => {
  try {
    const res = await listAiGlobalSettings("image_search");
    const list = res.data || [];
    const get = (field: string) => list.find((s) => s.sysAiGlobalSettingField === field)?.sysAiGlobalSettingValue;
    settings.defaultImageFeatureModel = get("default_image_feature_model") || "";
    settings.featureDimension = parseInt(get("feature_dimension") || "512");
    settings.minSimilarity = parseFloat(get("min_similarity") || "0.3");
    settings.vectorStorageEngine = get("vector_storage_engine") || "jvector";
    settings.maxImageSize = parseInt(get("max_image_size") || "1024");
  } catch { /* use defaults */ }
};

const handleSaveSettings = async () => {
  savingSettings.value = true;
  try {
    await replaceAiGlobalSettings([
      { sysAiGlobalSettingField: "default_image_feature_model", sysAiGlobalSettingValue: settings.defaultImageFeatureModel, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "feature_dimension", sysAiGlobalSettingValue: String(settings.featureDimension), sysAiGlobalSettingValueType: "INT" },
      { sysAiGlobalSettingField: "min_similarity", sysAiGlobalSettingValue: String(settings.minSimilarity), sysAiGlobalSettingValueType: "FLOAT" },
      { sysAiGlobalSettingField: "vector_storage_engine", sysAiGlobalSettingValue: settings.vectorStorageEngine, sysAiGlobalSettingValueType: "STRING" },
      { sysAiGlobalSettingField: "max_image_size", sysAiGlobalSettingValue: String(settings.maxImageSize), sysAiGlobalSettingValueType: "INT" },
    ], "image_search");
    message("设置已保存", { type: "success" });
  } catch (e: any) {
    message(e?.message || "保存失败", { type: "error" });
  } finally {
    savingSettings.value = false;
  }
};

// ── Init ────────────────────────────────────────────
onMounted(() => {
  loadLibrary(1);
  loadModules();
  loadSettings();
});
</script>

<style scoped lang="scss">
// ── Layout ────────────────────────────────────────
.face-library-workbench {
  min-height: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 0;
}

// ── Header ────────────────────────────────────────
.face-library__header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.face-library__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color);
  background: var(--el-fill-color-blank);
  color: var(--el-text-color-secondary);
  font-size: 18px;
  cursor: pointer;
  flex-shrink: 0;
  &:hover { background: var(--el-fill-color-light); }
}

.face-library__header-body {
  min-width: 0;
}

.face-library__header-title {
  margin: 0;
  font-size: 18px;
  color: var(--el-text-color-primary);
}

.face-library__header-desc {
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// ── Nav ────────────────────────────────────────────
.face-library__nav {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.face-library__nav-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: var(--el-text-color-secondary);
  white-space: nowrap;

  &:hover {
    background: var(--el-fill-color-light);
    color: var(--el-text-color-primary);
  }

  &.active {
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
  }

  :deep(svg) { font-size: 16px; }
}

// ── Panel ──────────────────────────────────────────
.face-library__panel {
  flex: 1;
  padding: 20px 24px;
  overflow: auto;
  display: flex;
  flex-direction: column;
}

// ── List panel ─────────────────────────────────────
.face-library__list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
  flex-shrink: 0;
}

.face-library__list-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

// ── Empty state ────────────────────────────────────
.face-library__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: var(--el-text-color-secondary);
}

.face-library__empty-icon {
  font-size: 52px;
  opacity: 0.25;
}

.face-library__empty-text {
  font-size: 15px;
  margin: 0;
}

// ── Card grid ──────────────────────────────────────
.face-library__card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.face-library__card {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  overflow: hidden;
  transition: transform 0.18s, box-shadow 0.18s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px color-mix(in srgb, var(--el-color-primary) 10%, transparent);
  }
}

.face-library__card-img {
  height: 150px;
  background: #0f172a;
  display: grid;
  place-items: center;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    transition: transform 0.3s;
  }

  &:hover img { transform: scale(1.05); }

  :deep(svg) {
    font-size: 40px;
    opacity: 0.25;
  }
}

.face-library__card-body {
  padding: 10px 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.face-library__card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.face-library__card-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 3px;
  :deep(svg) { font-size: 12px; }
}

.face-library__card-time {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  margin-top: 2px;
}

.face-library__card-actions {
  padding: 6px 12px 10px;
  display: flex;
  justify-content: flex-end;
}

.face-library__card-btn {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 15px;
  transition: all 0.15s;
  background: transparent;
  color: var(--el-text-color-secondary);

  &:hover {
    background: color-mix(in srgb, var(--el-color-danger) 14%, transparent);
    color: var(--el-color-danger);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}

// ── Upload zone ────────────────────────────────────
.face-library__upload-zone {
  position: relative;
  min-height: 200px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  cursor: pointer;
  border: 1px dashed color-mix(in srgb, var(--el-color-primary) 40%, transparent);
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  transition: border-color 0.18s, background 0.18s;
  overflow: hidden;

  &.is-dragging {
    border-color: var(--el-color-primary);
    background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-color-primary));
  }

  &.is-filled {
    border-style: solid;
    background: #0f172a;
  }
}

.face-library__upload-zone--compact {
  min-height: 160px;
  max-height: 260px;
}

.face-library__file-input { display: none; }

.face-library__upload-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  pointer-events: none;
}

.face-library__upload-plus {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 28px;
  background: linear-gradient(135deg,
    color-mix(in srgb, var(--el-color-primary) 80%, #0f172a),
    color-mix(in srgb, var(--el-color-info) 78%, #0f172a));
  color: #e8f3ff;
  box-shadow: 0 8px 24px color-mix(in srgb, var(--el-color-primary) 18%, transparent);
}

.face-library__upload-preview {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #0f172a;
}

// ── Form ───────────────────────────────────────────
.face-library__form-panel {
  overflow: auto;
}

.face-library__form-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 800px;
  flex: 1;
  align-content: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.face-library__form-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 4px;
}

.face-library__form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.face-library__form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);

  em {
    color: var(--el-color-danger);
    font-style: normal;
  }
}

.face-library__form-input {
  height: 36px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: var(--el-color-primary);
  }

  &::placeholder {
    color: var(--el-text-color-placeholder);
  }
}

.face-library__form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

// ── Buttons ────────────────────────────────────────
.face-library__btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 7px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 92%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &--primary {
    background: var(--el-color-primary);
    border-color: var(--el-color-primary);
    color: #fff;
    &:hover { background: var(--el-color-primary-light-3); }
  }

  &--lg {
    padding: 9px 20px;
    font-size: 14px;
  }
}

.face-library__spinner {
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

// ── Recognize (Search) layout ─────────────────────
.face-library__recognize-layout {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 20px;
  flex: 1;
  min-height: 0;

  @media (max-width: 800px) {
    grid-template-columns: 1fr;
  }
}

.face-library__recognize-left {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.face-library__recognize-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.face-library__ctrl {
  display: flex;
  align-items: center;
  gap: 10px;
}

.face-library__ctrl-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  min-width: 90px;
  flex-shrink: 0;
}

.face-library__ctrl-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.face-library__ctrl-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  min-width: 40px;
}

.face-library__recognize-right {
  min-height: 0;
  overflow: auto;
}

// ── Results ────────────────────────────────────────
.face-library__results-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 10px;
  color: var(--el-text-color-primary);
}

.face-library__results-idle,
.face-library__no-match {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 100%;
  min-height: 200px;
  color: var(--el-text-color-secondary);
  font-size: 14px;

  :deep(svg) {
    font-size: 40px;
    opacity: 0.25;
  }

  p { margin: 0; }
}

.face-library__result-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
  margin-bottom: 8px;
  transition: background 0.15s;
  cursor: pointer;
  &:hover { background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary)); }
}

.face-library__result-avatar {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: #0f172a;
  display: grid;
  place-items: center;

  img { width: 100%; height: 100%; object-fit: contain; }
  :deep(svg) { font-size: 24px; opacity: 0.3; }
}

.face-library__result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.face-library__result-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.face-library__result-sub {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.face-library__result-bar {
  height: 5px;
  background: color-mix(in srgb, var(--el-border-color) 40%, transparent);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 2px;
}

.face-library__result-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
  &.score-high { background: linear-gradient(90deg, #34d399, #10b981); }
  &.score-mid { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  &.score-low { background: linear-gradient(90deg, #f87171, #ef4444); }
}

.face-library__result-score {
  font-size: 18px;
  font-weight: 700;
  flex-shrink: 0;
  min-width: 60px;
  text-align: right;

  small { font-size: 12px; font-weight: 500; }
  &.score-high { color: #34d399; }
  &.score-mid { color: #fbbf24; }
  &.score-low { color: #f87171; }
}

// ── Dialog overlay ─────────────────────────────────
.face-library__overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: grid;
  place-items: center;
  background: color-mix(in srgb, #000 45%, transparent);
  backdrop-filter: blur(4px);
  animation: dialogFadeIn 0.18s ease;
}

@keyframes dialogFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.face-library__dialog {
  width: 480px;
  max-width: 92vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialogSlideIn 0.2s ease;
  overflow: hidden;
}

@keyframes dialogSlideIn {
  from { transform: translateY(20px) scale(0.97); opacity: 0; }
  to { transform: translateY(0) scale(1); opacity: 1; }
}

.face-library__dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.face-library__dialog-close {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--el-text-color-secondary);
  font-size: 18px;
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
    color: var(--el-text-color-primary);
  }
}

.face-library__dialog-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.face-library__dialog-avatar {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: #0f172a;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: 1px solid var(--el-border-color-lighter);

  img { max-width: 100%; object-fit: contain; }
  :deep(svg) { font-size: 48px; opacity: 0.2; }
}

.face-library__dialog-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 12px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--el-fill-color) 60%, transparent);
  border: 1px solid var(--el-border-color-lighter);
}

.face-library__dialog-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.face-library__dialog-meta-label {
  font-size: 11px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.face-library__dialog-meta-value {
  font-size: 12px;
  color: var(--el-text-color-primary);
  word-break: break-all;
  font-family: ui-monospace, monospace;
}

.face-library__dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 14px 20px 18px;
  border-top: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

// ── Copy of pagination from records ───────────────
.face-library__records-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  flex-shrink: 0;
}

.face-library__records-page-info {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  min-width: 60px;
  text-align: center;
}

// ── Button sm ──────────────────────────────────────
.face-library__btn--sm {
  padding: 5px 12px;
  font-size: 12px;
}


// ── Settings panel (from face-library) ──────────────────
.face-library__settings-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.face-library__settings-head {
  flex-shrink: 0;
  padding-bottom: 14px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  margin-bottom: 18px;

  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.face-library__settings-body {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.face-library__settings-group {
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
  border-radius: 10px;
  padding: 16px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary));
}

.face-library__settings-group-title {
  margin: 0 0 14px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid color-mix(in srgb, var(--el-color-primary) 10%, var(--el-border-color));
}

.face-library__settings-field {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 8px 0;

  & + & {
    border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 6%, transparent);
  }
}

.face-library__settings-label {
  min-width: 110px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  padding-top: 6px;
  flex-shrink: 0;
}

.face-library__settings-control {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;

  &--inline {
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }
}

.face-library__settings-select {
  height: 36px;
  padding: 0 30px 0 12px;
  border-radius: 8px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 20%, var(--el-border-color));
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  color: var(--el-text-color-primary);
  font-size: 13px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239399b4'%3E%3Cpath d='M7 10l5 5 5-5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 18px;
  max-width: 360px;
  transition: border-color 0.15s;

  &:focus { border-color: var(--el-color-primary); }
}

.face-library__settings-hint {
  margin: 2px 0 0;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.face-library__settings-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
  min-width: 40px;
}

.face-library__settings-foot {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 14px;
  margin-top: 18px;
  border-top: 1px solid color-mix(in srgb, var(--el-color-primary) 12%, var(--el-border-color));
}

.face-library__settings-foot-info {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--el-text-color-secondary);

  :deep(svg) { font-size: 15px; }
}

// ── Responsive ─────────────────────────────────────
@media (max-width: 640px) {
  .face-library__nav-item span { display: none; }
  .face-library__recognize-layout { grid-template-columns: 1fr; }
}
</style>


<style lang="scss">
:root {
  --app-bg-gradient: linear-gradient(135deg, #f8fafc, #f1f5f9, #eef2ff);
  --app-card-bg: rgba(255, 255, 255, 0.95);
  --app-card-shadow: 0 4px 20px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.01);
  --app-card-border: 1px solid rgba(255, 255, 255, 0.8);
  --app-border-radius: 16px;
  --app-input-radius: 10px;
  --app-button-radius: 10px;
  --app-transition: all 0.3s;
}

.system-container {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.system-container > * {
  position: relative;
  z-index: 1;
}

.modern-bg {
  background: var(--app-bg-gradient);
  position: relative;
}

.modern-bg::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(circle at 0% 0%, rgba(64, 158, 255, 0.08), transparent 50%),
    radial-gradient(circle at 100% 100%, rgba(103, 194, 58, 0.08), transparent 50%);
  pointer-events: none;
  z-index: -1;
}

html.dark .modern-bg {
  background: var(--el-bg-color-page) !important;
}
</style>
