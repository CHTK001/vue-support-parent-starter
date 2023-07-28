<template>
    <el-button type="primary" :size="size" icon="sc-icon-export" @click="exportDialog"></el-button>

    <el-dialog draggable v-model="show" :title="des" width="30%">
        <template #header="{ close, titleId, titleClass }">
            {{ des }}(总量: {{ total }})
        </template>
        <el-form ref="exportForm" :model="form" :rules="rules">
            <el-form-item label="类型" prop="type">
                <el-radio-group v-model="form.type">
                    <el-radio label="excel" size="small" border>Excel</el-radio>
                    <el-radio label="dbf" size="small" border>DBF</el-radio>
                    <el-radio label="tsv" size="small" border>TSV</el-radio>
                    <el-radio label="csv" size="small" border>CSV</el-radio>
                    <el-radio label="xml" size="small" border>XML</el-radio>
                    <el-radio label="html" size="small" border>HTML</el-radio>
                </el-radio-group>
            </el-form-item>

            <el-tooltip class="box-item" effect="dark" content=" (秒)" placement="right">
                <el-form-item label="文件过期时间" prop="taskExpire">
                    <el-input v-model="form.taskExpire" type="number" clearable placeholder="请输入配置名称" />
                </el-form-item>
            </el-tooltip>

        </el-form>
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="show = false">取消</el-button>
                <el-button type="primary" @click="doExport"> 导出 </el-button>
            </span>
        </template>
    </el-dialog>
    <el-dialog draggable v-model="show1" :title="des" width="30%">
        <template #header="{ close, titleId, titleClass }">
            {{ des }}(总量: {{ total }})
        </template>
        <el-progress :percentage="percentage" :duration="15" :stroke-width="15" :striped="percentage < 100" :striped-flow="percentage < 100" />
        <template #footer>
            <span class="dialog-footer">
                <el-button @click="show1 = false">取消</el-button>
                <el-button type="primary" v-if="showDownload" @click="doExportFile"> 下载 </el-button>
            </span>
        </template>
    </el-dialog>
</template>
<script>
import sysConfig from "@/config"

export default {
    name: 'ExportTask',
    props: {
        size: { type: String, default: 'default' },
        export: { type: Function, default: () => { } },
        apiObj: { type: Object, default: '' },
        des: { type: String, default: '导出' },
        taskType: { type: String, default: 'DYNAMIC-EXPORT' },
        total: { type: Number, default: 0 },
        param: { type: Object, default: {} },
        header: {type: Object, default: {} }
    },
    mounted() {
    },
    data() {
        return {
            show: false,
            show1: false,
            showDownload: false,
            percentage: 0,
            form: {
                type: 'excel'
            },
            rules: {
                type: [{ required: true, message: '导出类型不能为空' }]
            },
            url: undefined,
        }
    },
    mounted(){
       
    },
    methods: {
        exportDialog() {
            this.show = true;
            this.show1 = false;
        },
        doExportFile(){
            window.open(this.url, '_blank')
        },
        subscribe: function (taskTid) {
			const _this = this;
			const eventSource = new EventSource(this.$API.system.tasks.subscribe.url + "/" + taskTid);
			eventSource.addEventListener(taskTid, (event) =>{
				const data = JSON.parse(event.data);
				if (data.type === 'PROCESS') {
                    _this.percentage = ~~data.message / _this.total * 100;
				} else if (data.type === 'FINISH') {
                    _this.percentage =  100;
                    eventSource.close();
				} else if (data.type === 'NOTIFY') {
					_this.$notify.success({ title: '提示', message: data.message })
				} else if (data.type === 'NOTIFY_HTML') {
                    this.showDownload = true;
					// _this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: data.message })
                    this.url = _this.$API.common.ossPrefix.url + data.message + "?mode=DOWNLOAD"
				}
			});
			eventSource.onerror = function (event) {
				// 处理过错
			};
			eventSource.onopen = function (event) {
                _this.show1 = true;
                _this.show = false;
				_this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
			};
		},
        doExport() {
            this.$refs.exportForm.validate(async (v) => {
                if (v) {
                    this.form.url = this.apiObj.url;
                    Object.assign(this.form, this.param);
                    const userInfo = this.$TOOL.data.get(sysConfig.USER_INFO);
                    this.form.username = userInfo.userName;
                    this.form.userId = userInfo.userId;
                    this.form.header = this.header;
                    this.form.roles = userInfo.roles;
                    this.form.userMobile = userInfo.userMobile;
                    const p = {
                        taskName: this.des,
                        taskType: this.taskType,
                        taskCid: this.taskType,
                        taskTotal: this.total,
                        taskParams: JSON.stringify(this.form)
                    };
                    this.$API.system.tasks.save.post(p).then(res => {
                        if(res.code === '00000') {
                            this.subscribe(res.data.taskTid);
                            this.$notify.success({
                                title: '提示',
                                message: '创建任务成功'
                            })
                            return !1;
                        }
                        this.$notify.success({
                            title: '提示',
                            message: res.msg
                        })
                    })
                }
            })
        }
    }
}
</script>
