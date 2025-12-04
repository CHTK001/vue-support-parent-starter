﻿<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑仓库' : '添加仓库'"
    width="720px"
    class="registry-dialog"
    :close-on-click-modal="false"
    @closed="handleDialogClosed"
  >
    <div class="dialog-content">
      <!-- 仓库类型选择卡片 -->
      <div class="type-cards">
        <div
          v-for="type in registryTypes"
          :key="type.value"
          class="type-card"
          :class="{ active: formData.systemSoftRegistryType === type.value }"
          @click="selectType(type.value)"
        >
          <div class="type-icon" :style="{ background: type.gradient }">
            <IconifyIconOnline :icon="type.icon" />
          </div>
          <div class="type-name">{{ type.label }}</div>
        </div>
      </div>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-position="top"
        @submit.prevent
      >
        <!-- 基本信息 -->
        <div class="form-section">
          <div class="section-title">
            <IconifyIconOnline icon="ri:information-line" />
            基本信息
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="仓库名称" prop="systemSoftRegistryName">
                <el-input
                  v-model="formData.systemSoftRegistryName"
                  placeholder="输入仓库名称"
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:bookmark-line" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="仓库状态">
                <div class="status-switch">
                  <el-switch
                    v-model="formData.systemSoftRegistryStatus"
                    :active-value="1"
                    :inactive-value="0"
                    active-text="启用"
                    inactive-text="禁用"
                  />
                </div>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="仓库地址" prop="systemSoftRegistryUrl">
            <el-input
              v-model="formData.systemSoftRegistryUrl"
              placeholder="输入仓库地址"
              clearable
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:global-line" />
              </template>
              <template #append v-if="showTestButton">
                <el-button @click="testConnection" :loading="testLoading">
                  <IconifyIconOnline icon="ri:wifi-line" class="mr-1" />测试连接
                </el-button>
              </template>
            </el-input>
            <div class="url-hint">
              <IconifyIconOnline icon="ri:lightbulb-line" />
              {{ getUrlHint(formData.systemSoftRegistryType) }}
            </div>
          </el-form-item>
        </div>

        <!-- 认证信息 -->
        <div class="form-section">
          <div class="section-title">
            <IconifyIconOnline icon="ri:shield-user-line" />
            认证信息
            <span class="optional">（可选）</span>
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="用户名" prop="systemSoftRegistryUsername">
                <el-input
                  v-model="formData.systemSoftRegistryUsername"
                  placeholder="输入用户名"
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:user-line" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码" prop="systemSoftRegistryPassword">
                <el-input
                  v-model="formData.systemSoftRegistryPassword"
                  type="password"
                  placeholder="输入密码"
                  show-password
                  clearable
                >
                  <template #prefix>
                    <IconifyIconOnline icon="ri:lock-line" />
                  </template>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item
            label="邮箱"
            prop="systemSoftRegistryEmail"
            v-if="showEmail"
          >
            <el-input
              v-model="formData.systemSoftRegistryEmail"
              placeholder="输入邮箱"
              clearable
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:mail-line" />
              </template>
            </el-input>
          </el-form-item>
        </div>

        <!-- 高级设置 -->
        <div class="form-section">
          <div class="section-title">
            <IconifyIconOnline icon="ri:settings-3-line" />
            高级设置
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="支持同步">
                <div class="feature-toggle">
                  <el-switch
                    v-model="formData.systemSoftRegistrySupportSync"
                    :active-value="1"
                    :inactive-value="0"
                  />
                  <span class="toggle-text">{{
                    formData.systemSoftRegistrySupportSync === 1
                      ? "已启用"
                      : "已禁用"
                  }}</span>
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="仓库描述" prop="systemSoftRegistryDescription">
            <el-input
              v-model="formData.systemSoftRegistryDescription"
              type="textarea"
              :rows="2"
              placeholder="输入仓库描述..."
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
        </div>
      </el-form>

      <!-- 连接测试结果 -->
      <el-alert
        v-if="testResult"
        :type="testResult.success ? 'success' : 'error'"
        :title="testResult.message"
        show-icon
        :closable="false"
        class="test-result"
      />
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel" size="large">取消</el-button>
        <el-button
          type="primary"
          @click="handleConfirm"
          :loading="confirmLoading"
          size="large"
        >
          <IconifyIconOnline
            :icon="isEdit ? 'ri:save-line' : 'ri:add-line'"
            class="mr-1"
          />
          {{ isEdit ? "保存更改" : "创建仓库" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import {
  registryApi as softRegistryApi,
  type SystemSoftRegistry,
} from "@/api/docker";
import { ElMessage, FormItemRule } from "element-plus";
import { computed, nextTick, ref, watch } from "vue";

/**
 * 仓库编辑对话框组件
 * @author CH
 * @version 1.0.0
 * @since 2025-09-20
 */

// Props定义
interface Props {
  visible: boolean;
  registryData?: SystemSoftRegistry | null;
}

// Emits定义
interface Emits {
  (e: "update:visible", value: boolean): void;
  (e: "success"): void;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  registryData: null,
});

const emit = defineEmits<Emits>();

// 响应式数据
const formRef = ref();
const confirmLoading = ref(false);
const testLoading = ref(false);
const testResult = ref<{ success: boolean; message: string } | null>(null);

// 对话框显示状态
const dialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit("update:visible", value),
});

