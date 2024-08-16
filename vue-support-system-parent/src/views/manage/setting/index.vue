<script setup lang="ts">
import { getCurrentInstance, reactive, ref } from "vue";
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
const table = ref(null);
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};
const onSearch = async () => {
  table.value.reload(form);
};

const columns: ScTableColumn[] = reactive([
  {
    label: "配置ID",
    prop: "sysSettingId"
  },
  {
    label: "配置分组",
    prop: "sysSettingGroup"
  },
  {
    label: "配置名称",
    prop: "sysSettingName"
  },
  {
    label: "配置值",
    prop: "sysSettingValue"
  },
  {
    label: "配置类型",
    prop: "sysSettingValueType"
  },
  {
    label: "配置备注",
    prop: "sysSettingRemark"
  },
  {
    label: "配置状态",
    prop: "sysSettingStatus"
  },
  {
    label: "是否系统配置",
    prop: "sysSettingInSystem"
  }
]);
const openDialog = async () => {};
</script>

<template>
  <div class="main">
    <el-container>
      <el-header>
        <div class="left-panel">
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
          </el-form>
        </div>
        <div class="right-panel">
          <div class="right-panel-search">
            <el-button
              type="primary"
              :icon="useRenderIcon('ri:search-line')"
              :loading="loading.query"
              @click="onSearch"
            />
            <el-button
              :icon="useRenderIcon(Refresh)"
              @click="resetForm(formRef)"
            />
          </div>
        </div>
      </el-header>
      <el-main class="nopadding">
        <div class="h-full">
          <ScTable
            ref="table"
            :url="querySetting"
            border
            size="small"
            :columns="columns"
          >
            <template #sysSettingGroup="{ row }">
              <el-tag>{{ row.sysSettingGroup }}</el-tag>
            </template>
            <template #sysSettingValue="{ row }">
              <span>{{ row.sysSettingValue }}</span>
            </template>
            <template #sysSettingStatus="{ row }">
              <el-switch
                v-model="row.sysSettingStatus"
                style="
                  --el-switch-on-color: #13ce66;
                  --el-switch-off-color: #ff4949;
                "
                :active-value="1"
                :inactive-value="0"
                @change="updateSetting($event, row)"
              />
            </template>
            <template #sysSettingInSystem="{ row }">
              <el-tag>{{ row.sysSettingInSystem == 1 ? "是" : "否" }}</el-tag>
            </template>
          </ScTable>
        </div>
      </el-main>
    </el-container>
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
