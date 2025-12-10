<template>
  <div class="job-management-container">
    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card class="search-card" shadow="never">
        <div class="search-container">
          <div class="search-left">
            <el-input
              v-model="form.jobDesc"
              placeholder="搜索任务名称或描述"
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
      <ScTable
        ref="tableRef"
        :url="loadJobData"
        :params="searchParams"
        row-key="jobId"
        layout="card"
        :col-size="4"
        :row-size="3"
        :page-size="12"
        table-name="job-info-list"
      >
        <template #default="{ row }">
          <div class="job-card" :class="[getJobCardClass(row)]">
            <!-- 状态指示条 -->
            <div
              class="status-bar"
              :class="row.jobTriggerStatus === 1 ? 'running' : 'stopped'"
            ></div>

            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="header-left">
                <div
                  class="job-icon-wrapper"
                  :class="row.jobTriggerStatus === 1 ? 'active' : ''"
                >
                  <IconifyIconOnline
                    icon="ri:timer-flash-line"
                    class="job-icon"
                  />
                  <span
                    class="status-dot"
                    :class="row.jobTriggerStatus === 1 ? 'online' : 'offline'"
                  ></span>
                </div>
                <div class="job-title-info">
                  <h3 class="job-name">{{ row.jobName }}</h3>
                  <div class="job-meta">
                    <span class="meta-item">
                      <IconifyIconOnline icon="ri:user-3-line" />
                      {{ row.jobAuthor || "-" }}
                    </span>
                    <span class="meta-divider">|</span>
                    <span
                      class="meta-item"
                      :class="getEnvironmentClass(row.jobApplicationActive)"
                    >
                      {{ row.jobApplicationActive || "-" }}
                    </span>
                  </div>
                </div>
              </div>
              <el-dropdown
                trigger="click"
                @command="(cmd) => handleCommand(cmd, row)"
                class="more-dropdown"
                popper-class="job-dropdown-popper"
              >
                <el-button class="more-btn" @click.stop>
                  <IconifyIconOnline icon="ri:more-2-fill" />
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu class="job-dropdown-menu">
                    <div class="dropdown-header">
                      <div class="header-icon">
                        <IconifyIconOnline icon="ri:settings-3-line" />
                      </div>
                      <span>操作菜单</span>
                    </div>
                    <el-dropdown-item command="edit">
                      <div class="dropdown-item-content">
                        <div class="dropdown-item-icon edit">
                          <IconifyIconOnline icon="ri:edit-line" />
                        </div>
                        <div class="dropdown-item-text">
                          <span class="item-title">编辑任务</span>
                          <span class="item-desc">修改任务配置信息</span>
                        </div>
                        <div class="item-arrow">
                          <IconifyIconOnline icon="ri:arrow-right-s-line" />
                        </div>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item command="copy">
                      <div class="dropdown-item-content">
                        <div class="dropdown-item-icon copy">
                          <IconifyIconOnline icon="ri:file-copy-line" />
                        </div>
                        <div class="dropdown-item-text">
                          <span class="item-title">复制任务</span>
                          <span class="item-desc">创建任务副本</span>
                        </div>
                        <div class="item-arrow">
                          <IconifyIconOnline icon="ri:arrow-right-s-line" />
                        </div>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item command="nextTriggerTime">
                      <div class="dropdown-item-content">
                        <div class="dropdown-item-icon schedule">
                          <IconifyIconOnline icon="ri:calendar-schedule-line" />
                        </div>
                        <div class="dropdown-item-text">
                          <span class="item-title">执行计划</span>
                          <span class="item-desc">查看下次执行时间</span>
                        </div>
                        <div class="item-arrow">
                          <IconifyIconOnline icon="ri:arrow-right-s-line" />
                        </div>
                      </div>
                    </el-dropdown-item>
                    <el-dropdown-item command="log">
                      <div class="dropdown-item-content">
                        <div class="dropdown-item-icon log">
                          <IconifyIconOnline icon="ri:file-list-3-line" />
                        </div>
                        <div class="dropdown-item-text">
                          <span class="item-title">执行日志</span>
                          <span class="item-desc">查看历史执行记录</span>
                        </div>
                        <div class="item-arrow">
                          <IconifyIconOnline icon="ri:arrow-right-s-line" />
                        </div>
                      </div>
                    </el-dropdown-item>
                    <div class="dropdown-divider"></div>
                    <el-dropdown-item command="delete">
                      <div class="dropdown-item-content danger">
                        <div class="dropdown-item-icon delete">
                          <IconifyIconOnline icon="ri:delete-bin-line" />
                        </div>
                        <div class="dropdown-item-text">
                          <span class="item-title">删除任务</span>
                          <span class="item-desc">此操作不可恢复</span>
                        </div>
                        <div class="item-arrow danger">
                          <IconifyIconOnline icon="ri:arrow-right-s-line" />
                        </div>
                      </div>
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <!-- 卡片内容 -->
            <div class="card-body">
              <!-- 调度信息 -->
              <div class="schedule-info">
                <div class="schedule-badge">
                  <IconifyIconOnline icon="ri:time-line" />
                  <span>{{ row.jobScheduleType }}</span>
                </div>
                <code class="cron-expression">{{
                  row.jobScheduleTime || "-"
                }}</code>
              </div>

              <!-- 任务详情 -->
              <div class="job-details">
                <div class="detail-item">
                  <span class="detail-label">任务类型</span>
                  <span class="detail-value">
                    <el-tag size="small" effect="plain">{{
                      row.jobGlueType || "BEAN"
                    }}</el-tag>
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">执行器</span>
                  <span class="detail-value">{{
                    getExecutorName(row.jobGroup)
                  }}</span>
                </div>
              </div>
            </div>

            <!-- 卡片底部操作 -->
            <div class="card-footer">
              <el-tooltip content="执行一次" placement="top">
                <el-button
                  class="action-btn trigger"
                  @click.stop="trigger(row)"
                >
                  <IconifyIconOnline icon="ri:flashlight-line" />
                  <span>执行</span>
                </el-button>
              </el-tooltip>
              <el-tooltip
                :content="row.jobTriggerStatus === 1 ? '停止任务' : '启动任务'"
                placement="top"
              >
                <el-button
                  class="action-btn power"
                  :class="row.jobTriggerStatus === 1 ? 'stop' : 'start'"
                  @click.stop="
                    row.jobTriggerStatus === 1 ? stop(row) : start(row)
                  "
                >
                  <IconifyIconOnline
                    :icon="
                      row.jobTriggerStatus === 1
                        ? 'ri:stop-circle-line'
                        : 'ri:play-circle-line'
                    "
                  />
                  <span>{{
                    row.jobTriggerStatus === 1 ? "停止" : "启动"
                  }}</span>
                </el-button>
              </el-tooltip>
            </div>
          </div>
        </template>
      </ScTable>
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
      width="420px"
      class="job-dialog next-trigger-dialog"
      align-center
      append-to-body
      destroy-on-close
      :close-on-click-modal="true"
    >
      <template #header>
        <div class="dialog-header">
          <div class="header-icon">
            <IconifyIconOnline icon="ri:calendar-schedule-line" />
          </div>
          <span class="header-title">下一次执行时间</span>
        </div>
      </template>
      <div class="job-next-time-list">
        <div
          v-for="(item, index) in jobinfoNextTriggerTimeData"
          :key="item"
          class="job-next-time-item"
        >
          <span class="time-index">{{ index + 1 }}</span>
          <span class="time-value">{{ item }}</span>
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
import { message } from "@repo/utils";
import { ElMessageBox } from "element-plus";
import { defineAsyncComponent, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

// 动态导入组件
const Save = defineAsyncComponent(() => import("./save.vue"));

// 表格引用
const tableRef = ref();
const router = useRouter();

// 表单参数
const form = reactive({
  jobTriggerStatus: null as number | null,
  jobDesc: undefined as string | undefined,
  jobGroup: 0,
});

// 搜索参数（用于 ScTable）
const searchParams = reactive({
  jobTriggerStatus: null as number | null,
  jobDesc: undefined as string | undefined,
  jobGroup: 0,
});

// 数据状态
const executorData = ref<any[]>([]);
const jobinfoNextTriggerTimeData = ref<string[]>([]);
const jobgroupByIdData = ref<any[]>([]);

/**
 * 加载任务数据的URL函数
 * 该函数会作为ScTable的url属性使用
 * @param params 搜索参数
 * @returns 分页数据
 */
const loadJobData = async (params: any) => {
  try {
    const res = await fetchJobPageList({ ...searchParams, ...params });
    return {
      code: "00000",
      data: {
        records: res?.data?.data || [],
        total: res?.data?.total || 0,
        size: params.size || 12,
        current: params.page || 1,
      },
    };
  } catch (error) {
    console.error("获取任务列表失败:", error);
    return {
      code: "99999",
      data: { records: [], total: 0, size: 12, current: 1 },
    };
  }
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
  try {
    const res = await fetchAppList({});
    executorData.value = res?.data || [];
    const defaultGroup =
      executorData.value && executorData.value.length === 1
        ? executorData.value[0].monitorId
        : 0;
    form.jobGroup = defaultGroup;
    searchParams.jobGroup = defaultGroup;
  } catch (error) {
    console.error("初始化失败:", error);
  }
};

// 搜索输入处理
const handleSearch = () => {
  searchParams.jobDesc = form.jobDesc;
  tableRef.value?.reload?.(searchParams, 1);
};

// 任务组筛选处理
const handleGroupFilter = () => {
  searchParams.jobGroup = form.jobGroup;
  tableRef.value?.reload?.(searchParams, 1);
};

// 状态筛选处理
const handleStatusFilter = () => {
  searchParams.jobTriggerStatus = form.jobTriggerStatus;
  tableRef.value?.reload?.(searchParams, 1);
};

// 处理成功回调
const handlerSuccess = () => {
  tableRef.value?.reload?.();
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
      message("操作成功", { type: "success" });
      tableRef.value?.reload?.();
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("删除失败:", error);
      message("删除失败", { type: "error" });
    }
  }
};