// 是否为编辑模式
const isEdit = computed(() => !!props.registryData?.systemSoftRegistryId);

// 表单数据
const formData = ref<SystemSoftRegistry>({
  systemSoftRegistryName: "",
  systemSoftRegistryType: "docker_hub",
  systemSoftRegistryUrl: "",
  systemSoftRegistryUsername: "",
  systemSoftRegistryPassword: "",
  systemSoftRegistryEmail: "",
  systemSoftRegistryStatus: 1,
  systemSoftRegistrySupportSync: 1,
  systemSoftRegistryDescription: "",
});

// 仓库类型选项
const registryTypes = [
  {
    value: "docker_hub",
    label: "Docker Hub",
    icon: "ri:docker-line",
    gradient: "linear-gradient(135deg, #2496ED 0%, #1a7bc9 100%)",
  },
  {
    value: "aliyun",
    label: "阿里云",
    icon: "ri:cloud-line",
    gradient: "linear-gradient(135deg, #FF6A00 0%, #e55a00 100%)",
  },
  {
    value: "harbor",
    label: "Harbor",
    icon: "ri:ship-line",
    gradient: "linear-gradient(135deg, #60B2FF 0%, #4a9ee6 100%)",
  },
  {
    value: "custom",
    label: "自定义",
    icon: "ri:settings-3-line",
    gradient: "linear-gradient(135deg, #67C23A 0%, #52a02e 100%)",
  },
];

// 选择仓库类型
const selectType = (type: string) => {
  formData.value.systemSoftRegistryType = type;
  handleTypeChange(type);
};

// 表单验证规则
const formRules: Record<string, FormItemRule[]> = {
  systemSoftRegistryName: [
    { required: true, message: "请输入仓库名称", trigger: "blur" },
    {
      min: 2,
      max: 50,
      message: "仓库名称长度在 2 到 50 个字符",
      trigger: "blur",
    },
  ],
  systemSoftRegistryType: [
    { required: true, message: "请选择仓库类型", trigger: "change" },
  ],
  systemSoftRegistryUrl: [
    { required: true, message: "请输入仓库地址", trigger: "blur" },
    { type: "url" as const, message: "请输入有效的URL地址", trigger: "blur" },
  ],
  systemSoftRegistryStatus: [
    { required: true, message: "请选择是否启用", trigger: "change" },
  ],
  systemSoftRegistrySupportSync: [
    { required: true, message: "请选择是否支持同步", trigger: "change" },
  ],
};

// 计算属性
const showEmail = computed(() => {
  return formData.value.systemSoftRegistryType === "docker_hub";
});

// 是否显示测试按钮（仅在编辑模式下显示）
const showTestButton = computed(() => {
  return isEdit.value;
});

// 重置表单
const resetForm = () => {
  formData.value = {
    systemSoftRegistryName: "",
    systemSoftRegistryType: "docker_hub",
    systemSoftRegistryUrl: "",
    systemSoftRegistryUsername: "",
    systemSoftRegistryPassword: "",
    systemSoftRegistryEmail: "",
    systemSoftRegistryStatus: 1,
    systemSoftRegistrySupportSync: 1,
    systemSoftRegistryDescription: "",
  } as any;
};

// 获取URL提示信息
const getUrlHint = (type?: string) => {
  const hints = {
    docker_hub: "示例: https://registry-1.docker.io",
    aliyun: "示例: https://registry.cn-hangzhou.aliyuncs.com",
    harbor: "示例: https://harbor.example.com",
    custom: "示例: https://registry.example.com",
  };
  return hints[type || "docker_hub"] || "请输入完整的仓库地址";
};

