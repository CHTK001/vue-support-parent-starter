<template>
  <aside class="nav-panel">
    <div class="brand-block">
      <p class="brand-kicker">Ceru Web Port</p>
      <h1>音乐播放器</h1>
      <p class="brand-copy">
        保留 CeruMusic 的结构感，把桌面 IPC 和插件宿主改造成 Java HTTP API
        与可扩展 SPI。
      </p>
    </div>

    <div class="section-card">
      <div class="section-head">
        <span>音源</span>
        <span class="section-meta">{{ sources.length }} 个</span>
      </div>
      <div class="source-list">
        <button
          v-for="source in sources"
          :key="source.code"
          class="source-pill"
          :class="{ active: activeSource === source.code }"
          @click="emit('switch-source', source.code)"
        >
          <strong>{{ source.name }}</strong>
          <span>{{ source.description }}</span>
        </button>
      </div>
    </div>

    <div class="section-card">
      <div class="section-head">
        <span>导航</span>
      </div>
      <button
        v-for="item in navItems"
        :key="item.code"
        class="nav-item"
        :class="{ active: activeSection === item.code }"
        @click="emit('change-section', item.code)"
      >
        <span>{{ item.label }}</span>
        <small>{{ item.hint }}</small>
      </button>
    </div>

    <div class="section-card">
      <div class="section-head">
        <span>热词</span>
      </div>
      <div class="tag-wall">
        <button
          v-for="tag in hotKeywords"
          :key="tag"
          class="tag-pill"
          @click="emit('search-tag', tag)"
        >
          {{ tag }}
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import type { MusicNavItem, MusicSection, MusicSourceOption } from "../types";

defineProps<{
  sources: MusicSourceOption[];
  activeSource: string;
  navItems: MusicNavItem[];
  activeSection: MusicSection;
  hotKeywords: string[];
}>();

const emit = defineEmits<{
  (e: "switch-source", source: string): void;
  (e: "change-section", section: MusicSection): void;
  (e: "search-tag", tag: string): void;
}>();
</script>

<style scoped lang="scss">
.nav-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.brand-block,
.section-card {
  border: 1px solid rgba(20, 32, 42, 0.12);
  border-radius: 28px;
  background: rgba(255, 252, 245, 0.88);
  box-shadow: 0 18px 40px rgba(17, 25, 32, 0.08);
  backdrop-filter: blur(16px);
}

.brand-block {
  padding: 24px;
  background: linear-gradient(135deg, rgba(16, 25, 31, 0.96), rgba(47, 93, 115, 0.92));
  color: #f8f1e7;
}

.brand-kicker {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.72;
}

.brand-block h1 {
  margin: 0;
  font-size: 40px;
  line-height: 1.05;
}

.section-card {
  padding: 18px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.section-meta,
.brand-copy,
.source-pill span,
.nav-item small {
  color: #5f6a70;
}

.source-list,
.tag-wall {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.source-pill,
.tag-pill,
.nav-item {
  border: 0;
  cursor: pointer;
  transition: all 0.18s ease;
}

.source-pill,
.nav-item,
.tag-pill {
  background: rgba(255, 255, 255, 0.7);
}

.source-pill {
  width: 100%;
  padding: 14px;
  border-radius: 18px;
  text-align: left;
}

.source-pill strong,
.source-pill span,
.nav-item span,
.nav-item small {
  display: block;
}

.source-pill.active,
.nav-item.active,
.tag-pill:hover {
  background: linear-gradient(135deg, rgba(188, 127, 79, 0.16), rgba(47, 93, 115, 0.15));
  box-shadow: inset 0 0 0 1px rgba(47, 93, 115, 0.22);
}

.nav-item {
  width: 100%;
  padding: 14px;
  border-radius: 18px;
  text-align: left;
  margin-top: 10px;
}

.tag-pill {
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 12px;
}
</style>
