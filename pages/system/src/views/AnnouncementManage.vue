<script setup lang="ts">
/**
 * 公告管理页面
 *
 * 维护 sys_announcement 表的公告数据，支持新增/编辑/发布/下架/删除。
 * 公告类型支持全局和指定角色，位置支持默认和固定顶部。
 */
import { message } from "@repo/core";
import { computed, onMounted, ref } from "vue";
import { ElMessageBox } from "element-plus";
import { ArrowRight, BellFilled, Clock } from "@element-plus/icons-vue";
import { pageForAnnouncement, saveAnnouncement, updateAnnouncement, deleteAnnouncement, publishAnnouncement, unpublishAnnouncement } from "../api/announcementApi";
import type { SysAnnouncement } from "../api/announcementApi";
import { getAnnouncementReadStat, pageForAnnouncementReadUsers, listForRole } from "../api/systemApi";
import type { SysRole } from "../api/types";
import ReTable from "@repo/ui/re-table";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const query = ref<{
  page: number;
  pageSize: number;
  sysAnnouncementTitle?: string;
  sysAnnouncementStatus?: number;
  sysAnnouncementLevel?: string;
}>({
  page: 1,
  pageSize: 10,
});

async function loadAnnouncements({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForAnnouncement({
    page,
    pageSize,
    sysAnnouncementTitle: (params.sysAnnouncementTitle as string) || undefined,
    sysAnnouncementStatus:
      params.sysAnnouncementStatus === "" || params.sysAnnouncementStatus === undefined
        ? undefined
        : (params.sysAnnouncementStatus as number),
    sysAnnouncementLevel: (params.sysAnnouncementLevel as string) || undefined,
  });
  const rows = (res?.data?.data ?? []) as Record<string, unknown>[];
  // 异步加载每条公告的已读统计
  rows.forEach((row) => {
    const id = row.sysAnnouncementId as number;
    if (!id) return;
    getAnnouncementReadStat(id)
      .then((res) => {
        readStatMap.value[id] = { readCount: res?.data?.readCount ?? 0, unreadCount: res?.data?.unreadCount ?? 0 };
      })
      .catch(() => {});
  });
  return { total: res?.data?.total ?? 0, data: rows };
}

const tableRef = ref();

/** 已读统计缓存：id -> { readCount, unreadCount } */
const readStatMap = ref<Record<number, { readCount: number; unreadCount: number }>>({});

/** 角色选项（用于「指定角色」定向） */
const roleOptions = ref<SysRole[]>([]);
/**
 * SysRole 字段全为可选，sysRoleId? 直接作为 el-option 的 value 会类型不匹配，
 * 值为 undefined 的选项也无法回显。这里只保留有 ID 的角色并把 id 收窄为必填。
 */
const selectableRoles = computed(
  (): (SysRole & { sysRoleId: number })[] =>
    roleOptions.value.filter((r): r is SysRole & { sysRoleId: number } => r.sysRoleId != null),
);
/** 编辑表单中选中的目标角色ID列表 */
const targetRoleIds = ref<number[]>([]);

/** 加载角色选项 */
async function loadRoles() {
  try {
    const res = await listForRole();
    roleOptions.value = res?.data ?? [];
  } catch {
    roleOptions.value = [];
  }
}

/** 解析后端存储的目标角色 JSON（形如 "[1,2]"），容错逗号分隔字符串 */
function parseTargetRoles(raw?: string): number[] {
  if (!raw) return [];
  const text = String(raw).trim();
  if (!text) return [];
  try {
    const arr = JSON.parse(text);
    if (Array.isArray(arr)) return arr.map(Number).filter((n) => !Number.isNaN(n));
  } catch {
    /* fall through to comma split */
  }
  return text.split(/[,，]/).map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n));
}

/* ================== 已读用户抽屉 ================== */
const readDrawerVisible = ref(false);
const readDrawerLoading = ref(false);
const readUsers = ref<Array<{ sysUserName?: string; readTime?: string }>>([]);
const readDrawerTitle = ref("");

