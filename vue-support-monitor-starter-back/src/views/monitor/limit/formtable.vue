<template>
	<el-main>
		<el-form ref="ruleForm" :model="form.limitRemoteList1" :rules="rules" label-width="100px">
			<el-form-item label="规则" prop="list">
				<sc-form-table ref="table" v-model="form.limitRemoteList1" :addTemplate="addTemplate" drag-sort placeholder="暂无数据">
					<el-table-column prop="model" label="IP模式" >
						<template #default="scope">
							<el-select v-model="scope.row.model" placeholder="请选择">
								<el-option value="range" label="区间模式"></el-option>
								<el-option value="ip" label="IP"></el-option>
							</el-select>
						</template>
					</el-table-column>

					<el-table-column prop="ip" label="IP" >
						<template #default="scope">
							<el-input v-if="scope.row.model == 'ip'" v-model="scope.row.ip" placeholder="请输入内容"></el-input>
							<span v-else>
								<el-input v-model="scope.row.ip1" placeholder="请输入内容"></el-input>
								<span>~</span>
								<el-input v-model="scope.row.ip2" placeholder="请输入内容"></el-input>
							</span>
						</template>
					</el-table-column>
					<el-table-column prop="permits" label="每秒访问次数" >
						<template #default="scope">
							<el-input v-model="scope.row.permits" placeholder="请输入内容"></el-input>
						</template>
					</el-table-column>
				</sc-form-table>
			</el-form-item>
		</el-form>
	</el-main>
</template>

<script>
	export default {
		name: 'formtable',
		props: {
			form: {
				type: Object,
				default: () => {}
			}
		},
		data(){
			return {
				addTemplate: {
					ip: '',
					permits: '',
					model:"ip"
				},
				formList: [],
			}
		},
		methods: {
			submitForm(){
				this.$refs.ruleForm.validate((valid) => {
					if (valid) {
						alert('请看控制台输出');
						console.log(this.form);
					}else{
						return false;
					}
				})
			},
			resetForm(){
				this.$refs.ruleForm.resetFields();
			},
			pushRow(){
				const data = {
					time: '18:00',
					type: '1',
					val: '0',
					open: true,
					checked: true
				}
				this.$refs.table.pushRow(data)
			},
			deleteRow(){
				this.$refs.table.deleteRow(0)
			}
		}
	}
</script>
