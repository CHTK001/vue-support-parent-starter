<template>
    <el-container>
        <el-header>
            <div class="left-panel">
                <el-row>
                    <el-col :span="24">
                        <sc-select-filter :data="data" :selected-values="selectedValues" :label-width="80" @on-change="change"></sc-select-filter>
                    </el-col>
                </el-row>
            </div>
            <div class="right-panel">
                <el-row>
                    <el-col :span="24">
                        <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                        <el-button type="primary" icon="el-icon-plus" @click="table_edit(null)"></el-button>
                        <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button>
                    </el-col>
                </el-row>        
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :initiSearch="false" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="unifiedAppname" width="150"></el-table-column>
                <el-table-column label="环境" prop="unifiedConfigProfile" width="150">
                    <template #default="scope">
                        <el-tag >{{ scope.row.unifiedConfigProfile}}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="配置名称" prop="unifiedConfigName" ></el-table-column>
                <el-table-column label="配置值" prop="unifiedConfigValue"  show-overflow-tooltip></el-table-column>
                <el-table-column label="描述" prop="unifiedConfigDesc"  show-overflow-tooltip></el-table-column>
                <el-table-column  label="启用" prop="unifiedConfigStatus" width="150" :filters="statusFilters" :filter-method="filterHandler">
                    <template #default="scope">
                        <el-switch  v-if="!scope.row.unifiedConfigName?.startsWith('config-')" @change="submitFormUpdate(scope.row, 0)" v-model="scope.row.unifiedConfigStatus" class="ml-2"
                            :inactive-value="0" :active-value="1"
                            style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949" />
                            <el-tag v-else>{{ scope.row.unifiedConfigStatus == 1 ? '是' : '否' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group v-if="!scope.row.configName?.startsWith('config-')">
                            <el-button  text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                            <el-popconfirm    title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                <template #reference>
                                    <el-button   text type="primary" size="small">删除</el-button>
                                </template>
                            </el-popconfirm>
                        </el-button-group>
                    </template>
                </el-table-column>
            </scTable>
        </el-main>
    </el-container>

   <save-dialog ref="saveDialogRef" v-if="saveDialogVisible" @close="saveDialogVisible = false" />
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
import saveDialog from './save.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter,saveDialog
    },
    data() {
        return {
            visible: false,
            saveDialogVisible: false,
            statusFilters: [
					{text: '启用', value: 0},
					{text: '禁用', value: 1}
				],
            form: {
                mapMethod: []
            },
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "unifiedConfigProfile",
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
                apiObj: this.$API.unified.mybatis.page,
                apiObjUpdate: this.$API.unified.mybatis.update,
                apiObjSave: this.$API.unified.mybatis.save,
                apiObjDelete: this.$API.unified.mybatis.delete,
            },
            selection: [],
        }
    },
    mounted(){
        this.initial();
        this.search();
    },
    methods: {
        //表格选择后回调事件
        selectionChange(selection){
            this.selection = selection;
        },
        search() {
            this.$refs.table.reload(this.searchParams)
        },
        table_del(row) {
            this.list.apiObjDelete.delete({id: row.unifiedConfigId}).then(res => {
                if(res.code === '00000') {
                    this.$message.success("操作成功");
                    this.search();
                    return 0;
                } 
                this.$message.error(res.msg);
            })
        },
        //批量删除
        async batch_del(){
            this.$confirm(`确定删除选中的 ${this.selection.length} 项吗？如果删除项中含有子集将会被一并删除`, '提示', {
                type: 'warning'
            }).then(() => {
                const loading = this.$loading();
                const ids = [];
                for(const item of this.selection) {
                    ids.push(item.unifiedConfigId);
                }
                this.list.apiObjDelete.delete({id: ids.join(",")})
                .then(res => {
                    if(res.code === '00000') {
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
        table_edit(row) {
            this.saveDialogVisible = !0;
            this.$nextTick(() => {
                this.$refs.saveDialogRef.open(null == row ? 'add' : 'edit').setData(this.applications, this.profiles, row);
            })
        },
        async initial(){
            this.$API.unified.profile.profile.get().then(res => {
                if(res.code === '00000') {
                    this.profiles = res.data;
                    res.data.forEach(item => {
                        this.data[0].options.push({
                            label: item.unifiedProfileDesc,
                            value: item.unifiedProfileName
                        })
                    })
                }
            });
        
           this.$API.unified.profile.applications.get()
            .then(res1 => {
                if(res1.code === '00000') {
                    this.applications = res1.data;
                }
           })

        },
        submitFormUpdate(row, isRefresh) {
            this.list.apiObjSave.post(row || this.row ).then(res => {
                if(res.code === '00000') {
                    if(isRefresh !== 0) {
                        this.search();
                    }
                    this.visible = !1;
                    return 0;
                } 
                row.unifiedConfigStatus = row.unifiedConfigStatus == 0 ? 1 : 0;
                this.$message.error(res.msg);
            })
        },
        filterHandler(value, row, column) {
            const property = column['property']
            return row[property] === value
        },
        change(selected) {
            this.searchParams = selected;
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
