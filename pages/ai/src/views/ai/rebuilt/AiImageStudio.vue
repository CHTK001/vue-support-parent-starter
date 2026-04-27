<template>
  <section class="image-studio">
    <div class="image-studio__shell">
      <main class="image-studio__main">
        <div class="image-studio__header">
          <div>
            <h1>文生图工作台</h1>
            <p>沿用聊天式工作区，只保留模型、模板、风格和生图参数。</p>
          </div>
          <div class="image-studio__toolbar">
            <el-tag v-if="modelSettings.supportAsync" type="success" round>异步任务</el-tag>
            <el-tag round>默认 {{ form.number }} 张</el-tag>
            <el-button text @click="reloadHistory">刷新历史</el-button>
            <el-button @click="openImageConfigDialog">生图配置</el-button>
            <el-button @click="openPriceDialog">费用信息</el-button>
          </div>
        </div>

        <div class="image-studio__content">
          <div class="image-studio__result-panel">
            <div class="image-studio__panel-head">
              <div class="image-studio__panel-headline">
                <span>生成结果</span>
                <small v-if="taskDetail?.summary">{{ taskDetail.summary }}</small>
              </div>
              <div class="image-studio__panel-state" v-if="taskDetail">
                <el-tag
                  :type="
                    taskDetail.taskStatus === 'SUCCESS'
                      ? 'success'
                      : taskDetail.taskStatus === 'FAILURE'
                        ? 'danger'
                        : 'warning'
                  "
                  round
                >
                  {{ taskDetail.taskStatus || 'PENDING' }}
                </el-tag>
                <small>进度 {{ taskDetail.progress || 0 }}%</small>
              </div>
            </div>

            <div v-if="history.length > 0" class="image-studio__history-strip">
              <button
                v-for="item in history"
                :key="item.sysAiTaskId"
                type="button"
                class="image-studio__history-chip"
                :class="{ active: item.sysAiTaskId === activeTaskId }"
                @click="selectTask(item)"
              >
                <span class="image-studio__history-chip-title">{{ item.sysAiTaskPrompt || "未命名任务" }}</span>
                <el-tag
                  size="small"
                  round
                  :type="
                    item.sysAiTaskStatus === 'SUCCESS'
                      ? 'success'
                      : item.sysAiTaskStatus === 'FAILURE'
                        ? 'danger'
                        : 'warning'
                  "
                >
                  {{ item.sysAiTaskStatus || "PENDING" }}
                </el-tag>
              </button>
            </div>

            <div v-if="!taskDetail" class="image-studio__empty-state">
              <strong>等待创建任务</strong>
              <p>选择模型、模板和风格后，在下方输入提示词创建第一条文生图任务。</p>
            </div>

            <div v-else class="image-studio__result-grid">
              <article
                v-for="item in resultCards"
                :key="item.key"
                class="image-studio__result-card"
                :class="{ done: item.url, failed: item.failed }"
              >
                <img v-if="item.url" :src="item.url" :alt="`result-${item.key}`" />
                <div v-else class="image-studio__placeholder">
                  <div class="image-studio__liquid">
                    <div class="image-studio__liquid-fill" :style="{ height: `${item.progress}%` }" />
                  </div>
                  <span>{{ item.failed ? '失败' : `${item.progress}%` }}</span>
                  <small v-if="item.failed">{{ taskDetail?.message || '任务执行失败' }}</small>
                </div>
              </article>
            </div>
          </div>

          <div class="image-studio__composer">
            <EditorSender
              ref="editorRef"
              v-model="draft"
              :loading="submitting"
              clearable
              auto-focus
              variant="updown"
              submit-type="shiftEnter"
              placeholder="描述想要生成的图像，Shift+Enter 提交任务"
              @submit="handleSubmit"
            >
              <template #action-list>
                <div class="image-studio__actions">
                  <div class="image-studio__model">
                    <el-tooltip
                      :content="activeModelTooltip"
                      placement="top-start"
                      :disabled="!form.sysAiModuleCode"
                    >
                      <el-select
                        v-model="form.sysAiModuleCode"
                        placeholder="选择模型"
                        popper-class="ai-model-select-popper"
                        class="image-studio__model-select"
                      >
                        <template #label="{ label, value }">
                          <div class="image-studio__model-label">
                            <div class="image-studio__model-avatar">
                              <img
                                v-if="getModelOption(value)?.image"
                                :src="getModelOption(value)?.image"
                                :alt="label"
                              />
                              <span v-else>{{ getModelOption(value)?.shortName || "AI" }}</span>
                            </div>
                            <span class="image-studio__model-label-text">{{ label }}</span>
                          </div>
                        </template>
                      <el-option
                        v-for="item in modules"
                        :key="item.sysAiModuleCode"
                        :label="item.sysAiModuleName"
                        :value="item.sysAiModuleCode"
                      >
                        <div class="image-studio__model-option">
                          <div class="image-studio__model-avatar">
                            <img v-if="item.sysAiModuleImage" :src="item.sysAiModuleImage" :alt="item.sysAiModuleName" />
                            <span v-else>{{ buildModelShortName(item.sysAiModuleName) }}</span>
                          </div>
                          <div class="image-studio__model-option-copy">
                            <span class="image-studio__model-option-name">{{ item.sysAiModuleName }}</span>
                            <small class="image-studio__model-option-code">{{ item.sysAiModuleCode }}</small>
                          </div>
                        </div>
                      </el-option>
                      </el-select>
                    </el-tooltip>
                  </div>

                  <el-select v-model="form.templateId" placeholder="模板" clearable>
                    <el-option
                      v-for="item in templates"
                      :key="item.sysAiTemplateId"
                      :label="item.sysAiTemplateName"
                      :value="item.sysAiTemplateId"
                    />
                  </el-select>

                  <el-select v-model="form.styleCode" placeholder="风格" clearable>
                    <el-option
                      v-for="item in styles"
                      :key="item.sysAiStyleId"
                      :label="item.sysAiStyleName"
                      :value="item.sysAiStyleCode"
                    />
                  </el-select>

                  <el-button
                    type="primary"
                    :disabled="submitting || !draft.trim() || !form.sysAiModuleCode"
                    @click="submitCurrentPrompt"
                  >
                    创建任务
                  </el-button>
                </div>
              </template>
            </EditorSender>
          </div>
        </div>
      </main>
    </div>

    <el-dialog v-model="imageConfigDialogVisible" title="生图配置" width="520px">
      <el-form label-position="top">
        <el-form-item label="图片张数">
          <el-input-number v-model="form.number" :min="1" :max="Math.max(1, modelSettings.maxNumber)" />
        </el-form-item>
        <el-form-item label="分辨率">
          <el-select v-model="form.size" class="full-width">
            <el-option
              v-for="size in availableSizes"
              :key="size"
              :label="size"
              :value="size"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="质量">
          <el-select v-model="form.quality" class="full-width">
            <el-option
              v-for="quality in availableQualities"
              :key="quality"
              :label="quality"
              :value="quality"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </el-dialog>

    <el-dialog v-model="priceDialogVisible" title="费用信息" width="460px">
      <div class="image-studio__price-sheet">
        <div class="image-studio__price-row">
          <span>输入费用</span>
          <strong>{{ activeModule?.sysAiModuleInputPrice ?? 0 }}</strong>
        </div>
        <div class="image-studio__price-row">
          <span>输出费用</span>
          <strong>{{ activeModule?.sysAiModuleOutputPrice ?? 0 }}</strong>
        </div>
        <div class="image-studio__price-row">
          <span>缓存费用</span>
          <strong>{{ activeModule?.sysAiModuleCachePrice ?? 0 }}</strong>
        </div>
      </div>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { EditorSender, type SubmitResult } from "vue-element-plus-x";
