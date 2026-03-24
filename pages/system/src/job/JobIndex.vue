<template>
  <div class="job-management-container system-container modern-bg">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <ScCard class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <ScInput 
              v-model="searchForm.jobDesc"
              placeholder="搜索任务名称或描述"
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <i class="ri-search-line"></i>
              </template>
            </ScInput>
            <ScSelect 
              v-model="searchForm.jobGroup"
              placeholder="选择任务组"
              class="group-filter"
              clearable
              @change="handleSearch"
            >
              <ScOption :value="undefined" label="全部任务组" />
              <ScOption 
                v-for="item in jobGroups"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </ScSelect>
            <ScSelect 
              v-model="searchForm.jobTriggerStatus"
              placeholder="任务状态"
              class="status-filter"
              clearable
              @change="handleSearch"
            >
              <ScOption label="运行中" :value="1" />
              <ScOption label="已停止" :value="0" />
            </ScSelect>
          </div>
          <div class="search-right">
            <ScButton type="primary" @click="handleAdd">
              <i class="ri-add-line"></i>
              新建任务
            </ScButton>
            <ScButton @click="handleRefresh">
              <i class="ri-refresh-line"></i>
              刷新
            </ScButton>
          </div>
        </div>
      </ScCard>
    </div>

    <!-- 任务列表 -->
    <div class="jobs-section">
      <ScCard shadow="never">
        <ScTable 
          v-loading="loading"
          :data="jobList"
          row-key="jobId"
          stripe
          border
        >
          <ScTableColumn prop="jobId" label="任务ID" width="80" align="center" />
          <ScTableColumn prop="jobName" label="任务名称" min-width="150">
            <template #default="{ row }">
              <div class="job-name-cell">
                <span class="job-name">{{ row.jobName }}</span>
                <ScTag v-if="row.jobDesc" size="small" type="info">
                  {{ row.jobDesc }}
                </ScTag>
              </div>
            </template>
          </ScTableColumn>
          <ScTableColumn prop="jobAuthor" label="负责人" width="100" align="center" />
          <ScTableColumn prop="jobScheduleConf" label="调度配置" width="150">
            <template #default="{ row }">
              <ScTooltip :content="row.jobScheduleConf" placement="top">
                <ScTag type="warning" size="small">
                  {{ row.jobScheduleType }}: {{ row.jobScheduleConf }}
                </ScTag>
              </ScTooltip>
            </template>
          </ScTableColumn>
          <ScTableColumn prop="jobExecutorHandler" label="执行器" min-width="150" />
          <ScTableColumn prop="jobTriggerStatus" label="状态" width="100" align="center">
            <template #default="{ row }">
              <ScTag :type="row.jobTriggerStatus === 1 ? 'success' : 'danger'">
                {{ row.jobTriggerStatus === 1 ? '运行中' : '已停止' }}
              </ScTag>
            </template>
          </ScTableColumn>
          <ScTableColumn label="操作" width="280" align="center" fixed="right">
            <template #default="{ row }">
              <el-button-group size="small">
                <ScButton 
                  v-if="row.jobTriggerStatus === 0"
                  type="success"
                  @click="handleStart(row)"
                >
                  <i class="ri-play-line"></i>
                  启动
                </ScButton>
                <ScButton 
                  v-else
                  type="warning"
                  @click="handleStop(row)"
                >
                  <i class="ri-stop-line"></i>
                  停止
                </ScButton>
                <ScButton type="primary" @click="handleTrigger(row)">
                  <i class="ri-lightning-line"></i>
                  执行
                </ScButton>
                <ScButton @click="handleEdit(row)">
                  <i class="ri-edit-line"></i>
                  编辑
                </ScButton>
                <ScButton @click="handleViewLog(row)">
                  <i class="ri-file-list-line"></i>
                  日志
                </ScButton>
                <ScButton type="danger" @click="handleDelete(row)">
                  <i class="ri-delete-bin-line"></i>
                  删除
                </ScButton>
              </el-button-group>
            </template>
          </ScTableColumn>
        </ScTable>

        <!-- 分页 -->
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="pagination.page"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSearch"
            @current-change="handleSearch"
          />
        </div>
      </ScCard>
    </div>

    <!-- 新增/编辑对话框 -->
    <sc-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
      :close-on-click-modal="false"
    >
      <ScForm 
        ref="formRef"
        :model="jobForm"
        :rules="formRules"
        label-width="120px"
      >
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="任务名称" prop="jobName">
              <ScInput v-model="jobForm.jobName" placeholder="请输入任务名称" />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="负责人" prop="jobAuthor">
              <ScInput v-model="jobForm.jobAuthor" placeholder="请输入负责人" />
            </ScFormItem>
          </ScCol>
        </ScRow>
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="调度类型" prop="jobScheduleType">
              <ScSelect v-model="jobForm.jobScheduleType" placeholder="请选择调度类型" style="width: 100%">
                <ScOption label="CRON" value="CRON" />
                <ScOption label="固定频率" value="FIX_RATE" />
                <ScOption label="固定延迟" value="FIX_DELAY" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="调度配置" prop="jobScheduleConf">
              <ScInput v-model="jobForm.jobScheduleConf" placeholder="如: 0/5 * * * * ?" />
            </ScFormItem>
          </ScCol>
        </ScRow>
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="执行器" prop="jobExecutorHandler">
              <ScInput v-model="jobForm.jobExecutorHandler" placeholder="请输入执行器Bean名称" />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="执行参数">
              <ScInput v-model="jobForm.jobExecutorParam" placeholder="请输入执行参数(JSON)" />
            </ScFormItem>
          </ScCol>
        </ScRow>
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="路由策略">
              <ScSelect v-model="jobForm.jobExecutorRouteStrategy" placeholder="请选择路由策略" style="width: 100%">
                <ScOption label="第一个" value="FIRST" />
                <ScOption label="最后一个" value="LAST" />
                <ScOption label="轮询" value="ROUND" />
                <ScOption label="随机" value="RANDOM" />
                <ScOption label="一致性哈希" value="CONSISTENT_HASH" />
                <ScOption label="最不经常使用" value="LEAST_FREQUENTLY_USED" />
                <ScOption label="最近最久未使用" value="LEAST_RECENTLY_USED" />
                <ScOption label="故障转移" value="FAILOVER" />
                <ScOption label="忙碌转移" value="BUSYOVER" />
                <ScOption label="分片广播" value="SHARDING_BROADCAST" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="阻塞策略">
              <ScSelect v-model="jobForm.jobExecutorBlockStrategy" placeholder="请选择阻塞策略" style="width: 100%">
                <ScOption label="单机串行" value="SERIAL_EXECUTION" />
                <ScOption label="丢弃后续调度" value="DISCARD_LATER" />
                <ScOption label="覆盖之前调度" value="COVER_EARLY" />
              </ScSelect>
            </ScFormItem>
          </ScCol>
        </ScRow>
        <ScRow :gutter="20">
          <ScCol :span="12">
            <ScFormItem label="超时时间(秒)">
              <ScInputNumber v-model="jobForm.jobExecutorTimeout" :min="0" style="width: 100%" />
            </ScFormItem>
          </ScCol>
          <ScCol :span="12">
            <ScFormItem label="失败重试次数">
              <ScInputNumber v-model="jobForm.jobExecutorFailRetryCount" :min="0" :max="10" style="width: 100%" />
            </ScFormItem>
          </ScCol>
        </ScRow>
        <ScFormItem label="任务描述">
          <ScInput 
            v-model="jobForm.jobDesc"
            type="textarea"
            :rows="3"
            placeholder="请输入任务描述"
          />
        </ScFormItem>
        <ScFormItem label="告警邮件">
          <ScInput v-model="jobForm.jobAlarmEmail" placeholder="多个邮箱用逗号分隔" />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="dialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="submitLoading" @click="handleSubmit">
          确定
        </ScButton>
      </template>
    </sc-dialog>

    <!-- 执行任务对话框 -->
    <sc-dialog v-model="triggerDialogVisible" title="手动执行任务" width="500px">
      <ScForm label-width="100px">
        <ScFormItem label="任务名称">
          <span>{{ currentJob?.jobName }}</span>
        </ScFormItem>
        <ScFormItem label="执行参数">
          <ScInput 
            v-model="triggerParam"
            type="textarea"
            :rows="4"
            placeholder="请输入执行参数(JSON格式，可选)"
          />
        </ScFormItem>
      </ScForm>
      <template #footer>
        <ScButton @click="triggerDialogVisible = false">取消</ScButton>
        <ScButton type="primary" :loading="triggerLoading" @click="confirmTrigger">
          执行
        </ScButton>
      </template>
    </sc-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ScMessage, ScMessageBox, type FormInstance, type FormRules } from "@repo/utils";
