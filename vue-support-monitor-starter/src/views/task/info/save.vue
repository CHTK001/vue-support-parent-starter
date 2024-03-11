<template>
      <el-dialog draggable v-if="visible" v-model.sync="visible" top="10px" :width="1000" :destroy-on-close="true" @closed="doClose" :close-on-click-modal="false">
        <el-form :model="row" :rules="rules" :disabled="model == 'show'" ref="dialogForm" label-width="120px" >
            <el-form-item v-show="false" label="索引" prop="jobId">
                <el-input v-model="row.jobId" clearable></el-input>
            </el-form-item>
            <p>基础配置</p>
            <el-divider />
            <el-row>
                <el-col :span="12">
                    <el-form-item label="环境" prop="jobProfile">
                        <el-select allow-create filterable v-model="row.jobProfile" style="width: 100%;">
                            <el-option v-for="it in profiles" :label="it.label" :value="it.value"></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item  label="应用名称" prop="jobApp">
                        <el-select allow-create filterable v-model="row.jobApp" style="width: 100%;">
                            <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="任务名称" prop="jobExecuteBean">
                        <el-input  v-model="row.jobExecuteBean" clearable placeholder="请输入方法Bean名称"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="负责人" prop="createByName">
                        <el-input maxlength="50" placeholder="请输入负责人" v-model="row.createName" />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="24">
                    <el-form-item label="描述" prop="jobDesc">
                        <el-input type="textarea" v-model="row.jobDesc" clearable placeholder="请输入描述"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>


            <p>调度配置</p>
            <el-divider />
            <el-row>
                <el-col :span="12">
                    <el-form-item label="调度类型" prop="jobType" >
                        <el-radio-group v-model="row.jobType">
                            <el-radio-button label="NONE" >无</el-radio-button>
                            <el-radio-button label="CRON" >Cron</el-radio-button>
                            <el-radio-button label="FIXED"  >固定速率</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="Cron" v-if="row.jobType == 'CRON'" prop="jobConf">
                        <sc-cron v-model="row.jobConf" maxlength="128" placeholder="请输入Cron定时规则" clearable :shortcuts="shortcuts"></sc-cron>
                    </el-form-item>
                    <el-form-item label="固定速度" v-if="row.jobType == 'FIXED'" prop="jobConf">
                        <el-input maxlength="10" onkeyup="this.value=this.value.replace(/\D/g,'')"
                            onafterpaste="this.value=this.value.replace(/\D/g,'')" v-model="row.jobConf"
                            placeholder="请输入 （ Second ）" clearable></el-input>
                    </el-form-item>
                </el-col>

            </el-row>

            <p>任务配置</p>
            <el-divider />
            <el-row>
                <el-col :span="12">
                    <el-form-item label="任务类型" prop="jobGlueType">
                        <el-select  v-model="row.jobGlueType" clearable placeholder="请选择任务类型">
                            <el-option value="BEAN" label="Bean"></el-option>
                            <el-option value="GLUE_GROOVY" label="GLUE(Java)" />
                            <el-option value="GLUE_SHELL" label="GLUE(Shell)" />
                            <el-option value="GLUE_PYTHON" label="GLUE(Python)" />
                            <el-option value="GLUE_PHP" label="GLUE(Php)" />
                            <el-option value="GLUE_NODEJS" label="GLUE(NodeJs)" />
                            <el-option value="GLUE_POWERSHELL" label="GLUE(Powershell)" />
                        </el-select>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="24">
                    <el-form-item label="执行参数" prop="jobExecuteParam">
                        <el-input type="textarea" v-model="row.jobExecuteParam" clearable placeholder="请输入执行参数"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            <p>高级配置</p>
            <el-divider></el-divider>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="配置类型" prop="jobExecuteRouter">
                        <el-select  v-model="row.jobExecuteRouter" clearable placeholder="选择执行策略">
                            <el-option label="全部执行" value="ALL"></el-option>
                            <el-option label="第一个" value="FIRST"></el-option>
                            <el-option label="最后一个" value="LAST"></el-option>
                            <el-option label="随机" value="RANDOM"></el-option>
                            <el-option label="HASH" value="HASH"></el-option>
                            <el-option label="LRU" value="LRU"></el-option>
                            <el-option label="LFU" value="LFU"></el-option>
                        </el-select>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="调度过期策略" prop="jobExecuteMisfireStrategy">
                        <el-radio-group v-model="row.jobExecuteMisfireStrategy">
                            <el-radio-button label="DO_NOTHING" >忽略</el-radio-button>
                            <el-radio-button label="FIRE_ONCE_NOW" >立即执行一次</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                </el-col>
            </el-row>

            <el-row>
                <el-col :span="12">
                    <el-form-item label="任务超时时间" prop="jobExecuteTimeout">
                        <el-input maxlength="6" v-model="row.jobExecuteTimeout" placeholder="任务超时时间，单位秒，大于零时生效" clearable onkeyup="this.value=this.value.replace(/\D/g,'')" onafterpaste="this.value=this.value.replace(/\D/g,'')"></el-input>
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="失败重试次数" prop="jobFailRetry">
                        <el-input maxlength="4" v-model="row.jobFailRetry" placeholder="失败重试次数，大于零时生效" clearable onkeyup="this.value=this.value.replace(/\D/g,'')" onafterpaste="this.value=this.value.replace(/\D/g,'')"></el-input>
                    </el-form-item>
                </el-col>
            </el-row>

            
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="model != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(row)">保 存</el-button>
        </template>
    </el-dialog>

    <TriggerLayout v-if="triggerShow" ref="triggerRef" :data="row"></TriggerLayout>
