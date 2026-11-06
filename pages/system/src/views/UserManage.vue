<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 用户分页查询 + 增删改查 + 重置密码；角色/岗位统一在编辑弹窗内分配。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { message } from "@repo/core";
import { computed, nextTick, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { User, Plus, Edit, Delete, Search, Refresh, Key, UserFilled, Upload, Download, More, View, CopyDocument, Iphone, Message, Female, Male, Postcard, Loading } from "@element-plus/icons-vue";
import {
  pageForUser,
  saveUser,
  updateUser,
  deleteUser,
  deleteUsers,
  resetUserPassword,
  listForRole,
  listForPost,
  listDept,
  exportUsers,
  importUsers,
  downloadUserTemplate,
  unbindTotp,
} from "../api/systemApi";
import type { SysDept, SysPost, SysRole, SysUser, SysUserUpdate, SysUserLog, SysLog } from "../api/types";
import { pageForUserLog, pageForSysLog } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";
import useUserStore from "@repo/pinia/modules/user";
import useAuthStore from "@repo/pinia/modules/auth";
import ReDialog from "@repo/ui/re-dialog";
import ReSectionHead from "@repo/ui/re-section-head";
import ReEmpty from "@repo/ui/re-empty";

const userStore = useUserStore();
const authStore = useAuthStore();
const statusLoading = ref<number>(0);
const deleteLoading = ref<number>(0);
const resettingPwd = ref<number>(0);

/** 表格选择行 */
const selection = ref<Record<string, unknown>[]>([]);

/** CSV 导入弹窗 */
const showImportDialog = ref(false);
const importStep = ref<1 | 2 | 3>(1); // 1=选择文件, 2=预览, 3=确认
const importFile = ref<File | null>(null);
const importPreviewData = ref<Record<string, unknown>[]>([]);
const importPreviewColumns = ref<string[]>([]);
const importLoading = ref(false);

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
    options: depts.value,
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
  });
  const rows = (res?.data?.data ?? []) as Record<string, unknown>[];
  // 记录 id -> 完整行，供 el-dropdown 命令回调可靠取行（避免命令处理器闭包捕获到 el-table 的空占位行）
  rows.forEach((r) => {
    if (r.sysUserId != null) loadedRowMap.set(r.sysUserId as number, r);
  });
  total.value = res?.data?.total ?? 0;
  return { total: res?.data?.total ?? 0, data: rows };
}

/** 已加载行（id -> 完整行），供「更多」下拉命令回调按 id 取回完整 row */
const loadedRowMap = new Map<number, Record<string, unknown>>();

/** 当前打开「更多」菜单的行：在触发按钮 click 时记录（该 click 与编辑按钮同样可靠、row 完整），
 *  规避操作列 fixed=right 时 el-dropdown 在空占位 row 上渲染并缓存空 row 的问题 */
const currentActionRow = ref<Record<string, unknown> | null>(null);

/**
 * 「更多」触发按钮点击：不依赖操作列 slot 的 row（el-dropdown 内可能是空占位 row），
 * 而是通过事件所在行 tr，反查账号列上由完整 row 写入的 data-uid，再从 loadedRowMap 取完整行。
 */
