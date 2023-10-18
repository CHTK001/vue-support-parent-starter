<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
			<el-form-item label="ossId" prop="ossId" v-if="false">
				<el-input v-model="form.ossId" disabled readonly />
			</el-form-item>
			<el-form-item label="bucket" prop="ossBucket">
				<el-input v-model="form.ossBucket" clearable placeholder="bucket" />
			</el-form-item>
			<el-form-item label="oss路径" prop="ossPath">
				<el-input v-model="form.ossPath" clearable placeholder="oss路径" />
			</el-form-item>
			<el-form-item label="oss类型" prop="ossType">
				<el-select v-model="form.ossType" clearable placeholder="oss类型">
					<el-option :value="item.value" :label="item.label" v-for="item in data.impl">
						<span style="float: left">{{ item.value }}</span>
						<span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{ item.label
						}}</span>
					</el-option>
				</el-select>
			</el-form-item>

			<el-form-item label="appKey" prop="appKey">
				<el-input v-model="form.ossAppKey" clearable placeholder="appKey" />
			</el-form-item>

			<el-form-item label="appSecret" prop="appSecret">
				<el-input v-model="form.ossAppSecret" clearable placeholder="appSecret" />
			</el-form-item>

			<el-form-item label="重名覆盖" prop="ossCovering">
				<el-select v-model="form.ossCovering" clearable placeholder="重名覆盖">
					<el-option :value="true" label="覆盖" />
					<el-option :value="false" label="不覆盖" />
				</el-select>
			</el-form-item>

			<el-form-item label="传输字节" prop="ossBuffer">
				<el-input type="number" v-model="form.ossBuffer" clearable placeholder="传输字节" />
			</el-form-item>

			<el-form-item label="命名策略" prop="ossNameStrategy">
				<el-select v-model="form.ossNameStrategy" clearable placeholder="命名策略">
					<el-option :value="item.value" :label="item.label" v-for="item in data.names" />
				</el-select>
			</el-form-item>

			<el-form-item label="拒绝策略" prop="ossRejectStrategy">
				<el-select v-model="form.ossRejectStrategy" clearable placeholder="拒绝策略">
					<el-option :value="item.value" :label="item.label" v-for="item in data.reject" />
				</el-select>
			</el-form-item>

			<el-form-item label="额外参数" prop="ossProperties">
				<el-input type="textarea" v-model="form.ossProperties" clearable placeholder="额外参数" />
			</el-form-item>

			<el-form-item label="插件(,分隔)" prop="ossPlugins">
				<el-select multiple v-model="form.ossPlugins" clearable placeholder="插件">
					<el-option :key="item.value" :value="item.value" :label="item.label" v-for="item in data.filter">
						<span style="float: left">{{ item.value }}</span>
						<span style=" float: right; color: var(--el-text-color-secondary); font-size: 13px;">{{ item.label
						}}</span>
					</el-option>
				</el-select>
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
			mode: "add",
			titleMap: {
				add: '新增',
				edit: '编辑',
				show: '查看'
			},
			form: {},
			rules: {
				ossBucket: [{ required: true, message: "bucket不能为空" }],
				ossPath: [{ required: true, message: "ossPath不能为空" }]
			},
			data: {
				tableData: [],
				total: 0,
				drawerTitle: '',
				treeTableData: [],
			},
			visible: false,
			isSaveing: false,
		}
	},
	mounted() {
		this.initial();
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
			this.$refs.formRef.validate(v => {
				if (v) {
					this.$API.system.oss.save.post(this.form).then((res) => {
						let type = 'success';
						if (res.code !== '00000') {
							type = 'error';
						} else {
							this.visible = false;
							this.$emit('success', res.data, this.mode)
						}
						this.$notify({
							title: '消息提示',
							type: type,
							message: res.msg
						});
					})
				}
			})
		},
		async initial() {
			let res = await this.$API.system.oss.option.get({ type: 0 });
			if (res.code === '00000') {
				this.data.impl = res.data;
			}
			res = await this.$API.system.oss.option.get({ type: 1 });
			if (res.code === '00000') {
				this.data.names = res.data;
			}
			res = await this.$API.system.oss.option.get({ type: 2 });
			if (res.code === '00000') {
				this.data.reject = res.data;
			}
			res = await this.$API.system.oss.option.get({ type: 3 });
			if (res.code === '00000') {
				this.data.filter = res.data;
			}
		},
		//表单注入数据
		setData(data) {
			Object.assign(this.form, data)
		}
	}
}
</script>

<style>
.removeRadio .el-radio__inner {
	border-radius: 0;
	border: 0;
	width: 170px;
	height: 34px;
	background-color: transparent;
	cursor: pointer;
	box-sizing: border-box;
	position: absolute;
	top: -18px;
	left: -19px;
}

.removeRadio .el-radio__input.is-checked .el-radio__inner {
	background: transparent;
}
</style>
