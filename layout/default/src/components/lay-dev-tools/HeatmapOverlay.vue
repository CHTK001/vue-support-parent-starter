<template>
  <Teleport to="body">
    <div
      v-if="enabled"
      ref="el"
      class="heatmap-panel"
      :style="(style as any)"
      aria-hidden="true"
    >
      <div ref="handle" class="heatmap-panel__drag">
        <IconifyIconOnline icon="ri:drag-move-line" />
        <span>热点工具</span>
      </div>
      <div class="heatmap-panel__actions">
        <!-- 热力图可视化切换（激活=打开热力图显示，越密集越红） -->
        <button
          class="heatmap-btn"
          :class="{ active: heatmapVisible }"
          :title="heatmapVisible ? '关闭热力图' : '开启热力图可视化'"
          @click="heatmapVisible = !heatmapVisible"
          @mousedown.stop
        >
          <IconifyIconOnline icon="ri:fire-line" />
        </button>
        <!-- 解析按钮 -->
        <button
          class="heatmap-btn"
          :class="{ active: isAnalyzing }"
          :disabled="isAnalyzing || clickPoints.length === 0"
          title="解析热点数据"
          @click="analyzeHeatmap"
          @mousedown.stop
        >
          <IconifyIconOnline :icon="isAnalyzing ? 'ri:loader-4-line' : 'ri:bar-chart-line'" />
        </button>
        <!-- 上传按钮：reportUrl 不可用时不显示 -->
        <button
          v-if="reportUrl"
          class="heatmap-btn"
          :class="{ active: isUploading }"
          :disabled="isUploading || clickPoints.length === 0"
          title="上传热点数据"
          @click="uploadHeatmap"
          @mousedown.stop
        >
          <IconifyIconOnline :icon="isUploading ? 'ri:loader-4-line' : 'ri:upload-cloud-line'" />
        </button>
        <!-- 清除按钮：删除热点数据 -->
        <button class="heatmap-btn" title="清除热点数据" @click="clearHeatmap" @mousedown.stop>
          <IconifyIconOnline icon="ri:delete-bin-line" />
        </button>
      </div>
    </div>
    <canvas
      v-if="enabled && heatmapVisible"
      ref="canvasRef"
      class="heatmap-canvas"
      aria-hidden="true"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useGlobal } from "@pureadmin/utils";
import { useDraggable, useWindowSize } from "@vueuse/core";
import { useRoute } from "vue-router";
import localforage from "localforage";

/** 与 heatmap/index.ts 共用同一个 IndexedDB 实例（name/storeName 必须一致） */
const heatmapStore = localforage.createInstance({ name: "heatmap-store", storeName: "entries" });
const HEATMAP_STORAGE_KEY = "__heatmap_entries__";

const { $storage, $config } = useGlobal<GlobalPropertiesApi>();
const route = useRoute();

/** 注入父级提供的 AI 配置 */
const heatmapAiConfig = inject<any>("heatmapAiConfig", null);

const isDevEnv =
  import.meta.env.DEV ||
  import.meta.env.MODE === "development" ||
  import.meta.env.MODE === "test";

const devHeatmap = computed<boolean>(() => !!$storage?.configure?.devHeatmap);
const enabled = computed<boolean>(() => isDevEnv && devHeatmap.value);
const heatmapVisible = ref(false);

/** 上报地址（来自 $config Heatmap 配置节） */
const reportUrl = computed<string>(() => ($config as any)?.Heatmap?.reportUrl || "");

const el = ref<HTMLElement | null>(null);
const handle = ref<HTMLElement | null>(null);
const { width: windowWidth } = useWindowSize();

const { style } = useDraggable(el as any, {
  handle: handle as any,
  initialValue: () => ({ x: (windowWidth.value - 220) / 2, y: 16 }),
  preventDefault: true,
  stopPropagation: true,
});

interface ClickPoint { x: number; y: number; count: number; route: string; timestamp: number; }

