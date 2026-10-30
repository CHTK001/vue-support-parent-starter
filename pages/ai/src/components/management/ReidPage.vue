<template>
  <div class="reid-root" data-page="reid">
    <div class="reid-body">
      <!-- ==================== 左：图片舞台 ==================== -->
      <section class="reid-stage">
        <div class="reid-stage-inner">
          <!--
            分组条：分组是第一层隔离（每组一套轨迹库），观测与检索都只发生在当前分组内。
            用 allow-create 允许直接敲一个新分组名 —— 分组本身没有「建库」这个动作，
            第一次观测落进去即存在，强制先建库只会多一步无意义的操作。
          -->
          <div class="reid-group">
            <el-icon class="reid-group-icon"><Collection /></el-icon>
            <span class="reid-group-label">分组</span>
            <el-select
              v-model="groups"
              class="reid-group-select"
              placeholder="选择或输入分组"
              filterable
              multiple
              collapse-tags
              allow-create
              default-first-option
              :disabled="busy"
              @change="onGroupChange"
            >
              <el-option v-for="g in groupOptions" :key="g" :label="g" :value="g" />
            </el-select>
            <span class="reid-group-hint">不同分组各有一套轨迹库，互不可见</span>
          </div>

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
                :class="{
                  'is-new': !f.matched,
                  'is-face': f.matchType === 'FACE',
                  'is-reid': f.matchType === 'REID',
                }"
                :x="f.x"
                :y="f.y"
                :width="f.width"
                :height="f.height"
                rx="18"
              ><title>{{ faceTitle(f) }}</title></rect>
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
              <!-- 分流统计：清晰脸走识别、模糊脸走重识别，两条路一起跑 -->
              <div class="reid-found-split">
                <span class="reid-split-item is-face">
                  <i class="reid-split-dot" />人脸识别 {{ observeResult.faceMatches ?? 0 }}
                </span>
                <span class="reid-split-item is-reid">
                  <i class="reid-split-dot" />重识别 {{ observeResult.reidMatches ?? 0 }}
                </span>
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
              <!-- 分流类型标注：清晰脸走人脸识别（给出姓名），模糊脸走重识别（给出轨迹） -->
              <el-tag
                v-if="c.matchType"
                :type="c.matchType === 'FACE' ? 'success' : 'info'"
                size="small"
                class="reid-card-type"
              >
                {{ c.matchType === "FACE" ? "人脸识别" : "重识别" }}
              </el-tag>
              <el-tag v-if="c.crossCamera" type="warning" size="small">跨镜</el-tag>
              <!-- 分组标注：卡片列表是按分组拉回来的，标出来用户才知道「这条属于哪一组」 -->
              <el-tag v-if="c.group" size="small" effect="plain" class="reid-card-group">{{ c.group }}</el-tag>
            </div>
            <!-- 认出的姓名（人脸识别命中时） -->
            <p v-if="c.faceName" class="reid-card-name">
              <el-icon><User /></el-icon>
              <b>{{ c.faceName }}</b>
            </p>
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
          已选分组 <b>{{ groupTags }}</b>（检索范围） · 共 <b>{{ tracks.length }}</b> 条轨迹
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
import { Aim, Collection, FolderOpened, Picture, Search, Setting, User, Warning } from "@element-plus/icons-vue";
import ReLoader from "@repo/ui/re-loader";
import { ElMessageBox } from "element-plus";
import { apiService } from "@/services/ApiService";
import { DEFAULT_GROUP, useLibraryGroups } from "@/composables/useLibraryGroups";
import type { ReidFaceBox, ReidHit, ReidObserveResult, ReidTrack } from "@/services/modules/reid.api";

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

/**
 * 当前分组。
 *
 * <p>分组是第一层隔离：观测落库、轨迹列表、检索范围、清空都只作用于它。
 * 默认 default 与后端「不带分组」的语义一致（历史数据也归属 default）。</p>
 */
const { group, groups, groupOptions, loadGroups, rememberGroups, setGroups, joinGroups } = useLibraryGroups("reid");

/** 当前检索范围（多选分组）的展示名 */
const groupTags = computed(() => {
  const list = groups.value.filter((g) => String(g ?? '').trim() !== '');
  return list.length ? list : [DEFAULT_GROUP];
});

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
      // 分流类型与姓名：FACE = 人脸识别认出了是谁，REID = 模糊脸只知轨迹
      matchType: h.matchType ?? null,
      faceName: h.faceName ?? h.track?.faceName ?? null,
      // 命中项可能不回传 group（跨分组检索时），回落到当前分组
      group: h.track?.group ?? group.value,
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
    matchType: null as "FACE" | "REID" | null,
    faceName: t.faceName ?? null,
    group: t.group ?? group.value,
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

/**
 * 检测框的悬浮说明：标出这张脸走了哪条路。
 *
 * <p>清晰人脸走人脸识别（能给出姓名），模糊人脸走重识别（只知轨迹）——
 * 框的颜色与这条说明对应，用户不必猜每个框的含义。</p>
 *
 * @param f 人脸框
 * @returns 说明文本
 */
