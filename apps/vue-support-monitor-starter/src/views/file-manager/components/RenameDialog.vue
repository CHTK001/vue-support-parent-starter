<template>
  <el-dialog
    v-model="dialogVisible"
    title="重命名"
    width="500px"
    :before-close="handleClose"
    class="rename-dialog"
    destroy-on-close
  >
    <div class="dialog-content">
      <!-- 文件信息展示 -->
      <div class="file-info">
        <div class="file-preview">
          <div class="file-icon">
            <IconifyIconOnline 
              :icon="getFileIcon(fileInfo.type)" 
              class="icon"
              :class="getFileTypeClass(fileInfo.type)"
            />
          </div>
          <div class="file-details">
            <div class="file-name">{{ fileInfo.name }}</div>
            <div class="file-meta">
              <span class="file-type">{{ getFileTypeText(fileInfo.type) }}</span>
              <span class="file-size">{{ formatFileSize(fileInfo.size) }}</span>
              <span class="file-date">{{ formatDate(fileInfo.modifiedTime) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 重命名表单 -->
      <div class="rename-form">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="80px"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="新名称" prop="newName">
            <el-input
              v-model="formData.newName"
              placeholder="请输入新的文件名"
              clearable
              maxlength="255"
              show-word-limit
              @keyup.enter="handleSubmit"
              class="name-input"
            >
              <template #prepend>
                <IconifyIconOnline icon="ri:edit-line" />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 名称分析 -->
      <div class="name-analysis" v-if="formData.newName.trim()">
        <div class="analysis-header">
          <IconifyIconOnline icon="ri:information-line" class="analysis-icon" />
          <span>名称分析</span>
        </div>
        <div class="analysis-content">
          <div class="analysis-item">
            <span class="analysis-label">文件名:</span>
            <span class="analysis-value">{{ nameAnalysis.fileName }}</span>
          </div>
          <div class="analysis-item" v-if="nameAnalysis.extension">
            <span class="analysis-label">扩展名:</span>
            <span class="analysis-value extension">{{ nameAnalysis.extension }}</span>
          </div>
          <div class="analysis-item">
            <span class="analysis-label">文件类型:</span>
            <span class="analysis-value">{{ getFileTypeText(nameAnalysis.detectedType) }}</span>
          </div>
          <div class="analysis-item" v-if="nameAnalysis.isTypeChanged">
            <el-alert
              title="类型变更提醒"
              :description="`文件类型将从 ${getFileTypeText(fileInfo.type)} 变更为 ${getFileTypeText(nameAnalysis.detectedType)}`"
              type="warning"
              show-icon
              :closable="false"
              class="type-change-alert"
            />
          </div>
        </div>
      </div>

      <!-- 冲突检测 -->
      <div class="conflict-detection" v-if="conflictInfo.hasConflict">
        <el-alert
          title="名称冲突"
          :description="conflictInfo.message"
          type="error"
          show-icon
          :closable="false"
          class="conflict-alert"
        >
          <template #default>
            <div class="conflict-details">
              <p>{{ conflictInfo.message }}</p>
              <div class="conflict-options">
                <el-radio-group v-model="formData.conflictAction">
                  <el-radio label="replace">替换现有文件</el-radio>
                  <el-radio label="rename">自动重命名</el-radio>
                  <el-radio label="cancel">取消操作</el-radio>
                </el-radio-group>
              </div>
            </div>
          </template>
        </el-alert>
      </div>

      <!-- 高级选项 -->
      <div class="advanced-options">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item title="高级选项" name="advanced">
            <div class="options-content">
              <el-form-item>
                <el-checkbox v-model="formData.preserveExtension">
                  <IconifyIconOnline icon="ri:file-text-line" class="checkbox-icon" />
                  保持原始扩展名
                </el-checkbox>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="formData.updateReferences">
                  <IconifyIconOnline icon="ri:links-line" class="checkbox-icon" />
                  更新相关引用
                </el-checkbox>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="formData.createBackup">
                  <IconifyIconOnline icon="ri:save-line" class="checkbox-icon" />
                  创建备份
                </el-checkbox>
              </el-form-item>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button
          @click="handleSubmit"
          type="primary"
          :loading="isRenaming"
          :disabled="!formData.newName.trim() || conflictInfo.hasConflict && formData.conflictAction === 'cancel'"
        >
          <IconifyIconOnline v-if="!isRenaming" icon="ri:edit-line" class="btn-icon" />
          {{ isRenaming ? '重命名中...' : '确认重命名' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

// 文件信息接口
interface FileInfo {
  name: string
  type: string
  size: number
  modifiedTime: string
  path: string
}

// Props
interface Props {
  modelValue: boolean
  fileInfo: FileInfo
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  fileInfo: () => ({
    name: '',
    type: 'unknown',
    size: 0,
    modifiedTime: '',
    path: ''
  })
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'file-renamed': [oldName: string, newName: string]
}>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInstance>()
const isRenaming = ref(false)
const activeCollapse = ref<string[]>([])

const formData = reactive({
  newName: '',
  conflictAction: 'cancel',
  preserveExtension: false,
  updateReferences: false,
  createBackup: false
})

// 表单验证规则
const formRules: FormRules = {
  newName: [
    { required: true, message: '请输入新的文件名', trigger: 'blur' },
    { min: 1, max: 255, message: '文件名长度在 1 到 255 个字符', trigger: 'blur' },
    {
      pattern: /^[^<>:"/\\|?*]+$/,
      message: '文件名不能包含以下字符: < > : " / \\ | ? *',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        if (value === props.fileInfo.name) {
          callback(new Error('新文件名不能与原文件名相同'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const nameAnalysis = computed(() => {
  const newName = formData.newName.trim()
  if (!newName) {
    return {
      fileName: '',
      extension: '',
      detectedType: 'unknown',
      isTypeChanged: false
    }
  }

  const lastDotIndex = newName.lastIndexOf('.')
  const fileName = lastDotIndex > 0 ? newName.substring(0, lastDotIndex) : newName
  const extension = lastDotIndex > 0 ? newName.substring(lastDotIndex) : ''
  const detectedType = getFileTypeFromExtension(extension)
  const isTypeChanged = detectedType !== props.fileInfo.type

  return {
    fileName,
    extension,
    detectedType,
    isTypeChanged
  }
})

const conflictInfo = computed(() => {
  // 这里应该检查文件名冲突
  // 模拟冲突检测
  const hasConflict = false // 实际应该调用API检查
  
  return {
    hasConflict,
    message: hasConflict ? `文件 "${formData.newName}" 已存在` : ''
  }
})

// 方法
const getFileIcon = (type: string): string => {
  const iconMap: Record<string, string> = {
    folder: 'ri:folder-fill',
    image: 'ri:image-fill',
    video: 'ri:video-fill',
    audio: 'ri:music-fill',
    document: 'ri:file-text-fill',
    pdf: 'ri:file-pdf-fill',
    archive: 'ri:file-zip-fill',
    code: 'ri:code-fill',
    text: 'ri:file-text-line',
    unknown: 'ri:file-line'
  }
  return iconMap[type] || iconMap.unknown
}

const getFileTypeClass = (type: string): string => {
  const classMap: Record<string, string> = {
    folder: 'folder-icon',
    image: 'image-icon',
    video: 'video-icon',
    audio: 'audio-icon',
    document: 'document-icon',
    pdf: 'pdf-icon',
    archive: 'archive-icon',
    code: 'code-icon',
    text: 'text-icon',
    unknown: 'unknown-icon'
  }
  return classMap[type] || classMap.unknown
}

const getFileTypeText = (type: string): string => {
  const typeMap: Record<string, string> = {
    folder: '文件夹',
    image: '图片文件',
    video: '视频文件',
    audio: '音频文件',
    document: '文档文件',
    pdf: 'PDF文件',
    archive: '压缩文件',
    code: '代码文件',
    text: '文本文件',
    unknown: '未知类型'
  }
  return typeMap[type] || typeMap.unknown
}

const getFileTypeFromExtension = (extension: string): string => {
  if (!extension) return 'unknown'
  
  const ext = extension.toLowerCase()
  const typeMap: Record<string, string> = {
    '.jpg': 'image', '.jpeg': 'image', '.png': 'image', '.gif': 'image', '.bmp': 'image', '.svg': 'image',
    '.mp4': 'video', '.avi': 'video', '.mov': 'video', '.wmv': 'video', '.flv': 'video', '.mkv': 'video',
    '.mp3': 'audio', '.wav': 'audio', '.flac': 'audio', '.aac': 'audio', '.ogg': 'audio',
    '.pdf': 'pdf',
    '.doc': 'document', '.docx': 'document', '.xls': 'document', '.xlsx': 'document', '.ppt': 'document', '.pptx': 'document',
    '.zip': 'archive', '.rar': 'archive', '.7z': 'archive', '.tar': 'archive', '.gz': 'archive',
    '.js': 'code', '.ts': 'code', '.vue': 'code', '.html': 'code', '.css': 'code', '.scss': 'code', '.json': 'code',
    '.txt': 'text', '.md': 'text', '.log': 'text'
  }
  
  return typeMap[ext] || 'unknown'
}

const formatFileSize = (size: number): string => {
  if (size === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(size) / Math.log(k))
  
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + units[i]
}

const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    // 验证表单
    await formRef.value.validate()
    
    // 处理冲突
    if (conflictInfo.value.hasConflict && formData.conflictAction === 'cancel') {
      ElMessage.warning('请选择冲突处理方式')
      return
    }
    
    isRenaming.value = true
    
    // 调用重命名API
    await renameFile({
      oldPath: props.fileInfo.path,
      newName: formData.newName.trim(),
      conflictAction: formData.conflictAction,
      preserveExtension: formData.preserveExtension,
      updateReferences: formData.updateReferences,
      createBackup: formData.createBackup
    })
    
    ElMessage.success(`文件重命名成功`)
    emit('file-renamed', props.fileInfo.name, formData.newName.trim())
    handleClose()
    
  } catch (error: any) {
    ElMessage.error(error.message || '重命名失败')
    console.error('重命名失败:', error)
  } finally {
    isRenaming.value = false
  }
}

const renameFile = async (options: {
  oldPath: string
  newName: string
  conflictAction: string
  preserveExtension: boolean
  updateReferences: boolean
  createBackup: boolean
}) => {
  try {
    // 这里应该调用实际的重命名API
    // const response = await renameFileApi(options)
    // return response.data
    
    // 模拟重命名
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  } catch (error) {
    throw new Error('重命名失败')
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  formData.newName = ''
  formData.conflictAction = 'cancel'
  formData.preserveExtension = false
  formData.updateReferences = false
  formData.createBackup = false
  activeCollapse.value = []
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible && props.fileInfo.name) {
    // 初始化新名称为原文件名
    formData.newName = props.fileInfo.name
    
    nextTick(() => {
      // 聚焦到输入框并选中文件名部分（不包括扩展名）
      const input = document.querySelector('.name-input input') as HTMLInputElement
      if (input) {
        input.focus()
        
        const lastDotIndex = props.fileInfo.name.lastIndexOf('.')
        if (lastDotIndex > 0) {
          input.setSelectionRange(0, lastDotIndex)
        } else {
          input.select()
        }
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.rename-dialog {
  .dialog-content {
    .file-info {
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 1px solid #dee2e6;

      .file-preview {
        display: flex;
        align-items: center;
        gap: 16px;

        .file-icon {
          .icon {
            font-size: 48px;
            
            &.folder-icon { color: #ffc107; }
            &.image-icon { color: #28a745; }
            &.video-icon { color: #dc3545; }
            &.audio-icon { color: #6f42c1; }
            &.document-icon { color: #007bff; }
            &.pdf-icon { color: #dc3545; }
            &.archive-icon { color: #fd7e14; }
            &.code-icon { color: #20c997; }
            &.text-icon { color: #6c757d; }
            &.unknown-icon { color: #adb5bd; }
          }
        }

        .file-details {
          flex: 1;

          .file-name {
            font-size: 16px;
            font-weight: 600;
            color: #495057;
            margin-bottom: 8px;
            word-break: break-all;
          }

          .file-meta {
            display: flex;
            gap: 16px;
            font-size: 14px;
            color: #6c757d;

            .file-type {
              padding: 2px 8px;
              background: #e9ecef;
              border-radius: 4px;
              font-size: 12px;
            }
          }
        }
      }
    }

    .rename-form {
      margin-bottom: 24px;

      .name-input {
        .el-input-group__prepend {
          background: #e3f2fd;
          border-color: #bbdefb;
          color: #1976d2;
        }
      }
    }

    .name-analysis {
      margin-bottom: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      border: 1px solid #e9ecef;

      .analysis-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 600;
        color: #495057;

        .analysis-icon {
          margin-right: 8px;
          color: #17a2b8;
        }
      }

      .analysis-content {
        .analysis-item {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;

          &:last-child {
            margin-bottom: 0;
          }

          .analysis-label {
            min-width: 80px;
            color: #6c757d;
            font-weight: 500;
          }

          .analysis-value {
            flex: 1;
            color: #495057;

            &.extension {
              font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
              background: #e9ecef;
              padding: 2px 6px;
              border-radius: 4px;
              display: inline-block;
            }
          }
        }

        .type-change-alert {
          margin-top: 12px;
        }
      }
    }

    .conflict-detection {
      margin-bottom: 24px;

      .conflict-alert {
        .conflict-details {
          .conflict-options {
            margin-top: 12px;

            .el-radio-group {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
          }
        }
      }
    }

    .advanced-options {
      .options-content {
        padding-top: 16px;

        .el-checkbox {
          margin-bottom: 12px;

          .checkbox-icon {
            margin-right: 6px;
          }
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;

    .btn-icon {
      margin-right: 6px;
    }
  }
}

// 深度选择器修改Element Plus样式
:deep(.el-collapse-item__header) {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 500;
  color: #495057;
}

:deep(.el-collapse-item__content) {
  padding: 0;
}

// 响应式设计
@media (max-width: 768px) {
  .rename-dialog {
    .dialog-content {
      .file-info {
        .file-preview {
          flex-direction: column;
          text-align: center;
          gap: 12px;

          .file-details {
            .file-meta {
              flex-direction: column;
              gap: 8px;
              align-items: center;
            }
          }
        }
      }

      .name-analysis {
        .analysis-content {
          .analysis-item {
            flex-direction: column;
            gap: 4px;

            .analysis-label {
              min-width: auto;
            }
          }
        }
      }

      .conflict-detection {
        .conflict-alert {
          .conflict-details {
            .conflict-options {
              .el-radio-group {
                gap: 12px;
              }
            }
          }
        }
      }
    }
  }
}
</style>