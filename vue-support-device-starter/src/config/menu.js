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
		path: "/device",
		component: "device/index",
		name: "设备管理",
		hidden: false,
		meta: {
			title: "设备管理",
			icon: "sc-icon-scheduler",
			type: "menu",
		},
		children: [
			{
				path: "/device/type",
				component: "database/type/index",
				name: "设备类型",
				hidden: false,
				meta: {
					title: "设备类型",
					icon: "sc-icon-type",
					type: "menu",
				},
			},
			{
				path: "/device/protocol",
				component: "database/type/protocol",
				name: "云平台信息",
				hidden: false,
				meta: {
					title: "云平台信息",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
			{
				path: "/device/factory",
				component: "database/type/factory",
				name: " 设备协议",
				hidden: false,
				meta: {
					title: "设备协议",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
		],
	},
];

export default me;