// 启动任务
const start = async (row) => {
  try {
    const res = await fetchJobStart({ jobId: row.jobId });
    if (res.code === "00000") {
      message("操作成功", { type: "success" });
      tableRef.value?.reload?.();
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    console.error("启动失败:", error);
    message("启动失败", { type: "error" });
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
      message("操作成功", { type: "success" });
      tableRef.value?.reload?.();
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    if (error !== "cancel") {
      console.error("停止失败:", error);
      message("停止失败", { type: "error" });
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
      message("操作成功", { type: "success" });
      triggerShow.value = false;
    } else {
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    console.error("执行失败:", error);
    message("执行失败", { type: "error" });
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
  message("服务节点信息功能已移除", { type: "info" });
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
      message(res.msg, { type: "error" });
    }
  } catch (error) {
    console.error("获取执行时间失败:", error);
    message("获取执行时间失败", { type: "error" });
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
    case "edit":
      edit(row);
      break;
    case "log":
      logger(row);
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
  padding: 16px;
  position: relative;
  overflow: hidden;
  min-height: calc(100vh - 120px);
  background: var(--el-bg-color);

  > * {
    position: relative;
    z-index: 2;
  }
}

.search-section {
  margin-bottom: 16px;

  .search-card {
    border-radius: 12px;
    border: none;
    background: var(--el-bg-color);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

    :deep(.el-card__body) {
      padding: 16px 20px;
    }

    .search-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;

      .search-left {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1;

        .search-input {
          width: 280px;

          :deep(.el-input__wrapper) {
            border-radius: 8px;
            background: var(--el-fill-color-light);
            box-shadow: none;
            border: 1px solid transparent;
            transition: all 0.2s ease;

            &:hover,
            &:focus-within {
              border-color: var(--el-color-primary-light-5);
              background: var(--el-bg-color);
            }
          }
        }

        .app-filter,
        .status-filter {
          width: 140px;

          :deep(.el-select__wrapper) {
            border-radius: 8px;
            background: var(--el-fill-color-light);
            box-shadow: none;
            border: 1px solid transparent;
            transition: all 0.2s ease;

            &:hover {
              border-color: var(--el-color-primary-light-5);
              background: var(--el-bg-color);
            }
          }
        }
      }

      .search-right {
        display: flex;
        align-items: center;
        gap: 10px;

        :deep(.el-button--primary) {
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
        }
      }
    }
  }
}

.jobs-section {
  flex: 1;

  .job-card {
    background: var(--el-bg-color);
    border-radius: 16px;
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
      border-color: var(--el-color-primary-light-3);
    }

    // 状态指示条
    .status-bar {
      height: 4px;
      width: 100%;

      &.running {
        background: linear-gradient(90deg, #10b981, #34d399);
      }

      &.stopped {
        background: linear-gradient(90deg, #ef4444, #f87171);
      }
    }

    // 卡片头部
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px;

      .header-left {
        display: flex;
        gap: 12px;
        flex: 1;
        min-width: 0;
      }

      .job-icon-wrapper {
        position: relative;
        width: 44px;
        height: 44px;
        border-radius: 12px;
        background: linear-gradient(135deg, #6366f1, #8b5cf6);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);

        &.active {
          background: linear-gradient(135deg, #10b981, #059669);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
        }

        .job-icon {
          font-size: 22px;
          color: #fff;
        }

        .status-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid var(--el-bg-color);

          &.online {
            background: #10b981;
          }

          &.offline {
            background: #ef4444;
          }
        }
      }

      .job-title-info {
        flex: 1;
        min-width: 0;

        .job-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin: 0 0 6px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .job-meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--el-text-color-secondary);

          .meta-item {
            display: flex;
            align-items: center;
            gap: 4px;
          }

          .meta-divider {
            color: var(--el-border-color);
          }

          .env-prod {
            color: var(--el-color-danger);
            font-weight: 600;
          }
          .env-dev {
            color: var(--el-color-primary);
            font-weight: 600;
          }
          .env-test {
            color: var(--el-color-warning);
            font-weight: 600;
          }
        }
      }

      .more-btn {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        border: none;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
        padding: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: all 0.2s ease;

        &:hover {
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
        }
      }
    }

    // 卡片内容
    .card-body {
      padding: 0 16px 16px;
      flex: 1;

      .schedule-info {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;

        .schedule-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--el-color-primary-light-9);
          color: var(--el-color-primary);
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
        }

        .cron-expression {
          font-family: "SF Mono", "Monaco", "Consolas", monospace;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          background: var(--el-fill-color-light);
          padding: 4px 10px;
          border-radius: 6px;
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      .job-details {
        display: flex;
        gap: 12px;

        .detail-item {
          flex: 1;
          padding: 10px 12px;
          background: var(--el-fill-color-lighter);
          border-radius: 10px;
          transition: all 0.2s ease;

          &:hover {
            background: var(--el-fill-color-light);
            transform: translateX(2px);
          }

          .detail-label {
            font-size: 11px;
            color: var(--el-text-color-placeholder);
            margin-bottom: 4px;
            display: block;
          }

          .detail-value {
            font-size: 13px;
            font-weight: 600;
            color: var(--el-text-color-primary);
          }
        }
      }
    }

    // 卡片底部
    .card-footer {
      display: flex;
      gap: 10px;
      padding: 12px 16px 16px;

      .action-btn {
        flex: 1;
        height: 38px;
        border-radius: 10px;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 13px;
        font-weight: 600;
        transition: all 0.25s ease;

        &:hover {
          transform: translateY(-2px);
        }

        &.trigger {
          background: linear-gradient(135deg, #f59e0b, #d97706);
          color: #fff;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);

          &:hover {
            box-shadow: 0 6px 16px rgba(245, 158, 11, 0.4);
          }
        }

        &.power {
          &.start {
            background: linear-gradient(135deg, #10b981, #059669);
            color: #fff;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
            }
          }

          &.stop {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: #fff;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);

            &:hover {
              box-shadow: 0 6px 16px rgba(239, 68, 68, 0.4);
            }
          }
        }
      }
    }
  }
}

.job-dialog {
  :deep(.el-dialog) {
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  }

  :deep(.el-dialog__header) {
    padding: 0;
    margin: 0;
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__headerbtn) {
    top: 16px;
    right: 16px;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--el-fill-color-light);
    transition: all 0.2s ease;

    &:hover {
      background: var(--el-fill-color);
      transform: rotate(90deg);
    }
  }
}

