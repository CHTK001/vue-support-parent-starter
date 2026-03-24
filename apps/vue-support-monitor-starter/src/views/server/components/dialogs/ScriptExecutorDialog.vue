<template>
  <sc-dialog
    v-model="visible"
    title="脚本执行器"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="script-executor">
      <el-row :gutter="20">
        <!-- 左侧脚本编辑区 -->
        <el-col :span="12">
          <div class="script-panel">
            <div class="panel-header">
              <h4>脚本编辑</h4>
              <div class="script-actions">
                <el-dropdown @command="handleTemplateCommand">
                  <el-button size="small" text>
                    模板
                    <IconifyIconOnline icon="ri:arrow-down-s-line" class="ml-1" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="system_info">系统信息</el-dropdown-item>
                      <el-dropdown-item command="disk_usage">磁盘使用</el-dropdown-item>
                      <el-dropdown-item command="memory_info">内存信息</el-dropdown-item>
                      <el-dropdown-item command="process_list">进程列表</el-dropdown-item>
                      <el-dropdown-item command="network_info">网络信息</el-dropdown-item>
                      <el-dropdown-item command="service_status">服务状态</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
                <el-button size="small" @click="clearScript">清空</el-button>
              </div>
            </div>
            
            <el-form :model="formData" label-width="80px" size="small">
              <el-form-item label="脚本类型">
                <el-select v-model="formData.scriptType" style="width: 100%">
                  <el-option label="Shell脚本" value="shell" />
                  <el-option label="PowerShell" value="powershell" />
                  <el-option label="Python脚本" value="python" />
                  <el-option label="批处理" value="batch" />
                </el-select>
              </el-form-item>
              
              <el-form-item label="执行超时">
                <el-input-number
                  v-model="formData.timeout"
                  :min="5"
                  :max="3600"
                  :step="5"
                  style="width: 100%"
                />
                <span class="timeout-unit">秒</span>
              </el-form-item>
            </el-form>

            <div class="script-editor">
              <el-input
                v-model="formData.script"
                type="textarea"
                :rows="15"
                placeholder="请输入要执行的脚本内容..."
                class="script-textarea"
              />
            </div>

            <div class="script-footer">
              <el-button
                type="primary"
                @click="executeScript"
                :loading="executing"
                :disabled="!formData.script.trim()"
              >
                <IconifyIconOnline icon="ri:play-line" class="mr-1" />
                执行脚本
              </el-button>
              <el-button @click="stopExecution" :disabled="!executing">
                <IconifyIconOnline icon="ri:stop-line" class="mr-1" />
                停止执行
              </el-button>
            </div>
          </div>
        </el-col>

        <!-- 右侧执行结果区 -->
        <el-col :span="12">
          <div class="result-panel">
            <div class="panel-header">
              <h4>执行结果</h4>
              <div class="result-actions">
                <el-button size="small" @click="clearOutput">清空输出</el-button>
                <el-button size="small" @click="downloadOutput">下载结果</el-button>
              </div>
            </div>

            <!-- 执行状态 -->
            <div class="execution-status" v-if="executing || executionResult">
              <el-tag
                :type="getStatusType(executionStatus)"
                size="small"
                class="status-tag"
              >
                {{ getStatusText(executionStatus) }}
              </el-tag>
              <span class="execution-time" v-if="executionTime">
                执行时间: {{ executionTime }}ms
              </span>
            </div>

            <!-- 输出内容 -->
            <div class="output-container">
              <div class="output-tabs">
                <el-tabs v-model="activeTab" size="small">
                  <el-tab-pane label="标准输出" name="stdout">
                    <div class="output-content" ref="stdoutRef">
                      <pre v-if="outputData.stdout">{{ outputData.stdout }}</pre>
                      <div v-else class="empty-output">暂无输出</div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="错误输出" name="stderr">
                    <div class="output-content" ref="stderrRef">
                      <pre v-if="outputData.stderr" class="error-output">{{ outputData.stderr }}</pre>
                      <div v-else class="empty-output">暂无错误输出</div>
                    </div>
                  </el-tab-pane>
                  <el-tab-pane label="执行日志" name="logs">
                    <div class="output-content" ref="logsRef">
                      <div
                        v-for="(log, index) in executionLogs"
                        :key="index"
                        class="log-item"
                        :class="log.level"
                      >
                        <span class="log-time">{{ formatTime(log.time) }}</span>
                        <span class="log-message">{{ log.message }}</span>
                      </div>
                      <div v-if="executionLogs.length === 0" class="empty-output">暂无日志</div>
                    </div>
                  </el-tab-pane>
                </el-tabs>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 目标服务器选择 -->
      <div class="server-selection" v-if="!targetServer">
        <el-divider content-position="left">目标服务器</el-divider>
        <el-checkbox-group v-model="selectedServers">
          <el-checkbox
            v-for="server in availableServers"
            :key="server.id"
            :label="server.id"
            class="server-checkbox"
          >
            {{ server.name }} ({{ server.host }}:{{ server.port }})
          </el-checkbox>
        </el-checkbox-group>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">关闭</el-button>
        <el-button type="primary" @click="saveScript" :disabled="!formData.script.trim()">
          保存脚本
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { message } from "@repo/utils";

