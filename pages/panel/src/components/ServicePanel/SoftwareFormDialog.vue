<template>
  <ElDialog
    v-model="dialogVisible"
    :title="isEdit ? '编辑软件' : '新增软件'"
    width="980px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <ElTabs v-model="activeTab" type="border-card">
      <ElTabPane label="基础设置" name="basic">
        <ElForm :model="form" label-width="120px" label-position="top">
          <ElRow :gutter="16">
            <ElCol :span="12">
              <ElFormItem label="软件名称" :required="true">
                <ElInput v-model="form.softwareName" placeholder="如：MySQL" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="软件编码" :required="true">
                <ElInput v-model="form.softwareCode" placeholder="如：mysql" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="12">
              <ElFormItem label="System 服务名默认值" :required="true">
                <ElInput
                  v-model="form.serviceName"
                  placeholder="如：mysql / nginx"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="Docker 镜像名默认值">
                <ElInput
                  v-model="dockerDefaults.image"
                  placeholder="如：mysql:8.0 / nginx:latest"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="8">
              <ElFormItem label="版本">
                <ElInput v-model="form.softwareVersion" placeholder="如：8.0" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="分类">
                <ElSelect
                  v-model="form.softwareCategory"
                  placeholder="选择分类"
                  allow-create
                  filterable
                >
                  <ElOption label="数据库" value="database" />
                  <ElOption label="中间件" value="middleware" />
                  <ElOption label="开发语言" value="language" />
                  <ElOption label="运维工具" value="devops" />
                  <ElOption label="远程桌面" value="remote" />
                  <ElOption label="Web 服务" value="webserver" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="类型">
                <ElSelect v-model="form.presetType" placeholder="选择类型">
                  <ElOption label="应用软件（完整生命周期）" value="SOFTWARE" />
                  <ElOption label="环境引擎（仅安装/卸载/检测）" value="ENVIRONMENT" />
                  <ElOption label="Dockerfile构建（仅安装）" value="DOCKERFILE" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
            <ElCol :span="8">
              <ElFormItem label="操作系统">
                <ElSelect
                  v-model="form.osType"
                  placeholder="选择系统"
                  allow-create
                  filterable
                >
                  <ElOption label="Linux" value="linux" />
                  <ElOption label="Windows" value="windows" />
                  <ElOption label="macOS" value="macos" />
                  <ElOption label="跨平台" value="cross" />
                </ElSelect>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="16">
            <ElCol :span="12">
              <ElFormItem label="图标">
                <ElInput v-model="form.softwareIcon" placeholder="图标名称或URL" />
              </ElFormItem>
            </ElCol>
            <ElCol :span="12">
              <ElFormItem label="厂商">
                <ElInput v-model="form.softwareVendor" placeholder="可选" />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElFormItem label="默认安装路径">
            <ElInput v-model="form.installPath" placeholder="如：/usr/local/mysql" />
          </ElFormItem>
          <ElFormItem label="默认暴露端口">
            <ElInput v-model="form.exposePorts" placeholder="如：3306,8080:80" />
          </ElFormItem>
          <ElFormItem label="端口映射">
            <ElSwitch
              v-model="form.hasPortMapping"
              :active-value="1"
              :inactive-value="0"
              inline-prompt
              active-text="开启"
              inactive-text="关闭"
            />
          </ElFormItem>
          <ElFormItem label="Docker 默认脚本模式">
            <ElRadioGroup v-model="dockerDefaults.scriptMode">
              <ElRadio value="script">脚本</ElRadio>
              <ElRadio value="dockerfile">Dockerfile</ElRadio>
            </ElRadioGroup>
          </ElFormItem>
          <ElFormItem label="支持模式">
            <ElCheckbox v-model="modeEnabled.SYSTEM" disabled>System</ElCheckbox>
            <ElCheckbox v-model="modeEnabled.DOCKER">Docker</ElCheckbox>
          </ElFormItem>
          <ElFormItem
            v-if="dockerDefaults.scriptMode === 'dockerfile'"
            label="Dockerfile 默认内容"
          >
            <ScScriptEditor
              v-model="dockerDefaults.dockerfileContent"
              language="dockerfile"
              label="Dockerfile 默认内容"
              dialog-title="Dockerfile 默认内容"
            />
          </ElFormItem>
          <ElFormItem label="备注">
            <ElInput
              v-model="remarkDescription"
              type="textarea"
              :rows="3"
              placeholder="软件描述信息"
            />
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <ElTabPane label="配置字段" name="config">
        <ElTabs v-model="configTab" type="card">
          <ElTabPane label="System 字段" name="SYSTEM">
            <SoftwareDynamicForm v-model="modeConfigFields.SYSTEM" />
          </ElTabPane>
          <ElTabPane label="Docker 字段" name="DOCKER" :disabled="!modeEnabled.DOCKER">
            <SoftwareDynamicForm v-model="modeConfigFields.DOCKER" />
          </ElTabPane>
        </ElTabs>
      </ElTabPane>

      <ElTabPane label="环境变量" name="envVars">
        <ElForm :model="form" label-width="120px" label-position="top">
          <ElFormItem label="System 环境变量">
            <div style="width:100%">
              <ElInput
                v-model="form.systemEnvVars"
                type="textarea"
                :rows="6"
                placeholder='每行一个，如：{"JAVA_HOME": "/usr/lib/jvm/java-11", "PATH": "/usr/lib/jvm/java-11/bin"}'
              />
              <div style="color:#909399;font-size:12px;margin-top:4px">
                System 模式下会以 export KEY=VALUE 注入到脚本前
              </div>
            </div>
          </ElFormItem>
          <ElFormItem label="Docker 环境变量">
            <div style="width:100%">
              <ElInput
                v-model="form.dockerEnvVars"
                type="textarea"
                :rows="6"
                placeholder='每行一个，如：{"MYSQL_ROOT_PASSWORD": "root", "MYSQL_DATABASE": "test"}'
              />
              <div style="color:#909399;font-size:12px;margin-top:4px">
                Docker 模式下会以 -e 参数注入到容器
              </div>
            </div>
          </ElFormItem>
        </ElForm>
      </ElTabPane>

      <ElTabPane label="System 脚本" name="systemScripts">
        <ElAlert
          :title="form.presetType === 'ENVIRONMENT' ? '环境类型仅需安装、状态检测和卸载脚本。' : form.presetType === 'DOCKERFILE' ? 'Dockerfile 构建类型不支持 System 模式。' : 'System 模式下必须完整维护安装、启动、停止、重启、状态、卸载脚本。'"
          :type="form.presetType === 'DOCKERFILE' ? 'warning' : 'info'"
          :closable="false"
          style="margin-bottom: 12px"
        />
        <template v-if="form.presetType !== 'DOCKERFILE'">
        <ElTabs v-model="systemScriptTab" type="card">
          <ElTabPane
            v-for="item in scriptTabItems"
            :key="`system-${item.key}`"
            :label="item.label"
            :name="item.key"
          >
            <ScScriptEditor
              v-model="modeScripts.SYSTEM[item.key]"
              language="shell"
              :label="item.label"
              :dialog-title="item.label"
            />
          </ElTabPane>
          </ElTabs>
        </template>
        <template v-else>
          <ScScriptEditor
            v-model="modeScripts.SYSTEM.installScript"
            language="dockerfile"
            label="Dockerfile 内容"
            dialog-title="Dockerfile 内容"
          />
        </template>
      </ElTabPane>

      <ElTabPane label="Docker 脚本" name="dockerScripts" :disabled="!modeEnabled.DOCKER">
        <ElAlert
          :title="form.presetType === 'ENVIRONMENT' ? '环境类型仅需安装、状态检测和卸载脚本。' : 'Docker 模式也必须维护完整脚本；若默认模式选择 Dockerfile，可同时维护 Dockerfile 内容。'"
          type="warning"
          :closable="false"
          style="margin-bottom: 12px"
        />
        <ElTabs v-model="dockerScriptTab" type="card">
          <ElTabPane
            v-for="item in scriptTabItems"
            :key="`docker-${item.key}`"
            :label="item.label"
            :name="item.key"
          >
            <ScScriptEditor
              v-model="modeScripts.DOCKER[item.key]"
              language="shell"
              :label="item.label"
              :dialog-title="item.label"
            />
          </ElTabPane>
        </ElTabs>
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <ElButton @click="dialogVisible = false">取消</ElButton>
      <ElButton type="primary" :loading="saving" @click="handleSave">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  ElAlert,
  ElButton,
  ElCol,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElCheckbox,
  ElRadio,
  ElRadioGroup,
  ElRow,
  ElSelect,
  ElSwitch,
  ElTabPane,
  ElTabs,
} from "element-plus";
import SoftwareDynamicForm from "./SoftwareDynamicForm.vue";
import ScScriptEditor from "@repo/components/ScScriptEditor";
import {
  createEmptyScriptSet,
  getPresetModeConfigFields,
  getPresetModeScripts,
  parseSoftwarePresetRemark,
  savePreset,
  stringifySoftwarePresetRemark,
  updatePreset,
  type ConfigFieldDef,
  type DockerScriptMode,
  type InstallMode,
  type SoftwareDockerDefaults,
  type SoftwarePreset,
  type SoftwareScriptSet,
} from "../../api/software";

