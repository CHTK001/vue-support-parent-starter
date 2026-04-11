<script setup>
import { defineAsyncComponent, reactive, shallowRef } from "vue";
import { localStorageProxy, message } from "@repo/utils";
import { fetchSaveOrUpdateDictItemProperty } from "@repo/core";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const emit = defineEmits(["close", "open", "success"]);

const ScInput = defineAsyncComponent(
  () => import("@repo/components/ScInput/index.vue"),
);
const ScFormTable = defineAsyncComponent(
  () => import("@repo/components/ScFormTable/index.vue"),
);

const env = reactive({
  groupCache: "dict_item_propery_group_cache",
  addTemplate: {
    sysDictItemPropertyGroup: "",
    sysDictItemPropertyName: "",
    sysDictItemPropertyValue: "",
    sysDictItemPropertySelectedType: "String",
  },
  loading: false,
  _groupCacheList: [],
  selectedType: "",
  selectTypeList: [
    { value: "String", label: "字符串" },
    { value: "Number", label: "数字" },
    { value: "Boolean", label: "布尔" },
    { value: "Array", label: "数组" },
    { value: "TextArea", label: "文本" },
    { value: "Color", label: "颜色" },
    { value: "Mail", label: "邮件" },
    { value: "Password", label: "密码" },
  ],
  visible: false,
  mode: "edit",
  title: "",
  item: {},
});

const form = shallowRef({
  sysDictItemId: null,
  property: [],
});

const uniqueList = (values) => [...new Set((values || []).filter(Boolean))];

const normalizePropertyRow = (row = {}) => {
  const selectedType = row.sysDictItemPropertySelectedType || "String";
  const rawValue = row.sysDictItemPropertyValue;
  return {
    ...row,
    sysDictItemPropertySelectedType: selectedType,
    sysDictItemPropertyValue:
      selectedType === "Boolean"
        ? String(rawValue) === "true"
        : (rawValue ?? ""),
  };
};

const registerCache = async () => {
  if (!Array.isArray(form.value.property)) {
    return;
  }
  env._groupCacheList = uniqueList([
    ...env._groupCacheList,
    ...form.value.property.map((item) => item.sysDictItemPropertyGroup),
  ]);
  localStorageProxy().setItem(env.groupCache, env._groupCacheList);
};

const appendPropertyRow = () => {
  const nextRow = normalizePropertyRow({ ...env.addTemplate });
  form.value = {
    ...form.value,
    property: [...(form.value.property || []), nextRow],
  };
};

const handleUpdate = async () => {
  await registerCache();
  env.loading = true;
  try {
    const property = Array.isArray(form.value.property)
      ? form.value.property.map((item) => ({
          ...item,
          sysDictItemPropertyValue:
            item.sysDictItemPropertySelectedType === "Boolean"
              ? String(Boolean(item.sysDictItemPropertyValue))
              : (item.sysDictItemPropertyValue ?? ""),
        }))
      : [];

    const res = await fetchSaveOrUpdateDictItemProperty({
      sysDictItemId: form.value.sysDictItemId,
      property,
    });
    if (res?.code === "00000") {
      message.success(t("message.updateSuccess"));
      emit("success", {
        ...form.value,
        property,
      });
      handleClose();
      return;
    }
    message.error(res?.msg || t("message.updateFailed"));
  } catch {
    message.error(t("message.updateFailed"));
  } finally {
    env.loading = false;
  }
};

const handleClose = async () => {
  env.visible = false;
  env.loading = false;
  emit("close");
};

const handleOpen = async (item, mode) => {
  env.loading = false;
  env._groupCacheList = uniqueList(
    localStorageProxy().getItem(env.groupCache) || [],
  );
  env.mode = mode;
  env.visible = true;
  env.title = `${item?.sysDictItemName || ""} 配置设置`;
  env.item = item;
  form.value = {
    sysDictItemId: item?.sysDictItemId ?? null,
    property: Array.isArray(item?.property)
      ? item.property.map(normalizePropertyRow)
      : [],
  };
  emit("open", item);
};

const getTypeIcon = (type) => {
  const iconMap = {
    String: "ri:text",
    Number: "ri:hashtag",
    Boolean: "ri:toggle-line",
    Array: "ri:list-unordered",
    TextArea: "ri:file-text-line",
    Color: "ri:palette-line",
    Mail: "ri:mail-line",
    Password: "ri:lock-line",
  };
  return iconMap[type] || "ri:question-line";
};

defineExpose({
  handleClose,
  handleOpen,
});
</script>

