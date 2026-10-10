<template>
  <div class="ai-page">
    <el-card shadow="never" class="ai-card">
      <div class="ai-toolbar">
        <div class="ai-title">
          <h3>模型管理</h3>
          <span>维护各提供商下的模型行：启停 / 别名 / 窗口与采样参数（sys_ai_provider_model）</span>
        </div>
        <div class="ai-actions">
          <el-select
            v-model="providerFilter"
            clearable
            filterable
            placeholder="全部提供商"
            style="width: 200px"
          >
            <el-option
              v-for="p in providers"
              :key="p.provider_id"
              :label="p.name"
              :value="p.provider_id"
            />
          </el-select>
          <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增模型</el-button>
        </div>
      </div>

      <el-table v-loading="loading" :data="filteredRows" border stripe>
        <el-table-column label="模型" min-width="220">
          <template #default="{ row }">
            <div class="model-cell">
              <span class="model-name">{{ row.model }}</span>
              <span v-if="row.alias" class="model-alias">{{ row.alias }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="提供商" width="150" show-overflow-tooltip>
          <template #default="{ row }">{{ providerName(row.provider_id) }}</template>
        </el-table-column>
        <el-table-column label="能力" width="150">
          <template #default="{ row }">
            <template v-if="capTasks(row).length">
              <el-tag v-for="t in capTasks(row)" :key="t" size="small" class="cap-tag">{{ t }}</el-tag>
            </template>
            <span v-else class="dim">—</span>
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              :model-value="row.enabled !== false"
              @change="(v: boolean) => toggleEnabled(row, v)"
            />
          </template>
        </el-table-column>
        <el-table-column label="上下文" width="90" align="right">
          <template #default="{ row }">{{ row.context_window ?? "—" }}</template>
        </el-table-column>
        <el-table-column label="最大输出" width="90" align="right">
          <template #default="{ row }">{{ row.max_tokens ?? "—" }}</template>
        </el-table-column>
        <el-table-column label="温度" width="70" align="right">
          <template #default="{ row }">{{ row.temperature ?? "—" }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="160" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="doDelete(row)">删除</el-button>
          </template>
        </el-table-column>
        <template #empty>
          <el-empty
            :description="providerFilter ? '该提供商下还没有模型' : '还没有模型行，点右上角「新增模型」或在提供商页用「导入模型」批量补录'"
            :image-size="80"
          />
        </template>
      </el-table>
    </el-card>

    <!-- 新增 / 编辑 -->
    <el-dialog
      v-model="dialogVisible"
      :title="editing ? `编辑模型：${editing.model}` : '新增模型'"
      width="600px"
      destroy-on-close
    >
      <el-form :model="form" label-width="110px">
        <el-form-item label="提供商" required>
          <el-select
            v-model="form.provider_id"
            :disabled="Boolean(editing)"
            filterable
            placeholder="选择提供商"
            style="width: 100%"
          >
            <el-option
              v-for="p in providers"
              :key="p.provider_id"
              :label="`${p.name}（${p.platform}）`"
              :value="p.provider_id"
            />
          </el-select>
          <div v-if="editing" class="field-hint">模型行的复合主键（提供商 + 模型名）不可改</div>
        </el-form-item>
        <el-form-item label="模型名" required>
          <el-input
            v-model="form.model"
            :disabled="Boolean(editing)"
            placeholder="上游模型 ID，如 gpt-4o-mini"
          />
        </el-form-item>
        <el-form-item v-if="!editing" label="主任务">
          <el-select
            v-model="form.task"
            filterable
            allow-create
            default-first-option
            style="width: 100%"
          >
            <el-option v-for="t in TASK_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
          <div class="field-hint">能力写入 capabilities[0].task，决定该模型被哪类调用选中</div>
        </el-form-item>
        <el-form-item label="别名">
          <el-input v-model="form.alias" placeholder="可选，展示名" clearable />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="可选" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="-9999" :max="99999" />
        </el-form-item>
        <el-form-item label="上下文窗口">
          <el-input-number v-model="form.context_window" :min="0" :max="100000000" placeholder="留空=未指定" />
        </el-form-item>
        <el-form-item label="最大输出">
          <el-input-number v-model="form.max_tokens" :min="0" :max="100000000" placeholder="留空=未指定" />
        </el-form-item>
        <div class="param-grid">
          <el-form-item label="温度">
            <el-input-number v-model="form.temperature" :min="0" :max="2" :step="0.1" />
          </el-form-item>
          <el-form-item label="Top-p">
            <el-input-number v-model="form.top_p" :min="0" :max="1" :step="0.05" />
          </el-form-item>
          <el-form-item label="频率惩罚">
            <el-input-number v-model="form.frequency_penalty" :min="-2" :max="2" :step="0.1" />
          </el-form-item>
        </div>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" />
        </el-form-item>
        <div class="field-hint">窗口与采样参数留空表示「未指定」，运行时回退到指标表官方值</div>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Refresh } from "@element-plus/icons-vue";
import {
  aiAdminApi,
  notifyFail,
  type AiProviderModelRow,
  type AiProviderRow,
} from "../api/aiAdminApi";

