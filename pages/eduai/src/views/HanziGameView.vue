<template>
  <div class="hg">
    <ReConfirmDialog ref="confirmDialog" />
    <div class="hg-inner">
      <header class="hg-head">
        <h1 class="hg-title k">
          汉字识字
          <span class="hg-title__dot" />
        </h1>
        <p class="hg-sub">看<b>字画</b>、读<b>读音</b>、数<b>笔画</b> —— 每题答完都会展示<b>笔顺</b>与释义。</p>
      </header>

      <!-- 练习偏好：学段 + 题量（出题仍由服务端按参数生成，这里只选择参数） -->
      <div class="hg-prefs">
        <div class="hg-prefs__group">
          <span class="hg-prefs__label">学段</span>
          <div class="hg-seg" role="group" aria-label="选择学段">
            <button type="button" class="hg-seg__item" :class="{ 'is-on': activeLevel === '' }" @click="setLevel('')">全部</button>
            <button
              v-for="g in gradeOptions"
              :key="g.value"
              type="button"
              class="hg-seg__item"
              :class="{ 'is-on': activeLevel === g.value }"
              @click="setLevel(g.value)"
            >
              {{ g.label }}
            </button>
          </div>
        </div>
        <div class="hg-prefs__group">
          <span class="hg-prefs__label">题量</span>
          <div class="hg-seg" role="group" aria-label="选择每批题量">
            <button
              v-for="n in BATCH_SIZES"
              :key="n"
              type="button"
              class="hg-seg__item"
              :class="{ 'is-on': batchSize === n }"
              @click="setBatchSize(n)"
            >
              {{ n }} 题
            </button>
          </div>
        </div>
      </div>

      <template v-if="!finished">
        <div class="hg-bar">
          <span class="hg-bar__step">第 <b>{{ questions.length ? index + 1 : 0 }}</b> / {{ questions.length }} 题</span>
          <span class="hg-bar__score">答对 <b>{{ score }}</b></span>
          <el-button size="small" @click="load">换一批</el-button>
          <el-button size="small" @click="openWrongBook">错题本{{ wrongCount ? `（${wrongCount}）` : "" }}</el-button>
          <el-button size="small" :title="soundOff ? '开启答题音效' : '关闭答题音效'" @click="toggleSound">
            {{ soundOff ? "🔇 静音" : "🔊 音效" }}
          </el-button>
        </div>

        <!-- 每题对错进度点条：一眼看到这一批的走势 -->
        <div v-if="questions.length" class="hg-dots" aria-hidden="true">
          <span v-for="i in questions.length" :key="i" class="hg-dots__dot" :class="dotClass(i - 1)" />
        </div>

        <div v-if="!current" class="hg-empty">
          <el-empty description="正在出题…" />
        </div>

        <template v-else>
          <!-- 字画：有图片用图片，否则把字本身当字形图展示 -->
          <div class="hg-card">
            <button v-if="canSpeak" type="button" class="hg-card__speak" aria-label="朗读这个字" @click="speakCurrent">🔊 听一听</button>
            <div class="hg-card__art">
              <!-- 字画裂图回落：加载失败退回楷体字形，保证题干始终可读 -->
              <img
                v-if="current.image && !imageFailed"
                :src="current.image"
                :alt="current.char"
                class="hg-card__img"
                @error="imageFailed = true"
              />
              <span v-else class="hg-card__char k">{{ current.char }}</span>
            </div>
            <div class="hg-card__ask">{{ askText }}</div>
            <!-- 对/错印章：判分后盖在字画上（reduced-motion 下直接显示不动画） -->
            <span v-if="answered" class="hg-stamp k" :class="isCorrect ? 'is-ok' : 'is-no'" aria-hidden="true">
              {{ isCorrect ? "对" : "错" }}
            </span>
          </div>

          <div class="hg-options" :class="{ 'hg-options--strokes': isOrder }">
            <button
              v-for="(opt, i) in current.options"
              :key="i"
              type="button"
              class="hg-opt"
              :class="optionClass(opt)"
              :disabled="answered"
              @click="isOrder ? tapStroke(opt) : choose(opt)"
            >
              {{ optionText(opt) }}
            </button>
          </div>

          <!-- 笔顺题：把已点的笔画显示出来，点满即判分 -->
          <div v-if="isOrder" class="hg-tapped">
            已点：<b>{{ tapped.length ? tapped.join(" ") : "—" }}</b>
            <span class="hg-tapped__count">{{ tapped.length }}/{{ orderTotal }}</span>
            <span class="hg-tapped__hint">（按第 1 笔、第 2 笔…的顺序点）</span>
            <span class="hg-tapped__acts">
              <button
                type="button"
                class="hg-tapped__undo"
                :disabled="answered || !tapped.length"
                @click="undoStroke"
              >
                ↩ 撤销上一笔
              </button>
              <button
                type="button"
                class="hg-tapped__undo"
                :disabled="answered || !tapped.length"
                @click="resetStrokes"
              >
                ↺ 重置
              </button>
            </span>
          </div>

          <p v-if="answered" class="hg-feedback" :class="{ 'is-ok': isCorrect }" aria-live="polite">
            {{ isCorrect ? "答对了！" : "正确答案：" + current.answer }}
          </p>
          <!-- 连击鼓励：独立徽标，不改动判分回显文案 -->
          <p v-if="answered && isCorrect && streak >= 2" class="hg-streak" aria-live="polite">
            🔥 连对 {{ streak }} 题，太棒了！
          </p>

          <!-- 答完即学习卡：把维护字段（笔顺/部首/结构/释义）讲清楚 -->
          <div v-if="answered" class="hg-learn">
            <div class="hg-learn__title">学习卡</div>
            <dl class="hg-learn__grid">
              <div><dt>读音</dt><dd>{{ current.pinyin || "—" }}</dd></div>
              <div><dt>笔画</dt><dd>{{ current.strokes != null ? current.strokes + " 笔" : "—" }}</dd></div>
              <div><dt>部首</dt><dd>{{ current.radical || "—" }}</dd></div>
              <div><dt>结构</dt><dd>{{ current.structure || "—" }}</dd></div>
              <div class="hg-learn__full">
                <dt>笔顺</dt>
                <dd>
                  <!-- 内置笔顺命中时内嵌逐笔动画（inline 复用悬停书写组件），否则回落静态笔顺文字 -->
                  <HanziHoverWrite
                    v-if="learnStrokeChar"
                    :key="learnStrokeChar"
                    inline
                    visible
                    :character="learnStrokeChar"
                  />
                  <span v-else class="hg-learn__strokes k">{{ current.strokeOrder || "—" }}</span>
                </dd>
              </div>
              <div class="hg-learn__full"><dt>释义 / 组词</dt><dd>{{ current.meaning || "—" }}</dd></div>
            </dl>
            <el-button type="primary" @click="next">{{ isLast ? "看成绩" : "下一题" }}</el-button>
          </div>
        </template>
      </template>

      <div v-else class="hg-done" :class="{ 'is-celebrate': celebrate }">
        <!-- 全对庆祝：彩纸从卡顶洒落（reduced-motion 下整体隐藏） -->
        <div v-if="celebrate" class="hg-confetti" aria-hidden="true">
          <span v-for="(p, i) in confetti" :key="i" class="hg-confetti__piece" :style="p" />
        </div>
        <div class="hg-done__stars" aria-hidden="true">
          <span v-for="s in 3" :key="s" class="hg-done__star" :class="{ 'is-on': s <= stars }">★</span>
        </div>
        <div class="hg-done__score">{{ score }} / {{ questions.length }}</div>
        <p class="hg-done__tip">{{ doneTip }}</p>
        <!-- 本批错字回顾：答错的字在成绩页再认一遍 -->
        <div v-if="batchWrong.length" class="hg-done__wrong">
          <span class="hg-done__wrong-label">本批错字：</span>
          <span v-for="ch in batchWrong" :key="ch" class="hg-done__wrong-char k">{{ ch }}</span>
        </div>
        <p v-else class="hg-done__perfect">本批全对，没有错字 🎉</p>
        <el-button type="primary" size="large" @click="load">再练一批</el-button>
        <el-button size="large" @click="openWrongBook">看错题本</el-button>
      </div>
    </div>

    <!-- 错题本：本地暂存的答错记录回顾（只做回顾，不出题，出题仍由服务端负责） -->
    <el-dialog v-model="wrongOpen" title="错题本" width="540" append-to-body>
      <p class="hg-wrong__tip">按最近答错排前，最多留 50 条。回顾读音与笔顺，再练一批会更稳。</p>
      <ul v-if="wrongList.length" class="hg-wrong__list">
        <li
          v-for="(w, i) in wrongList"
          :key="`${w.char}-${w.type}-${i}`"
          class="hg-wrong__item"
          :class="{ 'is-open': wrongKey(w) === wrongExpandedKey }"
        >
          <span class="hg-wrong__char k">{{ w.char }}</span>
          <span class="hg-wrong__meta">
            <b>{{ typeLabel(w.type) }}</b>
            <span>你的答案：{{ w.picked || "—" }}</span>
            <span>正确答案：{{ w.answer || "—" }}<template v-if="w.pinyin"> · 读音 {{ w.pinyin }}</template></span>
          </span>
          <span class="hg-wrong__time">{{ shortTime(w.time) }}</span>
          <button
            type="button"
            class="hg-wrong__toggle"
            :aria-label="`${wrongKey(w) === wrongExpandedKey ? '收起' : '展开'} ${w.char} 的笔顺演示`"
            @click="toggleWrong(w)"
          >
            {{ wrongKey(w) === wrongExpandedKey ? "▾" : "▸" }}
          </button>
          <button
            type="button"
            class="hg-wrong__del"
            :aria-label="`删除错题：${w.char}`"
            @click="removeWrong(w)"
          >
            ✕
          </button>
          <!-- 展开面板：内置笔顺命中时直接放逐笔动画，否则回落笔顺文字 -->
          <div v-if="wrongKey(w) === wrongExpandedKey" class="hg-wrong__panel">
            <HanziHoverWrite
              v-if="HANZI_STROKE_BUILTIN[w.char]"
              :key="`wrong-${w.char}`"
              inline
              visible
              :character="w.char"
            />
            <p v-else class="hg-wrong__strokes">
              <span v-if="w.strokeOrder" class="k">笔顺：{{ w.strokeOrder }}</span>
              <span v-else>这个字暂无笔顺演示，先看读音和释义吧。</span>
            </p>
          </div>
        </li>
      </ul>
      <div v-else class="hg-wrong__empty">错题本是空的，继续保持！</div>
      <template #footer>
        <el-button @click="wrongOpen = false">关闭</el-button>
        <el-button type="danger" plain :disabled="!wrongList.length" @click="clearWrong">清空错题本</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
