<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑服务器' : '新增服务器'"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      label-position="right"
    >
      <el-form-item label="服务器名称" prop="systemServerName">
        <el-input
          v-model="formData.systemServerName"
          placeholder="请输入服务器名称"
          clearable
        />
      </el-form-item>

      <el-form-item label="服务器类型" prop="systemServerType">
        <el-select
          v-model="formData.systemServerType"
          placeholder="请选择服务器类型"
          style="width: 100%"
        >
          <el-option
            v-for="type in serverTypes"
            :key="type"
            :label="type"
            :value="type"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="服务器端口" prop="systemServerPort">
        <el-input-number
          v-model="formData.systemServerPort"
          :min="1"
          :max="65535"
          placeholder="请输入端口号"
          style="width: 100%"
          @blur="checkPortAvailable"
        />
        <div
          v-if="portCheckMessage"
          :class="portCheckClass"
          class="port-check-message"
        >
          {{ portCheckMessage }}
        </div>
      </el-form-item>

      <el-form-item label="最大连接数" prop="systemServerMaxConnections">
        <el-input-number
          v-model="formData.systemServerMaxConnections"
          :min="1"
          :max="10000"
          placeholder="不填则无限制"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="超时时间(秒)" prop="systemServerTimeout">
        <el-input-number
          v-model="formData.systemServerTimeout"
          :min="1"
          :max="3600"
          placeholder="不填则使用默认值"
          style="width: 100%"
        />
      </el-form-item>

      <el-form-item label="自动启动">
        <el-switch
          v-model="formData.systemServerAutoStart"
          active-text="是"
          inactive-text="否"
        />
      </el-form-item>

      <el-form-item label="服务器描述" prop="systemServerDescription">
        <el-input
          v-model="formData.systemServerDescription"
          type="textarea"
          :rows="3"
          placeholder="请输入服务器描述"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ isEdit ? "更新" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import {
  addSystemServer,
  updateSystemServer,
  checkPortAvailable,
  type SystemServer,
} from "@/api/system-server";

// Props
interface Props {
  visible: boolean;
  serverData?: SystemServer | null;
  serverTypes: string[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  serverData: null,
  serverTypes: () => [],
});

// Emits
const emit = defineEmits<{
  "update:visible": [value: boolean];
  success: [];
}>();

// 响应式数据
const formRef = ref<FormInstance>();
const loading = ref(false);
const portCheckMessage = ref("");
const portCheckClass = ref("");

// 计算属性
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

const isEdit = computed(() => !!props.serverData?.systemServerId);

// 表单数据
const formData = reactive<SystemServer>({
  systemServerName: "",
  systemServerType: "",
  systemServerPort: 8080,
  systemServerMaxConnections: undefined,
  systemServerTimeout: undefined,
  systemServerAutoStart: false,
  systemServerDescription: "",
});

// 表单验证规则
const formRules: FormRules = {
  systemServerName: [
    { required: true, message: "请输入服务器名称", trigger: "blur" },
    {
      min: 2,
      max: 100,
      message: "服务器名称长度在 2 到 100 个字符",
      trigger: "blur",
    },
  ],
  systemServerType: [
    { required: true, message: "请选择服务器类型", trigger: "change" },
  ],
  systemServerPort: [
    { required: true, message: "请输入服务器端口", trigger: "blur" },
    {
      type: "number",
      min: 1,
      max: 65535,
      message: "端口号必须在 1-65535 之间",
      trigger: "blur",
    },
  ],
  systemServerDescription: [
    { max: 500, message: "描述长度不能超过 500 个字符", trigger: "blur" },
  ],
};

// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    systemServerId: undefined,
    systemServerName: "",
    systemServerType: "",
    systemServerPort: 8080,
    systemServerMaxConnections: undefined,
    systemServerTimeout: undefined,
    systemServerAutoStart: false,
    systemServerDescription: "",
  });
  formRef.value?.clearValidate();
};

// 监听服务器数据变化
watch(
  () => props.serverData,
  (newData) => {
    if (newData) {
      Object.assign(formData, {
        systemServerId: newData.systemServerId,
        systemServerName: newData.systemServerName,
        systemServerType: newData.systemServerType,
        systemServerPort: newData.systemServerPort,
        systemServerMaxConnections: newData.systemServerMaxConnections,
        systemServerTimeout: newData.systemServerTimeout,
        systemServerAutoStart: newData.systemServerAutoStart || false,
        systemServerDescription: newData.systemServerDescription || "",
      });
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false;
  resetForm();
};

// 检查端口可用性
const checkPortAvailableHandler = async () => {
  if (!formData.systemServerPort) {
    portCheckMessage.value = "";
    return;
  }

  try {
    const response = await checkPortAvailable(
      formData.systemServerPort,
      formData.systemServerId
    );

    if (response.success) {
      if (response.data) {
        portCheckMessage.value = "端口可用";
        portCheckClass.value = "port-available";
      } else {
        portCheckMessage.value = "端口已被占用";
        portCheckClass.value = "port-unavailable";
      }
    }
  } catch (error) {
    console.error("检查端口失败:", error);
    portCheckMessage.value = "检查端口失败";
    portCheckClass.value = "port-error";
  }
};

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return;

  try {
    const valid = await formRef.value.validate();
    if (!valid) return;

    loading.value = true;

    const apiCall = isEdit.value ? updateSystemServer : addSystemServer;
    const response = await apiCall(formData);

    if (response.success) {
      ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
      emit("success");
    } else {
      ElMessage.error(response.msg || "操作失败");
    }
  } catch (error) {
    console.error("提交表单失败:", error);
    ElMessage.error("操作失败");
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.port-check-message {
  font-size: 12px;
  margin-top: 4px;

  &.port-available {
    color: #67c23a;
  }

  &.port-unavailable {
    color: #f56c6c;
  }

  &.port-error {
    color: #e6a23c;
  }
}
</style>
