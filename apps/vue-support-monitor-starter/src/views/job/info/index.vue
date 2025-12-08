<template>
  <div class="job-management-container">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <el-input
              v-model="form.jobDesc"
              placeholder="搜索任务名称或描述11111111111"
              class="search-input"
              clearable
              @input="handleSearch"
            >
              <template #prefix>
                <IconifyIconOnline icon="ri:search-line" />
              </template>
            </el-input>
            <el-select
              v-model="form.jobGroup"
              placeholder="选择任务组"
              class="app-filter"
              clearable
              @change="handleGroupFilter"
            >
              <el-option :value="0" label="全部任务组" />
              <el-option
                v-for="item in executorData"
                :key="item.monitorId"
                :label="item.monitorName"
                :value="item.monitorId"
              />
            </el-select>
            <el-select
              v-model="form.jobTriggerStatus"
              placeholder="任务状态"
              class="status-filter"
              clearable
              @change="handleStatusFilter"
            >
              <el-option label="运行中" :value="1" />
              <el-option label="已停止" :value="0" />
            </el-select>
          </div>
          <div class="search-right">
            <el-button-group class="view-toggle">
              <el-tooltip content="刷新" placement="top">
                <el-button type="primary" :loading="loading" @click="search">
                  <IconifyIconOnline icon="ri:refresh-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="卡片视图" placement="top">
                <el-button
                  :type="viewMode === 'card' ? 'primary' : 'default'"
                  @click="viewMode = 'card'"
                >
                  <IconifyIconOnline icon="ri:grid-line" />
                </el-button>
              </el-tooltip>
              <el-tooltip content="列表视图" placement="top">
                <el-button
                  :type="viewMode === 'table' ? 'primary' : 'default'"
                  @click="viewMode = 'table'"
                >
                  <IconifyIconOnline icon="ri:list-check" />
                </el-button>
              </el-tooltip>
            </el-button-group>
            <el-button type="primary" @click="add">
              <IconifyIconOnline icon="ri:add-line" />
              新建任务
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 任务列表 -->
    <div class="jobs-section">
      <div v-if="loading && jobList.length === 0" class="loading-container">
        <div class="loading-content">
          <el-skeleton :rows="3" animated />
          <p class="loading-text">正在加载任务数据...</p>
        </div>
      </div>

      <div v-else-if="filteredJobList.length === 0" class="empty-container">
        <el-empty description="暂无任务数据" :image-size="120">
          <template #description>
            <p class="empty-text">{{ getEmptyText() }}</p>
          </template>
          <el-button type="primary" @click="search">
            <IconifyIconOnline icon="ri:refresh-line" />
            刷新数据
          </el-button>
        </el-empty>
      </div>

      <!-- 卡片视图 -->
      <div v-else-if="viewMode === 'card'" class="jobs-grid">
        <transition-group name="job-card" tag="div" class="grid-container">
          <div
            v-for="(job, index) in filteredJobList"
            :key="job.jobId"
            class="job-card-wrapper"
            :style="{ animationDelay: `${index * 0.05}s` }"
          >
            <div
              class="job-card"
              :class="[
                getJobCardClass(job),
                { 'menu-active': showMenu && hoveredJob?.jobId === job.jobId },
              ]"
              @mouseenter="showActionMenu(job, $event)"
              @mouseleave="hideActionMenu"
            >
              <div class="card-header">
                <div class="job-info">
                  <div class="job-name">
                    <IconifyIconOnline icon="ri:timer-line" class="job-icon" />
                    <span class="name-text">{{ job.jobName }}</span>
                  </div>
                  <div class="job-cron">
                    <IconifyIconOnline icon="ri:time-line" class="cron-icon" />
                    <span
                      >{{ job.jobScheduleType }} {{ job.jobScheduleTime }}</span
                    >
                  </div>
                </div>
                <div class="job-status">
                  <el-tag
                    :type="getStatusType(job.jobTriggerStatus)"
                    :effect="job.jobTriggerStatus === 1 ? 'dark' : 'plain'"
                    class="status-tag"
                  >
                    <IconifyIconOnline
                      :icon="getStatusIcon(job.jobTriggerStatus)"
                    />
                    {{ getStatusText(job.jobTriggerStatus) }}
                  </el-tag>
                </div>
              </div>

              <div class="card-body">
                <div class="job-details">
                  <div class="detail-row">
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:code-box-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">任务类型</span>
                        <span class="detail-value">{{
                          job.jobGlueType || "-"
                        }}</span>
                      </div>
                    </div>
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:user-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">负责人</span>
                        <span class="detail-value">{{
                          job.jobAuthor || "-"
                        }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="detail-row">
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:apps-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">应用环境</span>
                        <span
                          class="detail-value"
                          :class="getEnvironmentClass(job.jobApplicationActive)"
                        >
                          {{ job.jobApplicationActive || "-" }}
                        </span>
                      </div>
                    </div>
                    <div class="detail-item">
                      <IconifyIconOnline
                        icon="ri:file-text-line"
                        class="detail-icon"
                      />
                      <div class="detail-info">
                        <span class="detail-label">描述</span>
                        <span class="detail-value">{{
                          job.jobDesc || "-"
                        }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <div class="footer-info">
                  <div class="job-group-info">
                    <IconifyIconOnline icon="ri:folder-line" />
                    <span>{{ getExecutorName(job.jobGroup) }}</span>
                  </div>
                </div>
                <div class="card-actions">
                  <el-button-group size="small">
                    <el-button @click.stop="edit(job)" title="编辑">
                      <IconifyIconOnline icon="ri:edit-line" />
                    </el-button>
                    <el-button @click.stop="trigger(job)" title="执行一次">
                      <IconifyIconOnline icon="ri:play-line" />
                    </el-button>
                    <el-button @click.stop="logger(job)" title="查看日志">
                      <IconifyIconOnline icon="ri:file-list-line" />
                    </el-button>
                    <el-button
                      @click.stop="
                        job.jobTriggerStatus === 1 ? stop(job) : start(job)
                      "
                      :title="job.jobTriggerStatus === 1 ? '停止' : '启动'"
                    >
                      <IconifyIconOnline
                        :icon="
                          job.jobTriggerStatus === 1
                            ? 'ri:pause-line'
                            : 'ri:play-fill'
                        "
                      />
                    </el-button>
                    <el-dropdown
                      trigger="click"
                      @command="(cmd) => handleCommand(cmd, job)"
                    >
                      <el-button @click.stop title="更多操作">
                        <IconifyIconOnline icon="ri:more-line" />
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="nextTriggerTime">
                            <IconifyIconOnline
                              icon="ri:calendar-line"
                              class="dropdown-icon"
                            />
                            下次执行时间
                          </el-dropdown-item>
                          <el-dropdown-item command="copy">
                            <IconifyIconOnline
                              icon="ri:file-copy-line"
                              class="dropdown-icon"
                            />
                            复制任务
                          </el-dropdown-item>
                          <el-dropdown-item command="delete" divided>
                            <IconifyIconOnline
                              icon="ri:delete-bin-line"
                              class="dropdown-icon"
                              style="color: var(--el-color-danger)"
                            />
                            <span style="color: var(--el-color-danger)"
                              >删除任务</span
                            >
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </el-button-group>
                </div>
              </div>
            </div>
          </div>
        </transition-group>
      </div>

      <!-- 表格视图 -->
      <div v-else class="jobs-table">
        <el-card shadow="never">
          <ScTable
            ref="tableRef"
            v-model:page="form"
            :url="loadJobData"
            :params="form"
            layout="table"
            @data-loaded="handleDataLoaded"
          >
            <el-table-column prop="jobName" label="任务名称" min-width="150" />
            <el-table-column
              prop="jobScheduleType"
              label="调度类型"
              width="100"
            />
            <el-table-column
              prop="jobScheduleTime"
              label="调度时间"
              width="120"
            />
            <el-table-column prop="jobGlueType" label="任务类型" width="100" />
            <el-table-column prop="jobAuthor" label="负责人" width="100" />
            <el-table-column prop="jobTriggerStatus" label="状态" width="100">
              <template #default="{ row }">
                <el-tag
                  :type="getStatusType(row.jobTriggerStatus)"
                  size="small"
                >
                  {{ getStatusText(row.jobTriggerStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="edit(row)"
                  >编辑</el-button
                >
                <el-button
                  type="success"
                  size="small"
                  link
                  @click="trigger(row)"
                  >执行</el-button
                >
                <el-button type="info" size="small" link @click="logger(row)"
                  >日志</el-button
                >
                <el-dropdown
                  trigger="click"
                  @command="(cmd) => handleCommand(cmd, row)"
                >
                  <el-button type="primary" size="small" link>更多</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item
                        :command="row.jobTriggerStatus === 1 ? 'stop' : 'start'"
                      >
                        {{ row.jobTriggerStatus === 1 ? "停止" : "启动" }}
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">复制</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <span style="color: var(--el-color-danger)">删除</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </ScTable>
        </el-card>
      </div>

      <!-- 卡片视图分页 -->
      <div
        v-if="viewMode === 'card' && filteredJobList.length > 0"
        class="pagination-container"
      >
        <el-pagination
          v-model:current-page="form.pageNum"
          v-model:page-size="form.pageSize"
          :page-sizes="[12, 24, 36, 48]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

    <!-- 弹窗组件 -->
    <el-dialog
      v-model="triggerShow"
      draggable
      :title="triggerTitle"
      class="job-dialog"
      width="500px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="任务参数">
          <el-input v-model="executorParam" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="机器地址">
          <el-input v-model="addressList" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="job-dialog-footer">
          <el-button :loading="triggerLoadding" @click="triggerShow = false"
            >取消</el-button
          >
          <el-button
            :loading="triggerLoadding"
            type="primary"
            @click="triggerExecute"
            >确定</el-button
          >
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="jobinfoNextTriggerTimeShow"
      draggable
      title="下一次执行时间"
      width="400px"
      class="job-dialog"
    >
      <div class="job-next-time-list">
        <div
          v-for="item in jobinfoNextTriggerTimeData"
          :key="item"
          class="job-next-time-item"
        >
          {{ item }}
        </div>
      </div>
    </el-dialog>

    <el-dialog
      v-model="jobgroupByIdShow"
      draggable
      title="注册地址"
      width="400px"
      class="job-dialog"
    >
      <el-empty v-if="jobgroupByIdData.length == 0" />
      <div v-else class="job-node-list">
        <div v-for="item in jobgroupByIdData" :key="item" class="job-node-item">
          <el-tag effect="light">{{ item?.host }}:{{ item?.port }}</el-tag>
        </div>
      </div>
    </el-dialog>

    <save ref="saveRef" @success="handlerSuccess" @close="saveShow = false" />
  </div>
</template>

<script setup lang="ts">
import { fetchAppList } from "@/api/monitor/app";
import {
  fetchJobDelete,
  fetchJobNextTriggerTime,
  fetchJobPageList,
  fetchJobStart,
  fetchJobStop,
  fetchJobTrigger,
} from "@/api/monitor/job";
import { ElMessage, ElMessageBox } from "element-plus";
import { computed, defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

// 动态导入组件
const Save = defineAsyncComponent(() => import("./save.vue"));

// 表格引用
const tableRef = ref(null);
const router = useRouter();

// 视图模式
const viewMode = ref<"card" | "table">("card");

// 表单和分页参数
const form = reactive({
  jobTriggerStatus: null as number | null,
  jobDesc: undefined as string | undefined,
  jobGroup: 0,
  pageNum: 1,
  pageSize: 12,
});

// 数据状态
const loading = ref(false);
const executorData = ref<any[]>([]);
const jobinfoNextTriggerTimeData = ref<string[]>([]);
const jobgroupByIdData = ref<any[]>([]);
const total = ref(0);
const jobList = ref<any[]>([]);

// 卡片交互状态
const showMenu = ref(false);
const hoveredJob = ref<any>(null);

// 计算属性 - 过滤后的任务列表
const filteredJobList = computed(() => {
  return jobList.value;
});

/**
 * 加载任务数据的URL函数
 * 该函数会作为ScTable的url属性使用
 */
const loadJobData = async (params) => {
  try {
    const res = await fetchJobPageList({ ...form, ...params });
    return {
      data: res?.data.data || [],
      total: res?.data.total || 0,
    };
  } catch (error) {
    console.error("获取数据失败:", error);
    return {
      data: [],
      total: 0,
    };
  }
};

/**
 * 处理数据加载完成的回调
 */
const handleDataLoaded = (result) => {
  jobList.value = result.data || [];
  total.value = result.total || 0;
};

// 弹窗状态
const saveShow = ref(false);
const triggerShow = ref(false);
const triggerTitle = ref("");
const triggerId = ref(0);
const executorParam = ref("");
const addressList = ref("");
const triggerLoadding = ref(false);
const jobinfoNextTriggerTimeShow = ref(false);
const jobgroupByIdShow = ref(false);

// 初始化数据
const initial = async () => {
  loading.value = true;
  try {
    const res = await fetchAppList({});
    executorData.value = res?.data || [];
    form.jobGroup =
      executorData.value && executorData.value.length === 1
        ? executorData.value[0].monitorId
        : 0;
    await fetchJobList();
  } catch (error) {
    console.error("初始化失败:", error);
  } finally {
    loading.value = false;
  }
};

// 获取任务列表
const fetchJobList = async () => {
  loading.value = true;
  try {
    const res = await fetchJobPageList(form);
    jobList.value = res?.data?.data || [];
    total.value = res?.data?.total || 0;
  } catch (error) {
    console.error("获取任务列表失败:", error);
    jobList.value = [];
  } finally {
    loading.value = false;
  }
};

// 搜索方法
const search = async (param?: any) => {
  if (param) {
    Object.assign(form, param);
  }
  if (viewMode.value === "card") {
    await fetchJobList();
  } else {
    tableRef.value?.refresh();
  }
};

// 搜索输入处理
const handleSearch = () => {
  form.pageNum = 1;
  search();
};

// 任务组筛选处理
const handleGroupFilter = () => {
  form.pageNum = 1;
  search();
};

// 状态筛选处理
const handleStatusFilter = () => {
  form.pageNum = 1;
  search();
};

// 分页大小变化
const handleSizeChange = (size: number) => {
  form.pageSize = size;
  form.pageNum = 1;
  search();
};

// 页码变化
const handleCurrentChange = (page: number) => {
  form.pageNum = page;
  search();
};

// 处理成功回调
const handlerSuccess = () => {
  search(undefined);
};

// 编辑任务
const edit = (row) => {
  saveShow.value = true;
  setTimeout(() => {
    saveRef.value.setExecutorData(executorData.value).open("edit", row);
  });
};

// 复制任务
const copy = (row) => {
  saveShow.value = true;
  setTimeout(() => {
    saveRef.value.setExecutorData(executorData.value).open("copy", row);
  });
};

// 删除任务
const del = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要删除任务 "${row.jobName}" 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    const res = await fetchJobDelete({ id: row.jobId });
    if (res.code === "00000") {
      jobList.value = jobList.value.filter((it) => it.jobId != row.jobId);
      ElMessage.success("操作成功");
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      ElMessage.error("删除失败");
    }
  }
};

// 启动任务
const start = async (row) => {
  try {
    const res = await fetchJobStart({ jobId: row.jobId });
    if (res.code === "00000") {
      const item = jobList.value.find((it) => it.jobId == row.jobId);
      if (item) {
        item.jobTriggerStatus = 1;
      }
      ElMessage.success("操作成功");
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    console.error("启动失败:", error);
    ElMessage.error("启动失败");
  }
};

// 停止任务
const stop = async (row) => {
  try {
    await ElMessageBox.confirm(`确定要停止任务 "${row.jobName}" 吗？`, "提示", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消",
    });

    const res = await fetchJobStop({ jobId: row.jobId });
    if (res.code === "00000") {
      const item = jobList.value.find((it) => it.jobId == row.jobId);
      if (item) {
        item.jobTriggerStatus = 0;
      }
      ElMessage.success("操作成功");
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("停止失败:", error);
      ElMessage.error("停止失败");
    }
  }
};

// 添加任务
const add = () => {
  saveShow.value = true;
  setTimeout(() => {
    saveRef.value.open("add", {});
  });
};

// 执行任务
const triggerExecute = async () => {
  triggerLoadding.value = true;
  try {
    const res = await fetchJobTrigger({
      id: triggerId.value,
      executorParam: executorParam.value,
      addressList: addressList.value,
    });

    if (res.code === "00000") {
      ElMessage.success("操作成功");
      triggerShow.value = false;
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    console.error("执行失败:", error);
    ElMessage.error("执行失败");
  } finally {
    triggerLoadding.value = false;
  }
};

// 触发执行
const trigger = (row) => {
  triggerTitle.value = row.jobName + "(执行一次)";
  triggerShow.value = true;
  triggerId.value = row.jobId;
};

// 查看注册节点
const jobgroupById = async (row: any) => {
  ElMessage.info("服务节点信息功能已移除");
  jobgroupByIdData.value = [];
  jobgroupByIdShow.value = true;
};

// 查看日志
const logger = (row) => {
  router.push({
    path: "/job-log",
    query: {
      jobLogApp: row.jobApplicationName,
      jobLogProfile: row.jobApplicationProfile,
    },
  });
};

// 查看下一次执行时间
const nextTriggerTime = async (row) => {
  try {
    const res = await fetchJobNextTriggerTime({
      jobScheduleType: row.jobScheduleType,
      jobScheduleTime: row.jobScheduleTime,
    });

    if (res.code === "00000") {
      jobinfoNextTriggerTimeData.value = res.data;
      jobinfoNextTriggerTimeShow.value = true;
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    console.error("获取执行时间失败:", error);
    ElMessage.error("获取执行时间失败");
  }
};

// 获取执行器名称
const getExecutorName = (jobGroup) => {
  const executor = executorData.value.find(
    (item) => item.monitorId === jobGroup
  );
  return executor ? executor.monitorName : "未知";
};

// 获取状态图标
const getStatusIcon = (status) => {
  return status === 1 ? "ri:checkbox-circle-fill" : "ri:close-circle-fill";
};

// 获取状态类型
const getStatusType = (status) => {
  return status === 1 ? "success" : "danger";
};

// 获取卡片样式类
const getJobCardClass = (job) => {
  return job.jobTriggerStatus === 1 ? "job-running" : "job-stopped";
};

// 获取环境样式类
const getEnvironmentClass = (env: string | null | undefined) => {
  if (!env) return "";
  switch (env.toUpperCase()) {
    case "PROD":
    case "PRODUCTION":
      return "env-prod";
    case "DEV":
    case "DEVELOPMENT":
      return "env-dev";
    case "TEST":
      return "env-test";
    default:
      return "env-default";
  }
};

// 显示操作菜单
const showActionMenu = (job: any, event: MouseEvent) => {
  hoveredJob.value = job;
  showMenu.value = true;
};

// 隐藏操作菜单
const hideActionMenu = () => {
  showMenu.value = false;
  hoveredJob.value = null;
};

// 获取空状态文本
const getEmptyText = () => {
  if (form.jobDesc) {
    return `没有找到包含 "${form.jobDesc}" 的任务`;
  }
  if (form.jobTriggerStatus !== null) {
    return form.jobTriggerStatus === 1
      ? "没有运行中的任务"
      : "没有已停止的任务";
  }
  return "暂无任务数据，点击下方按钮刷新";
};

// 获取状态文本
const getStatusText = (status) => {
  return status === 1 ? "运行中" : "已停止";
};

// 处理下拉菜单命令
const handleCommand = (command, row) => {
  switch (command) {
    case "nextTriggerTime":
      nextTriggerTime(row);
      break;
    case "jobgroupById":
      jobgroupById(row);
      break;
    case "start":
      start(row);
      break;
    case "stop":
      stop(row);
      break;
    case "copy":
      copy(row);
      break;
    case "delete":
      del(row);
      break;
  }
};

// 组件引用
const saveRef = ref(null);

// 初始化
onMounted(() => {
  initial();
});
</script>

<style scoped lang="scss">
.job-management-container {
  padding: 24px;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(
      ellipse at 0% 0%,
      rgba(99, 102, 241, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 100% 0%,
      rgba(168, 85, 247, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 100% 100%,
      rgba(236, 72, 153, 0.08) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at 0% 100%,
      rgba(34, 197, 94, 0.08) 0%,
      transparent 50%
    ),
    linear-gradient(
      180deg,
      var(--el-bg-color) 0%,
      var(--el-fill-color-lighter) 100%
    );

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
      linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
    background-size: 60px 60px;
    z-index: 0;
    animation: gridMove 20s linear infinite;
  }

  &::after {
    content: "";
    position: absolute;
    top: 10%;
    right: 10%;
    width: 400px;
    height: 400px;
    background: radial-gradient(
      circle,
      rgba(99, 102, 241, 0.15) 0%,
      transparent 70%
    );
    border-radius: 50%;
    filter: blur(60px);
    animation: floatGlow 8s ease-in-out infinite;
    pointer-events: none;
    z-index: 0;
  }

  > * {
    position: relative;
    z-index: 2;
  }
}

.search-section {
  margin-bottom: 28px;

  .search-card {
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    background: linear-gradient(
      145deg,
      rgba(255, 255, 255, 0.95) 0%,
      rgba(248, 250, 252, 0.9) 100%
    );
    backdrop-filter: blur(20px) saturate(180%);
    box-shadow:
      0 4px 24px rgba(0, 0, 0, 0.06),
      0 1px 2px rgba(0, 0, 0, 0.04),
      inset 0 1px 0 rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;

    &:hover {
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 rgba(255, 255, 255, 0.9);
    }

    :deep(.el-card__body) {
      padding: 20px 28px;
    }

    .search-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 20px;

      .search-left {
        display: flex;
        align-items: center;
        gap: 14px;
        flex: 1;

        .search-input {
          width: 300px;

          :deep(.el-input__wrapper) {
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;

            &:hover,
            &:focus-within {
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
              border-color: rgba(99, 102, 241, 0.3);
            }
          }
        }

        .app-filter,
        .status-filter {
          width: 160px;

          :deep(.el-select__wrapper) {
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;

            &:hover {
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
              border-color: rgba(99, 102, 241, 0.3);
            }
          }
        }
      }

      .search-right {
        display: flex;
        align-items: center;
        gap: 12px;

        .view-toggle {
          :deep(.el-button) {
            border-radius: 10px;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

            &:first-child {
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
            }

            &:last-child {
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }

            &:hover {
              transform: translateY(-2px);
            }
          }
        }
      }
    }
  }
}

.jobs-section {
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    .loading-content {
      text-align: center;
      max-width: 400px;

      .loading-text {
        margin-top: 16px;
        color: #64748b;
        font-size: 16px;
      }
    }
  }

  .empty-container {
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 60px 20px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);

    .empty-text {
      color: #64748b;
      font-size: 16px;
      margin: 16px 0;
    }
  }

  .jobs-grid {
    .grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 32px;
      padding: 8px;

      @media (max-width: 1400px) {
        grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
        gap: 28px;
      }

      @media (max-width: 1200px) {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 24px;
      }

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 20px;
        padding: 4px;
      }

      .job-card-wrapper {
        animation: cardSlideIn 0.5s ease-out both;

        .job-card {
          background: #fff;
          border-radius: 16px;
          padding: 0;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          position: relative;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);

          &:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
            border-color: rgba(59, 130, 246, 0.3);
          }

          &.menu-active {
            transform: translateY(-4px);
            box-shadow: 0 16px 40px rgba(0, 0, 0, 0.15);
            border-color: rgba(59, 130, 246, 0.5);
          }

          &::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            z-index: 1;
          }

          &.job-running::before {
            background: linear-gradient(90deg, #10b981, #34d399);
          }

          &.job-stopped::before {
            background: linear-gradient(90deg, #ef4444, #f87171);
          }

          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 20px 20px 16px;
            border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            background: linear-gradient(135deg, #fff 0%, #f8fafc 100%);

            .job-info {
              flex: 1;
              min-width: 0;

              .job-name {
                display: flex;
                align-items: center;
                font-size: 16px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 8px;

                .job-icon {
                  width: 36px;
                  height: 36px;
                  margin-right: 10px;
                  background: linear-gradient(135deg, #3b82f6, #2563eb);
                  color: #fff;
                  border-radius: 10px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 18px;
                  flex-shrink: 0;
                  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
                }

                .name-text {
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }
              }

              .job-cron {
                display: inline-flex;
                align-items: center;
                font-size: 13px;
                color: #64748b;
                font-family: "JetBrains Mono", "Consolas", monospace;
                background: #f1f5f9;
                padding: 6px 10px;
                border-radius: 8px;
                font-weight: 500;

                .cron-icon {
                  margin-right: 6px;
                  font-size: 13px;
                  color: #94a3b8;
                }
              }
            }

            .job-status {
              flex-shrink: 0;
              margin-left: 12px;

              .status-tag {
                font-weight: 600;
                border-radius: 8px;
                padding: 6px 12px;
                font-size: 12px;

                i {
                  margin-right: 4px;
                  font-size: 12px;
                }
              }
            }
          }

          .card-body {
            padding: 16px 20px;
            flex: 1;
            display: flex;
            flex-direction: column;
            background: #fff;

            .job-details {
              .detail-row {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-bottom: 10px;

                &:last-child {
                  margin-bottom: 0;
                }

                .detail-item {
                  display: flex;
                  align-items: center;
                  padding: 10px 12px;
                  background: #f8fafc;
                  border-radius: 10px;
                  transition: all 0.25s ease;

                  &:hover {
                    background: #f1f5f9;
                    transform: translateX(2px);
                  }

                  .detail-icon {
                    width: 28px;
                    height: 28px;
                    background: linear-gradient(135deg, #3b82f6, #2563eb);
                    color: #fff;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    margin-right: 10px;
                    flex-shrink: 0;
                  }

                  .detail-info {
                    flex: 1;
                    min-width: 0;

                    .detail-label {
                      display: block;
                      font-size: 11px;
                      color: #94a3b8;
                      line-height: 1.3;
                      font-weight: 500;
                    }

                    .detail-value {
                      display: block;
                      font-size: 13px;
                      font-weight: 600;
                      color: #1e293b;
                      line-height: 1.4;
                      overflow: hidden;
                      text-overflow: ellipsis;
                      white-space: nowrap;

                      &.env-prod {
                        color: #dc2626;
                      }

                      &.env-dev {
                        color: #2563eb;
                      }

                      &.env-test {
                        color: #7c3aed;
                      }
                    }
                  }
                }
              }
            }
          }

          .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 20px 16px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            margin-top: auto;

            .footer-info {
              display: flex;
              gap: 16px;
              flex: 1;

              .job-group-info {
                display: flex;
                align-items: center;
                font-size: 12px;
                color: #64748b;
                font-weight: 500;

                i {
                  margin-right: 6px;
                  font-size: 14px;
                }
              }
            }

            .card-actions {
              flex-shrink: 0;

              :deep(.el-button-group) {
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);

                .el-button {
                  border-radius: 0;
                  padding: 6px 10px;
                  font-size: 12px;
                  height: 30px;

                  &:first-child {
                    border-top-left-radius: 8px;
                    border-bottom-left-radius: 8px;
                  }

                  &:last-child {
                    border-top-right-radius: 8px;
                    border-bottom-right-radius: 8px;
                  }

                  i {
                    font-size: 14px;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  .jobs-table {
    :deep(.el-card) {
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }
  }

  .pagination-container {
    margin-top: 24px;
    display: flex;
    justify-content: center;
    padding: 16px;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    border-radius: 12px;
  }
}

.dropdown-icon {
  margin-right: 8px;
}

.job-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
  }
}

.job-dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.job-next-time-list {
  max-height: 300px;
  overflow-y: auto;

  .job-next-time-item {
    padding: 12px;
    margin-bottom: 10px;
    background: var(--el-fill-color-light);
    border-radius: 8px;
    font-family: monospace;
    border-left: 3px solid var(--el-color-primary);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.job-node-list {
  max-height: 300px;
  overflow-y: auto;

  .job-node-item {
    margin-bottom: 10px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

@keyframes gridMove {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 60px 60px;
  }
}

@keyframes floatGlow {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-30px, 20px) scale(1.1);
    opacity: 0.7;
  }
}

@keyframes cardSlideIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.job-card-enter-active,
.job-card-leave-active {
  transition: all 0.5s ease;
}

.job-card-enter-from {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

.job-card-leave-to {
  opacity: 0;
  transform: translateY(-30px) scale(0.9);
}

.job-card-move {
  transition: transform 0.5s ease;
}

@media (max-width: 768px) {
  .job-management-container {
    padding: 16px;
  }

  .search-section {
    .search-card {
      .search-container {
        flex-direction: column;
        align-items: stretch;

        .search-left {
          flex-direction: column;

          .search-input,
          .app-filter,
          .status-filter {
            width: 100%;
          }
        }

        .search-right {
          justify-content: center;
        }
      }
    }
  }
}
</style>
