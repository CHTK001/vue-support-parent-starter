<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">

			<el-form-item label="设备厂家" prop="manufacturerId">
				<el-select v-mode="form.manufacturerId" style="width: 100%;">
					<el-option  :value="item.manufacturerId" :key="item.manufacturerId" :label="item.manufacturerName" v-for="item in manufacturer">
						{{ item.manufacturerName }}
						<span class="el-form-item-msg" style="margin-left: 10px;">{{ item.manufacturerRemark }}</span>
					</el-option>
				</el-select>
			</el-form-item>

			<el-form-item label="厂家名称" prop="devicePlatformName">
				<el-input v-model="form.devicePlatformName" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康云曜</span>
			</el-form-item>


			<el-form-item label="厂家编号" prop="devicePlatformCode">
				<el-input v-model="form.devicePlatformCode" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康云曜可以设置HAI_KANG_YUN_YAO</span>
			</el-form-item>

			<el-form-item label="云平台API地址" prop="devicePlatformApiAddress">
				<el-input v-model="form.devicePlatformApiAddress" clearable></el-input>
			</el-form-item>

			<el-form-item label="云平台地址" prop="devicePlatformAddress">
				<el-input v-model="form.devicePlatformAddress" type="email" clearable></el-input>
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
			manufacturer: [],
			title: '',
			mode: '',
			//表单数据
			form: {
				manufacturerId: '',
			},
			//验证规则
			rules: {
				manufacturerId: [ { required: true, message: '请选择厂家', trigger: 'change' }],
				devicePlatformName: [{ required: true, message: '请输入云平台名称', trigger: 'blur'}],
				devicePlatformCode: [{ required: true, message: '请输入云平台编号', trigger: 'blur'}],
				devicePlatformApiAddress: [{ required: true, message: '请输入云平台API地址', trigger: 'blur'}]
			},
		}
	},
	watch:{
		'form.devicePlatformName': {
			deep: true,
			immediate: true,
			handler(val) {
				this.form.manufacturerCode = pinyin.getFullChars((val || '').trim())
			}
		}
	},
	
	mounted() {
		this.registerManufacturer();
	},
	methods: {
		async registerManufacturer(){
			const res = await this.$API.device.manufacturer.list.get();
			if (res.code == '00000') {
				this.manufacturer = res.data;
			} else {
				this.$message.error(res.msg)
			}
		},
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
						res = await this.$API.device.cloud.platform.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.device.cloud.platform.update.put(this.form);
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
				this.title = '修改' + this.form.devicePlatformName;
			}
		}
	}
}
</script>

<style></style>
