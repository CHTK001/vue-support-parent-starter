<template>
  <div class="job-dashboard">
    <!-- 顶部控制区域 -->
    <div class="job-control-panel">
      <div class="job-filter-section">
        <Suspense>
          <template #default>
            <div class="job-filter-controls">
              <sc-select-filter
                :data="filterData"
                :label-width="80"
                @on-change="filterChange"
                inline
              />
            </div>
          </template>
          <template #fallback>
            <div class="job-skeleton-loader">
              <el-skeleton :rows="1" animated />
            </div>
          </template>
        </Suspense>
      </div>

      <div class="job-search-section">
        <el-select
          v-model="form.jobGroup"
          class="job-group-dropdown"
          placeholder="选择任务组"
        >
          <el-option :value="0" label="全部">
            <div class="job-option-item">
              <IconifyIconOnline icon="ep:menu" class="mr-2" />
              <span>全部</span>
            </div>
          </el-option>
          <el-option
            v-for="item in executorData"
            :key="item.monitorId"
            :value="item.monitorId"
          >
            <div class="job-option-item">
              <IconifyIconOnline icon="ep:folder-opened" class="mr-2" />
              <span>{{ item.monitorName }}</span>
              <span class="job-app-label">{{
                item.monitorApplicationName
              }}</span>
            </div>
          </el-option>
        </el-select>

        <div class="job-search-box">
          <el-input
            v-model="form.jobDesc"
            placeholder="搜索任务描述..."
            clearable
          >
            <template #prefix>
              <IconifyIconOnline icon="ep:search" />
            </template>
          </el-input>
          <el-button type="primary" @click="search" class="job-search-button">
            <IconifyIconOnline icon="ep:search" class="mr-1" />
            搜索
          </el-button>
        </div>

        <el-button type="primary" @click="add" class="job-add-button">
          <IconifyIconOnline icon="ep:plus" class="mr-1" />
          新建任务
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="job-content">
      <ScTable
        ref="tableRef"
        :loading="loading"
        :data="data"
        :total="total"
        layout="card"
        cardLayout="default"
        v-model:page="form"
        @data-change="search"
        class="job-table"
      >
        <template #default="{ row }">
          <div
            class="app-wrapper"
            :class="{ 'app-wrapper-active': row.jobTriggerStatus === 1 }"
          >
            <div class="media-content">
              <div
                class="app-logo"
                @click="row.jobTriggerStatus === 1 ? stop(row) : start(row)"
              >
                <IconifyIconOnline
                  :icon="
                    row.jobTriggerStatus === 1
                      ? 'ep:video-pause'
                      : 'ep:video-play'
                  "
                  :class="
                    row.jobTriggerStatus === 1
                      ? 'app-toggle-running'
                      : 'app-toggle-stopped'
                  "
                />
              </div>

              <div class="app-content">
                <h3 class="app-title">{{ row.jobName }}</h3>
                <div class="app-tags">
                  <el-tag
                    size="small"
                    :type="row.jobTriggerStatus === 1 ? 'success' : 'info'"
                    effect="light"
                  >
                    {{ row.jobTriggerStatus === 1 ? "运行中" : "已停止" }}
                  </el-tag>
                  <el-tag size="small" type="primary" class="ml-2">{{
                    row.jobGlueType
                  }}</el-tag>
                  <el-tag size="small" effect="plain" class="ml-2">{{
                    row.jobApplicationActive
                  }}</el-tag>
                </div>

                <div class="app-desc">
                  <div class="job-meta-item">
                    <IconifyIconOnline icon="ep:timer" class="mr-1" />
                    <span>{{ row.jobType }}</span>
                    <span class="ml-2"
                      >{{ row.jobScheduleType }} {{ row.jobScheduleTime }}
                      <span v-if="row.jobScheduleType === 'FIXED'"
                        >秒</span
                      ></span
                    >
                  </div>
                  <div class="job-meta-item mt-2">
                    <IconifyIconOnline icon="ep:user" class="mr-1" />
                    <span>{{ row.jobAuthor }}</span>
                  </div>
                </div>

                <div class="app-footer">
                  <div class="app-stats"></div>
                  <div class="app-actions">
                    <el-button
                      size="small"
                      type="primary"
                      @click="edit(row)"
                      class="action-btn"
                    >
                      <IconifyIconOnline icon="ep:edit" class="mr-1" />编辑
                    </el-button>
                    <el-button
                      size="small"
                      type="success"
                      @click="trigger(row)"
                      class="action-btn"
                    >
                      <IconifyIconOnline
                        icon="ep:video-play"
                        class="mr-1"
                      />执行
                    </el-button>
                    <el-button
                      size="small"
                      type="info"
                      @click="logger(row)"
                      class="action-btn"
                    >
                      <IconifyIconOnline icon="ep:document" class="mr-1" />日志
                    </el-button>
                    <el-dropdown
                      trigger="click"
                      @command="(command) => handleCommand(command, row)"
                    >
                      <el-button size="small" class="more-btn">
                        <IconifyIconOnline icon="ep:more-filled" />
                      </el-button>
                      <template #dropdown>
                        <el-dropdown-menu>
                          <el-dropdown-item command="nextTriggerTime">
                            <IconifyIconOnline
                              icon="ep:calendar"
                              class="mr-1"
                            />
                            下次执行时间
                          </el-dropdown-item>
                          <el-dropdown-item command="jobgroupById">
                            <IconifyIconOnline
                              icon="ep:connection"
                              class="mr-1"
                            />
                            注册节点
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="
                              !row.jobTriggerStatus || row.jobTriggerStatus == 0
                            "
                            divided
                            command="start"
                          >
                            <IconifyIconOnline
                              icon="ep:video-play"
                              class="mr-1"
                            />
                            启动
                          </el-dropdown-item>
                          <el-dropdown-item
                            v-if="row.jobTriggerStatus == 1"
                            divided
                            command="stop"
                          >
                            <IconifyIconOnline
                              icon="ep:video-pause"
                              class="mr-1"
                            />
                            停止
                          </el-dropdown-item>
                          <el-dropdown-item command="copy">
                            <IconifyIconOnline
                              icon="ep:copy-document"
                              class="mr-1"
                            />
                            复制
                          </el-dropdown-item>
                          <el-dropdown-item divided command="delete">
                            <IconifyIconOnline
                              icon="ep:delete"
                              class="mr-1"
                              style="color: var(--el-color-danger)"
                            />
                            <span style="color: var(--el-color-danger)"
                              >删除</span
                            >
                          </el-dropdown-item>
                        </el-dropdown-menu>
                      </template>
                    </el-dropdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
        <template #empty>
          <el-empty description="暂无任务数据" class="job-empty-state">
            <el-button type="primary" @click="add">创建第一个任务</el-button>
          </el-empty>
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
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import {
  fetchJobNextTriggerTime,
  fetchJobPageList,
  fetchJobDelete,
  fetchJobStart,
  fetchJobStop,
  fetchJobTrigger,
} from "@/api/monitor/job";
import { fetchAppList } from "@/api/monitor/app";
// import { fetchServiceList } from "@/api/monitor/service"; // 已删除服务监控功能
import { defineAsyncComponent, ref, reactive, onMounted } from "vue";
import ScTable from "@repo/components/ScTable/index.vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";

