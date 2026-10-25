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

    <!-- 权限矩阵表：行 = 账号，列 = 权限类别，格内勾选展示该账号已拥有的全局权限。
         多账号横向对比权限一眼可见；勾选态只读（权限变更走「权限管理员」弹窗，避免
         逐格 GRANT/REVOKE 造成半同步）。 -->
    <ReTable
      :data="users"
      :columns="matrixColumns"
      :loading="loading || grantsLoading"
      :pagination="false"
      :border="true"
      size="mini"
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
      <!-- 每个权限类别一列：拥有则实心勾，否则空圆 -->
      <template
        v-for="g in MATRIX_GRANTS"
        :key="'col-' + g"
        #[`col-${g}`]="{ row }"
      >
        <span
          class="dus-cell"
          :class="{ 'dus-cell--on': hasGrant(row.name, row.host, g) }"
          :title="hasGrant(row.name, row.host, g) ? '已授予 ' + g : '未授予 ' + g"
        >
          {{ hasGrant(row.name, row.host, g) ? "✓" : "·" }}
        </span>
      </template>
      <template #col-ops="{ row }">
        <div class="dus-ops">
          <ReButton layout="square" size="small" icon="EditPen" tip="编辑" @click="pick(row); openSave(true)" />
          <ReButton layout="square" size="small" type="danger" icon="Delete" tip="删除" @click="pick(row); confirmDelete()" />
          <ReButton layout="square" size="small" icon="Key" tip="权限" @click="pick(row); openGrants()" />
        </div>
      </template>
    </ReTable>

    <!-- 底部权限详情卡：选中账号后展示 SHOW GRANTS 原文 + 资源限制 -->
    <div v-if="selectedUser" class="dus-detail" data-testid="dus-detail">
      <div class="dus-detail__head">
        <span class="dus-mono dus-detail__name">{{ selectedUser.name }}@{{ selectedUser.host }}</span>
        <ReButton size="small" icon="Refresh" :loading="grantsLoading" @click="loadGrantsFor(selectedUser)">刷新权限</ReButton>
      </div>
      <ReEmpty v-if="grantsError" :description="grantsError" />
      <div v-else class="dus-detail__grants">
        <ReEmpty v-if="detailGrants.length === 0" description="无权限记录（USAGE 仅表示可登录）" />
        <div
          v-for="(g, i) in detailGrants"
          :key="i"
          class="dus-detail__grant dus-mono"
        >{{ g }}</div>
      </div>
    </div>

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
          size="mini"
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
 * <p>矩阵表视图（design-exploration 方案 B）：行 = 账号、列 = 权限类别、格内勾选
 * 展示每个账号已拥有的全局权限；多账号横向对比一目了然。底部为选中账号的
 * SHOW GRANTS 权限详情卡。权限变更走「权限管理员」弹窗（GRANT/REVOKE 原子化）。</p>
 *
 * <p>数据来自后端 {@code /ms/monitor/db/users} 系列端点：账号列表（name@host / SSL /
 * 资源限制 / SUPER），每账号的权限经 {@code fetchDbUserGrants} 拉取 SHOW GRANTS 原文
 * 后解析成权限集合填充矩阵格。内核不支持时（非 MySQL/MariaDB）端点返回
 * {@code supported=false}，面板给出原因而非报错。</p>
 *
 * @author CH
 * @since 4.0.0.42
 */
import { message } from "@repo/core";
import { onMounted, ref, watch } from "vue";
import { ElCheckboxGroup, ElMessageBox, ElSwitch } from "element-plus";
import ReButton from "@repo/ui/re-button";
import ReDialog from "@repo/ui/re-dialog";
import ReEmpty from "@repo/ui/re-empty";
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

/** 可授予的全局权限选项（矩阵列与新建/编辑弹窗共用一份） */
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

