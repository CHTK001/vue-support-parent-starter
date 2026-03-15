<template>
  <sc-dialog
    v-model="triggerShow"
    draggable
    append-to-body
    width="900px"
    class="task-dialog"
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="dialog-header">
        <div class="header-icon" :class="modeClass">
          <IconifyIconOnline :icon="modeIcon" />
        </div>
        <div class="header-info">
          <span class="header-title">{{ title }}</span>
          <span class="header-subtitle">{{ subtitle }}</span>
        </div>
      </div>
    </template>

    <ScForm :model="form" :rules="rules" label-width="90px" class="task-form">
      <ScTabs v-model="activeTab" class="task-tabs">
        <!-- 基础配置 Tab -->
        <ScTabPane name="basic">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:settings-3-line" />
              <span>基础配置</span>
            </span>
          </template>
          <div class="tab-content">
            <ScRow :gutter="16">
              <ScCol :span="8">
                <ScFormItem label="任务名称" prop="jobName">
                  <ScInput
                    v-model="form.jobName"
                    placeholder="请输入任务名称"
                    maxlength="50"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="负责人" prop="jobAuthor">
                  <ScInput
                    v-model="form.jobAuthor"
                    maxlength="50"
                    placeholder="请输入负责人"
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="任务环境" prop="jobApplicationActive">
                  <ScSelect
                    v-model="form.jobApplicationActive"
                    allow-create
                    placeholder="请选择"
                    style="width: 100%"
                  >
                    <ScOption value="dev" label="开发" />
                    <ScOption value="prod" label="生产" />
                    <ScOption value="test" label="测试" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="执行器" prop="jobGroup">
                  <ScSelect
                    v-model="form.monitorId"
                    clearable
                    filterable
                    placeholder="请选择"
                    style="width: 100%"
                  >
                    <ScOption
                      v-for="item in executorData"
                      :key="item.monitorId"
                      :value="item.monitorId"
                      :label="item.monitorName"
                    />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="运行模式" prop="jobGlueType">
                  <ScSelect
                    v-model="form.jobGlueType"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <ScOption value="BEAN" label="BEAN" />
                    <ScOption value="GLUE_GROOVY" label="GLUE(Java)" />
                    <ScOption value="GLUE_SHELL" label="GLUE(Shell)" />
                    <ScOption value="GLUE_PYTHON" label="GLUE(Python)" />
                    <ScOption value="GLUE_NODEJS" label="GLUE(NodeJs)" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="运行名称" prop="jobExecuteBean">
                  <ScInput
                    v-model="form.jobExecuteBean"
                    maxlength="100"
                    placeholder="后端执行名称"
                    clearable
                  />
                </ScFormItem>
              </ScCol>
              <ScCol :span="24">
                <ScFormItem label="报警邮件">
                  <ScInput
                    v-model="form.jobAlarmEmail"
                    maxlength="100"
                    placeholder="多个邮件地址用逗号分隔"
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>
        </ScTabPane>

        <!-- 调度配置 Tab -->
        <ScTabPane name="schedule">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:time-line" />
              <span>调度配置</span>
            </span>
          </template>
          <div class="tab-content">
            <ScRow :gutter="16">
              <ScCol :span="12">
                <ScFormItem label="调度类型" prop="jobScheduleType">
                  <ScRadioGroup v-model="form.jobScheduleType">
                    <el-radio-button label="NONE">无</el-radio-button>
                    <el-radio-button label="CRON">Cron</el-radio-button>
                    <el-radio-button label="FIX_RATE">固定速率</el-radio-button>
                  </ScRadioGroup>
                </ScFormItem>
              </ScCol>
              <ScCol :span="12">
                <ScFormItem
                  v-if="form.jobScheduleType == 'CRON'"
                  label="Cron表达式"
                  prop="scheduleConf"
                >
                  <sc-cron
                    v-model="form.jobScheduleTime"
                    maxlength="128"
                    placeholder="请输入Cron定时规则"
                    clearable
                    :shortcuts="shortcuts"
                  />
                </ScFormItem>
                <ScFormItem
                  v-if="form.jobScheduleType == 'FIX_RATE'"
                  label="间隔时间"
                  prop="scheduleConf"
                >
                  <ScInput
                    v-model="form.jobScheduleTime"
                    :maxlength="10"
                    placeholder="单位：秒"
                    clearable
                  >
                    <template #suffix>秒</template>
                  </ScInput>
                </ScFormItem>
              </ScCol>
              <ScCol :span="24">
                <ScFormItem label="任务参数" prop="jobExecutorParam">
                  <ScInput
                    v-model="form.jobExecutorParam"
                    type="textarea"
                    :rows="3"
                    maxlength="512"
                    placeholder="请输入任务参数"
                    clearable
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>
        </ScTabPane>

        <!-- 高级配置 Tab -->
        <ScTabPane name="advanced">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:tools-line" />
              <span>高级配置</span>
            </span>
          </template>
          <div class="tab-content">
            <ScRow :gutter="16">
              <ScCol :span="8">
                <ScFormItem label="路由策略" prop="jobExecutorRouteStrategy">
                  <ScSelect
                    v-model="form.jobExecutorRouteStrategy"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <ScOption value="FIRST" label="第一个" />
                    <ScOption value="LAST" label="最后一个" />
                    <ScOption value="ROUND" label="轮询" />
                    <ScOption value="RANDOM" label="随机" />
                    <ScOption value="FAILOVER" label="故障转移" />
                    <ScOption value="SHARDING_BROADCAST" label="分片广播" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="过期策略" prop="jobExecuteMisfireStrategy">
                  <ScSelect
                    v-model="form.jobExecuteMisfireStrategy"
                    style="width: 100%"
                  >
                    <ScOption value="DO_NOTHING" label="忽略" />
                    <ScOption value="FIRE_ONCE_NOW" label="立即执行一次" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="阻塞策略" prop="jobExecutorBlockStrategy">
                  <ScSelect
                    v-model="form.jobExecutorBlockStrategy"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <ScOption value="SERIAL_EXECUTION" label="单机串行" />
                    <ScOption value="DISCARD_LATER" label="丢弃后续调度" />
                    <ScOption value="COVER_EARLY" label="覆盖之前调度" />
                  </ScSelect>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="超时时间" prop="jobExecutorTimeout">
                  <ScInput
                    v-model="form.jobExecutorTimeout"
                    maxlength="6"
                    placeholder="单位秒，0表示不限制"
                    clearable
                  >
                    <template #suffix>秒</template>
                  </ScInput>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="重试次数" prop="jobExecutorFailRetryCount">
                  <ScInput
                    v-model="form.jobExecutorFailRetryCount"
                    maxlength="4"
                    placeholder="失败重试次数"
                    clearable
                  >
                    <template #suffix>次</template>
                  </ScInput>
                </ScFormItem>
              </ScCol>
              <ScCol :span="8">
                <ScFormItem label="子任务ID" prop="childJobId">
                  <ScInput
                    v-model="form.childJobId"
                    maxlength="100"
                    placeholder="多个用逗号分隔"
                    clearable
                  />
                </ScFormItem>
              </ScCol>
            </ScRow>
          </div>
        </ScTabPane>
      </ScTabs>
    </ScForm>

    <template #footer>
      <div class="dialog-footer">
        <ScButton @click="triggerShow = false">取消</ScButton>
        <ScButton type="primary" :loading="loading" @click="submit">
          <IconifyIconOnline icon="ri:check-line" />
          <span>确认提交</span>
        </ScButton>
      </div>
    </template>
  </sc-dialog>