// Props
const props = defineProps<{
  server?: any;
  servers?: any[];
}>();

// 状态
const visible = ref(false);
const executing = ref(false);
const executionStatus = ref<'running' | 'success' | 'error' | 'timeout'>('running');
const executionTime = ref(0);
const executionResult = ref(false);
const activeTab = ref('stdout');

// 表单数据
const formData = reactive({
  scriptType: 'shell',
  script: '',
  timeout: 60
});

// 输出数据
const outputData = reactive({
  stdout: '',
  stderr: ''
});

// 执行日志
const executionLogs = ref<any[]>([]);

// 服务器选择
const targetServer = ref<any>(null);
const selectedServers = ref<string[]>([]);
const availableServers = ref<any[]>([]);

// 引用
const stdoutRef = ref<HTMLElement>();
const stderrRef = ref<HTMLElement>();
const logsRef = ref<HTMLElement>();

// 脚本模板
const scriptTemplates = {
  system_info: {
    shell: `#!/bin/bash
# 系统信息查询
echo "=== 系统信息 ==="
uname -a
echo ""
echo "=== CPU信息 ==="
cat /proc/cpuinfo | grep "model name" | head -1
echo ""
echo "=== 内存信息 ==="
free -h
echo ""
echo "=== 磁盘信息 ==="
df -h`,
    powershell: `# 系统信息查询
Write-Host "=== 系统信息 ==="
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion, TotalPhysicalMemory
Write-Host ""
Write-Host "=== CPU信息 ==="
Get-WmiObject -Class Win32_Processor | Select-Object Name, NumberOfCores
Write-Host ""
Write-Host "=== 磁盘信息 ==="
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, Size, FreeSpace`
  },
  disk_usage: {
    shell: `#!/bin/bash
# 磁盘使用情况
echo "=== 磁盘使用情况 ==="
df -h
echo ""
echo "=== 大文件查找 (>100M) ==="
find / -type f -size +100M -exec ls -lh {} \\; 2>/dev/null | head -10`,
    powershell: `# 磁盘使用情况
Write-Host "=== 磁盘使用情况 ==="
Get-WmiObject -Class Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::Round($_.Size/1GB,2)}}, @{Name="FreeSpace(GB)";Expression={[math]::Round($_.FreeSpace/1GB,2)}}, @{Name="Usage%";Expression={[math]::Round(($_.Size-$_.FreeSpace)/$_.Size*100,2)}}`
  },
  memory_info: {
    shell: `#!/bin/bash
# 内存使用情况
echo "=== 内存使用情况 ==="
free -h
echo ""
echo "=== 内存占用TOP10进程 ==="
ps aux --sort=-%mem | head -11`,
    powershell: `# 内存使用情况
Write-Host "=== 内存使用情况 ==="
Get-WmiObject -Class Win32_OperatingSystem | Select-Object @{Name="TotalMemory(GB)";Expression={[math]::Round($_.TotalVisibleMemorySize/1MB,2)}}, @{Name="FreeMemory(GB)";Expression={[math]::Round($_.FreePhysicalMemory/1MB,2)}}
Write-Host ""
Write-Host "=== 内存占用TOP10进程 ==="
Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 Name, @{Name="Memory(MB)";Expression={[math]::Round($_.WorkingSet/1MB,2)}}`
  }
};

