<template>
  <div class="draggable-layout h-full">
    <div class="draggable-layout-inner">
      <div class="widgets-item empty">
        <div class="widget-content h-full widget-placeholder">
          <span class="placeholder-text">当前布局不再支持拖拽配置</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.draggable-layout {
  width: 100%;
  height: 100%;
}

.draggable-layout-inner {
  position: relative;
  width: 100%;
  height: 100%;
}

.widgets-item.empty {
  position: relative;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: var(--el-bg-color);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-content {
  border-radius: 12px;
  overflow: hidden;
}

.widget-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: linear-gradient(
    135deg,
    var(--el-fill-color-light),
    var(--el-fill-color)
  );
  gap: 12px;

  [data-theme="glass"] & {
    background: transparent;
  }

  .placeholder-text {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    font-weight: 500;
  }
}
</style>