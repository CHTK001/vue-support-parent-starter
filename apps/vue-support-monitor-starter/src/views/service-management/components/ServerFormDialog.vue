<template>
  <sc-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑服务' : '新增服务'"
    width="900px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="form-container">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
        label-position="right"
        class="server-form"
      >
        <el-row :gutter="24">
          <!-- 左列：基本信息 -->
          <el-col :span="12">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline
                  icon="ri:information-line"
                  class="section-icon"
                />
                <span class="section-title">基本信息</span>
              </div>
              <div class="section-content">
                <el-form-item label="服务名称" prop="systemServerName">
                  <el-input
                    v-model="formData.systemServerName"
                    placeholder="请输入服务名称"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:server-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="服务类型" prop="systemServerType">
                  <el-select
                    v-model="formData.systemServerType"
                    placeholder="请选择服务类型"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in serverTypes"
                      :key="item.name"
                      :label="
                        item.describe
                          ? item.describe + '(' + item.name + ')'
                          : item.name
                      "
                      :value="item.name"
                    />
                  </el-select>
                </el-form-item>

                <el-form-item label="服务主机">
                  <el-input
                    v-model="formData.systemServerHost"
                    placeholder="请输入服务主机"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:global-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="服务端口" prop="systemServerPort">
                  <el-input-number
                    v-model="formData.systemServerPort"
                    :min="1"
                    :max="65535"
                    placeholder="端口号"
                    style="width: 100%"
                  />
                  <div
                    v-if="portCheckMessage"
                    :class="portCheckClass"
                    class="port-check-message"
                  >
                    {{ portCheckMessage }}
                  </div>
                </el-form-item>

                <el-form-item label="上下文路径" prop="systemServerContextPath">
                  <el-input
                    v-model="formData.systemServerContextPath"
                    placeholder="如: /api"
                    style="width: 100%"
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:link" />
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>
          </el-col>

          <!-- 右列：高级配置 -->
          <el-col :span="12">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline
                  icon="ri:settings-3-line"
                  class="section-icon advanced"
                />
                <span class="section-title">高级配置</span>
              </div>
              <div class="section-content">
                <el-form-item
                  label="最大连接数"
                  prop="systemServerMaxConnections"
                >
                  <el-input-number
                    v-model="formData.systemServerMaxConnections"
                    :min="1"
                    :max="10000"
                    placeholder="不填则无限制"
                    style="width: 100%"
                  />
                  <div class="form-tip">最大并发连接数限制</div>
                </el-form-item>

                <el-form-item label="超时时间" prop="systemServerTimeout">
                  <el-input-number
                    v-model="formData.systemServerTimeout"
                    :min="1"
                    :max="3600"
                    placeholder="秒"
                    style="width: 100%"
                  />
                  <div class="form-tip">连接超时时间（秒）</div>
                </el-form-item>

                <el-form-item label="自动启动">
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.systemServerAutoStart"
                      inline-prompt
                      active-text="开"
                      inactive-text="关"
                    />
                    <span class="switch-label">系统启动时自动启动服务</span>
                  </div>
                </el-form-item>

                <el-form-item label="服务描述" prop="systemServerDescription">
                  <el-input
                    v-model="formData.systemServerDescription"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入服务描述信息"
                  />
                </el-form-item>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose" class="cancel-btn">
          <IconifyIconOnline icon="ri:close-line" class="mr-1" />
          取消
        </el-button>
        <el-button
          type="primary"
          @click="handleSubmit"
          :loading="loading"
          class="submit-btn"
        >
          <IconifyIconOnline
            :icon="isEdit ? 'ri:save-line' : 'ri:add-line'"
            class="mr-1"
          />
          {{ isEdit ? "保存" : "创建" }}
        </el-button>
      </div>
    </template>
  </sc-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import { message } from "@repo/utils";
import { type FormInstance, type FormRules } from "element-plus";
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
  serverTypes: any[];
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
  systemServerContextPath: "",
  systemServerPort: 8080,
  systemServerHost: "0.0.0.0",
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
      message(isEdit.value ? "更新成功" : "创建成功", { type: "success" });
      emit("success");
    } else {
      message(response.msg || "操作失败", { type: "error" });
    }
  } catch (error) {
    console.error("提交表单失败:", error);
    message("操作失败", { type: "error" });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
/* 表单容器 */
.form-container {
  .server-form {
    :deep(.el-form-item) {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(.el-form-item__label) {
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    :deep(.el-input__wrapper),
    :deep(.el-select .el-input__wrapper) {
      border-radius: 8px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 0 0 1px var(--el-color-primary-light-5) inset;
      }
    }

    :deep(.el-input-number) {
      width: 100%;
    }

    :deep(.el-switch) {
      --el-switch-on-color: var(--el-color-primary);
    }

    :deep(.el-textarea__inner) {
      border-radius: 8px;
    }
  }
}

/* 表单分区 */
.form-section {
  background: linear-gradient(
    135deg,
    var(--el-fill-color-lighter) 0%,
    var(--el-bg-color) 100%
  );
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  height: 100%;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--el-color-primary-light-7);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .section-icon {
      font-size: 18px;
      color: var(--el-color-primary);
      padding: 8px;
      background: var(--el-color-primary-light-9);
      border-radius: 8px;

      &.advanced {
        color: var(--el-color-success);
        background: var(--el-color-success-light-9);
      }
    }

    .section-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .section-content {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

/* 表单提示 */
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* 开关包装 */
.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;

  .switch-label {
    font-size: 13px;
    color: var(--el-text-color-regular);
  }
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  .cancel-btn {
    border-radius: 8px;
    min-width: 88px;
    transition: all 0.3s ease;

    &:hover {
      background: var(--el-fill-color);
      transform: translateY(-1px);
    }
  }

  .submit-btn {
    border-radius: 8px;
    min-width: 100px;
    background: linear-gradient(
      135deg,
      var(--el-color-primary) 0%,
      var(--el-color-primary-light-3) 100%
    );
    border: none;
    box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.35);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(var(--el-color-primary-rgb), 0.45);
    }
  }
}

/* 端口检查消息 */
.port-check-message {
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  border-radius: 4px;

  &.port-available {
    color: #67c23a;
    background: rgba(103, 194, 58, 0.1);
  }

  &.port-unavailable {
    color: #f56c6c;
    background: rgba(245, 108, 108, 0.1);
  }

  &.port-error {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.1);
  }
}
</style>
