<script setup>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { reactive, ref, computed, nextTick, defineAsyncComponent } from "vue";
import { fetchPageFeedback, fetchIssueFeedback } from "@/api/manage/feedback";
import { getTimeAgo } from "@repo/utils";
import Refresh from "@iconify-icons/line-md/backup-restore";
import { debounce } from "@pureadmin/utils";
import { ElMessage } from "element-plus";

// 详情弹窗组件
const DetailDialog = defineAsyncComponent(() => import("./FeedbackDetail.vue"));

// 搜索表单
const form = reactive({
  sysFeedbackType: "",
  sysFeedbackStatus: null
});

// 弹窗显示状态
const visible = reactive({
  detail: false,
  issue: false
});

// 加载状态
const loading = reactive({
  query: false,
  issue: false
});

// 表单引用
const formRef = ref();
// 表格引用
const table = ref(null);
// 详情弹窗引用
const detailRef = ref(null);

// 当前选中的反馈
const currentFeedback = ref(null);

// 回复表单
const issueForm = reactive({
  sysFeedbackId: null,
  sysFeedbackRecoverContent: "",
  sysFeedbackRecoverImages: ""
});

// 反馈类型选项
const typeOptions = [
  { label: "功能建议", value: "SUGGESTION" },
  { label: "BUG反馈", value: "BUG" },
  { label: "其他问题", value: "OTHER" }
];

// 状态选项
const statusOptions = [
  { label: "待处理", value: 0 },
  { label: "已处理", value: 1 }
];

/**
 * 转换反馈类型
 */
const transformType = (value) => {
  const item = typeOptions.find((item) => item.value === value);
  return item ? item.label : value || "未知";
};

/**
 * 重置表单
 */
const resetForm = async (formRef) => {
  formRef.resetFields();
  onSearch();
};

/**
 * 搜索
 */
const onSearch = debounce(
  async () => {
    table.value.reload(form);
  },
  500,
  true
);

/**
 * 打开详情弹窗
 */
const openDetail = async (row) => {
  currentFeedback.value = row;
  visible.detail = true;
  await nextTick();
  detailRef.value?.setData(row);
};

/**
 * 打开回复弹窗
 */
const openIssue = (row) => {
  currentFeedback.value = row;
  issueForm.sysFeedbackId = row.sysFeedbackId;
  issueForm.sysFeedbackRecoverContent = "";
  issueForm.sysFeedbackRecoverImages = "";
  visible.issue = true;
};

/**
 * 提交回复
 */
const submitIssue = async () => {
  if (!issueForm.sysFeedbackRecoverContent) {
    ElMessage.warning("请输入回复内容");
    return;
  }

  loading.issue = true;
  try {
    const res = await fetchIssueFeedback(issueForm);
    if (res.code === 200) {
      ElMessage.success("回复成功");
      visible.issue = false;
      onSearch();
    } else {
      ElMessage.error(res.msg || "回复失败");
    }
  } catch (error) {
    ElMessage.error("回复失败");
  } finally {
    loading.issue = false;
  }
};

/**
 * 关闭详情弹窗
 */
const closeDetail = () => {
  visible.detail = false;
  currentFeedback.value = null;
};
</script>

