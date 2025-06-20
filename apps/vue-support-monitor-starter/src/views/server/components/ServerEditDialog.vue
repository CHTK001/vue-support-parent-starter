<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增服务器' : '编辑服务器'"
    width="600px"
    :close-on-click-modal="false"
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
          <el-form-item label="服务器名称" prop="monitorSysGenServerName">
            <el-input
              v-model="formData.monitorSysGenServerName"
              placeholder="请输入服务器名称"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="协议类型" prop="monitorSysGenServerProtocol">
            <el-select
              v-model="formData.monitorSysGenServerProtocol"
              placeholder="选择协议类型"
              style="width: 100%"
              @change="handleProtocolChange"
            >
              <el-option label="SSH" value="SSH" />
              <el-option label="RDP" value="RDP" />
              <el-option label="VNC" value="VNC" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="16">
          <el-form-item label="服务器地址" prop="monitorSysGenServerHost">
            <el-input
              v-model="formData.monitorSysGenServerHost"
              placeholder="请输入IP地址或域名"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="端口" prop="monitorSysGenServerPort">
            <el-input-number
              v-model="formData.monitorSysGenServerPort"
              :min="1"
              :max="65535"
              placeholder="端口号"
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16">
        <el-col :span="12">
          <el-form-item label="用户名" prop="monitorSysGenServerUsername">
            <el-input
              v-model="formData.monitorSysGenServerUsername"
              placeholder="请输入用户名"
              clearable
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="认证方式" prop="monitorSysGenServerAuthType">
            <el-select
              v-model="formData.monitorSysGenServerAuthType"
              placeholder="选择认证方式"
              style="width: 100%"
            >
              <el-option label="密码认证" value="password" />
              <el-option label="密钥认证" value="key" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item
        v-if="formData.monitorSysGenServerAuthType === 'password'"
        label="密码"
        prop="monitorSysGenServerPassword"
      >
        <el-input
          v-model="formData.monitorSysGenServerPassword"
          type="password"
          placeholder="请输入密码"
          show-password
          clearable
        />
      </el-form-item>

      <el-form-item
        v-if="formData.monitorSysGenServerAuthType === 'key'"
        label="私钥"
        prop="monitorSysGenServerPrivateKey"
      >
        <el-input
          v-model="formData.monitorSysGenServerPrivateKey"
          type="textarea"
          :rows="4"
          placeholder="请输入SSH私钥内容"
        />
      </el-form-item>

      <el-row :gutter="16">
        <el-col :span="8">
          <el-form-item label="状态">
            <el-switch
              v-model="formData.monitorSysGenServerStatus"
              :active-value="1"
              :inactive-value="0"
              active-text="启用"
              inactive-text="禁用"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="启用监控">
            <el-switch
              v-model="formData.monitorSysGenServerMonitorEnabled"
              :active-value="1"
              :inactive-value="0"
              active-text="开启"
              inactive-text="关闭"
            />
          </el-form-item>
        </el-col>
        <el-col :span="8">
          <el-form-item label="指标支持">
            <el-switch
              v-model="formData.monitorSysGenServerMetricsSupport"
              :active-value="true"
              :inactive-value="false"
              active-text="支持"
              inactive-text="不支持"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-form-item label="标签" prop="monitorSysGenServerTags">
        <el-input
          v-model="formData.monitorSysGenServerTags"
          placeholder="请输入标签，多个标签用逗号分隔"
          clearable
        />
      </el-form-item>

      <el-form-item label="描述">
        <el-input
          v-model="formData.monitorSysGenServerDescription"
          type="textarea"
          :rows="3"
          placeholder="请输入服务器描述信息"
        />
      </el-form-item>

      <!-- SSH特有配置 -->
      <template v-if="formData.monitorSysGenServerProtocol === 'SSH'">
        <el-divider content-position="left">SSH 配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="字符编码">
              <el-select
                v-model="formData.monitorSysGenServerCharset"
                placeholder="选择字符编码"
                style="width: 100%"
              >
                <el-option label="UTF-8" value="UTF-8" />
                <el-option label="GBK" value="GBK" />
                <el-option label="GB2312" value="GB2312" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="连接超时">
              <el-input-number
                v-model="formData.monitorSysGenServerTimeout"
                :min="1000"
                :max="60000"
                :step="1000"
                placeholder="毫秒"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- RDP特有配置 -->
      <template v-if="formData.monitorSysGenServerProtocol === 'RDP'">
        <el-divider content-position="left">RDP 配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="屏幕宽度">
              <el-input-number
                v-model="formData.monitorSysGenServerWidth"
                :min="800"
                :max="1920"
                placeholder="像素"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="屏幕高度">
              <el-input-number
                v-model="formData.monitorSysGenServerHeight"
                :min="600"
                :max="1080"
                placeholder="像素"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="颜色深度">
              <el-select
                v-model="formData.monitorSysGenServerColorDepth"
                placeholder="选择颜色深度"
                style="width: 100%"
              >
                <el-option label="16位" value="16" />
                <el-option label="24位" value="24" />
                <el-option label="32位" value="32" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </template>

      <!-- VNC特有配置 -->
      <template v-if="formData.monitorSysGenServerProtocol === 'VNC'">
        <el-divider content-position="left">VNC 配置</el-divider>
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="VNC密码">
              <el-input
                v-model="formData.monitorSysGenServerVncPassword"
                type="password"
                placeholder="请输入VNC密码"
                show-password
                clearable
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="只读模式">
              <el-switch
                v-model="formData.monitorSysGenServerReadOnly"
                :active-value="1"
                :inactive-value="0"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </template>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">
          {{ mode === 'add' ? '新增' : '保存' }}
        </el-button>
        <el-button v-if="mode === 'edit'" type="success" :loading="testLoading" @click="handleTest">
          测试连接
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { message } from "@repo/utils";
import { saveServer, testServerConnection } from "@/api/monitor/gen/server";

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
  monitorSysGenServerId: null as number | null,
  monitorSysGenServerName: "",
  monitorSysGenServerHost: "",
  monitorSysGenServerPort: 22,
  monitorSysGenServerProtocol: "SSH",
  monitorSysGenServerUsername: "",
  monitorSysGenServerPassword: "",
  monitorSysGenServerPrivateKey: "",
  monitorSysGenServerAuthType: "password",
  monitorSysGenServerStatus: 1,
  monitorSysGenServerMonitorEnabled: 1,
  monitorSysGenServerMetricsSupport: true,
  monitorSysGenServerTags: "",
  monitorSysGenServerDescription: "",
  monitorSysGenServerCharset: "UTF-8",
  monitorSysGenServerTimeout: 30000,
  monitorSysGenServerWidth: 1024,
  monitorSysGenServerHeight: 768,
  monitorSysGenServerColorDepth: "24",
  monitorSysGenServerVncPassword: "",
  monitorSysGenServerReadOnly: 0,
});

