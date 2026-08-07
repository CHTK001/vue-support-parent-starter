<script setup lang="ts">
/**
 * 主页 —— 组件库展示大厅
 *
 * 设计：
 *   1) 顶部 Hero 区：项目简介 + 统计
 *   2) ReGraph 系列高亮（chart 分类首条）：完整渲染示例
 *   3) 按 category 分组的卡片网格：每个组件一张卡片，点击进入 /debug/:name 调参
 *
 * 全部元数据来自 data/componentRegistry.ts；ReGraph 系列示例数据来自 templates/graph.ts。
 */
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  Aim,
  Connection,
  MagicStick,
  Promotion,
  Share,
} from "@element-plus/icons-vue";
import {
  categoryLabel,
  categoryOrder,
  registry,
  type ComponentCategory,
  type ComponentMeta,
} from "../data/componentRegistry";
import { templateMap } from "../templates";

const router = useRouter();

/** 按 category 分组的组件元数据 */
const grouped = computed(() => {
  const map = new Map<ComponentCategory, ComponentMeta[]>();
  for (const cat of categoryOrder) {
    map.set(cat, []);
  }
  for (const item of registry) {
    map.get(item.category)?.push(item);
  }
  return categoryOrder
    .map((cat) => ({
      category: cat,
      label: categoryLabel[cat],
      items: map.get(cat) ?? [],
    }))
    .filter((g) => g.items.length > 0);
});

/** 总数 / 已配置 schema / 未配置 schema */
const stats = computed(() => ({
  total: registry.length,
  configured: registry.filter((item) => templateMap.has(item.name)).length,
  graphSeries: registry.filter((i) => i.name.startsWith("ReGraph")).length,
}));

/** 跳到调试页 */
const goDebug = (name: string) => {
  router.push(`/debug/${name}`);
};

/** 是否已配置 schema（用于卡片角标） */
const hasSchema = (name: string) => templateMap.has(name);
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="hero__bg" />
      <div class="hero__inner">
        <div class="hero__badge">
          <el-icon><MagicStick /></el-icon>
          <span>Vue Support · 组件库展示大厅</span>
        </div>
        <h1 class="hero__title">70+ Re* 组件，统一封装、即开即用</h1>
        <p class="hero__sub">
          全部组件按主题加载（default / koi），按需打包；点卡片 → 左侧调参 → 右侧看效果与代码。
        </p>
        <div class="hero__stats">
          <div class="hero__stat">
            <div class="hero__stat-value">{{ stats.total }}</div>
            <div class="hero__stat-label">组件总数</div>
          </div>
          <div class="hero__stat">
            <div class="hero__stat-value">{{ stats.configured }}</div>
            <div class="hero__stat-label">已配置调参面板</div>
          </div>
          <div class="hero__stat">
            <div class="hero__stat-value">{{ stats.graphSeries }}</div>
            <div class="hero__stat-label">ReGraph 系列</div>
          </div>
          <div class="hero__stat">
            <div class="hero__stat-value">2</div>
            <div class="hero__stat-label">主题切换</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 内容区 -->
    <section class="content">
      <!-- ReGraph 高亮卡片（chart 分组之前） -->
      <div class="spotlight">
        <div class="spotlight__head">
          <div class="spotlight__title">
            <el-icon><MagicStick /></el-icon>
            <span>ReGraph 系列高亮</span>
            <el-tag type="success" size="small" effect="plain" round>
              新功能
            </el-tag>
          </div>
          <el-button text size="small" @click="goDebug('ReGraph')">
            全部关系图 →
          </el-button>
        </div>
        <div class="spotlight__cards">
          <div class="spotlight-card" @click="goDebug('ReGraphForce')">
            <div class="spotlight-card__icon spotlight-card__icon--force">
              <el-icon><Connection /></el-icon>
            </div>
            <div class="spotlight-card__body">
              <div class="spotlight-card__title">ReGraphForce · 力导向</div>
              <div class="spotlight-card__desc">
                社交网络示例，14 节点 / 16 关系，支持搜索、右键扩线、折叠、锁定、历史回溯。
              </div>
              <div class="spotlight-card__meta">
                <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                <span class="spotlight-card__cat">图表 / 关系图</span>
              </div>
            </div>
            <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
          </div>

          <div class="spotlight-card" @click="goDebug('ReGraphTree')">
            <div class="spotlight-card__icon spotlight-card__icon--tree">
              <el-icon><Share /></el-icon>
            </div>
            <div class="spotlight-card__body">
              <div class="spotlight-card__title">ReGraphTree · 组织架构</div>
              <div class="spotlight-card__desc">
                树形布局演示：18 节点公司架构（CEO / 总监 / 部门 / 员工）。
              </div>
              <div class="spotlight-card__meta">
                <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                <span class="spotlight-card__cat">图表 / 关系图</span>
              </div>
            </div>
            <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
          </div>

          <div class="spotlight-card" @click="goDebug('ReGraphCenter')">
            <div class="spotlight-card__icon spotlight-card__icon--center">
              <el-icon><Aim /></el-icon>
            </div>
            <div class="spotlight-card__body">
              <div class="spotlight-card__title">ReGraphCenter · 中心辐射</div>
              <div class="spotlight-card__desc">
                微服务架构示例：API 网关为中心 + 5 业务服务 + 3 数据存储。
              </div>
              <div class="spotlight-card__meta">
                <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                <span class="spotlight-card__cat">图表 / 关系图</span>
              </div>
            </div>
            <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
          </div>

          <div class="spotlight-card" @click="goDebug('ReGraph3D')">
            <div class="spotlight-card__icon spotlight-card__icon--3d">
              <el-icon><MagicStick /></el-icon>
            </div>
            <div class="spotlight-card__body">
              <div class="spotlight-card__title">ReGraph3D · 3D 力导向</div>
              <div class="spotlight-card__desc">
                three.js + d3-force，AI 知识图谱 15 节点，自动旋转 / 拖拽缩放。
              </div>
              <div class="spotlight-card__meta">
                <el-tag size="small" effect="plain" type="success">已配置</el-tag>
                <el-tag size="small" effect="plain" type="warning">3D</el-tag>
                <span class="spotlight-card__cat">图表 / 关系图</span>
              </div>
            </div>
            <el-icon class="spotlight-card__arrow"><Promotion /></el-icon>
          </div>
        </div>
      </div>

      <!-- 分类分组 -->
      <div
        v-for="group in grouped"
        :key="group.category"
        class="category"
      >
        <div class="category__head">
          <span class="category__title">{{ group.label }}</span>
          <span class="category__count">{{ group.items.length }} 个</span>
        </div>
        <div class="category__grid">
          <div
            v-for="item in group.items"
            :key="item.name"
            class="item-card"
            @click="goDebug(item.name)"
          >
            <div class="item-card__head">
              <div class="item-card__icon">
                <el-icon><component :is="item.icon ?? 'Box'" /></el-icon>
              </div>
              <el-tag
                v-if="!hasSchema(item.name)"
                size="small"
                effect="plain"
                type="warning"
              >
                通用调试
              </el-tag>
            </div>
            <div class="item-card__title">{{ item.title }}</div>
            <div class="item-card__name">&lt;{{ item.name }} /&gt;</div>
            <div class="item-card__desc">{{ item.description }}</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="scss" scoped>
