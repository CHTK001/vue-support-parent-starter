<template>
  <el-dialog
    v-model="dialogVisible"
    title="启动容器"
    width="800px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
      <div class="form-section">
        <div class="section-title">基本信息</div>
        
        <el-form-item label="容器名称" prop="containerName">
          <el-input
            v-model="form.containerName"
            placeholder="容器名称（可选）"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="镜像信息">
          <el-input
            :value="imageDisplayName"
            readonly
            disabled
          />
        </el-form-item>
      </div>
      
      <div class="form-section">
        <div class="section-title">端口映射</div>
        
        <div class="port-mappings">
          <div
            v-for="(port, index) in form.portMappings"
            :key="index"
            class="port-mapping-item"
          >
            <el-input
              v-model="port.hostPort"
              placeholder="主机端口"
              style="width: 120px"
            />
            <span class="port-separator">:</span>
            <el-input
              v-model="port.containerPort"
              placeholder="容器端口"
              style="width: 120px"
            />
            <el-select
              v-model="port.protocol"
              style="width: 80px"
            >
              <el-option label="TCP" value="tcp" />
              <el-option label="UDP" value="udp" />
            </el-select>
            <el-button
              type="danger"
              size="small"
              @click="removePortMapping(index)"
              :disabled="form.portMappings.length <= 1"
            >
              删除
            </el-button>
          </div>
          <el-button type="primary" size="small" @click="addPortMapping">
            添加端口映射
          </el-button>
        </div>
      </div>
      
      <div class="form-section">
        <div class="section-title">环境变量</div>
        
        <div class="env-variables">
          <div
            v-for="(env, index) in form.envVariables"
            :key="index"
            class="env-variable-item"
          >
            <el-input
              v-model="env.key"
              placeholder="变量名"
              style="width: 200px"
            />
            <span class="env-separator">=</span>
            <el-input
              v-model="env.value"
              placeholder="变量值"
              style="width: 200px"
            />
            <el-button
              type="danger"
              size="small"
              @click="removeEnvVariable(index)"
            >
              删除
            </el-button>
          </div>
          <el-button type="primary" size="small" @click="addEnvVariable">
            添加环境变量
          </el-button>
        </div>
      </div>
      
      <div class="form-section">
        <div class="section-title">挂载配置</div>
        
        <div class="volume-mounts">
          <div
            v-for="(volume, index) in form.volumeMounts"
            :key="index"
            class="volume-mount-item"
          >
            <el-input
              v-model="volume.hostPath"
              placeholder="主机路径"
              style="width: 250px"
            />
            <span class="volume-separator">:</span>
            <el-input
              v-model="volume.containerPath"
              placeholder="容器路径"
              style="width: 250px"
            />
            <el-button
              type="danger"
              size="small"
              @click="removeVolumeMount(index)"
            >
              删除
            </el-button>
          </div>
          <el-button type="primary" size="small" @click="addVolumeMount">
            添加挂载
          </el-button>
        </div>
      </div>
      
      <div class="form-section">
        <div class="section-title">高级配置</div>
        
        <el-form-item label="重启策略">
          <el-select v-model="form.restartPolicy" style="width: 200px">
            <el-option label="不重启" value="no" />
            <el-option label="总是重启" value="always" />
            <el-option label="异常时重启" value="on-failure" />
            <el-option label="除非手动停止" value="unless-stopped" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="内存限制">
          <el-input
            v-model="form.memoryLimit"
            placeholder="例如: 512m, 1g"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="CPU限制">
          <el-input
            v-model="form.cpuLimit"
            placeholder="例如: 0.5, 2"
            style="width: 200px"
          />
        </el-form-item>
        
        <el-form-item label="网络模式">
          <el-select v-model="form.networkMode" style="width: 200px">
            <el-option label="桥接" value="bridge" />
            <el-option label="主机" value="host" />
            <el-option label="无网络" value="none" />
            <el-option label="容器网络" value="container" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="后台运行">
          <el-switch v-model="form.detached" />
        </el-form-item>
        
        <el-form-item label="自动删除">
          <el-switch v-model="form.autoRemove" />
          <div class="form-tip">容器停止后自动删除</div>
        </el-form-item>
      </div>
    </el-form>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          启动容器
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { containerApi, type SystemSoftImage } from '@/api/docker'

