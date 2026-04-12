<template>
  <section class="hub-shell">
    <header class="hub-toolbar">
      <div class="hub-toolbar__title">
        <small>Panel Workspace Hub</small>
        <strong>数据源管理</strong>
        <span>工作台只能从已保存的数据源进入，连接配置已为 JDBC / Redis 预留。</span>
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
      :col-size="3"
      :page-size="12"
      :data="sourceTableData"
    >
      <template #default="{ row }">
        <article class="source-card" @dblclick="$emit('open-source', row)">
          <div class="source-card__head">
            <div class="source-card__identity">
              <span class="source-card__avatar">{{ sourceInitial(row.connectionName) }}</span>
              <div>
                <strong>{{ row.connectionName }}</strong>
                <span>{{ row.host }}:{{ row.port }} / {{ row.databaseName || "-" }}</span>
              </div>
            </div>

            <button
              class="source-card__favorite"
              type="button"
              @click.stop="$emit('toggle-favorite', row.sourceId)"
            >
              <ElIcon><Star /></ElIcon>
            </button>
          </div>

          <div class="source-card__meta">
            <ScTag effect="plain">{{ row.sourceType }}</ScTag>
            <ScTag effect="plain">{{ row.username || "-" }}</ScTag>
            <ScTag effect="plain">{{ formatTime(row.updatedAt) }}</ScTag>
          </div>

          <p class="source-card__note">
            {{ row.note || "未填写备注，建议记录用途、权限边界和 owner。" }}
          </p>

          <div class="source-card__footer">
            <ElButton
              :disabled="row.sourceType !== 'JDBC'"
              type="primary"
              @click.stop="$emit('open-source', row)"
            >
              <ElIcon><FolderOpened /></ElIcon>
              打开工作台
            </ElButton>
            <ElButton @click.stop="openEditDialog(row)">
              <ElIcon><EditPen /></ElIcon>
              编辑
            </ElButton>
            <ElButton type="danger" plain @click.stop="$emit('delete-source', row.sourceId)">
              <ElIcon><Delete /></ElIcon>
              删除
            </ElButton>
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
            <span>数据源类型</span>
            <ElSelect
              :model-value="modelValue.sourceType"
              placeholder="选择数据源类型"
              @update:model-value="updateField('sourceType', $event)"
            >
              <ElOption
                v-for="option in sourceTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </label>

          <label class="field">
            <span>名称</span>
            <ElInput
              :model-value="modelValue.connectionName"
              placeholder="例如：生产 MySQL / 财务库"
              @update:model-value="updateField('connectionName', $event)"
            />
          </label>

          <label class="field">
            <span>主机</span>
            <ElInput
              :model-value="modelValue.host"
              placeholder="172.16.0.40"
              @update:model-value="updateField('host', $event)"
            />
          </label>

          <label class="field">
            <span>端口</span>
            <ElInputNumber
              :controls="false"
              :min="0"
              :model-value="modelValue.port"
              @update:model-value="updateNumberField('port', $event)"
            />
          </label>

          <label class="field">
            <span>{{ databaseLabel }}</span>
            <ElInput
              :model-value="modelValue.databaseName"
              :placeholder="databasePlaceholder"
              @update:model-value="updateField('databaseName', $event)"
            />
          </label>

          <label class="field field--full">
            <span>{{ protocolLabel }}</span>
            <ElInput
              :model-value="modelValue.protocol"
              :placeholder="protocolPlaceholder"
              @update:model-value="updateField('protocol', $event)"
            />
          </label>

          <label class="field">
            <span>用户名</span>
            <ElInput
              :model-value="modelValue.username"
              placeholder="root"
              @update:model-value="updateField('username', $event)"
            />
          </label>

          <label class="field">
            <span>密码</span>
            <ElInput
              :model-value="modelValue.password"
              placeholder="请输入连接密码"
              show-password
              type="password"
              @update:model-value="updateField('password', $event)"
            />
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
          <span>保存后才允许进入工作台。非 JDBC 类型当前仅保留配置入口。</span>
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
import { Delete, EditPen, FolderOpened, Plus, RefreshRight, Search, Star } from "@element-plus/icons-vue";
import ScDialog from "@repo/components/ScDialog/src/index.vue";
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
} from "element-plus";
import { computed, ref } from "vue";
import type { JdbcConnectionForm, PanelSavedSource } from "../panel";