</template>
<script>
import { fetchJobSave, fetchJobUpdate } from "@/api/monitor/job";
import scCron from "@repo/components/ScCron/index.vue";
import { useUserStore } from "@repo/core";
export default {
  name: "Save",
  components: {
    scCron,
  },
  data() {
    return {
      loading: false,
      triggerShow: !1,
      executorData: [],
      activeTab: "basic",
      shortcuts: [
        {
          text: "每天8点和12点 (自定义追加)",
          value: "0 0 8,12 * * ?",
        },
        {
          text: "每分钟 (自定义追加)",
          value: "0 * * * * ?",
        },
      ],
      mode: "add",
      title: "新增任务",
      subtitle: "创建新的定时任务配置",
      rules: {
        jobGroup: [
          { trigger: "blur", message: "任务执行器不能为空", required: !0 },
        ],
        jobName: [
          { trigger: "blur", message: "任务描述不能为空", required: !0 },
        ],
        jobGlueType: [
          { trigger: "blur", message: "运行模式不能为空", required: !0 },
        ],
        jobScheduleType: [
          { trigger: "blur", message: "任务类型不能为空", required: !0 },
        ],
        jobScheduleTime: [
          {
            trigger: "blur",
            message: "任务时间不能为空不能为空",
            required: !0,
          },
        ],
        jobExecutorHandler: [
          { trigger: "blur", message: "任务名称不能为空", required: !0 },
        ],
        monitorId: [
          { trigger: "blur", message: "所属应用不能为空", required: !0 },
        ],
        jobAuthor: [
          { trigger: "blur", message: "负责人不能为空", required: !0 },
        ],
      },
      form: {
        monitorId: null,
        jobExecuteMisfireStrategy: "DO_NOTHING",
        jobScheduleType: "CRON",
        jobExecutorBlockStrategy: "SERIAL_EXECUTION",
        jobScheduleTime: "",
        jobGlueType: "BEAN",
        jobExecutorRouteStrategy: "FIRST",
      },
    };
  },
  computed: {
    modeIcon() {
      const iconMap = {
        add: "ri:add-circle-line",
        edit: "ri:edit-line",
        copy: "ri:file-copy-line",
      };
      return iconMap[this.mode] || "ri:add-circle-line";
    },
    modeClass() {
      return `mode-${this.mode}`;
    },
  },
  methods: {
    async submit() {
      this.loading = !0;
      var res = undefined;
      const appItem = this.executorData.filter(
        (it) => it.monitorId == this.form.monitorId,
      );
      if (appItem && appItem.length > 0) {
        this.form.jobApplicationName = appItem[0].monitorApplicationName;
      }
      if (this.mode == "add" || this.mode == "copy") {
        res = await fetchJobSave(this.form).finally(() => (this.loading = !1));
      } else {
        res = await fetchJobUpdate(this.form).finally(
          () => (this.loading = !1),
        );
      }
      if (res.code === "00000") {
        this.$emit("success");
        this.triggerShow = !1;
        return !1;
      }
      this.$message.error(res.msg);
    },
    setExecutorData(item) {
      this.executorData = item;
      return this;
    },
    open(mode = "add", row) {
      this.triggerShow = !0;
      this.mode = mode;

      if (mode === "edit") {
        this.title = "编辑任务";
        this.subtitle = `正在编辑：${row.jobName}`;
      } else if (mode === "copy") {
        this.title = "复制任务";
        this.subtitle = `基于「${row.jobName}」创建副本`;
      } else {
        this.title = "新增任务";
        this.subtitle = "创建新的定时任务配置";
      }

      Object.assign(this.form, row);
      if (mode === "copy") {
        delete this.form.jobId;
      }
      if (mode === "add") {
        this.form.jobAuthor = useUserStore().username;
      }
    },
  },
};
</script>

