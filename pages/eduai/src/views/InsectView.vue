<template>
  <div class="iw">
    <!-- 顶栏 -->
    <header class="iw__bar">
      <h1 class="iw__title">
        昆虫识图
        <span class="iw__title-dot" />
      </h1>
      <div class="iw__bar-ops">
        <span class="iw__count">{{ insects.length }} 种 · {{ orderCount }} 目</span>
        <span v-if="hiddenNoModel > 0" class="iw__count iw__count--warn" :title="`库中另有 ${hiddenNoModel} 个物种尚无 3D 建模文件，未列入名录`">
          另有 {{ hiddenNoModel }} 种未建模
        </span>
        <button type="button" class="iw__op" :disabled="!guide?.lesson?.length" @click="openDiscovery('lesson')">
          分步讲解
        </button>
        <button type="button" class="iw__op" :disabled="!guide?.quiz?.length" @click="openDiscovery('quiz')">
          小测验
        </button>
        <button type="button" class="iw__op" @click="openDiscovery('lifecycle')">生活史</button>
        <button type="button" class="iw__op" @click="surprise">随便看一只</button>
        <button type="button" class="iw__op iw__op--note" @click="noteOpen = !noteOpen">
          观察笔记<template v-if="noteCount"> ({{ noteCount }})</template>
        </button>
      </div>
    </header>

    <p v-if="loadError" class="iw__error">{{ loadError }}</p>

    <!-- 三栏工作台 -->
    <div class="iw__work">
      <InsectLibraryPanel
        class="iw__col-left"
        :insects="insects"
        :active-code="activeCode"
        :noted-codes="notedCodes"
        @select="select"
      />

      <main class="iw__col-center">
        <div class="iw__stage">
          <InsectStage3D
            v-if="activeCode"
            :insect-code="activeCode"
            :model-code="activeModelCode"
            :hotspots="stageHotspots"
            :focus-anchor="focusAnchor"
            :life-stage="lifeStage"
            :latin="insect?.insectLatin ?? ''"
            :has-part-peer="hasPartPeer"
            :part-label="partJumpLabel"
            @pick="onPickHotspot"
            @part-jump="jumpToPart"
          />
          <div v-else class="iw__stage-empty">正在载入物种…</div>
        </div>

        <!-- 动态演示 -->
        <div v-if="guide?.motion?.body" class="iw__motion">
          <span class="iw__motion-title">{{ guide.motion.title || "动态演示" }}</span>
          <p class="iw__motion-body">{{ guide.motion.body }}</p>
        </div>
      </main>

      <InsectDetailPanel
        class="iw__col-right"
        :insect="insect"
        :guide="guide"
        :life-stage="lifeStage"
        :loading="stageLoading"
        @stage="setStage"
      />
    </div>

    <!-- 观察笔记 -->
    <div v-if="noteOpen" class="iw__notes">
      <div class="iw__notes-head">
        <h3 class="iw__notes-title">观察笔记</h3>
        <button
          type="button"
          class="iw__notes-close"
          title="关闭"
          aria-label="关闭观察笔记"
          @click="noteOpen = false"
        >
          <ReIcon name="Close" :size="15" aria-hidden="true" />
        </button>
      </div>
      <textarea
        v-model="noteDraft"
        class="iw__notes-input"
        rows="4"
        :placeholder="`记下你观察 ${insect?.insectName ?? ''} 的想法…`"
      />
      <div class="iw__notes-ops">
        <button type="button" class="iw__notes-save" @click="saveNote">保存</button>
        <button type="button" class="iw__notes-copy" @click="copyNotes">复制全部（Markdown）</button>
      </div>
      <ul v-if="notedEntries.length" class="iw__notes-list">
        <li v-for="e in notedEntries" :key="e.code" class="iw__notes-item">
          <button type="button" class="iw__notes-name" @click="select(e.code)">{{ e.name }}</button>
          <p class="iw__notes-text">{{ e.text }}</p>
        </li>
      </ul>
      <p v-else class="iw__notes-empty">还没有笔记</p>
    </div>

    <!-- 讲解 / 测验 / 生活史 -->
    <InsectDiscovery
      v-if="discovery"
      :kind="discovery"
      :insect="insect"
      :guide="guide"
      :current-stage="lifeStage"
      @close="closeDiscovery"
      @focus="focusAnchor = $event"
      @stage="setStage"
      @switch="openDiscovery"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * InsectView —— 昆虫识图（3D 交互图鉴）
 *
 * 功能与流程沿用开源项目 insect-world（MIT，https://github.com/xr843/insect-world）：
 *   名录筛选 → 3D 展台（旋转/缩放/点击标注点）→ 分步讲解（镜头随步骤对位）
 *   → 小测验 → 生活史阶段模型 → 观察笔记
 *
 * 与上游的差别只有两处，都是本系统要求：
 *   1) 数据不打包在前端，改为读自己的后端（edu_insect / edu_insect_guide）；
 *   2) 视觉换成消消乐那套（--el-* 令牌、主色渐变底、白卡、胶囊按钮）。
 * 3D 建模资产（src/insect/three/builders，63 个物种 + 48 个生活史阶段模型）
 * 原样复用，未改一行几何代码。
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

