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
];


const ossView = [
	{
		path: "/compress",
		name: "compress",
		component: () => import('@/views/setting/oss/subview/compress.vue'),
		meta: {
			title: 'html-预览'
		}
	},{
		path: "/html",
		name: "html",
		component: () => import('@/views/setting/oss/subview/html.vue'),
		meta: {
			title: 'html-预览'
		}
	},{
		path: "/txt",
		name: "txt",
		component: () => import('@/views/setting/oss/subview/txt.vue'),
		meta: {
			title: 'txt-预览'
		}
	},{
		path: "/pdf",
		name: "pdf",
		component: () => import('@/views/setting/oss/subview/pdf.vue'),
		meta: {
			title: '文件管理-预览'
		}
	},{
		path: "/markdown",
		name: "markdown",
		component: () => import('@/views/setting/oss/subview/markdown.vue'),
		meta: {
			title: 'MD-预览'
		}
	},{
		path: "/docx",
		name: "docx",
		component: () => import('@/views/setting/oss/subview/docx.vue'),
		meta: {
			title: 'docx-预览'
		}
	},{
		path: "/excel",
		name: "excel",
		component: () => import('@/views/setting/oss/subview/excel.vue'),
		meta: {
			title: 'excel-预览'
		}
	},
	{
		path: "/preview",
		name: "preview",
		component: () => import('@/views/setting/oss/preview.vue'),
		meta: {
			title: '预览'
		}
	}
]

ossView.forEach(item => {routes.push(item)});

export default routes;
