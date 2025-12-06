<template>
  <div class="sc-container-example">
    <!-- 配置面板 -->
    <div class="config-panel">
      <div class="config-header">
        <IconifyIconOnline icon="ri:settings-3-line" />
        <span>动态配置</span>
      </div>
      <div class="config-body">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="config-item">
              <label>容器高度</label>
              <el-slider v-model="config.height" :min="200" :max="600" :step="10" show-input />
            </div>
          </el-col>
          <el-col :span="6">
            <div class="config-item">
              <label>侧边栏宽度</label>
              <el-slider v-model="config.asideWidth" :min="100" :max="300" :step="10" show-input />
            </div>
          </el-col>
          <el-col :span="6">
            <div class="config-item">
              <label>右侧栏宽度</label>
              <el-slider v-model="config.rightWidth" :min="100" :max="300" :step="10" show-input />
            </div>
          </el-col>
          <el-col :span="6">
            <div class="config-item">
              <label>头部高度</label>
              <el-slider v-model="config.headerHeight" :min="40" :max="100" :step="5" show-input />
            </div>
          </el-col>
        </el-row>
        <el-row :gutter="20" class="mt-4">
          <el-col :span="4">
            <el-checkbox v-model="config.showHeader">显示头部</el-checkbox>
          </el-col>
          <el-col :span="4">
            <el-checkbox v-model="config.showAside">显示侧边栏</el-checkbox>
          </el-col>
          <el-col :span="4">
            <el-checkbox v-model="config.showRight">显示右侧栏</el-checkbox>
          </el-col>
          <el-col :span="4">
            <el-checkbox v-model="config.showFooter">显示底部</el-checkbox>
          </el-col>
          <el-col :span="4">
            <el-checkbox v-model="config.border">显示边框</el-checkbox>
          </el-col>
          <el-col :span="4">
            <el-checkbox v-model="config.rounded">圆角</el-checkbox>
          </el-col>
        </el-row>
      </div>
    </div>

    <!-- 动态布局预览 -->
    <div class="demo-section">
      <h4>
        <IconifyIconOnline icon="ri:layout-masonry-line" />
        动态布局预览
        <span class="hint">拖拽分隔线调整区域大小</span>
      </h4>
      <div class="demo-container interactive">
        <ScContainer
          :height="config.height"
          :border="config.border"
          :rounded="config.rounded"
          :aside-width="`${config.asideWidth}px`"
          :right-width="`${config.rightWidth}px`"
          :header-height="`${config.headerHeight}px`"
          shadow
        >
          <template v-if="config.showHeader" #header>
            <div class="demo-header">
              <IconifyIconOnline icon="ri:layout-top-line" />
              Header ({{ config.headerHeight }}px)
            </div>
          </template>
          <template v-if="config.showAside" #aside>
            <div 
              class="demo-aside resizable"
              @mousedown="startResize('aside', $event)"
            >
              <IconifyIconOnline icon="ri:layout-left-line" />
              <span>Aside</span>
              <span class="size-label">{{ config.asideWidth }}px</span>
              <div class="resize-handle right"></div>
            </div>
          </template>
          <div class="demo-main">
            <div class="main-content">
              <IconifyIconOnline icon="ri:layout-grid-line" class="main-icon" />
              <div class="main-text">主内容区域</div>
              <div class="main-hint">自适应剩余空间</div>
            </div>
          </div>
          <template v-if="config.showRight" #right>
            <div 
              class="demo-right resizable"
              @mousedown="startResize('right', $event)"
            >
              <div class="resize-handle left"></div>
              <IconifyIconOnline icon="ri:layout-right-line" />
              <span>Right</span>
              <span class="size-label">{{ config.rightWidth }}px</span>
            </div>
          </template>
          <template v-if="config.showFooter" #footer>
            <div class="demo-footer">
              <IconifyIconOnline icon="ri:layout-bottom-line" />
              Footer
            </div>
          </template>
        </ScContainer>
      </div>
    </div>

    <!-- 预设布局 -->
    <div class="demo-section">
      <h4>
        <IconifyIconOnline icon="ri:dashboard-line" />
        预设布局模板
      </h4>
      <div class="preset-grid">
        <div 
          v-for="preset in presets" 
          :key="preset.name"
          class="preset-card"
          :class="{ active: currentPreset === preset.name }"
          @click="applyPreset(preset)"
        >
          <div class="preset-preview">
            <div v-if="preset.showHeader" class="p-header"></div>
            <div class="p-body">
              <div v-if="preset.showAside" class="p-aside"></div>
              <div class="p-main"></div>
              <div v-if="preset.showRight" class="p-right"></div>
            </div>
            <div v-if="preset.showFooter" class="p-footer"></div>
          </div>
          <div class="preset-name">{{ preset.label }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * ScContainer 布局容器示例
 * @author CH
 * @version 2.0.0
 * @since 2025-12-05
 */
import { ref, reactive } from "vue";
import { ScContainer } from "@repo/components/ScContainer";

const config = reactive({
  height: 400,
  asideWidth: 200,
  rightWidth: 200,
  headerHeight: 60,
  showHeader: true,
  showAside: true,
  showRight: false,
  showFooter: true,
  border: true,
  rounded: true,
});

const currentPreset = ref("standard");

const presets = [
  {
    name: "standard",
    label: "标准布局",
    showHeader: true,
    showAside: true,
    showRight: false,
    showFooter: true,
    asideWidth: 200,
    rightWidth: 200,
  },
  {
    name: "double",
    label: "双侧栏",
    showHeader: true,
    showAside: true,
    showRight: true,
    showFooter: true,
    asideWidth: 180,
    rightWidth: 180,
  },
  {
    name: "simple",
    label: "简洁布局",
    showHeader: true,
    showAside: false,
    showRight: false,
    showFooter: false,
    asideWidth: 200,
    rightWidth: 200,
  },
  {
    name: "sidebar",
    label: "侧边菜单",
    showHeader: false,
    showAside: true,
    showRight: false,
    showFooter: false,
    asideWidth: 240,
    rightWidth: 200,
  },
  {
    name: "dashboard",
    label: "仪表盘",
    showHeader: true,
    showAside: true,
    showRight: true,
    showFooter: false,
    asideWidth: 60,
    rightWidth: 280,
  },
];

function applyPreset(preset) {
  currentPreset.value = preset.name;
  config.showHeader = preset.showHeader;
  config.showAside = preset.showAside;
  config.showRight = preset.showRight;
  config.showFooter = preset.showFooter;
  config.asideWidth = preset.asideWidth;
  config.rightWidth = preset.rightWidth;
}

// 拖拽调整大小
let resizing = ref(null);
let startX = 0;
let startWidth = 0;

function startResize(type, event) {
  resizing.value = type;
  startX = event.clientX;
  startWidth = type === "aside" ? config.asideWidth : config.rightWidth;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
}

function onResize(event) {
  if (!resizing.value) return;
  const diff = event.clientX - startX;
  const newWidth = resizing.value === "aside" 
    ? Math.max(100, Math.min(300, startWidth + diff))
    : Math.max(100, Math.min(300, startWidth - diff));
  
  if (resizing.value === "aside") {
    config.asideWidth = newWidth;
  } else {
    config.rightWidth = newWidth;
  }
}

function stopResize() {
  resizing.value = null;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  document.body.style.cursor = "";
  document.body.style.userSelect = "";
}
</script>

<style lang="scss" scoped>
.sc-container-example {
  padding: 24px;
}

.config-panel {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color-light);
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  
  .config-header {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 16px 20px;
    background: var(--el-fill-color-light);
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    
    svg {
      font-size: 18px;
      color: var(--el-color-primary);
    }
  }
  
  .config-body {
    padding: 20px;
  }
  
  .config-item {
    label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--el-text-color-secondary);
    }
  }
}

