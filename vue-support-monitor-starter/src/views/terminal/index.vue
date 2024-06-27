<template>
    <el-card shadow="never" header="终端管理">
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
                                            <span style="margin-left: 0px" v-if="!!item.terminalStatus && cost[item.terminalId]">耗时: {{cost[item.terminalId]}} ms</span>
                                            <div>
                                                <el-icon
                                                    :style="{ 'font-size': '80px', 'color': item.terminalStatus == 1 ? '#5ca8ea' : '#999', 'margin-top': '4px' }">
                                                    <component is="sc-icon-terminal" />
                                                </el-icon>
                                            </div>
                                        </el-col>
                                        <el-col :span="8">
                                            <ul>
                                                <li>
                                                    <h4>终端名称</h4>
                                                    <p class="inner" :title=" item.terminalName +' ('+ item.terminalPort+')'">{{ item.terminalName }} <b>({{item.terminalPort}})</b></p>
                                                </li>
                                                <li>
                                                    <h4>终端说明</h4>
                                                    <p>
                                                        <el-tag effect="light" v-if="item.terminalDesc">{{ item.terminalDesc
                                                        }}</el-tag>
                                                        <span v-else>暂无描述</span>
                                                    </p>
                                                </li>
                                            </ul>
                                        </el-col>
                                        <el-col :span="8">
                                            <ul>
                                                <li>
                                                    <h4>终端账号</h4>
                                                    <p><el-tag>{{ item.terminalUser }} </el-tag></p>
                                                </li>
                                            </ul>
                                        </el-col>
                                    </el-row>
                                    <div class="bottom" >
                                        <div class="state" v-role="'admin'">
                                            
                                            <el-popconfirm title="确定删除吗？" @confirm="doDelete(item)">
                                                <template #reference>
                                                    <el-button :loading="startDialogStatus[item.terminalId]" circle size="small"
                                                    v-if="!item.terminalStatus" icon="el-icon-delete" type="danger"
                                                    style="font-size: 16px" class="cursor-pointer" title="删除"></el-button>
                                                </template>
                                            </el-popconfirm>
                                            <el-button circle size="small" v-if=" !!item.terminalStatus"  style="margin-left: 10px;" icon="sc-icon-terminal" class="cursor-pointer" title="终端" @click="doTerminal(item)"></el-button>
                                            <el-button circle size="small" v-if=" !!item.terminalStatus"  style="margin-left: 10px;" icon="sc-icon-signpost" class="cursor-pointer" title="指标" @click="doIndicator(item)"></el-button>
                                            <el-button circle size="small" v-if=" !!item.terminalStatus"  style="margin-left: 10px;" icon="sc-icon-system" class="cursor-pointer" title="信息" @click="doSystem(item)"></el-button>
                                            <el-button circle size="small" v-if=" !!item.terminalStatus"  style="margin-left: 10px;" icon="sc-icon-project" class="cursor-pointer" title="项目" @click="doProject(item)"></el-button>
                                            <el-button :loading="startDialogStatus[item.terminalId]" circle size="small" v-if=" !item.terminalStatus" icon="el-icon-edit" class="cursor-pointer" title="编辑" @click="doEdit(item)"></el-button>
                                            <el-button :loading="startDialogStatus[item.terminalId]" v-if="!item.terminalStatus" circle size="small" icon="sc-icon-start" style="font-size: 16px" class="cursor-pointer" title="启动" @click="doStart(item)"></el-button>
                                            <el-button :loading="startDialogStatus[item.terminalId]" v-else circle size="small" class="cursor-pointer" title="暂停" @click="doStop(item)"> <breeding-rhombus-spinner :animation-duration="4000" :size="10" color="#0284c7" /> </el-button>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                                <el-card class="task task-add" shadow="never" @click="doSave">
                                    <el-icon><el-icon-plus /></el-icon>
                                    <p>添加终端</p>
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
    <terminal-dialog ref="terminalDialog" v-if="terminalDialogStatus" />
    <indicator-dialog ref="indicatorDialog" v-if="indicatorDialogStatus" />
    <system-dialog ref="systemDialog" v-if="systemDialogStatus" />
    <project-dialog ref="projectDialog" v-if="projectDialogStatus" />
</template>

<script>
import SaveDialog from './save.vue'
import ProjectDialog from './project/project.vue'
import SystemDialog from './system.vue'
import IndicatorDialog from './indicator.vue'
import TerminalDialog from './terminal.vue'
import { AtomSpinner, FulfillingBouncingCircleSpinner, FulfillingSquareSpinner, BreedingRhombusSpinner } from 'epic-spinners'

export default {
    components: {
        TerminalDialog,
        ProjectDialog,
        IndicatorDialog,
        SystemDialog,
        SaveDialog, AtomSpinner, FulfillingBouncingCircleSpinner, FulfillingSquareSpinner, BreedingRhombusSpinner
    },
    data() {
        return {
            socket: null,
            data: [],
            total: 0,
            loading: false,
            saveDialogStatus: false,
            terminalDialogStatus: false,
            settingDialogStatus: false,
            indicatorDialogStatus: false,
            systemDialogStatus: false,
            projectDialogStatus: false,
            infoDialogStatus: false,
            deleteStatus: false,
            cost: {},
            startDialogStatus: {},
            apiObj: this.$API.terminal.page,
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
        doTerminal(item) {
            this.terminalDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.terminalDialog.open().setData(item);
            });
        },
        doIndicator(item) {
            this.indicatorDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.indicatorDialog.open().setData(item);
            });
        },
        doProject(item) {
            this.projectDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.projectDialog.open().setData(item);
            });
        },
        doSystem(item) {
            this.systemDialogStatus = true;
            this.$nextTick(() => {
                this.$refs.systemDialog.open().setData(item);
            });
        },
        doStart(item) {
            const startTime = new Date().getTime();
            this.startDialogStatus[item.terminalId] = true;
            this.$API.terminal.start.get({ id: item.terminalId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.cost[item.terminalId] = new Date().getTime() - startTime;
                this.afterPropertiesSet();
            }).finally(() => this.startDialogStatus[item.terminalId] = false)
        },
        doStop(item) {
            this.startDialogStatus[item.terminalId] = true;
            this.$API.terminal.stop.get({ id: item.terminalId }).then(res => {
                if (res.code != '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                this.afterPropertiesSet();
            }).finally(() => this.startDialogStatus[item.terminalId] = false)
        },
        doDelete(item) {
            this.deleteStatus = true;
            this.$API.terminal.delete.delete({ id: item.terminalId }).then(res => {
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
.inner {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.demo-progress .el-progress--circle {
    margin-right: 15px;
}</style>
