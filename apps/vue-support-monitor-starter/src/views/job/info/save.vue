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

    <el-form :model="form" :rules="rules" label-width="90px" class="task-form">
      <div class="task-guide-banner">
        <el-alert type="info" :closable="false" show-icon>
          <template #title>
            点击每个字段标题后的问号图标，可查看填写建议、示例值和界面引导图。
          </template>
        </el-alert>
      </div>
      <el-tabs v-model="activeTab" class="task-tabs">
        <!-- 基础配置 Tab -->
        <el-tab-pane name="basic">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:settings-3-line" />
              <span>基础配置</span>
            </span>
          </template>
          <div class="tab-content">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item prop="jobName">
                  <template #label>
                    <FieldGuideLabel label="任务名称" @open="openFieldGuide('jobName')" />
                  </template>
                  <el-input
                    v-model="form.jobName"
                    placeholder="请输入任务名称"
                    maxlength="50"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobAuthor">
                  <template #label>
                    <FieldGuideLabel label="负责人" @open="openFieldGuide('jobAuthor')" />
                  </template>
                  <el-input
                    v-model="form.jobAuthor"
                    maxlength="50"
                    placeholder="请输入负责人"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobApplicationActive">
                  <template #label>
                    <FieldGuideLabel
                      label="任务环境"
                      @open="openFieldGuide('jobApplicationActive')"
                    />
                  </template>
                  <el-select
                    v-model="form.jobApplicationActive"
                    allow-create
                    placeholder="请选择"
                    style="width: 100%"
                  >
                    <el-option value="dev" label="开发" />
                    <el-option value="prod" label="生产" />
                    <el-option value="test" label="测试" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobGroup">
                  <template #label>
                    <FieldGuideLabel label="执行器" @open="openFieldGuide('monitorId')" />
                  </template>
                  <el-select
                    v-model="form.monitorId"
                    clearable
                    filterable
                    placeholder="请选择"
                    style="width: 100%"
                  >
                    <el-option
                      v-for="item in executorData"
                      :key="item.monitorId"
                      :value="item.monitorId"
                      :label="item.monitorName"
                    />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobGlueType">
                  <template #label>
                    <FieldGuideLabel label="运行模式" @open="openFieldGuide('jobGlueType')" />
                  </template>
                  <el-select
                    v-model="form.jobGlueType"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <el-option value="BEAN" label="BEAN" />
                    <el-option value="GLUE_GROOVY" label="GLUE(Java)" />
                    <el-option value="GLUE_SHELL" label="GLUE(Shell)" />
                    <el-option value="GLUE_PYTHON" label="GLUE(Python)" />
                    <el-option value="GLUE_NODEJS" label="GLUE(NodeJs)" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobExecuteBean">
                  <template #label>
                    <FieldGuideLabel
                      label="运行名称"
                      @open="openFieldGuide('jobExecuteBean')"
                    />
                  </template>
                  <el-input
                    v-model="form.jobExecuteBean"
                    maxlength="100"
                    placeholder="后端执行名称"
                    clearable
                  />
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item>
                  <template #label>
                    <FieldGuideLabel
                      label="报警邮件"
                      @open="openFieldGuide('jobAlarmEmail')"
                    />
                  </template>
                  <el-input
                    v-model="form.jobAlarmEmail"
                    maxlength="100"
                    placeholder="多个邮件地址用逗号分隔"
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 调度配置 Tab -->
        <el-tab-pane name="schedule">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:time-line" />
              <span>调度配置</span>
            </span>
          </template>
          <div class="tab-content">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item prop="jobScheduleType">
                  <template #label>
                    <FieldGuideLabel
                      label="调度类型"
                      @open="openFieldGuide('jobScheduleType')"
                    />
                  </template>
                  <el-radio-group v-model="form.jobScheduleType">
                    <el-radio-button label="NONE">无</el-radio-button>
                    <el-radio-button label="CRON">Cron</el-radio-button>
                    <el-radio-button label="FIX_RATE">固定速率</el-radio-button>
                  </el-radio-group>
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item
                  v-if="form.jobScheduleType == 'CRON'"
                  prop="scheduleConf"
                >
                  <template #label>
                    <FieldGuideLabel
                      label="Cron表达式"
                      @open="openFieldGuide('jobScheduleTime')"
                    />
                  </template>
                  <sc-cron
                    v-model="form.jobScheduleTime"
                    maxlength="128"
                    placeholder="请输入Cron定时规则"
                    clearable
                    :shortcuts="shortcuts"
                  />
                </el-form-item>
                <el-form-item
                  v-if="form.jobScheduleType == 'FIX_RATE'"
                  prop="scheduleConf"
                >
                  <template #label>
                    <FieldGuideLabel
                      label="间隔时间"
                      @open="openFieldGuide('jobScheduleTime')"
                    />
                  </template>
                  <el-input
                    v-model="form.jobScheduleTime"
                    :maxlength="10"
                    placeholder="单位：秒"
                    clearable
                  >
                    <template #suffix>秒</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="24">
                <el-form-item prop="jobExecutorParam">
                  <template #label>
                    <FieldGuideLabel
                      label="任务参数"
                      @open="openFieldGuide('jobExecutorParam')"
                    />
                  </template>
                  <el-input
                    v-model="form.jobExecutorParam"
                    type="textarea"
                    :rows="3"
                    maxlength="512"
                    placeholder="请输入任务参数"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 高级配置 Tab -->
        <el-tab-pane name="advanced">
          <template #label>
            <span class="tab-label">
              <IconifyIconOnline icon="ri:tools-line" />
              <span>高级配置</span>
            </span>
          </template>
          <div class="tab-content">
            <el-row :gutter="16">
              <el-col :span="8">
                <el-form-item prop="jobExecutorRouteStrategy">
                  <template #label>
                    <FieldGuideLabel
                      label="路由策略"
                      @open="openFieldGuide('jobExecutorRouteStrategy')"
                    />
                  </template>
                  <el-select
                    v-model="form.jobExecutorRouteStrategy"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <el-option value="FIRST" label="第一个" />
                    <el-option value="LAST" label="最后一个" />
                    <el-option value="ROUND" label="轮询" />
                    <el-option value="RANDOM" label="随机" />
                    <el-option value="FAILOVER" label="故障转移" />
                    <el-option value="SHARDING_BROADCAST" label="分片广播" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobExecuteMisfireStrategy">
                  <template #label>
                    <FieldGuideLabel
                      label="过期策略"
                      @open="openFieldGuide('jobExecuteMisfireStrategy')"
                    />
                  </template>
                  <el-select
                    v-model="form.jobExecuteMisfireStrategy"
                    style="width: 100%"
                  >
                    <el-option value="DO_NOTHING" label="忽略" />
                    <el-option value="FIRE_ONCE_NOW" label="立即执行一次" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobExecutorBlockStrategy">
                  <template #label>
                    <FieldGuideLabel
                      label="阻塞策略"
                      @open="openFieldGuide('jobExecutorBlockStrategy')"
                    />
                  </template>
                  <el-select
                    v-model="form.jobExecutorBlockStrategy"
                    clearable
                    filterable
                    style="width: 100%"
                  >
                    <el-option value="SERIAL_EXECUTION" label="单机串行" />
                    <el-option value="DISCARD_LATER" label="丢弃后续调度" />
                    <el-option value="COVER_EARLY" label="覆盖之前调度" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobExecutorTimeout">
                  <template #label>
                    <FieldGuideLabel
                      label="超时时间"
                      @open="openFieldGuide('jobExecutorTimeout')"
                    />
                  </template>
                  <el-input
                    v-model="form.jobExecutorTimeout"
                    maxlength="6"
                    placeholder="单位秒，0表示不限制"
                    clearable
                  >
                    <template #suffix>秒</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="jobExecutorFailRetryCount">
                  <template #label>
                    <FieldGuideLabel
                      label="重试次数"
                      @open="openFieldGuide('jobExecutorFailRetryCount')"
                    />
                  </template>
                  <el-input
                    v-model="form.jobExecutorFailRetryCount"
                    maxlength="4"
                    placeholder="失败重试次数"
                    clearable
                  >
                    <template #suffix>次</template>
                  </el-input>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item prop="childJobId">
                  <template #label>
                    <FieldGuideLabel label="子任务ID" @open="openFieldGuide('childJobId')" />
                  </template>
                  <el-input
                    v-model="form.childJobId"
                    maxlength="100"
                    placeholder="多个用逗号分隔"
                    clearable
                  />
                </el-form-item>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="triggerShow = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="submit">
          <IconifyIconOnline icon="ri:check-line" />
          <span>确认提交</span>
        </el-button>
      </div>
    </template>
  </sc-dialog>

  <el-dialog
    v-model="fieldGuideDialogVisible"
    append-to-body
    width="860px"
    class="task-guide-dialog"
    destroy-on-close
  >
    <template #header>
      <div class="guide-dialog__header" v-if="currentFieldGuide">
        <div class="guide-dialog__icon">
          <IconifyIconOnline icon="ri:questionnaire-line" />
        </div>
        <div class="guide-dialog__header-info">
          <span class="guide-dialog__title">{{ currentFieldGuide.fieldLabel }}</span>
          <span class="guide-dialog__subtitle">{{ currentFieldGuide.headline }}</span>
        </div>
      </div>
    </template>

    <div v-if="currentFieldGuide" class="guide-dialog__body">
      <section class="guide-hero">
        <div class="guide-hero__badge">填写建议</div>
        <p class="guide-hero__description">{{ currentFieldGuide.description }}</p>
      </section>

      <section class="guide-section">
        <div class="guide-section__title">配置要点</div>
        <ul class="guide-list">
          <li v-for="item in currentFieldGuide.bullets" :key="item">{{ item }}</li>
        </ul>
      </section>

      <section v-if="currentFieldGuide.example" class="guide-section">
        <div class="guide-section__title">示例值</div>
        <pre class="guide-example">{{ currentFieldGuide.example }}</pre>
      </section>

      <section
        v-if="currentFieldGuide.media && currentFieldGuide.media.length"
        class="guide-section"
      >
        <div class="guide-section__title">真实界面参考</div>
        <div class="guide-media-grid">
          <article
            v-for="item in currentFieldGuide.media"
            :key="item.src"
            class="guide-media-card"
          >
            <el-image
              :src="item.src"
              :preview-src-list="currentFieldGuide.media.map((media) => media.src)"
              fit="cover"
              class="guide-media-card__image"
            />
            <div class="guide-media-card__body">
              <div class="guide-media-card__title">{{ item.title }}</div>
              <p class="guide-media-card__caption">{{ item.caption }}</p>
            </div>
          </article>
        </div>
      </section>

      <section
        v-if="currentFieldGuide.links && currentFieldGuide.links.length"
        class="guide-section"
      >
        <div class="guide-section__title">相关资料</div>
        <div class="guide-link-list">
          <el-button
            v-for="link in currentFieldGuide.links"
            :key="link.url"
            text
            type="primary"
            @click="openGuideLink(link.url)"
          >
            {{ link.label }}
          </el-button>
        </div>
      </section>
    </div>
  </el-dialog>
