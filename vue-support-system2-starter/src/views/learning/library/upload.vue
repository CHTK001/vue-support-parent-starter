<template>
	<el-dialog draggable :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form ref="ruleForm" :model="form" :rules="rules" label-width="100px">
			<el-form-item label="添加方式" prop="selectType">
				<el-select v-model="selectType">
					<el-option :value="0" label="本地上传"></el-option>
					<el-option :value="1" label="远程文件"></el-option>
					<el-option :value="2" label="批量上传"></el-option>
				</el-select>
			</el-form-item>
			<el-form-item v-if="selectType != 2" label="唯一编码" prop="code">
				<el-input v-model="form.code" placeholder="唯一编码" clearable></el-input>
			</el-form-item>
			<el-form-item v-if="base.libType === 'FACE' && selectType != 2" label="姓名" prop="name">
				<el-input v-model="form.name" placeholder="姓名" clearable></el-input>
			</el-form-item>

			<el-form-item v-if="selectType != 2" label="关键词" prop="keyword">
				<el-select v-model="form.keyword" multiple filterable allow-create default-first-option
					:reserve-keyword="false">
				</el-select>
			</el-form-item>

			<!-- <el-form-item  label="图片地址" prop="url">
				<el-input v-model="form.url" placeholder="图片地址" clearable></el-input>
			</el-form-item> -->

			<el-form-item v-if="base.libType === 'FACE' && selectType == 0" label="人脸照" prop="files">
				<el-switch v-model="targetCopper" style="position: absolute; top: 0; left: 0" inline-prompt active-text="裁剪"
					inactive-text="默认"></el-switch>
				<sc-upload :autoUpload="false" @handleFile="handleFile" :cropper="targetCopper" v-model="form.files"
					:limit="1" drag ref="uploadMutiple">
				</sc-upload>
				<div id="preview" @paste="handlePaste">
					<span><i class="el-icon-s-opportunity" style="color:#FB894C"></i>点击此处 将图片按Ctrl+V 粘贴至此处</span>
				</div>
			</el-form-item>

			<el-form-item v-if="base.libType !== 'FACE' && selectType == 0" label="底库照" prop="files">
				<el-switch v-model="targetCopper" style="position: absolute; top: 0; left: 0" inline-prompt active-text="裁剪"
					inactive-text="默认"></el-switch>
				<sc-upload :autoUpload="false" @handleFile="handleFile" :cropper="targetCopper" v-model="form.files"
					:limit="1" drag ref="uploadMutiple">
				</sc-upload>
				<div id="preview" @paste="handlePaste">
					<span><i class="el-icon-s-opportunity" style="color:#FB894C"></i>点击此处 将图片按Ctrl+V 粘贴至此处</span>
				</div>
			</el-form-item>
			<el-form-item v-if="selectType == 2">
				<sc-upload-multiple :autoUpload="false" v-model="selectType3Files" draggable :limit="limit" :tip="tip"></sc-upload-multiple>
			</el-form-item>

			<el-form-item v-if="selectType == 1" label="远程地址" prop="url">
				<el-input v-model="form.url" placeholder="远程地址" clearable></el-input>
			</el-form-item>

			<el-form-item>
				<el-button :loading="loading" type="primary" @click="submitForm">保存</el-button>
				<el-button :loading="loading" @click="resetForm">重置</el-button>
			</el-form-item>
		</el-form>
	</el-dialog>
</template>

