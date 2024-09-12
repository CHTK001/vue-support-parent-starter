<template>
    <el-dialog v-model="visible" :title="title" @close="close">
        <el-container>
            <el-header>
                <div class="left-panel">
                </div>
                <div class="right-panel">
                    <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                    <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                    <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length == 0"
                        @click="batch_del"></el-button>
                </div>
            </el-header>
            <el-main class="nopadding">
                <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                    <el-table-column type="selection" width="50"></el-table-column>
                    <el-table-column label="应用名称" prop="proxyName" ></el-table-column>
                    <el-table-column label="限流地址" prop="limitUrl" show-overflow-tooltip>
                        <template #default="scope">
                            <span>{{ scope.row.limitUrl }}<span v-if="scope.row.limitAddress">({{ scope.row.limitAddress }})</span></span>
                        </template>
                    </el-table-column>
                    <el-table-column label="每秒次数" prop="limitPermitsPerSecond" show-overflow-tooltip></el-table-column>
                    <el-table-column label="是否开启" prop="limitDisable" :filters="statusFilters"
                        :filter-method="filterHandler">
                        <template #default="scope">
                            <el-switch @change="submitFormUpdate(scope.row)"
                                v-model="scope.row.limitDisable" class="ml-2" :active-value=1 :inactive-value=0
                                 />
                        </template>
                    </el-table-column>
                    <el-table-column label="操作" fixed="right" align="right" width="260">
                        <template #default="scope">
                            <el-button-group>
                                <el-button  text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                                <el-popconfirm title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                    <template #reference>
                                        <el-button  text type="primary" size="small">删除</el-button>
                                    </template>
                                </el-popconfirm>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </scTable>
            </el-main>
        </el-container>
    
    </el-dialog>

    <el-dialog draggable v-model="visible" width="50%" destroy-on-close @closed="$emit('closed')">
        <el-form :status-icon="true" :model="row" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="160px" label-position="left">
            <el-form-item v-show="false" label="索引" prop="configName">
                <el-input v-model="row.configId" clearable></el-input>
            </el-form-item>
            <el-form-item v-if="!row.limitId" label="代理名称" prop="proxyId">
                <el-select  filterable v-model="row.proxyId">
                    <el-option v-for="it in apps" :label="it.proxyName" :value="it.proxyId"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="限流方式" >
                <el-switch :active-value=1 :inactive-value=0 active-text="黑名单" inactive-text="白名单" inline-prompt  v-model="row.limitBlack"></el-switch>
            </el-form-item>

            <div v-if="row.limitBlack == 0">
                <el-form-item label="限流地址" prop="limitUrl">
                    <el-input  v-model="row.limitUrl" clearable></el-input>
                </el-form-item>
                <el-form-item label="限流地址" prop="limitAddress">
                    <el-input  v-model="row.limitAddress" clearable></el-input>
                </el-form-item>
                <el-form-item label="每秒访问次数" prop="limitPermitsPerSecond">
                    <el-input type="number" v-model="row.limitPermitsPerSecond" clearable></el-input>
                </el-form-item>
                <el-form-item label="是否开启" prop="limitDisable">
                    <el-switch v-model="row.limitDisable" clearable :active-value=1 :inactive-value=0></el-switch>
                </el-form-item>
            </div>
            <div>
                <el-form-item label="限流地址" prop="limitAddress">
                    <el-input  v-model="row.limitAddress" clearable></el-input>
                </el-form-item>
            </div>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(row)">保 存</el-button>
        </template>
    </el-dialog>
</template>

<script>
export default {
    name: 'tableBase',
    components: {
    },
    data() {
        return {
            statusFilters: [
                { text: '启用', value: 0 },
                { text: '禁用', value: 1 }
            ],
            form: {
                mapMethod: []
            },
            rules:{
                proxyId: [{ required: true, message: '请选择代理', trigger: 'blur' }],
                limitUrl: [{ required: true, message: '请输入限流地址', trigger: 'blur' }],
                limitPermitsPerSecond: [{ required: true, message: '请输入每秒访问次数', trigger: 'blur' }],
            },
            mode: 'add',
            isSaveing: false,
            apps: [],
            tableData: [],
            tableDataCopy: [],
            visible: 0,
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "limitProfile",
                    multiple: !1,
                    options: [

                    ]
                },

            ],
            row: {
                limitDisable: 1
            },
            applications: [],
            list: {
                apiObj: this.$API.proxy_limit.page,
                apiObjUpdate: this.$API.proxy_limit.update,
                apiObjSave: this.$API.proxy_limit.save,
                apiObjUpload: this.$API.proxy_limit.upload,
                apiObjDelete: this.$API.proxy_limit.delete,
            },
            selection: [],
            apps: []
        }
    },
    mounted() {
        this.data[0].options = this.profiles;
        this.afterPrepertiesSet();
    },
    methods: {
        setData(form) {
            
        },
        async afterPrepertiesSet(){
            this.$API.proxy.list.get().then(res => {
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
            if(!this.searchParams.configProfile) {
                delete this.searchParams.configProfile;
            }
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete({id: row.limitId}).then(res => {
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
                    ids.push(item.limitId);
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
            this.visible = !0;
            if(!row.limitId) {
                row.limitDisable = 0;
            }
            this.changeRow(row);
            this.row = row;
            delete this.row.disable;
        },
        changeRow(row){
        },
        submitFormUpdate(row) {
            if(this.$refs.dialogForm) {
                
                this.$refs.dialogForm.validate((valid) => {
                    if(valid) {
                        if(!row.limitId) {
                            this.list.apiObjSave.post(row || this.row).then(res => {
                                if (res.code === '00000') {
                                    this.search();
                                    this.visible = !1;
                                    return 0;
                                }
                                this.$message.error(res.msg);
                            }).finally(() => {
                                this.changeRow(row);
                            })
                            return false;
                        }
                        this.list.apiObjUpdate.put(row || this.row).then(res => {
                            if (res.code === '00000') {
                                this.search();
                                this.visible = !1;
                                return 0;
                            }
                            this.$message.error(res.msg);
                        }).finally(() => {
                            this.changeRow(row);
                        })
                    }
                })
                return;
            }
            this.list.apiObjUpdate.put(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.search();
                    this.visible = !1;
                    return 0;
                }
                this.$message.error(res.msg);
            }).finally(() => {
                this.changeRow(row);
            })
        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.searchParams = selected;
            if(!selected.limitProfile) {
                delete selected.limitProfile;
            }
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
