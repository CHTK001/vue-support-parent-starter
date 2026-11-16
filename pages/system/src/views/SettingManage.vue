<script setup lang="ts">
/**
 * 配置管理（sys_setting）
 *
 * 主从三栏（方案 02「指挥台」）：
 *   左 → 分组导航（按分类分段，可搜索）
 *   中 → 当前分组的配置清单（ReTable，支持行拖拽排序）
 *   右 → 配置检查器（常驻，点选清单行即显示属性，无页面跳转）
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import {
  Edit,
  Delete,
  Clock,
  View,
  Hide,
  Folder,
  Document,
  Connection,
  Setting,
  Tools,
  Cpu,
  Download,
  Promotion,
  Cellphone,
  Brush,
  Lock,
  Key,
  Files,
  DataLine,
  SwitchButton,
  EditPen,
  Search,
  Refresh,
  Plus,
} from "@element-plus/icons-vue";
import {
  pageForSetting,
  saveSetting,
  updateSetting,
  deleteSetting,
  updateBatchSetting,
  pageForSettingHistory,
  rollbackSettingHistorySingle,
  rollbackSettingHistoryBatch,
  listSettingHistoryByBatch,
  decryptSettingValue,
  exportSetting,
  checkEmailConnectivity,
  saveSettingGroup,
  listSettingGroups,
} from "../api/systemApi";
import type {
  SysSetting,
  SysSettingHistory,
  EmailConnectivity,
  SysSettingGroupBrief,
} from "../api/types";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn, RePageResult } from "@repo/ui/re-table";
import ReTime from "@repo/ui/re-time";
import { costMs } from "@repo/utils";
import { settingTypeOptions, normType, typeLabel, isBooleanType, isBooleanTruthy, booleanText } from "../settingUtils";
import { settingLabel, THIRD_PARTY_SETTING_GROUPS } from "../settingLabels";
import { listAccountsCached } from "../api/accountApi";
import type { AccountKind, SysAccountBrief } from "../api/accountApi";

/* ================== 页面模式 ==================
 * manage：配置管理（创建/删除配置定义，菜单入口）
 * product：产品级系统配置（仅改值，不增删定义，由侧边栏底部设置按钮进入）
 */
const props = withDefaults(defineProps<{ mode?: "manage" | "product" }>(), {
  mode: "manage",
});
/** 产品级系统配置：隐藏配置定义的新增/删除/拖拽排序 */
const isProduct = computed(() => props.mode === "product");

/* ================== 分组导航 / 选中项 ================== */

/** 当前分组（左栏选中项）：中栏清单与右栏检查器都跟着它走 */
const activeGroup = ref<string | null>(null);

/** 清单里选中的配置项（右栏检查器的数据源） */
const selectedSetting = ref<SysSetting | null>(null);

/** 分组详情 ReTable 实例（模板 ref，用于改值/排序后 reload） */
const detailTableRef = ref<{ reload: () => Promise<void> } | null>(null);

/** 左栏点击分组：换组后清掉旧选中，让中栏重新加载（loader 会落到该组首项） */
async function openGroup(g: string) {
  if (activeGroup.value === g) return;
  activeGroup.value = g;
  selectedSetting.value = null;
  await detailTableRef.value?.reload();
}

/** 中栏点行 → 右栏检查器（操作列按钮已 .stop，不会误触） */
function selectRow(row: Record<string, unknown>) {
  selectedSetting.value = row as unknown as SysSetting;
}

/**
 * 行是否选中。
 *
 * <p>ReTable 没有透出 rowClassName，vxe 引擎下 highlightCurrentRow 也不生效，
 * 所以选中态由 info 单元格自己带：模板里给包裹元素加 is-selected，样式用
 * :has(.is-selected) 反穿到整行背景。</p>
 */
function isSelectedRow(row: Record<string, unknown>): boolean {
  const id = selectedSetting.value?.sysSettingId;
  return Boolean(id) && String(row.sysSettingId) === String(id);
}

/* ================== 分组图标 / 描述 ================== */

const groupIconMap: Record<string, unknown> = {
  default: Setting,
  config: Connection,
  userAgreement: Document,
  smtp: Promotion,
  sms: Cellphone,
  schedule: Clock,
  // 策略控制台的运行时热更新参数（保存即生效），与「定时任务」一样是运行时开关
  hot_reload: Refresh,
};
const groupDescMap: Record<string, string> = {
  default: "登录页与界面基础配置（品牌、Logo、欢迎语、备案号等）",
  config: "WebSocket / Socket 连接、编解码与外观水印",
  userAgreement: "用户协议内容与条款",
  smtp: "内部邮箱服务（SMTP 发信 / IMAP 收信），用于系统邮件、通知与验证码投递",
  sms: "内部短信服务（阿里云 / 腾讯云），用于通知与短信验证码投递",
  schedule: "系统定时任务的开关与执行周期",
  hot_reload: "策略控制台的运行时参数，保存即生效、无需重启（策略控制台 → 热更新配置）",
};

/**
 * 第三方登录 / 集成渠道的分组 code。
 *
 * <p>清单落在 settingLabels.ts（配置项中文标签也要按它分流），这里只做 Set 化
 * 便于 has() 查询 —— 两处各维护一份必然漂移，新增渠道时只加那份清单。</p>
 */
const THIRD_PARTY_GROUPS = new Set(THIRD_PARTY_SETTING_GROUPS);

/* ================== 分组字典（sys_setting_group） ==================
 * 左栏中文名与自定义分组都来自这张字典表；此前唯一来源是页面里的硬编码
 * map，自定义分组建了也只会显示成英文编码。字典表是「配置管理」里的
 * 可见实体，读它才能让新增分组真正落到导航上。
 */
const groupList = ref<SysSettingGroupBrief[]>([]);
const groupMetaMap = computed(() => {
  const m = new Map<string, SysSettingGroupBrief>();
  groupList.value.forEach((g) => {
    if (g.sysSettingGroupCode) m.set(g.sysSettingGroupCode, g);
  });
  return m;
});
/** 本次会话新建的分组：字典表还没回读到（缓存/延迟）时也要留在左栏 */
const createdGroupCodes = ref<string[]>([]);

async function loadGroups() {
  try {
    const res = await listSettingGroups();
    const data = res?.data;
    // 停用的分组不进左栏：它和停用的配置项一样不该出现在运行配置里
    groupList.value = Array.isArray(data)
      ? data.filter((g) => g.sysSettingGroupEnable !== false)
      : [];
  } catch {
    groupList.value = [];
  }
}

const groupNameMap: Record<string, string> = {
  default: "默认配置",
  config: "系统配置",
  userAgreement: "用户协议",
  smtp: "邮件服务",
  sms: "短信服务",
  schedule: "定时任务",
  // 策略控制台的热更新分组：库里分组 code 是 hot_reload，直接显示会是一列英文
  hot_reload: "热更新配置",
  /* 第三方登录 / 集成：库里存的是渠道 code，界面上要给中文名，否则一列英文扫不动 */
  alipay: "支付宝登录",
  baidu: "百度登录",
  dingtalk: "钉钉登录",
  douyin: "抖音登录",
  feishu: "飞书登录",
  gitee: "Gitee 登录",
  github: "GitHub 登录",
  google: "Google 登录",
  microsoft: "微软登录",
  oidc: "OIDC 单点登录",
  qq: "QQ 登录",
  sso: "单点登录",
  taobao: "淘宝登录",
  wechat: "微信登录",
  wechat_enterprise: "企业微信登录",
  wechat_mp: "微信公众号登录",
  weibo: "微博登录",
};

/**
 * 启动参数分组的中文后缀。
 *
 * <p>六个 startup-* 分组原名一律显示成「启动参数」，左栏会并排出现六行一模一样的
 * 名字，只能靠条数区分；补上后缀后一眼能认出是哪类启动参数。</p>
 */
