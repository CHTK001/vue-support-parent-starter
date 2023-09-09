<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="data" :selected-values="selectedValues" :label-width="80"
                    @on-change="change"></sc-select-filter>
                <br />
            </div>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length == 0"
                    @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main>
            <el-row :gutter="15">
                <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in listData" :key="item.appId"
                    class="demo-progress">
                    <el-card class="task task-item" shadow="hover">
                        <h2 style="position: relative;">
                            <sc-status-indicator pulse type="success"></sc-status-indicator>
                            <span>{{ item.appName }} </span>
                            <el-tag>{{ item.appProfile }}</el-tag>
                            <span class="state1" @click="refreshState(item, !0)">
                                <el-icon v-if="item.stateState == 'online'" title="在线">
                                    <component is="sc-icon-online" circle />
                                </el-icon>
                                <el-icon class="animation" v-if="item.stateState == 'loading'" title="加载中">
                                    <component is="sc-icon-loading-v2" circle />
                                </el-icon>
                                <el-icon v-if="item.stateState == 'offline'" title="离线">
                                    <component is="sc-icon-lan-disconnection" circle />
                                </el-icon>
                            </span>
                        </h2>
                        <el-row>
                            <el-col :span="24">
                                <ul>
                                    <li>
                                        <h4>应用端口</h4>
                                        <p><el-tag>{{ item.appHost }}:{{ item.appSpringPort }}</el-tag></p>
                                    </li>
                                    <li>
                                        <h4>应用前缀</h4>
                                        <p>{{ item.appContextPath }} </p>
                                    </li>
                                </ul>
                            </el-col>
                        </el-row>
                        <div class="bottom" v-role="['ADMIN', 'OPS']">
                            <div class="state">
                                <div>
                                    <el-tag size="small" type="success">正在运行 </el-tag>
                                </div>
                            </div>
                            <div class="handler">

                                <el-dropdown trigger="click">
                                    <el-button type="primary" icon="el-icon-more" circle plain></el-button>
                                    <template #dropdown>
                                        <el-dropdown-menu>
                                            <el-dropdown-item @click="openLog(item)">日志</el-dropdown-item>
                                        </el-dropdown-menu>
                                    </template>
                                </el-dropdown>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </el-main>
        <el-footer style="height: 51px; line-height: 50px; padding:0">
            <scPagintion :pageSize="form.pageSize" :total="total" @dataChange="doSearch"></scPagintion>
        </el-footer>
    </el-container>

    <logger v-if="showLoggerDialog" ref="loggerDialog"></logger>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import logger from './logger.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter, logger
    },
    data() {
        return {
            showLoggerDialog: 0,
            listData: [],
            statusFilters: [
                { text: '启用', value: 0 },
                { text: '禁用', value: 1 }
            ],
            form: {
                mapMethod: [],
                pageSize: 20
            },
            visible: 0,
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "appProfile",
                    multiple: !1,
                    options: [
                        {
                            label: "全部",
                            value: ""
                        },
                    ]
                }
            ],
            row: {},
            profiles: [],
            applications: [],
            list: {
                apiObj: this.$API.config.actuator.page,
                apiObjUpdate: this.$API.config.actuator.update,
                apiObjSave: this.$API.config.actuator.save,
                apiObjDelete: this.$API.config.actuator.delete,
                apiCommand: this.$API.config.actuator.command,
            },
            selection: [],
            timer: null, //定时器
        }
    },
    mounted() {
        this.initial();
        this.doSearch();
    },
    // 轮询-
    destroyed() {
        //离开页面是销毁
        clearInterval(this.timer);
        this.timer = null;
    },
    created() {
        this.loopTask();
    },
    methods: {
        loopTask() {
            // 实现轮询
            this.timer = window.setInterval(() => {
                setTimeout(() => {
                    for (const item of this.listData) {
                        this.refreshState(item);
                    }
                }, 0);
            }, 30_000);
        },
        refreshState(item, needLoading) {
            if(needLoading) {
                item.stateState = 'loading';
            }
            this.list.apiCommand.get({ dataId: item.appId, command: 'health', method: 'GET' }).then(res => {
                if (res.code === '00000') {
                    if (res.data.status == 'UP') {
                        item.stateState = 'online';
                    } else {
                        item.stateState = 'offline';
                    }
                    return 0;
                } else {
                    item.stateState = 'offline';
                }
            }).catch(() => { item.stateState = 'offline'; });
        },
        openLog(item) {
            this.showLoggerDialog = 1;
            this.$nextTick(() => {
                this.$refs.loggerDialog.open(item);
            })
        },
        //表格选择后回调事件
        selectionChange(selection) {
            this.selection = selection;
        },
        doSearch() {
            this.list.apiObj.get(this.form).then(res => {
                if (res.code === '00000') {
                    this.listData = res.data.data;
                    for (const item of this.listData) {
                        this.refreshState(item);
                    }
                    this.total = res.data.total;
                }
            })
        },
        async initial() {
            const res = await this.$API.config.actuator.profile.get();
            if (res.code === '00000') {
                this.profiles = res.data;
                res.data.forEach(item => {
                    this.data[0].options.push({
                        label: item,
                        value: item
                    })
                })
            }
            const res1 = await this.$API.config.actuator.applications.get();
            if (res1.code === '00000') {
                this.applications = res1.data;
            }


        },
        submitFormUpdate(row) {
            this.list.apiObjSave.post(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    this.visible = !1;
                    return 0;
                }
                this.$message.error(res.msg);
            })
        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.searchParams = selected;
            this.form.profile = selected.appProfile;
            this.doSearch();
        }
    }
}
</script>

<style scoped>
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
}

.state1 {
    font-size: 20px;
    color: blue;
    width: 24px;
    height: 24px;
    display: inline-block;
    line-height: 20px;
    position: absolute;
    right: 0;
    cursor: pointer;
}
</style>