type ScriptFieldKey = keyof SoftwareScriptSet;

const allScriptTabItems: { key: ScriptFieldKey; label: string }[] = [
  { key: "installScript", label: "安装脚本" },
  { key: "startScript", label: "启动脚本" },
  { key: "stopScript", label: "停止脚本" },
  { key: "restartScript", label: "重启脚本" },
  { key: "statusScript", label: "状态检测脚本" },
  { key: "uninstallScript", label: "卸载脚本" },
];

const environmentScriptKeys: ScriptFieldKey[] = ["installScript", "statusScript", "uninstallScript"];

const scriptTabItems = computed(() => {
  if (form.presetType === "ENVIRONMENT") {
    return allScriptTabItems.filter(item => environmentScriptKeys.includes(item.key));
  }
  return allScriptTabItems;
});

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    preset?: SoftwarePreset | null;
  }>(),
  { preset: null },
);

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  saved: [preset: SoftwarePreset];
}>();

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const isEdit = computed(() => !!props.preset);
const saving = ref(false);
const activeTab = ref("basic");
const configTab = ref<InstallMode>("SYSTEM");
const systemScriptTab = ref<ScriptFieldKey>("installScript");
const dockerScriptTab = ref<ScriptFieldKey>("installScript");

const form = reactive<Partial<SoftwarePreset>>({
  softwareName: "",
  softwareCode: "",
  serviceName: "",
  softwareVersion: "",
  softwareCategory: "",
  presetType: "SOFTWARE",
  softwareIcon: "",
  softwareVendor: "",
  osType: "linux",
  installPath: "",
  exposePorts: "",
  hasPortMapping: 0,
  presetRemark: "",
  systemEnvVars: "",
  dockerEnvVars: "",
});