/** 已读用户列表 */
async function openReadUsers(row: SysAnnouncement) {
  readDrawerTitle.value = `已读用户 - ${row.sysAnnouncementTitle ?? ""}`;
  readDrawerVisible.value = true;
  readDrawerLoading.value = true;
  readUsers.value = [];
  try {
    const res = await pageForAnnouncementReadUsers({
      announcementId: row.sysAnnouncementId as number,
      page: 1,
      pageSize: 200,
    });
    readUsers.value = ((res?.data?.data ?? res?.data?.rows ?? []) ?? []) as Array<{ username?: string; readTime?: string }>;
  } catch (e) {
    message.error((e as Error)?.message ?? "已读用户加载失败");
  } finally {
    readDrawerLoading.value = false;
  }
}

function handleReset() {
  query.value = { page: 1, pageSize: 10 };
  tableRef.value?.reload();
}

/** 内置搜索区字段 */
const searchFilters = computed(() => [
  { key: 'sysAnnouncementTitle', label: '标题', type: 'input' as const, placeholder: '搜索标题' },
  {
    key: 'sysAnnouncementStatus', label: '状态', type: 'select' as const, placeholder: '全部',
    options: [
      { label: '草稿', value: 0 },
      { label: '待发布', value: 3 },
      { label: '已发布', value: 1 },
      { label: '已下线', value: 2 },
    ],
  },
  {
    key: 'sysAnnouncementLevel', label: '级别', type: 'select' as const, placeholder: '全部',
    options: levelOptions,
  },
]);

const dialogVisible = ref(false);
const saving = ref(false);
const isEdit = ref(false);
const form = ref<SysAnnouncement>({});

const levelOptions = [
  { value: "info", label: "信息" },
  { value: "warning", label: "警告" },
  { value: "important", label: "重要" },
  { value: "emergency", label: "紧急" },
];

const positionOptions = [
  { value: "default", label: "默认(Tabs下方)" },
  { value: "fixed-top", label: "固定顶部" },
];

const typeOptions = [
  { value: "global", label: "全局" },
  { value: "role", label: "指定角色" },
];

const statusMap: Record<number, string> = {
  0: "草稿",
  1: "已发布",
  2: "已下线",
  3: "待发布",
};

/** 编辑弹窗中状态标签的配色（状态仅由发布/下架动作驱动，故只读展示） */
function statusTagType(status?: number): "success" | "warning" | "info" {
  if (status === 1) return "success";
  if (status === 3) return "warning";
  return "info";
}

/** 预览弹窗内级别标签配色 */
function levelTagType(level?: string): "primary" | "warning" | "danger" {
  if (level === "warning") return "warning";
  if (level === "important" || level === "emergency") return "danger";
  return "primary";
}

/** 级别文案 */
function levelLabel(level?: string): string {
  return levelOptions.find((o) => o.value === level)?.label ?? "-";
}

/** 位置文案 */
function positionLabel(pos?: string): string {
  return positionOptions.find((o) => o.value === pos)?.label ?? "-";
}

/** 类型文案 */
function typeLabel(type?: string): string {
  return typeOptions.find((o) => o.value === type)?.label ?? "-";
}

/** 预览弹窗 */
const previewVisible = ref(false);
const previewData = ref<SysAnnouncement | null>(null);
/** 「查看详情」展开的附加信息 */
const previewDetailExpanded = ref(false);

function handlePreview(row: SysAnnouncement) {
  previewData.value = row;
  previewDetailExpanded.value = false;
  previewVisible.value = true;
}

function handleAdd() {
  isEdit.value = false;
  targetRoleIds.value = [];
  form.value = {
    sysAnnouncementLevel: "info",
    sysAnnouncementPosition: "default",
    sysAnnouncementType: "global",
    sysAnnouncementSort: 0,
  };
  dialogVisible.value = true;
}

async function handleEdit(row: SysAnnouncement) {
  isEdit.value = true;
  targetRoleIds.value = parseTargetRoles(row.sysAnnouncementTargetRoles);
  form.value = { ...row };
  dialogVisible.value = true;
}