/**
 * HanziGameView —— 汉字识字练习（学生端内嵌 / 趣味中心内嵌）。
 *
 * <p>题目由服务端自动生成（读音题、笔画题交替），题干带笔顺/部首/结构/释义/字画，
 * 答完直接当「学习卡」。这里只负责展示与判分，不自己造题。</p>
 *
 * <p>视觉形态：挂轴问答（05 卷轴方案）—— 宣纸底 + 主色边条，选项为半满胶囊；
 * 逻辑 / 接口 / 题型（识读 / 笔画数 / 笔顺排序）全部保持。</p>
 */
import { message } from "@repo/core";
import { computed, onMounted, ref, watch, type CSSProperties } from "vue";

import { eduaiApi } from "../api/eduaiApi";
import type { GradeLevelOption, HanziQuestion } from "../api/types";
import { errText } from "../api/errorText";
import { STUDY_PROGRESS_PER_ROUND, useStudyReport } from "../composables/useStudyReport";
import { addHanziWrong, clearHanziWrong, listHanziWrong, removeHanziWrong, type HanziWrongEntry } from "../data/hanziWrongBook";
import { HANZI_STROKE_BUILTIN } from "../data/hanziStrokes";
import { playCorrect, playFinish, playWrong, readSoundOff, writeSoundOff } from "../utils/quizSounds";
import HanziHoverWrite from "../components/HanziHoverWrite.vue";
import ReConfirmDialog from "../components/shared/ReConfirmDialog.vue";