</template>
<script>
import { fetchJobSave, fetchJobUpdate } from "@pages/job";
import FieldGuideLabel from "@/components/FieldGuideLabel.vue";
import { getJobFieldGuide } from "@/support/jobFieldGuides";
import scCron from "@repo/components/ScCron/index.vue";
import { useUserStore } from "@repo/core";
export default {
  name: "Save",
  components: {
    FieldGuideLabel,
    scCron,
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
  data() {
    return {
      loading: false,
      triggerShow: !1,
      executorData: [],
      activeTab: "basic",
      fieldGuideDialogVisible: false,
      currentFieldGuide: null,
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
  methods: {
    async submit() {
      this.loading = !0;
      var res = undefined;
      const appItem = this.executorData.filter(
        (it) => it.monitorId == this.form.monitorId
      );
      if (appItem && appItem.length > 0) {
        this.form.jobApplicationName = appItem[0].monitorApplicationName;
      }
      if (this.mode == "add" || this.mode == "copy") {
        res = await fetchJobSave(this.form).finally(() => (this.loading = !1));
      } else {
        res = await fetchJobUpdate(this.form).finally(
          () => (this.loading = !1)
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
    openFieldGuide(fieldKey) {
      this.currentFieldGuide = getJobFieldGuide({
        fieldKey,
        form: this.form,
        executorData: this.executorData,
      });
      this.fieldGuideDialogVisible = !!this.currentFieldGuide;
    },
    openGuideLink(url) {
      if (!url) {
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
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

.task-guide-banner {
  margin-bottom: 16px;
}

.guide-dialog__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.guide-dialog__icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: #fff;
  font-size: 20px;
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.22);
}

.guide-dialog__header-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.guide-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.guide-dialog__subtitle {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.guide-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-hero {
  border-radius: 16px;
  padding: 18px 20px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(59, 130, 246, 0.04)),
    #f8fbff;
  border: 1px solid rgba(37, 99, 235, 0.14);
}

.guide-hero__badge {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.guide-hero__description {
  margin: 12px 0 0;
  line-height: 1.7;
  color: var(--el-text-color-regular);
}

.guide-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.guide-section__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.guide-list {
  margin: 0;
  padding-left: 18px;
  line-height: 1.8;
  color: var(--el-text-color-regular);
}

.guide-example {
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: #0f172a;
  color: #e2e8f0;
  font-size: 13px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.guide-media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
}

.guide-media-card {
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  background: #fff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.guide-media-card__image {
  width: 100%;
  height: 190px;
  display: block;
  background: #eef4ff;
}

.guide-media-card__body {
  padding: 14px 14px 16px;
}

.guide-media-card__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.guide-media-card__caption {
  margin: 8px 0 0;
  font-size: 13px;
  line-height: 1.7;
  color: var(--el-text-color-secondary);
}

.guide-link-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
