<template>
  <el-dialog
    :model-value="modelValue"
    width="980px"
    destroy-on-close
    :title="editingId ? '编辑服务器' : '新增服务器'"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="server-form-dialog">
      <div class="server-form-dialog__hero">
        <div
          class="server-form-dialog__badge"
          :class="`is-${normalizeOs(form.osType) || 'default'}`"
        >
          <IconifyIconOnline :icon="osIcon(form.osType)" />
        </div>
        <div>
          <h3>{{ form.serverName || "服务器主档" }}</h3>
          <p>服务器列表、实时信息、软件安装入口都统一依赖这里的主档数据。</p>
        </div>
      </div>

      <div class="server-form-dialog__summary">
        <span class="server-form-dialog__summary-chip">
          接入 {{ form.serverType || "LOCAL" }}
        </span>
        <span class="server-form-dialog__summary-chip">
          {{ connectionHint }}
        </span>
        <span class="server-form-dialog__summary-chip">
          根目录 {{ displayBaseDirectory }}
        </span>
        <span
          class="server-form-dialog__summary-chip"
          :class="form.serverType === 'LOCAL' ? 'is-primary' : 'is-muted'"
        >
          {{
            form.serverType === "LOCAL"
              ? "本机地址/账号自动识别"
              : "远程连接参数由 SPI 执行"
          }}
        </span>
      </div>

      <el-form label-position="top" class="server-form-dialog__form">
        <div class="server-form-dialog__grid">
          <el-form-item label="服务器名称">
            <ScInput v-model="serverNameModel" />
          </el-form-item>

          <el-form-item label="服务器编码">
            <ScInput :model-value="codePreview" readonly />
          </el-form-item>

          <el-form-item label="接入类型">
            <ScSelect
              v-model="serverTypeModel"
              :options="serverTypeOptions"
              layout="pill"
              class="server-form-dialog__select"
            />
          </el-form-item>

          <el-form-item label="启用状态">
            <el-switch
              v-model="enabledModel"
              inline-prompt
              active-text="启用"
              inactive-text="停用"
            />
          </el-form-item>

          <el-form-item v-if="form.serverType !== 'LOCAL'" label="主机地址">
            <ScInput v-model="hostModel" placeholder="如 192.168.110.100" />
          </el-form-item>

          <el-form-item v-if="form.serverType !== 'LOCAL'" label="端口">
            <ScInput
              v-model="portModel"
              type="number"
              layout="stepper"
              :min="0"
              :max="65535"
              :step="1"
              :placeholder="
                form.serverType === 'WINRM' ? '默认 5985' : '默认 22'
              "
            />
          </el-form-item>
          <el-form-item v-else label="本机模式">
            <div class="server-form-dialog__auto-panel">
              <strong>自动识别本机</strong>
              <span>地址、账号和能力在运行时自动获取，无需手填连接参数。</span>
            </div>
          </el-form-item>

          <el-form-item label="操作系统">
            <ScSelect
              v-model="osTypeModel"
              :options="osTypeOptions"
              layout="pill"
              class="server-form-dialog__select"
            />
          </el-form-item>

          <el-form-item label="架构">
            <ScSelect
              v-model="architectureModel"
              :options="architectureOptions"
              layout="pill"
              class="server-form-dialog__select"
            />
          </el-form-item>
        </div>

        <div class="server-form-dialog__advanced-trigger">
          <el-button text @click="advancedVisible = !advancedVisible">
            <IconifyIconOnline
              :icon="
                advancedVisible ? 'ri:arrow-up-s-line' : 'ri:arrow-down-s-line'
              "
            />
            <span>{{ advancedVisible ? "收起高级选项" : "展开高级选项" }}</span>
          </el-button>
        </div>

        <el-collapse-transition>
          <div v-show="advancedVisible" class="server-form-dialog__advanced">
            <div class="server-form-dialog__grid">
              <el-form-item v-if="form.serverType !== 'LOCAL'" label="用户名">
                <ScInput v-model="usernameModel" placeholder="如 root" />
              </el-form-item>

              <el-form-item label="基础目录">
                <ScInput
                  v-model="baseDirectoryModel"
                  :placeholder="
                    form.serverType === 'LOCAL'
                      ? '本机自动使用默认根目录'
                      : normalizeOs(form.osType) === 'windows'
                        ? '默认 C:/'
                        : '默认 /'
                  "
                />
              </el-form-item>

              <el-form-item
                v-if="form.serverType !== 'LOCAL'"
                label="密码"
                class="server-form-dialog__span-2"
              >
                <ScInput
                  v-model="passwordModel"
                  type="password"
                  placeholder="LOCAL 可留空"
                  passwd-strong="none"
                />
              </el-form-item>

              <el-form-item
                v-if="form.serverType === 'SSH'"
                label="私钥"
                class="server-form-dialog__span-2"
              >
                <ScInput
                  v-model="privateKeyModel"
                  type="textarea"
                  :rows="4"
                  placeholder="SSH 服务器可填写私钥"
                />
              </el-form-item>

              <el-form-item label="标签" class="server-form-dialog__span-2">
                <ServerTagInput
                  v-model="tagsListModel"
                  :suggestions="tagSuggestions"
                />
                <p class="server-form-dialog__hint">
                  标签会自动去重，并同步为后端逗号串。
                </p>
              </el-form-item>

              <el-form-item label="描述" class="server-form-dialog__span-2">
                <ScInput v-model="descriptionModel" type="textarea" :rows="3" />
              </el-form-item>
            </div>
          </div>
        </el-collapse-transition>
      </el-form>
    </div>

    <template #footer>
      <el-button @click="emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="emit('submit')">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ScInput from "@repo/components/ScInput/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import type { ServerHost } from "../api";
