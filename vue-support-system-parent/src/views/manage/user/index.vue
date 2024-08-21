<script setup lang="ts">
import { reactive, ref, nextTick, computed, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

import SaveDialog from "./save.vue";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Menu from "@iconify-icons/ep/menu";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { transformI18n } from "@/plugins/i18n";
import Edit from "@iconify-icons/line-md/plus";
import Close from "@iconify-icons/ep/close";
import Check from "@iconify-icons/ep/check";
import { fetchPageUser, fetchUpdateUser, fetchDeleteUser } from "@/api/user";
import { message } from "@/utils/message";
import { useI18n } from "vue-i18n";
import {
  delay,
  subBefore,
  useResizeObserver,
  debounce
} from "@pureadmin/utils";
import { hasAuth } from "@/router/utils";

const { t } = useI18n();
const form = reactive({
  username: ""
});

const iconClass = computed(() => {
  return [
    "w-[22px]",
    "h-[22px]",
    "flex",
    "justify-center",
    "items-center",
    "outline-none",
    "rounded-[4px]",
    "cursor-pointer",
    "transition-colors",
    "hover:bg-[#0000000f]",
    "dark:hover:bg-[#ffffff1f]",
    "dark:hover:text-[#ffffffd9]"
  ];
});
const treeProps = {
  value: "sysMenuId",
  label: "sysMenuTitle",
  children: "children"
};
const visible = reactive({
  save: false,
  role: false
});

const loading = reactive({
  query: false,
  menu: false
});
const formRef = ref();
const table = ref(null);
const saveDialog = ref(null);
const resetForm = async formRef => {
  form.username = null;
  table.value.reload(form);
};
const onSearch = debounce(
  async () => {
    table.value.reload(form);
  },
  1000,
  true
);

const saveDialogParams = reactive({
  mode: "save"
});

const onDelete = async row => {
  try {
    const { code } = await fetchDeleteUser(row.sysUserId);
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

const curRow = ref(null);
const treeData = reactive([]);
const treeHeight = ref();
const contentRef = ref();
const treeRef = ref();

const currentRoleMenuIds = reactive([]);
const drawOpen = async row => {
  visible.role = true;
  curRow.value = row;
  await nextTick();
};

const drawClose = async () => {
  visible.role = false;
  curRow.value = null;
  treeData.length = 0;
  await nextTick();
};

const isLinkage = ref(false);
</script>

<template>
  <div class="background-color">
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
              <el-form-item label="账号名称" prop="sysUserUsername">
                <el-input
                  v-model="form.username"
                  placeholder="请输入账号名称"
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
          <div ref="contentRef" class="h-full flex">
            <div
              :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'"
              style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <ScTable ref="table" :url="fetchPageUser" border size="small">
                <el-table-column
                  label="序号"
                  type="index"
                  align="center"
                  fixed
                />
                <el-table-column
                  label="账号名称"
                  prop="sysUserUsername"
                  fixed
                />
                <el-table-column label="昵称" prop="sysUserNickname" />
                <el-table-column label="角色">
                  <template #default="{ row }">
                    <el-tag v-if="row.userRoles.length > 0">{{
                      row.userRoles[0].sysRoleName
                    }}</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="手机号" prop="sysUserPhone">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysUserPhone">{{
                      row.sysUserPhone
                    }}</el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="邮箱" prop="sysUserEmail" />
                <el-table-column label="性别" prop="sysUserSex">
                  <template #default="{ row }">
                    <el-tag>{{
                      row.sysUserSex == 1
                        ? "男"
                        : row.sysUserSex == 2
                          ? "女"
                          : "其他"
                    }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="系统用户" prop="sysUserInSystem">
                  <template #default="{ row }">
                    <el-tag>{{
                      row.sysRoleInSystem == 1 ? "是" : "否"
                    }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态">
                  <template #default="{ row }">
                    <el-switch
                      v-model="row.sysUserStatus"
                      style="
                        --el-switch-on-color: #13ce66;
                        --el-switch-off-color: #ff4949;
                      "
                      :active-value="1"
                      :inactive-value="0"
                      @change="fetchUpdateUser(row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="sysUserRemark" />
                <el-table-column label="最后登录地址" prop="sysUserLastIp" />
                <el-table-column label="注册地址" prop="sysUserRegisterIp" />
                <el-table-column label="操作" fixed="right">
                  <template #default="{ row }">
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
                      @confirm="onDelete(row)"
                    >
                      <template #reference>
                        <el-button
                          v-if="
                            !row.sysUserInSystem && hasAuth('sys:user:delete')
                          "
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
