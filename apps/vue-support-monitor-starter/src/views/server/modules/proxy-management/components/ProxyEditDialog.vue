<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增代理' : '编辑代理'"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      label-position="left"
    >
      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="代理名称" prop="monitorSysGenServerProxyName">
            <el-input
              v-model="formData.monitorSysGenServerProxyName"
              placeholder="请输入代理名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="代理类型" prop="monitorSysGenServerProxyType">
            <el-select
              v-model="formData.monitorSysGenServerProxyType"
              placeholder="选择代理类型"
              style="width: 100%"
            >
              <el-option label="HTTP" value="HTTP">
                <div class="proxy-type-option">
                  <IconifyIconOnline icon="ri:global-line" />
                  <span>HTTP</span>
                </div>
              </el-option>
              <el-option label="SOCKS4" value="SOCKS4">
                <div class="proxy-type-option">
                  <IconifyIconOnline icon="ri:shield-line" />
                  <span>SOCKS4</span>
                </div>
              </el-option>
              <el-option label="SOCKS5" value="SOCKS5">
                <div class="proxy-type-option">
                  <IconifyIconOnline icon="ri:shield-check-line" />
                  <span>SOCKS5</span>
                </div>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="16">
          <el-form-item label="代理地址" prop="monitorSysGenServerProxyHost">
            <el-input
              v-model="formData.monitorSysGenServerProxyHost"
              placeholder="请输入代理服务器地址"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="端口" prop="monitorSysGenServerProxyPort">
            <el-input-number
              v-model="formData.monitorSysGenServerProxyPort"
              :min="1"
              :max="65535"
              placeholder="端口"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户名">
            <el-input
              v-model="formData.monitorSysGenServerProxyUsername"
              placeholder="用户名（可选）"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="密码">
            <el-input
              v-model="formData.monitorSysGenServerProxyPassword"
              type="password"
              placeholder="密码（可选）"
              clearable
              show-password
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="连接超时">
            <el-input-number
              v-model="formData.monitorSysGenServerProxyTimeout"
              :min="1000"
              :max="300000"
              :step="1000"
              placeholder="毫秒"
              style="width: 100%"
            />
            <div class="form-tip">连接超时时间（毫秒）</div>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="状态">
            <el-switch
              v-model="formData.monitorSysGenServerProxyStatus"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="标签">
        <el-input
          v-model="formData.monitorSysGenServerProxyTags"
          placeholder="标签，多个标签用逗号分隔"
          clearable
        />
        <div class="form-tip">用于分类和筛选代理，多个标签用逗号分隔</div>
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="formData.monitorSysGenServerProxyDescription"
          type="textarea"
          :rows="3"
          placeholder="请输入代理描述"
          maxlength="500"
          show-word-limit
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleTest" :loading="testLoading">
          <IconifyIconOnline icon="ri:test-tube-line" class="mr-1" />
          测试连接
        </el-button>
        <el-button type="primary" @click="handleSubmit" :loading="loading">
          {{ mode === 'add' ? '新增' : '保存' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { message } from "@repo/utils";
import {
  saveProxy,
  updateProxy,
  testProxyConnection,
  type ServerProxy
} from "@/api/monitor/gen/server-proxy";

// 定义事件
const emit = defineEmits<{
  success: [];
}>();

// 响应式状态
const visible = ref(false);
const loading = ref(false);
const testLoading = ref(false);
const mode = ref<"add" | "edit">("add");
const formRef = ref();

// 表单数据
const formData = reactive({
  monitorSysGenServerProxyId: null as number | null,
  monitorSysGenServerProxyName: "",
  monitorSysGenServerProxyType: "HTTP",
  monitorSysGenServerProxyHost: "",
  monitorSysGenServerProxyPort: 8080,
  monitorSysGenServerProxyUsername: "",
  monitorSysGenServerProxyPassword: "",
  monitorSysGenServerProxyStatus: 1,
  monitorSysGenServerProxyDescription: "",
  monitorSysGenServerProxyTimeout: 30000,
  monitorSysGenServerProxyAuthRequired: 0,
  monitorSysGenServerProxyTags: ""
});

// 表单验证规则
const rules = {
  monitorSysGenServerProxyName: [
    { required: true, message: "请输入代理名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" }
  ],
  monitorSysGenServerProxyType: [
    { required: true, message: "请选择代理类型", trigger: "change" }
  ],
  monitorSysGenServerProxyHost: [
    { required: true, message: "请输入代理地址", trigger: "blur" },
    {
      pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
      message: "请输入有效的IP地址或域名",
      trigger: "blur"
    }
  ],
  monitorSysGenServerProxyPort: [
    { required: true, message: "请输入端口号", trigger: "blur" },
    { type: "number", min: 1, max: 65535, message: "端口号范围 1-65535", trigger: "blur" }
  ]
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerProxyId: null,
    monitorSysGenServerProxyName: "",
    monitorSysGenServerProxyType: "HTTP",
    monitorSysGenServerProxyHost: "",
    monitorSysGenServerProxyPort: 8080,
    monitorSysGenServerProxyUsername: "",
    monitorSysGenServerProxyPassword: "",
    monitorSysGenServerProxyStatus: 1,
    monitorSysGenServerProxyDescription: "",
    monitorSysGenServerProxyTimeout: 30000,
    monitorSysGenServerProxyAuthRequired: 0,
    monitorSysGenServerProxyTags: ""
  });
  formRef.value?.clearValidate();
};

/**
 * 打开对话框
 */
const open = (editMode: "add" | "edit" = "add", data?: ServerProxy) => {
  mode.value = editMode;
  visible.value = true;

  if (editMode === "add") {
    resetForm();
  } else if (data) {
    Object.assign(formData, data);
  }
};

/**
 * 测试连接
 */
const handleTest = async () => {
  try {
    await formRef.value?.validate();
    
    testLoading.value = true;
    
    // 如果是新增模式，需要先保存再测试
    if (mode.value === "add") {
      const result = await saveProxy(formData);
      if (result.success) {
        formData.monitorSysGenServerProxyId = result.data.monitorSysGenServerProxyId;
        mode.value = "edit"; // 切换到编辑模式
      } else {
        message.error(result.msg || '保存失败');
        return;
      }
    }
    
    const testResult = await testProxyConnection(formData.monitorSysGenServerProxyId!);
    if (testResult.success) {
      message.success(testResult.data.message);
    } else {
      message.error(testResult.msg || '测试失败');
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    message.error('测试连接失败');
  } finally {
    testLoading.value = false;
  }
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();
    
    loading.value = true;
    
    // 设置认证要求
    formData.monitorSysGenServerProxyAuthRequired = 
      formData.monitorSysGenServerProxyUsername ? 1 : 0;
    
    let result;
    if (mode.value === "add") {
      result = await saveProxy(formData);
    } else {
      result = await updateProxy(formData);
    }
    
    if (result.success) {
      message.success(mode.value === "add" ? "新增成功" : "保存成功");
      visible.value = false;
      emit("success");
    } else {
      message.error(result.msg || "操作失败");
    }
  } catch (error) {
    console.error('提交失败:', error);
    message.error('提交失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 取消
 */
const handleCancel = () => {
  visible.value = false;
};

// 暴露方法
defineExpose({
  open
});
</script>

<style scoped lang="scss">
.proxy-type-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
