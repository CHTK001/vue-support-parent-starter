<template>
  <ElDialog
    :model-value="visible"
    title="编辑配置"
    width="760px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    @open="initForm"
  >
    <ElForm
      ref="formRef"
      :model="form"
      label-width="100px"
      label-position="top"
    >
      <ElDivider border-style="dashed" content-position="left">
        基础配置
        <ElTag size="small" type="danger" style="margin-left: 8px">需重启</ElTag>
      </ElDivider>

      <ElFormItem label="软件名称">
        <ElInput v-model="form.softwareName" disabled />
      </ElFormItem>

      <ElFormItem
        label="安装路径"
        prop="installPath"
        :class="{ 'restart-required': true }"
      >
        <ElInput v-model="form.installPath" placeholder="/usr/local/xxx" />
        <div class="form-tip">
          <IconifyIconOnline icon="ep:warning" style="margin-right: 2px" />
          修改后需重启服务生效
        </div>
      </ElFormItem>

      <ElFormItem
        label="监听端口"
        prop="exposePorts"
        :class="{ 'restart-required': true }"
      >
        <ElInput v-model="form.exposePorts" placeholder="80,443" />
        <div class="form-tip">
          <IconifyIconOnline icon="ep:warning" style="margin-right: 2px" />
          多个端口用逗号分隔，修改后需重启服务生效
        </div>
      </ElFormItem>

      <ElFormItem
        label="软件版本"
        prop="softwareVersion"
        :class="{ 'reinstall-required': true }"
      >
        <ElInput v-model="form.softwareVersion" />
        <div class="form-tip">
          <IconifyIconOnline icon="ep:warning" style="margin-right: 2px" />
          修改版本需要重新安装软件
        </div>
      </ElFormItem>

      <template v-if="hasDynamicFields">
        <ElDivider border-style="dashed" content-position="left">
          软件配置
          <ElTag size="small" type="warning" style="margin-left: 8px">需重启</ElTag>
        </ElDivider>

        <ElFormItem
          v-for="field in configFieldDefs"
          :key="field.fieldKey"
          :label="field.fieldLabel"
          :prop="field.fieldKey"
          :required="field.requiredFlag"
          :class="{ 'restart-required': true }"
        >
          <ElInput
            v-if="field.componentType === 'input' || field.componentType === 'password'"
            v-model="dynamicValues[field.fieldKey]"
            :type="field.componentType === 'password' ? 'password' : 'text'"
            :placeholder="field.description || field.fieldLabel"
          />
          <ElInputNumber
            v-else-if="field.componentType === 'number'"
            v-model="dynamicValues[field.fieldKey]"
            :placeholder="field.description"
            style="width: 100%"
          />
          <ElSelect
            v-else-if="field.componentType === 'select'"
            v-model="dynamicValues[field.fieldKey]"
            :placeholder="field.description"
          >
            <ElOption
              v-for="opt in field.options || []"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </ElSelect>
          <ElSwitch
            v-else-if="field.componentType === 'switch'"
            v-model="dynamicValues[field.fieldKey]"
          />
          <div class="form-tip">{{ field.description }}</div>
        </ElFormItem>
      </template>

      <ElDivider border-style="dashed" content-position="left">
        服务参数
        <ElTag size="small" type="danger" style="margin-left: 8px">需重启</ElTag>
      </ElDivider>

      <ElFormItem
        label="服务端口"
        prop="servicePort"
        :class="{ 'restart-required': true }"
      >
        <ElInput v-model="form.servicePort" placeholder="服务绑定的端口" />
        <div class="form-tip">
          <IconifyIconOnline icon="ep:warning" style="margin-right: 2px" />
          修改后需重启服务生效
        </div>
      </ElFormItem>

      <ElFormItem
        label="服务名称"
        prop="serviceName"
        :class="{ 'restart-required': true }"
      >
        <ElInput v-model="form.serviceName" placeholder="systemd 服务名" />
        <div class="form-tip">systemd 或 init.d 中的服务名称，修改后需重启服务生效</div>
      </ElFormItem>

      <ElFormItem label="开机自启" prop="autoStart">
        <ElSwitch v-model="form.autoStart" />
        <div class="form-tip">
          <IconifyIconOnline icon="ep:check" style="color: var(--el-color-success); margin-right: 2px" />
          立即生效，无需重启
        </div>
      </ElFormItem>

      <!-- Docker Config Section -->
      <template v-if="installMode === 'DOCKER'">
        <ElDivider border-style="dashed" content-position="left">
          Docker 配置
          <ElTag size="small" type="danger" style="margin-left: 8px">需重启</ElTag>
        </ElDivider>

        <ElFormItem label="镜像名称" prop="dockerImage">
          <ElInput v-model="dockerImage" placeholder="如 mysql:8.0, nginx:latest" />
        </ElFormItem>

        <ElFormItem label="安装方式">
          <ElRadioGroup v-model="dockerMode">
            <ElRadio value="script">脚本</ElRadio>
            <ElRadio value="dockerfile">Dockerfile 模式</ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <template v-if="dockerMode === 'dockerfile'">
          <ElFormItem label="Dockerfile">
            <ElInput
              v-model="dockerfileContent"
              type="textarea"
              :rows="6"
              placeholder='FROM ubuntu:22.04&#10;RUN apt-get update&#10;CMD ["bash"]'
              style="font-family: monospace; font-size: 12px;"
            />
          </ElFormItem>
        </template>

        <ElFormItem label="端口映射">
          <div class="dynamic-list">
            <div v-for="(m, i) in dockerPortMappings" :key="i" class="dynamic-list-row">
              <ElInput v-model="m.hostPort" placeholder="主机端口" style="width:120px" type="number" />
              <span style="color:var(--el-text-color-secondary)">:</span>
              <ElInput v-model="m.containerPort" placeholder="容器端口" style="width:120px" type="number" />
              <ElButton size="small" type="danger" :icon="Delete" @click="dockerPortMappings.splice(i,1)" />
            </div>
            <ElButton size="small" @click="dockerPortMappings.push({hostPort: 0, containerPort: 0})">
              添加端口映射
            </ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="卷映射">
          <div class="dynamic-list">
            <div v-for="(m, i) in dockerVolumeMappings" :key="i" class="dynamic-list-row">
              <ElInput v-model="m.hostPath" placeholder="主机路径" style="width:160px" />
              <span style="color:var(--el-text-color-secondary)">:</span>
              <ElInput v-model="m.containerPath" placeholder="容器路径" style="width:160px" />
              <ElCheckbox v-model="m.readOnly" size="small">只读</ElCheckbox>
              <ElButton size="small" type="danger" :icon="Delete" @click="dockerVolumeMappings.splice(i,1)" />
            </div>
            <ElButton size="small" @click="dockerVolumeMappings.push({hostPath: '', containerPath: '', readOnly: false})">
              添加卷映射
            </ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="环境变量">
          <div class="dynamic-list">
            <div v-for="(e, i) in dockerEnvEntries" :key="i" class="dynamic-list-row">
              <ElInput v-model="e.key" placeholder="变量名" style="width:140px" />
              <span style="color:var(--el-text-color-secondary)">=</span>
              <ElInput v-model="e.value" placeholder="值" style="width:180px" />
              <ElButton size="small" type="danger" :icon="Delete" @click="dockerEnvEntries.splice(i,1)" />
            </div>
            <ElButton size="small" @click="dockerEnvEntries.push({key: '', value: ''})">
              添加环境变量
            </ElButton>
          </div>
        </ElFormItem>

        <ElFormItem label="网络">
          <ElInput v-model="dockerNetwork" placeholder="bridge, host, 或自定义网络名" />
        </ElFormItem>
      </template>

      <ElCollapse v-model="activeCollapse">
        <ElCollapseItem v-if="configTemplate" title="配置文件模板" name="configTemplate">
          <template #title>
            配置文件模板
            <ElTag size="small" type="info" style="margin-left: 8px">预览</ElTag>
          </template>
          <div style="margin-bottom: 8px; font-size: 12px; color: var(--el-text-color-secondary);">
            此模板用于生成软件配置文件，&lbrace;&lbrace; 字段名 &rbrace;&rbrace; 会被动态替换为上方填写的内容。
          </div>
          <ElInput
            :model-value="configTemplate"
            type="textarea"
            :rows="8"
            readonly
            style="margin-bottom: 8px; font-family: monospace; font-size: 12px;"
          />
          <ElButton size="small" type="primary" @click="previewConfig">
            <IconifyIconOnline icon="ep:view" style="margin-right: 4px" />
            预览配置文件
          </ElButton>
        </ElCollapseItem>
      </ElCollapse>
    </ElForm>

    <!-- Config Preview Dialog -->
    <ElDialog
      v-model="showConfigPreview"
      title="配置文件预览"
      width="700px"
      :close-on-click-modal="false"
      append-to-body
    >
      <div style="font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px;">
        此文件将写入服务器配置文件路径，请确认内容无误。
      </div>
      <ElInput
        :model-value="generatedConfig"
        type="textarea"
        :rows="16"
        readonly
        style="font-family: monospace; font-size: 12px;"
      />
      <template #footer>
        <ElButton @click="showConfigPreview = false">关闭</ElButton>
        <ElButton type="primary" @click="copyConfig">
          <IconifyIconOnline icon="ep:copy-document" style="margin-right: 4px" />
          复制内容
        </ElButton>
      </template>
    </ElDialog>

    <template #footer>
      <ElButton @click="$emit('update:visible', false)">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSaveAndRestart">
        保存并重启
      </ElButton>
      <ElButton
        v-if="hasReloadCapability"
        type="success"
        :loading="saving"
        @click="handleSaveAndReload"
      >
        保存并热重载
      </ElButton>
      <ElButton plain type="primary" :loading="saving" @click="handleSaveOnly">
        仅保存
      </ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from "vue";
