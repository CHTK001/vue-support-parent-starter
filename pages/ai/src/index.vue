<template>
  <section class="ai-home">
    <div class="ai-home__shell">
      <div class="ai-home__glow ai-home__glow--primary" />
      <div class="ai-home__glow ai-home__glow--purple" />
      <div class="ai-home__glow ai-home__glow--accent" />

      <div class="ai-home__panel">
        <div class="ai-home__header">
          <div class="ai-home__brand">
            <span class="ai-home__brand-icon">
              <IconifyIconOnline icon="ri:sparkling-2-line" />
            </span>
            <div class="ai-home__brand-text">
              <h1>AI 工作台</h1>
              <p>选择功能开始智能创作</p>
            </div>
          </div>
          <div class="ai-home__header-actions">
            <div ref="dropdownRef" class="ai-home__dropdown">
              <button class="ai-home__settings ai-home__settings--face" :class="{ 'is-active': dropdownOpen }" type="button" @click="toggleDropdown">
                <IconifyIconOnline icon="ri:user-smile-line" />
                <span>识别库</span>
                <IconifyIconOnline icon="ri:arrow-down-s-line" class="ai-home__dropdown-arrow" :class="{ 'is-open': dropdownOpen }" />
              </button>
              <Transition name="ai-dropdown">
                <div v-if="dropdownOpen" class="ai-home__dropdown-menu">
                  <button class="ai-home__dropdown-item" @click="navigateTo('/ai/image-library')">
                    <span class="ai-home__dropdown-item-icon">
                      <IconifyIconOnline icon="ri:image-line" />
                    </span>
                    <span class="ai-home__dropdown-item-text">
                      <span class="ai-home__dropdown-item-label">图像库</span>
                      <span class="ai-home__dropdown-item-desc">以图搜图、图片特征管理</span>
                    </span>
                  </button>
                  <div class="ai-home__dropdown-divider" />
                  <button class="ai-home__dropdown-item" @click="navigateTo('/ai/ocr')">
                    <span class="ai-home__dropdown-item-icon">
                      <IconifyIconOnline icon="ri:scan-line" />
                    </span>
                    <span class="ai-home__dropdown-item-text">
                      <span class="ai-home__dropdown-item-label">OCR库</span>
                      <span class="ai-home__dropdown-item-desc">文字识别、图片文字提取</span>
                    </span>
                  </button>
                  <div class="ai-home__dropdown-divider" />
                  <button class="ai-home__dropdown-item" @click="navigateTo('/ai/face-library')">
                    <span class="ai-home__dropdown-item-icon">
                      <IconifyIconOnline icon="ri:id-card-line" />
                    </span>
                    <span class="ai-home__dropdown-item-text">
                      <span class="ai-home__dropdown-item-label">人脸库</span>
                      <span class="ai-home__dropdown-item-desc">人脸注册、识别与管理</span>
                    </span>
                  </button>
                  <div class="ai-home__dropdown-divider" />
                  <button class="ai-home__dropdown-item" @click="navigateTo('/ai/knowledge-graph')">
                    <span class="ai-home__dropdown-item-icon">
                      <IconifyIconOnline icon="ri:file-search-line" />
                    </span>
                    <span class="ai-home__dropdown-item-text">
                      <span class="ai-home__dropdown-item-label">RAG 知识库</span>
                      <span class="ai-home__dropdown-item-desc">上传文档，智能问答</span>
                    </span>
                  </button>
                </div>
              </Transition>
            </div>
            <button class="ai-home__settings" type="button" @click="router.push('/ai/settings')">
              <IconifyIconOnline icon="ri:settings-3-line" />
              <span>控制台设置</span>
            </button>
          </div>
        </div>

        <div class="ai-home__grid">
          <div class="ai-home__grid-inner">
            <button
              v-for="item in cards"
              :key="item.path"
              class="ai-home__card"
              :class="`is-${item.tone}`"
              type="button"
              @click="router.push(item.path)"
            >
              <div class="ai-home__card-visual">
                <div v-if="item.previewEffect" class="ai-home__preview-split" :class="`is-${item.previewEffect}`">
                  <img class="ai-home__preview-image is-left" :src="item.previewImage" :alt="`${item.title}示意图`" />
                  <img class="ai-home__preview-image is-right" :src="item.previewImage" :alt="`${item.title}示意图`" />
                </div>
                <img v-else class="ai-home__preview-image" :src="item.previewImage" :alt="`${item.title}示意图`" />
                <span class="ai-home__icon">
                  <component :is="item.icon" />
                </span>
              </div>
              <div class="ai-home__card-body">
                <strong>{{ item.title }}</strong>
                <p>{{ item.question }}</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  Brush,
  Camera,
  ChatDotRound,
  MagicStick,
  Picture,
  Scissor,
  VideoPlay,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { IconifyIconOnline } from "@repo/components/IconifyIconOnline";
