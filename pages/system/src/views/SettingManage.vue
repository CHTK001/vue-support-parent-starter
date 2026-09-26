<script setup lang="ts">
/**
 * 配置管理（sys_setting）
 *
 * 纯卡片视图：按分组渲染卡片，点击卡片进入该分组配置页；每个配置一行，
 * 左右结构（左图标 / 名称+描述 / 值编辑，校验失败显示在底部），支持行拖拽排序。
 */
import { computed, onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Edit,
  Delete,
  Clock,
  View,
  Hide,
  ArrowLeft,
  ArrowRight,
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
  Files,
  DataLine,
  SwitchButton,
  EditPen,
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
} from "../api/systemApi";
import type { SysSetting, SysSettingHistory, EmailConnectivity } from "../api/types";
import type { ReTableColumn, RePageResult } from "@repo/ui/re-table";
import { settingTypeOptions, normType, typeLabel } from "../settingUtils";
import { settingLabel } from "../settingLabels";

/* ================== 页面模式 ==================
 * manage：配置管理（创建/删除配置定义，菜单入口）
 * product：产品级系统配置（仅改值，不增删定义，由侧边栏底部设置按钮进入）
 */
const props = withDefaults(defineProps<{ mode?: "manage" | "product" }>(), {
  mode: "manage",
});
/** 产品级系统配置：隐藏配置定义的新增/删除/拖拽排序 */
const isProduct = computed(() => props.mode === "product");

/* ================== 分组导航 ================== */

/** 当前进入的分组；null 表示分组卡片网格 */
const activeGroup = ref<string | null>(null);

/** 分组详情 ReTable 实例（模板 ref，用于改值/排序后 reload） */
const detailTableRef = ref<{ reload: () => Promise<void> } | null>(null);

async function openGroup(g: string) {
  activeGroup.value = g;
  if (!allSettings.value.length) await loadAll();
  setTimeout(() => detailTableRef.value?.reload(), 0);
}

/* ================== 分组图标 / 描述 ================== */

const groupIconMap: Record<string, unknown> = {
  default: Setting,
  config: Connection,
  userAgreement: Document,
  smtp: Promotion,
  sms: Cellphone,
};
const groupDescMap: Record<string, string> = {
  default: "登录页与界面基础配置（品牌、Logo、欢迎语、备案号等）",
  config: "WebSocket / Socket 连接配置",
  userAgreement: "用户协议内容与条款",
  smtp: "内部邮箱服务（SMTP 发信 / IMAP 收信），用于系统邮件、通知与验证码投递",
  sms: "内部短信服务（阿里云 / 腾讯云），用于通知与短信验证码投递",
};

const groupNameMap: Record<string, string> = {
  default: "默认配置",
  config: "系统配置",
  userAgreement: "用户协议",
  smtp: "邮件服务",
  sms: "短信服务",
};
function groupName(g: string): string {
  if (g.startsWith("startup")) return "启动参数";
  return groupNameMap[g] ?? g;
}
function groupIcon(g: string): unknown {
  if (g.startsWith("startup")) return Cpu;
  return groupIconMap[g] ?? Folder;
}
function groupDesc(g: string): string {
  if (g.startsWith("startup")) return "后端启动采集参数（内置）";
  return groupDescMap[g] ?? "该分组下的配置项";
}

/** 分组强调色（映射到 Element 色板，深浅色自适应） */
const groupAccentMap: Record<string, string> = {
  default: "primary",
  config: "info",
  userAgreement: "success",
  smtp: "warning",
  sms: "success",
};
function groupAccent(g: string): string {
  if (g.startsWith("startup")) return "info";
  return groupAccentMap[g] ?? "primary";
}

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

/* ================== 全量数据 ================== */

const allSettings = ref<SysSetting[]>([]);
const groupLoading = ref(false);

