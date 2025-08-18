<template>
  <div class="trace-viewer">
    <div class="toolbar">
      <el-input
        v-model="classPattern"
        placeholder="类匹配（必填，如 com.demo.UserService）"
        style="min-width: 280px"
      />
      <el-input
        v-model="methodPattern"
        placeholder="方法匹配（可选，默认 *）"
        style="min-width: 200px"
      />
      <el-input
        v-model="condition"
        placeholder="条件表达式（可选，如 #cost>10）"
        style="min-width: 220px"
      />
      <el-checkbox v-model="useRegex">正则(-E)</el-checkbox>
      <el-input-number
        v-model="count"
        :min="1"
        :max="1000"
        :step="1"
        controls-position="right"
      />
      <span class="label">-n</span>
      <el-input-number
        v-model="expand"
        :min="0"
        :max="10"
        :step="1"
        controls-position="right"
      />
      <span class="label">-x</span>
      <el-button
        type="primary"
        :disabled="!nodeId || !classPatternTrim"
        @click="run"
        >执行</el-button
      >
      <el-button @click="sendStop" :disabled="!connected">停止</el-button>
      <el-button @click="clearOutput">清屏</el-button>
    </div>
    <pre class="output" ref="outRef"></pre>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  watch,
  onMounted,
  onBeforeUnmount,
  computed,
  defineProps,
} from "vue";
import { execArthasCommand } from "@/api/arthas-http";

const props = defineProps<{ nodeId: string }>();

// HTTP 模式不再需要 WS
const outRef = ref<HTMLElement | null>(null);
const connected = ref(false);
const connecting = ref(false);

const classPattern = ref("");
const methodPattern = ref("*");
const condition = ref("");
const useRegex = ref(false);
const count = ref(10);
const expand = ref(2);

const classPatternTrim = computed(() => classPattern.value.trim());

function append(text: string) {
  const el = outRef.value;
  if (!el) return;
  el.textContent += text;
  el.scrollTop = el.scrollHeight;
}

function clearOutput() {
  if (outRef.value) outRef.value.textContent = "";
}

function buildCmd(): string {
  const parts: string[] = ["trace"];
  if (useRegex.value) parts.push("-E");
  parts.push(classPatternTrim.value);
  parts.push((methodPattern.value || "*").trim() || "*");
  const cond = (condition.value || "").trim();
  if (cond) parts.push(`'${cond}'`);
  if (count.value && count.value > 0) parts.push("-n", String(count.value));
  if (expand.value && expand.value > 0) parts.push("-x", String(expand.value));
  return parts.join(" ") + "\n";
}

async function run() {
  if (!props.nodeId || !classPatternTrim.value) return;
  const cmd = buildCmd();
  try {
    const res = await execArthasCommand(props.nodeId, cmd.replace(/\n$/, ""));
    if (res?.success) {
      append(res.data?.output || "");
    } else {
      append(`\n[error] ${res?.msg || "执行失败"}\n`);
    }
  } catch (e: any) {
    append(`\n[error] ${e?.message || e}\n`);
  }
}

function sendStop() {
  // HTTP模式暂不支持中断。可改为另起调用，或忽略。
  append("\n[interrupt not supported in HTTP mode]\n");
}

watch(
  () => props.nodeId,
  (n, o) => {
    if (n && n !== o) {
      clearOutput();
    }
  }
);

onMounted(() => {
  if (props.nodeId) run();
});

onBeforeUnmount(() => {});
</script>

<style scoped>
.trace-viewer {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.label {
  color: var(--el-text-color-secondary);
  margin: 0 4px 0 0;
}
.output {
  flex: 1;
  overflow: auto;
  background: #0b0f19;
  color: #e6edf3;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
}
</style>