import chatPreview from "./assets/card-images/chat.svg?url";
import imageGenerationPreview from "./assets/card-images/image-generation.jpg";
import colorizationPreview from "./assets/card-images/colorization.jpg";
import videoGenerationPreview from "./assets/card-images/video-generation.jpg";
import resolutionEnhancementPreview from "./assets/card-images/resolution-enhancement.jpg";
import mattingSvgPreview from "./assets/card-images/matting.svg?url";
import faceDetectPreview from "./assets/card-images/face-detection.jpg";

const router = useRouter();
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value;
};

const navigateTo = (path: string) => {
  dropdownOpen.value = false;
  router.push(path);
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener("click", handleClickOutside);
});

const cards = [
  {
    title: "聊天",
    icon: ChatDotRound,
    path: "/ai/chat",
    tone: "ink",
    question: "要和模型开始一次实时对话吗？",
    previewImage: chatPreview,
  },
  {
    title: "文生图",
    icon: Picture,
    path: "/ai/image",
    tone: "sun",
    question: "根据提示词快速生成图片",
    previewImage: imageGenerationPreview,
  },
  {
    title: "图像上色",
    icon: Brush,
    path: "/ai/colorization",
    tone: "mint",
    question: "需要上色、修复或增强图片吗？",
    previewImage: colorizationPreview,
    previewEffect: "colorization",
  },
  {
    title: "视频生成",
    icon: VideoPlay,
    path: "/ai/video",
    tone: "night",
    question: "把创意直接生成视频任务",
    previewImage: videoGenerationPreview,
  },
  {
    title: "分辨率增强",
    icon: MagicStick,
    path: "/ai/resolution",
    tone: "silver",
    question: "图片不够清晰，一键超分增强",
    previewImage: resolutionEnhancementPreview,
    previewEffect: "resolution",
  },
  {
    title: "图像抠图",
    icon: Scissor,
    path: "/ai/matting",
    tone: "night",
    question: "一键去除背景，提取人物主体",
    previewImage: mattingSvgPreview,
  },
  {
    title: "人脸检测",
    icon: Camera,
    path: "/ai/face",
    tone: "coral",
    question: "快速检测识别图片中的人脸信息",
    previewImage: faceDetectPreview,
  },
];
</script>

<style scoped lang="scss">
.ai-home {
  width: 100%;
  min-height: 100%;
  height: 100vh;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  overflow: hidden;
  border: none;
  background: transparent;
}

.ai-home__shell {
  position: relative;
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  box-shadow: none;
}

.ai-home__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
  opacity: 0;
}

.ai-home__glow--primary {
  top: -60px;
  left: 10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.12), transparent 70%);
}

.ai-home__glow--purple {
  bottom: -80px;
  right: 15%;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(var(--el-color-primary-rgb), 0.08), transparent 70%);
  filter: blur(100px);
}

.ai-home__glow--accent {
  top: 40%;
  left: 50%;
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, rgba(var(--el-color-success-rgb), 0.06), transparent 70%);
  transform: translate(-50%, -50%);
}

