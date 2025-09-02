<template>
  <div class="job-dashboard">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="title-section">
          <h1 class="page-title">
            <IconifyIconOnline icon="ep:timer" class="title-icon" />
            调度任务管理
          </h1>
          <p class="page-subtitle">管理和监控系统中的定时任务，支持任务的创建、编辑、启停和日志查看</p>
        </div>
        <div class="stats-section">
          <div class="stat-card">
            <div class="stat-number">{{ totalJobs }}</div>
            <div class="stat-label">总任务数</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ runningJobs }}</div>
            <div class="stat-label">运行中</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ stoppedJobs }}</div>
            <div class="stat-label">已停止</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 顶部控制区域 -->
    <div class="job-control-panel">
      <div class="modern-toolbar">
        <div class="toolbar-left">
          <div class="search-container">
            <el-input v-model="form.jobDesc" placeholder="搜索任务名称或描述..." clearable class="search-input">
              <template #prefix>
                <IconifyIconOnline icon="ep:search" class="search-icon" />
              </template>
            </el-input>
          </div>
          
          <div class="filter-container">
            <el-select v-model="form.jobGroup" class="group-select" placeholder="选择任务组">
              <el-option :value="0" label="全部任务组">
                <div class="option-item">
                  <IconifyIconOnline icon="ep:menu" class="option-icon" />
                  <span>全部任务组</span>
                </div>
              </el-option>
              <el-option v-for="item in executorData" :key="item.monitorId" :value="item.monitorId">
                <div class="option-item">
                  <IconifyIconOnline icon="ep:folder-opened" class="option-icon" />
                  <span>{{ item.monitorName }}</span>
                  <span class="app-label">{{ item.monitorApplicationName }}</span>
                </div>
              </el-option>
            </el-select>

            <!-- 状态快捷切换 -->
            <div class="status-filter">
              <el-button 
                :class="['status-btn', { 'active': form.jobTriggerStatus === null }]" 
                @click="setStatus(null)"
              >
                <IconifyIconOnline icon="ep:menu" class="btn-icon" />
                全部
              </el-button>
              <el-button 
                :class="['status-btn', 'success', { 'active': form.jobTriggerStatus === 1 }]" 
                @click="setStatus(1)"
              >
                <IconifyIconOnline icon="ep:video-play" class="btn-icon" />
                运行中
              </el-button>
              <el-button 
                :class="['status-btn', 'warning', { 'active': form.jobTriggerStatus === 0 }]" 
                @click="setStatus(0)"
              >
                <IconifyIconOnline icon="ep:video-pause" class="btn-icon" />
                已停止
              </el-button>
            </div>
          </div>
        </div>

        <div class="toolbar-right">
          <el-button class="search-btn" @click="search">
            <IconifyIconOnline icon="ep:refresh" class="btn-icon" />
            刷新
          </el-button>
          <el-button type="primary" class="create-btn" @click="add">
            <IconifyIconOnline icon="ep:plus" class="btn-icon" />
            新建任务
          </el-button>
        </div>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="job-content">
      <ScTable ref="tableRef" v-model:page="form" class="job-table" :col-size="4" :data="data" :total="total" :loading="loading" layout="card" cardLayout="default" @data-change="search">
        <template #default="{ row }">
          <div class="modern-job-card" :class="{ 'card-active': row.jobTriggerStatus === 1 }">
            <!-- 状态指示器 -->
            <div class="status-indicator" :class="row.jobTriggerStatus === 1 ? 'indicator-running' : 'indicator-stopped'"></div>
            
            <!-- 卡片头部 -->
            <div class="card-header">
              <div class="job-info">
                <div class="job-icon">
                  <IconifyIconOnline icon="ep:timer" class="icon" />
                </div>
                <div class="job-details">
                  <h3 class="job-title">{{ row.jobName }}</h3>
                  <div class="job-handler">{{ row.jobType }}</div>
                </div>
              </div>
              <div class="status-badge" :class="row.jobTriggerStatus === 1 ? 'badge-running' : 'badge-stopped'">
                <IconifyIconOnline :icon="row.jobTriggerStatus === 1 ? 'ep:success-filled' : 'ep:circle-close-filled'" class="status-icon" />
                <span class="status-text">{{ row.jobTriggerStatus === 1 ? '运行中' : '已停止' }}</span>
              </div>
            </div>

            <!-- 卡片内容 -->
            <div class="card-content">
              <div class="schedule-expression">
                <IconifyIconOnline icon="ep:clock" class="schedule-icon" />
                <span class="schedule-text">{{ row.jobScheduleType }} {{ row.jobScheduleTime }}<span v-if="row.jobScheduleType === 'FIXED'">秒</span></span>
              </div>
              
              <div class="job-metadata">
                <div class="meta-item">
                  <IconifyIconOnline icon="ep:user" class="meta-icon" />
                  <span class="meta-label">创建者:</span>
                  <span class="meta-value">{{ row.jobAuthor }}</span>
                </div>
                <div class="meta-item">
                  <IconifyIconOnline icon="ep:folder-opened" class="meta-icon" />
                  <span class="meta-label">应用:</span>
                  <span class="meta-value">{{ row.jobApplicationActive }}</span>
                </div>
                <div class="meta-item">
                  <IconifyIconOnline icon="ep:setting" class="meta-icon" />
                  <span class="meta-label">类型:</span>
                  <span class="meta-value">{{ row.jobGlueType }}</span>
                </div>
              </div>

              <div class="job-tags">
                <el-tag size="small" class="schedule-tag">
                  <IconifyIconOnline icon="ep:collection-tag" class="tag-icon" />
                  {{ row.jobScheduleType }}
                </el-tag>
                <el-tag size="small" type="primary" class="glue-tag">
                  <IconifyIconOnline icon="ep:cpu" class="tag-icon" />
                  {{ row.jobGlueType }}
                </el-tag>
                <el-tag size="small" :type="row.jobTriggerStatus === 1 ? 'success' : 'warning'" class="status-tag">
                  <IconifyIconOnline :icon="row.jobTriggerStatus === 1 ? 'ep:success-filled' : 'ep:warning-filled'" class="tag-icon" />
                  {{ row.jobTriggerStatus === 1 ? '运行中' : '已停止' }}
                </el-tag>
              </div>
            </div>

            <!-- 卡片操作区 -->
            <div class="card-actions">
              <div class="primary-actions">
                <el-button size="small" type="primary" class="action-btn" @click="edit(row)">
                  <IconifyIconOnline icon="ep:edit" class="action-icon" />
                  编辑
                </el-button>
                <el-button size="small" type="success" class="action-btn" @click="trigger(row)">
                  <IconifyIconOnline icon="ep:video-play" class="action-icon" />
                  执行
                </el-button>
                <el-button size="small" type="info" class="action-btn" @click="logger(row)">
                  <IconifyIconOnline icon="ep:document" class="action-icon" />
                  日志
                </el-button>
              </div>
              <div class="secondary-actions">
                <el-dropdown trigger="click" @command="command => handleCommand(command, row)">
                  <el-button size="small" class="more-btn">
                    <IconifyIconOnline icon="ep:more-filled" class="more-icon" />
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="nextTriggerTime">
                        <IconifyIconOnline icon="ep:calendar" class="dropdown-icon" />
                        下次执行时间
                      </el-dropdown-item>
                      <el-dropdown-item command="jobgroupById">
                        <IconifyIconOnline icon="ep:connection" class="dropdown-icon" />
                        注册节点
                      </el-dropdown-item>
                      <el-dropdown-item v-if="!row.jobTriggerStatus || row.jobTriggerStatus == 0" divided command="start">
                        <IconifyIconOnline icon="ep:video-play" class="dropdown-icon" />
                        启动任务
                      </el-dropdown-item>
                      <el-dropdown-item v-if="row.jobTriggerStatus == 1" divided command="stop">
                        <IconifyIconOnline icon="ep:video-pause" class="dropdown-icon" />
                        停止任务
                      </el-dropdown-item>
                      <el-dropdown-item command="copy">
                        <IconifyIconOnline icon="ep:copy-document" class="dropdown-icon" />
                        复制任务
                      </el-dropdown-item>
                      <el-dropdown-item divided command="delete">
                        <IconifyIconOnline icon="ep:delete" class="dropdown-icon" style="color: var(--el-color-danger)" />
                        <span style="color: var(--el-color-danger)">删除任务</span>
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
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
    <el-dialog v-model="triggerShow" draggable :title="triggerTitle" class="job-dialog" width="500px">
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
          <el-button :loading="triggerLoadding" @click="triggerShow = false">取消</el-button>
          <el-button :loading="triggerLoadding" type="primary" @click="triggerExecute">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="jobinfoNextTriggerTimeShow" draggable title="下一次执行时间" width="400px" class="job-dialog">
      <div class="job-next-time-list">
        <div v-for="item in jobinfoNextTriggerTimeData" :key="item" class="job-next-time-item">
          {{ item }}
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="jobgroupByIdShow" draggable title="注册地址" width="400px" class="job-dialog">
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
import { fetchJobNextTriggerTime, fetchJobPageList, fetchJobDelete, fetchJobStart, fetchJobStop, fetchJobTrigger } from "@/api/monitor/job";
import { fetchAppList } from "@/api/monitor/app";
// import { fetchServiceList } from "@/api/monitor/service"; // 已删除服务监控功能
import { defineAsyncComponent, ref, reactive, onMounted, computed } from "vue";
import ScTable from "@repo/components/ScTable/index.vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";

