<template>
  <section class="task-studio">
    <div class="task-studio__hero">
      <Welcome
        :icon="icon"
        :title="title"
        :description="description"
        variant="filled"
      />
      <Prompts
        :items="promptItems"
        title="快捷模板"
        wrap
        @itemClick="handlePromptClick"
      />
    </div>

    <div class="task-studio__grid">
      <el-card class="task-studio__side" shadow="never">
        <template #header>
          <div class="task-studio__panel-title">任务参数</div>
        </template>

        <el-form label-position="top" class="task-studio__form">
          <el-form-item label="模型">
            <el-select v-model="form.sysAiModuleCode" placeholder="选择模型" size="large">
              <el-option
                v-for="item in modules"
                :key="item.sysAiModuleCode"
                :label="item.sysAiModuleName"
                :value="item.sysAiModuleCode"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="来源地址">
            <el-input v-model="form.sourceUrl" placeholder="输入图片或素材地址" />
          </el-form-item>

          <el-form-item label="补充说明">
            <el-input
              v-model="form.sourceContent"
              type="textarea"
              :rows="4"
              placeholder="补充任务条件、约束或素材说明"
            />
          </el-form-item>

          <el-form-item v-if="taskType === 'IMAGE' || taskType === 'VIDEO'" label="负向提示词">
            <el-input
              v-model="form.negativePrompt"
              type="textarea"
              :rows="3"
              placeholder="描述不希望出现的内容"
            />
          </el-form-item>
        </el-form>
      </el-card>

      <el-card class="task-studio__main" shadow="never">
        <template #header>
          <div class="task-studio__main-header">
            <div>
              <div class="task-studio__panel-title">任务轨迹</div>
              <small>使用 BubbleList 呈现提交参数、结果和历史回放。</small>
            </div>
            <el-button text @click="reloadHistory">刷新历史</el-button>
          </div>
        </template>

        <BubbleList
          :list="bubbleItems"
          auto-scroll
          max-height="calc(100vh - 360px)"
        />

        <div class="task-studio__editor">
          <EditorSender
            ref="editorRef"
            v-model="draft"
            :loading="submitting"
            :max-length="2000"
            clearable
            auto-focus
            placeholder="输入任务提示词，按 Enter 提交"
            variant="updown"
            @submit="handleSubmit"
          />
        </div>
      </el-card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import {
  BubbleList,
  EditorSender,
  Prompts,
  Welcome,
  type PromptsItemsProps,
  type SubmitResult,
} from "vue-element-plus-x";
import {
  ElButton,
  ElCard,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElSelect,
} from "element-plus";
import { message } from "@repo/utils";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import {
  createAiTask,
  listAiTaskHistory,
  type AiTask,
  type AiTaskRequest,
  type AiTaskType,
} from "../../../api/ai/task";

type BubbleItem = {
  content: string;
  placement: "start" | "end";
  isMarkdown?: boolean;
  variant?: "filled" | "borderless" | "outlined" | "shadow";
  shape?: "round" | "corner";
  avatar?: string;
};

const props = defineProps<{
  title: string;
  description: string;
  icon: string;
  moduleType: string;
  taskType: AiTaskType;
  promptItems: PromptsItemsProps[];
}>();

const editorRef = ref();
const modules = ref<AiModule[]>([]);
const history = ref<AiTask[]>([]);
const draft = ref("");
const submitting = ref(false);

const form = reactive<AiTaskRequest>({
  sysAiModuleCode: "",
  prompt: "",
  sourceUrl: "",
  sourceContent: "",
  negativePrompt: "",
});

const bubbleItems = computed<BubbleItem[]>(() =>
  history.value.flatMap((item) => {
    const requestSummary = [
      `### ${props.title}`,
      `- 模型: ${item.sysAiModuleCode || "-"}`,
      `- 状态: ${item.sysAiTaskStatus || "-"}`,
      item.sysAiTaskPrompt ? `- 提示词: ${item.sysAiTaskPrompt}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const resultBody = item.sysAiTaskResult
      ? `\`\`\`json\n${safePretty(item.sysAiTaskResult)}\n\`\`\``
      : "暂无结果";

    return [
      {
        content: requestSummary,
        placement: "end" as const,
        isMarkdown: true,
        variant: "filled" as const,
        shape: "round" as const,
        avatar: "任务",
      },
      {
        content: resultBody,
        placement: "start" as const,
        isMarkdown: true,
        variant: "outlined" as const,
        shape: "round" as const,
        avatar: "结果",
      },
    ];
  }),
);

const loadModules = async () => {
  const res = await listAiModules(props.moduleType);
  modules.value = res.data || [];
  if (!form.sysAiModuleCode && modules.value.length > 0) {
    form.sysAiModuleCode = modules.value[0].sysAiModuleCode;
  }
};

const reloadHistory = async () => {
  const res = await listAiTaskHistory(props.taskType);
  history.value = (res.data || []).slice(0, 10);
};

const handlePromptClick = (item: PromptsItemsProps) => {
  draft.value = item.description || item.label || "";
  if (editorRef.value?.setText) {
    editorRef.value.clear();
    editorRef.value.setText(draft.value);
  }
};

const handleSubmit = async (payload: SubmitResult) => {
  const prompt = payload.text?.trim();
  if (!prompt) {
    return;
  }
  if (!form.sysAiModuleCode) {
    message("请先选择模型", { type: "warning" });
    return;
  }
  submitting.value = true;
  try {
    form.prompt = prompt;
    const res = await createAiTask(props.taskType, form);
    if (res.data) {
      history.value = [res.data, ...history.value].slice(0, 10);
    }
    draft.value = "";
    if (editorRef.value?.clear) {
      editorRef.value.clear();
    }
    message("任务已提交", { type: "success" });
  } finally {
    submitting.value = false;
  }
};

const safePretty = (value: string) => {
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

onMounted(async () => {
  await Promise.all([loadModules(), reloadHistory()]);
});
</script>

<style scoped lang="scss">
.task-studio {
  min-height: 100%;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 28%),
    linear-gradient(180deg, #f6f3ed 0%, #edf0f5 100%);
}

.task-studio__hero {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.task-studio__grid {
  display: grid;
  grid-template-columns: 340px 1fr;
  gap: 18px;
}

.task-studio__side,
.task-studio__main {
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.06);
  backdrop-filter: blur(12px);
}

.task-studio__panel-title {
  font-size: 16px;
  font-weight: 700;
  color: #111827;
}

.task-studio__form {
  display: grid;
  gap: 6px;
}

.task-studio__main-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;

  small {
    color: #6b7280;
  }
}

.task-studio__editor {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid rgba(15, 23, 42, 0.06);
}

@media (max-width: 1080px) {
  .task-studio__grid {
    grid-template-columns: 1fr;
  }
}
</style>
