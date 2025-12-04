<template>
  <el-dialog
    v-model="dialogVisible"
    title="克隆服务�?
    width="500px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="clone-info" v-if="sourceServer">
      <el-alert
        :title="`正在克隆服务�? ${sourceServer.systemServerName}`"
        type="info"
        :closable="false"
        show-icon
      />
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="right"
      style="margin-top: 20px"
    >
      <el-form-item label="新服务器名称" prop="newName">
        <el-input
          v-model="formData.newName"
          placeholder="请输入新服务器名�?
          clearable
        />
      </el-form-item>

      <el-form-item label="新服务器端口" prop="newPort">
        <el-input-number
          v-model="formData.newPort"
          :min="1"
          :max="65535"
          placeholder="请输入新端口�?
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="克隆说明">
        <el-alert
          title="克隆将复制源服务器的所有配置，包括ServletFilter设置"
          type="warning"
          :closable="false"
          show-icon
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          克隆
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { cloneSystemServer, type SystemServer } from "@/api/system-server";

// Props
interface Props {
  visible: boolean;
  sourceServer?: SystemServer | null;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  sourceServer: null
});

// Emits
const emit = defineEmits<{
  'update:visible': [value: boolean];
  'success': [];
}>();

// 响应式数�?
const formRef = ref<FormInstance>();
const loading = ref(false);

// 计算属�?
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value)
});

// 表单数据
const formData = reactive({
  newName: '',
  newPort: 8080
});

// 表单验证规则
const formRules: FormRules = {
  newName: [
    { required: true, message: '请输入新服务器名�?, trigger: 'blur' },
    { min: 2, max: 100, message: '服务器名称长度在 2 �?100 个字�?, trigger: 'blur' }
  ],
  newPort: [
    { required: true, message: '请输入新服务器端�?, trigger: 'blur' },
    { type: 'number', min: 1, max: 65535, message: '端口号必须在 1-65535 之间', trigger: 'blur' }
  ]
};

// 监听源服务器变化
watch(() => props.sourceServer, (newServer) => {
  if (newServer) {
    formData.newName = `${newServer.systemServerName}_副本`;
    formData.newPort = (newServer.systemServerPort || 8080) + 1;
  }
}, { immediate: true });

// 重置表单
const resetForm = () => {
  formData.newName = '';
  formData.newPort = 8080;
  formRef.value?.clearValidate();
};

// 关闭对话�?
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value || !props.sourceServer?.systemServerId) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    loading.value = true;
    
    const response = await cloneSystemServer(
      props.sourceServer.systemServerId,
      formData.newName,
      formData.newPort
    );
    
    if (response.success) {
      ElMessage.success('克隆成功');
      emit('success');
    } else {
      ElMessage.error(response.msg || '克隆失败');
    }
  } catch (error) {
    console.error('克隆服务器失�?', error);
    ElMessage.error('克隆失败');
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.clone-info {
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
