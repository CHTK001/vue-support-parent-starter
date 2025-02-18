<script setup>
import { fetchListServiceModule } from "@/api/service/module";
import { fetchUpdateService, fetchPageService } from "@/api/service/service";
import { debounce } from "@pureadmin/utils";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { message } from "@repo/utils";
import { defineAsyncComponent, onMounted, reactive, shallowRef } from "vue";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const ScArticleSlot = defineAsyncComponent(() => import("@repo/components/ScArticleSlot/index.vue"));

const saveDialogRef = shallowRef(null);
const tableRef = shallowRef(null);
const env = reactive({
  params: {},
  moduleList: [],
});

const loadData = () => {
  tableRef.value.reload(env.params);
};

const handleEdit = async (row, mode) => {
  saveDialogRef.value.loadModule(env.moduleList);
  saveDialogRef.value.handleOpen(row, mode);
};
const handleUpdate = async (row) => {
  fetchUpdateService(row).then((res) => {
    message(t("message.updateSuccess"), { type: "success" });
  });
};

const loadModuleList = async () => {
  fetchListServiceModule({}).then((res) => {
    env.moduleList = res.data;
  });
};

const getTagName = (tag) => {
  return env.moduleList?.find((item) => item.sysServiceModuleId === tag)?.sysServiceModuleName;
};

onMounted(async () => {
  loadModuleList();
});
</script>
<template>
  <div class="fullscreen p-2">
    <SaveDialog ref="saveDialogRef" @success="loadData" />
    <el-header>
      <div class="left-panel">
        <el-form :inline="true">
          <el-form-item label="服务名称">
            <el-input clearable v-model="env.params.sysServiceName" placeholder="请输入服务名称"></el-input>
          </el-form-item>
        </el-form>
      </div>
      <div class="right-panel">
        <el-button :icon="useRenderIcon('ep:search')" @click="debounce(loadData(), 0, 1000)" type="primary" />
        <el-button :icon="useRenderIcon('ep:plus')" @click="handleEdit({}, 'save')" />
      </div>
    </el-header>
    <ScArticleSlot ref="tableRef" :url="fetchPageService" :params="env.params">
      <template #top="{ row }">
        <el-image :src="row.sysServiceImage" fit="scale-down" lazy class="w-full h-full" :class="{ disabled: row.sysServiceStatus }">
          <template #error>
            <el-icon class="el-icon--broken center" size="128">
              <component :is="useRenderIcon('ri:image-2-line')" />
            </el-icon>
          </template>
        </el-image>
        <div class="type" :class="{ disabled: row.sysServiceStatus }">
          <el-tag
            :type="!row.sysServiceStatus ? 'success' : 'info'"
            :class="{
              'tag-success': !row.sysServiceStatus,
              'tag-info': row.sysServiceStatus,
            }"
          >
            <template v-if="!row.sysServiceStatus">
              {{ t("message.open") }}
            </template>
            <template v-else>
              {{ t("message.close") }}
            </template>
          </el-tag>
          <el-tag :key="item" v-for="item in row.sysServiceTags" class="mx-[2px]">{{ getTagName(item) }}</el-tag>
        </div>
      </template>

      <template #title="{ row }">
        <el-text :class="{ disabled: row.sysServiceStatus }">{{ row.sysServiceName }}</el-text>
      </template>

      <template #bottom="{ row }">
        <el-text :class="{ disabled: row.sysServiceStatus }">{{ row.createTime }}</el-text>
      </template>

      <template #option="{ row }">
        <el-button-group class="ml-[1px]" :class="{ disabled: row.sysServiceStatus }">
          <el-button :icon="useRenderIcon('ep:edit-pen')" size="small" @click="handleEdit(row, 'edit')"></el-button>
        </el-button-group>
      </template>
    </ScArticleSlot>
  </div>
</template>
<style scoped>
.center {
  top: calc(50% - 48px);
  left: calc(50% - 64px);
}
.type {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px 4px;
  font-size: 12px;
  color: #000 !important;
}
.tag-success {
  background-color: rgb(0, 168, 112) !important;
  --el-tag-text-color: var(--el-color-white);
}
.tag-info {
  background-color: rgb(238, 238, 238) !important;
  color: #bababa;
}
.disabled {
  .list-card-item_detail--name,
  .list-card-item_detail--desc {
    color: var(--el-text-color-disabled);
  }

  .list-card-item_detail--operation--tag {
    color: #bababa;
  }
}
</style>
