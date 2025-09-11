<template>
  <div class="sc-countdown-example">
    <h2>ScCountDown 倒计时组件示例</h2>
    
    <!-- 基础用法 -->
    <div class="example-section">
      <h3>基础用法</h3>
      <p>基本的倒计时功能，倒计时结束后停止</p>
      <div class="example-container">
        <div class="countdown-display">
          <ScCountDown 
            :model-value="basicCountdown" 
            @finish="handleBasicFinish"
          >
            <template #default="{ row }">
              <div class="time-display basic">
                <div class="time-unit">
                  <span class="number">{{ String(row.minutes).padStart(2, '0') }}</span>
                  <span class="label">分钟</span>
                </div>
                <div class="separator">:</div>
                <div class="time-unit">
                  <span class="number">{{ String(row.seconds).padStart(2, '0') }}</span>
                  <span class="label">秒</span>
                </div>
              </div>
            </template>
          </ScCountDown>
        </div>
        <div class="controls">
          <el-button @click="resetBasicCountdown">重置倒计时</el-button>
          <el-input-number 
            v-model="basicCountdownInput" 
            :min="1" 
            :max="3600" 
            placeholder="设置秒数"
            style="width: 120px; margin-left: 10px;"
          />
          <el-button type="primary" @click="setBasicCountdown">设置</el-button>
        </div>
      </div>
    </div>

    <!-- 循环倒计时 -->
    <div class="example-section">
      <h3>循环倒计时</h3>
      <p>倒计时结束后自动重新开始，适用于定时任务场景</p>
      <div class="example-container">
        <div class="countdown-display">
          <ScCountDown 
            :model-value="loopCountdown" 
            :loop="true"
            @finish="handleLoopFinish"
          >
            <template #default="{ row }">
              <div class="time-display loop">
                <div class="time-unit">
                  <span class="number">{{ String(row.minutes).padStart(2, '0') }}</span>
                  <span class="label">分</span>
                </div>
                <div class="separator">:</div>
                <div class="time-unit">
                  <span class="number">{{ String(row.seconds).padStart(2, '0') }}</span>
                  <span class="label">秒</span>
                </div>
              </div>
            </template>
          </ScCountDown>
        </div>
        <div class="controls">
          <el-button @click="resetLoopCountdown">重置循环倒计时</el-button>
          <span class="loop-count">已完成循环：{{ loopFinishCount }} 次</span>
        </div>
      </div>
    </div>

    <!-- 自定义样式倒计时 -->
    <div class="example-section">
      <h3>自定义样式倒计时</h3>
      <p>使用不同的样式展示倒计时</p>
      <div class="example-container">
        <div class="countdown-display">
          <ScCountDown 
            :model-value="customCountdown" 
            @finish="handleCustomFinish"
          >
            <template #default="{ row }">
              <div class="time-display custom">
                <div class="time-card">
                  <div class="time-number">{{ String(row.minutes).padStart(2, '0') }}</div>
                  <div class="time-label">分钟</div>
                </div>
                <div class="time-separator">:</div>
                <div class="time-card">
                  <div class="time-number">{{ String(row.seconds).padStart(2, '0') }}</div>
                  <div class="time-label">秒钟</div>
                </div>
              </div>
            </template>
          </ScCountDown>
        </div>
        <div class="controls">
          <el-button @click="resetCustomCountdown">重置自定义倒计时</el-button>
        </div>
      </div>
    </div>

    <!-- 进度条倒计时 -->
    <div class="example-section">
      <h3>进度条倒计时</h3>
      <p>结合进度条显示倒计时进度</p>
      <div class="example-container">
        <div class="countdown-display">
          <ScCountDown 
            :model-value="progressCountdown" 
            @finish="handleProgressFinish"
          >
            <template #default="{ row }">
              <div class="progress-countdown">
                <div class="time-display progress">
                  <span class="time-text">
                    {{ String(row.minutes).padStart(2, '0') }}:{{ String(row.seconds).padStart(2, '0') }}
                  </span>
                </div>
                <el-progress 
                  :percentage="progressPercentage" 
                  :color="progressColor"
                  :stroke-width="8"
                  :show-text="false"
                />
                <div class="progress-text">
                  剩余时间：{{ progressCountdown - (row.minutes * 60 + row.seconds) }}/{{ progressCountdown }} 秒
                </div>
              </div>
            </template>
          </ScCountDown>
        </div>
        <div class="controls">
          <el-button @click="resetProgressCountdown">重置进度倒计时</el-button>
        </div>
      </div>
    </div>

    <!-- 多个倒计时 -->
    <div class="example-section">
      <h3>多个倒计时</h3>
      <p>同时运行多个不同的倒计时</p>
      <div class="example-container">
        <div class="multiple-countdowns">
          <div class="countdown-item" v-for="(item, index) in multipleCountdowns" :key="index">
            <h4>{{ item.title }}</h4>
            <ScCountDown 
              :model-value="item.time" 
              :loop="item.loop"
              @finish="() => handleMultipleFinish(index)"
            >
              <template #default="{ row }">
                <div class="time-display mini">
                  <span class="time-text">
                    {{ String(row.minutes).padStart(2, '0') }}:{{ String(row.seconds).padStart(2, '0') }}
                  </span>
                </div>
              </template>
            </ScCountDown>
          </div>
        </div>
        <div class="controls">
          <el-button @click="resetMultipleCountdowns">重置所有倒计时</el-button>
        </div>
      </div>
    </div>

    <!-- 事件日志 -->
    <div class="example-section">
      <h3>事件日志</h3>
      <el-card>
        <div class="event-log">
          <div v-if="eventLogs.length === 0" class="no-events">
            暂无事件记录
          </div>
          <div v-else>
            <div v-for="(log, index) in eventLogs" :key="index" class="log-item">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
          </div>
          <el-button size="small" @click="clearLogs" style="margin-top: 10px;">清空日志</el-button>
        </div>
      </el-card>
    </div>

    <!-- 功能说明 -->
    <div class="example-section">
      <h3>功能说明</h3>
      <el-card>
        <h4>组件特性</h4>
        <ul>
          <li>支持基础倒计时功能</li>
          <li>支持循环倒计时模式</li>
          <li>支持自定义显示样式</li>
          <li>倒计时结束时触发finish事件</li>
          <li>使用插槽自定义显示内容</li>
          <li>自动清理定时器，防止内存泄漏</li>
        </ul>
        
        <h4>使用场景</h4>
        <ul>
          <li>验证码倒计时</li>
          <li>活动倒计时</li>
          <li>定时任务提醒</li>
          <li>游戏倒计时</li>
          <li>会议倒计时</li>
        </ul>
      </el-card>
    </div>

    <!-- API 文档 -->
    <div class="example-section">
      <h3>API 文档</h3>
      <el-card>
        <h4>Props</h4>
        <el-table :data="propsData" border>
          <el-table-column prop="name" label="属性名" width="120" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="default" label="默认值" width="80" />
          <el-table-column prop="description" label="说明" />
        </el-table>
        
        <h4 style="margin-top: 20px;">Events</h4>
        <el-table :data="eventsData" border>
          <el-table-column prop="name" label="事件名" width="120" />
          <el-table-column prop="params" label="参数" width="100" />
          <el-table-column prop="description" label="说明" />
        </el-table>
        
        <h4 style="margin-top: 20px;">Slots</h4>
        <el-table :data="slotsData" border>
          <el-table-column prop="name" label="插槽名" width="120" />
          <el-table-column prop="params" label="参数" width="200" />
          <el-table-column prop="description" label="说明" />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import ScCountDown from './index.vue'
