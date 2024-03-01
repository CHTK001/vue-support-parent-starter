<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="项目名称" prop="projectName">
				<el-input v-model="form.projectName" clearable placeholder="请输入项目名称"></el-input>
			</el-form-item>
			<el-form-item label="项目路径" prop="projectProjectPath">
				<el-input v-model="form.projectProjectPath" clearable placeholder="请输入项目路径"></el-input>
			</el-form-item>

			<el-form-item label="项目地址">
				<el-col :span="18" prop="projectControlHost">
					<el-input v-model="form.projectControlHost" placeholder="请输入访问地址" />
				</el-col>
				<el-col :span="6" prop="projectControlPort">
					<el-input v-model="form.projectControlPort" type="number" placeholder="请输入端口"></el-input>
				</el-col>
			</el-form-item>

			<el-form-item label="访问账号" prop="projectControlUser">
				<el-input v-model="form.projectControlUser" clearable placeholder="请输入访问账号"></el-input>
			</el-form-item>

			<el-form-item label="访问密码" prop="projectControlPassword" style="position: relative;" v-if="!form.projectId">
				<el-input v-model="form.projectControlPassword" type="password" clearable show-password placeholder="请输入访问密码"> </el-input>
				<el-icon @click="() => {delete form.projectControlPassword;$message.success('删除成功')}" style="cursor: pointer; position: absolute; right: -15px" title="删除密码">
					<component is="el-icon-delete" />
				</el-icon>
			</el-form-item>


			<el-form-item label="访问密码" style="position: relative;" v-else>
				<el-input v-model="form.projectControlPassword" type="password" clearable show-password placeholder="请输入访问密码"> </el-input>
				<el-icon @click="() => {delete form.projectControlPassword;$message.success('删除成功')}" style="cursor: pointer; position: absolute; right: -15px" title="删除密码">
					<component is="el-icon-delete" />
				</el-icon>
			</el-form-item>


			<el-form-item label="项目说明" prop="projectDesc" >
				<el-input v-model="form.projectDesc" clearable placeholder="请输入项目说明"></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
		</template>
	</el-dialog>
</template>

<script>
import pinyin from 'js-pinyin'

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			visible: false,
			isSaveing: false,
			configList: [],
			title: '',
			mode: '',
			//表单数据
			form: {
				projectControlPort: 22
			},
			//验证规则
			rules: {
				projectName: [
					{ required: true, message: '请输入项目名称', trigger: 'blur' }
				],
				projectProjectPath: [
					{ required: true, message: '请输入项目路径', trigger: 'blur' }
				],
				projectControlHost: [
					{ required: true, message: '请输入访问地址', trigger: 'blur' }
				],
				projectControlPort: [
					{ required: true, message: '请输入端口', trigger: 'blur' }
				],
				projectControlUser: [
					{ required: true, message: '请输入访问账号', trigger: 'blur' }
				],
				projectControlPassword: [
					{ required: true, message: '请输入访问密码', trigger: 'blur' }
				],

			},
		}
	},
	mounted() {
	},
	methods: {
		//显示
		open(mode = 'add') {
			this.mode = mode;
			if(mode == 'add') {
				this.title = '新增';
			}
			this.isSaveing = false;
			this.visible = true;
			return this
		},
		//表单提交方法
		submit() {
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					const _v = this.$TOOL.string.getRandomString(16);
					var auth  = {};
					var newPassword;
					if(this.form.projectControlPassword) {
						newPassword = this.$TOOL.crypto.BASE64.encrypt(
								this.$TOOL.crypto.sm4.encrypt(this.form.projectControlPassword, _v)
								) 
								this.form.projectControlUid = _v;
					}
					auth = Object.assign(auth, this.form);
					auth = Object.assign(auth, this.fileForm);
					auth.projectControlPassword = newPassword;
					if (this.mode === 'add') {
						res = await this.$API.gen.project.save.handler(auth);
					} else if (this.mode === 'edit') {
						res = await this.$API.gen.project.update.handler(auth);
					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.genId = this.form.projectId || res.data.projectId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
						delete this.form.projectControlPassword;
					} else {
						this.$message.error(res.msg )
					}
				}
			})
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			if(this.mode == 'edit') {
				this.title = '修改' + this.form.projectName;
				this.form.projectControlPassword = 
								this.$TOOL.crypto.AES.decrypt( this.$TOOL.crypto.BASE64.decrypt(this.form.projectControlPassword), this.form.projectControlUid)
				return;
			}

			if(this.mode == 'add') {
				this.form = {};
				this.form.projectControlPort = 22;
				this.form.projectControlHost = '127.0.0.1';
			}
		}
	}
}
</script>

<style></style>
