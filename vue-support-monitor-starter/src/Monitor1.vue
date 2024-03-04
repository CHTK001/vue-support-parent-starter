<template>
	<el-config-provider :locale="locale" :size="config.size" :zIndex="config.zIndex" :button="config.button">
		<View v-if="viliable" :data="form"></View>
	</el-config-provider>
</template>

<script>
	import colorTool from '@/utils/color'
	import { getQueryPathString, getQueryString } from '@/utils/Utils';
	import Base64 from "@/utils/base64";
	import useTabs from '@/utils/useTabs'
	import View from '@/views/monitor/pin/view.vue';

	export default {
		name: 'App',
		components:{View},
		data() {
			return {
				config: {
					size: "default",
					zIndex: 2000,
					button: {
						autoInsertSpace: false
					}
				},
				viliable: false,
				activeName: '0',
				form: {
					appValue: '',
					appModelValue: ''
				}
			}
		},
		watch: {
			'form.appValue'(val) {
				this.form.appValue = val;
			}
		},
		computed: {
			locale(){
				return this.$i18n.messages[this.$i18n.locale].el
			},
		},
		mounted() {
			try{
				this.form.appValue = getQueryString("appName");
				this.form.appName = this.form.appValue;
				const item = JSON.parse(Base64.decode(getQueryString("data")));
				this.form.appModelValue = item.serverHost + ':' + item.serverPort;
				document.title = this.form.appValue + '详情 - 监控管理';
				useTabs.setTitle(this.form.appValue + '详情');
				this.viliable = true;
			}catch(e){}
		},
		created() {
			//设置主题颜色
			const app_color = this.$CONFIG.COLOR || this.$TOOL.data.get('APP_COLOR')
			if(app_color){
				document.documentElement.style.setProperty('--el-color-primary', app_color);
				for (let i = 1; i <= 9; i++) {
					document.documentElement.style.setProperty(`--el-color-primary-light-${i}`, colorTool.lighten(app_color,i/10));
				}
				for (let i = 1; i <= 9; i++) {
					document.documentElement.style.setProperty(`--el-color-primary-dark-${i}`, colorTool.darken(app_color,i/10));
				}
			}
		}
	}
</script>

<style lang="scss">
	@import '@/style/style.scss';
</style>