interface Props {
  visible: boolean
  imageData?: SystemSoftImage | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

interface PortMapping {
  hostPort: string
  containerPort: string
  protocol: 'tcp' | 'udp'
}

interface EnvVariable {
  key: string
  value: string
}

interface VolumeMount {
  hostPath: string
  containerPath: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  containerName: '',
  portMappings: [{ hostPort: '', containerPort: '', protocol: 'tcp' as const }] as PortMapping[],
  envVariables: [] as EnvVariable[],
  volumeMounts: [] as VolumeMount[],
  restartPolicy: 'no',
  memoryLimit: '',
  cpuLimit: '',
  networkMode: 'bridge',
  detached: true,
  autoRemove: false
})

const rules: FormRules = {
  containerName: [
    { pattern: /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/, message: '容器名称格式不正确', trigger: 'blur' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

const imageDisplayName = computed(() => {
  if (!props.imageData) return ''
  const { systemSoftImageName, systemSoftImageTag } = props.imageData
  return `${systemSoftImageName}:${systemSoftImageTag}`
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible && props.imageData) {
    resetForm()
  }
})

const addPortMapping = () => {
  form.portMappings.push({ hostPort: '', containerPort: '', protocol: 'tcp' })
}

const removePortMapping = (index: number) => {
  if (form.portMappings.length > 1) {
    form.portMappings.splice(index, 1)
  }
}

const addEnvVariable = () => {
  form.envVariables.push({ key: '', value: '' })
}

const removeEnvVariable = (index: number) => {
  form.envVariables.splice(index, 1)
}

const addVolumeMount = () => {
  form.volumeMounts.push({ hostPath: '', containerPath: '' })
}

const removeVolumeMount = (index: number) => {
  form.volumeMounts.splice(index, 1)
}

const handleSubmit = async () => {
  if (!formRef.value || !props.imageData) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 构建启动参数
    const params: any = {
      imageId: props.imageData.systemSoftImageId,
      containerName: form.containerName || undefined,
      restartPolicy: form.restartPolicy,
      memoryLimit: form.memoryLimit || undefined,
      cpuLimit: form.cpuLimit || undefined,
      networkMode: form.networkMode,
      detached: form.detached,
      autoRemove: form.autoRemove,
      portMappings: form.portMappings
        .filter(p => p.hostPort && p.containerPort)
        .map(p => ({ ...p, hostPort: parseInt(p.hostPort), containerPort: parseInt(p.containerPort) })),
      envVariables: form.envVariables
        .filter(e => e.key && e.value)
        .reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {}),
      volumeMounts: form.volumeMounts
        .filter(v => v.hostPath && v.containerPath)
        .map(v => `${v.hostPath}:${v.containerPath}`)
    }
    
    const response = await containerApi.startContainer(params)
    if (response.code === '00000') {
      // 开始监听启动进度
      if (response.data?.operationId) {
        // ProgressMonitor会自动监听并显示进度
        // 等待一小段时间让Socket事件传播
        setTimeout(() => emit('success'), 1000)
      }
      
      ElMessage.success('容器启动任务已创建，请查看进度')
      emit('success')
      handleClose()
    } else {
      ElMessage.error(response.message || '容器启动失败')
    }
  } catch (error) {
    ElMessage.error('容器启动失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (!loading.value) {
    dialogVisible.value = false
  }
}

const resetForm = () => {
  form.containerName = ''
  form.portMappings = [{ hostPort: '', containerPort: '', protocol: 'tcp' }]
  form.envVariables = []
  form.volumeMounts = []
  form.restartPolicy = 'no'
  form.memoryLimit = ''
  form.cpuLimit = ''
  form.networkMode = 'bridge'
  form.detached = true
  form.autoRemove = false
  formRef.value?.resetFields()
}
</script>

<style scoped>
.form-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #409eff;
}

.port-mappings, .env-variables, .volume-mounts {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 16px;
  background: #fafafa;
}

.port-mapping-item, .env-variable-item, .volume-mount-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.port-separator, .env-separator, .volume-separator {
  font-weight: bold;
  color: #606266;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>