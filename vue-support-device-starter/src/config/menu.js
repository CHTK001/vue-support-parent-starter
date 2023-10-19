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
				path: "/device/manufacturer",
				component: "device/manufacturer/index",
				name: "设备厂家",
				hidden: false,
				meta: {
					title: "设备厂家",
					icon: "sc-icon-factory",
					type: "menu",
				},
			},
			{
				path: "/device/cloud",
				component: "device/cloud/index",
				name: "云服务",
				hidden: false,
				meta: {
					title: "云服务",
					icon: "sc-icon-yun",
					type: "menu",
				},
			},
			{
				path: "/device/cloud_connector",
				component: "device/cloud_connector/index",
				name: "云服务",
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
