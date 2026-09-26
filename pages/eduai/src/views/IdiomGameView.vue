<template>
  <div class="ig-page">
    <!-- ==================== ① 设置页 ==================== -->
    <div v-if="!gameStarted" class="ig-setup">
      <header class="ig-setup__head">
        <h1 class="ig-title">
          成语消消乐
          <span class="ig-title__dot" />
        </h1>
        <div class="ig-today">
          <span class="ig-today__label">今日挑战</span>
          <span class="ig-today__value">{{ todayPlays }}/{{ DAILY_GOAL }}</span>
        </div>
      </header>

      <div class="ig-setup__body">
        <!-- 设置卡 -->
        <section class="ig-card ig-card--settings">
          <h3 class="ig-card__title"><span class="ig-dot" />设置卡</h3>

          <div class="ig-field">
            <span class="ig-field__label">选择学段</span>
            <div class="ig-chips">
              <button
                v-for="lv in GRADE_LEVELS"
                :key="lv"
                type="button"
                class="ig-chip"
                :class="{ 'is-active': selectedGradeLevel === lv }"
                @click="selectedGradeLevel = lv"
              >
                {{ lv }}
              </button>
            </div>
          </div>

          <div class="ig-field">
            <span class="ig-field__label">选择年级</span>
            <div class="ig-chips ig-chips--wrap">
              <button
                v-for="g in gradeOptions"
                :key="g"
                type="button"
                class="ig-chip"
                :class="{ 'is-active': selectedGrade === g }"
                @click="selectedGrade = g"
              >
                {{ g }}
              </button>
            </div>
          </div>

          <div class="ig-field ig-field--row">
            <span class="ig-field__label">题目数量</span>
            <div class="ig-count">
              <el-slider v-model="gameCount" :min="5" :max="20" :step="5" :show-tooltip="false" />
              <span class="ig-count__bubble">{{ gameCount }}</span>
            </div>
          </div>

          <div class="ig-field ig-field--row">
            <span class="ig-field__label">难度选择</span>
            <div class="ig-radios">
              <label v-for="d in DIFFICULTY_OPTIONS" :key="d.value" class="ig-radio">
                <input v-model="difficulty" type="radio" :value="d.value" />
                <span class="ig-radio__mark" />
                <span class="ig-radio__text">{{ d.label }}</span>
              </label>
            </div>
          </div>

          <button type="button" class="ig-start" :disabled="loading" @click="startGame">
            {{ loading ? "生成中…" : "开始游戏" }}
          </button>
        </section>

        <!-- 今日推荐成语 -->
        <section class="ig-card ig-card--recommend">
          <h3 class="ig-card__title ig-card__title--center">今日推荐成语</h3>
          <div v-if="recommendList.length" class="ig-recommend">
            <article v-for="(item, idx) in recommendList" :key="item.idiomId" class="ig-rec">
              <span class="ig-rec__badge" :class="`is-${idx % 3}`">{{ REC_BADGES[idx % 3] }}</span>
              <div class="ig-rec__main">
                <div class="ig-rec__top">
                  <span class="ig-rec__name">{{ item.idiomContent }}</span>
                  <span class="ig-rec__meaning-tag">释义</span>
                </div>
                <div class="ig-rec__pinyin">{{ item.idiomPinyin }}</div>
                <div class="ig-rec__meaning">{{ item.idiomMeaning }}</div>
              </div>
            </article>
          </div>
          <el-empty v-else :image-size="70" description="暂无推荐（成语库为空）" />
        </section>

        <!-- 我的战绩 -->
        <section class="ig-card ig-card--stats">
          <h3 class="ig-card__title"><span class="ig-dot ig-dot--green" />我的战绩</h3>
          <div class="ig-stat">
            <div class="ig-stat__head">
              <span class="ig-stat__label">累计得分</span>
              <span class="ig-stat__value">{{ stats.totalScore }}</span>
            </div>
            <div class="ig-bar"><span class="ig-bar__fill" :style="{ width: barWidth(stats.totalScore, 2000) }" /></div>
          </div>
          <div class="ig-stat">
            <div class="ig-stat__head">
              <span class="ig-stat__label">通关次数</span>
              <span class="ig-stat__value">{{ stats.plays }}</span>
            </div>
            <div class="ig-bar"><span class="ig-bar__fill" :style="{ width: barWidth(stats.plays, 30) }" /></div>
          </div>
          <div class="ig-stat">
            <div class="ig-stat__head">
              <span class="ig-stat__label">最佳用时</span>
              <span class="ig-stat__value">{{ stats.bestTime ? formatSec(stats.bestTime) : "--:--" }}</span>
            </div>
            <div class="ig-bar"><span class="ig-bar__fill" :style="{ width: stats.bestTime ? '100%' : '0%' }" /></div>
          </div>

          <div class="ig-rank">
            <div class="ig-rank__title">排行榜</div>
            <div class="ig-rank__badge">{{ rankNo }}</div>
            <div class="ig-rank__label">本周排名</div>
          </div>
        </section>
      </div>
    </div>

    <!-- ==================== ② 游戏页 ==================== -->
    <div v-else-if="!gameCompleted" class="ig-play">
      <!-- 左侧栏 -->
      <aside class="ig-side">
        <h1 class="ig-title ig-title--left">
          成语消消乐
          <span class="ig-title__dot" />
        </h1>

        <div class="ig-side__level">{{ selectedGradeLevel }}{{ selectedGrade }}</div>

        <div class="ig-cleared">
          <div class="ig-cleared__title">已度消除</div>
          <div class="ig-cleared__grid">
            <div v-for="item in clearedList" :key="'c-' + item.idiomId" class="ig-cleared__item">
              <span class="ig-cleared__text">{{ item.idiom }}</span>
              <span class="ig-cleared__check">✓</span>
            </div>
            <div v-for="n in placeholderCount" :key="'p-' + n" class="ig-cleared__item is-empty" />
          </div>
        </div>

        <div class="ig-side__clock">
          <div class="ig-clock">{{ elapsedText }}</div>
          <div class="ig-clock__score">计分 {{ score }}分</div>
        </div>
      </aside>

      <!-- 右侧棋盘 -->
      <main class="ig-main">
        <div class="ig-board-head">
          <div class="ig-target">
            请找出：<span class="ig-target__name">{{ hintIdiom || "全部消除" }}</span>
            <span class="ig-target__icons">💛🔥</span>
          </div>
          <button type="button" class="ig-close" title="退出" @click="exitGame">✕</button>
        </div>

        <div class="ig-board" :class="`ig-board--${columns}`">
          <button
            v-for="t in tiles"
            :key="t.id"
            type="button"
            class="ig-tile"
            :class="{
              'is-selected': selectedId === t.id,
              'is-matched': t.matched,
              'is-wrong': wrongIds.includes(t.id),
              'is-hint': hintTileIds.includes(t.id),
            }"
            :disabled="t.matched"
            @click="onTileClick(t)"
          >
            {{ t.text }}
          </button>
        </div>

        <div class="ig-board-foot">
          <button type="button" class="ig-btn ig-btn--ghost" :disabled="!history.length" @click="undo">
            <el-icon><RefreshLeft /></el-icon> 撤销
          </button>
          <button type="button" class="ig-btn ig-btn--primary" @click="restart">
            <el-icon><RefreshRight /></el-icon> 重新开始
          </button>
        </div>
      </main>
    </div>

    <!-- ==================== ③ 结算页 ==================== -->
    <div v-else class="ig-result-wrap">
      <section class="ig-result">
        <button type="button" class="ig-close ig-close--result" title="关闭" @click="exitGame">✕</button>
        <div class="ig-result__trophy">🏆</div>
        <h2 class="ig-result__title">挑战成功！</h2>
        <p class="ig-result__sub">{{ selectedGradeLevel }}{{ selectedGrade }} · 全部成语已消除</p>

        <div class="ig-result__stats">
          <div class="ig-result__stat">
            <div class="ig-result__stat-label">— 用时 —</div>
            <div class="ig-result__stat-value">{{ elapsedText }}</div>
          </div>
          <div class="ig-result__stat">
            <div class="ig-result__stat-label">— 得分 —</div>
            <div class="ig-result__stat-value">{{ score }}</div>
          </div>
          <div class="ig-result__stat">
            <div class="ig-result__stat-label">— 正确率 —</div>
            <div class="ig-result__stat-value">{{ accuracy }}%</div>
          </div>
        </div>

        <div class="ig-result__list">
          <div class="ig-result__list-title">— 本次消除的成语 —</div>
          <div class="ig-result__tags">
            <span v-for="item in clearedList" :key="'r-' + item.idiomId" class="ig-result__tag">
              ✔️{{ item.idiom }}
            </span>
          </div>
        </div>

        <div class="ig-result__ops">
          <button type="button" class="ig-btn ig-btn--outline" @click="goHome">返回首页</button>
          <button type="button" class="ig-btn ig-btn--gradient" @click="restart">再来一局</button>
        </div>
      </section>
    </div>

    <!-- 学习卡片覆盖层：独立弹窗被拦截或处于 iframe 时使用（隐藏框架外壳，视觉上等同新页面） -->
    <div v-if="learnVisible" class="ig-learn-overlay">
      <IdiomLearnCards :cards="learnCards" @close="closeLearnOverlay" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * IdiomGameView —— 成语消消乐（配对消除玩法，按三张 UI 图实现）
 *
 * 玩法：每个成语拆两半（守株｜待兔）→ 2N 个方块打乱；点两块能拼成同一成语即消除，
 * 错误点击闪红抖动；支持撤销（回退最近一次消除）、重新开始；全部消除后结算（用时/得分/正确率）。
 *
 * 设置页：学段/年级胶囊、数量滑块、难度单选、今日推荐成语、我的战绩（本地统计）。
 * 样式全部使用 koi / Element Plus 变量（--el-*）。
 */
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { RefreshLeft, RefreshRight } from "@element-plus/icons-vue";
import { eduaiApi } from "../api/eduaiApi";
import type { Idiom, IdiomGameData } from "../api/types";
import IdiomLearnCards, { type LearnCard } from "../components/IdiomLearnCards.vue";

