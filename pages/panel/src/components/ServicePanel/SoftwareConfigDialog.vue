<template>
  <ElDialog
    :model-value="visible"
    :title="(isDocker ? 'Docker 容器配置' : '编辑配置') + ' - ' + (binding?.softwareName || '')"
    width="760px"
    :close-on-click-modal="false"
    class="config-edit-dialog"
    @update:model-value="$emit('update:visible', $event)"
    @open="initForm"
  >
    <div class="config-header">
      <div class="config-icon">
        <SoftwareIcon
          :icon="binding?.softwareIcon"
          style="font-size: 36px; color: var(--el-color-primary)"
          fallback="ep:setting"
        />
      </div>
      <div class="config-header-info">
        <div class="config-title">{{ binding?.softwareName || '编辑配置' }}</div>
        <div class="config-version">v{{ binding?.softwareVersion || '-' }}
          <ElTag size="small" :type="isDocker ? 'primary' : 'default'" style="margin-left: 6px">
            {{ isDocker ? 'Docker' : '系统' }}
          </ElTag>
        </div>
      </div>
    </div>

    <!-- ──────────────── DOCKER MODE ──────────────── -->
    <template v-if="isDocker">
      <!-- Current config (read-only) -->
      <div class="section-header">
        <IconifyIconOnline icon="ep:info-filled" />
        当前容器配置
        <ElTag size="small" type="info">只读</ElTag>
      </div>

      <div class="ro-grid">
        <div class="ro-item">
          <span class="ro-label">镜像</span>
          <span class="ro-value">{{ dockerImage || '-' }}</span>
        </div>
        <div class="ro-item">
          <span class="ro-label">容器名称</span>
          <span class="ro-value">{{ form.serviceName || '-' }}</span>
        </div>
        <div class="ro-item">
          <span class="ro-label">网络</span>
          <span class="ro-value">{{ dockerNetwork || 'bridge' }}</span>
        </div>
        <div class="ro-item">
          <span class="ro-label">安装方式</span>
          <span class="ro-value">{{ dockerMode === 'dockerfile' ? 'Dockerfile 构建' : '脚本安装' }}</span>
        </div>
      </div>

      <ElCollapse v-model="activeCollapse" class="ro-collapse">
        <ElCollapseItem title="端口映射" name="ports">
          <template #title>
            端口映射 <ElTag size="small" style="margin-left:6px">{{ dockerPortMappings.length }}</ElTag>
          </template>
          <div v-if="dockerPortMappings.length === 0" class="ro-empty">无端口映射</div>
          <div v-else class="ro-table">
            <div class="ro-tr ro-th">
              <span>宿主机端口</span><span>容器端口</span>
            </div>
            <div v-for="(m, i) in dockerPortMappings" :key="i" class="ro-tr">
              <span>{{ m.hostPort }}</span><span>{{ m.containerPort }}</span>
            </div>
          </div>
        </ElCollapseItem>

        <ElCollapseItem title="卷挂载" name="volumes">
          <template #title>
            卷挂载 <ElTag size="small" style="margin-left:6px">{{ dockerVolumeMappings.length }}</ElTag>
          </template>
          <div v-if="dockerVolumeMappings.length === 0" class="ro-empty">无卷挂载</div>
          <div v-else class="ro-table">
            <div class="ro-tr ro-th">
              <span>宿主机路径</span><span>容器路径</span><span></span>
            </div>
            <div v-for="(m, i) in dockerVolumeMappings" :key="i" class="ro-tr">
              <span>{{ m.hostPath }}</span><span>{{ m.containerPath }}</span>
              <span v-if="m.readOnly" style="color:var(--el-color-info);font-size:11px">[只读]</span>
            </div>
          </div>
        </ElCollapseItem>

        <ElCollapseItem title="环境变量" name="env">
          <template #title>
            环境变量 <ElTag size="small" style="margin-left:6px">{{ dockerEnvEntries.length }}</ElTag>
          </template>
          <div v-if="dockerEnvEntries.length === 0" class="ro-empty">无环境变量</div>
          <div v-else class="ro-table">
            <div class="ro-tr ro-th">
              <span>KEY</span><span>VALUE</span>
            </div>
            <div v-for="(e, i) in dockerEnvEntries" :key="i" class="ro-tr">
              <span>{{ e.key }}</span><span>{{ e.value }}</span>
            </div>
          </div>
        </ElCollapseItem>
      </ElCollapse>

      <!-- Editable: docker-update fields -->
      <div class="section-header" style="margin-top:16px">
        <IconifyIconOnline icon="ep:set-up" />
        容器资源控制
        <ElTag size="small" type="success">立即生效</ElTag>
      </div>

      <div class="update-form">
        <div class="uf-row">
          <div class="uf-field">
            <label class="uf-label">CPU 限制</label>
            <ElInput v-model="updateForm.cpuCpus" placeholder="如 0,1（不填则不限制）" />
            <span class="uf-hint">CPU 核心绑定，如 "0"、"0,1"、"0-3"（留空不限制）</span>
          </div>
          <div class="uf-field">
            <label class="uf-label">内存限制</label>
            <ElInputNumber
              v-model="updateForm.memoryMB"
              :min="0"
              :max="1048576"
              style="width:100%"
              placeholder="0 为不限制"
            />
            <span class="uf-hint">单位 MB，如 512、1024</span>
          </div>
        </div>
        <div class="uf-row">
          <div class="uf-field">
            <label class="uf-label">重启策略</label>
            <ElSelect v-model="updateForm.restartPolicy" style="width:100%">
              <ElOption label="不自动重启" value="no" />
              <ElOption label="总是重启" value="always" />
              <ElOption label="失败时重启" value="on-failure" />
              <ElOption label="除非手动停止" value="unless-stopped" />
            </ElSelect>
          </div>
          <div class="uf-field">
            <label class="uf-label">最大重试次数</label>
            <ElInputNumber
              v-model="updateForm.maxRetries"
              :min="0"
              :max="100"
              style="width:100%"
              :disabled="updateForm.restartPolicy !== 'on-failure'"
            />
            <span class="uf-hint">仅重启策略为"失败时重启"生效</span>
          </div>
        </div>
      </div>

      <!-- Reinstall hint -->
      <ElAlert
        title="需要修改端口、环境变量、卷挂载？"
        type="warning"
        :closable="false"
        show-icon
        style="margin-top: 16px"
      >
        <template #default>
          <div style="font-size: 13px; line-height: 1.6">
            端口映射、环境变量、卷挂载等结构变更需要<strong>停止容器 → 删除 → 重建</strong>。请点击下方的<strong>"重装修改"</strong>按钮，系统会保留当前配置供您调整后重新部署。
          </div>
        </template>
      </ElAlert>
    </template>

    <!-- ──────────────── SYSTEM MODE ──────────────── -->
    <template v-else>
      <ElForm ref="formRef" :model="form" label-width="100px" label-position="top">
        <div class="section-header">
          <IconifyIconOnline icon="ep:setting" />
          基础配置
          <ElTag size="small" type="danger">需重启</ElTag>
        </div>

        <ElFormItem label="软件名称">
          <ElInput v-model="form.softwareName" disabled />
        </ElFormItem>
        <ElFormItem label="安装路径" prop="installPath" class="restart-required">
          <ElInput v-model="form.installPath" placeholder="/usr/local/xxx" />
          <div class="form-tip">
            <IconifyIconOnline icon="ep:warning" style="margin-right: 2px" />修改后需重启服务生效
          </div>
        </ElFormItem>
        <ElFormItem label="监听端口" prop="exposePorts" class="restart-required">
          <ElInput v-model="form.exposePorts" placeholder="80,443" />
          <div class="form-tip">
            <IconifyIconOnline icon="ep:warning" style="margin-right: 2px" />多个端口用逗号分隔
          </div>
        </ElFormItem>
        <ElFormItem label="软件版本" prop="softwareVersion" class="reinstall-required">
          <ElInput v-model="form.softwareVersion" />
          <div class="form-tip">修改版本需要重新安装软件</div>
        </ElFormItem>

        <template v-if="hasDynamicFields">
          <div class="section-header">
            <IconifyIconOnline icon="ep:document" />软件配置
            <ElTag size="small" type="warning">需重启</ElTag>
          </div>
          <ElFormItem
            v-for="field in configFieldDefs" :key="field.fieldKey"
            :label="field.fieldLabel" :prop="field.fieldKey" :required="field.requiredFlag"
            class="restart-required"
          >
            <ElInput
              v-if="field.componentType === 'input' || field.componentType === 'password'"
              v-model="dynamicValues[field.fieldKey]"
              :type="field.componentType === 'password' ? 'password' : 'text'"
              :placeholder="field.description || field.fieldLabel"
            />
            <ElInputNumber
              v-else-if="field.componentType === 'number'"
              v-model="dynamicValues[field.fieldKey]" :placeholder="field.description" style="width:100%"
            />
            <ElSelect
              v-else-if="field.componentType === 'select'"
              v-model="dynamicValues[field.fieldKey]" :placeholder="field.description"
            >
              <ElOption v-for="opt in field.options || []" :key="opt.value" :label="opt.label" :value="opt.value" />
            </ElSelect>
            <ElSwitch v-else-if="field.componentType === 'switch'" v-model="dynamicValues[field.fieldKey]" />
            <div class="form-tip">{{ field.description }}</div>
          </ElFormItem>
        </template>

        <div class="section-header">
          <IconifyIconOnline icon="ep:connection" />服务参数
          <ElTag size="small" type="danger">需重启</ElTag>
        </div>
        <ElFormItem label="服务端口" prop="servicePort" class="restart-required">
          <ElInput v-model="form.servicePort" placeholder="服务绑定的端口" />
        </ElFormItem>
        <ElFormItem label="服务名称" prop="serviceName" class="restart-required">
          <ElInput v-model="form.serviceName" placeholder="systemd 服务名" />
        </ElFormItem>
        <ElFormItem label="开机自启" prop="autoStart">
          <ElSwitch v-model="form.autoStart" />
        </ElFormItem>
      </ElForm>
    </template>

    <template #footer>
      <div class="config-footer">
        <ElButton @click="$emit('update:visible', false)">取消</ElButton>
        <div class="config-footer-right">
          <template v-if="isDocker">
            <ElButton type="primary" :loading="saving" @click="handleDockerUpdate">
              <IconifyIconOnline icon="ep:set-up" style="margin-right:4px" />
              保存资源设置
            </ElButton>
            <ElButton type="warning" @click="handleReinstall">
              <IconifyIconOnline icon="ep:refresh" style="margin-right:4px" />
              重装修改
            </ElButton>
          </template>
          <template v-else>
            <ElButton plain type="primary" :loading="saving" @click="handleSaveOnly">仅保存</ElButton>
            <ElButton v-if="hasReloadCapability" type="success" :loading="saving" @click="handleSaveAndReload">
              <IconifyIconOnline icon="ep:refresh" style="margin-right:4px" />保存并热重载
            </ElButton>
            <ElButton type="primary" :loading="saving" @click="handleSaveAndRestart">保存并重启</ElButton>
          </template>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  ElAlert, ElButton, ElCollapse, ElCollapseItem, ElDialog, ElForm, ElFormItem,
  ElInput, ElInputNumber, ElMessage, ElOption, ElSelect, ElSwitch, ElTag,
} from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import SoftwareIcon from "./SoftwareIcon.vue";
import {
  fetchPresetList, getPresetModeConfigFields, normalizeDockerScriptMode,
  parseSoftwarePresetRemark, reconfigureBinding, updateBinding,
  type ConfigFieldDef, type DockerScriptMode, type SoftwareBinding,
} from "../../api/software";

