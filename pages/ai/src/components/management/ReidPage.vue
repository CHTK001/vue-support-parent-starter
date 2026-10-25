<template>
  <div class="reid-root" data-page="reid">
    <div class="reid-body">
      <!-- ==================== 左：图片舞台 ==================== -->
      <section class="reid-stage">
        <div class="reid-stage-inner">
          <!-- 空态：引导上传 -->
          <div v-if="!previewUrl" class="reid-drop" @click="pickImage">
            <el-icon :size="46" class="reid-drop-icon"><Picture /></el-icon>
            <p class="reid-drop-title">{{ mode === 'observe' ? '上传一帧监控画面，开始跨帧追踪' : '上传一张人脸照片，检索轨迹' }}</p>
            <p class="reid-drop-desc">
              {{ mode === 'observe'
                ? '同一个人在不同摄像头出现时，会自动并入同一条轨迹'
                : '在已观测的轨迹中找出最相似的人' }}
            </p>
            <el-button type="primary" class="reid-drop-btn" :disabled="!available" @click.stop="pickImage">
              <el-icon><FolderOpened /></el-icon>选择图片
            </el-button>
          </div>

          <!-- 图片 + 检测框叠加层 -->
          <div v-else class="reid-canvas" :class="{ 'is-busy': busy }">
            <img :src="previewUrl" class="reid-img" alt="待观测画面" />

            <!--
              叠加层与图片用同一 viewBox + 同一 preserveAspectRatio，
              二者缩放/留白完全一致，检测框坐标即可直接落在原图像素上。
            -->
            <svg
              v-if="faces.length && natural.w"
              class="reid-overlay"
              :viewBox="`0 0 ${natural.w} ${natural.h}`"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect
                v-for="(f, i) in faces"
                :key="i"
                class="reid-box"
                :class="{ 'is-new': !f.matched }"
                :x="f.x"
                :y="f.y"
                :width="f.width"
                :height="f.height"
                rx="18"
              />
            </svg>

            <!-- 处理中遮罩 -->
            <div v-if="busy" class="reid-mask">
              <ReLoader loading size="lg" :fullscreen="false" />
              <span class="reid-mask-text">{{ mode === 'observe' ? '正在观测…' : '正在检索…' }}</span>
            </div>

            <!-- 角标：观测完成 -->
            <div v-else-if="observeResult" class="reid-found">
              <div class="reid-found-title">
                <el-icon><Aim /></el-icon>观测完成
              </div>
              <div class="reid-found-sub">
                检出 {{ observeResult.faceCount }} 张脸 · 命中既有轨迹 {{ observeResult.matched }} · 新建轨迹 {{ observeResult.newTracks }}
              </div>
            </div>

            <!-- 未检出人脸 -->
            <div v-else-if="done && !faces.length && !searchHits.length" class="reid-noface">
              <el-icon :size="20"><Warning /></el-icon>
              <span>未检测到人脸，请换一张正面清晰的画面</span>
            </div>
          </div>

          <!-- 观测参数（模式 = 观测时显示） -->
          <div v-if="previewUrl && mode === 'observe'" class="reid-params">
            <el-input v-model="cameraId" placeholder="摄像头（留空用配置默认）" class="reid-param" />
            <el-input v-model="sourceId" placeholder="来源帧（留空自动生成）" class="reid-param" />
            <el-input-number v-model="lat" :precision="7" :controls="false" placeholder="纬度（非必填）" class="reid-param-num" />
            <el-input-number v-model="lng" :precision="7" :controls="false" placeholder="经度（非必填）" class="reid-param-num" />
          </div>

          <!-- 操作条 -->
          <div v-if="previewUrl" class="reid-actions">
            <el-button class="reid-btn reid-btn-ghost" :disabled="busy" @click="pickImage">
              <el-icon><FolderOpened /></el-icon>更换图片
            </el-button>
            <el-button
              v-if="mode === 'observe'"
              class="reid-btn reid-btn-brand"
              :disabled="busy || !available"
              :loading="busy"
              @click="runObserve"
            >
              <el-icon v-if="!busy"><Aim /></el-icon>观测并归并轨迹
            </el-button>
            <el-button
              v-else
              class="reid-btn reid-btn-brand"
              :disabled="busy || !available"
              :loading="busy"
              @click="runSearchFromButton"
            >
              <el-icon v-if="!busy"><Search /></el-icon>检索轨迹
            </el-button>
          </div>
        </div>
      </section>

      <!-- ==================== 右：轨迹卡片 ==================== -->
      <aside class="reid-panel">
        <header class="reid-panel-head">
          <h2 class="reid-panel-title">跨帧轨迹</h2>
          <span class="reid-dots"><i v-for="n in 5" :key="n" /></span>
        </header>

        <!-- 分类切换 -->
        <nav class="reid-tabs">
          <button
            v-for="t in TABS"
            :key="t.key"
            class="reid-tab"
            :class="{ 'is-active': activeTab === t.key }"
            :title="t.hint"
            @click="switchTab(t.key)"
          >
            {{ t.label }}
          </button>
        </nav>

        <!-- 卡片列表 -->
        <div v-if="cards.length" class="reid-grid">
          <article
            v-for="c in cards"
            :key="c.trackId"
            class="reid-card"
            :class="{ 'is-cross': c.crossCamera }"
          >
            <div class="reid-card-head">
              <span class="reid-card-id">{{ c.trackId }}</span>
              <el-tag v-if="c.crossCamera" type="warning" size="small">跨镜</el-tag>
            </div>
            <p class="reid-card-cams" :title="c.cameraIds.join(' → ')">{{ c.cameraIds.join(' → ') }}</p>
            <p class="reid-card-meta">
              <b class="reid-card-count">{{ c.observations }}</b> 次观测
              <span class="reid-card-sep">|</span>
              <span>{{ formatTime(c.lastSeen) }}</span>
            </p>
            <p v-if="c.similarity != null" class="reid-card-score">相似度 {{ (c.similarity * 100).toFixed(1) }}%</p>
            <p v-else-if="c.lat != null && c.lng != null" class="reid-card-geo">{{ c.lat }}, {{ c.lng }}</p>
          </article>
        </div>

        <!-- 空态 -->
        <div v-else class="reid-blank">
          <el-icon :size="34" class="reid-blank-icon"><Aim /></el-icon>
          <p class="reid-blank-title">{{ blankTitle }}</p>
          <p class="reid-blank-desc">{{ blankDesc }}</p>
        </div>

        <!-- 主行动 -->
        <el-button class="reid-cta" :disabled="busy || !available" @click="switchMode">
          <el-icon><component :is="mode === 'observe' ? Search : Aim" /></el-icon>
          {{ mode === 'observe' ? '切换到以图搜人' : '切换到观测画面' }}
        </el-button>
        <p class="reid-panel-hint">
          共 <b>{{ tracks.length }}</b> 条轨迹
          <span v-if="crossCount"> · 其中跨镜 <b>{{ crossCount }}</b> 条</span>
        </p>

        <el-button v-if="tracks.length" link type="danger" class="reid-clear" :disabled="busy" @click="clearTracks">
          清空全部轨迹
        </el-button>

        <!-- 当前模型（只读，取自系统设置） -->
        <p class="reid-model">
          <el-icon><Setting /></el-icon>
          <span>检测模型 <b>{{ detectorModel || '未配置' }}</b></span>
          <span class="reid-dot">·</span>
          <span>特征模型 <b>{{ featureModel || '未配置' }}</b></span>
        </p>

        <!-- 模型未配齐 → 本页不可用 -->
        <div v-if="!available" class="reid-gate">
          <el-icon><Warning /></el-icon>
          <div>
            <p class="reid-gate-title">人脸重识别未启用</p>
            <p class="reid-gate-desc">
              还需配置人脸检测模型与人脸特征模型。请到「系统设置 → 人脸重识别配置」中选择模型，保存后立即生效。
            </p>
            <el-button link type="primary" @click="gotoSettings">前往配置</el-button>
          </div>
        </div>
      </aside>
    </div>

    <!-- 隐藏的文件选择器：与 FaceSearchPage 同一做法 -->
    <input ref="fileInput" type="file" accept="image/*" class="reid-hidden" @change="onFilePicked" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { message } from "@repo/core";
