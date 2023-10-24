<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">

			<el-form-item label="设备厂家" prop="devicePlatformId">
				<el-select v-model="form.devicePlatformId" style="width: 100%;">
                  <el-option v-for="item in platform" :key="item.devicePlatformId" :label="item.devicePlatformName" :value="item.devicePlatformId" ></el-option>
                </el-select>
			</el-form-item>

			<el-form-item label="服务名称" prop="deviceConnectorName">
				<el-input v-model="form.deviceConnectorName" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">服务名称, 用于标识记录</span>
			</el-form-item>

			<el-form-item label="接口地址" prop="deviceConnectorAddress">
				<el-input v-model="form.deviceConnectorAddress" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康云曜AppKey</span>
			</el-form-item>

			<el-form-item label="AppKey" prop="deviceConnectorAppKey">
				<el-input v-model="form.deviceConnectorAppKey" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: 海康云曜AppKey</span>
			</el-form-item>

			<el-form-item label="AppSecret" prop="deviceConnectorAppSecret">
				<el-input v-model="form.deviceConnectorAppSecret" clearable type="password" show-password></el-input>
			</el-form-item>

			<el-form-item label="项目ID" prop="deviceConnectorProjectId">
				<el-input v-model="form.deviceConnectorProjectId" clearable ></el-input>
			</el-form-item>

			<el-form-item label="项目编码" prop="deviceConnectorProjectCode">
				<el-input v-model="form.deviceConnectorProjectCode" clearable ></el-input>
			</el-form-item>

			<el-form-item label="超时时间" prop="deviceConnectorTimeout">
				<el-input v-model="form.deviceConnectorTimeout" clearable type="number"></el-input>
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
			platform: [],
			//表单数据
			form: {
				deviceConnectorTimeout: 30_000,
			},
			//验证规则
			rules: {
				devicePlatformId: [{ required: true, message: '请选择平台', trigger: 'change'}],
				deviceConnectorName: [{ required: true, message: '请输入服务名称', trigger: 'blur'}],
				deviceConnectorAppKey: [{ required: true, message: '请输入AppKey', trigger: 'blur'}],
				deviceConnectorAppSecret: [{ required: true, message: '请输入AppSecret', trigger: 'blur'}],
			},
		}
	},
	watch:{
		'form.devicePlatformName': {
			deep: true,
			immediate: true,
			handler(val) {
				const arr = [];
				for(const it of (val || '').split('')) {
					arr.push(pinyin.getFullChars(it).trim().toUpperCase());
				}
				this.form.devicePlatformCode = arr.join('_')
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
						res = await this.$API.device.cloud.connector.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.device.cloud.connector.update.put(this.form);
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
		setData(data, platform) {
			this.platform = platform;
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			if(this.mode == 'edit') {
				this.title = '修改' + this.form.devicePlatformName;
				this.form.devicePlatformId = ~~this.form.devicePlatformId;
				return;
			}

			if(this.mode == 'add') {
				this.form = {};
				if(platform.length == 1) {
					this.form.devicePlatformId = platform[0].devicePlatformId;
				}
			}
		}
	}
}
</script>

<style></style>
