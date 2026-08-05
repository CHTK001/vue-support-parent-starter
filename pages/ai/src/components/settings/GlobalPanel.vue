<template>
  <PanelPage title="全局配置" subtitle="系统级默认参数与定时调度" :loading="loading">
    <template #actions>
      <el-button v-role="'admin'" type="primary" size="small" plain :loading="saving" @click="save">保存</el-button>
    </template>

    <el-form :model="config" label-width="140px" class="config-form">
      <el-divider content-position="left">聚合服务</el-divider>
      <el-form-item label="启用 ChatClient">
        <el-switch v-model="config.enableChatService" />
        <span class="form-hint">启用后聚合所有可用模型服务</span>
      </el-form-item>
      <el-form-item label="默认模型">
        <el-select v-model="config.defaultModel" style="width: 220px">
          <el-option v-for="m in availableModels" :key="m" :label="m" :value="m" />
        </el-select>
      </el-form-item>

      <el-divider content-position="left">用量采集</el-divider>
      <el-form-item label="启用用量分析">
        <el-switch v-model="config.enableUsageAnalysis" />
      </el-form-item>
      <el-form-item label="上报间隔 (秒)">
        <el-input-number v-model="config.usageReportInterval" :min="10" :step="10" />
        <span class="form-hint">最小 10 秒</span>
      </el-form-item>

      <el-divider content-position="left">请求参数</el-divider>
      <el-form-item label="温度 (Temperature)">
        <el-slider v-model="config.temperature" :min="0" :max="2" :step="0.1" style="width: 220px" />
        <span class="form-hint">{{ config.temperature }}</span>
      </el-form-item>
      <el-form-item label="最大 Tokens">
        <el-input-number v-model="config.maxTokens" :min="1" :step="100" />
      </el-form-item>
      <el-form-item label="超时 (秒)">
        <el-input-number v-model="config.timeout" :min="1" :step="5" />
      </el-form-item>
      <el-form-item label="启用缓存">
        <el-switch v-model="config.enableCache" />
      </el-form-item>
      <el-form-item label="流式输出">
        <el-switch v-model="config.streaming" />
      </el-form-item>
    </el-form>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 全局配置面板
 * 通过 useGlobalSettings composable 与后端 /v2/ai/global-settings 对接。
 */
import { ref, reactive, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useGlobalSettings } from '../../composables/useGlobalSettings';
import { providersApi } from '../../api/providers';
import PanelPage from '../PanelPage.vue';

defineProps<{ id?: string }>();

const { settings, loading, saving, fetchSettings, saveSettings } = useGlobalSettings();

const availableModels = ref<string[]>([]);
const loadModels = async () => {
  try {
    const providers = await providersApi.list();
    availableModels.value = Array.from(new Set(providers.flatMap((p) => p.models || [])));
  } catch {
    availableModels.value = [];
  }
};

const config = reactive({
  enableChatService: true,
  defaultModel: '',
  enableUsageAnalysis: true,
  usageReportInterval: 60,
  temperature: 0.7,
  maxTokens: 4096,
  timeout: 30,
  enableCache: true,
  streaming: true,
});

const syncFromSettings = () => {
  config.enableChatService = (settings.value as any).chatClientEnabled ?? true;
  config.defaultModel = settings.value.defaultModel || '';
  config.enableUsageAnalysis = settings.value.enableUsageAnalysis ?? true;
  config.usageReportInterval = settings.value.usageReportInterval ?? 60;
  config.temperature = settings.value.temperature ?? 0.7;
  config.maxTokens = settings.value.maxTokens ?? 4096;
  config.timeout = settings.value.timeout ?? 30;
  config.enableCache = settings.value.enableCache ?? true;
  config.streaming = settings.value.stream ?? true;
};

const save = async () => {
  Object.assign(settings.value, {
    chatClientEnabled: config.enableChatService,
    defaultModel: config.defaultModel,
    enableUsageAnalysis: config.enableUsageAnalysis,
    usageReportInterval: config.usageReportInterval,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    timeout: config.timeout,
    enableCache: config.enableCache,
    stream: config.streaming,
  });
  const ok = await saveSettings();
  if (ok) ElMessage.success('全局配置已保存');
  else ElMessage.error('保存失败');
};

onMounted(async () => {
  await fetchSettings();
  syncFromSettings();
  await loadModels();
});
</script>

<style scoped>
.config-form { max-width: 600px; }
.form-hint { font-size: 12px; color: var(--ai-text-muted); margin-left: 8px; }
</style>