.ai-home__panel {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  border: none;
  border-radius: 32px;
  background: transparent;
  backdrop-filter: none;
  box-shadow: none;
}

/* ── Header ── */
.ai-home__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  margin-bottom: 16px;
}

.ai-home__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ai-home__brand-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-color-primary) 15%, transparent);
  color: var(--el-color-primary);
  font-size: 22px;
}

.ai-home__brand-text {
  h1 {
    margin: 0;
    font-size: 20px;
    font-weight: 700;
    color: var(--el-text-color-primary);
    letter-spacing: -0.01em;
  }

  p {
    margin: 2px 0 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
}

.ai-home__settings {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 999px;
  background: color-mix(in srgb, var(--el-color-danger) 14%, var(--el-bg-color));
  color: color-mix(in srgb, var(--el-color-danger) 72%, var(--el-text-color-primary));
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--el-color-danger) 20%, var(--el-bg-color));
    border-color: color-mix(in srgb, var(--el-color-danger) 35%, var(--el-border-color-light));
    color: color-mix(in srgb, var(--el-color-danger) 82%, var(--el-text-color-primary));
  }

  :deep(.iconify) {
    font-size: 16px;
  }
}

.ai-home__header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ai-home__settings--face {
  background: color-mix(in srgb, #10b981 14%, var(--el-bg-color));
  color: color-mix(in srgb, #10b981 72%, var(--el-text-color-primary));
  border-color: color-mix(in srgb, #10b981 30%, transparent);
  &:hover,
  &.is-active {
    background: color-mix(in srgb, #10b981 20%, var(--el-bg-color));
    border-color: #10b981;
    color: #10b981;
  }
}

.ai-home__dropdown-arrow {
  font-size: 14px;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-home__dropdown-arrow.is-open {
  transform: rotate(180deg);
}

/* ── Custom dropdown ── */
.ai-home__dropdown {
  position: relative;
}

.ai-home__dropdown-menu {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 210px;
  padding: 6px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 14px;
  background: color-mix(in srgb, var(--el-bg-color) 85%, transparent);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.10),
    0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 100;
  transform-origin: top right;
}

.ai-home__dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--el-text-color-regular);
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;

  &:hover {
    background: color-mix(in srgb, #10b981 10%, var(--el-fill-color));
    color: #10b981;
  }

  &:active {
    transform: scale(0.98);
  }
}

.ai-home__dropdown-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border-radius: 10px;
  background: color-mix(in srgb, #10b981 12%, transparent);
  color: #10b981;
  font-size: 17px;
}

.ai-home__dropdown-item-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.ai-home__dropdown-item-label {
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.3;
}

.ai-home__dropdown-item-desc {
  font-size: 11.5px;
  color: var(--el-text-color-placeholder);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ai-home__dropdown-divider {
  height: 1px;
  margin: 4px 10px;
  background: var(--el-border-color-lighter);
}

/* Dropdown transition */
.ai-dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-dropdown-leave-active {
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
}

.ai-dropdown-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.96);
}

.ai-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.97);
}

/* ── Grid ── */
.ai-home__grid {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;

  &::before {
    content: "";
    flex: 1;
  }

  &::after {
    content: "";
    flex: 2;
  }
}

.ai-home__grid-inner {
  display: flex;
  flex-wrap: nowrap;
  gap: 12px;
  align-items: stretch;
}

/* ── Card ── */
.ai-home__card {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  max-height: 264px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 20px;
  background: var(--el-fill-color-lighter);
  text-align: left;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent 50%);
    pointer-events: none;
  }

  &:hover {
    transform: translateY(-6px);
    border-color: var(--el-border-color);

    .ai-home__card-glow {
      opacity: 1;
    }

    .ai-home__icon {
      transform: scale(1.1);
    }
  }

  &:active {
    transform: translateY(-3px);
  }
}

/* Card visual area */
.ai-home__card-visual {
  position: relative;
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 0;
  height: 110px;
  overflow: hidden;
  flex-shrink: 0;
}

.ai-home__preview-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ai-home__preview-split {
  position: absolute;
  inset: 0;
}