// 执行计划弹框样式
.next-trigger-dialog {
  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }
}

.job-dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.job-node-list {
  max-height: 280px;
  overflow-y: auto;

  .job-node-item {
    margin-bottom: 8px;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .job-management-container {
    padding: 12px;
  }

  .search-section {
    .search-card {
      .search-container {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;

        .search-left {
          flex-direction: column;
          gap: 10px;

          .search-input,
          .app-filter,
          .status-filter {
            width: 100%;
          }
        }

        .search-right {
          justify-content: stretch;

          :deep(.el-button) {
            width: 100%;
          }
        }
      }
    }
  }

  .jobs-section {
    .job-card {
      .card-body .job-details .detail-row {
        grid-template-columns: 1fr;
      }

      .card-footer .card-actions {
        opacity: 1;
      }
    }
  }
}
</style>

<!-- 全局样式 - 下拉菜单弹出层 -->
<style lang="scss">
.job-dropdown-popper {
  padding: 0 !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.1) !important;
  border: 1px solid var(--el-border-color-lighter) !important;
  backdrop-filter: blur(20px);
  overflow: hidden;

  .el-dropdown-menu {
    padding: 8px;
    border: none;
    box-shadow: none;
    background: transparent;
  }
}

.job-dropdown-menu {
  padding: 8px;
  padding-right: 12px;
  min-width: 240px;
  background: var(--el-bg-color);
  overflow: hidden;
  animation: jobDropdownFadeIn 0.2s ease-out;

  @keyframes jobDropdownFadeIn {
    from {
      opacity: 0;
      transform: translateY(-8px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .dropdown-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px 14px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    border-bottom: 1px solid var(--el-border-color-lighter);
    margin-bottom: 8px;

    .header-icon {
      width: 28px;
      height: 28px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 14px;
    }
  }

  .dropdown-divider {
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--el-border-color-lighter) 20%,
      var(--el-border-color-lighter) 80%,
      transparent
    );
    margin: 10px 12px;
  }

  .el-dropdown-menu__item {
    padding: 0;
    border-radius: 10px;
    margin: 2px 0;
    transition: all 0.2s ease;
    overflow: hidden;

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      background: var(--el-fill-color-light);
      transform: translateX(4px);

      .dropdown-item-content {
        .item-arrow {
          opacity: 1;
          transform: translateX(0);
        }

        .dropdown-item-icon {
          transform: scale(1.05);
        }
      }
    }

    &:active {
      transform: translateX(4px) scale(0.98);
    }
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    width: 100%;
    position: relative;

    &.danger {
      .dropdown-item-icon {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.15),
          rgba(239, 68, 68, 0.05)
        );
        color: #ef4444;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      }

      .item-title {
        color: var(--el-color-danger);
      }

      .item-arrow {
        color: var(--el-color-danger);
      }
    }

    .dropdown-item-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      flex-shrink: 0;
      transition: all 0.25s ease;

      &.edit {
        background: linear-gradient(
          135deg,
          rgba(59, 130, 246, 0.15),
          rgba(59, 130, 246, 0.05)
        );
        color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      }

      &.copy {
        background: linear-gradient(
          135deg,
          rgba(168, 85, 247, 0.15),
          rgba(168, 85, 247, 0.05)
        );
        color: #a855f7;
        box-shadow: 0 4px 12px rgba(168, 85, 247, 0.15);
      }

      &.schedule {
        background: linear-gradient(
          135deg,
          rgba(34, 197, 94, 0.15),
          rgba(34, 197, 94, 0.05)
        );
        color: #22c55e;
        box-shadow: 0 4px 12px rgba(34, 197, 94, 0.15);
      }

      &.log {
        background: linear-gradient(
          135deg,
          rgba(14, 165, 233, 0.15),
          rgba(14, 165, 233, 0.05)
        );
        color: #0ea5e9;
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.15);
      }

      &.delete {
        background: linear-gradient(
          135deg,
          rgba(239, 68, 68, 0.15),
          rgba(239, 68, 68, 0.05)
        );
        color: #ef4444;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
      }
    }

    .dropdown-item-text {
      flex: 1;
      min-width: 0;

      .item-title {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.3;
        transition: color 0.2s ease;
      }

      .item-desc {
        display: block;
        font-size: 11px;
        color: var(--el-text-color-placeholder);
        line-height: 1.3;
        margin-top: 3px;
        transition: color 0.2s ease;
      }
    }

    .item-arrow {
      font-size: 16px;
      color: var(--el-text-color-placeholder);
      opacity: 0;
      transform: translateX(-8px);
      transition: all 0.25s ease;
      flex-shrink: 0;
    }
  }
}

