<template>
  <sc-dialog v-model="visibleProxy" class="config-edit-dialog" :show-close="true" width="600px">
    <template #header>
      <div class="dlg-header">
        <div class="title">
          <IconifyIconOnline :icon="isEdit ? 'ri:edit-line' : 'ri:add-line'" class="mr-2" />
          {{ isEdit ? '编辑配置' : '新增配置' }}
        </div>
        <div class="subtitle">{{ isEdit ? '修改配置项信息' : '创建新的配置项' }}</div>
      </div>
    </template>

    <el-form ref="formRef" :model="form" :rules="rules" label-width="90px" class="config-form">
      <el-form-item label="配置键" prop="monitorSysGenConfigKey">
        <el-input 
          v-model="form.monitorSysGenConfigKey" 
          placeholder="如: app.name、server.port"
          :disabled="isEdit"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:key-line" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="配置值" prop="monitorSysGenConfigValue">
        <el-input 
          v-model="form.monitorSysGenConfigValue" 
          type="textarea"
          :rows="3"
          placeholder="输入配置值"
        />
      </el-form-item>

      <el-form-item label="描述" prop="monitorSysGenConfigDescription">
        <el-input 
          v-model="form.monitorSysGenConfigDescription" 
          type="textarea"
          :rows="2"
          placeholder="配置项的说明描述"
        />
      </el-form-item>

      <el-form-item label="环境" prop="monitorSysGenConfigEnv">
        <el-select 
          v-model="form.monitorSysGenConfigEnv" 
          placeholder="选择环境"
          clearable
          filterable
          allow-create
          style="width: 100%"
        >
          <el-option 
            v-for="env in envList" 
            :key="env" 
            :label="env" 
            :value="env" 
          />
        </el-select>
      </el-form-item>

      <el-form-item label="应用" prop="monitorSysGenConfigApp">
        <el-input 
          v-model="form.monitorSysGenConfigApp" 
          placeholder="配置所属应用名称（可选）"
        >
          <template #prefix>
            <IconifyIconOnline icon="ri:apps-line" />
          </template>
        </el-input>
      </el-form-item>

      <el-form-item label="状态" prop="monitorSysGenConfigStatus">
        <el-switch
          v-model="form.monitorSysGenConfigStatus"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dlg-footer">
        <el-button @click="visibleProxy = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          <IconifyIconOnline icon="ri:check-line" class="mr-1" v-if="!loading" />
          {{ loading ? '提交中...' : '确定' }}
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch, reactive } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { message } from '@repo/utils';
import { 
  createConfig, 
  updateConfig,
  type MonitorConfig 
} from '@/api/config/index';

interface Props {
  visible: boolean;
  config: MonitorConfig | null;
  envList: string[];
}

interface Emits {
  (e: 'update:visible', v: boolean): void;
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const visibleProxy = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v)
});

const formRef = ref<FormInstance>();
const loading = ref(false);

const isEdit = computed(() => !!props.config?.monitorSysGenConfigId);

const form = reactive<MonitorConfig>({
  monitorSysGenConfigKey: '',
  monitorSysGenConfigValue: '',
  monitorSysGenConfigDescription: '',
  monitorSysGenConfigEnv: '',
  monitorSysGenConfigApp: '',
  monitorSysGenConfigStatus: 1,
});

const rules: FormRules = {
  monitorSysGenConfigKey: [
    { required: true, message: '请输入配置键', trigger: 'blur' },
    { max: 255, message: '配置键不能超过255个字符', trigger: 'blur' }
  ],
  monitorSysGenConfigValue: [
    { max: 5000, message: '配置值不能超过5000个字符', trigger: 'blur' }
  ],
  monitorSysGenConfigDescription: [
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' }
  ],
  monitorSysGenConfigEnv: [
    { max: 50, message: '环境名称不能超过50个字符', trigger: 'blur' }
  ],
  monitorSysGenConfigApp: [
    { max: 100, message: '应用名称不能超过100个字符', trigger: 'blur' }
  ]
};

// 监听对话框打开/关闭
watch(() => visibleProxy.value, (val) => {
  if (val) {
    // 重置或填充表单
    if (props.config) {
      Object.assign(form, {
        monitorSysGenConfigId: props.config.monitorSysGenConfigId,
        monitorSysGenConfigKey: props.config.monitorSysGenConfigKey || '',
        monitorSysGenConfigValue: props.config.monitorSysGenConfigValue || '',
        monitorSysGenConfigDescription: props.config.monitorSysGenConfigDescription || '',
        monitorSysGenConfigEnv: props.config.monitorSysGenConfigEnv || '',
        monitorSysGenConfigApp: props.config.monitorSysGenConfigApp || '',
        monitorSysGenConfigStatus: props.config.monitorSysGenConfigStatus ?? 1,
      });
    } else {
      resetForm();
    }
  } else {
    formRef.value?.resetFields();
  }
});

function resetForm() {
  Object.assign(form, {
    monitorSysGenConfigId: undefined,
    monitorSysGenConfigKey: '',
    monitorSysGenConfigValue: '',
    monitorSysGenConfigDescription: '',
    monitorSysGenConfigEnv: '',
    monitorSysGenConfigApp: '',
    monitorSysGenConfigStatus: 1,
  });
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  try {
    loading.value = true;

    const payload: MonitorConfig = {
      monitorSysGenConfigKey: form.monitorSysGenConfigKey,
      monitorSysGenConfigValue: form.monitorSysGenConfigValue,
      monitorSysGenConfigDescription: form.monitorSysGenConfigDescription,
      monitorSysGenConfigEnv: form.monitorSysGenConfigEnv,
      monitorSysGenConfigApp: form.monitorSysGenConfigApp,
      monitorSysGenConfigStatus: form.monitorSysGenConfigStatus,
    };

    let res: any;
    if (isEdit.value) {
      payload.monitorSysGenConfigId = form.monitorSysGenConfigId;
      res = await updateConfig(payload);
    } else {
      res = await createConfig(payload);
    }

    if (res?.code === '00000') {
      message(isEdit.value ? '修改成功' : '创建成功', { type: 'success' });
      emit('success');
      visibleProxy.value = false;
    } else {
      message(res?.msg || '操作失败', { type: 'error' });
    }
  } catch (e: any) {
    console.error('保存配置失败', e);
    message(e?.message || '操作失败', { type: 'error' });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.config-edit-dialog :deep(.el-dialog__body) {
  padding: 16px 24px;
}

.dlg-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.dlg-header .title {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  color: var(--app-text-primary);
}

.dlg-header .subtitle {
  font-size: 13px;
  color: var(--app-text-secondary);
  margin-left: 28px;
}

.config-form {
  padding: 16px 0;
}

.config-form :deep(.el-form-item__label) {
  font-weight: 500;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}


/* 响应式设计 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}

</style>
