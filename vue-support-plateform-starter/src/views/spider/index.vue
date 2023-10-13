<template>
	<el-skeleton :loading="loading" animated>
		<el-container>
			<el-main>
				<el-row :gutter="15">
					<el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in list" :key="item.taskId"
						class="demo-progress">
						<el-card class="task task-item" shadow="hover">
							<h2>{{ item.taskName }} <el-tag>{{ item.createName }}</el-tag></h2>
							<el-row>
								<el-col :span="16">
									<ul>
										<li>
											<h4>任务类型</h4>
											<p>{{ item.taskType }}</p>
										</li>
										<li>
											<h4>任务编号</h4>
											<p>{{ item.taskTid }} </p>
										</li>
									</ul>
								</el-col>
								<el-col :span="8" class="progress">
									<el-progress :stroke-width="10" :striped="true" :striped-flow="true"
										:indeterminate="true" :color="customColor" type="circle"
										:percentage="Math.min(((item.taskCurrent / item.taskTotal) * 100).toFixed(2), 100)">
										<template #default="{ percentage }">
											<span class="percentage-value">{{ percentage }}%</span>
											<span class="percentage-label" v-if="item.taskStatus == 3">正在运行</span>
											<span class="percentage-label" v-if="item.taskStatus == 2">已暂停</span>
											<span class="percentage-label" v-if="item.taskStatus == 1">已完成</span>
											<span class="percentage-label" v-if="item.taskStatus == 0">未开始</span>
										</template>
									</el-progress>
								</el-col>
							</el-row>
							<div class="bottom" v-role="['ADMIN', 'OPS']">
								<div class="state">
									<div v-if="item.taskStatus == 3">
										<el-tag size="small">正在运行 </el-tag>({{ item.taskCurrent }} / {{ item.taskTotal }})
									</div>
									<div v-if="item.taskStatus == 2">
										<el-tag size="small" type="info">已暂停</el-tag>({{ item.taskCurrent }} /
										{{ item.taskTotal }})
									</div>
									<div v-if="item.taskStatus == 1">
										<el-tag  size="small" type="success">已完成</el-tag>
										<el-tag  size="small" >{{ item.taskCost }} ms</el-tag>
									</div>
									<div v-if="item.taskStatus == 0">
										<el-tag size="small" type="info">未开始</el-tag>({{ item.taskCurrent }} /
										{{ item.taskTotal }})
									</div>
								</div>
								<div class="handler">
									<el-popconfirm title="确定立即执行吗？" v-if="item.taskStatus == 2 || item.taskStatus == 0"
										@confirm="run(item)">
										<template #reference="scope">
											<el-button v-if="item.taskStatus == 2 || item.taskStatus == 0" type="primary"
												icon="el-icon-caret-right" circle></el-button>
										</template>
									</el-popconfirm>
									<el-popconfirm title="确定立即暂停吗？" v-if="item.taskStatus == 3" @confirm="onPause(item)">
										<template #reference="scope">
											<el-button v-if="item.taskStatus == 3" type="primary" icon="el-icon-loading"
												circle></el-button>
										</template>
									</el-popconfirm>
									<el-dropdown trigger="click">
										<el-button type="primary" icon="el-icon-more" circle plain></el-button>
										<template #dropdown>
											<el-dropdown-menu>
												<el-dropdown-item v-if="item.taskStatus != 3 || item.taskStatus != 1"
													@click="edit(item)">编辑</el-dropdown-item>
												<el-dropdown-item @click="logs(item)">日志</el-dropdown-item>
												<el-dropdown-item @click="del(item)" divided>删除</el-dropdown-item>
											</el-dropdown-menu>
										</template>
									</el-dropdown>
								</div>
							</div>
						</el-card>
					</el-col>
					<el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24">
						<el-card class="task task-add" shadow="never" @click="add">
							<el-icon><el-icon-plus /></el-icon>
							<p>添加计划任务</p>
						</el-card>
					</el-col>
				</el-row>

			</el-main>
			<el-footer style="height: 51px; line-height: 50px; padding:0">
				<scPagintion :pageSize="form.size" :total="total"  @dataChange="doSearch"></scPagintion>
			</el-footer>
		</el-container>
	</el-skeleton>
	<save-dialog v-if="dialog.save" ref="saveDialog" @success="handleSuccess" @closed="dialog.save = false"></save-dialog>

	<el-drawer title="计划任务日志" v-model="dialog.logsVisible" :size="600" direction="rtl" destroy-on-close>
		<logs></logs>
	</el-drawer>
</template>

<script>
import saveDialog from './save.vue'
import logs from './logs.vue'

