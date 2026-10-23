<template>
  <div class="dus">
    <!-- 工具条：新建 / 编辑 / 删除 / 权限管理员（对齐 Navicat 用户管理） -->
    <div class="dus-bar">
      <ReButton
        size="small"
        type="primary"
        icon="Plus"
        data-testid="dus-btn-create"
        @click="openSave(false)"
      >新建用户</ReButton>
      <ReButton
        size="small"
        icon="EditPen"
        data-testid="dus-btn-edit"
        :disabled="!selectedUser"
        @click="openSave(true)"
      >编辑用户</ReButton>
      <ReButton
        size="small"
        type="danger"
        plain
        icon="Delete"
        data-testid="dus-btn-delete"
        :disabled="!selectedUser"
        @click="confirmDelete"
      >删除用户</ReButton>
      <ReButton
        size="small"
        icon="Key"
        data-testid="dus-btn-grants"
        :disabled="!selectedUser"
        @click="openGrants"
      >权限管理员</ReButton>
      <span class="dus-spacer" />
      <ReButton size="small" icon="Refresh" data-testid="dus-btn-refresh" :loading="loading" @click="loadUsers">
        刷新
      </ReButton>
      <span v-if="!supported" class="dus-unsupported">{{ unsupportedMessage || "该数据库内核不支持用户管理（仅 MySQL/MariaDB 支持）" }}</span>
    </div>

    <ReTable
      :data="users"
      :columns="columns"
      :loading="loading"
      :pagination="false"
      :border="true"
      stripe
      highlight-current-row
      row-key="name"
      empty-text="暂无用户"
      @current-change="onCurrentChange"
    >
      <template #col-name="{ row }">
        <span class="dus-mono">{{ row.name }}@{{ row.host }}</span>
        <ReTag v-if="row.isSuper" effect="plain" type="danger" size="small" class="dus-super">SUPER</ReTag>
      </template>
      <template #col-ssl="{ row }">
        <span class="dus-mono">{{ row.sslType || "—" }}</span>
      </template>
      <template #col-resources="{ row }">
        <span class="dus-num">{{ limitText(row.maxQuestionsPerHour) }}</span>
        <span class="dus-slash">/</span>
        <span class="dus-num">{{ limitText(row.maxUpdatesPerHour) }}</span>
        <span class="dus-slash">/</span>
        <span class="dus-num">{{ limitText(row.maxConnectionsPerHour) }}</span>
        <span class="dus-slash">/</span>
        <span class="dus-num">{{ limitText(row.maxUserConnections) }}</span>
      </template>
      <template #col-ops="{ row }">
        <ReButton layout="square" size="small" icon="EditPen" tip="编辑" @click="pick(row); openSave(true)" />
        <ReButton layout="square" size="small" type="danger" icon="Delete" tip="删除" @click="pick(row); confirmDelete()" />
        <ReButton layout="square" size="small" icon="Key" tip="权限" @click="pick(row); openGrants()" />
      </template>
    </ReTable>

    <!-- 新建 / 编辑用户弹窗 -->
    <ReDialog v-model="saveVisible" :title="saveMode ? `编辑用户 · ${saveForm.username}@${saveForm.host}` : '新建用户'" width="560px">
      <div class="dus-form">
        <div class="dus-form-item">
          <label>用户名</label>
          <ReInput v-model="saveForm.username" :disabled="saveMode" placeholder="请输入用户名" data-testid="dus-form-username" />
        </div>
        <div class="dus-form-item">
          <label>主机</label>
          <ReInput v-model="saveForm.host" placeholder="如 localhost / %" data-testid="dus-form-host" />
        </div>
        <div class="dus-form-item">
          <label>{{ saveMode ? "新密码" : "密码" }}</label>
          <ReInput v-model="saveForm.password" type="password" show-password placeholder="请输入密码" data-testid="dus-form-password" />
        </div>
        <div class="dus-form-item">
          <label>确认密码</label>
          <ReInput v-model="saveForm.confirmPassword" type="password" show-password placeholder="请再次输入密码" data-testid="dus-form-confirm" />
        </div>
        <div class="dus-form-item">
          <label>授予权限</label>
          <ElCheckboxGroup v-model="saveForm.grants" class="dus-grants">
            <el-checkbox v-for="g in USER_GRANTS" :key="g" :value="g as string">
              {{ g }}
            </el-checkbox>
          </ElCheckboxGroup>
          <div class="dus-super-row">
            <ElSwitch v-model="saveForm.superUser" />
            <span>超级用户（GRANT SUPER ON *.*）</span>
          </div>
          <span class="dus-hint">勾选后追加 <code>GRANT ... ON *.* TO 'user'@'host'</code></span>
        </div>
      </div>
      <template #footer>
        <ReButton @click="saveVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" data-testid="dus-form-save" @click="saveUser">保存</ReButton>
      </template>
    </ReDialog>

    <!-- 权限管理员弹窗 -->
    <ReDialog v-model="grantsVisible" :title="`权限管理员 · ${grantsUser?.name}@${grantsUser?.host}`" width="640px">
      <div class="dus-grants-body">
        <ReButton size="small" icon="Refresh" :loading="grantsLoading" @click="loadGrants">刷新权限</ReButton>
        <p v-if="grantsError" class="dus-error">{{ grantsError }}</p>
        <ReTable
          v-else
          :data="grantsRows"
          :columns="grantColumns"
          :pagination="false"
          :border="true"
          stripe
          empty-text="无权限记录"
        />
      </div>
      <template #footer>
        <ReButton @click="grantsVisible = false">关闭</ReButton>
      </template>
    </ReDialog>
  </div>