const props = defineProps<{
  visible: boolean;
  binding: SoftwareBinding | null;
  dockerApiHost?: string;
  dockerApiPort?: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  saved: [binding: SoftwareBinding];
  "restart-requested": [binding: SoftwareBinding];
  "reload-requested": [binding: SoftwareBinding];
  "reinstall": [binding: SoftwareBinding];
}>();

const formRef = ref<any>(null);
const saving = ref(false);
const activeCollapse = ref<string[]>([]);

const configFieldDefs = ref<ConfigFieldDef[]>([]);
const dynamicValues = ref<Record<string, any>>({});

const isDocker = computed(() => {
  if (!props.binding?.bindingRemark) return false;
  try {
    const remark = JSON.parse(props.binding.bindingRemark);
    return remark.installMode === "DOCKER";
  } catch { return false; }
});

// ── Docker read-only state ──
const dockerImage = ref("");
const dockerMode = ref<DockerScriptMode>("script");
const dockerPortMappings = ref<{ hostPort: number; containerPort: number }[]>([]);
const dockerVolumeMappings = ref<{ hostPath: string; containerPath: string; readOnly: boolean }[]>([]);
const dockerEnvEntries = ref<{ key: string; value: string }[]>([]);
const dockerNetwork = ref("bridge");

// ── Docker update form ──
const updateForm = reactive({
  cpuCpus: "",
  memoryMB: 0,
  restartPolicy: "always",
  maxRetries: 0,
});

