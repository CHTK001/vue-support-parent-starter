<script setup lang="ts">
interface Props {
  /** 加载文案 */
  loadingText?: string;
  /**
   * 角色图片地址
   * 建议放在 Vite `public` 目录，示例：/mario-loading.png
   */
  characterImage?: string;
}

withDefaults(defineProps<Props>(), {
  loadingText: "马里奥采蘑菇中...",
  characterImage: "/mario-loading.png"
});
</script>

<template>
  <div class="cool-loading mc-loading">
    <div class="mario-scene">
      <div class="mario-sky">
        <div class="mario-cloud mario-cloud-left" />
        <div class="mario-cloud mario-cloud-right" />
      </div>
      <div class="mario-hills">
        <div class="mario-hill mario-hill-small" />
        <div class="mario-hill mario-hill-big" />
      </div>
      <div class="mario-ground">
        <div class="mario-brick-row">
          <div
            v-for="i in 6"
            :key="'brick-' + i"
            class="mario-brick"
          />
        </div>
        <div class="mario-block-row">
          <div class="mario-block mario-block-empty" />
          <div class="mario-block mario-block-question" />
          <div class="mario-block mario-block-empty" />
          <div class="mario-mushroom-track">
            <div class="mario-mushroom" />
          </div>
        </div>
        <div class="mario-ground-strip" />
        <div class="mario-mario-wrapper">
          <div class="mario-character">
            <img
              :src="characterImage"
              alt="马里奥加载中"
              class="mario-sprite"
            />
          </div>
        </div>
      </div>
    </div>
    <div class="mc-panel">
      <div class="mc-title">{{ loadingText }}</div>
      <div class="mc-bar">
        <div class="mc-bar-fill" />
      </div>
      <div class="mc-tip">马里奥采蘑菇加载中，请稍候…</div>
    </div>
  </div>
</template>

<style scoped>
.mc-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: radial-gradient(circle at top, #0b1020 0%, #020617 60%, #000 100%);
  color: #e5e7eb;
  padding: 16px;
}

.mario-scene {
  position: relative;
  width: 260px;
  height: 120px;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 10px 28px rgba(15, 23, 42, 0.95),
    0 0 0 1px rgba(15, 23, 42, 0.9);
}

.mario-sky {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, #38bdf8 0%, #60a5fa 60%, #9ca3af 100%);
}

.mario-cloud {
  position: absolute;
  width: 36px;
  height: 16px;
  background:
    radial-gradient(circle at 8px 8px, #f9fafb 0, #f9fafb 8px, transparent 9px),
    radial-gradient(circle at 16px 6px, #f9fafb 0, #f9fafb 8px, transparent 9px),
    radial-gradient(circle at 24px 8px, #f9fafb 0, #f9fafb 8px, transparent 9px);
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.8);
}

.mario-cloud-left {
  top: 16px;
  right: 80px;
}

.mario-cloud-right {
  top: 24px;
  right: 26px;
}

.mario-hills {
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: flex-start;
  gap: 8px;
  padding: 0 20px;
}

.mario-hill {
  width: 60px;
  height: 28px;
  border-radius: 60px 60px 0 0;
  background:
    repeating-linear-gradient(
      to right,
      #22c55e,
      #22c55e 4px,
      #16a34a 4px,
      #16a34a 8px
    );
  box-shadow:
    0 0 0 2px rgba(21, 128, 61, 0.9);
}

.mario-hill-small {
  transform: scale(0.8) translateY(6px);
}

.mario-hill-big {
  transform: translateY(2px);
}

.mario-ground {
  position: absolute;
  inset: auto 0 0;
  height: 64px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.mario-brick-row {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  height: 18px;
  padding: 0 10px;
}

.mario-brick {
  margin: 0 2px;
  background:
    linear-gradient(180deg, #b45309 0%, #78350f 100%);
  box-shadow:
    0 0 0 1px rgba(120, 53, 15, 0.9),
    inset 0 0 0 2px rgba(248, 250, 252, 0.06);
  image-rendering: pixelated;
}

.mario-block-row {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  padding: 0 32px;
  height: 26px;
}

.mario-block {
  width: 20px;
  height: 20px;
  background:
    linear-gradient(180deg, #facc15 0%, #f97316 100%);
  box-shadow:
    0 0 0 1px rgba(124, 45, 18, 0.9),
    inset 0 0 0 2px rgba(254, 249, 195, 0.8);
  position: relative;
  image-rendering: pixelated;
}

.mario-block-empty {
  background:
    linear-gradient(180deg, #e5e7eb 0%, #cbd5f5 100%);
  box-shadow:
    0 0 0 1px rgba(148, 163, 184, 0.9),
    inset 0 0 0 2px rgba(248, 250, 252, 0.8);
}

.mario-block-question::before {
  content: "?";
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #7c2d12;
}

.mario-mushroom-track {
  flex: 1;
  height: 18px;
  position: relative;
  overflow: hidden;
}

.mario-mushroom {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 14px;
  height: 14px;
  background:
    radial-gradient(circle at 7px 3px, #f97316 0, #f97316 6px, transparent 7px),
    radial-gradient(circle at 4px 4px, #fed7aa 0, #fed7aa 2px, transparent 3px),
    radial-gradient(circle at 10px 4px, #fed7aa 0, #fed7aa 2px, transparent 3px);
  border-radius: 4px 4px 0 0;
  box-shadow:
    0 0 0 1px rgba(124, 45, 18, 0.9);
  animation: mushroom-move 1.8s linear infinite;
}

.mario-ground-strip {
  height: 18px;
  margin-top: 2px;
  background:
    repeating-linear-gradient(
      to right,
      #92400e,
      #92400e 6px,
      #b45309 6px,
      #b45309 12px
    );
  box-shadow:
    0 0 0 2px rgba(120, 53, 15, 0.95),
    inset 0 4px 0 rgba(248, 250, 252, 0.1);
}

.mario-mario-wrapper {
  position: relative;
  height: 24px;
  margin-top: -18px;
  padding-left: 30px;
}

.mario-character {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  animation: mario-run 1.8s linear infinite;
}

.mario-sprite {
  width: 48px;
  height: 48px;
  object-fit: contain;
  image-rendering: auto;
}

.mc-panel {
  width: 260px;
  max-width: 90vw;
  padding: 10px 14px 12px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.95);
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(55, 65, 81, 0.9);
}

.mc-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.mc-bar {
  position: relative;
  width: 100%;
  height: 7px;
  border-radius: 0;
  overflow: hidden;
  background: #020617;
  box-shadow:
    inset 0 0 0 1px rgba(15, 23, 42, 0.9),
    0 0 0 1px rgba(15, 23, 42, 0.9);
}

.mc-bar-fill {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, #22c55e, #a3e635, #22c55e);
  transform-origin: left center;
  animation: bar-fill 1.6s ease-in-out infinite;
}

.mc-tip {
  margin-top: 6px;
  font-size: 12px;
  color: #9ca3af;
}

@keyframes mario-run {
  0% {
    transform: translateX(0) translateY(0);
  }
  100% {
    transform: translateX(50px) translateY(-1px);
  }
}

@keyframes bar-fill {
  0% {
    transform: scaleX(0.2);
  }
  50% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0.3);
  }
}

@keyframes mushroom-move {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(60px);
  }
}
</style>


