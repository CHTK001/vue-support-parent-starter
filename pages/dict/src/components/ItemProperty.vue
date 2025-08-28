<script setup>
import { defineEmits, defineExpose, defineAsyncComponent, reactive, shallowRef } from "vue";
import { localStorageProxy, message } from "@repo/utils";
import { fetchSaveOrUpdateDictItemProperty } from "@repo/core";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const emit = defineEmits(["close", "open"]);
const ScInput = defineAsyncComponent(() => import("@repo/components/ScInput/index.vue"));
const ScFormTable = defineAsyncComponent(() => import("@repo/components/ScFormTable/index.vue"));
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
      it.sysDictItemPropertyValue = it.sysDictItemPropertyValue === "true" ? true : false;
    }
    return it;
  });
};
defineExpose({
  handleClose,
  handleOpen,
});
</script>

<template>
  <div>
    <el-drawer size="60%" v-model="env.visible" :title="env.title">
      <ScFormTable v-model="form.property" :addTemplate="env.addTemplate" :height="550" placeholder="暂无数据" class="overflow-hidden">
        <el-table-column fixed prop="sysDictItemPropertyGroup" label="配置项" width="250">
          <template #default="{ row }">
            <el-select filterable allow-create clearable v-model="row.sysDictItemPropertyGroup">
              <el-option v-for="item in env._groupCacheList" :key="item" :value="item"></el-option>
            </el-select>
          </template>
        </el-table-column>
        <el-table-column fixed prop="sysDictItemPropertyName" label="配置项">
          <template #default="{ row }">
            <el-input v-model="row.sysDictItemPropertyName" />
          </template>
        </el-table-column>
        <el-table-column fixed prop="sysDictItemPropertyValue" label="配置值">
          <template #default="{ row }">
            <ScInput v-model="row.sysDictItemPropertyValue" class="input-with-select" :input-type="row.sysDictItemPropertySelectedType">
              <template #prepend>
                <el-select v-model="row.sysDictItemPropertySelectedType" class="!w-[115px]">
                  <el-option v-for="item in env.selectTypeList" :key="item.value" :value="item.value" :label="item.label"></el-option>
                </el-select>
              </template>
            </ScInput>
          </template>
        </el-table-column>
      </ScFormTable>
      <template #footer>
        <div class="flex justify-end">
          <el-button @click="handleClose">{{ t("buttons.close") }}</el-button>
          <el-button type="primary" :loading="env.loading" @click="handleUpdate">{{ t("buttons.confirm") }}</el-button>
        </div>
      </template>
    </el-drawer>
  </div>
</template>
<style scoped lang="scss">
.input-with-select {
  :deep(.el-input-group__prepend) {
    background-color: var(--el-fill-color-blank);
  }
}
</style>