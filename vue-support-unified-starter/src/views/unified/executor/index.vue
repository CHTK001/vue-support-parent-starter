<template>
    <el-container>
        <el-header>
            <div class="right-panel">
                <el-button type="primary" icon="el-icon-search" @click="search"></el-button>
                <el-button type="primary" icon="el-icon-plus" @click="table_edit({})"></el-button>
                <el-button type="danger" plain icon="el-icon-delete" :disabled="selection.length==0" @click="batch_del"></el-button>
            </div>
        </el-header>
        <el-main class="nopadding">
            <scTable ref="table" :initiSearch="false" :apiObj="list.apiObj" row-key="id" stripe @selection-change="selectionChange">
                <el-table-column type="selection" width="50"></el-table-column>
                <el-table-column label="应用名称" prop="unifiedAppname" width="150"></el-table-column>
                <el-table-column label="执行器名称" prop="unifiedExecuterName" ></el-table-column>
                <el-table-column  label="注入类型" prop="unifiedExecuterStatus" width="150" :filters="statusFilters" :filter-method="filterHandler">
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

    <el-dialog draggable v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item v-show="false" label="索引" prop="unifiedExecutorName">
				<el-input v-model="row.unifiedExecutorId" clearable></el-input>
			</el-form-item>
			<el-form-item label="环境" prop="unifiedExecutorProfile">
                <el-select allow-create	filterable v-model="row.unifiedExecutorProfile">
                    <el-option v-for="it in profiles" :label="it.unifiedProfileDesc" :value="it.unifiedProfileName"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item v-if="!row.unifiedExecutorId" label="应用名称" prop="unifiedExecutorAppname">
                <el-select allow-create	filterable v-model="row.unifiedExecutorAppname">
                    <el-option v-for="it in applications" :label="it.unifiedProfileDesc" :value="it.unifiedProfileName"></el-option>
                </el-select>
			</el-form-item>
			<el-form-item  label="配置名称" prop="unifiedExecutorName">
				<el-input  v-model="row.unifiedExecutorName" clearable></el-input>
			</el-form-item>
            <el-form-item label="配置值" prop="unifiedExecutorValue">
				<el-input v-model="row.unifiedExecutorValue" clearable></el-input>
			</el-form-item>
            <el-form-item label="描述" prop="unifiedExecutorDesc">
				<el-input v-model="row.unifiedExecutorValue" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submitFormUpdate()">保 存</el-button>
		</template>
	</el-dialog>
</template>

<script>
import scSelectFilter from '@/components/scSelectFilter/index.vue'
export default {
    name: 'tableBase',
    components: {
        scSelectFilter
    },
    data() {
        return {
            statusFilters: [
					{text: '启用', value: 0},
					{text: '禁用', value: 1}
				],
            form: {
                mapMethod: []
            },
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
            this.list.apiObjDelete.delete({id: row.unifiedExecutorId}).then(res => {
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
            this.visible = !0;
            this.row = row;
            delete this.row.disable;
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