import {
  ElButton,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElTag,
} from "element-plus";
import { message } from "@repo/utils";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import {
  buildImageModelSettings,
  createImageStudioTask,
  getImageStudioTask,
  listImageStudioHistory,
  listImageStudioSettings,
  listImageStudioStyles,
  listImageStudioTemplates,
  type ImageStudioSetting,
  type ImageStudioStyle,
  type ImageStudioTask,
  type ImageStudioTaskDetail,
  type ImageStudioTemplate,
} from "../../../api/ai/image-studio";

type ResultCard = {
  key: string;
  progress: number;
  url?: string;
  failed?: boolean;
};

const buildModelShortName = (value?: string) =>
  (value || "AI")
    .trim()
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
    .slice(0, 2)
    .toUpperCase() || "AI";

const editorRef = ref();
const draft = ref("");
const submitting = ref(false);
const modules = ref<AiModule[]>([]);
const templates = ref<ImageStudioTemplate[]>([]);
const styles = ref<ImageStudioStyle[]>([]);
const settings = ref<ImageStudioSetting[]>([]);
const fallbackTemplates = ref<ImageStudioTemplate[]>([]);
const fallbackStyles = ref<ImageStudioStyle[]>([]);
const fallbackSettings = ref<ImageStudioSetting[]>([]);
const history = ref<ImageStudioTask[]>([]);
const activeTaskId = ref<number>();
const taskDetail = ref<ImageStudioTaskDetail>();
const pollingTimer = ref<ReturnType<typeof setInterval>>();
const imageConfigDialogVisible = ref(false);
const priceDialogVisible = ref(false);

