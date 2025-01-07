<template>
  <div class="p-1">
    <el-container>
      <el-header style="height: auto">
        <Suspense>
          <template #default>
            <div>
              <sc-select-filter :data="filterData" :label-width="80" @on-change="filterChange" />
            </div>
          </template>
        </Suspense>
      </el-header>
      <el-header>
        <div class="flex flex-1">
          <el-radio-group v-model="form.mode" class="pl-1 !w-[140px]" readonly>
            <el-radio-button value="card" label="卡片" />
            <el-radio-button value="small" label="紧凑" />
          </el-radio-group>

          <el-select v-model="form.jobGroup" class="pl-1 !w-[180px]" readonly>
            <el-option :value="0" label="全部" />
            <el-option v-for="item in executorData" :key="item.monitorId" :value="item.monitorId" :label="item.monitorName">
              <span style="float: left">{{ item.monitorName }}</span>
              <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ item.monitorApplicationName }}</span>
            </el-option>
          </el-select>
          <el-input v-model="form.jobDesc" placeholder="任务描述" clearable class="ml-4 !w-[180px]" />
          <div class="ml-4">
            <el-button type="primary" :icon="useRenderIcon('ep:search')" class="pl-2" @click="search" />
          </div>
        </div>
      </el-header>
      <el-main class="nopadding">
        <el-skeleton :loading="loading" animated>
          <el-container>
            <el-main>
              <el-row v-if="form.mode == 'card'" :gutter="15">
                <el-col v-for="item in data" :key="item.id" :xl="6" :lg="6" :md="8" :sm="12" :xs="24" class="demo-progress">
                  <el-card class="task task-item" shadow="always">
                    <el-row>
                      <el-col :span="24">
                        <ul>
                          <li>
                            <h4>运行模式</h4>
                            <p>
                              {{ item.jobName }}
                              <el-tag class="text-sm">{{ item.jobGlueType }}</el-tag>
                            </p>
                          </li>
                          <li>
                            <h4>任务类型</h4>
                            <p>
                              <span class="el-text">{{ item.jobType }}</span>
                              <el-tag effect="light">
                                {{ item.jobScheduleType }} {{ item.jobScheduleTime }}
                                <span v-if="item.jobScheduleType === 'FIXED'">{{ $t("message.second") }}</span>
                              </el-tag>
                            </p>
                          </li>
                        </ul>
                      </el-col>
                    </el-row>
                    <div class="bottom">
                      <div class="state">
                        <el-col :span="24">
                          <span class="el-text">负责人: {{ item.jobAuthor }}</span>
                          <span style="margin-left: 10px" />
                          <el-button size="small" circle :icon="useRenderIcon('ep:edit')" @click="edit(item)" />
                        </el-col>
                      </div>
                      <div class="handler">
                        <el-dropdown trigger="click">
                          <el-button type="primary" :icon="useRenderIcon('ep:more')" circle plain />
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item @click="trigger(item)">执行一次</el-dropdown-item>
                              <div v-menu="['job-log']" @click="logger(item)">
                                <el-dropdown-item>查询日志</el-dropdown-item>
                              </div>
                              <el-dropdown-item @click="jobgroupById(item)">注册节点</el-dropdown-item>
                              <el-dropdown-item @click="nextTriggerTime(item)">下次执行时间</el-dropdown-item>
                              <el-dropdown-item v-if="!item.triggerStatus || item.triggerStatus == 0" divided @click="start(item)">启动</el-dropdown-item>
                              <el-dropdown-item v-if="item.triggerStatus == 1" divided @click="stop(item)">停止</el-dropdown-item>
                              <el-dropdown-item @click="edit(item)">编辑</el-dropdown-item>
                              <el-dropdown-item @click="del(item)">删除</el-dropdown-item>
                              <el-dropdown-item @click="copy(item)">复制</el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                  <el-card class="task task-add cursor-pointer" shadow="never" @click="add">
                    <el-icon>
                      <component :is="useRenderIcon('ep:plus')" />
                    </el-icon>
                    <p>添加计划任务</p>
                  </el-card>
                </el-col>
              </el-row>
              <el-row v-else-if="form.mode == 'small'" :gutter="15">
                <el-col v-for="item in data" :key="item.id" :xl="6" :lg="6" :md="8" :sm="12" :xs="24" class="border-spacing-0 border-green-600">
                  <el-card :class="{
                  relative: true,
                  'border-gray-500': item.jobTriggerStatus == 0,
                  'bg-stop': item.jobTriggerStatus == 0,
                  'border-green-600': item.jobTriggerStatus == 1,
                  'bg-start': item.jobTriggerStatus == 1
                }">
                    <div class="absolute -left-2 top-0 !w-[40px] -rotate-45" :title="item.jobApplicationActive">
                      <el-tag type="primary">
                        {{ item.jobApplicationActive }}
                      </el-tag>
                    </div>
                    <div :class="{
                    ' flex flex-2 ': true
                  }">
                      <div class="basis-1">
                        <el-icon size="35" class="cursor-pointer">
                          <component :is="useRenderIcon('ri:play-large-line')" v-if="item.jobTriggerStatus == 0" class="text-gray-400" @click="start(item)" />
                          <component :is="useRenderIcon('ri:pause-large-fill')" v-else class="text-green-500" @click="stop(item)" />
                        </el-icon>
                      </div>
                      <div class="basis-4/6 mt-1">
                        <el-divider direction="vertical" />
                        <el-tag class="truncate max-w-[50px] mr-1">{{ item.jobName }}</el-tag>
                        <span v-if="item.jobScheduleType === 'FIX_RATE'">{{ item.jobScheduleTime }} {{ $t("message.second") }}</span>
                        <span v-else>{{ item.jobScheduleTime }}</span>
                      </div>
                      <div class="basis-1/6 mt-1">
                        <el-divider direction="vertical" />
                        <span>{{ item.jobAuthor }}</span>
                      </div>
                      <div class="basis-1/6 mt-[10px]">
                        <el-dropdown trigger="click">
                          <el-icon>
                            <component :is="useRenderIcon('ep:more')" />
                          </el-icon>
                          <template #dropdown>
                            <el-dropdown-menu>
                              <el-dropdown-item @click="trigger(item)">执行一次</el-dropdown-item>
                              <div v-menu="['job-log']" @click="logger(item)">
                                <el-dropdown-item>查询日志</el-dropdown-item>
                              </div>
                              <el-dropdown-item @click="jobgroupById(item)">注册节点</el-dropdown-item>
                              <el-dropdown-item @click="nextTriggerTime(item)">下次执行时间</el-dropdown-item>
                              <el-dropdown-item v-if="!item.jobTriggerStatus || item.jobTriggerStatus == 0" divided @click="start(item)">启动</el-dropdown-item>
                              <el-dropdown-item v-if="item.jobTriggerStatus == 1" divided @click="stop(item)">停止</el-dropdown-item>
                              <el-dropdown-item @click="edit(item)">编辑</el-dropdown-item>
                              <el-dropdown-item @click="del(item)">删除</el-dropdown-item>
                              <el-dropdown-item @click="copy(item)">复制</el-dropdown-item>
                            </el-dropdown-menu>
                          </template>
                        </el-dropdown>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                  <el-card shadow="always" class="h-full cursor-pointer" @click="add">
                    <div class="text-center mt-2">
                      <el-icon class="mt-1 top-0.5">
                        <component :is="useRenderIcon('ep:plus')" />
                      </el-icon>
                      <span class="ml-2">添加计划任务</span>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-main>
            <el-footer style="height: 51px; line-height: 50px; padding: 0">
              <scPagintion :pageSize="form.size" :total="total" @dataChange="search" />
            </el-footer>
          </el-container>
        </el-skeleton>
      </el-main>
    </el-container>

    <el-dialog v-model="triggerShow" draggable :title="triggerTitle">
      <el-form :model="form" label-width="120px">
        <el-form-item label="任务参数">
          <el-input v-model="executorParam" type="textarea" :rows="6" />
        </el-form-item>
        <el-form-item label="机器地址">
          <el-input v-model="addressList" type="textarea" :rows="6" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button :loading="triggerLoadding" @click="triggerShow = false">取消</el-button>
          <el-button :loading="triggerLoadding" type="primary" @click="triggerExecute">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="jobinfoNextTriggerTimeShow" draggable title="下一次执行时间" width="20%">
      <p v-for="item in jobinfoNextTriggerTimeData" :key="item" style="padding: 5px">{{ item }}</p>
    </el-dialog>

    <el-dialog v-model="jobgroupByIdShow" draggable title="注册地址" width="20%">
      <el-empty v-if="jobgroupByIdData.length == 0" />
      <div v-else>
        <p v-for="item in jobgroupByIdData" :key="item" class="p-5">
          <el-tag>{{ item?.host }}:{{ item?.port }}</el-tag>
        </p>
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
        mode: "small",
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
      fetchJobPageList(this.form).then(res => {
        this.data = res?.data.data;
        this.total = res?.data.total;
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
.bg-stop {
  background: linear-gradient(45deg, #88888856, #fff, #ffffff);
}

.bg-start {
  background: linear-gradient(45deg, #1ca4e256, #fff, #ffffff);
}

:deep(.task .el-card__body) {
  height: unset;
}

.task {
  height: 210px;
}

.task-item h2 {
  font-size: 15px;
  color: #3c4a54;
  padding-bottom: 15px;
}

.task-item li {
  list-style-type: none;
  margin-bottom: 10px;
}

.task-item li h4 {
  font-size: 12px;
  font-weight: normal;
  color: #999;
}

.task-item li p {
  margin-top: 5px;
}

.task-item .bottom {
  border-top: 1px solid #ebeef5;
  text-align: right;
  padding-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.task-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
  color: #999;
}

.task-add:hover {
  color: #409eff;
}

.task-add i {
  font-size: 30px;
}

.task-add p {
  font-size: 12px;
  margin-top: 20px;
}

.dark .task-item .bottom {
  border-color: var(--el-border-color-light);
}

.progress {
  margin-top: -45px;
}

.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 18px;
}

.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}

.demo-progress .el-progress--line {
  margin-bottom: 15px;
  width: 350px;
}

.demo-progress .el-progress--circle {
  margin-right: 15px;
}
</style>
