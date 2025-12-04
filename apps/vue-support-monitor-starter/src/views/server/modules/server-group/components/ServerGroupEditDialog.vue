<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增分组' : '编辑分组'"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="group-edit-dialog"
    append-to-body
  >
    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="left"
        class="group-form"
      >
        <el-form-item label="分组名称" prop="monitorSysGenServerGroupName">
          <el-input
            v-model="formData.monitorSysGenServerGroupName"
            placeholder="请输入分组名称"
            clearable
            maxlength="50"
            show-word-limit
          >
            <template #prefix>
              <IconifyIconOnline icon="ri:folder-line" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="分组描述" prop="monitorSysGenServerGroupDesc">
          <el-input
            v-model="formData.monitorSysGenServerGroupDesc"
            type="textarea"
            placeholder="请输入分组描述"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="分组图标" prop="monitorSysGenServerGroupIcon">
              <el-select
                v-model="formData.monitorSysGenServerGroupIcon"
                placeholder="选择图标"
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="icon in iconOptions"
                  :key="icon.value"
                  :label="icon.label"
                  :value="icon.value"
                >
                  <div class="icon-option">
                    <IconifyIconOnline :icon="icon.value" />
                    <span>{{ icon.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分组颜色" prop="monitorSysGenServerGroupColor">
              <el-color-picker
                v-model="formData.monitorSysGenServerGroupColor"
                show-alpha
                :predefine="colorPresets"
              />
              <span class="color-preview" :style="{ backgroundColor: formData.monitorSysGenServerGroupColor }"></span>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="排序号" prop="monitorSysGenServerGroupSort">
              <el-input-number
                v-model="formData.monitorSysGenServerGroupSort"
                :min="0"
                :max="9999"
                :step="1"
                placeholder="排序号"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="monitorSysGenServerGroupStatus">
              <el-switch
                v-model="formData.monitorSysGenServerGroupStatus"
                :active-value="1"
                :inactive-value="0"
                active-text="启用"
                inactive-text="禁用"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="默认分组" prop="monitorSysGenServerGroupIsDefault">
          <el-switch
            v-model="formData.monitorSysGenServerGroupIsDefault"
            :active-value="1"
            :inactive-value="0"
            active-text="是"
            inactive-text="否"
          />
          <div class="form-tip">
            设为默认分组后，新增服务器时会自动选择此分组
          </div>
        </el-form-item>

        <el-form-item label="备注" prop="monitorSysGenServerGroupRemark">
          <el-input
            v-model="formData.monitorSysGenServerGroupRemark"
            type="textarea"
            placeholder="请输入备注信息"
            :rows="2"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>

      <!-- 预览区域 -->
      <div class="preview-section">
        <div class="preview-title">预览效果</div>
        <div class="group-preview">
          <div class="preview-card">
            <IconifyIconOnline
              :icon="formData.monitorSysGenServerGroupIcon || 'ri:folder-line'"
              :style="{ color: formData.monitorSysGenServerGroupColor || '#409eff' }"
              class="preview-icon"
            />
            <div class="preview-info">
              <div class="preview-name">{{ formData.monitorSysGenServerGroupName || '分组名称' }}</div>
              <div class="preview-desc">{{ formData.monitorSysGenServerGroupDesc || '分组描述' }}</div>
            </div>
            <div class="preview-badges">
              <el-tag
                v-if="formData.monitorSysGenServerGroupIsDefault === 1"
                type="primary"
                size="small"
                effect="light"
              >
                默认
              </el-tag>
              <el-tag
                :type="formData.monitorSysGenServerGroupStatus === 1 ? 'success' : 'danger'"
                size="small"
                effect="light"
              >
                {{ formData.monitorSysGenServerGroupStatus === 1 ? '启用' : '禁用' }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ mode === 'add' ? '新增' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue';
import { message } from '@repo/utils';
import {
  type ServerGroup,
  createServerGroup,
  updateServerGroup,
  checkGroupNameExists
} from '@/api/server/group';

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const mode = ref<'add' | 'edit'>('add');
const formRef = ref();

// 表单数据
const formData = reactive({
  monitorSysGenServerGroupId: null as number | null,
  monitorSysGenServerGroupName: '',
  monitorSysGenServerGroupDesc: '',
  monitorSysGenServerGroupIcon: 'ri:folder-line',
  monitorSysGenServerGroupColor: '#409eff',
  monitorSysGenServerGroupStatus: 1,
  monitorSysGenServerGroupIsDefault: 0,
  monitorSysGenServerGroupSort: 0,
  monitorSysGenServerGroupRemark: ''
});

// 图标选项
const iconOptions = [
  { label: '文件夹', value: 'ri:folder-line' },
  { label: '服务器', value: 'ri:server-line' },
  { label: '云服务', value: 'ri:cloud-line' },
  { label: '数据库', value: 'ri:database-line' },
  { label: '网络', value: 'ri:global-line' },
  { label: '安全', value: 'ri:shield-line' },
  { label: '开发', value: 'ri:code-line' },
  { label: '测试', value: 'ri:test-tube-line' },
  { label: '生产', value: 'ri:rocket-line' },
  { label: '监控', value: 'ri:eye-line' },
  { label: '工具', value: 'ri:tools-line' },
  { label: '设置', value: 'ri:settings-line' }
];

// 颜色预设
const colorPresets = [
  '#409eff',
  '#67c23a',
  '#e6a23c',
  '#f56c6c',
  '#909399',
  '#c71585',
  '#ff6347',
  '#32cd32',
  '#1e90ff',
  '#ff1493'
];

// 表单验证规则
const rules = {
  monitorSysGenServerGroupName: [
    { required: true, message: '请输入分组名称', trigger: 'blur' },
    { min: 1, max: 50, message: '分组名称长度在 1 到 50 个字符', trigger: 'blur' },
    {
      validator: async (rule: any, value: string, callback: any) => {
        if (!value) return callback();
        
        try {
          const result = await checkGroupNameExists(value, formData.monitorSysGenServerGroupId || undefined);
          if (result.success && result.data) {
            callback(new Error('分组名称已存在'));
          } else {
            callback();
          }
        } catch (error) {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  monitorSysGenServerGroupDesc: [
    { max: 200, message: '分组描述最多 200 个字符', trigger: 'blur' }
  ],
  monitorSysGenServerGroupRemark: [
    { max: 500, message: '备注最多 500 个字符', trigger: 'blur' }
  ]
};

/**
 * 打开对话框
 */
const open = (editMode: 'add' | 'edit' = 'add', data?: ServerGroup) => {
  mode.value = editMode;
  visible.value = true;
  
  if (editMode === 'edit' && data) {
    setData(data);
  } else {
    resetForm();
  }
};

/**
 * 设置数据
 */
const setData = (data: ServerGroup) => {
  Object.assign(formData, {
    monitorSysGenServerGroupId: data.monitorSysGenServerGroupId,
    monitorSysGenServerGroupName: data.monitorSysGenServerGroupName || '',
    monitorSysGenServerGroupDesc: data.monitorSysGenServerGroupDesc || '',
    monitorSysGenServerGroupIcon: data.monitorSysGenServerGroupIcon || 'ri:folder-line',
    monitorSysGenServerGroupColor: data.monitorSysGenServerGroupColor || '#409eff',
    monitorSysGenServerGroupStatus: data.monitorSysGenServerGroupStatus ?? 1,
    monitorSysGenServerGroupIsDefault: data.monitorSysGenServerGroupIsDefault ?? 0,
    monitorSysGenServerGroupSort: data.monitorSysGenServerGroupSort ?? 0,
    monitorSysGenServerGroupRemark: data.monitorSysGenServerGroupRemark || ''
  });
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerGroupId: null,
    monitorSysGenServerGroupName: '',
    monitorSysGenServerGroupDesc: '',
    monitorSysGenServerGroupIcon: 'ri:folder-line',
    monitorSysGenServerGroupColor: '#409eff',
    monitorSysGenServerGroupStatus: 1,
    monitorSysGenServerGroupIsDefault: 0,
    monitorSysGenServerGroupSort: 0,
    monitorSysGenServerGroupRemark: ''
  });
  
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    // 表单验证
    const isValid = await formRef.value?.validate().catch(() => false);
    if (!isValid) return;
    
    loading.value = true;
    
    const submitData = { ...formData };
    
    let result;
    if (mode.value === 'add') {
      result = await createServerGroup(submitData);
    } else {
      result = await updateServerGroup(submitData);
    }
    
    if (result.success) {
      message.success(`${mode.value === 'add' ? '新增' : '编辑'}分组成功`);
      visible.value = false;
      emit('success');
    } else {
      message.error(result.message || `${mode.value === 'add' ? '新增' : '编辑'}分组失败`);
    }
  } catch (error) {
    console.error('提交分组失败:', error);
    message.error(`${mode.value === 'add' ? '新增' : '编辑'}分组失败`);
  } finally {
    loading.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
  setData
});
</script>

<style lang="scss" scoped>
.group-edit-dialog {
  :deep(.el-dialog__body) {
    padding: 20px;
  }
}

.dialog-content {
  .group-form {
    .icon-option {
      display: flex;
      align-items: center;
      gap: 8px;
      
      .iconify {
        font-size: 16px;
      }
    }
    
    .color-preview {
      display: inline-block;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      margin-left: 8px;
      border: 1px solid var(--el-border-color);
    }
    
    .form-tip {
      font-size: 12px;
      color: var(--el-text-color-secondary);
      margin-top: 4px;
    }
  }
  
  .preview-section {
    margin-top: 24px;
    padding-top: 20px;
    border-top: 1px solid var(--el-border-color-light);
    
    .preview-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin-bottom: 12px;
    }
    
    .group-preview {
      .preview-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        background: var(--el-fill-color-extra-light);
        border-radius: 8px;
        border: 1px solid var(--el-border-color-light);
        
        .preview-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .preview-info {
          flex: 1;
          min-width: 0;
          
          .preview-name {
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin-bottom: 4px;
          }
          
          .preview-desc {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
        
        .preview-badges {
          display: flex;
          gap: 8px;
          flex-shrink: 0;
        }
      }
    }
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
