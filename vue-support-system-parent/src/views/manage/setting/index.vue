<script setup lang="ts">
import { reactive, ref } from "vue";
import { PureTableBar } from "@/components/RePureTableBar";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import {
  delay,
  subBefore,
  deviceDetection,
  useResizeObserver
} from "@pureadmin/utils";

import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Menu from "@iconify-icons/ep/menu";
import AddFill from "@iconify-icons/ri/add-circle-line";
import Close from "@iconify-icons/ep/close";
import Check from "@iconify-icons/ep/check";

import { querySetting, updateSetting } from "./setting";

const form = reactive({
  sysSettingName: "",
  sysSettingGroup: ""
});

const loading = reactive({
  query: false
});
const formRef = ref();
const resetForm = async formRef => {};
const onSearch = async () => {};

const columns = reactive([
  {
    label: "配置ID",
    prop: "sysSettingId"
  },
  {
    label: "配置分组",
    prop: "sysSettingGroup"
  }
]);
const openDialog = async () => {};
</script>

<template>
  <div class="main">
    <el-form
      ref="formRef"
      :inline="true"
      :model="form"
      class="search-form bg-bg_color w-[99/100] pl-8 pt-[12px] overflow-auto"
    >
      <el-form-item label="配置名称" prop="sysSettingName">
        <el-input
          v-model="form.sysSettingName"
          placeholder="请输入配置名称"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item label="分组名称" prop="sysSettingGroup">
        <el-input
          v-model="form.sysSettingGroup"
          placeholder="请输入配置标识"
          clearable
          class="!w-[180px]"
        />
      </el-form-item>
      <el-form-item>
        <el-button
          type="primary"
          :icon="useRenderIcon('ri:search-line')"
          :loading="loading.query"
          @click="onSearch"
        />
        <el-button :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)" />
      </el-form-item>
    </el-form>

    <div class="h-full">
      <ScTable :url="querySetting" border :columns="columns">
        <el-table-column label="配置ID" prop="sysSettingId" />
        <el-table-column label="配置分组" prop="sysSettingGroup">
          <template #default="{ row }">
            <el-tag>{{ row.sysSettingGroup }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="配置名称" prop="sysSettingName" />
        <el-table-column label="配置值" prop="sysSettingValue" />
        <el-table-column label="配置类型" prop="sysSettingValueType" />
        <el-table-column label="配置备注" prop="sysSettingRemark" />
        <el-table-column label="是否启用" prop="sysSettingStatus">
          <template #default="{ row }">
            <el-switch
              v-mode="row.sysSettingStatus"
              :active-value="1"
              :inactive-value="0"
            />
          </template>
        </el-table-column>
        <el-table-column label="是否系统配置" prop="sysSettingInSystem" />
      </ScTable>
    </div>
  </div>
</template>

<style scoped lang="scss">
:deep(.el-dropdown-menu__item i) {
  margin: 0;
}

.search-form {
  :deep(.el-form-item) {
    margin-bottom: 12px;
  }
}
</style>
