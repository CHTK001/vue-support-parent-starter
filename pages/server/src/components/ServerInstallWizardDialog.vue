<template>
  <ScDialog
    v-model="visible"
    width="min(1480px, 96vw)"
    destroy-on-close
    hide-header
    :title="host ? `安装软件到 ${host.serverName}` : '安装软件'"
  >
    <section class="server-install-shell">
      <header class="server-install-shell__hero">
        <div>
          <p class="server-install-shell__eyebrow">Install Workspace</p>
          <h3>左侧软件列表，中间版本，右侧安装脚本</h3>
          <p class="server-install-shell__hint">
            点击软件卡片自动加载版本，再点击版本即可在右侧查看安装脚本与服务脚本。
          </p>
        </div>
        <div class="server-install-shell__hero-right">
          <div class="server-chip-group">
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ host?.serverName || "-" }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ hostAddress(host) }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ osLabel(host?.osType) }} / {{ archLabel(host?.architecture) }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ selectedVersionLabel || "未选择版本" }}
            </el-tag>
          </div>
          <ScButton
            type="primary"
            size="large"
            :disabled="!canSubmitInstall"
            :loading="submitting"
            @click="$emit('submit')"
          >
            安装
          </ScButton>
        </div>
      </header>

      <section class="install-three-col">
        <article class="server-detail-card install-panel">
          <header class="install-panel__header">
            <h3>软件列表</h3>
            <p>包含图片、名称与核心描述，点击后加载右侧版本。</p>
          </header>
          <div class="install-card-list thin-scroller">
            <button
              v-for="option in normalizedPackageOptions"
              :key="option.value"
              type="button"
              class="install-software-card"
              :class="{ 'is-active': option.value === normalizedPackageId }"
              @click="selectPackage(option.value)"
            >
              <div class="install-software-card__media">
                <img
                  v-if="option.iconUrl"
                  :src="option.iconUrl"
                  :alt="option.label"
                />
                <span v-else>{{ option.label.slice(0, 1) }}</span>
              </div>
              <div class="install-software-card__body">
                <strong>{{ option.label }}</strong>
                <p>
                  {{ option.packageCode || "未配置编码" }} ·
                  {{ option.packageCategory || "未分类" }}
                </p>
                <small>{{
                  option.description || "点击后查看版本与安装脚本。"
                }}</small>
              </div>
            </button>
            <el-empty
              v-if="!normalizedPackageOptions.length"
              description="当前服务器没有可安装的软件"
            />
          </div>
        </article>

        <article class="server-detail-card install-panel">
          <header class="install-panel__header">
            <h3>版本列表</h3>
            <p>点击版本后，右侧会显示对应安装脚本。</p>
          </header>
          <div class="install-version-list thin-scroller">
            <div v-if="!normalizedPackageId" class="install-empty-tip">
              先在左侧选择软件
            </div>
            <template v-else>
              <button
                v-for="version in versions"
                :key="version.softPackageVersionId"
                type="button"
                class="install-version-card"
                :class="{
                  'is-active':
                    toNumeric(version.softPackageVersionId) ===
                    toNumeric(form.softPackageVersionId),
                }"
                @click="selectVersion(version.softPackageVersionId)"
              >
                <strong>{{ version.versionName || version.versionCode }}</strong>
                <p>{{ version.versionCode || "-" }}</p>
                <small>
                  {{ version.osType || "通用" }} / {{ version.architecture || "通用" }}
                </small>
              </button>
              <el-empty
                v-if="!versions.length"
                description="当前软件暂无可安装版本"
              />
            </template>
          </div>
        </article>

        <article class="server-detail-card install-panel">
          <header class="install-panel__header">
            <h3>安装脚本</h3>
            <p>展示当前版本核心脚本，提交前可快速核对。</p>
          </header>
          <div class="install-script-list thin-scroller">
            <div v-if="!selectedVersion" class="install-empty-tip">
              选择版本后查看脚本
            </div>
            <template v-else>
              <article
                v-for="item in scriptBlocks"
                :key="item.key"
                class="install-script-card"
              >
                <h4>{{ item.label }}</h4>
                <pre>{{ item.content }}</pre>
              </article>
              <el-empty
                v-if="!scriptBlocks.length"
                description="该版本未提供脚本"
              />
            </template>
          </div>
        </article>
      </section>

      <section v-if="task" class="install-task-result">
        <el-alert
          :title="task.message || '安装任务已提交'"
          type="success"
          :closable="false"
        />
      </section>
    </section>

    <template #footer>
      <ScButton @click="visible = false">关闭</ScButton>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ServerHost } from "../api";
import type { GuideScope, GuideSection, ServerInstallTask } from "./server-types";
import type {
  SoftInstallRequest,
  SoftPackageVersion,
} from "../../../panel/src/api";
import { archLabel, hostAddress, osLabel } from "../utils/serverHost";

interface InstallPackageOption {
  label: string;
  value: number;
  packageCode?: string;
  packageCategory?: string;
  description?: string;
  iconUrl?: string;
}

const props = defineProps<{
  modelValue: boolean;
  host: ServerHost | null;
  step: number;
  packageId: number | null;
  packageOptions: Array<Record<string, unknown>>;
  versions: SoftPackageVersion[];
  guideSections: GuideSection[];
  guideLoading: boolean;
  submitting: boolean;
  task: ServerInstallTask | null;
  form: SoftInstallRequest;
  installModels: Record<GuideScope, Record<string, unknown>>;
  selectedPackageName: string;
  selectedVersionLabel: string;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: boolean): void;
  (event: "update:step", value: number): void;
  (event: "update:packageId", value: number | null): void;
  (event: "next-step"): void;
  (event: "submit"): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit("update:modelValue", value),
});