export default {
	name: 'task',
	components: {
		saveDialog,
		logs
	},
	provide() {
		return {
			list: this.list
		}
	},
	data() {
		return {
			loading: false,
			form: {
			},
			total: 0,
			dialog: {
				save: false,
				logsVisible: false
			},
			list: [],
			customColor: [
				{ color: '#f56c6c', percentage: 20 },
				{ color: '#e6a23c', percentage: 40 },
				{ color: '#5cb87a', percentage: 60 },
				{ color: '#1989fa', percentage: 80 },
				{ color: '#6f7ad3', percentage: 100 },
			],
		}
	},
	mounted() {
		this.subscribe('sdsakhj29c4454aJJRLSSd23')
		this.doSearch();
	},
	methods: {
		async doSearch(conf) {
			this.loading = true;
			if(conf) {
				this.form.current = conf.page;
				this.form.size = conf.pageSize;
			}
			this.$API.system.tasks.page.get(this.form).then((res) => {
				if (res.code === '00000') {
					this.list = res.data.data;
					this.total = res.data.total
				} else {
					this.$notify.error({ title: '提示', message: res.msg })
				}
			}).finally(() => {
				this.loading = false
			})
		},
		subscribe: function (taskTid) {
			const _this = this;
			const eventSource = new EventSource(this.$API.system.tasks.subscribe.url + "?taskTid=" + taskTid);
			eventSource.onmessage = function (event) {
				const data = JSON.parse(event.data);
				if (data.type === 'PROCESS') {
					_this.list.forEach(item => {
						if (item.taskTid === data.tid) {
							item.taskCurrent = ~~data.message;
							if (item.taskCurrent >= item.taskTotal) {
								item.taskStatus = 1
							}
						}
					})
				} else if (data.type === 'FINISH') {
					_this.list.forEach(item => {
						if (item.taskTid === data.tid) {
							item.taskCost = ~~data.message;
						}
					})
				} else if (data.type === 'NOTIFY') {
					_this.$notify.success({ title: '提示', message: data.message })
				} else if (data.type === 'NOTIFY_HTML') {
					_this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: data.message })
				}
			};
			eventSource.onerror = function (event) {
				// 处理过错
			};
			eventSource.onopen = function (event) {
				_this.$notify.success({ title: '提示', dangerouslyUseHTMLString: true, message: '订阅成功' })
			};
		},
		add() {
			this.dialog.save = true
			this.$nextTick(() => {
				this.$refs.saveDialog.open()
			})
		},
		edit(task) {
			this.dialog.save = true
			this.$nextTick(() => {
				this.$refs.saveDialog.open('edit').setData(task)
			})
		},
		onPause: function (row) {
			this.$API.system.tasks.pause.post(row).then(res => {
				if (res.code === '00000') {
					this.$notify.success({ title: '提示', message: res.msg });
					row.taskStatus = 2
				} else {
					this.$notify.error({ title: '提示', message: res.msg })
				}
			}).finally(() => { })
		},
		del(row) {
			this.$confirm(`确认删除 ${row.taskName} 计划任务吗？`, '提示', {
				type: 'warning',
				confirmButtonText: '删除',
				confirmButtonClass: 'el-button--danger'
			}).then(() => {
				this.$API.system.tasks.delete.delete({ taskTid: row.taskTid }).then(res => {
					if (res.code !== '00000') {
						this.$notify.error({ title: '提示', message: res.msg })
						return !1;
					}
					this.total = this.total - 1;
					this.list.splice(this.list.findIndex(item => item.taskId === row.taskId), 1)
				});
			}).catch(() => {
				//取消
			})
		},
		logs() {
			this.dialog.logsVisible = true
		},
		run(row) {
			this.$API.system.tasks.run.get(row).then(res => {
				let type = 'success';
				if (res.code !== '00000') {
					type = 'error';
				} else {
					row.taskStatus = 3;
				}
				this.$notify({
					title: '消息提示',
					type: type,
					message: res.msg
				});
			}).finally(() => { })
		},
		//本地更新数据
		handleSuccess(data, mode) {
			if (mode == 'add') {
				this.total = this.total + 1;
				data.id = new Date().getTime();
				const l = this.list.filter(item => item.taskId === data.taskId);
				if (l.length > 0) {
					l.forEach(item => {
						Object.assign(item, data)
					})
				} else {
					this.list.push(data)
				}
			} else if (mode == 'edit') {
				this.list.filter(item => item.taskId === data.taskId).forEach(item => {
					Object.assign(item, data)
				})
			}
		},
		handleSizeChange: function (e) {
			this.form.size = e;
			this.doSearch();
			return !1;
		},
		handleCurrentChange: function (e) {
			this.form.current = e;
			this.doSearch();
			return !1;
		},
	}
}
</script>

<style scoped>
.task {
	height: 210px;
}

.task-item h2 {
	font-size: 15px;
	color: #3c4a54;
	padding-bottom: 15px;
}

.task-item li {
	list-style-type: none;
	margin-bottom: 10px;
}

.task-item li h4 {
	font-size: 12px;
	font-weight: normal;
	color: #999;
}

.task-item li p {
	margin-top: 5px;
}

.task-item .bottom {
	border-top: 1px solid #EBEEF5;
	text-align: right;
	padding-top: 10px;
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.task-add {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	text-align: center;
	cursor: pointer;
	color: #999;
}

.task-add:hover {
	color: #409EFF;
}

.task-add i {
	font-size: 30px;
}

.task-add p {
	font-size: 12px;
	margin-top: 20px;
}

.dark .task-item .bottom {
	border-color: var(--el-border-color-light);
}

.progress {
	margin-top: -45px
}

.percentage-value {
	display: block;
	margin-top: 10px;
	font-size: 18px;
}

.percentage-label {
	display: block;
	margin-top: 10px;
	font-size: 12px;
}

.demo-progress .el-progress--line {
	margin-bottom: 15px;
	width: 350px;
}

.demo-progress .el-progress--circle {
	margin-right: 15px;
}</style>
