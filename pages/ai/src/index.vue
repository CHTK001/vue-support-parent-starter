<template>
  <section class="ai-home">
    <div class="ai-home__shell">
      <div class="ai-home__glow ai-home__glow--left" />
      <div class="ai-home__glow ai-home__glow--right" />

      <div class="ai-home__panel">
      <div class="ai-home__toolbar">
        <button
          class="ai-home__settings"
          type="button"
          @click="router.push('/ai/settings')"
        >
          控制台设置
        </button>
      </div>

      <div class="ai-home__title-spacer" aria-hidden="true" />

        <div class="ai-home__grid">
          <button
            v-for="item in cards"
            :key="item.path"
            class="ai-home__card"
            :class="`is-${item.tone}`"
            type="button"
            @click="router.push(item.path)"
          >
            <div class="ai-home__card-visual">
              <div class="ai-home__cover" :style="{ backgroundImage: `url(${item.coverImage})` }" />
              <span class="ai-home__icon">
                <component :is="item.icon" />
              </span>
            </div>
            <div class="ai-home__card-body">
              <p>{{ item.question }}</p>
            </div>
          </button>
        </div>
    </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  Brush,
  ChatDotRound,
  MagicStick,
  Picture,
  VideoPlay,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";

const router = useRouter();

const cards = [
  {
    title: "聊天",
    icon: ChatDotRound,
    path: "/ai/chat",
    tone: "ink",
    question: "要和模型开始一次实时对话吗？",
    coverImage: "https://images.pexels.com/photos/30530411/pexels-photo-30530411.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
  {
    title: "文生图",
    icon: Picture,
    path: "/ai/image",
    tone: "sun",
    question: "现在要根据提示词快速生成图片吗？",
    coverImage: "https://unsplash.com/photos/218aYK5Zzsk/download?force=true&w=1400",
  },
  {
    title: "图像上色",
    icon: Brush,
    path: "/ai/colorization",
    tone: "mint",
    question: "这张图需要上色、修复或增强吗？",
    coverImage: "https://unsplash.com/photos/_y45Z5jRx8A/download?force=true&w=1400",
  },
  {
    title: "视频生成",
    icon: VideoPlay,
    path: "/ai/video",
    tone: "night",
    question: "要把创意直接生成视频任务吗？",
    coverImage: "https://unsplash.com/photos/hY07uZBVrGo/download?force=true&w=1400",
  },
  {
    title: "分辨率增强",
    icon: MagicStick,
    path: "/ai/resolution",
    tone: "silver",
    question: "图片不够清晰，想一键超分增强吗？",
    coverImage: "https://unsplash.com/photos/i1_xsS9fBRc/download?force=true&w=1400",
  },
];
</script>

<style scoped lang="scss">
.ai-home {
  width: 100%;
  min-height: 100%;
  height: 100%;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 12px;
  background:
    linear-gradient(180deg, #f5f1ea 0%, #ece4d8 100%);
}

.ai-home__shell {
  position: relative;
  width: 100%;
  height: 100%;
}

.ai-home__glow {
  position: absolute;
  inset: auto;
  border-radius: 999px;
  filter: blur(28px);
  opacity: 0.58;
  pointer-events: none;
}

.ai-home__glow--left {
  top: 48px;
  left: -36px;
  width: 180px;
  height: 180px;
  background: radial-gradient(circle, rgba(126, 101, 76, 0.22), transparent 70%);
}

.ai-home__glow--right {
  right: -22px;
  bottom: 40px;
  width: 220px;
  height: 220px;
  background: radial-gradient(circle, rgba(119, 149, 190, 0.18), transparent 72%);
}

.ai-home__panel {
  position: relative;
  z-index: 1;
  min-height: 100%;
  padding: 26px;
  border: 1px solid rgba(31, 26, 23, 0.08);
  border-radius: 36px;
  background: rgba(255, 251, 246, 0.62);
  backdrop-filter: blur(14px);
  box-shadow: 0 24px 72px rgba(49, 36, 24, 0.08);
}

.ai-home__toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 14px;
}

.ai-home__settings {
  height: 44px;
  padding: 0 18px;
  border: 1px solid rgba(31, 26, 23, 0.08);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #1f1a17;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(49, 36, 24, 0.06);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(31, 26, 23, 0.16);
    box-shadow: 0 18px 36px rgba(49, 36, 24, 0.12);
  }
}

