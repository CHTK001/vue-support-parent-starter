<template>
  <div class="page-card ai-home-page">
    <BackButton to="/dashboard" />

    <div class="home-hero">
      <h1>AI 配置</h1>
      <p class="hero-sub">选择一个模块</p>
    </div>

    <div class="cards-grid">
      <div v-for="(card, idx) in aiCards" :key="card.path" class="module-card" :class="[`card-${idx}`]" :style="{ '--card-hue': card.hue }" @click="router.push(card.path)">
        <div class="card-glow" />
        <div class="card-icon-wrap">
          <span class="card-icon" v-html="card.icon" />
        </div>
        <div class="card-body">
          <div class="card-name">{{ card.name }}</div>
          <div class="card-path">{{ card.path }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

const router = useRouter();

const aiCards = [
  { name: "AI 管理", path: "/ai", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2a4 4 0 014 4c0 2-2 3-2 5h-4c0-2-2-3-2-5a4 4 0 014-4z"/><path d="M8 15h8l1 2H7l1-2z"/><path d="M14 21a2 2 0 11-4 0"/></svg>', hue: 270 },
  { name: "使用统计", path: "/ai/usage", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>', hue: 330 },
  { name: "提供商管理", path: "/ai/providers", icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>', hue: 210 },
];
</script>

<style scoped>
.ai-home-page { }
.home-hero { margin-bottom: 28px; }
.home-hero h1 { margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.03em; }
.hero-sub { font-size: 13px; color: var(--el-text-color-secondary); margin: 4px 0 0; }

.cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
.module-card {
  position: relative; overflow: hidden;
  background: var(--el-bg-color); border: 1px solid var(--el-border-color);
  border-radius: 14px; padding: 22px 20px; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.module-card:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.07); border-color: transparent; }
.card-glow {
  position: absolute; top: -60%; right: -40%; width: 120px; height: 120px;
  border-radius: 50%; opacity: 0.06;
  background: hsla(var(--card-hue, 200), 70%, 50%, 1);
  transition: opacity 0.3s;
}
.module-card:hover .card-glow { opacity: 0.12; }
.card-icon-wrap {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
  background: hsla(var(--card-hue, 200), 60%, 55%, 0.1);
  color: hsla(var(--card-hue, 200), 60%, 45%, 1);
}
.card-icon { display: flex; }
.card-name { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.card-path { font-size: 11px; color: var(--el-text-color-secondary); font-family: monospace; }
</style>
