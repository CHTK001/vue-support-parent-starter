<template>
  <PanelPage title="视觉理解 / OCR" subtitle="图像内容描述、视觉问答、OCR 文本提取" :loading="loading">
    <template #actions>
      <el-button size="small" @click="resetAll">清空</el-button>
    </template>

    <!-- 能力概览 -->
    <div class="ai-capability-row">
      <div
        v-for="cap in capabilityCards"
        :key="cap.key"
        class="ai-cap-card"
        :class="{ 'ai-cap-card--active': activeTab === cap.key }"
        @click="activeTab = cap.key"
      >
        <div class="ai-cap-card__icon" :style="{ background: cap.color }">
          <el-icon><component :is="cap.icon" /></el-icon>
        </div>
        <div class="ai-cap-card__body">
          <div class="ai-cap-card__title">{{ cap.title }}</div>
          <div class="ai-cap-card__desc">{{ cap.desc }}</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="ai-fade-in">
      <!-- OCR 文本提取 -->
      <el-tab-pane label="OCR 文本提取" name="ocr">
        <div class="ai-section">
          <el-upload
            :auto-upload="false"
            :show-file-list="false"
            :on-change="onOcrFile"
            accept="image/*"
          >
            <div class="ai-upload-area">
              <el-icon class="ai-upload-area__icon"><PictureFilled /></el-icon>
              <div class="ai-upload-area__title">点击或拖拽上传图片</div>
              <div class="ai-upload-area__desc">支持 JPG/PNG/BMP/WebP/GIF，自动识别文本内容</div>
            </div>
          </el-upload>

          <div v-if="ocrImage" class="ocr-preview">
            <img :src="ocrPreview" class="ocr-preview__img" alt="OCR 图片" />
          </div>

          <div v-if="ocrResult" class="ocr-result">
            <el-alert type="success" :closable="false">
              <template #title>
                <strong>识别结果（{{ ocrResult.text.length }} 字符）</strong>
              </template>
            </el-alert>
            <pre class="ocr-result__text">{{ ocrResult.text || '(无文字)' }}</pre>
            <el-button v-if="ocrResult.text" type="primary" plain size="small" @click="copyText(ocrResult.text)">复制</el-button>
          </div>
        </div>
      </el-tab-pane>

      <!-- 图像内容描述 -->
      <el-tab-pane label="图像描述" name="describe">
        <div class="ai-section">
          <div class="ai-prompt-row">
            <el-input v-model="describePrompt" type="textarea" :rows="2" placeholder="可选：自定义描述要求（默认通用描述）" />
          </div>
          <el-upload :auto-upload="false" :show-file-list="false" :on-change="onDescribeFile" accept="image/*">
            <div class="ai-upload-area">
              <el-icon class="ai-upload-area__icon"><Picture /></el-icon>
              <div class="ai-upload-area__title">上传图片让 AI 描述内容</div>
              <div class="ai-upload-area__desc">基于多模态 LLM 视觉理解</div>
            </div>
          </el-upload>

          <div v-if="describeResult" class="ai-result-card">
            <div class="ai-result-card__label">AI 描述</div>
            <div class="ai-result-card__text">{{ describeResult.description }}</div>
          </div>
        </div>
      </el-tab-pane>

      <!-- 视觉问答 -->
      <el-tab-pane label="视觉问答" name="ask">
        <div class="ai-section">
          <el-input v-model="askQuestion" type="textarea" :rows="2" placeholder="例如：图中有几个人？他们在做什么？" />
          <el-upload :auto-upload="false" :show-file-list="false" :on-change="onAskFile" accept="image/*">
            <div class="ai-upload-area">
              <el-icon class="ai-upload-area__icon"><ChatLineRound /></el-icon>
              <div class="ai-upload-area__title">上传图片并提问</div>
              <div class="ai-upload-area__desc">AI 根据图像内容回答你的问题</div>
            </div>
          </el-upload>

          <div v-if="askResult" class="ai-result-card">
            <div class="ai-result-card__label">AI 回答</div>
            <div class="ai-result-card__text">{{ askResult.answer }}</div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * VisionPanel —— 视觉理解与 OCR 面板
 *
 * 三大能力：
 * 1. OCR 文本提取（visionApi.ocr）
 * 2. 图像内容描述（visionApi.describe，可选 prompt）
 * 3. 视觉问答（visionApi.ask，必传 question）
 */
import { ref } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Picture as PictureIcon,
  PictureFilled,
  ChatLineRound,
  Document,
  View,
  ChatDotRound,
} from '@element-plus/icons-vue';
import PanelPage from '../RePanelPage.vue';
import { visionApi, type DescribeResult, type AskResult, type OcrTextResult } from '@pages/ai/api';

defineProps<{ id?: string }>();

const loading = ref(false);
const activeTab = ref<'ocr' | 'describe' | 'ask'>('ocr');

