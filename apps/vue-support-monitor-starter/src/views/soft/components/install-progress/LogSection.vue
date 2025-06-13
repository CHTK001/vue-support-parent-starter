<template>
  <div class="log-section">
    <div class="logs-header pb-2 mb-3">
      <div class="section-title flex items-center justify-between">
        <div class="flex items-center flex-wrap">
          <div class="flex items-center">
            <IconifyIconOnline icon="ep:document" class="mr-2 text-primary text-xl" />
            安装日志
            <span v-if="activeLogType === 'install' && getInstallProgress() > 0" class="ml-2 text-sm text-primary font-medium">
              ({{ getInstallProgress() }}%)
            </span>
          </div>
          <div v-if="activeLogType === 'install' && getInstallProgress() > 0" class="install-progress-bar ml-3 flex-1 min-w-[100px] max-w-[200px]">
            <el-progress 
              :percentage="getInstallProgress()" 
              :status="getProgressStatus()" 
              :stroke-width="8" 
              :show-text="true"
              :format="() => getProgressFormatText()"
              :color="progressBarColor"
            />
          </div>
        </div>
        <div class="flex items-center">
          <!-- 服务日志监控按钮 - 当设备配置了serviceLogPath时显示 -->
          <el-tooltip v-if="hasServiceLogPath" :content="isMonitoringLogs ? '停止日志监控' : '开启日志监控'" placement="top">
            <el-button 
              :type="isMonitoringLogs ? 'danger' : 'success'" 
              size="small"
              class="mr-3"
              :icon="useRenderIcon(isMonitoringLogs ? 'ep:video-pause' : 'ep:video-play')" 
              :loading="monitorLoading" 
              @click="handleToggleMonitor" 
            >
              {{ isMonitoringLogs ? '停止监控' : '开启监控' }}
            </el-button>
          </el-tooltip>
          
          <div class="log-tabs">
            <el-radio-group v-model="activeLogType" size="small" class="log-type-tabs" @change="handleLogTypeChange">
              <el-radio-button label="install">安装日志</el-radio-button>
              <el-radio-button label="start" :disabled="!canViewServiceLogs">启动日志</el-radio-button>
              <el-radio-button label="stop" :disabled="!canViewServiceLogs">停止日志</el-radio-button>
              <el-radio-button label="restart" :disabled="!canViewServiceLogs">重启日志</el-radio-button>
              <el-radio-button label="uninstall" :disabled="!canViewServiceLogs">卸载日志</el-radio-button>
              <el-radio-button label="monitor" :disabled="!canViewServiceLogs || !hasServiceLogPath">实时监控</el-radio-button>
            </el-radio-group>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 使用xterm.js渲染终端 -->
    <div class="terminal-container" :style="{ height: logsHeight }" ref="terminalContainer"></div>
    
    <div class="log-footer mt-4 flex justify-between items-center">
      <div class="status-info flex items-center">
        <el-tag :type="getStatusTagType(installStatus)" size="large" effect="dark" class="status-tag">
          <IconifyIconOnline :icon="getStatusIcon(installStatus)" class="mr-1" />
          {{ getInstallStatusText() }}
        </el-tag>
      </div>
      <div class="action-buttons">
        <el-button size="small" @click="clearTerminal" plain type="info">
          <IconifyIconOnline icon="ep:delete" class="mr-1" />
          清空日志
        </el-button>
        <el-button size="small" type="primary" @click="exportTerminalLogs" plain>
          <IconifyIconOnline icon="ep:download" class="mr-1" />
          导出日志
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import { WebLinksAddon } from 'xterm-addon-web-links'
import 'xterm/css/xterm.css'
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";

