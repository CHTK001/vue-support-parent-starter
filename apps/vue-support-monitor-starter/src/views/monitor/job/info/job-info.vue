<template>
  <div class="job-dashboard">
    <!-- 顶部控制区域 -->
    <div class="job-control-panel">
      <div class="job-filter-section">
        <Suspense>
          <template #default>
            <div class="job-filter-controls">
              <sc-select-filter :data="filterData" :label-width="80" @on-change="filterChange" inline />
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
        <el-select v-model="form.jobGroup" class="job-group-dropdown" placeholder="选择任务组">
          <el-option :value="0" label="全部">
            <div class="job-option-item">
              <IconifyIconOnline icon="fluent:folder-16-regular" class="job-icon" />
              <span>全部</span>
            </div>
          </el-option>
          <el-option v-for="item in executorData" :key="item.monitorId" :value="item.monitorId">
            <div class="job-option-item">
              <IconifyIconOnline icon="fluent:folder-open-16-regular" class="job-icon" />
              <span>{{ item.monitorName }}</span>
              <span class="job-app-label">{{ item.monitorApplicationName }}</span>
            </div>
          </el-option>
        </el-select>

        <div class="job-search-box">
          <el-input v-model="form.jobDesc" placeholder="搜索任务描述..." clearable>
            <template #prefix>
              <IconifyIconOnline icon="fluent:search-12-regular" />
            </template>
          </el-input>
          <el-button type="primary" @click="search" class="job-search-button">
            <IconifyIconOnline icon="fluent:search-12-filled" class="job-icon" />
            搜索
          </el-button>
        </div>

        <el-button type="success" @click="add" class="job-add-button">
          <IconifyIconOnline icon="fluent:add-12-filled" class="job-icon" />
          新建任务
        </el-button>
      </div>
    </div>

    <!-- 主内容区域 -->
    <div class="job-content">
      <el-skeleton :loading="loading" :rows="4" animated>
        <div class="job-grid-container">
          <!-- 任务卡片网格 -->
          <transition-group name="job-list-transition" tag="div" class="job-grid">
            <template v-if="data.length > 0">
              <div v-for="(item, index) in data" :key="item.jobId || index" class="job-card-wrapper">
                <div class="job-card" :class="{ 'job-card-active': item.jobTriggerStatus === 1 }">
                  <!-- 卡片头部 -->
                  <div class="job-card-header">
                    <div class="job-env">
                      <el-tag size="small" effect="plain" class="job-env-tag">{{ item.jobApplicationActive }}</el-tag>
                    </div>
                    <div class="job-status">
                      <span class="job-status-indicator"
                        :class="item.jobTriggerStatus === 1 ? 'job-status-running' : 'job-status-stopped'">
                        <span class="job-status-dot"></span>
                        {{ item.jobTriggerStatus === 1 ? '运行中' : '已停止' }}
                      </span>
                    </div>
                  </div>

                  <!-- 卡片内容 -->
                  <div class="job-card-body">
                    <div class="job-card-left">
                      <div class="job-toggle-button" @click="item.jobTriggerStatus === 1 ? stop(item) : start(item)">
                        <IconifyIconOnline
                          :icon="item.jobTriggerStatus === 1 ? 'fluent:pause-circle-24-filled' : 'fluent:play-circle-24-filled'"
                          :class="item.jobTriggerStatus === 1 ? 'job-toggle-running' : 'job-toggle-stopped'" />
                      </div>
                    </div>

                    <div class="job-card-right">
                      <h3 class="job-name">{{ item.jobName }}</h3>
                      <div class="job-type">
                        <el-tag size="small" type="info">{{ item.jobGlueType }}</el-tag>
                      </div>

                      <div class="job-meta">
                        <div class="job-meta-item">
                          <IconifyIconOnline icon="fluent:timer-16-regular" class="job-icon" />
                          <span>{{ item.jobType }}</span>
                          <el-tag size="small" effect="light" class="job-schedule-tag">
                            {{ item.jobScheduleType }} {{ item.jobScheduleTime }}
                            <span v-if="item.jobScheduleType === 'FIXED'">秒</span>
                          </el-tag>
                        </div>

                        <div class="job-meta-item">
                          <IconifyIconOnline icon="fluent:person-16-regular" class="job-icon" />
                          <span>{{ item.jobAuthor }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- 卡片操作区 -->
                  <div class="job-card-actions">
                    <div class="job-action-buttons">
                      <el-tooltip content="编辑" placement="top">
                        <el-button circle size="small" @click="edit(item)" class="job-action-button">
                          <IconifyIconOnline icon="fluent:edit-16-regular" />
                        </el-button>
                      </el-tooltip>

                      <el-tooltip content="执行一次" placement="top">
                        <el-button circle size="small" type="success" @click="trigger(item)" class="job-action-button">
                          <IconifyIconOnline icon="fluent:play-16-filled" />
                        </el-button>
                      </el-tooltip>

                      <el-tooltip content="查看日志" placement="top">
                        <el-button circle size="small" type="info" @click="logger(item)" class="job-action-button">
                          <IconifyIconOnline icon="fluent:document-16-regular" />
                        </el-button>
                      </el-tooltip>
                    </div>

                    <div class="job-more-actions">
                      <el-dropdown trigger="click">
                        <el-button circle size="small" type="primary" plain class="job-more-button">
                          <IconifyIconOnline icon="fluent:more-horizontal-16-filled" />
                        </el-button>
                        <template #dropdown>
                          <el-dropdown-menu>
                            <el-dropdown-item @click="nextTriggerTime(item)">
                              <IconifyIconOnline icon="fluent:calendar-clock-16-regular" class="job-icon" />
                              下次执行时间
                            </el-dropdown-item>
                            <el-dropdown-item @click="jobgroupById(item)">
                              <IconifyIconOnline icon="fluent:server-16-regular" class="job-icon" />
                              注册节点
                            </el-dropdown-item>
                            <el-dropdown-item v-if="!item.jobTriggerStatus || item.jobTriggerStatus == 0" divided
                              @click="start(item)">
                              <IconifyIconOnline icon="fluent:play-16-filled" class="job-icon" />
                              启动
                            </el-dropdown-item>
                            <el-dropdown-item v-if="item.jobTriggerStatus == 1" divided @click="stop(item)">
                              <IconifyIconOnline icon="fluent:pause-16-filled" class="job-icon" />
                              停止
                            </el-dropdown-item>
                            <el-dropdown-item @click="copy(item)">
                              <IconifyIconOnline icon="fluent:copy-16-regular" class="job-icon" />
                              复制
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="del(item)">
                              <IconifyIconOnline icon="fluent:delete-16-regular" class="job-icon"
                                style="color: var(--el-color-danger);" />
                              <span style="color: var(--el-color-danger);">删除</span>
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </transition-group>

          <!-- 空状态 -->
          <el-empty v-if="data.length === 0 && !loading" description="暂无任务数据" class="job-empty-state">
            <el-button type="primary" @click="add">创建第一个任务</el-button>
          </el-empty>
        </div>

        <!-- 分页器 -->
        <div class="job-pagination">
          <scPagintion :page-size="form.size" :total="total" @data-change="search" />
        </div>
      </el-skeleton>
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
        <div v-for="item in jobinfoNextTriggerTimeData" :key="item" class="job-next-time-item">{{ item }}</div>
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

<script>
import { useRenderIcon } from "@repo/components/ReIcon/src/hooks";
import { fetchJobNextTriggerTime, fetchJobPageList, fetchJobDelete, fetchJobStart, fetchJobStop, fetchJobTrigger } from "@/api/monitor/job";
import { fetchAppList } from "@/api/monitor/app";
import { fetchServiceList } from "@/api/monitor/service";
import { defineAsyncComponent } from "vue";
import scPagintion from "@repo/components/ScPagintion/index.vue";

export default {
  name: "Task",
  components: {
    save: defineAsyncComponent(() => import("./save.vue")),
    scPagintion,
    ScSelectFilter: defineAsyncComponent(() => import("@repo/components/ScSelectFilter/index.vue"))
  },
  data() {
    return {
      triggerId: undefined,
      executorParam: "",
      addressList: "",
      triggerTitle: "",
      triggerShow: !1,
      saveShow: !1,
      jobinfoNextTriggerTimeShow: !1,
      jobgroupByIdShow: !1,
      triggerLoadding: !1,
      form: {
        mode: "card", // 默认设置为卡片视图
        jobTriggerStatus: null,
        jobDesc: undefined,
        jobGroup: 0,
        size: 10
      },
      data: [],
      loading: false,
      executorData: [],
      jobinfoNextTriggerTimeData: [],
      jobgroupByIdData: [],
      total: 0,
      filterData: [
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
      ]
    };
  },
  mounted() {
    this.initial();
  },
  methods: {
    useRenderIcon,
    handlerSuccess() {
      this.search();
    },
    edit(row) {
      this.saveShow = !0;
      this.$nextTick(() => {
        this.$refs.saveRef.setExecutorData(this.executorData).open("edit", row);
      });
    },
    copy(row) {
      this.saveShow = !0;
      this.$nextTick(() => {
        this.$refs.saveRef.setExecutorData(this.executorData).open("copy", row);
      });
    },
    del(row) {
      fetchJobDelete({
        id: row.jobId
      }).then(res => {
        if (res.code === "00000") {
          this.data = this.data.filter(it => it.jobId != row.jobId);
          this.$message.success("操作成功");
          return !1;
        }
        this.$message.error(res.msg);
      });
    },
    start(row) {
      fetchJobStart({
        jobId: row.jobId
      }).then(res => {
        if (res.code === "00000") {
          const item = this.data.filter(it => it.jobId == row.jobId);
          if (item && item.length > 0) {
            item[0].jobTriggerStatus = 1;
          }
          this.$message.success("操作成功");
          return !1;
        }
        this.$message.error(res.msg);
      });
    },
    stop(row) {
      fetchJobStop({
        jobId: row.jobId
      }).then(res => {
        if (res.code === "00000") {
          const item = this.data.filter(it => it.jobId == row.jobId);
          if (item && item.length > 0) {
            item[0].jobTriggerStatus = 0;
          }
          this.$message.success("操作成功");
          return !1;
        }
        this.$message.error(res.msg);
      });
    },
    add() {
      this.saveShow = !0;
      this.$nextTick(() => {
        this.$refs.saveRef.open("add", {});
      });
    },
    triggerExecute() {
      fetchJobTrigger({
        id: this.triggerId,
        executorParam: this.executorParam,
        addressList: this.addressList
      })
        .then(res => {
          if (res.code === "00000") {
            this.$message.success("操作成功");
            this.triggerShow = false;
            return !1;
          }
          this.$message.error(res.msg);
        })
        .finally(() => (this.triggerLoadding = !1));
    },
    /**执行一次 */
    trigger(row) {
      this.triggerTitle = row.jobName + "(执行一次)";
      this.triggerShow = !0;
      this.triggerId = row.jobId;
    },
    /**注册节点 */
    jobgroupById(row) {
      fetchServiceList({ uriSpec: "monitor" }).then(res => {
        if (res.code === "00000") {
          this.jobgroupByIdData = res.data.filter(it => {
            return it?.metadata?.applicationName == row.jobApplicationName && it?.metadata?.applicationActive == row.jobApplicationActive;
          });
          this.jobgroupByIdShow = true;
          return !1;
        }
        this.$message.error(res.msg);
      });
    },
    /**日志 */
    logger(row) {
      this.$router.push({
        path: "/job-log",
        query: {
          jobLogApp: row.jobApplicationName,
          jobLogProfile: row.jobApplicationProfile
        }
      });
    },
    /**下一次计划时间 */
    nextTriggerTime(row) {
      fetchJobNextTriggerTime({
        jobScheduleType: row.jobScheduleType,
        jobScheduleTime: row.jobScheduleTime
      }).then(res => {
        if (res.code === "00000") {
          this.jobinfoNextTriggerTimeData = res.data;
          this.jobinfoNextTriggerTimeShow = true;
          return !1;
        }
        this.$message.error(res.msg);
      });
    },
    async initial() {
      const res = await fetchAppList();
      this.executorData = res?.data;
      this.form.jobGroup = this.executorData && this.executorData.length == 1 ? this.executorData[0].monitorId : 0;
      this.search();
    },
    search(param) {
      if (param) {
        Object.assign(this.form, param);
      }
      this.loading = true;
      fetchJobPageList(this.form).then(res => {
        this.data = res?.data.data;
        this.total = res?.data.total;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    filterChange(row) {
      this.form.jobTriggerStatus = row.jobTriggerStatus;
      this.search();
    }
  }
};
</script>

<style scoped lang="scss">
/* 引入animate.css动画库 */
@import 'animate.css';

/* 全局容器 */
.job-dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--el-bg-color-page);
  padding: 20px;
  gap: 20px;
  overflow: hidden;
  /* 防止动画溢出 */
}

/* 顶部控制面板 - 添加入场动画 */
.job-control-panel {
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  transition: all 0.3s ease;
  animation: fadeInDown 0.6s ease-out;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
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
        transition: all 0.3s;

        &:hover {
          box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.2);
        }
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
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.2);
  }
}

