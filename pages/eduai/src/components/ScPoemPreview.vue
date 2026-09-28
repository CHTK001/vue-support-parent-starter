<template>
  <div class="sc-poem-preview">
    <div v-if="!plainLines.length" class="sc-poem-preview__empty">
      <div class="sc-poem-preview__empty-icon">诗</div>
      <p class="sc-poem-preview__empty-text">左侧填写正文后，这里实时预览排版效果</p>
    </div>

    <template v-else>
      <!-- 题目与作者 -->
      <header class="sc-poem-preview__head">
        <h3 class="sc-poem-preview__title">{{ title || "（未填标题）" }}</h3>
        <div class="sc-poem-preview__meta">
          <span v-if="dynasty" class="sc-poem-preview__dynasty">{{ dynasty }}</span>
          <span class="sc-poem-preview__author">{{ author || "佚名" }}</span>
          <span v-if="difficultyText" class="sc-poem-preview__level">{{ difficultyText }}</span>
        </div>
      </header>

      <!-- 正文：一句一行；逐句对照模式下每句下方紧跟其译文 -->
      <div class="sc-poem-preview__body">
        <div v-for="(line, i) in plainLines" :key="i" class="sc-poem-preview__unit">
          <p class="sc-poem-preview__line">{{ line }}</p>
          <p
            v-if="inlineMode && alignedTranslations[i]"
            class="sc-poem-preview__line-trans"
          >
            {{ alignedTranslations[i] }}
          </p>
        </div>
      </div>

      <!-- 译文（单独成块模式） -->
      <section v-if="!inlineMode && translationLines.length" class="sc-poem-preview__section">
        <div class="sc-poem-preview__section-title">译文</div>
        <p v-for="(line, i) in translationLines" :key="i" class="sc-poem-preview__trans">{{ line }}</p>
      </section>

      <!-- 赏析 -->
      <section v-if="appreciationLines.length" class="sc-poem-preview__section">
        <div class="sc-poem-preview__section-title">赏析</div>
        <p v-for="(line, i) in appreciationLines" :key="i" class="sc-poem-preview__app">{{
          line
        }}</p>
      </section>

      <!-- 标签与学段 -->
      <footer v-if="tagList.length || levelList.length" class="sc-poem-preview__foot">
        <span v-for="t in tagList" :key="t" class="sc-poem-preview__tag">{{ t }}</span>
        <span v-for="lv in levelList" :key="lv" class="sc-poem-preview__grade">{{ lv }}</span>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * ScPoemPreview —— 古诗正文/译文的美化预览
 *
 * 用途：古诗库「编辑/查看」弹窗右侧的实时预览，替代纯 textarea 的观感。
 *
 * 关键点：正文在不同来源下有两种形态，本组件统一归一化后再分行，避免把
 *   JSON 的方括号与引号当诗句显示出来：
 *     1) 采集器入库的 JSON 数组字符串：["床前明月光，疑是地上霜。", "举头望明月，…"]
 *     2) initdata / 手工录入的按行纯文本：床前明月光，疑是地上霜。\n举头望明月，…
 *
 * 分行规则：按句末标点（。！？）切分，每句连同其标点占一行 —— 与律诗「一联一行」
 * 的排版习惯一致（如《静夜思》排成两行）。
 *
 * 用法：
 *   <ScPoemPreview :title="form.poemTitle" :content="form.poemContent" :translation="form.poemTranslation" />
 */
import { computed } from "vue";
import { parseTags, splitParagraphs, splitSentences } from "../utils/poemText";

defineOptions({ name: "ScPoemPreview", inheritAttrs: true });

const props = withDefaults(
  defineProps<{
    /** 标题 */
    title?: string;
    /** 作者 */
    author?: string;
    /** 朝代 */
    dynasty?: string;
    /** 正文（JSON 数组字符串或按行纯文本） */
    content?: string;
    /** 译文 */
    translation?: string;
    /** 赏析 */
    appreciation?: string;
    /** 难度 1/2/3 */
    difficulty?: number;
    /** 标签（逗号分隔字符串或数组） */
    tags?: string | string[];
    /** 适用学段 */
    gradeLevels?: string[];
    /**
     * 译文显示模式：
     *   inline —— 逐句对照，译文作为每条正文下方的副标题
     *   block  —— 正文之后单独成块
     */
    translationMode?: "inline" | "block";
  }>(),
  {
    title: "",
    author: "",
    dynasty: "",
    content: "",
    translation: "",
    appreciation: "",
    difficulty: undefined,
    tags: "",
    gradeLevels: () => [],
    translationMode: "inline",
  },
);