/** 统一确认弹窗（ReDialog 实现，替代 ElMessageBox.confirm） */
const confirmDialog = ref<InstanceType<typeof ReConfirmDialog> | null>(null);

/**
 * 可选学段：父组件不传时按全库出题。
 *
 * 学生端首页的内嵌容器目前不传 props，所以这里是「有则用」而非必填。
 */
const props = defineProps<{ level?: string }>();

const questions = ref<HanziQuestion[]>([]);
const index = ref(0);
const score = ref(0);
const answered = ref(false);
const picked = ref("");
const finished = ref(false);
/** 学习行为上报：仅在学生端内嵌时真正发请求 */
const { report: reportStudyRound } = useStudyReport();
/** 笔顺题：已按顺序点下的笔画 */
const tapped = ref<string[]>([]);
/** 连击：当前连续答对数（答错清零，换批复位） */
const streak = ref(0);
/** 每题对错记录（下标对齐 questions）：驱动进度点条与本批错字回顾 */
const results = ref<boolean[]>([]);
/** 错题本中当前展开笔顺演示的条目键 */
const wrongExpandedKey = ref("");
/** 每批题量候选（默认 8，与既有出题口径一致） */
const BATCH_SIZES = [5, 8, 12] as const;
const batchSize = ref<number>(8);
/** 当前学段（空串 = 全部）；初始取父组件传入的 level */
const activeLevel = ref(props.level ?? "");
/** 学段下拉（服务端维度接口，只读） */
const gradeOptions = ref<GradeLevelOption[]>([]);
/** 答题音效静音偏好（本地留存） */
const soundOff = ref(readSoundOff());
/** 全对庆祝彩纸（内联样式数组） */
const confetti = ref<CSSProperties[]>([]);
/** 全对才撒花 */
const celebrate = computed(() => finished.value && questions.value.length > 0 && score.value === questions.value.length);

// ==================== 错题本（本地暂存） ====================
const wrongOpen = ref(false);
const wrongList = ref<HanziWrongEntry[]>([]);
const wrongCount = ref(0);

const current = computed<HanziQuestion | null>(() => questions.value[index.value] ?? null);

/** 字画图加载失败回落：换题即复位，失败时显示楷体字本身 */
const imageFailed = ref(false);
watch(current, () => {
  imageFailed.value = false;
});

/** 学习卡内嵌笔顺动画：仅内置笔顺数据命中时启用，否则回落静态笔顺文字 */
const learnStrokeChar = computed(() => {
  const ch = (current.value?.char || "").trim().charAt(0);
  return ch && HANZI_STROKE_BUILTIN[ch] ? ch : "";
});
const isLast = computed(() => index.value >= questions.value.length - 1);
/** 当前是否为笔顺（顺序）题 */
const isOrder = computed(() => current.value?.type === "order");
const askText = computed(() => {
  const t = current.value?.type;
  if (t === "strokes") {
    return "这个字一共有几笔？";
  }
  if (t === "order") {
    return "按书写顺序点出这个字的笔画";
  }
  return "这个字读什么？";
});

/** 选项文案：笔画数题补「笔」，其余原样（笔顺题直接显示笔画） */
function optionText(opt: string): string {
  return current.value?.type === "strokes" ? `${opt} 笔` : opt;
}

