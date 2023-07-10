<template>
    <el-skeleton :loading="status.loading" animated>
        <div style="height: 100vh;">
            <div style="height: 50vh;">
                <div id="operator2" class="panel-header panel-header-noborder"
                    style="height:auto; border-left: solid 1px #ddd; border-right: solid 1px #ddd">
                    <div>
                        <a href="javascript:void(0)" id="newQueryButton"
                            class="easyui-linkbutton l-btn l-btn-small l-btn-plain" iconcls="icon-standard-add"
                            @click="addData();" title="添加数据"><span class="l-btn-left l-btn-icon-left"><span
                                    class="l-btn-text">添加数据</span><span
                                    class="l-btn-icon icon-standard-add">&nbsp;</span></span></a>
                        <span class="toolbar-item dialog-tool-separator"></span>

                        <a href="javascript:void(0)" class="easyui-linkbutton l-btn l-btn-small l-btn-plain"
                            iconcls="icon-standard-arrow-refresh" id="refreshButton" @click="doSearch()"><span
                                class="l-btn-left l-btn-icon-left"><span class="l-btn-text">刷新</span><span
                                    class="l-btn-icon icon-standard-arrow-refresh">&nbsp;</span></span></a>

                    </div>
                </div>

                <el-table v-loading="status.tableLoad" show-overflow-tooltip :data="data.tableData"
                    style="width: 100%; height: 100%" border stripe @selection-change="handleSelectionChange">
                    <el-table-column type="selection" width="55" />
                    <el-table-column prop="taskTid" label="任务编号" width="300"></el-table-column>
                    <el-table-column prop="taskName" label="任务名称"></el-table-column>
                    <el-table-column prop="taskExpire" label="任务超时时间(s)" width="140" />
                    <el-table-column prop="taskType" label="任务类型" width="200"/>
                    <el-table-column prop="taskType" label="任务类型" width="100">
                        <template #default="scope">
                            <el-tag class="ml-2" type="success" v-if="scope.row.taskStatus === 0">未开始</el-tag>
                            <el-tag class="ml-2" type="success" v-if="scope.row.taskStatus === 1">已完成</el-tag>
                            <el-tag class="ml-2" type="success" v-if="scope.row.taskStatus === 2">已暂停</el-tag>
                            <el-tag class="ml-2" type="success" v-if="scope.row.taskStatus === 3">正在运行</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="任务当前进度" >
                        <template #default="scope">
                            <el-progress width="80"  :text-inside="true" :stroke-width="16"  :color="customColor"
                                :percentage="((scope.row.taskCurrent / scope.row.taskTotal) * 100).toFixed(2)" />
                        </template>
                    </el-table-column>
                    <el-table-column prop="taskCost" label="任务耗时" width="100" show-overflow-tooltip	>
                        <template #default="scope">
                            <el-statistic title="任务耗时" :value="scope.row.taskCost" />
                        </template>
                    </el-table-column>
                    <el-table-column label="任务处理量" prop="taskCurrent" width="100"/>
                    <el-table-column label="任务总量" prop="taskTotal" width="100" />
                    <el-table-column label="操作">
                        <template #default="scope">
                            <el-button type="info" v-if="scope.row.taskStatus !== 1" :icon="Edit" @click.stop="onUpdate(scope.row)" size="small" />
                            <el-button type="danger" :icon="Delete" @click.stop="onDelete(scope.row)" size="small" />
                            <el-button type="default" v-if="scope.row.taskStatus !== 1" :icon="VideoPause" @click.stop="onPause(scope.row)" size="small" />
                            <el-button type="default" v-if="scope.row.taskStatus !== 1" :icon="VideoPlay" @click.stop="onRun(scope.row)" size="small" />
                        </template>
                    </el-table-column>

                </el-table>

                <div class="demo-pagination-block">
                    <el-pagination v-model:current-page="form.pageNum" v-model:page-size="form.pageSize" small="small"
                        :total="data.total" ref="pageGroup" :page-sizes="[10, 20, 50, 100]"
                        layout="->,prev, next, sizes, ->," @size-change="handleSizeChange"
                        @current-change="handleCurrentChange" />
                </div>
            </div>
        </div>
    </el-skeleton>

    <el-dialog draggable status-icon v-model="status.dialogVisible" title="任务配置" width="30%">
        <el-form ref="formRef" :model="data.formData" :rules="rules.task" label-width="120px">
            <el-form-item label="taskId" prop="taskId" v-if="false">
                <el-input v-model="data.formData.taskId" readonly disable />
            </el-form-item>
            <el-form-item label="任务名称" prop="taskName">
                <el-input v-model="data.formData.taskName" clearable placeholder="请输入任务名称" />
            </el-form-item>

            <el-form-item label="任务类型" prop="taskType">
                <div v-if="isUpdate">
                    <el-input v-model="data.formData.taskType" readonly disabled placeholder="请输入总量" />
                </div>
                <div v-else>
                    <el-select v-model="data.formData.taskType" @change="handleDirChange">
                        <el-option :value="item.type + ',' + item.value" :label="item.label" v-for="item in data.taskType">
                            <span style="float: left">{{ item.value }}</span>
                            <span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{
                                item.label
                            }}</span>
                        </el-option>
                    </el-select>
                </div>
            </el-form-item>

            <el-tooltip class="box-item" effect="dark" content=" (个)" placement="right">
                <el-form-item label="总量" prop="taskTotal">
                    <div v-if="isUpdate">
                        <el-input v-model="data.formData.taskTotal" readonly disabled />
                    </div>
                    <div v-else>
                        <el-input v-model="data.formData.taskTotal" type="number" clearable placeholder="请输入总量" />
                    </div>
                </el-form-item>
            </el-tooltip>
            
            <el-tooltip class="box-item" effect="dark" content=" (秒)" placement="right">
                <el-form-item label="过期时间" prop="taskExpire">
                    <el-input v-model="data.formData.taskExpire" type="number" clearable placeholder="请输入配置名称" />
                </el-form-item>
            </el-tooltip>
            
            <el-form-item label="参数" prop="value">
                <el-input v-model="data.formData.taskParams" type="textarea" clearable placeholder="请输入参数" />
            </el-form-item>
            <el-form-item>
                <el-button @click="status.dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm()" :loading="status.loading">提交</el-button>
            </el-form-item>
        </el-form>
    </el-dialog>


    <!-- 右键菜单 -->
    <right-menu :class-index="1" :rightclickInfo="rightclickInfoOpenTable" @onCopy="onCopy"></right-menu>
