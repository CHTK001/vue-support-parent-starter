<template>
  <div class="message-skeleton">
    <!-- 模拟交错排列的消息：奇数索引为用户消息，偶数索引为 AI 消息 -->
    <template v-for="i in (count || 3)" :key="i">
      <!-- 用户消息（奇数） -->
      <div v-if="i % 2 === 1" class="skeleton-item skeleton-item--user">
        <div class="skeleton-wrapper">
          <div class="skeleton-content skeleton-content--user">
            <div class="skeleton-line skeleton-line--short"></div>
            <div class="skeleton-line skeleton-line--medium"></div>
          </div>
        </div>
      </div>

      <!-- AI 消息（偶数） -->
      <div v-else class="skeleton-item skeleton-item--assistant">
        <div class="skeleton-wrapper">
          <!-- 模型名称行：头像 + 名称 -->
          <div class="skeleton-meta">
            <div class="skeleton-avatar"></div>
            <div class="skeleton-line skeleton-line--meta"></div>
          </div>
          <!-- 消息内容区 -->
          <div class="skeleton-content">
            <div class="skeleton-line skeleton-line--long"></div>
            <div class="skeleton-line"></div>
            <div class="skeleton-line skeleton-line--medium"></div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  count?: number;
}>();
</script>

<style scoped>
.message-skeleton {
  padding: 16px 0;
}

/* 消息项基础样式，对齐 MessageItem */
.skeleton-item {
  display: flex;
  width: 100%;
  margin-top: 20px;
  margin-bottom: 25px;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* AI 消息布局 */
.skeleton-item--assistant {
  justify-content: flex-start;
}

/* 用户消息布局（右对齐） */
.skeleton-item--user {
  justify-content: flex-end;
}

/* 内容包装器 */
.skeleton-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.skeleton-item--user .skeleton-wrapper {
  align-items: flex-end;
}

/* 元信息行（模型名称 + 头像） */
.skeleton-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

/* 头像占位（仅 AI 消息有，22px 对齐 Avatar 组件） */
.skeleton-avatar {
  width: 22px;
  height: 22px;
  /* 原值 6px → sm 档 */
  border-radius: var(--el-radius-sm, 6px);
  background-color: color-mix(in srgb, var(--el-text-color-primary) 10%, var(--el-bg-color));
  flex-shrink: 0;
}

/* 消息内容区 */
.skeleton-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 85%;
}

/* 用户消息内容区（右对齐，宽度更窄） */
.skeleton-content--user {
  align-items: flex-end;
  width: 50%;
}

/* 占位线条 */
.skeleton-line {
  height: 16px;
  /* 原值 4px → xs 档 */
  border-radius: var(--el-radius-xs, 4px);
  background-color: color-mix(in srgb, var(--el-text-color-primary) 10%, var(--el-bg-color));
  width: 100%;
}

.skeleton-line--meta {
  width: 120px;
  height: 14px;
}

.skeleton-line--short {
  width: 60%;
}

.skeleton-line--medium {
  width: 80%;
}

.skeleton-line--long {
  width: 100%;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}

/* 动效降级：系统开启「减少动态效果」时，骨架屏停止明暗呼吸。
   为什么必须显式写 opacity: 1：这条 pulse 是 opacity 1 → 0.5 的无限循环，
   直接删掉 animation 会让元素回到「未声明 opacity」的默认值 —— 恰好也是 1，
   但那是隐式依赖。这里显式钉死成 1，让「正在加载」在停掉动画后
   仍由那几根灰色占位条表达出来，而不是变成一片空白让人以为卡死。 */
@media (prefers-reduced-motion: reduce) {
  .skeleton-item {
    opacity: 1;
    animation: none;
  }
}
</style>
