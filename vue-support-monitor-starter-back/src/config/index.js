const PREFIX = '';
const DEFAULT_CONFIG = {
	SOCKET: {
		ADDRESS: `ws://172.16.2.226:31257`
	},
	PREFIX: '',
	//标题
	APP_NAME: '监控管理',
	//权限
	PERMISSIONS: PREFIX + 'PERMISSIONS',
	//拥有的布局
	DASHBOARD_GRID: PREFIX + "DASHBOARD_GRID",
	//控制台样式
	DASHBOARD_TYPE: PREFIX + "DASHBOARD_TYPE",
	//系统配置
	SYSTEM_CONFIG: PREFIX + "SYSTEM_CONFIG",
	//布局
	GRID: PREFIX + "GRID",
	//菜单
	MENU: PREFIX + 'MENU',
	//TOKEN
	TOKEN: 'x-oauth-cookie',
	//用户信息
	USER_INFO: PREFIX + 'USER_INFO',
	//登录账号
	AUTO_LOGIN: 'login-user',
	//首页地址
	DASHBOARD_URL: "/dashboard",
	//是否显示实时
	OPEN_SETTING: true,
	//版本号
	APP_VER: "0.0.9",

	//内核版本号
	CORE_VER: "0.0.9",
	//主页是否允许自定义
	openLayoutCustom: false,
	//是否传输加密
	OPEN_CODEC: "RESPONSE_CODEC_OPEN",
	//私钥
	CODEC_KEY: 'CODEC_KEY',
	//接口地址
	API_URL: "/monitor/api" ,
	//调度接口
	API_SCHEDULER:  "/scheduler/api",
	//请求超时
	TIMEOUT: 30000,

	//TokenName
	TOKEN_NAME: "Authorization",
	TOKEN_NAME2: "x-oauth-token",

	ADMIN: 'ADMIN',

	//Token前缀，注意最后有个空格，如不需要需设置空字符串
	TOKEN_PREFIX: "Bearer ",

	//追加其他头
	HEADERS: {},

	//请求是否开启缓存
	REQUEST_CACHE: false,

	//布局 默认：default | 通栏：header | 经典：menu | 功能坞：dock
	//dock将关闭标签和面包屑栏
	LAYOUT: 'header',

	//菜单是否折叠
	MENU_IS_COLLAPSE: false,

	//菜单是否启用手风琴效果
	MENU_UNIQUE_OPENED: false,

	//是否开启多标签
	LAYOUT_TAGS: true,

	//语言
	LANG: 'zh-cn',

	//主题颜色
	COLOR: '',

	//是否加密localStorage, 为空不加密，可填写AES(模式ECB,移位Pkcs7)加密
	LS_ENCRYPTION: 'AES',

	//localStorageAES加密秘钥，位数建议填写8的倍数
	LS_ENCRYPTION_key: '2XNN4K8LC0ELVWN4',

	//控制台首页默认布局
	DEFAULT_GRID: {
		//默认分栏数量和宽度 例如 [24] [18,6] [8,8,8] [6,12,6]
		layout: [12, 12],
		//小组件分布，com取值:views/home/components 文件名
		copmsList: [
			['weather', ''],
			['ver', ''],
		]
	}
}

//合并业务配置
import MY_CONFIG from "./myConfig"
Object.assign(DEFAULT_CONFIG, MY_CONFIG)

// 如果生产模式，就合并动态的APP_CONFIG
// public/config.js
if(process.env.NODE_ENV === 'production'){
	Object.assign(DEFAULT_CONFIG, APP_CONFIG)
}

export default DEFAULT_CONFIG