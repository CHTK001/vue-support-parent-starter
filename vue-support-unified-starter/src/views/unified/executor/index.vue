<template>
    <el-container>
        <el-header>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit(null)"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :initiSearch="false" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="unifiedAppname" ></el-table-column>
                <el-table-column label="执行器名称" prop="unifiedExecuterName" ></el-table-column>
                <el-table-column  label="执行器类型" prop="unifiedExecuterStatus">
                    <template #default="scope">
                        <el-tag>{{ scope.row.unifiedExecutorType == 1 ? '手动' : '自动' }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="创建时间" prop="createTime"  show-overflow-tooltip>
                    <template #default="scope">
                        <el-tag v-time="scope.row.createTime"></el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" fixed="right" align="right" width="260">
                    <template #default="scope">
                        <el-button-group v-if="!scope.row.configName?.startsWith('config-')">
                            <el-button  text type="primary" size="small" @click="table_view(scope.row, scope.$index)">预览</el-button>
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
import saveDialog from './save.vue'
import scSelectFilter from '@/components/scSelectFilter/index.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter, saveDialog
    },
    data() {
        return {
            saveDialogVisible: false,
            statusFilters: [
					{text: '启用', value: 0},
					{text: '禁用', value: 1}
				],
         
            visible: 0,
            searchParams: {},
            data: [
                {
                    title: "环境",
                    key: "configProfile",
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
                apiObj: this.$API.unified.executor.page,
                apiObjUpdate: this.$API.unified.executor.update,
                apiObjSave: this.$API.unified.executor.save,
                apiObjDelete: this.$API.unified.executor.delete,
            },
            selection: [],
        }
    },
    mounted(){
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
            this.list.apiObjDelete.delete({id: row.unifiedExecuterId}).then(res => {
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
						ids.push(item.configId);
					}
                    this.list.apiObjDelete.delete({configId: ids.join(",")})
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
                this.$refs.saveDialogRef.open(null == row ? 'add' : 'edit').setData(this.applications, this.profiles, row || {});
            })
        },
        table_view(row) {
            this.saveDialogVisible = !0;
            this.$nextTick(() => {
                this.$refs.saveDialogRef.open('view').setData(this.applications, this.profiles, row || {});
            })
        },
        submitFormUpdate(row) {
            this.list.apiObjSave.post(row || this.row ).then(res => {
                if(res.code === '00000') {
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
            this.$refs.table.reload(selected)
        }
    }
}
</script>

<style></style>