async function handleSave() {
  // 基础校验
  const title = (form.value.sysAnnouncementTitle ?? "").trim();
  if (!title) {
    message.warning("请输入公告标题");
    return;
  }
  if (form.value.sysAnnouncementType === "role" && !targetRoleIds.value.length) {
    message.warning("指定角色时请至少选择一个目标角色");
    return;
  }
  // 序列化目标角色：指定角色且有选择时写 JSON 数组，否则置空
  if (form.value.sysAnnouncementType === "role" && targetRoleIds.value.length) {
    form.value.sysAnnouncementTargetRoles = JSON.stringify(targetRoleIds.value);
  } else if (form.value.sysAnnouncementType === "global") {
    form.value.sysAnnouncementTargetRoles = undefined;
  }
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateAnnouncement(form.value as SysAnnouncement);
      message.success("更新成功");
    } else {
      await saveAnnouncement(form.value as SysAnnouncement);
      message.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    message.error((e as Error)?.message ?? "操作失败");
  } finally {
    saving.value = false;
  }
}

async function handlePublish(row: SysAnnouncement) {
  if (!row.sysAnnouncementId) return;
  await ElMessageBox.confirm("确认发布该公告？", "提示", { type: "info" });
  await publishAnnouncement(row.sysAnnouncementId);
  message.success("已发布");
  tableRef.value?.reload();
}

async function handleUnpublish(row: SysAnnouncement) {
  if (!row.sysAnnouncementId) return;
  await ElMessageBox.confirm("确认下架该公告？", "提示", { type: "warning" });
  await unpublishAnnouncement(row.sysAnnouncementId);
  message.success("已下架");
  tableRef.value?.reload();
}

async function handleDelete(row: SysAnnouncement) {
  if (!row.sysAnnouncementId) return;
  await ElMessageBox.confirm("确认删除该公告？", "提示", { type: "warning" });
  await deleteAnnouncement(row.sysAnnouncementId);
  message.success("已删除");
  tableRef.value?.reload();
}

const levelColors: Record<string, string> = {
  info: "var(--el-color-primary)",
  warning: "var(--el-color-warning)",
  important: "var(--el-color-danger)",
  emergency: "var(--el-color-error)",
};

const columns: ReTableColumn[] = [
  { prop: "sysAnnouncementTitle", label: "标题", minWidth: 200 },
  { prop: "sysAnnouncementLevel", label: "级别", width: 80, formatter: (_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown) => levelOptions.find(o => o.value === cellValue)?.label ?? String(cellValue ?? "") },
  { prop: "sysAnnouncementPosition", label: "位置", width: 120, formatter: (_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown) => positionOptions.find(o => o.value === cellValue)?.label ?? String(cellValue ?? "") },
  { prop: "sysAnnouncementType", label: "类型", width: 80, formatter: (_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown) => typeOptions.find(o => o.value === cellValue)?.label ?? String(cellValue ?? "") },
  { prop: "sysAnnouncementStatus", label: "状态", width: 90, formatter: (_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown) => statusMap[cellValue as number] ?? "--" },
  { prop: "readStat", label: "已读/未读", width: 120, align: "center", formatter: (row: Record<string, unknown>) => {
    const st = readStatMap.value[(row.sysAnnouncementId as number)];
    return st ? `已读 ${st.readCount} / 未读 ${st.unreadCount}` : "-";
  } },
  { prop: "sysAnnouncementSort", label: "排序", width: 60 },
  { prop: "sysAnnouncementPublishTime", label: "发布时间", width: 160 },
  { prop: "sysAnnouncementExpireTime", label: "过期时间", width: 160 },
  { prop: "sysAnnouncementPublisherName", label: "发布人", width: 100 },
  { prop: "action", label: "操作", slot: "action", fixed: "right", width: 240, align: "center" },
];

/**
 * 已读用户抽屉里的表格列（原模板里的 3 个 el-table-column 收敛到这里）。
 *
 * <p>序号列（原 {@code type="index"} label="#" width="60}）由 ReTable 的
 * {@code show-index} 提供，不进列数组；标题均为字面量，用普通常量即可。</p>
 */
