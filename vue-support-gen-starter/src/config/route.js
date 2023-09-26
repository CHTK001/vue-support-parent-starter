// 静态路由配置
// 书写格式与动态路由格式一致，全部经由框架统一转换
// 比较动态路由在meta中多加入了role角色权限，为数组类型。一个菜单是否有权限显示，取决于它以及后代菜单是否有权限。
// routes 显示在左侧菜单中的路由(显示顺序在动态路由之前)
// 示例如下

// const routes = [
// 	{
// 		name: "demo",
// 		path: "/demo",
// 		meta: {
// 			icon: "el-icon-eleme-filled",
// 			title: "演示",
// 			role: ["SA"]
// 		},
// 		children: [{
// 			name: "demopage",
// 			path: "/demopage",
// 			component: "test/autocode/index",
// 			meta: {
// 				icon: "el-icon-menu",
// 				title: "演示页面",
// 				role: ["SA"]
// 			}
// 		}]
// 	}
// ]

const routes = [
    {
        name: "db",
        path: "/",
        component: () => import("@/views/gen/db/index.vue"),
        meta: {
            icon: "el-icon-menu",
            title: "数据源管理",
        }
    },
    {
        name: "console",
        path: "/console/:genId",
        component: () => import("@/views/gen/console/index.vue"),
        meta: {
            icon: "el-icon-menu",
            title: "控制台",
        }
    },
    {
        name: "console-edit",
        path: "/console/edit/:tabId/:genId",
        component: () => import("@/views/gen/console/edit.vue"),
        meta: {
            icon: "el-icon-menu",
            title: "编辑",
        }
    }
   
]

export default routes;