const STARTUP_SUFFIX: Record<string, string> = {
  actuator: "Actuator 端点",
  api: "插件 API",
  ip: "IP 解析",
  jackson: "Jackson 序列化",
  mybatis: "MyBatis",
  swagger: "接口文档",
};
function groupName(g: string): string {
  // 内置分组用页面里校对过的中文名（字典种子里的 wechat_mp 之类仍是半英文）；
  // 没登记过的 code 才回落字典表 —— 自定义分组的「中文名」只能从那里来。
  if (groupNameMap[g]) return groupNameMap[g];
  const meta = groupMetaMap.value.get(g);
  if (meta?.sysSettingGroupName) return meta.sysSettingGroupName;
  if (g.startsWith("startup-")) {
    const suffix = STARTUP_SUFFIX[g.slice("startup-".length)];
    return suffix ? `启动参数 · ${suffix}` : "启动参数";
  }
  return g;
}
function groupIcon(g: string): unknown {
  if (g.startsWith("startup")) return Cpu;
  if (THIRD_PARTY_GROUPS.has(g)) return Key;
  return groupIconMap[g] ?? Folder;
}
function groupDesc(g: string): string {
  if (g.startsWith("startup")) return "后端启动采集参数（内置）";
  if (THIRD_PARTY_GROUPS.has(g)) return "第三方登录渠道凭据（AppID / 应用密钥 / 回调地址）";
  return groupDescMap[g] ?? "该分组下的配置项";
}

/** 分组强调色（映射到 Element 色板，深浅色自适应） */
const groupAccentMap: Record<string, string> = {
  default: "primary",
  config: "info",
  userAgreement: "success",
  smtp: "warning",
  sms: "success",
  hot_reload: "warning",
};
function groupAccent(g: string): string {
  if (g.startsWith("startup")) return "info";
  return groupAccentMap[g] ?? "primary";
}

/* ================== 分类分段 / 分组搜索 ================== */

/**
 * 分类定义。
 *
 * <p>分组是平铺的（12 个），直接铺开很难扫读；按语义收成几档后，
 * 「配置」这类高频分组能一眼定位。三栏版里不再有筛选行，
 * 分类直接落成左栏的分段标题 —— 少一层交互，分组名与归属同时可见。</p>
 */
const CATEGORY_LIST = [
  { key: "basic", label: "基础配置" },
  { key: "integration", label: "第三方集成" },
  { key: "message", label: "消息通知" },
  { key: "policy", label: "策略控制" },
  { key: "startup", label: "启动参数" },
  { key: "content", label: "内容协议" },
];

/** 分组 -> 分类 key；未登记的分组归入「基础配置」，避免出现无处安放的分组 */
const groupCategoryMap: Record<string, string> = {
  default: "basic",
  config: "basic",
  sms: "message",
  smtp: "message",
  userAgreement: "content",
  hot_reload: "policy",
};

/** 分组归类：startup- 前缀优先判为启动参数（一个前缀抵 5 个分组） */
function groupCategory(g: string): string {
  if (g.startsWith("startup")) return "startup";
  if (THIRD_PARTY_GROUPS.has(g)) return "integration";
  return groupCategoryMap[g] ?? "basic";
}

/** 左栏分组搜索关键词（同时匹配分组 code 与展示名） */
const groupKeyword = ref<string>("");

/** 左栏导航：按分类分段，空分类不渲染 */
const navSections = computed(() => {
  const kw = groupKeyword.value.trim().toLowerCase();
  const matched = groups.value.filter(
    (g) => !kw || g.group.toLowerCase().includes(kw) || groupName(g.group).toLowerCase().includes(kw),
  );
  return CATEGORY_LIST.map((c) => ({
    key: c.key,
    label: c.label,
    groups: matched.filter((g) => groupCategory(g.group) === c.key),
  })).filter((s) => s.groups.length);
});

/** 当前分组的配置项数量（中栏标题上显示） */
const activeGroupCount = computed(
  () => groups.value.find((g) => g.group === activeGroup.value)?.items.length ?? 0,
);

/** 单个配置项的图标（按值类型） */
const settingIconMap: Record<string, unknown> = {
  COLOR: Brush,
  PASSWORD: Lock,
  JSON: Files,
  ARRAY: Files,
  NUMBER: DataLine,
  BOOLEAN: SwitchButton,
  STRING: EditPen,
  TEXTAREA: Document,
};
function settingIcon(row: SysSetting): unknown {
  return settingIconMap[normType(row.sysSettingValueType)] ?? Tools;
}

/**
 * 值文本切成「可断行片段」。
 *
 * <p>回调地址、Webhook 这类长 URL 没有任何空格，`word-break: break-all`
 * 会把 `.../alipay/callback` 劈成 `.../alipay/ca` + `llback`，读起来像被截断。
 * 这里只在 URL 分隔符（/ ? # & =）之后补断点，换行点就落在路径层级上。</p>
 */
