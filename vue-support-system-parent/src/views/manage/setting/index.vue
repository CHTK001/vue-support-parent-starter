<script setup lang="ts">
import { reactive, ref, nextTick } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";

import {
  fetchSettingPage,
  fetchUpdateSetting,
  fetchDeleteSetting
} from "@/api/setting";
import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";
import {
  delay,
  subBefore,
  useResizeObserver,
  debounce
} from "@pureadmin/utils";
const { t } = useI18n();
const form = reactive({
  sysSettingName: "",
  sysSettingGroup: ""
});

const visible = reactive({
  save: false
});

const loading = reactive({
  query: false
});
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async formRef => {
  formRef.resetFields();
  onSearch();
};
const onSearch = debounce(
  async () => {
    table.value.reload(form);
  },
  1000,
  true
);

const columns: ScTableColumn[] = reactive([
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

const saveDialogParams = reactive({
  mode: "save"
});
const onDelete = async (row, index) => {
  try {
    const { code } = await fetchDeleteSetting(row.sysSettingId);
    if (code == "00000") {
      table.value.reload();
      message(t("message.deleteSuccess"), { type: "success" });
      return;
    }
  } catch (error) {}
};

const dialogOpen = async (item, mode) => {
  visible.save = true;
  await nextTick();
  saveDialog.value.setData(item).open(mode);
};

const dialogClose = async () => {
  visible.save = false;
};
</script>

<template>
  <div>
    <SaveDialog
      v-if="visible.save"
      ref="saveDialog"
      :mode="saveDialogParams.mode"
      @success="onSearch"
      @close="dialogClose"
    />
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
              <el-button
                :icon="useRenderIcon(Edit)"
                @click="dialogOpen({}, 'save')"
              />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div class="h-full">
            <ScTable
              ref="table"
              :url="fetchSettingPage"
              border
              size="small"
              :columns="columns"
            >
              <template #sysSettingGroup="{ row }">
                <el-tag>{{ row.sysSettingGroup }}</el-tag>
              </template>
              <template #sysSettingValue="{ row }">
                <div v-if="row.sysSettingValueType == 'bool'">
                  <el-switch
                    v-model="row.sysSettingValue"
                    style="
                      --el-switch-on-color: #13ce66;
                      --el-switch-off-color: #ff4949;
                    "
                    active-value="true"
                    inactive-value="false"
                    @change="fetchUpdateSetting(row)"
                  />
                </div>
                <span v-else>{{ row.sysSettingValue }}</span>
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
                  @change="fetchUpdateSetting(row)"
                />
              </template>
              <template #sysSettingInSystem="{ row }">
                <el-tag>{{ row.sysSettingInSystem == 1 ? "是" : "否" }}</el-tag>
              </template>

              <el-table-column label="操作" fixed="right">
                <template #default="{ row, $index }">
                  <el-button
                    size="small"
                    plain
                    link
                    type="primary"
                    :icon="useRenderIcon(EditPen)"
                    @click="dialogOpen(row, 'edit')"
                    >编辑</el-button
                  >
                  <el-popconfirm
                    title="确定删除吗？"
                    @confirm="onDelete(row, $index)"
                  >
                    <template #reference>
                      <el-button
                        size="small"
                        type="danger"
                        plain
                        link
                        :icon="useRenderIcon(Delete)"
                        >删除</el-button
                      >
                    </template>
                  </el-popconfirm>
                </template>
              </el-table-column>
            </ScTable>
          </div>
        </el-main>
      </el-container>
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
