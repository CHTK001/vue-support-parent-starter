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
		
		],
	},
];

export default me;
