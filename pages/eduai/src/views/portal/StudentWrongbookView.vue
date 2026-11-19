<template>
  <div class="wb">
    <header class="wb-head">
      <h2 class="wb-title">我的错题本</h2>
      <p class="wb-sub">把做错的题收进来，标注掌握度，反复练到会为止。</p>
    </header>

    <div class="wb-toolbar">
      <el-select v-model="filter.masteryLevel" placeholder="全部掌握度" clearable size="default" style="width: 150px">
        <el-option label="未掌握" :value="0" />
        <el-option label="复习中" :value="1" />
        <el-option label="已掌握" :value="2" />
      </el-select>
      <el-input v-model="filter.subject" placeholder="学科（如 数学）" clearable size="default" style="width: 180px" />
      <el-button type="primary" @click="load">查询</el-button>
      <div class="wb-space" />
      <span class="wb-count">共 {{ rows.length }} 题</span>
      <el-button type="primary" plain :disabled="!rows.length" @click="startPractice">重练一批</el-button>
    </div>

    <!-- 重练模式：遮住答案重新作答，结算后自动跟进掌握度并上报学习行为 -->
    <div v-if="practicing" class="wb-practice">
      <div class="wb-practice__head">
        <template v-if="!practiceDone">
          <span class="wb-practice__step">第 {{ practiceIndex + 1 }} / {{ practiceList.length }} 题</span>
          <span class="wb-practice__meta">本轮已答对 {{ practiceCorrectCount }} 题</span>
        </template>
        <div class="wb-space" />
        <el-button plain @click="exitPractice">退出重练</el-button>
      </div>

      <div v-if="practiceDone" class="wb-card wb-done">
        <h3 class="wb-done__title">本轮重练完成 🎉</h3>
        <p class="wb-done__line">共 {{ practiceList.length }} 题，答对 {{ practiceCorrectCount }} 题，正确率 {{ practiceAccuracy }}%。</p>
        <p class="wb-practice__hint">答对的已自动订正并标记「已掌握」，答错的标记「复习中」——下次重练按当前筛选优先出现。</p>
        <div class="wb-card__act">
          <el-button type="primary" @click="startPractice">再来一轮</el-button>
          <el-button @click="exitPractice">返回错题本</el-button>
        </div>
      </div>

      <article v-else-if="currentQ" class="wb-card">
        <div class="wb-card__top">
          <el-tag size="small" :type="masteryType(currentQ.masteryLevel)">{{ masteryLabel(currentQ.masteryLevel) }}</el-tag>
          <el-tag v-if="currentQ.questionType" size="small" type="info">{{ typeLabelOf(currentQ) }}</el-tag>
          <span class="wb-card__meta">已错 {{ currentQ.wrongCount ?? 0 }} 次 · 复习 {{ currentQ.reviewCount ?? 0 }} 次</span>
        </div>
        <p class="wb-card__stem">{{ currentQ.questionStem || "（题目正文缺失）" }}</p>

        <!-- 单选 / 多选 -->
        <div v-if="isChoice(currentQ)" class="wb-opts">
          <button
            v-for="opt in choiceOptions(currentQ)"
            :key="opt.letter"
            type="button"
            class="wb-opt"
            :class="{ 'is-picked': isPicked(opt.letter) }"
            @click="pickOption(opt.letter)"
          >
            <b class="wb-opt__letter">{{ opt.letter }}</b>
            <span>{{ opt.text }}</span>
          </button>
        </div>

        <!-- 判断 -->
        <div v-else-if="isJudge(currentQ)" class="wb-opts">
          <button type="button" class="wb-opt" :class="{ 'is-picked': practiceAnswer === '对' }" @click="practiceAnswer = '对'">
            <b class="wb-opt__letter">✓</b>
            <span>对</span>
          </button>
          <button type="button" class="wb-opt" :class="{ 'is-picked': practiceAnswer === '错' }" @click="practiceAnswer = '错'">
            <b class="wb-opt__letter">✗</b>
            <span>错</span>
          </button>
        </div>

        <!-- 填空 -->
        <el-input
          v-else-if="isFill(currentQ)"
          v-model="practiceAnswer"
          class="wb-fill"
          placeholder="填写答案后提交"
          :disabled="!!practiceFeedback"
        />

        <!-- 主观题无法自动判分：对照答案自评 -->
        <div v-else class="wb-self">
          <p class="wb-practice__hint">主观题无法自动判分，先在心里作答，再对照答案自评：</p>
          <div class="wb-opts">
            <button type="button" class="wb-opt" :class="{ 'is-picked': practiceSelf === true }" @click="practiceSelf = true">
              <b class="wb-opt__letter">✓</b>
              <span>我答对了</span>
            </button>
            <button type="button" class="wb-opt" :class="{ 'is-picked': practiceSelf === false }" @click="practiceSelf = false">
              <b class="wb-opt__letter">✗</b>
              <span>我答错了</span>
            </button>
          </div>
          <p v-if="practiceFeedback" class="wb-card__ans">参考答案：<b>{{ currentQ.questionAnswer || "—" }}</b></p>
        </div>

        <p v-if="practiceFeedback && !isSubjective(currentQ)" class="wb-feedback" :class="practiceFeedback.correct ? 'is-ok' : 'is-bad'">
          {{ practiceFeedback.correct ? "✅ 答对了" : `❌ 答错了，正确答案：${practiceFeedback.answer}` }}
        </p>
        <p v-if="practiceHint" class="wb-hint">{{ practiceHint }}</p>

        <div class="wb-card__act">
          <el-button v-if="!practiceFeedback" type="primary" @click="submitOne">提交本题</el-button>
          <el-button v-else type="primary" @click="nextOne">
            {{ practiceIndex + 1 >= practiceList.length ? "完成本轮" : "下一题" }}
          </el-button>
        </div>
      </article>
    </div>

    <div v-else v-loading="loading" class="wb-list">
      <el-empty v-if="!loading && !rows.length" description="还没有错题，继续加油！" />
      <article v-for="row in rows" :key="row.wrongQuestionId" class="wb-card">
        <div class="wb-card__top">
          <el-tag size="small" :type="masteryType(row.masteryLevel)">{{ masteryLabel(row.masteryLevel) }}</el-tag>
          <el-tag v-if="row.questionSubject" size="small" type="info">{{ row.questionSubject }}</el-tag>
          <el-tag v-if="row.questionType" size="small" type="info">{{ row.questionType }}</el-tag>
          <span class="wb-card__meta">错 {{ row.wrongCount ?? 0 }} 次 · 复习 {{ row.reviewCount ?? 0 }} 次</span>
        </div>
        <p class="wb-card__stem">{{ row.questionStem || "（题目正文缺失）" }}</p>
        <ul v-if="optionsOf(row).length" class="wb-card__opts">
          <li v-for="(opt, i) in optionsOf(row)" :key="i">{{ opt }}</li>
        </ul>
        <p v-if="revealed[row.wrongQuestionId]" class="wb-card__ans">
          答案：<b>{{ row.questionAnswer || "—" }}</b>
        </p>
        <div class="wb-card__act">
          <el-button link type="primary" @click="revealed[row.wrongQuestionId] = !revealed[row.wrongQuestionId]">
            {{ revealed[row.wrongQuestionId] ? "收起答案" : "查看答案" }}
          </el-button>
          <el-button
            v-if="row.corrected"
            link
            type="success"
            disabled
            title="已订正"
          >已订正</el-button>
          <el-button v-else link type="success" @click="markCorrected(row)">订正</el-button>
          <el-button link type="warning" @click="setMastery(row, 1)">标记复习中</el-button>
          <el-button link type="success" @click="setMastery(row, 2)">标记已掌握</el-button>
          <el-button v-if="row.masteryLevel !== 0" link @click="setMastery(row, 0)">重置未掌握</el-button>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentWrongbookView —— 学生端错题本（内嵌于学生门户，不做整屏定位）。
 *
 * <p>数据走 {@code /v2/edu/student/wrongbook}：后端按登录态的学号过滤，
 * 学生只能看到自己的错题，且返回题干/选项/答案，便于直接复习。</p>
 *
 * <p>「重练」把当前筛选出的错题遮住答案重新作答（每轮最多 {@value PRACTICE_CAP} 题，
 * 未掌握优先）：客观题自动判分，主观题自评；答对自动订正并标「已掌握」，
 * 答错标「复习中」，一轮结束上报学习行为（moduleCode=wrongbook）。</p>
 */
