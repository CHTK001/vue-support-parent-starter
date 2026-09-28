<template>
  <div class="system-settings-page">
    <div class="page-header">
      <h2>系统设置</h2>
      <el-button type="primary" @click="saveAll" :loading="saving">
        <el-icon><Checkmark20Regular /></el-icon> 保存全部
      </el-button>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="settings-tabs">
      <!-- 全局Bean配置 -->
      <el-tab-pane label="全局Bean" name="global-beans">
        <div class="settings-content">
          <el-alert
            title="全局Bean配置用于系统内部使用，包括ChatClient会话、各管线模型等"
            type="info"
            :closable="false"
            style="margin-bottom: 16px"
          />
          <el-form :model="globalBeansForm" label-width="160px">
            <el-form-item label="ChatClient会话">
              <el-input v-model="globalBeansForm.chatClient" placeholder="ChatClient Bean名称" />
            </el-form-item>
            <el-form-item label="文生图模型">
              <el-input v-model="globalBeansForm.textToImage" placeholder="文生图模型Bean" />
            </el-form-item>
            <el-form-item label="文生视频模型">
              <el-input v-model="globalBeansForm.textToVideo" placeholder="文生视频模型Bean" />
            </el-form-item>
            <el-form-item label="OCR模型">
              <el-input v-model="globalBeansForm.ocr" placeholder="OCR模型Bean" />
            </el-form-item>
            <el-form-item label="布局分析模型">
              <el-input v-model="globalBeansForm.layout" placeholder="布局分析模型Bean" />
            </el-form-item>
            <el-form-item label="人脸识别模型">
              <el-input v-model="globalBeansForm.face" placeholder="人脸识别模型Bean" />
            </el-form-item>
            <el-form-item label="图片识别模型">
              <el-input v-model="globalBeansForm.imageRecognition" placeholder="图片识别模型Bean" />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveGlobalBeans" :loading="savingBeans">保存全局Bean</el-button>
        </div>
      </el-tab-pane>

      <!-- 用量配置 -->
      <el-tab-pane label="用量配置" name="usage-config">
        <div class="settings-content">
          <el-form :model="usageConfigForm" label-width="180px">
            <el-form-item label="用量统计开关">
              <el-switch v-model="usageConfigForm.enabled" />
              <span class="form-tip">开启后记录所有API调用用量</span>
            </el-form-item>
            <el-form-item label="定时同步时间">
              <el-time-picker
                v-model="usageConfigForm.syncTime"
                format="HH:mm"
                value-format="HH:mm"
                placeholder="选择每日同步时间"
              />
              <span class="form-tip">每天定时同步用量数据（仅同步当天数据）</span>
            </el-form-item>
            <el-form-item label="后台时间轮询间隔">
              <el-input-number v-model="usageConfigForm.pollInterval" :min="1" :max="1440" />
              <span class="form-tip">分钟</span>
            </el-form-item>
            <el-divider content-position="left">Provider SPI 开关</el-divider>
            <el-form-item v-for="provider in providerList" :key="provider.key" :label="provider.name">
              <el-switch v-model="usageConfigForm.providers[provider.key]" />
              <span class="form-tip">{{ provider.desc }}</span>
            </el-form-item>
            <el-divider content-position="left">操作</el-divider>
            <el-form-item>
              <el-button type="primary" @click="saveUsageConfig" :loading="savingUsage">保存用量配置</el-button>
              <el-button @click="manualSyncAll" :loading="syncing">手动全量同步</el-button>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>

      <!-- 模型指标采集 -->
      <el-tab-pane label="模型指标采集" name="model-metrics">
        <div class="settings-content">
          <ModelMetricsSettings />
        </div>
      </el-tab-pane>

      <!-- Skills配置 -->
      <el-tab-pane label="Skills配置" name="skills-config">
        <div class="settings-content">
          <el-form :model="skillsConfigForm" label-width="180px">
            <el-form-item label="本地Skills SPI开关">
              <el-switch v-model="skillsConfigForm.localEnabled" />
              <span class="form-tip">开启后页面扫描才会扫描到本地Skills</span>
            </el-form-item>
            <el-form-item label="在线Skills SPI开关">
              <el-switch v-model="skillsConfigForm.onlineEnabled" />
              <span class="form-tip">开启后支持在线市场搜索和安装</span>
            </el-form-item>
            <el-form-item label="本地Skills路径">
              <el-input v-model="skillsConfigForm.localPath" placeholder="本地Skills扫描路径" />
            </el-form-item>
            <el-form-item label="在线市场地址">
              <el-input v-model="skillsConfigForm.marketUrl" placeholder="在线Skills市场地址" />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveSkillsConfig" :loading="savingSkills">保存Skills配置</el-button>
        </div>
      </el-tab-pane>

      <!-- 角色/MCP/插件配置 -->
      <el-tab-pane label="角色/MCP/插件" name="ext-config">
        <div class="settings-content">
          <el-form :model="extConfigForm" label-width="180px">
            <el-divider content-position="left">角色配置</el-divider>
            <el-form-item label="角色SPI开关">
              <el-switch v-model="extConfigForm.rolesEnabled" />
              <span class="form-tip">datasearch-starter 角色SPI扩展</span>
            </el-form-item>
            <el-form-item label="角色数据路径">
              <el-input v-model="extConfigForm.rolesPath" placeholder="角色数据存储路径" />
            </el-form-item>

            <el-divider content-position="left">MCP配置</el-divider>
            <el-form-item label="MCP SPI开关">
              <el-switch v-model="extConfigForm.mcpEnabled" />
              <span class="form-tip">datasearch-starter MCP SPI扩展</span>
            </el-form-item>
            <el-form-item label="MCP服务路径">
              <el-input v-model="extConfigForm.mcpPath" placeholder="MCP服务配置路径" />
            </el-form-item>

            <el-divider content-position="left">插件配置</el-divider>
            <el-form-item label="插件SPI开关">
              <el-switch v-model="extConfigForm.pluginsEnabled" />
              <span class="form-tip">datasearch-starter 插件SPI扩展</span>
            </el-form-item>
            <el-form-item label="插件数据路径">
              <el-input v-model="extConfigForm.pluginsPath" placeholder="插件数据存储路径" />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="saveExtConfig" :loading="savingExt">保存扩展配置</el-button>
        </div>
      </el-tab-pane>

      <!-- 管线配置 -->
      <el-tab-pane label="管线配置" name="pipeline-config">
        <div class="settings-content">
          <el-form :model="pipelineConfigForm" label-width="180px">
            <el-divider content-position="left">OCR配置</el-divider>
            <el-form-item label="OCR模型">
              <el-input v-model="pipelineConfigForm.ocrModel" placeholder="OCR模型名称" />
            </el-form-item>
            <el-form-item label="OCR启用">
              <el-switch v-model="pipelineConfigForm.ocrEnabled" />
            </el-form-item>

            <el-divider content-position="left">布局分析配置</el-divider>
            <el-form-item label="布局模型">
              <el-input v-model="pipelineConfigForm.layoutModel" placeholder="布局分析模型名称" />
            </el-form-item>
            <el-form-item label="布局启用">
              <el-switch v-model="pipelineConfigForm.layoutEnabled" />
            </el-form-item>

            <el-divider content-position="left">人脸识别配置</el-divider>
            <el-form-item label="人脸模型">
              <el-input v-model="pipelineConfigForm.faceModel" placeholder="人脸识别模型名称" />
            </el-form-item>
            <el-form-item label="人脸启用">
              <el-switch v-model="pipelineConfigForm.faceEnabled" />
            </el-form-item>

            <el-divider content-position="left">图片识别配置</el-divider>
            <el-form-item label="图片识别模型">
              <el-input v-model="pipelineConfigForm.imageRecognitionModel" placeholder="图片识别模型名称" />
            </el-form-item>
            <el-form-item label="图片识别启用">
              <el-switch v-model="pipelineConfigForm.imageRecognitionEnabled" />
            </el-form-item>

            <el-divider content-position="left">生成配置</el-divider>
            <el-form-item label="生成模型">
              <el-input v-model="pipelineConfigForm.generateModel" placeholder="生成模型名称" />
            </el-form-item>
            <el-form-item label="生成启用">
              <el-switch v-model="pipelineConfigForm.generateEnabled" />
            </el-form-item>
          </el-form>
          <el-button type="primary" @click="savePipelineConfig" :loading="savingPipeline">保存管线配置</el-button>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Checkmark20Regular } from '@vicons/fluent';
