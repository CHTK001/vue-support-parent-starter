<template>
	<el-dialog draggable :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form ref="ruleForm" :model="form" :rules="rules" label-width="100px">
			<el-form-item label="唯一编码" prop="code">
				<el-input v-model="form.code" placeholder="唯一编码" clearable></el-input>
			</el-form-item>
			<el-form-item v-if="base.libType === 'FACE'" label="姓名" prop="name">
				<el-input v-model="form.name" placeholder="姓名" clearable></el-input>
			</el-form-item>

			<el-form-item  label="关键词" prop="keyword">
				<el-input v-model="form.keyword" type="textarea" :rows="6" placeholder="关键词" clearable></el-input>
			</el-form-item>

			<el-form-item v-if="base.libType === 'FACE'" label="人脸照" prop="files">
				<el-switch v-model="targetCopper" style="position: absolute; top: 0; left: 0"
                                inline-prompt
                                active-text="裁剪"
                                inactive-text="默认"
                            ></el-switch>
				<sc-upload :autoUpload="false" @handleFile="handleFile" :cropper="targetCopper" v-model="form.files" :limit="1" drag ref="uploadMutiple">
				</sc-upload>
			</el-form-item>

			<el-form-item v-if="base.libType !== 'FACE'" label="底库照" prop="files">
				<el-switch v-model="targetCopper" style="position: absolute; top: 0; left: 0"
                                inline-prompt
                                active-text="裁剪"
                                inactive-text="默认"
                            ></el-switch>
				<sc-upload :autoUpload="false" @handleFile="handleFile" :cropper="targetCopper" v-model="form.files" :limit="1" drag ref="uploadMutiple">
				</sc-upload>
			</el-form-item>

			<el-form-item>
				<el-button type="primary" @click="submitForm">保存</el-button>
				<el-button @click="resetForm">重置</el-button>
			</el-form-item>
		</el-form>
	</el-dialog>
</template>

<script>
export default {
	emits: ['success', 'closed'],
	data() {
		return {
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
					{required: true, message: '请上传人像', trigger: 'change'}
				],
				name: [
					{required: true, message: '姓名不能为空', trigger: 'blur'}
				],
				code: [
					{required: true, message: '编号不能为空', trigger: 'blur'}
				],
			},
			form: {
				files: undefined
			}
		}
	},
	mounted() {
		this.form.code = '3310';this.$TOOL.string.guid();
		this.form.name = '测试';
	},
	methods: {
		resetForm(){
			this.$refs.ruleForm.resetFields();
		},
		submitForm(){
			this.$refs.ruleForm.validate((valid) => {
				if (valid) {
					this.form.files = this.form.files?.raw
					const formData = new FormData();
					for(const item of Object.keys(this.form)) {
						formData.set(item, this.form[item]);
					}
					formData.set("indexName", this.base.indexName);
					this.uploadApiObj.post(formData).then(res => {
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
					})
				}else{
					return false;
				}
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
						if(str.startsWith('http')) {
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
			if (this.fileList.length >= this.limit) {
				this.$message.error(`上传文件数量不能超过 ${this.limit} 个!`); // 图片数量超出
				return
			}
			this.$refs.uploadMutiple.clearFiles(); // 提交图片上传队列
			this.$refs.uploadMutiple.handleStart(file);// 将粘贴过来的图片加入预上传队列
			this.$refs.uploadMutiple.submit(); // 提交图片上传队列
		},
		//显示
		open(mode = 'add', base) {
			this.mode = mode;
			Object.assign(this.base, base);
			this.uploadApiObj = this.$API.learning.reg[this.base.libType].libraryFile;
			this.visible = true;
			return this
		},
		handleSuccess(res) {
			if(!this.file) {
				return !1;
			}
			const formData = new FormData();
			formData.set("files", this.file);
			if(!this.uploadApiObj) {
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
:deep(.el-upload--picture-card) {
    width: 100% !important;
    height: 100%  !important;
}
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
}</style>
