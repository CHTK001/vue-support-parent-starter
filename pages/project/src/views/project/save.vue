<template>
  <ScDialog
    v-model="visible"
    :title="isEdit ? '编辑项目' : '新建项目'"
    width="640px"
    destroy-on-close
    :close-on-click-modal="false"
    layout="simple"
  >
    <ScForm
      ref="formRef"
      :model="form"
      :rules="rules"
      label-position="top"
      class="proj-form"
    >
      <!-- ── 基本信息 ── -->
      <div class="form-section-title">基本信息</div>

      <ScFormItem label="项目名称" prop="projectName" required>
        <ScInput v-model="form.projectName" placeholder="请输入项目名称" clearable maxlength="100" />
      </ScFormItem>

      <ScFormItem label="项目描述" prop="projectDescription">
        <ScInput
          v-model="form.projectDescription"
          type="textarea"
          :rows="2"
          placeholder="请输入项目描述（可选）"
          maxlength="500"
          show-word-limit
        />
      </ScFormItem>

      <div class="form-row-2">
        <ScFormItem label="项目图标 URL" prop="projectIcon">
          <ScInput v-model="form.projectIcon" placeholder="https://..." clearable />
        </ScFormItem>
        <ScFormItem label="排序" prop="sortOrder">
          <ScInputNumber v-model="form.sortOrder" :min="0" :max="9999" style="width:100%" />
        </ScFormItem>
      </div>

      <ScFormItem label="状态" prop="status">
        <ScSwitch
          v-model="form.status"
          layout="modern"
          :active-value="1"
          :inactive-value="0"
          active-text="启用"
          inactive-text="禁用"
          :active-icon="useRenderIcon('ri:checkbox-circle-line')"
          :inactive-icon="useRenderIcon('ri:close-circle-line')"
        />
      </ScFormItem>

      <!-- ── 服务器信息（Nginx 嵌入模式完全隐藏） ── -->
      <template v-if="!nginxMode">
        <div class="form-section-title" style="margin-top:8px">
          服务器信息
          <ScSwitch
            v-model="serverEnabled"
            layout="modern"
            active-text="已激活"
            inactive-text="未激活"
            style="margin-left:12px"
          />
        </div>

        <template v-if="serverEnabled">
          <div class="form-row-2">
            <ScFormItem label="连接类型" prop="serverType">
              <ScSelect v-model="form.serverType" placeholder="请选择">
                <ScOption value="SSH" label="SSH" />
                <ScOption value="WINRM" label="WinRM" />
                <ScOption value="LOCAL" label="本机 (LOCAL)" />
              </ScSelect>
            </ScFormItem>
            <ScFormItem label="操作系统" prop="serverOs">
              <ScSelect v-model="form.serverOs" placeholder="请选择">
                <ScOption value="linux" label="Linux" />
                <ScOption value="windows" label="Windows" />
                <ScOption value="macos" label="macOS" />
                <ScOption value="unknown" label="未知" />
              </ScSelect>
            </ScFormItem>
          </div>

          <template v-if="form.serverType !== 'LOCAL'">
            <div class="form-row-2">
              <ScFormItem label="主机地址" prop="serverHost">
                <ScInput v-model="(form as any).serverHost" placeholder="如 192.168.1.100" clearable />
              </ScFormItem>
              <ScFormItem label="端口" prop="serverPort">
                <ScInputNumber
                  v-model="(form as any).serverPort"
                  :min="1" :max="65535"
                  :placeholder="form.serverType === 'WINRM' ? '5985' : '22'"
                  style="width:100%"
                />
              </ScFormItem>
            </div>

            <div class="form-row-2">
              <ScFormItem label="用户名" prop="serverUsername">
                <ScInput v-model="(form as any).serverUsername" placeholder="如 root" clearable />
              </ScFormItem>
              <ScFormItem label="密码" prop="serverPassword">
                <ScInput v-model="(form as any).serverPassword" type="password" placeholder="连接密码" show-password />
              </ScFormItem>
            </div>

            <ScFormItem v-if="form.serverType === 'SSH'" label="SSH 私钥" prop="serverPrivateKey">
              <ScInput
                v-model="(form as any).serverPrivateKey"
                type="textarea"
                :rows="3"
                placeholder="粘贴 SSH 私钥内容（可选）"
              />
            </ScFormItem>
          </template>

          <div class="form-row-2">
            <ScFormItem label="连接超时（秒）" prop="serverConnectTimeout">
              <ScInputNumber v-model="(form as any).serverConnectTimeout" :min="5" :max="300" style="width:100%" />
            </ScFormItem>
            <ScFormItem label="日志路径" prop="logPath">
              <ScInput v-model="(form as any).logPath" placeholder="/opt/app/logs/app.log" clearable />
            </ScFormItem>
          </div>

          <div class="form-row-2">
            <ScFormItem label="配置路径" prop="configPath">
              <ScInput v-model="(form as any).configPath" placeholder="/opt/app/conf" clearable />
            </ScFormItem>
            <ScFormItem label="依赖路径" prop="libPath">
              <ScInput v-model="(form as any).libPath" placeholder="/opt/app/lib" clearable />
            </ScFormItem>
          </div>
        </template>
      </template>
    </ScForm>

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" :loading="saving" @click="handleSubmit">
        {{ isEdit ? "保存" : "创建" }}
      </ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { reactive, ref } from "vue";