import { settingsApi, usageApi, modelMetricsApi } from '@/services/javaApi';
import ModelMetricsSettings from '@/components/setting/ModelMetricsSettings.vue';

const activeTab = ref('global-beans');
const saving = ref(false);
const savingBeans = ref(false);
const savingUsage = ref(false);
const savingSkills = ref(false);
const savingExt = ref(false);
const savingPipeline = ref(false);
const syncing = ref(false);

const providerList = [
  { key: 'openai', name: 'OpenAI', desc: 'OpenAI 用量同步' },
  { key: 'anthropic', name: 'Anthropic', desc: 'Anthropic 用量同步' },
  { key: 'deepseek', name: 'DeepSeek', desc: 'DeepSeek 用量同步' },
  { key: 'qwen', name: 'Qwen', desc: '通义千问用量同步' },
  { key: 'ollama', name: 'Ollama', desc: '本地Ollama用量统计' },
  { key: 'custom', name: '自定义', desc: '自定义Provider用量' },
];

const globalBeansForm = ref({
  chatClient: '',
  textToImage: '',
  textToVideo: '',
  ocr: '',
  layout: '',
  face: '',
  imageRecognition: '',
});

const usageConfigForm = ref({
  enabled: true,
  syncTime: '02:00',
  pollInterval: 60,
  providers: {} as Record<string, boolean>,
});

