<template>
  <div class="pc-page">
    <!-- ==================== ① 选关 ==================== -->
    <section v-if="stage === 'home'" class="pc-home">
      <header class="pc-home__head">
        <h1 class="pc-home__title">古诗文闯关<span class="pc-home__title__dot" /></h1>
        <p class="pc-home__sub">七种玩法，从不同角度读懂一首诗</p>
      </header>

      <div class="pc-home__filter">
        <el-select v-model="level" style="width: 140px">
          <el-option v-for="lv in GRADE_LEVELS" :key="lv" :label="lv" :value="lv" />
        </el-select>
        <el-select v-model="count" style="width: 120px">
          <el-option :value="6" label="6 题" />
          <el-option :value="10" label="10 题" />
          <el-option :value="15" label="15 题" />
        </el-select>
      </div>

      <div class="pc-home__grid">
        <button
          v-for="m in MODES"
          :key="m.mode"
          type="button"
          class="pc-mode"
          :class="{ 'is-active': mode === m.mode }"
          @click="mode = m.mode"
        >
          <span class="pc-mode__icon" :style="{ background: m.bg }">{{ m.icon }}</span>
          <span class="pc-mode__body">
            <span class="pc-mode__name">{{ m.name }}</span>
            <span class="pc-mode__desc">{{ m.desc }}</span>
          </span>
        </button>
      </div>

      <button type="button" class="pc-start" :disabled="loading" @click="start">
        {{ loading ? "出题中…" : "开始闯关" }}
      </button>
      <p v-if="hint" class="pc-hint">{{ hint }}</p>
    </section>

    <!-- ==================== ② 作答 ==================== -->
    <section v-else-if="stage === 'play'" class="pc-play">
      <div class="pc-bar">
        <span class="pc-bar__mode">{{ currentModeName }}</span>
        <span class="pc-bar__progress">{{ index + 1 }} / {{ items.length }}</span>
        <span class="pc-bar__score">得分 {{ score }}</span>
      </div>

      <!-- 诗句排序：点句成序 -->
      <div v-if="mode === 'order'" class="pc-card">
        <div class="pc-card__tip">按正确顺序点击诗句</div>
        <div class="pc-order__picked">
          <span v-for="(s, i) in picked" :key="i" class="pc-order__chip">{{ i + 1 }}. {{ s }}</span>
          <span v-if="!picked.length" class="pc-order__ph">尚未选择</span>
        </div>
        <div class="pc-order__pool">
          <button
            v-for="s in remaining"
            :key="s"
            type="button"
            class="pc-order__item"
            :disabled="answered"
            @click="pickSentence(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- 飞花令：多选含关键字的句 -->
      <div v-else-if="mode === 'feihualing'" class="pc-card">
        <div class="pc-card__tip">选出所有含「{{ current.keyword }}」的诗句（共 {{ current.hitCount }} 句）</div>
        <div class="pc-options">
          <button
            v-for="(o, i) in hitOptions"
            :key="i"
            type="button"
            class="pc-option"
            :class="hitOptionClass(i)"
            :disabled="answered"
            @click="toggleHit(i)"
          >
            <span class="pc-option__idx">{{ "ABCD"[i] }}</span>
            <span class="pc-option__text">{{ o.text }}</span>
          </button>
        </div>
      </div>

      <!-- 炼字填空 / 四选一（题/作者/朝代） -->
      <div v-else class="pc-card">
        <div class="pc-card__tip">
          {{ mode === "fill" ? "选出被挖去的字词" : modeTip }}
        </div>
        <div class="pc-stem">{{ mode === "fill" ? current.blanked : current.question }}</div>
        <div class="pc-options">
          <button
            v-for="(o, i) in textOptions"
            :key="i"
            type="button"
            class="pc-option"
            :class="optionClass(i)"
            :disabled="answered"
            @click="answerSingle(i)"
          >
            <span class="pc-option__idx">{{ "ABCD"[i] }}</span>
            <span class="pc-option__text">{{ o }}</span>
          </button>
        </div>
      </div>

      <div class="pc-foot">
        <div class="pc-feedback" :class="correct ? 'is-ok' : 'is-no'">
          <template v-if="answered">
            <b>{{ correct ? "答对了" : "答错了" }}</b>
            <span v-if="mode === 'order'">　正确顺序：{{ orderAnswer.join(" ") }}</span>
            <span v-else-if="mode === 'feihualing'">　含「{{ current.keyword }}」的句子已高亮</span>
            <span v-else>　正确答案：{{ current.answer }}</span>
          </template>
        </div>
        <button type="button" class="pc-next" :disabled="!answered" @click="next">
          {{ index + 1 >= items.length ? "查看成绩" : "下一题" }}
        </button>
      </div>
    </section>

    <!-- ==================== ③ 结算 ==================== -->
    <section v-else class="pc-result">
      <div class="pc-result__card">
        <h2 class="pc-result__title">{{ currentModeName }} · 本轮成绩</h2>
        <div class="pc-result__grid">
          <div class="pc-result__item">
            <div class="pc-result__num">{{ score }}</div>
            <div class="pc-result__label">得分</div>
          </div>
          <div class="pc-result__item">
            <div class="pc-result__num">{{ accuracy }}%</div>
            <div class="pc-result__label">正确率</div>
          </div>
          <div class="pc-result__item">
            <div class="pc-result__num">{{ items.length }}</div>
            <div class="pc-result__label">题量</div>
          </div>
        </div>
        <div class="pc-result__ops">
          <button type="button" class="pc-btn" @click="start">再来一轮</button>
          <button type="button" class="pc-btn pc-btn--ghost" @click="stage = 'home'">换个玩法</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 古诗文闯关（七种玩法合一）
 *
 * 玩法与既有游戏刻意区分：成语消消乐（配对消除）、古诗补全（选下句）之外，
 * 这里提供 诗句排序 / 飞花令 / 看句猜题 / 诗归其主 / 朝代溯源 / 炼字填空。
 *
 * 所有玩法共用一套「取题 → 作答 → 判定 → 结算」骨架，差异只在题面渲染与判定：
 *   - order       点句成序，逐句比对
 *   - feihualing  多选，判定所选集合是否恰为含关键字的那些句
 *   - 其余四选一   单选，比对 answerIndex
 */
