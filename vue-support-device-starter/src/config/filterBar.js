export default {
	//运算符
	operator: [
		{
			label: '等于',
			value: 'eq',
		},
		{
			label: '不等于',
			value: 'ne',
		},
		{
			label: '大于',
			value: 'gt',
		},
		{
			label: '大于等于',
			value: 'ge',
		},
		{
			label: '小于',
			value: 'lt',
		},
		{
			label: '小于等于',
			value: 'le',
		},
		{
			label: '在列表',
			value: 'in',
		},
		{
			label: '不在列表',
			value: 'notin',
		},
		{
			label: '模糊',
			value: 'like',
		},
		{
			label: '范围',
			value: 'range',
		}
		,
		{
			label: '升序',
			value: 'asc',
		}
		,
		{
			label: '降序',
			value: 'desc',
		}
	],
	//过滤结果运算符的分隔符
	separator: '|',
	//获取我的常用
	getMy: function (name) {
		return new Promise((resolve) => {
			console.log(`这里可以根据${name}参数请求接口`)
			var list = []
			setTimeout(()=>{
				resolve(list)
			},500)
		})
	},
	/**
	 * 常用保存处理 返回resolve后继续操作
	 * @name scFilterBar组件的props->filterName
	 * @obj 过滤项整理好的对象
	 */
	saveMy: function (name, obj) {
		return new Promise((resolve) => {
			console.log(name, obj)
			setTimeout(()=>{
				resolve(true)
			},500)
		})
	},
	/**
	 * 常用删除处理 返回resolve后继续操作
	 * @name scFilterBar组件的props->filterName
	 */
	delMy: function (name) {
		return new Promise((resolve) => {
			console.log(name)
			setTimeout(()=>{
				resolve(true)
			},500)
		})
	}
}
