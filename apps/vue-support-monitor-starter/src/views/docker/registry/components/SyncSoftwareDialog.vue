<template>
  <el-dialog
    v-model="dialogVisible"
    title="同步软件信息"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="sync-content">
      <!-- 同步配置 -->
      <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
        <div class="form-section">
          <div class="section-title">同步配置</div>
          
          <el-form-item label="镜像仓库" prop="registryIds">
            <el-select
              v-model="form.registryIds"
              placeholder="选择要同步的镜像仓库"
              multiple
              style="width: 100%"
            >
              <el-option
                v-for="registry in registryOptions"
                :key="registry.systemSoftRegistryId"
                :label="registry.systemSoftRegistryName"
                :value="registry.systemSoftRegistryId"
              >
                <div class="registry-option">
                  <span class="registry-name">{{ registry.systemSoftRegistryName }}</span>
                  <span class="registry-type">({{ getRegistryTypeText(registry.systemSoftRegistryType) }})</span>
                </div>
              </el-option>
            </el-select>
            <div class="form-tip">
              选择要同步软件信息的镜像仓库，可以选择多个
            </div>
          </el-form-item>
          
          <el-form-item label="同步类型">
            <el-radio-group v-model="form.syncType">
              <el-radio label="popular">热门软件</el-radio>
              <el-radio label="official">官方镜像</el-radio>
              <el-radio label="custom">自定义搜�?/el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item v-if="form.syncType === 'custom'" label="搜索关键�?>
            <el-input
              v-model="form.searchKeywords"
              placeholder="输入要搜索的软件关键词，多个关键词用逗号分隔"
              type="textarea"
              :rows="3"
            />
            <div class="form-tip">
              例如: nginx,mysql,redis,mongodb
            </div>
          </el-form-item>
          
          <el-form-item label="同步数量限制">
            <el-input-number
              v-model="form.limitCount"
              :min="10"
              :max="500"
              :step="10"
              style="width: 200px"
            />
            <div class="form-tip">
              每个仓库最多同步的软件数量
            </div>
          </el-form-item>
          
          <el-form-item label="版本信息">
            <el-checkbox v-model="form.includeVersions">同步版本标签信息</el-checkbox>
            <div class="form-tip">
              是否同步每个软件的版本标签列表（会增加同步时间）
            </div>
          </el-form-item>
        </div>
        
        <div class="form-section">
          <div class="section-title">高级选项</div>
          
          <el-form-item label="覆盖策略">
            <el-radio-group v-model="form.overwritePolicy">
              <el-radio label="skip">跳过已存�?/el-radio>
              <el-radio label="update">更新已存�?/el-radio>
              <el-radio label="merge">合并信息</el-radio>
            </el-radio-group>
            <div class="form-tip">
              当软件已存在时的处理策略
            </div>
          </el-form-item>
          
          <el-form-item label="并发数量">
            <el-input-number
              v-model="form.concurrency"
              :min="1"
              :max="10"
              style="width: 200px"
            />
            <div class="form-tip">
              同时同步的软件数量，建议不超�?�?
            </div>
          </el-form-item>
          
          <el-form-item label="超时时间">
            <el-input-number
              v-model="form.timeout"
              :min="30"
              :max="300"
              :step="30"
              style="width: 200px"
            />
            <span style="margin-left: 8px;">�?/span>
            <div class="form-tip">
              单个软件信息同步的超时时�?
            </div>
          </el-form-item>
        </div>
      </el-form>
      
      <!-- 预览信息 -->
      <div class="preview-section">
        <div class="section-title">同步预览</div>
        <div class="preview-info">
          <div class="preview-item">
            <span class="preview-label">选择仓库�?/span>
            <span class="preview-value">{{ getSelectedRegistryNames() }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">同步类型�?/span>
            <span class="preview-value">{{ getSyncTypeText() }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">预计数量�?/span>
            <span class="preview-value">{{ getEstimatedCount() }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          开始同�?
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { softwareApi, registryApi } from '@/api/docker'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()
const loading = ref(false)
const registryOptions = ref<any[]>([])

const form = reactive({
  registryIds: [] as number[],
  syncType: 'popular',
  searchKeywords: '',
  limitCount: 50,
  includeVersions: true,
  overwritePolicy: 'merge',
  concurrency: 3,
  timeout: 120
})

const rules: FormRules = {
  registryIds: [
    { required: true, message: '请选择至少一个镜像仓�?, trigger: 'change' }
  ]
}

const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
})

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    loadData()
  }
})

const loadData = async () => {
  try {
    // 加载镜像仓库列表
    const registryResponse = await registryApi.getAllRegistries()
    if (registryResponse.code === '00000') {
      registryOptions.value = registryResponse.data || []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const getRegistryTypeText = (type?: string) => {
  const map = {
    docker_hub: 'Docker Hub',
    aliyun: '阿里�?,
    harbor: 'Harbor',
    custom: '自定�?
  }
  return map[type] || '未知'
}

const getSelectedRegistryNames = () => {
  if (form.registryIds.length === 0) return '未选择'
  const names = form.registryIds.map(id => {
    const registry = registryOptions.value.find((r: any) => r.systemSoftRegistryId === id)
    return registry?.systemSoftRegistryName || '未知'
  })
  return names.join(', ')
}

const getSyncTypeText = () => {
  const map = {
    popular: '热门软件',
    official: '官方镜像',
    custom: '自定义搜�?
  }
  return map[form.syncType] || '未知'
}

const getEstimatedCount = () => {
  const registryCount = form.registryIds.length
  if (registryCount === 0) return '0'
  
  let baseCount = form.limitCount
  if (form.syncType === 'custom' && form.searchKeywords) {
    const keywordCount = form.searchKeywords.split(',').filter(k => k.trim()).length
    baseCount = Math.min(baseCount, keywordCount * 10) // 每个关键词预�?0个结�?
  }
  
  return `�?${registryCount * baseCount} 个软件`
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 构建同步参数
    const params = {
      registryIds: form.registryIds,
      syncType: form.syncType,
      searchKeywords: form.syncType === 'custom' ? form.searchKeywords : undefined,
      limitCount: form.limitCount,
      includeVersions: form.includeVersions,
      overwritePolicy: form.overwritePolicy,
      concurrency: form.concurrency,
      timeout: form.timeout
    }
    
    const response = await softwareApi.syncSoftwareFromRegistry(params)
    if (response.code === '00000') {
      // 开始监听同步进�?
      if (response.data?.operationId) {
        startOperation({
          id: response.data.operationId,
          type: 'sync_software',
          title: '同步软件信息',
          message: '正在同步软件信息...'
        })
        
        // 订阅进度更新
        const unsubscribe = subscribeOperation(response.data.operationId, (operation) => {
          if (operation.status === 'success' || operation.status === 'error') {
            unsubscribe()
            if (operation.status === 'success') {
              emit('success')
            }
          }
        })
      }
      
      ElMessage.success('软件同步任务已启动，请查看进�?)
      emit('success')
      handleClose()
    } else {
      ElMessage.error(response.message || '软件同步失败')
    }
  } catch (error) {
    ElMessage.error('软件同步失败')
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
  form.registryIds = []
  form.syncType = 'popular'
  form.searchKeywords = ''
  form.limitCount = 50
  form.includeVersions = true
  form.overwritePolicy = 'merge'
  form.concurrency = 3
  form.timeout = 120
  formRef.value?.resetFields()
}
</script>

<style scoped>
.sync-content {
  max-height: 600px;
  overflow-y: auto;
}

.form-section, .preview-section {
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

.registry-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.registry-name {
  font-weight: 500;
}

.registry-type {
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