const clickPoints = ref<ClickPoint[]>([]);
const MERGE_RADIUS = 20;
const RADIUS = 60;
const canvasRef = ref<HTMLCanvasElement | null>(null);
const maxCount = computed(() => Math.max(...clickPoints.value.map((p) => p.count), 1));

const isAnalyzing = ref(false);
const isUploading = ref(false);

/** 初始化 Worker */
const analysisWorker = new Worker(
  new URL("./heatmapAnalysis.worker.ts", import.meta.url),
  { type: "module" },
);

/** Worker 消息回调（由 localAnalysis/analyzeHeatmap 动态注册） */
let workerResolve: ((stats: any) => void) | null = null;

analysisWorker.onmessage = (e: MessageEvent) => {
  const msg = e.data;
  if (msg.type === "aggregated" && workerResolve) {
    workerResolve(msg);
    workerResolve = null;
  } else if (msg.type === "cleaned") {
    // Worker 返回清理后的数据，更新主线程
    clickPoints.value = msg.records;
  } else if (msg.type === "ping_cleanup") {
    // Worker 定时触发，把当前数据发给 Worker 做超时清理
    analysisWorker.postMessage({ type: "cleanup", records: [...clickPoints.value] });
  }
};

function renderHeatmap() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d")!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of clickPoints.value) {
    const intensity = p.count / maxCount.value;
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, RADIUS);
    grad.addColorStop(0, `rgba(255,0,0,${intensity * 0.8})`);
    grad.addColorStop(0.4, `rgba(255,165,0,${intensity * 0.5})`);
    grad.addColorStop(0.7, `rgba(0,255,0,${intensity * 0.3})`);
    grad.addColorStop(1, "rgba(0,0,255,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function clearHeatmap() {
  clickPoints.value = [];
  const canvas = canvasRef.value;
  if (canvas) {
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  // 同步清除 IndexedDB 持久化数据
  heatmapStore.removeItem(HEATMAP_STORAGE_KEY).catch(() => {});
}

/** 判断 vendor AI 是否可用 */
function isVendorAiAvailable(): boolean {
  const cfg = heatmapAiConfig?.value ?? heatmapAiConfig;
  return cfg?.mode === "vendor" && !!cfg?.apiUrl;
}

/** 判断 Chrome AI 是否可用 */
function isChromeAiAvailable(): boolean {
  const cfg = heatmapAiConfig?.value ?? heatmapAiConfig;
  return cfg?.mode === "chrome" && !!(window as any).ai?.languageModel;
}

/** 可交互元素选择器 */
const INTERACTIVE_SELECTOR = "button, a, [role=button], [role=menuitem], [role=tab], [role=option], input, select, textarea, label, [onclick], [data-action]";

/** 从坐标找到最近的可交互元素，提取业务标识 */
function resolveElement(x: number, y: number): { label: string; tag: string; el: Element | null } {
  const hit = document.elementFromPoint(x, y);
  if (!hit) return { label: "未命中元素", tag: "", el: null };

  // 向上冒泡找最近的可交互祖先（含自身）
  const interactive = hit.closest(INTERACTIVE_SELECTOR) ?? hit;
  const tag = interactive.tagName.toLowerCase();

  // 标识提取优先级：data-track > data-action > aria-label > textContent > title > tagName+class
  const label =
    (interactive as HTMLElement).dataset?.track ||
    (interactive as HTMLElement).dataset?.action ||
    interactive.getAttribute("aria-label") ||
    (interactive.textContent?.trim().slice(0, 40)) ||
    interactive.getAttribute("title") ||
    `${tag}.${[...interactive.classList].slice(0, 2).join(".")}`;

  return { label: label || tag, tag, el: interactive };
}

/** 将点击点列表聚合为元素维度数据（主线程提取标识 → Worker 聚合） */
async function buildElementStats(): Promise<{ stats: any[]; total: number }> {
  // 主线程：遍历所有点，用 elementFromPoint 提取元素标识（只能在主线程）
  const records = clickPoints.value.map(p => {
    const { label, tag } = resolveElement(p.x, p.y);
    return { label, tag, route: p.route, timestamp: p.timestamp, count: p.count };
  });

  return new Promise(resolve => {
    workerResolve = resolve;
    analysisWorker.postMessage({ type: "aggregate", records, route: route.fullPath });
  });
}

/** 本地算法：元素维度 Top10 统计（简洁输出） */
async function localAnalysis() {
  const { stats, total } = await buildElementStats();

  console.group("[热点分析] 本地算法结果");
  console.log(`总点击数: ${total}，命中元素种类: ${stats.length}，当前路由: ${route.fullPath}`);
  console.table(
    stats.slice(0, 10).map((s: any, i: number) => ({
      排名: i + 1,
      元素: `${s.label} (${s.tag})`,
      点击次数: s.count,
      占比: s.percent,
    }))
  );
  console.groupEnd();
}

/** 解析热点数据 */
async function analyzeHeatmap() {
  if (isAnalyzing.value || clickPoints.value.length === 0) return;

  const useVendor = isVendorAiAvailable();
  const useChrome = isChromeAiAvailable();

  if (!useVendor && !useChrome) {
    await localAnalysis();
    return;
  }

  isAnalyzing.value = true;
  try {
    const cfg = heatmapAiConfig?.value ?? heatmapAiConfig;
    const W = window.innerWidth;
    const H = window.innerHeight;

    // Worker 聚合当前路由的元素维度数据
    const { stats, total } = await buildElementStats();
    const top20 = (stats as any[]).slice(0, 20).map((s: any) =>
      `"${s.label}"(${s.tag}) ×${s.count} 占${s.percent}`
    );

    const prompt = `以下是页面用户点击热点数据（已映射到具体 UI 元素），页面路由: ${route.fullPath}，页面尺寸 ${W}×${H}px，总点击 ${total} 次：\n${top20.join("\n")}\n\n请分析：1.用户最关注的功能/操作 2.高频操作路径推断 3.交互优化建议。用中文简洁回答。`;

    let result = "";

    if (useChrome) {
      // Chrome AI 本地推理
      const session = await (window as any).ai.languageModel.create({
        systemPrompt: "你是专业的 UX 数据分析师，擅长分析用户行为热点数据。",
      });
      result = String(await session.prompt(prompt)).trim();
    } else {
      // 直接 fetch 厂商 API（不走 requestAiReply，避免影响 AI 聊天）
      const url = (cfg?.apiUrl || "").trim();
      if (!url) throw new Error("未配置 AI API 地址");

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (cfg?.apiKey?.trim()) headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: cfg?.model || "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "你是专业的 UX 数据分析师，擅长分析用户行为热点数据。" },
            { role: "user", content: prompt },
          ],
          max_tokens: 1024,
          temperature: 0.7,
        }),
      });
      if (!res.ok) throw new Error(`AI 请求失败: ${res.status}`);
      const data = await res.json();
      result = data?.choices?.[0]?.message?.content?.trim() || "无法获取分析结果";
    }

    console.group("[热点分析] AI 分析结果");
    console.log(result);
    console.groupEnd();
  } catch (err: any) {
    console.error("[热点分析] AI 分析失败，回退本地算法:", err?.message);
    await localAnalysis();
  } finally {
    isAnalyzing.value = false;
  }
}

