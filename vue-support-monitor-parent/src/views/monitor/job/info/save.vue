<template>
  <el-dialog v-model="triggerShow" draggable top="10px" :title="title">
    <el-form :model="form" :rules="rules" label-width="120px">
      <p>基础配置</p>
      <el-divider />
      <el-row>
        <el-col :span="12">
          <el-form-item label="任务描述" prop="jobDesc">
            <el-input v-model="form.jobDesc" placeholder="请输入任务描述" maxlength="50" />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="负责人" prop="author">
            <el-input v-model="form.author" maxlength="50" placeholder="请输入负责人" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="12">
          <el-form-item label="执行器" prop="jobGroup">
            <el-select v-model="form.jobGroup" clearable filterable style="width: 100%">
              <el-option v-for="item in executorData" :key="item.id" :value="item.id" :label="item.appname">
                <span style="float: left">{{ item.appname }}</span>
                <span style="float: right; color: var(--el-text-color-secondary); font-size: 13px">{{ item.title }}</span>
              </el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="报警邮件">
            <el-input v-model="form.alarmEmail" maxlength="100" placeholder="请输入报警邮件，多个邮件地址则逗号分隔" />
          </el-form-item>
        </el-col>
      </el-row>

      <p>调度配置</p>
      <el-divider />
      <el-row>
        <el-col :span="12">
          <el-form-item label="调度类型" prop="scheduleType">
            <el-radio-group v-model="form.scheduleType">
              <el-radio-button label="NONE">无</el-radio-button>
              <el-radio-button label="CRON">Cron</el-radio-button>
              <el-radio-button label="FIX_RATE">固定速率</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item v-if="form.scheduleType == 'CRON'" label="Cron" prop="scheduleConf">
            <sc-cron v-model="form.scheduleConf" maxlength="128" placeholder="请输入Cron定时规则" clearable :shortcuts="shortcuts" />
          </el-form-item>
          <el-form-item v-if="form.scheduleType == 'FIX_RATE'" label="固定速度" prop="scheduleConf">
            <el-input
              v-model="form.scheduleConf"
              maxlength="10"
              onkeyup="this.value=this.value.replace(/\D/g,'')"
              onafterpaste="this.value=this.value.replace(/\D/g,'')"
              placeholder="请输入 （ Second ）"
              clearable
            />
          </el-form-item>
        </el-col>
      </el-row>
      <p>任务配置</p>
      <el-divider />
      <el-row>
        <el-col :span="12">
          <el-form-item label="运行模式" prop="glueType">
            <el-select v-model="form.glueType" clearable filterable style="width: 100%">
              <el-option value="BEAN" label="BEAN" />
              <el-option value="GLUE_GROOVY" label="GLUE(Java)" />
              <el-option value="GLUE_SHELL" label="GLUE(Shell)" />
              <el-option value="GLUE_PYTHON" label="GLUE(Python)" />
              <el-option value="GLUE_PHP" label="GLUE(Php)" />
              <el-option value="GLUE_NODEJS" label="GLUE(NodeJs)" />
              <el-option value="GLUE_POWERSHELL" label="GLUE(Powershell)" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="执行名称" prop="executorHandler">
            <el-input v-model="form.executorHandler" maxlength="100" placeholder="请输入后端配置执行名称" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="24">
          <el-form-item label="任务参数" prop="executorParam">
            <el-input v-model="form.executorParam" type="textarea" maxlength="512" placeholder="请输入任务参数" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <p>高级配置</p>
      <el-divider />
      <el-row>
        <el-col :span="12">
          <el-form-item label="路由策略" prop="executorRouteStrategy">
            <el-select v-model="form.executorRouteStrategy" clearable filterable style="width: 100%">
              <el-option value="FIRST" label="第一个" />
              <el-option value="LAST" label="最后一个" />
              <el-option value="ROUND" label="轮询" />
              <el-option value="RANDOM" label="随机" />
              <el-option value="CONSISTENT_HASH" label="一致性HASH" />
              <el-option value="LEAST_FREQUENTLY_USED" label="最不经常使用" />
              <el-option value="LEAST_RECENTLY_USED" label="最近最久未使用" />
              <el-option value="FAILOVER" label="故障转移" />
              <el-option value="BUSYOVER" label="忙碌转移" />
              <el-option value="SHARDING_BROADCAST" label="分片广播" />
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="子任务ID" prop="childJobId">
            <el-input v-model="form.childJobId" maxlength="100" placeholder="请输入子任务的任务ID,如存在多个则逗号分隔" clearable />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="调度过期策略" prop="misfireStrategy">
            <el-radio-group v-model="form.misfireStrategy">
              <el-radio-button label="DO_NOTHING">忽略</el-radio-button>
              <el-radio-button label="FIRE_ONCE_NOW">立即执行一次</el-radio-button>
            </el-radio-group>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="阻塞处理策略" prop="executorBlockStrategy">
            <el-select v-model="form.executorBlockStrategy" clearable filterable style="width: 100%">
              <el-option value="SERIAL_EXECUTION" label="单机串行" />
              <el-option value="DISCARD_LATER" label="丢弃后续调度" />
              <el-option value="COVER_EARLY" label="覆盖之前调度" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12">
          <el-form-item label="任务超时时间" prop="executorTimeout">
            <el-input
              v-model="form.executorTimeout"
              maxlength="6"
              placeholder="任务超时时间，单位秒，大于零时生效"
              clearable
              onkeyup="this.value=this.value.replace(/\D/g,'')"
              onafterpaste="this.value=this.value.replace(/\D/g,'')"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="失败重试次数" prop="executorFailRetryCount">
            <el-input
              v-model="form.executorFailRetryCount"
              maxlength="4"
              placeholder="失败重试次数，大于零时生效"
              clearable
              onkeyup="this.value=this.value.replace(/\D/g,'')"
              onafterpaste="this.value=this.value.replace(/\D/g,'')"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button :loading="loading" @click="triggerShow = false">取消</el-button>
        <el-button :loading="loading" type="primary" @click="submit">提交</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<script>
