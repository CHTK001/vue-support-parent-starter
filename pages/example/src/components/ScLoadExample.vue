<template>
  <div class="load-example">
    <el-tabs type="border-card">
      <el-tab-pane label="基础用法">
        <h3>基础加载组件</h3>
        <p class="example-desc">基础的加载组件，支持不同样式和进度显示</p>

        <el-card>
          <div class="example-row">
            <div class="buttons-container">
              <el-button type="primary" @click="showBasicLoading">显示基础加载</el-button>
              <el-button type="success" @click="showProgressLoading">显示进度加载</el-button>
              <el-button type="warning" @click="resetProgress">重置进度</el-button>
              <el-button type="danger" @click="closeBasicLoading">关闭加载</el-button>
            </div>

            <div class="loading-preview">
              <div class="preview-container position-relative" :class="{ fullscreen: isBasicFullscreen }">
                <el-button class="close-preview-btn" type="danger" circle size="small" icon="Close" @click="closeBasicLoading" v-if="basicLoadingVisible" />
                <el-button class="fullscreen-btn" type="primary" circle size="small" :icon="isBasicFullscreen ? 'FullscreenExit' : 'FullScreen'" @click="toggleBasicFullscreen" v-if="basicLoadingVisible" />
                <div class="loading-area">
                  <ScLoading ref="basicLoadingRef" v-model="basicLoadingVisible" :show-number="true" :show-loading="true" show-loading-label="加载中..." layout="default" />
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScLoading 
  ref="basicLoadingRef" 
  v-model="basicLoadingVisible" 
  :show-number="true" 
  :show-loading="true"
  show-loading-label="加载中..."
  layout="default"
/&gt;

&lt;script setup&gt;
import { ref } from 'vue';

const basicLoadingRef = ref(null);
const basicLoadingVisible = ref(false);

// 显示加载
const showLoading = () => {
  basicLoadingVisible.value = true;
};

// 更新进度
const updateProgress = (value) => {
  if (basicLoadingRef.value) {
    basicLoadingRef.value.stepTo(value);
  }
};

// 关闭加载
const closeLoading = () => {
  basicLoadingVisible.value = false;
};
&lt;/script&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="不同布局">
        <h3>不同布局样式</h3>
        <p class="example-desc">ScLoading组件支持多种布局样式，可根据需要选择</p>

        <el-card class="layout-showcase-card">
          <div class="layout-controls">
            <div class="control-section">
              <h4>显示选项：</h4>
              <div class="display-options">
                <el-switch v-model="showNumber" active-text="显示进度数字" />
                <el-switch v-model="showLoadingText" active-text="显示加载文本" />
              </div>
            </div>

            <div class="control-section">
              <h4>操作：</h4>
              <div class="action-buttons">
                <el-button type="primary" @click="showLayoutLoading" icon="View">显示</el-button>
                <el-button type="success" @click="simulateProgress" icon="VideoPlay">模拟进度</el-button>
                <el-button type="danger" @click="closeLayoutLoading" icon="Close">关闭</el-button>
              </div>
            </div>
          </div>

          <div class="layout-preview-container" :class="{ fullscreen: isFullscreen }">
            <el-button class="close-preview-btn" type="danger" circle size="small" icon="Close" @click="closeLayoutLoading" v-if="layoutLoadingVisible" />

            <el-button class="fullscreen-btn" type="primary" circle size="small" :icon="isFullscreen ? 'FullscreenExit' : 'FullScreen'" @click="toggleFullscreen" v-if="layoutLoadingVisible" />

            <div class="selected-layout-info">
              <div class="layout-badge">
                <span>当前布局: </span>
                <el-tag effect="dark" type="primary">{{ layouts.find((l) => l.value === selectedLayout)?.label || selectedLayout }}</el-tag>
              </div>
            </div>

            <div class="loading-preview-box">
              <ScLoading ref="layoutLoadingRef" v-model="layoutLoadingVisible" :layout="selectedLayout" :show-number="showNumber" :show-loading="showLoadingText" show-loading-label="加载中..." />
            </div>
          </div>
        </el-card>

        <h4 class="section-title">布局样式预览</h4>
        <p class="example-desc">点击卡片可预览对应的布局样式</p>

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

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScLoading 
  ref="loadingRef" 
  v-model="loadingVisible" 
  :layout="'{{ selectedLayout }}'"
  :show-number="{{ showNumber }}" 
  :show-loading="{{ showLoadingText }}"
  show-loading-label="加载中..."