/** 上传热点数据到后台 */
async function uploadHeatmap() {
  const url = reportUrl.value;
  if (!url || isUploading.value || clickPoints.value.length === 0) return;

  isUploading.value = true;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        points: clickPoints.value,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        timestamp: Date.now(),
        url: window.location.href,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    console.log("[热点工具] 上传成功");
  } catch (err: any) {
    console.error("[热点工具] 上传失败:", err?.message);
  } finally {
    isUploading.value = false;
  }
}

/** 授权 localStorage key（独立于显示开关） */
const CONSENT_KEY = "devHeatmapConsented";

/** 检查或请求用户授权，返回是否已授权 */
function ensureConsent(): boolean {
  if (localStorage.getItem(CONSENT_KEY) === "1") return true;
  const ok = window.confirm(
    "热点采集说明\n\n" +
    "• 数据仅存储在本地浏览器（IndexedDB），不会上报到任何服务器\n" +
    "• 关闭热点工具或离开页面时，数据将自动清除\n\n" +
    "是否同意开启热点采集？"
  );
  if (ok) localStorage.setItem(CONSENT_KEY, "1");
  return ok;
}

/** 退出时清除 IndexedDB 数据（隐私保护） */
function clearOnExit() {
  heatmapStore.removeItem(HEATMAP_STORAGE_KEY).catch(() => {});
}