.home {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-height: 100%;
  background: linear-gradient(180deg, #f4f7fb 0%, #eaf1f9 100%);
}

/* Hero */
.hero {
  position: relative;
  padding: 32px 32px 20px;
  overflow: hidden;
}
.hero__bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 60% 80% at 20% 0%, rgba(91, 141, 239, 0.18), transparent 60%),
    radial-gradient(ellipse 50% 70% at 80% 100%, rgba(168, 85, 247, 0.14), transparent 60%);
  pointer-events: none;
  z-index: 0;
}
.hero__inner {
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  z-index: 1;
}
.hero__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-5);
  border-radius: 999px;
  margin-bottom: 12px;
}
.hero__title {
  font-size: 26px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  margin: 0 0 8px;
  letter-spacing: -0.2px;
}
.hero__sub {
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  max-width: 720px;
  margin: 0 0 20px;
}
.hero__stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  max-width: 760px;
}
.hero__stat {
  padding: 12px 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  transition: all 0.2s ease;
}
.hero__stat:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
}
.hero__stat-value {
  font-size: 22px;
  font-weight: 700;
  color: var(--el-color-primary);
  letter-spacing: -0.5px;
}
.hero__stat-label {
  margin-top: 2px;
  font-size: 12px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

/* Content */
.content {
  padding: 8px 32px 32px;
  max-width: 1480px;
  margin: 0 auto;
  width: 100%;
}

/* ReGraph 特别推荐区 */
.spotlight {
  margin-bottom: 24px;
  padding: 16px 18px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}
.spotlight__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}
.spotlight__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.spotlight__cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}
.spotlight-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  background: var(--el-fill-color-blank);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}
.spotlight-card:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
}
.spotlight-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  font-size: 18px;
  color: #fff;
  background: linear-gradient(135deg, #409eff 0%, #6f42c1 100%);
  border-radius: 8px;
  flex-shrink: 0;
}
.spotlight-card__icon--tree {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}
.spotlight-card__icon--center {
  background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
}
.spotlight-card__icon--3d {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
}
.spotlight-card__body {
  flex: 1;
  min-width: 0;
}
.spotlight-card__title {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}
.spotlight-card__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.spotlight-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.spotlight-card__cat {
  font-size: 11px;
  color: var(--el-text-color-secondary);
}
.spotlight-card__arrow {
  align-self: center;
  font-size: 16px;
  color: var(--el-text-color-placeholder);
  flex-shrink: 0;
  transition: transform 0.2s ease;
}
.spotlight-card:hover .spotlight-card__arrow {
  color: var(--el-color-primary);
  transform: translateX(2px);
}

/* Category */
.category {
  margin-bottom: 24px;
}
.category__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.category__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.category__count {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  padding: 1px 6px;
  background: var(--el-fill-color);
  border-radius: 4px;
}
.category__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

/* Item Card */
.item-card {
  padding: 14px;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 130px;
}
.item-card:hover {
  border-color: var(--el-color-primary-light-5);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.08);
}
.item-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}
.item-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  font-size: 16px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
}
.item-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.item-card__name {
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
  align-self: flex-start;
}
.item-card__desc {
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-top: auto;
}

/* 响应式 */
@media (max-width: 1100px) {
  .hero__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .spotlight__cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 720px) {
  .hero {
    padding: 24px 16px 16px;
  }
  .content {
    padding: 8px 16px 16px;
  }
  .hero__stats {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero__title {
    font-size: 20px;
  }
  .spotlight__cards {
    grid-template-columns: 1fr;
  }
}
</style>
