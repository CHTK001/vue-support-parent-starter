<template>
  <PanelPage title="全局配置" subtitle="系统级默认参数与定时调度" :loading="loading">
    <template #actions>
      <ReButton v-role="'admin'" type="primary" icon="Download" layout="modern" :loading="saving" @click="save" />
    </template>

    <div class="global-config__content">
      <ReText tag="div" type="primary" class="section-title">全局 ChatClient 配置</ReText>
      <el-form label-position="top" class="config-form">
        <el-form-item label="默认模型">
          <ReSelect
            v-model="config.defaultModel"
            :options="modelOptions"
            layout="card"
            placeholder="请选择全局默认模型"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="系统提示词">
          <ReInput
            v-model="config.systemPrompt"
            type="textarea"
            :rows="3"
            placeholder="你是一个乐于助人的 AI 助手…"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <ReText tag="div" type="primary" class="section-title">用量</ReText>
      <el-form label-position="top" class="config-form">
        <el-form-item label="启用用量分析">
          <ReSwitch
            v-model="config.enableUsageAnalysis"
            layout="card"
            title="启用用量分析"
            sub="usage"
            description="开启后记录每次对话的用量统计，并定时上报"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="上报频率 (秒)">
          <ReInputNumber
            v-model="config.usageReportInterval"
            :min="10"
            :step="10"
            layout="card"
            suffix="秒"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <ReText tag="div" type="primary" class="section-title">聚合协议服务</ReText>
      <el-form label-position="top" class="config-form">
        <div :class="['status-bar', protocolRunning ? 'status-bar--running' : 'status-bar--stopped']">
          <span :class="['status-bar__dot', protocolRunning ? 'status-bar__dot--on' : '']" />
          <span>{{ protocolRunning ? '服务运行中' : '服务已停止' }}</span>
          <span v-if="protocolRunning" class="status-bar__info">
            端口 {{ protocolPort }} · 底层客户端 {{ protocolClientCount }} 个
          </span>
          <el-button
            v-role="'admin'"
            :type="protocolRunning ? 'danger' : 'success'"
            size="small"
            plain
            :loading="protocolLoading"
            @click="toggleProtocolServer"
          >
            {{ protocolRunning ? '停止服务' : '启动服务' }}
          </el-button>
        </div>
        <el-form-item label="启用聚合协议服务">
          <ReSwitch
            v-model="config.protocolServerEnabled"
            layout="card"
            title="启用聚合协议服务"
            sub="protocol"
            description="独立端口提供 OpenAI / Claude / Gemini 三协议端点，端口可配置"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="协议服务端口">
          <ReInputNumber
            v-model="config.protocolServerPort"
            :min="1024"
            :max="65535"
            layout="card"
            suffix="端口"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>

      <ReText tag="div" type="primary" class="section-title">RAG 配置</ReText>
      <el-form label-position="top" class="config-form">
        <el-form-item label="向量模型">
          <ReSelect
            v-model="config.ragEmbeddingModel"
            :options="stringOptions(ragOptions.embeddingModels)"
            layout="card"
            filterable
            placeholder="请选择向量模型"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="LLM 模型">
          <ReSelect
            v-model="config.ragLlmModel"
            :options="stringOptions(ragOptions.llmModels)"
            layout="card"
            filterable
            placeholder="请选择 RAG 问答模型"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="OCR 模型">
          <ReSelect
            v-model="config.ragOcrModel"
            :options="stringOptions(ragOptions.ocrModels)"
            layout="card"
            filterable
            placeholder="请选择 OCR 识别模型"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="上传目录">
          <div class="upload-dir">
            <ReInput
              v-model="config.ragUploadDir"
              placeholder="./rag-uploads"
              style="width: 100%"
              class="upload-dir__input"
            />
            <ReButton type="primary" plain icon="FolderOpened" layout="modern" @click="showDirPicker = true">
              浏览
            </ReButton>
          </div>
        </el-form-item>
        <el-form-item label="向量数据库">
          <ReSelect
            v-model="config.ragVectorStorage"
            :options="stringOptions(ragOptions.vectorStorages)"
            layout="card"
            placeholder="请选择向量数据库"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="切片大小">
          <ReInputNumber
            v-model="config.ragChunkSize"
            :min="100"
            :step="100"
            layout="card"
            suffix="字符"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="切片重叠">
          <ReInputNumber
            v-model="config.ragChunkOverlap"
            :min="0"
            :step="50"
            layout="card"
            suffix="字符"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="切片策略">
          <ReSelect
            v-model="config.ragSplitter"
            :options="stringOptions(ragOptions.splitters)"
            layout="card"
            placeholder="请选择文本切片策略"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="RAG 系统提示词">
          <ReInput
            v-model="config.ragSystemPrompt"
            type="textarea"
            :rows="3"
            placeholder="你是知识库问答助手，请基于给定上下文回答…"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
    </div>

    <ReFilePicker
      v-model="showDirPicker"
      title="选择上传目录"
      directory-mode
      :loader="loadServerDirs"
      @select="onPickDir"
    />
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 全局配置面板
 * 通过 useGlobalSettings composable 与后端 /api/ai/v2/global-settings 对接。
 * 表单使用 Re 组件库（ReSelect/ReInputNumber/ReSwitch/ReInput/ReButton/ReText），下拉/数字/开关均 card 布局。
 */
