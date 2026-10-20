<!--
  FvLoadingMask.vue — 非 file-viewer 自定义面板共用的加载动画。

  样式取自 @file-viewer/vue3 内置 loading-card（aura / orbit / scan / progress），
  让自定义预览面板在加载期间和 file-viewer 插件保持同一视觉语言。
-->
<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    /** 文件名（用于推导扩展名徽标；不传时显示 FILE） */
    fileName?: string;
    /** 自定义扩展名徽标 */
    extension?: string;
    /** 顶部小标签 */
    kicker?: string;
    /** 主标题 */
    title?: string;
    /** 副标题 */
    hint?: string;
  }>(),
  {
    fileName: "",
    extension: "",
    kicker: "",
    title: "正在解析文件内容...",
    hint: "正在解析文件结构与渲染结果。",
  },
);

const extLabel = computed(() => {
  if (props.extension) return props.extension.toUpperCase().slice(0, 6);
  const name = props.fileName || "";
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toUpperCase().slice(0, 6) : "FILE";
});

const kicker = computed(() => props.kicker || `${extLabel.value} 文件`);
</script>

<template>
  <div class="fv-loading-mask" data-testid="file-loading">
    <div class="fv-loading-mask__card">
      <div class="fv-loading-mask__visual" aria-hidden="true">
        <span class="fv-loading-mask__aura" />
        <span class="fv-loading-mask__orbit"><i /><i /></span>
        <div class="fv-loading-mask__icon">
          <svg
            class="fv-loading-mask__sheet"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.25"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M6 2h9l4 4v16H6z" />
            <path d="M15 2v4h4" />
          </svg>
          <svg
            class="fv-loading-mask__glyph"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.85"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 7l-4 5 4 5" />
            <path d="M16 7l4 5-4 5" />
          </svg>
          <span class="fv-loading-mask__extension">{{ extLabel }}</span>
          <span class="fv-loading-mask__scan" />
        </div>
      </div>
      <div class="fv-loading-mask__copy">
        <span class="fv-loading-mask__kicker">{{ kicker }}</span>
        <strong>{{ title }}</strong>
        <p>{{ hint }}</p>
        <span class="fv-loading-mask__progress" aria-hidden="true"><i /></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fv-loading-mask {
  --viewer-accent: #4f7ef7;
  --viewer-accent-secondary: #38bdf8;
  --viewer-glow: rgba(79, 126, 247, 0.35);
  --viewer-soft: rgba(79, 126, 247, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 100%;
  padding: 24px;
  box-sizing: border-box;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 248, 249, 0.98));
}
.fv-loading-mask__card {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 26px;
  width: min(100%, 500px);
  padding: 26px 28px;
  border: 1px solid rgba(32, 52, 72, 0.09);
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 28px 70px rgba(15, 31, 47, 0.13), 0 2px 8px rgba(15, 31, 47, 0.05);
}
.fv-loading-mask__card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 20%;
  right: 20%;
  z-index: 2;
  height: 2px;
  border-radius: 0 0 999px 999px;
  background: linear-gradient(90deg, transparent, var(--viewer-accent), var(--viewer-accent-secondary), transparent);
  box-shadow: 0 2px 14px var(--viewer-glow);
}
.fv-loading-mask__card::after {
  content: "";
  position: absolute;
  top: -92px;
  left: -76px;
  z-index: -1;
  width: 180px;
  height: 180px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--viewer-glow), transparent 68%);
  filter: blur(7px);
  opacity: 0.62;
}
.fv-loading-mask__visual {
  position: relative;
  display: grid;
  place-items: center;
  flex: 0 0 108px;
  width: 108px;
  height: 108px;
}
.fv-loading-mask__aura {
  position: absolute;
  inset: 13px;
  border-radius: 50%;
  background: radial-gradient(circle, var(--viewer-soft) 0 34%, transparent 70%);
  box-shadow: 0 0 28px var(--viewer-glow);
  animation: fv-loading-aura 2.8s ease-in-out infinite;
}
.fv-loading-mask__orbit {
  position: absolute;
  inset: 5px;
  border: 1px dashed color-mix(in srgb, var(--viewer-accent) 32%, transparent);
  border-radius: 50%;
  animation: fv-loading-orbit 9s linear infinite;
}
.fv-loading-mask__orbit i {
  position: absolute;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--viewer-accent-secondary);
  box-shadow: 0 0 10px var(--viewer-glow);
}
.fv-loading-mask__orbit i:first-child {
  top: 8px;
  right: 14px;
}
.fv-loading-mask__orbit i:last-child {
  width: 5px;
  height: 5px;
  bottom: 12px;
  left: 9px;
}
.fv-loading-mask__icon {
  position: relative;
  isolation: isolate;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 82px;
  color: var(--viewer-accent);
  filter: drop-shadow(0 12px 18px var(--viewer-glow));
  animation: fv-loading-float 2.8s ease-in-out infinite;
}
.fv-loading-mask__sheet {
  position: absolute;
  inset: 0;
  width: 72px;
  height: 82px;
  color: color-mix(in srgb, var(--viewer-accent) 43%, transparent);
  fill: color-mix(in srgb, var(--viewer-accent) 6%, white);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fv-loading-mask__glyph {
  position: absolute;
  top: 19px;
  width: 30px;
  height: 30px;
  color: var(--viewer-accent);
  stroke-linecap: round;
  stroke-linejoin: round;
}
.fv-loading-mask__extension {
  position: absolute;
  right: 10px;
  bottom: 12px;
  left: 10px;
  overflow: hidden;
  color: var(--viewer-accent);
  font-size: 9.5px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: 0.03em;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.fv-loading-mask__scan {
  position: absolute;
  top: 15px;
  right: 10px;
  left: 10px;
  z-index: 3;
  height: 1px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--viewer-accent-secondary), transparent);
  box-shadow: 0 0 8px var(--viewer-glow);
  opacity: 0;
  animation: fv-loading-scan 2.25s ease-in-out infinite;
}
.fv-loading-mask__copy {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}
.fv-loading-mask__kicker {
  display: block;
  color: var(--viewer-accent);
  font-size: 11px;
  font-weight: 750;
  letter-spacing: 0.105em;
  text-transform: uppercase;
}
.fv-loading-mask__copy strong {
  display: block;
  margin-top: 6px;
  color: #16283b;
  font-size: 20px;
  line-height: 1.2;
}
.fv-loading-mask__copy p {
  margin: 8px 0 0;
  color: #6a7d90;
  line-height: 1.6;
}
.fv-loading-mask__progress {
  position: relative;
  display: block;
  height: 3px;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--viewer-soft);
}
.fv-loading-mask__progress i {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: auto;
  width: 46%;
  border-radius: inherit;
  background: linear-gradient(90deg, transparent, var(--viewer-accent), var(--viewer-accent-secondary), transparent);
  box-shadow: 0 0 12px var(--viewer-glow);
  animation: fv-loading-progress 1.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes fv-loading-orbit {
  to {
    transform: rotate(360deg);
  }
}
@keyframes fv-loading-float {
  0%,
  100% {
    transform: translateY(2px) rotate(-1deg);
  }
  50% {
    transform: translateY(-4px) rotate(1deg);
  }
}
@keyframes fv-loading-aura {
  0%,
  100% {
    opacity: 0.58;
    transform: scale(0.9);
  }
  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}
@keyframes fv-loading-scan {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  18% {
    opacity: 0.95;
  }
  72% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(47px);
  }
}
@keyframes fv-loading-progress {
  0% {
    transform: translate(-110%);
  }
  100% {
    transform: translate(315%);
  }
}
</style>