.ai-home__preview-split .ai-home__preview-image.is-left {
  clip-path: inset(0 50% 0 0);
}

.ai-home__preview-split .ai-home__preview-image.is-right {
  clip-path: inset(0 0 0 50%);
}

.ai-home__preview-split.is-colorization .ai-home__preview-image.is-left {
  filter: grayscale(1);
}

.ai-home__preview-split.is-resolution .ai-home__preview-image.is-left {
  filter: saturate(0.45) contrast(0.8) blur(0.6px);
}

.ai-home__preview-split.is-resolution::after {
  content: "";
  position: absolute;
  inset: 0 50% 0 0;
  pointer-events: none;
  opacity: 0.35;
  background-image:
    linear-gradient(to right, rgba(15, 23, 42, 0.35), rgba(15, 23, 42, 0.2)),
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.08) 0 6px, rgba(0, 0, 0, 0.12) 6px 12px),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.08) 0 6px, rgba(0, 0, 0, 0.12) 6px 12px);
}

.ai-home__card-glow {
  position: absolute;
  inset: 0;
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.5), transparent 70%);
}

.ai-home__icon {
  position: relative;
  z-index: 2;
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.7);
  color: var(--el-text-color-regular);
  font-size: 21px;
  backdrop-filter: blur(4px);
  border: 1px solid var(--el-border-color-lighter);
  transition: transform 0.3s ease;

  :deep(svg) {
    width: 24px;
    height: 24px;
  }
}

.ai-home__card .ai-home__icon {
  position: absolute;
  top: 12px;
  right: 12px;
}

/* Card body */
.ai-home__card-body {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  flex: 0 0 auto;
  height: 96px;
  min-height: 96px;
  max-height: 96px;

  strong {
    display: block;
    color: var(--el-text-color-primary);
    font-size: 16px;
    font-weight: 700;
    line-height: 1.3;
  }

  p {
    margin: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
}

/* ── Tone variants ── */
.ai-home__card.is-ink {
  .ai-home__card-visual {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-primary) 16%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-primary) 8%, var(--el-bg-color)) 100%
    );
  }
  .ai-home__card-body {
    background: color-mix(in srgb, var(--el-color-primary) 7%, var(--el-bg-color));
  }
  .ai-home__icon {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  }
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, var(--el-border-color));
    box-shadow: 0 0 40px color-mix(in srgb, var(--el-color-primary) 8%, transparent), 0 20px 40px rgba(0, 0, 0, 0.06);
  }
}

.ai-home__card.is-sun {
  .ai-home__card-visual {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-warning) 18%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-warning) 10%, var(--el-bg-color)) 100%
    );
  }
  .ai-home__card-body {
    background: color-mix(in srgb, var(--el-color-warning) 7%, var(--el-bg-color));
  }
  .ai-home__icon {
    color: var(--el-color-warning);
    border-color: color-mix(in srgb, var(--el-color-warning) 20%, transparent);
  }
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-warning) 25%, var(--el-border-color));
    box-shadow: 0 0 40px color-mix(in srgb, var(--el-color-warning) 8%, transparent), 0 20px 40px rgba(0, 0, 0, 0.06);
  }
}

.ai-home__card.is-mint {
  .ai-home__card-visual {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-success) 18%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-success) 10%, var(--el-bg-color)) 100%
    );
  }
  .ai-home__card-body {
    background: color-mix(in srgb, var(--el-color-success) 7%, var(--el-bg-color));
  }
  .ai-home__icon {
    color: var(--el-color-success);
    border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent);
  }
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-success) 25%, var(--el-border-color));
    box-shadow: 0 0 40px color-mix(in srgb, var(--el-color-success) 8%, transparent), 0 20px 40px rgba(0, 0, 0, 0.06);
  }
}