const form = reactive({
  sysAiModuleCode: "",
  templateId: undefined as number | undefined,
  styleCode: undefined as string | undefined,
  size: "1024*1024",
  quality: "standard",
  number: 1,
});

const activeModule = computed(() =>
  modules.value.find((item) => item.sysAiModuleCode === form.sysAiModuleCode),
);

const getModelOption = (value?: string) =>
  modules.value.find((item) => item.sysAiModuleCode === value);

const activeModelTooltip = computed(() => {
  if (!activeModule.value) {
    return "";
  }
  const parts = [
    activeModule.value.sysAiModuleName,
    activeModule.value.sysAiModuleCode,
    activeModule.value.sysAiModuleVersion,
  ].filter(Boolean);
  return parts.join(" / ");
});

const modelSettings = computed(() =>
  buildImageModelSettings(activeModule.value, settings.value.length > 0 ? settings.value : fallbackSettings.value),
);

const availableSizes = computed(() =>
  modelSettings.value.sizes.length > 0 ? modelSettings.value.sizes : ["1024*1024"],
);

const availableQualities = computed(() =>
  modelSettings.value.supportedQuality?.length
    ? modelSettings.value.supportedQuality
    : ["standard", "high"],
);

const resultCards = computed<ResultCard[]>(() => {
  const total = Math.max(form.number || 1, taskDetail.value?.total || 0, taskDetail.value?.imageCount || 0, 1);
  const urls =
    taskDetail.value?.results?.map((item) => item.url || item.image).filter(Boolean) ||
    taskDetail.value?.output?.images ||
    [];
  const failed = taskDetail.value?.taskStatus === "FAILURE";
  return Array.from({ length: total }).map((_, index) => ({
    key: `${activeTaskId.value || "preview"}-${index}`,
    progress: urls[index] ? 100 : Math.min(taskDetail.value?.progress || 0, 99),
    url: urls[index] || undefined,
    failed: failed && !urls[index],
  }));
});

const loadModules = async () => {
  const res = await listAiModules("IMAGE");
  modules.value = (res.data || [])
    .filter((item) => item.sysAiModuleStatus === 1)
    .sort((left, right) => {
      const leftScore =
        (left.sysAiModuleSupportTemplate === 1 ? 4 : 0) +
        (left.sysAiModuleSupportStyle === 1 ? 2 : 0) +
        (left.sysAiModuleVendor && left.sysAiModuleVendor !== "stability" ? 1 : 0);
      const rightScore =
        (right.sysAiModuleSupportTemplate === 1 ? 4 : 0) +
        (right.sysAiModuleSupportStyle === 1 ? 2 : 0) +
        (right.sysAiModuleVendor && right.sysAiModuleVendor !== "stability" ? 1 : 0);
      if (leftScore !== rightScore) {
        return rightScore - leftScore;
      }
      return (left.sysAiModuleSort || 0) - (right.sysAiModuleSort || 0);
    });
  if (!form.sysAiModuleCode && modules.value.length > 0) {
    form.sysAiModuleCode = modules.value[0].sysAiModuleCode;
  }
};