async function loadAll() {
  groupLoading.value = true;
  try {
    const res = await pageForSetting({ page: 1, pageSize: 1000 });
    allSettings.value = unwrapPage(res).rows as SysSetting[];
  } catch {
    allSettings.value = [];
  } finally {
    groupLoading.value = false;
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

/** 按分组聚类并按 sort 排序 */
const groups = computed(() => {
  const m = new Map<string, SysSetting[]>();
  allSettings.value.forEach((s) => {
    const g = s.sysSettingGroup || "default";
    if (!m.has(g)) m.set(g, []);
    m.get(g)!.push(s);
  });
  return [...m.entries()]
    .map(([group, items]) => ({
      group,
      items: [...items].sort((a, b) => (a.sysSettingSort ?? 0) - (b.sysSettingSort ?? 0)),
    }))
    .sort((a, b) => a.group.localeCompare(b.group));
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
    ElMessage.success("排序已保存");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "排序保存失败");
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

function handleEdit(row: Record<string,unknown>) {
  isEdit.value = true;
  editRevealSensitive.value = false;
  form.value = {
    ...(row as unknown as SysSetting),
    sysSettingValueType: normType((row as SysSetting).sysSettingValueType),
  };
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!form.value.sysSettingName || !form.value.sysSettingCode) {
    ElMessage.warning("请填写名称和编码");
    return;
  }
  if (!form.value.sysSettingGroup) {
    ElMessage.warning("请填写分组");
    return;
  }
  if (!form.value.sysSettingValueType) {
    ElMessage.warning("请选择类型");
    return;
  }
  form.value.sysSettingValueType = normType(form.value.sysSettingValueType);
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateSetting(form.value);
      ElMessage.success("修改成功");
    } else {
      await saveSetting(form.value);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    await refreshAll();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "保存失败");
  } finally {
    saving.value = false;
  }
}

async function handleDelete(row: Record<string,unknown>) {
  const setting = row as unknown as SysSetting;
  await ElMessageBox.confirm(`确认删除配置「${setting.sysSettingName}」？`, "提示", { type: "warning" });
  await deleteSetting(setting.sysSettingId!);
  ElMessage.success("删除成功");
  await refreshAll();
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
    ElMessage.error((e as Error)?.message ?? "获取明文失败");
  }
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

async function openHistory(row: Record<string,unknown>) {
  historySetting.value = row as unknown as SysSetting;
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
    ElMessage.error((e as Error)?.message ?? "历史记录加载失败");
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
    ElMessage.success("回滚成功");
    await refreshAll();
    loadHistory();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "回滚失败");
  } finally {
    rollbackLoading.value = 0;
  }
}

async function handleRollbackBatch(batchNo: string) {
  if (!batchNo) return;
  await ElMessageBox.confirm(`确认按批次「${batchNo}」回滚所有相关配置？`, "批次回滚确认", { type: "warning" });
  try {
    await rollbackSettingHistoryBatch(batchNo);
    ElMessage.success("批次回滚成功");
    await refreshAll();
    loadHistory();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "回滚失败");
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
    ElMessage.warning("请输入批次号");
    return;
  }
  batchLoading.value = true;
  try {
    const res = await listSettingHistoryByBatch(no);
    batchList.value = (res?.data ?? []) as SysSettingHistory[];
    batchMode.value = true;
    if (!batchList.value.length) ElMessage.info("该批次无记录");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "批次查询失败");
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
    ElMessage.success("导出成功");
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "导出失败");
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
      ElMessage.error(res?.msg ?? "邮箱检测失败");
    }
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "邮箱检测失败");
  } finally {
    emailChecking.value = false;
  }
}

/* ================== 列定义 ================== */

const detailColumns: ReTableColumn[] = [
  { prop: "info", label: "配置", minWidth: 260, slot: "info" },
  { prop: "value", label: "预览 / 编辑", minWidth: 320, slot: "value" },
  { prop: "action", label: "操作", width: 150, slot: "action", fixed: "right", align: "center" },
];

onMounted(() => {
  loadAll();
});
</script>

