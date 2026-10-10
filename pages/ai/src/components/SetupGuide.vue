<template>
  <div v-if="visible" class="setup-guide-container" :style="{ top: guidePosition.y + 'px', left: guidePosition.x + 'px' }" @mousedown="startDrag">
    <div class="guide-header" @mousedown="startDrag">
      <span class="guide-title">{{ t('ui.setupGuide.title') }}</span>
      <el-icon class="close-btn cursor-pointer" @click="closeGuide"><Close /></el-icon>
    </div>
    
    <div class="guide-content">
      <!-- Step 1: 默认账户提示 -->
      <div v-if="currentStep === 1" class="step-panel">
        <h3>{{ t('ui.setupGuide.step1Title') }}</h3>
        <p class="desc">{{ t('ui.setupGuide.step1Desc') }}</p>
        <div class="account-info">
          <div class="info-item">
            <span class="label">{{ t('ui.setupGuide.account') }}</span>
            <span class="value">GuaDa</span>
          </div>
          <div class="info-item">
            <span class="label">{{ t('ui.setupGuide.password') }}</span>
            <span class="value">GuaDa</span>
          </div>
        </div>
        <el-alert type="warning" :closable="false" show-icon>
          {{ t('ui.setupGuide.tip') }}
        </el-alert>
      </div>

      <!-- Step 2: 修改密码引导 -->
      <div v-if="currentStep === 2" class="step-panel">
        <h3>{{ t('ui.setupGuide.step2Title') }}</h3>
        <p class="desc">{{ t('ui.setupGuide.step2Desc') }}</p>
        <div class="action-area">
          <el-button type="primary" @click="goToSecuritySettings">{{ t('ui.setupGuide.step2Action') }}</el-button>
        </div>
      </div>

      <!-- Step 3: 添加模型供应商 -->
      <div v-if="currentStep === 3" class="step-panel">
        <h3>{{ t('ui.setupGuide.step3Title') }}</h3>
        <p class="desc">{{ t('ui.setupGuide.step3Desc') }}</p>
        <div class="action-area">
          <el-button type="primary" @click="goToProviderSettings">{{ t('ui.setupGuide.step3Action') }}</el-button>
        </div>
      </div>

      <!-- Step 4: 设置默认模型 -->
      <div v-if="currentStep === 4" class="step-panel">
        <h3>{{ t('ui.setupGuide.step4Title') }}</h3>
        <p class="desc">{{ t('ui.setupGuide.step4Desc') }}</p>
        <div class="action-area">
          <el-button type="primary" @click="goToDefaultModelSettings">{{ t('ui.setupGuide.step4Action') }}</el-button>
        </div>
      </div>
    </div>

    <div class="guide-footer no-drag">
      <el-button @click="skipStep">{{ t('ui.setupGuide.skip') }}</el-button>
      <el-button type="primary" @click="nextStep" :disabled="!canProceed">
        {{ currentStep === 4 ? t('ui.setupGuide.finish') : t('ui.setupGuide.next') }}
      </el-button>
    </div>
  </div>

  <!-- 全局悬浮引导入口 -->
  <div v-if="!visible && !hasCompleted" class="guide-fab" @click="openGuide" :title="t('ui.setupGuide.viewGuide')">
    <el-icon><QuestionFilled /></el-icon>
  </div>
</template>

<script setup lang="ts">
import { message } from "@repo/core";
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