import { useRouter } from "vue-router";
import { Aim, FolderOpened, Picture, Search, Setting, Warning } from "@element-plus/icons-vue";
import ReLoader from "@repo/ui/re-loader";
import { apiService } from "@/services/ApiService";
import type { ReidHit, ReidObserveResult, ReidTrack } from "@/services/modules/reid.api";

/**
 * 人脸重识别页面。
 *
 * <p><b>视觉骨架与人脸识别页一致</b>：左侧图片舞台（图上叠检测框）+ 右侧常驻卡片栏。
 * 差别只在语义 —— 人脸页右侧是「相似面孔」，这里是「跨帧轨迹卡片」。</p>
 *
 * <p>两种操作模式（观测 / 以图搜人）共用同一个舞台，由右侧卡片栏底部的按钮切换：
 * 这样上传区、叠加层、操作条都只有一套实现，不会出现两份长得不一样的布局。</p>
 *
 * <p><b>配置不在这里。</b>模型与归并参数统一在「系统设置 → 人脸重识别配置」。
 * 本页只做事：观测（落底库）、检索、看轨迹。</p>
 */

/** 操作模式：观测 / 检索。 */
type Mode = "observe" | "search";

/** 卡片分类。 */
const TABS = [
  { key: "all", label: "全部", hint: "全部轨迹" },
  { key: "cross", label: "跨镜", hint: "只看跨摄像头轨迹" },
  { key: "hit", label: "命中", hint: "只看本次检索命中的轨迹" },
];

