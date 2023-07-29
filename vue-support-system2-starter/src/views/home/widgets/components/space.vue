<template>
	<el-card shadow="never" header="当前已用量">
		<el-row :gutter="15" style="margin-top: 20px;">
			<el-col :lg="6" v-for="item in files">
				<el-card shadow="never">
					<span><h2><b>{{ item.name }}</b></h2></span>
					<el-progress  :stroke-width="20" :color="colors" :percentage="(item.free / item.total * 100).toFixed(2)">
						<el-button text>{{ this.$TOOL.sizeFormat(item.total) }}</el-button>
					</el-progress>
					<span style="color:#6e6767">{{ this.$TOOL.sizeFormat(item.total - item.free) }} 可用, 共 {{ this.$TOOL.sizeFormat(item.total) }} </span>
				</el-card>
			</el-col>
		</el-row>
	</el-card>
</template>

<script>
	import scStatistic from '@/components/scStatistic/index.vue';
	export default {
		title: "磁盘空间",
		icon: "el-icon-odometer",
		description: "磁盘空间",
		components: {
			scStatistic
		},
		data() {
			return {
				files: [],
				value: 39.58,
				colors: [
					{ color: '#67C23A', percentage: 40 },
					{ color: '#E6A23C', percentage: 60 },
					{ color: '#F56C6C', percentage: 80 },
				]
			}
		},
		mounted(){
			this.$API.system.oshi.space.get().then(res => {
				if(res.code === '00000') {
					this.files = res.data;
					return !1;
				}
			});
		},
		methods: {
			format(percentage){
				return percentage + "G"
			}
		}
	}
</script>

<style>
</style>
