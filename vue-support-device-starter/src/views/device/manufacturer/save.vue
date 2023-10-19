<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="150px"
			label-position="left">
			<el-form-item label="厂家名称" prop="manufacturerName">
				<el-input v-model="form.manufacturerName" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康</span>
			</el-form-item>

			<el-form-item label="厂家编号" prop="manufacturerCode">
				<el-input v-model="form.manufacturerCode" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康可以设置HK</span>
			</el-form-item>

			<el-form-item label="厂家电话" prop="manufacturerPhone">
				<el-input v-model="form.manufacturerPhone" clearable></el-input>
			</el-form-item>

			<el-form-item label="厂家邮箱" prop="manufacturerEmail">
				<el-input v-model="form.manufacturerEmail" type="email" clearable></el-input>
			</el-form-item>

			<el-form-item label="厂家官网" prop="manufacturerAddress">
				<el-input v-model="form.manufacturerAddress" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康可以设置https://www.hikvision.com/cn/</span>
			</el-form-item>

			<el-form-item label="厂家Logo" prop="manufacturerPhoto">
				<el-input v-model="form.manufacturerPhoto" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康可以设置 https://www.hikvision.com/content/dam/hikvision/cn/News-&-Events/Newsroom/2022/01/%E4%BA%9A%E8%BF%90.jpg</span>
			</el-form-item>

			<el-form-item label="备注" prop="manufacturerRemark">
				<el-input v-model="form.manufacturerRemark" type="textarea" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
		</template>
	</el-dialog>
</template>

<script>
export default {
	emits: ['success', 'closed'],
	data() {
		return {
			visible: false,
			isSaveing: false,
			title: '',
			mode: '',
			//表单数据
			form: {
			},
			//验证规则
			rules: {
				manufacturerName: [{ required: true, message: '请输入厂家名称', trigger: 'blur'}],
				manufacturerCode: [{ required: true, message: '请输入厂家编号', trigger: 'blur'}],
			}
		}
	},
	mounted() {
	},
	methods: {
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.visible = true;
			return this
		},
		//表单提交方法
		submit() {
			
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					var auth = { }
					auth = Object.assign(auth, this.form);
					auth = Object.assign(auth, this.fileForm);
					auth.dbcConsoleUrl = JSON.stringify(this.dbcConsoleUrlTable);
					if (this.mode === 'add') {
						res = await this.$API.gen.dbc.save.post(auth);
					} else if (this.mode === 'edit') {
						res = await this.$API.gen.dbc.update.put(auth);
					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.dbcId = res.data.dbcId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
					} else {
						this.$notify.error({ title: '提示', message: res.msg })
					}
				}
			})
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
		}
	}
}
</script>

<style></style>
