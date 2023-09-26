<template>
    <el-container>
		<el-header>
			<div class="left-panel">
                <el-button type="primary" icon="el-icon-plus" @click="add"></el-button>
				<el-button type="primary" icon="el-icon-refresh" @click="refresh"></el-button>
			</div>
			<div class="right-panel">
                
			</div>
		</el-header>
		<el-main class="nopadding">
			<scTable ref="table" :apiObj="apiObj" row-key="id"   stripe>
				<el-table-column label="#" type="index" width="50"></el-table-column>
				<el-table-column label="数据源类型" prop="genType" width="200"></el-table-column>
				<el-table-column label="数据库名称" prop="genDatabase" width="150" />
				<el-table-column label="数据源名称" prop="genName" width="150" />
				<el-table-column label="账号" prop="genUser" width="80"></el-table-column>
				<el-table-column label="URL" prop="genUrl" show-overflow-tooltip></el-table-column>
				<el-table-column label="创建时间"  prop="createTime" width="180">
                    <template #default="scope">
                        <el-tag v-time="scope.row.createTime"></el-tag>
                    </template>
                </el-table-column>
				<el-table-column label="操作" fixed="right" align="right" width="270">
					<template #default="scope">
						<el-button-group>
                            <el-button text icon="el-icon-view" type="primary" size="small" @click="table_show(scope.row, scope.$index)">查看</el-button>
							<el-button icon="el-icon-edit"  v-if="scope.row.genType !== 'SYSTEM'" text type="primary" size="small" @click="table_edit(scope.row)">编辑</el-button>
                            <el-button text icon="el-icon-warning" type="primary" size="small" @click="openLog(scope.row)">日志</el-button>
							<el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
								<template #reference>
                                    <el-button icon="el-icon-delete" text type="primary" size="small">删除</el-button>
								</template>
							</el-popconfirm>
                            <el-button text type="primary" icon="el-icon-box" size="small" @click="console(scope.row, scope.$index)">控制台</el-button>
						</el-button-group>
					</template>
				</el-table-column>
			</scTable>
		</el-main>
    </el-container>
    <save-dialog v-if="dialog.save" ref="saveDialog" @success="handleSaveSuccess" @closed="dialog.save=false"></save-dialog>
</template>
<script>
import saveDialog from './save.vue'
export default {
    name: 'db',
    components: {
        saveDialog
    },
    data() {
        return {
            dialog: {
                save: false,
                permission: false
            },
            apiObj: this.$API.gen.database.list,
            selection: [],
            search: {
                keyword: null
            }
        }
    },
    methods: {
        console(row) {
            this.$router.push({ path: '/console/' +  row.genId});
        },
        openLog(row){
            this.$router.push({ path: '/console/log/' +  row.tabId + "/" + row.genId});
        },
        //添加
        add(){
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open()
            })
        },
        refresh(){
            this.$refs.table.refresh()
        },
        table_show(row){
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open('show').setData(row)
            })
        },
        //编辑
        table_edit(row){
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(row)
            })
        },
        //删除
        async table_del(row){
            var reqData = {id: row.genId}
            var res = await this.$API.gen.database.delete.delete(reqData);
            if(res.code == '00000'){
                this.$refs.table.refresh()
            }else{
                this.$notify.error({title: '提示', message : res.msg})
            }
        },
        //本地更新数据
        handleSaveSuccess(data, mode){
            if(mode=='add'){
                this.$refs.table.refresh()
            }else if(mode=='edit'){
                this.$refs.table.refresh()
            }
        }
    }
}
</script>