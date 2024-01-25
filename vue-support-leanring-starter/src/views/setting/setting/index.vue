<template>
	<el-container class="page-user">
		<el-aside style="width: 240px;">
			<el-container>
				<el-main class="nopadding">
					<el-menu class="menu" :default-active="page">
						<el-menu-item-group v-for="group in menu" :key="group.groupName" :title="group.groupName">
							<el-menu-item v-for="item in group.list" :key="item.component" :index="item.component" @click="openPage">
								<el-icon v-if="item.icon"><component :is="item.icon"/></el-icon>
								<template #title>
									<span>{{item.title}}</span>
								</template>
							</el-menu-item>
						</el-menu-item-group>
					</el-menu>
				</el-main>
			</el-container>
		</el-aside>
		<el-main>
			<Suspense>
				<template #default>
					<component :is="page"/>
				</template>
				<template #fallback>
					<el-skeleton :rows="3" />
				</template>
			</Suspense>
		</el-main>
	</el-container>
</template>

<script>
	import { defineAsyncComponent } from 'vue'
	import sysConfig from "@/config";

	export default {
		name: 'userCenter',
		components: {
			setting: defineAsyncComponent(() => import('./sub/setting.vue')),
			pushSettings: defineAsyncComponent(() => import('./sub/pushSettings.vue')),
			logs: defineAsyncComponent(() => import('./sub/transmit.vue')),
		},
		data() {
			return {
				newAvatar: undefined,
				menu: [
					{
						groupName: "基本设置",
						list: [
							{
								icon: "el-icon-operation",
								title: "基础信息",
								component: "setting"
							},
							{
								icon: "el-icon-bell",
								title: "通知设置",
								component: "pushSettings"
							}
						]
					},
					{
						groupName: "传输设置",
						list: [
							{
								icon: "el-icon-coin",
								title: "基本信息",
								component: "logs"
							},
						]
					},
					// {
					// 	groupName: "账号升级",
					// 	list: [
					// 		{
					// 			icon: "el-icon-office-building",
					// 			title: "升级为企业账号",
					// 			component: "upToEnterprise"
					// 		}
					// 	]
					// }
				],
				user: {
					userName: "Unkown",
				},
				page: "setting"
			}
		},
		mounted(){
			const userInfo = this.$TOOL.data.get(sysConfig.USER_INFO);
			this.user.userName = userInfo.userRealName || userInfo.username;
			this.newAvatar = userInfo.avatar || 'img/avatar.jpg'
		},
		//路由跳转进来 判断from是否有特殊标识做特殊处理
		beforeRouteEnter (to, from, next){
			next((vm)=>{
				if(from.is){
					//删除特殊标识，防止标签刷新重复执行
					delete from.is
					//执行特殊方法
					vm.$alert('路由跳转过来后含有特殊标识，做特殊处理', '提示', {
						type: 'success',
						center: true
					}).then(() => {}).catch(() => {})
				}
			})
		},
		methods: {
			openPage(item){
				this.page = item.index
			}
		}
	}
</script>
