<script setup lang="ts">
import {
  fetchFeedbackStatistic,
  fetchIssueFeedback,
  fetchPageFeedback,
  type Feedback,
} from "@/api/manage/feedback";
import { IconifyIconOnline } from "@repo/components/ReIcon";
import { getTimeAgo, message } from "@repo/utils";
import { reactive, ref, onMounted } from "vue";
import FeedbackDetail from "./detail.vue";

type StatisticState = {
  total: number;
  pending: number;
  resolved: number;
};

const createQueryForm = () => ({
  sysFeedbackType: "",
  sysFeedbackStatus: undefined as number | undefined,
});

const queryForm = reactive(createQueryForm());
const loading = reactive({
  statistic: false,
  issue: false,
});
const dialogVisible = reactive({
  detail: false,
  issue: false,
});
const statistics = reactive<StatisticState>({
  total: 0,
  pending: 0,
  resolved: 0,
});
const currentFeedback = ref<Feedback | null>(null);
const tableRef = ref<any>(null);
const issueForm = reactive({
  sysFeedbackId: undefined as number | undefined,
  sysFeedbackRecoverContent: "",
  sysFeedbackRecoverImages: "",
});

const typeOptions = [
  { label: "功能建议", value: "SUGGESTION" },
  { label: "BUG 反馈", value: "BUG" },
  { label: "其他问题", value: "OTHER" },
];

const statusOptions = [
  { label: "待处理", value: 0 },
  { label: "已处理", value: 1 },
];

const loadStatistics = async () => {
  loading.statistic = true;
  try {
    const response = await fetchFeedbackStatistic();
    const payload = response?.data;
    statistics.total = Number(payload?.total || 0);
    statistics.pending = Number(payload?.pending || 0);
    statistics.resolved = Number(payload?.resolved || 0);
  } catch (error) {
    message("加载反馈统计失败", { type: "warning" });
  } finally {
    loading.statistic = false;
  }
};

const reloadTable = () => {
  tableRef.value?.reload?.({ ...queryForm }, 1);
};

const handleSearch = () => {
  reloadTable();
};

const handleReset = () => {
  Object.assign(queryForm, createQueryForm());
  reloadTable();
};

const openDetail = (row: Feedback) => {
  currentFeedback.value = row;
  dialogVisible.detail = true;
};

const openIssue = (row: Feedback) => {
  currentFeedback.value = row;
  issueForm.sysFeedbackId = row.sysFeedbackId;
  issueForm.sysFeedbackRecoverContent = "";
  issueForm.sysFeedbackRecoverImages = "";
  dialogVisible.issue = true;
};

const submitIssue = async () => {
  if (!issueForm.sysFeedbackId) {
    message("缺少反馈标识", { type: "warning" });
    return;
  }

  if (!String(issueForm.sysFeedbackRecoverContent || "").trim()) {
    message("请输入回复内容", { type: "warning" });
    return;
  }

  loading.issue = true;
  try {
    const response = await fetchIssueFeedback({ ...issueForm });
    if (String(response?.code) === "00000" || response?.data === true) {
      dialogVisible.issue = false;
      message("反馈已处理", { type: "success" });
      await loadStatistics();
      reloadTable();
      return;
    }
    message(response?.msg || "反馈处理失败", { type: "error" });
  } catch (error) {
    message("反馈处理失败", { type: "error" });
  } finally {
    loading.issue = false;
  }
};

const typeText = (value?: string) => {
  return typeOptions.find((item) => item.value === value)?.label || value || "-";
};

onMounted(() => {
  loadStatistics();
});
</script>

