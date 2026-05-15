<template>
  <section class="rag-workbench system-container modern-bg">
    <!-- Ambient glow effects -->
    <div class="rag-glow rag-glow--primary" />
    <div class="rag-glow rag-glow--purple" />

    <!-- Header -->
    <div class="rag-workbench__header">
      <button class="rag-workbench__back" type="button" @click="router.push('/ai')">
        <IconifyIconOnline icon="ri:arrow-left-s-line" />
      </button>
      <div class="rag-workbench__header-info">
        <h2>RAG 知识库</h2>
        <p>上传文档 → 自动索引 → 智能问答</p>
      </div>
      <nav class="rag-workbench__nav">
        <button
          v-for="tab in tabs" :key="tab.key"
          class="rag-workbench__nav-btn"
          :class="{ active: activeTab === tab.key }"
          type="button"
          @click="activeTab = tab.key"
        >
          <IconifyIconOnline :icon="tab.icon" />
          <span>{{ tab.label }}</span>
        </button>
      </nav>
    </div>

    <!-- Tab 1: 文档管理 -->
    <div v-if="activeTab === 'documents'" class="rag-panel">
      <div class="rag-documents">
        <!-- Upload area -->
        <div class="rag-upload-area" @drop.prevent="handleDrop" @dragover.prevent>
          <el-upload
            ref="uploadRef"
            drag
            multiple
            :auto-upload="false"
            :show-file-list="false"
            :on-change="handleFileSelect"
            accept=".txt,.md,.pdf,.doc,.docx,.csv,.json,.xml,.html,.htm,.java,.ts,.js,.py,.yaml,.yml,.properties"
          >
            <div class="rag-upload__content">
              <IconifyIconOnline icon="ri:upload-cloud-2-line" class="rag-upload__icon" />
              <p class="rag-upload__text">拖拽文件到此处，或<em>点击选择</em></p>
              <p class="rag-upload__hint">支持 TXT / MD / PDF / DOC / 代码等格式</p>
            </div>
          </el-upload>
          <div v-if="uploadQueue.length > 0" class="rag-upload-queue">
            <div v-for="(item, idx) in uploadQueue" :key="idx" class="rag-upload-item">
              <IconifyIconOnline
                :icon="item.status === 'done' ? 'ri:checkbox-circle-fill' : item.status === 'error' ? 'ri:error-warning-fill' : 'ri:loader-4-line'"
                :class="'rag-upload-item__icon rag-upload-item__icon--' + item.status"
              />
              <span class="rag-upload-item__name">{{ item.name }}</span>
              <span class="rag-upload-item__size">{{ formatSize(item.size) }}</span>
              <span v-if="item.status === 'done'" class="rag-upload-item__status rag-upload-item__status--ok">完成</span>
              <span v-else-if="item.status === 'error'" class="rag-upload-item__status rag-upload-item__status--err" :title="item.error">{{ item.error || '失败' }}</span>
              <span v-else class="rag-upload-item__status">索引中...</span>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="rag-documents__toolbar">
          <span class="rag-documents__count">共 {{ totalDocs }} 个文档</span>
          <div class="rag-documents__actions">
            <el-button size="small" @click="loadDocuments" :loading="docLoading">
              <IconifyIconOnline icon="ri:refresh-line" /> 刷新
            </el-button>
            <el-button size="small" type="warning" plain @click="handleReset" :loading="resetting">
              <IconifyIconOnline icon="ri:restart-line" /> 重新索引全部
            </el-button>
          </div>
        </div>

        <!-- Document table -->
        <el-table v-loading="docLoading" :data="docList" style="width:100%" empty-text="暂无文档，请上传">
          <el-table-column label="文件名" min-width="200">
            <template #default="{ row }">
              <div class="rag-doc-name">
                <IconifyIconOnline :icon="getFileIcon(row.fileType)" class="rag-doc-name__icon" />
                <span>{{ row.fileName }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="类型" width="80" align="center">
            <template #default="{ row }">
              <el-tag size="small" effect="plain">{{ row.fileType.toUpperCase() }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="大小" width="100" align="right">
            <template #default="{ row }">{{ formatSize(row.fileSize) }}</template>
          </el-table-column>
          <el-table-column label="分块" width="70" align="center">
            <template #default="{ row }">{{ row.chunkCount || '-' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="110" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 'READY'" size="small" type="success">已就绪</el-tag>
              <el-tag v-else-if="row.status === 'PROCESSING'" size="small" type="warning">处理中</el-tag>
              <el-tag v-else size="small" type="danger" :title="row.errorMessage">失败</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="上传时间" width="170" align="center">
            <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="80" align="center" fixed="right">
            <template #default="{ row }">
              <el-button text type="danger" size="small" @click="handleDelete(row)">
                <IconifyIconOnline icon="ri:delete-bin-line" />
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- Pagination -->
        <div v-if="totalDocs > 0" class="rag-documents__pagination">
          <el-pagination
            v-model:current-page="docPage"
            :page-size="20"
            :total="totalDocs"
            layout="prev, pager, next"
            small
            @current-change="loadDocuments"
          />
        </div>
      </div>
    </div>

    <!-- Tab 2: 问答 -->
    <div v-if="activeTab === 'query'" class="rag-panel rag-panel--chat">
      <div class="rag-chat" ref="chatRef">
        <div v-if="messages.length === 0" class="rag-chat__empty">
          <IconifyIconOnline icon="ri:chat-1-line" class="rag-chat__empty-icon" />
          <p>上传文档后，在这里提问</p>
        </div>
        <div v-for="(msg, idx) in messages" :key="idx" class="rag-chat__msg" :class="'rag-chat__msg--' + msg.role">
          <div class="rag-chat__bubble">
            <div v-if="msg.role === 'user'" class="rag-chat__user-text">{{ msg.content }}</div>
            <div v-else class="rag-chat__ai">
              <div v-if="msg.loading" class="rag-chat__typing">
                <span class="rag-chat__dot" />
                <span class="rag-chat__dot" />
                <span class="rag-chat__dot" />
              </div>
              <div v-else class="rag-chat__answer" v-html="renderMarkdown(msg.content)" />
              <!-- Source citations -->
              <div v-if="msg.sources && msg.sources.length > 0" class="rag-chat__sources">
                <button class="rag-chat__sources-toggle" type="button" @click="msg.sourcesVisible = !msg.sourcesVisible">
                  <IconifyIconOnline icon="ri:file-list-2-line" />
                  引用来源 ({{ msg.sources.length }})
                  <IconifyIconOnline :icon="msg.sourcesVisible ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'" />
                </button>
                <div v-if="msg.sourcesVisible" class="rag-chat__sources-list">
                  <div v-for="(src, si) in msg.sources" :key="si" class="rag-chat__source-item">
                    <div class="rag-chat__source-header">
                      <span class="rag-chat__source-doc">{{ src.documentId }}</span>
                      <el-tag size="small" :type="src.score > 0.8 ? 'success' : 'warning'">{{ (src.score * 100).toFixed(0) }}%</el-tag>
                    </div>
                    <p class="rag-chat__source-content">{{ src.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="rag-chat__input-area">
        <div class="rag-chat__input-wrapper">
          <input
            v-model="queryText"
            class="rag-chat__input"
            placeholder="输入你的问题..."
            @keydown.enter.prevent="sendQuery"
          />
          <button class="rag-chat__send" type="button" :disabled="!queryText.trim() || queryLoading" @click="sendQuery">
            <IconifyIconOnline icon="ri:send-plane-2-fill" />
          </button>
        </div>
      </div>
    </div>

    <!-- Tab 3: 设置 -->
    <div v-if="activeTab === 'settings'" class="rag-panel">
      <div class="rag-settings">
        <div class="rag-settings-header">
          <IconifyIconOnline icon="ri:settings-4-line" />
          <span>RAG 配置</span>
        </div>

        <div class="rag-settings-section">
          <div class="rag-settings-section__head">
            <strong>向量引擎</strong>
            <small>控制文档向量化的方式</small>
          </div>
          <div class="rag-settings-form">
            <div class="rag-settings-field">
              <label>Embedding 引擎</label>
              <el-select v-model="settings.embeddingEngine" style="width:100%">
                <el-option label="Memory（内存哈希，脱机可用）" value="memory" />
                <el-option label="OpenAI" value="openai" />
                <el-option label="SiliconFlow" value="siliconflow" />
              </el-select>
            </div>
            <div class="rag-settings-field">
              <label>向量存储</label>
              <el-select v-model="settings.vectorStorage" style="width:100%">
                <el-option label="JVector（本地 HNSW）" value="jvector" />
                <el-option label="内存存储" value="memory" />
                <el-option label="Milvus" value="milvus" />
                <el-option label="MySQL" value="mysql" />
              </el-select>
            </div>
          </div>
        </div>

        <div class="rag-settings-section">
          <div class="rag-settings-section__head">
            <strong>分块参数</strong>
            <small>文档索引时的文本分块策略</small>
          </div>
          <div class="rag-settings-form">
            <div class="rag-settings-field">
              <label>分块大小</label>
              <el-input-number v-model="settings.chunkSize" :min="200" :max="4000" :step="100" style="width:100%" />
            </div>
            <div class="rag-settings-field">
              <label>分块重叠</label>
              <el-input-number v-model="settings.chunkOverlap" :min="0" :max="500" :step="50" style="width:100%" />
            </div>
          </div>
        </div>

        <div class="rag-settings-section">
          <div class="rag-settings-section__head">
            <strong>检索参数</strong>
            <small>问答时的检索策略</small>
          </div>
          <div class="rag-settings-form">
            <div class="rag-settings-field">
              <label>Top-K</label>
              <el-input-number v-model="settings.defaultTopK" :min="1" :max="20" style="width:100%" />
            </div>
            <div class="rag-settings-field">
              <label>相似度阈值</label>
              <el-slider v-model="settings.defaultSimilarityThreshold" :min="0" :max="1" :step="0.05" style="width:100%" />
            </div>
          </div>
        </div>

        <div class="rag-settings-section">
          <div class="rag-settings-section__head">
            <strong>LLM 配置</strong>
            <small>用于生成回答的大语言模型</small>
          </div>
          <div class="rag-settings-form">
            <div class="rag-settings-field">
              <label>Provider</label>
              <el-input v-model="settings.llmProvider" placeholder="如 openai / siliconflow" />
            </div>
            <div class="rag-settings-field">
              <label>Model</label>
              <el-input v-model="settings.llmModel" placeholder="如 gpt-4o / deepseek-chat" />
            </div>
            <div class="rag-settings-field">
              <label>API Key</label>
              <el-input v-model="settings.llmApiKey" type="password" placeholder="你的 API Key" show-password />
            </div>
            <div class="rag-settings-field">
              <label>Base URL</label>
              <el-input v-model="settings.llmBaseUrl" placeholder="如 https://api.openai.com/v1" />
            </div>
          </div>
        </div>

        <p class="rag-settings-tip">设置保存后需要重启应用生效</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElPagination, ElSlider, ElTable, ElTableColumn, ElTag, ElUpload } from "element-plus";
import type { UploadInstance } from "element-plus";
import {
  deleteDocument,
  listDocuments,
  ragQuery,
  resetRag,
  uploadDocument,
  type RagDocument,
  type RagQueryResult,
  type RagStatus,
} from "../../../api/ai/knowledge-graph";

const router = useRouter();

// ── Tabs ──
const tabs = [
  { key: "documents", label: "文档管理", icon: "ri:file-list-2-line" },
  { key: "query", label: "问答", icon: "ri:question-answer-line" },
  { key: "settings", label: "设置", icon: "ri:settings-4-line" },
];
const activeTab = ref("documents");

// ── Document management ──
const uploadRef = ref<UploadInstance>();
const docList = ref<RagDocument[]>([]);
const docLoading = ref(false);
const docPage = ref(1);
const totalDocs = ref(0);
const resetting = ref(false);

const uploadQueue = ref<{ name: string; size: number; status: string; error?: string }[]>([]);

function handleFileSelect(uploadFile: any) {
  const file = uploadFile.raw as File;
  if (!file) return;
  const item = { name: file.name, size: file.size, status: "uploading" };
  uploadQueue.value.push(item);
  doUpload(file, uploadQueue.value.length - 1);
}

async function handleDrop(e: DragEvent) {
  const files = Array.from(e.dataTransfer?.files || []);
  for (const file of files) {
    const item = { name: file.name, size: file.size, status: "uploading" };
    uploadQueue.value.push(item);
    await doUpload(file, uploadQueue.value.length - 1);
  }
}

async function doUpload(file: File, idx: number) {
  try {
    const res = await uploadDocument(file);
    if (res.success) {
      uploadQueue.value[idx].status = "done";
      loadDocuments();
    } else {
      uploadQueue.value[idx].status = "error";
      uploadQueue.value[idx].error = res.msg || "上传失败";
    }
  } catch (e: any) {
    uploadQueue.value[idx].status = "error";
    uploadQueue.value[idx].error = e?.message || "上传异常";
  }
}

async function loadDocuments() {
  docLoading.value = true;
  try {
    const res = await listDocuments(docPage.value, 20);
    if (res.success && res.data) {
      docList.value = res.data.items || [];
      totalDocs.value = res.data.total || 0;
    }
  } finally {
    docLoading.value = false;
  }
}

async function handleDelete(row: RagDocument) {
  try {
    await ElMessageBox.confirm(`确定删除 "${row.fileName}"？`, "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
    const res = await deleteDocument(row.id);
    if (res.success) {
      ElMessage.success("删除成功");
      loadDocuments();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch { /* cancelled */ }
}

async function handleReset() {
  try {
    await ElMessageBox.confirm("将清空向量存储并重新索引所有文档，确定继续？", "重新索引", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });
    resetting.value = true;
    const res = await resetRag();
    if (res.success) {
      ElMessage.success(`重新索引完成，共 ${res.data || 0} 个文档`);
    }
  } catch { /* cancelled */ }
  finally { resetting.value = false; }
}

// ── Q&A ──
const chatRef = ref<HTMLElement | null>(null);
const queryText = ref("");
const queryLoading = ref(false);

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: { documentId: string; content: string; score: number }[];
  sourcesVisible?: boolean;
  loading?: boolean;
}

const messages = ref<ChatMessage[]>([]);

async function sendQuery() {
  const text = queryText.value.trim();
  if (!text || queryLoading.value) return;

  queryText.value = "";
  messages.value.push({ role: "user", content: text });

  const aiMsg: ChatMessage = { role: "assistant", content: "", loading: true };
  messages.value.push(aiMsg);
  queryLoading.value = true;

  try {
    const res = await ragQuery(text);
    if (res.success && res.data) {
      aiMsg.loading = false;
      aiMsg.content = res.data.answer || "暂无回答";
      aiMsg.sources = (res.data as any).sources || [];
      aiMsg.sourcesVisible = aiMsg.sources.length <= 3;
    } else {
      aiMsg.loading = false;
      aiMsg.content = "查询失败: " + (res.msg || "未知错误");
    }
  } catch (e: any) {
    aiMsg.loading = false;
    aiMsg.content = "查询异常: " + (e?.message || "");
  } finally {
    queryLoading.value = false;
    scrollToBottom();
  }
}

function scrollToBottom() {
  setTimeout(() => {
    if (chatRef.value) {
      chatRef.value.scrollTop = chatRef.value.scrollHeight;
    }
  }, 50);
}

// ── Settings (local only, displayed as reference) ──
const settings = reactive({
  embeddingEngine: "memory",
  vectorStorage: "jvector",
  llmProvider: "",
  llmModel: "",
  llmApiKey: "",
  llmBaseUrl: "",
  chunkSize: 1000,
  chunkOverlap: 200,
  defaultTopK: 5,
  defaultSimilarityThreshold: 0.7,
});

// ── Utilities ──
function getFileIcon(type: string): string {
  const map: Record<string, string> = {
    pdf: "ri:file-pdf-2-line",
    doc: "ri:file-word-2-line",
    docx: "ri:file-word-2-line",
    md: "ri:markdown-line",
    txt: "ri:file-text-line",
    csv: "ri:file-excel-2-line",
    json: "ri:file-code-line",
    xml: "ri:file-code-line",
    html: "ri:html5-line",
    htm: "ri:html5-line",
    java: "ri:code-line",
    ts: "ri:code-line",
    js: "ri:code-line",
    py: "ri:code-line",
    yaml: "ri:file-code-line",
    yml: "ri:file-code-line",
  };
  return map[type.toLowerCase()] || "ri:file-2-line";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleString("zh-CN", { hour12: false });
}

function renderMarkdown(text: string): string {
  // Simple markdown rendering
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="rag-code-block"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="rag-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br>");
  return html;
}

// ── Init ──
onMounted(() => {
  loadDocuments();
});
</script>

<style scoped>
/* ── Layout ── */
.rag-workbench {
  position: relative; display: flex; flex-direction: column;
  height: calc(100vh - var(--saas-nav-height, 48px) - 2px);
  overflow: hidden;
  padding: 0 24px;
  background: color-mix(in srgb, var(--el-bg-color) 98%, var(--el-color-primary));
}

.rag-glow {
  position: fixed; width: 500px; height: 500px;
  border-radius: 50%; pointer-events: none; opacity: 0.08;
  filter: blur(80px); z-index: 0;
}
.rag-glow--primary { top: -120px; right: -80px; background: var(--el-color-primary); }
.rag-glow--purple { bottom: -100px; left: -60px; background: #8b5cf6; }

/* ── Header ── */
.rag-workbench__header {
  position: relative; z-index: 1;
  display: flex; align-items: center; gap: 16px;
  padding: 16px 0; border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}
.rag-workbench__back {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--el-border-color);
  background: var(--el-bg-color); cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: var(--el-text-color-secondary); transition: all 0.2s;
}
.rag-workbench__back:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.rag-workbench__header-info h2 { font-size: 18px; font-weight: 700; margin: 0; }
.rag-workbench__header-info p { font-size: 12px; color: var(--el-text-color-secondary); margin: 2px 0 0; }
.rag-workbench__nav { display: flex; gap: 4px; margin-left: auto; }
.rag-workbench__nav-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 8px; border: none;
  background: transparent; color: var(--el-text-color-secondary); cursor: pointer;
  font-size: 13px; transition: all 0.2s;
}
.rag-workbench__nav-btn:hover { background: color-mix(in srgb, var(--el-color-primary) 8%, transparent); color: var(--el-color-primary); }
.rag-workbench__nav-btn.active { background: var(--el-color-primary); color: #fff; }

/* ── Panel ── */
.rag-panel {
  position: relative; z-index: 1; flex: 1; overflow-y: auto;
  padding: 20px 0;
}
.rag-panel--chat {
  display: flex; flex-direction: column; padding-bottom: 0;
  overflow: hidden;
}

/* ── Documents ── */
.rag-upload-area {
  margin-bottom: 20px;
}
.rag-upload__content { text-align: center; padding: 30px 0; }
.rag-upload__icon { font-size: 48px; color: var(--el-color-primary); margin-bottom: 12px; }
.rag-upload__text { font-size: 14px; color: var(--el-text-color-regular); margin: 0; }
.rag-upload__text em { color: var(--el-color-primary); font-style: normal; font-weight: 600; }
.rag-upload__hint { font-size: 12px; color: var(--el-text-color-secondary); margin: 4px 0 0; }

.rag-upload-queue { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
.rag-upload-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-radius: 8px;
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary));
  font-size: 13px;
}
.rag-upload-item__icon { font-size: 16px; }
.rag-upload-item__icon--uploading { color: var(--el-color-primary); animation: spin 1s linear infinite; }
.rag-upload-item__icon--done { color: var(--el-color-success); }
.rag-upload-item__icon--error { color: var(--el-color-danger); }
.rag-upload-item__name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rag-upload-item__size { color: var(--el-text-color-secondary); font-size: 12px; white-space: nowrap; }
.rag-upload-item__status { font-size: 12px; }
.rag-upload-item__status--ok { color: var(--el-color-success); }
.rag-upload-item__status--err { color: var(--el-color-danger); }

.rag-documents__toolbar {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.rag-documents__count { font-size: 13px; color: var(--el-text-color-secondary); }
.rag-documents__actions { display: flex; gap: 8px; }
.rag-documents__pagination { display: flex; justify-content: center; margin-top: 16px; }

.rag-doc-name { display: flex; align-items: center; gap: 8px; }
.rag-doc-name__icon { font-size: 18px; color: var(--el-color-primary); }

/* ── Chat ── */
.rag-chat {
  flex: 1; overflow-y: auto; padding: 16px 0;
  display: flex; flex-direction: column; gap: 16px;
}
.rag-chat__empty {
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  color: var(--el-text-color-secondary); gap: 8px;
}
.rag-chat__empty-icon { font-size: 48px; opacity: 0.4; }

.rag-chat__msg {
  display: flex;
}
.rag-chat__msg--user { justify-content: flex-end; }
.rag-chat__msg--assistant { justify-content: flex-start; }

.rag-chat__bubble {
  max-width: 75%; padding: 12px 16px; border-radius: 12px;
  font-size: 14px; line-height: 1.6;
}
.rag-chat__msg--user .rag-chat__bubble {
  background: var(--el-color-primary); color: #fff;
  border-bottom-right-radius: 4px;
}
.rag-chat__msg--assistant .rag-chat__bubble {
  background: color-mix(in srgb, var(--el-bg-color) 94%, var(--el-color-primary));
  border: 1px solid var(--el-border-color-light);
  border-bottom-left-radius: 4px;
}

.rag-chat__typing { display: flex; gap: 4px; padding: 4px 0; }
.rag-chat__dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--el-text-color-secondary); animation: typingBounce 1.4s infinite;
}
.rag-chat__dot:nth-child(2) { animation-delay: 0.2s; }
.rag-chat__dot:nth-child(3) { animation-delay: 0.4s; }