.ai-home__card.is-night {
  .ai-home__card-visual {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-info) 18%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-primary) 12%, var(--el-bg-color)) 100%
    );
  }
  .ai-home__card-body {
    background: color-mix(in srgb, var(--el-color-info) 8%, var(--el-bg-color));
  }
  .ai-home__icon {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 20%, transparent);
  }
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 25%, var(--el-border-color));
    box-shadow: 0 0 40px color-mix(in srgb, var(--el-color-primary) 8%, transparent), 0 20px 40px rgba(0, 0, 0, 0.06);
  }
}

.ai-home__card.is-silver {
  .ai-home__card-visual {
    padding: 0;
    background:
      radial-gradient(circle at 20% 20%, color-mix(in srgb, var(--el-color-primary) 22%, transparent), transparent 55%),
      linear-gradient(
        135deg,
        color-mix(in srgb, var(--el-color-primary) 16%, var(--el-bg-color)) 0%,
        color-mix(in srgb, var(--el-color-info) 14%, var(--el-bg-color)) 100%
      );
  }
  .ai-home__preview-image {
    width: 100%;
    max-width: none;
    object-fit: cover;
  }
  .ai-home__icon {
    color: var(--el-color-primary);
    border-color: color-mix(in srgb, var(--el-color-primary) 24%, transparent);
    background: color-mix(in srgb, var(--el-bg-color) 78%, white);
  }
  .ai-home__card-body {
    background: linear-gradient(
      180deg,
      color-mix(in srgb, var(--el-color-primary) 9%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-info) 7%, var(--el-bg-color)) 100%
    );
  }
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-primary) 30%, var(--el-border-color));
    box-shadow: 0 0 42px color-mix(in srgb, var(--el-color-primary) 15%, transparent), 0 20px 40px rgba(6, 27, 58, 0.22);
  }
}

.ai-home__card.is-coral {
  .ai-home__card-visual {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--el-color-danger) 18%, var(--el-bg-color)) 0%,
      color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color)) 100%
    );
  }
  .ai-home__card-body {
    background: color-mix(in srgb, var(--el-color-danger) 10%, var(--el-bg-color));
  }
  .ai-home__icon {
    color: var(--el-color-danger);
    border-color: color-mix(in srgb, var(--el-color-danger) 20%, transparent);
  }
  &:hover {
    border-color: color-mix(in srgb, var(--el-color-danger) 25%, var(--el-border-color));
    box-shadow: 0 0 40px color-mix(in srgb, var(--el-color-danger) 10%, transparent), 0 20px 40px rgba(0, 0, 0, 0.06);
  }
}

/* ── Responsive ── */
@media (max-width: 1200px) {
  .ai-home__card {
    max-height: 240px;
  }
  .ai-home__card-visual {
    height: 90px;
  }
  .ai-home__card-body {
    height: 86px;
    min-height: 86px;
    max-height: 86px;
    padding: 10px 12px 14px;
    strong { font-size: 14px; }
    p { font-size: 12px; }
  }
  .ai-home__icon {
    width: 36px;
    height: 36px;
    font-size: 18px;
    :deep(svg) { width: 18px; height: 18px; }
  }
}

@media (max-width: 960px) {
  .ai-home__grid {
    flex-wrap: wrap;
  }
  .ai-home__card {
    flex: 0 0 calc((100% - 12px) / 2);
    max-height: 260px;
  }
}

@media (max-width: 640px) {
  .ai-home {
    padding: 10px;
  }

  .ai-home__panel {
    padding: 16px 18px;
    border-radius: 24px;
  }

  .ai-home__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .ai-home__grid {
    gap: 10px;
  }

  .ai-home__card {
    flex: 0 0 calc((100% - 10px) / 2);
  }

  .ai-home__card-visual {
    height: 90px;
  }

  .ai-home__icon {
    width: 38px;
    height: 38px;
    font-size: 20px;

    :deep(svg) {
      width: 20px;
      height: 20px;
    }
  }

  .ai-home__card-body {
    padding: 10px 12px 14px;
    height: 82px;
    min-height: 82px;
    max-height: 82px;

    strong {
      font-size: 14px;
    }

    p {
      font-size: 12px;
    }
  }
}
</style>
