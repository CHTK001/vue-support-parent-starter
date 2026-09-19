<template>
  <div class="re-rag-manager">
    <!-- 顶部状态栏 -->
    <div class="re-rag-manager__header">
      <div class="re-rag-manager__header-left">
        <div class="re-rag-manager__stat">
          <span class="re-rag-manager__stat-label">文档总数</span>
          <ReCountup :value="status.documentCount" class="re-rag-manager__stat-value" />
        </div>
        <div class="re-rag-manager__stat">
          <span class="re-rag-manager__stat-label">嵌入引擎</span>
          <el-select
            v-if="enableEngineSwitch"
            v-model="currentEngine"
            size="small"
            style="width: 140px"
            :disabled="!status.ragClientReady"
            @change="handleEngineChange"
          >
            <el-option
              v-for="e in engines"
              :key="e.value"
              :label="e.label"
              :value="e.value"
            />
          </el-select>
          <span v-else class="re-rag-manager__stat-value">{{ status.engine }}</span>
        </div>
        <div class="re-rag-manager__stat">
          <span class="re-rag-manager__stat-label">状态</span>
          <el-tag
            :type="status.ragClientReady ? 'success' : 'danger'"
            size="small"
            effect="light"
          >
            {{ status.ragClientReady ? "在线" : "离线" }}
          </el-tag>
        </div>
      </div>
      <div class="re-rag-manager__header-right">
        <slot name="header-actions">
          <el-button :loading="loading" size="small" @click="fetchStatus">
            <el-icon style="margin-right: 4px"><Refresh /></el-icon>
            刷新
          </el-button>
        </slot>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="re-rag-manager__tabs">
      <!-- 文件上传 -->
      <el-tab-pane label="文件上传" name="upload">
        <div class="re-rag-manager__upload">
          <ReUploadChunk
            v-model="uploadedList"
            :base-url="baseUrl"
            :headers="headers"
            :storage-type="storageType"
            :bucket="bucket"
            :chunk-size="5 * 1024 * 1024"
            drag
            @success="handleUploadSuccess"
          />
          <div class="re-rag-manager__upload-hint">
            上传后会自动索引到知识库，<el-link type="primary" @click="goToDocuments">前往文档列表</el-link>
          </div>
        </div>
      </el-tab-pane>

      <!-- URL 抓取 -->
      <el-tab-pane label="网页抓取" name="url">
        <div class="re-rag-manager__url">
          <ReCardTextarea
            v-model="urlInput"
            placeholder="输入要学习的网页 URL（支持多个换行）"
            :rows="5"
            class="re-rag-manager__url-input"
          />
          <div class="re-rag-manager__url-actions">
            <el-checkbox v-model="recursive">抓取子链接（最多 {{ maxRecursivePages }} 页）</el-checkbox>
            <el-button
              type="primary"
              :loading="urlCrawling"
              :disabled="!hasValidUrl"
              @click="handleUrlCrawl"
            >
              <el-icon style="margin-right: 4px"><Link /></el-icon>
              开始抓取
            </el-button>
          </div>
          <div v-if="crawlResults.length" class="re-rag-manager__url-results">
            <div class="re-rag-manager__url-results-title">抓取结果</div>
            <ul class="re-rag-manager__url-results-list">
              <li
                v-for="r in crawlResults"
                :key="r.url"
                class="re-rag-manager__url-result"
                :class="`is-${r.status}`"
              >
                <el-icon class="re-rag-manager__url-result-icon">
                  <component :is="r.status === 'success' ? Check : r.status === 'fail' ? Close : Loading" />
                </el-icon>
                <span class="re-rag-manager__url-result-url">{{ r.url }}</span>
                <span v-if="r.message" class="re-rag-manager__url-result-msg">{{ r.message }}</span>
              </li>
            </ul>
          </div>
        </div>
      </el-tab-pane>

      <!-- 文档列表 -->
      <el-tab-pane :label="`文档列表 (${documents.length})`" name="documents">
        <div class="re-rag-manager__toolbar">
          <el-input
            v-model="searchText"
            placeholder="搜索文档名"
            size="small"
            clearable
            style="width: 240px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
          <el-button :loading="loading" size="small" @click="fetchDocuments">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
        <el-table
          v-loading="loading"
          :data="filteredDocuments"
          size="small"
          stripe
          row-key="id"
        >
          <el-table-column label="名称" min-width="200">
            <template #default="{ row }">
              <div class="re-rag-manager__doc-name">
                <el-icon class="re-rag-manager__doc-icon">
                  <component :is="getDocumentIcon(row)" />
                </el-icon>
                <span :title="row.name">{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="100">
            <template #default="{ row }">
              <el-tag size="small" :type="row.source === 'URL' ? 'warning' : 'info'" effect="plain">
                {{ sourceLabel(row.source) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="100">
            <template #default="{ row }">
              <span v-if="row.size">{{ formatSize(row.size) }}</span>
              <span v-else>-</span>
            </template>
          </el-table-column>
          <el-table-column label="分片数" width="80">
            <template #default="{ row }">
              {{ row.chunkCount ?? "-" }}
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusTag(row.status)" size="small" effect="light">
                {{ statusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="创建时间" width="160">
            <template #default="{ row }">
              {{ row.createdAt ? formatDate(row.createdAt) : "-" }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160" fixed="right">
            <template #default="{ row }">
              <el-button
                link
                type="primary"
                size="small"
                @click="handlePreview(row)"
              >
                预览
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDelete(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="re-rag-manager__pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            small
            @current-change="fetchDocuments"
            @size-change="fetchDocuments"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 文档预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewTitle"
      width="600px"
      append-to-body
    >
      <div v-loading="previewLoading" class="re-rag-manager__preview">
        <pre>{{ previewContent }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * ReRagManager —— RAG 知识库管理
 *
 * 适配后端 RAG 服务：
 *   GET    /v2/ai/rag/status
 *   GET    /v2/ai/rag/document/list
 *   POST   /v2/ai/rag/document/upload
 *   DELETE /v2/ai/rag/document/{id}
 *   GET    /v2/ai/rag/document/{id}/content
 *   POST   /v2/ai/rag/document/url  (约定：URL 抓取)
 *   GET    /v2/ai/rag/embedding-engines
 *
 *   <ReRagManager base-url="/v2/ai/rag" />
 */
import { http } from "@repo/core";
import { ref, computed, onMounted } from "vue";
import {
  ElTabs,
  ElTabPane,
  ElInput,
  ElButton,
  ElIcon,
  ElTable,
  ElTableColumn,
  ElTag,
  ElPagination,
  ElDialog,
  ElCheckbox,
  ElLink,
  ElMessage,
  ElMessageBox,
} from "element-plus";
import {
  Refresh,
  Search,
  Link,
  Check,
  Close,
  Loading,
  Document,
  Files,
  Link as LinkIcon,
} from "@element-plus/icons-vue";
import ReUploadChunk from "../ReUploadChunk/index.vue";
import ReCountup from "../ReCountup/index.vue";
import ReCardTextarea from "../ReCardTextarea/index.vue";
import type { ChunkUploadFile } from "../ReUploadChunk/types";
import type { RagDocument, RagStatus, RagEmbeddingEngine } from "./types";

interface Props {
  /** 后端 RAG base URL */
  baseUrl: string;
  /** 知识库 ID */
  libraryId?: string;
  /** 请求头 */
  headers?: Record<string, string>;
  /** 默认嵌入引擎 */
  engine?: string;
  /** 抓取子页面最大数 */
  maxRecursivePages?: number;
  /** 存储类型（用于上传） */
  storageType?: string;
  /** 存储桶 */
  bucket?: string;
}

const props = withDefaults(defineProps<Props>(), {
  maxRecursivePages: 10,
  storageType: "local",
  bucket: "default",
});

const emit = defineEmits<{
  (e: "change", docs: RagDocument[]): void;
  (e: "add", doc: RagDocument): void;
  (e: "remove", id: string): void;
}>();

// 状态
const loading = ref(false);
const activeTab = ref("upload");
const documents = ref<RagDocument[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const searchText = ref("");

const status = ref<RagStatus>({
  engine: props.engine ?? "default",
  llmProvider: "",
  uploadDir: "",
  defaultTopK: 5,
  defaultSimilarityThreshold: 0.7,
  ragClientReady: false,
  documentCount: 0,
});

const engines = ref<RagEmbeddingEngine[]>(props.engine ? [{ value: props.engine, label: props.engine }] : []);
const enableEngineSwitch = computed(() => engines.value.length > 1);
const currentEngine = ref(props.engine ?? "");

// 上传
const uploadedList = ref<ChunkUploadFile[]>([]);

// URL 抓取
const urlInput = ref("");
const recursive = ref(false);
const urlCrawling = ref(false);
const crawlResults = ref<Array<{ url: string; status: "pending" | "success" | "fail"; message?: string }>>([]);

// 预览
const previewVisible = ref(false);
const previewTitle = ref("");
const previewContent = ref("");
const previewLoading = ref(false);

const filteredDocuments = computed(() => {
  if (!searchText.value) return documents.value;
  const q = searchText.value.toLowerCase();
  return documents.value.filter((d) => d.name.toLowerCase().includes(q));
});

const hasValidUrl = computed(() => {
  const urls = parseUrls(urlInput.value);
  return urls.length > 0;
});

const parseUrls = (text: string): string[] => {
  return text
    .split(/\s+/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\//i.test(s));
};

const fetchJson = async <T = any>(url: string, init: RequestInit = {}): Promise<{ code: number; message: string; data: T }> => {
  const method = (init.method ?? "GET").toUpperCase();
  const req = http()[method.toLowerCase() as "get" | "post" | "delete"](url).headers(props.headers ?? {});
  if (typeof init.body === "string") req.data(JSON.parse(init.body));
  const { data } = await req;
  return data;
};

const unwrap = <T = any>(res: { code: number; message: string; data: T }): T => {
  if (res.code !== 200) {
    throw new Error(res.message || "请求失败");
  }
  return res.data;
};

const fetchStatus = async () => {
  try {
    const res = await fetchJson<RagStatus>(`${props.baseUrl}/status`);
    status.value = unwrap(res);
  } catch (e) {
    console.error("fetch status failed", e);
  }
};

const fetchEngines = async () => {
  try {
    const res = await fetchJson<RagEmbeddingEngine[]>(`${props.baseUrl}/embedding-engines`);
    engines.value = unwrap(res);
    if (engines.value.length && !currentEngine.value) {
      currentEngine.value = engines.value[0].value;
    }
  } catch (e) {
    console.error("fetch engines failed", e);
  }
};

const fetchDocuments = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: String(page.value),
      pageSize: String(pageSize.value),
    });
    if (props.libraryId) params.set("libraryId", props.libraryId);
    const res = await fetchJson<{ records: RagDocument[]; total: number }>(
      `${props.baseUrl}/document/list?${params.toString()}`,
    );
    const data = unwrap(res);
    documents.value = data.records || [];
    total.value = data.total || 0;
    emit("change", documents.value);
  } catch (e) {
    console.error("fetch documents failed", e);
    ElMessage.error("加载文档列表失败");
  } finally {
    loading.value = false;
  }
};

const handleUploadSuccess = (file: ChunkUploadFile) => {
  if (file.url) {
    ElMessage.success(`已上传：${file.name}`);
    emit("add", {
      id: file.uploadId ?? file.name,
      name: file.name,
      size: file.size,
      status: "INDEXING",
      source: "FILE",
      createdAt: Date.now(),
    });
    activeTab.value = "documents";
    void fetchDocuments();
  }
};

const handleUrlCrawl = async () => {
  const urls = parseUrls(urlInput.value);
  if (urls.length === 0) {
    ElMessage.warning("请输入有效的 URL");
    return;
  }

  urlCrawling.value = true;
  crawlResults.value = urls.map((url) => ({ url, status: "pending" }));

  for (const item of crawlResults.value) {
    try {
      const res = await fetchJson<{ id: string; name: string }>(
        `${props.baseUrl}/document/url`,
        {
          method: "POST",
          body: JSON.stringify({
            url: item.url,
            recursive: recursive.value,
            maxPages: props.maxRecursivePages,
            libraryId: props.libraryId,
          }),
        },
      );
      const doc = unwrap(res);
      item.status = "success";
      item.message = "已加入索引";
      emit("add", {
        id: doc.id ?? item.url,
        name: doc.name ?? item.url,
        status: "INDEXING",
        source: "URL",
        sourceUrl: item.url,
        createdAt: Date.now(),
      });
    } catch (e) {
      item.status = "fail";
      item.message = (e as Error).message || "抓取失败";
    }
  }

  urlCrawling.value = false;
  void fetchDocuments();
};

const handlePreview = async (doc: RagDocument) => {
  previewVisible.value = true;
  previewTitle.value = doc.name;
  previewContent.value = "";
  previewLoading.value = true;
  try {
    const res = await fetchJson<string>(`${props.baseUrl}/document/${doc.id}/content`);
    previewContent.value = unwrap(res);
  } catch (e) {
    previewContent.value = `预览失败: ${(e as Error).message}`;
  } finally {
    previewLoading.value = false;
  }
};

const handleDelete = async (doc: RagDocument) => {
  try {
    await ElMessageBox.confirm(`确认删除文档 "${doc.name}" 吗？`, "提示", {
      type: "warning",
    });
  } catch {
    return;
  }
  try {
    const res = await fetchJson<boolean>(`${props.baseUrl}/document/${doc.id}`, { method: "DELETE" });
    if (unwrap(res)) {
      ElMessage.success("删除成功");
      emit("remove", doc.id);
      void fetchDocuments();
    }
  } catch (e) {
    ElMessage.error("删除失败");
  }
};

const handleEngineChange = (engine: string) => {
  ElMessage.info(`已切换到 ${engine} 引擎`);
};

const goToDocuments = () => {
  activeTab.value = "documents";
  void fetchDocuments();
};

const sourceLabel = (source?: string): string => {
  switch (source) {
    case "FILE": return "文件";
    case "URL": return "网页";
    case "TEXT": return "文本";
    default: return source || "-";
  }
};

const statusLabel = (status: string): string => {
  switch (status) {
    case "PENDING": return "等待";
    case "INDEXING": return "索引中";
    case "READY": return "就绪";
    case "FAILED": return "失败";
    default: return status;
  }
};

const statusTag = (status: string): "success" | "warning" | "danger" | "info" => {
  switch (status) {
    case "READY": return "success";
    case "INDEXING": return "warning";
    case "FAILED": return "danger";
    default: return "info";
  }
};

const getDocumentIcon = (doc: RagDocument): string => {
  if (doc.source === "URL") return LinkIcon;
  return Files;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
};

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

onMounted(() => {
  void fetchStatus();
  void fetchEngines();
  void fetchDocuments();
});

defineExpose({ refresh: fetchDocuments, fetchStatus });
// 避免未使用变量警告
void Document;
void Link;
</script>

<style scoped>
.re-rag-manager {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
}

.re-rag-manager__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.re-rag-manager__header-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.re-rag-manager__stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.re-rag-manager__stat-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-rag-manager__stat-value {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.re-rag-manager__tabs {
  flex: 1;
  padding: 0 20px 20px;
}

.re-rag-manager__tabs :deep(.el-tabs__content) {
  padding-top: 16px;
}

.re-rag-manager__upload-hint {
  margin-top: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.re-rag-manager__url {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.re-rag-manager__url-input {
  width: 100%;
}

.re-rag-manager__url-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.re-rag-manager__url-results {
  margin-top: 8px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-border-radius-base);
}

.re-rag-manager__url-results-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.re-rag-manager__url-results-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.re-rag-manager__url-result {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.re-rag-manager__url-result.is-success { color: var(--el-color-success); }
.re-rag-manager__url-result.is-fail { color: var(--el-color-danger); }
.re-rag-manager__url-result.is-pending { color: var(--el-text-color-secondary); }

.re-rag-manager__url-result-icon {
  font-size: 14px;
}

.re-rag-manager__url-result-url {
  flex: 1;
  word-break: break-all;
  font-family: monospace;
}

.re-rag-manager__url-result-msg {
  color: var(--el-text-color-secondary);
  font-style: italic;
}

.re-rag-manager__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.re-rag-manager__doc-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.re-rag-manager__doc-icon {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.re-rag-manager__pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.re-rag-manager__preview {
  min-height: 200px;
  max-height: 60vh;
  overflow: auto;
}

.re-rag-manager__preview pre {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  margin: 0;
}
</style>
