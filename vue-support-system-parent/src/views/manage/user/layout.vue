<script lang="ts">
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { defineComponent, ref } from "vue";

import { fetchDeleteUser, fetchPageUser, fetchUpdateUser } from "@/api/user";
import { hasAuth } from "@/router/utils";
import { message } from "@/utils/message";
import Search from "@iconify-icons/ep/search";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { debounce } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import SaveDialog from "./save.vue";

export default defineComponent({
  components: { SaveDialog },
  props: {
    sysDeptId: {
      type: String,
      default: () => {
        return null;
      }
    }
  },
  data() {
    return {
      Delete: null,
      EditPen: null,
      Search: null,
      Refresh: null,
      Edit: null,
      form: { username: null, nickname: null, phone: null },
      treeProps: {
        value: "sysMenuId",
        label: "sysMenuTitle",
        children: "children"
      },
      visible: {
        save: false,
        role: false
      },
      loading: {
        query: false,
        menu: false
      },
      saveDialogParams: { mode: "save" },
      treeData: [],
      curRow: {},
      t: null
    };
  },
  computed: {
    iconClass() {
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
    }
  },
  mounted() {
    const { t } = useI18n();
    this.t = t;
    this.form.sysDeptId = this.sysDeptId;
    this.Delete = useRenderIcon(Delete);
    this.EditPen = useRenderIcon(EditPen);
    this.Refresh = useRenderIcon(Refresh);
    this.Search = useRenderIcon(Search);
    this.Edit = useRenderIcon(Edit);
  },
  methods: {
    hasAuthValue(value) {
      return hasAuth(value);
    },
    async fetchPageUserValue(params) {
      return fetchPageUser(params);
    },
    async fetchUpdateUserValue(row) {
      return fetchUpdateUser(row);
    },
    async resetForm() {
      this.form.username = null;
      this.$nextTick(() => {
        this.$refs.table.reload(this.form);
      });
    },
    onQuery() {
      this.$nextTick(() => {
        this.$refs.table.reload(this.form);
      });
    },
    async onSearch() {
      debounce(this.onQuery(), 1000, true);
    },
    tValue(v) {
      return this.t(v);
    },
    async useRenderIconValue(value) {
      return useRenderIcon(value);
    },
    async onDelete(row) {
      try {
        const { code } = await fetchDeleteUser(row.sysUserId);
        if (code == "00000") {
          this.$nextTick(() => {
            this.$refs.table.reload();
          });
          message(this.tValue("message.deleteSuccess"), { type: "success" });
          return;
        }
      } catch (error) {}
    },
    async dialogOpen(item, mode) {
      this.visible.save = true;
      this.$nextTick(() => {
        this.$refs.saveDialog.setData(item).open(mode);
      });
    },
    async dialogClose() {
      this.visible.save = false;
    },
    async drawOpen(row) {
      this.visible.role = true;
      this.curRow = row;
    },
    async drawClose() {
      this.visible.role = false;
      this.curRow = null;
      this.treeData.length = 0;
    }
  }
});
</script>

<template>
  <div class="main background-color">
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
              <el-form-item label="账号名称" prop="username">
                <el-input
                  v-model="form.username"
                  placeholder="请输入账号名称"
                  clearable
                  class="!w-[180px]"
                />
              </el-form-item>
              <el-form-item label="昵称" prop="nickname">
                <el-input
                  v-model="form.nickname"
                  placeholder="请输入昵称"
                  clearable
                  class="!w-[180px]"
                />
              </el-form-item>
              <el-form-item label="手机号" prop="phone">
                <el-input
                  v-model="form.phone"
                  placeholder="请输入手机号"
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
                :icon="Search"
                :loading="loading.query"
                @click="onSearch"
              />
              <el-button :icon="Refresh" @click="resetForm()" />
              <el-button :icon="Edit" @click="dialogOpen({}, 'save')" />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div
              :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'"
              style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)"
            >
              <ScTable
                ref="table"
                :url="fetchPageUserValue"
                border
                size="small"
              >
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
                      @change="fetchUpdateUserValue(row)"
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
                      :icon="EditPen"
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
                            !row.sysUserInSystem &&
                            hasAuthValue('sys:user:delete')
                          "
                          size="small"
                          type="danger"
                          plain
                          link
                          :icon="Delete"
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
