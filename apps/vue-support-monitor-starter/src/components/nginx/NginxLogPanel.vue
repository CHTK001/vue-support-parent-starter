<template>
  <div class="ngl">
    <div class="ngl-bar">
      <ReSelect
        :model-value="currentPath"
        size="small"
        filterable
        style="width: 320px"
        placeholder="选择日志文件"
        @change="onPickFile"
      >
        <ReOption
          v-for="f in files"
          :key="f.path"
          :value="f.path"
          :label="`${f.type === 'error' ? '[错误]' : f.type === 'access' ? '[访问]' : '[其它]'} ${shortName(f.path)}  ${formatSize(f.size)}`"
        />
      </ReSelect>

      <ReInput
        :model-value="keyword"
        size="small"
        style="width: 180px"
        placeholder="关键字过滤（本地过滤）"
        @update:model-value="onKeyword"
      />

      <ReSwitch :model-value="auto" size="small" @change="onToggleAuto" />
      <span class="ngl-label">自动刷新</span>

      <ReSelect :model-value="String(intervalMs)" size="small" style="width: 110px" @change="onPickInterval">
        <ReOption value="3000" label="3 秒" />
        <ReOption value="5000" label="5 秒" />
        <ReOption value="10000" label="10 秒" />
        <ReOption value="30000" label="30 秒" />
      </ReSelect>

      <ReSwitch v-model="wrap" size="small" />
      <span class="ngl-label">自动换行</span>

      <div class="ngl-status">
        <span v-if="loading" class="ngl-state">读取中…</span>
        <span v-else-if="paused" class="ngl-state is-warn">已暂停（出错退避中）</span>
        <span v-else-if="auto" class="ngl-state is-ok">每 {{ Math.round(intervalMs / 1000) }} 秒刷新</span>
        <span v-else class="ngl-state">已停止</span>
        <span class="ngl-count">{{ lineCount }} 行 / {{ formatSize(byteSize) }}</span>
        <ReButton size="small" text :loading="loading" @click="refresh(true)">
          <template #icon><ReIcon name="Refresh" :size="12" /></template>
          立即刷新
        </ReButton>
        <ReButton size="small" text @click="clear">
          <template #icon><ReIcon name="Delete" :size="12" /></template>
          清屏
        </ReButton>
      </div>
    </div>

    <ReAlert v-if="logFilesError" type="warning" :title="logFilesError" class="ngl-alert" />

    <div class="ngl-body" ref="bodyRef">
      <pre v-if="!displayLines.length" class="ngl-empty">暂无日志。确认路径正确、nginx 有写权限，或点「立即刷新」重试。</pre>
      <pre v-else class="ngl-log" :class="{ nowrap: !wrap }"><span
        v-for="(line, i) in displayLines"
        :key="i"
        class="ngl-line"
        :class="lineClass(line)"
      >{{ line }}
</span></pre>
    </div>

    <!-- 轮转提示：日志被截断时必须告诉用户，否则两段内容会看起来连续 -->
    <div v-if="rotated" class="ngl-rotated">
      <ReIcon name="Warning" :size="13" />
      日志已被轮转或截断，上方内容来自新文件，历史内容已清空
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { fetchNginxLogChunk, fetchNginxLogFiles, type NginxLogFile } from "../../nginx/api";

const props = defineProps<{
  /** 数据源 ID */
  datasourceId?: number;
}>();

/** 本地最多保留的行数，防止长时间挂着把浏览器内存吃满 */
const MAX_LINES = 5000;

/** 连续失败多少次后进入退避 */
const MAX_FAILURES = 3;

const files = ref<NginxLogFile[]>([]);
const logFilesError = ref("");
const currentPath = ref("");
const lines = ref<string[]>([]);
const cursor = ref<number | null>(null);
const byteSize = ref<number | null>(null);
const rotated = ref(false);
const keyword = ref("");
const wrap = ref(true);
const auto = ref(false);
const intervalMs = ref(5000);
const loading = ref(false);
const paused = ref(false);
const bodyRef = ref<HTMLElement | null>(null);

let timer: ReturnType<typeof setTimeout> | null = null;
let failures = 0;

/** 过滤后的展示行 */
const displayLines = computed(() => {
  const k = keyword.value.trim();
  if (!k) {
    return lines.value;
  }
  return lines.value.filter(l => l.includes(k));
});

const lineCount = computed(() => lines.value.length);

async function loadFiles() {
  if (!props.datasourceId) {
    return;
  }
  try {
    files.value = (await fetchNginxLogFiles(props.datasourceId)) || [];
    logFilesError.value = "";
    if (!currentPath.value && files.value.length) {
      // 默认打开错误日志：出问题时它才是第一手证据
      const err = files.value.find(f => f.type === "error");
      await onPickFile((err || files.value[0]).path);
    }
  } catch (e) {
    logFilesError.value = `读取日志文件列表失败：${(e as Error).message}。可在上方手动输入路径。`;
  }
}

async function onKeyword(val: unknown) {
  keyword.value = val === null || val === undefined ? "" : String(val);
}

