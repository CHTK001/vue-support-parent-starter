<!--
 * ScNumber 组件示例
 * 展示 ScNumber 的各种布局模式
 * @author CH
 * @date 2025-12-07
-->
<template>
  <div class="sc-number-example">
    <h1>ScNumber 数字组件示例</h1>

    <!-- 默认数字输入框 -->
    <section class="example-section">
      <h2>默认数字输入框 (default)</h2>
      <p class="example-desc">基于 el-input-number 封装，支持所有原生属性</p>
      <div class="example-row">
        <div class="example-item">
          <label>基础用法</label>
          <ScNumber v-model="values.default1" :min="0" :max="100" />
          <span class="value-display">值: {{ values.default1 }}</span>
        </div>
        <div class="example-item">
          <label>右侧控制按钮</label>
          <ScNumber v-model="values.default2" :min="0" :max="100" controls-position="right" />
          <span class="value-display">值: {{ values.default2 }}</span>
        </div>
        <div class="example-item">
          <label>步长为 5</label>
          <ScNumber v-model="values.default3" :min="0" :max="100" :step="5" />
          <span class="value-display">值: {{ values.default3 }}</span>
        </div>
        <div class="example-item">
          <label>精度为 2</label>
          <ScNumber v-model="values.default4" :min="0" :max="10" :step="0.1" :precision="2" />
          <span class="value-display">值: {{ values.default4 }}</span>
        </div>
      </div>
    </section>

    <!-- 滑块模式 -->
    <section class="example-section">
      <h2>滑块模式 (slider)</h2>
      <p class="example-desc">基于 el-slider 封装，支持范围选择、标记点等</p>
      <div class="example-row">
        <div class="example-item example-item--wide">
          <label>基础滑块</label>
          <ScNumber v-model="values.slider1" layout="slider" :min="0" :max="100" />
          <span class="value-display">值: {{ values.slider1 }}</span>
        </div>
        <div class="example-item example-item--wide">
          <label>带输入框</label>
          <ScNumber v-model="values.slider2" layout="slider" :min="0" :max="100" show-input />
          <span class="value-display">值: {{ values.slider2 }}</span>
        </div>
        <div class="example-item example-item--wide">
          <label>带标记点</label>
          <ScNumber
            v-model="values.slider3"
            layout="slider"
            :min="0"
            :max="100"
            :step="10"
            show-stops
            :marks="sliderMarks"
          />
          <span class="value-display">值: {{ values.slider3 }}</span>
        </div>
        <div class="example-item example-item--wide">
          <label>范围选择</label>
          <ScNumber v-model="values.sliderRange" layout="slider" :min="0" :max="100" range />
          <span class="value-display">值: {{ values.sliderRange }}</span>
        </div>
      </div>
    </section>

    <!-- 评分模式 -->
    <section class="example-section">
      <h2>评分模式 (rate)</h2>
      <p class="example-desc">基于 el-rate 封装，支持半星、自定义图标等</p>
      <div class="example-row">
        <div class="example-item">
          <label>基础评分</label>
          <ScNumber v-model="values.rate1" layout="rate" />
          <span class="value-display">值: {{ values.rate1 }}</span>
        </div>
        <div class="example-item">
          <label>允许半星</label>
          <ScNumber v-model="values.rate2" layout="rate" allow-half />
          <span class="value-display">值: {{ values.rate2 }}</span>
        </div>
        <div class="example-item">
          <label>显示文字</label>
          <ScNumber v-model="values.rate3" layout="rate" show-rate-text :texts="rateTexts" />
          <span class="value-display">值: {{ values.rate3 }}</span>
        </div>
        <div class="example-item">
          <label>自定义颜色</label>
          <ScNumber
            v-model="values.rate4"
            layout="rate"
            :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
          />
          <span class="value-display">值: {{ values.rate4 }}</span>
        </div>
      </div>
    </section>

    <!-- 步进器模式 -->
    <section class="example-section">
      <h2>步进器模式 (stepper)</h2>
      <p class="example-desc">现代化的加减按钮设计，适合数量选择场景</p>
      <div class="example-row">
        <div class="example-item">
          <label>基础步进器</label>
          <ScNumber v-model="values.stepper1" layout="stepper" :min="0" :max="99" />
          <span class="value-display">值: {{ values.stepper1 }}</span>
        </div>
        <div class="example-item">
          <label>大尺寸</label>
          <ScNumber v-model="values.stepper2" layout="stepper" :min="0" :max="99" size="large" />
          <span class="value-display">值: {{ values.stepper2 }}</span>
        </div>
        <div class="example-item">
          <label>小尺寸</label>
          <ScNumber v-model="values.stepper3" layout="stepper" :min="0" :max="99" size="small" />
          <span class="value-display">值: {{ values.stepper3 }}</span>
        </div>
        <div class="example-item">
          <label>格式化显示</label>
          <ScNumber
            v-model="values.stepper4"
            layout="stepper"
            :min="0"
            :max="999"
            :value-format="(val) => `¥${val}`"
          />
          <span class="value-display">值: {{ values.stepper4 }}</span>
        </div>
      </div>
    </section>

    <!-- 进度条模式 -->
    <section class="example-section">
      <h2>进度条模式 (progress)</h2>
      <p class="example-desc">结合进度条显示的数字输入</p>
      <div class="example-row">
        <div class="example-item example-item--wide">
          <label>基础进度条</label>
          <ScNumber v-model="values.progress1" layout="progress" :min="0" :max="100" />
          <span class="value-display">值: {{ values.progress1 }}</span>
        </div>
        <div class="example-item example-item--wide">
          <label>成功状态</label>
          <ScNumber v-model="values.progress2" layout="progress" :min="0" :max="100" status="success" />
          <span class="value-display">值: {{ values.progress2 }}</span>
        </div>
        <div class="example-item example-item--wide">
          <label>带输入框</label>
          <ScNumber v-model="values.progress3" layout="progress" :min="0" :max="100" show-input />
          <span class="value-display">值: {{ values.progress3 }}</span>
        </div>
        <div class="example-item example-item--wide">
          <label>自定义颜色</label>
          <ScNumber
            v-model="values.progress4"
            layout="progress"
            :min="0"
            :max="100"
            :progress-color="progressColors"
          />
          <span class="value-display">值: {{ values.progress4 }}</span>
        </div>
      </div>
    </section>

    <!-- 圆形进度模式 -->
    <section class="example-section">
      <h2>圆形进度模式 (circle)</h2>
      <p class="example-desc">圆形进度条显示，适合仪表盘场景</p>
      <div class="example-row example-row--center">
        <div class="example-item">
          <label>基础圆形</label>
          <ScNumber v-model="values.circle1" layout="circle" :min="0" :max="100" />
          <span class="value-display">值: {{ values.circle1 }}</span>
        </div>
        <div class="example-item">
          <label>大尺寸</label>
          <ScNumber v-model="values.circle2" layout="circle" :min="0" :max="100" :circle-size="150" />
          <span class="value-display">值: {{ values.circle2 }}</span>
        </div>
        <div class="example-item">
          <label>自定义颜色</label>
          <ScNumber v-model="values.circle3" layout="circle" :min="0" :max="100" progress-color="#67C23A" />
          <span class="value-display">值: {{ values.circle3 }}</span>
        </div>
        <div class="example-item">
          <label>渐变颜色</label>
          <ScNumber
            v-model="values.circle4"
            layout="circle"
            :min="0"
            :max="100"
            :progress-color="progressColors"
          />
          <span class="value-display">值: {{ values.circle4 }}</span>
        </div>
      </div>
    </section>

    <!-- 尺寸对比 -->
    <section class="example-section">
      <h2>尺寸对比</h2>
      <div class="example-row">
        <div class="example-item">
          <label>大尺寸 (large)</label>
          <ScNumber v-model="values.sizeLarge" size="large" :min="0" :max="100" />
        </div>
        <div class="example-item">
          <label>默认尺寸 (default)</label>
          <ScNumber v-model="values.sizeDefault" size="default" :min="0" :max="100" />
        </div>
        <div class="example-item">
          <label>小尺寸 (small)</label>
          <ScNumber v-model="values.sizeSmall" size="small" :min="0" :max="100" />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import ScNumber from "./index.vue";

