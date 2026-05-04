<template>
  <ElDialog
    v-model="visible"
    title="安装 Nginx"
    width="980px"
    append-to-body
    destroy-on-close
    class="nginx-spi-install-dialog"
    :close-on-click-modal="false"
    @open="initialize"
    @closed="resetState"
  >
    <div class="install-shell" v-loading="loading">
      <header class="install-hero">
        <div class="install-hero__copy">
          <p class="install-hero__eyebrow">Soft SPI Installation</p>
          <h2>通过软安装中心部署 Nginx</h2>
          <p>
            自动识别 nginx 软件包、创建 SSH 安装目标，并提交安装任务。
            安装路径、端口和服务名会自动生成，可直接确认后执行。
          </p>
        </div>

        <div class="install-hero__badges">
          <span>{{ hostBadge }}</span>
          <span>{{ targetBadge }}</span>
          <span>{{ packageBadge }}</span>
        </div>
      </header>

      <template v-if="nginxPackage">
        <div class="install-grid">
          <section class="install-card">
            <div class="install-card__head">
              <strong>软件版本</strong>
              <span>选择要安装的 nginx 版本</span>
            </div>
            <ElSelect v-model="form.versionId" placeholder="请选择版本" class="install-select">
              <ElOption
                v-for="version in versions"
                :key="version.softPackageVersionId"
                :label="version.versionName || version.versionCode"
                :value="version.softPackageVersionId"
              />
            </ElSelect>

            <div class="install-summary">
              <div class="install-summary__item">
                <span>软件包</span>
                <strong>{{ nginxPackage.packageName || nginxPackage.packageCode }}</strong>
              </div>
              <div class="install-summary__item">
                <span>版本编码</span>
                <strong>{{ selectedVersion?.versionCode || "自动选择" }}</strong>
              </div>
            </div>
          </section>

          <section class="install-card">
            <div class="install-card__head">
              <strong>安装目标</strong>
              <span>当前面板连接的 SSH 主机</span>
            </div>

            <div class="install-form-grid">
              <label class="install-field">
                <span>目标名称</span>
                <ElInput v-model="form.targetName" placeholder="Nginx 安装目标" />
              </label>
              <label class="install-field">
                <span>目标编码</span>
                <ElInput v-model="form.targetCode" placeholder="nginx-host-22" />
              </label>
              <label class="install-field">
                <span>基础目录</span>
                <ElInput v-model="form.baseDirectory" placeholder="/opt/software" />
              </label>
              <label class="install-field">
                <span>服务账号</span>
                <ElInput :model-value="targetAccount" disabled />
              </label>
            </div>
          </section>

          <section class="install-card install-card--wide">
            <div class="install-card__head">
              <strong>部署参数</strong>
              <span>自动生成安装路径与服务名</span>
            </div>

            <div class="install-form-grid install-form-grid--compact">
              <label class="install-field">
                <span>实例名称</span>
                <ElInput v-model="form.installationName" placeholder="nginx-1.24.0" />
              </label>
              <label class="install-field">
                <span>安装路径</span>
                <ElInput v-model="form.installPath" placeholder="/opt/software/nginx/1.24.0" />
              </label>
              <label class="install-field">
                <span>服务名称</span>
                <ElInput v-model="form.serviceName" placeholder="nginx" />
              </label>
              <label class="install-field">
                <span>配置目录</span>
                <ElInput v-model="form.configDirectory" placeholder="/opt/software/nginx/conf" />
              </label>
              <label class="install-field">
                <span>HTTP 端口</span>
                <ElInputNumber v-model="form.httpPort" :min="1" :max="65535" controls-position="right" />
              </label>
              <label class="install-field">
                <span>HTTPS 端口</span>
                <ElInputNumber v-model="form.httpsPort" :min="1" :max="65535" controls-position="right" />
              </label>
              <label class="install-field install-field--switch">
                <span>注册服务</span>
                <ElSwitch v-model="form.registerService" />
              </label>
            </div>
          </section>
        </div>
      </template>

      <div v-else class="install-empty">
        <ElEmpty description="未找到 nginx 软件包，请先检查软安装中心" :image-size="56" />
      </div>
    </div>

    <template #footer>
      <ScButton @click="visible = false">取消</ScButton>
      <ScButton type="primary" :loading="submitting" :disabled="!canSubmit" @click="submit">
        提交安装
      </ScButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElDialog, ElEmpty, ElInput, ElInputNumber, ElMessage, ElOption, ElSelect, ElSwitch } from "element-plus";
import {
  createSoftTarget,
  getSoftPackageDetail,
  installSoftPackage,
  listSoftPackages,
  listSoftTargets,
  type SoftPackageSummary,
  type SoftPackageVersionSummary,
  type SoftTargetPayload,
} from "../../api/nginx";

const props = defineProps<{
  connectionId: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}>();

