/*
 * @Descripttion: 工具集
 * @version: 1.2
 * @LastEditors: sakuya
 * @LastEditTime: 2022年5月24日00:28:56
 */

import CryptoJS from "crypto-js";
import sysConfig from "@/config";
const _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789';

const tool = {};

/* localStorage */
tool.data = {
	set(key, data, datetime = 0) {
		//加密
		if (sysConfig.LS_ENCRYPTION == "AES") {
			data = tool.crypto.AES.encrypt(
				JSON.stringify(data),
				sysConfig.LS_ENCRYPTION_key
			);
		}
		let cacheValue = {
			content: data,
			datetime:
				parseInt(datetime) === 0
					? 0
					: new Date().getTime() + parseInt(datetime) * 1000,
		};
		return localStorage.setItem(key, JSON.stringify(cacheValue));
	},
	get(key) {
		try {
			const value = JSON.parse(localStorage.getItem(key));
			if (value) {
				let nowTime = new Date().getTime();
				if (nowTime > value.datetime && value.datetime != 0) {
					localStorage.removeItem(key);
					return null;
				}
				//解密
				if (sysConfig.LS_ENCRYPTION == "AES") {
					value.content = JSON.parse(
						tool.crypto.AES.decrypt(
							value.content,
							sysConfig.LS_ENCRYPTION_key
						)
					);
				}
				return value.content;
			}
			return null;
		} catch (err) {
			return null;
		}
	},
	remove(key) {
		return localStorage.removeItem(key);
	},
	clear() {
		return localStorage.clear();
	},
};

/*sessionStorage*/
tool.session = {
	set(table, settings) {
		var _set = JSON.stringify(settings);
		return sessionStorage.setItem(table, _set);
	},
	get(table) {
		var data = sessionStorage.getItem(table);
		try {
			data = JSON.parse(data);
		} catch (err) {
			return null;
		}
		return data;
	},
	remove(table) {
		return sessionStorage.removeItem(table);
	},
	clear() {
		return sessionStorage.clear();
	},
};

/*cookie*/
tool.cookie = {
	set(name, value, config = {}) {
		var cfg = {
			expires: null,
			path: null,
			domain: null,
			secure: false,
			httpOnly: false,
			...config,
		};
		var cookieStr = `${name}=${escape(value)}`;
		if (cfg.expires) {
			var exp = new Date();
			exp.setTime(exp.getTime() + parseInt(cfg.expires) * 1000);
			cookieStr += `;expires=${exp.toGMTString()}`;
		}
		if (cfg.path) {
			cookieStr += `;path=${cfg.path}`;
		}
		if (cfg.domain) {
			cookieStr += `;domain=${cfg.domain}`;
		}
		document.cookie = cookieStr;
	},
	get(name) {
		var arr = document.cookie.match(
			new RegExp("(^| )" + name + "=([^;]*)(;|$)")
		);
		if (arr != null) {
			return unescape(arr[2]);
		} else {
			return null;
		}
	},
	remove(name) {
		var exp = new Date();
		exp.setTime(exp.getTime() - 1);
		document.cookie = `${name}=;expires=${exp.toGMTString()}`;
	},
};

/* Fullscreen */
tool.screen = function (element) {
	var isFull = !!(
		document.webkitIsFullScreen ||
		document.mozFullScreen ||
		document.msFullscreenElement ||
		document.fullscreenElement
	);
	if (isFull) {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.msExitFullscreen) {
			document.msExitFullscreen();
		} else if (document.mozCancelFullScreen) {
			document.mozCancelFullScreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	} else {
		if (element.requestFullscreen) {
			element.requestFullscreen();
		} else if (element.msRequestFullscreen) {
			element.msRequestFullscreen();
		} else if (element.mozRequestFullScreen) {
			element.mozRequestFullScreen();
		} else if (element.webkitRequestFullscreen) {
			element.webkitRequestFullscreen();
		}
	}
};

/* 复制对象 */
tool.objCopy = function (obj) {
	return JSON.parse(JSON.stringify(obj));
};