import { computed, ref } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import type { PoemChallengeItem, PoemChallengeMode } from "../api/types";

/** 学段；「全部」不限学段，避免某个学段暂无数据时直接开不出题 */
const ALL_LEVEL = "全部";
const GRADE_LEVELS = [ALL_LEVEL, "小学", "初中", "高中", "大学"] as const;

/** 玩法清单（icon 用汉字做轻量标识，避免引额外图标依赖） */
const MODES: Array<{
  mode: PoemChallengeMode;
  name: string;
  desc: string;
  icon: string;
  bg: string;
}> = [
  { mode: "order", name: "诗句排序", desc: "把打乱的诗句还原成原序", icon: "序", bg: "var(--el-color-primary)" },
  { mode: "feihualing", name: "飞花令", desc: "限时挑出含指定字的诗句", icon: "花", bg: "var(--el-color-success)" },
  { mode: "title", name: "看句猜题", desc: "给一句诗，选出它出自哪首", icon: "题", bg: "var(--el-color-warning)" },
  { mode: "author", name: "诗归其主", desc: "给一句诗，选出作者", icon: "人", bg: "var(--el-color-danger)" },
  { mode: "dynasty", name: "朝代溯源", desc: "给一句诗，判断所属朝代", icon: "朝", bg: "var(--el-color-info)" },
  { mode: "theme", name: "题材归类", desc: "给一句诗，判断思乡/边塞/田园等题材", icon: "类", bg: "var(--el-color-success-dark-2)" },
  { mode: "fill", name: "炼字填空", desc: "挖去一处字词，四选一复原", icon: "字", bg: "var(--el-color-primary-light-3)" },
];

const stage = ref<"home" | "play" | "result">("home");
const mode = ref<PoemChallengeMode>("order");
const level = ref<string>(ALL_LEVEL);
const count = ref(10);
const loading = ref(false);
const hint = ref("");
const items = ref<PoemChallengeItem[]>([]);
const index = ref(0);
const score = ref(0);
const answered = ref(false);
const correct = ref(false);
const results = ref<boolean[]>([]);

/** 诗句排序：已选 / 待选 */
const picked = ref<string[]>([]);
/** 飞花令：已勾选的下标 */
const hitPicked = ref<number[]>([]);

