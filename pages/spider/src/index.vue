<template>
  <section class="spider-home">
    <div class="spider-home__inner max-w-6xl mx-auto p-6">
      <!-- Page Header -->
      <header class="spider-home__header">
        <div>
          <p class="spider-home__eyebrow">Spider Center</p>
          <h1 class="spider-home__title">AI 可视化编排爬虫</h1>
          <p class="spider-home__subtitle">主页面只保留两个入口：总览和爬虫管理。编排、预览、人工介入全部从管理页进入。</p>
        </div>
        <el-button type="primary" plain class="spider-home__cta" @click="router.push('/spider/manage')">
          <el-icon class="mr-1"><Setting /></el-icon>进入爬虫管理
        </el-button>
      </header>

      <!-- Quick Entry Cards -->
      <el-row :gutter="20" class="mt-8">
        <el-col :xs="24" :sm="12" v-for="item in cards" :key="item.path">
          <el-card
            shadow="hover"
            class="spider-home__card !rounded-xl transition-all cursor-pointer"
            @click="router.push(item.path)"
          >
            <div class="spider-home__card-inner">
              <div class="spider-home__card-badge">{{ item.badge }}</div>
              <h3 class="spider-home__card-title">{{ item.title }}</h3>
              <p class="spider-home__card-desc">{{ item.desc }}</p>
              <div class="spider-home__card-meta">
                <span class="spider-home__card-meta-item">
                  <el-icon><ArrowRight /></el-icon>进入
                </span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Capability Highlights -->
      <section class="spider-home__features mt-12">
        <h2 class="spider-home__section-title">核心能力</h2>
        <el-row :gutter="16">
          <el-col :xs="12" :sm="6" v-for="feat in features" :key="feat.title">
            <div class="spider-home__feat">
              <div class="spider-home__feat-icon">
                <el-icon :size="20"><component :is="feat.icon" /></el-icon>
              </div>
              <h4>{{ feat.title }}</h4>
              <p>{{ feat.desc }}</p>
            </div>
          </el-col>
        </el-row>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { ArrowRight, Setting, DataLine, Connection, Histogram, Cpu } from "@element-plus/icons-vue";

const router = useRouter();

/**
 * 首页快捷入口卡片。
 */
const cards = [
  {
    title: "总览",
    badge: "01",
    path: "/spider/overview",
    desc: "统计爬虫数量、地址队列、解析结果、趋势图与实时运行日志。",
  },
  {
    title: "爬虫管理",
    badge: "02",
    path: "/spider/manage",
    desc: "维护爬虫卡片、执行器、深度采集、通知开关，并进入编排器。",
  },
];

/**
 * 核心能力模块。
 */
const features = [
  { title: "可视化编排", icon: Connection, desc: "拖拽节点构建爬虫流程，支持 AI 自动生成。" },
  { title: "深度采集", icon: Histogram, desc: "智能追踪内链，自动分层抓取详情数据。" },
  { title: "AI 解析", icon: Cpu, desc: "集成大模型，自动分类提取结构化数据。" },
  { title: "实时监控", icon: DataLine, desc: "可视化追踪执行链路、采集进度与异常。" },
];
</script>

<style scoped>
.spider-home {
  min-height: 100%;
  background: var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

/* ── Header ────────────────────────────── */
.spider-home__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 8px;
  padding-bottom: 4px;
}

.spider-home__eyebrow {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--el-text-color-secondary);
}

.spider-home__title {
  margin: 0;
  font-size: 32px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--el-text-color-primary);
  line-height: 1.15;
}

.spider-home__subtitle {
  margin: 12px 0 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
  max-width: 640px;
}

.spider-home__cta {
  border-radius: 999px !important;
}

/* ── Entry Cards ───────────────────────── */
.spider-home__card {
  height: 220px;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.spider-home__card:hover {
  border-color: var(--el-color-primary-light-5);
}

.spider-home__card-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
}

.spider-home__card-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 28px;
  font-size: 12px;
  font-weight: 700;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
  border-radius: 6px;
  align-self: flex-start;
}

.spider-home__card-title {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--el-text-color-primary);
}

.spider-home__card-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.spider-home__card-meta {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-color-primary);
}

.spider-home__card-meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

/* ── Features Section ──────────────────── */
.spider-home__features {
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.spider-home__section-title {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.spider-home__feat {
  padding: 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  background: var(--el-bg-color);
  transition: border-color 0.15s ease;
}

.spider-home__feat:hover {
  border-color: var(--el-border-color);
}

.spider-home__feat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-bottom: 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.spider-home__feat h4 {
  margin: 0 0 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.spider-home__feat p {
  margin: 0;
  font-size: 12px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
}

/* ── Responsive ────────────────────────── */
@media (max-width: 640px) {
  .spider-home__title { font-size: 24px; }
  .spider-home__header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>