import { message } from "@repo/core";
import { computed, onMounted, reactive, ref } from "vue";

import { eduaiApi } from "../../api/eduaiApi";
import type { StudentWrongQuestion } from "../../api/types";
import { errText } from "../../api/errorText";
import { STUDY_PROGRESS_PER_ROUND, useStudyReport } from "../../composables/useStudyReport";

const loading = ref(false);
const rows = ref<StudentWrongQuestion[]>([]);
const revealed = reactive<Record<number, boolean>>({});
const filter = reactive<{ subject: string; masteryLevel: number | null }>({ subject: "", masteryLevel: null });
/** 学习行为上报器：仅学生端内嵌时真正发请求（老师/管理员在后台打开不报错） */
const { report: reportStudy } = useStudyReport();

const masteryLabel = (n?: number | null) => ({ 0: "未掌握", 1: "复习中", 2: "已掌握" })[Number(n ?? 0)] ?? "未掌握";
const masteryType = (n?: number | null) => {
  const code = Number(n ?? 0);
  return code === 2 ? "success" : code === 1 ? "warning" : "danger";
};

/**
 * 解析选项 JSON：后端存的是 JSON 文本，兼容「纯字符串数组」与 {A:..} 两种形态。
 *
 * @param row 错题卡
 * @returns 选项文本数组
 */