/**日期 */
tool.date = {
	/** transfer time */
	transferTime(milliseconds = 0, type) {
		// get duration
		const getDurations = (milliseconds) => {
		  // days
		  const days = milliseconds / 1000 / 60 / 60 / 24
		  const daysRound = Math.floor(days)
		  const daysStr = `${daysRound > 0 ? `${daysRound}天` : ''}`
		  // hours
		  const hours = milliseconds / 1000 / 60 / 60 - (24 * daysRound)
		  const hoursRound = Math.floor(hours)
		  const hoursStr = `${hoursRound > 0 ? `${hoursRound}时` : ''}`
		  // minutes
		  const minutes = milliseconds / 1000 / 60 - (24 * 60 * daysRound) - (60 * hoursRound)
		  const minutesRound = Math.floor(minutes)
		  const minutesStr = `${minutesRound > 0 ? `${minutesRound}分` : ''}`
		  // seconds
		  const seconds = milliseconds / 1000 - (24 * 60 * 60 * daysRound) - (60 * 60 * hoursRound) - (60 * minutesRound)
		  const secondsRound = Math.floor(seconds)
		  const secondsStr = `${secondsRound > 0 ? `${secondsRound}秒` : ''}`
		  // ms
		  const ms = milliseconds - (24 * 60 * 60 * 1000 * daysRound) - (60 * 60 * 1000 * hoursRound) - (60 * 1000 * minutesRound) - (secondsRound * 1000)
		  const msStr = `${ms > 0 ? `${ms}毫秒` : ''}`
	
		  const str = `${daysStr}${hoursStr}${minutesStr}${secondsStr}${msStr}`
		  return str
		}
	
		// get date
		const getDate = (milliseconds) => {
		  let date = new Date(milliseconds/1);
		  // year
		  const year = date.getFullYear()
		  // month
		  let month = date.getMonth() + 1;
		  month = (month < 10 ? '0' + month : month);
		  // day
		  let day = date.getDate();
		  day = (day < 10 ? '0' + day : day);
		  // hour
		  let hours = date.getHours();
		  hours = (hours < 10 ? '0' + hours : hours);
		  // minutes
		  let minutes = date.getMinutes();
		  minutes = (minutes < 10 ? '0' + minutes : minutes);
		  // seconds
		  let seconds = date.getSeconds();
		  seconds = (seconds < 10 ? '0' + seconds : seconds);
	
		  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
		}
	
		if (type === 'duration') {
		  return getDurations(milliseconds)
		}
		if (type === 'date') {
		  return getDate(milliseconds)
		}
	  },
	
	//获得本周周一~周日的年月日
	getThisWeekData: function () {
		var thisweek = {};
		var date = new Date();
		// 本周一的日期
		date.setDate(date.getDate() - date.getDay() + 1);
		thisweek.start_day =
			date.getFullYear() +
			"-" +
			(date.getMonth() + 1) +
			"-" +
			date.getDate();

		// 本周日的日期
		date.setDate(date.getDate() + 6);
		thisweek.end_day =
			date.getFullYear() +
			"-" +
			(date.getMonth() + 1) +
			"-" +
			date.getDate();
		return thisweek;
	},
	//获得上周周一~周日的年月日
	getLastWeekData: function () {
		var lastweek = {};
		var date = new Date();
		// 上周一的日期
		date.setDate(date.getDate() - 7 - date.getDay() + 1);
		lastweek.start_day =
			date.getFullYear() +
			"-" +
			(date.getMonth() + 1) +
			"-" +
			date.getDate();

		// 上周日的日期
		date.setDate(date.getDate() + 6);
		lastweek.end_day =
			date.getFullYear() +
			"-" +
			(date.getMonth() + 1) +
			"-" +
			date.getDate();
		return lastweek;
	},
	/**
	 * 获取日期范围
	 */
	getDateRang: function (val,  fmt = "yyyy-MM-dd hh:mm:ss") {
		const now = new Date(); // 当前日期
		const nowDayOfWeek = now.getDay(); // 今天本周的第几天
		const nowDay = now.getDate(); // 当前日
		const nowMonth = now.getMonth(); // 当前月
		const nowYear = now.getFullYear(); // 当前年
		const jd = Math.ceil((nowMonth + 1) / 3);
		let startTime;
		let endTime;
		let customTime = [];
		switch (val) {
			case "today": // 今天
				startTime = new Date(nowYear, nowMonth, nowDay, 0, 0, 0);
				endTime = new Date(nowYear, nowMonth, nowDay, 23 ,59 ,59);
				break;
			case "yesterday": // 昨日
				startTime = new Date(nowYear, nowMonth, nowDay - 1);
				endTime = new Date(nowYear, nowMonth, nowDay - 1);
				break;
			case "week": // 本周
				startTime = new Date(nowYear, nowMonth, nowDay - nowDayOfWeek);
				endTime = new Date(
					nowYear,
					nowMonth,
					nowDay + 6 - nowDayOfWeek
				);
				break;
			case "pastWeek": // 近 7 日
				startTime = new Date(nowYear, nowMonth, nowDay - 6);
				endTime = new Date(nowYear, nowMonth, nowDay);
				break;
			case "month": // 本月
				startTime = new Date(nowYear, nowMonth, 1);
				endTime = new Date(nowYear, nowMonth + 1, 0);
				break;
			case "pastMonth": // 近 31 日
				startTime = new Date(nowYear, nowMonth, nowDay - 30);
				endTime = new Date(nowYear, nowMonth, nowDay);
				break;
			case "quarter": // 本季度
				startTime = new Date(nowYear, (jd - 1) * 3, 1);
				endTime = new Date(nowYear, jd * 3, 0);
				break;
			case "year": // 今年
				startTime = new Date(nowYear, 0, 1);
				endTime = new Date(nowYear, 11, 31);
				break;
			default: // 自定义时间
				customTime = val.split(" - ");
				break;
		}
		return customTime.length
			? customTime
			: [tool.dateFormat(startTime, fmt), tool.dateFormat(endTime, fmt)];
	},
	dateFormat(date,  fmt = "yyyy-MM-dd hh:mm:ss") {
		return tool.dateFormat(date, fmt);
	}
};
/**大小格式化 */
tool.sizeFormat = function(fileSizeInBytes) {
	const sizeUnit = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
	const sizeType = parseInt(
		Math.floor(Math.log(fileSizeInBytes) / Math.log(1024)).toString(),
	  );
	  console.log('sizeType', sizeType);
	  const size = (fileSizeInBytes / Math.pow(1024, sizeType)).toFixed(2);
	  return size + sizeUnit[sizeType];
}
/* 日期格式化 */
tool.dateFormat = function (date, fmt = "yyyy-MM-dd hh:mm:ss") {
	date = new Date(date);
	var o = {
		"M+": date.getMonth() + 1, //月份
		"d+": date.getDate(), //日
		"h+": date.getHours(), //小时
		"m+": date.getMinutes(), //分
		"s+": date.getSeconds(), //秒
		"q+": Math.floor((date.getMonth() + 3) / 3), //季度
		S: date.getMilliseconds(), //毫秒
	};
	if (/(y+)/.test(fmt)) {
		fmt = fmt.replace(
			RegExp.$1,
			(date.getFullYear() + "").substr(4 - RegExp.$1.length)
		);
	}
	for (var k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(
				RegExp.$1,
				RegExp.$1.length == 1
					? o[k]
					: ("00" + o[k]).substr(("" + o[k]).length)
			);
		}
	}
	return fmt;
};

