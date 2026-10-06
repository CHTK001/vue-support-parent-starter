<template>
  <div class="hg">
    <div class="hg-inner">
      <header class="hg-head">
        <h1 class="hg-title">
          汉字识字
          <span class="hg-title__dot" />
        </h1>
        <p class="hg-sub">看<b>字画</b>、读<b>读音</b>、数<b>笔画</b> —— 每题答完都会展示<b>笔顺</b>与释义。</p>
      </header>

      <template v-if="!finished">
        <div class="hg-bar">
          <span class="hg-bar__step">第 <b>{{ questions.length ? index + 1 : 0 }}</b> / {{ questions.length }} 题</span>
          <span class="hg-bar__score">答对 <b>{{ score }}</b></span>
          <el-button size="small" @click="load">换一批</el-button>
        </div>

        <div v-if="!current" class="hg-empty">
          <el-empty description="正在出题…" />
        </div>

        <template v-else>
          <!-- 字画：有图片用图片，否则把字本身当字形图展示 -->
          <div class="hg-card">
            <div class="hg-card__art">
              <img v-if="current.image" :src="current.image" :alt="current.char" class="hg-card__img" />
              <span v-else class="hg-card__char">{{ current.char }}</span>
            </div>
            <div class="hg-card__ask">{{ askText }}</div>
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
            <span class="hg-tapped__hint">（按第 1 笔、第 2 笔…的顺序点）</span>
          </div>

          <p v-if="answered" class="hg-feedback" :class="{ 'is-ok': picked === current.answer }">
            {{ picked === current.answer ? "答对了！" : "正确答案：" + current.answer }}
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
                <dd class="hg-learn__strokes">{{ current.strokeOrder || "—" }}</dd>
              </div>
              <div class="hg-learn__full"><dt>释义 / 组词</dt><dd>{{ current.meaning || "—" }}</dd></div>
            </dl>
            <el-button type="primary" @click="next">{{ isLast ? "看成绩" : "下一题" }}</el-button>
          </div>
        </template>
      </template>

      <div v-else class="hg-done">
        <div class="hg-done__score">{{ score }} / {{ questions.length }}</div>
        <p class="hg-done__tip">{{ doneTip }}</p>
        <el-button type="primary" size="large" @click="load">再练一批</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * HanziGameView —— 汉字识字练习（学生端内嵌 / 趣味中心内嵌）。
 *
 * <p>题目由服务端自动生成（读音题、笔画题交替），题干带笔顺/部首/结构/释义/字画，
 * 答完直接当「学习卡」。这里只负责展示与判分，不自己造题。</p>
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../api/eduaiApi";
import type { HanziQuestion } from "../api/types";

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
/** 笔顺题：已按顺序点下的笔画 */
const tapped = ref<string[]>([]);

const current = computed<HanziQuestion | null>(() => questions.value[index.value] ?? null);
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

/**
 * 判分。
 *
 * @param value 用户给出的答案（读音 / 笔画数 / 拼好的笔顺串）
 */
function judge(value: string) {
  picked.value = value;
  answered.value = true;
  if (value === current.value?.answer) {
    score.value += 1;
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

/** 下一题；已是最后一题则进入成绩页 */
function next() {
  if (isLast.value) {
    finished.value = true;
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

/** 拉一批题（服务端自动出题） */
async function load() {
  index.value = 0;
  score.value = 0;
  answered.value = false;
  picked.value = "";
  tapped.value = [];
  finished.value = false;
  try {
    questions.value = (await eduaiApi.hanziPractice({ count: 8, gradeLevel: props.level })) ?? [];
    if (!questions.value.length) {
      ElMessage.warning("汉字库暂时没有可出的题");
    }
  } catch (e) {
    questions.value = [];
    ElMessage.error(`出题失败：${e instanceof Error ? e.message : String(e)}`);
  }
}

onMounted(() => {
  void load();
});
</script>

<style scoped>
/*
 * 视觉基准：成语消消乐（IdiomGameView.vue 的 .ig-page / .ig-title / .ig-card）。
 *
 * 本视图原先是「720px 窄栏 + 落宿主灰底 + 22px 黑标题」，实测计算样式
 * （bg-image=none、标题 22px、卡片是灰块无边框），与其余内嵌模块差了一个色系
 * —— 学生看到的是「后台表单」而不是「游戏」。这里整体对齐：
 *   地面  linear-gradient(160deg, primary, primary-dark-2)，满幅不收窄
 *   标题  白字 / 40px / 900 / letter-spacing 3px + 白圆点
 *   卡片  --el-bg-color 底 + 1px --el-border-color-lighter 边 + 不加投影
 *
 * 地面要满幅、内容要限宽，所以多一层 .hg-inner：渐变归 .hg，宽度约束归 .hg-inner。
 */
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

/* 标题：与基准 .ig-title 同一套（白字压在主色带上，靠描边阴影保证可读性） */
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
  gap: 8px;
  text-shadow: 0 3px 0 color-mix(in srgb, var(--el-color-black) 12%, transparent);
}
.hg-title__dot {
  width: 14px;
  height: 14px;
  /* 纯圆点用圆形令牌，不占 --el-radius-* 六档（那六档是圆角矩形语义） */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-white);
  /* 装饰性光环（0 偏移 0 模糊），不是卡片投影：只描一圈主色，压在主色底上略深 */
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-primary) 35%, transparent);
}
/* 副标题压在主色带上：白字降一档透明度，深色模式下主色更深、白字仍可读 */
.hg-sub {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--el-color-white);
  opacity: 0.86;
}
.hg-sub b {
  opacity: 1;
}

