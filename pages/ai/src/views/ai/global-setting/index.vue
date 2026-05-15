<template>
  <section class="gs-page system-container modern-bg">
    <div class="gs-header">
      <button class="gs-back" type="button" @click="router.push('/ai')">
        <IconifyIconOnline icon="ri:arrow-left-s-line" />
      </button>
      <div class="gs-header-info">
        <h2>全局设置切片</h2>
        <p>按模块分组管理全局配置项</p>
      </div>
    </div>

    <div class="gs-body">
      <!-- Slice list -->
      <div class="gs-slices">
        <button
          v-for="slice in slices"
          :key="slice.key"
          class="gs-slice-card"
          :class="{ active: activeSlice === slice.key }"
          @click="selectSlice(slice.key)"
        >
          <IconifyIconOnline :icon="slice.icon" class="gs-slice-card__icon" />
          <strong class="gs-slice-card__name">{{ slice.name }}</strong>
          <span class="gs-slice-card__desc">{{ slice.desc }}</span>
          <span class="gs-slice-card__count">{{ sliceFields(slice.key).length }} 项</span>
        </button>
      </div>

      <!-- Settings editor -->
      <div class="gs-editor" v-if="activeSlice">
        <div class="gs-editor__header">
          <strong>{{ currentSlice?.name }} 配置</strong>
          <small>{{ currentSlice?.desc }}</small>
        </div>

        <div v-if="settingLoading" class="gs-editor__loading">
          <el-skeleton :rows="4" animated />
        </div>

        <div v-else class="gs-editor__fields">
          <div v-for="field in sliceFields(activeSlice)" :key="field.key" class="gs-field">
            <div class="gs-field__info">
              <label class="gs-field__label">{{ field.label }}</label>
              <span class="gs-field__key">{{ field.key }}</span>
              <p v-if="field.desc" class="gs-field__desc">{{ field.desc }}</p>
            </div>
            <div class="gs-field__control">
              <template v-if="field.type === 'boolean' || field.type === 'switch'">
                <el-switch v-model="fieldValues[field.key]" @change="markDirty" />
              </template>
              <template v-else-if="field.type === 'number'">
                <el-input-number v-model="fieldValues[field.key]" :min="field.min ?? 0" :max="field.max ?? 99999" style="width:100%" @change="markDirty" />
              </template>
              <template v-else-if="field.type === 'select'">
                <el-select v-model="fieldValues[field.key]" style="width:100%" @change="markDirty">
                  <el-option v-for="opt in field.options" :key="opt.value" :label="opt.label" :value="opt.value" />
                </el-select>
              </template>
              <template v-else-if="field.type === 'textarea'">
                <el-input v-model="fieldValues[field.key]" type="textarea" :rows="3" @input="markDirty" />
              </template>
              <template v-else>
                <el-input v-model="fieldValues[field.key]" @input="markDirty" />
              </template>
            </div>
          </div>

          <div v-if="sliceFields(activeSlice).length === 0" class="gs-editor__empty">
            <p>该分组暂无配置项</p>
          </div>
        </div>

        <div class="gs-editor__footer">
          <el-button @click="loadSliceSettings(activeSlice)">重置</el-button>
          <el-button type="primary" :disabled="!dirty" :loading="saving" @click="saveSlice(activeSlice)">
            保存
          </el-button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { ElButton, ElInput, ElInputNumber, ElMessage, ElMessageBox, ElSelect, ElSkeleton, ElSwitch } from "element-plus";
import { listAiGlobalSettings, replaceAiGlobalSettings, type SysAiGlobalSetting } from "../../../api/ai/global-setting";

const router = useRouter();

// ── Slice definitions ──
interface SliceField {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "switch" | "select" | "textarea";
  desc?: string;
  defaultValue?: any;
  min?: number;
  max?: number;
  options?: { label: string; value: any }[];
}

interface SliceDef {
  key: string;
  name: string;
  desc: string;
  icon: string;
  fields: SliceField[];
}

