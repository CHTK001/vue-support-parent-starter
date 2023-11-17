<template>
	<div class="user-bar">
		<el-dropdown class="user panel-item" trigger="click" @command="handleUser">
			<div class="user-avatar">
				<el-avatar :size="30">{{ userNameF }}</el-avatar>
				<label>{{ userName }}</label>
				<el-icon class="el-icon--right"><el-icon-arrow-down /></el-icon>
			</div>
			<template #dropdown>
				<el-dropdown-menu>
					<el-dropdown-item command="clearCache">{{ $t('page.qchc') }}</el-dropdown-item>
					<el-dropdown-item  command="outLogin">{{ $t('page.tcdl') }}</el-dropdown-item>
				</el-dropdown-menu>
			</template>
		</el-dropdown>
	</div>

	<el-dialog v-model="searchVisible" :width="700" title="搜索" center destroy-on-close>
		<search @success="searchVisible = false"></search>
	</el-dialog>

	<el-drawer v-model="tasksVisible" :size="450" title="任务中心" destroy-on-close>
		<tasks></tasks>
	</el-drawer>
</template>

<script>
import search from './search.vue'
import tasks from './tasks.vue'
import sysConfig from "@/config";
import allComps from '@/views/home/widgets/components'
import me from "@/config/menu.js";

export default {
	components: {
		search,
		tasks
	},
	data() {
		return {
			userName: "",
			userNameF: "",
			searchVisible: false,
			tasksVisible: false,
			msg: false,
			msgList: [

			]
		}
	},
	created() {
		var userInfo = this.$TOOL.data.get(sysConfig.USER_INFO);
		this.userName = userInfo.userRealName || userInfo.userName || userInfo.nickname;
		this.userNameF = this.userName.substring(0, 1);
	},
	methods: {
		//个人信息
		handleUser(command) {
			if (command == "uc") {
				this.$router.push({ path: '/usercenter' });
			}
			if (command == "cmd") {
				this.$router.push({ path: '/cmd' });
			}
			if (command == "clearCache") {
				this.$confirm('清除缓存会将系统初始化，包括登录状态、主题、语言设置等，是否继续？', '提示', {
					type: 'info',
				}).then(() => {
					const loading = this.$loading()
					this.$TOOL.data.remove(sysConfig.MENU)
					this.$TOOL.data.set(sysConfig.MENU, me);
					setTimeout(() => {
						loading.close()
						// location.reload()
					}, 1000)
				}).catch(() => {
					//取消
				})
			}
			if (command == "outLogin") {
				this.$confirm('确认是否退出当前用户？', '提示', {
					type: 'warning',
					confirmButtonText: '退出',
					confirmButtonClass: 'el-button--danger'
				}).then(() => {
					this.$router.replace({ path: '/login' });
				}).catch(() => {
					//取消退出
				})
			}
		},
		//全屏
		screen() {
			var element = document.documentElement;
			this.$TOOL.screen(element)
		},
		//显示短消息
		showMsg() {
			this.msg = true
		},
		//标记已读
		markRead() {
			this.msgList = []
		},
		//搜索
		search() {
			this.searchVisible = true
		},
		//任务
		tasks() {
			this.tasksVisible = true
		}
	}
}
</script>

<style scoped>
.user-bar {
	display: flex;
	align-items: center;
	height: 100%;
}

.user-bar .panel-item {
	padding: 0 10px;
	cursor: pointer;
	height: 100%;
	display: flex;
	align-items: center;
}

.user-bar .panel-item i {
	font-size: 16px;
}

.user-bar .panel-item:hover {
	background: rgba(0, 0, 0, 0.1);
}

.user-bar .user-avatar {
	height: 49px;
	display: flex;
	align-items: center;
}

.user-bar .user-avatar label {
	display: inline-block;
	margin-left: 5px;
	font-size: 12px;
	cursor: pointer;
}

.msg-list li {
	border-top: 1px solid #eee;
}

.msg-list li a {
	display: flex;
	padding: 20px;
}

.msg-list li a:hover {
	background: #ecf5ff;
}

.msg-list__icon {
	width: 40px;
	margin-right: 15px;
}

.msg-list__main {
	flex: 1;
}

.msg-list__main h2 {
	font-size: 15px;
	font-weight: normal;
	color: #333;
}

.msg-list__main p {
	font-size: 12px;
	color: #999;
	line-height: 1.8;
	margin-top: 5px;
}

.msg-list__time {
	width: 100px;
	text-align: right;
	color: #999;
}

.dark .msg-list__main h2 {
	color: #d0d0d0;
}

.dark .msg-list li {
	border-top: 1px solid #363636;
}

.dark .msg-list li a:hover {
	background: #383838;
}</style>
