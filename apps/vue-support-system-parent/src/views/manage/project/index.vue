<template>
  <div class="main background-color">
    <!-- <SaveDialog v-if="visible.save" ref="saveDialog" :sysSecretFunctions="sysSecretFunctions" :mode="saveDialogParams.mode" @success="onSearch()" @close="dialogClose" /> -->
    <el-container>
      <el-header>
        <div class="left-panel">
          <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto">
            <el-form-item label="项目分组" prop="sysProjectName">
              <el-input v-model="form.sysProjectName" placeholder="请输入项目分组" clearable class="!w-[180px]" />
            </el-form-item>
            <el-form-item label="项目编码" prop="SysProjectCode">
              <el-input v-model="form.SysProjectCode" placeholder="请输入项目编码" clearable class="!w-[180px]" />
            </el-form-item>
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button type="primary" :icon="useRenderIcon('ri:search-line')" @click="handleRefresh()" />
            <el-button :icon="useRenderIcon('ep:plus')" @click="handleSave('add', {})" />
          </div>
        </div>
      </el-header>
      <el-main>
        <ScArticleSlot ref="tableRef" :url="fetchPageProject" :rowClick="handleRowClick">
          <template #top="{ row }">
            <el-image :src="row.sysProjectIcon" fit="cover" lazy class="w-full h-full">
              <template #error>
                <el-icon class="el-icon--broken" size="36">
                  <component :is="useRenderIcon('ri:image-2-line')" />
                </el-icon>
              </template>
            </el-image>
            <el-tag type="primary" class="type">{{ row.sysProjectName }}</el-tag>
          </template>

          <template #title="{ row }">
            <el-text>{{ row.monitorMqttServerName }}</el-text>
          </template>

          <template #bottom="{ row }">
            <el-text>{{ row.createTime }}</el-text>
          </template>

          <template #option="{ row }">
            <el-button-group class="ml-[1px]">
              <el-button :icon="useRenderIcon('ri:align-vertically')" title="解析" size="small" @click.stop="handleBoradcast(row)" />
              <el-button :icon="useRenderIcon('ep:copy-document')" title="项目编码" size="small" class="z-[99]" v-copy:click="row.sysProjectCode" />
            </el-button-group>
          </template>
        </ScArticleSlot>
      </el-main>
    </el-container>
    <SaveDialog ref="saveDialogRef" @success="handleRefresh"></SaveDialog>
  </div>
</template>
<script setup>
import { fetchPageProject } from "@/api/manage/project";
import { defineAsyncComponent, onMounted, reactive, ref, nextTick } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import SaveDialog from "./save.vue";
import { fetchListDictItem } from "@repo/core";
const ScArticleSlot = defineAsyncComponent(() => import("@repo/components/ScArticleSlot/index.vue"));
const form = reactive({});
let dictItem = [];
let functionList = [];
const saveDialogRef = ref();
const tableRef = ref();

const handleAfterPropertieSet = async () => {
  fetchListDictItem({
    sysDictId: 1,
  }).then((res) => {
    dictItem = res?.data;
  });
  fetchListDictItem({
    sysDictId: 6,
  }).then((res) => {
    functionList = res?.data;
  });
};
const handleSave = async (mode, data) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleFunction(functionList);
  saveDialogRef.value.handleOpen(mode, data);
};
const handleRefresh = async () => {
  tableRef.value.reload(form);
};

const handleRowClick = async (data) => {
  handleSave("edit", data);
};

onMounted(async () => {
  await handleAfterPropertieSet();
});
</script>
<style scoped>
.type {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 5px 4px;
  font-size: 12px;
  color: #000 !important;
}
</style>
