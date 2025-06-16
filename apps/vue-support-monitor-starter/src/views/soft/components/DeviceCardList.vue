<template>
  <div class="device-card-list">
    <div class="device-header flex justify-between items-center mb-4">
      <div class="flex items-center">
        <IconifyIconOnline icon="ep:monitor" class="mr-2 text-primary text-xl" />
        <h3 class="text-lg font-medium">设备管理</h3>
      </div>
      <div class="flex items-center gap-2">
        <el-button type="primary" plain size="small" @click="handleRefresh">
          <IconifyIconOnline icon="ep:refresh" class="mr-1" />
          刷新
        </el-button>
        <el-button type="primary" size="small" @click="handleAddDevice">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          绑定设备
        </el-button>
      </div>
    </div>

      <div v-if="loading" class="loading-container flex justify-center items-center py-8">
        <el-skeleton :rows="3" animated />
      </div>
    <el-empty v-else-if="deviceList.length === 0" description="暂无设备" :image-size="100" class="empty-container" />
    <div v-else class="device-grid">
      <ScCard
        v-for="device in deviceList" 
        :key="device.installId || device.id" 
        layout="default"
        hoverable
        shadow="hover"
        border-position="top"
        class="device-card"
        :class="{ 'selected-device': selectedDeviceId === (device.installId || device.id) }"
        @click="handleSelectDevice(device)"
      >
        <template #header>
          <div class="card-header flex justify-between items-center">
            <div class="device-name flex items-center">
              <IconifyIconOnline icon="ep:monitor" class="mr-2" />
              <span class="truncate">{{ device.sshName || device.name || '未命名设备' }}</span>
            </div>
            <div class="device-actions">
              <el-tag :type="getStatusTagType(device.installStatus || device.status)" size="small">
                {{ getStatusText(device.installStatus || device.status) }}
              </el-tag>
              <el-dropdown trigger="click" @command="handleCommand($event, device)">
                <el-button type="text" size="small">
                  <IconifyIconOnline icon="ep:more" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="edit">
                      <IconifyIconOnline icon="ep:edit" class="mr-1" />
                      编辑
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <IconifyIconOnline icon="ep:delete" class="mr-1" />
                      删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </template>
        
        <template #default>
          <div class="device-info">
            <div class="info-item">
              <span class="label">设备地址：</span>
              <span class="value">{{ device.sshHost || device.host || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">端口：</span>
              <span class="value">{{ device.sshPort || device.port || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">安装路径：</span>
              <span class="value truncate">{{ device.installPath || '未知' }}</span>
            </div>
            <div class="info-item" v-if="device.installConfigPath">
              <span class="label">配置路径：</span>
              <span class="value truncate">{{ device.installConfigPath }}</span>
            </div>
            <div class="info-item">
              <span class="label">版本：</span>
              <span class="value">{{ device.installVersion || device.softServiceVersion || '未知' }}</span>
            </div>
            <div class="info-item">
              <span class="label">运行状态：</span>
              <span class="value">
                <el-tag size="small" :type="device.installRunStatus === 1 ? 'success' : 'info'">
                  {{ device.installRunStatus === 1 ? '运行中' : '未运行' }}
                </el-tag>
              </span>
            </div>
            <div class="info-item">
              <span class="label">安装时间：</span>
              <span class="value">{{ formatDate(device.installTime) }}</span>
            </div>
            <div class="info-item" v-if="device.installLastCheckTime">
              <span class="label">最后检查：</span>
              <span class="value">{{ formatDate(device.installLastCheckTime) }}</span>
            </div>
          </div>
        </template>
        
        <template #footer>
          <div class="card-actions flex justify-end gap-2 pt-2 border-t border-gray-100">
            <el-button type="primary" link size="small" @click.stop="handleEditDevice(device)">
              <IconifyIconOnline icon="ep:edit" class="mr-1" />
              编辑
            </el-button>
            <el-button type="danger" link size="small" @click.stop="handleDeleteDevice(device)">
              <IconifyIconOnline icon="ep:delete" class="mr-1" />
              删除
            </el-button>
          </div>
        </template>
      </ScCard>
    </div>

    <!-- 设备表单对话框 -->
    <el-dialog
      v-model="deviceFormVisible"
      :title="isEdit ? '编辑设备' : '绑定设备'"
      width="90%"
      destroy-on-close
      top="10px"
    >
      <div class="form-container flex">
        <!-- 左侧基本信息 -->
        <div class="form-left flex-1 pr-4">
      <el-form 
        ref="deviceFormRef" 
        :model="deviceForm" 
        :rules="deviceFormRules"
            label-width="120px"
            label-position="right"
        class="device-form"
      >
            <h3 class="text-lg font-medium mb-4">基本信息</h3>
            
            <el-form-item label="SSH设备" prop="sshId">
              <el-select 
                v-model="deviceForm.sshId" 
                filterable 
                placeholder="请选择SSH设备" 
                style="width: 100%"
                :loading="sshListLoading"
              >
                <el-option 
                  v-for="item in sshList" 
                  :key="item.id" 
                  :label="`${item.name}(${item.host}:${item.port})`" 
                  :value="item.id" 
                />
              </el-select>
              <div class="form-hint">选择SSH设备后将自动填充设备名称、地址和端口</div>
            </el-form-item>
            
            <el-form-item label="设备名称" prop="sshName">
              <el-input v-model="deviceForm.sshName" placeholder="请输入设备名称" />
            </el-form-item>
            
            <el-form-item label="设备地址" prop="sshHost">
              <el-input v-model="deviceForm.sshHost" placeholder="请输入设备地址" />
            </el-form-item>
            
            <el-form-item label="设备端口" prop="sshPort">
              <el-input-number v-model="deviceForm.sshPort" :min="1" :max="65535" placeholder="请输入设备端口" class="w-full" />
            </el-form-item>
            
            <el-form-item label="软件名称" prop="softServiceName">
              <el-input v-model="deviceForm.softServiceName" placeholder="请输入软件名称" disabled />
            </el-form-item>
            
            <el-form-item label="安装路径" prop="installPath">
              <el-input v-model="deviceForm.installPath" placeholder="请输入安装路径" />
            </el-form-item>
            
            <el-form-item label="安装端口">
              <el-input v-model="deviceForm.installPort" placeholder="请输入安装端口" />
            </el-form-item>
            
            <el-form-item label="默认端口">
              <el-input v-model="deviceForm.installDefaultPort" placeholder="请输入默认端口" />
            </el-form-item>
            
            <el-form-item label="配置路径">
              <el-input v-model="deviceForm.installConfigPath" placeholder="请输入配置路径" />
            </el-form-item>
            
            <el-form-item label="日志路径">
              <el-input v-model="deviceForm.installLogPath" placeholder="请输入安装日志路径" />
            </el-form-item>
            
            <el-form-item label="服务日志路径">
              <el-input v-model="deviceForm.serviceLogPath" placeholder="请输入服务日志路径" />
            </el-form-item>
            
            <el-form-item label="自定义路径">
              <el-input v-model="deviceForm.installPathCustom" placeholder="请输入自定义路径" />
            </el-form-item>

            <h3 class="text-lg font-medium mb-4 mt-6">状态信息</h3>
            
            <el-form-item label="安装版本" prop="installVersion">
              <el-input v-model="deviceForm.installVersion" placeholder="请输入版本" />
            </el-form-item>
            
            <el-form-item label="安装状态" prop="installStatus">
              <el-select v-model="deviceForm.installStatus" placeholder="请选择安装状态" class="w-full">
                <el-option :value="0" label="未安装" />
                <el-option :value="1" label="安装中" />
                <el-option :value="2" label="已安装" />
                <el-option :value="3" label="安装失败" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="运行状态" prop="installRunStatus">
              <el-select v-model="deviceForm.installRunStatus" placeholder="请选择运行状态" class="w-full">
                <el-option :value="0" label="未运行" />
                <el-option :value="1" label="运行中" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="安装时间">
              <el-date-picker 
                v-model="deviceForm.installTime" 
                type="datetime" 
                placeholder="选择安装时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
            
            <el-form-item label="最后启动时间">
              <el-date-picker 
                v-model="deviceForm.installLastStartTime" 
                type="datetime" 
                placeholder="选择最后启动时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
            
            <el-form-item label="最后停止时间">
              <el-date-picker 
                v-model="deviceForm.installLastStopTime" 
                type="datetime" 
                placeholder="选择最后停止时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
            
            <el-form-item label="最后检查时间">
              <el-date-picker 
                v-model="deviceForm.installLastCheckTime" 
                type="datetime" 
                placeholder="选择最后检查时间"
                format="YYYY-MM-DD HH:mm:ss"
                value-format="YYYY-MM-DD HH:mm:ss"
                class="w-full"
              />
            </el-form-item>
          </el-form>
        </div>
        
        <!-- 右侧命令设置 -->
        <div class="form-right flex-1 pl-4 border-l">
          <el-tabs v-model="commandActiveTab" type="border-card">
            <el-tab-pane label="安装命令" name="install">
              <div class="command-editor">
                <h4 class="mb-2">安装命令</h4>
                <ScCodeEditor 
                  v-model="deviceForm.softServiceInstallCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
                <div class="mt-2">
                  <el-radio-group v-model="deviceForm.softServiceInstallCommandType">
                    <el-radio :label="0">单行命令</el-radio>
                    <el-radio :label="1">脚本</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="command-flags mt-4">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p>安装成功标识:</p>
                      <el-input v-model="deviceForm.softServiceInstallSuccessFlag" placeholder="例如: installed successfully" />
                    </el-col>
                    <el-col :span="12">
                      <p>安装失败标识:</p>
                      <el-input v-model="deviceForm.softServiceInstallFailureFlag" placeholder="例如: installation failed" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="卸载命令" name="uninstall">
              <div class="command-editor">
                <h4 class="mb-2">卸载命令</h4>
                <ScCodeEditor 
                  v-model="deviceForm.softServiceUninstallCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
                <div class="mt-2">
                  <el-radio-group v-model="deviceForm.softServiceUninstallCommandType">
                    <el-radio :label="0">单行命令</el-radio>
                    <el-radio :label="1">脚本</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="command-flags mt-4">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p>卸载成功标识:</p>
                      <el-input v-model="deviceForm.softServiceUninstallSuccessFlag" placeholder="例如: uninstalled successfully" />
                    </el-col>
                    <el-col :span="12">
                      <p>卸载失败标识:</p>
                      <el-input v-model="deviceForm.softServiceUninstallFailureFlag" placeholder="例如: uninstall failed" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="启动命令" name="start">
              <div class="command-editor">
                <h4 class="mb-2">启动命令</h4>
                <ScCodeEditor 
                  v-model="deviceForm.softServiceStartCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
                <div class="mt-2">
                  <el-radio-group v-model="deviceForm.softServiceStartCommandType">
                    <el-radio :label="0">单行命令</el-radio>
                    <el-radio :label="1">脚本</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="command-flags mt-4">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p>启动成功标识:</p>
                      <el-input v-model="deviceForm.softServiceStartSuccessFlag" placeholder="例如: started successfully" />
                    </el-col>
                    <el-col :span="12">
                      <p>启动失败标识:</p>
                      <el-input v-model="deviceForm.softServiceStartFailureFlag" placeholder="例如: start failed" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="停止命令" name="stop">
              <div class="command-editor">
                <h4 class="mb-2">停止命令</h4>
                <ScCodeEditor 
                  v-model="deviceForm.softServiceStopCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
                <div class="mt-2">
                  <el-radio-group v-model="deviceForm.softServiceStopCommandType">
                    <el-radio :label="0">单行命令</el-radio>
                    <el-radio :label="1">脚本</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="command-flags mt-4">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p>停止成功标识:</p>
                      <el-input v-model="deviceForm.softServiceStopSuccessFlag" placeholder="例如: stopped successfully" />
                    </el-col>
                    <el-col :span="12">
                      <p>停止失败标识:</p>
                      <el-input v-model="deviceForm.softServiceStopFailureFlag" placeholder="例如: stop failed" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="重启命令" name="restart">
              <div class="command-editor">
                <h4 class="mb-2">重启命令</h4>
                <ScCodeEditor 
                  v-model="deviceForm.softServiceRestartCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
                <div class="mt-2">
                  <el-radio-group v-model="deviceForm.softServiceRestartCommandType">
                    <el-radio :label="0">单行命令</el-radio>
                    <el-radio :label="1">脚本</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="command-flags mt-4">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p>重启成功标识:</p>
                      <el-input v-model="deviceForm.softServiceRestartSuccessFlag" placeholder="例如: restarted successfully" />
                    </el-col>
                    <el-col :span="12">
                      <p>重启失败标识:</p>
                      <el-input v-model="deviceForm.softServiceRestartFailureFlag" placeholder="例如: restart failed" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="状态检查命令" name="status">
              <div class="command-editor">
                <h4 class="mb-2">状态检查命令</h4>
                <ScCodeEditor 
                  v-model="deviceForm.softServiceStatusCheckCommand" 
                  height="300" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
                <div class="mt-2">
                  <el-radio-group v-model="deviceForm.softServiceStatusCheckCommandType">
                    <el-radio :label="0">单行命令</el-radio>
                    <el-radio :label="1">脚本</el-radio>
                  </el-radio-group>
                </div>
                
                <div class="command-flags mt-4">
                  <el-row :gutter="20">
                    <el-col :span="12">
                      <p>状态检查成功标识:</p>
                      <el-input v-model="deviceForm.softServiceStatusCheckSuccessFlag" placeholder="例如: running 或 active" />
                    </el-col>
                    <el-col :span="12">
                      <p>状态检查失败标识:</p>
                      <el-input v-model="deviceForm.softServiceStatusCheckFailureFlag" placeholder="例如: stopped 或 inactive" />
                    </el-col>
                  </el-row>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="服务配置" name="config">
              <div class="command-editor">
                <h4 class="mb-2">服务配置</h4>
                <ScCodeEditor 
                  v-model="deviceForm.serviceConfig" 
                  height="400" 
                  mode="shell" 
                  :options="codeEditorOptions" 
                />
              </div>
          </el-tab-pane>
        </el-tabs>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deviceFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDeviceForm" :loading="submitting">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits, watch, defineAsyncComponent, onMounted } from 'vue'
import { message } from "@repo/utils"
import { ElMessageBox } from 'element-plus'
import ScCard from "@repo/components/ScCard/index.vue"
import type { PropType } from 'vue'
import { 
  fetchSoftServiceInstallAdd,
  fetchSoftServiceInstallUpdate,
  fetchSoftServiceInstallDelete,
  type SoftServiceInstall
} from '@/api/soft/install'
import { machineSshListData } from "@/api/system/assets-ssh"
import "codemirror/mode/shell/shell.js"

// 异步导入ScCodeEditor组件
const ScCodeEditor = defineAsyncComponent(() => import("@repo/components/ScCodeEditor/index.vue"))

const props = defineProps({
  deviceList: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  softServiceId: {
    type: Number,
    required: true
  },
  softServiceName: {
    type: String,
    default: ''
  },
  selectedDeviceId: {
    type: [String, Number],
    default: ''
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['select-device', 'refresh', 'add', 'edit', 'delete'])

// 设备表单相关
const deviceFormVisible = ref(false)
const isEdit = ref(false)
const activeTab = ref('basic')
const commandActiveTab = ref('install')
const submitting = ref(false)

// SSH设备列表
const sshList = ref<any[]>([])
const sshListLoading = ref(false)

// 代码编辑器配置
const codeEditorOptions = {
  lineNumbers: true,
  styleActiveLine: true,
  matchBrackets: true,
  theme: 'idea',
  autoRefresh: true,
  lineWrapping: true,
  // 高亮关键词
  hintOptions: {
    completeSingle: false
  },
  extraKeys: {
    "Ctrl-Space": "autocomplete"
  },
  // 自定义高亮规则
  mode: "shell"
}

// 根据SoftServiceInstall接口定义表单数据
const deviceForm = reactive<Partial<SoftServiceInstall>>({
  installId: undefined,
  sshId: '',
  softServiceId: 0,
  sshName: '',
  sshHost: '',
  sshPort: 22,
  installPath: '',
  installVersion: '',
  installStatus: 0,
  installRunStatus: 0,
  installConfigPath: '',
  installLogPath: '',
  serviceLogPath: '',
  installTime: undefined,
  installLastStartTime: undefined,
  installLastStopTime: undefined,
  installLastCheckTime: undefined,
  softServiceName: '',
  softServiceInstallCommand: '',
  softServiceInstallCommandType: 0,
  softServiceUninstallCommand: '',
  softServiceUninstallCommandType: 0,
  softServiceStartCommand: '',
  softServiceStartCommandType: 0,
  softServiceStopCommand: '',
  softServiceStopCommandType: 0,
  softServiceRestartCommand: '',
  softServiceRestartCommandType: 0,
  softServiceStatusCheckCommand: '',
  softServiceStatusCheckCommandType: 0,
  softServiceStatusCheckSuccessFlag: '',
  softServiceStatusCheckFailureFlag: '',
  softServiceInstallSuccessFlag: '',
  softServiceInstallFailureFlag: '',
  softServiceUninstallSuccessFlag: '',
  softServiceUninstallFailureFlag: '',
  softServiceStartSuccessFlag: '',
  softServiceStartFailureFlag: '',
  softServiceStopSuccessFlag: '',
  softServiceStopFailureFlag: '',
  softServiceRestartSuccessFlag: '',
  softServiceRestartFailureFlag: '',
  serviceConfig: '',
  installPathCustom: '',
  installPort: '',
  installDefaultPort: ''
})

// 表单验证规则
const deviceFormRules = {
  sshId: [{ required: true, message: '请选择SSH设备', trigger: 'change' }],
  sshName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  sshHost: [{ required: true, message: '请输入设备地址', trigger: 'blur' }],
  sshPort: [{ required: true, message: '请输入设备端口', trigger: 'blur' }],
  installPath: [{ required: true, message: '请输入安装路径', trigger: 'blur' }],
  installVersion: [{ required: true, message: '请输入版本', trigger: 'blur' }],
  installStatus: [{ required: true, message: '请选择安装状态', trigger: 'change' }],
  installRunStatus: [{ required: true, message: '请选择运行状态', trigger: 'change' }]
}

const deviceFormRef = ref()

// 加载SSH设备列表
const loadSshList = async () => {
  try {
    sshListLoading.value = true
    const res = await machineSshListData({
      page: 1,
      limit: 100
    })
    
    if (res.code === 200) {
      sshList.value = res.data.result || []
    } else {
      message.error(res.msg || '加载SSH设备列表失败')
    }
  } catch (error) {
    console.error('加载SSH设备列表失败:', error)
    message.error('加载SSH设备列表失败')
  } finally {
    sshListLoading.value = false
  }
}

// 监听选择的SSH设备变化
watch(() => deviceForm.sshId, (newVal) => {
  if (newVal) {
    const selectedSsh = sshList.value.find(item => item.id === newVal)
    if (selectedSsh) {
      deviceForm.sshName = selectedSsh.name || ''
      deviceForm.sshHost = selectedSsh.host || ''
      deviceForm.sshPort = selectedSsh.port || 22
    }
  }
})

// 在组件挂载时加载SSH设备列表
onMounted(() => {
  loadSshList()
})

// 格式化日期
const formatDate = (dateStr?: string | number | Date) => {
  if (!dateStr) return '未知'
  
  try {
    const date = new Date(dateStr)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  } catch (e) {
    return '未知'
  }
}

// 获取状态标签类型
const getStatusTagType = (status: string | number) => {
  if (typeof status === 'string') {
    switch (status) {
      case 'pending': return 'info'
      case 'running': return 'warning'
      case 'success': return 'success'
      case 'error': return 'danger'
      default: return 'info'
    }
  } else {
    // 数字类型状态
    switch (status) {
      case 0: return 'info'     // 未安装
      case 1: return 'warning'  // 安装中
      case 2: return 'success'  // 已安装
      case 3: return 'danger'   // 安装失败
      default: return 'info'
    }
  }
}

// 获取状态文本
const getStatusText = (status: string | number) => {
  if (typeof status === 'string') {
    switch (status) {
      case 'pending': return '未安装'
      case 'running': return '安装中'
      case 'success': return '已安装'
      case 'error': return '安装失败'
      default: return '未知'
    }
  } else {
    // 数字类型状态
    switch (status) {
      case 0: return '未安装'
      case 1: return '安装中'
      case 2: return '已安装'
      case 3: return '安装失败'
      default: return '未知'
    }
  }
}

// 处理选择设备
const handleSelectDevice = (device: any) => {
  emit('select-device', device.installId || device.id)
}

// 处理刷新
const handleRefresh = () => {
  emit('refresh')
}

// 处理下拉菜单命令
const handleCommand = (command: string, device: any) => {
  switch (command) {
    case 'edit':
      handleEditDevice(device)
      break
    case 'delete':
      handleDeleteDevice(device)
      break
  }
}

// 添加设备
const handleAddDevice = () => {
  isEdit.value = false
  activeTab.value = 'basic'
  commandActiveTab.value = 'install'
  
  // 重置表单
  Object.keys(deviceForm).forEach(key => {
    if (key === 'sshPort') {
      deviceForm[key] = 22;
    } else if (key === 'softServiceId') {
      deviceForm[key] = props.softServiceId;
    } else if (key === 'softServiceName') {
      deviceForm[key] = props.softServiceName;
    } else if (key.endsWith('CommandType')) {
      deviceForm[key] = 0;
    } else if (key === 'installStatus' || key === 'installRunStatus') {
      deviceForm[key] = 0;
    } else if (typeof deviceForm[key] === 'string') {
      deviceForm[key] = '';
    } else if (typeof deviceForm[key] === 'number') {
      deviceForm[key] = undefined;
    } else {
      deviceForm[key] = undefined;
    }
  });
  
  deviceFormVisible.value = true
}

// 编辑设备
const handleEditDevice = (device: any) => {
  isEdit.value = true
  activeTab.value = 'basic'
  commandActiveTab.value = 'install'
  
  // 先重置表单
  Object.keys(deviceForm).forEach(key => {
    if (key === 'sshPort') {
      deviceForm[key] = 22;
    } else if (key === 'softServiceId') {
      deviceForm[key] = props.softServiceId;
    } else if (key === 'softServiceName') {
      deviceForm[key] = props.softServiceName;
    } else if (key.endsWith('CommandType')) {
      deviceForm[key] = 0;
    } else if (key === 'installStatus' || key === 'installRunStatus') {
      deviceForm[key] = 0;
    } else if (typeof deviceForm[key] === 'string') {
      deviceForm[key] = '';
    } else if (typeof deviceForm[key] === 'number') {
      deviceForm[key] = undefined;
    } else {
      deviceForm[key] = undefined;
    }
  });
  
  // 填充表单数据
  Object.keys(device).forEach(key => {
    if (key in deviceForm && device[key] !== null && device[key] !== undefined) {
      deviceForm[key] = device[key];
    }
  });
  
  // 特殊处理的字段
  deviceForm.installStatus = typeof device.installStatus === 'string' 
    ? convertStatusToNumber(device.installStatus) 
    : (device.installStatus || 0);
  
  deviceForm.sshPort = Number(device.sshPort || device.port || 22);
  deviceForm.softServiceId = props.softServiceId;
  deviceForm.softServiceName = props.softServiceName;
  
  deviceFormVisible.value = true
}

// 转换状态字符串为数字
const convertStatusToNumber = (status: string): number => {
  switch (status) {
    case 'pending': return 0
    case 'running': return 1
    case 'success': return 2
    case 'error': return 3
    default: return 0
  }
}

// 删除设备
const handleDeleteDevice = async (device: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除设备 "${device.sshName || device.name || '未命名设备'}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await fetchSoftServiceInstallDelete({ installId: device.installId })
    
    if (res.code === "00000") {
      message.success('删除设备成功')
      emit('delete', device)
      emit('refresh')
    } else {
      message.error(res.msg || '删除设备失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除设备失败:', error)
      message.error('删除设备失败')
    }
  }
}

// 提交设备表单
const submitDeviceForm = async () => {
  if (!deviceFormRef.value) return
  
  try {
    await deviceFormRef.value.validate()
    submitting.value = true
    
    // 准备提交的数据，确保类型正确
    const submitData = {
      ...deviceForm,
      // 确保数值类型字段为数字
      installStatus: Number(deviceForm.installStatus),
      installRunStatus: Number(deviceForm.installRunStatus),
      softServiceId: Number(deviceForm.softServiceId),
      sshPort: Number(deviceForm.sshPort),
      softServiceInstallCommandType: Number(deviceForm.softServiceInstallCommandType || 0),
      softServiceUninstallCommandType: Number(deviceForm.softServiceUninstallCommandType || 0),
      softServiceStartCommandType: Number(deviceForm.softServiceStartCommandType || 0),
      softServiceStopCommandType: Number(deviceForm.softServiceStopCommandType || 0),
      softServiceRestartCommandType: Number(deviceForm.softServiceRestartCommandType || 0),
      softServiceStatusCheckCommandType: Number(deviceForm.softServiceStatusCheckCommandType || 0)
    }
    
    let res
    if (isEdit.value) {
      res = await fetchSoftServiceInstallUpdate(submitData)
    } else {
      res = await fetchSoftServiceInstallAdd(submitData)
    }
    
    if (res.code === "00000") {
      message.success(isEdit.value ? '更新设备成功' : '绑定设备成功')
      deviceFormVisible.value = false
      emit(isEdit.value ? 'edit' : 'add', submitData)
      emit('refresh')
    } else {
      message.error(res.msg || (isEdit.value ? '更新设备失败' : '绑定设备失败'))
    }
  } catch (error) {
    console.error('提交设备表单失败:', error)
    message.error('表单验证失败，请检查输入')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped lang="scss">
.device-card-list {
  .device-header {
    margin-bottom: 20px;
  }

  .device-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }

  .empty-container {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 300px;
  }
  
  .loading-container {
    min-height: 300px;
  }

  .device-card {
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-4px);
    }
    
    &.selected-device {
      border-color: var(--el-color-primary);
      box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb), 0.2);
    }
    
    :deep(.sc-card-default__header) {
      padding: 12px 16px;
    }
    
    :deep(.sc-card-default__body) {
      padding: 16px;
    }
    
    :deep(.sc-card-default__footer) {
      padding: 12px 16px;
    }
  }

  .card-header {
    padding: 0;
    width: 100%;
  }

  .device-name {
    font-weight: 500;
    font-size: 15px;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .device-info {
    padding-top: 10px;
    
    .info-item {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .label {
        color: var(--el-text-color-secondary);
        width: 80px;
        flex-shrink: 0;
      }
      
      .value {
        color: var(--el-text-color-primary);
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
  
  .card-actions {
    margin-top: 0;
  }
}

.form-container {
  display: flex;
  
  .form-left, .form-right {
    width: 50%;
  }
}

.device-form {
  max-height: 60vh;
  overflow-y: auto;
  padding-right: 12px;
}

.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  line-height: 1.4;
}

.command-editor {
  padding: 16px;
  
  h4 {
    font-weight: 500;
  }
  
  .command-flags {
    margin-top: 16px;
    
    p {
      margin-bottom: 8px;
      color: var(--el-text-color-secondary);
    }
  }
}

:deep(.el-tabs--border-card) {
  box-shadow: none;
}
</style> 