/** 矩阵展示列：只展示高频权限，避免列过多挤压账号列 */
const MATRIX_GRANTS = [
  "SELECT",
  "INSERT",
  "UPDATE",
  "DELETE",
  "CREATE",
  "DROP",
  "ALTER",
  "INDEX",
  "ALL PRIVILEGES",
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

/** 每账号的权限集合缓存：key = name@host，value = 已授予的权限名集合 */
const grantSets = ref<Record<string, Set<string>>>({});

/** 底部详情卡的 grants 原文（当前选中账号） */
const detailGrants = ref<string[]>([]);

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

const matrixColumns: ReTableColumn[] = [
  { prop: "name", label: "用户名", minWidth: 170, slot: "col-name", fixed: true },
  { prop: "host", label: "主机", width: 100 },
  { prop: "sslType", label: "SSL", width: 70, slot: "col-ssl", align: "center" },
  { prop: "resources", label: "每小时查询/更新/连接 · 最大连接", minWidth: 210, slot: "col-resources", align: "center" },
  ...MATRIX_GRANTS.map(g => ({
    prop: g,
    label: g === "ALL PRIVILEGES" ? "ALL" : g,
    width: g === "ALL PRIVILEGES" ? 80 : 64,
    slot: `col-${g}` as string,
    align: "center" as const,
  })),
  { prop: "ops", label: "操作", width: 140, slot: "col-ops", align: "center", fixed: "right" },
];

const grantColumns: ReTableColumn[] = [
  { prop: "grant", label: "权限语句（SHOW GRANTS）", minWidth: 300 },
];

/** 从 SHOW GRANTS 原文解析该账号已拥有的权限名集合 */
function parseGrantsToSet(grants: string[]): Set<string> {
  const set = new Set<string>();
  for (const line of grants ?? []) {
    // 形如：GRANT SELECT, INSERT, ... ON *.* TO 'u'@'h'  或 GRANT USAGE ON *.* TO ...
    const m = /^\s*GRANT\s+(.+?)\s+ON\s+/i.exec(line);
    if (!m) continue;
    const privList = m[1]
      .split(",")
      .map(s => s.trim().toUpperCase())
      .filter(Boolean);
    for (const p of privList) {
      if (p === "ALL PRIVILEGES" || p === "ALL") {
        set.add("ALL PRIVILEGES");
        // 隐式拥有全部基础权限
        for (const g of USER_GRANTS) set.add(g);
      } else if (p === "USAGE" || p === "PROXY") {
        // USAGE 仅表示可登录，不映射权限格
      } else {
        set.add(p);
      }
    }
  }
  return set;
}

/** 账号是否已拥有某权限（矩阵格勾选态） */
function hasGrant(name: string, host: string, g: string): boolean {
  const set = grantSets.value[`${name}@${host}`];
  return !!set?.has(g);
}

/** 拉取某账号的 grants 并填充缓存 + 详情卡 */
async function loadGrantsFor(u: DbUserRow, forDetail = false): Promise<void> {
  const key = `${u.name}@${u.host}`;
  grantsLoading.value = true;
  if (forDetail) grantsError.value = "";
  try {
    const result = await fetchDbUserGrants({
      datasourceId: props.datasourceId,
      username: u.name,
      host: u.host,
    });
    const grants = result.grants ?? [];
    grantSets.value = { ...grantSets.value, [key]: parseGrantsToSet(grants) };
    if (forDetail) {
      detailGrants.value = grants;
    }
  } catch (e) {
    if (forDetail) grantsError.value = String((e as Error)?.message ?? e);
    // 单个账号拉取失败不阻塞整体：保留空权限集，用户可在底部详情卡看到错误
    if (!grantSets.value[key]) {
      grantSets.value = { ...grantSets.value, [key]: new Set() };
    }
  } finally {
    grantsLoading.value = false;
  }
}

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
  if (row) {
    detailGrants.value = [];
    void loadGrantsFor(row, true);
  } else {
    detailGrants.value = [];
  }
}

/** 加载用户列表；随后为每个账号预取 grants 填充矩阵格 */
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
    // 清掉被删账号的缓存
    const keep = new Set((result.users ?? []).map(u => `${u.name}@${u.host}`));
    grantSets.value = Object.fromEntries(
      Object.entries(grantSets.value).filter(([k]) => keep.has(k)),
    );
    if (selectedUser.value && !keep.has(`${selectedUser.value.name}@${selectedUser.value.host}`)) {
      selectedUser.value = null;
    }
    // 预取矩阵权限（并行，限用户数量避免大库打满）
    const rows = (result.users ?? []).slice(0, 50);
    await Promise.allSettled(rows.map(u => loadGrantsFor(u, false)));
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

/** 加载权限弹窗数据 */
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
  grantSets.value = {};
  detailGrants.value = [];
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
/* 操作列：三个图标按钮必须同一行（mini 行高下最容易挤成两行、第三个还会被右边界切掉） */
.dus-ops {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
/* 矩阵权限格：拥有=实心勾（主色），未拥有=空圆（占位灰） */
.dus-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-placeholder);
  cursor: default;
}
.dus-cell--on {
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
/* 底部权限详情卡 */
.dus-detail {
  flex: 0 0 auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-base, 6px);
  background: var(--el-bg-color-overlay);
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dus-detail__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.dus-detail__name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.dus-detail__grants {
  max-height: 96px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dus-detail__grant {
  font-size: 11.5px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  border-radius: 4px;
  padding: 2px 8px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
