<template>
  <div class="h-full overflow-hidden flex flex-col bg-white dark:bg-[#1a1a1a]">
    <div class="shrink-0 px-6 py-4 border-b border-gray-200 dark:border-[#2f2f2f]">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-[#e8e9ed]">{{ pipelineTitle }}</h1>
          <p class="text-sm text-gray-500 dark:text-[#8b8d95] mt-1">{{ pipelineDesc }}</p>
        </div>
        <el-button @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <div class="flex-1 overflow-auto p-6 space-y-6">
      <!-- 管线概览 -->
      <el-card shadow="never" class="pipeline-card">
        <template #header>
          <span class="font-bold">管线概览</span>
        </template>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <div class="text-sm text-gray-500 mb-2">必填能力</div>
            <div class="flex flex-wrap gap-2">
              <el-tag v-for="cap in requiredCapabilities" :key="cap" type="danger" >
                {{ cap }}
              </el-tag>
              <span v-if="requiredCapabilities.length === 0" class="text-gray-400 text-sm">无</span>
            </div>
          </div>
          <div>
            <div class="text-sm text-gray-500 mb-2">非必填能力</div>
            <div class="flex flex-wrap gap-2">
              <el-tag v-for="cap in optionalCapabilities" :key="cap" type="info" >
                {{ cap }}
              </el-tag>
              <span v-if="optionalCapabilities.length === 0" class="text-gray-400 text-sm">无</span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 全局Bean配置 -->
      <el-card shadow="never" class="pipeline-card">
        <template #header>
          <div class="flex items-center justify-between">
            <span class="font-bold">全局会话配置</span>
            <el-tag type="warning" >系统内部使用</el-tag>
          </div>
        </template>
        <el-form :model="configForm" label-width="120px" v-loading="configLoading">
          <el-form-item v-for="field in configFields" :key="field.key" :label="field.label">
            <el-input
              v-if="field.type === 'input'"
              v-model="configForm[field.key]"
              :placeholder="field.placeholder || `请输入${field.label}`"
              :type="field.secret ? 'password' : 'text'"
              show-password
            />
            <el-switch v-else-if="field.type === 'switch'" v-model="configForm[field.key]" />
            <el-select v-else-if="field.type === 'select'" v-model="configForm[field.key]" style="width: 100%">
              <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="savingConfig" @click="saveConfig">保存配置</el-button>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 必填管线模型 -->
      <el-card shadow="never" class="pipeline-card">
        <template #header>
          <span class="font-bold">必填管线模型</span>
        </template>
        <el-table :data="requiredModels" stripe border style="width: 100%">
          <el-table-column prop="name" label="模型名称" min-width="150" />
          <el-table-column prop="provider" label="供应商" width="120" />
          <el-table-column prop="capability" label="能力" width="150" />
          <el-table-column prop="enabled" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" >{{ row.enabled ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>

      <!-- 非必填管线模型 -->
      <el-card shadow="never" class="pipeline-card">
        <template #header>
          <span class="font-bold">非必填管线模型</span>
        </template>
        <el-table :data="optionalModels" stripe border style="width: 100%">
          <el-table-column prop="name" label="模型名称" min-width="150" />
          <el-table-column prop="provider" label="供应商" width="120" />
          <el-table-column prop="capability" label="能力" width="150" />
          <el-table-column prop="enabled" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'info'" >{{ row.enabled ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Refresh } from '@element-plus/icons-vue';
import { pipelineApi } from '@/services/javaApi';

const route = useRoute();
const pipelineCode = computed(() => route.params.pipeline as string);

const PIPELINE_INFO: Record<string, { title: string; desc: string }> = {
  'text-to-image': { title: '文生图', desc: '文本生成图片管线配置' },
  'text-to-video': { title: '文生视频', desc: '文本生成视频管线配置' },
  'ocr': { title: 'OCR文字识别', desc: '光学字符识别管线配置' },
  'layout': { title: '版面布局分析', desc: '文档版面布局分析管线配置' },
  'face': { title: '人脸识别', desc: '人脸检测与识别管线配置' },
  'image-recognition': { title: '图片识别', desc: '图像内容识别与分类管线配置' },
};

const pipelineTitle = computed(() => PIPELINE_INFO[pipelineCode.value]?.title || pipelineCode.value);
const pipelineDesc = computed(() => PIPELINE_INFO[pipelineCode.value]?.desc || '');

const loading = ref(false);
const configLoading = ref(false);
const savingConfig = ref(false);
const requiredCapabilities = ref<string[]>([]);
const optionalCapabilities = ref<string[]>([]);
const requiredModels = ref<any[]>([]);
const optionalModels = ref<any[]>([]);
const configForm = reactive<Record<string, any>>({});
const configFields = ref<any[]>([]);

async function loadData() {
  loading.value = true;
  try {
    // 加载管线详情
    try {
      const detailRes: any = await pipelineApi.detail(pipelineCode.value);
      const detail = detailRes?.data || detailRes || {};
      requiredCapabilities.value = detail.requiredCapabilities || [];
      optionalCapabilities.value = detail.optionalCapabilities || [];
    } catch (e) {
      console.warn('管线详情加载失败', e);
    }

    // 加载管线模型
    try {
      const modelsRes: any = await pipelineApi.models(pipelineCode.value);
      const models = modelsRes?.data || modelsRes?.records || modelsRes || [];
      requiredModels.value = models.filter((m: any) => m.required);
      optionalModels.value = models.filter((m: any) => !m.required);
    } catch (e) {
      console.warn('管线模型加载失败', e);
    }

    // 加载配置
    await loadConfig();
  } catch (e: any) {
    ElMessage.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function loadConfig() {
  configLoading.value = true;
  try {
    const res: any = await pipelineApi.config(pipelineCode.value);
    const config = res?.data || res || {};
    Object.keys(config).forEach((key) => {
      configForm[key] = config[key];
    });
    // 生成配置字段
    configFields.value = Object.keys(config).map((key) => ({
      key,
      label: key.replace(/_/g, ' '),
      type: typeof config[key] === 'boolean' ? 'switch' : 'input',
      secret: key.includes('key') || key.includes('secret') || key.includes('password'),
    }));
  } catch (e) {
    console.warn('配置加载失败', e);
  } finally {
    configLoading.value = false;
  }
}

async function saveConfig() {
  savingConfig.value = true;
  try {
    await pipelineApi.updateConfig(pipelineCode.value, configForm);
    ElMessage.success('配置保存成功');
  } catch (e: any) {
    ElMessage.error(`保存失败: ${e.message}`);
  } finally {
    savingConfig.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped>
/* 令牌口径：--el-border-color-lighter 由 refactor.css 在 :root 与 html.dark 两侧都给了值
   （浅色 #e7edf6 / 深色 #252d3b），底色则交给 --el-bg-color，
   故原先写死的 #e5e7eb / #374151 / #1f2937 三个值与 .dark 分支可整体去掉。
   本文件样式里没有任何 transition/animation（EP 组件自带动效不归这里管），
   故不需要 prefers-reduced-motion 分支。 */
.pipeline-card {
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
}
</style>