const router = useRouter();

/** 隐藏文件输入。 */
const fileInput = ref<HTMLInputElement | null>(null);

/** 当前模式。 */
const mode = ref<Mode>("observe");

/** 当前分类。 */
const activeTab = ref("all");

/** 图片预览地址。 */
const previewUrl = ref("");

/** 图片原始尺寸（叠框 viewBox 用）。 */
const natural = ref({ w: 0, h: 0 });

/** 观测结果。 */
const observeResult = ref<ReidObserveResult | null>(null);

/** 本帧检测框。 */
const faces = ref<Array<{ x: number; y: number; width: number; height: number; trackId: string | null; matched: boolean }>>([]);

/** 以图搜人命中。 */
const searchHits = ref<ReidHit[]>([]);

/** 轨迹列表。 */
const tracks = ref<ReidTrack[]>([]);

/** 摄像头 / 来源帧 / 经纬度。 */
const cameraId = ref("");
const sourceId = ref("");
const lat = ref<number | null>(null);
const lng = ref<number | null>(null);

/** 能力是否就绪。 */
const available = ref(false);

/** 模型标识（只读展示）。 */
const detectorModel = ref("");
const featureModel = ref("");

/** 处理中。 */
const busy = ref(false);

/** 是否已执行过一次操作（区分「没做过」与「做了没脸」）。 */
const done = ref(false);

/** 上次选择的文件。 */
const lastFile = ref<File | Blob | null>(null);

/** 跨镜轨迹数。 */
const crossCount = computed(() => tracks.value.filter((t) => t.crossCamera).length);

/** 右侧卡片数据：检索命中时用命中项，否则用轨迹列表。 */
const cards = computed(() => {
  if (activeTab.value === "hit") {
    return searchHits.value.map((h) => ({
      trackId: h.trackId,
      cameraIds: h.track?.cameraIds ?? [],
      observations: h.track?.observations ?? 0,
      crossCamera: h.track?.crossCamera ?? false,
      lastSeen: h.track?.lastSeen ?? 0,
      lat: h.track?.lat ?? null,
      lng: h.track?.lng ?? null,
      similarity: h.similarity as number | null,
    }));
  }
  const base = activeTab.value === "cross" ? tracks.value.filter((t) => t.crossCamera) : tracks.value;
  return base.map((t) => ({
    trackId: t.trackId,
    cameraIds: t.cameraIds,
    observations: t.observations,
    crossCamera: t.crossCamera,
    lastSeen: t.lastSeen,
    lat: t.lat ?? null,
    lng: t.lng ?? null,
    similarity: null as number | null,
  }));
});

