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
                                <el-card class="task task-item " shadow="always" @click="openDetail(item)">
                                    <el-row class="relation">
                                        <el-col :span="8">
                                            <el-image style="width: 70%; height: 70%" :src="getImage(item.genJdbcType)" fit="contain"/>
                                        </el-col>
                                        <el-col :span="8">
                                            <ul>
                                                <li>
                                                    <h4>访问地址</h4>
                                                    <p>
                                                        {{ item.genHost }}:{{ item.genPort}}
                                                     </p>
                                                </li>
                                                <li>
                                                    <h4>应用说明</h4>
                                                    <p><el-tag effect="light">{{ item.genDesc || '无' }}</el-tag></p>
                                                </li>
                                            </ul>
                                        </el-col>
                                        <el-col :span="8">
                                            <ul>
                                                <li>
                                                    <h4>账号</h4>
                                                    <p>{{ item.genUser || '-' }} </p>
                                                </li>
                                                <li>
                                                    <h4>数据库</h4>
                                                    <el-tag>{{ item.genDatabase}} </el-tag>
                                                </li>
                                            </ul>
                                        </el-col>
                                    </el-row>

                                    <div class="bottom" >
                                        <div class="state">
                                            <el-button type="danger"  circle size="small" icon="el-icon-delete" style="font-size: 16px" class="cursor-pointer" title="删除" @click="doDelete(item)"></el-button>
                                            <el-button circle size="small" icon="el-icon-edit"  style="font-size: 16px" class="cursor-pointer" title="编辑" @click="doEdit(item)" />
                                            <!-- <el-button circle size="small" icon="sc-icon-template"  style="font-size: 16px" class="cursor-pointer" title="模板" @click="doTemplate(item)" /> -->
                                            <!-- <el-button circle size="small" icon="el-icon-menu"  style="font-size: 16px" class="cursor-pointer" title="控制台" @click="doConsole(item)"></el-button> -->
                                            <el-button v-if="item.supportDocument"  circle size="small" icon="sc-icon-database-lock"  style="font-size: 16px" class="cursor-pointer" title="文档" @click="doDoc(item)"></el-button>
                                            <!-- <el-button circle size="small" icon="sc-icon-database-search"  style="font-size: 16px" class="cursor-pointer" title="面板" @click="doBoard(item)"></el-button> -->
                                            <!-- <el-button circle size="small" icon="sc-icon-database-message"  style="font-size: 16px" class="cursor-pointer" title="日志" @click="doLog(item)"></el-button> -->
                                            <el-button v-if="item.supportBackup === true && !item.genBackupStatus"  :loading="backupLoading[item.genId]" circle size="small" icon="sc-icon-document"   style="font-size: 16px" class="cursor-pointer" title="备份" @click="doBackup(item, 1)"></el-button>
                                            <el-button v-if="item.supportBackup === true && item.genBackupStatus == 1" :loading="backupLoading[item.genId]" circle size="small" icon="sc-icon-pause"    style="font-size: 16px" class="cursor-pointer" title="备份" @click="doBackup(item, 0)"></el-button>
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
    <el-drawer v-model="consoleDialogStatus" title="控制台"  size="80%" :close-on-click-modal="false" >
        <console-dialog ref="consoleDialog"/>
    </el-drawer>
    <doc-dialog v-if="docDialogStatus" ref="docDialog"/>
    <log-dialog ref="logDialogRef" v-if="logDialogStatus"></log-dialog>
    <board-dialog ref="boardDialogRef" v-if="boardDialogStatus"></board-dialog>
    <template-dialog ref="templateDialogRef" v-if="templateDialogStatus"></template-dialog>

</template>

<script>
import LogDialog from './console/log/index.vue'
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';

import TemplateDialog from './console/template/index.vue'
import SaveDialog from './save.vue'
import InfoDialog from './info.vue'
import DocDialog from './console/doc/index.vue'
import ConsoleDialog from './console/console/index.vue'
import BoardDialog from './console/board/index.vue'
	export default {
        components: {
            SaveDialog,InfoDialog, DocDialog, ConsoleDialog, LogDialog, BoardDialog,TemplateDialog
        },
		data() {
			return {
                logDialogStatus: false,
                boardDialogStatus: false,
                consoleDialogStatus: false,
                docDialogStatus: false,
                socket: null,
                data:[],
                total: 0,
                loading: false,
                saveDialogStatus: false,
                infoDialogStatus: false,
                templateDialogStatus: false,
                deleteStatus: false,
                backupLoading: {},
				apiObj: this.$API.gen.database.list,
                form: {
                    pageSize: 20,
                    page: 1,
                    databaseType: 'jdbc'
                }
			}
		},
        mounted() {
            this.afterPropertiesSet()
        },
        methods: {
            getImage(name){
                return getAssetsImages(name);
            },
            doTermial(item){
                this.infoDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.infoDialog.open('view').setData(item);
                });
            },
            openDetail(item){

            },
            doConsole(item){
                this.consoleDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.consoleDialog.open('view').setData(item);
                });
            },
            doDoc(item){
                this.docDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.docDialog.open(item);
                });
            },
            doBoard(item){
                this.boardDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.boardDialogRef.open(item);
                });
            },
            doBackup(item, status){
                this.backupLoading[item.genId] = !0;
                if(status == 1) {
                    this.$API.gen.backup2.start.put(item).then(res => {
                        if(res.code === '00000') {
                            item.genBackupStatus = status;
                            this.$message.success('备份开启');
                            return;
                        }
                        this.$message.error(res.msg);
                    }).finally(() => this.backupLoading[item.genId] = false)
                    return;
                }
                this.$API.gen.backup2.stop.put(item).then(res => {
                        if(res.code === '00000') {
                            item.genBackupStatus = status;
                            this.$message.success('备份关闭');
                            return;
                        }
                        this.$message.error(res.msg);
                    }).finally(() => this.backupLoading[item.genId] = false)
                    return;
            },
            doLog(item){
                this.logDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.logDialogRef.open(item);
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
            doTemplate(item) {
                this.templateDialogStatus = true;
                this.$nextTick(() => {
                    this.$refs.templateDialogRef.open('edit').setData(item);
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
