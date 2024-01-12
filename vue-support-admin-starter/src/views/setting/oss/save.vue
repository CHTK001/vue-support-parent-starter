<template>
	<el-row :gutter="40">
		<el-col v-if="!mode">
			<el-empty description="请选择左侧菜单后操作" :image-size="100"></el-empty>
		</el-col>
		<template v-else>
			<el-col :lg="24">
				<h2>{{ form.fsBucket || "新增OSS" }}</h2>
				<el-form :model="form" :rules="rules" ref="dialogForm" label-width="130px" label-position="left">
					<el-form-item label="名称" prop="fsName">
						<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsName" clearable placeholder="名称"></el-input>
					</el-form-item>
					<el-form-item label="bucket" prop="fsBucket">
						<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsBucket" clearable placeholder="bucket"></el-input>
						<div class="el-form-item-msg">bucket名称, 只支持字母</div>
					</el-form-item>

					<el-form-item label="类型" prop="fsType">
						<el-radio-group :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsType">
							<el-radio-button v-for="item in ossType" :label="item.value">{{ item.label }}</el-radio-button>
						</el-radio-group>
						<div class="el-form-item-msg">bucket数据存储方式</div>
					</el-form-item>

					<el-form-item label="前端访问地址" prop="fsDomain">
						<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsDomain" clearable placeholder="前端访问地址" max="255"></el-input>
						<div class="el-form-item-msg">三方服务器地址</div>
					</el-form-item>

					<el-form-item label="文件存储位置" prop="fsStoragePath">
						<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsStoragePath" clearable placeholder="文件存储位置" max="255"></el-input>
						<div class="el-form-item-msg">文件存储位置</div>
					</el-form-item>

					<div v-if="form.fsType != 'LOCAL' && form.fsType != 'LOCAL-INDEX'">
						<el-form-item label="三方服务器地址" prop="fsEndpoint">
							<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsEndpoint" clearable placeholder="三方服务器地址"  max="255"></el-input>
							<div class="el-form-item-msg">三方服务器地址</div>
						</el-form-item>
						
						<el-form-item label="access key" prop="fsAccessKeyId">
							<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsAccessKeyId" clearable placeholder="access key"  max="255"></el-input>
							<div class="el-form-item-msg">access key</div>
						</el-form-item>
						
						<el-form-item label="access secret" prop="fsAccessKeyId">
							<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsAccessKeySecret" clearable placeholder="access secret"  max="255"></el-input>
							<div class="el-form-item-msg">access secret</div>
						</el-form-item>
					</div>

					<el-form-item>
						<el-button v-if="mode != 'view'" type="primary" @click="save" :loading="loading">保 存</el-button>
					</el-form-item>
				</el-form>

			</el-col>
		</template>
	</el-row>
</template>

<script>
import scIconSelect from '@/components/scIconSelect/index.vue'

export default {
	components: {
		scIconSelect
	},
	props: {
		menu: { type: Object, default: () => { } },
	},
	data() {
		return {
			ossType: [],
			form: {
				fsType: 'LOCAL',
				fsStatus: 1
			},
			rules: {
				"fsName": [{ required: true, message: '请输入名称', trigger: 'blur' }],
				"fsType": [{ required: true, message: '选择类型', trigger: 'blur' }],
				"fsEndpoint": [{ required: true, message: '请输入地址', trigger: 'blur' }],
				"fsBucket": [{ required: true, message: '请输入Bucket', trigger: 'blur' }],
				"fsAccessKeyId": [{ required: true, message: '请输入access key', trigger: 'blur' }],
				"fsAccessKeySecret": [{ required: true, message: '请输入access secret', trigger: 'blur' }],
				"fsDomain": [{ required: true, message: '请输入浏览器访问', trigger: 'blur' }],

			},
			mode: '',
			loading: false
		}
	},
	mounted() {

	},
	methods: {
		//保存
		save() {
			this.loading = true
			if(this.mode == 'edit') {
				this.$API.system.oss.update.put(this.form)
				.then(res => {
					if (res.code != '00000') {
						this.$message.error(res.msg)
						return;
					} 

					this.$message.success("修改成功");
				}).finally(() => {
					this.loading = false
				})
				return false;
			}
			this.$API.system.oss.save.post(this.form)
				.then(res => {
					if (res.code != '00000') {
						this.$message.error(res.msg);
					}
					this.$emit("success", res?.data)
				}).finally(() => {
					this.loading = false
				})

		},
		//表单注入数据
		setData(data, pid, ossType, mode) {
			this.form = data;
			this.mode = mode;
			this.ossType = ossType;
		}
	}
}
</script>

<style scoped>
h2 {
	font-size: 17px;
	color: #3c4a54;
	padding: 0 0 30px 0;
}

.apilist {
	border-left: 1px solid #eee;
}

[data-theme="dark"] h2 {
	color: #fff;
}

[data-theme="dark"] .apilist {
	border-color: #434343;
}
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
