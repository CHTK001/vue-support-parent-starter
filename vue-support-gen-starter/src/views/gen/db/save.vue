<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" top="10px" destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">
			<el-form-item label="名称" prop="genName">
				<el-input v-model="form.genName" clearable></el-input>
			</el-form-item>

			<el-form-item label="数据库名称">
				<el-input v-model="form.genDatabase"></el-input>
			</el-form-item>

			<el-form-item label="数据库账号" prop="genUser">
				<el-input v-model="form.genUser" clearable></el-input>
			</el-form-item>
			<el-form-item v-if="supportType[form.genType] != 'FILE'" label="数据库URL" prop="genUrl">
				<el-input v-model="form.genUrl"></el-input>
			</el-form-item>
			<el-form-item label="数据库类型" prop="genType">
				<el-select v-model="form.genType" placeholder="">
					<el-option :value="item.type" :label="item.name" v-for="item in support"></el-option>
				</el-select>
			</el-form-item>
			<el-form-item label="数据库驱动" prop="genDriver">
				<el-select v-model="form.genDriver" placeholder="" >
					<el-option :value="item" :label="item" v-for="item in supportDriver[form.genType]"></el-option>
				</el-select>
			</el-form-item>
			<el-form-item label="数据库密码" prop="genPassword">
				<el-input v-model="form.genPassword" type="password"></el-input>
			</el-form-item>
			<el-form-item v-if="supportType[form.genType] == 'FILE'" label="文件" prop="genDriver">
				<el-upload class="upload-demo" action="none" :on-change="handleChangeDatabaseFile" :auto-upload="false" drag>
					<template #trigger>
						<el-button type="primary" size="small">选择数据文件</el-button>
					</template>
				</el-upload>

			</el-form-item>
			<el-form-item label="驱动包" prop="genDriver">
				<el-upload class="upload-demo" action="none" accept=".jar" :on-change="handleChangeDriver" drag :auto-upload="false">
					<template #trigger>
						<el-button type="primary" size="small">选择驱动包</el-button>
					</template>
					<template #tip>
						<div class="el-upload__tip">
							当前仅支持jar
						</div>
					</template>
				</el-upload>

			</el-form-item>
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
				genType: 'MYSQL',
				genUrl: 'jdbc:mysql://127.0.0.1:3306/config',
				genUser: 'root',
				genPassword: 'root'
			},
			//验证规则
			rules: {
				genUser: [
					{ required: true, message: '请输入账号', }
				],
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
		'form.genType': {
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
			const res = await this.$API.gen.database.support.get();
			if (res.code == '00000') {
				this.support = res.data;
				this.supportInfo = {};
				this.supportType = {};
				this.supportLog = {};
				this.supportJdbc = {};
				for(const item of this.support) {
					this.supportDriver[item.type] = item.driver;
					this.supportType[item.type] = item.database;
					this.supportLog[item.type] = item.log;
					this.supportJdbc[item.type] = item.jdbcType;
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