.rag-chat__sources { margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--el-border-color-light); }
.rag-chat__sources-toggle {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: var(--el-color-primary); cursor: pointer;
  background: none; border: none; padding: 4px 0;
}
.rag-chat__sources-list { margin-top: 8px; display: flex; flex-direction: column; gap: 8px; }
.rag-chat__source-item {
  padding: 8px 10px; border-radius: 6px;
  background: color-mix(in srgb, var(--el-bg-color) 90%, var(--el-color-primary));
  font-size: 12px;
}
.rag-chat__source-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.rag-chat__source-doc { color: var(--el-text-color-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rag-chat__source-content { margin: 0; color: var(--el-text-color-regular); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

.rag-chat__input-area { flex-shrink: 0; padding: 12px 0; }
.rag-chat__input-wrapper {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid var(--el-border-color); border-radius: 12px;
  padding: 4px 4px 4px 16px;
  background: var(--el-bg-color); transition: border-color 0.2s;
}
.rag-chat__input-wrapper:focus-within { border-color: var(--el-color-primary); }
.rag-chat__input {
  flex: 1; border: none; outline: none; font-size: 14px;
  background: transparent; color: var(--el-text-color-primary);
}
.rag-chat__send {
  width: 36px; height: 36px; border-radius: 8px; border: none;
  background: var(--el-color-primary); color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
  transition: opacity 0.2s;
}
.rag-chat__send:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Code blocks in chat ── */
:deep(.rag-code-block) {
  background: #1e1e2e; color: #cdd6f4; padding: 12px; border-radius: 8px;
  overflow-x: auto; font-size: 13px; line-height: 1.5; margin: 8px 0;
}
:deep(.rag-inline-code) {
  background: color-mix(in srgb, var(--el-bg-color) 80%, var(--el-color-primary));
  padding: 2px 6px; border-radius: 4px; font-size: 13px;
}

/* ── Settings ── */
.rag-settings { max-width: 680px; }
.rag-settings-header {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 600; margin-bottom: 20px;
}
.rag-settings-section {
  margin-bottom: 24px; padding: 16px 20px;
  border: 1px solid var(--el-border-color-light); border-radius: 12px;
  background: var(--el-bg-color);
}
.rag-settings-section__head { margin-bottom: 12px; }
.rag-settings-section__head strong { display: block; font-size: 14px; }
.rag-settings-section__head small { font-size: 12px; color: var(--el-text-color-secondary); }
.rag-settings-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.rag-settings-field label { display: block; font-size: 13px; margin-bottom: 4px; color: var(--el-text-color-secondary); }
.rag-settings-tip { font-size: 12px; color: var(--el-text-color-secondary); text-align: center; margin-top: 16px; }

/* ── Dark mode ── */
:root.dark .rag-workbench {
  background: color-mix(in srgb, #0f0f1a 98%, var(--el-color-primary));
}
:root.dark .rag-glow--primary { opacity: 0.12; }
:root.dark .rag-glow--purple { opacity: 0.10; }
:root.dark :deep(.rag-code-block) { background: #0f0f1a; }

/* ── Animations ── */
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
