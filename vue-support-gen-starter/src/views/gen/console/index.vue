<template>
 <el-container>
		<el-header>
			<div class="left-panel">
                <el-button type="primary" icon="el-icon-download" @click="importColumn"></el-button>
			</div>
			<div class="right-panel">
                <div class="right-panel-search">
					<el-input v-model="form.keyword" placeholder="表名" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="upsearch"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
			<scTable ref="table" :apiObj="apiObj" row-key="id"  @selection-change="selectionChange" stripe>
				<el-table-column label="#" type="index" width="50"></el-table-column>
				<el-table-column label="数据源名称" prop="genName" width="150" />
				<el-table-column label="数据源类型" prop="genType" width="200"></el-table-column>
				<el-table-column label="账号" prop="genUser" width="80"></el-table-column>
				<el-table-column label="URL" prop="genUrl" show-overflow-tooltip></el-table-column>
				<el-table-column label="创建时间" prop="createTime" width="180"></el-table-column>
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
import tableImport from './tableImport.vue'
export default {
    name: 'console',
    components:{
        tableImport
    },
    data(){
        return {
            importing: 0,
            dialogTableImport: 0,
            form: {
                genId: null,
                genName: null,
            },
            apiObj: this.$API.gen.table.list,
            tableApi: this.$API.gen.table.table,
            selectionImport: []
        }
    },
    mounted(){
        this.form.genId = this.$route.params.genId;
        this.form.genName = this.$route.params.genName;
    },
    methods: {
        submitImport() {
            this.importing = !0;
            debugger
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