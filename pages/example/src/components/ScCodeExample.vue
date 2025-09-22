<template>
  <div class="sc-code-example">
    <div class="example-header">
      <h2>ScCode 验证码输入组件示例</h2>
      <p>现代化的验证码输入组件，支持自动跳转、粘贴、键盘导航等功能</p>
    </div>

    <div class="example-content">
      <!-- 基础用法 -->
      <div class="example-section">
        <h3>基础用法</h3>
        <p>基本的验证码输入功能</p>
        <div class="example-demo">
          <ScCode 
            @complete="handleComplete" 
            @change="handleChange" 
            ref="basicCodeRef"
          />
        </div>
        <div class="example-result">
          <p><strong>当前值:</strong> {{ basicValue }}</p>
          <p><strong>完成状态:</strong> {{ basicCompleted ? '已完成' : '未完成' }}</p>
        </div>
        <div class="example-actions">
          <el-button @click="clearBasic">清空</el-button>
          <el-button @click="setBasicError" type="danger">设置错误状态</el-button>
        </div>
      </div>

      <!-- 禁用状态 -->
      <div class="example-section">
        <h3>禁用状态</h3>
        <p>禁用验证码输入</p>
        <div class="example-demo">
          <ScCode 
            :disabled="true"
            @complete="handleDisabledComplete" 
            @change="handleDisabledChange"
          />
        </div>
        <div class="example-result">
          <p><strong>当前值:</strong> {{ disabledValue }}</p>
        </div>
      </div>

      <!-- 自定义样式 -->
      <div class="example-section">
        <h3>事件监听</h3>
        <p>监听验证码输入的各种事件</p>
        <div class="example-demo">
          <ScCode 
            @complete="handleEventComplete" 
            @change="handleEventChange"
            ref="eventCodeRef"
          />
        </div>
        <div class="example-result">
          <div class="event-log">
            <h4>事件日志:</h4>
            <div class="log-container">
              <div 
                v-for="(log, index) in eventLogs" 
                :key="index" 
                class="log-item"
                :class="log.type"
              >
                <span class="log-time">{{ log.time }}</span>
                <span class="log-event">{{ log.event }}</span>
                <span class="log-value">{{ log.value }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="example-actions">
          <el-button @click="clearEvent">清空验证码</el-button>
          <el-button @click="clearLogs" type="info">清空日志</el-button>
          <el-button @click="setEventError" type="danger">触发错误</el-button>
        </div>
      </div>

      <!-- 功能演示 -->
      <div class="example-section">
        <h3>功能演示</h3>
        <p>演示验证码组件的各种功能特性</p>
        <div class="example-demo">
          <ScCode 
            @complete="handleDemoComplete" 
            @change="handleDemoChange"
            ref="demoCodeRef"
          />
        </div>
        <div class="example-result">
          <p><strong>当前值:</strong> {{ demoValue }}</p>
          <p><strong>验证状态:</strong> 
            <el-tag 
              :type="demoStatus === 'success' ? 'success' : demoStatus === 'error' ? 'danger' : 'info'"
            >
              {{ demoStatusText }}
            </el-tag>
          </p>
        </div>
        <div class="example-actions">
          <el-button @click="simulateSuccess" type="success">模拟验证成功</el-button>
          <el-button @click="simulateError" type="danger">模拟验证失败</el-button>
          <el-button @click="resetDemo">重置</el-button>
        </div>
      </div>
    </div>

    <!-- 代码示例 -->
    <div class="code-examples">
      <h3>代码示例</h3>
      
      <div class="code-section">
        <h4>基础用法</h4>
        <div class="code-block">
          <pre><code>{{ basicCodeExample }}</code></pre>
        </div>
      </div>

      <div class="code-section">
        <h4>禁用状态</h4>
        <div class="code-block">
          <pre><code>{{ disabledCodeExample }}</code></pre>
        </div>
      </div>

      <div class="code-section">
        <h4>事件处理</h4>
        <div class="code-block">
          <pre><code>{{ eventCodeExample }}</code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import ScCode from '@repo/components/ScCode/index.vue'

/**
 * ScCode组件示例
 * @author CH
 * @since 2025/1/20
 * @version 1.0.0
 */

// 基础用法
const basicValue = ref('')
const basicCompleted = ref(false)
const basicCodeRef = ref()

const handleComplete = (value: string) => {
  basicValue.value = value
  basicCompleted.value = true
  console.log('验证码输入完成:', value)
}

const handleChange = (value: string) => {
  basicValue.value = value
  basicCompleted.value = value.length === 6
}

const clearBasic = () => {
  basicCodeRef.value?.clear()
  basicCompleted.value = false
}

const setBasicError = () => {
  basicCodeRef.value?.setError(true)
}

// 禁用状态
const disabledValue = ref('')

const handleDisabledComplete = (value: string) => {
  disabledValue.value = value
}

const handleDisabledChange = (value: string) => {
  disabledValue.value = value
}

// 事件监听
const eventLogs = ref<Array<{time: string, event: string, value: string, type: string}>>([])
const eventCodeRef = ref()

const addLog = (event: string, value: string, type: string = 'info') => {
  const time = new Date().toLocaleTimeString()
  eventLogs.value.unshift({ time, event, value, type })
  // 限制日志数量
  if (eventLogs.value.length > 10) {
    eventLogs.value = eventLogs.value.slice(0, 10)
  }
}

const handleEventComplete = (value: string) => {
  addLog('完成输入', value, 'success')
}

const handleEventChange = (value: string) => {
  addLog('值变化', value, 'info')
}

const clearEvent = () => {
  eventCodeRef.value?.clear()
  addLog('清空验证码', '', 'warning')
}

const clearLogs = () => {
  eventLogs.value = []
}

const setEventError = () => {
  eventCodeRef.value?.setError(true)
  addLog('设置错误状态', '', 'error')
}

// 功能演示
const demoValue = ref('')
const demoStatus = ref('pending')
const demoCodeRef = ref()

const demoStatusText = computed(() => {
  switch (demoStatus.value) {
    case 'success': return '验证成功'
    case 'error': return '验证失败'
    default: return '等待输入'
  }
})

const handleDemoComplete = (value: string) => {
  demoValue.value = value
  // 模拟验证过程
  setTimeout(() => {
    if (value === '123456') {
      demoStatus.value = 'success'
    } else {
      demoStatus.value = 'error'
      demoCodeRef.value?.setError(true)
    }
  }, 1000)
}

const handleDemoChange = (value: string) => {
  demoValue.value = value
  if (value.length < 6) {
    demoStatus.value = 'pending'
  }
}

const simulateSuccess = () => {
  demoStatus.value = 'success'
  demoCodeRef.value?.setError(false)
}

const simulateError = () => {
  demoStatus.value = 'error'
  demoCodeRef.value?.setError(true)
}

const resetDemo = () => {
  demoValue.value = ''
  demoStatus.value = 'pending'
  demoCodeRef.value?.clear()
}

// 代码示例
const basicCodeExample = `<template>
  <ScCode 
    @complete="handleComplete" 
    @change="handleChange" 
    ref="codeRef"
  />
</template>

<script setup>
import { ref } from 'vue'
import ScCode from '@repo/components/ScCode/index.vue'

const codeRef = ref()

const handleComplete = (value) => {
  console.log('验证码输入完成:', value)
}

const handleChange = (value) => {
  console.log('验证码变化:', value)
}

// 清空验证码
const clear = () => {
  codeRef.value?.clear()
}

// 设置错误状态
const setError = () => {
  codeRef.value?.setError(true)
}
<\/script>`

const disabledCodeExample = `<template>
  <ScCode 
    :disabled="true"
    @complete="handleComplete" 
    @change="handleChange"
  />
</template>`

const eventCodeExample = `<template>
  <ScCode 
    @complete="handleComplete" 
    @change="handleChange"
    ref="codeRef"
  />
</template>

<script setup>
const handleComplete = (value) => {
  // 验证码输入完成时触发
  console.log('完成输入:', value)
}

const handleChange = (value) => {
  // 验证码值变化时触发
  console.log('值变化:', value)
}
<\/script>`
</script>

<style scoped lang="scss">
.sc-code-example {
  padding: 24px;
  background: var(--el-bg-color-overlay);
  border-radius: 8px;

  .example-header {
    margin-bottom: 32px;
    text-align: center;

    h2 {
      color: var(--el-text-color-primary);
      margin-bottom: 8px;
    }

    p {
      color: var(--el-text-color-regular);
      margin: 0;
    }
  }

  .example-content {
    .example-section {
      margin-bottom: 40px;
      padding: 24px;
      background: var(--el-fill-color-extra-light);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-lighter);

      h3 {
        color: var(--el-text-color-primary);
        margin-bottom: 8px;
        font-size: 18px;
      }

      > p {
        color: var(--el-text-color-regular);
        margin-bottom: 20px;
        font-size: 14px;
      }

      .example-demo {
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
        padding: 20px;
        background: var(--el-bg-color-overlay);
        border-radius: 6px;
        border: 1px solid var(--el-border-color-light);
      }

      .example-result {
        margin-bottom: 16px;
        padding: 16px;
        background: var(--el-bg-color-overlay);
        border-radius: 6px;
        border: 1px solid var(--el-border-color-light);

        p {
          margin: 8px 0;
          color: var(--el-text-color-regular);
          font-size: 14px;

          strong {
            color: var(--el-text-color-primary);
          }
        }

        .event-log {
          h4 {
            color: var(--el-text-color-primary);
            margin-bottom: 12px;
            font-size: 14px;
          }

          .log-container {
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid var(--el-border-color-lighter);
            border-radius: 4px;
            background: var(--el-fill-color-blank);

            .log-item {
              display: flex;
              align-items: center;
              padding: 8px 12px;
              border-bottom: 1px solid var(--el-border-color-extra-light);
              font-size: 12px;
              font-family: 'Courier New', monospace;

              &:last-child {
                border-bottom: none;
              }

              &.success {
                background: var(--el-color-success-light-9);
                color: var(--el-color-success);
              }

              &.error {
                background: var(--el-color-danger-light-9);
                color: var(--el-color-danger);
              }

              &.warning {
                background: var(--el-color-warning-light-9);
                color: var(--el-color-warning);
              }

              .log-time {
                min-width: 80px;
                color: var(--el-text-color-placeholder);
              }

              .log-event {
                min-width: 80px;
                font-weight: 500;
              }

              .log-value {
                flex: 1;
                font-weight: 600;
              }
            }
          }
        }
      }

      .example-actions {
        display: flex;
        gap: 12px;
        flex-wrap: wrap;
      }
    }
  }

  .code-examples {
    margin-top: 40px;

    h3 {
      color: var(--el-text-color-primary);
      margin-bottom: 20px;
      font-size: 20px;
    }

    .code-section {
      margin-bottom: 24px;

      h4 {
        color: var(--el-text-color-primary);
        margin-bottom: 12px;
        font-size: 16px;
      }

      .code-block {
        background: var(--el-fill-color-dark);
        border-radius: 6px;
        padding: 16px;
        overflow-x: auto;

        pre {
          margin: 0;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;

          code {
            color: var(--el-text-color-primary);
            background: transparent;
          }
        }
      }
    }
  }
}

// 暗黑模式适配
.el-dark {
  .sc-code-example {
    .code-examples {
      .code-section {
        .code-block {
          background: var(--el-fill-color-darker);
          border: 1px solid var(--el-border-color-dark);

          pre code {
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .sc-code-example {
    padding: 16px;

    .example-content {
      .example-section {
        padding: 16px;

        .example-actions {
          justify-content: center;
        }
      }
    }
  }
}
</style>