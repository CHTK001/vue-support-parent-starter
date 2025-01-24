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
            <el-button :icon="useRenderIcon('ep:plus')" @click="handleSave({}, 'add')" />
          </div>
        </div>
      </el-header>
      <el-main>
        <ScArticleSlot ref="tableRef" :url="fetchPageProject">
          <template #top="{ row }">
            <el-icon :size="98" class="cover" color="green">
              <component :is="useRenderIcon('simple-icons:nginx')" />
            </el-icon>
            <el-tag type="success" class="type">{{ row.running ? "启动" : "暂停" }}</el-tag>
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
              <el-button :icon="useRenderIcon('ri:settings-3-line')" title="设置" size="small" @click.stop="handleSetting(row)" />
              <el-button v-if="row.running" type="danger" size="small" :icon="useRenderIcon('ri:stop-circle-line')" title="暂停" @click.stop="handleStop(row)" />
              <el-button v-else :icon="useRenderIcon('ri:play-circle-line')" title="启动" size="small" @click.stop="handleStart(row)" />
              <el-button :icon="useRenderIcon('ri:restart-fill')" title="重启" size="small" @click.stop="handleRestart(row)" />
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
import { defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import SaveDialog from "./save.vue";
import { fetchListDictItem } from "@repo/core";
const ScArticleSlot = defineAsyncComponent(() => import("@repo/components/ScArticleSlot/index.vue"));
const form = reactive({});
let dictItem = [];
const saveDialogRef = ref();
const tableRef = ref();

const handleAfterPropertieSet = async () => {
  fetchListDictItem({
    sysDictId: 1,
  }).then((res) => {
    dictItem = res?.data;
  });
};
const handleSave = async (data, mode) => {
  saveDialogRef.value.handleDictItem(dictItem);
  saveDialogRef.value.handleOpen(data, mode);
};
const handleRefresh = async () => {
  tableRef.value.reload(form);
};

onMounted(async () => {
  await handleAfterPropertieSet();
});
</script>