import {
  ElButton,
  ElCheckbox,
  ElCollapse,
  ElCollapseItem,
  ElDialog,
  ElDivider,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTag,
} from "element-plus";
import { Delete } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import {
  fetchPresetList,
  getPresetModeConfigFields,
  normalizeDockerScriptMode,
  parseSoftwarePresetRemark,
  reconfigureBinding,
  updateBinding,
  type ConfigFieldDef,
  type DockerScriptMode,
  type SoftwareBinding,
} from "../../api/software";

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  saved: [binding: SoftwareBinding];
  "restart-requested": [binding: SoftwareBinding];
  "reload-requested": [binding: SoftwareBinding];
}>();

const formRef = ref<any>(null);
const saving = ref(false);
const activeCollapse = ref<string[]>([]);

const configFieldDefs = ref<ConfigFieldDef[]>([]);
const configTemplate = ref("");
const dynamicValues = ref<Record<string, any>>({});
const showConfigPreview = ref(false);
const generatedConfig = ref("");

// Docker config state
const installMode = computed(() => {
  if (!props.binding?.bindingRemark) return "SYSTEM";
  try {
    const remark = JSON.parse(props.binding.bindingRemark);
    return remark.installMode === "DOCKER" ? "DOCKER" : "SYSTEM";
  } catch {
    return "SYSTEM";
  }
});
const dockerImage = ref("");
const dockerMode = ref<DockerScriptMode>("script");
const dockerfileContent = ref("");
const dockerPortMappings = ref<{ hostPort: number; containerPort: number }[]>([]);
const dockerVolumeMappings = ref<{ hostPath: string; containerPath: string; readOnly: boolean }[]>([]);
const dockerEnvEntries = ref<{ key: string; value: string }[]>([]);
const dockerNetwork = ref("bridge");

