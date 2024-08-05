<template>
	<el-dialog draggable :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :rules="rules" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item v-if="mode === 'add'" label="库名称" prop="libName">
				<el-input v-model="form.libName" clearable></el-input>
			</el-form-item>
            <el-form-item v-if="mode === 'add'" label="库类型" prop="libType">
                <el-select v-model="form.libType"  clearable>
                    <el-option label="人脸" value="FACE"></el-option>
                    <el-option label="图像" value="IMAGE"></el-option>
                </el-select>
                
			</el-form-item>
			<el-form-item label="库描述" prop="libMarker">
				<el-input type="textarea" :rows="12" v-model="form.libMarker" clearable></el-input>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
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
				},
				//验证规则
				rules: {
					libName: [
						{required: true, message: '请输入底库名称'}
					],
                    libType: [{required: true, message: '请选择底库类型'}]
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
				return this
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate(async (valid) => {
					if (valid) {
						this.isSaveing = true;
						var res = {};
						if(this.mode === 'add') {
							res = await this.$API.system.library.save.post(this.form);
						} else if(this.mode === 'edit') {
							res = await this.$API.system.library.update.put(this.form);
						}
						
						this.isSaveing = false;
						if(res.code == '00000'){
							this.form.libId = this.form.rowId || res.data.libId;
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
				//可以和上面一样单个注入，也可以像下面一样直接合并进去
				Object.assign(this.form, data)
			}
		}
	}
</script>

<style>
</style>
