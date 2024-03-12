<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <sc-select-filter :data="data"  :label-width="80" @on-change="change"></sc-select-filter>
                <br />
            </div>
            <div class="right-panel">
                <el-select allow-create filterable v-model="searchParams.monitorAppname">
                    <el-option v-for="it in apps" :label="it.monitorName" :value="it.monitorAppname"></el-option>
                </el-select>
                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length == 0" @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :apiObj="list.apiObj" :params="searchParams" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="monitorAppname" ></el-table-column>
                <el-table-column label="环境" prop="monitorMybatisProfile" >
                    <template #default="scope">
                        <el-tag>{{ scope.row.monitorMybatisProfile }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="方法名称" prop="monitorMybatisName"></el-table-column>
                <el-table-column label="Model" prop="monitorMybatisModelType" show-overflow-tooltip></el-table-column>
                <el-table-column label="Mapper" prop="monitorMybatisMapperType" show-overflow-tooltip></el-table-column>
                <el-table-column label="描述" prop="monitorMybatisDesc" show-overflow-tooltip></el-table-column>
                <el-table-column label="是否禁用" prop="monitorMybatisStatus"  :filters="statusFilters"
                    :filter-method="filterHandler">
                    <template #default="scope">
                        <el-switch @change="submitFormUpdate(scope.row)"
                            v-model="scope.row.monitorMybatisStatus" class="ml-2" :active-value="0" :inactive-value="1"
                            style="--el-switch-on-color: #ff4949; --el-switch-off-color: #13ce66" />
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group >
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

   
   <SaveLayout v-if="saveShow" ref="saveRef" @success="search"></SaveLayout>
</template>

<script>
import SaveLayout from './save.vue'
import scSelectFilter from '@/components/scSelectFilter/index.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter, SaveLayout
    },
    data() {
        return {
            saveShow: false,
            statusFilters: [
                { text: '启用', value: 0 },
                { text: '禁用', value: 1 }
            ],
            form: {
                mapMethod: []
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
        submitFormUpdate(row){
            this.list.apiObjUpdate.put(row || this.row).then(res => {
                if (res.code === '00000') {
                    this.search();
                    this.visible = !1;
                    return 0;
                }
                this.$message.error(res.msg);
            });
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
            this.saveShow = true;
            this.$nextTick(() => {
                this.$refs.saveRef.open('add').setData(row, this.apps, this.profiles);
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
