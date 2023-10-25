<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable :close-on-click-modal="false">
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">

			<el-form-item label="设备名称" prop="deviceName">
				<el-input v-model="form.deviceName" clearable></el-input>
			</el-form-item>

			<el-form-item label="识别码" prop="deviceImsi">
				<el-input v-model="form.deviceImsi" clearable></el-input>
			</el-form-item>

			<el-form-item label="设备类型" prop="deviceTypeId">
				<el-tree-select
					ref="tree"
					:props="{}" node-key="id"
					v-model="form.deviceTypeId"
					:data="deviceType"
					check-strictly
					:highlight-current="true"
					:render-after-expand="false"
					@node-click="getNode"
					style="width: 100%"
				/>
			</el-form-item>
			<el-form-item label="云服务" prop="deviceConnectorId">
				<el-select v-model="form.deviceConnectorId" style="width: 100%">
					<el-option v-for="item in cloudService" :key="item.deviceConnectorId" :value="item.deviceConnectorId" :label="item.deviceConnectorName"></el-option>
				</el-select>
			</el-form-item>

			<el-form-item label="详细地址" prop="deviceAddress">
				<el-input v-model="form.deviceAddress" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">设备所在的详细地址</span>
			</el-form-item>
			
			<el-form-item label="标签" prop="deviceTreatyTypeLabel">
				<el-tag v-for="tag in dynamicTags " :key="tag" class="mx-1" closable :disable-transitions="false" @close="handleClose(tag)" >
					{{ tag }}
				</el-tag>
				<el-input v-if="inputVisible" ref="InputRef" v-model="inputValue" class="ml-1 w-20" size="small" @keyup.enter="handleInputConfirm" @blur="handleInputConfirm" />
				<el-button v-else class="button-new-tag ml-1" size="small" @click="showInput">
					+ 
				</el-button>
			</el-form-item>

			<el-form-item label="设备版本" prop="deviceVersion">
				<el-input v-model="form.deviceVersion" clearable></el-input>
				<span class="el-form-item-msg" style="margin-left: 10px;">例如: v1.0.0</span>
			</el-form-item>

			<el-form-item label="设备型号" prop="deviceModel">
				<el-input v-model="form.deviceModel" clearable ></el-input>
			</el-form-item>
			
			<el-form-item label="设备序列号" prop="deviceSerial">
				<el-input v-model="form.deviceSerial" clearable ></el-input>
			</el-form-item>

			<el-form-item label="设备协议名称" prop="deviceTreatyTypeLabel">
				<el-input v-model="form.deviceTreatyTypeLabel" clearable ></el-input>
			</el-form-item>

			<el-form-item label="设备协议" prop="deviceTreatyType">
				<el-input v-model="form.deviceTreatyType" clearable ></el-input>
			</el-form-item>
			<el-form-item label="备注" prop="deviceRemark">
				<el-input v-model="form.deviceRemark" clearable ></el-input>
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
			inputVisible: false,
			inputValue: '',
			visible: false,
			isSaveing: false,
			manufacturer: [],
			title: '',
			mode: '',
			platform: [],
			deviceType: [],
			dynamicTags : [],
			cloudService : [],
			//表单数据
			form: {
			},
			//验证规则
			rules: {
				deviceName: [ { required: true, message: '请输入设备名称', trigger: 'blur' } ],
				deviceImsi: [ { required: true, message: '请输入设备IMSI', trigger: 'blur' } ],
				deviceTypeId: [ { required: true, message: '请选择设备类型', trigger: 'change' } ],
			},
		}
	},
	mounted() {
		
	},
	methods: {
		getNode(data) {
			this.form.deviceTypeId = data.id;
		},
		handleClose (tag) {
			this.dynamicTags.splice(this.dynamicTags.indexOf(tag), 1)
		},
		showInput(){
			this.inputVisible = true
			this.$nextTick(() => {
				this.$refs.InputRef?.input?.focus()
			})
		},
		handleInputConfirm (){
			if (this.inputValue) {
				this.dynamicTags.push(this.inputValue)
			}
			this.inputVisible = false
			this.inputValue = ''
		},
		async registerCloudService(){
			const res = await this.$API.device.cloud.connector.list.get();
			if (res.code == '00000') {
				this.cloudService = res.data;
			} else {
				this.$message.error(res.msg)
			}
		},
		async registerDeviceType(){
			const res = await this.$API.device.type.tree.get();
			if (res.code == '00000') {
				this.deviceType = [res.data];
			} else {
				this.$message.error(res.msg)
			}
		},
		//显示
		open(mode = 'add') {
			this.registerDeviceType();
			this.registerCloudService();
			this.visible= false;
			this.isSaveing= false;
			this.mode = mode;
			this.visible = true;
			return this
		},
		//表单提交方法
		submit() {
			if(this.form.deviceTypeId == '0') {
				this.$message.error('请选择设备类型, 且不能选择根目录');
				return;
			}
			this.form.deviceTag = this.dynamicTags.join(',');
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					var res;
					this.isSaveing = true;
					if (this.mode === 'add') {
						res = await this.$API.device.device.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.device.device.update.put(this.form);
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
			this.dynamicTags  = [];
			if(this.form.deviceTag) {
				this.dynamicTags = this.form.deviceTag.split(',');
			}
			if(this.mode == 'add') {
				this.form = {};
				this.title = '新增设备';
			} else if(this.mode == 'edit') {
				this.title = '编辑' + this.form.deviceName;
				return;
			}
		}
	}
}
</script>

<style></style>
