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
            <div class="card-header">
              <div class="job-info">
                <div class="job-name">
                  <IconifyIconOnline icon="ri:timer-line" class="job-icon" />
                  <span class="name-text">{{ row.jobName }}</span>
                </div>
                <div class="job-cron">
                  <IconifyIconOnline icon="ri:time-line" class="cron-icon" />
                  <span
                    >{{ row.jobScheduleType }} {{ row.jobScheduleTime }}</span
                  >
                </div>
              </div>
              <div class="job-status">
                <el-tag
                  :type="getStatusType(row.jobTriggerStatus)"
                  :effect="row.jobTriggerStatus === 1 ? 'dark' : 'plain'"
                  class="status-tag"
                >
                  <IconifyIconOnline
                    :icon="getStatusIcon(row.jobTriggerStatus)"
                  />
                  {{ getStatusText(row.jobTriggerStatus) }}
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
                        row.jobGlueType || "-"
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
                        row.jobAuthor || "-"
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
                        :class="getEnvironmentClass(row.jobApplicationActive)"
                      >
                        {{ row.jobApplicationActive || "-" }}
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
                      <span class="detail-value">{{ row.jobDesc || "-" }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-footer">
              <div class="footer-info">
                <div class="job-group-info">
                  <IconifyIconOnline icon="ri:folder-line" />
                  <span>{{ getExecutorName(row.jobGroup) }}</span>
                </div>
              </div>
              <div class="card-actions">
                <el-button-group size="small">
                  <el-button @click.stop="edit(row)" title="编辑">
                    <IconifyIconOnline icon="ri:edit-line" />
                  </el-button>
                  <el-button @click.stop="trigger(row)" title="执行一次">
                    <IconifyIconOnline icon="ri:play-line" />
                  </el-button>
                  <el-button @click.stop="logger(row)" title="查看日志">
                    <IconifyIconOnline icon="ri:file-list-line" />
                  </el-button>
                  <el-button
                    @click.stop="
                      row.jobTriggerStatus === 1 ? stop(row) : start(row)
                    "
                    :title="row.jobTriggerStatus === 1 ? '停止' : '启动'"
                  >
                    <IconifyIconOnline
                      :icon="
                        row.jobTriggerStatus === 1
                          ? 'ri:pause-line'
                          : 'ri:play-fill'
                      "
                    />
                  </el-button>
                  <el-dropdown
                    trigger="click"
                    @command="(cmd) => handleCommand(cmd, row)"
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
      ElMessage.success("操作成功");
      tableRef.value?.reload?.();
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
      ElMessage.success("操作成功");
      tableRef.value?.reload?.();
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
      ElMessage.success("操作成功");
      tableRef.value?.reload?.();
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

  // 任务卡片样式
  .job-card {
    background: var(--el-bg-color);
    border-radius: 12px;
    padding: 0;
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    border: 1px solid var(--el-border-color-lighter);
    overflow: hidden;
    position: relative;
    display: flex;
    flex-direction: column;
    height: 100%;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px -8px rgba(0, 0, 0, 0.15);
      border-color: var(--el-color-primary-light-5);

      .card-footer .card-actions {
        opacity: 1;
      }
    }

    // 状态指示条
    &::before {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      z-index: 1;
    }

    &.job-running {
      &::before {
        background: var(--el-color-success);
      }

      .status-tag {
        background: var(--el-color-success-light-9) !important;
        color: var(--el-color-success) !important;
        border-color: var(--el-color-success-light-5) !important;
      }
    }

    &.job-stopped {
      &::before {
        background: var(--el-color-danger);
      }

      .status-tag {
        background: var(--el-color-danger-light-9) !important;
        color: var(--el-color-danger) !important;
        border-color: var(--el-color-danger-light-5) !important;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 16px 16px 12px;
      border-bottom: 1px solid var(--el-border-color-extra-light);

      .job-info {
        flex: 1;
        min-width: 0;

        .job-name {
          display: flex;
          align-items: center;
          font-size: 15px;
          font-weight: 600;
          color: var(--el-text-color-primary);
          margin-bottom: 8px;

          .job-icon {
            width: 32px;
            height: 32px;
            margin-right: 10px;
            background: var(--el-color-primary);
            color: #fff;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
            flex-shrink: 0;
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
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-family: "SF Mono", "Monaco", "Consolas", monospace;
          background: var(--el-fill-color-light);
          padding: 4px 8px;
          border-radius: 6px;
          font-weight: 500;

          .cron-icon {
            margin-right: 4px;
            font-size: 12px;
            color: var(--el-text-color-placeholder);
          }
        }
      }

      .job-status {
        flex-shrink: 0;
        margin-left: 8px;

        .status-tag {
          font-weight: 500;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 12px;
          border: 1px solid;

          i {
            margin-right: 4px;
            font-size: 12px;
          }
        }
      }
    }

    .card-body {
      padding: 12px 16px;
      flex: 1;
      display: flex;
      flex-direction: column;

      .job-details {
        .detail-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-bottom: 8px;

          &:last-child {
            margin-bottom: 0;
          }

          .detail-item {
            display: flex;
            align-items: center;
            padding: 8px 10px;
            background: var(--el-fill-color-lighter);
            border-radius: 8px;
            transition: background 0.2s ease;

            &:hover {
              background: var(--el-fill-color-light);
            }

            .detail-icon {
              width: 24px;
              height: 24px;
              background: var(--el-color-primary-light-8);
              color: var(--el-color-primary);
              border-radius: 6px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 13px;
              margin-right: 8px;
              flex-shrink: 0;
            }

            .detail-info {
              flex: 1;
              min-width: 0;

              .detail-label {
                display: block;
                font-size: 11px;
                color: var(--el-text-color-placeholder);
                line-height: 1.2;
                font-weight: 500;
              }

              .detail-value {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: var(--el-text-color-primary);
                line-height: 1.4;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;

                &.env-prod {
                  color: var(--el-color-danger);
                }

                &.env-dev {
                  color: var(--el-color-primary);
                }

                &.env-test {
                  color: var(--el-color-warning);
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
      padding: 10px 16px 12px;
      background: var(--el-fill-color-lighter);
      border-top: 1px solid var(--el-border-color-extra-light);
      margin-top: auto;

      .footer-info {
        display: flex;
        gap: 12px;
        flex: 1;

        .job-group-info {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: var(--el-text-color-secondary);
          font-weight: 500;

          i {
            margin-right: 4px;
            font-size: 13px;
            color: var(--el-text-color-placeholder);
          }
        }
      }

      .card-actions {
        flex-shrink: 0;
        opacity: 0.7;
        transition: opacity 0.2s ease;

        :deep(.el-button-group) {
          .el-button {
            padding: 5px 8px;
            font-size: 12px;
            height: 28px;
            border-color: var(--el-border-color);
            background: var(--el-bg-color);

            &:hover {
              color: var(--el-color-primary);
              border-color: var(--el-color-primary-light-5);
              background: var(--el-color-primary-light-9);
            }

            i {
              font-size: 13px;
            }
          }
        }
      }
    }
  }
}

.dropdown-icon {
  margin-right: 6px;
  font-size: 14px;
}

.job-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
  }
}

.job-dialog-footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.job-next-time-list {
  max-height: 280px;
  overflow-y: auto;

  .job-next-time-item {
    padding: 10px 12px;
    margin-bottom: 8px;
    background: var(--el-fill-color-lighter);
    border-radius: 6px;
    font-family: "SF Mono", "Monaco", "Consolas", monospace;
    font-size: 13px;
    border-left: 3px solid var(--el-color-primary);
    color: var(--el-text-color-regular);

    &:last-child {
      margin-bottom: 0;
    }
  }
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
