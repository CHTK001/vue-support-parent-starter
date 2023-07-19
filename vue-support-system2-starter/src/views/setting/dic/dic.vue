<template>
	<el-dialog  draggable :title="titleMap[mode]" v-model="visible" :width="330" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :rules="rules" ref="dialogForm" label-width="80px" label-position="left">
			<el-form-item label="字典名称" prop="dictTypeName">
				<el-input v-model="form.dictTypeName" clearable placeholder="字典显示名称"></el-input>
			</el-form-item>
			<el-form-item label="编码" prop="dictTypeCode">
				<el-input v-model="form.dictTypeCode" clearable placeholder="字典编码"></el-input>
			</el-form-item>
			<el-form-item label="类型" prop="dictTypeSys">
				<el-switch
					v-model="form.dictTypeSys"
					class="ml-2"
					:inactive-value="0"
					:active-value="1"
					active-text="系统"
					inactive-text="非系统"
					inline-prompt
					style="--el-switch-on-color: #13ce66; --el-switch-off-color: #ff4949"
				/>
			</el-form-item>
			<el-form-item label="备注" prop="dictTypeRemark">
				<el-input v-model="form.dictTypeRemark" clearable placeholder="备注"></el-input>
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
					add: '新增字典',
					edit: '编辑字典'
				},
				visible: false,
				isSaveing: false,
				form: {
					id:"",
					name: "",
					code: "",
					parentId: "",
					dictTypeSys: '0'
				},
				rules: {
					dictTypeCode: [
						{required: true, message: '请输入编码'}
					],
					dictTypeName: [
						{required: true, message: '请输入字典名称'}
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
		},
		methods: {
			//显示
			open(mode='add'){
				this.mode = mode;
				this.visible = true;
				return this;
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate(async (valid) => {
					if (valid) {
						this.isSaveing = true;
						var res = await this.$API.system.dic.save.post(this.form);
						this.isSaveing = false;
						if(res.code == '00000'){
							this.form.dictTypeId = res.data.dictTypeId;
							this.$emit('success', this.form, this.mode)
							this.visible = false;
							this.$message.success("操作成功")
						}else{
							this.$alert(res.message, "提示", {type: 'error'})
						}
					}
				})
			},
			//表单注入数据
			setData(data){
				this.form.id = data.id
				this.form.name = data.name
				this.form.code = data.code
				this.form.parentId = data.parentId

				//可以和上面一样单个注入，也可以像下面一样直接合并进去
				//Object.assign(this.form, data)
			}
		}
	}
</script>

<style>
</style>