</template>
  
<script>
import request from '@/utils/request'
import URL from '@/config/task-url'
import { copy, isNewSame, sformat } from "@/utils/Utils";
import '@/plugins/layx/layx.min.css'
import '@/style/easy.css'
import '@/assets/icons/icon-berlin.css'
import '@/assets/icons/icon-hamburg.css'
import '@/assets/icons/icon-standard.css'
import { ElNotification } from 'element-plus'
import { Delete, Edit, Link, PictureFilled, VideoPause, VideoPlay } from "@element-plus/icons-vue";

export default {
    name: "Task",
    computed: {
        Link() {
            return Link
        },
        VideoPause() {
            return VideoPause
        },
        VideoPlay() {
            return VideoPlay
        },
        Edit() {
            return Edit
        },
        Delete() {
            return Delete
        },
        PictureFilled() {
            return PictureFilled
        }
    },
    data() {
        return {
            customColor: [
                { color: '#f56c6c', percentage: 20 },
                { color: '#e6a23c', percentage: 40 },
                { color: '#5cb87a', percentage: 60 },
                { color: '#1989fa', percentage: 80 },
                { color: '#6f7ad3', percentage: 100 },
            ],
            rightclickInfoOpenTable: {},
            isUpdate: false,
            data: {
                total: 0,
                tableColumn: [],
                tableData: [],
                taskType: [],
                formData: {}
            },
            status: {
                tableLoad: false,
                dialogVisible: !1,
                rowAction: 'add',
                loading: false,
                //每个单元个状态
                rowStatus: {}
            },
            rules: {
                task: {
                    taskName: [{ required: true, message: "键不能为空", trigger: 'blur' }],
                    taskType: [{ required: true, message: "任务类型不能为空", trigger: 'blur' }],
                    taskTotal: [{ required: true, message: "总量不能为空", trigger: 'blur' }]
                },
            },
            form: {
                pageNum: 1,
                pageSize: 10
            },
            cost: 0,
            recordData: [],
            updateRecordData: []
        }
    },
    mounted() {
        this.subscribe('sdsakhj29c4454aJJRLSSd23')
        this.initial();
        this.doSearch();
        document.title = '任务管理'
    },
    methods: {
        onUpdate: function (row) {
            this.data.formData = row;
            this.status.dialogVisible = !this.status.dialogVisible;
            this.isUpdate = !0;
        },
        onPause: function (row) {
            request.post(URL.PAUSE, row).then(({ data }) => {
                let type = 'success';
                if (data.code !== '00000') {
                    type = 'error';
                } else {
                    row.taskStatus = 2;
                }
                ElNotification({
                    title: '消息提示',
                    type: type,
                    message: data.msg
                });
            })
        },
        onRun: function (row) {
            request.post(URL.RUN, row).then(({ data }) => {
                let type = 'success';
                if (data.code !== '00000') {
                    type = 'error';
                } else {
                    row.taskStatus = 3;
                }
                ElNotification({
                    title: '消息提示',
                    type: type,
                    message: data.msg
                });
            })
        },
        onDelete: function (row) {
            request.delete(URL.DELETE, { params: { taskTid: row.taskTid } }).then(({ data }) => {
                let type = 'success';
                if (data.code !== '00000') {
                    type = 'error';
                    ElNotification({
                        title: '消息提示',
                        type: type,
                        message: data.msg
                    });
                }
                this.doSearch();
            });
           
        },
        handleDirChange: function (data) {
            this.data.formData.taskType = data.split(',')[0];
            this.data.formData.taskCid = data.split(',')[1];
        },
        subscribe: function (taskTid) {
            const _this = this;
            const eventSource = new EventSource(URL.EMIT + "?taskTid=" + taskTid);
            eventSource.onmessage = function (event) {
                const data = JSON.parse(event.data);
                if(data.type === 'PROCESS') {
                    _this.data.tableData.forEach(item => {
                        if (item.taskTid === data.tid) {
                            item.taskCurrent = ~~data.message;
                            if(item.taskCurrent >= item.taskTotal) {
                                item.taskStatus = 1
                            }
                        }
                    })
                } else  if(data.type === 'FINISH') {
                    _this.data.tableData.forEach(item => {
                        if (item.taskTid === data.tid) {
                            item.taskCost = ~~data.message;
                        }
                    })
                } else if(data.type === 'NOTIFY') {
                    ElNotification({
                        title: '提示',
                        message: data.message,
                        type: 'success'
                    })
                } else if(data.type === 'NOTIFY_HTML') {
                    ElNotification({
                        title: '提示',
                        dangerouslyUseHTMLString: true,
                        message: data.message,
                        type: 'success'
                    })
                }
                
                
            };
            eventSource.onerror = function (event) {
                // 处理过错
            };
            eventSource.onopen = function (event) {
                ElNotification({
                    title: '提示',
                    message: '订阅成功',
                    type: 'success'
                })
            };
        },
        initial() {
            request.get(URL.OPTIONS).then(({ data }) => {
                this.data.taskType = data.data;
            });

        },
        submitForm: function () {
            this.$refs.formRef.validate(it => {
                if(it) {
                    request.post(URL.CREATE, this.data.formData).then(({ data }) => {
                        let type = 'success';
                        if (data.code !== '00000') {
                            type = 'error';
                        } else {
                            this.doSearch();
                            this.status.dialogVisible = !this.status.dialogVisible;
                        }
                        ElNotification({
                            title: '消息提示',
                            type: type,
                            message: data.msg
                        });
                    })
                }
            })
            
        },
        deleteRow: function (row) {
            this.status.tableLoad = !0;
            for (const el of this.data.multipleSelection) {
                this.recordData.push({
                    newData: {},
                    oldData: el,
                    action: 'delete'
                })
            }
            this.saveRow();
        },
        addData: function () {
            this.data.formData = {};
            this.status.dialogVisible = !this.status.dialogVisible;
            this.isUpdate = !1;
        },

        doSearch: function () {
            request.get(URL.PAGE, { param: this.form }).then(({ data }) => {
                let type = 'success';
                if (data.code !== '00000') {
                    type = 'error';
                } else {
                    this.data.tableData = data.data.data.data
                    this.data.total = data.data.data.total
                }
              
            })
        },
        handleSizeChange: function (e) {
            this.form.pageSize = e;
            this.doSearch();
            return !1;
        },
        handleCurrentChange: function (e) {
            this.form.pageNum = e;
            this.doSearch();
            return !1;
        },
    }
}
</script>
  
<style scoped></style>