.job-search-box {
  display: flex;
  flex: 1;
  min-width: 250px;

  .el-input {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    transition: all 0.3s;

    &:hover {
      box-shadow: 0 0 8px rgba(var(--el-color-primary-rgb), 0.2);
    }
  }

  .job-search-button {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: -1px;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

.job-add-button {
  white-space: nowrap;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(var(--el-color-success-rgb), 0.3);
  }
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
    transition: opacity 0.3s;
  }

  &:hover .job-app-label {
    opacity: 1;
  }
}

/* 主内容区域 - 添加渐入动画 */
.job-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.8s ease-out;
}

.job-grid-container {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--el-border-color);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-track {
    background-color: var(--el-fill-color-lighter);
  }
}

.job-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
  padding: 10px;
}

/* 卡片样式 - 添加3D效果和动画 */
.job-card-wrapper {
  height: 100%;
  perspective: 1000px;
  animation: fadeIn 0.6s ease-out;
  animation-fill-mode: both;
}

/* 为卡片添加交错动画 */
@for $i from 1 through 20 {
  .job-card-wrapper:nth-child(#{$i}) {
    animation-delay: #{$i * 0.05}s;
  }
}

.job-card {
  height: 100%;
  background-color: var(--el-bg-color);
  border-radius: 12px;
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  border: 1px solid var(--el-border-color-lighter);
  transform-style: preserve-3d;
  position: relative;

  &:hover {
    transform: translateY(-8px) rotateX(2deg);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
    border-color: var(--el-border-color);

    .job-toggle-button {
      transform: scale(1.1);
    }
  }

  &.job-card-active {
    border-top: 3px solid var(--el-color-success);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, rgba(var(--el-color-success-rgb), 0.05) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }
  }
}