/** 句末标点：正文按此切句 */
const plainLines = computed(() => splitSentences(props.content));
const translationLines = computed(() => splitParagraphs(props.translation));
const appreciationLines = computed(() => splitParagraphs(props.appreciation));

/** 是否为逐句对照模式 */
const inlineMode = computed(() => props.translationMode !== "block");

/**
 * 逐句对照模式下的译文对齐。
 *
 * <p>译文与正文未必句句对齐（译文可能是一整段、也可能多句），这里按「同规则切句后
 * 数量一致则一一对应，否则按比例分组」的策略，保证每句正文下方都有对应译文，
 * 不出现某句空着、某句堆两段的情况。</p>
 *
 * @returns 与 plainLines 等长的译文数组，无译文时为空数组
 */
const alignedTranslations = computed<string[]>(() => {
  const lines = plainLines.value;
  const trans = splitSentences(props.translation);
  if (!inlineMode.value || !lines.length || !trans.length) {
    return [];
  }
  // 数量一致：直接一一对应
  if (trans.length === lines.length) {
    return trans;
  }
  // 否则按比例分组：第 i 句正文取译文里落在 [i*ratio, (i+1)*ratio) 区间的部分
  const result: string[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const start = Math.floor((i * trans.length) / lines.length);
    const end = Math.max(Math.floor(((i + 1) * trans.length) / lines.length), start + 1);
    result.push(trans.slice(start, end).join(""));
  }
  return result;
});

const tagList = computed(() => {
  const raw = props.tags;
  return Array.isArray(raw) ? raw.filter(Boolean) : parseTags(raw);
});

const levelList = computed(() => (props.gradeLevels ?? []).filter(Boolean));

const difficultyText = computed(() => {
  const map: Record<number, string> = { 1: "简单", 2: "中等", 3: "较难" };
  return props.difficulty ? map[props.difficulty] ?? "" : "";
});
</script>

<style scoped>
.sc-poem-preview {
  height: 100%;
  min-height: 320px;
  padding: 22px 26px;
  border-radius: var(--el-radius-lg, 12px);
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  overflow-y: auto;
}

/* ---------- 空态 ---------- */
.sc-poem-preview__empty {
  height: 100%;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.sc-poem-preview__empty-icon {
  width: 54px;
  height: 54px;
  /* 空态圆形徽标用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sc-poem-preview__empty-text {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ---------- 题头 ---------- */
.sc-poem-preview__head {
  padding-bottom: 14px;
  margin-bottom: 18px;
  border-bottom: 1px dashed var(--el-border-color-lighter);
  text-align: center;
}
.sc-poem-preview__title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.sc-poem-preview__meta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.sc-poem-preview__dynasty::after {
  content: "·";
  margin-left: 8px;
}
.sc-poem-preview__level {
  padding: 1px 8px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

/* ---------- 正文 ---------- */
.sc-poem-preview__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 18px;
}
/* 逐句对照：正文一句 + 其译文副标题为一组 */
.sc-poem-preview__unit {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sc-poem-preview__line {
  margin: 0;
  text-align: center;
  font-size: 17px;
  line-height: 1.9;
  letter-spacing: 1px;
  color: var(--el-text-color-primary);
}
/* 译文副标题：与正文同格式（居中、同字号基线），弱化为次要色 */
.sc-poem-preview__line-trans {
  margin: 0;
  text-align: center;
  font-size: 13px;
  line-height: 1.7;
  letter-spacing: 0.5px;
  color: var(--el-text-color-secondary);
}

/* ---------- 译文 / 赏析 ---------- */
.sc-poem-preview__section + .sc-poem-preview__section {
  margin-top: 16px;
}
.sc-poem-preview__section-title {
  display: inline-block;
  margin-bottom: 8px;
  padding: 2px 10px;
  border-radius: var(--el-radius-sm, 6px);
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.sc-poem-preview__trans,
.sc-poem-preview__app {
  margin: 0 0 4px;
  font-size: 14px;
  line-height: 1.9;
  color: var(--el-text-color-regular);
}
.sc-poem-preview__app {
  color: var(--el-text-color-secondary);
}

/* ---------- 标签 ---------- */
.sc-poem-preview__foot {
  margin-top: 18px;
  padding-top: 14px;
  border-top: 1px dashed var(--el-border-color-lighter);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.sc-poem-preview__tag {
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
}
.sc-poem-preview__grade {
  padding: 2px 10px;
  border-radius: var(--el-radius-full, 9999px);
  font-size: 12px;
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============
   本组件是纯静态预览，<style> 内无 transition / animation；
   保留此块作为口径锚点：以后新增动效时必须一并登记进下面的选择器。 */
@media (prefers-reduced-motion: reduce) {
  .sc-poem-preview,
  .sc-poem-preview__unit {
    transition: none;
  }
}
</style>
