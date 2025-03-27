<template>
  <el-dialog v-model="visiable" :title="title" width="80%" :close-on-click-modal="false" destroy-on-close draggable
    class="thread-dialog" @close="close">
    <div class="thread-container">
      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="6" animated />

      <!-- 空状态 -->
      <el-empty v-else-if="!data || data.length === 0" description="暂无线程数据" />

      <!-- 线程列表 -->
      <div v-else class="thread-list">
        <transition-group name="thread-fade">
          <div v-for="(item, i) in data" :key="i" class="thread-card"
            :class="{ 'is-active': item.threadState === 'RUNNABLE' }">
            <!-- 线程卡片头部 -->
            <div class="thread-header">
              <div class="thread-status">
                <IconifyIconOnline :icon="getThreadStateIcon(item.threadState)"
                  :class="['thread-icon', `status-${item.threadState.toLowerCase()}`]" />
                <span class="thread-name">{{ item.threadName }}</span>
              </div>
              <el-tag :type="getThreadStateType(item.threadState)" size="small" class="thread-state">
                {{ item.threadState }}
              </el-tag>
            </div>

            <!-- 线程堆栈信息 -->
            <div v-if="item.stackTrace.length > 0" class="thread-stack">
              <pre ref="sqlPre" class="language-java line-numbers">
<code class="language-java">{{ getMessage(item.stackTrace) }}</code>
              </pre>
            </div>
          </div>
        </transition-group>
      </div>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { fetchActuatorCall } from "@/api/monitor/actuator"
import Prism from "prismjs"
import "prismjs/components/prism-java.min.js"
import "prismjs/themes/prism-tomorrow.min.css"
import "prismjs/plugins/line-numbers/prism-line-numbers.min.css"

const visiable = ref(false)
const loading = ref(true)
const row = ref({})
const data = ref([])

// 计算标题
const title = computed(() =>
  `${row.value?.metadata?.applicationName || '未知应用'} 线程监控 (${data.value.length})`
)

// 获取线程状态图标
const getThreadStateIcon = (state) => {
  switch (state) {
    case 'RUNNABLE': return 'ep:caret-right'
    case 'WAITING':
    case 'TIMED_WAITING': return 'ri:pause-fill'
    default: return 'ep:close'
  }
}

// 获取线程状态类型
const getThreadStateType = (state) => {
  switch (state) {
    case 'RUNNABLE': return 'success'
    case 'WAITING':
    case 'TIMED_WAITING': return 'warning'
    default: return 'info'
  }
}

// 格式化堆栈信息
const getMessage = (stackTrace) => {
  return stackTrace
    .map(it => `${it.className}#${it.methodName}:${it.lineNumber} (${it.moduleName} ${it.moduleVersion})`)
    .join('\n')
}

// 高亮代码
const highlightCode = () => {
  setTimeout(() => {
    Prism.highlightAll()
  }, 300)
}

// 关闭对话框
const close = () => {
  visiable.value = false
  data.value = []
  loading.value = true
}

// 打开对话框
const open = async (item) => {
  loading.value = true
  visiable.value = true
  row.value = item

  try {
    const res = await fetchActuatorCall({
      url: `http://${item.host}:${item.port}${item.metadata.contextPath}${item.metadata.endpointsUrl}/thread`,
      method: "GET",
      body: JSON.stringify(item)
    })

    if (res.code === "00000") {
      data.value = JSON.parse(res.data) || []
      highlightCode()
    }
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<style lang="scss" scoped>
.thread-container {
  height: 600px;
  overflow: auto;
  padding: 16px;

  .thread-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .thread-card {
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-lighter);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--el-box-shadow);
    }

    &.is-active {
      border-left: 4px solid var(--el-color-success);
    }
  }

  .thread-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .thread-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .thread-icon {
    font-size: 18px;

    &.status-runnable {
      color: var(--el-color-success);
    }

    &.status-waiting,
    &.status-timed_waiting {
      color: var(--el-color-warning);
    }

    &.status-blocked {
      color: var(--el-color-danger);
    }
  }

  .thread-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--el-text-color-primary);
  }

  .thread-stack {
    padding: 16px;
    background: var(--el-bg-color);
    border-radius: 0 0 8px 8px;

    pre {
      margin: 0;
      font-size: 13px;
    }
  }
}

// 动画效果
.thread-fade-enter-active,
.thread-fade-leave-active {
  transition: all 0.3s ease;
}

.thread-fade-enter-from,
.thread-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

// 暗黑模式适配
:root[data-theme='dark'] {
  .thread-card {
    background: var(--el-bg-color);
  }
}
</style>