<template>
  <el-dialog
    v-model="visible"
    :title="mode === 'add' ? '新增服务器' : '编辑服务器'"
    width="90%"
    :close-on-click-modal="false"
    destroy-on-close
    class="server-edit-dialog"
    align-center
    top="5vh"
  >
    <!-- 自定义头部 -->
    <template #header="{ close, titleId, titleClass }">
      <div class="dialog-header">
        <div class="header-left">
          <IconifyIconOnline
            :icon="mode === 'add' ? 'ri:add-circle-line' : 'ri:edit-line'"
            class="header-icon"
          />
          <span :id="titleId" :class="titleClass" class="dialog-title">
            {{ mode === 'add' ? '新增服务器' : '编辑服务器' }}
          </span>
        </div>
      </div>
    </template>

    <div class="dialog-content">
      <el-form
        ref="formRef"
        :model="formData"
        :rules="rules"
        label-width="100px"
        label-position="left"
        class="server-form"
      >
        <!-- 使用三列布局来节省空间 -->
        <el-row :gutter="24" class="form-row">
          <!-- 左列：基本信息 -->
          <el-col :span="8" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline icon="ri:information-line" class="section-icon" />
                <span class="section-title">基本信息</span>
              </div>
              <div class="section-content">
                <el-form-item label="服务器名称" prop="monitorSysGenServerName">
                  <el-input
                    v-model="formData.monitorSysGenServerName"
                    placeholder="请输入服务器名称"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:server-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="协议类型" prop="monitorSysGenServerProtocol">
                  <el-select
                    v-model="formData.monitorSysGenServerProtocol"
                    placeholder="选择协议类型"
                    style="width: 100%"
                    @change="handleProtocolChange"
                  >
                    <el-option label="SSH" value="SSH">
                      <div class="protocol-option">
                        <IconifyIconOnline icon="ri:terminal-line" />
                        <span>SSH</span>
                      </div>
                    </el-option>
                    <el-option label="RDP" value="RDP">
                      <div class="protocol-option">
                        <IconifyIconOnline icon="ri:computer-line" />
                        <span>RDP</span>
                      </div>
                    </el-option>
                    <el-option label="VNC" value="VNC">
                      <div class="protocol-option">
                        <IconifyIconOnline icon="ri:remote-control-line" />
                        <span>VNC</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

                <el-form-item label="服务器地址" prop="monitorSysGenServerHost">
                  <el-input
                    v-model="formData.monitorSysGenServerHost"
                    placeholder="请输入IP地址或域名"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:global-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="端口" prop="monitorSysGenServerPort">
                  <el-input-number
                    v-model="formData.monitorSysGenServerPort"
                    :min="1"
                    :max="65535"
                    placeholder="端口号"
                    style="width: 100%"
                  />
                </el-form-item>

                <el-form-item label="标签" prop="monitorSysGenServerTags">
                  <el-input
                    v-model="formData.monitorSysGenServerTags"
                    placeholder="多个标签用逗号分隔"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:price-tag-3-line" />
                    </template>
                  </el-input>
                </el-form-item>
              </div>
            </div>
          </el-col>

          <!-- 中列：认证信息 -->
          <el-col :span="8" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline icon="ri:shield-user-line" class="section-icon" />
                <span class="section-title">认证信息</span>
              </div>
              <div class="section-content">
                <el-form-item label="用户名" prop="monitorSysGenServerUsername">
                  <el-input
                    v-model="formData.monitorSysGenServerUsername"
                    placeholder="请输入用户名"
                    clearable
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:user-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item label="认证方式" prop="monitorSysGenServerAuthType">
                  <el-select
                    v-model="formData.monitorSysGenServerAuthType"
                    placeholder="选择认证方式"
                    style="width: 100%"
                  >
                    <el-option label="密码认证" value="password">
                      <div class="auth-option">
                        <IconifyIconOnline icon="ri:lock-password-line" />
                        <span>密码认证</span>
                      </div>
                    </el-option>
                    <el-option label="密钥认证" value="key">
                      <div class="auth-option">
                        <IconifyIconOnline icon="ri:key-line" />
                        <span>密钥认证</span>
                      </div>
                    </el-option>
                  </el-select>
                </el-form-item>

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
                  >
                    <template #prefix>
                      <IconifyIconOnline icon="ri:lock-line" />
                    </template>
                  </el-input>
                </el-form-item>

                <el-form-item
                  v-if="formData.monitorSysGenServerAuthType === 'key'"
                  label="私钥"
                  prop="monitorSysGenServerPrivateKey"
                >
                  <el-input
                    v-model="formData.monitorSysGenServerPrivateKey"
                    type="textarea"
                    :rows="3"
                    placeholder="请输入SSH私钥内容"
                  />
                </el-form-item>

                <!-- 协议特定配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'SSH'">
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
                </template>

                <template v-if="formData.monitorSysGenServerProtocol === 'VNC'">
                  <el-form-item label="VNC密码">
                    <el-input
                      v-model="formData.monitorSysGenServerVncPassword"
                      type="password"
                      placeholder="请输入VNC密码"
                      show-password
                      clearable
                    >
                      <template #prefix>
                        <IconifyIconOnline icon="ri:lock-line" />
                      </template>
                    </el-input>
                  </el-form-item>
                </template>
              </div>
            </div>
          </el-col>

          <!-- 右列：配置选项 -->
          <el-col :span="8" class="form-column">
            <div class="form-section">
              <div class="section-header">
                <IconifyIconOnline icon="ri:settings-3-line" class="section-icon" />
                <span class="section-title">配置选项</span>
              </div>
              <div class="section-content">
                <el-form-item label="状态">
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.monitorSysGenServerStatus"
                      :active-value="1"
                      :inactive-value="0"
                      active-text="启用"
                      inactive-text="禁用"
                    />
                  </div>
                </el-form-item>

                <el-form-item label="启用监控">
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.monitorSysGenServerMonitorEnabled"
                      :active-value="1"
                      :inactive-value="0"
                      active-text="开启"
                      inactive-text="关闭"
                    />
                  </div>
                </el-form-item>

                <el-form-item label="指标支持">
                  <div class="switch-wrapper">
                    <el-switch
                      v-model="formData.monitorSysGenServerMetricsSupport"
                      :active-value="true"
                      :inactive-value="false"
                      active-text="支持"
                      inactive-text="不支持"
                    />
                  </div>
                </el-form-item>

                <!-- RDP特有配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'RDP'">
                  <el-form-item label="屏幕宽度">
                    <el-input-number
                      v-model="formData.monitorSysGenServerWidth"
                      :min="800"
                      :max="1920"
                      placeholder="像素"
                      style="width: 100%"
                    />
                  </el-form-item>

                  <el-form-item label="屏幕高度">
                    <el-input-number
                      v-model="formData.monitorSysGenServerHeight"
                      :min="600"
                      :max="1080"
                      placeholder="像素"
                      style="width: 100%"
                    />
                  </el-form-item>

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
                </template>

                <!-- VNC特有配置 -->
                <template v-if="formData.monitorSysGenServerProtocol === 'VNC'">
                  <el-form-item label="只读模式">
                    <div class="switch-wrapper">
                      <el-switch
                        v-model="formData.monitorSysGenServerReadOnly"
                        :active-value="1"
                        :inactive-value="0"
                        active-text="是"
                        inactive-text="否"
                      />
                    </div>
                  </el-form-item>
                </template>

                <el-form-item label="描述">
                  <el-input
                    v-model="formData.monitorSysGenServerDescription"
                    type="textarea"
                    :rows="4"
                    placeholder="请输入服务器描述信息"
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
        <div class="footer-left">
          <el-button
            v-if="mode === 'edit'"
            type="success"
            :loading="testLoading"
            @click="handleTest"
            plain
          >
            <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />
            测试连接
          </el-button>
        </div>
        <div class="footer-right">
          <el-button
            @click="visible = false"
          >
            <IconifyIconOnline icon="ri:close-line" class="mr-1" />
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleSubmit"
          >
            <IconifyIconOnline
              :icon="mode === 'add' ? 'ri:add-line' : 'ri:save-line'"
              class="mr-1"
            />
            {{ mode === 'add' ? '新增' : '保存' }}
          </el-button>
        </div>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from "vue";