/** 判分后的选项样式（笔顺题不逐块染色：笔画可能重复，按值染色会误标） */
function optionClass(opt: string): string {
  if (!answered.value || isOrder.value) {
    return "";
  }
  if (opt === current.value?.answer) {
    return "is-correct";
  }
  return opt === picked.value ? "is-wrong" : "is-dim";
}

/** 本题是否答对（仅判分后有意义） */
const isCorrect = computed(() => answered.value && !!current.value && picked.value === current.value.answer);
/** 笔顺题总笔画数（答案为笔画名连串，长度即笔画数） */
const orderTotal = computed(() => current.value?.answer?.length ?? 0);
/** 浏览器是否支持 TTS（老浏览器/非 DOM 环境安全降级） */
const ttsSupported = typeof window !== "undefined" && "speechSynthesis" in window;
/** 听一听：不支持 TTS 或读音题未答前不显示（避免直接剧透答案） */
const canSpeak = computed(() => {
  const q = current.value;
  if (!q || !ttsSupported) {
    return false;
  }
  return q.type !== "pinyin" || answered.value;
});
/** 成绩星级：≥90% 三星、≥70% 两星、≥50% 一星，否则零星 */
const stars = computed(() => {
  const n = questions.value.length;
  if (!n) {
    return 0;
  }
  const p = score.value / n;
  if (p >= 0.9) return 3;
  if (p >= 0.7) return 2;
  if (p >= 0.5) return 1;
  return 0;
});
/** 本批答错的字（去重、按出题顺序），成绩页回顾用 */
const batchWrong = computed(() => {
  const out: string[] = [];
  questions.value.forEach((q, i) => {
    if (results.value[i] === false && !out.includes(q.char)) {
      out.push(q.char);
    }
  });
  return out;
});

/**
 * 判分。
 *
 * @param value 用户给出的答案（读音 / 笔画数 / 拼好的笔顺串）
 */
function judge(value: string) {
  const q = current.value;
  picked.value = value;
  answered.value = true;
  if (!q) {
    return;
  }
  const ok = value === q.answer;
  results.value[index.value] = ok;
  // 答题音效：静音偏好关闭时不响（合成失败在工具内静默忽略）
  if (!soundOff.value) {
    if (ok) {
      playCorrect();
    } else {
      playWrong();
    }
  }
  if (ok) {
    score.value += 1;
    streak.value += 1;
  } else {
    streak.value = 0;
    // 答错进错题本（本地暂存，仅供回顾；出题仍由服务端负责），带读音/笔顺快照便于展开回顾
    addHanziWrong({
      char: q.char,
      type: q.type,
      picked: value,
      answer: q.answer,
      time: new Date().toISOString(),
      pinyin: q.pinyin || undefined,
      strokeOrder: q.strokeOrder || undefined,
    });
    wrongCount.value = listHanziWrong().length;
  }
}

/**
 * 选择题作答。
 *
 * @param opt 选项
 */
function choose(opt: string) {
  if (answered.value) {
    return;
  }
  judge(opt);
}

/**
 * 笔顺题：点下一笔；点满全部笔画即判分。
 *
 * @param stroke 该笔的笔画名
 */
function tapStroke(stroke: string) {
  if (answered.value || !isOrder.value) {
    return;
  }
  tapped.value.push(stroke);
  const answer = current.value?.answer ?? "";
  if (tapped.value.length >= answer.length) {
    judge(tapped.value.join(""));
  }
}

/** 撤销上一笔（仅判分前可用；判分后按钮禁用） */
function undoStroke() {
  if (answered.value || !tapped.value.length) {
    return;
  }
  tapped.value.pop();
}

/** 重置本笔顺题已点的笔画（判分前可用） */
function resetStrokes(): void {
  if (answered.value) {
    return;
  }
  tapped.value = [];
}