function onMoreTrigger(e: Event) {
  const tr = (e.currentTarget as HTMLElement | null)?.closest?.("tr");
  const uid = tr?.querySelector("[data-uid]")?.getAttribute("data-uid");
  if (uid != null && uid !== "") {
    currentActionRow.value = loadedRowMap.get(Number(uid)) ?? null;
  }
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

/* ================== 批量删除（ReTable 内置模式回调） ================== */
function isSelf(user: SysUser): boolean {
  return user.sysUserUsername === userStore.loginName || user.sysUserUsername === userStore.username;
}

/** ReTable 批量删除 handler：删除选中行（自动跳过当前登录账号）；失败抛错以保留选择模式 */
async function handleBatchDeleteRows(rows: Record<string, unknown>[]): Promise<void> {
  const selfId = String(authStore.loginUser?.userId ?? "");
  const picked = rows
    .map((r) => (r as unknown as SysUser).sysUserId)
    .filter((v): v is number => v != null);
  const selfHit = picked.some((id) => String(id) === selfId);
  const ids = picked.filter((id) => String(id) !== selfId);
  if (!ids.length) {
    message.warning(selfHit ? "不允许删除当前登录账号" : "请选择要删除的用户");
    throw new Error("no-valid-delete-target");
  }
  await deleteUsers(ids);
  message.success(`已删除 ${ids.length} 个用户`);
  if (selfHit) message.warning("已自动跳过当前登录账号");
}

/**
 * 改的是自己时拉一次 /me，刷新前端登录缓存（头像/昵称/邮箱等展示源）。
 * 按 userId 兜底比对，避免连登录账号一起改动时按用户名判不出。
 */
async function refreshSelfCache(user: Partial<SysUser>): Promise<void> {
  const selfUser = user as SysUser;
  const isSelfById =
    user.sysUserId != null && String(user.sysUserId) === String(authStore.loginUser?.userId ?? "");
  if (!isSelf(selfUser) && !isSelfById) {
    return;
  }
  try {
    await authStore.getLoginUserInfo(false);
  } catch (e) {
    console.warn("[UserManage] /me 刷新失败", e);
  }
}

/* ================== 只读 / 2FA 辅助 ================== */

/** 任意角色编码命中 readonly（忽略大小写）即视为只读用户 */
function isReadonlyUser(user: SysUser): boolean {
  const codes = (user.userRoles ?? []).map((r) => (r.sysRoleCode ?? "").toLowerCase());
  return codes.some((c) => c.includes("readonly") || c === "read_only" || c === "ro");
}

/**
 * 去重用户角色：按唯一角色编号（sysRoleId）收敛，避免同一角色重复渲染。
 *
 * <p>后端 sys_user_role 允许重复行，接口返回的角色可能按行数放大；此处统一按
 * sysRoleId 去重（列表 / 详情 / 资料卡共用一处，避免各写一份 Map 去重）。</p>
 */
function uniqueUserRoles(row: unknown): SysRole[] {
  const source = (row as { userRoles?: unknown } | null)?.userRoles;
  const values: unknown[] = Array.isArray(source) ? source : [];
  const roles = values.filter(
    (role): role is SysRole => typeof role === 'object' && role !== null,
  );
  const entries = roles.map(
    (role): [number | undefined, SysRole] => [role.sysRoleId, role],
  );
  return [...new Map(entries).values()];
}

/** 是否已绑定 2FA（列表返回 sysUserTotpCode 非空即视为已绑定） */
function hasTotp(user: SysUser): boolean {
  return !!(user as unknown as Record<string, unknown>).sysUserTotpCode;
}

/** 是否为系统内置账号（sysUserInSystem=1：禁止删除，仅可编辑资料） */
function isInSystem(user: SysUser): boolean {
  return Number((user as unknown as Record<string, unknown>).sysUserInSystem) === 1;
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
    message.success("已解绑 2FA");
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "解绑失败");
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
const importCsvInput = ref<HTMLInputElement>();
const importing = ref(false);
const exporting = ref(false);

/** 触发 CSV 导入文件选择 */
function triggerCsvImport() {
  importCsvInput.value?.click();
}

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
    message.success("模板下载成功");
  } catch (e) {
    message.error((e as Error)?.message ?? "模板下载失败");
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
    message.success("导出成功");
  } catch (e) {
    message.error((e as Error)?.message ?? "导出失败");
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
      message.success(res?.data ?? "导入成功");
      tableRef.value?.reload();
    } else {
      message.error(res?.msg ?? "导入失败");
    }
  } catch (err) {
    message.error((err as Error)?.message ?? "导入失败");
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
interface UserForm extends SysUserUpdate {
  sysUserPasswordConfirm?: string;
}

const form = ref<UserForm>({});

/** 内置 admin 超管账号：角色固定、拥有全部权限菜单，不允许在编辑页修改角色 */
const isProtectedAdminAccount = computed(() =>
  isEdit.value && form.value.sysUserUsername === "admin",
);
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
}

function triggerAvatarUploadForRow(row: Record<string, unknown>) {
  currentAvatarRow.value = row;
  rowAvatarInputRef.value?.click();
}

function handleRowAvatarChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  const row = currentAvatarRow.value;
  if (!file || !row) return;

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
      const userId = row.sysUserId;
      if (typeof userId === "number") {
        try {
          await updateUser({ sysUserId: userId, sysUserAvatar: base64 });
          await refreshSelfCache(row as unknown as SysUser);
          message.success('头像已更新');
          tableRef.value?.reload();
        } catch (error: unknown) {
          console.error('头像更新失败:', error);
          message.error(error instanceof Error ? error.message : '头像更新失败');
        }
      }
    };
    img.src = ev.target?.result as string;
  };
  reader.readAsDataURL(file);
  input.value = '';
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
    loginLogs.value = (loginRes?.data?.data ?? []) as SysUserLog[];
    operLogs.value = (operRes?.data?.data ?? []) as SysLog[];
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
    message.warning("请填写账号、密码、昵称");
    return;
  }
  
  // 账号校验（仅新增；编辑时账号禁用不可改，无需重复校验，否则会误拦截 admin/sa）
  const username = form.value.sysUserUsername.trim();
  if (!isEdit.value) {
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      message.warning("账号只能使用字母、数字和下划线，不允许特殊字符");
      return;
    }
    // 不允许保留字作为账号
    const reservedUsernames = ["null", "void", "undefined", "admin", "sa", "root", "test", "guest", "anonymous"];
    if (reservedUsernames.includes(username.toLowerCase())) {
      message.warning("该名称为系统保留字，不允许作为账号");
      return;
    }
  }
  
  if (!isEdit.value && form.value.sysUserPassword !== form.value.sysUserPasswordConfirm) {
    message.warning("两次输入的密码不一致");
    return;
  }
  
  // 自动清理后的账号
  form.value.sysUserUsername = username;
  saving.value = true;
  try {
    // 编辑时角色以编辑页为准，始终同步(含清空全部角色)；新增按 roleIds 是否非空处理
    const payload: UserForm = { ...form.value };
    delete payload.sysUserPasswordConfirm;
    const data: SysUserUpdate = {
      ...payload,
      updateRole: isEdit.value ? true : !!(form.value.roleIds && form.value.roleIds.length > 0),
    };
    if (isEdit.value) {
      await updateUser(data);
      await refreshSelfCache(data);
      message.success("修改成功");
    } else {
      await saveUser(data);
      message.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (error: unknown) {
    console.error('handleSubmit error:', error);
    message.error(error instanceof Error ? error.message : "保存失败");
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
    message.success("删除成功");
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "删除失败");
  } finally {
    deleteLoading.value = 0;
  }
}

async function handleStatus(row: Record<string, unknown>) {
  const user = row as unknown as SysUser;
  if (statusLoading.value) return;
  if (user.sysUserUsername === userStore.loginName || user.sysUserUsername === userStore.username) {
    message.warning("不允许禁用自己");
    return;
  }
  statusLoading.value = user.sysUserId!;
  try {
    await updateUser({ ...user, sysUserStatus: user.sysUserStatus === 1 ? 0 : 1 });
    message.success(user.sysUserStatus === 1 ? "已禁用" : "已启用");
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "操作失败");
  } finally {
    statusLoading.value = 0;
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
      message.warning("请输入新密码");
      return;
    }
    if (resetPwdNew.value !== resetPwdConfirm.value) {
      message.warning("两次输入的密码不一致");
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
          message.success("密码已复制到剪贴板");
        }
      }).catch(() => {
        message.warning("请截图保存新密码，关闭后将无法再次查看");
      });
    } else {
      // 手动输入密码模式
      await resetUserPassword(resetPwdUser.value.sysUserId!, resetPwdNew.value);
      message.success("密码已重置，请使用新密码登录");
      resetPwdDialogVisible.value = false;
    }
  } catch (e) {
    message.error((e as Error)?.message ?? "重置失败");
  } finally {
    resetPwdSaving.value = false;
  }
}

/** 「更多」下拉命令分发 */
function handleActionCommand(cmd: string, row: Record<string, unknown>) {
  if (cmd === "detail") openDetail(row);
  else if (cmd === "edit") handleEdit(row);
  else if (cmd === "resetPwd") openResetPwdDialog(row);
  else if (cmd === "delete") handleDelete(row);
  else if (cmd === "unbindTotp") handleUnbindTotp(row);
}

/* ================== 批量操作 ================== */

/** 批量重置密码 */
async function batchResetPassword() {
  const ids = selection.value.map((r: Record<string, unknown>) => r.sysUserId as number).filter(Boolean);
  if (!ids.length) return;
  try {
    await ElMessageBox.confirm(
      `确认重置 ${ids.length} 个用户的密码？`,
      "批量重置密码",
      { type: "warning" },
    );
  } catch {
    return;
  }
  importLoading.value = true;
  try {
    // 逐个调用，后端无批量接口时退化处理
    const promises = ids.map((id) => resetUserPassword(id));
    await Promise.allSettled(promises);
    const successCount = ids.length;
    message.success(`已重置 ${successCount} 个用户密码`);
    selection.value = [];
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "批量重置失败");
  } finally {
    importLoading.value = false;
  }
}

