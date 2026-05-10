<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    title="Docker 命令执行"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <template #header>
      <div class="dt-header">
        <span class="dt-header__title">Docker 命令执行</span>
        <span v-if="binding" class="dt-header__subtitle">{{ binding.softwareName }}</span>
      </div>
    </template>

    <div class="dt-body">
      <div class="dt-input-row">
        <ElInput
          v-model="commandText"
          placeholder="输入命令，如 ls -la /"
          size="large"
          clearable
          @keyup.enter="executeCommand"
        />
        <ElButton type="primary" size="large" @click="executeCommand" :loading="executing">
          <IconifyIconOnline icon="ep:play" style="margin-right: 4px" />
          执行
        </ElButton>
      </div>

      <div class="dt-output" ref="outputRef">
        <div v-if="commandHistory.length === 0 && !executing && !error" class="dt-empty">
          <IconifyIconOnline icon="ep:terminal" style="font-size: 32px; color: var(--el-text-color-placeholder)" />
          <span>输入命令并点击「执行」</span>
        </div>

        <div v-if="error" class="dt-error">
          <IconifyIconOnline icon="ep:warning-filled" style="color: var(--el-color-danger)" />
          <span>{{ error }}</span>
        </div>

        <div v-for="(item, i) in commandHistory" :key="i" class="dt-output-block">
          <div class="dt-cmd-line">
            <span class="dt-prompt">$</span>
            <span class="dt-cmd-text">{{ item.command }}</span>
          </div>
          <pre class="dt-out-text" :class="{ 'dt-exit-error': item.exitCode !== 0 }">{{ item.output || '(无输出)' }}</pre>
          <div v-if="item.exitCode !== undefined" class="dt-exit-code" :class="item.exitCode === 0 ? 'is-success' : 'is-error'">
            退出码: {{ item.exitCode }}
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dt-footer">
        <ElButton size="small" @click="clearHistory" :disabled="commandHistory.length === 0">
          <IconifyIconOnline icon="ep:delete" style="margin-right: 4px" />
          清空历史
        </ElButton>
        <ElButton @click="$emit('update:visible', false)">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, nextTick } from "vue";
import { ElButton, ElDialog, ElInput, ElMessage } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { dockerExec } from "../../api/software";
import type { SoftwareBinding } from "../../api/software";

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
  containerId?: string;
  containerName?: string;
}>();

defineEmits<{
  "update:visible": [val: boolean];
}>();

// ─── State ──────────────────────────────────────────────

const commandText = ref("");
const executing = ref(false);
const error = ref<string | null>(null);
const outputRef = ref<HTMLElement | null>(null);

interface CommandEntry {
  command: string;
  output: string;
  exitCode: number;
}

const commandHistory = ref<CommandEntry[]>([]);

// ─── Execute ────────────────────────────────────────────

const executeCommand = async () => {
  const cmd = commandText.value.trim();
  if (!cmd) return;

  const bindingId = props.binding?.sysProjectContainerSoftwareBindingId;
  if (!bindingId) {
    ElMessage.warning("无法获取绑定信息");
    return;
  }

  executing.value = true;
  error.value = null;

  try {
    const res = await dockerExec(bindingId, cmd);
    if (res.code === "00000" && res.data) {
      commandHistory.value.push({
        command: cmd,
        output: res.data.output || "(无输出)",
        exitCode: res.data.exitCode,
      });
      commandText.value = "";
    } else {
      commandHistory.value.push({
        command: cmd,
        output: res.msg || "命令执行失败",
        exitCode: -1,
      });
    }
  } catch (err: any) {
    error.value = err?.message || "请求异常";
  } finally {
    executing.value = false;
    nextTick(() => {
      if (outputRef.value) {
        outputRef.value.scrollTop = outputRef.value.scrollHeight;
      }
    });
  }
};

const clearHistory = () => {
  commandHistory.value = [];
  error.value = null;
};

const handleClose = () => {
  // no cleanup needed
};
</script>

<style scoped>
.dt-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.dt-header__title {
  font-size: 15px;
  font-weight: 600;
}
.dt-header__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.dt-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dt-input-row {
  display: flex;
  gap: 8px;
}
.dt-input-row .el-input {
  flex: 1;
}

.dt-output {
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 8px;
  padding: 12px 16px;
  font-family: "Cascadia Code", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  max-height: 420px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.dt-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 48px 0;
  color: var(--el-text-color-placeholder);
}

.dt-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  color: #fca5a5;
}

.dt-output-block {
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 12px;
}
.dt-output-block:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.dt-cmd-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
}
.dt-prompt {
  color: #a6e3a1;
  font-weight: 700;
  font-size: 13px;
}
.dt-cmd-text {
  color: #89b4fa;
}

.dt-out-text {
  margin: 0;
  padding: 6px 0 4px 14px;
  white-space: pre-wrap;
  word-break: break-all;
  color: #cdd6f4;
}
.dt-exit-error {
  color: #fca5a5;
}

.dt-exit-code {
  font-size: 11px;
  padding-left: 14px;
  margin-top: 2px;
}
.dt-exit-code.is-success {
  color: #a6e3a1;
}
.dt-exit-code.is-error {
  color: #fca5a5;
}

.dt-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}
.dt-footer > .el-button:first-child {
  margin-right: auto;
}
</style>
