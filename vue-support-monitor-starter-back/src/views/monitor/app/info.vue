<template>
	<el-dialog :close-on-click-modal="false" :title="title" v-model="visible" width="600" class="bg-blue-gray-50/50" style="background-color: #f6f8f9;" destroy-on-close @closed="$emit('closed')" draggable>
		<div v-for="item in form" style="margin-top: 20px"
			class="relative flex flex-col bg-clip-border rounded-xl bg-white text-gray-700 border border-blue-gray-100 shadow-sm">
			<div
				class="bg-clip-border mt-4 mx-4 rounded-xl overflow-hidden bg-gradient-to-tr from-gray-900 to-gray-800 text-white shadow-gray-900/20 absolute grid h-12 w-12 place-items-center">
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
					class="w-6 h-6 text-white">
					<path
						d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z">
					</path>
				</svg></div>
			<div class="p-4 text-right">
				<p class="block antialiased font-sans text-sm leading-normal font-normal text-blue-gray-600"><el-tag>{{ item.profile }}</el-tag></p>
				<h4
					class="block antialiased tracking-normal font-sans text-2xl font-semibold leading-snug text-blue-gray-900">
					{{ item.appName }}</h4>
			</div>
			<div class="border-t border-blue-gray-50 p-4">
				<p class="flex items-center font-light text-gray-500 text-md dark:text-gray-300">
					<span>{{ item.serverHost }}:{{ item.serverPort }}</span>
					<a title="服务器地址" style=" margin-left: 10px; padding-top: -13px" target="_blank" :href="'http://' + item.serverHost +':'+ item.serverPort + item.contextPath">
						<el-icon><component is="el-icon-eleme-filled" /></el-icon>
					</a>
					<a title="监控地址" v-if="item.data.endpoint && item.data.endpoint.length > 0"  style=" margin-left: 10px; padding-top: -13px" target="_blank" :href="'http://' + item.serverHost +':'+ item.serverPort + item.contextPath+ item.endpointsUrl">
						<el-icon><component is="sc-icon-monitor" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="日志" v-if="(item.data.endpoint ||[]).indexOf('loggers') > -1"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenLog(item)">
						<el-icon><component is="sc-icon-log" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="环境" v-if="(item.data.endpoint ||[]).indexOf('env') > -1" style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenEnv(item)">
						<el-icon><component is="sc-icon-env" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="系统参数" v-if="(item.data.endpoint ||[]).indexOf('configprops') > -1"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doIoenConfigprops(item)">
						<el-icon><component is="sc-icon-param" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="系统缓存" v-if="(item.data.endpoint ||[]).indexOf('caches') > -1" style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenCache(item)">
						<el-icon><component is="sc-icon-cache" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="系统内存" v-if="(item.data.endpoint ||[]).indexOf('map') > -1" style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doMap(item)">
						<el-icon><component is="sc-icon-map" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="系统线程" v-if="(item.data.endpoint ||[]).indexOf('thread') > -1" style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doThread(item)">
						<el-icon><component is="sc-icon-thread" /></el-icon>	
					</a>
					<a class="cursor-pointer redis" v-if="(item.data.endpoint ||[]).indexOf('redis') > -1" title="redis"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenRedis(item)">
						<el-icon><component is="sc-icon-redis" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="系统信息"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doOpenPin(item)">
						<el-icon><component is="el-icon-setting" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="日志查询"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doLogSearch(item)">
						<el-icon><component is="sc-icon-log" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="CPU"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doCpu(item)">
						<el-icon><component is="sc-icon-line" /></el-icon>	
					</a>
					<a class="cursor-pointer" title="内存"  style=" margin-left: 10px; padding-top: -13px" target="_blank" @click="doMem(item)">
						<el-icon><component is="sc-icon-wheel" /></el-icon>	
					</a>
				</p>
			</div>
		</div>

	</el-dialog>

	<log-dialog ref="logDialogRef" :visible.sync="logDialogVisible"  />
	<log-search-dialog ref="logSearchDialogVisibleRef" :visible.sync="logSearchDialogVisible"  />
	<env-dialog ref="envDialogRef" :visible.sync="envDialogVisible"  />
	<redis-dialog ref="redisDialogRef" :visible.sync="redisDialogVisible"  />
	<cpu-dialog ref="cpuDialogVisibleRef" :visible.sync="cpuDialogVisible"  />
	<mem-dialog ref="memDialogVisibleRef" :visible.sync="memDialogVisible"  />
	<cache-dialog ref="cacheDialogRef" :visible.sync="cacheDialogVisible"  />
	<thread-dialog ref="threadDialogVisibleRef" :visible.sync="threadDialogVisible"  />
	<map-dialog ref="mapDialogVisibleRef" :visible.sync="mapDialogVisible"  />
	<configprops-dialog ref="configpropsDialogRef" :visible.sync="configpropsDialogVisible"  />
