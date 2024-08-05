import axios from 'axios';
import { ElNotification, ElMessageBox, ElMessage } from 'element-plus';
import sysConfig from "@/config";
import tool from '@/utils/tool';
import router from '@/router';
import { sm2 } from 'sm-crypto';

axios.defaults.baseURL = ''

axios.defaults.timeout = sysConfig.TIMEOUT

// HTTP request 拦截器
axios.interceptors.request.use(
	(config) => {
		let token = tool.cookie.get(sysConfig.TOKEN);
		if(token){
			config.headers[sysConfig.TOKEN_NAME] = sysConfig.TOKEN_PREFIX + token
		}
		if(!sysConfig.REQUEST_CACHE && config.method == 'get'){
			config.params = config.params || {};
			config.params['_'] = new Date().getTime();
		}
		Object.assign(config.headers, sysConfig.HEADERS)
		return config;
	},
	(error) => {
		return Promise.reject(error);
	}
);

//FIX 多个API同时401时疯狂弹窗BUG
let MessageBox_401_show = false

// HTTP response 拦截器
axios.interceptors.response.use(
	(response) => {
		if(response.status == 200 ) {
			const data = response.data?.data;
			var origin = response.headers['access-control-origin-key'];
			if(origin) {
				const ts = response.headers['access-control-timestamp-user'];
				try{
					response.data = JSON.parse(sm2.doDecrypt(data?.data.substring(6, data?.data.length - 4), tool.crypto.AES.decrypt(origin, ts), 0))
				}catch(err){}
			}

		}
		return response;
	},
	(error) => {
		if (error.response) {
			if (error.response.status == 404) {
				ElMessage.error(
					"远程服务器不存在"
				);
			} else if (error.response.status == 400) {
				console.error(error.response.data);
				ElMessage.error(
					error.response.data.msg || "功能不支持"
				);
			} else if (error.response.status == 500) {
				ElMessage.error(
					error.response.data.msg || "远程服务器不存在/服务器发生错误！"
				);
			} else if (error.response.status == 401 || error.response.status == 403) {
				if(error.response.data && error.response.data.code === 'B0403') {
					ElNotification.error({
						title: '请求错误',
						message: error.response.data.msg 
					});
					return false;
				}
				if(!MessageBox_401_show){
					MessageBox_401_show = true
					ElMessageBox.confirm('当前用户已被登出或无权限访问当前资源，请尝试重新登录后再操作。', '无权限访问', {
						type: 'error',
						closeOnClickModal: false,
						center: true,
						confirmButtonText: '重新登录',
						beforeClose: (action, instance, done) => {
							MessageBox_401_show = false
							done()
						}
					}).then(() => {
						router.replace({path: '/login'});
					}).catch(() => {})
				}
			} else {
				ElMessage.error(
					error.response ?  (error.response.data ? error.response.data.msg : (error.message || `Status:${error.response.status}，未知错误！`)):(error.message || `Status:${error.response.status}，未知错误！`)
				);
			}
		} else {
			ElMessage.error(
				"请求服务器无响应！"
			);
		}

		return Promise.reject(error.response);
	}
);

var http = {

	/** get 请求
	 * @param  {string} url 接口地址
	 * @param  {object} params 请求参数
	 * @param  {object} config 参数
	 */
	get: function(url, params={}, config={}) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'get',
				url: url,
				params: params,
				...config
			}).then((response) => {
				const res = response.data;
				res.headers = response.headers;
				resolve(res);
			}).catch((error) => {
				reject(error);
			})
		})
	},

	/** post 请求
	 * @param  {string} url 接口地址
	 * @param  {object} data 请求参数
	 * @param  {object} config 参数
	 */
	post: function(url, data={}, config={}) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'post',
				url: url,
				data: data,
				...config
			}).then((response) => {
				const res = response.data;
				res.headers = response.headers;
				resolve(res);
			}).catch((error) => {
				reject(error);
			})
		})
	},

	/** put 请求
	 * @param  {string} url 接口地址
	 * @param  {object} data 请求参数
	 * @param  {object} config 参数
	 */
	put: function(url, data={}, config={}) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'put',
				url: url,
				data: data,
				...config
			}).then((response) => {
				resolve(response.data);
			}).catch((error) => {
				reject(error);
			})
		})
	},

	/** patch 请求
	 * @param  {string} url 接口地址
	 * @param  {object} data 请求参数
	 * @param  {object} config 参数
	 */
	patch: function(url, data={}, config={}) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'patch',
				url: url,
				data: data,
				...config
			}).then((response) => {
				resolve(response.data);
			}).catch((error) => {
				reject(error);
			})
		})
	},

	/** delete 请求
	 * @param  {string} url 接口地址
	 * @param  {object} data 请求参数
	 * @param  {object} config 参数
	 */
	delete: function(url, data={}, config={}) {
		return new Promise((resolve, reject) => {
			axios({
				method: 'delete',
				url: url,
				data: data,
				...config
			}).then((response) => {
				resolve(response.data);
			}).catch((error) => {
				reject(error);
			})
		})
	},

	/** jsonp 请求
	 * @param  {string} url 接口地址
	 * @param  {string} name JSONP回调函数名称
	 */
	jsonp: function(url, name='jsonp'){
		return new Promise((resolve) => {
			var script = document.createElement('script')
			var _id = `jsonp${Math.ceil(Math.random() * 1000000)}`
			script.id = _id
			script.type = 'text/javascript'
			script.src = url
			window[name] =(response) => {
				resolve(response)
				document.getElementsByTagName('head')[0].removeChild(script)
				try {
					delete window[name];
				}catch(e){
					window[name] = undefined;
				}
			}
			document.getElementsByTagName('head')[0].appendChild(script)
		})
	}
}

export default http;
