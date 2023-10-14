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
				<el-table-column label="数据库名称" prop="dbcName" width="150" >
                    <template #default="scope">
                        <el-icon style="font-size: 20px; position: relative; top: 5px" :title="scope.row.dbcName">
                            <component :is="'sc-icon-' + scope.row.dbcName?.toLowerCase()" circle />
                        </el-icon>
                        <span>
                            {{ scope.row.dbcName }}
                        </span>
                    </template>
                </el-table-column>
				<el-table-column label="数据库类型" prop="dbcType" width="200"></el-table-column>
				<el-table-column label="数据文件类型" prop="dbcDatabase" width="150" />
				<el-table-column label="驱动" prop="dbcDriver" width="200" show-overflow-tooltip></el-table-column>
				<el-table-column label="驱动包地址" prop="dbcDriverUrl" show-overflow-tooltip>
                    <template #default="scope">
                        <span v-if="scope.row.dbcDriverUrl">{{ scope.row.dbcDriverUrl }}</span>
                        <span v-else>无</span>
                    </template>
                </el-table-column>
				<el-table-column label="控制台地址" prop="dbcConsoleUrl" show-overflow-tooltip></el-table-column>
				<el-table-column label="创建时间"  prop="createTime" width="180">
                    <template #default="scope">
                        <el-tag v-time="scope.row.createTime"></el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="更新时间"  prop="updateTime" width="180">
                    <template #default="scope">
                        <el-tag v-if="scope.row.updateTime" v-time="scope.row.updateTime"></el-tag>
                    </template>
                </el-table-column>
				<el-table-column label="操作" fixed="right" align="right" width="270">
					<template #default="scope">
						<el-button-group>
                            <el-button :loading="isSaveing[scope.row.dbcId]" v-if="scope.row.dbcStatus == 0" text icon="el-icon-circle-check" type="primary" size="small" @click="install(scope.row, scope.$index)">安装</el-button>
                            <el-button :loading="isSaveing[scope.row.dbcId]" v-if="scope.row.dbcStatus == 1" text icon="el-icon-remove" type="primary" size="small" @click="uninstall(scope.row, scope.$index)">卸载</el-button>
                            <el-button text icon="el-icon-view" type="primary" size="small" @click="table_show(scope.row, scope.$index)">查看</el-button>
							<el-button icon="el-icon-edit"  v-if="scope.row.genType !== 'SYSTEM'" text type="primary" size="small" @click="table_edit(scope.row)">编辑</el-button>
							<el-popconfirm v-if="scope.row.genType !== 'SYSTEM'" title="确定删除吗？" @confirm="table_del(scope.row, scope.$index)">
								<template #reference>
                                    <el-button icon="el-icon-delete" text type="primary" size="small">删除</el-button>
								</template>
							</el-popconfirm>
							<el-button :loading="isUploading[scope.row.dbcId]" icon="el-icon-upload"  v-if="!scope.row.dbcDriverUrl" text type="primary" size="small" @click="uploadDriver(scope.row)">上传驱动</el-button>
							<el-button :loading="isDownloading[scope.row.dbcId]" icon="el-icon-download"  v-if="!scope.row.dbcDriverUrl" text type="primary" size="small" @click="downloadDriver(scope.row)">下载驱动</el-button>
							<el-button  icon="el-icon-smoking"  v-if="scope.row.dbcDriverUrl" text type="primary" size="small" @click="clearDriver(scope.row)">清除驱动</el-button>
						</el-button-group>
					</template>
				</el-table-column>
			</scTable>
		</el-main>
    </el-container>
    <save-dialog v-if="dialog.save" ref="saveDialog" @success="handleSaveSuccess" @closed="dialog.save=false"></save-dialog>
    <upload-dialog v-if="dialog.upload" ref="uploadDialog" @success="handleSaveSuccess" @closed="dialog.upload=false"></upload-dialog>

</template>
<script>
import saveDialog from './save.vue'
import uploadDialog from './upload.vue'
export default {
    name: 'db',
    components: {
        saveDialog,uploadDialog
    },
    data() {
        return {
            isSaveing: {},
            isUploading: {},
            isDownloading: {},
            upload: false,
            dialog: {
                save: false,
                permission: false
            },
            apiObj: this.$API.gen.dbc.list,
            selection: [],
            search: {
                keyword: null
            }
        }
    },
    methods: {
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
        async install(row) {
            this.isSaveing[row.dbcId] = true;
            row.dbcStatus = 1;
            const res = await this.$API.gen.dbc.update.put(row);
            this.isSaveing[row.dbcId] = false;
            if (res.code != '00000') {
                row.dbcStatus = 0;
                this.$notify.error({ title: '提示', message: res.msg })
            }
        },
        async uninstall(row) {
            this.isSaveing[row.dbcId] = true;
            row.dbcStatus = 0;
            const res = await this.$API.gen.dbc.update.put(row);
            this.isSaveing[row.dbcId] = false;
            if (res.code != '00000') {
                row.dbcStatus = 1;
                this.$notify.error({ title: '提示', message: res.msg })
            }
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
        async downloadDriver(row) {
            this.isDownloading[row.dbcId] = true;
            this.$API.gen.dbc.download.get(row).then(res => {
                if(res.code != '00000'){
                    this.$message.error(res.msg);
                } else {
                    this.$message.success('下载成功');
                    row.dbcDriverUrl = res?.data?.dbcDriverUrl;
                }
            }).finally(() => {
                this.isDownloading[row.dbcId] = false;
            })
           
          
        },
        async clearDriver(row) {
            var res = await this.$API.gen.dbc.deleteFile.delete(row);
            if(res.code != '00000'){
                this.$message.error(res.msg);
            } else {
                this.$message.success('清除成功');
                row.dbcDriverUrl = null;
            }
        },

        async uploadDriver(row) {
            this.dialog.upload = true
            this.$nextTick(() => {
                this.$refs.uploadDialog.open('show').setData(row)
            })
        },
        //删除
        async table_del(row){
            var reqData = {id: row.dbcId}
            var res = await this.$API.gen.dbc.delete.delete(reqData);
            if(res.code == '00000'){
                this.$refs.table.refresh()
            }else{
                this.$notify.error({title: '提示', message : res.msg})
            }
        },
        //本地更新数据
        handleSaveSuccess(data, mode){
            this.$refs.table.refresh()
        }
    }
}
</script>