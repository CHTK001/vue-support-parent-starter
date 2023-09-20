<template>
	<el-container>
		<el-aside>
			<el-container>
				<el-main>
					<el-tag style="margin: 5px; cursor: pointer;" closable v-for="item in history" @click="openDialog(item)" >
						{{ item.ip }}:{{ item.port }}
					</el-tag>
				</el-main>
			</el-container>
		</el-aside>
	</el-container>
	<el-button style="position: relative; left: 20%; top: -80%; cursor: pointer;" title="新增连接" type="primary" icon="el-icon-edit" circle @click="openDialog" />

	<el-dialog v-model="dialogVisible" title="SSH" width="30%" draggable :close-on-click-modal="false">
		<el-form :model="form" ref="form" label-width="120px" :rules="rule" >
			<el-form-item label="地址" prop="ip">
				<el-input v-model="form.ip" clearable />
			</el-form-item>
			<el-form-item label="端口" prop="port">
				<el-input v-model="form.port" type="number" />
			</el-form-item>
			<el-form-item label="账号" prop="username">
				<el-input v-model="form.username" />
			</el-form-item>
			<el-form-item label="密码" prop="password">
				<el-input v-model="form.password" type="password" />
			</el-form-item>
		</el-form>
		<template #footer>
			<span class="dialog-footer">
				<el-button @click="dialogVisible = false">取消</el-button>
				<el-button type="primary" :loading="connectState" @click="connect">
					连接
				</el-button>
			</span>
		</template>
	</el-dialog>
</template>

<script>
export default {
	name: 'SSH',
	data() {
		return {
			history: [],
			key: 'SSH_DATA',
			connectState: 0,
			rule: {
				ip: [{ required: true , message: '地址不能为空'}],
				port: [{required: true , message: '端口不能为空'}],
				username: [{ required: true , message: '账号不能为空'}],
				password: [{required: true , message: '密码不能为空'}],
			},
			form: {
				ip: '127.0.0.1',
				port: 22
			},
			dialogVisible: 0
		}
	},
	mounted(){
		this.history = this.$TOOL.data.get('SSH_DATA') || [];
	},
	methods: {
		connect() {
			this.$refs.form.validate(d => {
				if(d) {
					this.connectState = 1;
					let data = this.$TOOL.dateFormat(new Date().getTime(), "yyyyMMdd");
					this.$router.push({ path: '/ssh2/' + this.$TOOL.crypto.BASE64.encrypt(this.$TOOL.crypto.AES.encrypt(JSON.stringify(this.form), data + data))  });
					this.history.push({
						ip: this.form.ip,
						port: this.form.port,
						username: this.form.username
					});
					//加密混淆使用
					this.$TOOL.data.set(this.key, this.history);
				}
			})
		},
		openDialog(item) {
			this.connectState = 0;
			Object.assign(this.form, item || {})
			this.dialogVisible = !this.dialogVisible
		}
	}
}
</script>

<style></style>