// 表单验证规则
const rules = {
  monitorSysGenServerName: [
    { required: true, message: "请输入服务器名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
  monitorSysGenServerHost: [
    { required: true, message: "请输入服务器地址", trigger: "blur" },
    {
      pattern: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/,
      message: "请输入有效的IP地址或域名",
      trigger: "blur",
    },
  ],
  monitorSysGenServerPort: [
    { required: true, message: "请输入端口号", trigger: "blur" },
    { type: "number", min: 1, max: 65535, message: "端口号范围 1-65535", trigger: "blur" },
  ],
  monitorSysGenServerProtocol: [
    { required: true, message: "请选择协议类型", trigger: "change" },
  ],
  monitorSysGenServerUsername: [
    { required: true, message: "请输入用户名", trigger: "blur" },
  ],
  monitorSysGenServerAuthType: [
    { required: true, message: "请选择认证方式", trigger: "change" },
  ],
  monitorSysGenServerPassword: [
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (formData.monitorSysGenServerAuthType === "password" && !value) {
          callback(new Error("请输入密码"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
  monitorSysGenServerPrivateKey: [
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (formData.monitorSysGenServerAuthType === "key" && !value) {
          callback(new Error("请输入私钥"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};

/**
 * 打开对话框
 */
const open = (editMode: "add" | "edit" = "add") => {
  mode.value = editMode;
  visible.value = true;

  // 根据协议设置默认端口
  if (editMode === "add") {
    setDefaultPort();
  }
};

/**
 * 设置数据
 */
const setData = (data: any) => {
  if (data && Object.keys(data).length > 0) {
    Object.assign(formData, data);
  } else {
    resetForm();
  }
};

/**
 * 重置表单
 */
const resetForm = () => {
  Object.assign(formData, {
    monitorSysGenServerId: null,
    monitorSysGenServerName: "",
    monitorSysGenServerHost: "",
    monitorSysGenServerPort: 22,
    monitorSysGenServerProtocol: "SSH",
    monitorSysGenServerUsername: "",
    monitorSysGenServerPassword: "",
    monitorSysGenServerPrivateKey: "",
    monitorSysGenServerAuthType: "password",
    monitorSysGenServerStatus: 1,
    monitorSysGenServerMonitorEnabled: 1,
    monitorSysGenServerMetricsSupport: true,
    monitorSysGenServerTags: "",
    monitorSysGenServerDescription: "",
    monitorSysGenServerCharset: "UTF-8",
    monitorSysGenServerTimeout: 30000,
    monitorSysGenServerWidth: 1024,
    monitorSysGenServerHeight: 768,
    monitorSysGenServerColorDepth: "24",
    monitorSysGenServerVncPassword: "",
    monitorSysGenServerReadOnly: 0,
  });

  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

/**
 * 根据协议设置默认端口
 */
const setDefaultPort = () => {
  const portMap = {
    SSH: 22,
    RDP: 3389,
    VNC: 5900,
  };

  if (formData.monitorSysGenServerProtocol in portMap) {
    formData.monitorSysGenServerPort = portMap[formData.monitorSysGenServerProtocol as keyof typeof portMap];
  }
};

/**
 * 监听协议变化
 */
const handleProtocolChange = () => {
  setDefaultPort();
};

/**
 * 提交表单
 */
const handleSubmit = async () => {
  try {
    await formRef.value?.validate();

    loading.value = true;
    const res = await saveServer(formData);

    if (res.code === "00000") {
      message.success(mode.value === "add" ? "新增成功" : "保存成功");
      visible.value = false;
      emit("success");
    } else {
      message.error(res.msg || "操作失败");
    }
  } catch (error) {
    console.error("保存服务器配置出错:", error);
    if (error !== false) { // 表单验证失败时不显示错误消息
      message.error("操作异常，请稍后重试");
    }
  } finally {
    loading.value = false;
  }
};

/**
 * 测试连接
 */
const handleTest = async () => {
  try {
    await formRef.value?.validate();

    if (!formData.monitorSysGenServerId) {
      message.warning("请先保存服务器配置后再测试连接");
      return;
    }

    testLoading.value = true;
    const res = await testServerConnection(String(formData.monitorSysGenServerId));

    if (res.code === "00000") {
      message.success(res.data ? "连接测试成功" : "连接测试失败");
    } else {
      message.error(res.msg || "测试失败");
    }
  } catch (error) {
    console.error("测试连接出错:", error);
    if (error !== false) {
      message.error("测试异常，请稍后重试");
    }
  } finally {
    testLoading.value = false;
  }
};

// 暴露方法
defineExpose({
  open,
  setData,
});
</script>

<style lang="scss" scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
}

:deep(.el-divider__text) {
  font-weight: 500;
  color: var(--el-color-primary);
}
</style>