import { eduaiApi } from "../api/eduaiApi";
import type {
  InsectDetail,
  InsectGuideView,
  InsectLibraryItem,
} from "../api/types";
import { partLabel } from "../components/insect/orderLabels";
import type { Hotspot } from "../insect/data/types";
import { isKnownSpecies } from "../insect/three/registry";
import type { LifeStage } from "../insect/three/stages";
import InsectLibraryPanel from "../components/insect/InsectLibraryPanel.vue";
import InsectDetailPanel from "../components/insect/InsectDetailPanel.vue";
import InsectDiscovery, { type DiscoveryKind } from "../components/insect/InsectDiscovery.vue";
import InsectStage3D from "../components/insect/InsectStage3D.vue";

const NOTES_KEY = "eduai-insect-notes";

/**
 * 某物种实际使用的 3D 建模 slug：优先复用标识，缺省用自身 slug。
 *
 * 后端 insect_model_code 允许新增物种借用已有模型（例如本地种先借用形态相近物种的模型），
 * 这样加物种不必写 three.js 建模代码。
 */
function modelSlugOf(item: { insectCode: string; insectModelCode?: string | null }): string {
  return item.insectModelCode && item.insectModelCode.trim() ? item.insectModelCode.trim() : item.insectCode;
}

/** 后端返回的全量物种（含尚未建模的） */
const rawInsects = ref<InsectLibraryItem[]>([]);
/**
 * 名录：只保留「建模文件确实存在」的物种。
 *
 * 数据层与建模层是分开推进的 —— 往 edu_insect 加一条数据，并不等于
 * pages/eduai/src/insect/three/builders/ 下就有对应的建模文件。不筛的话，
 * 名录里会出现一个点开只会报「未注册的物种」的条目。被筛掉的条数会在
 * 页面上明确告知，而不是静默消失。
 */
const insects = computed(() => rawInsects.value.filter((i) => isKnownSpecies(modelSlugOf(i))));
/** 因缺建模文件而未展示的物种数 */
const hiddenNoModel = computed(() => rawInsects.value.length - insects.value.length);

const activeCode = ref("");
const insect = ref<InsectDetail | null>(null);
const guide = ref<InsectGuideView | null>(null);
const focusAnchor = ref<string | null>(null);
const lifeStage = ref<LifeStage | null>(null);
const discovery = ref<DiscoveryKind | null>(null);
const stageLoading = ref(false);
const loadError = ref("");

/** 观察笔记：slug → 文本 */
const notes = ref<Record<string, string>>({});
const noteDraft = ref("");
const noteOpen = ref(false);

const orderCount = computed(() => new Set(insects.value.map((i) => i.insectOrder)).size);

/** 当前物种实际使用的建模 slug（复用标识优先），交给 3D 展台加载模型 */
const activeModelCode = computed(() => {
  const hit = rawInsects.value.find((i) => i.insectCode === activeCode.value);
  return hit ? modelSlugOf(hit) : null;
});
const notedCodes = computed(() => Object.keys(notes.value));
const noteCount = computed(() => notedCodes.value.length);
const notedEntries = computed(() =>
  notedCodes.value.map((code) => ({
    code,
    name: insects.value.find((i) => i.insectCode === code)?.insectName ?? code,
    text: notes.value[code] ?? "",
  })),
);

/**
 * 后端把 tone 作为普通字符串下发，而 3D 展台的 Hotspot.tone 是字面量联合。
 * 这里收敛一次，认不出的色调退回主色，避免展台拿到非法值。
 */
