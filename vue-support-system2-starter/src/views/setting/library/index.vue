<template>
    <el-container>
		<el-container class="is-vertical">
			<el-header>
				<div class="left-panel">
					<el-button type="primary" icon="el-icon-plus" @click="addLibrary" size="small"></el-button>
				</div>
			</el-header>
			<el-main class="nopadding">
                <scTable ref="table" :apiObj="apiObj">
                    <el-table-column label="序号" type="index"  show-overflow-tooltip />
                    <el-table-column label="库名" prop="libName"  show-overflow-tooltip width="100"/>
                    <el-table-column label="库类型" prop="libType"  show-overflow-tooltip width="100">
                        <template #default="scope">
                            <el-tag v-if="scope.row.libType === 'FACE'">人脸</el-tag>
                            <el-tag v-else-if="scope.row.libType === 'IMAGE'">图像</el-tag>
                            <el-tag v-else>其它</el-tag>
                        </template>
                    </el-table-column>
                    <el-table-column label="库描述" prop="libMarker"  show-overflow-tooltip width="300"/>

                	<el-table-column label="操作" fixed="right" align="right" width="170">
                        <template #default="scope">
                            <el-button-group>
                                <el-button text type="primary" size="small" @click="showLibrary(scope.row, scope.$index)">查看</el-button>
                                <el-button v-auth="'sys:user:edit'" text type="primary" size="small" @click="mappings(scope.row, scope.$index)">mappings</el-button>
                                <el-button v-auth="'sys:user:edit'" text type="primary" size="small" @click="table_edit(scope.row, scope.$index)">编辑</el-button>
                                <el-popconfirm  v-auth="'sys:user:del'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
                                    <template #reference>
                                        <el-button  v-auth="'sys:user:del'" text type="primary" size="small">删除</el-button>
                                    </template>
                                </el-popconfirm>
                            </el-button-group>
                        </template>
                    </el-table-column>
                </scTable>
			</el-main>
		</el-container>
	</el-container>
    <library-save v-if="dialog.save" ref="saveDialog" @success="handleSaveSuccess" @closed="dialog.save=false"></library-save>
    <mapping v-if="dialog.mapping" ref="saveMappingDialog" @success="handleMappingSaveSuccess" @closed="dialog.mapping=false"></mapping>
</template>
<script>
import LibrarySave from './save.vue'
import Mapping from './mappings.vue'
export default {
    name: 'Library',
    components:{
        LibrarySave,
        Mapping
    },
    data() {
        return {
            dialog: {
                save: false,
                mapping: false
            },
            apiObj: this.$API.system.library.page
        }
    },
    methods:{
        /**查看库 */
        showLibrary(row) {
            this.$router.push({ path: '/learning/library/' + row.libName + '/' + row.libType });
        },
        //删除
        async table_del(row){
            var reqData = {libId: row.libId}
            var res = await this.$API.system.library.delete.delete(reqData);
            if(res.code == '00000'){
                this.$refs.table.refresh()
                this.$notify.success({title: '提示', message : "操作成功"})
            }else{
                this.$notify.error({title: '提示', message : res.msg})
            }
        },
        //新增
        addLibrary(row){
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open('add').setData(row)
            })
        },
        handleMappingSaveSuccess(){
            
        },
        /**mappings */
        mappings(row) {
            this.dialog.mapping = true
            this.$nextTick(() => {
                this.$refs.saveMappingDialog.open('update').setData(row)
            })
        },
        //查看
        table_edit(row){
            this.dialog.save = true
            this.$nextTick(() => {
                this.$refs.saveDialog.open('edit').setData(row)
            })
        },
        /**添加/修改回调 */
        handleSaveSuccess(data, mode) {
            if(mode=='add'){
                this.$refs.table.refresh()
            }else if(mode=='edit'){
                this.$refs.table.refresh()
            }
        }
    }
}
</script>