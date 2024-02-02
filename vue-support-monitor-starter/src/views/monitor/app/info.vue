<template>
	<el-dialog :title="title" v-model="visible" width="600" style="background-color: #eff5fd;" destroy-on-close @closed="$emit('closed')" draggable>
		<div class="px-4 py-5 border-b rounded-t sm:px-6">
				<div class="overflow-hidden bg-white shadow dark:bg-gray-800 sm:rounded-md">
					<ul class="divide-y divide-gray-200">
						<li v-for="item in form">
							<a class="block hover:bg-gray-50 dark:hover:bg-gray-900">
								<div class="px-4 py-4 sm:px-6">
									<div class="flex items-center justify-between">
										<p class="text-gray-700 text-md dark:text-white md:truncate">
											服务应用<el-tag style=" margin-left: 10px; ">{{ item.appName }}</el-tag>
										</p>
										<div class="flex flex-shrink-0 ml-2">
											<p class="inline-flex px-2 text-xs font-semibold leading-5 text-green-800 bg-green-100 rounded-full">
												{{ item.profile }}
											</p>
											<el-icon title="在线"><component is="sc-icon-online" /></el-icon>
										</div>
									</div>
									<div class="mt-2 sm:flex sm:justify-between">
										<div class="sm:flex">
											<p class="flex items-center font-light text-gray-500 text-md dark:text-gray-300">
												<a title="服务器地址" style=" margin-left: 10px; padding-top: -13px" target="_blank" :href="'http://' + item.serverHost +':'+ item.serverPort + item.contextPath">
													<el-icon><component is="el-icon-eleme-filled" /></el-icon>
												</a>
												<a title="监控地址"  style=" margin-left: 10px; padding-top: -13px" target="_blank" :href="'http://' + item.serverHost +':'+ item.serverPort + item.contextPath+ item.endpointsUrl">
													<el-icon><component is="sc-icon-monitor" /></el-icon>	
												</a>
												<a class="cursor-pointer" title="日志"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenLog(item)">
													<el-icon><component is="sc-icon-log" /></el-icon>	
												</a>
												<a class="cursor-pointer" title="环境"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenEnv(item)">
													<el-icon><component is="sc-icon-env" /></el-icon>	
												</a>
											</p>
										</div>
									</div>
								</div>
							</a>
						</li>
					
					</ul>
				</div>
			</div>
	</el-dialog>

	<log-dialog ref="logDialogRef" :visible.sync="logDialogVisible"  />
	<env-dialog ref="envDialogRef" :visible.sync="envDialogVisible"  />
</template>

<script>
import LogDialog from './log.vue'
import EnvDialog from './env.vue'
import pinyin from 'js-pinyin'
import Base64 from "@/utils/base64";

export default {
	emits: ['success', 'closed'],
	components: {LogDialog, EnvDialog},
	data() {
		return {
			logDialogVisible: false,
			envDialogVisible: false,
			visible: false,
			isSaveing: false,
			configList: [],
			title: '详情',
			mode: '',
			form:[]
		}
	},
	mounted() {
	},
	methods: {
		doOpenLog(item){
			this.logDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.logDialogRef.open(item);
			})
		},
		doOpenEnv(item){
			this.envDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.envDialogRef.open(item);
			})
		},
		//显示
		open(mode = 'add') {
			this.mode = mode;
			if(mode == 'add') {
				this.title = '新增';
			}
			this.visible = true;
			return this
		},
		//表单注入数据
		setData(data) {
			//可以和上面一样单个注入，也可以像下面一样直接合并进去
			Object.assign(this.form, data);
		}
	}
}
</script>

<style></style>