const capabilityCards = [
  { key: 'ocr', title: 'OCR 文本提取', desc: '图片 → 文字', icon: Document, color: 'linear-gradient(135deg, #6366f1, #818cf8)' },
  { key: 'describe', title: '图像描述', desc: '多模态 LLM 视觉理解', icon: View, color: 'linear-gradient(135deg, #22c55e, #4ade80)' },
  { key: 'ask', title: '视觉问答', desc: '对图片提问 AI 回答', icon: ChatDotRound, color: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
];

// OCR
const ocrFile = ref<File | null>(null);
const ocrImage = ref<Blob | null>(null);
const ocrPreview = ref('');
const ocrResult = ref<OcrTextResult | null>(null);

const onOcrFile = (f: { raw?: File } | File) => {
  const file = (f as { raw?: File }).raw || (f as File);
  ocrFile.value = file;
  ocrResult.value = null;
  ocrImage.value = file;
  ocrPreview.value = URL.createObjectURL(file);
  runOcr();
};

const runOcr = async () => {
  if (!ocrFile.value) return;
  loading.value = true;
  try {
    const r = await visionApi.ocr(ocrFile.value);
    ocrResult.value = r;
    ElMessage.success(`识别完成，共 ${r.text.length} 字符`);
  } catch (e) {
    ElMessage.error('OCR 失败：' + (e as Error).message);
  } finally {
    loading.value = false;
  }
};

// 描述
const describePrompt = ref('');
const describeFile = ref<File | null>(null);
const describeResult = ref<DescribeResult | null>(null);

const onDescribeFile = (f: { raw?: File } | File) => {
  const file = (f as { raw?: File }).raw || (f as File);
  describeFile.value = file;
  describeResult.value = null;
  runDescribe();
};

const runDescribe = async () => {
  if (!describeFile.value) return;
  loading.value = true;
  try {
    describeResult.value = await visionApi.describe(describeFile.value, describePrompt.value || undefined);
  } catch (e) {
    ElMessage.error('图像描述失败：' + (e as Error).message);
  } finally {
    loading.value = false;
  }
};

// 问答
const askQuestion = ref('');
const askFile = ref<File | null>(null);
const askResult = ref<AskResult | null>(null);

const onAskFile = (f: { raw?: File } | File) => {
  const file = (f as { raw?: File }).raw || (f as File);
  askFile.value = file;
  askResult.value = null;
  runAsk();
};

const runAsk = async () => {
  if (!askFile.value) {
    ElMessage.warning('请先上传图片');
    return;
  }
  if (!askQuestion.value.trim()) {
    ElMessage.warning('请输入问题');
    return;
  }
  loading.value = true;
  try {
    askResult.value = await visionApi.ask(askFile.value, askQuestion.value);
  } catch (e) {
    ElMessage.error('视觉问答失败：' + (e as Error).message);
  } finally {
    loading.value = false;
  }
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    ElMessage.success('已复制');
  } catch {
    ElMessage.error('复制失败');
  }
};

const resetAll = () => {
  ocrFile.value = null;
  ocrImage.value = null;
  ocrPreview.value = '';
  ocrResult.value = null;
  describeFile.value = null;
  describeResult.value = null;
  askFile.value = null;
  askResult.value = null;
  describePrompt.value = '';
  askQuestion.value = '';
};
</script>

<style scoped>
.ai-section {
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-md);
  padding-top: var(--ai-spacing-md);
}
.ai-prompt-row {
  width: 100%;
}

/* 能力卡片（共享） */
.ai-capability-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--ai-spacing-md);
  margin-bottom: var(--ai-spacing-lg);
}
.ai-cap-card {
  display: flex;
  align-items: center;
  gap: var(--ai-spacing-md);
  padding: var(--ai-spacing-md) var(--ai-spacing-lg);
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  cursor: pointer;
  transition: all var(--ai-transition-normal);
  box-shadow: var(--ai-shadow-sm);
}
.ai-cap-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--ai-shadow-md);
}
.ai-cap-card--active {
  border-color: var(--ai-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15), var(--ai-shadow-md);
}
.ai-cap-card__icon {
  width: 44px;
  height: 44px;
  border-radius: var(--ai-radius-md);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 20px;
  flex-shrink: 0;
}
.ai-cap-card__body {
  flex: 1;
  min-width: 0;
}
.ai-cap-card__title {
  font-size: var(--ai-text-base);
  font-weight: 600;
  color: var(--ai-text-primary);
  margin-bottom: 2px;
}
.ai-cap-card__desc {
  font-size: var(--ai-text-xs);
  color: var(--ai-text-muted);
}

/* 上传区（共享） */
.ai-upload-area {
  border: 2px dashed var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  padding: var(--ai-spacing-xl);
  text-align: center;
  background: var(--ai-bg-overlay);
  transition: all var(--ai-transition-normal);
  cursor: pointer;
}
.ai-upload-area:hover {
  border-color: var(--ai-primary);
  background: rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}
.ai-upload-area__icon {
  font-size: 48px;
  color: var(--ai-primary);
  margin-bottom: var(--ai-spacing-sm);
}
.ai-upload-area__title {
  font-size: var(--ai-text-base);
  font-weight: 600;
  color: var(--ai-text-primary);
  margin-bottom: 4px;
}
.ai-upload-area__desc {
  font-size: var(--ai-text-xs);
  color: var(--ai-text-muted);
}

/* OCR 预览 */
.ocr-preview {
  margin-top: var(--ai-spacing-md);
}
.ocr-preview__img {
  max-width: 100%;
  max-height: 320px;
  border-radius: var(--ai-card-radius);
  box-shadow: var(--ai-shadow-md);
}
.ocr-result {
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  padding: var(--ai-spacing-md);
  display: flex;
  flex-direction: column;
  gap: var(--ai-spacing-sm);
}
.ocr-result__text {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--ai-font-mono);
  font-size: var(--ai-text-sm);
  max-height: 320px;
  overflow-y: auto;
  background: var(--ai-bg-overlay);
  padding: var(--ai-spacing-sm);
  border-radius: var(--ai-radius-sm);
}

/* 结果卡片（描述/问答通用） */
.ai-result-card {
  background: var(--ai-card-bg);
  border: 1px solid var(--ai-card-border);
  border-radius: var(--ai-card-radius);
  padding: var(--ai-spacing-lg);
  box-shadow: var(--ai-shadow-sm);
}
.ai-result-card__label {
  font-size: var(--ai-text-xs);
  font-weight: 600;
  color: var(--ai-primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: var(--ai-spacing-sm);
}
.ai-result-card__text {
  font-size: var(--ai-text-base);
  color: var(--ai-text-primary);
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
