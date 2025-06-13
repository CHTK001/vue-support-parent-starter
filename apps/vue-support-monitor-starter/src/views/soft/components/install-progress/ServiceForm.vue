<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑服务' : '添加服务'"
    width="700px"
    destroy-on-close
  >
    <el-form :model="form" label-width="120px" label-position="left" :rules="formRules" ref="formRef">
      <!-- 基本信息 -->
      <el-divider content-position="left">基本信息</el-divider>
      
      <el-form-item label="服务名称" prop="sshName">
        <el-input v-model="form.sshName" placeholder="请输入服务名称" />
      </el-form-item>
      
      <el-form-item label="服务软件" prop="softServiceId">
        <el-select v-model="form.softServiceId" placeholder="请选择服务软件" class="w-full" clearable filterable>
          <el-option
            v-for="item in softServiceList"
            :key="item.softServiceId"
            :label="item.softServiceName"
            :value="item.softServiceId"
          />
          <template #suffix>
            <el-tag v-if="serviceVersion" type="info" size="small">
              {{ serviceVersion }}
            </el-tag>
          </template>
        </el-select>
      </el-form-item>
      
      <!-- 服务器信息 -->
      <el-divider content-position="left">服务器信息</el-divider>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="服务地址" prop="sshHost">
            <el-input v-model="form.sshHost" placeholder="请输入服务地址" :readonly="isEdit" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="服务端口" prop="sshPort">
            <el-input-number v-model="form.sshPort" placeholder="请输入服务端口" :min="1" :max="65535" class="w-full" :readonly="isEdit" />
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="SSH用户名">
        <el-input v-model="form.sshUsername" placeholder="请输入SSH用户名" />
      </el-form-item>
      
      <el-form-item label="SSH密码">
        <el-input v-model="form.sshPassword" type="password" placeholder="请输入SSH密码" show-password />
      </el-form-item>
      
      <!-- 安装信息 -->
      <el-divider content-position="left">安装信息</el-divider>
      
      <el-form-item label="安装路径" prop="installPath">
        <el-input v-model="form.installPath" placeholder="请输入安装路径">
          <template #append>
            <el-tooltip content="默认安装路径" placement="top">
              <el-button @click="useDefaultPath">默认</el-button>
            </el-tooltip>
          </template>
        </el-input>
      </el-form-item>
      
      <el-form-item label="安装版本" prop="installVersion">
        <el-input v-model="form.installVersion" placeholder="请输入安装版本" />
      </el-form-item>
      
      <el-form-item label="配置文件路径">
        <el-input v-model="form.installConfigPath" placeholder="请输入配置文件路径" />
        <div class="text-xs text-gray-500 mt-1">配置文件的完整路径，如 /etc/nginx/nginx.conf</div>
      </el-form-item>
      
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="运行状态">
            <el-select v-model.number="form.installRunStatus" placeholder="请选择运行状态" class="w-full">
              <el-option :value="0" label="未运行" />
              <el-option :value="1" label="运行中" />
              <el-option :value="2" label="已停止" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="安装状态">
            <el-select v-model.number="form.installStatus" placeholder="请选择安装状态" class="w-full">
              <el-option :value="0" label="未安装" />
              <el-option :value="1" label="安装中" />
              <el-option :value="2" label="已安装" />
              <el-option :value="3" label="安装失败" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      
      <el-form-item label="备注">
        <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="请输入备注信息" />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive, defineProps, defineEmits, watch } from 'vue'
import { message } from "@repo/utils"
import type { FormInstance, FormRules } from 'element-plus'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  serviceData: {
    type: Object,
    default: () => ({})
  },
  isEdit: {
    type: Boolean,
    default: false
  },
  softServiceList: {
    type: Array as PropType<any[]>,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'submit', 'cancel'])

const formRef = ref<FormInstance>()
const submitLoading = ref(false)

const serviceVersion = computed(() => {
  const service = props.softServiceList.find(item => item.softServiceId === form.softServiceId)
  return service?.softServiceVersion
})

const visible = ref(props.modelValue)
const form = reactive<any>({
  installId: undefined,
  sshId: '',
  softServiceId: 0,
  installStatus: 0,
  installPath: '',
  installVersion: '',
  installRunStatus: 0,
  sshName: '',
  sshHost: '',
  sshPort: 22,
  sshUsername: 'root',
  sshPassword: '',
  installConfigPath: '',
  remark: ''
})

// 表单验证规则
const formRules = reactive<FormRules>({
  sshName: [
    { required: true, message: '请输入服务名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  sshHost: [
    { required: true, message: '请输入服务地址', trigger: 'blur' }
  ],
  sshPort: [
    { required: true, message: '请输入服务端口', trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口范围为 1-65535', trigger: 'blur' }
  ],
  installPath: [
    { required: true, message: '请输入安装路径', trigger: 'blur' }
  ],
  installVersion: [
    { required: true, message: '请输入安装版本', trigger: 'blur' }
  ]
})

// 监听visible变化
watch(() => visible.value, (val) => {
  emit('update:modelValue', val)
})

// 监听modelValue变化
watch(() => props.modelValue, (val) => {
  visible.value = val
})

// 监听serviceData变化
watch(() => props.serviceData, (val) => {
  if (val) {
    Object.assign(form, val)
    
    // 确保端口是数字类型
    if (typeof form.sshPort === 'string') {
      form.sshPort = parseInt(form.sshPort, 10) || 22
    }
    
    // 设置默认值
    if (!form.sshUsername) form.sshUsername = 'root'
    if (!form.installRunStatus && form.installRunStatus !== 0) form.installRunStatus = 0
    if (!form.installStatus && form.installStatus !== 0) form.installStatus = 0
  }
}, { deep: true, immediate: true })

// 使用默认安装路径
const useDefaultPath = () => {
  const service = props.softServiceList.find(item => item.softServiceId === form.softServiceId)
  if (service) {
    form.installPath = `/opt/${service.softServiceName.toLowerCase().replace(/\s+/g, '-')}`
  } else {
    form.installPath = '/opt/service'
  }
}

// 取消
const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) {
      message.warning('请填写必填项')
      return
    }
    
    submitLoading.value = true
    
    try {
      const data = {
        ...form,
        sshPort: parseInt(String(form.sshPort), 10) || 22
      }
      
      emit('submit', data)
      visible.value = false
    } catch (error) {
      console.error('提交表单失败:', error)
    } finally {
      submitLoading.value = false
    }
  })
}
</script>

<style lang="scss" scoped>
.w-full {
  width: 100%;
}

:deep(.el-input-number .el-input__inner) {
  text-align: left;
}

:deep(.el-divider__text) {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
}
</style> 