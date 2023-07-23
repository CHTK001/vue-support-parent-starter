import config from "@/config"

//系统路由
const routes = [
	{
		name: "layout",
		path: "/",
		component: () => import(/* webpackChunkName: "layout" */ '@/layout/index.vue'),
		redirect: config.DASHBOARD_URL || '/dashboard',
		children: []
	},
	{
		path: "/login",
		component: () => import(/* webpackChunkName: "login" */ '@/views/login/index.vue'),
		meta: {
			title: "登录"
		}
	},
	{
		path: "/oss-view",
		name: "oss-view",
		component: () => import( '@/views/setting/oss/oss/OssView.vue'),
	},
	{
		path: "/preview",
		name: "preview",
		component: () => import('@/view/preview.vue'),
		meta: {
			title: '文件预览'
		}
	},
	{
		path: "/user_register",
		component: () => import(/* webpackChunkName: "userRegister" */ '@/views/login/userRegister.vue'),
		meta: {
			title: "注册"
		}
	},
	{
		path: "/reset_password",
		component: () => import(/* webpackChunkName: "resetPassword" */ '@/views/login/resetPassword.vue'),
		meta: {
			title: "重置密码"
		}
	}
]

export default routes;