const stageHotspots = computed<Hotspot[]>(() => {
  const tones = new Set(["coral", "sage", "amber", "lavender"]);
  return (insect.value?.insectHotspots ?? []).map((h) => ({
    id: String(h.id ?? h.anchor),
    label: String(h.label ?? ""),
    note: String(h.note ?? ""),
    anchor: String(h.anchor ?? ""),
    tone: (tones.has(String(h.tone)) ? String(h.tone) : "coral") as Hotspot["tone"],
  }));
});

// ==================== 数据 ====================
async function loadLibrary() {
  try {
    rawInsects.value = (await eduaiApi.insectLibrary()) ?? [];
    if (!rawInsects.value.length) {
      loadError.value = "昆虫库为空：请确认后端已执行 edu_insect 种子数据";
      return;
    }
    if (!insects.value.length) {
      loadError.value =
        `昆虫库有 ${rawInsects.value.length} 条数据，但没有任何一个物种的 3D 建模文件存在，` +
        `无法展示。请检查 pages/eduai/src/insect/three/builders/ 下是否有对应 slug 的建模文件。`;
      return;
    }
    loadError.value = "";
    if (!activeCode.value) await select(insects.value[0].insectCode);
  } catch (e) {
    loadError.value = `名录加载失败：${e instanceof Error ? e.message : String(e)}`;
  }
}

async function select(code: string) {
  if (code === activeCode.value) return;
  activeCode.value = code;
  // 换物种必须复位讲解步骤与生活史：阶段模型是逐物种做的，
  // 停在「蛹」上切到没有蛹的物种会直接抛「未注册的生活史阶段」
  closeDiscovery();
  lifeStage.value = null;
  focusAnchor.value = null;
  noteDraft.value = notes.value[code] ?? "";
  await loadStage(code);
}

async function loadStage(code: string) {
  stageLoading.value = true;
  try {
    const view = await eduaiApi.insectStage(code);
    insect.value = view?.insect ?? null;
    guide.value = view?.guide ?? null;
  } catch (e) {
    insect.value = null;
    guide.value = null;
    message.error(`物种详情加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    stageLoading.value = false;
  }
}

// ==================== 交互 ====================
/**
 * 点击标注点：展开/收起说明卡，同时把镜头对到该部位。
 *
 * `open` 由展台算好后传上来（卡片与镜头必须同源），这里只负责落状态，
 * 不再自己 toggle —— 之前两边各自翻转，中间被讲解步骤改过 focusAnchor 就会错位。
 *
 * @param h    被点击的标注点
 * @param open true=展开并聚焦，false=收起并退回全身取景
 */
function onPickHotspot(h: Hotspot, open: boolean) {
  focusAnchor.value = open ? h.anchor : null;
}

/** 同部位还有别的虫时，给出跳转入口 */
function hasPartPeer(anchor: string): boolean {
  return peersWithPart(anchor).length > 0;
}

/**
 * 名录里除当前物种外，还有哪些物种带这个部位。
 *
 * 依赖 /all 返回的 anchors（每个物种自己的锚点全集），
 * 早先这里只会返回「名录不只一条」——于是每只虫都显示跳转入口，
 * 点进去却跳到一只跟该部位毫无关系的虫。
 *
 * @param anchor 部位锚点
 * @returns 带该部位的物种（不含当前选中的）
 */
function peersWithPart(anchor: string): InsectLibraryItem[] {
  return insects.value.filter((i) => i.insectCode !== activeCode.value && (i.anchors ?? []).includes(anchor));
}

function partJumpLabel(anchor: string): string {
  return partLabel(anchor) || "该部位";
}

/**
 * 跳到「同样有该部位」的下一只虫，并把镜头对到该部位。
 *
 * 从当前物种在名录里的位置往后找、到末尾回绕，取第一个带该部位的物种。
 *
 * @param anchor 部位锚点
 */
async function jumpToPart(anchor: string) {
  const peers = peersWithPart(anchor);
  if (!peers.length) return;
  const all = insects.value;
  const from = all.findIndex((x) => x.insectCode === activeCode.value);
  const after = all.slice(from + 1).concat(all.slice(0, Math.max(0, from)));
  const next = after.find((i) => (i.anchors ?? []).includes(anchor)) ?? peers[0];
  await select(next.insectCode);
  // 换物种后镜头对到同一部位；对方没有这个部位时展台会自动退回全身取景
  focusAnchor.value = anchor;
}

function setStage(stage: LifeStage) {
  lifeStage.value = lifeStage.value === stage ? null : stage;
}

function openDiscovery(kind: DiscoveryKind) {
  discovery.value = kind;
}

function closeDiscovery() {
  discovery.value = null;
  focusAnchor.value = null;
  lifeStage.value = null;
}

function surprise() {
  if (!insects.value.length) return;
  const i = insects.value.findIndex((x) => x.insectCode === activeCode.value);
  // 按索引推进而非随机：连点两次不会撞回同一只
  const n = insects.value[((i < 0 ? 0 : i) * 5 + 3) % insects.value.length];
  void select(n.insectCode);
}

// ==================== 笔记 ====================
function loadNotes() {
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (raw) notes.value = JSON.parse(raw);
  } catch {
    /* ignore */
  }
}

function saveNote() {
  const code = activeCode.value;
  if (!code) return;
  const text = noteDraft.value.trim();
  const next = { ...notes.value };
  if (text) next[code] = text;
  else delete next[code];
  notes.value = next;
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(next));
    message.success(text ? "笔记已保存" : "笔记已清空");
  } catch {
    /* ignore */
  }
}

function copyNotes() {
  const md = notedEntries.value
    .map((e) => `## ${e.name}\n\n${e.text}\n`)
    .join("\n---\n\n");
  void navigator.clipboard
    ?.writeText(`# 昆虫观察笔记\n\n${md}`)
    .then(() => message.success("已复制到剪贴板"))
    .catch(() => message.warning("剪贴板不可用"));
}

// ==================== 键盘：上下翻图鉴 ====================
function onKey(e: KeyboardEvent) {
  const el = e.target as HTMLElement | null;
  if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
  if (discovery.value || noteOpen.value) return;
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  if (!insects.value.length) return;
  e.preventDefault();
  const delta = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
  const i = insects.value.findIndex((x) => x.insectCode === activeCode.value);
  const n = insects.value[(i + delta + insects.value.length) % insects.value.length];
  void select(n.insectCode);
}

onMounted(() => {
  loadNotes();
  void loadLibrary();
  document.addEventListener("keydown", onKey);
});

onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
});

