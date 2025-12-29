<script setup lang="ts">
/**
 * AI 聊天主题图标组件
 * @description 集中管理 6 套主题的 SVG 图标，减少代码重复
 */
defineProps<{
  /** 主题类型 */
  theme: 'default' | 'blue' | 'green' | 'orange' | 'pink' | 'dark';
  /** 图标用途：fab（悬浮按钮）, header（头部头像）, message（消息头像） */
  variant?: 'fab' | 'header' | 'message';
}>();
</script>

<template>
  <!-- 默认 - 经典机器人 -->
  <svg v-if="theme === 'default'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
    <circle cx="7.5" cy="14.5" r="1.5" fill="currentColor" />
    <circle cx="16.5" cy="14.5" r="1.5" fill="currentColor" />
  </svg>
  
  <!-- 蓝色 - R2D2 科技机器人 -->
  <svg v-else-if="theme === 'blue'" viewBox="0 0 24 24" fill="currentColor">
    <template v-if="variant === 'message'">
      <ellipse cx="12" cy="10" rx="5" ry="6" />
      <circle cx="12" cy="8" r="1.5" fill="#00c6fb" />
    </template>
    <template v-else-if="variant === 'header'">
      <ellipse cx="12" cy="8" rx="6" ry="7" />
      <rect x="8" y="14" width="8" height="8" rx="2" />
      <circle cx="12" cy="6" r="2" fill="#00c6fb" />
    </template>
    <template v-else>
      <ellipse cx="12" cy="8" rx="6" ry="7" />
      <rect x="8" y="14" width="8" height="8" rx="2" />
      <circle cx="12" cy="6" r="2" fill="#00c6fb" />
      <rect x="10" y="8" width="4" height="2" rx="1" fill="#005bea" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
      <rect x="6" y="16" width="2" height="4" rx="1" />
      <rect x="16" y="16" width="2" height="4" rx="1" />
    </template>
  </svg>
  
  <!-- 绿色 - 小恐龙 -->
  <svg v-else-if="theme === 'green'" viewBox="0 0 24 24" fill="currentColor">
    <template v-if="variant === 'message'">
      <circle cx="12" cy="12" r="10" />
      <circle cx="8" cy="10" r="1.5" fill="#fff" />
      <circle cx="16" cy="10" r="1.5" fill="#fff" />
    </template>
    <template v-else-if="variant === 'header'">
      <path d="M20 10c0-4-3-7-7-7-1 0-2 .2-3 .5C9 2 7 2 6 3c-1.5 1.5-1 4 0 5-2 1-3 3-3 5 0 4 4 8 9 8s9-4 9-8c0-1-.3-2-.8-3h-.2z" />
      <circle cx="9" cy="11" r="1.5" fill="#fff" />
      <circle cx="15" cy="11" r="1.5" fill="#fff" />
    </template>
    <template v-else>
      <path d="M20 10c0-4-3-7-7-7-1 0-2 .2-3 .5C9 2 7 2 6 3c-1.5 1.5-1 4 0 5-2 1-3 3-3 5 0 4 4 8 9 8s9-4 9-8c0-1-.3-2-.8-3h-.2z" />
      <circle cx="9" cy="11" r="2" fill="#fff" />
      <circle cx="15" cy="11" r="2" fill="#fff" />
      <circle cx="9.5" cy="11.5" r="1" fill="#333" />
      <circle cx="15.5" cy="11.5" r="1" fill="#333" />
      <path d="M10 16c0 0 1 1.5 2 1.5s2-1.5 2-1.5" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" />
      <path d="M4 5l2-2M6 4l-1 2M20 5l-2-2M18 4l1 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </template>
  </svg>
  
  <!-- 橙色 - 小狐狸 -->
  <svg v-else-if="theme === 'orange'" viewBox="0 0 24 24" fill="currentColor">
    <template v-if="variant === 'message'">
      <path d="M12 20c-3 0-6-2-6-5s2-4 2-4l-1-5 4 2c.5-.3 1-.3 1-.3h0c0 0 .5 0 1 .3l4-2-1 5s2 1 2 4-3 5-6 5z" />
    </template>
    <template v-else-if="variant === 'header'">
      <path d="M12 22c-4 0-8-3-8-7 0-2 1-4 2-5l-2-7 5 3c1-.5 2-.5 3-.5s2 0 3 .5l5-3-2 7c1 1 2 3 2 5 0 4-4 7-8 7z" />
      <circle cx="9" cy="14" r="1" fill="#fff" />
      <circle cx="15" cy="14" r="1" fill="#fff" />
    </template>
    <template v-else>
      <path d="M12 22c-4 0-8-3-8-7 0-2 1-4 2-5l-2-7 5 3c1-.5 2-.5 3-.5s2 0 3 .5l5-3-2 7c1 1 2 3 2 5 0 4-4 7-8 7z" />
      <path d="M4 10l2-7 3 4z" fill="#ff5e3a" />
      <path d="M20 10l-2-7-3 4z" fill="#ff5e3a" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
      <circle cx="9" cy="18" r="0.8" fill="#333" />
      <circle cx="15" cy="18" r="0.8" fill="#333" />
      <ellipse cx="12" cy="17" rx="1.5" ry="1" fill="#333" />
      <path d="M10.5 17.5c.5.5 1 .8 1.5.8s1-.3 1.5-.8" fill="none" stroke="#333" stroke-width="0.8" />
    </template>
  </svg>
  
  <!-- 粉色 - 史迪仔 -->
  <svg v-else-if="theme === 'pink'" viewBox="0 0 24 24" fill="currentColor">
    <template v-if="variant === 'message'">
      <ellipse cx="12" cy="12" rx="8" ry="7" />
      <ellipse cx="6" cy="6" rx="2" ry="4" transform="rotate(-15 6 6)" />
      <ellipse cx="18" cy="6" rx="2" ry="4" transform="rotate(15 18 6)" />
    </template>
    <template v-else-if="variant === 'header'">
      <ellipse cx="12" cy="14" rx="9" ry="8" />
      <ellipse cx="5" cy="6" rx="3" ry="5" transform="rotate(-20 5 6)" />
      <ellipse cx="19" cy="6" rx="3" ry="5" transform="rotate(20 19 6)" />
      <ellipse cx="8" cy="13" rx="2" ry="2.5" fill="#1a1a2e" />
      <ellipse cx="16" cy="13" rx="2" ry="2.5" fill="#1a1a2e" />
    </template>
    <template v-else>
      <ellipse cx="12" cy="14" rx="9" ry="8" />
      <ellipse cx="5" cy="6" rx="3" ry="5" transform="rotate(-20 5 6)" />
      <ellipse cx="19" cy="6" rx="3" ry="5" transform="rotate(20 19 6)" />
      <ellipse cx="5" cy="7" rx="1.5" ry="2.5" fill="#fff" />
      <ellipse cx="19" cy="7" rx="1.5" ry="2.5" fill="#fff" />
      <ellipse cx="8" cy="13" rx="2.5" ry="3" fill="#1a1a2e" />
      <ellipse cx="16" cy="13" rx="2.5" ry="3" fill="#1a1a2e" />
      <circle cx="7.5" cy="12.5" r="1" fill="#fff" />
      <circle cx="15.5" cy="12.5" r="1" fill="#fff" />
      <ellipse cx="12" cy="17" rx="2" ry="1.2" fill="#2E75B6" />
      <path d="M10 18.5c.8.8 1.3 1 2 1s1.2-.2 2-1" fill="none" stroke="#fff" stroke-width="0.8" />
      <circle cx="6" cy="17" r="1.5" fill="#ffc0cb" opacity="0.6" />
      <circle cx="18" cy="17" r="1.5" fill="#ffc0cb" opacity="0.6" />
    </template>
  </svg>
  
  <!-- 暗黑 - 赛博朋克 -->
  <svg v-else-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <template v-if="variant === 'message'">
      <rect x="6" y="6" width="12" height="10" rx="2" fill="#1a1a2e" stroke="#00ff88" />
      <rect x="8" y="10" width="2" height="2" fill="#00ff88" stroke="none" />
      <rect x="14" y="10" width="2" height="2" fill="#ff0055" stroke="none" />
    </template>
    <template v-else-if="variant === 'header'">
      <rect x="5" y="6" width="14" height="12" rx="2" fill="#1a1a2e" stroke="#00ff88" />
      <rect x="7" y="11" width="3" height="2" fill="#00ff88" stroke="none" />
      <rect x="14" y="11" width="3" height="2" fill="#ff0055" stroke="none" />
    </template>
    <template v-else>
      <rect x="5" y="6" width="14" height="12" rx="2" fill="#1a1a2e" />
      <line x1="5" y1="10" x2="19" y2="10" stroke="#00ff88" />
      <line x1="5" y1="14" x2="19" y2="14" stroke="#00ff88" opacity="0.5" />
      <rect x="7" y="12" width="3" height="2" fill="#00ff88" />
      <rect x="14" y="12" width="3" height="2" fill="#ff0055" />
      <path d="M12 2v4M8 3l1 3M16 3l-1 3" stroke="#00ff88" />
      <rect x="9" y="18" width="6" height="3" fill="#1a1a2e" />
      <line x1="10" y1="19" x2="14" y2="19" stroke="#00ff88" />
      <line x1="10" y1="20" x2="14" y2="20" stroke="#ff0055" opacity="0.5" />
    </template>
  </svg>
</template>