import scCron from "@/components/scCron/index.vue";
export default {
  name: "Save",
  components: {
    scCron
  },
  data() {
    return {
      loading: false,
      triggerShow: !1,
      executorData: [],
      shortcuts: [
        {
          text: "每天8点和12点 (自定义追加)",
          value: "0 0 8,12 * * ?"
        },
        {
          text: "每分钟 (自定义追加)",
          value: "0 * * * * ?"
        }
      ],
      mode: "add",
      title: "新增",
      rules: {
        jobGroup: [{ trigger: "blur", message: "任务执行器不能为空", required: !0 }],
        jobDesc: [{ trigger: "blur", message: "任务描述不能为空", required: !0 }],
        glueType: [{ trigger: "blur", message: "运行模式不能为空", required: !0 }],
        scheduleType: [{ trigger: "blur", message: "任务类型不能为空", required: !0 }],
        scheduleConf: [{ trigger: "blur", message: "任务时间不能为空不能为空", required: !0 }],
        executorHandler: [{ trigger: "blur", message: "任务名称不能为空", required: !0 }],
        author: [{ trigger: "blur", message: "负责人不能为空", required: !0 }]
      },
      form: {
        misfireStrategy: "DO_NOTHING",
        scheduleType: "CRON",
        executorBlockStrategy: "SERIAL_EXECUTION",
        scheduleConf: "",
        glueType: "BEAN",
        executorRouteStrategy: "FIRST"
      }
    };
  },
  mounted() {
    this.initial();
  },
  methods: {
    submit() {
      this.loading = !0;
      var api = undefined;
      if (this.mode == "add" || this.mode == "copy") {
        api = this.$API.scheduler.jobinfoAdd;
      } else {
        api = this.$API.scheduler.jobinfoUpdate;
      }
      api
        .get(this.form)
        .then(res => {
          if (res.code === "00000") {
            if (res.data.code == 200) {
              this.$emit("success");
              this.triggerShow = !1;
              return !1;
            }
            this.$message.error(res.data.msg);
            return !1;
          }
          this.$message.error(res.msg);
        })
        .finally(() => (this.loading = !1));
    },
    async initial() {
      const res = await this.jobGroup.get();
      this.executorData = res?.data.data;
      if (this.executorData && this.executorData.length > 0) {
        if (!this.form.jobGroup || this.form.jobGroup < 1) {
          this.form.jobGroup = this.executorData[0].id;
        }
      }
    },
    open(mode = "add", row) {
      this.triggerShow = !0;
      this.mode = mode;
      if (mode === "edit") {
        this.title = `编辑${row.jobDesc}数据`;
      }
      Object.assign(this.form, row);
      if (mode === "copy") {
        delete this.form.id;
      }
    }
  }
};
</script>

<style scoped lang="scss">
:deep(".el-divider--horizontal") {
  margin: 5px 0px !important;
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