/* ================== CSV 导入 ================== */

/** 解析 CSV 文件并预览 */
function parseCsvForPreview(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2) {
      message.warning("CSV 文件内容不足，至少需要表头和 1 行数据");
      return;
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
    const rows = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h] = values[i] ?? ""; });
      return obj;
    });
    importPreviewColumns.value = headers;
    importPreviewData.value = rows;
    importStep.value = 2;
  };
  reader.readAsText(file);
}

/** 处理导入弹窗文件选择 */
function handleImportFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  if (!file.name.endsWith(".csv")) {
    message.warning("请选择 CSV 格式文件");
    input.value = "";
    return;
  }
  importFile.value = file;
  parseCsvForPreview(file);
}

/** 确认导入 */
async function confirmImport() {
  if (!importFile.value) return;
  importStep.value = 3;
  importLoading.value = true;
  try {
    // 直接复用已有的 importUsers 接口（支持 xlsx/csv）
    const res = await importUsers(importFile.value);
    if (res?.code === 200 || res?.status === 200) {
      message.success(res?.data ?? "导入成功");
      showImportDialog.value = false;
      resetImportState();
      tableRef.value?.reload();
    } else {
      message.error(res?.msg ?? "导入失败");
    }
  } catch (err) {
    message.error((err as Error)?.message ?? "导入失败");
  } finally {
    importLoading.value = false;
  }
}

