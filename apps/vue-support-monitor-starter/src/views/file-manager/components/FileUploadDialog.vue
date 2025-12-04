<template>
  <el-dialog
    v-model="dialogVisible"
    title="上传文件"
    width="600px"
    :before-close="handleClose"
    class="file-upload-dialog"
    destroy-on-close
  >
    <div class="upload-container">
      <!-- 上传区域 -->
      <div class="upload-area">
        <el-upload
          ref="uploadRef"
          :action="uploadUrl"
          :headers="uploadHeaders"
          :data="uploadData"
          :multiple="true"
          :drag="true"
          :auto-upload="false"
          :on-change="handleFileChange"
          :on-remove="handleFileRemove"
          :before-upload="beforeUpload"
          :on-progress="handleUploadProgress"
          :on-success="handleUploadSuccess"
          :on-error="handleUploadError"
          class="upload-component"
        >
          <div class="upload-dragger">
            <IconifyIconOnline icon="ri:upload-cloud-line" class="upload-icon" />
            <div class="upload-text">
              <p class="upload-hint">将文件拖拽到此处，或<em>点击上传</em></p>
              <p class="upload-desc">支持多文件上传，单个文件大小不超�?{{ maxSizeText }}</p>
            </div>
          </div>
        </el-upload>
      </div>

      <!-- 文件列表 -->
      <div v-if="fileList.length > 0" class="file-list">
        <div class="list-header">
          <h4 class="list-title">
            <IconifyIconOnline icon="ri:file-list-line" class="title-icon" />
            待上传文�?({{ fileList.length }})
          </h4>
          <div class="list-actions">
            <el-button @click="clearAllFiles" size="small" type="danger" plain>
              <IconifyIconOnline icon="ri:delete-bin-line" />
              清空
            </el-button>
          </div>
        </div>
        
        <div class="file-items">
          <div
            v-for="(file, index) in fileList"
            :key="file.uid"
            class="file-item"
            :class="{
              'upload-success': file.status === 'success',
              'upload-error': file.status === 'error',
              'uploading': file.status === 'uploading'
            }"
          >
            <div class="file-info">
              <div class="file-icon-name">
                <IconifyIconOnline
                  :icon="getFileIcon(file)"
                  class="file-icon"
                  :class="getFileIconClass(file)"
                />
                <div class="file-details">
                  <div class="file-name" :title="file.name">{{ file.name }}</div>
                  <div class="file-meta">
                    <span class="file-size">{{ formatFileSize(file.size || 0) }}</span>
                    <span class="file-status" :class="`status-${file.status}`">
                      {{ getStatusText(file.status) }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="file-actions">
                <el-button
                  v-if="file.status !== 'uploading'"
                  @click="removeFile(index)"
                  size="small"
                  type="danger"
                  circle
                  class="remove-btn"
                >
                  <IconifyIconOnline icon="ri:close-line" />
                </el-button>
              </div>
            </div>
            
            <!-- 上传进度 -->
            <div v-if="file.status === 'uploading'" class="upload-progress">
              <el-progress
                :percentage="file.percentage || 0"
                :status="file.percentage === 100 ? 'success' : undefined"
                :stroke-width="6"
                class="progress-bar"
              />
              <span class="progress-text">{{ file.percentage || 0 }}%</span>
            </div>
            
            <!-- 错误信息 -->
            <div v-if="file.status === 'error'" class="error-message">
              <IconifyIconOnline icon="ri:error-warning-line" class="error-icon" />
              <span class="error-text">{{ file.response?.message || '上传失败' }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 上传配置 -->
      <div class="upload-config">
        <el-form :model="uploadConfig" label-width="100px" size="small">
          <el-form-item label="上传路径">
            <el-input
              v-model="uploadConfig.targetPath"
              placeholder="文件将上传到此路�?
              readonly
              class="path-input"
            >
              <template #prepend>
                <IconifyIconOnline icon="ri:folder-line" />
              </template>
            </el-input>
          </el-form-item>
          
          <el-form-item label="覆盖策略">
            <el-radio-group v-model="uploadConfig.overwriteStrategy">
              <el-radio value="skip">
                <IconifyIconOnline icon="ri:skip-forward-line" class="radio-icon" />
                跳过重复文件
              </el-radio>
              <el-radio value="overwrite">
                <IconifyIconOnline icon="ri:refresh-line" class="radio-icon" />
                覆盖重复文件
              </el-radio>
              <el-radio value="rename">
                <IconifyIconOnline icon="ri:edit-line" class="radio-icon" />
                自动重命�?
              </el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="footer-left">
          <span v-if="uploadStats.total > 0" class="upload-stats">
            成功: {{ uploadStats.success }} / 失败: {{ uploadStats.error }} / 总计: {{ uploadStats.total }}
          </span>
        </div>
        <div class="footer-right">
          <el-button @click="handleClose">取消</el-button>
          <el-button
            @click="startUpload"
            type="primary"
            :disabled="fileList.length === 0 || isUploading"
            :loading="isUploading"
          >
            <IconifyIconOnline v-if="!isUploading" icon="ri:upload-line" class="btn-icon" />
            {{ isUploading ? '上传�?..' : '开始上�? }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { UploadFile, UploadFiles, UploadInstance } from 'element-plus'
import { formatBytes } from '@pureadmin/utils'

// Props
interface Props {
  modelValue: boolean
  currentPath: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  currentPath: '/'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'upload-success': []
}>()

// 响应式数�?
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const uploadRef = ref<UploadInstance>()
const fileList = ref<UploadFile[]>([])
const isUploading = ref(false)

const uploadConfig = reactive({
  targetPath: props.currentPath,
  overwriteStrategy: 'skip' as 'skip' | 'overwrite' | 'rename'
})

const uploadStats = reactive({
  total: 0,
  success: 0,
  error: 0
})

// 配置
const maxSize = 100 * 1024 * 1024 // 100MB
const maxSizeText = '100MB'
const allowedTypes = [
  // 图片
  'image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/svg+xml', 'image/webp',
  // 文档
  'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // 文本
  'text/plain', 'text/markdown', 'text/csv', 'application/json', 'text/xml',
  // 压缩文件
  'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed',
  // 音视�?
  'audio/mpeg', 'audio/wav', 'audio/flac', 'video/mp4', 'video/avi', 'video/quicktime'
]

// 计算属�?
const uploadUrl = computed(() => {
  return '/api/files/upload'
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
    'X-Requested-With': 'XMLHttpRequest'
  }
})

const uploadData = computed(() => {
  return {
    targetPath: uploadConfig.targetPath,
    overwriteStrategy: uploadConfig.overwriteStrategy
  }
})

// 方法
const getFileIcon = (file: UploadFile) => {
  const name = file.name || ''
  const ext = name.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'ri:image-line'
    case 'pdf':
      return 'ri:file-pdf-line'
    case 'doc':
    case 'docx':
      return 'ri:file-word-line'
    case 'xls':
    case 'xlsx':
      return 'ri:file-excel-line'
    case 'ppt':
    case 'pptx':
      return 'ri:file-ppt-line'
    case 'txt':
    case 'md':
      return 'ri:file-text-line'
    case 'zip':
    case 'rar':
    case '7z':
      return 'ri:file-zip-line'
    case 'mp3':
    case 'wav':
    case 'flac':
      return 'ri:file-music-line'
    case 'mp4':
    case 'avi':
    case 'mov':
      return 'ri:file-video-line'
    default:
      return 'ri:file-line'
  }
}

const getFileIconClass = (file: UploadFile) => {
  const name = file.name || ''
  const ext = name.split('.').pop()?.toLowerCase()
  
  switch (ext) {
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
      return 'image-icon'
    case 'pdf':
      return 'pdf-icon'
    case 'doc':
    case 'docx':
      return 'word-icon'
    case 'xls':
    case 'xlsx':
      return 'excel-icon'
    case 'ppt':
    case 'pptx':
      return 'ppt-icon'
    default:
      return 'file-icon'
  }
}

const getStatusText = (status?: string) => {
  switch (status) {
    case 'ready':
      return '准备上传'
    case 'uploading':
      return '上传�?
    case 'success':
      return '上传成功'
    case 'error':
      return '上传失败'
    default:
      return '未知状�?
  }
}

const formatFileSize = (size: number) => {
  return formatBytes(size)
}

const handleFileChange = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files
  updateUploadStats()
}

const handleFileRemove = (file: UploadFile, files: UploadFiles) => {
  fileList.value = files
  updateUploadStats()
}

const beforeUpload = (file: File) => {
  // 检查文件大�?
  if (file.size > maxSize) {
    ElMessage.error(`文件 ${file.name} 大小超过 ${maxSizeText} 限制`)
    return false
  }
  
  // 检查文件类型（可选）
  // if (!allowedTypes.includes(file.type)) {
  //   ElMessage.error(`不支持的文件类型: ${file.type}`)
  //   return false
  // }
  
  return true
}

const handleUploadProgress = (event: any, file: UploadFile) => {
  // 更新进度
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value[index].percentage = Math.round(event.percent)
  }
}

