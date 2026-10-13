<!--
  QuestionMarketView —— 题库市场（独立菜单页：左购物车 / 右市场）

  路由：/edu/market（meta.title「题库市场」），入口：
    - 试卷列表页工具栏「题库」按钮，带 ?paperId=&subject=&gradeLevel=&grade= 进入；
    - 组卷页右栏「题库市场」按钮，带当前论文 ID 进入。

  页面结构：
    - 左侧：组卷购物车（usePaperCart，按试卷维度持久化到 localStorage）；
    - 右侧：题库市场面板（QuestionMarketDialog 常开，检索 / 多选 / 加入购物车）。

  本题库市场页为路由所需的基础落地页：市场面板复用既有 QuestionMarketDialog
  与 usePaperCart，不重复实现检索与购物车逻辑。
-->
<template>
  <div class="page-container question-market-page">
    <div class="qmp-head">
      <div class="qmp-head__left">
        <span class="qmp-head__title">题库市场</span>
        <el-tag v-if="paperId" type="primary" effect="light">试卷 #{{ paperId }}</el-tag>
        <el-tag v-else type="info" effect="light">临时购物车（未关联试卷）</el-tag>
      </div>
      <div class="qmp-head__right">
        <span class="qmp-head__total">购物车 {{ cart.count.value }} 题 · {{ cart.totalScore.value }} 分</span>
        <ReButton v-if="!marketOpen" icon="ShoppingCart" @click="marketOpen = true">打开市场</ReButton>
        <ReButton v-if="paperId" type="primary" icon="EditPen" @click="goCompose">返回组卷</ReButton>
      </div>
    </div>

    <div class="qmp-body">
      <!-- 左：购物车 -->
      <section class="qmp-cart">
        <header class="qmp-cart__head">
          <span>组卷购物车</span>
          <el-button link type="danger" :disabled="!cart.count.value" @click="onClearCart">清空</el-button>
        </header>

        <div v-if="!cart.count.value" class="qmp-cart__empty">
          <el-empty description="购物车为空，去右侧市场挑题" :image-size="72" />
        </div>

        <div v-else v-loading="false" class="qmp-cart__list">
          <div v-for="item in cart.items.value" :key="item.questionId" class="qmp-cart__row">
            <div class="qmp-cart__row-head">
              <el-tag type="info" size="small">{{ item.type || "未标题型" }}</el-tag>
              <el-button link type="danger" size="small" @click="cart.remove(item.questionId)">移除</el-button>
            </div>
            <div class="qmp-cart__row-stem" v-html="renderMathSummary(item.stem, 60) || '（题干为空）'" />
            <div class="qmp-cart__row-foot">
              <span>分值</span>
              <el-input-number
                :model-value="item.score"
                :min="1"
                :max="100"
                size="small"
                controls-position="right"
                @change="(v: number | undefined) => cart.setScore(item.questionId, Number(v) || 1)"
              />
            </div>
          </div>
        </div>

        <footer v-if="cart.count.value" class="qmp-cart__foot">
          合计 {{ cart.count.value }} 题 / {{ cart.totalScore.value }} 分
        </footer>
      </section>

      <!-- 右：市场面板（常开弹框，检索 / 多选 / 加入购物车） -->
      <section class="qmp-market">
        <div class="qmp-market__hint">
          <el-icon :size="28"><ShoppingCart /></el-icon>
          <p>市场面板已打开</p>
          <p class="qmp-market__hint-sub">检索并勾选题目后点「加入购物车」，左侧购物车同步更新</p>
        </div>
        <QuestionMarketDialog v-model="marketOpen" :paper-id="paperId" @picked="onPicked" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * QuestionMarketView —— 题库市场独立页。
 *
 * 购物车与市场面板均复用既有实现：usePaperCart（持久化）+ QuestionMarketDialog（检索）。
 * 市场弹框带 append-to-body，常开展示；关闭后可用右上角「打开市场」重新打开。
 */
import { message } from "@repo/core";
import { ShoppingCart } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import ReButton from "@repo/ui/re-button";
import QuestionMarketDialog from "../components/paper/QuestionMarketDialog.vue";
import { toCartItem, usePaperCart } from "../composables/usePaperCart";
import type { MarketQuestion } from "../api/types";
import { renderMathSummary } from "../utils/mathText";

defineOptions({ name: "QuestionMarketView" });

const route = useRoute();
const router = useRouter();

/** 当前试卷标识（路由 query.paperId；为空为临时购物车） */
const paperId = computed<number | null>(() => {
  const raw = route.query.paperId;
  const num = Number(raw);
  return raw != null && raw !== "" && Number.isFinite(num) ? num : null;
});

/** 市场弹框显隐（常开；关闭后可重开） */
const marketOpen = ref(true);

const cart = usePaperCart(paperId);

/** 市场面板「加入购物车」回调：映射为购物车条目并去重加入 */
function onPicked(list: MarketQuestion[]): void {
  const added = cart.addMany(list.map((q) => toCartItem(q)));
  if (added > 0) {
    message.success(`已加入购物车 ${added} 题`);
  } else {
    message.info("所选题目已在购物车中");
  }
}

/** 清空购物车 */
function onClearCart(): void {
  cart.clear();
  message.success("购物车已清空");
}

/** 返回组卷页（带当前论文 ID 回填） */
function goCompose(): void {
  if (paperId.value == null) {
    message.warning("当前为临时购物车，请先在试卷列表选择试卷");
    return;
  }
  void router.push({ path: "/eduai/paper-compose", query: { paperId: String(paperId.value) } });
}
</script>

<style scoped>
.question-market-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.qmp-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.qmp-head__left,
.qmp-head__right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qmp-head__title {
  font-size: 18px;
  font-weight: 600;
}

.qmp-head__total {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.qmp-body {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.qmp-cart {
  flex: 0 0 360px;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  background: var(--el-bg-color);
  max-height: calc(100vh - 180px);
}

.qmp-cart__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.qmp-cart__empty {
  padding: 24px 0;
}

.qmp-cart__list {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.qmp-cart__row {
  padding: 8px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter);
}

.qmp-cart__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.qmp-cart__row-stem {
  margin: 4px 0;
  font-size: 13px;
  color: var(--el-text-color-regular);
  line-height: 1.5;
}

.qmp-cart__row-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.qmp-cart__foot {
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  border-top: 1px solid var(--el-border-color-lighter);
}

.qmp-market {
  flex: 1;
  min-height: 320px;
}

.qmp-market__hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 320px;
  color: var(--el-text-color-secondary);
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.qmp-market__hint p {
  margin: 0;
}

.qmp-market__hint-sub {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