import type { SelectOption } from "./server-types";
import { normalizeOs, osIcon } from "../utils/serverHost";
import ServerTagInput from "./ServerTagInput.vue";

const advancedVisible = ref(false);

const props = defineProps<{
  modelValue: boolean;
  editingId: number | null;
  form: ServerHost;
  saving?: boolean;
  codePreview: string;
  serverTypeOptions: SelectOption[];
  osTypeOptions: SelectOption[];
  architectureOptions: SelectOption[];
  tagSuggestions: string[];
}>();

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  "update:form": [value: ServerHost];
  submit: [];
}>();

const updateForm = (patch: Partial<ServerHost>) => {
  emit("update:form", {
    ...props.form,
    ...patch,
  });
};

const resolveDefaultPort = (serverType?: ServerHost["serverType"]) => {
  if (serverType === "WINRM") {
    return 5985;
  }
  if (serverType === "SSH") {
    return 22;
  }
  return 0;
};

const serverNameModel = computed({
  get: () => props.form.serverName || "",
  set: (value: string) => {
    updateForm({ serverName: value });
  },
});

const serverTypeModel = computed({
  get: () => props.form.serverType || "LOCAL",
  set: (value: string | number) => {
    updateForm({
      serverType: String(value || "LOCAL") as ServerHost["serverType"],
    });
  },
});

const enabledModel = computed({
  get: () => props.form.enabled !== false,
  set: (value: boolean) => {
    updateForm({ enabled: value });
  },
});

const hostModel = computed({
  get: () => props.form.host || "",
  set: (value: string) => {
    updateForm({ host: value });
  },
});

const portModel = computed({
  get: () =>
    props.form.serverType === "LOCAL"
      ? 0
      : Number(props.form.port || resolveDefaultPort(props.form.serverType)),
  set: (value: number | string) => {
    const numeric = Number(value || 0);
    updateForm({
      port:
        props.form.serverType === "LOCAL"
          ? 0
          : Number.isFinite(numeric) && numeric > 0
            ? numeric
            : resolveDefaultPort(props.form.serverType),
    });
  },
});

const osTypeModel = computed({
  get: () => props.form.osType || "",
  set: (value: string | number) => {
    updateForm({ osType: String(value || "") });
  },
});

const architectureModel = computed({
  get: () => props.form.architecture || "",
  set: (value: string | number) => {
    updateForm({ architecture: String(value || "") });
  },
});

const usernameModel = computed({
  get: () => props.form.username || "",
  set: (value: string) => {
    updateForm({ username: value });
  },
});

const baseDirectoryModel = computed({
  get: () => props.form.baseDirectory || defaultBaseDirectory.value,
  set: (value: string) => {
    updateForm({ baseDirectory: value?.trim() || defaultBaseDirectory.value });
  },
});

const passwordModel = computed({
  get: () => props.form.password || "",
  set: (value: string) => {
    updateForm({ password: value });
  },
});

const privateKeyModel = computed({
  get: () => props.form.privateKey || "",
  set: (value: string) => {
    updateForm({ privateKey: value });
  },
});

