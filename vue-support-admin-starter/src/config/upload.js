import API from "@/api";

//上传配置

export default {
	apiObj: API.common.upload,			//上传请求API对象
	filename: "file",					//form请求时文件的key
	successCode: '00000',					//请求完成代码
	maxSize: 10,						//最大文件大小 默认10MB
	parseData: function (res) {
		return {
			code: res.code,				//分析状态字段结构
			fileName: res.data ? res.data[0]?.name: null,//分析文件名称
			src: res.data ? res.data[0]?.remote : null,			//分析图片远程地址结构
			msg: res.message || res.msg,			//分析描述字段结构
			data: res.data
		}
	},
	apiObjFile: API.common.uploadFile,	//附件上传请求API对象
	maxSizeFile: 10						//最大文件大小 默认10MB
}