function faceTitle(f: ReidFaceBox): string {
  const kind = f.matchType === "FACE" ? "人脸识别" : f.matchType === "REID" ? "重识别" : "待分流";
  const name = f.faceName ? ` · ${f.faceName}` : "";
  const conf = typeof f.confidence === "number" ? ` · 置信度 ${(f.confidence * 100).toFixed(0)}%` : "";
  return `${kind}${name}${conf}`;
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

/**
 * 切换分组（多选检索范围）。
 *
 * <p>多选选择器把完整的组名列表写入 {@link groups} 并调用 {@link setGroups}
 * （让 {@link group} 与第一组分选同步），这里只做副作用：手输的新分组进选项，
 * 换组 = 换了一整套轨迹库，把上一组的观测结果与命中留在屏幕上会与卡片自相矛盾，
 * 所以清空。</p>
 *
 * @param selected 选中的分组（多选时为列表，单值时为字符串，不传则沿用当前列表）
 */
async function onGroupChange(selected?: string | string[]) {
  const current = Array.isArray(selected) ? selected : (typeof selected === 'string' ? [selected] : groups.value);
  setGroups(current);
  // 已选组全部进选项（手输的新分组尤其要进，否则下次打开下拉又选不到它）
  rememberGroups(current);
  // 换组 = 换了一整套轨迹库
  searchHits.value = [];
  observeResult.value = null;
  faces.value = [];
  await loadTracks();
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
      group.value,
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
    // 多选检索范围：后端收逗号分隔，这边直接把选中的分组集合扔过去
    searchHits.value = await apiService.searchReid(lastFile.value, undefined, undefined, groups.value);
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

/** 加载选定分组的全部轨迹（多分组联合检索时合并） */
async function loadTracks() {
  const selected = joinGroups() === ''
    ? [DEFAULT_GROUP]
    : groups.value
  try {
    // 单组时回到原来的一条路，多选时逐组拉再按 trackId 合并，避免跨组轨迹重复入池
    const lists = selected.length === 1
      ? [await apiService.listReidTracks({ group: selected[0] })]
      : await Promise.all(selected.map((g) => apiService.listReidTracks({ group: g })))
    const map = new Map<string, ReidTrack>()
    for (const list of lists) {
      for (const t of list) {
        if (!map.has(t.trackId)) map.set(t.trackId, t)
      }
    }
    tracks.value = [...map.values()]
    // 轨迹里带回的分组名一并并进下拉：后端 groups 接口没列到的历史分组（或接口不可用）
    // 也不该在下拉里缺席
    rememberGroups(tracks.value.map((t) => t.group));
  } catch (e) {
    message.error(`加载轨迹失败：${(e as Error)?.message ?? e}`);
  }
}

/** 清空选定分组的全部轨迹（多选时一组一组清，绝不越界别的组） */
async function clearTracks() {
  const selected = joinGroups() === ''
    ? [DEFAULT_GROUP]
    : groups.value
  const label = selected.length === 1
    ? `所有轨迹`
    : `选定分组的 ${selected.length} 个轨迹库`
  try {
    await ElMessageBox.confirm(`确认要清空${label}吗？此动作不可恢复。`, '清空操作', {
      confirmButtonText: '清空',
      cancelButtonText: '取消',
      type: 'warning',
    })
    const results = await Promise.all(selected.map((g) => apiService.clearReidTracks(g)))
    const total = results.reduce((n, c) => n + (c ?? 0), 0)
    message.success(`已清空 ${label} 共 ${total} 条轨迹`)
    searchHits.value = [];
    observeResult.value = null;
    faces.value = [];
    await loadTracks();
  } catch {
    // 用户取消，不做任何事
  }
}

/** 跳到设置中心的「人脸重识别配置」。 */
function gotoSettings() {
  router.push({ name: "SystemSettings", params: { tab: "reid-config" } });
}

/** 初始化。 */
onMounted(async () => {
  // 先把分组选项拉回来：下拉要能列出账号下已有的分组，而不是只有 default
  await loadGroups();
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

/* ---------------- 分组条 ---------------- */
/*
 * 分组是「当前工作库」的选择器，不属于任何一次观测的参数，
 * 因此独立成条常驻在舞台顶部（不随 mode/previewUrl 显隐）。
 */
.reid-group {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border: 1px solid var(--reid-border);
  border-radius: var(--reid-radius);
  background: var(--reid-card);
}

.reid-group-icon {
  color: var(--reid-accent);
}

.reid-group-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--reid-muted);
}

.reid-group-select {
  width: 200px;
  flex: 0 0 200px;
}

.reid-group-hint {
  font-size: 12px;
  color: var(--reid-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

/*
 * 分流着色：清晰脸走人脸识别（青绿实线），模糊脸走重识别（灰蓝虚线）。
 * 两者与「新建/既有」是两个正交维度，因此都用独立类名，后写的规则优先。
 */
.reid-box.is-face {
  stroke: #10b981;
  stroke-dasharray: none;
  filter: drop-shadow(0 0 6px #10b981);
}

.reid-box.is-reid {
  stroke: #64748b;
  stroke-dasharray: 8 12;
  filter: drop-shadow(0 0 6px #64748b);
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

/* 分流统计条：两个小圆点 + 数量，颜色与图上检测框一一对应 */
.reid-found-split {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 6px;
  font-size: 12px;
  font-weight: 600;
}

.reid-split-item {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.reid-split-item.is-face {
  color: #10b981;
}

.reid-split-item.is-reid {
  color: #64748b;
}

.reid-split-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentcolor;
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

/* 分流类型标签：人脸识别（绿）/ 重识别（灰蓝） */
.reid-card-type {
  font-weight: 600;
}

/* 分组标签：纯描边，避免与「分流类型/跨镜」两个实心标签抢注意力 */
.reid-card-group {
  margin-left: auto;
  color: var(--reid-muted);
}

/* 认出的姓名：人脸识别命中时展示，回答「这个人是谁」 */
.reid-card-name {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 6px 0 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--reid-accent);
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