</template>
<script>
import scCron from '@/components/scCron/index.vue'
import TriggerLayout from './trigger.vue'

export default {
    components: {
        scCron, TriggerLayout
    },
    data(){
        return {
            row: {
                jobExecuteTimeout: 10,
                jobExecuteRouter: 'FIRST',
                jobGlueType: 'BEAN'
            },
            visible: 0,
            rules: {
                jobApp: [{ trigger: 'blur', message: '任务执行器不能为空', required: !0 }],
                jobProfile: [{ trigger: 'blur', message: '任务环境不能为空', required: !0 }],
                jobGlueType: [{ trigger: 'blur', message: '运行模式不能为空', required: !0 }],
                jobType: [{ trigger: 'blur', message: '任务类型不能为空', required: !0 }],
                jobConf: [{ trigger: 'blur', message: '任务时间不能为空不能为空', required: !0 }],
                jobExecuteBean: [{ trigger: 'blur', message: '任务名称不能为空', required: !0 }],
                createName: [{ trigger: 'blur', message: '负责人不能为空', required: !0 }]
            },
            model: '',
            isSaveing: false,
            triggerShow: false,
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
            list: {
                apiObj: this.$API.monitor.job.page,
                apiObjUpdate: this.$API.monitor.job.update,
                apiObjSave: this.$API.monitor.job.save,
                apiObjUpload: this.$API.monitor.job.upload,
                apiObjDelete: this.$API.monitor.job.delete,
            },
            apps: [],
            profiles: []
        }
    },
    methods: {
        onOpen(){
        },
        open(model = 'add') {
            this.model = model;
            this.visible = true;
            this.isSaveing = false;
            return this;
        },
        doClose(){
            this.visible = false;
        },
        setData(row, apps, profiles) {
            this.row = row;;
            Object.assign(this.row, {
                jobExecuteTimeout: 10,
                jobExecuteRouter: 'FIRST',
                jobGlueType: 'BEAN'
            });
            this.apps = apps;
            this.profiles = profiles;
        },
        submitFormInfo(row){
            this.isSaveing = true;
            if(!row.jobId) {
                this.list.apiObjSave.post(row || this.row).then(res => {
                    if (res.code === '00000') {
                        this.$emit('success');
                        this.visible = !1;
                        return 0;
                    }
                    this.$message.error(res.msg);
                }).finally(() => {
                    this.isSaveing = false;
                })
                return false;
            }
            this.list.apiObjUpdate.put(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.$emit('success');
                    this.visible = !1;
                    return 0;
                }
                this.$message.error(res.msg);
            }).finally(() => {
                    this.isSaveing = false;
                })
        },
        submitFormUpdate(row) {
            if( !this.$refs.dialogForm) {
                return !1;
            }
            this.$refs.dialogForm.validate(valid => {
                if(valid) {
                    this.submitFormInfo(row);
                }
            })
        },
    }
}

</script>

<style scoped lang="less">
:deep('.el-divider--horizontal') {
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
    border-top: 1px solid #EBEEF5;
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
    color: #409EFF;
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
    margin-top: -45px
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
}</style>
