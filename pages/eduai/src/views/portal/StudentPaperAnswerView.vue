<template>
  <div class="pa">
    <!-- ============ 已提交：等待 AI 阅卷 / 查看结果 ============ -->
    <div v-if="phase === 'submitted'" class="pa-done">
      <div class="pa-done__card">
        <template v-if="result && result.taskStatus === 3">
          <p class="pa-done__stage is-error">
            {{ result.error || "本次阅卷没有成功，成绩暂未生成，请联系老师处理。" }}
          </p>
        </template>
        <template v-else-if="result">
          <div class="pa-done__score">
            <span class="pa-done__score-label">{{ result.finished ? "我的得分" : "当前得分" }}</span>
            <b class="pa-done__score-num">{{ result.totalScore }}</b>
            <span class="pa-done__score-total">/ {{ paper?.paperTotalScore ?? result.total ?? 0 }}</span>
          </div>
          <p class="pa-done__stage">
            {{ result.finished ? "阅卷已完成，成绩已记入错题本与学习报告。" : `AI 阅卷中：${result.stage || "请稍候…"}` }}
          </p>
          <ul v-if="result.finished && result.results.length" class="pa-done__list">
            <li v-for="r in result.results" :key="r.resultId" class="pa-done__row">
              <span class="pa-done__q">第 {{ questionNoOf(r.questionId) }} 题</span>
              <span class="pa-done__s">{{ r.teacherScore ?? r.score }} 分</span>
              <span class="pa-done__c">{{ r.teacherComment || r.comment || "—" }}</span>
            </li>
          </ul>
          <button
            v-if="result.finished && result.results.length && hasReviewData"
            type="button"
            class="pa-btn pa-btn--ghost"
            @click="showReview = !showReview"
          >{{ showReview ? "收起答案与解析" : "查看标准答案与解析" }}</button>
          <div v-if="showReview && result.finished" class="pa-review">
            <div v-for="r in result.results" :key="'rv-' + r.resultId" class="pa-review__row">
              <p class="pa-review__head">第 {{ questionNoOf(r.questionId) }} 题 · 得 {{ r.teacherScore ?? r.score }} 分</p>
              <p v-if="answerOf(r.questionId)" class="pa-review__line">正确答案：{{ answerOf(r.questionId) }}</p>
              <p v-if="analysisOf(r.questionId)" class="pa-review__line">解析：{{ analysisOf(r.questionId) }}</p>
            </div>
          </div>
        </template>
        <template v-else-if="pollError">
          <p class="pa-done__stage is-error">阅卷结果查询失败：{{ pollError }}</p>
          <button type="button" class="pa-btn" @click="() => startPolling()">重新查询</button>
        </template>
        <template v-else>
          <span class="pa-done__spin" aria-hidden="true"></span>
          <p class="pa-done__stage">答卷已提交，AI 正在阅卷，请稍候…</p>
        </template>
        <button type="button" class="pa-btn pa-btn--ghost" @click="emit('close')">返回我的试卷</button>
      </div>
    </div>

    <!-- ============ 作答中 ============ -->
    <template v-else>
      <header class="pa-head">
        <div class="pa-head__text">
          <h2 class="pa-title">{{ paper?.paperName || "试卷作答" }}</h2>
          <p class="pa-sub">
            <span class="pa-chip">{{ paper?.paperSubject || "—" }}</span>
            <span class="pa-chip">共 {{ questions.length }} 题</span>
            <span class="pa-chip">总分 {{ paper?.paperTotalScore ?? 0 }}</span>
            <span
              class="pa-chip pa-chip--time"
              :class="{
                'is-warn': timed && remainingSec <= 300 && remainingSec > 60,
                'is-danger': timed && remainingSec <= 60,
              }"
            >
              {{ timed ? `剩余 ${countdownText}` : "不限时" }}
            </span>
          </p>
        </div>
        <button type="button" class="pa-back" @click="emit('close')">退出作答</button>
      </header>

      <div v-loading="loading" class="pa-body">
        <nav class="pa-nav" aria-label="答题卡">
          <span class="pa-nav__label">答题卡</span>
          <div class="pa-nav__dots">
            <button
              v-for="(q, i) in questions"
              :key="'nav-' + q.id"
              type="button"
              class="pa-nav__dot"
              :class="{ 'is-done': !!(answers[q.id] ?? '').trim() }"
              :title="`第 ${q.order ?? i + 1} 题${(answers[q.id] ?? '').trim() ? '（已作答）' : '（未作答）'}`"
              @click="scrollToQuestion(q)"
            >{{ q.order ?? i + 1 }}</button>
          </div>
        </nav>
        <ol class="pa-qs">
          <li v-for="(q, i) in questions" :id="'pa-q-' + q.id" :key="q.id" class="pa-q">
            <div class="pa-q__stem">
              <span class="pa-q__no">{{ q.order ?? i + 1 }}.</span>
              <span class="pa-q__text">{{ q.stem }}</span>
              <span class="pa-q__score">{{ q.score ?? 0 }} 分</span>
            </div>

            <!-- 单选 / 多选：字母块（选项是 JSON 或换行分号分隔的字符串，统一解析） -->
            <div v-if="isChoice(q.type)" class="pa-q__opts">
              <button
                v-for="(opt, oi) in parseOptions(q.options)"
                :key="oi"
                type="button"
                class="pa-opt"
                :class="{ 'is-active': hasChoice(q, oi) }"
                :aria-pressed="hasChoice(q, oi)"
                @click="toggleChoice(q, oi)"
              >
                <span class="pa-opt__letter">{{ optionLetter(oi) }}</span>
                <span class="pa-opt__text">{{ opt }}</span>
              </button>
            </div>

            <!-- 判断题：对 / 错 -->
            <div v-else-if="q.type === 'JUDGE'" class="pa-q__opts">
              <button
                v-for="v in ['对', '错']"
                :key="v"
                type="button"
                class="pa-opt pa-opt--judge"
                :class="{ 'is-active': answers[q.id] === v }"
                :aria-pressed="answers[q.id] === v"
                @click="setAnswer(q.id, v)"
              >{{ v }}</button>
            </div>

            <!-- 填空 / 简答 / 作文：文本作答 -->
            <textarea
              v-else
              class="pa-q__input"
              rows="3"
              :placeholder="q.type === 'FILL' ? '多个空用 / 分隔' : '写下你的答案…'"
              :value="answers[q.id] ?? ''"
              @input="setAnswer(q.id, ($event.target as HTMLTextAreaElement).value)"
            ></textarea>
            <span class="pa-q__count">{{ (answers[q.id] ?? "").length }} 字</span>
          </li>
        </ol>
        <div v-if="!loading && !questions.length" class="pa-empty">这份试卷还没有题目。</div>
      </div>

      <footer class="pa-foot">
        <span class="pa-foot__hint">已答 {{ answeredCount }}/{{ questions.length }} 题 · 作答会自动暂存，退出页面不会丢失</span>
        <button type="button" class="pa-btn" :disabled="submitting" @click="onSubmitClick">
          {{ submitting ? "交卷中…" : "交卷" }}
        </button>
      </footer>

      <ReConfirmDialog ref="confirmDialog" />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * StudentPaperAnswerView —— 学生在线作答（内嵌于「我的试卷」之上）
 *
 * <p>数据走 {@code /v2/edu/student/papers/{id}/answer}（脱敏详情，不含答案/解析），
 * 提交走 {@code /v2/edu/student/papers/{id}/submit}。身份/班级/考试关联全部由
 * 服务端按登录态与布置关系推导，前端只负责出题、计时、暂存与提交。</p>
 *
 * <p>可靠性约定：
 * <ul>
 *   <li>进入页面先查本人阅卷任务：该卷已提交过则直接进入结果态（刷新/重复进入不重考）；</li>
 *   <li>作答内容实时写入 localStorage 草稿，换页/断网不丢；</li>
 *   <li>限时卷到点自动交卷（免确认），平时交卷弹统一确认框；</li>
 *   <li>提交后轮询阅卷结果，AI 判分完成前显示阶段提示。</li>
 * </ul></p>
 */
