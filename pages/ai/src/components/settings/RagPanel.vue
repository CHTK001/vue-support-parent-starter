<template>
  <PanelPage title="RAG 知识库" subtitle="文档管理、向量化索引与问答测试" :loading="loading">
    <template #actions>
      <ReButton v-role="'admin'" type="primary" plain icon="Refresh" layout="modern" :loading="loading" @click="fetchAll">刷新</ReButton>
    </template>

    <!-- 服务状态 -->
    <el-descriptions :column="4" border size="small" class="rag-status">
      <el-descriptions-item label="Embedding 引擎">{{ status.engine || '-' }}</el-descriptions-item>
      <el-descriptions-item label="LLM 提供方">{{ status.llmProvider || '-' }}</el-descriptions-item>
      <el-descriptions-item label="上传目录">{{ status.uploadDir || '-' }}</el-descriptions-item>
      <el-descriptions-item label="文档总数">{{ status.documentCount ?? 0 }}</el-descriptions-item>
      <el-descriptions-item label="默认 TopK">{{ status.defaultTopK }}</el-descriptions-item>
      <el-descriptions-item label="默认相似度阈值">{{ status.defaultSimilarityThreshold }}</el-descriptions-item>
    </el-descriptions>

    <!-- 标签页：文档管理 / 问答测试 / 向量浏览 -->
    <el-tabs v-model="activeTab" class="rag-tabs">
      <!-- 文档管理 -->
      <el-tab-pane label="文档管理" name="docs">
        <div class="rag-section">
          <div class="rag-actions">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="onFileChange"
              accept=".pdf,.txt,.md,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.json,.html"
            >
              <ReButton v-role="'admin'" type="primary" plain icon="Upload" layout="modern" :loading="uploading">上传文档</ReButton>
            </el-upload>
            <el-input v-model="docsKeyword" placeholder="按文件名搜索" clearable style="width:260px" />
            <ReButton v-role="'admin'" type="danger" plain icon="Refresh" layout="modern" :loading="resetLoading" @click="onReset">重建索引</ReButton>
          </div>

          <el-table :data="pagedDocuments" stripe v-loading="loading" empty-text="暂无文档">
            <el-table-column prop="fileName" label="文件名" min-width="220" show-overflow-tooltip />
            <el-table-column prop="fileType" label="类型" width="100" />
            <el-table-column prop="fileSize" label="大小" width="120">
              <template #default="{ row }">{{ formatBytes(row.fileSize) }}</template>
            </el-table-column>
            <el-table-column prop="chunkCount" label="分块" width="80" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)" size="small" effect="light">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">{{ formatTime(row.createTime) }}</template>
            </el-table-column>
            <el-table-column v-role="'admin'" label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button v-role="'admin'" v-if="row.status === 'FAILED'" type="text" size="small" @click="showError(row)">查看错误</el-button>
                <el-button v-role="'admin'" type="text" size="small" @click="onPreview(row)">预览</el-button>
                <el-button v-role="'admin'" type="text" size="small" style="color:#f56c6c" @click="onDelete(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <el-pagination
            v-model:current-page="docsPage"
            v-model:page-size="docsPageSize"
            :total="filteredDocuments.length"
            :page-sizes="[10, 20, 50]"
            layout="total, sizes, prev, pager, next, jumper"
            class="rag-pager"
          />
        </div>
      </el-tab-pane>

      <!-- 问答测试 -->
      <el-tab-pane label="问答测试" name="ask">
        <div class="rag-section">
          <div class="rag-ask-input">
            <el-input v-model="askQuery" type="textarea" :rows="3" placeholder="输入问题（基于已索引文档问答）" />
            <div class="rag-ask-controls">
              <el-input-number v-model="askTopK" :min="1" :max="20" controls-position="right" placeholder="TopK" style="width:120px" />
              <el-input-number v-model="askThreshold" :min="0" :max="1" :step="0.05" :precision="2" controls-position="right" placeholder="相似度阈值" style="width:140px" />
              <ReButton type="primary" plain icon="Promotion" layout="modern" :loading="askLoading" @click="onAsk">提问</ReButton>
            </div>
          </div>

          <div v-if="askResult" class="rag-ask-result">
            <el-alert type="success" :closable="false" class="rag-answer">
              <template #title>
                <strong>答案</strong>
              </template>
              <div class="rag-answer__text">{{ askResult.answer }}</div>
            </el-alert>
            <div v-if="askResult.sources && askResult.sources.length > 0" class="rag-sources">
              <h4>引用来源（{{ askResult.sources.length }}）</h4>
              <el-card v-for="(src, i) in askResult.sources" :key="i" class="rag-source-card" shadow="hover">
                <div class="rag-source-card__head">
                  <span class="rag-source-card__id">文档 #{{ src.documentId }}</span>
                  <el-tag size="small" type="info">相似度 {{ src.score.toFixed(3) }}</el-tag>
                </div>
                <div class="rag-source-card__content">{{ src.content }}</div>
              </el-card>
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 向量浏览 -->
      <el-tab-pane label="向量浏览" name="vectors">
        <div class="rag-section">
          <div class="rag-actions">
            <el-input v-model="vectorQuery" placeholder="输入查询文本（纯向量搜索，不走 LLM）" clearable style="width:340px" />
            <el-input-number v-model="vectorTopK" :min="1" :max="50" controls-position="right" style="width:120px" />
            <ReButton v-role="'admin'" type="primary" plain icon="Search" layout="modern" :loading="vectorLoading" @click="onVectorSearch">向量搜索</ReButton>
          </div>
          <el-table :data="vectorItems" v-loading="vectorLoading" empty-text="暂无结果">
            <el-table-column prop="documentId" label="文档 ID" min-width="180" />
            <el-table-column label="相似度" width="120">
              <template #default="{ row }">{{ row.score.toFixed(3) }}</template>
            </el-table-column>
            <el-table-column prop="content" label="内容片段" min-width="400" show-overflow-tooltip />
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 文档预览 -->
    <el-dialog v-model="previewVisible" title="文档预览" width="640px">
      <pre v-if="previewContent" class="rag-preview">{{ previewContent }}</pre>
      <el-empty v-else description="无法读取此文档内容（仅文本文件可预览）" />
    </el-dialog>

    <!-- 失败错误 -->
    <el-dialog v-model="errorVisible" title="处理失败原因" width="520px">
      <pre class="rag-error">{{ errorMessage }}</pre>
    </el-dialog>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * RAG 知识库管理面板
 *
 * - 文档管理：上传 / 列表（搜索 + 分页）/ 删除 / 预览
 * - 问答测试：基于知识库问答，显示答案 + 引用来源
 * - 向量浏览：纯向量搜索（不调用 LLM）
 * - 重建索引：清空向量库并重新索引所有文档
 */
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import PanelPage from '../PanelPage.vue';
import ReButton from '@repo/ui/re-button';
import { ragApi, ragDocumentsApi, type RagDocument, type RagStatus } from '@pages/ai/api';

