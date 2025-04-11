<template>
  <div class="load-example">
    <el-card>
      <template #header>
        <div class="card-header">
          <h3>加载组件 (ScLoading)</h3>
          <p class="text-secondary">一个灵活、高度可定制的加载组件，支持多种布局和进度显示</p>
        </div>
      </template>

      <!-- 预览区域 -->
      <div class="preview-area">
        <h4>组件预览</h4>
        <div class="preview-container" :class="{ fullscreen: isFullscreen }" :style="customContainerStyle">
          <el-button class="close-preview-btn" type="danger" circle size="small" @click="closeLoading" v-if="loadingVisible">
            <IconifyIconOnline icon="ep:close" />
          </el-button>

          <el-button class="fullscreen-btn" type="primary" circle size="small" @click="toggleFullscreen" v-if="loadingVisible">
            <IconifyIconOnline :icon="isFullscreen ? 'ep:close-bold' : 'ep:full-screen'" />
          </el-button>

          <div class="loading-area">
            <ScLoading ref="loadingRef" v-model="loadingVisible" :layout="selectedLayout" :show-number="showNumber" :show-loading="showLoadingText" :show-loading-label="loadingLabel" :auto-close-finished="autoCloseFinished" :border-radius="borderRadius" :style="customLoadingStyle" />
          </div>
        </div>
      </div>

      <!-- 配置面板 -->
      <div class="config-panel mt-4">
        <h4>配置选项</h4>
        <el-row :gutter="20">
          <!-- 布局和显示选项 -->
          <el-col :xs="24" :sm="12">
            <el-form label-position="top" size="default">
              <el-form-item label="布局类型">
                <el-select v-model="selectedLayout" class="w-100">
                  <el-option v-for="layout in layouts" :key="layout.value" :label="layout.label" :value="layout.value" />
                </el-select>
              </el-form-item>

              <el-form-item label="显示选项">
                <div class="display-options">
                  <el-switch v-model="showNumber" active-text="显示进度数字" />
                  <el-switch v-model="showLoadingText" active-text="显示加载文本" />
                  <el-switch v-model="autoCloseFinished" active-text="完成自动关闭" />
                </div>
              </el-form-item>

              <el-form-item label="加载文本" v-if="showLoadingText">
                <el-input v-model="loadingLabel" placeholder="请输入加载提示文本" />
              </el-form-item>
            </el-form>
          </el-col>

          <!-- 样式选项 -->
          <el-col :xs="24" :sm="12">
            <el-form label-position="top" size="default">
              <el-form-item label="背景颜色">
                <el-color-picker v-model="customBgColor" show-alpha class="w-100" />
              </el-form-item>

              <el-form-item label="进度条颜色">
                <el-color-picker v-model="customColor" class="w-100" />
              </el-form-item>

              <el-form-item label="圆角大小">
                <el-slider v-model="borderRadius" :min="0" :max="20" :step="1" show-stops />
              </el-form-item>
            </el-form>
          </el-col>
        </el-row>

        <!-- 进度控制 -->
        <div class="progress-control mt-4">
          <h4>进度控制</h4>
          <el-row :gutter="20">
            <el-col :span="16">
              <el-slider v-model="progress" :min="0" :max="100" :step="1" :show-tooltip="true" :format-tooltip="(value) => `${value}%`" @change="handleProgressChange" />
            </el-col>
            <el-col :span="8">
              <div class="action-buttons">
                <el-button-group>
                  <el-button type="primary" @click="showLoading">
                    <IconifyIconOnline icon="ep:view" />
                    <span>显示</span>
                  </el-button>
                  <el-button type="success" @click="simulateProgress">
                    <IconifyIconOnline icon="ep:video-play" />
                    <span>自动进度</span>
                  </el-button>
                  <el-button type="warning" @click="resetProgress">
                    <IconifyIconOnline icon="ep:refresh-right" />
                    <span>重置</span>
                  </el-button>
                  <el-button type="danger" @click="closeLoading">
                    <IconifyIconOnline icon="ep:close" />
                    <span>关闭</span>
                  </el-button>
                </el-button-group>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>

      <!-- 布局选择器 -->
      <div class="layout-selector mt-4">
        <h4>布局样式选择</h4>
        <p class="example-desc">点击卡片预览对应的布局样式</p>

        <div class="layout-grid">
          <div v-for="layout in layouts" :key="layout.value" class="layout-item" :class="{ active: selectedLayout === layout.value }" @click="previewLayout(layout.value)">
            <div class="layout-preview">
              <ScLoading :layout="layout.value" :model-value="true" :show-number="false" :show-loading="false" />
            </div>
            <div class="layout-name">
              {{ layout.label }}
              <el-tag v-if="selectedLayout === layout.value" size="small" effect="dark" type="success" class="active-tag">当前选中</el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 代码示例 -->
      <div class="code-example mt-4">
        <h4>代码示例</h4>
        <el-alert type="info" :closable="false" class="mb-3">
          <div class="code-desc">根据当前配置生成的代码示例</div>
        </el-alert>
        <pre><code class="language-html">{{ codeExample }}</code></pre>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from "vue";