.demo-section {
  margin-bottom: 32px;
  
  h4 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 16px;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    
    svg {
      color: var(--el-color-primary);
    }
    
    .hint {
      margin-left: auto;
      font-size: 12px;
      font-weight: 400;
      color: var(--el-text-color-placeholder);
    }
  }
}

.demo-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  
  &.interactive {
    background: var(--el-fill-color-lighter);
  }
}

.demo-header,
.demo-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, var(--el-color-primary-light-8), var(--el-color-primary-light-9));
  color: var(--el-color-primary);
  font-weight: 500;
  
  svg {
    font-size: 18px;
  }
}

.demo-aside,
.demo-right {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 100%;
  background: linear-gradient(180deg, var(--el-fill-color), var(--el-fill-color-light));
  color: var(--el-text-color-secondary);
  position: relative;
  transition: background 0.3s;
  
  svg {
    font-size: 20px;
    color: var(--el-color-primary-light-3);
  }
  
  .size-label {
    font-size: 11px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }
  
  &.resizable {
    cursor: default;
    
    &:hover {
      background: linear-gradient(180deg, var(--el-fill-color-light), var(--el-fill-color-lighter));
      
      .resize-handle {
        opacity: 1;
      }
    }
  }
  
  .resize-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 6px;
    background: var(--el-color-primary);
    opacity: 0;
    cursor: col-resize;
    transition: opacity 0.2s;
    
    &:hover {
      opacity: 1 !important;
    }
    
    &.right {
      right: 0;
    }
    
    &.left {
      left: 0;
    }
  }
}

.demo-main {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--el-bg-color);
  
  .main-content {
    text-align: center;
  }
  
  .main-icon {
    font-size: 48px;
    color: var(--el-color-primary-light-5);
    margin-bottom: 12px;
  }
  
  .main-text {
    font-size: 16px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
  
  .main-hint {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    margin-top: 4px;
  }
}

// 预设布局网格
.preset-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.preset-card {
  padding: 16px;
  background: var(--el-bg-color-overlay);
  border: 2px solid var(--el-border-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  
  &:hover {
    border-color: var(--el-color-primary-light-5);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  }
  
  &.active {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
  
  .preset-preview {
    height: 80px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    background: var(--el-fill-color-lighter);
    
    .p-header {
      height: 12px;
      background: var(--el-color-primary-light-7);
    }
    
    .p-body {
      flex: 1;
      display: flex;
    }
    
    .p-aside {
      width: 20px;
      background: var(--el-fill-color);
    }
    
    .p-main {
      flex: 1;
      background: var(--el-bg-color);
    }
    
    .p-right {
      width: 20px;
      background: var(--el-fill-color);
    }
    
    .p-footer {
      height: 8px;
      background: var(--el-color-primary-light-8);
    }
  }
  
  .preset-name {
    text-align: center;
    margin-top: 10px;
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.mt-4 {
  margin-top: 16px;
}
</style>
