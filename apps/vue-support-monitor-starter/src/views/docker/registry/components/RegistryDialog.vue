﻿﻿<template>
  <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑仓库' : '添加仓库'" width="600px" @closed="handleDialogClosed">
<el-form ref="formRef" :model="formData" :rules="formRules" label-width="100px" @submit.prevent>
      <el-form-item label="仓库名称" prop="systemSoftRegistryName">
        <el-input v-model="formData.systemSoftRegistryName" placeholder="请输入仓库名称" clearable />
      </el-form-item>

      <el-form-item label="仓库类型" prop="systemSoftRegistryType">
        <el-select v-model="formData.systemSoftRegistryType" placeholder="请选择仓库类型" style="width: 100%" @change="handleTypeChange">
          <el-option v-for="type in registryTypes" :key="type.value" :label="type.label" :value="type.value">
            <div class="registry-type-option">
              <IconifyIconOnline :icon="type.icon" class="mr-2" />
              {{ type.label }}
            </div>
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="仓库地址" prop="systemSoftRegistryUrl">
        <el-input v-model="formData.systemSoftRegistryUrl" placeholder="请输入仓库地址" clearable>
          <template #append>
            <el-button v-if="showTestButton" @click="testConnection" :loading="testLoading">
              <IconifyIconOnline icon="ri:test-tube-line" class="mr-1" />
              测试
            </el-button>
          </template>
        </el-input>
        <div class="form-hint">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          {{ getUrlHint(formData.systemSoftRegistryType) }}
        </div>
      </el-form-item>

      <!-- 选择服务器 -->
      <el-form-item label="目标服务器" prop="serverId">
        <el-select
          v-model="selectedServerId"
          clearable
          filterable
          placeholder="请选择该仓库所在的服务器"
          style="width: 100%"
        >
          <el-option
            v-for="srv in serverOptions"
            :key="srv.id"
            :label="srv.name + (srv.host ? ` (${srv.host})` : '')"
            :value="srv.id"
          />
        </el-select>
        <div class="form-hint">
          <IconifyIconOnline icon="ri:information-line" class="mr-1" />
          必选：选择仓库所在的服务器。
        </div>
      </el-form-item>

      <!-- 认证信息 -->
      <el-divider content-position="left">
        <span class="divider-text">
          <IconifyIconOnline icon="ri:shield-user-line" class="mr-1" />
          认证信息（可选）
        </span>
      </el-divider>

      <el-form-item label="用户名" prop="systemSoftRegistryUsername">
        <el-input v-model="formData.systemSoftRegistryUsername" placeholder="请输入用户名（可选）" clearable />
      </el-form-item>

      <el-form-item label="密码" prop="systemSoftRegistryPassword">
        <el-input v-model="formData.systemSoftRegistryPassword" type="password" placeholder="请输入密码（可选）" show-password clearable />
      </el-form-item>

      <el-form-item label="邮箱" prop="systemSoftRegistryEmail" v-if="showEmail">
        <el-input v-model="formData.systemSoftRegistryEmail" placeholder="请输入邮箱（可选）" clearable />
      </el-form-item>

      <el-form-item label="启用" prop="systemSoftRegistryStatus">
        <el-switch v-model="formData.systemSoftRegistryStatus" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="支持同步" prop="systemSoftRegistrySupportSync">
        <el-switch v-model="formData.systemSoftRegistrySupportSync" :active-value="1" :inactive-value="0" />
      </el-form-item>

      <el-form-item label="描述" prop="systemSoftRegistryDescription">
        <el-input v-model="formData.systemSoftRegistryDescription" type="textarea" :rows="3" placeholder="请输入仓库描述（可选）" />
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
import { getServerPageList } from "@/api/server";
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

