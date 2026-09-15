<template>
  <div class="page-container">
    <ReSearch :is-expanded="true" :show-add-btn="true" add-text="新建任务" @add="openCreate">
      <div class="system-page__search">
        <ReInput layout="modern" v-model="filter.taskName" placeholder="任务名称" clearable />
        <ReSelect v-model="filter.sourceType" placeholder="来源类型" clearable
          :data="[
            { label: '粘贴文本', value: 'TEXT' },
            { label: '网页URL', value: 'URL' },
            { label: '第三方API', value: 'API' },
            { label: '本地文件', value: 'FILE' },
          ]" />
        <ReSelect v-model="filter.subject" placeholder="学科" clearable
          :data="[
            { label: '语文', value: '语文' },
            { label: '数学', value: '数学' },
            { label: '英语', value: '英语' },
            { label: '物理', value: '物理' },
            { label: '化学', value: '化学' },
          ]" />
        <ReSelect v-model="filter.status" placeholder="状态" clearable
          :data="[
            { label: '已启用', value: 1 },
            { label: '已禁用', value: 0 },
          ]" />
      </div>
      <template #footer>
        <ReButton layout="modern" type="primary" icon="Search" @click="reload">查询</ReButton>
        <ReButton layout="modern" icon="Refresh" @click="handleReset">重置</ReButton>
      </template>
    </ReSearch>

    <el-card shadow="never" class="mt-3 flex-1">
      <el-table v-loading="loading" :data="tasks" border stripe>
        <el-table-column prop="collectTaskId" label="ID" width="70" />
        <el-table-column prop="collectTaskName" label="任务名称" min-width="180" show-overflow-tooltip />
        <el-table-column label="来源类型" width="120">
          <template #default="{ row }">
            <el-tag size="small" :type="sourceTagType(row.collectTaskSourceType)">
              {{ sourceLabel(row.collectTaskSourceType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="collectTaskSubject" label="学科" width="90" />
        <el-table-column prop="collectTaskGradeLevel" label="学段" width="90" />
        <el-table-column prop="collectTaskDifficulty" label="难度" width="80" />
        <el-table-column prop="collectTaskCron" label="定时 Cron" width="140" show-overflow-tooltip>
          <template #default="{ row }">
            <span class="text-xs text-gray-500">{{ row.collectTaskCron || '默认调度' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-switch
              :model-value="row.collectTaskStatus === 1"
              @change="(val: boolean) => handleStatusChange(row, val)"
              size="small"
            />
          </template>
        </el-table-column>
        <el-table-column prop="collectTaskTotalCount" label="累计采集" width="100" />
        <el-table-column label="最近执行" width="180">
          <template #default="{ row }">
            <template v-if="row.collectTaskLastRunTime">
              <el-tag size="small" :type="row.collectTaskLastRunStatus === 1 ? 'success' : 'danger'">
                {{ row.collectTaskLastRunCount ?? 0 }} 题
              </el-tag>
              <div class="text-xs text-gray-400 mt-1">{{ row.collectTaskLastRunTime }}</div>
            </template>
            <span v-else class="text-gray-400 text-xs">未执行</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="success" @click="handleTrigger(row)" :disabled="row.collectTaskStatus !== 1">
              采集
            </el-button>
            <el-button link type="primary" @click="openLogs(row)">日志</el-button>
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm :title="`确认删除任务「${row.collectTaskName}」吗？`" @confirm="remove(row)">
              <template #reference>
                <el-button link type="danger">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="reload"
          @size-change="reload"
        />
      </div>
    </el-card>

    <!-- 新建/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="form.collectTaskId ? '编辑采集任务' : '新建采集任务'" width="700" destroy-on-close>
      <el-form :model="form" label-width="100" label-position="right">
        <el-form-item label="任务名称" required>
          <el-input v-model="form.collectTaskName" placeholder="如：高中物理选择题-百度题库" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="来源类型" required>
          <el-radio-group v-model="form.collectTaskSourceType">
            <el-radio value="TEXT">粘贴文本</el-radio>
            <el-radio value="URL">网页URL</el-radio>
            <el-radio value="API">第三方API</el-radio>
            <el-radio value="FILE">本地文件</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="来源配置" required>
          <div class="w-full">
            <!-- TEXT 配置 -->
            <template v-if="form.collectTaskSourceType === 'TEXT'">
              <el-input
                v-model="textConfig"
                type="textarea"
                :rows="8"
                placeholder="粘贴题目文本内容，系统将通过 AI 自动识别提取题目&#10;&#10;示例：&#10;1. 下列哪个是哺乳动物？&#10;A. 蛇  B. 狗  C. 鳄鱼  D. 蜥蜴&#10;答案：B"
              />
            </template>
            <!-- URL 配置 -->
            <template v-else-if="form.collectTaskSourceType === 'URL'">
              <el-input v-model="urlConfig" placeholder="https://example.com/questions.json" />
              <div class="text-xs text-gray-400 mt-1">支持 JSON 格式题目数组的链接，或普通网页（AI 自动提取）</div>
            </template>
            <!-- API 配置 -->
            <template v-else-if="form.collectTaskSourceType === 'API'">
              <el-input v-model="apiConfig" placeholder="https://api.example.com/v1/questions?subject=数学" />
              <div class="text-xs text-gray-400 mt-1">返回 JSON 格式题目数组的第三方 API 地址</div>
            </template>
            <!-- FILE 配置 -->
            <template v-else-if="form.collectTaskSourceType === 'FILE'">
              <el-input v-model="fileConfig" placeholder="/data/questions.json" />
              <div class="text-xs text-gray-400 mt-1">服务器本地 JSON 文件的绝对路径，格式为题目数组</div>
            </template>
          </div>
        </el-form-item>
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="学科">
              <el-select v-model="form.collectTaskSubject" placeholder="选择学科" clearable style="width: 100%">
                <el-option v-for="s in subjects" :key="s" :label="s" :value="s" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="学段">
              <el-select v-model="form.collectTaskGradeLevel" placeholder="选择学段" clearable style="width: 100%">
                <el-option label="小学" value="PRIMARY" />
                <el-option label="初中" value="JUNIOR" />
                <el-option label="高中" value="SENIOR" />
                <el-option label="大学" value="UNIVERSITY" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="难度">
              <el-input-number v-model="form.collectTaskDifficulty" :min="1" :max="5" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="年级">
          <el-input v-model="form.collectTaskGrade" placeholder="如：高一" clearable />
        </el-form-item>
        <el-form-item label="定时 Cron">
          <el-input v-model="form.collectTaskCron" placeholder="0 0/30 * * * ? （留空使用默认调度周期）" clearable />
          <div class="text-xs text-gray-400 mt-1">Spring 6 Cron：秒 分 时 日 月 周，如 0 0 8 * * ? 表示每天 8:00</div>
        </el-form-item>
        <el-form-item label="任务状态">
          <el-switch v-model="form.collectTaskStatus" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.collectTaskRemark" type="textarea" :rows="2" placeholder="任务备注" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 采集日志对话框 -->
    <el-dialog v-model="logDialogVisible" title="采集执行日志" width="900" destroy-on-close>
      <el-table :data="logs" border stripe size="small" v-loading="logLoading">
        <el-table-column prop="collectLogId" label="日志ID" width="80" />
        <el-table-column label="执行状态" width="100">
          <template #default="{ row }">
            <el-tag size="small" :type="logStatusType(row.collectLogStatus)">
              {{ logStatusLabel(row.collectLogStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="collectLogSourceType" label="来源" width="80" />
        <el-table-column prop="collectLogQuestionCount" label="采集数" width="80" />
        <el-table-column prop="collectLogErrorMsg" label="错误信息" min-width="200" show-overflow-tooltip />
        <el-table-column prop="collectLogStartTime" label="开始时间" width="180" />
        <el-table-column prop="collectLogEndTime" label="结束时间" width="180" />
      </el-table>
      <div class="flex justify-end mt-3">
        <el-pagination
          v-model:current-page="logPageNo"
          :total="logTotal"
          :page-size="10"
          layout="total, prev, pager, next"
          @current-change="loadLogs"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { eduaiApi } from "../api/eduaiApi";
import type { CollectTask, CollectLog } from "../api/types";

const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理", "政治"];

// ---- 列表状态 ----
const loading = ref(false);
const tasks = ref<CollectTask[]>([]);
const pageNo = ref(1);
const pageSize = ref(10);
const total = ref(0);
const filter = reactive({
  taskName: "",
  sourceType: "" as string,
  subject: "" as string,
  status: null as number | null,
});

async function reload() {
  loading.value = true;
  try {
    const res = await eduaiApi.pageCollectTasks({
      pageNum: pageNo.value,
      pageSize: pageSize.value,
      taskName: filter.taskName || undefined,
      sourceType: filter.sourceType || undefined,
      subject: filter.subject || undefined,
      status: filter.status != null ? filter.status : undefined,
    });
    tasks.value = res.data;
    total.value = res.total;
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  filter.taskName = "";
  filter.sourceType = "";
  filter.subject = "";
  filter.status = null;
  pageNo.value = 1;
  reload();
}

// ---- 表单 ----
const dialogVisible = ref(false);
const saving = ref(false);
const form = reactive<Partial<CollectTask>>(getDefaultForm());
const textConfig = ref("");
const urlConfig = ref("");
const apiConfig = ref("");
const fileConfig = ref("");

function getDefaultForm(): Partial<CollectTask> {
  return {
    collectTaskId: undefined,
    collectTaskName: "",
    collectTaskSourceType: "TEXT",
    collectTaskSourceConfig: "",
    collectTaskSubject: "",
    collectTaskGradeLevel: "",
    collectTaskGrade: "",
    collectTaskDifficulty: 3,
    collectTaskCron: "",
    collectTaskStatus: 1,
    collectTaskRemark: "",
  };
}

function openCreate() {
  Object.assign(form, getDefaultForm());
  textConfig.value = "";
  urlConfig.value = "";
  apiConfig.value = "";
  fileConfig.value = "";
  dialogVisible.value = true;
}

function openEdit(row: CollectTask) {
  Object.assign(form, { ...row });
  // 解析 sourceConfig 到对应字段
  try {
    const config = JSON.parse(row.collectTaskSourceConfig || "{}");
    textConfig.value = config.text || "";
    urlConfig.value = config.url || "";
    apiConfig.value = config.apiUrl || "";
    fileConfig.value = config.path || "";
  } catch {
    textConfig.value = "";
    urlConfig.value = "";
    apiConfig.value = "";
    fileConfig.value = "";
  }
  dialogVisible.value = true;
}

function buildSourceConfig(): string {
  switch (form.collectTaskSourceType) {
    case "TEXT":
      return JSON.stringify({ text: textConfig.value });
    case "URL":
      return JSON.stringify({ url: urlConfig.value });
    case "API":
      return JSON.stringify({ apiUrl: apiConfig.value, method: "GET" });
    case "FILE":
      return JSON.stringify({ path: fileConfig.value });
    default:
      return "{}";
  }
}

async function submitForm() {
  if (!form.collectTaskName) return ElMessage.warning("请输入任务名称");
  if (!form.collectTaskSourceType) return ElMessage.warning("请选择来源类型");

  // 校验来源配置必填
  if (form.collectTaskSourceType === "TEXT" && !textConfig.value.trim()) {
    return ElMessage.warning("请输入粘贴的题目文本");
  }
  if (form.collectTaskSourceType === "URL" && !urlConfig.value.trim()) {
    return ElMessage.warning("请输入网页 URL");
  }
  if (form.collectTaskSourceType === "API" && !apiConfig.value.trim()) {
    return ElMessage.warning("请输入 API 地址");
  }
  if (form.collectTaskSourceType === "FILE" && !fileConfig.value.trim()) {
    return ElMessage.warning("请输入本地文件路径");
  }

  saving.value = true;
  try {
    await eduaiApi.saveCollectTask({
      ...form,
      collectTaskSourceConfig: buildSourceConfig(),
    });
    ElMessage.success("保存成功");
    dialogVisible.value = false;
    reload();
  } catch (e: any) {
    ElMessage.error(e?.message || "保存失败");
  } finally {
    saving.value = false;
  }
}

async function remove(row: CollectTask) {
  await eduaiApi.deleteCollectTask(row.collectTaskId);
  ElMessage.success("删除成功");
  reload();
}

// ---- 状态切换 ----
async function handleStatusChange(row: CollectTask, enabled: boolean) {
  await eduaiApi.changeCollectTaskStatus(row.collectTaskId, enabled ? 1 : 0);
  ElMessage.success(enabled ? "已启用" : "已禁用");
  reload();
}

// ---- 手动触发 ----
const triggerPending = ref<number | null>(null);
async function handleTrigger(row: CollectTask) {
  triggerPending.value = row.collectTaskId;
  try {
    const res = await eduaiApi.triggerCollectTask(row.collectTaskId);
    if (res.status === "success") {
      ElMessage.success(`采集完成：${res.message}`);
    } else {
      ElMessage.warning(res.message || "采集未完成");
    }
    reload();
  } catch (e: any) {
    ElMessage.error(e?.message || "触发失败");
  } finally {
    triggerPending.value = null;
  }
}

// ---- 日志 ----
const logDialogVisible = ref(false);
const logLoading = ref(false);
const logs = ref<CollectLog[]>([]);
const logPageNo = ref(1);
const logTotal = ref(0);
const currentLogTaskId = ref<number>(0);

function openLogs(row: CollectTask) {
  currentLogTaskId.value = row.collectTaskId;
  logPageNo.value = 1;
  logDialogVisible.value = true;
  loadLogs();
}

async function loadLogs() {
  logLoading.value = true;
  try {
    const res = await eduaiApi.pageCollectLogs({
      taskId: currentLogTaskId.value,
      pageNum: logPageNo.value,
      pageSize: 10,
    });
    logs.value = res.data;
    logTotal.value = res.total;
  } finally {
    logLoading.value = false;
  }
}

// ---- 辅助 ----
function sourceLabel(type?: string) {
  return { TEXT: "粘贴文本", URL: "网页URL", API: "第三方API", FILE: "本地文件" }[type ?? ""] || type;
}

function sourceTagType(type?: string) {
  return { TEXT: "info", URL: "primary", API: "warning", FILE: "success" }[type ?? ""] || "info";
}

function logStatusType(status?: number) {
  return { 0: "warning", 1: "success", 2: "danger" }[status ?? 0] as any;
}

function logStatusLabel(status?: number) {
  return { 0: "执行中", 1: "成功", 2: "失败" }[status ?? 0] || "未知";
}

onMounted(() => reload());
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
