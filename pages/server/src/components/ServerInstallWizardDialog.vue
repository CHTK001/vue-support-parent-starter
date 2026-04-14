<template>
  <ScDialog
    v-model="visible"
    width="1120px"
    destroy-on-close
    hide-header
    :title="host ? `安装软件到 ${host.serverName}` : '安装软件'"
  >
    <section class="server-install-shell">
      <header class="server-install-shell__hero">
        <div>
          <p class="server-install-shell__eyebrow">Install Wizard</p>
          <h3>按服务器能力过滤软件，再进入版本与引导参数</h3>
          <p class="server-install-shell__hint">
            安装流保持三步，尽量把关键信息前置，避免进入第二步后才发现选错目标。
          </p>
        </div>
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
        </div>
      </header>

      <el-steps :active="step" simple class="install-steps">
        <el-step title="选择软件" />
        <el-step title="选择版本与引导配置" />
        <el-step title="提交与日志" />
      </el-steps>

      <section v-if="step === 0" class="install-step">
        <article class="server-detail-card">
          <header>
            <h3>选择软件</h3>
            <p>这里只展示当前服务器可安装的软件，列表已经按系统和架构过滤。</p>
          </header>
          <ScSelect
            v-model="packageId"
            :options="packageOptions"
            layout="list"
            width="100%"
            list-height="320px"
            list-placeholder="搜索软件名称、编码或分类"
            list-empty-text="当前服务器没有匹配的软件"
          >
            <template #content="{ option }">
              <div class="server-install-option">
                <strong>{{ option.label }}</strong>
                <span>
                  {{ option.packageCode }} ·
                  {{ option.packageCategory || "未分类" }}
                </span>
                <small>
                  {{ option.description || "可直接进入版本与引导配置。" }}
                </small>
              </div>
            </template>
          </ScSelect>
        </article>
      </section>

      <section v-else-if="step === 1" class="install-step">
        <article class="server-detail-card">
          <header>
            <h3>选择版本</h3>
            <p>默认选最新版本，可切换并补充安装引导参数。</p>
          </header>

          <div class="server-form-grid">
            <el-form-item label="软件版本">
              <el-select
                v-model="form.softPackageVersionId"
                placeholder="选择版本"
                style="width: 100%"
              >
                <el-option
                  v-for="version in versions"
                  :key="version.softPackageVersionId"
                  :label="`${version.versionName} (${version.versionCode})`"
                  :value="version.softPackageVersionId"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="实例名称">
              <ScInput v-model="form.installationName" />
            </el-form-item>
            <el-form-item label="安装路径">
              <ScInput v-model="form.installPath" />
            </el-form-item>
            <el-form-item label="服务名称">
              <ScInput v-model="form.serviceName" />
            </el-form-item>
          </div>
        </article>

        <div v-if="guideLoading" class="server-install-loading">
          <el-skeleton :rows="10" animated />
        </div>
        <template v-else>
          <article
            v-for="section in guideSections"
            :key="section.key"
            class="server-detail-card"
          >
            <header>
              <h3>{{ section.title }}</h3>
              <p>{{ section.hint }}</p>
            </header>

            <div class="server-form-grid">
              <el-form-item
                v-for="field in section.fields"
                :key="`${section.key}-${field.fieldKey}`"
                :label="field.fieldLabel || field.fieldKey"
                :class="{ 'server-form-grid__span-2': isTextareaField(field) }"
              >
                <el-switch
                  v-if="isBooleanField(field)"
                  :model-value="Boolean(modelFor(section.scope)[field.fieldKey])"
                  @change="modelFor(section.scope)[field.fieldKey] = Boolean($event)"
                />
                <ScInput
                  v-else-if="isNumberField(field)"
                  v-model="modelFor(section.scope)[field.fieldKey]"
                  type="number"
                  layout="stepper"
                  :min="numberValidation(field.validation, 'min')"
                  :max="numberValidation(field.validation, 'max')"
                />
                <ScInput
                  v-else-if="isTextareaField(field)"
                  v-model="modelFor(section.scope)[field.fieldKey]"
                  type="textarea"
                  :rows="4"
                />
                <ScInput
                  v-else
                  v-model="modelFor(section.scope)[field.fieldKey]"
                  :type="isPasswordField(field) ? 'password' : 'text'"
                  passwd-strong="none"
                />
                <small class="server-install-field__hint">
                  {{ field.fieldDescription || "按当前软件画像动态生成" }}
                </small>
              </el-form-item>
            </div>
          </article>
        </template>
      </section>

      <section v-else class="install-step">
        <article class="server-detail-card">
          <header>
            <h3>提交安装</h3>
            <p>安装提交后会直接跳转到对应软件实例详情页继续查看日志和控制。</p>
          </header>

          <div class="server-chip-group">
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ host?.serverName || "-" }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ selectedPackageName || "-" }}
            </el-tag>
            <el-tag class="server-inline-tag" effect="plain" round size="small">
              {{ selectedVersionLabel }}
            </el-tag>
          </div>

          <el-alert
            v-if="task"
            :title="task.message || '安装任务已提交'"
            type="success"
            :closable="false"
          />
          <el-empty v-else description="确认无误后提交安装。" />
        </article>
      </section>
    </section>

    <template #footer>
      <el-button v-if="step > 0" @click="step -= 1">上一步</el-button>
      <el-button @click="visible = false">取消</el-button>
      <el-button
        v-if="step === 0"
        type="primary"
        :disabled="!normalizedPackageId"
        @click="$emit('next-step')"
      >
        下一步
      </el-button>
      <el-button
        v-else-if="step === 1"
        type="primary"
        :loading="submitting"
        @click="$emit('submit')"
      >
        提交安装
      </el-button>
    </template>
  </ScDialog>
