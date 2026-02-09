<style scoped lang="scss">
@use "@/styles/mixins.scss" as *;
@use "@/styles/variables.scss" as *;

.sc-layer {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--el-bg-color);

  .map-container {
    width: 100%;
    height: 100%;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 1;
  }

  .toolbar-container {
    position: absolute;
    z-index: 1000;
    pointer-events: none;
    
    // 让工具栏内部的按钮可以点击
    :deep(*) {
      pointer-events: auto;
    }
  }

  .search-box {
    position: absolute;
    z-index: 1000;
  }
}
</style>