/** 空态标题。 */
const blankTitle = computed(() =>
  activeTab.value === "hit" ? "还没有检索结果" : "暂无轨迹",
);

/** 空态说明。 */
const blankDesc = computed(() =>
  activeTab.value === "hit"
    ? "上传一张人脸照片后点「检索轨迹」，命中的轨迹会出现在这里"
    : "上传一帧监控画面并观测后，轨迹会自动汇入这里",
);

/**
 * 时间格式化。
 *
 * @param ts 毫秒时间戳
 * @returns HH:mm:ss
 */
function formatTime(ts: number): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** 打开文件选择。 */
function pickImage() {
  fileInput.value?.click();
}

/**
 * 文件选择回调。
 *
 * @param e input change 事件
 */
function onFilePicked(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  lastFile.value = file;
  faces.value = [];
  observeResult.value = null;
  searchHits.value = [];
  done.value = false;
  const url = URL.createObjectURL(file);
  previewUrl.value = url;
  // 取原图尺寸：叠框 viewBox 必须与原图一致，否则框会错位
  const img = new Image();
  img.onload = () => {
    natural.value = { w: img.naturalWidth, h: img.naturalHeight };
  };
  img.src = url;
}

/** 切换模式。 */
function switchMode() {
  mode.value = mode.value === "observe" ? "search" : "observe";
  if (mode.value === "search") {
    activeTab.value = "hit";
  }
}

/**
 * 切换卡片分类。
 *
 * @param key 分类键
 */
function switchTab(key: string) {
  activeTab.value = key;
}

/** 观测并归并。 */
async function runObserve() {
  if (!lastFile.value) {
    message.warning("请先选择图片");
    return;
  }
  busy.value = true;
  done.value = true;
  try {
    const result = await apiService.observeReid(
      lastFile.value,
      cameraId.value || undefined,
      sourceId.value || undefined,
      undefined,
      lat.value,
      lng.value,
    );
    observeResult.value = result;
    faces.value = (result.faces ?? []).map((f) => ({
      x: f.x, y: f.y, width: f.width, height: f.height,
      trackId: f.trackId ?? null, matched: f.matched,
    }));
    message.success(`观测完成：检出 ${result.faceCount} 张脸`);
    await loadTracks();
  } catch (e) {
    message.error(`观测失败：${(e as Error)?.message ?? e}`);
  } finally {
    busy.value = false;
  }
}

/**
 * 以图搜人（按钮入口）。
 *
 * <p>单独包一层：{@code @click} 会把 MouseEvent 传给处理函数，
 * 而 runSearch 的参数是图片 —— 事件对象会被误当图片用。</p>
 */
async function runSearchFromButton() {
  if (!lastFile.value) {
    message.warning("请先选择图片");
    return;
  }
  busy.value = true;
  done.value = true;
  try {
    searchHits.value = await apiService.searchReid(lastFile.value);
    activeTab.value = "hit";
    if (searchHits.value.length) {
      message.success(`命中 ${searchHits.value.length} 条轨迹`);
    } else {
      message.info("没有命中任何轨迹（可能还没有观测记录，或相似度未达阈值）");
    }
  } catch (e) {
    message.error(`检索失败：${(e as Error)?.message ?? e}`);
  } finally {
    busy.value = false;
  }
}

/** 加载轨迹。 */
async function loadTracks() {
  try {
    tracks.value = await apiService.listReidTracks();
  } catch (e) {
    message.error(`加载轨迹失败：${(e as Error)?.message ?? e}`);
  }
}

/** 清空轨迹。 */
async function clearTracks() {
  try {
    const cleared = await apiService.clearReidTracks();
    message.success(`已清空 ${cleared} 条轨迹`);
    searchHits.value = [];
    observeResult.value = null;
    faces.value = [];
    await loadTracks();
  } catch (e) {
    message.error(`清空失败：${(e as Error)?.message ?? e}`);
  }
}