.job-card-header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--el-fill-color-light);
  border-bottom: 1px solid var(--el-border-color-lighter);
  position: relative;
  z-index: 1;
}

.job-env-tag {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.job-status-indicator {
  display: flex;
  align-items: center;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  transition: all 0.3s;

  .job-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 5px;
    position: relative;
  }

  &.job-status-running {
    background-color: rgba(var(--el-color-success-rgb), 0.1);
    color: var(--el-color-success);

    .job-status-dot {
      background-color: var(--el-color-success);
      box-shadow: 0 0 0 2px rgba(var(--el-color-success-rgb), 0.2);

      &::after {
        content: '';
        position: absolute;
        top: -4px;
        left: -4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: rgba(var(--el-color-success-rgb), 0.1);
        animation: pulse 1.5s infinite;
      }
    }
  }

  &.job-status-stopped {
    background-color: rgba(var(--el-text-color-secondary-rgb), 0.1);
    color: var(--el-text-color-secondary);

    .job-status-dot {
      background-color: var(--el-text-color-secondary);
      box-shadow: 0 0 0 2px rgba(var(--el-text-color-secondary-rgb), 0.2);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

/* 脉冲动画 */
@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.8;
  }

  70% {
    transform: scale(1.5);
    opacity: 0;
  }

  100% {
    transform: scale(0.8);
    opacity: 0;
  }
}

.job-card-body {
  flex: 1;
  padding: 16px;
  display: flex;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.job-card-left {
  display: flex;
  align-items: center;
}

.job-toggle-button {
  cursor: pointer;
  font-size: 36px;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  filter: drop-shadow(0 2px 5px rgba(0, 0, 0, 0.1));

  &:hover {
    transform: scale(1.2) rotate(5deg);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
  }

  .job-toggle-running {
    color: var(--el-color-success);
  }

  .job-toggle-stopped {
    color: var(--el-color-primary);
  }
}

.job-card-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.job-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color 0.3s;

  .job-card:hover & {
    color: var(--el-color-primary);
  }
}

.job-type {
  margin-top: 4px;
}

.job-meta {
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.job-meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  transition: all 0.3s;

  &:hover {
    color: var(--el-text-color-primary);
  }
}

.job-schedule-tag {
  margin-left: 6px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  }
}

