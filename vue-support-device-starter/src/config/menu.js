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
		path: "/cloud",
		component: "cloud/index",
		name: "云平台管理",
		hidden: false,
		meta: {
			title: "云平台管理",
			icon: "sc-icon-cloud",
			type: "menu",
		},
		children: [
			{
				path: "/device/cloud/platform",
				component: "device/cloud/platform/index",
				name: "云平台",
				hidden: false,
				meta: {
					title: "云平台",
					icon: "sc-icon-project",
					type: "menu",
				},
			},
			{
				path: "/device/cloud/service/:devicePlatformId",
				component: "device/cloud/service/index",
				name: "云平台服务",
				hidden: false,
				meta: {
					title: "云平台服务",
					icon: "sc-icon-yun",
					type: "menu",
				},
			},
		],
	},
	{
		path: "/factory",
		component: "factory/index",
		name: "分类管理",
		hidden: false,
		meta: {
			title: "分类管理",
			icon: "sc-icon-type",
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
				path: "/device/type",
				component: "device/type/index",
				name: "设备分类",
				hidden: false,
				meta: {
					title: "设备分类",
					icon: "sc-icon-type",
					type: "menu",
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
				path: "/device/device",
				component: "device/device/index",
				name: "设备管理",
				hidden: false,
				meta: {
					title: "设备管理",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
		],
	},
];

export default me;