// 仓库类型改变处理
const handleTypeChange = (type: string) => {
  // 根据类型设置默认URL
  const defaultUrls = {
    docker_hub: "https://registry-1.docker.io",
    aliyun: "https://registry.cn-hangzhou.aliyuncs.com",
    harbor: "",
    custom: "",
  } as Record<string, string>;

  if (defaultUrls[type] && !formData.value.systemSoftRegistryUrl) {
    formData.value.systemSoftRegistryUrl = defaultUrls[type];
  }

  // 清除测试结果
  testResult.value = null;
};

// 测试连接
const testConnection = async () => {
  if (!props.registryData?.systemSoftRegistryId) {
    ElMessage.warning("请先保存后再测试连接");
    return;
  }
  testLoading.value = true;
  testResult.value = null;
  try {
    const response = await softRegistryApi.testRegistryConnection(
      props.registryData.systemSoftRegistryId
    );
    if (response.code === "00000") {
      testResult.value = { success: true, message: "已发起连接测试" };
      ElMessage.success("已发起连接测试");
    } else {
      testResult.value = {
        success: false,
        message: response.msg || "连接测试失败",
      };
      ElMessage.error(response.msg || "连接测试失败");
    }
  } catch (error) {
    console.error("测试连接失败:", error);
    testResult.value = {
      success: false,
      message: "连接测试失败，请检查网络和配置",
    };
    ElMessage.error("连接测试失败");
  } finally {
    testLoading.value = false;
  }
};

// 确认按钮处理
const handleConfirm = async () => {
  try {
    await formRef.value?.validate();

    // 组装提交载荷：不再绑定服务器
    const payload: any = { ...(formData.value as any) };

    confirmLoading.value = true;

    if (isEdit.value) {
      // 编辑模式
      const response = await softRegistryApi.updateRegistry(
        formData.value.systemSoftRegistryId!,
        payload
      );

      if (response.code === "00000") {
        ElMessage.success("更新成功");
        emit("success");
        dialogVisible.value = false;
      } else {
        ElMessage.error(response.msg || "更新失败");
      }
    } else {
      // 新建模式
      const response = await softRegistryApi.createRegistry(payload);

      if (response.code === "00000") {
        ElMessage.success("创建成功");
        emit("success");
        dialogVisible.value = false;
      } else {
        ElMessage.error(response.msg || "创建失败");
      }
    }
  } catch (error) {
    console.error("表单验证失败:", error);
  } finally {
    confirmLoading.value = false;
  }
};

// 取消按钮处理
const handleCancel = () => {
  dialogVisible.value = false;
};

// 对话框关闭处理
const handleDialogClosed = () => {
  resetForm();
  testResult.value = null;
  formRef.value?.clearValidate();
};

// 监听仓库数据变化
watch(
  () => props.registryData,
  (newData) => {
    if (newData) {
      // 编辑模式，填充数据
      formData.value = { ...(newData as any) };
      // 不再绑定服务器，忽略 serverId 相关历史数据
    } else {
      // 新建模式，重置表单
      resetForm();
    }
  },
  { immediate: true }
);

// 监听对话框显示状态
watch(dialogVisible, (visible) => {
  if (visible) {
    testResult.value = null;
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  }
});
</script>

<style scoped>
.dialog-content {
  padding: 0 4px;
}

/* 类型选择卡片 */
.type-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  margin-bottom: 16px;
}

.type-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 2px solid var(--el-border-color-lighter);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.type-card:hover {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-fill-color-lighter);
}

.type-card.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.type-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #fff;
  margin-bottom: 6px;
}

.type-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--app-text-primary);
}

/* 表单分区 */
.form-section {
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 12px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--app-text-primary);
  margin-bottom: 12px;
}

.section-title .optional {
  font-weight: 400;
  color: var(--app-text-tertiary);
  font-size: 12px;
}

/* URL提示 */
.url-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--app-text-tertiary);
}

/* 状态开关 */
.status-switch {
  height: 32px;
  display: flex;
  align-items: center;
}

.feature-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle-text {
  font-size: 13px;
  color: var(--app-text-secondary);
}

/* 测试结果 */
.test-result {
  margin-top: 16px;
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

/* 响应式 */
@media (max-width: 640px) {
  .type-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
