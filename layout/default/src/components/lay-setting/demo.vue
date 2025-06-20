<template>
  <div class="demo-container">
    <h1>Lay-Setting 组件演示</h1>
    
    <div class="demo-section">
      <h2>主题切换测试</h2>
      <el-button @click="toggleTheme">
        切换到{{ isDark ? '明亮' : '暗黑' }}主题
      </el-button>
    </div>

    <div class="demo-section">
      <h2>配置项测试</h2>
      <div class="config-display">
        <div class="config-item">
          <span>动画强度:</span>
          <span>{{ animationIntensity }}</span>
        </div>
        <div class="config-item">
          <span>界面密度:</span>
          <span>{{ interfaceDensity }}</span>
        </div>
        <div class="config-item">
          <span>字体大小:</span>
          <span>{{ fontSize }}</span>
        </div>
        <div class="config-item">
          <span>圆角风格:</span>
          <span>{{ borderRadius }}</span>
        </div>
      </div>
    </div>

    <div class="demo-section">
      <h2>样式效果预览</h2>
      <div class="preview-grid">
        <div class="preview-card">
          <h3>卡片标题</h3>
          <p>这是一个测试卡片，用于展示当前的样式配置效果。</p>
          <el-button type="primary">主要按钮</el-button>
        </div>
        <div class="preview-card">
          <h3>开关组件</h3>
          <el-switch v-model="testSwitch" />
        </div>
        <div class="preview-card">
          <h3>输入框</h3>
          <el-input v-model="testInput" placeholder="请输入内容" />
        </div>
      </div>
    </div>

    <!-- 设置面板 -->
    <div class="settings-panel">
      <lay-setting />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDark, useToggle } from '@pureadmin/utils'
import LaySetting from './index.vue'

const isDark = useDark()
const toggleTheme = useToggle(isDark)

const testSwitch = ref(true)
const testInput = ref('测试文本')

// 从 localStorage 读取配置
const animationIntensity = ref('normal')
const interfaceDensity = ref('standard')
const fontSize = ref('medium')
const borderRadius = ref('medium')

onMounted(() => {
  // 读取配置
  const storage = JSON.parse(localStorage.getItem('responsive-configure') || '{}')
  animationIntensity.value = storage.animationIntensity || 'normal'
  interfaceDensity.value = storage.interfaceDensity || 'standard'
  fontSize.value = storage.fontSize || 'medium'
  borderRadius.value = storage.borderRadius || 'medium'

  // 监听配置变化
  const observer = new MutationObserver(() => {
    const newStorage = JSON.parse(localStorage.getItem('responsive-configure') || '{}')
    animationIntensity.value = newStorage.animationIntensity || 'normal'
    interfaceDensity.value = newStorage.interfaceDensity || 'standard'
    fontSize.value = newStorage.fontSize || 'medium'
    borderRadius.value = newStorage.borderRadius || 'medium'
  })

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['style']
  })
})
</script>

<style scoped>
.demo-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background: var(--el-bg-color-page);
  min-height: 100vh;
}

h1 {
  color: var(--el-text-color-primary);
  text-align: center;
  margin-bottom: 32px;
  font-size: var(--font-size-large, 24px);
}

.demo-section {
  margin-bottom: var(--interface-margin, 32px);
  padding: var(--interface-padding, 24px);
  background: var(--el-bg-color);
  border-radius: var(--border-radius-base, 12px);
  box-shadow: var(--el-box-shadow-light);
  transition: all var(--animation-duration, 0.3s) ease;
}

.demo-section:hover {
  transform: translateY(calc(-2px * var(--animation-scale, 1)));
  box-shadow: var(--el-box-shadow);
}

h2 {
  color: var(--el-text-color-primary);
  margin-bottom: var(--interface-gap, 16px);
  font-size: var(--font-size-large, 18px);
}

.config-display {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--interface-gap, 16px);
}

.config-item {
  display: flex;
  justify-content: space-between;
  padding: var(--interface-gap, 12px);
  background: var(--el-fill-color-extra-light);
  border-radius: var(--border-radius-small, 8px);
  font-size: var(--font-size-base, 14px);
  color: var(--el-text-color-regular);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--interface-gap, 20px);
}

.preview-card {
  padding: var(--interface-padding, 20px);
  background: var(--el-fill-color-extra-light);
  border-radius: var(--border-radius-base, 12px);
  border: 1px solid var(--el-border-color-lighter);
  transition: all var(--animation-duration, 0.3s) ease;
}

.preview-card:hover {
  transform: scale(var(--animation-scale, 1.02));
  box-shadow: var(--el-box-shadow-light);
}

.preview-card h3 {
  margin-bottom: var(--interface-gap, 12px);
  color: var(--el-text-color-primary);
  font-size: var(--font-size-base, 16px);
}

.preview-card p {
  margin-bottom: var(--interface-gap, 16px);
  color: var(--el-text-color-regular);
  font-size: var(--font-size-base, 14px);
  line-height: 1.5;
}

.settings-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-height: 80vh;
  overflow-y: auto;
}
</style>
