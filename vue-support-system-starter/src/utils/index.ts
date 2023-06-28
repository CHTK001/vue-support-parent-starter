/**
 * Check if an element has a class
 * @param {HTMLElement} ele
 * @param {string} cls
 * @returns {boolean}
 */
export function hasClass(ele: HTMLElement, cls: string) {
  return !!ele.className.match(new RegExp("(\\s|^)" + cls + "(\\s|$)"));
}

/**
 * 合并对象
 * @param obj 对象
 */
export function assign(...obj: any[]) {
	let rs: any = {};
	for (const element of obj) {
		for (const ownPropertyName of Object.getOwnPropertyNames(element)) {
			let element1 = element[ownPropertyName];
			if(element1) {
				rs[ownPropertyName] = element1;
			}
		}
	}
	return rs;
}
/**
 * Add class to element
 * @param {HTMLElement} ele
 * @param {string} cls
 */
export function addClass(ele: HTMLElement, cls: string) {
  if (!hasClass(ele, cls)) ele.className += " " + cls;
}

/**
 * Remove class from element
 * @param {HTMLElement} ele
 * @param {string} cls
 */
export function removeClass(ele: HTMLElement, cls: string) {
  if (hasClass(ele, cls)) {
    const reg = new RegExp("(\\s|^)" + cls + "(\\s|$)");
    ele.className = ele.className.replace(reg, " ");
  }
}

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path: string) {
	return /^(https?:|http?:|mailto:|tel:)/.test(path);
}

export function formatDateTime(value: any, fmt: string = "yyyy-MM-dd") {
	if (value == "" || !value) {
		return "";
	}
	let date = new Date(value);
	let o: any = {
		"M+" : date.getMonth()+1,     //月份
		"d+" : date.getDate(),     //日
		"h+" : date.getHours(),     //小时
		"m+" : date.getMinutes(),     //分
		"s+" : date.getSeconds(),     //秒
		"q+" : Math.floor((date.getMonth()+3)/3), //季度
		"S" : date.getMilliseconds()    //毫秒
	};
	if(/(y+)/.test(fmt)) {
		fmt=fmt.replace(RegExp.$1, (date.getFullYear()+"").substr(4 - RegExp.$1.length));
	}
	for(let k in o) {
		if (new RegExp("(" + k + ")").test(fmt)) {
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
		}
	}
	return fmt;
}
