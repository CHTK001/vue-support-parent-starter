<script setup lang="ts">
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, nextTick, reactive, ref } from "vue";

import { fetchDeleteRole, fetchPageRole, fetchUpdateRole } from "@/api/manage/role";
import { debounce } from "@pureadmin/utils";
import { message } from "@repo/utils";
import { useI18n } from "vue-i18n";
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
const RoleDialog = defineAsyncComponent(() => import("./role.vue"));
const { t } = useI18n();
const roleDialogRef = ref();
const form = reactive({
  sysRoleName: "",
  SysRoleCode: "",
});

const visible = reactive({
  save: false,
  role: false,
});

const loading = reactive({
  query: false,
  menu: false,
});
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async (formRef) => {
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

const saveDialogParams = reactive({
  mode: "save",
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

const handleOpenRole = async (row) => {
  roleDialogRef.value.handleOpen(row);
};

const contentRef = ref();
</script>

<template>
  <div class="overflow-hidden">
    <SaveDialog ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />
    <RoleDialog ref="roleDialogRef" />
    <div class="main">
      <el-container>
        <el-header>
          <div class="left-panel">
            <el-form ref="formRef" :inline="true" :model="form" class="search-form bg-bg_color pl-6 pt-[10px] overflow-auto">
              <el-form-item label="角色名称" prop="sysRoleName">
                <el-input v-model="form.sysRoleName" placeholder="请输入角色名称" clearable class="!w-[180px]" />
              </el-form-item>
              <el-form-item label="角色编码" prop="SysRoleCode">
                <el-input v-model="form.SysRoleCode" placeholder="请输入角色编码" clearable class="!w-[180px]" />
              </el-form-item>
            </el-form>
          </div>
          <div class="right-panel">
            <div class="right-panel-search">
              <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch" />
              <el-button :icon="useRenderIcon('ep:refresh')" @click="resetForm(formRef)" />
              <el-button :icon="useRenderIcon('ep:plus')" @click="dialogOpen({}, 'save')" />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex px-4">
            <div :class="visible.role ? 'h-full !w-[380vw]' : 'h-full w-full'">
              <ScTable ref="table" :url="fetchPageRole">
                <el-table-column label="序号" prop="seq" type="index" width="80px" />
                <el-table-column label="角色名称" prop="sysRoleName">
                  <template #default="{ row }">
                    <el-tag type="primary"> {{ row.sysRoleName }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="角色编码" prop="sysRoleCode">
                  <template #default="{ row }">
                    <div class="flex justify-between">
                      <span>
                        {{ row.sysRoleCode }}
                      </span>
                      <el-tag :type="row.sysRoleInSystem ? 'success' : 'info'">
                        {{ row.sysRoleInSystem ? "是" : "否" }}
                      </el-tag>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="优先级" prop="sysRoleSort" />

                <el-table-column label="备注" prop="sysRoleRemark" />
                <el-table-column label="启用" prop="sysRoleStatus">
                  <template #default="{ row }">
                    <el-switch v-model="row.sysRoleStatus" class="h-fit" :active-value="1" :inactive-value="0" @change="fetchUpdateRole(row)" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" min-width="140px">
                  <template #default="{ row, $index }">
                    <el-button class="btn-text" :icon="useRenderIcon('ep:edit')" @click="dialogOpen(row, 'edit')"></el-button>
                    <el-popconfirm title="确定删除吗？" @confirm="onDelete(row, $index)">
                      <template #reference>
                        <el-button v-if="!row.sysRoleInSystem" class="btn-text" type="danger" :icon="useRenderIcon('ep:delete')"></el-button>
                      </template>
                    </el-popconfirm>
                    <el-button class="btn-text" type="primary" :icon="useRenderIcon('ep:menu')" @click="handleOpenRole(row)"></el-button>
                  </template>
                </el-table-column>
              </ScTable>
            </div>
            <div v-if="visible.role" class="!h-full !min-w-[calc(100vw-60vw-668px)] w-full mt-2 px-2 pb-2 bg-bg_color ml-2 overflow-auto" style="border: 1px solid #eee; margin: 0; margin-left: 10px"></div>
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
.h-fit {
  height: fit-content !important;
}
</style>
