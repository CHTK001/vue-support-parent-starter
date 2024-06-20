<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">


			<el-form-item label="终端名称" prop="terminalName">
				<el-input v-model="form.terminalName" clearable placeholder="请输入终端名称"></el-input>
			</el-form-item>

			<el-form-item label="终端地址" prop="terminal">
				<el-row>
					<el-col :span="12">
						<el-input v-model="form.terminalHost" placeholder="请输入终端地址"></el-input>
					</el-col>
					<el-col :span="12">
						<el-input v-model="form.terminalPort" type="number" placeholder="请输入终端端口"></el-input>
					</el-col>
				</el-row>
			</el-form-item>

			<el-form-item label="终端账号" prop="terminalUser">
				<el-input v-model="form.terminalUser" clearable placeholder="请输入终端名称"></el-input>
			</el-form-item>

			<el-form-item label="终端密码" prop="terminalPassword">
				<el-input v-model="form.terminalPassword" clearable placeholder="请输入终端名称" type="password" show-password></el-input>
			</el-form-item>


			<el-form-item label="说明" prop="terminalDesc">
				<el-input v-model="form.terminalDesc" clearable placeholder="请输入说明"></el-input>
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
				terminalHost: '127.0.0.1',
				terminalPort: '22'
			},
			//验证规则
			rules: {
				terminalName: [
					{ required: true, message: '请输入终端名称', trigger: 'blur' }
				],
				terminalPort: [
					{ required: true, message: '请输入端口', trigger: 'blur' }
				],
				terminalHost: [
					{ required: true, message: '请输入地址', trigger: 'blur' }
				],
				terminalUser: [
					{ required: true, message: '请输入账号', trigger: 'blur' }
				],
				terminalPassword: [
					{ required: true, message: '请输入密码', trigger: 'blur' }
				]
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
			this.visible = true;
			return this
		},
		//表单提交方法
		submit() {
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					var res;
					this.isSaveing = true;
					if (this.mode === 'add') {
						res = await this.$API.terminal.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.terminal.update.put(this.form);
					}
					

					this.isSaveing = false;
					if (res.code == '00000') {
						this.$emit('success', res, this.mode)
						this.visible = false;
					} else {
						this.$message.error(res.msg)
					}
				}
			})
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			this.isSaveing = false;
			Object.assign(this.form, data);
			if(this.mode == 'edit') {
				this.title = '修改' + this.form.terminalName;
				return;
			}
			
			if(this.mode == 'add') {
				this.form = {};
				this.form.terminalHost = '127.0.0.1';
				this.form.terminalPort = '22';
			}
		}
	}
}
</script>

<style></style>
