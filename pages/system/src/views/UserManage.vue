<script setup lang="ts">
/**
 * 用户管理页面
 *
 * 用户分页查询 + 增删改查 + 重置密码；角色/岗位统一在编辑弹窗内分配。
 * 全部使用 ReXxx modern 组件渲染。
 */
import { message } from "@repo/core";
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { ElMessageBox } from "element-plus";
import { User, Plus, Edit, Delete, Search, Refresh, Key, UserFilled, Upload, Download, More, View, CopyDocument, Iphone, Message, Loading } from "@element-plus/icons-vue";
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
import { ReRadioGroup, ReRadio } from "@repo/ui/re-kit";

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

/** 顶部快捷搜索关键词：与筛选面板分离，避免「一框搜人」被展开面板的字段覆盖 */
const quickKeyword = ref("");
const quickInputRef = ref<HTMLInputElement>();
let quickSearchTimer: ReturnType<typeof setTimeout> | null = null;

/** 当前页数据：仅用于本页在线/禁用等即时指标，不做跨页推断 */
const pageRows = ref<Record<string, unknown>[]>([]);

async function loadUsers({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForUser({
    page,
    pageSize,
    sysUserName: quickKeyword.value.trim() || (params.sysUserName as string) || undefined,
    sysUserPhone: (params.sysUserPhone as string) || undefined,
    sysUserStatus: params.sysUserStatus === "" ? undefined : (params.sysUserStatus as number),
    sysDeptId: params.sysDeptId === "" ? undefined : (params.sysDeptId as number),
  });
  const rows = (res?.data?.data ?? []) as Record<string, unknown>[];
  // 记录 id -> 完整行，供 el-dropdown 命令回调可靠取行（避免命令处理器闭包捕获到 el-table 的空占位行）
  rows.forEach((r) => {
    if (r.sysUserId != null) loadedRowMap.set(r.sysUserId as number, r);
  });
  pageRows.value = rows;
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

/* ================== 组织架构左栏 ================== */
const orgTreeRef = ref();
const orgKeyword = ref("");

/** 部门树关键字过滤：只匹配部门名称，展开父链交由 el-tree 处理 */
function filterOrgNode(value: string, data: SysDept): boolean {
  if (!value) return true;
  return (data.sysDeptName ?? "").toLowerCase().includes(value.toLowerCase());
}

watch(orgKeyword, (value) => {
  filterOrgTree(value);
});

/** el-tree 实例方法在测试桩/未挂载时不存在，统一走可选调用 */
function filterOrgTree(value: string) {
  const tree = orgTreeRef.value as { filter?: (keyword: string) => void } | undefined;
  tree?.filter?.(value);
}

function setCurrentDept(deptId?: number) {
  const tree = orgTreeRef.value as { setCurrentKey?: (key: number | null) => void } | undefined;
  tree?.setCurrentKey?.(deptId ?? null);
}

/** 按部门收窄列表：q.sysDeptId 与筛选面板共用，切换后回到第一页 */
function selectDept(deptId?: number) {
  query.value.sysDeptId = deptId;
  query.value.page = 1;
  setCurrentDept(deptId);
  tableRef.value?.reload();
}

function onDeptClick(node: SysDept) {
  selectDept(node.sysDeptId);
}

watch(
  () => query.value.sysDeptId,
  (deptId) => {
    nextTick(() => setCurrentDept(typeof deptId === "number" ? deptId : undefined));
  },
);

/* ================== 顶部快捷搜索 ================== */
/** 输入即搜：320ms 防抖，避免每个字都打一次分页接口 */
function onQuickSearch() {
  if (quickSearchTimer) clearTimeout(quickSearchTimer);
  quickSearchTimer = setTimeout(() => {
    quickSearchTimer = null;
    query.value.page = 1;
    tableRef.value?.reload();
  }, 320);
}

/** 回车立即搜，并清掉待触发的防抖 */
function applyQuickSearch() {
  if (quickSearchTimer) {
    clearTimeout(quickSearchTimer);
    quickSearchTimer = null;
  }
  query.value.page = 1;
  tableRef.value?.reload();
}

function clearQuickSearch() {
  quickKeyword.value = "";
  applyQuickSearch();
  quickInputRef.value?.focus();
}

/** Ctrl/⌘ + K 聚焦快捷搜索，和命令面板的肌肉记忆保持一致 */
function onGlobalKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
    e.preventDefault();
    quickInputRef.value?.focus();
    quickInputRef.value?.select();
  }
}