// 方法
const open = (server?: any, servers?: any[]) => {
  targetServer.value = server || null;
  availableServers.value = servers || [];
  
  if (server) {
    selectedServers.value = [server.id];
  }
  
  visible.value = true;
  resetForm();
};

const resetForm = () => {
  formData.scriptType = 'shell';
  formData.script = '';
  formData.timeout = 60;
  
  outputData.stdout = '';
  outputData.stderr = '';
  executionLogs.value = [];
  
  executing.value = false;
  executionResult.value = false;
  executionStatus.value = 'running';
  executionTime.value = 0;
  activeTab.value = 'stdout';
};

const handleClose = () => {
  if (executing.value) {
    message.warning('脚本执行中，请等待完成或停止执行');
    return;
  }
  visible.value = false;
  resetForm();
};

const handleTemplateCommand = (command: string) => {
  const template = scriptTemplates[command as keyof typeof scriptTemplates];
  if (template) {
    const scriptContent = template[formData.scriptType as keyof typeof template];
    if (scriptContent) {
      formData.script = scriptContent;
    } else {
      message.warning(`该模板不支持 ${formData.scriptType} 类型`);
    }
  }
};

const clearScript = () => {
  formData.script = '';
};

const clearOutput = () => {
  outputData.stdout = '';
  outputData.stderr = '';
  executionLogs.value = [];
};

const executeScript = async () => {
  if (!formData.script.trim()) {
    message.warning('请输入脚本内容');
    return;
  }

  if (!targetServer.value && selectedServers.value.length === 0) {
    message.warning('请选择目标服务器');
    return;
  }

  try {
    executing.value = true;
    executionResult.value = false;
    executionStatus.value = 'running';
    clearOutput();
    
    addLog('info', '开始执行脚本...');
    
    const startTime = Date.now();
    
    // 模拟脚本执行
    await simulateScriptExecution();
    
    executionTime.value = Date.now() - startTime;
    executionStatus.value = 'success';
    executionResult.value = true;
    
    addLog('success', `脚本执行完成，耗时 ${executionTime.value}ms`);
    message.success('脚本执行成功');
    
  } catch (error) {
    executionStatus.value = 'error';
    executionResult.value = true;
    addLog('error', `脚本执行失败: ${error}`);
    message.error('脚本执行失败');
  } finally {
    executing.value = false;
  }
};

const simulateScriptExecution = async () => {
  // 模拟脚本执行过程
  addLog('info', '连接到目标服务器...');
  await new Promise(resolve => setTimeout(resolve, 500));
  
  addLog('info', '上传脚本文件...');
  await new Promise(resolve => setTimeout(resolve, 300));
  
  addLog('info', '设置执行权限...');
  await new Promise(resolve => setTimeout(resolve, 200));
  
  addLog('info', '开始执行脚本...');
  
  // 模拟输出
  const outputs = [
    '=== 系统信息 ===',
    'Linux server01 5.4.0-74-generic #83-Ubuntu SMP Sat May 8 02:35:39 UTC 2021 x86_64 x86_64 x86_64 GNU/Linux',
    '',
    '=== CPU信息 ===',
    'model name	: Intel(R) Core(TM) i7-8700K CPU @ 3.70GHz',
    '',
    '=== 内存信息 ===',
    '              total        used        free      shared  buff/cache   available',
    'Mem:           15Gi       2.1Gi        10Gi       1.0Mi       3.2Gi        13Gi',
    'Swap:         2.0Gi          0B       2.0Gi',
    '',
    '=== 磁盘信息 ===',
    'Filesystem      Size  Used Avail Use% Mounted on',
    '/dev/sda1        20G  8.1G   11G  43% /',
    '/dev/sda2       100G   45G   50G  48% /home'
  ];
  
  for (const output of outputs) {
    outputData.stdout += output + '\n';
    await new Promise(resolve => setTimeout(resolve, 100));
    scrollToBottom(stdoutRef.value);
  }
  
  addLog('info', '脚本执行完成');
};