let clickHandler: ((e: MouseEvent) => void) | null = null;

function attachClickListener() {
  if (clickHandler) return;
  // 未授权则不挂载采集
  if (!ensureConsent()) return;
  clickHandler = (e: MouseEvent) => {
    if ((e.target as HTMLElement).closest(".heatmap-panel")) return;
    // 只记录按钮类元素的点击
    const btnEl = (e.target as HTMLElement).closest(
      "button, [role=button], [type=button], [type=submit], [type=reset], .el-button, .sc-button"
    );
    if (!btnEl) return;
    const existing = clickPoints.value.find(
      (p) => Math.hypot(p.x - e.clientX, p.y - e.clientY) < MERGE_RADIUS,
    );
    if (existing) {
      existing.count++;
      existing.timestamp = Date.now();
    } else {
      clickPoints.value.push({
        x: e.clientX,
        y: e.clientY,
        count: 1,
        route: route.fullPath,
        timestamp: Date.now(),
      });
    }
    if (heatmapVisible.value) renderHeatmap();
  };
  window.addEventListener("click", clickHandler, { capture: true });
}

function detachClickListener() {
  if (clickHandler) {
    window.removeEventListener("click", clickHandler, { capture: true });
    clickHandler = null;
  }
}

watch(heatmapVisible, (active) => {
  // 激活只控制可视化显示，不影响数据采集
  if (active) renderHeatmap();
});

watch(enabled, (active) => {
  if (active) {
    attachClickListener();
  } else {
    heatmapVisible.value = false;
    detachClickListener();
  }
});

onMounted(() => {
  // enabled 初始为 true 时立即挂载点击监听
  if (enabled.value) attachClickListener();

  // 页面隐藏或关闭时自动清除 IndexedDB（隐私保护）
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") clearOnExit();
  });
  window.addEventListener("beforeunload", clearOnExit);
});

onBeforeUnmount(() => {
  detachClickListener();
  analysisWorker.terminate();
  clearOnExit();
  window.removeEventListener("visibilitychange", clearOnExit);
  window.removeEventListener("beforeunload", clearOnExit);
});
</script>

<style scoped lang="scss">
.heatmap-panel {
  position: fixed;
  z-index: 9997;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  background: rgba(15, 23, 42, 0.92);
  color: #e5e7eb;
  font-size: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  user-select: none;
  will-change: transform;
  backface-visibility: hidden;
  perspective: 1000px;
}

.heatmap-panel__drag {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: move;
  padding-right: 6px;
  border-right: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  touch-action: none;

  span, iconify-icon, svg {
    pointer-events: none;
  }
}

.heatmap-panel__actions {
  display: flex;
  flex-direction: row;
  gap: 4px;
}

.heatmap-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  background: transparent;
  color: #e5e7eb;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) { background: rgba(255, 255, 255, 0.1); }

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  &.active {
    background: rgba(239, 68, 68, 0.25);
    border-color: rgba(239, 68, 68, 0.5);
    color: #fca5a5;
  }
}

.heatmap-canvas {
  position: fixed;
  inset: 0;
  z-index: 9998;
  pointer-events: none;
  width: 100vw;
  height: 100vh;
}
</style>