// ── SYSTEM mode form ──
const form = reactive({
  softwareName: "", installPath: "", exposePorts: "", softwareVersion: "",
  servicePort: "", serviceName: "", autoStart: false,
});

const hasDynamicFields = computed(() => configFieldDefs.value.length > 0);
const hasReloadCapability = computed(() => {
  const code = props.binding?.softwareCode?.toLowerCase() || "";
  return ["nginx", "redis"].some((k) => code.includes(k));
});

// ── Init ──
const parseRemark = (remark: string | undefined | null): Record<string, any> => {
  if (!remark) return {};
  try { return JSON.parse(remark); } catch { return {}; }
};

const initForm = () => {
  const b = props.binding;
  if (!b) return;
  const remark = parseRemark(b.bindingRemark);
  form.softwareName = b.softwareName || "";

  if (isDocker.value) {
    // Read-only Docker config
    dockerImage.value = remark.dockerImage || "";
    dockerMode.value = normalizeDockerScriptMode(remark.dockerMode);
    dockerPortMappings.value = remark.dockerPortMappings || [];
    // 兼容旧数据：从 port 字符串解析端口映射
    if (dockerPortMappings.value.length === 0 && remark.port) {
      dockerPortMappings.value = String(remark.port).split(',').map((p: string) => {
        const trimmed = p.trim();
        if (trimmed.includes(':')) {
          const [host, container] = trimmed.split(':');
          return { hostPort: parseInt(host) || 0, containerPort: parseInt(container) || 0 };
        }
        const port = parseInt(trimmed) || 0;
        return { hostPort: port, containerPort: port };
      }).filter((m: any) => m.hostPort > 0 || m.containerPort > 0);
    }
    dockerVolumeMappings.value = remark.dockerVolumeMappings || [];
    dockerNetwork.value = remark.dockerNetwork || "bridge";
    dockerEnvEntries.value = [];
    if (remark.dockerEnv) {
      for (const [k, v] of Object.entries(remark.dockerEnv)) {
        dockerEnvEntries.value.push({ key: k, value: String(v) });
      }
    }

    // Editable update fields — preset from remark
    updateForm.cpuCpus = remark.cpuCpus || "";
    updateForm.memoryMB = remark.memoryMB || 0;
    updateForm.restartPolicy = remark.restartPolicy || "no";
    updateForm.maxRetries = remark.maxRetries || 0;
    form.serviceName = remark.dockerContainerName || remark.serviceName || b.softwareName || "";
  } else {
    // SYSTEM mode: keep existing behavior
    form.installPath = b.installPath || "";
    form.exposePorts = b.exposePorts || "";
    form.softwareVersion = b.softwareVersion || "";
    form.servicePort = remark.port || "";
    form.serviceName = remark.serviceName || "";
    form.autoStart = !!remark.autoStart;
    loadPresetConfig();
  }
};