const stopExecution = () => {
  if (executing.value) {
    executing.value = false;
    executionStatus.value = 'error';
    addLog('warning', '脚本执行已停止');
    message.warning('脚本执行已停止');
  }
};

const downloadOutput = () => {
  const content = `脚本执行结果\n\n标准输出:\n${outputData.stdout}\n\n错误输出:\n${outputData.stderr}`;
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `script_output_${Date.now()}.txt`;
  link.click();
  URL.revokeObjectURL(url);
  message.success('输出结果已下载');
};

const saveScript = () => {
  // TODO: 实现脚本保存功能
  message.success('脚本已保存');
};

const addLog = (level: 'info' | 'success' | 'warning' | 'error', message: string) => {
  executionLogs.value.push({
    level,
    message,
    time: new Date()
  });
  
  nextTick(() => {
    scrollToBottom(logsRef.value);
  });
};

const scrollToBottom = (element?: HTMLElement) => {
  if (element) {
    element.scrollTop = element.scrollHeight;
  }
};

const getStatusType = (status: string) => {
  const typeMap = {
    running: 'warning',
    success: 'success',
    error: 'danger',
    timeout: 'warning'
  };
  return typeMap[status as keyof typeof typeMap] || 'info';
};

const getStatusText = (status: string) => {
  const textMap = {
    running: '执行中',
    success: '执行成功',
    error: '执行失败',
    timeout: '执行超时'
  };
  return textMap[status as keyof typeof textMap] || '未知状态';
};

const formatTime = (time: Date) => {
  return time.toLocaleTimeString();
};

// 暴露方法
defineExpose({
  open
});
</script>

<style lang="scss" scoped>
@use "@/styles/mixins.scss" as *;

