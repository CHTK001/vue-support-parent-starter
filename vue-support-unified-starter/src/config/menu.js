const me = [
	{
		path: "/home",
		component: "home/index",
		name: "首页",
		hidden: false,
		meta: {
			title: "首页",
			icon: "el-icon-eleme-filled",
			hidden: null,
			tag: null,
			affix: false,
			type: "menu",
			color: null,
			roles: [],
			keepAlive: null,
			params: null,
		},
		children: [
			{
				path: "/dashboard",
				component: "home/index",
				name: "控制台",
				hidden: false,
				meta: {
					title: "控制台",
					icon: "el-icon-menu",
					hidden: null,
					tag: null,
					affix: false,
					type: "menu",
					color: null,
					roles: [],
					keepAlive: null,
					params: null,
				},
			},
		],
	},
	{
		path: "/unified",
		component: "unified/index",
		name: "统一管理",
		hidden: false,
		meta: {
			title: "统一管理",
			icon: "sc-icon-type",
			type: "menu",
		},
		children: [
			{
				path: "/unified/executor",
				component: "unified/executor/index",
				name: "执行器配置",
				hidden: false,
				meta: {
					title: "执行器配置",
					icon: "sc-icon-executor",
					type: "menu",
				},
			},
			{
				path: "/unified/config",
				component: "unified/config/index",
				name: "配置中心",
				hidden: false,
				meta: {
					title: "配置中心",
					icon: "el-icon-setting",
					type: "menu",
				},
			},
		],
	},
];

export default me;