const handleUploadSuccess = (response: any, file: UploadFile) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value[index].status = 'success'
    fileList.value[index].response = response
  }
  updateUploadStats()
  
  // 检查是否所有文件都上传完成
  const uploadingFiles = fileList.value.filter(f => f.status === 'uploading')
  if (uploadingFiles.length === 0) {
    isUploading.value = false
    const successCount = fileList.value.filter(f => f.status === 'success').length
    const errorCount = fileList.value.filter(f => f.status === 'error').length
    
    if (errorCount === 0) {
      ElMessage.success(`所有文件上传成�?(${successCount}�?`)
      emit('upload-success')
    } else {
      ElMessage.warning(`上传完成: 成功 ${successCount}�? 失败 ${errorCount}个`)
    }
  }
}

const handleUploadError = (error: any, file: UploadFile) => {
  const index = fileList.value.findIndex(f => f.uid === file.uid)
  if (index > -1) {
    fileList.value[index].status = 'error'
    fileList.value[index].response = error
  }
  updateUploadStats()
  
  ElMessage.error(`文件 ${file.name} 上传失败`)
}

const removeFile = (index: number) => {
  fileList.value.splice(index, 1)
  updateUploadStats()
}

const clearAllFiles = async () => {
  if (isUploading.value) {
    ElMessage.warning('上传进行中，无法清空文件列表')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      '确定要清空所有文件吗�?,
      '确认清空',
      {
        confirmButtonText: '清空',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    fileList.value = []
    uploadRef.value?.clearFiles()
    updateUploadStats()
  } catch (error) {
    // 用户取消
  }
}

const startUpload = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }
  
  isUploading.value = true
  
  // 重置所有文件状�?
  fileList.value.forEach(file => {
    if (file.status !== 'success') {
      file.status = 'ready'
      file.percentage = 0
    }
  })
  
  updateUploadStats()
  
  // 开始上�?
  uploadRef.value?.submit()
}