const slices: SliceDef[] = [
  {
    key: "ocr",
    name: "OCR 识别",
    desc: "光学字符识别全局配置",
    icon: "ri:scan-line",
    fields: [
      { key: "default_ocr_model", label: "默认 OCR 模型", type: "string", defaultValue: "local-onnx-ocr-ppv5", desc: "OCR 识别使用的默认模型编码" },
      { key: "ocr_language", label: "识别语言", type: "string", defaultValue: "ch" },
      { key: "ocr_confidence_threshold", label: "置信度阈值", type: "number", defaultValue: 0.5, min: 0, max: 1 },
      { key: "ocr_max_image_size", label: "最大图片尺寸", type: "number", defaultValue: 2048, min: 512, max: 8192 },
      { key: "enhance_contrast", label: "对比度增强", type: "switch", defaultValue: true },
      { key: "enhance_brightness", label: "亮度调整", type: "number", defaultValue: 0, min: -128, max: 128 },
      { key: "enhance_denoise", label: "降噪", type: "switch", defaultValue: true },
      { key: "enhance_binarize", label: "二值化", type: "switch", defaultValue: false },
      { key: "enhance_deskew", label: "倾斜校正", type: "switch", defaultValue: true },
      { key: "enhance_text_sr_enabled", label: "文本超分辨率", type: "switch", defaultValue: false, desc: "使用 AI 提升小字识别率" },
      { key: "enhance_text_sr_model", label: "超分辨率模型", type: "string", defaultValue: "textbsr_traced_model" },
      { key: "enhance_doc_align_enabled", label: "文档对齐校正", type: "switch", defaultValue: false, desc: "使用 AI 校正倾斜文档" },
      { key: "enhance_doc_align_model", label: "对齐模型", type: "string", defaultValue: "mlsd_traced_model" },
    ],
  },
  {
    key: "rag",
    name: "RAG 知识库",
    desc: "检索增强生成全局配置",
    icon: "ri:file-search-line",
    fields: [
      { key: "rag_embedding_engine", label: "Embedding 引擎", type: "select", defaultValue: "memory", options: [
        { label: "Memory（内存哈希）", value: "memory" },
        { label: "OpenAI", value: "openai" },
        { label: "SiliconFlow", value: "siliconflow" },
      ]},
      { key: "rag_vector_storage", label: "向量存储", type: "select", defaultValue: "jvector", options: [
        { label: "JVector（本地 HNSW）", value: "jvector" },
        { label: "内存存储", value: "memory" },
        { label: "Milvus", value: "milvus" },
        { key: "mysql", label: "MySQL", value: "mysql" },
      ]},
      { key: "rag_llm_provider", label: "LLM Provider", type: "string", defaultValue: "", desc: "如 openai / siliconflow" },
      { key: "rag_llm_model", label: "LLM 模型", type: "string", defaultValue: "" },
      { key: "rag_chunk_size", label: "分块大小", type: "number", defaultValue: 1000, min: 200, max: 4000 },
      { key: "rag_chunk_overlap", label: "分块重叠", type: "number", defaultValue: 200, min: 0, max: 500 },
      { key: "rag_default_top_k", label: "默认 Top-K", type: "number", defaultValue: 5, min: 1, max: 20 },
      { key: "rag_similarity_threshold", label: "相似度阈值", type: "number", defaultValue: 0.7, min: 0, max: 1 },
    ],
  },
  {
    key: "runtime",
    name: "运行时配置",
    desc: "AI 聊天运行时参数",
    icon: "ri:settings-3-line",
    fields: [
      { key: "enabled", label: "启用聊天能力", type: "switch", defaultValue: true },
      { key: "appKeyEnabled", label: "AppKey 校验", type: "switch", defaultValue: false },
      { key: "inputOptimizationEnabled", label: "输入优化", type: "switch", defaultValue: false },
      { key: "contextCompressionEnabled", label: "上下文压缩", type: "switch", defaultValue: false },
      { key: "defaultModel", label: "默认模型", type: "string", defaultValue: "" },
      { key: "temperature", label: "Temperature", type: "number", defaultValue: 0.7, min: 0, max: 2 },
      { key: "maxTokens", label: "Max Tokens", type: "number", defaultValue: 4096, min: 1, max: 128000 },
      { key: "timeoutMillis", label: "超时时间(ms)", type: "number", defaultValue: 30000, min: 1000, max: 300000 },
      { key: "systemPrompt", label: "System Prompt", type: "textarea", defaultValue: "" },
      { key: "contextCompressionThreshold", label: "压缩阈值", type: "number", defaultValue: 12 },
      { key: "contextCompressionRetainMessages", label: "保留消息数", type: "number", defaultValue: 6 },
    ],
  },
  {
    key: "default",
    name: "默认配置",
    desc: "系统默认全局参数",
    icon: "ri:list-settings-line",
    fields: [
      { key: "default_model", label: "默认模型", type: "string", defaultValue: "" },
    ],
  },
];

