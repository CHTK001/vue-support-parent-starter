<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑任务' : '创建任务'"
    width="600px"
    @close="handleClose"
  >
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <el-form-item label="任务名称" prop="syncTaskName">
        <el-input v-model="formData.syncTaskName" placeholder="请输入任务名称" />
      </el-form-item>
      
      <el-form-item label="任务描述" prop="syncTaskDesc">
        <el-input
          v-model="formData.syncTaskDesc"
          type="textarea"
          :rows="3"
          placeholder="请输入任务描述"
        />
      </el-form-item>
      
      <el-form-item label="数据源类型" prop="syncTaskSourceType">
        <el-select v-model="formData.syncTaskSourceType" placeholder="请选择数据源类型">
          <el-option label="MySQL" value="mysql" />
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="MongoDB" value="mongodb" />
          <el-option label="Kafka" value="kafka" />
          <el-option label="文件" value="file" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="目标源类型" prop="syncTaskTargetType">
        <el-select v-model="formData.syncTaskTargetType" placeholder="请选择目标源类型">
          <el-option label="MySQL" value="mysql" />
          <el-option label="PostgreSQL" value="postgresql" />
          <el-option label="MongoDB" value="mongodb" />
          <el-option label="Kafka" value="kafka" />
          <el-option label="文件" value="file" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="同步模式" prop="syncTaskSyncMode">
        <el-select v-model="formData.syncTaskSyncMode" placeholder="请选择同步模式">
          <el-option label="全量同步" value="FULL" />
          <el-option label="增量同步" value="INCREMENTAL" />
          <el-option label="双向同步" value="BIDIRECTIONAL" />
        </el-select>
      </el-form-item>
      
      <el-form-item label="批次大小" prop="syncTaskBatchSize">
        <el-input-number
          v-model="formData.syncTaskBatchSize"
          :min="100"
          :max="10000"
          :step="100"
        />
      </el-form-item>
      
      <el-form-item label="线程池大小" prop="syncTaskThreadPoolSize">
        <el-input-number
          v-model="formData.syncTaskThreadPoolSize"
          :min="1"
          :max="20"
        />
      </el-form-item>
    </el-form>
    
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

const props = defineProps<{
  modelValue: boolean;
  task?: any;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  submit: [data: any];
}>();

const visible = ref(props.modelValue);
const formRef = ref<FormInstance>();
const loading = ref(false);

const isEdit = ref(!!props.task);

const formData = reactive({
  syncTaskName: '',
  syncTaskDesc: '',
  syncTaskSourceType: '',
  syncTaskTargetType: '',
  syncTaskSyncMode: 'FULL',
  syncTaskBatchSize: 1000,
  syncTaskThreadPoolSize: 5,
});

const rules: FormRules = {
  syncTaskName: [
    { required: true, message: '请输入任务名称', trigger: 'blur' },
  ],
  syncTaskSourceType: [
    { required: true, message: '请选择数据源类型', trigger: 'change' },
  ],
  syncTaskTargetType: [
    { required: true, message: '请选择目标源类型', trigger: 'change' },
  ],
};

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val && props.task) {
    Object.assign(formData, props.task);
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

const handleClose = () => {
  visible.value = false;
  formRef.value?.resetFields();
};

const handleSubmit = async () => {
  await formRef.value?.validate();
  loading.value = true;
  try {
    emit('submit', { ...formData });
    handleClose();
  } finally {
    loading.value = false;
  }
};
</script>
