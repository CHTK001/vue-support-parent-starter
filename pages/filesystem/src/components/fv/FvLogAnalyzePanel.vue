<!--
  FvLogAnalyzePanel.vue — hs_err_pid*.log（JVM 崩溃日志）运维分析面板。

  双模式（类似 html 预览的「渲染 / 源码」切换）：
    1) 分析结论（默认）：把 hs_err 解析成运维要看的结论卡片 —— 崩溃类型/信号、
       JRE/JVM 版本、问题帧、故障线程栈、堆摘要、启动参数、系统环境 + 处置建议；
    2) 原始日志：完整原文源码视图（可下载），供核对与复现。

  非 hs_err 的普通 .log 退化为文本渲染（textRenderer），保持原有预览体验。
-->
<script setup lang="ts">
import { onBeforeUnmount, ref, shallowRef, watch } from "vue";
import { authHeaders, objectUrl } from "../../api/filestorageApi";
import { extensionOf } from "../../utils/officeRenderer";
import { parseJvmCrashLog, type JvmCrashReport } from "../../utils/jvmCrashLog";
import FvPanelBase from "./FvPanelBase.vue";

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（传 inner 时是压缩包自身的 Key） */
  objectKey: string;
  /** 文件名 */
  fileName: string;
  /** 直链地址（可选；给了直接用，不走票据签发） */
  src?: string;
  /** 压缩包内条目路径（可选） */
  inner?: string;
  /** 对象大小（可选） */
  size?: number;
}>();

const emit = defineEmits<{
  /** 加载/解析失败，请求父组件兜底 */
  fallback: [];
  /** 错误明细 */
  error: [msg: string];
  /** 渲染完成 */
  rendered: [];
}>();

void props.size;

const loading = ref(true);
const failReason = ref("");
const isLog = ref(false);
const isHsErr = ref(false);
const view = ref<"analysis" | "raw">("analysis");
const report = ref<JvmCrashReport | null>(null);
const rawText = ref("");
/** 原始日志文件（交给 textRenderer 渲染原文） */
const fileRef = shallowRef<File | null>(null);
const renderers = shallowRef<unknown[]>([]);

let disposed = false;
let loadToken = 0;

/** 拉取文件字节（与 FvTextPanel 同口径） */
async function fetchBytes(): Promise<ArrayBuffer> {
  if (props.src) {
    const res = await fetch(props.src, { headers: authHeaders() });
    if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
    return res.arrayBuffer();
  }
  const base = objectUrl(props.bucket, props.objectKey);
  const url = props.inner
    ? `${base}${base.includes("?") ? "&" : "?"}preview=true&inner=${encodeURIComponent(props.inner)}`
    : base;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(`读取文件失败：HTTP ${res.status}`);
  return res.arrayBuffer();
}

async function load(): Promise<void> {
  const token = ++loadToken;
  disposed = false;
  loading.value = true;
  failReason.value = "";
  fileRef.value = null;
  renderers.value = [];
  report.value = null;
  try {
    const buf = await fetchBytes();
    if (disposed || token !== loadToken) return;
    const text = new TextDecoder("utf-8").decode(buf);
    rawText.value = text;

    // 判定：文件名 hs_err_pid*.log 或内容命中 hs_err 特征
    const parsed = parseJvmCrashLog(text, props.fileName);
    isHsErr.value = parsed.isHsErr;
    isLog.value = true;

    if (parsed.isHsErr) {
      report.value = parsed;
      emit("rendered");
      return;
    }

    // 普通日志：退化为文本渲染（textRenderer）
    const mod = await import("@file-viewer/renderer-text");
    if (disposed || token !== loadToken) return;
    renderers.value = [(mod as { textRenderer: unknown }).textRenderer];
    // 未知扩展名统一按 .txt 渲染（避免 textRenderer 不识别）
    const ext = extensionOf(props.fileName).toLowerCase();
    const name = ext ? props.fileName : `${props.fileName}.txt`;
    fileRef.value = new File([new Uint8Array(buf)], name, { type: "text/plain;charset=utf-8" });
  } catch (e) {
    if (disposed || token !== loadToken) return;
    const msg = (e as Error)?.message ?? "日志加载失败";
    failReason.value = msg;
    emit("error", msg);
    emit("fallback");
  } finally {
    if (!disposed && token === loadToken) loading.value = false;
  }
}

function onRendered(): void {
  emit("rendered");
}

