<template>
  <div class="pg-page">
    <!-- ==================== ① 设置页 ==================== -->
    <section v-if="stage === 'setup'" class="pg-setup">
      <header class="pg-header">
        <h1 class="pg-title">古诗补全<span class="pg-title__dot" /></h1>
        <div class="pg-today">
          <div class="pg-today__label">今日挑战</div>
          <div class="pg-today__value">{{ todayCount }}/{{ dailyGoal }}</div>
        </div>
      </header>

      <div class="pg-setup__body">
        <section class="pg-card">
          <h3 class="pg-card__title"><span class="pg-dot" />设置卡</h3>

          <div class="pg-field">
            <span class="pg-field__label">选择学段</span>
            <div class="pg-chips">
              <button
                v-for="lv in GRADE_LEVELS"
                :key="lv"
                type="button"
                class="pg-chip"
                :class="{ 'is-active': level === lv }"
                @click="pickLevel(lv)"
              >
                {{ lv }}
              </button>
            </div>
          </div>

          <div v-if="gradeOptions.length" class="pg-field">
            <span class="pg-field__label">选择年级</span>
            <div class="pg-chips pg-chips--wrap">
              <button
                v-for="g in gradeOptions"
                :key="g"
                type="button"
                class="pg-chip"
                :class="{ 'is-active': grade === g }"
                @click="grade = g"
              >
                {{ g }}
              </button>
            </div>
          </div>

          <div class="pg-field pg-field--row">
            <span class="pg-field__label">题目数量</span>
            <div class="pg-count">
              <el-slider v-model="count" :min="5" :max="20" :step="5" :show-tooltip="false" />
              <span class="pg-count__bubble">{{ count }}</span>
            </div>
          </div>

          <button type="button" class="pg-start" :disabled="loading" @click="startGame">
            {{ loading ? "生成中…" : "开始游戏" }}
          </button>
          <p v-if="errorMsg" class="pg-error">{{ errorMsg }}</p>
        </section>

        <section class="pg-card pg-card--tip">
          <h3 class="pg-card__title pg-card__title--center"><span class="pg-dot pg-dot--green" />玩法说明</h3>
          <ol class="pg-rules">
            <li>每题给出一句诗，从 4 个选项里选出<b>紧接的下一句</b>。</li>
            <li>答对 <b>+10 分</b>，答错不扣分。</li>
            <li>全部答完后可查看成绩与逐题回顾。</li>
          </ol>
          <div class="pg-empty-tip" v-if="!loading">提示：题库为空时请先在「采集管理」执行古诗采集，或在「古诗库」手工新增。</div>
        </section>
      </div>
    </section>

    <!-- ==================== ② 游戏页 ==================== -->
    <section v-else-if="stage === 'play'" class="pg-play">
      <aside class="pg-side">
        <div class="pg-side__level">{{ level }} · {{ grade }}</div>
        <div class="pg-side__clock">
          <div class="pg-clock">{{ formattedTime }}</div>
          <div class="pg-clock__score">得分 {{ score }} 分</div>
        </div>
        <div class="pg-progress">
          <div class="pg-progress__label">进度 {{ currentIndex + 1 }} / {{ items.length }}</div>
          <el-progress :percentage="progressPercent" :show-text="false" :stroke-width="10" />
        </div>
      </aside>

      <main class="pg-main">
        <div class="pg-main__head">
          <div>
            <div class="pg-main__title">{{ current.title }}</div>
            <div class="pg-main__author">{{ current.dynasty }} · {{ current.author }}</div>
          </div>
          <span class="pg-main__badge">第 {{ currentIndex + 1 }} 题</span>
        </div>

        <div class="pg-question">{{ current.question }}</div>

        <div class="pg-options">
          <button
            v-for="(opt, idx) in current.options"
            :key="idx"
            type="button"
            class="pg-option"
            :class="optionClass(idx)"
            :disabled="answered"
            @click="answer(idx)"
          >
            <span class="pg-option__idx">{{ "ABCD"[idx] }}</span>
            <span class="pg-option__text">{{ opt }}</span>
          </button>
        </div>

        <div class="pg-main__foot">
          <div class="pg-feedback" :class="lastCorrect ? 'is-ok' : 'is-no'">
            <template v-if="answered">
              <b>{{ lastCorrect ? "答对了" : "答错了" }}</b>
              <span v-if="!lastCorrect">，正确答案：{{ current.answer }}</span>
            </template>
          </div>
          <button type="button" class="pg-next" :disabled="!answered" @click="next">
            {{ currentIndex + 1 >= items.length ? "查看成绩" : "下一题" }}
          </button>
        </div>
      </main>
    </section>

    <!-- ==================== ③ 结算页 ==================== -->
    <section v-else class="pg-result">
      <div class="pg-result__card">
        <h2 class="pg-result__title">本轮成绩</h2>
        <div class="pg-result__grid">
          <div class="pg-result__item">
            <div class="pg-result__num">{{ score }}</div>
            <div class="pg-result__label">得分</div>
          </div>
          <div class="pg-result__item">
            <div class="pg-result__num">{{ accuracy }}%</div>
            <div class="pg-result__label">正确率</div>
          </div>
          <div class="pg-result__item">
            <div class="pg-result__num">{{ formattedTime }}</div>
            <div class="pg-result__label">用时</div>
          </div>
        </div>

        <div class="pg-result__list">
          <div v-for="(it, i) in items" :key="it.poemId + '-' + i" class="pg-result__row" :class="{ 'is-wrong': !results[i] }">
            <div class="pg-result__q">{{ it.question }}</div>
            <div class="pg-result__a">{{ it.answer }}</div>
            <div class="pg-result__meta">{{ it.dynasty }} · {{ it.author }}</div>
          </div>
        </div>

        <div class="pg-result__ops">
          <button type="button" class="pg-btn" @click="startGame">再玩一次</button>
          <button type="button" class="pg-btn pg-btn--ghost" @click="reset">返回设置</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * 古诗补全（趣味游戏）
 *
 * 玩法：给出一句诗，从四个选项里选出紧接的下一句。
 * 数据来自后端 /v2/edu/poem/game/generate（按学段/年级取 edu_poem 并生成干扰项）。
 */
