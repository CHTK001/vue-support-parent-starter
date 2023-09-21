<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" width="70%" destroy-on-close @closed="$emit('closed')" draggable>
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
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
		</template>
	</el-dialog>
</template>

<script>
	export default {
		emits: ['success', 'closed'],
		data() {
			return {
				mode: "add",
				titleMap: {
					add: '导入',
					edit: '编辑',
					show: '查看'
				},
				visible: false,
				isSaveing: false,
				//表单数据
				form: {
				},
                apiObj: this.$API.gen.table.table
			}
		},
		mounted() {

		},
		methods: {
			//显示
			open(mode='add'){
				this.mode = mode;
				this.visible = true;
				return this
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate(async (valid) => {
					if (valid) {
						this.isSaveing = true;
						var res = {};
						const _v = this.$TOOL.string.getRandomString(16);
						var auth = {genPassword: this.$TOOL.crypto.BASE64.encrypt(this.$TOOL.crypto.AES.encrypt(JSON.stringify(this.form.genPassword), _v))}
						this.form.genUid = _v;
						auth = Object.assign(auth, this.form);
						if(this.mode === 'add') {
							res = await this.$API.gen.database.save.post(auth);
						} else if(this.mode === 'edit') {
							res = await this.$API.gen.database.update.put(auth);
						}
						
						this.isSaveing = false;
						if(res.code == '00000'){
							this.form.genId = this.form.genId || res.data.genId;
							this.$emit('success', this.form, this.mode)
							this.visible = false;
							delete this.form.genPassword;
							this.$notify.success({title: '提示', message : "操作成功"})
						}else{
							this.$notify.error({title: '提示', message : res.msg})
						}
					}
				})
			},
			//表单注入数据
			setData(data){
				//可以和上面一样单个注入，也可以像下面一样直接合并进去
				Object.assign(this.form, data);
                this.$nextTick(() => {
                    this.$refs.table.reload(this.form)
                })
			}
		}
	}
</script>

<style>
</style>