function onBaseError(err: unknown): void {
  const msg = (err as Error)?.message ?? "日志渲染失败";
  emit("error", msg);
  emit("fallback");
}

/** 下载原始日志 */
function downloadRaw(): void {
  if (!rawText.value) return;
  const name = props.fileName || "hs_err_pid.log";
  const blob = new Blob([rawText.value], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.src, props.fileName],
  () => void load(),
  { immediate: true },
);

onBeforeUnmount(() => {
  disposed = true;
  loadToken++;
  fileRef.value = null;
});

/** 分析结论字段列出（value 为空则跳过） */
const FIELD_LABELS: Record<string, string> = {
  jreVersion: "JRE 版本",
  javaVm: "Java VM",
  siginfo: "siginfo",
  currentThread: "故障线程",
  vmArgs: "启动参数",
  javaCommand: "java 命令",
  heapSummary: "堆内存",
  os: "操作系统",
  cpu: "CPU",
  memory: "内存",
  vmInfo: "vm_info",
};

const fieldItems = (): Array<{ label: string; value: string }> => {
  const r = report.value;
  if (!r) return [];
  const out: Array<{ label: string; value: string }> = [];
  for (const key of Object.keys(FIELD_LABELS) as (keyof JvmCrashReport)[]) {
    const v = r[key];
    if (typeof v === "string" && v.trim()) out.push({ label: FIELD_LABELS[key as string], value: v.trim() });
  }
  return out;
};
</script>

<template>
  <section class="fv-log" aria-label="日志文件">
    <!-- 加载 / 失败 -->
    <div v-if="loading && !report && !fileRef" class="fv-log__mask"><span>正在加载日志…</span></div>
    <div v-else-if="failReason && !report && !fileRef" class="fv-log__mask fv-log__mask--err"><span>{{ failReason }}</span></div>

    <!-- hs_err：双模式分析 -->
    <template v-else-if="report">
      <div class="fv-log__bar">
        <button type="button" class="fv-log__tab" :class="{ 'is-active': view === 'analysis' }" @click="view = 'analysis'">分析结论</button>
        <button type="button" class="fv-log__tab" :class="{ 'is-active': view === 'raw' }" @click="view = 'raw'">原始日志</button>
        <span class="fv-log__spacer" />
        <span v-if="view === 'raw'" class="fv-log__stat">{{ rawText.length }} 字符</span>
        <button type="button" class="fv-log__tab fv-log__tab--download" title="下载原始日志" @click="downloadRaw">下载</button>
      </div>

      <!-- 分析结论视图 -->
      <div v-if="view === 'analysis'" class="fv-log__analysis" data-testid="log-analysis">
        <header class="fv-log__hero" :class="`is-${report.severity}`">
          <div class="fv-log__hero-title">{{ report.title || "JVM 崩溃" }}</div>
          <p v-if="report.errorLine" class="fv-log__hero-line">{{ report.errorLine }}</p>
        </header>

        <!-- 问题帧 + 处置建议 -->
        <div class="fv-log__grid">
          <div class="fv-log__card">
            <h4 class="fv-log__card-title">问题帧</h4>
            <p v-if="report.problematicFrame" class="fv-log__frame">{{ report.problematicFrame }}</p>
            <p v-else class="fv-log__muted">未捕获到 Problematic frame</p>
            <p class="fv-log__muted">类型：{{ report.frameKind === 'C' ? '原生代码 (C)' : report.frameKind === 'J' ? '编译 Java (J)' : report.frameKind === 'j' ? '解释 Java (j)' : report.frameKind === 'V' ? 'VM 代码 (V)' : '未知' }}</p>
          </div>
          <div class="fv-log__card">
            <h4 class="fv-log__card-title">处置建议</h4>
            <ul class="fv-log__advice">
              <li v-for="(a, i) in report.advice" :key="i">{{ a }}</li>
            </ul>
          </div>
        </div>

        <!-- 字段清单 -->
        <div class="fv-log__fields">
          <div v-for="item in fieldItems()" :key="item.label" class="fv-log__field">
            <span class="fv-log__field-label">{{ item.label }}</span>
            <code class="fv-log__field-value">{{ item.value }}</code>
          </div>
        </div>

        <!-- 栈帧（有则展示） -->
        <template v-if="report.nativeFrames.length || report.javaFrames.length">
          <div class="fv-log__card fv-log__card--stack">
            <h4 class="fv-log__card-title">故障线程栈</h4>
            <template v-if="report.nativeFrames.length">
              <p class="fv-log__muted">Native frames（J=编译 Java / j=解释 / Vv=VM / C=原生）</p>
              <pre class="fv-log__stack">{{ report.nativeFrames.join('\n') }}</pre>
            </template>
            <template v-if="report.javaFrames.length">
              <p class="fv-log__muted">Java frames</p>
              <pre class="fv-log__stack">{{ report.javaFrames.join('\n') }}</pre>
            </template>
          </div>
        </template>
      </div>

      <!-- 原始日志视图（原文） -->
      <div v-else class="fv-log__raw" data-testid="log-raw">
        <pre class="fv-log__raw-code">{{ rawText }}</pre>
      </div>
    </template>

    <!-- 普通日志：文本渲染 -->
    <div v-else-if="fileRef && renderers.length" class="fv-log__plain">
      <FvPanelBase
        v-model:loading="loading"
        :file="fileRef"
        :renderers="renderers"
        preset-id="text"
        enable-beautify
        @rendered="onRendered"
        @error="onBaseError"
      />
    </div>
  </section>