<template>
  <div class="feedback-main">
    <!-- 详情弹窗 -->
    <DetailDialog v-if="visible.detail" ref="detailRef" @close="closeDetail" />

    <!-- 回复弹窗 -->
    <el-dialog v-model="visible.issue" title="回复反馈" width="500px" destroy-on-close>
      <el-form :model="issueForm" label-width="80px">
        <el-form-item label="回复内容" required>
          <el-input
            v-model="issueForm.sysFeedbackRecoverContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>
        <el-form-item label="回复图片">
          <el-input
            v-model="issueForm.sysFeedbackRecoverImages"
            placeholder="请输入图片地址，多个用逗号分隔"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible.issue = false">取消</el-button>
        <el-button type="primary" :loading="loading.issue" @click="submitIssue">确认回复</el-button>
      </template>
    </el-dialog>

    <el-container class="feedback-container">
      <!-- 头部搜索区域 -->
      <el-header class="feedback-header">
        <div class="feedback-left-panel">
          <el-form ref="formRef" label-width="60px" :inline="true" :model="form" class="feedback-search-form">
            <el-form-item label="类型" prop="sysFeedbackType" class="feedback-form-item">
              <el-select v-model="form.sysFeedbackType" placeholder="请选择类型" clearable class="feedback-select">
                <el-option v-for="item in typeOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
            <el-form-item label="状态" prop="sysFeedbackStatus" class="feedback-form-item">
              <el-select v-model="form.sysFeedbackStatus" placeholder="请选择状态" clearable class="feedback-select">
                <el-option v-for="item in statusOptions" :key="item.value" :value="item.value" :label="item.label" />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="feedback-right-panel">
          <div class="feedback-button-container">
            <el-tooltip content="搜索" placement="top">
              <el-button type="primary" :icon="useRenderIcon('ri:search-line')" :loading="loading.query" @click="onSearch" />
            </el-tooltip>
            <el-tooltip content="重置" placement="top">
              <el-button type="primary" :icon="useRenderIcon(Refresh)" @click="resetForm(formRef)" />
            </el-tooltip>
          </div>
        </div>
      </el-header>

      <!-- 主体表格区域 -->
      <el-main class="feedback-main-content">
        <div class="feedback-content">
          <ScTable ref="table" :url="fetchPageFeedback" :rowClick="openDetail" class="feedback-table">
            <el-table-column label="反馈类型" prop="sysFeedbackType" align="center" width="120">
              <template #default="{ row }">
                <el-tag :type="row.sysFeedbackType === 'BUG' ? 'danger' : row.sysFeedbackType === 'SUGGESTION' ? 'primary' : 'info'">
                  {{ transformType(row.sysFeedbackType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="反馈内容" prop="sysFeedbackContent" align="left" show-overflow-tooltip min-width="200" />
            <el-table-column label="反馈图片" prop="sysFeedbackImages" align="center" width="100">
              <template #default="{ row }">
                <el-image
                  v-if="row.sysFeedbackImages"
                  :src="row.sysFeedbackImages.split(',')[0]"
                  :preview-src-list="row.sysFeedbackImages.split(',')"
                  fit="cover"
                  style="width: 40px; height: 40px; border-radius: 4px"
                  preview-teleported
                />
                <span v-else>-</span>
              </template>
            </el-table-column>
            <el-table-column label="反馈人" prop="createBy" align="center" width="120" />
            <el-table-column label="反馈时间" prop="createTime" align="center" width="180">
              <template #default="{ row }">
                <div>
                  <span>{{ getTimeAgo(row.createTime) }}</span>
                  <br />
                  <span class="text-gray-400">{{ row.createTime }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="状态" prop="sysFeedbackStatus" align="center" width="100">
              <template #default="{ row }">
                <el-tag v-if="row.sysFeedbackStatus === 1" type="success">已处理</el-tag>
                <el-tag v-else type="warning">待处理</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="处理人" prop="sysFeedbackDealName" align="center" width="120">
              <template #default="{ row }">
                {{ row.sysFeedbackDealName || "-" }}
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center" width="120" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.sysFeedbackStatus !== 1"
                  type="primary"
                  link
                  @click.stop="openIssue(row)"
                >
                  回复
                </el-button>
                <el-button type="primary" link @click.stop="openDetail(row)">详情</el-button>
              </template>
            </el-table-column>
          </ScTable>
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped lang="scss">
@keyframes feedback-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.feedback-main {
  height: 100%;
  background-color: var(--app-bg-primary);
  animation: feedback-fade-in 0.5s ease-out;
  overflow-x: hidden;
}

.feedback-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: var(--app-shadow);
  overflow: hidden;
}

.feedback-header {
  padding: 16px;
  background-color: var(--app-bg-primary);
  border-bottom: 1px solid var(--app-border-primary);
  box-shadow: var(--app-shadow-sm);
  height: auto !important;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.feedback-left-panel {
  flex: 1;
}

.feedback-search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.feedback-form-item {
  margin-bottom: 0 !important;
}

.feedback-select {
  width: 160px !important;
}

.feedback-right-panel {
  display: flex;
  align-items: center;
}

.feedback-button-container {
  display: flex;
  gap: 8px;
}

.feedback-main-content {
  padding: 0 !important;
  height: calc(100% - 80px);
  overflow: hidden;
}

.feedback-content {
  height: 100%;
  width: 100%;
}

.feedback-table {
  height: 100%;
  width: 100%;

  :deep(.el-table) {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: var(--app-shadow-sm);

    tr {
      transition: all 0.3s ease;
      &:hover {
        background-color: var(--app-primary-shadow-sm) !important;
      }
    }
  }
}
</style>
