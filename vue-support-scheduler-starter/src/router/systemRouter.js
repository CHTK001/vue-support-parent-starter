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
	}
];


const ossView = [
	{
		name: "首页",
		path: "/home",
		children: [{
			name: "控制台",
			path: "/dashboard",
			component: () => import(/* webpackChunkName: "layout" */ '@/views/home/index.vue'),
			redirect: config.DASHBOARD_URL || '/dashboard',
		},]
	},
	
]

ossView.forEach(item => {routes.push(item)});

export default routes;