const remarkDescription = ref("");
const dockerDefaults = reactive<SoftwareDockerDefaults>({
  image: "",
  scriptMode: "script",
  dockerfileContent: "",
});
const modeEnabled = reactive<Record<InstallMode, boolean>>({
  SYSTEM: true,
  DOCKER: true,
});

const modeConfigFields = reactive<Record<InstallMode, ConfigFieldDef[]>>({
  SYSTEM: [],
  DOCKER: [],
});

const modeScripts = reactive<Record<InstallMode, SoftwareScriptSet>>({
  SYSTEM: createEmptyScriptSet(),
  DOCKER: createEmptyScriptSet(),
});

const resetScriptSet = (target: SoftwareScriptSet) => {
  const empty = createEmptyScriptSet();
  for (const item of scriptTabItems) {
    target[item.key] = empty[item.key];
  }
};

const resetForm = () => {
  form.softwareName = "";
  form.softwareCode = "";
  form.serviceName = "";
  form.softwareVersion = "";
  form.softwareCategory = "";
  form.presetType = "SOFTWARE";
  form.softwareIcon = "";
  form.softwareVendor = "";
  form.osType = "linux";
  form.installPath = "";
  form.exposePorts = "";
  form.hasPortMapping = 0;
  form.presetRemark = "";
  form.systemEnvVars = "";
  form.dockerEnvVars = "";
  remarkDescription.value = "";
  dockerDefaults.image = "";
  dockerDefaults.scriptMode = "script";
  dockerDefaults.dockerfileContent = "";
  modeEnabled.SYSTEM = true;
  modeEnabled.DOCKER = true;
  modeConfigFields.SYSTEM = [];
  modeConfigFields.DOCKER = [];
  resetScriptSet(modeScripts.SYSTEM);
  resetScriptSet(modeScripts.DOCKER);
};

watch(
  () => props.preset,
  (val) => {
    if (!val) {
      resetForm();
      return;
    }
    Object.assign(form, val);
    const remark = parseSoftwarePresetRemark(val.presetRemark);
    remarkDescription.value = remark.description || "";
    modeEnabled.SYSTEM = val.presetType !== "DOCKERFILE";
    modeEnabled.DOCKER = val.presetType === "DOCKERFILE"
      ? true
      : remark.supportedModes
        ? remark.supportedModes.includes("DOCKER")
        : true;
    dockerDefaults.image = remark.dockerDefaults?.image || "";
    dockerDefaults.scriptMode =
      (remark.dockerDefaults?.scriptMode as DockerScriptMode) || "script";
    dockerDefaults.dockerfileContent = remark.dockerDefaults?.dockerfileContent || "";
    modeConfigFields.SYSTEM = getPresetModeConfigFields(val, "SYSTEM");
    modeConfigFields.DOCKER = getPresetModeConfigFields(val, "DOCKER");
    const systemScripts = getPresetModeScripts(val, "SYSTEM");
    const dockerScripts = getPresetModeScripts(val, "DOCKER");
    for (const item of scriptTabItems) {
      modeScripts.SYSTEM[item.key] = systemScripts[item.key];
      modeScripts.DOCKER[item.key] = dockerScripts[item.key];
    }
  },
  { immediate: true },
);

