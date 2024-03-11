<template>
    <el-container>
        <el-header>
            <div class="left-panel">
            </div>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-refresh" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length == 0"
                    @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="任务名称" prop="jobExecuteBean">
                    <template #default="scope">
                        <span style="margin-right: 10px">{{ scope.row.jobExecuteBean }}</span>
                        <sc-status-indicator title="运行中" v-if="scope.row.jobStatus != 0" pulse type="success"></sc-status-indicator>
                        <sc-status-indicator title="未启动" v-else type="info"></sc-status-indicator>
                    </template>
                </el-table-column>
                <el-table-column label="应用名称" prop="jobApp" ></el-table-column>
                <el-table-column label="环境" prop="jobProfile" >
                    <template #default="scope">
                        <el-tag>{{ scope.row.jobProfile }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="任务类型" prop="jobType" show-overflow-tooltip>
                    <template #default="scope">
                        <span>{{ scope.row.jobType }}</span>
                        <span style="font-weight: 800;">
                            <span v-if="scope.row.jobType == 'FIXED'">( {{ scope.row.jobConf }}秒 )</span>
                            <span v-else>( {{ scope.row.jobConf }} )</span>
                        </span>
                    </template>
                </el-table-column>
                <el-table-column label="描述" prop="jobDesc" show-overflow-tooltip></el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group >
                            <el-button style="font-size: 18px" v-if="scope.row.jobStatus == 0" :loading="startLoading" v-auth="'sys:monitorJob:start'" text type="primary" 
                                @click="doStart(scope.row, scope.$index)" icon="el-icon-video-play">
                            </el-button>
                            <el-button style="font-size: 18px"  v-else v-auth="'sys:monitorJob:stop'" :loading="startLoading" text type="primary" 
                                @click="doStop(scope.row, scope.$index)" icon="el-icon-video-pause">
                            </el-button>

                            <el-button style="font-size: 18px" icon="el-icon-view" text type="primary"  @click="doNextTime(scope.row, scope.$index)"></el-button>
                            <el-button style="font-size: 18px"  v-auth="'sys:monitorJob:edit'" icon="el-icon-edit" text type="primary"  @click="table_edit(scope.row, scope.$index)"></el-button>
                            <el-popconfirm v-auth="'sys:monitorJob:del'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button style="font-size: 18px"  type="danger" v-auth="'sys:monitorJob:del'" text  icon="el-icon-delete"></el-button>
                                </template>
                            </el-popconfirm>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>

  
  <SaveLayout v-if="saveShow" ref="saveRef" @success="search"></SaveLayout>
  <TriggerLayout v-if="triggerShow" ref="triggerRef"></TriggerLayout>
</template>

<script>
import SaveLayout from './save.vue'
import TriggerLayout from './trigger.vue'
export default {
    name: 'tableBase',
    components:{SaveLayout, TriggerLayout},
    data() {
        return {
            startLoading: false,
            saveShow: false,
            triggerShow: false,
            statusFilters: [
                { text: '启用', value: 0 },
                { text: '禁用', value: 1 }
            ],
            form: {
                mapMethod: []
            },
           
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "monitorMybatisProfile",
                    multiple: !1,
                    options: [

                    ]
                },

            ],
          
            applications: [],
            list: {
                apiObj: this.$API.monitor.job.page,
                apiObjUpdate: this.$API.monitor.job.update,
                apiObjSave: this.$API.monitor.job.save,
                apiObjUpload: this.$API.monitor.job.upload,
                apiObjDelete: this.$API.monitor.job.delete,
            },
            selection: [],
            apps: [],
            profiles: [{
                label: "全部",
                value: ""
            },
            {
                label: "生产",
                value: "prod"
            },
            {
                label: "开发",
                value: "dev"
            },
            {
                label: "测试",
                value: "test"
            },],
        }
    },
    mounted() {
        this.data[0].options = this.profiles;
        this.afterPrepertiesSet();
    },
    methods: {
        doNextTime(row) {
            this.triggerShow = true;
            this.$nextTick(() => {
                this.$refs.triggerRef.setData(row);
            })
        },
        doStart(row){
            this.startLoading = true;
            this.$API.monitor.job.start.handler(row).then(res => {
                if(res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }
                row.jobStatus = 1;
            }).finally(() => {
                this.startLoading = false;
            })
        },
        doStop(row){
            this.startLoading = true;
            this.$API.monitor.job.stop.handler(row).then(res => {
                if(res.code !== '00000') {
                    this.$message.error(res.msg);
                    return;
                }

                row.jobStatus = 0;
            }).finally(() => {
                this.startLoading = false;
            })
        },
        async afterPrepertiesSet(){
            this.$API.monitor.app.list.get().then(res => {
                if(res.code === '00000') {
                    this.apps = res.data;
                }
            });
        },
        //表格选择后回调事件
        selectionChange(selection) {
            this.selection = selection;
        },
        search() {
            if(!this.searchParams.jobProfile) {
                delete this.searchParams.jobProfile;
            }
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete({id: row.jobId}).then(res => {
                if (res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    return 0;
                }
                this.$message.error(res.msg);
            })
        },
        //批量删除
        async batch_del() {
            this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？如果删除项中含有子集将会被一并删除`, '提示', {
                type: 'warning'
            }).then(() => {
                const loading = this.$loading();
                const ids = [];
                for (const item of this.selection) {
                    ids.push(item.monitorMybatisId);
                }
                this.list.apiObjDelete.delete({ id: ids.join(",") })
                    .then(res => {
                        if (res.code === '00000') {
                            this.$message.success("操作成功");
                            this.search();
                            return 0;
                        }
                    }).finally(() => {
                        loading.close();
                    })
            }).catch(() => {

            })
        },
        table_upload(row) {
            this.list.apiObjUpload.post(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.search();
                    this.$message.success("下发成功");
                    return 0;
                }
                this.$message.error(res.msg);
            })
        },
        table_edit(row) {
            this.saveShow = true;
            this.$nextTick(() => {
                this.$refs.saveRef.open(row.jobId ? 'edit': 'add').setData(row, this.apps, this.profiles);
            })

        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.searchParams = selected;
            if(!selected.monitorMybatisProfile) {
                delete selected.monitorMybatisProfile;
            }
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