const router = useRouter();

/** 学段与对应年级（与成语库入库值保持一致） */
const GRADE_LEVELS = ["小学", "初中", "高中"] as const;
const GRADES_BY_LEVEL: Record<string, string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
};

const DIFFICULTY_OPTIONS = [
  { label: "简单", value: "easy" },
  { label: "普通", value: "normal" },
  { label: "困难", value: "hard" },
] as const;

const REC_BADGES = ["捧", "捧", "捧"];
const DAILY_GOAL = 6;

const selectedGradeLevel = ref<string>("小学");
const selectedGrade = ref<string>("一年级");
const gradeOptions = computed(() => GRADES_BY_LEVEL[selectedGradeLevel.value] ?? []);

watch(selectedGradeLevel, (lv) => {
  const list = GRADES_BY_LEVEL[lv] ?? [];
  if (!list.includes(selectedGrade.value)) {
    selectedGrade.value = list[0] ?? "";
  }
});

const gameCount = ref(10);
const difficulty = ref<string>("normal");
const loading = ref(false);
const gameStarted = ref(false);
const gameCompleted = ref(false);
const gameData = ref<IdiomGameData | null>(null);
const score = ref(0);
const usingMock = ref(false);
const wrongCount = ref(0);
/** 学习卡片覆盖层（独立弹窗被拦截时的兜底） */
const learnVisible = ref(false);
const learnCards = ref<LearnCard[]>([]);

