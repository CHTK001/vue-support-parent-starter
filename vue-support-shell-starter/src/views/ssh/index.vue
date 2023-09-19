<template>
	<el-container>
		<el-aside>
			<el-container>
				<el-header></el-header>
				<el-main>
					<el-button type="primary" icon="el-icon-edit" circle @click="openDialog" />
				</el-main>
				<el-footer></el-footer>
			</el-container>
		</el-aside>
		<el-container>
			
		</el-container>
		<el-aside>
			<el-container>
				<el-header>Right Header</el-header>
				<el-main>Right Main</el-main>
				<el-footer>Right Footer</el-footer>
			</el-container>
		</el-aside>
	</el-container>

	<el-dialog v-model="dialogVisible" title="SSH" width="30%" draggable>
		<el-form :model="form" label-width="120px" :rules="rule" >
			<el-form-item label="地址" props="ip">
				<el-input v-model="form.ip" clearable />
			</el-form-item>
			<el-form-item label="端口">
				<el-input v-model="form.port" type="number" />
			</el-form-item>
			<el-form-item label="账号">
				<el-input v-model="form.username" />
			</el-form-item>
			<el-form-item label="密码">
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
	methods: {
		connect() {
			this.connectState = 1;
			let data = this.$TOOL.dateFormat(new Date().getTime(), "yyyyMMdd");
			this.$router.push({ path: '/ssh2/' + this.$TOOL.crypto.AES.encrypt(JSON.stringify(this.form), data + data)  });
		},
		openDialog() {
			this.connectState = 0;
			this.dialogVisible = !this.dialogVisible
		}
	}
}
</script>

<style></style>
