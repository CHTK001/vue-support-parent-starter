<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :rules="rules" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="角色名称" prop="roleName">
				<el-input v-model="form.roleName" clearable></el-input>
			</el-form-item>
			<el-form-item label="角色编码" prop="roleCode">
				<el-input v-model="form.roleCode" clearable></el-input>
			</el-form-item>
			<el-form-item label="排序" prop="roleSort">
				<el-input-number v-model="form.roleSort" controls-position="right" :min="1" style="width: 100%;"></el-input-number>
			</el-form-item>
			<el-form-item label="是否有效" prop="roleStatus">
				<el-switch v-model="form.roleStatus" :active-value="1" :inactive-value="0"></el-switch>
			</el-form-item>
		</el-form>
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
					add: '新增',
					edit: '编辑',
					show: '查看'
				},
				visible: false,
				isSaveing: false,
				//表单数据
				form: {
					roleId:"",
					roleName: "",
					roleCode: "",
					roleSort: 1,
					roleStatus: 1,
				},
				//验证规则
				rules: {
					roleSort: [
						{required: true, message: '请输入排序', trigger: 'change'}
					],
					roleName: [
						{required: true, message: '请输入角色名称'}
					],
					roleCode: [
						{required: true, message: '请输入角色编码'}
					]
				}
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
						if(this.mode === 'add') {
							res = await this.$API.system.role.save.post(this.form);
						} else if(this.mode === 'edit') {
							res = await this.$API.system.role.update.put(this.form);
						}
						
						this.isSaveing = false;
						if(res.code == '00000'){
							this.form.roleId = this.form.rowId || res.data.roleId;
							this.$emit('success', this.form, this.mode)
							this.visible = false;
							this.$notify.success({title: '提示', message : "操作成功"})
						}else{
							this.$notify.error({title: '提示', message : res.msg})
						}
					}
				})
			},
			//表单注入数据
			setData(data){
				this.form.roleId = data.roleId
				this.form.roleName = data.roleName
				this.form.roleCode = data.roleCode
				this.form.roleSort = data.roleSort
				this.form.roleStatus = data.roleStatus

				//可以和上面一样单个注入，也可以像下面一样直接合并进去
				//Object.assign(this.form, data)
			}
		}
	}
</script>

<style>
</style>