.job-card-actions {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--el-border-color-lighter);
  background-color: var(--el-fill-color-light);
  position: relative;
  z-index: 1;
}

.job-action-buttons {
  display: flex;
  gap: 8px;
}

.job-action-button {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

.job-more-button {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  &:hover {
    transform: translateY(-4px) rotate(90deg);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
}

/* 分页器 - 添加上浮动画 */
.job-pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  padding: 16px 0;
  background-color: var(--el-bg-color);
  border-radius: 8px;
  box-shadow: var(--el-box-shadow-light);
  animation: fadeInUp 0.6s ease-out;
  transition: all 0.3s;

  &:hover {
    box-shadow: var(--el-box-shadow);
  }
}

/* 弹窗样式 */
.job-dialog {
  :deep(.el-dialog) {
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    transition: all 0.3s;
  }

  :deep(.el-dialog__header) {
    padding: 20px;
    margin-right: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
  }

  :deep(.el-dialog__body) {
    padding: 20px;
    background-color: var(--el-bg-color-page);
  }

  :deep(.el-dialog__footer) {
    padding: 16px 20px;
    border-top: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
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
    transition: all 0.3s;
    border-left: 3px solid var(--el-color-primary);

    &:last-child {
      margin-bottom: 0;
    }

    &:hover {
      transform: translateX(5px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
  }
}

/* 节点列表 */
.job-node-list {
  max-height: 300px;
  overflow-y: auto;

  .job-node-item {
    margin-bottom: 10px;
    transition: all 0.3s;

    &:last-child {
      margin-bottom: 0;
    }

    .el-tag {
      transition: all 0.3s;
      cursor: pointer;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
    }
  }
}

/* 空状态 */
.job-empty-state {
  padding: 40px 0;
  transition: all 0.3s;

  .el-button {
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
  }
}

/* 列表过渡动画 */
.job-list-transition-enter-active,
.job-list-transition-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.job-list-transition-enter-from,
.job-list-transition-leave-to {
  opacity: 0;
  transform: translateY(30px) scale(0.9);
}

/* 基础动画 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 辅助类 */
.job-icon {
  margin-right: 4px;
}

.job-skeleton-loader {
  padding: 10px 0;
}
</style>