/&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自动进度">
        <h3>自动进度加载</h3>
        <p class="example-desc">可以设置自动完成进度并关闭加载组件</p>

        <el-card>
          <div class="example-row">
            <div class="buttons-container">
              <el-button type="primary" @click="showAutoLoading">显示自动进度加载</el-button>
              <el-button type="success" @click="showCustomAutoLoading">自定义速度加载</el-button>
            </div>

            <div class="loading-preview">
              <div class="preview-container position-relative" :class="{ fullscreen: isAutoFullscreen }">
                <el-button class="close-preview-btn" type="danger" circle size="small" icon="Close" @click="autoLoadingVisible = false" v-if="autoLoadingVisible" />
                <el-button class="fullscreen-btn" type="primary" circle size="small" :icon="isAutoFullscreen ? 'FullscreenExit' : 'FullScreen'" @click="toggleAutoFullscreen" v-if="autoLoadingVisible" />
                <div class="loading-area">
                  <ScLoading ref="autoLoadingRef" v-model="autoLoadingVisible" :show-number="true" :show-loading="true" show-loading-label="自动加载中..." :auto-close-finished="true" layout="spining" />
                </div>
              </div>
            </div>
          </div>
        </el-card>

        <el-divider></el-divider>
        <h4>代码示例：</h4>
        <pre><code class="language-html">
&lt;ScLoading 
  ref="loadingRef" 
  v-model="loadingVisible" 
  :show-number="true" 
  :show-loading="true"
  show-loading-label="自动加载中..."
  :auto-close-finished="true"
  layout="spining"
/&gt;
        </code></pre>
      </el-tab-pane>

      <el-tab-pane label="自定义样式">
        <h3>自定义样式</h3>
        <p class="example-desc">可以自定义加载组件的颜色、大小等样式</p>

        <el-card>
          <div class="example-row">
            <div class="customization-panel">
              <div class="panel-row">
                <span class="label">背景色：</span>
                <el-color-picker v-model="customBgColor" show-alpha></el-color-picker>
              </div>
              <div class="panel-row">
                <span class="label">进度条颜色：</span>
                <el-color-picker v-model="customColor"></el-color-picker>
              </div>
              <div class="panel-row">
                <span class="label">圆角大小：</span>
                <el-slider v-model="customRadius" :min="0" :max="20"></el-slider>
              </div>
              <div class="panel-row">
                <span class="label">宽度：</span>
                <el-input-number v-model="customWidth" :min="100" :max="600"></el-input-number>
              </div>
              <div class="panel-row">
                <span class="label">高度：</span>
                <el-input-number v-model="customHeight" :min="100" :max="400"></el-input-number>
              </div>
              <div class="buttons-container">
                <el-button type="primary" @click="showCustomLoading">显示自定义样式</el-button>
              </div>
            </div>

            <div class="loading-preview">
              <div class="preview-container position-relative" :class="{ fullscreen: isCustomFullscreen }" :style="customContainerStyle">
                <el-button class="close-preview-btn" type="danger" circle size="small" icon="Close" @click="customLoadingVisible = false" v-if="customLoadingVisible" />
                <el-button class="fullscreen-btn" type="primary" circle size="small" :icon="isCustomFullscreen ? 'FullscreenExit' : 'FullScreen'" @click="toggleCustomFullscreen" v-if="customLoadingVisible" />
                <div class="loading-area">
                  <ScLoading ref="customLoadingRef" v-model="customLoadingVisible" :show-number="true" :show-loading="true" show-loading-label="自定义样式加载中..." layout="default" :border-radius="customRadius" :style="customLoadingStyle" />
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="API说明">
        <h3>ScLoading 组件 API</h3>
        <el-table :data="apiProps" style="width: 100%">
          <el-table-column prop="name" label="属性" width="200"></el-table-column>
          <el-table-column prop="desc" label="说明"></el-table-column>
          <el-table-column prop="type" label="类型" width="150"></el-table-column>
          <el-table-column prop="default" label="默认值" width="150"></el-table-column>
        </el-table>

        <h4 class="subtitle">方法</h4>
        <el-table :data="apiMethods" style="width: 100%">
          <el-table-column prop="name" label="方法名" width="200"></el-table-column>
          <el-table-column prop="desc" label="说明"></el-table-column>
          <el-table-column prop="params" label="参数" width="200"></el-table-column>
        </el-table>

        <h4 class="subtitle">预览功能</h4>
        <el-table :data="previewFeatures" style="width: 100%">
          <el-table-column prop="name" label="功能" width="200"></el-table-column>
          <el-table-column prop="desc" label="说明"></el-table-column>
        </el-table>

        <h3 class="subtitle">ScLoadComponent 组件</h3>
        <p>一个简单的加载组件，不需要控制进度，直接引入使用即可。</p>

        <h3 class="subtitle">ScLoading 组件</h3>
        <p>高度可定制的加载组件，支持多种布局样式和进度控制，可应用于各种加载场景。</p>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from "vue";