// 动态导入组件
const Save = defineAsyncComponent(() => import("./save.vue"));
const ScSelectFilter = defineAsyncComponent(() => import("@repo/components/ScSelectFilter/index.vue"));

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
  pageSize: 12
});

const data = ref([]);
const loading = ref(false);
const executorData = ref([]);
const jobinfoNextTriggerTimeData = ref([]);
const jobgroupByIdData = ref([]);
const total = ref(0);

// 计算属性
const totalJobs = computed(() => data.value.length);
const runningJobs = computed(() => data.value.filter(job => job.jobTriggerStatus === 1).length);
const stoppedJobs = computed(() => data.value.filter(job => job.jobTriggerStatus === 0).length);

// 过滤器数据
const filterData = [
  {
    title: "状态",
    key: "jobTriggerStatus",
    multiple: false,
    options: [
      {
        label: "全部",
        value: null
      },
      {
        label: "停止",
        value: 0
      },
      {
        label: "启动",
        value: 1
      }
    ]
  }
];

// 初始化数据
const initial = async () => {
  try {
    const res = await fetchAppList({});
    executorData.value = res?.data || [];
    form.jobGroup = executorData.value && executorData.value.length == 1 ? executorData.value[0].monitorId : 0;
    search({});
  } catch (error) {
    console.error("初始化失败:", error);
  }
};

