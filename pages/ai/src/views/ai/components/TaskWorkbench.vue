<template>
  <section class="workbench">
    <header class="page-header">
      <div>
        <p class="eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p class="subtitle">{{ description }}</p>
      </div>
      <ScButton type="primary" plain @click="router.push('/ai/settings')">
        模型设置
      </ScButton>
    </header>

    <div class="layout">
      <div class="panel form-panel">
        <label class="field">
          <span>模型</span>
          <select v-model="form.sysAiModuleCode">
            <option value="">请选择模型</option>
            <option
              v-for="item in modules"
              :key="item.sysAiModuleCode"
              :value="item.sysAiModuleCode"
            >
              {{ item.sysAiModuleName }}
            </option>
          </select>
        </label>

        <label class="field">
          <span>{{ primaryLabel }}</span>
          <textarea
            v-model="form.prompt"
            :placeholder="primaryPlaceholder"
            rows="5"
          />
        </label>

        <label class="field">
          <span>{{ secondaryLabel }}</span>
          <textarea
            v-model="form.sourceContent"
            :placeholder="secondaryPlaceholder"
            rows="4"
          />
        </label>

        <label class="field">
          <span>来源地址</span>
          <input
            v-model="form.sourceUrl"
            placeholder="可选：输入图片或素材地址"
            type="text"
          />
        </label>

        <div class="actions">
          <ScButton type="primary" :loading="submitting" @click="submit">
            提交任务
          </ScButton>
          <ScButton @click="reloadHistory">刷新历史</ScButton>
        </div>
      </div>

      <div class="panel result-panel">
        <div class="section-title">最近结果</div>
        <div v-if="latestTask" class="result-card">
          <div class="meta">
            <span>#{{ latestTask.sysAiTaskId }}</span>
            <span>{{ latestTask.sysAiTaskStatus }}</span>
          </div>
          <pre>{{ prettyResult(latestTask.sysAiTaskResult) }}</pre>
        </div>
        <div v-else class="empty">提交任务后这里会展示结果。</div>

        <div class="section-title">历史记录</div>
        <div class="history">
          <button
            v-for="item in history"
            :key="item.sysAiTaskId"
            class="history-item"
            type="button"
            @click="latestTask = item"
          >
            <strong>{{ item.sysAiTaskPrompt || title }}</strong>
            <span>{{ item.createTime || '刚刚' }}</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ScButton } from "@repo/components/ScButton";
import { message } from "@repo/utils";
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { listAiModules, type AiModule } from "../../../api/ai/module";
import {
  createAiTask,
  listAiTaskHistory,
  type AiTask,
  type AiTaskRequest,
  type AiTaskType,
} from "../../../api/ai/task";

const props = defineProps<{
  eyebrow: string;
  title: string;
  description: string;
  moduleType: string;
  taskType: AiTaskType;
  primaryLabel: string;
  primaryPlaceholder: string;
  secondaryLabel: string;
  secondaryPlaceholder: string;
}>();

const router = useRouter();
const modules = ref<AiModule[]>([]);
const history = ref<AiTask[]>([]);
const latestTask = ref<AiTask | null>(null);
const submitting = ref(false);

const form = reactive<AiTaskRequest>({
  sysAiModuleCode: "",
  prompt: "",
  sourceContent: "",
  sourceUrl: "",
});

const loadModules = async () => {
  const res = await listAiModules(props.moduleType);
  modules.value = res.data || [];
  if (!form.sysAiModuleCode && modules.value.length > 0) {
    form.sysAiModuleCode = modules.value[0].sysAiModuleCode;
  }
};

const reloadHistory = async () => {
  const res = await listAiTaskHistory(props.taskType);
  history.value = res.data || [];
  latestTask.value = history.value[0] || null;
};

const submit = async () => {
  if (!form.sysAiModuleCode) {
    message("请先选择模型", { type: "warning" });
    return;
  }
  submitting.value = true;
  try {
    const res = await createAiTask(props.taskType, form);
    latestTask.value = res.data;
    await reloadHistory();
    message("任务已提交", { type: "success" });
  } finally {
    submitting.value = false;
  }
};

const prettyResult = (value?: string) => {
  if (!value) return "";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

onMounted(async () => {
  await loadModules();
  await reloadHistory();
});
</script>

<style scoped lang="scss">
.workbench {
  padding: 28px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 24px;

  h1 {
    margin: 6px 0 10px;
    font-size: 34px;
    color: #0f172a;
  }
}

.eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.subtitle {
  margin: 0;
  color: #475569;
}

.layout {
  display: grid;
  grid-template-columns: minmax(320px, 420px) 1fr;
  gap: 20px;
}

.panel {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.95);
  padding: 24px;
  box-shadow: 0 16px 45px rgba(15, 23, 42, 0.08);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;

  span {
    font-weight: 600;
    color: #0f172a;
  }
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #dbe3f0;
  border-radius: 16px;
  padding: 14px 16px;
  background: #f8fafc;
  color: #0f172a;
}

.actions {
  display: flex;
  gap: 12px;
}

.section-title {
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 12px;
}

.result-card {
  border-radius: 18px;
  background: #0f172a;
  color: #e2e8f0;
  padding: 18px;
  margin-bottom: 20px;

  pre {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 12px;
    line-height: 1.6;
  }
}

.meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.history {
  display: grid;
  gap: 10px;
}

.history-item {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 14px 16px;
  border: 0;
  border-radius: 16px;
  background: #f8fafc;
  text-align: left;
  cursor: pointer;

  strong {
    color: #0f172a;
  }

  span {
    color: #64748b;
    font-size: 12px;
  }
}

.empty {
  color: #64748b;
  padding: 18px 0 24px;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
  }
}
</style>
