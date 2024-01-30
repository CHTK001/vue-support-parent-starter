<template>
	<el-skeleton :loading="loading">
		<el-card shadow="never" header="个人信息">
			<el-form ref="form" :model="form" label-width="120px" style="margin-top:20px;">
				<el-form-item label="账号">
					<el-input v-model="form.userName" disabled></el-input>
					<div class="el-form-item-msg">账号信息用于登录，系统不允许修改</div>
				</el-form-item>
				<el-form-item label="姓名">
					<el-input v-model="form.userRealName"></el-input>
				</el-form-item>
				<el-form-item label="性别">
					<el-select v-model="form.userGender" placeholder="请选择">
						<el-option label="保密" value="2"></el-option>
						<el-option label="男" value="1"></el-option>
						<el-option label="女" value="0"></el-option>
					</el-select>
				</el-form-item>
				<el-form-item label="联系方式" prop="userMobile">
					<el-input v-model="form.userMobile" placeholder="请输入联系方式" clearable></el-input>
				</el-form-item>
				<el-form-item label="联系邮箱" prop="userEmail">
					<el-input v-model="form.userEmail" placeholder="请输入联系邮箱" clearable></el-input>
				</el-form-item>
				<el-form-item label="住址" prop="userEmail">
					<el-input v-model="form.userAddress" placeholder="请输入住址" clearable></el-input>
				</el-form-item>
				<el-form-item label="个性签名">
					<el-input v-model="form.userMarker" type="textarea"></el-input>
				</el-form-item>
				<el-form-item>
					<el-button type="primary" @click.stop="save">保存</el-button>
				</el-form-item>
			</el-form>
		</el-card>
	</el-skeleton>
</template>

<script>
	import sysConfig from "@/config";

export default {
	data() {
		return {
			loading: false,
			form: {
			}
		}
	},
	mounted() {
		this.initial();
	},
	methods: {
		save() {
			this.$API.system.user.update.put(this.form).then(res => {
				if (res.code == '00000') {
					this.$emit('success', res.data, this.mode)
					this.visible = false;
					this.$message.success('操作成功')
				} else {
					this.$message.error(res.msg )
				}
			})

		},
		initial() {
			this.loading = true;
			this.$API.system.user.me.get().then(res => {
				if (res.code === '00000') {
					Object.assign(this.form, res.data);
					// this.$notify.success({ title: '提示', message: '操作成功' })
				} else {
					this.$message.error(res.msg)
				}
			}).finally(() => {
				this.loading = false;
			})
		}
	}
}
</script>

<style></style>