import { message } from "@repo/utils";
import {
  saveServer,
  updateServer,
  testServerConnection,
  type ServerDisplayData,
  mapDisplayDataToSaveParams
} from "@/api/monitor/gen/server";

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
const setData = (data: ServerDisplayData | any) => {
  if (data && Object.keys(data).length > 0) {
    // 如果是ServerDisplayData类型，需要映射到表单字段
    if ('name' in data && 'host' in data) {
      // 这是ServerDisplayData类型，需要映射
      Object.assign(formData, {
        monitorSysGenServerId: data.id,
        monitorSysGenServerName: data.name,
        monitorSysGenServerHost: data.host,
        monitorSysGenServerPort: data.port,
        monitorSysGenServerProtocol: data.protocol,
        monitorSysGenServerUsername: data.username,
        monitorSysGenServerGroup: data.group,
        monitorSysGenServerDescription: data.description,
        monitorSysGenServerMetricsSupport: data.metricsSupport,
        monitorSysGenServerTags: data.tags,
        monitorSysGenServerStatus: data.status,
        monitorSysGenServerMonitorEnabled: 1, // 默认启用监控
      });
    } else {
      // 直接赋值（兼容原有的后台数据格式）
      Object.assign(formData, data);
    }
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
    const res = mode.value === "add" ? await saveServer(formData) : await updateServer(formData);

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
// 对话框整体样式
.server-edit-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    overflow: hidden;
    max-height: 90vh;
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 0;
    height: calc(90vh - 140px); // 减去头部和底部的高度
    overflow: hidden; // 不显示滚动条
  }

  :deep(.el-dialog__footer) {
    padding: 16px 24px;
    border-top: 1px solid var(--el-border-color-lighter);
    background: linear-gradient(135deg, var(--el-fill-color-extra-light) 0%, var(--el-bg-color) 100%);
  }
}