/* 进度行：升格成白卡（原为透明，压在渐变上按钮会糊） */
.hg-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: 14px 0 12px;
  padding: 12px 18px;
  background: var(--el-bg-color);
  border-radius: var(--el-radius-xl, 16px);
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
}
/* 基准的胶囊控件高 36px；el-button--small 默认 24px（刚好卡 AA 底线），这里抬到同一手感 */
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

/* 空态：el-empty 自带浅灰插图与灰字，直接压主色底会看不清，整块给白卡 */
.hg-empty {
  padding: 30px 20px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
}

/* 字画：白卡 + 边框（原为 --el-fill-color-lighter 灰块）；
   内边距用基准的 20px 22px，与 .ig-card / .pc-card / .pg-card 同一档 */
.hg-card {
  padding: 20px 22px;
  border-radius: var(--el-radius-xl, 16px);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  text-align: center;
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

/* 选项 */
.hg-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}
.hg-opt {
  padding: 14px 16px;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-lg, 12px);
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
  background: var(--el-color-success-light-9);
  border-color: var(--el-color-success);
  color: var(--el-color-success);
}
.hg-opt.is-wrong {
  background: var(--el-color-danger-light-9);
  border-color: var(--el-color-danger);
  color: var(--el-color-danger);
}
.hg-opt.is-dim {
  opacity: 0.55;
}

/* 笔顺题：笔画块更像「可点的笔画」，一行放得下更多 */
.hg-options--strokes {
  grid-template-columns: repeat(auto-fit, minmax(64px, 1fr));
}
.hg-options--strokes .hg-opt {
  font-size: 26px;
  padding: 10px 0;
}
/* 笔顺回显：白卡 + 左侧主色条（原本是裸文字，压在主色底上会看不清） */
.hg-tapped {
  margin-top: 12px;
  padding: 12px 16px;
  font-size: 14px;
  color: var(--el-text-color-regular);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-left: 4px solid var(--el-color-primary);
  border-radius: var(--el-radius-lg, 12px);
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
/* 判分回显：白卡 + 左侧色条，色条取文字自身颜色（对错两态自动跟随） */
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

/* 成绩页：整块一张白卡。
   分数原本是 --el-color-primary（主色蓝）直接压在页面上，地面翻成主色渐变后
   会与底色糊成一片，所以这里必须先有白底托住。 */
.hg-done {
  text-align: center;
  margin-top: 14px;
  padding: 40px 24px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-xl, 16px);
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

/*
 * 窄屏（≤640px）：标题收到 28px（40px 在 390px 宽下会顶到边），
 * 选项与学习卡两列改一列（沿用原有断点，只补标题与内边距）。
 */
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

/*
 * 触摸设备：可点控件抬到 44px。
 * WCAG 2.2 的 2.5.8（AA）底线是 24×24，上面已满足；这里做 2.5.5（AAA）的加分档，
 * 与基准 .ig-chip 的 36px 桌面档区分开。
 */
@media (pointer: coarse) {
  .hg-bar :deep(.el-button),
  .hg-opt,
  .hg-learn :deep(.el-button),
  .hg-done :deep(.el-button) {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hg-opt {
    transition: none;
  }
}
</style>
