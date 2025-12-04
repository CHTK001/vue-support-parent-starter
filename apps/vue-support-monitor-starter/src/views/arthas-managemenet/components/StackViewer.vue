<template>
  <div class="stack-viewer">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-row">
        <el-input v-model="classPattern" placeholder="类名/通配（如 com.example.UserService �?com.example.*Service�? style="min-width: 260px" clearable />
        <el-input v-model="methodPattern" placeholder="方法�?通配（默�?*�? style="width: 200px" clearable />
        <el-input v-model="condition" placeholder="条件表达式（可选，�?#cost>10�? style="min-width: 220px" clearable />
        <el-checkbox v-model="useRegex">正则(-E)</el-checkbox>
        <el-input-number v-model="count" :min="1" :max="200" :step="1" controls-position="right" style="width: 140px" />
        <span class="label">-n 次数</span>
        <el-input-number v-model="collectMillis" :min="1000" :max="60000" :step="1000" controls-position="right" style="width: 160px" />
        <span class="label">收集毫秒</span>
        <el-button type="primary" :disabled="!nodeId || !classPatternTrim" :loading="loading" @click="run"> 执行 </el-button>
        <el-button @click="clearData">清空</el-button>
      </div>
    </div>

    <!-- 错误提示 -->
    <el-alert v-if="error" type="error" :title="error" :closable="false" show-icon class="mb-4" />

    <!-- 结果列表 -->
    <div v-if="stacks.length > 0" class="stacks">
      <el-card v-for="(item, idx) in stacks" :key="idx" class="stack-card" shadow="hover">
        <div class="stack-header">
          <div class="stack-info">
            <span class="stack-method">{{ item.methodDisplay }}</span>
            <el-tag v-if="item.threadName" type="info" size="small">{{ item.threadName }}</el-tag>
            <el-tag v-if="item.timestamp" type="success" size="small">{{ formatTime(item.timestamp) }}</el-tag>
          </div>
          <el-tag :type="getUsageType(item.depth)" size="small">深度: {{ item.depth }}</el-tag>
        </div>

        <div class="stack-frames">
          <div v-for="(frame, i) in item.stackTrace" :key="i" class="stack-frame">
            <span class="class-name">{{ frame.className }}</span>
            <span class="method-name">.{{ frame.methodName }}</span>
            <span v-if="frame.fileName" class="file-info"> ({{ frame.fileName }}:{{ frame.lineNumber > 0 ? frame.lineNumber : "Native" }}) </span>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状�?-->
    <div v-if="!loading && !error && stacks.length === 0" class="empty-state">
      <el-empty description="暂无调用路径数据，请配置�?方法并点击执�? />
    </div>
  </div>
</template>

<script setup lang="ts">
import { execArthasCommand } from "@/api/arthas/arthas-http";
import { ref, computed } from "vue";

const props = defineProps<{ nodeId: string }>();

// 控件
const classPattern = ref("com.chua.starter.monitor.arthas.ArthasCommandController");
const classPatternTrim = computed(() => (classPattern.value || "").trim());
const methodPattern = ref("*");
const condition = ref("");
const useRegex = ref(false);
const count = ref(10);
const collectMillis = ref(5000);

// 状�?
const loading = ref(false);
const error = ref("");

// 结果
interface StackFrame {
  className: string;
  methodName: string;
  fileName?: string;
  lineNumber?: number;
}
interface StackItem {
  methodDisplay: string;
  threadName?: string;
  timestamp?: number;
  depth: number;
  stackTrace: StackFrame[];
}
const stacks = ref<StackItem[]>([]);

function clearData() {
  stacks.value = [];
  error.value = "";
}

function buildCmd(): string {
  const parts: string[] = ["stack"];
  if (useRegex.value) parts.push("-E");
  parts.push(classPatternTrim.value);
  parts.push((methodPattern.value || "*").trim() || "*");
  const cond = (condition.value || "").trim();
  if (cond) parts.push(`'${cond}'`);
  if (count.value && count.value > 0) parts.push("-n", String(count.value));
  return parts.join(" ");
}

function parseStackData(output: any): StackItem[] {
  try {
    if (!output?.body?.results) return [];
    const results = output.body.results;
    const stackResults = results.filter((r: any) => r.type === "stack");
    const items: StackItem[] = [];

    for (const r of stackResults) {
      // 兼容字段命名：stackTrace / stacktrace / trace
      const trace: any[] = r.stackTrace || r.stacktrace || r.trace || [];
      if (!Array.isArray(trace) || trace.length === 0) continue;

      const frames: StackFrame[] = trace.map((f: any) => ({
        className: f.className || f.declaringClass || "",
        methodName: f.methodName || f.name || "",
        fileName: f.fileName,
        lineNumber: f.lineNumber,
      }));

      const item: StackItem = {
        methodDisplay: `${frames[0]?.className || ""}.${frames[0]?.methodName || ""}`,
        threadName: r.threadName || r.thread || undefined,
        timestamp: Date.now(),
        depth: frames.length,
        stackTrace: frames,
      };
      items.push(item);
    }
    return items;
  } catch (e) {
    console.error("解析stack数据失败", e);
    return [];
  }
}

async function run() {
  if (!props.nodeId || !classPatternTrim.value) return;
  loading.value = true;
  error.value = "";
  try {
    const cmd = buildCmd();
    const res = await execArthasCommand(props.nodeId, cmd, collectMillis.value);
    if (res?.success) {
      const items = parseStackData(res.data?.output);
      stacks.value = items;
      if (items.length === 0) {
        error.value = "未获取到调用路径数据：请确认�?方法匹配且目标方法在收集期间被调�?;
      }
    } else {
      error.value = res?.msg || "执行失败";
    }
  } catch (e: any) {
    error.value = e?.message || "执行异常";
  } finally {
    loading.value = false;
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

function getUsageType(depth: number): "success" | "warning" | "danger" {
  if (depth >= 50) return "danger";
  if (depth >= 20) return "warning";
  return "success";
}
</script>

<style scoped>
.stack-viewer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.control-panel {
  background: var(--el-bg-color-overlay);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.label {
  color: var(--el-text-color-primary);
  font-size: 12px;
}
.mb-4 {
  margin-bottom: 16px;
}
.stacks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 12px;
}
.stack-card {
  min-height: 120px;
}
.stack-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.stack-info {
  display: flex;
  align-items: center;
  gap: 8px;
}
.stack-method {
  font-weight: 600;
}
.stack-frames {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 12px;
  line-height: 1.6;
}
.stack-frame {
  color: var(--el-text-color-primary);
}
.class-name {
  color: #0366d6;
}
.method-name {
  color: #e06c75;
}
.file-info {
  color: var(--el-text-color-primary);
  margin-left: 4px;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
