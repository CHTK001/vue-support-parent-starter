<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑服务' : '添加服务'"
    width="500px"
    destroy-on-close
  >
    <el-form :model="form" label-width="100px" label-position="left">
      <el-form-item label="服务名称">
        <el-input v-model="form.sshName" placeholder="请输入服务名称" />
      </el-form-item>
      <el-form-item label="服务软件">
        <el-select v-model="form.softServiceId" placeholder="请选择服务软件(可选)" class="w-full" clearable>
          <el-option
            v-for="item in softServiceList"
            :key="item.softServiceId"
            :label="item.softServiceName"
            :value="item.softServiceId"
          />
          <template #suffix>
            <el-tag type="info" size="small">
              {{ serviceVersion }}
            </el-tag>
          </template>
        </el-select>
      </el-form-item>
      <el-form-item label="服务地址">
        <el-input v-model="form.sshHost" placeholder="请输入服务地址" readonly/>
      </el-form-item>
      <el-form-item label="服务端口">
        <el-input v-model="form.sshPort" placeholder="请输入服务端口" readonly/>
      </el-form-item>
      <el-form-item label="安装路径">
        <el-input v-model="form.installPath" placeholder="请输入安装路径" />
      </el-form-item>
      <el-form-item label="安装版本">
        <el-input v-model="form.installVersion" placeholder="请输入安装版本" />
      </el-form-item>
      <el-form-item label="运行状态">
        <el-select v-model.number="form.installRunStatus" placeholder="请选择运行状态" class="w-full">
          <el-option :value="0" label="未运行" />
          <el-option :value="1" label="运行中" />
          <el-option :value="2" label="已停止" />
        </el-select>
      </el-form-item>
      <el-form-item label="安装状态">
        <el-select v-model.number="form.installStatus" placeholder="请选择安装状态" class="w-full">
          <el-option :value="0" label="未安装" />
          <el-option :value="1" label="安装中" />
          <el-option :value="2" label="已安装" />
          <el-option :value="3" label="安装失败" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref, reactive, defineProps, defineEmits, watch } from 'vue'
import { message } from "@repo/utils"

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
  sshPort: ''
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
  }
}, { deep: true, immediate: true })

// 取消
const handleCancel = () => {
  visible.value = false
  emit('cancel')
}

// 提交
const handleSubmit = () => {
  if (!form.installPath) {
    message.warning('请输入安装路径')
    return
  }
  
  if (!form.installVersion) {
    message.warning('请输入安装版本')
    return
  }
  
  const data = {
    ...form,
    sshPort: parseInt(form.sshPort as string, 10) || 0
  }
  
  emit('submit', data)
  visible.value = false
}
</script> 