<template>
	<el-card shadow="never" header="应用管理">
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
                                                    <h4>应用名称</h4>
                                                    <p>{{ item.monitorAppname }} </p>
                                                </li>
                                                <li>
                                                    <h4>应用说明</h4>
                                                    <p><el-tag effect="light">{{ item.monitorName }}</el-tag></p>
                                                </li>
                                            </ul>
                                        </el-col>

                                        <el-col :span="12" class="cursor-pointer">
                                            <el-progress  @click="doOpenApps(item)" type="circle"  :stroke-width="10" :percentage="item.monitorRequests ? item.monitorRequests?.length : 0" :show-text="true">
                                                <template #default="{ percentage }">
                                                    <span class="percentage-value">{{ percentage }}</span>
                                                    <span class="percentage-label">应用</span>
                                                </template>
                                            </el-progress>
                                        </el-col>
                                    </el-row>

                                    <div class="bottom" >
                                        <div class="state">
                                           <el-button  circle size="small" icon="el-icon-edit" style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(item)"></el-button>
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
                        <scPagintion :pageSize="form.pageSize" :total="total"  @dataChange="afterPropertiesSet"></scPagintion>
                    </el-footer>
                </el-container>
            </el-skeleton>
		</el-main>
	</el-card>
    <save-dialog ref="saveDialog" v-if="saveDialogStatus" @success="afterPropertiesSet" />
    <info-dialog ref="infoDialog" v-if="infoDialogStatus" />

</template>

<script>
import SaveDialog from './save.vue'
import InfoDialog from './info.vue'
	export default {
        components: {
            SaveDialog,InfoDialog
        },
		data() {
			return {
                socket: null,
                data:[],
                total: 0,
                loading: false,
                saveDialogStatus: false,
                infoDialogStatus: false,
                deleteStatus: false,
				apiObj: this.$API.monitor.app.page,
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
            doOpenApps(item){
                this.infoDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.infoDialog.open('view').setData(item);
                });
            },
            afterPropertiesSet(item) {
                this.loading = true;
                if(item) {
                    this.form.pageSize = item.pageSize;
                    this.form.page = item.page;
                }
                this.apiObj.get(this.form).then(res => {
                    if(res.code === '00000') {
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
            doDelete(item) {
                this.deleteStatus = true;
                this.$API.monitor.app.delete.delete({id: item.monitorId}).then(res => {
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