import { message } from "@repo/core";
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

import { eduaiApi } from "../../api/eduaiApi";
import { errText } from "../../api/errorText";
import type { Paper, PaperQuestionItem } from "../../api/types";
import ReConfirmDialog from "../../components/shared/ReConfirmDialog.vue";
import { optionLetter, parseOptions } from "./paperOption";

const props = defineProps<{ paperId: number }>();
const emit = defineEmits<{ (e: "close"): void }>();

const loading = ref(false);
const submitting = ref(false);
const paper = ref<Paper | null>(null);
const questions = computed<PaperQuestionItem[]>(() => paper.value?.questions ?? []);

/** 作答内容：questionId -> 作答文本（选择题存字母，多选存逗号分隔字母） */
const answers = reactive<Record<number, string>>({});
const confirmDialog = ref<InstanceType<typeof ReConfirmDialog> | null>(null);

const phase = ref<"answering" | "submitted">("answering");
const result = ref<Awaited<ReturnType<typeof eduaiApi.studentMarkingResult>> | null>(null);
const pollError = ref("");
const showReview = ref(false);
let pollTimer = 0;

/** 草稿 localStorage 键：按试卷隔离，避免多卷串味 */
const draftKey = computed(() => `eduai:answer-draft:${props.paperId}`);
/** 服务端校准的交卷截止时间戳（毫秒）；0 = 未校准/不限时 */
const deadlineTs = ref(0);
const timed = computed(() => deadlineTs.value > 0);

