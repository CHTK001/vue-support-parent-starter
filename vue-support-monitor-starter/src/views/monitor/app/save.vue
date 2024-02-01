<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">


			<el-form-item label="应用名称" prop="monitorAppname">
				<el-input v-model="form.monitorAppname" clearable placeholder="请输入应用名称"></el-input>
			</el-form-item>

			<el-form-item label="说明" prop="monitorName">
				<el-input v-model="form.monitorName" clearable placeholder="请输入说明"></el-input>
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
			},
			//验证规则
			rules: {
				monitorAppname: [
					{ required: true, message: '请输入应用名称', trigger: 'blur' }
				],
				monitorName: [
					{ required: true, message: '请输入说明', trigger: 'blur' }
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
						res = await this.$API.monitor.app.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.monitor.app.update.put(this.form);
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
			Object.assign(this.form, data);
			if(this.mode == 'edit') {
				this.title = '修改' + this.form.monitorName;
				return;
			}

			if(this.mode == 'add') {
				this.form = {};
			}
		}
	}
}
</script>

<style></style>