const skillsConfigForm = ref({
  localEnabled: true,
  onlineEnabled: true,
  localPath: '',
  marketUrl: '',
});

const extConfigForm = ref({
  rolesEnabled: true,
  rolesPath: '',
  mcpEnabled: true,
  mcpPath: '',
  pluginsEnabled: true,
  pluginsPath: '',
});

const pipelineConfigForm = ref({
  ocrModel: '',
  ocrEnabled: true,
  layoutModel: '',
  layoutEnabled: true,
  faceModel: '',
  faceEnabled: true,
  imageRecognitionModel: '',
  imageRecognitionEnabled: true,
  generateModel: '',
  generateEnabled: true,
});

// 初始化provider开关
providerList.forEach((p) => {
  usageConfigForm.value.providers[p.key] = true;
});

const loadGlobalBeans = async () => {
  try {
    const res: any = await settingsApi.globalBeans('ai');
    if (res?.data) {
      Object.assign(globalBeansForm.value, res.data);
    }
  } catch (e) {
    console.warn('加载全局Bean失败', e);
  }
};

const loadUsageConfig = async () => {
  try {
    const res: any = await settingsApi.usageConfig();
    if (res?.data) {
      Object.assign(usageConfigForm.value, res.data);
    }
  } catch (e) {
    console.warn('加载用量配置失败', e);
  }
};

const loadSkillsConfig = async () => {
  try {
    const res: any = await settingsApi.skillsConfig();
    if (res?.data) {
      Object.assign(skillsConfigForm.value, res.data);
    }
  } catch (e) {
    console.warn('加载Skills配置失败', e);
  }
};