function valueSegments(value?: string | null): string[] {
  const text = (value ?? "").trim();
  if (!text) return ["—"];
  // 零宽断点：按 lookbehind 切在分隔符之后，字符一个不丢
  return text.split(/(?<=[/?#&=])/).filter(Boolean);
}

/* ================== 账号选型回显 ================== */

/**
 * 配置行指向的账号种类。
 *
 * <p>邮件/短信不再自己存 SMTP 密钥，而是存账号管理里的 {@code EMAIL}/{@code SMS}
 * 账号 ID；值列直接显示 UUID 对人没有意义，这里按分组+名称识别后翻译成账号名。</p>
 *
 * @param row 配置行
 * @return EMAIL / SMS；不是账号选型行返回 null
 */
function accountKindOf(row: SysSetting): AccountKind | null {
  if (row.sysSettingName !== "accountId") return null;
  if (row.sysSettingGroup === "smtp") return "EMAIL";
  if (row.sysSettingGroup === "sms") return "SMS";
  return null;
}

/** 账号 ID → 账号摘要（配置页只读回显用） */
const accountBriefMap = ref<Record<string, SysAccountBrief>>({});

/**
 * 拉取邮件/短信账号清单供回显。
 *
 * <p>失败时静默：账号模块不可用不应让配置页报错，值列退回显示原始 ID。</p>
 */
async function loadAccountBriefs() {
  const kinds: AccountKind[] = ["EMAIL", "SMS"];
  const results = await Promise.allSettled(kinds.map((k) => listAccountsCached(k)));
  const next: Record<string, SysAccountBrief> = {};
  results.forEach((r) => {
    if (r.status !== "fulfilled") return;
    (r.value ?? []).forEach((a) => {
      if (a?.accountId) next[a.accountId] = a;
    });
  });
  accountBriefMap.value = next;
}

/**
 * 账号值的可读文本：名称 · 登录名；账号已被删除/停用时如实说明。
 *
 * @param value 配置值（账号 ID）
 */
function accountValueText(value?: string | null): string {
  const id = (value ?? "").trim();
  if (!id) return "未选择账号";
  const brief = accountBriefMap.value[id];
  if (!brief) return id;
  const name = brief.name || brief.username || brief.code || id;
  return brief.status === 0 ? `${name}（已停用）` : name;
}

/* ================== 全量数据 ================== */

const allSettings = ref<SysSetting[]>([]);
const groupLoading = ref(false);

async function loadAll() {
  groupLoading.value = true;
  try {
    // 分组字典与配置清单并行：前者决定左栏中文名，后者决定有哪些分组
    await Promise.all([loadGroups(), pageForSetting({ page: 1, pageSize: 1000 }).then((res) => {
      allSettings.value = (unwrapPage(res).rows as SysSetting[]).filter(
        (s) => Number(s.sysSettingStatus) !== 0,
      );
    })]);
  } catch {
    allSettings.value = [];
  } finally {
    groupLoading.value = false;
  }
  await ensureActiveGroup();
}

/** 数据到位后保证「左栏总有选中项」：没有或已消失就落到第一个分组，并让中栏重载 */
async function ensureActiveGroup() {
  const list = groups.value;
  if (!list.length) {
    activeGroup.value = null;
    selectedSetting.value = null;
    return;
  }
  if (!activeGroup.value || !list.some((g) => g.group === activeGroup.value)) {
    activeGroup.value = list[0].group;
    selectedSetting.value = null;
    await detailTableRef.value?.reload();
  }
}

/** 解包分页响应：兼容三层 ApiResult<ReturnPageResult<PageResult>> 与两层 ApiResult<PageResult> */
function unwrapPage(res: unknown): { total: number; rows: Record<string, unknown>[] } {
  const data = (res as { data?: unknown })?.data;
  let pageObj: Record<string, unknown> =
    typeof data === 'object' && data !== null && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};
  const inner = pageObj.data;
  if (
    inner &&
    typeof inner === 'object' &&
    !Array.isArray(inner) &&
    Array.isArray((inner as Record<string, unknown>).data)
  ) {
    pageObj = inner as Record<string, unknown>;
  }
  const rows = (Array.isArray(pageObj.data) ? pageObj.data : []) as Record<string, unknown>[];
  const total = typeof pageObj.total === 'number' ? pageObj.total : rows.length;
  return { total, rows };
}

/**
 * 分组排序权重。
 *
 * <p>默认按 code 字典序，但「默认配置」是最高频入口，被 alipay 这类渠道 code 挤到
 * 后面不合理；系统配置紧随其后，定时任务排基础配置末位。</p>
 */
const GROUP_ORDER = ["default", "config", "schedule"];

/** 按分组聚类并按 sort 排序（停用行 status=0 不展示：邮件/短信历史凭据行已随账号收口停用） */
const groups = computed(() => {
  const m = new Map<string, SysSetting[]>();
  allSettings.value.forEach((s) => {
    if (Number(s.sysSettingStatus) === 0) return;
    const g = s.sysSettingGroup || "default";
    if (!m.has(g)) m.set(g, []);
    m.get(g)!.push(s);
  });
  // 本次会话新建、尚未挂配置项的分组：并入导航（空清单），否则建完就看不见
  createdGroupCodes.value.forEach((g) => {
    if (!m.has(g)) m.set(g, []);
  });
  const rank = (g: string) => {
    const i = GROUP_ORDER.indexOf(g);
    return i < 0 ? GROUP_ORDER.length : i;
  };
  /**
   * 排序键：内置分组按 GROUP_ORDER 权重排在前，自定义分组（页面没登记中文名、
   * 只存在于字典表的 code）统一落到末尾，组内再按建组时填的排序值 ——
   * 否则新建分组会按种子 sort 插到「默认配置」上面。
   */
  const isCustom = (g: string) => !groupNameMap[g] && !g.startsWith("startup") && groupMetaMap.value.has(g);
  const sortKey = (g: string): [number, number] => {
    if (!isCustom(g)) return [0, rank(g)];
    const v = groupMetaMap.value.get(g)?.sysSettingGroupSort;
    return [1, typeof v === "number" ? v : Number.MAX_SAFE_INTEGER];
  };
  return [...m.entries()]
    .map(([group, items]) => ({
      group,
      items: [...items].sort((a, b) => (a.sysSettingSort ?? 0) - (b.sysSettingSort ?? 0)),
    }))
    .sort((a, b) => {
      const [ta, sa] = sortKey(a.group);
      const [tb, sb] = sortKey(b.group);
      return ta - tb || sa - sb || a.group.localeCompare(b.group);
    });
});

/** 全部分组下配置项总数（顶部统计） */
const totalSettings = computed(() =>
  groups.value.reduce((n, g) => n + g.items.length, 0),
);

/** 分组详情 loader：直接取卡片全量里该分组的对象引用（编辑可同步） */
async function loadDetail(): Promise<RePageResult> {
  const items = groups.value.find((g) => g.group === activeGroup.value)?.items ?? [];
  const data = items.filter(
    (item): item is SysSetting & Record<string, unknown> =>
      typeof item === 'object' && item !== null,
  );
  // 选中项跟着清单走：换组、刷新、删除后都要落到一个仍然存在的对象上
  const currentId = selectedSetting.value?.sysSettingId;
  selectedSetting.value = data.find((d) => d.sysSettingId === currentId) ?? data[0] ?? null;
  return { total: items.length, data };
}

/* ================== 拖拽排序 ================== */

const sortSaving = ref(false);

async function handleRowSort({ newData }: { newData?: SysSetting[] }) {
  if (!Array.isArray(newData) || !newData.length) return;
  sortSaving.value = true;
  try {
    // 同分组内按新顺序重排排序字段（从 1 开始）
    const payload = newData.map((r, i) => ({ ...r, sysSettingSort: i + 1 }));
    await updateBatchSetting(payload as SysSetting[]);
    payload.forEach((p) => {
      const t = allSettings.value.find((s) => s.sysSettingId === p.sysSettingId);
      if (t) t.sysSettingSort = p.sysSettingSort;
    });
    message.success("排序已保存");
  } catch (e) {
    message.error((e as Error)?.message ?? "排序保存失败");
  } finally {
    sortSaving.value = false;
    detailTableRef.value?.reload();
  }
}

/* ================== 新增 / 编辑 / 删除 ================== */

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysSetting>({});
const editRevealSensitive = ref(false);

function handleAdd() {
  isEdit.value = false;
  editRevealSensitive.value = false;
  form.value = {
    sysSettingValueType: "STRING",
    sysSettingSort: 0,
    sysSettingInSystem: 0,
    // 卡片分组详情里新增时预填当前分组
    sysSettingGroup: activeGroup.value ?? "",
  };
  dialogVisible.value = true;
}

function handleEdit(row: SysSetting) {
  isEdit.value = true;
  editRevealSensitive.value = false;
  form.value = {
    ...row,
    sysSettingValueType: normType(row.sysSettingValueType),
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysSettingName || !form.value.sysSettingCode) {
    message.warning("请填写名称和编码");
    return;
  }
  if (!form.value.sysSettingGroup) {
    message.warning("请填写分组");
    return;
  }
  if (!form.value.sysSettingValueType) {
    message.warning("请选择类型");
    return;
  }
  form.value.sysSettingValueType = normType(form.value.sysSettingValueType);
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateSetting(form.value);
      message.success("修改成功");
    } else {
      await saveSetting(form.value);
      message.success("新增成功");
    }
    dialogVisible.value = false;
    await refreshAll();
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: SysSetting) {
  const setting = row;
  await ElMessageBox.confirm(`确认删除配置「${setting.sysSettingName}」？`, "提示", { type: "warning" });
  await deleteSetting(setting.sysSettingId!);
  message.success("删除成功");
  await refreshAll();
}

/* ================== 新增自定义分组 ==================
 * 左栏底部的「+」入口。此前只能靠给配置项手填一个英文分组编码，
 * 没有中文名、也没法独立建组；这里补上字典表的建组入口。
 */
const groupDialogVisible = ref(false);
const groupSaving = ref(false);
const groupForm = ref<SysSettingGroupBrief>({});

function handleGroupAdd() {
  groupForm.value = {
    sysSettingGroupEnable: true,
    sysSettingGroupSort: (groupList.value.length + 1) * 10,
  };
  groupDialogVisible.value = true;
}

async function handleGroupSubmit() {
  const name = (groupForm.value.sysSettingGroupName ?? "").trim();
  const code = (groupForm.value.sysSettingGroupCode ?? "").trim();
  if (!name) {
    message.warning("请填写分组名称");
    return;
  }
  if (!code) {
    message.warning("请填写分组编码");
    return;
  }
  groupSaving.value = true;
  try {
    await saveSettingGroup({
      sysSettingGroupId: groupForm.value.sysSettingGroupId,
      sysSettingGroupName: name,
      sysSettingGroupCode: code,
      sysSettingGroupIcon: groupForm.value.sysSettingGroupIcon,
      sysSettingGroupEnable: groupForm.value.sysSettingGroupEnable ?? true,
      sysSettingGroupSort: groupForm.value.sysSettingGroupSort ?? 0,
      sysSettingGroupRemark: groupForm.value.sysSettingGroupRemark,
    });
    message.success("分组已创建");
    groupDialogVisible.value = false;
    if (!createdGroupCodes.value.includes(code)) createdGroupCodes.value.push(code);
    await loadAll();
    activeGroup.value = code;
    selectedSetting.value = null;
    await detailTableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "保存失败");
  } finally {
    groupSaving.value = false;
  }
}

/** 数据变更后统一刷新：卡片全量 + 分组详情 */
async function refreshAll() {
  await loadAll();
  detailTableRef.value?.reload();
}

/* ================== 敏感配置掩码 ================== */

function isSensitive(row: SysSetting): boolean {
  return Number((row as unknown as Record<string, unknown>).sysSettingIsSensitive) === 1;
}

const revealedMap = ref<Record<number, string>>({});
const revealTimers: Record<number, ReturnType<typeof setTimeout>> = {};