const emit = defineEmits<{
  (e: "installed"): void;
  (e: "update:modelValue", value: boolean): void;
}>();

const visible = defineModel<boolean>({ default: false });

const loading = ref(false);
const submitting = ref(false);
const nginxPackage = ref<SoftPackageSummary | null>(null);
const versions = ref<SoftPackageVersionSummary[]>([]);
const matchedTarget = ref<SoftTargetPayload | null>(null);
const existingTargetId = ref<number | null>(null);

const form = reactive({
  versionId: undefined as number | undefined,
  installationName: "",
  targetName: "",
  targetCode: "",
  baseDirectory: "/opt/software",
  installPath: "",
  serviceName: "",
  configDirectory: "",
  httpPort: 80,
  httpsPort: 443,
  registerService: true,
});

const selectedVersion = computed(() =>
  versions.value.find(item => item.softPackageVersionId === form.versionId) || null,
);

const hostBadge = computed(() => `${props.username}@${props.host}:${props.port}`);
const targetBadge = computed(() => (existingTargetId.value ? "已存在安装目标" : "将创建安装目标"));
const packageBadge = computed(() => nginxPackage.value ? `package:${nginxPackage.value.packageCode || "nginx"}` : "nginx");
const targetAccount = computed(() => `${props.username}@${props.host}:${props.port}`);

const buildTargetName = () => `Nginx@${props.host}`;
const buildTargetCode = () =>
  `nginx-${String(props.host || "host").replace(/[^a-zA-Z0-9]+/g, "-")}-${props.port || 22}`;

const applyDefaults = () => {
  const versionCode = selectedVersion.value?.versionCode || "latest";
  form.installationName = `nginx-${versionCode}`;
  form.installPath = `${form.baseDirectory.replace(/\/+$/, "")}/nginx/${versionCode}`;
  form.serviceName = `nginx-${versionCode}`;
  form.configDirectory = `${form.installPath}/conf`;
};

watch(
  () => [form.versionId, form.baseDirectory],
  () => {
    if (visible.value) {
      applyDefaults();
    }
  }
);

const initialize = async () => {
  loading.value = true;
  try {
    const [packagesRes, targetsRes] = await Promise.all([listSoftPackages(), listSoftTargets()]);
    const packages = packagesRes?.data || [];
    nginxPackage.value = packages.find(item => {
      const code = String(item.packageCode || "").toLowerCase();
      const name = String(item.packageName || "").toLowerCase();
      return code === "nginx" || name.includes("nginx");
    }) || null;
    if (!nginxPackage.value?.softPackageId) {
      ElMessage.error("未找到 nginx 软件包");
      return;
    }

    const detailRes = await getSoftPackageDetail(nginxPackage.value.softPackageId);
    versions.value = detailRes?.data?.versions || [];
    form.versionId = versions.value[0]?.softPackageVersionId;

    matchedTarget.value = (targetsRes?.data || []).find(item =>
      item.targetType === "SSH"
      && String(item.host || "") === String(props.host || "")
      && Number(item.port || 22) === Number(props.port || 22)
      && String(item.username || "") === String(props.username || "")
    ) || null;
    existingTargetId.value = matchedTarget.value?.softTargetId ?? null;

    form.targetName = matchedTarget.value?.targetName || buildTargetName();
    form.targetCode = matchedTarget.value?.targetCode || buildTargetCode();
    form.baseDirectory = matchedTarget.value?.baseDirectory || "/opt/software";
    applyDefaults();
  } catch (e: any) {
    ElMessage.error(e?.message || "初始化安装信息失败");
  } finally {
    loading.value = false;
  }
};

const resetState = () => {
  loading.value = false;
  submitting.value = false;
  nginxPackage.value = null;
  versions.value = [];
  matchedTarget.value = null;
  existingTargetId.value = null;
};

const canSubmit = computed(() =>
  Boolean(
    nginxPackage.value?.softPackageId
      && form.versionId
      && form.installationName.trim()
      && form.installPath.trim()
      && form.serviceName.trim()
      && form.targetName.trim()
      && form.targetCode.trim()
  ),
);