// 切物种时把笔记草稿同步过去
watch(activeCode, (code) => {
  noteDraft.value = notes.value[code] ?? "";
});
</script>

<style scoped>
.iw {
  min-height: 100%;
  padding: 18px 20px 24px;
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* 顶栏 */
.iw__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}
.iw__title {
  margin: 0;
  /* 与基准 .ig-title 同为 40px。此前这里是 30px（且没跟着窄屏收），
     六个内嵌模块里只有它不是 40px，一眼就能看出不是同一套标题层级。 */
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  /* 白字压在主色带上，靠描边阴影保证可读性；暗色模式色带更深，阴影同样跟随 */
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.iw__title-dot {
  width: 12px;
  height: 12px;
  /* 纯圆点用圆形令牌，不占 --el-radius-* 六档（那六档是圆角矩形语义） */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-white);
  /* 装饰性光环（0 偏移 0 模糊），不是卡片投影：只描一圈主色，压在主色底上略深 */
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
.iw__bar-ops {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.iw__count {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-white);
  opacity: 0.9;
  margin-right: 4px;
  font-variant-numeric: tabular-nums;
}
.iw__count--warn {
  background: var(--el-color-warning);
  border-radius: var(--el-radius-full, 9999px);
  padding: 3px 10px;
  opacity: 1;
  cursor: help;
}
.iw__op {
  height: 34px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  border: 0;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  /* 原 slate 投影去掉：按钮压在主色渐变底上，白底 + 主色字已经足够跳出来；
     浮起反馈只留给 :hover */
  outline: none;
  transition:
    transform var(--el-transition-duration-fast, 0.2s) ease,
    opacity var(--el-transition-duration-fast, 0.2s) ease;
}
.iw__op:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px color-mix(in srgb, var(--el-color-black) 22%, transparent);
}
.iw__op:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.iw__op:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.iw__op--note {
  background: var(--el-color-warning);
  color: var(--el-color-white);
}

.iw__error {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-white);
  background: var(--el-color-danger);
  border-radius: var(--el-radius-lg, 12px);
  padding: 10px 14px;
}