const nowTs = ref(Date.now());
const remainingSec = computed(() => {
  if (!timed.value) return Number.MAX_SAFE_INTEGER;
  return Math.max(0, Math.ceil((deadlineTs.value - nowTs.value) / 1000));
});
const countdownText = computed(() => {
  const s = remainingSec.value === Number.MAX_SAFE_INTEGER ? 0 : remainingSec.value;
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
});
let tickTimer = 0;

/** 以服务端为准校准倒计时：取本人草稿卷的剩余秒数，换算成本地截止时间戳（吸收时钟偏差） */
async function syncTimer(): Promise<void> {
  try {
    const t = await eduaiApi.studentPaperTimer(props.paperId);
    if (t && t.timed && t.remainingSeconds >= 0) {
      deadlineTs.value = Date.now() + t.remainingSeconds * 1000;
    }
  } catch {
    // 校准失败不阻断作答：交卷时服务端仍会做权威校验
  }
}

function isChoice(type?: string): boolean {
  return type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
}

/** 阅卷结果的 questionId 换算成卷面题号（与答题卡同口径）；映射不到退回原始 id */
function questionNoOf(questionId: number): number {
  const idx = questions.value.findIndex((x) => x.id === questionId);
  return idx < 0 ? questionId : questions.value[idx].order ?? idx + 1;
}

/** 复盘用的标准答案 / 解析（拉到完整详情后才有值，脱敏详情里是空的） */
function answerOf(questionId: number): string {
  return questions.value.find((x) => x.id === questionId)?.answer ?? "";
}

function analysisOf(questionId: number): string {
  return questions.value.find((x) => x.id === questionId)?.analysis ?? "";
}

/** 标准答案/解析至少有一份可看才出复盘入口（老试卷可能都没录） */
const hasReviewData = computed(() => questions.value.some((q) => q.answer || q.analysis));