function optionsOf(row: StudentWrongQuestion): string[] {
  const raw = row.questionOptions;
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((x) => String(x));
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => `${k}. ${String(v)}`);
    }
  } catch {
    return [raw];
  }
  return [];
}

async function load() {
  loading.value = true;
  try {
    rows.value = await eduaiApi.studentWrongbook({
      subject: filter.subject.trim() || undefined,
      masteryLevel: filter.masteryLevel ?? undefined,
    });
  } catch (e) {
    message.error("错题加载失败：" + (errText(e) || "未知错误"));
  } finally {
    loading.value = false;
  }
}

async function setMastery(row: StudentWrongQuestion, level: number) {
  try {
    await eduaiApi.updateStudentWrongMastery(row.wrongQuestionId, level);
    row.masteryLevel = level;
    message.success(`已标记为「${masteryLabel(level)}」`);
  } catch (e) {
    message.error("标记失败：" + (errText(e) || "未知错误"));
  }
}

async function markCorrected(row: StudentWrongQuestion) {
  try {
    await eduaiApi.updateStudentWrongCorrected(row.wrongQuestionId);
    row.corrected = 1;
    message.success("已标记订正");
  } catch (e) {
    message.error("订正失败：" + (errText(e) || "未知错误"));
  }
}

/* ==================== 错题重练 ==================== */

/** 每轮最多重练的题数；一轮太长学生容易疲劳退出 */
const PRACTICE_CAP = 10;
const PRACTICE_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

/** 题型码值 → 中文（与 QuestionView.QUESTION_TYPES 同词表；独立声明避免视图间互相依赖） */
const QUESTION_TYPE_LABELS: Record<string, string> = {
  SINGLE_CHOICE: "单选题",
  MULTIPLE_CHOICE: "多选题",
  JUDGE: "判断题",
  FILL: "填空题",
  SHORT_ANSWER: "简答题",
  SUBJECTIVE: "主观题",
  ESSAY: "论述题",
};

const practicing = ref(false);
const practiceDone = ref(false);
const practiceList = ref<StudentWrongQuestion[]>([]);
const practiceIndex = ref(0);
/** 单选字母 / 判断「对|错」/ 填空文本 共用的作答值 */
const practiceAnswer = ref("");
/** 多选题已选字母（点击切换，提交时整体比对） */
const practiceMulti = ref<string[]>([]);
/** 主观题自评：null 表示还没评 */
const practiceSelf = ref<boolean | null>(null);
const practiceFeedback = ref<{ correct: boolean; answer: string } | null>(null);
const practiceHint = ref("");
const practiceCorrectCount = ref(0);

