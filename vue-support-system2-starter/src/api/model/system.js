import config from "@/config"
import http from "@/utils/request"

export default {
	menu: {
		myMenus: {
			url: `${config.API_URL}/v2/menus/my/1.6.1`,
			name: "获取我的菜单",
			get: async function(){
				return await http.get(this.url);
			}
		},
		list: {
			url: `${config.API_URL}/v2/menus/tree`,
			name: "获取菜单",
			get: async function(){
				return await http.get(this.url);
			}
		},
		save: {
			url: `${config.API_URL}/v2/menus/save`,
			name: "修改角色",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/menus/update`,
			name: "更新角色",
			put: function(params){
				return http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/menus/delete`,
			name: "删除角色",
			delete: function(p){
				return http.delete(this.url + `?menuId=${p.menuId}`, {params: p});
			}
		}
	},
	dic: {
		tree: {
			url: `${config.API_URL}/dic/tree`,
			name: "获取字典树",
			get: async function(){
				return await http.get(this.url);
			}
		},
		list: {
			url: `${config.API_URL}/dic/list`,
			name: "字典明细",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		get: {
			url: `${config.API_URL}/dic/get`,
			name: "获取字典数据",
			get: async function(params){
				return await http.get(this.url, params);
			}
		}
	},
	role: {
		list: {
			url: `${config.API_URL}/v2/role/list`,
			name: "获取角色列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v2/role/save`,
			name: "修改角色",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/role/update`,
			name: "更新角色",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/role/delete`,
			name: "删除角色",
			delete: async function(params){
				return await http.pudeletet(this.url, params);
			}
		}
	},
	dept: {
		list: {
			url: `${config.API_URL}/v2/dept/list`,
			name: "获取部门列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		}
	},
	user: {
		list: {
			url: `${config.API_URL}/v2/users/page`,
			name: "获取用户列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		}
	},
	app: {
		list: {
			url: `${config.API_URL}/app/list`,
			name: "应用列表",
			get: async function(){
				return await http.get(this.url);
			}
		}
	},
	log: {
		list: {
			url: `${config.API_URL}/log/list`,
			name: "日志列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		}
	},
	table: {
		list: {
			url: `${config.API_URL}/table/list`,
			name: "表格列管理列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		info: {
			url: `${config.API_URL}/table/info`,
			name: "表格列管理详情",
			get: async function(params){
				return await http.get(this.url, params);
			}
		}
	},
	tasks: {
		list: {
			url: `${config.API_URL}/tasks/list`,
			name: "系统任务管理",
			get: async function(params){
				return await http.get(this.url, params);
			}
		}
	}
}