const current = computed<PoemChallengeItem>(() => items.value[index.value] ?? ({} as PoemChallengeItem));

/** 诗句排序的正确句序（answer 在四选一玩法是字符串，这里做收窄） */
const orderAnswer = computed<string[]>(() => {
  const a = current.value.answer;
  return Array.isArray(a) ? a : [];
});
const currentModeName = computed(() => MODES.find((m) => m.mode === mode.value)?.name ?? "");
const modeTip = computed(() => {
  if (mode.value === "title") {
    return "选出这句诗出自哪一首";
  }
  if (mode.value === "author") {
    return "选出这句诗的作者";
  }
  if (mode.value === "dynasty") {
    return "选出这句诗的朝代";
  }
  if (mode.value === "theme") {
    return "选出这句诗的题材（思乡 / 边塞 / 田园…）";
  }
  return "选出正确的选项";
});
const accuracy = computed(() => {
  const total = items.value.length || 1;
  return Math.round((results.value.filter(Boolean).length / total) * 100);
});
const remaining = computed(() => {
  const left = [...(current.value.sentences ?? [])];
  for (const s of picked.value) {
    const i = left.indexOf(s);
    if (i >= 0) {
      left.splice(i, 1);
    }
  }
  return left;
});
const hitOptions = computed(() =>
  (current.value.options ?? []).map((o) => (typeof o === "string" ? { text: o, hit: false } : o)),
);
const textOptions = computed(() =>
  (current.value.options ?? []).filter((o): o is string => typeof o === "string"),
);

async function start() {
  loading.value = true;
  hint.value = "";
  try {
    const data = await eduaiApi.poemChallenge(mode.value, {
      gradeLevel: level.value === ALL_LEVEL ? undefined : level.value,
      count: count.value,
    });
    const list = data?.items ?? [];
    if (!list.length) {
      hint.value =
        data?.hint ??
        `「${level.value}」学段暂无可出题的古诗。可切到「全部」，或到「采集管理」采集更多作品后再来。`;
      return;
    }
    items.value = list;
    results.value = new Array(list.length).fill(false);
    index.value = 0;
    score.value = 0;
    answered.value = false;
    correct.value = false;
    picked.value = [];
    hitPicked.value = [];
    stage.value = "play";
  } catch {
    hint.value = "出题失败，请稍后重试";
  } finally {
    loading.value = false;
  }
}

/**
 * 判定当前题并计分。
 *
 * @param ok 是否答对
 */
function settle(ok: boolean) {
  answered.value = true;
  correct.value = ok;
  results.value[index.value] = ok;
  if (ok) {
    score.value += 10;
  }
}

/**
 * 诗句排序：点选一句追加到已选区，选满即判定。
 *
 * @param sentence 被点击的句子
 */
function pickSentence(sentence: string) {
  if (answered.value) {
    return;
  }
  picked.value = [...picked.value, sentence];
  if (picked.value.length === (current.value.sentences ?? []).length) {
    const answer = orderAnswer.value;
    settle(picked.value.every((s, i) => s === answer[i]));
  }
}

/**
 * 飞花令：勾选/取消一句。
 *
 * @param i 选项下标
 */
function toggleHit(i: number) {
  if (answered.value) {
    return;
  }
  const list = [...hitPicked.value];
  const at = list.indexOf(i);
  if (at >= 0) {
    list.splice(at, 1);
  } else {
    list.push(i);
  }
  hitPicked.value = list;
  // 选满应选数量即判定
  if (list.length === (current.value.hitCount ?? 0)) {
    const hits = hitOptions.value
      .map((o, idx) => ({ o, idx }))
      .filter((x) => x.o.hit)
      .map((x) => x.idx);
    settle(list.length === hits.length && list.every((v) => hits.includes(v)));
  }
}

/**
 * 飞花令选项的样式类：作答后高亮应选中的句，答错时把误选标红。
 *
 * @param i 选项下标
 * @returns 样式类
 */
function hitOptionClass(i: number) {
  if (!answered.value) {
    return hitPicked.value.includes(i) ? "is-picked" : "";
  }
  if (hitOptions.value[i]?.hit) {
    return "is-right";
  }
  return hitPicked.value.includes(i) ? "is-wrong" : "";
}

/**
 * 四选一作答。
 *
 * @param i 选项下标
 */