/** 朗读当前字（浏览器 TTS，零依赖；不支持或失败时静默忽略） */
function speakCurrent(): void {
  const ch = current.value?.char;
  if (!ch || typeof window === "undefined" || !("speechSynthesis" in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(ch);
    u.lang = "zh-CN";
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  } catch {
    /* 朗读失败不影响答题 */
  }
}

/** 进度点条样式：对 / 错 / 当前题 */
function dotClass(i: number): string {
  const r = results.value[i];
  if (r === true) {
    return "is-right";
  }
  if (r === false) {
    return "is-wrong";
  }
  return i === index.value ? "is-current" : "";
}

/** 下一题；已是最后一题则进入成绩页 */
function next() {
  if (isLast.value) {
    finished.value = true;
    if (!soundOff.value) {
      playFinish();
    }
    // 一批答完即上报：每题 1 分，正确数即 score
    reportStudyRound({
      moduleCode: "hanzi-learn",
      questionCount: questions.value.length,
      correctCount: score.value,
      progressDelta: STUDY_PROGRESS_PER_ROUND,
    });
    return;
  }
  index.value += 1;
  answered.value = false;
  picked.value = "";
  tapped.value = [];
}

const doneTip = computed(() => {
  const n = questions.value.length;
  if (!n) {
    return "";
  }
  if (score.value === n) {
    return "全对！识字小达人 🎉";
  }
  return score.value >= n * 0.6 ? "不错，再练一批就更熟了。" : "别急，对照笔顺与释义再来一遍。";
});

// ==================== 错题本交互 ====================
function openWrongBook(): void {
  wrongList.value = listHanziWrong();
  wrongOpen.value = true;
}

/** 清空错题本：删除类操作，先确认再执行 */
async function clearWrong() {
  if (!wrongList.value.length) {
    return;
  }
  const ok = await confirmDialog.value?.open(`确认清空错题本里的 ${wrongList.value.length} 条记录吗？`, {
    title: "清空错题本",
    danger: true,
  });
  if (!ok) {
    return;
  }
  clearHanziWrong();
  wrongList.value = [];
  wrongCount.value = 0;
  message.success("错题本已清空");
}

/** 删除单条错题（char+type 为去重键，单条免确认；清空才需要确认） */
function removeWrong(w: HanziWrongEntry): void {
  removeHanziWrong(w.char, w.type);
  wrongList.value = listHanziWrong();
  wrongCount.value = wrongList.value.length;
}

/** 错题去重键（与存储侧 addHanziWrong / removeHanziWrong 一致） */
function wrongKey(w: HanziWrongEntry): string {
  return `${w.char}-${w.type}`;
}

/** 展开/收起错题的笔顺演示（同一时刻最多展开一条） */
function toggleWrong(w: HanziWrongEntry): void {
  const k = wrongKey(w);
  wrongExpandedKey.value = wrongExpandedKey.value === k ? "" : k;
}

function typeLabel(type: string): string {
  if (type === "pinyin") return "读音题";
  if (type === "strokes") return "笔画题";
  if (type === "order") return "笔顺题";
  return "练习题";
}

/** 时间显示：MM-DD HH:mm（解析失败返回空串） */
function shortTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// ==================== 音效 / 偏好 / 庆祝 ====================
/** 切换静音（偏好本地留存；重新开启时给一声轻响作反馈） */
function toggleSound(): void {
  soundOff.value = !soundOff.value;
  writeSoundOff(soundOff.value);
  if (!soundOff.value) {
    playCorrect();
  }
}

/** 切换学段：重新出题 */
function setLevel(v: string): void {
  if (activeLevel.value === v) {
    return;
  }
  activeLevel.value = v;
  void load();
}

/** 切换每批题量：重新出题 */
function setBatchSize(n: number): void {
  if (batchSize.value === n) {
    return;
  }
  batchSize.value = n;
  void load();
}

/** 生成全对彩纸：位置/延迟/时长/颜色随机，末态旋转用 --rot 交给 keyframes 消费 */
function makeConfetti(): void {
  const colors = ["#f7ba2a", "#67c23a", "#409eff", "#f56c6c", "#e6a23c", "#9a66d0"];
  const pieces: CSSProperties[] = [];
  for (let i = 0; i < 32; i += 1) {
    pieces.push({
      left: `${4 + Math.random() * 92}%`,
      width: `${6 + Math.random() * 5}px`,
      height: `${10 + Math.random() * 8}px`,
      background: colors[i % colors.length] ?? "#f7ba2a",
      animationDelay: `${Math.random() * 0.9}s`,
      animationDuration: `${1.5 + Math.random() * 1.2}s`,
      "--rot": `${Math.floor(Math.random() * 360)}deg`,
    });
  }
  confetti.value = pieces;
}
watch(celebrate, (on) => {
  if (on) {
    makeConfetti();
  } else {
    confetti.value = [];
  }
});

/** 拉一批题（服务端自动出题） */
async function load() {
  index.value = 0;
  score.value = 0;
  answered.value = false;
  picked.value = "";
  tapped.value = [];
  finished.value = false;
  streak.value = 0;
  results.value = [];
  try {
    questions.value = (await eduaiApi.hanziPractice({ count: batchSize.value, gradeLevel: activeLevel.value || undefined })) ?? [];
    if (!questions.value.length) {
      message.warning("汉字库暂时没有可出的题");
    }
  } catch (e) {
    questions.value = [];
    message.error(`出题失败：${errText(e) || "请稍后重试"}`);
  }
}

onMounted(() => {
  wrongCount.value = listHanziWrong().length;
  void load();
  // 学段下拉走服务端维度接口；拉取失败不阻塞出题，仅退化为「全部」单选项
  eduaiApi
    .dimensionDropdown()
    .then((d) => {
      gradeOptions.value = d?.gradeLevels ?? [];
    })
    .catch(() => {
      gradeOptions.value = [];
    });
});

// 父组件动态调整学段时跟随重出题（当前宿主不传 level，留作内嵌扩展口径）
watch(
  () => props.level,
  (lv) => {
    const target = lv ?? "";
    if (target !== activeLevel.value) {
      activeLevel.value = target;
      void load();
    }
  },
);
</script>

<style scoped>
/* ===== 挂轴问答（05 卷轴方案）=====
   视觉基准保持成语消消乐 / 各内嵌模块同系：
   地面满幅主色渐变、内容限宽、白卡 + 细边。
   本方案叠加「宣纸 + 卷杆」质感：
   - 纸面用 color-mix 把主色轻染进白底（浅色模式近似宣纸，深色模式自动收敛）
   - 字一律楷体 .k（Kaiti 家族）
   - 选项 = 半满胶囊（full 半径）
   深色模式所有 color-mix(primary) 均随皮肤变量走，无需另开分支。 */
.k {
  font-family: "Kaiti SC", "STKaiti", "KaiTi", "SimSun", serif;
}

.hg {
  min-height: 100%;
  padding: 4px 0 28px;
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
}
.hg-inner {
  max-width: 760px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 标题：白字压在主色带上（与基准 .ig-title 同一套） */
.hg-head {
  margin-bottom: 4px;
}
.hg-title {
  margin: 0;
  font-size: 40px;
  font-weight: 900;
  letter-spacing: 3px;
  color: var(--el-color-white);
  display: flex;
  align-items: center;
  gap: 10px;
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.hg-title__dot {
  width: 14px;
  height: 14px;
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-white);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
.hg-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-color-white);
  opacity: 0.86;
}
.hg-sub b {
  opacity: 1;
}

/* 练习偏好行：学段 + 题量分段选择（压在主色带上，白字白胶囊） */
.hg-prefs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 22px;
  margin: 0 2px 12px;
}
.hg-prefs__group {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.hg-prefs__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-white);
  opacity: 0.85;
}
.hg-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: color-mix(in srgb, var(--el-color-black) 18%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-white) 30%, transparent);
  border-radius: var(--el-radius-full, 9999px);
}
.hg-seg__item {
  padding: 4px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-white);
  background: transparent;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;
}
.hg-seg__item:hover {
  background: color-mix(in srgb, var(--el-color-white) 18%, transparent);
}
.hg-seg__item.is-on {
  color: var(--el-color-primary);
  background: var(--el-color-white);
  font-weight: 700;
}

