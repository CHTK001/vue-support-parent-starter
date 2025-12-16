<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { defineAsyncComponent, defineComponent, markRaw, ref, computed } from "vue";

import { fetchDeleteUser, fetchPageUser, fetchUpdateUser, fetchExportUsers, fetchDownloadUserTemplate, fetchImportUsers, fetchResetPassword, fetchBatchDeleteUsers, fetchBatchUpdateUserStatus } from "@repo/core";
import { getTimeAgo, message } from "@repo/utils";
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


const ScIp = defineAsyncComponent(() => import("@repo/components/ScIp/index.vue"));
const ScFilterBar = defineAsyncComponent(() => import("@repo/components/ScFilterBar/index.vue"));
const SaveDialog = defineAsyncComponent(() => import("./save.vue"));
export default defineComponent({
  components: { SaveDialog, ScFilterBar, ScIp },
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
      importLoading: false,
      exportLoading: false,
      // 统计数据
      stats: {
        total: 0,
        active: 0,
        disabled: 0,
        todayNew: 0,
      },
      // 选中的用户
      selectedUsers: [],
      // 批量操作加载状态
      batchLoading: false,
      filterOptions: [
        {
          label: "账号名称",
          value: "sysUserUsername",
          type: "text",
          placeholder: "请输入账号名称",
        },
        {
          label: "账号昵称",
          value: "sysUserNickname",
          type: "text",
          placeholder: "请输入账号昵称",
        },
        {
          label: "手机号码",
          value: "sysUserPhone",
          type: "text",
          placeholder: "请输入手机号码",
        },
        {
          label: "用户性别",
          value: "sysUserSex",
          type: "select",
          placeholder: "请选择性别",
          extend: {
            data: [
              { value: 1, label: "男" },
              { value: 0, label: "女" },
              { value: 2, label: "其他" },
            ],
          },
        },
        {
          label: "状态信息",
          value: "sysUserStatus",
          type: "select",
          placeholder: "请选择状态",
          extend: {
            data: [
              { value: 0, label: "禁用" },
              { value: 1, label: "启用" },
            ],
          },
        },
      ],
    };
  },
  computed: {
    // 是否有选中用户
    hasSelected() {
      return this.selectedUsers.length > 0;
    },
    // 选中用户数量
    selectedCount() {
      return this.selectedUsers.length;
    },
  },
  created() {
    const { t } = useI18n();
    const route = useRoute();
    const _data = route.query.data;
    if (_data) {
      try {
        Object.assign(this.form, JSON.parse(Base64.decode(_data)));
      } catch (error) { }
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
    // 计算离开天数
    getDaysAway(dateStr) {
      if (!dateStr) return 0;
      const lastDate = new Date(dateStr);
      const now = new Date();
      const diffTime = now.getTime() - lastDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    },
    // 根据离开天数获取样式类
    getDaysAwayClass(dateStr) {
      const days = this.getDaysAway(dateStr);
      if (days <= 7) return 'days-normal'; // 7天内 - 正常
      if (days <= 30) return 'days-warning'; // 30天内 - 警告
      return 'days-danger'; // 超过30天 - 危险
    },
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
    async handleExportUsers() {
      this.exportLoading = true;
      try {
        const response = await fetchExportUsers(this.form);
        const blob = new Blob([response], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `users_${Date.now()}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        message('导出成功', { type: 'success' });
      } catch (error) {
        message('导出失败', { type: 'error' });
      } finally {
        this.exportLoading = false;
      }
    },
    async handleDownloadTemplate() {
      try {
        const response = await fetchDownloadUserTemplate();
        const blob = new Blob([response], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'user_import_template.csv';
        link.click();
        window.URL.revokeObjectURL(url);
      } catch (error) {
        message('下载模板失败', { type: 'error' });
      }
    },
    async handleImportUsers(event) {
      const file = event.target.files[0];
      if (!file) return;
      this.importLoading = true;
      try {
        const { code, data } = await fetchImportUsers(file);
        if (code === '00000') {
          message(data || '导入成功', { type: 'success' });
          this.$refs.table.reload();
        }
      } catch (error) {
        message('导入失败', { type: 'error' });
      } finally {
        this.importLoading = false;
        event.target.value = '';
      }
    },
    triggerImport() {
      this.$refs.importInput.click();
    },
    async drawClose() {
      this.visible.role = false;
      this.curRow = null;
      this.treeData.length = 0;
    },
    // 数据加载完成后更新统计
    onDataLoaded(data, total) {
      // 计算统计数据
      this.stats.total = total || 0;
      this.stats.active = data?.filter(item => item.sysUserStatus === 1)?.length || 0;
      this.stats.disabled = data?.filter(item => item.sysUserStatus === 0)?.length || 0;
      // 今日新增（简化处理，实际应从后端获取）
      const today = new Date().toISOString().split('T')[0];
      this.stats.todayNew = data?.filter(item => item.createTime?.startsWith(today))?.length || 0;
    },
    // 表格选择变化
    handleSelectionChange(selection) {
      this.selectedUsers = selection;
    },
    // 重置密码
    async handleResetPassword(row) {
      try {
        const { code, data, msg } = await fetchResetPassword(row.sysUserId);
        if (code === '00000') {
          this.$msgbox({
            title: '密码已重置',
            message: `用户 ${row.sysUserUsername} 的新密码为：${data}`,
            confirmButtonText: '复制密码',
            showCancelButton: true,
            cancelButtonText: '关闭',
          }).then(() => {
            navigator.clipboard?.writeText(data);
            message('密码已复制到剪贴板', { type: 'success' });
          }).catch(() => {});
        } else {
          message(msg || '重置密码失败', { type: 'error' });
        }
      } catch (error) {
        message('重置密码失败', { type: 'error' });
      }
    },
    // 批量删除
    async handleBatchDelete() {
      if (!this.hasSelected) return;
      
      // 过滤系统用户
      const deletableUsers = this.selectedUsers.filter(u => !u.sysUserInSystem);
      if (deletableUsers.length === 0) {
        message('所选用户均为系统用户，无法删除', { type: 'warning' });
        return;
      }

      try {
        await this.$confirm(`确定要删除选中的 ${deletableUsers.length} 个用户吗？`, '批量删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        
        this.batchLoading = true;
        const userIds = deletableUsers.map(u => u.sysUserId);
        
        // 逐个删除（后端暂无批量删除接口）
        let successCount = 0;
        for (const userId of userIds) {
          const { code } = await fetchDeleteUser(userId);
          if (code === '00000') successCount++;
        }
        
        message(`成功删除 ${successCount} 个用户`, { type: 'success' });
        this.$refs.table.reload();
        this.selectedUsers = [];
      } catch (error) {
        if (error !== 'cancel') {
          message('批量删除失败', { type: 'error' });
        }
      } finally {
        this.batchLoading = false;
      }
    },
    // 批量启用/禁用
    async handleBatchStatus(status) {
      if (!this.hasSelected) return;
      
      const statusText = status === 1 ? '启用' : '禁用';
      try {
        await this.$confirm(`确定要${statusText}选中的 ${this.selectedCount} 个用户吗？`, `批量${statusText}`, {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        
        this.batchLoading = true;
        let successCount = 0;
        
        for (const user of this.selectedUsers) {
          user.sysUserStatus = status;
          const result = await fetchUpdateUser(user);
          if (result?.code === '00000') successCount++;
        }
        
        message(`成功${statusText} ${successCount} 个用户`, { type: 'success' });
        this.$refs.table.reload();
        this.selectedUsers = [];
      } catch (error) {
        if (error !== 'cancel') {
          message(`批量${statusText}失败`, { type: 'error' });
        }
      } finally {
        this.batchLoading = false;
      }
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
        <!-- 统计面板 -->
        <div v-if="showQuery" class="user-stats">
          <div class="stat-item">
            <div class="stat-icon total">
              <IconifyIconOnline icon="ri:team-line" :size="32" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.total }}</span>
              <span class="stat-label">全部用户</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon active">
              <IconifyIconOnline icon="ri:user-follow-line" :size="32" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.active }}</span>
              <span class="stat-label">已启用</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon disabled">
              <IconifyIconOnline icon="ri:user-unfollow-line" :size="32" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.disabled }}</span>
              <span class="stat-label">已禁用</span>
            </div>
          </div>
          <div class="stat-item">
            <div class="stat-icon new">
              <IconifyIconOnline icon="ri:user-add-line" :size="32" />
            </div>
            <div class="stat-info">
              <span class="stat-value">{{ stats.todayNew }}</span>
              <span class="stat-label">今日新增</span>
            </div>
          </div>
        </div>

        <el-header v-if="showQuery">
          <div class="flex items-center justify-between">
            <ScFilterBar :options="filterOptions" :show-number="showNumber" @search="onSearch" class="flex-1" />
            <div v-if="showTool" class="flex items-center gap-2 ml-4">
              <el-button type="primary" :icon="Edit" @click="dialogOpen({}, 'save')">{{ $t('buttons.add') }}</el-button>
              
              <!-- 批量操作下拉菜单 -->
              <el-dropdown trigger="click" :disabled="!hasSelected">
                <el-button :disabled="!hasSelected" :loading="batchLoading">
                  <IconifyIconOnline icon="ri:checkbox-multiple-line" class="mr-1" />
                  批量操作
                  <el-badge v-if="hasSelected" :value="selectedCount" class="ml-1" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleBatchStatus(1)">
                      <IconifyIconOnline icon="ri:check-line" class="mr-1 text-green-500" />批量启用
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleBatchStatus(0)">
                      <IconifyIconOnline icon="ri:close-line" class="mr-1 text-orange-500" />批量禁用
                    </el-dropdown-item>
                    <el-dropdown-item divided @click="handleBatchDelete">
                      <IconifyIconOnline icon="ri:delete-bin-line" class="mr-1 text-red-500" />批量删除
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>

              <!-- 导入导出下拉菜单 -->
              <el-dropdown trigger="click">
                <el-button>
                  <IconifyIconOnline icon="ep:download" class="mr-1" />导入导出
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item @click="handleExportUsers">
                      <IconifyIconOnline icon="ep:download" class="mr-1" />导出用户
                    </el-dropdown-item>
                    <el-dropdown-item @click="handleDownloadTemplate">
                      <IconifyIconOnline icon="ep:document" class="mr-1" />下载模板
                    </el-dropdown-item>
                    <el-dropdown-item @click="triggerImport">
                      <IconifyIconOnline icon="ep:upload" class="mr-1" />导入用户
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
              <input ref="importInput" type="file" accept=".csv" style="display: none" @change="handleImportUsers" />
            </div>
          </div>
        </el-header>
        <el-main class="nopadding">
          <div ref="contentRef" class="h-full flex">
            <div :class="visible.role ? 'h-full !w-[60vw]' : 'h-full w-full'"
              style="transition: width 220ms cubic-bezier(0.4, 0, 0.2, 1)">
              <ScTable ref="table" :url="fetchPageUserValue" :params="form" @data-loaded="onDataLoaded" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="55" />
                <el-table-column type="index" label="序号" width="80px">
                  <template #default="scope">
                    <el-tag type="primary" size="small">{{ scope.$index + 1 }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="用户信息" prop="sysUserUsername" align="left" min-width="240px">
                  <template #default="{ row }">
                    <div class="user-info-cell">
                      <div class="user-avatar" :class="randomColor(row.sysUserSex)">
                        <el-avatar v-if="row.sysUserAvatar" :size="44" :src="row.sysUserAvatar" />
                        <span v-else class="avatar-text">{{ row.sysUserNickname ? row.sysUserNickname[0]?.toUpperCase() : "?" }}</span>
                      </div>
                      <div class="user-details">
                        <div class="user-name">
                          <span>{{ row.sysUserNickname }}</span>
                          <el-tag v-if="row.sysUserInSystem" type="warning" size="small" class="ml-1">系统</el-tag>
                        </div>
                        <div class="user-id">ID: {{ row.sysUserId }}</div>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="联系方式" prop="sysUserNickname" align="left" min-width="220px">
                  <template #default="{ row }">
                    <div class="contact-cell">
                      <div class="contact-item">
                        <IconifyIconOnline icon="ri:user-line" class="contact-icon" />
                        <span class="contact-label">账号</span>
                        <span class="contact-value">{{ row.sysUserUsername }}</span>
                      </div>
                      <div class="contact-item">
                        <IconifyIconOnline icon="ri:mail-line" class="contact-icon" />
                        <span class="contact-label">邮箱</span>
                        <span class="contact-value">{{ row.sysUserEmail || '-' }}</span>
                      </div>
                      <div class="contact-item">
                        <IconifyIconOnline icon="ri:phone-line" class="contact-icon" />
                        <span class="contact-label">手机</span>
                        <span class="contact-value">{{ row.sysUserPhone || '-' }}</span>
                      </div>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="sysUserRemark" align="center" min-width="120px" show-overflow-tooltip>
                  <template #default="{ row }">
                    <span v-if="row.sysUserRemark" class="remark-text">{{ row.sysUserRemark }}</span>
                    <span v-else class="no-data">-</span>
                  </template>
                </el-table-column>
                <el-table-column label="最后登录地址" prop="sysUserLastIp" align="left" min-width="140px">
                  <template #default="{ row }">
                    <ScIp :key="row.sysUserLastIp" :ip="row.sysUserLastIp" :physical-address="row.sysUserLastAddress">
                    </ScIp>
                  </template>
                </el-table-column>
                <el-table-column label="注册地址" prop="sysUserRegisterIp" align="left" min-width="140px">
                  <template #default="{ row }">
                    <ScIp :key="row.sysUserLastIp" :ip="row.sysUserRegisterIp"
                      :physical-address="row.sysUserRegisterAddress">
                    </ScIp>
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
                    <el-switch v-if="mode != 'view'" v-model="row.sysUserStatus"
                      style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" :active-value="1"
                      :inactive-value="0" @change="fetchUpdateUserValue(row)" />
                    <el-tag v-else :type="row.sysUserStatus == 1 ? 'success' : 'danger'">
                      {{ row.sysUserStatus == 1 ? "正常" : "禁用" }}
                    </el-tag>
                  </template>
                </el-table-column>

                <el-table-column label="最后登录" prop="sysUserLastLoginTime" align="left" min-width="200px">
                  <template #default="{ row }">
                    <div v-if="row.sysUserLastLoginTime" class="login-time-cell">
                      <div class="time-ago">
                        <IconifyIconOnline icon="ri:time-line" class="time-icon" />
                        <span>{{ getTimeAgo(row.sysUserLastLoginTime) }}</span>
                      </div>
                      <span class="time-detail">{{ row.sysUserLastLoginTime }}</span>
                      <div class="days-away" :class="getDaysAwayClass(row.sysUserLastLoginTime)">
                        <IconifyIconOnline icon="ri:calendar-line" class="days-icon" />
                        <span>已离开 {{ getDaysAway(row.sysUserLastLoginTime) }} 天</span>
                      </div>
                    </div>
                    <el-tag v-else type="info" size="small">从未登录</el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="注册时间" prop="createTime" align="left" min-width="180px">
                  <template #default="{ row }">
                    <div class="time-cell">
                      <span class="time-ago">{{ getTimeAgo(row.createTime) }}</span>
                      <span class="time-detail">{{ row.createTime }}</span>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column v-if="showTool" label="操作" fixed="right" min-width="180px">
                  <template #default="{ row }">
                    <el-tooltip content="编辑" placement="top">
                      <el-button v-auth="'sys:user:update'" v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text"
                        :icon="EditPen" @click="dialogOpen(row, 'edit')"></el-button>
                    </el-tooltip>
                    <el-tooltip content="重置密码" placement="top">
                      <el-popconfirm title="确定要重置此用户的密码吗？" @confirm="handleResetPassword(row)">
                        <template #reference>
                          <el-button v-auth="'sys:user:reset'" v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text" type="warning">
                            <IconifyIconOnline icon="ri:lock-password-line" />
                          </el-button>
                        </template>
                      </el-popconfirm>
                    </el-tooltip>
                    <el-tooltip content="删除" placement="top">
                      <el-popconfirm :title="$t('message.confimDelete')" @confirm="onDelete(row)">
                        <template #reference>
                          <el-button v-if="!row.sysUserInSystem" v-auth="'sys:user:delete'"
                            v-roles="['ADMIN', 'SUPER_ADMIN']" class="btn-text" type="danger" :icon="Delete"></el-button>
                        </template>
                      </el-popconfirm>
                    </el-tooltip>
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
// 用户统计面板样式
.user-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 16px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);

  .stat-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--el-fill-color-lighter);
    border-radius: 12px;
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: #fff;

      &.total {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }

      &.active {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
      }

      &.disabled {
        background: linear-gradient(135deg, #868f96 0%, #596164 100%);
      }

      &.new {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: var(--el-text-color-primary);
        line-height: 1.2;
      }

      .stat-label {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        margin-top: 4px;
      }
    }
  }
}

// 用户管理页面美化样式
.main.background-color {
  height: 100%;
  background-color: var(--el-bg-color);

  > .main {
    height: 100%;
    border-radius: var(--el-border-radius-base);
    overflow: hidden;
    box-shadow: var(--el-box-shadow-light);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: var(--el-box-shadow);
    }
  }
}

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
  padding: 16px 20px;
  background-color: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
  background-image: linear-gradient(135deg, var(--el-bg-color) 0%, var(--el-bg-color-page) 100%);
}

:deep(.el-main) {
  padding: 16px;
  background-color: var(--el-bg-color-page);
}

// 表格容器样式
:deep(.h-full) {
  background-color: var(--el-bg-color);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-lighter);
  overflow: hidden;
}

// 表格美化
:deep(.el-table) {
  .el-table__header {
    th {
      background-color: var(--el-fill-color-light) !important;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .el-table__row {
    transition: all 0.3s;

    &:hover {
      background-color: var(--el-fill-color-light) !important;
      transform: translateY(-1px);
    }

    &:nth-child(even) {
      background-color: var(--el-fill-color-lighter);
    }
  }
}

// 按钮悬浮效果
:deep(.el-button) {
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.left-panel {
  width: 81%;
}

// 用户信息单元格
.user-info-cell {
  display: flex;
  align-items: center;
  gap: 12px;

  .user-avatar {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;

    .avatar-text {
      font-size: 18px;
      font-weight: 600;
      color: #fff;
    }

    &.bg-blue-type {
      background: linear-gradient(135deg, #54a0ff 0%, #2e86de 100%);
      box-shadow: 0 2px 8px rgba(58, 142, 230, 0.3);
    }

    &.bg-red-type {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
      box-shadow: 0 2px 8px rgba(255, 73, 73, 0.3);
    }

    &.bg-gray-type {
      background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%);

      .avatar-text {
        color: #636e72;
      }
    }
  }

  .user-details {
    display: flex;
    flex-direction: column;
    gap: 2px;

    .user-name {
      display: flex;
      align-items: center;
      font-weight: 500;
      color: var(--el-text-color-primary);
    }

    .user-id {
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }
  }
}

// 联系方式单元格
.contact-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .contact-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;

    .contact-icon {
      color: var(--el-text-color-secondary);
      font-size: 14px;
    }

    .contact-label {
      color: var(--el-text-color-secondary);
      min-width: 32px;
    }

    .contact-value {
      color: var(--el-text-color-primary);
    }
  }
}

// 时间单元格
.time-cell,
.login-time-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;

  .time-ago {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;
    color: var(--el-text-color-primary);

    .time-icon {
      color: var(--el-color-primary);
      font-size: 14px;
    }
  }

  .time-detail {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .days-away {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 10px;
    margin-top: 4px;
    width: fit-content;

    .days-icon {
      font-size: 12px;
    }

    &.days-normal {
      background: rgba(103, 194, 58, 0.1);
      color: #67c23a;
    }

    &.days-warning {
      background: rgba(230, 162, 60, 0.1);
      color: #e6a23c;
    }

    &.days-danger {
      background: rgba(245, 108, 108, 0.1);
      color: #f56c6c;
    }
  }
}

// 备注文本
.remark-text {
  color: var(--el-text-color-regular);
}

.no-data {
  color: var(--el-text-color-placeholder);
}

// 用户头像颜色（兼容旧代码）
.bg-red-type {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(255, 73, 73, 0.3);
}

.bg-blue-type {
  background: linear-gradient(135deg, #54a0ff 0%, #2e86de 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(58, 142, 230, 0.3);
}

.bg-gray-type {
  background: linear-gradient(135deg, #dfe6e9 0%, #b2bec3 100%);
  color: #636e72;
}

// 标签美化
:deep(.el-tag) {
  border-radius: 4px;
  font-weight: 500;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
}

// 开关美化
:deep(.el-switch) {
  --el-switch-on-color: #13ce66;
  --el-switch-off-color: #ff4949;
}

// 操作按钮美化
.btn-text {
  transition: all 0.3s;

  &:hover {
    transform: scale(1.1);
  }
}

// 时间显示美化
.text-gray-400 {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

// 响应式适配
@media (max-width: 1200px) {
  .user-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .user-stats {
    grid-template-columns: repeat(2, 1fr);
    padding: 12px;
    gap: 12px;

    .stat-item {
      padding: 12px;

      .stat-icon {
        width: 44px;
        height: 44px;
      }

      .stat-info .stat-value {
        font-size: 20px;
      }
    }
  }
}

// 暗色主题适配
:root[data-theme='dark'] {
  .user-stats {
    background: var(--el-bg-color-overlay);

    .stat-item {
      background: var(--el-fill-color);
    }
  }

  .main.background-color {
    > .main {
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
    }
  }

  :deep(.el-header) {
    background-color: var(--el-bg-color-overlay);
    background-image: linear-gradient(135deg, var(--el-bg-color-overlay) 0%, var(--el-bg-color) 100%);
  }

  :deep(.h-full) {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-table) {
    .el-table__header {
      th {
        background-color: var(--el-fill-color) !important;
      }
    }

    .el-table__row {
      &:nth-child(even) {
        background-color: var(--el-fill-color);
      }
    }
  }

  .bg-red-type {
    box-shadow: 0 2px 8px rgba(255, 73, 73, 0.4);
  }

  .bg-blue-type {
    box-shadow: 0 2px 8px rgba(58, 142, 230, 0.4);
  }
}
</style>