const currentQ = computed(() => practiceList.value[practiceIndex.value] ?? null);
const practiceAccuracy = computed(() =>
  practiceList.value.length ? Math.round((practiceCorrectCount.value / practiceList.value.length) * 100) : 0,
);

const typeLabelOf = (row: StudentWrongQuestion) => QUESTION_TYPE_LABELS[row.questionType ?? ""] ?? row.questionType ?? "-";
const isMulti = (row: StudentWrongQuestion) => row.questionType === "MULTIPLE_CHOICE";
const isChoice = (row: StudentWrongQuestion) => row.questionType === "SINGLE_CHOICE" || isMulti(row);
const isJudge = (row: StudentWrongQuestion) => row.questionType === "JUDGE";
const isFill = (row: StudentWrongQuestion) => row.questionType === "FILL";
const isSubjective = (row: StudentWrongQuestion) =>
  row.questionType === "SHORT_ANSWER" || row.questionType === "SUBJECTIVE" || row.questionType === "ESSAY";

/**
 * 重练用的选项（字母 + 文本）。
 *
 * <p>与 {@code optionsOf} 的差异：展示版把对象形态拼成 "A. xx" 字符串，
 * 这里有判分需求，必须保留字母与文本的对应关系；纯数组形态按序补 A/B/C。</p>
 */
function choiceOptions(row: StudentWrongQuestion): Array<{ letter: string; text: string }> {
  const raw = row.questionOptions;
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((x, i) => ({ letter: PRACTICE_LETTERS[i] ?? String(i + 1), text: String(x) }));
    }
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([k, v]) => ({ letter: k, text: String(v) }));
    }
  } catch {
    return [];
  }
  return [];
}

/** 文本归一：去空白与常见标点、转小写，用于填空比对 */
function normText(s: string): string {
  return s.replace(/[\s，。；、！？,.!?]/g, "").toLowerCase();
}

/** 判断题答案归一：对/错的各种写法（T/F/√/×/正确/错误…）收敛为「对」「错」 */
function judgeValue(s: string): string {
  const t = (s ?? "").trim().toLowerCase();
  if (["对", "正确", "是", "t", "true", "√", "y", "yes"].includes(t)) {
    return "对";
  }
  if (["错", "错误", "否", "f", "false", "×", "x", "no", "n"].includes(t)) {
    return "错";
  }
  return t;
}

/** 填空题多答案拆分：后端答案可能是「3；π」这类多个可接受写法 */
function fillAnswers(answer: string): string[] {
  return answer
    .split(/[／/;；、|]/)
    .map((x) => normText(x))
    .filter(Boolean);
}

/** 单选答案提取字母（兼容 "A" / "a" / "A. xxx"，只认首字母防止选项正文干扰） */
function answerLetter(answer: string): string {
  const m = (answer ?? "").trim().match(/^[A-Ha-h]/);
  return m ? m[0].toUpperCase() : "";
}

/** 多选答案提取字母集合（"ABC" / "A,B" / "A、B" 均可） */
function answerLetters(answer: string): string[] {
  const m = (answer ?? "").toUpperCase().match(/[A-H]/g);
  return m ? [...new Set(m)].sort() : [];
}

/** 开一轮重练：未掌握优先，其后复习中，已掌握垫底；每轮最多 PRACTICE_CAP 题 */
function startPractice() {
  if (!rows.value.length) {
    return;
  }
  const weight = (m?: number | null) => {
    const n = Number(m ?? 0);
    return n === 0 ? 0 : n === 1 ? 1 : 2;
  };
  practiceList.value = [...rows.value]
    .sort((a, b) => weight(a.masteryLevel) - weight(b.masteryLevel))
    .slice(0, PRACTICE_CAP);
  practiceIndex.value = 0;
  practiceCorrectCount.value = 0;
  practiceDone.value = false;
  practicing.value = true;
  resetOne();
}

