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

    <div class="device-grid">
      <div v-if="loading" class="loading-container flex justify-center items-center py-8">
        <el-skeleton :rows="3" animated />
      </div>
      <el-empty v-else-if="deviceList.length === 0" description="暂无设备" :image-size="100" />
      <ScCard
        v-else
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
        <template #title>
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
      </ScCard>
    </div>

    <!-- 设备表单对话框 -->
    <el-dialog
      v-model="deviceFormVisible"
      :title="isEdit ? '编辑设备' : '绑定设备'"
      width="500px"
      destroy-on-close
    >
      <el-form 
        ref="deviceFormRef" 
        :model="deviceForm" 
        label-width="100px"
        :rules="deviceFormRules"
      >
        <el-form-item label="设备名称" prop="sshName">
          <el-input v-model="deviceForm.sshName" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="设备地址" prop="sshHost">
          <el-input v-model="deviceForm.sshHost" placeholder="请输入设备地址" />
        </el-form-item>
        <el-form-item label="设备端口" prop="sshPort">
          <el-input v-model="deviceForm.sshPort" placeholder="请输入设备端口" />
        </el-form-item>
        <el-form-item label="安装路径" prop="installPath">
          <el-input v-model="deviceForm.installPath" placeholder="请输入安装路径" />
        </el-form-item>
        <el-form-item label="版本" prop="installVersion">
          <el-input v-model="deviceForm.installVersion" placeholder="请输入版本" />
        </el-form-item>
        <el-form-item label="配置路径" prop="installConfigPath">
          <el-input v-model="deviceForm.installConfigPath" placeholder="请输入配置路径" />
        </el-form-item>
        <el-form-item label="安装状态" prop="installStatus">
          <el-select v-model="deviceForm.installStatus" placeholder="请选择安装状态">
            <el-option :value="0" label="未安装" />
            <el-option :value="1" label="安装中" />
            <el-option :value="2" label="已安装" />
            <el-option :value="3" label="安装失败" />
          </el-select>
        </el-form-item>
        <el-form-item label="运行状态" prop="installRunStatus">
          <el-select v-model="deviceForm.installRunStatus" placeholder="请选择运行状态">
            <el-option :value="0" label="未运行" />
            <el-option :value="1" label="运行中" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="deviceFormVisible = false">取消</el-button>
          <el-button type="primary" @click="submitDeviceForm">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, defineProps, defineEmits, watch } from 'vue'
import { message } from "@repo/utils"
import { ElMessageBox } from 'element-plus'
import ScCard from "@repo/components/ScCard/index.vue"
import { 
  fetchSoftServiceInstallAdd,
  fetchSoftServiceInstallUpdate,
  fetchSoftServiceInstallDelete,
  type SoftServiceInstall
} from '@/api/soft/install'

const props = defineProps({
  deviceList: {
    type: Array as PropType<any[]>,
    default: () => []
  },
  softServiceId: {
    type: Number,
    required: true
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
const deviceForm = reactive({
  installId: undefined as string | number | undefined,
  sshId: '',
  softServiceId: 0,
  sshName: '',
  sshHost: '',
  sshPort: '',
  installPath: '',
  installVersion: '',
  installStatus: 0,
  installRunStatus: 0,
  installConfigPath: ''
})

// 表单验证规则
const deviceFormRules = {
  sshName: [{ required: true, message: '请输入设备名称', trigger: 'blur' }],
  sshHost: [{ required: true, message: '请输入设备地址', trigger: 'blur' }],
  sshPort: [{ required: true, message: '请输入设备端口', trigger: 'blur' }],
  installPath: [{ required: true, message: '请输入安装路径', trigger: 'blur' }],
  installVersion: [{ required: true, message: '请输入版本', trigger: 'blur' }],
  installStatus: [{ required: true, message: '请选择安装状态', trigger: 'change' }],
  installRunStatus: [{ required: true, message: '请选择运行状态', trigger: 'change' }]
}

const deviceFormRef = ref()

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
  // 重置表单
  deviceForm.installId = undefined
  deviceForm.sshId = ''
  deviceForm.softServiceId = props.softServiceId
  deviceForm.sshName = ''
  deviceForm.sshHost = ''
  deviceForm.sshPort = ''
  deviceForm.installPath = ''
  deviceForm.installVersion = ''
  deviceForm.installStatus = 0
  deviceForm.installRunStatus = 0
  deviceForm.installConfigPath = ''
  deviceFormVisible.value = true
}

// 编辑设备
const handleEditDevice = (device: any) => {
  isEdit.value = true
  // 填充表单数据
  deviceForm.installId = device.installId
  deviceForm.sshId = device.sshId || ''
  deviceForm.softServiceId = device.softServiceId || props.softServiceId
  deviceForm.sshName = device.sshName || device.name || ''
  deviceForm.sshHost = device.sshHost || device.host || ''
  deviceForm.sshPort = device.sshPort || device.port || ''
  deviceForm.installPath = device.installPath || ''
  deviceForm.installVersion = device.installVersion || device.softServiceVersion || ''
  deviceForm.installStatus = typeof device.installStatus === 'string' 
    ? convertStatusToNumber(device.installStatus) 
    : (device.installStatus || 0)
  deviceForm.installRunStatus = device.installRunStatus || 0
  deviceForm.installConfigPath = device.installConfigPath || ''
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
    
    // 准备提交的数据
    const submitData = {
      ...deviceForm,
      // 确保数值类型字段为数字
      installStatus: Number(deviceForm.installStatus),
      installRunStatus: Number(deviceForm.installRunStatus),
      softServiceId: Number(deviceForm.softServiceId)
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
    
    :deep(.sc-card-title) {
      padding: 12px 0;
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
  
  .loading-container {
    min-height: 300px;
  }
}
</style> 