<template>
	<el-dialog :title="title" v-model="visible" :width="700"  destroy-on-close  draggable @close="close">
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">

			<el-form-item label="应用说明" prop="fileStorageProtocolDesc">
				<el-input v-model="form.fileStorageProtocolDesc" clearable placeholder="请输入应用说明"></el-input>
			</el-form-item>

            <el-form-item label="服务器地址" prop="fileStorageProtocol" style="width: 100%;">
				<el-row>
					<el-col :span="12" prop="fileStorageProtocolHost">
						<el-input v-model="form.fileStorageProtocolHost" placeholder="请输入代理地址"></el-input>
					</el-col>
					<el-col :span="12" prop="fileStorageProtocolPort">
						<el-input v-model="form.fileStorageProtocolPort" type="number" placeholder="请输入代理端口"></el-input>
					</el-col>
				</el-row>
			</el-form-item>
			
            <el-form-item label="支持功能" prop="fileStorageProtocolPreviewOrDownload">
                <el-radio-group v-model="form.fileStorageProtocolPreviewOrDownload">
                    <el-radio-button :label="0" :value="0">预览/下载</el-radio-button>
                    <el-radio-button :label="1" :value="1">预览</el-radio-button>
                    <el-radio-button :label="2" :value="2">下载</el-radio-button>
                </el-radio-group>
            </el-form-item>
            
			<el-form-item label="协议" prop="fileStorageProtocolName">
				<el-select v-model="form.fileStorageProtocolName" placeholder="请选择协议" style="width: 100%;">
					<el-option label="HTTP" value="HTTP"></el-option>
				</el-select>
			</el-form-item>
            
			<el-form-item label="插件" prop="fileStorageProtocolPlugins">
				<el-select v-model="form.fileStorageProtocolPlugins" placeholder="请选择协议" multiple style="width: 100%;">
					<el-option :label="item.describe || item.name" :value="item.name" v-for="item in options['fileStoragePlugin']"></el-option>
				</el-select>
			</el-form-item>
            
			<el-form-item label="配置" prop="fileStorageProtocolSetting">
				<el-select v-model="form.fileStorageProtocolSetting" placeholder="请选择协议" multiple style="width: 100%;">
					<el-option :label="item.describe || item.name" :value="item.name" v-for="item in options['fileStorageSetting']"></el-option>
				</el-select>
			</el-form-item>
            
			<el-form-item label="UA配置" prop="fileStorageProtocolUa">
				<el-input v-model="form.fileStorageProtocolUa" style="width: 100%;" placeholder="请输入代理UA" type="textarea">
				</el-input>
			</el-form-item>
            
			<el-form-item label="下载UA配置" prop="fileStorageProtocolDownloadUa">
				<el-input v-model="form.fileStorageProtocolDownloadUa" style="width: 100%;" placeholder="请输入下载UA" type="textarea">
				</el-input>
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
import Base64 from "@/utils/base64";

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			visible: false,
			isSaveing: false,
			title: '',
			mode: '',
			//表单数据
			form: {
			},
            options: {},
            rules: {
                fileStorageProtocolDesc: [
                    { required: true, message: '请输入应用说明', trigger: 'blur' }
                ],
                fileStorageProtocolHost: [
                    { required: true, message: '请输入服务器地址', trigger: 'blur' }
                ],
                fileStorageProtocolPort: [
                    { required: true, message: '请输入服务器端口', trigger: 'blur' }
                ],
                fileStorageProtocolName: [
                    { required: true, message: '请选择协议', trigger: 'blur' }
                ],
				fileStorageProtocolPreviewOrDownload: [
                    { required: true, message: '请选择支持功能', trigger: 'blur' }
                ],
            },
		}
	},
	mounted() {
	},
	methods: {
        close() {
            this.form = {};
            this.visible = false;
            this.isSaveing = false;
        },
		//显示
		open(mode = 'add') {
            this.mode = mode;
            this.visible = true;
            if(this.mode == 'edit') {
				this.title = '修改' + this.form.fileStorageProtocolDesc;
				return;
			}

			if(this.mode == 'add') {
                this.title = '新增服务';
				this.form = {};
                this.form.fileStorageProtocolHost = '0.0.0.0';
                this.form.fileStorageProtocolPort = 8184;
                this.form.fileStorageProtocolName = 'HTTP';
			}
		},
        async afterPrepertiesSetOptions(){
            const res = await this.$API.spi.list.get({type: 'fileStorageSetting,fileStoragePlugin'});
            if(res.code === '00000') {
                this.options = res.data;
            }
        },
		//表单提交方法
		submit() {
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					var res;
                    if(this.form.fileStorageProtocolSetting) {
                        this.form.fileStorageProtocolSetting = this.form.fileStorageProtocolSetting.join(',')
                    }
                    if(this.form.fileStorageProtocolPlugins) {
                        this.form.fileStorageProtocolPlugins = this.form.fileStorageProtocolPlugins.join(',')
                    }
					this.isSaveing = true;
					if (this.mode === 'add') {
						res = await this.$API.filestorage.protocol.save.post(this.form);
					} else if (this.mode === 'edit') {
						res = await this.$API.filestorage.protocol.update.put(this.form);
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
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
            if(this.form.fileStorageProtocolSetting) {
                this.form.fileStorageProtocolSetting = this.form.fileStorageProtocolSetting.split(',')
            }
            if(this.form.fileStorageProtocolPlugins) {
                this.form.fileStorageProtocolPlugins = this.form.fileStorageProtocolPlugins.split(',')
            }
            this.afterPrepertiesSetOptions();
            return this;
		}
	}
}
</script>

<style></style>
