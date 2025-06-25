<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑组件' : '新建组件'"
    width="80%"
    :close-on-click-modal="false"
    destroy-on-close
    class="component-config-dialog"
    top="5vh"
  >
    <div class="config-container">
      <!-- 左侧配置面板 -->
      <div class="config-panel">
        <el-form
          ref="formRef"
          :model="formData"
          :rules="formRules"
          label-width="120px"
          size="default"
        >
          <!-- 基本信息 -->
          <el-card class="config-section" shadow="never">
            <template #header>
              <div class="section-header">
                <IconifyIconOnline icon="ri:information-line" />
                <span>基本信息</span>
              </div>
            </template>
            
            <el-form-item label="组件名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入组件名称"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="组件标题" prop="title">
              <el-input
                v-model="formData.title"
                placeholder="请输入组件标题"
                clearable
              />
            </el-form-item>
            
            <el-form-item label="组件类型" prop="type">
              <el-select
                v-model="formData.type"
                placeholder="请选择组件类型"
                @change="handleTypeChange"
              >
                <el-option
                  v-for="type in componentTypes"
                  :key="type.value"
                  :label="type.label"
                  :value="type.value"
                >
                  <div class="type-option">
                    <IconifyIconOnline :icon="type.icon" />
                    <span>{{ type.label }}</span>
                  </div>
                </el-option>
              </el-select>
            </el-form-item>
            
            <el-form-item label="描述">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="2"
                placeholder="请输入组件描述"
              />
            </el-form-item>
          </el-card>

          <!-- 数据源配置 -->
          <el-card class="config-section" shadow="never">
            <template #header>
              <div class="section-header">
                <IconifyIconOnline icon="ri:database-line" />
                <span>数据源配置</span>
              </div>
            </template>
            
            <el-form-item label="数据源类型" prop="dataSourceType">
              <el-radio-group v-model="formData.dataSourceType">
                <el-radio label="sql">SQL查询</el-radio>
                <el-radio label="prometheus">Prometheus</el-radio>
                <el-radio label="api">API接口</el-radio>
                <el-radio label="static">静态数据</el-radio>
              </el-radio-group>
            </el-form-item>
            
            <el-form-item label="表达式类型" prop="expressionType">
              <el-select v-model="formData.expressionType">
                <el-option label="SQL" value="sql" />
                <el-option label="Prometheus" value="prometheus" />
                <el-option label="JavaScript" value="javascript" />
                <el-option label="模板" value="template" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="数据表达式" prop="expression">
              <el-input
                v-model="formData.expression"
                type="textarea"
                :rows="4"
                placeholder="请输入数据查询表达式"
              />
              <div class="expression-help">
                <el-button
                  type="text"
                  size="small"
                  @click="showExpressionHelp"
                >
                  <IconifyIconOnline icon="ri:question-line" />
                  表达式帮助
                </el-button>
              </div>
            </el-form-item>
          </el-card>

          <!-- 显示配置 -->
          <el-card class="config-section" shadow="never">
            <template #header>
              <div class="section-header">
                <IconifyIconOnline icon="ri:settings-line" />
                <span>显示配置</span>
              </div>
            </template>
            
            <el-form-item label="刷新间隔">
              <el-input-number
                v-model="formData.refreshInterval"
                :min="5"
                :max="3600"
                :step="5"
                controls-position="right"
              />
              <span class="unit">秒</span>
            </el-form-item>
            
            <el-form-item label="排序顺序">
              <el-input-number
                v-model="formData.sortOrder"
                :min="0"
                :max="999"
                controls-position="right"
              />
            </el-form-item>
            
            <el-form-item label="启用状态">
              <el-switch v-model="formData.enabled" />
            </el-form-item>
          </el-card>

          <!-- 位置配置 -->
          <el-card class="config-section" shadow="never">
            <template #header>
              <div class="section-header">
                <IconifyIconOnline icon="ri:layout-grid-line" />
                <span>位置配置</span>
              </div>
            </template>
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="X坐标">
                  <el-input-number
                    v-model="formData.position.x"
                    :min="0"
                    :max="23"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="Y坐标">
                  <el-input-number
                    v-model="formData.position.y"
                    :min="0"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>
            
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="宽度">
                  <el-input-number
                    v-model="formData.position.w"
                    :min="1"
                    :max="24"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="高度">
                  <el-input-number
                    v-model="formData.position.h"
                    :min="1"
                    controls-position="right"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </el-card>
        </el-form>
      </div>

      <!-- 右侧预览面板 -->
      <div class="preview-panel">
        <el-card class="preview-card" shadow="never">
          <template #header>
            <div class="section-header">
              <IconifyIconOnline icon="ri:eye-line" />
              <span>组件预览</span>
              <el-button
                type="primary"
                size="small"
                @click="refreshPreview"
                :loading="previewLoading"
              >
                刷新预览
              </el-button>
            </div>
          </template>
          
          <div class="preview-container">
            <div v-if="previewLoading" class="preview-loading">
              <el-skeleton :rows="3" animated />
            </div>
            <div v-else-if="previewError" class="preview-error">
              <el-empty description="预览失败">
                <template #image>
                  <IconifyIconOnline icon="ri:error-warning-line" />
                </template>
                <p>{{ previewError }}</p>
              </el-empty>
            </div>
            <div v-else class="preview-content">
              <!-- 这里根据组件类型显示不同的预览 -->
              <component
                :is="getPreviewComponent()"
                :component-data="previewData"
                :config="formData.chartConfig"
                preview-mode
              />
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button @click="handleValidate">验证配置</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEdit ? '更新' : '保存' }}
        </el-button>
      </div>
    </template>

    <!-- 表达式帮助对话框 -->
    <ExpressionHelpDialog
      ref="expressionHelpRef"
      :expression-type="formData.expressionType"
    />
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue';
import { message } from '@repo/utils';
import { ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';
import { useComponentConfig } from '../../composables/useComponentConfig';
import type { ComponentType, DataSourceType, ExpressionType } from '../../types/component';

// 导入组件
// import ExpressionHelpDialog from './ExpressionHelpDialog.vue';
import CardComponent from '../charts/CardComponent.vue';
import GaugeComponent from '../charts/GaugeComponent.vue';
import LineChartComponent from '../charts/LineChartComponent.vue';
import BarChartComponent from '../charts/BarChartComponent.vue';
import PieChartComponent from '../charts/PieChartComponent.vue';
import TableComponent from '../charts/TableComponent.vue';

// Props
const props = defineProps<{
  serverId?: number;
}>();

// Emits
const emit = defineEmits<{
  success: [];
}>();

// 组合式函数
const {
  formData,
  validationResult,
  saveComponent,
  validateComponent,
  resetForm,
  setFormData
} = useComponentConfig();

// 响应式状态
const visible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const previewLoading = ref(false);
const previewError = ref('');
const previewData = ref<any>(null);

// 表单引用
const formRef = ref<FormInstance>();
const expressionHelpRef = ref();

// 组件类型选项
const componentTypes = [
  { value: 'card', label: '卡片', icon: 'ri:file-text-line' },
  { value: 'gauge', label: '仪表盘', icon: 'ri:dashboard-line' },
  { value: 'line', label: '折线图', icon: 'ri:line-chart-line' },
  { value: 'bar', label: '柱状图', icon: 'ri:bar-chart-line' },
  { value: 'pie', label: '饼图', icon: 'ri:pie-chart-line' },
  { value: 'table', label: '表格', icon: 'ri:table-line' },
];

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入组件名称', trigger: 'blur' },
    { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
  ],
  title: [
    { required: true, message: '请输入组件标题', trigger: 'blur' },
    { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择组件类型', trigger: 'change' }
  ],
  expression: [
    { required: true, message: '请输入数据表达式', trigger: 'blur' }
  ]
};

// 组件映射
const componentMap = {
  card: CardComponent,
  gauge: GaugeComponent,
  line: LineChartComponent,
  bar: BarChartComponent,
  pie: PieChartComponent,
  table: TableComponent,
};

/**
 * 获取预览组件
 */
const getPreviewComponent = () => {
  return componentMap[formData.type] || CardComponent;
};

/**
 * 处理组件类型变化
 */
const handleTypeChange = (type: ComponentType) => {
  // 根据组件类型设置默认配置
  switch (type) {
    case 'card':
      formData.chartConfig = {
        card: {
          showIcon: true,
          icon: 'ri:bar-chart-line',
          iconColor: '#409eff',
          valueFormat: '0,0',
          unit: ''
        }
      };
      break;
    case 'gauge':
      formData.chartConfig = {
        gauge: {
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '75%'
        }
      };
      break;
    default:
      formData.chartConfig = {};
  }
  
  refreshPreview();
};

/**
 * 刷新预览
 */
const refreshPreview = async () => {
  if (!formData.expression) {
    previewData.value = null;
    return;
  }

  try {
    previewLoading.value = true;
    previewError.value = '';
    
    // 模拟数据，实际应该根据表达式获取真实数据
    await new Promise(resolve => setTimeout(resolve, 500));
    
    switch (formData.type) {
      case 'card':
        previewData.value = { value: 85.6, trend: 'up', trendValue: 2.3 };
        break;
      case 'gauge':
        previewData.value = { value: 75 };
        break;
      case 'line':
        previewData.value = {
          series: [{
            name: '示例数据',
            data: Array.from({ length: 10 }, (_, i) => ({
              timestamp: Date.now() - (9 - i) * 60000,
              value: Math.random() * 100
            }))
          }]
        };
        break;
      default:
        previewData.value = { value: 'Preview Data' };
    }
  } catch (error) {
    console.error('预览失败:', error);
    previewError.value = '预览数据加载失败';
  } finally {
    previewLoading.value = false;
  }
};

/**
 * 显示表达式帮助
 */
const showExpressionHelp = () => {
  expressionHelpRef.value?.open();
};

/**
 * 验证配置
 */
const handleValidate = async () => {
  try {
    await formRef.value?.validate();
    const result = validateComponent();
    
    if (result.valid) {
      message.success('配置验证通过');
    } else {
      const errorMsg = result.errors.join('\n');
      const warningMsg = result.warnings.join('\n');
      
      let msg = '';
      if (errorMsg) msg += `错误：\n${errorMsg}`;
      if (warningMsg) {
        if (msg) msg += '\n\n';
        msg += `警告：\n${warningMsg}`;
      }
      
      ElMessageBox.alert(msg, '验证结果', {
        type: result.errors.length > 0 ? 'error' : 'warning'
      });
    }
  } catch (error) {
    message.error('表单验证失败');
  }
};

/**
 * 保存配置
 */
const handleSave = async () => {
  if (!props.serverId) {
    message.error('服务器ID不能为空');
    return;
  }

  try {
    await formRef.value?.validate();
    
    saving.value = true;
    const result = await saveComponent(props.serverId, isEdit.value);
    
    if (result) {
      emit('success');
      visible.value = false;
    }
  } catch (error) {
    message.error('表单验证失败');
  } finally {
    saving.value = false;
  }
};

/**
 * 取消操作
 */
const handleCancel = () => {
  visible.value = false;
};

/**
 * 打开对话框
 */
const open = (mode: 'add' | 'edit', data?: any) => {
  isEdit.value = mode === 'edit';
  
  if (mode === 'edit' && data) {
    setFormData(data);
  } else {
    resetForm();
  }
  
  visible.value = true;
  
  nextTick(() => {
    refreshPreview();
  });
};

// 监听表达式变化，自动刷新预览
watch(() => formData.expression, () => {
  if (visible.value) {
    refreshPreview();
  }
}, { debounce: 1000 });

// 暴露方法
defineExpose({
  open
});
</script>

<style scoped lang="scss">
.component-config-dialog {
  :deep(.el-dialog__body) {
    padding: 0;
  }
}

.config-container {
  display: flex;
  height: 70vh;
  gap: 16px;
  padding: 20px;
}

.config-panel {
  flex: 1;
  overflow-y: auto;
  
  .config-section {
    margin-bottom: 16px;
    
    :deep(.el-card__header) {
      padding: 12px 16px;
      background: #f5f7fa;
    }
    
    :deep(.el-card__body) {
      padding: 16px;
    }
  }
}

.preview-panel {
  width: 400px;
  
  .preview-card {
    height: 100%;
    
    :deep(.el-card__body) {
      height: calc(100% - 60px);
      padding: 0;
    }
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  
  .iconify {
    font-size: 16px;
    color: var(--el-color-primary);
  }
  
  .el-button {
    margin-left: auto;
  }
}

.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expression-help {
  margin-top: 8px;
  text-align: right;
}

.unit {
  margin-left: 8px;
  color: var(--el-text-color-regular);
  font-size: 12px;
}

.preview-container {
  height: 100%;
  padding: 16px;
  
  .preview-loading,
  .preview-error,
  .preview-content {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .preview-error {
    flex-direction: column;
    color: var(--el-color-danger);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
