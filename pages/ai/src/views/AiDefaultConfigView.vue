<template>
  <div class="ai-page">
    <div class="ai-toolbar">
      <div class="ai-title">
        <h3>默认模型配置</h3>
        <span>全局默认模型与布局 / OCR 管线参数（sys_ai_global_setting），配置 ai-starter 内置全局能力</span>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <el-alert
      class="write-notice"
      type="info"
      :closable="false"
      title="本页全部写入全局层，对所有用户与无登录身份的阅卷/组卷管线生效"
      description="「全局默认模型」按分组直写（PUT /v2/settings/models）；布局与 OCR 管线走整组替换端点（PUT /v2/{layout,ocr}/config）——这两个分组在后端属用户隔离名单，若走分组直写会落到个人覆盖层，虚拟线程读不到。"
    />

    <!-- ① 全局默认模型 -->
    <el-card shadow="never" class="ai-card">
      <div class="card-head">
        <div>
          <h4>全局默认模型</h4>
          <span class="card-sub">默认版面分析 / OCR 检测与识别 / 向量 embedding 等（models 分组，写全局层）</span>
        </div>
        <el-button
          type="primary"
          :disabled="!modelsDirty"
          :loading="savingSection === 'models'"
          @click="saveModels"
        >
          保存
        </el-button>
      </div>

      <div v-loading="loading" class="rows">
        <div v-for="r in modelRows" :key="r.field" class="row">
          <div class="row-label">
            <span class="row-desc">{{ r.description || r.field }}</span>
            <code class="row-field">{{ r.field }}</code>
            <el-tag v-if="r.overridden" size="small" type="warning">个人覆盖</el-tag>
          </div>
          <div class="row-control">
            <el-select
              v-if="isModelRow(r)"
              :model-value="String(r.value ?? '')"
              filterable
              allow-create
              placeholder="选择或输入 provider:model"
              style="width: 320px"
              @change="(v: string) => (r.value = v)"
            >
              <el-option v-for="o in modelOptions" :key="o.value" :label="o.label" :value="o.value" />
            </el-select>
            <el-input-number
              v-else-if="r.valueType === 'NUMBER'"
              :model-value="toNum(r.value)"
              style="width: 180px"
              @update:model-value="(v: number | null) => (r.value = v)"
            />
            <el-switch
              v-else-if="r.valueType === 'BOOLEAN'"
              :model-value="r.value === true || r.value === 'true'"
              @change="(v: boolean) => (r.value = String(v))"
            />
            <el-input
              v-else
              :model-value="String(r.value ?? '')"
              style="width: 320px"
              @input="(v: string) => (r.value = v)"
            />
            <span v-if="r.overridden" class="dim">全局默认：{{ r.defaultValue ?? "（空）" }}</span>
          </div>
        </div>
        <el-empty v-if="!loading && !modelRows.length" description="未取到 models 分组定义" :image-size="70" />
      </div>
    </el-card>

    <!-- ②③ 管线配置（整组替换） -->
    <el-card
      v-for="s in pipelineSections"
      :key="s.key"
      shadow="never"
      class="ai-card"
    >
      <div class="card-head">
        <div>
          <h4>{{ s.title }}</h4>
          <span class="card-sub">{{ s.desc }}</span>
        </div>
        <div class="card-ops">
          <el-button
            type="primary"
            :disabled="!pipelineDirty(s.key) || !s.rows.length"
            :loading="savingSection === s.key"
            @click="savePipeline(s.key)"
          >
            保存（整组替换）
          </el-button>
        </div>
      </div>

      <div v-loading="loading" class="rows">
        <el-alert
          v-if="s.error"
          type="warning"
          :closable="false"
          :title="s.error"
          style="margin-bottom: 10px"
        />
        <div v-for="r in s.rows" :key="r.field" class="row">
          <div class="row-label">
            <span class="row-desc">{{ r.description || r.field }}</span>
            <code class="row-field">{{ r.field }}</code>
          </div>
          <div class="row-control">
            <el-switch
              v-if="r.valueType === 'BOOLEAN'"
              :model-value="r.value === true || r.value === 'true'"
              @change="(v: boolean) => (r.value = String(v))"
            />
            <el-input-number
              v-else-if="r.valueType === 'NUMBER'"
              :model-value="toNum(r.value)"
              style="width: 180px"
              @update:model-value="(v: number | null) => (r.value = v)"
            />
            <el-input
              v-else
              :model-value="String(r.value ?? '')"
              style="width: 320px"
              @input="(v: string) => (r.value = v)"
            />
          </div>
        </div>
        <el-empty
          v-if="!loading && !s.rows.length && !s.error"
          :description="`${s.title}暂无配置项`"
          :image-size="70"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { Refresh } from "@element-plus/icons-vue";
import {
  aiAdminApi,
  notifyFail,
  type AiProviderRow,
  type PipelineField,
  type SettingsMergedRow,
} from "../api/aiAdminApi";

const loading = ref(false);
const savingSection = ref("");

const modelRows = ref<SettingsMergedRow[]>([]);
const modelSnap = ref("");
const modelOptions = ref<Array<{ label: string; value: string }>>([]);
/**
 * 本次页面生命周期里出现过的模型值（含各分组当前值），跨 load 持久。
 * 作用见 buildModelOptions：保住「翻走后原值仍可选」。
 */
const seenModelValues = ref(new Set<string>());

const layoutRows = ref<PipelineField[]>([]);
const layoutSnap = ref("");
const layoutError = ref("");
const ocrRows = ref<PipelineField[]>([]);
const ocrSnap = ref("");
const ocrError = ref("");

