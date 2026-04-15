<template>
  <section class="hub-shell">
    <header class="hub-toolbar">
      <div class="hub-toolbar__title">
        <small>Panel Workspace Hub</small>
        <strong>数据源管理</strong>
        <span
          >工作台只能从已保存的数据源进入，连接配置已为 JDBC / Redis
          预留。</span
        >
      </div>

      <div class="hub-toolbar__actions">
        <label class="hub-search">
          <ElIcon><Search /></ElIcon>
          <ElInput
            :model-value="keyword"
            clearable
            placeholder="搜索名称 / 主机 / 数据库"
            @update:model-value="keyword = String($event || '')"
          />
        </label>
        <ElButton circle :icon="RefreshRight" @click="keyword = ''" />
        <ElButton type="primary" @click="openCreateDialog">
          <ElIcon><Plus /></ElIcon>
          新建数据源
        </ElButton>
      </div>
    </header>

    <div class="hub-summary">
      <article class="summary-chip">
        <small>已保存</small>
        <strong>{{ sourceList.length }}</strong>
      </article>
      <article class="summary-chip">
        <small>缓存连接</small>
        <strong>{{ cachedCount }}</strong>
      </article>
      <article class="summary-chip">
        <small>收藏</small>
        <strong>{{ favoriteCount }}</strong>
      </article>
    </div>

    <ScTable
      class="hub-card-table"
      layout="card"
      row-key="sourceId"
      :col-size="5"
      :page-size="12"
      :data="sourceTableData"
    >
      <template #default="{ row }">
        <article class="source-card" @dblclick="$emit('open-source', row)">
          <div class="source-card__head">
            <div class="source-card__identity">
              <span class="source-card__avatar">
                <ElIcon>
                  <component :is="sourceAvatarIcon(row.sourceType)" />
                </ElIcon>
              </span>
              <div>
                <strong>{{ row.connectionName }}</strong>
                <span
                  >{{ row.host }}:{{ row.port }} /
                  {{ row.databaseName || "-" }}</span
                >
              </div>
            </div>

            <button
              class="source-card__favorite"
              :class="{ 'source-card__favorite--active': row.favorite }"
              type="button"
              @click.stop="$emit('toggle-favorite', row.sourceId)"
            >
              <ElIcon><Star /></ElIcon>
            </button>
          </div>

          <div class="source-card__strip">
            <ScTag class="source-card__type" effect="plain">
              {{ row.sourceType }}
            </ScTag>
            <span class="source-card__updated">
              最近更新 {{ formatTime(row.updatedAt) }}
            </span>
          </div>

          <dl class="source-card__facts">
            <div class="source-card__fact">
              <dt>地址</dt>
              <dd>{{ row.host }}:{{ row.port }}</dd>
            </div>
            <div class="source-card__fact">
              <dt>{{ row.sourceType === "REDIS" ? "目录" : "数据库" }}</dt>
              <dd>{{ row.databaseName || "未指定" }}</dd>
            </div>
            <div class="source-card__fact">
              <dt>账号</dt>
              <dd>{{ row.username || "未填写" }}</dd>
            </div>
          </dl>

          <p class="source-card__note">
            {{ row.note || "未填写备注，建议记录用途、权限边界和 owner。" }}
          </p>

          <div class="source-card__footer">
            <ElButton
              class="source-card__open"
              :disabled="row.sourceType !== 'JDBC'"
              type="primary"
              @click.stop="$emit('open-source', row)"
            >
              <ElIcon><FolderOpened /></ElIcon>
              打开工作台
            </ElButton>
            <div class="source-card__actions">
              <ElButton text @click.stop="openEditDialog(row)">
                <ElIcon><EditPen /></ElIcon>
                编辑
              </ElButton>
              <ElButton
                text
                type="danger"
                @click.stop="$emit('delete-source', row.sourceId)"
              >
                <ElIcon><Delete /></ElIcon>
                删除
              </ElButton>
            </div>
          </div>
        </article>
      </template>

      <template #empty>
        <div class="hub-empty">
          <ElEmpty description="先保存一个数据源，再从这里进入工作台。" />
        </div>
      </template>
    </ScTable>

    <ScDialog
      v-model="dialogVisible"
      :border-radius="28"
      width="760px"
      title="连接配置"
      mode="element"
      :show-confirm-button="false"
      :show-cancel-button="false"
      :show-footer="false"
    >
      <div class="dialog-shell">
        <div class="dialog-grid">
          <label class="field">
            <span class="field__label field__label--required">数据源类型</span>
            <ElSelect
              :model-value="modelValue.sourceType"
              placeholder="选择数据源类型"
              @update:model-value="handleSourceTypeChange(String($event || 'JDBC'))"
            >
              <ElOption
                v-for="option in sourceTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.sourceType }"
            >
              {{ fieldErrors.sourceType || " " }}
            </small>
          </label>

          <label v-if="isJdbcSource" class="field field--full">
            <span class="field__label field__label--required">数据库类型</span>
            <ScSelect
              :model-value="modelValue.jdbcDialectType"
              :columns="3"
              :gap="10"
              :options="jdbcDialectOptions"
              layout="icon"
              @update:model-value="handleJdbcDialectChange(String($event || 'MYSQL'))"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.jdbcDialectType }"
            >
              {{ fieldErrors.jdbcDialectType || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label field__label--required">名称</span>
            <ElInput
              :model-value="modelValue.connectionName"
              placeholder="例如：生产 MySQL / 财务库"
              @update:model-value="updateField('connectionName', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.connectionName }"
            >
              {{ fieldErrors.connectionName || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label field__label--required">主机</span>
            <ElInput
              :model-value="modelValue.host"
              placeholder="172.16.0.40"
              @update:model-value="updateField('host', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.host }"
            >
              {{ fieldErrors.host || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label field__label--required">端口</span>
            <ElInputNumber
              :controls="false"
              :min="0"
              :model-value="modelValue.port"
              @update:model-value="updateNumberField('port', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.port }"
            >
              {{ fieldErrors.port || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label">{{ databaseLabel }}</span>
            <ElInput
              :model-value="modelValue.databaseName"
              :placeholder="databasePlaceholder"
              @update:model-value="updateField('databaseName', $event)"
            />
          </label>

          <label class="field field--full">
            <span class="field__label">{{ protocolLabel }}</span>
            <ElInput
              :model-value="modelValue.protocol"
              :placeholder="protocolPlaceholder"
              @update:model-value="updateField('protocol', $event)"
            />
          </label>

          <label v-if="isJdbcSource" class="field field--full">
            <span class="field__label field__label--required">驱动类</span>
            <ElSelect
              :model-value="modelValue.driverClassName"
              allow-create
              default-first-option
              filterable
              placeholder="选择或输入 JDBC Driver"
              @update:model-value="updateField('driverClassName', String($event || ''))"
            >
              <ElOption
                v-for="option in driverClassOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.driverClassName }"
            >
              {{ fieldErrors.driverClassName || " " }}
            </small>
          </label>

          <label v-if="isJdbcSource" class="field field--full">
            <span class="field__label">驱动包</span>
            <div class="field__upload">
              <ElUpload
                :auto-upload="false"
                :show-file-list="false"
                accept=".jar"
                :before-upload="handleBeforeDriverUpload"
              >
                <ElButton :loading="uploadingDriver" plain>
                  上传驱动包
                </ElButton>
              </ElUpload>

              <div class="field__upload-meta">
                <ScTag
                  v-if="modelValue.driverJarName"
                  class="field__driver-tag"
                  effect="plain"
                  type="success"
                >
                  {{ modelValue.driverJarName }}
                </ScTag>
                <small>服务器没有内置驱动时上传 jar，连接会优先使用它。</small>
                <ElButton
                  v-if="modelValue.driverJarPath"
                  link
                  type="danger"
                  @click="clearDriverJar"
                >
                  移除驱动包
                </ElButton>
              </div>
            </div>
          </label>

          <label class="field">
            <span
              class="field__label"
              :class="{
                'field__label--required': isUsernameRequired,
              }"
            >
              用户名
            </span>
            <ElInput
              :model-value="modelValue.username"
              placeholder="root"
              @update:model-value="updateField('username', $event)"
            />
            <small
              class="field__error"
              :class="{ 'field__error--hidden': !fieldErrors.username }"
            >
              {{ fieldErrors.username || " " }}
            </small>
          </label>

          <label class="field">
            <span class="field__label">密码</span>
            <ElInput
              :model-value="modelValue.password"
              placeholder="请输入连接密码"
              show-password
              type="password"
              @update:model-value="updateField('password', $event)"
            />
            <small class="field__error field__error--hidden"> </small>
          </label>

          <label class="field field--full">
            <span>备注</span>
            <ElInput
              :autosize="{ minRows: 3, maxRows: 5 }"
              :model-value="modelValue.note || ''"
              placeholder="建议记录用途、权限边界、owner 和风险说明。"
              type="textarea"
              @update:model-value="updateField('note', $event)"
            />
          </label>
        </div>

        <div class="dialog-footer">
          <span>
            带 <strong>*</strong> 为必填。保存后才允许进入工作台，非 JDBC
            类型当前仅保留配置入口。
          </span>
          <div class="dialog-footer__actions">
            <ElButton @click="dialogVisible = false">取消</ElButton>
            <ElButton :loading="submitting" type="primary" @click="handleSave">
              保存数据源
            </ElButton>
          </div>
        </div>
      </div>
    </ScDialog>
  </section>
</template>

<script setup lang="ts">
import {
  Coin,
  Delete,
  EditPen,
  FolderOpened,
  Plus,
  RefreshRight,
  Search,
  SetUp,
  Star,
} from "@element-plus/icons-vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
import ScSelect from "@repo/components/ScSelect/index.vue";
import ScTable from "@repo/components/ScTable/index.vue";
import ScTag from "@repo/components/ScTag/src/index.vue";
import {
  ElButton,
  ElEmpty,
  ElIcon,
  ElInput,
  ElInputNumber,
  ElOption,
  ElSelect,
  ElUpload,
} from "element-plus";
import { computed, reactive, ref } from "vue";
import type { JdbcConnectionForm, PanelSavedSource } from "../panel";

const props = defineProps<{
  cachedCount: number;
  modelValue: JdbcConnectionForm;
  sources: PanelSavedSource[];
  submitting: boolean;
  uploadingDriver: boolean;
}>();

const emit = defineEmits<{
  (e: "delete-source", sourceId: string): void;
  (e: "edit-source", source: PanelSavedSource): void;
  (e: "open-source", source: PanelSavedSource): void;
  (e: "reset-form"): void;
  (e: "save-source"): void;
  (e: "toggle-favorite", sourceId: string): void;
  (e: "upload-driver", file: File): void;
  (e: "update:modelValue", value: JdbcConnectionForm): void;
}>();

const dialogVisible = ref(false);
const keyword = ref("");
const fieldErrors = reactive<Record<string, string>>({
  sourceType: "",
  jdbcDialectType: "",
  connectionName: "",
  host: "",
  port: "",
  driverClassName: "",
  username: "",
});

const sourceTypeOptions = [
  { label: "JDBC / SQL", value: "JDBC" },
  { label: "Redis", value: "REDIS" },
] as const;

const jdbcDialectOptions = [
  {
    label: "MySQL",
    value: "MYSQL",
    icon: "logos:mysql",
    description: "MySQL / Percona",
    defaultPort: 3306,
    driverClassName: "com.mysql.cj.jdbc.Driver",
  },
  {
    label: "MariaDB",
    value: "MARIADB",
    icon: "simple-icons:mariadb",
    description: "MariaDB",
    defaultPort: 3306,
    driverClassName: "org.mariadb.jdbc.Driver",
  },
  {
    label: "Oracle",
    value: "ORACLE",
    icon: "simple-icons:oracle",
    description: "Oracle / OJDBC",
    defaultPort: 1521,
    driverClassName: "oracle.jdbc.OracleDriver",
  },
  {
    label: "PostgreSQL",
    value: "POSTGRESQL",
    icon: "logos:postgresql",
    description: "PostgreSQL",
    defaultPort: 5432,
    driverClassName: "org.postgresql.Driver",
  },
  {
    label: "SQL Server",
    value: "SQLSERVER",
    icon: "simple-icons:microsoftsqlserver",
    description: "Microsoft SQL Server",
    defaultPort: 1433,
    driverClassName: "com.microsoft.sqlserver.jdbc.SQLServerDriver",
  },
  {
    label: "ClickHouse",
    value: "CLICKHOUSE",
    icon: "simple-icons:clickhouse",
    description: "ClickHouse",
    defaultPort: 8123,
    driverClassName: "com.clickhouse.jdbc.ClickHouseDriver",
  },
] as const;

const sourceList = computed(() =>
  (Array.isArray(props.sources) ? props.sources : []).filter(
    (source): source is PanelSavedSource => {
      if (!source || typeof source !== "object") {
        return false;
      }
      const term = keyword.value.trim().toLowerCase();
      if (!term) {
        return true;
      }
      return [
        source.connectionName,
        source.host,
        source.databaseName,
        source.username,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term));
    }
  )
);

const sourceTableData = computed(() => ({
  data: sourceList.value,
  total: sourceList.value.length,
}));

const favoriteCount = computed(
  () => sourceList.value.filter((source) => source.favorite).length
);

const isJdbcSource = computed(() => props.modelValue.sourceType === "JDBC");

const currentDialectPreset = computed(
  () =>
    jdbcDialectOptions.find(
      option => option.value === props.modelValue.jdbcDialectType
    ) || jdbcDialectOptions[0]
);

const databaseLabel = computed(() =>
  props.modelValue.sourceType === "REDIS"
    ? "DB Index"
    : props.modelValue.jdbcDialectType === "ORACLE"
      ? "服务名 / SID"
      : "数据库"
);

const databasePlaceholder = computed(() =>
  props.modelValue.sourceType === "REDIS"
    ? "例如：0"
    : props.modelValue.jdbcDialectType === "ORACLE"
      ? "例如：xe / orcl / service_name"
      : "例如：mysql / analytics"
);

const protocolLabel = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "连接地址" : "JDBC URL"
);

const protocolPlaceholder = computed(() =>
  props.modelValue.sourceType === "REDIS"
    ? "redis://127.0.0.1:6379/0"
    : "可留空，后端会按数据库类型自动拼装 JDBC URL"
);
const isUsernameRequired = computed(() => props.modelValue.sourceType === "JDBC");

const driverClassOptions = computed(() => {
  const options = jdbcDialectOptions.map(option => ({
    label: `${option.label} · ${option.driverClassName}`,
    value: option.driverClassName,
  }));
  const currentValue = String(props.modelValue.driverClassName || "").trim();
  if (currentValue && !options.some(option => option.value === currentValue)) {
    options.unshift({
      label: `当前驱动 · ${currentValue}`,
      value: currentValue,
    });
  }
  return options;
});

const formatTime = (value?: string) =>
  value ? value.replace("T", " ").slice(0, 16) : "未记录";
const sourceAvatarIcon = (type?: string) => (type === "REDIS" ? SetUp : Coin);

const updateField = <K extends keyof JdbcConnectionForm>(
  key: K,
  value: JdbcConnectionForm[K]
) => {
  if (key in fieldErrors) {
    fieldErrors[String(key)] = "";
  }
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
};

const handleSourceTypeChange = (value: string) => {
  const nextSourceType = value === "REDIS" ? "REDIS" : "JDBC";
  fieldErrors.sourceType = "";
  if (nextSourceType === "REDIS") {
    emit("update:modelValue", {
      ...props.modelValue,
      sourceType: nextSourceType,
    });
    return;
  }
  emit("update:modelValue", {
    ...props.modelValue,
    sourceType: "JDBC",
    jdbcDialectType: props.modelValue.jdbcDialectType || currentDialectPreset.value.value,
    driverClassName:
      props.modelValue.driverClassName || currentDialectPreset.value.driverClassName,
    port:
      Number(props.modelValue.port) > 0
        ? props.modelValue.port
        : currentDialectPreset.value.defaultPort,
  });
};

const handleJdbcDialectChange = (value: string) => {
  const nextPreset =
    jdbcDialectOptions.find(option => option.value === value) || jdbcDialectOptions[0];
  const previousPreset = currentDialectPreset.value;
  fieldErrors.jdbcDialectType = "";
  emit("update:modelValue", {
    ...props.modelValue,
    jdbcDialectType: nextPreset.value,
    driverClassName:
      !props.modelValue.driverClassName ||
      props.modelValue.driverClassName === previousPreset.driverClassName
        ? nextPreset.driverClassName
        : props.modelValue.driverClassName,
    port:
      !props.modelValue.port || props.modelValue.port === previousPreset.defaultPort
        ? nextPreset.defaultPort
        : props.modelValue.port,
  });
};

const updateNumberField = (
  key: keyof JdbcConnectionForm,
  value: number | null | undefined
) => {
  if (key in fieldErrors) {
    fieldErrors[String(key)] = "";
  }
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: Number(value || 0),
  });
};

const validateForm = () => {
  fieldErrors.sourceType = props.modelValue.sourceType ? "" : "请选择数据源类型";
  fieldErrors.jdbcDialectType =
    !isJdbcSource.value || String(props.modelValue.jdbcDialectType || "").trim()
      ? ""
      : "请选择数据库类型";
  fieldErrors.connectionName = String(props.modelValue.connectionName || "").trim()
    ? ""
    : "请输入数据源名称";
  fieldErrors.host = String(props.modelValue.host || "").trim()
    ? ""
    : "请输入主机地址";
  fieldErrors.port =
    Number(props.modelValue.port) > 0 ? "" : "请输入有效端口";
  fieldErrors.driverClassName =
    !isJdbcSource.value || String(props.modelValue.driverClassName || "").trim()
      ? ""
      : "请选择 JDBC 驱动类";
  fieldErrors.username =
    !isUsernameRequired.value || String(props.modelValue.username || "").trim()
      ? ""
      : "JDBC 数据源必须填写用户名";

  return !Object.values(fieldErrors).some(Boolean);
};

const openCreateDialog = () => {
  emit("reset-form");
  dialogVisible.value = true;
};

const openEditDialog = (source: PanelSavedSource) => {
  emit("edit-source", source);
  dialogVisible.value = true;
};

const handleSave = () => {
  if (!validateForm()) {
    return;
  }
  emit("save-source");
  dialogVisible.value = false;
};

const handleBeforeDriverUpload = (file: File) => {
  emit("upload-driver", file);
  return false;
};

const clearDriverJar = () => {
  emit("update:modelValue", {
    ...props.modelValue,
    driverJarName: "",
    driverJarPath: "",
  });
};
</script>

<style scoped lang="scss">
.hub-shell {
  display: grid;
  gap: 18px;
  min-height: 100%;
  padding: 18px;
  background:
    radial-gradient(
      circle at top left,
      rgba(29, 78, 216, 0.08),
      transparent 36%
    ),
    radial-gradient(
      circle at top right,
      rgba(14, 165, 233, 0.08),
      transparent 32%
    ),
    linear-gradient(180deg, #f6f9fc, #eef4f8);
}

.hub-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.hub-toolbar__title {
  display: grid;
  gap: 4px;
}

.hub-toolbar__title small {
  color: #688194;
  font-size: 11px;
  letter-spacing: 0.08em;
}

.hub-toolbar__title strong {
  color: #0f2534;
  font-size: 28px;
  line-height: 1.1;
}

.hub-toolbar__title span {
  color: #688194;
  font-size: 13px;
}

.hub-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.hub-search {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 320px;
  padding: 0 12px;
  border: 1px solid rgba(125, 142, 154, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
}

.hub-search :deep(.el-input__wrapper) {
  box-shadow: none;
  background: transparent;
}

.hub-summary {
  display: flex;
  gap: 12px;
}

.summary-chip {
  display: grid;
  gap: 4px;
  min-width: 140px;
  padding: 12px 14px;
  border: 1px solid rgba(121, 138, 149, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.9);
}

.summary-chip small {
  color: #718898;
  font-size: 11px;
}

.summary-chip strong {
  color: #102534;
  font-size: 22px;
  line-height: 1;
}

.hub-card-table {
  min-height: 0;
  padding: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.hub-card-table :deep(.card-view-container) {
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
}

.hub-card-table :deep(.card-item-wrapper) {
  padding: 0;
  background: transparent;
  border: 0 !important;
  box-shadow: none !important;
}

.hub-card-table :deep(.card-content-wrapper) {
  height: 100%;
  padding: 0 !important;
  background: transparent !important;
  border: 0 !important;
}

.hub-card-table :deep(.card-inner),
.hub-card-table :deep(.card-inner.card-default),
.hub-card-table :deep(.card-inner.theme--default),
.hub-card-table :deep(.card-inner.card-default.theme--default) {
  padding: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  border: 0 !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
}

.source-card {
  display: grid;
  gap: 12px;
  width: min(100%, 348px);
  min-height: 228px;
  margin: 0 auto;
  padding: 16px;
  border: 1px solid rgba(127, 144, 155, 0.14);
  border-radius: 22px;
  background:
    radial-gradient(
      circle at top right,
      rgba(59, 130, 246, 0.14),
      transparent 34%
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.99), rgba(244, 248, 251, 0.96));
  box-shadow: 0 16px 34px rgba(15, 37, 52, 0.08);
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease;
}

.source-card:hover {
  border-color: rgba(59, 130, 246, 0.24);
  box-shadow: 0 20px 38px rgba(15, 37, 52, 0.12);
  transform: translateY(-2px);
}

.source-card__head,
.source-card__footer,
.source-card__identity,
.source-card__strip,
.source-card__actions {
  display: flex;
  align-items: center;
}

.source-card__head,
.source-card__footer {
  justify-content: space-between;
  gap: 10px;
}

.source-card__identity {
  gap: 12px;
  min-width: 0;
}

.source-card__identity > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.source-card__identity strong {
  color: #102534;
  font-size: 15px;
  line-height: 1.2;
}

.source-card__identity span,
.source-card__note {
  color: #6e8595;
  font-size: 12px;
}

.source-card__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 13px;
  background: linear-gradient(135deg, #0f4c81, #38bdf8);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.24);
}

.source-card__avatar :deep(.el-icon) {
  color: #fff;
  font-size: 18px;
}

.source-card__favorite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 1px solid rgba(245, 158, 11, 0.18);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  color: #f59e0b;
  cursor: pointer;
}

.source-card__favorite--active {
  background: rgba(245, 158, 11, 0.16);
  color: #c2410c;
}

.source-card__strip {
  justify-content: space-between;
  gap: 10px;
}

.source-card__type {
  border-color: rgba(59, 130, 246, 0.2);
  background: rgba(59, 130, 246, 0.08);
  color: #0f4c81;
}

.source-card__updated {
  color: #7a8f9d;
  font-size: 11px;
  white-space: nowrap;
}

.source-card__facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin: 0;
}

.source-card__fact {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px;
  border: 1px solid rgba(127, 144, 155, 0.12);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.source-card__fact dt {
  color: #7b8f9d;
  font-size: 11px;
}

.source-card__fact dd {
  margin: 0;
  overflow: hidden;
  color: #132c3e;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.source-card__note {
  min-height: 48px;
  margin: 0;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(240, 245, 249, 0.9);
  line-height: 1.6;
}

.source-card__footer {
  margin-top: auto;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
}

.source-card__open {
  width: 100%;
  border-radius: 14px;
}

.source-card__actions {
  justify-content: space-between;
  gap: 8px;
}

.source-card__actions :deep(.el-button) {
  margin: 0;
  padding-inline: 0;
}

.hub-empty {
  display: grid;
  place-items: center;
  min-height: 320px;
}

.dialog-shell {
  display: grid;
  gap: 18px;
}

.dialog-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.field {
  display: grid;
  gap: 8px;
  grid-template-rows: auto minmax(42px, auto) 16px;
}

.field__label {
  color: #60798a;
  font-size: 12px;
}

.field__label--required::after {
  content: " *";
  color: #dc2626;
}

.field__error {
  min-height: 16px;
  color: #dc2626;
  font-size: 12px;
  line-height: 1.4;
}

.field__error--hidden {
  visibility: hidden;
}

.field--full {
  grid-column: 1 / -1;
}

.field :deep(.el-input-number),
.field :deep(.el-select) {
  width: 100%;
}

.field :deep(.el-input__wrapper),
.field :deep(.el-select__wrapper),
.field :deep(.el-textarea__inner),
.field :deep(.el-input-number .el-input__wrapper) {
  min-height: 42px;
  border-radius: 18px;
}

.field :deep(.el-textarea__inner) {
  padding: 12px 14px;
}

.field__upload {
  display: grid;
  gap: 10px;
}

.field__upload-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.field__upload-meta small {
  color: #688194;
  line-height: 1.5;
}

.field__driver-tag {
  max-width: 100%;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 4px;
}

.dialog-footer span {
  color: #6f8796;
  font-size: 12px;
}

.dialog-footer__actions {
  display: flex;
  gap: 10px;
}

@media (max-width: 960px) {
  .hub-toolbar,
  .dialog-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .hub-toolbar__actions,
  .hub-search,
  .dialog-footer__actions {
    width: 100%;
  }

  .hub-summary {
    flex-wrap: wrap;
  }

  .source-card {
    width: 100%;
  }

  .source-card__facts {
    grid-template-columns: 1fr;
  }

  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
