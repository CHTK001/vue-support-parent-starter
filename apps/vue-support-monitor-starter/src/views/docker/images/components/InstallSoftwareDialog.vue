<template>
  <el-dialog
    v-model="dialogVisible"
    title="安装软件"
    width="700px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="install-content">
      <!-- 软件信息 -->
      <div class="software-section">
        <div class="section-title">软件信息</div>
        <div class="software-info-card">
          <div class="software-icon">
            <img v-if="softwareData?.systemSoftIcon" :src="softwareData.systemSoftIcon" alt="icon" />
            <IconifyIconOnline v-else icon="ri:apps-line" class="default-icon" />
          </div>
          <div class="software-details">
            <div class="software-name">{{ softwareData?.systemSoftName }}</div>
            <div class="software-desc">{{ softwareData?.systemSoftDesc || '暂无描述' }}</div>
            <div class="software-tags">
              <el-tag
                v-for="tag in (softwareData?.systemSoftTags || '').split(',').filter(Boolean)"
                :key="tag"
                size="small"
                class="tag-item"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 安装配置 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <div class="form-section">
          <div class="section-title">安装配置</div>
          
          <el-form-item label="软件版本" prop="version">
            <el-select
              v-model="form.version"
              placeholder="选择要安装的版本"
              style="width: 100%"
              :loading="versionsLoading"
              @change="handleVersionChange"
            >
              <el-option
                v-for="version in availableVersions"
                :key="version.tag"
                :label="`${version.tag} (${version.size || 'unknown size'})`"
                :value="version.tag"
              >
                <div class="version-option">
                  <span class="version-tag">{{ version.tag }}</span>
                  <span class="version-info">
                    {{ version.created ? new Date(version.created).toLocaleDateString() : '' }}
                    {{ version.size ? ` - ${version.size}` : '' }}
                  </span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="目标服务�? prop="serverId">
            <el-select
              v-model="form.serverId"
              placeholder="选择安装目标服务�?
              style="width: 100%"
            >
              <el-option
                v-for="server in serverOptions"
                :key="server.id"
                :label="server.name"
                :value="server.id"
              >
                <div class="server-option">
                  <span class="server-name">{{ server.name }}</span>
                  <span class="server-info">({{ server.ip }})</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
          
          <el-form-item label="镜像仓库" prop="registryId">
            <el-select
              v-model="form.registryId"
              placeholder="选择镜像仓库（可选）"
              clearable
              style="width: 100%"
            >
              <el-option
                v-for="registry in registryOptions"
                :key="registry.id"
                :label="registry.name"
                :value="registry.id"
              />
            </el-select>
            <div class="form-tip">
              如果不选择，将使用默认的Docker Hub
            </div>
          </el-form-item>
          
          <el-form-item label="自定义镜像名">
            <el-input
              v-model="form.customImageName"
              placeholder="自定义完整镜像名称（可选）"
              clearable
            />
            <div class="form-tip">
              例如: registry.cn-hangzhou.aliyuncs.com/namespace/image:tag
            </div>
          </el-form-item>
          
          <el-form-item label="安装说明">
            <el-input
              v-model="form.installNote"
              type="textarea"
              :rows="3"
              placeholder="安装备注说明（可选）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </div>
        
        <div class="form-section">
          <div class="section-title">高级选项</div>
          
          <el-form-item label="自动启动">
            <el-switch v-model="form.autoStart" />
            <div class="form-tip">安装完成后自动启动容�?/div>
          </el-form-item>
          
          <el-form-item label="强制拉取">
            <el-switch v-model="form.forcePull" />
            <div class="form-tip">即使本地已存在镜像也重新拉取</div>
          </el-form-item>
          
          <el-form-item label="保留镜像">
            <el-switch v-model="form.keepImage" />
            <div class="form-tip">容器删除后保留镜像文�?/div>
          </el-form-item>
        </div>
      </el-form>
      
      <!-- 预览信息 -->
      <div v-if="form.version && form.serverId" class="preview-section">
        <div class="section-title">安装预览</div>
        <div class="preview-info">
          <div class="preview-item">
            <span class="preview-label">镜像名称�?/span>
            <span class="preview-value">{{ getFullImageName() }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">目标服务器：</span>
            <span class="preview-value">{{ getServerName() }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">安装方式�?/span>
            <span class="preview-value">Docker镜像安装</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          开始安�?
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { 
  softwareApi, 
  getServerList, 
  registryApi, 
  type SystemSoft 
} from '@/api/docker'

interface Props {
  visible: boolean
  softwareData?: SystemSoft | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

interface VersionInfo {
  tag: string
  size?: string
  created?: string
  architecture?: string
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const versionsLoading = ref(false)
const serverOptions = ref<any[]>([])
const registryOptions = ref<any[]>([])
const availableVersions = ref<VersionInfo[]>([])

const form = reactive({
  version: '',
  serverId: '',
  registryId: '',
  customImageName: '',
  installNote: '',
  autoStart: true,
  forcePull: false,
  keepImage: true
})

const rules: FormRules = {
  version: [
    { required: true, message: '请选择软件版本', trigger: 'change' }
  ],
  serverId: [
    { required: true, message: '请选择目标服务�?, trigger: 'change' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible && props.softwareData) {
    loadData()
    loadVersions()
  }
})

const loadData = async () => {
  try {
    // 加载服务器列�?
    const serverResponse = await getServerList()
    if (serverResponse.code === '00000') {
      serverOptions.value = serverResponse.data || []
    }
    
    // 加载镜像仓库列表
    const registryResponse = await registryApi.getRegistryList()
    if (registryResponse.code === '00000') {
      registryOptions.value = registryResponse.data || []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const loadVersions = async () => {
  if (!props.softwareData) return
  
  try {
    versionsLoading.value = true
    // 这里调用API获取软件的可用版本列�?
    const response = await softwareApi.getSoftwareVersions(props.softwareData.systemSoftId!)
    if (response.code === '00000') {
      availableVersions.value = response.data || []
    }
  } catch (error) {
    console.error('加载版本列表失败:', error)
    // 如果API不存在，提供默认版本
    availableVersions.value = [
      { tag: 'latest', size: 'unknown', created: new Date().toISOString() }
    ]
  } finally {
    versionsLoading.value = false
  }
}

const handleVersionChange = () => {
  // 版本变化时的处理逻辑
}

const getFullImageName = () => {
  if (form.customImageName) {
    return form.customImageName
  }
  
  if (!props.softwareData || !form.version) return ''
  
  const imageName = props.softwareData.systemSoftName
  return `${imageName}:${form.version}`
}

const getServerName = () => {
  const server = serverOptions.value.find(s => s.id === form.serverId)
  return server ? `${server.name} (${server.ip})` : ''
}

const handleSubmit = async () => {
  if (!formRef.value || !props.softwareData) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 构建安装参数
    const params = {
      softwareId: props.softwareData.systemSoftId,
      version: form.version,
      serverId: form.serverId,
      registryId: form.registryId || undefined,
      customImageName: form.customImageName || undefined,
      installNote: form.installNote || undefined,
      autoStart: form.autoStart,
      forcePull: form.forcePull,
      keepImage: form.keepImage
    }
    
    const response = await softwareApi.installSoftware(params)
    if (response.code === '00000') {
      // ProgressMonitor会自动监听并显示进度
      // operationId: response.data?.operationId
      if (response.data?.operationId) {
        // 等待一小段时间让Socket事件传播
        setTimeout(() => emit('success'), 1000)
      }
      
      ElMessage.success('软件安装任务已创建，请查看进�?)
      emit('success')
      handleClose()
    } else {
      ElMessage.error(response.message || '软件安装失败')
    }
  } catch (error) {
    ElMessage.error('软件安装失败')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  if (!loading.value) {
    dialogVisible.value = false
    resetForm()
  }
}

const resetForm = () => {
  form.version = ''
  form.serverId = ''
  form.registryId = ''
  form.customImageName = ''
  form.installNote = ''
  form.autoStart = true
  form.forcePull = false
  form.keepImage = true
  availableVersions.value = []
  formRef.value?.resetFields()
}
</script>

<style scoped>
.install-content {
  max-height: 600px;
  overflow-y: auto;
}

.form-section, .software-section, .preview-section {
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

.software-info-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.software-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border: 1px solid #e4e7ed;
}

.software-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.default-icon {
  font-size: 24px;
  color: #909399;
}

.software-details {
  flex: 1;
}

.software-name {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.software-desc {
  color: #606266;
  margin-bottom: 12px;
  line-height: 1.5;
}

.software-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-item {
  margin: 0;
}

.version-option, .server-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.version-tag, .server-name {
  font-weight: 500;
}

.version-info, .server-info {
  font-size: 12px;
  color: #909399;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

.preview-info {
  background: #f0f9ff;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  padding: 16px;
}

.preview-item {
  display: flex;
  margin-bottom: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  width: 100px;
  color: #374151;
  font-weight: 500;
}

.preview-value {
  color: #1f2937;
  flex: 1;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>