// 搜索方法
const search = async param => {
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
const filterChange = row => {
  form.jobTriggerStatus = row.jobTriggerStatus;
  search({});
};

// 状态快捷切换（与筛选器联动）
const setStatus = (v: number | null) => {
  form.jobTriggerStatus = v as any;
  search(undefined);
};

// 处理成功回调
const handlerSuccess = () => {
  search(undefined);
};

// 编辑任务
const edit = row => {
  saveShow.value = true;
  setTimeout(() => {
    saveRef.value.setExecutorData(executorData.value).open("edit", row);
  });
};

// 复制任务
const copy = row => {
  saveShow.value = true;
  setTimeout(() => {
    saveRef.value.setExecutorData(executorData.value).open("copy", row);
  });
};

// 删除任务
const del = async row => {
  try {
    await ElMessageBox.confirm(`确定要删除任务 "${row.jobName}" 吗？`, "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    });

    const res = await fetchJobDelete({ id: row.jobId });
    if (res.code === "00000") {
      data.value = data.value.filter(it => it.jobId != row.jobId);
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
const start = async row => {
  try {
    const res = await fetchJobStart({ jobId: row.jobId });
    if (res.code === "00000") {
      const item = data.value.find(it => it.jobId == row.jobId);
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

// 停止任务（增加二次确认）
const stop = async row => {
  try {
    await ElMessageBox.confirm(`确定要停止任务 "${row.jobName}" 吗？`, "提示", { type: "warning", confirmButtonText: "确定", cancelButtonText: "取消" });

    const res = await fetchJobStop({ jobId: row.jobId });
    if (res.code === "00000") {
      const item = data.value.find(it => it.jobId == row.jobId);
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
      addressList: addressList.value
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
const trigger = row => {
  triggerTitle.value = row.jobName + "(执行一次)";
  triggerShow.value = true;
  triggerId.value = row.jobId;
};

// 查看注册节点（服务监控已移除，展示空列表提示）
const jobgroupById = async (row: any) => {
  ElMessage.info("服务节点信息功能已移除");
  jobgroupByIdData.value = [];
  jobgroupByIdShow.value = true;
};

// 查看日志
const logger = row => {
  router.push({
    path: "/job-log",
    query: {
      jobLogApp: row.jobApplicationName,
      jobLogProfile: row.jobApplicationProfile
    }
  });
};

// 查看下一次执行时间
const nextTriggerTime = async row => {
  try {
    const res = await fetchJobNextTriggerTime({
      jobScheduleType: row.jobScheduleType,
      jobScheduleTime: row.jobScheduleTime
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
  const executor = executorData.value.find(item => item.monitorId === jobGroup);
  return executor ? executor.monitorName : '未知';
};

// 获取状态样式类
const getStatusClass = (status) => {
  return status === 1 ? 'status-running' : 'status-stopped';
};

// 获取状态图标
const getStatusIcon = (status) => {
  return status === 1 ? 'ep:success-filled' : 'ep:circle-close-filled';
};

// 获取状态文本
const getStatusText = (status) => {
  return status === 1 ? '运行中' : '已停止';
};

// 格式化时间
const formatTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 处理卡片点击
const handleCardClick = (row) => {
  // 可以添加卡片点击逻辑，比如显示详情
  console.log('Card clicked:', row);
};

// 处理更多操作
const handleMoreAction = (command, row) => {
  handleCommand(command, row);
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

<style scoped>
/* 基础样式 */
.job-dashboard {
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* 页面头部样式 */
.page-header {
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 20px;
  padding: 12px;
  margin-bottom: 12px;
  color: #1f2937;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border: 1px solid #e2e8f0;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 32px;
}

.title-section {
  flex: 1;
  min-width: 300px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.title-icon {
  font-size: 32px;
  color: #667eea;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  line-height: 1.5;
}

.stats-section {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.stat-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  min-width: 120px;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.stat-card:hover {
  background: #f8fafc;
  transform: translateY(-2px);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* 工具栏样式 */
.job-control-panel {
  background: white;
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.job-filter-section {
  margin-bottom: 16px;
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

.job-skeleton-loader {
  padding: 10px 0;
}

.modern-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background: white;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  flex-wrap: wrap;
}

.search-container {
  flex: 1;
  max-width: 400px;
  min-width: 250px;
}

.search-input {
  border-radius: 12px;
}

.search-input :deep(.el-input__wrapper) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e1e5e9;
  transition: all 0.3s ease;
}

.search-input :deep(.el-input__wrapper:hover) {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.search-input :deep(.el-input__wrapper.is-focus) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  color: #9ca3af;
}

.filter-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.group-select {
  min-width: 180px;
}

.group-select :deep(.el-select__wrapper) {
  border-radius: 12px;
  border: 1px solid #e1e5e9;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.group-select :deep(.el-select__wrapper:hover) {
  border-color: #667eea;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-icon {
  font-size: 14px;
  color: #667eea;
}

.app-label {
  margin-left: auto;
  font-size: 11px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.status-filter {
  display: flex;
  gap: 4px;
  background: #f8fafc;
  padding: 4px;
  border-radius: 12px;
  border: 1px solid #e1e5e9;
}

.status-btn {
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.status-btn:hover {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.status-btn.active {
  background: #667eea;
  color: white;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.status-btn.success.active {
  background: #10b981;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.status-btn.warning.active {
  background: #f59e0b;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.btn-icon {
  font-size: 14px;
}

.toolbar-right {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-btn {
  border-radius: 12px;
  padding: 10px 16px;
  border: 1px solid #e1e5e9;
  background: white;
  color: #6b7280;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.search-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.create-btn {
  border-radius: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
}

/* 主内容区域 */
.job-content {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 任务卡片样式 */
.modern-job-card {
  height: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  background: linear-gradient(145deg, #ffffff 0%, #f8fafc 100%);
  position: relative;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  cursor: pointer;
  padding: 24px;
}

.modern-job-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  border-color: #3b82f6;
}

.modern-job-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: height 0.3s ease;
}

.modern-job-card:hover::before {
  height: 6px;
}

.card-active {
  border-color: #10b981;
}

.card-active::before {
  background: linear-gradient(90deg, #10b981, #059669);
}

.status-indicator {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 2;
}

.status-indicator.indicator-running {
  background: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
  animation: pulse-running 2s infinite;
}

.status-indicator.indicator-stopped {
  background: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
}

@keyframes pulse-running {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.job-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.job-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.job-details {
  flex: 1;
}

.job-title {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.job-handler {
  font-size: 13px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
  display: inline-block;
}

.status-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.badge-running {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}

.status-badge.badge-stopped {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.status-icon {
  font-size: 14px;
}

.status-text {
  font-size: 12px;
}

.card-content {
  margin-bottom: 20px;
}

.schedule-expression {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid #667eea;
}

.schedule-icon {
  font-size: 16px;
  color: #667eea;
}

.schedule-text {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.job-metadata {
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.meta-icon {
  font-size: 14px;
  color: #9ca3af;
  width: 16px;
}

.meta-label {
  color: #6b7280;
  font-weight: 500;
  min-width: 60px;
}

.meta-value {
  color: #374151;
}

.job-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.job-tags .el-tag {
  border-radius: 6px;
  border: none;
  font-size: 11px;
  padding: 4px 8px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.tag-icon {
  font-size: 12px;
}

.schedule-tag {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
}

.glue-tag {
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
}

.status-tag {
  /* Element Plus tag styles will apply */
}

.card-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #f1f5f9;
}

.primary-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  border-radius: 8px;
  font-size: 12px;
  padding: 6px 12px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid transparent;
}

.action-btn:hover {
  transform: translateY(-1px);
}

.action-icon {
  font-size: 14px;
}

.secondary-actions {
  display: flex;
  align-items: center;
}

.more-btn {
  border-radius: 8px;
  padding: 6px;
  border: 1px solid #e5e7eb;
  background: white;
  color: #6b7280;
  transition: all 0.2s ease;
}

.more-btn:hover {
  border-color: #667eea;
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
}

.more-icon {
  font-size: 16px;
}

.dropdown-icon {
  font-size: 14px;
  margin-right: 6px;
}

/* 空状态样式 */
.job-empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #9ca3af;
}

.job-empty-state .empty-icon {
  font-size: 80px;
  margin-bottom: 20px;
  opacity: 0.5;
  color: #d1d5db;
}

.job-empty-state .empty-text {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.job-empty-state .empty-desc {
  font-size: 14px;
  color: #6b7280;
  line-height: 1.5;
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

.job-dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

/* 下一次执行时间列表 */
.job-next-time-list {
  max-height: 300px;
  overflow-y: auto;

  .job-next-time-item {
    padding: 12px;
    margin-bottom: 10px;
    background-color: #f8fafc;
    border-radius: 8px;
    font-family: monospace;
    border-left: 3px solid #667eea;
    color: #374151;

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

/* 表格样式 */
.job-table {
  background: transparent;

  :deep(.sc-table-card) {
    background: transparent;
    border: none;
    box-shadow: none;
    padding: 0;
  }

  :deep(.el-card) {
    border-radius: 8px;
    overflow: hidden;
    border: none;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  }

  :deep(.el-pagination) {
    justify-content: center;
  }
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .stats-section {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .job-dashboard {
    padding: 16px;
  }
  
  .page-header {
    padding: 24px 20px;
  }
  
  .page-title {
    font-size: 24px;
  }
  
  .job-control-panel {
    padding: 20px;
  }
  
  .modern-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .toolbar-left {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    max-width: none;
  }
  
  .filter-container {
    flex-direction: column;
    align-items: stretch;
  }
  
  .status-filter {
    justify-content: center;
  }
  
  .toolbar-right {
    justify-content: center;
  }
  
  .modern-job-card {
    padding: 20px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .job-info {
    width: 100%;
  }
  
  .card-actions {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .primary-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .secondary-actions {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .stats-section {
    flex-direction: column;
  }
  
  .stat-card {
    min-width: auto;
  }
  
  .primary-actions {
    flex-direction: column;
  }
  
  .action-btn {
    justify-content: center;
  }
}
</style>