/* 进度行：白卡 + 细边 */
.hg-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 0 12px;
  padding: 12px 18px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  border: 1px solid var(--el-border-color-lighter);
}
.hg-bar :deep(.el-button) {
  min-height: 36px;
  padding: 0 16px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
}
.hg-bar__step b,
.hg-bar__score b {
  color: var(--el-color-primary);
  font-size: 18px;
}
.hg-bar__step {
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.hg-bar__score {
  font-size: 14px;
  color: var(--el-text-color-regular);
  margin-right: auto;
}

/* 每题对错进度点条：压在主色带上，白点=当前、绿点=对、红点=错 */
.hg-dots {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin: 0 2px 12px;
}
.hg-dots__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--el-border-radius-circle, 50%);
  background: color-mix(in srgb, var(--el-color-white) 30%, transparent);
  border: 1px solid color-mix(in srgb, var(--el-color-white) 55%, transparent);
  transition: background 0.2s ease, transform 0.2s ease;
}
.hg-dots__dot.is-current {
  background: var(--el-color-white);
  transform: scale(1.3);
}
.hg-dots__dot.is-right {
  background: var(--el-color-success-light-5, #b3e19d);
  border-color: transparent;
}
.hg-dots__dot.is-wrong {
  background: var(--el-color-danger-light-5, #fab6b6);
  border-color: transparent;
}

/* 空态：白卡托底 */
.hg-empty {
  padding: 30px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}

/* 字画卡：宣纸白 + 主色轻染 + 上下卷杆 */
.hg-card {
  position: relative;
  padding: 22px 22px 20px;
  border-radius: var(--el-radius-xl, 16px);
  background: color-mix(in srgb, var(--el-bg-color) 96%, var(--el-color-primary-light-5));
  border: 1px solid var(--el-border-color-lighter);
  text-align: center;
}
/* 上卷杆（天杆）：主色条压在卡顶 */
.hg-card::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 18px;
  right: 18px;
  height: 5px;
  border-radius: 0 0 var(--el-radius-sm, 6px) var(--el-radius-sm, 6px);
  background: linear-gradient(90deg, color-mix(in srgb, var(--el-color-primary) 72%, #000) 0%, color-mix(in srgb, var(--el-color-primary) 45%, #000) 45%, color-mix(in srgb, var(--el-color-primary) 30%, #000) 100%);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--el-color-black) 18%, transparent);
}
.hg-card__art {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 132px;
}
.hg-card__char {
  font-size: 96px;
  font-weight: 900;
  line-height: 1;
  color: var(--el-text-color-primary);
}
.hg-card__img {
  max-width: 180px;
  max-height: 160px;
  border-radius: var(--el-radius-lg, 12px);
}
.hg-card__ask {
  margin-top: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-regular);
}

/* 听一听：右上角轻量胶囊（浏览器 TTS 朗读，读音题答前隐藏防剧透） */
.hg-card__speak {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 1;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 10%, var(--el-bg-color));
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 32%, transparent);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.hg-card__speak:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px color-mix(in srgb, var(--el-color-black) 14%, transparent);
}
.hg-card__speak:active {
  transform: translateY(0) scale(0.96);
}