import ScLoading from "@repo/components/ScLoading/index.vue";

// 基础加载
const basicLoadingRef = ref(null);
const basicLoadingVisible = ref(false);

// 布局加载
const layoutLoadingRef = ref(null);
const layoutLoadingVisible = ref(false);
const selectedLayout = ref("default");

// 自动进度加载
const autoLoadingRef = ref(null);
const autoLoadingVisible = ref(false);

// 自定义样式加载
const customLoadingRef = ref(null);
const customLoadingVisible = ref(false);

// 自定义样式设置
const customBgColor = ref("rgba(240, 240, 240, 0.9)");
const customColor = ref("#409EFF");
const customRadius = ref(10);
const customWidth = ref(400);
const customHeight = ref(250);

// 显示选项
const showNumber = ref(true);
const showLoadingText = ref(true);

// 全屏状态
const isFullscreen = ref(false);
const isBasicFullscreen = ref(false);
const isAutoFullscreen = ref(false);
const isCustomFullscreen = ref(false);
const detail = reactive({
  status: "success",
  message: "操作成功",
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

// API属性列表
const apiProps = [
  { name: "v-model / modelValue", desc: "是否显示加载组件", type: "Boolean", default: "false" },
  { name: "layout", desc: "加载组件布局样式", type: "String", default: "default" },
  { name: "show-number", desc: "是否显示进度数字", type: "Boolean", default: "false" },
  { name: "show-loading", desc: "是否显示加载文本", type: "Boolean", default: "false" },
  { name: "show-loading-label", desc: "加载文本内容", type: "String", default: "加载中..." },
  { name: "auto-close-finished", desc: "进度完成后是否自动关闭", type: "Boolean", default: "false" },
  { name: "border-radius", desc: "边框圆角大小", type: "Number", default: "10" },
];

// API方法列表
const apiMethods = [
  { name: "step()", desc: "进度加1", params: "无" },
  { name: "stepBy(value)", desc: "进度增加指定值", params: "value: Number" },
  { name: "stepTo(value)", desc: "进度设置为指定值", params: "value: Number" },
  { name: "reset()", desc: "重置进度为0", params: "无" },
  { name: "close()", desc: "关闭加载组件", params: "无" },
];

// 预览功能列表
const previewFeatures = [
  { name: "全屏预览", desc: "点击全屏按钮可使加载组件以全屏模式显示，再次点击或按ESC键退出全屏" },
  { name: "关闭按钮", desc: "点击右上角关闭按钮可快速关闭加载组件" },
  { name: "布局选择", desc: "点击不同布局卡片可预览各种加载样式" },
  { name: "进度模拟", desc: "点击模拟进度按钮可查看进度变化效果" },
];

// 自定义容器样式
const customContainerStyle = computed(() => {
  return {
    width: `${customWidth.value}px`,
    height: `${customHeight.value}px`,
    backgroundColor: customBgColor.value,
    borderRadius: `${customRadius.value}px`,
  };
});

// 自定义加载样式
const customLoadingStyle = computed(() => {
  return {
    "--loading-color": customColor.value,
  };
});

// 显示基础加载
const showBasicLoading = () => {
  basicLoadingVisible.value = true;
};

// 关闭基础加载
const closeBasicLoading = () => {
  basicLoadingVisible.value = false;
};

// 显示进度加载
const showProgressLoading = () => {
  basicLoadingVisible.value = true;
  simulateBasicProgress();
};

// 模拟基础进度
const simulateBasicProgress = () => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (basicLoadingRef.value) {
      basicLoadingRef.value.stepTo(progress);
    }
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 500);
};