/* 三栏工作台 */
.iw__work {
  display: grid;
  grid-template-columns: clamp(200px, 22vw, 280px) minmax(0, 1fr) clamp(240px, 26vw, 340px);
  gap: 16px;
  align-items: start;
}
.iw__col-center {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
}
.iw__stage {
  height: min(64vh, 620px);
  min-height: 380px;
}
.iw__stage-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 原 18px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  /* koi 卡片不加投影：改用边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}

.iw__motion {
  background: var(--el-bg-color);
  /* 原 18px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 12px 16px;
  /* koi 卡片不加投影：改用边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.iw__motion-title {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: var(--el-radius-sm, 6px);
  padding: 1px 8px;
  margin-bottom: 6px;
}
.iw__motion-body {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

/* 观察笔记 */
.iw__notes {
  background: var(--el-bg-color);
  /* 原 20px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px 18px;
  /* koi 卡片不加投影：改用边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.iw__notes-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.iw__notes-title {
  margin: 0;
  font-size: 16px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.iw__notes-close {
  border: 0;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  font-size: 15px;
  /* 换成 ReIcon 后需要 flex 容器让图标居中 */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.iw__notes-close:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.iw__notes-input {
  width: 100%;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  resize: vertical;
  outline: none;
}
.iw__notes-input:focus {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.iw__notes-ops {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}
.iw__notes-save,
.iw__notes-copy {
  height: 32px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  border: 0;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.iw__notes-save:focus-visible,
.iw__notes-copy:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.iw__notes-save {
  background: var(--el-color-primary);
  color: var(--el-color-white);
}
.iw__notes-copy {
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.iw__notes-list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.iw__notes-item {
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
  padding: 9px 12px;
}
.iw__notes-name {
  border: 0;
  background: transparent;
  padding: 0;
  font-size: 13px;
  font-weight: 900;
  color: var(--el-color-primary);
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.iw__notes-name:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.iw__notes-text {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
}
.iw__notes-empty {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 响应式：保持左右结构，只收窄列宽 */
@media (max-width: 1280px) {
  .iw__work {
    grid-template-columns: clamp(170px, 20vw, 240px) minmax(0, 1fr) clamp(210px, 23vw, 290px);
    gap: 12px;
  }
}
@media (max-width: 980px) {
  .iw__work {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }
  .iw__col-center {
    grid-column: 1 / -1;
    order: -1;
  }
  .iw__stage {
    height: min(52vh, 460px);
  }
}

/*
 * 宽屏三栏：给名录面板封顶，让内容在可视区内收尾。
 *
 * 背景：这轮把标题从 30px 提到基准的 40px 后，1440x900 冒出 12px「幽灵滚」
 * （.portal-embed__body 能滚但只多 12px，用户滚了半天什么都没发生）。
 * 逐层量下来根因是 .ilp__list 的 max-height: 52vh —— 52vh 是拍脑袋的定值，
 * 它没扣掉名录面板自身的 chrome（头 24px + 筛选 130px + 搜索 32px + 间距/内边距），
 * 也没扣掉 .iw 顶栏（标题升档后 46px→56px）。实测：把列表上限压到 ≤456px，
 * body 溢出正好归零（900px 视口下 52vh=468px，多出的就是那 12px）。
 *
 * 修法不是把 52vh 换成另一个魔法数，而是给「面板」封顶而不是给「列表」封顶：
 * 面板内部 .ilp__list 本来就是 flex:1 1 auto + overflow-y:auto，面板一封顶，
 * 列表会自动缩到剩余空间（`.ilp` 也有 min-height:0 配合），不用知道 chrome 有多少。
 * 数值沿用右栏 .idp 早就有的 78vh —— 同一屏里左右两块用同一个上限才是一套规格。
 *
 * 只在宽屏三栏时封：窄屏 / 矮屏下三栏已折成两栏、面板本来就该整块滚，
 * 硬封顶会把内容挤到面板内部装不下（实测 390x844 与 844x390 下面板裁切 18~99px）。
 */
@media (min-width: 981px) and (min-height: 760px) {
  .iw__col-left {
    max-height: 78vh;
  }
}

/*
 * 窄屏（≤640px）：标题收到 28px。
 * 顶栏 .iw__bar 右侧还有「N 种 · M 目」+ 5 个操作按钮，40px 标题 + 操作区
 * 在 390px 宽下会把操作区挤到换行，所以必须给标题一档收窄值，
 * 和成语接龙/汉字识字用同一个断点与同一个 28px 档位。
 */
@media (max-width: 640px) {
  .iw {
    padding: 14px 14px 20px;
  }
  .iw__title {
    font-size: 28px;
    letter-spacing: 2px;
  }
  .iw__bar {
    gap: 10px;
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .iw__op {
    transition: none;
  }
  /* 位移也是动效：关掉后 :hover 只剩投影反馈 */
  .iw__op:hover:not(:disabled) {
    transform: none;
  }
}
</style>
