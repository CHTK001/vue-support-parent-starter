<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="500" destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="100px"
			label-position="left">
			<el-form-item label="类型" prop="dbcId">
				<el-select v-model="form.dbcId" placeholder="" clearable>
					<el-option :value="item.dbcId" :label="item.dbcName" v-for="item in support">
						<el-icon style="font-size: 20px; position: relative; top: 5px" :title="item.dbcName">
							<component :is="'sc-icon-' + item.dbcName?.toLowerCase()" circle />
						</el-icon>
						<span>
							{{ item.dbcName }}
						</span>
					</el-option>
				</el-select>
			</el-form-item>
			<div v-if="form.dbcId">
				<el-form-item label="配置名称" prop="genName">
					<el-input v-model="form.genName" clearable></el-input>
				</el-form-item>

				
				<el-form-item label="数据源名称" v-if="(status[supportJdbc[form.dbcId]] || []).indexOf('genDatabase') == -1">
					<el-input v-model="form.genDatabase"></el-input>
				</el-form-item>


				<div v-if="supportType[form.dbcId] == 'REMOTE'">
					<el-form-item label="访问地址" v-if="needProtocol(supportJdbc[form.dbcId])">
						<el-col :span="6">
							<el-select v-model="form.protocol" placeholder="" clearable>
								<el-option v-for="item in (protocol[supportJdbc[form.dbcId]] || [])" :value="item">
								</el-option>
							</el-select>
						</el-col>
						<el-col :span="12" >
							<el-input v-model="form.genHost"></el-input>
						</el-col>
						<el-col :span="6">
							<el-input v-model="form.genPort" type="number" ></el-input>
						</el-col>
					</el-form-item>
					<el-form-item label="访问地址" v-else>
						<el-col :span="18" >
							<el-input v-model="form.genHost"></el-input>
						</el-col>
						<el-col :span="6">
							<el-input v-model="form.genPort" type="number" ></el-input>
						</el-col>
					</el-form-item>
				</div>
				

				<el-form-item v-else-if="supportType[form.dbcId] != 'FILE' && supportJdbc[form.dbcId] != 'CALCITE'" label="访问地址" prop="genUrl">
					<el-input v-model="form.genUrl"></el-input>
				</el-form-item>

				<el-form-item v-else label="访问地址" >
					<el-input v-model="form.genUrl"></el-input>
				</el-form-item>
				
				<el-form-item v-if="supportJdbc[form.dbcId] == 'JDBC'" label="数据库驱动" prop="genDriver">
					<el-select v-model="form.genDriver" placeholder="" >
						<el-option :value="item" :label="item" v-for="item in supportDriver[form.dbcId]"></el-option>
					</el-select>
				</el-form-item>

				<el-form-item label="访问账号" prop="genUser">
					<el-input v-model="form.genUser" clearable></el-input>
				</el-form-item>

				<el-form-item label="访问密码" prop="genPassword">
					<el-input v-model="form.genPassword" type="password" clearable show-password> </el-input>
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
			protocol: {
				ES: ['http', "https"],
				ELASTICSEARCH: ['http', "https"],
			},
			status: {
				SSH: ['genDatabase'],
				FTP: ['genDatabase'],
				SFTP: ['genDatabase'],
				REDIS: ['genDatabase'],
				ZOOKEEPER: ['genDatabase'],
				NGINX: ['genDatabase'],
				ES: ['genDatabase'],
				ELASTICSEARCH: ['genDatabase'],
			},
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
					{ required: true, message: '请输入访问地址' }
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

				if(this.mode === 'add') {
					this.form.genHost = '127.0.0.1';
					if(this.supportJdbc[nv] == 'SSH' || this.supportJdbc[nv] == 'SFTP' || this.supportJdbc[nv] == 'NGINX') {
						this.form.genPort = 22;
					}
					if(this.supportJdbc[nv] == 'FTP') {
						this.form.genPort = 21;
					}

					if(this.supportJdbc[nv] == 'REDIS') {
						this.form.genPort = 6379;
					}

					if(this.supportJdbc[nv] == 'ZOOKEEPER') {
						this.form.genPort = 2181;
					}
					if(this.supportJdbc[nv] == 'ELASTICSEARCH' || this.supportJdbc[nv] == 'ES') {
						this.form.genPort = 9200;
					}
				}
			}
		}
	},
	mounted() {
		this.initial();
	},
	methods: {
		needProtocol(p) {
			return p == 'ES' || p == 'ELASTICSEARCH';
		},
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
			if(this.isRemote(this.supportJdbc[this.form.dbcId])) {
				if(this.needProtocol(this.supportJdbc[this.form.dbcId])) {
					this.form.genUrl = this.form.protocol + "://" + this.form.genHost + ':' + this.form.genPort;
				} else {
					this.form.genUrl = this.form.genHost + ':' + this.form.genPort;
				}
			}
			
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
		isRemote(val) {
			return val == 'FTP' || 
			val == 'SFTP' || 
			val == 'HTTP' || 
			val == 'HTTPS' || 
			val == 'HDFS' || 
			val == 'REDIS' || 
			val == 'MQTT' || 
			val == 'KAFKA' || 
			val == 'KUDU' || 
			val == 'NGINX' || 
			val == 'HIVE' || 
			val == 'HBASE' || 
			val == 'ES' || 
			val == 'SSH' ||
			val == 'ELASTICSEARCH' ||
			val == 'ZOOKEEPER'
			;
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			if(this.form.genUrl) {
				this.form.genHost = this.form.genUrl.split(':')[0];
				this.form.genPort = this.form.genUrl.split(':')[1];
			}
		}
	}
}
</script>

<style></style>
