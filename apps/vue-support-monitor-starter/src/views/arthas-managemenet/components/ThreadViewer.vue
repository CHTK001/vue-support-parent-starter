<template>
  <div class="thread-viewer">
    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="可选：按关键字过滤输出"
        clearable
        style="max-width: 260px"
      />
      <el-select v-model="count" style="width: 160px">
        <el-option :value="10" label="最近10条" />
        <el-option :value="20" label="最近20条" />
        <el-option :value="50" label="最近50条" />
      </el-select>
      <el-checkbox v-model="blocking">仅阻塞</el-checkbox>
      <el-input
        v-model="threadId"
        placeholder="线程ID（优先）"
        style="max-width: 160px"
      />
      <el-button @click="clearOutput">清屏</el-button>
      <el-button type="primary" :disabled="!nodeId" @click="run"
        >刷新</el-button
      >
    </div>
    <pre class="output" ref="outRef"></pre>
  </div>
</template>

<script setup lang="ts">
import { execArthasCommand } from "@/api/arthas-http";
import { ref, watch, onMounted, onBeforeUnmount, defineProps } from "vue";

const props = defineProps<{ nodeId: string }>();

// HTTP 模式不再需要 WS
const outRef = ref<HTMLElement | null>(null);
const keyword = ref("");
const count = ref(20);
const blocking = ref(false);
const threadId = ref<string | number | "">("");

function append(text: string) {
  const el = outRef.value;
  if (!el) return;
  if (keyword.value) {
    const lines = text.split(/\r?\n/).filter((l) => l.includes(keyword.value));
    el.textContent += lines.join("\n") + "\n";
  } else {
    el.textContent += text;
  }
  el.scrollTop = el.scrollHeight;
}

function clearOutput() {
  if (outRef.value) outRef.value.textContent = "";
}

function buildCmd(): string {
  const id = String(threadId.value || "").trim();
  if (id) return `thread -i ${id}\n`;
  if (blocking.value) return `thread -b\n`;
  return `thread -n ${count.value}\n`;
}

async function run() {
  if (!props.nodeId) return;
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
.thread-viewer {
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
