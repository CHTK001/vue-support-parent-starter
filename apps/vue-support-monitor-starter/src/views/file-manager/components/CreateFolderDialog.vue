<template>
  <el-dialog
    v-model="dialogVisible"
    title="新建文件夹"
    width="500px"
    :before-close="handleClose"
    class="create-folder-dialog"
    destroy-on-close
  >
    <div class="dialog-content">
      <!-- 当前路径显示 -->
      <div class="current-path">
        <div class="path-label">
          <IconifyIconOnline icon="ri:folder-line" class="path-icon" />
          <span>创建位置</span>
        </div>
        <div class="path-value">
          <el-input
            :model-value="currentPath"
            readonly
            class="path-input"
          >
            <template #prepend>
              <IconifyIconOnline icon="ri:folder-open-line" />
            </template>
          </el-input>
        </div>
      </div>

      <!-- 文件夹名称输入 -->
      <div class="folder-name-section">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="100px"
          @submit.prevent="handleSubmit"
        >
          <el-form-item label="文件夹名称" prop="folderName">
            <el-input
              v-model="formData.folderName"
              placeholder="请输入文件夹名称"
              clearable
              maxlength="255"
              show-word-limit
              @keyup.enter="handleSubmit"
              class="folder-name-input"
            >
              <template #prepend>
                <IconifyIconOnline icon="ri:folder-add-line" />
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 预览信息 -->
      <div class="preview-section">
        <div class="preview-header">
          <IconifyIconOnline icon="ri:eye-line" class="preview-icon" />
          <span>预览</span>
        </div>
        <div class="preview-content">
          <div class="preview-item">
            <span class="preview-label">完整路径:</span>
            <span class="preview-value">{{ fullPath }}</span>
          </div>
          <div class="preview-item">
            <span class="preview-label">文件夹名称:</span>
            <span class="preview-value">{{ formData.folderName || '(未输入)' }}</span>
          </div>
        </div>
      </div>

      <!-- 高级选项 -->
      <div class="advanced-options">
        <el-collapse v-model="activeCollapse">
          <el-collapse-item title="高级选项" name="advanced">
            <div class="options-content">
              <el-form-item label="权限设置">
                <el-select
                  v-model="formData.permissions"
                  placeholder="选择文件夹权限"
                  class="permissions-select"
                >
                  <el-option
                    label="读写权限 (755)"
                    value="755"
                  >
                    <div class="permission-option">
                      <IconifyIconOnline icon="ri:lock-unlock-line" class="option-icon" />
                      <div class="option-details">
                        <div class="option-title">读写权限 (755)</div>
                        <div class="option-desc">所有者可读写执行，其他用户可读执行</div>
                      </div>
                    </div>
                  </el-option>
                  <el-option
                    label="只读权限 (644)"
                    value="644"
                  >
                    <div class="permission-option">
                      <IconifyIconOnline icon="ri:lock-line" class="option-icon" />
                      <div class="option-details">
                        <div class="option-title">只读权限 (644)</div>
                        <div class="option-desc">所有者可读写，其他用户只读</div>
                      </div>
                    </div>
                  </el-option>
                  <el-option
                    label="完全权限 (777)"
                    value="777"
                  >
                    <div class="permission-option">
                      <IconifyIconOnline icon="ri:lock-unlock-fill" class="option-icon" />
                      <div class="option-details">
                        <div class="option-title">完全权限 (777)</div>
                        <div class="option-desc">所有用户都有读写执行权限</div>
                      </div>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="formData.createParentDirs">
                  <IconifyIconOnline icon="ri:folder-add-line" class="checkbox-icon" />
                  自动创建父级目录
                </el-checkbox>
              </el-form-item>
              
              <el-form-item>
                <el-checkbox v-model="formData.addToFavorites">
                  <IconifyIconOnline icon="ri:star-line" class="checkbox-icon" />
                  添加到收藏夹
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
          :loading="isCreating"
          :disabled="!formData.folderName.trim()"
        >
          <IconifyIconOnline v-if="!isCreating" icon="ri:folder-add-line" class="btn-icon" />
          {{ isCreating ? '创建中...' : '创建文件夹' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

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
  'folder-created': [folderPath: string]
}>()

// 响应式数据
const dialogVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const formRef = ref<FormInstance>()
const isCreating = ref(false)
const activeCollapse = ref<string[]>([])

const formData = reactive({
  folderName: '',
  permissions: '755',
  createParentDirs: false,
  addToFavorites: false
})

// 表单验证规则
const formRules: FormRules = {
  folderName: [
    { required: true, message: '请输入文件夹名称', trigger: 'blur' },
    { min: 1, max: 255, message: '文件夹名称长度在 1 到 255 个字符', trigger: 'blur' },
    {
      pattern: /^[^<>:"/\\|?*]+$/,
      message: '文件夹名称不能包含以下字符: < > : " / \\ | ? *',
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        // 检查是否为保留名称
        const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9']
        if (reservedNames.includes(value.toUpperCase())) {
          callback(new Error('不能使用系统保留名称'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    },
    {
      validator: (rule, value, callback) => {
        // 检查是否以点开头或结尾
        if (value.startsWith('.') || value.endsWith('.')) {
          callback(new Error('文件夹名称不能以点开头或结尾'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

// 计算属性
const fullPath = computed(() => {
  if (!formData.folderName.trim()) {
    return props.currentPath
  }
  
  const cleanPath = props.currentPath.endsWith('/') 
    ? props.currentPath 
    : props.currentPath + '/'
  
  return cleanPath + formData.folderName.trim()
})

// 方法
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    // 验证表单
    await formRef.value.validate()
    
    // 检查文件夹是否已存在
    const folderExists = await checkFolderExists(fullPath.value)
    if (folderExists) {
      const action = await ElMessageBox.confirm(
        `文件夹 "${formData.folderName}" 已存在，是否要覆盖？`,
        '文件夹已存在',
        {
          confirmButtonText: '覆盖',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      if (action !== 'confirm') {
        return
      }
    }
    
    isCreating.value = true
    
    // 调用创建文件夹API
    await createFolder({
      path: fullPath.value,
      permissions: formData.permissions,
      createParentDirs: formData.createParentDirs,
      addToFavorites: formData.addToFavorites
    })
    
    ElMessage.success(`文件夹 "${formData.folderName}" 创建成功`)
    emit('folder-created', fullPath.value)
    handleClose()
    
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.message || '创建文件夹失败')
      console.error('创建文件夹失败:', error)
    }
  } finally {
    isCreating.value = false
  }
}

const checkFolderExists = async (path: string): Promise<boolean> => {
  try {
    // 这里应该调用实际的API检查文件夹是否存在
    // const response = await checkPathExists(path)
    // return response.data.exists
    
    // 模拟检查
    return false
  } catch (error) {
    console.error('检查文件夹是否存在失败:', error)
    return false
  }
}

const createFolder = async (options: {
  path: string
  permissions: string
  createParentDirs: boolean
  addToFavorites: boolean
}) => {
  try {
    // 这里应该调用实际的创建文件夹API
    // const response = await createFolderApi(options)
    // return response.data
    
    // 模拟创建
    await new Promise(resolve => setTimeout(resolve, 1000))
    return { success: true }
  } catch (error) {
    throw new Error('创建文件夹失败')
  }
}

const handleClose = () => {
  dialogVisible.value = false
  resetForm()
}

const resetForm = () => {
  formData.folderName = ''
  formData.permissions = '755'
  formData.createParentDirs = false
  formData.addToFavorites = false
  activeCollapse.value = []
  
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 监听对话框打开
watch(dialogVisible, (visible) => {
  if (visible) {
    nextTick(() => {
      // 聚焦到文件夹名称输入框
      const input = document.querySelector('.folder-name-input input') as HTMLInputElement
      if (input) {
        input.focus()
      }
    })
  }
})
</script>

<style lang="scss" scoped>
.create-folder-dialog {
  .dialog-content {
    .current-path {
      margin-bottom: 24px;
      padding: 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-radius: 12px;
      border: 1px solid var(--el-border-color);

      .path-label {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .path-icon {
          margin-right: 8px;
          color: #3498db;
        }
      }

      .path-value {
        .path-input {
          .el-input-group__prepend {
            background: #e9ecef;
            border-color: #dee2e6;
            color: #6c757d;
          }
        }
      }
    }

    .folder-name-section {
      margin-bottom: 24px;

      .folder-name-input {
        .el-input-group__prepend {
          background: #e3f2fd;
          border-color: #bbdefb;
          color: #1976d2;
        }
      }
    }

    .preview-section {
      margin-bottom: 24px;
      padding: 16px;
      background: var(--el-bg-color-overlay);
      border-radius: 12px;
      border: 1px solid #e9ecef;

      .preview-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .preview-icon {
          margin-right: 8px;
          color: #17a2b8;
        }
      }

      .preview-content {
        .preview-item {
          display: flex;
          margin-bottom: 8px;
          font-size: 14px;

          &:last-child {
            margin-bottom: 0;
          }

          .preview-label {
            min-width: 80px;
            color: #6c757d;
            font-weight: 500;
          }

          .preview-value {
            flex: 1;
            color: var(--el-text-color-primary);
            word-break: break-all;
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          }
        }
      }
    }

    .advanced-options {
      .options-content {
        padding-top: 16px;

        .permissions-select {
          width: 100%;

          .permission-option {
            display: flex;
            align-items: center;
            padding: 8px 0;

            .option-icon {
              margin-right: 12px;
              font-size: 18px;
              color: #6c757d;
            }

            .option-details {
              .option-title {
                font-weight: 500;
                color: var(--el-text-color-primary);
                margin-bottom: 2px;
              }

              .option-desc {
                font-size: 12px;
                color: #6c757d;
              }
            }
          }
        }

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
  background: var(--el-bg-color-overlay);
  border-radius: 8px;
  padding: 12px 16px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

:deep(.el-collapse-item__content) {
  padding: 0;
}

:deep(.el-select-dropdown__item) {
  height: auto;
  padding: 0;
  
  .permission-option {
    padding: 12px 20px;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .create-folder-dialog {
    .dialog-content {
      .preview-section {
        .preview-content {
          .preview-item {
            flex-direction: column;
            gap: 4px;

            .preview-label {
              min-width: auto;
            }
          }
        }
      }

      .advanced-options {
        .options-content {
          .el-form-item {
            margin-bottom: 16px;
          }
        }
      }
    }
  }
}
</style>