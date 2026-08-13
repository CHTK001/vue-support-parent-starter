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
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

const tableRef = ref();

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
  2: "已下架",
};

function handleAdd() {
  isEdit.value = false;
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
  { prop: "sysAnnouncementStatus", label: "状态", width: 80, formatter: (_row: Record<string, unknown>, _col: ReTableColumn, cellValue: unknown) => statusMap[cellValue as number] ?? "--" },
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
            <el-option label="已发布" :value="1" />
            <el-option label="已下架" :value="2" />
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
        <el-button size="small" @click="handleEdit(row as SysAnnouncement)">编辑</el-button>
        <el-button v-if="row.sysAnnouncementStatus === 0" size="small" type="primary" @click="handlePublish(row as SysAnnouncement)">发布</el-button>
        <el-button v-if="row.sysAnnouncementStatus === 1" size="small" warning @click="handleUnpublish(row as SysAnnouncement)">下架</el-button>
        <el-button size="small" type="danger" @click="handleDelete(row as SysAnnouncement)">删除</el-button>
      </template>
    </ReTable>

    <ReDialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '新增公告'" width="700px" @confirm="handleSave" :confirm-loading="saving">
      <el-form :model="form" label-width="100px" label-position="top">
        <el-form-item label="公告标题" required>
          <el-input v-model="form.sysAnnouncementTitle" placeholder="请输入公告标题" maxlength="200" />
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
              <el-input v-model="form.sysAnnouncementTargetUrl" placeholder="可选" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="过期时间">
              <el-date-picker v-model="form.sysAnnouncementExpireTime" type="datetime" placeholder="永不过期" style="width: 100%" value-format="YYYY-MM-DDTHH:mm:ss" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
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
</style>