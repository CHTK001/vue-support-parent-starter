<template>
  <div class="ilc-page">
    <header class="ilc-head">
      <h1 class="ilc-head__title">成语学习卡片</h1>
      <p class="ilc-head__sub">刚才的两块拼不成成语，来看看它们各自的意思吧</p>
    </header>

    <div v-if="cards.length" class="ilc-list">
      <article v-for="(card, idx) in cards" :key="idx" class="ilc-card">
        <div class="ilc-card__badge">{{ idx + 1 }}</div>
        <div class="ilc-card__head">
          <span class="ilc-card__word">{{ card.content }}</span>
          <span class="ilc-card__pinyin">{{ card.pinyin }}</span>
        </div>
        <div class="ilc-card__row">
          <span class="ilc-card__label">释义</span>
          <span class="ilc-card__text">{{ card.meaning || "—" }}</span>
        </div>
        <div v-if="card.source" class="ilc-card__row">
          <span class="ilc-card__label">出处</span>
          <span class="ilc-card__text">{{ card.source }}</span>
        </div>
        <div v-if="card.example" class="ilc-card__row">
          <span class="ilc-card__label">例句</span>
          <span class="ilc-card__text">{{ card.example }}</span>
        </div>
      </article>
    </div>
    <el-empty v-else :image-size="88" description="没有可展示的成语卡片" />

    <footer class="ilc-foot">
      <button type="button" class="ilc-btn" @click="emit('close')">知道了</button>
    </footer>
  </div>
</template>

<script setup lang="ts">
/**
 * IdiomLearnCards —— 成语学习卡片（纯展示）
 *
 * 供两处复用：① 独立弹窗页面 IdiomCardView；② 消消乐配对错误时的站内全屏覆盖层。
 */
export interface LearnCard {
  content: string;
  pinyin?: string;
  meaning?: string;
  source?: string;
  example?: string;
}

defineOptions({ name: "IdiomLearnCards" });

withDefaults(defineProps<{ cards?: LearnCard[] }>(), { cards: () => [] });

const emit = defineEmits<{ (e: "close"): void }>();
</script>

<style scoped>
.ilc-page {
  min-height: 100%;
  padding: 26px 22px 30px;
  background: linear-gradient(160deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.ilc-head {
  text-align: center;
  color: var(--el-color-white);
}
.ilc-head__title {
  margin: 0;
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 2px;
  text-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
}
.ilc-head__sub {
  margin: 8px 0 0;
  font-size: 13px;
  opacity: 0.92;
}

.ilc-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.ilc-card {
  position: relative;
  background: var(--el-bg-color);
  border-radius: 18px;
  padding: 18px 20px 18px 54px;
  box-shadow: var(--el-box-shadow);
}
.ilc-card__badge {
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
.ilc-card__head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.ilc-card__word {
  font-size: 24px;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--el-text-color-primary);
}
.ilc-card__pinyin {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}
.ilc-card__row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 14px;
  line-height: 1.7;
}
.ilc-card__label {
  flex-shrink: 0;
  width: 34px;
  color: var(--el-text-color-secondary);
  font-weight: 700;
}
.ilc-card__text {
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.ilc-foot {
  margin-top: auto;
  display: flex;
  justify-content: center;
  padding-top: 8px;
}
.ilc-btn {
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
.ilc-btn:hover {
  transform: translateY(-1px);
}
</style>