const props = defineProps({
  logs: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  logsHeight: {
    type: String,
    default: 'calc(100vh - 450px)'
  },
  installStatus: {
    type: String,
    default: 'pending'
  },
  canViewServiceLogs: {
    type: Boolean,
    default: false
  },
  installProgress: {
    type: Number,
    default: 0
  },
  hasServiceLogPath: {
    type: Boolean,
    default: false
  },
  isMonitoringLogs: {
    type: Boolean,
    default: false
  },
  monitorLoading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['log-type-change', 'clear', 'export', 'scroll-to-bottom', 'toggle-monitor'])

const activeLogType = ref('install')
const terminalContainer = ref(null)
const terminal = ref<Terminal | null>(null)
const fitAddon = ref<FitAddon | null>(null)
const terminalLogs = ref<string[]>([])

// 记录最高进度值
const highestProgress = ref(0);

// 添加渐变颜色的计算属性
const progressBarColor = computed(() => {
  if (props.installStatus === 'error') {
    return '#f56c6c' // 错误状态为红色
  }
  return getInstallProgress() === 100 ? '#67c23a' : '#409eff'
})

// 初始化终端
const initTerminal = () => {
  if (!terminalContainer.value) return
  
  // 创建终端实例
  terminal.value = new Terminal({
    fontFamily: '"Cascadia Code", "Fira Code", Menlo, Monaco, Consolas, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 1.5,
    theme: {
      background: '#f8f9fa',
      foreground: '#303133',
      cursor: '#409eff',
      cursorAccent: '#f8f9fa',
      selection: 'rgba(64, 158, 255, 0.3)',
      black: '#000000',
      red: '#e54d42',
      green: '#67c23a',
      yellow: '#e6a23c',
      blue: '#409eff',
      magenta: '#c678dd',
      cyan: '#56b6c2',
      white: '#ffffff',
      brightBlack: '#5c6370',
      brightRed: '#f56c6c',
      brightGreen: '#87d068',
      brightYellow: '#f1c40f',
      brightBlue: '#60acfc',
      brightMagenta: '#d55fde',
      brightCyan: '#26c6da',
      brightWhite: '#ffffff',
    },
    cursorBlink: true,
    cursorStyle: 'bar',
    scrollback: 5000,
    disableStdin: true,
    convertEol: true,
    fastScrollModifier: 'alt', // 按住Alt键快速滚动
    fastScrollSensitivity: 5,   // 快速滚动灵敏度
    smoothScrollDuration: 300, // 平滑滚动持续时间
    rendererType: 'canvas', // 使用canvas渲染器提升性能
    allowTransparency: false
  })
  
  // 添加自适应插件
  fitAddon.value = new FitAddon()
  terminal.value.loadAddon(fitAddon.value)
  
  // 添加链接插件
  terminal.value.loadAddon(new WebLinksAddon())
  
  // 打开终端
  terminal.value.open(terminalContainer.value)
  
  // 自适应大小
  nextTick(() => {
    fitAddon.value?.fit()
  })
  
  // 显示现有日志
  renderLogs()
}

// 写入终端
const writeToTerminal = (text: string) => {
  if (!terminal.value) return
  
  // 保存日志以便导出
  terminalLogs.value.push(text.replace(/\x1b\[[0-9;]*m/g, '')) // 移除ANSI颜色代码
  
  // 写入终端
  terminal.value.write(text)
}

// 格式化时间
const formatTime = (date: Date) => {
  const d = new Date(date)
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const seconds = d.getSeconds().toString().padStart(2, '0')
  return `${hours}:${minutes}:${seconds}`
}

// 上次渲染的日志数量
const lastLogCount = ref(0)

// 渲染日志到终端
const renderLogs = () => {
  if (!terminal.value || !props.logs) return
  
  // 如果是首次渲染或日志类型变更，重新渲染全部
  if (lastLogCount.value === 0 || props.logs.length < lastLogCount.value) {
    // 清空终端
    terminal.value.clear()
    
    // 重置保存的日志
    terminalLogs.value = []
    
    // 显示欢迎消息
    writeToTerminal('\x1b[1;34m欢迎使用安装日志终端\x1b[0m\r\n')
    writeToTerminal('\x1b[2;90m--------------------------------------\x1b[0m\r\n')
    writeToTerminal(`\x1b[90m当前日志类型: \x1b[1;32m${getLogTypeText()}\x1b[0m\r\n`)
    writeToTerminal(`\x1b[90m会话开始时间: \x1b[1;36m${formatTime(new Date())}\x1b[0m\r\n`)
    writeToTerminal('\x1b[2;90m--------------------------------------\x1b[0m\r\n\r\n')
    
    // 渲染所有日志
    if (props.logs.length > 0) {
      props.logs.forEach(log => {
        writeLogLine(log)
      })
    }
  } 
  // 增量渲染新增的日志
  else if (props.logs.length > lastLogCount.value) {
    // 只渲染新增的日志
    for (let i = lastLogCount.value; i < props.logs.length; i++) {
      writeLogLine(props.logs[i])
    }
  }
  
  // 更新日志计数
  lastLogCount.value = props.logs.length
  
  // 滚动到底部（使用requestAnimationFrame确保在渲染完成后滚动）
  if (props.logs.length > 0) {
    requestAnimationFrame(() => {
      terminal.value?.scrollToBottom()
    })
  }
}

// 写入单行日志
const writeLogLine = (log: any) => {
  if (!log) return
  
  const time = formatTime(log.timestamp || new Date())
  const content = log.msg || ''
  let logLine = `\x1b[2;90m[${time}]\x1b[0m `
  
  // 根据日志类型设置颜色和图标
  switch (log.type) {
    case 'error':
      logLine += `\x1b[31m❌ ${content}\x1b[0m`
      break
    case 'warning':
      logLine += `\x1b[33m⚠️ ${content}\x1b[0m`
      break
    case 'success':
      logLine += `\x1b[32m✅ ${content}\x1b[0m`
      break
    case 'info':
      logLine += `\x1b[36mℹ️ ${content}\x1b[0m`
      break
    default:
      logLine += `\x1b[34m→ ${content}\x1b[0m`
  }
  
  // 添加换行符
  logLine += '\r\n'
  
  // 写入终端
  writeToTerminal(content)
}

// _isClearing 标记，用于防止循环调用
const _isClearing = ref(false)

// 清空终端
const clearTerminal = () => {
  if (!terminal.value) return
  
  // 设置清空标记，防止循环调用
  _isClearing.value = true
  
  terminal.value.clear()
  terminalLogs.value = []
  
  // 重置日志计数，确保下次重新渲染全部日志
  lastLogCount.value = 0
  
  // 显示清空消息
  writeToTerminal('\x1b[2;90m--------------------------------------\x1b[0m\r\n')
  writeToTerminal(`\x1b[1;33m日志已清空\x1b[0m\r\n`)
  writeToTerminal(`\x1b[90m继续监听\x1b[1;32m${getLogTypeText()}\x1b[0m\r\n`)
  writeToTerminal(`\x1b[90m清空时间: \x1b[36m${formatTime(new Date())}\x1b[0m\r\n`)
  writeToTerminal('\x1b[2;90m--------------------------------------\x1b[0m\r\n\r\n')
  
  // 触发清空事件
  emit('clear')
  
  // 延迟清除标记
  setTimeout(() => {
    _isClearing.value = false
  }, 100)
}

// 导出日志
const exportTerminalLogs = () => {
  // 合并所有日志
  const logContent = terminalLogs.value.join('\n')
  
  // 创建 Blob 对象
  const blob = new Blob([logContent], { type: 'text/plain' })
  
  // 创建下载链接
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `log-${activeLogType.value}-${new Date().toISOString().slice(0, 10)}.txt`
  
  // 触发点击事件
  document.body.appendChild(link)
  link.click()
  
  // 清理
  document.body.removeChild(link)
  
  // 触发导出事件
  emit('export')
}

// 获取日志类型文本
const getLogTypeText = () => {
  switch (activeLogType.value) {
    case 'install': return '安装日志'
    case 'start': return '启动日志'
    case 'stop': return '停止日志'
    case 'restart': return '重启日志'
    case 'uninstall': return '卸载日志'
    case 'monitor': return '实时监控'
    default: return '日志'
  }
}

// 处理日志类型变更
const handleLogTypeChange = (type: string) => {
  // 如果切换到监控标签，且还没有开启监控，自动开启监控
  if (type === 'monitor' && props.hasServiceLogPath && !props.isMonitoringLogs) {
    emit('toggle-monitor')
  }
  
  // 清空终端
  if (terminal.value) {
    terminal.value.clear()
    terminalLogs.value = []
    
    // 重置日志计数，确保下次重新渲染全部日志
    lastLogCount.value = 0
    
    // 显示日志类型变更消息
    writeToTerminal('\x1b[2;90m--------------------------------------\x1b[0m\r\n')
    writeToTerminal(`\x1b[1;36m日志类型已切换\x1b[0m\r\n`)
    writeToTerminal(`\x1b[90m当前日志类型: \x1b[1;32m${getLogTypeText()}\x1b[0m\r\n`)
    writeToTerminal(`\x1b[90m切换时间: \x1b[36m${formatTime(new Date())}\x1b[0m\r\n`)
    writeToTerminal('\x1b[2;90m--------------------------------------\x1b[0m\r\n\r\n')
  }
  
  // 触发日志类型变更事件
  emit('log-type-change', type)
}

// 获取状态标签类型
const getStatusTagType = (status: string) => {
  switch (status) {
    case 'pending': return 'info'
    case 'running': return 'warning'
    case 'success': return 'success'
    case 'error': return 'danger'
    default: return 'info'
  }
}

// 获取安装状态文本
const getInstallStatusText = () => {
  switch (props.installStatus) {
    case 'pending': return '等待安装'
    case 'running': return '安装中'
    case 'success': return '安装成功'
    case 'error': return '安装失败'
    default: return '未知状态'
  }
}

// 获取状态图标
const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return 'ep:time'
    case 'running': return 'ep:loading'
    case 'success': return 'ep:check'
    case 'error': return 'ep:close'
    default: return 'ep:info'
  }
}

