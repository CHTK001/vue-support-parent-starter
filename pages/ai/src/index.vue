<template>
  <section class="ai-home">
    <header class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Minimal AI Center</p>
        <h1>AI 主体功能中心</h1>
        <p class="hero-text">
          以最短路径进入聊天、生图、视频和图像处理能力。右上角设置统一维护模型、厂家、地址与费用。
        </p>
      </div>

      <div class="hero-actions">
        <button class="settings-button" type="button" @click="router.push('/ai/settings')">
          <span>设置</span>
          <span class="settings-icon">⚙</span>
        </button>
      </div>
    </header>

    <div class="card-grid">
      <FeatureCard
        v-for="item in cards"
        :key="item.path"
        :title="item.title"
        :description="item.description"
        :emoji="item.emoji"
        :accent="item.accent"
        @click="router.push(item.path)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import FeatureCard from "./views/ai/components/FeatureCard.vue";

const router = useRouter();

const cards = [
  {
    title: "聊天",
    description: "模型选择、会话列表、流式回复。",
    emoji: "💬",
    path: "/ai/chat",
    accent: "linear-gradient(135deg, #2563eb, #7c3aed)",
  },
  {
    title: "生图",
    description: "最小提示词与结果历史。",
    emoji: "🖼",
    path: "/ai/image",
    accent: "linear-gradient(135deg, #ec4899, #f97316)",
  },
  {
    title: "视频",
    description: "镜头描述、任务提交、结果回看。",
    emoji: "🎬",
    path: "/ai/video",
    accent: "linear-gradient(135deg, #ef4444, #f59e0b)",
  },
  {
    title: "人脸检测",
    description: "最小检测任务与结构化结果。",
    emoji: "🙂",
    path: "/ai/face",
    accent: "linear-gradient(135deg, #14b8a6, #0ea5e9)",
  },
  {
    title: "图像上色",
    description: "上色任务提交与结果预览。",
    emoji: "🎨",
    path: "/ai/colorization",
    accent: "linear-gradient(135deg, #f59e0b, #84cc16)",
  },
  {
    title: "分辨率增强",
    description: "超分辨率增强与历史结果。",
    emoji: "✨",
    path: "/ai/resolution",
    accent: "linear-gradient(135deg, #10b981, #22c55e)",
  },
];
</script>

<style scoped lang="scss">
.ai-home {
  min-height: 100%;
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 32%),
    radial-gradient(circle at top right, rgba(236, 72, 153, 0.12), transparent 28%),
    linear-gradient(180deg, #f6f8fc 0%, #eef2f7 100%);
}

.hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  font-size: 12px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #2563eb;
}

.hero-copy {
  max-width: 760px;

  h1 {
    margin: 0 0 12px;
    font-size: 44px;
    line-height: 1.05;
    color: #0f172a;
  }
}

.hero-text {
  margin: 0;
  max-width: 620px;
  line-height: 1.7;
  font-size: 16px;
  color: #475569;
}

.settings-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 0;
  border-radius: 999px;
  background: #0f172a;
  color: #f8fafc;
  cursor: pointer;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.18);

  .settings-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
  }
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
}

@media (max-width: 960px) {
  .ai-home {
    padding: 20px;
  }

  .hero {
    flex-direction: column;
  }

  .hero-copy h1 {
    font-size: 34px;
  }
}
</style>
