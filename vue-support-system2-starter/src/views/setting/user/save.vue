<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')">
		<el-form :model="form" :rules="rules" :disabled="mode=='show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="头像" prop="userAvatar">
				<sc-upload v-model="form.userAvatar" :urlPrefix="urlPrefix" name="files" :data="uploadParam" title="上传头像"></sc-upload>
			</el-form-item>
			<el-form-item label="登录账号" prop="username">
				<el-input v-if="mode === 'add'" v-model="form.username" placeholder="用于登录系统" clearable></el-input>
				<el-input v-else disabled readonly v-model="form.username" placeholder="用于登录系统" clearable></el-input>
			</el-form-item>
			<el-form-item label="真实姓名" prop="userRealName">
				<el-input v-model="form.userRealName" placeholder="请输入完整的真实姓名" clearable></el-input>
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
			<template v-if="mode=='add'">
				<el-form-item label="登录密码" prop="userPassword">
					<el-input type="password" v-model="form.userPassword" clearable show-password></el-input>
				</el-form-item>
				<el-form-item label="确认密码" prop="password2">
					<el-input type="password" v-model="form.password2" clearable show-password></el-input>
				</el-form-item>
			</template>
			<el-form-item label="所属部门" prop="deptId">
				<el-cascader v-model="form.deptId" popper-class="removeRadio" :options="depts" :props="deptsProps" clearable style="width: 100%;"></el-cascader>
			</el-form-item>
			<el-form-item label="所属角色" prop="roleId">
				<el-select v-model="form.roleId" multiple filterable style="width: 100%">
					<el-option v-for="item in roleGroups" :key="item.roleId" :label="item.roleName" :value="item.roleId"/>
				</el-select>
			</el-form-item>
		</el-form>
		<template #footer>
			<el-button @click="visible=false" >取 消</el-button>
			<el-button v-if="mode!='show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
		</template>
	</el-dialog>
</template>

<script>
	export default {
		emits: ['success', 'closed'],
		data() {
			return {
				mode: "add",
				titleMap: {
					add: '新增用户',
					edit: '编辑用户',
					show: '查看'
				},
				uploadParam: {
					ossBucket: 'avatar'
				},
				urlPrefix: undefined,
				visible: false,
				isSaveing: false,
				//表单数据
				form: {
					userId:"",
					username: "",
					userAvatar: "",
					userPassword: "",
					deptId: "",
					roleId: []
				},
				//验证规则
				rules: {
					auserAatar:[
						{required: true, message: '请上传头像'}
					],
					username: [
						{required: true, message: '请输入登录账号'}
					],
					userPassword: [
						{required: true,  message: '请输入登录密码'},
						{validator:(rule, value, callback) => {
								var reg1 = /^(?=.*\d)(?=.*[a-zA-Z])(?=.*[~!@#$%^&*.])[\da-zA-Z~!@#$%^&*.]{8,}$/; //密码必须是8位以上、必须含有字母、数字、特殊符号
								var reg2 = /(123|234|345|456|567|678|789|012)/; //不能有3个连续数字
								if (!reg1.test(value)) {
									callback(new Error("密码必须是8位以上、必须含有字母、数字、特殊符号"));
								} else if (reg2.test(value)) {
									callback(new Error("不能有3个连续数字"));
								} else {
									callback();
								}
							}
						}
					],
					password2: [
						{required: true, message: '请再次输入密码'},
						{validator: (rule, value, callback) => {
							if (value !== this.form.userPassword) {
								callback(new Error('两次输入密码不一致!'));
							}else{
								callback();
							}
						}}
					],
					deptId: [
						{required: true, message: '请选择所属部门'}
					],
					roleId: [
						{required: true, message: '请选择所属角色', trigger: 'change'}
					]
				},
				//所需数据选项
				roleGroups: [],
				roleGroupsProps: {
					value: "roleId",
					multiple: true,
					checkStrictly: true
				},
				depts: [],
				deptsProps: {
					value: "deptId",
					label: 'deptName',
					checkStrictly: true
				},
				passwordPercent: 0,
			}
		},
		mounted() {
			this.urlPrefix = this.$API.common.remoteAvatorOss.url
			this.getGroup()
			this.getDept()
		},
		methods: {
			passwordPercentFormat(percentage) {
				return percentage == 30 ? '弱' : percentage == 60 ? '中' : percentage == 100 ? '强' : '弱'
			},
			pwdColorF(percentage) {
				return percentage == 30 ? '#FF5340' : percentage == 60 ? '#FFB640' : percentage == 100 ? '#25DC1B' : '#FF5340'
			},
			//显示
			open(mode='add'){
				this.mode = mode;
				this.visible = true;
				return this
			},
			//加载树数据
			async getGroup(){
				var res = await this.$API.system.role.list.get();
				this.roleGroups = res.data;
			},
			async getDept(){
				var res = await this.$API.system.dept.tree.get();
				this.depts = res.data;
			},
			//表单提交方法
			submit(){
				this.$refs.dialogForm.validate(async (valid) => {
					if (valid) {
						this.isSaveing = true;
						const _v = this.$TOOL.string.getRandomString(16);
						const _form = this.$TOOL.objCopy(this.form);
						var res = {};
						if(this.mode === 'add') {
							_form.userSeRan = this.$TOOL.crypto.BASE64.encrypt(this.$TOOL.crypto.BASE64.encrypt(_v));
							_form.userPassword = this.$TOOL.crypto.AES.encrypt(this.form.userPassword, _v)
							res = await this.$API.system.user.save.post(_form);
						} else {
							delete _form.userPassword
							res = await this.$API.system.user.update.put(_form);
							res.data = this.form;
						}
						this.isSaveing = false;
						if(res.code == '00000'){
							this.$emit('success', res.data, this.mode)
							this.visible = false;
							this.$notify.success({title: '提示', message: '操作成功'})
						} else {
							this.$notify.error({title: '提示', message: res.msg})
						}
					}else{
						return false;
					}
				})
			},
			//表单注入数据
			setData(data){
				//可以和上面一样单个注入，也可以像下面一样直接合并进去
				Object.assign(this.form, data);
				const tpl = [];
				if(this.form.roleId) {
					this.form.roleId.split(',').forEach(it => tpl.push(~~it));
				}
				this.form.roleId =  tpl;
			}
		}
	}
</script>

<style>
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
