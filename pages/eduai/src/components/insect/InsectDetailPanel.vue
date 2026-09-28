<template>
  <aside class="idp">
    <header class="idp__head">
      <h2 class="idp__name">{{ insect?.insectName ?? "—" }}</h2>
      <div class="idp__tags">
        <span class="idp__tag">{{ orderLabel }}</span>
        <span class="idp__tag">{{ metaLabel }}</span>
      </div>
      <p class="idp__latin">{{ insect?.insectLatin }}</p>
      <p v-if="insect?.insectEpithet" class="idp__epithet">{{ insect.insectEpithet }}</p>
    </header>

    <p v-if="insect?.insectSummary" class="idp__summary">{{ insect.insectSummary }}</p>

    <template v-if="insect">
      <!-- 关键数据 -->
      <div v-if="insect.insectFacts?.length" class="idp__block">
        <h3 class="idp__block-title"><span class="idp__dot" />关键数据</h3>
        <div class="idp__facts">
          <div v-for="(f, i) in insect.insectFacts" :key="i" class="idp__fact">
            <span class="idp__fact-key">{{ f.key }}</span>
            <span class="idp__fact-value">{{ f.value }}</span>
          </div>
        </div>
      </div>

      <!-- 生态角色 -->
      <div v-if="insect.insectEcology" class="idp__block">
        <h3 class="idp__block-title"><span class="idp__dot idp__dot--green" />生态角色</h3>
        <p class="idp__text">{{ insect.insectEcology }}</p>
      </div>

      <!-- 你知道吗 -->
      <div v-if="insect.insectTrivia" class="idp__block">
        <h3 class="idp__block-title"><span class="idp__dot idp__dot--amber" />你知道吗</h3>
        <p class="idp__text">{{ insect.insectTrivia }}</p>
      </div>

      <!-- 栖境（来自深度讲解） -->
      <div v-if="guide?.habitat?.body" class="idp__block">
        <h3 class="idp__block-title"><span class="idp__dot idp__dot--info" />{{ guide.habitat.title || "它在哪里" }}</h3>
        <p class="idp__text">{{ guide.habitat.body }}</p>
      </div>

      <!-- 分布 / 状态 -->
      <div class="idp__block">
        <div v-if="insect.insectRange" class="idp__row">
          <span class="idp__row-label">分布</span>
          <span class="idp__row-text">{{ insect.insectRange }}</span>
        </div>
        <div v-if="insect.insectStatus" class="idp__row">
          <span class="idp__row-label">状态</span>
          <span class="idp__row-text">{{ insect.insectStatus }}</span>
        </div>
      </div>

      <!-- 生活史 -->
      <div v-if="insect.insectLifecycle?.length" class="idp__block">
        <h3 class="idp__block-title"><span class="idp__dot idp__dot--info" />生活史</h3>
        <div class="idp__life">
          <button
            v-for="(stage, i) in insect.insectLifecycle"
            :key="i"
            type="button"
            class="idp__life-stage"
            :class="{ 'is-active': lifeStage === stageKey(i), 'is-built': stageAvailable(stageKey(i)) }"
            :disabled="!stageAvailable(stageKey(i))"
            :title="stageAvailable(stageKey(i)) ? '在展台上查看该阶段' : '该阶段暂无 3D 模型'"
            @click="emit('stage', stageKey(i))"
          >
            {{ stage }}
          </button>
        </div>
      </div>

      <!-- 近缘种 -->
      <div v-if="insect.insectRelatives?.length" class="idp__block">
        <h3 class="idp__block-title"><span class="idp__dot" />近缘种</h3>
        <div class="idp__chips">
          <span v-for="(r, i) in insect.insectRelatives" :key="i" class="idp__chip">{{ r }}</span>
        </div>
      </div>
    </template>

    <p v-else-if="!loading" class="idp__empty">未选择物种</p>
  </aside>
</template>

<script setup lang="ts">
/**
 * InsectDetailPanel —— 右栏物种详情
 *
 * 内容对应上游 DetailPanel：学名/雅称、关键数据、生态角色、冷知识、栖境、
 * 分布状态、生活史、近缘种。3D 展台在中间，这里只负责读。
 *
 * 生活史阶段的可用性必须按**建模 slug** 判断（见 modelSlug.ts）：物种可以借用
 * 另一个物种的 3D 模型，此时阶段模型注册在被借用的 slug 下。
 */
import { computed } from "vue";
import { ORDER_LABELS, metamorphosisLabel } from "./orderLabels";
import { modelSlugOf } from "./modelSlug";
import { hasStage, type LifeStage } from "../../insect/three/stages";
import type { InsectDetail, InsectGuideView } from "../../api/types";