// 获取安装进度
const getInstallProgress = () => {
  // 更新最高进度值
  if (props.installProgress > highestProgress.value) {
    highestProgress.value = props.installProgress;
  }
  
  // 始终返回最高进度值，防止进度回退
  return highestProgress.value;
}

// 获取进度条状态
const getProgressStatus = () => {
  if (props.installStatus === 'error') {
    return 'exception' // 错误状态
  } else if (getInstallProgress() === 100) {
    return 'success'   // 成功状态
  } else {
    return ''          // 默认状态
  }
}

// 获取进度条格式化文本
const getProgressFormatText = () => {
  if (props.installStatus === 'error') {
    return '失败'      // 错误状态显示"失败"
  } else {
    return `${getInstallProgress()}%` // 正常状态显示百分比
  }
}

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: number | null = null
  return function(this: any, ...args: any[]) {
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 防抖处理的日志渲染
const debouncedRenderLogs = debounce(() => {
  renderLogs()
}, 100)

// 监听日志变化
watch(() => props.logs, () => {
  debouncedRenderLogs()
}, { deep: true })

// 监听窗口大小变化
const handleResize = () => {
  if (fitAddon.value) {
    fitAddon.value.fit()
  }
}

// 组件挂载时初始化终端
onMounted(() => {
  nextTick(() => {
    initTerminal()
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
  })
})

// 组件销毁前清理
onBeforeUnmount(() => {
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
  
  // 销毁终端
  if (terminal.value) {
    terminal.value.dispose()
  }
})

// 处理日志监控开关
const handleToggleMonitor = () => {
  // 触发日志监控开关事件
  emit('toggle-monitor')
}

defineExpose({
  activeLogType,
  terminal,
  clearTerminal,
  exportTerminalLogs,
  _isClearing
})
</script>

<style lang="scss" scoped>
.log-section {
  background-color: var(--el-bg-color);
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.logs-header {
  border-bottom: 1px solid var(--el-border-color-light);
  padding-bottom: 12px;
  margin-bottom: 16px;
  
  .section-title {
    display: flex;
    align-items: center;
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }
}

.install-progress-bar {
  margin-left: 12px;
  transition: all 0.3s ease;
  position: relative;
  
  :deep(.el-progress-bar__outer) {
    border-radius: 4px;
    background-color: var(--el-fill-color-lighter);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  :deep(.el-progress-bar__inner) {
    transition: all 0.5s ease-out;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  :deep(.el-progress__text) {
    font-weight: bold;
    color: var(--el-text-color-primary);
  }
}

.log-type-tabs {
  :deep(.el-radio-button__inner) {
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 12px;
    transition: all 0.2s ease;
    
    &:hover {
      opacity: 0.9;
    }
  }
  
  :deep(.is-active) {
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }
}

.terminal-container {
  background-color: var(--el-bg-color-page);
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  
  &:hover {
    border-color: var(--el-border-color);
    box-shadow: 0 4px 16px 0 rgba(0, 0, 0, 0.1);
  }
  
  :deep(.xterm) {
    padding: 8px;
    height: 100%;
    
    // 修改终端字体样式
    .xterm-helper-textarea {
      opacity: 0;
    }
    
    .xterm-rows {
      font-variant-ligatures: none;
    }
    
    .xterm-cursor {
      border-left-width: 2px;
    }
    
    .xterm-cursor-blink {
      animation: xterm-cursor-blink 1.2s infinite steps(1);
    }
    
    @keyframes xterm-cursor-blink {
      0%, 50% { opacity: 1; }
      50%, 100% { opacity: 0; }
    }
  }
  
  :deep(.xterm-viewport) {
    border-radius: 4px;
    scrollbar-width: thin;
    scrollbar-color: rgba(144, 147, 153, 0.3) transparent;
    transition: all 0.2s ease;
    
    &::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: rgba(144, 147, 153, 0.3);
      border-radius: 3px;
      
      &:hover {
        background-color: rgba(144, 147, 153, 0.5);
      }
    }
    
    &::-webkit-scrollbar-track {
      background-color: transparent;
    }
  }
  
  // 添加终端屏幕样式
  :deep(.xterm-screen) {
    border-radius: 6px;
  }
}

.log-footer {
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  margin-top: 12px;
}

.status-tag {
  display: flex;
  align-items: center;
  font-weight: 500;
  padding: 6px 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.action-buttons {
  display: flex;
  gap: 8px;
  
  .el-button {
    transition: all 0.2s ease;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}
</style>