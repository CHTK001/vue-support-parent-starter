<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 用户分页查询 + 增删改查 + 重置密码 + 分配角色。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { computed, nextTick, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { User, Plus, Edit, Delete, Search, Refresh, Key, UserFilled, Upload, Download, More, Lock, Unlock, View, CopyDocument, Iphone, Message, Female, Male, Postcard } from "@element-plus/icons-vue";
import {
  pageForUser,
  saveUser,
  updateUser,
  deleteUser,
  deleteUsers,
  updateUsersStatus,
  resetUserPassword,
  listForRole,
  listForPost,
  listDept,
  exportUsers,
  importUsers,
  downloadUserTemplate,
  lockUser,
  unbindTotp,
} from "../api/systemApi";
import type { SysDept, SysPost, SysRole, SysUser, SysUserUpdate, SysUserLog, SysLog } from "../api/types";
import { pageForUserLog, pageForSysLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import useUserStore from "@repo/pinia/modules/user";

const userStore = useUserStore();
const statusLoading = ref<number>(0);
const deleteLoading = ref<number>(0);
const resettingPwd = ref<number>(0);

const userSexOptions = [
  { label: "男", value: 0 },
  { label: "女", value: 1 },
];

const userStatusOptions = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];

const query = ref<{
  page: number;
  pageSize: number;
  sysUserName?: string;
  sysUserPhone?: string;
  sysUserStatus?: number;
  sysDeptId?: number;
}>({
  page: 1,
  pageSize: 10,
});

const searchFilters = computed(() => [
  { key: 'sysUserName', label: '用户名称', type: 'input' as const, placeholder: '请输入' },
  { key: 'sysUserPhone', label: '手机号', type: 'input' as const, placeholder: '请输入' },
  {
    key: 'sysDeptId', label: '部门', type: 'treeselect' as const, placeholder: '请选择',
    options: depts.value as any,
    attrs: {
      props: { value: 'sysDeptId', label: 'sysDeptName', children: 'children' },
      checkStrictly: true, clearable: true,
    },
  },
  {
    key: 'sysUserStatus', label: '状态', type: 'select' as const, placeholder: '请选择',
    options: [
      { label: '启用', value: 1 },
      { label: '禁用', value: 0 },
    ],
  },
]);

async function loadUsers({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForUser({
    page,
    pageSize,
    sysUserName: (params.sysUserName as string) || undefined,
    sysUserPhone: (params.sysUserPhone as string) || undefined,
    sysUserStatus: params.sysUserStatus === "" ? undefined : (params.sysUserStatus as number),
    sysDeptId: params.sysDeptId === "" ? undefined : (params.sysDeptId as number),
  } as any);
  total.value = res?.data?.total ?? 0;
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();
const total = ref(0);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / (query.value.pageSize || 10))));
function goPage(p: number) {
  query.value.page = p;
  // 直接调用 ReTable 的 goto，它会同步 internalPage 并 reload
  tableRef.value?.goto(p);
}

const roles = ref<SysRole[]>([]);
const depts = ref<SysDept[]>([]);
const posts = ref<SysPost[]>([]);

async function loadRoles() {
  try {
    const res = await listForRole();
    roles.value = (res?.data ?? []) as SysRole[];
  } catch (e) {
    console.warn("[user] 角色列表加载失败", e);
  }
}

async function loadDepts() {
  try {
    const res = await listDept();
    depts.value = (res?.data ?? []) as SysDept[];
  } catch (e) {
    console.warn("[user] 部门列表加载失败", e);
  }
}

async function loadPosts() {
  try {
    const res = await listForPost();
    posts.value = (res?.data ?? []) as SysPost[];
  } catch (e) {
    console.warn("[user] 岗位列表加载失败", e);
  }
}

/* ================== 多选与批量操作 ================== */
const selectedRows = ref<SysUser[]>([]);
const batchLoading = ref(false);

function handleSelectionChange(rows: SysUser[]) {
  selectedRows.value = rows;
}

/** 选中的用户ID（过滤掉当前登录用户） */
function selectedUserIds(): number[] {
  return selectedRows.value
    .map((u) => u.sysUserId)
    .filter((v): v is number => !!v);
}

function isSelf(user: SysUser): boolean {
  return user.sysUserUsername === userStore.loginName || user.sysUserUsername === userStore.username;
}

/* ================== 只读 / 锁定 / 2FA 辅助 ================== */

/** 任意角色编码命中 readonly（忽略大小写）即视为只读用户 */
function isReadonlyUser(user: SysUser): boolean {
  const codes = (user.userRoles ?? []).map((r) => (r.sysRoleCode ?? "").toLowerCase());
  return codes.some((c) => c.includes("readonly") || c === "read_only" || c === "ro");
}

/** 是否已绑定 2FA（列表返回 sysUserTotpCode 非空即视为已绑定） */
function hasTotp(user: SysUser): boolean {
  return !!(user as unknown as Record<string, unknown>).sysUserTotpCode;
}

/** 是否已锁定（sysUserLock=1） */
function isLocked(user: SysUser): boolean {
  return Number((user as unknown as Record<string, unknown>).sysUserLock) === 1;
}