import { useI18n } from 'vue-i18n'
import { Close, QuestionFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const router = useRouter()
const visible = ref(false)
const hasCompleted = ref(localStorage.getItem('hasCompletedSetup') === 'true')
const currentStep = ref(1)
const guidePosition = ref({ x: window.innerWidth - 350, y: 60 })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const canProceed = computed(() => {
  return true
})

onMounted(() => {
  const hasCompleted = localStorage.getItem('hasCompletedSetup') === 'true'
  if (!hasCompleted) {
    visible.value = true
    // 恢复步骤：从本地存储读取
    const savedStep = localStorage.getItem('setupGuideStep')
    if (savedStep) currentStep.value = parseInt(savedStep)
  }
})

// 监听认证状态：一旦登录成功且未完成设置，则跳转第二步
watch(() => authStore.isAuthenticated, (isAuth) => {
  const hasCompleted = localStorage.getItem('hasCompletedSetup') === 'true'
  if (isAuth && !hasCompleted) {
    currentStep.value = 2
    localStorage.setItem('setupGuideStep', '2')
    visible.value = true
  }
})

watch(currentStep, (val) => {
  localStorage.setItem('setupGuideStep', val.toString())
})

const startDrag = (e: MouseEvent) => {
  if ((e.target as HTMLElement).classList.contains('no-drag')) return
  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - guidePosition.value.x,
    y: e.clientY - guidePosition.value.y
  }
  
  const onMove = (moveEvent: MouseEvent) => {
    if (!isDragging.value) return
    guidePosition.value = {
      x: moveEvent.clientX - dragOffset.value.x,
      y: moveEvent.clientY - dragOffset.value.y
    }
  }
  
  const onUp = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

const closeGuide = () => {
  visible.value = false
}

const openGuide = () => {
  visible.value = true
  const savedStep = localStorage.getItem('setupGuideStep')
  if (savedStep) currentStep.value = parseInt(savedStep)
}

const skipStep = () => {
  if (currentStep.value < 4) {
    currentStep.value++
  } else {
    finishGuide()
  }
}

const nextStep = async () => {
  if (currentStep.value < 4) {
    currentStep.value++
  } else {
    finishGuide()
  }
}

const goToSecuritySettings = () => {
  router.replace({ name: 'SystemSettings', params: { tab: 'security' } })
}

const goToProviderSettings = () => {
  router.replace('/models')
}

const goToDefaultModelSettings = () => {
  router.replace('/setting/default-models')
}

const finishGuide = () => {
  localStorage.setItem('hasCompletedSetup', 'true')
  localStorage.removeItem('setupGuideStep')
  hasCompleted.value = true
  visible.value = false
  message.success(t('ui.setupGuide.completed'))
  
  // 完成后跳转到对话页面
  router.replace('/chat/new-session')
}

// 边界检查：防止窗口缩小时弹窗被遮挡
const clampPosition = () => {
  const guideWidth = 320
  const guideHeight = 400 // 估算高度
  const maxX = window.innerWidth - guideWidth
  const maxY = window.innerHeight - guideHeight
  
  guidePosition.value.x = Math.max(10, Math.min(guidePosition.value.x, maxX))
  guidePosition.value.y = Math.max(10, Math.min(guidePosition.value.y, maxY))
}

// 监听窗口大小变化
if (typeof window !== 'undefined') {
  window.addEventListener('resize', clampPosition)
  // 监听自定义事件以同步状态
  window.addEventListener('local-storage-update', () => {
    // 这里可以做一些额外的 UI 刷新，如果需要的话
  })
}

// 暴露方法给父组件调用
defineExpose({
  openGuide: () => {
    visible.value = true
    const savedStep = localStorage.getItem('setupGuideStep')
    if (savedStep) currentStep.value = parseInt(savedStep)
  }
})
</script>

<style scoped>
.setup-guide-container {
  position: fixed;
  width: 320px;
  /* 浮层面板保持毛玻璃半透（原 90% 白），改为与主题表面色混合，换肤自动跟随 */
  background: color-mix(in srgb, var(--el-bg-color) 90%, transparent);
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 12px → lg 档 */
  border-radius: var(--el-radius-lg, 12px);
  /* 浮层必须浮起，投影改用令牌 */
  box-shadow: var(--el-box-shadow);
  z-index: 2000;
  user-select: none;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.guide-header {
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: move;
  user-select: none;
}

.guide-title {
  font-weight: 600;
  font-size: 14px;
}

.guide-content {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.step-panel h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--color-text-primary);
}

.desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.account-info {
  background: var(--el-fill-color-light);
  padding: 12px;
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.provider-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.provider-card {
  border: 1px solid var(--el-border-color-lighter);
  /* 原值 8px → md 档 */
  border-radius: var(--el-radius-md, 8px);
  padding: 8px;
  cursor: pointer;
  text-align: center;
  transition: all 0.2s;
}

.provider-card:hover, .provider-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.provider-avatar {
  width: 32px;
  height: 32px;
  object-fit: contain;
  margin-bottom: 4px;
}

.provider-name {
  font-size: 12px;
}

.guide-footer {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
}

.guide-fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--el-color-primary);
  color: var(--el-color-white);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  /* 悬浮按钮是常驻浮层，必须浮起，投影改用令牌 */
  box-shadow: var(--el-box-shadow-light);
  cursor: pointer;
  z-index: 1999;
  transition: all 0.3s ease;
}

.guide-fab:hover {
  transform: scale(1.1);
  background: var(--el-color-primary-dark-2);
}

/* 动效降级：系统开启「减少动态效果」时，供应商卡片与悬浮入口的变化直接到位。
   逐个列出，不写 `*` / `.setup-guide-container *` 通配，
   避免把 el-button / el-alert / el-icon 内部 Element Plus 组件的合法过渡一起掐掉。
   两者都只带 transition（无 animation），.guide-fab 的悬停缩放与 .provider-card 的
   hover 边框都是静态样式，关掉过渡后依然生效。 */
@media (prefers-reduced-motion: reduce) {
  .provider-card,
  .guide-fab {
    transition: none;
  }
}

/* 键盘焦点可见性：.guide-fab 是带 @click 的 div（不是可聚焦控件），浏览器不给默认焦点环。
   指针样式原有 cursor: pointer 已在上面声明，这里不重复写。
   环的透明度提到 40%（而不是常规的 12%）：这个按钮本身就是一整块主色实心圆，
   12% 的主色环紧贴同色填充会被当成描边噪点，基本看不出来。 */
.guide-fab {
  outline: none;
}

.guide-fab:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 40%, transparent);
}
</style>