</template>

<script>
import LogDialog from './plugins/log.vue'
import MapDialog from './plugins/map.vue'
import MemDialog from './plugins/mem.vue'
import LogSearchDialog from './logsearch.vue'
import ConfigpropsDialog from './plugins/configprops.vue'
import CpuDialog from './plugins/cpu.vue'
import EnvDialog from './plugins/env.vue'
import RedisDialog from './plugins/redis.vue'
import CacheDialog from './plugins/cache.vue'
import ThreadDialog from './plugins/thread.vue'
import pinyin from 'js-pinyin'
import Base64 from "@/utils/base64";

export default {
	emits: ['success', 'closed'],
	components: {LogDialog, EnvDialog, ConfigpropsDialog, RedisDialog, CacheDialog,LogSearchDialog, CpuDialog,MemDialog, ThreadDialog, MapDialog },
	data() {
		return {
			logSearchDialogVisible: false,
			logDialogVisible: false,
			threadDialogVisible: false,
			cpuDialogVisible: false,
			envDialogVisible: false,
			cacheDialogVisible: false,
			configpropsDialogVisible: false,
			redisDialogVisible: false,
			visible: false,
			isSaveing: false,
			configList: [],
			title: '详情',
			mode: '',
			appName: '',
			form:[]
		}
	},
	mounted() {
	},
	methods: {
		doOpenSys(item){
			// window.open("/monitor.html?data="+Base64.encode(JSON.stringify(item))+"&appName="+this.appName, '_blank');
			this.$router.push({
				path: '/monitor/monitor',
				query: {
					data: Base64.encode(JSON.stringify(item)),
					appName: this.appName
				}});
		},
		doOpenPin(item){
			window.open("/monitor.html?data="+Base64.encode(JSON.stringify(item))+"&appName="+this.appName, '_blank');
		},
		doOpenTrace(item) {
			this.$router.push({
				path: '/monitor/trace',
				query: {
					data: Base64.encode(JSON.stringify(item)),
					appName: this.appName
				}});
		},
		doOpenSysLog(item) {
			this.$router.push({
				path: '/monitor/log',
				query: {
					data: Base64.encode(JSON.stringify(item)),
					appName: this.appName
				}});
		},
		doOpenCache(item){
			this.cacheDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.cacheDialogRef.open(item);
			})
		},
		doMap(item){
			this.mapDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.mapDialogVisibleRef.open(item);
			})
		},
		doThread(item){
			this.threadDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.threadDialogVisibleRef.open(item);
			})
		},
		doLogSearch(item){
			this.logSearchDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.logSearchDialogVisibleRef.open(item);
			})
		},
		doMem(item){
			this.memDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.memDialogVisibleRef.open(item);
			})
			
		},
		doCpu(item){
			this.cpuDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.cpuDialogVisibleRef.open(item);
			})
			
		},
		doOpenRedis(item){
			this.logSearchDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.logSearchDialogVisibleRef.open(item);
			})
		},
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
		doIoenConfigprops(item){
			this.configpropsDialogVisible = true;
			this.$nextTick(() => {
				this.$refs.configpropsDialogRef.open(item);
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
			Object.assign(this.form, data?.monitorRequests);
			this.appName = data?.monitorAppname;
		}
	}
}
</script>

<style lang="less">
::deep(.redis path) {
	fill: red
}
</style>
