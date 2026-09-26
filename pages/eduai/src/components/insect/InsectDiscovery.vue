<template>
  <div class="idc" @click.self="emit('close')">
    <section class="idc__panel">
      <button type="button" class="idc__close" title="关闭" @click="emit('close')">✕</button>

      <header class="idc__head">
        <h2 class="idc__title">{{ kindTitle }}</h2>
        <p class="idc__sub">{{ insect?.insectName }} · {{ stepCounter }}</p>
      </header>

      <!-- 进度条 -->
      <div v-if="total > 1" class="idc__progress">
        <span
          v-for="n in total"
          :key="n"
          class="idc__pip"
          :class="{ 'is-done': n - 1 < index, 'is-now': n - 1 === index }"
        />
      </div>

      <!-- ① 分步讲解 -->
      <template v-if="kind === 'lesson'">
        <div v-if="step" class="idc__body">
          <h3 class="idc__step-title">{{ step.title }}</h3>
          <p class="idc__step-body">{{ step.body }}</p>
        </div>
        <div v-else-if="!total" class="idc__body idc__body--empty">这个物种还没有分步讲解</div>
      </template>

      <!-- ② 小测验 -->
      <template v-else-if="kind === 'quiz'">
        <div v-if="question" class="idc__body">
          <h3 class="idc__step-title">{{ question.question }}</h3>
          <div class="idc__options">
            <button
              v-for="(opt, i) in question.options"
              :key="i"
              type="button"
              class="idc__option"
              :class="optionClass(i)"
              :disabled="picked !== null"
              @click="pick(i)"
            >
              <span class="idc__option-mark">{{ "ABCD"[i] }}</span>
              <span class="idc__option-text">{{ opt }}</span>
            </button>
          </div>
          <p v-if="picked !== null" class="idc__explain" :class="picked === question.answer ? 'is-right' : 'is-wrong'">
            {{ picked === question.answer ? "答对了。" : "再想想。" }}{{ question.explain }}
          </p>
        </div>
        <div v-else-if="!total" class="idc__body idc__body--empty">这个物种还没有测验题</div>
      </template>

      <!-- ③ 生活史 -->
      <template v-else-if="kind === 'lifecycle'">
        <div class="idc__body">
          <h3 class="idc__step-title">{{ insect?.insectName }} 的一生</h3>
          <div class="idc__stages">
            <button
              v-for="s in lifeStages"
              :key="s.key"
              type="button"
              class="idc__stage"
              :class="{ 'is-active': s.key === currentStage, 'is-off': !s.built }"
              :disabled="!s.built"
              @click="emit('stage', s.key)"
            >
              <span class="idc__stage-name">{{ s.label }}</span>
              <span class="idc__stage-hint">{{ s.built ? "点击在展台查看" : "暂无模型" }}</span>
            </button>
          </div>
          <p class="idc__text">{{ lifeStory }}</p>
        </div>
      </template>

      <footer class="idc__foot">
        <button
          v-if="kind !== 'lifecycle'"
          type="button"
          class="idc__btn idc__btn--ghost"
          :disabled="index === 0"
          @click="prev"
        >
          上一步
        </button>
        <button type="button" class="idc__btn idc__btn--ghost" @click="emit('close')">收起</button>
        <button
          v-if="kind === 'lesson' && guide?.quiz?.length"
          type="button"
          class="idc__btn idc__btn--outline"
          @click="emit('switch', 'quiz')"
        >
          去做小测
        </button>
        <button
          v-if="index < total - 1"
          type="button"
          class="idc__btn idc__btn--primary"
          @click="next"
        >
          下一步
        </button>
        <button v-else type="button" class="idc__btn idc__btn--primary" @click="emit('close')">完成</button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
/**
 * InsectDiscovery —— 讲解 / 小测验 / 生活史 浮层
 *
 * 对应上游 Discovery 组件。核心是「读到哪里、镜头对到哪里」：
 * 分步讲解每一步可带 anchor，切换步骤时把该 anchor 抛给父级，
 * 由展台把镜头移到对应部位（复用上游 three/framing 的 focusDistance）。
 *
 * 换物种必须复位步骤与作答：讲解 4 步、测验 2 题，带着旧下标冲进去会越界。
 */
import { computed, ref, watch } from "vue";
import { hasStage, HOLOMETABOLOUS, HEMIMETABOLOUS, type LifeStage } from "../../insect/three/stages";
import { modelSlugOf } from "./modelSlug";
import type { InsectDetail, InsectGuideView, InsectLessonStep, InsectQuizItem } from "../../api/types";

export type DiscoveryKind = "lesson" | "quiz" | "lifecycle";

const props = defineProps<{
  kind: DiscoveryKind;
  insect: InsectDetail | null;
  guide: InsectGuideView | null;
  currentStage: LifeStage | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "focus", anchor: string | null): void;
  (e: "stage", stage: LifeStage): void;
  (e: "switch", kind: DiscoveryKind): void;
}>();

const index = ref(0);
/** 测验当前选中的选项下标；null = 未作答 */
const picked = ref<number | null>(null);

const KIND_TITLE: Record<DiscoveryKind, string> = {
  lesson: "分步讲解",
  quiz: "小测验",
  lifecycle: "生活史",
};
const kindTitle = computed(() => KIND_TITLE[props.kind]);

const lessonSteps = computed<InsectLessonStep[]>(() => props.guide?.lesson ?? []);
const quizItems = computed<InsectQuizItem[]>(() => props.guide?.quiz ?? []);
const total = computed(() => (props.kind === "quiz" ? quizItems.value.length : lessonSteps.value.length));
const stepCounter = computed(() => (total.value ? `${index.value + 1} / ${total.value}` : "无内容"));

