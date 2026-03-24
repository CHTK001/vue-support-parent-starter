<template>
  <div class="console-viewer system-container modern-bg">
    <el-alert type="info" :closable="false" show-icon class="mb-2" title="提示：控制台由后端代理连接（HTTP/WS），前端仅展示" />
    <iframe v-if="url" :src="url" class="console-iframe" frameborder="0" />
    <div v-else class="tip">后端未提供控制台代理地址或连接尚未建立</div>
  </div>
</template>

<style scoped lang="scss">

.modern-bg {
  position: relative;
  overflow: hidden;

  // 渐变背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 30%,
        rgba(99, 102, 241, 0.08) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 70%,
        rgba(168, 85, 247, 0.06) 0%,
        transparent 50%
      );
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 1;
  }
}


.console-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.console-iframe {
  flex: 1;
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
}
.mb-2 {
  margin-bottom: 8px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
