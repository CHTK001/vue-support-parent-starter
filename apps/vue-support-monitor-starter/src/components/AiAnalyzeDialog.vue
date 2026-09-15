<template>
  <ReDialog
    v-model="visible"
    :title="title"
    :width="width"
  >
    <!-- 分析中 -->
    <div v-if="loading" class="ai-dialog-state">
      <el-icon class="is-loading ai-dialog-spin"><Loading /></el-icon>
      <span>AI 正在分析，请稍候...</span>
    </div>

    <!-- AI 未启用 / 失败 -->
    <div v-else-if="error" class="ai-dialog-state is-error">
      <template v-if="isDisabled">
        <div class="ai-dialog-state-title">AI 分析未启用</div>
        <p class="ai-dialog-state-desc">
          当前环境未配置 AI 模型，无法进行智能分析。请在「系统配置」中完成 AI 模型接入后再试。
        </p>
      </template>
      <template v-else>
        <div class="ai-dialog-state-title">分析失败</div>
        <p class="ai-dialog-state-desc">{{ error }}</p>
      </template>
    </div>

    <!-- 结果 -->
    <div v-else class="ai-dialog-result">
      <pre class="ai-dialog-content">{{ result }}</pre>
      <div v-if="model" class="ai-dialog-model">模型：{{ model }}</div>
    </div>

    <template #footer>
      <ReButton @click="visible = false">关闭</ReButton>
      <ReButton type="primary" :loading="loading" :disabled="!canRetry()" @click="run">
        重新分析
      </ReButton>
    </template>
  </ReDialog>
</template>

<script setup lang="ts">
/**
 * 通用 AI 分析弹窗
 *
 * 用法：
 *   <AiAnalyzeDialog v-model="aiVisible" title="AI 分析告警" :prompt="alarmPrompt" />
 *
 * - 打开弹窗即自动触发一次分析（autoOpen 默认为 true）
 * - 内部统一处理：loading / 错误 / AI 未启用友好提示 / 结果展示 / 重新分析
 * - 全部使用 CSS 主题变量，浅色 / 深色自适应
 */
import { ref, watch } from "vue";
import { Loading } from "@element-plus/icons-vue";
import { aiAnalyze, type AiAnalyzeResult } from "../monitorApi";

const props = withDefaults(
  defineProps<{
    /** 弹窗标题 */
    title?: string;
    /** 分析提示词（打开时读取，建议传 computed） */
    prompt: string;
    /** 系统提示词（可选，约束 AI 角色 / 输出格式） */
    systemPrompt?: string;
    /** 打开后是否自动分析，默认 true */
    autoOpen?: boolean;
    /** 弹窗宽度 */
    width?: string;
  }>(),
  {
    title: "AI 智能分析",
    systemPrompt: "",
    autoOpen: true,
    width: "720px",
  },
);

const visible = defineModel<boolean>({ required: true });

const loading = ref(false);
const error = ref("");
const result = ref("");
const model = ref("");
const isDisabled = ref(false);

/** 是否允许重新分析（未启用时禁止，避免无意义重试） */
const canRetry = () => !isDisabled.value;

/** 调用通用 AI 分析接口 */
async function run(): Promise<void> {
  if (loading.value) return;
  if (!props.prompt || !props.prompt.trim()) {
    error.value = "分析内容为空，无法发起 AI 分析。";
    isDisabled.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  isDisabled.value = false;
  try {
    const res: AiAnalyzeResult = await aiAnalyze(props.prompt, {
      systemPrompt: props.systemPrompt || undefined,
    });
    result.value = res?.content ?? "";
    model.value = res?.model ?? "";
  } catch (e: unknown) {
    const msg = (e as { message?: string } & { response?: { data?: { message?: string } } })?.message || "未知错误";
    const raw = String(msg);
    // 后端在未启用 AI 时会返回「未启用 / 未配置」类提示，统一转为友好空态
    if (/未启用|未配置|未接入|未开启|disabled|not.*enabled/i.test(raw)) {
      isDisabled.value = true;
      error.value = raw;
    } else {
      error.value = raw;
    }
  } finally {
    loading.value = false;
  }
}

// 打开时自动分析
watch(visible, (open) => {
  if (open && props.autoOpen) {
    result.value = "";
    model.value = "";
    run();
  }
});
</script>

<style scoped lang="scss">
.ai-dialog-state {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 28px 8px;
  font-size: 13px;
  color: var(--text-secondary);

  .ai-dialog-spin {
    font-size: 18px;
    color: var(--brand-500);
  }
}

.ai-dialog-state.is-error {
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 20px 8px;
}

.ai-dialog-state-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.ai-dialog-state.is-error .ai-dialog-state-title {
  color: var(--status-error-text, var(--text-primary));
}

.ai-dialog-state-desc {
  margin: 0;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--text-tertiary);
}

.ai-dialog-result {
  .ai-dialog-content {
    margin: 0;
    padding: 12px 14px;
    max-height: 480px;
    overflow: auto;
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12.5px;
    line-height: 1.7;
    white-space: pre-wrap;
    word-break: break-word;
    background: var(--bg-fill);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-md, 8px);
    color: var(--text-primary);
  }

  .ai-dialog-model {
    margin-top: 8px;
    font-size: 11px;
    color: var(--text-tertiary);
    text-align: right;
  }
}
</style>