// 重置进度
const resetProgress = () => {
  if (basicLoadingRef.value) {
    basicLoadingRef.value.reset();
  }
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

// 切换基础全屏
const toggleBasicFullscreen = () => {
  isBasicFullscreen.value = !isBasicFullscreen.value;

  // 如果是进入全屏，监听ESC键退出
  if (isBasicFullscreen.value) {
    document.addEventListener("keydown", handleBasicEscKey);
  } else {
    document.removeEventListener("keydown", handleBasicEscKey);
  }
};

// 处理基础全屏的ESC键退出
const handleBasicEscKey = (event) => {
  if (event.key === "Escape" && isBasicFullscreen.value) {
    isBasicFullscreen.value = false;
    document.removeEventListener("keydown", handleBasicEscKey);
  }
};

// 显示布局加载
const showLayoutLoading = () => {
  layoutLoadingVisible.value = true;
};

// 关闭布局加载
const closeLayoutLoading = () => {
  layoutLoadingVisible.value = false;
};

// 预览布局
const previewLayout = (layout) => {
  selectedLayout.value = layout;
  showLayoutLoading();
  simulateProgress();
};

// 模拟进度
const simulateProgress = () => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 10;
    if (layoutLoadingRef.value) {
      layoutLoadingRef.value.stepTo(progress);
    }
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 500);
};

// 显示自动进度加载
const showAutoLoading = () => {
  autoLoadingVisible.value = true;
  simulateAutoProgress();
};

// 显示自定义速度的自动进度加载
const showCustomAutoLoading = () => {
  autoLoadingVisible.value = true;
  simulateCustomAutoProgress();
};

// 模拟自动进度
const simulateAutoProgress = () => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    if (autoLoadingRef.value) {
      autoLoadingRef.value.stepTo(progress);
    }
    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 200);
};

// 模拟自定义速度的自动进度
const simulateCustomAutoProgress = () => {
  let progress = 0;
  let speeds = [3, 10, 2, 8, 5, 15, 7, 20];
  let currentSpeedIndex = 0;

  const interval = setInterval(() => {
    let speed = speeds[currentSpeedIndex];
    progress += speed;
    currentSpeedIndex = (currentSpeedIndex + 1) % speeds.length;

    if (autoLoadingRef.value) {
      autoLoadingRef.value.stepTo(progress > 100 ? 100 : progress);
    }

    if (progress >= 100) {
      clearInterval(interval);
    }
  }, 300);
};

// 显示自定义样式加载
const showCustomLoading = () => {
  customLoadingVisible.value = true;
  simulateCustomProgress();
};