import { ref, reactive, onMounted, computed } from 'vue';
import { ElMessage } from 'element-plus';
import ReButton from '@repo/ui/re-button';
import ReText from '@repo/ui/re-text';
import ReSelect from '@repo/ui/re-select';
import ReInput from '@repo/ui/re-input';
import ReInputNumber from '@repo/ui/re-input-number';
import ReSwitch from '@repo/ui/re-switch';
import ReFilePicker from '@repo/ui/re-file-picker';
import { useGlobalSettings } from '@pages/ai/composables/useGlobalSettings';
import { get, modelsApi, ragApi, runtimeApi, type AiModel, type RagOptions } from '@pages/ai/api';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const { settings, loading, saving, fetchSettings, saveSettings } = useGlobalSettings();

/** 全部模型（管理员可见全部数据） */
const models = ref<AiModel[]>([]);
const loadModels = async () => {
  try {
    const res = await modelsApi.list();
    models.value = Array.isArray(res) ? res : [];
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
  splitters: [],
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
  systemPrompt: '',
  enableUsageAnalysis: true,
  usageReportInterval: 60,
  ragEmbeddingModel: '',
  ragLlmModel: '',
  ragOcrModel: '',
  ragUploadDir: '',
  ragVectorStorage: '',
  ragChunkSize: 1000,
  ragChunkOverlap: 200,
  ragSystemPrompt: '',
  ragSplitter: 'sentence',
  protocolServerEnabled: false,
  protocolServerPort: 8090,
});

/** 服务器目录选择弹窗 */
const showDirPicker = ref(false);

/** 后端 /dir/list 返回 { name, path } 目录数组，转换为 ReFilePicker 项 */
const loadServerDirs = async (path: string): Promise<{ key: string; name: string; isDir: boolean }[]> => {
  const list = await get<Array<{ name: string; path: string }>>('/dir/list', { path: path === '/' ? '' : path });
  return list.map((d) => ({ key: d.path, name: d.name, isDir: true }));
};

/** 选择目录后回填上传目录配置 */
const onPickDir = (items: { key: string; name: string; isDir: boolean }[]) => {
  const dir = items[0];
  if (dir) config.ragUploadDir = dir.key;
};

const syncFromSettings = () => {
  config.defaultModel = settings.value.defaultModel || '';
  config.systemPrompt = settings.value.systemPrompt || '';
  config.enableUsageAnalysis = settings.value.enableUsageAnalysis ?? true;
  config.usageReportInterval = settings.value.usageReportInterval ?? 60;
  config.ragEmbeddingModel = settings.value.ragEmbeddingModel || '';
  config.ragLlmModel = settings.value.ragLlmModel || '';
  config.ragOcrModel = settings.value.ragOcrModel || '';
  config.ragUploadDir = settings.value.ragUploadDir || '';
  config.ragVectorStorage = settings.value.ragVectorStorage || '';
  config.ragChunkSize = settings.value.ragChunkSize ?? 1000;
  config.ragChunkOverlap = settings.value.ragChunkOverlap ?? 200;
  config.ragSystemPrompt = settings.value.ragSystemPrompt || '';
  config.ragSplitter = settings.value.ragSplitter || 'sentence';
};

