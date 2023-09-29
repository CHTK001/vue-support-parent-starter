<template>
 <el-container>
		<el-header>
			<div class="left-panel">
                <el-button type="primary" icon="el-icon-refresh" @click="importColumn">导入</el-button>
                <el-button plain type="primary" icon="el-icon-download" @click="openGen(null, false)">生成</el-button>
                <el-button type="danger" icon="el-icon-delete" @click="batchDelete"></el-button>
			</div>
			<div class="right-panel">
                <div class="right-panel-search">
					<el-input v-model="form.keyword" placeholder="表名" clearable></el-input>
					<el-button type="primary" icon="el-icon-search" @click="refresh"></el-button>
				</div>
			</div>
		</el-header>
		<el-main class="nopadding">
			<scTable ref="table1" :params="form" :apiObj="apiObj" row-key="id"  @selection-change="selectionChange" stripe>
                <el-table-column type="selection" width="50"></el-table-column>
				<el-table-column label="#" type="index" width="50"></el-table-column>
				<el-table-column label="数据源名称" prop="genType" width="150" />
				<el-table-column label="表名" prop="tabName" width="200"></el-table-column>
				<el-table-column label="实体" prop="tabClassName" ></el-table-column>
                <el-table-column label="业务名" prop="tabBusinessName" ></el-table-column>
                <el-table-column label="模块名" prop="tabModuleName" ></el-table-column>
                <el-table-column label="描述" prop="tabDesc" ></el-table-column>
                <el-table-column label="备注" prop="tabRemark" ></el-table-column>
				<el-table-column label="操作" fixed="right" width="370">
					<template #default="scope">
						<el-button-group>
                            <el-button text icon="el-icon-view" type="primary" size="small" @click="openView(scope.row, false)">预览</el-button>
                            <el-button text icon="el-icon-edit" type="primary" size="small" @click="openEdit(scope.row, false)">编辑</el-button>
							<el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
								<template #reference>
                                    <el-button icon="el-icon-delete" text type="primary" size="small">删除</el-button>
								</template>
							</el-popconfirm>
                            <el-button text icon="el-icon-refresh" type="primary" size="small" @click="openSync(scope.row, false)">同步</el-button>
                            <el-button text icon="el-icon-office-building" type="primary" size="small" @click="openGen(scope.row, false)">生成代码</el-button>
                            <el-button text icon="el-icon-download" type="primary" size="small" @click="openDownFile(scope.row)">下载</el-button>
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
			<el-button :modelValue="mode" type="primary" :loading="importing" @click="submitImport()">导入</el-button>
		</template>
	</el-dialog>

    <import-code ref="importCodeRef" :v-model="importCodeStatus"></import-code>
    <view-code ref="viewCodeRef" :v-model="viewCodeStatus"></view-code>
</template>

<script>
import { downLoadZip } from '@/utils/zipdownload'
import { thumbProps } from 'element-plus'
import importCode from './importCode.vue'
import viewCode from './view.vue'
export default {
    name: 'console',
    components:{
        importCode, viewCode
    },
    data(){
        return {
            mode: false,
            viewCodeStatus: false,
            importCodeStatus: false,
            importing: 0,
            dialogTableImport: false,
            form: {
                genId: undefined,
            },
            apiObj: this.$API.gen.table.list,
            tableApi: this.$API.gen.table.table,
            importColumnApi: this.$API.gen.table.importColumn,
            selectionImport: [],
            selection:[],
            downloadForm: {},
        }
    },
    created(){
        this.form.genId = this.$route.params.genId;
        if(!this.form.genId || this.form.genId === 'null') {
            delete  this.form.genId;
        }
    },
    methods: {
      
        openEdit(row){
            this.$router.push({ path: '/ext/console/edit/' +  row.tabId + "/" + row.genId});
        },
        async openSync(row){
            const _this = this;
            const tableName = row.tabName
            this.$confirm('确认要强制同步"' + tableName + '"表结构吗？', '警告', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(function () {
                return _this.$API.gen.table.sync.get({tabId: row.tabId})
            }).then(() => {
                _this.msgSuccess('同步成功')
            }).catch(() => {})
        },
        batchDelete(){
            if(!this.selection || this.selection.length == 0) {
                this.$message.error("请选择表")
                return;
            }
            const tableName = [];
            for(const item of this.selection) {
                tableName.push(item.tabId);
            }
            this.table_del({tabId: tableName.join(",")});
        },
        openDownFile(row) {
            this.openGen(row, true);
            downLoadZip(this.$API.gen.table.batchGenCode.url, this.downloadForm, 'code')
        },
        openView(row) {
            this.viewCodeStatus = true;
            this.$refs.viewCodeRef.open(row)

        },
        openGen(row, noOpen) {
            this.downloadForm = {};
            var tabIds = null;
            const tabNames = [];
            if(row) {
                tabIds = row.tabId;
                tabNames.push(row.tabName)
            } else {
                if(!this.selection || this.selection.length == 0) {
                    this.$message.error("请选择表")
                    return;
                } else {
                    const tableName = [];
                    for(const item of this.selection) {
                        tableName.push(item.tabId);
                        tabNames.push(item.tabName)
                    }
                    tabIds = tableName.join(",");
                }
            }
            this.downloadForm["tabIds"] = tabIds;
            this.downloadForm['tableNames'] = tabNames;
            console.log(this.downloadForm);
            if(!noOpen) {
                this.$refs.importCodeRef.open(this.downloadForm)
            }
        },
      
         //删除
         async table_del(row){
            var reqData = {tableId: row.tabId}
            var res = await this.$API.gen.table.delete.delete(reqData);
            if(res.code == '00000'){
                this.$refs.table1.refresh()
            }else{
                this.$notify.error({title: '提示', message : res.msg})
            }
        },
         async refresh(){
            this.$refs.table1.reload(this.form)
        },
        async submitImport() {
            if(!this.selectionImport || this.selectionImport.length == 0) {
                this.$message.error("请选择表")
                return;
            }
            this.importing = !0;
            var tableName = [];
            for(const item of this.selectionImport) {
                tableName.push(item.tableName);
            }
            const tpl = {};
            Object.assign(tpl, this.form);
            tpl['tableName'] = tableName;
            const res = await this.importColumnApi.imports(tpl);
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
        //批量生成
        selectionChange(selection){
            this.selection = selection;
        },
        importColumn() {
            this.active = 0;
            this.importing = 0;
            this.dialogTableImport = true
        }
    }
}
</script>