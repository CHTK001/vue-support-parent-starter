<template>
  <PanelPage title="语音识别" subtitle="音频转文字（本地 whisper / 云端 ASR）" :loading="loading">
    <template #actions>
      <ReButton layout="square" type="primary" size="small" plain icon="Refresh" @click="loadRuntime">刷新配置</ReButton>
    </template>

    <div class="audio-body">
      <!-- 上传与识别 -->
      <el-card class="audio-card" shadow="never">
        <div class="audio-card__head">
          <span class="audio-card__title">音频转文字</span>
        </div>
        <div class="audio-upload">
          <el-upload
            drag
            :auto-upload="false"
            :limit="1"
            accept=".wav,.mp3,.m4a,.flac,.ogg,.aac,.wma"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
            :file-list="fileList"
          >
            <div class="audio-upload__icon">
              <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </div>
            <div class="audio-upload__text">拖拽音频文件到此处，或<em>点击上传</em></div>
            <div class="audio-upload__hint">支持 wav / mp3 / m4a / flac 等格式</div>
          </el-upload>
        </div>

        <div class="audio-params">
          <el-form label-width="70px" class="audio-form">
            <el-form-item label="模型">
              <ReSelect
                v-model="form.model"
                placeholder="默认 whisper-tiny"
                clearable
                filterable
                allow-create
                :options="modelOptions"
                style="width: 100%"
              />
            </el-form-item>
            <el-form-item label="语言">
              <ReSelect
                v-model="form.language"
                placeholder="默认 zh"
                clearable
                filterable
                allow-create
                :options="languageOptions"
                style="width: 100%"
              />
            </el-form-item>
          </el-form>
        </div>

        <div class="audio-actions">
          <ReButton type="primary" :loading="transcribing" :disabled="!selectedFile" icon="Microphone" @click="transcribe">
            开始识别
          </ReButton>
        </div>
      </el-card>

      <!-- 识别结果 -->
      <el-card v-if="resultText || transcribing" class="audio-card audio-result" shadow="never">
        <div class="audio-card__head">
          <span class="audio-card__title">识别结果</span>
          <ReButton v-if="resultText" layout="square" type="primary" size="small" text icon="CopyDocument" @click="copyResult">复制</ReButton>
        </div>
        <div v-loading="transcribing" class="audio-result__body">
          <pre v-if="resultText" class="audio-result__text">{{ resultText }}</pre>
          <span v-else-if="transcribing" class="audio-result__pending">正在识别…</span>
        </div>
      </el-card>
    </div>
  </PanelPage>
</template>

<script setup lang="ts">
/**
 * 语音识别面板 —— 音频转文字
 * 调用 /api/ai/v2/audio/to-text 接口（走 asr 分组统一能力解析），
 * 并读取 /api/ai/v2/runtime/config 的 asr 分组配置获取默认模型。
 */
import { ref, reactive, onMounted } from 'vue';
import type { UploadFile } from 'element-plus';
import { ElMessage } from 'element-plus';
import { audioApi } from '../../api/audio';
import { get } from '../../api/request';
import PanelPage from '../PanelPage.vue';
import ReButton from '@repo/ui/re-button';
import ReSelect from '@repo/ui/re-select';

defineProps<{ id?: string }>();

const loading = ref(false);
const transcribing = ref(false);
const selectedFile = ref<File | null>(null);
const fileList = ref<UploadFile[]>([]);
const resultText = ref('');

const form = reactive<{ model: string; language: string }>({
  model: '',
  language: '',
});

/** 常见 ASR 模型候选（来自 asr 分组默认 + 通用 whisper 系列） */
const modelOptions = [
  { label: 'whisper-tiny', value: 'whisper-tiny' },
  { label: 'whisper-base', value: 'whisper-base' },
  { label: 'whisper-small', value: 'whisper-small' },
  { label: 'whisper-medium', value: 'whisper-medium' },
  { label: 'whisper-large', value: 'whisper-large' },
  { label: 'whisper-1', value: 'whisper-1' },
  { label: 'paraformer-v2', value: 'paraformer-v2' },
];

const languageOptions = [
  { label: '中文 zh', value: 'zh' },
  { label: '英语 en', value: 'en' },
  { label: '日语 ja', value: 'ja' },
  { label: '韩语 ko', value: 'ko' },
  { label: '自动检测', value: '' },
];

const onFileChange = (file: UploadFile) => {
  selectedFile.value = (file.raw as File) || null;
};

const onFileRemove = () => {
  selectedFile.value = null;
  resultText.value = '';
};

const transcribe = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先选择音频文件');
    return;
  }
  transcribing.value = true;
  resultText.value = '';
  try {
    const text = await audioApi.toText(selectedFile.value, {
      model: form.model || undefined,
      language: form.language || undefined,
    });
    resultText.value = text || '(未识别到文字内容)';
  } catch (e: any) {
    ElMessage.error('识别失败: ' + (e.message || ''));
  } finally {
    transcribing.value = false;
  }
};

const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(resultText.value);
    ElMessage.success('已复制');
  } catch {
    ElMessage.error('复制失败');
  }
};

const loadRuntime = async () => {
  loading.value = true;
  try {
    const list = await get<any[]>('/v2/runtime/config');
    const items = Array.isArray(list) ? list : [];
    const group = items.find((i: any) => i.field === 'group') || null;
    // runtime/config 返回的是 runtime 分组；asr 分组需从 group 维度过滤
    const asrField = (field: string) => {
      const item = items.find((i: any) => i.field === field);
      return item && item.value ? String(item.value) : '';
    };
    // 优先 asr 分组默认模型/语言，其次保留用户选择
    if (!form.model) form.model = asrField('default_model');
    if (!form.language) form.language = asrField('language');
  } catch {
    // 配置读取失败不影响识别
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadRuntime();
});
</script>

<style scoped>
.audio-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-card {
  border-radius: var(--ai-radius-md);
  border: 1px solid var(--ai-card-border);
}
.audio-card :deep(.el-card__body) {
  padding: 18px;
}
.audio-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.audio-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--ai-text-primary);
}

.audio-upload :deep(.el-upload-dragger) {
  border-radius: var(--ai-radius-md);
  background: var(--el-fill-color-lighter);
}
.audio-upload__icon {
  display: flex;
  justify-content: center;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}
.audio-upload__text {
  font-size: 14px;
  color: var(--ai-text-primary);
}
.audio-upload__text em {
  color: var(--el-color-primary);
  font-style: normal;
}
.audio-upload__hint {
  font-size: 12px;
  color: var(--ai-text-muted);
  margin-top: 6px;
}

.audio-params {
  margin-top: 16px;
}
.audio-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.audio-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.audio-result__body {
  min-height: 80px;
}
.audio-result__text {
  margin: 0;
  padding: 12px 14px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--ai-radius-sm);
  font-family: monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--ai-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
}
.audio-result__pending {
  color: var(--ai-text-muted);
  font-size: 13px;
}
</style>
