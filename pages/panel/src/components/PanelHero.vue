<template>
  <section class="hero">
    <div class="hero-copy">
      <p class="eyebrow">Panel Console</p>
      <h1>统一客户端面板</h1>
      <p class="summary">
        第一阶段先落 JDBC，后续再扩展 Redis、文档生成、AI 辅助和后台同步能力。
      </p>
    </div>
    <div class="hero-matrix">
      <div v-for="item in capabilityCards" :key="item.code" class="cap-card">
        <div class="cap-head">
          <span class="cap-title">{{ item.title }}</span>
          <span class="cap-state" :class="{ active: item.enabled }">
            {{ item.enabled ? "启用" : "规划中" }}
          </span>
        </div>
        <p class="cap-desc">{{ item.description }}</p>
      </div>
    </div>
  </section>

  <section class="section-grid">
    <article
      v-for="section in sections"
      :key="section.code"
      class="section-card"
    >
      <h2>{{ section.title }}</h2>
      <p>{{ section.description }}</p>
    </article>
  </section>

  <section class="roadmap">
    <div class="roadmap-head">
      <h2>第一阶段范围</h2>
      <p>先把新骨架和 JDBC 主链路做稳，再逐步接 Redis 和同步增强。</p>
    </div>
    <div class="roadmap-list">
      <div class="roadmap-item done">删除旧 monitor data-management 主链路</div>
      <div class="roadmap-item active">创建 panel 页面骨架</div>
      <div class="roadmap-item">实现 JDBC 连接与缓存</div>
      <div class="roadmap-item">实现数据库/表/结构浏览与搜索</div>
      <div class="roadmap-item">实现 SQL 在线调试与 AI 解释</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PanelCapabilityCard, PanelSection } from "../panel";

defineProps<{
  capabilityCards: PanelCapabilityCard[];
  sections: PanelSection[];
}>();
</script>
