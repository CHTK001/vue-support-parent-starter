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
        <button type="button" class="iw__notes-close" @click="noteOpen = false">✕</button>
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
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
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
    ElMessage.error(`物种详情加载失败：${e instanceof Error ? e.message : String(e)}`);
  } finally {
    stageLoading.value = false;
  }
}

// ==================== 交互 ====================
function onPickHotspot(h: Hotspot) {
  // 再点同一个则收起
  focusAnchor.value = focusAnchor.value === h.anchor ? null : h.anchor;
}

/** 同部位还有别的虫时，给出跳转入口 */
function hasPartPeer(anchor: string): boolean {
  if (!activeCode.value) return false;
  const i = insects.value.findIndex((x) => x.insectCode === activeCode.value);
  if (i < 0) return false;
  // 名录是轻量的，拿不到热点，只能按「下一只是否有同部位」粗判：
  // 保守返回 true 让展台显示入口，跳转时由后端 anchor 校验兜底
  return insects.value.length > 1;
}

function partJumpLabel(anchor: string): string {
  return partLabel(anchor) || "该部位";
}

async function jumpToPart(anchor: string) {
  if (!activeCode.value) return;
  const i = insects.value.findIndex((x) => x.insectCode === activeCode.value);
  if (i < 0) return;
  const next = insects.value[(i + 1) % insects.value.length];
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
    ElMessage.success(text ? "笔记已保存" : "笔记已清空");
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
    .then(() => ElMessage.success("已复制到剪贴板"))
    .catch(() => ElMessage.warning("剪贴板不可用"));
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
  font-size: 30px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
}
.iw__title-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--el-color-white);
  box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb), 0.35);
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
  border-radius: 999px;
  padding: 3px 10px;
  opacity: 1;
  cursor: help;
}
.iw__op {
  height: 34px;
  padding: 0 16px;
  border-radius: 999px;
  border: 0;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.18);
  transition: transform 0.15s, opacity 0.15s;
}
.iw__op:hover:not(:disabled) {
  transform: translateY(-1px);
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
  border-radius: 12px;
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
  border-radius: 18px;
  background: var(--el-bg-color);
  color: var(--el-text-color-secondary);
  font-size: 14px;
  box-shadow: var(--el-box-shadow);
}

.iw__motion {
  background: var(--el-bg-color);
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: var(--el-box-shadow);
}
.iw__motion-title {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
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
  border-radius: 20px;
  padding: 16px 18px;
  box-shadow: var(--el-box-shadow);
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
}
.iw__notes-input {
  width: 100%;
  border-radius: 12px;
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
  border-radius: 999px;
  border: 0;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
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
  border-radius: 12px;
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
</style>
