<script setup lang="ts">
import { reactive, ref, nextTick } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";

import { fetchPageRole, fetchUpdateRole, fetchDeleteRole } from "@/api/role";
import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const form = reactive({
  sysRoleName: "",
  SysRoleCode: ""
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
const onSearch = async () => {
  table.value.reload(form);
};

const saveDialogParams = reactive({
  mode: "save"
});
const onDelete = async (row, index) => {
  try {
    const { code } = await fetchDeleteRole(row.sysRoleId);
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
              <el-form-item label="角色名称" prop="sysRoleName">
                <el-input
                  v-model="form.sysRoleName"
                  placeholder="请输入角色名称"
                  clearable
                  class="!w-[180px]"
                />
              </el-form-item>
              <el-form-item label="角色编码" prop="SysRoleCode">
                <el-input
                  v-model="form.SysRoleCode"
                  placeholder="请输入角色编码"
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
            <ScTable ref="table" :url="fetchPageRole" border size="small">
              <el-table-column label="角色名称" prop="sysRoleName" />
              <el-table-column label="角色编码" prop="sysRoleCode" />
              <el-table-column label="系统角色" prop="sysRoleInSystem">
                <template #default="{ row }">
                  <el-tag>{{ row.sysRoleInSystem == 1 ? "是" : "否" }}</el-tag>
                </template>
              </el-table-column>

              <el-table-column label="备注" prop="sysRoleRemark" />
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