const tagsListModel = computed({
  get: () => props.form.tagsList || [],
  set: (value: string[]) => {
    updateForm({ tagsList: value });
  },
});

const descriptionModel = computed({
  get: () => props.form.description || "",
  set: (value: string) => {
    updateForm({ description: value });
  },
});

const defaultBaseDirectory = computed(() =>
  normalizeOs(props.form.osType) === "windows" ? "C:/" : "/",
);

const displayBaseDirectory = computed(
  () => props.form.baseDirectory || defaultBaseDirectory.value,
);

const connectionHint = computed(() => {
  if (props.form.serverType === "LOCAL") {
    return "本机自动识别地址/端口/账号";
  }
  if (props.form.serverType === "WINRM") {
    return `WinRM 默认端口 ${props.form.port || 5985}`;
  }
  return `SSH 默认端口 ${props.form.port || 22}`;
});
</script>

<style scoped lang="scss">
.server-form-dialog {
  display: grid;
  gap: 18px;
}

.server-form-dialog__hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  border-radius: 24px;
  margin-bottom: 18px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--el-color-primary) 10%, white),
    color-mix(in srgb, var(--el-fill-color-light) 84%, white)
  );
  border: 1px solid color-mix(in srgb, var(--el-border-color) 70%, transparent);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.05);
}

.server-form-dialog__badge {
  width: 56px;
  height: 56px;
  border-radius: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  background: linear-gradient(145deg, #64748b, #334155);
}

.server-form-dialog__badge.is-windows {
  background: linear-gradient(145deg, #60a5fa, #2563eb);
}

.server-form-dialog__badge.is-linux {
  background: linear-gradient(145deg, #f59e0b, #d97706);
}

.server-form-dialog__badge.is-macos {
  background: linear-gradient(145deg, #94a3b8, #475569);
}

.server-form-dialog__hero h3 {
  margin: 0;
  font-size: 18px;
}

.server-form-dialog__hero p,
.server-form-dialog__hint {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.server-form-dialog__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 18px;
  overflow: visible;
}

.server-form-dialog__summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: -6px;
}

.server-form-dialog__summary-chip {
  display: inline-flex;
  align-items: center;
  width: 100%;
  min-height: 30px;
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
  background: color-mix(in srgb, var(--el-fill-color-light) 92%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  box-shadow: 0 10px 20px rgba(15, 23, 42, 0.03);
}

.server-form-dialog__summary-chip.is-primary {
  color: var(--el-color-primary);
  background: color-mix(in srgb, var(--el-color-primary) 12%, white);
  border-color: color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.server-form-dialog__summary-chip.is-muted {
  color: var(--el-text-color-secondary);
}

.server-form-dialog__span-2 {
  grid-column: span 2;
}

:deep(.el-dialog__body) {
  overflow: visible;
}

:deep(.el-dialog) {
  border-radius: 26px;
  overflow: hidden;
  box-shadow: 0 28px 60px rgba(15, 23, 42, 0.14);
}

.server-form-dialog__advanced-trigger {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.server-form-dialog__advanced {
  margin-top: 8px;
  padding: 18px;
  border-radius: 22px;
  background: color-mix(in srgb, var(--el-bg-color-page) 88%, white);
  border: 1px solid color-mix(in srgb, var(--el-border-color) 72%, transparent);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

.server-form-dialog__auto-panel {
  display: grid;
  gap: 4px;
  min-height: 40px;
  padding: 10px 14px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--el-color-primary) 8%, white);
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 16%, transparent);
}

.server-form-dialog__auto-panel strong {
  color: var(--el-text-color-primary);
}

.server-form-dialog__auto-panel span {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.server-form-dialog__form :deep(.el-form-item) {
  margin-bottom: 14px;
}

.server-form-dialog__select {
  width: 100%;
}

.server-form-dialog__select :deep(.sc-select) {
  width: 100%;
}

.server-form-dialog__select :deep(.pill-selector-flex) {
  gap: 8px;
}

.server-form-dialog__select :deep(.pill-selector-item) {
  min-height: 38px;
}

@media (max-width: 900px) {
  .server-form-dialog__summary {
    grid-template-columns: 1fr;
  }

  .server-form-dialog__grid {
    grid-template-columns: 1fr;
  }

  .server-form-dialog__span-2 {
    grid-column: span 1;
  }

  .server-form-dialog__hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
