<!--
  FvClassPanel.vue — Java 字节码（.class）**前端反编译**预览。

  为什么能真还原：用的 @run-slicer/cfr（CFR 0.152 的 JS/WASM 移植，MIT），
  WASM 优先、加载失败自动回退到纯 JS 实现。整个过程在浏览器完成，不上传字节、
  不依赖后端，按需动态加载。

  类名不靠文件名猜：utils/classFile.ts 按 JVMS 解析 this_class 得到内部名，
  再交给 CFR 作为反编译入口。
-->
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { resolveObjectUrl } from "../../api/filestorageApi";
import { parseClassInfo, type ClassInfo } from "../../utils/classFile";

/** CFR 包类型（@run-slicer/cfr 的 d.ts 已提供同名 API，这里只做兼容层） */
interface CfrModule {
  decompile: (
    names: string | string[],
    config?: {
      source?: (name: string) => Promise<Uint8Array | null>;
      options?: Record<string, string>;
    },
  ) => Promise<Record<string, string>>;
}

const props = defineProps<{
  /** 存储桶名 */
  bucket: string;
  /** 对象 Key（含目录前缀） */
  objectKey: string;
  /** 文件名（不含目录） */
  fileName: string;
  /** 压缩包内条目路径（走 inner-raw 通道取包内字节） */
  inner?: string;
  /** 文件大小（字节；仅兼容调用方透传） */
  size?: number;
  /** 直接可取的字节地址（票据 URL / blob URL） */
  src?: string;
}>();

const emit = defineEmits<{
  fallback: [];
  error: [msg: string];
  rendered: [];
}>();

const loading = ref(true);
const failReason = ref("");
const info = ref<ClassInfo | null>(null);
const source = ref("");
const elapsed = ref(0);

/** Java 主版本号 → 语言版本（45 = 1.1，52 = 8，61 = 17，65 = 21 …） */
const javaVersion = computed(() => {
  const m = info.value?.major;
  if (!m) return "";
  if (m <= 48) return `Java 1.${m - 44}`;
  return `Java ${m - 44}`;
});

const lineCount = computed(() => (source.value ? source.value.split("\n").length : 0));

/** 去掉 CFR 输出顶部的许可证块注释，只留代码 */
function stripHeader(src: string): string {
  const m = /^\s*\/\*[\s\S]*?\*\/\s*/.exec(src);
  return m ? src.slice(m[0].length) : src;
}

