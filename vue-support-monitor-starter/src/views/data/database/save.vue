<template>
	<el-dialog :title="title" v-model="visible" :width="700" destroy-on-close @closed="$emit('closed')" draggable @close="close">
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px" label-position="left">
			<el-form-item label="数据库名称" prop="genName">
				<el-input v-model="form.genName" clearable placeholder="请输入数据库名称"></el-input>
			</el-form-item>

			<el-form-item label="数据库类型" prop="genJdbcCustomType">
				<el-radio-group v-model="form.genJdbcCustomType">
					<el-radio-button label="JDBC" value="JDBC" />
					<el-radio-button label="FILE" value="FILE" >文件</el-radio-button>
				</el-radio-group>
			</el-form-item>

			<el-form-item label="访问地址" prop="genHost" v-if="form.genJdbcCustomType != 'FILE'">
				<el-col :span="18" prop="genHost">
					<el-input v-model="form.genHost" placeholder="请输入访问地址" />
				</el-col>
				<el-col :span="6" prop="genPort">
					<el-input v-model="form.genPort" type="number" placeholder="请输入端口"></el-input>
				</el-col>
			</el-form-item>

			<el-form-item label="访问账号" prop="genUser">
				<el-input v-model="form.genUser" clearable placeholder="请输入访问账号"></el-input>
			</el-form-item>

			<el-form-item label="访问密码" prop="genPassword" style="position: relative;">
				<el-input v-model="form.genPassword" type="password" clearable show-password placeholder="请输入访问密码"> </el-input>
				<el-icon @click="() => { delete form.genPassword; $message.success('删除成功') }" style="cursor: pointer; position: absolute; left: -15px" title="删除密码">
					<component is="el-icon-delete" />
				</el-icon>
			</el-form-item>


			<el-form-item label="数据库名称" prop="genDatabase" v-if="form.genJdbcCustomType != 'FILE'">
				<el-input v-model="form.genDatabase" clearable placeholder="请输入数据库名称"></el-input>
			</el-form-item>
			<el-form-item label="数据库驱动" prop="genDriver">
				<el-input v-model="form.genDriver" clearable placeholder="请输入数据库名称, 例如: com.mysql.cj.jdbc.Driver">
					<template #append>
						<el-select v-model="form.genDriver" placeholder="驱动" style="width: 115px">
							<el-option label="Mysql" v-if="form.genJdbcCustomType != 'FILE'" value="com.mysql.cj.jdbc.Driver" />
							<el-option label="Sqlite" value="org.sqlite.JDBC" />
							<el-option label="H2" value="org.h2.Driver" />
							<el-option label="Access" value="net.ucanaccess.jdbc.UcanaccessDriver" />
							<el-option label="Postgresql" v-if="form.genJdbcCustomType != 'FILE'" value="org.postgresql.Driver" />
							<!-- <el-option label="ucanaccess" v-if="form.genJdbcCustomType != 'FILE'" value="net.ucanaccess.jdbc.UcanaccessDriver" /> -->
						</el-select>
					</template>
				</el-input>
			</el-form-item>

			<el-form-item label="数据库说明" prop="genDesc">
				<el-input v-model="form.genDesc" clearable placeholder="请输入数据库说明"></el-input>
			</el-form-item>

			<el-form-item label="备份时间" prop="genBackupPeriod" v-if="form.genJdbcCustomType != 'FILE'">
				<el-input v-model="form.genBackupPeriod" clearable placeholder="请输入数据库备份时间" type="number"></el-input>
			</el-form-item>

			<el-form-item label="备份事件" prop="genBackupEvent" v-if="form.genJdbcCustomType != 'FILE'">
				<el-select v-model="form.genBackupEvent" placeholder="请选择数据库备份事件" multiple style="width: 100%">
					<el-option label="更新" value="UPDATE" />
					<el-option label="删除" value="DELETE" />
					<el-option label="新增" value="CREATE" />
				</el-select>
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

export default {
	emits: ['success', 'closed'],
	data() {
		return {
			visible: false,
			isSaveing: false,
			configList: [],
			title: '',
			mode: '',
			//表单数据
			form: {
				genPort: 3306
			},
			//验证规则
			rules: {
				genName: [
					{ required: true, message: '请输入数据库名称' }
				],
				genHost: [
					{ required: true, message: '请输入访问地址' }
				],
				genDriver: [
					{ required: true, message: '请选择数据库驱动' }
				],
				genType: [
					{ required: true, message: '请选择数据库类型' }],
				genJdbcCustomType: [
					{ required: true, message: '请选择数据库类型' }
				],
			},
		}
	},
	watch:{
		"form.genJdbcCustomType": {
			immediate: !0,
			handler(val) {
				if(val == 'FILE'){
					delete this.rules.genUser;
					delete this.rules.genDatabase;
				} else {
					this.rules.genUser = [{ required: true, message: '请输入访问账号' }];
					this.rules.genDatabase = [{ required: true, message: '请输入数据库名称' }];
				}
			}
		}
	},
	mounted() {
	},
	methods: {
		//显示
		open(mode = 'add') {
			this.mode = mode;
			if (mode == 'add') {
				this.title = '新增';
			}
			this.visible = true;
			return this
		},
		close() {
			this.isSaveing = false;
			this.visible = false;
		},
		//表单提交方法
		submit() {
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					const _v = this.$TOOL.string.getRandomString(16);
					var auth = {};
					var newPassword;
					if (this.form.genPassword) {
						newPassword = this.$TOOL.crypto.BASE64.encrypt(
							this.$TOOL.crypto.sm4.encrypt(this.form.genPassword, _v)
						)
						this.form.genUid = _v;
					}
					auth = Object.assign(this.form, auth);
					auth = Object.assign(auth, this.fileForm);
					auth.genType = 'JDBC';
					auth.genPassword = newPassword;
					try {
						if (this.mode === 'add') {
							res = await this.$API.gen.database.save.post(auth);
						} else if (this.mode === 'edit') {
							res = await this.$API.gen.database.update.put(auth);
						}
					} catch (error) {

					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.genId = this.form.genId || res.data.genId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
						delete this.form.genPassword;
					} else {
						this.isSaveing = false;
					}
				}
			})
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			if (this.mode == 'edit') {
				this.title = '修改' + this.form.genName;
				this.form.genBackupEvent = !this.form.genBackupEvent ? null : this.form.genBackupEvent.split(',');
				this.form.genPassword =
					this.$TOOL.crypto.AES.decrypt(this.$TOOL.crypto.BASE64.decrypt(this.form.genPassword), this.form.genUid);
				return;
			}

			if (this.mode == 'add') {
				this.form = {};
				this.form.genPort = 3306;
				this.form.genJdbcType = 'JDBC';
				this.form.genHost = '127.0.0.1';
			}
		}
	}
}
</script>

<style></style>