const form = reactive({
  softwareName: "",
  installPath: "",
  exposePorts: "",
  softwareVersion: "",
  servicePort: "",
  serviceName: "",
  autoStart: false,
});

const hasDynamicFields = computed(() => configFieldDefs.value.length > 0);

const loadPresetConfig = async () => {
  const b = props.binding;
  if (!b) return;
  configFieldDefs.value = [];
  configTemplate.value = "";
  try {
    const res = await fetchPresetList({ presetStatus: 1, presetDelete: 0 });
    if (res.code === "00000" && res.data) {
      const match = res.data.find(
        (p) =>
          p.softwareCode === b.softwareCode &&
          p.softwareVersion === b.softwareVersion &&
          p.softwareName === b.softwareName,
      );
      if (match) {
        configFieldDefs.value = getPresetModeConfigFields(match, installMode.value);
        const parsed = parseSoftwarePresetRemark(match.presetRemark);
        if ((parsed as any).configTemplate) {
          configTemplate.value = (parsed as any).configTemplate;
        }
      }
    }
  } catch {
    /* fetch error, ignore */
  }
  if (b.bindingRemark) {
    try {
      const parsed = JSON.parse(b.bindingRemark);
      if (parsed.dynamicValues) {
        dynamicValues.value = { ...parsed.dynamicValues };
      }
    } catch {
      /* ignore */
    }
  }
};

const previewConfig = () => {
  if (!configTemplate.value) return;
  let result = configTemplate.value;
  for (const field of configFieldDefs.value) {
    const value = dynamicValues.value[field.fieldKey] ?? field.defaultValue ?? "";
    result = result.replace(new RegExp(`\\{\\{${field.fieldKey}\\}\\}`, "g"), String(value));
  }
  generatedConfig.value = result;
  showConfigPreview.value = true;
};

const copyConfig = async () => {
  try {
    await navigator.clipboard.writeText(generatedConfig.value);
    ElMessage.success("已复制到剪贴板");
  } catch {
    ElMessage.warning("复制失败，请手动复制");
  }
};

const hasReloadCapability = computed(() => {
  const code = props.binding?.softwareCode?.toLowerCase() || "";
  return ["nginx", "redis"].some((k) => code.includes(k));
});

const parseRemark = (remark: string | undefined | null): Record<string, any> => {
  if (!remark) return {};
  try {
    return JSON.parse(remark);
  } catch {
    return {};
  }
};