const activeSlice = ref("ocr");
const settingLoading = ref(false);
const saving = ref(false);
const dirty = ref(false);
const fieldValues = reactive<Record<string, any>>({});
const originalValues = reactive<Record<string, any>>({});

const currentSlice = computed(() => slices.find(s => s.key === activeSlice.value));

function sliceFields(sliceKey: string): SliceField[] {
  return slices.find(s => s.key === sliceKey)?.fields || [];
}

function markDirty() {
  dirty.value = Object.keys(fieldValues).some(k => fieldValues[k] !== originalValues[k]);
}

async function selectSlice(key: string) {
  if (dirty.value) {
    const confirm = await ElMessageBox.confirm("当前修改尚未保存，是否丢弃？", "提示", {
      confirmButtonText: "丢弃",
      cancelButtonText: "取消",
      type: "warning",
    }).catch(() => false);
    if (!confirm) return;
  }
  activeSlice.value = key;
  loadSliceSettings(key);
}

async function loadSliceSettings(sliceKey: string) {
  settingLoading.value = true;
  try {
    const res = await listAiGlobalSettings(sliceKey);
    const fields = sliceFields(sliceKey);
    const values: Record<string, any> = {};

    // Initialize with defaults
    for (const f of fields) {
      values[f.key] = f.defaultValue ?? "";
    }

    // Override with DB values
    if (res.success && res.data) {
      for (const setting of res.data) {
        if (setting.sysAiGlobalSettingField in values) {
          values[setting.sysAiGlobalSettingField] = convertValue(
            setting.sysAiGlobalSettingValue,
            fields.find(f => f.key === setting.sysAiGlobalSettingField)?.type || "string",
          );
        }
      }
    }

    Object.assign(fieldValues, values);
    Object.assign(originalValues, { ...values });
    dirty.value = false;
  } finally {
    settingLoading.value = false;
  }
}

function convertValue(value: string | undefined | null, type: string): any {
  if (value == null) return "";
  switch (type) {
    case "number": return Number(value);
    case "switch":
    case "boolean": return value === "true" || value === true;
    default: return value;
  }
}

function formatValue(value: any, type: string): string {
  if (type === "switch" || type === "boolean") return value ? "true" : "false";
  return String(value ?? "");
}

async function saveSlice(sliceKey: string) {
  saving.value = true;
  try {
    const fields = sliceFields(sliceKey);
    const settings: SysAiGlobalSetting[] = fields.map(f => ({
      sysAiGlobalSettingField: f.key,
      sysAiGlobalSettingValue: formatValue(fieldValues[f.key], f.type),
      sysAiGlobalSettingValueType: f.type === "switch" || f.type === "boolean" ? "BOOLEAN" : f.type === "number" ? "NUMBER" : "STRING",
      sysAiGlobalSettingDescription: f.desc || f.label,
    }));

    const res = await replaceAiGlobalSettings(settings, sliceKey);
    if (res.success) {
      ElMessage.success("保存成功");
      Object.assign(originalValues, { ...fieldValues });
      dirty.value = false;
    } else {
      ElMessage.error(res.msg || "保存失败");
    }
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadSliceSettings(activeSlice.value);
});
</script>

