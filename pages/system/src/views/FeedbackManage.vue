<script setup lang="ts">
/**
 * 反馈管理页 —— 用户反馈列表与处理
 *
 * 复用 ReTable（loader 模式：自动分页 / loading / 列设置持久化），
 * 搜索区用 ReSearch 外壳，处理弹窗用 ReDialog（modern 布局）。
 */
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Refresh } from "@element-plus/icons-vue";
import { pageForFeedback, issueFeedback } from "../api/systemApi";
import type { ReTableColumn, ReTableLoadParams, RePageResult } from "@repo/ui/re-table";

/** 查询条件 */
const query = ref<{ page: number; pageSize: number; sysFeedbackType?: string }>({
  page: 1,
  pageSize: 10,
});

/** 处理对话框 */
const replyDialogVisible = ref(false);
const replyForm = ref<{ sysFeedbackId?: number; sysFeedbackRecoverContent?: string }>({});
const replySaving = ref(false);

/** ReTable loader：远程分页加载 */
async function loadFeedback({ page, pageSize, params }: ReTableLoadParams): Promise<RePageResult> {
  const res = await pageForFeedback({
    page,
    pageSize,
    sysFeedbackType: (params.sysFeedbackType as string) || undefined,
  });
  return { total: res?.data?.total ?? 0, data: (res?.data?.data ?? []) as Record<string, unknown>[] };
}

/** 打开处理对话框 */
function openReply(row: Record<string, unknown>) {
  replyForm.value = {
    sysFeedbackId: row.sysFeedbackId as number,
    sysFeedbackRecoverContent: (row.sysFeedbackRecoverContent as string) ?? "",
  };
  replyDialogVisible.value = true;
}

/** 提交处理 */
async function submitReply() {
  if (!replyForm.value.sysFeedbackId) return;
  replySaving.value = true;
  try {
    const res = await issueFeedback(replyForm.value);
    if (res?.code === 200) {
      ElMessage.success("处理成功");
      replyDialogVisible.value = false;
      tableRef.value?.reload();
    } else {
      ElMessage.error(res?.msg || "处理失败");
    }
  } finally {
    replySaving.value = false;
  }
}

const tableRef = ref();

/** 列定义 */
const columns: ReTableColumn[] = [
  { prop: "sysFeedbackId", label: "ID", width: 70 },
  { prop: "sysFeedbackType", label: "类型", width: 120 },
  { prop: "sysFeedbackContent", label: "反馈内容", minWidth: 240 },
  { prop: "createName", label: "提交人", width: 120 },
  { prop: "createTime", label: "提交时间", width: 170 },
  { prop: "sysFeedbackStatus", label: "状态", width: 90, slot: "status" },
  { prop: "action", label: "操作", width: 120, slot: "action", fixed: "right", align: "center" },
];
</script>

<template>
  <div class="system-page">
    <el-card shadow="never" class="system-page__card">
      <ReSearch :is-expanded="true" :add-button="false">
        <div class="system-page__search">
          <ReInput
            layout="modern"
            v-model="query.sysFeedbackType"
            placeholder="反馈类型"
            clearable
            class="!w-44"
            @keyup.enter="tableRef?.reload()"
          />
        </div>
        <template #footer>
          <ReButton layout="modern" type="primary" icon="Search" @click="query.page = 1; tableRef?.reload()">查询</ReButton>
          <ReButton layout="modern" @click="query.sysFeedbackType = undefined; tableRef?.reload()">重置</ReButton>
          <ReButton layout="modern" icon="Refresh" @click="tableRef?.reload()">刷新</ReButton>
        </template>
      </ReSearch>

      <ReTable
        ref="tableRef"
        table-id="system-feedback"
        :loader="loadFeedback"
        :columns="columns"
        :pagination="true"
        :params="query"
        row-key="sysFeedbackId"
        v-model:page="query.page"
        v-model:page-size="query.pageSize"
        class="mt-2"
      >
        <template #status="{ row }">
          <ReTag
            layout="modern"
            :type="row.sysFeedbackStatus === 1 ? 'success' : 'warning'"
            size="small"
          >
            {{ row.sysFeedbackStatus === 1 ? "已处理" : "待处理" }}
          </ReTag>
        </template>
        <template #action="{ row }">
          <ReButton
            layout="modern"
            link
            type="primary"
            v-admin
            :disabled="row.sysFeedbackStatus === 1"
            @click="openReply(row)"
          >
            {{ row.sysFeedbackStatus === 1 ? "已处理" : "处理" }}
          </ReButton>
        </template>
      </ReTable>
    </el-card>

    <ReDialog
      v-model="replyDialogVisible"
      title="处理反馈"
      layout="modern"
      width="520"
      :close-on-click-modal="false"
      :confirm-loading="replySaving"
      @ok="submitReply"
    >
      <el-form label-width="80px">
        <el-form-item label="处理回复">
          <ReInput
            layout="modern"
            v-model="replyForm.sysFeedbackRecoverContent"
            type="textarea"
            :rows="4"
            placeholder="请输入处理回复"
          />
        </el-form-item>
      </el-form>
    </ReDialog>
  </div>
</template>