/** 演示数据（成语库为空时使用） */
const MOCK_GAME: IdiomGameData = {
  totalItems: 6,
  gradeLevel: "小学",
  grade: "一年级",
  items: [
    { idiomId: -1, content: "守株待兔", pinyin: "shǒu zhū dài tù", meaning: "比喻死守狭隘经验，不知变通", difficulty: 1, tags: "" },
    { idiomId: -2, content: "画蛇添足", pinyin: "huà shé tiān zú", meaning: "比喻做了多余的事，反而把事情弄糟", difficulty: 1, tags: "" },
    { idiomId: -3, content: "亡羊补牢", pinyin: "wáng yáng bǔ láo", meaning: "出了问题及时补救，还不算晚", difficulty: 1, tags: "" },
    { idiomId: -4, content: "掩耳盗铃", pinyin: "yǎn ěr dào líng", meaning: "比喻自己欺骗自己，明明掩盖不住", difficulty: 1, tags: "" },
    { idiomId: -5, content: "井底之蛙", pinyin: "jǐng dǐ zhī wā", meaning: "比喻见识狭窄、眼界不开阔的人", difficulty: 2, tags: "" },
    { idiomId: -6, content: "拔苗助长", pinyin: "bá miáo zhù zhǎng", meaning: "比喻违反事物规律，急于求成", difficulty: 2, tags: "" },
  ],
  distractorPinyin: [],
  distractorMeanings: [],
};

// ==================== 方块 ====================
interface Tile {
  id: number;
  idiomId: number;
  idiom: string;
  part: "head" | "tail";
  text: string;
  matched: boolean;
}

const tiles = ref<Tile[]>([]);
const selectedId = ref<number | null>(null);
const wrongIds = ref<number[]>([]);
const matchedPairs = ref(0);
const history = ref<{ ids: [number, number]; idiomId: number }[]>([]);

const totalPairs = computed(() => gameData.value?.items?.length ?? 0);
const clearedList = computed(() => {
  const items = gameData.value?.items ?? [];
  const matchedIds = new Set(tiles.value.filter((t) => t.matched).map((t) => t.idiomId));
  return items.filter((i) => matchedIds.has(i.idiomId)).map((i) => ({ idiomId: i.idiomId, idiom: i.content }));
});
const placeholderCount = computed(() => Math.max(0, Math.min(8, totalPairs.value - clearedList.value.length)));