<template>
  <div class="system-container feedback-page">
    <FeedbackDetail
      v-model="dialogVisible.detail"
      :data="currentFeedback"
    />

    <ScDialog
      v-model="dialogVisible.issue"
      title="处理反馈"
      width="560px"
      destroy-on-close
    >
      <ScForm label-width="84px">
        <ScFormItem label="反馈类型">
          <ScInput :model-value="typeText(currentFeedback?.sysFeedbackType)" disabled />
        </ScFormItem>
        <ScFormItem label="回复内容" required>
          <ScInput
            v-model="issueForm.sysFeedbackRecoverContent"
            type="textarea"
            :rows="5"
            placeholder="请输入处理说明或回复内容"
          />
        </ScFormItem>
        <ScFormItem label="回复图片">
          <ScInput
            v-model="issueForm.sysFeedbackRecoverImages"
            placeholder="图片地址，多个使用英文逗号分隔"
          />
        </ScFormItem>
      </ScForm>

      <template #footer>
        <ScButton @click="dialogVisible.issue = false">取消</ScButton>
        <ScButton type="primary" :loading="loading.issue" @click="submitIssue">
          确认处理
        </ScButton>
      </template>
    </ScDialog>

    <ScContainer class="feedback-shell">
      <section class="feedback-stats">
        <article class="feedback-stat feedback-stat--total">
          <div class="feedback-stat__icon">
            <IconifyIconOnline icon="ri:message-3-line" />
          </div>
          <div>
            <div class="feedback-stat__value">{{ statistics.total }}</div>
            <div class="feedback-stat__label">反馈总数</div>
          </div>
        </article>
        <article class="feedback-stat feedback-stat--pending">
          <div class="feedback-stat__icon">
            <IconifyIconOnline icon="ri:time-line" />
          </div>
          <div>
            <div class="feedback-stat__value">{{ statistics.pending }}</div>
            <div class="feedback-stat__label">待处理</div>
          </div>
        </article>
        <article class="feedback-stat feedback-stat--resolved">
          <div class="feedback-stat__icon">
            <IconifyIconOnline icon="ri:checkbox-circle-line" />
          </div>
          <div>
            <div class="feedback-stat__value">{{ statistics.resolved }}</div>
            <div class="feedback-stat__label">已处理</div>
          </div>
        </article>
      </section>

      <section class="feedback-panel">
        <ScHeader class="feedback-toolbar">
          <div class="feedback-toolbar__filters">
            <ScSelect
              v-model="queryForm.sysFeedbackType"
              clearable
              placeholder="反馈类型"
              class="feedback-toolbar__select"
            >
              <ScOption
                v-for="item in typeOptions"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </ScSelect>
            <ScSelect
              v-model="queryForm.sysFeedbackStatus"
              clearable
              placeholder="处理状态"
              class="feedback-toolbar__select"
            >
              <ScOption
                v-for="item in statusOptions"
                :key="item.value"
                :value="item.value"
                :label="item.label"
              />
            </ScSelect>
          </div>

          <div class="feedback-toolbar__actions">
            <ScButton type="primary" @click="handleSearch">
              <IconifyIconOnline icon="ri:search-line" />
              查询
            </ScButton>
            <ScButton @click="handleReset">
              <IconifyIconOnline icon="ri:restart-line" />
              重置
            </ScButton>
          </div>
        </ScHeader>

        <ScMain class="feedback-panel__main">
          <ScTable
            ref="tableRef"
            :url="fetchPageFeedback"
            :params="{ ...queryForm }"
            row-key="sysFeedbackId"
            border
            height="auto"
            class="feedback-table"
            :row-click="openDetail"
          >
            <ScTableColumn label="类型" prop="sysFeedbackType" width="126" align="center">
              <template #default="{ row }">
                <ScTag
                  :type="
                    row.sysFeedbackType === 'BUG'
                      ? 'danger'
                      : row.sysFeedbackType === 'SUGGESTION'
                        ? 'primary'
                        : 'info'
                  "
                  effect="light"
                >
                  {{ typeText(row.sysFeedbackType) }}
                </ScTag>
              </template>
            </ScTableColumn>

            <ScTableColumn
              label="反馈内容"
              prop="sysFeedbackContent"
              min-width="260"
              show-overflow-tooltip
            />

            <ScTableColumn label="反馈图片" prop="sysFeedbackImages" width="120" align="center">
              <template #default="{ row }">
                <ScImage
                  v-if="row.sysFeedbackImages"
                  :src="row.sysFeedbackImages.split(',')[0]"
                  :preview-src-list="row.sysFeedbackImages.split(',')"
                  fit="cover"
                  class="feedback-table__image"
                  preview-teleported
                />
                <span v-else>-</span>
              </template>
            </ScTableColumn>

            <ScTableColumn label="反馈人" prop="createBy" width="140" align="center" />

            <ScTableColumn label="反馈时间" prop="createTime" min-width="176" align="center">
              <template #default="{ row }">
                <div class="feedback-time">
                  <strong>{{ getTimeAgo(row.createTime) }}</strong>
                  <span>{{ row.createTime || "-" }}</span>
                </div>
              </template>
            </ScTableColumn>

            <ScTableColumn label="处理状态" prop="sysFeedbackStatus" width="108" align="center">
              <template #default="{ row }">
                <ScTag
                  :type="row.sysFeedbackStatus === 1 ? 'success' : 'warning'"
                  effect="light"
                >
                  {{ row.sysFeedbackStatus === 1 ? "已处理" : "待处理" }}
                </ScTag>
              </template>
            </ScTableColumn>

            <ScTableColumn label="处理人" prop="sysFeedbackDealName" width="140" align="center">
              <template #default="{ row }">
                {{ row.sysFeedbackDealName || "-" }}
              </template>
            </ScTableColumn>

            <ScTableColumn label="操作" width="152" fixed="right" align="center">
              <template #default="{ row }">
                <ScButton link type="primary" @click.stop="openDetail(row)">
                  详情
                </ScButton>
                <ScButton
                  v-if="row.sysFeedbackStatus !== 1"
                  link
                  type="primary"
                  @click.stop="openIssue(row)"
                >
                  处理
                </ScButton>
              </template>
            </ScTableColumn>
          </ScTable>
        </ScMain>
      </section>
    </ScContainer>
  </div>
