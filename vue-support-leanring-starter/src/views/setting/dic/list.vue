<template>
	<el-dialog draggable :title="titleMap[mode]" v-model="visible" :width="400" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :rules="rules" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="所属字典" prop="dictTypeId">
				<el-cascader v-model="form.dictTypeId" :options="dic" :props="dicProps" :show-all-levels="false" clearable></el-cascader>
			</el-form-item>
			<el-form-item label="项名称" prop="dictName">
				<el-input v-model="form.dictName" clearable></el-input>
			</el-form-item>
			<el-form-item label="键值" prop="dictValue">
				<el-input v-model="form.dictValue" clearable></el-input>
			</el-form-item>
			<el-form-item label="是否有效" prop="dictStatus">
				<el-switch v-model="form.dictStatus" :active-value="1" :inactive-value="0"></el-switch>
			</el-form-item>
			<el-form-item label="备注" prop="dictRemark">
				<el-input v-model="form.dictRemark" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
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
					add: '新增项',
					edit: '编辑项'
				},
				visible: false,
				isSaveing: false,
				form: {
					id: "",
					dic: "",
					name: "",
					key: "",
					dictStatus: 1
				},
				rules: {
					dic: [
						{required: true, message: '请选择所属字典'}
					],
					dictName: [
						{required: true, message: '请输入项名称'}
					],
					dictValue: [
						{required: true, message: '请输入键值'}
					]
				},
				dic: [],
				dicProps: {
					value: "dictTypeId",
					label: "dictTypeName",
					emitPath: false,
					checkStrictly: true
				}
			}
		},
		mounted() {
			if(this.params){
				this.form.dic = this.params.code
			}
			// this.getDic()
		},
		methods: {
			//显示
			open(mode='add'){
				this.mode = mode;
				this.visible = true;
				return this;
			},
			//获取字典列表
			getDic(){
				this.$API.system.dic.tree.get().then(res => {
					if(res.code === '00000') {
						this.dic = res.data;
					}
				})
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate(async (valid) => {
					if (valid) {
						this.isSaveing = true;
						var res = {};
						if(this.mode === 'add') {
							res = await this.$API.system.dic.dictSave.post(this.form);
						} else {
							res = await this.$API.system.dic.dictUpdate.put(this.form);
						}
						this.isSaveing = false;
						if(res.code == '00000'){
							this.form.dictId = this.form.dictId || res.data.dictId;
							this.$emit('success', this.form, this.mode)
							this.visible = false;
						}else{
							this.$message.error(res.msg)
						}
					}
				})
			},
			//表单注入数据
			setData(data){
				this.form.dictId = data.dictId
				this.form.dictName = data.dictName
				this.form.dictValue = data.dictValue
				this.form.dictStatus = data.dictStatus || 1
				this.form.dictRemark = data.dictRemark
				this.form.dic = data.dic || ~~data.dictTypeId
				this.form.dictTypeId = data.dic  || ~~data.dictTypeId
				this.dic = data.dicList
			}
		}
	}
</script>

<style>
</style>
