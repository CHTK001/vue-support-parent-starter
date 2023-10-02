<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">
			<el-form-item label="数据库类型" prop="dbcId">
				<el-select v-model="form.dbcId" placeholder="" clearable>
					<el-option :value="item.dbcId" :label="item.dbcName" v-for="item in support"></el-option>
				</el-select>
			</el-form-item>

			<div v-if="form.dbcId">
				<el-form-item label="名称" prop="genName">
					<el-input v-model="form.genName" clearable></el-input>
				</el-form-item>

				<el-form-item label="数据库名称">
					<el-input v-model="form.genDatabase"></el-input>
				</el-form-item>

				<el-form-item label="数据库账号" prop="genUser">
					<el-input v-model="form.genUser" clearable></el-input>
				</el-form-item>

				<el-form-item v-if="supportType[form.dbcId] != 'FILE' && supportJdbc[form.dbcId] != 'CALCITE'" label="数据库URL" prop="genUrl">
					<el-input v-model="form.genUrl"></el-input>
				</el-form-item>
				<el-form-item v-else label="数据库URL">
					<el-input v-model="form.genUrl"></el-input>
				</el-form-item>
				
				<el-form-item v-if="supportJdbc[form.dbcId] == 'JDBC'" label="数据库驱动" prop="genDriver">
					<el-select v-model="form.genDriver" placeholder="" >
						<el-option :value="item" :label="item" v-for="item in supportDriver[form.dbcId]"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="数据库密码" prop="genPassword">
					<el-input v-model="form.genPassword" type="password" clearable></el-input>
				</el-form-item>
			</div>
		</el-form>
		<template #footer>
			<el-button @click="visible = false">取 消</el-button>
			<el-button v-if="mode != 'show'" type="primary" :loading="isSaveing" @click="submit()">保 存</el-button>
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
				add: '新增',
				edit: '编辑',
				show: '查看'
			},
			support:[],
			supportDriver: {},
			supportType: {},
			supportLog: {},
			supportJdbc: {},
			visible: false,
			isSaveing: false,
			fileForm: {
				genDriverFile: null,
				getDatabaseFile: null
			},
			//表单数据
			form: {
				genUser: 'root',
				genPassword: 'root'
			},
			//验证规则
			rules: {
				genName: [
					{ required: true, message: '请输入数据库名称' }
				],
				genUrl: [
					{ required: true, message: '请输入数据库地址' }
				],
				genDriver: [
					{ required: true, message: '请选择数据库驱动' }
				],
				genType: [
					{ required: true, message: '请选择数据库类型' }
				],
			}
		}
	},
	watch:{
		'form.dbcId': {
			immediate: !0,
			deep: !0,
			handler(nv, ov) {
				try{
					this.form.genDriver = this.supportDriver[nv][0];
				}catch(e){}
				try{
					this.form.genDatabaseType = this.supportType[nv];
				}catch(e){}
			}
		}
	},
	mounted() {
		this.initial();
	},
	methods: {
		//显示
		open(mode = 'add') {
			this.mode = mode;
			this.visible = true;
			return this
		},
		handleChangeDriver(file, fileList) { 
			this.fileForm.genDriverFile = file.raw;
		},
		handleChangeDatabaseFile(file, fileList) { 
			this.fileForm.getDatabaseFile = file.raw;
		},
		handleChangeDatabase(file, fileList) { 			
			this.fileForm.getDatabaseFile = file.raw;
		},
		async initial(){
			const res = await this.$API.gen.dbc.support.get();
			if (res.code == '00000') {
				this.support = res.data;
				this.supportInfo = {};
				this.supportType = {};
				this.supportLog = {};
				this.supportJdbc = {};
				for(const item of this.support) {
					this.supportDriver[item.dbcId] = item.dbcDriver?.split(',');
					this.supportType[item.dbcId] = item.dbcDatabase;
					this.supportLog[item.dbcId] = item.dbcLog;
					this.supportJdbc[item.dbcId] = item.dbcType;
				}
			} else {
				this.$notify.error({ title: '提示', message: res.msg })
			}
		},
		//表单提交方法
		submit() {
			
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					const _v = this.$TOOL.string.getRandomString(16);
					var auth = { genPassword: this.$TOOL.crypto.BASE64.encrypt(this.$TOOL.crypto.AES.encrypt(JSON.stringify(this.form.genPassword), _v)) }
					this.form.genUid = _v;
					auth = Object.assign(auth, this.form);
					auth = Object.assign(auth, this.fileForm);
					if (this.mode === 'add') {
						res = await this.$API.gen.database.save.post(auth);
					} else if (this.mode === 'edit') {
						res = await this.$API.gen.database.update.put(auth);
					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.genId = this.form.genId || res.data.genId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
						delete this.form.genPassword;
					} else {
						this.$notify.error({ title: '提示', message: res.msg })
					}
				}
			})
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