/** 提示：优先提示未消除的第一个成语（虚线框其两块） */
const hintIdiom = computed(() => {
  const next = (gameData.value?.items ?? []).find((i) =>
    tiles.value.some((t) => t.idiomId === i.idiomId && !t.matched),
  );
  return next?.content ?? "";
});
const hintTileIds = computed(() => {
  const next = (gameData.value?.items ?? []).find((i) =>
    tiles.value.some((t) => t.idiomId === i.idiomId && !t.matched),
  );
  if (!next) return [];
  return tiles.value.filter((t) => t.idiomId === next.idiomId && !t.matched).map((t) => t.id);
});

const columns = computed(() => (tiles.value.length > 24 ? 5 : 4));

function splitIdiom(content: string): [string, string] {
  const chars = Array.from(content || "");
  const mid = Math.ceil(chars.length / 2);
  return [chars.slice(0, mid).join(""), chars.slice(mid).join("")];
}

function buildTiles() {
  const items = gameData.value?.items ?? [];
  const list: Tile[] = [];
  items.forEach((item, idx) => {
    const [head, tail] = splitIdiom(item.content);
    list.push({ id: idx * 2, idiomId: item.idiomId, idiom: item.content, part: "head", text: head, matched: false });
    list.push({ id: idx * 2 + 1, idiomId: item.idiomId, idiom: item.content, part: "tail", text: tail, matched: false });
  });
  tiles.value = shuffleArray(list);
  selectedId.value = null;
  wrongIds.value = [];
  matchedPairs.value = 0;
  history.value = [];
  wrongCount.value = 0;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// ==================== 计时 ====================
const elapsedSec = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

const elapsedText = computed(() => formatSec(elapsedSec.value));

function formatSec(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function startTimer() {
  stopTimer();
  elapsedSec.value = 0;
  timer = setInterval(() => {
    elapsedSec.value += 1;
  }, 1000);
}
function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

// ==================== 交互 ====================
function onTileClick(tile: Tile) {
  if (tile.matched) return;

  if (selectedId.value === tile.id) {
    selectedId.value = null;
    return;
  }

  if (selectedId.value === null) {
    selectedId.value = tile.id;
    return;
  }

  const first = tiles.value.find((t) => t.id === selectedId.value);
  if (!first) {
    selectedId.value = tile.id;
    return;
  }

  const isPair = first.idiomId === tile.idiomId && first.part !== tile.part;
  if (isPair) {
    first.matched = true;
    tile.matched = true;
    selectedId.value = null;
    matchedPairs.value += 1;
    score.value += 10;
    history.value.push({ ids: [first.id, tile.id], idiomId: first.idiomId });

    if (matchedPairs.value >= totalPairs.value) {
      stopTimer();
      window.setTimeout(finishGame, 450);
    }
    return;
  }

  wrongCount.value += 1;
  const firstId = first.id;
  wrongIds.value = [firstId, tile.id];
  selectedId.value = null;
  window.setTimeout(() => {
    wrongIds.value = [];
  }, 500);
  // 配对错误 → 直接弹出学习卡片（两块各自所属的成语）
  openLearnCards([first, tile]);
}

/** 弹出成语学习卡片：优先独立窗口；被拦截（或处于 iframe）时用站内全屏覆盖层，保证一定弹得出来 */
function openLearnCards(picked: Tile[]) {
  const items = gameData.value?.items ?? [];
  const cards = picked.map((t) => {
    const hit = items.find((i) => i.content === t.idiom);
    return {
      content: t.idiom,
      pinyin: hit?.pinyin ?? "",
      meaning: hit?.meaning ?? "",
      source: "",
      example: "",
    };
  });
  const ids = picked.map((t) => t.idiomId).filter((id) => id > 0);
  const names = picked.map((t) => t.idiom);
  try {
    sessionStorage.setItem("eduai-idiom-learn", JSON.stringify(cards));
  } catch {
    /* ignore */
  }
  // 新窗口拿不到本标签页的 sessionStorage，故把 ids/names 一并带上（页面据 ids 拉详情、names 兜底）
  const params = new URLSearchParams();
  if (ids.length) params.set("ids", ids.join(","));
  params.set("names", names.join(","));
  const url = `/edu/fun/idiom-card?${params.toString()}`;

  // 1) 尝试独立弹窗（正常浏览器 + 用户点击时生效）
  const inIframe = window.self !== window.top;
  let opened: Window | null = null;
  // 演示数据没有真实 id，新窗口取不到释义/出处，直接用覆盖层保证信息完整
  if (!inIframe && ids.length) {
    try {
      opened = window.open(url, "eduai-idiom-learn", "width=820,height=720,resizable=yes,scrollbars=yes");
    } catch {
      opened = null;
    }
  }
  if (opened) {
    return;
  }

  // 2) 弹窗被拦截 / iframe 内：站内全屏覆盖层（隐藏框架外壳，视觉上等同新页面）
  void enrichLearnCards(cards);
  learnCards.value = cards;
  learnVisible.value = true;
  document.documentElement.classList.add("main-maximize");
}

/** 覆盖层模式：按真实成语 id 补齐出处/例句 */
async function enrichLearnCards(cards: { content: string; pinyin: string; meaning: string; source: string; example: string }[]) {
  const ids = (gameData.value?.items ?? [])
    .filter((i) => cards.some((c) => c.content === i.content) && i.idiomId > 0)
    .map((i) => i.idiomId);
  if (!ids.length) return;
  const details = await Promise.all(ids.map((id) => eduaiApi.getIdiomDetail(id).catch(() => null)));
  details.forEach((detail) => {
    if (!detail) return;
    const hit = cards.find((c) => c.content === detail.idiomContent);
    if (!hit) return;
    hit.pinyin = detail.idiomPinyin || hit.pinyin;
    hit.meaning = detail.idiomMeaning || hit.meaning;
    hit.source = detail.idiomSource || hit.source;
    hit.example = detail.idiomExample || hit.example;
  });
  learnCards.value = [...cards];
}

function closeLearnOverlay() {
  learnVisible.value = false;
  document.documentElement.classList.remove("main-maximize");
}

/** 撤销：回退最近一次消除（恢复方块并扣回分数） */
function undo() {
  const last = history.value.pop();
  if (!last) return;
  tiles.value.forEach((t) => {
    if (last.ids.includes(t.id)) t.matched = false;
  });
  matchedPairs.value = Math.max(0, matchedPairs.value - 1);
  score.value = Math.max(0, score.value - 10);
}

// ==================== 本地战绩 ====================
interface Stats {
  totalScore: number;
  plays: number;
  bestTime: number;
  todayDate: string;
  todayPlays: number;
}
const STATS_KEY = "eduai-idiom-stats";
const stats = ref<Stats>({ totalScore: 0, plays: 0, bestTime: 0, todayDate: "", todayPlays: 0 });

const todayKey = () => new Date().toISOString().slice(0, 10);
const todayPlays = computed(() => (stats.value.todayDate === todayKey() ? stats.value.todayPlays : 0));
const rankNo = computed(() => Math.max(1, 12 - Math.floor(stats.value.totalScore / 200)));

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) stats.value = { ...stats.value, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats.value));
  } catch {
    /* ignore */
  }
}

