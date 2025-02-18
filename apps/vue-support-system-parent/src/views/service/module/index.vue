<script setup>
import { fetchPageServiceModule, fetchUpdateServiceModule } from "@/api/service/module";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { computed, defineAsyncComponent, onMounted, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
import { fetchListMenu } from "@/api/manage/menu";

const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const env = reactive({
  params: {},
  loading: false,
  menuList: [],
});

const loadingTag = computed(() => {
  return env.loading;
});
const loadData = () => {
  tableRef.value.reload(env.params);
};

const handleEdit = async (row, mode) => {
  saveDialogRef.value.handleLoadMenuList(env.menuList);
  saveDialogRef.value.handleOpen(row, mode);
};
const handleUpdate = async (row) => {
  fetchUpdateServiceModule(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
  });
};
const loadMenuList = async () => {
  env.loading = true;
  fetchListMenu({})
    .then((res) => {
      env.menuList = res.data;
    })
    .finally(() => {
      env.loading = false;
    });
};
const handleListEquals = (arr, tag) => {
  const item = arr.find((it) => it.sysMenuId === tag);
  if (item) {
    return item;
  }
  for (let index = 0; index < arr.length; index++) {
    const it = arr[index];
    if (it.children) {
      const _item = handleListEquals(it.children, tag);
      if (_item) {
        return _item;
      }
    }
  }
  return null;
};
const handleRenderTagName = (tag) => {
  const find = handleListEquals(env.menuList, tag);
  return find?.sysMenuTitle;
};
onMounted(async () => {
  loadMenuList();
});
</script>
<template>
  <div class="fullscreen p-2">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <el-header>
      <div class="left-panel">
        <el-form :inline="true">
          <el-form-item label="模块名称">
            <el-input clearable v-model="env.params.sysServiceModuleName" placeholder="请输入模块名称"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="right-panel">
        <el-button :icon="useRenderIcon('ep:search')" @click="debounce(loadData(), 0, 1000)" type="primary" />
        <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
      </div>
    </el-header>
    <ScTable ref="tableRef" :url="fetchPageServiceModule" :params="env.params">
      <el-table-column type="index" label="序号" width="120px" />
      <el-table-column label="模块名称" prop="sysServiceModuleName">
        <template #default="{ row }">
          <div class="flex justify-between gap-1">
            <span
              >{{ row.sysServiceModuleName }}
              <span>{{ row.sysServiceModuleVersion }}</span>
            </span>
            <span class="el-form-item-msg">{{ row.sysServiceModuleCode }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="标签" show-overflow-tooltip>
        <template #default="{ row }">
          <el-tag class="m-2" v-for="tag in row.sysServiceModuleMenuTags?.split(',')" :key="tag" type="primary">{{ handleRenderTagName(~~tag) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="类型">
        <template #default="{ row }">
          <el-tag type="primary" v-if="row.sysServiceModuleType === 'API'">接口</el-tag>
          <el-tag type="warning" v-else>服务</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="是否启用">
        <template #default="{ row }">
          <el-segmented
            v-model="row.sysServiceModuleStatus"
            :options="[
              {
                label: '启用',
                value: 0,
              },
              {
                label: '禁用',
                value: 1,
              },
            ]"
            @change="handleUpdate(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="{ row }">
          <el-button :icon="useRenderIcon('ep:edit-pen')" @click="handleEdit(row, 'edit')"></el-button>
        </template>
      </el-table-column>
    </ScTable>
  </div>
</template>
