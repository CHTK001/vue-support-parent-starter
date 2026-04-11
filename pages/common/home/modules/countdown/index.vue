<template>
  <div class="countdown-card" :style="cardStyles">
    <!-- 主视图 -->
    <div v-if="!showSettings" class="main-view">
      <button class="settings-btn" @click="showSettings = true" :aria-label="'打开设置'">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
        </svg>
      </button>

      <div class="countdown-display">
        <div class="time-segment">
          <span class="time-value">{{ timeLeft.days }}</span>
          <span class="time-label">天</span>
        </div>
        <span class="time-separator">:</span>
        <div class="time-segment">
          <span class="time-value">{{ timeLeft.hours }}</span>
          <span class="time-label">时</span>
        </div>
        <span class="time-separator">:</span>
        <div class="time-segment">
          <span class="time-value">{{ timeLeft.minutes }}</span>
          <span class="time-label">分</span>
        </div>
        <span class="time-separator">:</span>
        <div class="time-segment">
          <span class="time-value">{{ timeLeft.seconds }}</span>
          <span class="time-label">秒</span>
        </div>
      </div>

      <div class="event-name">{{ currentEvent.name }}</div>
    </div>

    <!-- 设置面板 -->
    <div v-else class="settings-panel">
      <div class="settings-header">
        <h3>设置倒计时</h3>
        <button class="close-btn" @click="showSettings = false" :aria-label="'关闭设置'">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
      </div>

      <div class="tabs">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          :class="['tab', { active: activeTab === tab.id }]"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <div class="tab-content">
        <!-- 节日选择 -->
        <div v-if="activeTab === 'holiday'" class="tab-pane">
          <div class="form-group">
            <label>选择节日</label>
            <select v-model="selectedHoliday" @change="applyHoliday" class="select-input">
              <option value="" disabled>请选择节日</option>
              <option v-for="holiday in holidays" :key="holiday.name" :value="holiday.name">
                {{ holiday.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- 下班倒计时 -->
        <div v-if="activeTab === 'offwork'" class="tab-pane">
          <div class="form-group">
            <label>下班时间</label>
            <input 
              type="time" 
              v-model="offworkTime" 
              class="time-input"
              @change="applyOffwork"
            />
          </div>
          <button class="action-btn primary" @click="startOffworkCountdown">
            开始倒计时
          </button>
        </div>

        <!-- 自定义 -->
        <div v-if="activeTab === 'custom'" class="tab-pane">
          <div class="form-group">
            <label>事件名称</label>
            <input 
              type="text" 
              v-model="customName" 
              placeholder="输入事件名称"
              class="text-input"
              maxlength="20"
            />
          </div>
          <div class="form-group">
            <label>目标时间</label>
            <input 
              type="datetime-local" 
              v-model="customTime" 
              class="datetime-input"
            />
          </div>
          <button class="action-btn primary" @click="applyCustom" :disabled="!customName || !customTime">
            添加倒计时
          </button>

          <div v-if="customEvents.length > 0" class="event-list">
            <div class="list-title">已保存的事件</div>
            <div 
              v-for="(event, index) in customEvents" 
              :key="index"
              class="event-item"
            >
              <div class="event-info" @click="selectCustomEvent(index)">
                <span class="event-item-name">{{ event.name }}</span>
                <span class="event-item-time">{{ formatDateTime(event.time) }}</span>
              </div>
              <button 
                class="delete-btn" 
                @click.stop="deleteCustomEvent(index)"
                :aria-label="'删除事件'"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'

// Props
const props = defineProps({
  width: {
    type: String,
    default: '290px'
  },
  height: {
    type: String,
    default: '260px'
  },
  themeColor: {
    type: String,
    default: '#6366f1'
  },
  bgColor: {
    type: String,
    default: '#1e1b4b'
  },
  textColor: {
    type: String,
    default: '#ffffff'
  }
})

// 卡片样式
const cardStyles = computed(() => ({
  '--theme-color': props.themeColor,
  '--bg-color': props.bgColor,
  '--text-color': props.textColor,
  '--card-width': props.width,
  '--card-height': props.height
}))

// Tabs
const tabs = [
  { id: 'holiday', label: '节日' },
  { id: 'offwork', label: '下班' },
  { id: 'custom', label: '自定义' }
]

const activeTab = ref('holiday')
const showSettings = ref(false)

// 预设节日
const holidays = [
  { name: '春节', month: 1, day: 29, year: 2025 }, // 2025年春节
  { name: '元宵节', month: 2, day: 12, year: 2025 },
  { name: '清明节', month: 4, day: 4, year: 2025 },
  { name: '劳动节', month: 5, day: 1, year: 2025 },
  { name: '端午节', month: 5, day: 31, year: 2025 },
  { name: '中秋节', month: 10, day: 6, year: 2025 },
  { name: '国庆节', month: 10, day: 1, year: 2025 },
  { name: '元旦', month: 1, day: 1, year: 2026 }
]

// 状态
const currentEvent = reactive({
  name: '加载中...',
  targetTime: null,
  type: 'holiday'
})

const selectedHoliday = ref('')
const offworkTime = ref('18:00')
const customName = ref('')
const customTime = ref('')
const customEvents = ref([])

// 倒计时数据
const timeLeft = reactive({
  days: '00',
  hours: '00',
  minutes: '00',
  seconds: '00'
})

// 定时器
let countdownInterval = null

// 初始化
onMounted(() => {
  loadFromStorage()
  if (!currentEvent.targetTime) {
    selectedHoliday.value = '国庆节'
    applyHoliday()
  }
  startCountdown()
})

onUnmounted(() => {
  stopCountdown()
})

// 倒计时逻辑
function startCountdown() {
  stopCountdown()
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

function updateCountdown() {
  if (!currentEvent.targetTime) return

  const now = new Date().getTime()
  const target = new Date(currentEvent.targetTime).getTime()
  const diff = target - now

  if (diff <= 0) {
    timeLeft.days = '00'
    timeLeft.hours = '00'
    timeLeft.minutes = '00'
    timeLeft.seconds = '00'
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  timeLeft.days = String(days).padStart(2, '0')
  timeLeft.hours = String(hours).padStart(2, '0')
  timeLeft.minutes = String(minutes).padStart(2, '0')
  timeLeft.seconds = String(seconds).padStart(2, '0')
}

// 节日选择
function applyHoliday() {
  const holiday = holidays.find(h => h.name === selectedHoliday.value)
  if (holiday) {
    const targetDate = new Date(holiday.year, holiday.month - 1, holiday.day, 0, 0, 0)
    
    // 如果今年已过，设置为明年
    if (targetDate < new Date()) {
      targetDate.setFullYear(targetDate.getFullYear() + 1)
    }

    currentEvent.name = `距离${holiday.name}还有`
    currentEvent.targetTime = targetDate.toISOString()
    currentEvent.type = 'holiday'
    saveToStorage()
    startCountdown()
  }
}

// 下班倒计时
function startOffworkCountdown() {
  if (!offworkTime.value) return

  const now = new Date()
  const [hours, minutes] = offworkTime.value.split(':').map(Number)
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0)

  // 如果已过下班时间，设置为明天
  if (target < now) {
    target.setDate(target.getDate() + 1)
  }

  currentEvent.name = '距离下班还有'
  currentEvent.targetTime = target.toISOString()
  currentEvent.type = 'offwork'
  saveToStorage()
  startCountdown()
}

// 自定义事件
function applyCustom() {
  if (!customName.value || !customTime.value) return

  const event = {
    name: customName.value,
    time: customTime.value
  }

  customEvents.value.push(event)
  saveCustomEvents()

  currentEvent.name = `距离${customName.value}还有`
  currentEvent.targetTime = new Date(customTime.value).toISOString()
  currentEvent.type = 'custom'
  currentEvent.customIndex = customEvents.value.length - 1

  // 清空输入
  customName.value = ''
  customTime.value = ''

  saveToStorage()
  startCountdown()
}

function selectCustomEvent(index) {
  const event = customEvents.value[index]
  currentEvent.name = `距离${event.name}还有`
  currentEvent.targetTime = new Date(event.time).toISOString()
  currentEvent.type = 'custom'
  currentEvent.customIndex = index
  saveToStorage()
  startCountdown()
}

function deleteCustomEvent(index) {
  customEvents.value.splice(index, 1)
  saveCustomEvents()
  
  // 如果删除的是当前选中的事件，重置为节日
  if (currentEvent.type === 'custom' && currentEvent.customIndex === index) {
    selectedHoliday.value = '国庆节'
    applyHoliday()
  } else if (currentEvent.type === 'custom' && currentEvent.customIndex > index) {
    currentEvent.customIndex--
  }
}

// 格式化日期时间
function formatDateTime(datetime) {
  const date = new Date(datetime)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hours}:${minutes}`
}

// 本地存储
function saveToStorage() {
  const data = {
    name: currentEvent.name,
    targetTime: currentEvent.targetTime,
    type: currentEvent.type,
    customIndex: currentEvent.customIndex
  }
  localStorage.setItem('countdown-event', JSON.stringify(data))
}

function loadFromStorage() {
  try {
    const data = JSON.parse(localStorage.getItem('countdown-event'))
    if (data && data.targetTime) {
      currentEvent.name = data.name
      currentEvent.targetTime = data.targetTime
      currentEvent.type = data.type
      currentEvent.customIndex = data.customIndex
    }
  } catch (e) {
    console.warn('加载倒计时数据失败')
  }
}

function saveCustomEvents() {
  localStorage.setItem('countdown-custom-events', JSON.stringify(customEvents.value))
}

function loadCustomEvents() {
  try {
    const data = JSON.parse(localStorage.getItem('countdown-custom-events'))
    if (data && Array.isArray(data)) {
      customEvents.value = data
    }
  } catch (e) {
    console.warn('加载自定义事件失败')
  }
}

// 监听 activeTab 变化时加载自定义事件
watch(activeTab, (newTab) => {
  if (newTab === 'custom') {
    loadCustomEvents()
  }
})

// 暴露方法供外部使用
defineExpose({
  setEvent: (name, time) => {
    currentEvent.name = `距离${name}还有`
    currentEvent.targetTime = new Date(time).toISOString()
    currentEvent.type = 'custom'
    saveToStorage()
    startCountdown()
  },
  reset: () => {
    selectedHoliday.value = '国庆节'
    applyHoliday()
  }
})
</script>

<style scoped>
.countdown-card {
  --theme-color: #6366f1;
  --bg-color: #1e1b4b;
  --text-color: #ffffff;
  
  width: var(--card-width, 290px);
  height: var(--card-height, 260px);
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.16), transparent 30%),
    linear-gradient(160deg, color-mix(in srgb, var(--bg-color) 86%, #0f172a 14%), var(--bg-color));
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  box-shadow:
    0 18px 36px rgba(15, 23, 42, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  overflow: hidden;
  font-family: "Bahnschrift", "Segoe UI", sans-serif;
  color: var(--text-color);
  position: relative;
}

/* 主视图 */
.main-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  position: relative;
}

.settings-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.settings-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.settings-btn svg {
  width: 18px;
  height: 18px;
}

.countdown-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.time-segment {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 48px;
  padding: 12px 10px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
}

.time-value {
  font-size: 36px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  background: linear-gradient(135deg, var(--theme-color), #a855f7);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.time-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4px;
}

.time-separator {
  font-size: 28px;
  font-weight: 700;
  color: var(--theme-color);
  opacity: 0.6;
  margin-top: -8px;
}

.event-name {
  margin-top: 20px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
}

/* 设置面板 */
.settings-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* Tabs */
.tabs {
  display: flex;
  padding: 0 16px;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.tab {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
}

.tab:hover {
  color: rgba(255, 255, 255, 0.9);
}

.tab.active {
  color: var(--theme-color);
}

.tab.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--theme-color);
  border-radius: 2px 2px 0 0;
}

/* Tab 内容 */
.tab-content {
  flex: 1;
  overflow-y: auto;
  max-height: 320px;
  padding: 16px;
  box-sizing: border-box;
}

.tab-pane {
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 表单元素 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
}

.select-input,
.time-input,
.datetime-input,
.text-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-color);
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s ease;
}

.select-input:focus,
.time-input:focus,
.datetime-input:focus,
.text-input:focus {
  border-color: var(--theme-color);
}

.select-input option {
  background: var(--bg-color);
  color: var(--text-color);
}

.datetime-input,
.time-input {
  color-scheme: dark;
}

.text-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* 按钮 */
.action-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-btn.primary {
  background: var(--theme-color);
  color: white;
  box-shadow: 0 14px 26px rgba(15, 23, 42, 0.18);
}

.action-btn.primary:hover {
  filter: brightness(1.1);
}

.action-btn.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 事件列表 */
.event-list {
  margin-top: 16px;
}

.list-title {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.event-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.event-info {
  flex: 1;
  min-width: 0;
}

.event-item-name {
  display: block;
  font-size: 14px;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.event-item-time {
  display: block;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 2px;
}

.delete-btn {
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(239, 68, 68, 0.2);
  border-radius: 4px;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
  flex-shrink: 0;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.3);
}

/* 滚动条 */
.tab-content::-webkit-scrollbar {
  width: 4px;
}

.tab-content::-webkit-scrollbar-track {
  background: transparent;
}

.tab-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}
</style>