const barWidth = (value: number, max: number) => `${Math.min(100, Math.round((value / max) * 100))}%`;

const accuracy = computed(() => {
  const total = totalPairs.value + wrongCount.value;
  if (!total) return 100;
  return Math.round((totalPairs.value / total) * 100);
});

function finishGame() {
  gameCompleted.value = true;
  stats.value.totalScore += score.value;
  stats.value.plays += 1;
  const t = elapsedSec.value;
  if (!stats.value.bestTime || t < stats.value.bestTime) stats.value.bestTime = t;
  if (stats.value.todayDate !== todayKey()) {
    stats.value.todayDate = todayKey();
    stats.value.todayPlays = 0;
  }
  stats.value.todayPlays += 1;
  saveStats();
}

// ==================== 推荐成语 ====================
const recommendList = ref<Idiom[]>([]);

async function loadRecommend() {
  try {
    const list = await eduaiApi.listIdioms({ gradeLevel: selectedGradeLevel.value, grade: selectedGrade.value, count: 3 });
    recommendList.value = (list ?? []).slice(0, 3);
  } catch {
    recommendList.value = [];
  }
  if (!recommendList.value.length) {
    recommendList.value = MOCK_GAME.items.slice(0, 3).map((i) => ({
      idiomId: i.idiomId,
      idiomContent: i.content,
      idiomPinyin: i.pinyin,
      idiomMeaning: i.meaning,
      idiomSource: "",
      idiomExample: "",
      idiomSynonyms: "",
      idiomAntonyms: "",
      idiomDifficulty: i.difficulty ?? 3,
      idiomTags: i.tags ?? "",
      createTime: "",
      updateTime: "",
    })) as Idiom[];
  }
}