</template>

<script setup lang="ts">
import { computed } from "vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import ScInput from "@repo/components/ScInput/index.vue";
import type { ServerHost } from "../api";
import type { GuideScope, GuideSection, ServerInstallTask } from "./server-types";
import type {
  SoftGuideField,
  SoftInstallRequest,
  SoftPackageVersion,
} from "../../../soft/src/api";
import { archLabel, hostAddress, osLabel } from "../utils/serverHost";

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

const step = computed({
  get: () => props.step,
  set: (value: number) => emit("update:step", value),
});

const packageId = computed({
  get: () => props.packageId,
  set: (value: number | null) => emit("update:packageId", value),
});

const normalizedPackageId = computed(() => {
  const numeric = Number(props.packageId);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
});

const modelFor = (scope: GuideScope) => props.installModels[scope] || {};

const isTextareaField = (field: SoftGuideField) =>
  ["textarea", "code", "json", "script"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isNumberField = (field: SoftGuideField) =>
  ["number", "port", "integer"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isBooleanField = (field: SoftGuideField) =>
  ["switch", "boolean", "checkbox"].includes(
    String(field.componentType || "").toLowerCase(),
  );

const isPasswordField = (field: SoftGuideField) =>
  ["password", "secret"].includes(
    String(field.componentType || "").toLowerCase(),
  ) ||
  ["password", "token", "secret"].some((item) =>
    String(field.fieldKey || "")
      .toLowerCase()
      .includes(item),
  );

const numberValidation = (
  validation: Record<string, unknown> | undefined,
  key: "min" | "max",
) => {
  const value = validation?.[key];
  if (typeof value === "number") {
    return value;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : undefined;
};
</script>

<style scoped lang="scss">
.server-install-shell {
  display: grid;
  gap: 16px;
}

.server-install-shell__hero {
  display: grid;
  gap: 12px;
  padding: 20px 22px;
  border-radius: 28px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background:
    radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 32%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  box-shadow: 0 18px 36px rgba(15, 23, 42, 0.08);
}

.server-install-shell__eyebrow {
  margin: 0 0 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: #0284c7;
}

.server-install-shell__hero h3,
.server-detail-card h3 {
  margin: 0;
  color: #0f172a;
}

.server-install-shell__hint,
.server-detail-card header p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
  line-height: 1.7;
}

.install-steps {
  border-radius: 22px;
  overflow: hidden;
}

.install-step {
  display: grid;
  gap: 16px;
}

.server-detail-card {
  padding: 18px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.84);
}

.server-form-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.server-form-grid__span-2 {
  grid-column: 1 / -1;
}

.server-install-option {
  display: grid;
  gap: 4px;
}

.server-install-option strong {
  color: #0f172a;
}

.server-install-option span,
.server-install-option small,
.server-install-field__hint {
  color: #64748b;
  line-height: 1.6;
}

.server-install-loading {
  padding: 16px 18px;
  border-radius: 22px;
  border: 1px solid rgba(148, 163, 184, 0.16);
  background: rgba(255, 255, 255, 0.84);
}

.server-chip-group {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.server-inline-tag {
  --el-tag-border-color: rgba(148, 163, 184, 0.18);
  --el-tag-bg-color: rgba(255, 255, 255, 0.82);
  --el-tag-text-color: #475569;
  font-weight: 500;
}

@media (max-width: 900px) {
  .server-form-grid {
    grid-template-columns: 1fr;
  }

  .server-form-grid__span-2 {
    grid-column: auto;
  }
}
</style>
