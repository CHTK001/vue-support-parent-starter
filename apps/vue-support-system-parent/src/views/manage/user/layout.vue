<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineComponent, markRaw, ref } from "vue";

import { fetchDeleteUser, fetchPageUser, fetchUpdateUser } from "@repo/core";
import { getPhysicalAddressByIp, getTimeAgo, message } from "@repo/utils";
import Search from "@iconify-icons/ep/search";
import Delete from "@iconify-icons/ep/delete";
import EditPen from "@iconify-icons/ep/edit-pen";
import Refresh from "@iconify-icons/line-md/backup-restore";
import Edit from "@iconify-icons/line-md/plus";
import { debounce, randomColor } from "@pureadmin/utils";
import { useI18n } from "vue-i18n";
import { useRoute } from "vue-router";
import { Base64 } from "js-base64";
import { rand } from "@vueuse/core";
import { IconifyIconOffline, IconifyIconOnline } from "@repo/components/ReIcon";

const ScSearch = defineAsyncComponent(() => import("@repo/components/ScSearch/index.vue"));
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
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
      ipTable: {},
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
  created() {
    const { t } = useI18n();
    const route = useRoute();
    const _data = route.query.data;
    if (_data) {
      try {
        Object.assign(this.form, JSON.parse(Base64.decode(_data)));
      } catch (error) {}
    }
    this.t = t;
    this.Delete = useRenderIcon(markRaw(Delete));
    this.EditPen = useRenderIcon(markRaw(EditPen));
    this.Refresh = useRenderIcon(markRaw(Refresh));
    this.Search = useRenderIcon(markRaw(Search));
    this.Edit = useRenderIcon(markRaw(Edit));
  },
  methods: {
    getTimeAgo,
    async registerPhysicalAddressByIp(ip) {
      getPhysicalAddressByIp(ip).then((res) => {
        this.ipTable[ip] = res;
      });
    },
    randomColor(sex) {
      if (sex == 1) {
        return "bg-blue-type";
      }

      if (sex == 0) {
        return "bg-red-type";
      }

      return "bg-gray-type";
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
    async handleOpenIpAddress(ip) {
      window.open(`https://www.baidu.com/s?wd=${ip}&from=t-io`, "_blank");
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
    <SaveDialog v-if="visible.save" ref="saveDialog" :mode="saveDialogParams.mode" @success="onSearch" @close="dialogClose" />
    <div class="main">
      <el-container>
        <el-header v-if="showQuery">
          <ScSearch :columns="columns" :onSearch="onSearch" :show-number="showNumber" :onEdit="dialogOpen" />
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'" style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
              <ScTable ref="table" :url="fetchPageUserValue" :params="form">
                <el-table-column type="index" label="序号" width="120px">
                  <template #default="scope">
                    <el-tag type="primary" size="small">{{ scope.$index + 1 }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="账号" prop="sysUserUsername" align="left" min-width="200px">
                  <template #default="{ row }">
                    <div class="flex items-center">
                      <div :class="`${randomColor(row.sysUserSex)}  text-gray-700  flex justify-center items-center rounded-[4px] mr-2`" style="width: 50px; height: 50px">
                        {{ row.sysUserNickname ? row.sysUserNickname[0]?.toUpperCase() : "" }}
                      </div>
                      <div class="flex flex-col justify-start text-gray-400">
                        <span class="w-full">{{ row.sysUserNickname }}</span>
                        <span class="w-full">ID:{{ row.sysUserId }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="账号/邮箱/手机" prop="sysUserNickname" align="left" width="200px">
                  <template #default="{ row }">
                    <div class="flex flex-col text-gray-400 justify-start text-left">
                      <span class="flex items-center gap-1">
                        <IconifyIconOnline icon="fa-solid:user-circle" :width="16" />
                        <span>账号:</span>
                        <span>{{ row.sysUserUsername }}</span>
                      </span>
                      <span class="flex items-center gap-1"> <IconifyIconOnline icon="fa-solid:mail-bulk" :width="16" />邮箱:{{ row.sysUserEmail || "-" }}</span>
                      <span class="flex items-center gap-1"><IconifyIconOnline icon="fa-solid:phone" :width="16" />手机:{{ row.sysUserPhone || "-" }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="系统用户" prop="sysUserInSystem" align="center" min-width="100px">
                  <template #default="{ row }">
                    {{ row.sysRoleInSystem == 1 ? "是" : "否" }}
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
                <el-table-column label="最后登录地址" prop="sysUserLastIp" align="left" min-width="140px">
                  <template #default="{ row }">
                    <div>
                      <span v-if="row.sysUserLastIp && registerPhysicalAddressByIp(row.sysUserLastIp)">{{ ipTable[row.sysUserLastIp] || "-" }}</span>
                      <span v-else>-</span>
                      <br />
                      <span class="text-blue-400 cursor-pointer" @click="handleOpenIpAddress(row.sysUserLastIp)">{{ row.sysUserLastIp || "-" }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="注册地址" prop="sysUserRegisterIp" align="left" min-width="140px">
                  <template #default="{ row }">
                    <div>
                      <span v-if="row.sysUserRegisterIp && registerPhysicalAddressByIp(row.sysUserRegisterIp)">{{ ipTable[row.sysUserRegisterIp] || "-" }}</span>
                      <span v-else>-</span>
                      <br />
                      <span class="text-blue-400 cursor-pointer" @click="handleOpenIpAddress(row.sysUserRegisterIp)">{{ row.sysUserRegisterIp || "-" }}</span>
                    </div>
                  </template>
                </el-table-column>

                <el-table-column label="角色" align="center">
                  <template #default="{ row }">
                    <el-tag v-if="row.userRoles.length > 0">
                      {{ row.userRoles[0].sysRoleName }}
                    </el-tag>
                    <span v-else>-</span>
                  </template>
                </el-table-column>
                <el-table-column label="状态" align="center">
                  <template #default="{ row }">
                    <el-switch v-if="mode != 'view'" v-model="row.sysUserStatus" style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" :active-value="1" :inactive-value="0" @change="fetchUpdateUserValue(row)" />
                    <el-tag v-else :type="row.sysUserStatus == 1 ? 'success' : 'danger'">
                      {{ row.sysUserStatus == 1 ? "正常" : "禁用" }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="注册时间" prop="createTime" align="left" min-width="180px">
                  <template #default="{ row }">
                    <div>
                      <span>{{ getTimeAgo(row.createTime) }}</span>
                      <br />
                      <span class="text-gray-400">{{ row.createTime }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="更新时间" prop="updateTime" align="left" min-width="180px">
                  <template #default="{ row }">
                    <div>
                      <span>{{ getTimeAgo(row.updateTime) }}</span>
                      <br />
                      <span class="text-gray-400">{{ row.updateTime }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column v-if="showTool" label="操作" fixed="right" min-width="140px">
                  <template #default="{ row }">
                    <el-button v-auth="'sys:user:update'" v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text" :icon="EditPen" @click="dialogOpen(row, 'edit')"></el-button>
                    <el-popconfirm :title="$t('message.confimDelete')" @confirm="onDelete(row)">
                      <template #reference>
                        <el-button v-if="!row.sysUserInSystem" v-auth="'sys:user:delete'" v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text" type="danger" :icon="Delete"></el-button>
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
.bg-red-type {
  background: #ff4949;
  color: white;
}

.bg-blue-type {
  background: #3a8ee6;
  color: white;
}

.bg-gray-type {
  background: #c0c4cc;
}
</style>