function answerSingle(i: number) {
  if (answered.value) {
    return;
  }
  settle(i === (current.value.answerIndex ?? -1));
}

/**
 * 四选一选项样式类。
 *
 * @param i 选项下标
 * @returns 样式类
 */
function optionClass(i: number) {
  if (!answered.value) {
    return "";
  }
  if (i === current.value.answerIndex) {
    return "is-right";
  }
  return "is-wrong";
}

function next() {
  if (index.value + 1 >= items.value.length) {
    stage.value = "result";
    return;
  }
  index.value += 1;
  answered.value = false;
  correct.value = false;
  picked.value = [];
  hitPicked.value = [];
}
</script>

<style scoped>
.pc-page {
  /* 不设内边距：外层 .main-content 已提供 8px，避免双重边距 */
  min-height: 100%;
  /*
   * 地面与成语消消乐（.ig-page）统一。原先用 primary-light-8 → light-9 的极浅渐变，
   * 与成语消消乐/昆虫识图/古诗补全不是一个色系。
   *
   * 地面转饱和带来一个必须一起解决的问题：三个阶段（.pc-home / .pc-play /
   * .pc-result）原本都是**透明**压在地上的，深色文字（.pc-bar 的 secondary 灰、
   * 题干、释义）直接读极浅底。换成饱和底后这些深色字会糊，所以：
   *   - 首页：标题/副标题转白（下面的白卡不动）
   *   - 作答/结算：整阶段给白卡（见 .pc-play / .pc-result）
   * 只改地面不改这两处，就是拿可读性换一致性。
   */
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  /* 满幅地面不圆角：留 16px 圆角的话，内嵌层四周会露出宿主灰底的四个角 */
}
.pc-home__head {
  text-align: center;
  margin-bottom: 18px;
}
/* 标题：与基准 .ig-title 同一套（白字压在主色带上，靠描边阴影保证可读性） */
.pc-home__title {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.pc-home__title__dot {
  width: 14px;
  height: 14px;
  /* 纯圆点用圆形令牌，不占 --el-radius-* 六档（那六档是圆角矩形语义） */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-white);
  /* 装饰性光环（0 偏移 0 模糊），不是卡片投影：只描一圈主色，压在主色底上略深 */
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
/* 副标题压在主色带上：白字降一档透明度，深色模式下主色更深、白字仍可读 */
.pc-home__sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-color-white);
  opacity: 0.86;
}
.pc-home__filter {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 18px;
}
.pc-home__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
/* 玩法卡：白卡 + 边框，圆角用基准的 --el-radius-xl（此前是 lg/12px，
   六个模块里只有诗词大会的玩法卡不是 16px 圆角）。 */
.pc-mode {
  display: flex;
  align-items: center;
  gap: 12px;
  /* 内边距对齐基准卡片档 20px 22px：玩法卡也是「带边框的白底容器」，
     此前是 14px 16px，六个模块里只有它不是这一档 */
  padding: 20px 22px;
  /* 原 12px，最近档 16px（xl），与基准 .ig-card / .pc-card 同一档 */
  border-radius: var(--el-radius-xl, 16px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  text-align: left;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition:
    border-color var(--el-transition-duration-fast, 0.2s) ease,
    box-shadow var(--el-transition-duration-fast, 0.2s) ease;
}
.pc-mode:hover {
  border-color: var(--el-color-primary-light-5);
}
.pc-mode.is-active {
  border-color: var(--el-color-primary);
  /* 选中态环与键盘焦点环同款（3px 主色 12%），选中/聚焦两态视觉一致 */
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pc-mode:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pc-mode__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-color-white);
}
.pc-mode__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.pc-mode__name {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.pc-mode__desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pc-start {
  display: block;
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  height: 48px;
  /*
   * 反色：地面已是主色渐变，主色按钮压上去会糊成一片，所以改成
   * 「白底 + 主色字」。基准的 .ig-start 是主色按钮，但它坐在**白卡**里，
   * 本页的开始按钮是直接压地面的，两者不能照抄同一色。
   */
  border: 0;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
/*
 * 焦点环换成白色半透：常规的 3px 主色 12% 环落在主色地面上等于没有环，
 * 白按钮压在主色底上只有白色描边才看得见（与 .portal-embed__back 同思路）。
 */
.pc-start:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-white) 85%, transparent);
}
.pc-start:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.pc-hint {
  margin: 12px 0 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-color-danger);
}