import {
  fetchJobPageList,
  fetchJobSave,
  fetchJobUpdate,
  fetchJobDelete,
  fetchJobStart,
  fetchJobStop,
  fetchJobTrigger,
  type JobInfo,
  type JobPageParams,
} from "./api";

// Props
const props = defineProps<{
  /** 任务组列表 */
  jobGroups?: Array<{ label: string; value: number }>;
}>();

// Emits
const emit = defineEmits<{
  (e: "view-log", job: JobInfo): void;
}>();

// 状态
const loading = ref(false);
const submitLoading = ref(false);
const triggerLoading = ref(false);
const dialogVisible = ref(false);
const triggerDialogVisible = ref(false);
const dialogTitle = ref("新建任务");
const formRef = ref<FormInstance>();

// 搜索表单
const searchForm = reactive<JobPageParams>({
  jobDesc: "",
  jobGroup: undefined,
  jobTriggerStatus: undefined,
});

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0,
});

// 任务列表
const jobList = ref<JobInfo[]>([]);

// 当前编辑的任务
const currentJob = ref<JobInfo | null>(null);

// 任务表单
const jobForm = reactive<JobInfo>({
  jobName: "",
  jobDesc: "",
  jobAuthor: "",
  jobScheduleType: "CRON",
  jobScheduleConf: "",
  jobExecutorHandler: "",
  jobExecutorParam: "",
  jobExecutorRouteStrategy: "FIRST",
  jobExecutorBlockStrategy: "SERIAL_EXECUTION",
  jobExecutorTimeout: 0,
  jobExecutorFailRetryCount: 0,
  jobAlarmEmail: "",
});

