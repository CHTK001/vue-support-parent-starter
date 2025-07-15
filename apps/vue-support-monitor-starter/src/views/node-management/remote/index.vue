<template>
  <div class="node-remote-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">
        <i class="ri-remote-control-line"></i>
        节点远程管理
      </h2>
      <p class="page-description">对在线节点进行远程文件管理、脚本执行等操作</p>
    </div>

    <!-- 节点选择 -->
    <el-card class="node-selector-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">选择目标节点</span>
        </div>
      </template>
      
      <el-row :gutter="16">
        <el-col :span="8">
          <el-select
            v-model="selectedNodeId"
            placeholder="请选择节点"
            filterable
            clearable
            @change="handleNodeChange"
            style="width: 100%"
          >
            <el-option
              v-for="node in nodeList"
              :key="node.nodeId"
              :label="`${node.nodeName || node.applicationName} (${node.ipAddress}:${node.port})`"
              :value="node.nodeId"
            >
              <div class="node-option">
                <div class="node-info">
                  <span class="node-name">{{ node.nodeName || node.applicationName }}</span>
                  <span class="node-address">{{ node.ipAddress }}:{{ node.port }}</span>
                </div>
                <el-tag
                  :type="node.status === 'ONLINE' ? 'success' : 'danger'"
                  size="small"
                >
                  {{ node.status === 'ONLINE' ? '在线' : '离线' }}
                </el-tag>
              </div>
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="4">
          <el-button
            type="primary"
            :disabled="!selectedNodeId"
            @click="checkConnection"
            :loading="checkingConnection"
          >
            <i class="ri-wifi-line"></i>
            测试连接
          </el-button>
        </el-col>
        <el-col :span="12">
          <div v-if="connectionStatus !== null" class="connection-status">
            <el-tag
              :type="connectionStatus ? 'success' : 'danger'"
              size="large"
            >
              <i :class="connectionStatus ? 'ri-check-line' : 'ri-close-line'"></i>
              {{ connectionStatus ? '连接正常' : '连接失败' }}
            </el-tag>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 功能选项卡 -->
    <el-card v-if="selectedNodeId" class="function-tabs-card">
      <el-tabs v-model="activeTab" type="border-card">
        <!-- 文件管理 -->
        <el-tab-pane label="文件管理" name="file">
          <div class="file-management-panel">
            <el-row :gutter="16">
              <el-col :span="12">
                <div class="panel-section">
                  <h4>文件上传</h4>
                  <el-upload
                    ref="uploadRef"
                    :action="`/api/node-remote/upload-file`"
                    :data="{ nodeId: selectedNodeId, remoteFilePath: uploadPath }"
                    :before-upload="beforeUpload"
                    :on-success="handleUploadSuccess"
                    :on-error="handleUploadError"
                    drag
                    multiple
                  >
                    <i class="ri-upload-cloud-line upload-icon"></i>
                    <div class="upload-text">
                      <p>将文件拖到此处，或<em>点击上传</em></p>
                      <p class="upload-hint">支持多文件上传</p>
                    </div>
                  </el-upload>
                  
                  <div class="upload-config">
                    <el-input
                      v-model="uploadPath"
                      placeholder="远程保存路径，如: /tmp/"
                      prefix-icon="ri-folder-line"
                    />
                    <el-checkbox v-model="overwriteFile" style="margin-top: 8px">
                      覆盖已存在文件
                    </el-checkbox>
                  </div>
                </div>
              </el-col>
              
              <el-col :span="12">
                <div class="panel-section">
                  <h4>文件浏览</h4>
                  <div class="file-browser">
                    <el-input
                      v-model="currentPath"
                      placeholder="输入路径，如: /home/user"
                      @keyup.enter="loadFileList"
                    >
                      <template #append>
                        <el-button @click="loadFileList" :loading="loadingFiles">
                          <i class="ri-search-line"></i>
                        </el-button>
                      </template>
                    </el-input>
                    
                    <div class="file-list" v-loading="loadingFiles">
                      <div
                        v-for="file in fileList"
                        :key="file.path"
                        class="file-item"
                        @click="handleFileClick(file)"
                      >
                        <i :class="file.isDirectory ? 'ri-folder-line' : 'ri-file-line'"></i>
                        <span class="file-name">{{ file.name }}</span>
                        <span class="file-size" v-if="!file.isDirectory">
                          {{ formatFileSize(file.size) }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 脚本执行 -->
        <el-tab-pane label="脚本执行" name="script">
          <div class="script-execution-panel">
            <el-row :gutter="16">
              <el-col :span="16">
                <div class="script-editor">
                  <div class="editor-header">
                    <el-select v-model="scriptType" style="width: 120px">
                      <el-option label="Shell" value="SHELL" />
                      <el-option label="Batch" value="BATCH" />
                      <el-option label="Python" value="PYTHON" />
                      <el-option label="PowerShell" value="POWERSHELL" />
                    </el-select>
                    
                    <el-input
                      v-model="workingDirectory"
                      placeholder="工作目录 (可选)"
                      style="width: 200px; margin-left: 12px"
                    />
                    
                    <el-button
                      type="primary"
                      @click="executeScript"
                      :loading="executingScript"
                      style="margin-left: 12px"
                    >
                      <i class="ri-play-line"></i>
                      执行脚本
                    </el-button>
                  </div>
                  
                  <el-input
                    v-model="scriptContent"
                    type="textarea"
                    :rows="12"
                    placeholder="请输入脚本内容..."
                    class="script-textarea"
                  />
                </div>
              </el-col>
              
              <el-col :span="8">
                <div class="script-output">
                  <h4>执行结果</h4>
                  <div class="output-container" v-loading="executingScript">
                    <div v-if="scriptResult" class="result-content">
                      <div class="result-header">
                        <el-tag
                          :type="scriptResult.exitCode === 0 ? 'success' : 'danger'"
                          size="small"
                        >
                          退出码: {{ scriptResult.exitCode }}
                        </el-tag>
                        <span class="execution-time">
                          耗时: {{ scriptResult.duration }}ms
                        </span>
                      </div>
                      
                      <div class="output-section" v-if="scriptResult.stdout">
                        <h5>标准输出:</h5>
                        <pre class="output-text">{{ scriptResult.stdout }}</pre>
                      </div>
                      
                      <div class="output-section" v-if="scriptResult.stderr">
                        <h5>错误输出:</h5>
                        <pre class="error-text">{{ scriptResult.stderr }}</pre>
                      </div>
                    </div>
                    
                    <div v-else class="no-result">
                      <i class="ri-terminal-line"></i>
                      <p>执行结果将显示在这里</p>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 系统监控 -->
        <el-tab-pane label="系统监控" name="monitor">
          <div class="system-monitor-panel">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-card class="monitor-card">
                  <template #header>
                    <span>系统信息</span>
                    <el-button
                      type="text"
                      @click="loadSystemInfo"
                      :loading="loadingSystemInfo"
                      style="float: right"
                    >
                      <i class="ri-refresh-line"></i>
                    </el-button>
                  </template>
                  
                  <div v-if="systemInfo" class="system-info">
                    <div class="info-item">
                      <span class="label">操作系统:</span>
                      <span class="value">{{ systemInfo.os || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">CPU:</span>
                      <span class="value">{{ systemInfo.cpu || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">内存:</span>
                      <span class="value">{{ systemInfo.memory || 'N/A' }}</span>
                    </div>
                    <div class="info-item">
                      <span class="label">磁盘:</span>
                      <span class="value">{{ systemInfo.disk || 'N/A' }}</span>
                    </div>
                  </div>
                </el-card>
              </el-col>
              
              <el-col :span="16">
                <el-card class="monitor-card">
                  <template #header>
                    <span>性能监控</span>
                  </template>
                  
                  <div class="performance-monitor">
                    <p>性能监控功能开发中...</p>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 空状态 -->
    <el-empty
      v-else
      description="请先选择一个节点"
      :image-size="100"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { http } from '@repo/utils'

// 响应式数据
const nodeList = ref([])
const selectedNodeId = ref('')
const connectionStatus = ref(null)
const checkingConnection = ref(false)
const activeTab = ref('file')

// 文件管理相关
const uploadPath = ref('/tmp/')
const overwriteFile = ref(false)
const currentPath = ref('/home')
const fileList = ref([])
const loadingFiles = ref(false)

// 脚本执行相关
const scriptType = ref('SHELL')
const scriptContent = ref('')
const workingDirectory = ref('')
const executingScript = ref(false)
const scriptResult = ref(null)

// 系统监控相关
const systemInfo = ref(null)
const loadingSystemInfo = ref(false)

// 生命周期
onMounted(() => {
  loadNodeList()
})

// 方法
const loadNodeList = async () => {
  try {
    const response = await http.get('/api/online-node-management/nodes')
    if (response.success) {
      nodeList.value = response.data || []
    }
  } catch (error) {
    console.error('加载节点列表失败:', error)
    ElMessage.error('加载节点列表失败')
  }
}

const handleNodeChange = () => {
  connectionStatus.value = null
  if (selectedNodeId.value) {
    loadFileList()
    loadSystemInfo()
  }
}

const checkConnection = async () => {
  if (!selectedNodeId.value) return
  
  checkingConnection.value = true
  try {
    const response = await http.get('/api/node-remote/check-connection', {
      params: { nodeId: selectedNodeId.value }
    })
    connectionStatus.value = response.data
    
    if (response.data) {
      ElMessage.success('节点连接正常')
    } else {
      ElMessage.error('节点连接失败')
    }
  } catch (error) {
    console.error('检查连接失败:', error)
    connectionStatus.value = false
    ElMessage.error('检查连接失败')
  } finally {
    checkingConnection.value = false
  }
}

const loadFileList = async () => {
  if (!selectedNodeId.value || !currentPath.value) return
  
  loadingFiles.value = true
  try {
    const response = await http.get('/api/node-remote/file-list', {
      params: {
        nodeId: selectedNodeId.value,
        directoryPath: currentPath.value,
        includeHidden: false
      }
    })
    
    if (response.success) {
      fileList.value = response.data || []
    }
  } catch (error) {
    console.error('加载文件列表失败:', error)
    ElMessage.error('加载文件列表失败')
  } finally {
    loadingFiles.value = false
  }
}

const handleFileClick = (file) => {
  if (file.isDirectory) {
    currentPath.value = file.path
    loadFileList()
  }
}

const beforeUpload = (file) => {
  if (!uploadPath.value) {
    ElMessage.error('请输入远程保存路径')
    return false
  }
  return true
}

const handleUploadSuccess = (response) => {
  ElMessage.success('文件上传成功')
  loadFileList() // 刷新文件列表
}

const handleUploadError = (error) => {
  console.error('上传失败:', error)
  ElMessage.error('文件上传失败')
}

const executeScript = async () => {
  if (!selectedNodeId.value || !scriptContent.value) {
    ElMessage.error('请选择节点并输入脚本内容')
    return
  }
  
  executingScript.value = true
  try {
    const response = await http.post('/api/node-remote/execute-script', null, {
      params: {
        nodeId: selectedNodeId.value,
        script: scriptContent.value,
        scriptType: scriptType.value,
        workingDirectory: workingDirectory.value,
        timeout: 60
      }
    })
    
    if (response.success && response.data.result) {
      scriptResult.value = response.data.result
      scriptResult.value.duration = response.data.duration
    } else {
      ElMessage.error(response.data?.errorMessage || '脚本执行失败')
    }
  } catch (error) {
    console.error('执行脚本失败:', error)
    ElMessage.error('执行脚本失败')
  } finally {
    executingScript.value = false
  }
}

const loadSystemInfo = async () => {
  if (!selectedNodeId.value) return
  
  loadingSystemInfo.value = true
  try {
    const response = await http.get('/api/node-remote/system-info', {
      params: { nodeId: selectedNodeId.value }
    })
    
    if (response.success) {
      systemInfo.value = response.data
    }
  } catch (error) {
    console.error('加载系统信息失败:', error)
    ElMessage.error('加载系统信息失败')
  } finally {
    loadingSystemInfo.value = false
  }
}

const formatFileSize = (size) => {
  if (!size) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let index = 0
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  return `${size.toFixed(1)} ${units[index]}`
}
</script>

<style scoped>
.node-remote-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.page-description {
  color: var(--el-text-color-regular);
  margin: 0;
}

.node-selector-card,
.function-tabs-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.node-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.node-info {
  display: flex;
  flex-direction: column;
}

.node-name {
  font-weight: 500;
}

.node-address {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.connection-status {
  display: flex;
  align-items: center;
}

.panel-section {
  margin-bottom: 20px;
}

.panel-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.upload-icon {
  font-size: 48px;
  color: var(--el-color-primary);
}

.upload-text {
  text-align: center;
  margin-top: 16px;
}

.upload-hint {
  font-size: 12px;
  color: var(--el-text-color-regular);
  margin-top: 4px;
}

.upload-config {
  margin-top: 16px;
}

.file-browser {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.file-list {
  max-height: 300px;
  overflow-y: auto;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  cursor: pointer;
  transition: background-color 0.2s;
}

.file-item:hover {
  background-color: var(--el-fill-color-light);
}

.file-item:last-child {
  border-bottom: none;
}

.file-name {
  flex: 1;
  margin-left: 8px;
}

.file-size {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.script-editor {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: var(--el-fill-color-lighter);
  border-bottom: 1px solid var(--el-border-color);
}

.script-textarea {
  border: none;
}

.script-textarea :deep(.el-textarea__inner) {
  border: none;
  border-radius: 0;
  font-family: 'Consolas', 'Monaco', monospace;
}

.script-output {
  height: 100%;
}

.output-container {
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  min-height: 300px;
  padding: 12px;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.execution-time {
  font-size: 12px;
  color: var(--el-text-color-regular);
}

.output-section {
  margin-bottom: 16px;
}

.output-section h5 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.output-text,
.error-text {
  background-color: var(--el-fill-color-darker);
  padding: 8px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  white-space: pre-wrap;
  margin: 0;
}

.error-text {
  color: var(--el-color-danger);
}

.no-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--el-text-color-regular);
}

.no-result i {
  font-size: 48px;
  margin-bottom: 12px;
}

.monitor-card {
  height: 400px;
}

.system-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.info-item:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: var(--el-text-color-regular);
}

.value {
  color: var(--el-text-color-primary);
}

.performance-monitor {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--el-text-color-regular);
}
</style>