<style scoped>
.gs-page {
  height: calc(100vh - var(--saas-nav-height, 48px) - 2px);
  display: flex; flex-direction: column; padding: 0 24px; overflow: hidden;
  background: color-mix(in srgb, var(--el-bg-color) 98%, var(--el-color-primary));
}

.gs-header {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 0; border-bottom: 1px solid var(--el-border-color-light); flex-shrink: 0;
}
.gs-back {
  width: 36px; height: 36px; border-radius: 10px; border: 1px solid var(--el-border-color);
  background: var(--el-bg-color); cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 18px; color: var(--el-text-color-secondary); transition: all 0.2s;
}
.gs-back:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
.gs-header-info h2 { font-size: 18px; font-weight: 700; margin: 0; }
.gs-header-info p { font-size: 12px; color: var(--el-text-color-secondary); margin: 2px 0 0; }

.gs-body {
  flex: 1; display: flex; gap: 24px; padding: 20px 0; overflow: hidden;
}

/* ── Slice list ── */
.gs-slices {
  width: 220px; flex-shrink: 0; display: flex; flex-direction: column; gap: 8px;
  overflow-y: auto;
}
.gs-slice-card {
  display: flex; flex-direction: column; gap: 2px;
  padding: 14px 16px; border-radius: 12px; border: 1px solid transparent;
  background: var(--el-bg-color); cursor: pointer; transition: all 0.2s;
  text-align: left;
}
.gs-slice-card:hover { border-color: color-mix(in srgb, var(--el-color-primary) 30%, transparent); }
.gs-slice-card.active { border-color: var(--el-color-primary); background: color-mix(in srgb, var(--el-color-primary) 6%, var(--el-bg-color)); }
.gs-slice-card__icon { font-size: 20px; color: var(--el-color-primary); margin-bottom: 4px; }
.gs-slice-card__name { font-size: 14px; font-weight: 600; }
.gs-slice-card__desc { font-size: 12px; color: var(--el-text-color-secondary); }
.gs-slice-card__count { font-size: 11px; color: var(--el-text-color-secondary); margin-top: 4px; }

/* ── Editor ── */
.gs-editor {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
  background: var(--el-bg-color); border-radius: 12px; border: 1px solid var(--el-border-color-light);
}
.gs-editor__header {
  padding: 16px 20px; border-bottom: 1px solid var(--el-border-color-light); flex-shrink: 0;
}
.gs-editor__header strong { font-size: 15px; display: block; }
.gs-editor__header small { font-size: 12px; color: var(--el-text-color-secondary); }

.gs-editor__loading { padding: 40px 20px; }
.gs-editor__fields {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  display: flex; flex-direction: column; gap: 4px;
}
.gs-editor__empty { text-align: center; padding: 40px; color: var(--el-text-color-secondary); }

.gs-field {
  display: flex; align-items: flex-start; gap: 16px;
  padding: 12px 14px; border-radius: 8px;
  transition: background 0.2s;
}
.gs-field:hover { background: color-mix(in srgb, var(--el-bg-color) 95%, var(--el-color-primary)); }
.gs-field__info { flex: 1; min-width: 0; }
.gs-field__label { font-size: 14px; font-weight: 500; display: block; }
.gs-field__key { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; }
.gs-field__desc { font-size: 12px; color: var(--el-text-color-secondary); margin: 2px 0 0; }
.gs-field__control { width: 260px; flex-shrink: 0; }

.gs-editor__footer {
  padding: 12px 20px; border-top: 1px solid var(--el-border-color-light);
  display: flex; justify-content: flex-end; gap: 8px; flex-shrink: 0;
}

/* ── Dark mode ── */
:root.dark .gs-page { background: color-mix(in srgb, #0f0f1a 98%, var(--el-color-primary)); }
</style>