/** 跳到设置中心的「人脸重识别配置」。 */
function gotoSettings() {
  router.push({ name: "SystemSettings", params: { tab: "reid-config" } });
}

/** 初始化。 */
onMounted(async () => {
  try {
    const stats = await apiService.getReidStats();
    available.value = stats.available;
    // 摘要形如 reid{feature=arc-face, threshold=0.5, ...}，取出模型名作只读展示
    const cfg = stats.config ?? "";
    const feature = /feature=([^,}\s]+)/.exec(cfg);
    featureModel.value = feature && feature[1] !== "null" ? feature[1] : "";
    const detector = /detector=([^,}\s]+)/.exec(cfg);
    detectorModel.value = detector && detector[1] !== "null" ? detector[1] : "";
  } catch {
    available.value = false;
  }
  await loadTracks();
});
</script>

<style scoped>
/* ============================================================================
   与人脸识别页（FaceSearchPage）同一套骨架与令牌：
   - 左侧舞台 flex:1、右侧面板固定 400px、整体 24px 内边距
   - 身份色沿用橙/青双色（--reid-brand / --reid-accent），与 .fs-* 一一对应
   - 卡片与容器不加投影，层次由 1px 边框 + 留白表达
   ============================================================================ */
.reid-root {
  --reid-brand: #f97316;
  --reid-brand-2: #fb923c;
  --reid-accent: #06b6d4;
  --reid-accent-2: #14b8a6;

  --reid-bg: var(--el-bg-color);
  --reid-card: var(--el-bg-color);
  --reid-text: var(--el-text-color-primary);
  --reid-muted: var(--el-text-color-secondary);
  --reid-border: var(--el-border-color-lighter);
  --reid-hover: var(--el-fill-color-light);
  --reid-radius: var(--el-radius-lg, 12px);

  position: relative;
  height: 100%;
  overflow: hidden;
  background: var(--reid-bg);
  color: var(--reid-text);
}

.reid-body {
  position: relative;
  display: flex;
  gap: 24px;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
}

/* ---------------- 左侧舞台 ---------------- */
.reid-stage {
  flex: 1 1 auto;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.reid-stage-inner {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.reid-drop {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  border: 1px dashed var(--reid-border);
  border-radius: var(--reid-radius);
  text-align: center;
  padding: 24px;
}

.reid-drop:hover .reid-drop-title {
  color: var(--reid-brand);
}

.reid-drop-icon {
  color: var(--reid-muted);
}

.reid-drop-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
}

.reid-drop-desc {
  margin: 0;
  font-size: 13px;
  color: var(--reid-muted);
}

.reid-drop-btn {
  margin-top: 6px;
}

.reid-canvas {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  border-radius: var(--reid-radius);
  overflow: hidden;
  background: var(--reid-card);
  border: 1px solid var(--reid-border);
}

.reid-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
}

.reid-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.reid-box {
  fill: none;
  stroke: var(--reid-accent);
  stroke-width: 4;
  stroke-dasharray: 14 10;
  filter: drop-shadow(0 0 6px var(--reid-accent));
}

/* 新建轨迹的框用主橙实线：一眼区分「这是新出现的人」 */
.reid-box.is-new {
  stroke: var(--reid-brand);
  stroke-dasharray: none;
  filter: drop-shadow(0 0 6px var(--reid-brand));
}

.reid-mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: color-mix(in srgb, var(--reid-bg) 70%, transparent);
}

.reid-mask-text {
  font-size: 13px;
  color: var(--reid-muted);
}

.reid-found {
  position: absolute;
  left: 18px;
  top: 18px;
  padding: 10px 14px;
  border-radius: var(--reid-radius);
  background: color-mix(in srgb, var(--reid-card) 88%, transparent);
  border: 1px solid var(--reid-border);
}

.reid-found-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
}

.reid-found-sub {
  margin-top: 4px;
  font-size: 12px;
  color: var(--reid-muted);
}

