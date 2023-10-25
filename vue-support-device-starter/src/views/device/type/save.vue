<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">

			<el-form-item label="设备类型" prop="deviceTypeParent">
				<el-tree-select
					ref="tree"
					:props="{}" node-key="id"
					v-model="form.deviceTypeParent"
					:data="deviceType"
					check-strictly
					:highlight-current="true"
					:render-after-expand="false"
					@node-click="getNode"
					style="width: 100%"
				/>
			</el-form-item>

			<el-form-item label="类型名称" prop="deviceTypeName">
				<el-input v-model="form.deviceTypeName" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">类型名称, 用于标识记录</span>
			</el-form-item>

			<el-form-item label="类型编码" prop="deviceTypeCode">
				<el-input v-model="form.deviceTypeCode" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: VIDEO</span>
			</el-form-item>

			<el-form-item label="优先级" prop="deviceTypeSort">
				<el-input v-model="form.deviceTypeSort" clearable type="number"></el-input>
			</el-form-item>

			<el-form-item label="备注" prop="deviceTypeRemark">
				<el-input v-model="form.deviceTypeRemark" clearable type="textarea"></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">备注信息</span>
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
			deviceType: [],
			//表单数据
			form: {
				deviceConnectorTimeout: 30_000,
			},
			//验证规则
			rules: {
				deviceTypeParent: [{ required: true, message: '请选择设备类型', trigger: 'change'}],
				deviceTypeName: [{ required: true, message: '请输入设备类型名称', trigger: 'blur'}],
				deviceTypeCode: [{ required: true, message: '请输入设备类型编码', trigger: 'blur'}],
			},
		}
	},
	watch:{
		'form.deviceTypeName': {
			deep: true,
			immediate: true,
			handler(val) {
				const arr = [];
				for(const it of (val || '').split('')) {
					arr.push(pinyin.getFullChars(it).trim().toUpperCase());
				}
				this.form.deviceTypeCode = arr.join('_')
			}
		}
	},
	
	mounted() {
		
	},
	methods: {
		getNode(data) {
			this.form.deviceTypeParent = data.id;
			this.form.deviceTypePath = data.path ?  data.path + "," + data.id : data.id;
		},
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.isSaveing = false;
			this.form = {};
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
						res = await this.$API.device.type.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.device.type.update.put(this.form);
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
		setData(data, deviceType) {
			this.deviceType = [deviceType];
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			if(this.mode == 'edit') {
				this.title = '修改' + this.form.devicePlatformName;
				this.form.devicePlatformId = ~~this.form.devicePlatformId;
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
