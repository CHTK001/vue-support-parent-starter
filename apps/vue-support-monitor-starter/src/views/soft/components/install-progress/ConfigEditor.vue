<template>
  <div class="config-editor">
    <el-dialog
      v-model="visible"
      :title="title"
      width="60%"
      destroy-on-close
      @close="handleClose"
    >
      <div class="config-editor-content">
        <el-form v-if="!isJsonMode" label-position="top">
          <template v-for="(value, key) in parsedConfig" :key="key">
            <el-form-item :label="key">
              <el-input v-if="typeof value === 'string'" v-model="parsedConfig[key]" />
              <el-input-number v-else-if="typeof value === 'number'" v-model="parsedConfig[key]" :controls="false" />
              <el-switch v-else-if="typeof value === 'boolean'" v-model="parsedConfig[key]" />
              <el-input v-else type="textarea" :rows="3" v-model="parsedConfig[key]" placeholder="复杂对象，请切换到JSON模式编辑" disabled />
            </el-form-item>
          </template>
        </el-form>
        
        <div v-else class="json-editor">
          <el-input 
            type="textarea" 
            v-model="configJson" 
            :rows="15" 
            :class="{ 'json-error': jsonError }"
            @input="validateJson"
          />
          <div v-if="jsonError" class="json-error-message">
            JSON 格式错误: {{ jsonError }}
          </div>
        </div>
        
        <div class="editor-actions">
          <el-button @click="toggleEditorMode">
            {{ isJsonMode ? '表单模式' : 'JSON模式' }}
          </el-button>
        </div>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="visible = false">取消</el-button>
          <el-button type="primary" @click="handleSave" :loading="saving" :disabled="jsonError">
            保存
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { message } from '@repo/utils';
import { getServiceConfig, updateServiceConfig, parseServiceConfig, stringifyServiceConfig, type ServiceConfig } from '@/api/soft/config';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  installId: {
    type: [String, Number],
    required: true
  },
  title: {
    type: String,
    default: '服务配置'
  },
  readOnly: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'save']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isJsonMode = ref(false);
const configJson = ref('{}');
const parsedConfig = reactive<ServiceConfig>({});
const loading = ref(false);
const saving = ref(false);
const jsonError = ref('');

// 加载配置
const loadConfig = async () => {
  if (!props.installId) return;
  
  try {
    loading.value = true;
    const res = await getServiceConfig(Number(props.installId));
    
    if (res.code === '00000' && res.data) {
      configJson.value = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2);
      
      // 解析配置
      const config = parseServiceConfig(configJson.value);
      Object.keys(parsedConfig).forEach(key => delete parsedConfig[key]);
      Object.assign(parsedConfig, config);
    } else {
      message.error(res.msg || '加载配置失败');
      configJson.value = '{}';
      Object.keys(parsedConfig).forEach(key => delete parsedConfig[key]);
    }
  } catch (error) {
    console.error('加载配置失败:', error);
    message.error('加载配置失败');
    configJson.value = '{}';
    Object.keys(parsedConfig).forEach(key => delete parsedConfig[key]);
  } finally {
    loading.value = false;
  }
};

// 保存配置
const handleSave = async () => {
  if (props.readOnly) return;
  
  try {
    saving.value = true;
    
    // 根据当前模式获取配置
    const configToSave = isJsonMode.value 
      ? configJson.value 
      : stringifyServiceConfig(parsedConfig);
    
    const res = await updateServiceConfig(Number(props.installId), configToSave);
    
    if (res.code === '00000') {
      message.success('保存配置成功');
      emit('save', configToSave);
      visible.value = false;
    } else {
      message.error(res.msg || '保存配置失败');
    }
  } catch (error) {
    console.error('保存配置失败:', error);
    message.error('保存配置失败');
  } finally {
    saving.value = false;
  }
};

// 切换编辑器模式
const toggleEditorMode = () => {
  if (isJsonMode.value) {
    // 从JSON模式切换到表单模式
    try {
      const config = JSON.parse(configJson.value);
      Object.keys(parsedConfig).forEach(key => delete parsedConfig[key]);
      Object.assign(parsedConfig, config);
      isJsonMode.value = false;
      jsonError.value = '';
    } catch (error) {
      message.error('JSON格式错误，无法切换到表单模式');
    }
  } else {
    // 从表单模式切换到JSON模式
    configJson.value = JSON.stringify(parsedConfig, null, 2);
    isJsonMode.value = true;
  }
};

// 验证JSON
const validateJson = () => {
  if (!isJsonMode.value) return;
  
  try {
    JSON.parse(configJson.value);
    jsonError.value = '';
  } catch (error) {
    jsonError.value = (error as Error).message;
  }
};

// 处理关闭
const handleClose = () => {
  jsonError.value = '';
  isJsonMode.value = false;
};

// 监听对话框可见性变化
watch(() => visible.value, (val) => {
  if (val) {
    loadConfig();
  }
});
</script>

<style lang="scss" scoped>
.config-editor {
  &-content {
    max-height: 60vh;
    overflow-y: auto;
    padding: 10px 0;
  }
  
  .json-editor {
    position: relative;
    
    .json-error {
      border-color: var(--el-color-danger);
    }
    
    .json-error-message {
      color: var(--el-color-danger);
      font-size: 12px;
      margin-top: 5px;
    }
  }
  
  .editor-actions {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style> 