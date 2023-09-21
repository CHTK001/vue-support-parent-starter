<template>
 <el-container>
		<el-header>
			<div class="left-panel">
                <el-button type="primary" icon="el-icon-download" @click="importColumn"></el-button>
                <el-button type="primary" icon="el-icon-refresh" @click="refresh"></el-button>
			</div>
			<div class="right-panel">
                <div class="right-panel-search">
					<el-input v-model="form.keyword" placeholder="表名" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
			<scTable ref="table1" :apiObj="apiObj" row-key="id"  @selection-change="selectionChange" stripe>
				<el-table-column label="#" type="index" width="50"></el-table-column>
				<el-table-column label="数据源名称" prop="genName" width="150" />
				<el-table-column label="表名" prop="tabName" width="200"></el-table-column>
				<el-table-column label="描述" prop="tabDesc" width="80"></el-table-column>
				<el-table-column label="类名" prop="tabClassName" show-overflow-tooltip></el-table-column>
				<el-table-column label="操作" fixed="right" align="right" width="170">
					<template #default="scope">
						<el-button-group>
                            <el-button text type="primary" size="small" @click="table_show(scope.row, scope.$index)">查看</el-button>
							<el-button  v-if="scope.row.genType !== 'SYSTEM'" text type="primary" size="small" @click="table_edit(scope.row)">编辑</el-button>
							<el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
								<template #reference>
                                    <el-button text type="primary" size="small">删除</el-button>
								</template>
							</el-popconfirm>
                            <el-button text type="primary" size="small" @click="console(scope.row, scope.$index)">控制台</el-button>
						</el-button-group>
					</template>
				</el-table-column>
			</scTable>
		</el-main>
    </el-container>

    <el-dialog title="导入" v-model="dialogTableImport" :close-on-click-modal="false" width="70%" destroy-on-close @closed="$emit('closed')" draggable>
        <scTable ref="table" :pageSize="10" :apiObj="tableApi" :params="form" row-key="id" @selection-change="selectionImportChange"  stripe>
            <el-table-column type="selection" width="50"></el-table-column>
            <el-table-column label="#" type="index" width="50"></el-table-column>
            <el-table-column label="数据库" prop="database" width="150" />
            <el-table-column label="表名" prop="tableName" width="350" />
            <el-table-column label="描述" prop="remark" width="200"></el-table-column>
        </scTable>
		<template #footer>
			<el-button @click="dialogTableImport=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="importing" @click="submitImport()">导入</el-button>
		</template>
	</el-dialog>
</template>

<script>
export default {
    name: 'console',
    components:{
    },
    data(){
        return {
            importing: 0,
            dialogTableImport: 0,
            form: {
                genId: null,
                genName: null,
                dataSourceName: null
            },
            apiObj: this.$API.gen.table.list,
            tableApi: this.$API.gen.table.table,
            importColumnApi: this.$API.gen.table.importColumn,
            selectionImport: []
        }
    },
    mounted(){
        this.form.genId = this.$route.params.genId;
        this.form.genName = this.$route.params.genName;
        this.form.dataSourceName = this.$route.params.genName;
    },
    methods: {
         //删除
         async table_del(row){
            var reqData = {tableId: row.tabId}
            var res = await this.$API.gen.table.delete.delete(reqData);
            if(res.code == '00000'){
                this.$refs.table1.refresh()
                this.$notify.success({title: '提示', message : "操作成功"})
            }else{
                this.$notify.error({title: '提示', message : res.msg})
            }
        },
         async refresh(){
            this.$refs.table1.refresh()
        },
        async submitImport() {
            if(!this.selectionImport || this.selectionImport.length == 0) {
                this.$message.error("请选择表")
                return;
            }
            this.importing = !0;
            this.form.tableName = [];
            for(const item of this.selectionImport) {
                this.form.tableName.push(item.tableName);
            }
            const res = await this.importColumnApi.imports(this.form);
            if(res.code == '00000'){
                this.dialogTableImport = false;
                this.$notify.success({title: '提示', message : "导入成功"})
                this.$refs.table1.refresh();
            }else{
                this.$notify.error({title: '提示', message : res.msg})
            }
        },
        //表格选择后回调事件
        selectionImportChange(selection){
            this.selectionImport = selection;
        },
        importColumn() {
            this.importing = 0;
            this.dialogTableImport = true
        }
    }
}
</script>