import ScLoading from "@repo/components/ScLoading/index.vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";

// 加载组件引用
const loadingRef = ref(null);

// 显示状态
const loadingVisible = ref(false);
const isFullscreen = ref(false);

// 布局和显示选项
const selectedLayout = ref("default");
const showNumber = ref(true);
const showLoadingText = ref(true);
const loadingLabel = ref("加载中...");
const autoCloseFinished = ref(false);

// 样式选项
const customBgColor = ref("rgba(240, 240, 240, 0.9)");
const customColor = ref("#409EFF");
const borderRadius = ref(10);
const progress = ref(0);

// 自定义容器样式
const customContainerStyle = computed(() => {
  return {
    backgroundColor: customBgColor.value,
    borderRadius: `${borderRadius.value}px`,
  };
});

// 自定义加载样式
const customLoadingStyle = computed(() => {
  return {
    "--loading-color": customColor.value,
  };
});

// 布局列表
const layouts = [
  { label: "默认布局", value: "default" },
  { label: "旋转加载", value: "spining" },
  { label: "旋转加载2", value: "spining2" },
  { label: "条形加载", value: "banter" },
  { label: "吉米加载", value: "jimi" },
  { label: "盒子加载", value: "box" },
  { label: "铅笔加载", value: "pencil" },
  { label: "加载器", value: "loader" },
  { label: "加载器2", value: "loader2" },
  { label: "加载器3", value: "loader3" },
  { label: "加载器4", value: "loader4" },
  { label: "加载器5", value: "loader5" },
  { label: "加载器6", value: "loader6" },
];

// 显示加载
const showLoading = () => {
  loadingVisible.value = true;
};

// 关闭加载
const closeLoading = () => {
  loadingVisible.value = false;
};

// 处理进度变化
const handleProgressChange = (value) => {
  if (loadingRef.value) {
    loadingRef.value.stepTo(value);

    // 如果设置了自动关闭且进度达到100%
    if (autoCloseFinished.value && value >= 100) {
      setTimeout(() => {
        loadingVisible.value = false;
      }, 1000);
    }
  }
};

// 重置进度
const resetProgress = () => {
  if (loadingRef.value) {
    loadingRef.value.reset();
  }
  progress.value = 0;
};

// 预览布局
const previewLayout = (layout) => {
  selectedLayout.value = layout;
  showLoading();
  resetProgress();
  simulateProgress();
};

// 模拟进度
const simulateProgress = () => {
  resetProgress();
  showLoading();

  let currentProgress = 0;
  const interval = setInterval(() => {
    currentProgress += 5;
    if (loadingRef.value) {
      loadingRef.value.stepTo(currentProgress);
      progress.value = currentProgress;
    }

    if (currentProgress >= 100) {
      clearInterval(interval);

      // 如果设置了自动关闭
      if (autoCloseFinished.value) {
        setTimeout(() => {
          loadingVisible.value = false;
        }, 1000);
      }
    }
  }, 200);
};

// 切换全屏显示
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;

  // 如果是进入全屏，监听ESC键退出
  if (isFullscreen.value) {
    document.addEventListener("keydown", handleEscKey);
  } else {
    document.removeEventListener("keydown", handleEscKey);
  }
};