</template>

<style scoped>
.fv-log {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
}
.fv-log__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 0 8px;
}
.fv-log__tab {
  height: 26px;
  padding: 0 12px;
  border: 1px solid var(--el-border-color, #dcdfe6);
  border-radius: 6px;
  background: var(--el-bg-color, #fff);
  color: #444c56;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.fv-log__tab:hover {
  background: var(--el-fill-color-light, #f5f7fa);
}
.fv-log__tab.is-active {
  border-color: var(--el-color-primary, #409eff);
  background: var(--el-color-primary-light-9, #ecf5ff);
  color: var(--el-color-primary, #409eff);
}
.fv-log__tab--download {
  border-color: var(--el-color-success, #67c23a);
  color: var(--el-color-success, #67c23a);
}
.fv-log__tab--download:hover {
  background: var(--el-color-success-light-9, #f0f9eb);
}
.fv-log__spacer {
  flex: 1;
}
.fv-log__stat {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.fv-log__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
.fv-log__mask--err {
  color: var(--el-color-danger);
}

/* 分析结论 */
.fv-log__analysis {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.fv-log__hero {
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-left: 4px solid var(--el-color-warning, #e6a23c);
}
.fv-log__hero.is-native { border-left-color: var(--el-color-danger, #f56c6c); }
.fv-log__hero.is-oom { border-left-color: var(--el-color-warning, #e6a23c); }
.fv-log__hero.is-internal { border-left-color: var(--el-color-danger, #f56c6c); }
.fv-log__hero-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.fv-log__hero-line {
  margin: 4px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-regular, #606266);
}
.fv-log__grid {
  display: grid;
  grid-template-columns: 1fr 1.4fr;
  gap: 10px;
}
@media (max-width: 760px) {
  .fv-log__grid { grid-template-columns: 1fr; }
}
.fv-log__card {
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.fv-log__card-title {
  margin: 0 0 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary, #303133);
}
.fv-log__frame {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
.fv-log__advice {
  margin: 0;
  padding-left: 16px;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-regular, #606266);
}
.fv-log__fields {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  background: var(--el-bg-color, #fff);
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
}
.fv-log__field {
  display: grid;
  grid-template-columns: 96px 1fr;
  gap: 8px;
  padding: 6px 12px;
  font-size: 12.5px;
  border-bottom: 1px solid var(--el-border-color-extra-light, #f0f2f5);
}
.fv-log__field:last-child { border-bottom: 0; }
.fv-log__field-label {
  color: var(--el-text-color-secondary, #909399);
}
.fv-log__field-value {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
.fv-log__card--stack { margin-bottom: 10px; }
.fv-log__muted {
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.fv-log__stack {
  margin: 0;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 原始日志 */
.fv-log__raw {
  flex: 1;
  min-height: 0;
  overflow: auto;
  border-radius: 10px;
  background: var(--el-fill-color-lighter, #fafafa);
}
.fv-log__raw-code {
  margin: 0;
  padding: 14px 16px 40px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  white-space: pre;
  color: var(--el-text-color-primary, #303133);
}

/* 普通日志文本渲染 */
.fv-log__plain {
  flex: 1;
  min-height: 0;
}
</style>