// 执行计划弹框全局样式
.next-trigger-dialog {
  .el-dialog {
    border-radius: 16px !important;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15) !important;
  }

  .el-dialog__header {
    padding: 0 !important;
    margin: 0 !important;
  }

  .el-dialog__body {
    padding: 20px !important;
  }

  .el-dialog__headerbtn {
    top: 16px !important;
    right: 16px !important;
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.8);
    transition: all 0.2s ease;
    z-index: 10;

    &:hover {
      background: var(--el-fill-color);
      transform: rotate(90deg);
    }
  }

  .dialog-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px 24px;
    background: linear-gradient(135deg, var(--el-color-primary-light-9), var(--el-color-primary-light-8));
    border-bottom: 1px solid var(--el-border-color-lighter);

    .header-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
    }

    .header-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--el-text-color-primary);
    }
  }

  .job-next-time-list {
    padding: 4px;
    padding-right: 8px;
    overflow: hidden;

    .job-next-time-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      margin-bottom: 8px;
      background: var(--el-fill-color-lighter);
      border-radius: 10px;
      transition: all 0.25s ease;
      border: 1px solid transparent;

      &:hover {
        background: var(--el-fill-color-light);
        border-color: var(--el-color-primary-light-5);
        transform: translateX(4px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
      }

      &:last-child {
        margin-bottom: 0;
      }

      .time-index {
        width: 26px;
        height: 26px;
        border-radius: 8px;
        background: linear-gradient(135deg, var(--el-color-primary), var(--el-color-primary-light-3));
        color: #fff;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .time-value {
        font-family: "SF Mono", "Monaco", "Consolas", monospace;
        font-size: 13px;
        color: var(--el-text-color-primary);
        font-weight: 500;
      }
    }
  }
}
</style>