// 模拟自定义进度
const simulateCustomProgress = () => {
  let progress = 0;
  const interval = setInterval(() => {
    progress += 8;
    if (customLoadingRef.value) {
      customLoadingRef.value.stepTo(progress);
    }
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        customLoadingVisible.value = false;
      }, 1000);
    }
  }, 400);
};

// 切换自动进度全屏
const toggleAutoFullscreen = () => {
  isAutoFullscreen.value = !isAutoFullscreen.value;

  // 如果是进入全屏，监听ESC键退出
  if (isAutoFullscreen.value) {
    document.addEventListener("keydown", handleAutoEscKey);
  } else {
    document.removeEventListener("keydown", handleAutoEscKey);
  }
};

// 处理自动进度全屏的ESC键退出
const handleAutoEscKey = (event) => {
  if (event.key === "Escape" && isAutoFullscreen.value) {
    isAutoFullscreen.value = false;
    document.removeEventListener("keydown", handleAutoEscKey);
  }
};

// 切换自定义样式全屏
const toggleCustomFullscreen = () => {
  isCustomFullscreen.value = !isCustomFullscreen.value;

  // 如果是进入全屏，监听ESC键退出
  if (isCustomFullscreen.value) {
    document.addEventListener("keydown", handleCustomEscKey);
  } else {
    document.removeEventListener("keydown", handleCustomEscKey);
  }
};

// 处理自定义样式全屏的ESC键退出
const handleCustomEscKey = (event) => {
  if (event.key === "Escape" && isCustomFullscreen.value) {
    isCustomFullscreen.value = false;
    document.removeEventListener("keydown", handleCustomEscKey);
  }
};

// 高级用法 - 异步加载
const advancedLoadingRef = ref(null);
const advancedLoadingVisible = ref(false);
const isAdvancedFullscreen = ref(false);
const loadingMessage = ref("处理中...");
const operationDetails = ref([]);

// 显示异步加载
const showAsyncLoading = () => {
  advancedLoadingVisible.value = true;
  loadingMessage.value = "正在初始化...";
  operationDetails.value = [];

  if (advancedLoadingRef.value) {
    advancedLoadingRef.value.reset();
  }

  // 模拟异步操作
  startAsyncOperation();
};

// 模拟网络请求
const showNetworkLoading = () => {
  advancedLoadingVisible.value = true;
  loadingMessage.value = "正在加载数据...";
  operationDetails.value = [];

  if (advancedLoadingRef.value) {
    advancedLoadingRef.value.reset();
  }

  // 模拟网络请求
  simulateNetworkRequests();
};

// 直接全屏加载
const showFullscreenLoading = () => {
  advancedLoadingVisible.value = true;
  isAdvancedFullscreen.value = true;
  loadingMessage.value = "全屏加载示例";
  operationDetails.value = [];

  if (advancedLoadingRef.value) {
    advancedLoadingRef.value.reset();
  }

  // 模拟进度
  let progress = 0;
  const interval = setInterval(() => {
    progress += 5;
    if (advancedLoadingRef.value) {
      advancedLoadingRef.value.stepTo(progress);
    }

    if (progress === 25) {
      operationDetails.value.push({
        message: "✓ 第一阶段完成",
        status: "success",
      });
    } else if (progress === 50) {
      operationDetails.value.push({
        message: "✓ 第二阶段完成",
        status: "success",
      });
    } else if (progress === 75) {
      operationDetails.value.push({
        message: "✓ 第三阶段完成",
        status: "success",
      });
    }

    if (progress >= 100) {
      clearInterval(interval);
      operationDetails.value.push({
        message: "✓ 全部完成",
        status: "success",
      });
      setTimeout(() => {
        advancedLoadingVisible.value = false;
        isAdvancedFullscreen.value = false;
      }, 1500);
    }
  }, 300);
};