const loadPresetConfig = async () => {
  const b = props.binding;
  if (!b) return;
  configFieldDefs.value = [];
  try {
    const res = await fetchPresetList({ presetStatus: 1, presetDelete: 0 });
    if (res.code === "00000" && res.data) {
      const match = res.data.find(
        (p) => p.softwareCode === b.softwareCode && p.softwareVersion === b.softwareVersion && p.softwareName === b.softwareName,
      );
      if (match) {
        configFieldDefs.value = getPresetModeConfigFields(match, "SYSTEM");
      }
    }
  } catch { /* ignore */ }
  if (b.bindingRemark) {
    try {
      const parsed = JSON.parse(b.bindingRemark);
      if (parsed.dynamicValues) dynamicValues.value = { ...parsed.dynamicValues };
    } catch { /* ignore */ }
  }
};

// ── Docker update handler ──
const handleDockerUpdate = async () => {
  const b = props.binding;
  if (!b) return;
  if (!props.dockerApiHost) {
    ElMessage.error("Docker API 地址未配置，请先在面板头部设置 Docker API 地址");
    return;
  }
  const remark = parseRemark(b.bindingRemark);
  const containerName = remark.dockerContainerName || remark.serviceName || b.serviceName || b.softwareName || "";
  if (!containerName) {
    ElMessage.error("无法解析容器名称");
    return;
  }
  saving.value = true;
  try {
    const { openDockerConnection, updateDockerContainer } = await import("../../api/docker");
    // 打开临时 Docker 连接
    const connRes = await openDockerConnection(
      props.dockerApiHost,
      parseInt(props.dockerApiPort || "2375"),
      "http",
    );
    if (connRes.code !== "00000" || !connRes.data) {
      ElMessage.error("无法连接 Docker API: " + (connRes.msg || "连接失败"));
      return;
    }
    const connId = connRes.data;
    // 调用 docker update
    const updateRes = await updateDockerContainer(connId, containerName, {
      cpuCpus: updateForm.cpuCpus || undefined,
      memoryBytes: updateForm.memoryMB > 0 ? updateForm.memoryMB * 1024 * 1024 : undefined,
      restartPolicy: updateForm.restartPolicy !== "no" ? updateForm.restartPolicy : undefined,
      maxRetries: updateForm.restartPolicy === "on-failure" ? updateForm.maxRetries : undefined,
    });
    if (updateRes.code === "00000") {
      ElMessage.success("容器资源配置已更新");
      emit("update:visible", false);
    } else {
      ElMessage.error(updateRes.msg || "更新失败");
    }
  } catch (err: any) {
    ElMessage.error(err.message || "更新异常");
  } finally {
    saving.value = false;
  }
};