import { message } from "@repo/utils";
import { useRenderIcon } from "@repo/components/ReIcon";
import ScSwitch from "@repo/components/ScSwitch/index.vue";
import type { SysProject } from "../../api/manage/project";
import { fetchSaveProject, fetchUpdateProject } from "../../api/manage/project";

const emit = defineEmits<{ refresh: [] }>();

const visible = ref(false);
const saving = ref(false);
const formRef = ref();
const isEdit = ref(false);
const serverEnabled = ref(false);
const nginxMode = ref(false);

const form = reactive<Partial<SysProject> & Record<string, any>>({
  projectName: "",
  projectDescription: "",
  projectIcon: "",
  serverOs: "unknown",
  sortOrder: 0,
  status: 1,
  serverType: "SSH",
  serverConnectTimeout: 30,
});

const rules = {
  projectName: [{ required: true, message: "项目名称不能为空", trigger: "blur" }],
};

const open = (
  mode: "add" | "edit",
  data?: SysProject,
  nginxDefaults?: { host?: string; port?: number; username?: string; password?: string; privateKey?: string },
) => {
  isEdit.value = mode === "edit";
  nginxMode.value = !!nginxDefaults;
  serverEnabled.value = data?.serverEnabled === 1;

  Object.assign(form, {
    projectName: "",
    projectDescription: "",
    projectIcon: "",
    serverOs: "unknown",
    sortOrder: 0,
    status: 1,
    serverType: "SSH",
    serverConnectTimeout: 30,
    ...data,
    ...(nginxDefaults ? {
      serverType: "SSH",
      serverOs: "linux",
      serverHost: nginxDefaults.host,
      serverPort: nginxDefaults.port ?? 22,
      serverUsername: nginxDefaults.username,
      serverPassword: nginxDefaults.password,
      serverPrivateKey: nginxDefaults.privateKey,
    } : {}),
  });
  visible.value = true;
};

const handleSubmit = async () => {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    const payload = {
      ...form,
      serverEnabled: (serverEnabled.value || nginxMode.value) ? 1 : 0,
    };
    const res = isEdit.value
      ? await fetchUpdateProject(payload)
      : await fetchSaveProject(payload);
    if (res.code === "00000") {
      message(isEdit.value ? "项目已更新" : "项目已创建", { type: "success" });
      visible.value = false;
      emit("refresh");
    } else {
      message(res.message || "操作失败", { type: "error" });
    }
  } finally {
    saving.value = false;
  }
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.proj-form {
  padding: 4px 0;

  :deep(.el-form-item) {
    margin-bottom: 14px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: var(--el-text-color-regular);
    padding-bottom: 4px;
    line-height: 1.4;
  }

  :deep(.el-input__wrapper),
  :deep(.el-textarea__inner),
  :deep(.el-select__wrapper) {
    border-radius: 8px;
  }
}

.form-section-title {
  display: flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.form-row-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;
}
</style>