const props = defineProps<{
  insect: InsectDetail | null;
  guide: InsectGuideView | null;
  /** 当前展台展示的生活史阶段 */
  lifeStage: LifeStage | null;
  loading?: boolean;
}>();

const emit = defineEmits<{ (e: "stage", stage: LifeStage): void }>();

const orderLabel = computed(() =>
  props.insect?.insectOrder ? (ORDER_LABELS[props.insect.insectOrder] ?? props.insect.insectOrder) : "—",
);
const metaLabel = computed(() => metamorphosisLabel(props.insect?.insectMetamorphosis));

/**
 * lifecycle 文案 → LifeStage 枚举。
 *
 * 数据里写的是「卵」「幼虫（三龄）」「水虿」这类带括号说明的自然语言，
 * 这里取前缀做匹配；匹配不上就落到 adult，交给 stageAvailable 决定是否可点。
 */
function stageKey(index: number): LifeStage {
  const raw = props.insect?.insectLifecycle?.[index] ?? "";
  if (raw.includes("卵")) return "egg";
  if (raw.includes("蛹")) return "pupa";
  if (raw.includes("若虫") || raw.includes("稚虫") || raw.includes("水虿")) return "nymph";
  if (raw.includes("幼虫") || raw.includes("幼体")) return "larva";
  return "adult";
}

function stageAvailable(stage: LifeStage): boolean {
  if (!props.insect) return false;
  if (stage === "adult") return true;
  // 阶段模型按建模 slug 注册：复用了模型的物种要查被借用的那个 slug
  return hasStage(modelSlugOf(props.insect), stage);
}
</script>

<style scoped>
.idp {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--el-bg-color);
  /* 原 22px，最近档 16px（xl） */
  border-radius: var(--el-radius-xl, 16px);
  padding: 16px 16px 18px;
  /* koi 卡片不加投影：改用一条边框承载边界 */
  border: 1px solid var(--el-border-color-lighter);
  overflow-y: auto;
  max-height: 78vh;
}
.idp__head {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.idp__name {
  margin: 0;
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 1px;
  color: var(--el-text-color-primary);
}
.idp__tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.idp__tag {
  font-size: 11px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: var(--el-radius-sm, 6px);
  padding: 1px 8px;
}
.idp__latin {
  margin: 0;
  font-size: 13px;
  font-style: italic;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}
.idp__epithet {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}
.idp__summary {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  padding: 10px 12px;
}

.idp__block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.idp__block-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 900;
  color: var(--el-text-color-primary);
}
.idp__dot {
  width: 8px;
  height: 8px;
  /* 小节标题圆点用圆形令牌 */
  border-radius: var(--el-border-radius-circle, 50%);
  background: var(--el-color-primary);
  flex-shrink: 0;
}
.idp__dot--green { background: var(--el-color-success); }
.idp__dot--amber { background: var(--el-color-warning); }
.idp__dot--info { background: var(--el-color-info); }

.idp__facts {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 6px;
}
.idp__fact {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 7px 10px;
  /* 原 10px，在 8px(md)/12px(lg) 之间等距，本批统一取大档 12px（lg） */
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
}
.idp__fact-key {
  font-size: 11px;
  font-weight: 800;
  color: var(--el-color-primary);
}
.idp__fact-value {
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-regular);
  word-break: break-word;
}

.idp__text {
  margin: 0;
  font-size: 13px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.idp__row {
  display: flex;
  gap: 8px;
  font-size: 12px;
  line-height: 1.7;
}
.idp__row-label {
  flex-shrink: 0;
  width: 32px;
  color: var(--el-text-color-secondary);
  font-weight: 800;
}
.idp__row-text {
  color: var(--el-text-color-regular);
  word-break: break-word;
}

.idp__life {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.idp__life-stage {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
  border-radius: var(--el-radius-full, 9999px);
  padding: 4px 12px;
  cursor: pointer;
  /* 浏览器默认焦点框太粗，统一换成 koi 焦点环 */
  outline: none;
  transition: all var(--el-transition-duration-fast, 0.2s) ease;
}
.idp__life-stage.is-built:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}
.idp__life-stage:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.idp__life-stage.is-active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: var(--el-color-white);
}
.idp__life-stage:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.idp__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.idp__chip {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  background: var(--el-fill-color-light);
  border-radius: var(--el-radius-md, 8px);
  padding: 3px 9px;
}
.idp__empty {
  margin: 30px 0;
  text-align: center;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* ============ 无障碍：尊重系统「减少动态效果」偏好 ============ */
@media (prefers-reduced-motion: reduce) {
  .idp__life-stage {
    transition: none;
  }
}
</style>