// ── Reinstall handler ──
const handleReinstall = () => {
  if (!props.binding) return;
  emit("reinstall", props.binding);
  emit("update:visible", false);
};

// ── SYSTEM mode save handlers ──
const doSave = async (): Promise<SoftwareBinding | null> => {
  const b = props.binding;
  if (!b || !b.sysProjectContainerSoftwareBindingId) return null;
  saving.value = true;
  try {
    const remark = parseRemark(b.bindingRemark);
    remark.port = form.servicePort;
    remark.serviceName = form.serviceName;
    remark.autoStart = form.autoStart;
    remark.dynamicValues = { ...dynamicValues.value };
    const nextBindingRemark = JSON.stringify(remark);
    const res = await updateBinding({
      sysProjectContainerSoftwareBindingId: b.sysProjectContainerSoftwareBindingId,
      installPath: form.installPath,
      exposePorts: form.exposePorts,
      softwareVersion: form.softwareVersion,
      bindingRemark: nextBindingRemark,
    });
    if (res.code === "00000") {
      ElMessage.success("配置已保存");
      return { ...b, installPath: form.installPath, exposePorts: form.exposePorts, softwareVersion: form.softwareVersion, bindingRemark: nextBindingRemark };
    } else {
      ElMessage.error(res.msg || "保存失败");
      return null;
    }
  } catch (err: any) {
    ElMessage.error(err.message || "保存异常");
    return null;
  } finally { saving.value = false; }
};

