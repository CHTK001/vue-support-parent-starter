import config from "@/config"

//系统路由
const routes = [
	{
		path: "/login",
		component: () => import(/* webpackChunkName: "login" */ '@/views/login/index.vue'),
		meta: {
			title: "登录"
		}
	}
];


const ossView = [
]

ossView.forEach(item => { routes.push(item) });

export default routes;