.ai-home__title-spacer {
  height: 145px;
  margin-bottom: 28px;
}

.ai-home__grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 20px;
}

.ai-home__card {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  position: relative;
  overflow: hidden;
  padding: 0;
  border: 1px solid rgba(31, 26, 23, 0.06);
  border-radius: 30px;
  background: rgba(255, 251, 246, 0.92);
  box-shadow: 0 18px 34px rgba(49, 36, 24, 0.07);
  text-align: left;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.18), transparent 48%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(31, 26, 23, 0.16);
    box-shadow: 0 24px 48px rgba(49, 36, 24, 0.12);
  }
}

.ai-home__card-visual {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 220px;
  overflow: hidden;
}

.ai-home__cover {
  position: absolute;
  inset: 0;
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  background-color: rgba(226, 232, 240, 0.9);
}

.ai-home__cover::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.16), rgba(15, 23, 42, 0.06)),
    radial-gradient(circle, rgba(255, 255, 255, 0.2) 18%, transparent 20%) 0 0 / 20px 20px,
    radial-gradient(circle, rgba(255, 255, 255, 0.14) 16%, transparent 18%) 10px 10px / 20px 20px;
}

.ai-home__card-body {
  position: relative;
  z-index: 1;
  padding: 16px 18px 20px;
  display: grid;
  gap: 8px;
}

.ai-home__card-body p {
  margin: 0;
  color: #334155;
  font-size: 15px;
  line-height: 1.65;
  text-align: center;
}

.ai-home__icon {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 3;
  display: inline-flex;
  width: 52px;
  height: 52px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.78);
  color: #1f1a17;
  font-size: 20px;
  box-shadow:
    inset 0 0 0 1px rgba(31, 26, 23, 0.05),
    0 8px 18px rgba(15, 23, 42, 0.16);

  :deep(svg) {
    width: 20px;
    height: 20px;
  }
}

.ai-home__card.is-ink {
  background: linear-gradient(180deg, #f6efe9 0%, #eee2d7 100%);
}

.ai-home__card.is-sun {
  background: linear-gradient(180deg, #fbf1df 0%, #f2debf 100%);
}

.ai-home__card.is-mint {
  background: linear-gradient(180deg, #eff7f1 0%, #dbeee4 100%);
}

.ai-home__card.is-mint .ai-home__cover {
  isolation: isolate;
}

.ai-home__card.is-mint .ai-home__cover::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: inherit;
  background-size: inherit;
  background-position: inherit;
  background-repeat: inherit;
  filter: grayscale(1) contrast(1.02);
  clip-path: inset(0 50% 0 0);
  z-index: 1;
}

.ai-home__card.is-mint .ai-home__cover::after {
  background:
    linear-gradient(90deg, rgba(148, 163, 184, 0.2) 49.5%, rgba(255, 255, 255, 0.62) 50%, rgba(16, 185, 129, 0.14) 50.5%),
    linear-gradient(180deg, rgba(15, 23, 42, 0.14), rgba(15, 23, 42, 0.05)),
    radial-gradient(circle, rgba(255, 255, 255, 0.2) 18%, transparent 20%) 0 0 / 20px 20px,
    radial-gradient(circle, rgba(255, 255, 255, 0.14) 16%, transparent 18%) 10px 10px / 20px 20px;
  z-index: 2;
}


.ai-home__card.is-night {
  background: linear-gradient(180deg, #ececf6 0%, #dde1f0 100%);
}


.ai-home__card.is-silver {
  background: linear-gradient(180deg, #f7f7f4 0%, #ecece7 100%);
}


@media (max-width: 960px) {
  .ai-home__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .ai-home {
    padding: 20px 14px;
    height: auto;
  }

  .ai-home__title-spacer {
    height: 96px;
    margin-bottom: 18px;
  }

  .ai-home__grid {
    grid-template-columns: 1fr;
  }

  .ai-home__card {
    min-height: 240px;
    padding: 18px;
    border-radius: 22px;
  }

  .ai-home__panel {
    padding: 18px;
    border-radius: 26px;
  }
}
</style>
