<template>
  <svg class="w-full h-full">
    <defs>
      <symbol id="geometry-left" viewBox="0 0 214 36">
        <path d="M17 0h197v36H0v-2c4.5 0 9-3.5 9-8V8c0-4.5 3.5-8 8-8z" fill="currentColor" />
      </symbol>
      <symbol id="geometry-right" viewBox="0 0 214 36">
        <use xlink:href="#geometry-left" />
      </symbol>
      <clipPath>
        <rect width="100%" height="100%" x="0" />
      </clipPath>
    </defs>
    <svg width="51%" height="100%">
      <use xlink:href="#geometry-left" width="214" height="36" />
    </svg>
    <g transform="scale(-1, 1)">
      <svg width="51%" height="100%" x="-100%" y="0">
        <use xlink:href="#geometry-right" width="214" height="36" />
      </svg>
    </g>
  </svg>
</template>

<style lang="scss" scoped>
// Chrome标签页基础样式
.chrome-tab {
  position: relative;
  display: inline-flex;
  gap: 16px;
  align-items: center;
  justify-content: center;
  padding: 6px 24px;
  white-space: nowrap;
  cursor: pointer;
  
  .tag-title {
    padding: 0;
    color: var(--cb-color-text-primary);
  }

  .chrome-tab-divider {
    position: absolute;
    right: 7px;
    width: 1px;
    height: 14px;
    background-color: var(--cb-color-border-chrome-tab);
  }

  &:hover {
    z-index: 10;

    .chrome-tab-divider {
      opacity: 0;
    }
  }

  .chrome-tab__bg {
    position: absolute;
    top: 0;
    left: 0;
    z-index: -10;
    width: 100%;
    height: 100%;
    color: transparent;
    pointer-events: none;
  }

  .chrome-close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    color: var(--cb-color-text-primary);
    border-radius: 50%;

    &:hover {
      color: var(--cb-color-text-primary);
      background-color: var(--cb-color-bg-chrome-close-hover);
    }
  }
  
  // 激活状态的Chrome标签页
  &.is-active {
    .tag-title {
      color: #fff !important;
    }
    
    .chrome-tab__bg {
      color: var(--el-color-primary) !important;
    }
    
    // 激活状态悬停时不改变背景色
    &:hover {
      .chrome-tab__bg {
        color: var(--el-color-primary) !important;
      }
      
      .tag-title {
        color: #fff !important;
      }
    }
  }
}

/* 确保SVG在不同主题下正确显示 */
.chrome-tab {
  svg {
    fill: currentColor;
    color: currentColor;
  }
  
  path {
    fill: currentColor;
    color: currentColor;
  }
  
  use {
    color: currentColor;
    fill: currentColor;
  }
}

/* 深色主题下的特殊处理 */
html.dark {
  .chrome-tab {
    svg {
      color: currentColor;
      fill: currentColor;
    }
    
    path {
      color: currentColor;
      fill: currentColor;
    }
    
    use {
      color: currentColor;
      fill: currentColor;
    }
  }
}
</style>