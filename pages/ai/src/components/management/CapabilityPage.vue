<template>
  <RePage fill :title="pipelineTitle" :subtitle="pipelineDesc">
    <template #actions>
      <el-button @click="loadData">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </template>
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
        <!-- 表格统一 ReTable（替换裸 el-table）：默认引擎已是 vxe；原表带 border →
             ReTable 默认省略；分页/工具栏关闭（页面没有分页）；无 height → :layout-table minHeight。 -->
        <ReTable
          :data="requiredModels"
          :columns="pipelineModelColumns"
         
          :layout-table="{ minHeight: 0 }"
          stripe
          style="width: 100%"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-enabled="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" >{{ row.enabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </ReTable>
      </el-card>

      <!-- 非必填管线模型 -->
      <el-card shadow="never" class="pipeline-card">
        <template #header>
          <span class="font-bold">非必填管线模型</span>
        </template>
        <!-- 同上：裸 el-table → ReTable（两张表列结构相同，共用 pipelineModelColumns） -->
        <ReTable
          :data="optionalModels"
          :columns="pipelineModelColumns"
         
          :layout-table="{ minHeight: 0 }"
          stripe
          style="width: 100%"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <template #col-enabled="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" >{{ row.enabled ? '启用' : '禁用' }}</el-tag>
          </template>
        </ReTable>
      </el-card>
  </RePage>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { Refresh } from '@element-plus/icons-vue';
import ReTable from '@repo/ui/re-table';
import type { ReTableColumn } from '@repo/ui/re-table';
import { pipelineApi } from '@/services/javaApi';
import RePage from '@/components/re/RePage.vue';

/**
 * 「管线模型」列配置：两张表（必填 / 非必填）结构完全相同，原各 4 个 el-table-column
 * 收敛成一份数组共用；enabled 列带 {@code <template #default>} → slot + 两张表各自的 #col-enabled。
 */
const pipelineModelColumns: ReTableColumn[] = [
  { prop: 'name', label: '模型名称', minWidth: 150 },
  { prop: 'provider', label: '供应商', width: 120 },
  { prop: 'capability', label: '能力', width: 150 },
  { prop: 'enabled', label: '状态', width: 100, slot: 'enabled' },
];

const route = useRoute();
const pipelineCode = computed(() => route.params.pipeline as string);

const PIPELINE_INFO: Record<string, { title: string; desc: string }> = {
  'text-to-image': { title: '文生图', desc: '文本生成图片管线配置' },
  'text-to-video': { title: '文生视频', desc: '文本生成视频管线配置' },
  'ocr': { title: 'OCR文字识别', desc: '光学字符识别管线配置' },
  'layout': { title: '版面布局分析', desc: '文档版面布局分析管线配置' },
  'face': { title: '人脸识别', desc: '人脸检测与识别管线配置' },
  'image-recognition': { title: '图片识别', desc: '图像内容识别与分类管线配置' },
  // 音频两条管线：此前只有 globalBean（无标题、无模型槽），路由点进来标题会退化成裸 code
  'asr': { title: '语音识别', desc: '语音转文字管线：ASR 模型必填，文本矫正模型可选（留空关闭）' },
  'tts': { title: '语音合成', desc: '文字转语音管线：TTS 模型必填，文本规范化模型可选（留空关闭）' },
};

const pipelineTitle = computed(() => PIPELINE_INFO[pipelineCode.value]?.title || pipelineCode.value);
const pipelineDesc = computed(() => PIPELINE_INFO[pipelineCode.value]?.desc || '');

const loading = ref(false);
const configLoading = ref(false);
const savingConfig = ref(false);

/**
 * 配置字段中文标签：能力页配置区原先直接拿 key 下划线转空格当 label，
 * 渲染成「corrector model」这类半英文。已知字段给出中文标签，未知字段回退原行为。
 */
const FIELD_LABELS: Record<string, string> = {
  detector_model: '文字检测模型',
  recognizer_model: '文字识别模型',
  detector_threshold: '检测置信度阈值',
  sort_reading_order: '按阅读顺序排序',
  direction_model: '方向矫正模型',
  restorer_model: '文字超分修复模型',
  corrector_model: '文本矫正模型',
  device: '推理设备',
  // ── 音频管线（asr / tts）────────────────────────────────────────────
  // 这几项此前没有中文标签，页面上会渲染成「provider api key」这类半英文，
  // 与「管线配置都要在页面上说清楚」的要求相悖。
  provider: '服务商',
  provider_api_key: 'API Key',
  provider_base_url: 'API 基础地址',
  default_model: '默认模型',
  language: '语言',
  tts_voice: '默认发音人',
  tts_speed: '语速倍率',
  tts_format: '输出音频格式',
  text_normalize_model: '文本规范化模型',
};

/** 已知字段的输入提示（文本类模型统一说明「留空关闭」，避免用户误以为必填）。 */
const FIELD_PLACEHOLDERS: Record<string, string> = {
  corrector_model: '留空关闭（非必填），例如 macbert4csc / gpt-4o',
  text_normalize_model: '留空关闭（非必填），例如 gpt-4o / deepseek-chat',
  provider: 'whisper / openai / alibaba-asr 等',
  default_model: '留空或 auto = 由所选引擎自动使用推荐档位',
};

const requiredCapabilities = ref<string[]>([]);
const optionalCapabilities = ref<string[]>([]);
const requiredModels = ref<any[]>([]);
const optionalModels = ref<any[]>([]);
const configForm = reactive<Record<string, any>>({});
const configFields = ref<any[]>([]);
/**
 * 配置分组：取管线自述的 {@code configGroup}（例如文生图管线落在 {@code generate} 组），
 * 拿不到才退回路由里的 pipeline code。此前直接拿 code 当分组名去请求一个根本不存在的
 * {@code /global-settings/{group}}，读与写双双 404，配置区一直是空的。
 */
const configGroup = ref('');

async function loadData() {
  loading.value = true;
  try {
    // 加载管线详情
    try {
      const detailRes: any = await pipelineApi.detail(pipelineCode.value);
      const detail = detailRes?.data || detailRes || {};
      requiredCapabilities.value = detail.requiredCapabilities || [];
      optionalCapabilities.value = detail.optionalCapabilities || [];
      configGroup.value = detail.configGroup || pipelineCode.value;
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
    message.error(`加载失败: ${e.message}`);
  } finally {
    loading.value = false;
  }
}

async function loadConfig() {
  configLoading.value = true;
  try {
    const res: any = await pipelineApi.config(configGroup.value || pipelineCode.value);
    // __meta 是每项的 origin/overridden 归属信息（对象），不是可编辑配置，别渲染成表单项
    const keys = Object.keys(res || {}).filter((key) => key !== '__meta');
    keys.forEach((key) => {
      configForm[key] = res[key];
    });
    // 生成配置字段
    configFields.value = keys.map((key) => ({
      key,
      label: FIELD_LABELS[key] || key.replace(/_/g, ' '),
      placeholder: FIELD_PLACEHOLDERS[key],
      type: typeof res[key] === 'boolean' ? 'switch' : 'input',
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
    await pipelineApi.updateConfig(configGroup.value || pipelineCode.value, configForm);
    message.success('配置保存成功');
  } catch (e: any) {
    message.error(`保存失败: ${e.message}`);
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
