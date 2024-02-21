<template>
	<el-form ref="loginForm" :model="form" :rules="rules" label-width="0" size="large" @keyup.enter="login">
		<el-form-item prop="user">
			<el-input v-model="form.user" prefix-icon="el-icon-user" clearable :placeholder="$t('login.userPlaceholder')">
				
			</el-input>
		</el-form-item>
		<el-form-item prop="password">
			<el-input v-model="form.password" prefix-icon="el-icon-lock" clearable show-password
				:placeholder="$t('login.PWPlaceholder')"></el-input>
		</el-form-item>

		<el-form-item prop="verifyCode">
			<el-input :span="6" v-model="form.verifyCode" class="verifyCode" clearable
				:placeholder="$t('login.verifyCode')"></el-input>
			<div :span="6" class="captcha">
				<img :src="captchaBase64" @click="getCaptcha" />
			</div>
		</el-form-item>

		<el-form-item style="margin-bottom: 10px;">
			<el-col :span="12">
				<el-checkbox :label="$t('login.rememberMe')" v-model="form.autologin"></el-checkbox>
			</el-col>
			<el-col :span="12" class="login-forgot">
				<router-link to="/reset_password">{{ $t('login.forgetPassword') }}？</router-link>
			</el-col>
		</el-form-item>
		<el-form-item>
			<el-button type="primary" style="width: 100%;" :loading="islogin" round @click="login">{{ $t('login.signIn')
			}}</el-button>
		</el-form-item>
		<div class="login-reg">
			{{ $t('login.noAccount') }} <router-link to="/user_register">{{ $t('login.createAccount') }}</router-link>
		</div>
	</el-form>
</template>

<script>
import sysConfig from "@/config";

import Base64 from "@/utils/base64";
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';

import allComps from '@/views/home/widgets/components'

export default {
	data() {
		return {
			userType: 'admin',
			form: {
				user: "admin",
				password: "123456",
				autologin: false,
				verifyCode: undefined
			},
			rules: {
				user: [
					{ required: true, message: this.$t('login.userError'), trigger: 'blur' }
				],
				password: [
					{ required: true, message: this.$t('login.PWError'), trigger: 'blur' }
				]
			},
			captchaBase64Key: undefined,
			captchaBase64: undefined,
			islogin: false,
		}
	},
	watch: {
		userType(val) {
			if (val == 'admin') {
				this.form.user = 'admin'
				this.form.password = '123456'
			} else if (val == 'user') {
				this.form.user = 'user'
				this.form.password = 'user'
			}
		}
	},
	mounted() {
		this.form.user = this.$TOOL.data.get(sysConfig.AUTO_LOGIN);
		this.getCaptcha();
	},
	methods: {
		getCaptcha() {
			this.$API.auth.captcha.get().then(({data, headers}) => {
				const { verifyCodeBase64 } = data;
				const verifyCodeKey  = headers['access-control-captcha']
				this.captchaBase64 = verifyCodeBase64;
				this.captchaBase64Key = verifyCodeKey;
			});
		},
		async login() {
			this.$TOOL.data.remove(sysConfig.USER_INFO_SIGN);
			if (!this.form.verifyCode|| !this.captchaBase64Key || Base64.decode(this.captchaBase64Key).toLowerCase() != this.form.verifyCode.toLowerCase()) {
				ElMessage.error('校验码不正确')
				// 验证失败，重新生成验证码
				this.getCaptcha();
				return false;
			}
			var validate = await this.$refs.loginForm.validate().catch(() => { })
			if (!validate) { return false }

			this.islogin = true
			var data = {
				username: this.form.user,
				password: this.$TOOL.crypto.MD5(this.form.password),
				verifyCode: this.form.verifyCode
			}
			//获取token
			try {
				var user = await this.$API.auth.token.post(data)
			}catch(e) {
				this.getCaptcha();
				console.log(e);
				this.islogin = !1;
				return;
			}
			
			this.$TOOL.data.remove(sysConfig.AUTO_LOGIN);
			this.getCaptcha();
			if (user.code === '00000') {
				this.$TOOL.cookie.set(sysConfig.TOKEN, user.data.accessToken, {
					expires: this.form.autologin ? 24 * 60 * 60 : 0
				})
				this.$TOOL.data.set(sysConfig.USER_INFO, user.data.userInfo)
				if(this.form.autologin) {
					this.$TOOL.data.set(sysConfig.AUTO_LOGIN, this.form.user);
				}
			} else {
				this.islogin = false
				this.$message.warning(user.msg)
				return false
			}
			//获取菜单
			var menu = null
			try {
				menu = await this.$API.system.menu.myMenus.get()
			}catch(e) {
				this.getCaptcha();
				console.log(e);
				this.islogin = !1;
				return;
			}
			if (menu.code == '00000') {
				if (menu.data.menu.length == 0) {
					this.islogin = false
					this.$alert("当前用户无任何菜单权限，请联系系统管理员", "无权限访问", {
						type: 'error',
						center: true
					})
					return false
				}
				this.$TOOL.data.set(sysConfig.MENU, menu.data?.menu)
				this.$TOOL.data.set(sysConfig.PERMISSIONS, menu.data?.permissions)
				if((!menu.data?.dashboardGrid || !menu.data?.dashboardGrid.length) && user.data.userInfo.roles.indexOf(sysConfig.ADMIN) > -1) {
					menu.data.dashboardGrid = Object.keys(allComps);
				}
				this.$TOOL.data.set(sysConfig.DASHBOARD_GRID, menu.data?.dashboardGrid)
				this.$TOOL.data.set(sysConfig.DASHBOARD_TYPE, menu.data?.dashboard)
				if(menu.data?.grid?.copmsList) {
					this.$TOOL.data.set(sysConfig.GRID, menu.data?.grid)
				} else {
					this.$TOOL.data.remove(sysConfig.GRID)
				}
			} else {
				this.islogin = false
				this.$message.warning(menu.msg)
				return false
			}

			this.$router.replace({
				path: '/'
			})
			this.$message.success("登录成功");
			this.$TOOL.data.set(sysConfig.USER_INFO_SIGN, true);
			this.islogin = false
		},
	}
}
</script>

<style scoped lang="scss">
.captcha {
	position: absolute;
	top: 0;
	right: 0;

	img {
		width: 120px;
		height: 40px;
		cursor: pointer;
	}
}

.verifyCode {
	width: 65%;
}</style>