const reloadHistory = async () => {
  const res = await listImageStudioHistory();
  history.value = res.data || [];
};

const loadModuleAssets = async () => {
  if (!activeModule.value?.sysAiModuleId) {
    templates.value = [];
    styles.value = [];
    settings.value = [];
    return;
  }
  const [templateRes, styleRes, settingRes] = await Promise.all([
    listImageStudioTemplates(activeModule.value.sysAiModuleId),
    listImageStudioStyles(activeModule.value.sysAiModuleId),
    listImageStudioSettings(activeModule.value.sysAiModuleId),
  ]);
  templates.value = templateRes.data || [];
  styles.value = styleRes.data || [];
  settings.value = settingRes.data || [];
  if (templates.value.length === 0) {
    templates.value = fallbackTemplates.value;
  }
  if (styles.value.length === 0) {
    styles.value = fallbackStyles.value;
  }
  if (settings.value.length === 0) {
    settings.value = fallbackSettings.value;
  }
};

const stopPolling = () => {
  if (pollingTimer.value) {
    clearInterval(pollingTimer.value);
    pollingTimer.value = undefined;
  }
};

const pollTask = async (taskId: number) => {
  const res = await getImageStudioTask(taskId);
  taskDetail.value = res.data;
  if (!taskDetail.value || taskDetail.value.taskStatus === "SUCCESS" || taskDetail.value.taskStatus === "FAILURE") {
    stopPolling();
    await reloadHistory();
  }
};

const startPolling = (taskId: number) => {
  stopPolling();
  pollingTimer.value = setInterval(() => {
    void pollTask(taskId);
  }, 2500);
};

const selectTask = async (task: ImageStudioTask) => {
  if (!task.sysAiTaskId) {
    return;
  }
  if (task.sysAiModuleCode) {
    form.sysAiModuleCode = task.sysAiModuleCode;
  }
  activeTaskId.value = task.sysAiTaskId;
  await pollTask(task.sysAiTaskId);
  if (taskDetail.value?.taskStatus === "PENDING") {
    startPolling(task.sysAiTaskId);
  }
};