defineProps<{ id?: string }>();

const loading = ref(false);
const uploading = ref(false);
const resetLoading = ref(false);
const activeTab = ref('docs');

const status = reactive<RagStatus>({
  engine: '',
  llmProvider: '',
  uploadDir: '',
  defaultTopK: 5,
  defaultSimilarityThreshold: 0.5,
  ragClientReady: false,
  documentCount: 0,
});

const documents = ref<RagDocument[]>([]);
const docsKeyword = ref('');
const docsPage = ref(1);
const docsPageSize = ref(10);

const askQuery = ref('');
const askTopK = ref(5);
const askThreshold = ref(0.5);
const askLoading = ref(false);
const askResult = ref<{ answer: string; sources: Array<{ documentId: string; content: string; score: number }> } | null>(null);

const vectorQuery = ref('');
const vectorTopK = ref(10);
const vectorLoading = ref(false);
const vectorItems = ref<Array<{ documentId: string; content: string; score: number }>>([]);

const previewVisible = ref(false);
const previewContent = ref('');

const errorVisible = ref(false);
const errorMessage = ref('');

const filteredDocuments = computed(() => {
  const kw = docsKeyword.value.trim().toLowerCase();
  if (!kw) return documents.value;
  return documents.value.filter((d) => d.fileName.toLowerCase().includes(kw));
});

const pagedDocuments = computed(() => {
  const start = (docsPage.value - 1) * docsPageSize.value;
  return filteredDocuments.value.slice(start, start + docsPageSize.value);
});

const fetchDocuments = async () => {
  loading.value = true;
  try {
    const r = await ragDocumentsApi.list({ page: 1, pageSize: 100 });
    documents.value = r.records || [];
    status.documentCount = r.total;
  } catch (e) {
    ElMessage.error('文档列表加载失败：' + (e as Error).message);
  } finally {
    loading.value = false;
  }
};

const fetchStatus = async () => {
  try {
    const r = await ragApi.status();
    Object.assign(status, r);
  } catch (e) {
    // 静默失败
  }
};