const saveGlobalBeans = async () => {
  savingBeans.value = true;
  try {
    await settingsApi.updateGlobalBeans('ai', globalBeansForm.value);
    ElMessage.success('全局Bean保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingBeans.value = false;
  }
};

const saveUsageConfig = async () => {
  savingUsage.value = true;
  try {
    await settingsApi.updateUsageConfig(usageConfigForm.value);
    ElMessage.success('用量配置保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingUsage.value = false;
  }
};

const saveSkillsConfig = async () => {
  savingSkills.value = true;
  try {
    await settingsApi.updateSkillsConfig(skillsConfigForm.value);
    ElMessage.success('Skills配置保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingSkills.value = false;
  }
};

const saveExtConfig = async () => {
  savingExt.value = true;
  try {
    // 分别保存角色、MCP、插件配置
    await settingsApi.updateRolesConfig({ enabled: extConfigForm.value.rolesEnabled, path: extConfigForm.value.rolesPath });
    await settingsApi.updateMcpConfig({ enabled: extConfigForm.value.mcpEnabled, path: extConfigForm.value.mcpPath });
    await settingsApi.updatePluginsConfig({ enabled: extConfigForm.value.pluginsEnabled, path: extConfigForm.value.pluginsPath });
    ElMessage.success('扩展配置保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingExt.value = false;
  }
};

const savePipelineConfig = async () => {
  savingPipeline.value = true;
  try {
    // 分别保存各管线配置
    await settingsApi.updateOcrConfig({ model: pipelineConfigForm.value.ocrModel, enabled: pipelineConfigForm.value.ocrEnabled });
    await settingsApi.updateLayoutConfig({ model: pipelineConfigForm.value.layoutModel, enabled: pipelineConfigForm.value.layoutEnabled });
    await settingsApi.updateFaceConfig({ model: pipelineConfigForm.value.faceModel, enabled: pipelineConfigForm.value.faceEnabled });
    await settingsApi.updateImageRecognitionConfig({ model: pipelineConfigForm.value.imageRecognitionModel, enabled: pipelineConfigForm.value.imageRecognitionEnabled });
    await settingsApi.updateGenerateConfig({ model: pipelineConfigForm.value.generateModel, enabled: pipelineConfigForm.value.generateEnabled });
    ElMessage.success('管线配置保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingPipeline.value = false;
  }
};

const manualSyncAll = async () => {
  syncing.value = true;
  try {
    await usageApi.syncAll();
    ElMessage.success('全量同步已触发');
  } catch (e: any) {
    ElMessage.error('同步失败: ' + (e.message || ''));
  } finally {
    syncing.value = false;
  }
};

// ==================== 模型指标采集 ====================
const modelMetricsForm = ref({
  enabled: false,
  syncTime: '02:00',
  interval: 60,
  cacheStrategy: 'clear_on_sync',
  pricingSource: 'official',
});
const modelMetricsList = ref<any[]>([]);
const savingMetrics = ref(false);
const refreshingMetrics = ref(false);
const syncingPricing = ref(false);
const loadingMetrics = ref(false);

const loadModelMetricsConfig = async () => {
  try {
    const res = await modelMetricsApi.getConfig();
    if (res?.data) {
      Object.assign(modelMetricsForm.value, res.data);
    }
  } catch (e) {
    console.warn('加载模型指标配置失败', e);
  }
};

const loadModelMetricsList = async () => {
  loadingMetrics.value = true;
  try {
    const res = await modelMetricsApi.list();
    modelMetricsList.value = res?.data || res || [];
  } catch (e) {
    modelMetricsList.value = [];
  } finally {
    loadingMetrics.value = false;
  }
};

const saveModelMetricsConfig = async () => {
  savingMetrics.value = true;
  try {
    await modelMetricsApi.updateConfig(modelMetricsForm.value);
    ElMessage.success('模型指标配置保存成功');
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.message || ''));
  } finally {
    savingMetrics.value = false;
  }
};

const refreshModelMetrics = async () => {
  refreshingMetrics.value = true;
  try {
    await modelMetricsApi.refresh();
    ElMessage.success('指标刷新已触发');
    await loadModelMetricsList();
  } catch (e: any) {
    ElMessage.error('刷新失败: ' + (e.message || ''));
  } finally {
    refreshingMetrics.value = false;
  }
};

const syncPricing = async () => {
  syncingPricing.value = true;
  try {
    await modelMetricsApi.syncPricing();
    ElMessage.success('官方定价同步成功');
  } catch (e: any) {
    ElMessage.error('同步失败: ' + (e.message || ''));
  } finally {
    syncingPricing.value = false;
  }
};

const saveAll = async () => {
  saving.value = true;
  try {
    await Promise.all([
      saveGlobalBeans(),
      saveUsageConfig(),
      saveSkillsConfig(),
      saveExtConfig(),
      savePipelineConfig(),
      saveModelMetricsConfig(),
    ]);
    ElMessage.success('全部配置保存成功');
  } catch (e) {
    ElMessage.error('部分配置保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadGlobalBeans();
  loadUsageConfig();
  loadSkillsConfig();
  loadModelMetricsConfig();
  loadModelMetricsList();
});
</script>

<style scoped>
.system-settings-page {
  padding: 20px;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.settings-tabs {
  min-height: 500px;
}

.settings-content {
  padding: 20px;
  max-width: 800px;
}

.form-tip {
  margin-left: 12px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
</style>
