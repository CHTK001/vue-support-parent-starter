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
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="monitorMybatisAppname" width="150"></el-table-column>
                <el-table-column label="环境" prop="monitorMybatisProfile" width="150">
                    <template #default="scope">
                        <el-tag>{{ scope.row.monitorMybatisProfile }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="配置名称" prop="monitorMybatisName"></el-table-column>
                <el-table-column label="配置值" prop="monitorMybatisValue" show-overflow-tooltip></el-table-column>
                <el-table-column label="描述" prop="monitorMybatisDesc" show-overflow-tooltip></el-table-column>
                <el-table-column label="是否禁用" prop="monitorMybatisStatus" width="150" :filters="statusFilters"
                    :filter-method="filterHandler">
                    <template #default="scope">
                        <el-switch @change="submitFormUpdate(scope.row)"
                            v-model="scope.row.monitorMybatisStatus" class="ml-2" :active-value="0" :inactive-value="1"
                            style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group v-if="!scope.row.monitorMybatisName?.startsWith('monitorMybatis-')">
                            <el-button v-if="scope.row.monitorMybatisStatus != 0" v-auth="'sys:monitorMybatis:upload'" text type="primary" size="small" @click="table_upload(scope.row, scope.$index)">下发</el-button>
                            <el-button v-auth="'sys:monitorMybatis:edit'" text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                            <el-popconfirm v-auth="'sys:monitorMybatis:del'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button v-auth="'sys:monitorMybatis:del'" text type="primary" size="small">删除</el-button>
                                </template>
                            </el-popconfirm>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>

    <el-dialog draggable v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')">
        <el-form :model="row" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">
            <el-form-item v-show="false" label="索引" prop="monitorMybatisName">
                <el-input v-model="row.monitorMybatisId" clearable></el-input>
            </el-form-item>
            <el-form-item label="环境" prop="monitorMybatisProfile">
                <el-select allow-create filterable v-model="row.monitorMybatisProfile">
                    <el-option v-for="it in profiles" :label="it.label" :value="it.value"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item v-if="!row.monitorMybatisId" label="应用名称" prop="monitorMybatisAppname">
                <el-select allow-create filterable v-model="row.monitorMybatisAppname">
                    <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="配置名称" prop="monitorMybatisName">
                <el-input  v-model="row.monitorMybatisName" clearable placeholder="请输入配置名称"></el-input>
            </el-form-item>

            <el-form-item label="Mapper" prop="monitorMybatisMapperType">
                <el-input  v-model="row.monitorMybatisMapperType" clearable placeholder="请输入Mapper名称" ></el-input>
            </el-form-item>

            <el-form-item label="Model" prop="monitorMybatisModelType">
                <el-input  v-model="row.monitorMybatisModelType" clearable placeholder="请输入Model名称" ></el-input>
            </el-form-item>

            <el-form-item label="配置类型" prop="monitorMybatisSqlType">
                <el-select  v-model="row.monitorMybatisSqlType" clearable placeholder="请输入配置类型">
                    <el-option label="SQL" value="sql"></el-option>
                    <el-option label="XML" value="xml"></el-option>
                </el-select>
            </el-form-item>

            <el-form-item label="sql" prop="monitorMybatisSql" v-if="row.monitorMybatisSqlType">
                <template-icon :formValue="row.monitorMybatisSql" :mode="row.monitorMybatisSqlType" @success="handleEvent" ></template-icon>
            </el-form-item>

            <el-form-item label="描述" prop="monitorMybatisDesc">
                <el-input type="textarea" v-model="row.monitorMybatisDesc" clearable placeholder="请输入描述"></el-input>
            </el-form-item>
        </el-form>
        <template #footer>
            <el-button @click="visible = false">取 消</el-button>
            <el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submitFormUpdate(row)">保 存</el-button>
        </template>
    </el-dialog>
</template>

<script>
import TemplateIcon from './template.vue';
import scSelectFilter from '@/components/scSelectFilter/index.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter, TemplateIcon
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
            rules: {
                    monitorMybatisProfile: [
                        { required: true, message: '请选择环境', trigger: 'change' }
                    ],
                    monitorMybatisAppname: [
                        { required: true, message: '请选择应用名称', trigger: 'change' }
                    ],
                    monitorMybatisName: [
                        { required: true, message: '请输入配置名称', trigger: 'change' },
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],
                    monitorMybatisSqlType: [
                        { required: true, message: '请选择配置类型', trigger: 'change' }
                    ],
                    monitorMybatisMapperType: [
                        { required: true, message: '请输入Mapper名称', trigger: 'change' },
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],
                    monitorMybatisModelType: [
                        { required: true, message: '请输入Model名称', trigger: 'change' },
                    ],
                    monitorMybatisSql: [
                        { required: true, message: '请输入sql', trigger: 'change' }
                    ],
                    monitorMybatisDesc: [
                        { min: 1, max: 100, message: '长度在 1 到 100 个字符', trigger: 'change' }
                    ],

            },
            visible: 0,
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
            row: {},
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
            applications: [],
            list: {
                apiObj: this.$API.monitor.mybatis.page,
                apiObjUpdate: this.$API.monitor.mybatis.update,
                apiObjSave: this.$API.monitor.mybatis.save,
                apiObjUpload: this.$API.monitor.mybatis.upload,
                apiObjDelete: this.$API.monitor.mybatis.delete,
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
        handleEvent(data){
            this.row.monitorMybatisSql = data;
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
            if(!this.searchParams.monitorMybatisProfile) {
                delete this.searchParams.monitorMybatisProfile;
            }
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete({id: row.monitorMybatisId}).then(res => {
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
            this.visible = !0;
            this.row = row;
            delete this.row.disable;
        },
        submitFormUpdate(row) {
            this.$refs.dialogForm.validate(valid => {
                if(valid) {
                    if(!row.monitorMybatisId) {
                        this.list.apiObjSave.post(row || this.row).then(res => {
                            if (res.code === '00000') {
                                this.search();
                                this.visible = !1;
                                return 0;
                            }
                            this.$message.error(res.msg);
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
                    })
                }
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