/** ②③ 管线卡片（同一套行渲染与整组替换保存） */
const pipelineSections = computed(() => [
  {
    key: "layout" as const,
    title: "版面识别管线",
    desc: "layout 分组：版面分析模型 / 阈值等（layout_model 为裸模型名，按后端定义原样填写）",
    rows: layoutRows.value,
    error: layoutError.value,
  },
  {
    key: "ocr" as const,
    title: "OCR 文字识别管线",
    desc: "ocr 分组：检测 / 识别 / 方向 / 矫正模型与置信度阈值",
    rows: ocrRows.value,
    error: ocrError.value,
  },
]);

function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

/** models 分组里的模型选择字段：STRING 且字段名含 model（值为 provider:model） */
function isModelRow(r: SettingsMergedRow): boolean {
  return r.valueType === "STRING" && /model/i.test(r.field);
}

/** 模型下拉：提供商 × 模型拍平为 `provider_id:model` */
function buildModelOptions(providers: AiProviderRow[]): void {
  const opts: Array<{ label: string; value: string }> = [];
  for (const p of providers) {
    for (const m of p.models || []) {
      opts.push({ label: `${p.name} / ${m.model}`, value: `${p.provider_id}:${m.model}` });
    }
  }
  // 各模型行的当前值先入「见过值」集合：onnx:* 等注册表物化模型并不在
  // sys_ai_provider_model 里，真实选项列表查不到它；若只在「仍为当前值」时补选
  // 项，用户一旦翻走原值 + 保存重载，原值就从下拉里永久消失、无法翻回。
  for (const r of modelRows.value) {
    const v = String(r.value ?? "");
    if (v && isModelRow(r)) seenModelValues.value.add(v);
  }
  for (const v of seenModelValues.value) {
    if (!opts.some((o) => o.value === v)) opts.push({ label: v, value: v });
  }
  modelOptions.value = opts;
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [providers, merged] = await Promise.all([
      aiAdminApi.listProviders().catch(() => [] as AiProviderRow[]),
      aiAdminApi.fetchMergedGroup("models"),
    ]);
    modelRows.value = merged;
    modelSnap.value = JSON.stringify(modelRows.value);
    buildModelOptions(providers);
  } catch (e) {
    notifyFail(e);
  }
  try {
    layoutRows.value = await aiAdminApi.fetchPipelineConfig("layout");
    layoutError.value = "";
  } catch (e) {
    layoutRows.value = [];
    layoutError.value = "布局配置读取失败（该端点需 ai-starter ≥ r44）";
  }
  try {
    ocrRows.value = await aiAdminApi.fetchPipelineConfig("ocr");
    ocrError.value = "";
  } catch (e) {
    ocrRows.value = [];
    ocrError.value = "OCR 配置读取失败（该端点需 ai-starter ≥ r42）";
  }
  layoutSnap.value = JSON.stringify(layoutRows.value);
  ocrSnap.value = JSON.stringify(ocrRows.value);
  loading.value = false;
}

const modelsDirty = computed(() => JSON.stringify(modelRows.value) !== modelSnap.value);

function pipelineDirty(key: "layout" | "ocr"): boolean {
  return key === "layout"
    ? JSON.stringify(layoutRows.value) !== layoutSnap.value
    : JSON.stringify(ocrRows.value) !== ocrSnap.value;
}

/** 只下发改过的字段（扁平 {field: value}，管理员写全局层并触发热更新） */
async function saveModels(): Promise<void> {
  const before = JSON.parse(modelSnap.value || "[]") as SettingsMergedRow[];
  const patch: Record<string, unknown> = {};
  for (const r of modelRows.value) {
    const prev = before.find((b) => b.field === r.field);
    if (!prev || String(prev.value ?? "") !== String(r.value ?? "")) {
      patch[r.field] = r.value;
    }
  }
  if (!Object.keys(patch).length) return;
  savingSection.value = "models";
  try {
    await aiAdminApi.saveGlobalGroup("models", patch);
    ElMessage.success("已保存：写入全局层（sys_ai_global_setting），立即生效");
    await load();
  } catch (e) {
    notifyFail(e);
  } finally {
    savingSection.value = "";
  }
}

/**
 * 管线配置整组替换：必须回传 GET 拿到的全集字段（只改 value）。
 * 端点内部会 replace 分组 + 失效缓存 + 发布热更新事件。
 */
async function savePipeline(key: "layout" | "ocr"): Promise<void> {
  const rows = key === "layout" ? layoutRows.value : ocrRows.value;
  if (!rows.length) return;
  savingSection.value = key;
  try {
    await aiAdminApi.savePipelineConfig(
      key,
      rows.map((r) => ({
        field: r.field,
        valueType: r.valueType,
        description: r.description,
        sort: r.sort,
        value: r.value,
      })),
    );
    ElMessage.success(
      key === "layout" ? "版面识别配置已保存（整组替换，写入全局层）" : "OCR 配置已保存（整组替换，写入全局层）",
    );
    await load();
  } catch (e) {
    notifyFail(e);
  } finally {
    savingSection.value = "";
  }
}

onMounted(load);
</script>

<style scoped>
.ai-page {
  padding: 16px;
}
.ai-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.ai-title h3 {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 600;
}
.ai-title span {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.write-notice {
  margin-bottom: 14px;
}
.ai-card {
  margin-bottom: 14px;
}
.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.card-head h4 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}
.card-sub {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.card-ops {
  flex-shrink: 0;
}
.rows {
  min-height: 60px;
}
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.row:last-child {
  border-bottom: none;
}
.row-label {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.row-desc {
  font-size: 13px;
}
.row-field {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  padding: 1px 6px;
  border-radius: 4px;
}
.row-control {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}
.dim {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