<template>
  <div class="system-page">

    <!-- ============ 分组卡片网格 ============ -->
    <div v-if="!activeGroup" v-loading="groupLoading" class="group-view">
      <div class="group-topbar">
        <div class="group-topbar__lead">
          <div class="group-topbar__icon">
            <el-icon :size="18"><Tools /></el-icon>
          </div>
          <div class="group-topbar__titles">
            <h2 class="group-topbar__title">配置管理</h2>
            <p class="group-topbar__sub">集中管理系统参数、连接与各类服务</p>
          </div>
        </div>
        <div class="group-topbar__right">
          <span class="group-chip"><b>{{ groups.length }}</b> 个分组</span>
          <span class="group-chip"><b>{{ totalSettings }}</b> 个配置项</span>
          <ReButton
            layout="square"
            icon="Refresh"
            title="刷新"
            :loading="groupLoading"
            @click="loadAll"
          />
        </div>
      </div>

      <div v-if="!groupLoading && groups.length" class="group-grid">
        <div
          v-for="g in groups"
          :key="g.group"
          class="group-card"
          :class="`is-${groupAccent(g.group)}`"
          @click="openGroup(g.group)"
        >
          <div class="group-card__top">
            <div class="group-card__icon">
              <el-icon :size="26"><component :is="groupIcon(g.group)" /></el-icon>
            </div>
            <span class="group-card__count">{{ g.items.length }} 项</span>
          </div>

          <div class="group-card__body">
            <div class="group-card__title">{{ groupName(g.group) }}</div>
            <code class="group-card__code">{{ g.group }}</code>
            <p class="group-card__desc">{{ groupDesc(g.group) }}</p>
          </div>

          <div class="group-card__foot">
            <span class="group-card__enter">进入配置</span>
            <el-icon class="group-card__arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <el-empty v-else-if="!groupLoading" description="暂无配置项">
        <ReButton type="primary" text icon="Refresh" @click="loadAll">重新加载</ReButton>
      </el-empty>
    </div>

    <!-- ============ 分组配置详情 ============ -->
    <ReTable
      v-else
      ref="detailTableRef"
      table-id="setting-detail"
      :loader="loadDetail"
      :columns="detailColumns"
      :pagination="false"
      row-key="sysSettingId"
      :row-draggable="!isProduct"
      @row-sort="handleRowSort"
    >
      <template #toolbar>
        <ReButton text icon="ArrowLeft" @click="activeGroup = null">返回分组</ReButton>
        <span class="detail-title">
          <el-icon><component :is="groupIcon(activeGroup!)" /></el-icon>
          {{ groupName(activeGroup!) }}
        </span>
        <ReButton v-if="!isProduct" type="primary" text icon="Plus" v-admin @click="handleAdd">新增配置</ReButton>
        <ReButton type="success" text icon="Download" :loading="exporting" @click="handleSettingExport(activeGroup!)">
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

      <template #info="{ row }">
        <div class="d-info">
          <el-icon class="d-info__icon" :size="20">
            <component :is="settingIcon(row)" />
          </el-icon>
          <div class="d-info__text">
            <div class="d-info__name">
              {{ settingLabel(row) }}
              <code v-if="row.sysSettingCode" class="d-info__code">{{ row.sysSettingCode }}</code>
            </div>
            <div class="d-info__desc">{{ row.sysSettingRemark || typeLabel(row.sysSettingValueType) }}</div>
          </div>
        </div>
      </template>

      <template #value="{ row }">
        <div v-if="isSensitive(row)" class="sensitive-box">
          <code class="sensitive-box__text">{{ revealedMap[row.sysSettingId] ?? "••••••••" }}</code>
          <el-button link type="primary" size="small" @click.stop="toggleSensitive(row)">
            <el-icon><component :is="revealedMap[row.sysSettingId] ? Hide : View" /></el-icon>
          </el-button>
        </div>
        <span v-else class="value-readonly">{{ row.sysSettingValue || "—" }}</span>
      </template>

      <template #action="{ row }">
        <ReButton layout="square" type="primary" icon="Edit" v-admin @click.stop="handleEdit(row)" />
        <ReButton layout="square" type="info" icon="Clock" @click.stop="openHistory(row)" />
        <ReButton v-if="!isProduct" layout="square" type="danger" icon="Delete" v-admin @click.stop="handleDelete(row)" />
      </template>
    </ReTable>


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
      @ok="handleSubmit"
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
          <el-table :data="batchMode ? batchList : historyList" border stripe style="width: 100%" size="small">
            <el-table-column prop="sysSettingOperation" label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="(operationMap[row.sysSettingOperation ?? '']?.type ?? 'info') as never" size="small" effect="plain">
                  {{ operationMap[row.sysSettingOperation ?? '']?.label ?? row.sysSettingOperation }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sysSettingOldValue" label="变更前" minWidth="140" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="setting-old">{{ formatValue(row.sysSettingOldValue) }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="sysSettingNewValue" label="变更后" minWidth="140" show-overflow-tooltip>
              <template #default="{ row }">
                <code class="setting-new">{{ formatValue(row.sysSettingNewValue) }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="sysSettingOperatorName" label="操作人" width="100" />
            <el-table-column prop="sysSettingBatchNo" label="批次号" width="140" show-overflow-tooltip>
              <template #default="{ row }">
                <span
                  v-if="row.sysSettingBatchNo"
                  class="batch-link"
                  @click="handleRollbackBatch(row.sysSettingBatchNo!)"
                >
                  {{ row.sysSettingBatchNo }}
                </span>
                <span v-else class="setting-na">-</span>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="时间" width="170" />
            <el-table-column label="操作" width="90" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" :loading="rollbackLoading === row.sysSettingHistoryId" @click="handleRollbackSingle(row)">
                  回滚
                </el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="flex justify-end items-center mt-3 gap-2">
            <template v-if="batchMode">
              <el-button type="danger" size="small" @click="handleRollbackBatch(batchNoInput.trim())">
                整批回滚（{{ batchNoInput.trim() }}）
              </el-button>
              <span class="setting-na">共 {{ batchList.length }} 条记录</span>
            </template>
            <template v-else>
              <el-button type="warning" size="small" :disabled="!latestBatchNo" @click="handleRollbackBatch(latestBatchNo!)">
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
              <el-tag v-if="c.cost != null" size="small" effect="plain" type="info" class="m-l-auto">
                {{ c.cost }}ms
              </el-tag>
            </div>
            <div class="email-card__desc">{{ c.desc }}</div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="emailDialogVisible = false">关闭</el-button>
        <el-button type="primary" :loading="emailChecking" @click="handleEmailCheck">重新检测</el-button>
      </template>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
  height: 100%;
}

.detail-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

/* ============ 分组卡片网格 ============ */
.group-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow: auto;
}