</template>

<script setup lang="ts">
/**
 * 用户管理面板（内嵌于 JDBC 控制台 DatabaseManagerView 的 users 页签）。
 *
 * <p>对齐 Navicat 用户管理：用户列表 + 新建/编辑/删除/权限管理员工具条。
 * 数据来自后端 {@code /ms/monitor/db/users} 系列端点；内核不支持时
 * （非 MySQL/MariaDB）端点返回 {@code supported=false}，面板给出原因而非报错。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { onMounted, ref, watch } from "vue";
import { ElCheckboxGroup, ElMessageBox, ElSwitch } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReIcon from "@repo/ui/re-icon";
import ReInput from "@repo/ui/re-input";
import ReTable from "@repo/ui/re-table";
import ReTag from "@repo/ui/re-tag";
import type { ReTableColumn } from "@repo/ui/re-table";
import {
  createDbUser,
  deleteDbUser,
  fetchDbUserGrants,
  fetchDbUsers,
  updateDbUser,
  type DbUserRow,
} from "../../api/manageConsoles";

const props = withDefaults(defineProps<{ datasourceId?: number }>(), { datasourceId: 0 });

/** 可授予的全局权限选项 */
const USER_GRANTS = [
  "ALL PRIVILEGES",
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "INDEX",
  "REFERENCES",
] as const;

const users = ref<DbUserRow[]>([]);
const loading = ref(false);
const supported = ref(true);
const unsupportedMessage = ref("");
const selectedUser = ref<DbUserRow | null>(null);

/** 保存弹窗状态 */
const saveVisible = ref(false);
const saveMode = ref(false);
const saving = ref(false);
const saveForm = reactiveForm();

/** 权限弹窗状态 */
const grantsVisible = ref(false);
const grantsLoading = ref(false);
const grantsError = ref("");
const grantsRows = ref<{ grant: string }[]>([]);
const grantsUser = ref<DbUserRow | null>(null);

function reactiveForm() {
  return ref<{
    username: string;
    host: string;
    password: string;
    confirmPassword: string;
    grants: string[];
    superUser: boolean;
  }>({ username: "", host: "%", password: "", confirmPassword: "", grants: [], superUser: false });
}

const columns: ReTableColumn[] = [
  { prop: "name", label: "用户名", minWidth: 180, slot: "col-name" },
  { prop: "host", label: "主机", width: 110 },
  { prop: "sslType", label: "SSL 类型", width: 90, slot: "col-ssl", align: "center" },
  { prop: "resources", label: "每小时查询/更新/连接 · 最大连接", minWidth: 220, slot: "col-resources", align: "center" },
  { prop: "ops", label: "操作", width: 110, slot: "col-ops", align: "center" },
];

const grantColumns: ReTableColumn[] = [
  { prop: "grant", label: "权限语句（SHOW GRANTS）", minWidth: 300 },
];

function limitText(v: number | null | undefined): string {
  if (v == null || v === -1 || v === 0) {
    return "∞";
  }
  return String(v);
}

function pick(row: DbUserRow) {
  selectedUser.value = row;
}

function onCurrentChange(row: DbUserRow | null) {
  selectedUser.value = row;
}