/** 分步讲解的当前步（只在 lesson 模式下有值） */
const step = computed<InsectLessonStep | null>(() =>
  props.kind === "lesson" ? (lessonSteps.value[index.value] ?? null) : null,
);
/** 测验的当前题（只在 quiz 模式下有值） */
const question = computed<InsectQuizItem | null>(() =>
  props.kind === "quiz" ? (quizItems.value[index.value] ?? null) : null,
);

/** 该物种走哪条生活史路线 */
const lifeStages = computed(() => {
  const meta = props.insect?.insectMetamorphosis;
  const route = meta === "incomplete" ? HEMIMETABOLOUS : HOLOMETABOLOUS;
  const label: Record<string, string> = { egg: "卵", larva: "幼虫", pupa: "蛹", nymph: "若虫", adult: "成虫" };
  // 阶段模型按建模 slug 注册：物种可借用别的物种模型，这里必须查被借用的 slug
  const code = props.insect ? modelSlugOf(props.insect) : "";
  return route.map((k) => ({
    key: k,
    label: label[k] ?? k,
    built: k === "adult" || hasStage(code, k),
  }));
});

const lifeStory = computed(() => {
  const l = props.insect?.insectLifecycle ?? [];
  return l.length ? l.join(" → ") : "暂无生活史数据";
});

/** 讲解步骤带 anchor 时通知父级对镜头 */
watch(
  () => [props.kind, index.value, props.insect?.insectCode] as const,
  () => {
    picked.value = null;
    if (props.kind === "lesson") {
      emit("focus", step.value?.anchor ?? null);
    } else if (props.kind === "lifecycle") {
      emit("focus", null);
    }
  },
  { immediate: true },
);

function next() {
  if (index.value < total.value - 1) index.value += 1;
}

function prev() {
  if (index.value > 0) index.value -= 1;
}

function pick(i: number) {
  if (picked.value !== null) return;
  picked.value = i;
}

function optionClass(i: number): Record<string, boolean> {
  const q = question.value;
  const cls: Record<string, boolean> = {};
  if (!q || picked.value === null) return cls;
  if (i === q.answer) cls["is-right"] = true;
  else if (i === picked.value) cls["is-wrong"] = true;
  return cls;
}
</script>

<style scoped>
.idc {
  position: fixed;
  inset: 0;
  z-index: 3200;
  background: color-mix(in srgb, var(--el-color-primary-dark-2) 62%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.idc__panel {
  position: relative;
  width: min(560px, 100%);
  background: var(--el-bg-color);
  border-radius: 26px;
  padding: 24px 26px 22px;
  box-shadow: var(--el-box-shadow-dark);
}
.idc__close {
  position: absolute;
  right: 16px;
  top: 16px;
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 50%;
  background: var(--el-fill-color);
  color: var(--el-text-color-secondary);
  font-size: 15px;
  cursor: pointer;
}
.idc__head {
  margin-bottom: 12px;
}
.idc__title {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 1px;
  color: var(--el-text-color-primary);
}
.idc__sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
.idc__progress {
  display: flex;
  gap: 5px;
  margin-bottom: 16px;
}
.idc__pip {
  flex: 1;
  height: 5px;
  border-radius: 999px;
  background: var(--el-fill-color);
  transition: background 0.2s;
}
.idc__pip.is-done {
  background: var(--el-color-primary-light-5);
}
.idc__pip.is-now {
  background: var(--el-color-primary);
}

.idc__body {
  min-height: 148px;
}
.idc__body--empty {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
.idc__step-title {
  margin: 0 0 10px;
  font-size: 19px;
  font-weight: 900;
  color: var(--el-text-color-primary);
  line-height: 1.5;
}
.idc__step-body {
  margin: 0;
  font-size: 15px;
  line-height: 1.9;
  color: var(--el-text-color-regular);
}
.idc__text {
  margin: 14px 0 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-secondary);
}

.idc__options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.idc__option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 11px 14px;
  border-radius: 14px;
  border: 2px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.15s;
}
.idc__option:hover:not(:disabled) {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}
.idc__option:disabled {
  cursor: default;
}
.idc__option.is-right {
  border-color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.idc__option.is-wrong {
  border-color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
.idc__option-mark {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.idc__option-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}
.idc__explain {
  margin: 12px 0 0;
  font-size: 13px;
  line-height: 1.8;
  padding: 10px 12px;
  border-radius: 12px;
}
.idc__explain.is-right {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}
.idc__explain.is-wrong {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.idc__stages {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 8px;
}
.idc__stage {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 2px solid var(--el-border-color-lighter);
  background: var(--el-bg-color);
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}
.idc__stage:hover:not(:disabled) {
  border-color: var(--el-color-primary-light-5);
}
.idc__stage.is-active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.idc__stage.is-off {
  opacity: 0.5;
  cursor: not-allowed;
}
.idc__stage-name {
  font-size: 15px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.idc__stage-hint {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

.idc__foot {
  margin-top: 18px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.idc__btn {
  height: 42px;
  padding: 0 20px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  font-size: 14px;
  font-weight: 800;
  transition: transform 0.15s, opacity 0.15s;
}
.idc__btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.idc__btn:hover:not(:disabled) {
  transform: translateY(-1px);
}
.idc__btn--primary {
  background: var(--el-color-primary);
  color: var(--el-color-white);
  box-shadow: 0 8px 18px rgba(var(--el-color-primary-rgb), 0.32);
}
.idc__btn--ghost {
  background: var(--el-fill-color);
  color: var(--el-text-color-regular);
}
.idc__btn--outline {
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  border: 2px solid var(--el-color-primary);
}
</style>