/** 清空当前题的作答状态（切题 / 开新轮共用） */
function resetOne() {
  practiceAnswer.value = "";
  practiceMulti.value = [];
  practiceSelf.value = null;
  practiceFeedback.value = null;
  practiceHint.value = "";
}

/** 点击选项：多选切换选中态，单选直接定值；已出反馈后锁定 */
function pickOption(letter: string) {
  const q = currentQ.value;
  if (!q || practiceFeedback.value) {
    return;
  }
  if (isMulti(q)) {
    const set = new Set(practiceMulti.value);
    if (set.has(letter)) {
      set.delete(letter);
    } else {
      set.add(letter);
    }
    practiceMulti.value = [...set].sort();
    return;
  }
  practiceAnswer.value = letter;
}

function isPicked(letter: string): boolean {
  const q = currentQ.value;
  if (!q) {
    return false;
  }
  return isMulti(q) ? practiceMulti.value.includes(letter) : practiceAnswer.value === letter;
}

/** 本题判分并给出反馈；客观题自动比对，主观题采用自评结果 */
function submitOne() {
  const q = currentQ.value;
  if (!q || practiceFeedback.value) {
    return;
  }
  const answer = (q.questionAnswer ?? "").trim();
  if (isChoice(q)) {
    if (isMulti(q)) {
      if (!practiceMulti.value.length) {
        practiceHint.value = "请先选择答案";
        return;
      }
      const correct = answerLetters(answer);
      settle(practiceMulti.value.join("") === correct.join(""), correct.join("、") || answer);
      return;
    }
    if (!practiceAnswer.value) {
      practiceHint.value = "请先选择一个选项";
      return;
    }
    const correct = answerLetter(answer);
    settle(practiceAnswer.value.toUpperCase() === correct, correct || answer);
    return;
  }
  if (isJudge(q)) {
    if (!practiceAnswer.value) {
      practiceHint.value = "请先判断对错";
      return;
    }
    const correct = judgeValue(answer);
    settle(judgeValue(practiceAnswer.value) === correct, correct || answer);
    return;
  }
  if (isFill(q)) {
    if (!practiceAnswer.value.trim()) {
      practiceHint.value = "请先填写答案";
      return;
    }
    settle(fillAnswers(answer).includes(normText(practiceAnswer.value)), answer);
    return;
  }
  if (practiceSelf.value === null) {
    practiceHint.value = "请先自评是否答对";
    return;
  }
  settle(practiceSelf.value, answer);
}

function settle(correct: boolean, answerText: string) {
  practiceFeedback.value = { correct, answer: answerText || "—" };
  practiceHint.value = "";
  if (correct) {
    practiceCorrectCount.value += 1;
  }
}

/**
 * 进入下一题（最后一题则结算）。
 *
 * <p>本题结果在点击「下一题」时即落到服务端：答对 → 已掌握 + 已订正，
 * 答错 → 复习中。逐题落库的好处是中途退出也不丢已完成的订正。</p>
 */
async function nextOne() {
  const q = currentQ.value;
  const fb = practiceFeedback.value;
  if (!q || !fb) {
    return;
  }
  try {
    if (fb.correct) {
      await eduaiApi.updateStudentWrongMastery(q.wrongQuestionId, 2);
      await eduaiApi.updateStudentWrongCorrected(q.wrongQuestionId);
    } else {
      await eduaiApi.updateStudentWrongMastery(q.wrongQuestionId, 1);
    }
  } catch (e) {
    // 单题保存失败不阻塞整轮，提示后继续；最终以 load() 拉回服务端状态
    practiceHint.value = "本题结果保存失败：" + (errText(e) || "未知错误");
  }
  if (practiceIndex.value + 1 >= practiceList.value.length) {
    await finishPractice();
  } else {
    practiceIndex.value += 1;
    resetOne();
  }
}

/** 一轮结束：上报学习行为（仅学生端内嵌生效）并刷新列表 */
async function finishPractice() {
  practiceDone.value = true;
  reportStudy({
    moduleCode: "wrongbook",
    questionCount: practiceList.value.length,
    correctCount: practiceCorrectCount.value,
    points: practiceCorrectCount.value * 10,
    progressDelta: STUDY_PROGRESS_PER_ROUND,
  });
  await load();
}