/** 答题卡跳题：滚到对应题目卡片 */
function scrollToQuestion(q: PaperQuestionItem): void {
  document.getElementById(`pa-q-${q.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/** 已作答题数（底部进度提示用） */
const answeredCount = computed(
  () => questions.value.filter((q) => (answers[q.id] ?? "").trim()).length,
);

function hasChoice(q: PaperQuestionItem, optionIndex: number): boolean {
  return (answers[q.id] ?? "").split(",").includes(optionLetter(optionIndex));
}

/** 选择题点选：单选直接覆盖；多选切换选中态后按字母序拼接 */
function toggleChoice(q: PaperQuestionItem, optionIndex: number): void {
  const L = optionLetter(optionIndex);
  if (q.type === "SINGLE_CHOICE") {
    answers[q.id] = L;
    return;
  }
  const cur = (answers[q.id] ?? "").split(",").filter(Boolean);
  const next = cur.includes(L) ? cur.filter((x) => x !== L) : [...cur, L];
  answers[q.id] = next.sort().join(",");
}

function setAnswer(questionId: number, value: string): void {
  answers[questionId] = value;
}

/** 草稿暂存：任何作答变化立即落盘 */
function persistDraft(): void {
  try {
    localStorage.setItem(
      draftKey.value,
      JSON.stringify({ answers: { ...answers } }),
    );
  } catch {
    // 隐私模式/配额满时静默跳过：草稿是锦上添花，不能因为它中断作答
  }
}

function loadDraft(): boolean {
  try {
    const raw = localStorage.getItem(draftKey.value);
    if (!raw) return false;
    const draft = JSON.parse(raw) as { answers?: Record<number, string> };
    if (!draft || typeof draft !== "object") return false;
    Object.assign(answers, draft.answers ?? {});
    return Object.keys(answers).length > 0;
  } catch {
    return false;
  }
}

function clearDraft(): void {
  try {
    localStorage.removeItem(draftKey.value);
  } catch {
    // 同上，静默
  }
}

/** 未作答的题目数（交卷确认提示用） */
function unansweredCount(): number {
  return questions.value.filter((q) => !(answers[q.id] ?? "").trim()).length;
}

async function onSubmitClick(): Promise<void> {
  if (submitting.value) return;
  const left = unansweredCount();
  const leftNos = questions.value
    .map((q, i) => ({ no: q.order ?? i + 1, text: (answers[q.id] ?? "").trim() }))
    .filter((x) => !x.text)
    .map((x) => x.no);
  const tip =
    left > 0
      ? `还有 ${left} 题未作答（第 ${leftNos.slice(0, 8).join("、")}${leftNos.length > 8 ? " 等" : ""} 题），未作答按 0 分计。确认交卷吗？`
      : "确认交卷吗？交卷后将进入 AI 阅卷，不能再修改答案。";
  const ok = await confirmDialog.value?.open(tip, { title: "交卷确认" });
  if (!ok) return;
  await doSubmit();
}

/** 真正提交：组包 -> 调接口 -> 清草稿 -> 进入结果态开始轮询 */
async function doSubmit(): Promise<void> {
  submitting.value = true;
  try {
    const payload = {
      content: JSON.stringify(answers),
      answers: questions.value.map((q) => ({ questionId: q.id, answer: answers[q.id] ?? "" })),
    };
    const taskId = await eduaiApi.studentSubmitPaper(props.paperId, payload);
    clearDraft();
    phase.value = "submitted";
    // 优先用提交返回的任务号轮询；拿不到（异常报文）再从本人任务列表反查
    if (taskId) {
      startPolling(taskId);
    } else {
      await locateExistingTask();
    }
  } catch (e) {
    const text = errText(e) || "提交失败，请稍后重试";
    if (/重复|已存在|已提交|已经提交/.test(text)) {
      // 撞上唯一键兜底：同一考试同一学生只允许一份答题卡
      message.info("这张卷子你已经交过了");
      phase.value = "submitted";
      await locateExistingTask();
    } else {
      message.error(text);
    }
  } finally {
    submitting.value = false;
  }
}

/** 在本人阅卷任务里找本卷：已提交过就直接进入结果态（刷新/重复进入不重考） */
async function locateExistingTask(): Promise<boolean> {
  try {
    const tasks = (await eduaiApi.studentMarkingTasks(50)) ?? [];
    const mine = tasks.find((t) => t.markingTaskPaperId === props.paperId);
    if (mine?.markingTaskTaskId) {
      phase.value = "submitted";
      startPolling(mine.markingTaskTaskId);
      return true;
    }
  } catch {
    // 查不到任务不影响作答流程
  }
  return false;
}

/** 轮询阅卷结果；AI 判分是异步的，完成（或失败）即停 */
function startPolling(taskId?: string): void {
  stopPolling();
  pollError.value = "";
  const id = taskId ?? "";
  const poll = async () => {
    try {
      result.value = await eduaiApi.studentMarkingResult(id);
      pollError.value = "";
      // finished = 判分结束（含失败）；失败在结果卡里单独展示，轮询到此为止
      if (result.value.finished) {
        stopPolling();
        // 阅卷成功结束后补拉完整详情（含答案解析）供复盘；作答中那份是脱敏的
        if (result.value.taskStatus !== 3) void load(true);
      }
    } catch (e) {
      // 查询失败即停并给出重试入口，避免对故障接口无限轮询
      pollError.value = errText(e) || "查询失败";
      stopPolling();
    }
  };
  void poll();
  pollTimer = window.setInterval(() => void poll(), 3000);
}

function stopPolling(): void {
  if (pollTimer) {
    window.clearInterval(pollTimer);
    pollTimer = 0;
  }
}

/** 完整详情只需拉一次（复盘用）；作答中始终用脱敏详情 */
let fullPaperLoaded = false;

async function load(full = false): Promise<void> {
  if (full && fullPaperLoaded) return;
  loading.value = true;
  try {
    // 已交卷的看完整详情（复盘要标准答案/解析）；作答中只给脱敏详情防抄答案
    paper.value = full
      ? await eduaiApi.myClassPaperDetail(props.paperId)
      : await eduaiApi.studentAnswerPaper(props.paperId);
    if (full) fullPaperLoaded = true;
  } catch (e) {
    message.error("试卷加载失败：" + (errText(e) || "未知错误"));
    emit("close");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  // 已提交过的卷子直接看结果，不再重考；结果态也拉详情（题号映射 + 复盘）
  const submitted = await locateExistingTask();
  await load(submitted);
  if (submitted) {
    return;
  }
  if (loadDraft()) {
    message.info("已恢复上次未提交的作答，交卷前可继续修改");
  }
  // 计时：以服务端（本人草稿卷创建时间）为锚校准倒计时；
  // 到点自动交卷（免确认 —— 超时本就是系统行为，再弹确认会卡死交卷）
  await syncTimer();
  tickTimer = window.setInterval(() => {
    nowTs.value = Date.now();
    if (timed.value && remainingSec.value <= 0 && phase.value === "answering" && !submitting.value) {
      message.info("考试时间已到，系统已自动交卷");
      void doSubmit();
    }
  }, 1000);
});

onBeforeUnmount(() => {
  stopPolling();
  if (tickTimer) {
    window.clearInterval(tickTimer);
    tickTimer = 0;
  }
});

// 作答变化即时暂存（深.watch reactive 对象即可）
watch(answers, persistDraft, { deep: true });
</script>

<style scoped>
.pa {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}
.pa-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.pa-title {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--el-text-color-primary);
}
.pa-sub {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0 0;
}
.pa-chip {
  padding: 1px 8px;
  border-radius: var(--el-radius-sm, 6px);
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.8;
}
.pa-chip--time {
  font-variant-numeric: tabular-nums;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
.pa-chip--time.is-danger {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}
.pa-back {
  flex-shrink: 0;
  padding: 6px 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-full, 9999px);
}
.pa-back:hover {
  color: var(--el-text-color-primary);
}
.pa-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 20px 20px;
}
.pa-qs {
  max-width: 860px;
  margin: 0 auto;
  padding-left: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.pa-q {
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-bg-color-overlay);
}
.pa-q__stem {
  display: flex;
  gap: 6px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}
.pa-q__no {
  flex-shrink: 0;
  font-weight: 700;
}
.pa-q__score {
  flex-shrink: 0;
  margin-left: auto;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pa-q__opts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}
.pa-opt {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  text-align: left;
}
.pa-opt:hover {
  border-color: var(--el-color-primary-light-5);
}
.pa-opt.is-active {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  font-weight: 700;
}
.pa-opt__letter {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 800;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color);
  border-radius: 50%;
}
.pa-opt.is-active .pa-opt__letter {
  color: var(--el-color-primary);
}
.pa-q__input {
  width: 100%;
  margin-top: 10px;
  padding: 8px 10px;
  font-family: inherit;
  font-size: 13px;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  resize: vertical;
  box-sizing: border-box;
}
.pa-empty {
  padding: 28px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-placeholder);
}
.pa-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.pa-foot__hint {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
.pa-btn {
  min-width: 120px;
  min-height: 40px;
  font-size: 14px;
  font-weight: 700;
  color: var(--el-color-white);
  cursor: pointer;
  background: var(--el-color-primary);
  border: none;
  border-radius: var(--el-radius-full, 9999px);
}
.pa-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.pa-btn--ghost {
  min-width: 0;
  color: var(--el-color-primary);
  background: transparent;
  border: 1px solid var(--el-color-primary-light-7);
  margin-top: 16px;
}

/* 答题卡：sticky 吸顶，随作答实时点亮，可横向滚动 */
.pa-nav {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 860px;
  margin: 0 auto 12px;
  padding: 8px 0;
  background: var(--el-bg-color);
}
.pa-nav__label {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.pa-nav__dots {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}
.pa-nav__dot {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--el-text-color-secondary);
  cursor: pointer;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 50%;
}
.pa-nav__dot.is-done {
  color: var(--el-color-white);
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
/* 文本题字数 */
.pa-q__count {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  color: var(--el-text-color-placeholder);
  text-align: right;
}
/* 倒计时预警两档：5 分钟内黄色，1 分钟内红色脉动 */
.pa-chip--time.is-warn {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2, var(--el-color-warning));
}
.pa-chip--time.is-danger {
  animation: pa-pulse 1s ease-in-out infinite;
}
@keyframes pa-pulse {
  50% {
    opacity: 0.55;
  }
}
/* 复盘：标准答案与解析 */
.pa-review {
  margin-top: 14px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.pa-review__row {
  padding: 10px 12px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
}
.pa-review__head {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.pa-review__line {
  margin: 4px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
}

/* 结果态 */
.pa-done {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow-y: auto;
}
.pa-done__card {
  width: min(640px, 100%);
  padding: 28px;
  text-align: center;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 16px);
  background: var(--el-bg-color-overlay);
}
.pa-done__score-label {
  display: block;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.pa-done__score-num {
  font-size: 44px;
  font-weight: 900;
  color: var(--el-color-primary);
  line-height: 1.2;
}
.pa-done__score-total {
  margin-left: 6px;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
.pa-done__stage {
  margin: 10px 0 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.pa-done__stage.is-error {
  color: var(--el-color-danger);
}
.pa-done__spin {
  display: inline-block;
  width: 28px;
  height: 28px;
  border: 3px solid var(--el-color-primary-light-7);
  border-top-color: var(--el-color-primary);
  border-radius: 50%;
  animation: pa-spin 0.9s linear infinite;
}
@keyframes pa-spin {
  to {
    transform: rotate(360deg);
  }
}
.pa-done__list {
  margin: 16px 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.pa-done__row {
  display: flex;
  gap: 10px;
  padding: 8px 10px;
  font-size: 13px;
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
}
.pa-done__q {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.pa-done__s {
  flex-shrink: 0;
  color: var(--el-color-primary);
  font-weight: 700;
}
.pa-done__c {
  min-width: 0;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 窄屏：头部按钮换行、脚垫收紧 */
@media (max-width: 720px) {
  .pa-head {
    flex-direction: column;
    padding: 14px 14px 10px;
  }
  .pa-back {
    align-self: flex-end;
  }
  .pa-body {
    padding: 12px 14px 16px;
  }
  .pa-foot {
    padding: 10px 14px;
  }
  .pa-btn {
    flex: 1;
    min-height: 44px;
  }
}
/* 系统减少动态效果：关掉转圈动画的旋转 */
@media (prefers-reduced-motion: reduce) {
  .pa-done__spin,
  .pa-chip--time.is-danger {
    animation: none;
  }
}
</style>