/** 重置导入状态 */
function resetImportState() {
  importStep.value = 1;
  importFile.value = null;
  importPreviewData.value = [];
  importPreviewColumns.value = [];
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
        class="visually-hidden-input"
        @change="handleFileChange"
      />
      <!-- CSV 导入专用 -->
      <input
        ref="importCsvInput"
        type="file"
        accept=".csv"
        class="visually-hidden-input"
        @change="handleImportFileSelect"
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
        :batch-delete="true"
        :batch-delete-handler="handleBatchDeleteRows"
        :selection="true"
        @selection-change="selection = $event"
        @search-reset="handleReset"
      >
        <!-- 工具栏：页面业务按钮（批量删除由 ReTable 内置工具按钮提供） -->
        <template #toolbar>
          <ReButton type="primary" icon="Plus" @click="handleAdd" text>添加</ReButton>
          <ReButton type="primary" icon="Download" @click="handleDownloadTemplate" text>下载模板</ReButton>
          <ReButton type="primary" icon="Upload" @click="showImportDialog = true" text>导入</ReButton>
          <ReButton type="primary" icon="Download" :loading="exporting" @click="handleExport" text>导出</ReButton>
        </template>

        <!-- 批量操作区域 -->
        <template v-if="selection.length > 0" #batch-actions>
          <div class="batch-actions">
            <span>已选 {{ selection.length }} 项</span>
            <ReButton icon="Key" @click="batchResetPassword" :loading="importLoading">批量重置密码</ReButton>
            <ReButton icon="Delete" type="danger" @click="() => tableRef?.batchDelete()">批量删除</ReButton>
          </div>
        </template>

        <template #empty>
          <div class="page-empty">
            <span class="page-empty__icon">
              <ReIcon name="User" size="22" />
            </span>
            <span class="page-empty__title">还没有用户</span>
            <span class="page-empty__desc">系统账号是登录与权限的载体。可以手动添加，或下载模板批量导入。</span>
            <span class="page-empty__actions">
              <ReButton type="primary" icon="Plus" @click="handleAdd">添加用户</ReButton>
              <ReButton icon="Download" @click="handleDownloadTemplate">下载模板</ReButton>
              <ReButton icon="Refresh" @click="handleReset">刷新</ReButton>
            </span>
          </div>
        </template>

        <template #username="{ row }">
          <div class="flex items-center gap-2" :data-uid="row.sysUserId">
            <div class="user-cell__avatar">
              <el-avatar :size="28" :src="row.sysUserAvatar" class="cursor-pointer" @click="triggerAvatarUploadForRow(row)">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span
                class="user-cell__dot"
                :class="row.online ? 'is-online' : 'is-offline'"
                :title="row.online ? '在线' : '离线'"
              ></span>
            </div>
            <div class="flex flex-col">
              <span class="cursor-pointer text-[--el-color-primary]" @click="openDetail(row)">{{ row.sysUserUsername }}</span>
              <div class="flex gap-1 mt-0.5">
                <ReTag v-if="isInSystem(row)" type="warning" effect="dark" >内置</ReTag>
                <el-tag v-if="row.sysUserStatus !== 1" type="danger" effect="plain" >禁用</el-tag>
                <el-tag v-else type="success" effect="plain" >启用</el-tag>
                <el-tag v-if="isReadonlyUser(row)" type="info" effect="plain" >只读</el-tag>
              </div>
            </div>
            <input ref="rowAvatarInputRef" type="file" accept="image/*" class="visually-hidden-input" @change="handleRowAvatarChange" />
          </div>
        </template>
        <template #nickname="{ row }">
          <span v-if="row.sysUserNickname" class="flex items-center gap-1">
            <!-- 性别沿用国内后台「男蓝女红」的识别习惯，但改走令牌：主题切换/暗色下会自动跟随 -->
            <el-icon :color="row.sysUserSex === 1 ? 'var(--el-color-danger)' : 'var(--el-color-primary)'">
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
          <ReIpText
            v-if="row.sysUserLastIp"
            :ip="row.sysUserLastIp"
            :address="row.sysUserLastAddress"
            third-party-fix
          />
          <span v-else class="text-[--el-text-color-secondary]">-</span>
        </template>
        <template #roles="{ row }">
          <el-tag
            v-for="role in uniqueUserRoles(row)"
            :key="role.sysRoleId"
            type="primary"
            effect="plain"
            
            class="mr-1"
          >
            {{ role.sysRoleName }}
          </el-tag>
          <span v-if="!row.userRoles?.length" class="text-xs text-[--el-text-color-secondary]">-</span>
        </template>
        <template #status="{ row }">
          <el-switch
            :model-value="row.sysUserStatus === 1"
            :disabled="statusLoading === row.sysUserId"
            @change="() => handleStatus(row)"
          />
        </template>
        <template #totp="{ row }">
          <ReTag v-if="hasTotp(row)" type="success" effect="plain" >已启用</ReTag>
          <ReTag v-else type="info" effect="plain" >未启用</ReTag>
        </template>
        <template #action="{ row }">
          <div class="row-actions">
            <ReButton layout="square" type="primary" icon="View" tip="画像" @click="handleProfile(row)" />
            <ReButton layout="square" type="primary" icon="Edit" tip="编辑" @click="handleEdit(row)" />
            <el-dropdown trigger="click" @command="(cmd: string) => handleActionCommand(cmd, currentActionRow as Record<string, unknown>)">
              <ReButton layout="square" type="info" icon="More" tip="更多" @click="onMoreTrigger" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="detail" icon="View">详情</el-dropdown-item>
                  <el-dropdown-item command="edit" icon="Edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="resetPwd" icon="Key">重置密码</el-dropdown-item>
                  <el-dropdown-item v-if="hasTotp(row)" command="unbindTotp" icon="Delete">解绑2FA</el-dropdown-item>
                  <el-dropdown-item v-if="!isInSystem(row)" command="delete" icon="Delete" :disabled="isSelf(row)">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
                :disabled="isProtectedAdminAccount"
                :data="roles.map((r) => ({ label: r.sysRoleName, value: r.sysRoleId }))"
              />
              <div v-if="isProtectedAdminAccount" class="user-dialog__tip">
                内置管理员账号默认拥有全部权限与菜单，角色固定；后端同样拒绝任何角色变更
              </div>
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
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSubmit">确定</el-button>
      </template>
    </ReDialog>

    <!-- 重置密码对话框 -->
    <ReDialog
      v-model="resetPwdDialogVisible"
      title="重置密码"
      width="480px"
      :close-on-click-modal="false"
    >
      <div class="reset-pwd-body">
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
            <span class="reset-pwd-tip">系统将自动生成新密码，重置成功后显示</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button type="default" @click="resetPwdDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resetPwdSaving" @click="handleResetPwdSubmit">确定重置</el-button>
      </template>
    </ReDialog>

    <!-- 用户画像弹窗 -->
    <ReDialog
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
            <el-tag  :type="profileUser.sysUserStatus === 1 ? 'success' : 'danger'">
              {{ profileUser.sysUserStatus === 1 ? '启用' : '禁用' }}
            </el-tag>
          </div>
          <div class="profile-info-grid profile-info-grid--compact">
            <div class="profile-info-item"><span class="label">账号</span><span>{{ profileUser.sysUserUsername }}</span></div>
            <div class="profile-info-item"><span class="label">昵称</span><span>{{ profileUser.sysUserNickname || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">手机号</span><span>{{ profileUser.sysUserPhone || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">邮箱</span><span>{{ profileUser.sysUserEmail || '-' }}</span></div>
            <div class="profile-info-item"><span class="label">状态</span><span>{{ profileUser.sysUserStatus === 1 ? '启用' : '禁用' }}</span></div>
            <div class="profile-info-item"><span class="label">部门</span><span>{{ deptNameOf(profileUser.sysDeptId) }}</span></div>
            <div class="profile-info-item"><span class="label">角色</span><span>{{ uniqueUserRoles(profileUser).map(r => r.sysRoleName).join('、') || '-' }}</span></div>
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
                      <el-tag  :type="log.sysLogStatus === 1 ? 'success' : 'danger'">
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
                      <el-tag  :type="log.sysLogStatus === 1 ? 'success' : 'danger'">
                        {{ log.sysLogStatus === 1 ? '成功' : '失败' }}
                      </el-tag>
                      <span class="log-item__url">{{ log.sysLogUrl || '-' }}</span>
                    </div>
                    <div class="log-item__meta">
                      <span>{{ log.sysLogContent || '-' }}</span>
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
            <ReTag :type="detailUser.sysUserStatus === 1 ? 'success' : 'danger'" effect="plain" >
              {{ detailUser.sysUserStatus === 1 ? '启用' : '禁用' }}
            </ReTag>
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <div v-if="detailUser.userRoles?.length" class="flex flex-wrap gap-1">
              <ReTag v-for="r in uniqueUserRoles(detailUser)" :key="r.sysRoleId" type="primary" effect="plain" >
                {{ r.sysRoleName }}
              </ReTag>
            </div>
            <span v-else class="text-xs text-[--el-text-color-secondary]">-</span>
          </el-descriptions-item>
          <el-descriptions-item label="岗位">
            <div v-if="detailUser.userPosts?.length" class="flex flex-wrap gap-1">
              <ReTag v-for="p in [...new Map((detailUser.userPosts ?? []).map(p => [p.sysPostId, p])).values()]" :key="p.sysPostId" type="success" effect="plain" >
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
          <el-descriptions-item label="2FA 状态">
            <ReTag v-if="hasTotp(detailUser)" type="success" effect="plain" >已启用</ReTag>
            <ReTag v-else type="info" effect="plain" >未启用</ReTag>
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
              
            >
              是
            </ReTag>
            <span v-else class="text-xs text-[--el-text-color-secondary]">否</span>
          </el-descriptions-item>
        </el-descriptions>
      </template>
    </ReDrawer>

    <!-- CSV 导入弹窗 -->
    <ReDialog
      v-model="showImportDialog"
      title="导入用户"
      width="640px"
      :close-on-click-modal="false"
      :confirm-loading="importLoading"
      @ok="confirmImport"
    >
      <!-- 步骤1：选择文件 -->
      <div v-if="importStep === 1" class="import-step">
        <div class="import-upload-area">
          <ReButton type="primary" @click="triggerCsvImport">选择 CSV 文件</ReButton>
          <div class="import-upload-hint mt-2">支持 .csv 格式，请先下载模板填写</div>
        </div>
      </div>

      <!-- 步骤2：预览数据 -->
      <div v-else-if="importStep === 2" class="import-step">
        <div class="import-preview-header">
          <span>文件：{{ importFile?.name }}</span>
          <span class="text-[--el-text-color-secondary]">共 {{ importPreviewData.length }} 条数据</span>
        </div>
        <ReTable
          :data="importPreviewData"
          size="small"
          border
          :layout-table="{ maxHeight: 300, minHeight: 0 }"
          :config="{ pagination: { enable: false }, toolbar: { enable: false } }"
        >
          <ReTableColumn
            v-for="col in importPreviewColumns"
            :key="col"
            :prop="col"
            :label="col"
            min-width="100"
            show-overflow-tooltip
          />
        </ReTable>
        <div class="import-preview-tip">确认数据无误后点击确定开始导入</div>
      </div>

      <!-- 步骤3：导入中 -->
      <div v-else-if="importStep === 3" class="import-step">
        <div class="import-loading">
          <el-icon class="is-loading" size="32"><Loading /></el-icon>
          <span>正在导入，请稍候...</span>
        </div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* ===== 页面骨架 ===== */
.system-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: 100%;
}
.system-page__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
/* ===== 统计卡片 ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.stat-card {
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  padding: 16px 20px;
  position: relative;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.2s var(--ease-out), transform 0.2s var(--ease-out);
}
.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}
.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--accent, var(--brand-500));
  border-radius: var(--radius-lg) var(--radius-lg) 0 0;
}
.stat-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}
.stat-value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
  line-height: 1.1;
  margin-bottom: 6px;
}
.stat-trend {
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: 500;
}
.stat-trend.is-up { color: var(--status-success); }
.stat-trend.is-down { color: var(--status-error); }
/* ===== 筛选工具栏 ===== */
.page-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
/* ===== 批量操作条 ===== */
.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--brand-500) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--brand-500) 20%, transparent);
  border-radius: var(--radius-md);
  font-size: 13px;
  margin-bottom: 8px;
}
.batch-info {
  font-size: 12px;
  color: var(--brand-500);
  font-weight: 600;
  margin-right: 8px;
}
/* ===== 操作按钮组 ===== */
.row-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
/* ===== 空状态 ===== */
.empty-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
/* ===== 自定义分页（纯自绘按钮） ===== */
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
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-container);
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 13px;
  outline: none;
  transition: color 0.2s var(--ease-out), border-color 0.2s var(--ease-out), background-color 0.2s var(--ease-out);
}
.page-btn:focus-visible {
  box-shadow: var(--focus-ring);
}
.page-btn:hover:not(:disabled):not(.active) {
  color: var(--brand-500);
  border-color: var(--brand-500);
}
.page-btn.active {
  background: var(--brand-500);
  border-color: var(--brand-500);
  color: var(--text-inverse);
}
.page-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
/* ===== 用户详情 / 画像 ===== */
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
  background: var(--bg-fill);
  border-radius: var(--radius-md);
}
.profile-left .profile-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}
.profile-left .profile-account {
  font-size: 13px;
  color: var(--text-secondary);
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
  .label { color: var(--text-tertiary); }
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
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  .log-item__main { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); }
  .log-item__meta { display: flex; gap: 12px; margin-top: 4px; font-size: 12px; color: var(--text-tertiary); }
}
.profile-empty {
  text-align: center;
  padding: 40px;
  color: var(--text-tertiary);
}
.detail-section-title {
  margin: 16px 0 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}
