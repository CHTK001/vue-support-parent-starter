<template>
  <div class="shape-test-container">
    <h2>ScSelect Shape 属性测试</h2>
    
    <!-- 圆形形状测试 -->
    <div class="test-section">
      <h3>圆形 (Circle)</h3>
      <ScSelect
        v-model="selectedCircle"
        :options="shapeOptions"
        layout="card"
        shape="circle"
        :columns="4"
        :gap="16"
      />
    </div>

    <!-- 矩形形状测试 -->
    <div class="test-section">
      <h3>矩形 (Rectangle)</h3>
      <ScSelect
        v-model="selectedRectangle"
        :options="shapeOptions"
        layout="card"
        shape="rectangle"
        :columns="4"
        :gap="16"
      />
    </div>

    <!-- 圆角矩形形状测试 (默认) -->
    <div class="test-section">
      <h3>圆角矩形 (Rounded - 默认)</h3>
      <ScSelect
        v-model="selectedRounded"
        :options="shapeOptions"
        layout="card"
        shape="rounded"
        :columns="4"
        :gap="16"
      />
    </div>

    <h2>Dropdown Direction 属性测试</h2>
    
    <!-- 垂直下拉测试 -->
    <div class="test-section">
      <h3>垂直下拉 (Vertical - 默认)</h3>
      <ScSelect
        v-model="selectedVertical"
        :options="dropdownOptions"
        layout="dropdown"
        dropdown-direction="vertical"
        dropdown-title="选择选项"
      />
    </div>

    <!-- 水平下拉测试 -->
    <div class="test-section">
      <h3>水平下拉 (Horizontal)</h3>
      <ScSelect
        v-model="selectedHorizontal"
        :options="dropdownOptions"
        layout="dropdown"
        dropdown-direction="horizontal"
        dropdown-title="选择选项"
      />
    </div>

    <!-- 选择结果展示 -->
    <div class="result-section">
      <h3>选择结果</h3>
      <p>圆形选择: {{ selectedCircle }}</p>
      <p>矩形选择: {{ selectedRectangle }}</p>
      <p>圆角矩形选择: {{ selectedRounded }}</p>
      <p>垂直下拉选择: {{ selectedVertical }}</p>
      <p>水平下拉选择: {{ selectedHorizontal }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ScSelect from '@/components/ScSelect/index.vue'

// 响应式数据
const selectedCircle = ref('')
const selectedRectangle = ref('')
const selectedRounded = ref('')
const selectedVertical = ref('')
const selectedHorizontal = ref('')

// 形状测试选项
const shapeOptions = [
  {
    label: '选项1',
    value: 'option1',
    icon: 'ri:home-line'
  },
  {
    label: '选项2',
    value: 'option2',
    icon: 'ri:user-line'
  },
  {
    label: '选项3',
    value: 'option3',
    icon: 'ri:settings-line'
  },
  {
    label: '选项4',
    value: 'option4',
    icon: 'ri:heart-line'
  }
]

// 下拉选项
const dropdownOptions = [
  {
    label: '北京',
    value: 'beijing',
    description: '中国首都'
  },
  {
    label: '上海',
    value: 'shanghai',
    description: '经济中心'
  },
  {
    label: '广州',
    value: 'guangzhou',
    description: '南方门户'
  },
  {
    label: '深圳',
    value: 'shenzhen',
    description: '科技之城'
  },
  {
    label: '杭州',
    value: 'hangzhou',
    description: '人间天堂'
  },
  {
    label: '成都',
    value: 'chengdu',
    description: '天府之国'
  }
]
</script>

<style lang="scss" scoped>
.shape-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;

  h2 {
    color: var(--el-color-primary);
    margin: 30px 0 20px 0;
    font-size: 24px;
    border-bottom: 2px solid var(--el-color-primary);
    padding-bottom: 10px;
  }

  h3 {
    color: var(--el-text-color-primary);
    margin: 20px 0 15px 0;
    font-size: 18px;
  }

  .test-section {
    margin-bottom: 40px;
    padding: 20px;
    background: var(--el-bg-color);
    border-radius: 8px;
    border: 1px solid var(--el-border-color-lighter);
  }

  .result-section {
    margin-top: 40px;
    padding: 20px;
    background: var(--el-color-info-light-9);
    border-radius: 8px;
    border: 1px solid var(--el-color-info-light-7);

    p {
      margin: 8px 0;
      font-family: monospace;
      color: var(--el-text-color-primary);
    }
  }
}
</style>