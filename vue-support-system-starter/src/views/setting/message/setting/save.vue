<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="150px" label-position="left">

			<el-form-item label="配置名称" prop="configName">
				<el-input v-model="form.configName" clearable placeholder="配置名称"></el-input>
			</el-form-item>

			<el-form-item label="配置类型" prop="configType">
				<el-select v-model="form.configType" placeholder="请选择">
					<el-option v-for="item in messageTypeList" :key="item.value" :label="item.label" :value="item.value"></el-option>
				</el-select>
			</el-form-item>

			
			<div v-if="form.configType === 'MAIL'">
				<el-form-item label="发送邮箱" prop="configAccessKey">
					<el-input v-model="form.configAccessKey" clearable placeholder="发送邮箱"></el-input>
					<span class="el-form-item-msg" style="margin-left: 10px;">例如: 1xx@qq.com</span>
				</el-form-item>
			</div>

			<div v-else>
				<el-form-item v-if="form.configType === 'SMS'" label="短信实现" prop="configSmsType">
					<el-select v-model="form.configSmsType" placeholder="请选择">
						<el-option v-for="item in smsTypeData" :key="item.value" :label="item.label" :value="item.value"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="AccessKey" prop="configAccessKey">
					<el-input v-model="form.configAccessKey" clearable placeholder="AccessKey"></el-input>
					<span class="el-form-item-msg" style="margin-left: 10px;">例如: AccessKey</span>
				</el-form-item>

				<el-form-item label="SecretKey" prop="configSecretKey">
					<el-input v-model="form.configSecretKey" clearable placeholder="SecretKey"></el-input>
					<span class="el-form-item-msg" style="margin-left: 10px;">例如: SecretKey</span>
				</el-form-item>

				<el-form-item label="短信签名" prop="configSignName">
					<el-input v-model="form.configSignName" clearable placeholder="短信签名"></el-input>
					<span class="el-form-item-msg" style="margin-left: 10px;">例如: 短信签名</span>
				</el-form-item>

				<el-form-item label="远程服务器地址" prop="configEndpoint">
					<el-input v-model="form.configEndpoint" clearable placeholder="远程服务器地址"></el-input>
				</el-form-item>
				
				<el-form-item label="企业名称" prop="configEcname">
					<el-input v-model="form.configEcname" clearable placeholder="企业名称" ></el-input>
				</el-form-item>

				<el-form-item label="映射ID" prop="configMapperTemplate">
					<el-input v-model="form.configMapperTemplate" clearable placeholder="映射ID"></el-input>
					<span class="el-form-item-msg" style="margin-left: 10px;">例如: 微信模板ID, 推送的时候会以改字段作为推送模板ID</span>
				</el-form-item>
			</div>

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
			messageTypeList: [],
			smsTypeData: [],
			title: '',
			mode: '',
			//表单数据
			form: {
			},
			//验证规则
			rules: {
				configName: [ { required: true, message: '请输入配置名称', trigger: 'blur'}],
				configType: [ { required: true, message: '请选择配置类型', trigger: 'change' }],
				configSmsType: [ { required: true, message: '请选择短信实现', trigger: 'change' }],
				configAccessKey: [ { required: true, message: '请输入AccessKey', trigger: 'blur'}],
				configSecretKey: [ { required: true, message: '请输入SecretKey', trigger: 'blur'}],
				configSignName: [ { required: true, message: '请输入短信签名', trigger: 'blur'}],
			},
		}
	},
	
	mounted() {
		this.afterPropertiesSet();
	},
	methods: {
		async afterPropertiesSet() {
			const res = await this.$API.system.messageConfig.smsType.get();
			if(res.code === '00000') {
				this.smsTypeData = res.data;
				return false;
			}

			this.$message.error(res?.msg);
		},
		//显示
		open(mode = 'add', type) {
			this.messageTypeList = type;
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
						res = await this.$API.system.messageConfig.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.system.messageConfig.update.put(this.form);
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
				this.title = '修改' + this.form.configName;
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