// 执行参数
const triggerParam = ref("");

// 表单验证规则
const formRules: FormRules = {
  jobName: [{ required: true, message: "请输入任务名称", trigger: "blur" }],
  jobAuthor: [{ required: true, message: "请输入负责人", trigger: "blur" }],
  jobScheduleType: [{ required: true, message: "请选择调度类型", trigger: "change" }],
  jobScheduleConf: [{ required: true, message: "请输入调度配置", trigger: "blur" }],
  jobExecutorHandler: [{ required: true, message: "请输入执行器", trigger: "blur" }],
};

// 任务组列表
const jobGroups = ref(props.jobGroups || []);

// 加载任务列表
const loadJobList = async () => {
  loading.value = true;
  try {
    const response = await fetchJobPageList({
      ...searchForm,
      page: pagination.page,
      pageSize: pagination.pageSize,
    });
    if (response.success) {
      jobList.value = response.data?.records || response.data || [];
      pagination.total = response.data?.total || jobList.value.length;
    } else {
      ScMessage.error(response.msg || "加载任务列表失败");
    }
  } catch (error) {
    console.error("加载任务列表失败:", error);
    ScMessage.error("加载任务列表失败");
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.page = 1;
  loadJobList();
};

// 刷新
const handleRefresh = () => {
  loadJobList();
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新建任务";
  currentJob.value = null;
  resetForm();
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: JobInfo) => {
  dialogTitle.value = "编辑任务";
  currentJob.value = row;
  Object.assign(jobForm, row);
  dialogVisible.value = true;
};

// 重置表单
const resetForm = () => {
  Object.assign(jobForm, {
    jobId: undefined,
    jobName: "",
    jobDesc: "",
    jobAuthor: "",
    jobScheduleType: "CRON",
    jobScheduleConf: "",
    jobExecutorHandler: "",
    jobExecutorParam: "",
    jobExecutorRouteStrategy: "FIRST",
    jobExecutorBlockStrategy: "SERIAL_EXECUTION",
    jobExecutorTimeout: 0,
    jobExecutorFailRetryCount: 0,
    jobAlarmEmail: "",
  });
  formRef.value?.resetFields();
};

// 提交表单
const handleSubmit = async () => {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  submitLoading.value = true;
  try {
    const api = currentJob.value ? fetchJobUpdate : fetchJobSave;
    const data = currentJob.value
      ? { ...jobForm, jobId: currentJob.value.jobId }
      : jobForm;
    const response = await api(data);
    if (response.success) {
      ScMessage.success(currentJob.value ? "修改成功" : "新增成功");
      dialogVisible.value = false;
      loadJobList();
    } else {
      ScMessage.error(response.msg || "操作失败");
    }
  } catch (error) {
    console.error("操作失败:", error);
    ScMessage.error("操作失败");
  } finally {
    submitLoading.value = false;
  }
};

// 删除
const handleDelete = async (row: JobInfo) => {
  try {
    await ScMessageBox.confirm(`确定要删除任务"${row.jobName}"吗？`, "删除确认", {
      type: "warning",
    });
    const response = await fetchJobDelete({ jobId: row.jobId! });
    if (response.success) {
      ScMessage.success("删除成功");
      loadJobList();
    } else {
      ScMessage.error(response.msg || "删除失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ScMessage.error("删除失败");
    }
  }
};

// 启动
const handleStart = async (row: JobInfo) => {
  try {
    const response = await fetchJobStart({ jobId: row.jobId! });
    if (response.success) {
      ScMessage.success("启动成功");
      loadJobList();
    } else {
      ScMessage.error(response.msg || "启动失败");
    }
  } catch (error) {
    console.error("启动失败:", error);
    ScMessage.error("启动失败");
  }
};

// 停止
const handleStop = async (row: JobInfo) => {
  try {
    await ScMessageBox.confirm(`确定要停止任务"${row.jobName}"吗？`, "停止确认", {
      type: "warning",
    });
    const response = await fetchJobStop({ jobId: row.jobId! });
    if (response.success) {
      ScMessage.success("停止成功");
      loadJobList();
    } else {
      ScMessage.error(response.msg || "停止失败");
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("停止失败:", error);
      ScMessage.error("停止失败");
    }
  }
};

// 手动执行
const handleTrigger = (row: JobInfo) => {
  currentJob.value = row;
  triggerParam.value = row.jobExecutorParam || "";
  triggerDialogVisible.value = true;
};

// 确认执行
const confirmTrigger = async () => {
  if (!currentJob.value) return;
  triggerLoading.value = true;
  try {
    const response = await fetchJobTrigger({
      jobId: currentJob.value.jobId!,
      executorParam: triggerParam.value || undefined,
    });
    if (response.success) {
      ScMessage.success("任务已触发执行");
      triggerDialogVisible.value = false;
    } else {
      ScMessage.error(response.msg || "执行失败");
    }
  } catch (error) {
    console.error("执行失败:", error);
    ScMessage.error("执行失败");
  } finally {
    triggerLoading.value = false;
  }
};

// 查看日志
const handleViewLog = (row: JobInfo) => {
  emit("view-log", row);
};

// 生命周期
onMounted(() => {
  loadJobList();
});

// 暴露方法
defineExpose({
  loadJobList,
  handleRefresh,
});
</script>

<style lang="scss" scoped>
.job-management-container {
  padding: 20px;

  .search-section {
    margin-bottom: 20px;

    .search-card {
      .search-container {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .search-left {
          display: flex;
          gap: 12px;

          .search-input {
            width: 280px;
          }

          .group-filter,
          .status-filter {
            width: 150px;
          }
        }

        .search-right {
          display: flex;
          gap: 8px;
        }
      }
    }
  }

  .jobs-section {
    .job-name-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;

      .job-name {
        font-weight: 500;
      }
    }

    .pagination-container {
      display: flex;
      justify-content: flex-end;
      margin-top: 20px;
    }
  }
}
</style>