</template>

<style scoped lang="scss">
.feedback-page {
  min-height: 100%;
}

.feedback-shell {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-height: 100%;
}

.feedback-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 24px 28px;
  background:
    linear-gradient(135deg, rgb(15 23 42 / 0.96), rgb(30 41 59 / 0.9)),
    var(--el-color-primary);
  border-radius: 24px;
  color: #f8fafc;
}

.feedback-hero__copy {
  max-width: 720px;

  h2 {
    margin: 6px 0 12px;
    font-size: 28px;
    font-weight: 700;
  }

  p:last-child {
    margin: 0;
    line-height: 1.75;
    color: rgb(226 232 240 / 0.88);
  }
}

.feedback-hero__eyebrow {
  margin: 0;
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: rgb(125 211 252 / 0.96);
}

.feedback-stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.feedback-stat {
  display: flex;
  gap: 14px;
  align-items: center;
  padding: 18px 20px;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 18px;
  background: var(--app-bg-overlay, var(--el-bg-color));
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.06);
}

.feedback-stat__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  font-size: 22px;
  border-radius: 16px;
}

.feedback-stat__value {
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.feedback-stat__label {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
}

.feedback-stat--total .feedback-stat__icon {
  color: #2563eb;
  background: rgb(37 99 235 / 0.12);
}

.feedback-stat--pending .feedback-stat__icon {
  color: #d97706;
  background: rgb(217 119 6 / 0.12);
}

.feedback-stat--resolved .feedback-stat__icon {
  color: #059669;
  background: rgb(5 150 105 / 0.12);
}

.feedback-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 22px;
  background: var(--app-bg-overlay, var(--el-bg-color));
  box-shadow: 0 24px 48px rgb(15 23 42 / 0.05);
}

.feedback-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.feedback-toolbar__filters,
.feedback-toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.feedback-toolbar__select {
  width: 180px;
}

.feedback-panel__main {
  flex: 1;
  min-height: 0;
  padding: 16px !important;
}

.feedback-table {
  height: 100%;
}

.feedback-table__image {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.feedback-time {
  display: flex;
  flex-direction: column;
  gap: 3px;

  strong {
    color: var(--el-text-color-primary);
    font-size: 13px;
  }

  span {
    color: var(--el-text-color-secondary);
    font-size: 12px;
  }
}

@media (max-width: 1080px) {
  .feedback-stats {
    grid-template-columns: 1fr;
  }

  .feedback-hero,
  .feedback-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .feedback-toolbar__filters,
  .feedback-toolbar__actions {
    width: 100%;
  }

  .feedback-toolbar__select {
    flex: 1;
    width: auto;
    min-width: 0;
  }
}

:root[data-theme="dark"] {
  .feedback-shell {
    background:
      radial-gradient(circle at top right, rgb(14 165 233 / 0.12), transparent 30%),
      radial-gradient(circle at left center, rgb(37 99 235 / 0.12), transparent 24%),
      var(--app-bg-base, var(--el-bg-color-page));
  }

  .feedback-panel,
  .feedback-stat {
    border-color: rgb(148 163 184 / 0.14);
    box-shadow: 0 22px 46px rgb(2 8 23 / 0.28);
  }
}
</style>