/* ---------- 作答 ---------- */
.pc-play {
  max-width: 860px;
  margin: 0 auto;
}
/*
 * 顶部进度行升格成白卡：地面翻成主色渐变后，这一行原本是裸压地面的深色文字
 * （secondary 灰 + 主色分数），会被底色吃掉。做题卡（.pc-card）本来就有白底，
 * 所以只补进度行这一层，不必把整个阶段再套一张卡（避免卡片套卡片）。
 */
.pc-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 12px 18px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pc-bar__mode {
  padding: 3px 12px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font-weight: 700;
}
.pc-bar__score {
  margin-left: auto;
  font-weight: 700;
  color: var(--el-color-primary);
}
.pc-card {
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  padding: 20px 22px;
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pc-card__tip {
  margin-bottom: 14px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pc-stem {
  margin-bottom: 16px;
  padding: 18px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  font-size: 19px;
  font-weight: 700;
  letter-spacing: 1px;
  text-align: center;
  color: var(--el-color-primary-dark-2);
}
.pc-options {
  display: grid;
  gap: 10px;
}
.pc-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  padding: 10px 14px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.pc-option:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pc-option:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pc-option__idx {
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  /* 选项序号圆用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pc-option.is-picked {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pc-option.is-right {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.pc-option.is-wrong {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}

/* ---------- 诗句排序 ---------- */
.pc-order__picked {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 48px;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}
.pc-order__chip {
  font-size: 15px;
  color: var(--el-text-color-primary);
}
.pc-order__ph {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
.pc-order__pool {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.pc-order__item {
  padding: 8px 14px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  font-size: 15px;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pc-order__item:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.pc-order__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* ---------- 底部 ---------- */
.pc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 16px;
}
/*
 * 判定反馈托白卡。
 *
 * 地面翻成主色渐变后，这一行是 .pc-play 里唯一还裸压地面的文字：
 * .pc-bar（进度行）和 .pc-card（做题卡）都补了白底，只有它没有。
 * 实测压在饱和地面两个端点上只有 1.95（红）/ 2.52（绿），两头都不合格。
 *
 * 文字色同样不能直接用 --el-color-danger(#f56c6c) / --el-color-success(#67c23a)：
 * Element 把这两个当填充色（配白字）设计的，直接当文字色在白底上也只有 2.90 / 2.24。
 * 而 -dark-2 档（#c45656 / #529b2e）在白底上是 4.36 / 3.45，差一点点也不够。
 * 所以统一再压一档黑到 80%（≈#9d4545 / #427c25），白底上 6.23 / 5.07，过 AA 正文 4.5:1
 * 并留了余量；表达式仍然从 Element token 推导，换主题时会跟着变。
 */
.pc-feedback {
  padding: 10px 14px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  font-size: 14px;
  line-height: 1.6;
}
.pc-feedback:empty {
  /* 未判定时是空节点，别留一条空白卡 */
  padding: 0;
  border: 0;
}
.pc-feedback.is-ok {
  color: color-mix(in srgb, var(--el-color-success-dark-2, #529b2e) 80%, #000);
}
.pc-feedback.is-no {
  color: color-mix(in srgb, var(--el-color-danger-dark-2, #d14343) 80%, #000);
}
.pc-next {
  height: 44px;
  padding: 0 26px;
  border: 0;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pc-next:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pc-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ---------- 结算 ---------- */
.pc-result__card {
  max-width: 620px;
  margin: 0 auto;
  /* 内边距对齐基准卡片档 20px 22px：结算卡此前是四边 24px，
     是本视图最后一个没跟基准对齐的白底容器 */
  padding: 20px 22px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
  text-align: center;
}
.pc-result__title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 900;
  color: var(--el-color-primary-dark-2);
}
.pc-result__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}
.pc-result__item {
  padding: 14px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
}
.pc-result__num {
  font-size: 24px;
  font-weight: 900;
  color: var(--el-color-primary);
}
.pc-result__label {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pc-result__ops {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.pc-btn {
  height: 46px;
  border: 0;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pc-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pc-btn--ghost {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .pc-mode,
  .pc-option {
    transition: none;
  }
}
</style>