// 模拟异步操作
const startAsyncOperation = () => {
  let totalSteps = 5;
  let currentStep = 0;

  const performStep = () => {
    currentStep++;
    const progress = Math.floor((currentStep / totalSteps) * 100);

    if (advancedLoadingRef.value) {
      advancedLoadingRef.value.stepTo(progress);
    }

    // 随机成功或失败
    const isSuccess = Math.random() > 0.2;

    if (isSuccess) {
      operationDetails.value.push({
        message: `✓ 步骤 ${currentStep} 完成`,
        status: "success",
      });

      if (currentStep < totalSteps) {
        loadingMessage.value = `正在执行步骤 ${currentStep + 1}/${totalSteps}`;
        setTimeout(performStep, 1000);
      } else {
        loadingMessage.value = "操作完成";
        setTimeout(() => {
          advancedLoadingVisible.value = false;
        }, 1500);
      }
    } else {
      operationDetails.value.push({
        message: `✗ 步骤 ${currentStep} 失败`,
        status: "error",
      });
      loadingMessage.value = "操作失败";
    }
  };

  // 开始第一步
  loadingMessage.value = `正在执行步骤 1/${totalSteps}`;
  setTimeout(performStep, 1000);
};

// 模拟网络请求
const simulateNetworkRequests = () => {
  const totalRequests = 10;
  let completedRequests = 0;

  const randomTimeouts = Array.from({ length: totalRequests }, () => Math.floor(Math.random() * 1000) + 500);

  randomTimeouts.forEach((timeout, index) => {
    setTimeout(() => {
      completedRequests++;
      const progress = Math.floor((completedRequests / totalRequests) * 100);

      if (advancedLoadingRef.value) {
        advancedLoadingRef.value.stepTo(progress);
      }

      // 90%概率成功
      const isSuccess = Math.random() > 0.1;

      if (isSuccess) {
        operationDetails.value.push({
          message: `✓ 请求 ${index + 1} 成功 (${timeout}ms)`,
          status: "success",
        });
      } else {
        operationDetails.value.push({
          message: `✗ 请求 ${index + 1} 超时 (${timeout}ms)`,
          status: "error",
        });
      }

      loadingMessage.value = `已完成 ${completedRequests}/${totalRequests} 个请求`;

      if (completedRequests === totalRequests) {
        loadingMessage.value = "所有请求已完成";
        setTimeout(() => {
          advancedLoadingVisible.value = false;
        }, 1500);
      }
    }, timeout);
  });
};

// 切换高级全屏
const toggleAdvancedFullscreen = () => {
  isAdvancedFullscreen.value = !isAdvancedFullscreen.value;

  if (isAdvancedFullscreen.value) {
    document.addEventListener("keydown", handleAdvancedEscKey);
  } else {
    document.removeEventListener("keydown", handleAdvancedEscKey);
  }
};

// 处理高级全屏ESC键退出
const handleAdvancedEscKey = (event) => {
  if (event.key === "Escape" && isAdvancedFullscreen.value) {
    isAdvancedFullscreen.value = false;
    document.removeEventListener("keydown", handleAdvancedEscKey);
  }
};

// 组件挂载时初始化
onMounted(() => {
  // 可以在此处添加初始化逻辑
});

// 组件卸载时清理
onUnmounted(() => {
  // 移除所有事件监听器
  document.removeEventListener("keydown", handleEscKey);
  document.removeEventListener("keydown", handleBasicEscKey);
  document.removeEventListener("keydown", handleAutoEscKey);
  document.removeEventListener("keydown", handleCustomEscKey);
  document.removeEventListener("keydown", handleAdvancedEscKey);
});
</script>