// 处理ESC键退出全屏
const handleEscKey = (event) => {
  if (event.key === "Escape" && isFullscreen.value) {
    isFullscreen.value = false;
    document.removeEventListener("keydown", handleEscKey);
  }
};

// 生成代码示例
const codeExample = computed(() => {
  let code = `<template>
  <ScLoading 
    ref="loadingRef" 
    v-model="loadingVisible" 
    layout="${selectedLayout.value}"
    ${showNumber.value ? "show-number" : ':show-number="false"'}
    ${showLoadingText.value ? "show-loading" : ':show-loading="false"'}
    ${showLoadingText.value ? `show-loading-label="${loadingLabel.value}"` : ""}
    ${autoCloseFinished.value ? "auto-close-finished" : ""}
    ${borderRadius.value !== 10 ? `:border-radius="${borderRadius.value}"` : ""}
    ${customColor.value !== "#409EFF" ? `:style="{ '--loading-color': '${customColor.value}' }"` : ""}
  />
</template>

<script setup>
import { ref } from 'vue';
import ScLoading from "@repo/components/ScLoading/index.vue";

const loadingRef = ref(null);
const loadingVisible = ref(false);

// 显示加载
const showLoading = () => {
  loadingVisible.value = true;
};

// 更新进度
const updateProgress = (value) => {
  if (loadingRef.value) {
    loadingRef.value.stepTo(value);
  }
};

// 关闭加载
const closeLoading = () => {
  loadingVisible.value = false;
};
<\/script>`;

  return code;
});

// 组件卸载时清理
onUnmounted(() => {
  // 移除事件监听器
  document.removeEventListener("keydown", handleEscKey);
});
</script>

<style lang="scss" scoped>
.load-example {
  .card-header h3 {
    margin: 0 0 8px 0;
    font-size: 22px;
  }

  .text-secondary {
    color: #909399;
    margin: 0;
  }

  h4 {
    margin-top: 0;
    margin-bottom: 16px;
    font-size: 18px;
    color: #303133;
  }

  .mt-4 {
    margin-top: 24px;
  }

  .mb-3 {
    margin-bottom: 12px;
  }

  .w-100 {
    width: 100%;
  }

  .example-desc {
    color: #606266;
    margin-bottom: 16px;
  }

  .preview-area {
    margin-bottom: 20px;
  }

  .preview-container {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 24px;
    min-height: 280px;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
    transition: all 0.3s;

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      z-index: 2000;
      border-radius: 0;
      padding: 40px;

      &:before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
      }
    }
  }

  .loading-area {
    width: 100%;
    height: 100%;
    min-height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .close-preview-btn,
  .fullscreen-btn {
    position: absolute;
    z-index: 10;
    opacity: 0.8;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .close-preview-btn {
    top: 10px;
    right: 10px;
  }

  .fullscreen-btn {
    top: 10px;
    right: 50px;
  }

  .display-options {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
  }

  .layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .layout-item {
    border: 1px solid #ebeef5;
    border-radius: 12px;
    padding: 16px;
    position: relative;
    background-color: #f8f9fa;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s;
    overflow: hidden;

    &:before {
      content: "";
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 3px;
      background-color: transparent;
      transition: all 0.3s;
    }

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 15px rgba(0, 0, 0, 0.08);

      &:before {
        background: linear-gradient(90deg, var(--el-color-primary-light-5), var(--el-color-primary));
      }
    }

    .layout-preview {
      height: 100px;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .layout-name {
      margin-top: 12px;
      font-size: 14px;
      color: #606266;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .active-tag {
        font-size: 10px;
      }
    }

    &.active {
      border: 2px solid var(--el-color-primary);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-4px);

      &:before {
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
        height: 4px;
      }

      &:after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        border-style: solid;
        border-width: 0 24px 24px 0;
        border-color: transparent var(--el-color-primary) transparent transparent;
      }
    }
  }

  .progress-control {
    padding-top: 10px;
    border-top: 1px dashed #ebeef5;
  }

  .code-example {
    .code-desc {
      margin-bottom: 8px;
    }

    pre {
      background-color: #f5f7fa;
      padding: 15px;
      border-radius: 4px;
      overflow-x: auto;
      margin: 0;
    }

    code {
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
      color: #333;
    }
  }
}
</style>
