<template>
  <PanelPage title="全局配置" subtitle="系统级默认参数与定时调度" :loading="loading">
    <template #actions>
      <el-button v-role="'admin'" type="primary" :loading="saving" @click="save">
        <el-icon v-if="!saving"><Download /></el-icon>
      </el-button>
    </template>

    <div class="global-config__content">
      <el-divider content-position="left">全局 ChatClient 配置</el-divider>
      <el-form :model="config" label-width="120px" class="config-form">
        <el-form-item label="默认模型">
          <el-select v-model="config.defaultModel" placeholder="请选择全局默认模型" style="width: 320px">
            <el-option v-for="m in models" :key="m.code" :label="m.name" :value="m.code">
              <span>{{ m.name }}</span>
              <span class="model-code">{{ m.code }}</span>
            </el-option>
          </el-select>
          <span class="form-hint">选择后全局 ChatClient 将使用该模型</span>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">用量</el-divider>
      <el-form :model="config" label-width="120px" class="config-form">
        <el-form-item label="启用用量分析">
          <el-switch v-model="config.enableUsageAnalysis" />
          <span class="form-hint">开启后记录每次对话的用量统计</span>
        </el-form-item>
        <el-form-item label="上报频率 (秒)">
          <el-input-number v-model="config.usageReportInterval" :min="10" :step="10" />
          <span class="form-hint">最小 10 秒</span>
        </el-form-item>
      </el-form>

      <el-divider content-position="left">RAG 配置</el-divider>
      <el-form :model="config" label-width="120px" class="config-form">
        <el-form-item label="向量模型">
          <el-select v-model="config.ragEmbeddingModel" placeholder="请选择向量模型" style="width: 320px" filterable>
            <el-option v-for="m in ragOptions.embeddingModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="form-hint">用于文档/图片文本向量化</span>
        </el-form-item>
        <el-form-item label="LLM 模型">
          <el-select v-model="config.ragLlmModel" placeholder="请选择 RAG 问答模型" style="width: 320px" filterable>
            <el-option v-for="m in ragOptions.llmModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="form-hint">用于 RAG 知识库问答</span>
        </el-form-item>
        <el-form-item label="OCR 模型">
          <el-select v-model="config.ragOcrModel" placeholder="请选择 OCR 识别模型" style="width: 320px" filterable>
            <el-option v-for="m in ragOptions.ocrModels" :key="m" :label="m" :value="m" />
          </el-select>
          <span class="form-hint">用于识别上传图片中的文字</span>
        </el-form-item>
        <el-form-item label="上传目录">
          <el-input v-model="config.ragUploadDir" placeholder="./rag-uploads" style="width: 320px" />
          <span class="form-hint">上传文件存储目录</span>
        </el-form-item>
        <el-form-item label="向量数据库">
          <el-select v-model="config.ragVectorStorage" placeholder="请选择向量数据库" style="width: 320px">
            <el-option v-for="s in ragOptions.vectorStorages" :key="s" :label="s" :value="s" />
          </el-select>
          <span class="form-hint">向量数据存储后端</span>
        </el-form-item>
      </el-form>
    </div>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 全局配置面板
 * 通过 useGlobalSettings composable 与后端 /v2/ai/global-settings 对接。
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { useGlobalSettings } from '../../composables/useGlobalSettings';
import { modelsApi, ragApi, type AiModel, type RagOptions } from '../../api';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const { settings, loading, saving, fetchSettings, saveSettings } = useGlobalSettings();

/** 全部模型（管理员可见全部数据） */
const models = ref<AiModel[]>([]);
const loadModels = async () => {
  try {
    models.value = await modelsApi.list();
  } catch {
    models.value = [];
  }
};

/** RAG 配置选项 */
const ragOptions = reactive<RagOptions>({
  embeddingModels: [],
  ocrModels: [],
  llmModels: [],
  vectorStorages: [],
});
const loadRagOptions = async () => {
  try {
    const opts = await ragApi.options();
    Object.assign(ragOptions, opts);
  } catch {
    // 保留默认空数组
  }
};

const config = reactive({
  defaultModel: '',
  enableUsageAnalysis: true,
  usageReportInterval: 60,
  ragEmbeddingModel: '',
  ragLlmModel: '',
  ragOcrModel: '',
  ragUploadDir: '',
  ragVectorStorage: '',
});

const syncFromSettings = () => {
  config.defaultModel = settings.value.defaultModel || '';
  config.enableUsageAnalysis = settings.value.enableUsageAnalysis ?? true;
  config.usageReportInterval = settings.value.usageReportInterval ?? 60;
  config.ragEmbeddingModel = settings.value.ragEmbeddingModel || '';
  config.ragLlmModel = settings.value.ragLlmModel || '';
  config.ragOcrModel = settings.value.ragOcrModel || '';
  config.ragUploadDir = settings.value.ragUploadDir || '';
  config.ragVectorStorage = settings.value.ragVectorStorage || '';
};

const save = async () => {
  Object.assign(settings.value, {
    defaultModel: config.defaultModel,
    enableUsageAnalysis: config.enableUsageAnalysis,
    usageReportInterval: config.usageReportInterval,
    ragEmbeddingModel: config.ragEmbeddingModel,
    ragLlmModel: config.ragLlmModel,
    ragOcrModel: config.ragOcrModel,
    ragUploadDir: config.ragUploadDir,
    ragVectorStorage: config.ragVectorStorage,
  });
  const ok = await saveSettings();
  if (ok) ElMessage.success('全局配置已保存');
  else ElMessage.error('保存失败');
};

onMounted(async () => {
  await fetchSettings();
  syncFromSettings();
  await Promise.all([loadModels(), loadRagOptions()]);
});
</script>

<style scoped>
.global-config__content {
  padding: 24px 28px;
  max-width: 720px;
}
.config-form {
  max-width: 600px;
}
.form-hint {
  font-size: 12px;
  color: var(--ai-text-muted);
  margin-left: 8px;
}
.model-code {
  float: right;
  color: var(--ai-text-muted);
  font-size: 12px;
  font-family: monospace;
  margin-left: 16px;
}
</style>
