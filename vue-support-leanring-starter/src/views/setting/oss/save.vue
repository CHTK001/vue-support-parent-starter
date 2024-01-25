<template>
	<el-row :gutter="40">
		<el-col v-if="!mode">
			<el-empty description="请选择左侧菜单后操作" :image-size="100"></el-empty>
		</el-col>
		<template v-else>
			<el-col :lg="24">
				<h2 >
					<div class="absolute w100" style="width: 90%;">
						<div class="relative" style="width: 50%; float: left">{{ form.fsBucket || "新增OSS" }}</div>
						<div  class="relative right" style="width: 50%; float: right;">
							<el-icon title="预览" v-if="mode == 'view'" class="cursor-pointer absolute" style="right: -20px; margin-left: 10px; padding-top:4px" @click="rowClick(form)">
								<component is="sc-icon-view"></component>
							</el-icon>
							<el-icon v-if="mode == 'view'" class="cursor-pointer absolute" style="right: 0px; margin-left: 10px; padding-top:4px" @click="doUpload(form)">
								<component is="sc-icon-upload"></component>
							</el-icon>
						</div>
					</div>
					<div style="clear: both;"></div>
				</h2>
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
							<el-radio-button :title="item?.desc" v-for="item in ossImplType" :label="item.value">{{ item.label || item.value }}</el-radio-button>
						</el-radio-group>
						<div class="el-form-item-msg">bucket数据存储方式</div>
					</el-form-item>

					<el-form-item label="图片滤镜" prop="fsFilter">
						<el-radio-group :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsFilter">
							<el-radio-button label="">无</el-radio-button>
							<el-radio-button :title="item?.desc" v-for="item in ossFilterType" :label="item.value">{{ item.label || item.value }}</el-radio-button>
						</el-radio-group>
						<div class="el-form-item-msg">用于预览时转化图片</div>
					</el-form-item>

					<el-form-item label="文件转化" prop="fsPlugin">
						<el-radio-group :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsPlugin">
							<el-radio-button label="">无</el-radio-button>
							<el-radio-button :title="item?.desc" v-for="item in ossPluginType" :label="item.value">{{ item.label  || item.value}}</el-radio-button>
						</el-radio-group>
						<div class="el-form-item-msg">用于上传文件时转化文件后存储</div>
					</el-form-item>

					<el-form-item label="服务器地址" prop="fsEndpoint">
							<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsEndpoint" clearable placeholder="服务器地址"  max="255"></el-input>
							<div class="el-form-item-msg">服务器地址
								<p><b>本地:输入地址</b></p>
								<p><b>远程: 输入远程服务器地址</b></p>
							</div>
						</el-form-item>


					<el-form-item label="前端访问地址" prop="domain">
						<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.domain" clearable placeholder="前端访问地址" max="255"></el-input>
						<div class="el-form-item-msg">前端用于访问文件地址</div>
					</el-form-item>


					<div v-if="form.fsType != 'LOCAL' && form.fsType != 'URL' && form.fsType != 'LOCAL-INDEX'">
						
						<el-form-item label="access key" prop="fsAccessKeyId">
							<el-input :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsAccessKeyId" clearable placeholder="access key"  max="255"></el-input>
							<div class="el-form-item-msg">access key</div>
						</el-form-item>
						
						<el-form-item label="access secret" prop="fsAccessKeyId">
							<el-input type="password" :readonly="mode == 'view'" :disabled="mode =='view'" v-model="form.fsAccessKeySecret" clearable placeholder="access secret"  max="255"></el-input>
							<div class="el-form-item-msg">access secret</div>
						</el-form-item>
					</div>

					<el-form-item label="访问地址" prop="address">
						<div  style="color: gray">{{ form.fsDomain }}
							<el-icon class="cursor-pointer" @click="onCopy(form)"><component is="el-icon-document-copy"></component></el-icon>
						</div>
						<div class="el-form-item-msg">访问地址</div>
					</el-form-item>

					<el-form-item>
						<el-button v-if="mode != 'view'" type="primary" @click="save" :loading="loading">保 存</el-button>
					</el-form-item>
				</el-form>

			</el-col>
		</template>
	</el-row>
	<el-drawer v-model="infoDrawer" title="bucket详情" :size="800" destroy-on-close :close-on-click-modal="false">
		<info ref="info"></info>
	</el-drawer>

	<upload v-if="infoDialog"  ref="infoDialogRef" title="上传" ></upload>
</template>

<script>
import info from './info.vue'
import upload from './upload.vue'
import scIconSelect from '@/components/scIconSelect/index.vue'

export default {
	components: {
		scIconSelect, info, upload
	},
	props: {
		menu: { type: Object, default: () => { } },
	},
	watch: {
		'form.domain': {
			handler(val) {
				if((this.mode == 'save') && !val) {
					this.form.domain = window.location.origin;
				}
				this.form.fsDomain = this.form.domain + '/v1/file/' + this.form.fsBucket + '/preview/'
			},
			deep: true
		}
	},
	data() {
		return {
			infoDrawer: false,
			infoDialog: false,
			ossImplType: [],
			ossFilterType: [],
			ossPluginType: [],
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
				"domain": [{ required: true, message: '请输入浏览器访问', trigger: 'blur' }],

			},
			mode: '',
			loading: false
		}
	},
	mounted() {

	},
	methods: {
		rowClick(row) {
			this.infoDrawer = true
			this.$nextTick(() => {
				this.$refs.info.setData(this.form)
			})
		},
		doUpload(row) {
			this.infoDialog = true
			this.$nextTick(() => {
				this.$refs.infoDialogRef.setData(this.form)
			})
		},
		onCopy(form) {
			const _this = this
			this.$copyText( form.fsDomain  ).then(
                function (e) {
                    _this.$message.success("复制成功!");
                },
                function (e) {
                    console.log("copy arguments e:", e);
                }
            );
		},
		//保存
		save() {
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
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

				}
			})
		},
		//表单注入数据
		setData(data, pid, ossType, mode) {
			this.form = data;
			this.mode = mode;
			if(this.form.fsDomain) {
				const index = this.form.fsDomain.indexOf('/v1');
				if(index > -1) {
					this.form.domain = this.form.fsDomain.substring(0, index);
				}
			}
			this.ossImplType = ossType?.impl;
			this.ossFilterType = ossType?.filter;
			this.ossPluginType = ossType?.plugin;
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