async function toggleSensitive(row: SysSetting) {
  if (!row.sysSettingId) return;
  const id = row.sysSettingId;
  if (revealedMap.value[id]) {
    delete revealedMap.value[id];
    if (revealTimers[id]) clearTimeout(revealTimers[id]);
    return;
  }
  try {
    const res = await decryptSettingValue(id);
    revealedMap.value[id] = res?.data ?? row.sysSettingValue ?? "";
    if (revealTimers[id]) clearTimeout(revealTimers[id]);
    revealTimers[id] = setTimeout(() => delete revealedMap.value[id], 10000);
  } catch (e) {
    message.error((e as Error)?.message ?? "获取明文失败");
  }
}

/* ================== 右侧检查器 ================== */

/** 选中项的明文（未解密时为空串，模板按是否敏感决定显示掩码） */
const selectedRevealed = computed(() => {
  const id = selectedSetting.value?.sysSettingId;
  return id ? (revealedMap.value[id] ?? "") : "";
});

/** 选中项是否已解密显示 */
const selectedIsRevealed = computed(() => Boolean(selectedRevealed.value));

/** 检查器里的「所属分组」文本：展示名 + code，两处信息一次给全 */
const selectedGroupText = computed(() => {
  const g = selectedSetting.value?.sysSettingGroup;
  if (!g) return "-";
  return `${groupName(g)}（${g}）`;
});

/** 检查器里的「当前值」：敏感项默认掩码，解密后显示明文；布尔项显示开启/关闭 */
const selectedValueText = computed(() => {
  const s = selectedSetting.value;
  if (!s) return "-";
  if (accountKindOf(s)) return accountValueText(s.sysSettingValue);
  if (isSensitive(s)) return selectedRevealed.value || "••••••••";
  if (isBooleanType(s.sysSettingValueType)) return booleanText(s.sysSettingValue);
  return s.sysSettingValue || "-";
});

/** 检查器头部与底部的动作都从「当前选中」出发，空选中时直接不响应 */
function editSelected() {
  if (selectedSetting.value) handleEdit(selectedSetting.value);
}
function historyOfSelected() {
  if (selectedSetting.value) openHistory(selectedSetting.value);
}
function deleteSelected() {
  if (selectedSetting.value) void handleDelete(selectedSetting.value);
}
function toggleSelectedSensitive() {
  if (selectedSetting.value) void toggleSensitive(selectedSetting.value);
}

/* ================== 变更历史 ================== */

const historyDrawerVisible = ref(false);
const historyLoading = ref(false);
const historySetting = ref<SysSetting | null>(null);
const historyList = ref<SysSettingHistory[]>([]);
const historyPage = ref(1);
const historyPageSize = ref(10);
const historyTotal = ref(0);
const rollbackLoading = ref<number>(0);
const latestBatchNo = computed(() => historyList.value.find((h) => h.sysSettingBatchNo)?.sysSettingBatchNo ?? "");

const operationMap: Record<string, { label: string; type: string }> = {
  CREATE: { label: "新增", type: "success" },
  UPDATE: { label: "更新", type: "primary" },
  DELETE: { label: "删除", type: "danger" },
  IMPORT: { label: "导入", type: "warning" },
  ROLLBACK: { label: "回滚", type: "info" },
};

async function openHistory(row: SysSetting) {
  historySetting.value = row;
  historyPage.value = 1;
  historyDrawerVisible.value = true;
  await loadHistory();
}

async function loadHistory() {
  if (!historySetting.value?.sysSettingId) return;
  historyLoading.value = true;
  try {
    const res = await pageForSettingHistory({
      page: historyPage.value,
      pageSize: historyPageSize.value,
      settingId: historySetting.value.sysSettingId,
    });
    historyList.value = (res?.data?.data ?? res?.data?.records ?? []) as SysSettingHistory[];
    historyTotal.value = res?.data?.total ?? 0;
  } catch (e) {
    message.error((e as Error)?.message ?? "历史记录加载失败");
  } finally {
    historyLoading.value = false;
  }
}

async function handleRollbackSingle(record: SysSettingHistory) {
  if (!record.sysSettingHistoryId) return;
  await ElMessageBox.confirm(
    `确认将「${record.sysSettingName}」回滚到 ${record.createTime} 的版本？当前值将被覆盖。`,
    "回滚确认",
    { type: "warning" },
  );
  rollbackLoading.value = record.sysSettingHistoryId;
  try {
    await rollbackSettingHistorySingle(record.sysSettingHistoryId);
    message.success("回滚成功");
    await refreshAll();
    loadHistory();
  } catch (e) {
    message.error((e as Error)?.message ?? "回滚失败");
  } finally {
    rollbackLoading.value = 0;
  }
}

async function handleRollbackBatch(batchNo: string) {
  if (!batchNo) return;
  await ElMessageBox.confirm(`确认按批次「${batchNo}」回滚所有相关配置？`, "批次回滚确认", { type: "warning" });
  try {
    await rollbackSettingHistoryBatch(batchNo);
    message.success("批次回滚成功");
    await refreshAll();
    loadHistory();
  } catch (e) {
    message.error((e as Error)?.message ?? "回滚失败");
  }
}

function formatValue(val?: string): string {
  if (val == null || val === "") return "-";
  if (val.length > 80) return val.slice(0, 80) + "...";
  return val;
}

const batchNoInput = ref("");
const batchMode = ref(false);
const batchList = ref<SysSettingHistory[]>([]);
const batchLoading = ref(false);

async function handleViewBatch() {
  const no = batchNoInput.value.trim();
  if (!no) {
    message.warning("请输入批次号");
    return;
  }
  batchLoading.value = true;
  try {
    const res = await listSettingHistoryByBatch(no);
    batchList.value = (res?.data ?? []) as SysSettingHistory[];
    batchMode.value = true;
    if (!batchList.value.length) message.info("该批次无记录");
  } catch (e) {
    message.error((e as Error)?.message ?? "批次查询失败");
  } finally {
    batchLoading.value = false;
  }
}

function exitBatchMode() {
  batchMode.value = false;
  batchList.value = [];
  batchNoInput.value = "";
}

/* ================== 导出 ================== */

const exporting = ref(false);

