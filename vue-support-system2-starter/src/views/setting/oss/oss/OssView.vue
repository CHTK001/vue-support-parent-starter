<template>
	<el-skeleton :loading="loading" animated>
		<el-row :gutter="15">
			<el-col :xl="6" :lg="6" :md="8" :sm="12" :xs="24" v-for="item in list" :key="item.taskId" class="demo-progress">
				<el-card class="task task-item" shadow="hover">
					<h2>{{ item.taskName }} </h2>
					<el-row>
						<el-col :span="16">
							<ul>
								<li>
									<h4>任务类型</h4>
									<p>{{ item.taskType }}</p>
								</li>
								<li>
									<h4>任务编号</h4>
									<p>{{ item.taskTid }}</p>
								</li>
							</ul>
						</el-col>
						<el-col :span="8" class="progress">
							<el-progress :stroke-width="10" :striped="true" :striped-flow="true" :indeterminate="true"
								:color="customColor" type="circle"
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
					<div class="bottom">
						<div class="state">
							<div v-if="item.taskStatus == 3">
								<el-tag size="small">正在运行 </el-tag>({{ item.taskCurrent }} / {{ item.taskTotal }})
							</div>
							<div v-if="item.taskStatus == 2">
								<el-tag size="small" type="info">已暂停</el-tag>({{ item.taskCurrent }} /
								{{ item.taskTotal }})
							</div>
							<el-tag v-if="item.taskStatus == 1" size="small" type="success">已完成</el-tag>
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

		
	</el-skeleton>
</template>
<script>
export default {
	name: "OssView",
	props: {
		datas: { type: Object, default: () => { } },
	},
	data() {
		return {
			loading: false,
			total: 0,
			data: [],
			form: {
				size: 20
			}
		}
	},
	watch: {
		datas: {
			handler(nv, ov) {
				if (nv) {
					this.total = nv.total;
					this.data = nv.data;
				}
			},
			immediate: true,
			deep: true
		}
	},
	mounted() {
	},
	methods: {
	},

}
</script>
<style scoped lang="less"></style>