/* ================== 指标条（只用当前页真实数据） ================== */
const onlineCount = computed(
  () => pageRows.value.filter((row) => Boolean((row as { online?: unknown }).online)).length,
);
const disabledCount = computed(
  () => pageRows.value.filter((row) => Number(row.sysUserStatus) !== 1).length,
);
/** 本页已开启双因子的账号数：状态治理里比"快捷操作"更值得占一格 */
const totpCount = computed(
  () => pageRows.value.filter((row) => hasTotp(row as unknown as SysUser)).length,
);
const scopeLabel = computed(() =>
  query.value.sysDeptId ? deptNameOf(query.value.sysDeptId) : "全部部门",
);

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

/* ================== 用户详情抽屉（成员档案） ================== */
const detailDrawerVisible = ref(false);
const detailUser = ref<SysUser | null>(null);

function openDetail(row: Record<string, unknown>) {
  detailUser.value = row as unknown as SysUser;
  detailDrawerVisible.value = true;
}

/** 头像占位字母：优先昵称，其次账号 */
function userInitial(user: SysUser | null): string {
  return ((user?.sysUserNickname || user?.sysUserUsername || "?").charAt(0)).toUpperCase();
}

/** 详情里展示的在线态：沿用列表行的 online 字段，缺省按离线处理 */
const detailOnline = computed(() => {
  const user = detailUser.value as unknown as { online?: unknown } | null;
  return Boolean(user?.online);
});

/** 登录次数：后端字段为 sysUserLoginCount，缺省显示 0 */
const detailLoginCount = computed(() => {
  const value = (detailUser.value as unknown as Record<string, unknown> | null)?.sysUserLoginCount;
  return value == null || value === "" ? 0 : value;
});

/**
 * 同部门成员胶片条：只取当前页中同部门的行，不额外发请求。
 * 当前页没有同部门同事时退回当前页全体，保证胶片条始终可用。
 */
const detailPeers = computed<SysUser[]>(() => {
  const current = detailUser.value;
  if (!current) return [];
  const rows = pageRows.value as unknown as SysUser[];
  const sameDept = rows.filter((row) => row.sysDeptId === current.sysDeptId);
  const source = sameDept.length > 1 ? sameDept : rows;
  return source.slice(0, 12);
});

/** 档案里直接进编辑：先收抽屉，避免弹窗叠在抽屉上 */
function editFromDetail() {
  if (!detailUser.value) return;
  const row = detailUser.value as unknown as Record<string, unknown>;
  detailDrawerVisible.value = false;
  handleEdit(row);
}

function resetPwdFromDetail() {
  if (!detailUser.value) return;
  openResetPwdDialog(detailUser.value as unknown as Record<string, unknown>);
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
  { prop: "sysUserUsername", label: "用户", minWidth: 200, slot: "username" },
  { prop: "roles", label: "角色", minWidth: 150, slot: "roles" },
  { prop: "contact", label: "联系方式", minWidth: 180, slot: "contact" },
  { prop: "sysUserLastLoginTime", label: "最近登录", minWidth: 160, slot: "lastLogin" },
  { prop: "sysUserStatus", label: "状态", width: 84, slot: "status", align: "center" },
  { prop: "action", label: "操作", width: 168, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  window.addEventListener("keydown", onGlobalKeydown);
  tableRef.value?.reload();
  loadRoles();
  loadDepts();
  loadPosts();
});

