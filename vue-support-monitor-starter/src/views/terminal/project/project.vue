<template>
    <el-drawer v-model="visible" size="88%" :title="title" :close-on-click-modal="false" :destroy-on-close="true">
        <el-card shadow="never" header="项目管理">
            <el-main class="nopadding">
                <el-skeleton :loading="loading" animated>
                    <el-container>
                        <el-main>
                            <el-row :gutter="15">
                                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in data" :key="item.id"  @drop="handleFileDrop(item)" @dragover.prevent @dragenter.prevent
                                    class="demo-progress">
                                    <el-card class="task task-item " shadow="always">
                                        <el-row class="relation">
                                            <el-col :span="12">
                                                <ul>
                                                    <li>
                                                        <h4 class="inner">
                                                            {{ item.terminalProjectName }}
                                                            <el-button icon="sc-icon-log" size="small" circle  style="margin-left: 10px;" @click="doLog(item)">
                                                            </el-button>
                                                        </h4>
                                                        <p class="inner">{{ item.terminalProjectPath }}</p>
                                                    </li>
                                                    <li>
                                                        <h4>应用说明</h4>
                                                        <p class="inner">{{ item.terminalProjectDesc || '-' }}</p>
                                                    </li>
                                                </ul>
                                            </el-col>

                                            <el-col :span="12" class="cursor-pointer">
                                                <ul>
                                                    <li>
                                                        <h4>启动脚本</h4>
                                                        <span class="inner">
                                                            {{ item.terminalProjectStartScript }} 
                                                        </span>
                                                        <el-button :loading="buttonStatus"  icon="sc-icon-start" size="small" circle v-if="item.terminalProjectStartScript" style="margin-left: 10px;" @click="doStart(item)">
                                                        </el-button>
                                                    </li>
                                                    <li>
                                                        <h4>停止脚本</h4>
                                                        <span class="inner">{{ item.terminalProjectEndScript }}</span>
                                                        <el-button :loading="buttonStatus"  icon="sc-icon-stop" size="small" circle v-if="item.terminalProjectEndScript" style="margin-left: 10px" @click="doStop(item)">
                                                        </el-button>
                                                    </li>
                                                </ul>
                                            </el-col>
                                        </el-row>

                                        <div class="bottom">
                                            <div class="state">
                                                <el-button circle size="small" icon="el-icon-edit" style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(item)"></el-button>
                                                <el-button circle size="small" icon="el-icon-upload" style="font-size: 16px" class="cursor-pointer" title="上传" @click="doUpload(item)"></el-button>
                                                <!-- <el-button circle size="small" icon="sc-icon-log" style="font-size: 16px" class="cursor-pointer" title="日志" @click="doLog(item)"></el-button> -->
                                            </div>
                                        </div>
                                    </el-card>
                                </el-col>
                                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                                    <el-card class="task task-add" shadow="never" @click="doSave">
                                        <el-icon><el-icon-plus /></el-icon>
                                        <p>添加应用</p>
                                    </el-card>
                                </el-col>
                            </el-row>

                        </el-main>
                        <el-footer style="height: 51px; line-height: 50px; padding:0">
                            <scPagintion :pageSize="form.pageSize" :total="total" @dataChange="afterPropertiesSet">
                            </scPagintion>
                        </el-footer>
                    </el-container>
                </el-skeleton>
            </el-main>
        </el-card>
    </el-drawer>
    <save-dialog v-if="saveDialogStatus" ref="saveDialogStatusRef" @success="afterProperties"></save-dialog>
    <log-dialog v-if="logDialogStatus" ref="logDialogStatusRef" ></log-dialog>
    <upload-dialog v-if="uploadDialogStatus" ref="uploadDialogStatusRef" ></upload-dialog>
    <upload2-dialog v-if="upload2DialogStatus" ref="upload2DialogStatusRef" ></upload2-dialog>
</template>
<script>
import SaveDialog from './save.vue'
import LogDialog from './log.vue'
import UploadDialog from './upload.vue'
import Upload2Dialog from './upload2.vue'
export default {
    components: {
        SaveDialog,
        LogDialog,
        UploadDialog,
        Upload2Dialog
    },
    data() {
        return {
            buttonStatus: false,
            saveDialogStatus: false,
            uploadDialogStatus: false,
            upload2DialogStatus: false,
            logDialogStatus: false,
            visible: false,
            title: '',
            form: {},
            loading: true,
            data: []
        }
    },
    unmounted: function () {
        this.visible = false;
    },
    methods: {
        handleFileDrop(item){
            event.preventDefault();
            const files = event.dataTransfer.files;
            this.upload2DialogStatus = true;
            this.$nextTick(() => {
                this.$refs.upload2DialogStatusRef.open('edit').setData(item, files);
            })
        },
        open() {
            this.visible = true
            return this;
        },
        setData(item) {
            this.title = item.terminalHost + ' - ' + item.terminalName;
            Object.assign(this.form, item);
            this.afterProperties();
        },
        doLog(item){
            this.logDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.logDialogStatusRef.open('add').setData(item);
            })
        },
        doStart(item){
            this.buttonStatus = true;
            this.$API.project.start.get({id: item.terminalProjectId}).then(res => {
                if(res.code == '00000') {
                    this.$message.success('启动成功');
                } else {
                    this.$message.error(res.msg);
                }
            }).finally(() => this.buttonStatus = false)
        },
        doStop(item) {
            this.buttonStatus = true;
            this.$API.project.stop.get({id: item.terminalProjectId}).then(res => {
                if(res.code == '00000') {
                    this.$message.success('停止成功');
                } else {
                    this.$message.error(res.msg);
                }
            }).finally(() => this.buttonStatus = false)
        },
        doSave(){
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialogStatusRef.open('add').setData({});
            })
        },
        doEdit(item){
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialogStatusRef.open('edit').setData(item);
            })
        },
        doUpload(item){
            this.uploadDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.uploadDialogStatusRef.open('edit').setData(item);
            })
        },
        afterProperties() {
            this.loading = true;
            this.$API.project.page.get(this.form).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.data = res.data.data;
                this.total = res.data.total;
            }).finally(() => this.loading = false)
        }

    }

}

</script>


<style scoped>
:deep(.el-progress-circle path) {
    fill: #fff
}

.task {
    height: 180px;
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
}

.inner {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}</style>
