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

<style scoped lang="scss">
.hero {
  position: relative;
  display: flex;
  gap: 24px;
  padding: 28px 32px;
  margin-bottom: 16px;
  border-radius: 24px;
  border: 1px solid rgba(123, 142, 154, 0.12);
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.92),
    rgba(243, 247, 250, 0.88)
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  animation: hero-fade-in 0.5s ease-out;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, rgba(99, 102, 241, 0.08), transparent 40%),
      radial-gradient(circle at bottom left, rgba(16, 185, 129, 0.06), transparent 40%);
    pointer-events: none;
  }

  @keyframes hero-fade-in {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

.hero-copy {
  flex: 0 0 340px;
  display: grid;
  gap: 8px;
  align-content: start;
  position: relative;
  z-index: 1;
}

.eyebrow {
  margin: 0;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #6366f1;
}

.hero-copy h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  color: #0f1a2e;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.summary {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #5b7283;
}

.hero-matrix {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  position: relative;
  z-index: 1;
}

.cap-card {
  display: grid;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid rgba(123, 142, 154, 0.1);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(8px);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  animation: cap-card-enter 0.4s ease-out backwards;

  @keyframes cap-card-enter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  &:nth-child(1) { animation-delay: 0.05s; }
  &:nth-child(2) { animation-delay: 0.1s; }
  &:nth-child(3) { animation-delay: 0.15s; }
  &:nth-child(4) { animation-delay: 0.2s; }

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 8px 24px rgba(99, 102, 241, 0.06);
  }
}

.cap-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.cap-title {
  font-size: 14px;
  font-weight: 600;
  color: #152b3d;
}

.cap-state {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 999px;
  border: 1px solid rgba(123, 142, 154, 0.2);
  color: #6a8192;
  white-space: nowrap;

  &.active {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.08);
    color: #047857;
  }
}

.cap-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.55;
  color: #6c8393;
}

/* ── Section Grid ── */
.section-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
  animation: section-grid-enter 0.5s ease-out 0.15s backwards;

  @keyframes section-grid-enter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

.section-card {
  padding: 20px 22px;
  border-radius: 20px;
  border: 1px solid rgba(123, 142, 154, 0.1);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.9),
    rgba(243, 247, 250, 0.86)
  );
  backdrop-filter: blur(12px);
  transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(99, 102, 241, 0.2);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);
  }

  h2 {
    margin: 0 0 8px;
    font-size: 17px;
    font-weight: 700;
    color: #0f1a2e;
    letter-spacing: -0.01em;
  }

  p {
    margin: 0;
    font-size: 13px;
    line-height: 1.6;
    color: #5b7283;
  }
}

/* ── Roadmap ── */
.roadmap {
  padding: 22px 24px;
  border-radius: 20px;
  border: 1px solid rgba(123, 142, 154, 0.1);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.88),
    rgba(243, 247, 250, 0.84)
  );
  backdrop-filter: blur(12px);
  animation: roadmap-enter 0.5s ease-out 0.25s backwards;

  @keyframes roadmap-enter {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
}

.roadmap-head {
  margin-bottom: 16px;

  h2 {
    margin: 0 0 6px;
    font-size: 16px;
    font-weight: 700;
    color: #0f1a2e;
  }

  p {
    margin: 0;
    font-size: 13px;
    color: #5b7283;
  }
}

.roadmap-list {
  display: grid;
  gap: 8px;
}

.roadmap-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  padding-left: 38px;
  border-radius: 12px;
  border: 1px solid rgba(123, 142, 154, 0.08);
  background: rgba(255, 255, 255, 0.5);
  font-size: 13px;
  color: #4f6778;
  transition: all 0.25s ease;
  animation: roadmap-item-enter 0.4s ease-out backwards;

  @keyframes roadmap-item-enter {
    from { opacity: 0; transform: translateX(-8px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @for $i from 1 through 6 {
    &:nth-child(#{$i}) { animation-delay: #{$i * 0.06 + 0.3}s; }
  }

  &::before {
    content: '';
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 2px solid rgba(123, 142, 154, 0.25);
    background: rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
  }

  &:hover {
    transform: translateX(4px);
    border-color: rgba(99, 102, 241, 0.15);
    background: rgba(255, 255, 255, 0.75);
  }

  &.done {
    color: #0f766e;
    border-color: rgba(16, 185, 129, 0.2);
    background: rgba(209, 250, 229, 0.3);

    &::before {
      border-color: #10b981;
      background: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
    }

    &::after {
      content: '';
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%) rotate(45deg);
      width: 5px;
      height: 9px;
      border: solid #fff;
      border-width: 0 2px 2px 0;
      z-index: 1;
    }
  }

  &.active {
    color: #1e40af;
    border-color: rgba(59, 130, 246, 0.25);
    background: rgba(219, 234, 254, 0.3);

    &::before {
      border-color: #3b82f6;
      background: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }
  }
}

/* ── Dark Mode ── */
:global(html.dark) {
  .hero {
    background: linear-gradient(
      135deg,
      rgba(15, 23, 42, 0.88),
      rgba(20, 30, 48, 0.84)
    );
    border-color: rgba(148, 163, 184, 0.08);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .hero-copy h1 {
    color: #e2e8f0;
  }

  .summary {
    color: #94a3b8;
  }

  .cap-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.08);
  }

  .cap-title {
    color: #e2e8f0;
  }

  .cap-state {
    border-color: rgba(148, 163, 184, 0.2);
    color: #94a3b8;

    &.active {
      border-color: rgba(16, 185, 129, 0.3);
      background: rgba(16, 185, 129, 0.1);
      color: #6ee7b7;
    }
  }

  .cap-desc {
    color: #8899a8;
  }

  .section-card {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.86),
      rgba(20, 30, 48, 0.82)
    );
    border-color: rgba(148, 163, 184, 0.08);

    h2 { color: #e2e8f0; }
    p { color: #94a3b8; }
  }

  .roadmap {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.84),
      rgba(20, 30, 48, 0.8)
    );
    border-color: rgba(148, 163, 184, 0.08);
  }

  .roadmap-head {
    h2 { color: #e2e8f0; }
    p { color: #94a3b8; }
  }

  .roadmap-item {
    background: rgba(15, 23, 42, 0.5);
    border-color: rgba(148, 163, 184, 0.06);
    color: #94a3b8;

    &::before {
      border-color: rgba(148, 163, 184, 0.2);
      background: rgba(15, 23, 42, 0.6);
    }

    &.done {
      color: #6ee7b7;
      border-color: rgba(16, 185, 129, 0.2);
      background: rgba(6, 78, 59, 0.25);
    }

    &.active {
      color: #93c5fd;
      border-color: rgba(59, 130, 246, 0.2);
      background: rgba(30, 58, 138, 0.25);
    }
  }
}

/* ── Responsive ── */
@media (max-width: 1200px) {
  .hero {
    flex-direction: column;
  }

  .hero-copy {
    flex: none;
  }

  .hero-matrix {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 20px;
  }

  .hero-matrix {
    grid-template-columns: 1fr;
  }

  .section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