const initForm = () => {
  const b = props.binding;
  if (!b) return;
  const remark = parseRemark(b.bindingRemark);
  form.softwareName = b.softwareName || "";
  form.installPath = b.installPath || "";
  form.exposePorts = b.exposePorts || "";
  form.softwareVersion = b.softwareVersion || "";
  form.servicePort = remark.port || "";
  form.serviceName = remark.serviceName || "";
  form.autoStart = !!remark.autoStart;
  // Parse Docker config
  dockerImage.value = remark.dockerImage || "";
  dockerMode.value = normalizeDockerScriptMode(remark.dockerMode);
  dockerfileContent.value = remark.dockerfileContent || "";
  dockerPortMappings.value = remark.dockerPortMappings || [];
  dockerVolumeMappings.value = remark.dockerVolumeMappings || [];
  dockerNetwork.value = remark.dockerNetwork || "bridge";
  dockerEnvEntries.value = [];
  if (remark.dockerEnv) {
    for (const [k, v] of Object.entries(remark.dockerEnv)) {
      dockerEnvEntries.value.push({ key: k, value: String(v) });
    }
  }
  loadPresetConfig();
};

const buildRemark = (): string => {
  const remark = parseRemark(props.binding?.bindingRemark);
  remark.port = form.servicePort;
  remark.serviceName = form.serviceName;
  remark.autoStart = form.autoStart;
  if (!remark.dynamicValues) remark.dynamicValues = {};
  remark.dynamicValues = { ...dynamicValues.value };
  // Preserve Docker config
  remark.dockerImage = dockerImage.value;
  remark.dockerMode = dockerMode.value;
  remark.dockerfileContent = dockerfileContent.value;
  remark.dockerPortMappings = dockerPortMappings.value;
  remark.dockerVolumeMappings = dockerVolumeMappings.value;
  remark.dockerNetwork = dockerNetwork.value;
  const env: Record<string, string> = {};
  for (const entry of dockerEnvEntries.value) {
    if (entry.key?.trim()) {
      env[entry.key.trim()] = entry.value;
    }
  }
  remark.dockerEnv = env;
  remark.installMode = installMode.value;
  return JSON.stringify(remark);
};

const doSave = async (): Promise<SoftwareBinding | null> => {
  const b = props.binding;
  if (!b || !b.sysProjectContainerSoftwareBindingId) return null;
  saving.value = true;
  try {
    const nextBindingRemark = buildRemark();
    const res = await updateBinding({
      sysProjectContainerSoftwareBindingId: b.sysProjectContainerSoftwareBindingId,
      installPath: form.installPath,
      exposePorts: form.exposePorts,
      softwareVersion: form.softwareVersion,
      bindingRemark: nextBindingRemark,
    });
    if (res.code === "00000") {
      ElMessage.success("配置已保存");
      const updated: SoftwareBinding = {
        ...b,
        installPath: form.installPath,
        exposePorts: form.exposePorts,
        softwareVersion: form.softwareVersion,
        serviceName: form.serviceName,
        bindingRemark: nextBindingRemark,
      };
      return updated;
    } else {
      ElMessage.error(res.msg || "保存失败");
      return null;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "保存异常");
    return null;
  } finally {
    saving.value = false;
  }
};

const handleSaveOnly = async () => {
  const updated = await doSave();
  if (updated) {
    emit("saved", updated);
    emit("update:visible", false);
  }
};

const handleSaveAndRestart = async () => {
  const updated = await doSave();
  if (!updated) return;

  // If configTemplate exists, write config file to server via reconfigure API
  if (configTemplate.value && props.binding?.sysProjectContainerSoftwareBindingId) {
    try {
      const reconfigureRes = await reconfigureBinding({
        sysProjectContainerSoftwareBindingId: props.binding.sysProjectContainerSoftwareBindingId,
        configValues: { ...dynamicValues.value },
      });
      if (reconfigureRes.code === "00000" && reconfigureRes.data?.success) {
        ElMessage.success("配置文件已写入服务器");
      } else {
        ElMessage.warning("配置文件写入失败: " + (reconfigureRes.msg || "未知错误"));
      }
    } catch (err: any) {
      ElMessage.warning("配置文件写入异常，可手动重启: " + (err.message || ""));
    }
  }

  emit("saved", updated);
  emit("restart-requested", props.binding!);
  emit("update:visible", false);
};

const handleSaveAndReload = async () => {
  const updated = await doSave();
  if (updated) {
    emit("saved", updated);
    emit("reload-requested", props.binding!);
    emit("update:visible", false);
  }
};
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 2px;
}
/* ── Field change indicators ── */
:deep(.restart-required) .el-form-item__label::after {
  content: " ⚠需重启";
  font-size: 11px;
  color: var(--el-color-danger);
  font-weight: 400;
}
:deep(.reinstall-required) .el-form-item__label::after {
  content: " ⚠需重装";
  font-size: 11px;
  color: var(--el-color-danger);
  font-weight: 400;
}
.dynamic-list {
  width: 100%;
}
.dynamic-list-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
</style>