async function load(): Promise<void> {
  if (!props.src && (!props.bucket || !props.objectKey)) return;
  loading.value = true;
  failReason.value = "";
  source.value = "";
  info.value = null;
  try {
    let url = props.src ?? "";
    if (!url) {
      const params: Record<string, string> = {};
      if (props.inner) {
        params.preview = "true";
        params.inner = props.inner;
      }
      url = await resolveObjectUrl(props.bucket, props.objectKey, { params });
      if (!url) throw new Error("获取文件地址失败");
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (!buf.byteLength) throw new Error("预览通道返回空响应体");

    const meta = parseClassInfo(buf);
    info.value = meta;

    const t0 = performance.now();
    const mod = (await import("@run-slicer/cfr")) as unknown as CfrModule;
    const bytes = new Uint8Array(buf);
    const out = await mod.decompile(meta.internalName, {
      source: async (name) => (name === meta.internalName ? bytes : null),
      options: {},
    });
    elapsed.value = Math.round(performance.now() - t0);

    const src = out[meta.internalName] ?? Object.values(out)[0] ?? "";
    if (!src.trim()) throw new Error("CFR 未返回源码");
    source.value = stripHeader(src);
    emit("rendered");
  } catch (e) {
    const msg = (e as Error)?.message ?? "反编译失败";
    console.warn("[FvClassPanel] class 反编译失败", e);
    failReason.value = `反编译失败（${props.fileName}）：${msg}`;
    emit("fallback");
    emit("error", failReason.value);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.bucket, props.objectKey, props.inner, props.src, props.fileName],
  () => void load(),
  { immediate: true },
);
</script>

<template>
  <div class="fv-class" data-testid="file-viewer">
    <div v-if="loading" class="fv-class__loading" data-testid="class-loading">
      <div class="fv-class__loading-card">
        <div class="fv-class__loading-visual" aria-hidden="true">
          <span class="fv-class__loading-aura" />
          <span class="fv-class__loading-orbit"><i /><i /></span>
          <div class="fv-class__loading-icon">
            <svg
              class="fv-class__loading-sheet"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.25"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M6 2h9l4 4v16H6z" />
              <path d="M15 2v4h4" />
            </svg>
            <svg
              class="fv-class__loading-glyph"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.85"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M8 7l-4 5 4 5" />
              <path d="M16 7l4 5-4 5" />
            </svg>
            <span class="fv-class__loading-extension">CLASS</span>
            <span class="fv-class__loading-scan" />
          </div>
        </div>
        <div class="fv-class__loading-copy">
          <span class="fv-class__loading-kicker">Class 文件</span>
          <strong>正在解析文件内容...</strong>
          <p>正在解析字节码、类结构与反编译结果。</p>
          <span class="fv-class__loading-progress" aria-hidden="true"><i /></span>
        </div>
      </div>
    </div>
    <div v-else-if="failReason" class="fv-class__mask"><span>{{ failReason }}</span></div>
    <template v-else>
      <div class="fv-class__bar">
        <span class="fv-class__stat" data-testid="class-stats">
          {{ info?.name }} · {{ javaVersion }} · {{ lineCount }} 行 · 反编译 {{ elapsed }} ms · CFR 0.152
        </span>
        <span class="fv-class__file">{{ fileName }}</span>
      </div>
      <div class="fv-class__stage">
        <pre class="fv-class__code" data-testid="class-source">{{ source }}</pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fv-class {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color, #fff);
}
.fv-class__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: none;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter, #ebeef5);
  font-size: 12px;
  color: var(--el-text-color-secondary, #909399);
}
.fv-class__file {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-class__stage {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  background: var(--el-fill-color-lighter, #fafafa);
}
.fv-class__code {
  margin: 0;
  padding: 14px 16px 40px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: var(--el-text-color-primary, #303133);
  white-space: pre;
  tab-size: 4;
}
.fv-class__loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 248, 249, 0.98));
}
.fv-class__loading-card {
  --viewer-accent: #4f7ef7;
  --viewer-accent-secondary: #38bdf8;
  --viewer-glow: rgba(79, 126, 247, 0.35);
  --viewer-soft: rgba(79, 126, 247, 0.12);
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 26px;
  width: min(100%, 500px);
  padding: 26px 28px;
  border: 1px solid rgba(32, 52, 72, 0.09);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 28px 70px rgba(15, 31, 47, 0.13), 0 2px 8px rgba(15, 31, 47, 0.05);
}
.fv-class__loading-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  z-index: 2;
  height: 2px;
  border-radius: 0 0 999px 999px;
  background: linear-gradient(90deg, transparent, var(--viewer-accent), var(--viewer-accent-secondary), transparent);
  box-shadow: 0 2px 14px var(--viewer-glow);
}
.fv-class__loading-card::after {
  content: "";
  position: absolute;
  top: -92px;
  left: -76px;
  z-index: -1;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--viewer-glow), transparent 68%);
  filter: blur(7px);
  opacity: 0.62;
}
.fv-class__loading-visual {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 108px;
  width: 108px;
  height: 108px;
}
.fv-class__loading-aura {
  position: absolute;
  inset: 13px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--viewer-soft) 0 34%, transparent 70%);
  box-shadow: 0 0 28px var(--viewer-glow);
  animation: fv-class-loading-aura 2.8s ease-in-out infinite;
}
.fv-class__loading-orbit {
  position: absolute;
  inset: 5px;
  border: 1px dashed color-mix(in srgb, var(--viewer-accent) 32%, transparent);
  border-radius: 50%;
  animation: fv-class-loading-orbit 9s linear infinite;
}
.fv-class__loading-orbit i {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--viewer-accent-secondary);
  box-shadow: 0 0 10px var(--viewer-glow);
}
.fv-class__loading-orbit i:first-child {
  top: 8px;
  right: 14px;
}
.fv-class__loading-orbit i:last-child {
  width: 5px;
  height: 5px;
  bottom: 12px;
  left: 9px;
}
.fv-class__loading-icon {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 82px;
  color: var(--viewer-accent);
  filter: drop-shadow(0 12px 18px var(--viewer-glow));
  animation: fv-class-loading-float 2.8s ease-in-out infinite;
}
.fv-class__loading-sheet {
  position: absolute;
  inset: 0;
  width: 72px;
  height: 82px;
  color: color-mix(in srgb, var(--viewer-accent) 43%, transparent);
  fill: color-mix(in srgb, var(--viewer-accent) 6%, white);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fv-class__loading-glyph {
  position: absolute;
  top: 19px;
  width: 30px;
  height: 30px;
  color: var(--viewer-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fv-class__loading-extension {
  position: absolute;
  right: 10px;
  bottom: 12px;
  left: 10px;
  overflow: hidden;
  color: var(--viewer-accent);
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.03em;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-class__loading-scan {
  position: absolute;
  top: 15px;
  right: 10px;
  left: 10px;
  z-index: 3;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--viewer-accent-secondary), transparent);
  box-shadow: 0 0 8px var(--viewer-glow);
  opacity: 0;
  animation: fv-class-loading-scan 2.25s ease-in-out infinite;
}
.fv-class__loading-copy {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}
.fv-class__loading-kicker {
  display: block;
  color: var(--viewer-accent);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.105em;
  text-transform: uppercase;
}
.fv-class__loading-copy strong {
  display: block;
  margin-top: 6px;
  color: #16283b;
  font-size: 20px;
  line-height: 1.2;
}
.fv-class__loading-copy p {
  margin: 8px 0 0;
  color: #6a7d90;
  line-height: 1.6;
}
.fv-class__loading-progress {
  position: relative;
  display: block;
  height: 3px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--viewer-soft);
}
.fv-class__loading-progress i {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: auto;
  width: 46%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--viewer-accent), var(--viewer-accent-secondary), transparent);
  box-shadow: 0 0 12px var(--viewer-glow);
  animation: fv-class-loading-progress 1.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes fv-class-loading-orbit {
  to {
    transform: rotate(360deg);
  }
}
@keyframes fv-class-loading-float {
  0%,
  100% {
    transform: translateY(2px) rotate(-1deg);
  }
  50% {
    transform: translateY(-4px) rotate(1deg);
  }
}
@keyframes fv-class-loading-aura {
  0%,
  100% {
    opacity: 0.58;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}
@keyframes fv-class-loading-scan {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  18% {
    opacity: 0.95;
  }
  72% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(47px);
  }
}
@keyframes fv-class-loading-progress {
  0% {
    transform: translate(-110%);
  }
  100% {
    transform: translate(315%);
  }
}
.fv-class__mask {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}
</style>
