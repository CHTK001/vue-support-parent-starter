<script setup>
import { defineExpose, defineAsyncComponent, reactive, shallowRef } from "vue";
import { localStorageProxy, message } from "@repo/utils";
import { fetchSaveOrUpdateDictItemProperty } from "@repo/core";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const emit = defineEmits(["close", "open"]);
const ScInput = defineAsyncComponent(
  () => import("@repo/components/ScInput/index.vue")
);
const ScFormTable = defineAsyncComponent(
  () => import("@repo/components/ScFormTable/index.vue")
);
const env = reactive({
  groupCache: "dict_item_propery_group_cache",
  addTemplate: {},
  loading: false,
  _groupCacheList: new Set(),
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
});

const form = shallowRef({});
const registerCache = async () => {
  if (form.value.property) {
    form.value.property.forEach((element) => {
      if (element.sysDictItemPropertyGroup) {
        env._groupCacheList.push(element.sysDictItemPropertyGroup);
      }
    });
    env._groupCacheList = [...new Set(env._groupCacheList)];
    localStorageProxy().setItem(env.groupCache, env._groupCacheList);
  }
};

const handleUpdate = async () => {
  registerCache();
  env.loading = true;
  fetchSaveOrUpdateDictItemProperty({
    sysDictItemId: form.value.sysDictItemId,
    property: form.value.property,
  })
    .then((res) => {
      message(t("message.updateSuccess", { type: "success" }));
      emit("success", form.value);
    })
    .finally(() => {
      env.loading = false;
    });
};
const handleClose = async () => {
  env.visible = false;
  env.loading = false;
};
const handleOpen = async (item, mode) => {
  env.loading = false;
  env._groupCacheList = localStorageProxy().getItem(env.groupCache) || [];
  env.mode = mode;
  env.visible = true;
  env.title = item.sysDictItemName + "配置设置";
  env.item = item;
  form.value.sysDictItemId = item.sysDictItemId;
  form.value.property = item.property?.map((it) => {
    if (it.sysDictItemPropertySelectedType === "Boolean") {
      it.sysDictItemPropertyValue =
        it.sysDictItemPropertyValue === "true" ? true : false;
    }
    return it;
  });
};
// 获取类型图标
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
    <el-drawer
      size="55%"
      v-model="env.visible"
      :title="env.title"
      class="property-drawer"
    >
      <template #header>
        <div class="drawer-header">
          <div class="drawer-title">
            <IconifyIconOnline icon="ri:settings-4-line" class="title-icon" />
            <span>{{ env.title }}</span>
          </div>
          <el-tag type="info" size="small">属性配置</el-tag>
        </div>
      </template>

      <div class="drawer-content thin-scroller">
        <div class="content-tips">
          <IconifyIconOnline icon="ri:information-line" />
          <span>配置字典项的扩展属性，支持多种数据类型</span>
        </div>

        <ScFormTable
          v-model="form.property"
          :addTemplate="env.addTemplate"
          :height="form.property?.length > 0 ? 400 : 120"
          placeholder="暂无配置项，点击下方按钮添加"
          class="property-table"
          :class="{ 'empty-table': !form.property?.length }"
        >
          <el-table-column
            fixed
            prop="sysDictItemPropertyGroup"
            label="配置分组"
            width="200"
          >
            <template #default="{ row }">
              <el-select
                filterable
                allow-create
                clearable
                v-model="row.sysDictItemPropertyGroup"
                placeholder="选择或创建分组"
                class="group-select"
              >
                <el-option
                  v-for="item in env._groupCacheList"
                  :key="item"
                  :value="item"
                >
                  <div class="group-option">
                    <IconifyIconOnline icon="ri:folder-line" />
                    <span>{{ item }}</span>
                  </div>
                </el-option>
              </el-select>
            </template>
          </el-table-column>

          <el-table-column
            fixed
            prop="sysDictItemPropertyName"
            label="配置名称"
            min-width="180"
          >
            <template #default="{ row }">
              <el-input
                v-model="row.sysDictItemPropertyName"
                placeholder="输入配置名称"
                clearable
              >
                <template #prefix>
                  <IconifyIconOnline icon="ri:key-line" />
                </template>
              </el-input>
            </template>
          </el-table-column>

          <el-table-column
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
                  <el-select
                    v-model="row.sysDictItemPropertySelectedType"
                    class="type-select"
                  >
                    <el-option
                      v-for="item in env.selectTypeList"
                      :key="item.value"
                      :value="item.value"
                      :label="item.label"
                    >
                      <div class="type-option">
                        <IconifyIconOnline :icon="getTypeIcon(item.value)" />
                        <span>{{ item.label }}</span>
                      </div>
                    </el-option>
                  </el-select>
                </template>
              </ScInput>
            </template>
          </el-table-column>
        </ScFormTable>
      </div>

      <template #footer>
        <div class="drawer-footer">
          <el-button @click="handleClose" size="large">
            <IconifyIconOnline icon="ri:close-line" class="mr-1" />
            {{ t("buttons.close") }}
          </el-button>
          <el-button
            type="primary"
            :loading="env.loading"
            @click="handleUpdate"
            size="large"
          >
            <IconifyIconOnline icon="ri:save-line" class="mr-1" />
            {{ t("buttons.confirm") }}
          </el-button>
        </div>
      </template>
    </el-drawer>
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