const submit = async () => {
  if (!nginxPackage.value?.softPackageId || !form.versionId) {
    return;
  }
  submitting.value = true;
  try {
    const target = matchedTarget.value?.softTargetId
      ? matchedTarget.value
      : await createTarget();
    const res = await installSoftPackage({
      softPackageId: nginxPackage.value.softPackageId,
      softPackageVersionId: form.versionId,
      softTargetId: target.softTargetId || 0,
      installationName: form.installationName.trim(),
      installPath: form.installPath.trim(),
      serviceName: form.serviceName.trim(),
      installOptions: {
        installationName: form.installationName.trim(),
        installPath: form.installPath.trim(),
      },
      serviceOptions: {
        serviceName: form.serviceName.trim(),
        registerService: form.registerService,
      },
      configOptions: {
        httpPort: form.httpPort,
        httpsPort: form.httpsPort,
        configDirectory: form.configDirectory.trim(),
      },
    });
    if (res?.data?.operationId == null) {
      throw new Error("安装任务提交失败：后端未返回 operationId");
    }
    ElMessage.success(`安装任务已提交${res?.data?.operationId ? ` #${res.data.operationId}` : ""}`);
    emit("installed");
    visible.value = false;
  } catch (e: any) {
    ElMessage.error(e?.message || "提交安装失败");
  } finally {
    submitting.value = false;
  }
};

const createTarget = async () => {
  const payload: SoftTargetPayload = {
    targetName: form.targetName.trim() || buildTargetName(),
    targetCode: form.targetCode.trim() || buildTargetCode(),
    targetType: "SSH",
    osType: "linux",
    host: props.host,
    port: props.port,
    username: props.username,
    password: props.password,
    privateKey: props.privateKey,
    baseDirectory: form.baseDirectory.trim(),
    enabled: true,
    description: `由 Nginx 面板自动创建的安装目标`,
    metadataJson: JSON.stringify({
      source: "panel-nginx",
      connectionId: props.connectionId,
    }),
  };
  const res = await createSoftTarget(payload);
  existingTargetId.value = res?.data?.softTargetId ?? null;
  matchedTarget.value = res?.data || null;
  return res?.data || payload;
};
</script>

<style scoped lang="scss">
.install-shell {
  display: grid;
  gap: 16px;
}

.install-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
  gap: 16px;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at top left, rgba(59, 130, 246, 0.14), transparent 28%),
    linear-gradient(140deg, rgba(255, 255, 255, 0.98), rgba(239, 246, 255, 0.88));
}

.install-hero__copy {
  h2 {
    margin: 0 0 8px;
    font-size: 24px;
    color: #0f172a;
  }

  p:last-child {
    margin: 0;
    color: #475569;
    line-height: 1.8;
    font-size: 14px;
  }
}

.install-hero__eyebrow {
  margin: 0 0 10px;
  color: #2563eb;
  font-size: 11px;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.install-hero__badges {
  display: grid;
  gap: 10px;

  span {
    padding: 12px 14px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.14);
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
    word-break: break-word;
  }
}

.install-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.install-card {
  display: grid;
  gap: 14px;
  padding: 18px;
  border-radius: 22px;
  background: rgba(248, 250, 252, 0.92);
  border: 1px solid rgba(226, 232, 240, 0.92);
}

.install-card--wide {
  grid-column: 1 / -1;
}

.install-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;

  strong {
    font-size: 16px;
    color: #0f172a;
  }

  span {
    font-size: 12px;
    color: #64748b;
  }
}

.install-select {
  width: 100%;
}

.install-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.install-summary__item {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.12);

  span {
    font-size: 11px;
    color: #94a3b8;
  }

  strong {
    font-size: 13px;
    color: #0f172a;
    word-break: break-all;
  }
}

.install-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 14px;
}

.install-form-grid--compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.install-field {
  display: grid;
  gap: 8px;

  > span {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }
}

.install-field--switch {
  align-content: end;
}

.install-empty {
  min-height: 180px;
  display: grid;
  place-items: center;
}

:deep(.nginx-spi-install-dialog .el-dialog__body) {
  padding-top: 10px;
}

:deep(.nginx-spi-install-dialog .el-input__wrapper),
:deep(.nginx-spi-install-dialog .el-select__wrapper) {
  border-radius: 14px;
}

@media (max-width: 1100px) {
  .install-hero,
  .install-grid,
  .install-summary,
  .install-form-grid,
  .install-form-grid--compact {
    grid-template-columns: 1fr;
  }
}

// ── Dark Mode ──
:global(html.dark) {
  .install-hero {
    background:
      radial-gradient(circle at top left, rgba(59, 130, 246, 0.18), transparent 28%),
      linear-gradient(140deg, rgba(15, 23, 42, 0.85), rgba(20, 30, 48, 0.8));
    border-color: rgba(148, 163, 184, 0.08);
  }
  .install-hero__copy {
    h2 { color: #f1f5f9; }
    p:last-child { color: #94a3b8; }
  }
  .install-hero__eyebrow { color: #818cf8; }
  .install-hero__badges span {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.1);
    color: #e2e8f0;
  }

  .install-card {
    background: rgba(15, 23, 42, 0.6);
    border-color: rgba(148, 163, 184, 0.08);
  }
  .install-card__head {
    strong { color: #e2e8f0; }
    span { color: #64748b; }
  }

  .install-summary__item {
    background: rgba(15, 23, 42, 0.4);
    border-color: rgba(148, 163, 184, 0.06);
    span { color: #64748b; }
    strong { color: #e2e8f0; }
  }

  .install-field > span { color: #94a3b8; }
}
</style>