.user-cell__dot {
  position: absolute;
  top: -2px;
  right: -2px;
  box-sizing: content-box;
  width: 8px;
  height: 8px;
  border: 2px solid var(--bg-container);
  border-radius: 50%;
}
.user-cell__dot.is-online {
  background: var(--status-success);
  animation: user-cell__pulse 2s ease-in-out infinite;
}
.user-cell__dot.is-offline {
  background: var(--text-tertiary);
}
@keyframes user-cell__pulse {
  0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--status-success) 55%, transparent); }
  70% { box-shadow: 0 0 0 5px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}
/* 尊重系统「减少动态效果」偏好：脉冲与过渡都要停 */
@media (prefers-reduced-motion: reduce) {
  .page-btn,
  .user-cell__dot { transition: none; animation: none; }
}
/* ===== 对话框 ===== */
.user-dialog__body { padding: 4px 8px 0; }
.user-dialog__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 18px;
}
.user-dialog__full { grid-column: 1 / -1; }
.user-dialog__tip {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-tertiary);
}
.visually-hidden-input { display: none; }
.reset-pwd-body { padding: 20px 0; }
.reset-pwd-tip {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-tertiary);
}
/* ===== CSV 导入弹窗 ===== */
.import-step { padding: 16px 0; }
.import-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  border: 2px dashed var(--border-default);
  border-radius: var(--radius-md);
  gap: 12px;
  text-align: center;
}
.import-upload-icon { color: var(--text-tertiary); }
.import-upload-text { font-size: 14px; color: var(--text-primary); }
.import-upload-hint { font-size: 12px; color: var(--text-tertiary); }
.import-preview-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--text-primary);
}
.import-preview-tip {
  margin-top: 12px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}
.import-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
  color: var(--text-tertiary);
}
/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .user-dialog__grid { grid-template-columns: 1fr; }
  .profile-body { flex-direction: column; }
  .profile-left { width: 100%; }
}
</style>