/* 顶部卡片（与首页欢迎 / 系统配置 hero 统一为白色圆角卡片） */
.group-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-bg-color);
}
.group-topbar__lead {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.group-topbar__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  border: 1px solid var(--el-color-primary-light-8);
}
.group-topbar__title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.group-topbar__sub {
  margin: 2px 0 0;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
}
.group-topbar__right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.group-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12.5px;
  color: var(--el-text-color-regular);
  background: var(--el-fill-color-light);
  b {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--el-text-color-primary);
  }
}

.group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(264px, 1fr));
  gap: 18px;
}

.group-card {
  --card-accent: var(--el-color-primary);
  --card-accent-soft: var(--el-color-primary-light-9);
  --card-accent-border: var(--el-color-primary-light-5);
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s ease;
}
.group-card:hover {
  border-color: var(--card-accent-border);
  box-shadow: var(--el-box-shadow-light);
  transform: translateY(-3px);
}

.group-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.group-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 15px;
  color: var(--card-accent);
  background: var(--card-accent-soft);
  transition: transform 0.22s ease;
}
.group-card:hover .group-card__icon {
  transform: scale(1.07);
}
.group-card__count {
  padding: 3px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-radius: 999px;
  background: var(--el-fill-color-light);
}

.group-card__body {
  flex: 1;
  min-width: 0;
}
.group-card__title {
  font-size: 15.5px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}
.group-card__code {
  display: inline-block;
  margin-top: 5px;
  padding: 1px 7px;
  font-size: 11px;
  color: var(--el-text-color-secondary);
  border-radius: 6px;
  background: var(--el-fill-color);
}
.group-card__desc {
  display: -webkit-box;
  margin: 10px 0 0;
  overflow: hidden;
  font-size: 12.5px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.group-card__foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}
.group-card__enter {
  font-size: 13px;
  font-weight: 600;
  color: var(--card-accent);
}
.group-card__arrow {
  color: var(--card-accent);
  transition: transform 0.22s ease;
}
.group-card:hover .group-card__arrow {
  transform: translateX(4px);
}

/* 强调色映射（深浅色自适应） */
.group-card.is-primary { --card-accent: var(--el-color-primary); --card-accent-soft: var(--el-color-primary-light-9); --card-accent-border: var(--el-color-primary-light-5); }
.group-card.is-success { --card-accent: var(--el-color-success); --card-accent-soft: var(--el-color-success-light-9); --card-accent-border: var(--el-color-success-light-5); }
.group-card.is-warning { --card-accent: var(--el-color-warning); --card-accent-soft: var(--el-color-warning-light-9); --card-accent-border: var(--el-color-warning-light-5); }
.group-card.is-danger { --card-accent: var(--el-color-danger); --card-accent-soft: var(--el-color-danger-light-9); --card-accent-border: var(--el-color-danger-light-5); }
.group-card.is-info { --card-accent: var(--el-color-info); --card-accent-soft: var(--el-color-info-light-9); --card-accent-border: var(--el-color-info-light-5); }
/* ============ 详情每行 ============ */
.d-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.d-info__icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--el-color-primary);
}
.d-info__text {
  min-width: 0;
}
.d-info__name {
  font-size: 13.5px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  word-break: break-all;
}
.d-info__code {
  margin-left: 6px;
  font-size: 11px;
  font-weight: 400;
  color: var(--el-text-color-secondary);
}
.d-info__desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  word-break: break-all;
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
  word-break: break-all;
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
  font-size: 12px;
  cursor: pointer;
  color: var(--el-color-primary);
}

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
  border-radius: 10px;
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
</style>