const updateUploadStats = () => {
  uploadStats.total = fileList.value.length
  uploadStats.success = fileList.value.filter(f => f.status === 'success').length
  uploadStats.error = fileList.value.filter(f => f.status === 'error').length
}

const handleClose = () => {
  if (isUploading.value) {
    ElMessageBox.confirm(
      '上传正在进行中，确定要关闭吗�?,
      '确认关闭',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      dialogVisible.value = false
      resetDialog()
    }).catch(() => {
      // 用户取消
    })
  } else {
    dialogVisible.value = false
    resetDialog()
  }
}

const resetDialog = () => {
  fileList.value = []
  isUploading.value = false
  uploadRef.value?.clearFiles()
  uploadStats.total = 0
  uploadStats.success = 0
  uploadStats.error = 0
}

// 监听路径变化
watch(
  () => props.currentPath,
  (newPath) => {
    uploadConfig.targetPath = newPath
  }
)
</script>

<style lang="scss" scoped>
.file-upload-dialog {
  .upload-container {
    .upload-area {
      margin-bottom: 24px;

      .upload-component {
        .upload-dragger {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border: 2px dashed #dee2e6;
          border-radius: 12px;
          transition: all 0.3s ease;

          &:hover {
            border-color: #3498db;
            background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          }

          .upload-icon {
            font-size: 48px;
            color: #3498db;
            margin-bottom: 16px;
          }

          .upload-text {
            text-align: center;

            .upload-hint {
              margin: 0 0 8px 0;
              font-size: 16px;
              color: var(--el-text-color-primary);

              em {
                color: #3498db;
                font-style: normal;
                font-weight: 600;
              }
            }

            .upload-desc {
              margin: 0;
              font-size: 14px;
              color: #6c757d;
            }
          }
        }
      }
    }

    .file-list {
      margin-bottom: 24px;
      border: 1px solid #e9ecef;
      border-radius: 12px;
      overflow: hidden;

      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 20px;
        background: var(--el-bg-color-overlay);
        border-bottom: 1px solid #e9ecef;

        .list-title {
          display: flex;
          align-items: center;
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);

          .title-icon {
            margin-right: 8px;
            color: #3498db;
          }
        }
      }

      .file-items {
        max-height: 300px;
        overflow-y: auto;

        .file-item {
          padding: 16px 20px;
          border-bottom: 1px solid #f1f3f4;
          transition: all 0.3s ease;

          &:last-child {
            border-bottom: none;
          }

          &.upload-success {
            background: #f8fff8;
            border-left: 4px solid #27ae60;
          }

          &.upload-error {
            background: #fff8f8;
            border-left: 4px solid #e74c3c;
          }

          &.uploading {
            background: #f8f9ff;
            border-left: 4px solid #3498db;
          }

          .file-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;

            .file-icon-name {
              display: flex;
              align-items: center;
              flex: 1;
              min-width: 0;

              .file-icon {
                margin-right: 12px;
                font-size: 24px;

                &.image-icon {
                  color: #e74c3c;
                }

                &.pdf-icon {
                  color: #e74c3c;
                }

                &.word-icon {
                  color: #3498db;
                }

                &.excel-icon {
                  color: #27ae60;
                }

                &.ppt-icon {
                  color: #e67e22;
                }

                &.file-icon {
                  color: #95a5a6;
                }
              }

              .file-details {
                flex: 1;
                min-width: 0;

                .file-name {
                  font-weight: 500;
                  color: #2c3e50;
                  margin-bottom: 4px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                .file-meta {
                  display: flex;
                  gap: 12px;
                  font-size: 12px;

                  .file-size {
                    color: #7f8c8d;
                  }

                  .file-status {
                    font-weight: 500;

                    &.status-ready {
                      color: #f39c12;
                    }

                    &.status-uploading {
                      color: #3498db;
                    }

                    &.status-success {
                      color: #27ae60;
                    }

                    &.status-error {
                      color: #e74c3c;
                    }
                  }
                }
              }
            }

            .file-actions {
              .remove-btn {
                width: 28px;
                height: 28px;
                padding: 0;
              }
            }
          }

          .upload-progress {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 8px;

            .progress-bar {
              flex: 1;
            }

            .progress-text {
              font-size: 12px;
              color: #7f8c8d;
              min-width: 40px;
              text-align: right;
            }
          }

          .error-message {
            display: flex;
            align-items: center;
            gap: 8px;
            color: #e74c3c;
            font-size: 12px;

            .error-icon {
              font-size: 14px;
            }
          }
        }
      }
    }

    .upload-config {
      background: var(--el-bg-color-overlay);
      border-radius: 12px;
      padding: 20px;

      .path-input {
        .el-input-group__prepend {
          background: #e9ecef;
          border-color: #dee2e6;
        }
      }

      .el-radio {
        margin-right: 20px;
        margin-bottom: 8px;

        .radio-icon {
          margin-right: 4px;
        }
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .footer-left {
      .upload-stats {
        font-size: 14px;
        color: #7f8c8d;
      }
    }

    .footer-right {
      display: flex;
      gap: 12px;

      .btn-icon {
        margin-right: 6px;
      }
    }
  }
}

// 响应式设�?
@media (max-width: 768px) {
  .file-upload-dialog {
    .upload-container {
      .file-list {
        .file-items {
          .file-item {
            .file-info {
              flex-direction: column;
              align-items: flex-start;
              gap: 12px;

              .file-icon-name {
                width: 100%;
              }

              .file-actions {
                align-self: flex-end;
              }
            }
          }
        }
      }

      .upload-config {
        .el-radio {
          display: block;
          margin-bottom: 12px;
        }
      }
    }

    .dialog-footer {
      flex-direction: column;
      gap: 12px;

      .footer-left,
      .footer-right {
        width: 100%;
        justify-content: center;
      }
    }
  }
}
</style>