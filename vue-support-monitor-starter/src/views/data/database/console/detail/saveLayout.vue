<template>
	<div class="relative">
		<div class="f-right">
			<el-button  v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()" icon="sc-icon-save"></el-button>
		</div>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="数据库名称" prop="genName">
				<el-input v-model="form.genName" clearable placeholder="请输入数据库名称"></el-input>
			</el-form-item>
	
			<el-form-item label="访问地址" prop="genHost">
				<el-col :span="18" prop="genHost">
					<el-input v-model="form.genHost" placeholder="请输入访问地址" />
				</el-col>
				<el-col :span="6" prop="genPort">
					<el-input v-model="form.genPort" type="number" placeholder="请输入端口"></el-input>
				</el-col>
			</el-form-item>
	
			<el-form-item label="访问账号" prop="genUser">
				<el-input v-model="form.genUser" clearable placeholder="请输入访问账号"></el-input>
			</el-form-item>
	
			<el-form-item label="访问密码" prop="genPassword" style="position: relative;">
				<el-input v-model="form.genPassword" type="password" clearable show-password placeholder="请输入访问密码"> </el-input>
				<el-icon @click="() => {delete form.genPassword;$message.success('删除成功')}" style="cursor: pointer; position: absolute; left: -15px" title="删除密码">
					<component is="el-icon-delete" />
				</el-icon>
			</el-form-item>
			
			<el-form-item label="数据库名称" prop="genDatabase">
				<el-input v-model="form.genDatabase" clearable placeholder="请输入数据库名称"></el-input>
			</el-form-item>
			<el-form-item label="数据库驱动" prop="genDriver">
				<el-input v-model="form.genDriver" clearable placeholder="请输入数据库名称, 例如: com.mysql.cj.jdbc.Driver"></el-input>
			</el-form-item>
	
			<el-form-item label="数据库说明" prop="genDesc" >
				<el-input v-model="form.genDesc" clearable placeholder="请输入数据库说明"></el-input>
			</el-form-item>
	
		</el-form>
	</div>
</template>

<script>
export default {
	emits: ['success', 'closed'],
	props: {
		form: { type: Object, default: () => ({}) },
		mode: { type: String, default: 'add' },
	},
	data() {
		return {
			isSaveing: false,
			//验证规则
			rules: {
				genName: [
					{ required: true, message: '请输入数据库名称' }
				],
				genHost: [
					{ required: true, message: '请输入访问地址' }
				],
				genDriver: [
					{ required: true, message: '请选择数据库驱动' }
				],
				genType: [
					{ required: true, message: '请选择数据库类型' }],
				genUser: [
					{ required: true, message: '请输入访问账号' }
				],
				genDatabase: [
					{ required: true, message: '请输入数据库名称' }
				],
			},
		}
	},
	mounted() {
	},
	methods: {
		//表单提交方法
		submit() {
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					const _v = this.$TOOL.string.getRandomString(16);
					var auth  = {};
					var newPassword;
					if(this.form.genPassword) {
						newPassword = this.$TOOL.crypto.BASE64.encrypt(
								this.$TOOL.crypto.sm4.encrypt(this.form.genPassword, _v)
								) 
								this.form.genUid = _v;
					}
					auth = Object.assign(this.form, auth);
					auth = Object.assign(auth, this.fileForm);
					auth.genType = 'JDBC';
					auth.genPassword = newPassword;
					if (this.mode === 'add') {
						res = await this.$API.gen.database.save.post(auth);
					} else if (this.mode === 'edit') {
						res = await this.$API.gen.database.update.put(auth);
					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.genId = this.form.genId || res.data.genId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
						delete this.form.genPassword;
					} else {
						this.$message.error(res.msg )
					}
				}
			})
		},
	}
}
</script>

<style></style>
