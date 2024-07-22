<template>
    <el-button plain text  icon="el-icon-refresh" @click="afterPropertiesSet">刷新</el-button>
	<el-card shadow="never">
		<el-main class="nopadding">
            <el-skeleton :loading="loading" animated>
                <el-container>
                    <el-main>
                        <el-row :gutter="15">
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in data" :key="item.id"
                                class="demo-progress">
                                <el-card class="task task-item " shadow="always">
                                    <el-row class="relation">
                                        <el-col :span="12">
                                            <ul>
                                                <li>
                                                    <h4>访问地址</h4>
                                                    <p>{{ item.genHost }}:{{ item.genPort}} </p>
                                                </li>
                                                <li>
                                                    <h4>应用说明</h4>
                                                    <p><el-tag effect="light">{{ item.genDesc || '无' }}</el-tag></p>
                                                </li>
                                            </ul>
                                        </el-col>
                                        <el-col :span="12">
                                            <ul>
                                                <li>
                                                    <h4>账号</h4>
                                                    <p>{{ item.genUser || '-' }} </p>
                                                </li>
                                                <li>
                                                    <h4>模块</h4>
                                                    <p>
                                                        <el-skeleton v-if="moduleLoading[item?.genId]"  ></el-skeleton>
                                                        <div v-else>
                                                            <el-button size="small" :title="it.name" v-for="it in item.module" :icon="getIcon(it)"></el-button>
                                                        </div>
                                                    </p>
                                                </li>
                                            </ul>
                                        </el-col>
                                    </el-row>

                                    <div class="bottom" >
                                        <div class="state">
                                            <el-button  circle size="small" icon="el-icon-delete" type="danger"  style="font-size: 16px" class="cursor-pointer" title="删除" @click="doDelete(item)"></el-button>
                                            <el-button  circle size="small" icon="el-icon-edit"  style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(item)"></el-button>
                                            <el-button  circle size="small" icon="sc-icon-terminal"  style="font-size: 16px" class="cursor-pointer" title="控制台" @click="doConsole(item)"></el-button>
                                            <el-button  circle size="small" icon="sc-icon-monitor"  style="font-size: 16px" class="cursor-pointer" title="信息" @click="doTermial(item)"></el-button>
                                        </div>
                                    </div>
                                </el-card>
                            </el-col>
                            <el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
                                <el-card class="task task-add" shadow="never" @click="doSave">
                                    <el-icon><el-icon-plus /></el-icon>
                                    <p>添加服务</p>
                                </el-card>
                            </el-col>
                        </el-row>

                    </el-main>
                    <el-footer style="height: 51px; line-height: 50px; padding:0">
                        <scPagintion :pageSize="form.pageSize" :total="total"  @dataChange="afterPropertiesSet"></scPagintion>
                    </el-footer>
                </el-container>
            </el-skeleton>
		</el-main>
	</el-card>
    <save-dialog ref="saveDialog" v-if="saveDialogStatus" @success="afterPropertiesSet" />
    <info-dialog ref="infoDialog" v-if="infoDialogStatus" />
    <el-drawer v-model="consoleDialogStatus" title="控制台"  size="100%" :close-on-click-modal="false" :lock-scroll="false" style="overflow: hidden;">
        <console-dialog ref="consoleDialog" />
    </el-drawer>

</template>

<script>
import SaveDialog from './save.vue'
import InfoDialog from './info.vue'
import ConsoleDialog from './console/index.vue'
	export default {
        components: {
            SaveDialog,InfoDialog,ConsoleDialog
        },
		data() {
			return {
                consoleDialogStatus: false,
                socket: null,
                data:[],
                moduleLoading: {},
                total: 0,
                loading: false,
                saveDialogStatus: false,
                infoDialogStatus: false,
                deleteStatus: false,
				apiObj: this.$API.gen.database.list,
                form: {
                    pageSize: 20,
                    page: 1,
                    databaseType: 'redis'
                }
			}
		},
        mounted() {
            this.afterPropertiesSet()
        },
        methods: {
            getIcon(item){
                if(item.name == 'timeseries') {
                    return 'sc-icon-chart-line';
                }
                if(item.name == 'json' || item.name == 'ReJSON') {
                    return 'sc-icon-json';
                }
                if(item.name == 'search') {
                    return 'sc-icon-redis-search';
                }

            },
            doTermial(item){
                this.infoDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.infoDialog.open('view').setData(item);
                });
            },
            doConsole(item){
                this.consoleDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.consoleDialog.open('view').setData(item);
                });
            },
            afterPropertiesSet(item) {
                if(item) {
                    this.form.pageSize = item.pageSize;
                    this.form.page = item.page;
                }
                this.loading = true;
                this.apiObj.get(this.form).then(res => {
                    if(res.code === '00000') {
                        this.data = res.data.data;
                        this.total = res.data.total;
                        this.data.forEach(item => {
                            this.moduleLoading[item.genId] = true;
                            this.$API.gen.session.module.get({genId: item.genId}).then(res => {
                                if (res.code == '00000') {
                                    this.moduleLoading[item.genId] = false;
                                    item.module = res.data;
                               }
                            })
                        })
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
            doDelete(item) {
                this.deleteStatus = true;
                this.$API.gen.database.delete.delete({id: item.genId}).then(res => {
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

<style scoped lang="scss">
.el-overlay > div > div{
        height: 90vh;
        overflow: hidden;
}
:deep(.el-progress-circle path) {
    fill: #fff
}
.task {
	height: 190px;
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
.task-item .bottom1 {
    margin-top: -10px;
	text-align: right;
	display: flex;
    margin-bottom: 5px;
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
.state {
    height: 20px
}

</style>