const readUserColumns: ReTableColumn[] = [
  { prop: "sysUserName", label: "用户名", minWidth: 160, showOverflowTooltip: true },
  { prop: "readTime", label: "阅读时间", minWidth: 180 },
];

onMounted(() => {
  /* 挂载后加载角色选项（供指定角色定向使用）与公告数据 */
  loadRoles();
});
</script>

<template>
  <div class="system-page">
    <ReTable
      ref="tableRef"
      table-id="system-announcement"
      :loader="loadAnnouncements"
      :columns="columns"
      :pagination="true"
      :layout-table="{ minHeight: 0 }"
      :params="{}"
      row-key="sysAnnouncementId"
      v-model:page="query.page"
      v-model:page-size="query.pageSize"
      :search="{ filters: searchFilters, title: '搜索', btnMode: 'text' }"
      :search-gap="16"
      v-model:search-model="query"
      @search-reset="handleReset"
    >

      <template #toolbar>
        <!-- C：去掉 text 改为实心主色按钮，文案点明实体「公告」 -->
        <ReButton type="primary" icon="Plus" @click="handleAdd">新增公告</ReButton>
      </template>

      <!-- A：可操作空态。ReTable 未提供 #empty 时会回落到原生 el-empty，这里提供时接管 -->
      <template #empty>
        <div class="page-empty">
          <span class="page-empty__icon">
            <ReIcon name="Bell" size="22" />
          </span>
          <span class="page-empty__title">还没有公告</span>
          <span class="page-empty__desc">公告是发布给全体用户或指定角色的通知，支持定时发布与已读统计。</span>
          <span class="page-empty__actions">
            <ReButton type="primary" icon="Plus" @click="handleAdd">新增公告</ReButton>
            <!-- 复用已有 handleReset（清空筛选 + 回到第一页重新拉取），不新增函数 -->
            <ReButton icon="Refresh" @click="handleReset">重置筛选</ReButton>
          </span>
        </div>
      </template>

      <template #action="{ row }">
        <ReButton layout="square" icon="View" type="primary" tip="预览" @click="handlePreview(row as SysAnnouncement)" />
        <ReButton layout="square" icon="DataAnalysis" type="info" tip="已读详情" @click="openReadUsers(row as SysAnnouncement)" />
        <ReButton layout="square" icon="Edit" type="primary" tip="编辑" v-admin @click="handleEdit(row as SysAnnouncement)" />
        <ReButton v-if="row.sysAnnouncementStatus === 0" layout="square" icon="Promotion" type="success" tip="发布" v-admin @click="handlePublish(row as SysAnnouncement)" />
        <ReButton v-if="row.sysAnnouncementStatus === 1" layout="square" icon="Download" type="warning" tip="下架" v-admin @click="handleUnpublish(row as SysAnnouncement)" />
        <ReButton layout="square" icon="Delete" type="danger" tip="删除" v-admin @click="handleDelete(row as SysAnnouncement)" />
      </template>
    </ReTable>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '新增公告'" width="700px" :footer-hidden="false" @confirm="handleSave" :confirm-loading="saving">
      <el-form :model="form" label-position="top" class="ann-form">
        <!-- 编辑时：只读展示当前状态（状态由 发布/下架 动作控制） -->
        <div v-if="isEdit" class="ann-form__status">
          <span class="ann-form__status-label">当前状态</span>
          <!-- B：发布状态统一 plain + dot（已发布=success / 待发布=warning / 草稿·已下线=info） -->
          <ReTag :type="statusTagType(form.sysAnnouncementStatus)" effect="plain" dot>
            {{ statusMap[form.sysAnnouncementStatus ?? 0] }}
          </ReTag>
        </div>

        <!-- 分组：公告内容 -->
        <section class="ann-form__section">
          <h4 class="ann-form__section-title">公告内容</h4>
          <el-form-item label="公告标题" required>
            <el-input
              v-model="form.sysAnnouncementTitle"
              placeholder="请输入公告标题"
              maxlength="200"
              show-word-limit
            />
          </el-form-item>
          <el-form-item label="公告内容">
            <el-input
              v-model="form.sysAnnouncementContent"
              type="textarea"
              :rows="5"
              placeholder="请输入公告内容（支持 HTML）"
            />
          </el-form-item>
        </section>

        <!-- 分组：展示与时效 -->
        <section class="ann-form__section">
          <h4 class="ann-form__section-title">展示与时效</h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="级别">
                <el-select v-model="form.sysAnnouncementLevel" style="width: 100%">
                  <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="展示位置">
                <el-select v-model="form.sysAnnouncementPosition" style="width: 100%">
                  <el-option v-for="o in positionOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="排序">
                <el-input-number
                  v-model="form.sysAnnouncementSort"
                  :min="0"
                  controls-position="right"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="过期时间">
                <el-date-picker
                  v-model="form.sysAnnouncementExpireTime"
                  type="datetime"
                  placeholder="永不过期"
                  style="width: 100%"
                  value-format="YYYY-MM-DDTHH:mm:ss"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </section>

        <!-- 分组：可见范围与跳转 -->
        <section class="ann-form__section">
          <h4 class="ann-form__section-title">可见范围与跳转</h4>
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="可见类型">
                <el-select v-model="form.sysAnnouncementType" style="width: 100%">
                  <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="跳转链接">
                <el-input
                  v-model="form.sysAnnouncementTargetUrl"
                  placeholder="可选，点击标题跳转"
                  maxlength="500"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item v-if="form.sysAnnouncementType === 'role'" label="目标角色" required>
            <el-select
              v-model="targetRoleIds"
              multiple
              collapse-tags
              collapse-tags-tooltip
              placeholder="选择可见该公告的角色"
              style="width: 100%"
            >
              <el-option
                v-for="r in selectableRoles"
                :key="r.sysRoleId"
                :label="r.sysRoleName || r.sysRoleCode"
                :value="r.sysRoleId"
              />
            </el-select>
          </el-form-item>
        </section>

        <!-- 分组：发布设置（仅草稿可设置定时发布） -->
        <section v-if="!isEdit || form.sysAnnouncementStatus === 0" class="ann-form__section">
          <h4 class="ann-form__section-title">发布设置</h4>
          <el-form-item label="定时发布时间">
            <el-date-picker
              v-model="form.sysAnnouncementPublishTime"
              type="datetime"
              placeholder="留空则保存为草稿，需手动发布"
              style="width: 100%"
              value-format="YYYY-MM-DDTHH:mm:ss"
            />
            <p class="ann-form__hint">选择未来时间后，系统将在该时间自动发布；留空则仅保存为草稿。</p>
          </el-form-item>
        </section>
      </el-form>
    </ReDialog>

    <!-- 已读用户抽屉 -->
    <el-drawer v-model="readDrawerVisible" :title="readDrawerTitle" size="480px">
      <!-- 表格统一 ReTable（替换裸 el-table）：engine="element" 沿用原 el-table 的 DOM 与
           边框/斑马纹样式；pagination=false / toolbar=false —— 无分页、不新增工具栏按钮；
           原 el-table 的 border 走 ReTable 默认（border: true），stripe 走同名 prop；
           type="index" 列换成 show-index（表头 # / 宽 60 / 居中与 ReTable 默认一致）。 -->
      <ReTable
        :loading="readDrawerLoading"
        :data="readUsers"
        :columns="readUserColumns"
        engine="element"
        :pagination="false"
        :toolbar="false"
        :layout-table="{ minHeight: 0 }"
        stripe
        show-index
        style="width: 100%"
      />
      <p v-if="!readDrawerLoading && !readUsers.length" style="margin-top: 12px; color: var(--el-text-color-secondary); font-size: 13px">暂无已读用户</p>
    </el-drawer>

    <!-- 公告预览弹窗（参考 UI 图；纯文本渲染，避免 XSS） -->
    <ReDialog
      v-model="previewVisible"
      class="ann-preview-dialog"
      width="640px"
      headless
      :show-footer="false"
      :footer-hidden="true"
    >
      <div v-if="previewData" class="ann-preview">
        <!-- 头部：圆形图标 + 标题 -->
        <header class="ann-preview__header">
          <span class="ann-preview__icon">
            <el-icon :size="22"><BellFilled /></el-icon>
          </span>
          <h3 class="ann-preview__heading">公告预览</h3>
        </header>

        <!-- 公告标题 -->
        <h2 class="ann-preview__title">{{ previewData.sysAnnouncementTitle || "无标题" }}</h2>

        <!-- 级别 / 状态 / 发布时间 -->
        <div class="ann-preview__meta">
          <div class="ann-preview__tags">
            <!-- B：级别是紧急度状态、发布状态也是状态，两者统一补 dot（round / type 保持原样） -->
            <ReTag
              round
              effect="plain"
              dot
              :type="levelTagType(previewData.sysAnnouncementLevel)"
            >
              {{ levelLabel(previewData.sysAnnouncementLevel) }}
            </ReTag>
            <ReTag
              round
              effect="plain"
              dot
              :type="statusTagType(previewData.sysAnnouncementStatus)"
            >
              {{ statusMap[previewData.sysAnnouncementStatus ?? 0] ?? "-" }}
            </ReTag>
          </div>
          <span class="ann-preview__time">
            <el-icon><Clock /></el-icon>
            {{ previewData.sysAnnouncementPublishTime || "未发布" }}
          </span>
        </div>

        <div class="ann-preview__divider"></div>

        <!-- 正文 -->
        <div
          class="ann-preview__content"
          v-html="previewData.sysAnnouncementContent || '（无内容）'"
        ></div>

        <!-- 附加信息（「查看详情」展开） -->
        <dl v-if="previewDetailExpanded" class="ann-preview__details">
          <div class="ann-preview__detail">
            <dt>位置</dt>
            <dd>{{ positionLabel(previewData.sysAnnouncementPosition) }}</dd>
          </div>
          <div class="ann-preview__detail">
            <dt>类型</dt>
            <dd>{{ typeLabel(previewData.sysAnnouncementType) }}</dd>
          </div>
          <div class="ann-preview__detail">
            <dt>发布人</dt>
            <dd>{{ previewData.sysAnnouncementPublisherName || "-" }}</dd>
          </div>
          <div class="ann-preview__detail">
            <dt>过期时间</dt>
            <dd>{{ previewData.sysAnnouncementExpireTime || "-" }}</dd>
          </div>
        </dl>

        <!-- 底部操作 -->
        <footer class="ann-preview__footer">
          <button
            type="button"
            class="ann-preview__link"
            @click="previewDetailExpanded = !previewDetailExpanded"
          >
            <span>查看详情</span>
            <el-icon><ArrowRight /></el-icon>
          </button>
          <div class="ann-preview__actions">
            <ReButton class="ann-preview__btn-ghost" @click="previewVisible = false">关闭</ReButton>
            <ReButton
              type="primary"
              class="ann-preview__btn-primary"
              @click="previewVisible = false"
            >
              知道了
            </ReButton>
          </div>
        </footer>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped lang="scss">
