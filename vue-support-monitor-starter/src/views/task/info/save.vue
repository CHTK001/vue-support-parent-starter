<template>
      <el-dialog draggable v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')" :close-on-click-modal="false">
        <el-form :model="row" :rules="rules" :disabled="model == 'show'" ref="dialogForm" label-width="100px" label-position="left">
            <el-form-item v-show="false" label="索引" prop="jobId">
                <el-input v-model="row.jobId" clearable></el-input>
            </el-form-item>
            <el-form-item label="环境" prop="jobApp">
                <el-select allow-create filterable v-model="row.jobApp">
                    <el-option v-for="it in profiles" :label="it.label" :value="it.value"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item  label="应用名称" prop="jobProfile">
                <el-select allow-create filterable v-model="row.jobProfile">
                    <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="任务名称" prop="jobName">
                <el-input  v-model="row.jobName" clearable placeholder="请输入方法名称"></el-input>
            </el-form-item>

            <el-form-item label="任务类型" prop="jobType">
                <el-select  v-model="row.jobType" clearable placeholder="请选择任务类型" >
                    <el-option value="CRON" label="表达式">
						<span>表达式</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">cron表达式</span>
					</el-option>
                    <el-option value="FIEXD" label="固定速率">
						<span>固定速率</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">固定速率</span>
					</el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="固定速率" prop="jobConf" v-if="row.jobType == 'FIEXD'">
                <template #label>
                    <span  style="display: inline-block">
                        <span>固定速率(s)</span>
                        <el-popover  class="cursor-pointer " effect="dark" content="固定时间访问"  v-if="row.jobConf" @afterEnter="onOpen">
                            <template #content>
                                233
                            </template>
                            <template #reference>
                                <el-icon class="cursor-pointer " ><component is="el-icon-info-filled" /></el-icon>
                            </template>
                        </el-popover>
                    </span>
                </template>
                <el-input  v-model="row.jobConf" clearable placeholder="请输入速率"  type="number"></el-input>
            </el-form-item>

            <el-form-item label="CRON" prop="jobConf" v-if="row.jobType == 'CRON'">
                <template #label>
                    <span  style="display: inline-block">
                        <span>定时规则</span>
                        <el-tooltip class="cursor-pointer " effect="dark" content="Cron定时规则" placement="bottom" v-if="row.jobConf">
                            <el-icon class="cursor-pointer " ><component is="el-icon-info-filled" /></el-icon>
                        </el-tooltip>
                    </span>
                </template>
                <sc-cron v-model="row.jobConf" maxlength="128" placeholder="请输入Cron定时规则" clearable :shortcuts="shortcuts"></sc-cron>
            </el-form-item>

            <el-form-item label="配置类型" prop="jobExecuteRoute">
                <el-select  v-model="row.jobExecuteRoute" clearable placeholder="选择执行策略">
                    <el-option label="全部执行" value="ALL"></el-option>
                    <el-option label="第一个" value="FIRST"></el-option>
                    <el-option label="最后一个" value="LAST"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="描述" prop="jobDesc">
                <el-input type="textarea" v-model="row.jobDesc" clearable placeholder="请输入描述"></el-input>
            </el-form-item>
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
            row: {},
            visible: 0,
            rules: {

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
        setData(row, apps, profiles) {
            this.row = row;
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