// ==================== 开始 / 结束 ====================
const startGame = async () => {
  loading.value = true;
  try {
    const need = gameCount.value;
    const fetchCount = difficulty.value === "normal" ? need : Math.min(need * 3, 60);
    const data = await eduaiApi.generateIdiomGame({
      gradeLevel: selectedGradeLevel.value,
      grade: selectedGrade.value,
      count: fetchCount,
    });

    const items = filterByDifficulty(data?.items ?? []);
    if (!items.length) {
      gameData.value = {
        ...MOCK_GAME,
        items: filterByDifficulty(MOCK_GAME.items).slice(0, need) as typeof MOCK_GAME.items,
        gradeLevel: selectedGradeLevel.value,
        grade: selectedGrade.value,
      };
      if (!gameData.value.items.length) gameData.value.items = MOCK_GAME.items.slice(0, need);
      usingMock.value = true;
      ElMessage.info("当前条件下暂无成语数据，已用演示数据展示效果");
    } else {
      gameData.value = { ...data, items: items.slice(0, need) };
      usingMock.value = false;
    }
    enterGame();
  } catch {
    gameData.value = { ...MOCK_GAME, gradeLevel: selectedGradeLevel.value, grade: selectedGrade.value };
    usingMock.value = true;
    enterGame();
    ElMessage.info("成语数据加载失败，已用演示数据展示效果");
  } finally {
    loading.value = false;
  }
};

function filterByDifficulty(items: IdiomGameData["items"]) {
  const list = items ?? [];
  if (difficulty.value === "easy") return list.filter((i) => (i.difficulty ?? 3) <= 2);
  if (difficulty.value === "hard") return list.filter((i) => (i.difficulty ?? 3) >= 4);
  return list;
}

function enterGame() {
  gameStarted.value = true;
  gameCompleted.value = false;
  score.value = 0;
  buildTiles();
  startTimer();
}

function restart() {
  void startGame();
}

function exitGame() {
  stopTimer();
  gameStarted.value = false;
  gameCompleted.value = false;
}

function goHome() {
  stopTimer();
  void router.push("/edu/fun");
}

const resetGame = () => exitGame();

onMounted(() => {
  loadStats();
  void loadRecommend();
});

onBeforeUnmount(() => {
  stopTimer();
});
</script>

<style scoped>
/* ==================== 页面底色（主色渐变，白卡） ==================== */
.ig-page {
  min-height: 100%;
  padding: 22px 20px 30px;
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
}

.ig-title {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
}
.ig-title--left {
  font-size: 34px;
}
.ig-title__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--el-color-white);
  box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb), 0.35);
}

/* ==================== ① 设置页 ==================== */
.ig-setup__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}
.ig-today {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 10px 18px;
  border-radius: 14px;
  background: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
}
.ig-today__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.ig-today__value {
  font-size: 22px;
  font-weight: 900;
  color: var(--el-color-primary-dark-2);
  font-variant-numeric: tabular-nums;
}

/* 设置页同样保持左右（左设置 / 中预览 / 右提示）三栏，只按比例收窄 */
.ig-setup__body {
  display: grid;
  grid-template-columns: clamp(200px, 26vw, 360px) minmax(0, 1fr) clamp(170px, 22vw, 280px);
  gap: 18px;
  align-items: start;
}

.ig-card {
  background: var(--el-bg-color);
  border-radius: 22px;
  padding: 20px 22px;
  box-shadow: var(--el-box-shadow);
}
.ig-card__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.ig-card__title--center {
  justify-content: center;
}
.ig-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.ig-dot--green {
  background: var(--el-color-success);
}

/* 胶囊按钮组 */
.ig-field {
  margin-bottom: 18px;
}
/* 行内字段：窄列时标签独占一行，内容换行铺满，避免溢出 */
.ig-field--row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.ig-field__label {
  display: block;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  white-space: nowrap;
}
.ig-field--row .ig-field__label {
  margin-bottom: 0;
  flex-shrink: 0;
}
.ig-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}
.ig-chips--wrap {
  flex-wrap: wrap;
  row-gap: 10px;
}
.ig-chip {
  min-width: 0;
  height: 36px;
  padding: 0 16px;
  border-radius: 999px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.15s;
}
.ig-chip:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}
.ig-chip.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
  box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.32);
}