/* 对/错印章：判分后盖在字画中央，带落章回弹动画 */
.hg-stamp {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 76px;
  height: 76px;
  display: grid;
  place-items: center;
  font-size: 42px;
  font-weight: 900;
  line-height: 1;
  border: 4px solid currentColor;
  border-radius: var(--el-radius-md, 8px);
  transform: translate(-50%, -50%) rotate(-8deg);
  animation: hg-stamp-in 0.35s cubic-bezier(0.2, 1.4, 0.4, 1) both;
  box-shadow: 0 6px 16px color-mix(in srgb, var(--el-color-black) 20%, transparent);
  pointer-events: none;
}
.hg-stamp.is-ok {
  color: var(--el-color-success);
  background: color-mix(in srgb, var(--el-color-success) 78%, transparent);
}
.hg-stamp.is-no {
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 78%, transparent);
}
@keyframes hg-stamp-in {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(-8deg) scale(1.8);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(-8deg) scale(0.92);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(-8deg) scale(1);
  }
}

/* 选项：半满胶囊 */
.hg-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.hg-opt {
  padding: 13px 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.hg-opt:hover:not(:disabled) {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.hg-opt:disabled {
  cursor: default;
}
.hg-opt.is-correct {
  background: var(--el-color-success);
  border-color: var(--el-color-success);
  color: var(--el-color-white);
}
.hg-opt.is-wrong {
  background: var(--el-color-danger);
  border-color: var(--el-color-danger);
  color: var(--el-color-white);
}
.hg-opt.is-dim {
  opacity: 0.55;
}

/* 笔顺题：笔画块更大更可点 */
.hg-options--strokes {
  grid-template-columns: repeat(auto-fit, minmax(72px, 1fr));
}
.hg-options--strokes .hg-opt {
  font-size: 26px;
  padding: 10px 0;
  border-radius: var(--el-radius-lg, 12px);
}
/* 笔顺回显：白卡 + 左侧主色条（flex 布局：计数与操作按钮自动靠右） */
.hg-tapped {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 10px;
  margin-top: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid var(--el-color-primary);
  border-radius: var(--el-radius-lg, 12px);
}
/* 已点进度：x/y 笔 */
.hg-tapped__count {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
  font-variant-numeric: tabular-nums;
}
.hg-tapped__acts {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.hg-tapped__acts .hg-tapped__undo {
  margin-left: 0;
}
.hg-tapped b {
  font-size: 20px;
  letter-spacing: 4px;
  color: var(--el-color-primary);
}
.hg-tapped__hint {
  margin-left: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
/* 撤销上一笔：轻量胶囊按钮，判分后禁用 */
.hg-tapped__undo {
  margin-left: auto;
  padding: 4px 12px;
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hg-tapped__undo:hover:not(:disabled) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.hg-tapped__undo:disabled {
  opacity: 0.45;
  cursor: default;
}
/* 判分回显：白卡 + 左侧色条跟随文字颜色 */
.hg-feedback {
  margin: 12px 0 0;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-danger);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid currentColor;
  border-radius: var(--el-radius-lg, 12px);
}
.hg-feedback.is-ok {
  color: var(--el-color-success);
}

/* 连击鼓励徽标：答对 2 题起出现，弹跳入场 */
.hg-streak {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-color-warning);
  animation: hg-streak-pop 0.3s ease both;
}
@keyframes hg-streak-pop {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 学习卡 */
.hg-learn {
  margin-top: 18px;
  padding: 20px 22px;
  border-radius: var(--el-radius-xl, 16px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
}
.hg-learn__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 2px solid var(--el-color-primary);
  display: inline-block;
}
.hg-learn__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 18px;
  margin: 0;
}
.hg-learn__grid > div {
  min-width: 0;
}
.hg-learn__grid dt {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.hg-learn__grid dd {
  margin: 2px 0 0;
  font-size: 14px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}
.hg-learn__full {
  grid-column: 1 / -1;
}
.hg-learn__strokes {
  font-size: 20px !important;
  letter-spacing: 4px;
}
.hg-learn .el-button {
  margin-top: 14px;
  border-radius: var(--el-radius-lg, 12px);
  min-width: 120px;
  font-weight: 600;
}

/* 成绩页：白卡托分（全对庆祝时作为彩纸画布） */
.hg-done {
  position: relative;
  text-align: center;
  margin-top: 14px;
  padding: 40px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}
.hg-done.is-celebrate {
  overflow: hidden;
}
/* 全对庆祝彩纸：随机位置/延迟洒落，不响应点击 */
.hg-confetti {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.hg-confetti__piece {
  position: absolute;
  top: -14px;
  border-radius: 2px;
  opacity: 0;
  animation: hg-confetti-fall linear both;
}
@keyframes hg-confetti-fall {
  0% {
    transform: translateY(-14px) rotate(0deg);
    opacity: 0;
  }
  8% {
    opacity: 0.95;
  }
  90% {
    opacity: 0.9;
  }
  100% {
    transform: translateY(400px) rotate(var(--rot, 320deg));
    opacity: 0;
  }
}
.hg-done__score {
  font-size: 52px;
  font-weight: 900;
  color: var(--el-color-primary);
  line-height: 1.1;
}
.hg-done__tip {
  margin: 10px 0 22px;
  font-size: 15px;
  color: var(--el-text-color-regular);
}

/* 成绩星级：按正确率摘星，逐颗弹入 */
.hg-done__stars {
  font-size: 40px;
  line-height: 1;
  letter-spacing: 6px;
  margin-bottom: 12px;
}
.hg-done__star {
  display: inline-block;
  color: var(--el-border-color);
  animation: hg-star-in 0.4s ease both;
}
.hg-done__star:nth-child(2) {
  animation-delay: 0.12s;
}
.hg-done__star:nth-child(3) {
  animation-delay: 0.24s;
}
.hg-done__star.is-on {
  color: var(--el-color-warning, #f7ba2a);
  text-shadow: 0 2px 0 color-mix(in srgb, var(--el-color-warning, #f7ba2a) 35%, transparent);
}
@keyframes hg-star-in {
  0% {
    transform: scale(0.3) rotate(-20deg);
    opacity: 0;
  }
  70% {
    transform: scale(1.15) rotate(4deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* 本批错字回顾：答错的字在成绩页再认一遍 */
.hg-done__wrong {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: 460px;
  margin: 0 auto 20px;
}
.hg-done__wrong-label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.hg-done__wrong-char {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  font-size: 24px;
  font-weight: 800;
  color: var(--el-color-danger);
  background: color-mix(in srgb, var(--el-color-danger) 8%, var(--el-bg-color));
  border: 1px dashed color-mix(in srgb, var(--el-color-danger) 45%, transparent);
  border-radius: var(--el-radius-md, 8px);
}
.hg-done__perfect {
  margin: 0 0 20px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-success);
}

/* 错题本 */
.hg-wrong__tip {
  margin: 0 0 12px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.hg-wrong__list {
  margin: 0;
  padding: 0;
  list-style: none;
  max-height: 50vh;
  overflow: auto;
}
.hg-wrong__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 4px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.hg-wrong__item:last-child {
  border-bottom: none;
}
.hg-wrong__char {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  font-size: 26px;
  font-weight: 800;
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-fill-color-light);
  flex-shrink: 0;
}
.hg-wrong__meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: var(--el-text-color-regular);
}
.hg-wrong__meta b {
  color: var(--el-color-danger);
  font-size: 12px;
}
.hg-wrong__time {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
/* 单条删除：圆形小按钮，悬停转危险色 */
.hg-wrong__del {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  font-size: 13px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-circle, 50%);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hg-wrong__del:hover {
  color: var(--el-color-danger);
  border-color: var(--el-color-danger);
}
/* 展开笔顺演示：圆形小按钮，展开后条目换底色并换行放下演示面板 */
.hg-wrong__toggle {
  width: 26px;
  height: 26px;
  display: grid;
  place-items: center;
  font-size: 12px;
  line-height: 1;
  color: var(--el-text-color-secondary);
  background: transparent;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-border-radius-circle, 50%);
  cursor: pointer;
  flex-shrink: 0;
  transition: color 0.15s ease, border-color 0.15s ease;
}
.hg-wrong__toggle:hover {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.hg-wrong__item.is-open {
  flex-wrap: wrap;
  padding: 10px 8px;
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-md, 8px);
}
.hg-wrong__panel {
  width: 100%;
  padding: 10px 4px 2px;
  border-top: 1px dashed var(--el-border-color-lighter);
}
.hg-wrong__strokes {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-regular);
}
.hg-wrong__empty {
  padding: 24px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* 深色模式细查：暗色卡上卷杆改用亮主色渐变保持可辨；分段控件底色略加深以显层次 */
html.dark .hg-card::before {
  background: linear-gradient(90deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 45%, var(--el-color-primary-dark-2) 100%);
}
html.dark .hg-seg {
  background: color-mix(in srgb, var(--el-color-black) 35%, transparent);
}
html.dark .hg-stamp {
  box-shadow: 0 6px 18px color-mix(in srgb, var(--el-color-black) 45%, transparent);
}

/* 窄屏 */
@media (max-width: 640px) {
  .hg-title {
    font-size: 28px;
    letter-spacing: 2px;
  }
  .hg-inner {
    padding: 0 14px;
  }
  .hg-bar {
    padding: 12px 14px;
    flex-wrap: wrap;
  }
  .hg-bar__score {
    margin-right: auto;
  }
  .hg-card__char {
    font-size: 76px;
  }
  .hg-learn {
    padding: 18px 16px;
  }
  .hg-done {
    padding: 32px 16px;
  }
  .hg-options,
  .hg-learn__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .hg-tapped__hint {
    display: block;
    margin: 6px 0 0;
  }
}

/* 触摸设备：可点控件抬到 44px */
@media (pointer: coarse) {
  .hg-bar :deep(.el-button),
  .hg-opt,
  .hg-tapped__undo,
  .hg-learn :deep(.el-button),
  .hg-done :deep(.el-button) {
    min-height: 44px;
  }
  .hg-wrong__del,
  .hg-wrong__toggle {
    width: 34px;
    height: 34px;
  }
  .hg-card__speak {
    padding: 9px 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hg-opt {
    transition: none;
  }
  .hg-stamp,
  .hg-streak,
  .hg-done__star {
    animation: none;
  }
  .hg-dots__dot {
    transition: none;
  }
  /* 彩纸动画对前庭敏感用户不友好，reduced-motion 下直接不展示 */
  .hg-confetti {
    display: none;
  }
}
</style>