/** 加载用户列表 */
async function loadUsers() {
  const id = props.datasourceId;
  if (!id) {
    users.value = [];
    return;
  }
  loading.value = true;
  try {
    const result = await fetchDbUsers(id);
    supported.value = !!result.supported;
    unsupportedMessage.value = result.message ?? "";
    users.value = result.users ?? [];
    // 选中的行可能已被删掉，清掉悬空引用
    if (selectedUser.value && !users.value.some(u => u.name === selectedUser.value?.name && u.host === selectedUser.value?.host)) {
      selectedUser.value = null;
    }
  } catch (e) {
    message.error(`加载用户失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    loading.value = false;
  }
}

/** 打开新建 / 编辑弹窗 */
function openSave(edit: boolean) {
  saveMode.value = edit;
  if (edit && selectedUser.value) {
    const u = selectedUser.value;
    saveForm.value = {
      username: u.name,
      host: u.host,
      password: "",
      confirmPassword: "",
      grants: [],
      superUser: !!u.isSuper,
    };
  } else {
    saveForm.value = { username: "", host: "%", password: "", confirmPassword: "", grants: [], superUser: false };
  }
  saveVisible.value = true;
}

/** 保存用户（新建走 CREATE USER，编辑走 ALTER USER） */
async function saveUser() {
  const username = saveForm.value.username.trim();
  const host = (saveForm.value.host.trim() || "%").trim();
  const password = saveForm.value.password;
  if (!username) {
    message.warning("请输入用户名");
    return;
  }
  if (!/^[A-Za-z0-9_$.]+$/.test(username)) {
    message.warning("用户名只能包含字母、数字、下划线、$ 和点");
    return;
  }
  if (!/^[A-Za-z0-9_$.%\-]+$/.test(host)) {
    message.warning("主机名不合法");
    return;
  }
  if (!saveMode.value && password !== saveForm.value.confirmPassword) {
    message.warning("两次输入的密码不一致");
    return;
  }
  saving.value = true;
  try {
    const payload = {
      datasourceId: props.datasourceId,
      username,
      host,
      password: password || undefined,
      grants: saveForm.value.grants,
      superUser: saveForm.value.superUser,
    };
    if (saveMode.value) {
      await updateDbUser(payload);
      message.success("用户已更新");
    } else {
      await createDbUser(payload);
      message.success("用户创建成功");
    }
    saveVisible.value = false;
    await loadUsers();
  } catch (e) {
    message.error(`保存用户失败: ${String((e as Error)?.message ?? e)}`);
  } finally {
    saving.value = false;
  }
}

/** 删除用户（需二次确认） */
async function confirmDelete() {
  const u = selectedUser.value;
  if (!u) {
    message.warning("请先选择要删除的用户");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认删除用户 ${u.name}@${u.host}？删除后该用户将无法登录。`, "删除用户", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteDbUser({ datasourceId: props.datasourceId, username: u.name, host: u.host });
    message.success(`用户 ${u.name} 已删除`);
    selectedUser.value = null;
    await loadUsers();
  } catch (e) {
    message.error(`删除用户失败: ${String((e as Error)?.message ?? e)}`);
  }
}

/** 打开权限管理员弹窗 */
async function openGrants() {
  const u = selectedUser.value;
  if (!u) {
    message.warning("请先选择要查看权限的用户");
    return;
  }
  grantsUser.value = u;
  grantsVisible.value = true;
  grantsRows.value = [];
  grantsError.value = "";
  await loadGrants();
}

/** 加载用户权限（SHOW GRANTS） */
async function loadGrants() {
  const u = grantsUser.value;
  if (!u) {
    return;
  }
  grantsLoading.value = true;
  grantsError.value = "";
  try {
    const result = await fetchDbUserGrants({
      datasourceId: props.datasourceId,
      username: u.name,
      host: u.host,
    });
    grantsRows.value = (result.grants ?? []).map(g => ({ grant: g }));
  } catch (e) {
    grantsError.value = String((e as Error)?.message ?? e);
  } finally {
    grantsLoading.value = false;
  }
}

watch(() => props.datasourceId, () => {
  selectedUser.value = null;
  void loadUsers();
});

onMounted(loadUsers);
</script>

<style scoped lang="scss">
.dus {
  display: flex;
  flex-direction: column;
  gap: 10px;
  height: 100%;
  min-height: 0;
}
.dus-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.dus-spacer {
  flex: 1 1 auto;
}
.dus-unsupported {
  font-size: 12px;
  color: var(--el-color-danger);
}
.dus-mono {
  font-family: var(--el-font-family-mono, ui-monospace, SFMono-Regular, Consolas, monospace);
  font-size: 12.5px;
  font-variant-numeric: tabular-nums;
}
.dus-num {
  font-variant-numeric: tabular-nums;
}
.dus-slash {
  margin: 0 3px;
  color: var(--el-text-color-placeholder);
}
.dus-super {
  margin-left: 6px;
}
.dus-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.dus-form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  > label {
    font-size: 12.5px;
    color: var(--el-text-color-regular);
  }
}
.dus-grants {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
}
.dus-grant {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}
.dus-super-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 12px;
}
.dus-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  code {
    font-family: var(--el-font-family-mono, monospace);
    font-size: 12px;
  }
}
.dus-grants-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.dus-error {
  margin: 0;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
}
</style>
