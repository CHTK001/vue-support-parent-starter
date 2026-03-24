<script setup lang="ts">
withDefaults(
  defineProps<{
    /**
     * 展示场景
     * - fab：右下角悬浮入口
     * - header：聊天窗口头部
     * - message：消息头像
     */
    variant?: "fab" | "header" | "message";
    /** 尺寸（像素） */
    size?: number;
  }>(),
  {
    variant: "fab",
    size: 52,
  },
);
</script>

<template>
  <div class="lay-ai-appearance-robot" :class="`variant-${variant}`">
    <div class="robot-shell" :style="{ width: `${size}px`, height: `${size}px` }">
      <svg
        class="robot-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path
          d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"
        />
        <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" />
        <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.lay-ai-appearance-robot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.robot-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);
}

.robot-icon {
  width: 56%;
  height: 56%;
}
</style>


