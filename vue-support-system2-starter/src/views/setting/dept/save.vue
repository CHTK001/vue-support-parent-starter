<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px">
			<el-form-item label="上级部门" prop="deptParentId">
				<el-cascader v-model="form.deptParentId"  popper-class="removeRadio" ref="deptParentRef" :options="groups" :props="groupsProps"
					:show-all-levels="false" clearable style="width: 100%;"></el-cascader>
			</el-form-item>
			<el-form-item label="部门名称" prop="deptName">
				<el-input v-model="form.deptName" placeholder="请输入部门名称" clearable></el-input>
			</el-form-item>
			<el-form-item label="排序" prop="deptSort">
				<el-input-number v-model="form.deptSort" controls-position="right" :min="1"
					style="width: 100%;"></el-input-number>
			</el-form-item>
			<el-form-item label="是否有效" prop="deptStatus">
				<el-switch v-model="form.deptStatus" :active-value="1" :inactive-value="0"></el-switch>
			</el-form-item>
			<el-form-item label="备注" prop="deptRemark">
				<el-input v-model="form.deptRemark" clearable type="textarea"></el-input>
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
			visible: false,
			isSaveing: false,
			//表单数据
			form: {
				deptId: "",
				deptParentId: "0",
				deptName: "",
				deptSort: 1,
				deptStatus: 1,
				deptRemark: "",
				deptTreePath: '0'
			},
			//验证规则
			rules: {
				deptSort: [
					{ required: true, message: '请输入排序', trigger: 'change' }
				],
				deptName: [
					{ required: true, message: '请输入部门名称' }
				]
			},
			//所需数据选项
			groups: [],
			groupsProps: {
				value: "deptId",
				label: "deptName",
				emitPath: false,
				checkStrictly: true
			}
		}
	},
	mounted() {
		this.getGroup()
	},
	methods: {
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.visible = true;
			return this
		},
		//加载树数据
		async getGroup() {
			var res = await this.$API.system.dept.tree.get();
			this.groups = res.data;
		},
		//表单提交方法
		submit() {
			const _select = this.$refs.deptParentRef.getCheckedNodes();
			if (_select && _select.length == 1) {
				this.form.deptTreePath = _select[0].data.deptTreePath + "," + _select[0].value;
			}
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					if (this.mode === 'add') {
						res = await this.$API.system.dept.save.post(this.form);
					} else {
						res = await this.$API.system.dept.update.put(this.form);
					}
					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.roleId = this.form.rowId || res.data.roleId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
						this.$notify.success({ title: '提示', message: "操作成功" })
					} else {
						this.$notify.error({ title: '提示', message: res.msg })
					}
				}
			})
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