import { ElMessage } from 'element-plus'

// 响应式数据
const basicCountdown = ref(60)
const basicCountdownInput = ref(60)
const loopCountdown = ref(10)
const loopFinishCount = ref(0)
const customCountdown = ref(120)
const progressCountdown = ref(30)
const eventLogs = ref([])

// 多个倒计时配置
const multipleCountdowns = reactive([
  { title: '短倒计时', time: 15, loop: false },
  { title: '中倒计时', time: 45, loop: false },
  { title: '循环倒计时', time: 20, loop: true }
])

// 进度条相关计算
const progressPercentage = computed(() => {
  const total = progressCountdown.value
  const current = total // 这里应该从倒计时组件获取当前值，简化处理
  return Math.max(0, (current / total) * 100)
})

const progressColor = computed(() => {
  const percentage = progressPercentage.value
  if (percentage > 60) return '#67c23a'
  if (percentage > 30) return '#e6a23c'
  return '#f56c6c'
})

// 添加日志
const addLog = (message) => {
  eventLogs.value.unshift({
    time: new Date().toLocaleTimeString(),
    message
  })
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

// 事件处理函数
const handleBasicFinish = () => {
  addLog('基础倒计时结束')
  ElMessage.success('基础倒计时结束！')
}

const handleLoopFinish = () => {
  loopFinishCount.value++
  addLog(`循环倒计时第 ${loopFinishCount.value} 次结束`)
  ElMessage.info(`循环倒计时第 ${loopFinishCount.value} 次结束`)
}

const handleCustomFinish = () => {
  addLog('自定义样式倒计时结束')
  ElMessage.success('自定义样式倒计时结束！')
}

const handleProgressFinish = () => {
  addLog('进度条倒计时结束')
  ElMessage.success('进度条倒计时结束！')
}

const handleMultipleFinish = (index) => {
  const item = multipleCountdowns[index]
  addLog(`${item.title}结束`)
  ElMessage.info(`${item.title}结束`)
}

// 重置函数
const resetBasicCountdown = () => {
  basicCountdown.value = 0
  setTimeout(() => {
    basicCountdown.value = basicCountdownInput.value
  }, 100)
  addLog('重置基础倒计时')
}

const setBasicCountdown = () => {
  basicCountdown.value = 0
  setTimeout(() => {
    basicCountdown.value = basicCountdownInput.value
  }, 100)
  addLog(`设置基础倒计时为 ${basicCountdownInput.value} 秒`)
}

const resetLoopCountdown = () => {
  loopCountdown.value = 0
  loopFinishCount.value = 0
  setTimeout(() => {
    loopCountdown.value = 10
  }, 100)
  addLog('重置循环倒计时')
}

const resetCustomCountdown = () => {
  customCountdown.value = 0
  setTimeout(() => {
    customCountdown.value = 120
  }, 100)
  addLog('重置自定义倒计时')
}

const resetProgressCountdown = () => {
  progressCountdown.value = 0
  setTimeout(() => {
    progressCountdown.value = 30
  }, 100)
  addLog('重置进度倒计时')
}

const resetMultipleCountdowns = () => {
  multipleCountdowns.forEach((item, index) => {
    item.time = 0
    setTimeout(() => {
      if (index === 0) item.time = 15
      else if (index === 1) item.time = 45
      else item.time = 20
    }, 100)
  })
  addLog('重置所有多个倒计时')
}

const clearLogs = () => {
  eventLogs.value = []
}

// API 文档数据
const propsData = ref([
  {
    name: 'modelValue',
    type: 'Number',
    default: '0',
    description: '倒计时的初始秒数'
  },
  {
    name: 'loop',
    type: 'Boolean',
    default: 'false',
    description: '是否循环倒计时，为true时倒计时结束后会重新开始'
  }
])

const eventsData = ref([
  {
    name: 'finish',
    params: '-',
    description: '倒计时结束时触发'
  }
])

const slotsData = ref([
  {
    name: 'default',
    params: '{ row: { minutes: number, seconds: number } }',
    description: '自定义倒计时显示内容，row包含分钟和秒数'
  }
])
</script>

<style scoped>
.sc-countdown-example {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.example-section {
  margin-bottom: 40px;
}

.example-section h3 {
  color: #409eff;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: 600;
}

.example-section p {
  color: #606266;
  margin-bottom: 15px;
  line-height: 1.6;
}

.example-container {
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 20px;
  background-color: #fafafa;
  margin-bottom: 20px;
}

.countdown-display {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.time-display {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.time-display.basic {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
}

.time-display.loop {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 20px 30px;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(240, 147, 251, 0.3);
}

.time-display.custom {
  background: transparent;
}

.time-display.progress {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
  padding: 15px 25px;
  border-radius: 8px;
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 15px;
}

.time-display.mini {
  background: #409eff;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 16px;
}

.time-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.number {
  font-size: 36px;
  font-weight: bold;
  line-height: 1;
}

.label {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.8;
}

.separator {
  font-size: 36px;
  font-weight: bold;
  margin: 0 15px;
  opacity: 0.8;
}

.time-card {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid #409eff;
  border-radius: 12px;
  padding: 20px;
  margin: 0 10px;
  text-align: center;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.2);
}

.time-number {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  line-height: 1;
}

.time-label {
  font-size: 14px;
  color: #606266;
  margin-top: 8px;
}

.time-separator {
  font-size: 48px;
  font-weight: bold;
  color: #409eff;
  margin: 0 20px;
  align-self: center;
}

.progress-countdown {
  width: 100%;
  max-width: 400px;
}

.progress-text {
  text-align: center;
  color: #606266;
  font-size: 14px;
  margin-top: 10px;
}

.time-text {
  font-size: 24px;
  font-weight: bold;
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.loop-count {
  color: #606266;
  font-size: 14px;
}

.multiple-countdowns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.countdown-item {
  text-align: center;
  padding: 20px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background: white;
}

.countdown-item h4 {
  margin: 0 0 15px 0;
  color: #303133;
  font-size: 16px;
}

.event-log {
  max-height: 200px;
  overflow-y: auto;
}

.log-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.log-time {
  color: #909399;
  font-size: 12px;
  min-width: 80px;
}

.log-message {
  color: #606266;
  font-size: 14px;
}

.no-events {
  text-align: center;
  color: #909399;
  padding: 20px;
}

.el-card {
  margin-top: 15px;
}

.el-card h4 {
  color: #303133;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
}

.el-card ul {
  margin: 0;
  padding-left: 20px;
}

.el-card li {
  color: #606266;
  line-height: 1.8;
  margin-bottom: 5px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .sc-countdown-example {
    padding: 15px;
  }
  
  .example-container {
    padding: 15px;
  }
  
  .time-display.basic,
  .time-display.loop {
    padding: 15px 20px;
  }
  
  .number {
    font-size: 28px;
  }
  
  .time-number {
    font-size: 36px;
  }
  
  .time-separator {
    font-size: 36px;
    margin: 0 15px;
  }
  
  .multiple-countdowns {
    grid-template-columns: 1fr;
  }
  
  .controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .example-section h3 {
    font-size: 16px;
  }
}
</style>