.system-page {
  padding: 0;
}

/* ReTable 的卡片外壳（1px 描边 / 卡片圆角 / 卡片投影 / focus-within 转主色）
   已由插件自身提供，本页不再覆盖，换模块无需重写：
   见 packages/ui ReTable/shared/table-vars.css 与 ReTable.vue 的
   `.re-table` / `.re-table--separated` 规则。 */

.system-page__header {
  margin-bottom: 16px;
}

.system-page__title-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.system-page__title {
  font-size: 18px;
  font-weight: 700;
}

.system-page__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.ann-form {
  &__status {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 12px;
    margin-bottom: 18px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--el-radius-sm, 6px);
  }
  &__status-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }
  &__section {
    padding: 0;
  }
  &__section + &__section {
    margin-top: 6px;
    padding-top: 18px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
  &__section-title {
    display: flex;
    align-items: center;
    margin: 0 0 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-regular);
    /* 3px 宽的竖条：圆角走 full 令牌，视觉上被自身宽度夹住仍是小圆头 */
    &::before {
      content: "";
      display: inline-block;
      width: 3px;
      height: 13px;
      margin-right: 8px;
      border-radius: var(--el-radius-full, 9999px);
      background: var(--el-color-primary);
    }
  }
  &__hint {
    margin: 6px 0 0;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-secondary);
  }
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }
  :deep(.el-form-item:last-child) {
    margin-bottom: 0;
  }
}