/* 数量滑块 + 气泡 */
.ig-count {
  flex: 1 1 120px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.ig-count :deep(.el-slider) {
  flex: 1;
  padding: 0;
}
.ig-count :deep(.el-slider__runway) {
  height: 12px;
  border-radius: 999px;
  background: var(--el-fill-color);
}
.ig-count :deep(.el-slider__bar) {
  height: 12px;
  border-radius: 999px;
  background: var(--el-color-primary);
}
.ig-count :deep(.el-slider__button) {
  width: 22px;
  height: 22px;
  border: 3px solid var(--el-color-white);
  background: var(--el-color-primary);
}
.ig-count :deep(.el-slider__button-wrapper) {
  top: -12px;
}
.ig-count__bubble {
  min-width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-weight: 800;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* 难度单选 */
.ig-radios {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-width: 0;
}
.ig-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.ig-radio input {
  display: none;
}
.ig-radio__mark {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 1.5px solid var(--el-border-color);
  display: inline-block;
  position: relative;
}
.ig-radio input:checked + .ig-radio__mark {
  border-color: var(--el-color-primary);
}
.ig-radio input:checked + .ig-radio__mark::after {
  content: "";
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--el-color-primary);
}
.ig-radio__text {
  white-space: nowrap;
}

.ig-start {
  width: 100%;
  height: 54px;
  margin-top: 6px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--el-color-white);
  background: var(--el-color-primary);
  box-shadow: 0 10px 22px rgba(var(--el-color-primary-rgb), 0.35);
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.ig-start:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 14px 28px rgba(var(--el-color-primary-rgb), 0.45);
}
.ig-start:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 今日推荐 */
.ig-recommend {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.ig-rec {
  position: relative;
  display: flex;
  gap: 12px;
  padding: 14px 16px 14px 34px;
  border-radius: 14px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
}
.ig-rec__badge {
  position: absolute;
  left: 0;
  top: 14px;
  width: 22px;
  padding: 4px 0;
  border-radius: 0 8px 8px 0;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}
.ig-rec__badge.is-1 {
  background: var(--el-color-success);
}
.ig-rec__badge.is-2 {
  background: var(--el-color-warning);
}
.ig-rec__main {
  min-width: 0;
}
.ig-rec__top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ig-rec__name {
  font-size: 18px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 1px;
}
.ig-rec__meaning-tag {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 6px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  font-weight: 700;
}
.ig-rec__pinyin {
  margin-top: 4px;
  font-size: 12px;
  color: var(--el-color-primary);
  font-weight: 600;
}
.ig-rec__meaning {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

/* 我的战绩 */
.ig-stat {
  margin-bottom: 14px;
}
.ig-stat__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}
.ig-stat__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 600;
}
.ig-stat__value {
  font-size: 20px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.ig-bar {
  height: 8px;
  border-radius: 999px;
  background: var(--el-fill-color);
  overflow: hidden;
}
.ig-bar__fill {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--el-color-primary);
  transition: width 0.3s;
}

.ig-rank {
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  text-align: center;
}
.ig-rank__title {
  font-size: 15px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
}
.ig-rank__badge {
  width: 56px;
  height: 56px;
  margin: 0 auto 6px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 26px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 18px rgba(var(--el-color-primary-rgb), 0.35);
}
.ig-rank__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ==================== ② 游戏页 ==================== */
/* 左右固定结构：左侧栏随视口收缩，永不堆叠为上下 */
.ig-play {
  display: grid;
  grid-template-columns: clamp(200px, 24vw, 300px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.ig-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ig-side__level {
  align-self: flex-start;
  padding: 8px 20px;
  border-radius: 999px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font-size: 16px;
  font-weight: 800;
}

.ig-cleared {
  background: rgba(255, 255, 255, 0.18);
  border-radius: 18px;
  padding: 14px;
  backdrop-filter: blur(2px);
}
.ig-cleared__title {
  text-align: center;
  font-size: 14px;
  font-weight: 800;
  color: var(--el-color-white);
  margin-bottom: 12px;
}
.ig-cleared__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}
.ig-cleared__item {
  min-height: 92px;
  border-radius: 10px;
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 4px;
  box-shadow: var(--el-box-shadow-lighter);
}
.ig-cleared__item.is-empty {
  background: rgba(255, 255, 255, 0.12);
  box-shadow: none;
}
.ig-cleared__text {
  writing-mode: vertical-rl;
  font-size: 14px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.ig-cleared__check {
  color: var(--el-color-success);
  font-weight: 900;
  font-size: 13px;
}

.ig-side__clock {
  background: var(--el-bg-color);
  border-radius: 18px;
  padding: 14px;
  text-align: center;
  box-shadow: var(--el-box-shadow);
}
.ig-clock {
  font-size: 44px;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
  line-height: 1.1;
}
.ig-clock__score {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}

.ig-main {
  background: var(--el-color-primary-light-9);
  border-radius: 22px;
  padding: 16px 18px 18px;
  box-shadow: var(--el-box-shadow);
}
.ig-board-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}
.ig-target {
  font-size: 22px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.ig-target__name {
  color: var(--el-color-primary-dark-2);
  letter-spacing: 2px;
}
.ig-target__icons {
  font-size: 16px;
}
.ig-close {
  width: 38px;
  height: 38px;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 18px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 14px rgba(var(--el-color-primary-rgb), 0.35);
}
.ig-close:hover {
  background: var(--el-color-primary-dark-2);
}

.ig-board {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 18px;
  background: var(--el-color-primary-light-7);
}
.ig-board--4 {
  grid-template-columns: repeat(4, minmax(0, 1fr));
}
.ig-board--5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.ig-tile {
  min-height: 92px;
  border: 2px solid var(--el-bg-color);
  border-radius: 16px;
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 26px;
  font-weight: 900;
  letter-spacing: 2px;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.12);
  transition: transform 0.12s, box-shadow 0.15s, border-color 0.15s, background 0.15s, opacity 0.25s;
}
.ig-tile:hover:not(:disabled):not(.is-selected) {
  transform: translateY(-3px);
}
.ig-tile.is-selected {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 4px rgba(var(--el-color-primary-rgb), 0.45), 0 8px 18px rgba(var(--el-color-primary-rgb), 0.35);
  transform: translateY(-3px);
}
.ig-tile.is-hint {
  border-style: dashed;
  border-color: var(--el-color-primary-light-5);
}
.ig-tile.is-wrong {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  animation: ig-shake 0.4s;
}
.ig-tile.is-matched {
  visibility: hidden;
}

@keyframes ig-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-6px); }
  75% { transform: translateX(6px); }
}