// 动态导入组件
const Save = defineAsyncComponent(() => import("./save.vue"));
const ScSelectFilter = defineAsyncComponent(
  () => import("@repo/components/ScSelectFilter/index.vue")
);

// 表格引用
const tableRef = ref(null);
const router = useRouter();

// 数据状态
const triggerId = ref(undefined);
const executorParam = ref("");
const addressList = ref("");
const triggerTitle = ref("");
const triggerShow = ref(false);
const saveShow = ref(false);
const jobinfoNextTriggerTimeShow = ref(false);
const jobgroupByIdShow = ref(false);
const triggerLoadding = ref(false);

// 表单和分页参数
const form = reactive({
  mode: "card",
  jobTriggerStatus: null,
  jobDesc: undefined,
  jobGroup: 0,
  pageNum: 1,
  pageSize: 12,
});

const data = ref([]);
const loading = ref(false);
const executorData = ref([]);
const jobinfoNextTriggerTimeData = ref([]);
const jobgroupByIdData = ref([]);
const total = ref(0);

// 过滤器数据
const filterData = [
  {
    title: "状态",
    key: "jobTriggerStatus",
    multiple: false,
    options: [
      {
        label: "全部",
        value: null,
      },
      {
        label: "停止",
        value: 0,
      },
      {
        label: "启动",
        value: 1,
      },
    ],
  },
];

// 初始化数据
const initial = async () => {
  try {
    const res = await fetchAppList();
    executorData.value = res?.data || [];
    form.jobGroup =
      executorData.value && executorData.value.length == 1
        ? executorData.value[0].monitorId
        : 0;
    search();
  } catch (error) {
    console.error("初始化失败:", error);
  }
};