const props = defineProps<{
  cachedCount: number;
  modelValue: JdbcConnectionForm;
  sources: PanelSavedSource[];
  submitting: boolean;
}>();

const emit = defineEmits<{
  (e: "delete-source", sourceId: string): void;
  (e: "edit-source", source: PanelSavedSource): void;
  (e: "open-source", source: PanelSavedSource): void;
  (e: "reset-form"): void;
  (e: "save-source"): void;
  (e: "toggle-favorite", sourceId: string): void;
  (e: "update:modelValue", value: JdbcConnectionForm): void;
}>();

const dialogVisible = ref(false);
const keyword = ref("");

const sourceTypeOptions = [
  { label: "JDBC / SQL", value: "JDBC" },
  { label: "Redis", value: "REDIS" },
] as const;

const sourceList = computed(() =>
  (Array.isArray(props.sources) ? props.sources : []).filter((source): source is PanelSavedSource => {
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
      .some(value => String(value).toLowerCase().includes(term));
  }),
);

const sourceTableData = computed(() => ({
  data: sourceList.value,
  total: sourceList.value.length,
}));

const favoriteCount = computed(
  () => sourceList.value.filter(source => source.favorite).length,
);

const databaseLabel = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "DB Index" : "数据库",
);

const databasePlaceholder = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "例如：0" : "例如：mysql / analytics",
);

const protocolLabel = computed(() =>
  props.modelValue.sourceType === "REDIS" ? "连接地址" : "JDBC URL",
);

const protocolPlaceholder = computed(() =>
  props.modelValue.sourceType === "REDIS"
    ? "redis://127.0.0.1:6379/0"
    : "可留空，后端按 host/port/database 组合",
);

const formatTime = (value?: string) => (value ? value.replace("T", " ").slice(0, 16) : "未记录");
const sourceInitial = (name?: string) => (name || "D").trim().slice(0, 1).toUpperCase();

const updateField = <K extends keyof JdbcConnectionForm>(key: K, value: JdbcConnectionForm[K]) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: value,
  });
};

const updateNumberField = (key: keyof JdbcConnectionForm, value: number | null | undefined) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [key]: Number(value || 0),
  });
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
  emit("save-source");
  dialogVisible.value = false;
};
</script>

<style scoped lang="scss">
.hub-shell {
  display: grid;
  gap: 18px;
  min-height: calc(100vh - 96px);
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(29, 78, 216, 0.08), transparent 36%),
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.08), transparent 32%),
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
  padding: 12px;
  border: 1px solid rgba(121, 138, 149, 0.12);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.76);
  backdrop-filter: blur(12px);
}

.source-card {
  display: grid;
  gap: 14px;
  min-height: 236px;
  padding: 18px;
  border: 1px solid rgba(127, 144, 155, 0.16);
  border-radius: 18px;
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.98), rgba(244, 249, 252, 0.94));
  box-shadow: 0 18px 40px rgba(17, 24, 39, 0.06);
}

.source-card__head,
.source-card__footer,
.source-card__identity,
.source-card__meta {
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
  font-size: 16px;
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
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.source-card__favorite {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 12px;
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  cursor: pointer;
}

.source-card__meta {
  gap: 8px;
  flex-wrap: wrap;
}

.source-card__note {
  min-height: 54px;
  margin: 0;
  line-height: 1.7;
}

.source-card__footer {
  margin-top: auto;
  flex-wrap: wrap;
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
}

.field span {
  color: #60798a;
  font-size: 12px;
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
  border-radius: 18px;
}

.field :deep(.el-textarea__inner) {
  padding: 12px 14px;
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

  .dialog-grid {
    grid-template-columns: 1fr;
  }
}
</style>
