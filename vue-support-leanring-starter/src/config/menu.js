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
		path: "/learning",
		component: "learning/index",
		name: "机器学习",
		hidden: false,
		meta: {
			title: "机器学习",
			icon: "sc-icon-scheduler",
			type: "menu",
		},
		children: [
			{
				path: "/learning/detect",
				component: "learning/detect/index",
				name: "视觉检测",
				hidden: false,
				meta: {
					title: "视觉检测",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
			
			{
				path: "/learning/feature",
				component: "learning/feature/index",
				name: "特征提取",
				hidden: false,
				meta: {
					title: "特征提取",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
			{
				path: "/learning/compare",
				component: "learning/compare/index",
				name: "人脸比对",
				hidden: false,
				meta: {
					title: "人脸比对",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
		],
	},
];

export default me;
