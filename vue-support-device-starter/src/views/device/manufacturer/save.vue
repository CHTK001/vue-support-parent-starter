<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
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
import pinyin from 'js-pinyin'

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
			},
		}
	},
	watch:{
		'form.manufacturerName': {
			deep: true,
			immediate: true,
			handler(val) {
				this.form.manufacturerCode = pinyin.getCamelChars((val || '').trim())
			}
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
						res = await this.$API.device.manufacturer.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.device.manufacturer.update.put(this.form);
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
				this.title = '修改' + this.form.manufacturerName;
			}
		}
	}
}
</script>

<style></style>