/** 锁定用户行浅红背景 */
function rowClassName({ row }: { row: Record<string, unknown> }): string {
  return Number((row as Record<string, unknown>).sysUserLock) === 1 ? "user-locked-row" : "";
}

const lockLoading = ref<number>(0);

/** 锁定 / 解锁切换 */
async function handleToggleLock(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (!user.sysUserId) return;
  const locking = !isLocked(user);
  try {
    await ElMessageBox.confirm(
      `确认${locking ? "锁定" : "解锁"}用户「${user.sysUserNickname ?? user.sysUserUsername}」？`,
      locking ? "锁定确认" : "解锁确认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  lockLoading.value = user.sysUserId;
  try {
    await lockUser(user.sysUserId, locking ? 1 : 0);
    ElMessage.success(locking ? "已锁定" : "已解锁");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    lockLoading.value = 0;
  }
}

/** 管理员强制解绑 2FA */
async function handleUnbindTotp(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (!user.sysUserId) return;
  try {
    await ElMessageBox.confirm(
      `确认强制解绑「${user.sysUserNickname ?? user.sysUserUsername}」的二次验证（2FA）？`,
      "解绑确认",
      { type: "warning" },
    );
  } catch {
    return;
  }
  try {
    await unbindTotp();
    ElMessage.success("已解绑 2FA");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "解绑失败");
  }
}

async function handleBatchStatus(status: number) {
  const ids = selectedUserIds();
  if (!ids.length) {
    ElMessage.warning("请先选择用户");
    return;
  }
  const actionText = status === 1 ? "禁用" : "启用";
  try {
    await ElMessageBox.confirm(`确认批量${actionText}选中的 ${ids.length} 个用户？`, "批量操作确认", { type: "warning" });
  } catch {
    return;
  }
  batchLoading.value = true;
  try {
    await updateUsersStatus(ids, status);
    ElMessage.success(`已批量${actionText}`);
    selectedRows.value = [];
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量操作失败");
  } finally {
    batchLoading.value = false;
  }
}

async function handleBatchDelete() {
  const ids = selectedUserIds();
  if (!ids.length) {
    ElMessage.warning("请先选择用户");
    return;
  }
  try {
    await ElMessageBox.confirm(`确认批量删除选中的 ${ids.length} 个用户？此操作不可恢复`, "批量删除确认", { type: "warning" });
  } catch {
    return;
  }
  batchLoading.value = true;
  try {
    await deleteUsers(ids);
    ElMessage.success("批量删除成功");
    selectedRows.value = [];
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批量删除失败");
  } finally {
    batchLoading.value = false;
  }
}

/* ================== 用户详情抽屉 ================== */
const detailDrawerVisible = ref(false);
const detailUser = ref<SysUser | null>(null);

function openDetail(row: Record<string, unknown>) {
  detailUser.value = row as unknown as SysUser;
  detailDrawerVisible.value = true;
}

/** 按部门ID查找部门名称 */
function deptNameOf(deptId?: number): string {
  if (!deptId) return "-";
  const walk = (nodes: SysDept[]): string | null => {
    for (const n of nodes) {
      if (n.sysDeptId === deptId) return n.sysDeptName ?? "";
      if (n.children?.length) {
        const hit = walk(n.children);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk(depts.value) ?? "-";
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  nextTick(() => { tableRef.value?.reload(); });
}

/* ================== 导入导出 ================== */

const importInput = ref<HTMLInputElement>();
const importing = ref(false);
const exporting = ref(false);

/** 触发文件选择 */
function triggerImport() {
  importInput.value?.click();
}

/** 下载导入模板 */
async function handleDownloadTemplate() {
  try {
    const blob = await downloadUserTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "用户导入模板.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("模板下载成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "模板下载失败");
  }
}

/** 导出当前筛选结果 */
async function handleExport() {
  exporting.value = true;
  try {
    const blob = await exportUsers({
      sysUserName: query.value.sysUserName,
      sysUserPhone: query.value.sysUserPhone,
      sysUserStatus: query.value.sysUserStatus,
      sysDeptId: query.value.sysDeptId,
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `用户列表_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}

/** 处理文件选择并导入 */
async function handleFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  importing.value = true;
  try {
    const res = await importUsers(file);
    if (res?.code === 200 || res?.status === 200) {
      ElMessage.success(res?.data ?? "导入成功");
      tableRef.value?.reload();
    } else {
      ElMessage.error(res?.msg ?? "导入失败");
    }
  } catch (err) {
    ElMessage.error((err as Error)?.message ?? "导入失败");
  } finally {
    importing.value = false;
    input.value = "";
  }
}

const dialogVisible = ref(false);
const okText = ref('\u786e\u5b9a');
const cancelText = ref('\u53d6\u6d88');
const profileVisible = ref(false);
const profileUser = ref<SysUser | null>(null);
const loginLogs = ref<SysUserLog[]>([]);
const operLogs = ref<SysLog[]>([]);
const loadingLogs = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysUserUpdate>({});
const avatarInputRef = ref<HTMLInputElement | null>(null);
const rowAvatarInputRef = ref<HTMLInputElement | null>(null);
const currentAvatarRow = ref<Record<string, unknown> | null>(null);

function triggerAvatarUpload() {
  avatarInputRef.value?.click();
}

function onIdCardChange(val: string) {
  if (!val || val.length !== 18) return;
  // 第17位奇数男，偶数女
  const sexDigit = parseInt(val.charAt(16), 10);
  if (!isNaN(sexDigit)) {
    form.value.sysUserSex = sexDigit % 2 === 1 ? 0 : 1;
  }
  // 年龄
  const birthYear = parseInt(val.substring(6, 10), 10);
  if (!isNaN(birthYear)) {
    const now = new Date().getFullYear();
    form.value.sysUserAge = now - birthYear;
  }
}

function triggerAvatarUploadForRow(row: Record<string, unknown>) {
  currentAvatarRow.value = row;
  rowAvatarInputRef.value?.click();
}

function handleRowAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !currentAvatarRow.value) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 64, 64);
      const base64 = canvas.toDataURL('image/jpeg', 0.4);
      const userId = currentAvatarRow.value.sysUserId;
      if (userId) {
        try {
          await updateUser({ sysUserId: userId, sysUserAvatar: base64 } as any);
          ElMessage.success('头像已更新');
          tableRef.value?.reload();
        } catch (e: any) {
          console.error('头像更新失败:', e);
          ElMessage.error(e?.msg || e?.message || '头像更新失败');
        }
      }
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
  (e.target as HTMLInputElement).value = '';
}

function handleAvatarChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 64;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 64, 64);
      form.value.sysUserAvatar = canvas.toDataURL('image/jpeg', 0.4);
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
}

function handleAdd() {
  isEdit.value = false;
  form.value = { sysUserStatus: 1, sysUserSex: 0 };
  dialogVisible.value = true;
}

async function loadProfileLogs(username?: string) {
  if (!username) return;
  loadingLogs.value = true;
  try {
    const [loginRes, operRes] = await Promise.all([
      pageForUserLog({ page: 1, pageSize: 10, sysLogUsername: username }),
      pageForSysLog({ page: 1, pageSize: 10, sysLogUsername: username }),
    ]);
    loginLogs.value = (loginRes?.data?.data?.list ?? []) as SysUserLog[];
    operLogs.value = (operRes?.data?.data?.list ?? []) as SysLog[];
  } catch {
    loginLogs.value = [];
    operLogs.value = [];
  } finally {
    loadingLogs.value = false;
  }
}

function handleProfile(row: Record<string, unknown>) {
  profileUser.value = row as unknown as SysUser;
  profileVisible.value = true;
  loadProfileLogs(profileUser.value.sysUserUsername);
}

function handleEdit(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  isEdit.value = true;
  const editableFields: (keyof SysUser)[] = [
    "sysUserId",
    "sysUserUsername",
    "sysUserNickname",
    "sysUserAvatar",
    "sysDeptId",
    "sysUserStatus",
    "sysUserPhone",
    "sysUserEmail",
    "sysUserSex",
    "sysUserRemark",
    "roleIds",
    "postIds",
  ];
  const clean: SysUserUpdate = {
    ...editableFields.reduce((acc, k) => {
      if (user[k] !== undefined) acc[k] = user[k];
      return acc;
    }, {} as Record<string, unknown>),
    roleIds: user.userRoles?.map((r) => r.sysRoleId).filter((v): v is number => !!v) ?? [],
    postIds: user.userPosts?.map((p) => p.sysPostId).filter((v): v is number => !!v) ?? [],
  };
  form.value = clean;
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysUserUsername || (!isEdit.value && !form.value.sysUserPassword) || !form.value.sysUserNickname) {
    ElMessage.warning("请填写账号、密码、昵称");
    return;
  }
  
  // 账号校验：不允许特殊字符和保留字
  const username = form.value.sysUserUsername.trim();
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    ElMessage.warning("账号只能使用字母、数字和下划线，不允许特殊字符");
    return;
  }
  // 不允许保留字作为账号
  const reservedUsernames = ["null", "void", "undefined", "admin", "sa", "root", "test", "guest", "anonymous"];
  if (reservedUsernames.includes(username.toLowerCase())) {
    ElMessage.warning("该名称为系统保留字，不允许作为账号");
    return;
  }
  
  if (!isEdit.value && form.value.sysUserPassword !== (form.value as any).sysUserPasswordConfirm) {
    ElMessage.warning("两次输入的密码不一致");
    return;
  }
  
  // 自动清理后的账号
  form.value.sysUserUsername = username;
  saving.value = true;
  try {
    const data: SysUserUpdate = { ...form.value, updateRole: form.value.roleIds && form.value.roleIds.length > 0 };
    if (isEdit.value) {
      const res: any = await updateUser(data);
      if (res && res.ok === false) throw new Error(res.msg || "修改失败");
      ElMessage.success("修改成功");
    } else {
      const res: any = await saveUser(data);
      if (res && res.ok === false) throw new Error(res.msg || "新增失败");
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e: any) {
    console.error('handleSubmit error:', e);
    ElMessage.error(e?.msg || e?.message || e?.response?.data?.msg || "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (deleteLoading.value) return;
  try {
    await ElMessageBox.confirm(`确认删除用户「${user.sysUserNickname ?? user.sysUserUsername}」？`, "提示", {
      type: "warning",
      confirmButtonText: "确定删除",
    });
  } catch {
    return;
  }
  deleteLoading.value = user.sysUserId!;
  try {
    await deleteUser(user.sysUserId!);
    ElMessage.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

async function handleStatus(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (statusLoading.value) return;
  if (user.sysUserUsername === userStore.loginName || user.sysUserUsername === userStore.username) {
    ElMessage.warning("不允许禁用自己");
    return;
  }
  statusLoading.value = user.sysUserId!;
  try {
    await updateUser({ ...user, sysUserStatus: user.sysUserStatus === 1 ? 0 : 1 });
    ElMessage.success(user.sysUserStatus === 1 ? "已禁用" : "已启用");
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    statusLoading.value = 0;
  }
}

async function handleChangeMyPwd() {
  try {
    const { value } = await ElMessageBox.prompt("请输入新密码", "修改密码", {
      inputPlaceholder: "新密码",
      inputPattern: /.{6,}/,
      inputErrorMessage: "密码至少6位",
    });
    await resetOwner();
    ElMessage.success("密码已重置，请使用新密码登录");
  } catch {
    // 用户取消
  }
}

// 重置密码对话框状态
const resetPwdDialogVisible = ref(false);
const resetPwdSaving = ref(false);
const resetPwdUser = ref<SysUser | null>(null);
const resetPwdMode = ref<"auto" | "manual">("auto"); // auto=自动生成, manual=手动输入
const resetPwdNew = ref("");
const resetPwdConfirm = ref("");

function openResetPwdDialog(row: Record<string, unknown>) {
  resetPwdUser.value = row as unknown as SysUser;
  resetPwdMode.value = "auto";
  resetPwdNew.value = "";
  resetPwdConfirm.value = "";
  resetPwdDialogVisible.value = true;
}

async function handleResetPwdSubmit() {
  if (!resetPwdUser.value) return;
  
  // 手动输入模式校验
  if (resetPwdMode.value === "manual") {
    if (!resetPwdNew.value) {
      ElMessage.warning("请输入新密码");
      return;
    }
    if (resetPwdNew.value !== resetPwdConfirm.value) {
      ElMessage.warning("两次输入的密码不一致");
      return;
    }
  }
  
  resetPwdSaving.value = true;
  try {
    if (resetPwdMode.value === "auto") {
      // 自动生成密码模式
      const res = await resetUserPassword(resetPwdUser.value.sysUserId!);
      const newPwd = (res as string) ?? "";
      resetPwdDialogVisible.value = false;
      
      // 显示新密码
      await ElMessageBox.alert(`新密码：${newPwd}，请妥善保管`, "重置成功", {
        confirmButtonText: "复制密码",
        distinguishCancelAndClose: false,
      }).then(() => {
        if (newPwd) {
          navigator.clipboard.writeText(newPwd);
          ElMessage.success("密码已复制到剪贴板");
        }
      }).catch(() => {
        ElMessage.warning("请截图保存新密码，关闭后将无法再次查看");
      });
    } else {
      // 手动输入密码模式
      await resetUserPassword(resetPwdUser.value.sysUserId!, resetPwdNew.value);
      ElMessage.success("密码已重置，请使用新密码登录");
      resetPwdDialogVisible.value = false;
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "重置失败");
  } finally {
    resetPwdSaving.value = false;
  }
}

const roleDialogVisible = ref(false);
const roleSaving = ref(false);
const currentUser = ref<SysUser | null>(null);
const userRoleIds = ref<number[]>([]);

function openRoleDialog(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  currentUser.value = user;
  userRoleIds.value = (user.userRoles ?? [])
    .map((r) => r.sysRoleId)
    .filter((v): v is number => !!v);
  roleDialogVisible.value = true;
}

async function handleSaveRoles() {
  if (!currentUser.value) return;
  roleSaving.value = true;
  try {
    await updateUser({
      ...currentUser.value,
      roleIds: userRoleIds.value,
      updateRole: true,
    });
    ElMessage.success("角色已更新");
    roleDialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    roleSaving.value = false;
  }
}

/** 「更多」下拉命令分发 */
function handleActionCommand(cmd: string, row: Record<string, unknown>) {
  if (cmd === "detail") openDetail(row);
  else if (cmd === "edit") handleEdit(row);
  else if (cmd === "role") openRoleDialog(row);
  else if (cmd === "resetPwd") openResetPwdDialog(row);
  else if (cmd === "delete") handleDelete(row);
  else if (cmd === "lock" || cmd === "unlock") handleToggleLock(row);
  else if (cmd === "unbindTotp") handleUnbindTotp(row);
}

const columns: ReTableColumn[] = [
  { prop: "sysUserUsername", label: "账号", minWidth: 200, slot: "username" },
  { prop: "sysUserNickname", label: "昵称", minWidth: 160, slot: "nickname" },
  { prop: "contact", label: "联系方式", minWidth: 200, slot: "contact" },
  { prop: "roles", label: "角色", minWidth: 160, slot: "roles" },
  { prop: "sysUserStatus", label: "状态", width: 100, slot: "status", align: "center" },
  { prop: "createTime", label: "创建时间", width: 160 },
  { prop: "sysUserLastLoginTime", label: "最近登录", minWidth: 160, showOverflowTooltip: true },
  { prop: "sysUserLastIp", label: "最近 IP", minWidth: 140, slot: "ip" },
  { prop: "action", label: "操作", width: 180, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  tableRef.value?.reload();
  loadRoles();
  loadDepts();
  loadPosts();
});
</script>

<template>
  <div class="system-page">
      <!-- 隐藏文件输入 -->
      <input
        ref="importInput"
        type="file"
        accept=".xlsx,.xls,.csv"
        style="display: none"
        @change="handleFileChange"
      />

      <ReTable
        ref="tableRef"
        table-id="system-user"
        :loader="loadUsers"
        :columns="columns"
        :pagination="true"
        :params="query"
        :auto-reload="false"
        :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
        :search-gap="16"
        v-model:search-model="query"
        row-key="sysUserId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        :row-class-name="rowClassName"
        @search-reset="handleReset"
        @selection-change="handleSelectionChange"
      >
        <!-- 工具栏：页面业务按钮（内置只保留 显示/隐藏搜索、刷新、搜索、重置） -->
        <template #toolbar>
          <ReButton layout="modern" type="primary" icon="Plus" @click="handleAdd">添加</ReButton>
          <ReButton layout="modern" icon="Download" @click="handleDownloadTemplate">下载模板</ReButton>
          <ReButton layout="modern" icon="Upload" :loading="importing" @click="triggerImport">导入用户</ReButton>
          <ReButton layout="modern" icon="Download" type="success" :loading="exporting" @click="handleExport">导出</ReButton>
        </template>

        <template #username="{ row }">
          <div class="flex items-center gap-2">
            <el-avatar :size="28" :src="row.sysUserAvatar" class="cursor-pointer" @click="triggerAvatarUploadForRow(row)">
              <el-icon><User /></el-icon>
            </el-avatar>
            <div class="flex flex-col">
              <span class="cursor-pointer text-[--el-color-primary]" @click="openDetail(row)">{{ row.sysUserUsername }}</span>
              <div class="flex gap-1 mt-0.5">
                <el-tag v-if="row.sysUserStatus !== 1" type="danger" effect="plain" size="small">禁用</el-tag>
                <el-tag v-else type="success" effect="plain" size="small">启用</el-tag>
                <el-tag v-if="row.sysUserLock === 1" type="warning" effect="plain" size="small">锁定</el-tag>
                <el-tag v-if="isReadonlyUser(row)" type="info" effect="plain" size="small">只读</el-tag>
              </div>
            </div>
            <input ref="rowAvatarInputRef" type="file" accept="image/*" style="display:none" @change="handleRowAvatarChange" />
          </div>
        </template>
        <template #nickname="{ row }">
          <span v-if="row.sysUserNickname" class="flex items-center gap-1">
            <el-icon :color="row.sysUserSex === 1 ? '#e91e63' : '#409eff'">
              <Female v-if="row.sysUserSex === 1" />
              <Male v-else />
            </el-icon>
            <span>{{ row.sysUserNickname }}</span>
          </span>
          <span v-else>-</span>
        </template>
        <template #contact="{ row }">
          <div class="flex flex-col gap-0.5 text-xs">
            <span v-if="row.sysUserPhone" class="flex items-center gap-1">
              <el-icon><Iphone /></el-icon>
              <span>{{ row.sysUserPhone }}</span>
            </span>
            <span v-if="row.sysUserEmail" class="flex items-center gap-1">
              <el-icon><Message /></el-icon>
              <span>{{ row.sysUserEmail }}</span>
            </span>
            <span v-if="row.sysUserIdCard" class="flex items-center gap-1">
              <el-icon><Postcard /></el-icon>
              <span>{{ row.sysUserIdCard }}</span>
            </span>
            <span v-if="!row.sysUserPhone && !row.sysUserEmail && !row.sysUserIdCard" class="text-[--el-text-color-secondary]">-</span>
          </div>
        </template>
        <template #ip="{ row }">
          <span v-if="row.sysUserLastIp" class="flex items-center gap-1 text-xs">
            <span>{{ row.sysUserLastIp }}</span>
            <span v-if="row.sysUserLastAddress" class="text-[--el-text-color-secondary]">{{ row.sysUserLastAddress }}</span>
          </span>
          <span v-else class="text-[--el-text-color-secondary]">-</span>
        </template>
        <template #roles="{ row }">
          <el-tag
            v-for="role in [...new Map((row.userRoles ?? []).map(r => [r.sysRoleId, r])).values()]"
            :key="role.sysRoleId"
            type="primary"
            effect="plain"
            size="small"
            class="mr-1"
          >
            {{ role.sysRoleName }}
          </el-tag>
          <span v-if="!row.userRoles?.length" class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #status="{ row }">
          <div class="flex flex-col items-center gap-1">
            <el-switch
              :model-value="row.sysUserStatus === 1"
              :disabled="statusLoading === row.sysUserId"
              @change="() => handleStatus(row)"
            />
            <ReTag v-if="isLocked(row)" type="danger" effect="dark" size="small">已锁定</ReTag>
          </div>
        </template>
        <template #totp="{ row }">
          <ReTag v-if="hasTotp(row)" type="success" effect="plain" size="small">已启用</ReTag>
          <ReTag v-else type="info" effect="plain" size="small">未启用</ReTag>
        </template>
        <template #action="{ row }">
          <div class="row-actions">
            <ReButton layout="square" type="primary" :icon="View" title="画像" @click="handleProfile(row)" />
            <ReButton layout="square" type="primary" :icon="Edit" title="编辑" :disabled="isSelf(row)" @click="handleEdit(row)" />
            <ReButton layout="square" type="warning" :icon="Key" title="重置密码" :loading="resettingPwd === row.sysUserId" @click="openResetPwdDialog(row)" />
            <ReButton layout="square" type="danger" :icon="Delete" title="删除" :disabled="isSelf(row)" @click="handleDelete(row)" />
          </div>
        </template>
      </ReTable>

    <!-- 用户编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="720"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :ok-text="okText"
      :cancel-text="cancelText"
      @ok="handleSubmit"
    >
      <div class="user-dialog__body">
        <el-form label-width="92px" :model="form" label-position="right">
          <div class="user-dialog__grid">
            <el-form-item label="账号" required>
              <ReInput layout="modern" v-model="form.sysUserUsername" placeholder="登录账号" :disabled="isEdit" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="密码" v-if="!isEdit" required>
              <ReInput layout="modern" v-model="form.sysUserPassword" type="password" show-password placeholder="登录密码" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="确认密码" v-if="!isEdit" required>
              <ReInput layout="modern" v-model="form.sysUserPasswordConfirm" type="password" show-password placeholder="再次输入密码" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="昵称" required>
              <ReInput layout="modern" v-model="form.sysUserNickname" placeholder="显示名称" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="手机号">
              <ReInput layout="modern" v-model="form.sysUserPhone" placeholder="11 位手机号" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="邮箱">
              <ReInput layout="modern" v-model="form.sysUserEmail" placeholder="电子邮箱" maxlength="255" show-word-limit />
            </el-form-item>
            <el-form-item label="性别">
              <el-segmented v-model="form.sysUserSex" :options="userSexOptions" />
            </el-form-item>
            <el-form-item label="身份证">
              <ReInput layout="modern" v-model="form.sysUserIdCard" placeholder="身份证号" maxlength="18" show-word-limit @change="onIdCardChange" />
            </el-form-item>
            <el-form-item label="状态">
              <el-segmented v-model="form.sysUserStatus" :options="userStatusOptions" />
            </el-form-item>
            <el-form-item label="部门">
              <el-tree-select
                v-model="form.sysDeptId"
                :data="depts"
                :props="{ value: 'sysDeptId', label: 'sysDeptName', children: 'children' }"
                check-strictly
                clearable
                placeholder="选择部门"
                class="w-full"
              />
            </el-form-item>
            <el-form-item label="角色" class="user-dialog__full">
              <ReSelect
                v-model="form.roleIds"
                multiple
                placeholder="分配角色"
                class="w-full"
                :data="roles.map((r) => ({ label: r.sysRoleName, value: r.sysRoleId }))"
              />
            </el-form-item>
            <el-form-item label="岗位" class="user-dialog__full">
              <ReSelect
                v-model="form.postIds"
                multiple
                placeholder="分配岗位（可多选）"
                class="w-full"
                :data="posts.map((p) => ({ label: p.sysPostName, value: p.sysPostId }))"
              />
            </el-form-item>
            <el-form-item label="备注" class="user-dialog__full">
              <ReInput layout="modern" v-model="form.sysUserRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
            </el-form-item>
          </div>
        </el-form>
      </div>
      <template #footer>
        <ReButton type="default" @click="dialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="saving" @click="handleSubmit">确定</ReButton>
      </template>
    </ReDialog>

    <!-- 重置密码对话框 -->
    <ReDialog
      v-model="resetPwdDialogVisible"
      title="重置密码"
      width="480px"
      :close-on-click-modal="false"
    >
      <div style="padding: 20px 0;">
        <el-form label-width="80px">
          <el-form-item label="重置对象">
            <span>{{ resetPwdUser?.sysUserNickname ?? resetPwdUser?.sysUserUsername }}</span>
          </el-form-item>
          <el-form-item label="重置模式">
            <el-radio-group v-model="resetPwdMode">
              <el-radio value="auto">自动生成密码</el-radio>
              <el-radio value="manual">手动输入密码</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="resetPwdMode === 'manual'" label="新密码" required>
            <ReInput layout="modern" v-model="resetPwdNew" type="password" placeholder="请输入新密码" show-password />
          </el-form-item>
          <el-form-item v-if="resetPwdMode === 'manual'" label="确认密码" required>
            <ReInput layout="modern" v-model="resetPwdConfirm" type="password" placeholder="请再次输入新密码" show-password />
          </el-form-item>
          <el-form-item v-if="resetPwdMode === 'auto'">
            <span style="color: #909399; font-size: 13px;">系统将自动生成新密码，重置成功后显示</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <ReButton type="default" @click="resetPwdDialogVisible = false">取消</ReButton>
        <ReButton type="primary" :loading="resetPwdSaving" @click="handleResetPwdSubmit">确定重置</ReButton>
      </template>
    </ReDialog>

    <!-- 用户画像弹窗 -->
    <el-dialog
      v-model="profileVisible"
      title="用户画像"
      width="900"
      :close-on-click-modal="false"
      append-to-body
    >
      <div class="profile-body" v-if="profileUser">
        <div class="profile-left">
          <el-avatar :size="80" :src="profileUser.sysUserAvatar">
            {{ (profileUser.sysUserUsername || '?').charAt(0).toUpperCase() }}
          </el-avatar>
          <div class="profile-name">{{ profileUser.sysUserNickname || profileUser.sysUserUsername }}</div>
          <div class="profile-account">@{{ profileUser.sysUserUsername }}</div>
          <div class="profile-tags">
            <el-tag size="small" :type="profileUser.sysUserStatus === 1 ? 'success' : 'danger'">
              {{ profileUser.sysUserStatus === 1 ? '启用' : '禁用' }}
            </el-tag>
            <el-tag size="small" v-if="profileUser.sysUserLock === 1" type="warning">已锁定</el-tag>
          </div>
          <div class="profile-info-grid profile-info-grid--compact">
            <div class="profile-info-item"><span class="label">账号</span><span>{{ profileUser.sysUserUsername }}</span></div>
            <div class="profile-info-item"><span class="label">昵称</span><span>{{ profileUser.sysUserNickname || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">手机号</span><span>{{ profileUser.sysUserPhone || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">邮箱</span><span>{{ profileUser.sysUserEmail || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">状态</span><span>{{ profileUser.sysUserStatus === 1 ? '启用' : '禁用' }}</span></div>
            <div class="profile-info-item"><span class="label">部门</span><span>{{ deptNameOf(profileUser.sysDeptId) }}</span></div>
            <div class="profile-info-item"><span class="label">角色</span><span>{{ [...new Map((profileUser.userRoles ?? []).map(r => [r.sysRoleId, r])).values()].map(r => r.sysRoleName).join('、') || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">岗位</span><span>{{ [...new Map((profileUser.userPosts ?? []).map(p => [p.sysPostId, p])).values()].map(p => p.sysPostName).join('、') || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">最后登录</span><span>{{ profileUser.sysUserLastLoginTime || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">登录IP</span><span>{{ profileUser.sysUserLastIp || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">登录地址</span><span>{{ profileUser.sysUserLastAddress || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">登录次数</span><span>{{ profileUser.sysUserLoginCount || 0 }}</span></div>
          </div>
        </div>
        <div class="profile-right">
          <el-tabs>
            <el-tab-pane label="登录日志">
              <div v-loading="loadingLogs">
                <div v-if="loginLogs.length" class="log-list">
                  <div v-for="log in loginLogs" :key="log.sysLogId" class="log-item">
                    <div class="log-item__main">
                      <el-tag size="small" :type="log.sysLogStatus === 1 ? 'success' : 'danger'">
                        {{ log.sysLogStatus === 1 ? '成功' : '失败' }}
                      </el-tag>
                      <span class="log-item__ip">{{ log.sysLogIp || '-' }}</span>
                      <span v-if="log.sysLogAddress" class="log-item__addr">{{ log.sysLogAddress }}</span>
                    </div>
                    <div class="log-item__meta">
                      <span>{{ log.sysLogBrowser || '-' }}</span>
                      <span>{{ log.sysLogSystem || '-' }}</span>
                      <span>{{ log.createTime || '-' }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="profile-empty">暂无登录日志</div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="操作日志">
              <div v-loading="loadingLogs">
                <div v-if="operLogs.length" class="log-list">
                  <div v-for="log in operLogs" :key="log.sysLogId" class="log-item">
                    <div class="log-item__main">
                      <el-tag size="small" :type="log.sysLogStatus === 1 ? 'success' : 'danger'">
                        {{ log.sysLogStatus === 1 ? '成功' : '失败' }}
                      </el-tag>
                      <span class="log-item__url">{{ log.sysLogUrl || '-' }}</span>
                    </div>
                    <div class="log-item__meta">
                      <span>{{ log.sysLogContent || log.sysLogMessage || '-' }}</span>
                      <span>{{ log.createTime || '-' }}</span>
                    </div>
                  </div>
                </div>
                <div v-else class="profile-empty">暂无操作日志</div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <ReDialog
      v-model="roleDialogVisible"
      :title="`分配角色 - ${currentUser?.sysUserNickname ?? currentUser?.sysUserUsername ?? ''}`"
      width="480"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="roleSaving"
      @ok="handleSaveRoles"
    >
      <el-checkbox-group v-model="userRoleIds">
        <div v-for="r in roles" :key="r.sysRoleId" class="py-1">
          <el-checkbox :value="r.sysRoleId">{{ r.sysRoleName }} ({{ r.sysRoleCode }})</el-checkbox>
        </div>
      </el-checkbox-group>
    </ReDialog>

    <!-- 用户详情抽屉 -->
    <ReDrawer
      v-model="detailDrawerVisible"
      title="用户详情"
      size="500"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content v-if="detailUser">
        <div class="detail-section-title">基本信息</div>
        <el-descriptions :column="1" border :label-style="{ width: '110px', fontWeight: 600 }">
          <el-descriptions-item label="账号">{{ detailUser.sysUserUsername }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailUser.sysUserNickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailUser.sysUserPhone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ detailUser.sysUserEmail || '-' }}</el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ detailUser.sysUserSex === 1 ? '女' : detailUser.sysUserSex === 2 ? '保密' : '男' }}
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ deptNameOf(detailUser.sysDeptId) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <ReTag :type="detailUser.sysUserStatus === 1 ? 'success' : 'danger'" effect="plain" size="small">
              {{ detailUser.sysUserStatus === 1 ? '启用' : '禁用' }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <div v-if="detailUser.userRoles?.length" class="flex flex-wrap gap-1">
              <ReTag v-for="r in [...new Map((detailUser.userRoles ?? []).map(r => [r.sysRoleId, r])).values()]" :key="r.sysRoleId" type="primary" effect="plain" size="small">
                {{ r.sysRoleName }}
              </ReTag>
            </div>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="岗位">
            <div v-if="detailUser.userPosts?.length" class="flex flex-wrap gap-1">
              <ReTag v-for="p in [...new Map((detailUser.userPosts ?? []).map(p => [p.sysPostId, p])).values()]" :key="p.sysPostId" type="success" effect="plain" size="small">
                {{ p.sysPostName }}
              </ReTag>
            </div>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="最后登录IP">{{ detailUser.sysUserLastIp || '-' }}</el-descriptions-item>
          <el-descriptions-item label="最后登录地点">{{ detailUser.sysUserLastAddress || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ detailUser.createTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注">{{ detailUser.sysUserRemark || '-' }}</el-descriptions-item>
        </el-descriptions>

        <div class="detail-section-title">安全信息</div>
        <el-descriptions :column="1" border :label-style="{ width: '110px', fontWeight: 600 }">
          <el-descriptions-item label="锁定状态">
            <ReTag v-if="isLocked(detailUser)" type="danger" effect="plain" size="small">已锁定</ReTag>
            <ReTag v-else type="success" effect="plain" size="small">正常</ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="2FA 状态">
            <ReTag v-if="hasTotp(detailUser)" type="success" effect="plain" size="small">已启用</ReTag>
            <ReTag v-else type="info" effect="plain" size="small">未启用</ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="登录次数">
            {{ (detailUser as unknown as Record<string, unknown>).sysUserLoginCount ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录时间">
            {{ (detailUser as unknown as Record<string, unknown>).sysUserLastLoginTime ?? detailUser.sysUserLastAddress ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="密码最后修改">
            {{ (detailUser as unknown as Record<string, unknown>).sysUserPwdUpdateTime ?? '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="强制改密">
            <ReTag
              v-if="Number((detailUser as unknown as Record<string, unknown>).sysUserForcePwd) === 1"
              type="warning"
              effect="plain"
              size="small"
            >
              是
            </ReTag>
            <span v-else class="text-xs text-[--el-text-color-secondary]">否</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </ReDrawer>
  </div>
</template>

<style scoped lang="scss">
.profile-body {
  display: flex;
  gap: 24px;
  min-height: 400px;
}
.profile-left {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8fafc;
  border-radius: 8px;
}
.profile-left .profile-name {
  font-size: 18px;
  font-weight: 600;
}
.profile-left .profile-account {
  font-size: 13px;
  color: #909399;
}
.profile-left .profile-tags {
  display: flex;
  gap: 6px;
}
.profile-info-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  width: 100%;
}
.profile-info-grid .profile-info-item {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  .label {
    color: #909399;
  }
}
.profile-right {
  flex: 1;
  min-width: 0;
}
.log-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.log-item {
  padding: 8px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  .log-item__main {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }
  .log-item__meta {
    display: flex;
    gap: 12px;
    margin-top: 4px;
    font-size: 12px;
    color: #909399;
  }
}
.profile-empty {
  text-align: center;
  padding: 40px;
  color: #909399;
}
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.system-page__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
.system-page__subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}
:deep(.el-overlay) {
  transition: none !important;
}
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.custom-pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  padding: 12px 0;
}
.page-btn {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color);
  cursor: pointer;
  font-size: 13px;
}
.page-btn:hover:not(:disabled):not(.active) {
  color: var(--el-color-primary);
  border-color: var(--el-color-primary);
}
.page-btn.active {
  background: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: #fff;
}
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.user-dialog__body {
  padding: 4px 8px 0;
}
.user-dialog__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;
}
.user-dialog__full {
  grid-column: 1 / -1;
}
.detail-section-title {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}
:deep(.user-locked-row) {
  background: var(--el-color-danger-light-9);
}
</style>