.reid-noface {
  position: absolute;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: var(--reid-radius);
  background: color-mix(in srgb, var(--reid-card) 88%, transparent);
  border: 1px solid var(--reid-border);
  font-size: 13px;
  color: var(--reid-muted);
}

.reid-params {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.reid-param {
  flex: 1 1 160px;
  min-width: 140px;
}

.reid-param-num {
  flex: 0 0 150px;
  width: 150px;
}

.reid-actions {
  display: flex;
  gap: 14px;
  justify-content: center;
}

.reid-btn {
  height: 46px;
  padding: 0 30px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 15px;
  font-weight: 600;
  border: none;
  color: var(--el-color-white);
}

.reid-btn-ghost {
  background: var(--reid-card);
  color: var(--reid-brand);
  border: 2px solid var(--reid-brand);
}

.reid-btn-brand {
  background: linear-gradient(135deg, var(--reid-brand-2), var(--reid-brand));
}

.reid-btn:disabled {
  opacity: 0.5;
}

/* ---------------- 右侧面板 ---------------- */
.reid-panel {
  width: 400px;
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 22px;
  box-sizing: border-box;
  border-radius: var(--reid-radius);
  background: var(--reid-card);
  border: 1px solid var(--reid-border);
  overflow-y: auto;
}

.reid-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.reid-panel-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
}

.reid-dots {
  display: flex;
  gap: 4px;
}

.reid-dots i {
  width: 5px;
  height: 5px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--reid-accent);
}

.reid-tabs {
  display: flex;
  gap: 8px;
}

.reid-tab {
  flex: 1 1 auto;
  height: 32px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--reid-border);
  background: transparent;
  color: var(--reid-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s);
}

.reid-tab:hover {
  background: var(--reid-hover);
}

.reid-tab.is-active {
  background: var(--reid-brand);
  border-color: var(--reid-brand);
  color: var(--el-color-white);
  font-weight: 600;
}

.reid-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.reid-card {
  padding: 12px 14px;
  border-radius: var(--reid-radius);
  border: 1px solid var(--reid-border);
  background: var(--reid-bg);
  transition: border-color var(--el-transition-duration-fast, 0.2s);
}

.reid-card:hover {
  border-color: var(--reid-accent);
}

/* 跨镜轨迹左侧加一条主橙竖线：扫一眼就能挑出「跨摄像头出现过的人」 */
.reid-card.is-cross {
  border-left: 3px solid var(--reid-brand);
}

.reid-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reid-card-id {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px;
  font-weight: 600;
}

.reid-card-cams {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--reid-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.reid-card-meta {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--reid-muted);
}

.reid-card-count {
  color: var(--reid-text);
  font-size: 14px;
}

.reid-card-sep {
  margin: 0 6px;
}

.reid-card-score {
  margin: 6px 0 0;
  font-size: 12px;
  font-weight: 700;
  color: var(--reid-accent);
}

.reid-card-geo {
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--reid-muted);
}

.reid-blank {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 12px;
  text-align: center;
}

.reid-blank-icon {
  color: var(--reid-muted);
}

.reid-blank-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.reid-blank-desc {
  margin: 0;
  font-size: 12px;
  color: var(--reid-muted);
  line-height: 1.6;
}

.reid-cta {
  height: 44px;
  border-radius: var(--el-radius-full, 9999px);
  border: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--reid-accent-2), var(--reid-accent));
}

.reid-panel-hint {
  margin: 0;
  font-size: 12px;
  color: var(--reid-muted);
  text-align: center;
}

.reid-clear {
  align-self: center;
  font-size: 12px;
}

.reid-model {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  font-size: 12px;
  color: var(--reid-muted);
  flex-wrap: wrap;
}

.reid-dot {
  opacity: 0.6;
}

.reid-gate {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--reid-radius);
  border: 1px solid var(--reid-border);
  background: var(--reid-hover);
}

.reid-gate-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
}

.reid-gate-desc {
  margin: 4px 0 6px;
  font-size: 12px;
  color: var(--reid-muted);
  line-height: 1.6;
}

.reid-hidden {
  display: none;
}
</style>