<style scoped lang="scss">
/* 弹窗头部样式 */
.dialog-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  flex-shrink: 0;
}

.header-icon.mode-add {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.header-icon.mode-edit {
  background: linear-gradient(135deg, #3b82f6, #2563eb);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.header-icon.mode-copy {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.header-subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/* Tabs 样式 */
.task-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  :deep(.el-tabs__nav-wrap::after) {
    display: none;
  }

  :deep(.el-tabs__item) {
    padding: 0 20px;
    height: 48px;
    line-height: 48px;
  }

  :deep(.el-tabs__active-bar) {
    height: 3px;
    border-radius: 3px;
  }
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
}

.tab-content {
  padding: 20px 0;
}

/* 表单样式 */
.task-form {
  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    font-weight: 500;
    color: var(--el-text-color-regular);
    font-size: 13px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-select__wrapper),
  :deep(.el-textarea__inner) {
    border-radius: 8px;
  }

  :deep(.el-radio-button__inner) {
    border-radius: 6px;
  }

  :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: 6px 0 0 6px;
  }

  :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 6px 6px 0;
  }
}

/* 底部按钮 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--el-border-color-lighter);

  .el-button {
    padding: 10px 24px;
    border-radius: 8px;
    font-weight: 500;

    &--primary {
      display: flex;
      align-items: center;
      gap: 6px;
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 12px;
    padding: 12px 16px;
  }
}
</style>
