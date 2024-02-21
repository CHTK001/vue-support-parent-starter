<template>
	<el-card shadow="hover" header="版本信息">
		<div style="height: 210px;text-align: center;">
			<img :src="getImg('ver.svg')" style="height:140px"/>
			<h2 style="margin-top: 15px;">app版本 {{$CONFIG.APP_VER}}</h2>
			<p style="margin-top: 15px;">内核版本 {{$CONFIG.CORE_VER}}</p>
		</div>
	</el-card>
</template>

<script>
import { getQueryString, getAssetsImages, getQueryPathString } from '@/utils/Utils';
	export default {
		title: "版本信息",
		icon: "el-icon-monitor",
		description: "当前项目版本信息",
		data() {
			return {
				img: 'src/assets/images/ver.svg',
				ver: 'loading...'
			}
		},
		mounted() {
			this.getVer()
		},
		methods: {
			getImg(name) {
				return getAssetsImages(name);
			},
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
