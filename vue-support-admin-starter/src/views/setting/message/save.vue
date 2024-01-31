<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">

			<el-form-item label="模板名称" prop="messageName">
				<el-input v-model="form.messageName" clearable placeholder="请输入模板名称"></el-input>
			</el-form-item>

			<el-form-item label="模板类型" prop="messageType">
				<el-select v-model="form.messageType" placeholder="请选择">
					<el-option v-for="item in messageTypeList" :key="item.value" :label="item.label" :value="item.value"></el-option>
				</el-select>
			</el-form-item>

			<el-form-item label="下发渠道" prop="config">
				<el-select v-model="form.config" placeholder="请选择" multiple>
					<el-option v-for="item in configList" :key="item.configId" :label="item.configName" :value="item.configId"></el-option>
				</el-select>
			</el-form-item>

			<el-form-item label="发件人名称" prop="messageSender">
				<el-input v-model="form.messageSender" clearable placeholder="请输入发件人名称"></el-input>
			</el-form-item>

			<el-form-item label="模板内容" prop="messageTemplate">
				<template #label>
					模板内容
					<el-tooltip
						class="box-item"
						effect="dark"
						content="模板支持{xx}变量"
						placement="top-start"
					>
					<div class="cursor-pointer"><el-icon><component is="el-icon-info-filled" /></el-icon></div>
					</el-tooltip>	
				</template>
				<el-input v-model="form.messageTemplate"  clearable></el-input>
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
			messageTypeList: [],
			configList: [],
			title: '',
			mode: '',
			//表单数据
			form: {
			},
			//验证规则
			rules: {
				messageName: [
					{ required: true, message: '请输入模板名称', trigger: 'blur' }
				],
				messageType: [
					{ required: true, message: '请选择模板类型', trigger: 'change' }
				],
				messageSender: [
					{ required: true, message: '请输入发件人名称', trigger: 'blur' }
				],
				messageTemplate: [
					{ required: true, message: '请输入模板内容', trigger: 'blur' }
				],
				config: [
					{ required: true, message: '请选择下发渠道', trigger: 'change' }
				],
			},
		}
	},
	
	mounted() {
		this.afterPropertiesSet();
	},
	methods: {
		async afterPropertiesSet(){
			const res = await this.$API.system.messageConfig.list.get();
			if(res.code === '00000') {
				this.configList = res.data;
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
						res = await this.$API.system.message.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.system.message.update.put(this.form);
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
				this.title = '修改' + this.form.messageName;
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