// 自定义头部样式
.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-bg-color) 100%);

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .header-icon {
      font-size: 24px;
      color: var(--el-color-primary);
    }

    .dialog-title {
      font-size: 18px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0;
    }
  }

  .close-btn {
    padding: 8px;
    border-radius: 6px;
    transition: all 0.3s ease;

    &:hover {
      background-color: var(--el-color-danger-light-9);
      color: var(--el-color-danger);
    }
  }
}

// 对话框内容区域
.dialog-content {
  padding: 20px 24px;
  height: 100%;
  overflow: hidden;
}

// 表单行布局
.form-row {
  height: 100%;
  margin: 0 !important;
}

// 表单列布局
.form-column {
  height: 100%;
  padding: 0 12px !important;

  &:first-child {
    padding-left: 0 !important;
  }

  &:last-child {
    padding-right: 0 !important;
  }
}

// 表单样式
.server-form {
  height: 100%;

  :deep(.el-form-item) {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
    font-size: 13px;
    line-height: 1.4;
    padding-bottom: 4px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
    }
  }

  :deep(.el-select .el-input__wrapper) {
    &:hover {
      box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
    }
  }

  :deep(.el-textarea__inner) {
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover {
      border-color: var(--el-color-primary-light-7);
    }
  }

  :deep(.el-input-number) {
    width: 100%;

    .el-input__wrapper {
      border-radius: 8px;
    }
  }
}

// 表单分组样式
.form-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-fill-color-extra-light) 100%);
  border-radius: 12px;
  border: 1px solid var(--el-border-color-lighter);
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;

    .section-icon {
      font-size: 18px;
      color: var(--el-color-primary);
      padding: 4px;
      background: var(--el-color-primary-light-9);
      border-radius: 6px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .section-content {
    flex: 1;
    overflow-y: auto;
    padding-right: 4px;

    /* 自定义滚动条 */
    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-track {
      background: var(--el-fill-color-extra-light);
      border-radius: 2px;
    }

    &::-webkit-scrollbar-thumb {
      background: var(--el-border-color-dark);
      border-radius: 2px;

      &:hover {
        background: var(--el-color-primary-light-5);
      }
    }
  }
}

// 协议选项样式
.protocol-option,
.auth-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .iconify {
    font-size: 16px;
    color: var(--el-color-primary);
  }
}

// 开关包装器
.switch-wrapper {
  display: flex;
  align-items: center;
  height: 40px;
}

// 底部按钮区域
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 24px !important;

  .footer-left {
    flex: 1;
  }

  .footer-right {
    display: flex;
    gap: 12px;
  }

  .el-button {
    border-radius: 10px;
    font-weight: 500;
    transition: all 0.3s ease;
    padding: 10px 20px;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &.el-button--primary {
      background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-dark-2) 100%);
      border: none;

      &:hover {
        background: linear-gradient(135deg, var(--el-color-primary-light-3) 0%, var(--el-color-primary) 100%);
      }
    }

    &.el-button--success {
      &.is-plain {
        &:hover {
          background-color: var(--el-color-success);
          border-color: var(--el-color-success);
          color: white;
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 1400px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
    }
  }
}

@media (max-width: 1200px) {
  .form-row {
    flex-direction: column;
    height: auto;
  }

  .form-column {
    height: auto;
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .server-edit-dialog {
    :deep(.el-dialog__body) {
      height: auto;
      max-height: 70vh;
      overflow-y: auto;
    }
  }

  .dialog-content {
    height: auto;
    overflow: visible;
  }

  .form-section {
    height: auto;

    .section-content {
      overflow: visible;
    }
  }
}

@media (max-width: 768px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 95% !important;
      margin: 2vh auto;
      top: 2vh !important;
    }

    :deep(.el-dialog__body) {
      height: auto;
      max-height: 75vh;
      overflow-y: auto;
    }
  }

  .dialog-content {
    padding: 16px;
    height: auto;
  }

  .dialog-footer {
    flex-direction: column;
    gap: 12px;
    padding: 16px !important;

    .footer-left,
    .footer-right {
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .footer-right {
      flex-direction: row-reverse;
    }
  }

  .form-section {
    .section-header {
      .section-title {
        font-size: 13px;
      }
    }
  }

  .server-form {
    :deep(.el-form-item__label) {
      font-size: 12px;
    }
  }
}

@media (max-width: 480px) {
  .server-edit-dialog {
    :deep(.el-dialog) {
      width: 98% !important;
      margin: 1vh auto;
      top: 1vh !important;
    }
  }

  .dialog-content {
    padding: 12px;
  }

  .dialog-footer {
    padding: 12px !important;

    .el-button {
      padding: 8px 16px;
      font-size: 13px;
    }
  }
}

// 动画效果
.server-edit-dialog {
  :deep(.el-dialog) {
    animation: dialogSlideIn 0.3s ease-out;
  }
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

// 表单项动画
.form-section {
  animation: sectionFadeIn 0.4s ease-out;
}

@keyframes sectionFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
