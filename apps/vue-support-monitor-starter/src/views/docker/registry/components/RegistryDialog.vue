﻿﻿<template>
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑仓库' : '添加仓库'" width="600px" @closed="handleDialogClosed">
    <el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" @submit.prevent>
      <el-form-item label="仓库名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入仓库名称" clearable />
      </el-form-item>

      <el-form-item label="仓库类型" prop="type">
        <el-select v-model="formData.type" placeholder="请选择仓库类型" style="width: 100%" @change="handleTypeChange">
          <el-option v-for="type in registryTypes" :key="type.value" :label="type.label" :value="type.value">
            <div class="registry-type-option">
              <IconifyIconOnline :icon="type.icon" class="mr-2" />
              {{ type.label }}
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="仓库地址" prop="url">
        <el-input v-model="formData.url" placeholder="请输入仓库地址" clearable>
          <template #append>
            <el-button v-if="showTestButton" @click="testConnection" :loading="testLoading">
              <IconifyIconOnline icon="ri:test-tube-line" class="mr-1" />
              测试
            </el-button>
          </template>
        </el-input>
        <div class="form-hint">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          {{ getUrlHint(formData.type) }}
        </div>
      </el-form-item>

      <el-form-item label="命名空间" prop="namespace" v-if="showNamespace">
        <el-input v-model="formData.namespace" placeholder="请输入命名空间（可选）" clearable />
        <div class="form-hint">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          用于区分不同的项目或用户空间
        </div>
      </el-form-item>

      <!-- 认证信息 -->
      <el-divider content-position="left">
        <span class="divider-text">
          <IconifyIconOnline icon="ri:shield-user-line" class="mr-1" />
          认证信息（可选）
        </span>
      </el-divider>

      <el-form-item label="用户名" prop="username">
        <el-input v-model="formData.username" placeholder="请输入用户名（可选）" clearable />
      </el-form-item>

      <el-form-item label="密码" prop="password">
        <el-input v-model="formData.password" type="password" placeholder="请输入密码（可选）" show-password clearable />
      </el-form-item>

      <el-form-item label="邮箱" prop="email" v-if="showEmail">
        <el-input v-model="formData.email" placeholder="请输入邮箱（可选）" clearable />
      </el-form-item>

      <el-form-item label="描述" prop="description">
        <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入仓库描述（可选）" />
      </el-form-item>
    </el-form>

    <!-- 连接测试结果 -->
    <el-alert v-if="testResult" :type="testResult.success ? 'success' : 'error'" :title="testResult.message" show-icon :closable="false" class="mb-4" />

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleConfirm" :loading="confirmLoading">
          <IconifyIconOnline icon="ri:save-line" class="mr-1" />
          {{ isEdit ? "保存" : "创建" }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { registryApi as softRegistryApi, type SystemSoftRegistry } from "@/api/docker-management";
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
const isEdit = computed(() => !!props.registryData?.id);

// 表单数据
const formData = ref<SystemSoftRegistry>({
  name: "",
  type: "docker_hub",
  url: "",
  username: "",
  password: "",
  email: "",
  namespace: "",
  description: "",
});

// 仓库类型选项
const registryTypes = [
  {
    value: "docker_hub",
    label: "Docker Hub",
    icon: "ri:docker-line",
  },
  {
    value: "aliyun",
    label: "阿里云容器镜像服务",
    icon: "ri:cloud-line",
  },
  {
    value: "harbor",
    label: "Harbor私有仓库",
    icon: "ri:ship-line",
  },
  {
    value: "custom",
    label: "自定义仓库",
    icon: "ri:settings-3-line",
  },
];

// 表单验证规则
const formRules: Record<string, FormItemRule[]> = {
  name: [
    { required: true, message: "请输入仓库名称", trigger: "blur" },
    { min: 2, max: 50, message: "仓库名称长度在 2 到 50 个字符", trigger: "blur" },
  ],
  type: [{ required: true, message: "请选择仓库类型", trigger: "change" }],
  url: [
    { required: true, message: "请输入仓库地址", trigger: "blur" },
    { type: "url" as const, message: "请输入有效的URL地址", trigger: "blur" },
  ],
};

// 计算属性
const showNamespace = computed(() => {
  return ["aliyun", "harbor", "custom"].includes(formData.value.type || "");
});

const showEmail = computed(() => {
  return formData.value.type === "docker_hub";
});

// 是否显示测试按钮（仅在编辑模式下显示）
const showTestButton = computed(() => {
  return isEdit.value;
});

// 重置表单
const resetForm = () => {
  formData.value = {
    name: "",
    type: "docker_hub",
    url: "",
    username: "",
    password: "",
    email: "",
    namespace: "",
    description: "",
  };
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
  };

  if (defaultUrls[type] && !formData.value.url) {
    formData.value.url = defaultUrls[type];
  }

  // 清除测试结果
  testResult.value = null;
};

// 测试连接
const testConnection = async () => {
  if (!formData.value.url) {
    ElMessage.warning("请先输入仓库地址");
    return;
  }

  testLoading.value = true;
  testResult.value = null;

  try {
    const response = await softRegistryApi.testRegistryConnection({
      url: formData.value.url,
      username: formData.value.username,
      password: formData.value.password,
    });

    if (response.code === "00000" && response.data) {
      testResult.value = response.data;
      if (response.data.success) {
        ElMessage.success("连接测试成功");
      } else {
        ElMessage.error("连接测试失败");
      }
    } else {
      testResult.value = { success: false, message: "连接测试失败，请检查网络和配置" };
      ElMessage.error("连接测试失败");
    }
  } catch (error) {
    console.error("测试连接失败:", error);
    testResult.value = { success: false, message: "连接测试失败，请检查网络和配置" };
    ElMessage.error("连接测试失败");
  } finally {
    testLoading.value = false;
  }
};

// 确认按钮处理
const handleConfirm = async () => {
  try {
    await formRef.value?.validate();

    confirmLoading.value = true;

    if (isEdit.value) {
      // 编辑模式
      const response = await softRegistryApi.updateRegistry(formData.value.id!, formData.value);

      if (response.code === "00000") {
        ElMessage.success("更新成功");
        emit("success");
        dialogVisible.value = false;
      } else {
        ElMessage.error(response.msg || "更新失败");
      }
    } else {
      // 新建模式
      const response = await softRegistryApi.createRegistry(formData.value);

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
      formData.value = { ...newData };
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
.registry-type-option {
  display: flex;
  align-items: center;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: #6c757d;
  display: flex;
  align-items: center;
}

.divider-text {
  display: flex;
  align-items: center;
  color: #409eff;
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
