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
		path: "/ext",
		component: "ext/index",
		name: "扩展信息",
		hidden: true,
		meta: {
			title: "扩展信息",
			icon: "sc-icon-scheduler",
			type: "menu",
			keepAlive: true,
			hidden: true,
		},
		children: [
			{
				path: "/ext/jdbc/console/:genId",
				component: "ext/jdbc/console/index",
				name: "控制面板",
				hidden: true,
				meta: {
					title: "控制面板",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/jdbc/console/edit/:tabId/:genId",
				component: "ext/jdbc/console/edit",
				name: "控制面板-编辑",
				hidden: true,
				meta: {
					title: "控制面板-编辑",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/jdbc/board/:genId",
				component: "ext/jdbc/board/index",
				name: "控制面板(sql)",
				hidden: true,
				meta: {
					title: "控制面板(sql)",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/jdbc/doc/:genId",
				component: "ext/jdbc/doc/index",
				name: "控制面板(doc)",
				hidden: true,
				meta: {
					title: "控制面板(doc)",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/jdbc/log/:genId",
				component: "ext/jdbc/log/index",
				name: "日志",
				hidden: true,
				meta: {
					title: "日志",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/redis/console/:genId",
				component: "ext/redis/console/index",
				name: "控制面板(redis)",
				hidden: true,
				meta: {
					title: "控制面板(redis)",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/zk/console/:genId",
				component: "ext/zk/console/index",
				name: "控制面板(zookeeper)",
				hidden: true,
				meta: {
					title: "控制面板(zookeeper)",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/ssh/console/:genId",
				component: "ext/ssh/console/index",
				name: "控制面板(SSH)",
				hidden: true,
				meta: {
					title: "控制面板(SSH)",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
			{
				path: "/ext/ftp/console/:genId",
				component: "ext/ftp/console/index",
				hidden: true,
				meta: {
					title: "控制面板([s]ftp)",
					icon: "el-icon-takeaway-box",
					type: "menu",
				},
			},
		]
	},
	{
		path: "/database",
		component: "database/index",
		name: "数据库管理",
		hidden: false,
		meta: {
			title: "数据库管理",
			icon: "sc-icon-scheduler",
			type: "menu",
		},
		children: [
			{
				path: "/database/config",
				component: "database/config/index",
				name: "驱动管理",
				hidden: false,
				meta: {
					title: "驱动管理",
					icon: "el-icon-alarm-clock",
					type: "menu",
				},
			},
			{
				path: "/database/database",
				component: "database/database/index",
				name: "数据源管理",
				hidden: false,
				meta: {
					title: "数据源管理",
					icon: "el-icon-warning",
					type: "menu",
				},
			},
			
		],
	},
];

export default me;
