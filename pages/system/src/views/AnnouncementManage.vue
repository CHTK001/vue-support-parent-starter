<script setup lang="ts">
/**
 * 公告管理页面
 *
 * 维护 sys_announcement 表的公告数据，支持新增/编辑/发布/下架/删除。
 * 公告类型支持全局和指定角色，位置支持默认和固定顶部。
 */
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Bell, Plus, Edit, Delete, Search, Refresh, Upload, Download } from "@element-plus/icons-vue";
import { pageForAnnouncement, saveAnnouncement, updateAnnouncement, deleteAnnouncement, publishAnnouncement, unpublishAnnouncement } from "../api/announcementApi";
import type { SysAnnouncement } from "../api/announcementApi";
import { getAnnouncementReadStat, pageForAnnouncementReadUsers } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

const query = ref<{
  page: number;
  pageSize: number;
  sysAnnouncementTitle?: string;
  sysAnnouncementStatus?: number;
  sysAnnouncementLevel?: string;
}>({
  page: 1,
  pageSize: 20,
});

async function loadAnnouncements({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForAnnouncement({
    page,
    pageSize,
    sysAnnouncementTitle: (params.sysAnnouncementTitle as string) || undefined,
    sysAnnouncementStatus: (params.sysAnnouncementStatus as number) || undefined,
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

/** 是否定时发布开关 */
const scheduledPublish = ref(false);

/* ================== 已读用户抽屉 ================== */
const readDrawerVisible = ref(false);
const readDrawerLoading = ref(false);
const readUsers = ref<Array<{ username?: string; readTime?: string }>>([]);
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
    ElMessage.error((e as Error)?.message ?? "已读用户加载失败");
  } finally {
    readDrawerLoading.value = false;
  }
}

function handleReset() {
  query.value = { page: 1, pageSize: 20 };
  tableRef.value?.reload();
}

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

/** 预览弹窗 */
const previewVisible = ref(false);
const previewData = ref<SysAnnouncement | null>(null);

function handlePreview(row: SysAnnouncement) {
  previewData.value = row;
  previewVisible.value = true;
}

function handleAdd() {
  isEdit.value = false;
  scheduledPublish.value = false;
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
  scheduledPublish.value = Boolean(row.sysAnnouncementPublishTime);
  form.value = { ...row };
  dialogVisible.value = true;
}

async function handleSave() {
  saving.value = true;
  try {
    if (isEdit.value) {
      await updateAnnouncement(form.value as SysAnnouncement);
      ElMessage.success("更新成功");
    } else {
      await saveAnnouncement(form.value as SysAnnouncement);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    tableRef.value?.reload();
  } catch (e) {
    ElMessage.error((e as Error)?.message ?? "操作失败");
  } finally {
    saving.value = false;
  }
}

async function handlePublish(row: SysAnnouncement) {
  if (!row.sysAnnouncementId) return;
  await ElMessageBox.confirm("确认发布该公告？", "提示", { type: "info" });
  await publishAnnouncement(row.sysAnnouncementId);
  ElMessage.success("已发布");
  tableRef.value?.reload();
}

async function handleUnpublish(row: SysAnnouncement) {
  if (!row.sysAnnouncementId) return;
  await ElMessageBox.confirm("确认下架该公告？", "提示", { type: "warning" });
  await unpublishAnnouncement(row.sysAnnouncementId);
  ElMessage.success("已下架");
  tableRef.value?.reload();
}

async function handleDelete(row: SysAnnouncement) {
  if (!row.sysAnnouncementId) return;
  await ElMessageBox.confirm("确认删除该公告？", "提示", { type: "warning" });
  await deleteAnnouncement(row.sysAnnouncementId);
  ElMessage.success("已删除");
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
];

onMounted(() => {
  /* 挂载后自动加载 */
});
</script>

<template>
  <div class="system-page">
    <ReTable
      ref="tableRef"
      :load="loadAnnouncements"
      :columns="columns"
      :query="query"
      row-key="sysAnnouncementId"
      stripe
    >
      <template #search>
        <el-form-item label="标题">
          <el-input v-model="query.sysAnnouncementTitle" placeholder="搜索标题" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.sysAnnouncementStatus" placeholder="全部" clearable style="width: 120px">
            <el-option label="草稿" :value="0" />
            <el-option label="待发布" :value="3" />
            <el-option label="已发布" :value="1" />
            <el-option label="已下线" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="tableRef?.reload()">
            <el-icon :size="14"><Search /></el-icon> 查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon :size="14"><Refresh /></el-icon> 重置
          </el-button>
        </el-form-item>
      </template>

      <template #actions>
        <el-button type="primary" @click="handleAdd">
          <el-icon :size="14"><Plus /></el-icon> 新增公告
        </el-button>
      </template>

      <template #default="{ row }">
        <el-button size="small" @click="handlePreview(row as SysAnnouncement)">预览</el-button>
        <el-button size="small" type="info" @click="openReadUsers(row as SysAnnouncement)">已读详情</el-button>
        <el-button size="small" @click="handleEdit(row as SysAnnouncement)">编辑</el-button>
        <el-button v-if="row.sysAnnouncementStatus === 0" size="small" type="primary" @click="handlePublish(row as SysAnnouncement)">发布</el-button>
        <el-button v-if="row.sysAnnouncementStatus === 1" size="small" warning @click="handleUnpublish(row as SysAnnouncement)">下架</el-button>
        <el-button size="small" type="danger" @click="handleDelete(row as SysAnnouncement)">删除</el-button>
      </template>
    </ReTable>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '新增公告'" width="700px" @confirm="handleSave" :confirm-loading="saving">
      <el-form :model="form" label-width="100px" label-position="top">
        <el-form-item label="公告标题" required>
          <el-input v-model="form.sysAnnouncementTitle" placeholder="请输入公告标题" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.sysAnnouncementContent" type="textarea" :rows="6" placeholder="请输入公告内容(支持HTML)" />
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="级别">
              <el-select v-model="form.sysAnnouncementLevel">
                <el-option v-for="o in levelOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="位置">
              <el-select v-model="form.sysAnnouncementPosition">
                <el-option v-for="o in positionOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="排序">
              <el-input-number v-model="form.sysAnnouncementSort" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="类型">
              <el-select v-model="form.sysAnnouncementType">
                <el-option v-for="o in typeOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="跳转链接">
              <el-input v-model="form.sysAnnouncementTargetUrl" placeholder="可选" maxlength="500" show-word-limit />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="过期时间">
              <el-date-picker v-model="form.sysAnnouncementExpireTime" type="datetime" placeholder="永不过期" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="状态">
              <el-select v-model="form.sysAnnouncementStatus">
                <el-option label="草稿" :value="0" />
                <el-option label="待发布（到点自动发布）" :value="3" />
                <el-option label="已发布" :value="1" />
                <el-option label="已下线" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="定时发布">
              <el-switch v-model="scheduledPublish" />
            </el-form-item>
            <el-form-item v-if="scheduledPublish" label="发布时间">
              <el-date-picker
                v-model="form.sysAnnouncementPublishTime"
                type="datetime"
                placeholder="选择发布时间，留空立即发布"
                style="width: 100%"
                value-format="YYYY-MM-DDTHH:mm:ss"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </ReDialog>

    <!-- 已读用户抽屉 -->
    <el-drawer v-model="readDrawerVisible" :title="readDrawerTitle" size="480px">
      <el-table v-loading="readDrawerLoading" :data="readUsers" border stripe size="small" style="width: 100%">
        <el-table-column type="index" label="#" width="60" align="center" />
        <el-table-column prop="username" label="用户名" min-width="160" show-overflow-tooltip />
        <el-table-column prop="readTime" label="阅读时间" min-width="180" />
      </el-table>
      <p v-if="!readDrawerLoading && !readUsers.length" style="margin-top: 12px; color: var(--el-text-color-secondary); font-size: 13px">暂无已读用户</p>
    </el-drawer>

    <!-- 公告预览弹窗（纯文本渲染，避免 XSS） -->
    <ReDialog v-model="previewVisible" title="公告预览" width="640px" :footer-hidden="true">
      <div v-if="previewData" class="announcement-preview">
        <h2 class="announcement-preview__title">{{ previewData.sysAnnouncementTitle || "无标题" }}</h2>
        <div class="announcement-preview__meta">
          <span>级别：{{ levelOptions.find(o => o.value === previewData.sysAnnouncementLevel)?.label ?? "-" }}</span>
          <span>状态：{{ statusMap[previewData.sysAnnouncementStatus ?? 0] ?? "-" }}</span>
          <span>发布时间：{{ previewData.sysAnnouncementPublishTime || "未发布" }}</span>
        </div>
        <div class="announcement-preview__content" v-html="previewData.sysAnnouncementContent || '（无内容）'"></div>
      </div>
    </ReDialog>
  </div>
</template>

<style scoped>
.system-page {
  padding: 16px;
}

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

.announcement-preview {
  &__title {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 12px;
  }
  &__meta {
    display: flex;
    gap: 16px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }
  &__content {
    white-space: pre-wrap;
    word-break: break-word;
    line-height: 1.7;
    font-size: 14px;
    color: var(--el-text-color-primary);
  }
}
</style>