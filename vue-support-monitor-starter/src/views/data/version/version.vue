<template>
    <el-drawer v-model="visible" size="80%" draggable :title="title"  :close-on-click-modal="false">
        <template #header="{ close, titleId, titleClass }">
            <h4 :id="titleId" :class="titleClass">{{ title }}
                <span style="position: relative; top: 2;">
                    <el-icon class="cursor-pointer" title="刷新"  @click="afterPropertiesSet">
                        <component is="el-icon-refresh" />
                    </el-icon>
                </span>
            </h4>
        </template>
        <el-card shadow="never">
            <el-main class="nopadding">
                <el-skeleton :loading="loading" animated>
                    <el-container>
                        <el-main>
                            <el-row :gutter="15">
                                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in data" :key="item.versionId"
                                    class="demo-progress">
                                    <el-card class="task task-item " shadow="always">
                                        <el-row class="relation">
                                            <el-col :span="12">
                                                <ul>
                                                    <li>
                                                        <h4>脚本名称</h4>
                                                        <p>{{ item.versionName }} </p>
                                                    </li>
                                                    <li>
                                                        <h4>脚本说明</h4>
                                                        <p><el-tag effect="light">{{ item.versionDesc || '无' }}</el-tag></p>
                                                    </li>
                                                </ul>
                                            </el-col>
                                            <el-col :span="12">
                                                <ul>
                                                    <li>
                                                        <h4>启动脚本</h4>
                                                        <p>{{ item.versionRunScript || '-' }} </p>
                                                    </li>
                                                </ul>
                                            </el-col>
                                        </el-row>

                                        <div class="bottom">
                                            <div class="state">
                                                <el-button :loading="versionStatus" plain size="small" circle icon="sc-icon-start" v-if="item.versionStatus == 0" style="font-size: 16px" class="cursor-pointer" title="启动" @click="doStart(item)" />
                                                <el-button :loading="versionStatus" plain size="small" circle icon="sc-icon-end" v-else style="font-size: 16px" class="cursor-pointer" title="停止" @click="doStop(item)" />
                                                <el-button :loading="versionStatus" plain size="small" circle icon="el-icon-refresh" style="font-size: 16px" class="cursor-pointer" title="重启" @click="doRestart(item)" />
                                                <el-button :loading="versionStatus"  plain size="small" circle icon="el-icon-edit" style="font-size: 16px" class="cursor-pointer"  v-if="item.versionStatus == 0" title="编辑" @click="doSave(item)" />
                                                <el-button  plain size="small" circle icon="sc-icon-log"  style="font-size: 16px" class="cursor-pointer" title="日志" @click="doStartLog(item)" />
                                                <el-button type="danger" plain size="small" circle icon="el-icon-delete" style="font-size: 16px" v-if="item.versionStatus == 0" class="cursor-pointer" title="删除" @click="doDelete(item)" />
                                            </div>
                                        </div>
                                    </el-card>
                                </el-col>
                                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                                    <el-card class="task task-add" shadow="never" @click="doSave">
                                        <el-icon><el-icon-plus /></el-icon>
                                        <p>添加脚本</p>
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
    <save-dialog ref="saveDialog" v-if="saveDialogStatus" @success="afterPropertiesSet" />
    <log-dialog ref="logDialog" v-if="logDialogStatus" />

</template>

<script>
import SaveDialog from './versionSave.vue'
import LogDialog from './versionLog.vue'

export default {
    components:{SaveDialog, LogDialog},
    data() {
        return {
            versionStatus: false,
            consoleDialogStatus: false,
            logDialogStatus: false,
            socket: null,
            data: [],
            title: '',
            form: {},
            total: 0,
            loading: false,
            visible: false,
            saveDialogStatus: false,
            infoDialogStatus: false,
            deleteStatus: false,
            isRefresh: false,
            apiObj: this.$API.gen.version.page,
            form: {
            }
        }
    },
    methods: {
        open(){
            this.visible = true;
            return this;
        },
        doStartLog(item){
            this.logDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.logDialog.open(this.form ,item);
            })
        },
        doRestart(item){
            this.versionStatus  = true;
            this.$API.gen.version.stop.handler({versionId: item.versionId}).then(res => {
                if (res.code === '00000') {
                    this.doStart(item);
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.versionStatus  = false)
            
        },
        doStart(item){
            this.versionStatus = true;
            this.$API.gen.version.start.handler({versionId: item.versionId}).then(res => {
                if (res.code === '00000') {
                    item.versionStatus = 1;
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.versionStatus  = false);
        },
        doDelete(item){
            this.versionStatus = true;
            this.$API.gen.version.delete.handler({versionId: item.versionId}).then(res => {
                if (res.code === '00000') {
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.versionStatus  = false);
        },
        doStop(item){
            this.versionStatus  = true;
            this.$API.gen.version.stop.handler({versionId: item.versionId}).then(res => {
                if (res.code === '00000') {
                    item.versionStatus = 0;
                    return;
                }
                this.$message.error(res.msg);
            }).finally(() => this.versionStatus  = false)
        },
        setData(item){
            this.form.projectId = item.projectId
            this.title = item.projectName  + "脚本列表";
            this.afterPropertiesSet();
        },
        afterPropertiesSet(item) {
            if (item) {
                this.form.pageSize = item.pageSize;
                this.form.page = item.page;
            }
            this.loading = true;
            this.apiObj.get(this.form).then(res => {
                if (res.code === '00000') {
                    this.data = res.data.data;
                    this.total = res.data.total;
                }
            }).finally(() => this.loading = false)
        },
        doSave(item) {
            item.projectId = this.form.projectId;
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open( item?.versionId ? 'edit' : 'add').setData( item);
            });
        },
        doEdit(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(item);
            });
        },
        doDelete(item) {
            this.deleteStatus = true;
            this.$API.gen.version.delete.handler({ id: item.versionId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.afterPropertiesSet();
            }).finally(() => this.deleteStatus = false)
        }
    }

}
</script>

<style scoped>
:deep(.el-progress-circle path) {
    fill: #fff
}

.task {
    height: 170px;
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