watch(
  () => form.presetType,
  (val) => {
    modeEnabled.SYSTEM = val !== "DOCKERFILE";
  },
);

const handleClose = () => {
  resetForm();
  activeTab.value = "basic";
  configTab.value = "SYSTEM";
  systemScriptTab.value = "installScript";
  dockerScriptTab.value = "installScript";
};

const hasFullScripts = (scriptSet: SoftwareScriptSet) => {
  const keys = form.presetType === "ENVIRONMENT" ? environmentScriptKeys : allScriptTabItems.map(i => i.key);
  return keys.every((key) => scriptSet[key]?.trim());
};

const handleSave = async () => {
  if (!form.softwareName || !form.softwareCode || !form.serviceName) {
    ElMessage.warning("请填写软件名称、编码和 System 服务名默认值");
    return;
  }

  const isDockerfile = form.presetType === "DOCKERFILE";
  const isEnvironment = form.presetType === "ENVIRONMENT";

  if (!isDockerfile && !hasFullScripts(modeScripts.SYSTEM)) {
    ElMessage.warning(isEnvironment ? "请完整填写 System 模式的安装、状态检测和卸载脚本" : "请完整填写 System 模式的六类脚本");
    return;
  }
  if (modeEnabled.DOCKER && !isEnvironment && !hasFullScripts(modeScripts.DOCKER)) {
    ElMessage.warning("请完整填写 Docker 模式的六类脚本");
    return;
  }
  if (
    !isDockerfile &&
    modeEnabled.DOCKER &&
    dockerDefaults.scriptMode === "dockerfile" &&
    !dockerDefaults.dockerfileContent?.trim()
  ) {
    ElMessage.warning("Docker 默认模式为 Dockerfile 时，必须填写 Dockerfile 内容");
    return;
  }

  saving.value = true;
  try {
    const supportedModes: InstallMode[] = isDockerfile
      ? ["DOCKER"]
      : modeEnabled.DOCKER
        ? ["SYSTEM", "DOCKER"]
        : ["SYSTEM"];

    const payload: Partial<SoftwarePreset> = {
      ...form,
      hasPortMapping: form.hasPortMapping ?? 0,
      systemEnvVars: form.systemEnvVars || undefined,
      dockerEnvVars: form.dockerEnvVars || undefined,
      presetRemark: stringifySoftwarePresetRemark({
        description: remarkDescription.value || undefined,
        serviceName: form.serviceName || undefined,
        supportedModes,
        modeConfigFields: {
          SYSTEM: isDockerfile ? [] : modeConfigFields.SYSTEM,
          DOCKER: modeEnabled.DOCKER ? modeConfigFields.DOCKER : [],
        },
        modeScripts: {
          SYSTEM: isDockerfile ? undefined : { ...modeScripts.SYSTEM },
          DOCKER: modeEnabled.DOCKER && !isEnvironment ? { ...modeScripts.DOCKER } : undefined,
        },
        dockerDefaults: modeEnabled.DOCKER
          ? {
              image: dockerDefaults.image || undefined,
              scriptMode: isDockerfile ? "dockerfile" : (dockerDefaults.scriptMode || "script"),
              dockerfileContent: isDockerfile
                ? (modeScripts.SYSTEM.installScript || undefined)
                : (dockerDefaults.dockerfileContent || undefined),
            }
          : undefined,
      }),
    };

    if (isDockerfile) {
      // DOCKERFILE type: installScript holds Dockerfile content
      payload.installScript = modeScripts.SYSTEM.installScript || undefined;
      payload.statusScript = undefined;
    } else if (isEnvironment) {
      payload.installScript = modeScripts.SYSTEM.installScript || undefined;
      payload.statusScript = modeScripts.SYSTEM.statusScript || undefined;
      payload.uninstallScript = modeScripts.SYSTEM.uninstallScript || undefined;
    } else {
      // SOFTWARE: all 6 scripts
      payload.installScript = modeScripts.SYSTEM.installScript || undefined;
      payload.startScript = modeScripts.SYSTEM.startScript || undefined;
      payload.stopScript = modeScripts.SYSTEM.stopScript || undefined;
      payload.restartScript = modeScripts.SYSTEM.restartScript || undefined;
      payload.statusScript = modeScripts.SYSTEM.statusScript || undefined;
      payload.uninstallScript = modeScripts.SYSTEM.uninstallScript || undefined;
    }

    const res = isEdit.value ? await updatePreset(payload) : await savePreset(payload);
    if (res.code === "00000") {
      ElMessage.success(isEdit.value ? "更新成功" : "创建成功");
      dialogVisible.value = false;
      emit("saved", payload as SoftwarePreset);
      return;
    }
    ElMessage.error(res.msg || "操作失败");
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped>
:deep(.el-form-item) {
  margin-bottom: 16px;
}
</style>