const values = reactive({
  // 默认模式
  default1: 10,
  default2: 20,
  default3: 25,
  default4: 3.14,
  // 滑块模式
  slider1: 30,
  slider2: 40,
  slider3: 50,
  sliderRange: [20, 60],
  // 评分模式
  rate1: 3,
  rate2: 3.5,
  rate3: 4,
  rate4: 5,
  // 步进器模式
  stepper1: 1,
  stepper2: 5,
  stepper3: 3,
  stepper4: 99,
  // 进度条模式
  progress1: 30,
  progress2: 80,
  progress3: 50,
  progress4: 70,
  // 圆形模式
  circle1: 60,
  circle2: 75,
  circle3: 85,
  circle4: 45,
  // 尺寸
  sizeLarge: 50,
  sizeDefault: 50,
  sizeSmall: 50
});

const sliderMarks = {
  0: "0°C",
  25: "25°C",
  50: "50°C",
  75: "75°C",
  100: "100°C"
};

const rateTexts = ["极差", "失望", "一般", "满意", "惊喜"];

const progressColors = [
  { color: "#f56c6c", percentage: 20 },
  { color: "#e6a23c", percentage: 40 },
  { color: "#5cb87a", percentage: 60 },
  { color: "#1989fa", percentage: 80 },
  { color: "#6f7ad3", percentage: 100 }
];
</script>

<style lang="scss" scoped>
.sc-number-example {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;

  h1 {
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 32px;
    color: var(--el-text-color-primary);
    border-bottom: 2px solid var(--el-color-primary);
    padding-bottom: 12px;
  }

  .example-section {
    margin-bottom: 40px;
    padding: 24px;
    background: var(--el-bg-color);
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);

    h2 {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--el-text-color-primary);
    }

    .example-desc {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin-bottom: 20px;
    }
  }

  .example-row {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;

    &--center {
      justify-content: center;
    }
  }

  .example-item {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 200px;

    &--wide {
      flex: 1;
      min-width: 280px;
    }

    label {
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
    }

    .value-display {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      background: var(--el-fill-color-light);
      padding: 4px 8px;
      border-radius: 4px;
    }
  }
}
</style>