const toNumeric = (value: unknown) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
};

const normalizedPackageId = computed(() => toNumeric(props.packageId));

const normalizedPackageOptions = computed<InstallPackageOption[]>(() =>
  (props.packageOptions || [])
    .map((item) => {
      const value = toNumeric(item.value);
      if (!value) {
        return null;
      }
      return {
        label: String(item.label || ""),
        value,
        packageCode: String(item.packageCode || ""),
        packageCategory: String(item.packageCategory || ""),
        description: String(item.description || ""),
        iconUrl: String(item.iconUrl || ""),
      };
    })
    .filter((item): item is InstallPackageOption => Boolean(item)),
);

const selectedVersion = computed(
  () =>
    (props.versions || []).find(
      (item) => toNumeric(item.softPackageVersionId) === toNumeric(props.form.softPackageVersionId),
    ) || null,
);

const scriptBlocks = computed(() => {
  const version = selectedVersion.value;
  if (!version) {
    return [];
  }
  const candidates: Array<{ key: string; label: string; content?: string }> = [
    { key: "install", label: "安装脚本", content: version.installScript || "" },
    { key: "uninstall", label: "卸载脚本", content: version.uninstallScript || "" },
    { key: "start", label: "启动脚本", content: version.startScript || "" },
    { key: "stop", label: "停止脚本", content: version.stopScript || "" },
    { key: "restart", label: "重启脚本", content: version.restartScript || "" },
    { key: "status", label: "状态脚本", content: version.statusScript || "" },
    { key: "service-register", label: "服务注册脚本", content: version.serviceRegisterScript || "" },
    { key: "service-unregister", label: "服务卸载脚本", content: version.serviceUnregisterScript || "" },
  ];
  return candidates.filter((item) => Boolean(String(item.content || "").trim()));
});

const canSubmitInstall = computed(
  () => normalizedPackageId.value > 0 && toNumeric(props.form.softPackageVersionId) > 0,
);

const selectPackage = (value: number) => {
  emit("update:packageId", value);
  emit("next-step");
};

const selectVersion = (value?: number) => {
  props.form.softPackageVersionId = toNumeric(value);
};
</script>

<style scoped lang="scss">
.server-install-shell {
  display: grid;
  gap: 14px;
}

.server-install-shell__hero {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  padding: 18px 20px;
  border-radius: 24px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.server-install-shell__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0284c7;
}

.server-install-shell__hero h3 {
  margin: 0;
  color: #0f172a;
}

.server-install-shell__hint {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.server-install-shell__hero-right {
  display: grid;
  align-content: space-between;
  justify-items: end;
  gap: 10px;
}

.install-three-col {
  display: grid;
  gap: 12px;
  grid-template-columns: 1.15fr 0.9fr 1.25fr;
}

.install-panel {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  min-height: 520px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.88);
}

.install-panel__header h3 {
  margin: 0;
  color: #0f172a;
}

.install-panel__header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.install-card-list,
.install-version-list,
.install-script-list {
  margin-top: 10px;
  min-height: 0;
  overflow: auto;
  padding-right: 4px;
}

.install-software-card,
.install-version-card {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.95);
  padding: 10px;
  display: grid;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.install-software-card + .install-software-card,
.install-version-card + .install-version-card {
  margin-top: 8px;
}

.install-software-card.is-active,
.install-version-card.is-active {
  border-color: rgba(14, 165, 233, 0.48);
  box-shadow: 0 10px 22px rgba(14, 165, 233, 0.14);
  background: linear-gradient(135deg, rgba(240, 249, 255, 0.92), rgba(255, 255, 255, 0.98));
}

.install-software-card {
  grid-template-columns: 52px minmax(0, 1fr);
  align-items: center;
}

.install-software-card__media {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.08);
  display: grid;
  place-items: center;
  overflow: hidden;
  color: #0f172a;
  font-weight: 700;
}

.install-software-card__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.install-software-card__body {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.install-software-card__body strong,
.install-version-card strong {
  color: #0f172a;
}

.install-software-card__body p,
.install-version-card p {
  margin: 0;
  color: #475569;
  font-size: 12px;
}

.install-software-card__body small,
.install-version-card small {
  color: #64748b;
  line-height: 1.6;
}

.install-script-card {
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.8);
  padding: 10px;
}

.install-script-card + .install-script-card {
  margin-top: 8px;
}

.install-script-card h4 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 13px;
}

.install-script-card pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 12px;
  line-height: 1.65;
  color: #0f172a;
  font-family: "Consolas", "Courier New", monospace;
}

.install-empty-tip {
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.6);
  color: #64748b;
  font-size: 12px;
  padding: 12px;
}

.install-task-result {
  margin-top: 2px;
}

.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}

@media (max-width: 1220px) {
  .install-three-col {
    grid-template-columns: 1fr;
  }

  .install-panel {
    min-height: 340px;
  }

  .server-install-shell__hero {
    grid-template-columns: 1fr;
  }

  .server-install-shell__hero-right {
    justify-items: start;
  }

  .server-chip-group {
    justify-content: flex-start;
  }
}
</style>