.ig-board-foot {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.ig-btn {
  height: 44px;
  padding: 0 22px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
}
.ig-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ig-btn--primary {
  background: var(--el-color-primary);
  color: var(--el-color-white);
  box-shadow: 0 8px 18px rgba(var(--el-color-primary-rgb), 0.35);
}
.ig-btn--ghost {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 1px solid var(--el-border-color-lighter);
}
.ig-btn--outline {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  border: 2px solid var(--el-border-color);
}
.ig-btn--gradient {
  color: var(--el-color-white);
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  box-shadow: 0 10px 22px rgba(var(--el-color-primary-rgb), 0.4);
}
.ig-btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

/* ==================== ③ 结算页 ==================== */
.ig-result-wrap {
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ig-result {
  position: relative;
  width: min(560px, 100%);
  background: var(--el-bg-color);
  border-radius: 26px;
  padding: 26px 30px 30px;
  text-align: center;
  box-shadow: var(--el-box-shadow-dark);
}
.ig-close--result {
  position: absolute;
  right: 16px;
  top: 16px;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  box-shadow: none;
}
.ig-result__trophy {
  font-size: 64px;
  line-height: 1;
  margin-bottom: 6px;
}
.ig-result__title {
  margin: 0;
  font-size: 34px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  letter-spacing: 2px;
}
.ig-result__sub {
  margin: 8px 0 20px;
  font-size: 15px;
  color: var(--el-text-color-secondary);
}
.ig-result__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}
.ig-result__stat {
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 14px;
  padding: 12px 8px;
}
.ig-result__stat-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 6px;
}
.ig-result__stat-value {
  font-size: 26px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  font-variant-numeric: tabular-nums;
}
.ig-result__list {
  background: var(--el-fill-color-lighter);
  border-radius: 16px;
  padding: 14px;
  margin-bottom: 20px;
}
.ig-result__list-title {
  font-size: 15px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
}
.ig-result__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}
.ig-result__tag {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border-radius: 8px;
  padding: 6px 10px;
}
.ig-result__ops {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.ig-result__ops .ig-btn {
  height: 52px;
  justify-content: center;
  font-size: 17px;
}

/* ==================== 响应式：始终左右结构，只收窄列宽 ==================== */
@media (max-width: 1280px) {
  .ig-play {
    grid-template-columns: clamp(180px, 21vw, 250px) minmax(0, 1fr);
    gap: 14px;
  }
  .ig-setup__body {
    grid-template-columns: clamp(190px, 23vw, 280px) minmax(0, 1fr) clamp(160px, 20vw, 220px);
    gap: 14px;
  }
  .ig-cleared__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 720px) {
  .ig-title {
    font-size: 30px;
  }
  .ig-play {
    grid-template-columns: minmax(140px, 34%) minmax(0, 1fr);
    gap: 10px;
  }
  /* 设置页在极窄屏降为两栏（左设置 / 中预览），仍保持左右，不做上下堆叠 */
  .ig-setup__body {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
    gap: 10px;
  }
  .ig-board--4,
  .ig-board--5 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .ig-tile {
    min-height: 72px;
    font-size: 20px;
  }
  .ig-cleared__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .ig-cleared__item {
    min-height: 76px;
  }
}

/* ---------- 学习卡片覆盖层 ---------- */
.ig-learn-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  overflow: auto;
  background: var(--el-color-primary-dark-2);
}
</style>
