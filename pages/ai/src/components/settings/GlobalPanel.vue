<template>
  <div class="panel-container">
    <div class="panel-header">
      <div>
        <span class="panel-title">全局配置</span>
        <span class="panel-subtitle">系统级默认参数与定时调度</span>
      </div>
      <el-button v-role="'admin'" type="primary" size="small" plain :loading="saving" @click="save">保存</el-button>
    </div>
    <div v-loading="loading" class="panel-body">
      <el-form :model="config" label-width="140px" class="config-form">
        <el-divider content-position="left">聚合服务</el-divider>
        <el-form-item label="启用 ChatClient">
          <el-switch v-model="config.enableChatService" />
          <span class="hint">启用后聚合所有可用模型服务</span>
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
          <span class="hint">最小 10 秒</span>
        </el-form-item>

        <el-divider content-position="left">请求参数</el-divider>
        <el-form-item label="温度 (Temperature)">
          <el-slider v-model="config.temperature" :min="0" :max="2" :step="0.1" style="width: 220px" />
          <span class="hint">{{ config.temperature }}</span>
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
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 全局配置面板
 * 通过 useGlobalSettings composable 与后端 /v2/ai/global-settings 对接。
 * 保存按钮需要 admin 角色。
 */
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { useGlobalSettings } from '../../composables/useGlobalSettings';
import { providersApi } from '../../api/providers';

defineProps<{ id?: string }>();

const { settings, loading, saving, fetchSettings, saveSettings } = useGlobalSettings();

// 可选模型列表（从供应商聚合）
const availableModels = ref<string[]>([]);
const loadModels = async () => {
  try {
    const providers = await providersApi.list();
    availableModels.value = Array.from(
      new Set(providers.flatMap(p => p.models || []))
    );
  } catch (e) {
    availableModels.value = [];
  }
};

// 与模板绑定的本地响应式对象
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

// 同步 composable 的 settings 到本地 config
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
  // 把 config 写回 settings，再保存
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
.panel-container { padding: 4px 0; }
.panel-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.panel-title { display: block; font-size: 15px; font-weight: 600; color: var(--el-text-color-primary); letter-spacing: 0.2px; }
.panel-subtitle { display: block; font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; }
.panel-body { min-height: 200px; }
.config-form { max-width: 600px; }
.hint { font-size: 12px; color: var(--el-text-color-secondary); margin-left: 8px; }
</style>