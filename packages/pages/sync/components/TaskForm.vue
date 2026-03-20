<template>
  <el-dialog
    v-model="visible"
    :title="isEdit ? '编辑任务' : '创建任务'"
    width="640px"
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

      <el-form-item label="同步模式" prop="syncTaskSyncMode">
        <el-select v-model="formData.syncTaskSyncMode" placeholder="请选择同步模式">
          <el-option label="全量同步" value="FULL" />
          <el-option label="增量同步" value="INCREMENTAL" />
          <el-option label="双向同步" value="BIDIRECTIONAL" />
        </el-select>
      </el-form-item>

      <el-form-item label="增量字段" prop="syncTaskIncrementalField">
        <el-input
          v-model="formData.syncTaskIncrementalField"
          placeholder="增量同步时可填写更新时间字段"
        />
      </el-form-item>

      <el-form-item label="冲突策略" prop="syncTaskConflictStrategy">
        <el-select
          v-model="formData.syncTaskConflictStrategy"
          placeholder="请选择冲突策略"
        >
          <el-option label="覆盖" value="OVERWRITE" />
          <el-option label="跳过" value="SKIP" />
          <el-option label="合并" value="MERGE" />
        </el-select>
      </el-form-item>

      <el-form-item label="批次大小" prop="syncTaskBatchSize">
        <el-input-number
          v-model="formData.syncTaskBatchSize"
          :min="1"
          :max="100000"
        />
      </el-form-item>

      <el-form-item label="消费超时(ms)" prop="syncTaskConsumeTimeout">
        <el-input-number
          v-model="formData.syncTaskConsumeTimeout"
          :min="0"
          :step="1000"
        />
      </el-form-item>

      <el-form-item label="重试次数" prop="syncTaskRetryCount">
        <el-input-number
          v-model="formData.syncTaskRetryCount"
          :min="0"
          :max="100"
        />
      </el-form-item>

      <el-form-item label="重试间隔(ms)" prop="syncTaskRetryInterval">
        <el-input-number
          v-model="formData.syncTaskRetryInterval"
          :min="0"
          :step="1000"
        />
      </el-form-item>

      <el-form-item label="同步间隔(ms)" prop="syncTaskSyncInterval">
        <el-input-number
          v-model="formData.syncTaskSyncInterval"
          :min="0"
          :step="1000"
        />
      </el-form-item>

      <el-form-item label="CRON表达式" prop="syncTaskCron">
        <el-input
          v-model="formData.syncTaskCron"
          placeholder="如: 0 0 * * * ?"
        />
      </el-form-item>

      <el-form-item label="最大内存(MB)" prop="syncTaskMaxMemoryMb">
        <el-input-number
          v-model="formData.syncTaskMaxMemoryMb"
          :min="128"
          :max="65536"
        />
      </el-form-item>

      <el-form-item label="线程池大小" prop="syncTaskThreadPoolSize">
        <el-input-number
          v-model="formData.syncTaskThreadPoolSize"
          :min="1"
          :max="64"
        />
      </el-form-item>

      <el-form-item label="启用ACK" prop="syncTaskAckEnabled">
        <el-switch
          v-model="formData.syncTaskAckEnabled"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>

      <el-form-item label="启用事务" prop="syncTaskTransactionEnabled">
        <el-switch
          v-model="formData.syncTaskTransactionEnabled"
          :active-value="1"
          :inactive-value="0"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">
        {{ isEdit ? "保存" : "创建并设计" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import type { SyncTask } from "../api/task";

const props = defineProps<{
  modelValue: boolean;
  task?: SyncTask | null;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  submit: [data: SyncTask];
}>();

const createDefaultFormData = (): SyncTask => ({
  syncTaskName: "",
  syncTaskDesc: "",
  syncTaskSyncMode: "FULL",
  syncTaskIncrementalField: "",
  syncTaskConflictStrategy: "OVERWRITE",
  syncTaskBatchSize: 1000,
  syncTaskConsumeTimeout: 30000,
  syncTaskRetryCount: 3,
  syncTaskRetryInterval: 1000,
  syncTaskSyncInterval: 0,
  syncTaskCron: "",
  syncTaskAckEnabled: 1,
  syncTaskTransactionEnabled: 0,
  syncTaskMaxMemoryMb: 512,
  syncTaskThreadPoolSize: 5,
});

const visible = ref(props.modelValue);
const formRef = ref<FormInstance>();
const loading = ref(false);
const formData = reactive<SyncTask>(createDefaultFormData());

const isEdit = computed(() => !!props.task?.syncTaskId);

const rules: FormRules = {
  syncTaskName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
};

const resetFormData = (task?: SyncTask | null) => {
  Object.assign(formData, createDefaultFormData(), task || {});
};

watch(
  () => props.modelValue,
  (value) => {
    visible.value = value;
    if (value) {
      resetFormData(props.task);
    }
  }
);

watch(
  () => props.task,
  (task) => {
    if (visible.value) {
      resetFormData(task);
    }
  },
  { deep: true }
);

watch(visible, (value) => {
  emit("update:modelValue", value);
});

const handleClose = () => {
  visible.value = false;
  formRef.value?.clearValidate();
  resetFormData();
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) {
    return;
  }

  loading.value = true;
  try {
    emit("submit", { ...formData });
  } finally {
    loading.value = false;
  }
};
</script>
