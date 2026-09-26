<template>
  <div class="ick-page">
    <header class="ick-head">
      <h1 class="ick-head__title">昆虫图鉴卡片</h1>
      <p class="ick-head__sub">刚才的两块配不成同一物种，来看看它们各自的身份吧</p>
    </header>

    <div v-if="cards.length" class="ick-list">
      <article v-for="(card, idx) in cards" :key="idx" class="ick-card">
        <span class="ick-card__dot" :style="{ background: card.accent || 'var(--el-color-primary)' }" />
        <div class="ick-card__badge">{{ idx + 1 }}</div>
        <div class="ick-card__head">
          <span class="ick-card__name">{{ card.name }}</span>
          <span class="ick-card__order">{{ card.order }}</span>
        </div>
        <div class="ick-card__latin">{{ card.latin }}</div>
        <div v-if="card.metamorphosis" class="ick-card__row">
          <span class="ick-card__label">变态</span>
          <span class="ick-card__text">{{ card.metamorphosis }}</span>
        </div>
        <div v-if="card.summary" class="ick-card__row">
          <span class="ick-card__label">简介</span>
          <span class="ick-card__text">{{ card.summary }}</span>
        </div>
      </article>
    </div>
    <el-empty v-else :image-size="88" description="没有可展示的昆虫卡片" />

    <footer class="ick-foot">
      <button type="button" class="ick-btn" @click="emit('close')">知道了</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * InsectLearnCards —— 昆虫图鉴卡片（纯展示）
 *
 * 供两处复用：① 独立弹窗页面 InsectCardView；② 昆虫识图配对错误时的站内全屏覆盖层。
 * 样式与成语学习卡片（IdiomLearnCards）保持同一套观感。
 */
export interface LearnCard {
  /** 中文名 */
  name: string;
  /** 学名 */
  latin: string;
  /** 所属目中文名 */
  order: string;
  /** 变态类型中文名 */
  metamorphosis: string;
  /** 简介 */
  summary: string;
  /** 主题色 hex */
  accent: string;
}

defineOptions({ name: "InsectLearnCards" });

withDefaults(defineProps<{ cards?: LearnCard[] }>(), { cards: () => [] });

const emit = defineEmits<{ (e: "close"): void }>();
</script>

<style scoped>
.ick-page {
  min-height: 100%;
  padding: 26px 22px 30px;
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ick-head {
  text-align: center;
  color: var(--el-color-white);
}
.ick-head__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
}
.ick-head__sub {
  margin: 8px 0 0;
  font-size: 13px;
  opacity: 0.92;
}

.ick-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ick-card {
  position: relative;
  background: var(--el-bg-color);
  border-radius: 18px;
  padding: 18px 20px 18px 54px;
  box-shadow: var(--el-box-shadow);
  overflow: hidden;
}
/* 左侧主题色竖条：复用每个物种自带的 accent */
.ick-card__dot {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 6px;
}
.ick-card__badge {
  position: absolute;
  left: 16px;
  top: 18px;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ick-card__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}
.ick-card__name {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.ick-card__order {
  font-size: 12px;
  font-weight: 700;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 6px;
  padding: 1px 8px;
}
.ick-card__latin {
  font-size: 14px;
  font-style: italic;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  margin-bottom: 10px;
  word-break: break-word;
}
.ick-card__row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.7;
}
.ick-card__label {
  flex-shrink: 0;
  width: 34px;
  color: var(--el-text-color-secondary);
  font-weight: 700;
}
.ick-card__text {
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.ick-foot {
  margin-top: auto;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.ick-btn {
  height: 48px;
  padding: 0 46px;
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: 2px;
  background: var(--el-bg-color);
  color: var(--el-color-primary);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.25);
  transition: transform 0.15s;
}
.ick-btn:hover {
  transform: translateY(-1px);
}
</style>
