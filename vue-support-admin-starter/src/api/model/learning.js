import config from "@/config"
import http from "@/utils/request"

export default {
	gan: {
		url: `${config.API_LEARNING}/v1/gan`,
		name: "Gan生成图片",
		get: async function(data, config={
			responseType: "arraybuffer",
		}){
			config.timeout = 180000;
			return await http.get(this.url, data, config);
		}
	},
	compare: {
		face: {
			url: `${config.API_LEARNING}/v1/compare/face`,
			name: "人脸1:1",
			post: async function(data, config={
				Headers: {
					'ContentType': 'multipart/form-data'
				}
			}){
				config.timeout = 180000;
				return await http.post(this.url, data, config);
			}
		},
		faceN: {
			url: `${config.API_LEARNING}/v1/compare/faceN`,
			name: "人脸1:N",
			post: async function(data, config={
				Headers: {
					'ContentType': 'multipart/form-data'
				}
			}){
				config.timeout = 180000;
				return await http.post(this.url, data, config);
			}
		},
		image: {
			url: `${config.API_LEARNING}/v1/compare/image`,
			name: "图片1:1",
			post: async function(data, config={
				Headers: {
					'ContentType': 'multipart/form-data'
				}
			}){
				config.timeout = 180000;
				return await http.post(this.url, data, config);
			}
		},
	},
	ocr: {
        url: `${config.API_LEARNING}/v1/ocr`,
		name: "OCR",
		post: async function(data, config={
			Headers: {
				'ContentType': 'multipart/form-data'
			}
		}){
			config.timeout = 180000;
			return await http.post(this.url, data, config);
		}
	},
	detection: {
		face: {
			url: `${config.API_LEARNING}/v1/face/detection`,
			name: "人脸检测",
			post: async function(data, config={
				Headers: {
					'ContentType': 'multipart/form-data'
				}
			}){
				config.timeout = 180000;
				return await http.post(this.url, data, config);
			}
		},
	},
	doc: {
		createMapping: {
			url: `${config.API_LEARNING}/v1/reg/doc/createMapping`,
			name: "创建索引",
			create: async function(data, config={
			}){
				config.timeout = 180000;
				return await http.post(this.url, data, config);
			}
		},
	},
	reg: {
		FACE:{
			page: {
				url: `${config.API_LEARNING}/v1/reg/face/list`,
				name: "人脸底库查询",
				get: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
			delete: {
				url: `${config.API_LEARNING}/v1/reg/face/delete`,
				name: "人脸底库刪除",
				get: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.get(this.url, data, config);
				}
			},
			image: {
				url: `${config.API_LEARNING}/v1/reg/face/image`,
				name: "人脸底库查询",
				get: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
			library: {
				url: `${config.API_LEARNING}/v1/reg/face/library`,
				name: "人脸底库上传",
				post: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
			libraryFile: {
				url: `${config.API_LEARNING}/v1/reg/face/libraryFile`,
				name: "人脸底库上传",
				post: async function(data, config={
					Headers: {
						'ContentType': 'multipart/form-data'
					}
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
		},
		IMAGE:{
			image: {
				url: `${config.API_LEARNING}/v1/reg/image/image`,
				name: "人脸底库查询",
				get: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
			page: {
				url: `${config.API_LEARNING}/v1/reg/image/list`,
				name: "图像底库查询",
				get: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
			delete: {
				url: `${config.API_LEARNING}/v1/reg/image/delete`,
				name: "图像底库刪除",
				get: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.get(this.url, data, config);
				}
			},
			library: {
				url: `${config.API_LEARNING}/v1/reg/image/library`,
				name: "人脸底库上传",
				post: async function(data, config={
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
			libraryFile: {
				url: `${config.API_LEARNING}/v1/reg/image/libraryFile`,
				name: "图像底库上传",
				post: async function(data, config={
					Headers: {
						'ContentType': 'multipart/form-data'
					}
				}){
					config.timeout = 180000;
					return await http.post(this.url, data, config);
				}
			},
		}
		
	}
	
}