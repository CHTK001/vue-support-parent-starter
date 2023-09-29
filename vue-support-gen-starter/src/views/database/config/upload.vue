<template>
	<el-dialog title="上传驱动文件" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')" draggable>
		<el-upload class="avatar-uploader" action="#" :show-file-list="true" :auto-upload="false" v-model="getDriverFile"
			:on-change="handlerChange" drag>
			<el-icon class="el-icon--upload"><svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" data-v-ea893728=""><path fill="currentColor" d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64zm384-578.304V704h-64V247.296L237.248 490.048 192 444.8 508.8 128l316.8 316.8-45.312 45.248L544 253.696z"></path></svg></el-icon>
			<div class="el-upload__text">
				拖动文件或者<em>点击上传</em>
			</div>
			<template #tip>
				<div class="el-upload__tip">
					驱动文件
				</div>
			</template>
			<template #file="{ file }">
				<div>
					<img class="el-upload-list__item-thumbnail" :src="getImg('java-archive.png')" alt="" />
				</div>
			</template>
		</el-upload>
		<template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button  type="primary" :loading="isSaveing" @click="submit()">上传</el-button>
		</template>
	</el-dialog>
</template>

<script  >
import { UploadFilled } from '@element-plus/icons-vue'
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
export default {
	emits: ['success', 'closed'],
	data() {
		return {
			mode: "add",
			visible: false,
			isSaveing: false,
			getDriverFile: null,
			form: {}
		}
	},
	methods: {
		getImg(name) {
            return getAssetsImages(name);
        },
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.visible = true;
			return this
		},
		handlerChange(file) {
			this.getDriverFile = file?.raw;
		},
		//表单提交方法
		async submit() {
			this.isUploading = true;
			const row = { "getDriverFile": this.getDriverFile };
			Object.assign(row, this.form);
			var res = await this.$API.gen.dbc.uploadDriver.post(row);
			this.isUploading = false;
			if (res.code != '00000') {
				this.$message.error(res.msg);
			} else {
				this.$emit('success', row, this.mode)
				row.dbcDriverUrl = res?.data?.dbcDriverUrl;
				this.visible = false;
			}
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data)
		}
	}
}
</script>

<style></style>