const handleSaveOnly = async () => {
  const updated = await doSave();
  if (updated) { emit("saved", updated); emit("update:visible", false); }
};

const handleSaveAndRestart = async () => {
  const updated = await doSave();
  if (!updated) return;
  if (configFieldDefs.value.length > 0 && props.binding?.sysProjectContainerSoftwareBindingId) {
    try {
      const ret = await reconfigureBinding({ sysProjectContainerSoftwareBindingId: props.binding.sysProjectContainerSoftwareBindingId, configValues: { ...dynamicValues.value } });
      if (ret.code === "00000" && ret.data?.success) ElMessage.success("配置文件已写入服务器");
    } catch { /* ignore */ }
  }
  emit("saved", updated);
  emit("restart-requested", props.binding!);
  emit("update:visible", false);
};

const handleSaveAndReload = async () => {
  const updated = await doSave();
  if (updated) { emit("saved", updated); emit("reload-requested", props.binding!); emit("update:visible", false); }
};
</script>

<style scoped>
.config-edit-dialog { --el-dialog-width: 760px; }
.config-edit-dialog :deep(.el-dialog__body) { padding: 20px 24px !important; }
.config-edit-dialog :deep(.el-dialog__header) { display: none; }
.config-edit-dialog :deep(.el-dialog) { border-radius: var(--dt-radius-xl) !important; box-shadow: var(--dt-shadow-lg) !important; }

.config-header {
  display: flex; align-items: center; gap: 14px; margin-bottom: 20px;
}
.config-icon {
  width: 56px; height: 56px; border-radius: 14px;
  background: var(--el-color-primary-light-9);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.config-header-info { min-width: 0; }
.config-title { font-size: 17px; font-weight: 600; color: var(--el-text-color-primary); }
.config-version { font-size: 13px; color: var(--el-text-color-secondary); margin-top: 2px; }

.section-header {
  font-size: 14px; font-weight: 600; color: var(--el-text-color-primary);
  padding: 10px 0 6px; margin-bottom: 10px;
  border-bottom: 1px solid var(--dt-glass-border-light);
  display: flex; align-items: center; gap: 8px;
}

/* ── Read-only grid ── */
.ro-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;
}
.ro-item {
  display: flex; flex-direction: column; gap: 2px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--el-fill-color-lighter);
}
.ro-label { font-size: 11px; color: var(--el-text-color-secondary); }
.ro-value { font-size: 14px; font-weight: 500; color: var(--el-text-color-primary); word-break: break-all; }

.ro-collapse { margin-bottom: 4px; }
.ro-collapse :deep(.el-collapse-item__content) { padding-bottom: 8px; }
.ro-empty { font-size: 12px; color: var(--el-text-color-secondary); padding: 8px 0; }
.ro-table { width: 100%; font-size: 13px; }
.ro-tr { display: flex; gap: 12px; padding: 4px 0; border-bottom: 1px solid var(--el-border-color-extra-light); }
.ro-tr span { flex: 1; }
.ro-th { font-size: 11px; color: var(--el-text-color-secondary); font-weight: 600; }

/* ── Update form ── */
.update-form { display: flex; flex-direction: column; gap: 12px; }
.uf-row { display: flex; gap: 16px; }
.uf-field { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.uf-label { font-size: 13px; font-weight: 500; color: var(--el-text-color-primary); }
.uf-hint { font-size: 11px; color: var(--el-text-color-secondary); }

/* ── SYSTEM form ── */
.form-tip { font-size: 12px; color: var(--el-text-color-secondary); margin-top: 4px; display: flex; align-items: center; gap: 2px; }
:deep(.restart-required) .el-form-item__label::after { content: " ⚠需重启"; font-size: 11px; color: var(--el-color-danger); font-weight: 400; }
:deep(.reinstall-required) .el-form-item__label::after { content: " ⚠需重装"; font-size: 11px; color: var(--el-color-danger); font-weight: 400; }

/* ── Footer ── */
.config-footer { display: flex; align-items: center; justify-content: space-between; width: 100%; }
.config-footer-right { display: flex; align-items: center; gap: 8px; }
</style>