/** 主任务选项（后端原样保存，可输入任意 task） */
const TASK_OPTIONS = [
  { value: "chat", label: "chat —— 对话" },
  { value: "embedding", label: "embedding —— 向量" },
  { value: "rerank", label: "rerank —— 重排" },
  { value: "image_generation", label: "image_generation —— 文生图" },
  { value: "video_generation", label: "video_generation —— 文生视频" },
  { value: "ocr", label: "ocr —— 文字识别" },
];

const loading = ref(false);
const saving = ref(false);
const providers = ref<AiProviderRow[]>([]);
const rows = ref<AiProviderModelRow[]>([]);
const providerFilter = ref("");

const filteredRows = computed(() =>
  providerFilter.value ? rows.value.filter((r) => r.provider_id === providerFilter.value) : rows.value,
);

function providerName(id: string): string {
  return providers.value.find((p) => p.provider_id === id)?.name ?? id;
}

function capTasks(row: AiProviderModelRow): string[] {
  return (row.capabilities || [])
    .map((c) => String(c.task ?? ""))
    .filter(Boolean)
    .slice(0, 3);
}

async function load(): Promise<void> {
  loading.value = true;
  try {
    const [ps, ms] = await Promise.all([aiAdminApi.listProviders(), aiAdminApi.listModels()]);
    providers.value = ps;
    rows.value = ms;
  } catch (e) {
    notifyFail(e);
  } finally {
    loading.value = false;
  }
}

// ==================== 新增 / 编辑 ====================
const dialogVisible = ref(false);
const editing = ref<AiProviderModelRow | null>(null);
const form = reactive({
  provider_id: "",
  model: "",
  task: "chat",
  alias: "",
  description: "",
  enabled: true,
  sort_order: 0,
  context_window: null as number | null,
  max_tokens: null as number | null,
  temperature: null as number | null,
  top_p: null as number | null,
  frequency_penalty: null as number | null,
});

function openCreate(): void {
  editing.value = null;
  Object.assign(form, {
    provider_id: providerFilter.value || "",
    model: "",
    task: "chat",
    alias: "",
    description: "",
    enabled: true,
    sort_order: rows.value.length,
    context_window: null,
    max_tokens: null,
    temperature: null,
    top_p: null,
    frequency_penalty: null,
  });
  dialogVisible.value = true;
}

function openEdit(row: AiProviderModelRow): void {
  editing.value = row;
  Object.assign(form, {
    provider_id: row.provider_id,
    model: row.model,
    task: "chat",
    alias: row.alias ?? "",
    description: row.description ?? "",
    enabled: row.enabled !== false,
    sort_order: row.sort_order ?? 0,
    context_window: row.context_window ?? null,
    max_tokens: row.max_tokens ?? null,
    temperature: row.temperature ?? null,
    top_p: row.top_p ?? null,
    frequency_penalty: row.frequency_penalty ?? null,
  });
  dialogVisible.value = true;
}

async function save(): Promise<void> {
  if (!form.provider_id) {
    ElMessage.warning("请选择提供商");
    return;
  }
  if (!form.model.trim()) {
    ElMessage.warning("请填写模型名");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      model: form.model.trim(),
      alias: form.alias.trim(),
      description: form.description.trim(),
      enabled: form.enabled,
      sort_order: form.sort_order,
      context_window: form.context_window,
      max_tokens: form.max_tokens,
      temperature: form.temperature,
      top_p: form.top_p,
      frequency_penalty: form.frequency_penalty,
      // 只在新增时下发能力；编辑不带该键 → 后端 containsKey 合并语义保留原 capabilities
      ...(editing.value
        ? {}
        : { capabilities: [{ task: form.task, traits: [] as string[] }] }),
    };
    await aiAdminApi.saveModel(form.provider_id, payload);
    ElMessage.success(editing.value ? "模型已更新" : "模型已创建");
    dialogVisible.value = false;
    await load();
  } catch (e) {
    notifyFail(e);
  } finally {
    saving.value = false;
  }
}

async function toggleEnabled(row: AiProviderModelRow, val: boolean): Promise<void> {
  try {
    await aiAdminApi.saveModel(row.provider_id, { model: row.model, enabled: val });
    row.enabled = val;
    ElMessage.success(val ? "已启用" : "已停用");
  } catch (e) {
    notifyFail(e);
  }
}

async function doDelete(row: AiProviderModelRow): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `删除模型「${row.model}」（提供商 ${providerName(row.provider_id)}）？`,
      "删除确认",
      { type: "warning", confirmButtonText: "删除", confirmButtonClass: "el-button--danger" },
    );
  } catch {
    return;
  }
  try {
    await aiAdminApi.deleteModel(row.provider_id, row.model);
    ElMessage.success("已删除");
    await load();
  } catch (e) {
    notifyFail(e);
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
  margin-bottom: 14px;
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
.ai-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}
.model-cell {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.model-name {
  font-weight: 500;
}
.model-alias {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.cap-tag {
  margin-right: 4px;
}
.dim {
  color: var(--el-text-color-placeholder);
}
.field-hint {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}
.param-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0 12px;
}
</style>
