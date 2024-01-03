<template>
	<el-dialog draggable title="以图搜图" :close-on-click-modal="true" v-model="visible" :width="500" destroy-on-close
		@closed="$emit('closed')" >
		<el-form>
			<el-form-item prop="files">
				<el-switch v-model="targetCopper" style="position: absolute; top: 0; left: 0" inline-prompt active-text="裁剪"
					inactive-text="默认"></el-switch>
				<sc-upload :autoUpload="false" @handleFile="handleFile" :cropper="targetCopper" v-model="form.files"
					:limit="1" drag ref="uploadMutiple" class="upload">
				</sc-upload>
				<div id="preview" @paste="handlePaste">
					<span><i class="el-icon-s-opportunity" style="color:#FB894C"></i>点击此处 将图片按Ctrl+V 粘贴至此处</span>
				</div>
			</el-form-item>

		</el-form>
		<template #footer>
			<span class="dialog-footer">
				<el-button type="primary" @click="submitForm">查询</el-button>
				<el-button @click="visible = false">关闭</el-button>
			</span>
		</template>
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
					{ required: true, message: '请上传人像', trigger: 'change' }
				],
				name: [
					{ required: true, message: '姓名不能为空', trigger: 'blur' }
				],
				code: [
					{ required: true, message: '编号不能为空', trigger: 'blur' }
				],
			},
			form: {
				files: undefined
			}
		}
	},
	mounted() {
	},
	methods: {
		submitForm() {
			const formData = new FormData();
			formData.set("files", this.form.files?.raw);
			formData.set("indexName", this.base.indexName);
			this.$emit('success', formData)
			this.visible = false;
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
	}
}
</script>

<style scoped lang="less">
.upload{
	max-height: 300px !important;
	min-height: 300px !important;
}
.upload,
:deep(.el-upload--picture-card) {
	width: 100% !important;
	height: 100% !important;
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
}
</style>
