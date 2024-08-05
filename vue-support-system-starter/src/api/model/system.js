import config from "@/config"
import http from "@/utils/request"

export default {
	tranfer: {
		address: {
			url: `${config.API_URL}/v1/platform/transfer`,
			name: "翻译地址",
			get: function(params){
				return http.get(this.url, params);
			}
		},
	},
	setting: {
		batch: {
			url: `${config.API_URL}/v1/setting/batch`,
			name: "添加/更新配置",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v1/setting/list`,
			name: "获取配置",
			get: function(params){
				return http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v1/setting/save`,
			name: "添加配置",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v1/setting/update`,
			name: "更新配置",
			put: function(params){
				return http.put(this.url, params);
			}
		},
	},
	library: {
		page: {
			url: `${config.API_URL}/v2/library/page`,
			name: "获取识别库",
			get: async function(){
				return await http.get(this.url);
			}
		},
		save: {
			url: `${config.API_URL}/v2/library/save`,
			name: "添加识别库",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/library/update`,
			name: "更新识别库",
			put: function(params){
				return http.put(this.url, params);
			}
		},
		updateMapping: {
			url: `${config.API_URL}/v2/library/mapping`,
			name: "更新识别库映射关系",
			put: function(params){
				return http.put(this.url, params);
			}
		},
		getMapping: {
			url: `${config.API_URL}/v2/library/getMapping`,
			name: "获取识别库映射关系",
			get: function(params){
				return http.get(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/library/delete`,
			name: "删除识别库",
			delete: function(p){
				return http.delete(this.url + `?libId=${p.libId}`, {params: p});
			}
		}
	},
	oss: {
		list: {
			url: `${config.API_URL}/v1/file/`,
			name: "获取OSS列表",
			get: async function( p){
				return await http.get(this.url + `${p.fsBucket}/list`,  p);
			}
		},
		page: {
			url: `${config.API_URL}/v1/oss/page`,
			name: "获取OSS列表",
			get: async function( p){
				return await http.get(this.url,  p);
			}
		},
		type: {
			url: `${config.API_URL}/v1/oss/type`,
			name: "获取OSStype",
			get: async function(){
				return await http.get(this.url);
			}
		},
		upload: {
			url: `${config.API_URL}/v1/oss/upload`,
			name: "新增文件",
			post: async function(p){
				return await http.post(this.url, p);
			}
		},
		save: {
			url: `${config.API_URL}/v1/oss/save`,
			name: "新增OSS",
			post: async function(p){
				return await http.post(this.url, p);
			}
		},
		update: {
			url: `${config.API_URL}/v1/oss/update`,
			name: "更新OSS",
			put: async function(p){
				return await http.put(this.url, p);
			}
		},
		delete: {
			url: `${config.API_URL}/v1/oss/delete`,
			name: "删除OSS",
			delete: async function(p){
				return await http.delete(this.url + `?fsId=${p.fsId}`, p);
			}
		},
	},
	menu: {
		myMenus: {
			url: `${config.API_URL}/v2/menus/my/1.6.1`,
			name: "获取我的菜单",
			get: async function(p){
				return await http.get(this.url, p);
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
			name: "添加角色",
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
			url: `${config.API_URL}/v2/dict/type/list`,
			name: "获取字典树",
			get: async function(){
				return await http.get(this.url);
			}
		},
		save: {
			url: `${config.API_URL}/v2/dict/type/save`,
			name: "添加字典数据",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/dict/type/delete`,
			name: "删除字典数据",
			delete: function(p){
				return http.delete(this.url + `?dictId=${p.dictId}`, {params: p});
			}
		},
		update: {
			url: `${config.API_URL}/v2/dict/type/update`,
			name: "更新字典数据",
			put: function(params){
				return http.put(this.url, params);
			}
		},
		//字典数据
		dictPage: {
			url: `${config.API_URL}/v2/dict/page`,
			name: "字典明细",
			get: function(params){
				return http.get(this.url, params);
			}
		},
		get: {
			url: `${config.API_URL}/v2/dict/get`,
			name: "获取字典数据",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		dictSave: {
			url: `${config.API_URL}/v2/dict/save`,
			name: "添加字典数据",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		dictDelete: {
			url: `${config.API_URL}/v2/dict/delete`,
			name: "删除字典数据",
			delete: function(params){
				return http.delete(this.url, params);
			}
		},
		dictUpdate: {
			url: `${config.API_URL}/v2/dict/update`,
			name: "更新字典数据",
			put: function(params){
				return http.put(this.url, params, {
					headers: {
						'Content-Type': 'application/json;charset=UTF-8'
					}
				});
			}
		},
	},
	role: {
		page: {
			url: `${config.API_URL}/v2/role/page`,
			name: "获取角色列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
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
				return await http.delete(this.url + '?roleId=' + params.roleId, params);
			}
		},
		updateRole: {
			url: `${config.API_URL}/v2/role/updateRole`,
			name: "更新角色",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		getRole: {
			url: `${config.API_URL}/v2/role/getRole`,
			name: "更新角色",
			get: function(params){
				return http.get(this.url, params);
			}
		},
	
		batchDelete: {
			url: `${config.API_URL}/v2/role/batchDelete`,
			name: "删除角色",
			delete: async function(params){
				return await http.delete(this.url + '?roleIds=' + params.roleId, params);
			}
		}
	},
	dept: {
		page: {
			url: `${config.API_URL}/v2/dept/page`,
			name: "分页获取部门列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v2/dept/list`,
			name: "获取部门列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		tree: {
			url: `${config.API_URL}/v2/dept/tree`,
			name: "获取部门树",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v2/dept/save`,
			name: "修改部门",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/dept/update`,
			name: "更新部门",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/dept/delete`,
			name: "删除部门",
			delete: async function(params){
				return await http.delete(this.url + "?deptId=" + params.deptId, params);
			}
		},
		batchDelete: {
			url: `${config.API_URL}/v2/dept/batchDelete`,
			name: "删除部门",
			delete: async function(params){
				return await http.delete(this.url + "?sysDeptId=" + params.deptId, params);
			}
		},
	},
	user: {
		list: {
			url: `${config.API_URL}/v2/users/page`,
			name: "获取用户列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		loginCode: {
			url: `${config.API_URL}/v2/users/loginCode`,
			name: "获取用户登录信息",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		me: {
			url: `${config.API_URL}/v2/users/me`,
			name: "获取用户信息",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v2/users/save`,
			name: "修改用户",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/users/update`,
			name: "更新用户",
			put: async function(params){
				return await http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/users/delete`,
			name: "删除用户",
			delete: async function(params){
				return await http.delete(this.url + '?userId=' + params.userId, params);
			}
		},
		reset: {
			url: `${config.API_URL}/v2/users/reset`,
			name: "删除用户",
			reset: async function(params){
				return await http.get(this.url + '?userId=' + params.userId + "&notice=email,phone", params);
			}
		},
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
		page: {
			url: `${config.API_URL}/v1/log/page`,
			name: "日志列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		mylog: {
			url: `${config.API_URL}/v1/log/mylog`,
			name: "日志列表",
			get: async function(params){
				return await http.get(this.url, params);
			}
		},
		near: {
			url: `${config.API_URL}/v1/log/near`,
			name: "日志近7天数据",
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
		page: {
			url: `${config.API_URL}/v2/task/page`,
			name: "系统任务管理",
			get: function(params){
				return http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v2/task/createTask`,
			name: "新增任务",
			post: async function(params){
				return await http.post(this.url, params);
			}
		},
		subscribe: {
			url: `${config.API_URL}/v2/task/subscribe`
		},
		delete: {
			url: `${config.API_URL}/v2/task/deleteByTaskId`,
			name: "删除任务",
			delete: function(params){
				return http.delete(this.url + '?taskTid='+params.taskTid, params);
			}
		},
		pause: {
			url: `${config.API_URL}/v2/task/pauseTask`,
			name: "暂停任务",
			post: function(params){
				return http.post(this.url, params);
			}
		},
		run: {
			url: `${config.API_URL}/v2/task/runTask`,
			name: "运行任务",
			get: function(params){
				return http.post(this.url, params);
			}
		},
		options: {
			url: `${config.API_URL}/v2/task/options`,
			name: "系统任务选项",
			get: function(params){
				return  http.get(this.url, params);
			}
		}
	},
	oshi: {
		space: {
			url: `${config.API_URL}/v2/oshi/space`,
			name: "磁盘信息",
			get: function(params){
				return  http.get(this.url, params);
			}
		}
	},
	binder:{
		list: {
			url: `${config.API_URL}/v2/users/bind/list`,
			name: "用户绑定三方信息接口",
			get: function(params){
				return  http.get(this.url, params);
			}
		},
		unBinder: {
			url: `${config.API_URL}/v2/users/bind/unBinder`,
			name: "解除用户绑定三方信息接口",
			delete: function(params){
				return  http.delete(this.url + `?tripartiteBindId=${params.tripartiteBindId}`, params);
			}
		}
	},
	message: {
		page: {
			url: `${config.API_URL}/v2/message/page`,
			name: "查询消息模板",
			get: function(params){
				return  http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v2/message/save`,
			name: "添加消息模板",
			post: function(params){
				return  http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/message/update`,
			name: "更新消息模板",
			put: function(params){
				return  http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/message/delete`,
			name: "删除消息模板",
			delete: function(params){
				return  http.delete(this.url + `?messageId=${params.messageId}`, params);
			}
		},
	},
	messageConfig: {
		smsType: {
			url: `${config.API_URL}/v2/message/config/smsType`,
			name: "短信实现方式",
			get: function(params){
				return  http.get(this.url, params);
			}
		},
		list: {
			url: `${config.API_URL}/v2/message/config/list`,
			name: "查询消息模板配置",
			get: function(params){
				return  http.get(this.url, params);
			}
		},
		page: {
			url: `${config.API_URL}/v2/message/config/page`,
			name: "查询消息模板配置",
			get: function(params){
				return  http.get(this.url, params);
			}
		},
		save: {
			url: `${config.API_URL}/v2/message/config/save`,
			name: "添加消息模板配置",
			post: function(params){
				return  http.post(this.url, params);
			}
		},
		update: {
			url: `${config.API_URL}/v2/message/config/update`,
			name: "更新消息模板配置",
			put: function(params){
				return  http.put(this.url, params);
			}
		},
		delete: {
			url: `${config.API_URL}/v2/message/config/delete`,
			name: "删除消息模板配置",
			delete: function(params){
				return  http.delete(this.url + `?configId=${params.configId}`, params);
			}
		},
	}
}