<style lang="scss" scoped>
.load-example {
  .example-desc {
    color: #666;
    margin-bottom: 16px;
  }

  .subtitle {
    margin-top: 24px;
    margin-bottom: 16px;
  }

  .example-row {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
  }

  .buttons-container {
    display: flex;
    gap: 12px;
    margin: 16px 0;
    flex-wrap: wrap;
  }

  .loading-preview {
    margin: 16px 0;
  }

  .preview-container {
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 16px;
    background-color: #f8f9fa;
    min-height: 200px;
    display: flex;
    justify-content: center;
    align-items: center;
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
      background-color: rgba(248, 249, 250, 0.95);

      &:before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 6px;
        background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
      }

      .loading-area {
        max-width: 800px;
        max-height: 600px;
      }
    }
  }

  .position-relative {
    position: relative;
  }

  .loading-area {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .simple-loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 160px;
  }

  .layout-options {
    margin-bottom: 20px;

    h4 {
      margin-bottom: 12px;
    }

    .options-container {
      margin-bottom: 16px;
    }

    .display-options {
      display: flex;
      gap: 16px;
      margin: 16px 0;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin: 16px 0;
    }
  }

  .layout-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
    margin-top: 24px;
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

  .customization-panel {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    background-color: #f8f9fa;

    .panel-row {
      display: flex;
      align-items: center;
      gap: 16px;

      .label {
        min-width: 100px;
        color: #606266;
      }

      .el-slider {
        flex: 1;
      }
    }
  }

  pre {
    background-color: #f8f9fa;
    border-radius: 8px;
    padding: 16px;
    overflow-x: auto;
    margin: 16px 0;

    code {
      font-family: Consolas, Monaco, "Andale Mono", monospace;
      font-size: 14px;
      color: #444;
      line-height: 1.6;
    }
  }

  .layout-showcase-card {
    margin-bottom: 24px;
  }

  .layout-controls {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px dashed #dcdfe6;
  }

  .control-section {
    h4 {
      margin-bottom: 12px;
      font-weight: 600;
      color: #303133;
    }
  }

  .radio-button-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .display-options {
    display: flex;
    gap: 24px;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .layout-preview-container {
    padding: 24px;
    background-color: #f5f7fa;
    border-radius: 12px;
    min-height: 250px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
    overflow: hidden;
    transition: all 0.3s ease;

    &:before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 6px;
      background: linear-gradient(90deg, var(--el-color-primary), var(--el-color-success));
    }

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      z-index: 2000;
      border-radius: 0;
      padding: 40px;
    }
  }

  .selected-layout-info {
    margin-bottom: 16px;
    width: 100%;
    display: flex;
    justify-content: center;

    .layout-badge {
      display: flex;
      gap: 8px;
      align-items: center;

      span {
        color: #606266;
      }
    }
  }

  .loading-preview-box {
    min-height: 380px;
    width: 100%;
    display: flex;
    position: relative;
    justify-content: center;
    align-items: center;
  }

  .section-title {
    margin-top: 32px;
    margin-bottom: 8px;
    font-weight: 600;
  }

  .layout-item {
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

    .layout-name {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;

      .active-tag {
        font-size: 10px;
      }
    }
  }

  .close-preview-btn {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 10;
    opacity: 0.8;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .fullscreen-btn {
    position: absolute;
    top: 10px;
    right: 50px;
    z-index: 10;
    opacity: 0.8;
    transition: all 0.2s ease;

    &:hover {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .advanced-examples {
    margin-top: 20px;
    margin-bottom: 20px;
  }

  .usage-scenarios {
    padding: 10px;
  }

  .advanced-loading-container {
    position: relative;
    border-radius: 12px;
    background-color: rgba(255, 255, 255, 0.95);
    min-height: 300px;
    width: 100%;
    padding: 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;

    &.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 9999;
      border-radius: 0;
    }
  }

  .advanced-loading-area {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-bottom: 30px;
  }

  .operation-details {
    width: 100%;
    max-width: 500px;
    background-color: #f5f7fa;
    border-radius: 8px;
    padding: 15px;
    margin-top: 20px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: bold;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 1px solid #ebeef5;
  }

  .detail-item {
    padding: 8px 0;
    border-bottom: 1px dashed #ebeef5;
    font-size: 13px;

    &.success {
      color: var(--el-color-success);
    }

    &.error {
      color: var(--el-color-danger);
    }
  }
}
</style>
