<template>
	<el-card shadow="hover" header="版本信息">
		<div style="height: 90px;text-align: center;">
			<!-- <img src="src/assets/images/ver.svg" style="height:140px"/> -->
			<h2 style="margin-top: 15px;">ver {{$CONFIG.CORE_VER}}</h2>
			<p style="margin-top: 5px;">最新版本 {{ver}}</p>
		</div>
	
	</el-card>
</template>

<script>
	export default {
		title: "版本信息",
		icon: "el-icon-monitor",
		description: "当前项目版本信息",
		data() {
			return {
				ver: 'loading...'
			}
		},
		mounted() {
			this.getVer()
		},
		methods: {
			async getVer(){
				this.ver = '1.0.9'
			},
			golog(){
				window.open("https://www.baidu.com")
			},
			gogit(){
				window.open("https://www.baidu.com")
			}
		}
	}
</script>