<template>
  <div class="dict-property-drawer">
    <sc-drawer
      v-model="env.visible"
      size="55%"
      :title="env.title"
      class="property-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="drawer-title">
            <IconifyIconOnline icon="ri:settings-4-line" class="title-icon" />
            <span>{{ env.title }}</span>
          </div>
          <ScTag type="info" size="small">属性配置</ScTag>
        </div>
      </template>

      <div class="drawer-content thin-scroller">
        <div class="content-tips">
          <IconifyIconOnline icon="ri:information-line" />
          <span>配置字典项的扩展属性，支持多种数据类型</span>
        </div>

        <div class="content-actions">
          <ScButton
            type="primary"
            size="small"
            plain
            native-type="button"
            @click.stop="appendPropertyRow"
          >
            <IconifyIconOnline icon="ri:add-line" class="mr-1" />
            新增属性
          </ScButton>
        </div>

        <ScFormTable
          v-model="form.property"
          :add-template="env.addTemplate"
          :height="form.property?.length > 0 ? 400 : 120"
          placeholder="暂无配置项，点击下方按钮添加"
          class="property-table"
          :class="{ 'empty-table': !form.property?.length }"
        >
          <ScTableColumn
            fixed
            prop="sysDictItemPropertyGroup"
            label="配置分组"
            width="200"
          >
            <template #default="{ row }">
              <ScSelect
                v-model="row.sysDictItemPropertyGroup"
                filterable
                allow-create
                clearable
                placeholder="选择或创建分组"
                class="group-select"
              >
                <ScOption
                  v-for="item in env._groupCacheList"
                  :key="item"
                  :value="item"
                >
                  <div class="group-option">
                    <IconifyIconOnline icon="ri:folder-line" />
                    <span>{{ item }}</span>
                  </div>
                </ScOption>
              </ScSelect>
            </template>
          </ScTableColumn>

          <ScTableColumn
            fixed
            prop="sysDictItemPropertyName"
            label="配置名称"
            min-width="180"
          >
            <template #default="{ row }">
              <ScInput
                v-model="row.sysDictItemPropertyName"
                placeholder="输入配置名称"
                clearable
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:key-line" />
                </template>
              </ScInput>
            </template>
          </ScTableColumn>

          <ScTableColumn
            fixed
            prop="sysDictItemPropertyValue"
            label="配置值"
            min-width="320"
          >
            <template #default="{ row }">
              <ScInput
                v-model="row.sysDictItemPropertyValue"
                class="input-with-select"
                :input-type="row.sysDictItemPropertySelectedType"
                placeholder="输入配置值"
              >
                <template #prepend>
                  <ScSelect
                    v-model="row.sysDictItemPropertySelectedType"
                    class="type-select"
                  >
                    <ScOption
                      v-for="item in env.selectTypeList"
                      :key="item.value"
                      :value="item.value"
                      :label="item.label"
                    >
                      <div class="type-option">
                        <IconifyIconOnline :icon="getTypeIcon(item.value)" />
                        <span>{{ item.label }}</span>
                      </div>
                    </ScOption>
                  </ScSelect>
                </template>
              </ScInput>
            </template>
          </ScTableColumn>
        </ScFormTable>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <ScButton size="large" native-type="button" @click.stop="handleClose">
            <IconifyIconOnline icon="ri:close-line" class="mr-1" />
            {{ t("buttons.close") }}
          </ScButton>
          <ScButton
            type="primary"
            :loading="env.loading"
            size="large"
            native-type="button"
            @click.stop="handleUpdate"
          >
            <IconifyIconOnline icon="ri:save-line" class="mr-1" />
            {{ t("buttons.confirm") }}
          </ScButton>
        </div>
      </template>
    </sc-drawer>
  </div>
</template>

<style scoped lang="scss">
.dict-property-drawer {
  :deep(.el-drawer) {
    border-radius: 16px 0 0 16px;

    .el-drawer__header {
      padding: 20px 24px;
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
      background: linear-gradient(
        135deg,
        var(--el-color-primary-light-9) 0%,
        var(--el-bg-color-overlay) 100%
      );
    }

    .el-drawer__body {
      padding: 0;
    }

    .el-drawer__footer {
      padding: 16px 24px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.title-icon {
  font-size: 22px;
  color: var(--el-color-primary);
}

.drawer-content {
  padding: 20px 24px;
  height: calc(100% - 40px);
}

.content-tips {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--el-color-info-light-9);
  border-radius: 10px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.content-actions {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}

.property-table {
  :deep(.el-table) {
    border-radius: 12px;
    overflow: hidden;

    th {
      background: var(--el-fill-color-light) !important;
      font-weight: 600;
    }
  }
}

.empty-table {
  :deep(.el-table) {
    .el-scrollbar__bar {
      display: none;
    }

    .el-table__empty-block {
      min-height: 60px !important;
    }
  }
}

.group-select,
.type-select {
  width: 100%;
}

.type-select {
  width: 115px !important;
}

.group-option,
.type-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-with-select {
  :deep(.el-input-group__prepend) {
    background-color: var(--el-fill-color-lighter);
    border-radius: 8px 0 0 8px;
  }
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