// 服务器选择
const serverOptions = ref<Array<{ id: number; name: string; host?: string }>>([]);
const selectedServerId = ref<number | null>(null);

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
  systemSoftRegistryName: [
    { required: true, message: "请输入仓库名称", trigger: "blur" },
    { min: 2, max: 50, message: "仓库名称长度在 2 到 50 个字符", trigger: "blur" },
  ],
  systemSoftRegistryType: [{ required: true, message: "请选择仓库类型", trigger: "change" }],
  systemSoftRegistryUrl: [
    { required: true, message: "请输入仓库地址", trigger: "blur" },
    { type: "url" as const, message: "请输入有效的URL地址", trigger: "blur" },
  ],
  // 服务器必选校验（校验单选 serverId）
  serverId: [
    {
      validator: (_rule: any, _value: any, callback: (err?: Error) => void) => {
        if (!selectedServerId.value) {
          return callback(new Error("请选择服务器"));
        }
        callback();
      },
      trigger: "change",
    },
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
  selectedServerId.value = null;
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
    const response = await softRegistryApi.testRegistryConnection(props.registryData.systemSoftRegistryId);
    if (response.code === "00000") {
      testResult.value = { success: true, message: "已发起连接测试" };
      ElMessage.success("已发起连接测试");
    } else {
      testResult.value = { success: false, message: response.msg || "连接测试失败" };
      ElMessage.error(response.msg || "连接测试失败");
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
    // 额外兜底校验：服务器必选
    if (!selectedServerId.value) {
      return ElMessage.error("请选择服务器");
    }

    await formRef.value?.validate();

    // 组装提交载荷：写入多种后端可能字段以兼容
    const payload: any = { ...(formData.value as any) };
    payload.serverId = selectedServerId.value;
    payload.systemSoftRegistryServerId = selectedServerId.value;
    payload.monitorSysGenServerId = selectedServerId.value;

    // 同时保留在 config 中（兼容旧实现）
    try {
      const existing = formData.value.systemSoftRegistryConfig ? JSON.parse(formData.value.systemSoftRegistryConfig) : {};
      payload.systemSoftRegistryConfig = JSON.stringify({ ...existing, serverId: selectedServerId.value });
    } catch {
      payload.systemSoftRegistryConfig = JSON.stringify({ serverId: selectedServerId.value });
    }

    confirmLoading.value = true;

    if (isEdit.value) {
      // 编辑模式
      const response = await softRegistryApi.updateRegistry(formData.value.systemSoftRegistryId!, payload);

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
      // 优先读取直传字段
      const sid = (newData as any).serverId || (newData as any).systemSoftRegistryServerId || (newData as any).monitorSysGenServerId;
      if (sid) {
        selectedServerId.value = Number(sid);
      } else {
        // 解析 config 中的 serverId
        try {
          const cfg = newData.systemSoftRegistryConfig ? JSON.parse(newData.systemSoftRegistryConfig) : {} as any;
          selectedServerId.value = cfg.serverId ? Number(cfg.serverId) : null;
        } catch {
          selectedServerId.value = null;
        }
      }
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
    // 加载服务器列表
    loadServers();
    nextTick(() => {
      formRef.value?.clearValidate();
    });
  }
});

// 加载服务器列表
const loadServers = async () => {
  try {
    const res = await getServerPageList({ page: 1, pageSize: 1000 });
    if (res.code === "00000") {
      const records = (res.data?.records || []) as any[];
      serverOptions.value = records.map((it) => ({ id: it.monitorSysGenServerId, name: it.monitorSysGenServerName, host: it.monitorSysGenServerHost }));
    }
  } catch (e) {
    // 忽略错误，避免阻断编辑
  }
};
</script>

<style scoped>
.registry-type-option {
  display: flex;
  align-items: center;
}

.form-hint {
  margin-top: 4px;
  font-size: 12px;
  color: var(--app-text-secondary);
  display: flex;
  align-items: center;
}

.divider-text {
  display: flex;
  align-items: center;
  color: var(--app-primary);
  font-weight: 500;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
