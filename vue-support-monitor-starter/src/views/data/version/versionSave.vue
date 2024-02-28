<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="版本名称" prop="versionName">
				<el-input v-model="form.versionName" clearable placeholder="请输入版本名称"></el-input>
			</el-form-item>

			<el-form-item label="脚本路径" prop="shellScriptPath">
				<el-input v-model="form.shellScriptPath" placeholder="请输入脚本路径"></el-input>
			</el-form-item>

			<el-form-item label="日志名称" prop="versionLog">
				<el-input v-model="form.versionLog" placeholder="请输入日志名称"></el-input>
			</el-form-item>

			<el-form-item label="脚本参数" prop="shellArgs">
				<el-input type="textarea" v-model="form.shellArgs" clearable placeholder="请输入脚本参数"></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">每个参数空格分隔</span>
			</el-form-item>

			<el-form-item label="脚本说明" prop="shellDesc" >
				<el-input v-model="form.shellDesc" clearable placeholder="请输入脚本说明"></el-input>
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
				genId: null
			},
			//验证规则
			rules: {
				shellName: [
					{ required: true, message: '请输入脚本名称' }
				],
				shellScriptPath: [
					{ required: true, message: '请输入脚本路径' }
				],
				shellLogPath: [
					{ required: true, message: '请输入日志路径' }
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
			this.isSaveing = false;
			if(mode == 'add') {
				this.title = '新增脚本';
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
						res = await this.$API.gen.shell.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.gen.shell.update.put(this.form);
					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.genId = this.form.genId || res.data.genId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
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
			this.form.genId = data.genId
			if(this.mode == 'edit') {
				this.title = '修改' + this.form.shellName;
				return;
			}

			this.form.genId = data.genId
		}
	}
}
</script>

<style></style>