const fetchAll = async () => {
  loading.value = true;
  try {
    await Promise.all([fetchDocuments(), fetchStatus()]);
  } finally {
    loading.value = false;
  }
};

const onFileChange = async (file: { raw?: File } | File) => {
  const f = (file as { raw?: File }).raw || (file as File);
  if (!f) return;
  uploading.value = true;
  try {
    const doc = await ragDocumentsApi.upload(f);
    if (doc.status === 'FAILED') {
      ElMessage.error(`上传失败：${doc.errorMessage || '未知错误'}`);
    } else {
      ElMessage.success(`上传成功：${doc.fileName}`);
      await fetchAll();
    }
  } catch (e) {
    ElMessage.error('上传失败：' + (e as Error).message);
  } finally {
    uploading.value = false;
  }
};

const onDelete = async (row: RagDocument) => {
  try {
    await ElMessageBox.confirm(`确认删除文档「${row.fileName}」？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
    const ok = await ragDocumentsApi.delete(row.id);
    if (ok) {
      ElMessage.success('删除成功');
      await fetchAll();
    } else {
      ElMessage.error('文档不存在');
    }
  } catch (e) {
    // 用户取消或失败
    if ((e as Error).message) {
      ElMessage.error('删除失败：' + (e as Error).message);
    }
  }
};

const onPreview = async (row: RagDocument) => {
  previewVisible.value = true;
  previewContent.value = '';
  try {
    const c = await ragDocumentsApi.content(row.id);
    previewContent.value = c || '';
  } catch (e) {
    previewContent.value = '';
  }
};

const showError = (row: RagDocument) => {
  errorMessage.value = row.errorMessage || '未知错误';
  errorVisible.value = true;
};

const onAsk = async () => {
  if (!askQuery.value.trim()) {
    ElMessage.warning('请输入问题');
    return;
  }
  askLoading.value = true;
  try {
    askResult.value = await ragApi.query(askQuery.value, {
      topK: askTopK.value,
      threshold: askThreshold.value,
    });
  } catch (e) {
    ElMessage.error('问答失败：' + (e as Error).message);
    askResult.value = null;
  } finally {
    askLoading.value = false;
  }
};

const onVectorSearch = async () => {
  if (!vectorQuery.value.trim()) {
    ElMessage.warning('请输入查询文本');
    return;
  }
  vectorLoading.value = true;
  try {
    vectorItems.value = await ragApi.searchVectors(vectorQuery.value, vectorTopK.value);
  } catch (e) {
    ElMessage.error('向量搜索失败：' + (e as Error).message);
    vectorItems.value = [];
  } finally {
    vectorLoading.value = false;
  }
};

const onReset = async () => {
  try {
    await ElMessageBox.confirm('重建索引将清空向量库并重新处理所有文档，耗时较长，确认继续？', '重建索引', {
      type: 'warning',
      confirmButtonText: '开始重建',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  resetLoading.value = true;
  try {
    const n = await ragApi.reset();
    ElMessage.success(`重建完成，共 ${n} 个文档`);
    await fetchAll();
  } catch (e) {
    ElMessage.error('重建失败：' + (e as Error).message);
  } finally {
    resetLoading.value = false;
  }
};

const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
};

const formatTime = (ts: number) => {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('zh-CN');
};

const statusType = (s: string) => {
  if (s === 'READY') return 'success';
  if (s === 'FAILED') return 'danger';
  if (s === 'PROCESSING') return 'warning';
  return 'info';
};

onMounted(() => {
  fetchAll();
});
</script>

<style scoped>
.rag-status {
  margin-bottom: var(--ai-spacing-md);
}
.rag-tabs {
  height: 100%;
}
.rag-tabs :deep(.el-tabs__content) {
  padding-top: var(--ai-spacing-md);
  height: calc(100% - 56px);
  overflow-y: auto;
}
.rag-section {
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-md);
}
.rag-actions {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-sm);
  flex-wrap: wrap;
}
.rag-pager {
  justify-content: flex-end;
}
.rag-ask-input {
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-sm);
}
.rag-ask-controls {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-sm);
}
.rag-answer__text {
  margin-top: 8px;
  white-space: pre-wrap;
  word-break: break-word;
}
.rag-sources h4 {
  margin: 12px 0 8px;
}
.rag-source-card {
  margin-bottom: 8px;
}
.rag-source-card__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.rag-source-card__id {
  font-weight: 600;
}
.rag-source-card__content {
  font-size: 13px;
  color: var(--ai-text-secondary);
  white-space: pre-wrap;
}
.rag-preview,
.rag-error {
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 60vh;
  overflow-y: auto;
  font-size: 12px;
}
</style>
