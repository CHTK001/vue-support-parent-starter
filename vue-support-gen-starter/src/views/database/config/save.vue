<template>
	<el-dialog :title="titleMap[mode]" v-model="visible" :width="700"  destroy-on-close @closed="$emit('closed')" draggable>
		<el-form :model="form" :rules="rules" :disabled="mode == 'show'" ref="dialogForm" label-width="150px"
			label-position="left">
			<el-form-item label="数据库名称" prop="dbcName">
				<el-input v-model="form.dbcName" clearable></el-input>
			</el-form-item>

			<el-form-item label="数据库类型" prop="dbcType">
				<el-select v-model="form.dbcType" placeholder="">
					<el-option value="JDBC" label="JDBC">
						<span>JDBC</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">标准的JDBC数据库</span>
					</el-option>
					<el-option value="REDIS" label="REDIS"></el-option>
					<el-option value="FTP" label="FTP"></el-option>
					<el-option value="SFTP" label="SFTP"></el-option>
					<el-option value="CALCITE" label="CALCITE">
						<span>CALCITE</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">文件数据库, 包含Excel, Csv, Tsv, Bcp等</span>
					</el-option>
				</el-select>
			</el-form-item>

			<el-form-item label="数据库文件类型" prop="dbcDatabase" v-if="form.dbcType">
				<el-select v-model="form.dbcDatabase" placeholder="">
					<el-option v-if="databaseType[form.dbcType] =='FILE'" value="FILE" label="FILE">
						<span>FILE</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">文件类型数据库(需要上传数据库文件)</span>
					</el-option>
					<el-option v-else value="NONE" label="NONE">
						<span>NONE</span>
						<span class="el-form-item-msg" style="margin-left: 10px;">非文件类型数据库</span>
					</el-option>
				</el-select>
			</el-form-item>

			<el-form-item v-if="form.dbcType != 'CALCITE'" label="驱动列表" prop="dbcDriver">
				<el-input v-model="form.dbcDriver" clearable type="textarea" placeholder="com.mysql.cj.jdbc.Driver"></el-input>
				<div class="el-form-item-msg">多个逗号分割</div>
			</el-form-item>

			<el-form-item label="是否开启日志" prop="dbcLog">
				<el-switch  v-model="form.dbcLog" clearable ></el-switch>
				<div class="el-form-item-msg">是否开启日志</div>
			</el-form-item>

			<el-form-item label="驱动下载地址" prop="dbcDriverLink">
				<el-input v-model="form.dbcDriverLink" clearable placeholder="https://archiva-maven-storage-prod.oss-cn-beijing.aliyuncs.com/repository/central/mysql/mysql-connector-java/8.0.30/mysql-connector-java-8.0.30.jar?Expires=1695912654&OSSAccessKeyId=LTAIfU51SusnnfCC&Signature=rZ7nYH3oWgUa6phzVnKdB%2FiKxuU%3D"></el-input>
				<div class="el-form-item-msg">驱动下载地址(可下载jar的地址)</div>
			</el-form-item>

			<sc-form-table ref="tableInner" v-model="dbcConsoleUrlTable" :addTemplate="addTemplate" drag-sort placeholder="暂无数据" style="top: 10px">
				<el-table-column prop="name" label="名称" >
					<template #default="scope">
						<el-input v-model="scope.row.name"></el-input>
					</template>
				</el-table-column>
				<el-table-column prop="url" label="地址" >
					<template #default="scope">
						<el-select v-model="scope.row.url" :filterable="true" :allow-create="true">
							<el-option :value="item.url" :label="item.name" v-for="item in web[form.dbcType]"></el-option>
						</el-select>
					</template>
				</el-table-column>
			</sc-form-table>

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
			databaseType:{
				CALCITE: 'FILE',
			},
			web: {
				JDBC: [{
					name: 'JDBC控制台',
					url: '/ext/jdbc/console'
				},{
					name: '日志',
					url: '/ext/jdbc/log'
				},{
					name: '文档',
					url: '/ext/jdbc/doc'
				},{
					name: 'web',
					url: '/ext/jdbc/board'
				}],
				CALCITE: [{
					name: 'JDBC控制台',
					url: '/ext/jdbc/console'
				},{
					name: 'web',
					url: '/ext/jdbc/board'
				}],
				REDIS: [{
					name: 'REDIS控制台',
					url: '/ext/redis/console'
				}],
				SFTP: [{
					name: 'SFTP控制台',
					url: '/ext/ftp/console'
				}],
				FTP: [{
					name: 'FTP控制台',
					url: '/ext/ftp/console'
				}],
			},
			addTemplate: {
				name: '',
				url: '',
			},
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
			},
			dbcConsoleUrlTable: [],
			//表单数据
			form: {
				dbcType: 'JDBC',
				dbcDatabase: 'NONE',
				genUser: 'root',
				genPassword: 'root'
			},
			//验证规则
			rules: {
				dbcName: [
					{ required: true, message: '请输入数据库名称' }
				],
				genUrl: [
					{ required: true, message: '请输入数据库地址' }
				],
				dbcType: [
					{ required: true, message: '请选择数据类型' }
				],
				dbcDatabase: [
					{ required: true, message: '请选择数据库类型' }
				]
			}
		}
	},
	watch: {
		'form.dbcType': {
			deep: true,
			immediate: true,
			handler(val) {
				this.form.dbcDatabase = this.databaseType[val] || 'NONE';
			}
		}
	},
	mounted() {
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
		//表单提交方法
		submit() {
			
			this.$refs.dialogForm.validate(async (valid) => {
				if (valid) {
					this.isSaveing = true;
					var res = {};
					var auth = { }
					auth = Object.assign(auth, this.form);
					auth = Object.assign(auth, this.fileForm);
					auth.dbcConsoleUrl = JSON.stringify(this.dbcConsoleUrlTable);
					if (this.mode === 'add') {
						res = await this.$API.gen.dbc.save.post(auth);
					} else if (this.mode === 'edit') {
						res = await this.$API.gen.dbc.update.put(auth);
					}

					this.isSaveing = false;
					if (res.code == '00000') {
						this.form.dbcId = res.data.dbcId;
						this.$emit('success', this.form, this.mode)
						this.visible = false;
					} else {
						this.$notify.error({ title: '提示', message: res.msg })
					}
				}
			})
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
			this.dbcConsoleUrlTable = JSON.parse(data?.dbcConsoleUrl || "[]");
		}
	}
}
</script>

<style></style>
