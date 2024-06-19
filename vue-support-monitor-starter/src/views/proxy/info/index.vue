<template>
    <el-card shadow="never" header="代理管理">
        <el-main class="nopadding">
            <el-skeleton :loading="loading" animated>
                <el-container>
                    <el-main>
                        <el-row :gutter="15">
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in data" :key="item.id"
                                class="demo-progress">
                                <el-card class="task task-item " shadow="always">
                                    <el-row class="relation" style="min-height: 128px">
                                        <el-col :span="8">
                                            <div>
                                                <el-icon
                                                    :style="{ 'font-size': '80px', 'color': item.proxyStatus == 1 ? '#5ca8ea' : '#999', 'margin-top': '4px' }">
                                                    <component is="sc-icon-server" />
                                                </el-icon>
                                                <el-tag style="margin-left: 13px"
                                                    v-if="item.proxyStatus == 1">{{ item.proxyPort }}</el-tag>
                                            </div>
                                        </el-col>
                                        <el-col :span="8">
                                            <ul>
                                                <li>
                                                    <h4>代理名称</h4>
                                                    <p>{{ item.proxyName }} </p>
                                                </li>
                                                <li>
                                                    <h4>代理说明</h4>
                                                    <p>
                                                        <el-tag effect="light" v-if="item.proxyDesc">{{ item.proxyDesc
                                                        }}</el-tag>
                                                        <span v-else>暂无描述</span>
                                                    </p>
                                                </li>
                                            </ul>
                                        </el-col>

                                    </el-row>
                                    <div class="bottom" >
                                        <div class="state">
                                            <el-button circle size="small" style="margin-left: 10px;" icon="sc-icon-log" class="cursor-pointer" title="日志" @click="doLog(item)"></el-button>
                                            <el-button circle size="small" v-if="item.proxyStatus == 0" icon="el-icon-setting" class="cursor-pointer" title="设置" @click="doSetting(item)"></el-button>
                                            <el-button circle size="small" v-if="item.proxyStatus == 0" icon="el-icon-edit" class="cursor-pointer" title="编辑" @click="doEdit(item)"></el-button>
                                            
                                            <el-popconfirm title="确定删除吗？" @confirm="doDelete(item)">
                                                <template #reference>
                                                    <el-button :loading="startDialogStatus" circle size="small"
                                                    v-if="item.proxyStatus == 0" icon="el-icon-delete" type="danger"
                                                    style="font-size: 16px" class="cursor-pointer" title="删除"></el-button>
                                                </template>
                                            </el-popconfirm>
                                            <el-button :loading="startDialogStatus" v-if="!item.proxyStatus || item.proxyStatus == 0" circle size="small" icon="sc-icon-start" style="font-size: 16px" class="cursor-pointer" title="启动" @click="doStart(item)"></el-button>
                                            <el-button :loading="startDialogStatus" v-else circle size="small" class="cursor-pointer" title="暂停" @click="doStop(item)"> <breeding-rhombus-spinner :animation-duration="4000" :size="10" color="#0284c7" /> </el-button>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                                <el-card class="task task-add" shadow="never" @click="doSave">
                                    <el-icon><el-icon-plus /></el-icon>
                                    <p>添加代理</p>
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
    <save-dialog ref="saveDialog" v-if="saveDialogStatus" @success="afterPropertiesSet" />
    <setting-dialog ref="settingDialog" v-if="settingDialogStatus" />
    <log-dialog ref="logDialog" v-if="logDialogStatus" />
</template>

<script>
import SaveDialog from './save.vue'
import LogDialog from './log.vue'
import SettingDialog from './setting.vue'
import { AtomSpinner, FulfillingBouncingCircleSpinner, FulfillingSquareSpinner, BreedingRhombusSpinner } from 'epic-spinners'

export default {
    components: {
        LogDialog,
        SettingDialog, SaveDialog, AtomSpinner, FulfillingBouncingCircleSpinner, FulfillingSquareSpinner, BreedingRhombusSpinner
    },
    data() {
        return {
            socket: null,
            data: [],
            total: 0,
            loading: false,
            saveDialogStatus: false,
            logDialogStatus: false,
            settingDialogStatus: false,
            infoDialogStatus: false,
            deleteStatus: false,
            startDialogStatus: false,
            apiObj: this.$API.proxy.page,
            form: {
                pageSize: 20,
                page: 1
            }
        }
    },
    mounted() {
        this.afterPropertiesSet()
    },
    methods: {
        doOpenApps(item) {
            this.infoDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.infoDialog.open('view').setData(item);
            });
        },
        afterPropertiesSet(item) {
            this.loading = true;
            if (item) {
                this.form.pageSize = item.pageSize;
                this.form.page = item.page;
            }
            this.apiObj.get(this.form).then(res => {
                if (res.code === '00000') {
                    this.data = res.data.data;
                    this.total = res.data.total;
                }
            }).finally(() => this.loading = false)
        },
        doSave() {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('add').setData({});
            });
        },
        doEdit(item) {
            this.saveDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(item);
            });
        },
        doSetting(item) {
            this.settingDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.settingDialog.open('edit').setData(item);
            });
        },
        doLog(item) {
            this.logDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.logDialog.open().setData(item);
            });
        },
        doStart(item) {
            this.startDialogStatus = true;
            this.$API.proxy.start.get({ id: item.proxyId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.afterPropertiesSet();
            }).finally(() => this.startDialogStatus = false)
        },
        doStop(item) {
            this.startDialogStatus = true;
            this.$API.proxy.stop.get({ id: item.proxyId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.afterPropertiesSet();
            }).finally(() => this.startDialogStatus = false)
        },
        doDelete(item) {
            this.deleteStatus = true;
            this.$API.proxy.delete.delete({ id: item.proxyId }).then(res => {
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
.tool {
    font-size: 16px;
    position: relative;
    top: -2px;
    height: 40px;
}
.tool > .cursor-pointer {
    float: right;
}

:deep(.el-progress-circle path) {
    fill: #fff
}

.task {
    height: 195px;
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
    font-size: 16px;
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