/* 千分符 */
tool.groupSeparator = function (num) {
	num = num + "";
	if (!num.includes(".")) {
		num += ".";
	}
	return num
		.replace(/(\d)(?=(\d{3})+\.)/g, function ($0, $1) {
			return $1 + ",";
		})
		.replace(/\.$/, "");
};
/**字符串 */
tool.string = {
	/**
	 * 随机生成GUID
	 */
	guid() {
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
			var r = Math.random() * 16 | 0,
				v = c === 'x' ? r : (r & 0x3 | 0x8);
			return v.toString(16);
		});
	},
	/**
	 * 随机生成索引
	 * @param min 最小值
	 * @param max 最大值
	 * @param i 当前获取位置
	 */
	randomIndex: function (min, max, i) {
		let index = Math.floor(Math.random() * (max - min + 1) + min),
			numStart = _charStr.length - 10;
		//如果字符串第一位是数字，则递归重新获取
		if (i == 0 && index >= numStart) {
			index = this.randomIndex(min, max, i);
		}
		//返回最终索引值
		return index;
	},

	/**
	 * 随机生成字符串
	 * @param len 指定生成字符串长度
	 */
	getRandomString: function (len) {
		let min = 0, max = _charStr.length - 1, _str = '';
		//判断是否指定长度，否则默认长度为15
		len = len || 15;
		//循环生成字符串
		for (var i = 0, index; i < len; i++) {
			index = this.randomIndex(min, max, i);
			_str += _charStr[index];
		}
		return _str;
	}
}
tool.url = {
	async imgUrlToFile(url){
		return new Promise((resolve, reject) => {
		  var blob = null;
		  let imgFile = null;
		  var xhr = new XMLHttpRequest();
		  xhr.open("GET", url);
		  xhr.setRequestHeader("Accept", "image/jpeg");
		  xhr.responseType = "blob";
		  xhr.onload = () => {
			blob = xhr.response;
			imgFile = new File([blob], "imageName", { type: "image/jpeg" });
			resolve(imgFile);
		  };
	   
		  xhr.onerror = e => {
			reject(e);
		  };
		  xhr.send();
		});
	  }
}
/* 常用加解密 */
tool.crypto = {
	//MD5加密
	MD5(data) {
		return CryptoJS.MD5(data).toString();
	},
	//BASE64加解密
	BASE64: {
		encrypt(data) {
			return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(data));
		},
		decrypt(cipher) {
			return CryptoJS.enc.Base64.parse(cipher).toString(
				CryptoJS.enc.Utf8
			);
		},
	},
	//AES加解密
	AES: {
		encrypt(data, secretKey, config = {}) {
			if (secretKey.length % 8 != 0) {
				console.warn(
					"[SCUI error]: 秘钥长度需为8的倍数，否则解密将会失败。"
				);
			}
			const result = CryptoJS.AES.encrypt(
				data,
				CryptoJS.enc.Utf8.parse(secretKey),
				{
					iv: CryptoJS.enc.Utf8.parse(config.iv || ""),
					mode: CryptoJS.mode[config.mode || "ECB"],
					padding: CryptoJS.pad[config.padding || "Pkcs7"],
				}
			);
			return result.toString();
		},
		decrypt(cipher, secretKey, config = {}) {
			const result = CryptoJS.AES.decrypt(
				cipher,
				CryptoJS.enc.Utf8.parse(secretKey),
				{
					iv: CryptoJS.enc.Utf8.parse(config.iv || ""),
					mode: CryptoJS.mode[config.mode || "ECB"],
					padding: CryptoJS.pad[config.padding || "Pkcs7"],
				}
			);
			return CryptoJS.enc.Utf8.stringify(result);
		},
	},
};

export default tool;
