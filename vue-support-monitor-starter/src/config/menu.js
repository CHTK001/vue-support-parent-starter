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
		path: "/monitor",
		component: "monitor/index",
		name: "监控管理",
		hidden: false,
		meta: {
			title: "监控管理",
			icon: "sc-icon-scheduler",
			type: "menu",
		},
		children: [
			{
				path: "/monitor/app",
				component: "monitor/app/index",
				name: "应用管理",
				hidden: false,
				meta: {
					title: "应用管理",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
			{
				path: "/monitor/config",
				component: "monitor/config/index",
				name: "配置中心",
				hidden: false,
				meta: {
					title: "配置中心",
					icon: "el-icon-setting",
					type: "menu",
				},
			},
			{
				path: "/monitor/monitor",
				component: "monitor/monitor/index",
				name: "系统详情",
				hidden: true,
				meta: {
					title: "系统详情",
					icon: "el-icon-setting",
					type: "menu",
				},
			},
			{
				path: "/monitor/register",
				component: "monitor/register/index",
				name: "注册中心",
				hidden: false,
				meta: {
					title: "注册中心",
					icon: "el-icon-setting",
					type: "menu",
				},
			},
			{
				path: "/monitor/link",
				component: "monitor/link/index",
				name: "访问链路",
				hidden: true,
				meta: {
					title: "访问链路",
					icon: "sc-icon-link",
					type: "menu",
				},
			},
			{
				path: "/monitor/oshi",
				component: "monitor/oshi/index",
				name: "系统监控",
				hidden: true,
				meta: {
					title: "系统监控",
					icon: "sc-icon-monitor",
					type: "menu",
				},
			},
			{
				path: "/monitor/log",
				component: "monitor/log/index",
				name: "日志管理",
				hidden: true,
				meta: {
					title: "日志管理",
					icon: "sc-icon-log",
					type: "menu",
				},
			},
			{
				path: "/monitor/trace",
				component: "monitor/trace/index",
				name: "链路追踪",
				hidden: true,
				meta: {
					title: "链路追踪",
					icon: "sc-icon-trace",
					type: "menu",
				},
			},
		],
	},
];

export default me;