<script>
export default {
	emits: ['success', 'closed'],
	data() {
		return {
			selectType3Files: [],
			limit: 10,
			selectType: 0,
			loading: false,
			targetCopper: false,
			uploadApiObj: undefined,
			mode: "add",
			visible: false,
			titleMap: {
				add: '底库上传',
				edit: '编辑用户',
				show: '查看'
			},
			base: {},
			file: undefined,
			rules: {
				files: [
					{ required: true, message: '请上传图像', trigger: 'change' }
				],
				name: [
					{ required: true, message: '姓名不能为空', trigger: 'blur' }
				],
				code: [
					{ required: true, message: '编号不能为空', trigger: 'blur' }
				],
				url: [
					{ required: true, message: '远程地址不能为空', trigger: 'blur' }
				],
			},
			form: {
				files: undefined
			}
		}
	},
	watch: {
		limit: {
			handler(nv, ov) {
				this.tip = `最多上传${nv}个文件,单个文件不要超过10M,请上传图像格式文件`
			}, 
			immediate: !0, 
			deep: !0
		},
		selectType: {
			handler(nv, ov) {
				if (!this.base.libType) {
					return;
				}
				if (nv === 1) {
					this.uploadApiObj = this.$API.learning.reg[this.base.libType].library;
				} else {
					this.uploadApiObj = this.$API.learning.reg[this.base.libType].libraryFile;
				}
			},
			deep: !0,
			immediate: !0
		}
	},
	mounted() {
		this.form.code = '3310'; this.$TOOL.string.guid();
		this.form.name = '测试';
	},
	methods: {
		resetForm() {
			this.$refs.ruleForm.resetFields();
		},
		submitForm() {
			this.$refs.ruleForm.validate((valid) => {
				if (valid) {
					this.loading = true;
					var resp = undefined;
					if (this.selectType === 0) {
						const formData = new FormData();
						for (const item of Object.keys(this.form)) {
							formData.set(item, this.form[item]);
						}
						formData.set("files", this.form.files?.raw);
						formData.set("indexName", this.base.indexName);
						formData.set('keyword', this.form.keyword ? this.form.keyword.join(' ') : '');
						resp = this.uploadApiObj.post(formData)
					} else if (this.selectType === 1){
						let formData = {};
						for (const item of Object.keys(this.form)) {
							formData[item] = this.form[item];
						}
						formData['indexName'] = this.base.indexName;
						formData['url'] = this.form.url;
						formData['keyword'] = this.form.keyword ? this.form.keyword.join(' ') : '';
						resp = this.uploadApiObj.post(formData)
					} else if (this.selectType === 2){
						const formData = new FormData();
						for (const item of Object.keys(this.form)) {
							formData.set(item, this.form[item]);
						}
						this.selectType3Files.forEach(item => {
							formData.append("files[]", item?.file);
						})
						formData.set("indexName", this.base.indexName);
						formData.set('keyword', this.form.keyword ? this.form.keyword.join(' ') : '');
						resp = this.uploadApiObj.post(formData)
					}
					resp.then(res => {
						if (res.code === '00000') {
							this.$emit('success', this.form, this.mode)
							this.$notify.success({
								title: '提示',
								message: '上传成功'
							})
							this.visible = false;
							return !1;
						}
						this.$message.error(res.msg);
					}).finally(() => this.loading = !1)
				} else {
					return false;
				}
			}).finally(() => {
				this.$refs.uploadMutiple?.clearFiles();
			})
		},
		handleFile(file) {
			this.form.files = file
		},
		// 监听粘贴操作
		handlePaste(event) {
			const items = (event.clipboardData || window.clipboardData).items;
			let file = null;
			if (!items || items.length === 0) {
				this.$message.error("当前浏览器不支持本地");
				return;
			}
			const _this = this;
			// 搜索剪切板items
			for (let i = 0; i < items.length; i++) {
				if (items[i].type.indexOf("image") !== -1) {
					file = items[i].getAsFile();
					break;
				}
				if (items[i].type.indexOf("text") !== -1) {
					items[i].getAsString(function (str) {
						if (str.startsWith('http')) {
							_this.$TOOL.url.imgUrlToFile(str).then(res => {
								_this.file = res;
								_this.changeFile(_this.file);
							});
						}
					});
				}
			}
			this.changeFile(file);
		},
		changeFile(file) {
			if (!file) {
				this.$message.error("粘贴内容非图片");
				return;
			}
			// if (this.fileList.length >= this.limit) {
			// 	this.$message.error(`上传文件数量不能超过 ${this.limit} 个!`); // 图片数量超出
			// 	return
			// }
			this.$refs.uploadMutiple.clearFiles(); // 提交图片上传队列
			this.$refs.uploadMutiple.handleStart(file);// 将粘贴过来的图片加入预上传队列
			this.$refs.uploadMutiple.submit(); // 提交图片上传队列
		},
		//显示
		open(mode = 'add', base, row) {
			this.mode = mode;
			if(mode === 'edit') {
				Object.assign(this.form, row);
			}
			Object.assign(this.base, base);
			this.uploadApiObj = this.$API.learning.reg[this.base.libType].libraryFile;
			this.visible = true;
			return this
		},
		handleSuccess(res) {
			if (!this.file) {
				return !1;
			}
			const formData = new FormData();
			formData.set("files", this.file);
			if (!this.uploadApiObj) {
				this.$message.error("暂未开通");
				return !1;
			}
			this.uploadApiObj.post(formData).then(res => {
				if (res.code === '00000') {
					this.$notify.success({
						title: '提示',
						message: '上传成功'
					})
					return !1;
				}
				this.$message.error(res.msg);
			}).finally(() => {
				this.$refs.uploadMutiple.clearFiles();
			})
		}
	}
}
</script>

<style scoped lang="less">
// :deep(.el-upload--picture-card) {
// 	width: 100% !important;
// 	height: 100% !important;
// }

.el-card+.el-card {
	margin-top: 15px;
}

.imglist .el-col+.el-col {
	margin-left: 8px;
}

.custom-empty {
	width: 100%;
	height: 100%;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	background: #8c939d;
	border-radius: 5px;
}

.custom-empty i {
	font-size: 30px;
	color: #fff;
}

.custom-empty p {
	font-size: 12px;
	font-weight: normal;
	color: #fff;
	margin-top: 10px;
}
</style>
