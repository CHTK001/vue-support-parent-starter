<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑软件' : '新增软件'"
    width="70%"
    draggable
    top="10px"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="form"
      :rules="rules"
      label-width="100px"
      @submit.prevent
    >
      <el-form-item label="软件名称" prop="softServiceName">
        <el-input v-model="form.softServiceName" placeholder="请输入软件名称"/>
      </el-form-item>

      <el-form-item label="软件版本" prop="softServiceVersion">
        <el-input v-model="form.softServiceVersion" placeholder="请输入版本号"/>
      </el-form-item>

      <el-form-item label="下载地址" prop="softServiceDownloadUrl">
        <el-input v-model="form.softServiceDownloadUrl" placeholder="请输入下载地址"/>
      </el-form-item>

      <el-form-item label="分类" prop="softServiceCategory">
        <el-select v-model="form.softServiceCategory" placeholder="请选择软件分类">
          <el-option label="数据库" value="database"/>
          <el-option label="Web服务器" value="web_server"/>
          <el-option label="开发工具" value="development"/>
          <el-option label="监控工具" value="monitoring"/>
          <el-option label="容器" value="container"/>
          <el-option label="其他" value="other"/>
        </el-select>
      </el-form-item>

      <el-form-item label="安装命令" prop="softServiceInstallCommand">
        <el-input 
          v-model="form.softServiceInstallCommand"
          type="textarea"
          :rows="4"
          placeholder="请输入安装命令"
        />
      </el-form-item>

      <el-form-item label="卸载命令" prop="softServiceUninstallCommand">
        <el-input
          v-model="form.softServiceUninstallCommand"
          type="textarea" 
          :rows="4"
          placeholder="请输入卸载命令"
        />
      </el-form-item>

      <el-form-item label="启动命令" prop="softServiceStartCommand">
        <el-input
          v-model="form.softServiceStartCommand"
          type="textarea"
          :rows="4"
          placeholder="请输入启动命令"
        />
      </el-form-item>

      <el-form-item label="停止命令" prop="softServiceStopCommand">
        <el-input
          v-model="form.softServiceStopCommand"
          type="textarea"
          :rows="4"
          placeholder="请输入停止命令"
        />
      </el-form-item>

      <el-form-item label="重启命令" prop="softServiceRestartCommand">
        <el-input
          v-model="form.softServiceRestartCommand"
          type="textarea"
          :rows="4"
          placeholder="请输入重启命令" 
        />
      </el-form-item>

      <el-form-item label="备注" prop="softServiceRemark">
        <el-input
          v-model="form.softServiceRemark"
          type="textarea"
          :rows="4"
          placeholder="请输入备注说明"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleCancel">取消</el-button>
      <el-button type="primary" @click="handleSubmit" :loading="loading">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import type { FormInstance } from 'element-plus'
import { message } from '@repo/utils'
import { fetchSoftServiceSave, fetchSoftServiceUpdate, type PartialSoftService } from '@/api/soft'

const props = defineProps<{
  modelValue?: boolean
  isEdit: boolean
  software?: PartialSoftService
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', visible: boolean): void
  (e: 'success'): void
  (e: 'submit', formData: PartialSoftService): void
  (e: 'cancel'): void
}>()

const dialogVisible = computed({
  get: () => props.modelValue ?? false,
  set: (val) => emit('update:modelValue', val)
})

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive<PartialSoftService>({
  softServiceName: '',
  softServiceVersion: '',
  softServiceDownloadUrl: '',
  softServiceCategory: '',
  softServiceInstallCommand: '',
  softServiceUninstallCommand: '',
  softServiceStartCommand: '',
  softServiceStopCommand: '',
  softServiceRestartCommand: '',
  softServiceRemark: '',
  ...(props.software || {})
})

const rules = {
  softServiceName: [{ required: true, message: '请输入软件名称', trigger: 'blur' }],
  softServiceVersion: [{ required: true, message: '请输入版本号', trigger: 'blur' }],
  softServiceCategory: [{ required: true, message: '请选择分类', trigger: 'change' }],
  softServiceInstallCommand: [{ required: true, message: '请输入安装命令', trigger: 'blur' }]
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      loading.value = true
      
      // 直接触发提交事件，让父组件处理保存逻辑
      emit('submit', form)
      dialogVisible.value = false
    } catch (error) {
      console.error(error)
      message.error('表单验证失败')
    } finally {
      loading.value = false
    }
  })
}

// 取消按钮处理函数
const handleCancel = () => {
  dialogVisible.value = false
  emit('cancel')
}
</script>
```