/** 默认模型下拉选项 */
const modelOptions = computed(() => (models.value || []).map((m) => ({ label: m.name, value: m.code })));

/** 纯字符串选项转 ReSelect options */
const stringOptions = (arr: string[]): { label: string; value: string }[] => arr.map((s) => ({ label: s, value: s }));

/** 聚合协议服务运行状态 */
const protocolRunning = ref(false);
const protocolPort = ref(0);
const protocolClientCount = ref(0);
const protocolLoading = ref(false);

/** 刷新聚合协议服务状态 */
const refreshProtocolStatus = async () => {
  try {
    const st = await runtimeApi.protocolStatus();
    protocolRunning.value = st.running;
    protocolPort.value = st.port;
    protocolClientCount.value = st.clientCount;
  } catch {
    protocolRunning.value = false;
  }
};

/** 启停聚合协议服务 */
const toggleProtocolServer = async () => {
  protocolLoading.value = true;
  try {
    if (protocolRunning.value) {
      await runtimeApi.protocolStop();
      ElMessage.success('聚合协议服务已停止');
      protocolRunning.value = false;
    } else {
      await runtimeApi.protocolStart();
      ElMessage.success('聚合协议服务已启动');
      await refreshProtocolStatus();
    }
  } catch (e) {
    ElMessage.error((e as Error).message || '操作失败');
  } finally {
    protocolLoading.value = false;
  }
};

/** 从 runtime 分组加载协议服务配置（启用开关 / 端口） */
const loadProtocolConfig = async () => {
  try {
    const items = await runtimeApi.config();
    for (const it of items) {
      if (it.field === 'protocol_server_enabled') {
        config.protocolServerEnabled = it.value === 'true';
      } else if (it.field === 'protocol_server_port') {
        config.protocolServerPort = Number(it.value) || 8090;
      }
    }
  } catch {
    // 保留默认值
  }
};

/** 保存协议服务配置到 runtime 分组 */
const saveProtocolConfig = async () => {
  try {
    await runtimeApi.updateConfig([
      { field: 'protocol_server_enabled', value: String(config.protocolServerEnabled) },
      { field: 'protocol_server_port', value: String(config.protocolServerPort) },
    ]);
  } catch (e) {
    ElMessage.error('协议服务配置保存失败: ' + ((e as Error).message || ''));
    return false;
  }
  return true;
};

const save = async () => {
  Object.assign(settings.value, {
    defaultModel: config.defaultModel,
    systemPrompt: config.systemPrompt,
    enableUsageAnalysis: config.enableUsageAnalysis,
    usageReportInterval: config.usageReportInterval,
    ragEmbeddingModel: config.ragEmbeddingModel,
    ragLlmModel: config.ragLlmModel,
    ragOcrModel: config.ragOcrModel,
    ragUploadDir: config.ragUploadDir,
    ragVectorStorage: config.ragVectorStorage,
    ragChunkSize: config.ragChunkSize,
    ragChunkOverlap: config.ragChunkOverlap,
    ragSystemPrompt: config.ragSystemPrompt,
    ragSplitter: config.ragSplitter,
  });
  const protocolOk = await saveProtocolConfig();
  const ok = await saveSettings();
  if (ok && protocolOk) ElMessage.success('全局配置已保存');
  else ElMessage.error('保存失败');
};

onMounted(async () => {
  await fetchSettings();
  syncFromSettings();
  await Promise.all([loadModels(), loadRagOptions(), loadProtocolConfig(), refreshProtocolStatus()]);
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
.upload-dir {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.upload-dir__input {
  flex: 1;
}
.config-form + .section-title {
  margin-top: 28px;
}
.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 16px;
}
.config-form :deep(.el-form-item__label) {
  font-weight: 500;
}
</style>
