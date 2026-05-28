<template>
  <PmPageShell page-class="workflow-my-apply-page">
    <PmSurface title="我的申请" description="查看我发起的审批流程，追踪进度或撤销申请">
      <template #actions>
        <ScButton type="primary" @click="showCreateDialog = true">
          <IconifyIconOnline icon="ri:add-line" style="margin-right: 4px" />发起审批
        </ScButton>
        <ScButton circle :icon="RefreshRight" @click="reloadTable" />
      </template>
    </PmSurface>

    <!-- 搜索栏 -->
    <PmToolbar>
      <template #form>
        <el-form :model="queryForm" inline>
          <el-form-item label="流程">
            <el-select v-model="queryForm.wfDefId" clearable placeholder="全部流程" style="width: 170px">
              <el-option
                v-for="item in defOptions"
                :key="item.wfDefId"
                :label="item.wfDefName"
                :value="item.wfDefId"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="queryForm.instStatus" clearable placeholder="全部" style="width: 140px">
              <el-option label="草稿" value="DRAFT" />
              <el-option label="审批中" value="PENDING" />
              <el-option label="已通过" value="APPROVED" />
              <el-option label="已驳回" value="REJECTED" />
              <el-option label="已撤销" value="WITHDRAWN" />
            </el-select>
          </el-form-item>
          <el-form-item label="标题">
            <el-input
              v-model="queryForm.instTitle"
              clearable
              placeholder="搜索标题"
              style="width: 160px"
              @keyup.enter="reloadTable"
            />
          </el-form-item>
          <el-form-item>
            <ScButton :icon="Search" @click="reloadTable">查询</ScButton>
            <ScButton :icon="Refresh" @click="resetQuery">重置</ScButton>
          </el-form-item>
        </el-form>
      </template>
    </PmToolbar>

    <!-- 表格 -->
    <PmPanel title="申请列表">
      <ScTable
        ref="tableRef"
        table-name="workflow-my-apply"
        row-key="wfInstId"
        border
        stripe
        :search="false"
        :hide-do="true"
        :hide-refresh="true"
        :hide-setting="true"
        :params="queryForm"
        :url="fetchMyApply"
      >
        <el-table-column label="标题" min-width="200">
          <template #default="{ row }">
            <el-link type="primary" @click="viewDetail(row)">
              {{ row.instTitle }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="wfDefName" label="流程名称" width="160" />
        <el-table-column prop="starterId" label="发起人" width="120" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="instStatusTag(row.instStatus)" effect="plain">
              {{ instStatusLabel(row.instStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createTime }}
          </template>
        </el-table-column>
        <el-table-column label="完成时间" width="180">
          <template #default="{ row }">
            {{ row.finishTime || "-" }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <ScButton text type="primary" size="small" @click="viewDetail(row)">详情</ScButton>
            <ScButton
              v-if="row.instStatus === 'DRAFT' || row.instStatus === 'PENDING'"
              text
              type="warning"
              size="small"
              @click="handleWithdraw(row)"
            >撤销</ScButton>
            <ScButton
              v-if="row.instStatus === 'DRAFT'"
              text
              type="danger"
              size="small"
              @click="handleDelete(row)"
            >删除</ScButton>
          </template>
        </el-table-column>
      </ScTable>
    </PmPanel>

    <!-- 发起审批对话框 -->
    <el-dialog v-model="showCreateDialog" title="发起审批" width="520px">
      <ScForm label-position="top" size="small">
        <ScFormItem label="流程定义">
          <el-select
            v-model="createForm.wfDefId"
            placeholder="选择已发布的流程"
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in publishedDefs"
              :key="item.wfDefId"
              :label="item.wfDefName"
              :value="item.wfDefId"
            />
          </el-select>
        </ScFormItem>
        <ScFormItem label="申请标题">
          <el-input v-model="createForm.instTitle" placeholder="例如: 请假申请-张三-2025" />
        </ScFormItem>
        <ScFormItem label="业务类型">
          <el-input v-model="createForm.businessType" placeholder="可选，例如: LEAVE" />
        </ScFormItem>
        <ScFormItem label="表单数据(JSON)">
          <el-input
            v-model="createForm.formDataStr"
            type="textarea"
            :rows="4"
            placeholder="可选，JSON 格式表单数据"
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="showCreateDialog = false">取消</ScButton>
        <ScButton type="primary" :loading="submitting" @click="handleSubmitInst">提交</ScButton>
      </template>
    </el-dialog>
  </PmPageShell>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { RefreshRight, Search, Refresh } from "@element-plus/icons-vue";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { fetchMyApply, createInst, submitInst, withdrawInst, deleteInst } from "../../api/instance";
import { fetchPublishedDefs } from "../../api/workflow";
import type { WfDef } from "../../types";

const router = useRouter();

// 表格
const tableRef = ref<any>(null);
const queryForm = ref<any>({
  wfDefId: undefined,
  instStatus: undefined,
  instTitle: undefined,
});

// 发起审批
const showCreateDialog = ref(false);
const submitting = ref(false);
const publishedDefs = ref<WfDef[]>([]);
const defOptions = ref<WfDef[]>([]);
const createForm = ref({
  wfDefId: undefined as number | undefined,
  instTitle: "",
  businessType: "",
  formDataStr: "",
});

// ==================== 状态标签 ====================
function instStatusTag(status?: string): string {
  const map: Record<string, string> = {
    DRAFT: "info",
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
    WITHDRAWN: "info",
  };
  return map[status || ""] || "info";
}

function instStatusLabel(status?: string): string {
  const map: Record<string, string> = {
    DRAFT: "草稿",
    PENDING: "审批中",
    APPROVED: "已通过",
    REJECTED: "已驳回",
    WITHDRAWN: "已撤销",
  };
  return map[status || ""] || status || "";
}

// ==================== 操作 ====================
function reloadTable() {
  tableRef.value?.refresh?.();
}

function resetQuery() {
  queryForm.value = { wfDefId: undefined, instStatus: undefined, instTitle: undefined };
  reloadTable();
}

function viewDetail(row: any) {
  router.push(`/workflow/detail/${row.wfInstId}`);
}

async function handleWithdraw(row: any) {
  try {
    await ElMessageBox.confirm("确认撤销该申请？", "撤销确认", { type: "warning" });
    const res = await withdrawInst(row.wfInstId);
    if (res.code === 200) {
      ElMessage.success("已撤销");
      reloadTable();
    } else {
      ElMessage.error(res.msg || "撤销失败");
    }
  } catch {
    // cancel
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm("确认删除该草稿？", "删除确认", { type: "warning" });
    const res = await deleteInst(row.wfInstId);
    if (res.code === 200) {
      ElMessage.success("已删除");
      reloadTable();
    } else {
      ElMessage.error(res.msg || "删除失败");
    }
  } catch {
    // cancel
  }
}

async function handleSubmitInst() {
  if (!createForm.value.wfDefId) {
    ElMessage.warning("请选择流程定义");
    return;
  }
  if (!createForm.value.instTitle) {
    ElMessage.warning("请输入申请标题");
    return;
  }
  submitting.value = true;
  try {
    let formData: Record<string, any> | undefined;
    if (createForm.value.formDataStr) {
      try { formData = JSON.parse(createForm.value.formDataStr); }
      catch { ElMessage.warning("表单数据 JSON 格式有误"); submitting.value = false; return; }
    }
    const res = await createInst({
      wfDefId: createForm.value.wfDefId,
      instTitle: createForm.value.instTitle,
      businessType: createForm.value.businessType || undefined,
      formData,
    });
    if (res.code === 200 && res.data) {
      const instId = res.data.wfInstId;
      if (instId) {
        await submitInst(instId);
      }
      ElMessage.success("已发起审批");
      showCreateDialog.value = false;
      reloadTable();
    } else {
      ElMessage.error(res.msg || "发起失败");
    }
  } catch {
    ElMessage.error("发起审批失败");
  } finally {
    submitting.value = false;
  }
}

// ==================== 初始化加载 ====================
onMounted(async () => {
  try {
    const res = await fetchPublishedDefs();
    if (res.code === 200) {
      publishedDefs.value = res.data || [];
    }
  } catch { /* ignore */ }

  try {
    const all = await import("../../api/workflow").then((m) => m.fetchDefPage({ page: 1, pageSize: 999 }));
    if (all.code === 200) {
      defOptions.value = all.data?.records || all.data || [];
    }
  } catch { /* ignore */ }
});
</script>