async function onPickFile(path: string) {
  currentPath.value = path;
  lines.value = [];
  cursor.value = null;
  rotated.value = false;
  await refresh(true);
}

function onPickInterval(v: string | number) {
  intervalMs.value = Number(v);
  if (auto.value) {
    schedule();
  }
}

function onToggleAuto(on: boolean) {
  auto.value = on;
  paused.value = false;
  failures = 0;
  if (on) {
    schedule();
  } else {
    stopTimer();
  }
}

/** 立即刷新一次全量 */
async function refresh(reset = false) {
  if (!props.datasourceId || !currentPath.value) {
    return;
  }
  if (reset) {
    cursor.value = null;
  }
  loading.value = true;
  try {
    const chunk = await fetchNginxLogChunk(
      props.datasourceId,
      currentPath.value,
      200,
      reset ? null : cursor.value,
    );
    const incoming = (chunk.content || "").split("\n");
    if (incoming.length && incoming[incoming.length - 1] === "") {
      incoming.pop();
    }
    if (chunk.rotated) {
      // 轮转：丢掉旧内容，只留新文件的内容
      rotated.value = true;
      lines.value = incoming;
      setTimeout(() => (rotated.value = false), 8000);
    } else {
      lines.value = [...lines.value, ...incoming].slice(-MAX_LINES);
    }
    cursor.value = chunk.cursor ?? null;
    byteSize.value = chunk.size ?? null;
    failures = 0;
    paused.value = false;
    scrollToBottom();
  } catch (e) {
    failures++;
    if (failures >= MAX_FAILURES) {
      // 连续失败就退避：与其每 5 秒撞一次墙，不如停下来并在界面上说明
      paused.value = true;
      auto.value = false;
      stopTimer();
      ElMessage.warning(`日志刷新连续失败 ${failures} 次，已暂停自动刷新：${(e as Error).message}`);
    }
  } finally {
    loading.value = false;
  }
}

/** 用 setTimeout 链而不是 setInterval：请求耗时会自动顺延，不会堆积 */
function schedule() {
  stopTimer();
  if (!auto.value) {
    return;
  }
  timer = setTimeout(async () => {
    await refresh();
    schedule();
  }, intervalMs.value);
}

function stopTimer() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
}

function clear() {
  lines.value = [];
  cursor.value = null;
}

function scrollToBottom() {
  const el = bodyRef.value;
  if (el) {
    el.scrollTop = el.scrollHeight;
  }
}

/** 错误日志按级别上色，访问日志标出异常状态码 */
function lineClass(line: string): string {
  if (line.includes("[error]") || line.includes("[emerg]") || line.includes("[alert]")) {
    return "is-error";
  }
  if (line.includes("[warn]")) {
    return "is-warn";
  }
  if (line.includes("[crit]")) {
    return "is-crit";
  }
  const m = line.match(/" (\d{3}) /);
  if (m) {
    const code = Number(m[1]);
    if (code >= 500) {
      return "is-5xx";
    }
    if (code >= 400) {
      return "is-4xx";
    }
  }
  return "";
}

function shortName(p: string): string {
  return p.split("/").pop() || p;
}

function formatSize(bytes: number | null | undefined): string {
  if (!bytes) {
    return "—";
  }
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)}${units[i]}`;
}

watch(
  () => props.datasourceId,
  async id => {
    stopTimer();
    auto.value = false;
    lines.value = [];
    files.value = [];
    currentPath.value = "";
    cursor.value = null;
    if (id) {
      await loadFiles();
    }
  },
  { immediate: true },
);

onBeforeUnmount(stopTimer);

defineExpose({ refresh, clear, stopTimer, loadFiles });
</script>

<style scoped lang="scss">
.ngl {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}

.ngl-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ngl-label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ngl-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-left: auto;
}

.ngl-state {
  font-size: 12px;
  color: var(--el-text-color-secondary);

  &.is-ok {
    color: var(--el-color-success);
  }

  &.is-warn {
    color: var(--el-color-warning);
  }
}

.ngl-count {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
}

.ngl-alert {
  margin: 0;
}

.ngl-body {
  flex: 1;
  min-height: 260px;
  overflow: auto;
  border-radius: var(--el-border-radius-lg, 12px);
  background: var(--el-fill-color-blank, #1e1e1e);
  border: 1px solid var(--el-border-color-lighter);
}

.ngl-empty {
  margin: 0;
  padding: 24px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.ngl-log {
  margin: 0;
  padding: 10px 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;

  &.nowrap .ngl-line {
    white-space: pre;
  }
}

.ngl-line {
  display: block;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--el-text-color-primary);

  &.is-warn {
    color: var(--el-color-warning);
  }

  &.is-error,
  &.is-5xx {
    color: var(--el-color-danger);
  }

  &.is-crit {
    color: var(--el-color-danger);
    font-weight: 700;
    background: color-mix(in srgb, var(--el-color-danger) 12%, transparent);
  }

  &.is-4xx {
    color: var(--el-color-warning);
  }
}

.ngl-rotated {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-color-warning);
}
</style>