import { computed, onBeforeUnmount, ref } from "vue";
import { eduaiApi } from "../api/eduaiApi";
import type { PoemGameItem } from "../api/types";

/** 学段与对应年级（与古诗库入库值保持一致）；「全部」不限学段，保证任何标注下都能出题 */
const ALL = "全部";
const GRADE_LEVELS = [ALL, "小学", "初中", "高中"] as const;
const GRADES_BY_LEVEL: Record<string, string[]> = {
  小学: ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级"],
  初中: ["初一", "初二", "初三"],
  高中: ["高一", "高二", "高三"],
};

const stage = ref<"setup" | "play" | "result">("setup");
const level = ref<string>(ALL);
const grade = ref<string>("");
const count = ref(10);
const loading = ref(false);
const errorMsg = ref("");
const items = ref<PoemGameItem[]>([]);
const results = ref<boolean[]>([]);
const currentIndex = ref(0);
const score = ref(0);
const answered = ref(false);
const lastCorrect = ref(false);
const elapsed = ref(0);
const todayCount = ref(0);
const dailyGoal = 6;
let timer: ReturnType<typeof setInterval> | null = null;

const gradeOptions = computed(() => GRADES_BY_LEVEL[level.value] ?? []);
const current = computed<PoemGameItem>(() => items.value[currentIndex.value] ?? emptyItem());
const progressPercent = computed(() =>
  items.value.length ? Math.round(((currentIndex.value + (answered.value ? 1 : 0)) / items.value.length) * 100) : 0
);
const formattedTime = computed(() => {
  const m = Math.floor(elapsed.value / 60).toString().padStart(2, "0");
  const s = (elapsed.value % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
});
const accuracy = computed(() => {
  const total = items.value.length || 1;
  return Math.round((results.value.filter(Boolean).length / total) * 100);
});

function emptyItem(): PoemGameItem {
  return { poemId: 0, title: "", author: "", dynasty: "", question: "", answer: "", options: [], answerIndex: -1, difficulty: 1 };
}

function pickLevel(lv: string) {
  level.value = lv;
  const list = GRADES_BY_LEVEL[lv] ?? [];
  // 选「全部」时不限年级；切换学段后若原年级不适用则回落到该学段第一个年级
  if (!list.length) {
    grade.value = "";
    return;
  }
  if (!list.includes(grade.value)) {
    grade.value = list[0] ?? "";
  }
}

function startTimer() {
  stopTimer();
  elapsed.value = 0;
  timer = setInterval(() => {
    elapsed.value += 1;
  }, 1000);
}

function stopTimer() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

async function startGame() {
  loading.value = true;
  errorMsg.value = "";
  try {
    const data = await eduaiApi.generatePoemGame({
      // 「全部」对应后端的不限学段查询
      gradeLevel: level.value === ALL ? undefined : level.value,
      grade: grade.value || undefined,
      count: count.value,
    });
    const list = data?.items ?? [];
    if (!list.length) {
      errorMsg.value = "没有取到古诗题目：请先执行古诗采集或在「古诗库」新增古籍数据。";
      return;
    }
    items.value = list;
    results.value = new Array(list.length).fill(false);
    currentIndex.value = 0;
    score.value = 0;
    answered.value = false;
    lastCorrect.value = false;
    todayCount.value += 1;
    stage.value = "play";
    startTimer();
  } catch {
    errorMsg.value = "生成失败，请稍后重试。";
  } finally {
    loading.value = false;
  }
}

/** 记录本次选择的下标，供答错时标红 */
const selectedIndex = ref(-1);

function answer(idx: number) {
  if (answered.value) {
    return;
  }
  answered.value = true;
  selectedIndex.value = idx;
  const correct = idx === current.value.answerIndex;
  lastCorrect.value = correct;
  results.value[currentIndex.value] = correct;
  if (correct) {
    score.value += 10;
  }
}

function optionClass(idx: number) {
  if (!answered.value) {
    return "";
  }
  if (idx === current.value.answerIndex) {
    return "is-right";
  }
  return idx === selectedIndex.value ? "is-wrong" : "";
}

function next() {
  if (currentIndex.value + 1 >= items.value.length) {
    stopTimer();
    stage.value = "result";
    return;
  }
  currentIndex.value += 1;
  answered.value = false;
  lastCorrect.value = false;
  selectedIndex.value = -1;
}

function reset() {
  stopTimer();
  stage.value = "setup";
  items.value = [];
  results.value = [];
}

onBeforeUnmount(stopTimer);
</script>

<style scoped>
.pg-page {
  /* 不设内边距：外层 .main-content 已提供 8px，避免双重边距 */
  min-height: 100%;
  /*
   * 地面与成语消消乐（.ig-page）统一。原先用 primary-light-8 → light-9 的极浅渐变，
   * 实测渲染出来是「淡蓝底 + 深蓝标题」，与成语消消乐/昆虫识图的
   * 「饱和底 + 白标题」不是一个色系，一眼能看出不是同一个产品。
   * 地面转饱和后，标题必须同时转白（见 .pg-title），否则深蓝压深蓝会糊掉。
   */
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  /* 满幅地面不圆角：留 16px 圆角的话，内嵌层四周会露出宿主灰底的四个角 */
}
.pg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
}
/* 标题：与基准 .ig-title 同一套（白字压在主色带上，靠描边阴影保证可读性） */
.pg-title {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: flex;
  align-items: center;
  gap: 8px;
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.pg-title__dot {
  width: 14px;
  height: 14px;
  /* 纯圆点用圆形令牌，不占 --el-radius-* 六档（那六档是圆角矩形语义） */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-white);
  /* 装饰性光环（0 偏移 0 模糊），不是卡片投影：只描一圈主色，压在主色底上略深 */
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
.pg-today {
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  padding: 10px 18px;
  text-align: center;
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pg-today__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
}
.pg-today__value {
  font-size: 22px;
  font-weight: 900;
  color: var(--el-color-primary-dark-2);
}
.pg-setup__body {
  display: grid;
  grid-template-columns: clamp(220px, 26vw, 340px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.pg-card {
  background: var(--el-bg-color);
  /* 原 22px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 20px 22px;
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pg-card__title {
  margin: 0 0 16px;
  font-size: 18px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.pg-card__title--center {
  justify-content: center;
}
.pg-dot {
  width: 10px;
  height: 10px;
  /* 纯圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-primary);
}
.pg-dot--green {
  background: var(--el-color-success);
}
.pg-field {
  margin-bottom: 18px;
}
.pg-field__label {
  display: block;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.pg-field--row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.pg-field--row .pg-field__label {
  margin-bottom: 0;
  flex-shrink: 0;
}
.pg-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}
.pg-chip {
  height: 36px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-regular);
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.pg-chip:hover {
  border-color: var(--el-color-primary-light-5);
  color: var(--el-color-primary);
}
.pg-chip:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pg-chip.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}
.pg-count {
  flex: 1 1 140px;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.pg-count__bubble {
  min-width: 34px;
  height: 34px;
  /* 纯圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pg-start {
  width: 100%;
  height: 52px;
  border: 0;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pg-start:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pg-start:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.pg-error {
  margin: 12px 0 0;
  color: var(--el-color-danger);
  font-size: 13px;
  line-height: 1.6;
}
.pg-rules {
  margin: 0;
  padding-left: 18px;
  color: var(--el-text-color-regular);
  font-size: 14px;
  line-height: 2;
}
.pg-empty-tip {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--el-border-color-lighter);
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.7;
}
.pg-play {
  display: grid;
  grid-template-columns: clamp(180px, 22vw, 260px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}
.pg-side {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pg-side__level {
  align-self: flex-start;
  padding: 8px 18px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font-weight: 800;
}
.pg-side__clock,
.pg-progress {
  background: var(--el-bg-color);
  /* 原 18px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 14px;
  text-align: center;
  /* koi 卡片不加投影：改用边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pg-clock {
  font-size: 40px;
  font-weight: 900;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
.pg-clock__score {
  margin-top: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
}
.pg-progress__label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-regular);
}
.pg-main {
  background: var(--el-bg-color);
  /* 原 22px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 20px 22px;
  /* koi 卡片不加投影：改用边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pg-main__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.pg-main__title {
  font-size: 20px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.pg-main__author {
  margin-top: 2px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pg-main__badge {
  padding: 4px 12px;
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.pg-question {
  margin: 22px 0;
  padding: 22px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-color-primary-light-9);
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 2px;
  color: var(--el-color-primary-dark-2);
  text-align: center;
}
.pg-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.pg-option {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 56px;
  padding: 10px 16px;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.pg-option:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.pg-option:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pg-option__idx {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  /* 选项序号圆用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pg-option.is-right {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.pg-option.is-right .pg-option__idx {
  background: var(--el-color-success);
  color: var(--el-color-white);
}
.pg-option.is-wrong {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.pg-option.is-wrong .pg-option__idx {
  background: var(--el-color-danger);
  color: var(--el-color-white);
}
.pg-main__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
}
.pg-feedback {
  font-size: 15px;
  min-height: 22px;
}
.pg-feedback.is-ok {
  color: var(--el-color-success);
}
.pg-feedback.is-no {
  color: var(--el-color-danger);
}
.pg-next {
  height: 46px;
  padding: 0 28px;
  border: 0;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pg-next:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pg-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.pg-result__card {
  max-width: 760px;
  margin: 0 auto;
  background: var(--el-bg-color);
  /* 原 22px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 26px 28px;
  /* koi 卡片不加投影：改用边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
.pg-result__title {
  margin: 0 0 18px;
  text-align: center;
  font-size: 24px;
  font-weight: 900;
  color: var(--el-color-primary-dark-2);
}
.pg-result__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}
.pg-result__item {
  text-align: center;
  padding: 14px;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
}
.pg-result__num {
  font-size: 26px;
  font-weight: 900;
  color: var(--el-color-primary);
}
.pg-result__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pg-result__list {
  max-height: 320px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.pg-result__row {
  padding: 10px 14px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
  border-left: 4px solid var(--el-color-success);
}
.pg-result__row.is-wrong {
  border-left-color: var(--el-color-danger);
}
.pg-result__q {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.pg-result__a {
  font-size: 16px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.pg-result__meta {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pg-result__ops {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 20px;
}
.pg-btn {
  height: 50px;
  border: 0;
  /* 原 14px，最近档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
}
.pg-btn:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.pg-btn--ghost {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary-dark-2);
}
@media (max-width: 1100px) {
  .pg-setup__body,
  .pg-play {
    grid-template-columns: clamp(180px, 24vw, 240px) minmax(0, 1fr);
  }
  .pg-options {
    grid-template-columns: minmax(0, 1fr);
  }
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .pg-chip,
  .pg-option {
    transition: none;
  }
}
</style>