const submitCurrentPrompt = async () => {
  const prompt = draft.value.trim();
  if (!prompt) {
    message("请输入提示词", { type: "warning" });
    return;
  }
  if (!form.sysAiModuleCode) {
    message("请先选择模型", { type: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const res = await createImageStudioTask({
      sysAiModuleCode: form.sysAiModuleCode,
      prompt,
      templateId: form.templateId,
      styleCode: form.styleCode,
      size: form.size,
      quality: form.quality,
      number: form.number,
    });
    const task = res.data;
    if (task?.sysAiTaskId) {
      activeTaskId.value = task.sysAiTaskId;
      taskDetail.value = {
        taskId: task.sysAiTaskId,
        taskStatus: task.sysAiTaskStatus || "PENDING",
        progress: task.sysAiTaskProgress || 0,
        total: form.number,
      };
      draft.value = "";
      editorRef.value?.clear?.();
      startPolling(task.sysAiTaskId);
      await reloadHistory();
      message("任务已创建", { type: "success" });
    }
  } finally {
    submitting.value = false;
  }
};

const handleSubmit = async (payload: SubmitResult) => {
  draft.value = payload.text || draft.value;
  await submitCurrentPrompt();
};

const openImageConfigDialog = () => {
  imageConfigDialogVisible.value = true;
};

const openPriceDialog = () => {
  priceDialogVisible.value = true;
};

watch(activeModule, async () => {
  await loadModuleAssets();
  form.size = availableSizes.value[0] || "1024*1024";
  form.number = Math.min(form.number, Math.max(1, modelSettings.value.maxNumber || 1));
  form.templateId = undefined;
  form.styleCode = undefined;
}, { immediate: true });

onMounted(async () => {
  const [templateRes, styleRes, settingRes] = await Promise.all([
    listImageStudioTemplates(3),
    listImageStudioStyles(3),
    listImageStudioSettings(3),
  ]);
  fallbackTemplates.value = templateRes.data || [];
  fallbackStyles.value = styleRes.data || [];
  fallbackSettings.value = settingRes.data || [];
  await Promise.all([loadModules(), reloadHistory()]);
  if (history.value[0]?.sysAiTaskId) {
    await selectTask(history.value[0]);
  }
});

onBeforeUnmount(() => {
  stopPolling();
});
</script>

<style scoped lang="scss">
.image-studio {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(34, 197, 94, 0.12), transparent 30%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #f6f3ed 0%, #edf1f7 100%);
}

.image-studio__shell {
  display: block;
  min-height: calc(100vh - 150px);
}

.image-studio__main {
  height: 100%;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 22px 40px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(16px);
}

.image-studio__header,
.image-studio__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.image-studio__panel-headline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.image-studio__panel-state {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-studio__header h1 {
  margin: 6px 0 0;
}

.image-studio__main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.image-studio__header p {
  margin: 8px 0 0;
  color: #64748b;
}

.image-studio__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.image-studio__content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.image-studio__result-panel {
  flex: 1;
  min-height: 320px;
  padding: 16px;
  border-radius: 24px;
  background: linear-gradient(180deg, #fbfdff 0%, #f5f8fc 100%);
  border: 1px solid rgba(148, 163, 184, 0.12);
}

.image-studio__history-strip {
  margin-top: 16px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
}

.image-studio__history-chip {
  min-width: 220px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.74);
  cursor: pointer;
  transition: 0.2s ease;
}

.image-studio__history-chip.active {
  border-color: rgba(59, 130, 246, 0.34);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.12);
}

.image-studio__history-chip-title {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.image-studio__result-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.image-studio__empty-state {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  text-align: center;
  color: #475569;

  strong {
    color: #0f172a;
    font-size: 18px;
  }

  p {
    max-width: 360px;
    margin: 0;
    line-height: 1.7;
  }
}

.image-studio__result-card {
  aspect-ratio: 1 / 1;
  border-radius: 22px;
  overflow: hidden;
  background: rgba(226, 232, 240, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.image-studio__result-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-studio__placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #1e3a8a;
  font-weight: 700;
}

.image-studio__placeholder small {
  max-width: 150px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.4;
}

.image-studio__liquid {
  width: 96px;
  height: 96px;
  border-radius: 999px;
  position: relative;
  overflow: hidden;
  background: rgba(191, 219, 254, 0.32);
  border: 1px solid rgba(96, 165, 250, 0.3);
}

.image-studio__liquid-fill {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(180deg, #60a5fa 0%, #2563eb 100%);
  transition: height 0.45s ease;
}

.image-studio__result-card.failed {
  border-color: rgba(239, 68, 68, 0.24);
  background: linear-gradient(180deg, rgba(254, 242, 242, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.image-studio__result-card.failed .image-studio__liquid {
  background: rgba(254, 202, 202, 0.32);
  border-color: rgba(248, 113, 113, 0.3);
}

.image-studio__result-card.failed .image-studio__liquid-fill {
  background: linear-gradient(180deg, #f97316 0%, #dc2626 100%);
}

.image-studio__composer {
  border-top: 1px solid rgba(15, 23, 42, 0.06);
  padding-top: 12px;
}

.image-studio__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.image-studio__model {
  min-width: 260px;
  flex: 1;
}

.image-studio__model-label,
.image-studio__model-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.image-studio__model-avatar {
  width: 24px;
  height: 24px;
  border-radius: 999px;
  flex-shrink: 0;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #e0ecff 0%, #dbeafe 100%);
  border: 1px solid rgba(96, 165, 250, 0.24);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 700;
}

.image-studio__model-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.image-studio__model-label-text,
.image-studio__model-option-name,
.image-studio__model-option-code {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-studio__model-option-copy {
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex: 1;
}

.image-studio__model-option-name {
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  flex: 1;
}

.image-studio__model-option-code {
  color: #6b7280;
  font-size: 11px;
  flex-shrink: 0;
}

:global(.ai-model-select-popper .el-select-dropdown__item) {
  height: auto;
  min-height: 52px;
  line-height: 1.4;
  display: flex;
  align-items: center;
}

.full-width {
  width: 100%;
}

.image-studio__price-sheet {
  display: grid;
  gap: 12px;
}

.image-studio__price-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.9);
}

@media (max-width: 1080px) {
  .image-studio__actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