onUnmounted(() => {
  window.removeEventListener("keydown", onGlobalKeydown);
  if (quickSearchTimer) {
    clearTimeout(quickSearchTimer);
    quickSearchTimer = null;
  }
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

      <!-- 组织架构：左栏常驻，按部门收窄列表 -->
      <aside class="user-org">
        <div class="user-org__head">
          <span class="user-org__title">组织架构</span>
          <span class="user-org__total">{{ total }} 人</span>
        </div>
        <div class="user-org__filter">
          <el-icon><Search /></el-icon>
          <input v-model="orgKeyword" type="text" placeholder="筛选部门" />
        </div>
        <div class="user-org__scroll">
          <button
            type="button"
            class="user-org__all"
            :class="{ 'is-active': !query.sysDeptId }"
            @click="selectDept(undefined)"
          >
            <el-icon><UserFilled /></el-icon>
            <span>全部用户</span>
            <em>{{ total }}</em>
          </button>
          <el-tree
            ref="orgTreeRef"
            class="user-org__tree"
            :data="depts"
            :props="{ label: 'sysDeptName', children: 'children' }"
            node-key="sysDeptId"
            :expand-on-click-node="false"
            :highlight-current="true"
            :filter-node-method="filterOrgNode"
            default-expand-all
            @node-click="onDeptClick"
          />
        </div>
        <div class="user-org__foot">点击部门收窄右侧列表</div>
      </aside>

      <section class="user-main">
        <!-- 聚光灯搜索：Ctrl/⌘ + K 聚焦，与筛选面板互不覆盖 -->
        <div class="user-spotlight">
          <div class="user-spotlight__field">
            <el-icon class="user-spotlight__icon"><Search /></el-icon>
            <input
              ref="quickInputRef"
              v-model="quickKeyword"
              class="user-spotlight__input"
              type="text"
              placeholder="搜索账号，回车定位成员"
              @input="onQuickSearch"
              @keyup.enter="applyQuickSearch"
            />
            <button
              v-if="quickKeyword"
              type="button"
              class="user-spotlight__clear"
              title="清空"
              @click="clearQuickSearch"
            >
              ×
            </button>
            <kbd class="user-spotlight__kbd">Ctrl K</kbd>
          </div>
          <ReButton type="primary" icon="Plus" @click="handleAdd">添加用户</ReButton>
        </div>

        <!-- 指标条：数值全部来自本次分页结果，不做跨页推断 -->
        <div class="user-metrics">
          <div class="user-metric">
            <span class="user-metric__label">用户总数</span>
            <strong class="user-metric__value">{{ total }}</strong>
            <span class="user-metric__hint">{{ scopeLabel }}</span>
          </div>
          <div class="user-metric">
            <span class="user-metric__label">本页在线</span>
            <strong class="user-metric__value is-online">{{ onlineCount }}</strong>
            <span class="user-metric__hint">共 {{ pageRows.length }} 条</span>
          </div>
          <div class="user-metric">
            <span class="user-metric__label">本页禁用</span>
            <strong class="user-metric__value is-disabled">{{ disabledCount }}</strong>
            <span class="user-metric__hint">需复核账号</span>
          </div>
          <div class="user-metric">
            <span class="user-metric__label">本页 2FA</span>
            <strong class="user-metric__value">
              {{ totpCount }}<span class="user-metric__unit">/ {{ pageRows.length }}</span>
            </strong>
            <span class="user-metric__hint">已开启双因子</span>
          </div>
        </div>

      <ReTable
        ref="tableRef"
        class="user-table"
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
        <!-- 工具栏：次级操作（主操作在聚光灯行） -->
        <template #toolbar>
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
          <div class="flex items-center gap-2 user-cell" :data-uid="row.sysUserId">
            <div class="user-cell__avatar">
              <el-avatar :size="30" :src="row.sysUserAvatar" class="cursor-pointer" @click="triggerAvatarUploadForRow(row)">
                <el-icon><User /></el-icon>
              </el-avatar>
              <span
                class="user-cell__dot"
                :class="row.online ? 'is-online' : 'is-offline'"
                :title="row.online ? '在线' : '离线'"
              ></span>
            </div>
            <div class="user-cell__text">
              <span class="user-cell__account" @click="openDetail(row)">{{ row.sysUserUsername }}</span>
              <div class="user-cell__meta">
                <span class="user-cell__nickname">{{ row.sysUserNickname || '-' }}</span>
                <ReTag v-if="isInSystem(row)" type="warning" effect="plain" size="small" >内置</ReTag>
                <ReTag v-if="isReadonlyUser(row)" type="info" effect="plain" size="small" >只读</ReTag>
              </div>
            </div>
            <input ref="rowAvatarInputRef" type="file" accept="image/*" class="visually-hidden-input" @change="handleRowAvatarChange" />
          </div>
        </template>
        <template #contact="{ row }">
          <div class="user-contact">
            <span v-if="row.sysUserPhone" class="user-contact__row">
              <el-icon><Iphone /></el-icon>
              <span>{{ row.sysUserPhone }}</span>
            </span>
            <span v-if="row.sysUserEmail" class="user-contact__row">
              <el-icon><Message /></el-icon>
              <span>{{ row.sysUserEmail }}</span>
            </span>
            <span v-if="!row.sysUserPhone && !row.sysUserEmail" class="user-contact__empty">-</span>
          </div>
        </template>
        <template #lastLogin="{ row }">
          <div class="user-login">
            <span class="user-login__time">{{ row.sysUserLastLoginTime || '-' }}</span>
            <span v-if="row.sysUserLastIp" class="user-login__ip">
              <ReIpText
                :ip="row.sysUserLastIp"
                :address="row.sysUserLastAddress"
                third-party-fix
              />
            </span>
          </div>
        </template>
        <template #roles="{ row }">
          <div class="user-roles">
            <ReTag
              v-for="role in uniqueUserRoles(row)"
              :key="role.sysRoleId"
              type="primary"
              effect="plain"
              size="small"
            >
              {{ role.sysRoleName }}
            </ReTag>
            <span v-if="!uniqueUserRoles(row).length" class="user-roles__empty">-</span>
          </div>
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
      </section>

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
            <ReRadioGroup v-model="resetPwdMode">
              <ReRadio value="auto">自动生成密码</ReRadio>
              <ReRadio value="manual">手动输入密码</ReRadio>
            </ReRadioGroup>
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


    <!-- 成员档案抽屉（预览 / 编辑入口） -->
    <ReDrawer
      v-model="detailDrawerVisible"
      title="成员档案"
      size="620"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content v-if="detailUser">
        <!-- 档案剧场：主角卡 + 关键指标 + 同部门胶片条 -->
        <div class="profile-hero">
          <div class="profile-hero__avatar">
            <el-avatar :size="72" :src="detailUser.sysUserAvatar">{{ userInitial(detailUser) }}</el-avatar>
            <span class="user-cell__dot" :class="detailOnline ? 'is-online' : 'is-offline'"></span>
          </div>
          <div class="profile-hero__main">
            <div class="profile-hero__name">
              <span>{{ detailUser.sysUserNickname || detailUser.sysUserUsername }}</span>
              <ReTag v-if="isInSystem(detailUser)" type="warning" effect="plain">内置</ReTag>
              <ReTag :type="detailUser.sysUserStatus === 1 ? 'success' : 'danger'" effect="plain">
                {{ detailUser.sysUserStatus === 1 ? '启用' : '禁用' }}
              </ReTag>
              <ReTag v-if="isReadonlyUser(detailUser)" type="info" effect="plain">只读</ReTag>
            </div>
            <div class="profile-hero__account">
              @{{ detailUser.sysUserUsername }} · {{ deptNameOf(detailUser.sysDeptId) }}
            </div>
            <div class="profile-hero__roles">
              <ReTag v-for="r in uniqueUserRoles(detailUser)" :key="r.sysRoleId" type="primary" effect="plain">
                {{ r.sysRoleName }}
              </ReTag>
              <span v-if="!uniqueUserRoles(detailUser).length" class="profile-hero__muted">未分配角色</span>
            </div>
          </div>
          <div class="profile-hero__actions">
            <ReButton layout="square" type="primary" icon="Edit" tip="编辑资料" @click="editFromDetail" />
            <ReButton layout="square" type="primary" icon="Key" tip="重置密码" @click="resetPwdFromDetail" />
          </div>
        </div>

        <div class="profile-metrics">
          <div class="profile-metric">
            <span class="profile-metric__label">最近登录</span>
            <strong class="profile-metric__value">{{ detailUser.sysUserLastLoginTime || '-' }}</strong>
          </div>
          <div class="profile-metric">
            <span class="profile-metric__label">登录次数</span>
            <strong class="profile-metric__value">{{ detailLoginCount }}</strong>
          </div>
          <div class="profile-metric">
            <span class="profile-metric__label">最近 IP</span>
            <strong class="profile-metric__value">{{ detailUser.sysUserLastIp || '-' }}</strong>
          </div>
          <div class="profile-metric">
            <span class="profile-metric__label">创建时间</span>
            <strong class="profile-metric__value">{{ detailUser.createTime || '-' }}</strong>
          </div>
        </div>

        <div v-if="detailPeers.length > 1" class="profile-peers">
          <div class="profile-peers__head">
            <span>同部门成员</span>
            <em>{{ detailPeers.length }}</em>
          </div>
          <div class="profile-peers__strip">
            <button
              v-for="peer in detailPeers"
              :key="peer.sysUserId"
              type="button"
              class="profile-peer"
              :class="{ 'is-active': peer.sysUserId === detailUser.sysUserId }"
              @click="openDetail(peer as unknown as Record<string, unknown>)"
            >
              <el-avatar :size="26" :src="peer.sysUserAvatar">{{ userInitial(peer) }}</el-avatar>
              <span class="profile-peer__name">{{ peer.sysUserNickname || peer.sysUserUsername }}</span>
            </button>
          </div>
        </div>

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
            {{ detailLoginCount }}
          </el-descriptions-item>
          <el-descriptions-item label="最后登录时间">
            {{ detailUser.sysUserLastLoginTime || '-' }}
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
/* ===== 页面骨架：左组织树 + 右工作区 ===== */
.system-page {
  display: grid;
  grid-template-columns: 224px minmax(0, 1fr);
  gap: 16px;
  padding: 0;
  height: 100%;
  min-height: 0;
}
.user-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
}
.user-table {
  flex: 1;
  min-height: 0;
  /* 表头/正文字号按工作表密度收一档，与左侧组织树、指标条同一层级 */
  --rt-header-font-size: 11.5px;
  --rt-header-font-weight: 600;
  --rt-font: 12.5px;
}
.user-table :deep(.vxe-header--column) {
  color: var(--text-tertiary);
  letter-spacing: 0.3px;
}
.user-table :deep(.vxe-table--render-default .vxe-header--column) {
  background: var(--bg-fill) !important;
}
/* 行高交给内容：用户列两行、联系方式两行，固定 51px 会把第二行裁掉 */
.user-table :deep(.vxe-body--row),
.user-table :deep(.vxe-body--row > .vxe-body--column) {
  height: auto !important;
  min-height: 56px;
}
.user-table :deep(.vxe-body--row > .vxe-body--column) {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
}
.user-table :deep(.vxe-body--column .vxe-cell) {
  height: auto !important;
  min-height: 0 !important;
  line-height: 1.45;
}
/* ===== 表格单元格内容 ===== */
.user-contact,
.user-login {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.user-contact__row {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 12px;
  color: var(--text-secondary);
}
.user-contact__row .el-icon {
  flex: none;
  color: var(--text-tertiary);
}
.user-contact__row > span {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.user-contact__empty {
  font-size: 12px;
  color: var(--text-tertiary);
}
.user-login__time {
  font-size: 12.5px;
  color: var(--text-primary);
}
.user-login__ip {
  overflow: hidden;
  font-size: 11.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.user-roles {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.user-roles__empty {
  font-size: 12px;
  color: var(--text-tertiary);
}
/* ===== 组织架构左栏 ===== */
.user-org {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
}
.user-org__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 2px 4px 10px;
}
.user-org__title {
  font-size: 13px;
  font-weight: 650;
  color: var(--text-primary);
}
.user-org__total {
  font-size: 11.5px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
.user-org__filter {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 8px;
  margin-bottom: 8px;
  background: var(--bg-fill);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
}
.user-org__filter input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 12.5px;
}
.user-org__filter input::placeholder {
  color: var(--text-tertiary);
}
.user-org__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
.user-org__all {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  padding: 0 10px;
  margin-bottom: 2px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12.5px;
  cursor: pointer;
  transition: background-color 0.18s var(--ease-out), color 0.18s var(--ease-out);
}
.user-org__all em {
  margin-left: auto;
  font-style: normal;
  font-size: 11px;
  color: var(--text-tertiary);
  font-variant-numeric: tabular-nums;
}
.user-org__all:hover {
  background: var(--bg-hover);
}
.user-org__all.is-active {
  background: var(--brand-50);
  color: var(--brand-500);
  font-weight: 600;
}
.user-org__all.is-active em {
  color: var(--brand-500);
}
.user-org__tree {
  background: transparent;
  --el-tree-node-hover-bg-color: var(--bg-hover);
}
.user-org__tree :deep(.el-tree-node__content) {
  height: 32px;
  margin-bottom: 2px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 12.5px;
}
.user-org__tree :deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: var(--brand-50);
  color: var(--brand-500);
  font-weight: 600;
}
.user-org__foot {
  margin-top: 8px;
  padding: 8px 4px 0;
  border-top: 1px solid var(--border-subtle);
  font-size: 11px;
  color: var(--text-tertiary);
}
/* ===== 聚光灯搜索 ===== */
.user-spotlight {
  display: flex;
  align-items: center;
  gap: 12px;
}
.user-spotlight__field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  height: 40px;
  padding: 0 12px;
  background: var(--bg-container);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: border-color 0.18s var(--ease-out), box-shadow 0.18s var(--ease-out);
}
.user-spotlight__field:focus-within {
  border-color: var(--brand-500);
  box-shadow: var(--focus-ring);
}
.user-spotlight__icon {
  flex: none;
  color: var(--text-tertiary);
  font-size: 15px;
}
.user-spotlight__input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
}
.user-spotlight__input::placeholder {
  color: var(--text-tertiary);
}
.user-spotlight__clear {
  flex: none;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  background: var(--bg-fill);
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
}
.user-spotlight__clear:hover {
  color: var(--text-primary);
  background: var(--bg-hover);
}
.user-spotlight__kbd {
  flex: none;
  padding: 3px 6px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-fill);
  color: var(--text-tertiary);
  font-family: inherit;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
}
/* ===== 指标条（当前页真实数据） ===== */
.user-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}
.user-metric {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  padding: 10px 14px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
.user-metric__label {
  font-size: 11.5px;
  color: var(--text-secondary);
}
.user-metric__value {
  display: flex;
  align-items: center;
  min-height: 26px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.3px;
  font-variant-numeric: tabular-nums;
  color: var(--text-primary);
}
.user-metric__value.is-online {
  color: var(--status-success);
}
.user-metric__value.is-disabled {
  color: var(--status-error);
}
.user-metric__unit {
  margin-left: 3px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
}
.user-metric__hint {
  overflow: hidden;
  font-size: 11px;
  color: var(--text-tertiary);
  white-space: nowrap;
  text-overflow: ellipsis;
}
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
/* ===== 成员档案（预览 / 编辑） ===== */
.profile-hero {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px;
  background:
    radial-gradient(420px 180px at 0% 0%, var(--brand-50), transparent 72%),
    var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
}
.profile-hero__avatar {
  position: relative;
  flex: none;
}
.profile-hero__main {
  flex: 1;
  min-width: 0;
}
.profile-hero__name {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}
.profile-hero__account {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--text-secondary);
}
.profile-hero__roles {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 8px;
}
.profile-hero__muted {
  font-size: 12px;
  color: var(--text-tertiary);
}
.profile-hero__actions {
  display: flex;
  gap: 6px;
}
.profile-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 12px;
}
.profile-metric {
  min-width: 0;
  padding: 8px 10px;
  background: var(--bg-fill);
  border-radius: var(--radius-md);
}
.profile-metric__label {
  display: block;
  font-size: 11.5px;
  color: var(--text-tertiary);
}
.profile-metric__value {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  text-overflow: ellipsis;
}
.profile-peers {
  margin-top: 12px;
}
.profile-peers__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
}
.profile-peers__head em {
  font-style: normal;
  font-size: 11px;
  color: var(--text-tertiary);
}
.profile-peers__strip {
  display: flex;
  gap: 6px;
  padding-bottom: 4px;
  overflow-x: auto;
}
.profile-peer {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  padding: 4px 10px 4px 4px;
  background: var(--bg-container);
  border: 1px solid var(--border-subtle);
  border-radius: 99px;
  cursor: pointer;
  transition: border-color 0.18s var(--ease-out), background-color 0.18s var(--ease-out);
}
.profile-peer:hover {
  background: var(--brand-50);
  border-color: var(--brand-100);
}
.profile-peer.is-active {
  background: var(--brand-50);
  border-color: var(--brand-500);
}
.profile-peer__name {
  font-size: 12px;
  color: var(--text-primary);
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
.user-cell {
  min-width: 0;
}
.user-cell__avatar {
  position: relative;
  flex: none;
}
.user-cell__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-cell__account {
  overflow: hidden;
  color: var(--brand-500);
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
}
.user-cell__account:hover {
  text-decoration: underline;
}
.user-cell__meta {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin-top: 2px;
}
.user-cell__nickname {
  overflow: hidden;
  color: var(--text-tertiary);
  font-size: 11.5px;
  white-space: nowrap;
  text-overflow: ellipsis;
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
@media (max-width: 1080px) {
  .system-page { grid-template-columns: minmax(0, 1fr); }
  /* 窄屏收起组织树，部门仍可在筛选面板里选择 */
  .user-org { display: none; }
  .user-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 768px) {
  .user-dialog__grid { grid-template-columns: 1fr; }
  .profile-body { flex-direction: column; }
  .profile-left { width: 100%; }
  .profile-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .user-spotlight__kbd { display: none; }
}
</style>