/** 退出重练回到错题列表（列表已在结算时刷新过；中途退出也会在下次进入时重新拉取） */
function exitPractice() {
  practicing.value = false;
  practiceDone.value = false;
  practiceList.value = [];
  resetOne();
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
.wb {
  padding: 18px 20px 28px;
}
.wb-title {
  margin: 0;
  font-size: 22px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.wb-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.wb-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin: 16px 0 14px;
}
.wb-space {
  flex: 1;
}
.wb-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.wb-list {
  min-height: 160px;
}
.wb-card {
  padding: 16px 18px;
  margin-bottom: 12px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
}
.wb-card__top {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.wb-card__meta {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.wb-card__stem {
  margin: 10px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
}
.wb-card__opts {
  margin: 8px 0 0;
  padding-left: 20px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.wb-card__ans {
  margin: 10px 0 0;
  font-size: 14px;
  color: var(--el-color-success);
}

/* ==================== 重练模式 ==================== */
.wb-practice__head {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.wb-practice__step {
  font-size: 15px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.wb-practice__meta {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-success);
}
.wb-practice__hint {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
/*
 * 作答选项：按钮语义（原生 button + type=button），min-height 44px
 * 与本页 .wb-card__act 的移动端口径一致（WCAG 2.5.8 AA/AAA）。
 * 网格自适应列宽，选项文本长时自动换行不溢出。
 */
.wb-opts {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.wb-opt {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 10px 14px;
  font-size: 14px;
  line-height: 1.5;
  text-align: left;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
}
.wb-opt:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}
.wb-opt:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
.wb-opt.is-picked {
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}
.wb-opt__letter {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 13px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: 50%;
}
.wb-fill {
  margin-top: 14px;
}
.wb-self {
  margin-top: 4px;
}
.wb-feedback {
  margin: 12px 0 0;
  font-size: 14px;
  font-weight: 700;
}
.wb-feedback.is-ok {
  color: var(--el-color-success);
}
.wb-feedback.is-bad {
  color: var(--el-color-danger);
}
.wb-hint {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-color-warning);
}
.wb-done {
  padding: 28px 18px;
  text-align: center;
}
.wb-done__title {
  margin: 0;
  font-size: 20px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.wb-done__line {
  margin: 10px 0 0;
  font-size: 15px;
  color: var(--el-text-color-regular);
}
/*
 * 操作区按钮。这三个原来是 el-button link，element-plus 的 link 型默认
 * 高 20px —— 低于 WCAG 2.2 的 2.5.8 Target Size (Minimum, AA) 24x24 硬底线，
 * 全站扫描判 FAIL。
 *
 * 判据边界（不要照抄到别处）：
 *   - 同页的 el-tag 也是 20px，但 tag 不是可点目标，2.5.8 不适用，不动。
 *   - 这里不用 link 型了：错题本是学生端纯卡片页，手机上按的频次最高，
 *     给成实心小药丸（和「我的答题」的 .mr-card__go 同一套 token）。
 * 移动指针粗设备给 44x44（AAA），鼠标设备 40px 视觉更平衡 —— AA 的 24px
 * 底线两种情况都过。
 */
.wb-card__act {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 14px;
}
.wb-card__act :deep(.el-button) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: var(--el-radius-full, 9999px);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.wb-card__act :deep(.el-button:hover) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgb(0 0 0 / 8%);
}
.wb-card__act :deep(.el-button:focus-visible) {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}
/* 触摸设备补到 AAA 的 44px */
@media (pointer: coarse) {
  .wb-card__act :deep(.el-button) {
    min-height: 44px;
    padding: 0 18px;
  }
}
/* 窄屏按钮铺开，别三个挤在 390px 里 */
@media (max-width: 480px) {
  .wb-card {
    padding: 14px 13px;
  }
  .wb-card__act :deep(.el-button) {
    flex: 1 1 auto;
    min-width: 0;
  }
}
</style>
