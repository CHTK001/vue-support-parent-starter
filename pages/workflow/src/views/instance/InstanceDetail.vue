<template>
  <PmPageShell page-class="workflow-detail-page">
    <PmSurface title="流程详情" :description="`实例 #${instId}`">
      <template #actions>
        <ScButton @click="goBack">
          <IconifyIconOnline icon="ri:arrow-left-line" style="margin-right: 4px" />返回
        </ScButton>
      </template>
    </PmSurface>

    <el-row :gutter="16" v-if="detail">
      <!-- 左侧：详情信息 -->
      <el-col :span="14">
        <PmPanel title="基本信息">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="标题" :span="2">
              {{ detail.instTitle }}
            </el-descriptions-item>
            <el-descriptions-item label="流程名称">
              {{ detail.wfDefName || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="发起人">
              {{ detail.createName || `#${detail.starterId}` }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="statusTag" effect="plain">{{ statusText }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ detail.createTime || "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="完成时间">
              {{ detail.finishTime || "-" }}
            </el-descriptions-item>
          </el-descriptions>
        </PmPanel>

        <!-- 当前任务列表 -->
        <PmPanel title="当前待办" v-if="currentTasks.length > 0" style="margin-top: 12px">
          <el-table :data="currentTasks" border stripe size="small">
            <el-table-column prop="nodeName" label="节点" width="150" />
            <el-table-column prop="assigneeName" label="处理人" width="150">
              <template #default="{ row }">
                {{ row.assigneeName || `#${row.assigneeId}` }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.taskStatus === 'PENDING' ? 'warning' : 'success'" effect="plain" size="small">
                  {{ row.taskStatus === 'PENDING' ? '待处理' : row.taskStatus }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="收到时间" width="180">
              <template #default="{ row }">
                {{ row.createTime || "-" }}
              </template>
            </el-table-column>
          </el-table>
        </PmPanel>

        <!-- 流转历史 -->
        <PmPanel title="流转记录" style="margin-top: 12px">
          <div v-if="histories.length === 0" style="padding: 24px; text-align: center; color: var(--el-text-color-secondary)">
            暂无记录
          </div>
          <el-timeline v-else>
            <el-timeline-item
              v-for="h in histories"
              :key="h.wfTaskHistoryId"
              :timestamp="h.createTime || ''"
              :type="historyTimelineType(h.operation)"
              placement="top"
            >
              <div class="history-item">
                <strong>{{ h.operatorName || `#${h.operatorId}` }}</strong>
                <el-tag :type="historyTagType(h.operation)" effect="plain" size="small" style="margin: 0 8px">
                  {{ historyLabel(h.operation) }}
                </el-tag>
                <span v-if="h.comment" class="history-comment">: {{ h.comment }}</span>
                <span v-if="h.durationSeconds" class="history-duration">
                  (耗时 {{ formatDuration(h.durationSeconds) }})
                </span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </PmPanel>
      </el-col>

      <!-- 右侧：审批操作 -->
      <el-col :span="10">
        <PmPanel title="审批处理" v-if="hasPendingTasks">
          <ScForm label-position="top" size="small">
            <ScFormItem label="审批意见">
              <el-input
                v-model="approvalForm.comment"
                type="textarea"
                :rows="3"
                placeholder="请输入审批意见（可选）"
              />
            </ScFormItem>

            <!-- 转交 -->
            <template v-if="approvalAction === 'transfer'">
              <ScFormItem label="转交用户ID">
                <el-input v-model="approvalForm.transferUserId" placeholder="目标用户ID" type="number" />
              </ScFormItem>
              <ScFormItem label="转交用户名">
                <el-input v-model="approvalForm.transferUserName" placeholder="目标用户名" />
              </ScFormItem>
            </template>

            <ScFormItem>
              <el-space wrap>
                <ScButton type="success" :loading="processing" @click="doApprove">
                  <IconifyIconOnline icon="ri:check-line" style="margin-right: 4px" />通过
                </ScButton>
                <ScButton type="danger" :loading="processing" @click="doReject">
                  <IconifyIconOnline icon="ri:close-line" style="margin-right: 4px" />驳回
                </ScButton>
                <ScButton type="warning" :loading="processing" @click="doReturn">
                  <IconifyIconOnline icon="ri:arrow-go-back-line" style="margin-right: 4px" />退回
                </ScButton>
                <ScButton v-if="approvalAction !== 'transfer'" :loading="processing" @click="toggleTransfer">
                  <IconifyIconOnline icon="ri:share-forward-line" style="margin-right: 4px" />转交
                </ScButton>
                <ScButton v-else type="primary" :loading="processing" @click="doTransfer">
                  <IconifyIconOnline icon="ri:share-forward-line" style="margin-right: 4px" />确认转交
                </ScButton>
                <ScButton v-if="approvalAction === 'transfer'" :loading="processing" @click="toggleTransfer">
                  取消
                </ScButton>
              </el-space>
            </ScFormItem>
          </ScForm>
        </PmPanel>

        <!-- 表单数据 -->
        <PmPanel title="表单数据" style="margin-top: 12px" v-if="detail.formData">
          <pre class="form-data-json">{{ formatJson(detail.formData) }}</pre>
        </PmPanel>

        <!-- 所有任务列表 -->
        <PmPanel title="审批记录" style="margin-top: 12px">
          <el-table :data="allTasks" border stripe size="small" v-if="allTasks.length > 0">
            <el-table-column prop="nodeName" label="节点" width="120" />
            <el-table-column prop="assigneeName" label="处理人" width="120">
              <template #default="{ row }">
                {{ row.assigneeName || `#${row.assigneeId}` }}
              </template>
            </el-table-column>
            <el-table-column label="结果" width="100">
              <template #default="{ row }">
                <el-tag :type="taskStatusTag(row.taskStatus)" effect="plain" size="small">
                  {{ taskStatusLabel(row.taskStatus) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
          <div v-else style="padding: 16px; text-align: center; color: var(--el-text-color-secondary)">
            暂无审批记录
          </div>
        </PmPanel>
      </el-col>
    </el-row>

    <!-- 加载中 -->
    <div v-if="!detail && !loadingError" class="loading-state">
      <el-skeleton :rows="6" animated />
    </div>

    <!-- 错误 -->
    <div v-if="loadingError" class="error-state">
      <el-result icon="error" title="加载失败" :sub-title="loadingError">
        <template #extra>
          <ScButton type="primary" @click="loadDetail">重新加载</ScButton>
        </template>
      </el-result>
    </div>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { fetchInstDetail } from "../../api/instance";
import { approveTask, rejectTask, returnTask, transferTask } from "../../api/task";
import type { WfInstVO, WfTask, WfTaskHistory } from "../../types";

const route = useRoute();
const router = useRouter();

const instId = computed(() => Number(route.params.instId));
const detail = ref<WfInstVO | null>(null);
const loadingError = ref("");

// 审批表单
const processing = ref(false);
const approvalAction = ref<"normal" | "transfer">("normal");
const approvalForm = ref({
  comment: "",
  transferUserId: undefined as number | undefined,
  transferUserName: "",
});

// ==================== 计算属性 ====================
const statusTag = computed(() => {
  const map: Record<string, string> = {
    DRAFT: "info", PENDING: "warning", APPROVED: "success",
    REJECTED: "danger", WITHDRAWN: "info",
  };
  return map[detail.value?.instStatus || ""] || "info";
});

const statusText = computed(() => {
  const map: Record<string, string> = {
    DRAFT: "草稿", PENDING: "审批中", APPROVED: "已通过",
    REJECTED: "已驳回", WITHDRAWN: "已撤销",
  };
  return map[detail.value?.instStatus || ""] || detail.value?.instStatus || "";
});

const currentTasks = computed<WfTask[]>(() => {
  return detail.value?.currentTasks || [];
});

const hasPendingTasks = computed(() => {
  return currentTasks.value.some((t) => t.taskStatus === "PENDING");
});

const allTasks = computed<WfTask[]>(() => {
  return detail.value?.tasks || [];
});

const histories = computed<WfTaskHistory[]>(() => {
  return detail.value?.histories || [];
});

// ==================== 辅助 ====================
function historyTimelineType(op?: string): string {
  const map: Record<string, string> = {
    SUBMIT: "primary", APPROVE: "success", REJECT: "danger",
    RETURN: "warning", WITHDRAW: "info", TRANSFER: "primary",
  };
  return map[op || ""] || "info";
}

function historyTagType(op?: string): string {
  const map: Record<string, string> = {
    SUBMIT: "primary", APPROVE: "success", REJECT: "danger",
    RETURN: "warning", WITHDRAW: "info", TRANSFER: "primary",
  };
  return map[op || ""] || "info";
}

function historyLabel(op?: string): string {
  const map: Record<string, string> = {
    SUBMIT: "提交", APPROVE: "通过", REJECT: "驳回",
    RETURN: "退回", WITHDRAW: "撤销", TRANSFER: "转交",
  };
  return map[op || ""] || op || "";
}

function taskStatusTag(status?: string): string {
  const map: Record<string, string> = {
    PENDING: "warning", APPROVED: "success", REJECTED: "danger",
    RETURNED: "warning", TRANSFERRED: "primary", CANCELLED: "info",
  };
  return map[status || ""] || "info";
}

function taskStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    PENDING: "待处理", APPROVED: "已通过", REJECTED: "已驳回",
    RETURNED: "已退回", TRANSFERRED: "已转交", CANCELLED: "已取消",
  };
  return map[status || ""] || status || "";
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "-";
  if (seconds < 60) return `${seconds}秒`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`;
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分钟`;
}

function formatJson(data: any): string {
  if (typeof data === "string") {
    try { return JSON.stringify(JSON.parse(data), null, 2); }
    catch { return data; }
  }
  return JSON.stringify(data, null, 2);
}

// ==================== 加载 ====================
async function loadDetail() {
  loadingError.value = "";
  try {
    const res = await fetchInstDetail(instId.value);
    if (res.code === 200 && res.data) {
      detail.value = res.data;
    } else {
      loadingError.value = res.msg || "加载失败";
    }
  } catch (e: any) {
    loadingError.value = e?.message || "网络错误";
  }
}

// ==================== 审批操作 ====================
function getPendingTaskIds(): number[] {
  return currentTasks.value
    .filter((t) => t.taskStatus === "PENDING")
    .map((t) => t.wfTaskId)
    .filter((id): id is number => id != null);
}

async function doApprove() {
  const taskIds = getPendingTaskIds();
  if (taskIds.length === 0) { ElMessage.warning("没有待处理的任务"); return; }
  processing.value = true;
  try {
    for (const taskId of taskIds) {
      const res = await approveTask({ wfTaskId: taskId, comment: approvalForm.value.comment || undefined });
      if (res.code !== 200) { ElMessage.error(res.msg || "审批失败"); return; }
    }
    ElMessage.success("已通过");
    approvalForm.value.comment = "";
    await loadDetail();
  } catch { ElMessage.error("审批操作失败"); }
  finally { processing.value = false; }
}

async function doReject() {
  const taskIds = getPendingTaskIds();
  if (taskIds.length === 0) { ElMessage.warning("没有待处理的任务"); return; }
  try {
    await ElMessageBox.confirm("确认驳回该申请？", "驳回确认", { type: "warning" });
  } catch { return; }
  processing.value = true;
  try {
    for (const taskId of taskIds) {
      const res = await rejectTask({ wfTaskId: taskId, comment: approvalForm.value.comment || undefined });
      if (res.code !== 200) { ElMessage.error(res.msg || "驳回失败"); return; }
    }
    ElMessage.success("已驳回");
    approvalForm.value.comment = "";
    await loadDetail();
  } catch { ElMessage.error("驳回操作失败"); }
  finally { processing.value = false; }
}

async function doReturn() {
  const taskIds = getPendingTaskIds();
  if (taskIds.length === 0) { ElMessage.warning("没有待处理的任务"); return; }
  try {
    await ElMessageBox.confirm("确认退回该申请？将回到上一节点。", "退回确认", { type: "warning" });
  } catch { return; }
  processing.value = true;
  try {
    for (const taskId of taskIds) {
      const res = await returnTask({ wfTaskId: taskId, comment: approvalForm.value.comment || undefined });
      if (res.code !== 200) { ElMessage.error(res.msg || "退回失败"); return; }
    }
    ElMessage.success("已退回");
    approvalForm.value.comment = "";
    await loadDetail();
  } catch { ElMessage.error("退回操作失败"); }
  finally { processing.value = false; }
}

function toggleTransfer() {
  approvalAction.value = approvalAction.value === "transfer" ? "normal" : "transfer";
}

async function doTransfer() {
  const taskIds = getPendingTaskIds();
  if (taskIds.length === 0) { ElMessage.warning("没有待处理的任务"); return; }
  if (!approvalForm.value.transferUserId) { ElMessage.warning("请输入转交用户ID"); return; }
  processing.value = true;
  try {
    for (const taskId of taskIds) {
      const res = await transferTask({
        wfTaskId: taskId,
        comment: approvalForm.value.comment || undefined,
        transferUserId: approvalForm.value.transferUserId,
        transferUserName: approvalForm.value.transferUserName || undefined,
      });
      if (res.code !== 200) { ElMessage.error(res.msg || "转交失败"); return; }
    }
    ElMessage.success("已转交");
    approvalForm.value = { comment: "", transferUserId: undefined, transferUserName: "" };
    approvalAction.value = "normal";
    await loadDetail();
  } catch { ElMessage.error("转交操作失败"); }
  finally { processing.value = false; }
}

function goBack() {
  router.back();
}

onMounted(loadDetail);
</script>

<style scoped lang="scss">
.history-item {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  font-size: 13px;

  .history-comment {
    color: var(--el-text-color-secondary);
  }

  .history-duration {
    color: var(--el-text-color-placeholder);
    font-size: 12px;
  }
}

.form-data-json {
  background: var(--el-fill-color-lighter);
  border-radius: 4px;
  padding: 12px;
  font-size: 12px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 400px;
  white-space: pre-wrap;
  word-break: break-all;
}

.loading-state {
  padding: 40px;
}

.error-state {
  display: flex;
  justify-content: center;
  padding: 60px 0;
}
</style>
