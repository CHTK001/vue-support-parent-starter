<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineComponent, markRaw, ref } from "vue";

import { fetchDeleteUser, fetchPageUser, fetchUpdateUser } from "@repo/core";
import { message } from "@repo/utils";
import Search from "@iconify-icons/ep/search";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { debounce } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import SaveDialogLayout from "./save.vue";
import ScSearchLayout from "@repo/components/ScSearch/index.vue";

const ScSearch = markRaw(ScSearchLayout);
const SaveDialog = markRaw(SaveDialogLayout);
export default defineComponent({
  components: { SaveDialog, ScSearch },
  props: {
    sysDeptId: {
      type: String,
      default: () => {
        return null;
      },
    },
    showTool: {
      type: Boolean,
      default: true,
    },
    showQuery: {
      type: Boolean,
      default: true,
    },
    mode: {
      type: String,
      default: "view",
    },
    showNumber: {
      type: Number,
      default: 4,
    },
  },
  data() {
    return {
      Delete: null,
      EditPen: null,
      Search: null,
      Refresh: null,
      Edit: null,
      form: {},
      treeProps: {
        value: "sysMenuId",
        label: "sysMenuTitle",
        children: "children",
      },
      visible: {
        save: false,
        role: false,
      },
      loading: {
        query: false,
        menu: false,
      },
      saveDialogParams: { mode: "save" },
      treeData: [],
      curRow: {},
      t: null,
      columns: [
        {
          label: "账号名称",
          prop: "username",
          tooltip: "账号名称最多显示20个字符",
          placeholder: "请输入账号名称",
        },
        {
          label: "账号昵称",
          prop: "nickname",
          tooltip: "账号昵称最多显示20个字符",
          placeholder: "请输入账号昵称",
        },
        {
          label: "手机号码",
          prop: "phone",
          placeholder: "请输入手机号码",
        },
        {
          label: "用户性别",
          prop: "sex",
          placeholder: "请选择性别",
          type: "select",
          children: [
            {
              value: 0,
              label: "男",
            },
            {
              value: 1,
              label: "女",
            },
            {
              value: 2,
              label: "其他",
            },
          ],
        },
        {
          label: "状态信息",
          prop: "status",
          placeholder: "请选择状态",
          type: "select",
          children: [
            {
              value: 0,
              label: "禁用",
            },
            {
              value: 1,
              label: "启用",
            },
          ],
        },
      ],
    };
  },
  computed: {
    iconClass() {
      return ["w-[22px]", "h-[22px]", "flex", "justify-center", "items-center", "outline-none", "rounded-[4px]", "cursor-pointer", "transition-colors", "hover:bg-[#0000000f]", "dark:hover:bg-[#ffffff1f]", "dark:hover:text-[#ffffffd9]"];
    },
  },
  watch: {
    sysDeptId: {
      immediate: true,
      handler(val) {
        this.form.sysDeptId = val;
      },
    },
  },
  mounted() {
    const { t } = useI18n();
    this.t = t;
    this.form.sysDeptId = this.sysDeptId;
    this.Delete = useRenderIcon(markRaw(Delete));
    this.EditPen = useRenderIcon(markRaw(EditPen));
    this.Refresh = useRenderIcon(markRaw(Refresh));
    this.Search = useRenderIcon(markRaw(Search));
    this.Edit = useRenderIcon(markRaw(Edit));
  },
  methods: {
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
    onQuery(params) {
      this.$nextTick(() => {
        Object.assign(params, this.form);
        this.$refs.table.reload(params);
      });
    },
    async onSearch(params) {
      debounce(this.onQuery(params), 1000, true);
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
      } catch (error) { }
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
    },
  },
});
</script>

<template>
  <div class="main background-color">
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch"
      @close="dialogClose" />
    <div class="main">
      <el-container>
        <el-header v-if="showQuery">
          <ScSearch :columns="columns" :onSearch="onSearch" :show-number="showNumber" :onEdit="dialogOpen" />
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'"
              style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
              <ScTable ref="table" :url="fetchPageUserValue">
                <el-table-column label="序号" type="index" align="center" width="60px" fixed />
                <el-table-column label="账号名称" prop="sysUserUsername" align="center" fixed min-width="100px" />
                <el-table-column label="昵称" prop="sysUserNickname" align="center" />
                <el-table-column label="角色" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.userRoles.length > 0">
                      {{ row.userRoles[0].sysRoleName }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="性别" prop="sysUserSex" align="center">
                  <template #default="{ row }">
                    <el-tag>
                      {{ row.sysUserSex == 1 ? "男" : row.sysUserSex == 2 ? "女" : "其他" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="系统用户" prop="sysUserInSystem" align="center" min-width="100px">
                  <template #default="{ row }">
                    <el-tag>
                      {{ row.sysRoleInSystem == 1 ? "是" : "否" }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="状态" align="center">
                  <template #default="{ row }">
                    <el-switch v-if="mode != 'view'" v-model="row.sysUserStatus"
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" :active-value="1"
                      :inactive-value="0" @change="fetchUpdateUserValue(row)" />
                    <span v-else>
                      <el-tag>
                        {{ row.sysUserStatus == 1 ? "正常" : "禁用" }}
                      </el-tag>
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="手机号" prop="sysUserPhone" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysUserPhone">
                      {{ row.sysUserPhone }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="邮箱" prop="sysUserEmail" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysUserEmail">
                      {{ row.sysUserEmail }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="sysUserRemark" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysUserRemark">
                      {{ row.sysUserRemark }}
                    </el-tag>
                    <span v-else>无</span>
                  </template>
                </el-table-column>
                <el-table-column label="最后登录地址" prop="sysUserLastIp" align="center" min-width="140px">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysUserLastIp">
                      {{ row.sysUserLastIp }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="注册地址" prop="sysUserRegisterIp" align="center" min-width="140px">
                  <template #default="{ row }">
                    <el-tag v-if="row.sysUserRegisterIp">
                      {{ row.sysUserRegisterIp }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column v-if="showTool" label="操作" fixed="right" min-width="140px">
                  <template #default="{ row }">
                    <el-button v-auth="'sys:user:update'" v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text"
                      :icon="EditPen" @click="dialogOpen(row, 'edit')"></el-button>
                    <el-popconfirm title="确定删除吗？" @confirm="onDelete(row)">
                      <template #reference>
                        <el-button v-if="!row.sysUserInSystem" v-auth="'sys:user:delete'"
                          v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text" type="danger" :icon="Delete"></el-button>
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

:deep(.el-header) {
  --el-header-height: unset;
}

.left-panel {
  width: 81%;
}
</style>