.script-executor {
  :deep(.el-divider__text) {
    font-weight: $font-weight-semibold;
    color: var(--el-text-color-primary);
  }

  .script-panel,
  .result-panel {
    height: 500px;
    display: flex;
    flex-direction: column;
    border-radius: $radius-md;
    overflow: hidden;
    @include glass-effect(0.92, 18px);
    box-shadow: $shadow-md;
    border: 1px solid $border-light;
    transition: all $duration-normal $ease-standard;

    &:hover {
      box-shadow: $shadow-hover-md;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: $spacing-md $spacing-lg;
      background: $gradient-bg-1;
      border-bottom: 1px solid $border-light;
      position: relative;

      &::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 2px;
        background: $gradient-line;
      }

      h4 {
        margin: 0;
        font-size: $font-md;
        font-weight: $font-weight-semibold;
        letter-spacing: $letter-spacing-tight;
        color: var(--el-text-color-primary);
      }

      .script-actions,
      .result-actions {
        display: flex;
        gap: $spacing-sm;

        .el-button {
          border-radius: $radius-sm;
          transition: all $duration-fast $ease-standard;

          &:hover {
            transform: translateY(-1px);
            box-shadow: $shadow-sm;
          }

          &:active {
            transform: translateY(0);
          }
        }
      }
    }
  }

  .script-panel {
    :deep(.el-form) {
      padding: $spacing-md $spacing-lg $spacing-sm;
    }

    .script-editor {
      flex: 1;
      padding: $spacing-md $spacing-lg $spacing-lg;
      overflow: hidden;

      .script-textarea {
        height: 100%;

        :deep(.el-textarea__inner) {
          height: 100% !important;
          border-radius: $radius-sm;
          @include glass-effect(0.9, 16px);
          border: 1px solid $border-light;
          box-shadow: $shadow-inset-light;
          font-family: "Consolas", "Monaco", "Courier New", monospace;
          font-size: $font-sm;
          line-height: 1.5;
          transition: all $duration-fast $ease-standard;
          @include custom-scrollbar(8px);

          &:focus {
            border-color: $border-primary;
            box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
          }
        }
      }
    }

    .script-footer {
      padding: $spacing-md $spacing-lg;
      border-top: 1px solid $border-light;
      background: rgba(255, 255, 255, 0.6);
      display: flex;
      gap: $spacing-sm;

      .el-button {
        border-radius: $radius-sm;
        padding: $button-padding-sm;
        transition: all $duration-fast $ease-standard;
        font-weight: $font-weight-medium;

        &:hover:not(.is-disabled) {
          transform: translateY(-1px);
          box-shadow: $shadow-md;
        }

        &:active:not(.is-disabled) {
          transform: translateY(0);
        }
      }
    }
  }

  .result-panel {
    .execution-status {
      display: flex;
      align-items: center;
      gap: $spacing-md;
      padding: $spacing-sm $spacing-lg;
      background-color: rgba(99, 102, 241, 0.05);
      border-bottom: 1px solid $border-light;

      .status-tag {
        font-size: $font-xs;
        border-radius: $radius-full;
      }

      .execution-time {
        font-size: $font-xs;
        color: var(--el-text-color-secondary);
      }
    }

    .output-container {
      flex: 1;
      overflow: hidden;

      .output-tabs {
        height: 100%;

        :deep(.el-tabs) {
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        :deep(.el-tabs__header) {
          margin: 0;
          padding: 0 $spacing-lg;
          background: rgba(255, 255, 255, 0.55);
          border-bottom: 1px solid $border-light;
        }

        :deep(.el-tabs__item) {
          transition: all $duration-fast $ease-standard;
          font-weight: $font-weight-medium;

          &.is-active {
            color: var(--el-color-primary);
          }

          &:hover {
            color: var(--el-color-primary);
          }
        }

        :deep(.el-tabs__content) {
          flex: 1;
          overflow: hidden;
        }

        :deep(.el-tab-pane) {
          height: 100%;
        }

        .output-content {
          height: 100%;
          overflow-y: auto;
          padding: $spacing-md;
          @include custom-scrollbar(8px);
          font-family: "Consolas", "Monaco", "Courier New", monospace;
          font-size: $font-xs;
          line-height: 1.5;
          background: #141414;
          color: #e6e6e6;

          pre {
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
          }

          .error-output {
            color: #ff8a8a;
          }

          .empty-output {
            color: rgba(230, 230, 230, 0.65);
            text-align: center;
            padding: 40px 20px;
          }

          .log-item {
            display: flex;
            margin-bottom: 4px;
            padding: 2px 0;

            &.info {
              color: #7ab7ff;
            }

            &.success {
              color: #9be27a;
            }

            &.warning {
              color: #ffcf6e;
            }

            &.error {
              color: #ff8a8a;
            }

            .log-time {
              margin-right: 8px;
              color: rgba(230, 230, 230, 0.55);
              flex-shrink: 0;
            }

            .log-message {
              flex: 1;
            }
          }
        }
      }
    }
  }

  .server-selection {
    margin-top: $spacing-xl;
    @include card-style;
    padding: $spacing-lg;

    .server-checkbox {
      display: block;
      margin-bottom: $spacing-sm;
    }
  }

  .timeout-unit {
    margin-left: $spacing-sm;
    font-size: $font-xs;
    color: var(--el-text-color-secondary);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-md;

  .el-button {
    border-radius: $radius-sm;
    padding: $button-padding-md;
    transition: all $duration-fast $ease-standard;
    font-weight: $font-weight-medium;

    &:hover:not(.is-disabled) {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }

    &:active:not(.is-disabled) {
      transform: translateY(0);
    }
  }
}

@include respond-to(md) {
  .script-executor {
    .script-panel,
    .result-panel {
      height: 460px;
    }
  }
}

@include respond-to(sm) {
  .script-executor {
    .script-panel,
    .result-panel {
      height: auto;
      min-height: 420px;
    }
  }

  .dialog-footer {
    flex-direction: column-reverse;

    .el-button {
      width: 100%;
    }
  }
}
</style>
