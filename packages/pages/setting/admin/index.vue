<script setup lang="ts">
import { defineExpose, nextTick, defineAsyncComponent, reactive, ref, defineEmits } from "vue";
import { fetchSettingPage } from "@repo/core";
import { $t } from "@repo/config";
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
const ItemSave = defineAsyncComponent(() => import("./save.vue"));
const config = reactive({
  visible: false,
  itemSaveStatus: false,
  title: $t("title.setting"),
});

const emit = defineEmits(["close"]);
const itemSaveRef = ref();
const open = () => {
  config.visible = true;
};

const handleClose = () => {
  config.visible = false;
  emit("close");
};

const handleUpdate = async (row, mode) => {
  config.itemSaveStatus = true;
  await nextTick();
  itemSaveRef.value?.setData(row);
  itemSaveRef.value?.open(mode);
};
defineExpose({
  open,
});
</script>

<template>
  <div>
    <el-dialog v-model="config.visible" width="80%" :title="config.title" draggable :close-on-click-modal="false" :close-on-press-escape="false" :destroy-on-close="true" @close="handleClose">
      <el-button :icon="useRenderIcon('ep:plus')" size="small" @click="handleUpdate({}, 'add')" />
      <ScTable border :url="fetchSettingPage" height="400px">
        <el-table-column prop="sysSettingGroup" label="数据分组">
          <template #default="scope">
            <el-tag>{{ scope.row.sysSettingGroup }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sysSettingName" label="字段" />
        <el-table-column prop="sysSettingValue" label="当前值" />
        <el-table-column prop="sysSettingRemark" label="描述" />
        <el-table-column prop="sysSettingValueType" label="数据类型" />
        <el-table-column prop="sysSettingSort" label="数据优先级" />
        <el-table-column prop="sysSettingInSystem" label="系统配置">
          <template #default="scope">
            <el-tag>{{ scope.row.sysSettingInSystem ? "是" : "否" }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sysSettingConfig" label="设置">
          <template #default="{ row }">
            <el-button :icon="useRenderIcon('ep:setting')" size="small" plain circle @click="handleUpdate(row, 'edit')" />
          </template>
        </el-table-column>
      </ScTable>
    </el-dialog>
    <ItemSave v-if="config.itemSaveStatus" ref="itemSaveRef" @close="config.itemSaveStatus = false" />
  </div>
</template>

<style scoped lang="scss"></style>