async function handleSettingExport(group?: string) {
  exporting.value = true;
  try {
    const res = await exportSetting(group ?? activeGroup.value ?? undefined);
    const json = res?.data ?? "{}";
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `系统配置_${group ?? "all"}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    message.success("导出成功");
  } catch (e) {
    message.error((e as Error)?.message ?? "导出失败");
  } finally {
    exporting.value = false;
  }
}


/* ================== 邮箱连通性检测 ================== */

const emailChecking = ref(false);
const emailDialogVisible = ref(false);
const emailResult = ref<EmailConnectivity>();

const emailChannels = computed(() => {
  const e = emailResult.value;
  if (!e) return [];
  return [
    {
      key: "verify",
      title: "验证码通道",
      ok: e.emailVerifyEnable,
      desc: e.emailVerifyEnable ? "已就绪，个人中心可进行邮箱验证" : "未配置可用 SMTP，个人中心不显示邮箱验证入口",
      cost: null as number | null,
    },
    { key: "smtp", title: "SMTP 发信", ok: e.smtpSuccess, desc: e.smtpMessage, cost: e.smtpCost },
    { key: "imap", title: "IMAP 收信", ok: e.imapSuccess, desc: e.imapMessage, cost: e.imapCost },
  ];
});

async function handleEmailCheck() {
  emailChecking.value = true;
  try {
    const res = await checkEmailConnectivity();
    if (res?.data) {
      emailResult.value = res.data;
      emailDialogVisible.value = true;
    } else {
      message.error(res?.msg ?? "邮箱检测失败");
    }
  } catch (e) {
    message.error((e as Error)?.message ?? "邮箱检测失败");
  } finally {
    emailChecking.value = false;
  }
}

/* ================== 列定义 ================== */

const detailColumns: ReTableColumn[] = [
  { prop: "info", label: "配置", minWidth: 260, slot: "info" },
  // 这一列只读：值就地不可改（敏感项只给解密查看），改值走行尾编辑按钮与右栏检查器。
  // 之前叫「预览 / 编辑」会让人以为单元格可点进去改，与真实交互不符。
  { prop: "value", label: "当前值", minWidth: 320, slot: "value" },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right", align: "right" },
];

/**
 * 变更历史表格列（原模板里的 7 个 el-table-column 收敛到这里）。
 *
 * <p>标题都是中文字面量、不含 {@code t(...)}，所以用普通常量即可
 * （只有带 t() 的列标题才需要 computed，否则切语言表头不刷新）。</p>
 */
const historyColumns: ReTableColumn[] = [
  { prop: "sysSettingOperation", label: "操作", width: 80, align: "right", slot: "sysSettingOperation" },
  { prop: "sysSettingOldValue", label: "变更前", minWidth: 140, showOverflowTooltip: true, slot: "sysSettingOldValue" },
  { prop: "sysSettingNewValue", label: "变更后", minWidth: 140, showOverflowTooltip: true, slot: "sysSettingNewValue" },
  { prop: "sysSettingOperatorName", label: "操作人", width: 100 },
  { prop: "sysSettingBatchNo", label: "批次号", width: 140, showOverflowTooltip: true, slot: "sysSettingBatchNo" },
  { prop: "createTime", label: "时间", width: 170 },
  { prop: "action", label: "操作", width: 90, fixed: "right", align: "right", slot: "action" },
];

onMounted(() => {
  loadAll();
  // 账号清单与配置清单并行：账号行回显要用它把人名换出来
  void loadAccountBriefs();
});
</script>

<template>
  <div class="system-page">

    <!-- ============ 左栏：分组导航 ============ -->
    <aside class="config-nav" aria-label="配置分组">
      <div class="pane-hd">
        <span class="pane-hd__title">配置分组</span>
        <span class="pane-hd__count">{{ groups.length }}</span>
      </div>

      <div class="config-nav__search">
        <el-input
          v-model="groupKeyword"
          placeholder="搜索分组名称 / 编码"
          clearable
          :prefix-icon="Search"
          size="small"
        />
      </div>

      <div v-loading="groupLoading" class="config-nav__body">
        <template v-if="navSections.length">
          <div v-for="sec in navSections" :key="sec.key" class="nav-sec">
            <div class="nav-sec__label">
              {{ sec.label }}
              <span class="nav-sec__count">{{ sec.groups.length }}</span>
            </div>
            <button
              v-for="g in sec.groups"
              :key="g.group"
              type="button"
              class="group-nav__item"
              :class="[{ 'is-active': activeGroup === g.group }, `is-${groupAccent(g.group)}`]"
              :aria-current="activeGroup === g.group ? 'true' : undefined"
              :title="groupDesc(g.group)"
              @click="openGroup(g.group)"
            >
              <span class="group-nav__icon" aria-hidden="true">
                <el-icon :size="15"><component :is="groupIcon(g.group)" /></el-icon>
              </span>
              <span class="group-nav__name">{{ groupName(g.group) }}</span>
              <span class="group-nav__count">{{ g.items.length }}</span>
            </button>
          </div>
        </template>

        <!-- 搜索无结果 / 完全没有配置项：两种空态分开说，避免误判成数据问题 -->
        <div v-else-if="!groupLoading" class="config-nav__empty">
          <p>{{ groups.length ? "没有匹配的分组" : "暂无配置项" }}</p>
          <ReButton
            v-if="groups.length"
            type="primary"
            text
            icon="RefreshLeft"
            @click="groupKeyword = ''"
          >
            清除搜索
          </ReButton>
          <ReButton v-else type="primary" text icon="Refresh" @click="refreshAll">重新加载</ReButton>
        </div>
      </div>

      <div class="config-nav__foot">
        <span>共 {{ totalSettings }} 项配置</span>
        <div class="config-nav__foot__actions">
          <ReButton layout="square" icon="Refresh" tip="刷新" :loading="groupLoading" @click="refreshAll" />
          <ReButton
            v-if="mode === 'manage'"
            layout="square"
            icon="Plus"
            type="primary"
            tip="新增分组"
            @click="handleGroupAdd"
          />
        </div>
      </div>
    </aside>

    <!-- ============ 中栏：配置清单 ============ -->
    <section class="config-main" aria-label="配置清单">
      <!-- 中栏表格即「清单卡片」：表格贴卡片边，内边距交由工具栏与单元格承担 -->
      <ReTable
        ref="detailTableRef"
        class="config-table"
        table-id="setting-detail"
        :loader="loadDetail"
        :columns="detailColumns"
        :pagination="false"
        :layout-table="{ fill: true }"
        row-key="sysSettingId"
        :row-draggable="!isProduct"
        @row-click="selectRow"
        @row-sort="handleRowSort"
      >
        <template #toolbar>
          <span class="config-main__title">
            <span class="config-main__icon" aria-hidden="true">
              <el-icon :size="15"><component :is="activeGroup ? groupIcon(activeGroup) : Tools" /></el-icon>
            </span>
            <span class="config-main__name">{{ activeGroup ? groupName(activeGroup) : "配置清单" }}</span>
            <!-- 没有中文名时 groupName 会回退成编码，此时再挂一枚同样的编码标签就是纯重复 -->
            <code v-if="activeGroup && groupName(activeGroup) !== activeGroup" class="config-main__code">
              {{ activeGroup }}
            </code>
            <span class="config-main__count">{{ activeGroupCount }} 项</span>
          </span>
          <!-- 主操作给实底：工具栏里只有一个主动作，实底才能一眼认出「新增」 -->
          <ReButton v-if="!isProduct" type="primary" icon="Plus" v-admin @click="handleAdd">新增配置项</ReButton>
          <ReButton
            type="success"
            text
            icon="Download"
            :loading="exporting"
            :disabled="!activeGroup"
            @click="handleSettingExport(activeGroup!)"
          >
            导出本组
          </ReButton>
          <ReButton
            v-if="activeGroup === 'smtp'"
            type="warning"
            text
            icon="Promotion"
            :loading="emailChecking"
            @click="handleEmailCheck"
          >
            邮箱检测
          </ReButton>
        </template>

        <!--
          可操作空态：分组详情里一个配置项都没有时，el-empty 只能干看着。
          这里给出「新建 + 刷新」两个出口，让用户不用退回分组列表就能继续。
          复用 refreshAll（而不是新造 reload）：它同时刷分组全量与本表，
          正是「刷新」在这里该做的事。
          page-empty 系列样式在 pages/system/src/styles/system-page.css 里全局提供，本页不重复定义。
        -->
        <template #empty>
          <div class="page-empty">
            <span class="page-empty__icon"><ReIcon name="Tools" :size="22" /></span>
            <span class="page-empty__title">该分组还没有配置项</span>
            <span class="page-empty__desc">配置项是一个可被代码读取的参数，例如站点标题、连接地址、邮件开关；先建一条再改值。</span>
            <span class="page-empty__actions">
              <ReButton v-if="!isProduct" type="primary" icon="Plus" v-admin @click="handleAdd">新增配置项</ReButton>
              <ReButton icon="Refresh" @click="refreshAll">刷新</ReButton>
            </span>
          </div>
        </template>

        <template #info="{ row }">
          <div class="c-item" :class="{ 'is-selected': isSelectedRow(row) }">
            <span class="c-item__icon" aria-hidden="true">
              <el-icon :size="16"><component :is="settingIcon(row)" /></el-icon>
            </span>
            <div class="c-item__text">
              <div class="c-item__name">
                <span class="c-item__label">{{ settingLabel(row) }}</span>
                <el-tag v-if="isSensitive(row)" size="small" type="warning" effect="plain" round>敏感</el-tag>
                <el-tag v-if="row.sysSettingInSystem === 1" size="small" type="info" effect="plain" round>内置</el-tag>
              </div>
              <div class="c-item__meta">
                <!-- 编码为空时不占位：否则每行都顶一个「- ·」，读起来像缺数据 -->
                <template v-if="row.sysSettingCode">
                  <code class="c-item__code">{{ row.sysSettingCode }}</code>
                  <span class="c-item__sep" aria-hidden="true">·</span>
                </template>
                <span>{{ typeLabel(row.sysSettingValueType) }}</span>
              </div>
            </div>
          </div>
        </template>

        <template #value="{ row }">
          <!-- 账号选型行存的是账号 UUID，直接显示对人没有意义：翻成账号名 -->
          <span v-if="accountKindOf(row)" class="value-readonly">
            {{ accountValueText(row.sysSettingValue) }}
          </span>
          <div v-else-if="isSensitive(row)" class="sensitive-box">
            <code class="sensitive-box__text">{{ revealedMap[row.sysSettingId] ?? "••••••••" }}</code>
            <el-button link type="primary" @click.stop="toggleSensitive(row)">
              <el-icon><component :is="revealedMap[row.sysSettingId] ? Hide : View" /></el-icon>
            </el-button>
          </div>
          <!-- 布尔配置不输出 true/false 原始字面量：读的人要的是「开没开」 -->
          <span
            v-else-if="isBooleanType(row.sysSettingValueType)"
            class="bool-value"
            :class="{ 'is-on': isBooleanTruthy(row.sysSettingValue) }"
            :title="row.sysSettingValue || 'false'"
          >
            <span class="bool-value__dot" aria-hidden="true" />
            {{ booleanText(row.sysSettingValue) }}
          </span>
          <span v-else class="value-readonly"><template v-for="(seg, i) in valueSegments(row.sysSettingValue)" :key="i">{{ seg }}<wbr /></template></span>
        </template>

        <template #action="{ row }">
          <ReButton layout="square" type="primary" icon="Edit" tip="编辑" v-admin @click.stop="handleEdit(row)" />
          <ReButton layout="square" type="info" icon="Clock" tip="变更历史" @click.stop="openHistory(row)" />
          <ReButton v-if="!isProduct" layout="square" type="danger" icon="Delete" tip="删除" v-admin @click.stop="handleDelete(row)" />
        </template>
      </ReTable>
    </section>

    <!-- ============ 右栏：配置检查器 ============ -->
    <aside class="config-insp" aria-label="配置检查器">
      <div class="pane-hd">
        <span class="pane-hd__title">配置检查器</span>
        <span v-if="selectedSetting" class="config-insp__tools">
          <ReButton layout="square" type="info" icon="Clock" tip="变更历史" @click="historyOfSelected" />
          <ReButton
            v-if="!isProduct"
            layout="square"
            type="danger"
            icon="Delete"
            tip="删除配置"
            v-admin
            @click="deleteSelected"
          />
        </span>
      </div>

      <div v-if="selectedSetting" class="config-insp__body">
        <div class="insp-hero">
          <span class="insp-hero__icon" aria-hidden="true">
            <el-icon :size="20"><component :is="settingIcon(selectedSetting)" /></el-icon>
          </span>
          <div class="insp-hero__text">
            <div class="insp-hero__name">{{ settingLabel(selectedSetting) }}</div>
            <code class="insp-hero__code">{{ selectedSetting.sysSettingCode || "-" }}</code>
          </div>
        </div>

        <dl class="insp-list">
          <div class="insp-row">
            <dt>当前值</dt>
            <dd>
              <span
                v-if="!isSensitive(selectedSetting) && isBooleanType(selectedSetting.sysSettingValueType)"
                class="bool-value"
                :class="{ 'is-on': isBooleanTruthy(selectedSetting.sysSettingValue) }"
                :title="selectedSetting.sysSettingValue || 'false'"
              >
                <span class="bool-value__dot" aria-hidden="true" />
                {{ selectedValueText }}
              </span>
              <code v-else class="insp-val">{{ selectedValueText }}</code>
            </dd>
          </div>
          <div class="insp-row">
            <dt>值类型</dt>
            <dd>{{ typeLabel(selectedSetting.sysSettingValueType) }}</dd>
          </div>
          <div class="insp-row">
            <dt>所属分组</dt>
            <dd>{{ selectedGroupText }}</dd>
          </div>
          <div class="insp-row">
            <dt>默认值</dt>
            <dd><code class="insp-val">{{ selectedSetting.sysSettingDefaultValue || "-" }}</code></dd>
          </div>
          <div class="insp-row">
            <dt>敏感配置</dt>
            <dd>{{ isSensitive(selectedSetting) ? "是，列表默认掩码" : "否" }}</dd>
          </div>
          <div class="insp-row">
            <dt>系统内置</dt>
            <dd>{{ selectedSetting.sysSettingInSystem === 1 ? "是" : "否" }}</dd>
          </div>
          <div class="insp-row">
            <dt>校验规则</dt>
            <dd><code class="insp-val">{{ selectedSetting.sysSettingValidate || "-" }}</code></dd>
          </div>
          <div class="insp-row">
            <dt>备注</dt>
            <dd>{{ selectedSetting.sysSettingRemark || "-" }}</dd>
          </div>
        </dl>

        <div class="insp-actions">
          <ReButton v-if="!isProduct" type="primary" icon="Edit" v-admin @click="editSelected">
            编辑配置
          </ReButton>
          <ReButton
            v-if="isSensitive(selectedSetting)"
            :type="selectedIsRevealed ? 'info' : 'warning'"
            :icon="selectedIsRevealed ? 'Hide' : 'View'"
            @click="toggleSelectedSensitive"
          >
            {{ selectedIsRevealed ? "隐藏明文" : "解密查看" }}
          </ReButton>
        </div>
        <p v-if="isSensitive(selectedSetting)" class="insp-hint">
          明文 10 秒后自动隐藏；请勿在截图或日志中留存。
        </p>
      </div>

      <div v-else class="config-insp__empty">
        <span class="config-insp__empty-icon"><ReIcon name="Tools" :size="22" /></span>
        <p>在左侧选择分组，再点选清单里的配置项，这里会常驻显示它的完整属性。</p>
      </div>
    </aside>


    <!-- 新增/编辑弹窗 -->
    <ReDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑配置' : '新增配置'"
      width="600"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="saving"
      :footer-hidden="false" @ok="handleSubmit"
    >
      <el-form label-width="100px" :model="form">
        <el-form-item label="名称" required>
          <ReInput layout="modern" v-model="form.sysSettingName" placeholder="如：登录页标题" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="编码" required>
          <ReInput layout="modern" v-model="form.sysSettingCode" placeholder="如：login.title" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="分组" required>
          <ReInput layout="modern" v-model="form.sysSettingGroup" placeholder="如：default / config" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="类型" required>
          <el-select v-model="form.sysSettingValueType" class="w-full" placeholder="请选择类型">
            <el-option v-for="o in settingTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="默认值">
          <ReInput
            layout="modern"
            v-model="form.sysSettingDefaultValue"
            :type="isSensitive(form) && !editRevealSensitive ? 'password' : 'textarea'"
            :rows="isSensitive(form) && !editRevealSensitive ? 1 : 3"
            placeholder="默认值"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isEdit && isSensitive(form)" label="显示明文">
          <ReSwitch layout="square" v-model="editRevealSensitive" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="form.sysSettingSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="校验规则">
          <ReInput layout="modern" v-model="form.sysSettingValidate" placeholder="正则表达式，可空" maxlength="512" />
        </el-form-item>
        <el-form-item label="系统内置">
          <ReSwitch
            layout="square"
            :model-value="form.sysSettingInSystem === 1"
            @update:model-value="(v: boolean) => (form.sysSettingInSystem = v ? 1 : 0)"
          />
        </el-form-item>
        <el-form-item label="备注">
          <ReInput layout="modern" v-model="form.sysSettingRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 新增分组弹窗：左栏底部「+」入口 -->
    <ReDialog
      v-model="groupDialogVisible"
      title="新增分组"
      width="520"
      :close-on-click-modal="false"
      destroy-on-close
      layout="modern"
      compact
      :confirm-loading="groupSaving"
      :footer-hidden="false"
      @ok="handleGroupSubmit"
    >
      <el-form label-width="100px" :model="groupForm">
        <el-form-item label="分组名称" required>
          <ReInput layout="modern" v-model="groupForm.sysSettingGroupName" placeholder="如：业务开关" maxlength="64" show-word-limit />
        </el-form-item>
        <el-form-item label="分组编码" required>
          <ReInput layout="modern" v-model="groupForm.sysSettingGroupCode" placeholder="英文编码，如 business（建立后不建议改）" maxlength="64" />
        </el-form-item>
        <el-form-item label="图标">
          <ReInput layout="modern" v-model="groupForm.sysSettingGroupIcon" placeholder="图标名，如 ep:setting（可空）" maxlength="128" />
        </el-form-item>
        <el-form-item label="排序">
          <ReInputNumber layout="modern" v-model="groupForm.sysSettingGroupSort" :min="0" class="!w-full" />
        </el-form-item>
        <el-form-item label="启用">
          <ReSwitch layout="square" v-model="groupForm.sysSettingGroupEnable" />
        </el-form-item>
        <el-form-item label="描述">
          <ReInput layout="modern" v-model="groupForm.sysSettingGroupRemark" type="textarea" :rows="2" maxlength="255" show-word-limit />
        </el-form-item>
      </el-form>
    </ReDialog>

    <!-- 变更历史抽屉 -->
    <ReDrawer
      v-model="historyDrawerVisible"
      :title="`变更历史 - ${historySetting ? settingLabel(historySetting) : ''}`"
      size="640"
      :show-window-shell="false"
      :close-on-click-modal="true"
      :footer-hidden="true"
    >
      <template #content>
        <div v-loading="historyLoading" class="setting-history">
          <el-alert
            v-if="historySetting"
            :title="`配置编码：${historySetting.sysSettingCode}`"
            type="info"
            :closable="false"
            class="mb-3"
            show-icon
          />
          <div class="batch-bar mb-3">
            <el-input
              v-model="batchNoInput"
              placeholder="输入批次号，按批次查看全部变更"
              clearable
              class="!w-72"
              @keyup.enter="handleViewBatch"
            />
            <el-button type="primary" :loading="batchLoading" @click="handleViewBatch">查看批次</el-button>
            <el-button v-if="batchMode" link type="info" @click="exitBatchMode">返回普通查看</el-button>
          </div>
          <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
               边框/斑马纹样式；pagination=false / toolbar=false —— 不新增页码与工具栏按钮；
               原 el-table 的 border 走 ReTable 默认（border: true），stripe 走同名 prop。 -->
          <ReTable
            :data="batchMode ? batchList : historyList"
            :columns="historyColumns"
            engine="element"
            :pagination="false"
            :toolbar="false"
            :layout-table="{ minHeight: 0 }"
            stripe
            style="width: 100%"
          >
            <template #col-sysSettingOperation="{ row }">
              <el-tag :type="(operationMap[row.sysSettingOperation ?? '']?.type ?? 'info') as never"  effect="plain">
                {{ operationMap[row.sysSettingOperation ?? '']?.label ?? row.sysSettingOperation }}
              </el-tag>
            </template>
            <template #col-sysSettingOldValue="{ row }">
              <code class="setting-old">{{ formatValue(row.sysSettingOldValue) }}</code>
            </template>
            <template #col-sysSettingNewValue="{ row }">
              <code class="setting-new">{{ formatValue(row.sysSettingNewValue) }}</code>
            </template>
            <template #col-sysSettingBatchNo="{ row }">
              <span
                v-if="row.sysSettingBatchNo"
                class="batch-link"
                role="button"
                :tabindex="0"
                :aria-label="`按批次 ${row.sysSettingBatchNo} 回滚`"
                @click="handleRollbackBatch(row.sysSettingBatchNo!)"
                @keydown.enter="handleRollbackBatch(row.sysSettingBatchNo!)"
                @keydown.space.prevent="handleRollbackBatch(row.sysSettingBatchNo!)"
              >
                {{ row.sysSettingBatchNo }}
              </span>
              <span v-else class="setting-na">-</span>
            </template>
            <template #col-action="{ row }">
              <el-button type="primary" link  :loading="rollbackLoading === row.sysSettingHistoryId" @click="handleRollbackSingle(row)">
                回滚
              </el-button>
            </template>
          </ReTable>
          <div class="flex justify-end items-center mt-3 gap-2">
            <template v-if="batchMode">
              <el-button type="danger"  @click="handleRollbackBatch(batchNoInput.trim())">
                整批回滚（{{ batchNoInput.trim() }}）
              </el-button>
              <span class="setting-na">共 {{ batchList.length }} 条记录</span>
            </template>
            <template v-else>
              <el-button type="warning"  :disabled="!latestBatchNo" @click="handleRollbackBatch(latestBatchNo!)">
                批次回滚（{{ latestBatchNo || "无批次" }}）
              </el-button>
              <el-pagination
                v-model:current-page="historyPage"
                v-model:page-size="historyPageSize"
                :total="historyTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next"
                @size-change="loadHistory"
                @current-change="loadHistory"
              />
            </template>
          </div>
        </div>
      </template>
    </ReDrawer>

    <!-- 邮箱连通性检测 -->
    <ReDialog
      v-model="emailDialogVisible"
      title="服务器邮箱连通性检测"
      width="600"
      layout="modern"
      compact
      destroy-on-close
    >
      <div v-if="emailResult" class="email-check">
        <el-alert
          :title="emailResult.emailVerifyEnable ? '邮箱服务已就绪，可发送验证码' : '邮箱验证码通道未就绪'"
          :type="emailResult.emailVerifyEnable ? 'success' : 'warning'"
          :closable="false"
          show-icon
          class="mb-3"
        />
        <div class="email-check__grid">
          <div v-for="c in emailChannels" :key="c.key" class="email-card" :class="c.ok ? 'email-card--ok' : 'email-card--fail'">
            <div class="email-card__head">
              <el-icon :size="18" class="email-card__icon">
                <component :is="c.ok ? 'CircleCheckFilled' : 'CircleCloseFilled'" />
              </el-icon>
              <span class="email-card__title">{{ c.title }}</span>
              <el-tag v-if="costMs(c.cost) != null"  effect="plain" type="info" class="m-l-auto">
                <ReTime :value="costMs(c.cost)" format="duration" />
              </el-tag>
            </div>
            <div class="email-card__desc">{{ c.desc }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" :loading="emailChecking" @click="handleEmailCheck">重新检测</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
/* 三栏之间只留 4px：面板靠 1px 描边分界，不靠间距建立层级。
   全局 system-page.css 给的是纵向 flex，这里改成横向（scoped 选择器权重更高，无需 !important）。 */
.system-page {
  position: relative;
  display: flex;
  flex-direction: row;
  gap: 4px;
  padding: 0;
  /* 高度吃满父容器，不要自己算视口：父链已经让出了 header(56) 与 main-content 的
     padding(8+8)，再减 100 就是重复扣减；而标签栏(Tabs)是条件渲染的，写死的
     视口算式在标签栏出现时会多算一截，把 el-main 顶出滚动条。 */
  height: 100%;
  min-height: 0;
}

/* ============ 栏位骨架 ============
   左右两栏都是「卡片 + 头部 + 内部滚动」：卡片只描边不投影，
   高度吃满页面，滚动发生在栏内部，页面本身不再滚。 */
.config-nav,
.config-insp {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-md, 8px);
  background: var(--el-bg-color);
}
.config-nav {
  flex: 0 0 232px;
}
.config-insp {
  flex: 0 0 316px;
}

.pane-hd {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 44px;
  height: 44px;
  padding: 0 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.pane-hd__title {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--el-text-color-regular);
}
.pane-hd__count {
  padding: 0 7px;
  font-size: 11px;
  font-family: var(--el-font-family-monospace, monospace);
  line-height: 18px;
  color: var(--el-text-color-secondary);
  border-radius: var(--el-radius-full, 9999px);
  background: var(--el-fill-color-light);
}

/* ---- 左栏：搜索 + 分段导航 ---- */
.config-nav__search {
  padding: 8px 10px 4px;
}
.config-nav__body {
  flex: 1;
  min-height: 0;
  padding: 0 6px 8px;
  overflow: auto;
}
.nav-sec + .nav-sec {
  margin-top: 4px;
}
.nav-sec__label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 8px 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.4px;
  color: var(--el-text-color-placeholder);
}
.nav-sec__count {
  font-size: 10.5px;
  font-weight: 500;
  font-family: var(--el-font-family-monospace, monospace);
}

/* 分组行：图标用分组强调色，选中态统一回主色底（与设计稿 navrow.on 一致） */
.group-nav__item {
  --nav-accent: var(--el-color-primary);
  --nav-soft: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 38px;
  padding: 0 8px;
  border: 1px solid transparent;
  border-radius: var(--el-radius-md, 8px);
  background: transparent;
  color: var(--el-text-color-regular);
  font-family: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  outline: none;
  transition:
    background-color var(--el-transition-duration-fast, 0.2s),
    border-color var(--el-transition-duration-fast, 0.2s),
    color var(--el-transition-duration-fast, 0.2s);
}
.group-nav__item:hover {
  background: var(--el-fill-color-light);
}
/* 键盘可达：原生 button 也得有焦点环，否则 Tab 过去看不出焦点落在哪 */
.group-nav__item:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}
.group-nav__item.is-active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-8);
}
.group-nav__item.is-primary {
  --nav-accent: var(--el-color-primary);
  --nav-soft: var(--el-color-primary-light-9);
}
.group-nav__item.is-success {
  --nav-accent: var(--el-color-success);
  --nav-soft: var(--el-color-success-light-9);
}
.group-nav__item.is-warning {
  --nav-accent: var(--el-color-warning);
  --nav-soft: var(--el-color-warning-light-9);
}
.group-nav__item.is-danger {
  --nav-accent: var(--el-color-danger);
  --nav-soft: var(--el-color-danger-light-9);
}
.group-nav__item.is-info {
  --nav-accent: var(--el-color-info);
  --nav-soft: var(--el-color-info-light-9);
}
.group-nav__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--nav-accent);
  background: var(--nav-soft);
}
.group-nav__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.group-nav__item.is-active .group-nav__name {
  font-weight: 600;
  color: var(--el-color-primary);
}
.group-nav__count {
  font-size: 10.5px;
  font-family: var(--el-font-family-monospace, monospace);
  color: var(--el-text-color-placeholder);
}
.group-nav__item.is-active .group-nav__count {
  color: var(--el-color-primary);
}

.config-nav__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 24px 8px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  text-align: center;
}
.config-nav__empty p {
  margin: 0;
}

.config-nav__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex: 0 0 38px;
  padding: 0 10px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.config-nav__foot__actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* ============ 中栏：清单卡片 ============
   ReTable 自己就是卡片：圆角与左右两栏对齐，根容器内边距归零，
   工具栏行单独留 padding —— 表格线才会真正贴到卡片边。 */
.config-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.config-table {
  flex: 1 1 auto;
  min-height: 0;
  --rt-radius: var(--el-radius-md, 8px);
  --rt-padding: 0;
}
.config-table :deep(.re-table__main) {
  padding: 0;
}
/* 工具栏行只保留内边距与底部分隔线；margin-bottom 归零，表格紧贴工具栏 */
.config-table :deep(.re-table__toolbar-row) {
  margin-bottom: 0;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.config-main__title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.config-main__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.config-main__name {
  font-size: 13px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.config-main__code {
  padding: 1px 6px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-fill-color-light);
}
.config-main__count {
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}

/* 行内「配置」单元格：图标 + 名称（含敏感/内置标签）+ 编码 · 类型 */
.c-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}
.c-item__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 28px;
  width: 28px;
  height: 28px;
  border-radius: var(--el-radius-sm, 6px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.c-item__text {
  min-width: 0;
}
.c-item__name {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}
.c-item__label {
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.c-item__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  margin-top: 3px;
  font-size: 11.5px;
  color: var(--el-text-color-secondary);
}
.c-item__code {
  overflow: hidden;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  text-overflow: ellipsis;
  white-space: nowrap;
}
.c-item__sep {
  color: var(--el-border-color);
}

/* 选中行：info 单元格带 is-selected，反穿到整行底色。
   ReTable 未透出 rowClassName，vxe 下 highlightCurrentRow 也不生效，
   所以选中态只能这样落到行上；两套引擎各兜一条。 */
.config-table :deep(.vxe-body--row:has(.is-selected) > .vxe-body--column) {
  background-color: color-mix(in srgb, var(--el-color-primary) 9%, var(--el-bg-color));
}
.config-table :deep(.vxe-body--row:has(.is-selected) > .vxe-body--column:first-child) {
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}
.config-table :deep(.el-table__row:has(.is-selected) > td) {
  background-color: color-mix(in srgb, var(--el-color-primary) 9%, var(--el-bg-color));
}
.config-table :deep(.el-table__row:has(.is-selected) > td:first-child) {
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}

/* ============ 右栏：配置检查器 ============ */
.config-insp__tools {
  display: flex;
  align-items: center;
  gap: 2px;
}
.config-insp__body {
  flex: 1;
  min-height: 0;
  padding: 12px 14px 16px;
  overflow: auto;
}
.insp-hero {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.insp-hero__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  border-radius: var(--el-radius-md, 8px);
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}
.insp-hero__text {
  min-width: 0;
}
.insp-hero__name {
  font-size: 14px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.insp-hero__code {
  display: inline-block;
  margin-top: 3px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
}

/* 属性行：标签在上、值在下（与设计稿 insp-row 一致），值允许换行不截断 */
.insp-list {
  margin: 0;
}
.insp-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 2px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.insp-row:last-child {
  border-bottom: none;
}
.insp-row dt {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.3px;
  color: var(--el-text-color-secondary);
}
.insp-row dd {
  margin: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.insp-val {
  padding: 1px 6px;
  font-family: var(--el-font-family-monospace, monospace);
  font-size: 11.5px;
  border-radius: var(--el-radius-xs, 4px);
  background: var(--el-fill-color-light);
}
.insp-actions {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.insp-hint {
  margin: 8px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--el-text-color-secondary);
}
.config-insp__empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px 20px;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  text-align: center;
}
.config-insp__empty p {
  margin: 0;
}
.config-insp__empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-text-color-placeholder);
  background: var(--el-fill-color-light);
}

/* 窄屏：先压缩两侧栏，再纵向堆叠（三栏硬挤会把检查器压成一条） */
@media (max-width: 1180px) {
  .config-nav {
    flex-basis: 208px;
  }
  .config-insp {
    flex-basis: 264px;
  }
}
@media (max-width: 1024px) {
  .system-page {
    flex-direction: column;
    height: auto;
  }
  .config-nav,
  .config-insp {
    flex: none;
    max-height: 300px;
  }
  .config-main {
    min-height: 460px;
  }
}

/* 敏感掩码 */
.sensitive-box {
  display: flex;
  align-items: center;
  gap: 6px;
}
.sensitive-box__text {
  font-size: 12px;
  font-family: var(--el-font-family-monospace, monospace);
}

.value-readonly {
  font-size: 13px;
  color: var(--el-text-color-regular);
  /* 断点由模板里的 <wbr> 提供（URL 层级），这里只兜底极长的不可断词 */
  overflow-wrap: anywhere;
}

/* 布尔值可视化：圆点 + 开启/关闭，代替 true/false 原始字面量 */
.bool-value {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 9px 1px 7px;
  font-size: 12px;
  line-height: 20px;
  border-radius: 999px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
}
.bool-value__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--el-text-color-placeholder);
}
.bool-value.is-on {
  color: var(--el-color-success);
  background: var(--el-color-success-light-9);
}
.bool-value.is-on .bool-value__dot {
  background: var(--el-color-success);
}

.setting-na {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}
.setting-old {
  font-size: 12px;
  color: var(--el-color-danger);
}
.setting-new {
  font-size: 12px;
  color: var(--el-color-success);
}
.batch-link {
  display: inline-block;
  font-size: 12px;
  cursor: pointer;
  color: var(--el-color-primary);
  outline: none;
  /* 键盘可达：span 模拟按钮，Tab 聚焦时补焦点环 */
}
.batch-link:focus-visible {
  border-radius: var(--el-radius-xs, 4px);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

/* ============ 表格外壳 ============
   ReTable 的边框 / 圆角 / 投影 / focus-within 变色由插件自身提供，
   见 packages/ui ReTable/shared/table-vars.css 与 ReTable.vue 的
   `.re-table` / `.re-table--separated` 规则，本页不再重复声明。 */

.setting-history .batch-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mb-3 {
  margin-bottom: 12px;
}

/* 邮箱检测 */
.email-check__grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.email-card {
  border: 1px solid var(--el-border-color-lighter);
  /* 原 10px 魔法值 → --el-radius-md（8px 档） */
  border-radius: var(--el-radius-md, 8px);
  padding: 12px 14px;
  background: var(--el-bg-color);
}
.email-card--ok {
  border-color: var(--el-color-success-light-5);
  background: var(--el-color-success-light-9);
}
.email-card--fail {
  border-color: var(--el-color-danger-light-5);
  background: var(--el-color-danger-light-9);
}
.email-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.email-card--ok .email-card__icon {
  color: var(--el-color-success);
}
.email-card--fail .email-card__icon {
  color: var(--el-color-danger);
}
.email-card__title {
  font-weight: 600;
  font-size: 14px;
}
.email-card__desc {
  margin-top: 6px;
  font-size: 13px;
  color: var(--el-text-color-regular);
  word-break: break-all;
}

/* 尊重系统「减少动态效果」偏好：把本页自己的过渡一并关掉
   （ReTable 的过渡由插件自带的同名媒体查询处理） */
@media (prefers-reduced-motion: reduce) {
  .group-nav__item {
    transition: none;
  }
}
</style>