/* ==================== 公告预览弹窗 ==================== */
.ann-preview {
  padding: 22px 24px 20px;
}

.ann-preview__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-right: 44px; /* 给右上角关闭圆钮留位 */
}

.ann-preview__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 42px;
  height: 42px;
  border-radius: var(--el-radius-full, 9999px);
  color: var(--el-color-white);
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    var(--el-color-primary-light-3)
  );
  box-shadow: 0 6px 14px color-mix(in srgb, var(--el-color-primary) 26%, transparent);
}

.ann-preview__heading {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.ann-preview__title {
  margin: 18px 0 16px;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.45;
  text-align: center;
  color: var(--el-text-color-primary);
}

.ann-preview__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.ann-preview__tags {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.ann-preview__time {
  display: inline-flex;
  align-items: center;
  flex: none;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.ann-preview__divider {
  height: 1px;
  margin-bottom: 16px;
  background: var(--el-border-color-lighter);
}

.ann-preview__content {
  padding: 18px;
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-color-primary-light-9);
  font-size: 14px;
  line-height: 1.8;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  word-break: break-word;
}

.ann-preview__details {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 16px;
  margin: 16px 0 0;
  padding: 14px 16px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: var(--el-radius-lg, 12px);
  background: var(--el-fill-color-light);
}

.ann-preview__detail {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.ann-preview__detail dt {
  flex: none;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.ann-preview__detail dd {
  margin: 0;
  overflow: hidden;
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ann-preview__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.ann-preview__link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-weight: 500;
  color: var(--el-color-primary);
  cursor: pointer;
  border-radius: var(--el-radius-xs, 4px);
  transition: color var(--el-transition-duration-fast, 0.2s) ease;
}

.ann-preview__link:hover {
  color: var(--el-color-primary-dark-2);
}

/* E：这是原生 button（可 Tab 聚焦），但浏览器默认焦点环被 reset 掉了，
   补一个与全局一致的主色焦点环，否则键盘用户看不到焦点位置 */
.ann-preview__link:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--el-color-primary) 12%, transparent);
}

.ann-preview__actions {
  display: inline-flex;
  gap: 10px;
}

.ann-preview__actions :deep(.ann-preview__btn-ghost) {
  height: 36px;
  padding: 0 22px;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
}

.ann-preview__actions :deep(.ann-preview__btn-primary) {
  height: 36px;
  padding: 0 22px;
  border: none;
  border-radius: var(--el-radius-full, 9999px);
  font-weight: 600;
  background: linear-gradient(
    135deg,
    var(--el-color-primary),
    color-mix(in srgb, var(--el-color-primary) 55%, var(--el-color-info))
  );
  box-shadow: 0 4px 12px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
}

.ann-preview__actions :deep(.ann-preview__btn-primary:hover) {
  background: linear-gradient(
    135deg,
    var(--el-color-primary-light-3),
    var(--el-color-primary)
  );
}

@media (max-width: 640px) {
  .ann-preview__meta {
    flex-direction: column;
    align-items: flex-start;
  }
  .ann-preview__details {
    grid-template-columns: 1fr;
  }
}

/* 尊重系统「减少动态效果」偏好：本文件内自己的过渡统一关掉
   （ReTable 的过渡由插件自带的同名媒体查询处理，不再在此代管） */
@media (prefers-reduced-motion: reduce) {
  .ann-preview__link {
    transition: none;
  }
}
</style>

<!-- 预览弹窗为 headless（teleport 到 body），弹窗外壳样式需非 scoped -->
<style>
.ann-preview-dialog {
  position: relative;
  overflow: hidden;
  border-radius: var(--el-dialog-border-radius, var(--el-radius-xl, 16px));
}
</style>