// 搜索方法
const search = async (param) => {
  if (param) {
    Object.assign(form, param);
  }
  loading.value = true;
  try {
    const res = await fetchJobPageList(form);
    data.value = res?.data.data || [];
    total.value = res?.data.total || 0;
  } catch (error) {
    console.error("获取数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 过滤器变化
const filterChange = (row) => {
  form.jobTriggerStatus = row.jobTriggerStatus;
  search();
};

// 处理成功回调
const handlerSuccess = () => {
  search();
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
      data.value = data.value.filter((it) => it.jobId != row.jobId);
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
      const item = data.value.find((it) => it.jobId == row.jobId);
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
    const res = await fetchJobStop({ jobId: row.jobId });
    if (res.code === "00000") {
      const item = data.value.find((it) => it.jobId == row.jobId);
      if (item) {
        item.jobTriggerStatus = 0;
      }
      ElMessage.success("操作成功");
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    console.error("停止失败:", error);
    ElMessage.error("停止失败");
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
const jobgroupById = async (row) => {
  try {
    const res = await fetchServiceList({ uriSpec: "monitor" });
    if (res.code === "00000") {
      jobgroupByIdData.value = res.data.filter((it) => {
        return (
          it?.metadata?.applicationName == row.jobApplicationName &&
          it?.metadata?.applicationActive == row.jobApplicationActive
        );
      });
      jobgroupByIdShow.value = true;
    } else {
      ElMessage.error(res.msg);
    }
  } catch (error) {
    console.error("获取节点失败:", error);
    ElMessage.error("获取节点失败");
  }
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
.job-dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 顶部控制面板 */
.job-control-panel {
  background-color: var(--el-bg-color);
  box-shadow: var(--el-box-shadow-light);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
}

.job-filter-section {
  margin-bottom: 10px;
}

.job-filter-controls {
  :deep(.sc-select-filter) {
    .filter-item {
      margin-right: 16px;

      .el-select {
        width: 140px;
      }
    }
  }
}

.job-search-section {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
}

.job-group-dropdown {
  width: 180px;
}

.job-search-box {
  display: flex;
  flex: 1;
  min-width: 250px;

  .el-input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  .job-search-button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -1px;
  }
}

.job-add-button {
  white-space: nowrap;
}

.job-option-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .job-app-label {
    margin-left: auto;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    opacity: 0.8;
  }
}

/* 主内容区域 */
.job-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 0 20px;
}

.current-category {
  margin: 20px 0;

  .category-title {
    font-size: 22px;
    font-weight: 600;
    margin: 0 0 12px;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;

    &::before {
      content: "";
      display: inline-block;
      width: 4px;
      height: 20px;
      background-color: var(--el-color-primary);
      margin-right: 12px;
      border-radius: 2px;
    }
  }

  .category-desc {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin: 0 0 0 16px;
    line-height: 1.6;
  }
}

/* 应用卡片样式 */
.app-wrapper {
  height: 200px;
  border-radius: 8px;
  background-color: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  overflow: hidden;
  transition: all 0.3s;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
    border-color: var(--el-color-primary);

    &::before {
      height: 4px;
    }
  }

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 0;
    background-color: var(--el-color-primary);
    transition: height 0.3s ease;
    z-index: 1;
  }

  &.app-wrapper-active {
    &::before {
      background-color: var(--el-color-success);
    }
  }

  .media-content {
    display: flex;
    height: 100%;
  }

  .app-logo {
    width: 100px;
    height: 100px;
    border-radius: 8px;
    overflow: hidden;
    margin: 20px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--el-fill-color-light);
    font-size: 36px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      transform: scale(1.05);
      background-color: var(--el-fill-color);
    }

    .app-toggle-running {
      color: var(--el-color-success);
    }

    .app-toggle-stopped {
      color: var(--el-color-primary);
    }
  }

  .app-content {
    flex: 1;
    padding: 20px 20px 20px 0;
    display: flex;
    flex-direction: column;
  }

  .app-title {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .app-desc {
    margin: 12px 0;
    font-size: 14px;
    line-height: 1.6;
    color: var(--el-text-color-secondary);
    flex: 1;
  }

  .app-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;

    .app-stats {
      display: flex;
      gap: 16px;
    }

    .app-actions {
      display: flex;
      gap: 8px;

      .el-button {
        border-radius: 6px;
      }

      .action-btn {
        transition: all 0.3s;
      }

      .more-btn {
        padding: 8px;
      }
    }
  }
}

.job-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

/* 空状态 */
.job-empty-state {
  padding: 40px 0;
}

/* 弹窗样式 */
.job-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
  }

  :deep(.el-dialog__header) {
    padding: 20px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
  }
}

/* 下一次执行时间列表 */
.job-next-time-list {
  max-height: 300px;
  overflow-y: auto;

  .job-next-time-item {
    padding: 12px;
    margin-bottom: 10px;
    background-color: var(--el-fill-color-light);
    border-radius: 8px;
    font-family: monospace;
    border-left: 3px solid var(--el-color-primary);

    &:last-child {
      margin-bottom: 0;
    }
  }
}

/* 节点列表 */
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

/* ScTable 样式 */
.job-table {
  margin-top: 20px;

  :deep(.el-card) {
    border-radius: 8px;
    overflow: hidden;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  :deep(.el-pagination) {
    margin-top: 24px;
    justify-content: center;
  }
}
</style>
